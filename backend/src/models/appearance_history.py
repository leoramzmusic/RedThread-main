from beanie import Document
from pydantic import Field, BaseModel
from datetime import datetime
from typing import Optional
from enum import Enum

class HistoryAction(str, Enum):
    ACTIVATED = "activated"
    DEACTIVATED = "deactivated"
    UPLOADED = "uploaded"
    UPDATED = "updated"
    DELETED = "deleted"

class AppearanceHistory(Document):
    resource_id: str
    action: HistoryAction
    user_id: str # Ideally this would link to User model, but keeping as str for flexibility now
    user_name: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    context: Optional[str] = None # e.g. "Campaign Xmas", "Version 2.0"

    class Settings:
        name = "appearance_history"
        indexes = [
            "resource_id",
            "timestamp"
        ]
