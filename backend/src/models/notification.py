from typing import Optional
from datetime import datetime
from beanie import Document, Link
from pydantic import BaseModel
from src.models.user import User

class Notification(Document):
    user_id: str  # The recipient of the notification
    type: str  # 'like', 'view', 'match', 'system'
    content: str
    related_user_id: Optional[str] = None  # The user who triggered the notification (if applicable)
    is_read: bool = False
    created_at: datetime = datetime.utcnow()

    class Settings:
        name = "notifications"

