from fastapi import APIRouter
from app.api.endpoints import auth, tasks, calendar, pomodoro, ai, users, ai_scheduler

api_router = APIRouter()

# Include all endpoint routers
api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(tasks.router, prefix="/tasks", tags=["tasks"])
api_router.include_router(calendar.router, prefix="/calendar", tags=["calendar"])
api_router.include_router(pomodoro.router, prefix="/pomodoro", tags=["pomodoro"])
api_router.include_router(ai.router, prefix="/ai", tags=["ai"])
api_router.include_router(ai_scheduler.router, prefix="/ai-scheduler", tags=["ai-scheduler"])