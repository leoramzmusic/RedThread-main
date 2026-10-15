"""Unit tests for CARE Engine ranking and diversity."""

import pytest
from uuid import uuid4
from src.care.models.user_profile import UserProfile
from src.care.models.candidate_profile import CandidateProfile, PopularitySignals
from src.care.ranking.ranker import rank_candidates
from src.care.ranking.diversity import get_popularity_bucket


def test_popularity_bucketing():
    """Test that candidates are correctly categorized by popularity."""
    low_pop = CandidateProfile(
        id=str(uuid4()),
        age=25,
        gender="male",
        location=(19.4, -99.1),
        popularity_signals=PopularitySignals(likes_received=5),
    )

    mid_pop = CandidateProfile(
        id=str(uuid4()),
        age=26,
        gender="male",
        location=(19.4, -99.1),
        popularity_signals=PopularitySignals(likes_received=50),
    )

    high_pop = CandidateProfile(
        id=str(uuid4()),
        age=27,
        gender="male",
        location=(19.4, -99.1),
        popularity_signals=PopularitySignals(likes_received=150),
    )

    assert get_popularity_bucket(low_pop) == "low_pop"
    assert get_popularity_bucket(mid_pop) == "mid_pop"
    assert get_popularity_bucket(high_pop) == "high_pop"


@pytest.mark.asyncio
async def test_diversity_quotas():
    """Test that ranking respects diversity quotas."""
    user = UserProfile(
        id=str(uuid4()),
        age=28,
        gender="female",
        preferred_age_range=(25, 35),
        location=(19.4326, -99.1332),
        max_distance_km=50,
        interests=["música"],
        values=["autenticidad"],
    )

    # Create candidates with varying popularity
    candidates = []

    # 5 low-pop candidates
    for i in range(5):
        candidates.append(
            CandidateProfile(
                id=str(uuid4()),
                age=28,
                gender="male",
                location=(19.4, -99.1),
                interests=["música"],
                popularity_signals=PopularitySignals(likes_received=5 + i),
            )
        )

    # 5 mid-pop candidates
    for i in range(5):
        candidates.append(
            CandidateProfile(
                id=str(uuid4()),
                age=28,
                gender="male",
                location=(19.4, -99.1),
                interests=["música"],
                popularity_signals=PopularitySignals(likes_received=50 + i),
            )
        )

    # 5 high-pop candidates
    for i in range(5):
        candidates.append(
            CandidateProfile(
                id=str(uuid4()),
                age=28,
                gender="male",
                location=(19.4, -99.1),
                interests=["música"],
                popularity_signals=PopularitySignals(likes_received=150 + i),
            )
        )

    # Rank with limit of 10
    ranked = await rank_candidates(user, candidates, limit=10)

    # Count buckets in results
    bucket_counts = {"low_pop": 0, "mid_pop": 0, "high_pop": 0}
    for item in ranked:
        bucket_counts[item["bucket"]] += 1

    # Should have diversity (not all from one bucket)
    assert bucket_counts["low_pop"] > 0
    assert bucket_counts["mid_pop"] > 0
    # High pop might be 0 or low due to 20% quota

    # Total should be 10
    assert len(ranked) == 10


@pytest.mark.asyncio
async def test_ranking_returns_top_scores():
    """Test that ranking prioritizes higher compatibility scores.

    Fórmula canónica 7D: 'values' solo cuenta items de
    LIFESTYLE_CATEGORIES['values_causes']; 'interests' no es dimensión de scoring.
    """
    user = UserProfile(
        id=str(uuid4()),
        age=28,
        gender="female",
        preferred_age_range=(25, 35),
        location=(19.4326, -99.1332),
        max_distance_km=50,
        values=["feminismo", "ecologismo", "justicia_social"],
    )

    # Alta compatibilidad: 2 valores canónicos compartidos
    high_compat = CandidateProfile(
        id=str(uuid4()),
        age=30,
        gender="male",
        location=(19.4, -99.1),
        values=["feminismo", "ecologismo"],
        popularity_signals=PopularitySignals(likes_received=50),
    )

    # Baja compatibilidad: valores canónicos sin solape con el usuario
    low_compat = CandidateProfile(
        id=str(uuid4()),
        age=30,
        gender="male",
        location=(19.4, -99.1),
        values=["paz", "educacion"],
        popularity_signals=PopularitySignals(likes_received=50),
    )

    ranked = await rank_candidates(user, [high_compat, low_compat], limit=2)

    # Cálculo a mano (config por defecto: weights de bloques CANONICAL_BLOCKS,
    # chaos 0.0 => χ=0; SystemParams compat=0.6, dynamic=0.3, human=0.1;
    # bloques sin datos => neuro=1.0, resto=0.5; dyn=0.5, human_adj=0.05):
    #   high: f_values = (2 ítems compartidos * 3 + 1 bonus) / 15 = 7/15
    #         base = 0.36*(7/15) + 0.18*0.5 + 0.15*1.0 + 0.10*0.5
    #                + 0.11*0.5 + 0.06*0.5 + 0.04*0.5 = 0.563
    #         total = 0.6*0.563 + 0.3*0.5 + 0.1*0.05 = 0.4928
    #   low:  f_values = 0/15 (categoría presente pero 0 compartidos)
    #         base = 0.395; total = 0.6*0.395 + 0.15 + 0.005 = 0.392
    assert ranked[0]["score"] == pytest.approx(0.4928, abs=1e-3)
    assert ranked[1]["score"] == pytest.approx(0.392, abs=1e-3)

    # Estructural: ranking ordena de mayor a menor y prioriza al compatible
    assert ranked[0]["score"] > ranked[1]["score"]
    assert ranked[0]["candidate"].id == high_compat.id
