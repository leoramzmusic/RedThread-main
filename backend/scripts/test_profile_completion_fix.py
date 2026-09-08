import asyncio
import sys
from pathlib import Path

# Add backend directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from src.models.profile import Profile, MiHimno
from src.api.profiles import calculate_profile_completion

from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from src.core.config import settings
from src.models.user import User

async def test_fix():
    print("Testing calculate_profile_completion with mi_himno as dict...")
    
    # Initialize Beanie (minimal)
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    await init_beanie(
        database=client[settings.MONGODB_DB_NAME],
        document_models=[User, Profile]
    )
    
    # Mock profile with mi_himno as dict
    profile = Profile(
        user_id="test_user",
        gender="male",
        nickname="Test",
        mi_himno={
            "connected": "spotify",
            "favorite_artists": []
        }
    )
    
    try:
        completion = calculate_profile_completion(profile)
        print(f"Success! Completion score: {completion}%")
        
        # Test with object too
        profile.mi_himno = MiHimno(connected="spotify", favorite_artists=[])
        completion_obj = calculate_profile_completion(profile)
        print(f"Success with object! Completion score: {completion_obj}%")
        
        if completion == completion_obj:
            print("Scores match! Fix verified.")
        else:
            print(f"Scores mismatch: {completion} vs {completion_obj}")
            
    except AttributeError as e:
        print(f"Failure! Caught AttributeError: {e}")
        import traceback
        traceback.print_exc()
    except Exception as e:
        print(f"Failure! Caught unexpected error: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_fix())
