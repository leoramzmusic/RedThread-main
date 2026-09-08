from typing import List, Optional
from datetime import datetime
from beanie import Document, Link
from pydantic import BaseModel, Field
from src.models.user import User
from enum import Enum


class EventCategory(str, Enum):
    """Event category types"""
    SOCIAL = "social"
    NETWORKING = "networking"
    WORKSHOP = "workshop"
    MEETUP = "meetup"
    PARTY = "party"
    SPORTS = "sports"
    CULTURAL = "cultural"
    VIRTUAL = "virtual"
    OTHER = "other"


class EventStatus(str, Enum):
    """Event status"""
    DRAFT = "draft"
    PUBLISHED = "published"
    CANCELLED = "cancelled"
    COMPLETED = "completed"


class Event(Document):
    """Event model for community events and virtual activities"""
    
    # Basic information
    title: str  # Event name/title
    description: str
    categoria: EventCategory = EventCategory.VIRTUAL
    theme: Optional[str] = None  # cine, musica, gaming, etc.
    
    # Date and time
    date: datetime  # Start date/time
    duration_minutes: int = 60
    fecha_fin: Optional[datetime] = None  # End date/time (if different from calculated)
    
    # Location (for physical events)
    ubicacion: Optional[str] = None  # Location name/address
    ciudad: Optional[str] = None
    pais: Optional[str] = None
    
    # Virtual event details
    room_url: Optional[str] = None
    image_url: Optional[str] = None
    
    # Event details
    max_participants: int = 50
    precio: Optional[float] = 0.0  # Event price (0 = free)
    
    # Status and visibility
    status: EventStatus = EventStatus.PUBLISHED
    activo: bool = True  # Active/inactive
    
    # Participants
    participants: List[str] = Field(default_factory=list)  # User IDs (confirmed)
    asistentes_interesados: List[str] = Field(default_factory=list)  # Interested users
    
    # Metadata
    created_by: str  # User/Admin ID
    tags: List[str] = Field(default_factory=list)  # Event tags
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "events"
        indexes = [
            "categoria",
            "status",
            "date",
            "activo",
            [("date", 1), ("activo", 1)],
            [("categoria", 1), ("status", 1)],
        ]
    
    def get_attendance_count(self) -> int:
        """Get total confirmed attendees"""
        return len(self.participants)
    
    def get_interest_count(self) -> int:
        """Get total interested users"""
        return len(self.asistentes_interesados)


