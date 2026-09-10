# Profile Help Tips — Sistema de administración centralizado

Fecha: 2026-09-09
Estado: Aprobado (diseño validado en brainstorm)

## Objetivo

Permitir al administrador gestionar desde el panel los modales de ayuda/tips del perfil
(actualmente el modal "Tips para tus fotos") sin tocar código, y hacer que el portal de
usuario los renderice dinámicamente desde la base de datos.

Decisiones tomadas en brainstorm:

- Un tip = `title` + `description` + **una imagen única** (opcional, con placeholder por defecto).
  No se conserva el formato OK/KO de dos imágenes del modal actual.
- Se incluye un campo `category` desde el inicio para soportar varios modales futuros
  (ej. `fotos`, `videos`, `seguridad`) sin migrar datos.
- Contenido en español único por ahora (sin i18n de tips).

## Alcance

Este spec cubre:

1. Backend: modelo `ProfileHelpTip` + CRUD admin + endpoint público + siembra automática.
2. Panel admin: entrada en el menú "Apariencia" y página de gestión CRUD.
3. Portal usuario: `VisualTipsSheet` pasa de slides hardcodeadas a contenido dinámico.

No incluye: i18n de los tips, múltiples triggers distintos de "Tips visuales" en la UI
(se mantiene el único botón actual, con la categoría `fotos` por defecto).

## Backend

### Modelo

Archivo nuevo: `backend/src/models/profile_help_tip.py`.

- Clase `ProfileHelpTip` (documento beanie/Mongo, colección `profile_help_tips`).
- Campos:
  - `title: str`
  - `description: str`
  - `category: str = "fotos"`
  - `image_url: Optional[str] = None`
  - `is_active: bool = True`
  - `order: int = 0`
  - `created_at: datetime` (default `datetime.now(timezone.utc)`)

El estilo de declaración (base de Document, decorador o atributos opcionales) debe
mirar a los modelos existentes (`backend/src/models/appearance.py`,
`backend/src/models/system_options.py`) y replicarlo exactamente.

### CRUD admin

Archivo nuevo: `backend/src/api/admin_profile_help.py`, registrado en `main.py`:

```python
app.include_router(
    admin_profile_help.router,
    prefix="/portal-redthread/apariencia/ayuda-perfil",
    tags=["Admin - Ayuda de Perfil"]
)
```

Endpoints (protegidos con `require_permission`, patron `admin_configuracion.py`,
con `log_admin_action` en cada mutación):

- `GET /` — listar todos los tips, ordenados por `order` asc y luego `created_at` desc.
  Permiso: `VIEW_CONFIG`.
- `POST /` — crear tip. Permiso: `EDIT_CONFIG`.
- `PUT /{tip_id}` — actualizar. Permiso: `EDIT_CONFIG`.
- `DELETE /{tip_id}` — eliminar. Permiso: `EDIT_CONFIG`.
- `POST /upload` — subir imagen. Permiso: `EDIT_CONFIG`.
  Guarda en `static/uploads/profile_help/` con nombre `uuid` conservando la extensión
  (patrón `admin_appearance.py`), devuelve `{"url": "/static/uploads/profile_help/<file>"}`.

Nota de precedente: `admin_appearance.py` expone su `GET /resources` sin protección de
auth. Aquí el read admin sí queda protegido y la lectura pública es un endpoint aparte.

### Endpoint público (portal de usuario)

En el mismo archivo `admin_profile_help.py`:

- `GET /public?category=fotos` — sin autenticación. Devuelve solo tips `is_active == True`
  de la categoría solicitada, ordenados por `order` asc y luego `created_at` desc.
- Antes de responder aplica siembra automática (ver siguiente sección).

### Siembra automática de contenido por defecto

Función `ensure_default_tips()` en el mismo archivo:

- Si la colección `profile_help_tips` no tiene ningún documento con
  `category == "fotos"`, inserta los 3 tips actuales del modal (tomados de
  `VisualTipsSheet.tsx`), con `image_url` apuntando a las imágenes OK existentes:
  - "Usa fotos que muestren tu rostro" → `/tips/rostro-ok.jpg`
  - "Bye bye a los filtros" → `/tips/natural-ok.jpg`
  - "Muestra tus pasiones" → `/tips/hobby-ok.jpg`
- Se invoca **solo** desde `GET /public` (misma estrategia lazy de
  `check_scheduled_activations`). No se ejecuta en el CRUD admin.

## Panel admin (frontend)

### Menú

`frontend/src/components/layout/AdminSidebar.tsx`: agregar un hijo al submenú `apariencia`:

```tsx
{ id: 'apariencia-ayuda-perfil', label: 'Ayuda de Perfil', icon: <SupportAgentIcon />, path: '/portal-redthread/apariencia/ayuda-perfil' }
```

(`SupportAgentIcon` o `HelpIcon`; verificar import disponible en `@mui/icons-material`.)

### Página

Archivo nuevo: `frontend/src/pages/portal-redthread/apariencia/ayuda-perfil.tsx`.

- Envuelta en `AdminLayout`, datos vía `adminApiClient`.
- Lista de tips: miniatura de imagen (o placeholder si no hay), título, chip de categoría,
  orden con botones ↑/↓, switch activo/inactivo, botones editar/eliminar.
- Botón "Nuevo tip" abre un modal de crear/editar con:
  - Título (texto).
  - Descripción (textarea).
  - Categoría (select; opciones predefinidas `fotos`, `videos`, `seguridad`).
  - Orden (número).
  - Imagen: upload con preview, o campo de URL manual, o ninguno (→ placeholder).
  - Estado activo (switch, default true).
- El switch de activo/inactivo llama a `PUT /{tip_id}`.
- Guardado/confirmaciones siguiendo el estilo de páginas admin existentes (toast/alert simple).

### Tipos compartidos

Archivo nuevo: `frontend/src/types/profileHelp.ts` con la interfaz `ProfileHelpTip`
alineada al modelo backend (incluye `_id` y `created_at`).

## Portal usuario (frontend)

### VisualTipsSheet data-driven

Archivo: `frontend/src/components/profile/VisualTipsSheet.tsx` (se reescribe el cuerpo).

- Nuevo prop: `category?: string` con default `"fotos"`.
- Al abrir (`open === true`), consulta `GET /portal-redthread/apariencia/ayuda-perfil/public?category=<category>`
  vía `apiClient`. Estados:
  - Cargando: spinner.
  - Vacío: mensaje amable ("No hay tips disponibles por ahora").
  - Error: mensaje de error no bloqueante + botón cerrar.
- Cada slide renderiza: `title`, `description` y la imagen única (`image_url`).
  - Si `image_url` existe → `<img>` con `onError` que cae al placeholder.
  - Si no existe → caja placeholder (icono `LightbulbIcon` sobre fondo de acento).
- Se conserva el carrusel actual: swipe horizontal (pointer), dots de navegación,
  botones Anterior/Siguiente, botón "Entendido" que cierra.
- `MediaManager.tsx` no cambia su llamada (`open`/`onClose`); la categoría usa el default.
- Se eliminan las slides hardcodeadas del módulo (su contenido vive ahora en la siembra).

## Verificación

- Frontend: `npx tsc --noEmit` en `frontend/`.
- Backend: levantar/recargar el proceso uvicorn (PID actual 38360 no tiene el código
  nuevo) y validar por curl:
  - `GET /portal-redthread/apariencia/ayuda-perfil/public?category=fotos` → 200 con 3 tips la primera vez.
  - Llamada repetida → sigue devolviendo 3 (siembra idempotente).
  - CRUD admin con token de admin (crear, editar, desactivar, eliminar).
- Sin suite de tests cubriendo estos archivos de forma directa; la verificación es manual vía curl + tsc.

## Riesgos y notas

- El backend en ejecución debe reiniciarse para registrar el nuevo router y modelo.
- La DB activa es la instancia Mongo local (`127.0.0.1:27017`), no el contenedor docker.
- `admin_appearance.py` tiene código duplicado/roto (bloques huérfanos); NO se toca en
  este cambio salvo que sea estrictamente necesario para compilar.
- No se agregan permisiones nuevas a `Permission`; se reutilizan `VIEW_CONFIG`/`EDIT_CONFIG`.