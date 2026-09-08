import asyncio
from typing import List, Tuple, Optional, Dict
from pydantic import BaseModel, Field

# Mocking the models and functions since we are in a test script
class UserProfile(BaseModel):
    id: str
    gender: str
    sexual_orientation: Optional[str] = None
    attraction_preferences: List[str] = []
    orientation_preferences: List[str] = []

class CandidateProfile(BaseModel):
    id: str
    gender: str
    sexual_orientation: Optional[str] = None
    attraction_preferences: List[str] = []
    orientation_preferences: List[str] = []

def calculate_sexual_identity_compatibility(user: UserProfile, candidate: CandidateProfile, strict: bool = True) -> float:
    user_attracted = False
    
    # 1.1 GENDER ATTRACTION
    if not user.attraction_preferences:
        orientation = (user.sexual_orientation or "").lower()
        if orientation == "heterosexual":
            user_attracted = (user.gender != candidate.gender)
        elif orientation == "homosexual":
            user_attracted = (user.gender == candidate.gender)
        elif orientation in ["pansexual", "bisexual", "queer"]:
            user_attracted = True
        else:
            user_attracted = True
    else:
        if candidate.gender in user.attraction_preferences:
            user_attracted = True
            
    # 1.2 ORIENTATION ATTRACTION (New)
    if user_attracted and getattr(user, 'orientation_preferences', []):
        if candidate.sexual_orientation not in user.orientation_preferences:
            user_attracted = False
            
    # 2. Does candidate attract user? (Reverse check)
    candidate_attracted = False
    
    # 2.1 GENDER ATTRACTION
    if not hasattr(candidate, 'attraction_preferences') or not candidate.attraction_preferences:
        orientation = (candidate.sexual_orientation or "").lower()
        if orientation == "heterosexual":
            candidate_attracted = (candidate.gender != user.gender)
        elif orientation == "homosexual":
            candidate_attracted = (candidate.gender == user.gender)
        elif orientation in ["pansexual", "bisexual", "queer"]:
            candidate_attracted = True
        else:
            candidate_attracted = True
    else:
        if user.gender in candidate.attraction_preferences:
            candidate_attracted = True
            
    # 2.2 ORIENTATION ATTRACTION (Secondary reverse check)
    if candidate_attracted and getattr(candidate, 'orientation_preferences', []):
        if user.sexual_orientation not in candidate.orientation_preferences:
            candidate_attracted = False
            
    if not strict:
        return 1.0 if user_attracted else 0.0
        
    return 1.0 if (user_attracted and candidate_attracted) else 0.0

async def run_test():
    print("--- TESTING ORIENTATION-BASED ATTRACTION ---")
    
    # User: Male, Heterosexual, Attracted to Female, but ONLY Bisexual Females
    user = UserProfile(
        id="user_1",
        gender="Masculino",
        sexual_orientation="Heterosexual",
        attraction_preferences=["Femenino"],
        orientation_preferences=["Bisexual", "Queer"]
    )
    
    # Candidate 1: Female, Heterosexual (Should NOT match orientation preference)
    cand1 = CandidateProfile(
        id="cand_1",
        gender="Femenino",
        sexual_orientation="Heterosexual",
        attraction_preferences=["Masculino"]
    )
    
    # Candidate 2: Female, Bisexual (Should match)
    cand2 = CandidateProfile(
        id="cand_2",
        gender="Femenino",
        sexual_orientation="Bisexual",
        attraction_preferences=["Masculino", "Femenino"]
    )
    
    # Candidate 3: Female, Bisexual, but only attracted to Females (Should NOT match reverse check)
    cand3 = CandidateProfile(
        id="cand_3",
        gender="Femenino",
        sexual_orientation="Bisexual",
        attraction_preferences=["Femenino"]
    )

    score1 = calculate_sexual_identity_compatibility(user, cand1)
    score2 = calculate_sexual_identity_compatibility(user, cand2)
    score3 = calculate_sexual_identity_compatibility(user, cand3)
    
    print(f"Cand 1 (Hetero Female) Score: {score1} (Expected 0.0)")
    print(f"Cand 2 (Bisexual Female) Score: {score2} (Expected 1.0)")
    print(f"Cand 3 (Bisexual Female, ONLY Women) Score: {score3} (Expected 0.0)")
    
    assert score1 == 0.0
    assert score2 == 1.0
    assert score3 == 0.0
    
    # Test 4: Same as 2, but candidate ALSO has orientation preferences (e.g. only Hetero men)
    cand4 = CandidateProfile(
        id="cand_4",
        gender="Femenino",
        sexual_orientation="Bisexual",
        attraction_preferences=["Masculino"],
        orientation_preferences=["Heterosexual"]
    )
    score4 = calculate_sexual_identity_compatibility(user, cand4)
    print(f"Cand 4 (Bisexual Female, only Hetero men) Score: {score4} (Expected 1.0 because user is Hetero)")
    assert score4 == 1.0

    # Test 5: Same as 4, but user is NOT Hetero
    user_bisexual = user.copy()
    user_bisexual.sexual_orientation = "Bisexual"
    score5 = calculate_sexual_identity_compatibility(user_bisexual, cand4)
    print(f"Cand 4 with Bisexual User Score: {score5} (Expected 0.0 because candidate wants Hetero men)")
    assert score5 == 0.0

    print("\nALL TESTS PASSED!")

if __name__ == "__main__":
    asyncio.run(run_test())
