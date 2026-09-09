from beanie import Document, Indexed
from pydantic import Field
from datetime import datetime


class ProfileVisit(Document):
    """Records an authenticated user viewing another user's public profile."""

    viewer_id: Indexed(str)  # User who viewed the profile
    viewed_user_id: Indexed(str)  # User whose profile was seen

    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "profile_visits"
        indexes = [
            "viewer_id",
            "viewed_user_id",
            [("viewer_id", 1), ("viewed_user_id", 1)],  # Compound index
        ]