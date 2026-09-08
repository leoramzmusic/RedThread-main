from beanie import Document, Indexed
from pydantic import Field, HttpUrl
from typing import Optional
from datetime import datetime
from enum import Enum

class MediaType(str, Enum):
    PHOTO = "photo"
    VIDEO = "video"
    TIKTOK = "tiktok"
    INSTAGRAM = "instagram"

class MediaItem(Document):
    """
    Represents a media item in the user's gallery.
    Can be a local photo/video or an external link (TikTok/Instagram).
    """
    user_id: Indexed(str)
    type: MediaType
    url: str  # URL for local file or external link
    thumbnail_url: Optional[str] = None  # For videos
    caption: Optional[str] = None
    order_index: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    # External metadata (optional)
    external_id: Optional[str] = None  # ID from TikTok/Instagram
    
    class Settings:
        name = "media_items"
        indexes = [
            "user_id",
            "type",
            "order_index"
        ]
    
    class Config:
        json_schema_extra = {
            "example": {
                "user_id": "507f1f77bcf86cd799439011",
                "type": "photo",
                "url": "http://localhost:8000/static/uploads/photo1.jpg",
                "order_index": 0
            }
        }
