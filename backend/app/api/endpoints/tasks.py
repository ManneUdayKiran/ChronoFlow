from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional
from datetime import datetime, timedelta
from app.models.user import User
from app.models.task import Task, TaskStatus, TaskPriority
from app.schemas.task import TaskCreate, TaskUpdate, TaskResponse, TaskStats
from app.services.auth import get_current_user

router = APIRouter()


@router.post("", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
async def create_task(task: TaskCreate, current_user: User = Depends(get_current_user)):
    """Create a new task"""
    if current_user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )
    
    # Create new task
    new_task = Task(
        **task.dict(),
        user_id=str(current_user.id),
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    
    await new_task.insert()
    
    return TaskResponse(
        id=str(new_task.id),
        user_id=str(new_task.user_id),
        title=new_task.title,
        description=new_task.description,
        status=new_task.status,
        priority=new_task.priority,
        deadline=new_task.deadline,
        estimated_time_minutes=new_task.estimated_time_minutes,
        actual_time_minutes=new_task.actual_time_minutes,
        tags=new_task.tags,
        created_at=new_task.created_at,
        updated_at=new_task.updated_at,
        completed_at=new_task.completed_at,
        recurring=new_task.recurring,
        recurring_pattern=new_task.recurring_pattern,
        parent_task_id=new_task.parent_task_id,
        ai_generated=new_task.ai_generated,
        ai_suggestions=new_task.ai_suggestions
    )


@router.get("", response_model=List[TaskResponse])
async def get_tasks(
    status: Optional[TaskStatus] = None,
    priority: Optional[TaskPriority] = None,
    tag: Optional[str] = None,
    from_date: Optional[datetime] = None,
    to_date: Optional[datetime] = None,
    limit: int = Query(50, ge=1, le=100),
    skip: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user)
):
    """Get user tasks with optional filtering"""
    if current_user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )
    
    # Build query
    query = {"user_id": str(current_user.id)}
    
    if status:
        query["status"] = status
    
    if priority:
        query["priority"] = priority
    
    if tag:
        query["tags"] = {"$in": [tag]}
    
    date_query = {}
    if from_date:
        date_query["$gte"] = from_date
    
    if to_date:
        date_query["$lte"] = to_date
    
    if date_query:
        query["deadline"] = date_query
    
    # Execute query
    tasks = await Task.find(query).sort([("created_at", -1)]).skip(skip).limit(limit).to_list()
    
    return [
        TaskResponse(
            id=str(task.id),
            user_id=str(task.user_id),
            title=task.title,
            description=task.description,
            status=task.status,
            priority=task.priority,
            deadline=task.deadline,
            estimated_time_minutes=task.estimated_time_minutes,
            actual_time_minutes=task.actual_time_minutes,
            tags=task.tags,
            created_at=task.created_at,
            updated_at=task.updated_at,
            completed_at=task.completed_at,
            recurring=task.recurring,
            recurring_pattern=task.recurring_pattern,
            parent_task_id=task.parent_task_id,
            ai_generated=task.ai_generated,
            ai_suggestions=task.ai_suggestions
        ) for task in tasks
    ]


@router.get("/stats", response_model=TaskStats)
async def get_task_stats(current_user: User = Depends(get_current_user)):
    """Get task statistics for the current user"""
    if current_user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )
    
    user_id = str(current_user.id)
    now = datetime.utcnow()
    
    # Get total tasks
    total_tasks = await Task.find({"user_id": user_id}).count()
    
    # Get completed tasks
    completed_tasks = await Task.find({"user_id": user_id, "status": TaskStatus.COMPLETED}).count()
    
    # Get overdue tasks
    overdue_tasks = await Task.find({
        "user_id": user_id,
        "status": {"$ne": TaskStatus.COMPLETED},
        "deadline": {"$lt": now}
    }).count()
    
    # Get upcoming tasks (due in the next 7 days)
    upcoming_tasks = await Task.find({
        "user_id": user_id,
        "status": {"$ne": TaskStatus.COMPLETED},
        "deadline": {"$gte": now, "$lte": now + timedelta(days=7)}
    }).count()
    
    # Calculate completion rate
    completion_rate = (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0
    
    # Get average completion time
    completed_tasks_with_time = await Task.find({
        "user_id": user_id,
        "status": TaskStatus.COMPLETED,
        "actual_time_minutes": {"$ne": None}
    }).to_list()
    
    average_completion_time = None
    if completed_tasks_with_time:
        total_time = sum(task.actual_time_minutes for task in completed_tasks_with_time)
        average_completion_time = total_time / len(completed_tasks_with_time)
    
    # Get tasks by priority
    tasks_by_priority = {}
    for priority in TaskPriority:
        count = await Task.find({"user_id": user_id, "priority": priority}).count()
        tasks_by_priority[priority] = count
    
    # Get tasks by tag
    all_tasks = await Task.find({"user_id": user_id}).to_list()
    tag_counts = {}
    for task in all_tasks:
        for tag in task.tags:
            if tag in tag_counts:
                tag_counts[tag] += 1
            else:
                tag_counts[tag] = 1
    
    return TaskStats(
        total_tasks=total_tasks,
        completed_tasks=completed_tasks,
        overdue_tasks=overdue_tasks,
        upcoming_tasks=upcoming_tasks,
        completion_rate=completion_rate,
        average_completion_time=average_completion_time,
        tasks_by_priority=tasks_by_priority,
        tasks_by_tag=tag_counts
    )


@router.get("/{task_id}", response_model=TaskResponse)
async def get_task(task_id: str, current_user: User = Depends(get_current_user)):
    """Get a specific task by ID"""
    if current_user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )
    
    task = await Task.get(task_id)
    
    if not task or str(task.user_id) != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    
    return TaskResponse(
        id=str(task.id),
        user_id=str(task.user_id),
        title=task.title,
        description=task.description,
        status=task.status,
        priority=task.priority,
        deadline=task.deadline,
        estimated_time_minutes=task.estimated_time_minutes,
        actual_time_minutes=task.actual_time_minutes,
        tags=task.tags,
        created_at=task.created_at,
        updated_at=task.updated_at,
        completed_at=task.completed_at,
        recurring=task.recurring,
        recurring_pattern=task.recurring_pattern,
        parent_task_id=task.parent_task_id,
        ai_generated=task.ai_generated,
        ai_suggestions=task.ai_suggestions
    )


@router.put("/{task_id}", response_model=TaskResponse)
async def update_task(task_id: str, task_update: TaskUpdate, current_user: User = Depends(get_current_user)):
    """Update a specific task"""
    if current_user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )
    
    task = await Task.get(task_id)
    
    if not task or str(task.user_id) != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    
    # Update task fields
    update_data = task_update.dict(exclude_unset=True)
    
    # Special handling for status changes to completed
    if "status" in update_data and update_data["status"] == TaskStatus.COMPLETED and task.status != TaskStatus.COMPLETED:
        update_data["completed_at"] = datetime.utcnow()
    
    # Update the task
    for field, value in update_data.items():
        setattr(task, field, value)
    
    task.updated_at = datetime.utcnow()
    await task.save()
    
    return TaskResponse(
        id=str(task.id),
        user_id=str(task.user_id),
        title=task.title,
        description=task.description,
        status=task.status,
        priority=task.priority,
        deadline=task.deadline,
        estimated_time_minutes=task.estimated_time_minutes,
        actual_time_minutes=task.actual_time_minutes,
        tags=task.tags,
        created_at=task.created_at,
        updated_at=task.updated_at,
        completed_at=task.completed_at,
        recurring=task.recurring,
        recurring_pattern=task.recurring_pattern,
        parent_task_id=task.parent_task_id,
        ai_generated=task.ai_generated,
        ai_suggestions=task.ai_suggestions
    )


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(task_id: str, current_user: User = Depends(get_current_user)):
    """Delete a specific task"""
    if current_user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )
    
    task = await Task.get(task_id)
    
    if not task or str(task.user_id) != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    
    await task.delete()
    
    return None