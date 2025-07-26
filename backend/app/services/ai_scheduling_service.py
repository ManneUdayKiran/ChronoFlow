import json
from datetime import datetime, timedelta, time
from typing import List, Dict, Any, Optional
from app.services.ai_service import ai_service
from app.services.google_calendar_service import google_calendar_service
from app.schemas.ai import AIMessage, AICompletionRequest
from app.schemas.scheduling import (
    TaskForScheduling,
    CalendarEvent,
    FreeTimeSlot,
    SchedulingRequest,
    ScheduledTaskResult,
    SchedulingResponse,
    UserSchedulingPreferences,
    AISchedulingPrompt
)
from app.models.user_preferences import UserPreferences
from app.models.scheduled_task import ScheduledTask, ScheduleStatus
from app.models.task import Task


class AISchedulingService:
    """Service for AI-powered task scheduling"""
    
    def __init__(self):
        self.ai_service = ai_service
        self.calendar_service = google_calendar_service
    
    async def schedule_tasks(
        self, 
        request: SchedulingRequest,
        user_access_token: Optional[str] = None
    ) -> SchedulingResponse:
        """Main method to schedule tasks using AI"""
        
        try:
            # 1. Get user preferences
            user_prefs = await UserPreferences.find_one(
                UserPreferences.user_id == request.user_id
            )
            if not user_prefs:
                user_prefs = await self._create_default_preferences(request.user_id)
            
            # 2. Get calendar events if enabled
            calendar_events = []
            if request.include_google_calendar and user_access_token and user_prefs.sync_with_google_calendar:
                calendar_events = await self.calendar_service.get_user_calendar_events(
                    access_token=user_access_token,
                    calendar_id=user_prefs.google_calendar_id or "primary",
                    start_time=request.date_range_start,
                    end_time=request.date_range_end
                )
            
            # 3. Calculate free time slots
            free_slots = self.calendar_service.calculate_free_time_slots(
                events=calendar_events,
                start_time=request.date_range_start,
                end_time=request.date_range_end,
                user_preferences=user_prefs.dict(),
                minimum_slot_minutes=user_prefs.minimum_focus_block_minutes
            )
            
            # 4. Filter and sort free slots by quality
            quality_slots = [slot for slot in free_slots if slot.quality_score >= 0.3]
            quality_slots.sort(key=lambda x: x.quality_score, reverse=True)
            
            # 5. Create AI prompt and get scheduling recommendations
            ai_prompt = self._create_scheduling_prompt(
                tasks=request.tasks,
                free_slots=quality_slots,
                user_preferences=self._convert_user_prefs_to_schema(user_prefs),
                existing_events=calendar_events,
                user_productivity_patterns=user_prefs.productivity_scores_by_hour
            )
            
            # 6. Get AI recommendations
            ai_response = await self._get_ai_scheduling_recommendations(ai_prompt)
            
            # 7. Process AI response and create scheduled tasks
            scheduled_tasks = []
            unscheduled_tasks = []
            
            for task in request.tasks:
                ai_schedule = next(
                    (s for s in ai_response["scheduled_tasks"] if s["task_id"] == task.task_id), 
                    None
                )
                
                if ai_schedule:
                    # Create scheduled task
                    scheduled_task = await self._create_scheduled_task(
                        user_id=request.user_id,
                        task=task,
                        ai_schedule=ai_schedule,
                        user_prefs=user_prefs
                    )
                    
                    # Create calendar event if enabled
                    calendar_event_id = None
                    if user_prefs.create_calendar_events and user_access_token:
                        calendar_event_id = await self.calendar_service.create_calendar_event(
                            access_token=user_access_token,
                            title=f"📋 {task.title}",
                            description=task.description or "",
                            start_time=scheduled_task.scheduled_start,
                            end_time=scheduled_task.scheduled_end
                        )
                    
                    scheduled_tasks.append(ScheduledTaskResult(
                        task_id=task.task_id,
                        title=task.title,
                        scheduled_start=scheduled_task.scheduled_start,
                        scheduled_end=scheduled_task.scheduled_end,
                        duration_minutes=scheduled_task.duration_minutes,
                        confidence_score=scheduled_task.ai_confidence_score or 0.5,
                        reasoning=scheduled_task.ai_reasoning or "AI-optimized scheduling",
                        calendar_event_id=calendar_event_id
                    ))
                else:
                    unscheduled_tasks.append(task.task_id)
            
            # 8. Calculate efficiency metrics
            total_time = sum(t.duration_minutes for t in scheduled_tasks)
            efficiency_score = len(scheduled_tasks) / len(request.tasks) if request.tasks else 0
            
            return SchedulingResponse(
                success=True,
                scheduled_tasks=scheduled_tasks,
                unscheduled_tasks=unscheduled_tasks,
                scheduling_summary=ai_response.get("summary", f"Scheduled {len(scheduled_tasks)} of {len(request.tasks)} tasks"),
                recommendations=ai_response.get("recommendations", []),
                total_scheduled_time_minutes=total_time,
                schedule_efficiency_score=efficiency_score
            )
            
        except Exception as e:
            return SchedulingResponse(
                success=False,
                scheduled_tasks=[],
                unscheduled_tasks=[task.task_id for task in request.tasks],
                scheduling_summary=f"Scheduling failed: {str(e)}",
                recommendations=["Please try again or contact support"]
            )
    
    async def reschedule_task(
        self, 
        scheduled_task_id: str, 
        new_start_time: datetime,
        user_access_token: Optional[str] = None
    ) -> bool:
        """Reschedule a specific task"""
        
        try:
            # Get the scheduled task
            scheduled_task = await ScheduledTask.get(scheduled_task_id)
            if not scheduled_task:
                return False
            
            # Update the scheduled task
            original_start = scheduled_task.scheduled_start
            scheduled_task.original_scheduled_start = original_start
            scheduled_task.scheduled_start = new_start_time
            scheduled_task.scheduled_end = new_start_time + timedelta(minutes=scheduled_task.duration_minutes)
            scheduled_task.reschedule_count += 1
            scheduled_task.updated_at = datetime.utcnow()
            
            await scheduled_task.save()
            
            # Update calendar event if exists
            if user_access_token and scheduled_task.calendar_context:
                calendar_event_id = scheduled_task.calendar_context.get("calendar_event_id")
                if calendar_event_id:
                    await self.calendar_service.update_calendar_event(
                        access_token=user_access_token,
                        event_id=calendar_event_id,
                        start_time=scheduled_task.scheduled_start,
                        end_time=scheduled_task.scheduled_end
                    )
            
            return True
            
        except Exception as e:
            print(f"Error rescheduling task: {e}")
            return False
    
    async def _create_default_preferences(self, user_id: str) -> UserPreferences:
        """Create default user preferences"""
        prefs = UserPreferences(user_id=user_id)
        await prefs.save()
        return prefs
    
    def _convert_user_prefs_to_schema(self, user_prefs: UserPreferences) -> UserSchedulingPreferences:
        """Convert UserPreferences model to schema"""
        return UserSchedulingPreferences(
            work_start_time=user_prefs.work_start_time,
            work_end_time=user_prefs.work_end_time,
            work_style=user_prefs.work_style.value,
            peak_hours_start=user_prefs.peak_hours_start,
            peak_hours_end=user_prefs.peak_hours_end,
            buffer_time_minutes=user_prefs.buffer_time_minutes,
            prefer_morning_for_hard_tasks=user_prefs.prefer_morning_for_hard_tasks,
            avoid_scheduling_after=user_prefs.avoid_scheduling_after,
            minimum_focus_block_minutes=user_prefs.minimum_focus_block_minutes,
            maximum_focus_block_minutes=user_prefs.maximum_focus_block_minutes
        )
    
    def _create_scheduling_prompt(
        self,
        tasks: List[TaskForScheduling],
        free_slots: List[FreeTimeSlot],
        user_preferences: UserSchedulingPreferences,
        existing_events: List[CalendarEvent],
        user_productivity_patterns: Optional[Dict[int, float]] = None
    ) -> AISchedulingPrompt:
        """Create structured prompt for AI scheduling"""
        
        return AISchedulingPrompt(
            tasks=tasks,
            free_slots=free_slots,
            user_preferences=user_preferences,
            existing_events=existing_events,
            user_productivity_patterns=user_productivity_patterns or {}
        )
    
    async def _get_ai_scheduling_recommendations(self, prompt: AISchedulingPrompt) -> Dict[str, Any]:
        """Get AI scheduling recommendations"""
        
        system_prompt = """You are an expert AI productivity assistant specializing in optimal task scheduling. 
        Your goal is to create the most efficient and personalized schedule possible.

        SCHEDULING PRINCIPLES:
        1. Respect user's work hours and preferences
        2. Match task difficulty to user's energy levels
        3. Include buffer time between tasks
        4. Prioritize urgent/high-priority tasks
        5. Consider task dependencies
        6. Optimize for user's productivity patterns
        7. Leave time for breaks and unexpected interruptions

        OUTPUT FORMAT: Return a valid JSON object with this exact structure:
        {
            "scheduled_tasks": [
                {
                    "task_id": "string",
                    "scheduled_start": "2025-07-26T14:00:00",
                    "scheduled_end": "2025-07-26T15:30:00", 
                    "duration_minutes": 90,
                    "confidence_score": 0.85,
                    "reasoning": "Scheduled during high-energy hours for optimal focus"
                }
            ],
            "summary": "Successfully scheduled X of Y tasks based on availability and preferences",
            "recommendations": [
                "Consider breaking down large tasks into smaller chunks",
                "Schedule breaks between intense focus sessions"
            ],
            "optimization_score": 0.92
        }"""
        
        # Create user prompt with all context
        user_prompt = f"""
        SCHEDULE THESE TASKS:
        {json.dumps([task.dict() for task in prompt.tasks], indent=2, default=str)}

        AVAILABLE TIME SLOTS:
        {json.dumps([slot.dict() for slot in prompt.free_slots], indent=2, default=str)}

        USER PREFERENCES:
        {json.dumps(prompt.user_preferences.dict(), indent=2, default=str)}

        EXISTING CALENDAR EVENTS:
        {json.dumps([event.dict() for event in prompt.existing_events], indent=2, default=str)}

        USER PRODUCTIVITY PATTERNS (hour -> score):
        {json.dumps(prompt.user_productivity_patterns, indent=2)}

        Create an optimal schedule that maximizes productivity while respecting user preferences and constraints.
        Focus on matching high-priority/difficult tasks to high-energy time slots.
        """
        
        messages = [
            AIMessage(role="system", content=system_prompt),
            AIMessage(role="user", content=user_prompt)
        ]
        
        request = AICompletionRequest(
            messages=messages,
            model="anthropic/claude-3-haiku:beta",  # Use faster model for scheduling
            temperature=0.2,  # Low temperature for consistent scheduling
            max_tokens=2000
        )
        
        try:
            response = await self.ai_service.generate_completion(request)
            return json.loads(response.content)
        except json.JSONDecodeError:
            # Fallback response if AI doesn't return valid JSON
            return {
                "scheduled_tasks": [],
                "summary": "AI scheduling temporarily unavailable",
                "recommendations": ["Please try manual scheduling"],
                "optimization_score": 0.0
            }
    
    async def _create_scheduled_task(
        self,
        user_id: str,
        task: TaskForScheduling,
        ai_schedule: Dict[str, Any],
        user_prefs: UserPreferences
    ) -> ScheduledTask:
        """Create and save a scheduled task"""
        
        start_time = datetime.fromisoformat(ai_schedule["scheduled_start"])
        end_time = datetime.fromisoformat(ai_schedule["scheduled_end"])
        
        scheduled_task = ScheduledTask(
            user_id=user_id,
            task_id=task.task_id,
            title=task.title,
            description=task.description,
            scheduled_start=start_time,
            scheduled_end=end_time,
            duration_minutes=ai_schedule["duration_minutes"],
            status=ScheduleStatus.SCHEDULED,
            ai_confidence_score=ai_schedule.get("confidence_score", 0.5),
            ai_reasoning=ai_schedule.get("reasoning", "AI-optimized scheduling"),
            user_preferences=user_prefs.dict(),
            calendar_context={"original_task": task.dict()}
        )
        
        await scheduled_task.save()
        return scheduled_task


# Create a singleton instance
ai_scheduling_service = AISchedulingService()
