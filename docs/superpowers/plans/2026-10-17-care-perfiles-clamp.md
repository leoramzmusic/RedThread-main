# CARE Perfiles + Clamp 100% Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add named CARE formula profiles (4 frontend presets + admin-saved profiles persisted in a new backend `care_profiles` collection), rename the editor actions (`Normalizar` → `Reestablecer` = load Default profile, `Aplicar Cambios` → `Guardar`), and clamp slider edits so the Σ of weights can never exceed 100% (with a transient "Límite 100%" badge).

**Architecture:** Three layers. (1) Backend: a new Beanie document `CAREProfile` (name + blocks + chaos_factor), a `src/care/profiles/service.py` with 4 CRUD helpers reusing `validate_formula_dict`, and 4 endpoints on the existing `admin_algorithms` router at `/formula/profiles`. (2) Frontend shared layer: `careProfileService.ts` (typed axios wrapper, same pattern as `careFormulaService`), `careProfileModel.ts` (frontend preset constants + pure helpers: `toProfileView`, `applyProfileToDraft`, `profileMatchesDraft`, `profileErrorMessage`), and `clampBlockPercent` added to `careCriteriaModel.ts`. (3) UI: a new presentational `CareProfilesPanel` (grouped Select + 3 icon actions) and the `equation.tsx` container wiring (state, dialogs, clamp, renamed buttons). `CareCriteriaTable` stays dumb — the clamp lives in the container.

**Tech Stack:** FastAPI + Beanie + Motor (backend), Next.js Pages Router + React 19 + MUI + TypeScript + Jest/@testing-library (frontend).

**Spec:** `docs/superpowers/specs/2026-10-17-care-perfiles-clamp-design.md` (source of truth for decisions 1–12; approved verbatim by the user).

## Global Constraints

- **No new dependencies.** Backend uses only FastAPI/Beanie/Pydantic/Motor; frontend only existing React/MUI/jest packages. Do not touch `package.json` or requirements files.
- **Admin copy is hardcoded Spanish.** Never call `t()` on these pages; never add i18n keys.
- **API access only via services.** Pages/components import `careProfileService`; the service imports the named `adminApiClient` from `frontend/src/services/api.ts`. Never import axios directly into a page.
- **MUI gotcha:** this repo rejects numeric `borderRadius` in `sx` — use px strings (`borderRadius: "8px"`).
- **Do not modify** `CareCriteriaTable.tsx` (stays presentational/dumb) nor its tests. Do not remove `normalizeFormulaBlocks` usage from slider-commit and save flows.
- **Profile = `blocks` + `chaos_factor` only.** Seeds, thresholds, and locked dims are NOT part of a profile. Loading a profile overwrites every block (including locked ones); lock flags stay as-is (they keep restricting manual edits).
- **Known semantics:** backend `PUT` never returns 409 on "no changes" (that's only versions via `/formula/save`); 409 is reserved for duplicate name. Slider commit still normalizes to exactly 100% via `/formula/normalizar` (unchanged).
- **UI interpretation (approved in design):** `Guardar como perfil…` (`profile-save-as`) is enabled whenever a draft exists (it creates a NEW profile; usable from the "Personalizado" state). `Actualizar perfil` / `Eliminar perfil` are only enabled for a selected non-builtin profile.
- **Verification commands** (frontend from `frontend/`):
  - Single suite: `npx jest src/<path> --ci`
  - Full suite: `npx jest --ci` (baseline: 68 suites / 624 tests green)
  - Typecheck: `npx tsc --noEmit`
  - Lint (touched files): `npx eslint src/services/careProfileService.ts src/utils/careProfileModel.ts src/utils/careCriteriaModel.ts src/components/care/CareProfilesPanel.tsx src/pages/portal-redthread/care/equation.tsx`
  - Backend (from `backend/`): `& "venv\Scripts\python.exe" -m pytest src/care/tests -q` and `& "venv\Scripts\python.exe" -m flake8 src/care/profiles src/care/models/care_profile.py src/api/admin_algorithms.py`
- **Commits:** local `git commit` after each task is allowed; **never push** without the user saying "sube".
- **eslint preexisting noise:** `require()` inside `jest.mock` factories is expected and accepted.

---

## Contracts (fixed; write these shapes exactly)

`GET /portal-redthread/experiencia/algoritmos/formula/profiles` → `200 [Profile]` sorted by `name` asc.

`POST .../formula/profiles` body `{name, blocks, chaos_factor}` → `201 Profile` | `422 {detail: [errores]}` | `409 {detail: "Ya existe un perfil con ese nombre."}`.

`PUT .../formula/profiles/{id}` body partial `{name?, blocks?, chaos_factor?}` → `200 Profile` | `404 {detail: "Perfil no encontrado."}` | `409` | `422`.

`DELETE .../formula/profiles/{id}` → `200 {"ok": true}` | `404`.

`Profile` JSON (Beanie `model_dump(mode="json")`): `{id, name, blocks, chaos_factor, created_by, created_at, updated_at}` — `id` is `str(_id)`, dates ISO strings.

Frontend presets (exact weights; each sums to 1.0 exactly; ids fixed):

| id | name | values | goals | neuro | resp | music | love | comm | chaos |
|---|---|---|---|---|---|---|---|---|---|
| `builtin:default` | Default | .36 | .18 | .15 | .10 | .11 | .06 | .04 | 0.0 |
| `builtin:neurodiversity` | Neurodiversidad Boost | .32 | .16 | .22 | .09 | .10 | .06 | .05 | 0.0 |
| `builtin:balance` | Balance Relacional | .30 | .20 | .13 | .11 | .09 | .09 | .08 | 0.0 |
| `builtin:lowchaos` | Caos Reducido | .36 | .18 | .15 | .10 | .11 | .06 | .04 | 1.0 |

---

## Task 1: Backend — `CAREProfile` model + registration

**Files:**
- Create: `backend/src/care/models/care_profile.py`
- Create: `backend/src/care/profiles/__init__.py` (empty, mirrors `backend/src/care/formula/__init__.py`)
- Modify: `backend/src/core/database.py` (import near line 32, doc list near line 85)

- [ ] **Step 1: Create the model**

```python
"""Named CARE formula profile (weights + chaos) saved by an admin."""
from datetime import datetime
from beanie import Document
from pydantic import Field
from pymongo import ASCENDING, IndexModel


class CAREProfile(Document):
    """A reusable formula preset: same 7 canonical blocks + chaos factor."""

    name: str
    blocks: dict  # exactly the 7 canonical keys, values 0-1, sum 1.0
    chaos_factor: float = 0.0  # 0-20 (%)
    created_by: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "care_profiles"
        indexes = [IndexModel([("name", ASCENDING)], unique=True)]
```

- [ ] **Step 2: Register in Beanie**

In `backend/src/core/database.py`:
- after `from src.care.models.care_formula import CAREFormula` add:
  ```python
  from src.care.models.care_profile import CAREProfile
  ```
- in the `document_models=[...]` list, right after `CAREFormula,` add:
  ```python
  CAREProfile,
  ```

- [ ] **Step 3: Verify import + lint**

Run (from `backend/`):
`& "venv\Scripts\python.exe" -c "from src.care.models.care_profile import CAREProfile; print(CAREProfile.Settings.name)"`
Expected: `care_profiles`
`& "venv\Scripts\python.exe" -m flake8 src/care/models/care_profile.py`
Expected: no output.

- [ ] **Step 4: Commit**

```bash
git add backend/src/care/models/care_profile.py backend/src/care/profiles/__init__.py backend/src/core/database.py
git commit -m "feat(care): modelo CAREProfile y registro en beanie"
```

---

## Task 2: Backend — profiles service (TDD)

**Files:**
- Create: `backend/src/care/profiles/service.py`
- Create: `backend/src/care/tests/test_care_profiles.py`

**Interfaces (consumed by Task 3):**
- `list_profiles() -> List[CAREProfile]`
- `create_profile(name, blocks, chaos_factor=0.0, admin_id="system") -> CAREProfile`
- `update_profile(profile_id, name=None, blocks=None, chaos_factor=None) -> CAREProfile`
- `delete_profile(profile_id) -> None`
- Errors: `ProfileNameError`, `ProfileDuplicateError` (both `ValueError`), `FormulaValidationError` (reused from formula service), `LookupError` for missing/invalid id.

- [ ] **Step 1: Write the failing tests**

Create `backend/src/care/tests/test_care_profiles.py` (patterns copied from `test_formula_service_db.py` + `test_formula_endpoints.py`):

```python
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
```

- [ ] **Step 2: Run tests — expect failure**

From `backend/`:
`& "venv\Scripts\python.exe" -m pytest src/care/tests/test_care_profiles.py -q`
Expected: collection errors (`ModuleNotFoundError: src.care.profiles.service` and missing `api.list_formula_profiles`).

- [ ] **Step 3: Implement the service**

Create `backend/src/care/profiles/service.py`:

```python
"""Named CARE formula profiles: CRUD over the `care_profiles` collection."""
from datetime import datetime
from typing import Any, Dict, List, Optional

from beanie import PydanticObjectId

from src.care.formula.service import FormulaValidationError, validate_formula_dict
from src.care.models.care_profile import CAREProfile

_NAME_MIN, _NAME_MAX = 1, 60


class ProfileNameError(ValueError):
    """Invalid (missing / empty / too long) profile name."""


class ProfileDuplicateError(ValueError):
    """Another profile already uses the requested name."""


def _clean_name(name: Any) -> str:
    if not isinstance(name, str):
        raise ProfileNameError("El nombre es requerido.")
    cleaned = name.strip()
    if not (_NAME_MIN <= len(cleaned) <= _NAME_MAX):
        raise ProfileNameError("El nombre debe tener entre 1 y 60 caracteres.")
    return cleaned


def _validate_payload(blocks: Any, chaos_factor: Any) -> None:
    errors = validate_formula_dict({"blocks": blocks, "chaos_factor": chaos_factor})
    if errors:
        raise FormulaValidationError(errors)


def _object_id(profile_id: str) -> Optional[PydanticObjectId]:
    try:
        return PydanticObjectId(profile_id)
    except Exception:
        return None


async def _get_or_raise(profile_id: str) -> CAREProfile:
    object_id = _object_id(profile_id)
    profile = await CAREProfile.get(object_id) if object_id else None
    if profile is None:
        raise LookupError("Perfil no encontrado.")
    return profile


async def list_profiles() -> List[CAREProfile]:
    return await CAREProfile.find_all().sort(+CAREProfile.name).to_list()


async def create_profile(
    name: Any, blocks: Any, chaos_factor: float = 0.0, admin_id: str = "system"
) -> CAREProfile:
    cleaned = _clean_name(name)
    _validate_payload(blocks, chaos_factor)
    existing = await CAREProfile.find_one(CAREProfile.name == cleaned)
    if existing is not None:
        raise ProfileDuplicateError("Ya existe un perfil con ese nombre.")
    now = datetime.utcnow()
    profile = CAREProfile(
        name=cleaned,
        blocks=dict(blocks),
        chaos_factor=float(chaos_factor),
        created_by=admin_id,
        created_at=now,
        updated_at=now,
    )
    await profile.insert()
    return profile


async def update_profile(
    profile_id: str,
    name: Optional[str] = None,
    blocks: Optional[Dict[str, float]] = None,
    chaos_factor: Optional[float] = None,
) -> CAREProfile:
    profile = await _get_or_raise(profile_id)
    if name is not None:
        cleaned = _clean_name(name)
        existing = await CAREProfile.find_one(CAREProfile.name == cleaned)
        if existing is not None and str(existing.id) != profile_id:
            raise ProfileDuplicateError("Ya existe un perfil con ese nombre.")
        profile.name = cleaned
    if blocks is not None or chaos_factor is not None:
        next_blocks = blocks if blocks is not None else profile.blocks
        next_chaos = (
            chaos_factor if chaos_factor is not None else profile.chaos_factor
        )
        _validate_payload(next_blocks, next_chaos)
        profile.blocks = dict(next_blocks)
        profile.chaos_factor = float(next_chaos)
    profile.updated_at = datetime.utcnow()
    await profile.save()
    return profile


async def delete_profile(profile_id: str) -> None:
    profile = await _get_or_raise(profile_id)
    await profile.delete()
```

- [ ] **Step 4: Run the service tests**

`& "venv\Scripts\python.exe" -m pytest src/care/tests/test_care_profiles.py -q -k "not endpoint"`
Expected: service tests pass; the endpoint tests will still fail until Task 3 wires `api.profile_service` / `api.list_formula_profiles`.

- [ ] **Step 5: Commit**

```bash
git add backend/src/care/profiles/service.py backend/src/care/tests/test_care_profiles.py
git commit -m "feat(care): servicio CRUD de perfiles de formula"
```

---

## Task 3: Backend — profiles endpoints

**Files:**
- Modify: `backend/src/api/admin_algorithms.py` (import near line 18; endpoints appended after `normalize_formula_blocks`, currently line 443)

- [ ] **Step 1: Add the service import**

After `from src.care.formula import service as formula_service` (line 18) add:

```python
from src.care.profiles import service as profile_service
```

- [ ] **Step 2: Add the 4 endpoints**

Append at the end of `admin_algorithms.py` (after the `normalize_formula_blocks` handler):

```python
# --- CARE formula profiles (saved presets) ---


@router.get("/formula/profiles")
async def list_formula_profiles(admin: Employee = Depends(admin_required)):
    profiles = await profile_service.list_profiles()
    return [profile.model_dump(mode="json") for profile in profiles]


@router.post("/formula/profiles", status_code=201)
async def create_formula_profile(
    body: Dict[str, Any], admin: Employee = Depends(admin_required)
):
    try:
        profile = await profile_service.create_profile(
            body.get("name"),
            body.get("blocks"),
            body.get("chaos_factor", 0.0),
            str(admin.id),
        )
    except profile_service.ProfileNameError as exc:
        raise HTTPException(status_code=422, detail=[str(exc)])
    except profile_service.ProfileDuplicateError as exc:
        raise HTTPException(status_code=409, detail=str(exc))
    except FormulaValidationError as exc:
        raise HTTPException(status_code=422, detail=exc.errors)
    return profile.model_dump(mode="json")


@router.put("/formula/profiles/{profile_id}")
async def update_formula_profile(
    profile_id: str,
    body: Dict[str, Any],
    admin: Employee = Depends(admin_required),
):
    try:
        profile = await profile_service.update_profile(
            profile_id,
            name=body.get("name"),
            blocks=body.get("blocks"),
            chaos_factor=body.get("chaos_factor"),
        )
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except profile_service.ProfileNameError as exc:
        raise HTTPException(status_code=422, detail=[str(exc)])
    except profile_service.ProfileDuplicateError as exc:
        raise HTTPException(status_code=409, detail=str(exc))
    except FormulaValidationError as exc:
        raise HTTPException(status_code=422, detail=exc.errors)
    return profile.model_dump(mode="json")


@router.delete("/formula/profiles/{profile_id}")
async def delete_formula_profile(
    profile_id: str, admin: Employee = Depends(admin_required)
):
    try:
        await profile_service.delete_profile(profile_id)
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    return {"ok": True}
```

- [ ] **Step 3: Run the profiles test file — expect fully green**

`& "venv\Scripts\python.exe" -m pytest src/care/tests/test_care_profiles.py -q`
Expected: all green.

- [ ] **Step 4: Full CARE suite + flake8 (regression)**

`& "venv\Scripts\python.exe" -m pytest src/care/tests -q`
Expected: all green (no regressions in the formula endpoint tests).
`& "venv\Scripts\python.exe" -m flake8 src/care/profiles src/api/admin_algorithms.py`
Expected: no output.

- [ ] **Step 5: Commit**

```bash
git add backend/src/api/admin_algorithms.py
git commit -m "feat(care): endpoints CRUD de perfiles en el router admin"
```

---

## Task 4: Frontend — `careProfileService.ts` (TDD)

**Files:**
- Create: `frontend/src/services/careProfileService.ts`
- Create: `frontend/src/services/careProfileService.test.ts`

- [ ] **Step 1: Write the failing test**

Create `frontend/src/services/careProfileService.test.ts` (mirror `careFormulaService.test.ts`):

```ts
import { adminApiClient } from "./api";
import {
  createProfile,
  deleteProfile,
  listProfiles,
  updateProfile,
  type CareProfile,
} from "./careProfileService";

jest.mock("./api", () => ({
  adminApiClient: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

const mockGet = adminApiClient.get as jest.Mock;
const mockPost = adminApiClient.post as jest.Mock;
const mockPut = adminApiClient.put as jest.Mock;
const mockDelete = adminApiClient.delete as jest.Mock;

const BASE = "/portal-redthread/experiencia/algoritmos/formula/profiles";

const profile: CareProfile = {
  id: "p1",
  name: "Mi perfil",
  blocks: { values: 0.36 },
  chaos_factor: 0,
  created_by: "emp1",
  created_at: "2026-10-17T00:00:00",
  updated_at: "2026-10-17T00:00:00",
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe("careProfileService", () => {
  it("listProfiles GETs the collection", async () => {
    mockGet.mockResolvedValueOnce({ data: [profile] });
    await expect(listProfiles()).resolves.toEqual([profile]);
    expect(mockGet).toHaveBeenCalledWith(BASE);
  });

  it("createProfile POSTs the payload", async () => {
    mockPost.mockResolvedValueOnce({ data: profile });
    const payload = { name: "Mi perfil", blocks: { values: 0.36 }, chaos_factor: 0 };
    await expect(createProfile(payload)).resolves.toEqual(profile);
    expect(mockPost).toHaveBeenCalledWith(BASE, payload);
  });

  it("updateProfile PUTs a partial payload to the id", async () => {
    mockPut.mockResolvedValueOnce({ data: profile });
    await updateProfile("p1", { chaos_factor: 2 });
    expect(mockPut).toHaveBeenCalledWith(`${BASE}/p1`, { chaos_factor: 2 });
  });

  it("deleteProfile DELETEs the id", async () => {
    mockDelete.mockResolvedValueOnce({ data: { ok: true } });
    await deleteProfile("p1");
    expect(mockDelete).toHaveBeenCalledWith(`${BASE}/p1`);
  });
});
```

- [ ] **Step 2: Run — expect failure**

From `frontend/`: `npx jest src/services/careProfileService.test.ts --ci`
Expected: fails (module not found).

- [ ] **Step 3: Implement**

Create `frontend/src/services/careProfileService.ts`:

```ts
import { adminApiClient } from "./api";
import type { FormulaBlocks } from "./careFormulaService";

/**
 * Typed wrapper over the CARE formula profile endpoints.
 * Auth/session is handled by adminApiClient (services/api.ts).
 * Backend router prefix: /portal-redthread/experiencia/algoritmos
 */

const BASE = "/portal-redthread/experiencia/algoritmos/formula/profiles";

/** A saved profile document as returned by the backend. */
export interface CareProfile {
  id: string;
  name: string;
  blocks: FormulaBlocks;
  chaos_factor: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ProfilePayload {
  name: string;
  blocks: FormulaBlocks;
  chaos_factor: number;
}

export async function listProfiles(): Promise<CareProfile[]> {
  const { data } = await adminApiClient.get(BASE);
  return data as CareProfile[];
}

export async function createProfile(
  payload: ProfilePayload,
): Promise<CareProfile> {
  const { data } = await adminApiClient.post(BASE, payload);
  return data as CareProfile;
}

export async function updateProfile(
  id: string,
  payload: Partial<ProfilePayload>,
): Promise<CareProfile> {
  const { data } = await adminApiClient.put(`${BASE}/${id}`, payload);
  return data as CareProfile;
}

export async function deleteProfile(id: string): Promise<void> {
  await adminApiClient.delete(`${BASE}/${id}`);
}
```

- [ ] **Step 4: Run — expect green**

`npx jest src/services/careProfileService.test.ts --ci`

- [ ] **Step 5: Commit**

```bash
git add frontend/src/services/careProfileService.ts frontend/src/services/careProfileService.test.ts
git commit -m "feat(care-ui): servicio de perfiles de formula"
```

---

## Task 5: Frontend — `careProfileModel.ts` presets + helpers (TDD)

**Files:**
- Create: `frontend/src/utils/careProfileModel.ts`
- Create: `frontend/src/utils/careProfileModel.test.ts`

**Interfaces (consumed by Tasks 7–8):**
- `ProfileView {id, name, blocks, chaos_factor, builtin}`
- `BUILTIN_PROFILES: ProfileView[]` (4 entries; index 0 is Default)
- `toProfileView(profile: CareProfile): ProfileView`
- `applyProfileToDraft(draft: EquationDraft, profile: ProfileView): EquationDraft`
- `profileMatchesDraft(profile: ProfileView | null, blocks, chaosFactor): boolean` (percent-rounded compare; chaos tolerance 0.1)
- `profileErrorMessage(error: unknown): string`

- [ ] **Step 1: Write the failing test**

Create `frontend/src/utils/careProfileModel.test.ts`:

```ts
import {
  BUILTIN_PROFILES,
  applyProfileToDraft,
  profileErrorMessage,
  profileMatchesDraft,
  toProfileView,
} from "./careProfileModel";
import { CANONICAL_BLOCK_WEIGHTS } from "../constants/careDimensions";
import { totalPercent } from "./careCriteriaModel";
import type { EquationDraft } from "./careEquationModel";

const draft: EquationDraft = {
  blocks: { ...CANONICAL_BLOCK_WEIGHTS },
  chaosFactor: 5,
  chaosSeed: "abc123",
  minCompatibility: 2,
  matchCritical: 0.2,
};

describe("careProfileModel / builtins", () => {
  it("ships 4 presets with unique ids and Default first", () => {
    expect(BUILTIN_PROFILES).toHaveLength(4);
    expect(BUILTIN_PROFILES[0].id).toBe("builtin:default");
    expect(new Set(BUILTIN_PROFILES.map((p) => p.id)).size).toBe(4);
    expect(BUILTIN_PROFILES.every((p) => p.builtin)).toBe(true);
  });

  it("every preset sums to exactly 100%", () => {
    for (const profile of BUILTIN_PROFILES) {
      expect(totalPercent(profile.blocks)).toBe(100);
    }
  });

  it("matches the approved weights for the recommendations", () => {
    const neuro = BUILTIN_PROFILES.find(
      (p) => p.id === "builtin:neurodiversity",
    )!;
    expect(neuro.blocks).toEqual({
      values: 0.32,
      relationship_goals: 0.16,
      neurodiversity: 0.22,
      responsiveness: 0.09,
      music: 0.1,
      love_language: 0.06,
      communication_style: 0.05,
    });
    const lowchaos = BUILTIN_PROFILES.find(
      (p) => p.id === "builtin:lowchaos",
    )!;
    expect(lowchaos.chaos_factor).toBe(1);
  });
});

describe("careProfileModel / helpers", () => {
  it("toProfileView marks saved profiles as non-builtin", () => {
    const view = toProfileView({
      id: "p1",
      name: "Guardado",
      blocks: { ...CANONICAL_BLOCK_WEIGHTS },
      chaos_factor: 2,
      created_by: "emp1",
      created_at: "2026-10-17T00:00:00",
      updated_at: "2026-10-17T00:00:00",
    });
    expect(view).toEqual({
      id: "p1",
      name: "Guardado",
      blocks: { ...CANONICAL_BLOCK_WEIGHTS },
      chaos_factor: 2,
      builtin: false,
    });
  });

  it("applyProfileToDraft copies blocks + chaos and keeps seed/thresholds", () => {
    const next = applyProfileToDraft(draft, BUILTIN_PROFILES[3]);
    expect(next.blocks).toEqual({ ...CANONICAL_BLOCK_WEIGHTS });
    expect(next.blocks).not.toBe(BUILTIN_PROFILES[3].blocks);
    expect(next.chaosFactor).toBe(1);
    expect(next.chaosSeed).toBe("abc123");
    expect(next.minCompatibility).toBe(2);
    expect(next.matchCritical).toBe(0.2);
    expect(draft.blocks.values).toBe(0.36);
  });

  it("profileMatchesDraft compares rounded percents and chaos", () => {
    const profile = BUILTIN_PROFILES[0];
    expect(profileMatchesDraft(null, draft.blocks, 0)).toBe(false);
    expect(profileMatchesDraft(profile, draft.blocks, 0)).toBe(true);
    expect(profileMatchesDraft(profile, draft.blocks, 0.05)).toBe(true);
    expect(profileMatchesDraft(profile, draft.blocks, 1)).toBe(false);
    expect(
      profileMatchesDraft(
        profile,
        { ...draft.blocks, values: 0.3, music: 0.17 },
        0,
      ),
    ).toBe(false);
  });

  it("profileErrorMessage maps 404/409/422/unknown to Spanish", () => {
    const err = (status: number, detail?: unknown) => ({
      response: { status, data: { detail } },
    });
    expect(profileErrorMessage(err(404))).toBe("Perfil no encontrado.");
    expect(profileErrorMessage(err(409))).toBe(
      "Ya existe un perfil con ese nombre.",
    );
    expect(profileErrorMessage(err(422, ["a", "b"]))).toBe("a · b");
    expect(profileErrorMessage(err(422, "mal"))).toBe("mal");
    expect(profileErrorMessage(new Error("boom"))).toBe(
      "No se pudo completar la operación con el perfil.",
    );
  });
});
```

- [ ] **Step 2: Run — expect failure**

`npx jest src/utils/careProfileModel.test.ts --ci`
Expected: module not found.

- [ ] **Step 3: Implement**

Create `frontend/src/utils/careProfileModel.ts`:

```ts
import {
  CANONICAL_BLOCK_WEIGHTS,
  CARE_DIMENSION_KEYS,
} from "../constants/careDimensions";
import type { FormulaBlocks } from "../services/careFormulaService";
import type { CareProfile } from "../services/careProfileService";
import { percentOf } from "./careCriteriaModel";
import type { EquationDraft } from "./careEquationModel";

/**
 * Pure view-model helpers for CARE formula profiles.
 * Frontend presets are constants (no backend copy); saved profiles come from
 * careProfileService. Index 0 of BUILTIN_PROFILES is the Default profile.
 */

export interface ProfileView {
  id: string;
  name: string;
  blocks: FormulaBlocks;
  chaos_factor: number;
  builtin: boolean;
}

export const BUILTIN_PROFILES: ProfileView[] = [
  {
    id: "builtin:default",
    name: "Default",
    blocks: { ...CANONICAL_BLOCK_WEIGHTS },
    chaos_factor: 0.0,
    builtin: true,
  },
  {
    id: "builtin:neurodiversity",
    name: "Neurodiversidad Boost",
    blocks: {
      values: 0.32,
      relationship_goals: 0.16,
      neurodiversity: 0.22,
      responsiveness: 0.09,
      music: 0.1,
      love_language: 0.06,
      communication_style: 0.05,
    },
    chaos_factor: 0.0,
    builtin: true,
  },
  {
    id: "builtin:balance",
    name: "Balance Relacional",
    blocks: {
      values: 0.3,
      relationship_goals: 0.2,
      neurodiversity: 0.13,
      responsiveness: 0.11,
      music: 0.09,
      love_language: 0.09,
      communication_style: 0.08,
    },
    chaos_factor: 0.0,
    builtin: true,
  },
  {
    id: "builtin:lowchaos",
    name: "Caos Reducido",
    blocks: { ...CANONICAL_BLOCK_WEIGHTS },
    chaos_factor: 1.0,
    builtin: true,
  },
];

export function toProfileView(profile: CareProfile): ProfileView {
  return {
    id: profile.id,
    name: profile.name,
    blocks: profile.blocks,
    chaos_factor: profile.chaos_factor,
    builtin: false,
  };
}

/** Overwrites blocks + chaos factor; seed/thresholds of the draft survive. */
export function applyProfileToDraft(
  draft: EquationDraft,
  profile: ProfileView,
): EquationDraft {
  return {
    ...draft,
    blocks: { ...profile.blocks },
    chaosFactor: profile.chaos_factor,
  };
}

/** True when the draft still equals the profile (rounded %) and chaos (±0.1). */
export function profileMatchesDraft(
  profile: ProfileView | null,
  blocks: FormulaBlocks,
  chaosFactor: number,
): boolean {
  if (!profile) return false;
  if (Math.abs(chaosFactor - profile.chaos_factor) > 0.1) return false;
  return CARE_DIMENSION_KEYS.every(
    (key) => percentOf(blocks[key]) === percentOf(profile.blocks[key]),
  );
}

/** Maps a profile failure (axios error) to a Spanish, user-visible message. */
export function profileErrorMessage(error: unknown): string {
  const status = (error as { response?: { status?: number } })?.response
    ?.status;
  const detail = (error as { response?: { data?: { detail?: unknown } } })
    ?.response?.data?.detail;
  if (status === 404) {
    return typeof detail === "string" && detail
      ? detail
      : "Perfil no encontrado.";
  }
  if (status === 409) {
    return typeof detail === "string" && detail
      ? detail
      : "Ya existe un perfil con ese nombre.";
  }
  if (status === 422) {
    if (Array.isArray(detail)) return detail.join(" · ");
    if (typeof detail === "string" && detail) return detail;
    return "El perfil no pasó la validación.";
  }
  return "No se pudo completar la operación con el perfil.";
}
```

- [ ] **Step 4: Run — expect green**

`npx jest src/utils/careProfileModel.test.ts --ci`

- [ ] **Step 5: Commit**

```bash
git add frontend/src/utils/careProfileModel.ts frontend/src/utils/careProfileModel.test.ts
git commit -m "feat(care-ui): modelo de perfiles y presets recomendados"
```

---

## Task 6: Frontend — `clampBlockPercent` in `careCriteriaModel.ts` (TDD)

**Files:**
- Modify: `frontend/src/utils/careCriteriaModel.ts` (append at end)
- Modify: `frontend/src/utils/careCriteriaModel.test.ts` (add import + new describe)

- [ ] **Step 1: Add failing tests**

In `frontend/src/utils/careCriteriaModel.test.ts` add `clampBlockPercent` to the import list from `./careCriteriaModel`, then append at the end of the file:

```ts
describe("careCriteriaModel / clampBlockPercent", () => {
  it("returns the requested percent when lowering", () => {
    expect(clampBlockPercent(canonical, "values", 20)).toBe(20);
  });

  it("cannot raise at all when the total is already 100%", () => {
    expect(clampBlockPercent(canonical, "values", 40)).toBe(36);
  });

  it("raises at most by the exact headroom to 100%", () => {
    const lowered = withFraction(canonical, "values", 30); // sum 94
    expect(clampBlockPercent(lowered, "values", 40)).toBe(36);
    expect(clampBlockPercent(lowered, "music", 20)).toBe(17);
  });

  it("passes raises through when they stay under 100%", () => {
    const lowered = withFraction(canonical, "values", 20); // sum 84
    expect(clampBlockPercent(lowered, "music", 15)).toBe(15);
  });

  it("cannot raise when the total already exceeds 100%", () => {
    const over = withFraction(canonical, "values", 44); // sum 108
    expect(clampBlockPercent(over, "music", 20)).toBe(11);
  });
});
```

- [ ] **Step 2: Run — expect failure**

`npx jest src/utils/careCriteriaModel.test.ts --ci`
Expected: `clampBlockPercent is not a function`.

- [ ] **Step 3: Implement**

Append to `frontend/src/utils/careCriteriaModel.ts`:

```ts
/**
 * Moves one block toward `requestedPercent` without letting the rounded
 * total exceed 100%. Lowering is always allowed; a raise is capped at the
 * exact remaining headroom (0 when the total is already 100% or more).
 */
export function clampBlockPercent(
  blocks: FormulaBlocks,
  key: CareDimensionKey,
  requestedPercent: number,
): number {
  const currentPercent = percentOf(blocks[key]);
  if (requestedPercent <= currentPercent) return requestedPercent;
  const headroom = Math.max(0, 100 - totalPercent(blocks));
  return Math.min(requestedPercent, currentPercent + headroom);
}
```

- [ ] **Step 4: Run — expect green**

`npx jest src/utils/careCriteriaModel.test.ts --ci`

- [ ] **Step 5: Commit**

```bash
git add frontend/src/utils/careCriteriaModel.ts frontend/src/utils/careCriteriaModel.test.ts
git commit -m "feat(care-ui): clamp de pesos al 100% en el modelo"
```

---

## Task 7: Frontend — `CareProfilesPanel` component (TDD)

**Files:**
- Create: `frontend/src/components/care/CareProfilesPanel.tsx`
- Create: `frontend/src/components/care/CareProfilesPanel.test.tsx`

**Testids (consumed by Task 8):** `profile-select`, `profile-option-${id}`, `profile-save-as`, `profile-update`, `profile-delete`.

- [ ] **Step 1: Write the failing test**

Create `frontend/src/components/care/CareProfilesPanel.test.tsx`:

```tsx
import { fireEvent, render, screen } from "@testing-library/react";
import CareProfilesPanel from "./CareProfilesPanel";
import { BUILTIN_PROFILES } from "../../utils/careProfileModel";
import { CANONICAL_BLOCK_WEIGHTS } from "../../constants/careDimensions";

const saved = {
  id: "p1",
  name: "Mi perfil",
  blocks: { ...CANONICAL_BLOCK_WEIGHTS },
  chaos_factor: 0,
  builtin: false,
};

const setup = (
  over: Partial<React.ComponentProps<typeof CareProfilesPanel>> = {},
) => {
  const props = {
    profiles: [...BUILTIN_PROFILES, saved],
    selectedId: null as string | null,
    modified: false,
    onSelect: jest.fn(),
    onSaveAs: jest.fn(),
    onUpdate: jest.fn(),
    onDelete: jest.fn(),
    ...over,
  };
  render(<CareProfilesPanel {...props} />);
  return props;
};

const openSelect = () => {
  fireEvent.mouseDown(screen.getByRole("combobox"));
};

describe("CareProfilesPanel", () => {
  it("groups recommended and saved profiles in the dropdown", () => {
    setup();
    openSelect();
    expect(screen.getByText("Recomendados")).toBeInTheDocument();
    expect(screen.getByText("Guardados")).toBeInTheDocument();
    expect(
      screen.getByTestId("profile-option-builtin:default"),
    ).toBeInTheDocument();
    expect(screen.getByTestId("profile-option-p1")).toBeInTheDocument();
  });

  it("shows 'Sin perfiles guardados' when there are none", () => {
    setup({ profiles: [...BUILTIN_PROFILES] });
    openSelect();
    expect(screen.getByText("Sin perfiles guardados")).toBeInTheDocument();
  });

  it("shows Personalizado when nothing is selected", () => {
    setup();
    expect(screen.getByTestId("profile-select")).toHaveTextContent(
      "Personalizado",
    );
  });

  it("shows (modificado) when the draft drifted from the selection", () => {
    setup({ selectedId: "builtin:default", modified: true });
    expect(screen.getByTestId("profile-select")).toHaveTextContent(
      "Default (modificado)",
    );
  });

  it("disables update/delete for builtins and empty selection", () => {
    setup({ selectedId: "builtin:default" });
    expect(screen.getByTestId("profile-update")).toBeDisabled();
    expect(screen.getByTestId("profile-delete")).toBeDisabled();
    expect(screen.getByTestId("profile-save-as")).not.toBeDisabled();
  });

  it("enables update/delete for a saved selection", () => {
    setup({ selectedId: "p1" });
    expect(screen.getByTestId("profile-update")).not.toBeDisabled();
    expect(screen.getByTestId("profile-delete")).not.toBeDisabled();
  });

  it("emits onSelect when an option is chosen", () => {
    const props = setup();
    openSelect();
    fireEvent.click(screen.getByTestId("profile-option-builtin:default"));
    expect(props.onSelect).toHaveBeenCalledWith("builtin:default");
  });

  it("emits onSaveAs / onUpdate / onDelete", () => {
    const props = setup({ selectedId: "p1" });
    fireEvent.click(screen.getByTestId("profile-save-as"));
    fireEvent.click(screen.getByTestId("profile-update"));
    fireEvent.click(screen.getByTestId("profile-delete"));
    expect(props.onSaveAs).toHaveBeenCalledTimes(1);
    expect(props.onUpdate).toHaveBeenCalledTimes(1);
    expect(props.onDelete).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run — expect failure**

`npx jest src/components/care/CareProfilesPanel.test.tsx --ci`
Expected: module not found.

- [ ] **Step 3: Implement**

Create `frontend/src/components/care/CareProfilesPanel.tsx`:

```tsx
import {
  FormControl,
  IconButton,
  InputLabel,
  ListSubheader,
  MenuItem,
  Select,
  Stack,
  Tooltip,
} from "@mui/material";
import BookmarkAddIcon from "@mui/icons-material/BookmarkAdd";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import SaveIcon from "@mui/icons-material/Save";
import type { ProfileView } from "../../utils/careProfileModel";

export interface CareProfilesPanelProps {
  profiles: ProfileView[];
  selectedId: string | null;
  /** True when the draft no longer equals the selected profile. */
  modified: boolean;
  loading?: boolean;
  onSelect: (id: string) => void;
  onSaveAs: () => void;
  onUpdate: () => void;
  onDelete: () => void;
}

/**
 * Presentational selector for formula profiles (recommended + saved).
 * Emits intent only — the container page owns state and network calls.
 */
export default function CareProfilesPanel({
  profiles,
  selectedId,
  modified,
  loading = false,
  onSelect,
  onSaveAs,
  onUpdate,
  onDelete,
}: CareProfilesPanelProps) {
  const builtins = profiles.filter((profile) => profile.builtin);
  const saved = profiles.filter((profile) => !profile.builtin);
  const selected =
    profiles.find((profile) => profile.id === selectedId) ?? null;
  const canManage = selected !== null && !selected.builtin;

  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 1.5 }}>
      <FormControl size="small" sx={{ flexGrow: 1 }}>
        <InputLabel id="profile-select-label">Perfil</InputLabel>
        <Select
          labelId="profile-select-label"
          label="Perfil"
          data-testid="profile-select"
          value={selectedId ?? "__custom__"}
          disabled={loading}
          onChange={(event) => onSelect(event.target.value as string)}
          renderValue={() => {
            if (!selected) return <em>Personalizado</em>;
            return modified ? `${selected.name} (modificado)` : selected.name;
          }}
        >
          <MenuItem value="__custom__" sx={{ display: "none" }}>
            Personalizado
          </MenuItem>
          <ListSubheader>Recomendados</ListSubheader>
          {builtins.map((profile) => (
            <MenuItem
              key={profile.id}
              value={profile.id}
              data-testid={`profile-option-${profile.id}`}
            >
              {profile.name}
            </MenuItem>
          ))}
          <ListSubheader>Guardados</ListSubheader>
          {saved.length === 0 ? (
            <MenuItem disabled value="__empty__">
              Sin perfiles guardados
            </MenuItem>
          ) : (
            saved.map((profile) => (
              <MenuItem
                key={profile.id}
                value={profile.id}
                data-testid={`profile-option-${profile.id}`}
              >
                {profile.name}
              </MenuItem>
            ))
          )}
        </Select>
      </FormControl>

      <Tooltip title="Guardar como perfil…">
        <IconButton
          data-testid="profile-save-as"
          size="small"
          onClick={onSaveAs}
          disabled={loading}
        >
          <BookmarkAddIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      <Tooltip title="Actualizar perfil">
        <span>
          <IconButton
            data-testid="profile-update"
            size="small"
            onClick={onUpdate}
            disabled={!canManage}
          >
            <SaveIcon fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>

      <Tooltip title="Eliminar perfil">
        <span>
          <IconButton
            data-testid="profile-delete"
            size="small"
            color="error"
            onClick={onDelete}
            disabled={!canManage}
          >
            <DeleteOutlineIcon fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>
    </Stack>
  );
}
```

- [ ] **Step 4: Run — expect green**

`npx jest src/components/care/CareProfilesPanel.test.tsx --ci`

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/care/CareProfilesPanel.tsx frontend/src/components/care/CareProfilesPanel.test.tsx
git commit -m "feat(care-ui): panel de perfiles con acciones"
```

---

## Task 8: Frontend — wire `equation.tsx` (profiles + Reestablecer + Guardar + clamp) + tests

**Files:**
- Modify: `frontend/src/pages/portal-redthread/care/equation.tsx`
- Modify: `frontend/src/pages/portal-redthread/care/equation.test.tsx`

Current anchors (verified for this plan; run `grep -n` first if the file drifted): imports 1–82; state 109–143; unmount cleanup 200–205; `handleBlockChange` 207–214; `handleNormalizar` 234–249; Σ row 760–781; buttons 783–837; save modal 978–1057.

### 8a. Production code

- [ ] **Step 1: Imports**

- In the `@mui/material` import (line 3–22) add `Tooltip,`.
- Line 26: replace `import TuneIcon from "@mui/icons-material/Tune";` with `import RestartAltIcon from "@mui/icons-material/RestartAlt";`
- After the `CareVersionsPanel` import (line 43) add:
  ```ts
  import CareProfilesPanel from "../../../components/care/CareProfilesPanel";
  ```
- After the `careFormulaService` import block (line 60) add:
  ```ts
  import {
    createProfile,
    deleteProfile,
    listProfiles,
    updateProfile,
  } from "../../../services/careProfileService";
  ```
- In the `careCriteriaModel` import (lines 61–71) add `clampBlockPercent,`.
- After the `careEquationModel` import block (line 82) add:
  ```ts
  import {
    BUILTIN_PROFILES,
    applyProfileToDraft,
    profileErrorMessage,
    profileMatchesDraft,
    toProfileView,
    type ProfileView,
  } from "../../../utils/careProfileModel";
  ```

- [ ] **Step 2: Constants + state**

After `const GLOW_MS = 700;` add:

```ts
const LIMIT_HINT_MS = 1200;
```

Remove the `normalizing` state (line 118). After `const [saveSuccess, setSaveSuccess] = useState<string | null>(null);` add:

```ts
const [profiles, setProfiles] = useState<ProfileView[]>(BUILTIN_PROFILES);
const [profilesLoading, setProfilesLoading] = useState(false);
const [selectedProfileId, setSelectedProfileId] = useState<string | null>(
  null,
);
const [profileDialogOpen, setProfileDialogOpen] = useState(false);
const [profileName, setProfileName] = useState("");
const [profileSaving, setProfileSaving] = useState(false);
const [profileError, setProfileError] = useState<string | null>(null);
const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
const [profileConfirm, setProfileConfirm] = useState<{
  kind: "update" | "delete";
  profile: ProfileView;
} | null>(null);
const [limitHint, setLimitHint] = useState(false);
const limitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
```

- [ ] **Step 3: Profiles load effect + timer cleanup**

Extend the unmount cleanup (lines 200–205) to:

```ts
useEffect(
  () => () => {
    if (glowTimer.current) clearTimeout(glowTimer.current);
    if (limitTimer.current) clearTimeout(limitTimer.current);
  },
  [],
);
```

After that effect add:

```ts
useEffect(() => {
  if (!ready) return;
  let cancelled = false;
  setProfilesLoading(true);
  (async () => {
    try {
      const saved = await listProfiles();
      if (!cancelled) {
        setProfiles([...BUILTIN_PROFILES, ...saved.map(toProfileView)]);
      }
    } catch {
      if (!cancelled) setProfiles(BUILTIN_PROFILES);
    } finally {
      if (!cancelled) setProfilesLoading(false);
    }
  })();
  return () => {
    cancelled = true;
  };
}, [ready]);
```

- [ ] **Step 4: Clamp in `handleBlockChange`**

Replace the handler (lines 207–214) with:

```ts
const handleBlockChange = (key: CareDimensionKey, percent: number) => {
  if (!draft || locked.includes(key)) return;
  const clamped = clampBlockPercent(draft.blocks, key, percent);
  if (percent > clamped) {
    setLimitHint(true);
    if (limitTimer.current) clearTimeout(limitTimer.current);
    limitTimer.current = setTimeout(() => setLimitHint(false), LIMIT_HINT_MS);
  }
  applyDraft({
    ...draft,
    blocks: withFraction(draft.blocks, key, clamped),
  });
  flashGlow(key);
};
```

- [ ] **Step 5: Replace `handleNormalizar` with profile handlers**

Delete the whole `handleNormalizar` function (lines 234–249) and, right after `handleToggleLock`, add:

```ts
const handleSelectProfile = (id: string) => {
  if (!draft) return;
  const profile = profiles.find((item) => item.id === id);
  if (!profile) return;
  applyDraft(applyProfileToDraft(draft, profile));
  setSelectedProfileId(id);
};

const handleReestablecer = () => {
  if (!draft) return;
  applyDraft(applyProfileToDraft(draft, BUILTIN_PROFILES[0]));
  setSelectedProfileId(BUILTIN_PROFILES[0].id);
};

const handleProfileSaveAsOpen = () => {
  setProfileError(null);
  setProfileName("");
  setProfileDialogOpen(true);
};

const handleProfileCreate = async () => {
  if (!draft) return;
  setProfileSaving(true);
  setProfileError(null);
  try {
    const created = await createProfile({
      name: profileName.trim(),
      blocks: draft.blocks,
      chaos_factor: draft.chaosFactor,
    });
    const view = toProfileView(created);
    setProfiles((prev) => [...prev, view]);
    setSelectedProfileId(view.id);
    setProfileDialogOpen(false);
    setProfileSuccess(`Perfil "${view.name}" guardado.`);
  } catch (err) {
    setProfileError(profileErrorMessage(err));
  } finally {
    setProfileSaving(false);
  }
};

const handleProfileUpdateConfirm = async () => {
  if (!draft || !profileConfirm || profileConfirm.kind !== "update") return;
  setProfileSaving(true);
  setProfileError(null);
  try {
    const updated = await updateProfile(profileConfirm.profile.id, {
      blocks: draft.blocks,
      chaos_factor: draft.chaosFactor,
    });
    const view = toProfileView(updated);
    setProfiles((prev) =>
      prev.map((profile) => (profile.id === view.id ? view : profile)),
    );
    setProfileConfirm(null);
    setProfileSuccess(`Perfil "${view.name}" actualizado.`);
  } catch (err) {
    setProfileError(profileErrorMessage(err));
  } finally {
    setProfileSaving(false);
  }
};

const handleProfileDeleteConfirm = async () => {
  if (!profileConfirm || profileConfirm.kind !== "delete") return;
  const target = profileConfirm.profile;
  setProfileSaving(true);
  setProfileError(null);
  try {
    await deleteProfile(target.id);
    setProfiles((prev) => prev.filter((profile) => profile.id !== target.id));
    if (selectedProfileId === target.id) setSelectedProfileId(null);
    setProfileConfirm(null);
    setProfileSuccess(`Perfil "${target.name}" eliminado.`);
  } catch (err) {
    setProfileError(profileErrorMessage(err));
  } finally {
    setProfileSaving(false);
  }
};
```

- [ ] **Step 6: Derived selection state**

After `const balanced = draft ? isBalanced(draft.blocks) : false;` add:

```ts
const selectedProfile =
  profiles.find((profile) => profile.id === selectedProfileId) ?? null;
const profileModified =
  draft !== null &&
  !profileMatchesDraft(selectedProfile, draft.blocks, draft.chaosFactor);
```

- [ ] **Step 7: Render — success alert, panel, Σ hint, buttons**

- After the `saveSuccess` alert block add:
  ```tsx
  {profileSuccess && (
    <Alert severity="success" sx={{ mb: 3 }} data-testid="profile-success">
      {profileSuccess}
    </Alert>
  )}
  ```
- Inside the weights `Paper`, before `<Typography variant="subtitle1" …>Pesos canónicos</Typography>` insert:
  ```tsx
  <CareProfilesPanel
    profiles={profiles}
    selectedId={selectedProfileId}
    modified={profileModified}
    loading={profilesLoading}
    onSelect={handleSelectProfile}
    onSaveAs={handleProfileSaveAsOpen}
    onUpdate={() => {
      if (selectedProfile && !selectedProfile.builtin) {
        setProfileError(null);
        setProfileConfirm({ kind: "update", profile: selectedProfile });
      }
    }}
    onDelete={() => {
      if (selectedProfile && !selectedProfile.builtin) {
        setProfileError(null);
        setProfileConfirm({ kind: "delete", profile: selectedProfile });
      }
    }}
  />
  ```
- Replace the `weights-total` Typography block with a row that shows the hint chip:
  ```tsx
  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
    {limitHint && (
      <Chip
        data-testid="limit-hint"
        label="Límite 100%"
        size="small"
        color="warning"
        variant="outlined"
      />
    )}
    <Typography
      variant="body2"
      data-testid="weights-total"
      sx={{
        fontWeight: 800,
        color: balanced ? "success.main" : "error.main",
      }}
    >
      {totalPercent(draft.blocks)}%
    </Typography>
  </Box>
  ```
- Replace the Normalizar button with:
  ```tsx
  <Tooltip title="Vuelve al perfil Default">
    <span>
      <Button
        data-testid="action-reestablecer"
        variant="outlined"
        size="small"
        startIcon={<RestartAltIcon />}
        onClick={handleReestablecer}
        disabled={loading}
        sx={{
          borderRadius: 2,
          textTransform: "none",
          fontWeight: 600,
        }}
      >
        Reestablecer
      </Button>
    </span>
  </Tooltip>
  ```
- Change the `open-save-modal` button label from `Aplicar Cambios` to `Guardar` (testid, disabled logic, and everything else stay).
- Change the save modal `<DialogTitle>Aplicar cambios</DialogTitle>` to `<DialogTitle>Guardar cambios</DialogTitle>`.

- [ ] **Step 8: Render — the two profile dialogs**

Insert after the closing `</Dialog>` of the save modal (just before the final `</Container>`):

```tsx
<Dialog
  open={profileDialogOpen}
  onClose={() => {
    if (!profileSaving) setProfileDialogOpen(false);
  }}
  maxWidth="xs"
  fullWidth
  data-testid="profile-name-dialog"
>
  <DialogTitle>Guardar como perfil</DialogTitle>
  <DialogContent>
    <Stack spacing={2} sx={{ mt: 1 }}>
      <TextField
        data-testid="profile-name-input"
        label="Nombre del perfil"
        required
        fullWidth
        value={profileName}
        onChange={(event) => setProfileName(event.target.value)}
        helperText="Entre 1 y 60 caracteres."
      />
      {profileError && (
        <Alert severity="error" data-testid="profile-name-error">
          {profileError}
        </Alert>
      )}
    </Stack>
  </DialogContent>
  <DialogActions>
    <Button
      onClick={() => setProfileDialogOpen(false)}
      disabled={profileSaving}
    >
      Cancelar
    </Button>
    <Button
      data-testid="profile-name-save"
      variant="contained"
      onClick={handleProfileCreate}
      disabled={profileName.trim().length === 0 || profileSaving}
    >
      {profileSaving ? "Guardando..." : "Guardar"}
    </Button>
  </DialogActions>
</Dialog>

<Dialog
  open={profileConfirm !== null}
  onClose={() => {
    if (!profileSaving) setProfileConfirm(null);
  }}
  maxWidth="xs"
  fullWidth
  data-testid="profile-confirm-dialog"
>
  <DialogTitle>
    {profileConfirm?.kind === "delete"
      ? "Eliminar perfil"
      : "Actualizar perfil"}
  </DialogTitle>
  <DialogContent>
    <Stack spacing={2} sx={{ mt: 1 }}>
      <Typography variant="body2">
        {profileConfirm?.kind === "delete"
          ? `¿Eliminar el perfil "${profileConfirm?.profile.name}"? Esta acción no se puede deshacer.`
          : `¿Sobrescribir "${profileConfirm?.profile.name}" con los pesos actuales del editor?`}
      </Typography>
      {profileError && (
        <Alert severity="error" data-testid="profile-confirm-error">
          {profileError}
        </Alert>
      )}
    </Stack>
  </DialogContent>
  <DialogActions>
    <Button
      data-testid="profile-confirm-cancel"
      onClick={() => setProfileConfirm(null)}
      disabled={profileSaving}
    >
      Cancelar
    </Button>
    <Button
      data-testid="profile-confirm-accept"
      variant="contained"
      color={profileConfirm?.kind === "delete" ? "error" : "primary"}
      onClick={
        profileConfirm?.kind === "delete"
          ? handleProfileDeleteConfirm
          : handleProfileUpdateConfirm
      }
      disabled={profileSaving}
    >
      {profileConfirm?.kind === "delete" ? "Eliminar" : "Actualizar"}
    </Button>
  </DialogActions>
</Dialog>
```

- [ ] **Step 9: Typecheck + lint the page (before touching tests)**

`npx tsc --noEmit`
`npx eslint src/pages/portal-redthread/care/equation.tsx`
Expected: clean (only preexisting warning categories at most).

### 8b. Test updates (`equation.test.tsx`)

- [ ] **Step 10: New mocks + stubs**

1. After the `careFormulaService` jest.mock block add:
   ```ts
   jest.mock("../../../services/careProfileService", () => ({
     __esModule: true,
     listProfiles: jest.fn(),
     createProfile: jest.fn(),
     updateProfile: jest.fn(),
     deleteProfile: jest.fn(),
   }));
   ```
2. Extend the top-level test imports (from `../../../services/careProfileService`): `createProfile, deleteProfile, listProfiles, updateProfile`; and after the existing mock casts add:
   ```ts
   const mockListProfiles = listProfiles as jest.Mock;
   const mockCreateProfile = createProfile as jest.Mock;
   const mockUpdateProfile = updateProfile as jest.Mock;
   const mockDeleteProfile = deleteProfile as jest.Mock;
   ```
3. In the existing `beforeEach` (where `mockGetActive` / `mockNormalize` defaults are set) add:
   ```ts
   mockListProfiles.mockResolvedValue([]);
   ```
   (Tests that need saved profiles use `mockListProfiles.mockResolvedValueOnce([...])` before rendering.)
4. Extend the `CareCriteriaTable` stub with a lower-emitting button (next to `stub-slide-values`):
   ```ts
   React.createElement("button", {
     "data-testid": "stub-slide-values-30",
     onClick: () => props.onSliderChange("values", 30),
   }),
   ```
5. In the `CareFormulaJsonEditor` mock add an unbalanced payload (sum = 104%) and its button:
   ```ts
   const unbalancedJson = JSON.stringify({
     blocks: {
       values: 0.44,
       relationship_goals: 0.18,
       neurodiversity: 0.15,
       responsiveness: 0.1,
       music: 0.07,
       love_language: 0.06,
       communication_style: 0.04,
     },
     chaos_factor: 0,
     chaos_seed: null,
     min_compatibility: 0,
     match_critical: 0.15,
   });
   ```
   ```ts
   React.createElement("button", {
     "data-testid": "stub-json-unbalanced",
     onClick: () => props.onChange(unbalancedJson),
   }),
   ```
6. Add a `CareProfilesPanel` stub next to the other component mocks:
   ```tsx
   jest.mock("../../../components/care/CareProfilesPanel", () => {
     const React = require("react");
     return {
       __esModule: true,
       default: (props: {
         profiles: { builtin: boolean }[];
         selectedId: string | null;
         modified: boolean;
         onSelect: (id: string) => void;
         onSaveAs: () => void;
         onUpdate: () => void;
         onDelete: () => void;
       }) =>
         React.createElement(
           "div",
           {
             "data-testid": "profiles-stub",
             "data-selected": props.selectedId ?? "",
             "data-modified": String(props.modified),
             "data-count": String(
               props.profiles.filter((p) => !p.builtin).length,
             ),
           },
           React.createElement("button", {
             "data-testid": "stub-profile-select-default",
             onClick: () => props.onSelect("builtin:default"),
           }),
           React.createElement("button", {
             "data-testid": "stub-profile-select-lowchaos",
             onClick: () => props.onSelect("builtin:lowchaos"),
           }),
           React.createElement("button", {
             "data-testid": "stub-profile-select-saved",
             onClick: () => props.onSelect("p1"),
           }),
           React.createElement("button", {
             "data-testid": "stub-profile-save-as",
             onClick: () => props.onSaveAs(),
           }),
           React.createElement("button", {
             "data-testid": "stub-profile-update",
             onClick: () => props.onUpdate(),
           }),
           React.createElement("button", {
             "data-testid": "stub-profile-delete",
             onClick: () => props.onDelete(),
           }),
         ),
     };
   });
   ```

- [ ] **Step 11: Rewrite the tests that assumed an un-clamped 104% slider**

1. `"flags the total as invalid and blocks Aplicar when the sum breaks"` → the clamp now prevents this via sliders; reach the state through JSON instead:
   ```tsx
   it("flags the total as invalid and blocks Guardar when the sum breaks (JSON)", async () => {
     renderWithTheme(<CareEquationPage />);
     await screen.findByTestId("json-stub");
     fireEvent.click(screen.getByTestId("stub-json-unbalanced"));
     expect(screen.getByTestId("kpi-total")).toHaveTextContent("104%");
     expect(screen.getByTestId("kpi-total-badge")).toHaveTextContent("Inválido");
     expect(screen.getByTestId("open-save-modal")).toBeDisabled();
     expect(screen.getByTestId("weights-total")).toHaveTextContent("104%");
   });
   ```
2. `"regenerates the JSON when a block slider changes"` (currently clicks `stub-slide-values` and expects `"values": 0.4`) → use the lower stub and expect `"values": 0.3`:
   ```tsx
   it("regenerates the JSON when a block slider changes", async () => {
     renderWithTheme(<CareEquationPage />);
     await screen.findByTestId("criteria-table");
     fireEvent.click(screen.getByTestId("stub-slide-values-30"));
     expect(
       screen.getByTestId("json-stub").getAttribute("data-value"),
     ).toContain('"values": 0.3');
   });
   ```
3. `"normalizes via the Normalizar button"` → replace entirely (Reestablecer no longer calls the backend normalize):
   ```tsx
   it("restores the Default profile from the Reestablecer button", async () => {
     mockQuery = {
       w: JSON.stringify({ ...active.blocks, values: 0.44, music: 0.07 }),
     };
     renderWithTheme(<CareEquationPage />);
     await screen.findByTestId("criteria-table");
     fireEvent.click(screen.getByTestId("action-reestablecer"));
     expect(headerBlocks()).toEqual(active.blocks);
     expect(mockNormalize).not.toHaveBeenCalled();
     expect(screen.getByTestId("profiles-stub")).toHaveAttribute(
       "data-selected",
       "builtin:default",
     );
   });
   ```
   (Leave `"normalizes on slider commit with the current blocks and locks"` untouched — commit still normalizes.)
4. `"short-circuits to client validation for an unbalanced sum"` (currently slider-based) → drive it with JSON:
   ```tsx
   it("short-circuits to client validation for an unbalanced sum", async () => {
     renderWithTheme(<CareEquationPage />);
     await screen.findByTestId("json-stub");
     fireEvent.click(screen.getByTestId("stub-json-unbalanced"));
     fireEvent.click(screen.getByTestId("action-probar"));
     expect(await screen.findByTestId("validate-errors")).toHaveTextContent(
       "100%",
     );
     expect(mockValidate).not.toHaveBeenCalled();
     expect(mockSimulate).not.toHaveBeenCalled();
   });
   ```
   Note: `"ignores slider changes on locked dimensions"`, `"flashes the changed dimension…"` and `"does not flash a locked dimension…"` keep working unchanged (clamp keeps the tapped value, flash/ignored logic untouched) — do not edit them unless they fail.

- [ ] **Step 12: Add the clamp describe**

Append near the "pesos" describe:

```tsx
describe("CareEquationPage / clamp 100%", () => {
  it("clamps a raise that would exceed 100% and shows the limit hint", async () => {
    renderWithTheme(<CareEquationPage />);
    await screen.findByTestId("criteria-table");
    fireEvent.click(screen.getByTestId("stub-slide-values")); // request 40, no headroom
    expect(screen.getByTestId("weights-total")).toHaveTextContent("100%");
    expect(screen.getByTestId("limit-hint")).toBeInTheDocument();
    expect(screen.getByTestId("open-save-modal")).not.toBeDisabled();
    expect(headerBlocks().values).toBeCloseTo(0.36);
  });

  it("allows raising up to the exact 100% headroom", async () => {
    renderWithTheme(<CareEquationPage />);
    await screen.findByTestId("criteria-table");
    fireEvent.click(screen.getByTestId("stub-slide-values-30")); // 36 -> 30, sum 94
    fireEvent.click(screen.getByTestId("stub-slide-values")); // request 40 -> clamped to 36
    expect(screen.getByTestId("weights-total")).toHaveTextContent("100%");
    expect(headerBlocks().values).toBeCloseTo(0.36);
    expect(screen.getByTestId("limit-hint")).toBeInTheDocument();
  });

  it("lowers without clamping and without the hint", async () => {
    renderWithTheme(<CareEquationPage />);
    await screen.findByTestId("criteria-table");
    fireEvent.click(screen.getByTestId("stub-slide-values-30"));
    expect(screen.getByTestId("weights-total")).toHaveTextContent("94%");
    expect(screen.queryByTestId("limit-hint")).not.toBeInTheDocument();
    expect(headerBlocks().values).toBeCloseTo(0.3);
  });
});
```

- [ ] **Step 13: Add the profiles describe**

Append at the end of the file:

```tsx
describe("CareEquationPage / perfiles", () => {
  const savedProfile = {
    id: "p1",
    name: "Mi perfil",
    blocks: { ...CANONICAL_BLOCK_WEIGHTS, values: 0.3, music: 0.17 },
    chaos_factor: 2,
    created_by: "maria",
    created_at: "2026-10-17T00:00:00Z",
    updated_at: "2026-10-17T00:00:00Z",
  };

  it("loads saved profiles on mount", async () => {
    mockListProfiles.mockResolvedValueOnce([savedProfile]);
    renderWithTheme(<CareEquationPage />);
    const stub = await screen.findByTestId("profiles-stub");
    await waitFor(() => expect(stub).toHaveAttribute("data-count", "1"));
  });

  it("falls back to builtins when listing fails", async () => {
    mockListProfiles.mockRejectedValueOnce(new Error("boom"));
    renderWithTheme(<CareEquationPage />);
    const stub = await screen.findByTestId("profiles-stub");
    await waitFor(() => expect(stub).toHaveAttribute("data-count", "0"));
    expect(stub).toHaveAttribute("data-selected", "");
  });

  it("applies the selected profile to the draft", async () => {
    renderWithTheme(<CareEquationPage />);
    await screen.findByTestId("profiles-stub");
    fireEvent.click(screen.getByTestId("stub-profile-select-lowchaos"));
    expect(headerBlocks()).toEqual(CANONICAL_BLOCK_WEIGHTS);
    expect(
      screen.getByTestId("json-stub").getAttribute("data-value"),
    ).toContain('"chaos_factor": 1');
    expect(screen.getByTestId("profiles-stub")).toHaveAttribute(
      "data-selected",
      "builtin:lowchaos",
    );
  });

  it("marks the selection as modified after a manual edit", async () => {
    renderWithTheme(<CareEquationPage />);
    await screen.findByTestId("profiles-stub");
    fireEvent.click(screen.getByTestId("stub-profile-select-lowchaos"));
    expect(screen.getByTestId("profiles-stub")).toHaveAttribute(
      "data-modified",
      "false",
    );
    fireEvent.click(screen.getByTestId("stub-slide-values-30"));
    expect(screen.getByTestId("profiles-stub")).toHaveAttribute(
      "data-modified",
      "true",
    );
  });

  it("creates a profile from the save-as flow", async () => {
    const created = { ...savedProfile, id: "p2", name: "Nuevo" };
    mockCreateProfile.mockResolvedValueOnce(created);
    renderWithTheme(<CareEquationPage />);
    await screen.findByTestId("profiles-stub");
    fireEvent.click(screen.getByTestId("stub-profile-save-as"));
    const input = screen
      .getByTestId("profile-name-input")
      .querySelector("input") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "Nuevo" } });
    fireEvent.click(screen.getByTestId("profile-name-save"));
    await waitFor(() => expect(mockCreateProfile).toHaveBeenCalledTimes(1));
    expect(mockCreateProfile).toHaveBeenCalledWith({
      name: "Nuevo",
      blocks: active.blocks,
      chaos_factor: 5,
    });
    expect(await screen.findByTestId("profile-success")).toHaveTextContent(
      "Nuevo",
    );
    expect(screen.getByTestId("profiles-stub")).toHaveAttribute(
      "data-count",
      "1",
    );
    expect(screen.getByTestId("profiles-stub")).toHaveAttribute(
      "data-selected",
      "p2",
    );
  });

  it("surfaces a duplicate name error in the dialog", async () => {
    mockCreateProfile.mockRejectedValueOnce({
      isAxiosError: true,
      response: {
        status: 409,
        data: { detail: "Ya existe un perfil con ese nombre." },
      },
    });
    renderWithTheme(<CareEquationPage />);
    await screen.findByTestId("profiles-stub");
    fireEvent.click(screen.getByTestId("stub-profile-save-as"));
    const input = screen
      .getByTestId("profile-name-input")
      .querySelector("input") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "Repetido" } });
    fireEvent.click(screen.getByTestId("profile-name-save"));
    expect(await screen.findByTestId("profile-name-error")).toHaveTextContent(
      "Ya existe",
    );
  });

  it("updates a saved profile after confirmation", async () => {
    mockListProfiles.mockResolvedValueOnce([savedProfile]);
    mockUpdateProfile.mockResolvedValueOnce({ ...savedProfile, chaos_factor: 5 });
    renderWithTheme(<CareEquationPage />);
    await screen.findByTestId("profiles-stub");
    fireEvent.click(screen.getByTestId("stub-profile-select-saved"));
    fireEvent.click(screen.getByTestId("stub-profile-update"));
    fireEvent.click(screen.getByTestId("profile-confirm-accept"));
    await waitFor(() =>
      expect(mockUpdateProfile).toHaveBeenCalledWith("p1", {
        blocks: savedProfile.blocks,
        chaos_factor: 2,
      }),
    );
    expect(await screen.findByTestId("profile-success")).toHaveTextContent(
      "actualizado",
    );
  });

  it("deletes a saved profile after confirmation and clears selection", async () => {
    mockListProfiles.mockResolvedValueOnce([savedProfile]);
    mockDeleteProfile.mockResolvedValueOnce(undefined);
    renderWithTheme(<CareEquationPage />);
    await screen.findByTestId("profiles-stub");
    fireEvent.click(screen.getByTestId("stub-profile-select-saved"));
    fireEvent.click(screen.getByTestId("stub-profile-delete"));
    fireEvent.click(screen.getByTestId("profile-confirm-accept"));
    await waitFor(() => expect(mockDeleteProfile).toHaveBeenCalledWith("p1"));
    await waitFor(() =>
      expect(screen.getByTestId("profiles-stub")).toHaveAttribute(
        "data-count",
        "0",
      ),
    );
    expect(screen.getByTestId("profiles-stub")).toHaveAttribute(
      "data-selected",
      "",
    );
  });
});
```

- [ ] **Step 14: Run the full equation suite — expect green**

`npx jest src/pages/portal-redthread/care/equation.test.tsx --ci`
If a retained test fails because of the new behavior, fix the test (not the feature) and re-run. Then:

- [ ] **Step 15: Commit**

```bash
git add frontend/src/pages/portal-redthread/care/equation.tsx frontend/src/pages/portal-redthread/care/equation.test.tsx
git commit -m "feat(care-ui): perfiles, reestablecer, guardar y clamp 100% en el editor"
```

---

## Task 9: Full verification (frontend + backend)

- [ ] **Step 1: Frontend typecheck**

From `frontend/`: `npx tsc --noEmit`
Expected: no output.

- [ ] **Step 2: Frontend lint (touched files)**

`npx eslint src/services/careProfileService.ts src/utils/careProfileModel.ts src/utils/careCriteriaModel.ts src/components/care/CareProfilesPanel.tsx src/pages/portal-redthread/care/equation.tsx src/pages/portal-redthread/care/equation.test.tsx`
Expected: 0 errors; only the preexisting `require()` warnings inside test mocks are acceptable.

- [ ] **Step 3: Frontend full suite**

`npx jest --ci`
Expected: all suites green. Baseline was 68 suites / 624 tests; this work adds 4 new suites-worth of tests (`careProfileService`, `careProfileModel`, `CareProfilesPanel`, +new cases in `careCriteriaModel` and `equation`), all green.

- [ ] **Step 4: Backend full CARE suite + flake8**

From `backend/`:
`& "venv\Scripts\python.exe" -m pytest src/care/tests -q`
`& "venv\Scripts\python.exe" -m flake8 src/care/profiles src/care/models/care_profile.py src/api/admin_algorithms.py`
Expected: all green, flake8 silent.

- [ ] **Step 5: Spec test-matrix sanity check**

Confirm each spec-listed case exists (grep the test files):
- Backend: name validation, duplicate 409 (create + update), blocks+chaos validation reusing the formula messages, missing/invalid id 404, list sorted, delete.
- Frontend: presets sum and ids, `applyProfileToDraft` immutability, `profileMatchesDraft` percent/chaos tolerance, `profileErrorMessage` mappings, clamp cases, panel grouping/labels/disabled matrix, equation wiring (load, select, modified, create/update/delete flows, Reestablecer, Guardar disabled when unbalanced, limit-hint).
- Add nothing new here — this is a coverage checklist, not more code.

- [ ] **Step 6: Report**

Summarize for the user: files added/changed, suites run and their results, and the exact commands. Do not push. Ask before committing anything that is still uncommitted.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-10-17-care-perfiles-clamp.md` (spec: `docs/superpowers/specs/2026-10-17-care-perfiles-clamp-design.md`).

Two execution options:

1. **Subagent-Driven (recommended-ish):** Dispatch a fresh subagent per task with review checkpoints between tasks.
2. **Inline Execution:** Execute the tasks in this same session with checkpoints (this session has the full context; previous CARE blocks were done inline style with TDD).

The user already said "aplicalo"; the only open mechanical choice is 1 vs 2. Tasks 1–3 are strictly backend, 4–7 are isolated new frontend files, 8 depends on 4–7 — so subagents can parallelize 4–7 if desired.
