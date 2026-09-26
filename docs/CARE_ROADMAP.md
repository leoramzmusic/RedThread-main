# CARE_ROADMAP — Hoja de ruta del motor CARE

> Documento de **estado deseado** del motor CARE: todo lo nuevo que se implementará
> para mejorar el algoritmo, el portal de administración y su evolución hacia un
> sistema híbrido (algoritmo + caos controlado + aprendizaje adaptativo).
>
> Complementa a [`CARE_ALGORITHM.md`](./CARE_ALGORITHM.md), que documenta el
> **estado actual** con referencias `archivo:línea`. Este documenta el **futuro**.
>
> Fecha: 2026-09-26 · Estado: aprobado (iniciando Fase 0)
> Diagrama visual: `architecture/Vault/Wiki/care_algorithm.canvas`

---

## Índice

1. [Marco conceptual: Dirac para CARE](#1-marco-conceptual-dirac-para-care)
2. [Fase 0 — Prerrequisitos (P0/P1)](#2-fase-0--prerrequisitos-p0p1)
3. [Fase 1 — Señales dinámicas reales](#3-fase-1--señales-dinámicas-reales)
4. [Fase 2 — Cualitativo y narrativo](#4-fase-2--cualitativo-y-narrativo)
5. [Fase 3 — Caos e incertidumbre (ε)](#5-fase-3--caos-e-incertidumbre-ε)
6. [Fase 4 — Feedback loop](#6-fase-4--feedback-loop)
7. [Fase 5 — Portal CARE (red neuronal administrable)](#7-fase-5--portal-care-red-neuronal-administrable)
8. [Fase 6 — Red neuronal ligera (embeddings + MLP)](#8-fase-6--red-neuronal-ligera-embeddings--mlp)
9. [Impacto en Discover, Match y Chat](#9-impacto-en-discover-match-y-chat)
10. [Orden de ejecución y criterios](#10-orden-de-ejecución-y-criterios)

---

## 1. Marco conceptual: Dirac para CARE

La ecuación de Dirac unificó dos teorías aparentemente incompatibles (mecánica
cuántica + relatividad). CARE toma esa **metáfora matemática** como marco rector
para unir lo medible con lo caótico de las relaciones humanas.

### 1.1 Fórmula objetivo

```
CAREScore = α·Compat + β·Auth + γ·Resp + δ·Eng + ε·Chaos(t)
```

| Término | Corresponde a | Hoy (peso actual) | Estado |
|---|---|---|---|
| `α·Compat` | Compatibilidad de perfil (bloques) | 0.60 (`ranker.py:91-95`) | Funcional |
| `β·Auth` | Autenticidad / señales humanas (vanidad, ghosting, fairness) | 0.10 (human) | Casi constante → F1 |
| `γ·Resp` | Responsiveness / actividad / reciprocidad | 0.30 entre dynamic+human | Casi constante → F1 |
| `δ·Eng` | Engagement / momentum / recencia | 0.30 (dynamic) | Casi constante → F1 |
| `ε·Chaos(t)` | Ruido controlado, exploración, incertidumbre | **no existe** | **Nuevo → F3** |

> Nota: la fórmula actual en `care/ranking/ranker.py:51-82` es
> `0.60·compat + 0.30·dynamic + 0.10·human`. El ordenamiento α..ε del roadmap
> reagrupa dynamic en `γ·Resp + δ·Eng` (sus dos sub-señales principales) para
> que cada "espín" del acrónimo sea un knob administrable en el portal (§7).

### 1.2 Principios del marco

- **Unificación**: lo cuantificable (intereses, ubicación, actividad) y lo
  cualitativo (valores, comunicación, caos emocional) conviven en la misma fórmula
  — el cualitativo entra como *etiquetas narrativas + pesos configurables* (§4),
  no como números crudos.
- **Simetría por bloques**: cada componente del acrónimo es un "espín" que
  interactúa con los demás; el portal permite ajustarlos como parámetros de una
  red neuronal.
- **Caos controlado**: `Chaos(t)` introduce variabilidad deliberada (evita
  burbujas de filtro), pero acotada y con semilla determinista (§5).
- **Colapso del estado al observarse**: `ε` **decae** a medida que crece el
  historial de interacciones del candidato — a más datos, score más estable
  (el sistema "colapsa" de incierto a conocido).

---

## 2. Fase 0 — Prerrequisitos (P0/P1)

Bugs y gaps documentados en `CARE_ALGORITHM.md` §11.2-11.3 que deben resolverse
(parcial o totalmente) antes de que las fases siguientes aporten valor.

| # | Problema | Evidencia | Bloquea | Criterio "listo" |
|---|---|---|---|---|
| **P0-1** | `GET /chat/messages/{id}` envía `match_id` como `conversation_id` → 404 | `chat/index.tsx:329` vs `chat.py:292-368` | Feedback loop (F4): sin chat no hay señal que registrar | like → match → chat E2E pasa sin 404 |
| **P0-2** | `GET /chat/conversations` solo lee `Conversation`, que nadie crea en runtime | `chat.py:216-226`, `migrate_to_relationships.py:139` | F4 | `Conversation` se crea al nacer el match (gancho Kafka `MATCH_CREATED`) y al aceptar amistad/pareja; DTO alineado |
| **P1-3** | Icebreaker: doble prefijo `/api/icebreaker/icebreaker/…`, campos inexistentes en modelos | `main.py:187`, `IcebreakerButton.tsx:50` | Narrativas de chat (§9) | Flujo invite→ambos responden→revealed funciona en E2E |
| **P1-4** | Pesos del admin desconectados: solo "Metas de Relación" coincide de nombre con las llaves del score | `compatibility.py:21-45` vs `:73-115`; `seed_algorithm_factors.py:104-145` | **F2 completo** (los pesos configurables dependen de que el admin mande de verdad) | Renombrar criterios sembrados = llaves del score, o mapeo explícito; editar en admin cambia el score |
| **P1-7** | `GET /discovery/care-recommendations` sin montar (código muerto) | `discovery_care.py` sin import | Claridad de arquitectura | Montar o eliminar |
| **P1-métrica** | `p_value: 0.05 # TODO` en métricas A/B | `analytics/metrics.py` | F4 (A/B avanzado) | Cálculo estadístico real (χ² o t-test) |

> **P0-1/P0-2 son gate de Fase 4**; **P1-4 es gate de Fase 2**; el resto son
> mejoras paralelas de bajo riesgo.

---

## 3. Fase 1 — Señales dinámicas reales

**Objetivo**: que los componentes `β`, `γ`, `δ` (hoy ~constantes) dependan de
datos reales. Es el mayor salto de calidad disponible (`CARE_ALGORITHM.md` §11.4.1).

### 3.1 Poblar señales hoy vacías

| Señal | Dónde vive | Hoy | Fuente de datos |
|---|---|---|---|
| `photo_tags` / `bio_tags` | perfil CARE | `[]` con TODO | Análisis de fotos/bio al guardar perfil (etiquetas: estilo, hobbies, tono) |
| `activity_score` | `dynamic.py:20-87` | default 0.5 | `last_seen`, frecuencia de sesión |
| `responsiveness_score` | `dynamic.py` | default 0.5 | Tiempo medio de respuesta en chats previos |
| `reciprocity_score` | `dynamic.py` | default 0.5 (sin calcular) | Likes recibidos vs dados, invites aceptados |
| `popularity_signals` | `human_adjustment.py:15-63` | vacío → `human ≈ 0.35` fijo | Conteo real de likes recibidos / tasa de respuesta |
| `authenticity_signals` | `human_adjustment.py` | default | Verificación, completitud, antigüedad |
| Profundidad semántica | `dynamic.py` | default 0.5 | Longitud/riqueza de bio y prompts |

### 3.2 Completar lo started

- **`care/feedback/event_handler.py`**: los helpers de afinidad de tags son
  TODOs → implementarlos para que los likes/pass aprendan (`CARE_ALGORITHM.md` §11.4.2).
- **`ExposureTracker` en Redis** (`care/experiments/safety_guards.py`): hoy
  in-memory, se pierde al reiniciar → persistir para anti-repetición real (§11.4.3).
- **`calculate_languages_compatibility`**: devuelve 0.5 fijo; integrar el campo
  `languages` ya mapeado en `adapters.py:76` (§11.4.5).

### 3.3 Archivos a tocar

`backend/src/care/scoring/dynamic.py`, `scoring/human_adjustment.py`,
`feedback/event_handler.py`, `experiments/safety_guards.py`,
`adapters.py`, más el pipeline de perfil (`models/profile.py` + jobs de
extracción de tags).

### 3.4 Aceptación

- Un candidato activo con historial obtiene `dynamic` y `human` **distintos** de
  0.5/0.35 en al menos el 80% de los casos (no más constantes).
- Tests: `care/tests/test_phase2.py` extendido con señales pobladas.
- Reiniciar el backend no resetea la exposición (Redis).

---

## 4. Fase 2 — Cualitativo y narrativo

**Objetivo**: integrar lo no cuantificable sin forzarlo a números crudos.
**Gate**: P1-4 resuelto (el admin debe poder pesar de verdad).

### 4.1 Nuevos bloques de compatibilidad

| Bloque | Fuente en el perfil | Forma de entrada al score |
|---|---|---|
| Valores profundos (religión, política, matrimonio, hijos) | `core_values`, `FamilyPlansSelector`, onboarding | Etiquetas + peso configurable |
| Estilo de comunicación / manejo de conflictos | `communication_style`, micro-encuesta "¿Cómo prefieres resolver un conflicto?" | Etiquetas narrativas |
| Expectativas de vida (metas largo plazo, ritmo) | `relationship_goals`, `lifestyle_mode` | Peso configurable |
| Estética y estilo personal (hobbies, música, arte) | `interests`, `mi_himno`, prompts | Ya parcial en "Himno"/"Intereses" → extender |

### 4.2 Mecánica

1. **Etiquetas narrativas**: en vez de solo score, frases generadas por
   `explain_score()` (`care/utils/explainer.py`) y `get_match_highlights()`:
   *"Comparten valores sobre familia, aunque difieren en hobbies."*
2. **Pesos dinámicos personalizados**: cada usuario indica qué le importa más
   (valores > hobbies…); CARE localiza los pesos por usuario antes del global.
   Requiere schema nuevo en `Profile` + UI de preferencias.
3. **Micro-encuestas / prompts de onboarding**: preguntas rápidas → tags que
   afinan compatibilidad (sin requerir que el usuario rellene el perfil entero).
4. **Complementariedad en vez de penalización**: diferencias no suman 0
   automáticamente. Introvertido + extrovertido puede sumar en "balance social"
   (extiende la lógica de pares complementarios de `compatibility.py:628-651`).

### 4.3 Aceptación

- El admin (con P1-4 resuelto) cambia el peso de "Valores" y el score de un
  candidato de prueba cambia mediblemente.
- `affinity_breakdown` en Discover muestra los nuevos bloques.
- Al menos 3 micro-encuestas generan tags que alteran el ranking en tests.

---

## 5. Fase 3 — Caos e incertidumbre (ε)

**Objetivo**: `ε·Chaos(t)` funcional + incertidumbre visible al usuario.
Alcance máximo desde el inicio (decisión de diseño).

### 5.1 Término de caos

```
ε · Chaos(t) ∈ [-ε_max, +ε_max]
Chaos(t) = noise(hash(user_id, candidate_id, t_bucket))
```

- **Semilla determinista**: `hash(user+candidate+bucket_de_tiempo)` →
  reproducible en tests y consistente dentro de una ventana (el mismo usuario
  ve la misma "variación" en la sesión, no parpadea).
- **Acotado**: `ε_max` configurable en el portal (slider), con techo duro para
  no romper filtros críticos (Identidad/atracción mutua **nunca** se altera con
  caos; los umbrales por modo se aplican **después** de sumar ε).
- **Adaptativo**: `ε` efectivo decrece con el historial del candidato:
  `ε_eff = ε · 1/(1 + k·interacciones)` — a más datos, menos ruido (colapso del estado).

### 5.2 Caos como motor de diversidad

- Integrar con `apply_diversity_reranking()` (`discovery.py:459-483`) para
  inyectar perfiles "fuera de patrón" con **frecuencia configurable** en el
  portal (§7.3), en lugar de solo buckets de popularidad.

### 5.3 Incertidumbre en la UI

- La respuesta de `/discovery/queue` incluye `score` y `uncertainty` (σ).
- Discover muestra: **"CARE estima 75% ± 10%"** (incertidumbre por diferencias
  en valores y datos faltantes). σ se deriva de: completitud de datos del
  candidato + magnitud de ε + varianza histórica.
- `CompatibilityMeter.tsx` y `CareNarrativePanel.tsx` muestran el rango.

### 5.4 Aceptación

- Tests deterministas: misma semilla → mismo offset; rango respetado.
- Con `ε=0` el score vuelve exactamente al actual (compatibilidad de regresión).
- Identidad/atracción mutua jamás cruza a "match que no debería existir".
- UI muestra `±` en ≥1 superficie de Discover.

---

## 6. Fase 4 — Feedback loop

**Objetivo**: registrar resultados reales y recalibrar. **Gate**: P0-1/P0-2/P1-métrica.

### 6.1 Pipeline de eventos

Registrar cada interacción con su **resultado**:

```
like → match → chat iniciado → mensajes → amistad → pareja
```

- Eventos existentes: Kafka `SWIPES`, `MATCHES_NEW`/`MATCH_CREATED`
  (`discovery.py:817-850`) → extender con outcomes de chat (`chat.py`),
  `Relationship` (`friends.py`) y `partner_id` (`partners.py`).
- Store de outcomes: colección `care_outcomes` (user_a, user_b, etapa alcanzada,
  timestamps, modo de descubrimiento).

### 6.2 Recalibración semanal

- Job semanal que ajusta `α, β, γ, δ` (y `ε` si aplica) minimizando la
  diferencia entre score predicho y outcome real (ver Fase 6 para la versión MLP).
- Versión mínima (previa al MLP): ajuste proporcional simple sobre tasas de
  éxito por rango de score ("los candidatos 60-70% prosperan más de lo esperado
  → subir su tramo").

### 6.3 Panel de métricas (en el portal CARE, §7)

- Tasa de éxito por **modo**: Para ti, Opuestos, A ciegas, Libre.
- Embudo: matches → chats → amistades → parejas.
- Indicadores de calidad: ghosting, duración de chats, amistades activas.
- Gráficas "matches que prosperaron aunque CARE los marcó incompatibles"
  (o al revés) → alimentan la recalibración y el A/B.

### 6.4 Aceptación

- Un match con chat > N mensajes aparece registrado como outcome.
- El panel muestra el embudo con datos reales (no mock).
- La recalibración propone pesos que un admin puede aceptar/rechazar (nunca
  auto-aplicada sin revisión en esta fase).

---

## 7. Fase 5 — Portal CARE (red neuronal administrable)

**Objetivo**: menú CARE completo en el sidebar del portal de administración.
**Inspiración visual**: diseño "constelación/cerebro" — void negro, acento
violeta, partículas de colores formando una red (ver §7.6).

### 7.1 Estructura del menú

Nuevo bloque **CARE** en `AdminSidebar.tsx` con submenús:

| Submenú | Contenido | Origen |
|---|---|---|
| **Pesos y fórmula** | Sliders para α, β, γ, δ, ε; toggle de término de caos; ver fórmula renderizada | Nuevo (usa `admin_algorithms.py` + `AlgorithmFactor`, con P1-4) |
| **Señales activas** | Qué datos están poblados y cuáles faltan; alertas de campos vacíos que penalizan | Nuevo (inspección de cobertura de `photo_tags`, `activity_score`, etc.) |
| **Caos y diversidad** | Slider de aleatoriedad (ε), frecuencia de perfiles fuera de patrón, techo duro | Nuevo (F3) |
| **Experimentos A/B** | Crear, monitorear, cerrar pruebas (extiende `weight_test_001`, `DIVERSITY_EXPERIMENT`) | `ab_testing.py` + UI nueva |
| **Feedback Loop** | Gráficas de matches exitosos vs fallidos, embudo por modo | F4 |
| **Simulador** | Cargar perfil ficticio → ver cola de Discover en cada modo, incl. efecto del caos | Nuevo |
| **Métricas** | Dashboard (metric cards, diversity, A/B) | **Migrado de `/admin/care-analytics`** (§7.2) |

### 7.2 Migración de `/admin/care-analytics`

Decidido: **moverla al menú CARE**.

1. Mover `frontend/src/pages/admin/care-analytics.tsx` →
   `frontend/src/pages/portal-redthread/experiencia/care/metricas.tsx`
   (conservando su contenido: `MetricCard`s, diversidad, A/B).
2. Añadir `redirects()` en `frontend/next.config.js`:
   `/admin/care-analytics` → `/portal-redthread/experiencia/care/metricas`.
3. Sidebar: eliminar el item `metricas-care` del grupo *Métricas*
   (`AdminSidebar.tsx:215`) — o apuntarlo al nuevo destino — y crear el grupo
   CARE con sus submenús (`AdminSidebar.tsx:194-216` es el patrón a seguir).
4. Verificar que no haya otros enlaces (grep actual: solo sidebar y la propia página).

### 7.3 Panel visual tipo red neuronal

- Canvas con nodos: **Compatibilidad · Autenticidad · Responsiveness ·
  Engagement · Caos**; subnodos = bloques (intereses, valores, personalidad,
  comunicación…).
- Cada nodo muestra **peso actual y contribución al score** del último cálculo.
- Sliders in-place; impacto en tiempo real vía endpoint de simulación (§7.1 Simulador).
- Editor de reglas JSON avanzado para admins técnicos + UI simplificada
  ("solo mostrar si compatibilidad > 70%").

### 7.4 A/B avanzado

- No solo variar pesos: comparar arquitecturas (lineal vs MLP ligera, §8).
- Requiere `p_value` real (P1-métrica).

### 7.5 Persistencia

- Parámetros del sistema (`care/models/system_params.py`) 100% respaldados en
  Mongo y editables; snapshot/rollback de configuración (patrón ya usado en
  `admin menus page`, commit `cbc7716`).

### 7.6 Dirección visual del panel

Referencia de diseño adoptada (estilo "Dala / constelación cerebral"):

| Token | Valor | Uso en el panel CARE |
|---|---|---|
| Void | `#000000` | Fondo del canvas de nodos |
| Electric Iris | `#8052ff` | Accento primario, nodo activo, sliders |
| Saffron Spark | `#ffb829` | Énfasis, término ε/caos, alertas de datos faltantes |
| Deep Verdant | `#15846e` | Feedback loop / señales "pobladas" |
| Bone White / Ash / Silver | `#ffffff` / `#9a9a9a` / `#bdbdbd` | Texto primario / secundario / terciario |

- **Constelación de partículas triangulares** formando la red: visual signature
  del panel (inteligencia distribuida, no jerárquica) — misma metáfora que el
  término de caos: nodos flotando en el void, sin bordes ni cards con sombra.
- Tipografía: jerarquía por escala, no por peso; labels de nodo en 14px
  uppercase. Sin gradientes en componentes; el color va en nodos/links.
- El ADR/estilo de ReTh existente manda en el resto del portal; esta referencia
  se aplica **al panel CARE** (canvas de red neuronal y dashboard).

---

## 8. Fase 6 — Red neuronal ligera (embeddings + MLP)

**Objetivo**: que CARE aprenda de los outcomes (F4) sin perder explicabilidad.
Detalle a concretar en su plan de implementación al llegar (aquí, alcance).

1. **Embeddings de perfiles**: vectores de intereses + valores + estilo
   (embeddings de categorías primero; sentence-embeddings de bio/prompts después).
2. **MLP ligera**: modelo supervisado que predice *"probabilidad de relación
   exitosa"* desde (embeddings, scores CARE, señales dinámicas) → label =
   outcome del embudo (F4).
3. **Auto-refinamiento semanal**: reentrenar/recalibrar con datos de la semana;
   los pesos α..ε pueden ser **inicialización** del modelo o blend
   `λ·MLP + (1-λ)·lineal` (λ configurable).
4. **Explicabilidad obligatoria**: nunca solo el número —
   *"CARE cree que son compatibles porque…"* (features con mayor contribución →
   `explain_score()`).
5. **A/B**: lineal vs MLP como experimento comparado (§7.4).

Depende de: F1 (señales), F4 (labels). Sin ellas no hay dataset.

---

## 9. Impacto en Discover, Match y Chat

| Superficie | Hoy | Con el roadmap |
|---|---|---|
| **Discover** | % de compatibilidad + barras (`affinity_breakdown`) | **Mapa de afinidades/diferencias** (no solo porcentaje); `score ± σ`; perfiles fuera de patrón |
| **Match** | `match_reason` = `explain_score()` | Icebreakers que **exploran diferencias como oportunidad** ("Pregúntale por su estilo de arte favorito") |
| **Chat** | Sugerencias = intereses comunes (`chat.py:558-590`) | Temas neutrales que descubren **valores y estilos de comunicación**; narrativa emocional |
| **Relaciones** | CARE decide umbral | CARE da **punto de partida humano y contextual**: no decide si funcionará |

Prerrequisito de calidad de chat: **P1-3** (icebreaker real) para que los
icebreakers contextuals existan.

---

## 10. Orden de ejecución y criterios

### 10.1 Secuencia

```
Fase 0 (P0/P1) ──┬──> Fase 1 (señales) ──> Fase 2 (cualitativo) ──> Fase 3 (ε)
                  │         │                        │
                  │         └──> Fase 4 (feedback) <─┘ (gate P0-1/P0-2)
                  │                    │
                  └──> Fase 5 (portal) <┘ (F5.2 métricas requiere F4)
                                 │
                                 └──> Fase 6 (MLP)  [requiere F1 + F4]
```

- **Paralelizable**: Fase 5 (estructura del menú + migración `care-analytics`)
  puede arrancar en paralelo a Fase 1 — solo depende de P1-4 para los sliders
  de pesos.
- Fase 3 (ε) es independiente de F2 y puede avanzar con Fase 1.

### 10.2 Criterios globales de "listo"

| Fase | Listo cuando… |
|---|---|
| 0 | P0-1, P0-2, P1-4 cerrados con tests E2E |
| 1 | dynamic/human dejan de ser constantes (≥80% de candidatos varía) |
| 2 | Admin cambia peso → score cambia; narrativas visibles en Discover |
| 3 | `ε=0` ⇒ regresión exacta; UI muestra `±`; semilla determinista testeada |
| 4 | Embudo real en panel; recalibración propone pesos revisables |
| 5 | Menú CARE completo; `/admin/care-analytics` redirige; sliders operativos |
| 6 | MLP ≥ lineal en A/B sobre outcomes reales + narrativa explicable |

### 10.3 Alineación con MASTER_BACKLOG.md

| Item | Relación |
|---|---|
| `BE-005` CARE Engine Phase 2 | Cobertura: Fases 1, 4, 6 |
| `AD-009` Algorithm management UI | Cobertura: Fase 5 (Pesos, A/B, Simulador) |
| `AD-015` Analytics deep-dive | Cobertura: Fase 5 (Métricas) + Fase 4 |
| `TEST-008` CARE engine tests | Cobertura: tests de todas las fases (§3.4, §5.4…) |

### 10.4 Documentación viva

- `CARE_ALGORITHM.md` = estado actual → actualizar al cerrar cada fase.
- Este `CARE_ROADMAP.md` = estado deseado → actualizar al cambiar alcances.
- Diagrama: `architecture/Vault/Wiki/care_algorithm.canvas` (+ `care_neural_portal.canvas`).
