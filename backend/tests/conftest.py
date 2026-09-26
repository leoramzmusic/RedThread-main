"""CARE F0 pytest session setup for beanie document models."""

from beanie.odm.settings.document import DocumentSettings

from src.models.conversation import Conversation
from src.models.relationship import Relationship

Relationship._document_settings = DocumentSettings(name="relationships")
Conversation._document_settings = DocumentSettings(name="conversations")
