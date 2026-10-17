# Spec: Editor CARE — perfiles (default/recomendados/guardados), clamp Σ≤100% y renombres

Fecha: 2026-10-17
Estado: diseño aprobado por el usuario (secciones 1–5, chat)

## Objetivo

Convertir el editor `equation.tsx` en un editor con **gestión de perfiles**:
un combolist de perfiles (Default, presets recomendados curados, y perfiles
guardados por el admin) que aplica pesos + caos de un clic, con acciones
propias para crear/actualizar/eliminar perfiles. Además:

- Renombrar acciones: **Normalizar → Reestablecer** (vuelve al perfil Default)
  y **Aplicar Cambios → Guardar** (solo versiones, deshabilitado si Σ ≠ 100%).
- **Clamp**: al mover un slider, Σ nunca supera 100% (el slider se topa en el
  máximo permitido), con aviso transitorio "Límite 100%".

`Probar fórmula` no cambia (ya valida + simula + alertas + Δ caos).

## Alcance

- Backend: modelo `CAREProfile`, servicio, 4 endpoints CRUD nuevos, tests.
- Frontend: `services/careProfileService.ts`, `utils/careProfileModel.ts`
  (presets + helpers), clamp en `utils/careCriteriaModel.ts`, componente
  `CareProfilesPanel`, wiring en `equation.tsx` (combo, diálogos, renombres,
  badge), tests nuevos + ajuste de tests existentes.
- Sin dependencias nuevas. Sin cambios en versiones/rollback ni en
  `CareCriteriaTable` (el clamp vive en `equation.tsx`; la tabla queda "tonta").

## Decisiones aprobadas

1. **Perfiles persistidos en backend** (colección dedicada `care_profiles`).
   Compartidos entre admins, auditables; misma sesión/auth que la fórmula.
2. **Un perfil = pesos (7 bloques) + `chaos_factor`**. Seed y umbrales
   (`min_compatibility`, `match_critical`) no forman parte del perfil.
3. **Flujos independientes**: Guardar = solo versiones (historial oficial).
   Perfiles = acciones propias del panel de perfiles. Guardar versión nunca
   crea/actualiza perfiles automáticamente.
4. **Presets recomendados = constantes frontend** (como `EXPERIMENT_META` del
   lab). Los perfiles guardados vienen del backend.
5. **Cargar perfil / Reestablecer sobrescriben todas las dimensiones**,
   incluidas las bloqueadas (el lock solo restringe edición manual). La suma
   queda 100% exacta porque los perfiles son válidos por construcción.
6. **Selección persistente**: seleccionar un perfil lo aplica al instante; la
   selección se mantiene si después se edita a mano y el label muestra
   "(modificado)" cuando el draft difiere del perfil seleccionado.
7. **Actualizar/Eliminar solo para perfiles guardados**; los presets built-in
   no se editan (botones deshabilitados con tooltip).
8. **Default** = pesos canónicos (`CANONICAL_BLOCK_WEIGHTS`) + caos 0.0 —
   espeja el seed del backend (`ensure_active_formula`: `CANONICAL_BLOCKS`,
   `chaos_factor=0.0`).
9. **Clamp en `equation.tsx`**, no en la tabla: helper puro + badge con el
   patrón de timers ya usado por `flashGlow`. El modo JSON puede seguir
   produciendo Σ ≠ 100%; eso queda cubierto por el `disabled` de Guardar.
10. **Actualizar perfil no detecta "sin cambios"** (a diferencia de versiones,
    que responden 409): sobrescribir con el mismo estado es válido y solo
    refresca `updated_at`. El diálogo de confirmación de Actualizar/Eliminar
    existe porque son operaciones destructivas, no como detección de diffs.

### Presets recomendados (ids `builtin:*`, suman 1.0 exacto)

| Perfil | id | Pesos (%) | Caos |
|---|---|---|---|
| Default | `builtin:default` | canónicos: Valores 36, Metas 18, Neurodiv. 15, Resp. 10, Música 11, Lenguaje 6, Comunicación 4 | 0.0 |
| Neurodiversidad Boost | `builtin:neurodiversity` | Valores 32, Metas 16, Neurodiv. 22, Resp. 9, Música 10, Lenguaje 6, Comunicación 5 | 0.0 |
| Balance Relacional | `builtin:balance` | Valores 30, Metas 20, Neurodiv. 13, Resp. 11, Música 9, Lenguaje 9, Comunicación 8 | 0.0 |
| Caos Reducido | `builtin:lowchaos` | canónicos | 1.0 |

## Modelo de datos: CAREProfile

```
name: str           # trim, 1–60; único (exacto, case-sensitive)
blocks: {values, relationship_goals, neurodiversity, responsiveness,
         music, love_language, communication_style}  # 7 claves exactas, 0–1, suma 1.0
chaos_factor: float # 0–20
created_by: str
created_at: datetime
updated_at: datetime
```

Registro del modelo en `backend/src/core/database.py` (mismo patrón que
`CAREFormula`). Colección `care_profiles`, índice único por `name`.

## Backend

### Servicio (`backend/src/care/profiles/service.py`, nuevo)

- `list_profiles()` → orden por `name` asc.
- `create_profile(name, blocks, chaos_factor, admin_id)` → valida y persiste.
- `update_profile(profile_id, patch)` → patch parcial (`name`, `blocks`,
  `chaos_factor`); refresca `updated_at`.
- `delete_profile(profile_id)`.
- Validación reutilizando `validate_formula_dict` de
  `src/care/formula/service.py` (recibe `{blocks, chaos_factor}` y ya exige
  7 claves exactas, 0–1, suma 1.0 exacta, caos 0–20). Reglas de nombre:
  "El nombre del perfil es obligatorio." (vacío tras trim) /
  "El nombre del perfil no puede superar 60 caracteres."
- Nombre duplicado: se detecta en servicio (`find_one` por nombre, excluyendo
  el propio id en update).

### Endpoints (router existente `admin_algorithms.py`, prefijo
`/portal-redthread/experiencia/algoritmos`)

| Método | Ruta | Qué hace |
|---|---|---|
| GET | `/formula/profiles` | Lista perfiles (`id, name, blocks, chaos_factor, created_by, created_at, updated_at`) |
| POST | `/formula/profiles` | Crea `{name, blocks, chaos_factor}` → 201 perfil creado |
| PUT | `/formula/profiles/{profile_id}` | Patch parcial `{name?, blocks?, chaos_factor?}` → perfil actualizado |
| DELETE | `/formula/profiles/{profile_id}` | Borra → `{message}` |

Errores (mismo estilo que endpoints de fórmula): 422 `{detail: [errores]}
con lista de mensajes en español; 409 `{detail: "Ya existe un perfil con ese
nombre."}`; 404 `{detail: "Perfil no encontrado."}`. `id` = `str(_id)`,
fechas en ISO.

## Frontend

### `services/careProfileService.ts` (nuevo)

`BASE = "/portal-redthread/experiencia/algoritmos/formula/profiles"`.
Tipos `CareProfile` (snake_case como la API) y `ProfilePayload`.
Funciones `listProfiles()`, `createProfile(payload)`, `updateProfile(id,
patch)`, `deleteProfile(id)` — wrapper tipado sobre `adminApiClient`.

### `utils/careProfileModel.ts` (nuevo)

- `ProfileView` = `{id, name, blocks, chaos_factor, builtin}` (normaliza
  builtins y perfiles de API a una sola forma).
- `BUILTIN_PROFILES: ProfileView[]` con los 4 presets de la tabla
  (`builtin: true`); Default referencia `CANONICAL_BLOCK_WEIGHTS`.
- `toProfileView(profile: CareProfile): ProfileView` (`builtin: false`).
- `applyProfileToDraft(draft, profileView)` → copia inmutable: reemplaza
  `blocks` y `chaosFactor`; seed/umbrales intactos.
- `profileMatchesDraft(profileView, draft)` → compara los 7 pesos por
  `percentOf` y caos con precisión 0.1 (si no coincide → "(modificado)").
- `profileErrorMessage(error)` → 404 / 409 / 422 (array o string) / genérico.

### `CareProfilesPanel.tsx` (nuevo componente presentacional)

Arriba del panel de pesos (columna derecha del editor). Props: `profiles`
(builtins + guardados como `ProfileView[]`), `selectedId`, `modified`,
`loading`, `onSelect`, `onSaveAs`, `onUpdate`, `onDelete`.

- `Select` pequeño agrupado: `ListSubheader` "Recomendados" / "Guardados";
  `renderValue` muestra el nombre (+ " (modificado)" si `modified`) o
  "Personalizado" si no hay selección.
- Tres `IconButton` con `Tooltip`: `profile-save-as` (BookmarkAdd),
  `profile-update` (Save), `profile-delete` (DeleteOutline). Actualizar y
  Eliminar deshabilitados cuando no hay selección o el perfil es builtin.
- Testids: `profile-select`, `profile-save-as`, `profile-update`,
  `profile-delete`.

### `equation.tsx` (wiring)

- Estado nuevo: `profiles`, `profilesLoading`, `selectedProfileId`,
  `profileSaveOpen/profileName/profileSaving/profileError`,
  `profileConfirm {kind: 'update'|'delete', profile}`, `limitHint` (+ timer).
- Carga de perfiles en el montaje (independiente de versiones; si falla →
  lista vacía sin bloquear el editor). `modified` derivado con
  `profileMatchesDraft`.
- **Seleccionar perfil** → `applyProfileToDraft` + selección. **Guardar como
  perfil…** → diálogo con `TextField` de nombre (error visible si 409) →
  `createProfile` → recarga → queda seleccionado. **Actualizar perfil** →
  diálogo de confirmación → `updateProfile(id, {blocks, chaos_factor})` →
  recarga. **Eliminar perfil** → confirmación → `deleteProfile` → recarga +
  deselección. Errores CRUD visibles en el diálogo correspondiente.
- **Reestablecer** (reemplaza "Normalizar", testid `action-reestablecer`,
  icono `RestartAlt`, tooltip "Vuelve al perfil Default"): aplica
  `builtin:default` y lo deja seleccionado. Deja de llamar a
  `normalizeFormulaBlocks` (el resto de usos — commit de slider y guardado —
  se mantienen).
- **Guardar** (reemplaza "Aplicar Cambios"): mismo modal (Σ, deltas,
  changelog obligatorio) → `saveFormula(source: "equation")`;
  `disabled={!balanced || saving}`. Testid `open-save-modal` y flujo de
  éxito intactos.
- **Clamp** en `handleBlockChange`: `percent = clampBlockPercent(...)`; si el
  pedido fue recortado → `limitHint` visible 1.2s (timer propio, patrón
  `flashGlow`). Chip "Límite 100%" (testid `limit-hint`) junto al Σ en vivo.

### `utils/careCriteriaModel.ts` (clamp)

`clampBlockPercent(blocks, key, requested)`:

- Si `requested > actual`: techo = `actual + max(0, 100 − totalPercent)`;
  resultado `min(requested, techo)`.
- Si `requested ≤ actual`: sin recorte (bajar siempre permitido).
- Con Σ > 100 (vía JSON): subir devuelve el valor actual (no se puede subir),
  bajar funciona.

## Tests y verificación

- **Backend** (pytest, patrón mongomock-mock/mocks de
  `test_formula_service_db.py` / `test_formula_endpoints.py`):
  `test_care_profiles.py` — crear (persistencia de campos y timestamps),
  duplicado → 409, validaciones 422 (nombre vacío/largo, clave faltante,
  clave extra, rango, suma ≠ 1.0, caos fuera de rango), listado ordenado,
  update parcial + `updated_at`, update con nombre en conflicto → 409,
  update/delete inexistente → 404, delete ok.
- **Frontend** (jest, RED→GREEN):
  - `careProfileService.test.ts`: URLs/métodos/payloads y tipado.
  - `careProfileModel.test.ts`: presets suman 1.0 exacto, ids únicos, Default
    = canónicos + caos 0; `applyProfileToDraft` inmutable (bloques + caos,
    seed/umbrales intactos); `profileMatchesDraft` (exacto, ±1% en slider,
    ±0.1 caos); `profileErrorMessage`.
  - `careCriteriaModel.test.ts`: clamp (subir dentro del presupuesto, subir
    por encima → techo exacto, bajar libre, Σ = 100 → no sube, Σ > 100 → no
    sube pero baja).
  - `CareProfilesPanel.test.tsx`: render de grupos Recomendados/Guardados,
    "(modificado)", nombre seleccionado, disabled de Actualizar/Eliminar
    para builtin y sin selección, callbacks.
  - `equation.test.tsx`: combo aplica preset (draft de stubs refleja los
    pesos), Guardar como perfil (create + recarga + error 409), Actualizar
    (confirm → update con draft actual), Eliminar (confirm → delete +
    deselección), builtin sin acciones, Reestablecer → canónicos + caos 0 +
    selección Default, `limit-hint` aparece al intentar pasar de 100 y se
    oculta con fake timers, Guardar deshabilitado con Σ ≠ 100 (vía modo
    JSON). **Ajuste**: los tests actuales que asumen slider → 104% se
    reescriben al comportamiento clamp.
- Verificación final: `npx tsc --noEmit` (0), `npx eslint` en archivos
  tocados (0 errores), `npx jest` completo, backend `pytest
  src/care/tests -q` + flake8. Commits solo con pedido explícito.

## Entrega (orden, TDD por paso)

1. Backend: modelo + servicio + endpoints + tests (verde + flake8).
2. Frontend compartido: `careProfileService` + `careProfileModel` + clamp
   helper + tests unitarios.
3. `CareProfilesPanel` + tests (componente aislado).
4. `equation.tsx`: combo, diálogos, Reestablecer, Guardar, clamp + badge;
   tests de page actualizados/nuevos.
5. Verificación total y reporte.

## Fuera de alcance

- Renombrar perfiles desde el combo (el renombre existe en la API vía PUT
  `name`, pero la UI de Actualizar no lo envía).
- Presets servidos por backend, import/export de perfiles, RBAC por perfil,
  versionado/historial de perfiles, autoguardado de perfil al guardar
  versión, seeds dentro del perfil.
