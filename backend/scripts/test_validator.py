from typing import List, Optional
from pydantic import BaseModel, field_validator
from enum import StrEnum

class IntentionType(StrEnum):
    SERIOUS_RELATIONSHIP = "serious_relationship"
    FRIENDSHIP = "friendship"
    CONVERSATION = "conversations"

class ProfileMock(BaseModel):
    intentions: List[IntentionType] = []

    @field_validator("intentions", mode="before")
    @classmethod
    def validate_intentions(cls, v):
        if not isinstance(v, list):
            return v
        cleaned = []
        for item in v:
            if isinstance(item, str):
                val = item
                if val.startswith("IntentionType."):
                    val = val.split(".")[-1].lower()
                
                # Normalize case
                val = val.lower()
                
                # Normalize common singular/plural mismatches
                if val == "conversation": 
                    val = "conversations"
                
                cleaned.append(val)
            else:
                cleaned.append(item)
        return cleaned

def test_validator():
    test_cases = [
        ["conversation"],
        ["IntentionType.CONVERSATION"],
        ["friendship", "conversation"],
        ["IntentionType.FRIENDSHIP", "CONVERSATION"],
    ]
    
    for case in test_cases:
        try:
            p = ProfileMock(intentions=case)
            print(f"INPUT: {case}")
            print(f"OUTPUT: {[str(i) for i in p.intentions]}")
            print("-" * 10)
        except Exception as e:
            print(f"INPUT: {case} -> FAILED: {e}")

if __name__ == "__main__":
    test_validator()
