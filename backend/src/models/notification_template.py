from datetime import datetime
from typing import List, Dict, Any, Optional
from beanie import Document, PydanticObjectId
from pydantic import Field


class NotificationTemplate(Document):
    title: str
    body: str  # con variables {{variable}}
    icon: str
    action_url: Optional[str] = None
    category: str  # "match" | "like" | "message" | "survey" | "reminder" | "promo" | "system" | "security"
    priority: str  # "P0" | "P1" | "P2" | "P3"
    required_action: bool = False
    critical: bool = False
    variables: List[Dict[str, Any]] = Field(default_factory=list)  # [{name, type}]
    created_by: PydanticObjectId
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "notification_templates"
        indexes = [
            "category",
            "priority",
            "created_by",
            [("category", 1), ("priority", 1)],
            [("created_at", -1)],
        ]
