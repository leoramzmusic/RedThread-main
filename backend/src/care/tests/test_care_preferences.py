"""CARE preferences: seed, validaciones, CRUD, insights y export (sin Mongo)."""
from datetime import datetime
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock, patch

import motor.motor_asyncio
import pytest
from beanie.odm.settings.document import DocumentSettings

from src.care.models.care_dimension_map import CareDimensionMap
from src.care.models.care_user_preference import CareUserPreference
from src.care.preferences import service
from src.core import seed

_mongo_client = motor.motor_asyncio.AsyncIOMotorClient("mongodb://localhost:27017")
_db = _mongo_client["care_preferences_test_db"]
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


@pytest.mark.asyncio
async def test_seed_dimension_map_inserts_all_defaults_idempotently():
    created_docs = []

    class FakeMap:
        find_one = AsyncMock(return_value=None)

        def __init__(self, **kwargs):
            self.__dict__.update(kwargs)
            created_docs.append(self)

        async def insert(self):
            return None

    with patch.object(seed, "CareDimensionMap", FakeMap):
        created = await seed.ensure_care_dimension_map_seeded()
    assert created == 4
    assert {doc.tag for doc in created_docs} == {
        "humor",
        "appearance",
        "science",
        "art",
    }


@pytest.mark.asyncio
async def test_seed_dimension_map_updates_changed_mapping():
    docs = {
        "humor": SimpleNamespace(
            tag="humor", care_dimension="music", save=AsyncMock()
        ),
        "appearance": SimpleNamespace(
            tag="appearance", care_dimension="values", save=AsyncMock()
        ),
        "science": SimpleNamespace(
            tag="science", care_dimension="relationship_goals", save=AsyncMock()
        ),
        "art": SimpleNamespace(
            tag="art", care_dimension="music", save=AsyncMock()
        ),
    }
    with patch.object(
        seed.CareDimensionMap,
        "find_one",
        AsyncMock(side_effect=lambda query: docs[query["tag"]]),
    ):
        created = await seed.ensure_care_dimension_map_seeded()
    assert created == 0
    assert docs["humor"].care_dimension == "communication_style"
    assert docs["humor"].save.await_count == 1
    assert docs["appearance"].save.await_count == 0


VALID_ID = "64b7f9c2f1a2b3c4d5e6f7a8"
OTHER_ID = "64b7f9c2f1a2b3c4d5e6f7a9"


def _user_pref(**over):
    doc = AsyncMock()
    doc.id = VALID_ID
    doc.user_id = "u1"
    doc.dimension = "values"
    doc.tag = None
    doc.score = 80
    doc.created_at = datetime.utcnow()
    doc.updated_at = datetime.utcnow()
    doc.model_dump = lambda mode="json": {"id": VALID_ID, "user_id": "u1"}
    for key, value in over.items():
        setattr(doc, key, value)
    return doc


def _tag_entry(care_dimension="values"):
    return SimpleNamespace(tag="appearance", care_dimension=care_dimension)


@pytest.mark.asyncio
async def test_create_rejects_invalid_dimension_and_score():
    with pytest.raises(service.PreferenceValidationError) as exc:
        await service.create_preference("u1", "unknown", 50)
    assert exc.value.errors == ["La dimensión no es válida."]

    for bad in (-1, 101, 50.5, True, "50", None):
        with pytest.raises(service.PreferenceValidationError) as exc:
            await service.create_preference("u1", "values", bad)
        assert exc.value.errors == ["El score debe estar entre 0 y 100."]


@pytest.mark.asyncio
async def test_create_accepts_boundary_scores():
    with patch.object(service.CareUserPreference, "find_one", AsyncMock(return_value=None)), \
         patch.object(service.CareUserPreference, "insert", AsyncMock()):
        low = await service.create_preference("u1", "values", 0)
        high = await service.create_preference("u2", "values", 100)
    assert (low.score, high.score) == (0, 100)


@pytest.mark.asyncio
async def test_create_validates_tag_against_map():
    with patch.object(service.CareDimensionMap, "find_one", AsyncMock(return_value=None)):
        with pytest.raises(service.PreferenceValidationError) as exc:
            await service.create_preference("u1", "values", 50, "mystery")
    assert exc.value.errors == ["Etiqueta desconocida."]

    with patch.object(service.CareDimensionMap, "find_one",
                      AsyncMock(return_value=_tag_entry("music"))):
        with pytest.raises(service.PreferenceValidationError) as exc:
            await service.create_preference("u1", "values", 50, "appearance")
    assert exc.value.errors == ["La etiqueta no corresponde a esa dimensión."]


@pytest.mark.asyncio
async def test_create_stores_clean_tag_and_rejects_duplicate():
    with patch.object(service.CareDimensionMap, "find_one",
                      AsyncMock(return_value=_tag_entry("values"))), \
         patch.object(service.CareUserPreference, "find_one", AsyncMock(return_value=None)), \
         patch.object(service.CareUserPreference, "insert", AsyncMock()):
        doc = await service.create_preference("u1", "values", 80, "  appearance  ")
    assert doc.tag == "appearance"
    assert doc.score == 80
    assert doc.user_id == "u1"

    with patch.object(service.CareUserPreference, "find_one",
                      AsyncMock(return_value=_user_pref())):
        with pytest.raises(service.PreferenceDuplicateError) as exc:
            await service.create_preference("u1", "values", 80)
    assert str(exc.value) == "Ya existe una preferencia para esa dimensión."


@pytest.mark.asyncio
async def test_create_maps_duplicate_key_race():
    from pymongo.errors import DuplicateKeyError

    with patch.object(service.CareUserPreference, "find_one", AsyncMock(return_value=None)), \
         patch.object(service.CareUserPreference, "insert",
                      AsyncMock(side_effect=DuplicateKeyError("dup"))):
        with pytest.raises(service.PreferenceDuplicateError):
            await service.create_preference("u1", "values", 80)


@pytest.mark.asyncio
async def test_list_user_preferences_sorts_by_dimension():
    query = MagicMock()
    query.sort = MagicMock(return_value=query)
    query.to_list = AsyncMock(return_value=["a", "b"])
    with patch.object(service.CareUserPreference, "find",
                      MagicMock(return_value=query)) as find_mock:
        assert await service.list_user_preferences("u1") == ["a", "b"]
    find_mock.assert_called_with({"user_id": "u1"})
    query.sort.assert_called_with("dimension")


@pytest.mark.asyncio
async def test_update_requires_ownership_and_updates_fields():
    with patch.object(service.CareUserPreference, "get", AsyncMock(return_value=None)):
        with pytest.raises(LookupError) as exc:
            await service.update_preference(VALID_ID, "u1", {"score": 90})
    assert str(exc.value) == "Preferencia no encontrada."

    other = _user_pref(user_id="u2")
    with patch.object(service.CareUserPreference, "get", AsyncMock(return_value=other)):
        with pytest.raises(LookupError):
            await service.update_preference(VALID_ID, "u1", {"score": 90})

    doc = _user_pref(tag=None)
    doc.save = AsyncMock()
    with patch.object(service.CareUserPreference, "get", AsyncMock(return_value=doc)), \
         patch.object(service.CareDimensionMap, "find_one",
                      AsyncMock(return_value=_tag_entry("values"))):
        updated = await service.update_preference(
            VALID_ID, "u1", {"score": 90, "tag": " appearance "}
        )
    assert updated.score == 90
    assert updated.tag == "appearance"
    doc.save.assert_awaited()


@pytest.mark.asyncio
async def test_update_validates_score_and_allows_clearing_tag():
    doc = _user_pref(tag="appearance")
    doc.save = AsyncMock()
    with patch.object(service.CareUserPreference, "get", AsyncMock(return_value=doc)):
        with pytest.raises(service.PreferenceValidationError):
            await service.update_preference(VALID_ID, "u1", {"score": 500})
        updated = await service.update_preference(VALID_ID, "u1", {"tag": None})
    assert updated.tag is None


@pytest.mark.asyncio
async def test_delete_requires_ownership():
    with patch.object(service.CareUserPreference, "get", AsyncMock(return_value=None)):
        with pytest.raises(LookupError):
            await service.delete_preference(VALID_ID, "u1")

    doc = _user_pref()
    doc.delete = AsyncMock()
    with patch.object(service.CareUserPreference, "get", AsyncMock(return_value=doc)):
        await service.delete_preference(VALID_ID, "u1")
    doc.delete.assert_awaited()


@pytest.mark.asyncio
async def test_list_all_preferences_paginates_and_filters():
    doc = _user_pref()
    query = MagicMock()
    query.count = AsyncMock(return_value=7)
    query.sort = MagicMock(return_value=query)
    query.skip = MagicMock(return_value=query)
    query.limit = MagicMock(return_value=query)
    query.to_list = AsyncMock(return_value=[doc])

    with patch.object(service.CareUserPreference, "find",
                      MagicMock(return_value=query)) as find_mock:
        result = await service.list_all_preferences(
            10, 5, dimension="values", user_id="u1"
        )

    assert result == {
        "items": [{"id": VALID_ID, "user_id": "u1"}],
        "total": 7,
        "limit": 10,
        "offset": 5,
    }
    find_mock.assert_called_with({"dimension": "values", "user_id": "u1"})
    query.skip.assert_called_with(5)
    query.limit.assert_called_with(10)


@pytest.mark.asyncio
async def test_get_insights_groups_rounds_and_ranks_top_three():
    collection = MagicMock()
    collection.count_documents = AsyncMock(return_value=5)
    collection.distinct = AsyncMock(return_value=["u1", "u2"])

    dims_cursor = MagicMock()
    dims_cursor.to_list = AsyncMock(return_value=[
        {"_id": "values", "count": 3, "avg_score": 85.56},
        {"_id": "music", "count": 1, "avg_score": 40.0},
        {"_id": "communication_style", "count": 1, "avg_score": 60.0},
        {"_id": "love_language", "count": 1, "avg_score": 90.0},
    ])
    tags_cursor = MagicMock()
    tags_cursor.to_list = AsyncMock(return_value=[
        {"_id": "appearance", "count": 2, "avg_score": 80.0}
    ])
    collection.aggregate = MagicMock(side_effect=[dims_cursor, tags_cursor])

    with patch.object(service.CareUserPreference, "get_motor_collection",
                      MagicMock(return_value=collection)):
        result = await service.get_insights()

    assert result["total_records"] == 5
    assert result["unique_users"] == 2
    assert result["dimensions"][0] == {
        "dimension": "values", "count": 3, "avg_score": 85.6
    }
    assert result["tags"] == [
        {"tag": "appearance", "count": 2, "avg_score": 80.0}
    ]
    assert [row["dimension"] for row in result["top_dimensions"]] == [
        "love_language", "values", "communication_style"
    ]
