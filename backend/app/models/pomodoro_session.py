from datetime import datetime
from typing import Optional, List
from beanie import Document, Indexed
from pydantic import Field
from enum import Enum


class SessionType(str, Enum):
    FOCUS = "focus"
    SHORT_BREAK = "short_break"
    LONG_BREAK = "long_break"


class SessionStatus(str, Enum):
    COMPLETED = "completed"
    INTERRUPTED = "interrupted"
    SKIPPED = "skipped"


class PomodoroSession(Document):
    """Pomodoro session document model for MongoDB"""
    user_id: Indexed(str)  # Reference to User ID
    session_type: SessionType
    duration_minutes: int
    status: SessionStatus
    start_time: datetime
    end_time: datetime
    related_task_id: Optional[str] = None  # Reference to Task ID if session was for a specific task
    notes: Optional[str] = None
    interruption_reason: Optional[str] = None  # If session was interrupted
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "pomodoro_sessions"
        
    model_config = {
        "json_schema_extra": {
            "example": {
                "session_type": "focus",
                "duration_minutes": 25,
                "status": "completed",
                "start_time": "2023-08-10T10:00:00",
                "end_time": "2023-08-10T10:25:00",
                "related_task_id": "60d21b4667d0d8992e610c85",
            }
        }
    }