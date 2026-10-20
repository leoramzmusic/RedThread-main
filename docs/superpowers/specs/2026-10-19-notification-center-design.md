# Notificaciones 2.0 (Campanita) — Design

Fecha: 2026-10-19
Estado: aprobado por el usuario (diseño sección a sección; enmienda F1 aprobada 2026-10-19)
Iniciativa: "Sistema unificado de notificaciones + mensajería flotante configurable".
Este spec cubre la **Fase A — Notificaciones 2.0**, ahora reencuadrada en tres fases:

- **F1 (este spec):** bandeja unificada Todo / Likes / Chats / Sistema, docs como
  fuente única, click-through, contador por bucket, vivo en likes/matches/chats,
  i18n 21 idiomas y encuesta CARE integrada.
- **F2:** agrupación visible ("A, B y N más"), prioridad por compatibilidad,
  paginación y quick reply.
- **F3:** silencios por bucket (+ promos), posponer, swipe archivar/borrar con
  histórico y animaciones.
- **Fase B** (chat flotante configurable) sigue fuera de este ciclo.

## Objetivo

Llevar la campanita global a un comportamiento tipo Facebook/LinkedIn con cuatro
pestañas:

- **Todo:** bandeja global (likes, matches, chats, sistema y encuesta).
- **Likes:** likes recibidos y matches formados.
- **Chats:** una notificación viva por conversación, con preview; sin apilar.
- **Sistema:** encuestas, actualizaciones y promos (bucket único; sub-toggle de
  promos llega en F3).

Con click-through al destino, contador/badge confiable, estado de leído
sincronizado entre pestañas, i18n en los 21 idiomas del producto y silenciamiento
por bucket configurable (F3).

## Estado actual relevante

- `Notification` (backend/src/models/notification.py) ya está extendido:
  `group_key`, `actor_count`, `actors`, `target_type`, `target_id`, `metadata`,
  `updated_at`; índices por usuario/fecha, usuario/leído y usuario/grupo/fecha.
- `backend/src/services/notification_service.py` ya implementa emisión directa,
  agrupación rodante con bump 24 h, cap de 3 actores, silencios (filtro al
  mostrar), DND solo para push y push WS `new_notification` vía
  `ConnectionManager` multi-pestaña. **T1 y T2 del plan están hechos** (commits
  `de85553`, `d5515e7`).
- `backend/src/api/notifications.py` sigue en la versión legacy (lista plana,
  limpieza 48 h, `unread-count`, `read`, `read-all`). T3 del plan está pendiente.
- La emisión real desde swipe/match (T5) y mensajes (T6) **aún no está wired**;
  por eso likes/matches/mensajes todavía no generan docs. El consumer Kafka de
  notificaciones sigue siendo stub y no es la fuente de la bandeja.
- El panel legacy (`NotificationPanel`) tiene tabs Todo/Matches/Solicitudes/
  Sistema, sin click-through, sin paginación, sin i18n, sin quick reply y con la
  encuesta CARE como ítem sintético local. `NotificationsList` del tab de chat es
  un duplicado legado con polling de 60 s.
- Chat: WS `/chat/ws/{user_id}` y REST `GET /chat/messages/{conversation_id}`;
  al pedir mensajes se marcan leídos y se resetea `unread_count`. Conversaciones
  con `muted_by`, `archived_by`.
- Ajustes: `useSettings` persiste vía `GET/PUT /settings/me`;
  `NotificationsSection` expone master, frecuencias, No Molestar y offline. El
  backend de silencios (`notification_mutes`) se añade en T3, pero la UI de
  silencios es F3.
- i18n: `next-i18next`, 21 locales en `frontend/public/locales/*`, namespace
  `common` cargado en todas las páginas. No existe namespace de notificaciones.
- Encuestas CARE: `CarePreferenceSurveyBubble` en Home, deep-link
  `?encuesta=1`; `CareUserPreference` + `CARE_DIMENSION_KEYS` permiten calcular
  pendientes en backend.
- Likes recibidos: `pages/likes/index.tsx` (ruta `/likes`). Perfiles:
  `pages/profile/[nickname]/index.tsx`. Chat: `pages/chat/index.tsx`.
- El ledger SDD (`2026-10-19-notification-center-v2`) pausó la ejecución al
  recibir esta enmienda UX/UI + i18n.

## Decisiones aprobadas

Decisiones originales (siguen vigentes salvo lo indicado en la enmienda):

1. **Descomposición:** A (Notificaciones 2.0) primero y completa; luego B (chat
   flotante). Quick reply pasa a F2 dentro de A.
2. **Nexo like↔foto (opción b):** el cliente envía `shown_media_id` (foto visible
   al dar like); se guarda en el match y alimenta la métrica de esa foto.
3. **Retención:** 30 días con paginación por cursor; limpieza lazy en la primera
   página. Sin cron.
4. **Alcance de eventos:** like (con foto), match, mensaje + sistema con emisor
   admin mínimo. Fuera: vistas de perfil y promos automatizadas.
5. **Agrupación:** grupo rodante con bump (ventana 24 h por grupo); mensajes =
   una notificación viva por conversación; matches y sistema nunca agrupan.
   Superlikes no agrupan. La agrupación se materializa en el doc (T2); su
   **render** ("y N más") es F2.
6. **Silencio:** filtro al mostrar — el doc se crea igual, pero el bucket
   silenciado se oculta de lista/badge/push WS. `metadata.important`
   (verificación/seguridad) no es silenciable. La UI de silencios es F3; la API
   ya los respeta desde T3.
7. **Enfoques técnicos:** (1a) creación directa en la fuente vía
   `notification_service` (Kafka queda como canal paralelo, nunca bloquea la
   bandeja); (2a) documento-grupo materializado con bump.

Enmienda F1 (2026-10-19):

8. **Fuente única:** los documentos `Notification` son la bandeja. No hay
   endpoint agregador `/notifications/inbox` ni colección `InboxState`; no se
   publica `push.like` por Kafka. Likes/matches/mensajes se muestran desde sus
   docs, creados por T5/T6.
9. **Tabs:** Todo / Likes / Chats / Sistema. Los filtros de API siguen siendo
   `all|social|messages|system`; `social` incluye like+match y `system` incluye
   system+survey+promo.
10. **Contador:** `unread-count` se extiende a counts por bucket
    (`social`, `messages`, `system`) + `survey_pending`. Badge = `all`.
11. **Visto por bucket:** abrir Likes marca leídos los docs `social`; abrir
    Sistema marca leídos los docs `system`; Chats no hace bulk (cada conversación
    se marca al abrirse); Todo no marca nada. La encuesta CARE sigue rigiéndose
    por pendientes reales.
12. **Click-through:** like → `/likes`; match → chat (fallback perfil); mensaje →
    chat y marca leído; system/survey/promo → `target_url` (encuesta →
    `/home?encuesta=1`); legacy sin destino → solo marca leída. Cerrar el panel
    antes de navegar.
13. **i18n 21 idiomas:** la copy de eventos se renderiza en cliente desde
    `type/actors/actor_count/metadata`; `content` queda como fallback legacy y
    como texto autorado de system/promo. Claves en `common.json` bajo
    `notifications.*` (evita tocar el `serverSideTranslations` de todas las
    páginas) en los 21 locales.
14. **Encuesta CARE:** sigue siendo un ítem sintético (no un doc). El backend
    calcula `survey_pending` en `unread-count`; el panel lo pinta fijado arriba
    en Todo/Sistema. `care-preferences-changed` refresca counts/panel.
15. **Vivo:** T5/T6 emiten y el service pushea `new_notification`; el Layout
    refetchea counts ante eventos WS (multi-pestaña por T1) y despacha
    `notifications-sync` para que el panel abierto se refresque. Sin cambios en
    los publishes Kafka existentes.
16. **Fases:** F1 = bandeja + pipeline + counts/seen + i18n + click-through;
    F2 = grupos visibles, prioridad por compatibilidad, paginación y quick reply;
    F3 = silencios UI, posponer, swipe archivar/borrar con histórico y
    animaciones.

## Alcance

### F1 (entra)

- T3: API de notificaciones (cursor, filtros, retención 30 d), counts por bucket,
  `read-bucket`, eventos WS de sincronía y `notification_mutes` en settings
  (backend).
- T4/T5: métrica de likes en Smart Photos (dependencia de T5) y pipeline
  swipe/like/match con `shown_media_id`.
- T6: pipeline de mensajes (WS + REST) con notificación viva por conversación.
- Integración chat→notificación: al marcar mensajes leídos se marca leído el doc
  `message:{conversation_id}` y se emite sincronía.
- T7 reducido: hook `useNotifications`, panel con 4 tabs, counts, click-through,
  visto por bucket, estados vacío/error/loading, sin grupos visibles, sin
  paginación UI, sin quick reply.
- i18n: claves de notificaciones en los 21 locales + test de paridad.
- T8: deep-link `?conversation=` y migración/retiro del tab legado del chat.
- T10: badge de Layout desde counts, sincronía WS multi-pestaña, refetch al
  recuperar foco.
- Encuesta CARE sintética + `survey_pending` server-side.
- Tests backend y frontend de todo lo anterior.

### F2 (no entra en F1)

- Render de grupos con `actors` + `actor_count` ("A, B y N más") usando
  `Intl.ListFormat`.
- Prioridad por compatibilidad (enriquecer/sortear likes y matches con affinity;
  el diseño se hará en su ciclo).
- Paginación visible ("Cargar más") sobre el cursor ya existente.
- Quick reply en items de mensaje (T9).

### F3 (no entra en F1)

- UI de silencios por bucket + sub-toggle de promos (T11), persistida en
  `notification_mutes`.
- Posponer con intervalos (15 min, 1 h, 2 h, 8 h, 1 día, siempre) y enforcement
  real en lista/badge/WS.
- Swipe derecha archivar (histórico) / izquierda borrar, con animaciones.
- Campos de estado por doc (`snoozed_until`, `archived_at`, `deleted_at` o
  equivalentes) y filtros de histórico; se diseñará con su propio spec.

### Frontera explícita

- Fase B completa (panel flotante, burbujas).
- Microservicio standalone `backend/src/services/chat/` (no se toca; el contrato
  vivo es `api/chat.py`).
- Vistas de perfil ("X vio tu perfil").
- Promos automatizadas (solo emisor admin manual en F1; campañas in-app reales
  quedan fuera).
- Push nativo / email.
- Filtro por foto en la página de likes (el grupo de likes abre `/likes`).

## Arquitectura

Creación (1a):

```
evento (swipe/match/mensaje/admin)
  -> notification_service.emit_*()
     -> tipo, grupo, destino, metadata, silencios
     -> crea o actualiza (bump) el doc Notification
     -> push WS al receptor: {"action": "new_notification", ...}
  -> Kafka: los publishes existentes se mantienen (futuro email/push);
     la bandeja no depende de ellos
```

Lectura (2a):

```
GET /notifications?filter=... (cursor)
  -> docs-grupo ya materializados (updated_at desc)
  -> frontend pinta copy i18n desde type/actors/metadata
  -> counts por bucket desde /notifications/unread-count
```

Sincronía:

```
WS (new_notification | notification_read | notifications_read_all |
    notifications_bucket_read | notifications_sync | new_message)
  -> Layout refetchea counts (debounce) + dispatch DOM "notifications-sync"
  -> panel abierto refetchea lista/counts
```

## Modelo de datos

`Notification` (beanie Document, colección `notifications`):

```python
class Notification(Document):
    user_id: str                      # receptor
    type: str                         # 'like'|'match'|'message'|'system'|'survey'|'promo' (legacy: 'view'|'reward')
    content: str                      # fallback legacy / texto autorado de system/promo
    related_user_id: Optional[str]    # actor principal (compat)
    is_read: bool = False
    created_at: datetime
    updated_at: datetime              # bump = último movimiento; orden de lista
    group_key: Optional[str]          # 'like:photo:{media_id}' | 'like:profile' | 'message:{conversation_id}'
    actor_count: int = 1              # total de actores (o mensajes en grupos de mensaje)
    actors: List[dict] = []           # [{user_id, name, photo, nickname}] cap 3
    target_type: Optional[str]        # 'profile'|'likes'|'chat'|'url' (legacy: None)
    target_id: Optional[str]          # user_id | media_id | conversation_id | ruta
    metadata: Optional[dict] = None   # {preview, superlike, important, can_reply, conversation_id, ...}
```

Reglas F1:

- Tolerancia a docs legacy: campos nuevos con default; `view`/`reward` se
  renderizan genéricos, sin destino, y el click solo marca leída.
- `updated_at` ordena lista y counts (bump sube al tope).
- Índices ya creados en T2.
- Retención 30 días lazy en la primera página (T3).
- F3 añadirá campos de snooze/archivo/borrado; no en F1.
- `content` no se muestra para like/match/message cuando hay datos
  estructurados; sí para system/promo y como fallback de docs legacy.

## API

Router existente `backend/src/api/notifications.py` salvo el emisor admin.

### GET /notifications

Query: `filter?: 'all'|'social'|'messages'|'system'` (default `all`),
`cursor?: str`, `limit?: int = 20 (máx 50)`, `unread?: bool`.

- Cursor opaco `"{updated_at ISO}|{id}"`; orden `updated_at desc, id desc`.
- Filtros: `social` = [like, match]; `messages` = [message]; `system` =
  [system, survey, promo].
- `unread=true` filtra `is_read=false`. Chats lo usa para mostrar solo
  conversaciones con actividad no leída; el resto de tabs no.
- Silencios/master se aplican siempre (T3).
- Retención 30 d al pedir la primera página (sin cursor).
- Respuesta: `{ "items": [...], "next_cursor": str|null }`.
- Item: `{ id, type, content, is_read, created_at, updated_at, actor_count,
  actors, target_type, target_id, metadata }` + `user: {name, photo, nickname}`
  enriquecido desde `related_user_id` para **todos** los docs que lo tengan
  (singular, grupo y mensaje). Así F1 puede mostrar al último actor de un grupo
  sin renderizar “y N más”.
- El frontend no usa `content` para copy de eventos; usa tipo/actores/metadata.

### GET /notifications/unread-count

Respuesta:

```json
{
  "count": 7,
  "all": 7,
  "social": 3,
  "messages": 2,
  "system": 2,
  "survey_pending": 1
}
```

- `count = all` (compatibilidad con el Layout actual).
- `social` = docs like/match no leídos; `messages` = docs message no leídos (uno
  por conversación); `system` = docs system/survey/promo no leídos + (1 si
  `survey_pending > 0`); `all` = suma.
- `survey_pending` = dimensiones CARE sin preferencia, calculado con
  `CareUserPreference` + `CARE_DIMENSION_KEYS`; si falla la consulta, 0.
- Silencios/master: `visibility_query` sobre los docs; con master off solo
  cuentan `metadata.important`. DND no afecta el badge.
- La encuesta CARE cuenta como pendiente de Sistema (no como doc). En F1
  `survey_pending` se suma siempre (es una acción, no un doc); en F3 se decidirá
  si el silencio de Sistema la oculta.

### POST /notifications/{id}/read · POST /notifications/read-all

- Comportamiento existente + push WS al propio usuario:
  `{"action": "notification_read", "id": ...}` y
  `{"action": "notifications_read_all"}`.
- `read-all` marca todos los docs del usuario (incluye chats).

### POST /notifications/read-bucket (nuevo)

Body: `{ "bucket": "social" | "system" }`.

- Marca `is_read=true` en todos los docs no leídos del bucket del usuario.
- Push WS: `{"action": "notifications_bucket_read", "bucket": ...}`.
- `messages` no se acepta (400): el visto de chats es por conversación.
- Devuelve `{ "updated": n }`.

### POST /notifications/system (admin-only)

Sin cambios respecto al spec original: audience `{all:true}|{user_ids:[]}`,
`type` system/promo/survey, `content`, `target_url`, `metadata.important`;
fan-out por chunks; guard RBAC existente.

### Integración chat → notificación

- En el path que marca mensajes leídos (`GET /chat/messages/{conversation_id}`),
  marcar también el doc con `group_key = "message:{conversation_id}"` del
  receptor y emitir `notifications_sync` por WS.
- Esto mantiene el badge aunque el chat se abra desde la lista de chats y no
  desde la campanita.
- En el panel, al hacer click en un chat, se marca el doc leído antes de navegar
  (por si el endpoint de chat no se ha ejecutado todavía).

## Pipeline de creación (T5/T6, ya diseñado)

- **Like** (`POST /discovery/swipe`): request gana `shown_media_id`; LIKE/
  SUPERLIKE sin match emite `emit_like_notification`; match mutuo emite
  `emit_match_notification` para ambos. Superlike no agrupa. La foto válida del
  receptor incrementa `PhotoMetric.likes` (T4).
- **Mensaje** (WS y REST): `notify_new_message` con `group_key=message:{conv}`,
  preview 80 chars, `can_reply`; conversación muteada no notifica.
- **Sistema:** `POST /notifications/system` usa `emit_system_notification`.
- **Kafka:** sin cambios; la bandeja no depende de consumers.

## i18n

- Namespace efectivo: `common`, subárbol `notifications.*` (cargado en todas las
  páginas). Añadir el árbol a los 21 locales:
  `en, es, pt, fr, de, it, ru, sv, nl, zh, hi, bn, ja, ko, ar, sw, ha, am, tl,
  ms, mi`.
- Claves mínimas:
  - `notifications.title`, `close`, `retry`, `markAllRead`, `loading`, `error`.
  - `notifications.tabs.{all,likes,chats,system}`.
  - `notifications.empty.{all,likes,chats,system}`.
  - `notifications.like.{single,superlike,group}`.
  - `notifications.match.single`.
  - `notifications.message.single` (si se necesita; el preview es contenido).
  - `notifications.survey.{title,pending_one,pending_other}`.
  - `notifications.system.fallback`.
  - `notifications.actor.more` (F2).
- Plurales con claves `_one/_other` (y formas que requiera el locale; i18next
  resuelve el resto).
- Nombres de actores no se traducen; se unen con `Intl.ListFormat` según el
  locale (F2 para grupos).
- Fechas relativas con el locale de date-fns correspondiente al idioma activo;
  fallback `en` si no existe (p. ej. `mi`, `tl`).
- `metadata.preview` y `content` son contenido de usuario/admin: no se traducen.
- Test de paridad: todas las locales deben tener todas las claves de `en` bajo
  `notifications`; se permiten claves extra de plural (`_zero/_few/_many`) que
  requiera el locale.

## Frontend

### Hook y datos

- `useNotifications(filter, { unread? })`: fetch paginado (`limit=50` en F1), sin
  UI de "cargar más" (F2); mark-read, mark-bucket, mark-all, counts; expone
  loading/error/items/nextCursor/counts.
- `useNotificationCounts()` o counts dentro del hook: `GET
  /notifications/unread-count`.
- El panel y el tab de notificaciones del chat comparten hook e item.

### Panel (F1)

- Header: “Notificaciones” + cerrar; “Marcar todo leído” contextual solo en
  Sistema.
- Tabs con icono y pill de count: Todo / Likes / Chats / Sistema; testids
  `notification-tab-{all|likes|chats|system}`.
- Al abrir un tab: cargar lista + counts. Si es Likes y `social > 0`, llamar
  `read-bucket social`; si es Sistema y `system > 0` (sin contar la encuesta),
  `read-bucket system`; luego refrescar. Guardar por apertura para no repetir.
- Chats: `filter=messages&unread=true`; al abrir el chat se marca leído.
- Todo: `filter=all`; encuesta fijada arriba si `survey_pending > 0`.
- Sistema: `filter=system`; encuesta fijada arriba; docs leídos se muestran
  atenuados (histórico dentro de retención).
- Estados: skeleton, vacío por tab, error con reintento. `Fade` al cambiar tab
  (200 ms); respetar `prefers-reduced-motion`.
- Sin grupos visibles, sin quick reply, sin swipe/snooze en F1.

### Item y click-through

- Like (single o grupo): avatar del actor, copy i18n, tiempo; click → `/likes`.
- Match: avatar, copy; click → `/chat?conversation={target_id}` si
  `target_type=chat`; si `profile`, `/profile/{nickname}`.
- Message: avatar/remitente, preview, pill de no leídos; click → doc leído +
  `/chat?conversation={target_id}`.
- System/survey/promo: icono, `content` (autorado), tiempo; click → doc leído +
  `target_url`/`target_id` si existe; survey CARE → `/home?encuesta=1`.
- Legacy (`view`, `reward`, sin target): solo marca leída.
- Todo click cierra el panel antes de navegar.
- El doc se marca leído individualmente antes de navegar (optimista + llamada).
- Testids por item (`notification-item-{id}`) y tipo.

### Badge y sincronía (Layout)

- Badge = `count` de `/notifications/unread-count`; `active = count > 0`.
- Refetch en: montar/autenticar, `new_notification`, `notification_read`,
  `notifications_read_all`, `notifications_bucket_read`, `notifications_sync`,
  `new_message`, `care-preferences-changed`, `visibilitychange`; debounce 500 ms.
- Tras cada refetch/evento, despachar DOM `notifications-sync` para el panel.
- Multi-pestaña: T1 (fan-out) + T3 (eventos).
- Se elimina el fetch local de preferencias CARE en Layout; `survey_pending`
  viene de counts. La burbuja CARE sigue igual y su evento refresca counts.

### Chat deep-link y tab legado (T8)

- `pages/chat/index.tsx` lee `?conversation=` y selecciona la conversación si
  existe; si no, ignora.
- Retirar `components/chat/NotificationsList.tsx` y su polling; el tab usa
  `useNotifications` + item compartido.

### Ajustes (F3)

- T11 (toggles de silencio) se implementa en F3. El backend ya acepta
  `notification_mutes` desde T3 y `visibility_query` los aplica; en F1 no hay UI.

## Smart Photos

- `PhotoMetric.likes: int = 0`.
- `SmartPhotosService.calculate_score`:
  `0.40*match_rate + 0.25*click_rate + 0.15*normalized_view_time + 0.20*like_rate`
  (`like_rate = likes/views`, 0 si views == 0).
- `record_photo_like(user_id, media_id)` upsert; usado por T5.
- Tests de regresión de pesos.

## Testing

Backend (pytest, `backend/tests/`):

- `notification_service`: creación, bump dentro/fuera de 24 h, cap 3,
  superlike sin grupo, match/sistema sin grupo, mute de conversación.
- T3 API: cursor (orden, next_cursor, última página), filtros, `unread=true`,
  counts por bucket + `survey_pending`, `read-bucket` (social/system, 400 para
  messages), retención 30 d, `read`/`read-all` + WS (manager mockeado).
- T5: `shown_media_id` persistido/validado, like sin match notifica, match mutuo
  notifica ambos, foto inválida fallback sin métrica.
- T6: notificación viva (bump preview), conversación muteada, `can_reply=false`.
- Chat sync: abrir mensajes marca el doc `message:{conv}` y emite sincronía.
- Admin: `POST /notifications/system` exige admin, fan-out, important.
- ConnectionManager: T1 ya cubierto.

Frontend (jest/RTL, mocks locales de `next/router` y i18n):

- Panel: tabs y filtros, counts, i18n es/en, visto por bucket una vez, navegación
  y cierre, marca leída optimista, encuesta, empty/error/retry.
- Item: click por tipo, legacy, target nulo.
- Layout: badge desde counts, refetch por WS con debounce, `notifications-sync`,
  `visibilitychange`, sin doble conteo; `care-preferences-changed`.
- Hook: fetch por filtro, `unread`, mark-read/bucket/all, counts.
- i18n: paridad de claves en los 21 locales; fechas con locale activo.
- Chat: deep-link `?conversation=` y tab legado migrado.

Verificación: `venv\Scripts\python.exe -m pytest tests -q` (backend), `npx jest
--ci`, `npx tsc --noEmit`, `npx eslint <archivos>` (frontend).

## Migración y compatibilidad

- Docs legacy sin campos nuevos: defaults tolerantes; `view`/`reward` genéricos
  sin destino.
- El cambio de contrato de `GET /notifications` (array → `{items,next_cursor}`) y
  `unread-count` (campos extra) se absorbe migrando los consumidores del repo
  (panel, tab de chat, Layout). `count` se mantiene para compatibilidad.
- Retención pasa de 48 h a 30 d.
- No hay migración de datos: los docs de likes/matches/mensajes empiezan a
  crearse al wired T5/T6. Los likes pendientes previos siguen visibles en
  `/likes`; no se backfillean docs. Limitación conocida: la pestaña Likes
  muestra actividad nueva (post-wiring); `/likes` sigue siendo la lista completa.
  Si se quiere populate desde el día 1, se puede añadir un backfill idempotente
  de matches/likes de los últimos 30 días como tarea opcional de F1.
- No se tocan los publishes Kafka existentes ni el microservicio de chat.
- F3 añadirá campos de snooze/archivo; no hay cambios de schema en F1.

## Roadmap F2/F3

- **F2:** render de grupos (avatares apilados + “A, B y N más”), prioridad por
  compatibilidad (affinity) dentro de Likes/Todo, paginación visible con
  `next_cursor`, quick reply (T9) y `Intl.ListFormat`.
- **F3:** silencios UI (T11 + promos), posponer (15 min/1 h/2 h/8 h/1 día/
  siempre) con badge/WS suprimidos, swipe archivar (histórico) / borrar,
  animaciones y campos de estado en `Notification`.
