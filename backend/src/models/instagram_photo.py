from beanie import Document, Indexed
from pydantic import Field, HttpUrl
from typing import Optional
from datetime import datetime


class InstagramPhoto(Document):
    """Instagram photo import for profile enhancement"""
    
    # User Reference
    user_id: Indexed(str)
    
    # Instagram Info
    instagram_photo_id: str
    photo_url: HttpUrl
    thumbnail_url: Optional[HttpUrl] = None
    
    # Content
    caption: Optional[str] = None
    likes_count: int = 0
    
    # Metadata
    posted_at: Optional[datetime] = None  # When posted on Instagram
    imported_at: datetime = Field(default_factory=datetime.utcnow)
    is_profile_photo: bool = False  # Used in profile photos
    
    class Settings:
        name = "instagram_photos"
        indexes = [
            "user_id",
            "instagram_photo_id",
        ]
    
    class Config:
        json_schema_extra = {
            "example": {
                "user_id": "507f1f77bcf86cd799439011",
                "instagram_photo_id": "CXyZ123456",
                "photo_url": "https://instagram.com/p/CXyZ123456/media",
                "caption": "Beautiful sunset!",
                "likes_count": 150,
                "is_profile_photo": True
            }
        }

