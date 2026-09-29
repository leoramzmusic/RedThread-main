# Spec: Reorganización de archivos sueltos de la raíz de RedThread-main

Fecha: 2026-09-29
Estado: aprobado por el usuario (alcance, destinos y borrados)

## Objetivo

Limpiar los archivos sueltos de la raíz del proyecto moviéndolos a carpetas
existentes, sin tocar la estructura de `backend/`, `frontend/` ni las
herramientas de infraestructura que dependen de rutas fijas.

## Alcance

- Solo archivos de la **raíz** del repo.
- **No** se reorganiza `backend/` (~30 scripts .py sueltos quedan donde están).
- **No** se toca `.worktrees/` ni los directorios de agentes (`.claude/`,
  `.opencode/`, etc.).

## Decisiones aprobadas

1. **Docker/CI se quedan en la raíz**: `Dockerfile`, `docker-compose.yml`,
   `docker-compose.dev.yml`, `docker-compose.override.yml`, `entrypoint.sh`,
   `Jenkinsfile`. Razones: convención estándar de Docker/CI, cero riesgo de
   romper `docker compose up` y los contextos `build:` relativos; el Dockerfile
   hace `COPY requirements.txt` y usa `entrypoint.sh` desde el contexto raíz.
2. **Scripts Python de la raíz → `scripts/`** (carpeta ya existente con
   `bump_version.py`, `generate_changelog.py`, etc.). Sin colisiones de
   nombre (la única colisión, `debug_discovery.py`, existe en
   `backend/scripts/`, destino descartado).
3. **Documentación → `docs/`** (carpeta ya existente y activa con
   `CARE_ALGORITHM.md`, `MASTER_BACKLOG.md`, etc.), no
   `architecture/Vault/Wiki/docs/`.
4. **LICENSE y READMEs permanecen en la raíz** (GitHub los renderiza desde ahí).

## Movimientos

### → `scripts/` (23 archivos, con `git mv`)

Python (20):

- `check_admin.py`
- `check_db_admin.py`
- `check_geojson_keys.py`
- `debug_discovery.py`
- `debug_discovery_v2.py`
- `debug_dto.py`
- `debug_full_flow.py`
- `debug_photon.py`
- `debug_state_polygon.py`
- `debug_user_lookup.py`
- `download_geojson.py`
- `inspect_raw.py`
- `regen_geojson.py`
- `test_bulk.py`
- `test_internal.py`
- `test_nominatim.py`
- `test_nominatim_direct.py`
- `verify_geography.py`
- `verify_search_fix.py`
- `verify_state_polygon.py`

PowerShell (2):

- `install-spanish-lang.ps1`
- `install-tesseract.ps1`

JavaScript (1):

- `playground.localhost.js` (script de MongoDB)

### → `docs/` (1 archivo)

- `K8S_DEPLOYMENT.md`

### Borrados (aprobados por el usuario)

- `discovery_results.txt` — salida de debug trackeada en git, no es
  documentación.
- `git` — archivo vacío sin contenido.

## Se mantiene en la raíz

`Dockerfile`, `docker-compose*.yml`, `entrypoint.sh`, `Jenkinsfile`,
`requirements.txt` (lo copia el Dockerfile), `README.md`, `README.en.md`,
`LICENSE`, `VERSION`, `package.json`, `package-lock.json`, `.versionrc.json`,
`skills-lock.json`, `login.json` (gitignored), `.gitignore`.

## Actualizaciones de referencias

Los siguientes documentos mencionan los `.ps1` con ruta de raíz:

- `architecture/Vault/Output/OCR_SYSTEM_COMPLETE.md` (líneas ~124-135)
- `architecture/Vault/Wiki/docs/OCR_SYSTEM_COMPLETE.md` (líneas ~124-135)

Cambiar `install-tesseract.ps1` / `install-spanish-lang.ps1` /
`.\install-spanish-lang.ps1` por rutas bajo `scripts/`.

## Verificación

1. `git status` — todos los moves registrados como renames (historial
   preservado), ningún archivo trackeado perdido.
2. Búsqueda de referencias rotas a los nombres movidos en
   `*.md,*.yml,*.yaml,*.json,*.ps1,*.sh`.
3. `docker compose config` — compose sigue siendo válido (no se movió nada
   que afecte, pero se confirma).

## Fuera de alcance (posibles follow-ups)

- Reorganizar los ~30 `.py` sueltos de `backend/`.
- Unificar `architecture/Vault/Output/` y `architecture/Vault/Wiki/docs/`
  (OCR_SYSTEM_COMPLETE.md está duplicado).
- Evaluar borrado/duplicados de scripts `debug_*/verify_*` ya obsoletos.
