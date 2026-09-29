# CARE Fase 0 — Follow-ups

> **Origen:** deuda aceptada explícitamente durante
> [`2026-09-26-care-fase0-chat-blockers.md`](./superpowers/plans/2026-09-26-care-fase0-chat-blockers.md)
> (ese plan está **untracked por diseño**: este archivo es su destino commiteado, y por eso
> existe). Deudas detectadas en las revisiones de Tasks 1-9, 2026-09-27.
> **Owner:** developer único (sin asignar). Ninguna se arregla en Fase 0.
> **Estado de Fase 0:** P0-1 y P0-2 resueltos **en código**; E2E en navegador **pendiente**
> (ver `CARE_ALGORITHM.md` §11.6).

## Prioridad 1 — bloquean, o hacen que el proyecto mienta sobre su propio estado

| ID | Deuda | Por qué P1 | Fix recomendado |
|---|---|---|---|
| **F0-27** | **El E2E like→match→chat no se ejecutó** (R48) | El criterio de aceptación literal de P0-1 en `CARE_ROADMAP.md` §2 sigue sin comprobar, así que **P0-1/P0-2 no están verificados de punta a punta aunque el código esté resuelto**. Es lo único que separa "resuelto en código" de "funciona". | Correr el runbook de `CARE_ALGORITHM.md` §11.6 con el stack levantado. Al pasar, cambiar el 🟡 por ✅ en `CARE_ROADMAP.md` §2 y en `CARE_ALGORITHM.md` §11.1-11.2. |
| **F0-01** | **`Relationship.status = BLOCKED` / `blocked_by` no los escribe nadie** (R37) — **la UI de bloqueado no funciona en runtime.** Los 4 usos de `RelationshipStatus.BLOCKED` en `backend/src` son lecturas (`chat.py:102,367,499`, `friends.py:141`); el único writer es `moderation.py:66-68`, que escribe **sólo `Match`**. El DTO de `/conversations` y el REST `/send` leen `Relationship`, así que un par bloqueado por el camino real se reporta `status: "matched"`, `blocked_by: null` → la fila no se atenúa y el banner nunca se pinta, **aunque el WS sí rechace el envío**. | Es una capacidad de producto que la UI anuncia y el runtime no tiene. El WS de Task 5 ya chequea las **dos** fuentes por esto mismo. | Extender la fuente dual al DTO y al REST. No releer: reutilizar el chequeo existente. |
| **F0-22** | **`IcebreakerButton` roto por doble prefijo, y nunca funcionó** — `icebreaker.py:9` declara `APIRouter(prefix="/icebreaker")` y `main.py:187` lo monta en `prefix="/api/icebreaker"`, así que la ruta viva es **`/api/icebreaker/icebreaker/chat/invite`**, mientras `IcebreakerButton.tsx:50` hace POST a `/api/icebreaker/chat/invite` → 404. Sin `redirect_slashes`, sin `rewrites` en `next.config.js` y sin reescritura en `security_middleware.py`. | Es un 404 en producción y **el 404 no dice por qué**: el cuerpo ni siquiera se evalúa. Además, si se arregla sólo la ruta, `icebreaker.py:51-63` escribiría `Message(match_id=<conversation_id>)` sin check de participantes ni incremento de unread → documento huérfano invisible a `GET /chat/messages/{id}`. | **Fix completo, no parcial:** corregir el montaje del router, migrar `Message` a `conversation_id` y renombrar el prop `matchId`. Arreglar sólo la URL deja el bug de datos. |
| **F0-09** | **La ruta WS no está autenticada — agujero de suplantación.** `@router.websocket("/ws/{user_id}")` (`chat.py:56-57`) toma el `user_id` de la URL sin token, y el gate de participante (`chat.py:96`) compara contra **ese mismo id de la URL**, así que declararse la víctima lo satisface. `SecurityMiddleware` es `BaseHTTPMiddleware` (`security_middleware.py:12`) y **nunca ve el scope WS**. Cualquiera puede abrir `/ws/{victim_id}` y enviar como la víctima. | No es "corrección": es una frontera de autorización ausente, y el gate que parece cubrirla compara el atacante consigo mismo. Un lector que triage por estos tiers lo colgaría por debajo de items de corrección. | Autenticar el handshake y **no** seguir usando el id de la URL como identidad. |
| **F0-23** | **El `onmessage` del chat no maneja frames `{"error": ...}`** (`chat.py:88,97,116,186,190` los emiten; `index.tsx:281-307` sólo cubre `new_message`/`message_sent`/`message_read`) | Si el otro usuario te bloquea con tu página abierta, el envío se rechaza con `"Conversation is blocked"` y **la burbuja optimista queda en `isSending: true` para siempre**, sin feedback. Es el caso de uso de F0-10, vista desde el cliente. | **Se arreglan juntos** con F0-10. |
| **F0-10** | **Frames de error del WS sin `temp_id`** → una burbuja optimista nunca matchea su error y queda colgada. El `"Either conversation_id or match_id must be provided"` de Task 5 es el primer caso. | El usuario ve una UI colgada sin explicación, y el caso de F0-23 es precisamente un rechazo de envío. | Añadir `temp_id` a los frames de error. |

## Prioridad 2 — corrección, robustez y contrato

| ID | Deuda | Fix |
|---|---|---|
| **F0-02** | **Dos vocabularios de estado en el mismo dict** — `relationship_status` emite `"active"\|"pending"\|"blocked"` y `status` emite `"matched"\|"blocked"` para la misma relación, sin comentario que declare el mapeo; el tipo del frontend no declara `relationship_status` → el compilador no lo ve. | Comentario que declare el mapeo, o eliminar `status` cuando el cliente deje de leer `relationship_status`. |
| **F0-24** | **El cliente nunca refresca la lista al abrir una conversación** — `GET /chat/messages/{id}` resetea el unread en el servidor (`chat.py:432`) pero la UI no vuelve a pedir `/chat/conversations` → el badge de la conversación abierta queda obsoleto indefinidamente. | Refrescar la lista tras `get_messages`. Es hermano de R45 (el fetch al montar), que **sí** se corrigió; este no. |
| **F0-07** | **`new_message` del WS no está en paridad de payload con el REST** — el WS construye el dict a mano con 6 claves (`chat.py:144-154`), el REST manda `message.dict()`. Faltan 5 campos **y el hueco no es benigno**: `get_messages` filtra por `deleted_by_sender` / `deleted_by_receiver` en el servidor (`chat.py:419-420`), así que un mensaje borrado en suave que llega por WS **no tiene equivalente en el cliente que lo esconda** — aparece como si existiera. También faltan `receiver_id`, `original_language`, `translations`, `edited_at`, `is_deleted`, `deleted_at`. | `message.dict()`. El filtro de borrado en suave deja de ser una garantía. |
| **F0-08** | **El WS no tiene `except Exception`** — sólo captura `WebSocketDisconnect`, así que un id o un `content` malformados **cierran la conexión**. Afecta a las ramas nueva y legacy por igual; el REST devuelve 500/422. | `except Exception` con log. |
| **F0-11** | **Dos fuentes de bloqueo indistinguibles en el log** — `Relationship` y `Match` emiten el mismo `"Conversation is blocked"` y no hay log en ningún camino de error, así que no se puede confirmar que el bloqueo por `Match` (el que el REST no ve) está disparando. | Log con la fuente explícita. |
| **F0-18** | **`get_conversations` devuelve dicts sueltos sin `response_model`** → el contrato de la respuesta no se impone y una key mal escrita llega al cliente como `undefined` sin que nada lo detecte. | Declarar `response_model`. |
| **F0-19** | **El 400 por `DuplicateKeyError` no loguea nada** — un cliente que pierde la carrera no deja rastro servidor. Y el `print` del gancho de amistad (`friends.py:302`) no incluye el `relationship.id`, así que un operador tiene que correlacionar por timestamp. | Loguear el id. Consecuencia de la restricción verbatim del brief de Task 7. |
| **F0-20** | **El handler de `DuplicateKeyError` mapea *cualquier* duplicate a "already pending"** — hoy exacto (`relationship.py:81` es el único índice único del modelo), pero se vuelve mentiroso en silencio si algún día se añade otro índice único a `Relationship`. | Inspeccionar `exc.details["keyPattern"]`. |
| **F0-17** | **`Conversation.get(<id no-ObjectId>)` → 500** en vez de 400/404. | Validar el id antes. |
| **F0-16** | **`friends.py` mapea *cualquier* `DuplicateKeyError` a "Friend request already pending"** — `friends.py:160-164` lo captura y devuelve 400 con ese detalle. Hoy es exacto, pero un índice único distinto (p. ej. el de `user_a_id+user_b_id+type` de `Relationship`) produciría el **mismo** mensaje para una causa distinta. | Inspeccionar `exc.details["keyPattern"]` — mismo fix que F0-20. |
| **F0-21** | **Una carrera sobre un relationship BLOCKED devolvería 400 en vez del 403 secuencial** — mismo estado, dos códigos según haya carrera. Inalcanzable hoy por F0-01, pero es la misma raíz. | Se cierra con F0-01 + F0-20. |
| **F0-14** | **`merge_conversation_groups` no es re-run-safe** — `unread_count` se guarda antes de borrar los perdedores; un crash en esa ventana duplica el conteo. | Reordenar o hacer la operación atómica. |
| **F0-12** | **Los *finds* y los *counts* del backfill no están aislados** — el procesamiento por documento **ya** lo está (`backfill_conversations.py:40-44,52-56` envuelven cada documento en `try/except Exception`); lo que no lo está es el cuerpo entero (`:66-69`), que agarra los finds, los counts y los borrados. Un find o un count que falla aborta el lote → exit 2 **después** de escrituras ya confirmadas, y un documento malformado re-falla en cada corrida. El re-run es seguro, pero no se sabe si faltaba trabajo por hacer. | Aislar los finds/counts del cuerpo (patrón `async for` + `try` por batch), para que exit 2 signifique "nada escrito" y no "escrito a medias". |
| **F0-13** | **La capa `src/services/*` está muerta** (8/8 `main.py` importan `src.db.utils.connection`, que no existe) — si alguien la resucita necesita los ganchos de Task 2, y el `except Exception` del gancho lo degradaría a no-op silencioso. | Borrarla, o arreglarla **con** el gancho, nunca sin él. |

## Prioridad 3 — cosmético, latente o de bajo impacto

| ID | Deuda | Fix |
|---|---|---|
| **F0-03** | **`clear_chat` no resetea `unread_count`** — `get_messages` sí lo hace. Tras limpiar, la lista puede mostrar un badge sobre un chat vacío. Plan-mandado, se auto-cura al abrir, sin pérdida de datos. | Resetear en `clear_chat`. |
| **F0-04** | **`status` se computa desde `Relationship.status`, que tiene 3 valores, y colapsa dos** — `chat.py:367` lo deriva de `Relationship.status` (enum de 3 en `relationship.py:18-20`), así que **una relación `PENDING` se reporta como `"matched"`**. El tipo del frontend es de 3 valores (`index.tsx:74`) y hoy sólo se compara con `'blocked'`, así que no explota — pero el nombre `status` sugiere el vocabulario de `MatchStatus` (4 valores, `match.py:15-18`), que este campo **nunca lee**. | Alinear el vocabulario, o renombrar para que no prometa un conjunto de estados que no emite. |
| **F0-05** | **El 404 de `/clear/{id}` dice `"Match not found"`** en un endpoint que sirve dos sistemas; el hermano `get_messages` responde `"Conversation not found"` para el mismo fallo. Plan-mandado. | Un mensaje que nombre lo que se buscó. |
| **F0-06** | **Push de usuario offline sin deep-link** — `chat_consumer.py:88` reemite `match_id`, que en modo conversación llega `null`. Preexistente: el REST ya publica sin `match_id`. | Deep-link o quitar el campo. |
| **F0-15** | **`raise HTTPException(404, "Conversation not found")` inalcanzable** en `get_messages`, con un mensaje engañoso: el fallo real es "Match not found". **Se mantiene a propósito** (borrarlo abriría el riesgo de que una futura tercera fuente devuelva `None` en vez de un 404). | Convertir el chequeo en un `else` exhaustivo para que la invariante sea visible. |
| **F0-25** | **El fallback legacy del `new_message` es inalcanzable en la práctica** — todo `activeConversationId` procede de `/chat/conversations` (`chat.py:350`), luego siempre es un id de Conversation y nunca igualará a un `match_id` legacy. El `??` cumple la regla de "un solo lugar" y es inofensivo, pero **no aporta compatibilidad real**. | Mapear match→conversation del lado receptor, o retirar el fallback. |
| **F0-26** | **`subscription_tier` es un campo muerto en la lista de chat** — `GET /chat/conversations` (`chat.py:349-372`) nunca lo ha emitido en ningún commit → `tier` es siempre `undefined` y `PlanAvatar` nunca pinta insignia. Preexistente, opcional en el tipo, sin delta. | Emitirlo o quitarlo del tipo. |
| **F0-28** | **Correr `verify_chat_flow.py` muta el esquema de índices de la dev database** — `init_beanie` construye los índices solo (8 en `relationships`, 5 en `conversations`, 6 en `matches`). **No existe ninguna función `ensure_indexes()` en el codebase.** El script borra los *documentos* que crea, no los índices, y no debe hacerlo: son parte del modelo. | Nada que arreglar. Documentado para que nadie los limpie a ciegas. |
| **F0-29** | **Las ramas de exit 1 y 2 del backfill no se ejercitaron** — la DB relevante estaba vacía, así que sólo se probó la rama de BD vacía. | Sembrar un `match` MATCHED y un documento legacy malformado para cubrirlas. |

## Notas de método (lecciones de Fase 0, no deuda de código)

Estas no son tickets: son las trampas de proceso que produjeron 8 afirmaciones falsas
verificadas en revisión durante Fase 0. Se conservan porque el patrón se repetirá.

1. **Verificar una cadena entera, no sus extremos.** Comprobé el prefijo de montaje y el
   decorador de una ruta, saltándome la declaración del router → concluí que no había doble
   prefijo cuando sí lo había (`CARE_ALGORITHM.md` §11.3 P1-3 ya decía la verdad desde antes).
2. **No afirmar el comportamiento de una función sin comprobar que existe.** Escribí que un
   script "no verifica el índice único porque no llama `ensure_indexes()`" — esa función no
   existe en el repo; `init_beanie` construye los índices solo.
3. **Un control negativo que sólo degrada el test es un test del test.** Romper la aserción
   prueba que la aserción lee el valor correcto; no prueba nada sobre el cleanup, que va por
   otro camino. El negativo que encuentra fugas es el que **rompe el invariante bajo prueba**.
4. **Las rutas de fallo son donde vive lo que un test sólo-verde no toca.** Los 2 Critical de
   `verify_chat_flow.py` (sin `try/finally`; cleanup keyed en la misma invariante que las
   aserciones) estaban los dos en rutas de error y ninguno se vio ejecutando el script en verde.
5. **Un hallazgo de revisión no es un bug.** El revisor señaló "dos conversaciones para el mismo
par"; es el diseño (sub-tab `match`/`friend`). La segunda mitad de una revisión es refutar
sus hallazgos, igual que la primera es aceptarlos.

---

## F0-30 (P1) — Cold Start UX en Discover: onboarding progresivo sin bloquear

**Problema:** usuarios nuevos ven tarjetas de completitud antes que perfiles, rompiendo inmediatez.

**Flujo objetivo (ver discusión):**
1. **Bienvenida** (tarjeta 0): "¡Bienvenido a ReTh! Comienza conociendo nuevos perfiles"
2. **Primeros 2–3 swipes** → perfiles reales inmediatos
3. **Tarjeta "Una cosa antes de empezar"** (atracción/intenciones) con narrativa: *"Completa esto para mejorar recomendaciones. Mientras tanto, aquí tienes perfiles sugeridos"*
4. **Intercalado progresivo**: tras 5–7 swipes → tarjeta completitud (intereses, idioma, etc.) + narrativa + **Skip funcional** (forza recomendaciones aunque perfil incompleto)
5. **Gamificación**: contador *"Tus recomendaciones mejorarán al completar más datos (2/5 pasos)"*
5. **Cold start balanceado**: `discovery.py` fallback → siempre ≥3 perfiles visibles (semilla: usuarios activos + diversidad básica)

**Fix backend (`discovery.py:384-400`):**
- Fallback cold start → siempre ≥3 perfiles (semilla: activos + diversidad)
- Parámetro `skip_completion_card` en `/discovery/queue` → fuerza recomendaciones
- Límite: tarjetas de completitud intercaladas cada 5–7 swipes, nunca cola vacía

**Frontend (Discover queue):**
- Interleaving: welcome → 2–3 perfiles → completion card (skip) → perfiles → completion card cada 5–7
- Skip funcional: `skip_completion_card=true` en request → fuerza recomendaciones
- Narrativa en tarjeta: *"Completa esto para mejorar recomendaciones. Mientras tanto, aquí tienes perfiles sugeridos"*
- Gamificación: contador *"Tus recomendaciones mejorarán al completar más datos (X/5 pasos)"*

**Prioridad:** P1 (impacto directo en onboarding / retención día 1)
**Owner:** unassigned
---

## F0-31 (P2) — Historial de interacciones (`interactions_history`) para memoria de CARE

**Contexto (decisión de diseño):** la UI muestra solo likes de día/semana/mes (ventana de 30 días
en `likes-received`/`likes-sent`), pero CARE necesita memoria larga (6–12 meses) para no
recomendar perfiles ya interactuados sin contexto, y para mostrar avisos como
*"Ya interactuaste con este perfil en el pasado"*.

**Estado actual (ya cumple parte de la estrategia, sin código nuevo):**
- `Match` **no se borra nunca** (salvo "Eliminar like" explícito) → guarda like/pass/superlike
  de forma permanente con `created_at`, `interaction_updated_at`, `status`.
- Discover excluye de la cola a todo usuario con doc en `matches` → memoria ya activa.
- `ProfileVisit` guarda visitas; colecciones de chat guardan mensajes.
- **No hay** esquema unificado, campo `context` ni `status` (activo/archivado/revertido).

**Diseño propuesto (cuando se implemente):**
Colección `interactions_history`:
- `interaction_id`, `actor_id`, `target_id`
- `type`: like | dislike | visit | superlike | message
- `created_at`, `context` (ej. "desde Discover", "desde Likes enviados")
- `status`: activo | archivado | revertido

**Fases:**
1. Escribir eventos desde swipe, visits/record y chat (append-only, sin tocar la cola de Discover).
2. Migración/backfill desde `matches` + `profile_visits`.
3. CARE consulta historial → indicador "Ya interactuaste…" en reapariciones y desempate.
4. Archivado: docs >30 días → solo lectura (no borrar; la memoria emocional es el valor).

**Prioridad:** P2 (CARE ya tiene memoria vía `matches`; esto es consolidación y trazabilidad)
**Owner:** unassigned
