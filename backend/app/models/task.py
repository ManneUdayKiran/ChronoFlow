from datetime import datetime
from typing import Optional, List
from beanie import Document, Indexed, Link
from pydantic import Field
from enum import Enum


class TaskPriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


class TaskStatus(str, Enum):
    TODO = "todo"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class Task(Document):
    """Task document model for MongoDB"""
    title: str
    description: Optional[str] = None
    user_id: Indexed(str)  # Reference to User ID
    status: TaskStatus = TaskStatus.TODO
    priority: TaskPriority = TaskPriority.MEDIUM
    deadline: Optional[datetime] = None
    estimated_time_minutes: Optional[int] = None
    actual_time_minutes: Optional[int] = None
    tags: List[str] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None
    recurring: bool = False
    recurring_pattern: Optional[dict] = None  # For recurring tasks (daily, weekly, etc.)
    parent_task_id: Optional[str] = None  # For subtasks
    ai_generated: bool = False  # Flag for AI-generated tasks
    ai_suggestions: Optional[List[str]] = None  # AI suggestions for the task
    
    class Settings:
        name = "tasks"
        
    model_config = {
        "json_schema_extra": {
            "example": {
                "title": "Complete project proposal",
                "description": "Finish the draft and send for review",
                "status": "todo",
                "priority": "high",
                "deadline": "2023-08-15T18:00:00",
                "estimated_time_minutes": 120,
                "tags": ["work", "project"],
            }
        }
    }