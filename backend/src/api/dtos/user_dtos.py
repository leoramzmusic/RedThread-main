"""
User Data Transfer Objects (DTOs)
Provides filtered and sanitized user data for different access levels.
"""

from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional, List, Dict
from datetime import datetime


class PublicUserDTO(BaseModel):
    """
    Public user data visible to everyone.
    Used when viewing other users' profiles.
    """
    model_config = ConfigDict(use_enum_values=True)
    
    user_id: str
    display_name: str
    nickname: str
    verified: bool = False
    subscription_tier: str = "free"
    
    # Profile data (public)
    age: Optional[int] = None
    gender: Optional[str] = None
    bio: Optional[str] = None
    photos: List[str] = []
    city: Optional[str] = None
    
    # Verification status (public badge)
    identity_verification_status: Optional[str] = None  # Only "approved" or None
    
    @classmethod
    def from_user_and_profile(cls, user, profile):
        """Create PublicUserDTO from User and Profile models"""
        return cls(
            user_id=str(user.id),
            display_name=user.display_name,
            nickname=user.nickname,
            verified=user.verified,
            subscription_tier=str(user.subscription_tier.value) if user.subscription_tier else "free",
            age=profile.age if profile else None,
            gender=profile.gender if profile else None,
            bio=profile.bio if profile else None,
            photos=profile.photos if profile else [],
            city=profile.city or (profile.location.city if profile and profile.location else None),
            # Only show "approved" status, hide "pending" or "rejected"
            identity_verification_status="approved" if user.verified else None
        )


class PrivateUserDTO(BaseModel):
    """
    Private user data visible only to the owner.
    Used for /auth/me and /profiles/me endpoints.
    """
    model_config = ConfigDict(use_enum_values=True)
    
    user_id: str
    display_name: str
    nickname: str
    
    # Identity
    real_name: Optional[str] = None
    
    # Masked sensitive data
    email_masked: Optional[str] = None
    phone_masked: Optional[str] = None
    
    # Account status
    verified: bool = False
    is_verified: bool = False  # Email/phone verification
    subscription_tier: str = "free"
    
    # Verification status (detailed for owner)
    identity_verification_status: str = "none"
    identity_document_type: Optional[str] = None
    identity_rejection_reason: Optional[str] = None
    identity_submitted_at: Optional[datetime] = None
    
    # Profile data
    profile: Optional[dict] = None
    
    @classmethod
    def from_user_and_profile(cls, user, profile, mask_data: bool = True):
        """
        Create PrivateUserDTO from User and Profile models.
        
        Args:
            user: User model instance
            profile: Profile model instance
            mask_data: If True, mask email and phone. Set to False for admin access.
        """
        from src.services.data_privacy_service import mask_email, mask_phone
        
        return cls(
            user_id=str(user.id),
            real_name=user.real_name,
            display_name=user.display_name,
            nickname=user.nickname,
            email_masked=mask_email(user.email) if mask_data and user.email else user.email,
            phone_masked=mask_phone(user.phone) if mask_data and user.phone else user.phone,
            verified=user.verified,
            is_verified=user.is_verified,
            subscription_tier=str(user.subscription_tier.value) if user.subscription_tier else "free",
            identity_verification_status=user.identity_verification_status,
            identity_document_type=user.identity_document_type,
            identity_rejection_reason=user.identity_rejection_reason,
            identity_submitted_at=user.identity_submitted_at,
            profile=profile.model_dump(mode='json') if profile else None
        )


class AdminUserDTO(BaseModel):
    """
    Complete user data visible only to administrators.
    Includes all sensitive fields for admin operations.
    """
    model_config = ConfigDict(use_enum_values=True)
    
    user_id: str
    
    # Identity (full access)
    real_name: Optional[str] = None
    display_name: str
    nickname: str
    
    # Authentication (full access)
    email: Optional[str] = None
    phone: Optional[str] = None
    auth_provider: str
    
    # Account status
    is_active: bool = True
    is_verified: bool = False
    verified: bool = False
    is_banned: bool = False
    is_admin: bool = False
    subscription_tier: str = "free"
    
    # Identity verification (full details)
    identity_document_type: Optional[str] = None
    identity_document_url: Optional[str] = None  # Only for admins
    identity_verification_status: str = "none"
    identity_submitted_at: Optional[datetime] = None
    identity_rejection_reason: Optional[str] = None
    identity_verified_at: Optional[datetime] = None
    
    # Metadata
    created_at: datetime
    updated_at: datetime
    last_login_at: Optional[datetime] = None
    
    # Profile data
    profile: Optional[dict] = None
    
    @classmethod
    def from_user_and_profile(cls, user, profile):
        """Create AdminUserDTO from User and Profile models"""
        return cls(
            user_id=str(user.id),
            real_name=user.real_name,
            display_name=user.display_name,
            nickname=user.nickname,
            email=user.email,
            phone=user.phone,
            auth_provider=user.auth_provider.value if user.auth_provider else "email",
            is_active=user.is_active,
            is_verified=user.is_verified,
            verified=user.verified,
            is_banned=user.is_banned,
            is_admin=user.is_admin,
            subscription_tier=str(user.subscription_tier.value) if user.subscription_tier else "free",
            identity_document_type=user.identity_document_type,
            identity_document_url=user.identity_document_url,
            identity_verification_status=user.identity_verification_status,
            identity_submitted_at=user.identity_submitted_at,
            identity_rejection_reason=user.identity_rejection_reason,
            identity_verified_at=user.identity_verified_at,
            created_at=user.created_at,
            updated_at=user.updated_at,
            last_login_at=user.last_login_at,
            profile=profile.model_dump(mode='json') if profile else None
        )


class UserProfileResponseDTO(BaseModel):
    """
    Combined user and profile response for /profiles/me endpoint.
    Automatically filters sensitive data based on viewer permissions.
    """
    model_config = ConfigDict(use_enum_values=True)
    
    user_id: str
    display_name: str
    nickname: str
    
    # Masked sensitive data (for owner view)
    email_masked: Optional[str] = None
    phone_masked: Optional[str] = None
    
    # Account status
    verified: bool = False
    email_verified: bool = False
    phone_verified: bool = False
    subscription_tier: str = "free"
    
    # Verification status (no document URL)
    identity_verification_status: str = "none"
    identity_document_type: Optional[str] = None
    identity_rejection_reason: Optional[str] = None
    identity_submitted_at: Optional[datetime] = None
    
    # Real credentials (for owner view)
    real_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    country_code: Optional[str] = None
    
    # Profile fields (merged)
    age: Optional[int] = None
    gender: Optional[str] = None
    bio: Optional[str] = None
    photos: List[str] = []
    interests: List[str] = []
    lifestyle_interests: List[str] = []
    hobbies: List[str] = []
    languages: List[str] = []
    preferred_languages: List[str] = []
    auto_preferred_languages: bool = True
    city: Optional[str] = None
    
    # Details
    birth_date: Optional[datetime] = None
    sexual_orientation: Optional[str] = None
    height_cm: Optional[int] = None
    occupation: Optional[str] = None
    education_level: Optional[str] = None
    education_center: Optional[str] = None
    work_company: Optional[str] = None
    school: Optional[str] = None
    zodiac: Optional[str] = None
    zodiac_relevant: bool = True
    pronouns: Optional[str] = None
    height_relevant: bool = True
    height_preferences: List[str] = []
    height_range_labels: Dict[str, str] = {}
    
    # Lifestyle Details
    mbti: Optional[str] = None
    mood: Optional[str] = None
    family_plans: Optional[str] = None
    family_plans_relevant: bool = True
    child_acceptance: Optional[str] = None
    communication_style: Optional[str] = None
    love_language: Optional[str] = None
    social_media_usage: Optional[str] = None
    drinking: Optional[str] = None
    smoking: Optional[str] = None
    exercise: Optional[str] = None
    activity_pattern: Optional[str] = None
    
    # Pets
    has_pets: bool = False
    pet_types: List[str] = []
    pets: List[str] = []
    
    # Preferences
    intentions: List[str] = []
    favorite_interests: List[str] = []
    relationship_status: str = "single"
    relationship_type: Optional[str] = None
    relationship_goals: List[str] = []
    attraction_preferences: List[str] = []
    orientation_preferences: List[str] = []
    feeling_curious: bool = False
    curiosity_genders: List[str] = []
    age_range_min: int = 18
    age_range_max: int = 99
    search_radius_km: int = 50
    distance_preference_km: int = 50
    
    # Personality & Health
    social_style: Optional[str] = None
    processing_style: Optional[str] = None
    decision_making: Optional[str] = None
    risk_tolerance: Optional[str] = None
    neurodiversity: List[str] = []
    neurodiversity_diagnoses: List[str] = []
    learning_preferences: List[str] = []
    energy_level: Optional[str] = None
    disabilities: List[str] = []
    disabilities_diagnoses: List[str] = []
    health_conditions: List[str] = []
    health_status: Optional[str] = None
    self_care_preferences: List[str] = []
    core_values: List[str] = []
    leisure_relation: List[str] = []
    lifestyle_mode: Optional[str] = None
    communication_style_v2: Optional[str] = None
    interaction_preference: Optional[str] = None
    openness_to_experience: Optional[str] = None
    collaboration_style: Optional[str] = None
    
    # Creative
    superpower: Optional[str] = None
    achilles_heel: Optional[str] = None
    personal_soundtrack: List[dict] = []
    personal_soundtrack_text: Optional[str] = None
    
    # Music & Media
    mi_himno: Optional[dict] = None
    favorite_songs: List[dict] = []
    spotify_playlists: List[str] = []
    loops: List[str] = []
    instagram_photos: List[str] = []
    
    # Visibility
    show_age: bool = True
    show_location: bool = True
    show_pronouns: bool = True
    show_gender: bool = True
    show_neurodiversity: bool = True
    show_health: bool = True
    show_disabilities: bool = True
    profile_visible: bool = True
    show_me_in_discovery: bool = True
    global_mode_enabled: bool = False
    
    # Smart Photos
    smart_photos_enabled: bool = False
    smart_photos_last_evaluated: Optional[datetime] = None
    
    # Search Preferences
    search_states: List[str] = []
    search_countries: List[str] = []
    excluded_states: List[str] = []
    excluded_countries: List[str] = []
    
    # Prompts
    prompts: List[dict] = []
    show_professional_only_matches: bool = False
    
    # Location
    location: Optional[dict] = None
    
    # Additional
    profile_completion: Optional[int] = None
    
    @classmethod
    def from_user_and_profile(cls, user, profile, mask_data: bool = True):
        """
        Create UserProfileResponseDTO from User and Profile models.
        
        Args:
            user: User model instance
            profile: Profile model instance
            mask_data: If True, mask email and phone
        """
        from src.services.data_privacy_service import mask_email, mask_phone
        from src.utils.height_context import get_height_range_labels, map_country_to_region
        
        country = (profile.location.country if profile and profile.location else (profile.city if profile else None)) if profile else None
        region = map_country_to_region(country)
        range_labels = get_height_range_labels(region)
        
        return cls(
            user_id=str(user.id),
            display_name=user.display_name,
            nickname=user.nickname,
            email_masked=mask_email(user.email) if mask_data and user.email else user.email,
            phone_masked=mask_phone(user.phone) if mask_data and user.phone else user.phone,
            real_name=user.real_name if not mask_data else None,
            email=user.email if not mask_data else None,
            phone=profile.phone if profile and not mask_data else None,
            country_code=profile.country_code if profile and not mask_data else None,
            verified=user.verified,
            email_verified=user.is_verified,
            phone_verified=profile.phone_verified if profile else False,
            subscription_tier=str(user.subscription_tier.value) if user.subscription_tier else "free",
            identity_verification_status=user.identity_verification_status,
            identity_document_type=user.identity_document_type,
            identity_rejection_reason=user.identity_rejection_reason,
            identity_submitted_at=user.identity_submitted_at,
            age=profile.age if profile else None,
            gender=profile.gender if profile else None,
            bio=profile.bio if profile else None,
            photos=profile.photos if profile else [],
            interests=profile.interests if profile else [],
            lifestyle_interests=profile.lifestyle_interests if profile else [],
            hobbies=profile.hobbies if profile else [],
            languages=profile.languages if profile else [],
            preferred_languages=profile.preferred_languages if profile else [],
            auto_preferred_languages=profile.auto_preferred_languages if profile else True,
            city=profile.city or (profile.location.city if profile.location else None) if profile else None,
            birth_date=profile.birth_date if profile else None,
            sexual_orientation=profile.sexual_orientation if profile else None,
            height_cm=profile.height_cm if profile else None,
            occupation=profile.occupation if profile else None,
            education_level=profile.education_level if profile else None,
            education_center=profile.education_center if profile else None,
            work_company=profile.work_company if profile else None,
            school=profile.school if profile else None,
            zodiac=profile.zodiac if profile else None,
            zodiac_relevant=profile.zodiac_relevant if profile else True,
            pronouns=profile.pronouns if profile else None,
            height_relevant=profile.height_relevant if profile else True,
            height_preferences=profile.height_preferences if profile else [],
            height_range_labels=range_labels,
            mbti=profile.mbti if profile else None,
            mood=profile.mood if profile else None,
            family_plans=profile.family_plans if profile else None,
            family_plans_relevant=profile.family_plans_relevant if profile else True,
            child_acceptance=profile.child_acceptance if profile else None,
            communication_style=profile.communication_style if profile else None,
            love_language=profile.love_language if profile else None,
            social_media_usage=profile.social_media_usage if profile else None,
            drinking=profile.drinking if profile else None,
            smoking=profile.smoking if profile else None,
            exercise=profile.exercise if profile else None,
            activity_pattern=profile.activity_pattern if profile else None,
            has_pets=profile.has_pets if profile else False,
            pet_types=profile.pet_types if profile else [],
            pets=profile.pets if profile else [],
            intentions=profile.intentions if profile else [],
            favorite_interests=profile.favorite_interests if profile else [],
            relationship_status=profile.relationship_status if profile else "single",
            relationship_type=profile.relationship_type if profile else None,
            relationship_goals=profile.relationship_goals if profile else [],
            attraction_preferences=profile.attraction_preferences if profile else [],
            orientation_preferences=profile.orientation_preferences if profile else [],
            feeling_curious=profile.feeling_curious if profile else False,
            curiosity_genders=profile.curiosity_genders if profile else [],
            age_range_min=profile.age_range_min if profile else 18,
            age_range_max=profile.age_range_max if profile else 99,
            search_radius_km=profile.search_radius_km if profile else 50,
            distance_preference_km=profile.distance_preference_km if profile else 50,
            social_style=profile.social_style if profile else None,
            processing_style=profile.processing_style if profile else None,
            decision_making=profile.decision_making if profile else None,
            risk_tolerance=profile.risk_tolerance if profile else None,
            neurodiversity=profile.neurodiversity if profile else [],
            neurodiversity_diagnoses=profile.neurodiversity_diagnoses if profile else [],
            learning_preferences=profile.learning_preferences if profile else [],
            energy_level=profile.energy_level if profile else None,
            disabilities=profile.disabilities if profile else [],
            disabilities_diagnoses=profile.disabilities_diagnoses if profile else [],
            health_conditions=profile.health_conditions if profile else [],
            health_status=profile.health_status if profile else None,
            self_care_preferences=profile.self_care_preferences if profile else [],
            core_values=profile.core_values if profile else [],
            leisure_relation=profile.leisure_relation if profile else [],
            lifestyle_mode=profile.lifestyle_mode if profile else None,
            communication_style_v2=profile.communication_style_v2 if profile else None,
            interaction_preference=profile.interaction_preference if profile else None,
            openness_to_experience=profile.openness_to_experience if profile else None,
            collaboration_style=profile.collaboration_style if profile else None,
            superpower=profile.superpower if profile else None,
            achilles_heel=profile.achilles_heel if profile else None,
            personal_soundtrack=profile.personal_soundtrack if profile else [],
            personal_soundtrack_text=profile.personal_soundtrack_text if profile else None,
            mi_himno=profile.mi_himno.model_dump(mode='json') if profile and profile.mi_himno else None,
            favorite_songs=profile.favorite_songs if profile else [],
            spotify_playlists=profile.spotify_playlists if profile else [],
            loops=profile.loops if profile else [],
            instagram_photos=profile.instagram_photos if profile else [],
            show_age=profile.show_age if profile else True,
            show_location=profile.show_location if profile else True,
            show_pronouns=profile.show_pronouns if profile else True,
            show_gender=profile.show_gender if profile else True,
            show_neurodiversity=profile.show_neurodiversity if profile else True,
            show_health=profile.show_health if profile else True,
            show_disabilities=profile.show_disabilities if profile else True,
            profile_visible=profile.profile_visible if profile else True,
            show_me_in_discovery=profile.show_me_in_discovery if profile else True,
            global_mode_enabled=profile.global_mode_enabled if profile else False,
            search_states=profile.search_states if profile else [],
            search_countries=profile.search_countries if profile else [],
            excluded_states=profile.excluded_states if profile else [],
            excluded_countries=profile.excluded_countries if profile else [],
            prompts=profile.prompts if profile else [],
            show_professional_only_matches=profile.show_professional_only_matches if profile else False,
            location=profile.location.model_dump(mode='json') if profile and profile.location else None,
            profile_completion=profile.profile_completion if profile else None,
            smart_photos_enabled=profile.smart_photos_enabled if profile else False,
            smart_photos_last_evaluated=profile.smart_photos_last_evaluated if profile else None
        )