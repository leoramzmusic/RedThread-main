from beanie import Document
from pydantic import Field
from typing import Optional
from datetime import datetime


class Session(Document):
    """User session tracking for multi-device management"""
    
    user_id: str = Field(..., description="User ID this session belongs to")
    refresh_token_hash: str = Field(..., description="Hashed refresh token for security")
    
    # Device Information
    device_type: str = Field(..., description="Device type: 'web', 'mobile', 'tablet'")
    device_name: str = Field(default="Unknown", description="Browser or app name")
    device_os: str = Field(default="Unknown", description="Operating system")
    
    # Location & Security
    ip_address: str = Field(..., description="IP address of the session")
    location: Optional[dict] = Field(default=None, description="Geolocation data from IP")
    
    # Session Settings
    remember_me: bool = Field(default=False, description="Whether user selected 'Remember Me'")
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow, description="Session creation time")
    last_activity_at: datetime = Field(default_factory=datetime.utcnow, description="Last activity timestamp")
    expires_at: datetime = Field(..., description="Session expiration time")
    
    # Status
    is_active: bool = Field(default=True, description="Whether session is still active")
    
    class Settings:
        name = "sessions"
        indexes = [
            "user_id",
            "is_active",
            [("user_id", 1), ("is_active", 1)],  # Compound index for queries
        ]
    
    class Config:
        json_schema_extra = {
            "example": {
                "user_id": "507f1f77bcf86cd799439011",
                "refresh_token_hash": "a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3",
                "device_type": "web",
                "device_name": "Chrome 120",
                "device_os": "Windows 10",
                "ip_address": "192.168.1.1",
                "location": {"country": "Mexico", "city": "Mexico City"},
                "remember_me": True,
                "is_active": True
            }
        }
