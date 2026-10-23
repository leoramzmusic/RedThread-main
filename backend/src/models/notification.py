from typing import Any, Dict, List, Optional
from datetime import datetime
from beanie import Document
from pydantic import Field


class Notification(Document):
    user_id: str  # The recipient of the notification
    type: str  # 'like' | 'match' | 'message' | 'system' | 'survey' | 'promo' (legacy: 'view', 'reward')
    content: str
    related_user_id: Optional[str] = None  # Lead actor (compat)
    is_read: bool = False
    created_at: datetime = datetime.utcnow()
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    group_key: Optional[str] = (
        None  # 'like:photo:{id}' | 'like:profile' | 'message:{conv_id}'
    )
    actor_count: int = 1
    actors: List[Dict[str, Any]] = Field(default_factory=list)  # cap 3
    target_type: Optional[str] = None  # 'profile' | 'likes' | 'chat' | 'url'
    target_id: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
    archived_at: Optional[datetime] = None
    deleted_at: Optional[datetime] = None
    snoozed_until: Optional[datetime] = None
    pinned_at: Optional[datetime] = None

    class Settings:
        name = "notifications"
        indexes = [
            [("user_id", 1), ("updated_at", -1)],
            [("user_id", 1), ("is_read", 1)],
            [("user_id", 1), ("group_key", 1), ("updated_at", -1)],
            [("user_id", 1), ("archived_at", 1), ("updated_at", -1)],
            [("user_id", 1), ("pinned_at", -1), ("updated_at", -1)],
        ]
