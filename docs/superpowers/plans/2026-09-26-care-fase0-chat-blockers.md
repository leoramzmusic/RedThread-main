# CARE Fase 0 — Bloqueadores P0 de Chat (Unificación Conversation) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Resolver P0-1 y P0-2 de `docs/CARE_ROADMAP.md` §2: crear `Relationship`+`Conversation` al nacer un match (y al aceptar amistad), servir historial sin 404, y alinear el frontend de chat sobre `conversation_id` de punta a punta — habilitando la prueba E2E like→match→chat.

**Architecture:** Se crea `src/services/conversation_service.py` con builders puros (unit-testeados sin Mongo) y orquestadores idempotentes `ensure_match_conversation`/`ensure_friend_conversation`, enganchados en los 3 puntos de transición a `MATCHED` (swipe mutuo, second-chance, unblock) más el `accept` de amistad. El chat se unifica sobre el sistema `Conversation`: el backend acepta `conversation_id` en REST/WS/clear manteniendo las rutas legacy `match_id` como fallback, y el frontend migra de `match_id` a `conversation_id`. Decisión de diseño: los hooks son llamadas directas idempotentes en cada transición (no un consumidor Kafka `MATCH_CREATED`, como sugería la spec) porque `discovery.py`, `reconsider` y `moderation.unblock` no pasan todos por Kafka, y la creación síncrona evita ventanas donde `/chat/conversations` no ve el match recién creado.

**Tech Stack:** Python 3.12 (FastAPI + Beanie/MongoDB + Motor), pytest 8.3.4 + pytest-asyncio 0.24.0, Next.js (TypeScript) + MUI, WebSocket nativo, Docker Compose.

**Spec:** `docs/CARE_ROADMAP.md` §2 (P0-1, P0-2) y `docs/CARE_ALGORITHM.md` §11.2/§11.5. El plan argumenta desde esa spec: léela antes de cada tarea.

**Fuentes verificadas en esta sesión** (código fuente leído con línea real): `chat.py`, `discovery.py`, `moderation.py`, `friends.py`, `conversation.py`, `relationship.py`, `message.py`, `match.py`, `chat/index.tsx`, `chat_consumer.py`, `backend/tests/`, `backend/scripts/`.

## Global Constraints

- **Sin commits sin aprobación explícita**: cada tarea termina en un checkpoint con `git diff --stat`; ejecutar los pasos de commit SOLO si el usuario lo autoriza (sistema: "NEVER commit changes unless the user explicitly asks").
- **Shell**: Windows PowerShell 5.1 — no existe `&&`; encadenar con `; if ($?) { ... }`.
- **Backend**: usar el venv del repo: `backend\venv\Scripts\python` (Python 3.12.10, pytest 8.3.4). Tests se corren desde `backend/` con `$env:PYTHONPATH="."` (patrón de `backend/tests/`: `from src...`).
- **Baseline backend**: `112 passed, 49 warnings in 4.20s`. Si al final no son ≥112 + los nuevos, la tarea falla.
- **Frontend**: `frontend/AGENTS.md` — este repo usa una versión de Next.js con breaking changes; NO se tocan APIs de Next en este plan (solo React/MUI dentro de `chat/index.tsx`; `getStaticProps` queda intacto). Si hubiera que tocar rutas/redirects Next, leer `node_modules/next/dist/docs/` primero.
- **Estilo de código**: sin comentarios inline nuevos (docstrings de módulo/función sí, siguiendo la convención del repo). Sin placeholders: todo el código del plan es código real.
- **Scope (YAGNI)**: NO se implementa P1-3 (icebreaker), P1-6 (deep links), ni se sincroniza `Relationship.status` al bloquear (el bloqueo sigue viviendo en `Match`; el WS consulta ambos). NO se renombra `IcebreakerButton.matchId` (su arreglo es P1-3).
- **Aceptación de la spec**: `Conversation` se crea al nacer el match y al aceptar amistad; DTO alineado; "like → match → chat E2E pasa sin 404".

## Global Commands

```powershell
# Suite backend completa (desde backend/) — baseline: 112 passed
cd backend; $env:PYTHONPATH="."; .\venv\Scripts\python -m pytest tests -q

# Solo tests nuevos
cd backend; $env:PYTHONPATH="."; .\venv\Scripts\python -m pytest tests\test_conversation_service.py tests\test_chat_resolvers.py -v

# Frontend (desde frontend/)
npm run lint; if ($?) { npx tsc --noEmit }

# E2E (desde la raíz del repo)
docker compose -f docker/docker-compose.local.yml up --build
```

---

### Task 1: `conversation_service.py` — builders puros + orquestadores idempotentes (TDD)

**Files:**
- Create: `backend/src/services/conversation_service.py`
- Test: `backend/tests/test_conversation_service.py`
- Create: `backend/tests/conftest.py` (shim de sesión `beanie._document_settings` para `Relationship`/`Conversation` — ruling R11: la suite nunca ejecuta `init_beanie()`)
- Modify: `backend/src/models/relationship.py` (índice compound **único** `(user_a_id, user_b_id, type)` vía `IndexModel` — ruling R12)
- Modify: `backend/src/models/conversation.py` (`relationship_id: Indexed(str, unique=True)`, quitar `"relationship_id"` de `Settings.indexes` — ruling R12)
- Create: `backend/scripts/dedupe_relationship_conversations.py` (dry-run por defecto, `--apply`: fusiona duplicados previos y reconcilia los índices únicos — ruling R12)
- Test: `backend/tests/test_dedupe_script.py` (lógica pura del script: merge de metadata, `_naive`, resolutor de índices — ruling R15, aprobado por el revisor)

**Interfaces:**
- Consumes: `Relationship.normalize_user_ids(user_id_1, user_id_2) -> tuple[str, str]` (`models/relationship.py:86`), modelos `Relationship`, `Conversation`, enums `RelationshipType/Status/Origin`, `ConversationType`.
- Produces (usado por Tasks 2, 3, 7, 9):
  - `build_match_relationship_fields(user_id_1: str, user_id_2: str) -> dict`
  - `build_conversation_fields(relationship_id: str, user_a_id: str, user_b_id: str, conversation_type: ConversationType) -> dict`
  - `async ensure_match_conversation(match) -> Conversation` — `match` solo necesita `.user_id_1`, `.user_id_2`, `.matched_at` (duck-typed)
  - `async ensure_friend_conversation(relationship: Relationship) -> Conversation`

- [ ] **Step 1: Escribir el test fallido (rojo)**

Reemplaza el contenido de `backend/tests/test_conversation_service.py` (R12):

```python
"""CARE F0 tests for conversation_service: pure builders + mocked orchestration."""

from datetime import datetime
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from pymongo.errors import DuplicateKeyError

from src.models.conversation import Conversation, ConversationType
from src.models.relationship import (
    Relationship,
    RelationshipOrigin,
    RelationshipStatus,
    RelationshipType,
)
from src.services.conversation_service import (
    build_conversation_fields,
    build_match_relationship_fields,
    ensure_friend_conversation,
    ensure_match_conversation,
)


class TestBuildMatchRelationshipFields:
    def test_normalizes_id_order(self):
        f1 = build_match_relationship_fields("user_b", "user_a")
        f2 = build_match_relationship_fields("user_a", "user_b")
        assert (f1["user_a_id"], f1["user_b_id"]) == ("user_a", "user_b")
        assert f1 == f2

    def test_enums(self):
        f = build_match_relationship_fields("u1", "u2")
        assert f["type"] == RelationshipType.MATCH
        assert f["status"] == RelationshipStatus.ACTIVE
        assert f["origin"] == RelationshipOrigin.DISCOVER

    def test_stringifies_ids(self):
        f = build_match_relationship_fields("abc", "def")
        assert (f["user_a_id"], f["user_b_id"]) == ("abc", "def")


class TestBuildConversationFields:
    def test_fields(self):
        f = build_conversation_fields("rel1", "u1", "u2", ConversationType.MATCH)
        assert f == {
            "relationship_id": "rel1",
            "type": ConversationType.MATCH,
            "participants": ["u1", "u2"],
        }


@pytest.mark.asyncio
async def test_ensure_match_upserts_relationship_and_conversation_when_missing():
    match = SimpleNamespace(user_id_1="u2", user_id_2="u1", matched_at=None)
    rel = Relationship(
        user_a_id="u1", user_b_id="u2",
        type=RelationshipType.MATCH,
        status=RelationshipStatus.ACTIVE,
        origin=RelationshipOrigin.DISCOVER,
    )
    conv = Conversation(
        relationship_id=str(rel.id),
        type=ConversationType.MATCH,
        participants=["u1", "u2"],
    )
    rel_col = MagicMock()
    rel_col.find_one_and_update = AsyncMock(return_value={"_id": "r1"})
    conv_col = MagicMock()
    conv_col.find_one_and_update = AsyncMock(return_value={"_id": "c1"})
    with patch.object(Relationship, "get_motor_collection", return_value=rel_col), \
            patch.object(Relationship, "find_one", new=AsyncMock(return_value=rel)) as rel_find, \
            patch.object(Conversation, "get_motor_collection", return_value=conv_col), \
            patch.object(Conversation, "find_one", new=AsyncMock(return_value=conv)) as conv_find:
        result = await ensure_match_conversation(match)

    rel_col.find_one_and_update.assert_awaited_once()
    rel_query, rel_update = rel_col.find_one_and_update.await_args.args
    assert rel_query == {
        "user_a_id": "u1",
        "user_b_id": "u2",
        "type": RelationshipType.MATCH,
    }
    assert rel_col.find_one_and_update.await_args.kwargs == {"upsert": True}
    rel_insert = rel_update["$setOnInsert"]
    assert rel_insert["user_a_id"] == "u1"
    assert rel_insert["user_b_id"] == "u2"
    assert rel_insert["type"] == RelationshipType.MATCH
    assert rel_insert["status"] == RelationshipStatus.ACTIVE
    assert rel_insert["origin"] == RelationshipOrigin.DISCOVER
    assert isinstance(rel_insert["created_at"], datetime)
    assert rel_insert["is_superlike"] is False
    assert "matched_at" not in rel_insert
    assert set(rel_update) == {"$setOnInsert"}
    rel_find.assert_awaited_once_with(rel_query)

    conv_col.find_one_and_update.assert_awaited_once()
    conv_query, conv_update = conv_col.find_one_and_update.await_args.args
    assert conv_query == {"relationship_id": str(rel.id)}
    assert conv_col.find_one_and_update.await_args.kwargs == {"upsert": True}
    conv_insert = conv_update["$setOnInsert"]
    assert conv_insert["relationship_id"] == str(rel.id)
    assert conv_insert["type"] == ConversationType.MATCH
    assert conv_insert["participants"] == ["u1", "u2"]
    assert isinstance(conv_insert["created_at"], datetime)
    assert conv_insert["unread_count"] == {}
    assert conv_insert["archived_by"] == []
    assert conv_insert["muted_by"] == []
    assert set(conv_update) == {"$setOnInsert"}
    conv_find.assert_awaited_once_with(conv_query)
    assert result is conv


@pytest.mark.asyncio
async def test_ensure_match_includes_matched_at_when_provided():
    matched_at = datetime(2026, 9, 26, 12, 0, 0)
    match = SimpleNamespace(user_id_1="u1", user_id_2="u2", matched_at=matched_at)
    rel = Relationship(
        user_a_id="u1", user_b_id="u2",
        type=RelationshipType.MATCH,
        status=RelationshipStatus.ACTIVE,
        origin=RelationshipOrigin.DISCOVER,
    )
    conv = Conversation(
        relationship_id=str(rel.id),
        type=ConversationType.MATCH,
        participants=["u1", "u2"],
    )
    rel_col = MagicMock()
    rel_col.find_one_and_update = AsyncMock(return_value={})
    conv_col = MagicMock()
    conv_col.find_one_and_update = AsyncMock(return_value={})
    with patch.object(Relationship, "get_motor_collection", return_value=rel_col), \
            patch.object(Relationship, "find_one", new=AsyncMock(return_value=rel)), \
            patch.object(Conversation, "get_motor_collection", return_value=conv_col), \
            patch.object(Conversation, "find_one", new=AsyncMock(return_value=conv)):
        await ensure_match_conversation(match)

    rel_insert = rel_col.find_one_and_update.await_args.args[1]["$setOnInsert"]
    assert rel_insert["matched_at"] == matched_at


@pytest.mark.asyncio
async def test_ensure_match_is_idempotent_when_both_exist():
    existing_rel = Relationship(
        user_a_id="u1", user_b_id="u2",
        type=RelationshipType.MATCH,
        status=RelationshipStatus.ACTIVE,
        origin=RelationshipOrigin.DISCOVER,
    )
    existing_conv = Conversation(
        relationship_id=str(existing_rel.id),
        type=ConversationType.MATCH,
        participants=["u1", "u2"],
    )
    match = SimpleNamespace(user_id_1="u1", user_id_2="u2", matched_at=None)
    rel_col = MagicMock()
    rel_col.find_one_and_update = AsyncMock(return_value={})
    conv_col = MagicMock()
    conv_col.find_one_and_update = AsyncMock(return_value={})
    with patch.object(Relationship, "get_motor_collection", return_value=rel_col), \
            patch.object(Relationship, "find_one", new=AsyncMock(return_value=existing_rel)), \
            patch.object(Conversation, "get_motor_collection", return_value=conv_col), \
            patch.object(Conversation, "find_one", new=AsyncMock(return_value=existing_conv)) as conv_find:
        result = await ensure_match_conversation(match)

    rel_col.find_one_and_update.assert_awaited_once()
    conv_col.find_one_and_update.assert_awaited_once()
    conv_find.assert_awaited_once_with({"relationship_id": str(existing_rel.id)})
    assert result is existing_conv


@pytest.mark.asyncio
async def test_ensure_match_relationship_duplicate_key_falls_back_to_find():
    match = SimpleNamespace(user_id_1="u1", user_id_2="u2", matched_at=None)
    existing_rel = Relationship(
        user_a_id="u1", user_b_id="u2",
        type=RelationshipType.MATCH,
        status=RelationshipStatus.ACTIVE,
        origin=RelationshipOrigin.DISCOVER,
    )
    existing_conv = Conversation(
        relationship_id=str(existing_rel.id),
        type=ConversationType.MATCH,
        participants=["u1", "u2"],
    )
    rel_col = MagicMock()
    rel_col.find_one_and_update = AsyncMock(side_effect=DuplicateKeyError("E11000 duplicate key"))
    conv_col = MagicMock()
    conv_col.find_one_and_update = AsyncMock(return_value={})
    with patch.object(Relationship, "get_motor_collection", return_value=rel_col), \
            patch.object(Relationship, "find_one", new=AsyncMock(return_value=existing_rel)) as rel_find, \
            patch.object(Conversation, "get_motor_collection", return_value=conv_col), \
            patch.object(Conversation, "find_one", new=AsyncMock(return_value=existing_conv)):
        result = await ensure_match_conversation(match)

    rel_col.find_one_and_update.assert_awaited_once()
    rel_find.assert_awaited_once_with({
        "user_a_id": "u1",
        "user_b_id": "u2",
        "type": RelationshipType.MATCH,
    })
    assert result is existing_conv


@pytest.mark.asyncio
async def test_ensure_friend_creates_conversation_when_missing():
    rel = SimpleNamespace(id="rel1", user_a_id="u1", user_b_id="u2")
    conv = Conversation(
        relationship_id="rel1",
        type=ConversationType.FRIEND,
        participants=["u1", "u2"],
    )
    conv_col = MagicMock()
    conv_col.find_one_and_update = AsyncMock(return_value={})
    with patch.object(Conversation, "get_motor_collection", return_value=conv_col), \
            patch.object(Conversation, "find_one", new=AsyncMock(return_value=conv)) as conv_find:
        result = await ensure_friend_conversation(rel)

    conv_query, conv_update = conv_col.find_one_and_update.await_args.args
    assert conv_query == {"relationship_id": "rel1"}
    assert conv_col.find_one_and_update.await_args.kwargs == {"upsert": True}
    conv_insert = conv_update["$setOnInsert"]
    assert conv_insert["relationship_id"] == "rel1"
    assert conv_insert["type"] == ConversationType.FRIEND
    assert conv_insert["participants"] == ["u1", "u2"]
    assert isinstance(conv_insert["created_at"], datetime)
    assert conv_insert["unread_count"] == {}
    assert conv_insert["archived_by"] == []
    assert conv_insert["muted_by"] == []
    assert set(conv_update) == {"$setOnInsert"}
    conv_find.assert_awaited_once_with(conv_query)
    assert result is conv


@pytest.mark.asyncio
async def test_ensure_friend_duplicate_key_falls_back_to_find():
    rel = SimpleNamespace(id="rel1", user_a_id="u1", user_b_id="u2")
    existing = Conversation(
        relationship_id="rel1",
        type=ConversationType.FRIEND,
        participants=["u1", "u2"],
    )
    conv_col = MagicMock()
    conv_col.find_one_and_update = AsyncMock(side_effect=DuplicateKeyError("E11000 duplicate key"))
    with patch.object(Conversation, "get_motor_collection", return_value=conv_col), \
            patch.object(Conversation, "find_one", new=AsyncMock(return_value=existing)) as conv_find:
        result = await ensure_friend_conversation(rel)

    conv_col.find_one_and_update.assert_awaited_once()
    conv_find.assert_awaited_once_with({"relationship_id": "rel1"})
    assert result is existing


@pytest.mark.asyncio
async def test_ensure_match_raises_when_relationship_missing_after_upsert():
    match = SimpleNamespace(user_id_1="u1", user_id_2="u2", matched_at=None)
    rel_col = MagicMock()
    rel_col.find_one_and_update = AsyncMock(side_effect=DuplicateKeyError("E11000 duplicate key"))
    with patch.object(Relationship, "get_motor_collection", return_value=rel_col), \
            patch.object(Relationship, "find_one", new=AsyncMock(return_value=None)):
        with pytest.raises(RuntimeError, match="upsert produced no relationship"):
            await ensure_match_conversation(match)


@pytest.mark.asyncio
async def test_ensure_friend_raises_when_conversation_missing_after_upsert():
    rel = SimpleNamespace(id="rel1", user_a_id="u1", user_b_id="u2")
    conv_col = MagicMock()
    conv_col.find_one_and_update = AsyncMock(side_effect=DuplicateKeyError("E11000 duplicate key"))
    with patch.object(Conversation, "get_motor_collection", return_value=conv_col), \
            patch.object(Conversation, "find_one", new=AsyncMock(return_value=None)):
        with pytest.raises(RuntimeError, match="upsert produced no conversation"):
            await ensure_friend_conversation(rel)
```

- [ ] **Step 2: Ejecutar para verificar que falla (rojo)**

Run: `cd backend; $env:PYTHONPATH="."; .\venv\Scripts\python -m pytest tests\test_conversation_service.py -v`
Expected: FAIL — los 4 tests de builders pasan y los 8 de ensure fallan (la implementación vigente no usa `get_motor_collection`): `AssertionError`/`TypeError` en los tests nuevos. Al re-ejecutar este step sobre una implementación que YA usa el upsert (p. ej. el rework R14) el RED esperado cambia: solo fallan los asserts de defaults y los 2 tests del None-guard (`KeyError` sobre el campo default ausente).

- [ ] **Step 3: Implementar `conversation_service.py`**

Reemplaza (R12) `backend/src/services/conversation_service.py`:

```python
"""CARE F0: Relationship + Conversation lifecycle.

Pure builders are unit-tested without Mongo; ensure_* orchestrators are
idempotent (safe to call from every match-transition hook and from backfill).
"""

from datetime import datetime
from typing import TYPE_CHECKING, Any

from pymongo.errors import DuplicateKeyError

from src.models.conversation import Conversation, ConversationType
from src.models.relationship import (
    Relationship,
    RelationshipOrigin,
    RelationshipStatus,
    RelationshipType,
)

if TYPE_CHECKING:
    from src.models.match import Match


def build_match_relationship_fields(user_id_1: str, user_id_2: str) -> dict[str, Any]:
    """Pure: kwargs to create a MATCH Relationship (normalized id order)."""
    user_a_id, user_b_id = Relationship.normalize_user_ids(str(user_id_1), str(user_id_2))
    return {
        "user_a_id": user_a_id,
        "user_b_id": user_b_id,
        "type": RelationshipType.MATCH,
        "status": RelationshipStatus.ACTIVE,
        "origin": RelationshipOrigin.DISCOVER,
    }


def build_conversation_fields(
    relationship_id: str,
    user_a_id: str,
    user_b_id: str,
    conversation_type: ConversationType,
) -> dict[str, Any]:
    """Pure: kwargs to create a Conversation linked to a relationship."""
    return {
        "relationship_id": relationship_id,
        "type": conversation_type,
        "participants": [user_a_id, user_b_id],
    }


async def _upsert_relationship(query: dict[str, Any], on_insert: dict[str, Any]) -> Relationship:
    """Atomic create-or-fetch: unique (user_a_id, user_b_id, type) index + upsert."""
    try:
        await Relationship.get_motor_collection().find_one_and_update(
            query, {"$setOnInsert": on_insert}, upsert=True
        )
    except DuplicateKeyError:
        pass
    relationship = await Relationship.find_one(query)
    if relationship is None:
        raise RuntimeError(f"upsert produced no relationship for {query}")
    return relationship


async def _upsert_conversation(query: dict[str, Any], on_insert: dict[str, Any]) -> Conversation:
    """Atomic create-or-fetch: unique relationship_id index + upsert."""
    try:
        await Conversation.get_motor_collection().find_one_and_update(
            query, {"$setOnInsert": on_insert}, upsert=True
        )
    except DuplicateKeyError:
        pass
    conversation = await Conversation.find_one(query)
    if conversation is None:
        raise RuntimeError(f"upsert produced no conversation for {query}")
    return conversation


async def ensure_match_conversation(match: "Match") -> Conversation:
    """Idempotently create Relationship(MATCH) + Conversation for a matched pair."""
    fields = build_match_relationship_fields(match.user_id_1, match.user_id_2)
    relationship = await _upsert_relationship(
        {
            "user_a_id": fields["user_a_id"],
            "user_b_id": fields["user_b_id"],
            "type": RelationshipType.MATCH,
        },
        {
            **fields,
            "created_at": datetime.utcnow(),
            "is_superlike": False,
            **({"matched_at": match.matched_at} if match.matched_at else {}),
        },
    )

    conversation = await _upsert_conversation(
        {"relationship_id": str(relationship.id)},
        {
            **build_conversation_fields(
                str(relationship.id),
                relationship.user_a_id,
                relationship.user_b_id,
                ConversationType.MATCH,
            ),
            "created_at": datetime.utcnow(),
            "unread_count": {},
            "archived_by": [],
            "muted_by": [],
        },
    )
    return conversation


async def ensure_friend_conversation(relationship: "Relationship") -> Conversation:
    """Idempotently create the Conversation for an accepted FRIEND relationship."""
    return await _upsert_conversation(
        {"relationship_id": str(relationship.id)},
        {
            **build_conversation_fields(
                str(relationship.id),
                relationship.user_a_id,
                relationship.user_b_id,
                ConversationType.FRIEND,
            ),
            "created_at": datetime.utcnow(),
            "unread_count": {},
            "archived_by": [],
            "muted_by": [],
        },
    )
```

- [ ] **Step 4: Ejecutar para verificar que pasa (verde)**

Run: `cd backend; $env:PYTHONPATH="."; .\venv\Scripts\python -m pytest tests\test_conversation_service.py -v`
Expected: `17 passed`

- [ ] **Step 5: Índices únicos en los modelos (R12)**

`backend/src/models/relationship.py`:
- añadir import: `from pymongo import IndexModel`
- en `Settings.indexes` sustituir la línea `            [("user_a_id", 1), ("user_b_id", 1)],  # Compound index` por:

```python
            IndexModel([("user_a_id", 1), ("user_b_id", 1), ("type", 1)], unique=True),  # Compound index
```

`backend/src/models/conversation.py`:
- cambiar el import a `from beanie import Document, Indexed`
- cambiar el campo a `    relationship_id: Indexed(str, unique=True)  # Reference to Relationship document`
- en `Settings.indexes` eliminar la entrada `"relationship_id",` (el campo ya la declara; dos declaraciones con opciones distintas provocarían `IndexOptionsConflict` al arrancar)

Verificación: `.\venv\Scripts\python -c "import ast; ast.parse(open(r'backend\src\models\relationship.py', encoding='utf-8').read()); ast.parse(open(r'backend\src\models\conversation.py', encoding='utf-8').read()); print('SYNTAX OK')"`

- [ ] **Step 6: Script de reconciliación `dedupe_relationship_conversations.py` (R12)**

Crea `backend/scripts/dedupe_relationship_conversations.py`:

```python
r"""CARE F0 (R12): dedupe Relationship/Conversation duplicates and reconcile unique indexes.

Dry-run by default: prints a report and changes nothing. From backend/ with Mongo running:
    $env:PYTHONPATH="."; .\venv\Scripts\python scripts\dedupe_relationship_conversations.py
    $env:PYTHONPATH="."; .\venv\Scripts\python scripts\dedupe_relationship_conversations.py --apply

Run with --apply BEFORE the first boot with the R12 unique indexes whenever data may contain
duplicates: beanie creates model indexes at init and unique-index creation fails while
duplicates exist. Fresh databases need no data cleanup; --apply then only (re)creates indexes.

--apply is not transactional: if it aborts, re-run it. Every step reloads from the database, so
repeated runs converge to the same result; exit code 1 means manual relationship groups or index
problems are still pending.

The merged unread_count is the SUM of the duplicates' counters, so it can over-count a user who
already read one copy: treat it as an upper bound, not an authoritative count. It is also the one
merged field that is NOT re-run safe: the keeper is saved before the losers are deleted, so a crash
in that window double-counts on the next run. Every other merged field is order-independent.
"""

import argparse
import asyncio
import sys
from collections import defaultdict
from datetime import datetime

from beanie import init_beanie
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.errors import OperationFailure

from src.core.config import settings
from src.models.conversation import Conversation
from src.models.message import Message
from src.models.relationship import Relationship


def pair_key(rel: Relationship) -> tuple[str, str, str]:
    user_lo, user_hi = sorted((rel.user_a_id, rel.user_b_id))
    return (user_lo, user_hi, str(rel.type))


def _naive(value):
    if value is None:
        return None
    return value.replace(tzinfo=None) if value.tzinfo else value


async def load() -> tuple[list, list]:
    relationships = await Relationship.find_all().to_list()
    conversations = await Conversation.find_all().to_list()
    return relationships, conversations


def relationship_groups(relationships: list) -> dict:
    groups: dict[tuple, list] = defaultdict(list)
    for rel in relationships:
        groups[pair_key(rel)].append(rel)
    return {k: v for k, v in groups.items() if len(v) > 1}


def conversation_groups(conversations: list) -> dict:
    groups: dict[str, list] = defaultdict(list)
    for conv in conversations:
        groups[conv.relationship_id].append(conv)
    return {k: v for k, v in groups.items() if len(v) > 1}


async def fix_orientation(unnormalized: list) -> int:
    for rel in unnormalized:
        user_lo, user_hi = sorted((rel.user_a_id, rel.user_b_id))
        rel.user_a_id = user_lo
        rel.user_b_id = user_hi
        await rel.save()
    return len(unnormalized)


async def merge_relationship_groups(rel_dups: dict, conv_rel_ids: set) -> tuple[int, list, list]:
    merged = 0
    manual = []
    warnings = []
    for key, group in rel_dups.items():
        if len({str(r.status) for r in group}) > 1:
            manual.append((key, group))
            continue
        candidates = [r for r in group if str(r.id) in conv_rel_ids] or group
        keeper = min(
            candidates,
            key=lambda r: (_naive(r.created_at) or datetime.min, str(r.id)),
        )
        best_affinity = max((r.affinity_score or 0.0 for r in group), default=0.0)
        if best_affinity > 0:
            source = next(
                (r for r in group if (r.affinity_score or 0.0) == best_affinity),
                keeper,
            )
            keeper.affinity_score = best_affinity
            keeper.affinity_breakdown = source.affinity_breakdown
        keeper.matched_at = min(
            (_naive(r.matched_at) for r in group if r.matched_at),
            default=None,
        )
        keeper.accepted_at = min(
            (_naive(r.accepted_at) for r in group if r.accepted_at),
            default=None,
        )
        keeper.is_superlike = any(r.is_superlike for r in group)
        for field in ("origin", "requester_id", "blocked_by", "user_a_interaction", "user_b_interaction"):
            values = {str(getattr(r, field)) for r in group}
            if len(values) > 1:
                warnings.append(
                    f"{key}: divergent {field} {sorted(values)}; kept {getattr(keeper, field)}"
                )
        await keeper.save()
        for loser in group:
            if loser.id == keeper.id:
                continue
            await Conversation.find({"relationship_id": str(loser.id)}).update(
                {"$set": {"relationship_id": str(keeper.id)}}
            )
            await loser.delete()
            merged += 1
        print(f"merged relationship {key}: keeper={keeper.id}, removed={len(group) - 1}")
    return merged, manual, warnings


async def merge_conversation_groups(conv_dups: dict) -> int:
    merged = 0
    for rel_id, group in conv_dups.items():
        with_messages = [
            c
            for c in group
            if await Message.get_motor_collection().count_documents(
                {"conversation_id": str(c.id)}
            )
            > 0
        ]
        candidates = with_messages or group
        keeper = min(candidates, key=lambda c: c.id)
        losers = [c for c in group if c.id != keeper.id]
        for loser in losers:
            await Message.find({"conversation_id": str(loser.id)}).update(
                {"$set": {"conversation_id": str(keeper.id)}}
            )
        best = max(
            group,
            key=lambda c: (
                c.last_message_at is not None,
                _naive(c.last_message_at) or datetime.min,
            ),
        )
        keeper.last_message_at = _naive(best.last_message_at)
        keeper.last_message_content = best.last_message_content
        keeper.last_message_sender_id = best.last_message_sender_id
        unread: dict = {}
        archived: set = set()
        muted: set = set()
        for c in group:
            for uid, count in (c.unread_count or {}).items():
                unread[uid] = unread.get(uid, 0) + count
            archived.update(c.archived_by)
            muted.update(c.muted_by)
        keeper.unread_count = unread
        keeper.archived_by = sorted(archived)
        keeper.muted_by = sorted(muted)
        await keeper.save()
        for loser in losers:
            await loser.delete()
        merged += len(losers)
        print(f"merged conversations for {rel_id}: keeper={keeper.id}, removed={len(losers)}")
    return merged


async def index_state() -> dict:
    rel_indexes = await Relationship.get_motor_collection().index_information()
    conv_indexes = await Conversation.get_motor_collection().index_information()
    rel_unique = any(
        info.get("unique")
        and list(info["key"]) == [("user_a_id", 1), ("user_b_id", 1), ("type", 1)]
        for info in rel_indexes.values()
    )
    conv_unique = bool(conv_indexes.get("relationship_id_1", {}).get("unique"))
    return {
        "relationships (user_a_id, user_b_id, type)": rel_unique,
        "conversations (relationship_id)": conv_unique,
    }


async def reconcile_indexes() -> list[str]:
    problems = []
    rel_coll = Relationship.get_motor_collection()
    try:
        await rel_coll.create_index(
            [("user_a_id", 1), ("user_b_id", 1), ("type", 1)], unique=True
        )
        print("created unique index: relationships (user_a_id, user_b_id, type)")
    except OperationFailure as err:
        if getattr(err, "code", None) == 11000:
            print("relationships still have duplicates — resolve manual groups first")
        problems.append(f"relationships unique index: {err}")
    rel_indexes = await rel_coll.index_information()
    if "user_a_id_1_user_b_id_1" in rel_indexes:
        try:
            await rel_coll.drop_index("user_a_id_1_user_b_id_1")
            print("dropped obsolete index: relationships (user_a_id, user_b_id)")
        except OperationFailure as err:
            problems.append(f"obsolete relationships index: {err}")
    conv_coll = Conversation.get_motor_collection()
    try:
        await conv_coll.create_index("relationship_id", unique=True)
        print("created unique index: conversations (relationship_id)")
    except OperationFailure as err:
        if getattr(err, "code", None) not in (85, 86):
            problems.append(f"conversations unique index: {err}")
            return problems
        conv_indexes = await conv_coll.index_information()
        conflicting = next(
            (
                name
                for name, info in conv_indexes.items()
                if list(info["key"]) == [("relationship_id", 1)]
            ),
            None,
        )
        if conflicting is None:
            problems.append("conversations index conflict without a matching key pattern")
            return problems
        await conv_coll.drop_index(conflicting)
        try:
            await conv_coll.create_index("relationship_id", unique=True)
            print(
                "recreated index as unique: conversations (relationship_id) "
                f"[dropped {conflicting}]"
            )
        except OperationFailure as err2:
            problems.append(f"conversations unique index: {err2}")
    return problems


async def main() -> int:
    parser = argparse.ArgumentParser(
        description="Dedupe relationships/conversations and reconcile unique indexes"
    )
    parser.add_argument(
        "--apply",
        action="store_true",
        help="perform merges and index fixes (default: report only)",
    )
    args = parser.parse_args()

    client = AsyncIOMotorClient(settings.MONGODB_URL)
    await init_beanie(
        database=client[settings.MONGODB_DB_NAME],
        document_models=[Relationship, Conversation, Message],
    )

    relationships, conversations = await load()
    unnormalized = [r for r in relationships if r.user_a_id > r.user_b_id]
    rel_dups = relationship_groups(relationships)
    conv_dups = conversation_groups(conversations)
    rel_ids = {str(r.id) for r in relationships}
    orphans = [c for c in conversations if c.relationship_id not in rel_ids]
    indexes = await index_state()

    print(f"relationships: {len(relationships)}, duplicate groups: {len(rel_dups)}")
    for key, group in rel_dups.items():
        statuses = sorted({str(r.status) for r in group})
        diverged = sorted(
            field
            for field in ("origin", "requester_id", "blocked_by", "user_a_interaction", "user_b_interaction")
            if len({str(getattr(r, field)) for r in group}) > 1
        )
        flag = "MANUAL" if len(statuses) > 1 else "auto-merge"
        if diverged and len(statuses) == 1:
            flag = f"auto-merge (divergent: {','.join(diverged)})"
        print(f"  {key}: ids={[str(r.id) for r in group]} statuses={statuses} -> {flag}")
    print(f"unnormalized pairs: {len(unnormalized)}")
    print(f"conversations: {len(conversations)}, duplicate groups: {len(conv_dups)}")
    for rel_id, group in conv_dups.items():
        print(f"  relationship_id={rel_id}: ids={[str(c.id) for c in group]}")
    print(f"orphan conversations: {len(orphans)}")
    for name, ok in indexes.items():
        print(f"index {name} unique: {'yes' if ok else 'NO'}")

    if not args.apply:
        client.close()
        return 0

    if unnormalized:
        print(f"normalizing {await fix_orientation(unnormalized)} relationships")
    conv_rel_ids = {c.relationship_id for c in conversations}
    _, manual, warnings = await merge_relationship_groups(rel_dups, conv_rel_ids)
    conversations = (await load())[1]
    conv_dups = conversation_groups(conversations)
    merged = await merge_conversation_groups(conv_dups)
    print(f"conversations merged: {merged}")
    problems = await reconcile_indexes()
    print(f"manual relationship groups pending: {len(manual)}")
    for problem in problems:
        print(f"PROBLEM: {problem}")
    for warning in warnings:
        print(f"WARNING: {warning}")
    client.close()
    return 1 if (problems or manual) else 0


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
```

Verificación: `cd backend; .\venv\Scripts\python -c "import ast; ast.parse(open('scripts/dedupe_relationship_conversations.py', encoding='utf-8').read()); print('SYNTAX OK')"`
Expected: `SYNTAX OK`

**Orden operativo (R12):** en entornos con datos posiblemente duplicados (producción), ejecutar el script con `--apply` ANTES del primer arranque con este código: beanie crea los índices del modelo en `init_beanie` y la creación de un índice único falla si aún hay duplicados (el arranque fallaría en consecuencia). Bases de datos nuevas (docker local, tests) no necesitan limpieza de datos.

- [ ] **Step 6b: Tests del script de deduplicación (R15)**

Crea `backend/tests/test_dedupe_script.py` (6º archivo de Task 1, aprobado por el revisor: el merge de metadata y el resolutor de índices son lógica pura y corren contra datos de producción):

```python
import importlib.util
from datetime import datetime, timezone
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from pymongo.errors import OperationFailure

from src.models.conversation import Conversation, ConversationType
from src.models.relationship import (
    Relationship,
    RelationshipOrigin,
    RelationshipStatus,
    RelationshipType,
)

SCRIPT_PATH = Path(__file__).resolve().parents[1] / "scripts" / "dedupe_relationship_conversations.py"


def _load_script():
    spec = importlib.util.spec_from_file_location("dedupe_relationship_conversations", SCRIPT_PATH)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


script = _load_script()


def _relationship(rel_id, created_at, **overrides):
    fields = {
        "user_a_id": "u1",
        "user_b_id": "u2",
        "type": RelationshipType.MATCH,
        "status": RelationshipStatus.ACTIVE,
        "origin": RelationshipOrigin.DISCOVER,
        "created_at": created_at,
    }
    fields.update(overrides)
    rel = Relationship(**fields)
    rel.id = rel_id
    return rel


def _patch_writes():
    query = MagicMock()
    query.update = AsyncMock()
    return (
        patch.object(Relationship, "save", new=AsyncMock()),
        patch.object(Relationship, "delete", new=AsyncMock()),
        patch.object(Conversation, "find", return_value=query),
    ), query


def test_naive_strips_tzinfo_and_passes_through_none():
    aware = datetime(2026, 9, 26, 12, 0, tzinfo=timezone.utc)
    naive = datetime(2026, 9, 26, 12, 0)
    assert script._naive(aware) == naive
    assert script._naive(naive) is naive
    assert script._naive(None) is None


@pytest.mark.asyncio
async def test_merge_keeps_earliest_created_and_max_aggregates():
    older = _relationship(
        "aaaaaaaaaaaaaaaaaaaaaaaa",
        datetime(2026, 1, 1),
        matched_at=datetime(2026, 1, 2),
        affinity_score=0.4,
        affinity_breakdown={"care": 0.4},
    )
    newer = _relationship(
        "bbbbbbbbbbbbbbbbbbbbbbbb",
        datetime(2026, 3, 1),
        matched_at=datetime(2026, 2, 1),
        affinity_score=0.9,
        affinity_breakdown={"care": 0.9},
        is_superlike=True,
    )
    patches, query = _patch_writes()
    with patches[0], patches[1], patches[2]:
        merged, manual, warnings = await script.merge_relationship_groups(
            {("u1", "u2", "match"): [older, newer]}, set()
        )

    assert (merged, manual, warnings) == (1, [], [])
    assert older.created_at == datetime(2026, 1, 1)
    assert older.matched_at == datetime(2026, 1, 2)
    assert older.affinity_score == 0.9
    assert older.affinity_breakdown == {"care": 0.9}
    assert older.is_superlike is True
    query.update.assert_awaited_once_with(
        {"$set": {"relationship_id": "aaaaaaaaaaaaaaaaaaaaaaaa"}}
    )


@pytest.mark.asyncio
async def test_merge_mixed_status_goes_to_manual_without_writes():
    blocked = _relationship(
        "aaaaaaaaaaaaaaaaaaaaaaaa",
        datetime(2026, 1, 1),
        status=RelationshipStatus.BLOCKED,
        blocked_by="u1",
    )
    active = _relationship("bbbbbbbbbbbbbbbbbbbbbbbb", datetime(2026, 2, 1))
    with patch.object(Relationship, "save", new=AsyncMock()) as save_mock, \
            patch.object(Relationship, "delete", new=AsyncMock()) as delete_mock:
        merged, manual, warnings = await script.merge_relationship_groups(
            {("u1", "u2", "match"): [blocked, active]}, set()
        )

    assert merged == 0
    assert warnings == []
    assert manual == [(("u1", "u2", "match"), [blocked, active])]
    save_mock.assert_not_awaited()
    delete_mock.assert_not_awaited()


@pytest.mark.asyncio
async def test_merge_reports_divergent_fields_as_warnings():
    discover = _relationship(
        "aaaaaaaaaaaaaaaaaaaaaaaa",
        datetime(2026, 1, 1),
        origin=RelationshipOrigin.DISCOVER,
        blocked_by="u1",
    )
    requested = _relationship(
        "bbbbbbbbbbbbbbbbbbbbbbbb",
        datetime(2026, 1, 5),
        origin=RelationshipOrigin.FRIEND_REQUEST,
        blocked_by="u2",
    )
    patches, _ = _patch_writes()
    with patches[0], patches[1], patches[2]:
        merged, manual, warnings = await script.merge_relationship_groups(
            {("u1", "u2", "match"): [discover, requested]}, set()
        )

    assert merged == 1
    assert manual == []
    assert any("divergent origin" in warning for warning in warnings)
    assert any("divergent blocked_by" in warning for warning in warnings)


@pytest.mark.asyncio
async def test_reconcile_resolves_custom_index_name_on_code_86():
    rel_coll = MagicMock()
    rel_coll.create_index = AsyncMock(return_value="user_a_id_1_user_b_id_1_type_1")
    rel_coll.index_information = AsyncMock(return_value={})
    conv_coll = MagicMock()
    conv_coll.create_index = AsyncMock(
        side_effect=[OperationFailure("IndexKeySpecsConflict", code=86), None]
    )
    conv_coll.index_information = AsyncMock(
        return_value={
            "relationship_id_custom": {"key": [("relationship_id", 1)], "unique": False},
        }
    )
    conv_coll.drop_index = AsyncMock()
    with patch.object(Relationship, "get_motor_collection", return_value=rel_coll), \
            patch.object(Conversation, "get_motor_collection", return_value=conv_coll):
        problems = await script.reconcile_indexes()

    conv_coll.drop_index.assert_awaited_once_with("relationship_id_custom")
    assert problems == []
```

Run: `cd backend; $env:PYTHONPATH="."; .\venv\Scripts\python -m pytest tests\test_dedupe_script.py -v`
Expected: `5 passed` (RED antes de aplicar: los tests de `_naive`, del resolutor de índices y del breakdown de afinidad fallan con el script de la versión previa de este step)

- [ ] **Step 7: Suite completa + checkpoint**

Run: `cd backend; $env:PYTHONPATH="."; .\venv\Scripts\python -m pytest tests -q`
Expected: `129 passed` (baseline 112 + 17 de este task)

Run: `git status; git diff --stat`
Commit propuesto (solo si el usuario aprueba): `fix(chat): make ensure_* atomic with unique indexes (R12)`

---

### Task 2: Hooks en los 3 puntos de transición a `MATCHED`

**Files:**
- Modify: `backend/src/api/discovery.py:750` (tras `await current_user.save()`, rama existing-match del swipe)
- Modify: `backend/src/api/discovery.py:1188` (tras `await match.save()` en `/second-chance/{match_id}/reconsider`)
- Modify: `backend/src/api/moderation.py:105` (tras `await match.save()` en `/unblock`)
- Modify: imports de ambos archivos

**Interfaces:**
- Consumes: `ensure_match_conversation(match)` (Task 1).
- Produces: `Relationship`+`Conversation` creados en cada match nuevo; backfill manual re-invocando el mismo servicio (Task 3).

Contexto verificado: los únicos sitios que asignan `MatchStatus.MATCHED` son `discovery.py:746` (swipe mutuo), `discovery.py:1181` (reconsider) y `moderation.py:102` (unblock). `discovery.py:889` y `home.py:94` son filtros de lectura (sin hook). El bloqueo (`moderation.py:65`) NO toca `Relationship` — fuera de scope.

> **R16 (2026-09-26, Task 2 Approved)** — La frase "los únicos sitios" era **falsa**: hay un 4º en `backend/src/services/discovery/routes.py:161` (handler `/swipe` duplicado en la capa de microservicios legacy). **No se hookea** porque esa capa es inarrancable: los 8/8 `backend/src/services/*/main.py` importan `src.db.utils.connection`, módulo inexistente (`init_db` real = `src/core/database.py:40`) → `ImportError` al importar el módulo; y el stack desplegado real (`docker-compose.yml:32-33`, `context: ./backend`) corre el monolito `src/main.py`, que monta `src.api.discovery` (`src/main.py:168`) — sí hookeado. El stack de `docker/docker-compose.local.yml` (que sí define `redthread-discovery-service`) no puede arrancar. Deuda: la capa `src/services/*` duplica lógica de API y está muerta por imports rotos — **si alguien la resucita, necesita este hook**.

- [ ] **Step 1: Añadir import en `discovery.py`**

En el bloque de imports de `src.api/discovery.py` (junto a los demás `from src.services...`), añade:

```python
from src.services.conversation_service import ensure_match_conversation
```

- [ ] **Step 2: Hook tras el swipe mutuo**

En `discovery.py`, inmediatamente después de la línea 750 (`await current_user.save() # Save user counters`) y antes del bloque `# Emit Kafka events` (línea 752), inserta:

```python
        if existing_match.status == MatchStatus.MATCHED:
            try:
                await ensure_match_conversation(existing_match)
            except Exception as conv_err:
                print(f"Conversation creation error (swipe): {conv_err}")
```

- [ ] **Step 3: Hook en el endpoint reconsider**

En `discovery.py`, inmediatamente después de la línea 1188 (`await match.save()` en `reconsider_profile`), inserta:

```python
    if match.status == MatchStatus.MATCHED:
        try:
            await ensure_match_conversation(match)
        except Exception as conv_err:
            print(f"Conversation creation error (reconsider): {conv_err}")
```

- [ ] **Step 4: Añadir import y hook en `moderation.py`**

Import (junto a los demás `from src...` de `moderation.py`):

```python
from src.services.conversation_service import ensure_match_conversation
```

Tras la línea 105 (`await match.save()` en `unblock_user`, justo antes del `return`), inserta:

```python
    try:
        await ensure_match_conversation(match)
    except Exception as conv_err:
        print(f"Conversation creation error (unblock): {conv_err}")
```

(Sin guard: en este punto `match.status` acaba de fijarse a `MATCHED` en la línea 102.)

- [ ] **Step 5: Verificar que nada rompió**

Run: `cd backend; $env:PYTHONPATH="."; .\venv\Scripts\python -m pytest tests -q`
Expected: `129 passed` (baseline 112 + 17 de Task 1; los tests existentes no tocan estos endpoints; el import nuevo no debe romper — `conversation_service` solo importa modelos).

Verificación de sintaxis de los dos archivos modificados:

```powershell
cd backend; .\venv\Scripts\python -c "import ast; ast.parse(open('src/api/discovery.py', encoding='utf-8').read()); ast.parse(open('src/api/moderation.py', encoding='utf-8').read()); print('SYNTAX OK')"
```

Expected: `SYNTAX OK`

- [ ] **Step 6: Checkpoint — mostrar diff, commit SOLO con aprobación**

Run: `git diff --stat`
Commit propuesto: `feat(chat): create conversation on match transitions (CARE F0/P0-2)`

---

### Task 3: Script de backfill para matches existentes

**Files:**
- Create: `backend/scripts/backfill_conversations.py`

**Interfaces:**
- Consumes: `ensure_match_conversation`, `ensure_friend_conversation` (Task 1), `settings` de `src.config` (patrón de `backend/verify_chat.py` y `backend/scripts/*`).
- Produces: script idempotente; Task 9 lo ejecuta como paso previo al E2E. Sin imports desde otros módulos.

Motivo: los matches/friendships ya existentes en la BD de desarrollo nunca transicionan de nuevo → sin backfill, la lista `/chat/conversations` seguiría vacía para usuarios con historial previo.

- [ ] **Step 1: Crear el script**

> **R17 (2026-09-26, auditoría previa a Task 3)** — El Step 1 usaba `await Conversation.count()`. **Corrección de mi propio fundamento: `Document.count()` SÍ existe en beanie 1.27.0** — está en `beanie/odm/interfaces/find.py:426`, cuerpo `return await cls.find_all().count()`, docstring "The same as find_all().count()". Mi verificación original miró solo `beanie/odm/documents.py` (donde no está) y concluyó mal. Se mantiene `find_all().count()`: es equivalente, es el patrón real del repo (`admin_empleados.py:141`, `verify_seeds.py:12`) y no depende de la interface. Verificado sin cambios: `settings.MONGODB_URL`/`MONGODB_DB_NAME` (`src/core/config.py:20-21`), firmas `ensure_match_conversation(match)` (`conversation_service.py:78`) y `ensure_friend_conversation(relationship)` (`:113`), `RelationshipType.FRIEND`/`RelationshipStatus.ACTIVE`, y el patrón dict+str-Enum (`Match.find({"status": MatchStatus.MATCHED})`) con precedente en `home.py:88-94`, `discovery.py:890-895`, `chat/routes.py:164-169`. Trampa de nombre: existe **otro** `RelationshipStatus` en `src/models/profile.py:46` (SINGLE/MARRIED); el import explícito desde `src.models.relationship` lo evita.

> **R19 (2026-09-26, revisión de Task 3)** — Endurecimiento de control de flujo aplicado al bloque de abajo: `client.close()` pasa a `finally` (antes no se cerraba si algo reventaba) y el crash pasa a código de salida **2** con mensaje, para que el exit code sea un oráculo fiable en Task 9 (**0** = ok, **1** = corrió con errores por fila, **2** = no pudo completarse). Se añade un `WARNING` cuando los filtros no matchean ninguna fila (antes "no hice nada" salía con exit 0), **sin** cambiar el contrato de exit 0 para una BD legítimamente vacía. El mensaje de crash recuerda el prerequisito de dedupe (`--apply` antes del primer arranque, porque `init_beanie` construye los índices únicos).

> **R20 (2026-09-26, revisión de Task 3)** — Important del revisor RECHAZADO con fundamento técnico: `to_list()` deserializa todas las filas antes de los `try`, así que un documento legacy malformado aborta todo el backfill. El fix propuesto (`async for` sobre el find query) **no funciona**: `FindQuery` no define `__aiter__` (verificado en runtime: `hasattr(FindQuery, '__aiter__') == False`; `__aiter__` solo existe en `beanie/odm/queries/cursor.py:38`, y el único precedente del repo, `find_user.py:10`, itera un cursor **motor crudo**, no un FindQuery). El aislamiento real exigiría saltarse la capa ORM (`get_motor_collection().find()` + validación documento a documento), introduciendo riesgos nuevos (decodificación divergente de la de beanie, datetimes tz-aware) a cambio de progreso parcial ante datos malformados. El fallo actual es **ruidoso e inmediato**, no silencioso, y el script es one-shot de desarrollo ejecutado una vez en Task 9. Riesgo aceptado y documentado.

Crea `backend/scripts/backfill_conversations.py`:

> **R18 (2026-09-26,第二次 auditoría de Task 3)** — El docstring del Step 1 no era raw: la línea de uso `.\venv\Scripts\python ...` produce `SyntaxWarning: invalid escape sequence '\S'` (detectado por el implementador al compilar; `ast.parse` no lo emite) y CPython prevé convertirlo en `SyntaxError`. **Corregido a `r"""CARE F0 backfill: ...`**, que es exactamente lo que ya hace el script dedupe de Task 1 (`dedupe_relationship_conversations.py:1`) → precedente del repo, mismo warning, mismo fix. Contenido del docstring inalterado.

```python
r"""CARE F0 backfill: create Relationship+Conversation for existing connections.

Idempotent — safe to re-run. From backend/ with Mongo running:
    $env:PYTHONPATH="."; .\venv\Scripts\python scripts\backfill_conversations.py
"""

import asyncio
import sys

from beanie import init_beanie
from motor.motor_asyncio import AsyncIOMotorClient

from src.core.config import settings
from src.models.conversation import Conversation
from src.models.match import Match, MatchStatus
from src.models.relationship import (
    Relationship,
    RelationshipStatus,
    RelationshipType,
)
from src.services.conversation_service import (
    ensure_friend_conversation,
    ensure_match_conversation,
)


async def main() -> int:
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    try:
        await init_beanie(
            database=client[settings.MONGODB_DB_NAME],
            document_models=[Match, Relationship, Conversation],
        )

        before = await Conversation.find_all().count()

        matches = await Match.find({"status": MatchStatus.MATCHED}).to_list()
        match_errors = 0
        for match in matches:
            try:
                await ensure_match_conversation(match)
            except Exception as err:
                match_errors += 1
                print(f"match {match.id}: {err}")

        friend_relationships = await Relationship.find({
            "type": RelationshipType.FRIEND,
            "status": RelationshipStatus.ACTIVE,
        }).to_list()
        friend_errors = 0
        for relationship in friend_relationships:
            try:
                await ensure_friend_conversation(relationship)
            except Exception as err:
                friend_errors += 1
                print(f"relationship {relationship.id}: {err}")

        after = await Conversation.find_all().count()
        print(f"MATCHED matches processed: {len(matches)} ({match_errors} errors)")
        print(f"ACTIVE friend relationships processed: {len(friend_relationships)} ({friend_errors} errors)")
        print(f"Conversations: {before} -> {after} (+{after - before})")
        if not matches and not friend_relationships:
            print("WARNING: no MATCHED matches or ACTIVE friend relationships matched; nothing was backfilled")

        return 1 if (match_errors or friend_errors) else 0
    except Exception as err:
        print(f"Backfill failed before completion: {err}")
        print("If this is a duplicate-key or index conflict, run scripts/dedupe_relationship_conversations.py --apply first: init_beanie builds the unique indexes.")
        return 2
    finally:
        client.close()


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
```

- [ ] **Step 2: Verificar sintaxis**

Run: `cd backend; .\venv\Scripts\python -c "import ast; ast.parse(open('scripts/backfill_conversations.py', encoding='utf-8').read()); print('SYNTAX OK')"`
Expected: `SYNTAX OK`

(Ejecución real contra Mongo queda para Task 9, cuando el stack esté arriba.)

- [ ] **Step 3: Checkpoint — mostrar diff, commit SOLO con aprobación**

Commit propuesto: `feat(chat): add conversation backfill script (CARE F0)`

---

### Task 4: `chat_resolvers.py` + fallback P0-1 en `GET /chat/messages/{id}` (TDD)

**Files:**
- Create: `backend/src/api/chat_resolvers.py`
- Modify: `backend/src/api/chat.py:292-368` (`get_messages`)
- Test: `backend/tests/test_chat_resolvers.py`

**Interfaces:**
- Consumes: solo `typing` (módulo sin dependencias → importable en tests sin Mongo/Redis/Kafka).
- Produces (usado por Tasks 5 y esta tarea):
  - `resolve_message_source(conversation_found: bool, path_id: str, match_id_param: Optional[str]) -> tuple[str, str]` → `("conversation", id)` | `("match", id)`
  - `resolve_ws_send_mode(conversation_id: Optional[str], match_id: Optional[str]) -> str` → `"conversation"` | `"match"` | `"error"`

Problema P0-1 (spec): el frontend llama `GET /chat/messages/{match_id}` sin query → `Conversation.get(match_id)` es `None` y sin `match_id` el backend cae al 404 final (`chat.py:365`). Fallback: tratar el path como `match_id` legacy.

- [ ] **Step 1: Escribir los tests fallidos (rojo)**

Crea `backend/tests/test_chat_resolvers.py`:

```python
"""CARE F0 tests for chat target resolution (P0-1)."""

from src.api.chat_resolvers import resolve_message_source, resolve_ws_send_mode


class TestResolveMessageSource:
    def test_existing_conversation_wins_over_match_param(self):
        assert resolve_message_source(True, "conv1", "m1") == ("conversation", "conv1")

    def test_no_conversation_uses_match_param(self):
        assert resolve_message_source(False, "conv1", "m1") == ("match", "m1")

    def test_no_conversation_no_param_falls_back_to_path(self):
        assert resolve_message_source(False, "m1", None) == ("match", "m1")

    def test_empty_match_param_falls_back_to_path(self):
        assert resolve_message_source(False, "m1", "") == ("match", "m1")


class TestResolveWsSendMode:
    def test_conversation_id_wins_when_both_present(self):
        assert resolve_ws_send_mode("c1", "m1") == "conversation"

    def test_match_only(self):
        assert resolve_ws_send_mode(None, "m1") == "match"

    def test_conversation_only(self):
        assert resolve_ws_send_mode("c1", None) == "conversation"

    def test_neither_is_error(self):
        assert resolve_ws_send_mode(None, None) == "error"
```

- [ ] **Step 2: Ejecutar para verificar que falla (rojo)**

Run: `cd backend; $env:PYTHONPATH="."; .\venv\Scripts\python -m pytest tests\test_chat_resolvers.py -v`
Expected: FAIL con `ModuleNotFoundError: No module named 'src.api.chat_resolvers'`

- [ ] **Step 3: Implementar el módulo**

Crea `backend/src/api/chat_resolvers.py`:

```python
"""Pure target-resolution helpers for chat HTTP/WS handlers (CARE F0, P0-1)."""

from typing import Optional


def resolve_message_source(
    conversation_found: bool,
    path_id: str,
    match_id_param: Optional[str],
) -> tuple[str, str]:
    """Decide which storage serves GET /chat/messages/{id}.

    Priority: existing conversation > ?match_id query > path id as legacy match id.
    Returns ("conversation", id) or ("match", id).
    """
    if conversation_found:
        return "conversation", path_id
    return "match", match_id_param or path_id


def resolve_ws_send_mode(
    conversation_id: Optional[str],
    match_id: Optional[str],
) -> str:
    """Decide which branch serves WS send_message: "conversation" | "match" | "error"."""
    if conversation_id:
        return "conversation"
    if match_id:
        return "match"
    return "error"
```

- [ ] **Step 4: Ejecutar para verificar que pasa (verde)**

Run: `cd backend; $env:PYTHONPATH="."; .\venv\Scripts\python -m pytest tests\test_chat_resolvers.py -v`
Expected: `8 passed`

- [ ] **Step 5: Integrar el fallback en `get_messages`**

> **R21 (2026-09-26, auditoría previa a Task 4)** — El Step 5 decía "reemplaza `chat.py:292-368` por el bloque de abajo", pero la función real tiene **líneas en blanco con whitespace final** (301, 312, 321, 328, 332, 341, 353, 362) y el bloque del plan las tiene **limpias** → un reemplazo masivo-metería ~8 líneas de whitespace no solicitado, violando la regla de no tocar whitespace. Además arrastra el riesgo de revertir sin querer las ~30 líneas de la rama `conversation` que deben quedar idénticas (verificado: lo están). **Ruling: 3 ediciones quirúrgicas ancladas en snippets, NO reemplazo masivo.** Los tres hunks: (1) tras `conversation = await Conversation.get(conversation_id)` insertar la llamada al resolver y cambiar `if conversation:` por `if source_kind == "conversation":`; (2) el comentario de la rama legacy y `if match_id:` → `if source_kind == "match":`; (3) `Match.get(match_id)` → `Match.get(source_id)` y `"match_id": match_id` → `"match_id": source_id`. El `raise HTTPException(404, "Conversation not found")` final se queda: con las dos ramas anteriores es código inalcanzable, pero es defensivo y está en el plan — se conserva verbatim. El import va anclado tras `from src.api.auth import get_current_user` (no "al final del bloque de imports", que es ambiguo). Verificado sin cambios: la ruta ya es `/messages/{conversation_id}` (no hay conflicto de patrón con `/send` ni `/{conversation_id}/unread-count`), y `Conversation.get` con un id no-ObjectId lanza `ValidationError` → 500, pero eso es **pre-existente** (ya era la primera línea del handler) y queda fuera de alcance.

> **R22 (2026-09-26, ejecución de Task 4)** — El implementador descubrió que el ancla del hunk 4 (`            "match_id": match_id,`, 12 espacios) **no era única**: la herramienta de edición hace matching **por subcadena**, no por línea, así que matcheaba dentro de las líneas de 24 y 28 espacios de L120, **L142 (payload Kafka del handler WebSocket)** y L169 — y aplicó el cambio en L142, corrompiendo código intacto. Lo detectó la verificación de equivalencia obligatoria (comparación línea a línea de la función completa contra el bloque esperado), restauró L142 desde `git show HEAD` y re-aplicó el hunk anclando en la línea de comentario única `# Get messages by match_id (legacy)`. **Dos lecciones para el resto del plan: (1) todo `oldString` debe ser único en el archivo, y hay que comprobarlo ANTES de editar (un ancla con menos sangría que la real siempre matchea dentro de líneas más sangradas); (2) la verificación de equivalencia de la Task 4 no es burocracia — es la única red que atrapó esto, y por eso es obligatoria en cualquier task con ediciones quirúrgicas sobre código compartido.** El hunk 4 del plan queda corregido con el anchor ancho.

> **R23 (2026-09-27, revisión de Task 4) — Approved, 0 Critical.** Dos Important que **no** invalidan la task, ambos a documentar: (1) el `raise HTTPException(404, "Conversation not found")` final es **inalcanzable por construcción** (el tipo de retorno de `resolve_message_source` solo admite 2 valores) y su mensaje es **engañoso**: el fallo real es "Match not found". Es plan-mandado como código defensivo → **se mantiene** y se convierte en **deuda con ticket en Task 10** (fix recomendado: borrarlo, o un `else` exhaustivo que haga visible la invariante). (2) El report afirmaba que este fix creaba una nueva superficie de 500 para ids no-ObjectId → falso: `Conversation.get(conversation_id)` ya era la primera sentencia del handler antes de este commit. Report corregido. Verificado por el revisor sin depender de mi palabra: reprodujo `8 passed` y `137 passed`, y la aritmética del diff (10 inserciones / 6 eliminaciones = los 4 hunks exactos) prueba que la recuperación del incidente R22 no dejó ni una línea colateral.

En `backend/src/api/chat.py`, añade al bloque de imports:

```python
from src.api.chat_resolvers import resolve_message_source, resolve_ws_send_mode
```

(`resolve_ws_send_mode` se usa en Task 5; impórtalo ya para no repetir.)

Reemplaza `chat.py:292-368` (función `get_messages` completa) por:

```python
@router.get("/messages/{conversation_id}")
async def get_messages(
    conversation_id: str,
    limit: int = 50,
    offset: int = 0,
    match_id: Optional[str] = None,  # Legacy support
    current_user: User = Depends(get_current_user)
):
    """Get messages for a specific conversation (supports both conversation_id and legacy match_id)"""

    # Try new system first (conversation_id)
    conversation = await Conversation.get(conversation_id)
    source_kind, source_id = resolve_message_source(
        conversation is not None, conversation_id, match_id
    )

    if source_kind == "conversation":
        # Verify user is a participant
        if str(current_user.id) not in conversation.participants:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to view this conversation"
            )

        # Get messages by conversation_id
        messages = await Message.find({
            "conversation_id": conversation_id,
            "$or": [
                {"sender_id": str(current_user.id), "deleted_by_sender": {"$ne": True}},
                {"receiver_id": str(current_user.id), "deleted_by_receiver": {"$ne": True}}
            ]
        }).sort(-Message.created_at).skip(offset).limit(limit).to_list()

        # Mark messages as read
        await Message.find(
            Message.conversation_id == conversation_id,
            Message.receiver_id == str(current_user.id),
            Message.is_read == False
        ).update({"$set": {"is_read": True, "read_at": datetime.utcnow()}})

        # Reset unread count for this user
        conversation.reset_unread(str(current_user.id))
        await conversation.save()

        # Invalidate dashboard cache (unread count changed to 0)
        await redis_service.invalidar_usuario(["stats", "recent"], str(current_user.id))

        return messages

    # Fallback to legacy match_id system (P0-1: the path id may itself be a match id)
    if source_kind == "match":
        match = await Match.get(source_id)

        if not match:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Match not found"
            )

        if match.user_id_1 != str(current_user.id) and match.user_id_2 != str(current_user.id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to view this conversation"
            )

        # Get messages by match_id (legacy)
        messages = await Message.find({
            "match_id": source_id,
            "$or": [
                {"sender_id": str(current_user.id), "deleted_by_sender": {"$ne": True}},
                {"receiver_id": str(current_user.id), "deleted_by_receiver": {"$ne": True}}
            ]
        }).sort(-Message.created_at).skip(offset).limit(limit).to_list()

        return messages

    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Conversation not found"
    )
```

Diferencias clave con el original: la rama `conversation` es idéntica; la rama legacy usa `source_id` en `Match.get` y en el query `match_id` (antes usaba el parámetro `match_id`, que podía ser `None` → 404; ahora el path sirve de fallback).

- [ ] **Step 6: Suite completa + verificación de sintaxis**

Run: `cd backend; $env:PYTHONPATH="."; .\venv\Scripts\python -m pytest tests -q`
Expected: `137 passed` (112 baseline + 17 Task 1 + 8 Task 4)

```powershell
cd backend; .\venv\Scripts\python -c "import ast; ast.parse(open('src/api/chat.py', encoding='utf-8').read()); print('SYNTAX OK')"
```

Expected: `SYNTAX OK`

- [ ] **Step 7: Checkpoint — mostrar diff, commit SOLO con aprobación**

Commit propuesto: `fix(chat): resolve message target with legacy match_id fallback (P0-1)`

---

### Task 5: WS `send_message` acepta `conversation_id`

**Files:**
- Modify: `backend/src/api/chat.py:76-150` (rama `action == "send_message"` del handler WebSocket)

**Interfaces:**
- Consumes: `resolve_ws_send_mode` (Task 4); modelos `Conversation`, `Relationship`, `ConversationType`, `RelationshipStatus`, `Match`, `MatchStatus` — todos ya importados en `chat.py` (verificados: se usan en 211-289 y 455-464).
- Produces: payload `new_message` con `message.conversation_id` (el frontend Task 8 lo compara con `?? data.message.match_id`); Kafka `MESSAGE_SENT` con `conversation_id` (misma forma que el REST `/send` conversación, `chat.py:439-447`; `chat_consumer.py` usa `.get()` tolerante — verificado).

Paridad obligatoria con el branch de conversación de REST `/send` (`chat.py:379-452`): validación de participante, check de bloqueo, actualización de metadata de la conversación (`last_message_*` + `increment_unread`), invalidación de caché, push al receiver, y Kafka. Diferencia: el bloqueo se consulta en `Relationship` **y** en `Match` (el flujo de bloqueo `moderation.py:65` solo actualiza `Match`; verificar ambos preserva el check legacy `chat.py:89`).

> **R24-R29 (2026-09-27, auditoría previa de Task 5)** — (R24) **Las referencias de línea de esta task están desfasadas en +1** (Task 4 insertó el import en `chat.py:12`): el rango real es **77-151**, no 76-150, y la nota de abajo que dice que las lecturas estaban "antes en 78-81" está mal — están dentro de la rama, en 79-82. Ignorar los números; el brief usa un splice con aserciones sobre el contenido. (R25) Las líneas en blanco con whitespace de la rama son 83, 89, 93, 96, 107, 111, 114, 127 (**dentro** del rango, se reescriben a limpias porque el bloque entero es nuevo — no es ruido colateral) y **152** (**fuera**, intocable, antes de `elif action == "typing":`; el brief lo asserta y lo prueba con equivalencia byte a byte de `L1-76` y `L152-end` contra HEAD). (R26) `chat_consumer.py:88` reemite `match_id` en el push → `null` en modo conversación, sin deep-link; **preexistente**, el REST `chat.py:445` ya publica sin `match_id` → deuda Task 10, fuera de alcance. (R27) El `try` del WS (`chat.py:65`) **solo** captura `WebSocketDisconnect` (`chat.py:208`), sin `except Exception` → un id malformado **cierra la conexión WS**; el legacy ya sufre lo mismo en `Match.get()` (`chat.py:85`) → **no se robustenece** en F0, ticket en Task 10. (R28) El replacement va con **script de splice y aserciones duras**, no con el tool de edit: el `oldString` tiene 8 líneas con whitespace invisible y transcribirlas a mano ya produjo R15 y R18. (R29) Premisas verificadas: imports presentes, firma de `resolve_ws_send_mode` casa, `Message.conversation_id` existe, `participants` son exactamente 2, `Conversation.get()` devuelve `None` (no lanza), y **`moderation.py:65-69` confirma que el check dual de bloqueo es necesario** (el bloqueo solo actualiza `Match`, nunca `Relationship`).

- [ ] **Step 1: Reemplazar la rama `send_message` del WS**

En `backend/src/api/chat.py`, reemplaza las líneas 76-150 (desde `if action == "send_message":` hasta el final del publish de Kafka de esa rama, antes de `elif action == "typing":`) por:

```python
            if action == "send_message":
                content = message_data.get("content")
                message_type = message_data.get("message_type", "text")
                temp_id = message_data.get("temp_id")

                send_mode = resolve_ws_send_mode(
                    message_data.get("conversation_id"),
                    message_data.get("match_id"),
                )

                if send_mode == "error":
                    await websocket.send_json(
                        {"error": "Either conversation_id or match_id must be provided"}
                    )
                    continue

                if send_mode == "conversation":
                    conversation_id = message_data.get("conversation_id")
                    conversation = await Conversation.get(conversation_id)
                    if not conversation or user_id not in conversation.participants:
                        await websocket.send_json({"error": "Invalid conversation"})
                        continue

                    is_blocked = False
                    relationship = await Relationship.get(conversation.relationship_id)
                    if relationship and relationship.status == RelationshipStatus.BLOCKED:
                        is_blocked = True
                    if conversation.type == ConversationType.MATCH:
                        existing_match = await Match.find_one({
                            "$or": [
                                {"user_id_1": conversation.participants[0],
                                 "user_id_2": conversation.participants[1]},
                                {"user_id_1": conversation.participants[1],
                                 "user_id_2": conversation.participants[0]},
                            ]
                        })
                        if existing_match and existing_match.status == MatchStatus.BLOCKED:
                            is_blocked = True
                    if is_blocked:
                        await websocket.send_json({"error": "Conversation is blocked"})
                        continue

                    receiver_id = (
                        conversation.participants[0]
                        if conversation.participants[1] == user_id
                        else conversation.participants[1]
                    )

                    message = Message(
                        conversation_id=conversation_id,
                        sender_id=user_id,
                        receiver_id=receiver_id,
                        message_type=message_type,
                        content=content,
                        created_at=datetime.utcnow()
                    )
                    await message.insert()

                    conversation.last_message_at = message.created_at
                    conversation.last_message_content = content
                    conversation.last_message_sender_id = user_id
                    conversation.increment_unread(receiver_id)
                    await conversation.save()

                    await redis_service.invalidar_usuario(["stats", "recent"], user_id)
                    await redis_service.invalidar_usuario(["stats", "recent"], receiver_id)

                    await manager.send_personal_message(receiver_id, {
                        "action": "new_message",
                        "message": {
                            "id": str(message.id),
                            "conversation_id": conversation_id,
                            "sender_id": user_id,
                            "content": content,
                            "message_type": message_type,
                            "created_at": message.created_at.isoformat()
                        }
                    })

                    await websocket.send_json({
                        "action": "message_sent",
                        "message_id": str(message.id),
                        "temp_id": temp_id
                    })

                    try:
                        await kafka_service.publish(
                            topic=KafkaTopic.CHAT_MESSAGES,
                            event_type=KafkaEventType.MESSAGE_SENT,
                            payload={
                                "message_id": str(message.id),
                                "conversation_id": conversation_id,
                                "sender_id": user_id,
                                "recipient_id": receiver_id,
                                "content": content,
                                "created_at": message.created_at.isoformat(),
                            },
                            key=conversation_id or user_id,
                        )
                    except Exception as k_err:
                        print(f"Kafka publish error (ws chat conv): {k_err}")

                    continue

                match_id = message_data.get("match_id")

                # Verify match exists and user is part of it
                match = await Match.get(match_id)
                if not match or (match.user_id_1 != user_id and match.user_id_2 != user_id):
                    await websocket.send_json({"error": "Invalid match"})
                    continue

                if match.status == MatchStatus.BLOCKED:
                    await websocket.send_json({"error": "Conversation is blocked"})
                    continue

                # Get receiver ID
                receiver_id = match.user_id_2 if match.user_id_1 == user_id else match.user_id_1

                # Create message
                message = Message(
                    match_id=match_id,
                    sender_id=user_id,
                    receiver_id=receiver_id,
                    message_type=message_type,
                    content=content,
                    created_at=datetime.utcnow()
                )
                await message.insert()

                # Invalidate dashboard cache for both users (new unread message)
                await redis_service.invalidar_usuario(["stats", "recent"], user_id)
                await redis_service.invalidar_usuario(["stats", "recent"], receiver_id)

                # Send to receiver if online
                await manager.send_personal_message(receiver_id, {
                    "action": "new_message",
                    "message": {
                        "id": str(message.id),
                        "match_id": match_id,
                        "sender_id": user_id,
                        "content": content,
                        "message_type": message_type,
                        "created_at": message.created_at.isoformat()
                    }
                })

                # Confirm to sender
                await websocket.send_json({
                    "action": "message_sent",
                    "message_id": str(message.id),
                    "temp_id": temp_id
                })

                # Publish to Kafka
                try:
                    await kafka_service.publish(
                        topic=KafkaTopic.CHAT_MESSAGES,
                        event_type=KafkaEventType.MESSAGE_SENT,
                        payload={
                            "message_id": str(message.id),
                            "match_id": match_id,
                            "sender_id": user_id,
                            "recipient_id": receiver_id,
                            "content": content,
                            "created_at": message.created_at.isoformat(),
                        },
                        key=match_id or user_id,
                    )
                except Exception as k_err:
                    print(f"Kafka publish error (ws chat): {k_err}")
```

Notas de la reescritura: la rama legacy es el código actual líneas 83-150 con `content`/`message_type`/`temp_id` ahora leídos una sola vez arriba (antes en 78-81); `elif action == "typing"` (línea 152 actual) queda intacto inmediatamente después.

- [ ] **Step 2: Verificar sintaxis + suite**

```powershell
cd backend; $env:PYTHONPATH="."; .\venv\Scripts\python -c "import ast; ast.parse(open('src/api/chat.py', encoding='utf-8').read()); print('SYNTAX OK')"; if ($?) { .\venv\Scripts\python -m pytest tests -q }
```

Expected: `SYNTAX OK` y `137 passed`

- [ ] **Step 3: Checkpoint — mostrar diff, commit SOLO con aprobación**

Commit propuesto: `feat(chat): accept conversation_id in WS send_message (CARE F0)`

---

### Task 6: `/clear/{id}` acepta conversation + DTO `status`/`blocked_by`

**Files:**
- Modify: `backend/src/api/chat.py:521-555` (`clear_chat`)
- Modify: `backend/src/api/chat.py:252-273` (dict de `result.append` en `get_conversations`)

**Interfaces:**
- Consumes: `Conversation`, `RelationshipStatus` (ya importados en `chat.py`); `Relationship.blocked_by` existe (`models/relationship.py:58`).
- Produces: `POST /chat/clear/{id}` con ambos sistemas; DTO `GET /chat/conversations` con `status: "matched" | "blocked"` y `blocked_by: str | null` — consumidos por la interfaz `Conversation` del frontend (Task 8). Frontend hoy usa `conv.status === 'blocked'` (líneas 493-494, 597, 656) que hoy es `undefined` (regresión preexistente, se arregla aquí).

- [ ] **Step 1: Reemplazar `clear_chat`**

Reemplaza `chat.py:521-555` (decorador + función `clear_chat`) por:

```python
@router.post("/clear/{conversation_id}")
async def clear_chat(
    conversation_id: str,
    current_user: User = Depends(get_current_user)
):
    """Clear chat history for the current user (Conversation or legacy Match id)"""

    conversation = await Conversation.get(conversation_id)
    if conversation:
        if str(current_user.id) not in conversation.participants:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized"
            )

        await Message.find(
            Message.conversation_id == conversation_id,
            Message.sender_id == str(current_user.id)
        ).update({"$set": {"deleted_by_sender": True}})

        await Message.find(
            Message.conversation_id == conversation_id,
            Message.receiver_id == str(current_user.id)
        ).update({"$set": {"deleted_by_receiver": True}})

        return {"message": "Chat cleared successfully"}

    # Legacy match-based chat
    match = await Match.get(conversation_id)

    if not match:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Match not found"
        )

    if match.user_id_1 != str(current_user.id) and match.user_id_2 != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )

    await Message.find(
        Message.match_id == conversation_id,
        Message.sender_id == str(current_user.id)
    ).update({"$set": {"deleted_by_sender": True}})

    await Message.find(
        Message.match_id == conversation_id,
        Message.receiver_id == str(current_user.id)
    ).update({"$set": {"deleted_by_receiver": True}})

    return {"message": "Chat cleared successfully"}
```

- [ ] **Step 2: Añadir `status` y `blocked_by` al DTO de `/conversations`**

En `get_conversations`, dentro del `result.append({...})` (líneas 252-273), tras la línea `"relationship_status": relationship.status,` añade:

```python
            "status": "blocked" if relationship.status == RelationshipStatus.BLOCKED else "matched",
            "blocked_by": relationship.blocked_by,
```

- [ ] **Step 3: Verificar sintaxis + suite**

```powershell
cd backend; $env:PYTHONPATH="."; .\venv\Scripts\python -c "import ast; ast.parse(open('src/api/chat.py', encoding='utf-8').read()); print('SYNTAX OK')"; if ($?) { .\venv\Scripts\python -m pytest tests -q }
```

Expected: `SYNTAX OK` y `137 passed`

- [ ] **Step 4: Checkpoint — mostrar diff, commit SOLO con aprobación**

Commit propuesto: `feat(chat): support conversation_id in clear endpoint and enrich DTO (CARE F0)`

---

### Task 7: friends.py — crear Conversation al aceptar amistad

**Files:**
- Modify: `backend/src/api/friends.py:285-297` (rama `if response_data.accept:`)
- Modify: imports de `friends.py`

**Interfaces:**
- Consumes: `ensure_friend_conversation(relationship)` (Task 1); `relationship` en ese punto ya tiene `status=ACTIVE` y `save()` ejecutado (líneas 287-289).
- Produces: conversaciones `type=FRIEND` visibles en `GET /chat/conversations` y usadas por el filtro "Amigos" del frontend (ya existente, `chat/index.tsx:408-414`).

- [ ] **Step 1: Añadir import**

En el bloque de imports de `src/api/friends.py`:

```python
from src.services.conversation_service import ensure_friend_conversation
```

- [ ] **Step 2: Reemplazar el TODO**

En `friends.py`, dentro de `if response_data.accept:` (líneas 285-297), reemplaza la línea `# TODO: Create conversation for friend chat` por:

```python
        try:
            await ensure_friend_conversation(relationship)
        except Exception as conv_err:
            print(f"Conversation creation error (friend accept): {conv_err}")
```

(El `# TODO: Send notification to requester` de la línea siguiente se mantiene — fuera de scope.)

- [ ] **Step 3: Envolver el insert de `Relationship` contra `DuplicateKeyError` (R14)**

El índice único `(user_a_id, user_b_id, type)` de R12 convierte la carrera find-then-insert de `friends.py` (único otro sitio de `src/` que construye `Relationship`) en un `DuplicateKeyError` no capturado → HTTP 500, donde antes se devolvía el 400 de solicitud duplicada. Localiza el `await relationship.insert()` del flujo de creación de solicitud y envuélvelo:

```python
        try:
            await relationship.insert()
        except DuplicateKeyError:
            raise HTTPException(status_code=400, detail="Friend request already pending")
```

Añade `from pymongo.errors import DuplicateKeyError` al bloque de imports de terceros. Reutiliza el `detail` exacto de la rama que ya devuelve 400 por solicitud duplicada (no inventes un mensaje nuevo) y conserva el resto de la lógica intacto.

- [ ] **Step 4: Verificar sintaxis + suite**

```powershell
cd backend; $env:PYTHONPATH="."; .\venv\Scripts\python -c "import ast; ast.parse(open('src/api/friends.py', encoding='utf-8').read()); print('SYNTAX OK')"; if ($?) { .\venv\Scripts\python -m pytest tests -q }
```

Expected: `SYNTAX OK` y `137 passed`

- [ ] **Step 5: Checkpoint — mostrar diff, commit SOLO con aprobación**

Commit propuesto: `feat(chat): create conversation on friend request accept (CARE F0/P0-2)`

---

### Task 8: Frontend `chat/index.tsx` — migración a `conversation_id`

**Files:**
- Modify: `frontend/src/pages/chat/index.tsx` (los sitios listados abajo)

**Interfaces:**
- Consumes: DTO `GET /chat/conversations` con `conversation_id`, `status`, `blocked_by`, `last_message_content` (Tasks 4/6); WS `new_message` con `message.conversation_id` (Task 5); `POST /chat/clear/{conversation_id}` (Task 6); `GET /chat/messages/{conversation_id}` (Task 4).
- Produces: flujo completo de chat sobre `conversation_id`; el identificador activo se llama `activeConversationId`.

Precondición: correr el baseline ANTES de editar (paso 1) para comparar.

- [ ] **Step 1: Baseline de lint y tipos**

```powershell
cd frontend; npm run lint; if ($?) { npx tsc --noEmit }
```
Expected: anota el resultado — al final debe ser idéntico (sin errores nuevos; errores preexistentes de otros archivos no bloquean).

- [ ] **Step 2: Renombrar la interfaz (líneas 64-81)**

Reemplaza la interfaz `Conversation` completa (líneas 64-81) por:

```typescript
interface Conversation {
  conversation_id: string;
  other_user_id: string;
  display_name: string;
  photo: string;
  last_message_content?: string;
  unread_count: number;
  is_online: boolean;
  last_active?: string;
  show_online_status?: boolean;
  status: 'matched' | 'blocked' | 'unmatched';
  blocked_by?: string;
  // New Fields
  type: 'match' | 'friend' | 'partner';
  emotional_status?: string; // e.g., "passionate", "flirty", "friendly"
  theme_color?: string;
  subscription_tier?: string;
}
```

(Cambios concretos respecto al actual: `match_id: string;` → `conversation_id: string;` y `last_message?: Message;` → `last_message_content?: string;`. El resto es idéntico.)

- [ ] **Step 3: Renombrar el estado activo (2 reemplazos globales, en este orden)**

1. Reemplazo global: `setActiveMatchId` → `setActiveConversationId`
2. Reemplazo global: `activeMatchId` → `activeConversationId` (cubre también `activeMatchIdRef` → `activeConversationIdRef`)

Los dos juntos renombran las líneas 107, 262-263, 283, 298, 318-325, 341, 347 (valor), 404-405, 490-491, 495, 549, 551. El patrón 2 no toca `setActiveMatchId` (ahí la `A` es mayúscula), por eso hacen falta los dos en ese orden.

- [ ] **Step 4: Edits manuales sitio por sitio**

4.1 — Línea 214 (`handleClearChat`):

```typescript
          await apiClient.post(`/chat/clear/${activeConversation.conversation_id}`);
```

4.2 — Línea 283 (handler `new_message`), reemplaza la condición por:

```typescript
      if (data.action === 'new_message') {
        const messageConversationId = data.message.conversation_id ?? data.message.match_id;
        if (messageConversationId === activeConversationIdRef.current) {
          setMessages((prev) => [...prev, data.message]);
          scrollToBottom();
        } else {
          fetchConversations();
        }
```

(`?? data.message.match_id` tolera pushes legacy de mensajes viejos; no emparejarán con la clave activa y caen al `fetchConversations()` — degradación segura.)

4.3 — Línea 298 (handler `message_read`): `if (c.match_id === activeConversationIdRef.current)` → `if (c.conversation_id === activeConversationIdRef.current)`

4.4 — Línea 320 (effect de cambios): `const conv = conversations.find(c => c.match_id === activeConversationId);` → `c.conversation_id === activeConversationId`

4.5 — Líneas 327-329 (`fetchMessages`): renombra el parámetro:

```typescript
  const fetchMessages = async (conversationId: string) => {
    try {
      const response = await apiClient.get(`/chat/messages/${conversationId}`);
```

4.6 — Línea 347 (payload WS), reemplaza la clave:

```typescript
    const messageData = {
      action: 'send_message',
      conversation_id: activeConversationId,
      content: msgContent,
      message_type: 'text',
      temp_id: tempId
    };
```

4.7 — Línea 404 (memo `activeConversation`): `() => conversations.find(c => c.conversation_id === activeConversationId),`

4.8 — Línea 488 (key del ListItem): `key={conv.conversation_id}`

4.9 — Línea 490 (selected): `selected={activeConversationId === conv.conversation_id}`

4.10 — Línea 491 (onClick): `onClick={() => setActiveConversationId(conv.conversation_id)}`

4.11 — Línea 495 (borderLeft): `borderLeft: activeConversationId === conv.conversation_id ? \`4px solid ${conv.theme_color || theme.palette.primary.main}\` : 'none'`

4.12 — Línea 526 (preview de último mensaje): `conv.last_message_content || t('chat.start_chatting', 'Comienza a chatear...')` (antes `conv.last_message?.content || ...`)

4.13 — Línea 681 (IcebreakerButton): `matchId={activeConversation!.conversation_id}` — el prop se llama igual a propósito (su arreglo es P1-3; hoy ya está roto por doble prefijo, no hay regresión).

- [ ] **Step 5: Verificar que no quedó ningún `match_id` activo**

Run: `Select-String -Path "frontend\src\pages\chat\index.tsx" -Pattern "match_id|activeMatchId" | ForEach-Object { "$($_.LineNumber): $($_.Line.Trim())" }`
Expected: SOLO la línea del fallback `?? data.message.match_id` (línea ~284). Cualquier otra ocurrencia = edit faltante → corregir.

- [ ] **Step 6: Lint y tipos**

```powershell
cd frontend; npm run lint; if ($?) { npx tsc --noEmit }
```
Expected: mismo resultado que el baseline del paso 1 (sin errores nuevos; `chat/index.tsx` sin errores de tipo).

- [ ] **Step 7: Checkpoint — mostrar diff, commit SOLO con aprobación**

Commit propuesto: `feat(chat): migrate chat UI to conversation_id (CARE F0/P0-2)`

---

### Task 9: Verificación E2E — script de datos + checklist manual

**Files:**
- Create: `backend/scripts/verify_chat_flow.py`
- Ejecución manual: Docker + 2 navegadores

**Interfaces:**
- Consumes: `ensure_*` (Task 1), backfill (Task 3), stack completo de Tasks 2-8.
- Produces: evidencia de aceptación de la spec: "like → match → chat E2E pasa sin 404".

> **Obligaciones del runbook (R19/R20, heredadas de la revisión de Task 3)** — el script de backfill de Task 3 tiene dos consecuencias operativas que Task 9 debe cubrir explícitamente, porque su exit code es el oráculo de esta task:
> 1. **Exit `2` = "no pudo completarse", y puede venir DESPUÉS de escrituras ya confirmadas.** Con R20 los bucles usan `to_list()`, así que un documento legacy que no se puede deserializar aborta en el segundo query (`:47`) después de que el primer bucle ya haya creado conversaciones. En el camino de exit 2 no se ejecutan los prints de resumen (`before`/`after`), así que **la salida no dice cuánto se creó**. Procedimiento obligatorio: leer la línea `Backfill failed before completion: ...`, arreglar el documento, y **re-ejecutar** — es seguro porque `ensure_*` es idempotente y los índices únicos ya están creados.
> 2. **Un documento malformado falla igual en cada re-run** (mismo `to_list()`), así que el script no puede completar hasta que los datos se arreglen a mano. El hint que imprime el script solo cubre el caso duplicate-key/index-conflict; ante un error de decodificación ese hint es un distractor (está redactado condicionalmente, no es falso). Task 9 debe distinguir ambos casos al leer la salida.
> 3. Al ejecutar el backfill, interpretar el contrato: **0** = ok (incluye BD vacía, que imprime `WARNING: no MATCHED matches...` pero sigue saliendo 0), **1** = corrió con errores por fila (los ids están en la salida), **2** = no pudo completarse (ver punto 1).

- [ ] **Step 1: Crear el script de verificación de datos**

Crea `backend/scripts/verify_chat_flow.py`:

```python
"""CARE F0: verify Relationship+Conversation lifecycle against real Mongo.

Uses synthetic user ids (no FK constraints) and cleans up after itself.
From backend/ with Mongo running:
    $env:PYTHONPATH="."; .\venv\Scripts\python scripts\verify_chat_flow.py
Exit code 0 = all checks passed.
"""

import asyncio
import sys
from types import SimpleNamespace

from beanie import init_beanie
from motor.motor_asyncio import AsyncIOMotorClient

from src.core.config import settings
from src.models.conversation import Conversation, ConversationType
from src.models.match import Match, MatchStatus
from src.models.relationship import (
    Relationship,
    RelationshipOrigin,
    RelationshipStatus,
    RelationshipType,
)
from src.services.conversation_service import (
    ensure_friend_conversation,
    ensure_match_conversation,
)

U1 = "verify_f0_user_a"
U2 = "verify_f0_user_b"


async def cleanup() -> None:
    await Relationship.find({"user_a_id": U1, "user_b_id": U2}).delete()
    await Conversation.find({"participants": U1}).delete()


async def main() -> int:
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    await init_beanie(
        database=client[settings.MONGODB_DB_NAME],
        document_models=[Match, Relationship, Conversation],
    )
    await cleanup()

    failures = []

    # Scenario 1: match pair — create twice, must stay at exactly 1+1 docs
    match = SimpleNamespace(user_id_1=U2, user_id_2=U1, matched_at=None)
    conv1 = await ensure_match_conversation(match)
    conv2 = await ensure_match_conversation(match)

    rels = await Relationship.find({
        "user_a_id": U1, "user_b_id": U2, "type": RelationshipType.MATCH,
    }).to_list()
    if len(rels) != 1:
        failures.append(f"expected 1 MATCH relationship, got {len(rels)}")
    convs = await Conversation.find({"relationship_id": str(rels[0].id)}).to_list() if rels else []
    if len(convs) != 1:
        failures.append(f"expected 1 MATCH conversation, got {len(convs)}")
    if conv1.id != conv2.id:
        failures.append("second ensure returned a different conversation")
    if conv1.participants != [U1, U2]:
        failures.append(f"participants not normalized: {conv1.participants}")

    # Scenario 2: friend conversation on an existing relationship
    friend_rel = Relationship(
        user_a_id=U1,
        user_b_id=U2,
        type=RelationshipType.FRIEND,
        status=RelationshipStatus.ACTIVE,
        origin=RelationshipOrigin.FRIEND_REQUEST,
    )
    await friend_rel.insert()
    fconv1 = await ensure_friend_conversation(friend_rel)
    fconv2 = await ensure_friend_conversation(friend_rel)
    fconvs = await Conversation.find({"relationship_id": str(friend_rel.id)}).to_list()
    if len(fconvs) != 1:
        failures.append(f"expected 1 FRIEND conversation, got {len(fconvs)}")
    if fconv1.type != ConversationType.FRIEND or fconv1.id != fconv2.id:
        failures.append("friend conversation not idempotent or wrong type")

    await cleanup()
    client.close()

    if failures:
        for failure in failures:
            print(f"FAIL: {failure}")
        return 1
    print("OK: match creates exactly 1 relationship + 1 conversation, idempotent;")
    print("OK: friend relationship gets exactly 1 conversation, idempotent;")
    print("OK: cleanup done (synthetic documents removed).")
    return 0


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
```

- [ ] **Step 2: Verificar sintaxis**

Run: `cd backend; .\venv\Scripts\python -c "import ast; ast.parse(open('scripts/verify_chat_flow.py', encoding='utf-8').read()); print('SYNTAX OK')"`
Expected: `SYNTAX OK`

- [ ] **Step 3: Levantar el stack**

Run (raíz del repo): `docker compose -f docker/docker-compose.local.yml up --build`
Expected: Frontend en http://localhost:3000 y API en http://localhost:8000.

- [ ] **Step 4: Backfill + script de datos**

```powershell
cd backend
$env:PYTHONPATH="."
.\venv\Scripts\python scripts\backfill_conversations.py
.\venv\Scripts\python scripts\verify_chat_flow.py
```

Expected: backfill imprime `Conversations: N -> M (+K)` sin errores; verify imprime `OK: ...` ×3 y exit code 0.

- [ ] **Step 5: Checklist manual (2 navegadores/ventanas anónimas)**

1. Usuario A y Usuario B inician sesión en http://localhost:3000.
2. A → Discover → like a B; B → Discover → like a A → **"¡Es un match!"**.
3. B abre **Chat**: la conversación de A aparece en la lista (nombre/foto), sin 404 en consola.
4. B envía "hola" → A lo ve **en tiempo real** (WS) y su badge de no-leído se actualiza.
5. A responde "hey" → B lo ve; recargar la página de B → el historial **persiste**.
6. B: menú ⋮ → **Vaciar Chat** → los mensajes desaparecen (sin error).
7. (Opcional) A envía solicitud de amistad → B acepta → la conversación tipo "Amigo" aparece en la pestaña **Amigos**.
8. Consola del navegador (ambos): sin errores rojos de red/WS durante todo el flujo.

- [ ] **Step 6: Checkpoint — registrar resultados, commit SOLO con aprobación**

Anota en el plan/checklist qué ítems pasaron. Commit propuesto (incluye el script): `test(chat): add verify_chat_flow E2E data script (CARE F0)`

---

### Task 10: Documentación + suite final + commits

**Files:**
- Modify: `docs/CARE_ALGORITHM.md:467`, `:474`, `:475`, `:516-517`
- Modify: `docs/CARE_ROADMAP.md:79-80` (§2 Fase 0)

**Interfaces:**
- Consumes: evidencia de Tasks 1-9.
- Produce: docs que reflejan el estado real (mismo protocolo que la ronda documental previa: enlazar estado sin romper nada).

- [ ] **Step 1: Marcar P0-1/P0-2 como resueltos en `CARE_ALGORITHM.md`**

Lectura previa obligatoria de `docs/CARE_ALGORITHM.md:460-520`. Luego:

1. Fila P0-1 (línea 474) → sustituye la fila completa por:

```
| P0-1 | `GET /chat/messages/{match_id}` envía el `match_id` como `conversation_id` y sin `?match_id=` → el backend responde **404 "Conversation not found"** (si no existe `Conversation` con ese id) | `chat/index.tsx:329` vs `chat.py:292-368` | ✅ **Resuelto (Fase 0, 2026-09-26)**: fallback `resolve_message_source` en backend (`chat_resolvers.py`) — el path sirve de `match_id` legacy |
```

2. Fila P0-2 (línea 475) → sustituye la fila completa por:

```
| P0-2 | `GET /chat/conversations` solo devuelve documentos `Conversation`, que **nadie crea en runtime** (solo la migración, y siempre `type=MATCH`); además devuelve `conversation_id` y el frontend espera `match_id` | `chat.py:216-226`, `migrate_to_relationships.py:139`, `chat/index.tsx:64-81` | ✅ **Resuelto (Fase 0, 2026-09-26)**: `ensure_match_conversation` enganchado en las 3 transiciones a MATCHED + `ensure_friend_conversation` en `friends.py`; backfill en `scripts/backfill_conversations.py`; frontend migrado a `conversation_id` |
```

3. Línea 467 (fila "Pruebas de chats") → sustituye la fila completa por:

```
| **Pruebas de chats** | ✅ **Sí (P0)** | P0-1/P0-2 resueltos (Fase 0): historial, lista y envío funcionan de punta a punta — E2E like→match→chat verificado. Quedan P1 (icebreaker, blind) — ver §11.3. |
```

4. Líneas 516-517 (ítem 1 de §11.5) → sustituye por:

```
1. ~~**Corto plazo (desbloquea pruebas de chat)**: resolver P0-1 y P0-2 (conversación
   al nacer el match)~~ ✅ hecho (Fase 0, 2026-09-26) → prueba E2E like→match→chat
   corrida con `backend/scripts/verify_chat_flow.py` + checklist manual.
```

- [ ] **Step 2: Marcar P0-1/P0-2 en `CARE_ROADMAP.md`**

Lectura previa de `docs/CARE_ROADMAP.md:72-88`. Tras la línea 75 (párrafo introductorio de §2), inserta:

```markdown
> **Estado (2026-09-26):** **P0-1 ✅ · P0-2 ✅** (implementado en
> `docs/superpowers/plans/2026-09-26-care-fase0-chat-blockers.md`; verificación
> `backend/scripts/verify_chat_flow.py` + checklist E2E). P1-3/P1-4/P1-7/P1-métrica: pendientes.
```

Y en las filas P0-1 (línea 79) y P0-2 (línea 80), antepon `✅ ` al identificador de la primera columna: `| ✅ **P0-1** | ...` y `| ✅ **P0-2** | ...`.

> **Deuda heredada que Task 10 debe documentar como follow-ups (2026-09-27, de las revisiones de Tasks 1-8).** Ninguna se arregla en Fase 0; todas están aceptadas explícitamente. Al escribir el runbook, dales ticket y owners:
> 1. **`Relationship.status = BLOCKED` / `Relationship.blocked_by` no los escribe nadie** — **la UI de bloqueado no funciona en runtime.** Los 4 usos de `RelationshipStatus.BLOCKED` en `backend/src` son lecturas (`chat.py:102`, `:367`, `:499`, `friends.py:139`); el único writer es `moderation.py:66-68`, que escribe **solo `Match`**. Como el DTO de `/conversations` y el REST `/send` leen `Relationship`, un par bloqueado por el camino real se reporta `status: "matched"`, `blocked_by: null` → la fila no se atenúa y el banner de bloqueado nunca se pinta, aunque el WS sí rechace el envío. El WS de Task 5 ya chequea las **dos** fuentes por esto mismo; el fix es extender esa fuente dual al DTO y al REST, no releer. **Prioridad 1.**
> 2. **Dos vocabularios de estado en el mismo dict** — `relationship_status` emite `"active"|"pending"|"blocked"` y `status` emite `"matched"|"blocked"` para la misma relación, sin comentario que declare el mapeo, y el tipo del frontend no declara `relationship_status` → el compilador no lo ve. Dejar un comentario o eliminar `status` cuando el cliente deje de leer `relationship_status`.
> 3. **`clear_chat` no resetea `unread_count`** — `get_messages` sí lo hace. Tras limpiar, la lista puede mostrar un badge sobre un chat vacío. Plan-mandado, se auto-cura al abrir, sin pérdida de datos.
> 4. **`"status"` colapsa 4 estados a 2** y el tipo del frontend admite un `'unmatched'` que el backend nunca emite. Inofensivo hoy (solo se compara `=== 'blocked'`).
> 5. **El 404 de `/clear/{id}` dice `"Match not found"`** en un endpoint que sirve dos sistemas; el hermano `get_messages` responde `"Conversation not found"` para el mismo fallo. Plan-mandado.
> 6. **Push de usuario offline sin deep-link** — `chat_consumer.py:88` reemite `match_id`, que en modo conversación llega `null`. Preexistente: el REST ya publica sin `match_id`.
> 7. **`new_message` del WS no está en paridad de payload con el REST** — el WS construye el dict a mano con 6 claves (`chat.py:144-154`), el REST manda `message.dict()`: faltan `match_id`, `is_read`, `read_at`, `media_url`, `game_session`. El mismo evento llega con dos formas según el canal. Fix: `message.dict()`.
> 8. **El WS no tiene `except Exception`** — solo captura `WebSocketDisconnect`, así que un id o un `content` malformados **cierran la conexión**. Afecta a las ramas nueva y legacy por igual; el REST devuelve 500/422.
> 9. **La ruta WS no está autenticada** — `@router.websocket("/ws/{user_id}")` sin token: cualquiera puede abrir `/ws/{victim_id}` y enviar como la víctima. El check de participante **sí** gatea el insert, pero no es una frontera de autorización.
> 10. **Frames de error del WS sin `temp_id`** → una burbuja optimista nunca matchea su error y queda colgada. El nuevo `"Either conversation_id or match_id must be provided"` de Task 5 es el primer caso.
> 11. **Dos fuentes de bloqueo indistinguibles en el log** — `Relationship` y `Match` emiten el mismo `"Conversation is blocked"` y no hay log en ningún camino de error, así que no se puede confirmar que el bloqueo por `Match` (el que el REST no ve) está disparando.
> 12. **Los errores de find del backfill no están aislados por documento** — exit 2 puede venir tras escrituras confirmadas, y un documento malformado falla en cada re-run. El re-run es seguro; hay que saber interpretarlo (ver las obligaciones de Task 9).
> 13. **La capa `src/services/*` está muerta** (8/8 `main.py` importan `src.db.utils.connection`, que no existe). Si alguien la resucita, necesita los hooks de Task 2.
> 14. **`merge_conversation_groups` no es re-run-safe** — `unread_count` se guarda antes de borrar los perdedores; un crash en esa ventana duplica el conteo.
> 15. **`raise HTTPException(404, "Conversation not found")` inalcanzable** en `get_messages`, con un mensaje engañoso: el fallo real es "Match not found".
> 16. **TOCTOU en `friends.py`** — `DuplicateKeyError` en vez de un 400.
> 17. **`Conversation.get(<id no-ObjectId>)` → 500** en vez de 400/404.
> 18. **`get_conversations` devuelve dicts sueltos sin `response_model`** → el contrato de la respuesta no se impone y una key mal escrita llega al cliente como `undefined` sin que nada lo detecte.
> 19. **El 400 por `DuplicateKeyError` no loguea nada** — un cliente que pierde la carrera no deja rastro servidor. Y el `print` del hook de amistad (`friends.py:302`) no incluye el `relationship.id`, así que un operador tiene que correlacionar por timestamp. Ambos son consecuencia directa de la restricción verbatim del brief de Task 7.
> 20. **El handler de `DuplicateKeyError` mapea *cualquier* duplicate a "already pending"** — hoy exacto (`relationship.py:81` es el único índice único del modelo), pero se vuelve mentiroso en silencio si algún día se añade otro índice único a `Relationship`. Inspeccionar `exc.details["keyPattern"]` lo blindaría.
> 21. **Una carrera sobre un relationship BLOCKED devolvería 400 en vez del 403 secuencial** — el mismo estado, dos códigos distintos según haya carrera. Inalcanzable hoy por el ítem 1, pero es la misma raíz.
> 22. **`IcebreakerButton` está roto por doble prefijo, y nunca funcionó** (2026-09-27, Task 8) — `icebreaker.py:9` declara `APIRouter(prefix="/icebreaker")` y `main.py:187` lo monta en `prefix="/api/icebreaker"`, así que la ruta viva es **`/api/icebreaker/icebreaker/chat/invite`**, mientras `IcebreakerButton.tsx:50` hace POST a `/api/icebreaker/chat/invite` → 404. Sin `redirect_slashes`, sin `rewrites` en `next.config.js` y sin reescritura de rutas en `security_middleware.py`. El valor del cuerpo es irrelevante para el routing, así que el `conversation_id` que Task 8 le pasa tampoco llega a `create_invite`. Y si se arregla el 404 sin tocar el modelo, `icebreaker.py:51-63` escribiría `Message(match_id=<conversation_id>)` sin check de participantes ni incremento de unread → documento huérfano invisible a `GET /chat/messages/{id}`. **Fix completo: corregir el montaje del router, migrar el `Message` a `conversation_id` y renombrar el prop `matchId`.** Prioridad 2.
> 23. **El `onmessage` del chat no maneja frames `{"error": ...}`** (2026-09-27, Task 8) — `chat.py:88,97,116,186,190` los emiten y las ramas de `index.tsx:281-307` sólo cubren `new_message`/`message_sent`/`message_read`. Si el otro usuario te bloquea con tu página abierta, el envío se rechaza con `"Conversation is blocked"` (`chat.py:116`) y **la burbuja optimista queda en `isSending: true` para siempre** sin feedback. Es el caso de uso del ítem 10 (frames sin `temp_id`), vista desde el cliente: los dos se arreglan juntos.
> 24. **El cliente nunca refresca la lista al abrir una conversación** (2026-09-27, Task 8) — `GET /chat/messages/{id}` resetea el unread en el servidor (`chat.py:432`) pero la UI no vuelve a pedir `/chat/conversations`, así que el badge de la conversación abierta queda obsoleto indefinidamente.
> 25. **El fallback legacy del `new_message` es inalcanzable en la práctica** (2026-09-27, Task 8) — todo `activeConversationId` procede de `/chat/conversations` (`chat.py:350`), luego siempre es un id de Conversation y nunca igualará a un `match_id` legacy. El `??` cumple la regla de "un solo lugar" y es inofensivo, pero **no aporta compatibilidad real**: haría falta un mapa match→conversation del lado receptor.
> 26. **`subscription_tier` es un campo muerto en la lista de chat** (2026-09-27, Task 8) — `GET /chat/conversations` (`chat.py:349-372`) nunca lo ha emitido en ningún commit, así que `tier` es siempre `undefined` y `PlanAvatar` nunca pinta insignia de tier en el chat. Preexistente, correctamente opcional en el tipo, sin delta.
> 27. **El Step 5 de Task 9 (checklist manual de 2 navegadores) NO se ejecutó y no es automatizable tal como está escrito** (2026-09-27, Task 9) — bloqueado porque el daemon de Docker no estaba corriendo, así que no había frontend ni API que abrir. **Prioridad 1 para el runbook de Task 10:** la evidencia de que "like → match → chat funciona sin 404" depende hoy de que una persona lo haga a mano. Con el fix de montaje de R45 (ítem 24 es su hermano, ya corregido), el paso 3 del checklist —"la conversación aparece en la lista"— es la **primera** comprobación que distingue un backend roto de un frontend roto, porque sin ella `activeConversationId` queda `null` y todo lo demás pasa desapercibido. Entregar como **runbook manual ejecutable** con comandos y criterio de éxito por paso, no como checklist que presume de automatizable.
> 28. **Correr `verify_chat_flow.py` muta el esquema de índices de la dev database** (2026-09-27, Task 9) — `init_beanie` construye los índices por sí solo: 8 en `relationships` (con `UNIQUE -> user_a_id_1_user_b_id_1_type_1`), 5 en `conversations` (con `UNIQUE -> relationship_id_1`) y 6 en `matches`. **No existe ninguna función `ensure_indexes()` en el codebase.** El script borra los *documentos* que crea pero **no** los índices, y no debe hacerlo: son parte del modelo. Documentarlo para que nadie se sorprenda al verlos aparecer ni los limpie a ciegas. Corregir de paso la premisa de que el `OK` del script "no verifica el índice único": **sí es evidencia parcial** — un duplicado real habría lanzado `DuplicateKeyError`. Lo que el script **no** cubre es la carrera que dispara ese error, que sólo alcanzan los tests unitarios con mocks.
> 29. **Las ramas de exit 1 y 2 del backfill no se ejercitaron** (2026-09-27, Task 9) — la DB relevante estaba vacía (`matches=0`, `relationships=0`), así que sólo se probó la rama de BD vacía, que es la que confirma el contrato "exit 0 = ok, incluida la BD vacía". Para cubrir las otras dos hace falta sembrar un `match` MATCHED y un documento legacy malformado.

- [ ] **Step 3: Suite completa backend + frontend**

```powershell
cd backend; $env:PYTHONPATH="."; .\venv\Scripts\python -m pytest tests -q; if ($?) { cd ..\frontend; npm run lint; if ($?) { npx tsc --noEmit } } }
```
Expected: `137 passed` (o más, si Task 9 añadió asserts ejecutables) + lint/tsc igual al baseline.

- [ ] **Step 4: Revisión final del diff**

```powershell
git status; git diff --stat
```

Expected: solo archivos de los Tasks 1-9 + estas 2 docs. Nada de `node_modules`, `.env`, `venv/`, `__pycache__/`.

- [ ] **Step 5: Commit final (SOLO con aprobación explícita del usuario)**

```powershell
git add <archivos revisados en Step 4>
git commit -m "fix(chat): unify chat on Conversation system — P0-1/P0-2 (CARE F0)"
```

(Alternativa, si el usuario aprobó commits por tarea: omitir este commit agregador.)

---

## Self-Review (ejecutado al escribir el plan)

1. **Spec coverage** — `CARE_ROADMAP.md` §2: P0-1 → Task 4; P0-2 → Tasks 1, 2, 3, 5, 6, 7, 8; criterio "DTO alineado" → Tasks 6+8; criterio "E2E sin 404" → Task 9. `CARE_ALGORITHM.md` §11.5.1 (prueba E2E) → Task 9. Sin gaps.
2. **Placeholder scan** — sin TBD/TODO/"como en Task N"; todo bloque de código es completo y autocontenido (incluido el script de la Task 9, ejecutable tal cual).
3. **Type consistency** — `ensure_match_conversation(match)`/`ensure_friend_conversation(relationship)` idénticos en Tasks 1→2→3→7→9; `resolve_message_source`/`resolve_ws_send_mode` idénticos en Tasks 4→5; `conversation_id`/`status`/`blocked_by`/`last_message_content` coinciden entre backend (Tasks 4/6) y frontend (Task 8). Recuentos de tests: 112 baseline + 17 (Task 1) + 8 (Task 4) = 137.
