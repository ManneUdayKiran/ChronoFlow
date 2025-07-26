from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel
from app.models.pomodoro_session import SessionType, SessionStatus


class PomodoroSettingsBase(BaseModel):
    """Base Pomodoro settings schema with common fields"""
    focus_duration_minutes: int = 25
    short_break_duration_minutes: int = 5
    long_break_duration_minutes: int = 15
    long_break_interval: int = 4
    auto_start_breaks: bool = True
    auto_start_pomodoros: bool = False
    sound_enabled: bool = True
    sound_volume: float = 0.7
    notification_enabled: bool = True
    daily_goal_sessions: Optional[int] = None


class PomodoroSettingsCreate(PomodoroSettingsBase):
    """Pomodoro settings creation schema"""
    pass


class PomodoroSettingsUpdate(BaseModel):
    """Pomodoro settings update schema with all fields optional"""
    focus_duration_minutes: Optional[int] = None
    short_break_duration_minutes: Optional[int] = None
    long_break_duration_minutes: Optional[int] = None
    long_break_interval: Optional[int] = None
    auto_start_breaks: Optional[bool] = None
    auto_start_pomodoros: Optional[bool] = None
    sound_enabled: Optional[bool] = None
    sound_volume: Optional[float] = None
    notification_enabled: Optional[bool] = None
    daily_goal_sessions: Optional[int] = None


class PomodoroSettingsResponse(PomodoroSettingsBase):
    """Pomodoro settings response schema"""
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime


class PomodoroSessionBase(BaseModel):
    """Base Pomodoro session schema with common fields"""
    session_type: SessionType
    duration_minutes: int
    status: SessionStatus
    start_time: datetime
    end_time: datetime
    related_task_id: Optional[str] = None
    notes: Optional[str] = None
    interruption_reason: Optional[str] = None


class PomodoroSessionCreate(BaseModel):
    """Pomodoro session creation schema"""
    session_type: SessionType
    duration_minutes: int
    status: SessionStatus = SessionStatus.COMPLETED
    start_time: datetime
    end_time: datetime
    related_task_id: Optional[str] = None
    notes: Optional[str] = None
    interruption_reason: Optional[str] = None


class PomodoroSessionUpdate(BaseModel):
    """Pomodoro session update schema"""
    status: Optional[SessionStatus] = None
    end_time: Optional[datetime] = None
    notes: Optional[str] = None
    interruption_reason: Optional[str] = None


class PomodoroSessionResponse(PomodoroSessionBase):
    """Pomodoro session response schema"""
    id: str
    user_id: str
    created_at: datetime


class PomodoroStats(BaseModel):
    """Pomodoro statistics schema"""
    total_sessions: int
    completed_sessions: int
    interrupted_sessions: int
    total_focus_time_minutes: int
    daily_average_focus_time_minutes: float
    weekly_average_focus_time_minutes: float
    longest_focus_streak: int  # consecutive completed sessions
    most_productive_day_of_week: str
    most_productive_time_of_day: str
    session_completion_rate: float  # percentage