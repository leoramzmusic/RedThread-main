from pydantic import BaseModel, field_validator
from enum import StrEnum
from typing import List

class IntentionType(StrEnum):
    FRIENDSHIP = "friendship"
    GAMING = "gaming"

class TestProfile(BaseModel):
    intentions: List[IntentionType] = []
    
    @field_validator("intentions", mode="before")
    @classmethod
    def validate_intentions(cls, v):
        if not isinstance(v, list):
            return v
        cleaned = []
        for item in v:
            if isinstance(item, str) and item.startswith("IntentionType."):
                val = item.split(".")[-1].lower()
                if val == "conversation": val = "conversations"
                cleaned.append(val)
            else:
                cleaned.append(item)
        return cleaned

def test_validator():
    bad_data = {
        "intentions": ["IntentionType.FRIENDSHIP", "IntentionType.GAMING", "friendship"]
    }
    
    try:
        profile = TestProfile(**bad_data)
        print(f"Cleaned intentions: {profile.intentions}")
        print(f"Types: {[type(i) for i in profile.intentions]}")
        
        expected = [IntentionType.FRIENDSHIP, IntentionType.GAMING, IntentionType.FRIENDSHIP]
        assert profile.intentions == expected
        print("✅ Validator logic verification successful!")
    except Exception as e:
        print(f"❌ Verification failed: {e}")

if __name__ == "__main__":
    test_validator()
