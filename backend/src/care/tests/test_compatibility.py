"""Unit tests for CARE Engine compatibility scoring."""

import pytest
from uuid import uuid4
from src.care.models.user_profile import UserProfile
from src.care.models.candidate_profile import CandidateProfile
from src.care.scoring.compatibility import compatibility_score


@pytest.mark.asyncio
async def test_perfect_match():
    """Test scoring for a perfect compatibility match."""
    user = UserProfile(
        id=uuid4(),
        age=28,
        interests=["música", "senderismo", "fotografía", "viajes", "cine", "lectura", "cocina", "arte", "tecnología", "deportes"],
        values=["autenticidad", "empatía", "creatividad", "lealtad", "honestidad", "respeto", "libertad", "paz", "justicia", "familia"],
        relationship_goals=["serious_relationship"],
        love_language="quality_time",
        communication_style="texting"
    )
    
    candidate = CandidateProfile(
        id=str(uuid4()),
        age=30,
        interests=["música", "senderismo", "fotografía", "viajes", "cine", "lectura", "cocina", "arte", "tecnología", "deportes"],
        values=["autenticidad", "empatía", "creatividad", "lealtad", "honestidad", "respeto", "libertad", "paz", "justicia", "familia"],
        relationship_goals=["serious_relationship"],
        love_language="quality_time",
        communication_style="texting"
    )
    
    # We use default weights: Interests(25%), Goals(20%), LL(15%), CS(15%), Values(25%)
    score = await compatibility_score(user, candidate)
    
    # All match, so should be 1.0
    assert score == pytest.approx(1.0, abs=0.01)

@pytest.mark.asyncio
async def test_partial_match():
    """Test scoring for partial compatibility."""
    user = UserProfile(
        id=uuid4(),
        interests=["música", "senderismo"],
        values=["autenticidad"],
        relationship_goals=["serious_relationship"],
        love_language="quality_time",
        communication_style="texting"
    )
    
    candidate = CandidateProfile(
        id=uuid4(),
        interests=["música", "arte"], # 1/10 interests -> 0.1 score for interests factor
        values=["autenticidad"], # 1/10 values -> 0.1 score for values factor
        relationship_goals=["casual_fun"], # Mismatch -> ~0.2 score for intent factor
        love_language="gifts", # Mismatch -> ~0.3 score for LL factor
        communication_style="bad_texter" # Texting + Bad Texter -> 0.5 score for CS factor
    )
    
    score = await compatibility_score(user, candidate)
    
    # Expected weighted score:
    # Interests: 0.1 * 0.25 = 0.025
    # Values: 0.1 * 0.25 = 0.025
    # Goals: 0.2 * 0.20 = 0.04
    # LL: 0.3 * 0.15 = 0.045
    # CS: 0.5 * 0.15 = 0.075
    # Total: 0.025 + 0.025 + 0.04 + 0.045 + 0.075 = 0.21
    assert 0.15 < score < 0.30
