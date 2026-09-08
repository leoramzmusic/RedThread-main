"""
Script to restore Spotify connection status in profiles when user has valid Spotify tokens
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from src.core.config import settings
from datetime import datetime


async def restore_spotify_connection():
    """Restore connected status for users with valid Spotify tokens"""
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[settings.MONGODB_DB_NAME]
    users_collection = db.users
    profiles_collection = db.profiles
    
    print("🔄 Restoring Spotify connections...")
    
    # Find users with Spotify tokens
    cursor = users_collection.find({
        "spotify_access_token": {"$exists": True, "$ne": None}
    })
    
    restored_count = 0
    
    async for user in cursor:
        # Check if token is not expired
        token_expires = user.get("spotify_token_expires_at")
        now = datetime.utcnow()
        
        if token_expires:
            # Handle both timezone-aware and naive datetimes
            if hasattr(token_expires, 'tzinfo') and token_expires.tzinfo is not None:
                # Token is timezone-aware, make now aware too
                from datetime import timezone
                now = datetime.now(timezone.utc)
            
            if token_expires < now:
                print(f"  User {user['_id']}: Token expired at {token_expires}, skipping")
                continue
        else:
            print(f"  User {user['_id']}: No expiration date, assuming valid")
        
        # Find user's profile
        profile = await profiles_collection.find_one({"user_id": str(user["_id"])})
        if not profile:
            print(f"  User {user['_id']}: No profile found")
            continue
        
        # Check current mi_himno status
        mi_himno = profile.get("mi_himno", {})
        if mi_himno.get("connected") == "spotify":
            print(f"  Profile {profile['_id']}: Already connected")
            continue
        
        # Restore connection
        if not mi_himno:
            mi_himno = {}
        
        mi_himno["connected"] = "spotify"
        mi_himno["service"] = "spotify"
        
        await profiles_collection.update_one(
            {"_id": profile["_id"]},
            {"$set": {"mi_himno": mi_himno}}
        )
        
        print(f"  ✅ Profile {profile['_id']}: Restored Spotify connection")
        restored_count += 1
    
    print(f"✅ Restoration complete! Restored {restored_count} connections.")
    client.close()


if __name__ == "__main__":
    asyncio.run(restore_spotify_connection())
