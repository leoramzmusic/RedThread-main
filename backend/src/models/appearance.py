from beanie import Document, Indexed
from pydantic import Field
from typing import Optional, Dict, Any
from datetime import datetime
from enum import Enum

class AppearanceType(str, Enum):
    FAVICON = "favicon"
    LOGO = "logo"
    BANNER = "banner"
    MULTIMEDIA = "multimedia"
    THEME = "theme"
    # CMS Types
    LANDING_BANNER = "landing_banner"
    LANDING_THEME = "landing_theme"
    LANDING_NAVBAR = "landing_navbar"
    LANDING_NAVBAR_STYLE = "landing_navbar_style"
    LANDING_LANGUAGES = "landing_languages"
    FAVICON_USER = "favicon_user"

class Platform(str, Enum):
    WEB = "web"
    ANDROID = "android"
    IOS = "ios"
    ALL = "all"

class AppearanceResource(Document):
    type: AppearanceType
    platform: Platform
    url: str
    resolution: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)
    is_active: bool = True
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    description: Optional[str] = None
    has_triggered: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "appearance_resources"
        indexes = [
            "type",
            "platform",
            "is_active"
        ]
