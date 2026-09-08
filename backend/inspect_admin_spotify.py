import asyncio
import sys
import traceback
from motor.motor_asyncio import AsyncIOMotorClient
from src.core.config import settings
from pprint import pprint

async def inspect_admin_spotify():
    try:
        client = AsyncIOMotorClient(settings.MONGODB_URL)
        db = client[settings.MONGODB_DB_NAME]
        users_collection = db.users
        profiles_collection = db.profiles

        print("--- Inspecting Users ---")
        sys.stdout.flush()
        
        users = await users_collection.find({}).to_list(length=100)
        
        target_user = None
        
        print(f"Found {len(users)} users.")
        for user in users:
            if not user: continue
            email = user.get('email', 'No Email')
            print(f"User: {email}")
            
            # Check for admin or specific user
            if 'admin' in str(email).lower():
                target_user = user
                print(f"  -> Potential Target matched by email")
            
            if user.get('spotify_access_token'):
                print(f"  -> Has Spotify Token")
                target_user = user # prioritize this one
                
        if target_user:
            print(f"\n--- Inspecting Profile for {target_user.get('email')} ---")
            profile = await profiles_collection.find_one({"user_id": str(target_user["_id"])})
            
            if profile:
                print("Profile Found.")
                mi_himno = profile.get("mi_himno") or {}
                if mi_himno is None: mi_himno = {}
                
                print("mi_himno data:")
                pprint(mi_himno)
                
                # keys check
                artists = mi_himno.get('favorite_artists', [])
                songs = mi_himno.get('featured_songs', [])
                
                print(f"  Artists count: {len(artists) if artists else 0}")
                print(f"  Songs count: {len(songs) if songs else 0}")
                print(f"  Connected: {mi_himno.get('connected')}")
                
                print("\nSpotify Token Info:")
                print(f"Token: {'Present' if target_user.get('spotify_access_token') else 'None'}")
                expires = target_user.get('spotify_token_expires_at')
                print(f"Expires: {expires}")
                
                from datetime import datetime
                if expires:
                     print(f"Expired? {expires < datetime.utcnow() if hasattr(expires, 'tzinfo') is None else 'TZ Check needed'}")
            else:
                print("No profile found for this user.")
        else:
            print("No likely Admin user found.")
            
    except Exception as e:
        print("ERROR OCCURRED:")
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(inspect_admin_spotify())
