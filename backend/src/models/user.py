from beanie import Document, Indexed
from pydantic import EmailStr, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


class AuthProvider(str, Enum):
    EMAIL = "email"
    GOOGLE = "google"
    FACEBOOK = "facebook"
    APPLE = "apple"
    TIKTOK = "tiktok"
    INSTAGRAM = "instagram"


class SubscriptionTier(str, Enum):
    FREE = "free"
    PREMIUM = "premium"
    VIP = "vip"


class User(Document):
    """User authentication and account model"""
    
    # Identity (Three-Tier System)
    real_name: Optional[str] = None  # Legal name for verification (manual entry for now)
    display_name: str = "User"  # Public display name (editable anytime)
    nickname: Indexed(str, unique=True) = "user"  # Unique identifier for URLs (changeable once per 30 days)
    nickname_last_changed: Optional[datetime] = None  # Track last nickname change
    
    # Authentication
    email: Optional[Indexed(EmailStr, unique=True)] = None
    phone: Optional[Indexed(str, unique=True)] = None
    hashed_password: Optional[str] = None
    auth_provider: AuthProvider = AuthProvider.EMAIL
    provider_id: Optional[str] = None  # ID from OAuth provider
    
    # Phone Verification
    phone_otp: Optional[str] = None
    phone_otp_expires_at: Optional[datetime] = None
    
    # Account Status
    is_active: bool = True
    is_verified: bool = False  # Email/phone verification
    verified: bool = False  # Blue checkmark verification
    is_public_figure: bool = False  # Public figure status
    is_banned: bool = False
    is_admin: bool = False
    
    # Premium
    subscription_tier: SubscriptionTier = SubscriptionTier.FREE
    subscription_expires_at: Optional[datetime] = None
    stripe_customer_id: Optional[str] = None
    
    # Discovery Usage
    daily_superlikes_count: int = 0
    last_superlike_date: Optional[datetime] = None
    matches_count_3days: int = 0
    matches_cycle_start: Optional[datetime] = None
    
    # Boost System
    available_boosts: int = 0  # Current boost count (tier-based)
    boost_expires_at: Optional[datetime] = None  # When current boost ends
    last_boost_renewal: Optional[datetime] = None  # For daily/weekly renewal
    boost_stats: dict = Field(default_factory=lambda: {
        "total_activations": 0,
        "total_views": 0,
        "total_matches": 0,
        "last_activation": None
    })
    
    # Metadata
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    last_login_at: Optional[datetime] = None
    
    # User Preferences
    preferred_language: str = "es"  # es, en, pt, fr
    theme_mode: str = "light"  # light, dark
    visual_theme: str = "redThread"  # redThread, premium, vip, blue, purple, pink, green, sakura, halloween, christmas
    theme_color: str = "#FF6B6B"  # Primary color
    notifications_enabled: bool = True
    
    # Online Status
    last_active: datetime = Field(default_factory=datetime.utcnow)
    last_seen: datetime = Field(default_factory=datetime.utcnow)  # For online status calculation
    show_online_status: bool = True
    
    # Emotional Intelligence (Phase 4)
    emotional_status: Optional[str] = None  # e.g., "enamorado", "triste", "amistoso"
    emotional_status_updated_at: Optional[datetime] = None
    theme_palette: Optional[dict] = None  # Stores active colors based on emotion
    
    # Refresh Token
    refresh_tokens: List[str] = []
    
    # Spotify Integration
    spotify_access_token: Optional[str] = None
    spotify_refresh_token: Optional[str] = None
    spotify_token_expires_at: Optional[datetime] = None
    
    # Password Reset
    reset_token: Optional[str] = None
    reset_token_expires_at: Optional[datetime] = None
    
    # Identity Verification
    identity_document_type: Optional[str] = None  # Type of ID document (ine, dni, passport, etc.)
    identity_document_url: Optional[str] = None  # Secure storage path
    identity_verification_status: str = "none"  # none, pending, approved, rejected
    identity_submitted_at: Optional[datetime] = None
    identity_rejection_reason: Optional[str] = None  # Reason for rejection
    identity_verified_at: Optional[datetime] = None  # When verification was approved
    
    class Settings:
        name = "users"
        indexes = [
            "email",
            "phone",
            "nickname",
            "provider_id",
            "subscription_tier",
        ]
    
    class Config:
        json_schema_extra = {
            "example": {
                "real_name": "John Doe",
                "display_name": "Johnny",
                "nickname": "johnny_2024",
                "email": "user@example.com",
                "auth_provider": "email",
                "is_active": True,
                "verified": False,
                "subscription_tier": "free"
            }
        }

