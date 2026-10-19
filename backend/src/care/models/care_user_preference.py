"""Preferencia CARE declarada por un usuario (una fila por dimensión)."""
from datetime import datetime
from typing import Optional

from beanie import Document
from pydantic import Field
from pymongo import ASCENDING, IndexModel


class CareUserPreference(Document):
    """Score 0-100 que un usuario asigna a una dimensión CARE."""

    user_id: str
    dimension: str
    tag: Optional[str] = None
    score: int
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "care_user_preferences"
        indexes = [
            IndexModel(
                [("user_id", ASCENDING), ("dimension", ASCENDING)], unique=True
            ),
            IndexModel([("dimension", ASCENDING)]),
        ]
