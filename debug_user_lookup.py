import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from src.core.config import settings
from src.models.user import User
from src.models.profile import Profile
from beanie import init_beanie

async def main():
    # Connect to DB (using standard local connection if settings not loaded, or try to load settings)
    # Assuming MONGODB_URL is available or default
    db_url = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    db_name = os.getenv("MONGODB_DB_NAME", "redthread")
    
    print(f"Connecting to {db_url} / {db_name}")
    client = AsyncIOMotorClient(db_url)
    await init_beanie(database=client[db_name], document_models=[User, Profile])
    
    with open("debug_output.txt", "w") as f:
        # Search for 'maria'
        f.write("Searching for users with nickname like 'maria'...\n")
        users = await User.find({"nickname": {"$regex": "maria", "$options": "i"}}).to_list()
        
        if not users:
            f.write("No users found matching nickname 'maria'\n")
            
            # Try searching by email
            f.write("Searching by email 'maria@redthread.com'...\n")
            user_by_email = await User.find_one({"email": "maria@redthread.com"})
            if user_by_email:
                users = [user_by_email]
                f.write(f"FOUND user by email! Nickname is: '{user_by_email.nickname}'\n")
            else:
                f.write("No user found by email either.\n")
        else:
            for u in users:
                f.write(f"User Found: ID={u.id}, Nickname='{u.nickname}'\n")
                
                # Check profile
                profile = await Profile.find_one(Profile.user_id == str(u.id))
                if profile:
                    f.write(f"  -> Profile Found: Visible={profile.profile_visible}, Completion={profile.profile_completion}%\n")
                else:
                    f.write(f"  -> NO Profile found for this user.\n")

if __name__ == "__main__":
    import sys
    # Add backend path to sys.path
    sys.path.append(os.path.join(os.getcwd(), 'backend'))
    asyncio.run(main())
