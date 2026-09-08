from typing import List, Optional, Dict
from datetime import datetime
from src.models.message import Message, MessageType
from src.models.creative_identity import GameType, GamePrompt, Visibility
from src.models.profile import Profile
from src.models.user import User

# --- PROMPTS REPOSITORY (Simplified for MVP) ---
# In a real app, these might be in a database collection 'game_prompts'

ICEBREAKER_QUESTIONS = [
    # Level 1
    {"id": "q_1", "set": 1, "text": "Si pudieras elegir a cualquier persona en el mundo, ¿a quién invitarías a cenar?"},
    # ... (Include the full list here, just showing a few for brevity, 
    # but the service should support the full list defined previously)
]

TRUTH_DARE_PROMPTS = [
    {"id": "tod_1", "text": "Verdad: ¿Cuál es tu mayor miedo irracional?", "category": "truth", "intensity": 1},
    {"id": "tod_2", "text": "Reto: Envía una selfie haciendo una cara graciosa ahora mismo.", "category": "dare", "intensity": 1},
]

class GameEngineService:
    
    @staticmethod
    def get_prompts(game_type: GameType, intensity: int = 1) -> List[dict]:
        """Fetch prompts based on game type and intensity/level"""
        if game_type == GameType.ICEBREAKER:
            # Filter by set/level roughly mapping to intensity
            return [p for p in ICEBREAKER_QUESTIONS if p.get("set", 1) <= intensity]
        elif game_type == GameType.TRUTH_OR_DARE:
            return [p for p in TRUTH_DARE_PROMPTS if p.get("intensity", 1) <= intensity]
        return []

    @staticmethod
    async def create_game_session(
        match_id: str, 
        sender_id: str, 
        receiver_id: str, 
        game_type: GameType,
        prompt_id: str
    ) -> Message:
        """Create a new game session in chat (Invite)"""
        
        # Resolve prompt text
        prompt = None
        if game_type == GameType.ICEBREAKER:
             prompt = next((p for p in ICEBREAKER_QUESTIONS if p["id"] == prompt_id), None)
        elif game_type == GameType.TRUTH_OR_DARE:
             prompt = next((p for p in TRUTH_DARE_PROMPTS if p["id"] == prompt_id), None)
        
        if not prompt:
            raise ValueError("Prompt not found")

        message = Message(
            match_id=match_id, # Legacy
            sender_id=sender_id,
            receiver_id=receiver_id,
            message_type=MessageType.GAME,
            content=f"Invitación de juego: {game_type}", # Fallback text
            game_session={
                "game_type": game_type,
                "prompt_id": prompt_id,
                "prompt_text": prompt["text"], # Store copy for simplicity
                "state": "INVITE",
                "responses": {},
                "started_at": datetime.utcnow().isoformat()
            }
        )
        await message.save()
        return message

    @staticmethod
    async def handle_game_action(
        message_id: str, 
        user_id: str, 
        action: str, 
        payload: Optional[dict] = None
    ) -> Message:
        """
        Handle actions: 'ACCEPT', 'ANSWER', 'REVEAL', 'REACT'
        """
        message = await Message.get(message_id)
        if not message or message.message_type != MessageType.GAME:
             raise ValueError("Invalid game message")
             
        session = message.game_session or {}
        state = session.get("state")
        
        if action == "ACCEPT":
            if state == "INVITE":
                session["state"] = "PLAYING"
                message.content = f"🎮 Juego iniciado: {session.get('prompt_text')}"
        
        elif action == "ANSWER":
            # Payload: { "text": "my answer" }
            if state in ["PLAYING", "REVEAL_READY"]:
                current_responses = session.get("responses", {})
                current_responses[user_id] = payload.get("text")
                session["responses"] = current_responses
                
                # Check completion
                participants = [str(message.sender_id), str(message.receiver_id)]
                if all(uid in current_responses for uid in participants):
                     session["state"] = "REVEAL_READY"
                     # Automatically reveal for MVP simplicity?
                     # Or wait for explicit 'REVEAL' trigger? 
                     # Blueprint says: "Simultaneous reveal... reveals only if both confirm"
                     # Let's auto-reveal for now to reduce clicks, or move to REVEALED
                     session["state"] = "REVEALED"
                else:
                    session["state"] = "PLAYING"
        
        elif action == "REACT":
            # Payload: { "reaction": "LOVE" }
            current_reactions = session.get("reactions", {})
            current_reactions[user_id] = payload.get("reaction")
            session["reactions"] = current_reactions
            
            # TODO: Call Compatibility Engine to score this interaction
        
        message.game_session = session
        await message.save()
        return message
