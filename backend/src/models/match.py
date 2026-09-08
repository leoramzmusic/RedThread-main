from beanie import Document, Indexed
from pydantic import Field
from typing import Optional
from datetime import datetime
from enum import Enum


class InteractionType(str, Enum):
    LIKE = "like"
    PASS = "pass"
    SUPERLIKE = "superlike"


class MatchStatus(str, Enum):
    PENDING = "pending"  # One-sided like
    MATCHED = "matched"  # Mutual like
    UNMATCHED = "unmatched"  # One user unmatched
    BLOCKED = "blocked"  # User blocked


class MatchMode(str, Enum):
    NORMAL = "normal"
    BLIND = "blind"


class UnlockState(str, Enum):
    LOCKED = "locked"    # Photos hidden
    PENDING = "pending"  # One user wants to unlock
    UNLOCKED = "unlocked" # Both users agreed to show photos


class Match(Document):
    """Match and interaction tracking between users"""
    
    # Users involved
    user_id_1: Indexed(str)  # First user
    user_id_2: Indexed(str)  # Second user
    
    # Interactions
    user_1_interaction: Optional[InteractionType] = None
    user_2_interaction: Optional[InteractionType] = None
    
    # Match Status
    status: MatchStatus = MatchStatus.PENDING
    
    # Affinity Score (0-100)
    affinity_score: float = 0.0
    
    # Breakdown of affinity components
    affinity_breakdown: dict = {
        "interests": 0.0,
        "music": 0.0,
        "personality": 0.0,
        "proximity": 0.0,
        "activity": 0.0
    }
    
    # Blind Mode Fields
    mode: MatchMode = MatchMode.NORMAL
    unlock_state: UnlockState = UnlockState.UNLOCKED # Normal matches are unlocked by default
    unlock_consent: dict = {} # {user_id: bool} - Tracks who pressed "Unlock"
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    interaction_updated_at: Optional[datetime] = None  # Phase 2: Track last decision
    matched_at: Optional[datetime] = None  # When both liked
    unmatched_at: Optional[datetime] = None
    
    # Metadata
    is_superlike: bool = False  # True if either used superlike
    radar_encounter: bool = False  # True if met via proximity radar
    blocked_by: Optional[str] = None  # User ID who initiated the block
    
    class Settings:
        name = "matches"
        indexes = [
            "user_id_1",
            "user_id_2",
            "status",
            "matched_at",
            [("user_id_1", 1), ("user_id_2", 1)],  # Compound index
        ]
    
    class Config:
        json_schema_extra = {
            "example": {
                "user_id_1": "507f1f77bcf86cd799439011",
                "user_id_2": "507f1f77bcf86cd799439012",
                "user_1_interaction": "like",
                "user_2_interaction": "like",
                "status": "matched",
                "affinity_score": 85.5,
                "is_superlike": False
            }
        }

