# CARE Preferences — Diseño

**Fecha:** 2026-10-19
**Estado:** aprobado por el usuario (secciones 1–4)
**Spec previa relacionada:** `docs/superpowers/specs/2026-10-17-care-perfiles-clamp-design.md`

## 1. Contexto

El módulo CARE tiene hoy: Equation (motor de pesos + perfiles), Interpreter (duplicado del A/B)
y Lab (comparador A/B con narrativa). Falta un canal para que los usuarios declaren qué valoran
al elegir pareja, y un repositorio admin que agregue esos datos para análisis offline con IA.

Este diseño introduce preferencias de usuario basadas en las 7 dimensiones CARE, con una
taxonomía extendida opcional (`tag`) mapeada a CARE, un dashboard admin de insights y un pipeline
de exportación JSON/CSV.

## 2. Objetivos

- CRUD de preferencias por usuario autenticado (0–100 por dimensión CARE).
- Mapa extensible `tag → dimensión CARE` sin tocar la fórmula.
- Panel Discover embebido en `/discover` para que el usuario registre sus preferencias.
- Interpreter admin como repositorio + insights + exportación (deja de ser A/B).
- Exportación periódica/manual a `exports/preferences/YYYY-MM-DD.{json,csv}` para IA offline.
- Equation sin la sección redundante de vista previa.

## 3. No-objetivos (esta fase)

- Endpoint `/recommendations` ni integración de sugerencias en Equation.
- UI de selección de tags (el modelo/API los soporta; Discover usa dimensiones CARE).
- Filtros de insights por edad/género/región.
- CRUD admin del mapa de dimensiones (solo seed idempotente).
- Scheduler in-process (se usa cron/Task Scheduler externo).
- Admin editando preferencias de otros usuarios.
- Cambios en Lab (permanece intacto).

## 4. Decisiones aprobadas

| Tema | Decisión |
|---|---|
| Taxonomía | 7 dimensiones CARE obligatorias + `tag` opcional mapeado a CARE |
| Score | entero 0–100 |
| Actores | usuario CRUD de sus filas; admin lectura + insights + export |
| Discover | componente embebido en `/discover` (no página nueva) |
| Export | servicio compartido: CLI + botón admin; JSON + CSV; sin scheduler interno |
| Alcance | un ciclo por fases (backend → Discover → Interpreter → Equation → verificación) |
| Enfoque de datos | un documento por `(user_id, dimension)` (no documento por usuario) |

## 5. Modelo de datos

### 5.1 `care_user_preferences` — `CareUserPreference`

| Campo | Tipo | Reglas |
|---|---|---|
| `user_id` | `str` | `User._id`; derivado de sesión (nunca del body) |
| `dimension` | `str` | una de las 7 claves CARE |
| `tag` | `Optional[str]` | opcional; trim; si existe debe estar en el mapa y mapear a `dimension` |
| `score` | `int` | 0–100 |
| `created_at` | `datetime` | UTC, al crear |
| `updated_at` | `datetime` | UTC, en cada update |

Índices (`Settings.indexes` con `IndexModel`):
- único compuesto `(user_id, dimension)` → una fila por usuario/dimensión.
- simple `(dimension)` para agregaciones/export.

Claves CARE canónicas (fuente: `CANONICAL_BLOCKS` en `care/formula/service.py`):
`values, relationship_goals, neurodiversity, responsiveness, music, love_language, communication_style`.

### 5.2 `care_dimension_map` — `CareDimensionMap`

| Campo | Tipo | Reglas |
|---|---|---|
| `tag` | `str` | único, trim, 1–40 chars |
| `care_dimension` | `str` | una de las 7 claves CARE |

Seed idempotente en `core/seed.py` (upsert por `tag`):

```
humor        → communication_style
appearance   → values
science      → relationship_goals
art          → music
```

Extender el mapa = añadir filas (seed o DB); la fórmula no cambia.

### 5.3 Registro

Ambos modelos se agregan a `document_models` en `core/database.py`.

## 6. API

### 6.1 Usuario — `api/preferences.py`, prefijo `/preferences`, `get_current_user`

| Método | Ruta | Comportamiento |
|---|---|---|
| GET | `/preferences` | lista solo filas propias, orden `dimension` asc |
| POST | `/preferences` | crea fila; 201; body `{dimension, tag?, score}` |
| PUT | `/preferences/{id}` | actualiza `score`/`tag` de una fila propia; `dimension` inmutable |
| DELETE | `/preferences/{id}` | borra fila propia; `{"ok": true}` |

- Respuesta de fila: `{id, user_id, dimension, tag, score, created_at, updated_at}` (ISO 8601).
- `user_id` del body se ignora. Fila ajena o id inválido → 404.
- Duplicado `(user_id, dimension)` al crear → 409 (incluye captura de `DuplicateKeyError`).
- Validaciones → 422 con `detail` como lista de strings en español.

### 6.2 Admin — `api/admin_preferences.py`, prefijo
`/portal-redthread/experiencia/algoritmos/preferences`, `admin_required`

| Método | Ruta | Comportamiento |
|---|---|---|
| GET | `/` | `{items, total, limit, offset}`; filtros opcionales `dimension`, `user_id`; orden `updated_at` desc; `limit` 1–1000 (default 200) |
| GET | `/insights` | `{generated_at, total_records, unique_users, dimensions:[{dimension,count,avg_score}], tags:[{tag,count,avg_score}], top_dimensions}` |
| POST | `/export` | genera snapshot y responde `{date, count, files:{json,csv}, records}` |

- `top_dimensions`: top 3 por `avg_score` desc (con `count` y `avg_score`).
- `avg_score` redondeado a 1 decimal; agregaciones con `$group` en Mongo.
- El admin no edita ni borra filas de usuarios en esta fase.

### 6.3 Mensajes de error (español)

- 422: `"La dimensión no es válida."`, `"El score debe estar entre 0 y 100."`,
  `"Etiqueta desconocida."`, `"La etiqueta no corresponde a esa dimensión."`
- 409: `"Ya existe una preferencia para esa dimensión."`
- 404: `"Preferencia no encontrada."` (inexistente, ajena o id inválido)

## 7. Exportación

`care/preferences/export.py`:

- `build_export(day: date | None = None)`:
  - consulta filas ordenadas por `(dimension, user_id)` (determinista),
  - escribe `YYYY-MM-DD.json` y `YYYY-MM-DD.csv` en `CARE_EXPORTS_DIR`
    (default `backend/exports/preferences`),
  - mismo día sobrescribe (snapshot idempotente),
  - escritura atómica (archivo temporal + `os.replace`).
- JSON: `{generated_at, date, count, records:[{user_id, dimension, tag, score, created_at, updated_at}]}`
  codificado UTF-8.
- CSV: cabeceras `user_id,dimension,tag,score,created_at,updated_at`; codificación `utf-8-sig` (Excel).
- CLI: `python -m src.care.preferences.export [--date YYYY-MM-DD]`.
  Fecha inválida → mensaje + exit 2; error de escritura → exit 1; éxito imprime conteo y rutas.
- `backend/exports/` se agrega al `.gitignore`.
- Sin dependencias nuevas (stdlib `csv`, `json`, `pathlib`, `tempfile`).

## 8. Frontend

### 8.1 Servicios

`services/carePreferencesService.ts` (usuario, `apiClient`):
- `listPreferences(): Promise<CarePreference[]>`
- `createPreference({dimension, tag?, score}): Promise<CarePreference>`
- `updatePreference(id, {score?, tag?}): Promise<CarePreference>`
- `deletePreference(id): Promise<void>`
- Tipo `CarePreference {id, user_id, dimension, tag, score, created_at, updated_at}`.
- Helper de mensajes español para 404/409/422.

`services/carePreferencesAdminService.ts` (admin, `adminApiClient`):
- `listAllPreferences({limit?, offset?, dimension?, userId?})`
- `getPreferenceInsights()`
- `exportPreferences()` → `{date, count, files, records}`.

### 8.2 Discover (usuario)

`components/care/CarePreferenceCards.tsx`, montado en `pages/discover/index.tsx`
(import + una sección; el resto de Discover no se toca):

- Card colapsable “¿Qué te importa más al elegir alguien?”.
- 7 filas CARE con label + `Slider` 0–100 + indicador “Guardado”/“Sin guardar”.
- Carga filas existentes al montar y las mapea por dimensión.
- Al soltar el slider (`onChangeCommitted`): `create` si la dimensión no existe, `update` si existe.
- Icono para eliminar la fila guardada.
- Valor visual inicial 50 en dimensiones sin fila, sin persistir hasta interacción.
- Errores en `Alert` en español; se conserva el valor local si falla el guardado.
- Copia hardcoded en español (mismo criterio que el módulo CARE).

### 8.3 Interpreter (admin)

Reemplazo completo del A/B en `pages/portal-redthread/care/interpreter.tsx`:

- KPIs: registros totales, usuarios únicos.
- “Top 3 dimensiones más valoradas”: avg score con barras (`LinearProgress`).
- Distribución por dimensión y por tag (tabla compacta).
- Tabla del dataset: usuario, dimensión, tag, score, actualizado; filtro por dimensión y límite.
- Botón “Exportar dataset”: llama al endpoint, descarga `preferences-YYYY-MM-DD.json`
  (helper `downloadJson`), y muestra alerta con conteo y rutas.
- Estados de carga/error/vacío en español.
- Se eliminan buscador A/B, narrativa y desglose de score de esta página (viven en Lab).

Componentes auxiliares testeables:
- `components/care/CarePreferenceInsights.tsx`
- tabla del dataset dentro de la página o componente propio si supera ~150 líneas.

### 8.4 Equation

- Eliminar el bloque “Vista previa (Interpreter)”: JSX de `CarePreviewPanel`, estado/handlers
  (`previewUserA/B`, `previewTone`, `previewResult`, `previewLoading`, `previewError`,
  `handlePreview`) e imports asociados (`previewFormula`, tipos `NarrativeResult`/`PreviewResult`,
  `SearchUser`, `TONE_OPTIONS`, `previewErrorMessage`, `CarePreviewPanel`).
- No cambiar KPIs, diagrama, tabla/sliders/locks/Σ, perfiles, guardar versión.
- `AdminSidebar`: renombrar “CARE Interpreter” → “Preferencias & Insights” (misma ruta).

## 9. Seguridad y rendimiento

- `user_id` siempre de sesión; body ignorado para ownership.
- GET/PUT/DELETE de usuario filtran por `user_id`; fila ajena = 404.
- Admin protegido por `admin_required` (Employee); solo lectura/export.
- Fechas de export validadas `YYYY-MM-DD`; rutas construidas solo con esa fecha validada.
- Listados con `limit` duro; insights vía agregación; export no materializa en la API admin
  (el POST devuelve el snapshot ya generado).
- Índices descritos en 5.1; timestamps UTC.

## 10. Pruebas

### Backend (`backend/src/care/tests/`)

- `test_care_preferences.py`:
  - seed del mapa idempotente; tags válidos/desconocidos/mismatch.
  - validación de dimensión y score (límites 0 y 100; fuera de rango).
  - crear/listar/actualizar/eliminar; duplicado 409; 404 en id inválido/inexistente.
  - ownership: usuario A no lista/edita/borra filas de B.
  - endpoints: mapeo 422/409/404; body `user_id` ignorado.
  - admin: listado con filtros/limit, insights (agregados y top 3), export responde conteo/records.
- `test_preferences_export.py`:
  - render puro JSON/CSV (cabeceras, orden determinista, UTF-8/utf-8-sig).
  - escritura en `tmp_path`, sobrescritura mismo día, contenido válido.
  - CLI con fecha inválida → exit 2.
- Mismas técnicas de mock que `test_care_profiles.py` (sin Mongo real).

### Frontend

- `carePreferencesService.test.ts` / `carePreferencesAdminService.test.ts`: rutas, payloads, errores.
- `CarePreferenceCards.test.tsx`: carga, crear, actualizar, eliminar, error conserva valor.
- `CarePreferenceInsights.test.tsx` (o página): KPIs, top 3, distribución.
- `interpreter.test.tsx`: reescrito (carga, KPIs, filtro, export + descarga, errores).
- `equation.test.tsx`: describe de preview eliminado; el resto sigue verde.
- Montaje de Discover: test de que `CarePreferenceCards` aparece en la página (mock de servicios).

### Integración de flujo (sin Playwright)

Test backend que recorre: usuario crea/edita → admin lista → insights → export →
archivos existen, parsean y contienen las filas. No hay Playwright/Cypress en el repo;
no se añade dependencia.

## 11. Archivos

**Backend (nuevos):**
- `src/care/models/care_user_preference.py`
- `src/care/models/care_dimension_map.py`
- `src/care/preferences/__init__.py`
- `src/care/preferences/service.py`
- `src/care/preferences/export.py`
- `src/api/preferences.py`
- `src/api/admin_preferences.py`
- `src/care/tests/test_care_preferences.py`
- `src/care/tests/test_preferences_export.py`

**Backend (modificados):**
- `src/core/database.py` (registro de modelos)
- `src/core/seed.py` (seed del mapa)
- `src/main.py` (routers)
- `.gitignore` (exports/)

**Frontend (nuevos):**
- `src/services/carePreferencesService.ts` (+ test)
- `src/services/carePreferencesAdminService.ts` (+ test)
- `src/components/care/CarePreferenceCards.tsx` (+ test)
- `src/components/care/CarePreferenceInsights.tsx` (+ test)

**Frontend (modificados):**
- `src/pages/discover/index.tsx` (montar tarjetas)
- `src/pages/portal-redthread/care/interpreter.tsx` (+ test reescrito)
- `src/pages/portal-redthread/care/equation.tsx` (+ test: quitar preview)
- `src/components/layout/AdminSidebar.tsx` (label)

## 12. Verificación

Desde `backend/`:
- `& "venv\Scripts\python.exe" -m pytest src/care/tests -q`
- `& "venv\Scripts\python.exe" -m flake8 src/care/preferences src/care/models src/api/preferences.py src/api/admin_preferences.py`

Desde `frontend/`:
- `npx tsc --noEmit`
- `npx eslint <archivos tocados>`
- `npx jest --ci` (baseline actual: 71 suites / 659 tests)

No se hace push ni commit sin pedido explícito (los commits de implementación se acuerdan al final).

## 13. Futuro

- UI de tags naturales (humor, apariencia, arte) sobre el mapa existente.
- Endpoint `/recommendations` que consume snapshots analizados por IA y devuelve presets sugeridos
  para Equation.
- Filtros de insights por edad/género/región.
- CRUD admin del mapa de dimensiones.
- Scheduler/worker de exportación si se requiere in-process.
