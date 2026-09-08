
import sys
import os
sys.path.append(os.getcwd())

from src.api.dtos.user_dtos import PublicUserDTO
from src.models.user import User, SubscriptionTier
from src.models.profile import Profile
from datetime import datetime

def test_debug():
    try:
        user = User(
            id="test_user_123",
            display_name="Johnny",
            nickname="johnny_2024",
            verified=True,
            subscription_tier=SubscriptionTier.PREMIUM
        )
        
        profile = Profile(
            user_id="test_user_123",
            age=25,
            gender="male",
            location={"type": "Point", "coordinates": [-99.1332, 19.4326], "city": "Mexico City"}
        )
        
        print("Creating DTO...")
        dto = PublicUserDTO.from_user_and_profile(user, profile)
        print("DTO created successfully!")
        print(dto.dict())
    except Exception as e:
        print(f"FAILED with error type: {type(e).__name__}")
        print(f"Error message: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_debug()
