"""Unit tests for CARE Engine Phase 2 - Dynamic scoring."""

import pytest
from uuid import uuid4
from src.care.models.user_profile import UserProfile
from src.care.models.candidate_profile import CandidateProfile, PopularitySignals, AuthenticitySignals
from src.care.models.interaction_log import InteractionLog, AggregateFeatures
from src.care.scoring.dynamic import dynamic_score
from src.care.scoring.human_adjustment import human_adjustment


def test_dynamic_score_with_tag_affinity():
    """Test dynamic scoring with tag affinity from interaction history."""
    candidate = CandidateProfile(
        id=uuid4(),
        age=28,
        location=(19.4, -99.1),
        photo_tags=["playa", "música"],
        bio_tags=["viajes"],
        activity_score=0.8,
        responsiveness_score=0.7
    )
    
    # User has liked profiles with "playa" and "música" tags
    interaction_log = InteractionLog(
        user_id=uuid4(),
        candidate_id=candidate.id,
        aggregate_features=AggregateFeatures(
            liked_tags={"playa": 5, "música": 3, "viajes": 2}
        )
    )
    
    score = dynamic_score(str(uuid4()), candidate, interaction_log)
    
    # Should have high score due to tag affinity + good activity/responsiveness
    assert score > 0.5


def test_human_adjustment_vanity_penalty():
    """Test that high popularity + low responsiveness gets penalized."""
    candidate = CandidateProfile(
        id=uuid4(),
        age=28,
        location=(19.4, -99.1),
        popularity_signals=PopularitySignals(likes_received=150),  # High
        responsiveness_score=0.1,  # Low
        authenticity_signals=AuthenticitySignals(ghosting_rate=0.2)
    )
    
    adjustment = human_adjustment(candidate)
    
    # Should be negative due to vanity penalty
    assert adjustment < 0


def test_human_adjustment_diversity_boost():
    """Test that low-exposure profiles get boosted."""
    candidate = CandidateProfile(
        id=uuid4(),
        age=28,
        location=(19.4, -99.1),
        popularity_signals=PopularitySignals(likes_received=5),  # Very low
        responsiveness_score=0.8,
        authenticity_signals=AuthenticitySignals(ghosting_rate=0.1)
    )
    
    adjustment = human_adjustment(candidate)
    
    # Should be positive due to diversity boost
    assert adjustment > 0


def test_human_adjustment_ghosting_penalty():
    """Test that high ghosting rate gets penalized."""
    candidate = CandidateProfile(
        id=uuid4(),
        age=28,
        location=(19.4, -99.1),
        popularity_signals=PopularitySignals(likes_received=50),
        responsiveness_score=0.5,
        authenticity_signals=AuthenticitySignals(ghosting_rate=0.8)  # High
    )
    
    adjustment = human_adjustment(candidate)
    
    # Should be negative due to ghosting penalty
    assert adjustment < 0
