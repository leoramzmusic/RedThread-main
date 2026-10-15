# Spec: Motor CARE — fórmula canónica versionada (matriz M / estética Dirac)

Fecha: 2026-10-15
Estado: aprobado por el usuario (secciones 1–6, diseño completo)

## Objetivo

Actualizar el admin "Motor CARE & Compatibilidad" para reflejar la lógica
nueva del backend: fórmula canónica de 7 dimensiones que suma 100% exacto,
Responsiveness con decaimiento, caos controlado ±X%, umbrales configurables,
versionado con changelog obligatorio y rollback, e integración con CARE
Interpreter. La metáfora de Dirac es el marco **visual/narrativo** del módulo
equation (Ψ = perfil, M = matriz de coeficientes, χ(t) = caos); el cálculo
real sigue siendo `CARE_score = Σ wᵢ·fᵢ + χ(t)` — sin física falsa.

## Alcance (Fase 1)

- Backend: modelo `CAREFormula`, re-cableado de `compatibility_score` /
  `compatibility_breakdown`, 7 endpoints de fórmula, narrativa en Python.
- Frontend: `criteria.tsx`, `equation.tsx`, `interpreter.tsx` reales;
  `careDimensions.ts` compartido; ripple en `ProfileCard`, `ProfileOverlay`,
  `CompatibilityTechnicalPanel`.
- Fuera de alcance (backlog): audit.tsx real (Fase 2), decay-chart (Fase 2),
  lab A/B real (Fase 3), feedback adaptativo (Fase 4).

## Decisiones aprobadas

1. **Taxonomía canónica (7 dimensiones, suma exacta 1.0)** — la matriz M:

   | Dimensión | Clave | Peso | Chip | Función de cálculo existente |
   |---|---|---|---|---|
   | Valores | `values` | 0.36 | α | `calculate_values_compatibility` |
   | Metas de relación | `relationship_goals` | 0.18 | β | `calculate_intent_compatibility` |
   | Neurodiversidad | `neurodiversity` | 0.15 | γ | `calculate_neuro_compatibility` |
   | Responsiveness | `responsiveness` | 0.10 | δ | `calculate_activity_score` (decay 24h/72h/7d/30d) |
   | Música | `music` | 0.11 | ε | `calculate_anthem_compatibility` |
   | Lenguaje del amor | `love_language` | 0.06 | ζ | `calculate_love_language_compatibility` |
   | Comunicación | `communication_style` | 0.04 | η | `calculate_communication_style_compatibility` |

2. **Fuente de verdad: documento versionado `CAREFormula`** (no AlgorithmFactor).
   Guardado = versión nueva; rollback = mover puntero `active`. Seed lazy `v1`
   con los pesos de la tabla si no hay fórmula activa.
3. **Ubicación, Idiomas, Profesional y Altura dejan de ser bloques
   ponderados** (~35% del score actual). Atracción mutua e identidad siguen
   como pre-filtros duros (invariantes de seguridad, NO configurables en el
   admin). `proximity_km` y contexto narrativo siguen en el breakdown.
4. **Caos activo**: `χ = U(-1,1) × factor/100` (etiquetado en UI como
   "desviación máxima ±X%"). Si `seed` está fijada → RNG determinista
   (`seed + id_par + version`); `factor=0` → fast path. Semilla `v1` nace con
   `factor = 0` (producción no cambia hasta que el admin lo suba).
5. **Umbrales**: `min_compatibility` (gate real en `rank_candidates`, default
   0.0 = sin efecto) y `match_critical` (default 0.15, badges de UI).
6. **`chaos.seed` reproducible** lista para A/B (Fase 3).
7. **Changelog obligatorio** en todo guardado; auditoría enriquecida con
   snapshot before/after por clave + `created_by` + `source`
   (`criteria|equation|api`) + `action` (`save|rollback`) + `target_version`.
8. **Narrativa en backend** (`care/narrative.py`): fuente única de plantillas
   (5 tonos: Directo, Poético, Lúdico, Emocional, Curioso; patrones: top-2
   dimensiones, contraste de la más baja, χ, clamp/saturated). El frontend solo
   consume `{tone, text, label}`.
9. **`compatibility_label`** en breakdown y narrativa: `≥0.70 Alto · ≥0.50
   Medio · <0.50 Bajo · <0.30 Muy bajo`.
10. **Clamp narrativo**: breakdown incluye `chaos_applied` (χ en puntos) y
    `saturated` (si base+χ salió de [0,1]).
11. **Admin en español** hardcodeado (convención actual); user-facing
    conserva `t()` existente.

## Modelo de datos: CAREFormula

```
version: int                 # auto-incremento ("v1", "v2"…)
status: "active"|"archived"  # exactamente UN active
blocks: {values, relationship_goals, neurodiversity, responsiveness,
         music, love_language, communication_style}   # 7 claves exactas, 0–1, suma 1.0
chaos: {factor: 0–20, seed: str|null}
thresholds: {min_compatibility: float, match_critical: float=0.15}
changelog: str               # obligatorio
created_by: str
created_at: datetime
```

Registro en `backend/src/core/database.py`.

## Backend

### scoring (`backend/src/care/scoring/compatibility.py`)

- `get_compatibility_weights()` → lee `blocks` de la CAREFormula activa;
  fallback: defaults canónicos de la tabla.
- `compatibility_score()` → `Σ wᵢ·fᵢ + χ`, clamp [0,1]; fast path χ si
  factor=0.
- `compatibility_breakdown()` → 7 claves numéricas (0–1) + `chaos_applied` +
  `saturated` + `compatibility_label` + contexto intacto (`proximity_km`,
  `scenario_label`, `connection_tone`, `context_advice`). Forma plana —
  `discovery.py` escala numéricos ×100 sin cambios.
- `rank_candidates()` → si `thresholds.min_compatibility > 0`, descarta
  candidatos bajo umbral antes de diversity interleave.

### Narrativa (`backend/src/care/narrative.py`, nuevo)

Genera `{tone, text, label}` con las 5 tonalidades y patrones del punto 8.
Consumida por `/formula/preview` (parámetro `tone`, default directo).

### Endpoints (router existente `admin_algorithms.py`, prefijo
`/portal-redthread/experiencia/algoritmos`, auth `admin_required`)

| Método | Ruta | Qué hace |
|---|---|---|
| GET | `/formula/active` | Fórmula activa (lazy-seed v1) |
| GET | `/formula/versions` | Historial enriquecido (diff before/after por clave, action, source, target_version) |
| POST | `/formula/validate` | Valida JSON: 7 claves, suma 1.0, rangos → errors[] |
| POST | `/formula/preview` | {formula, user_a_id, user_b_id, tone?} → score/desglose actual vs propuesto, deltas, χ con/sin caos, clamp narrativo, narrative {tone,text,label} |
| POST | `/formula/simulate` | {formula, anchor_user_id?, candidate_user_ids?} → ~8 perfiles mock (o hasta 20 reales) rankeados actual vs propuesto, con y sin χ, Δ score medio |
| POST | `/formula/save` | Valida → versión nueva + historial (409 si sin cambios vs activa); payload incluye `source` |
| POST | `/formula/rollback/{version}` | Mueve puntero active + historial `action:rollback` |

`POST /care/normalizar` se adapta a redistribuir `blocks` proporcionalmente
respetando locks (recibidos en payload), devolviendo los 7 pesos ajustados.

## Frontend

### `constants/careDimensions.ts` (nuevo, compartido)

7 dimensiones: clave ES, label, chip αβγδεζη, color. Usado por criteria,
equation, interpreter y los 3 componentes user-facing.

### `criteria.tsx`

- Fuente única: `GET /formula/active` (caen los GETs de factores).
- Tabla 7 filas: label + chip Dirac + slider 0–40% + lock por fila.
- KPIs: total ponderado (badge 100% verde/rojo en vivo), versión activa
  (vN · fecha · admin), caos actual (±X% · seed fijada/aleatoria).
  Fuera: "Identidades Detectadas 18".
- "Normalizar" → `POST /care/normalizar` (respeta locks).
- "Aplicar Cambios" → modal: preview mini (suma + deltas vs activa) +
  changelog obligatorio → `POST /formula/save`. Deshabilitado si suma ≠ 100%.
- "Probar" por fila → navega a `/care/equation` con la fórmula editada
  (fila enfatizada) para preview/simulación antes de guardar.

### `equation.tsx` (corazón Ψ/M)

- Cabecera: fórmula estilizada `CARE_score = Σ wᵢ·fᵢ + χ(t)` con chips α–η
  sincronizados con pesos activos; chips read-only de pre-filtros
  ("Atracción mutua · Identidad → ANTES de la ecuación").
- Izquierda: 7 bloques (slider + chip + fᵢ ejemplo) + canvas SVG hecho a mano
  (nodo central Ψ, 7 nodos orbitales con tamaño = peso, aristas con
  coeficientes) + panel Caos (slider 0–20% etiquetado "±X% desviación
  máxima", seed + "Generar semilla", indicador Δ de la simulación).
- Centro: umbrales `min_compatibility` y `match_critical` con helper text.
- Derecha: JSON bidireccional (slider→JSON, JSON válido→sliders; inválido =
  chip rojo + último válido) + validación cliente + `POST /formula/validate`.
- Acciones: Validar (validate + smoke test con distribución de scores mock +
  alertas degeneradas), Simular (tabla ranking con/sin χ), Previsualizar par
  (2 user_ids → barras + deltas + clamp), Interpreter integrado (narrativa
  `{tone,text,label}` del backend + selector de tono), Guardar (modal
  changelog → save), Versiones (lista + rollback en un clic).

### `interpreter.tsx`

- Entrada: 2 user_ids + selector de tono → `POST /formula/preview` con
  fórmula activa.
- Score Breakdown real: 7 barras (fᵢ, wᵢ, contribución wᵢ·fᵢ) + trío
  narrativo (χ, base, final/saturated) + `compatibility_label`.
- Narrativa del backend. Exportar Reporte → JSON descargado
  `{user_a, user_b, formula_version, breakdown, chi, narrative, tone,
  compatibility_label, generated_at}`.
- Fuera: mock `usuario_12345`, "24 fragmentos" hardcodeados.

### Ripple user-facing

- `CompatibilityTechnicalPanel`, `ProfileCard`, `ProfileOverlay`: render
  dinámico de las 7 claves de `affinity_breakdown` con `careDimensions`
  (colores/labels). Fuera fallbacks mock. `ProfileCard` gana mini-barras por
  dimensión; type `affinity_breakdown` ajustado a 7 claves + `chaos_applied` +
  `saturated` (arrays `common_*` legacy se verifican en implementación).

## Tests y verificación

- Nuevos (pytest): `test_care_formula.py` — modelo (seed lazy, un solo
  active, versionado, rollback), validación, scoring (suma 7 bloques,
  fallback, determinismo χ con seed, fast path factor=0, clamp + saturated,
  label por bandas, gate min_compatibility), narrativa (5 tonos, contraste,
  label), endpoints (save 409 sin cambios, source en historial, simulate
  mock y reales), y **test de integración**: para cada uno de los 5 tonos,
  `/formula/preview` devuelve `narrative` con forma `{tone, text, label}`,
  `text` no vacío y `label` ∈ {Muy bajo, Bajo, Medio, Alto}.
- Reescritos: `test_compatibility.py`, `test_location_decoupling.py`
  (ubicación ya no pondera; `proximity_km` persiste en contexto).
- Frontend: test de `careDimensions.ts`; typecheck 0 errores; eslint 0
  errores en targets; jest completo; impeccable `detect --json` en targets →
  0 issues críticos. Radii en strings px; sin dependencias nuevas.

## Entrega (Fase 1, un PR por bloque, sin commitear sin "sube" del usuario)

1. Backend: modelo + scoring + endpoints + narrativa + tests (todo verde).
2. Frontend shared: `careDimensions.ts` + ripple de los 3 componentes.
3. `criteria.tsx`.
4. `equation.tsx`.
5. `interpreter.tsx`.

## Backlog (no Fase 1)

- **Fase 2**: `audit.tsx` real (historial enriquecido + rollback UI) +
  gráfico de decaimiento de actividad (24h/72h/7d/30d).
- **Fase 3**: lab A/B real (asignación, métricas por variante
  engagement/duración chat/match rate, conexión con fórmulas versionadas).
- **Fase 4**: feedback adaptativo (ajuste supervisado de pesos con guardrails
  de deriva y auto-versionado).
