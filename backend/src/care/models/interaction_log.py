"""
InteractionLog data model for CARE Engine.

Tracks user actions and derived features for dynamic scoring.
"""

from typing import List, Optional
from pydantic import BaseModel, Field
from uuid import UUID
from datetime import datetime
from enum import Enum


class ActionType(str, Enum):
    """Types of user actions."""
    LIKE = "LIKE"
    NOPE = "NOPE"
    MESSAGE = "MESSAGE"
    VIEW = "VIEW"
    SUPER_LIKE = "SUPER_LIKE"


class UserAction(BaseModel):
    """Single user action event."""
    type: ActionType
    timestamp: datetime
    dwell_time_ms: Optional[int] = None  # Time spent viewing profile
    metadata: dict = Field(default_factory=dict)


class AggregateFeatures(BaseModel):
    """Derived features from interaction history."""
    liked_tags: dict = Field(default_factory=dict)    # tag -> count
    skipped_tags: dict = Field(default_factory=dict)  # tag -> count
    active_time_windows: List[int] = Field(default_factory=list)  # hours of day (0-23)
    avg_dwell_time_ms: float = 0.0


class InteractionLog(BaseModel):
    """Interaction history for a user-candidate pair."""
    
    user_id: str
    candidate_id: str
    actions: List[UserAction] = Field(default_factory=list)
    
    # Derived features (computed periodically)
    aggregate_features: Optional[AggregateFeatures] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "user_id": "123e4567-e89b-12d3-a456-426614174000",
                "candidate_id": "987e6543-e21b-12d3-a456-426614174000",
                "actions": [
                    {
                        "type": "VIEW",
                        "timestamp": "2025-12-26T10:00:00Z",
                        "dwell_time_ms": 5000
                    },
                    {
                        "type": "LIKE",
                        "timestamp": "2025-12-26T10:00:05Z"
                    }
                ]
            }
        }
