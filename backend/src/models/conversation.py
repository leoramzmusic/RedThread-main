from beanie import Document
from pydantic import Field
from typing import Optional, Dict
from datetime import datetime
from enum import Enum


class ConversationType(str, Enum):
    """Type of conversation based on relationship"""
    MATCH = "match"  # Chat from discovery match
    FRIEND = "friend"  # Chat with friend
    PARTNER = "partner"  # Chat with linked partner


class Conversation(Document):
    """
    Conversation model linked to Relationship.
    Replaces direct Match-based chat system.
    
    Each active Relationship can have one Conversation.
    """
    
    # Link to relationship
    relationship_id: str  # Reference to Relationship document
    
    # Conversation metadata
    type: ConversationType  # Derived from relationship type
    participants: list[str]  # [user_a_id, user_b_id]
    
    # Message tracking
    last_message_at: Optional[datetime] = None
    last_message_content: Optional[str] = None
    last_message_sender_id: Optional[str] = None
    
    # Unread counts per user
    unread_count: Dict[str, int] = Field(default_factory=dict)
    # Example: {"user_123": 5, "user_456": 0}
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    archived_by: list[str] = Field(default_factory=list)  # Users who archived this chat
    
    # Settings
    muted_by: list[str] = Field(default_factory=list)  # Users who muted notifications
    
    class Settings:
        name = "conversations"
        indexes = [
            "relationship_id",
            "participants",
            "type",
            [("participants", 1), ("last_message_at", -1)],
        ]
    
    def is_archived_by(self, user_id: str) -> bool:
        """Check if conversation is archived by a specific user"""
        return user_id in self.archived_by
    
    def is_muted_by(self, user_id: str) -> bool:
        """Check if conversation is muted by a specific user"""
        return user_id in self.muted_by
    
    def get_unread_count(self, user_id: str) -> int:
        """Get unread message count for a specific user"""
        return self.unread_count.get(user_id, 0)
    
    def increment_unread(self, user_id: str):
        """Increment unread count for a user"""
        if user_id not in self.unread_count:
            self.unread_count[user_id] = 0
        self.unread_count[user_id] += 1
    
    def reset_unread(self, user_id: str):
        """Reset unread count for a user"""
        self.unread_count[user_id] = 0

