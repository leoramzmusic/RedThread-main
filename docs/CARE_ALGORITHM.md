# Algoritmo CARE, módulo Discover y flujos de conexión

> Documento de referencia sobre el motor CARE, el módulo Discover, y los flujos de
> match → chat → amigos → pareja de ReTh (RedThread).
> Basado en el código fuente real (`backend/src/care`, `backend/src/api/discovery.py`,
> `backend/src/api/chat.py`, `frontend/src/pages/discover`) con referencias `archivo:línea`.
>
> **Este documento describe el estado ACTUAL.** El estado deseado (mejoras al
> algoritmo, portal CA, caos ε·Chaos(t), ML) está en
> [`CARE_ROADMAP.md`](./CARE_ROADMAP.md).
>
> Fecha: 2026-09-26 · Estado: vivo (actualizar al refactorizar el algoritmo)

---

## 1. ¿Qué es CARE?

**CARE** es el motor de recomendación de ReTh. Sus siglas se han usado con dos
expansiones en el código (ambas válidas según el contexto):

- `backend/src/care/README.md:3` → **C**ompatibility · **A**ctivity · **R**esponsiveness · **E**quity
- `backend/src/api/discovery_care.py:46` → **C**ompatibility + **A**uthenticity + **R**esponsiveness **E**ngine

### Filosofía

A diferencia de algoritmos que optimizan *engagement* (swipes, tiempo en app), CARE prioriza:

| Prioriza | Sobre |
|---|---|
| Compatibilidad auténtica | Atracción superficial |
| Exposición equilibrada | Concurso de popularidad |
| Seguridad emocional | Métricas de vanidad |
| Diversidad | Burbujas de filtro |

Se implementa en `backend/src/care/` con 5 capas: `models/`, `scoring/`, `ranking/`,
`feedback/`, `experiments/`, `utils/`.

---

## 2. Cómo funciona: pipeline de recomendaciones

El endpoint real usado por el frontend es **`GET /discovery/queue`**
(`backend/src/api/discovery.py`, montado en `/discovery`). El frontend lo llama en
`frontend/src/pages/discover/index.tsx:264-351`.

> ⚠️ Existe un segundo endpoint `GET /discovery/care-recommendations`
> (`backend/src/api/discovery_care.py:32`) que **no está montado** en la app
> principal y no lo consume ningún frontend. El CARE "oficial" en producción es el
> que corre dentro de `/discovery/queue`.

### 2.1 Pasos del pipeline (`discovery.py:236-594`)

1. **Conversión a modelos CARE** — `profile_to_user_profile()` adapta tu `Profile` + `User`
   al modelo `UserProfile` de CARE (`care/adapters.py:13-79`).
2. **Exclusión de ya vistos** — se descartan todos los usuarios con los que ya existe
   un `Match` (like/pass/superlike previo) (`discovery.py:~200-235`).
3. **Filtros de consulta Mongo** (previos al scoring):
   - `profile_visible` y `show_me_in_discovery` activos.
   - **Atracción mutua**: candidato debe estar en tus `attraction_preferences` y,
     a la vez, su `attraction_preferences` debe incluir tu género
     (`discovery.py:241-246`, chequeo `discovery.py:84-93` del endpoint CARE).
   - **Estado de relación**: si tu estado no es single/`prefer_not_to_say`/abierto/
     complicado/divorciado/viudo, solo se muestran perfiles con intenciones
     **no románticas** (amistad, proyectos, gaming, conversación)
     (`discovery.py:249-266`) → *Friend Mode*.
   - Edad, distancia (`$near` con `$maxDistance`), estados/países (solo
     Premium/VIP), idiomas comunes (`discovery.py:349-356`), online-only
     (`last_seen` < 5 min, `discovery.py:364-373`).
   - **Fallback**: si 0 candidatos, se relaja la consulta (solo visibilidad) (`discovery.py:384-400`).
4. **A/B de pesos** — `get_params_for_user()` asigna variante por hash MD5
   determinista (`discovery.py:417-421`).
5. **Ranking CARE** — `rank_candidates()` o `cold_start_recommendations()` si tienes
   < 5 interacciones (`discovery.py:429-440`).
6. **Filtros de seguridad** — `apply_safety_filters()`: anti-repetición (7 días),
   anti-gaming, límite de perfiles "populares" (máx 3 por feed). Los admins los
   bypassean (`discovery.py:443-457`).
7. **Re-orden por diversidad** — `apply_diversity_reranking()` con factor según modo
   (`discovery.py:459-483`).
8. **Filtro de compatibilidad por modo** — umbrales por modo (ver §8.1)
   (`discovery.py:485-535`).
9. **Formato de respuesta** — por cada perfil se genera:
   - `match_reason` = `explain_score()` (narrativa "por qué"),
   - `match_highlights` = `get_match_highlights()` (fragmentos de afinidad),
   - `affinity_breakdown` = `compatibility_breakdown()` ×100 para las barras de la UI,
   - `scenario_label` / `connection_tone` / `context_advice` = contexto geográfico
     (`discovery.py:549-592`).

---

## 3. El score CARE

### 3.1 Fórmula final (`care/ranking/ranker.py:51-82`)

```
score_final = clamp(0, 1,
      0.60 × Compatibility   (compat)
    + 0.30 × Dynamic         (dynamic)
    + 0.10 × HumanAdjustment (human)
)
× 3.0 si el candidato tiene Boost activo (tope 1.0)
```

| Componente | Peso por defecto | Variante A/B `treatment_a` |
|---|---|---|
| compat | 0.60 | 0.50 |
| dynamic | 0.30 | 0.40 |
| human | 0.10 | 0.10 |

- Pesos en `care/models/system_params.py:10-14`.
- Experimento A/B `weight_test_001` 50/50 (`care/experiments/ab_testing.py:118-134`).
- Existe además `DIVERSITY_EXPERIMENT` (buckets 40/40/20 vs 50/30/20).

### 3.2 Bloques de Compatibility (60%) — `care/scoring/compatibility.py:48-118`

| # | Bloque | Peso | Qué mide | Sin datos |
|---|---|---|---|---|
| 1 | **Intereses** (categorizados) | 0.15 | Intereses/estilo de vida compartidos por categoría | **0.0** (penaliza) |
| 2 | **Identidad** (atracción y respeto) | 0.15 | Atracción mutua de género/orientación | **0.0 ⇒ score entero = 0** (corte) |
| 3 | **Metas de Relación** | 0.15 | Intenciones compatibles (serio/casual/abierta) | 0.5 (neutro) |
| 4 | **Personalidad** | 0.10 | Rasgos compartidos + complementariedad | 0.5 |
| 5 | **Neurodiversidad** | 0.10 | Empatía y ritmos compartidos | 1.0 / 0.7 |
| 6 | **Ubicación** (logística) | 0.05 | Viabilidad de verse (≤20km=1.0 … >150km=0.3) | 0.3 |
| 7 | **Idiomas** | 0.05 | Idiomas comunes | **0.5 (placeholder — sin integrar)** |
| 8 | **Profesional/Académico** | 0.05 | Universidad/empresa/cargo comunes | 0.0 |
| 9 | **Himno (mi canción)** | 0.05 | Artista o spotify_id coincidente | 0.5 |
| 10 | **Lenguaje del Amor** | 0.05 (hard-coded) | Pares complementarios (ej. palabras + tacto = 0.75) | 0.5 |
| 11 | **Estilo de Comunicación** | 0.05 (hard-coded) | Texto/video/presencial (texto + mal tipista = 0.5) | 0.5 |
| | **Total** | **1.00** | | |

**Detalles clave:**

- **Bloque Identidad = filtro crítico** (`compatibility.py:613-626`): primero valida
  atracción mutua con `calculate_sexual_identity_compatibility()`; si no hay atracción
  recíproca → `0.0` y el score completo del candidato es 0 (no aparece). Si hay
  atracción, base 0.8 + 0.2 si ambos comparten `gender_category` no-tradicional.
- **Intereses con ponderación por categoría**
  (`calculate_category_aware_score`, `compatibility.py:555-611`): `values_causes` pesa
  3, el resto 2; +1 de bonus por categoría activa con coincidencia; normalización ÷40
  (intereses) o ÷15 (valores). Solo cuenta categorías que **tú** has rellenado.
- **Metas de Relación** (`compatibility.py:277-312`): meta compartida = 1.0;
  serio ↔ "abierta" = 0.75; diversión ↔ diversión = 0.75; `undecided` = 0.5;
  choque drástico (serio vs casual) = 0.2.
- **Personalidad** (`compatibility.py:628-651`): +0.2 por rasgo compartido, +0.3 por
  pares complementarios (introvertido/extrovertido, analítico/creativo, intenso/calma).
- **Contexto sin efecto en el número**: `calculate_location_context()` genera
  tonos/escenarios ("Cerca de ti", "Regional", "Internacional"…) que solo nutren la
  narrativa UI (`compatibility.py:194-237`).

### 3.3 Pesos configurables desde Admin (⚠️ desalineados)

El admin (`/portal-redthread/experiencia/algoritmos`, `admin_algorithms.py`) permite
editar factores `AlgorithmFactor` de tipo `COMPATIBILITY` que
`get_compatibility_weights()` (`compatibility.py:21-45`) lee de Mongo.

Semilla (`backend/scripts/seed_algorithm_factors.py:104-145`):

| Criterio | Peso |
|---|---|
| Intereses Musicales | 25 |
| Metas de Relación | 20 |
| Lenguaje del Amor | 15 |
| Estilo de Comunicación | 15 |
| Valores | 25 |

**Gap conocido**: solo `"Metas de Relación"` coincide con las llaves que usa
`compatibility_score()` (`Intereses`, `Identidad`, `Personalidad`, `Neurodiversidad`,
`Ubicación`, `Idiomas`, `Profesional`, `Himno`). Editar los demás criterios en el
admin **no cambia el score** (cae al default de la llave, `compatibility.py:73-115`).

### 3.4 Dynamic (30%) — `care/scoring/dynamic.py:20-87`

| Sub-señal | Peso | Estado real |
|---|---|---|
| Afinidad de tags (foto+bio) | 0.25 | `photo_tags`/`bio_tags` son `[]` con TODO → ~0 |
| Actividad del candidato | 0.10 | default 0.5 |
| Reciprocidad | 0.15 | default 0.5 (campo sin calcular) |
| Profundidad semántica | 0.15 | default 0.5 (campo sin calcular) |
| Proximidad con decaimiento | 0.20 | sin `user_location` → bonus fijo 0.10 |
| Momentum de recencia | 0.15 | 0.5 si hubo likes recientes, si no 0 |

Sin historial de interacción devuelve **0.5 plano** (`dynamic.py:43-45`).
En la práctica hoy el dynamic aporta ~constante: es el candidato a refinar.

### 3.5 Human Adjustment (10%) — `care/scoring/human_adjustment.py:15-63`

- **Castigo vanidad**: −0.5 si >100 likes recibidos y respuesta < 0.2.
- **Castigo ghosting**: −0.6 si tasa de ghosting > 0.5.
- **Boost diversidad**: +0.3 (<20 likes) o +0.15 (<50 likes).
- **Fairness**: +0.05 fijo.
- Con `popularity_signals` vacías (default), todos los candidatos reciben
  +0.35 ≈ `human ≈ 0.35` constante → otro candidato a refinar con datos reales.

### 3.6 Diversidad y cuotas (`care/ranking/diversity.py`, `system_params.py:17-24`)

- Buckets de popularidad: **40% low_pop / 40% mid_pop / 20% high_pop**.
- Interleaving por cuotas antes de cortar a `limit`.
- En modo `opposites` se ordena ascendente (menor score primero).

### 3.7 Safety guards (`care/experiments/safety_guards.py`)

- `ExposureTracker`: no mostrar el mismo perfil en < 7 días (⚠️ in-memory, se
  pierde al reiniciar).
- `HighPopularityLimiter`: máx **3** perfiles con >100 likes por feed.
- `prevent_metric_gaming`: descarta coleccionistas (>200 likes con respuesta <0.15),
  match rate >0.8 con conversaciones <2, ghosting >0.7.

### 3.8 Cold start (`care/ranking/ranker.py:117-167`)

Usuario con **< 5 interacciones**: filtra por distancia (expande si hay < 20
candidatos cercanos) y rankea con compat + proximidad + diversidad.

---

## 4. Relación con el perfil: qué información usa CARE

`care/adapters.py` mapea tu `Profile` de Mongo a los modelos CARE:

| Bloque CARE | Campos del `Profile` |
|---|---|
| Identidad | `gender`, `gender_category`, `sexual_orientation`, `attraction_preferences`, `orientation_preferences`, `pronouns` |
| Edad / búsqueda | `age`, `age_preference_min/max`, `distance_preference_km` |
| Geografía | `location` (coords, ciudad, estado, país), `search_states/countries`, `excluded_states/countries` |
| Intereses / Valores | `lifestyle_interests`, `interests`, `core_values`, `lifestyle_mode` |
| Metas | `relationship_goals`, `intentions`, `relationship_status` |
| Comunicación | `communication_style`, `love_language`, `languages`, `auto_preferred_languages` |
| Personalidad | `social_style`, `processing_style`, `decision_making` |
| Neurodiversidad / bienestar | `neurodiversity`, `learning_style`, `energy_level`, `health_conditions`, `disability` |
| Profesional | `education_center`, `education_level`, `occupation`, `work_company` |
| Emocional | `mi_himno` (artista/spotify_id), `bio` + `prompts` (análisis narrativo: tono profundo/lúdico/curioso + highlights) |
| Altura | `height_relevant`, `height_preferences`, `height_label` |
| Visibilidad | `profile_visible`, `show_me_in_discovery`, `show_age`, `show_location`, `feeling_curious` |

### 4.1 ¿Por qué es importante completar el perfil?

1. **Filtro de identidad**: sin `attraction_preferences` la atracción se infiere de
   `sexual_orientation` (heterosexual → género distinto; resto → todos)
   (`compatibility.py:416-425`), pero con datos incompletos el backend **relaja**
   `strict_mode` (`discovery.py:426`), lo que muestra perfiles con quienes quizá no
   haya atracción mutua → matches que no encajan.
2. **Bloques que castigan**: intereses vacíos = 0.0 (no 0.5): penaliza directamente.
3. **Perfil incompleto bypasea filtros de calidad**: radio de distancia desactivado
   (`discovery.py:278`), umbral de compatibilidad en modo "Para ti" baja de 10% a 0%
   (`discovery.py:509`) → feed genérico.
4. **UI de refuerzo**: `DiscoveryRefinementCard` se inyecta en la cola y alerta al
   estar completitud < 60% (`discover/index.tsx:193-194, 611-678, 990-999`).
5. **Explicaciones flojas**: `explain_score()` y el popover de
   `CompatibilityMeter` solo pueden mostrar intereses/valores/intenciones
   compartidos si existen; sin datos muestra "Compatibilidad basada en edad,
   ubicación y preferencias básicas" (`CompatibilityMeter.tsx:198-202`).
6. **Peso de onboarding**: `utils/profileScoring.ts` pondera `relationship_goals: 15`,
   etc., para el medidor de completitud.

---

## 5. Módulo Discover — funciones

Página: `frontend/src/pages/discover/index.tsx` (~2130 líneas).

### 5.1 Modos de descubrimiento

`DiscoveryModeSelector.tsx:7` — `type DiscoveryMode = 'suggested' | 'opposites' | 'blind' | 'free' | 'more'`:

| Modo | Label | Comportamiento (backend `discovery.py:485-535`) |
|---|---|---|
| `suggested` | **Para ti** | compat ≥ 10% (≥70% si "alta compatibilidad"; ≥0% si perfil incompleto) |
| `opposites` | **Opuestos** | solo compat **< 40%** (complementos, orden ascendente) |
| `blind` | **A ciegas** | solo compat **≥ 70%** y **fotos ocultas** (`visible_photos=[]`) |
| `free` | **Libre** | 0–100%, máxima diversidad, sin límite de popularidad, relaja atracción estricta |
| `more` | **Más** | selector de categorías (`MoreModeSelection`) antes de cargar la cola |

Además: **modo curioso** (`feeling_curious`, switch en Discover) → relaja edad ±5 y
permite mostrar géneros fuera de tus preferencias con selector `CuriosityGenderSelector`.

### 5.2 Layouts e interacción

- **Layouts** (`InteractionSettingsDialog.tsx:34`): `stack` (default), `sticker_book`,
  `carousel`, `grid`.
- **Modos de interacción** (`:33`): `buttons`, `taps`, `swipes`, `keyboard`.
- Acciones de tarjeta (`ProfileActions.tsx`): **Pass, SuperLike, Like, Undo** (con
  historial), **VIP Message** (stub "Próximamente").

### 5.3 Filtros (dialog en `discover/index.tsx:1677-2095`)

- Rango de edad + regla "media + 7".
- Distancia con mapa; **guardar en perfil** (`handleSaveToProfile`, límites por tier:
  VIP 20 / Premium 10 / free 0 estados).
- País/estado solo Premium/VIP; upsell para free.
- Toggle "alta compatibilidad (>70%)" (solo modo sugerido) y "solo en línea".

### 5.4 Paneles y extras

- **CareNarrativePanel** (izq.): narrativa "CARE interpreta".
- **CompatibilityTechnicalPanel** (der.): barras de `affinity_breakdown`.
- **Boost**: `boostService` (`/boost/status`, `/boost/activate`) → ×3 en ranking.
- **Social Battery** (estado local, default 85) y **TimeOutModal**.
- **Estados vacíos / error**: `DiscoverEmptyState`, toast de error 6 s.
- **Bloqueo de pareja**: con `partner_id` + `in_relationship|married`, Discover se
  deshabilita ("Vínculo Confirmado" → ruta Golth) (`discover/index.tsx:779-799`).

### 5.5 Superficies de.likes/matches

- **Likes page** (`pages/likes/index.tsx`): tabs Recibidos / Enviados / Top Picks
  / Segunda Oportunidad → `/discovery/likes-received`, `/likes-sent`,
  `/top-picks` (affinity ≥ 70), `/second-chance` (gracia de 14 días a un PASS).
- **Matches page**: placeholder ("próximamente").
- **Home**: tira de "matches recientes" → `/chat?user=...` (deep link aún no
  leído por `chat/index.tsx`).

---

## 6. Cómo funciona un match

Endpoint **`POST /discovery/swipe`** (`discovery.py:606-877`), body:
`{ target_user_id, interaction: like|pass|superlike, dwell_time_ms?, is_blind_mode? }`.

### 6.1 Estados del `Match` (`models/match.py`)

```
PENDING (un solo like) → MATCHED (like mutuo) → UNMATCHED / BLOCKED
mode: normal | blind
unlock_state: locked | pending | unlocked   (solo blind)
```

### 6.2 Reglas

1. **Guardas de Friend Mode** (`discovery.py:621-648`): si no estás "soltero/a",
   superlike prohibido y bloquea interacciones con perfiles de intención `ROMANCE`.
2. **Superlike diario**: Free **5**, Premium **10**, VIP ilimitado (`discovery.py:650-675`).
3. **Match = ambos interactions ∈ {LIKE, SUPERLIKE}** (`discovery.py:706-709`); el
   superlike cuenta como like (no hay match instantáneo).
4. **Cuota de matches**: Free **20/3 días**, Premium **50/3 días**, VIP ilimitado;
   al excederse, la interacción se revierte y responde 403 (`discovery.py:711-744`).
5. **Doble PASS** → `UNMATCHED` (eliminación permanente de la fila).
6. **Ciega (blind)**: el match nace `mode=blind`, `unlock_state=locked`.
7. **Respuesta**: `{match_id, is_match, message}` — `is_match=true` solo al haber
   match mutuo. No payload del otro perfil; el frontend dispara su animación
   (`discover/index.tsx:462-464`, 3 s; Likes page → dialog con "Ir al Chat").
8. **Eventos**: Kafka `SWIPES` siempre y `MATCHES_NEW`/`MATCH_CREATED` al emparejar.
9. **Feedback CARE**: `on_user_action()` + `metrics_collector.record_swipe()` por
   swipe (`discovery.py:817-850`) — *los helpers de afinidad de tags son TODOs*.
10. **Des-matching**: `DELETE /discovery/matches/{match_id}` → `UNMATCHED`.

`GET /discovery/matches` devuelve `match_id, user_id, display_name, age, photos, bio,
affinity_score, matched_at` (no expone `mode` ni `unlock_state`).

---

## 7. Cómo empezar a chatear

- **Lista**: `GET /chat/conversations` (`chat.py:211-289`) construida sobre
  documentos `Conversation` unidos a `Relationship`; etiqueta `type`:
  `match` / `friend` / `partner` con `type_label` ("Match"/"Amigo"/"Pareja") y
  color emocional (`flirty` #FF4081, `friendly` #3498DB, `passionate` #E74C3C).
- **Transporte**: WebSocket `ws://…/chat/ws/{user_id}` (`chat.py:55-209`;
  frontend `chat/index.tsx:272`). Acciones: `send_message` (ack `message_sent`,
  push `new_message`), `typing`, `mark_read` (`message_read`).
- **REST**: `POST /chat/send` acepta `conversation_id` (sistema nuevo, requiere
  participante + relación no bloqueada) o `match_id` (legacy, exige `status=MATCHED`).
- **Lectura**: `GET /chat/messages/{conversation_id}` marca en bloque lo leído y
  resetea el contador; fallback legacy con query `?match_id=` (`chat.py:391-470`).
- **Sugerencias**: `GET /chat/suggestions?target_user_id=` (`chat.py:558-590`) →
  base ["Hola! 👋", "¿Cómo va tu día?"] + "¡Vi que también te gusta {interés}!" por
  cada interés común (máx 3). En UI son chips sobre el compositor
  (`chat/index.tsx:638-652`) que envían el texto al hacer clic.
- **Extras UI**: recibo de lectura, emojis, notas de voz (simulación), reportar /
  bloquear / vaciar / exportar chat.

---

## 8. Romper el hielo (Icebreaker)

### 8.1 Backend (`api/icebreaker.py` + `services/icebreaker_service.py`)

- **36 preguntas** hardcodeadas en 3 niveles (Set 1: `q_1–q_12`, Set 2: `q_13–q_24`,
  Set 3: `q_25–q_36`), en español.
- Endpoints: `GET /questions`, `POST /chat/invite` `{match_id, other_user_id,
  question_id}` → `Message(message_type=ICEBREAKER, stage="invite")`,
  `POST /chat/answer` `{message_id, answer}`.
- **Flujo**: invite → ambos responden (respuesta oculta: `stage="answering"`) →
  cuando **ambos** responden → `stage="revealed"` y se muestran las dos respuestas
  juntas (patrón "36 preguntas para enamorarse").

### 8.2 Frontend

- `IcebreakerButton.tsx` en el compositor: menú de 4 (Saludar 👋, Pregunta Rápida,
  Mini Juego, 36 Preguntas). Los dos primeros envían texto plano; "36 Preguntas"
  elige de un mock de 3 y llama `POST /api/icebreaker/chat/invite`.
- `IcebreakerMessage.tsx` renderiza la tarjeta por `stage` (invite/answering/revealed)
  y envía respuestas a `POST /api/icebreaker/chat/answer`.
- `GameSession.tsx` (juegos dentro del chat) y `friends` **Rituales**
  (`POST /friends/ritual/{target_id}`: canción/pregunta/constelación) son la otra vía
  de romper el hielo entre amigos.

---

## 9. Cómo hacerse amigos en ReTh

Modelo `Relationship` (`models/relationship.py`, colección `relationships`):
`type: match|friend|partner`, `status: pending|active|blocked`,
`origin: discover|friend_request|partner_link`, ids normalizados (`user_a < user_b`).
Flujo documentado: `Desconocido → Match → Friend → Partner` (`relationship.py:34-38`).

### Endpoints (`api/friends.py`, prefijo `/friends`)

| Endpoint | Función |
|---|---|
| `POST /friends/request` | Crea `Relationship(FRIEND, PENDING, origin=FRIEND_REQUEST)` |
| `GET /friends/requests/pending` / `/sent` | Bandejas |
| `POST /friends/respond` `{relationship_id, accept}` | Aceptar → `ACTIVE` / Rechazar → borra |
| `GET /friends/list` | Amigos activos |
| `DELETE /friends/{id}` | Eliminar amistad |
| `POST /friends/ritual/{target_id}` | Enviar ritual (requiere amistad `ACTIVE`) |

**Reglas** (`friends.py:53-163`): sin self-requests; **usuarios free solo pueden
agregar amigos en el mismo estado o a ≤ 100 km** (Premium/VIP global); duplicados y
bloqueos rechazados (400/403).

**UI**: `pages/friends/index.tsx` (lista + pendientes), `FriendCard` (aceptar/
rechazar/eliminar/ir al chat), `FriendManager.tsx` para *enviar* solicitud.

---

## 10. Cómo se genera una pareja (relación amorosa de cualquier tipo)

### Flujo (`api/partners.py`, prefijo `/partners`)

1. `POST /partners/request` con `email` o `target_user_id` → valida que ninguno tenga
   `partner_id`, ni solicitudes pendientes → escribe `partner_request_uid` /
   `sent_partner_request_to_uid` en ambos perfiles.
2. `POST /partners/accept` → ambos: `partner_id` mutuo +
   `relationship_status = IN_RELATIONSHIP` (+ limpieza de solicitudes).
3. `POST /partners/reject` / `/cancel` / `DELETE /unlink` → revierten
   (`relationship_status = SINGLE`).
4. UI: `CivilStatusSection` (selector `relationship_status`) +
   `PartnerManager` (búsqueda `GET /users/search`, vincular/desvincular).

### Neutralidad de sexo y sexualidad — por qué aplica a cualquier tipo de relación

- **La solicitud de pareja no filtra por género ni orientación**: se envía por email
  o `user_id` directamente (`partners.py:10-84`); cualquier persona puede vincularse
  con cualquier persona.
- **En el descubrimiento**, la atracción se calcula con `attraction_preferences`
  (qué géneros buscas) sobre un mapeo inclusivo `male/female/non_binary` +
  alias ES/EN (`compatibility.py:396-413`); si no hay preferencias declaradas, el
  fallback usa la orientación: heterosexual → género distinto; **cualquier otra
  orientación (gay, bisexual, pansexual, queer, asexual…) → todos**
  (`compatibility.py:416-425`).
- **Modo curioso** y modo `free` permiten salir deliberadamente de tus preferencias.
- **`PREFER_NOT_TO_SAY`** desactiva la verificación estricta de orientación mutua
  (`discovery.py:239, 426`).
- El **bloque Identidad** además modula el tono narrativo de CARE según orientación/
  categoría (asexual/demisexual → emocional; pansexual/queer → curioso;
  trans-spectrum → inclusivo; no-binario/microlabels → explorador)
  (`compatibility.py:440-489`).
- El **estado de relación** (no el género) es lo que activa Friend Mode y el bloqueo
  de Discover con pareja (`discovery.py:249-266`, `discover/index.tsx:779-799`).

---

## 11. Evaluación: ¿el algoritmo es suficiente para continuar?

### 11.1 Veredicto

| Objetivo | ¿Listo? | Por qué |
|---|---|---|
| **Discover en operación** | ✅ **Sí, con reservas** | El pipeline `/discovery/queue` está completo y conectado (CARE → filtros → seguridad → UI). Funciona con perfiles reales; los gaps afectan calidad, no la operación. |
| **Pruebas de chats** | 🟡 **Código listo — E2E sin verificar** | P0-1/P0-2 están **resueltos en código** (Fase 0) y verificados a dos niveles: **datos** (`backend/scripts/verify_chat_flow.py` contra Mongo real: ciclo `Relationship`+`Conversation`, idempotencia y normalización) y **tests** — ojo con el número: la suite completa son 137 tests, pero **sólo 25 tocan el chat** (`test_chat_resolvers.py` 8, `test_conversation_service.py` 12, `test_dedupe_script.py` 5); los otros 112 son auth, caché, DTOs y scoring de CARE. Los de chat son de función pura y de servicio: **cero cobertura a nivel de ruta o de WS**, que es justo lo que el E2E tiene que cubrir. **El E2E like→match→chat en navegador NO se ejecutó** (R48 — el daemon de Docker no estaba corriendo), luego **el criterio de aceptación de `CARE_ROADMAP.md` §2 sigue sin comprobar**. Runbook manual en §11.6. Quedan P1 (icebreaker, blind) — ver §11.3. |
| **Refinar el algoritmo** | 🔧 **Recomendado antes de escalar** | dynamic/human hoy son casi constantes; los pesos del admin no conectan con el score. |

### 11.2 Bloqueadores para pruebas de chat (P0)

| # | Problema | Evidencia | Arreglo sugerido |
|---|---|---|---|
| P0-1 | `GET /chat/messages/{match_id}` envía el `match_id` como `conversation_id` y sin `?match_id=` → el backend responde **404 "Conversation not found"** (si no existe `Conversation` con ese id) | `chat/index.tsx:332` vs `chat.py:391-470` | ✅ **Resuelto en código (Fase 0, 2026-09-27)** — fallback `resolve_message_source` en backend (`chat_resolvers.py`): el path también sirve de `match_id` legacy. Cubierto por tests; el E2E en navegador sigue pendiente (R48) |
| P0-2 | `GET /chat/conversations` solo devuelve documentos `Conversation`, que **nadie crea en runtime** (solo la migración, y siempre `type=MATCH`); además devuelve `conversation_id` y el frontend espera `match_id` | `chat.py:308-388` (DTO en `:349-372`), `migrate_to_relationships.py:139`, `chat/index.tsx:64-81` | ✅ **Resuelto en código (Fase 0, 2026-09-27)** — `ensure_match_conversation` enganchado en los puntos de transición a `MATCHED` + `ensure_friend_conversation` en `friends.py`; backfill en `scripts/backfill_conversations.py`; frontend migrado a `conversation_id`. Verificado contra Mongo real por `scripts/verify_chat_flow.py`; el E2E en navegador sigue pendiente (R48) |

### 11.3 Bugs conocidos (P1) — afectan features concretas

| # | Problema | Evidencia |
|---|---|---|
| P1-1 | **Desbloqueo blind**: `POST /discovery/matches/{id}/unlock` crashea con consentimiento doble (`MatchStatus.UNLOCKED` no existe) | `discovery.py:962` vs `match.py:14-18` |
| P1-2 | **Criterio de "lo suficiente"** para desbloquear fotos (mensajes/tiempo) no existe; `BlindUnlockButton` nunca se importa | `BlindUnlockButton.tsx` (0 usos), grep sin `min_messages` |
| P1-3 | **Icebreaker**: doble prefijo de URL (`/api/icebreaker/icebreaker/...`) vs rutas que llama el frontend; `Message.icebreaker_data` y `Profile.icebreaker_answers` **no existen** en los modelos → 400/500 en el flujo real | `main.py:187`, `api/icebreaker.py:9`, `models/message.py`, `IcebreakerButton.tsx:50` |
| P1-4 | **Pesos del admin no conectan**: solo "Metas de Relación" coincide de nombre con las llaves del score | `compatibility.py:34-45` vs `73-115` |
| P1-5 | **Enviar solicitud de amistad no tiene UI** (`SocialSection` comentado en `ProfileEdit.tsx:812-829`) | `FriendManager` inalcanzable |
| P1-6 | Deep links `/chat?user=` y `/chat?userId=` ignorados por `chat/index.tsx` | `chat/index.tsx:84` |
| P1-7 | `GET /discovery/care-recommendations` sin montar (código muerto) | `discovery_care.py` sin import |

### 11.4 Refinamientos del algoritmo (P2 — calidad, no bloquean)

> ↳ Cada uno tiene fase asignada en [`CARE_ROADMAP.md`](./CARE_ROADMAP.md)
> (F1 señales · F2 cualitativo · F3 caos · F4 feedback · F5 portal · F6 ML).

1. **Señales dinámicas reales** *(→ Fase 1)*: poblar `photo_tags`/`bio_tags`,
   `activity_score`, `responsiveness_score`, `reciprocity_score`,
   `popularity_signals` y `authenticity_signals` (hoy defaults 0.5/0) para que los
   pesos 0.30 (dynamic) y 0.10 (human) dejen de ser constantes. Es el mayor
   salto de calidad disponible.
2. **Afinidad de tags en feedback** *(→ Fase 1)*: los helpers de `care/feedback/event_handler.py`
   son TODOs → sin ellos no hay aprendizaje por like/pass.
3. **Persistir `ExposureTracker`** (Redis) *(→ Fase 1)* — hoy es memoria del proceso.
4. **Alinear llaves de pesos** del admin con las del score *(→ Fase 0, P1-4)* para
   que la consola de algoritmos realmente opere.
5. **Integrar `calculate_languages_compatibility`** *(→ Fase 1)* (devuelve 0.5 fijo)
   con el campo `languages` ya mapeado en `adapters.py:76`.
6. **`distance_km` en la respuesta** es `None` (`discovery.py:219` de CARE /
   usa `breakdown.proximity_km` en queue) — la UI ya lo muestra vía breakdown.
7. **Métricas A/B**: `p_value: 0.05 # TODO` en `analytics/metrics.py` *(→ Fase 0)* —
   antes de confiar en experimentos, implementar el cálculo real.

### 11.5 Plan sugerido

> ↳ Plan detallado con fases, criterios de aceptación y dependencias:
> [`CARE_ROADMAP.md`](./CARE_ROADMAP.md) §10.

1. ~~**Corto plazo (desbloquea pruebas de chat)**: resolver P0-1 y P0-2 (conversación
   al nacer el match)~~ ✅ hecho en código (Fase 0, 2026-09-27) → **falta** correr la
   prueba E2E like→match→chat en navegador (runbook en §11.6; R48). Verificado hasta
   ahora con `backend/scripts/verify_chat_flow.py` (datos) y 25 tests de chat de 137.
2. **Medio**: P1-3 (icebreaker real) y P1-1/P1-2 (blind) si van incluidos en el
   alcance de la prueba.
3. **Algoritmo**: implementar señales dinámicas (§11.4.1-2 → *Fase 1*) antes de
   tocar pesos — hoy ajustar pesos cambia poco porque dos de los tres componentes
   son casi constantes. Con señales reales, recién tiene sentido calibrar
   0.6/0.3/0.1 (el A/B `weight_test_001` ya está listo para comparar
   0.60/0.30 vs 0.50/0.40).

### 11.6 Runbook: comprobar el chat like → match → E2E (a mano)

> **Por qué existe:** el E2E en navegador **no se ejecutó** en Fase 0 (R48 — el daemon de
> Docker no estaba corriendo). El criterio de aceptación de P0-1 en `CARE_ROADMAP.md` §2 es
> literalmente *"like → match → chat E2E pasa sin 404"*, así que **P0-1 y P0-2 no están
> verificados de punta a punta** aunque el código esté resuelto. Esto es lo que falta.
>
> Es un runbook manual a propósito. Automatizarlo exigiría un harness de navegador que el
> repo no tiene (mismo motivo por el que Task 8 no añadió tests de componente).
> **Los commands se ejecutaron y se verificaron contra el repo** — si alguno falla, el resto del
> runbook sigue siendo válido **salvo el paso 1**: sin match no hay pasos 2-7, así que si el
> paso 1 falla el atajo está en el paso 0B.

**A. Levantar el stack** (4 servicios; puertos de `docker-compose.yml`)

```powershell
docker compose up -d            # mongodb:27017 · redis:6379 · backend:8000 · frontend:3000
docker compose ps               # los 4 deben quedar Up
```

El frontend llama al backend por URL absoluta —`NEXT_PUBLIC_API_URL || http://localhost:8000`
(`frontend/src/services/api.ts:3`)— y **no hay `rewrites` en `next.config.js`**, así que no
hay proxy: si el front no ve al back, es CORS o red. `CORS_ORIGINS` por defecto ya incluye
`http://localhost:3000` y `:3001` (`backend/src/core/config.py:47`).

> **Ojo con el modo de arranque:** el `frontend` del compose hace `npm run build` + `npm start`
> → `next start` (producción, `frontend/Dockerfile:15,21`) y **sólo publica `3000:3000`**. No hay
> ningún comando de este runbook que produzca un origen en `:3001`, así que el paso 7 requiere
> levantar el frontend **fuera** de Docker (`cd frontend; npm run dev`, que sí sirve `:3001`)
> si quieres probarlo. CORS ya lo permite, no hay que cambiar nada.

**B. Preflight de datos — CORRE ANTES del navegador y no necesita el stack**

```powershell
cd backend; $env:PYTHONPATH="."; .\venv\Scripts\python scripts\verify_chat_flow.py
```

Sólo necesita Mongo. Salida esperada: 3 líneas `OK:` y exit 0. Esto prueba el ciclo
`Relationship`+`Conversation` (creación, idempotencia, normalización de ids) pero **no prueba
la API, ni el WS, ni la UI**. Si esto falla, no sigas: el problema está abajo, no en el chat.

**C. Dos usuarios** — `POST http://localhost:8000/auth/register` (`auth.router` se monta en
`prefix="/auth"`, sin prefijo propio: `backend/src/main.py:159` + `auth.py:32`).

```json
{ "username": "e2e_alice", "password": "...", "display_name": "Alice", "age": 30, "gender": "female" }
```

> **Trampa real:** si incluyes `phone`, la respuesta llega con `"requires_verification": true`
> (`auth.py:252-258`) y el alta **no está completa** hasta que pases el OTP por
> `POST /auth/verify-phone` con `{user_id, otp}` — y ese código sólo se imprime en stdout
> (`--- [MOCK SMS] ---`) cuando `settings.DEBUG` es true. **Regístrate sin `phone`** para no
> tener que leer logs: sin teléfono, `is_verified=True` al momento (`auth.py:263`).

Dos navegadores = **dos perfiles o una ventana incógnito**, no dos pestañas: la sesión es por
cookie. **Rutas de UI que sí existen** (las verifiqué; una versión anterior de este runbook
señalaba `/portal-redthread/auth/register` y **ese 404** — `portal-redthread/auth/` sólo tiene
`login.tsx` y `forgot-password.tsx`):

| Para | Ruta |
|---|---|
| Registrarse | `http://localhost:3000/auth?tab=register` — `/auth/register` es un redirect a esta (`pages/auth/register.tsx:7`) y el POST real sale de `RegisterForm.tsx:218` |
| Iniciar sesión | `http://localhost:3000/portal-redthread/auth/login` **o** `http://localhost:3000/auth/login` |
| Chat | `http://localhost:3000/chat` |

**Paso 0B — atajo si el paso 1 falla.** Dos usuarios recién registrados no tienen por qué
aparecer en la cola de discovery del otro (perfil incompleto, preferencias/atracción
incompatibles). Para saltar a `MATCHED` sin depender de la UI:

```powershell
cd backend; $env:PYTHONPATH="."; .\venv\Scripts\python scripts\create_test_match.py
```

Ojo: este script tiene **usuarios hardcodeados** (`maria@redthread.com` y
`admin@testemail.com`) y falla si no existen. Si es tu caso, crea un par con esos correos al
registrar y listo.

**El recorrido, en orden. El paso 3 es el que más información da — no lo saltes**

| # | Paso | Criterio de éxito | Si falla |
|---|---|---|---|
| 1 | Alice da like a Bob; Bob da like a Alice | ambos lados ven el match | discovery, no chat — Fase 0 no lo tocó. Usa el **paso 0B** |
| 2 | `Match.status` pasa a `MATCHED` y hay `Conversation` | `ensure_match_conversation` corrió | **No mires `src/services/*`: está muerto** (F0-13). El gancho vivo está en el router montado, `backend/src/api/discovery.py:753-756` y `:1196-1199`, y cada uno va envuelto en `try/except Exception` que **sólo hace un `print`**: si el gancho falla, no hay error visible, sólo una línea en los logs del contenedor. Ese es el punto ciego |
| 3 | **Al abrir `/chat`, la lista muestra la conversación** | fila con el nombre del otro | **`activeConversationId` queda `null` y todo lo demás pasa desapercibido** (R45: el fetch no se llamaba al montar). Es la comprobación que más discrimina: separa "backend roto" de "frontend roto" |
| 4 | Abrir la conversación y enviar un mensaje | la burbuja sale y el WS la confirma | frame de error sin `temp_id` → burbuja colgada (F0-10, F0-23) |
| 5 | El mensaje aparece en el otro navegador sin recargar | el WS trae `new_message` | revisar paridad de payload (F0-07) |
| 6 | Recargar la página: el historial persiste | los mensajes se leen del backend, no del estado | `/chat/messages/{id}` con `conversation_id` (P0-1) |
| 7 | Enviar desde la UI con el otro navegador en `localhost:3001` | CORS OK | `CORS_ORIGINS` incluye `:3001`; requiere `npm run dev` fuera de Docker (ver §A) |

En el paso 3, el registro en Mongo es la confirmación independiente de que la UI no miente.
Se lee así con un **here-string**, que evita todo el escaping de `$in`:

```powershell
# en backend\, con $env:PYTHONPATH="."
@'
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def m():
    db = AsyncIOMotorClient("mongodb://localhost:27017")["redthread"]
    pair = {"$in": ["<alice_id>", "<bob_id>"]}   # sustituye por los ids reales
    doc = await db.conversations.find_one({"participants": pair},
                                          {"type": 1, "relationship_id": 1, "_id": 0})
    print("conversacion del par:", doc)
    print("total conversations:", await db.conversations.count_documents({}))

asyncio.run(m())
'@ | .\venv\Scripts\python -
```

`None` significa "no hay conversación para ese par" (o que los ids están mal puestos — mira el
`total` para distinguirlos). Con datos reales, `type` debe existir y ser `"match"`, y
`relationship_id` debe apuntar a una `Relationship` de tipo `match`. **Nota:** el mismo par
**puede tener dos conversaciones** —una `match` y otra `friend`— y eso es **por diseño**: el
chat tiene un sub-tab `match`/`friend` que filtra por `Conversation.type`
(`frontend/src/pages/chat/index.tsx:109,413-414`). No lo trates como bug.

**E. Lo que este runbook NO cubre, y por qué sigue en la lista de deudas**

- **P1-3 / icebreaker está roto y lo seguirá durante este runbook.** La ruta viva es
  `/api/icebreaker/icebreaker/chat/invite` y el frontend hace POST a
  `/api/icebreaker/chat/invite` → **404**. No pruebes el flujo de invitación esperando que
  funcione; si lo pruebas, el 404 es el resultado **esperado** (deuda 22).
- **R37 — la UI de bloqueado no funciona en runtime.** `Relationship.status = BLOCKED` no lo
  escribe nadie; un par bloqueado se ve como `matched` y sin banner. No lo uses como criterio
  de éxito (deuda 1).
- Las ramas de exit 1 y 2 del backfill no se ejercitaron (deuda 29).

Al terminar, la respuesta a la pregunta que P0-1 se hace es una de dos: **"pasa sin 404"** →
cambiar el 🟡 por ✅ en `CARE_ROADMAP.md` §2 y en §11.1-11.2 de este doc; o **falla** → el
diagnóstico va en el site donde se rompió, no en una nota.

---

## 12. Tests existentes del algoritmo

`backend/src/care/tests/` — 5 módulos, 13 tests:

| Archivo | Cubre |
|---|---|
| `test_ranking.py` | Buckets de popularidad, cuotas de diversidad, top-scores |
| `test_compatibility.py` | Match perfecto / parcial |
| `test_location_decoupling.py` | La ubicación no contamina el score puro |
| `test_phase2.py` | Tag affinity, vanidad, boost de diversidad, ghosting |
| `test_phase3.md` → `test_phase3.py` | Asignación A/B estable, exposure, high-pop, anti-gaming |

---

## 13. Mapa de archivos

| Área | Archivo |
|---|---|
| Motor CARE | `backend/src/care/{ranking,scoring,experiments,feedback,models,utils}` |
| Cola Discover (backend) | `backend/src/api/discovery.py` |
| Endpoint CARE huérfano | `backend/src/api/discovery_care.py` |
| Swipe / match | `backend/src/api/discovery.py:606-877`, `backend/src/models/match.py` |
| Chat | `backend/src/api/chat.py`, `backend/src/models/{conversation,message}.py` |
| Icebreaker | `backend/src/api/icebreaker.py`, `backend/src/services/icebreaker_service.py` |
| Amigos | `backend/src/api/friends.py`, `backend/src/models/relationship.py` |
| Pareja | `backend/src/api/partners.py`, `Profile.{partner_id, relationship_status}` |
| Admin del algoritmo | `backend/src/api/admin_algorithms.py`, `backend/src/models/algorithm_management.py`, `backend/scripts/seed_algorithm_factors.py` |
| Discover (frontend) | `frontend/src/pages/discover/index.tsx`, `frontend/src/components/discovery/*` |
| Chat (frontend) | `frontend/src/pages/chat/index.tsx`, `frontend/src/components/chat/*` |
| Perfil / onboarding | `frontend/src/components/profile/ProfileEdit.tsx`, `frontend/src/components/profile/edit/sections/*` |
| Completitud | `frontend/src/utils/profileScoring.ts` |
