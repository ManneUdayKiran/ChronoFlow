import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.config import settings
import os
import json
from datetime import datetime, timedelta

# Create a test client
client = TestClient(app)

# Test data
test_user = {
    "email": "test@example.com",
    "password": "testpassword123",
    "username": "testuser",
    "full_name": "Test User"
}

test_task = {
    "title": "Test Task",
    "description": "This is a test task",
    "priority": "MEDIUM",
    "status": "TODO",
    "deadline": (datetime.utcnow() + timedelta(days=1)).isoformat(),
    "estimated_time_minutes": 60,
    "tags": ["test", "api"]
}

test_calendar_event = {
    "title": "Test Event",
    "description": "This is a test event",
    "start_time": (datetime.utcnow() + timedelta(hours=1)).isoformat(),
    "end_time": (datetime.utcnow() + timedelta(hours=2)).isoformat(),
    "event_type": "MEETING",
    "color": "#FF5733"
}

test_pomodoro_session = {
    "session_type": "FOCUS",
    "duration_minutes": 25,
    "status": "COMPLETED",
    "start_time": datetime.utcnow().isoformat(),
    "end_time": (datetime.utcnow() + timedelta(minutes=25)).isoformat()
}


@pytest.fixture
def auth_headers():
    # Register a test user
    response = client.post(
        f"{settings.API_V1_PREFIX}/auth/register",
        json=test_user
    )
    
    # If user already exists, login instead
    if response.status_code == 400:
        response = client.post(
            f"{settings.API_V1_PREFIX}/auth/login",
            data={"username": test_user["email"], "password": test_user["password"]}
        )
    
    # Get the token
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_root():
    response = client.get("/")
    assert response.status_code == 200
    assert "ChronoFlow API" in response.json()["message"]


def test_auth_endpoints(auth_headers):
    # Test getting current user
    response = client.get(
        f"{settings.API_V1_PREFIX}/auth/me",
        headers=auth_headers
    )
    assert response.status_code == 200
    assert response.json()["email"] == test_user["email"]


def test_task_endpoints(auth_headers):
    # Create a task
    response = client.post(
        f"{settings.API_V1_PREFIX}/tasks/",
        json=test_task,
        headers=auth_headers
    )
    assert response.status_code == 201
    task_id = response.json()["id"]
    
    # Get the task
    response = client.get(
        f"{settings.API_V1_PREFIX}/tasks/{task_id}",
        headers=auth_headers
    )
    assert response.status_code == 200
    assert response.json()["title"] == test_task["title"]
    
    # Update the task
    updated_task = {"title": "Updated Test Task"}
    response = client.patch(
        f"{settings.API_V1_PREFIX}/tasks/{task_id}",
        json=updated_task,
        headers=auth_headers
    )
    assert response.status_code == 200
    assert response.json()["title"] == updated_task["title"]
    
    # Delete the task
    response = client.delete(
        f"{settings.API_V1_PREFIX}/tasks/{task_id}",
        headers=auth_headers
    )
    assert response.status_code == 204


def test_calendar_endpoints(auth_headers):
    # Create a calendar event
    response = client.post(
        f"{settings.API_V1_PREFIX}/calendar/",
        json=test_calendar_event,
        headers=auth_headers
    )
    assert response.status_code == 201
    event_id = response.json()["id"]
    
    # Get the event
    response = client.get(
        f"{settings.API_V1_PREFIX}/calendar/{event_id}",
        headers=auth_headers
    )
    assert response.status_code == 200
    assert response.json()["title"] == test_calendar_event["title"]
    
    # Delete the event
    response = client.delete(
        f"{settings.API_V1_PREFIX}/calendar/{event_id}",
        headers=auth_headers
    )
    assert response.status_code == 204


def test_pomodoro_endpoints(auth_headers):
    # Create a pomodoro session
    response = client.post(
        f"{settings.API_V1_PREFIX}/pomodoro/sessions",
        json=test_pomodoro_session,
        headers=auth_headers
    )
    assert response.status_code == 201
    session_id = response.json()["id"]
    
    # Get the session
    response = client.get(
        f"{settings.API_V1_PREFIX}/pomodoro/sessions/{session_id}",
        headers=auth_headers
    )
    assert response.status_code == 200
    assert response.json()["session_type"] == test_pomodoro_session["session_type"]
    
    # Delete the session
    response = client.delete(
        f"{settings.API_V1_PREFIX}/pomodoro/sessions/{session_id}",
        headers=auth_headers
    )
    assert response.status_code == 204


def test_ai_endpoints(auth_headers):
    # Test getting available models
    response = client.get(
        f"{settings.API_V1_PREFIX}/ai/models",
        headers=auth_headers
    )
    assert response.status_code == 200
    assert len(response.json()) > 0
    
    # Test AI completion (this might fail if OpenRouter API key is not set)
    completion_request = {
        "model": "anthropic/claude-3-haiku:beta",
        "messages": [
            {"role": "user", "content": "Hello, how can I be more productive?"}
        ],
        "max_tokens": 100
    }
    
    # Only run this test if OpenRouter API key is set
    if os.getenv("OPENROUTER_API_KEY") and os.getenv("OPENROUTER_API_KEY") != "your-openrouter-api-key":
        response = client.post(
            f"{settings.API_V1_PREFIX}/ai/completion",
            json=completion_request,
            headers=auth_headers
        )
        assert response.status_code == 200
        assert "content" in response.json()