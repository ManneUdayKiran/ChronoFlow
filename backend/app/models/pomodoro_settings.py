from datetime import datetime
from typing import Optional
from beanie import Document, Indexed
from pydantic import Field


class PomodoroSettings(Document):
    """Pomodoro settings document model for MongoDB"""
    user_id: Indexed(str, unique=True)  # Reference to User ID
    focus_duration_minutes: int = 25
    short_break_duration_minutes: int = 5
    long_break_duration_minutes: int = 15
    long_break_interval: int = 4  # Number of focus sessions before a long break
    auto_start_breaks: bool = True
    auto_start_pomodoros: bool = False
    sound_enabled: bool = True
    sound_volume: float = 0.7  # 0.0 to 1.0
    notification_enabled: bool = True
    daily_goal_sessions: Optional[int] = None  # Target number of sessions per day
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "pomodoro_settings"
        
    model_config = {
        "json_schema_extra": {
            "example": {
                "focus_duration_minutes": 25,
                "short_break_duration_minutes": 5,
                "long_break_duration_minutes": 15,
                "long_break_interval": 4,
                "auto_start_breaks": True,
                "auto_start_pomodoros": False,
                "sound_enabled": True,
                "notification_enabled": True,
                "daily_goal_sessions": 8,
            }
        }
    }