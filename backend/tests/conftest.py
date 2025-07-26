import pytest
import asyncio
from fastapi.testclient import TestClient
from beanie import init_beanie
from motor.motor_asyncio import AsyncIOMotorClient
from app.main import app
from app.core.config import settings
from app.models.user import User
from app.models.task import Task
from app.models.calendar_event import CalendarEvent
from app.models.pomodoro_session import PomodoroSession
from app.models.pomodoro_settings import PomodoroSettings
from app.services.auth import create_access_token


@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for each test case."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="session")
async def db_client():
    """Create a clean database for testing."""
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[settings.MONGODB_DB_NAME]
    
    # Initialize Beanie with the test models
    await init_beanie(
        database=db,
        document_models=[
            User,
            Task,
            CalendarEvent,
            PomodoroSession,
            PomodoroSettings
        ]
    )
    
    yield db
    
    # Clean up the database after tests
    await db.command("dropDatabase")


@pytest.fixture
def client():
    """Create a test client for the FastAPI app."""
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
async def test_user(db_client):
    """Create a test user."""
    # Delete any existing test users
    await User.find({"email": "test@example.com"}).delete()
    
    # Create a new test user
    user = User(
        email="test@example.com",
        username="testuser",
        hashed_password="$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW",  # password: testpassword123
        full_name="Test User",
        is_active=True,
        is_verified=True
    )
    
    await user.create()
    return user


@pytest.fixture
def auth_token(test_user):
    """Create an authentication token for the test user."""
    return create_access_token(data={"sub": test_user.email})


@pytest.fixture
def auth_headers(auth_token):
    """Create authorization headers with the test token."""
    return {"Authorization": f"Bearer {auth_token}"}


@pytest.fixture
async def test_task(db_client, test_user):
    """Create a test task."""
    task = Task(
        title="Test Task",
        description="This is a test task",
        user_id=str(test_user.id),
        status="TODO",
        priority="MEDIUM"
    )
    
    await task.create()
    return task


@pytest.fixture
async def test_calendar_event(db_client, test_user):
    """Create a test calendar event."""
    event = CalendarEvent(
        title="Test Event",
        user_id=str(test_user.id),
        start_time=asyncio.get_event_loop().time() + 3600,  # 1 hour from now
        end_time=asyncio.get_event_loop().time() + 7200,  # 2 hours from now
        event_type="MEETING"
    )
    
    await event.create()
    return event


@pytest.fixture
async def test_pomodoro_session(db_client, test_user):
    """Create a test pomodoro session."""
    session = PomodoroSession(
        user_id=str(test_user.id),
        session_type="FOCUS",
        duration_minutes=25,
        status="COMPLETED"
    )
    
    await session.create()
    return session