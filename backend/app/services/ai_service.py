import json
import httpx
from typing import List, Dict, Any, Optional
from tenacity import retry, stop_after_attempt, wait_exponential
from app.core.config import settings
from app.schemas.ai import (
    AIMessage, 
    AICompletionRequest, 
    AICompletionResponse,
    TaskSuggestion,
    TaskAnalysisResponse,
    ProductivityInsightsResponse
)


class AIService:
    """Service for interacting with OpenRouter AI models"""
    
    def __init__(self):
        self.api_key = settings.OPENROUTER_API_KEY
        self.api_url = f"{settings.OPENROUTER_API_URL}/chat/completions"
        self.default_model = settings.OPENROUTER_DEFAULT_MODEL
        self.headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}",
            "HTTP-Referer": "https://chronoflow.app",  # Replace with your actual domain
            "X-Title": "ChronoFlow Time Management"
        }
    
    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
    async def generate_completion(self, request: AICompletionRequest) -> AICompletionResponse:
        """Generate a completion from OpenRouter API"""
        if not self.api_key:
            raise ValueError("OpenRouter API key is not configured")
        
        # Use default model if not specified
        if not request.model:
            request.model = self.default_model
        
        payload = {
            "model": request.model,
            "messages": [msg.dict() for msg in request.messages],
            "max_tokens": request.max_tokens,
            "temperature": request.temperature,
            "top_p": request.top_p,
            "stream": request.stream
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                self.api_url,
                headers=self.headers,
                json=payload,
                timeout=60.0
            )
            
            if response.status_code != 200:
                raise Exception(f"OpenRouter API error: {response.status_code} - {response.text}")
            
            result = response.json()
            
            return AICompletionResponse(
                id=result["id"],
                model=result["model"],
                created=result["created"],
                content=result["choices"][0]["message"]["content"],
                usage=result["usage"]
            )
    
    async def analyze_task(self, task_description: str, user_context: Optional[Dict[str, Any]] = None) -> TaskAnalysisResponse:
        """Analyze a task and provide insights"""
        system_prompt = (
            "You are an AI assistant specialized in task analysis and time management. "
            "Analyze the given task description and provide detailed insights about estimated time, "
            "priority, suggested deadline, relevant tags, and a potential breakdown of the task into smaller steps."
        )
        
        user_prompt = f"Task: {task_description}\n\n"
        if user_context:
            user_prompt += f"User Context: {json.dumps(user_context)}\n\n"
        
        user_prompt += (
            "Please provide a structured analysis with the following information:\n"
            "1. Estimated time in minutes\n"
            "2. Suggested priority (low, medium, high, urgent)\n"
            "3. Suggested deadline (if applicable)\n"
            "4. Relevant tags\n"
            "5. Task breakdown into smaller steps\n"
            "Format your response as a valid JSON object."
        )
        
        messages = [
            AIMessage(role="system", content=system_prompt),
            AIMessage(role="user", content=user_prompt)
        ]
        
        request = AICompletionRequest(
            messages=messages,
            model=self.default_model,
            temperature=0.3,  # Lower temperature for more deterministic responses
            max_tokens=1000
        )
        
        response = await self.generate_completion(request)
        
        try:
            # Parse the JSON response
            analysis_data = json.loads(response.content)
            
            return TaskAnalysisResponse(
                estimated_time_minutes=analysis_data.get("estimated_time_minutes", 30),
                suggested_priority=analysis_data.get("suggested_priority", "medium"),
                suggested_deadline=analysis_data.get("suggested_deadline"),
                suggested_tags=analysis_data.get("suggested_tags", []),
                breakdown=analysis_data.get("breakdown"),
                similar_past_tasks=analysis_data.get("similar_past_tasks")
            )
        except json.JSONDecodeError:
            # Fallback if response is not valid JSON
            return TaskAnalysisResponse(
                estimated_time_minutes=30,
                suggested_priority="medium",
                suggested_tags=[],
                breakdown=[{"step": "Complete the task", "estimated_minutes": 30}]
            )
    
    async def generate_task_suggestions(self, user_data: Dict[str, Any]) -> List[TaskSuggestion]:
        """Generate task suggestions based on user data"""
        system_prompt = (
            "You are an AI assistant specialized in productivity and time management. "
            "Based on the user's data, suggest meaningful tasks that would help them achieve their goals "
            "and improve their productivity. Consider their existing tasks, calendar events, and work patterns."
        )
        
        user_prompt = f"User Data: {json.dumps(user_data)}\n\n"
        user_prompt += (
            "Please suggest 3-5 tasks that would be beneficial for this user. "
            "For each task, provide:\n"
            "1. Title\n"
            "2. Description\n"
            "3. Priority (low, medium, high, urgent)\n"
            "4. Estimated time in minutes\n"
            "5. Relevant tags\n"
            "6. Brief reasoning for suggesting this task\n"
            "Format your response as a valid JSON array of task objects."
        )
        
        messages = [
            AIMessage(role="system", content=system_prompt),
            AIMessage(role="user", content=user_prompt)
        ]
        
        request = AICompletionRequest(
            messages=messages,
            model=self.default_model,
            temperature=0.7,
            max_tokens=1500
        )
        
        response = await self.generate_completion(request)
        
        try:
            # Parse the JSON response
            suggestions_data = json.loads(response.content)
            
            suggestions = []
            for item in suggestions_data:
                suggestions.append(TaskSuggestion(
                    title=item.get("title", "Suggested Task"),
                    description=item.get("description"),
                    priority=item.get("priority"),
                    estimated_time_minutes=item.get("estimated_time_minutes"),
                    tags=item.get("tags", []),
                    reasoning=item.get("reasoning")
                ))
            
            return suggestions
        except json.JSONDecodeError:
            # Fallback if response is not valid JSON
            return [TaskSuggestion(
                title="Review your goals",
                description="Take some time to review and adjust your current goals",
                priority="medium",
                estimated_time_minutes=15,
                tags=["planning", "reflection"],
                reasoning="Regular goal review helps maintain focus and direction"
            )]
    
    async def generate_productivity_insights(self, user_data: Dict[str, Any]) -> ProductivityInsightsResponse:
        """Generate productivity insights based on user data"""
        system_prompt = (
            "You are an AI assistant specialized in productivity analysis and time management. "
            "Analyze the user's data and provide meaningful insights about their productivity patterns, "
            "focus time, task completion, and suggestions for improvement."
        )
        
        user_prompt = f"User Data: {json.dumps(user_data)}\n\n"
        user_prompt += (
            "Please provide a comprehensive productivity analysis with the following sections:\n"
            "1. Key insights about productivity patterns\n"
            "2. Focus time analysis\n"
            "3. Task completion analysis\n"
            "4. Actionable suggestions for improvement\n"
            "5. Optimal work periods based on past performance\n"
            "Format your response as a valid JSON object."
        )
        
        messages = [
            AIMessage(role="system", content=system_prompt),
            AIMessage(role="user", content=user_prompt)
        ]
        
        request = AICompletionRequest(
            messages=messages,
            model=self.default_model,
            temperature=0.5,
            max_tokens=2000
        )
        
        response = await self.generate_completion(request)
        
        try:
            # Parse the JSON response
            insights_data = json.loads(response.content)
            
            return ProductivityInsightsResponse(
                insights=insights_data.get("insights", []),
                focus_time_analysis=insights_data.get("focus_time_analysis"),
                task_completion_analysis=insights_data.get("task_completion_analysis"),
                suggestions=insights_data.get("suggestions", []),
                optimal_work_periods=insights_data.get("optimal_work_periods")
            )
        except json.JSONDecodeError:
            # Fallback if response is not valid JSON
            return ProductivityInsightsResponse(
                insights=["Unable to generate detailed insights from the available data"],
                suggestions=["Try to log more data for better insights"]
            )


# Create a singleton instance
ai_service = AIService()