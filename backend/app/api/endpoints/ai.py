from fastapi import APIRouter, Depends, HTTPException, status, Body
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from app.models.user import User
from app.models.task import Task
from app.models.pomodoro_session import PomodoroSession
from app.models.calendar_event import CalendarEvent
from app.schemas.ai import (
    AICompletionRequest,
    AICompletionResponse,
    TaskSuggestion,
    TaskAnalysisRequest,
    TaskAnalysisResponse,
    ProductivityInsightsRequest,
    ProductivityInsightsResponse,
    AIModel
)
from app.services.auth import get_current_user
from app.services.ai_service import ai_service

router = APIRouter()


@router.post("/completion", response_model=AICompletionResponse)
async def generate_completion(request: AICompletionRequest, current_user: User = Depends(get_current_user)):
    """Generate a completion from OpenRouter API"""
    if current_user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )
    
    try:
        response = await ai_service.generate_completion(request)
        return response
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating completion: {str(e)}"
        )


@router.post("/analyze-task", response_model=TaskAnalysisResponse)
async def analyze_task(request: TaskAnalysisRequest, current_user: User = Depends(get_current_user)):
    """Analyze a task and provide insights"""
    if current_user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )
    
    try:
        response = await ai_service.analyze_task(request.task_description, request.user_context)
        return response
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error analyzing task: {str(e)}"
        )


@router.get("/task-suggestions", response_model=List[TaskSuggestion])
async def get_task_suggestions(current_user: User = Depends(get_current_user)):
    """Generate task suggestions based on user data"""
    if current_user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )
    
    # Check if AI service is available
    if not ai_service.api_key:
        # Return fallback suggestions when API key is not configured
        return [
            TaskSuggestion(
                title="Review and organize your tasks",
                description="Take 15 minutes to review your current tasks and organize them by priority",
                priority="medium",
                estimated_time_minutes=15,
                tags=["productivity", "organization"],
                reasoning="Regular task review helps maintain focus and ensures important items don't get overlooked"
            ),
            TaskSuggestion(
                title="Plan your day with time blocks",
                description="Use time blocking technique to allocate specific time slots for your most important tasks",
                priority="high",
                estimated_time_minutes=20,
                tags=["planning", "time-management"],
                reasoning="Time blocking helps prevent multitasking and increases focused work time"
            ),
            TaskSuggestion(
                title="Take a focused break",
                description="Step away from work for 10 minutes to recharge and return with fresh perspective",
                priority="low",
                estimated_time_minutes=10,
                tags=["wellness", "break"],
                reasoning="Regular breaks improve overall productivity and prevent burnout"
            ),
            TaskSuggestion(
                title="Update your progress tracking",
                description="Log your completed tasks and reflect on what you've accomplished today",
                priority="medium",
                estimated_time_minutes=10,
                tags=["reflection", "tracking"],
                reasoning="Tracking progress provides motivation and helps identify productive patterns"
            )
        ]
    
    # Gather user data for context
    user_id = str(current_user.id)
    now = datetime.utcnow()
    
    # Get recent tasks
    recent_tasks = await Task.find({"user_id": user_id}).sort([("created_at", -1)]).limit(10).to_list()
    
    # Get upcoming calendar events
    upcoming_events = await CalendarEvent.find({
        "user_id": user_id,
        "start_time": {"$gte": now, "$lte": now + timedelta(days=7)}
    }).sort([("start_time", 1)]).limit(5).to_list()
    
    # Get recent Pomodoro sessions
    recent_sessions = await PomodoroSession.find({"user_id": user_id}).sort([("start_time", -1)]).limit(10).to_list()
    
    # Prepare user data for AI
    user_data = {
        "recent_tasks": [
            {
                "id": str(task.id),
                "title": task.title,
                "description": task.description,
                "status": task.status,
                "priority": task.priority,
                "deadline": task.deadline.isoformat() if task.deadline else None,
                "tags": task.tags
            } for task in recent_tasks
        ],
        "upcoming_events": [
            {
                "id": str(event.id),
                "title": event.title,
                "start_time": event.start_time.isoformat(),
                "end_time": event.end_time.isoformat(),
                "event_type": event.event_type
            } for event in upcoming_events
        ],
        "recent_sessions": [
            {
                "session_type": session.session_type,
                "duration_minutes": session.duration_minutes,
                "status": session.status,
                "start_time": session.start_time.isoformat()
            } for session in recent_sessions
        ],
        "user_preferences": {
            "theme": current_user.theme_preference
        }
    }
    
    try:
        suggestions = await ai_service.generate_task_suggestions(user_data)
        return suggestions
    except Exception as e:
        # Return fallback suggestions if AI service fails
        return [
            TaskSuggestion(
                title="Complete pending tasks",
                description="Focus on finishing your high-priority pending tasks",
                priority="high",
                estimated_time_minutes=45,
                tags=["focus", "completion"],
                reasoning="Completing pending tasks reduces mental load and provides sense of accomplishment"
            ),
            TaskSuggestion(
                title="Plan tomorrow's priorities",
                description="Spend time planning your top 3 priorities for tomorrow",
                priority="medium",
                estimated_time_minutes=15,
                tags=["planning", "priorities"],
                reasoning="End-of-day planning sets you up for a productive next day"
            )
        ]


@router.post("/productivity-insights", response_model=ProductivityInsightsResponse)
async def get_productivity_insights(request: ProductivityInsightsRequest, current_user: User = Depends(get_current_user)):
    """Generate productivity insights based on user data"""
    if current_user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )
    
    # Determine date range based on time period
    now = datetime.utcnow()
    if request.time_period == "day":
        from_date = datetime(now.year, now.month, now.day, 0, 0, 0)
        to_date = now
    elif request.time_period == "week":
        from_date = now - timedelta(days=7)
        to_date = now
    elif request.time_period == "month":
        from_date = now - timedelta(days=30)
        to_date = now
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid time period. Must be 'day', 'week', or 'month'."
        )
    
    user_id = str(current_user.id)
    user_data = {}
    
    # Get task data if requested
    if request.include_task_data:
        tasks = await Task.find({
            "user_id": user_id,
            "$or": [
                {"created_at": {"$gte": from_date, "$lte": to_date}},
                {"updated_at": {"$gte": from_date, "$lte": to_date}},
                {"completed_at": {"$gte": from_date, "$lte": to_date}}
            ]
        }).to_list()
        
        user_data["tasks"] = [
            {
                "id": str(task.id),
                "title": task.title,
                "status": task.status,
                "priority": task.priority,
                "created_at": task.created_at.isoformat(),
                "completed_at": task.completed_at.isoformat() if task.completed_at else None,
                "estimated_time_minutes": task.estimated_time_minutes,
                "actual_time_minutes": task.actual_time_minutes,
                "tags": task.tags
            } for task in tasks
        ]
    
    # Get Pomodoro data if requested
    if request.include_pomodoro_data:
        sessions = await PomodoroSession.find({
            "user_id": user_id,
            "start_time": {"$gte": from_date, "$lte": to_date}
        }).to_list()
        
        user_data["pomodoro_sessions"] = [
            {
                "session_type": session.session_type,
                "duration_minutes": session.duration_minutes,
                "status": session.status,
                "start_time": session.start_time.isoformat(),
                "end_time": session.end_time.isoformat(),
                "related_task_id": session.related_task_id
            } for session in sessions
        ]
    
    # Get calendar data if requested
    if request.include_calendar_data:
        events = await CalendarEvent.find({
            "user_id": user_id,
            "$or": [
                {"start_time": {"$gte": from_date, "$lte": to_date}},
                {"end_time": {"$gte": from_date, "$lte": to_date}}
            ]
        }).to_list()
        
        user_data["calendar_events"] = [
            {
                "title": event.title,
                "event_type": event.event_type,
                "start_time": event.start_time.isoformat(),
                "end_time": event.end_time.isoformat(),
                "duration_minutes": (event.end_time - event.start_time).total_seconds() / 60
            } for event in events
        ]
    
    # Add time period info
    user_data["time_period"] = {
        "period": request.time_period,
        "from_date": from_date.isoformat(),
        "to_date": to_date.isoformat()
    }
    
    try:
        insights = await ai_service.generate_productivity_insights(user_data)
        return insights
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating productivity insights: {str(e)}"
        )


@router.get("/models", response_model=List[AIModel])
async def get_available_models(current_user: User = Depends(get_current_user)):
    """Get available AI models from OpenRouter"""
    if current_user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )
    
    # For now, return a static list of models
    # In a production environment, this would fetch from OpenRouter API
    models = [
        AIModel(
            id="anthropic/claude-3-opus:beta",
            name="Claude 3 Opus",
            provider="anthropic",
            description="Anthropic's most powerful model for highly complex tasks",
            max_tokens=4096,
            pricing_input=15.0,
            pricing_output=75.0
        ),
        AIModel(
            id="anthropic/claude-3-sonnet:beta",
            name="Claude 3 Sonnet",
            provider="anthropic",
            description="Anthropic's balanced model for enterprise workloads",
            max_tokens=4096,
            pricing_input=3.0,
            pricing_output=15.0
        ),
        AIModel(
            id="anthropic/claude-3-haiku:beta",
            name="Claude 3 Haiku",
            provider="anthropic",
            description="Anthropic's fastest and most compact model",
            max_tokens=4096,
            pricing_input=0.25,
            pricing_output=1.25
        ),
        AIModel(
            id="openai/gpt-4-turbo",
            name="GPT-4 Turbo",
            provider="openai",
            description="OpenAI's most capable model",
            max_tokens=4096,
            pricing_input=10.0,
            pricing_output=30.0
        ),
        AIModel(
            id="google/gemini-pro",
            name="Gemini Pro",
            provider="google",
            description="Google's largest and most capable AI model",
            max_tokens=4096,
            pricing_input=0.5,
            pricing_output=1.5
        ),
        AIModel(
            id="mistral/mistral-large",
            name="Mistral Large",
            provider="mistral",
            description="Mistral AI's most powerful model",
            max_tokens=4096,
            pricing_input=2.0,
            pricing_output=6.0
        )
    ]
    
    return models