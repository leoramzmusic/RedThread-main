from src.models.profile import Profile, IntentionType
from pydantic import ValidationError
import traceback

def test_validator():
    bad_data = {
        "user_id": "test_user",
        "gender": "male",
        "intentions": ["IntentionType.FRIENDSHIP", "IntentionType.GAMING", "friendship"]
    }
    
    try:
        # Use model_validate for Pydantic v2 validation without needing Beanie collection init
        profile = Profile.model_validate(bad_data)
        print(f"Cleaned intentions: {profile.intentions}")
        print(f"Types: {[type(i) for i in profile.intentions]}")
        
        expected = [IntentionType.FRIENDSHIP, IntentionType.GAMING, IntentionType.FRIENDSHIP]
        # In Pydantic v2 with StrEnum, they should be exact matches
        assert profile.intentions == expected
        print("✅ Validator verification successful!")
    except ValidationError as e:
        print(f"❌ Validation failed: {e}")
    except Exception as e:
        print(f"❌ Unexpected error Traceback:")
        traceback.print_exc()

if __name__ == "__main__":
    test_validator()
