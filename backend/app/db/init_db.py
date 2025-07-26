import logging
from beanie import init_beanie
from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings
from app.models.user import User
from app.models.task import Task
from app.models.calendar_event import CalendarEvent
from app.models.pomodoro_session import PomodoroSession
from app.models.pomodoro_settings import PomodoroSettings
from app.models.scheduled_task import ScheduledTask
from app.models.user_preferences import UserPreferences

logger = logging.getLogger(__name__)


async def init_db():
    """Initialize database connection and register document models"""
    try:
        # Create Motor client
        client = AsyncIOMotorClient(settings.MONGODB_URL)
        
        # Initialize Beanie with document models
        await init_beanie(
            database=client[settings.MONGODB_DB_NAME],
            document_models=[
                User,
                Task,
                CalendarEvent,
                PomodoroSession,
                PomodoroSettings,
                ScheduledTask,
                UserPreferences,
            ],
        )
        
        logger.info("Connected to MongoDB")
    except Exception as e:
        logger.error(f"Failed to connect to MongoDB: {e}")
        raise