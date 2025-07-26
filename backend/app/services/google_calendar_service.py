import httpx
import json
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from app.schemas.scheduling import CalendarEvent, FreeTimeSlot
from app.core.config import settings
import asyncio


class GoogleCalendarService:
    """Service for integrating with Google Calendar API"""
    
    def __init__(self):
        self.base_url = "https://www.googleapis.com/calendar/v3"
        
    async def get_user_calendar_events(
        self, 
        access_token: str, 
        calendar_id: str = "primary",
        start_time: datetime = None,
        end_time: datetime = None
    ) -> List[CalendarEvent]:
        """Fetch user's calendar events from Google Calendar"""
        
        if not start_time:
            start_time = datetime.now()
        if not end_time:
            end_time = start_time + timedelta(days=7)
            
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        }
        
        params = {
            "timeMin": start_time.isoformat() + "Z",
            "timeMax": end_time.isoformat() + "Z",
            "singleEvents": True,
            "orderBy": "startTime",
            "maxResults": 250
        }
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/calendars/{calendar_id}/events",
                    headers=headers,
                    params=params,
                    timeout=30.0
                )
                
                if response.status_code != 200:
                    raise Exception(f"Google Calendar API error: {response.status_code} - {response.text}")
                
                data = response.json()
                events = []
                
                for event in data.get("items", []):
                    # Skip events without start/end times or all-day events
                    if "dateTime" not in event.get("start", {}) or "dateTime" not in event.get("end", {}):
                        continue
                        
                    start_dt = datetime.fromisoformat(event["start"]["dateTime"].replace("Z", "+00:00"))
                    end_dt = datetime.fromisoformat(event["end"]["dateTime"].replace("Z", "+00:00"))
                    
                    # Determine if event blocks time (not tentative/free)
                    is_busy = event.get("transparency", "opaque") == "opaque"
                    
                    events.append(CalendarEvent(
                        event_id=event["id"],
                        title=event.get("summary", "Untitled Event"),
                        start_time=start_dt,
                        end_time=end_dt,
                        is_busy=is_busy,
                        event_type=self._categorize_event(event.get("summary", ""))
                    ))
                
                return events
                
        except Exception as e:
            print(f"Error fetching calendar events: {e}")
            return []
    
    async def create_calendar_event(
        self,
        access_token: str,
        title: str,
        description: str,
        start_time: datetime,
        end_time: datetime,
        calendar_id: str = "primary"
    ) -> Optional[str]:
        """Create a new event in Google Calendar"""
        
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        }
        
        event_data = {
            "summary": title,
            "description": description,
            "start": {
                "dateTime": start_time.isoformat(),
                "timeZone": "UTC"
            },
            "end": {
                "dateTime": end_time.isoformat(),
                "timeZone": "UTC"
            },
            "reminders": {
                "useDefault": False,
                "overrides": [
                    {"method": "popup", "minutes": 15}
                ]
            }
        }
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/calendars/{calendar_id}/events",
                    headers=headers,
                    json=event_data,
                    timeout=30.0
                )
                
                if response.status_code not in [200, 201]:
                    raise Exception(f"Google Calendar API error: {response.status_code} - {response.text}")
                
                result = response.json()
                return result.get("id")
                
        except Exception as e:
            print(f"Error creating calendar event: {e}")
            return None
    
    async def update_calendar_event(
        self,
        access_token: str,
        event_id: str,
        title: str = None,
        description: str = None,
        start_time: datetime = None,
        end_time: datetime = None,
        calendar_id: str = "primary"
    ) -> bool:
        """Update an existing calendar event"""
        
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        }
        
        # First, get the existing event
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/calendars/{calendar_id}/events/{event_id}",
                    headers=headers,
                    timeout=30.0
                )
                
                if response.status_code != 200:
                    return False
                    
                event_data = response.json()
                
                # Update only the provided fields
                if title:
                    event_data["summary"] = title
                if description:
                    event_data["description"] = description
                if start_time:
                    event_data["start"]["dateTime"] = start_time.isoformat()
                if end_time:
                    event_data["end"]["dateTime"] = end_time.isoformat()
                
                # Update the event
                response = await client.put(
                    f"{self.base_url}/calendars/{calendar_id}/events/{event_id}",
                    headers=headers,
                    json=event_data,
                    timeout=30.0
                )
                
                return response.status_code == 200
                
        except Exception as e:
            print(f"Error updating calendar event: {e}")
            return False
    
    async def delete_calendar_event(
        self,
        access_token: str,
        event_id: str,
        calendar_id: str = "primary"
    ) -> bool:
        """Delete a calendar event"""
        
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        }
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.delete(
                    f"{self.base_url}/calendars/{calendar_id}/events/{event_id}",
                    headers=headers,
                    timeout=30.0
                )
                
                return response.status_code == 204
                
        except Exception as e:
            print(f"Error deleting calendar event: {e}")
            return False
    
    def calculate_free_time_slots(
        self,
        events: List[CalendarEvent],
        start_time: datetime,
        end_time: datetime,
        user_preferences: Dict[str, Any],
        minimum_slot_minutes: int = 15
    ) -> List[FreeTimeSlot]:
        """Calculate free time slots between calendar events"""
        
        # Sort events by start time
        busy_events = [e for e in events if e.is_busy]
        busy_events.sort(key=lambda x: x.start_time)
        
        free_slots = []
        current_time = start_time
        
        for event in busy_events:
            # If there's a gap before this event
            if current_time < event.start_time:
                slot_duration = int((event.start_time - current_time).total_seconds() / 60)
                
                if slot_duration >= minimum_slot_minutes:
                    quality_score = self._calculate_slot_quality(
                        current_time, 
                        event.start_time, 
                        user_preferences
                    )
                    
                    free_slots.append(FreeTimeSlot(
                        start_time=current_time,
                        end_time=event.start_time,
                        duration_minutes=slot_duration,
                        quality_score=quality_score
                    ))
            
            # Move current time to after this event
            current_time = max(current_time, event.end_time)
        
        # Check for time after the last event
        if current_time < end_time:
            slot_duration = int((end_time - current_time).total_seconds() / 60)
            
            if slot_duration >= minimum_slot_minutes:
                quality_score = self._calculate_slot_quality(
                    current_time, 
                    end_time, 
                    user_preferences
                )
                
                free_slots.append(FreeTimeSlot(
                    start_time=current_time,
                    end_time=end_time,
                    duration_minutes=slot_duration,
                    quality_score=quality_score
                ))
        
        return free_slots
    
    def _categorize_event(self, title: str) -> str:
        """Simple event categorization based on title"""
        title_lower = title.lower()
        
        if any(word in title_lower for word in ["meeting", "call", "conference", "interview"]):
            return "meeting"
        elif any(word in title_lower for word in ["lunch", "dinner", "coffee", "break"]):
            return "personal"
        elif any(word in title_lower for word in ["doctor", "appointment", "dentist"]):
            return "appointment"
        elif any(word in title_lower for word in ["focus", "work", "code", "write"]):
            return "focus_time"
        else:
            return "other"
    
    def _calculate_slot_quality(
        self, 
        start_time: datetime, 
        end_time: datetime, 
        user_preferences: Dict[str, Any]
    ) -> float:
        """Calculate quality score for a time slot based on user preferences"""
        
        # Default quality score
        quality = 0.5
        
        # Get hour of the day for the start of the slot
        hour = start_time.hour
        
        # Check if it's within work hours
        # Handle both old integer format and new string format
        work_start_time = user_preferences.get("work_start_time", "09:00")
        work_end_time = user_preferences.get("work_end_time", "17:00")
        
        # Convert time strings to hours for comparison
        try:
            if isinstance(work_start_time, str):
                # Handle both "HH:MM" format and datetime strings
                if "T" in work_start_time:
                    # Extract time from datetime string like "2025-07-26T14:00:00"
                    time_part = work_start_time.split("T")[1].split(":")[0]
                    work_start = int(time_part)
                else:
                    # Normal "HH:MM" format
                    work_start = int(work_start_time.split(":")[0])
            else:
                work_start = user_preferences.get("work_start_hour", 9)
                
            if isinstance(work_end_time, str):
                # Handle both "HH:MM" format and datetime strings
                if "T" in work_end_time:
                    # Extract time from datetime string like "2025-07-26T17:00:00"
                    time_part = work_end_time.split("T")[1].split(":")[0]
                    work_end = int(time_part)
                else:
                    # Normal "HH:MM" format
                    work_end = int(work_end_time.split(":")[0])
            else:
                work_end = user_preferences.get("work_end_hour", 17)
        except (ValueError, IndexError):
            # Fallback to default values if parsing fails
            work_start = 9
            work_end = 17
        
        if work_start <= hour < work_end:
            quality += 0.3
        
        # Check if it's during peak productivity hours
        peak_start_time = user_preferences.get("peak_hours_start", "10:00")
        peak_end_time = user_preferences.get("peak_hours_end", "12:00")
        
        # Convert time strings to hours for comparison
        try:
            if isinstance(peak_start_time, str):
                # Handle both "HH:MM" format and datetime strings
                if "T" in peak_start_time:
                    # Extract time from datetime string like "2025-07-26T10:00:00"
                    time_part = peak_start_time.split("T")[1].split(":")[0]
                    peak_start = int(time_part)
                else:
                    # Normal "HH:MM" format
                    peak_start = int(peak_start_time.split(":")[0])
            else:
                peak_start = user_preferences.get("peak_hours_start", 10)
                
            if isinstance(peak_end_time, str):
                # Handle both "HH:MM" format and datetime strings
                if "T" in peak_end_time:
                    # Extract time from datetime string like "2025-07-26T12:00:00"
                    time_part = peak_end_time.split("T")[1].split(":")[0]
                    peak_end = int(time_part)
                else:
                    # Normal "HH:MM" format
                    peak_end = int(peak_end_time.split(":")[0])
            else:
                peak_end = user_preferences.get("peak_hours_end", 12)
        except (ValueError, IndexError):
            # Fallback to default values if parsing fails
            peak_start = 10
            peak_end = 12
        
        if peak_start <= hour < peak_end:
            quality += 0.3
        
        # Check user work style preferences
        work_style = user_preferences.get("work_style", "flexible")
        
        if work_style == "morning_person" and hour < 12:
            quality += 0.2
        elif work_style == "evening_person" and hour >= 15:
            quality += 0.2
        
        # Penalty for very early or very late hours
        if hour < 7 or hour > 20:
            quality -= 0.3
        
        # Bonus for longer slots
        duration_minutes = (end_time - start_time).total_seconds() / 60
        if duration_minutes >= 60:
            quality += 0.1
        if duration_minutes >= 120:
            quality += 0.1
        
        # Ensure quality is between 0 and 1
        return max(0.0, min(1.0, quality))


# Create a singleton instance
google_calendar_service = GoogleCalendarService()
