
from beanie import Document, Link, Indexed
from pydantic import Field, HttpUrl, BaseModel, field_validator
from typing import Optional, List
from datetime import datetime
from enum import Enum, StrEnum
from .user import User
from .creative_identity import CreativeIdentity


class Gender(StrEnum):
    MALE = "male"
    FEMALE = "female"
    NON_BINARY = "non_binary"
    OTHER = "other"
    PREFER_NOT_TO_SAY = "prefer_not_to_say"


class IntentionType(StrEnum):
    SERIOUS_RELATIONSHIP = "serious_relationship"
    OPEN_RELATIONSHIP = "open_relationship"
    CASUAL_FUN = "casual_fun"
    CASUAL = "casual"  # Compatibility
    SHORT_TERM_FUN = "short_term_fun"
    FRIENDSHIP = "friendship"
    UNDECIDED = "undecided"
    HOBBIES = "hobbies"
    TRAVEL = "travel"
    TRAVEL_TOGETHER = "travel_together"
    ROMANCE = "romance"
    PROJECTS = "projects"
    GAMING = "gaming"
    CONVERSATION = "conversations"  # Plural to match seed data
    NETWORKING = "networking"
    HANG_OUT = "hang_out"


class ActivityPattern(StrEnum):
    MORNING = "morning"
    AFTERNOON = "afternoon"
    EVENING = "evening"
    NIGHT = "night"
    FLEXIBLE = "flexible"


class RelationshipStatus(StrEnum):
    SINGLE = "single"
    IN_RELATIONSHIP = "in_relationship"
    MARRIED = "married"
    DIVORCED = "divorced"
    WIDOWED = "widowed"
    COMPLICATED = "complicated"
    OPEN_RELATIONSHIP = "open_relationship"
    PREFER_NOT_TO_SAY = "prefer_not_to_say"


class Location(BaseModel):
    """Geolocation data"""
    type: str = "Point"
    coordinates: List[float]  # [longitude, latitude]
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None

class LocationScope(BaseModel):
    """Structured location search scope for VIP users"""
    mode: str = "countries"  # "continent" or "countries"
    selected_continent: Optional[str] = None
    selected_countries: List[str] = []
    excluded_countries: List[str] = []
    limit: int = 20
    access_level: str = "vip"


class SpotifyArtist(BaseModel):
    """Spotify Artist data"""
    id: str
    name: str
    image: Optional[str] = None
    spotify_url: Optional[str] = None


class SpotifyTrack(BaseModel):
    """Spotify Track data with preview support"""
    id: str
    name: str
    artist: str
    image: Optional[str] = None
    preview_url: Optional[str] = None
    spotify_url: Optional[str] = None


class MiHimno(BaseModel):
    service: Optional[str] = None  # 'spotify', 'applemusic', etc.
    connected: Optional[str] = None  # Service name if connected
    favorite_artists: List[SpotifyArtist] = []
    representative_playlist: Optional[str] = None
    featured_songs: List[SpotifyTrack] = []
    
    # Allow any extra fields during migration period
    model_config = {"extra": "ignore"}


class Profile(Document):
    """Rich user profile with interests, media, and preferences"""
    
    # User Reference
    user_id: Indexed(str)  # Reference to User._id
    
    # Basic User Data
    birth_date: Optional[datetime] = None
    age: int = 18  # Default age
    gender: str  # Managed by SystemOption (category: gender)
    
    
    # Goals & Intentions
    intentions: List[IntentionType] = []  # Managed by SystemOption (category: intention)
    
    @field_validator("intentions", mode="before")
    @classmethod
    def validate_intentions(cls, v):
        if not isinstance(v, list):
            return v
        cleaned = []
        for item in v:
            if isinstance(item, str):
                val = item
                if val.startswith("IntentionType."):
                    val = val.split(".")[-1]
                
                # Normalize case
                val = val.lower()
                
                # Normalize common singular/plural mismatches
                if val == "conversation": 
                    val = "conversations"
                
                cleaned.append(val)
            else:
                cleaned.append(item)
        return cleaned
    
    # Interests & Hobbies
    interests: List[str] = []  # Managed by SystemOption (category: interest)
    private_interests: List[str] = []  # Interests marked as private (not visible publicly)
    lifestyle_interests: List[str] = []  # Managed by SystemOption (category: lifestyle)
    favorite_interests: List[str] = []
    hobbies: List[str] = []  # Managed by SystemOption (category: hobby)
    
    
    # Bio & Details
    bio: Optional[str] = Field(None, max_length=500)
    prompts: List[dict] = []  # List of {question: str, answer: str}
    languages: List[str] = []  # Managed by SystemOption (category: language)
    preferred_languages: List[str] = []  # For matching/filtering
    auto_preferred_languages: bool = True  # If True, use spoken languages for matching
    height_cm: Optional[int] = None
    height_relevant: bool = True
    height_preferences: List[str] = []  # ["short", "average", "tall", "giant"]
    height_label: str = "average"  # Internal classification (invisible to UI)
    gender_category: str = "traditional"  # traditional, non-binary, trans-spectrum, microlabels
    sexual_orientation: Optional[str] = None  # Managed by SystemOption (category: sexual_orientation)
    attraction_preferences: List[str] = []  # List of genders the user is attracted to
    orientation_preferences: List[str] = []  # List of orientations the user is attracted to
    feeling_curious: bool = False  # If True, expand matches beyond strict preferences
    curiosity_genders: List[str] = []  # Temporary genders to explore in curiosity mode
    occupation: Optional[str] = None
    education_level: Optional[str] = None  # Managed by SystemOption (category: education_level)
    show_professional_only_matches: bool = False  # Privacy: Show only if there are matches
    
    # Personality
    mood: Optional[str] = None
    mbti: Optional[str] = None
    
    # Pets
    has_pets: bool = False
    pet_types: List[str] = []
    
    # Activity
    activity_pattern: Optional[str] = None  # Managed by SystemOption (category: activity_pattern)
    
    # Location Data
    location: Optional[Location] = None
    distance_preference_km: int = 50
    location_sharing_enabled: bool = False
    city: Optional[str] = None  # City name for display
    
    # Contact Information
    phone: Optional[str] = None
    country_code: Optional[str] = None
    phone_verified: bool = False
    
    
    # Profile Media
    photos: List[str] = []  # URLs to uploaded photos (max 9)
    loops: List[str] = []  # URLs to video loops
    instagram_photos: List[str] = []
    
    # Music
    mi_himno: Optional[MiHimno] = None
    music_genres: List[str] = []  # User's favorite music genres
    spotify_playlists: List[str] = []
    favorite_songs: List[dict] = []
    
    # Extended Profile Fields
    pronouns: Optional[str] = None  # e.g., "él/ella/elle"
    nickname: Optional[str] = None  # Different from display_name
    relationship_goals: List[str] = []  # Managed by SystemOption (category: relationship_goal)
    work_company: Optional[str] = None
    school: Optional[str] = None
    zodiac: Optional[str] = None  # Managed by SystemOption (category: zodiac)
    zodiac_relevant: bool = True
    
    # Relationship & Partner
    relationship_status: str = RelationshipStatus.PREFER_NOT_TO_SAY
    relationship_type: Optional[str] = None  # monogamy, polyamory, open, swinger
    partner_id: Optional[str] = None  # User ID of partner
    partner_request_uid: Optional[str] = None  # User ID of pending partner request
    sent_partner_request_to_uid: Optional[str] = None  # User ID of the user I sent a request to
    
    # Lifestyle
    pets: List[str] = []  # Multiple pet types: dogs_cats, birds, fish, etc.
    drinking: Optional[str] = None  # socially, never
    smoking: Optional[str] = None  # yes, no
    exercise: Optional[str] = None  # active, sometimes
    family_plans: Optional[str] = None
    family_plans_relevant: bool = True
    child_acceptance: Optional[str] = None
    communication_style: Optional[str] = None
    love_language: Optional[str] = None
    
    # Professional & Education
    education_center: Optional[str] = None
    social_media_usage: Optional[str] = None  # Added field
    
    # New Expressive Fields (Personality & Characteristics)
    
    # Personality
    social_style: Optional[str] = None  # extrovert, introvert, ambivert
    processing_style: Optional[str] = None  # analytical, creative, practical, dreamer
    risk_tolerance: Optional[str] = None  # conservative, balanced, risky
    decision_making: Optional[str] = None  # rational, emotional, intuitive
    
    # Cognitive & Neurodiversity
    neurodiversity: List[str] = []  # tda, tdah, dyslexia, autism, etc.
    neurodiversity_diagnoses: List[str] = []  # Condition values that are professionally diagnosed
    learning_preferences: List[str] = []  # visual, auditory, kinesthetic
    energy_level: Optional[str] = None  # morning, night, adaptable
    
    # Health & Wellbeing
    disabilities: List[str] = []  # visual, auditory, motor, etc.
    disabilities_diagnoses: List[str] = []  # Conditions professionally diagnosed
    health_conditions: Optional[List[str]] = []  # mobility, allergies, etc.
    health_status: Optional[str] = None  # good, prefer_not, custom
    show_health: bool = True
    show_disabilities: bool = True
    self_care_preferences: List[str] = []  # yoga, meditation, exercise, rest
    
    # Lifestyle & Values
    core_values: List[str] = []  # honesty, loyalty, independence, spirituality, humor
    lifestyle_mode: Optional[str] = None  # minimalist, maximalist, eco-friendly, techy
    leisure_relation: List[str] = []  # explorer, homebody, gamer, traveler
    communication_style_v2: Optional[str] = None  # direct, diplomatic, reflective (legacy field already exists as communication_style)
    
    # Social Dynamics
    interaction_preference: Optional[str] = None  # large groups, small circles, one-on-one
    openness_to_experience: Optional[str] = None  # low, medium, high
    collaboration_style: Optional[str] = None  # leader, follower, mediator
    
    # Creative Extras
    superpower: Optional[str] = None
    achilles_heel: Optional[str] = None
    personal_soundtrack: List[dict] = []  # List of {name, artist, url}
    personal_soundtrack_text: Optional[str] = None
    
    # Creative Identity & Games (Replaces icebreaker_answers)
    creative_identity: Optional[CreativeIdentity] = None
    
    # Matching & Behavior
    model_config = {
        "extra": "ignore",
        "json_schema_extra": {
            "example": {
                "user_id": "507f1f77bcf86cd799439011",
                "age": 28,
                "gender": "non_binary",
                "sexual_orientation": "pansexual",
                "bio": "Music lover and adventure seeker",
                "intentions": ["friendship", "conversation"],
                "interests": ["music", "travel", "photography"],
                "languages": ["en", "es"],
                "location": {
                    "type": "Point",
                    "coordinates": [-99.1332, 19.4326],
                    "city": "Mexico City",
                    "country": "Mexico"
                }
            }
        }
    }
    age_range_min: int = 18
    age_range_max: int = 99
    show_me_in_discovery: bool = True
    global_mode_enabled: bool = False
    likes_count: int = 0
    matches_count: int = 0
    
    # Smart Photos
    smart_photos_enabled: bool = False
    smart_photos_last_evaluated: Optional[datetime] = None
    
    # Privacy
    profile_visible: bool = True
    show_age: bool = True
    show_location: bool = True
    show_pronouns: bool = True
    show_gender: bool = True
    show_neurodiversity: bool = True
    visible_in_suggestions: bool = True  # Show in discovery suggestions
    visible_in_friend_suggestions: bool = True  # Show in friend suggestions
    
    # Search Preferences (Part 4: Advanced Search Filters)
    looking_for: List[str] = ["partner"]  # ["partner", "friends"] - what user is looking for
    search_radius_km: int = 50  # Search radius in kilometers
    search_same_state_only: bool = False  # Limit search to same state
    search_same_country_only: bool = False  # Limit search to same country
    search_states: List[str] = []
    search_countries: List[str] = []
    excluded_states: List[str] = []
    excluded_countries: List[str] = []
    location_scope: Optional[LocationScope] = None
    
    # Verification & Status (Phase 4)
    is_verified: bool = False
    is_public_figure: bool = False
    
    # Theming (Phase 5)
    theme_preferences: dict = Field(default_factory=lambda: {
        "primary_color": "#FF6B6B",
        "sidebar_color": "#FFFFFF",
        "font_family": "Inter"
    })
    
    # Metadata
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    profile_completion: int = 0  # 0-100%
    
    class Settings:
        name = "profiles"
        indexes = [
            "user_id",
            "gender",
            "location",
            "age",
            "sexual_orientation",
            "intentions",
            "attraction_preferences",
            "show_me_in_discovery"
        ]
    


