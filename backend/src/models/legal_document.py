from beanie import Document
from pydantic import Field
from typing import Optional
from datetime import datetime
from enum import Enum


class DocumentType(str, Enum):
    """Types of legal documents"""
    PRIVACY = "privacy"
    TERMS = "terms"
    SECURITY = "security"
    COMMUNITY_GUIDELINES = "community_guidelines"


class Language(str, Enum):
    """Supported languages"""
    ES = "es"
    EN = "en"
    PT = "pt"
    FR = "fr"


class LegalDocument(Document):
    """
    Legal documents model for storing privacy policy, terms of service, etc.
    Supports versioning and multilingual content.
    """
    
    doc_type: DocumentType
    language: Language
    version: str  # e.g., "1.0", "1.1", "2.0"
    title: str
    content: str  # Markdown or HTML content
    effective_date: datetime
    created_at: datetime = Field(default_factory=datetime.utcnow)
    is_current: bool = True  # Only one version per type/language should be current
    
    class Settings:
        name = "legal_documents"
        indexes = [
            "doc_type",
            "language",
            "version",
            [("doc_type", 1), ("language", 1), ("is_current", -1)],
        ]

