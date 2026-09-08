from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from enum import Enum
from datetime import datetime

class GameType(str, Enum):
    TRUTH_OR_DARE = "truth_or_dare"
    NEVER_HAVE_I_EVER = "never_have_i_ever"
    MOST_LIKELY = "most_likely"
    HOT_QUESTIONS = "hot_questions"
    FUNNY_QUESTIONS = "funny_questions"
    ICEBREAKER = "icebreaker" # The 36 questions fall here

class Visibility(str, Enum):
    PRIVATE = "private"
    PARTIAL = "partial" # Visible on profile to friends/matches
    CHAT_ONLY = "chat_only" # Only visible when shared in chat

class GamePrompt(BaseModel):
    id: str
    text: str
    game_type: GameType
    intensity: int = 1 # 1-5, determines unlock level
    category: Optional[str] = None # e.g., "vulnerability", "fun", "spicy"
    rules: Optional[dict] = None # Specific rules like "50/50" or "Truth" vs "Dare"

class UserGameResponse(BaseModel):
    prompt_id: str
    response_text: str
    response_type: str = "text" # text, choice, bool
    visibility: Visibility = Visibility.CHAT_ONLY
    created_at: datetime = Field(default_factory=datetime.utcnow)
    metadata: Optional[dict] = None # emotion, etc.

class CreativeIdentity(BaseModel):
    """
    Embedded in Profile. 
    Stores the user's progress and static responses to creative games.
    """
    unlocked_levels: int = 1
    experiences_completed: int = 0
    responses: List[UserGameResponse] = []
    custom_prompts: List[GamePrompt] = [] # User-created scripts/questions
    
    # Preferences / Limits
    allow_hot_questions: bool = False
    allow_confessions: bool = False
    
    model_config = {"extra": "ignore"}
