from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel
from app.models.calendar_event import EventType


class CalendarEventBase(BaseModel):
    """Base calendar event schema with common fields"""
    title: str
    description: Optional[str] = None
    start_time: datetime
    end_time: datetime
    all_day: bool = False
    location: Optional[str] = None
    event_type: EventType = EventType.OTHER
    color: Optional[str] = None
    recurring: bool = False
    recurring_pattern: Optional[dict] = None
    reminder_minutes: Optional[int] = None
    attendees: List[str] = []
    related_task_id: Optional[str] = None


class CalendarEventCreate(CalendarEventBase):
    """Calendar event creation schema"""
    pass


class CalendarEventUpdate(BaseModel):
    """Calendar event update schema with all fields optional"""
    title: Optional[str] = None
    description: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    all_day: Optional[bool] = None
    location: Optional[str] = None
    event_type: Optional[EventType] = None
    color: Optional[str] = None
    recurring: Optional[bool] = None
    recurring_pattern: Optional[dict] = None
    reminder_minutes: Optional[int] = None
    attendees: Optional[List[str]] = None
    related_task_id: Optional[str] = None


class CalendarEventResponse(CalendarEventBase):
    """Calendar event response schema with all fields"""
    id: str
    user_id: str
    external_id: Optional[str] = None
    external_calendar_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class CalendarEventBulkImport(BaseModel):
    """Schema for bulk importing calendar events"""
    events: List[CalendarEventCreate]
    source: Optional[str] = None  # e.g., "google_calendar"
    external_calendar_id: Optional[str] = None


class DateRange(BaseModel):
    """Schema for date range queries"""
    start_date: datetime
    end_date: datetime