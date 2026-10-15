"""Location must not change the compat score; it only feeds narrative context."""
from unittest.mock import patch
from uuid import uuid4
import pytest
from src.care.models.user_profile import UserProfile
from src.care.models.candidate_profile import CandidateProfile
from src.care.scoring.compatibility import compatibility_breakdown, compatibility_score

CANONICAL = {
    "values": 0.36, "relationship_goals": 0.18, "neurodiversity": 0.15,
    "responsiveness": 0.10, "music": 0.11, "love_language": 0.06,
    "communication_style": 0.04,
}
NO_FORMULA = {"version": 1, "blocks": CANONICAL, "chaos_factor": 0.0,
              "chaos_seed": None, "min_compatibility": 0.0, "match_critical": 0.15}


@pytest.mark.asyncio
async def test_location_does_not_affect_score():
    user = UserProfile(
        id=str(uuid4()),
        age=28,
        gender="female",
        location=(19.4326, -99.1332),
    )
    cand_local = CandidateProfile(
        id="c1", age=30, gender="male", location=(19.4326, -99.1332)
    )
    cand_far = CandidateProfile(
        id="c1", age=30, gender="male", location=(0.0, 0.0)
    )
    fixed = {k: 0.5 for k in CANONICAL}
    with patch("src.care.scoring.compatibility.compute_block_scores",
               return_value=fixed), \
         patch("src.care.scoring.compatibility.get_active_formula_config",
               return_value=NO_FORMULA):
        s_local = await compatibility_score(user, cand_local)
        s_far = await compatibility_score(user, cand_far)
        bd_local = await compatibility_breakdown(user, cand_local)
        bd_far = await compatibility_breakdown(user, cand_far)
    assert s_local == s_far
    assert bd_local["scenario_label"] != bd_far["scenario_label"]
    assert bd_local["proximity_km"] == pytest.approx(0.0, abs=0.01)
    assert bd_far["proximity_km"] > 9000
