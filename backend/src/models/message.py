from beanie import Document, Indexed
from pydantic import Field, HttpUrl
from typing import Optional
from datetime import datetime
from enum import Enum


class MessageType(str, Enum):
    TEXT = "text"
    EMOJI = "emoji"
    GIF = "gif"
    STICKER = "sticker"
    VOICE = "voice"
    IMAGE = "image"
    ICEBREAKER = "icebreaker" # Legacy / Specific
    GAME = "game" # Generic for Truth/Dare, etc.
    RITUAL = "ritual" # Symbolic actions (Song, Question, Constellation)


class Message(Document):
    """Chat message model with real-time support"""
    
    # Conversation (supports both old and new system)
    match_id: Optional[Indexed(str)] = None  # LEGACY: Reference to Match._id
    conversation_id: Optional[Indexed(str)] = None  # NEW: Reference to Conversation._id
    sender_id: Indexed(str)  # User who sent the message
    receiver_id: Indexed(str)  # User who receives the message
    
    # Content
    message_type: MessageType = MessageType.TEXT
    content: str  # Text content or URL for media
    
    # Media (for GIFs, stickers, images, voice notes)
    media_url: Optional[HttpUrl] = None
    
    # Game Session Data (Generic)
    game_session: Optional[dict] = None 
    # Structure:
    # {
    #   "game_id": "icebreaker_q_1",  (or generic game id)
    #   "game_type": "icebreaker",
    #   "prompt_id": "q_1",
    #   "state": "INVITE" | "PLAYING" | "REVEAL_READY" | "REVEALED" | "CLOSED",
    #   "turn": "user_id" (optional),
    #   "responses": { "user_1": "payload", "user_2": "payload" }, (masked if not revealed)
    #   "reactions": { "user_1": "LOVE", ... }
    # }
    
    # Translation (Premium feature)
    original_language: Optional[str] = None
    translations: dict = {}  # {"es": "translated text", "fr": "..."}
    
    # Status
    is_read: bool = False
    read_at: Optional[datetime] = None
    
    # Metadata
    created_at: datetime = Field(default_factory=datetime.utcnow)
    edited_at: Optional[datetime] = None
    deleted_at: Optional[datetime] = None
    is_deleted: bool = False
    
    # Soft deletion per user
    deleted_by_sender: bool = False
    deleted_by_receiver: bool = False
    
    class Settings:
        name = "messages"
        indexes = [
            "match_id",
            "conversation_id",
            "sender_id",
            "receiver_id",
            "created_at",
            [("match_id", 1), ("created_at", -1)],  # For conversation history (legacy)
            [("conversation_id", 1), ("created_at", -1)],  # For conversation history (new)
        ]
    
    class Config:
        json_schema_extra = {
            "example": {
                "match_id": "507f1f77bcf86cd799439013",
                "sender_id": "507f1f77bcf86cd799439011",
                "receiver_id": "507f1f77bcf86cd799439012",
                "message_type": "text",
                "content": "Hey! How are you?",
                "is_read": False
            }
        }

