from datetime import datetime

from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel
from typing import Optional, Dict, Any
from src.models.user import User
from src.models.user_settings import UserSettings
from src.api.auth import get_current_user

router = APIRouter()


class UpdateSettingsRequest(BaseModel):
    # Personalización Visual
    preferred_language: Optional[str] = None
    theme_mode: Optional[str] = None
    theme_color: Optional[str] = None
    visual_theme: Optional[str] = None
    font_size: Optional[str] = None
    
    # Localización
    date_format: Optional[str] = None
    time_format: Optional[str] = None
    timezone: Optional[str] = None
    
    # Notificaciones
    notifications_enabled: Optional[bool] = None
    notification_frequency: Optional[Dict[str, bool]] = None
    do_not_disturb: Optional[Dict[str, Any]] = None
    offline_notifications: Optional[bool] = None
    
    # Seguridad
    two_factor_enabled: Optional[bool] = None
    two_factor_method: Optional[str] = None
    
    # Privacidad
    hide_visit_activity: Optional[bool] = None
    
    # Accesibilidad
    high_contrast_mode: Optional[bool] = None
    screen_reader_enabled: Optional[bool] = None
    keyboard_navigation: Optional[bool] = None
    reduced_motion: Optional[bool] = None
    
    # Avanzado
    auto_save: Optional[bool] = None
    
    # Personalización del Navbar
    navbar_config: Optional[Dict[str, Any]] = None


@router.get("/me")
async def get_settings(current_user: User = Depends(get_current_user)):
    """Get current user settings"""
    # Find or create user settings using correct Beanie syntax
    user_settings = await UserSettings.find_one({"user_id": str(current_user.id)})
    
    if not user_settings:
        # Create default settings seeded with the authoritative user language
        user_settings = UserSettings(
            user_id=str(current_user.id),
            preferred_language=current_user.preferred_language,
        )
        await user_settings.insert()
    
    data = user_settings.dict(exclude={"id", "user_id", "created_at"})
    # Fuente de verdad del idioma: User.preferred_language (lo escribe PATCH /auth/me)
    data["preferred_language"] = current_user.preferred_language
    return data


@router.put("/me")
async def update_settings(
    request: UpdateSettingsRequest,
    current_user: User = Depends(get_current_user)
):
    """Update current user settings"""
    # Find or create user settings using correct Beanie syntax
    user_settings = await UserSettings.find_one({"user_id": str(current_user.id)})
    
    if not user_settings:
        user_settings = UserSettings(
            user_id=str(current_user.id),
            preferred_language=current_user.preferred_language,
        )
    
    # Update fields
    update_data = request.dict(exclude_unset=True)
    language = update_data.pop("preferred_language", None)
    for field, value in update_data.items():
        setattr(user_settings, field, value)

    if language is not None:
        # Keep both stores in sync; User is the source of truth for language
        user_settings.preferred_language = language
        current_user.preferred_language = language
        current_user.updated_at = datetime.utcnow()
        await current_user.save()
    
    # Update timestamp
    user_settings.update_timestamp()
    
    # Save
    if user_settings.id:
        await user_settings.save()
    else:
        await user_settings.insert()
    
    data = user_settings.dict(exclude={"id", "user_id", "created_at"})
    data["preferred_language"] = current_user.preferred_language
    return data


@router.post("/reset-visual")
async def reset_visual_settings(current_user: User = Depends(get_current_user)):
    """Reset visual settings to defaults"""
    user_settings = await UserSettings.find_one({"user_id": str(current_user.id)})
    
    if not user_settings:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Settings not found"
        )
    
    # Reset visual settings
    user_settings.theme_mode = "light"
    user_settings.theme_color = "#FF6B6B"
    user_settings.visual_theme = "redThread"
    user_settings.font_size = "medium"
    user_settings.high_contrast_mode = False
    user_settings.reduced_motion = False
    
    user_settings.update_timestamp()
    await user_settings.save()
    
    return {"message": "Visual settings reset successfully"}
