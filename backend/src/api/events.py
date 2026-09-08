from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Dict, Any
from datetime import datetime
from src.models.user import User
from src.models.event import Event
from src.api.auth import get_current_user
from pydantic import BaseModel

router = APIRouter()

class EventCreate(BaseModel):
    title: str
    description: str
    theme: str
    date: datetime
    duration_minutes: int = 60
    image_url: str = None
    max_participants: int = 50

@router.get("/", response_model=List[Event])
async def get_events(
    skip: int = 0,
    limit: int = 20,
    current_user: User = Depends(get_current_user)
):
    """List upcoming events"""
    events = await Event.find(
        Event.date >= datetime.utcnow()
    ).sort("date").skip(skip).limit(limit).to_list()
    return events

@router.post("/", response_model=Event)
async def create_event(
    event_data: EventCreate,
    current_user: User = Depends(get_current_user)
):
    """Create a new event (Admin only ideally, but open for now)"""
    # TODO: Check if admin
    
    event = Event(
        **event_data.dict(),
        created_by=str(current_user.id),
        participants=[str(current_user.id)] # Creator joins automatically
    )
    await event.insert()
    return event

@router.post("/{event_id}/join")
async def join_event(
    event_id: str,
    current_user: User = Depends(get_current_user)
):
    """Join an event"""
    event = await Event.get(event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
        
    if str(current_user.id) in event.participants:
        return {"message": "Already joined"}
        
    if len(event.participants) >= event.max_participants:
        raise HTTPException(status_code=400, detail="Event is full")
        
    event.participants.append(str(current_user.id))
    await event.save()
    
    return {"message": "Joined successfully", "participants_count": len(event.participants)}

@router.post("/{event_id}/leave")
async def leave_event(
    event_id: str,
    current_user: User = Depends(get_current_user)
):
    """Leave an event"""
    event = await Event.get(event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
        
    if str(current_user.id) in event.participants:
        event.participants.remove(str(current_user.id))
        await event.save()
        
    return {"message": "Left successfully"}

