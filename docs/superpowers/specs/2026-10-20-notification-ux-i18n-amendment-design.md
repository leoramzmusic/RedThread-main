# Notificaciones 2.0 — Enmienda UX/UI + i18n (Fase A)

- **Fecha:** 2026-10-20
- **Estado:** aprobada (secciones 1–3 revisadas con el usuario)
- **Enmienda a:** `docs/superpowers/specs/2026-10-19-notification-center-design.md` (spec base) y al plan `docs/superpowers/plans/2026-10-19-notification-center-v2.md` (ambos vinculantes salvo lo que esta spec supersede explícitamente, §7).
- **Contexto de ejecución:** Fase A en curso por SDD. T1 (`de85553`, ConnectionManager multi-conexión) cerrada; T2 (`d5515e7`, modelo+servicio) implementada con review parkeada hasta cerrar esta enmienda.

## 1. Decisiones aprobadas

1. La enmienda se aplica **en curso** (no fase B): se actualiza spec+plan y se reanudan las tareas afectadas.
2. **i18n**: el backend guarda `type` + `metadata` estructurada y NO texto final; el frontend renderiza con claves i18next en los 21 locales. `content` legado queda como fallback.
3. **Archivar/Borrar/Posponer** con persistencia completa en backend: archivadas accesibles en vista propia; borrado soft con purga; posposición con expiración; `Siempre` fija mute del tipo.

## 2. Modelo de datos

`backend/src/models/notification.py` (extiende el modelo existente):

| Campo | Tipo | Reglas |
|---|---|---|
| `user_id` | str | índice compuesto con `created_at` |
| `type` | str | `like \| match \| message \| system \| promo` |
| `content` | str? | solo texto libre/legado/admin; fallback de render |
| `metadata` | dict | esquema abajo; default `{}` |
| `related_user_id` | str? | se refresca en bump |
| `is_read` | bool | default false |
| `created_at` | datetime | default now |
| `updated_at` | datetime | se actualiza en bump |
| `archived_at` | datetime? | null = no archivada |
| `deleted_at` | datetime? | soft-delete; null = visible |
| `snoozed_until` | datetime? | null/≤now = visible |

`metadata`:

- `template`: `like \| match \| message \| system.survey \| system.generic \| promo`. Ausente/desconocido → genérico con `content`.
- `actors`: lista `{id, name, photo}` (snapshot, máx. 3) + `actor_count` (total real).
- `preview`: último mensaje (texto de usuario; no se traduce).
- `conversation_id` (str?), `can_reply` (bool) → mensajes.
- `media_id` (str?) → foto que recibió el like.
- `params` (dict) → p. ej. `{questions_pending: n}` para encuestas.

**Retención**: el cleanup de 48h existente NO purga archivadas (se conservan hasta que el usuario las borre); borradas se purgan con el cleanup; pospuestas reaparecen solas al expirar.

## 3. API `/notifications`

Tabs: `all` (todo) · `likes` (like+match) · `chats` (message) · `system` (system+promo) · `archived` (solo archivadas, sin snooze/deleted).

| Método | Ruta | Efecto |
|---|---|---|
| GET | `/notifications?tab=&cursor=&limit=` | `{items, next_cursor}`; visibilidad §3.1 |
| GET | `/notifications/unread-count` | `{count}`; excluye archivadas, borradas y pospuestas |
| POST | `/{id}/read` · `/read-all` | sin cambio de shape |
| POST | `/{id}/archive` | set `archived_at` |
| POST | `/{id}/unarchive` | limpia `archived_at` |
| DELETE | `/{id}` | soft-delete (`deleted_at`) |
| POST | `/{id}/restore` | limpia `deleted_at` (undo) |
| POST | `/{id}/snooze` `{duration}` | `15m\|1h\|2h\|8h\|1d` → `snoozed_until`; `always` → fija mute del `type` y marca leída (sin ocultarla) |
| POST | `/{id}/unsnooze` | limpia `snoozed_until` (undo) |

**3.1 Visibilidad** (lista y badge): `deleted_at is null` ∧ (`tab=archived` ? `archived_at is not null` : `archived_at is null`) ∧ (`snoozed_until is null or snoozed_until <= now`) ∧ tipo según tab. El badge de no leídas usa la misma visibilidad + `is_read=false`.

**3.2 Eventos WS** (fan-out multi-pestaña sobre T1): `new_notification`, `notification_read`, `notification_archived`, `notification_unarchived`, `notification_deleted`, `notification_restored`, `notification_snoozed`, `notification_unsnoozed`, `notifications_sync` (dispara refetch de badge/lista en otras pestañas).

## 4. i18n

- **Locales (21):** `en es pt fr de it ru sv nl zh hi bn ja ko ar sw ha am tl ms mi`; `defaultLocale=en`, `fallbackLng=en`.
- **Namespace:** claves bajo `common` con prefijo `notifications.*` (`Layout` ya carga `common` globalmente; evita tocar `serverSideTranslations` en 29 páginas). El scanner `i18n:extract` ya emite a `common.json`.
- **Helper de render:** `frontend/src/components/notifications/notificationText.ts`
  - `buildNotificationText(notification, t, locale) → { title, body?, template }`.
  - `formatRelativeTime(iso, locale)` con `Intl.RelativeTimeFormat` (sustituye `date-fns locale: es`).
  - Nombres con `Intl.ListFormat` (`type: "conjunction"`), números con `Intl.NumberFormat`.
  - `normalizeLocale(i18n.language)` → base de los 21; fallback `en`.
  - Exporta `NOTIFICATION_KEYS` (registro único de claves) para el guard de completitud.
- **Plantillas:** `like` individual/agrupada, `match` individual/agrupada, `message` (título remitente + `body=preview`), `system.survey` (plural por `questions_pending`), `system.generic`, `promo`. Legado sin `metadata.template` → `content`; desconocido → genérico.
- **Plurales:** i18next (`_zero/_one/_two/_few/_many/_other` según `Intl.PluralRules` del locale; ar 6 formas, ru 4, etc.). Prohibida la concatenación manual.
- **Autoría:** ~45 claves × 21 `common.json` generadas (AI) preservando claves existentes, con defaultValue en inglés; revisión nativa posterior a cargo del usuario.
- **Guard:** test jest carga los 21 `common.json` y falla si falta una clave de `NOTIFICATION_KEYS` o está vacía.
- **RTL:** texto árabe correcto; la app no tiene infraestructura RTL (sin `stylis-plugin-rtl` ni `dir="rtl"`). Se usan propiedades lógicas (`ms/me`, `insetInline*`) y gestos por inline-start/end, pero el espejado RTL app-wide queda fuera de alcance.
- Nombres y previews de usuario no se traducen; cambio de idioma en caliente re-renderiza el panel.

## 5. UX/UI

**Presentación por dispositivo** (reusa infraestructura existente):

- Desktop ≥1024: `Drawer` derecho flotante 400px, superficie liquid glass (`surface.elevated`, `elevationTokens`, backdrop blur), slide-in 280ms con `motionTokens.easing`.
- Tablet 768–1023: `BottomSheet` existente (drag-to-close), tabs arriba, `maxWidth 640`.
- Móvil <768: mismo `BottomSheet` a pantalla completa (`100dvh`), tabs arriba, swipe-down cierra.

**Panel:** header con título, marcar todo leído, menú `⋯` (Archivadas, Ajustes de notificaciones); tabs `Todo | Likes | Chats | Sistema` con iconos outlined MUI y dot de no leídas; estado vacío por tab; skeletons; scroll infinito por cursor. La tarjeta de encuesta pendiente se conserva arriba en Todo/Sistema. Vista Archivadas oculta tabs y ofrece restaurar/borrar.

**Item** (reescritura):
- Avatar 40px + badge semántico con color de paleta (like `#FF6B6B`, match violeta, mensaje azul, sistema neutro, promo dorado); thumbnail 44px en likes; título máx. 2 líneas (`-webkit-line-clamp`), preview 1–2 líneas; hora relativa con `Intl`.
- No leído: fondo `alpha(primary, 0.07)` + barra inline-start 3px + título 600. Bump: reordena al top + pulso 640ms (`prefers-reduced-motion` lo desactiva).
- Acciones: tap → leer + deep-link (likes→/likes, match→/matches, mensaje→chat, survey→encuesta); hover desktop → botones archivar/posponer/borrar; touch → swipe inline-start archivar / inline-end borrar (umbral 72px) con undo por snackbar 5s; menú `⋯` siempre visible (a11y) con posponer `15m/1h/2h/8h/1d/Siempre`.
- Mensajes: quick reply inline (campo + enviar, optimista). Promos: "Ver más" expande body inline (280ms). Encuesta: botón Responder.

**A11y:** roles `tablist/tab`, `aria-modal`, focus trap, Esc cierra, targets ≥44px, tipografía `rem`, labels i18n, contraste por tokens, propiedades lógicas.

## 6. Arquitectura de componentes

Backend:

- `models/notification.py` — campos §2.
- `services/notification_service.py` — metadata estructurada, bump refresca `related_user_id`, visibilidad §3.1, emisión de eventos §3.2, acciones archive/delete/snooze.
- `api/notifications.py` — endpoints §3 + cursor.
- `api/settings.py` / `models/user_settings.py` — `notification_mutes` (T3 del plan base) y mute desde `snooze?duration=always`.
- `api/discovery.py` (T5) y `api/chat.py` (T6) — emiten `metadata` (media_id/actors; preview/conversation_id/can_reply).

Frontend:

- `components/notifications/NotificationPanel.tsx` (shell/dispositivo) → `NotificationList` → `NotificationItem` (con `NotificationSwipeable`).
- `components/notifications/SnoozeMenu.tsx`, `notificationText.ts` (+ tests).
- `hooks/useNotifications.ts` — items, cursor, tabs, acciones optimistas (archive/delete/snooze + undo), refresh por WS.
- `hooks/notificationSync.ts` + `Layout` — badge cross-pestaña (`notifications_sync`).
- `components/chat/ChatNotificationsTab.tsx` + `utils/chatDeepLink.ts` (T8) — migración del tab legado.
- `components/settings/NotificationsSection.tsx` — toggles/mutes (T11).

## 7. Impacto sobre spec/plan base (supersedes)

- **Supersede:** diseño del panel (lista simple con tabs Todo/Matches/Solicitudes/Sistema), render por `content`, ausencia de gestos/vista archivadas.
- **Enmienda:** T2 (modelo+servicio), T3 (endpoints §3), T7 (hook+panel+item §5), T9 (quick reply + acciones), T11 (mutes, incluido `always`).
- **Añade:** tarea de i18n (21 JSON + helper + guard), tarea de gestos/archivar/posponer/borrar, adaptación por dispositivo.
- **Sin cambios:** T1 (cerrada), T4 (Smart Photos), T8 deep-link (se mantiene), T10 badge sync (evento `notifications_sync`).
- T5/T6 emiten metadata estructurada en lugar de texto formateado.

## 8. Testing

- Backend: pytest de visibilidad, unread-count, archive/unarchive/restore/snooze/unsnooze, metadata+bump, retención de archivadas.
- Frontend: jest/RTL de `notificationText` (en/es/ar/ru/zh con plurales e `Intl`), guard de 21 locales, tabs/filtros del panel, gestos (touch events), menú de posposición, undo, quick reply, deep-link, `prefers-reduced-motion`.
- `npm run typecheck` y `npm run lint` en frontend; suite backend completa antes de commits finales.

## 9. Fuera de alcance

- Espejado RTL app-wide (requiere infraestructura global).
- Push notifications nativas (Fase B).
- Revisión nativa de las traducciones generadas.
- Nuevos temas visuales fuera de los tokens liquid glass existentes.
