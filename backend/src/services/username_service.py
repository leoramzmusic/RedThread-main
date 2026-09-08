import re
import unicodedata
from typing import List, Dict
from datetime import datetime
from src.models.user import User


class UsernameService:
    """Service for username validation, normalization, and suggestions"""
    
    MIN_LENGTH = 3
    MAX_LENGTH = 30
    
    # Allowed: letters (Unicode), numbers, underscore, dot
    VALID_PATTERN = re.compile(r'^[\w\u0080-\uFFFF._]+$')
    
    # Emotional words for suggestions (multi-language)
    EMOTIONAL_WORDS = [
        # Spanish
        "conecta", "vibra", "hilo", "ritual", "pulso", "eco", "lazo", "vinculo",
        # English
        "thread", "vibe", "pulse", "echo", "bond", "link", "connect", "flow",
        # Universal
        "reth", "soul", "alma", "heart", "corazon"
    ]
    
    @staticmethod
    def normalize(username: str) -> str:
        """Normalize username for comparison (lowercase)"""
        return username.lower()
    
    @staticmethod
    def validate(username: str) -> Dict[str, any]:
        """
        Validate username against all rules
        
        Returns:
            dict with 'valid' (bool) and 'errors' (list of error codes)
        """
        errors = []
        
        if len(username) < UsernameService.MIN_LENGTH:
            errors.append("too_short")
        
        if len(username) > UsernameService.MAX_LENGTH:
            errors.append("too_long")
        
        if not UsernameService.VALID_PATTERN.match(username):
            errors.append("invalid_characters")
        
        # No spaces allowed
        if ' ' in username:
            errors.append("no_spaces")
        
        # Cannot start or end with dot or underscore
        if username.startswith(('.', '_')) or username.endswith(('.', '_')):
            errors.append("invalid_format")
        
        return {
            "valid": len(errors) == 0,
            "errors": errors
        }
    
    @staticmethod
    async def is_available(username: str) -> bool:
        """
        Check if username corresponds to an available nickname (case-insensitive)
        
        Args:
            username: The username to check
            
        Returns:
            True if available, False if taken
        """
        normalized = UsernameService.normalize(username)
        # nickname is already indexed and unique in User model
        existing = await User.find_one(User.nickname == normalized)
        return existing is None
    
    @staticmethod
    async def generate_suggestions(base_username: str, count: int = 5) -> List[str]:
        """
        Generate available username suggestions based on the base username
        
        Args:
            base_username: The original username that was taken
            count: Number of suggestions to generate (default: 5)
            
        Returns:
            List of available username suggestions
        """
        suggestions = []
        normalized_base = UsernameService.normalize(base_username)
        
        # Remove any trailing numbers from base for better suggestions
        base_clean = re.sub(r'\d+$', '', normalized_base)
        
        # Strategy 1: Add numbers (1-99)
        for i in range(1, 100):
            candidate = f"{base_clean}{i}"
            if len(candidate) <= UsernameService.MAX_LENGTH:
                if await UsernameService.is_available(candidate):
                    suggestions.append(candidate)
                    if len(suggestions) >= count:
                        return suggestions
        
        # Strategy 2: Add emotional words
        import random
        emotional_sample = random.sample(
            UsernameService.EMOTIONAL_WORDS, 
            min(6, len(UsernameService.EMOTIONAL_WORDS))
        )
        
        for word in emotional_sample:
            # Try with underscore
            candidate = f"{base_clean}_{word}"
            if len(candidate) <= UsernameService.MAX_LENGTH:
                if await UsernameService.is_available(candidate):
                    suggestions.append(candidate)
                    if len(suggestions) >= count:
                        return suggestions
            
            # Try without underscore
            candidate = f"{base_clean}{word}"
            if len(candidate) <= UsernameService.MAX_LENGTH:
                if await UsernameService.is_available(candidate):
                    suggestions.append(candidate)
                    if len(suggestions) >= count:
                        return suggestions
        
        # Strategy 3: Add year
        current_year = datetime.now().year
        for year in [current_year, current_year - 1, current_year + 1, 2000, 2024]:
            candidate = f"{base_clean}{year}"
            if len(candidate) <= UsernameService.MAX_LENGTH:
                if await UsernameService.is_available(candidate):
                    suggestions.append(candidate)
                    if len(suggestions) >= count:
                        return suggestions
        
        # Strategy 4: Add narrative symbols
        for suffix in [".thread", ".hilo", "_reth", "_ritual", ".soul", ".vibe"]:
            candidate = f"{base_clean}{suffix}"
            if len(candidate) <= UsernameService.MAX_LENGTH:
                if await UsernameService.is_available(candidate):
                    suggestions.append(candidate)
                    if len(suggestions) >= count:
                        return suggestions
        
        # Strategy 5: Combine number + word
        for i in [1, 2, 3]:
            for word in random.sample(["reth", "soul", "vibe"], 2):
                candidate = f"{base_clean}{i}{word}"
                if len(candidate) <= UsernameService.MAX_LENGTH:
                    if await UsernameService.is_available(candidate):
                        suggestions.append(candidate)
                        if len(suggestions) >= count:
                            return suggestions
        
        return suggestions[:count]
