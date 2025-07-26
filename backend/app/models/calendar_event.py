from datetime import datetime
from typing import Optional, List
from beanie import Document, Indexed
from pydantic import Field
from enum import Enum


class EventType(str, Enum):
    WORK = "WORK"
    PERSONAL = "PERSONAL"
    MEETING = "MEETING"
    TASK = "TASK"
    BREAK = "BREAK"
    OTHER = "OTHER"
    # Legacy values for backward compatibility
    APPOINTMENT = "appointment"
    REMINDER = "reminder"
    DEADLINE = "deadline"


class CalendarEvent(Document):
    """Calendar event document model for MongoDB"""
    title: str
    description: Optional[str] = None
    user_id: Indexed(str)  # Reference to User ID
    start_time: datetime
    end_time: datetime
    all_day: bool = False
    location: Optional[str] = None
    event_type: EventType = EventType.OTHER
    color: Optional[str] = None  # Color for the event in the calendar
    recurring: bool = False
    recurring_pattern: Optional[dict] = None  # For recurring events
    reminder_minutes: Optional[int] = None  # Minutes before event to send reminder
    attendees: List[str] = Field(default_factory=list)  # List of email addresses
    external_id: Optional[str] = None  # ID from external calendar (e.g., Google Calendar)
    external_calendar_id: Optional[str] = None  # ID of external calendar source
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    related_task_id: Optional[str] = None  # Reference to related Task ID if applicable
    
    class Settings:
        name = "calendar_events"
        
    model_config = {
        "json_schema_extra": {
            "example": {
                "title": "Team Meeting",
                "description": "Weekly team sync",
                "start_time": "2023-08-10T14:00:00",
                "end_time": "2023-08-10T15:00:00",
                "location": "Conference Room A",
                "event_type": "meeting",
                "color": "#4285F4",
                "reminder_minutes": 15,
                "attendees": ["colleague@example.com"],
            }
        }
    }