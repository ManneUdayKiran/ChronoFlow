from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field
from app.models.task import TaskPriority, TaskStatus


class TaskBase(BaseModel):
    """Base task schema with common fields"""
    title: str
    description: Optional[str] = None
    status: TaskStatus = TaskStatus.TODO
    priority: TaskPriority = TaskPriority.MEDIUM
    deadline: Optional[datetime] = None
    estimated_time_minutes: Optional[int] = None
    tags: List[str] = Field(default_factory=list)
    recurring: bool = False
    recurring_pattern: Optional[dict] = None
    parent_task_id: Optional[str] = None


class TaskCreate(TaskBase):
    """Task creation schema"""
    pass


class TaskUpdate(BaseModel):
    """Task update schema with all fields optional"""
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[TaskStatus] = None
    priority: Optional[TaskPriority] = None
    deadline: Optional[datetime] = None
    estimated_time_minutes: Optional[int] = None
    actual_time_minutes: Optional[int] = None
    tags: Optional[List[str]] = None
    recurring: Optional[bool] = None
    recurring_pattern: Optional[dict] = None
    parent_task_id: Optional[str] = None
    ai_suggestions: Optional[List[str]] = None


class TaskResponse(TaskBase):
    """Task response schema with all fields"""
    id: str
    user_id: str
    actual_time_minutes: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    completed_at: Optional[datetime] = None
    ai_generated: bool
    ai_suggestions: Optional[List[str]] = None


class TaskStats(BaseModel):
    """Task statistics schema"""
    total_tasks: int
    completed_tasks: int
    overdue_tasks: int
    upcoming_tasks: int
    completion_rate: float  # Percentage
    average_completion_time: Optional[float] = None  # In minutes
    tasks_by_priority: dict  # Count of tasks by priority
    tasks_by_tag: dict  # Count of tasks by tag