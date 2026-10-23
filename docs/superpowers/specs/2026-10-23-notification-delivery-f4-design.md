# Spec: Notificaciones F4 — Delivery Layer (DB-first + Web Push + prioridades)

Fecha: 2026-10-23
Estado: diseño aprobado por el usuario (secciones 1–3, chat)
Extiende: `docs/superpowers/specs/2026-10-19-notification-center-design.md` y `docs/superpowers/specs/2026-10-20-notification-ux-i18n-amendment-design.md` (F1–F3)
Fase: F4 — capa de entrega y prioridades

## 1. Gap analysis

La propuesta de arquitectura es correcta y encaja con RETH, pero varios componentes ya existen. No se reconstruye el sistema: se extiende.

| Pieza | Estado actual | Acción F4 |
|---|---|---|
| DB-first | ✅ `Notification` en MongoDB (Beanie); la bandeja lee documentos | Se mantiene y se formaliza |
| In-app center | ✅ F1 (campanita, tabs, counts, click-through) | Se mantiene |
| Realtime | ✅ WS `ConnectionManager` multi-pestaña, `new_notification` | Se añade `silent` para DND |
| Agrupación | ✅ `group_key`, `actor_count`, `actors` (cap 3), bump 24 h | Se añade agrupación de push |
| DND / pausas | ✅ backend; silencia el canal push | Se añade digest lazy y excepción P0 |
| Estados | ⚠️ `is_read`, `archived_at`, `deleted_at`, `snoozed_until`, `pinned_at` | Se añaden `seen_at`, `read_at`, deliveries por canal |
| Prioridad | ❌ no existe | Política central P0–P3 |
| Web Push | ❌ sin `push_subscription`, VAPID ni service worker | Se implementa VAPID + `pywebpush` + SW |
| Resumen DND | ❌ no existe | Digest lazy al volver |
| Backend | ⚠️ la propuesta dice Spring Boot | RETH es **Python + FastAPI + Beanie + MongoDB + Redis** |

## 2. Objetivo

Añadir una capa de entrega multi-canal y multi-dispositivo sobre el sistema existente, con una política central que impida que cualquier feature invente prioridades o rompa DND.

Reglas irrenunciables:

1. Toda notificación vive primero en la base de datos.
2. El push es solo una forma de entrega.
3. La creación de la notificación nunca espera a la entrega.
4. Ningún caller decide `priority` ni `interrupts_dnd`; los calcula la política.
5. DND silencia la entrega, no la persistencia.
6. Al terminar DND se entrega **un** resumen, no N pushes acumulados.
7. Mensajes directos: un push vivo por conversación, actualizado por `tag`.
8. P0 de seguridad/cuenta es visualmente distinguible y no se agrupa ni se silencia.

## 3. Decisiones aprobadas

1. **Web Push:** VAPID + `pywebpush` + service worker, autohospedado. Sin FCM.
2. **Resumen DND:** lazy al volver el usuario; sin scheduler ni worker dedicado.
3. **Estados:** timestamps únicos en `Notification` + `NotificationDelivery` por canal/dispositivo.
4. **Entrega:** colección `NotificationDelivery` separada; no se embebe en `Notification`.
5. **Prioridad:** política central `NotificationEvent → Policy`; `priority` e `interrupts_dnd` persistidos como snapshot.
6. **Versionado:** `policy_version` persistido en `Notification`; `delivered` en `NotificationDelivery` queda como mejora futura.
7. **DND:** solo P0 seguridad/cuenta puede interrumpir; `dnd_digest` tiene `interrupts_dnd=false` inmutable.
8. **Agrupación push:** Redis sorted set + sweeper cada 10 s + `SET NX`; sin Celery/RabbitMQ/Kafka/BullMQ.
9. **Mensajes:** `push_mode=live`, debounce corto por conversación, `tag` estable, `renotify=false` en actualizaciones.
10. **P0 visual:** badge/borde rojo, icono de seguridad, nunca agrupada ni silenciada.
11. **`profile_view`:** `digest_only` por ahora; futura configuración de privacidad para desactivarlo por completo.
12. **Retención/purge:** política explícita documentada en §4.5; implementación lazy, sin cron nuevo en F4.
13. **Extensiones futuras:** `logical_source` y `AdminNotification` quedan documentados en §14.1; no se implementan en F4.

## 4. Modelo de datos

### 4.1 `Notification` (extiende `backend/src/models/notification.py`)

Campos existentes que se conservan: `user_id`, `type`, `content`, `related_user_id`, `is_read`, `created_at`, `updated_at`, `group_key`, `actor_count`, `actors`, `target_type`, `target_id`, `metadata`, `archived_at`, `deleted_at`, `snoozed_until`, `pinned_at`.

Campos nuevos:

| Campo | Tipo | Reglas |
|---|---|---|
| `event_key` | str | clave granular de política; índice con `user_id`/`updated_at` |
| `priority` | str | `P0 \| P1 \| P2 \| P3`; snapshot de política |
| `interrupts_dnd` | bool | snapshot de política; solo P0 seguridad/cuenta = true |
| `silenceable` | bool | snapshot; P0 = false |
| `groupable` | bool | snapshot; P0 = false |
| `policy_version` | int | versión de la política aplicada (inicial: 1) |
| `seen_at` | datetime? | cuando el panel renderiza el item |
| `read_at` | datetime? | cuando se lee/clicka; `is_read` se sincroniza |
| `dedupe_key` | str? | idempotencia (digest, push jobs) |

`type` sigue siendo el bucket de tabs (`social|messages|system`). No se elimina para no romper F1–F3.

Índices nuevos:

- `(user_id, priority, updated_at)`.
- `(user_id, dedupe_key)` unique sparse.
- Se conservan los índices existentes.

### 4.2 `NotificationDelivery` (nuevo `backend/src/models/notification_delivery.py`)

| Campo | Tipo | Reglas |
|---|---|---|
| `notification_id` | str | índice |
| `user_id` | str | índice para métricas/limpieza |
| `subscription_id` | str? | solo push; referencia a `PushSubscription` |
| `channel` | str | `in_app \| ws \| push` |
| `status` | str | `pending \| sent \| failed` (futuro: `delivered`) |
| `sent_at` | datetime? | timestamp de entrega |
| `error` | str? | motivo de fallo |
| `created_at` | datetime | default now |
| `updated_at` | datetime | default now |

Granularidad:

- `in_app`: una fila por notificación; `sent` al persistir y quedar visible en la bandeja.
- `ws`: una fila por sesión conectada; `subscription_id=null`; `sent` al emitir por WS.
- `push`: una fila por suscripción/dispositivo; `pending → sent|failed`.

Índices: `(notification_id, channel)`, `(subscription_id, sent_at)`, `(user_id, created_at)` y único parcial `(notification_id, subscription_id)` cuando `subscription_id` existe (idempotencia por dispositivo). Las deliveries se purgan junto con su notificación (retención 30 días / borrado).

### 4.3 `PushSubscription` (nuevo `backend/src/models/push_subscription.py`)

| Campo | Tipo | Reglas |
|---|---|---|
| `user_id` | str | índice |
| `endpoint` | str | único |
| `p256dh` | str | clave pública del cliente |
| `auth` | str | secreto de autenticación |
| `device_name` | str? | etiqueta legible |
| `user_agent` | str? | auditoría |
| `locale` | str | idioma para render de push (21 locales) |
| `created_at` | datetime | default now |
| `last_seen` | datetime | última entrega/validación |
| `revoked_at` | datetime? | baja lógica |
| `failure_count` | int | default 0 |

`endpoint` único global. Las claves no se devuelven en claro en listados (endpoint enmascarado). El borrado de cuenta elimina suscripciones y deliveries asociados.

### 4.4 Política central (nuevo `backend/src/services/notification_policy.py`)

`NotificationEvent` (enum) y `POLICY` con:

- `priority`
- `interrupts_dnd`
- `silenceable`
- `groupable`
- `push_mode`: `immediate | live | aggregate | digest_only | none`
- `bucket`: `social | messages | system`
- `group_strategy`: `none | rolling_24h | per_conversation | per_target | per_day`
- `aggregate_window_seconds` (solo aggregate/live)
- `template`

`POLICY_VERSION = 1`. `create_notification()` recibe `event_key` y calcula el snapshot; **no acepta** `priority` ni `interrupts_dnd`. Un test debe fallar si algún caller intenta pasarlos.

Legacy: documentos sin `event_key` se mapean por `type`; el backfill asigna `event_key=type`, `priority` según política, `interrupts_dnd=false`, `silenceable=true`, `groupable=true`, `policy_version=1`.

### 4.5 Retención, límites y purge

Política documentada para F4 (implementación lazy en `sync`/primera página; sin cron nuevo):

| Dato | Retención / límite |
|---|---|
| `Notification` general | 30 días |
| `Notification` archivada | Hasta que el usuario la borre |
| `Notification` soft-deleted | Purga con la limpieza lazy |
| `dnd_digest` | 90 días |
| `NotificationDelivery` | 30 días o cascade con su notificación |
| Jobs de agregación en Redis | TTL 24 h |
| `PushSubscription` revocada/inactiva | 90 días |
| Cap por usuario | 1.000 notificaciones; al exceder, se purgan primero las leídas/archivadas más antiguas |

P0 de seguridad/cuenta nunca se purga automáticamente antes de 90 días, aunque esté leída. La limpieza de deliveries y suscripciones es idempotente y no bloquea la bandeja.

## 5. Pipeline

1. Evento de dominio → `create_notification(event_key, ...)`.
2. La política calcula prioridad, flags y estrategia; se persiste `Notification` con snapshot.
3. Se crea `NotificationDelivery(in_app, sent)`.
4. Se emite WS `new_notification`; se crean deliveries `ws` por sesión conectada.
5. Se decide push:
   - `P0`: inmediato; ignora DND, mutes de categoría, snooze y master toggle. Requiere suscripción y permiso del navegador.
   - `P1 live`: debounce por conversación, un push visible por `tag`.
   - `P2 aggregate`: job a 60 s por grupo; un push con el conteo actual.
   - `P3 digest_only`: sin push; solo in-app/digest.
6. Redis `reth:push:due` (sorted set) + sweeper cada 10 s con lock `SET NX`; los jobs se persisten y sobreviven reinicios.
7. `pywebpush` entrega en threadpool; se actualiza `NotificationDelivery`; `404/410` revoca la suscripción.
8. La creación nunca espera a WS/push; los fallos quedan auditados.

## 6. Política de prioridades y entrega (v1)

| `event_key` | Prioridad | `interrupts_dnd` | `silenceable` | `groupable` | `push_mode` | Bucket | Agrupación |
|---|---|---|---|---|---|---|---|
| `login_suspicious` | P0 | ✅ | ❌ | ❌ | immediate | system | none |
| `password_changed` | P0 | ✅ | ❌ | ❌ | immediate | system | none |
| `security_alert` | P0 | ✅ | ❌ | ❌ | immediate | system | none |
| `direct_message` | P1 | ❌ | ✅ | ✅ | live | messages | 1 viva por conversación |
| `match` | P2 | ❌ | ✅ | ✅ | immediate | social | none |
| `comment` | P2 | ❌ | ✅ | ✅ | aggregate (60 s) | social | por target |
| `like` | P3 | ❌ | ✅ | ✅ | aggregate (60 s) | social | por target/foto |
| `profile_view` | P3 | ❌ | ✅ | ✅ | digest_only | social | por día |
| `survey` | P3 | ❌ | ✅ | ❌ | digest_only | system | none |
| `promo` | P3 | ❌ | ✅ | ❌ | digest_only | system | none |
| `system_generic` | P3 | ❌ | ✅ | ❌ | digest_only | system | none |
| `dnd_digest` | P3 | ❌ (inmutable) | ✅ | ❌ | digest_only | system | por ventana |

### 6.1 P0 — reglas especiales

- `priority=P0`, `interrupts_dnd=true`, `silenceable=false`, `groupable=false`.
- No se agrupa, no se silencia por categoría/DND/snooze, no entra en el digest, no se pospone.
- Se fija arriba en el panel (`pinned_at` al crear) y se muestra con badge/borde rojo e icono de seguridad.
- In-app siempre se persiste y muestra. El push P0 requiere permiso del navegador y suscripción activa.
- El master toggle de notificaciones no silencia P0 de seguridad/cuenta.

### 6.2 DND

- DND activo = pausa one-off o regla recurrente ya existente en settings.
- Todo se persiste, cuenta y aparece en el panel.
- Sin push, sonido, vibración ni toast; WS emite `silent: true` para actualizar badge/contador sin interrumpir.
- Solo `interrupts_dnd=true` entrega push.
- Al volver el usuario, `POST /notifications/sync` ejecuta `maybe_emit_dnd_digest()`:
  - Cuenta notificaciones no leídas creadas durante ventanas DND desde el último digest.
  - Crea **una** notificación `dnd_digest` con `metadata={count, since, until}` y `dedupe_key=dnd:{window_end}`.
  - Si pasaron varias ventanas, se colapsan en un solo digest con el rango total.
  - Es in-app; no genera push.

### 6.3 Mensajes directos (`live`)

- `group_key=message:{conversation_id}`; una notificación viva por conversación.
- Push debounce de 3 s por conversación; el payload usa `tag=message:{conversation_id}`.
- El service worker reemplaza la notificación existente; `renotify=false` en actualizaciones.
- El cuerpo muestra el conteo actual: “Ana sent 3 new messages”.
- Sin preview de contenido por defecto (privacidad).

### 6.4 Agregación social

- `like`/`comment`: job a 60 s por `group_key`; el push usa `actor_count`/`actors`.
- `match`: push inmediato por ser evento único.
- Si Redis no está disponible: fallback documentado a push inmediato solo al primer evento del grupo.

## 7. API

Nuevos endpoints:

| Método | Ruta | Efecto |
|---|---|---|
| GET | `/push/public-key` | Devuelve la clave VAPID pública |
| POST | `/push/subscribe` | Alta/upsert de suscripción (endpoint + keys + device/locale) |
| DELETE | `/push/subscribe` | Baja lógica por endpoint |
| GET | `/push/subscriptions` | Lista dispositivos del usuario (endpoint enmascarado) |
| POST | `/push/test` | Solo desarrollo: push de prueba al usuario actual |
| POST | `/notifications/seen` | Batch de ids → `seen_at` |
| POST | `/notifications/sync` | Ejecuta digest DND lazy y devuelve counts |

Notas:

- `POST /push/test` exige `PUSH_TEST_ENABLED=true` y `ENV != production`; auth obligatoria, rate limit y respuesta por suscripción.
- `read/archive/delete/snooze` existentes se mantienen; `read` actualiza `read_at` e `is_read`.
- Auth y rate limit en todos los endpoints de push.
- `/notifications/sync` es idempotente.

## 8. Frontend y service worker

### 8.1 `frontend/public/sw.js`

- `push`: parsea `{title, body, url, tag, renotify, silent, data}`.
- Si hay una pestaña enfocada/visible, `postMessage` al cliente y **no** muestra notificación OS.
- Si no, `showNotification` con `tag` estable.
- `notificationclick`: abre/enfoca `url`, cierra la notificación y marca leído.
- `pushsubscriptionchange`: re-suscribe y actualiza el backend.
- P0: `tag` único, `renotify=true`; mensajes: `tag` por conversación, `renotify=false` en updates.

### 8.2 Cliente

- `frontend/src/utils/push.ts`: registrar SW, pedir permiso solo tras gesto, suscribir con VAPID, sincronizar, desuscribir.
- `NotificationsSection`: toggle de push del navegador, estado de permiso, lista de dispositivos, botón de prueba (solo dev).
- Panel: `seen` con IntersectionObserver, render de digest, prioridad P0, toasts realtime silenciados en DND.
- Logout: revoca la suscripción del dispositivo actual.
- i18n: claves nuevas en los 21 locales; el backend renderiza push desde un catálogo compartido usando `PushSubscription.locale`. La copia in-app sigue en el frontend.

## 9. Presentación visual P0 (design system RETH v3)

- **Badge:** relleno `#E63946`, texto blanco; en oscuro `#FF6B6B` con texto `#1A1B1E` si el contraste lo exige.
- **Borde:** 1.5px `#E63946` (oscuro `#FF6B6B`).
- **Fondo:** `alpha(#E63946, 0.08)` sobre la superficie del panel.
- **Icono:** escudo/seguridad Phosphor, stroke 1.8; decorativo con `aria-hidden`, el texto “Seguridad” da el significado.
- **Jerarquía:** P0 arriba, nunca agrupada; no usa el patrón de “y N más”.
- **A11y:** el estado no depende solo del color; badge con texto/icono, contraste AA, focus visible.
- **Motion:** sin animaciones llamativas; el pulso de bump no aplica a P0.

## 10. Tests

Backend:

- Política: mapeo correcto, `create_notification` rechaza `priority` manual, `policy_version` persistido.
- DND: P0 entrega, resto no; WS `silent`; digest único e idempotente.
- Deliveries: filas por canal/dispositivo, estados `pending/sent/failed`, revocación 404/410.
- Mensajes: debounce, tag por conversación, conteo actualizado.
- Agregación: job único por grupo, sweeper con lock, fallback sin Redis.
- API: auth, rate limit, `/push/test` bloqueado en producción, `/notifications/seen` batch.
- Migración/backfill: documentos legacy conservan comportamiento.

Frontend:

- `utils/push.ts`: permiso, suscripción, desuscripción, `pushsubscriptionchange`.
- SW: push con pestaña enfocada vs background, click-through.
- Panel: seen, digest, P0 visual, DND sin toast.
- i18n: paridad de claves en 21 locales.

## 11. Rollout y migración

- **F4a:** modelo, política, deliveries, estados, `seen` y endpoint `sync` (digest desactivado hasta F4c; sin push).
- **F4b:** VAPID, suscripciones, SW, P0/P1.
- **F4c:** agregación P2/P3, digest DND, métricas.
- Flags: `PUSH_ENABLED` (backend), `NEXT_PUBLIC_PUSH_ENABLED` (frontend), `PUSH_TEST_ENABLED` (solo dev).
- Backfill: `event_key`, `priority`, `interrupts_dnd`, `silenceable`, `groupable`, `policy_version=1`, `read_at` desde `is_read/updated_at`.
- Índices nuevos y colecciones nuevas; sin pérdida de datos.
- Compatibilidad: clientes viejos ignoran campos nuevos; los endpoints existentes no cambian de shape salvo `seen_at/read_at` aditivos.

## 12. Seguridad y privacidad

- Claves VAPID en variables de entorno/secret manager; nunca en logs ni repo.
- Suscripciones y deliveries accesibles solo por el dueño; endpoints enmascarados en listados.
- Payload de push mínimo; sin previews de mensajes por defecto.
- Revocación en logout y en eliminación de cuenta; `404/410` revoca endpoints muertos.
- HTTPS obligatorio (localhost exento); validación de endpoint y rate limit.
- No se registran claves `p256dh`/`auth` en logs.

## 13. Observabilidad

- `NotificationDelivery` es la fuente de auditoría por canal/dispositivo.
- Logs estructurados con `notification_id`, `channel`, `status`, `error`.
- Métricas: pushes enviados/fallidos, suscripciones activas/revocadas, digest generados, jobs de agregación.
- Sin UI de analítica en F4.

## 14. Fuera de alcance

- Push nativo móvil (APNs/FCM) y apps móviles.
- Email/SMS.
- Celery/RabbitMQ/Kafka/BullMQ.
- UI de analítica o composer de push para admin.
- Estado `delivered` en `NotificationDelivery` (mejora futura).
- Configuración de privacidad para desactivar `profile_view` (mejora futura).
- Rediseño del panel más allá de P0/digest/seen.

### 14.1 Extensiones futuras documentadas

- **`logical_source`** en `Notification`: `CARE | CHAT | ADMIN | SECURITY | PROFILE | DISCOVERY | CAMPAIGNS`. No afecta a la entrega; habilita analítica y filtros del portal de administración. Se añadirá como campo opcional cuando exista esa UI.
- **`AdminNotification`**: eventos manuales creados por administradores (promoción, mantenimiento, encuesta global, anuncio institucional, comunicado interno). Reutiliza `Notification`, `NotificationDelivery`, `PushSubscription`, DND, push y digest sin cambiar la arquitectura. Fuera de F4.
- **Estado `delivered`** en `NotificationDelivery`: se añadirá cuando exista confirmación real de entrega del dispositivo; por ahora `pending/sent/failed` es suficiente.
- **Privacidad de `profile_view`**: posibilidad de desactivarlo por completo desde ajustes; hoy queda en `digest_only`.

## 15. Criterios de aceptación

- [ ] Toda notificación se persiste antes de cualquier entrega.
- [ ] Ningún caller puede pasar `priority`/`interrupts_dnd`; la política los calcula.
- [ ] `NotificationDelivery` registra `in_app`, `ws` y `push` por dispositivo.
- [ ] DND no genera más de un digest por retorno y no envía N pushes.
- [ ] P0 se muestra con badge/borde/icono, no se agrupa ni silencia.
- [ ] Mensajes directos generan un push vivo por conversación.
- [ ] Web Push funciona con VAPID, SW y revocación de endpoints muertos.
- [ ] `/push/test` solo existe en desarrollo.
- [ ] Tests backend/frontend verdes; migración/backfill sin pérdida de datos.
- [ ] `npm run lint`, `npm run typecheck`, `npm test` y la suite backend pasan.
