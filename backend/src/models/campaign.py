from beanie import Document
from pydantic import Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum


class CampaignStatus(str, Enum):
    """Campaign status"""

    DRAFT = "draft"
    SCHEDULED = "scheduled"
    ACTIVE = "active"
    PAUSED = "paused"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class CampaignType(str, Enum):
    """Campaign type"""

    EMAIL = "email"
    PUSH_NOTIFICATION = "push"
    IN_APP_MESSAGE = "in_app"
    SMS = "sms"


class Campaign(Document):
    """
    Marketing campaign model.
    Used for managing email, push, and in-app campaigns.
    """

    # Basic Info
    name: str
    description: Optional[str] = None
    type: CampaignType
    status: CampaignStatus = CampaignStatus.DRAFT

    # Content
    subject: Optional[str] = None  # For email/push
    content: str  # HTML or text content
    media_url: Optional[str] = None
    action_url: Optional[str] = None  # Deep link or URL

    # Targeting
    target_recipient_type: str = "user"  # "user" | "employee"
    category: str = "announcement"
    audience_filter: Dict[str, Any] = Field(default_factory=dict)
    target_audience: dict = Field(
        default_factory=dict
    )  # Filters (e.g., {"is_premium": True, "country": "MX"})
    excluded_audience: dict = Field(default_factory=dict)

    # Content i18n & Priority
    content_i18n: Dict[str, Dict[str, str]] = Field(default_factory=dict)
    priority: str = "P2"  # "P0" | "P1" | "P2" | "P3"
    action_label: Optional[str] = None
    expires_at: Optional[datetime] = None

    # Scheduling
    scheduled_at: Optional[datetime] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

    # Metrics & Stats
    sent_count: int = 0
    delivered_count: int = 0
    opened_count: int = 0
    clicked_count: int = 0
    failed_count: int = 0
    stats: Dict[str, int] = Field(default_factory=lambda: {"sent": 0, "delivered": 0, "seen": 0, "read": 0, "clicked": 0})

    # Metadata
    created_by: Optional[str] = None  # Admin User ID
    executed_by: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    tags: List[str] = Field(default_factory=list)

    class Settings:
        name = "campaigns"
        indexes = [
            "status",
            "type",
            "scheduled_at",
            [("status", 1), ("type", 1)],
        ]

    @property
    def open_rate(self) -> float:
        if self.delivered_count == 0:
            return 0.0
        return (self.opened_count / self.delivered_count) * 100

    @property
    def click_rate(self) -> float:
        if self.opened_count == 0:
            return 0.0
        return (self.clicked_count / self.opened_count) * 100
