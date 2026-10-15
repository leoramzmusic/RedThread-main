"""DB-wrapper tests with monkeypatched Beanie documents (no Mongo)."""
from unittest.mock import AsyncMock, MagicMock, patch

import motor.motor_asyncio
from beanie.odm.settings.document import DocumentSettings
import pytest
from src.care.formula import service
from src.care.formula.service import (
    CANONICAL_BLOCKS,
    FormulaNoChangeError,
    FormulaValidationError,
    ensure_active_formula,
    list_versions,
    rollback_to_version,
    save_new_version,
)
from src.care.models.care_formula import CAREFormula
from src.models.algorithm_management import AlgorithmHistory

# Beanie exige settings para CONSTRUIR documentos (Document.__init__ llama a
# get_motor_collection). Cliente motor real pero perezoso: nunca se conecta.
_mongo_client = motor.motor_asyncio.AsyncIOMotorClient("mongodb://localhost:27017")
_db = _mongo_client["care_test_db"]
for _cls, _name in ((CAREFormula, "care_formulas"), (AlgorithmHistory, "algorithm_history")):
    if _cls._document_settings is None:
        _cls._document_settings = DocumentSettings(
            name=_name, motor_db=_db, motor_collection=_db[_name]
        )


def _payload(**over):
    data = {
        "blocks": dict(CANONICAL_BLOCKS),
        "chaos_factor": 0.0,
        "chaos_seed": None,
        "min_compatibility": 0.0,
        "match_critical": 0.15,
        "changelog": "cambio de prueba",
    }
    data.update(over)
    return data


@pytest.mark.asyncio
async def test_save_validates_before_touching_db():
    bad = _payload(chaos_factor=99.0)
    with pytest.raises(FormulaValidationError) as exc:
        await save_new_version(bad, admin_id="adm1", source="equation")
    assert any("chaos_factor" in e for e in exc.value.errors)


@pytest.mark.asyncio
async def test_save_rejects_no_change():
    active = AsyncMock()
    active.version = 3
    active.blocks = dict(CANONICAL_BLOCKS)
    active.chaos_factor = 0.0
    active.chaos_seed = None
    active.min_compatibility = 0.0
    active.match_critical = 0.15
    with patch.object(service.CAREFormula, "find_one", AsyncMock(return_value=active)), \
         patch.object(service.CAREFormula, "find_all", AsyncMock()):
        with pytest.raises(FormulaNoChangeError):
            await save_new_version(_payload(), admin_id="adm1", source="criteria")


@pytest.mark.asyncio
async def test_save_creates_version_and_history():
    active = AsyncMock()
    active.version = 3
    active.blocks = dict(CANONICAL_BLOCKS)
    active.chaos_factor = 0.0
    active.chaos_seed = None
    active.min_compatibility = 0.0
    active.match_critical = 0.15
    active.model_dump = MagicMock(return_value={"version": 3, "status": "active"})
    new_blocks = dict(CANONICAL_BLOCKS, values=0.32, relationship_goals=0.22)
    inserted = []
    history_entries = []
    qs_to_list = AsyncMock(return_value=[active])
    qs_limit = MagicMock(return_value=MagicMock(to_list=qs_to_list))
    qs_sort = MagicMock(return_value=MagicMock(limit=qs_limit))
    find_all_mock = MagicMock(return_value=MagicMock(sort=qs_sort))

    with patch.object(service.CAREFormula, "find_one", AsyncMock(return_value=active)), \
         patch.object(service.CAREFormula, "find_all", find_all_mock), \
         patch.object(service, "insert_new_formula", AsyncMock(side_effect=lambda doc: inserted.append(doc) or doc)), \
         patch.object(service, "insert_history", AsyncMock(side_effect=lambda h: history_entries.append(h) or h)):
        result = await save_new_version(
            _payload(blocks=new_blocks, changelog="Valores 36→32"),
            admin_id="adm1", source="criteria",
        )
    assert result.version == 4
    assert result.blocks["values"] == 0.32
    assert history_entries and history_entries[0].action == "save_formula"
    assert "[criteria]" in history_entries[0].comment


@pytest.mark.asyncio
async def test_list_versions_orders_desc():
    fake_qs = MagicMock()
    fake_qs.sort = MagicMock(return_value=MagicMock(
        limit=MagicMock(return_value=MagicMock(to_list=AsyncMock(return_value=["v3", "v2"])))))
    with patch.object(service.CAREFormula, "find_all", MagicMock(return_value=fake_qs)):
        assert await list_versions() == ["v3", "v2"]


@pytest.mark.asyncio
async def test_ensure_active_formula_seeds_canonical_v1():
    """Sin fórmula activa => inserta el seed canónico v1 como 'system'."""
    inserted = []
    with patch.object(service.CAREFormula, "find_one", AsyncMock(return_value=None)), \
         patch.object(service.CAREFormula, "insert",
                      AsyncMock(side_effect=lambda doc: inserted.append(doc) or doc)):
        result = await ensure_active_formula()
    assert result.version == 1
    assert len(inserted) == 1
    seeded = inserted[0]
    assert seeded.version == 1
    assert seeded.status == "active"
    assert seeded.blocks == dict(CANONICAL_BLOCKS)
    assert seeded.changelog == "Seed inicial canónico"
    assert seeded.created_by == "system"


@pytest.mark.asyncio
async def test_rollback_missing_version_raises_lookup():
    """Versión inexistente => LookupError (el endpoint lo mapea a 404)."""
    with patch.object(service.CAREFormula, "find_one", AsyncMock(return_value=None)):
        with pytest.raises(LookupError):
            await rollback_to_version(99, admin_id="adm1")
