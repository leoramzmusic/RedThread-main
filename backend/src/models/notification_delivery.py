from datetime import datetime
from typing import Optional
from beanie import Document
from pydantic import Field


class NotificationDelivery(Document):
    notification_id: str
    recipient_type: str  # "user" | "employee" | "brand"
    recipient_id: str
    channel: str  # "push" | "in_app" | "email"
    status: str  # "sent" | "delivered" | "opened" | "dismissed" | "expired" | "failed"
    provider: str  # "firebase" | "internal"
    error_code: Optional[str] = None
    error_message: Optional[str] = None
    sent_at: Optional[datetime] = None
    delivered_at: Optional[datetime] = None
    opened_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "notification_deliveries"
        indexes = [
            "notification_id",
            "recipient_id",
            "channel",
            "status",
            [("recipient_id", 1), ("status", 1)],
            [("created_at", -1)],
        ]
