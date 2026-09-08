from beanie import Document
from pydantic import Field
from typing import Optional
from datetime import datetime
from enum import Enum


class RelationshipType(str, Enum):
    """Type of relationship between users"""
    MATCH = "match"  # Both users liked each other in Discover
    FRIEND = "friend"  # Friend request accepted
    PARTNER = "partner"  # Linked as romantic partners


class RelationshipStatus(str, Enum):
    """Status of the relationship"""
    PENDING = "pending"  # Request sent, awaiting response
    ACTIVE = "active"  # Relationship established
    BLOCKED = "blocked"  # One user blocked the other


class RelationshipOrigin(str, Enum):
    """How the relationship was initiated"""
    DISCOVER = "discover"  # From discovery/swipe feature
    FRIEND_REQUEST = "friend_request"  # Direct friend request
    PARTNER_LINK = "partner_link"  # Partner linking feature


class Relationship(Document):
    """
    Unified relationship model for all user connections.
    Replaces separate Match/Friend/Partner systems.
    
    Evolution flow:
    1. Desconocido (no relationship)
    2. Match (both liked in Discover) → type=MATCH, status=ACTIVE
    3. Friend (request accepted) → type=FRIEND, status=ACTIVE
    4. Partner (linked) → type=PARTNER, status=ACTIVE
    """
    
    # User IDs (always stored in alphabetical order for consistency)
    user_a_id: str  # Smaller user_id
    user_b_id: str  # Larger user_id
    
    # Relationship metadata
    type: RelationshipType
    status: RelationshipStatus
    origin: RelationshipOrigin
    
    # Interaction tracking (for MATCH type)
    user_a_interaction: Optional[str] = None  # "like", "pass", "superlike"
    user_b_interaction: Optional[str] = None
    
    # Request tracking (for FRIEND type)
    requester_id: Optional[str] = None  # Who sent the friend request
    
    # Blocking
    blocked_by: Optional[str] = None  # User ID who blocked
    
    # Affinity (for MATCH type)
    affinity_score: Optional[float] = None
    affinity_breakdown: Optional[dict] = None
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    accepted_at: Optional[datetime] = None  # When request was accepted
    matched_at: Optional[datetime] = None  # When match occurred
    blocked_at: Optional[datetime] = None
    
    # Flags
    is_superlike: bool = False
    
    class Settings:
        name = "relationships"
        indexes = [
            "user_a_id",
            "user_b_id",
            "type",
            "status",
            [("user_a_id", 1), ("user_b_id", 1)],  # Compound index
            [("user_a_id", 1), ("type", 1), ("status", 1)],
            [("user_b_id", 1), ("type", 1), ("status", 1)],
        ]
    
    @classmethod
    def normalize_user_ids(cls, user_id_1: str, user_id_2: str) -> tuple[str, str]:
        """
        Ensure user IDs are always stored in consistent order.
        Returns (user_a_id, user_b_id) where user_a_id < user_b_id
        """
        return (user_id_1, user_id_2) if user_id_1 < user_id_2 else (user_id_2, user_id_1)
    
    def get_other_user_id(self, current_user_id: str) -> str:
        """Get the ID of the other user in this relationship"""
        return self.user_b_id if self.user_a_id == current_user_id else self.user_a_id
    
    def is_user_in_relationship(self, user_id: str) -> bool:
        """Check if a user is part of this relationship"""
        return user_id in [self.user_a_id, self.user_b_id]

