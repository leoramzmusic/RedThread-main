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
  resetea el contador; fallback legacy con query `?match_id=` (`chat.py:292-368`).
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
| **Pruebas de chats** | ❇️ **No del todo — 2 bloqueadores** | La carga de historial y la lista de conversaciones no encajan frontend↔backend (ver P0-1/P0-2). El envío por WebSocket sí funciona. |
| **Refinar el algoritmo** | 🔧 **Recomendado antes de escalar** | dynamic/human hoy son casi constantes; los pesos del admin no conectan con el score. |

### 11.2 Bloqueadores para pruebas de chat (P0)

| # | Problema | Evidencia | Arreglo sugerido |
|---|---|---|---|
| P0-1 | `GET /chat/messages/{match_id}` envía el `match_id` como `conversation_id` y sin `?match_id=` → el backend responde **404 "Conversation not found"** (si no existe `Conversation` con ese id) | `chat/index.tsx:329` vs `chat.py:292-368` | Frontend: `GET /chat/messages/{id}?match_id={id}` **o** backend: fallback con el path como `match_id` |
| P0-2 | `GET /chat/conversations` solo devuelve documentos `Conversation`, que **nadie crea en runtime** (solo la migración, y siempre `type=MATCH`); además devuelve `conversation_id` y el frontend espera `match_id` | `chat.py:216-226`, `migrate_to_relationships.py:139`, `chat/index.tsx:64-81` | Crear `Conversation` al confirmar match (Kafka `MATCH_CREATED` es el gancho natural) y al aceptar amistad/pareja (`friends.py:291` tiene el TODO); alinear llaves del DTO |

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

1. **Corto plazo (desbloquea pruebas de chat)**: resolver P0-1 y P0-2 (conversación
   al nacer el match) → recién ahí correr la prueba E2E like→match→chat *(Fase 0)*.
2. **Medio**: P1-3 (icebreaker real) y P1-1/P1-2 (blind) si van incluidos en el
   alcance de la prueba.
3. **Algoritmo**: implementar señales dinámicas (§11.4.1-2 → *Fase 1*) antes de
   tocar pesos — hoy ajustar pesos cambia poco porque dos de los tres componentes
   son casi constantes. Con señales reales, recién tiene sentido calibrar
   0.6/0.3/0.1 (el A/B `weight_test_001` ya está listo para comparar
   0.60/0.30 vs 0.50/0.40).

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
