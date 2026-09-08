from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel
from typing import Optional
from src.models.user import User
from src.services.auth.routes import get_current_user

router = APIRouter()

class UpdateSettingsRequest(BaseModel):
    preferred_language: Optional[str] = None
    theme_mode: Optional[str] = None
    theme_color: Optional[str] = None
    notifications_enabled: Optional[bool] = None

@router.get("/me")
async def get_settings(current_user: User = Depends(get_current_user)):
    """Get current user settings"""
    return {
        "preferred_language": current_user.preferred_language,
        "theme_mode": current_user.theme_mode,
        "theme_color": current_user.theme_color,
        "notifications_enabled": current_user.notifications_enabled,
    }

@router.put("/me")
async def update_settings(
    request: UpdateSettingsRequest,
    current_user: User = Depends(get_current_user)
):
    """Update current user settings"""
    update_data = request.dict(exclude_unset=True)
    
    for field, value in update_data.items():
        setattr(current_user, field, value)
    
    await current_user.save()
    
    return {
        "preferred_language": current_user.preferred_language,
        "theme_mode": current_user.theme_mode,
        "theme_color": current_user.theme_color,
        "notifications_enabled": current_user.notifications_enabled,
    }

