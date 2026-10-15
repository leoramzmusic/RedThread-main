"""Endpoint tests via direct async calls with mocked service."""
from unittest.mock import AsyncMock, MagicMock, patch
import pytest
from beanie.odm.fields import ExpressionField
from src.api import admin_algorithms as api
from src.models.profile import Profile

# init_beanie inyecta ExpressionField como atributos de clase (Profile.user_id ==
# "x" en las rutas). En tests sin Mongo no se inicializa, lo replicamos aquí.
Profile.user_id = ExpressionField("user_id")


class _Admin:
    id = "emp1"


@pytest.mark.asyncio
async def test_validate_endpoint_shape():
    from src.care.formula.service import CANONICAL_BLOCKS
    body = {"formula": {"blocks": dict(CANONICAL_BLOCKS), "chaos_factor": 0.0}}
    result = await api.validate_formula(body, admin=_Admin())
    assert result["valid"] is True
    assert result["errors"] == []


@pytest.mark.asyncio
async def test_validate_endpoint_reports_errors():
    from src.care.formula.service import CANONICAL_BLOCKS
    bad = dict(CANONICAL_BLOCKS, values=0.9)
    result = await api.validate_formula({"formula": {"blocks": bad}}, admin=_Admin())
    assert result["valid"] is False
    assert result["errors"]


@pytest.mark.asyncio
async def test_save_maps_no_change_to_conflict():
    from fastapi import HTTPException
    from src.care.formula.service import FormulaNoChangeError
    with patch("src.care.formula.service.save_new_version",
               AsyncMock(side_effect=FormulaNoChangeError("x"))):
        with pytest.raises(HTTPException) as exc:
            await api.save_formula({"formula": {}, "source": "criteria"}, admin=_Admin())
    assert exc.value.status_code == 409


@pytest.mark.asyncio
async def test_save_maps_validation_to_422():
    from fastapi import HTTPException
    from src.care.formula.service import FormulaValidationError
    with patch("src.care.formula.service.save_new_version",
               AsyncMock(side_effect=FormulaValidationError(["mal"]))):
        with pytest.raises(HTTPException) as exc:
            await api.save_formula({"formula": {}, "source": "equation"}, admin=_Admin())
    assert exc.value.status_code == 422


@pytest.mark.asyncio
async def test_rollback_maps_missing_to_404():
    from fastapi import HTTPException
    with patch("src.care.formula.service.rollback_to_version",
               AsyncMock(side_effect=LookupError("no"))):
        with pytest.raises(HTTPException) as exc:
            await api.rollback_formula(99, admin=_Admin())
    assert exc.value.status_code == 404


@pytest.mark.asyncio
async def test_active_endpoint_seeds():
    from src.care.formula.service import CANONICAL_BLOCKS
    fake = AsyncMock()
    fake.model_dump = lambda mode="json": {"version": 1, "blocks": dict(CANONICAL_BLOCKS)}
    with patch("src.care.formula.service.ensure_active_formula", AsyncMock(return_value=fake)):
        result = await api.get_formula_active(admin=_Admin())
    assert result["version"] == 1


@pytest.mark.asyncio
async def test_save_maps_missing_changelog_to_422():
    from fastapi import HTTPException
    from src.care.formula.service import CANONICAL_BLOCKS
    active = AsyncMock()
    active.blocks = dict(CANONICAL_BLOCKS, values=0.30, relationship_goals=0.24)
    active.chaos_factor = 0.0
    active.chaos_seed = None
    active.min_compatibility = 0.0
    active.match_critical = 0.15
    qs_to_list = AsyncMock(return_value=[])
    qs_limit = MagicMock(return_value=MagicMock(to_list=qs_to_list))
    qs_sort = MagicMock(return_value=MagicMock(limit=qs_limit))
    find_all_mock = MagicMock(return_value=MagicMock(sort=qs_sort))
    payload = {"formula": {"blocks": dict(CANONICAL_BLOCKS)}, "source": "criteria"}
    with patch("src.care.formula.service.ensure_active_formula", AsyncMock(return_value=active)), \
         patch.object(api.formula_service.CAREFormula, "find_all", find_all_mock):
        with pytest.raises(HTTPException) as exc:
            await api.save_formula(payload, admin=_Admin())
    assert exc.value.status_code == 422
    assert "changelog" in exc.value.detail


@pytest.mark.asyncio
async def test_preview_missing_user_ids_returns_422():
    from fastapi import HTTPException
    from src.care.formula.service import CANONICAL_BLOCKS
    body = {"formula": {"blocks": dict(CANONICAL_BLOCKS), "chaos_factor": 0.0}}
    with pytest.raises(HTTPException) as exc:
        await api.preview_formula(body, admin=_Admin())
    assert exc.value.status_code == 422


def _cfg(min_compat: float = 0.0) -> dict:
    from src.care.formula.service import CANONICAL_BLOCKS
    return {
        "version": 1,
        "blocks": dict(CANONICAL_BLOCKS),
        "chaos_factor": 0.0,
        "chaos_seed": None,
        "min_compatibility": min_compat,
        "match_critical": 0.15,
    }


def _canonical_body(**extra) -> dict:
    from src.care.formula.service import CANONICAL_BLOCKS
    body = {"formula": {"blocks": dict(CANONICAL_BLOCKS), "chaos_factor": 0.0}}
    body.update(extra)
    return body


def _stub_user(user_id: str):
    from types import SimpleNamespace
    return SimpleNamespace(id=user_id, subscription_tier="free")


def _stub_profile(user_id: str, gender: str = "male", values=None, goals=None):
    from types import SimpleNamespace
    return SimpleNamespace(
        user_id=user_id,
        age=30,
        gender=gender,
        location=None,
        distance_preference_km=50,
        lifestyle_interests=[],
        interests=[],
        core_values=values or [],
        lifestyle_mode=None,
        mi_himno=None,
        bio=None,
        prompts=[],
        relationship_goals=goals or [],
    )


@pytest.mark.asyncio
async def test_simulate_without_anchor_returns_mock_pairs():
    """Sin anchor_user_id => modo mock: 8 pares sintéticos, sin guardar."""
    with patch.object(api, "get_active_formula_config",
                      AsyncMock(return_value=_cfg())):
        result = await api.simulate_formula(_canonical_body(), admin=_Admin())
    assert result["mock"] is True
    assert len(result["ranking"]) == 8
    for row in result["ranking"]:
        assert 0.0 <= row["score_current"] <= 1.0
        assert 0.0 <= row["score_proposed"] <= 1.0
        assert "delta" in row


@pytest.mark.asyncio
async def test_simulate_with_real_anchor_pairs():
    """Con anchor_user_id + candidatos reales mockeados => mock false."""
    anchor = _stub_user("anchor1")
    cand_1 = _stub_user("cand1")
    cand_2 = _stub_user("cand2")
    anchor_p = _stub_profile("anchor1", gender="female",
                             values=["feminismo"], goals=["serious_relationship"])
    cand_1_p = _stub_profile("cand1", values=["feminismo"],
                             goals=["serious_relationship"])
    cand_2_p = _stub_profile("cand2", values=["paz"], goals=["casual_fun"])
    body = _canonical_body(anchor_user_id="anchor1",
                           candidate_user_ids=["cand1", "cand2"])
    with patch.object(api, "get_active_formula_config",
                      AsyncMock(return_value=_cfg())), \
         patch("src.models.user.User.get",
               AsyncMock(side_effect=[anchor, cand_1, cand_2])), \
         patch("src.models.profile.Profile.find_one",
               AsyncMock(side_effect=[anchor_p, cand_1_p, cand_2_p])):
        result = await api.simulate_formula(body, admin=_Admin())
    assert result["mock"] is False
    assert len(result["ranking"]) == 2
    ids = {row["candidate_id"] for row in result["ranking"]}
    assert ids == {"cand1", "cand2"}
    for row in result["ranking"]:
        assert 0.0 <= row["score_current"] <= 1.0
        assert 0.0 <= row["score_proposed"] <= 1.0
        assert row["delta"] == pytest.approx(
            row["score_proposed"] - row["score_current"], abs=1e-9
        )


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "tone", ["directo", "poetico", "ludico", "emocional", "curioso"]
)
async def test_preview_all_tones_generate_narrative(tone):
    """Wiring preview -> narrative funciona para los 5 tonos válidos."""
    user_a = _stub_user("user_a")
    user_b = _stub_user("user_b")
    profile_a = _stub_profile("user_a", gender="female",
                              values=["feminismo"], goals=["serious_relationship"])
    profile_b = _stub_profile("user_b", gender="male",
                              values=["feminismo"], goals=["serious_relationship"])
    body = _canonical_body(user_a_id="user_a", user_b_id="user_b", tone=tone)
    with patch.object(api, "get_active_formula_config",
                      AsyncMock(return_value=_cfg())), \
         patch("src.models.user.User.get",
               AsyncMock(side_effect=[user_a, user_b])), \
         patch("src.models.profile.Profile.find_one",
               AsyncMock(side_effect=[profile_a, profile_b])):
        result = await api.preview_formula(body, admin=_Admin())
    narrative = result["narrative"]
    assert narrative["tone"] == tone
    assert isinstance(narrative["text"], str) and narrative["text"].strip()
    assert 0.0 <= result["proposed"]["score"] <= 1.0
