from beanie import Document
from pydantic import Field
from typing import Optional, List, Dict, Any
from datetime import datetime


class YukiAnimationState(Document):
    """A single animation state configuration for Yuki"""
    state_name: str  # "idle" | "loading" | "success" | "error"
    enabled: bool = True
    animation: str = "default"  # Lottie filename or animation key
    speed_multiplier: float = 1.0

    class Settings:
        name = "yuki_animation_states"


class YukiScreenOverride(Document):
    """Per-screen override for Yuki behavior"""
    screen_path: str  # e.g. "/discover", "/chat"
    enabled: bool = True
    custom_animation: Optional[str] = None
    custom_style: Optional[str] = None

    class Settings:
        name = "yuki_screen_overrides"


class YukiSkin(Document):
    """A custom skin/variant for Yuki"""
    name: str
    image_url: str
    unlocked_by: Optional[str] = None  # "subscription" | "achievement" | None
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "yuki_skins"


class YukiAppearanceRule(Document):
    """Rule for conditional Yuki appearance"""
    condition: str  # e.g. "screen == '/discover'", "time between 18-22"
    action: str  # "show" | "hide" | "use_style" | "use_animation"
    value: Optional[str] = None  # style name, animation name, etc.
    priority: int = 0
    is_active: bool = True

    class Settings:
        name = "yuki_appearance_rules"


class YukiConfig(Document):
    """Master configuration for Yuki mascot system"""

    # Environment scope
    environment: str = "production"  # "local" | "staging" | "production"

    # A: Appearance
    yarn_color: str = "#E63946"
    yuki_style: str = "kawaii"  # "idle" | "kawaii" | "minimalist"
    custom_skin_id: Optional[str] = None

    # B: Animations
    animation_speed: float = 1.0
    idle_animation: str = "default"
    loading_animation: str = "yarn_spin"
    success_animation: str = "celebrate"
    error_animation: str = "confused"

    # C: Functionalities
    enable_loader: bool = True
    enable_onboarding: bool = True
    enable_notifications: bool = True
    enable_error_pages: bool = True
    enable_easter_eggs: bool = False

    # F: Administration
    enabled: bool = True
    allowed_screens: List[str] = []  # empty = all screens
    blocked_screens: List[str] = []

    # Metadata
    updated_by: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "yuki_config"
        indexes = ["environment", "enabled"]
