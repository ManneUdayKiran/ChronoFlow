from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from enum import Enum


class TaskForScheduling(BaseModel):
    """Task data for AI scheduling"""
    task_id: str
    title: str
    description: Optional[str] = None
    priority: str  # low, medium, high, urgent
    deadline: Optional[datetime] = None
    estimated_time_minutes: int
    tags: List[str] = Field(default_factory=list)
    requires_focus: bool = True
    can_be_split: bool = False  # Can the task be broken into smaller chunks
    dependencies: List[str] = Field(default_factory=list)  # Task IDs this depends on


class CalendarEvent(BaseModel):
    """Calendar event (from Google Calendar or internal)"""
    event_id: str
    title: str
    start_time: datetime
    end_time: datetime
    is_busy: bool = True  # Whether this time is blocked
    event_type: str = "meeting"  # meeting, appointment, personal, etc.


class FreeTimeSlot(BaseModel):
    """Available time slot for scheduling"""
    start_time: datetime
    end_time: datetime
    duration_minutes: int
    quality_score: float = Field(ge=0, le=1)  # 0-1 based on user preferences


class SchedulingRequest(BaseModel):
    """Request to schedule tasks"""
    user_id: str
    tasks: List[TaskForScheduling]
    date_range_start: datetime
    date_range_end: datetime
    include_google_calendar: bool = True
    force_reschedule: bool = False  # Reschedule existing tasks if needed
    preferences_override: Optional[Dict[str, Any]] = None


class ScheduledTaskResult(BaseModel):
    """Result of AI scheduling"""
    task_id: str
    title: str
    scheduled_start: datetime
    scheduled_end: datetime
    duration_minutes: int
    confidence_score: float = Field(ge=0, le=1)
    reasoning: str
    calendar_event_id: Optional[str] = None  # If created in Google Calendar


class SchedulingResponse(BaseModel):
    """Response from AI scheduling"""
    success: bool
    scheduled_tasks: List[ScheduledTaskResult]
    unscheduled_tasks: List[str] = Field(default_factory=list)  # Task IDs that couldn't be scheduled
    scheduling_summary: str
    recommendations: List[str] = Field(default_factory=list)
    total_scheduled_time_minutes: int = 0
    schedule_efficiency_score: float = Field(ge=0, le=1, default=0.0)


class ReschedulingRequest(BaseModel):
    """Request to reschedule a specific task"""
    user_id: str
    scheduled_task_id: str
    new_preferred_time: Optional[datetime] = None
    reason: str
    maintain_duration: bool = True


class UserSchedulingPreferences(BaseModel):
    """User preferences for scheduling (for API requests)"""
    work_start_time: str = "09:00"
    work_end_time: str = "17:00"
    work_style: str = "flexible"  # morning_person, evening_person, flexible
    peak_hours_start: str = "10:00"
    peak_hours_end: str = "12:00"
    buffer_time_minutes: int = 15
    prefer_morning_for_hard_tasks: bool = True
    avoid_scheduling_after: str = "18:00"
    minimum_focus_block_minutes: int = 25
    maximum_focus_block_minutes: int = 120


class AISchedulingPrompt(BaseModel):
    """Internal model for AI prompt construction"""
    tasks: List[TaskForScheduling]
    free_slots: List[FreeTimeSlot]
    user_preferences: UserSchedulingPreferences
    existing_events: List[CalendarEvent]
    user_productivity_patterns: Optional[Dict[str, Any]] = None


class SchedulingAnalytics(BaseModel):
    """Analytics for scheduled tasks"""
    user_id: str
    date: datetime
    total_tasks_scheduled: int
    total_time_scheduled_minutes: int
    completion_rate: float = Field(ge=0, le=1)
    average_task_duration_minutes: float
    peak_productivity_hour: Optional[int] = None
    most_productive_time_slots: List[str] = Field(default_factory=list)
    scheduling_accuracy_score: float = Field(ge=0, le=1)  # How well AI predicted actual completion


class TaskStatusUpdateRequest(BaseModel):
    """Request to update scheduled task status"""
    new_status: str  # pending, scheduled, in_progress, completed, skipped, rescheduled
    actual_start: Optional[datetime] = None
    actual_end: Optional[datetime] = None
