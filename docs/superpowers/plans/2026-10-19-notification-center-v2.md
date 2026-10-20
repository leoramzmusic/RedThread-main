# Notificaciones 2.0 (Fase A) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** F1 de la campanita: bandeja unificada Todo/Likes/Chats/Sistema con notificaciones sociales (like con foto, match), mensajes y sistema, counts por bucket, click-through, visto por tab, i18n y badge confiable multi-pestaña. F2 añade grupos visibles/prioridad/paginación/quick reply; F3 silencios/snooze/swipe.

**Architecture:** Emisión directa en la fuente del evento vía `notification_service` (Kafka queda como canal paralelo). Documento-grupo materializado con bump atómico (ventana 24h) y lectura por cursor; F1 muestra al último actor en singular. `ConnectionManager` multi-conexión para fan-out de pushes WS. Sin agregador/`InboxState`.

**Tech Stack:** FastAPI + Beanie (MongoDB), pytest, Next.js/React + MUI, jest/RTL, date-fns.

**Spec:** `docs/superpowers/specs/2026-10-19-notification-center-design.md`

## Global Constraints

- Solo Fase A. NO tocar `backend/src/services/chat/` ni `backend/src/services/settings/` (microservicios standalone).
- NO push nativo/email. NO tocar los publishes Kafka existentes.
- Retención 30 días; ventana de agrupación 24h; cap de actores almacenados = 3; preview de mensaje = 80 chars.
- Silencio = filtro al mostrar (doc se crea igual; oculto de lista/badge/push WS). `metadata.important` no es silenciable ni con master off. DND solo suprime push WS.
- Commits locales, mensaje en el estilo del repo, **nunca push**.
- Backend tests (desde `backend/`): `venv\Scripts\python.exe -m pytest tests/<archivo> -q`. Patrón de casa: puro + `unittest.mock.patch.object`/`AsyncMock` sobre clases Beanie (ver `tests/test_conversation_service.py`); `tests/conftest.py` ya registra `DocumentSettings` de `Conversation`/`Relationship`.
- Frontend tests (desde `frontend/`): `npx jest <ruta> --ci`; `npm run typecheck`; `npm run lint`. Mocks LOCALES de `next/router` (no depender del mock global del lab WIP). `sx` con `borderRadius` en px string. NO tocar archivos WIP del lab (`UserSearchAutocomplete*`, `CareFormulaCanvas*`, `careExperiments*`, `jest.setup.ts`, `.freebuff/`).
- `Notification` legacy (campos ausentes) debe leerse con defaults; tipos `view`/`reward` se renderizan genéricos sin destino.

---

## ENMIENDA F1 (2026-10-19) — LEER ANTES DE EJECUTAR

**Estado:** T1 (`de85553`) y T2 (`d5515e7`) **DONE**. T4, T5, T6 y T8 del plan
siguen vigentes tal cual. **T3, T7 y T10 quedan reemplazadas** por T3-F1, T7-F1
y T10-F1 de esta enmienda; **T9 se difiere a F2** y **T11 a F3**. El spec
vinculante es `docs/superpowers/specs/2026-10-19-notification-center-design.md`
con la enmienda aprobada.

Decisiones que cambian respecto al plan original:

- Los docs de notificación son la fuente única. No hay `/notifications/inbox`
  ni `InboxState`; no se publica `push.like` por Kafka.
- Tabs UI: Todo / Likes / Chats / Sistema (filtros API `all|social|messages|
  system`).
- `unread-count` devuelve counts por bucket + `survey_pending`; badge = `count`.
- `read-bucket` marca social/system; Chats se marca al abrir conversación.
- Like click → `/likes`; match/message → chat; system/survey/promo → URL.
- i18n 21 idiomas en `common.json` bajo `notifications.*`; copy de eventos desde
  `type/actors/metadata`; `content` solo fallback/legacy/admin.
- Encuesta CARE = ítem sintético; `survey_pending` se calcula en backend.
- F1 sin grupos visibles, sin “Cargar más”, sin quick reply, sin swipe/snooze.

Orden de ejecución F1: **T3-F1 → T4 → T5 → T6 → T7A → T7-F1 → T8 → T10-F1**.

> **Aviso de worktree (2026-10-20):** hay cambios sin commitear del workstream
> `docs/superpowers/plans/2026-10-19-profile-like-media-attribution.md` en
> `notification_service.py`, `NotificationItem.tsx`, `discovery.py`,
> `smart_photos.py` y tests asociados. No revertirlos. Antes de T4/T5, correr
> sus tests y verificar qué ya está implementado; no duplicar. Al commitear,
> usar `git add -p` y stagear solo los hunks de la tarea: un `git add` del
> archivo completo arrastraría ese trabajo ajeno. El test existente “single
> like → profile” contradice la decisión F1 **like → `/likes`** y debe
> actualizarse en T7-F1. El thumbnail de media se conserva; el copy agregado de
> grupos del test existente es F2: en F1 un doc con `actor_count > 1` muestra al
> último actor en singular. No revertir la attribution de media.

### Task 3-F1: API de bandeja (reemplaza Task 3)

**Files:**
- Modify (rewrite): `backend/src/api/notifications.py`
- Modify: `backend/src/models/user_settings.py` (campo `notification_mutes`)
- Modify: `backend/src/api/settings.py` (`UpdateSettingsRequest`)
- Modify: `backend/src/services/notification_service.py` (helper de chat)
- Modify: `backend/src/api/chat.py` (marcar doc al leer mensajes)
- Test: `backend/tests/test_notifications_api.py`

**Interfaces:**
- Consumes: `notification_service.visibility_query`, `serialize_notification`,
  `manager` (T1/T2); `CareUserPreference` + `CARE_DIMENSION_KEYS`.
- Produces:
  - `GET /notifications?filter&cursor&limit&unread` →
    `{items, next_cursor}`.
  - `GET /notifications/unread-count` →
    `{count, all, social, messages, system, survey_pending}`.
  - `POST /notifications/read-bucket` `{bucket: "social"|"system"}` →
    `{updated}` + WS `notifications_bucket_read`.
  - `POST /notifications/{id}/read` + WS `notification_read`.
  - `POST /notifications/read-all` + WS `notifications_read_all`.
  - `POST /notifications/system` (admin, sin cambios).
  - `notification_service.mark_message_notification_read(user_id,
    conversation_id) -> None` + WS `notifications_sync`.
  - `_bucket_types(bucket) -> list[str]`, `_compose_counts(social, messages,
    system_docs, survey_pending) -> dict`, `_survey_pending(user_id) -> int`,
    `_user_payload(profile) -> dict`, `_serialize_item(doc, profile) -> dict`.

- [ ] **Step 1: Escribir tests que fallan** (`backend/tests/test_notifications_api.py`)

Cubre, con mocks de Beanie (`unittest.mock.patch.object` / `AsyncMock`), el
patrón de la casa:

```python
from datetime import datetime
from types import SimpleNamespace
from unittest.mock import AsyncMock, patch

import pytest

from src.api import notifications as api
from src.services import notification_service as ns


def test_bucket_types_social():
    assert api._bucket_types("social") == ["like", "match"]


def test_bucket_types_system():
    assert api._bucket_types("system") == ["system", "survey", "promo"]


def test_bucket_types_rejects_messages():
    with pytest.raises(ValueError):
        api._bucket_types("messages")


def test_compose_counts_includes_survey_once():
    got = api._compose_counts(social=3, messages=2, system_docs=1, survey_pending=4)
    assert got == {
        "count": 7, "all": 7, "social": 3, "messages": 2,
        "system": 2, "survey_pending": 4,
    }


def test_compose_counts_without_survey():
    got = api._compose_counts(social=0, messages=0, system_docs=0, survey_pending=0)
    assert got == {
        "count": 0, "all": 0, "social": 0, "messages": 0,
        "system": 0, "survey_pending": 0,
    }


@pytest.mark.asyncio
async def test_survey_pending_counts_missing_dimensions():
    prefs = [SimpleNamespace(dimension="a"), SimpleNamespace(dimension="b")]
    with patch(
        "src.care.preferences.service.list_user_preferences",
        new=AsyncMock(return_value=prefs),
    ), patch(
        "src.care.preferences.service.CARE_DIMENSION_KEYS", ("a", "b", "c", "d")
    ):
        assert await api._survey_pending("u1") == 2


@pytest.mark.asyncio
async def test_survey_pending_failure_returns_zero():
    with patch(
        "src.care.preferences.service.list_user_preferences",
        new=AsyncMock(side_effect=RuntimeError("db down")),
    ):
        assert await api._survey_pending("u1") == 0


@pytest.mark.asyncio
async def test_read_bucket_updates_and_emits():
    result = SimpleNamespace(modified_count=2)
    chain = SimpleNamespace(update=AsyncMock(return_value=result))
    with patch.object(api.Notification, "find", return_value=chain), patch.object(
        api.manager, "send_personal_message", new=AsyncMock()
    ) as push:
        out = await api.read_bucket(
            api.ReadBucketRequest(bucket="social"), SimpleNamespace(id="u1")
        )
    assert out == {"updated": 2}
    api.Notification.find.assert_called_once()
    push.assert_awaited_once()
    assert push.await_args.args[1]["action"] == "notifications_bucket_read"


@pytest.mark.asyncio
async def test_read_bucket_rejects_messages():
    from fastapi import HTTPException

    with pytest.raises(HTTPException) as exc:
        await api.read_bucket(
            api.ReadBucketRequest(bucket="messages"), SimpleNamespace(id="u1")
        )
    assert exc.value.status_code == 400


@pytest.mark.asyncio
async def test_mark_message_notification_read_updates_and_syncs():
    chain = SimpleNamespace(update=AsyncMock(return_value=None))
    with patch.object(ns.Notification, "find", return_value=chain), patch.object(
        ns.manager, "send_personal_message", new=AsyncMock()
    ) as push:
        await ns.mark_message_notification_read("u1", "c1")
    assert chain.update.await_count == 1
    push.assert_awaited_once_with("u1", {"action": "notifications_sync"})
```

Además, test del payload de usuario enriquecido (se usa para grupos y
singulares):

```python
def test_user_payload_from_profile():
    profile = SimpleNamespace(
        display_name="Ana", photos=["/a.jpg"], nickname="ana"
    )
    assert api._user_payload(profile) == {
        "name": "Ana", "photo": "/a.jpg", "nickname": "ana"
    }
```

- [ ] **Step 2: Ver fallar**

Run (desde `backend/`): `venv\Scripts\python.exe -m pytest tests/test_notifications_api.py -q`
Expected: FAIL — helpers/endpoints no existen.

- [ ] **Step 3: Implementar**

1. `backend/src/services/notification_service.py`:

```python
async def mark_message_notification_read(user_id: str, conversation_id: str) -> None:
    group_key = f"message:{conversation_id}"
    await Notification.find(
        {"user_id": user_id, "group_key": group_key, "is_read": False}
    ).update({"$set": {"is_read": True, "updated_at": datetime.utcnow()}})
    await manager.send_personal_message(user_id, {"action": "notifications_sync"})
```

2. `backend/src/api/notifications.py`:
   - Mantener `encode_cursor`/`decode_cursor`, `_mute_context`, `POST /system`,
     `_fan_out_system` del plan original.
   - `_bucket_types("social"|"system")`; `ValueError` para el resto.
   - `_compose_counts(...)` según test.
   - `_survey_pending(user_id)` con import diferido de
     `src.care.preferences.service`, `try/except Exception: return 0`.
   - `_user_payload(profile)`:
     ```python
     def _user_payload(profile) -> dict:
         if not profile:
             return {"name": "Usuario", "photo": None, "nickname": None}
         return {
             "name": profile.display_name,
             "photo": profile.photos[0] if profile.photos else None,
             "nickname": getattr(profile, "nickname", None),
         }
     ```
   - `_serialize_item(doc, profile)`:
     ```python
     def _serialize_item(doc, profile) -> dict:
         data = ns.serialize_notification(doc)
         data["user"] = _user_payload(profile)
         return data
     ```
   - `GET /notifications`: añadir `unread: bool = False`; si true,
     `query["is_read"] = False`. Enriquecer `related_ids` de **todos** los docs
     con `related_user_id` (no solo `actor_count <= 1`) y construir `user` con
     `_serialize_item(doc, profile)`.
   - `GET /unread-count`: tres counts con `Notification.find(query).count()` +
     `_survey_pending`; devolver `_compose_counts`.
     `system_docs` incluye [system, survey, promo]; `messages` [message];
     `social` [like, match]. Aplicar `visibility_query(uid, "all", mutes, master)`.
   - `POST /read-bucket`: `ReadBucketRequest` con `bucket: str`; validar con
     `_bucket_types` dentro de `try/except ValueError` y lanzar
     `HTTPException(status_code=400, detail="bucket must be social or system")`.
     Luego `Notification.find({"user_id": uid, "type": {"$in": types},
     "is_read": False}).update({"$set": {"is_read": True}})`; push
     `{"action": "notifications_bucket_read", "bucket": bucket}`; devolver
     `{"updated": result.modified_count if result else 0}`.
   - Declarar `/unread-count`, `/read-all`, `/read-bucket`, `/system` antes de
     `/{notification_id}/read`.
   - `read-all` mantiene el push `notifications_read_all`.
   - `mark_as_read` mantiene ownership + `notification_read`.
3. `backend/src/api/chat.py`, en el path `source_kind == "conversation"` tras
   `conversation.save()`:

```python
        try:
            from src.services.notification_service import (
                mark_message_notification_read,
            )

            await mark_message_notification_read(
                str(current_user.id), conversation_id
            )
        except Exception as notif_err:
            print(f"Notification read sync error: {notif_err}")
```

4. Settings:
   - `backend/src/models/user_settings.py`, junto a `do_not_disturb`:
     ```python
     notification_mutes: Dict[str, bool] = Field(default_factory=dict)
     ```
   - `backend/src/api/settings.py`, en `UpdateSettingsRequest`:
     ```python
     notification_mutes: Optional[Dict[str, bool]] = None
     ```

- [ ] **Step 4: Correr tests + settings**

Run: `venv\Scripts\python.exe -m pytest tests/test_notifications_api.py tests/test_notification_service.py tests/test_settings_language_source.py -q`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -p backend/src/api/notifications.py backend/src/services/notification_service.py backend/src/api/chat.py backend/src/models/user_settings.py backend/src/api/settings.py backend/tests/test_notifications_api.py
git commit -m "feat(notifications): API F1 con counts por bucket, visto y sincronia de chat"
```

> `notification_service.py` ya tiene cambios sin commitear de media
> attribution: stagea solo el helper de chat (o pide commitear primero ese
> workstream). No hacer `git add` del archivo completo sin revisar el diff.

### Task 7A: i18n de notificaciones (21 locales)

**Files:**
- Modify: `frontend/public/locales/*/common.json` (21 archivos)
- Test: `frontend/src/components/notifications/notificationLocaleKeys.test.ts`

**Interfaces:**
- Produces: subárbol `notifications.*` en `common` para panel/items; helper
  `frontend/src/utils/dateLocale.ts` con `dateFnsLocale(lng)`.

- [ ] **Step 1: Test de paridad que falla**

```typescript
import fs from "fs";
import path from "path";

const LOCALES = ["en","es","pt","fr","de","it","ru","sv","nl","zh","hi","bn","ja","ko","ar","sw","ha","am","tl","ms","mi"];
const read = (lng: string) =>
  JSON.parse(fs.readFileSync(path.join(process.cwd(), "public", "locales", lng, "common.json"), "utf8"));

const flatten = (obj: any, prefix = ""): string[] =>
  Object.entries(obj).flatMap(([k, v]) =>
    v && typeof v === "object" ? flatten(v, `${prefix}${k}.`) : [`${prefix}${k}`],
  );

describe("notifications locale keys", () => {
  const en = new Set(flatten(read("en").notifications));
  it.each(LOCALES)("%s has every en key", (lng) => {
    const keys = new Set(flatten(read(lng).notifications));
    expect([...en].filter((key) => !keys.has(key))).toEqual([]);
  });
  it("en has core keys", () => {
    expect(en.has("tabs.likes")).toBe(true);
    expect(en.has("like.single")).toBe(true);
    expect(en.has("survey.pending_other")).toBe(true);
  });
});
```

> Las locales con plurales extra (`ar`, `ru`, etc.) pueden tener `_few/_many/_zero`;
> el test exige que estén todas las claves de `en`, no igualdad exacta.

- [ ] **Step 2: Ver fallar**

Run: `npx jest src/components/notifications/notificationLocaleKeys.test.ts --ci`
Expected: FAIL — `notifications` no existe.

- [ ] **Step 3: Añadir claves a los 21 `common.json`**

Estructura exacta (EN/ES completos; traducir el resto):

```json
"notifications": {
  "title": "Notifications",
  "close": "Close",
  "retry": "Retry",
  "loading": "Loading…",
  "markAllRead": "Mark all as read",
  "error": "We couldn't load your notifications.",
  "tabs": { "all": "All", "likes": "Likes", "chats": "Chats", "system": "System" },
  "empty": {
    "all": "You're all caught up.",
    "likes": "No likes yet.",
    "chats": "No new messages.",
    "system": "No announcements."
  },
  "like": {
    "single": "{{name}} likes you",
    "superlike": "{{name}} sent you a Super Like",
    "group": "{{names}} and {{count}} more"
  },
  "match": { "single": "It's a match with {{name}}!" },
  "message": { "single": "New message from {{name}}" },
  "survey": {
    "title": "CARE preferences",
    "pending_one": "You have 1 question left to complete your preferences.",
    "pending_other": "You have {{count}} questions left to complete your preferences."
  },
  "system": { "fallback": "Red Thread" },
  "actor": { "fallback": "Someone", "more": "and {{count}} more" }
}
```

Español: “Notificaciones”, “Cerrar”, “Reintentar”, “Cargando…”, “Marcar todo como leído”,
“No pudimos cargar tus notificaciones.”, tabs “Todo/Likes/Chats/Sistema”,
vacíos “Estás al día/Sin likes por ahora/Sin mensajes nuevos/Sin avisos”,
like “A {{name}} le gustas”, superlike “{{name}} te envió un Super Like”,
match “¡Es un match con {{name}}!”, mensaje “Nuevo mensaje de {{name}}”,
encuesta “Preferencias CARE” + “Te falta 1 pregunta…”/“Te faltan {{count}}
preguntas…”.

- [ ] **Step 4: Helper de fecha**

`frontend/src/utils/dateLocale.ts`:

```typescript
import { enUS, es, pt, fr, de, it, ru, sv, nl, zhCN, hi, bn, ja, ko, ar, sw, ha, am, tl, ms } from "date-fns/locale";

const MAP: Record<string, Locale> = { en: enUS, es, pt, fr, de, it, ru, sv, nl, zh: zhCN, hi, bn, ja, ko, ar, sw, ha, am, tl, ms };

export function dateFnsLocale(lng: string) {
  return MAP[lng] ?? enUS;
}
```

(Importar el tipo `Locale` de `date-fns`; si `tl`/`mi` no existen en la versión
instalada, omitirlos del import y del MAP. `mi` cae a `enUS`.)

- [ ] **Step 5: Correr y commit**

Run: `npx jest src/components/notifications/notificationLocaleKeys.test.ts --ci`; `npx tsc --noEmit`
Expected: PASS / limpio.

```bash
git add frontend/public/locales frontend/src/utils/dateLocale.ts frontend/src/components/notifications/notificationLocaleKeys.test.ts
git commit -m "feat(notifications-ui): i18n de la bandeja en 21 idiomas"
```

### Task 7-F1: Hook + panel + item (reemplaza Task 7)

**Files:**
- Create: `frontend/src/hooks/useNotifications.ts`
- Create: `frontend/src/hooks/useNotifications.test.ts`
- Modify (rewrite): `frontend/src/components/notifications/NotificationPanel.tsx`
- Modify (rewrite): `frontend/src/components/notifications/NotificationItem.tsx`
- Modify (rewrite): `frontend/src/components/notifications/NotificationPanel.test.tsx`
- Create: `frontend/src/components/notifications/NotificationItem.test.tsx`

**Interfaces:**
- Consumes: T3-F1 endpoints; `common` i18n keys (T7A); `dateFnsLocale`.
- Produces:
  - `useNotifications(filter, opts?: {unread?: boolean})` →
    `{items, counts, unreadCount, loading, error, nextCursor, refresh, markRead,
    markBucket, markAllRead}` (sin `loadMore` en F1). `unreadCount =
    counts.count` mantiene compatible el tab de chat de T8.
  - Panel props `{ onClose: () => void }`.
  - `NotificationItem` props `{ notification, onRead, onNavigate? }`.

- [ ] **Step 1: Tests que fallan**

`useNotifications.test.ts`:

```typescript
import { renderHook, waitFor, act } from "@testing-library/react";
import { useNotifications } from "./useNotifications";
import apiClient from "../services/api";

jest.mock("../services/api", () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn() },
}));
const get = apiClient.get as jest.Mock;
const post = apiClient.post as jest.Mock;

const counts = { count: 2, all: 2, social: 1, messages: 1, system: 0, survey_pending: 0 };

beforeEach(() => {
  jest.clearAllMocks();
  get.mockImplementation((url: string) => {
    if (url === "/notifications/unread-count") return Promise.resolve({ data: counts });
    return Promise.resolve({ data: { items: [], next_cursor: null } });
  });
});

it("fetches the filter and unread flag", async () => {
  const { result } = renderHook(() => useNotifications("messages", { unread: true }));
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(get).toHaveBeenCalledWith("/notifications", {
    params: { filter: "messages", limit: 50, unread: true },
  });
});

it("marks a notification read and refreshes counts", async () => {
  post.mockResolvedValue({ data: {} });
  const { result } = renderHook(() => useNotifications("all"));
  await waitFor(() => expect(result.current.loading).toBe(false));
  await act(() => result.current.markRead("n1"));
  expect(post).toHaveBeenCalledWith("/notifications/n1/read");
  expect(get).toHaveBeenCalledWith("/notifications/unread-count");
});

it("marks a bucket seen", async () => {
  post.mockResolvedValue({ data: {} });
  const { result } = renderHook(() => useNotifications("social"));
  await waitFor(() => expect(result.current.loading).toBe(false));
  await act(() => result.current.markBucket("social"));
  expect(post).toHaveBeenCalledWith("/notifications/read-bucket", { bucket: "social" });
});
```

`NotificationPanel.test.tsx`: mock `useTranslation` (`t` returns readable ES
strings for the keys used), `next/router`, and `useNotifications`; cover:
- tabs Todo/Likes/Chats/Sistema con testids y counts;
- Chats llama el hook con `{unread:true}`;
- abrir Likes llama `markBucket("social")` una vez; Sistema `markBucket("system")`;
- encuesta fijada en Todo/Sistema y click navega a `/home?encuesta=1` + `onClose`;
- empty/error/retry;
- click de item cierra el panel.

`NotificationItem.test.tsx`: mocks router + `t`; cubre:
- like single y like agrupado → `/likes` (actualizar el test existente que
  esperaba `/profile/ana` para un like single);
- match chat → `/chat?conversation=c9`; message chat;
- system url → `/home?encuesta=1`; legacy → solo `onRead`;
- copy i18n de like/match (no usa `content`), con `actor_count > 1` mostrando
  al último actor en singular (F1);
- thumbnail `metadata.shown_media_thumbnail_url` (conservar test existente);
- testids.

- [ ] **Step 2: Ver fallar**

Run: `npx jest src/hooks/useNotifications.test.ts src/components/notifications --ci`
Expected: FAIL — hook/contrato nuevos no existen.

- [ ] **Step 3: Implementar**

`useNotifications`:

```typescript
const EMPTY_COUNTS = { count: 0, all: 0, social: 0, messages: 0, system: 0, survey_pending: 0 };
const [counts, setCounts] = useState(EMPTY_COUNTS);
const fetchAll = useCallback(async () => {
  setLoading(true); setError(false);
  try {
    const [list, count] = await Promise.all([
      apiClient.get("/notifications", {
        params: { filter, limit: 50, ...(opts?.unread ? { unread: true } : {}) },
      }),
      apiClient.get("/notifications/unread-count"),
    ]);
    setItems(list.data.items ?? []);
    setNextCursor(list.data.next_cursor ?? null);
    setCounts(count.data);
  } catch { setError(true); }
  finally { setLoading(false); }
}, [filter, opts?.unread]);

useEffect(() => { fetchAll(); }, [fetchAll]);
useEffect(() => {
  const onSync = () => fetchAll();
  window.addEventListener("notifications-sync", onSync);
  return () => window.removeEventListener("notifications-sync", onSync);
}, [fetchAll]);

const markRead = async (id: string) => {
  setItems((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n));
  try {
    await apiClient.post(`/notifications/${id}/read`);
  } finally {
    await fetchAll();
  }
};
const markBucket = async (bucket: "social" | "system") => {
  await apiClient.post("/notifications/read-bucket", { bucket });
  await fetchAll();
};
const markAllRead = async () => {
  await apiClient.post("/notifications/read-all");
  await fetchAll();
};
const unreadCount = counts?.count ?? 0;
return {
  items, counts, unreadCount, loading, error, nextCursor,
  refresh: fetchAll, markRead, markBucket, markAllRead,
};
```

`NotificationPanel`:
- `const [tab, setTab] = useState<0|1|2|3>(0)`; filter map
  `["all","social","messages","system"]`; labels `t("notifications.tabs.*")`.
- `useNotifications(filter, { unread: tab === 2 })`.
- `seenRef = useRef<Set<string>>(new Set())`; on tab/data ready:
  - tab 1 y `counts.social > 0` y no visto → `await markBucket("social")`,
    añadir a seen.
  - tab 3 y `counts.system - (counts.survey_pending > 0 ? 1 : 0) > 0` y no
    visto → `markBucket("system")` (la encuesta no debe disparar el bulk).
- Encuesta: `counts.survey_pending > 0 && (tab === 0 || tab === 3)` → item
  pinned `notification-survey-item`; click `onClose(); router.push("/home?encuesta=1")`.
- Tabs con `data-testid="notification-tab-all|likes|chats|system"`, iconos
  `Inbox`, `Favorite`, `ChatBubble`, `Campaign`, label + pill count.
- Lista `NotificationItem` con `onRead={markRead}`,
  `onNavigate={() => onClose()}`.
- Header close + “Marcar todo leído” solo en Sistema (`markAllRead`).
- `Fade` keyed por tab (200 ms, respetar `prefers-reduced-motion`); skeleton
  (3 `Skeleton` rows), error con `Reintentar`, empty por tab.
- No “Cargar más”, no quick reply, no grupos visibles.

`NotificationItem`:
- Nombre: `notification.user?.name ?? notification.actors?.[0]?.name ??
  t("notifications.actor.fallback")`.
- Copy:
  ```ts
  type === "like" ? (metadata.superlike
      ? t("notifications.like.superlike", { name })
      : t("notifications.like.single", { name }))
  : type === "match" ? t("notifications.match.single", { name })
  : type === "message" ? (metadata.preview || t("notifications.message.single", { name }))
  : content || t("notifications.system.fallback");
  ```
- Grupo F1: usa `user` (related_user_id, último actor) y copy singular; ignora
  `actor_count` (F2). No renderizar “A N personas…” todavía.
- Thumbnail: si `metadata.shown_media_thumbnail_url` o `shown_media_url` existe,
  renderizar `<img>` 56×56 con `resolveUrl` (conservar el trabajo actual); el
  avatar del actor va como overlay. Sin media, avatar normal.
- Click: `if (!is_read) void onRead(id); onNavigate?.();` luego (optimista, sin
  bloquear la navegación; `onNavigate` es opcional para el tab de chat de T8):
  - like → `/likes`
  - match: `target_type === "chat"` → `/chat?conversation=${target_id}`;
    `profile` → `/profile/${nickname}`; fallback `/likes`
  - message → `/chat?conversation=${target_id}`
  - url: `const url = target_id || metadata.target_url`; si empieza con `/`
    → `router.push(url)`, si no → `window.location.assign(url)`
  - null/legacy → no navegar
- Avatar con `user.photo`/initial; icono de tipo; dot de no leído; timestamp con
  `formatDistanceToNow(date, { addSuffix: true, locale: dateFnsLocale(i18n.language) })`.
- Testid `notification-item-${id}`.

- [ ] **Step 4: Correr tests + typecheck**

Run: `npx jest src/hooks/useNotifications.test.ts src/components/notifications --ci`; `npx tsc --noEmit`
Expected: PASS / limpio.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/hooks/useNotifications.ts frontend/src/hooks/useNotifications.test.ts frontend/src/components/notifications
git commit -m "feat(notifications-ui): bandeja F1 con tabs, counts y click-through"
```

> `NotificationItem.tsx` y su test ya tienen cambios sin commitear de media
> attribution. Revisar `git diff` y stagear solo los hunks de T7-F1, o commitear
> primero ese workstream.

### Task 10-F1: Layout y sincronía (reemplaza Task 10)

**Files:**
- Create: `frontend/src/hooks/notificationSync.ts` + `.test.ts`
- Modify: `frontend/src/components/layout/Layout.tsx`

**Interfaces:**
- Consumes: WS actions `new_notification`, `notification_read`,
  `notifications_read_all`, `notifications_bucket_read`, `notifications_sync`,
  `new_message`; T3-F1 `unread-count`.
- Produces: `applyNotificationSocketEvent(data, refetchCounts) -> boolean`
  (true = acción manejada; **siempre refetch**, nunca cero local, porque
  `survey_pending` puede seguir contando).

- [ ] **Step 1: Test que falla**

```typescript
import { applyNotificationSocketEvent } from "./notificationSync";

const ACTIONS = ["new_notification","notification_read","notifications_read_all","notifications_bucket_read","notifications_sync","new_message"];

describe("applyNotificationSocketEvent", () => {
  it.each(ACTIONS)("refetches counts on %s", (action) => {
    const refetch = jest.fn();
    expect(applyNotificationSocketEvent({ action }, refetch)).toBe(true);
    expect(refetch).toHaveBeenCalledTimes(1);
  });
  it("ignores unknown actions", () => {
    expect(applyNotificationSocketEvent({ action: "typing" }, jest.fn())).toBe(false);
  });
});
```

- [ ] **Step 2: Ver fallar**

Run: `npx jest src/hooks/notificationSync.test.ts --ci`
Expected: FAIL — módulo no existe.

- [ ] **Step 3: Implementar**

```typescript
const HANDLED = new Set([
  "new_notification", "notification_read", "notifications_read_all",
  "notifications_bucket_read", "notifications_sync", "new_message",
]);

export function applyNotificationSocketEvent(
  data: any, refetchCounts: () => void,
): boolean {
  if (!HANDLED.has(data?.action)) return false;
  refetchCounts();
  return true;
}
```

`Layout.tsx`:
- Quitar imports/estado/efecto de `listPreferences`, `CARE_DIMENSION_KEYS` y
  `surveyPendingCount`.
- `fetchUnreadCount` con `GET /notifications/unread-count` →
  `setUnreadCount(count)` y, al completar, dispatch
  `new CustomEvent("notifications-sync")` (una sola vez; el panel no reemite).
- Fetch inicial al montar/autenticar.
- Debounce 500 ms con `useRef<ReturnType<typeof setTimeout>>`, limpieza en
  unmount; el WS y los eventos llaman `scheduleFetch()`.
- WS onmessage: `applyNotificationSocketEvent(data, scheduleFetch)`; si true,
  `scheduleFetch()` ya agenda el refetch y `fetchUnreadCount` despacha sync.
- Listener `care-preferences-changed`: `scheduleFetch()`.
- `visibilitychange` visible: `scheduleFetch()`.
- Badge `badgeContent={unreadCount}`, `active={unreadCount > 0}`.
- Panel `<NotificationPanel onClose={() => setNotificationOpen(false)} />`;
  quitar `onUpdateUnreadCount`, `surveyPendingCount`, `onOpenSurvey`.
- Mantener el resto del WS (chat, etc.).

- [ ] **Step 4: Correr tests + typecheck + lint**

Run: `npx jest src/hooks/notificationSync.test.ts --ci`; `npx tsc --noEmit`; `npx eslint src/components/layout/Layout.tsx src/hooks/notificationSync.ts`
Expected: PASS / 0 errores.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/hooks/notificationSync.ts frontend/src/hooks/notificationSync.test.ts frontend/src/components/layout/Layout.tsx
git commit -m "feat(notifications-ui): badge F1 sincronizado con counts y WS"
```

### Tareas diferidas

- **T9 (quick reply):** F2. No ejecutar en F1.
- **T11 (toggles de silencio):** F3. El backend de `notification_mutes` sí entra
  en T3-F1 (API/counts), pero sin UI.
- **Grupos visibles, prioridad, paginación UI:** F2.
- **Snooze, swipe, archivo/histórico:** F3.

---

### Task 1: ConnectionManager multi-conexión — DONE (`de85553`)

**Files:**
- Create: `backend/src/services/connection_manager.py`
- Modify: `backend/src/api/chat.py` (líneas 30–53: eliminar la clase y el singleton; importar desde el nuevo módulo; línea 363: pasar `websocket`)
- Test: `backend/tests/test_connection_manager.py`

**Interfaces:**
- Consumes: nada.
- Produces: `src.services.connection_manager.ConnectionManager` y singleton `manager`. API: `await connect(user_id, websocket)`, `disconnect(user_id, websocket=None)` (None = todas), `await send_personal_message(user_id, dict)` (fan-out + poda). `active_connections: Dict[str, List[WebSocket]]` conserva semántica de pertenencia (`user_id in manager.active_connections`).

- [ ] **Step 1: Escribir el test que falla**

```python
"""Tests for ConnectionManager multi-connection fan-out (Notificaciones 2.0)."""

import pytest

from src.services.connection_manager import ConnectionManager


class FakeWS:
    def __init__(self, fail=False):
        self.accepted = False
        self.sent = []
        self.fail = fail

    async def accept(self):
        self.accepted = True

    async def send_json(self, message):
        if self.fail:
            raise RuntimeError("dead socket")
        self.sent.append(message)


@pytest.mark.asyncio
async def test_connect_accepts_and_registers():
    m = ConnectionManager()
    ws = FakeWS()
    await m.connect("u1", ws)
    assert ws.accepted
    assert "u1" in m.active_connections


@pytest.mark.asyncio
async def test_send_fans_out_to_all_sockets_of_user():
    m = ConnectionManager()
    ws1, ws2 = FakeWS(), FakeWS()
    await m.connect("u1", ws1)
    await m.connect("u1", ws2)
    await m.send_personal_message("u1", {"action": "x"})
    assert ws1.sent == [{"action": "x"}]
    assert ws2.sent == [{"action": "x"}]


@pytest.mark.asyncio
async def test_dead_socket_is_pruned_and_others_still_receive():
    m = ConnectionManager()
    ws1, dead = FakeWS(), FakeWS(fail=True)
    await m.connect("u1", ws1)
    await m.connect("u1", dead)
    await m.send_personal_message("u1", {"action": "x"})
    assert ws1.sent == [{"action": "x"}]
    assert len(m.active_connections["u1"]) == 1


@pytest.mark.asyncio
async def test_disconnect_one_socket_keeps_the_other():
    m = ConnectionManager()
    ws1, ws2 = FakeWS(), FakeWS()
    await m.connect("u1", ws1)
    await m.connect("u1", ws2)
    m.disconnect("u1", ws2)
    assert m.active_connections["u1"] == [ws1]
    m.disconnect("u1", ws1)
    assert "u1" not in m.active_connections


@pytest.mark.asyncio
async def test_disconnect_without_websocket_removes_all():
    m = ConnectionManager()
    await m.connect("u1", FakeWS())
    await m.connect("u1", FakeWS())
    m.disconnect("u1")
    assert "u1" not in m.active_connections


@pytest.mark.asyncio
async def test_send_to_unknown_user_is_noop():
    m = ConnectionManager()
    await m.send_personal_message("nobody", {"action": "x"})  # no raise
```

- [ ] **Step 2: Correr el test y verlo fallar**

Run: `venv\Scripts\python.exe -m pytest tests/test_connection_manager.py -q` (desde `backend/`)
Expected: FAIL — `ModuleNotFoundError: No module named 'src.services.connection_manager'`

- [ ] **Step 3: Crear `backend/src/services/connection_manager.py`**

```python
from typing import Dict, List
from fastapi import WebSocket


class ConnectionManager:
    """Multi-connection registry: every user can have N sockets (tabs)."""

    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, user_id: str, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.setdefault(user_id, []).append(websocket)

    def disconnect(self, user_id: str, websocket: WebSocket | None = None):
        sockets = self.active_connections.get(user_id)
        if not sockets:
            return
        if websocket is None:
            del self.active_connections[user_id]
            return
        remaining = [ws for ws in sockets if ws is not websocket]
        if remaining:
            self.active_connections[user_id] = remaining
        else:
            del self.active_connections[user_id]

    async def send_personal_message(self, user_id: str, message: dict):
        for websocket in list(self.active_connections.get(user_id, [])):
            try:
                await websocket.send_json(message)
            except Exception:
                self.disconnect(user_id, websocket)

    async def broadcast_typing(self, match_id: str, user_id: str, is_typing: bool):
        # Notify the other user in the match (compat; sin uso)
        pass


manager = ConnectionManager()
```

- [ ] **Step 4: Modificar `backend/src/api/chat.py`**

- Eliminar las líneas de `# Active WebSocket connections` / `class ConnectionManager` … `manager = ConnectionManager()` (aprox. 30–53).
- Añadir a los imports: `from src.services.connection_manager import manager`.
- Línea ~363 (`except WebSocketDisconnect:`): cambiar `manager.disconnect(user_id)` por `manager.disconnect(user_id, websocket)`.
- El resto de usos (`manager.connect`, `send_personal_message`, `user_id in manager.active_connections`) no cambia.

- [ ] **Step 5: Correr tests + sanidad de imports**

Run: `venv\Scripts\python.exe -m pytest tests/test_connection_manager.py tests/test_chat_resolvers.py -q`
Expected: PASS (6 + 7)

- [ ] **Step 6: Commit**

```bash
git add backend/src/services/connection_manager.py backend/src/api/chat.py backend/tests/test_connection_manager.py
git commit -m "feat(chat): ConnectionManager multi-conexion por usuario"
```

---

### Task 2: Modelo Notification extendido + notification_service (núcleo de emisión/agrupación) — DONE (`d5515e7`)

**Files:**
- Modify: `backend/src/models/notification.py`
- Create: `backend/src/services/notification_service.py`
- Test: `backend/tests/test_notification_service.py`

**Interfaces:**
- Consumes: `src.services.connection_manager.manager` (T1); `SmartPhotosService.record_photo_like` (T4, se importa diferido dentro de la función para no bloquear T5 → NO importar en T2).
- Produces (usado por T3/T5/T6):
  - `GROUP_WINDOW_HOURS=24`, `MAX_ACTORS=3`, `PREVIEW_MAX=80`, `RETENTION_DAYS=30`
  - `bucket_for(notif_type) -> str` (`social|messages|system|promos`)
  - `is_muted_type(mutes: dict, notif_type: str) -> bool`
  - `should_push(settings, notif_type, metadata, now=None) -> bool`
  - `visibility_query(user_id, flt, mutes, master_enabled) -> dict`
  - `serialize_notification(doc) -> dict`
  - `actor_snapshot(user_id) -> dict` (`{user_id, name, photo, nickname}`)
  - `emit_notification(*, user_id, type, content, related_user_id=None, group_key=None, target_type=None, target_id=None, metadata=None, actor=None, group_target_type=None, group_target_id=None, lock_actor=False) -> Notification`
  - `emit_like_notification(*, liker_id, recipient_id, shown_media_id=None, is_superlike=False)`
  - `emit_match_notification(*, user_a_id, user_b_id, match_id)`
  - `notify_new_message(*, sender_id, recipient_id, conversation, preview, can_reply)` → `Notification | None` (None = muteada)
  - `emit_system_notification(*, user_id, content, notif_type="system", target_url=None, important=False)`

- [ ] **Step 1: Escribir el test que falla**

```python
"""Tests for notification_service: emision, agrupacion bump 24h, silencios."""

from datetime import datetime, time, timedelta
from types import SimpleNamespace
from unittest.mock import AsyncMock, patch

import pytest

from src.models.notification import Notification
from src.services import notification_service as ns


def fake_profile(uid, name="Ana", nickname="ana"):
    return SimpleNamespace(
        user_id=uid, display_name=name, photos=["/p.jpg"], nickname=nickname
    )


@pytest.fixture
def db():
    with patch.object(Notification, "find_one", new=AsyncMock(return_value=None)) as find_one, \
         patch.object(Notification, "insert", new=AsyncMock()) as insert, \
         patch.object(Notification, "save", new=AsyncMock()) as save, \
         patch.object(ns, "_push_new_notification", new=AsyncMock()) as push, \
         patch.object(ns.Profile, "find_one", new=AsyncMock(return_value=fake_profile("liker"))) as prof:
        yield SimpleNamespace(find_one=find_one, insert=insert, save=save, push=push, prof=prof)


@pytest.mark.asyncio
async def test_like_creates_single_group_doc(db):
    doc = await ns.emit_like_notification(liker_id="liker", recipient_id="me", shown_media_id="m1")
    db.insert.assert_awaited_once()
    assert doc.type == "like"
    assert doc.group_key == "like:photo:m1"
    assert doc.target_type == "profile"
    assert doc.target_id == "liker"
    assert doc.actor_count == 1
    assert doc.actors[0]["user_id"] == "liker"
    assert doc.actors[0]["nickname"] == "ana"
    assert doc.metadata["shown_media_id"] == "m1"
    db.push.assert_awaited_once()


@pytest.mark.asyncio
async def test_like_without_media_uses_profile_group(db):
    doc = await ns.emit_like_notification(liker_id="liker", recipient_id="me")
    assert doc.group_key == "like:profile"


@pytest.mark.asyncio
async def test_bump_within_window_updates_and_switches_target(db):
    existing = Notification(
        user_id="me", type="like", content="old", group_key="like:photo:m1",
        target_type="profile", target_id="liker", is_read=True,
        metadata={"actor_ids": ["liker"], "last_actor_id": "liker"},
    )
    existing.actors = [{"user_id": "liker", "name": "Ana", "photo": None, "nickname": "ana"}]
    existing.actor_count = 1
    db.find_one.return_value = existing
    doc = await ns.emit_like_notification(liker_id="otro", recipient_id="me", shown_media_id="m1")
    db.insert.assert_not_awaited()
    db.save.assert_awaited_once()
    assert doc is existing
    assert doc.actor_count == 2
    assert doc.is_read is False
    assert doc.target_type == "likes"
    assert doc.target_id == "m1"
    assert doc.updated_at > doc.created_at
    db.push.assert_awaited_once()


@pytest.mark.asyncio
async def test_actor_already_seen_is_not_recounted(db):
    existing = Notification(
        user_id="me", type="like", content="x", group_key="like:profile",
        metadata={"actor_ids": ["liker"], "last_actor_id": "liker"},
    )
    existing.actors = [{"user_id": "liker", "name": "Ana", "photo": None, "nickname": "ana"}]
    existing.actor_count = 1
    db.find_one.return_value = existing
    doc = await ns.emit_like_notification(liker_id="liker", recipient_id="me")
    assert doc.actor_count == 1


@pytest.mark.asyncio
async def test_actor_cap_keeps_three_but_counts_all(db):
    existing = Notification(
        user_id="me", type="like", content="x", group_key="like:profile",
        metadata={"actor_ids": ["a1", "a2", "a3", "a4"], "last_actor_id": "a4"},
    )
    existing.actors = [
        {"user_id": "a1", "name": "A", "photo": None, "nickname": "a"},
        {"user_id": "a2", "name": "B", "photo": None, "nickname": "b"},
        {"user_id": "a3", "name": "C", "photo": None, "nickname": "c"},
    ]
    existing.actor_count = 4
    db.find_one.return_value = existing
    doc = await ns.emit_like_notification(liker_id="a5", recipient_id="me")
    assert len(doc.actors) == 3
    assert doc.actor_count == 5


@pytest.mark.asyncio
async def test_superlike_never_groups(db):
    doc = await ns.emit_like_notification(
        liker_id="liker", recipient_id="me", shown_media_id="m1", is_superlike=True
    )
    assert doc.group_key is None
    assert doc.metadata["superlike"] is True
    assert "Super" in doc.content


@pytest.mark.asyncio
async def test_match_creates_one_doc_per_user(db):
    docs = await ns.emit_match_notification(user_a_id="a", user_b_id="b", match_id="match1")
    assert len(docs) == 2
    assert {d.user_id for d in docs} == {"a", "b"}
    assert all(d.group_key is None for d in docs)
    assert all(d.target_type == "chat" for d in docs)
    assert db.insert.await_count == 2


@pytest.mark.asyncio
async def test_message_muted_conversation_returns_none(db):
    conv = SimpleNamespace(id="c1", is_muted_by=["me"])
    result = await ns.notify_new_message(
        sender_id="him", recipient_id="me", conversation=conv, preview="hola", can_reply=True
    )
    assert result is None
    db.insert.assert_not_awaited()


@pytest.mark.asyncio
async def test_message_bump_counts_messages_and_resets_read(db):
    conv = SimpleNamespace(id="c1", is_muted_by=[])
    existing = Notification(
        user_id="me", type="message", content="viejo", group_key="message:c1",
        is_read=True, metadata={"preview": "viejo"},
    )
    existing.actors = [{"user_id": "him", "name": "El", "photo": None, "nickname": "el"}]
    existing.actor_count = 3
    db.find_one.return_value = existing
    doc = await ns.notify_new_message(
        sender_id="him", recipient_id="me", conversation=conv,
        preview="x" * 100, can_reply=False,
    )
    assert doc.actor_count == 4
    assert doc.is_read is False
    assert len(doc.metadata["preview"]) == 80
    assert doc.metadata["can_reply"] is False
    assert doc.metadata["conversation_id"] == "c1"


@pytest.mark.asyncio
async def test_system_notification_with_url_and_important(db):
    doc = await ns.emit_system_notification(
        user_id="me", content="Encuesta", notif_type="survey",
        target_url="/home?encuesta=1", important=True,
    )
    assert doc.type == "survey"
    assert doc.target_type == "url"
    assert doc.target_id == "/home?encuesta=1"
    assert doc.metadata["important"] is True


class TestShouldPush:
    def settings(self, **over):
        base = SimpleNamespace(
            notifications_enabled=True,
            notification_mutes={"social": False, "messages": False, "system": False, "promos": False},
            do_not_disturb={"enabled": False, "start_time": "22:00", "end_time": "08:00"},
        )
        for k, v in over.items():
            setattr(base, k, v)
        return base

    def test_master_off_blocks_except_important(self):
        s = self.settings(notifications_enabled=False)
        assert ns.should_push(s, "like", None) is False
        assert ns.should_push(s, "system", {"important": True}) is True

    def test_muted_bucket_blocks(self):
        s = self.settings(notification_mutes={"social": True, "messages": False, "system": False, "promos": False})
        assert ns.should_push(s, "like", None) is False
        assert ns.should_push(s, "match", None) is False
        assert ns.should_push(s, "message", None) is True

    def test_important_ignores_mutes(self):
        s = self.settings(notification_mutes={"social": True, "messages": True, "system": True, "promos": True})
        assert ns.should_push(s, "system", {"important": True}) is True

    def test_promo_respects_promos_and_system_mutes(self):
        s1 = self.settings(notification_mutes={"social": False, "messages": False, "system": False, "promos": True})
        s2 = self.settings(notification_mutes={"social": False, "messages": False, "system": True, "promos": False})
        assert ns.should_push(s1, "promo", None) is False
        assert ns.should_push(s2, "promo", None) is False

    def test_dnd_window_crossing_midnight(self):
        s = self.settings(do_not_disturb={"enabled": True, "start_time": "22:00", "end_time": "08:00"})
        assert ns.should_push(s, "like", None, now=time(23, 30)) is False
        assert ns.should_push(s, "like", None, now=time(12, 0)) is True

    def test_no_settings_pushes(self):
        assert ns.should_push(None, "like", None) is True


class TestVisibilityQuery:
    def test_filter_social_maps_types(self):
        q = ns.visibility_query("me", "social", {}, True)
        assert q["type"] == {"$in": ["like", "match"]}

    def test_master_off_only_important(self):
        q = ns.visibility_query("me", "all", {}, False)
        assert q["metadata.important"] is True

    def test_muted_bucket_excluded_unless_important(self):
        q = ns.visibility_query("me", "all", {"social": True}, True)
        assert q["$or"] == [{"type": {"$nin": ["like", "match"]}}, {"metadata.important": True}]

    def test_promos_mute_excludes_only_promo(self):
        q = ns.visibility_query("me", "system", {"promos": True}, True)
        assert {"type": {"$nin": ["promo"]}} in q.get("$or", [])
```

- [ ] **Step 2: Correr y ver fallar**

Run: `venv\Scripts\python.exe -m pytest tests/test_notification_service.py -q`
Expected: FAIL — `ImportError` de `notification_service`

- [ ] **Step 3: Extender `backend/src/models/notification.py`**

Reemplazar el contenido por:

```python
from typing import Any, Dict, List, Optional
from datetime import datetime
from beanie import Document
from pydantic import Field


class Notification(Document):
    user_id: str  # The recipient of the notification
    type: str  # 'like' | 'match' | 'message' | 'system' | 'survey' | 'promo' (legacy: 'view', 'reward')
    content: str
    related_user_id: Optional[str] = None  # Lead actor (compat)
    is_read: bool = False
    created_at: datetime = datetime.utcnow()
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    group_key: Optional[str] = None  # 'like:photo:{id}' | 'like:profile' | 'message:{conv_id}'
    actor_count: int = 1
    actors: List[Dict[str, Any]] = Field(default_factory=list)  # cap 3
    target_type: Optional[str] = None  # 'profile' | 'likes' | 'chat' | 'url'
    target_id: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

    class Settings:
        name = "notifications"
        indexes = [
            [("user_id", 1), ("updated_at", -1)],
            [("user_id", 1), ("is_read", 1)],
            [("user_id", 1), ("group_key", 1), ("updated_at", -1)],
        ]
```

- [ ] **Step 4: Crear `backend/src/services/notification_service.py`**

```python
"""Emisión directa de notificaciones (Fase A, enfoque 1a + 2a).

Reglas: agrupación rodante con bump (ventana 24h), cap de 3 actores,
silencio = filtro al mostrar (el doc se crea igual), DND solo suprime push.
"""

from datetime import datetime, time, timedelta
from typing import Any, Dict, List, Optional

from src.models.conversation import Conversation
from src.models.notification import Notification
from src.models.profile import Profile
from src.services.connection_manager import manager

GROUP_WINDOW_HOURS = 24
MAX_ACTORS = 3
PREVIEW_MAX = 80
RETENTION_DAYS = 30

ALL_NOTIF_TYPES = ["like", "match", "message", "system", "survey", "promo"]
FILTER_TYPES = {
    "social": ["like", "match"],
    "messages": ["message"],
    "system": ["system", "survey", "promo"],
}


def bucket_for(notif_type: str) -> str:
    if notif_type in ("like", "match"):
        return "social"
    if notif_type == "message":
        return "messages"
    if notif_type == "promo":
        return "promos"
    return "system"


def is_muted_type(mutes: Optional[Dict[str, bool]], notif_type: str) -> bool:
    if not mutes:
        return False
    bucket = bucket_for(notif_type)
    if bucket == "promos":
        return bool(mutes.get("promos") or mutes.get("system"))
    return bool(mutes.get(bucket))


def _is_dnd_active(dnd: Optional[Dict[str, Any]], now: time) -> bool:
    if not dnd or not dnd.get("enabled"):
        return False
    try:
        start = time.fromisoformat(dnd.get("start_time", "22:00"))
        end = time.fromisoformat(dnd.get("end_time", "08:00"))
    except ValueError:
        return False
    if start <= end:
        return start <= now <= end
    return now >= start or now <= end  # cruza medianoche


def should_push(settings, notif_type: str, metadata: Optional[dict], now: Optional[time] = None) -> bool:
    important = bool((metadata or {}).get("important"))
    if important:
        return True
    if settings is None:
        return True
    if not getattr(settings, "notifications_enabled", True):
        return False
    if is_muted_type(getattr(settings, "notification_mutes", None), notif_type):
        return False
    return not _is_dnd_active(getattr(settings, "do_not_disturb", None), now or datetime.utcnow().time())


def visibility_query(user_id: str, flt: str, mutes: Optional[Dict[str, bool]], master_enabled: bool) -> dict:
    q: dict = {"user_id": user_id}
    types = FILTER_TYPES.get(flt)
    if types:
        q["type"] = {"$in": types}
    if not master_enabled:
        q["metadata.important"] = True
        return q
    muted = [t for t in ALL_NOTIF_TYPES if is_muted_type(mutes, t)]
    if muted:
        q["$or"] = [{"type": {"$nin": muted}}, {"metadata.important": True}]
    return q


def serialize_notification(doc: Notification) -> dict:
    data = doc.dict()
    data["id"] = str(doc.id)
    return data


async def actor_snapshot(user_id: str) -> dict:
    profile = await Profile.find_one(Profile.user_id == user_id)
    return {
        "user_id": user_id,
        "name": profile.display_name if profile else "Usuario",
        "photo": (profile.photos[0] if profile and profile.photos else None),
        "nickname": getattr(profile, "nickname", None) if profile else None,
    }


def _group_query(user_id: str, group_key: str, now: datetime) -> dict:
    return {
        "user_id": user_id,
        "group_key": group_key,
        "updated_at": {"$gte": now - timedelta(hours=GROUP_WINDOW_HOURS)},
    }


async def _push_new_notification(doc: Notification) -> None:
    from src.models.user_settings import UserSettings

    settings = await UserSettings.find_one({"user_id": doc.user_id})
    if not should_push(settings, doc.type, doc.metadata):
        return
    await manager.send_personal_message(
        doc.user_id,
        {"action": "new_notification", "notification": serialize_notification(doc)},
    )


def _add_actor(doc: Notification, actor: dict, lock_actor: bool) -> None:
    meta = doc.metadata or {}
    if lock_actor:
        # Grupos de mensajes: cada evento cuenta; actors = último remitente
        doc.actor_count += 1
        doc.actors = [actor]
        meta = {**meta, "last_actor_id": actor["user_id"]}
        doc.metadata = meta
        return
    seen: List[str] = list(meta.get("actor_ids") or [])
    if actor["user_id"] in seen:
        return
    seen.append(actor["user_id"])
    doc.actor_count += 1
    if len(doc.actors) < MAX_ACTORS:
        doc.actors = doc.actors + [actor]
    meta = {**meta, "actor_ids": seen, "last_actor_id": actor["user_id"]}
    doc.metadata = meta


async def emit_notification(
    *,
    user_id: str,
    type: str,
    content: str,
    related_user_id: Optional[str] = None,
    group_key: Optional[str] = None,
    target_type: Optional[str] = None,
    target_id: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None,
    actor: Optional[dict] = None,
    group_target_type: Optional[str] = None,
    group_target_id: Optional[str] = None,
    lock_actor: bool = False,
) -> Notification:
    now = datetime.utcnow()
    if group_key:
        existing = await Notification.find_one(_group_query(user_id, group_key, now))
        if existing:
            existing.content = content
            existing.updated_at = now
            existing.is_read = False
            if metadata:
                existing.metadata = {**(existing.metadata or {}), **metadata}
            if group_target_type:
                existing.target_type = group_target_type
                existing.target_id = group_target_id
            if actor:
                _add_actor(existing, actor, lock_actor)
            await existing.save()
            await _push_new_notification(existing)
            return existing
    doc = Notification(
        user_id=user_id,
        type=type,
        content=content,
        related_user_id=related_user_id,
        group_key=group_key,
        target_type=target_type,
        target_id=target_id,
        metadata=metadata or {},
        created_at=now,
        updated_at=now,
    )
    if actor:
        doc.actors = [actor]
        doc.actor_count = 1
        doc.metadata = {**(doc.metadata or {}), "actor_ids": [actor["user_id"]], "last_actor_id": actor["user_id"]}
    await doc.insert()
    await _push_new_notification(doc)
    return doc


async def emit_like_notification(
    *,
    liker_id: str,
    recipient_id: str,
    shown_media_id: Optional[str] = None,
    is_superlike: bool = False,
) -> Notification:
    actor = await actor_snapshot(liker_id)
    nickname = actor.get("nickname") or ""
    if is_superlike:
        return await emit_notification(
            user_id=recipient_id,
            type="like",
            content=f"{actor['name']} te envió un Super Like",
            related_user_id=liker_id,
            group_key=None,
            target_type="profile",
            target_id=liker_id,
            metadata={"superlike": True, "shown_media_id": shown_media_id, "target_url": f"/profile/{nickname}"},
            actor=actor,
        )
    group_key = f"like:photo:{shown_media_id}" if shown_media_id else "like:profile"
    return await emit_notification(
        user_id=recipient_id,
        type="like",
        content=f"A {actor['name']} le gusta tu foto" if shown_media_id else f"A {actor['name']} le gustas",
        related_user_id=liker_id,
        group_key=group_key,
        target_type="profile",
        target_id=liker_id,
        group_target_type="likes",
        group_target_id=shown_media_id,
        metadata={"shown_media_id": shown_media_id, "target_url": f"/profile/{nickname}"},
        actor=actor,
    )


async def find_conversation_between(user_a_id: str, user_b_id: str) -> Optional[Conversation]:
    return await Conversation.find_one({"participants": {"$all": [user_a_id, user_b_id]}})


async def emit_match_notification(*, user_a_id: str, user_b_id: str, match_id: str) -> List[Notification]:
    conversation = await find_conversation_between(user_a_id, user_b_id)
    target_type = "chat" if conversation else "profile"
    docs = []
    for me, other in ((user_a_id, user_b_id), (user_b_id, user_a_id)):
        actor = await actor_snapshot(other)
        docs.append(
            await emit_notification(
                user_id=me,
                type="match",
                content=f"¡Nuevo match con {actor['name']}!",
                related_user_id=other,
                group_key=None,
                target_type=target_type,
                target_id=str(conversation.id) if conversation else other,
                metadata={"match_id": match_id, "can_reply": True},
                actor=actor,
            )
        )
    return docs


async def notify_new_message(
    *,
    sender_id: str,
    recipient_id: str,
    conversation,
    preview: str,
    can_reply: bool,
) -> Optional[Notification]:
    if sender_id == recipient_id:
        return None
    if recipient_id in (getattr(conversation, "is_muted_by", None) or []):
        return None
    actor = await actor_snapshot(sender_id)
    short = (preview or "")[:PREVIEW_MAX]
    conv_id = str(conversation.id)
    return await emit_notification(
        user_id=recipient_id,
        type="message",
        content=short,
        related_user_id=sender_id,
        group_key=f"message:{conv_id}",
        target_type="chat",
        target_id=conv_id,
        metadata={"preview": short, "conversation_id": conv_id, "can_reply": can_reply},
        actor=actor,
        lock_actor=True,
    )


async def emit_system_notification(
    *,
    user_id: str,
    content: str,
    notif_type: str = "system",
    target_url: Optional[str] = None,
    important: bool = False,
) -> Notification:
    return await emit_notification(
        user_id=user_id,
        type=notif_type,
        content=content,
        target_type="url" if target_url else None,
        target_id=target_url,
        metadata={"important": True} if important else {},
    )
```

- [ ] **Step 5: Correr tests**

Run: `venv\Scripts\python.exe -m pytest tests/test_notification_service.py -q`
Expected: PASS (aprox. 18)

- [ ] **Step 6: Commit**

```bash
git add backend/src/models/notification.py backend/src/services/notification_service.py backend/tests/test_notification_service.py
git commit -m "feat(notifications): servicio de emision con agrupacion bump 24h"
```

---

### Task 3: API de notificaciones 2.0 + `notification_mutes` en settings — SUPERSEDED por Task 3-F1

**Files:**
- Modify: `backend/src/api/notifications.py` (rewrite)
- Modify: `backend/src/api/settings.py` (línea 13–49: `UpdateSettingsRequest` + guardar mutes)
- Modify: `backend/src/models/user_settings.py` (añadir campo)
- Test: `backend/tests/test_notifications_api.py`

**Interfaces:**
- Consumes: helpers de T2 (`visibility_query`, `RETENTION_DAYS`, `manager` para eventos).
- Produces:
  - `GET /notifications?filter&cursor&limit` → `{"items": [...], "next_cursor": str|null}`; item incluye `id, type, content, is_read, created_at, updated_at, actor_count, actors, target_type, target_id, metadata` + `user: {name, photo, nickname}` cuando `actor_count == 1`.
  - `GET /notifications/unread-count` → `{"count": n}` (silencios/master aware).
  - `POST /notifications/{id}/read` y `POST /notifications/read-all` → push WS de sincronía al propio usuario.
  - `POST /notifications/system` (admin-only): body `{audience: {all: true} | {user_ids: [...]}, type?: "system"|"promo"|"survey", content, target_url?, metadata?}`.
  - `UserSettings.notification_mutes: {social, messages, system, promos}` default todo `False`.

- [ ] **Step 1: Escribir el test que falla** (`backend/tests/test_notifications_api.py`)

```python
"""Tests for notifications API 2.0: cursor, silencios, retencion, sistema."""

from datetime import datetime, timedelta
from types import SimpleNamespace
from unittest.mock import AsyncMock, patch

from fastapi import HTTPException
import pytest

from src.services import notification_service as ns


class TestCursor:
    def test_roundtrip(self):
        dt = datetime(2026, 10, 19, 12, 0, 0)
        raw = ns_encode(dt, "abc123")
        got_dt, got_id = ns_decode(raw)
        assert got_dt == dt and got_id == "abc123"


class TestSystemAudience:
    @pytest.mark.asyncio
    async def test_fan_out_calls_emit_per_user(self):
        from src.api import notifications as api

        users = [SimpleNamespace(id="u1"), SimpleNamespace(id="u2")]
        with patch.object(api.User, "find_all", return_value=_AllList(users)), \
             patch.object(ns, "emit_system_notification", new=AsyncMock()) as emit:
            created = await api._fan_out_system(
                {"all": True}, "Hola", "system", "/home?encuesta=1", False
            )
        assert created == 2
        assert emit.await_count == 2

    @pytest.mark.asyncio
    async def test_invalid_audience_raises_400(self):
        from src.api import notifications as api

        with pytest.raises(HTTPException) as err:
            await api._fan_out_system({"nonsense": []}, "x", "system", None, False)
        assert err.value.status_code == 400


class _AllList:
    """Minimal async iterator for find_all().to_list() patterns."""

    def __init__(self, items):
        self._items = items

    async def to_list(self):
        return self._items
```

Nota: `ns_encode`/`ns_decode` son `encode_cursor`/`decode_cursor` importados al inicio del test:

```python
from src.api.notifications import decode_cursor as ns_decode, encode_cursor as ns_encode
```

(poner ese import arriba; se omite del bloque por brevedad NO — inclúyelo tú en la primera línea tras los imports de `ns`.)

- [ ] **Step 2: Correr y ver fallar**

Run: `venv\Scripts\python.exe -m pytest tests/test_notifications_api.py -q`
Expected: FAIL — `ImportError: cannot import name 'decode_cursor'`

- [ ] **Step 3: Reescribir `backend/src/api/notifications.py`**

```python
from fastapi import APIRouter, Depends, HTTPException, status
from typing import Any, Dict, List, Optional
from datetime import datetime, timedelta
from bson import ObjectId

from src.models.user import User
from src.models.notification import Notification
from src.models.profile import Profile
from src.models.user_settings import UserSettings
from src.models.admin_rbac import Permission
from src.api.auth import get_current_user
from src.services import notification_service as ns
from src.services.connection_manager import manager

router = APIRouter()

MAX_LIMIT = 50
DEFAULT_LIMIT = 20


def encode_cursor(updated_at: datetime, doc_id: str) -> str:
    return f"{updated_at.isoformat()}|{doc_id}"


def decode_cursor(raw: str) -> tuple[datetime, str]:
    iso, _, doc_id = raw.partition("|")
    return datetime.fromisoformat(iso), doc_id


async def _mute_context(user_id: str) -> tuple[Dict[str, bool], bool]:
    settings = await UserSettings.find_one({"user_id": user_id})
    mutes = getattr(settings, "notification_mutes", None) or {}
    master = getattr(settings, "notifications_enabled", True)
    return mutes, master


@router.get("")
async def get_notifications(
    filter: str = "all",
    cursor: Optional[str] = None,
    limit: int = DEFAULT_LIMIT,
    current_user: User = Depends(get_current_user),
):
    limit = max(1, min(limit, MAX_LIMIT))
    uid = str(current_user.id)

    if cursor is None:  # Retención lazy solo en la primera página
        cutoff = datetime.utcnow() - timedelta(days=ns.RETENTION_DAYS)
        await Notification.find(
            Notification.user_id == uid, Notification.updated_at < cutoff
        ).delete()

    mutes, master = await _mute_context(uid)
    query = ns.visibility_query(uid, filter, mutes, master)

    if cursor:
        cur_dt, cur_id = decode_cursor(cursor)
        query["$and"] = [
            {
                "$or": [
                    {"updated_at": {"$lt": cur_dt}},
                    {"updated_at": cur_dt, "_id": {"$lt": ObjectId(cur_id)}},
                ]
            }
        ]

    docs = (
        await Notification.find(query)
        .sort(-Notification.updated_at, -Notification.id)
        .limit(limit + 1)
        .to_list()
    )
    has_more = len(docs) > limit
    docs = docs[:limit]

    # Enriquecimiento por lote
    related_ids = list({d.related_user_id for d in docs if d.related_user_id})
    profiles = (
        await Profile.find({"user_id": {"$in": related_ids}}).to_list()
        if related_ids
        else []
    )
    by_user = {p.user_id: p for p in profiles}

    items = []
    for doc in docs:
        item = {
            "id": str(doc.id),
            "type": doc.type,
            "content": doc.content,
            "is_read": doc.is_read,
            "created_at": doc.created_at.isoformat() if doc.created_at else None,
            "updated_at": doc.updated_at.isoformat() if doc.updated_at else None,
            "actor_count": doc.actor_count or 1,
            "actors": doc.actors or [],
            "target_type": doc.target_type,
            "target_id": doc.target_id,
            "metadata": doc.metadata or {},
        }
        if (doc.actor_count or 1) <= 1:
            profile = by_user.get(doc.related_user_id) if doc.related_user_id else None
            if profile:
                item["user"] = {
                    "name": profile.display_name,
                    "photo": profile.photos[0] if profile.photos else None,
                    "nickname": getattr(profile, "nickname", None),
                }
            elif doc.related_user_id:
                item["user"] = {"name": "Usuario", "photo": None, "nickname": None}
            else:
                item["user"] = {"name": "Red Thread", "photo": None, "nickname": None}
        items.append(item)

    next_cursor = None
    if has_more and docs:
        last = docs[-1]
        next_cursor = encode_cursor(last.updated_at, str(last.id))

    return {"items": items, "next_cursor": next_cursor}


@router.get("/unread-count")
async def get_unread_count(current_user: User = Depends(get_current_user)):
    uid = str(current_user.id)
    mutes, master = await _mute_context(uid)
    query = ns.visibility_query(uid, "all", mutes, master)
    query["is_read"] = False
    count = await Notification.find(query).count()
    return {"count": count}


@router.post("/{notification_id}/read")
async def mark_as_read(notification_id: str, current_user: User = Depends(get_current_user)):
    notification = await Notification.get(ObjectId(notification_id))
    if not notification or notification.user_id != str(current_user.id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")
    notification.is_read = True
    await notification.save()
    await manager.send_personal_message(
        notification.user_id, {"action": "notification_read", "id": str(notification.id)}
    )
    return {"message": "Marked as read"}


@router.post("/read-all")
async def mark_all_as_read(current_user: User = Depends(get_current_user)):
    uid = str(current_user.id)
    await Notification.find(Notification.user_id == uid, Notification.is_read == False).update(
        {"$set": {"is_read": True}}
    )
    await manager.send_personal_message(uid, {"action": "notifications_read_all"})
    return {"message": "All marked as read"}


async def _fan_out_system(
    audience: Dict[str, Any], content: str, notif_type: str,
    target_url: Optional[str], important: bool,
) -> int:
    if audience.get("all") is True:
        users = await User.find_all().to_list()
        user_ids = [str(u.id) for u in users]
    elif isinstance(audience.get("user_ids"), list):
        user_ids = [str(u) for u in audience["user_ids"]]
    else:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid audience")

    created = 0
    for chunk_start in range(0, len(user_ids), 500):
        for uid in user_ids[chunk_start:chunk_start + 500]:
            await ns.emit_system_notification(
                user_id=uid, content=content, notif_type=notif_type,
                target_url=target_url, important=important,
            )
            created += 1
    return created


from pydantic import BaseModel


class SystemNotificationRequest(BaseModel):
    audience: Dict[str, Any]
    type: str = "system"
    content: str
    target_url: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


@router.post("/system")
async def post_system_notification(
    payload: SystemNotificationRequest,
    employee=Depends(_admin_guard()),
):
    return {
        "created": await _fan_out_system(
            payload.audience, payload.content, payload.type, payload.target_url,
            bool((payload.metadata or {}).get("important")),
        )
    }
```

Puntos obligatorios del implementador:

1. `_admin_guard()`: NO inventarlo. Copiar el import y la dependencia EXACTOS que usa `backend/src/api/admin_verificaciones.py` (línea 32: `Depends(require_employee_permission(Permission.VIEW_USERS))` — usar `EDIT_USERS`); importar `require_employee_permission` desde el mismo módulo que lo importa `admin_verificaciones.py`. Declarar el handler como `employee=Depends(require_employee_permission(Permission.EDIT_USERS))`.
2. Rutas: `/unread-count`, `/read-all`, `/system` deben quedar declaradas ANTES de `/{notification_id}/read` en el archivo para que FastAPI no capture "unread-count" como id (routers estándar resuelven estático primero, pero mantener el orden como en el original: puede ir después; verifica con smoke `GET /notifications/unread-count`).
3. `get_notifications` reemplaza por completo la versión 48h/array plano (cambio de contrato intencional, §API del spec).

- [ ] **Step 4: Settings backend**

En `backend/src/models/user_settings.py` añadir tras `notification_frequency`:

```python
    notification_mutes: Dict[str, bool] = Field(
        default_factory=lambda: {
            "social": False,
            "messages": False,
            "system": False,
            "promos": False,
        }
    )
```

En `backend/src/api/settings.py` (`UpdateSettingsRequest`, bloque Notificaciones ~línea 27): añadir

```python
    notification_mutes: Optional[Dict[str, bool]] = None
```

(`PUT /settings/me` ya aplica los campos por `setattr`; no requiere más cambios. `GET` ya devuelve el dict completo de la doc.)

- [ ] **Step 5: Correr tests**

Run: `venv\Scripts\python.exe -m pytest tests/test_notifications_api.py tests/test_settings_language_source.py -q`
Expected: PASS

Verificación manual mínima del registro de rutas (sin levantar server):
```powershell
venv\Scripts\python.exe -c "from src.api.notifications import router; print([r.path for r in router.routes])"
```
Expected incluye `/system`, `/unread-count`, `/{notification_id}/read` (import de `src.api.notifications` puede requerir `MONGODB_URL` si auth importa settings — si falla, omitir este chequeo y confiar en pytest).

- [ ] **Step 6: Commit**

```bash
git add backend/src/api/notifications.py backend/src/api/settings.py backend/src/models/user_settings.py backend/tests/test_notifications_api.py
git commit -m "feat(notifications): API 2.0 con cursor, silencios y emisor de sistema"
```

---

### Task 4: Smart Photos — contador `likes` + peso `like_rate`

**Files:**
- Modify: `backend/src/models/photo_metric.py` (añadir campo)
- Modify: `backend/src/services/smart_photos.py` (líneas 7–34: constantes y `calculate_score`; añadir `record_photo_like`)
- Test: `backend/tests/test_smart_photos.py`

**Interfaces:**
- Consumes: `PhotoMetric` (existente).
- Produces: `PhotoMetric.likes: int = 0`; `SmartPhotosService.record_photo_like(user_id: str, media_id: str) -> None` (upsert + incremento); `SmartPhotosService.DELTA = 0.20`.

- [ ] **Step 1: Test que falla** (`backend/tests/test_smart_photos.py`)

```python
"""Tests for SmartPhotos likes metric + score like_rate (Notificaciones 2.0)."""

from types import SimpleNamespace
from unittest.mock import AsyncMock, patch

import pytest

from src.models.photo_metric import PhotoMetric
from src.services.smart_photos import SmartPhotosService


def metric(views=0, matches=0, clicks=0, view_time=0, likes=0):
    return SimpleNamespace(views=views, matches=matches, clicks=clicks, view_time=view_time, likes=likes)


class TestScore:
    def test_no_views_is_zero(self):
        assert SmartPhotosService.calculate_score(metric(likes=5)) == 0.0

    def test_four_component_weighting(self):
        score = SmartPhotosService.calculate_score(
            metric(views=100, matches=10, clicks=20, view_time=500, likes=30)
        )
        assert score == pytest.approx(0.04 + 0.05 + 0.075 + 0.06)

    def test_zero_likes_matches_legacy_weights(self):
        score = SmartPhotosService.calculate_score(
            metric(views=100, matches=10, clicks=20, view_time=500, likes=0)
        )
        assert score == pytest.approx(0.04 + 0.05 + 0.075)


@pytest.mark.asyncio
async def test_record_photo_like_increments_existing():
    existing = SimpleNamespace(likes=3)
    with patch.object(PhotoMetric, "find_one", new=AsyncMock(return_value=existing)), \
         patch.object(PhotoMetric, "save", new=AsyncMock()) as save:
        await SmartPhotosService.record_photo_like("u1", "m1")
    assert existing.likes == 4
    save.assert_awaited_once()


@pytest.mark.asyncio
async def test_record_photo_like_creates_missing():
    with patch.object(PhotoMetric, "find_one", new=AsyncMock(return_value=None)), \
         patch.object(PhotoMetric, "insert", new=AsyncMock()) as insert:
        await SmartPhotosService.record_photo_like("u1", "m1")
    insert.assert_awaited_once()
```

- [ ] **Step 2: Verlo fallar**

Run: `venv\Scripts\python.exe -m pytest tests/test_smart_photos.py -q`
Expected: FAIL — `AttributeError: likes` / `record_photo_like`

- [ ] **Step 3: Implementar**

En `backend/src/models/photo_metric.py` añadir el campo `likes: int = 0` (junto a los contadores existentes; NO tocar índices).

En `backend/src/services/smart_photos.py`:

```python
class SmartPhotosService:
    # Scoring coefficients (Notificaciones 2.0: 4 componentes)
    ALPHA = 0.40  # Matches/Views weight
    BETA = 0.25   # Clicks/Views weight
    GAMMA = 0.15  # View Time weight (normalized)
    DELTA = 0.20  # Likes/Views weight

    @staticmethod
    def calculate_score(metric: PhotoMetric) -> float:
        """score = 0.40*MatchRate + 0.25*ClickRate + 0.15*ViewTime + 0.20*LikeRate"""
        if metric.views == 0:
            return 0.0
        match_rate = metric.matches / metric.views
        click_rate = metric.clicks / metric.views
        like_rate = metric.likes / metric.views
        avg_view_time = metric.view_time / metric.views
        normalized_view_time = min(avg_view_time / 10.0, 1.0)
        return (
            SmartPhotosService.ALPHA * match_rate
            + SmartPhotosService.BETA * click_rate
            + SmartPhotosService.GAMMA * normalized_view_time
            + SmartPhotosService.DELTA * like_rate
        )

    @staticmethod
    async def record_photo_like(user_id: str, media_id: str) -> None:
        metric = await PhotoMetric.find_one(
            PhotoMetric.user_id == user_id, PhotoMetric.media_id == media_id
        )
        if metric is None:
            metric = PhotoMetric(user_id=user_id, media_id=media_id)
            metric.likes = 1
            await metric.insert()
            return
        metric.likes = (metric.likes or 0) + 1
        await metric.save()
```

(`PhotoMetric` no estaba registrado en `conftest.py`; los tests lo instancian solo en el path de creación con `insert` mockeado — si la instanciación falla por settings, añadir `PhotoMetric._document_settings = DocumentSettings(name="photo_metrics")` a `backend/tests/conftest.py` siguiendo el patrón existente.)

- [ ] **Step 4: Correr**

Run: `venv\Scripts\python.exe -m pytest tests/test_smart_photos.py tests/test_relationship_goals_scoring.py -q`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/src/models/photo_metric.py backend/src/services/smart_photos.py backend/tests/test_smart_photos.py backend/tests/conftest.py
git commit -m "feat(smart-photos): contador de likes y peso like_rate en el score"
```

---

### Task 5: Pipeline swipe/like/match con `shown_media_id`

**Files:**
- Modify: `backend/src/api/discovery.py` (línea 43 `SwipeRequest`; línea 771 handler `swipe`)
- Modify: `backend/src/models/match.py` (añadir `shown_media_id_1/2`)
- Modify: `backend/src/services/notification_service.py` (añadir `handle_swipe_notifications` y `_valid_recipient_media`)
- Test: `backend/tests/test_swipe_notifications.py`

**Interfaces:**
- Consumes: `emit_like_notification`, `emit_match_notification` (T2); `SmartPhotosService.record_photo_like` (T4).
- Produces: `handle_swipe_notifications(*, swiper_id, target_id, interaction, is_match, match_id, shown_media_id=None) -> None`; `SwipeRequest.shown_media_id: Optional[str]`.

- [ ] **Step 1: Test que falla** (`backend/tests/test_swipe_notifications.py`)

```python
"""Tests for swipe notification pipeline (shown_media_id, like/match)."""

from types import SimpleNamespace
from unittest.mock import AsyncMock, patch

import pytest

from src.api.discovery import SwipeRequest
from src.services import notification_service as ns


def media(media_id, owner):
    return SimpleNamespace(id=media_id, user_id=owner)


@pytest.fixture
def wired():
    with patch.object(ns, "emit_like_notification", new=AsyncMock()) as like, \
         patch.object(ns, "emit_match_notification", new=AsyncMock()) as match, \
         patch("src.services.smart_photos.SmartPhotosService.record_photo_like", new=AsyncMock()) as record, \
         patch.object(ns.MediaItem, "get", new=AsyncMock(return_value=media("m1", "target"))) as get:
        yield SimpleNamespace(like=like, match=match, record=record, get=get)


class TestValidRecipientMedia:
    @pytest.mark.asyncio
    async def test_accepts_media_owned_by_recipient(self, wired):
        assert await ns._valid_recipient_media("m1", "target") == "m1"

    @pytest.mark.asyncio
    async def test_rejects_media_of_other_owner(self, wired):
        wired.get.return_value = media("m1", "someone_else")
        assert await ns._valid_recipient_media("m1", "target") is None

    @pytest.mark.asyncio
    async def test_invalid_id_is_none(self, wired):
        wired.get.side_effect = Exception("bad ObjectId")
        assert await ns._valid_recipient_media("nope", "target") is None
```

Además (mismo archivo):

```python
@pytest.mark.asyncio
async def test_pass_does_nothing(wired):
    await ns.handle_swipe_notifications(
        swiper_id="me", target_id="target", interaction="pass", is_match=False, match_id="x"
    )
    wired.like.assert_not_awaited()
    wired.record.assert_not_awaited()


@pytest.mark.asyncio
async def test_like_with_valid_media_records_and_notifies(wired):
    await ns.handle_swipe_notifications(
        swiper_id="me", target_id="target", interaction="like", is_match=False,
        match_id="x", shown_media_id="m1",
    )
    wired.record.assert_awaited_once_with("target", "m1")
    kwargs = wired.like.await_args.kwargs
    assert kwargs["liker_id"] == "me" and kwargs["recipient_id"] == "target"
    assert kwargs["shown_media_id"] == "m1" and kwargs["is_superlike"] is False
    wired.match.assert_not_awaited()


@pytest.mark.asyncio
async def test_like_invalid_media_falls_back(wired):
    wired.get.return_value = media("m1", "someone_else")
    await ns.handle_swipe_notifications(
        swiper_id="me", target_id="target", interaction="like", is_match=False,
        match_id="x", shown_media_id="m1",
    )
    wired.record.assert_not_awaited()
    assert wired.like.await_args.kwargs["shown_media_id"] is None


@pytest.mark.asyncio
async def test_match_notifies_pair_not_like(wired):
    await ns.handle_swipe_notifications(
        swiper_id="me", target_id="target", interaction="like", is_match=True, match_id="x"
    )
    wired.match.assert_awaited_once()
    wired.like.assert_not_awaited()


@pytest.mark.asyncio
async def test_superlike_flag(wired):
    await ns.handle_swipe_notifications(
        swiper_id="me", target_id="target", interaction="superlike", is_match=False, match_id="x"
    )
    assert wired.like.await_args.kwargs["is_superlike"] is True


def test_swipe_request_accepts_shown_media_id():
    req = SwipeRequest(target_user_id="u", interaction="like", shown_media_id="m1")
    assert req.shown_media_id == "m1"
```

(Nota: si `SwipeRequest` exige más campos obligatorios, leer `discovery.py:43` y ajustar el constructor del test a los defaults reales; no cambiar el modelo para hacerlo pasar.)

- [ ] **Step 2: Verlo fallar**

Run: `venv\Scripts\python.exe -m pytest tests/test_swipe_notifications.py -q`
Expected: FAIL — `AttributeError: module ... has no attribute 'handle_swipe_notifications'` / `_valid_recipient_media` / `shown_media_id`

- [ ] **Step 3: Implementar el servicio**

En `backend/src/services/notification_service.py` añadir imports: `from src.models.match import InteractionType` NO es necesario; MediaItem sí:

```python
from src.models.media import MediaItem


async def _valid_recipient_media(media_id: Optional[str], recipient_id: str) -> Optional[str]:
    if not media_id:
        return None
    try:
        item = await MediaItem.get(media_id)
    except Exception:
        return None
    if item and item.user_id == recipient_id:
        return str(item.id)
    return None


async def handle_swipe_notifications(
    *,
    swiper_id: str,
    target_id: str,
    interaction: str,
    is_match: bool,
    match_id: str,
    shown_media_id: Optional[str] = None,
) -> None:
    if interaction == "pass":
        return
    media_id = await _valid_recipient_media(shown_media_id, target_id)
    if media_id:
        from src.services.smart_photos import SmartPhotosService

        await SmartPhotosService.record_photo_like(target_id, media_id)
    if is_match:
        await emit_match_notification(user_a_id=swiper_id, user_b_id=target_id, match_id=match_id)
        return
    await emit_like_notification(
        liker_id=swiper_id,
        recipient_id=target_id,
        shown_media_id=media_id,
        is_superlike=(interaction == "superlike"),
    )
```

- [ ] **Step 4: Modelo y endpoint**

`backend/src/models/match.py` — añadir tras `is_superlike`:

```python
    shown_media_id_1: Optional[str] = None  # Foto del carrusel al dar like user_id_1
    shown_media_id_2: Optional[str] = None
```

`backend/src/api/discovery.py:43` — añadir a `SwipeRequest` (mantener campos existentes):

```python
    shown_media_id: Optional[str] = None
```

En el handler `swipe` (discovery.py:771):

1. Rama existing_match (tras fijar `user_1_interaction`/`user_2_interaction`, ~línea 881): persistir la foto solo si el interaction entrante es like/superlike:

```python
        if request.interaction in (InteractionType.LIKE, InteractionType.SUPERLIKE) and request.shown_media_id:
            if existing_match.user_id_1 == str(current_user.id):
                existing_match.shown_media_id_1 = request.shown_media_id
            else:
                existing_match.shown_media_id_2 = request.shown_media_id
```

2. Rama new match (constructor `Match(...)` ~línea 1003): añadir `shown_media_id_1=request.shown_media_id if request.interaction in (InteractionType.LIKE, InteractionType.SUPERLIKE) else None,`.

3. Emisión — en AMBAS ramas, después de `ensure_match_conversation` (rama existing ~línea 942) / tras `match.insert()` + counters (rama new ~línea 1016), y ANTES del bloque Kafka (o después; nunca dentro de `try` de Kafka), añadir:

```python
        # Notificaciones (best-effort: nunca bloquea el swipe)
        try:
            from src.services.notification_service import handle_swipe_notifications

            await handle_swipe_notifications(
                swiper_id=str(current_user.id),
                target_id=request.target_user_id,
                interaction=request.interaction.value,
                is_match=existing_match.status == MatchStatus.MATCHED,  # en la rama new: False
                match_id=str(existing_match.id),                         # en la rama new: str(match.id)
                shown_media_id=request.shown_media_id,
            )
        except Exception as notif_err:
            print(f"Notification emit error (swipe): {notif_err}")
```

- [ ] **Step 5: Correr**

Run: `venv\Scripts\python.exe -m pytest tests/test_swipe_notifications.py tests/test_relationship_goals_scoring.py -q`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add backend/src/api/discovery.py backend/src/models/match.py backend/src/services/notification_service.py backend/tests/test_swipe_notifications.py
git commit -m "feat(notifications): pipeline like/match con shown_media_id"
```

---

### Task 6: Pipeline de mensajes (WS + REST) con notificación viva

**Files:**
- Modify: `backend/src/api/chat.py` (REST `POST /send` ~línea 655; WS rama conversation ~línea 181; WS rama legacy match ~línea 258)
- Test: `backend/tests/test_message_notifications.py`

**Interfaces:**
- Consumes: `notify_new_message` (T2).
- Produces: hook best-effort en los tres paths; sin cambios de contrato HTTP.

- [ ] **Step 1: Test que falla** (`backend/tests/test_message_notifications.py`)

```python
"""Tests de la notificacion viva de mensajes en los paths de envio."""

from types import SimpleNamespace
from unittest.mock import AsyncMock, patch

import pytest

from src.services import notification_service as ns


@pytest.mark.asyncio
async def test_notify_new_message_full_doc():
    conv = SimpleNamespace(id="c1", is_muted_by=[])
    with patch.object(ns, "actor_snapshot", new=AsyncMock(return_value={"user_id": "him", "name": "El", "photo": None, "nickname": "el"})), \
         patch.object(ns, "emit_notification", new=AsyncMock(return_value="DOC")) as emit:
        result = await ns.notify_new_message(
            sender_id="him", recipient_id="me", conversation=conv,
            preview="hola" * 30, can_reply=True,
        )
    assert result == "DOC"
    kwargs = emit.await_args.kwargs
    assert kwargs["group_key"] == "message:c1"
    assert kwargs["user_id"] == "me"
    assert kwargs["metadata"]["conversation_id"] == "c1"
    assert kwargs["metadata"]["can_reply"] is True
    assert len(kwargs["metadata"]["preview"]) == 80
    assert kwargs["lock_actor"] is True


@pytest.mark.asyncio
async def test_self_send_is_ignored():
    conv = SimpleNamespace(id="c1", is_muted_by=[])
    assert await ns.notify_new_message(
        sender_id="me", recipient_id="me", conversation=conv, preview="x", can_reply=True
    ) is None
```

- [ ] **Step 2: Verlo fallar**

Run: `venv\Scripts\python.exe -m pytest tests/test_message_notifications.py -q`
Expected: FAIL — `lock_actor` ausente o `notify_new_message` inexistente

- [ ] **Step 3: Implementar los hooks en `backend/src/api/chat.py`**

REST `POST /send` (rama conversation, tras `conversation.save()` + push WS ~línea 640):

```python
        # Notificacion viva (best-effort)
        try:
            from src.services.notification_service import notify_new_message

            await notify_new_message(
                sender_id=str(current_user.id),
                recipient_id=receiver_id,
                conversation=conversation,
                preview=request.content,
                can_reply=True,
            )
        except Exception as notif_err:
            print(f"Notification emit error (chat send): {notif_err}")
```

WS rama conversation (tras `conversation.save()` ~línea 174, antes del push `new_message`):

```python
                    try:
                        from src.services.notification_service import notify_new_message

                        await notify_new_message(
                            sender_id=user_id,
                            recipient_id=receiver_id,
                            conversation=conversation,
                            preview=content,
                            can_reply=True,
                        )
                    except Exception as notif_err:
                        print(f"Notification emit error (ws chat): {notif_err}")
```

WS rama legacy match (tras `message.insert()` ~línea 251; la notificación es viva por conversación, y el path legacy puede no tener Conversation):

```python
                try:
                    from src.services.notification_service import (
                        find_conversation_between,
                        notify_new_message,
                    )

                    conversation = await find_conversation_between(user_id, receiver_id)
                    if conversation is None:
                        from src.models.conversation import Conversation

                        conversation = Conversation(
                            relationship_id="",
                            participants=[user_id, receiver_id],
                        )
                    await notify_new_message(
                        sender_id=user_id,
                        recipient_id=receiver_id,
                        conversation=conversation,
                        preview=content,
                        can_reply=match.status != MatchStatus.BLOCKED,
                    )
                except Exception as notif_err:
                    print(f"Notification emit error (ws chat legacy): {notif_err}")
```

Punto delicado: `notify_new_message` usa `conversation.is_muted_by` y `conversation.id`; el fallback sin persistir usa los defaults (`is_muted_by=[]`) y el group_key colisiona con el id real si luego existe la conversation — aceptable (bump). El implementador debe leer `backend/src/models/conversation.py` para confirmar los defaults de `is_muted_by` antes de este step.

- [ ] **Step 4: Correr**

Run: `venv\Scripts\python.exe -m pytest tests/test_message_notifications.py tests/test_notification_service.py tests/test_chat_resolvers.py -q`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/src/api/chat.py backend/src/services/notification_service.py backend/tests/test_message_notifications.py
git commit -m "feat(notifications): notificacion viva de mensajes (WS + REST)"
```

---

### Task 7: Frontend — hook `useNotifications` + panel 2.0 + item con grupos y click-through — SUPERSEDED por Task 7-F1

**Files:**
- Create: `frontend/src/hooks/useNotifications.ts`
- Modify (rewrite): `frontend/src/components/notifications/NotificationPanel.tsx`
- Modify (rewrite): `frontend/src/components/notifications/NotificationItem.tsx`
- Modify (rewrite): `frontend/src/components/notifications/NotificationPanel.test.tsx`
- Test: `frontend/src/components/notifications/NotificationItem.test.tsx` (nuevo)

**Interfaces:**
- Consumes: `GET /notifications` cursor API (T3); `POST /notifications/{id}/read` (T3).
- Produces:
  - `useNotifications(filter: NotificationFilter)` → `{ items, loading, error, nextCursor, loadMore, refresh, markRead, markAllRead, unreadCount, refreshUnreadCount }` (usado por T8, T9, T10).
  - `AppNotification` y `NotificationActor` exportados (usados por T8/T9).
  - `groupLabel(notification) -> string | null` exportado de `NotificationItem` (test directo).
  - Panel mantiene props `{onClose, onUpdateUnreadCount, surveyPendingCount, onOpenSurvey}`; item mantiene `{notification, onRead}`.

- [ ] **Step 1: Escribir los tests que fallan (reescribir panel test + item test)**

`NotificationPanel.test.tsx`:

```tsx
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import NotificationPanel from "./NotificationPanel";
import apiClient from "../../services/api";

jest.mock("../../services/api", () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn() },
}));
jest.mock("next/router", () => ({ useRouter: () => ({ push: jest.fn() }) }));

const mockGet = apiClient.get as jest.Mock;

const notif = (over: any = {}) => ({
  id: "n1", type: "like", content: "A Ana le gustas", is_read: false,
  created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  actor_count: 1, actors: [{ user_id: "u", name: "Ana", photo: null, nickname: "ana" }],
  target_type: "profile", target_id: "u", metadata: {},
  user: { name: "Ana", photo: null, nickname: "ana" },
  ...over,
});

beforeEach(() => {
  jest.clearAllMocks();
  mockGet.mockImplementation((url: string) => {
    if (url === "/notifications/unread-count") return Promise.resolve({ data: { count: 2 } });
    return Promise.resolve({ data: { items: [], next_cursor: null } });
  });
});

const renderPanel = (surveyPendingCount = 4) => {
  const onOpenSurvey = jest.fn();
  render(
    <NotificationPanel
      onClose={jest.fn()}
      onUpdateUnreadCount={jest.fn()}
      surveyPendingCount={surveyPendingCount}
      onOpenSurvey={onOpenSurvey}
    />,
  );
  return { onOpenSurvey };
};

describe("NotificationPanel", () => {
  it("shows the pending survey first in Todo and opens it", async () => {
    const { onOpenSurvey } = renderPanel();
    const item = await screen.findByTestId("notification-survey-item");
    expect(item).toHaveTextContent("Encuesta pendiente");
    fireEvent.click(item);
    expect(onOpenSurvey).toHaveBeenCalledTimes(1);
  });

  it("shows the survey in Sistema but not in Social", async () => {
    renderPanel(1);
    fireEvent.click(await screen.findByRole("tab", { name: "Social" }));
    await waitFor(() =>
      expect(screen.queryByTestId("notification-survey-item")).not.toBeInTheDocument(),
    );
    fireEvent.click(screen.getByRole("tab", { name: "Sistema" }));
    expect(await screen.findByTestId("notification-survey-item")).toBeInTheDocument();
  });

  it("requests the bucket filter on tab change", async () => {
    renderPanel(0);
    fireEvent.click(await screen.findByRole("tab", { name: "Mensajes" }));
    await waitFor(() =>
      expect(mockGet).toHaveBeenCalledWith("/notifications", {
        params: expect.objectContaining({ filter: "messages" }),
      }),
    );
  });

  it("appends the next page and keeps the previous items", async () => {
    mockGet.mockImplementation((url: string, config?: any) => {
      if (url === "/notifications/unread-count") return Promise.resolve({ data: { count: 1 } });
      if (config?.params?.cursor === "c1") return Promise.resolve({ data: { items: [notif({ id: "n2" })], next_cursor: null } });
      return Promise.resolve({ data: { items: [notif()], next_cursor: "c1" } });
    });
    renderPanel(0);
    await screen.findByText("A Ana le gustas");
    fireEvent.click(screen.getByRole("button", { name: "Cargar más" }));
    await waitFor(() => expect(screen.getAllByText("A Ana le gustas")).toHaveLength(2));
    expect(screen.queryByRole("button", { name: "Cargar más" })).not.toBeInTheDocument();
  });

  it("renders a group label with remaining count", async () => {
    mockGet.mockImplementation((url: string) => {
      if (url === "/notifications/unread-count") return Promise.resolve({ data: { count: 1 } });
      return Promise.resolve({
        data: {
          items: [notif({
            id: "g1", actor_count: 3,
            actors: [
              { user_id: "a", name: "Ana", photo: null, nickname: "a" },
              { user_id: "b", name: "Beto", photo: null, nickname: "b" },
            ],
          })],
          next_cursor: null,
        },
      });
    });
    renderPanel(0);
    expect(await screen.findByText("Ana, Beto y 1 más")).toBeInTheDocument();
  });

  it("shows an error state with retry", async () => {
    let calls = 0;
    mockGet.mockImplementation((url: string) => {
      if (url === "/notifications/unread-count") return Promise.resolve({ data: { count: 0 } });
      calls += 1;
      if (calls === 1) return Promise.reject(new Error("boom"));
      return Promise.resolve({ data: { items: [notif()], next_cursor: null } });
    });
    renderPanel(0);
    fireEvent.click(await screen.findByRole("button", { name: "Reintentar" }));
    expect(await screen.findByText("A Ana le gustas")).toBeInTheDocument();
  });
});
```

`NotificationItem.test.tsx`:

```tsx
import { fireEvent, render, screen } from "@testing-library/react";
import NotificationItem, { groupLabel } from "./NotificationItem";

const push = jest.fn();
jest.mock("next/router", () => ({ useRouter: () => ({ push }) }));

const base = (over: any = {}) => ({
  id: "n1", type: "like", content: "A Ana le gustas", is_read: false,
  created_at: new Date().toISOString(), actor_count: 1, actors: [],
  target_type: null, target_id: null, metadata: {},
  ...over,
});

beforeEach(() => jest.clearAllMocks());

describe("groupLabel", () => {
  it("formats with remaining count", () => {
    const n = base({ actor_count: 5, actors: [{ name: "Ana" }, { name: "Beto" }, { name: "Carla" }] });
    expect(groupLabel(n as any)).toBe("Ana, Beto, Carla y 2 más");
  });
  it("null for singles", () => {
    expect(groupLabel(base() as any)).toBeNull();
  });
});

describe("NotificationItem navigation", () => {
  it("navigates to profile with nickname", () => {
    const onRead = jest.fn();
    render(<NotificationItem notification={base({ target_type: "profile", user: { name: "Ana", photo: null, nickname: "ana" } }) as any} onRead={onRead} />);
    fireEvent.click(screen.getByText("A Ana le gustas"));
    expect(onRead).toHaveBeenCalledWith("n1");
    expect(push).toHaveBeenCalledWith("/profile/ana");
  });

  it("navigates to likes page", () => {
    const onRead = jest.fn();
    render(<NotificationItem notification={base({ target_type: "likes", user: { name: "Ana", photo: null, nickname: "ana" } }) as any} onRead={onRead} />);
    fireEvent.click(screen.getByText("A Ana le gustas"));
    expect(push).toHaveBeenCalledWith("/likes");
  });

  it("navigates to chat deep link", () => {
    const onRead = jest.fn();
    render(<NotificationItem notification={base({ target_type: "chat", target_id: "c9" }) as any} onRead={onRead} />);
    fireEvent.click(screen.getByText("A Ana le gustas"));
    expect(push).toHaveBeenCalledWith("/chat?conversation=c9");
  });

  it("navigates to url target", () => {
    const onRead = jest.fn();
    render(<NotificationItem notification={base({ type: "survey", target_type: "url", target_id: "/home?encuesta=1" }) as any} onRead={onRead} />);
    fireEvent.click(screen.getByRole("listitem"));
    expect(push).toHaveBeenCalledWith("/home?encuesta=1");
  });

  it("legacy null target only marks read", () => {
    const onRead = jest.fn();
    render(<NotificationItem notification={base({ type: "view" }) as any} onRead={onRead} />);
    fireEvent.click(screen.getByRole("listitem"));
    expect(onRead).toHaveBeenCalledWith("n1");
    expect(push).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Verlos fallar**

Run (desde `frontend/`): `npx jest src/components/notifications --ci`
Expected: FAIL — el hook no existe, panel usa contrato viejo (array), item no navega.

- [ ] **Step 3: Crear `frontend/src/hooks/useNotifications.ts`**

```typescript
import { useCallback, useEffect, useState } from "react";
import apiClient from "../services/api";

export type NotificationFilter = "all" | "social" | "messages" | "system";

export interface NotificationActor {
  user_id: string;
  name: string;
  photo: string | null;
  nickname?: string | null;
}

export interface AppNotification {
  id: string;
  type: string;
  content: string;
  is_read: boolean;
  created_at: string;
  updated_at?: string;
  actor_count: number;
  actors: NotificationActor[];
  target_type: string | null;
  target_id: string | null;
  metadata: Record<string, any>;
  user?: { name: string; photo: string | null; nickname?: string | null };
}

export function useNotifications(filter: NotificationFilter) {
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchPage = useCallback(
    async (cursor: string | null, append: boolean) => {
      try {
        setLoading(true);
        setError(false);
        const params: Record<string, unknown> = { filter, limit: 20 };
        if (cursor) params.cursor = cursor;
        const response = await apiClient.get("/notifications", { params });
        const page: AppNotification[] = response.data.items ?? [];
        setItems((prev) => (append ? [...prev, ...page] : page));
        setNextCursor(response.data.next_cursor ?? null);
      } catch (err) {
        console.error("Error fetching notifications:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    },
    [filter],
  );

  const refresh = useCallback(() => fetchPage(null, false), [fetchPage]);

  const loadMore = useCallback(() => {
    if (nextCursor) fetchPage(nextCursor, true);
  }, [fetchPage, nextCursor]);

  const refreshUnreadCount = useCallback(async () => {
    try {
      const response = await apiClient.get("/notifications/unread-count");
      setUnreadCount(response.data.count ?? 0);
    } catch (err) {
      console.error("Error fetching unread count:", err);
    }
  }, []);

  const markRead = useCallback(
    async (id: string) => {
      try {
        await apiClient.post(`/notifications/${id}/read`);
        setItems((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
        refreshUnreadCount();
      } catch (err) {
        console.error("Error marking notification as read:", err);
      }
    },
    [refreshUnreadCount],
  );

  const markAllRead = useCallback(async () => {
    try {
      await apiClient.post("/notifications/read-all");
      setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Error marking all as read:", err);
    }
  }, []);

  useEffect(() => {
    refresh();
    refreshUnreadCount();
  }, [refresh, refreshUnreadCount]);

  // Sincronía entre pestañas: Layout emite "notifications-sync" al recibir eventos WS
  useEffect(() => {
    const handler = () => refresh();
    window.addEventListener("notifications-sync", handler);
    return () => window.removeEventListener("notifications-sync", handler);
  }, [refresh]);

  return {
    items, loading, error, nextCursor, loadMore, refresh,
    markRead, markAllRead, unreadCount, refreshUnreadCount,
  };
}
```

- [ ] **Step 4: Reescribir `NotificationItem.tsx` (sin quick reply; T9 lo añade)**

```tsx
import React from "react";
import {
  ListItem, ListItemAvatar, Avatar, AvatarGroup, ListItemText,
  Typography, Box, useTheme,
} from "@mui/material";
import {
  Favorite as LikeIcon, Visibility as ViewIcon, PersonAdd as MatchIcon,
  EmojiEvents as RewardIcon, Info as SystemIcon, Chat as MessageIcon,
  Assignment as SurveyIcon, Campaign as PromoIcon,
} from "@mui/icons-material";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { useRouter } from "next/router";
import { AppNotification } from "../../hooks/useNotifications";

interface NotificationItemProps {
  notification: AppNotification;
  onRead: (id: string) => void;
}

export function groupLabel(notification: AppNotification): string | null {
  const count = notification.actor_count || 1;
  if (count <= 1) return null;
  const names = (notification.actors || []).map((a) => a.name).filter(Boolean);
  const remaining = count - names.length;
  if (names.length === 0) return `${count} personas reaccionaron`;
  if (remaining > 0) return `${names.join(", ")} y ${remaining} más`;
  return names.join(", ");
}

const getIcon = (type: string) => {
  switch (type) {
    case "like": return <LikeIcon sx={{ color: "#FF4081", fontSize: 16 }} />;
    case "view": return <ViewIcon sx={{ color: "#4CAF50", fontSize: 16 }} />;
    case "match": return <MatchIcon sx={{ color: "#E91E63", fontSize: 16 }} />;
    case "reward": return <RewardIcon sx={{ color: "#FFD700", fontSize: 16 }} />;
    case "message": return <MessageIcon sx={{ color: "#2196F3", fontSize: 16 }} />;
    case "survey": return <SurveyIcon sx={{ color: "#7C4DFF", fontSize: 16 }} />;
    case "promo": return <PromoIcon sx={{ color: "#FF9800", fontSize: 16 }} />;
    default: return <SystemIcon sx={{ color: "#9E9E9E", fontSize: 16 }} />;
  }
};

const getTitle = (type: string, userName: string) => {
  switch (type) {
    case "like": return `A ${userName} le gustas`;
    case "view": return `${userName} vio tu perfil`;
    case "match": return `¡Tienes un nuevo match con ${userName}!`;
    case "reward": return "¡Ganaste una recompensa!";
    case "message": return `Mensaje de ${userName}`;
    case "survey": return "Encuesta pendiente";
    case "promo": return "Novedades de Red Thread";
    default: return "Notificación del sistema";
  }
};

export default function NotificationItem({ notification, onRead }: NotificationItemProps) {
  const theme = useTheme();
  const router = useRouter();
  const label = groupLabel(notification);

  const handleClick = () => {
    if (!notification.is_read) onRead(notification.id);
    const target = notification.target_type;
    if (target === "profile" && notification.user?.nickname) {
      router.push(`/profile/${notification.user.nickname}`);
    } else if (target === "likes") {
      router.push("/likes");
    } else if (target === "chat" && notification.target_id) {
      router.push(`/chat?conversation=${notification.target_id}`);
    } else if (target === "url" && notification.target_id) {
      router.push(notification.target_id);
    }
  };

  const actors = notification.actors || [];

  return (
    <ListItem
      alignItems="flex-start"
      data-testid={`notification-item-${notification.id}`}
      sx={{
        bgcolor: notification.is_read ? "transparent" : "action.hover",
        borderBottom: "1px solid",
        borderColor: "divider",
        cursor: "pointer",
        transition: "background-color 0.2s",
        "&:hover": { bgcolor: "action.selected" },
      }}
      onClick={handleClick}
    >
      <ListItemAvatar>
        {label ? (
          <Box sx={{ position: "relative" }}>
            <AvatarGroup max={3} sx={{ "& .MuiAvatar-root": { width: 32, height: 32, fontSize: 14 } }}>
              {actors.slice(0, 3).map((actor) => (
                <Avatar key={actor.user_id} alt={actor.name} src={actor.photo || undefined}>
                  {actor.name?.charAt(0)}
                </Avatar>
              ))}
            </AvatarGroup>
            <Box
              sx={{
                position: "absolute", bottom: -4, right: -4, bgcolor: "background.paper",
                borderRadius: "50%", p: 0.5, display: "flex", boxShadow: 1,
              }}
            >
              {getIcon(notification.type)}
            </Box>
          </Box>
        ) : (
          <Box sx={{ position: "relative" }}>
            <Avatar alt={notification.user?.name} src={notification.user?.photo || undefined} sx={{ width: 40, height: 40 }}>
              {notification.user?.name?.charAt(0)}
            </Avatar>
            <Box
              sx={{
                position: "absolute", bottom: -2, right: -2, bgcolor: "background.paper",
                borderRadius: "50%", p: 0.5, display: "flex", alignItems: "center",
                justifyContent: "center", boxShadow: 1,
              }}
            >
              {getIcon(notification.type)}
            </Box>
          </Box>
        )}
      </ListItemAvatar>
      <ListItemText
        primary={
          <Typography
            variant="subtitle2"
            component="span"
            sx={{ fontWeight: notification.is_read ? 400 : 600 }}
          >
            {label ?? getTitle(notification.type, notification.user?.name || "Usuario")}
          </Typography>
        }
        secondary={
          <React.Fragment>
            <Typography component="span" variant="body2" sx={{ color: "text.primary", display: "inline" }}>
              {notification.content}
            </Typography>
            <Typography variant="caption" sx={{ display: "block", color: "text.secondary", mt: 0.5 }}>
              {formatDistanceToNow(new Date(notification.updated_at || notification.created_at), {
                addSuffix: true, locale: es,
              })}
            </Typography>
          </React.Fragment>
        }
      />
    </ListItem>
  );
}
```

- [ ] **Step 5: Reescribir `NotificationPanel.tsx`**

```tsx
import React, { useEffect, useState } from "react";
import {
  Box, Typography, Tabs, Tab, List, ListItemButton, ListItemIcon,
  ListItemText, CircularProgress, Button, Divider, IconButton,
} from "@mui/material";
import {
  Assignment as SurveyIcon, Close as CloseIcon,
  DoneAll as MarkReadIcon, NotificationsOff as EmptyIcon,
} from "@mui/icons-material";
import NotificationItem from "./NotificationItem";
import { NotificationFilter, useNotifications } from "../../hooks/useNotifications";

interface NotificationPanelProps {
  onClose: () => void;
  onUpdateUnreadCount: (count: number) => void;
  surveyPendingCount: number;
  onOpenSurvey: () => void;
}

const TABS: { label: string; filter: NotificationFilter }[] = [
  { label: "Todo", filter: "all" },
  { label: "Social", filter: "social" },
  { label: "Mensajes", filter: "messages" },
  { label: "Sistema", filter: "system" },
];

export default function NotificationPanel({
  onClose, onUpdateUnreadCount, surveyPendingCount, onOpenSurvey,
}: NotificationPanelProps) {
  const [tab, setTab] = useState(0);
  const filter = TABS[tab].filter;
  const {
    items, loading, error, nextCursor, loadMore, refresh,
    markRead, markAllRead, unreadCount,
  } = useNotifications(filter);

  useEffect(() => {
    onUpdateUnreadCount(unreadCount);
  }, [unreadCount, onUpdateUnreadCount]);

  const showSurvey = surveyPendingCount > 0 && (filter === "all" || filter === "system");
  const hasContent = showSurvey || items.length > 0;

  return (
    <Box sx={{ width: 380, height: "100%", display: "flex", flexDirection: "column" }}>
      <Box
        sx={{
          p: 2, display: "flex", alignItems: "center", justifyContent: "space-between",
          borderBottom: "1px solid", borderColor: "divider",
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 700 }}>Notificaciones</Typography>
        <Box>
          <IconButton onClick={markAllRead} title="Marcar todo como leído" size="small" sx={{ mr: 1 }}>
            <MarkReadIcon />
          </IconButton>
          <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
        </Box>
      </Box>

      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        variant="fullWidth"
        sx={{ borderBottom: "1px solid", borderColor: "divider" }}
      >
        {TABS.map((t) => (
          <Tab key={t.filter} label={t.label} />
        ))}
      </Tabs>

      <Box sx={{ flexGrow: 1, overflowY: "auto" }}>
        {loading && items.length === 0 ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
            <CircularProgress size={30} />
          </Box>
        ) : error ? (
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", p: 4, gap: 2 }}>
            <Typography variant="body1" sx={{ color: "text.secondary" }}>
              No se pudieron cargar las notificaciones
            </Typography>
            <Button variant="outlined" onClick={refresh}>Reintentar</Button>
          </Box>
        ) : hasContent ? (
          <List disablePadding>
            {showSurvey && (
              <ListItemButton
                data-testid="notification-survey-item"
                onClick={onOpenSurvey}
                sx={{ borderBottom: "1px solid", borderColor: "divider", bgcolor: "action.hover" }}
              >
                <ListItemIcon><SurveyIcon color="primary" /></ListItemIcon>
                <ListItemText
                  primary="Encuesta pendiente"
                  secondary={
                    surveyPendingCount === 1
                      ? "Te falta 1 pregunta para completar tus preferencias."
                      : `Te faltan ${surveyPendingCount} preguntas para completar tus preferencias.`
                  }
                />
              </ListItemButton>
            )}
            {items.map((notif) => (
              <NotificationItem key={notif.id} notification={notif} onRead={markRead} />
            ))}
            {nextCursor && (
              <>
                <Divider />
                <Box sx={{ display: "flex", justifyContent: "center", p: 1.5 }}>
                  <Button size="small" onClick={loadMore} disabled={loading}>
                    Cargar más
                  </Button>
                </Box>
              </>
            )}
          </List>
        ) : (
          <Box
            sx={{
              display: "flex", flexDirection: "column", alignItems: "center",
              justifyContent: "center", height: "100%", p: 4, opacity: 0.6,
            }}
          >
            <EmptyIcon sx={{ fontSize: 60, mb: 2, color: "text.secondary" }} />
            <Typography variant="body1" sx={{ color: "text.secondary" }}>
              No tienes notificaciones
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
}
```

Detalle de test "navigates to url target": el item de encuesta usa `getByRole("listitem")` — si MUI no expone el rol, el implementador debe usar `screen.getByTestId("notification-item-n1")` en su lugar (ajustar el test al DOM real, mismo objetivo).

- [ ] **Step 6: Correr tests + typecheck**

Run (desde `frontend/`): `npx jest src/components/notifications --ci` y `npm run typecheck`
Expected: PASS / 0 errores

- [ ] **Step 7: Commit**

```bash
git add frontend/src/hooks/useNotifications.ts frontend/src/components/notifications/
git commit -m "feat(notifications-ui): panel 2.0 con hook, tabs, paginacion y grupos"
```

---

### Task 8: Deep-link `?conversation=` + migración del tab legado del chat

**Files:**
- Create: `frontend/src/utils/chatDeepLink.ts` + `frontend/src/utils/chatDeepLink.test.ts`
- Create: `frontend/src/components/chat/ChatNotificationsTab.tsx` + test
- Modify: `frontend/src/pages/chat/index.tsx` (import línea 54; efecto tras carga de conversaciones ~línea 320; uso línea 564)
- Delete: `frontend/src/components/chat/NotificationsList.tsx`

**Interfaces:**
- Consumes: `useNotifications`, `NotificationItem` (T7).
- Produces: `resolveDeepLinkedConversation(queryValue, conversations) -> string | null`; `ChatNotificationsTab({ onUnreadCountChange? })`.

- [ ] **Step 1: Tests que fallan**

`chatDeepLink.test.ts`:

```typescript
import { resolveDeepLinkedConversation } from "./chatDeepLink";

const convs = [{ conversation_id: "c1" }, { conversation_id: "c2" }];

describe("resolveDeepLinkedConversation", () => {
  it("returns the id when it exists", () => {
    expect(resolveDeepLinkedConversation("c2", convs)).toBe("c2");
  });
  it("handles array query values", () => {
    expect(resolveDeepLinkedConversation(["c1", "c9"], convs)).toBe("c1");
  });
  it("returns null when missing or unknown", () => {
    expect(resolveDeepLinkedConversation(undefined, convs)).toBeNull();
    expect(resolveDeepLinkedConversation("zz", convs)).toBeNull();
    expect(resolveDeepLinkedConversation("c1", [])).toBeNull();
  });
});
```

`ChatNotificationsTab.test.tsx`:

```tsx
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import ChatNotificationsTab from "./ChatNotificationsTab";
import apiClient from "../../services/api";

jest.mock("../../services/api", () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn() },
}));
jest.mock("next/router", () => ({ useRouter: () => ({ push: jest.fn() }) }));

const mockGet = apiClient.get as jest.Mock;
const mockPost = apiClient.post as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  mockGet.mockImplementation((url: string) => {
    if (url === "/notifications/unread-count") return Promise.resolve({ data: { count: 1 } });
    return Promise.resolve({
      data: {
        items: [{
          id: "n1", type: "like", content: "A Ana le gustas", is_read: false,
          created_at: new Date().toISOString(), actor_count: 1, actors: [],
          target_type: null, target_id: null, metadata: {},
          user: { name: "Ana", photo: null, nickname: "ana" },
        }],
        next_cursor: null,
      },
    });
  });
  mockPost.mockResolvedValue({ data: {} });
});

it("renders items and reports unread count", async () => {
  const onUnread = jest.fn();
  render(<ChatNotificationsTab onUnreadCountChange={onUnread} />);
  expect(await screen.findByText("A Ana le gustas")).toBeInTheDocument();
  await waitFor(() => expect(onUnread).toHaveBeenCalledWith(1));
});

it("marks read on click", async () => {
  render(<ChatNotificationsTab />);
  fireEvent.click(await screen.findByText("A Ana le gustas"));
  await waitFor(() => expect(mockPost).toHaveBeenCalledWith("/notifications/n1/read"));
});
```

- [ ] **Step 2: Verlos fallar**

Run: `npx jest src/utils/chatDeepLink.test.ts src/components/chat/ChatNotificationsTab.test.tsx --ci`
Expected: FAIL — módulos no existen

- [ ] **Step 3: Implementar**

`frontend/src/utils/chatDeepLink.ts`:

```typescript
export function resolveDeepLinkedConversation(
  queryValue: string | string[] | undefined,
  conversations: { conversation_id: string }[],
): string | null {
  const value = Array.isArray(queryValue) ? queryValue[0] : queryValue;
  if (!value || conversations.length === 0) return null;
  return conversations.some((c) => c.conversation_id === value) ? value : null;
}
```

`frontend/src/components/chat/ChatNotificationsTab.tsx`:

```tsx
import React, { useEffect } from "react";
import { List, Box, Typography } from "@mui/material";
import { useNotifications } from "../../hooks/useNotifications";
import NotificationItem from "../notifications/NotificationItem";

interface ChatNotificationsTabProps {
  onUnreadCountChange?: (count: number) => void;
}

export default function ChatNotificationsTab({ onUnreadCountChange }: ChatNotificationsTabProps) {
  const { items, loading, unreadCount, markRead } = useNotifications("all");

  useEffect(() => {
    onUnreadCountChange?.(unreadCount);
  }, [unreadCount, onUnreadCountChange]);

  if (!loading && items.length === 0) {
    return (
      <Box sx={{ p: 4, textAlign: "center" }}>
        <Typography sx={{ color: "text.secondary" }}>No tienes notificaciones nuevas</Typography>
      </Box>
    );
  }

  return (
    <List sx={{ flexGrow: 1, overflowY: "auto", p: 0 }}>
      {items.map((notif) => (
        <NotificationItem key={notif.id} notification={notif} onRead={markRead} />
      ))}
    </List>
  );
}
```

`frontend/src/pages/chat/index.tsx`:
1. Línea 54: reemplazar import de `NotificationsList` por `import ChatNotificationsTab from '../../components/chat/ChatNotificationsTab';` y añadir `import { resolveDeepLinkedConversation } from '../../utils/chatDeepLink';`
2. Línea 564: `<NotificationsList onUnreadCountChange={setUnreadNotifications} />` → `<ChatNotificationsTab onUnreadCountChange={setUnreadNotifications} />`
3. Tras el useEffect de `activeConversationId` (~línea 328) añadir:

```tsx
  // Deep-link ?conversation= (campanita / quick reply)
  useEffect(() => {
    const target = resolveDeepLinkedConversation(
      router.query.conversation,
      conversations,
    );
    if (target && target !== activeConversationId) {
      setActiveConversationId(target);
    }
  }, [router.query.conversation, conversations]);
```

4. Borrar `frontend/src/components/chat/NotificationsList.tsx` (verificar antes: `rg "NotificationsList" frontend/src` → solo debe aparecer en la página del chat; tras el cambio, cero ocurrencias).

- [ ] **Step 4: Correr tests + typecheck**

Run: `npx jest src/utils/chatDeepLink.test.ts src/components/chat/ChatNotificationsTab.test.tsx --ci` y `npm run typecheck`
Expected: PASS / 0 errores

- [ ] **Step 5: Commit**

```bash
git add frontend/src/utils/chatDeepLink.ts frontend/src/utils/chatDeepLink.test.ts frontend/src/components/chat/ChatNotificationsTab.tsx frontend/src/components/chat/ChatNotificationsTab.test.tsx frontend/src/pages/chat/index.tsx
git rm frontend/src/components/chat/NotificationsList.tsx
git commit -m "feat(chat): deep-link ?conversation y migracion del tab de notificaciones"
```

---

### Task 9: Quick reply en items de mensajes — DIFERIDA A F2

**Files:**
- Modify: `frontend/src/components/notifications/NotificationItem.tsx` (añadir bloque reply)
- Modify: `frontend/src/components/notifications/NotificationItem.test.tsx` (añadir describe)

**Interfaces:**
- Consumes: `POST /chat/send` `{conversation_id, content}` (api/chat.py:580); `notification.metadata.conversation_id` y `metadata.can_reply` (T2/T6).
- Produces: sin cambios de props; usa `useSnackbar` (notistack) — los tests deben envolver en `<SnackbarProvider>`.

- [ ] **Step 1: Tests que fallan (añadir a `NotificationItem.test.tsx`)**

```tsx
import { SnackbarProvider } from "notistack";
import apiClient from "../../services/api";

jest.mock("../../services/api", () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn() },
}));

const mockPost = apiClient.post as jest.Mock;

const messageNotif = (over: any = {}) => ({
  id: "m1", type: "message", content: "Hola!", is_read: false,
  created_at: new Date().toISOString(), actor_count: 1, actors: [],
  target_type: "chat", target_id: "c1",
  metadata: { conversation_id: "c1", can_reply: true },
  user: { name: "El", photo: null, nickname: "el" },
  ...over,
});

const renderItem = (notification: any, onRead = jest.fn()) => {
  render(
    <SnackbarProvider>
      <NotificationItem notification={notification} onRead={onRead} />
    </SnackbarProvider>,
  );
  return { onRead };
};

describe("quick reply", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPost.mockResolvedValue({ data: {} });
  });

  it("expands and sends with the exact payload", async () => {
    const { onRead } = renderItem(messageNotif());
    fireEvent.click(screen.getByTestId("quick-reply-toggle"));
    fireEvent.change(screen.getByTestId("quick-reply-input"), { target: { value: "  hola  " } });
    fireEvent.click(screen.getByTestId("quick-reply-send"));
    await waitFor(() =>
      expect(mockPost).toHaveBeenCalledWith("/chat/send", {
        conversation_id: "c1",
        content: "hola",
      }),
    );
    expect(onRead).toHaveBeenCalledWith("m1");
    await waitFor(() => expect(screen.queryByTestId("quick-reply-input")).not.toBeInTheDocument());
  });

  it("keeps the text on error", async () => {
    mockPost.mockRejectedValue(new Error("no"));
    renderItem(messageNotif());
    fireEvent.click(screen.getByTestId("quick-reply-toggle"));
    fireEvent.change(screen.getByTestId("quick-reply-input"), { target: { value: "hola" } });
    fireEvent.click(screen.getByTestId("quick-reply-send"));
    await waitFor(() => expect(mockPost).toHaveBeenCalled());
    expect(await screen.findByTestId("quick-reply-input")).toHaveValue("hola");
  });

  it("hidden when can_reply is false", () => {
    renderItem(messageNotif({ metadata: { conversation_id: "c1", can_reply: false } }));
    expect(screen.queryByTestId("quick-reply-toggle")).not.toBeInTheDocument();
  });

  it("hidden for non-message types", () => {
    renderItem(messageNotif({ type: "like", metadata: {} }));
    expect(screen.queryByTestId("quick-reply-toggle")).not.toBeInTheDocument();
  });
});
```

(Importar `waitFor` en el archivo existente.)

- [ ] **Step 2: Verlos fallar**

Run: `npx jest src/components/notifications/NotificationItem.test.tsx --ci`
Expected: FAIL — no existe `quick-reply-toggle`

- [ ] **Step 3: Implementar en `NotificationItem.tsx`**

Añadir imports: `TextField`, `IconButton`, `Button` de MUI; `Send as SendIcon` de icons; `useSnackbar` de notistack; `apiClient` de `../../services/api`; `useState`.

Añadir al inicio del componente:

```tsx
  const { enqueueSnackbar } = useSnackbar();
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const canQuickReply =
    notification.type === "message" && notification.metadata?.can_reply === true;
  const replyConversationId = notification.metadata?.conversation_id;

  const handleSendReply = async () => {
    const content = replyText.trim();
    if (!content || sending || !replyConversationId) return;
    try {
      setSending(true);
      await apiClient.post("/chat/send", {
        conversation_id: replyConversationId,
        content,
      });
      setReplyText("");
      setReplyOpen(false);
      onRead(notification.id);
      enqueueSnackbar("Respuesta enviada", { variant: "success", autoHideDuration: 2000 });
    } catch (err) {
      console.error("Error sending quick reply:", err);
      enqueueSnackbar("No se pudo enviar la respuesta", { variant: "error" });
    } finally {
      setSending(false);
    }
  };
```

Y en el `ListItemText` secondary (tras el timestamp) añadir el bloque:

```tsx
            {canQuickReply && (
              <Box sx={{ mt: 1 }} onClick={(e) => e.stopPropagation()}>
                {!replyOpen ? (
                  <Button size="small" data-testid="quick-reply-toggle" onClick={() => setReplyOpen(true)}>
                    Responder
                  </Button>
                ) : (
                  <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                    <TextField
                      size="small"
                      fullWidth
                      placeholder="Escribe una respuesta…"
                      value={replyText}
                      data-testid="quick-reply-input"
                      onChange={(e) => setReplyText(e.target.value)}
                    />
                    <IconButton
                      size="small"
                      data-testid="quick-reply-send"
                      disabled={!replyText.trim() || sending}
                      onClick={handleSendReply}
                    >
                      <SendIcon fontSize="small" />
                    </IconButton>
                  </Box>
                )}
              </Box>
            )}
```

- [ ] **Step 4: Correr todo el paquete**

Run: `npx jest src/components/notifications --ci` y `npm run typecheck`
Expected: PASS / 0 errores

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/notifications/NotificationItem.tsx frontend/src/components/notifications/NotificationItem.test.tsx
git commit -m "feat(notifications-ui): quick reply en items de mensajes"
```

---

### Task 10: Layout — badge sincronizado entre pestañas — SUPERSEDED por Task 10-F1

**Files:**
- Create: `frontend/src/hooks/notificationSync.ts` + `frontend/src/hooks/notificationSync.test.ts`
- Modify: `frontend/src/components/layout/Layout.tsx` (fetch unread ~146–162; WS onmessage ~232–240; añadir visibilitychange)

**Interfaces:**
- Consumes: WS events de T3 (`notification_read`, `notifications_read_all`); evento `notifications-sync` escuchado por `useNotifications` (T7).
- Produces: `applyNotificationSocketEvent(data, setUnreadCount, fetchUnreadCount) -> boolean` (true = manejado).

- [ ] **Step 1: Test que falla** (`notificationSync.test.ts`)

```typescript
import { applyNotificationSocketEvent } from "./notificationSync";

describe("applyNotificationSocketEvent", () => {
  it("refetches on notification_read", () => {
    const setCount = jest.fn();
    const fetchCount = jest.fn();
    expect(applyNotificationSocketEvent({ action: "notification_read" }, setCount, fetchCount)).toBe(true);
    expect(fetchCount).toHaveBeenCalled();
  });

  it("zeroes the badge on notifications_read_all", () => {
    const setCount = jest.fn();
    expect(applyNotificationSocketEvent({ action: "notifications_read_all" }, setCount, jest.fn())).toBe(true);
    expect(setCount).toHaveBeenCalledWith(0);
  });

  it("refetches on new_notification and new_message", () => {
    const fetchCount = jest.fn();
    applyNotificationSocketEvent({ action: "new_notification" }, jest.fn(), fetchCount);
    applyNotificationSocketEvent({ action: "new_message" }, jest.fn(), fetchCount);
    expect(fetchCount).toHaveBeenCalledTimes(2);
  });

  it("ignores unknown actions", () => {
    expect(applyNotificationSocketEvent({ action: "typing" }, jest.fn(), jest.fn())).toBe(false);
  });
});
```

- [ ] **Step 2: Verlo fallar**

Run: `npx jest src/hooks/notificationSync.test.ts --ci`
Expected: FAIL — módulo no existe

- [ ] **Step 3: Crear `frontend/src/hooks/notificationSync.ts`**

```typescript
export function applyNotificationSocketEvent(
  data: any,
  setUnreadCount: (count: number) => void,
  fetchUnreadCount: () => void,
): boolean {
  switch (data?.action) {
    case "notification_read":
      fetchUnreadCount();
      return true;
    case "notifications_read_all":
      setUnreadCount(0);
      return true;
    case "new_notification":
      fetchUnreadCount();
      return true;
    case "new_message":
      fetchUnreadCount();
      return true;
    default:
      return false;
  }
}
```

- [ ] **Step 4: Modificar `Layout.tsx`**

1. Extraer el fetch a callback reutilizable (sustituye el useEffect de ~146):

```tsx
  const fetchUnreadCount = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const unreadResponse = await apiClient.get("/notifications/unread-count");
      setUnreadCount(unreadResponse.data.count);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);
```

(importar `useCallback` si no está; `useRef` ya está.)

2. WS onmessage (~236): reemplazar el bloque `if (data.action === "new_notification" || ...) setUnreadCount(prev => prev + 1)` por:

```tsx
      const handled = applyNotificationSocketEvent(data, setUnreadCount, fetchUnreadCount);
      if (handled) {
        window.dispatchEvent(new CustomEvent("notifications-sync"));
      }
```

y añadir el import `import { applyNotificationSocketEvent } from "../../hooks/notificationSync";`. Ajustar deps del useEffect del WS: `[isAuthenticated, user?.user_id, fetchUnreadCount]`.

3. Refetch al recuperar foco (red de seguridad):

```tsx
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") fetchUnreadCount();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [fetchUnreadCount]);
```

- [ ] **Step 5: Correr tests + typecheck + lint**

Run: `npx jest src/hooks/notificationSync.test.ts --ci`; `npm run typecheck`; `npm run lint`
Expected: PASS / 0 errores

- [ ] **Step 6: Commit**

```bash
git add frontend/src/hooks/notificationSync.ts frontend/src/hooks/notificationSync.test.ts frontend/src/components/layout/Layout.tsx
git commit -m "feat(notifications-ui): sincronia de badge entre pestanas"
```

---

### Task 11: Ajustes — toggles de silencio — DIFERIDA A F3

**Files:**
- Modify: `frontend/src/hooks/useSettings.ts` (interface `UserSettings` ~línea 19–31)
- Modify: `frontend/src/components/settings/NotificationsSection.tsx` (añadir bloque tras "Matches" ~línea 200)
- Test: `frontend/src/components/settings/NotificationsSection.test.tsx` (nuevo)

**Interfaces:**
- Consumes: `notification_mutes` backend (T3); `onSettingsChange(field, value)` existente.
- Produces: switches `data-testid="mute-social|mute-messages|mute-system|mute-promos"`.

- [ ] **Step 1: Test que falla**

```tsx
import { fireEvent, render, screen } from "@testing-library/react";
import NotificationsSection from "./NotificationsSection";

const settings = {
  notifications_enabled: true,
  notification_frequency: { suggestions: true, messages: true, news: true, matches: true },
  notification_mutes: { social: false, messages: false, system: false, promos: false },
};

describe("NotificationsSection mute switches", () => {
  it("renders the mute block with copy", () => {
    render(<NotificationsSection settings={settings} onSettingsChange={jest.fn()} />);
    expect(screen.getByText("Silenciar")).toBeInTheDocument();
    expect(
      screen.getByText("Las notificaciones silenciadas se ocultan de la campanita y del contador."),
    ).toBeInTheDocument();
  });

  it("persists social mute through onSettingsChange", () => {
    const onChange = jest.fn();
    render(<NotificationsSection settings={settings} onSettingsChange={onChange} />);
    fireEvent.click(screen.getByTestId("mute-social"));
    expect(onChange).toHaveBeenCalledWith("notification_mutes", {
      social: true, messages: false, system: false, promos: false,
    });
  });

  it("promos switch is disabled while system is muted", () => {
    render(
      <NotificationsSection
        settings={{ ...settings, notification_mutes: { ...settings.notification_mutes, system: true } }}
        onSettingsChange={jest.fn()}
      />,
    );
    expect(screen.getByTestId("mute-promos")).toBeDisabled();
  });
});
```

- [ ] **Step 2: Verlo fallar**

Run: `npx jest src/components/settings/NotificationsSection.test.tsx --ci`
Expected: FAIL — no existe el bloque

- [ ] **Step 3: Implementar**

`useSettings.ts` — añadir a `UserSettings` tras `notification_frequency`:

```typescript
  notification_mutes?: {
    social: boolean;
    messages: boolean;
    system: boolean;
    promos: boolean;
  };
```

`NotificationsSection.tsx` — tras el último `FormControlLabel` de categorías (Matches, ~línea 200) insertar:

```tsx
            <Divider />

            {/* Mute per bucket (Notificaciones 2.0) */}
            <Box>
                <Typography
                    variant="h6"
                    gutterBottom
                    sx={{
                        fontWeight: 600,
                        mb: 2
                    }}>
                    Silenciar
                </Typography>
                <Typography variant="caption" sx={{
                    color: "text.secondary",
                    display: "block",
                    mb: 2
                }}>
                    Las notificaciones silenciadas se ocultan de la campanita y del contador.
                </Typography>
                <Stack spacing={2}>
                    <FormControlLabel
                        control={
                            <Switch
                                data-testid="mute-social"
                                checked={settings?.notification_mutes?.social ?? false}
                                onChange={(e) => onSettingsChange('notification_mutes', {
                                    ...settings?.notification_mutes,
                                    social: e.target.checked
                                })}
                            />
                        }
                        label="Sociales (likes y matches)"
                    />
                    <FormControlLabel
                        control={
                            <Switch
                                data-testid="mute-messages"
                                checked={settings?.notification_mutes?.messages ?? false}
                                onChange={(e) => onSettingsChange('notification_mutes', {
                                    ...settings?.notification_mutes,
                                    messages: e.target.checked
                                })}
                            />
                        }
                        label="Mensajes"
                    />
                    <FormControlLabel
                        control={
                            <Switch
                                data-testid="mute-system"
                                checked={settings?.notification_mutes?.system ?? false}
                                onChange={(e) => onSettingsChange('notification_mutes', {
                                    ...settings?.notification_mutes,
                                    system: e.target.checked
                                })}
                            />
                        }
                        label="Sistema"
                    />
                    <Box sx={{ ml: 4 }}>
                        <FormControlLabel
                            control={
                                <Switch
                                    data-testid="mute-promos"
                                    checked={settings?.notification_mutes?.promos ?? false}
                                    disabled={settings?.notification_mutes?.system ?? false}
                                    onChange={(e) => onSettingsChange('notification_mutes', {
                                        ...settings?.notification_mutes,
                                        promos: e.target.checked
                                    })}
                                />
                            }
                            label={
                                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                                    Promociones dentro de Sistema
                                </Typography>
                            }
                        />
                    </Box>
                </Stack>
            </Box>
```

- [ ] **Step 4: Correr tests + typecheck + lint**

Run: `npx jest src/components/settings/NotificationsSection.test.tsx --ci`; `npm run typecheck`; `npm run lint`
Expected: PASS / 0 errores

- [ ] **Step 5: Commit**

```bash
git add frontend/src/hooks/useSettings.ts frontend/src/components/settings/NotificationsSection.tsx frontend/src/components/settings/NotificationsSection.test.tsx
git commit -m "feat(settings): toggles de silencio de notificaciones"
```

---

## Self-Review (hecho al escribir el plan)

**Cobertura del spec → tareas:**

| Spec | Tarea |
|---|---|
| Modelo extendido + índices + retención 30d | T2 (modelo) + T3 (cleanup lazy) |
| GET cursor/filtros/silencios + contrato nuevo | T3 |
| unread-count (mutes/master/important, DND solo push) | T2 (`should_push`) + T3 |
| read/read-all + eventos WS | T3 |
| POST /system admin (audience, chunks, important, survey) | T3 |
| Pipeline like con `shown_media_id` + métrica foto | T4 (métrica) + T5 (swipe) |
| Pipeline match (2 docs, target chat/fallback profile) | T2 (`emit_match_notification`) + T5 |
| Pipeline mensajes WS+REST, viva, mutes, can_reply | T2 + T6 |
| Agrupación bump 24h, cap 3, superlike sin grupo | T2 |
| Push WS new_notification (silencios/DND/important) | T2 (`_push_new_notification`) |
| ConnectionManager multi | T1 |
| Smart Photos likes + like_rate | T4 |
| Panel tabs/paginación/hook/estados | T7 |
| Item iconos/grupos/click-through/mark-read | T7 |
| Quick reply | T9 |
| Badge + sync multi-pestaña + foco | T10 (+ hook listener en T7) |
| Deep-link ?conversation + retiro tab legado | T8 |
| Ajustes silencio + backend settings | T3 (backend) + T11 (UI) |
| Migración/legacy tolerante | T2 (defaults) + T7 (render legacy) |
| Tests backend/frontend | cada tarea |

**Placeholder scan:** sin TBD/TODO; los únicos "leer el archivo" son para copiar dependencias exactas ya verificadas (`require_employee_permission`, defaults de `Conversation`) — rutas exactas indicadas.

**Consistencia de tipos:** `can_reply`/`conversation_id` en `metadata` usados igual en T2, T6, T9; `next_cursor`/`items` en T3, T7, T8; `notification_mutes` en T3 y T11; `applyNotificationSocketEvent(data, setUnreadCount, fetchUnreadCount)` igual en T7 (evento) y T10.

**Riesgo conocido:** el test de `test_swipe_notifications.py::test_swipe_request_accepts_shown_media_id` depende de los campos reales de `SwipeRequest` (leer `discovery.py:43`); y `photo_metric.py` puede requerir registrar `DocumentSettings` en conftest (indicado en T4).

