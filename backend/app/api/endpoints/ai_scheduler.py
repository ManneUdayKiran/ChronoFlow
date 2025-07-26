from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from app.models.user import User
from app.models.task import Task, TaskPriority
from app.models.scheduled_task import ScheduledTask, ScheduleStatus
from app.models.user_preferences import UserPreferences
from app.schemas.scheduling import (
    SchedulingRequest,
    SchedulingResponse,
    ScheduledTaskResult,
    ReschedulingRequest,
    TaskForScheduling,
    UserSchedulingPreferences,
    SchedulingAnalytics,
    TaskStatusUpdateRequest
)
from app.services.ai_scheduling_service import ai_scheduling_service
from app.services.auth import get_current_user
import json


router = APIRouter()


@router.post("/schedule-tasks", response_model=SchedulingResponse)
async def schedule_tasks(
    date_range_start: datetime,
    date_range_end: datetime,
    task_ids: Optional[List[str]] = None,
    include_google_calendar: bool = True,
    force_reschedule: bool = False,
    current_user: User = Depends(get_current_user)
):
    """
    🧠 AI-Powered Task Scheduler
    
    Automatically schedules your tasks based on:
    - Available time slots from Google Calendar
    - Task priorities, deadlines, and estimated time
    - Your personal productivity patterns
    - Work preferences (morning person, peak hours, etc.)
    """
    try:
        # Get user's tasks to schedule
        if task_ids:
            # Schedule specific tasks
            tasks_query = Task.find({
                "user_id": str(current_user.id),
                "id": {"$in": task_ids},
                "status": {"$in": ["todo", "in_progress"]}
            })
        else:
            # Schedule all pending tasks with deadlines in the date range
            tasks_query = Task.find({
                "user_id": str(current_user.id),
                "status": {"$in": ["todo", "in_progress"]},
                "deadline": {"$gte": date_range_start, "$lte": date_range_end}
            })
        
        user_tasks = await tasks_query.to_list()
        
        if not user_tasks:
            return SchedulingResponse(
                success=True,
                scheduled_tasks=[],
                scheduling_summary="No tasks found to schedule",
                recommendations=["Add some tasks with deadlines to get started with AI scheduling"]
            )
        
        # Convert tasks to scheduling format
        tasks_for_scheduling = []
        for task in user_tasks:
            tasks_for_scheduling.append(TaskForScheduling(
                task_id=str(task.id),
                title=task.title,
                description=task.description,
                priority=task.priority.value,
                deadline=task.deadline,
                estimated_time_minutes=task.estimated_time_minutes or 30,
                tags=task.tags,
                requires_focus=task.priority in [TaskPriority.HIGH, TaskPriority.URGENT],
                can_be_split=bool(task.estimated_time_minutes and task.estimated_time_minutes > 60),
                dependencies=[]  # TODO: Add task dependencies in future
            ))
        
        # Create scheduling request
        scheduling_request = SchedulingRequest(
            user_id=str(current_user.id),
            tasks=tasks_for_scheduling,
            date_range_start=date_range_start,
            date_range_end=date_range_end,
            include_google_calendar=include_google_calendar,
            force_reschedule=force_reschedule
        )
        
        # TODO: Get user's Google Calendar access token from auth service
        user_access_token = None  # Will implement OAuth2 flow later
        
        # Schedule tasks using AI
        result = await ai_scheduling_service.schedule_tasks(
            request=scheduling_request,
            user_access_token=user_access_token
        )
        
        return result
        
    except Exception as e:
        import traceback
        print(f"Error in schedule_tasks: {str(e)}")
        print(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to schedule tasks: {str(e)}"
        )


@router.get("/scheduled-tasks", response_model=List[ScheduledTaskResult])
async def get_scheduled_tasks(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    status_filter: Optional[ScheduleStatus] = None,
    current_user: User = Depends(get_current_user)
):
    """Get user's scheduled tasks for a date range"""
    
    # Default to current week if no dates provided
    if not start_date:
        start_date = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    if not end_date:
        end_date = start_date + timedelta(days=7)
    
    query = {
        "user_id": str(current_user.id),
        "scheduled_start": {"$gte": start_date, "$lte": end_date}
    }
    
    if status_filter:
        query["status"] = status_filter
    
    scheduled_tasks = await ScheduledTask.find(query).to_list()
    
    # Convert MongoDB documents to response schema
    result = []
    for task in scheduled_tasks:
        result.append(ScheduledTaskResult(
            task_id=str(task.id),  # Convert ObjectId to string
            title=task.title,
            scheduled_start=task.scheduled_start,
            scheduled_end=task.scheduled_end,
            duration_minutes=task.duration_minutes,
            confidence_score=getattr(task, 'confidence_score', 0.8),  # Default confidence if not set
            reasoning=getattr(task, 'reasoning', f"Scheduled {task.title} for optimal productivity"),
            calendar_event_id=getattr(task, 'calendar_event_id', None)
        ))
    
    return result


@router.put("/scheduled-tasks/{task_id}/reschedule")
async def reschedule_task(
    task_id: str,
    new_start_time: datetime,
    reason: str = "User requested",
    current_user: User = Depends(get_current_user)
):
    """Reschedule a specific task to a new time"""
    
    # Verify task belongs to user
    scheduled_task = await ScheduledTask.find_one({
        "id": task_id,
        "user_id": str(current_user.id)
    })
    
    if not scheduled_task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Scheduled task not found"
        )
    
    # TODO: Get user's access token for calendar updates
    user_access_token = None
    
    success = await ai_scheduling_service.reschedule_task(
        scheduled_task_id=task_id,
        new_start_time=new_start_time,
        user_access_token=user_access_token
    )
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to reschedule task"
        )
    
    return {"message": "Task rescheduled successfully"}


@router.put("/scheduled-tasks/{task_id}/status")
async def update_task_status(
    task_id: str,
    request: TaskStatusUpdateRequest,
    current_user: User = Depends(get_current_user)
):
    """Update the status of a scheduled task (start, complete, skip, etc.)"""
    
    # Validate the status
    try:
        new_status = ScheduleStatus(request.new_status)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid status: {request.new_status}. Must be one of: {[s.value for s in ScheduleStatus]}"
        )
    
    scheduled_task = await ScheduledTask.find_one({
        "id": task_id,
        "user_id": str(current_user.id)
    })
    
    if not scheduled_task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Scheduled task not found"
        )
    
    # Update the scheduled task
    scheduled_task.status = new_status
    scheduled_task.updated_at = datetime.utcnow()
    
    if new_status == ScheduleStatus.IN_PROGRESS and request.actual_start:
        scheduled_task.actual_start = request.actual_start
    elif new_status == ScheduleStatus.COMPLETED and request.actual_end:
        scheduled_task.actual_end = request.actual_end
        if scheduled_task.actual_start:
            duration = (request.actual_end - scheduled_task.actual_start).total_seconds() / 60
            scheduled_task.actual_duration_minutes = int(duration)
    
    await scheduled_task.save()
    
    # Also update the original task if completed
    if new_status == ScheduleStatus.COMPLETED:
        original_task = await Task.get(scheduled_task.task_id)
        if original_task:
            original_task.status = "completed"
            original_task.completed_at = request.actual_end or datetime.utcnow()
            if scheduled_task.actual_duration_minutes:
                original_task.actual_time_minutes = scheduled_task.actual_duration_minutes
            await original_task.save()
    
    return {"message": "Task status updated successfully"}


@router.get("/preferences", response_model=UserSchedulingPreferences)
async def get_user_preferences(current_user: User = Depends(get_current_user)):
    """Get user's scheduling preferences"""
    
    prefs = await UserPreferences.find_one({"user_id": str(current_user.id)})
    
    if not prefs:
        # Create default preferences
        prefs = UserPreferences(user_id=str(current_user.id))
        await prefs.save()
    
    return UserSchedulingPreferences(
        work_start_time=prefs.work_start_time,
        work_end_time=prefs.work_end_time,
        work_style=prefs.work_style.value,
        peak_hours_start=prefs.peak_hours_start,
        peak_hours_end=prefs.peak_hours_end,
        buffer_time_minutes=prefs.buffer_time_minutes,
        prefer_morning_for_hard_tasks=prefs.prefer_morning_for_hard_tasks,
        avoid_scheduling_after=prefs.avoid_scheduling_after,
        minimum_focus_block_minutes=prefs.minimum_focus_block_minutes,
        maximum_focus_block_minutes=prefs.maximum_focus_block_minutes
    )


@router.put("/preferences")
async def update_user_preferences(
    preferences: UserSchedulingPreferences,
    current_user: User = Depends(get_current_user)
):
    """Update user's scheduling preferences"""
    
    prefs = await UserPreferences.find_one({"user_id": str(current_user.id)})
    
    if not prefs:
        prefs = UserPreferences(user_id=str(current_user.id))
    
    # Update preferences
    prefs.work_start_time = preferences.work_start_time
    prefs.work_end_time = preferences.work_end_time
    prefs.work_style = preferences.work_style
    prefs.peak_hours_start = preferences.peak_hours_start
    prefs.peak_hours_end = preferences.peak_hours_end
    prefs.buffer_time_minutes = preferences.buffer_time_minutes
    prefs.prefer_morning_for_hard_tasks = preferences.prefer_morning_for_hard_tasks
    prefs.avoid_scheduling_after = preferences.avoid_scheduling_after
    prefs.minimum_focus_block_minutes = preferences.minimum_focus_block_minutes
    prefs.maximum_focus_block_minutes = preferences.maximum_focus_block_minutes
    
    await prefs.save()
    
    return {"message": "Preferences updated successfully"}


@router.get("/analytics", response_model=SchedulingAnalytics)
async def get_scheduling_analytics(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    current_user: User = Depends(get_current_user)
):
    """Get analytics on scheduling accuracy and productivity patterns"""
    
    if not start_date:
        start_date = datetime.now() - timedelta(days=30)  # Last 30 days
    if not end_date:
        end_date = datetime.now()
    
    # Get completed scheduled tasks in date range
    completed_tasks = await ScheduledTask.find({
        "user_id": str(current_user.id),
        "status": ScheduleStatus.COMPLETED,
        "scheduled_start": {"$gte": start_date, "$lte": end_date}
    }).to_list()
    
    # Get all scheduled tasks for completion rate
    all_scheduled = await ScheduledTask.find({
        "user_id": str(current_user.id),
        "scheduled_start": {"$gte": start_date, "$lte": end_date}
    }).to_list()
    
    if not all_scheduled:
        return SchedulingAnalytics(
            user_id=str(current_user.id),
            date=datetime.now(),
            total_tasks_scheduled=0,
            total_time_scheduled_minutes=0,
            completion_rate=0.0,
            average_task_duration_minutes=0.0,
            scheduling_accuracy_score=0.0
        )
    
    # Calculate metrics
    total_scheduled = len(all_scheduled)
    total_completed = len(completed_tasks)
    completion_rate = total_completed / total_scheduled if total_scheduled > 0 else 0
    
    total_time = sum(task.duration_minutes for task in all_scheduled)
    avg_duration = total_time / total_scheduled if total_scheduled > 0 else 0
    
    # Find most productive hours
    hour_productivity = {}
    for task in completed_tasks:
        hour = task.scheduled_start.hour
        if hour not in hour_productivity:
            hour_productivity[hour] = 0
        hour_productivity[hour] += 1
    
    peak_hour = max(hour_productivity.keys()) if hour_productivity else None
    
    # Calculate scheduling accuracy (how close actual vs estimated time)
    accuracy_scores = []
    for task in completed_tasks:
        if task.actual_duration_minutes and task.duration_minutes:
            estimated = task.duration_minutes
            actual = task.actual_duration_minutes
            accuracy = 1 - abs(estimated - actual) / max(estimated, actual)
            accuracy_scores.append(max(0, accuracy))
    
    avg_accuracy = sum(accuracy_scores) / len(accuracy_scores) if accuracy_scores else 0
    
    return SchedulingAnalytics(
        user_id=str(current_user.id),
        date=datetime.now(),
        total_tasks_scheduled=total_scheduled,
        total_time_scheduled_minutes=total_time,
        completion_rate=completion_rate,
        average_task_duration_minutes=avg_duration,
        peak_productivity_hour=peak_hour,
        most_productive_time_slots=[f"{h}:00" for h in sorted(hour_productivity.keys(), key=lambda x: hour_productivity[x], reverse=True)[:3]],
        scheduling_accuracy_score=avg_accuracy
    )
