"""CARE preferences: seed, validaciones, CRUD, insights y export (sin Mongo)."""
from types import SimpleNamespace
from unittest.mock import AsyncMock, patch

import motor.motor_asyncio
import pytest
from beanie.odm.settings.document import DocumentSettings

from src.care.models.care_dimension_map import CareDimensionMap
from src.care.models.care_user_preference import CareUserPreference
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
