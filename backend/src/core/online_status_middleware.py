"""
Middleware to automatically update user's last_seen timestamp on authenticated requests.
This enables online status tracking without requiring explicit status updates.
"""
from datetime import datetime
from fastapi import Request
from src.models.user import User


async def update_last_seen_middleware(request: Request, call_next):
    """
    Middleware that updates the last_seen timestamp for authenticated users.
    
    Users are considered "online" if their last_seen is within the last 5 minutes.
    """
    response = await call_next(request)
    
    # Check if user is authenticated
    if hasattr(request.state, "user") and request.state.user:
        try:
            user = request.state.user
            if isinstance(user, User):
                # Update last_seen timestamp
                # Update last_seen timestamp atomically to avoid overwriting other changes (like theme)
                await User.find_one(User.id == user.id).update({"$set": {"last_seen": datetime.utcnow()}})
        except Exception as e:
            # Log error but don't fail the request
            print(f"Error updating last_seen: {e}")
    
    return response
