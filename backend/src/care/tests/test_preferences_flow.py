"""Flujo de integración: crear/editar -> listar -> insights -> snapshot."""
import csv
import json
from datetime import date
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch

import motor.motor_asyncio
import pytest
from beanie.odm.settings.document import DocumentSettings

from src.care.models.care_dimension_map import CareDimensionMap
from src.care.models.care_user_preference import CareUserPreference
from src.care.preferences import export, service

_mongo_client = motor.motor_asyncio.AsyncIOMotorClient("mongodb://localhost:27017")
_db = _mongo_client["care_preferences_flow_test_db"]
if CareDimensionMap._document_settings is None:
    CareDimensionMap._document_settings = DocumentSettings(
        name="care_dimension_map",
        motor_db=_db,
        motor_collection=_db["care_dimension_map"],
    )
if CareUserPreference._document_settings is None:
    CareUserPreference._document_settings = DocumentSettings(
        name="care_user_preferences",
        motor_db=_db,
        motor_collection=_db["care_user_preferences"],
    )


def _tag_entry():
    from types import SimpleNamespace

    return SimpleNamespace(tag="appearance", care_dimension="values")


@pytest.mark.asyncio
async def test_preference_flow_produces_valid_snapshot(tmp_path, monkeypatch):
    monkeypatch.setenv("CARE_EXPORTS_DIR", str(tmp_path))

    with patch.object(CareDimensionMap, "find_one", AsyncMock(return_value=_tag_entry())), \
         patch.object(CareUserPreference, "find_one", AsyncMock(return_value=None)), \
         patch.object(CareUserPreference, "insert", AsyncMock()):
        created = await service.create_preference("u1", "values", 80, "appearance")

    created.id = "64b7f9c2f1a2b3c4d5e6f7a8"
    with patch.object(CareUserPreference, "get", AsyncMock(return_value=created)), \
         patch.object(CareUserPreference, "save", AsyncMock()):
        updated = await service.update_preference(created.id, "u1", {"score": 90})
    assert updated.score == 90

    query = MagicMock()
    query.count = AsyncMock(return_value=1)
    query.sort = MagicMock(return_value=query)
    query.skip = MagicMock(return_value=query)
    query.limit = MagicMock(return_value=query)
    query.to_list = AsyncMock(return_value=[updated])
    with patch.object(CareUserPreference, "find", MagicMock(return_value=query)):
        listing = await service.list_all_preferences(10, 0)
    assert listing["total"] == 1
    assert listing["items"][0]["score"] == 90

    collection = MagicMock()
    collection.count_documents = AsyncMock(return_value=1)
    collection.distinct = AsyncMock(return_value=["u1"])
    dims_cursor = MagicMock()
    dims_cursor.to_list = AsyncMock(
        return_value=[{"_id": "values", "count": 1, "avg_score": 90.0}]
    )
    tags_cursor = MagicMock()
    tags_cursor.to_list = AsyncMock(
        return_value=[{"_id": "appearance", "count": 1, "avg_score": 90.0}]
    )
    collection.aggregate = MagicMock(side_effect=[dims_cursor, tags_cursor])
    with patch.object(
        CareUserPreference,
        "get_motor_collection",
        MagicMock(return_value=collection),
    ):
        stats = await service.get_insights()
    assert stats["total_records"] == 1
    assert stats["unique_users"] == 1

    records = [export._record(updated)]
    assert records[0]["dimension"] == "values"
    assert records[0]["tag"] == "appearance"

    with patch.object(export, "collect_records", AsyncMock(return_value=records)):
        result = await export.build_export(date(2026, 10, 19))

    payload = json.loads(Path(result["files"]["json"]).read_text(encoding="utf-8"))
    assert payload["count"] == 1
    assert payload["date"] == "2026-10-19"
    assert payload["records"][0]["score"] == 90

    with Path(result["files"]["csv"]).open(encoding="utf-8-sig", newline="") as fh:
        rows = list(csv.DictReader(fh))
    assert rows[0]["user_id"] == "u1"
    assert rows[0]["dimension"] == "values"
    assert rows[0]["tag"] == "appearance"
    assert rows[0]["score"] == "90"
