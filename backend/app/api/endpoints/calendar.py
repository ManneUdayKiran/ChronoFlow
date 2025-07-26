from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional
from datetime import datetime, timedelta
from app.models.user import User
from app.models.calendar_event import CalendarEvent, EventType
from app.schemas.calendar import (
    CalendarEventCreate, 
    CalendarEventUpdate, 
    CalendarEventResponse, 
    CalendarEventBulkImport,
    DateRange
)
from app.services.auth import get_current_user

router = APIRouter()


@router.post("", response_model=CalendarEventResponse, status_code=status.HTTP_201_CREATED)
async def create_calendar_event(event: CalendarEventCreate, current_user: User = Depends(get_current_user)):
    """Create a new calendar event"""
    try:
        if current_user is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Not authenticated"
            )
        
        # Validate event dates
        if event.end_time < event.start_time:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="End time cannot be before start time"
            )
        
        # Create new event using model_dump() instead of dict()
        event_data = event.model_dump()
        new_event = CalendarEvent(
            **event_data,
            user_id=str(current_user.id),
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        await new_event.insert()
        
        return CalendarEventResponse(
            id=str(new_event.id),
            user_id=str(new_event.user_id),
            title=new_event.title,
            description=new_event.description,
            start_time=new_event.start_time,
            end_time=new_event.end_time,
            all_day=new_event.all_day,
            location=new_event.location,
            event_type=new_event.event_type,
            color=new_event.color,
            recurring=new_event.recurring,
            recurring_pattern=new_event.recurring_pattern,
            reminder_minutes=new_event.reminder_minutes,
            attendees=new_event.attendees,
            external_id=new_event.external_id,
            external_calendar_id=new_event.external_calendar_id,
            created_at=new_event.created_at,
            updated_at=new_event.updated_at,
            related_task_id=new_event.related_task_id
        )
    
    except Exception as e:
        import traceback
        print(f"Error creating calendar event: {str(e)}")
        print(f"Traceback: {traceback.format_exc()}")
        print(f"Event data: {event}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create calendar event: {str(e)}"
        )


@router.post("/bulk", response_model=List[CalendarEventResponse], status_code=status.HTTP_201_CREATED)
async def bulk_import_events(import_data: CalendarEventBulkImport, current_user: User = Depends(get_current_user)):
    """Bulk import calendar events"""
    if current_user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )
    
    # Create events
    created_events = []
    for event_data in import_data.events:
        # Validate event dates
        if event_data.end_time < event_data.start_time:
            continue  # Skip invalid events
        
        new_event = CalendarEvent(
            **event_data.model_dump(),
            user_id=str(current_user.id),
            external_calendar_id=import_data.external_calendar_id,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        await new_event.insert()
        created_events.append(new_event)
    
    return [
        CalendarEventResponse(
            id=str(event.id),
            user_id=str(event.user_id),
            title=event.title,
            description=event.description,
            start_time=event.start_time,
            end_time=event.end_time,
            all_day=event.all_day,
            location=event.location,
            event_type=event.event_type,
            color=event.color,
            recurring=event.recurring,
            recurring_pattern=event.recurring_pattern,
            reminder_minutes=event.reminder_minutes,
            attendees=event.attendees,
            external_id=event.external_id,
            external_calendar_id=event.external_calendar_id,
            created_at=event.created_at,
            updated_at=event.updated_at,
            related_task_id=event.related_task_id
        ) for event in created_events
    ]


@router.get("", response_model=List[CalendarEventResponse])
async def get_calendar_events(
    start_date: datetime = Query(..., description="Start date for events query"),
    end_date: datetime = Query(..., description="End date for events query"),
    event_type: Optional[EventType] = None,
    current_user: User = Depends(get_current_user)
):
    """Get calendar events within a date range"""
    if current_user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )
    
    # Build query
    query = {"user_id": str(current_user.id)}
    
    # Date range query
    # Events that start within the range or end within the range or span across the range
    query["$or"] = [
        {"start_time": {"$gte": start_date, "$lte": end_date}},  # Starts within range
        {"end_time": {"$gte": start_date, "$lte": end_date}},    # Ends within range
        {"$and": [{"start_time": {"$lte": start_date}}, {"end_time": {"$gte": end_date}}]}  # Spans across range
    ]
    
    if event_type:
        query["event_type"] = event_type
    
    # Execute query
    events = await CalendarEvent.find(query).sort([("start_time", 1)]).to_list()
    
    return [
        CalendarEventResponse(
            id=str(event.id),
            user_id=str(event.user_id),
            title=event.title,
            description=event.description,
            start_time=event.start_time,
            end_time=event.end_time,
            all_day=event.all_day,
            location=event.location,
            event_type=event.event_type,
            color=event.color,
            recurring=event.recurring,
            recurring_pattern=event.recurring_pattern,
            reminder_minutes=event.reminder_minutes,
            attendees=event.attendees,
            external_id=event.external_id,
            external_calendar_id=event.external_calendar_id,
            created_at=event.created_at,
            updated_at=event.updated_at,
            related_task_id=event.related_task_id
        ) for event in events
    ]


@router.get("/{event_id}", response_model=CalendarEventResponse)
async def get_calendar_event(event_id: str, current_user: User = Depends(get_current_user)):
    """Get a specific calendar event by ID"""
    if current_user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )
    
    event = await CalendarEvent.get(event_id)
    
    if not event or str(event.user_id) != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found"
        )
    
    return CalendarEventResponse(
        id=str(event.id),
        user_id=str(event.user_id),
        title=event.title,
        description=event.description,
        start_time=event.start_time,
        end_time=event.end_time,
        all_day=event.all_day,
        location=event.location,
        event_type=event.event_type,
        color=event.color,
        recurring=event.recurring,
        recurring_pattern=event.recurring_pattern,
        reminder_minutes=event.reminder_minutes,
        attendees=event.attendees,
        external_id=event.external_id,
        external_calendar_id=event.external_calendar_id,
        created_at=event.created_at,
        updated_at=event.updated_at,
        related_task_id=event.related_task_id
    )


@router.put("/{event_id}", response_model=CalendarEventResponse)
async def update_calendar_event(event_id: str, event_update: CalendarEventUpdate, current_user: User = Depends(get_current_user)):
    """Update a specific calendar event"""
    if current_user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )
    
    event = await CalendarEvent.get(event_id)
    
    if not event or str(event.user_id) != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found"
        )
    
    # Update event fields
    update_data = event_update.dict(exclude_unset=True)
    
    # Validate start/end times if both are provided
    if "start_time" in update_data and "end_time" in update_data:
        if update_data["end_time"] < update_data["start_time"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="End time cannot be before start time"
            )
    # Validate if only start_time is updated
    elif "start_time" in update_data and update_data["start_time"] > event.end_time:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Start time cannot be after current end time"
        )
    # Validate if only end_time is updated
    elif "end_time" in update_data and update_data["end_time"] < event.start_time:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="End time cannot be before current start time"
        )
    
    # Update the event
    for field, value in update_data.items():
        setattr(event, field, value)
    
    event.updated_at = datetime.utcnow()
    await event.save()
    
    return CalendarEventResponse(
        id=str(event.id),
        user_id=str(event.user_id),
        title=event.title,
        description=event.description,
        start_time=event.start_time,
        end_time=event.end_time,
        all_day=event.all_day,
        location=event.location,
        event_type=event.event_type,
        color=event.color,
        recurring=event.recurring,
        recurring_pattern=event.recurring_pattern,
        reminder_minutes=event.reminder_minutes,
        attendees=event.attendees,
        external_id=event.external_id,
        external_calendar_id=event.external_calendar_id,
        created_at=event.created_at,
        updated_at=event.updated_at,
        related_task_id=event.related_task_id
    )


@router.delete("/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_calendar_event(event_id: str, current_user: User = Depends(get_current_user)):
    """Delete a specific calendar event"""
    if current_user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )
    
    event = await CalendarEvent.get(event_id)
    
    if not event or str(event.user_id) != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found"
        )
    
    await event.delete()
    
    return None