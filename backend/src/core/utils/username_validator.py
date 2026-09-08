"""
Username validation utilities for the three-tier identity system.
"""
import re
from typing import Tuple


# Reserved usernames that cannot be registered
RESERVED_USERNAMES = {
    "admin", "administrator", "api", "support", "help", "about", "contact",
    "terms", "privacy", "settings", "profile", "user", "users", "login",
    "logout", "register", "signup", "signin", "auth", "dashboard", "discover",
    "chat", "messages", "notifications", "friends", "matches", "search",
    "explore", "trending", "popular", "new", "redthread", "official",
    "moderator", "mod", "staff", "team", "system", "root", "null", "undefined"
}


def validate_username(username: str) -> Tuple[bool, str]:
    """
    Validate username format and content.
    
    Args:
        username: The username to validate
        
    Returns:
        Tuple of (is_valid, error_message)
        If valid, error_message will be empty string
    """
    # Check if username is provided
    if not username:
        return False, "Username is required"
    
    # Check length (3-30 characters)
    if len(username) < 3:
        return False, "Username must be at least 3 characters long"
    
    if len(username) > 30:
        return False, "Username must be at most 30 characters long"
    
    # Check format: alphanumeric, underscores, hyphens only
    # Must start with alphanumeric
    if not re.match(r'^[a-zA-Z0-9][a-zA-Z0-9_-]*$', username):
        return False, "Username must start with a letter or number and contain only letters, numbers, underscores, and hyphens"
    
    # Cannot end with underscore or hyphen
    if username.endswith('_') or username.endswith('-'):
        return False, "Username cannot end with an underscore or hyphen"
    
    # Cannot have consecutive special characters
    if '__' in username or '--' in username or '_-' in username or '-_' in username:
        return False, "Username cannot contain consecutive special characters"
    
    # Check if reserved
    if username.lower() in RESERVED_USERNAMES:
        return False, "This username is reserved and cannot be used"
    
    return True, ""


def sanitize_username(input_string: str) -> str:
    """
    Convert an input string (like email) to a valid username format.
    Useful for auto-generating usernames during migration.
    
    Args:
        input_string: String to convert to username
        
    Returns:
        Sanitized username string
    """
    # Take only the part before @ if it's an email
    if '@' in input_string:
        input_string = input_string.split('@')[0]
    
    # Remove invalid characters
    username = re.sub(r'[^a-zA-Z0-9_-]', '', input_string)
    
    # Ensure it starts with alphanumeric
    username = re.sub(r'^[^a-zA-Z0-9]+', '', username)
    
    # Remove consecutive special characters
    username = re.sub(r'[_-]{2,}', '_', username)
    
    # Remove trailing special characters
    username = username.rstrip('_-')
    
    # Ensure minimum length
    if len(username) < 3:
        username = username + "user"
    
    # Ensure maximum length
    if len(username) > 30:
        username = username[:30]
    
    return username.lower()

