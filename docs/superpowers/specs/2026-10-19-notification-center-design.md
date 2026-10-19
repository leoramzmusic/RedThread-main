# Notificaciones 2.0 (Campanita) — Design

Fecha: 2026-10-19
Estado: aprobado por el usuario (diseño sección a sección)
Iniciativa: "Sistema unificado de notificaciones + mensajería flotante configurable".
Este spec cubre la **Fase A — Notificaciones 2.0**. La Fase B (chat flotante
configurable: panel estilo LinkedIn + burbujas estilo Messenger) se diseña en su
propio ciclo y solo se referencia aquí como frontera.

## Objetivo

Llevar la campanita global a un comportamiento tipo Facebook/LinkedIn:
notificaciones sociales (likes y matches), de mensajes y de sistema (encuestas,
actualizaciones, promos) con click-through al destino, agrupación inteligente de
likes por foto, quick reply de mensajes sin salir del panel, contador/badge
confiable, estado de leídas sincronizado entre pestañas y silenciamiento por
tipo configurable.

## Estado actual relevante

- `Notification` (backend/src/models/notification.py) tiene: `user_id`, `type`,
  `content`, `related_user_id`, `is_read`, `created_at`. No tiene destino
  (imposible click-through), ni agrupación, ni metadata.
- `backend/src/api/notifications.py`: lista (auto-borra >48h en cada fetch),
  `unread-count`, `read`, `read-all`. Filtro por `type`; sin paginación.
- La creación de notificaciones es casi inexistente: solo
  `backend/src/api/admin_verificaciones.py` crea documentos; likes/matches/
  mensajes no generan nada. El consumer Kafka de notificaciones es un stub para
  likes y no alimenta la bandeja.
- Frontend: campanita en `frontend/src/components/layout/Layout.tsx` (badge +
  drawer con `NotificationPanel`), WebSocket de usuario en el propio Layout que
  ya escucha `new_notification` y `new_message`. Panel con tabs
  Todo/Matches/Solicitudes/Sistema, sin click-through, sin quick reply, sin
  paginación. `NotificationsList` (components/chat) es un duplicado legado con
  polling de 60s usado en el tab de notificaciones de `pages/chat/index.tsx`.
- Chat (backend montado: `backend/src/api/chat.py`; el directorio
  `src/services/chat/` es un microservicio standalone que NO se usa en este
  despliegue): WS `/chat/ws/{user_id}` y REST `GET /chat/conversations`,
  `GET /chat/messages/{conversation_id}`, `POST /chat/send`
  (`{conversation_id, content}`). El `ConnectionManager` (`api/chat.py:31`)
  guarda UN solo socket por usuario: el segundo `connect` pisa al primero
  (las pestañas extra dejan de recibir pushes). Conversaciones con
  `unread_count`, `is_muted_by`, `is_archived_by`.
- Ajustes: `frontend/src/hooks/useSettings.ts` persiste vía `GET/PUT
  /settings/me`; `NotificationsSection` ya expone master, frecuencias por
  categoría, No Molestar y offline.
- Smart Photos: `backend/src/services/smart_photos.py` reordena fotos con
  `PhotoMetric` (views/clicks/matches/view_time) por usuario+foto.
- Encuestas CARE: `CarePreferenceSurveyBubble` montado en
  `pages/home/index.tsx:1423`, se abre con `?encuesta=1` (deep-link existente).
- Likes recibidos: `pages/likes/index.tsx` (ruta `/likes`). Perfiles:
  `pages/profile/[nickname]/index.tsx` (ruta `/profile/{nickname}`).

## Decisiones aprobadas (2026-10-19)

1. **Descomposición**: A (Notificaciones 2.0) primero y completa; luego B (chat
   flotante). Quick reply pertenece a A.
2. **Nexo like↔foto (opción b)**: el cliente envía `shown_media_id` (foto del
   carrusel visible al dar like); se guarda en el match y alimenta la métrica
   de esa foto.
3. **Retención (opción b)**: 30 días con paginación por cursor.
4. **Alcance (opción a)**: like (con foto), match, mensaje + tipo sistema con
   emisor admin mínimo. Fuera: vistas de perfil y promos automatizadas.
5. **Agrupación (opción a)**: grupo rodante con bump (ventana 24h por grupo);
   mensajes = una notificación viva por conversación; matches y sistema nunca
   agrupan. Superlikes no agrupan (grupo singular propio).
6. **Silencio (opción a)**: filtro al mostrar — el documento se crea igual, pero
   el bucket silenciado se oculta de la lista y del badge y no dispara push WS.
   Verificación/seguridad (`metadata.important`) no es silenciable.
7. **Enfoques técnicos**: (1a) creación directa en la fuente del evento vía
   `notification_service` (Kafka queda como canal paralelo, nunca bloquea la
   bandeja); (2a) documento-grupo materializado con bump atómico.

## Alcance

Entra:

- Modelo `Notification` extendido + índices + retención 30 días.
- API paginada por cursor, `unread-count` consciente de silencios, emisor admin
  `POST /notifications/system`, WS de sincronía de leídas.
- Pipeline de creación en las fuentes: swipe/like (con `shown_media_id`),
  match, envío de mensajes (WS y REST), sistema (admin).
- Agrupación por foto con bump 24h, notificación viva de mensajes, cap de 3
  actores almacenados.
- Smart Photos: contador `likes` en `PhotoMetric` + componente `like_rate` en
  el score.
- Frontend: panel con tabs nuevos, paginación, grupos, click-through, quick
  reply, sincronía multi-pestaña, deep-link `?conversation=` en el chat,
  migración del tab legado del chat, toggles de silencio en ajustes.
- `ConnectionManager` multi-conexión por usuario (fan-out a todas las
  pestañas, poda de sockets muertos) — base de la sincronía multi-pestaña.
- Tests backend (pytest) y frontend (jest/RTL) de todo lo anterior.

No entra (frontera explícita):

- Fase B completa (panel flotante, burbujas).
- El microservicio standalone `backend/src/services/chat/` (no se toca; el
  contrato vivo es `api/chat.py`).
- Vistas de perfil ("X vio tu perfil").
- Promos automatizadas (solo emisor admin manual).
- Like a nivel foto (el like sigue siendo del perfil; solo se atribuye la foto
  mostrada).
- Push nativo / email.
- Filtro por foto en la página de likes (el grupo de likes abre `/likes`).

## Arquitectura

Flujo de creación (1a):

```
evento (swipe/match/mensaje/admin)
  -> notification_service.emit_*()   [backend/src/services/notification_service.py]
     -> decide tipo, grupo, destino, silencios
     -> crea o actualiza (bump) el documento Notification
     -> push WS al receptor: {"action": "new_notification", ...}
  -> Kafka: los publishes existentes se mantienen (futuro email/push),
     la bandeja no depende de ellos
```

Lectura (2a):

```
GET /notifications (cursor) -> documentos-grupo ya materializados
  -> frontend pinta actores + "y N más" directo, sin agregación
```

## Modelo de datos

`Notification` (beanie Document, colección `notifications`):

```python
class Notification(Document):
    user_id: str                      # receptor
    type: str                         # 'like'|'match'|'message'|'system'|'promo'|'survey'
    content: str                      # texto base (singles); grupos se pintan con actors
    related_user_id: Optional[str]    # actor principal (compat)
    is_read: bool = False
    created_at: datetime
    updated_at: datetime              # bump = último movimiento; orden de la lista
    group_key: Optional[str]          # 'like:photo:{media_id}' | 'like:profile' | 'message:{conversation_id}'
    actor_count: int = 1              # total de actores (o mensajes en grupos de mensaje)
    actors: List[dict] = []           # [{user_id, name, photo, nickname}] cap 3
    target_type: Optional[str]        # 'profile'|'likes'|'chat'|'url' (legacy: None)
    target_id: Optional[str]          # user_id | media_id | conversation_id | ruta
    metadata: Optional[dict] = None   # {preview, superlike, important, can_reply, ...}
```

Reglas:

- Tolerancia a documentos legacy: campos nuevos con default; tipos legacy
  (`view`, `reward`) se renderizan con icono genérico y sin destino (click solo
  marca leída).
- `updated_at` reemplaza a `created_at` como campo de orden lista/badge; en la
  creación son iguales.
- Índices: `(user_id, updated_at desc)`, `(user_id, is_read)`,
  `(user_id, group_key, updated_at desc)`.
- Retención: cleanup lazy al pedir la **primera** página (sin cursor):
  borrar `user_id == actual AND updated_at < now - 30d`. Sin cron.

`PhotoMetric` gana `likes: int = 0` (se toca en la sección Smart Photos).

## API

Router existente `backend/src/api/notifications.py` salvo el emisor admin.

### GET /notifications

Query: `cursor?: str`, `limit?: int = 20 (máx 50)`, `filter?: 'all'|'social'|'messages'|'system'`.

- Cursor opaco `"{updated_at ISO}|{id}"`; orden `updated_at desc, id desc`.
- Filtro: `social` = [like, match]; `messages` = [message]; `system` = [system,
  survey, promo].
- Silencios del usuario aplicados siempre (cualquier filtro).
- Respuesta: `{ "items": [...], "next_cursor": str|null }`.
- Item: `{ id, type, content, is_read, created_at, updated_at, actor_count,
  actors, target_type, target_id, metadata }` + `user: {name, photo, nickname}`
  cuando `actor_count == 1` (enriquecido; nickname necesario para
  `/profile/{nickname}`).
- **Cambio de contrato**: antes devolvía un array plano y sin paginar. Los dos
  consumidores en repo (panel nuevo y tab del chat) se migran en A.

### GET /notifications/unread-count

- Cuenta documentos no leídos del usuario, excluyendo buckets silenciados.
- Master (`notifications_enabled=false`): devuelve `0` salvo `metadata.important`
  (que siempre cuenta).
- No Molestar (DND) activo: no afecta el badge (solo suprime push WS).

### POST /notifications/{id}/read · POST /notifications/read-all

- Comportamiento actual + push WS al propio usuario:
  `{"action": "notification_read", "id": ...}` y
  `{"action": "notifications_read_all"}` — así las demás pestañas del mismo
  usuario sincronizan.

### POST /notifications/system (nuevo, admin-only)

Body:

```json
{
  "audience": {"all": true} | {"user_ids": ["..."]},
  "type": "system" | "promo" | "survey",
  "content": "texto visible",
  "target_url": "/home?encuesta=1",
  "metadata": {"important": false}
}
```

- Guard: misma dependencia de autenticación admin que usan los routers
  `backend/src/api/admin_*.py`.
- Fan-out en chunks (una inserción por usuario; sistema nunca agrupa).
- `target_url` presente -> `target_type='url'`, `target_id=target_url`.
- `metadata.important=true` -> no silenciable ni con master off.
- Encuestas: `type='survey'`, `target_url='/home?encuesta=1'` (deep-link
  existente del bubble CARE).

## Pipeline de creación

Nuevo módulo `backend/src/services/notification_service.py` con:

- `emit_like_notification(liker_id, recipient_id, shown_media_id)`.
- `emit_match_notification(user_a, user_b, conversation_id|None)` (dos docs, uno
  por usuario).
- `emit_message_notification(sender_id, recipient_id, conversation, preview, can_reply)`.
- `emit_system_notifications(...)` (usado por el endpoint admin; o el endpoint
  lo implementa directo con el service).
- Helper interno `_emit_or_bump(...)` con la regla de agrupación.

Regla única de agrupación (`_emit_or_bump`):

1. Si `group_key` es None -> crear doc nuevo.
2. Buscar el doc más reciente del usuario con igual `group_key` y
   `updated_at > now - 24h`.
3. Si existe: `$inc actor_count`, push del actor a `actors` solo si
   `len(actors) < 3`, `$set` de `updated_at=now`, `is_read=false`,
   `content`/`metadata` con el último evento. Bump = sube al tope y vuelve a
   no-leída.
4. Si no existe: crear doc con `created_at=updated_at=now`, `actor_count=1`,
   `actors=[actor]`.
5. Carrera teórica (dos eventos simultáneos creando el mismo grupo): aceptada;
   no se usa índice único.

### Like (POST /discovery/swipe, backend/src/api/discovery.py:771)

- Request gana `shown_media_id: Optional[str]`.
- Al registrar LIKE/SUPERLIKE:
  - Se persiste `shown_media_id` en el match (campo nuevo
    `shown_media_id` / `shown_media_id_1|2` según quién dio like).
  - Si deriva en match mutuo: `emit_match_notification` para ambos
    (target `chat` con la conversación asegurada por el flujo existente de
    match; fallback `profile`).
  - Si no: `emit_like_notification` al receptor.
    - Regular: `group_key = like:photo:{shown_media_id}` si el media existe y
      pertenece al receptor; fallback `like:profile`. Target: singulares ->
      `profile`/liker (el frontend navega con `user.nickname`); grupos ->
      `likes` (página `/likes`).
    - Superlike: sin `group_key` (nunca agrupa), `metadata.superlike=true`,
      content distinto ("Te envió un Super Like").
- Métrica: si `shown_media_id` válido y del receptor -> `PhotoMetric.likes += 1`
  (upsert por `user_id+media_id`).

### Mensaje (WS `websocket_endpoint` + REST `POST /chat/send`, ambos en `api/chat.py`)

- Helper común `notify_new_message(...)` llamado desde ambos paths.
- Reglas: no notificar al propio emisor; si la conversación está muteada por el
  receptor (`is_muted_by`) no se crea nada.
- `group_key = message:{conversation_id}`; bump con la misma ventana 24h
  (aunque el doc esté leído: vuelve a no-leída con preview nuevo).
  `actor_count` = mensajes acumulados en la viva; `actors=[sender]`.
- `metadata`: `{preview: primeros 80 chars, conversation_id, can_reply}`.
  `can_reply=false` si la conversación está bloqueada/unmatched (el quick reply
  se oculta en el frontend).
- Target: `chat` / `conversation_id`.

### Push WS

- Tras crear/bump: `manager.send_personal_message(user_id, {"action":
  "new_notification", "notification": {...}})`, salvo que el bucket esté
  silenciado o DND activo (en esos casos el doc existe y el badge cuenta; si es
  `important`, se empuja igual).
- El fan-out a todas las pestañas del usuario requiere el `ConnectionManager`
  multi-conexión (entra en A; ver Alcance).

## Smart Photos

- `PhotoMetric` (backend/src/models/photo_metric.py) gana `likes: int = 0`.
- `SmartPhotosService.calculate_score` (backend/src/services/smart_photos.py)
  pasa a 4 componentes con pesos renormalizados:
  `score = 0.40*match_rate + 0.25*click_rate + 0.15*normalized_view_time +
  0.20*like_rate`, donde `like_rate = likes/views` (0 si `views == 0`).
  Constantes al tope del módulo (tunables) y docstring actualizado.
- El peso es deliberado y cubierto por tests; no cambia el resto del algoritmo.

## Frontend

### Panel (components/notifications/NotificationPanel.tsx)

- Tabs: Todo / Social / Mensajes / Sistema (param `filter`
  `all|social|messages|system`).
- Paginación: botón "Cargar más" mientras haya `next_cursor`; append sin
  duplicados.
- Fetch vía hook compartido nuevo `frontend/src/hooks/useNotifications.ts`
  (lista paginada, mark-read, mark-all, quick reply, unread-count) usado por el
  panel y por el tab del chat.
- Estados: loading, vacío por tab, error con reintento.

### Item (components/notifications/NotificationItem.tsx)

- Iconos por tipo: like (corazón), match, message, system, survey, promo.
- Grupos (`actor_count > 1`): hasta 3 avatares apilados + texto "A, B y N más
  reaccionaron" (se construye de `actors` + `actor_count`); los singulares
  siguen mostrando avatar + `content`.
- No leídas en negrita/fondo; timestamp relativo en español (date-fns, patrón
  existente).
- Click: marca leída y navega según `target_type`:

| target_type | Navegación |
|---|---|
| `profile` | `/profile/{user.nickname}` |
| `likes` | `/likes` |
| `chat` | `/chat?conversation={target_id}` |
| `url` | `router.push(target_id)` |
| `null` (legacy) | solo marca leída |

### Quick reply (mensajes)

- En items `type=message` con `metadata.can_reply=true`: botón "Responder" que
  expande un `TextField` + botón enviar.
- Envío: `POST /chat/send` con `{conversation_id, content}` — contrato
  confirmado en `backend/src/api/chat.py:580` (`message_type` default `text`).
- Al enviar con éxito: limpiar, colapsar, marcar leída, snackbar de confirmación
  y refrescar badge. Error -> snackbar de error sin perder el texto.
- `can_reply=false` o conversación bloqueada: sin quick reply (solo
  click-through al chat).

### Badge y sincronía (Layout.tsx)

- Badge sigue leyendo `/notifications/unread-count`.
- Escuchar además `notification_read` (decrementar/refetch) y
  `notifications_read_all` (badge a 0) para sincronía multi-pestaña (depende
  del `ConnectionManager` multi-conexión); si el panel está abierto, refrescar
  su lista con el mismo estado.
- Refetch del badge al recuperar foco (`visibilitychange`), como red de
  seguridad sobre el WS.

### Chat deep-link (pages/chat/index.tsx)

- Leer `router.query.conversation` al cargar conversaciones y seleccionar esa
  conversación si existe en la lista (si no, ignorar silenciosamente).

### Tab de notificaciones del chat

- Retirar `components/chat/NotificationsList.tsx` y su polling de 60s; el tab
  usa `useNotifications` + `NotificationItem` compartidos.

### Ajustes (components/settings/NotificationsSection.tsx)

- Bloque nuevo "Silenciar": switches Sociales / Mensajes / Sistema y
  sub-switch Promos, persistidos en `settings.notification_mutes` =
  `{social, messages, system, promos}` (booleanos, `true` = silenciado,
  default `false`) vía el `onSettingsChange`/`useSettings` existente
  (`PUT /settings/me`).
- Copy: "Las notificaciones silenciadas se ocultan de la campanita y del
  contador".
- El backend extiende el modelo de settings que sirve `/settings/me` para
  aceptar y devolver `notification_mutes` (y lo lee el filtrado de lista/badge).
- Seguridad/verificación no aparece aquí: es forzada (`important`).

## Testing

Backend (pytest, `backend/tests/`, mongomock-motor):

- `notification_service`: creación simple, bump dentro/fuera de ventana 24h,
  cap de actores en 3 + `actor_count`, superlike sin agrupar, matches/sistema
  sin agrupar.
- Swipe: `shown_media_id` persistido y usado; like sin match notifica; match
  mutuo notifica ambos lados; foto inválida -> fallback `like:profile` sin
  métrica.
- Mensajes: notificación viva (bump con preview nuevo), conversación muteada no
  notifica, `can_reply=false` en bloqueadas.
- API: paginación por cursor (orden, `next_cursor`, última página), filtros por
  bucket, silencios en lista y `unread-count`, master off y `important`,
  retención 30d, `read`/`read-all` + eventos WS (manager mockeado).
- Admin: `POST /notifications/system` exige admin, fan-out por chunks,
  `important`.
- `ConnectionManager`: fan-out a múltiples sockets del mismo usuario, poda de
  sockets muertos, `is_online` sigue funcionando con la estructura nueva.
- Smart Photos: incremento de `likes`, score con `like_rate`, umbrales viejos
  cubiertos (no regresión).

Frontend (jest/RTL, patrón de la casa: mocks locales de `next/router` y
apiClient):

- Panel: tabs y `filter` correctos, load-more con cursor, render de grupo ("y N
  más"), estados vacío/error.
- Item: navegación por cada `target_type` (router mockeado), legacy sin target,
  mark-read al click.
- Quick reply: expandir, enviar (llama `POST /chat/send` con payload correcto),
  éxito limpia y marca leída, error conserva texto, oculto si `can_reply=false`.
- Layout/badge: `new_notification` refresca contador, `notification_read` y
  `notifications_read_all` sincronizan.
- Settings: switches de silencio renderizan y persisten
  `notification_mutes`.
- Chat: `?conversation=` selecciona la conversación existente y ignora ids
  inexistentes.

## Migración y compatibilidad

- Docs legacy sin campos nuevos: defaults tolerantes (lectura y render).
- El cambio de contrato de `GET /notifications` se absorbe en A migrando los dos
  consumidores en repo; no hay consumidores externos conocidos.
- Los `publishes` Kafka existentes de chat/matches se mantienen intactos.
- No se toca la colección `photo_metrics` más allá del campo `likes` (default 0
  para docs existentes).
