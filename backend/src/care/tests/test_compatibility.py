"""Unit tests for the 7-dimension canonical CARE scoring."""
from unittest.mock import patch
import pytest
from src.care.models.user_profile import UserProfile
from src.care.models.candidate_profile import CandidateProfile
from src.care.scoring.compatibility import (
    compatibility_breakdown,
    compatibility_score,
    compute_block_scores,
)

CANONICAL = {
    "values": 0.36, "relationship_goals": 0.18, "neurodiversity": 0.15,
    "responsiveness": 0.10, "music": 0.11, "love_language": 0.06,
    "communication_style": 0.04,
}

NO_FORMULA = {
    "version": 1, "blocks": CANONICAL, "chaos_factor": 0.0, "chaos_seed": None,
    "min_compatibility": 0.0, "match_critical": 0.15,
}


def _profiles():
    user = UserProfile(
        id="test-user-chaos",
        age=28,
        gender="female",
        location=(19.4326, -99.1332),
        values=["autenticidad"],
        relationship_goals=["serious_relationship"],
    )
    candidate = CandidateProfile(
        id="test-candidate-chaos",
        age=30,
        gender="male",
        location=(19.4326, -99.1332),
        values=["autenticidad"],
        relationship_goals=["serious_relationship"],
    )
    return user, candidate


@pytest.mark.asyncio
async def test_score_is_weighted_sum_of_blocks():
    user, candidate = _profiles()
    fixed = {"values": 1.0, "relationship_goals": 0.5, "neurodiversity": 0.0,
             "responsiveness": 0.0, "music": 0.0, "love_language": 0.0,
             "communication_style": 0.0}
    with patch("src.care.scoring.compatibility.compute_block_scores",
               return_value=fixed), \
         patch("src.care.scoring.compatibility.get_active_formula_config",
               return_value=NO_FORMULA):
        score = await compatibility_score(user, candidate)
    expected = 1.0 * 0.36 + 0.5 * 0.18
    assert score == pytest.approx(expected, abs=1e-9)


@pytest.mark.asyncio
async def test_perfect_blocks_give_one():
    user, candidate = _profiles()
    fixed = {k: 1.0 for k in CANONICAL}
    with patch("src.care.scoring.compatibility.compute_block_scores",
               return_value=fixed), \
         patch("src.care.scoring.compatibility.get_active_formula_config",
               return_value=NO_FORMULA):
        assert await compatibility_score(user, candidate) == pytest.approx(1.0)


@pytest.mark.asyncio
async def test_chaos_seed_deterministic_and_bounded():
    user, candidate = _profiles()
    fixed = {k: 0.5 for k in CANONICAL}
    cfg = dict(NO_FORMULA, chaos_factor=10.0, chaos_seed="s1")
    with patch("src.care.scoring.compatibility.compute_block_scores",
               return_value=fixed), \
         patch("src.care.scoring.compatibility.get_active_formula_config",
               return_value=cfg):
        a = await compatibility_score(user, candidate)
        b = await compatibility_score(user, candidate)
    assert a == b
    base = sum(0.5 * CANONICAL[k] for k in CANONICAL)
    assert abs(a - base) <= 0.10 + 1e-9


@pytest.mark.asyncio
async def test_chaos_clamps_and_flags_saturation_in_breakdown():
    user, candidate = _profiles()
    fixed = {k: 1.0 for k in CANONICAL}
    cfg = dict(NO_FORMULA, chaos_factor=20.0, chaos_seed="s1")
    with patch("src.care.scoring.compatibility.compute_block_scores",
               return_value=fixed), \
         patch("src.care.scoring.compatibility.get_active_formula_config",
               return_value=cfg):
        score = await compatibility_score(user, candidate)
        bd = await compatibility_breakdown(user, candidate)
    assert score == 1.0
    assert bd["saturated"] is True
    assert bd["chaos_applied"] == pytest.approx(0.172, abs=0.001)
    assert bd["compatibility_label"] in {"Muy bajo", "Bajo", "Medio", "Alto"}
    assert isinstance(bd["chaos_applied"], float)


@pytest.mark.asyncio
async def test_breakdown_shape_new_keys_only():
    user, candidate = _profiles()
    with patch("src.care.scoring.compatibility.compute_block_scores",
               return_value={k: 0.5 for k in CANONICAL}), \
         patch("src.care.scoring.compatibility.get_active_formula_config",
               return_value=NO_FORMULA):
        bd = await compatibility_breakdown(user, candidate)
    for key in CANONICAL:
        assert key in bd
    for gone in ("interests", "intent", "lifestyle", "height_compatibility",
                 "professional_compatibility", "identity_compatibility"):
        assert gone not in bd
    for kept in ("proximity_km", "scenario_label", "connection_tone", "context_advice"):
        assert kept in bd


@pytest.mark.asyncio
async def test_real_block_functions_smoke():
    """compute_block_scores returns the 7 canonical keys in 0-1 without DB."""
    user, candidate = _profiles()
    blocks = await compute_block_scores(user, candidate)
    assert set(blocks) == set(CANONICAL)
    for v in blocks.values():
        assert 0.0 <= v <= 1.0
