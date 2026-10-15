"""Versioned CARE formula document (the compatibility matrix M)."""
from datetime import datetime
from typing import Optional
from beanie import Document
from pydantic import Field


class CAREFormula(Document):
    """One immutable version of the canonical CARE formula."""

    version: int
    status: str = "active"  # "active" | "archived"
    blocks: dict  # exactly the 7 canonical keys, values 0-1, sum 1.0
    chaos_factor: float = 0.0  # 0-20 (%)
    chaos_seed: Optional[str] = None
    min_compatibility: float = 0.0
    match_critical: float = 0.15
    changelog: str
    created_by: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "care_formulas"
        indexes = ["version", "status"]
