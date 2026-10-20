# CARE Preferences Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar preferencias CARE por usuario, insights admin y export JSON/CSV, integrar las tarjetas en Discover, redefinir Interpreter como repositorio y quitar la vista previa A/B de Equation.

**Architecture:** Backend FastAPI + Beanie con una colección `care_user_preferences` (una fila por `user_id`+`dimension`), un mapa seedeado `care_dimension_map` y un servicio de export compartido entre CLI y endpoint admin. Frontend Next.js con servicios axios separados para usuario/admin, componentes CARE nuevos, Discover embebido, Interpreter de solo lectura y Equation sin el panel A/B.

**Tech Stack:** Python 3.12, FastAPI 0.115, Beanie 1.27, Motor, pytest 8.3, React 19, Next.js, MUI 7, TypeScript, Jest 30 + Testing Library.

**Spec:** `docs/superpowers/specs/2026-10-19-care-preferences-design.md`

## Global Constraints

- 7 dimensiones CARE canónicas, con los keys exactos de `CANONICAL_BLOCKS`: `values, relationship_goals, neurodiversity, responsiveness, music, love_language, communication_style`.
- `score` es entero 0–100; floats, bools y strings se rechazan con el mensaje `"El score debe estar entre 0 y 100."`.
- `user_id` de usuario se deriva de la sesión (`get_current_user`); cualquier `user_id` del body se ignora.
- Errores exactos en español: `"La dimensión no es válida."`, `"El score debe estar entre 0 y 100."`, `"Etiqueta desconocida."`, `"La etiqueta no corresponde a esa dimensión."`, `"Ya existe una preferencia para esa dimensión."`, `"Preferencia no encontrada."`.
- Sin dependencias nuevas; export con stdlib (`json`, `csv`, `tempfile`/`os.replace`, `pathlib`, `argparse`).
- Timestamps UTC (`datetime.utcnow()`), respuestas con ISO 8601.
- No se toca `lab.tsx`.
- No se hace push. Los commits del plan solo se ejecutan cuando el usuario autorice la ejecución.
- Los tests backend no usan Mongo real: se parchean los métodos de Beanie/Motor (patrón `test_care_profiles.py`).
- El `test_phase2.py::test_dynamic_score_with_tag_affinity` es un fallo preexistente; no forma parte de este plan.
- Frontend: copia hardcoded en español, sin i18n nuevo; `npx tsc --noEmit` debe quedar limpio.

---

### Task 1: Modelos y seed del mapa de dimensiones

**Files:**
- Create: `backend/src/care/models/care_user_preference.py`
- Create: `backend/src/care/models/care_dimension_map.py`
- Modify: `backend/src/core/database.py` (imports + `document_models` + llamada al seed)
- Modify: `backend/src/core/seed.py` (mapa + `ensure_care_dimension_map_seeded`)
- Test: `backend/src/care/tests/test_care_preferences.py` (nuevo)

**Interfaces:**
- Consumes: nada (primer task).
- Produces: `CareUserPreference(user_id: str, dimension: str, tag: Optional[str], score: int, created_at: datetime, updated_at: datetime)`; `CareDimensionMap(tag: str, care_dimension: str)`; `ensure_care_dimension_map_seeded() -> int`.

- [ ] **Step 1: Write the failing seed test**

Create `backend/src/care/tests/test_care_preferences.py`:

```python
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
```

- [ ] **Step 2: Run the test to verify it fails**

Run (desde `backend/`): `& "venv\Scripts\python.exe" -m pytest src/care/tests/test_care_preferences.py -q`

Expected: FAIL con `ImportError` / `AttributeError: module 'src.core.seed' has no attribute 'CareDimensionMap'`.

- [ ] **Step 3: Create the models**

`backend/src/care/models/care_dimension_map.py`:

```python
"""Mapa extensible tag natural -> dimensión CARE canónica."""
from beanie import Document
from pydantic import Field
from pymongo import ASCENDING, IndexModel


class CareDimensionMap(Document):
    """Traducción de una etiqueta natural a una de las 7 dimensiones CARE."""

    tag: str = Field(min_length=1, max_length=40)
    care_dimension: str

    class Settings:
        name = "care_dimension_map"
        indexes = [IndexModel([("tag", ASCENDING)], unique=True)]
```

`backend/src/care/models/care_user_preference.py`:

```python
"""Preferencia CARE declarada por un usuario (una fila por dimensión)."""
from datetime import datetime
from typing import Optional

from beanie import Document
from pydantic import Field
from pymongo import ASCENDING, IndexModel


class CareUserPreference(Document):
    """Score 0-100 que un usuario asigna a una dimensión CARE."""

    user_id: str
    dimension: str
    tag: Optional[str] = None
    score: int
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "care_user_preferences"
        indexes = [
            IndexModel(
                [("user_id", ASCENDING), ("dimension", ASCENDING)], unique=True
            ),
            IndexModel([("dimension", ASCENDING)]),
        ]
```

- [ ] **Step 4: Add the seed catalog and function**

En `backend/src/core/seed.py`, añadir el import junto a los demás modelos:

```python
from src.care.models.care_dimension_map import CareDimensionMap
```

Y al final del archivo (antes del bloque `if __name__ == "__main__":`):

```python
CARE_DIMENSION_MAP_SEED: list[dict] = [
    {"tag": "humor", "care_dimension": "communication_style"},
    {"tag": "appearance", "care_dimension": "values"},
    {"tag": "science", "care_dimension": "relationship_goals"},
    {"tag": "art", "care_dimension": "music"},
]


async def ensure_care_dimension_map_seeded() -> int:
    """Crea/actualiza el mapa tag -> CARE. Idempotente (upsert por tag)."""
    created = 0
    for item in CARE_DIMENSION_MAP_SEED:
        existing = await CareDimensionMap.find_one({"tag": item["tag"]})
        if existing:
            if existing.care_dimension != item["care_dimension"]:
                existing.care_dimension = item["care_dimension"]
                await existing.save()
            continue
        await CareDimensionMap(**item).insert()
        created += 1
    if created:
        print(f"[seed] Mapa de dimensiones CARE creado: {created}")
    return created
```

- [ ] **Step 5: Register models and invoke the seed**

En `backend/src/core/database.py`:

```python
from src.care.models.care_dimension_map import CareDimensionMap
from src.care.models.care_user_preference import CareUserPreference
```

Añadir ambos a `document_models` después de `CAREProfile`:

```python
            CAREProfile,
            CareDimensionMap,
            CareUserPreference,
```

Y en el bloque de seeds de `init_db()`:

```python
    from src.core.seed import (
        seed_system_data,
        ensure_profile_modules_seeded,
        ensure_integration_defaults,
        ensure_care_dimension_map_seeded,
    )

    await seed_system_data()
    await ensure_profile_modules_seeded()
    await ensure_integration_defaults()
    await ensure_care_dimension_map_seeded()
```

- [ ] **Step 6: Run the test to verify it passes**

Run (desde `backend/`): `& "venv\Scripts\python.exe" -m pytest src/care/tests/test_care_preferences.py -q`

Expected: `2 passed`.

- [ ] **Step 7: Commit**

```bash
git add backend/src/care/models/care_user_preference.py backend/src/care/models/care_dimension_map.py backend/src/core/database.py backend/src/core/seed.py backend/src/care/tests/test_care_preferences.py
git commit -m "feat(care-api): modelos y seed del mapa de preferencias"
```

---

### Task 2: Servicio CRUD de preferencias

**Files:**
- Create: `backend/src/care/preferences/__init__.py` (vacío)
- Create: `backend/src/care/preferences/service.py`
- Test: `backend/src/care/tests/test_care_preferences.py` (append)

**Interfaces:**
- Consumes: `CareUserPreference`, `CareDimensionMap` (Task 1); `CANONICAL_BLOCKS` de `src.care.formula.service`.
- Produces:
  - `CARE_DIMENSION_KEYS: tuple[str, ...]`
  - `PreferenceValidationError(errors: list[str])`, `PreferenceDuplicateError`, `LookupError("Preferencia no encontrada.")`
  - `create_preference(user_id, dimension, score, tag=None) -> CareUserPreference`
  - `list_user_preferences(user_id) -> list[CareUserPreference]`
  - `update_preference(preference_id, user_id, payload: dict) -> CareUserPreference`
  - `delete_preference(preference_id, user_id) -> None`

- [ ] **Step 1: Write the failing service tests**

Amplía los imports del inicio de `backend/src/care/tests/test_care_preferences.py` (el bootstrap de `_document_settings` de Task 1 se mantiene):

```python
from datetime import datetime
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock, patch

from src.care.preferences import service
```

Después añade al final del archivo (sin repetir imports):

```python
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
```

- [ ] **Step 2: Run the tests to verify they fail**

Run (desde `backend/`): `& "venv\Scripts\python.exe" -m pytest src/care/tests/test_care_preferences.py -q`

Expected: FAIL con `ModuleNotFoundError: No module named 'src.care.preferences'`.

- [ ] **Step 3: Implement the service**

`backend/src/care/preferences/__init__.py` vacío.

`backend/src/care/preferences/service.py`:

```python
"""Preferencias CARE: validación, CRUD por usuario y consultas admin."""
from datetime import datetime
from typing import Any, Dict, List, Optional

from beanie import PydanticObjectId
from pymongo.errors import DuplicateKeyError

from src.care.formula.service import CANONICAL_BLOCKS
from src.care.models.care_dimension_map import CareDimensionMap
from src.care.models.care_user_preference import CareUserPreference

CARE_DIMENSION_KEYS: tuple[str, ...] = tuple(CANONICAL_BLOCKS.keys())
NOT_FOUND_MESSAGE = "Preferencia no encontrada."
DUPLICATE_MESSAGE = "Ya existe una preferencia para esa dimensión."


class PreferenceValidationError(ValueError):
    """Uno o más campos de la preferencia no son válidos."""

    def __init__(self, errors: List[str]):
        super().__init__("; ".join(errors))
        self.errors = errors


class PreferenceDuplicateError(ValueError):
    """Ya existe una fila (user_id, dimension)."""


def _validate_dimension(dimension: Any) -> None:
    if dimension not in CARE_DIMENSION_KEYS:
        raise PreferenceValidationError(["La dimensión no es válida."])


def _validate_score(score: Any) -> None:
    if isinstance(score, bool) or not isinstance(score, int) or not 0 <= score <= 100:
        raise PreferenceValidationError(["El score debe estar entre 0 y 100."])


async def _normalize_tag(dimension: str, tag: Any) -> Optional[str]:
    if tag is None:
        return None
    if not isinstance(tag, str):
        raise PreferenceValidationError(["Etiqueta desconocida."])
    cleaned = tag.strip()
    if not cleaned:
        return None
    entry = await CareDimensionMap.find_one({"tag": cleaned})
    if entry is None:
        raise PreferenceValidationError(["Etiqueta desconocida."])
    if entry.care_dimension != dimension:
        raise PreferenceValidationError(
            ["La etiqueta no corresponde a esa dimensión."]
        )
    return cleaned


def _object_id(value: Any) -> Optional[PydanticObjectId]:
    try:
        return PydanticObjectId(value)
    except Exception:
        return None


async def _get_owned(preference_id: str, user_id: str) -> CareUserPreference:
    object_id = _object_id(preference_id)
    doc = await CareUserPreference.get(object_id) if object_id else None
    if doc is None or doc.user_id != user_id:
        raise LookupError(NOT_FOUND_MESSAGE)
    return doc


async def list_user_preferences(user_id: str) -> List[CareUserPreference]:
    return await CareUserPreference.find({"user_id": user_id}).sort(
        "dimension"
    ).to_list()


async def create_preference(
    user_id: str, dimension: Any, score: Any, tag: Any = None
) -> CareUserPreference:
    _validate_dimension(dimension)
    _validate_score(score)
    cleaned_tag = await _normalize_tag(dimension, tag)
    existing = await CareUserPreference.find_one(
        {"user_id": user_id, "dimension": dimension}
    )
    if existing is not None:
        raise PreferenceDuplicateError(DUPLICATE_MESSAGE)
    now = datetime.utcnow()
    doc = CareUserPreference(
        user_id=user_id,
        dimension=dimension,
        tag=cleaned_tag,
        score=score,
        created_at=now,
        updated_at=now,
    )
    try:
        await doc.insert()
    except DuplicateKeyError:
        raise PreferenceDuplicateError(DUPLICATE_MESSAGE)
    return doc


async def update_preference(
    preference_id: str, user_id: str, payload: Dict[str, Any]
) -> CareUserPreference:
    doc = await _get_owned(preference_id, user_id)
    if "score" in payload:
        _validate_score(payload["score"])
        doc.score = payload["score"]
    if "tag" in payload:
        doc.tag = await _normalize_tag(doc.dimension, payload["tag"])
    doc.updated_at = datetime.utcnow()
    await doc.save()
    return doc


async def delete_preference(preference_id: str, user_id: str) -> None:
    doc = await _get_owned(preference_id, user_id)
    await doc.delete()
```

- [ ] **Step 4: Run the tests to verify they pass**

Run (desde `backend/`): `& "venv\Scripts\python.exe" -m pytest src/care/tests/test_care_preferences.py -q`

Expected: todos los tests del archivo en PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/src/care/preferences backend/src/care/tests/test_care_preferences.py
git commit -m "feat(care-api): servicio CRUD de preferencias"
```

---

### Task 3: Listado admin e insights

**Files:**
- Modify: `backend/src/care/preferences/service.py`
- Test: `backend/src/care/tests/test_care_preferences.py` (append)

**Interfaces:**
- Consumes: `CareUserPreference` (Task 1), servicio de Task 2.
- Produces:
  - `list_all_preferences(limit: int, offset: int, dimension: Optional[str] = None, user_id: Optional[str] = None) -> dict` con `{items, total, limit, offset}`.
  - `get_insights() -> dict` con `{generated_at, total_records, unique_users, dimensions, tags, top_dimensions}`.

- [ ] **Step 1: Write the failing tests**

Añadir al final de `backend/src/care/tests/test_care_preferences.py`:

```python
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
```

- [ ] **Step 2: Run the tests to verify they fail**

Run (desde `backend/`): `& "venv\Scripts\python.exe" -m pytest src/care/tests/test_care_preferences.py -q -k "list_all or insights"`

Expected: FAIL con `AttributeError: module ... has no attribute 'list_all_preferences'`.

- [ ] **Step 3: Implement listing and insights**

Añadir al final de `backend/src/care/preferences/service.py`:

```python
async def list_all_preferences(
    limit: int,
    offset: int,
    dimension: Optional[str] = None,
    user_id: Optional[str] = None,
) -> Dict[str, Any]:
    filters: Dict[str, Any] = {}
    if dimension:
        filters["dimension"] = dimension
    if user_id:
        filters["user_id"] = user_id
    query = CareUserPreference.find(filters)
    total = await query.count()
    items = await query.sort("-updated_at").skip(offset).limit(limit).to_list()
    return {
        "items": [doc.model_dump(mode="json") for doc in items],
        "total": total,
        "limit": limit,
        "offset": offset,
    }


async def get_insights() -> Dict[str, Any]:
    collection = CareUserPreference.get_motor_collection()
    total = await collection.count_documents({})
    user_ids = await collection.distinct("user_id")

    dim_cursor = collection.aggregate([
        {
            "$group": {
                "_id": "$dimension",
                "count": {"$sum": 1},
                "avg_score": {"$avg": "$score"},
            }
        },
        {"$sort": {"_id": 1}},
    ])
    dim_rows = await dim_cursor.to_list(length=None)

    tag_cursor = collection.aggregate([
        {"$match": {"tag": {"$ne": None}}},
        {
            "$group": {
                "_id": "$tag",
                "count": {"$sum": 1},
                "avg_score": {"$avg": "$score"},
            }
        },
        {"$sort": {"_id": 1}},
    ])
    tag_rows = await tag_cursor.to_list(length=None)

    dimensions = [
        {
            "dimension": row["_id"],
            "count": row["count"],
            "avg_score": round(float(row["avg_score"]), 1),
        }
        for row in dim_rows
    ]
    tags = [
        {
            "tag": row["_id"],
            "count": row["count"],
            "avg_score": round(float(row["avg_score"]), 1),
        }
        for row in tag_rows
    ]
    top_dimensions = sorted(
        dimensions, key=lambda row: (-row["avg_score"], -row["count"])
    )[:3]
    return {
        "generated_at": datetime.utcnow().isoformat(),
        "total_records": total,
        "unique_users": len(user_ids),
        "dimensions": dimensions,
        "tags": tags,
        "top_dimensions": top_dimensions,
    }
```

- [ ] **Step 4: Run the tests to verify they pass**

Run (desde `backend/`): `& "venv\Scripts\python.exe" -m pytest src/care/tests/test_care_preferences.py -q`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/src/care/preferences/service.py backend/src/care/tests/test_care_preferences.py
git commit -m "feat(care-api): insights y listado admin de preferencias"
```

---

### Task 4: Servicio de export JSON/CSV y CLI

**Files:**
- Create: `backend/src/care/preferences/export.py`
- Modify: `.gitignore` (añadir `backend/exports/`)
- Test: `backend/src/care/tests/test_preferences_export.py` (nuevo)

**Interfaces:**
- Consumes: `CareUserPreference` (Task 1); `CARE_DIMENSION_KEYS` opcional.
- Produces:
  - `collect_records() -> list[dict]`
  - `render_json(records, day, generated_at=None) -> str`
  - `render_csv(records) -> str`
  - `write_export(records, day=None, exports_dir=None) -> dict{date,count,files,records}`
  - `build_export(day=None) -> dict` (async)
  - `main(argv=None) -> int` (CLI)

- [ ] **Step 1: Write the failing export tests**

Create `backend/src/care/tests/test_preferences_export.py`:

```python
"""Export de preferencias: render puro, escritura atómica y CLI."""
import csv
import json
from datetime import date
from pathlib import Path
from unittest.mock import AsyncMock, patch

import pytest

from src.care.preferences import export


RECORDS = [
    {
        "user_id": "u2",
        "dimension": "music",
        "tag": None,
        "score": 40,
        "created_at": "2026-10-19T10:00:00",
        "updated_at": "2026-10-19T10:00:00",
    },
    {
        "user_id": "u1",
        "dimension": "values",
        "tag": "appearance",
        "score": 80,
        "created_at": "2026-10-19T09:00:00",
        "updated_at": "2026-10-19T09:30:00",
    },
]


def test_render_json_has_required_shape():
    payload = json.loads(render := export.render_json(RECORDS, date(2026, 10, 19)))
    assert payload["date"] == "2026-10-19"
    assert payload["count"] == 2
    assert payload["records"] == RECORDS
    assert render.startswith("{")


def test_render_csv_has_headers_and_rows():
    content = export.render_csv(RECORDS)
    rows = list(csv.DictReader(content.splitlines()))
    assert rows[0]["user_id"] == "u2"
    assert rows[0]["tag"] == ""
    assert rows[1]["dimension"] == "values"
    assert list(rows[0].keys()) == [
        "user_id", "dimension", "tag", "score", "created_at", "updated_at"
    ]


def test_write_export_creates_both_files_and_overwrites(tmp_path):
    first = export.write_export(RECORDS, date(2026, 10, 19), tmp_path)
    assert first["count"] == 2
    json_path = Path(first["files"]["json"])
    csv_path = Path(first["files"]["csv"])
    assert json_path.read_text(encoding="utf-8")
    with csv_path.open(encoding="utf-8-sig", newline="") as fh:
        assert len(list(csv.DictReader(fh))) == 2

    second = export.write_export(RECORDS[:1], date(2026, 10, 19), tmp_path)
    payload = json.loads(json_path.read_text(encoding="utf-8"))
    assert second["count"] == 1
    assert payload["count"] == 1


@pytest.mark.asyncio
async def test_build_export_uses_collected_records(tmp_path, monkeypatch):
    monkeypatch.setenv("CARE_EXPORTS_DIR", str(tmp_path))
    with patch.object(export, "collect_records", AsyncMock(return_value=RECORDS)):
        result = await export.build_export(date(2026, 10, 19))
    assert result["count"] == 2
    assert Path(result["files"]["json"]).exists()


def test_cli_rejects_invalid_date():
    assert export.main(["--date", "2026-13-40"]) == 2
```

- [ ] **Step 2: Run the tests to verify they fail**

Run (desde `backend/`): `& "venv\Scripts\python.exe" -m pytest src/care/tests/test_preferences_export.py -q`

Expected: FAIL con `ModuleNotFoundError: No module named 'src.care.preferences.export'`.

- [ ] **Step 3: Implement the export service**

`backend/src/care/preferences/export.py`:

```python
"""Export diario de preferencias CARE a JSON y CSV (CLI + endpoint admin)."""
import argparse
import asyncio
import csv
import io
import json
import os
from datetime import date, datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

from src.care.models.care_user_preference import CareUserPreference

FIELDS = ["user_id", "dimension", "tag", "score", "created_at", "updated_at"]
DEFAULT_EXPORTS_DIR = (
    Path(__file__).resolve().parents[3] / "exports" / "preferences"
)


def _exports_dir() -> Path:
    return Path(os.getenv("CARE_EXPORTS_DIR", str(DEFAULT_EXPORTS_DIR)))


def _record(doc: Any) -> Dict[str, Any]:
    return {
        "user_id": doc.user_id,
        "dimension": doc.dimension,
        "tag": doc.tag,
        "score": doc.score,
        "created_at": doc.created_at.isoformat() if doc.created_at else None,
        "updated_at": doc.updated_at.isoformat() if doc.updated_at else None,
    }


async def collect_records() -> List[Dict[str, Any]]:
    """Filas ordenadas de forma determinista para snapshots reproducibles."""
    docs = await CareUserPreference.find_all().sort(
        "dimension", "user_id"
    ).to_list()
    return [_record(doc) for doc in docs]


def render_json(
    records: List[Dict[str, Any]],
    day: date,
    generated_at: Optional[str] = None,
) -> str:
    payload = {
        "generated_at": generated_at or datetime.utcnow().isoformat(),
        "date": day.isoformat(),
        "count": len(records),
        "records": records,
    }
    return json.dumps(payload, ensure_ascii=False, indent=2)


def render_csv(records: List[Dict[str, Any]]) -> str:
    buffer = io.StringIO()
    writer = csv.DictWriter(buffer, fieldnames=FIELDS)
    writer.writeheader()
    for record in records:
        writer.writerow({field: record.get(field) for field in FIELDS})
    return buffer.getvalue()


def _atomic_write(path: Path, content: str) -> None:
    tmp = path.with_name(path.name + ".tmp")
    encoding = "utf-8-sig" if path.suffix == ".csv" else "utf-8"
    tmp.write_text(content, encoding=encoding)
    os.replace(tmp, path)


def write_export(
    records: List[Dict[str, Any]],
    day: Optional[date] = None,
    exports_dir: Optional[os.PathLike] = None,
) -> Dict[str, Any]:
    target_day = day or datetime.utcnow().date()
    folder = Path(exports_dir) if exports_dir else _exports_dir()
    folder.mkdir(parents=True, exist_ok=True)
    json_path = folder / f"{target_day.isoformat()}.json"
    csv_path = folder / f"{target_day.isoformat()}.csv"
    generated_at = datetime.utcnow().isoformat()
    _atomic_write(json_path, render_json(records, target_day, generated_at))
    _atomic_write(csv_path, render_csv(records))
    return {
        "date": target_day.isoformat(),
        "count": len(records),
        "files": {"json": str(json_path), "csv": str(csv_path)},
        "records": records,
    }


async def build_export(day: Optional[date] = None) -> Dict[str, Any]:
    records = await collect_records()
    return write_export(records, day)


def main(argv: Optional[List[str]] = None) -> int:
    parser = argparse.ArgumentParser(
        description="Exporta preferencias CARE a JSON/CSV"
    )
    parser.add_argument("--date", help="Fecha YYYY-MM-DD (default: hoy UTC)")
    args = parser.parse_args(argv)

    day = None
    if args.date:
        try:
            day = date.fromisoformat(args.date)
        except ValueError:
            print(f"Fecha inválida: {args.date}. Usa YYYY-MM-DD.")
            return 2

    async def run() -> Dict[str, Any]:
        from src.core.database import close_db, init_db

        await init_db()
        try:
            return await build_export(day)
        finally:
            await close_db()

    try:
        result = asyncio.run(run())
    except Exception as exc:
        print(f"No se pudo exportar: {exc}")
        return 1
    print(
        f"[export] {result['count']} preferencias -> "
        f"{result['files']['json']} / {result['files']['csv']}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
```

- [ ] **Step 4: Ignore export artifacts**

Añadir al final de `.gitignore` (raíz del repo):

```gitignore
# Snapshots de preferencias CARE (datos de export, no versionar)
backend/exports/
```

- [ ] **Step 5: Run the tests to verify they pass**

Run (desde `backend/`): `& "venv\Scripts\python.exe" -m pytest src/care/tests/test_preferences_export.py -q`

Expected: `5 passed`.

- [ ] **Step 6: Commit**

```bash
git add backend/src/care/preferences/export.py backend/src/care/tests/test_preferences_export.py .gitignore
git commit -m "feat(care-api): exportacion JSON y CSV de preferencias"
```

---

### Task 5: Endpoints de usuario y admin

**Files:**
- Create: `backend/src/api/preferences.py`
- Create: `backend/src/api/admin_preferences.py`
- Modify: `backend/src/main.py` (imports + `include_router`)
- Test: `backend/src/care/tests/test_care_preferences.py` (append)

**Interfaces:**
- Consumes: `service.*` (Tasks 2–3); `export.build_export` (Task 4); `get_current_user`; `admin_required` de `admin_algorithms`.
- Produces: rutas HTTP `/preferences` (GET/POST), `/preferences/{id}` (PUT/DELETE) y `/portal-redthread/experiencia/algoritmos/preferences` (GET, GET `/insights`, POST `/export`).

- [ ] **Step 1: Write the failing endpoint tests**

Amplía los imports del inicio del archivo con:

```python
from fastapi import HTTPException

from src.api import admin_preferences as admin_api
from src.api import preferences as user_api
```

Después añade al final del archivo:

```python
class _User:
    id = "u1"


class _Admin:
    id = "emp1"


@pytest.mark.asyncio
async def test_user_list_and_create_return_dumps():
    doc = _user_pref()
    with patch.object(user_api.service, "list_user_preferences",
                      AsyncMock(return_value=[doc])):
        listed = await user_api.list_my_preferences(current_user=_User())
    assert listed == [{"id": VALID_ID, "user_id": "u1"}]

    create_mock = AsyncMock(return_value=doc)
    with patch.object(user_api.service, "create_preference", create_mock):
        created = await user_api.create_my_preference(
            {"dimension": "values", "score": 80, "user_id": "hacker"},
            current_user=_User(),
        )
    assert created == {"id": VALID_ID, "user_id": "u1"}
    create_mock.assert_awaited_with("u1", "values", 80, None)


@pytest.mark.asyncio
async def test_create_endpoint_maps_validation_and_duplicate():
    with patch.object(user_api.service, "create_preference",
                      AsyncMock(side_effect=service.PreferenceValidationError(
                          ["La dimensión no es válida."]))):
        with pytest.raises(HTTPException) as exc:
            await user_api.create_my_preference(
                {"dimension": "nope", "score": 1}, current_user=_User()
            )
    assert exc.value.status_code == 422
    assert exc.value.detail == ["La dimensión no es válida."]

    with patch.object(user_api.service, "create_preference",
                      AsyncMock(side_effect=service.PreferenceDuplicateError(
                          "Ya existe una preferencia para esa dimensión."))):
        with pytest.raises(HTTPException) as exc:
            await user_api.create_my_preference(
                {"dimension": "values", "score": 80}, current_user=_User()
            )
    assert exc.value.status_code == 409


@pytest.mark.asyncio
async def test_update_and_delete_map_missing_to_404():
    with patch.object(user_api.service, "update_preference",
                      AsyncMock(side_effect=LookupError("Preferencia no encontrada."))):
        with pytest.raises(HTTPException) as exc:
            await user_api.update_my_preference(
                VALID_ID, {"score": 10}, current_user=_User()
            )
    assert exc.value.status_code == 404

    doc = _user_pref()
    with patch.object(user_api.service, "update_preference",
                      AsyncMock(return_value=doc)):
        assert await user_api.update_my_preference(
            VALID_ID, {"score": 10}, current_user=_User()
        ) == {"id": VALID_ID, "user_id": "u1"}

    with patch.object(user_api.service, "delete_preference", AsyncMock()):
        assert await user_api.delete_my_preference(VALID_ID, current_user=_User()) == {
            "ok": True
        }

    with patch.object(user_api.service, "delete_preference",
                      AsyncMock(side_effect=LookupError("Preferencia no encontrada."))):
        with pytest.raises(HTTPException) as exc:
            await user_api.delete_my_preference(VALID_ID, current_user=_User())
    assert exc.value.status_code == 404


@pytest.mark.asyncio
async def test_admin_list_validates_and_delegates():
    with pytest.raises(HTTPException) as exc:
        await admin_api.list_all_preferences(admin=_Admin(), limit=0)
    assert exc.value.status_code == 422

    with pytest.raises(HTTPException) as exc:
        await admin_api.list_all_preferences(admin=_Admin(), dimension="nope")
    assert exc.value.status_code == 422

    payload = {"items": [], "total": 0, "limit": 10, "offset": 0}
    with patch.object(admin_api.service, "list_all_preferences",
                      AsyncMock(return_value=payload)) as list_mock:
        result = await admin_api.list_all_preferences(
            admin=_Admin(), limit=10, offset=0, dimension="values", user_id="u1"
        )
    assert result == payload
    list_mock.assert_awaited_with(
        limit=10, offset=0, dimension="values", user_id="u1"
    )


@pytest.mark.asyncio
async def test_admin_insights_and_export_delegate():
    insights = {"total_records": 0, "unique_users": 0}
    with patch.object(admin_api.service, "get_insights",
                      AsyncMock(return_value=insights)):
        assert await admin_api.preference_insights(admin=_Admin()) == insights

    exported = {"date": "2026-10-19", "count": 1, "files": {}, "records": []}
    with patch.object(admin_api.export_service, "build_export",
                      AsyncMock(return_value=exported)):
        assert await admin_api.export_preferences(admin=_Admin()) == exported
```

- [ ] **Step 2: Run the tests to verify they fail**

Run (desde `backend/`): `& "venv\Scripts\python.exe" -m pytest src/care/tests/test_care_preferences.py -q -k "endpoint or admin"`

Expected: FAIL con `ImportError: cannot import name 'preferences' from 'src.api'`.

- [ ] **Step 3: Create the user router**

`backend/src/api/preferences.py`:

```python
"""Preferencias CARE del usuario autenticado."""
from typing import Any, Dict

from fastapi import APIRouter, Depends, HTTPException

from src.api.auth import get_current_user
from src.care.preferences import service
from src.models.user import User

router = APIRouter()


@router.get("")
async def list_my_preferences(current_user: User = Depends(get_current_user)):
    docs = await service.list_user_preferences(str(current_user.id))
    return [doc.model_dump(mode="json") for doc in docs]


@router.post("", status_code=201)
async def create_my_preference(
    body: Dict[str, Any], current_user: User = Depends(get_current_user)
):
    try:
        doc = await service.create_preference(
            str(current_user.id),
            body.get("dimension"),
            body.get("score"),
            body.get("tag"),
        )
    except service.PreferenceValidationError as exc:
        raise HTTPException(status_code=422, detail=exc.errors)
    except service.PreferenceDuplicateError as exc:
        raise HTTPException(status_code=409, detail=str(exc))
    return doc.model_dump(mode="json")


@router.put("/{preference_id}")
async def update_my_preference(
    preference_id: str,
    body: Dict[str, Any],
    current_user: User = Depends(get_current_user),
):
    payload = {
        key: body[key] for key in ("score", "tag") if key in body
    }
    try:
        doc = await service.update_preference(
            preference_id, str(current_user.id), payload
        )
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except service.PreferenceValidationError as exc:
        raise HTTPException(status_code=422, detail=exc.errors)
    return doc.model_dump(mode="json")


@router.delete("/{preference_id}")
async def delete_my_preference(
    preference_id: str, current_user: User = Depends(get_current_user)
):
    try:
        await service.delete_preference(preference_id, str(current_user.id))
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    return {"ok": True}
```

- [ ] **Step 4: Create the admin router**

`backend/src/api/admin_preferences.py`:

```python
"""Admin: listado, insights y export de preferencias CARE."""
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException

from src.api.admin_algorithms import admin_required
from src.care.preferences import export as export_service
from src.care.preferences import service
from src.models.employee import Employee

router = APIRouter()


@router.get("")
async def list_all_preferences(
    admin: Employee = Depends(admin_required),
    limit: int = 200,
    offset: int = 0,
    dimension: Optional[str] = None,
    user_id: Optional[str] = None,
):
    if limit < 1 or limit > 1000:
        raise HTTPException(
            status_code=422, detail=["El límite debe estar entre 1 y 1000."]
        )
    if offset < 0:
        raise HTTPException(
            status_code=422, detail=["El desplazamiento no puede ser negativo."]
        )
    if dimension is not None and dimension not in service.CARE_DIMENSION_KEYS:
        raise HTTPException(
            status_code=422, detail=["La dimensión no es válida."]
        )
    return await service.list_all_preferences(
        limit=limit, offset=offset, dimension=dimension, user_id=user_id
    )


@router.get("/insights")
async def preference_insights(admin: Employee = Depends(admin_required)):
    return await service.get_insights()


@router.post("/export")
async def export_preferences(admin: Employee = Depends(admin_required)):
    return await export_service.build_export()
```

- [ ] **Step 5: Register the routers in main.py**

Añadir a la lista de imports de `src.api` (después de `options`):

```python
    preferences,
    admin_preferences,
```

Añadir después del `include_router` de `settings_router`:

```python
app.include_router(
    preferences.router, prefix="/preferences", tags=["Preferences"]
)
```

Añadir después del `include_router` de `admin_algorithms`:

```python
app.include_router(
    admin_preferences.router,
    prefix="/portal-redthread/experiencia/algoritmos/preferences",
    tags=["Admin - Preferencias CARE"],
)
```

- [ ] **Step 6: Run the tests to verify they pass**

Run (desde `backend/`): `& "venv\Scripts\python.exe" -m pytest src/care/tests/test_care_preferences.py src/care/tests/test_preferences_export.py -q`

Expected: todos en PASS.

- [ ] **Step 7: Verify imports and flake8**

Run (desde `backend/`): `& "venv\Scripts\python.exe" -m flake8 src/care/preferences src/api/preferences.py src/api/admin_preferences.py src/care/models/care_user_preference.py src/care/models/care_dimension_map.py`

Expected: sin salida.

- [ ] **Step 8: Commit**

```bash
git add backend/src/api/preferences.py backend/src/api/admin_preferences.py backend/src/main.py backend/src/care/tests/test_care_preferences.py
git commit -m "feat(care-api): endpoints de preferencias para usuario y admin"
```

---

### Task 6: Servicio frontend de preferencias del usuario

**Files:**
- Create: `frontend/src/services/carePreferencesService.ts`
- Test: `frontend/src/services/carePreferencesService.test.ts`

**Interfaces:**
- Consumes: `apiClient` (default de `./api`); `CareDimensionKey`.
- Produces:
  - `CarePreference {id, user_id, dimension, tag, score, created_at, updated_at}`
  - `listPreferences()`, `createPreference(payload)`, `updatePreference(id, payload)`, `deletePreference(id)`
  - `preferenceErrorMessage(error: unknown): string`

- [ ] **Step 1: Write the failing service test**

Create `frontend/src/services/carePreferencesService.test.ts`:

```ts
import apiClient from "./api";
import {
  createPreference,
  deletePreference,
  listPreferences,
  preferenceErrorMessage,
  updatePreference,
  type CarePreference,
} from "./carePreferencesService";

jest.mock("./api", () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

const mockGet = apiClient.get as jest.Mock;
const mockPost = apiClient.post as jest.Mock;
const mockPut = apiClient.put as jest.Mock;
const mockDelete = apiClient.delete as jest.Mock;

const preference: CarePreference = {
  id: "p1",
  user_id: "u1",
  dimension: "values",
  tag: null,
  score: 80,
  created_at: "2026-10-19T00:00:00",
  updated_at: "2026-10-19T00:00:00",
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe("carePreferencesService", () => {
  it("lists the current user's preferences", async () => {
    mockGet.mockResolvedValueOnce({ data: [preference] });
    await expect(listPreferences()).resolves.toEqual([preference]);
    expect(mockGet).toHaveBeenCalledWith("/preferences");
  });

  it("creates a preference without sending user_id", async () => {
    mockPost.mockResolvedValueOnce({ data: preference });
    await createPreference({ dimension: "values", score: 80 });
    expect(mockPost).toHaveBeenCalledWith("/preferences", {
      dimension: "values",
      score: 80,
    });
  });

  it("updates a preference by id", async () => {
    mockPut.mockResolvedValueOnce({ data: preference });
    await updatePreference("p1", { score: 90 });
    expect(mockPut).toHaveBeenCalledWith("/preferences/p1", { score: 90 });
  });

  it("deletes a preference by id", async () => {
    mockDelete.mockResolvedValueOnce({ data: { ok: true } });
    await deletePreference("p1");
    expect(mockDelete).toHaveBeenCalledWith("/preferences/p1");
  });

  it("maps backend errors to Spanish messages", () => {
    expect(preferenceErrorMessage({ response: { status: 409 } })).toBe(
      "Ya existe una preferencia para esa dimensión.",
    );
    expect(preferenceErrorMessage({ response: { status: 404 } })).toBe(
      "Preferencia no encontrada.",
    );
    expect(
      preferenceErrorMessage({
        response: { status: 422, data: { detail: ["El score debe estar entre 0 y 100."] } },
      }),
    ).toBe("El score debe estar entre 0 y 100.");
    expect(preferenceErrorMessage(new Error("network"))).toBe(
      "No se pudieron guardar tus preferencias.",
    );
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run (desde `frontend/`): `npx jest src/services/carePreferencesService.test.ts --ci`

Expected: FAIL con `Cannot find module './carePreferencesService'`.

- [ ] **Step 3: Implement the service**

`frontend/src/services/carePreferencesService.ts`:

```ts
import apiClient from "./api";
import type { CareDimensionKey } from "../constants/careDimensions";

/** Preferencias CARE del usuario autenticado (apiClient). */
export interface CarePreference {
  id: string;
  user_id: string;
  dimension: CareDimensionKey;
  tag: string | null;
  score: number;
  created_at: string;
  updated_at: string;
}

export interface PreferencePayload {
  dimension: CareDimensionKey;
  tag?: string | null;
  score: number;
}

export interface PreferenceUpdate {
  score?: number;
  tag?: string | null;
}

const BASE = "/preferences";

export async function listPreferences(): Promise<CarePreference[]> {
  const { data } = await apiClient.get(BASE);
  return data as CarePreference[];
}

export async function createPreference(
  payload: PreferencePayload,
): Promise<CarePreference> {
  const { data } = await apiClient.post(BASE, payload);
  return data as CarePreference;
}

export async function updatePreference(
  id: string,
  payload: PreferenceUpdate,
): Promise<CarePreference> {
  const { data } = await apiClient.put(`${BASE}/${id}`, payload);
  return data as CarePreference;
}

export async function deletePreference(id: string): Promise<void> {
  await apiClient.delete(`${BASE}/${id}`);
}

export function preferenceErrorMessage(error: unknown): string {
  const response = (
    error as {
      response?: { status?: number; data?: { detail?: unknown } };
    }
  )?.response;
  const status = response?.status;
  if (status === 409) return "Ya existe una preferencia para esa dimensión.";
  if (status === 404) return "Preferencia no encontrada.";
  const detail = response?.data?.detail;
  if (Array.isArray(detail)) return detail.join(" ");
  if (typeof detail === "string") return detail;
  return "No se pudieron guardar tus preferencias.";
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run (desde `frontend/`): `npx jest src/services/carePreferencesService.test.ts --ci`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/services/carePreferencesService.ts frontend/src/services/carePreferencesService.test.ts
git commit -m "feat(care-ui): servicio de preferencias del usuario"
```

---

### Task 7: Servicio frontend admin

**Files:**
- Create: `frontend/src/services/carePreferencesAdminService.ts`
- Test: `frontend/src/services/carePreferencesAdminService.test.ts`

**Interfaces:**
- Consumes: `adminApiClient`, `CarePreference` (Task 6), `CareDimensionKey`.
- Produces:
  - `PreferenceInsightRow`, `PreferenceTagRow`, `PreferenceInsights`, `PreferenceListResponse`, `PreferenceExportResult`
  - `listAllPreferences(options)`, `getPreferenceInsights()`, `exportPreferences()`

- [ ] **Step 1: Write the failing service test**

Create `frontend/src/services/carePreferencesAdminService.test.ts`:

```ts
import { adminApiClient } from "./api";
import {
  exportPreferences,
  getPreferenceInsights,
  listAllPreferences,
  type PreferenceInsights,
} from "./carePreferencesAdminService";

jest.mock("./api", () => ({
  adminApiClient: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

const mockGet = adminApiClient.get as jest.Mock;
const mockPost = adminApiClient.post as jest.Mock;

const BASE = "/portal-redthread/experiencia/algoritmos/preferences";

const insights: PreferenceInsights = {
  generated_at: "2026-10-19T00:00:00",
  total_records: 2,
  unique_users: 1,
  dimensions: [{ dimension: "values", count: 2, avg_score: 80 }],
  tags: [],
  top_dimensions: [{ dimension: "values", count: 2, avg_score: 80 }],
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe("carePreferencesAdminService", () => {
  it("lists with only the provided query params", async () => {
    mockGet.mockResolvedValueOnce({
      data: { items: [], total: 0, limit: 100, offset: 0 },
    });
    await listAllPreferences({ limit: 100, dimension: "values" });
    expect(mockGet).toHaveBeenCalledWith(BASE, {
      params: { limit: 100, dimension: "values" },
    });
  });

  it("fetches insights", async () => {
    mockGet.mockResolvedValueOnce({ data: insights });
    await expect(getPreferenceInsights()).resolves.toEqual(insights);
    expect(mockGet).toHaveBeenCalledWith(`${BASE}/insights`);
  });

  it("exports the dataset", async () => {
    const exported = {
      date: "2026-10-19",
      count: 0,
      files: { json: "a.json", csv: "a.csv" },
      records: [],
    };
    mockPost.mockResolvedValueOnce({ data: exported });
    await expect(exportPreferences()).resolves.toEqual(exported);
    expect(mockPost).toHaveBeenCalledWith(`${BASE}/export`);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run (desde `frontend/`): `npx jest src/services/carePreferencesAdminService.test.ts --ci`

Expected: FAIL con `Cannot find module './carePreferencesAdminService'`.

- [ ] **Step 3: Implement the service**

`frontend/src/services/carePreferencesAdminService.ts`:

```ts
import { adminApiClient } from "./api";
import type { CareDimensionKey } from "../constants/careDimensions";
import type { CarePreference } from "./carePreferencesService";

/** Admin: repositorio, insights y export de preferencias CARE. */
export interface PreferenceInsightRow {
  dimension: CareDimensionKey;
  count: number;
  avg_score: number;
}

export interface PreferenceTagRow {
  tag: string;
  count: number;
  avg_score: number;
}

export interface PreferenceInsights {
  generated_at: string;
  total_records: number;
  unique_users: number;
  dimensions: PreferenceInsightRow[];
  tags: PreferenceTagRow[];
  top_dimensions: PreferenceInsightRow[];
}

export interface PreferenceListResponse {
  items: CarePreference[];
  total: number;
  limit: number;
  offset: number;
}

export interface PreferenceExportResult {
  date: string;
  count: number;
  files: { json: string; csv: string };
  records: CarePreference[];
}

export interface PreferenceListOptions {
  limit?: number;
  offset?: number;
  dimension?: CareDimensionKey | "";
  userId?: string;
}

const BASE = "/portal-redthread/experiencia/algoritmos/preferences";

export async function listAllPreferences(
  options: PreferenceListOptions = {},
): Promise<PreferenceListResponse> {
  const params: Record<string, string | number> = {};
  if (options.limit !== undefined) params.limit = options.limit;
  if (options.offset !== undefined) params.offset = options.offset;
  if (options.dimension) params.dimension = options.dimension;
  if (options.userId) params.user_id = options.userId;
  const { data } = await adminApiClient.get(BASE, { params });
  return data as PreferenceListResponse;
}

export async function getPreferenceInsights(): Promise<PreferenceInsights> {
  const { data } = await adminApiClient.get(`${BASE}/insights`);
  return data as PreferenceInsights;
}

export async function exportPreferences(): Promise<PreferenceExportResult> {
  const { data } = await adminApiClient.post(`${BASE}/export`);
  return data as PreferenceExportResult;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run (desde `frontend/`): `npx jest src/services/carePreferencesAdminService.test.ts --ci`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/services/carePreferencesAdminService.ts frontend/src/services/carePreferencesAdminService.test.ts
git commit -m "feat(care-ui): servicio admin de preferencias"
```

---

### Task 8: Tarjetas Discover y montaje en la página

**Files:**
- Create: `frontend/src/components/care/CarePreferenceCards.tsx`
- Create: `frontend/src/components/care/CarePreferenceCards.test.tsx`
- Modify: `frontend/src/pages/discover/index.tsx` (import + montaje dentro de `<Layout>`)

**Interfaces:**
- Consumes: `CARE_DIMENSIONS`, `CareDimensionKey`, servicio de Task 6.
- Produces: componente autónomo `CarePreferenceCards` (sin props) montado en Discover.

- [ ] **Step 1: Write the failing component test**

Create `frontend/src/components/care/CarePreferenceCards.test.tsx`:

```tsx
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import CarePreferenceCards from "./CarePreferenceCards";
import {
  createPreference,
  deletePreference,
  listPreferences,
  updatePreference,
  type CarePreference,
} from "../../services/carePreferencesService";

jest.mock("../../services/carePreferencesService", () => {
  const actual = jest.requireActual("../../services/carePreferencesService");
  return {
    ...actual,
    listPreferences: jest.fn(),
    createPreference: jest.fn(),
    updatePreference: jest.fn(),
    deletePreference: jest.fn(),
  };
});

const mockList = listPreferences as jest.Mock;
const mockCreate = createPreference as jest.Mock;
const mockUpdate = updatePreference as jest.Mock;
const mockDelete = deletePreference as jest.Mock;

const saved: CarePreference = {
  id: "p1",
  user_id: "u1",
  dimension: "values",
  tag: null,
  score: 80,
  created_at: "2026-10-19T00:00:00",
  updated_at: "2026-10-19T00:00:00",
};

const commitSlider = (key: string, value: number) => {
  const slider = screen.getByTestId(`preference-slider-${key}`);
  const input = slider.querySelector('input[type="range"]')!;
  fireEvent.change(input, { target: { value: String(value) } });
};

beforeEach(() => {
  jest.clearAllMocks();
  mockList.mockResolvedValue([saved]);
  mockUpdate.mockImplementation(async (_id: string, payload: { score: number }) => ({
    ...saved,
    ...payload,
  }));
  mockCreate.mockImplementation(async (payload: Record<string, unknown>) => ({
    ...saved,
    id: "p2",
    ...payload,
  }));
  mockDelete.mockResolvedValue(undefined);
});

describe("CarePreferenceCards", () => {
  it("loads the user's preferences and marks saved dimensions", async () => {
    render(<CarePreferenceCards />);
    expect(await screen.findByTestId("preference-slider-values")).toBeInTheDocument();
    expect(screen.getByTestId("preference-status-values")).toHaveTextContent(
      "Guardado",
    );
    expect(screen.getByTestId("preference-status-music")).toHaveTextContent(
      "Sin guardar",
    );
    expect(mockList).toHaveBeenCalledTimes(1);
  });

  it("updates an existing dimension when the slider is committed", async () => {
    render(<CarePreferenceCards />);
    await screen.findByTestId("preference-slider-values");
    commitSlider("values", 90);
    await waitFor(() =>
      expect(mockUpdate).toHaveBeenCalledWith("p1", { score: 90 }),
    );
  });

  it("creates a new dimension on first commit", async () => {
    render(<CarePreferenceCards />);
    await screen.findByTestId("preference-slider-music");
    commitSlider("music", 70);
    await waitFor(() =>
      expect(mockCreate).toHaveBeenCalledWith({
        dimension: "music",
        score: 70,
      }),
    );
  });

  it("deletes a saved preference", async () => {
    render(<CarePreferenceCards />);
    await screen.findByTestId("preference-delete-values");
    fireEvent.click(screen.getByTestId("preference-delete-values"));
    await waitFor(() => expect(mockDelete).toHaveBeenCalledWith("p1"));
    expect(screen.getByTestId("preference-status-values")).toHaveTextContent(
      "Sin guardar",
    );
  });

  it("keeps the local score and shows the error when saving fails", async () => {
    mockUpdate.mockRejectedValueOnce({ response: { status: 409 } });
    render(<CarePreferenceCards />);
    await screen.findByTestId("preference-slider-values");
    commitSlider("values", 95);
    expect(
      await screen.findByTestId("preference-error-values"),
    ).toHaveTextContent("Ya existe una preferencia para esa dimensión.");
    expect(screen.getByTestId("preference-status-values")).toHaveTextContent(
      "Guardado",
    );
    const input = screen
      .getByTestId("preference-slider-values")
      .querySelector('input[type="range"]') as HTMLInputElement;
    expect(input.value).toBe("95");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run (desde `frontend/`): `npx jest src/components/care/CarePreferenceCards.test.tsx --ci`

Expected: FAIL con `Cannot find module './CarePreferenceCards'`.

- [ ] **Step 3: Implement the component**

`frontend/src/components/care/CarePreferenceCards.tsx`:

```tsx
import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Collapse,
  IconButton,
  Slider,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  CARE_DIMENSIONS,
  type CareDimensionKey,
} from "../../constants/careDimensions";
import {
  createPreference,
  deletePreference,
  listPreferences,
  preferenceErrorMessage,
  updatePreference,
  type CarePreference,
} from "../../services/carePreferencesService";

interface RowState {
  preference: CarePreference | null;
  score: number;
  saving: boolean;
  error: string | null;
}

type RowsState = Record<CareDimensionKey, RowState>;

const emptyRows = (): RowsState =>
  CARE_DIMENSIONS.reduce((acc, dimension) => {
    acc[dimension.key] = {
      preference: null,
      score: 50,
      saving: false,
      error: null,
    };
    return acc;
  }, {} as RowsState);

const rowsFrom = (items: CarePreference[]): RowsState => {
  const rows = emptyRows();
  for (const item of items) {
    if (rows[item.dimension]) {
      rows[item.dimension] = {
        ...rows[item.dimension],
        preference: item,
        score: item.score,
      };
    }
  }
  return rows;
};

export default function CarePreferenceCards() {
  const [expanded, setExpanded] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [rows, setRows] = useState<RowsState>(emptyRows);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const items = await listPreferences();
        if (!cancelled) setRows(rowsFrom(items));
      } catch (error) {
        if (!cancelled) setLoadError(preferenceErrorMessage(error));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const patchRow = (key: CareDimensionKey, patch: Partial<RowState>) => {
    setRows((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));
  };

  const handleCommit = async (key: CareDimensionKey, score: number) => {
    const row = rows[key];
    patchRow(key, { score, saving: true, error: null });
    try {
      const saved = row.preference
        ? await updatePreference(row.preference.id, { score })
        : await createPreference({ dimension: key, score });
      patchRow(key, {
        preference: saved,
        score: saved.score,
        saving: false,
        error: null,
      });
    } catch (error) {
      patchRow(key, {
        saving: false,
        error: preferenceErrorMessage(error),
      });
    }
  };

  const handleDelete = async (key: CareDimensionKey) => {
    const row = rows[key];
    if (!row.preference) return;
    patchRow(key, { saving: true, error: null });
    try {
      await deletePreference(row.preference.id);
      patchRow(key, {
        preference: null,
        score: 50,
        saving: false,
        error: null,
      });
    } catch (error) {
      patchRow(key, {
        saving: false,
        error: preferenceErrorMessage(error),
      });
    }
  };

  return (
    <Card
      data-testid="care-preferences"
      sx={{
        bgcolor: "#1F1F1F",
        color: "#FFFFFF",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "8px",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: 2,
          py: 1.5,
        }}
      >
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            ¿Qué te importa más al elegir alguien?
          </Typography>
          <Typography
            variant="caption"
            sx={{ color: "rgba(255,255,255,0.65)" }}
          >
            Desliza de 0 a 100 para darle importancia a cada dimensión CARE.
          </Typography>
        </Box>
        <IconButton
          data-testid="preferences-toggle"
          aria-label={
            expanded ? "Contraer preferencias" : "Expandir preferencias"
          }
          onClick={() => setExpanded((value) => !value)}
          sx={{ color: "#FFFFFF" }}
        >
          {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
      </Box>
      <Collapse in={expanded}>
        <CardContent sx={{ pt: 0 }}>
          {loadError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {loadError}
            </Alert>
          )}
          {loading ? (
            <Box
              sx={{ display: "flex", justifyContent: "center", py: 3 }}
              data-testid="preferences-loading"
            >
              <CircularProgress size={24} />
            </Box>
          ) : (
            <Stack spacing={2}>
              {CARE_DIMENSIONS.map((dimension) => {
                const row = rows[dimension.key];
                return (
                  <Box key={dimension.key}>
                    <Stack
                      direction="row"
                      spacing={1}
                      sx={{ alignItems: "center" }}
                    >
                      <Chip
                        label={dimension.chip}
                        size="small"
                        sx={{ bgcolor: dimension.color, color: "#fff" }}
                      />
                      <Typography variant="body2" sx={{ flexGrow: 1 }}>
                        {dimension.label}
                      </Typography>
                      <Typography
                        variant="caption"
                        data-testid={`preference-status-${dimension.key}`}
                        sx={{ color: "rgba(255,255,255,0.7)" }}
                      >
                        {row.preference ? "Guardado" : "Sin guardar"}
                      </Typography>
                      {row.saving && (
                        <CircularProgress
                          size={14}
                          data-testid={`preference-saving-${dimension.key}`}
                        />
                      )}
                      <Tooltip title="Quitar preferencia">
                        <span>
                          <IconButton
                            data-testid={`preference-delete-${dimension.key}`}
                            size="small"
                            color="error"
                            disabled={!row.preference || row.saving}
                            onClick={() => handleDelete(dimension.key)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </Stack>
                    <Slider
                      data-testid={`preference-slider-${dimension.key}`}
                      value={row.score}
                      min={0}
                      max={100}
                      step={5}
                      marks={[
                        { value: 0, label: "0" },
                        { value: 50, label: "50" },
                        { value: 100, label: "100" },
                      ]}
                      onChange={(_, value) =>
                        patchRow(dimension.key, { score: value as number })
                      }
                      onChangeCommitted={(_, value) =>
                        handleCommit(dimension.key, value as number)
                      }
                      disabled={row.saving}
                      sx={{
                        color: dimension.color,
                        "& .MuiSlider-markLabel": {
                          color: "rgba(255,255,255,0.5)",
                        },
                      }}
                    />
                    {row.error && (
                      <Typography
                        variant="caption"
                        color="error"
                        data-testid={`preference-error-${dimension.key}`}
                      >
                        {row.error}
                      </Typography>
                    )}
                  </Box>
                );
              })}
            </Stack>
          )}
        </CardContent>
      </Collapse>
    </Card>
  );
}
```

- [ ] **Step 4: Mount it in Discover**

En `frontend/src/pages/discover/index.tsx`, añadir el import junto a los componentes locales:

```tsx
import CarePreferenceCards from "../../components/care/CarePreferenceCards";
```

Dentro del `return`, inmediatamente después de `<Layout>` (línea ~1033), insertar:

```tsx
      <Box
        sx={{
          width: "100%",
          maxWidth: 1120,
          mx: "auto",
          px: { xs: 1, sm: 2 },
          pt: 1,
        }}
      >
        <CarePreferenceCards />
      </Box>
```

No se añade un test de render de la página Discover: es un archivo de 2856 líneas con un grafo de dependencias (Redux, next-i18next, dynamic imports) que haría el test frágil y lento; el componente se prueba aislado y el montaje se valida con `tsc`/`eslint`.

- [ ] **Step 5: Run the component test to verify it passes**

Run (desde `frontend/`): `npx jest src/components/care/CarePreferenceCards.test.tsx --ci`

Expected: `5 passed`.

- [ ] **Step 6: Typecheck and lint**

Run (desde `frontend/`): `npx tsc --noEmit`

Run: `npx eslint src/components/care/CarePreferenceCards.tsx src/components/care/CarePreferenceCards.test.tsx src/pages/discover/index.tsx`

Expected: tsc limpio; eslint 0 errores (warnings preexistentes permitidos).

- [ ] **Step 7: Commit**

```bash
git add frontend/src/components/care/CarePreferenceCards.tsx frontend/src/components/care/CarePreferenceCards.test.tsx frontend/src/pages/discover/index.tsx
git commit -m "feat(care-ui): tarjetas de preferencias en discover"
```

---

### Task 9: Componente de insights

**Files:**
- Create: `frontend/src/components/care/CarePreferenceInsights.tsx`
- Create: `frontend/src/components/care/CarePreferenceInsights.test.tsx`

**Interfaces:**
- Consumes: `PreferenceInsights` (Task 7); `CARE_DIMENSION_BY_KEY`.
- Produces: `CarePreferenceInsights({ insights }: { insights: PreferenceInsights | null })`.

- [ ] **Step 1: Write the failing component test**

Create `frontend/src/components/care/CarePreferenceInsights.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import CarePreferenceInsights from "./CarePreferenceInsights";
import type { PreferenceInsights } from "../../services/carePreferencesAdminService";

const insights: PreferenceInsights = {
  generated_at: "2026-10-19T00:00:00",
  total_records: 3,
  unique_users: 2,
  dimensions: [
    { dimension: "values", count: 2, avg_score: 85.5 },
    { dimension: "music", count: 1, avg_score: 40 },
  ],
  tags: [{ tag: "appearance", count: 2, avg_score: 80 }],
  top_dimensions: [
    { dimension: "values", count: 2, avg_score: 85.5 },
    { dimension: "music", count: 1, avg_score: 40 },
  ],
};

describe("CarePreferenceInsights", () => {
  it("renders the top dimensions with average and count", () => {
    render(<CarePreferenceInsights insights={insights} />);
    expect(screen.getByTestId("preferences-top-values")).toHaveTextContent(
      "Valores",
    );
    expect(screen.getByTestId("preferences-top-values")).toHaveTextContent(
      "85.5 · 2 registros",
    );
    expect(screen.getByTestId("preferences-top-music")).toHaveTextContent(
      "Música",
    );
  });

  it("renders the dimension and tag distributions", () => {
    render(<CarePreferenceInsights insights={insights} />);
    expect(screen.getByTestId("preferences-dimension-values")).toHaveTextContent(
      "2",
    );
    expect(screen.getByTestId("preferences-tag-appearance")).toHaveTextContent(
      "appearance",
    );
  });

  it("shows empty states", () => {
    render(
      <CarePreferenceInsights
        insights={{
          ...insights,
          dimensions: [],
          tags: [],
          top_dimensions: [],
        }}
      />,
    );
    expect(screen.getByTestId("preferences-top-empty")).toHaveTextContent(
      "Aún no hay preferencias registradas.",
    );
    expect(screen.getByTestId("preferences-tags-empty")).toHaveTextContent(
      "Sin tags registrados.",
    );
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run (desde `frontend/`): `npx jest src/components/care/CarePreferenceInsights.test.tsx --ci`

Expected: FAIL con `Cannot find module './CarePreferenceInsights'`.

- [ ] **Step 3: Implement the component**

`frontend/src/components/care/CarePreferenceInsights.tsx`:

```tsx
import {
  Box,
  Grid,
  LinearProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { CARE_DIMENSION_BY_KEY } from "../../constants/careDimensions";
import type { PreferenceInsights } from "../../services/carePreferencesAdminService";

const label = (key: string) => CARE_DIMENSION_BY_KEY[key]?.label ?? key;
const score = (value: number) => value.toFixed(1);

export default function CarePreferenceInsights({
  insights,
}: {
  insights: PreferenceInsights | null;
}) {
  if (!insights) return null;
  const top = insights.top_dimensions ?? [];

  return (
    <Stack spacing={2}>
      <Paper
        variant="outlined"
        sx={{ p: 2.5 }}
        data-testid="preferences-top"
      >
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
          Top 3 dimensiones más valoradas
        </Typography>
        {top.length === 0 ? (
          <Typography
            variant="body2"
            color="text.secondary"
            data-testid="preferences-top-empty"
          >
            Aún no hay preferencias registradas.
          </Typography>
        ) : (
          <Stack spacing={2}>
            {top.map((row) => (
              <Box
                key={row.dimension}
                data-testid={`preferences-top-${row.dimension}`}
              >
                <Stack
                  direction="row"
                  sx={{ justifyContent: "space-between", mb: 0.5 }}
                >
                  <Typography variant="body2">
                    {label(row.dimension)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {score(row.avg_score)} · {row.count}{" "}
                    {row.count === 1 ? "registro" : "registros"}
                  </Typography>
                </Stack>
                <LinearProgress
                  variant="determinate"
                  value={row.avg_score}
                  sx={{ height: 8, borderRadius: "4px" }}
                />
              </Box>
            ))}
          </Stack>
        )}
      </Paper>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper
            variant="outlined"
            sx={{ p: 2.5 }}
            data-testid="preferences-distribution"
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
              Distribución por dimensión
            </Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Dimensión</TableCell>
                  <TableCell align="right">Registros</TableCell>
                  <TableCell align="right">Promedio</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {insights.dimensions.map((row) => (
                  <TableRow
                    key={row.dimension}
                    data-testid={`preferences-dimension-${row.dimension}`}
                  >
                    <TableCell>{label(row.dimension)}</TableCell>
                    <TableCell align="right">{row.count}</TableCell>
                    <TableCell align="right">
                      {score(row.avg_score)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Paper
            variant="outlined"
            sx={{ p: 2.5 }}
            data-testid="preferences-tags"
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
              Tags
            </Typography>
            {insights.tags.length === 0 ? (
              <Typography
                variant="body2"
                color="text.secondary"
                data-testid="preferences-tags-empty"
              >
                Sin tags registrados.
              </Typography>
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Tag</TableCell>
                    <TableCell align="right">Registros</TableCell>
                    <TableCell align="right">Promedio</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {insights.tags.map((row) => (
                    <TableRow
                      key={row.tag}
                      data-testid={`preferences-tag-${row.tag}`}
                    >
                      <TableCell>{row.tag}</TableCell>
                      <TableCell align="right">{row.count}</TableCell>
                      <TableCell align="right">
                        {score(row.avg_score)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Stack>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run (desde `frontend/`): `npx jest src/components/care/CarePreferenceInsights.test.tsx --ci`

Expected: `3 passed`.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/care/CarePreferenceInsights.tsx frontend/src/components/care/CarePreferenceInsights.test.tsx
git commit -m "feat(care-ui): panel de insights de preferencias"
```

---

### Task 10: Interpreter como repositorio de preferencias

**Files:**
- Modify: `frontend/src/pages/portal-redthread/care/interpreter.tsx` (reemplazo completo)
- Modify: `frontend/src/pages/portal-redthread/care/interpreter.test.tsx` (reemplazo completo)
- Modify: `frontend/src/components/layout/AdminSidebar.tsx` (label de la entrada care-interpreter)

**Interfaces:**
- Consumes: servicio admin (Task 7), `CarePreferenceInsights` (Task 9), `downloadJson` de `utils/careInterpreterModel`.
- Produces: página `/portal-redthread/care/interpreter` de solo lectura + export.

- [ ] **Step 1: Write the failing page test (reemplaza el archivo)**

Reemplaza todo `frontend/src/pages/portal-redthread/care/interpreter.test.tsx` con:

```tsx
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import CareInterpreterPage from "./interpreter";
import {
  exportPreferences,
  getPreferenceInsights,
  listAllPreferences,
} from "../../../services/carePreferencesAdminService";
import { downloadJson } from "../../../utils/careInterpreterModel";

jest.mock("../../../components/layout/AdminLayout", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

jest.mock("../../../context/ThemeContext", () => ({
  useAppTheme: () => ({ mode: "light" }),
}));

jest.mock("../../../services/carePreferencesAdminService", () => ({
  getPreferenceInsights: jest.fn(),
  listAllPreferences: jest.fn(),
  exportPreferences: jest.fn(),
}));

jest.mock("../../../utils/careInterpreterModel", () => {
  const actual = jest.requireActual("../../../utils/careInterpreterModel");
  return { ...actual, downloadJson: jest.fn() };
});

const mockInsights = getPreferenceInsights as jest.Mock;
const mockList = listAllPreferences as jest.Mock;
const mockExport = exportPreferences as jest.Mock;
const mockDownload = downloadJson as jest.Mock;

const preference = {
  id: "p1",
  user_id: "u1",
  dimension: "values",
  tag: "appearance",
  score: 80,
  created_at: "2026-10-19T10:00:00",
  updated_at: "2026-10-19T10:00:00",
};

const insights = {
  generated_at: "2026-10-19T00:00:00",
  total_records: 2,
  unique_users: 1,
  dimensions: [{ dimension: "values", count: 2, avg_score: 80 }],
  tags: [{ tag: "appearance", count: 1, avg_score: 80 }],
  top_dimensions: [{ dimension: "values", count: 2, avg_score: 80 }],
};

const dataset = {
  items: [preference],
  total: 2,
  limit: 100,
  offset: 0,
};

const exported = {
  date: "2026-10-19",
  count: 2,
  files: {
    json: "backend/exports/preferences/2026-10-19.json",
    csv: "backend/exports/preferences/2026-10-19.csv",
  },
  records: [preference],
};

beforeEach(() => {
  jest.clearAllMocks();
  mockInsights.mockResolvedValue(insights);
  mockList.mockResolvedValue(dataset);
  mockExport.mockResolvedValue(exported);
  URL.createObjectURL = jest.fn(() => "blob:preferences");
  URL.revokeObjectURL = jest.fn();
});

describe("CareInterpreterPage / load", () => {
  it("shows a loading indicator while the repository loads", () => {
    mockInsights.mockReturnValue(new Promise(() => {}));
    mockList.mockReturnValue(new Promise(() => {}));
    render(<CareInterpreterPage />);
    expect(screen.getByTestId("preferences-loading")).toBeInTheDocument();
  });

  it("renders KPIs, top dimensions and the dataset", async () => {
    render(<CareInterpreterPage />);
    expect(await screen.findByTestId("preferences-total")).toHaveTextContent(
      "2",
    );
    expect(screen.getByTestId("preferences-users")).toHaveTextContent("1");
    expect(screen.getByTestId("preferences-top-values")).toHaveTextContent(
      "Valores",
    );
    expect(screen.getByTestId("preferences-row-p1")).toHaveTextContent(
      "appearance",
    );
  });

  it("surfaces a load error in Spanish", async () => {
    mockInsights.mockRejectedValueOnce(new Error("boom"));
    mockList.mockRejectedValueOnce(new Error("boom"));
    render(<CareInterpreterPage />);
    expect(await screen.findByTestId("preferences-error")).toHaveTextContent(
      "No se pudieron cargar las preferencias.",
    );
  });
});

describe("CareInterpreterPage / filters and export", () => {
  it("reloads the dataset when a dimension filter is selected", async () => {
    render(<CareInterpreterPage />);
    await screen.findByTestId("preferences-dataset");
    fireEvent.mouseDown(screen.getByTestId("preferences-filter"));
    fireEvent.click(screen.getByRole("option", { name: "Valores" }));
    await waitFor(() =>
      expect(mockList).toHaveBeenCalledWith({
        limit: 100,
        dimension: "values",
      }),
    );
  });

  it("downloads the JSON snapshot and shows the export summary", async () => {
    render(<CareInterpreterPage />);
    await screen.findByTestId("preferences-dataset");
    fireEvent.click(screen.getByTestId("preferences-export"));
    await waitFor(() => expect(mockExport).toHaveBeenCalledTimes(1));
    expect(mockDownload).toHaveBeenCalledWith(
      "preferences-2026-10-19.json",
      exported,
    );
    expect(
      await screen.findByTestId("preferences-export-alert"),
    ).toHaveTextContent("2 filas");
  });

  it("shows the empty state when there are no preferences", async () => {
    mockInsights.mockResolvedValue({
      ...insights,
      total_records: 0,
      unique_users: 0,
      dimensions: [],
      tags: [],
      top_dimensions: [],
    });
    mockList.mockResolvedValue({ items: [], total: 0, limit: 100, offset: 0 });
    render(<CareInterpreterPage />);
    expect(await screen.findByTestId("preferences-empty")).toHaveTextContent(
      "Aún no hay preferencias registradas.",
    );
    expect(screen.getByTestId("preferences-top-empty")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run (desde `frontend/`): `npx jest src/pages/portal-redthread/care/interpreter.test.tsx --ci`

Expected: FAIL (la página actual no renderiza `preferences-loading` y llama a `getActiveFormula`).

- [ ] **Step 3: Replace the Interpreter page**

Reemplaza todo `frontend/src/pages/portal-redthread/care/interpreter.tsx` con:

```tsx
import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import PsychologyIcon from "@mui/icons-material/Psychology";
import AdminLayout from "../../../components/layout/AdminLayout";
import CarePreferenceInsights from "../../../components/care/CarePreferenceInsights";
import { useAppTheme } from "../../../context/ThemeContext";
import {
  CARE_DIMENSION_BY_KEY,
  CARE_DIMENSIONS,
  type CareDimensionKey,
} from "../../../constants/careDimensions";
import {
  exportPreferences,
  getPreferenceInsights,
  listAllPreferences,
  type PreferenceExportResult,
  type PreferenceInsights,
  type PreferenceListResponse,
} from "../../../services/carePreferencesAdminService";
import { downloadJson } from "../../../utils/careInterpreterModel";

const dateLabel = (value: string) => {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "—" : parsed.toLocaleString("es-MX");
};

export default function CareInterpreterPage() {
  const { mode } = useAppTheme();
  const isDark = mode === "dark";
  const [insights, setInsights] = useState<PreferenceInsights | null>(null);
  const [dataset, setDataset] = useState<PreferenceListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dimension, setDimension] = useState<CareDimensionKey | "">("");
  const [limit, setLimit] = useState(100);
  const [exporting, setExporting] = useState(false);
  const [exportResult, setExportResult] = useState<PreferenceExportResult | null>(
    null,
  );
  const [exportError, setExportError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [nextInsights, nextDataset] = await Promise.all([
          getPreferenceInsights(),
          listAllPreferences(
            dimension ? { limit, dimension } : { limit },
          ),
        ]);
        if (!cancelled) {
          setInsights(nextInsights);
          setDataset(nextDataset);
        }
      } catch {
        if (!cancelled) setError("No se pudieron cargar las preferencias.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [dimension, limit]);

  const handleExport = async () => {
    setExporting(true);
    setExportError(null);
    try {
      const result = await exportPreferences();
      setExportResult(result);
      downloadJson(`preferences-${result.date}.json`, result);
    } catch {
      setExportError("No se pudo exportar el dataset.");
    } finally {
      setExporting(false);
    }
  };

  const rows = dataset?.items ?? [];

  return (
    <AdminLayout>
      <Container maxWidth="xl">
        <Box sx={{ py: 4 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 3,
              gap: 2,
              flexWrap: "wrap",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Box
                sx={{
                  bgcolor: "primary.main",
                  p: 1.5,
                  borderRadius: "8px",
                  display: "flex",
                  mr: 2,
                  boxShadow: "0 4px 12px rgba(255,77,79,0.3)",
                }}
              >
                <PsychologyIcon sx={{ fontSize: 32, color: "white" }} />
              </Box>
              <Box>
                <Typography
                  variant="h4"
                  sx={{ fontWeight: 800, letterSpacing: "-0.5px" }}
                >
                  Preferencias & Insights
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: isDark ? "#CCCCCC" : "#666666" }}
                >
                  Repositorio de lo que los usuarios valoran y dataset para IA.
                </Typography>
              </Box>
            </Box>
            <Button
              data-testid="preferences-export"
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={handleExport}
              disabled={exporting}
            >
              {exporting ? "Exportando..." : "Exportar dataset"}
            </Button>
          </Box>

          {exportResult && (
            <Alert
              severity="success"
              sx={{ mb: 2, wordBreak: "break-all" }}
              data-testid="preferences-export-alert"
            >
              {exportResult.count} filas exportadas. JSON:{" "}
              {exportResult.files.json} · CSV: {exportResult.files.csv}
            </Alert>
          )}
          {exportError && (
            <Alert
              severity="error"
              sx={{ mb: 2 }}
              data-testid="preferences-export-error"
            >
              {exportError}
            </Alert>
          )}

          {loading ? (
            <Box
              sx={{ display: "flex", justifyContent: "center", py: 8 }}
              data-testid="preferences-loading"
            >
              <CircularProgress />
            </Box>
          ) : error ? (
            <Alert severity="error" data-testid="preferences-error">
              {error}
            </Alert>
          ) : (
            <Stack spacing={3}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Paper variant="outlined" sx={{ p: 2.5 }}>
                    <Typography variant="overline" color="text.secondary">
                      Registros
                    </Typography>
                    <Typography
                      variant="h4"
                      sx={{ fontWeight: 800 }}
                      data-testid="preferences-total"
                    >
                      {insights?.total_records ?? 0}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Paper variant="outlined" sx={{ p: 2.5 }}>
                    <Typography variant="overline" color="text.secondary">
                      Usuarios únicos
                    </Typography>
                    <Typography
                      variant="h4"
                      sx={{ fontWeight: 800 }}
                      data-testid="preferences-users"
                    >
                      {insights?.unique_users ?? 0}
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>

              <CarePreferenceInsights insights={insights} />

              <Paper variant="outlined">
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={2}
                  sx={{ p: 2, alignItems: { sm: "center" } }}
                >
                  <FormControl size="small" sx={{ minWidth: 220 }}>
                    <InputLabel id="preferences-dimension-label">
                      Dimensión
                    </InputLabel>
                    <Select
                      labelId="preferences-dimension-label"
                      label="Dimensión"
                      data-testid="preferences-filter"
                      value={dimension}
                      onChange={(event) =>
                        setDimension(event.target.value as CareDimensionKey | "")
                      }
                    >
                      <MenuItem value="">Todas</MenuItem>
                      {CARE_DIMENSIONS.map((item) => (
                        <MenuItem key={item.key} value={item.key}>
                          {item.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl size="small" sx={{ minWidth: 140 }}>
                    <InputLabel id="preferences-limit-label">Límite</InputLabel>
                    <Select
                      labelId="preferences-limit-label"
                      label="Límite"
                      data-testid="preferences-limit"
                      value={limit}
                      onChange={(event) =>
                        setLimit(Number(event.target.value))
                      }
                    >
                      {[50, 100, 200].map((value) => (
                        <MenuItem key={value} value={value}>
                          {value}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <Typography variant="body2" color="text.secondary">
                    {dataset?.total ?? 0} registros en total
                  </Typography>
                </Stack>

                {rows.length === 0 ? (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ p: 3 }}
                    data-testid="preferences-empty"
                  >
                    Aún no hay preferencias registradas.
                  </Typography>
                ) : (
                  <Table size="small" data-testid="preferences-dataset">
                    <TableHead>
                      <TableRow>
                        <TableCell>Usuario</TableCell>
                        <TableCell>Dimensión</TableCell>
                        <TableCell>Tag</TableCell>
                        <TableCell align="right">Score</TableCell>
                        <TableCell align="right">Actualizado</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {rows.map((row) => (
                        <TableRow
                          key={row.id}
                          data-testid={`preferences-row-${row.id}`}
                        >
                          <TableCell sx={{ fontFamily: "monospace" }}>
                            {row.user_id}
                          </TableCell>
                          <TableCell>
                            {CARE_DIMENSION_BY_KEY[row.dimension]?.label ??
                              row.dimension}
                          </TableCell>
                          <TableCell>{row.tag ?? "—"}</TableCell>
                          <TableCell align="right">{row.score}</TableCell>
                          <TableCell align="right">
                            {dateLabel(row.updated_at)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </Paper>
            </Stack>
          )}
        </Box>
      </Container>
    </AdminLayout>
  );
}
```

- [ ] **Step 4: Rename the sidebar entry**

En `frontend/src/components/layout/AdminSidebar.tsx`, cambiar:

```tsx
          label: "CARE Interpreter",
```

por:

```tsx
          label: "Preferencias & Insights",
```

- [ ] **Step 5: Run the page test to verify it passes**

Run (desde `frontend/`): `npx jest src/pages/portal-redthread/care/interpreter.test.tsx --ci`

Expected: `6 passed`.

- [ ] **Step 6: Typecheck and lint**

Run (desde `frontend/`): `npx tsc --noEmit`

Run: `npx eslint src/pages/portal-redthread/care/interpreter.tsx src/pages/portal-redthread/care/interpreter.test.tsx src/components/care/CarePreferenceInsights.tsx src/components/layout/AdminSidebar.tsx`

Expected: tsc limpio; eslint 0 errores.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/pages/portal-redthread/care/interpreter.tsx frontend/src/pages/portal-redthread/care/interpreter.test.tsx frontend/src/components/layout/AdminSidebar.tsx
git commit -m "feat(care-ui): interpreter como repositorio de preferencias"
```

---

### Task 11: Quitar la vista previa A/B de Equation

**Files:**
- Modify: `frontend/src/pages/portal-redthread/care/equation.tsx`
- Modify: `frontend/src/pages/portal-redthread/care/equation.test.tsx`

**Interfaces:**
- Consumes: nada nuevo.
- Produces: Equation sin `CarePreviewPanel`, sin estado/handlers de preview; KPIs, matriz, tabla, perfiles y guardar intactos.

- [ ] **Step 1: Update the test first (remove preview coverage)**

En `frontend/src/pages/portal-redthread/care/equation.test.tsx`:

1. Eliminar `previewFormula,` del import de `careFormulaService` (línea ~13).
2. Eliminar el bloque `jest.mock("../../../components/common/UserSearchAutocomplete", ...)` completo (líneas ~49–113).
3. Eliminar `previewFormula: jest.fn(),` del mock de `careFormulaService` (línea ~390).
4. Eliminar `const mockPreview = previewFormula as jest.Mock;` (línea ~408).
5. Eliminar `previewEvaluation`, `mockPreviewResult` y sus datos (líneas ~464–502).
6. Eliminar el describe completo `"CareEquationPage / vista previa (buscador A/B)"` (líneas ~983–1042).
7. Añadir al final del archivo:

```tsx
describe("CareEquationPage / preview removal", () => {
  it("does not render the old A/B preview anymore", async () => {
    renderWithTheme(<CareEquationPage />);
    await screen.findByTestId("header-stub");
    expect(screen.queryByTestId("preview-run")).not.toBeInTheDocument();
    expect(screen.queryByText("Interpretar par")).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run (desde `frontend/`): `npx jest src/pages/portal-redthread/care/equation.test.tsx --ci`

Expected: FAIL en el nuevo test porque `preview-run` todavía existe.

- [ ] **Step 3: Remove the preview from the page**

En `frontend/src/pages/portal-redthread/care/equation.tsx`:

1. Eliminar el import de `CarePreviewPanel` (línea 43).
2. Eliminar el import de tipo `SearchUser` (línea 46).
3. Eliminar `previewFormula,` del import de `careFormulaService` (línea 52).
4. Eliminar los tipos `NarrativeResult` y `PreviewResult` del import (líneas 59–60).
5. Eliminar `previewErrorMessage,` del import de `careEditorModel`/`careEquationModel` (línea 86).
6. Eliminar el bloque de estado (líneas 145–153):

```tsx
  const [previewUserA, setPreviewUserA] = useState<SearchUser | null>(null);
  const [previewUserB, setPreviewUserB] = useState<SearchUser | null>(null);
  const [previewTone, setPreviewTone] =
    useState<NarrativeResult["tone"]>("directo");
  const [previewResult, setPreviewResult] = useState<PreviewResult | null>(
    null,
  );
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
```

7. Eliminar el handler `handlePreview` completo (líneas 440–463).
8. Eliminar el JSX del panel (líneas 859–872):

```tsx
                  {/* Buscador de usuario A/B + preview (Interpreter) */}
                  <CarePreviewPanel
                    userA={previewUserA}
                    userB={previewUserB}
                    tone={previewTone}
                    result={previewResult}
                    isDark={isDark}
                    loading={previewLoading}
                    error={previewError}
                    onUserAChange={setPreviewUserA}
                    onUserBChange={setPreviewUserB}
                    onToneChange={setPreviewTone}
                    onRun={handlePreview}
                  />
```

9. Actualizar el comentario de la fila principal (línea 757) a:

```tsx
              {/* Fila principal: diagrama | pesos + acciones */}
```

No tocar el Paper estático “VISTA PREVIA DE FÓRMULA” (es una leyenda de los pesos, no el panel A/B). No tocar `PlayArrowIcon` (se usa en otra acción).

- [ ] **Step 4: Run the page tests to verify they pass**

Run (desde `frontend/`): `npx jest src/pages/portal-redthread/care/equation.test.tsx --ci`

Expected: PASS (todos los tests restantes, incluido el de regresión).

- [ ] **Step 5: Typecheck and lint**

Run (desde `frontend/`): `npx tsc --noEmit`

Run: `npx eslint src/pages/portal-redthread/care/equation.tsx src/pages/portal-redthread/care/equation.test.tsx`

Expected: tsc limpio; eslint 0 errores.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/pages/portal-redthread/care/equation.tsx frontend/src/pages/portal-redthread/care/equation.test.tsx
git commit -m "refactor(care-ui): quitar vista previa A/B de equation"
```

---

### Task 12: Flujo de integración y verificación completa

**Files:**
- Create: `backend/src/care/tests/test_preferences_flow.py`
- Test: suite completa backend + frontend

**Interfaces:**
- Consumes: todo lo anterior.
- Produces: evidencia de que crear → exportar produce archivos válidos y que el repo queda verde (salvo el fallo preexistente conocido).

- [ ] **Step 1: Write the integration test**

Create `backend/src/care/tests/test_preferences_flow.py`:

```python
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
```

- [ ] **Step 2: Run the integration test**

Run (desde `backend/`): `& "venv\Scripts\python.exe" -m pytest src/care/tests/test_preferences_flow.py -q`

Expected: PASS. El código de producción ya existe; si falla, ajustar solo mocks del test, nunca el comportamiento.

- [ ] **Step 3: Run the targeted backend suites**

Run (desde `backend/`):
`& "venv\Scripts\python.exe" -m pytest src/care/tests/test_care_preferences.py src/care/tests/test_preferences_export.py src/care/tests/test_preferences_flow.py -q`

Expected: todos en PASS.

- [ ] **Step 4: Run the full backend suite**

Run (desde `backend/`): `& "venv\Scripts\python.exe" -m pytest src/care/tests -q`

Expected: todos en PASS excepto el fallo preexistente
`src/care/tests/test_phase2.py::test_dynamic_score_with_tag_affinity`
(`assert 0.41333 > 0.5`). No corregirlo en este plan.

- [ ] **Step 5: Run flake8 on the touched backend files**

Run (desde `backend/`):
`& "venv\Scripts\python.exe" -m flake8 src/care/preferences src/care/models/care_user_preference.py src/care/models/care_dimension_map.py src/api/preferences.py src/api/admin_preferences.py src/core/seed.py src/core/database.py src/care/tests/test_care_preferences.py src/care/tests/test_preferences_export.py src/care/tests/test_preferences_flow.py`

Expected: sin salida.

- [ ] **Step 6: Run frontend typecheck, lint and full test suite**

Run (desde `frontend/`): `npx tsc --noEmit`

Run:
`npx eslint src/services/carePreferencesService.ts src/services/carePreferencesService.test.ts src/services/carePreferencesAdminService.ts src/services/carePreferencesAdminService.test.ts src/components/care/CarePreferenceCards.tsx src/components/care/CarePreferenceCards.test.tsx src/components/care/CarePreferenceInsights.tsx src/components/care/CarePreferenceInsights.test.tsx src/pages/discover/index.tsx src/pages/portal-redthread/care/interpreter.tsx src/pages/portal-redthread/care/interpreter.test.tsx src/pages/portal-redthread/care/equation.tsx src/pages/portal-redthread/care/equation.test.tsx src/components/layout/AdminSidebar.tsx`

Run: `npx jest --ci`

Expected: tsc limpio; eslint 0 errores (warnings preexistentes permitidos); jest todas las suites en verde (baseline previa: 71 suites / 659 tests; se esperan ~76 suites / ~700 tests).

- [ ] **Step 7: Verify export artifacts are ignored**

Run (desde la raíz): `git check-ignore -v backend/exports/preferences/2026-10-19.json`

Expected: muestra la regla `backend/exports/`.

- [ ] **Step 8: Commit**

```bash
git add backend/src/care/tests/test_preferences_flow.py
git commit -m "test(care): flujo integral de preferencias y verificacion"
```

---

## Self-Review

- **Spec coverage:** colecciones + índices (Task 1), validaciones/CRUD/ownership (Task 2), listado/insights (Task 3), export CLI ± botón (Tasks 4, 5, 10), endpoints usuario/admin (Task 5), servicios frontend (Tasks 6–7), Discover (Task 8), Interpreter (Tasks 9–10), Equation limpio (Task 11), tests backend/frontend/flujo (Tasks 1–12), seguridad y errores (Tasks 2–5).
- **Sin placeholders:** todos los pasos incluyen código o comandos exactos.
- **Consistencia de tipos:** `CarePreference` (usuario) se reutiliza en admin; `PreferenceInsights` lo consumen Task 9 y 10; `build_export` devuelve `records` que la página descarga; nombres de rutas y testids coinciden entre componentes y tests.
- **Desviación documentada:** no hay test de render de la página Discover (grafo de 2856 líneas); se compensa con test del componente + tsc/eslint.
- **Riesgo conocido:** el test de slider dispara `change` sobre el input range oculto de MUI, que ejecuta `onChangeCommitted` en la misma secuencia; si una versión futura lo separa, usar `fireEvent.pointerUp(document)` (no cambiar el comportamiento del componente).

