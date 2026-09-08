from beanie import Document
from pydantic import Field, BaseModel
from typing import List, Optional, Dict
from datetime import datetime
from enum import Enum


class TicketStatus(str, Enum):
    """Support ticket status"""
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    CLOSED = "closed"


class TicketPriority(str, Enum):
    """Support ticket priority"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class TicketCategory(str, Enum):
    """Support ticket category"""
    ACCOUNT = "account"
    BILLING = "billing"
    TECHNICAL = "technical"
    CONTENT = "content"
    OTHER = "other"


class TicketMessage(BaseModel):
    """Message within a support ticket"""
    sender_id: str  # User ID or Admin ID
    content: str
    is_internal: bool = False  # Internal note visible only to admins
    created_at: datetime = Field(default_factory=datetime.utcnow)
    attachments: List[str] = []


class SupportTicket(Document):
    """
    Support ticket model.
    Used for managing user support requests.
    """
    
    # Basic Info
    user_id: str  # User who created the ticket
    subject: str
    description: str
    category: TicketCategory
    priority: TicketPriority = TicketPriority.MEDIUM
    status: TicketStatus = TicketStatus.OPEN
    
    # Assignment
    assigned_to: Optional[str] = None  # Admin User ID
    
    # Content
    messages: List[TicketMessage] = Field(default_factory=list)
    attachments: List[str] = []
    
    # Metadata
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    closed_at: Optional[datetime] = None
    closed_by: Optional[str] = None
    
    # Tags
    tags: List[str] = Field(default_factory=list)
    
    class Settings:
        name = "support_tickets"
        indexes = [
            "user_id",
            "status",
            "assigned_to",
            "priority",
            [("status", 1), ("priority", 1)],
        ]
    
    def add_message(self, sender_id: str, content: str, is_internal: bool = False):
        """Add a message to the ticket"""
        message = TicketMessage(
            sender_id=sender_id,
            content=content,
            is_internal=is_internal
        )
        self.messages.append(message)
        self.updated_at = datetime.utcnow()

