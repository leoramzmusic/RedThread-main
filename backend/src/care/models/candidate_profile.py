"""
CandidateProfile data model for CARE Engine.

Represents a candidate's profile with computed signals for ranking.
"""

from typing import List, Optional, Tuple, Dict
from pydantic import BaseModel, Field
from uuid import UUID
from datetime import datetime


class PopularitySignals(BaseModel):
    """Popularity metrics for a candidate."""
    likes_received: int = 0
    views: int = 0
    match_rate: float = Field(default=0.0, ge=0.0, le=1.0)


class AuthenticitySignals(BaseModel):
    """Authenticity metrics for a candidate."""
    reply_to_like_ratio: float = Field(default=0.0, ge=0.0, le=1.0)
    ghosting_rate: float = Field(default=0.0, ge=0.0, le=1.0)
    avg_conversation_length: float = 0.0  # messages per conversation


class CandidateProfile(BaseModel):
    """Candidate profile with attributes and computed signals."""
    
    id: str
    age: int = Field(ge=18, le=100)
    gender: str
    gender_category: str = "traditional"
    sexual_orientation: Optional[str] = None
    attraction_preferences: List[str] = Field(default_factory=list)
    orientation_preferences: List[str] = Field(default_factory=list)
    
    # Location
    location: Tuple[float, float]  # (latitude, longitude)
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    
    # Interests and values
    interests: List[str] = Field(default_factory=list)
    values: List[str] = Field(default_factory=list)
    
    # Lifestyle and narrative
    lifestyle: Optional[str] = None
    narrative_style: Optional[str] = None
    height_label: Optional[str] = None
    relationship_goals: List[str] = Field(default_factory=list)
    communication_style: Optional[str] = None
    love_language: Optional[str] = None
    
    # Personality & Neurodiversity
    personality_traits: List[str] = Field(default_factory=list)
    neurodiversity: List[str] = Field(default_factory=list)
    
    # Emotional Narrative
    anthem: Optional[Dict] = None
    
    # Boost System
    boost_expires_at: Optional[datetime] = None
    
    # Professional & Academic
    education_center: Optional[str] = None
    education_level: Optional[str] = None
    occupation: Optional[str] = None
    work_company: Optional[str] = None
    
    # Narrative Context (CARE Engine)
    narrative_tone: Optional[str] = "neutral"
    highlighted_fragments: List[str] = Field(default_factory=list)
    
    # Content tags
    photo_tags: List[str] = Field(default_factory=list)  # e.g., ["playa", "mascotas"]
    bio_tags: List[str] = Field(default_factory=list)    # e.g., ["viajes", "música"]
    
    # Computed signals (updated by batch jobs)
    activity_score: float = Field(default=0.5, ge=0.0, le=1.0)
    responsiveness_score: float = Field(default=0.5, ge=0.0, le=1.0)
    reciprocity_score: float = Field(default=0.5, ge=0.0, le=1.0) # Phase 2: Mutual effort
    semantic_depth: float = Field(default=0.5, ge=0.0, le=1.0)    # Phase 2: Conversation quality
    popularity_signals: PopularitySignals = Field(default_factory=PopularitySignals)
    authenticity_signals: AuthenticitySignals = Field(default_factory=AuthenticitySignals)
    
    # Location Visibility for "All" logic
    excluded_states: List[str] = Field(default_factory=list)
    excluded_countries: List[str] = Field(default_factory=list)
    
    # Metadata
    last_active: Optional[datetime] = None
    signals_updated_at: Optional[datetime] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "id": "987e6543-e21b-12d3-a456-426614174000",
                "age": 30,
                "location": (19.4200, -99.1500),
                "interests": ["música", "arte", "cocina"],
                "values": ["honestidad", "aventura"],
                "lifestyle": "active",
                "narrative_style": "humorous",
                "photo_tags": ["playa", "concierto", "mascotas"],
                "bio_tags": ["viajes", "foodie"],
                "activity_score": 0.75,
                "responsiveness_score": 0.85
            }
        }
