#!/usr/bin/env python
"""
Script to initialize the database with sample data for development.

Run this script after setting up the database to populate it with sample data.

Usage:
    python -m scripts.init_sample_data
"""

import asyncio
import sys
import os
from datetime import datetime, timedelta
from pathlib import Path

# Add the parent directory to the path so we can import the app modules
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.db.init_db import init_db
from app.models.user import User
from app.models.task import Task
from app.models.calendar_event import CalendarEvent
from app.models.pomodoro_session import PomodoroSession
from app.models.pomodoro_settings import PomodoroSettings
from app.core.config import settings
from passlib.context import CryptContext

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


async def create_sample_data():
    """Create sample data for development."""
    print("Initializing database...")
    await init_db()
    
    print("Creating sample users...")
    # Check if users already exist
    existing_user = await User.find_one({"email": "demo@chronoflow.app"})
    if existing_user:
        print("Sample data already exists. Skipping...")
        return
    
    # Create demo user
    demo_user = User(
        email="demo@chronoflow.app",
        username="demo",
        hashed_password=pwd_context.hash("demopassword"),
        full_name="Demo User",
        is_active=True,
        is_verified=True,
        theme_preference="light",
        notification_settings={
            "email": True,
            "push": True,
            "task_reminders": True,
            "pomodoro_alerts": True
        }
    )
    await demo_user.create()
    
    # Create admin user
    admin_user = User(
        email="admin@chronoflow.app",
        username="admin",
        hashed_password=pwd_context.hash("adminpassword"),
        full_name="Admin User",
        is_active=True,
        is_verified=True,
        is_superuser=True,
        theme_preference="dark"
    )
    await admin_user.create()
    
    # Create Pomodoro settings for demo user
    pomodoro_settings = PomodoroSettings(
        user_id=str(demo_user.id),
        focus_duration_minutes=25,
        short_break_duration_minutes=5,
        long_break_duration_minutes=15,
        long_break_interval=4,
        auto_start_breaks=True,
        auto_start_pomodoros=False,
        daily_goal_sessions=8
    )
    await pomodoro_settings.create()
    
    print("Creating sample tasks...")
    # Create sample tasks for demo user
    now = datetime.utcnow()
    
    tasks = [
        Task(
            title="Complete project proposal",
            description="Write a detailed proposal for the new client project",
            user_id=str(demo_user.id),
            status="todo",
            priority="high",
            deadline=now + timedelta(days=2),
            estimated_time_minutes=120,
            tags=["work", "client", "proposal"]
        ),
        Task(
            title="Review code pull request",
            description="Review the pull request for the new feature implementation",
            user_id=str(demo_user.id),
            status="in_progress",
            priority="medium",
            deadline=now + timedelta(days=1),
            estimated_time_minutes=45,
            tags=["work", "code", "review"]
        ),
        Task(
            title="Prepare for presentation",
            description="Create slides and practice for the team presentation",
            user_id=str(demo_user.id),
            status="todo",
            priority="high",
            deadline=now + timedelta(days=3),
            estimated_time_minutes=90,
            tags=["work", "presentation"]
        ),
        Task(
            title="Grocery shopping",
            description="Buy groceries for the week",
            user_id=str(demo_user.id),
            status="todo",
            priority="low",
            deadline=now + timedelta(days=1),
            estimated_time_minutes=30,
            tags=["personal", "shopping"]
        ),
        Task(
            title="Workout session",
            description="30-minute cardio and strength training",
            user_id=str(demo_user.id),
            status="todo",
            priority="medium",
            recurrence="WEEKLY",
            estimated_time_minutes=30,
            tags=["personal", "health", "exercise"]
        ),
        Task(
            title="Read book chapter",
            description="Read chapter 5 of 'Deep Work' by Cal Newport",
            user_id=str(demo_user.id),
            status="completed",
            completed_at=now - timedelta(days=1),
            priority="low",
            estimated_time_minutes=45,
            actual_time_minutes=40,
            tags=["personal", "reading", "development"]
        ),
    ]
    
    for task in tasks:
        await task.create()
    
    print("Creating sample calendar events...")
    # Create sample calendar events for demo user
    events = [
        CalendarEvent(
            title="Team Meeting",
            description="Weekly team sync-up",
            user_id=str(demo_user.id),
            start_time=now + timedelta(days=1, hours=10),
            end_time=now + timedelta(days=1, hours=11),
            event_type="MEETING",
            color="#4285F4",  # Google Calendar blue
            recurrence="WEEKLY",
            reminders=[15, 60]  # 15 minutes and 1 hour before
        ),
        CalendarEvent(
            title="Client Call",
            description="Discuss project requirements with the client",
            user_id=str(demo_user.id),
            start_time=now + timedelta(days=2, hours=14),
            end_time=now + timedelta(days=2, hours=15),
            event_type="CALL",
            color="#0B8043"  # Google Calendar green
        ),
        CalendarEvent(
            title="Lunch with Alex",
            description="Catch up over lunch",
            user_id=str(demo_user.id),
            start_time=now + timedelta(days=3, hours=12),
            end_time=now + timedelta(days=3, hours=13, minutes=30),
            event_type="PERSONAL",
            location="Cafe Downtown",
            color="#F4511E"  # Google Calendar red
        ),
        CalendarEvent(
            title="Dentist Appointment",
            description="Regular checkup",
            user_id=str(demo_user.id),
            start_time=now + timedelta(days=5, hours=9),
            end_time=now + timedelta(days=5, hours=10),
            event_type="APPOINTMENT",
            location="Dental Clinic",
            color="#8E24AA"  # Google Calendar purple
        ),
    ]
    
    for event in events:
        await event.create()
    
    print("Creating sample Pomodoro sessions...")
    # Create sample Pomodoro sessions for demo user
    yesterday = now - timedelta(days=1)
    sessions = [
        # Yesterday's sessions
        PomodoroSession(
            user_id=str(demo_user.id),
            session_type="FOCUS",
            duration_minutes=25,
            status="COMPLETED",
            start_time=yesterday.replace(hour=9, minute=0),
            end_time=yesterday.replace(hour=9, minute=25),
            related_task_id=str(tasks[0].id)
        ),
        PomodoroSession(
            user_id=str(demo_user.id),
            session_type="SHORT_BREAK",
            duration_minutes=5,
            status="COMPLETED",
            start_time=yesterday.replace(hour=9, minute=25),
            end_time=yesterday.replace(hour=9, minute=30)
        ),
        PomodoroSession(
            user_id=str(demo_user.id),
            session_type="FOCUS",
            duration_minutes=25,
            status="COMPLETED",
            start_time=yesterday.replace(hour=9, minute=30),
            end_time=yesterday.replace(hour=9, minute=55),
            related_task_id=str(tasks[0].id)
        ),
        PomodoroSession(
            user_id=str(demo_user.id),
            session_type="SHORT_BREAK",
            duration_minutes=5,
            status="COMPLETED",
            start_time=yesterday.replace(hour=9, minute=55),
            end_time=yesterday.replace(hour=10, minute=0)
        ),
        PomodoroSession(
            user_id=str(demo_user.id),
            session_type="FOCUS",
            duration_minutes=25,
            status="INTERRUPTED",
            start_time=yesterday.replace(hour=10, minute=0),
            end_time=yesterday.replace(hour=10, minute=15),  # Ended early
            related_task_id=str(tasks[1].id),
            interruption_reason="Phone call"
        ),
        # Today's sessions
        PomodoroSession(
            user_id=str(demo_user.id),
            session_type="FOCUS",
            duration_minutes=25,
            status="COMPLETED",
            start_time=now.replace(hour=8, minute=30),
            end_time=now.replace(hour=8, minute=55),
            related_task_id=str(tasks[2].id)
        ),
        PomodoroSession(
            user_id=str(demo_user.id),
            session_type="SHORT_BREAK",
            duration_minutes=5,
            status="COMPLETED",
            start_time=now.replace(hour=8, minute=55),
            end_time=now.replace(hour=9, minute=0)
        ),
    ]
    
    for session in sessions:
        await session.create()
    
    print("Sample data created successfully!")


if __name__ == "__main__":
    asyncio.run(create_sample_data())