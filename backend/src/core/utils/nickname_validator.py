"""
Nickname validation utilities for the three-tier identity system.
"""
import re
from typing import Tuple


# Reserved nicknames that cannot be registered
RESERVED_NICKNAMES = {
    "admin", "administrator", "api", "support", "help", "about", "contact",
    "terms", "privacy", "settings", "profile", "user", "users", "login",
    "logout", "register", "signup", "signin", "auth", "dashboard", "discover",
    "chat", "messages", "notifications", "friends", "matches", "search",
    "explore", "trending", "popular", "new", "redthread", "official",
    "moderator", "mod", "staff", "team", "system", "root", "null", "undefined"
}


def validate_nickname(nickname: str) -> Tuple[bool, str]:
    """
    Validate nickname format and content.
    
    Nicknames can contain:
    - Uppercase and lowercase letters
    - Numbers
    - Special characters: . _ - @
    - No spaces
    
    Args:
        nickname: The nickname to validate
        
    Returns:
        Tuple of (is_valid, error_message)
        If valid, error_message will be empty string
    """
    # Check if nickname is provided
    if not nickname:
        return False, "Nickname is required"
    
    # Check length (3-30 characters)
    if len(nickname) < 3:
        return False, "Nickname must be at least 3 characters long"
    
    if len(nickname) > 30:
        return False, "Nickname must be at most 30 characters long"
    
    # Check for spaces
    if ' ' in nickname:
        return False, "Nickname cannot contain spaces"
    
    # Check format: letters, numbers, and allowed special characters (. _ - @)
    if not re.match(r'^[a-zA-Z0-9._@-]+$', nickname):
        return False, "Nickname can only contain letters, numbers, and the characters: . _ - @"
    
    # Check if reserved (case-insensitive)
    if nickname.lower() in RESERVED_NICKNAMES:
        return False, "This nickname is reserved and cannot be used"
    
    return True, ""


def sanitize_nickname(input_string: str) -> str:
    """
    Convert an input string (like email or ID) to a valid nickname format.
    Useful for auto-generating nicknames from user ID.
    
    Args:
        input_string: String to convert to nickname
        
    Returns:
        Sanitized nickname string
    """
    # Take only the part before @ if it's an email
    if '@' in input_string:
        input_string = input_string.split('@')[0]
    
    # Remove invalid characters (keep only letters, numbers, . _ - @)
    nickname = re.sub(r'[^a-zA-Z0-9._@-]', '', input_string)
    
    # Remove spaces
    nickname = nickname.replace(' ', '')
    
    # Ensure minimum length
    if len(nickname) < 3:
        nickname = nickname + "_user"
    
    # Ensure maximum length
    if len(nickname) > 30:
        nickname = nickname[:30]
    
    return nickname

