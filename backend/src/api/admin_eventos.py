from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from calendar import monthrange
from pydantic import BaseModel
from src.models.event import Event, EventCategory, EventStatus
from src.models.admin_rbac import AdminUser, Permission
from src.core.middleware.rbac import require_permission, log_admin_action
from src.api.auth import get_current_user


router = APIRouter()


# Request models
class CreateEventRequest(BaseModel):
    title: str
    description: str
    categoria: EventCategory
    theme: Optional[str] = None
    date: datetime
    duration_minutes: int = 60
    ubicacion: Optional[str] = None
    ciudad: Optional[str] = None
    pais: Optional[str] = None
    room_url: Optional[str] = None
    image_url: Optional[str] = None
    max_participants: int = 50
    precio: float = 0.0
    tags: List[str] = []


@router.get("/listar")
async def listar_eventos(
    categoria: Optional[EventCategory] = None,
    status_filter: Optional[EventStatus] = None,
    limit: int = Query(50, le=100),
    offset: int = 0,
    admin_user: AdminUser = Depends(require_permission(Permission.VIEW_EVENTS))
) -> List[Dict[str, Any]]:
    """List all events with filters - Admin only"""
    
    # Build query
    query = {}
    if categoria:
        query["categoria"] = categoria
    if status_filter:
        query["status"] = status_filter
    
    # Get events
    events = await Event.find(query).sort(-Event.date).skip(offset).limit(limit).to_list()
    
    return [
        {
            "id": str(event.id),
            "title": event.title,
            "description": event.description,
            "categoria": event.categoria,
            "date": event.date.isoformat(),
            "status": event.status,
            "activo": event.activo,
            "attendance_count": event.get_attendance_count(),
            "interest_count": event.get_interest_count(),
            "max_participants": event.max_participants,
            "ubicacion": event.ubicacion,
            "ciudad": event.ciudad
        }
        for event in events
    ]


@router.get("/calendario")
async def get_calendar_view(
    month: int = Query(..., ge=1, le=12),
    year: int = Query(..., ge=2020, le=2100),
    admin_user: AdminUser = Depends(require_permission(Permission.VIEW_EVENTS))
) -> Dict[str, Any]:
    """Get calendar view of events for a specific month - Admin only"""
    
    # Get first and last day of month
    first_day = datetime(year, month, 1)
    last_day_num = monthrange(year, month)[1]
    last_day = datetime(year, month, last_day_num, 23, 59, 59)
    
    # Get all events in this month
    events = await Event.find(
        Event.date >= first_day,
        Event.date <= last_day,
        Event.activo == True
    ).sort(Event.date).to_list()
    
    # Group events by day
    events_by_day = {}
    for event in events:
        day = event.date.day
        if day not in events_by_day:
            events_by_day[day] = []
        
        events_by_day[day].append({
            "id": str(event.id),
            "title": event.title,
            "categoria": event.categoria,
            "time": event.date.strftime("%H:%M"),
            "status": event.status,
            "attendance_count": event.get_attendance_count()
        })
    
    return {
        "month": month,
        "year": year,
        "events_by_day": events_by_day,
        "total_events": len(events)
    }


@router.get("/estadisticas")
async def get_event_statistics(
    admin_user: AdminUser = Depends(require_permission(Permission.VIEW_METRICS))
) -> Dict[str, Any]:
    """Get event statistics - Admin only"""
    
    # Total events
    total_events = await Event.find_all().count()
    
    # Active events
    active_events = await Event.find(Event.activo == True).count()
    
    # Events by status
    published = await Event.find(Event.status == EventStatus.PUBLISHED).count()
    draft = await Event.find(Event.status == EventStatus.DRAFT).count()
    cancelled = await Event.find(Event.status == EventStatus.CANCELLED).count()
    completed = await Event.find(Event.status == EventStatus.COMPLETED).count()
    
    # Events by category
    category_counts = {}
    for category in EventCategory:
        count = await Event.find(Event.categoria == category).count()
        category_counts[category.value] = count
    
    # Upcoming events (next 30 days)
    now = datetime.utcnow()
    thirty_days_later = now + timedelta(days=30)
    upcoming_events = await Event.find(
        Event.date >= now,
        Event.date <= thirty_days_later,
        Event.activo == True
    ).count()
    
    # Get all events for attendance stats
    all_events = await Event.find_all().to_list()
    total_attendance = sum(event.get_attendance_count() for event in all_events)
    avg_attendance = total_attendance / total_events if total_events > 0 else 0
    
    return {
        "total_events": total_events,
        "active_events": active_events,
        "upcoming_events_30d": upcoming_events,
        "by_status": {
            "published": published,
            "draft": draft,
            "cancelled": cancelled,
            "completed": completed
        },
        "by_category": category_counts,
        "attendance": {
            "total_attendees": total_attendance,
            "average_per_event": round(avg_attendance, 2)
        }
    }


@router.post("/crear")
async def crear_evento(
    evento_data: CreateEventRequest,
    admin_user: AdminUser = Depends(require_permission(Permission.CREATE_EVENTS))
) -> Dict[str, Any]:
    """Create new event - Admin only"""
    
    # Create event
    event = Event(
        title=evento_data.title,
        description=evento_data.description,
        categoria=evento_data.categoria,
        theme=evento_data.theme,
        date=evento_data.date,
        duration_minutes=evento_data.duration_minutes,
        ubicacion=evento_data.ubicacion,
        ciudad=evento_data.ciudad,
        pais=evento_data.pais,
        room_url=evento_data.room_url,
        image_url=evento_data.image_url,
        max_participants=evento_data.max_participants,
        precio=evento_data.precio,
        tags=evento_data.tags,
        created_by=admin_user.user_id,
        status=EventStatus.DRAFT
    )
    await event.insert()
    
    # Log admin action
    await log_admin_action(
        admin_user_id=admin_user.user_id,
        action_type="create_event",
        description=f"Created event: {evento_data.title}",
        target_type="event",
        target_id=str(event.id)
    )
    
    return {
        "message": "Evento creado exitosamente",
        "evento_id": str(event.id)
    }


@router.put("/{evento_id}")
async def actualizar_evento(
    evento_id: str,
    evento_data: CreateEventRequest,
    admin_user: AdminUser = Depends(require_permission(Permission.EDIT_EVENTS))
) -> Dict[str, Any]:
    """Update event - Admin only"""
    
    event = await Event.get(evento_id)
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found"
        )
    
    # Update fields
    event.title = evento_data.title
    event.description = evento_data.description
    event.categoria = evento_data.categoria
    event.theme = evento_data.theme
    event.date = evento_data.date
    event.duration_minutes = evento_data.duration_minutes
    event.ubicacion = evento_data.ubicacion
    event.ciudad = evento_data.ciudad
    event.pais = evento_data.pais
    event.room_url = evento_data.room_url
    event.image_url = evento_data.image_url
    event.max_participants = evento_data.max_participants
    event.precio = evento_data.precio
    event.tags = evento_data.tags
    event.updated_at = datetime.utcnow()
    
    await event.save()
    
    # Log admin action
    await log_admin_action(
        admin_user_id=admin_user.user_id,
        action_type="update_event",
        description=f"Updated event: {event.title}",
        target_type="event",
        target_id=evento_id
    )
    
    return {
        "message": "Evento actualizado exitosamente",
        "evento_id": evento_id
    }


@router.delete("/{evento_id}")
async def eliminar_evento(
    evento_id: str,
    admin_user: AdminUser = Depends(require_permission(Permission.DELETE_EVENTS))
) -> Dict[str, Any]:
    """Delete event - Admin only"""
    
    event = await Event.get(evento_id)
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found"
        )
    
    await event.delete()
    
    # Log admin action
    await log_admin_action(
        admin_user_id=admin_user.user_id,
        action_type="delete_event",
        description=f"Deleted event: {event.title}",
        target_type="event",
        target_id=evento_id
    )
    
    return {
        "message": "Evento eliminado exitosamente",
        "evento_id": evento_id
    }


