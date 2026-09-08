
import asyncio
from datetime import datetime
# Mock Profile to avoid Beanie init
class MockProfile:
    def __init__(self, **kwargs):
        self.age = 18
        self.interests = []
        self.lifestyle_interests = []
        self.intentions = []
        self.relationship_status = "single"
        self.is_verified = False
        self.education_level = None
        self.__dict__.update(kwargs)

async def test_matching():
    # Mock profiles
    user = MockProfile(
        user_id="u1", 
        age=25, 
        gender="male", 
        interests=["music", "travel", "coding"],
        lifestyle_interests=["meditation", "vegan"], 
        intentions=["serious_relationship"],
        relationship_status="single"
    )
    
    candidate_compatible = MockProfile(
        user_id="c1", 
        age=26, 
        gender="female",
        interests=["music", "coding", "hiking"],
        lifestyle_interests=["meditation"],
        intentions=["serious_relationship"],
        relationship_status="single"
    )
    
    candidate_opposite = MockProfile(
        user_id="c2", 
        age=25, 
        gender="female",
        interests=["sports", "cooking"], # No overlap
        lifestyle_interests=["party", "meat_lover"], # No overlap
        intentions=["serious_relationship"],
        relationship_status="single"
    )
    
    print("\n--- Testing Suggested Mode ---")
    score = MatchingService.calculate_score(user, candidate_compatible, mode="suggested")
    print(f"Compatible User Score: {score['total']}")
    print(f"Breakdown: {score['breakdown']}")
    
    print("\n--- Testing Opposites Mode ---")
    score_opp = MatchingService.calculate_score(user, candidate_opposite, mode="opposites")
    print(f"Opposite User Score: {score_opp['total']}")
    print(f"Breakdown: {score_opp['breakdown']}")
    
    # Assertions
    assert score['total'] > 50, "Compatible user should have high score"
    assert "music" in score['breakdown']['common_interests'], "Should find common interests"
    
    assert score_opp['total'] > 40, "Opposite user should have decent score in opposites mode"
    assert "sports" in score_opp['breakdown']['unique_interests'], "Should find unique interests"

if __name__ == "__main__":
    asyncio.run(test_matching())
