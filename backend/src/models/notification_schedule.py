from datetime import datetime
from typing import Optional
from beanie import Document, PydanticObjectId
from pydantic import Field


class NotificationSchedule(Document):
    campaign_id: PydanticObjectId
    schedule_type: str  # "once" | "recurring"
    schedule_expression: str
    start_date: datetime
    end_date: Optional[datetime] = None
    is_active: bool = True
    last_run: Optional[datetime] = None
    next_run: Optional[datetime] = None

    class Settings:
        name = "notification_schedules"
        indexes = [
            "campaign_id",
            "schedule_type",
            "is_active",
            "next_run",
            [("is_active", 1), ("next_run", 1)],
            [("campaign_id", 1), ("schedule_type", 1)],
        ]
