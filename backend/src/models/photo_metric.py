from beanie import Document, Indexed
from pydantic import Field
from typing import Optional
from datetime import datetime

class PhotoMetric(Document):
    """
    Tracks interaction metrics for a specific photo to power Smart Photos.
    """
    user_id: Indexed(str)
    media_id: Indexed(str)  # Reference to MediaItem._id
    
    views: int = 0
    clicks: int = 0
    matches: int = 0
    view_time: float = 0.0  # Total cumulative view time in seconds
    conversions: int = 0
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "photo_metrics"
        indexes = [
            "user_id",
            "media_id",
            [("user_id", 1), ("media_id", 1)]
        ]

    async def save(self, *args, **kwargs):
        self.updated_at = datetime.utcnow()
        return await super().save(*args, **kwargs)
