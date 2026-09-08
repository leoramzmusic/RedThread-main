from beanie import Document, Indexed
from pydantic import Field, BaseModel
from typing import Optional, List
from datetime import datetime
from uuid import UUID

class GolthInterest(Document):
    """Abstract categories for Golth affinities"""
    name: Indexed(str, unique=True)
    description: Optional[str] = None
    color: str = "#f59e0b"  # Default gold
    label: str  # Display label
    
    class Settings:
        name = "golth_interests"

class GolthProfile(Document):
    """
    User or pair profile specifically for the Golth module.
    """
    user_id: Indexed(str)
    is_pair: bool = False
    pair_with_user_id: Optional[str] = None
    
    # Interests associated with this Golth profile
    interest_ids: List[str] = []
    
    # Status
    is_active: bool = False
    activated_at: Optional[datetime] = None
    
    # Emotional/Abstract Narrative for Golth
    narrative: Optional[str] = Field(None, max_length=500)
    
    # Metadata
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "golth_profiles"
        indexes = [
            "user_id",
            "is_pair",
            "is_active"
        ]
