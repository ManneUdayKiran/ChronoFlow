from datetime import datetime
from typing import Optional, List
from beanie import Document, Indexed
from pydantic import Field
from enum import Enum


class ScheduleStatus(str, Enum):
    PENDING = "pending"
    SCHEDULED = "scheduled"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    SKIPPED = "skipped"
    RESCHEDULED = "rescheduled"


class ScheduledTask(Document):
    """Scheduled task document model for MongoDB"""
    user_id: Indexed(str)  # Reference to User ID
    task_id: str  # Reference to original Task ID
    title: str
    description: Optional[str] = None
    
    # Scheduling information
    scheduled_start: datetime
    scheduled_end: datetime
    duration_minutes: int
    
    # Status and tracking
    status: ScheduleStatus = ScheduleStatus.SCHEDULED
    actual_start: Optional[datetime] = None
    actual_end: Optional[datetime] = None
    actual_duration_minutes: Optional[int] = None
    
    # AI context
    ai_confidence_score: Optional[float] = None  # 0-1 confidence from AI
    ai_reasoning: Optional[str] = None  # Why AI scheduled at this time
    
    # User preferences context
    user_preferences: Optional[dict] = None  # User prefs used for scheduling
    calendar_context: Optional[dict] = None  # Calendar context when scheduled
    
    # Rescheduling
    original_scheduled_start: Optional[datetime] = None
    reschedule_count: int = 0
    reschedule_reason: Optional[str] = None
    
    # Metadata
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "scheduled_tasks"
        
    model_config = {
        "json_schema_extra": {
            "example": {
                "user_id": "user123",
                "task_id": "task456", 
                "title": "Write project report",
                "scheduled_start": "2025-07-26T14:00:00",
                "scheduled_end": "2025-07-26T15:30:00",
                "duration_minutes": 90,
                "status": "scheduled",
                "ai_confidence_score": 0.85,
                "ai_reasoning": "Scheduled during high-productivity afternoon hours based on user patterns"
            }
        }
    }
