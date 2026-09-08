"""
UserProfile data model for CARE Engine.

Represents a user's profile attributes and preferences for matching.
"""

from typing import List, Optional, Dict, Tuple
from pydantic import BaseModel, Field
from uuid import UUID


class UserProfile(BaseModel):
    """User profile with attributes and preferences."""
    
    id: str
    age: int = Field(ge=18, le=100)
    gender: str
    gender_category: str = "traditional"
    sexual_orientation: Optional[str] = None
    attraction_preferences: List[str] = Field(default_factory=list)
    orientation_preferences: List[str] = Field(default_factory=list)
    feeling_curious: bool = False
    preferred_age_range: Tuple[int, int] = Field(default=(18, 100))
    
    # Location
    location: Tuple[float, float]  # (latitude, longitude)
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    max_distance_km: int = Field(default=50, ge=1, le=500)
    
    # Tier-based Location Preferences
    search_states: List[str] = Field(default_factory=list)
    search_countries: List[str] = Field(default_factory=list)
    excluded_states: List[str] = Field(default_factory=list)
    excluded_countries: List[str] = Field(default_factory=list)
    location_scope: Optional[Dict] = None
    user_plan: str = "free" # basic, premium, vip
    
    # Interests and values
    interests: List[str] = Field(default_factory=list)
    values: List[str] = Field(default_factory=list)
    languages: List[str] = Field(default_factory=list)
    
    # Lifestyle and narrative
    lifestyle: Optional[str] = None  # e.g., "active", "homebody", "balanced"
    narrative_style: Optional[str] = None  # e.g., "poetic", "direct", "humorous"
    
    # Height Flow
    height_relevant: bool = True
    height_preferences: List[str] = Field(default_factory=list)
    
    # Professional & Academic
    education_center: Optional[str] = None
    education_level: Optional[str] = None
    occupation: Optional[str] = None
    work_company: Optional[str] = None
    show_professional_only_matches: bool = False
    
    # Relationship Goals
    relationship_goals: List[str] = Field(default_factory=list)
    relationship_type: Optional[str] = None  # monogamy, polyamory, open, swinger
    
    # Zodiac
    zodiac: Optional[str] = None
    zodiac_relevant: bool = True
    
    # Family Plans
    family_plans: Optional[str] = None
    family_plans_relevant: bool = True
    child_acceptance: Optional[str] = None  # accepts, depends, no_acceptance
    
    # Communication & Love Language
    communication_style: Optional[str] = None  # texting, phone_call, video_call, bad_texter, in_person
    love_language: Optional[str] = None  # acts_of_service, gifts, physical_touch, words_of_affirmation, quality_time
    
    # Personality & Neurodiversity
    personality_traits: List[str] = Field(default_factory=list) # extroversion, curiosity, humor, etc.
    neurodiversity: List[str] = Field(default_factory=list) # adhd, autism, etc.
    
    # Emotional Narrative
    anthem: Optional[Dict] = None # { "title": str, "artist": str, "spotify_id": str }
    
    # Preferences
    visibility_preferences: dict = Field(default_factory=dict)
    safety_preferences: dict = Field(default_factory=dict)
    
    class Config:
        json_schema_extra = {
            "example": {
                "id": "123e4567-e89b-12d3-a456-426614174000",
                "age": 28,
                "preferred_age_range": (25, 35),
                "location": (19.4326, -99.1332),  # Mexico City
                "max_distance_km": 30,
                "interests": ["música", "senderismo", "fotografía"],
                "values": ["autenticidad", "empatía", "creatividad"],
                "lifestyle": "balanced",
                "narrative_style": "poetic"
            }
        }
