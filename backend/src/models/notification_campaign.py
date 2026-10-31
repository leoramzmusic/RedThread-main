from datetime import datetime
from typing import Dict, Any, Optional
from beanie import Document, PydanticObjectId
from pydantic import Field


class NotificationCampaign(Document):
    name: str
    template_id: PydanticObjectId
    audience_id: PydanticObjectId
    status: str  # "draft" | "scheduled" | "active" | "completed" | "cancelled" | "failed"
    scheduled_at: Optional[datetime] = None
    sent_at: Optional[datetime] = None
    created_by: PydanticObjectId
    created_at: datetime = Field(default_factory=datetime.utcnow)
    stats: Dict[str, int] = Field(default_factory=lambda: {"sent": 0, "delivered": 0, "read": 0, "failed": 0})

    class Settings:
        name = "notification_campaigns"
        indexes = [
            "status",
            "template_id",
            "audience_id",
            "created_by",
            [("status", 1), ("scheduled_at", 1)],
            [("created_at", -1)],
        ]
