"""Named CARE formula profile (weights + chaos) saved by an admin."""
from datetime import datetime
from beanie import Document
from pydantic import Field
from pymongo import ASCENDING, IndexModel


class CAREProfile(Document):
    """A reusable formula preset: same 7 canonical blocks + chaos factor."""

    name: str
    blocks: dict  # exactly the 7 canonical keys, values 0-1, sum 1.0
    chaos_factor: float = 0.0  # 0-20 (%)
    created_by: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "care_profiles"
        indexes = [IndexModel([("name", ASCENDING)], unique=True)]
