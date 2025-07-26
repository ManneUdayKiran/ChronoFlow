from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional
from datetime import datetime, timedelta
from app.models.user import User
from app.models.pomodoro_session import PomodoroSession, SessionType, SessionStatus
from app.schemas.pomodoro import (
    PomodoroSessionCreate, 
    PomodoroSessionUpdate, 
    PomodoroSessionResponse,
    PomodoroStats
)
from app.services.auth import get_current_user

router = APIRouter()


@router.post("/sessions", response_model=PomodoroSessionResponse, status_code=status.HTTP_201_CREATED)
async def create_pomodoro_session(session: PomodoroSessionCreate, current_user: User = Depends(get_current_user)):
    """Create a new Pomodoro session"""
    if current_user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )
    
    # Create new session
    new_session = PomodoroSession(
        **session.dict(),
        user_id=str(current_user.id),
        created_at=datetime.utcnow()
    )
    
    await new_session.insert()
    
    return PomodoroSessionResponse(
        id=str(new_session.id),
        user_id=str(new_session.user_id),
        session_type=new_session.session_type,
        duration_minutes=new_session.duration_minutes,
        status=new_session.status,
        start_time=new_session.start_time,
        end_time=new_session.end_time,
        related_task_id=new_session.related_task_id,
        notes=new_session.notes,
        interruption_reason=new_session.interruption_reason,
        created_at=new_session.created_at
    )


@router.get("/sessions", response_model=List[PomodoroSessionResponse])
async def get_pomodoro_sessions(
    from_date: Optional[datetime] = None,
    to_date: Optional[datetime] = None,
    session_type: Optional[SessionType] = None,
    status: Optional[SessionStatus] = None,
    limit: int = Query(50, ge=1, le=100),
    skip: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user)
):
    """Get user's Pomodoro sessions with optional filtering"""
    if current_user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )
    
    # Build query
    query = {"user_id": str(current_user.id)}
    
    if session_type:
        query["session_type"] = session_type
    
    if status:
        query["status"] = status
    
    date_query = {}
    if from_date:
        date_query["$gte"] = from_date
    
    if to_date:
        date_query["$lte"] = to_date
    
    if date_query:
        query["start_time"] = date_query
    
    # Execute query
    sessions = await PomodoroSession.find(query).sort([("start_time", -1)]).skip(skip).limit(limit).to_list()
    
    return [
        PomodoroSessionResponse(
            id=str(session.id),
            user_id=str(session.user_id),
            session_type=session.session_type,
            duration_minutes=session.duration_minutes,
            status=session.status,
            start_time=session.start_time,
            end_time=session.end_time,
            related_task_id=session.related_task_id,
            notes=session.notes,
            interruption_reason=session.interruption_reason,
            created_at=session.created_at
        ) for session in sessions
    ]


@router.get("/sessions/{session_id}", response_model=PomodoroSessionResponse)
async def get_pomodoro_session(session_id: str, current_user: User = Depends(get_current_user)):
    """Get a specific Pomodoro session by ID"""
    if current_user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )
    
    session = await PomodoroSession.get(session_id)
    
    if not session or str(session.user_id) != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
    
    return PomodoroSessionResponse(
        id=str(session.id),
        user_id=str(session.user_id),
        session_type=session.session_type,
        duration_minutes=session.duration_minutes,
        status=session.status,
        start_time=session.start_time,
        end_time=session.end_time,
        related_task_id=session.related_task_id,
        notes=session.notes,
        interruption_reason=session.interruption_reason,
        created_at=session.created_at
    )


@router.put("/sessions/{session_id}", response_model=PomodoroSessionResponse)
async def update_pomodoro_session(session_id: str, session_update: PomodoroSessionUpdate, current_user: User = Depends(get_current_user)):
    """Update a specific Pomodoro session"""
    if current_user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )
    
    session = await PomodoroSession.get(session_id)
    
    if not session or str(session.user_id) != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
    
    # Update session fields
    update_data = session_update.dict(exclude_unset=True)
    
    for field, value in update_data.items():
        setattr(session, field, value)
    
    await session.save()
    
    return PomodoroSessionResponse(
        id=str(session.id),
        user_id=str(session.user_id),
        session_type=session.session_type,
        duration_minutes=session.duration_minutes,
        status=session.status,
        start_time=session.start_time,
        end_time=session.end_time,
        related_task_id=session.related_task_id,
        notes=session.notes,
        interruption_reason=session.interruption_reason,
        created_at=session.created_at
    )


@router.delete("/sessions/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_pomodoro_session(session_id: str, current_user: User = Depends(get_current_user)):
    """Delete a specific Pomodoro session"""
    if current_user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )
    
    session = await PomodoroSession.get(session_id)
    
    if not session or str(session.user_id) != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
    
    await session.delete()
    
    return None


@router.get("/stats", response_model=PomodoroStats)
async def get_pomodoro_stats(
    from_date: Optional[datetime] = None,
    to_date: Optional[datetime] = None,
    current_user: User = Depends(get_current_user)
):
    """Get Pomodoro statistics for the current user"""
    if current_user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )
    
    user_id = str(current_user.id)
    now = datetime.utcnow()
    
    # Set default date range if not provided (last 30 days)
    if not from_date:
        from_date = now - timedelta(days=30)
    
    if not to_date:
        to_date = now
    
    # Get all sessions in date range
    sessions = await PomodoroSession.find({
        "user_id": user_id,
        "start_time": {"$gte": from_date, "$lte": to_date}
    }).to_list()
    
    # Calculate statistics
    total_sessions = len(sessions)
    completed_sessions = sum(1 for s in sessions if s.status == SessionStatus.COMPLETED)
    interrupted_sessions = sum(1 for s in sessions if s.status == SessionStatus.INTERRUPTED)
    
    # Calculate focus time
    focus_sessions = [s for s in sessions if s.session_type == SessionType.FOCUS]
    total_focus_time_minutes = sum(s.duration_minutes for s in focus_sessions if s.status == SessionStatus.COMPLETED)
    
    # Calculate daily average (over days with sessions)
    session_days = set(s.start_time.date() for s in focus_sessions)
    daily_average_focus_time_minutes = total_focus_time_minutes / len(session_days) if session_days else 0
    
    # Calculate weekly average
    days_in_range = (to_date - from_date).days + 1
    weeks_in_range = max(1, days_in_range / 7)
    weekly_average_focus_time_minutes = total_focus_time_minutes / weeks_in_range
    
    # Calculate longest streak
    # Sort sessions by start time
    sorted_sessions = sorted(focus_sessions, key=lambda s: s.start_time)
    current_streak = 0
    longest_streak = 0
    last_session_date = None
    
    for session in sorted_sessions:
        if session.status != SessionStatus.COMPLETED:
            current_streak = 0
            continue
            
        session_date = session.start_time.date()
        
        if last_session_date is None or session_date == last_session_date:
            current_streak += 1
        elif (session_date - last_session_date).days == 1:
            current_streak += 1
        else:
            current_streak = 1
            
        longest_streak = max(longest_streak, current_streak)
        last_session_date = session_date
    
    # Find most productive day and time
    day_counts = {}
    hour_counts = {}
    
    for session in focus_sessions:
        if session.status != SessionStatus.COMPLETED:
            continue
            
        day_name = session.start_time.strftime("%A")
        hour = session.start_time.hour
        
        day_counts[day_name] = day_counts.get(day_name, 0) + session.duration_minutes
        hour_counts[hour] = hour_counts.get(hour, 0) + session.duration_minutes
    
    most_productive_day = max(day_counts.items(), key=lambda x: x[1])[0] if day_counts else "N/A"
    
    # Group hours into time periods
    morning_time = sum(hour_counts.get(h, 0) for h in range(5, 12))  # 5 AM - 11:59 AM
    afternoon_time = sum(hour_counts.get(h, 0) for h in range(12, 17))  # 12 PM - 4:59 PM
    evening_time = sum(hour_counts.get(h, 0) for h in range(17, 22))  # 5 PM - 9:59 PM
    night_time = sum(hour_counts.get(h, 0) for h in range(22, 24)) + sum(hour_counts.get(h, 0) for h in range(0, 5))  # 10 PM - 4:59 AM
    
    time_periods = {
        "Morning (5 AM - 12 PM)": morning_time,
        "Afternoon (12 PM - 5 PM)": afternoon_time,
        "Evening (5 PM - 10 PM)": evening_time,
        "Night (10 PM - 5 AM)": night_time
    }
    
    most_productive_time = max(time_periods.items(), key=lambda x: x[1])[0] if time_periods else "N/A"
    
    # Calculate completion rate
    session_completion_rate = (completed_sessions / total_sessions * 100) if total_sessions > 0 else 0
    
    return PomodoroStats(
        total_sessions=total_sessions,
        completed_sessions=completed_sessions,
        interrupted_sessions=interrupted_sessions,
        total_focus_time_minutes=total_focus_time_minutes,
        daily_average_focus_time_minutes=daily_average_focus_time_minutes,
        weekly_average_focus_time_minutes=weekly_average_focus_time_minutes,
        longest_focus_streak=longest_streak,
        most_productive_day_of_week=most_productive_day,
        most_productive_time_of_day=most_productive_time,
        session_completion_rate=session_completion_rate
    )