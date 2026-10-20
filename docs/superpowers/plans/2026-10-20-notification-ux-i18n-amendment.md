# Notificaciones 2.0 — Enmienda UX/UI + i18n (F2) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Llevar la bandeja de notificaciones al blueprint aprobado: panel liquid glass adaptado a desktop/tablet/móvil con tabs, archivar/borrar/posponer con undo, agrupación con copy i18n en 21 idiomas, quick reply y ajustes de silencio.

**Architecture:** Se construye sobre la Fase A F1 (T1/T2/T3-F1/T7-F1/T10-F1, T4/T5/T6/T8) sin reimplementarla: el backend suma estado por notificación (`archived_at/deleted_at/snoozed_until`) y acciones con eventos WS; el frontend reemplaza el copy por plantillas i18n (`metadata.template` + `Intl`) y monta el panel en `Drawer` (desktop) o `BottomSheet` (tablet/móvil).

**Tech Stack:** FastAPI + Beanie (MongoDB), pytest, Next.js/React + MUI, i18next/next-i18next, jest/RTL, notistack.

**Spec:** `docs/superpowers/specs/2026-10-20-notification-ux-i18n-amendment-design.md` (vinculante; enmienda a `2026-10-19-notification-center-design.md`).

## PRE-CONDICIÓN (obligatoria antes de ejecutar)

- **No ejecutar mientras otra sesión esté activa en este árbol.** El trabajo F1 + media attribution estaba sin commitear al escribir este plan (plan y spec base modificados en el working tree; `notification_service`, `discovery`, `match`, `smart_photos`, `NotificationItem`, componentes de perfil y tests).
- Antes de empezar: la sesión dueña debe commitear o stashear su trabajo. Registrar el commit base (`BASE_F2`) y usarlo para reviews.
- Este plan **supone F1 ejecutada**: T3-F1 (API de bandeja con `{items,next_cursor}`, counts por bucket, `read-bucket`, `unread`), T7A (claves `notifications.*`), T7-F1 (`useNotifications(filter, opts)`, panel/item con click-through), T10-F1 (`notificationSync` + badge). Si F1 cambió firmas, ajustar las referencias de este plan antes de ejecutar.
- Tareas T4/T5/T6/T8 pertenecen al plan base/F1: **no se repiten aquí**. Este plan solo toca lo que la enmienda 2026-10-20 añade o supersede.

## Global Constraints

- 21 locales: `en es pt fr de it ru sv nl zh hi bn ja ko ar sw ha am tl ms mi`; `defaultLocale=en`; `fallbackLng=en`.
- El backend NO guarda copy final para eventos nuevos: guarda `type` + `metadata.template` + `metadata.actors`; `content` es solo fallback/legado/admin.
- Nombres de usuario y previews NO se traducen. Fechas con `Intl.RelativeTimeFormat`, listas con `Intl.ListFormat`, números con `Intl.NumberFormat`.
- RTL app-wide fuera de alcance: usar propiedades lógicas (`ms/me`, `insetInline*`) y gestos por inline-start/end.
- Commits locales, mensaje estilo repo, **nunca push**.
- Backend tests (desde `backend/`): `venv\Scripts\python.exe -m pytest tests/<archivo> -q`; patrón de casa: puro + `unittest.mock.patch.object`/`AsyncMock` sobre clases Beanie. `tests/conftest.py` ya registra `DocumentSettings` de `Notification`.
- Frontend tests (desde `frontend/`): `npx jest <ruta> --ci`; `npm run typecheck`; `npm run lint`. Mocks LOCALES de `next/router` y de `useTranslation`. `sx` con `borderRadius` en px string. NO tocar archivos WIP del lab (`UserSearchAutocomplete*`, `CareFormulaCanvas*`, `careExperiments*`, `jest.setup.ts`, `.freebuff/`).
- Motion: usar `motionTokens` de `frontend/src/theme/liquidGlass.ts` (easing `cubic-bezier(0.22,1,0.36,1)`; 140/280/640 ms). Respetar `prefers-reduced-motion`.
- A11y: `role="dialog"`/`aria-modal`, tabs accesibles, Esc cierra, targets ≥44px, labels i18n.
- No tocar `backend/src/services/chat/` ni `backend/src/services/settings/` (microservicios standalone).

## File Structure

Backend:

- `backend/src/models/notification.py` — + `archived_at`, `deleted_at`, `snoozed_until`.
- `backend/src/services/notification_service.py` — filtro de visibilidad, acciones, snooze, eventos.
- `backend/src/api/notifications.py` — endpoints de acción + `filter=archived` + counts con visibilidad.
- `backend/tests/test_notification_actions.py` — nuevo (servicio).
- `backend/tests/test_notifications_actions_api.py` — nuevo (API).

Frontend:

- `frontend/src/components/notifications/notificationText.ts` — plantillas + `Intl` + `NOTIFICATION_KEYS`.
- `frontend/public/locales/*/common.json` — subárbol `notifications.*` en 21 locales.
- `frontend/src/components/notifications/NotificationItem.tsx` — item 2.0 (reescritura).
- `frontend/src/components/notifications/NotificationSwipeable.tsx` — gestos.
- `frontend/src/components/notifications/SnoozeMenu.tsx` — menú de posposición.
- `frontend/src/components/notifications/NotificationPanel.tsx` — shell/tabs/archivadas/undo.
- `frontend/src/hooks/useNotifications.ts` — acciones optimistas (extiende F1).
- `frontend/src/hooks/notificationSync.ts` — acciones WS nuevas (extiende F1).
- `frontend/src/components/layout/Layout.tsx` — presentación Drawer/BottomSheet.
- `frontend/src/components/settings/NotificationsSection.tsx` — toggles de mute.
- Tests: `notificationText.test.ts`, `notificationsI18n.test.ts`, `NotificationItem.test.tsx`, `NotificationSwipeable.test.tsx`, `SnoozeMenu.test.tsx`, `NotificationPanel.test.tsx`, `useNotifications.test.ts`, `notificationSync.test.ts`, `NotificationsSection.test.tsx`.

---

### Task F2-1: Backend — estado por notificación (archivar/borrar/posponer) + visibilidad

**Files:**
- Modify: `backend/src/models/notification.py`
- Modify: `backend/src/services/notification_service.py`
- Test: `backend/tests/test_notification_actions.py`

**Interfaces:**
- Consumes: `Notification`, `manager`, `bucket_for`, `UserSettings.notification_mutes` (T3-F1).
- Produces:
  - `SNOOZE_DURATIONS: dict[str, timedelta]` (`15m/1h/2h/8h/1d`).
  - `visible_filter(user_id: str, archived_only: bool = False, now: datetime | None = None) -> dict`
  - `set_archived(notification_id: str, user_id: str, archived: bool) -> Optional[Notification]`
  - `set_deleted(notification_id: str, user_id: str) -> Optional[Notification]`
  - `restore_notification(notification_id: str, user_id: str) -> Optional[Notification]`
  - `snooze_notification(notification_id: str, user_id: str, duration: str) -> Optional[Notification]`
  - `unsnooze_notification(notification_id: str, user_id: str) -> Optional[Notification]`
  - Eventos WS: `notification_archived|notification_unarchived|notification_deleted|notification_restored|notification_snoozed|notification_unsnoozed|notifications_sync`.

- [ ] **Step 1: Escribir tests que fallan**

`backend/tests/test_notification_actions.py`:

```python
from datetime import datetime, timedelta
from types import SimpleNamespace
from unittest.mock import AsyncMock, patch

import pytest

from src.models.notification import Notification
from src.services import notification_service as ns


def _doc(**kw):
    base = dict(user_id="u1", type="like", content="", metadata={}, is_read=False)
    base.update(kw)
    return Notification(**base)


def test_visible_filter_excludes_archived_deleted_snoozed():
    now = datetime.utcnow()
    q = ns.visible_filter("u1", now=now)
    assert q["user_id"] == "u1"
    assert q["deleted_at"] is None
    assert q["archived_at"] is None
    assert {"snoozed_until": None} in q["$or"]
    assert {"snoozed_until": {"$lte": now}} in q["$or"]


def test_visible_filter_archived_only():
    q = ns.visible_filter("u1", archived_only=True)
    assert q["archived_at"] == {"$ne": None}


@pytest.mark.asyncio
async def test_set_archived_sets_timestamp_and_pushes():
    doc = _doc()
    with patch.object(Notification, "get", new=AsyncMock(return_value=doc)), patch.object(
        Notification, "save", new=AsyncMock()
    ), patch.object(ns.manager, "send_personal_message", new=AsyncMock()) as push:
        got = await ns.set_archived("n1", "u1", True)
    assert got is doc and doc.archived_at is not None
    push.assert_awaited_once()
    assert push.await_args.args[1]["action"] == "notification_archived"


@pytest.mark.asyncio
async def test_set_archived_rejects_foreign_user():
    doc = _doc(user_id="other")
    with patch.object(Notification, "get", new=AsyncMock(return_value=doc)):
        assert await ns.set_archived("n1", "u1", True) is None


@pytest.mark.asyncio
async def test_set_deleted_and_restore_round_trip():
    doc = _doc()
    with patch.object(Notification, "get", new=AsyncMock(return_value=doc)), patch.object(
        Notification, "save", new=AsyncMock()
    ), patch.object(ns.manager, "send_personal_message", new=AsyncMock()) as push:
        await ns.set_deleted("n1", "u1")
        assert doc.deleted_at is not None
        await ns.restore_notification("n1", "u1")
        assert doc.deleted_at is None
    actions = [c.args[1]["action"] for c in push.await_args_list]
    assert actions == ["notification_deleted", "notification_restored"]


@pytest.mark.asyncio
async def test_snooze_sets_until_and_pushes_sync():
    doc = _doc()
    with patch.object(Notification, "get", new=AsyncMock(return_value=doc)), patch.object(
        Notification, "save", new=AsyncMock()
    ), patch.object(ns.manager, "send_personal_message", new=AsyncMock()) as push:
        before = datetime.utcnow()
        got = await ns.snooze_notification("n1", "u1", "1h")
    assert got.snoozed_until >= before + timedelta(minutes=59)
    actions = [c.args[1]["action"] for c in push.await_args_list]
    assert actions == ["notification_snoozed", "notifications_sync"]


@pytest.mark.asyncio
async def test_snooze_rejects_unknown_duration():
    with pytest.raises(ValueError):
        await ns.snooze_notification("n1", "u1", "3d")


@pytest.mark.asyncio
async def test_snooze_always_sets_mute_and_marks_read():
    doc = _doc(type="like")
    settings = SimpleNamespace(notification_mutes={}, save=AsyncMock())
    with patch.object(Notification, "get", new=AsyncMock(return_value=doc)), patch.object(
        Notification, "save", new=AsyncMock()
    ), patch.object(
        "src.models.user_settings.UserSettings.find_one",
        new=AsyncMock(return_value=settings),
    ), patch.object(ns.manager, "send_personal_message", new=AsyncMock()):
        await ns.snooze_notification("n1", "u1", "always")
    assert settings.notification_mutes == {"social": True}
    assert doc.is_read is True
    assert doc.snoozed_until is None


@pytest.mark.asyncio
async def test_unsnooze_clears_field():
    doc = _doc(snoozed_until=datetime.utcnow() + timedelta(hours=1))
    with patch.object(Notification, "get", new=AsyncMock(return_value=doc)), patch.object(
        Notification, "save", new=AsyncMock()
    ), patch.object(ns.manager, "send_personal_message", new=AsyncMock()) as push:
        await ns.unsnooze_notification("n1", "u1")
    assert doc.snoozed_until is None
    assert push.await_args.args[1]["action"] == "notification_unsnoozed"
```

- [ ] **Step 2: Ver fallar**

Run (desde `backend/`): `venv\Scripts\python.exe -m pytest tests/test_notification_actions.py -q`
Expected: FAIL — `visible_filter`/acciones no existen.

- [ ] **Step 3: Implementar**

`backend/src/models/notification.py` — añadir campos y un índice:

```python
    archived_at: Optional[datetime] = None
    deleted_at: Optional[datetime] = None
    snoozed_until: Optional[datetime] = None
```

```python
            [("user_id", 1), ("archived_at", 1), ("updated_at", -1)],
```

`backend/src/services/notification_service.py` — al final del módulo:

```python
SNOOZE_DURATIONS = {
    "15m": timedelta(minutes=15),
    "1h": timedelta(hours=1),
    "2h": timedelta(hours=2),
    "8h": timedelta(hours=8),
    "1d": timedelta(days=1),
}


def visible_filter(
    user_id: str, archived_only: bool = False, now: Optional[datetime] = None
) -> dict:
    now = now or datetime.utcnow()
    return {
        "user_id": user_id,
        "deleted_at": None,
        "archived_at": {"$ne": None} if archived_only else None,
        "$or": [{"snoozed_until": None}, {"snoozed_until": {"$lte": now}}],
    }


async def _owned(notification_id: str, user_id: str) -> Optional[Notification]:
    doc = await Notification.get(notification_id)
    if doc is None or doc.user_id != user_id:
        return None
    return doc


async def _push_action(user_id: str, action: str, **extra: Any) -> None:
    await manager.send_personal_message(user_id, {"action": action, **extra})


async def set_archived(
    notification_id: str, user_id: str, archived: bool
) -> Optional[Notification]:
    doc = await _owned(notification_id, user_id)
    if doc is None:
        return None
    doc.archived_at = datetime.utcnow() if archived else None
    await doc.save()
    await _push_action(
        user_id,
        "notification_archived" if archived else "notification_unarchived",
        id=notification_id,
    )
    return doc


async def set_deleted(notification_id: str, user_id: str) -> Optional[Notification]:
    doc = await _owned(notification_id, user_id)
    if doc is None:
        return None
    doc.deleted_at = datetime.utcnow()
    await doc.save()
    await _push_action(user_id, "notification_deleted", id=notification_id)
    return doc


async def restore_notification(
    notification_id: str, user_id: str
) -> Optional[Notification]:
    doc = await _owned(notification_id, user_id)
    if doc is None:
        return None
    doc.deleted_at = None
    await doc.save()
    await _push_action(user_id, "notification_restored", id=notification_id)
    return doc


async def _apply_always_mute(doc: Notification) -> None:
    from src.models.user_settings import UserSettings

    settings = await UserSettings.find_one({"user_id": doc.user_id})
    if settings is None:
        return
    mutes = dict(settings.notification_mutes or {})
    mutes[bucket_for(doc.type)] = True
    settings.notification_mutes = mutes
    await settings.save()


async def snooze_notification(
    notification_id: str, user_id: str, duration: str
) -> Optional[Notification]:
    if duration not in (*SNOOZE_DURATIONS.keys(), "always"):
        raise ValueError(f"Invalid snooze duration: {duration}")
    doc = await _owned(notification_id, user_id)
    if doc is None:
        return None
    if duration == "always":
        await _apply_always_mute(doc)
        doc.is_read = True
        doc.snoozed_until = None
    else:
        doc.snoozed_until = datetime.utcnow() + SNOOZE_DURATIONS[duration]
    await doc.save()
    await _push_action(
        user_id,
        "notification_snoozed",
        id=notification_id,
        duration=duration,
        until=doc.snoozed_until.isoformat() if doc.snoozed_until else None,
    )
    await _push_action(user_id, "notifications_sync")
    return doc


async def unsnooze_notification(
    notification_id: str, user_id: str
) -> Optional[Notification]:
    doc = await _owned(notification_id, user_id)
    if doc is None:
        return None
    doc.snoozed_until = None
    await doc.save()
    await _push_action(user_id, "notification_unsnoozed", id=notification_id)
    await _push_action(user_id, "notifications_sync")
    return doc
```

- [ ] **Step 4: Ver pasar**

Run: `venv\Scripts\python.exe -m pytest tests/test_notification_actions.py tests/test_notification_service.py -q`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/src/models/notification.py backend/src/services/notification_service.py backend/tests/test_notification_actions.py
git commit -m "feat(notifications): archivar, borrar y posponer con visibilidad"
```

---

### Task F2-2: Backend — endpoints de acción + counts sin archivadas/pospuestas

**Files:**
- Modify: `backend/src/api/notifications.py`
- Test: `backend/tests/test_notifications_actions_api.py`

**Interfaces:**
- Consumes: F2-1 (`visible_filter`, `set_archived`, `set_deleted`, `restore_notification`, `snooze_notification`, `unsnooze_notification`, `SNOOZE_DURATIONS`); T3-F1 (`visibility_query`, `_compose_counts`, `_mute_context`, `_serialize_item`).
- Produces:
  - `POST /notifications/{id}/archive|unarchive|restore|unsnooze` → `{ok: true}` (404 si no es del usuario).
  - `DELETE /notifications/{id}` → `{ok: true}`.
  - `POST /notifications/{id}/snooze` `{duration}` → `{snoozed_until: str | null}`; 422 si duración inválida.
  - `GET /notifications?filter=archived` → `{items, next_cursor}` (solo archivadas; ignora mutes).
  - `GET /notifications/unread-count` excluye archivadas/borradas/pospuestas.

- [ ] **Step 1: Escribir tests que fallan**

`backend/tests/test_notifications_actions_api.py`:

```python
from types import SimpleNamespace
from unittest.mock import AsyncMock, patch

import pytest
from fastapi import HTTPException

from src.api import notifications as api


def _user():
    return SimpleNamespace(id="u1")


@pytest.mark.asyncio
async def test_archive_calls_service():
    with patch.object(api.ns, "set_archived", new=AsyncMock(return_value=object())) as svc:
        out = await api.archive_notification("n1", _user())
    assert out == {"ok": True}
    svc.assert_awaited_once_with("n1", "u1", True)


@pytest.mark.asyncio
async def test_archive_missing_raises_404():
    with patch.object(api.ns, "set_archived", new=AsyncMock(return_value=None)):
        with pytest.raises(HTTPException) as exc:
            await api.archive_notification("n1", _user())
    assert exc.value.status_code == 404


@pytest.mark.asyncio
async def test_snooze_rejects_bad_duration():
    with pytest.raises(HTTPException) as exc:
        await api.snooze_notification_route(
            "n1", api.SnoozeRequest(duration="3d"), _user()
        )
    assert exc.value.status_code == 422


@pytest.mark.asyncio
async def test_snooze_returns_until():
    doc = SimpleNamespace(snoozed_until=None)
    with patch.object(
        api.ns, "snooze_notification", new=AsyncMock(return_value=doc)
    ):
        out = await api.snooze_notification_route(
            "n1", api.SnoozeRequest(duration="1h"), _user()
        )
    assert out == {"snoozed_until": None}


@pytest.mark.asyncio
async def test_archived_filter_uses_archived_only_query():
    captured = {}

    class Chain:
        def __init__(self, items):
            self._items = items

        def sort(self, *_a, **_k):
            return self

        def limit(self, _n):
            return self

        async def to_list(self):
            return self._items

    def fake_find(query):
        captured["query"] = query
        return Chain([])

    with patch.object(api.Notification, "find", side_effect=fake_find), patch.object(
        api, "_mute_context", new=AsyncMock(return_value=({}, True))
    ):
        out = await api.list_notifications(filter="archived", cursor=None, limit=20, unread=False, current_user=_user())
    assert out == {"items": [], "next_cursor": None}
    assert captured["query"]["archived_at"] == {"$ne": None}
    assert captured["query"]["deleted_at"] is None


def test_scoped_query_ands_visibility():
    q = api._scoped_query("u1", "all", {}, True)
    assert "$and" in q
    assert any("deleted_at" in part for part in q["$and"])
```

- [ ] **Step 2: Ver fallar**

Run: `venv\Scripts\python.exe -m pytest tests/test_notifications_actions_api.py -q`
Expected: FAIL — rutas/helpers no existen.

- [ ] **Step 3: Implementar**

En `backend/src/api/notifications.py`:

```python
from src.services import notification_service as ns

SNOOZE_VALUES = ("15m", "1h", "2h", "8h", "1d", "always")


class SnoozeRequest(BaseModel):
    duration: str


def _scoped_query(user_id: str, flt: str, mutes: dict, master: bool) -> dict:
    return {
        "$and": [
            ns.visible_filter(user_id),
            ns.visibility_query(user_id, flt, mutes, master),
        ]
    }


def _require_item(doc):
    if doc is None:
        raise HTTPException(status_code=404, detail="Notification not found")
```

Rutas (declararlas antes de `/{notification_id}/read`):

```python
@router.post("/{notification_id}/archive")
async def archive_notification(notification_id: str, current_user=Depends(get_current_user)):
    doc = await ns.set_archived(notification_id, str(current_user.id), True)
    _require_item(doc)
    return {"ok": True}


@router.post("/{notification_id}/unarchive")
async def unarchive_notification(notification_id: str, current_user=Depends(get_current_user)):
    doc = await ns.set_archived(notification_id, str(current_user.id), False)
    _require_item(doc)
    return {"ok": True}


@router.delete("/{notification_id}")
async def delete_notification(notification_id: str, current_user=Depends(get_current_user)):
    doc = await ns.set_deleted(notification_id, str(current_user.id))
    _require_item(doc)
    return {"ok": True}


@router.post("/{notification_id}/restore")
async def restore_notification(notification_id: str, current_user=Depends(get_current_user)):
    doc = await ns.restore_notification(notification_id, str(current_user.id))
    _require_item(doc)
    return {"ok": True}


@router.post("/{notification_id}/snooze")
async def snooze_notification_route(
    notification_id: str,
    payload: SnoozeRequest,
    current_user=Depends(get_current_user),
):
    if payload.duration not in SNOOZE_VALUES:
        raise HTTPException(status_code=422, detail="Invalid duration")
    doc = await ns.snooze_notification(
        notification_id, str(current_user.id), payload.duration
    )
    _require_item(doc)
    return {
        "snoozed_until": (
            doc.snoozed_until.isoformat() if doc.snoozed_until else None
        )
    }


@router.post("/{notification_id}/unsnooze")
async def unsnooze_notification_route(notification_id: str, current_user=Depends(get_current_user)):
    doc = await ns.unsnooze_notification(notification_id, str(current_user.id))
    _require_item(doc)
    return {"ok": True}
```

`list_notifications`: aceptar `filter="archived"`:

```python
    if filter == "archived":
        query = ns.visible_filter(str(current_user.id), archived_only=True)
    else:
        query = _scoped_query(str(current_user.id), filter, mutes, master)
```

`unread-count`: sustituir cada query por `_scoped_query(...)` (social/messages/system) para excluir archivadas/pospuestas/borradas, manteniendo `_compose_counts` y `survey_pending`.

- [ ] **Step 4: Ver pasar**

Run: `venv\Scripts\python.exe -m pytest tests/test_notifications_actions_api.py tests/test_notifications_api.py -q`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/src/api/notifications.py backend/tests/test_notifications_actions_api.py
git commit -m "feat(notifications): endpoints de archivo, borrado y posposicion"
```

---

### Task F2-3: i18n — helper `notificationText` + claves en 21 locales (supersede Task 7A)

**Files:**
- Create: `frontend/src/components/notifications/notificationText.ts`
- Create: `frontend/src/components/notifications/notificationText.test.ts`
- Create: `frontend/src/components/notifications/notificationsI18n.test.ts` (reemplaza/absorbe `notificationLocaleKeys.test.ts`)
- Modify: `frontend/public/locales/*/common.json` (21 archivos)

**Interfaces:**
- Consumes: `Notification` shape (`type`, `metadata`, `actors`, `actor_count`, `content`, `created_at`/`updated_at`).
- Produces:
  - `NOTIFICATION_KEYS: readonly string[]`
  - `normalizeLocale(lng?: string): string`
  - `formatRelativeTime(iso: string, locale: string, now?: number): string`
  - `buildNotificationText(notification: any, t: TFunction, locale?: string): { title: string; body?: string; template: string }`

- [ ] **Step 1: Tests que fallan**

`notificationText.test.ts`:

```typescript
import { buildNotificationText, formatRelativeTime, normalizeLocale } from "./notificationText";

const t = ((key: string, opts?: any) => {
  const map: Record<string, string> = {
    "notifications.like.single": "{{name}} liked your photo",
    "notifications.like.superlike": "{{name}} sent you a Super Like",
    "notifications.like.group": "{{names}} and {{count}} more liked your photo",
    "notifications.like.groupAll": "{{names}} liked your photo",
    "notifications.match.single": "It's a match with {{name}}!",
    "notifications.message.single": "New message from {{name}}",
    "notifications.survey.title": "CARE preferences",
    "notifications.survey.pending": "{{count}} questions left",
    "notifications.system.fallback": "Red Thread",
    "notifications.promo.title": "Update",
    "notifications.actor.fallback": "Someone",
  };
  const raw = map[key] ?? key;
  return raw.replace(/\{\{(\w+)\}\}/g, (_, k) => String(opts?.[k] ?? ""));
}) as any;

it("renders single like", () => {
  const out = buildNotificationText({ type: "like", metadata: {}, actor_count: 1, user: { name: "Ana" } }, t, "en");
  expect(out.title).toBe("Ana liked your photo");
});

it("renders grouped like with extras", () => {
  const out = buildNotificationText(
    { type: "like", metadata: {}, actor_count: 5, actors: [{ name: "Ana" }, { name: "Bea" }] },
    t, "en",
  );
  expect(out.title).toBe("Ana and Bea and 3 more liked your photo");
});

it("uses preview for messages and does not translate it", () => {
  const out = buildNotificationText(
    { type: "message", metadata: { preview: "hola" }, actor_count: 1, user: { name: "Ana" } },
    t, "es",
  );
  expect(out.body).toBe("hola");
});

it("falls back to legacy content", () => {
  const out = buildNotificationText({ type: "like", content: "texto viejo", metadata: {}, actor_count: 1 }, t, "en");
  expect(out.title).toBe("texto viejo");
});

it("normalizes locales and formats relative time", () => {
  expect(normalizeLocale("es-MX")).toBe("es");
  expect(normalizeLocale("xx")).toBe("en");
  expect(formatRelativeTime(new Date(Date.now() - 3600_000).toISOString(), "es")).toMatch(/hace 1 hora/);
});
```

`notificationsI18n.test.ts`:

```typescript
import fs from "fs";
import path from "path";
import { NOTIFICATION_KEYS } from "./notificationText";

const LOCALES = ["en","es","pt","fr","de","it","ru","sv","nl","zh","hi","bn","ja","ko","ar","sw","ha","am","tl","ms","mi"];
const read = (lng: string) =>
  JSON.parse(fs.readFileSync(path.join(process.cwd(), "public", "locales", lng, "common.json"), "utf8"));
const get = (obj: any, key: string) =>
  key.split(".").reduce((acc, part) => (acc == null ? acc : acc[part]), obj);

describe("notifications i18n completeness", () => {
  it.each(LOCALES)("%s has every notification key", (lng) => {
    for (const key of NOTIFICATION_KEYS) {
      const value = get(read(lng), key);
      expect(typeof value).toBe("string");
      expect(value.length).toBeGreaterThan(0);
    }
  });
});
```

- [ ] **Step 2: Ver fallar**

Run: `npx jest src/components/notifications/notificationText.test.ts src/components/notifications/notificationsI18n.test.ts --ci`
Expected: FAIL — módulo y claves no existen.

- [ ] **Step 3: Implementar helper**

`notificationText.ts`:

```typescript
import type { TFunction } from "i18next";

export const LOCALES = ["en","es","pt","fr","de","it","ru","sv","nl","zh","hi","bn","ja","ko","ar","sw","ha","am","tl","ms","mi"] as const;

export const NOTIFICATION_KEYS = [
  "notifications.title",
  "notifications.close",
  "notifications.retry",
  "notifications.markAllRead",
  "notifications.error",
  "notifications.tabs.all",
  "notifications.tabs.likes",
  "notifications.tabs.chats",
  "notifications.tabs.system",
  "notifications.empty.all",
  "notifications.empty.likes",
  "notifications.empty.chats",
  "notifications.empty.system",
  "notifications.empty.archived",
  "notifications.like.single",
  "notifications.like.superlike",
  "notifications.like.group_one",
  "notifications.like.group_other",
  "notifications.like.groupAll",
  "notifications.match.single",
  "notifications.message.single",
  "notifications.survey.title",
  "notifications.survey.pending_one",
  "notifications.survey.pending_other",
  "notifications.system.fallback",
  "notifications.promo.title",
  "notifications.actor.fallback",
  "notifications.actions.archive",
  "notifications.actions.unarchive",
  "notifications.actions.delete",
  "notifications.actions.snooze",
  "notifications.actions.undo",
  "notifications.actions.markRead",
  "notifications.snooze.title",
  "notifications.snooze.15m",
  "notifications.snooze.1h",
  "notifications.snooze.2h",
  "notifications.snooze.8h",
  "notifications.snooze.1d",
  "notifications.snooze.always",
  "notifications.archived.title",
  "notifications.archived.open",
  "notifications.undo.archived",
  "notifications.undo.deleted",
  "notifications.undo.snoozed",
  "notifications.quickReply.placeholder",
  "notifications.quickReply.send",
  "notifications.expand.more",
  "notifications.expand.less",
] as const;

export function normalizeLocale(lng?: string): string {
  const base = (lng || "en").split("-")[0].toLowerCase();
  return (LOCALES as readonly string[]).includes(base) ? base : "en";
}

export function formatRelativeTime(iso: string, locale: string, now: number = Date.now()): string {
  const rtf = new Intl.RelativeTimeFormat(normalizeLocale(locale), { numeric: "auto" });
  const diff = new Date(iso).getTime() - now;
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 31_536_000_000],
    ["month", 2_592_000_000],
    ["week", 604_800_000],
    ["day", 86_400_000],
    ["hour", 3_600_000],
    ["minute", 60_000],
    ["second", 1_000],
  ];
  for (const [unit, ms] of units) {
    if (Math.abs(diff) >= ms || unit === "second") {
      return rtf.format(Math.round(diff / ms), unit);
    }
  }
  return rtf.format(0, "second");
}

export function buildNotificationText(
  notification: any,
  t: TFunction,
  locale: string = "en",
): { title: string; body?: string; template: string } {
  const meta = notification.metadata || {};
  const template = meta.template || (notification.type === "message" ? "message" : "legacy");
  const fallbackName = t("notifications.actor.fallback");
  const name = notification.user?.name || notification.actors?.[0]?.name || fallbackName;
  const lng = normalizeLocale(locale);

  if (notification.type === "like") {
    if (meta.superlike) {
      return { title: t("notifications.like.superlike", { name }), template: "like.superlike" };
    }
    const count = notification.actor_count || 1;
    if (count > 1) {
      const shown = (notification.actors || []).slice(0, 3).map((a: any) => a.name).filter(Boolean);
      const names = new Intl.ListFormat(lng, { type: "conjunction" }).format(shown);
      if (shown.length >= count) {
        return { title: t("notifications.like.groupAll", { names }), template: "like.group" };
      }
      return {
        title: t("notifications.like.group", { names, count: count - shown.length }),
        template: "like.group",
      };
    }
  }

  switch (notification.type) {
    case "like":
      return { title: notification.content || t("notifications.like.single", { name }), template: "like.single" };
    case "match":
      return { title: notification.content || t("notifications.match.single", { name }), template: "match" };
    case "message":
      return { title: t("notifications.message.single", { name }), body: meta.preview || notification.content, template: "message" };
    case "system":
      if (template === "system.survey" || meta.template === "system.survey") {
        const count = meta.params?.questions_pending ?? 1;
        return { title: t("notifications.survey.title"), body: t("notifications.survey.pending", { count }), template: "system.survey" };
      }
      return { title: notification.content || t("notifications.system.fallback"), template: "system.generic" };
    case "survey":
      return { title: t("notifications.survey.title"), body: t("notifications.survey.pending", { count: meta.params?.questions_pending ?? 1 }), template: "system.survey" };
    case "promo":
      return { title: notification.content || t("notifications.promo.title"), template: "promo" };
    default:
      return { title: notification.content || t("notifications.system.fallback"), template: "legacy" };
  }
}
```

- [ ] **Step 4: Claves en 21 locales**

Añadir a cada `frontend/public/locales/<lng>/common.json` el subárbol (EN completo; traducir a los otros 20 conservando placeholders):

```json
"notifications": {
  "title": "Notifications",
  "close": "Close",
  "retry": "Retry",
  "markAllRead": "Mark all as read",
  "error": "We couldn't load your notifications.",
  "tabs": { "all": "All", "likes": "Likes", "chats": "Chats", "system": "System" },
  "empty": {
    "all": "You're all caught up.",
    "likes": "No likes yet.",
    "chats": "No new messages.",
    "system": "No announcements.",
    "archived": "Nothing archived."
  },
  "like": {
    "single": "{{name}} liked your photo",
    "superlike": "{{name}} sent you a Super Like",
    "group_one": "{{names}} and {{count}} more liked your photo",
    "group_other": "{{names}} and {{count}} more liked your photo",
    "groupAll": "{{names}} liked your photo"
  },
  "match": { "single": "It's a match with {{name}}!" },
  "message": { "single": "New message from {{name}}" },
  "survey": {
    "title": "CARE preferences",
    "pending_one": "You have 1 question left to complete your preferences.",
    "pending_other": "You have {{count}} questions left to complete your preferences."
  },
  "system": { "fallback": "Red Thread" },
  "promo": { "title": "Update" },
  "actor": { "fallback": "Someone" },
  "actions": {
    "archive": "Archive",
    "unarchive": "Restore",
    "delete": "Delete",
    "snooze": "Snooze",
    "undo": "Undo",
    "markRead": "Mark as read"
  },
  "snooze": {
    "title": "Snooze notifications",
    "15m": "15 minutes",
    "1h": "1 hour",
    "2h": "2 hours",
    "8h": "8 hours",
    "1d": "1 day",
    "always": "Always (mute this type)"
  },
  "archived": { "title": "Archived", "open": "View archived" },
  "undo": {
    "archived": "Notification archived",
    "deleted": "Notification deleted",
    "snoozed": "Notification snoozed"
  },
  "quickReply": { "placeholder": "Reply…", "send": "Send" },
  "expand": { "more": "Show more", "less": "Show less" }
}
```

ES: “Notificaciones”, “Cerrar”, “Reintentar”, “Marcar todo como leído”, “No pudimos cargar tus notificaciones.”, tabs “Todo/Likes/Chats/Sistema”, vacíos “Estás al día/Sin likes por ahora/Sin mensajes nuevos/Sin avisos/Nada archivado”, like “A {{name}} le gustó tu foto” / superlike “{{name}} te envió un Super Like” / grupo “A {{names}} y {{count}} más les gustó tu foto” / “A {{names}} les gustó tu foto”, match “¡Es un match con {{name}}!”, mensaje “Nuevo mensaje de {{name}}”, encuesta “Preferencias CARE” + “Te queda 1 pregunta…”/“Te quedan {{count}} preguntas…”, promo “Novedad”, actor “Alguien”, acciones “Archivar/Restaurar/Borrar/Posponer/Deshacer/Marcar como leído”, snooze “Posponer notificaciones/15 minutos/1 hora/2 horas/8 horas/1 día/Siempre (silenciar este tipo)”, archivadas “Archivadas/Ver archivadas”, undo “Notificación archivada/borrada/pospuesta”, quick reply “Responder…/Enviar”, expandir “Ver más/Ver menos.

Traducir los 19 restantes con el mismo set de claves y placeholders; el guard debe quedar verde.

- [ ] **Step 5: Correr y commit**

Run: `npx jest src/components/notifications/notificationText.test.ts src/components/notifications/notificationsI18n.test.ts --ci`; `npx tsc --noEmit`
Expected: PASS / limpio.

```bash
git add frontend/src/components/notifications/notificationText.ts frontend/src/components/notifications/notificationText.test.ts frontend/src/components/notifications/notificationsI18n.test.ts frontend/public/locales
git commit -m "feat(notifications-ui): copy i18n en 21 idiomas con Intl"
```

---

### Task F2-4: Item 2.0 — plantillas, thumbnail, no leído y bump

**Files:**
- Modify (rewrite): `frontend/src/components/notifications/NotificationItem.tsx`
- Modify (rewrite): `frontend/src/components/notifications/NotificationItem.test.tsx`
- Modify: `frontend/src/components/notifications/NotificationPanel.tsx` (pasar `bumped`)

**Interfaces:**
- Consumes: F2-3 `buildNotificationText`, `formatRelativeTime`; F1 `notification.user`.
- Produces: `NotificationItem({ notification, bumped, onRead, onNavigate, onArchive, onDelete, onSnooze, onQuickReply })`.
- Testids: `notification-item-${id}`, `notification-unread-dot`, `notification-thumb`, `notification-quick-reply`.

- [ ] **Step 1: Tests que fallan** (`NotificationItem.test.tsx`)

```tsx
import { fireEvent, render, screen } from "@testing-library/react";
import NotificationItem from "./NotificationItem";

jest.mock("next/router", () => ({ useRouter: () => ({ push: jest.fn() }) }));
jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (k: string, o?: any) => (o?.name ? `${k}:${o.name}` : k), i18n: { language: "en" } }),
}));

const base = { id: "n1", type: "like", metadata: {}, actor_count: 1, is_read: false, created_at: new Date().toISOString(), user: { name: "Ana" }, target_type: "likes" };

it("renders grouped like copy and thumbnail", () => {
  render(<NotificationItem notification={{ ...base, actor_count: 4, actors: [{ name: "Ana" }, { name: "Bea" }], metadata: { shown_media_thumbnail_url: "/m.jpg" } }} onRead={jest.fn()} />);
  expect(screen.getByText(/notifications.like.group/)).toBeInTheDocument();
  expect(screen.getByTestId("notification-thumb")).toBeInTheDocument();
});

it("shows quick reply only when can_reply", () => {
  render(<NotificationItem notification={{ ...base, type: "message", metadata: { can_reply: true, preview: "hola" }, target_type: "chat" }} onRead={jest.fn()} onQuickReply={jest.fn()} />);
  expect(screen.getByTestId("notification-quick-reply")).toBeInTheDocument();
});

it("calls onRead once on click when unread", () => {
  const onRead = jest.fn();
  render(<NotificationItem notification={base} onRead={onRead} />);
  fireEvent.click(screen.getByTestId("notification-item-n1"));
  expect(onRead).toHaveBeenCalledWith("n1");
});

it("applies unread styling", () => {
  render(<NotificationItem notification={base} onRead={jest.fn()} />);
  expect(screen.getByTestId("notification-item-n1")).toHaveStyle({ backgroundColor: "rgba(230,57,70,0.07)" });
});
```

- [ ] **Step 2: Ver fallar**

Run: `npx jest src/components/notifications/NotificationItem.test.tsx --ci`
Expected: FAIL.

- [ ] **Step 3: Implementar**

Reescribir el componente:

```tsx
import React, { useState } from "react";
import { Avatar, Box, IconButton, ListItem, ListItemAvatar, ListItemText, TextField, Typography } from "@mui/material";
import { ChatBubbleOutline, CampaignOutlined, FavoriteBorder, Send, SettingsOutlined } from "@mui/icons-material";
import { useTranslation } from "react-i18next";
import { liquidColors, motionTokens } from "../../theme/liquidGlass";
import { buildNotificationText, formatRelativeTime } from "./notificationText";

const iconFor = (type: string) => {
  if (type === "like") return <FavoriteBorder sx={{ color: liquidColors.primaryLight, fontSize: 16 }} />;
  if (type === "message") return <ChatBubbleOutline sx={{ color: liquidColors.accent, fontSize: 16 }} />;
  if (type === "promo") return <CampaignOutlined sx={{ color: liquidColors.accentGold, fontSize: 16 }} />;
  if (type === "match") return <FavoriteBorder sx={{ color: liquidColors.accentViolet, fontSize: 16 }} />;
  return <SettingsOutlined sx={{ color: "text.secondary", fontSize: 16 }} />;
};

const resolveUrl = (url?: string) => {
  if (!url) return undefined;
  if (url.startsWith("http") || url.startsWith("blob:")) return url;
  return `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}${url}`;
};

export default function NotificationItem({ notification, bumped, onRead, onNavigate, onQuickReply }: any) {
  const { t, i18n } = useTranslation("common");
  const [reply, setReply] = useState("");
  const [expanded, setExpanded] = useState(false);
  const { title, body } = buildNotificationText(notification, t, i18n.language);
  const thumb = notification.metadata?.shown_media_thumbnail_url || notification.metadata?.shown_media_url;
  const canReply = notification.type === "message" && notification.metadata?.can_reply;

  const handleClick = async () => {
    if (!notification.is_read) await onRead?.(notification.id);
    onNavigate?.(notification);
  };

  return (
    <ListItem
      data-testid={`notification-item-${notification.id}`}
      onClick={handleClick}
      alignItems="flex-start"
      sx={{
        cursor: "pointer",
        bgcolor: notification.is_read ? "transparent" : "rgba(230,57,70,0.07)",
        borderInlineStart: notification.is_read ? "3px solid transparent" : `3px solid ${liquidColors.primary}`,
        transition: `background-color ${motionTokens.durations.micro}ms ${motionTokens.easing}`,
        animation: bumped ? `notification-bump ${motionTokens.durations.macro}ms ${motionTokens.easing}` : "none",
        "@keyframes notification-bump": { "0%": { backgroundColor: "rgba(230,57,70,0.22)" }, "100%": { backgroundColor: "rgba(230,57,70,0.07)" } },
        "@media (prefers-reduced-motion: reduce)": { animation: "none" },
      }}
    >
      <ListItemAvatar sx={{ minWidth: 64 }}>
        <Box sx={{ position: "relative", width: 56, height: 56 }}>
          {thumb ? (
            <Box data-testid="notification-thumb" component="img" src={resolveUrl(thumb)} alt="" sx={{ width: 56, height: 56, borderRadius: "12px", objectFit: "cover" }} />
          ) : (
            <Avatar src={resolveUrl(notification.user?.photo)} sx={{ width: 56, height: 56 }}>{notification.user?.name?.[0]}</Avatar>
          )}
          <Box sx={{ position: "absolute", bottom: -2, right: -2, bgcolor: "background.paper", borderRadius: "50%", p: 0.5, boxShadow: 1 }}>{iconFor(notification.type)}</Box>
        </Box>
      </ListItemAvatar>
      <ListItemText
        primary={
          <Typography variant="subtitle2" sx={{ fontWeight: notification.is_read ? 400 : 600, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
            {title}
          </Typography>
        }
        secondary={
          <Box component="span">
            {body && (
              <Typography component="span" variant="body2" sx={{ display: "-webkit-box", WebkitLineClamp: expanded ? "unset" : 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                {body}
              </Typography>
            )}
            {notification.type === "promo" && (
              <Typography component="span" variant="caption" sx={{ color: "primary.main", cursor: "pointer" }} onClick={(e) => { e.stopPropagation(); setExpanded((v) => !v); }}>
                {expanded ? t("notifications.expand.less") : t("notifications.expand.more")}
              </Typography>
            )}
            <Typography variant="caption" sx={{ display: "block", color: "text.secondary", mt: 0.5 }}>
              {formatRelativeTime(notification.updated_at || notification.created_at, i18n.language)}
            </Typography>
            {canReply && (
              <Box data-testid="notification-quick-reply" sx={{ display: "flex", gap: 1, mt: 1 }} onClick={(e) => e.stopPropagation()}>
                <TextField size="small" fullWidth placeholder={t("notifications.quickReply.placeholder")} value={reply} onChange={(e) => setReply(e.target.value)} />
                <IconButton aria-label={t("notifications.quickReply.send")} disabled={!reply.trim()} onClick={() => { onQuickReply?.(notification, reply.trim()); setReply(""); }}>
                  <Send fontSize="small" />
                </IconButton>
              </Box>
            )}
          </Box>
        }
      />
    </ListItem>
  );
}
```

Panel: pasar `bumped={bumpedIds.has(notification.id)}` (se completa en F2-6).

- [ ] **Step 4: Correr tests**

Run: `npx jest src/components/notifications/NotificationItem.test.tsx --ci`; `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/notifications/NotificationItem.tsx frontend/src/components/notifications/NotificationItem.test.tsx frontend/src/components/notifications/NotificationPanel.tsx
git commit -m "feat(notifications-ui): item 2.0 con plantillas i18n y quick reply visual"
```

---

### Task F2-5: Panel — tabs, archivadas y presentación por dispositivo

**Files:**
- Modify (rewrite): `frontend/src/components/notifications/NotificationPanel.tsx`
- Modify: `frontend/src/hooks/useNotifications.ts`
- Modify (rewrite): `frontend/src/components/notifications/NotificationPanel.test.tsx`
- Modify: `frontend/src/components/layout/Layout.tsx`

**Interfaces:**
- Consumes: F1 `useNotifications(filter, opts)`; F2-2 `filter=archived`; F2-3 keys; `BottomSheet` + `motionTokens`/`liquidColors`.
- Produces: panel `{onClose}`; hook acepta `"archived"`; `NotificationSurface` interno (Drawer desktop / BottomSheet compact).

- [ ] **Step 1: Tests que fallan** (panel)

Cubrir: tabs con testids, `filter=archived` oculta tabs y muestra vacío archivadas, encuesta fija en Todo/Sistema, Esc/close, error+retry, y que el hook recibe `{unread:true}` en Chats.

```tsx
jest.mock("../../hooks/useNotifications", () => ({ useNotifications: jest.fn() }));
jest.mock("react-i18next", () => ({ useTranslation: () => ({ t: (k: string) => k, i18n: { language: "en" } }) }));
jest.mock("next/router", () => ({ useRouter: () => ({ push: jest.fn() }) }));
```

- [ ] **Step 2: Ver fallar**

Run: `npx jest src/components/notifications/NotificationPanel.test.tsx --ci`
Expected: FAIL.

- [ ] **Step 3: Implementar**

- Hook: extender `NotificationFilter = "all" | "social" | "messages" | "system" | "archived"`; no pedir counts cuando `filter === "archived"`.
- Panel: tabs F1 + menú `⋯` con `Archivadas` (setea `filter="archived"`) y `Ajustes` (`router.push("/settings#notifications")`); en archivadas: sin tabs, sin mark-all, item con botones `Restaurar`/`Borrar`.
- Encuesta: mantener bloque F1 (`notification-survey-item`) en Todo/Sistema.
- Desktop/móvil: `Layout` decide presentación:

```tsx
const isCompact = useMediaQuery(muiTheme.breakpoints.down("md"));

{isCompact ? (
  <BottomSheet open={notificationOpen} onClose={() => setNotificationOpen(false)} sx={{ height: "100dvh", maxWidth: "100%", p: 0 }}>
    <NotificationPanel onClose={() => setNotificationOpen(false)} />
  </BottomSheet>
) : (
  <Drawer anchor="right" open={notificationOpen} onClose={() => setNotificationOpen(false)} PaperProps={{ sx: { width: 400, bgcolor: isDark ? "rgba(16,18,32,0.55)" : "rgba(255,255,255,0.72)", backdropFilter: "blur(18px)", borderInlineStart: "1px solid", borderColor: "divider" } }}>
    <NotificationPanel onClose={() => setNotificationOpen(false)} />
  </Drawer>
)}
```

- [ ] **Step 4: Correr tests + typecheck**

Run: `npx jest src/components/notifications/NotificationPanel.test.tsx --ci`; `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/notifications/NotificationPanel.tsx frontend/src/components/notifications/NotificationPanel.test.tsx frontend/src/hooks/useNotifications.ts frontend/src/components/layout/Layout.tsx
git commit -m "feat(notifications-ui): panel con tabs, archivadas y bottom sheet movil"
```

---

### Task F2-6: Gestos, posponer y undo

**Files:**
- Create: `frontend/src/components/notifications/NotificationSwipeable.tsx`
- Create: `frontend/src/components/notifications/SnoozeMenu.tsx`
- Create: `frontend/src/components/notifications/NotificationSwipeable.test.tsx`
- Create: `frontend/src/components/notifications/SnoozeMenu.test.tsx`
- Modify: `frontend/src/hooks/useNotifications.ts` (acciones)
- Modify: `frontend/src/components/notifications/NotificationPanel.tsx` (snackbar undo + bump)

**Interfaces:**
- Consumes: F2-2 endpoints; `notistack` `useSnackbar`; `motionTokens`.
- Produces:
  - Hook: `archive(id)`, `unarchive(id)`, `remove(id)`, `restore(id)`, `snooze(id, duration)`, `unsnooze(id)`.
  - `NotificationSwipeable({children, onArchive, onDelete})` (umbral 72px; touch + pointer).
  - `SnoozeMenu({anchorEl, open, onClose, onSelect})`.
  - Snackbar undo 5s para archive/delete/snooze.

- [ ] **Step 1: Tests que fallan**

`NotificationSwipeable.test.tsx`:

```tsx
import { fireEvent, render, screen } from "@testing-library/react";
import NotificationSwipeable from "./NotificationSwipeable";

it("archives on right swipe past threshold", () => {
  const onArchive = jest.fn();
  render(<NotificationSwipeable onArchive={onArchive} onDelete={jest.fn()}><div>item</div></NotificationSwipeable>);
  const box = screen.getByTestId("notification-swipeable");
  fireEvent.touchStart(box, { touches: [{ clientX: 0, clientY: 0 }] });
  fireEvent.touchMove(box, { touches: [{ clientX: 90, clientY: 0 }] });
  fireEvent.touchEnd(box);
  expect(onArchive).toHaveBeenCalled();
});

it("deletes on left swipe past threshold", () => {
  const onDelete = jest.fn();
  render(<NotificationSwipeable onArchive={jest.fn()} onDelete={onDelete}><div>item</div></NotificationSwipeable>);
  const box = screen.getByTestId("notification-swipeable");
  fireEvent.touchStart(box, { touches: [{ clientX: 100, clientY: 0 }] });
  fireEvent.touchMove(box, { touches: [{ clientX: 10, clientY: 0 }] });
  fireEvent.touchEnd(box);
  expect(onDelete).toHaveBeenCalled();
});
```

`SnoozeMenu.test.tsx`: abrir, elegir "1h" y "always" → `onSelect` con valores.

- [ ] **Step 2: Ver fallar**

Run: `npx jest src/components/notifications/NotificationSwipeable.test.tsx src/components/notifications/SnoozeMenu.test.tsx --ci`
Expected: FAIL.

- [ ] **Step 3: Implementar**

`NotificationSwipeable.tsx`:

```tsx
import React, { useRef, useState } from "react";
import { Box } from "@mui/material";
import { motionTokens } from "../../theme/liquidGlass";

const THRESHOLD = 72;

export default function NotificationSwipeable({ children, onArchive, onDelete }: any) {
  const [dx, setDx] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startX = useRef(0);

  const end = () => {
    const value = dx;
    setDx(0);
    setDragging(false);
    if (value >= THRESHOLD) onArchive?.();
    else if (value <= -THRESHOLD) onDelete?.();
  };

  return (
    <Box data-testid="notification-swipeable" sx={{ position: "relative", overflow: "hidden" }}
      onTouchStart={(e) => { startX.current = e.touches[0].clientX; setDragging(true); }}
      onTouchMove={(e) => { if (dragging) setDx(e.touches[0].clientX - startX.current); }}
      onTouchEnd={end}
    >
      <Box sx={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "space-between", px: 2, color: "text.secondary" }}>
        <span>↩</span><span>🗑</span>
      </Box>
      <Box sx={{
        position: "relative",
        transform: `translateX(${dx}px)`,
        transition: dragging ? "none" : `transform ${motionTokens.durations.normal}ms ${motionTokens.easing}`,
        bgcolor: "background.paper",
      }}>{children}</Box>
    </Box>
  );
}
```

`SnoozeMenu.tsx`: `Menu` con `SNOOZE_OPTIONS = ["15m","1h","2h","8h","1d","always"]` y labels `t("notifications.snooze." + opt)`.

Hook: acciones con update optimista (`setItems(prev => prev.filter(...))` para archive/delete/snooze) y refetch de counts; los `unarchive/restore/unsnooze` para undo.

Panel: `useSnackbar()`; al archivar/borrar/posponer:

```tsx
const undo = (msg: string, action: () => Promise<void>) =>
  enqueueSnackbar(msg, {
    autoHideDuration: 5000,
    action: (
      <Button color="inherit" size="small" onClick={() => void action()}>
        {t("notifications.actions.undo")}
      </Button>
    ),
  });
```

Bump: `const prev = useRef<Map<string,string>>(new Map())`; comparar `updated_at` tras cada fetch; `setBumpedIds(new Set(changed))` y limpiar a los 700ms.

- [ ] **Step 4: Correr tests**

Run: `npx jest src/components/notifications src/hooks/useNotifications.test.ts --ci`; `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/notifications/NotificationSwipeable.tsx frontend/src/components/notifications/NotificationSwipeable.test.tsx frontend/src/components/notifications/SnoozeMenu.tsx frontend/src/components/notifications/SnoozeMenu.test.tsx frontend/src/hooks/useNotifications.ts frontend/src/components/notifications/NotificationPanel.tsx
git commit -m "feat(notifications-ui): gestos, posponer y undo"
```

---

### Task F2-7: Quick reply funcional

**Files:**
- Modify: `frontend/src/components/notifications/NotificationPanel.tsx`
- Modify: `frontend/src/components/notifications/NotificationItem.test.tsx`
- Test: `frontend/src/components/notifications/NotificationPanel.test.tsx`

**Interfaces:**
- Consumes: `POST /chat/send` (`{conversation_id, content}`); F2-4 `onQuickReply`.
- Produces: envío optimista + `markRead` + refresco; error → snackbar reintento.

- [ ] **Step 1: Test que falla**

En panel: con item `message` `can_reply`, escribir y enviar llama `apiClient.post("/chat/send", { conversation_id: "c1", content: "hola" })` y `markRead`.

- [ ] **Step 2: Ver fallar**

Run: `npx jest src/components/notifications/NotificationPanel.test.tsx -t "quick reply" --ci`
Expected: FAIL.

- [ ] **Step 3: Implementar**

```tsx
const sendQuickReply = async (notification: any, content: string) => {
  const conversationId = notification.metadata?.conversation_id;
  if (!conversationId) return;
  try {
    await apiClient.post("/chat/send", { conversation_id: conversationId, content });
    await markRead(notification.id);
  } catch {
    enqueueSnackbar(t("notifications.error"), { variant: "error" });
  }
};
```

Pasar `onQuickReply={sendQuickReply}` al item.

- [ ] **Step 4: Correr tests**

Run: `npx jest src/components/notifications --ci`; `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/notifications/NotificationPanel.tsx frontend/src/components/notifications/NotificationPanel.test.tsx frontend/src/components/notifications/NotificationItem.test.tsx
git commit -m "feat(notifications-ui): quick reply en mensajes"
```

---

### Task F2-8: Settings — toggles de silencio + sync de acciones WS

**Files:**
- Modify: `frontend/src/components/settings/NotificationsSection.tsx`
- Create: `frontend/src/components/settings/NotificationsSection.test.tsx`
- Modify: `frontend/src/hooks/notificationSync.ts`
- Modify: `frontend/src/hooks/notificationSync.test.ts`

**Interfaces:**
- Consumes: `UserSettings.notification_mutes` (T3-F1); eventos F2-1.
- Produces: toggles `social/messages/system/promos` (merge sobre `settings.notification_mutes`); `applyNotificationSocketEvent` maneja también `notification_archived|notification_unarchived|notification_deleted|notification_restored|notification_snoozed|notification_unsnoozed`.

- [ ] **Step 1: Tests que fallan**

Settings: render con `settings={{notifications_enabled:true, notification_mutes:{social:false}}}`; click en "Mensajes" llama `onSettingsChange("notification_mutes", {social:false, messages:true, system:false, promos:false})` (labels i18n mockeados por testid).

Sync: `it.each([...newActions])` → `applyNotificationSocketEvent({action}, refetch)` true y refetch 1 vez.

- [ ] **Step 2: Ver fallar**

Run: `npx jest src/components/settings/NotificationsSection.test.tsx src/hooks/notificationSync.test.ts --ci`
Expected: FAIL.

- [ ] **Step 3: Implementar**

Settings: añadir bloque "Silenciar por categoría" con cuatro `FormControlLabel` + `Switch` y `data-testid="mute-social|messages|system|promos"`, usando `onSettingsChange("notification_mutes", { ...(settings.notification_mutes||{}), [key]: checked })`.

Sync: ampliar `HANDLED` con las seis acciones nuevas.

- [ ] **Step 4: Correr tests + lint**

Run: `npx jest src/components/settings/NotificationsSection.test.tsx src/hooks/notificationSync.test.ts --ci`; `npx eslint src/components/settings/NotificationsSection.tsx src/hooks/notificationSync.ts`
Expected: PASS / 0 errores.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/settings/NotificationsSection.tsx frontend/src/components/settings/NotificationsSection.test.tsx frontend/src/hooks/notificationSync.ts frontend/src/hooks/notificationSync.test.ts
git commit -m "feat(notifications-ui): toggles de silencio y sync de acciones"
```

---

### Task F2-9: Verificación completa

**Files:** ninguno nuevo.

- [ ] **Step 1: Backend completo**

Run (desde `backend/`): `venv\Scripts\python.exe -m pytest tests -q`
Expected: PASS (sin fallos nuevos).

- [ ] **Step 2: Frontend**

Run (desde `frontend/`): `npx jest src/components/notifications src/components/settings src/hooks --ci`; `npm run typecheck`; `npm run lint`
Expected: PASS / limpio (warnings preexistentes documentados).

- [ ] **Step 3: Revisión de contrato**

Comprobar manualmente en el diff:
- GET `filter=archived` no aplica mutes.
- `unread-count` excluye archivadas/borradas/pospuestas.
- `snooze?duration=always` fija el mute del bucket y marca leída sin ocultar.
- Eventos WS nuevos manejados en `notificationSync` (refetch, nunca cero local).
- Copy de like/match/message sale de `buildNotificationText`, nunca de `content` (salvo legado/promo/sistema).
- 21/21 `common.json` pasan el guard.

- [ ] **Step 4: Commit final (si hubo ajustes)**

```bash
git commit -m "test(notifications): verificacion integral de la enmienda UX/i18n"
```

---

## Self-Review (hecho al escribir el plan)

- **Cobertura de la spec:** modelo §2 → F2-1; API §3 → F2-2; i18n §4 → F2-3; panel/item §5 → F2-4/5; gestos/snooze/undo §5 → F2-6; quick reply §5 → F2-7; a11y/motion → F2-4/5/6; settings §6 → F2-8; testing §8 → tests por tarea + F2-9.
- **Sin placeholders:** cada paso con código/datos concretos; las 21 traducciones se generan contra el guard (set de claves exacto en F2-3).
- **Consistencia de tipos:** `visible_filter(archived_only)` usado por API; `notificationText.buildNotificationText` consumido por item; `NotificationFilter` incluye `archived`; eventos de servicio coinciden con `notificationSync`.
- **Supersede:** Task 7A original (`dateLocale.ts`/date-fns) queda reemplazada por `Intl` + `NOTIFICATION_KEYS`; T9/T11 vuelven al alcance; F1 “sin grupos visibles/quick reply/swipe/snooze” queda revocado por esta fase.
- **Riesgo conocido:** F1/T4/T5 estaban sin commitear al escribir el plan; la precondición obliga a fijar BASE_F2 antes de ejecutar y a revisar firmas reales.
