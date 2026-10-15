"""Endpoint tests via direct async calls with mocked service."""
from unittest.mock import AsyncMock, patch
import pytest
from src.api import admin_algorithms as api


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
