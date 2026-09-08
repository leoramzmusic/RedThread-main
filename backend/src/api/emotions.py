from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Dict, Any, Optional
from datetime import datetime, timedelta
from src.models.user import User
from src.api.auth import get_current_user

router = APIRouter()

class EmotionSetRequest(BaseModel):
    emotion: str  # enamorado, triste, amistoso, alegre, reflexivo

# Color palettes mapping
EMOTION_PALETTES = {
    "enamorado": {
        "primary": "#FF6B6B",  # Red Thread Red
        "secondary": "#E74C3C",
        "background": "#FFF5F5",
        "text": "#2C3E50"
    },
    "triste": {
        "primary": "#4A90E2",  # Soft Blue
        "secondary": "#357ABD",
        "background": "#F0F8FF",
        "text": "#2C3E50"
    },
    "amistoso": {
        "primary": "#32CD32",  # Lime Green
        "secondary": "#27AE60",
        "background": "#F0FFF0",
        "text": "#2C3E50"
    },
    "alegre": {
        "primary": "#FFD700",  # Gold/Yellow
        "secondary": "#F1C40F",
        "background": "#FFFFF0",
        "text": "#2C3E50"
    },
    "reflexivo": {
        "primary": "#2F2F2F",  # Dark Grey
        "secondary": "#BDC3C7",
        "background": "#F5F5F5",
        "text": "#2C3E50"
    }
}

@router.get("/check")
async def check_emotional_status(
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Check if the user needs to set their emotion for today.
    Resets every day at 12:00 AM local time (approximated by UTC for now).
    """
    now = datetime.utcnow()
    
    # If never set, return true
    if not current_user.emotional_status_updated_at:
        return {"needs_update": True}
    
    # Check if last update was before today's 12:00 AM
    # Logic: If last update date < current date
    last_update = current_user.emotional_status_updated_at
    
    # Simple check: is it a different day?
    if last_update.date() < now.date():
        return {"needs_update": True}
        
    return {
        "needs_update": False,
        "current_emotion": current_user.emotional_status,
        "palette": current_user.theme_palette
    }

@router.post("/set")
async def set_emotional_status(
    request: EmotionSetRequest,
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Set the user's emotional status for the day.
    Updates the theme palette accordingly.
    """
    emotion = request.emotion.lower()
    
    if emotion not in EMOTION_PALETTES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid emotion. Choose from: enamorado, triste, amistoso, alegre, reflexivo"
        )
    
    # Update user
    current_user.emotional_status = emotion
    current_user.emotional_status_updated_at = datetime.utcnow()
    current_user.theme_palette = EMOTION_PALETTES[emotion]
    
    await current_user.save()
    
    return {
        "message": f"Emotion set to {emotion}",
        "palette": current_user.theme_palette
    }

