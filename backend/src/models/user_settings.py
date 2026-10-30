from beanie import Document
from pydantic import Field
from typing import Dict, Any, List, Optional
from datetime import datetime


class UserSettings(Document):
    """
    User settings and preferences.
    Stores all user customization options.
    """

    user_id: str  # Reference to User._id

    # 🎨 Personalización Visual
    preferred_language: str = "es"
    theme_mode: str = "light"  # light, dark
    theme_color: str = "#FF6B6B"
    visual_theme: str = "redThread"
    font_size: str = "medium"  # small, medium, large

    # 🌐 Localización
    date_format: str = "DD/MM/YYYY"  # DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD
    time_format: str = "24h"  # 12h, 24h
    timezone: str = "auto"  # auto or IANA timezone string

    # 🔔 Notificaciones
    notifications_enabled: bool = True
    notification_frequency: Dict[str, bool] = Field(
        default_factory=lambda: {
            "suggestions": True,
            "messages": True,
            "news": True,
            "matches": True,
        }
    )
    notification_mutes: Dict[str, bool] = Field(default_factory=dict)
    reminder_mutes: List[str] = Field(default_factory=list)
    reminder_snoozes: Dict[str, datetime] = Field(default_factory=dict)
    # Configuración de rutinas DND (definida por el usuario; inmutable por acciones manuales)
    dnd_routines: List[Dict[str, Any]] = Field(default_factory=list)
    # Rutina personalizada seleccionada explícitamente por el usuario (solo una seleccionada a la vez)
    selected_routine_id: Optional[str] = None
    # Overrides temporales del estado efectivo (calculados, nunca derivados persistidos)
    manual_pause_until: Optional[datetime] = None        # DND forzado ON hasta este instante
    force_notifications_until: Optional[datetime] = None  # Notificaciones forzadas OFF hasta este instante
    offline_notifications: bool = True

    # 🔒 Seguridad
    two_factor_enabled: bool = False
    two_factor_method: str = "email"  # email, sms, authenticator

    # 🔒 Privacidad
    hide_visit_activity: bool = (
        False  # If True, visits to other profiles are not recorded
    )

    # 🧠 Accesibilidad
    high_contrast_mode: bool = False
    screen_reader_enabled: bool = False
    keyboard_navigation: bool = False
    reduced_motion: bool = False

    # 🧭 Personalización del Navbar
    navbar_config: Dict[str, Any] = Field(
        default_factory=lambda: {
            "shortcuts": {
                "home": True,
                "discover": True,
                "events": True,
                "plans": True,
                "favorites": False,
                "recent": False,
                "help": False,
                "notifications": True,
                "settings": True,
            },
            "icon_styles": {
                "theme": "basic",  # basic, glow, subtle, liquid, premium
                "notifications": "basic",
                "settings": "basic",
                "language": "basic",
            },
            "profile": {
                "shape": "circle",  # circle, square, diamond
                "border": "accent",  # none, thin, accent
                "glow": "accent",  # none, accent, passion
            },
        }
    )

    # Metadata
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "user_settings"
        indexes = [
            "user_id",
        ]

    def update_timestamp(self):
        """Update the updated_at timestamp"""
        self.updated_at = datetime.utcnow()
