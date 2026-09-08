"""Unit tests for CARE Engine ranking and diversity."""

import pytest
from uuid import uuid4
from src.care.models.user_profile import UserProfile
from src.care.models.candidate_profile import CandidateProfile, PopularitySignals
from src.care.ranking.ranker import rank_candidates
from src.care.ranking.diversity import get_popularity_bucket, group_by_bucket


def test_popularity_bucketing():
    """Test that candidates are correctly categorized by popularity."""
    low_pop = CandidateProfile(
        id=str(uuid4()),
        age=25,
        location=(19.4, -99.1),
        popularity_signals=PopularitySignals(likes_received=5)
    )
    
    mid_pop = CandidateProfile(
        id=str(uuid4()),
        age=26,
        location=(19.4, -99.1),
        popularity_signals=PopularitySignals(likes_received=50)
    )
    
    high_pop = CandidateProfile(
        id=str(uuid4()),
        age=27,
        location=(19.4, -99.1),
        popularity_signals=PopularitySignals(likes_received=150)
    )
    
    assert get_popularity_bucket(low_pop) == 'low_pop'
    assert get_popularity_bucket(mid_pop) == 'mid_pop'
    assert get_popularity_bucket(high_pop) == 'high_pop'


@pytest.mark.asyncio
async def test_diversity_quotas():
    """Test that ranking respects diversity quotas."""
    user = UserProfile(
        id=str(uuid4()),
        age=28,
        preferred_age_range=(25, 35),
        location=(19.4326, -99.1332),
        max_distance_km=50,
        interests=["música"],
        values=["autenticidad"]
    )
    
    # Create candidates with varying popularity
    candidates = []
    
    # 5 low-pop candidates
    for i in range(5):
        candidates.append(CandidateProfile(
            id=str(uuid4()),
            age=28,
            location=(19.4, -99.1),
            interests=["música"],
            popularity_signals=PopularitySignals(likes_received=5 + i)
        ))
    
    # 5 mid-pop candidates
    for i in range(5):
        candidates.append(CandidateProfile(
            id=str(uuid4()),
            age=28,
            location=(19.4, -99.1),
            interests=["música"],
            popularity_signals=PopularitySignals(likes_received=50 + i)
        ))
    
    # 5 high-pop candidates
    for i in range(5):
        candidates.append(CandidateProfile(
            id=str(uuid4()),
            age=28,
            location=(19.4, -99.1),
            interests=["música"],
            popularity_signals=PopularitySignals(likes_received=150 + i)
        ))
    
    # Rank with limit of 10
    ranked = await rank_candidates(user, candidates, limit=10)
    
    # Count buckets in results
    bucket_counts = {'low_pop': 0, 'mid_pop': 0, 'high_pop': 0}
    for item in ranked:
        bucket_counts[item['bucket']] += 1
    
    # Should have diversity (not all from one bucket)
    assert bucket_counts['low_pop'] > 0
    assert bucket_counts['mid_pop'] > 0
    # High pop might be 0 or low due to 20% quota
    
    # Total should be 10
    assert len(ranked) == 10


@pytest.mark.asyncio
async def test_ranking_returns_top_scores():
    """Test that ranking prioritizes higher compatibility scores."""
    user = UserProfile(
        id=str(uuid4()),
        age=28,
        preferred_age_range=(25, 35),
        location=(19.4326, -99.1332),
        max_distance_km=50,
        interests=["música", "arte", "viajes"],
        values=["autenticidad", "empatía"]
    )
    
    # High compatibility candidate
    high_compat = CandidateProfile(
        id=str(uuid4()),
        age=30,
        location=(19.4, -99.1),
        interests=["música", "arte", "viajes"],  # 3 shared
        values=["autenticidad", "empatía"],  # 2 shared
        popularity_signals=PopularitySignals(likes_received=50)
    )
    
    # Low compatibility candidate
    low_compat = CandidateProfile(
        id=str(uuid4()),
        age=30,
        location=(19.4, -99.1),
        interests=["deportes"],  # 0 shared
        values=["aventura"],  # 0 shared
        popularity_signals=PopularitySignals(likes_received=50)
    )
    
    ranked = await rank_candidates(user, [high_compat, low_compat], limit=2)
    
    # High compatibility should be ranked first
    assert ranked[0]['score'] > ranked[1]['score']
    assert ranked[0]['candidate'].id == high_compat.id
