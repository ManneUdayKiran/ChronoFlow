from datetime import time
from typing import Optional, List, Dict, Any
from beanie import Document, Indexed
from pydantic import Field, validator
from enum import Enum


class WorkStyle(str, Enum):
    MORNING_PERSON = "morning_person"
    EVENING_PERSON = "evening_person"
    FLEXIBLE = "flexible"


class ProductivityLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class UserPreferences(Document):
    """User preferences for AI scheduling"""
    user_id: Indexed(str, unique=True)  # Reference to User ID
    
    # Work schedule preferences (stored as HH:MM strings)
    work_start_time: str = Field(default="09:00")  # 9 AM
    work_end_time: str = Field(default="17:00")  # 5 PM
    work_style: WorkStyle = WorkStyle.FLEXIBLE
    
    # Productivity patterns (stored as HH:MM strings)
    peak_hours_start: str = Field(default="10:00")  # 10 AM
    peak_hours_end: str = Field(default="12:00")  # 12 PM
    low_energy_hours_start: str = Field(default="14:00")  # 2 PM
    low_energy_hours_end: str = Field(default="15:00")  # 3 PM
    
    # Break preferences
    preferred_break_duration: int = 15  # minutes
    max_continuous_work_time: int = 90  # minutes
    
    # Task scheduling preferences
    buffer_time_minutes: int = 15  # Buffer between tasks
    prefer_morning_for_hard_tasks: bool = True
    prefer_afternoon_for_routine_tasks: bool = True
    avoid_scheduling_after: str = Field(default="18:00")  # 6 PM
    
    # Commute and travel
    commute_time_minutes: int = 0
    include_commute_in_schedule: bool = False
    
    # Meeting preferences
    meeting_buffer_minutes: int = 10
    prefer_back_to_back_meetings: bool = False
    
    # Focus time preferences
    minimum_focus_block_minutes: int = 25  # Minimum pomodoro
    maximum_focus_block_minutes: int = 120  # Maximum before break
    
    # AI learning data
    completed_task_patterns: Dict[str, Any] = Field(default_factory=dict)
    skipped_task_patterns: Dict[str, Any] = Field(default_factory=dict)
    productivity_scores_by_hour: Dict[int, float] = Field(default_factory=dict)
    
    # Custom rules
    custom_scheduling_rules: List[str] = Field(default_factory=list)
    blackout_periods: List[Dict[str, Any]] = Field(default_factory=list)  # Times to never schedule
    
    # Notification preferences
    reminder_minutes_before: int = 15
    enable_ai_suggestions: bool = True
    enable_smart_rescheduling: bool = True
    
    # Calendar integration
    google_calendar_id: Optional[str] = None
    sync_with_google_calendar: bool = False
    create_calendar_events: bool = True
    
    class Settings:
        name = "user_preferences"
        
    model_config = {
        "json_schema_extra": {
            "example": {
                "user_id": "user123",
                "work_start_time": "09:00:00",
                "work_end_time": "17:00:00", 
                "work_style": "morning_person",
                "peak_hours_start": "10:00:00",
                "peak_hours_end": "12:00:00",
                "prefer_morning_for_hard_tasks": True,
                "buffer_time_minutes": 15,
                "sync_with_google_calendar": True
            }
        }
    }
