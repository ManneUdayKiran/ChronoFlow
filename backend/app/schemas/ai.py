from typing import Optional, List, Dict, Any, Union
from pydantic import BaseModel, Field
from enum import Enum


class AIModelProvider(str, Enum):
    ANTHROPIC = "anthropic"
    OPENAI = "openai"
    GOOGLE = "google"
    META = "meta"
    MISTRAL = "mistral"
    COHERE = "cohere"


class AIModel(BaseModel):
    """AI model information schema"""
    id: str
    name: str
    provider: AIModelProvider
    description: Optional[str] = None
    max_tokens: int
    pricing_input: float  # per 1M tokens
    pricing_output: float  # per 1M tokens


class AIMessage(BaseModel):
    """Message schema for AI conversations"""
    role: str  # "system", "user", "assistant"
    content: str


class AICompletionRequest(BaseModel):
    """Request schema for AI completions"""
    messages: List[AIMessage]
    model: str = Field(..., description="Model ID from OpenRouter")
    max_tokens: Optional[int] = 1000
    temperature: Optional[float] = 0.7
    top_p: Optional[float] = 0.9
    stream: Optional[bool] = False


class AICompletionResponse(BaseModel):
    """Response schema for AI completions"""
    id: str
    model: str
    created: int  # timestamp
    content: str
    usage: Dict[str, int]  # token usage stats


class TaskSuggestion(BaseModel):
    """Schema for AI-generated task suggestions"""
    title: str
    description: Optional[str] = None
    priority: Optional[str] = None
    estimated_time_minutes: Optional[int] = None
    tags: List[str] = Field(default_factory=list)
    reasoning: Optional[str] = None  # AI's reasoning for suggesting this task


class TaskAnalysisRequest(BaseModel):
    """Request schema for task analysis"""
    task_description: str
    user_context: Optional[Dict[str, Any]] = None  # User's schedule, preferences, etc.


class TaskAnalysisResponse(BaseModel):
    """Response schema for task analysis"""
    estimated_time_minutes: int
    suggested_priority: str
    suggested_deadline: Optional[str] = None
    suggested_tags: List[str] = Field(default_factory=list)
    breakdown: Optional[List[Dict[str, Any]]] = None  # Task breakdown into smaller steps
    similar_past_tasks: Optional[List[Dict[str, Any]]] = None


class ProductivityInsightsRequest(BaseModel):
    """Request schema for productivity insights"""
    time_period: str  # "day", "week", "month"
    include_pomodoro_data: bool = True
    include_task_data: bool = True
    include_calendar_data: bool = True


class ProductivityInsightsResponse(BaseModel):
    """Response schema for productivity insights"""
    insights: List[str]
    focus_time_analysis: Optional[Dict[str, Any]] = None
    task_completion_analysis: Optional[Dict[str, Any]] = None
    suggestions: List[str]
    optimal_work_periods: Optional[Dict[str, Any]] = None