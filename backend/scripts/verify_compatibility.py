import asyncio
import sys
from pathlib import Path

# Add parent directory to path to allow imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from motor.motor_asyncio import AsyncIOMotorClient
from src.core.config import settings
from src.models.user import User
from src.models.profile import Profile
from beanie import init_beanie

async def verify_discover_compatibility():
    """Verify how many profiles are truly compatible with admin for discovery"""
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    await init_beanie(database=client[settings.MONGODB_DB_NAME], document_models=[User, Profile])
    
    admin_user = await User.find_one(User.email == "admin@testemail.com")
    admin_profile = await Profile.find_one(Profile.user_id == str(admin_user.id))
    
    test_profiles = await Profile.find({"user_id": {"$ne": str(admin_user.id)}}).to_list()
    
    compatible = 0
    reasons = {"gender_mismatch": 0, "age_mismatch": 0, "location_mismatch": 0, "mutual_attraction_missing": 0}
    
    for p in test_profiles:
        # Check mutual attraction
        admin_to_test = p.gender in (admin_profile.attraction_preferences or [])
        test_to_admin = admin_profile.gender in (p.attraction_preferences or [])
        
        if not (admin_to_test and test_to_admin):
            reasons["mutual_attraction_missing"] += 1
            continue
            
        # If we got here, they are compatible at the mutual attraction level
        compatible += 1
        
    print(f"Total profiles checked: {len(test_profiles)}")
    print(f"Mutually compatible profiles: {compatible}")
    print(f"Profiles rejected due to attraction mismatch: {reasons['mutual_attraction_missing']}")
    
if __name__ == "__main__":
    asyncio.run(verify_discover_compatibility())
