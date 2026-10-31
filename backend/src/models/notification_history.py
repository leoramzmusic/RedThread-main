from datetime import datetime
from typing import Optional
from beanie import Document, PydanticObjectId
from pydantic import Field


class NotificationHistory(Document):
    template_id: Optional[PydanticObjectId] = None
    campaign_id: Optional[PydanticObjectId] = None
    recipient_type: str  # "user" | "employee" | "brand"
    recipient_id: str
    sender_id: PydanticObjectId
    status: str  # "pending" | "sent" | "delivered" | "read" | "failed"
    sent_at: Optional[datetime] = None
    delivered_at: Optional[datetime] = None
    read_at: Optional[datetime] = None
    error_message: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "notification_history"
        indexes = [
            "recipient_id",
            "status",
            "template_id",
            "campaign_id",
            [("recipient_id", 1), ("status", 1)],
            [("created_at", -1)],
        ]
