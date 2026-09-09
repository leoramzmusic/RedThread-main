from beanie import Document
from pydantic import Field
from typing import Dict, Any, Optional
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
    notification_frequency: Dict[str, bool] = Field(default_factory=lambda: {
        "suggestions": True,
        "messages": True,
        "news": True,
        "matches": True
    })
    do_not_disturb: Dict[str, Any] = Field(default_factory=lambda: {
        "enabled": False,
        "start_time": "22:00",
        "end_time": "08:00"
    })
    offline_notifications: bool = True
    
    # 🔒 Seguridad
    two_factor_enabled: bool = False
    two_factor_method: str = "email"  # email, sms, authenticator
    
    # 🔒 Privacidad
    hide_visit_activity: bool = False  # If True, visits to other profiles are not recorded
    
    # 🧠 Accesibilidad
    high_contrast_mode: bool = False
    screen_reader_enabled: bool = False
    keyboard_navigation: bool = False
    reduced_motion: bool = False
    
    # 🧰 Avanzado
    auto_save: bool = True
    
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
