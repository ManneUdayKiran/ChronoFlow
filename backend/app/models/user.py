from datetime import datetime
from typing import Optional, List
from beanie import Document, Indexed
from pydantic import EmailStr, Field
from app.models.pomodoro_settings import PomodoroSettings


class User(Document):
    """User document model for MongoDB"""
    email: Indexed(EmailStr, unique=True)
    username: Indexed(str, unique=True)
    hashed_password: str
    full_name: Optional[str] = None
    disabled: bool = False
    is_superuser: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    last_login: Optional[datetime] = None
    profile_image: Optional[str] = None
    theme_preference: str = "system"  # system, light, dark
    notification_settings: dict = Field(default_factory=lambda: {
        "email": True,
        "push": True,
        "task_reminders": True,
        "pomodoro_alerts": True,
        "calendar_reminders": True,
    })
    integrations: dict = Field(default_factory=lambda: {
        "google_calendar": {
            "connected": False,
            "refresh_token": None,
            "last_synced": None,
        },
    })
    pomodoro_settings_id: Optional[str] = None
    
    class Settings:
        name = "users"
        
    model_config = {
        "json_schema_extra": {
            "example": {
                "email": "user@example.com",
                "username": "johndoe",
                "full_name": "John Doe",
                "theme_preference": "dark",
            }
        }
    }