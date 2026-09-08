
import pytest
import asyncio
from unittest.mock import patch, MagicMock
from uuid import uuid4
from src.care.models.user_profile import UserProfile
from src.care.models.candidate_profile import CandidateProfile
from src.care.scoring.compatibility import compatibility_score, compatibility_breakdown

async def mock_weights():
    return {
        "Intereses Musicales": 0.25,
        "Metas de Relación": 0.20,
        "Lenguaje del Amor": 0.15,
        "Estilo de Comunicación": 0.15,
        "Valores": 0.25
    }

@pytest.mark.asyncio
async def test_location_does_not_affect_score():
    """Test that compatibility score remains identical regardless of distance."""
    
    # Mock database weights
    with patch('src.care.scoring.compatibility.get_compatibility_weights', side_effect=mock_weights):
        # Base profiles with identical emotional factors
        user = UserProfile(
            id=str(uuid4()),
            age=28,
            interests=["música", "senderismo"],
            values=["autenticidad"],
            relationship_goals=["serious_relationship"],
            love_language="quality_time",
            communication_style="texting",
            location=(19.4326, -99.1332), # Mexico City (lat, lon)
            max_distance_km=50
        )
        
        candidate = CandidateProfile(
            id=str(uuid4()),
            age=30,
            interests=["música", "senderismo"],
            values=["autenticidad"],
            relationship_goals=["serious_relationship"],
            love_language="quality_time",
            communication_style="texting",
            location=(19.4326, -99.1332) # Same location
        )
        
        # Get score for 0km distance
        score_local = await compatibility_score(user, candidate)
        breakdown_local = await compatibility_breakdown(user, candidate)
        
        # Move candidate 10,000 km away
        candidate_far = CandidateProfile(
            id=candidate.id,
            age=candidate.age,
            interests=candidate.interests,
            values=candidate.values,
            relationship_goals=candidate.relationship_goals,
            love_language=candidate.love_language,
            communication_style=candidate.communication_style,
            location=(0, 0) # Far away
        )
        
        score_distant = await compatibility_score(user, candidate_far)
        breakdown_distant = await compatibility_breakdown(user, candidate_far)
        
        # 1. Verification: Scores must be identical
        assert score_local == score_distant, f"Score changed! Local: {score_local}, Distant: {score_distant}"
        
        # 2. Verification: Scenarios must be different
        assert breakdown_local["scenario_label"] != breakdown_distant["scenario_label"]
        assert breakdown_local["scenario_label"] == "Cerca de ti"
        assert breakdown_distant["scenario_label"] == "Global"
        
        print("\n" + "="*50)
        print("VERIFICATION SUCCESS: LOCATION DECOUPLED")
        print("="*50)
        print(f"Numerical Score: {score_local * 100:.1f}% (Stable regardless of distance)")
        print(f"Local Context (0km):    [{breakdown_local['scenario_label']}] -> {breakdown_local['context_advice']}")
        print(f"Distant Context (10k km): [{breakdown_distant['scenario_label']}] -> {breakdown_distant['context_advice']}")
        print("="*50 + "\n")

if __name__ == "__main__":
    asyncio.run(test_location_does_not_affect_score())
