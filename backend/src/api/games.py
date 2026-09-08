from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from pydantic import BaseModel
from src.api.auth import get_current_user
from src.services.game_engine_service import GameEngineService
from src.models.message import Message, MessageType
from src.models.creative_identity import GameType
from src.models.user import User

router = APIRouter(tags=["Creative Identity Games"])

class GameInviteRequest(BaseModel):
    match_id: str
    other_user_id: str
    game_type: GameType
    prompt_id: str

class GameActionRequest(BaseModel):
    message_id: str
    action: str # ACCEPT, ANSWER, REACT
    payload: Optional[dict] = None

@router.get("/prompts/{game_type}")
async def get_prompts(game_type: GameType, intensity: int = 1):
    """Get prompts for a specific game type"""
    return GameEngineService.get_prompts(game_type, intensity)

@router.get("/dashboard")
async def get_dashboard(user: User = Depends(get_current_user)):
    """Get status of all games for the Creative Identity Dashboard"""
    # In a real app, calculate progress based on user profile
    # For MVP, return static list with some dynamic "unlocked" state
    
    # Needs Profile to check unlocked levels
    from src.models.profile import Profile
    profile = await Profile.find_one(Profile.user_id == str(user.id))
    level = 1
    if profile and profile.creative_identity:
        level = profile.creative_identity.unlocked_levels
        
    return [
        {
            "id": "icebreaker",
            "title": "Romper el Hielo",
            "description": "Preguntas para conocerse mejor.",
            "icon": "👋",
            "type": "ICEBREAKER",
            "status": "available", 
            "level_required": 1
        },
        {
            "id": "truth_or_dare",
            "title": "Verdad o Reto",
            "description": "Desafíos y confesiones.",
            "icon": "🎲",
            "type": "TRUTH_OR_DARE", 
            "status": "available" if level >= 1 else "locked",
            "level_required": 1
        },
        {
            "id": "never_have_i_ever",
            "title": "Yo Nunca Nunca",
            "description": "Descubre secretos divertidos (50/50).",
            "icon": "🍺",
            "type": "NEVER_HAVE_I_EVER",
            "status": "locked" if level < 3 else "available",
            "level_required": 3
        },
        {
            "id": "hot_questions",
            "title": "Preguntas Hot",
            "description": "Solo para valientes. Requiere consentimiento.",
            "icon": "🔥",
            "type": "HOT_QUESTIONS", 
            "status": "locked" if level < 5 else "available",
             "level_required": 5
        }
    ]

@router.post("/chat/start")
async def start_game_session(request: GameInviteRequest, user: User = Depends(get_current_user)):
    """Start a new game session in chat"""
    try:
        msg = await GameEngineService.create_game_session(
            request.match_id,
            str(user.id),
            request.other_user_id,
            request.game_type,
            request.prompt_id
        )
        return msg
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/chat/action")
async def handle_game_action(request: GameActionRequest, user: User = Depends(get_current_user)):
    """Handle an action in an active game session"""
    try:
        msg = await GameEngineService.handle_game_action(
            request.message_id,
            str(user.id),
            request.action,
            request.payload
        )
        return msg
        return msg
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

class CreatePromptRequest(BaseModel):
    text: str
    game_type: GameType
    category: Optional[str] = None

@router.post("/custom-prompt")
async def create_custom_prompt(request: CreatePromptRequest, user: User = Depends(get_current_user)):
    """Add a custom prompt/script to user's creative identity"""
    from src.models.profile import Profile
    from src.models.creative_identity import GamePrompt, CreativeIdentity
    import uuid
    
    profile = await Profile.find_one(Profile.user_id == str(user.id))
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
        
    if not profile.creative_identity:
        profile.creative_identity = CreativeIdentity()
        
    new_prompt = GamePrompt(
        id=f"custom_{uuid.uuid4().hex[:8]}",
        text=request.text,
        game_type=request.game_type,
        category=request.category,
        intensity=1
    )
    
    profile.creative_identity.custom_prompts.append(new_prompt)
    await profile.save()
    
    return new_prompt
