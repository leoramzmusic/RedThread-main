
from uuid import uuid4
from src.care.models.user_profile import UserProfile
from src.care.models.candidate_profile import CandidateProfile
from src.care.scoring.compatibility import compatibility_score, calculate_love_language_compatibility, calculate_communication_style_compatibility

def test_perfect_match():
    user = UserProfile(
        id=str(uuid4()),
        age=28,
        preferred_age_range=(25, 35),
        location=(19.4326, -99.1332),
        max_distance_km=30,
        interests=["música", "senderismo", "fotografía", "viajes", "cine", "lectura", "cocina", "arte", "tecnología", "deportes"],
        values=["autenticidad", "empatía", "creatividad", "lealtad", "honestidad", "respeto", "libertad", "paz", "justicia", "familia"],
        lifestyle="balanced",
        narrative_style="poetic",
        love_language="quality_time",
        communication_style="texting",
        relationship_goals=["serious_relationship"]
    )
    
    candidate = CandidateProfile(
        id=str(uuid4()),
        age=30,
        location=(19.4200, -99.1500),
        interests=["música", "senderismo", "fotografía", "viajes", "cine", "lectura", "cocina", "arte", "tecnología", "deportes"],
        values=["autenticidad", "empatía", "creatividad", "lealtad", "honestidad", "respeto", "libertad", "paz", "justicia", "familia"],
        lifestyle="balanced",
        narrative_style="poetic",
        love_language="quality_time",
        communication_style="texting",
        relationship_goals=["serious_relationship"]
    )
    
    score = compatibility_score(user, candidate)
    print(f"Perfect Match Score: {score}")
    assert abs(score - 1.0) < 0.01

def test_partial_match():
    user = UserProfile(
        id=str(uuid4()),
        age=28,
        preferred_age_range=(25, 35),
        location=(19.4326, -99.1332),
        max_distance_km=30,
        interests=["música", "senderismo"],
        values=["autenticidad", "empatía"]
    )
    
    candidate = CandidateProfile(
        id=str(uuid4()),
        age=30,
        location=(19.4200, -99.1500),
        interests=["música"],
        values=["autenticidad"],
        lifestyle="active"
    )
    
    score = compatibility_score(user, candidate)
    print(f"Partial Match Score: {score}")
    # Calculation: 0.1(age) + 0.01(int) + 0.01(val) + 0.05(height) + 0.05(intent) + 0.05(LL) + 0.05(CS) + 0.2(prox) = 0.52
    assert 0.45 < score < 0.60

def test_new_components():
    print(f"LL Compatibility (Words/Touch): {calculate_love_language_compatibility('words_of_affirmation', 'physical_touch')}")
    print(f"CS Compatibility (Texting/Bad): {calculate_communication_style_compatibility('texting', 'bad_texter')}")

if __name__ == "__main__":
    try:
        test_perfect_match()
        test_partial_match()
        test_new_components()
        print("All diagnostic tests passed!")
    except Exception as e:
        print(f"Diagnostic failed: {e}")
        import traceback
        traceback.print_exc()
