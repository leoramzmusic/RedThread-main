from datetime import datetime
from typing import Dict, Any, Optional
from beanie import Document, PydanticObjectId
from pydantic import Field


class NotificationAudience(Document):
    name: str
    description: Optional[str] = None
    filters: Dict[str, Any] = Field(default_factory=dict)
    estimated_count: int = 0
    created_by: PydanticObjectId
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    deleted_at: Optional[datetime] = None
    deleted_by: Optional[PydanticObjectId] = None

    class Settings:
        name = "notification_audiences"
        indexes = [
            "name",
            "created_by",
            [("created_at", -1)],
        ]
