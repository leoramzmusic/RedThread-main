
import asyncio
import sys
import os

# Add project root to path
sys.path.append(os.getcwd())

from src.services.affinity import AffinityService
from src.care.scoring.compatibility import calculate_height_compatibility
from src.care.models.user_profile import UserProfile
from src.care.models.candidate_profile import CandidateProfile
class MockProfile:
    def __init__(self, **kwargs):
        for k, v in kwargs.items():
            setattr(self, k, v)
        if not hasattr(self, 'interests'): self.interests = []
        if not hasattr(self, 'intentions'): self.intentions = []
        if not hasattr(self, 'languages'): self.languages = []
        if not hasattr(self, 'activity_pattern'): self.activity_pattern = None

async def verify_height_logic():
    print("--- Verificando Lógica de Estatura ---")
    
    # 1. Test AffinityService
    print("\n1. AffinityService Test:")
    user_p = MockProfile(user_id="user1", height_preferences=["none"], height_relevant=True)
    candidate_p = MockProfile(user_id="cand1", height_label="short")
    
    score = AffinityService.calculate_score(user_p, candidate_p)
    # The height portion is 10 points. Since other fields are empty, the score should be around 15 (5 base for MBTI + 10 for height)
    print(f"User Prefs: ['none'], Candidate Label: 'short' -> Affinity Score: {score}")

    # Note: Affinity score is cumulative, but since we only care about the height part (10 points)
    # let's check if it reaches the expected total if other fields are zeroed/minimal.
    
    # 2. Test CARE calculate_height_compatibility
    print("\n2. CARE calculate_height_compatibility Test:")
    user_care = UserProfile(
        id="user1", 
        age=25, 
        location=(0,0), 
        height_relevant=True, 
        height_preferences=["none"]
    )
    
    candidate_care_short = CandidateProfile(id="cand1", age=25, location=(0,0), height_label="short")
    candidate_care_tall = CandidateProfile(id="cand2", age=25, location=(0,0), height_label="tall")
    
    score_short = calculate_height_compatibility(user_care, candidate_care_short)
    score_tall = calculate_height_compatibility(user_care, candidate_care_tall)
    
    print(f"User Prefs: ['none'], Candidate 'short' -> CARE Score: {score_short}")
    print(f"User Prefs: ['none'], Candidate 'tall' -> CARE Score: {score_tall}")
    
    # 3. Test Specific Range Match
    user_care_range = UserProfile(
        id="user1", 
        age=25, 
        location=(0,0), 
        height_relevant=True, 
        height_preferences=["tall", "giant"]
    )
    score_match = calculate_height_compatibility(user_care_range, candidate_care_tall)
    score_mismatch = calculate_height_compatibility(user_care_range, candidate_care_short)
    
    print(f"User Prefs: ['tall', 'giant'], Candidate 'tall' -> CARE Score: {score_match}")
    print(f"User Prefs: ['tall', 'giant'], Candidate 'short' -> CARE Score: {score_mismatch}")

    # 4. Test Not Relevant
    user_care_np = UserProfile(
        id="user1", 
        age=25, 
        location=(0,0), 
        height_relevant=False, 
        height_preferences=["short"]
    )
    score_np = calculate_height_compatibility(user_care_np, candidate_care_tall)
    print(f"Height NOT Relevant -> CARE Score: {score_np}")

if __name__ == "__main__":
    asyncio.run(verify_height_logic())
