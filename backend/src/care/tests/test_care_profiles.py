"""Profiles service + endpoint tests (no Mongo)."""
from unittest.mock import AsyncMock, MagicMock, patch

import motor.motor_asyncio
from beanie.odm.fields import ExpressionField
from beanie.odm.settings.document import DocumentSettings
import pytest

from src.api import admin_algorithms as api
from src.care.formula.service import CANONICAL_BLOCKS, FormulaValidationError
from src.care.models.care_profile import CAREProfile
from src.care.profiles import service
from src.care.profiles.service import (
    ProfileDuplicateError,
    ProfileNameError,
    create_profile,
    delete_profile,
    list_profiles,
    update_profile,
)

VALID_ID = "64b7f9c2f1a2b3c4d5e6f7a8"
OTHER_ID = "64b7f9c2f1a2b3c4d5e6f7a9"

_mongo_client = motor.motor_asyncio.AsyncIOMotorClient("mongodb://localhost:27017")
_db = _mongo_client["care_profile_test_db"]
if CAREProfile._document_settings is None:
    CAREProfile._document_settings = DocumentSettings(
        name="care_profiles", motor_db=_db, motor_collection=_db["care_profiles"]
    )
# Sin init_beanie el campo de clase `name` no es ExpressionField: lo replicamos
# (mismo workaround que test_formula_endpoints.py con Profile.user_id).
CAREProfile.name = ExpressionField("name")


class _Admin:
    id = "emp1"


def _profile(**over):
    """Mock document with the attributes the service touches."""
    doc = AsyncMock()
    doc.id = VALID_ID
    doc.name = "Mi perfil"
    doc.blocks = dict(CANONICAL_BLOCKS)
    doc.chaos_factor = 0.0
    doc.created_by = "emp1"
    doc.model_dump = MagicMock(return_value={"id": VALID_ID, "name": "Mi perfil"})
    for key, value in over.items():
        setattr(doc, key, value)
    return doc


# --- service ---


@pytest.mark.asyncio
async def test_create_rejects_bad_name():
    with pytest.raises(ProfileNameError):
        await create_profile("   ", dict(CANONICAL_BLOCKS), 0.0, "emp1")
    with pytest.raises(ProfileNameError):
        await create_profile("x" * 61, dict(CANONICAL_BLOCKS), 0.0, "emp1")
    with pytest.raises(ProfileNameError):
        await create_profile(None, dict(CANONICAL_BLOCKS), 0.0, "emp1")


@pytest.mark.asyncio
async def test_create_validates_blocks_sum():
    bad = dict(CANONICAL_BLOCKS, values=0.9)
    with pytest.raises(FormulaValidationError) as exc:
        await create_profile("Ok", bad, 0.0, "emp1")
    assert any("suma" in error for error in exc.value.errors)


@pytest.mark.asyncio
async def test_create_rejects_duplicate_name():
    with patch.object(service.CAREProfile, "find_one", AsyncMock(return_value=_profile())), \
         patch.object(service.CAREProfile, "insert", AsyncMock()) as insert_mock:
        with pytest.raises(ProfileDuplicateError):
            await create_profile("Mi perfil", dict(CANONICAL_BLOCKS), 0.0, "emp1")
    insert_mock.assert_not_called()


@pytest.mark.asyncio
async def test_create_strips_name_and_stores_fields():
    with patch.object(service.CAREProfile, "find_one", AsyncMock(return_value=None)), \
         patch.object(service.CAREProfile, "insert", AsyncMock()):
        result = await create_profile("  Mi perfil  ", dict(CANONICAL_BLOCKS), 0.0, "emp1")
    assert result.name == "Mi perfil"
    assert result.blocks == dict(CANONICAL_BLOCKS)
    assert result.chaos_factor == 0.0
    assert result.created_by == "emp1"


@pytest.mark.asyncio
async def test_list_profiles_sorts_by_name():
    qs = MagicMock()
    qs.sort = MagicMock(return_value=MagicMock(
        to_list=AsyncMock(return_value=["a", "b"])))
    with patch.object(service.CAREProfile, "find_all", MagicMock(return_value=qs)):
        assert await list_profiles() == ["a", "b"]


@pytest.mark.asyncio
async def test_update_missing_profile_raises_lookup():
    with patch.object(service.CAREProfile, "get", AsyncMock(return_value=None)):
        with pytest.raises(LookupError):
            await update_profile(VALID_ID, blocks=dict(CANONICAL_BLOCKS))
    with pytest.raises(LookupError):
        await update_profile("no-es-un-id", blocks=dict(CANONICAL_BLOCKS))


@pytest.mark.asyncio
async def test_update_changes_fields_and_saves():
    doc = _profile()
    doc.save = AsyncMock()
    new_blocks = dict(CANONICAL_BLOCKS, values=0.30, music=0.17)
    with patch.object(service.CAREProfile, "get", AsyncMock(return_value=doc)), \
         patch.object(service.CAREProfile, "find_one", AsyncMock(return_value=None)):
        result = await update_profile(
            VALID_ID, name="  Renombrado ", blocks=new_blocks, chaos_factor=3.0
        )
    assert result.name == "Renombrado"
    assert result.blocks["values"] == 0.30
    assert result.chaos_factor == 3.0
    doc.save.assert_awaited()


@pytest.mark.asyncio
async def test_update_duplicate_name_conflict():
    other = _profile()
    other.id = OTHER_ID
    with patch.object(service.CAREProfile, "get", AsyncMock(return_value=_profile())), \
         patch.object(service.CAREProfile, "find_one", AsyncMock(return_value=other)):
        with pytest.raises(ProfileDuplicateError):
            await update_profile(VALID_ID, name="Otro")


@pytest.mark.asyncio
async def test_update_validates_when_only_chaos_changes():
    doc = _profile()
    with patch.object(service.CAREProfile, "get", AsyncMock(return_value=doc)):
        with pytest.raises(FormulaValidationError):
            await update_profile(VALID_ID, chaos_factor=99.0)


@pytest.mark.asyncio
async def test_delete_missing_raises_lookup():
    with patch.object(service.CAREProfile, "get", AsyncMock(return_value=None)):
        with pytest.raises(LookupError):
            await delete_profile(VALID_ID)
    with pytest.raises(LookupError):
        await delete_profile("no-es-un-id")


@pytest.mark.asyncio
async def test_delete_calls_document_delete():
    doc = _profile()
    doc.delete = AsyncMock()
    with patch.object(service.CAREProfile, "get", AsyncMock(return_value=doc)):
        await delete_profile(VALID_ID)
    doc.delete.assert_awaited()


# --- endpoints ---


@pytest.mark.asyncio
async def test_list_endpoint_returns_dumps():
    with patch.object(api.profile_service, "list_profiles",
                      AsyncMock(return_value=[_profile()])):
        result = await api.list_formula_profiles(admin=_Admin())
    assert result == [{"id": VALID_ID, "name": "Mi perfil"}]


@pytest.mark.asyncio
async def test_create_endpoint_maps_duplicate_to_409():
    from fastapi import HTTPException
    with patch.object(api.profile_service, "create_profile",
                      AsyncMock(side_effect=ProfileDuplicateError("Ya existe"))):
        with pytest.raises(HTTPException) as exc:
            await api.create_formula_profile({"name": "x"}, admin=_Admin())
    assert exc.value.status_code == 409


@pytest.mark.asyncio
async def test_create_endpoint_maps_name_error_to_422_list():
    from fastapi import HTTPException
    with patch.object(api.profile_service, "create_profile",
                      AsyncMock(side_effect=ProfileNameError("El nombre es requerido."))):
        with pytest.raises(HTTPException) as exc:
            await api.create_formula_profile({"name": ""}, admin=_Admin())
    assert exc.value.status_code == 422
    assert exc.value.detail == ["El nombre es requerido."]


@pytest.mark.asyncio
async def test_create_endpoint_maps_validation_to_422():
    from fastapi import HTTPException
    with patch.object(api.profile_service, "create_profile",
                      AsyncMock(side_effect=FormulaValidationError(["mal"]))):
        with pytest.raises(HTTPException) as exc:
            await api.create_formula_profile({"name": "x"}, admin=_Admin())
    assert exc.value.status_code == 422
    assert exc.value.detail == ["mal"]


@pytest.mark.asyncio
async def test_update_endpoint_maps_missing_to_404():
    from fastapi import HTTPException
    with patch.object(api.profile_service, "update_profile",
                      AsyncMock(side_effect=LookupError("Perfil no encontrado."))):
        with pytest.raises(HTTPException) as exc:
            await api.update_formula_profile(VALID_ID, {"name": "x"}, admin=_Admin())
    assert exc.value.status_code == 404


@pytest.mark.asyncio
async def test_delete_endpoint_ok_and_404():
    from fastapi import HTTPException
    with patch.object(api.profile_service, "delete_profile", AsyncMock()):
        assert await api.delete_formula_profile(VALID_ID, admin=_Admin()) == {"ok": True}
    with patch.object(api.profile_service, "delete_profile",
                      AsyncMock(side_effect=LookupError("Perfil no encontrado."))):
        with pytest.raises(HTTPException) as exc:
            await api.delete_formula_profile(VALID_ID, admin=_Admin())
    assert exc.value.status_code == 404
