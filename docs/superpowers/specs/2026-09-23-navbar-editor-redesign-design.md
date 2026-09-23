# Rediseño del editor de secciones del Navbar (landing)

Fecha: 2026-09-23
Estado: Aprobado (diseño validado en brainstorm)

## Objetivo

Rediseñar la pestaña "Navbar" de la página admin `portal-redthread/apariencia/landingPageNavbarAndFooter.tsx`.
Hoy la vista muestra una tabla extensa con las traducciones de 20 idiomas por sección (parecido a un JSON
visualizado), útil para depuración pero no para edición diaria. Se reemplaza por una lista compacta
centrada en la interacción: lista de secciones, edición contextual con tabs por idioma, validación,
feedback visual y preview en tiempo real.

Decisiones tomadas en brainstorm:

- El rediseño aplica **solo a la pestaña Navbar**. La pestaña Footer no se toca (se planifica a futuro).
- Los **20 idiomas** de `supportedLanguages` cuentan para el badge de completitud y se editan en el modal.
- El preview es un **mini-preview embebido** dentro de la página admin, actualizado en vivo (sin fetch).
- La tabla de depuración actual se **oculta tras un toggle** "Modo depuración" (no se elimina).

## Alcance

Este spec cubre:

1. Componentes nuevos `frontend/src/components/appearance/navbar-editor/`:
   - `NavbarSectionList.tsx` — lista compacta sortable de secciones.
   - `NavbarSectionDialog.tsx` — modal de edición con tabs por idioma.
   - `NavbarMiniPreview.tsx` — barra de navbar presentacional en vivo.
2. Refactor de `landingPageNavbarAndFooter.tsx` (orquesta estado/fetch/save y usa los componentes).

No incluye: rediseño del Footer, cambios en el navbar público `LandingNavbar.tsx`, ni cambios en el backend.

## Estado actual (referencia)

- `landingPageNavbarAndFooter.tsx` (734 líneas) hoy:
  - Subtabs Navbar/Footer.
  - Subtab "Lista de Secciones": DnD sortable incluye una línea con TODAS las traducciones
    (`ES: Inicio | EN: Home | PT: ...`) → saturado.
  - Subtab "Traducciones": tabla con una columna por idioma (20) → el "JSON visualizado".
  - Dialog único que muestra las 20 traducciones a la vez en grid.
- `NavSection`: `{ id, key, route, icon, visible, order, translations: Record<Language,string> }`.
- Fetch: `appearanceService.getResources(AppearanceType.LANDING_NAVBAR)`, fallback a `DEFAULT_SECTIONS`.
- Save: `createResource`/`updateResource` por sección.
- Reorder: dnd-kit `arrayMove` + persiste `order` en cada recurso.
- Idiomas: `LANGUAGES = supportedLanguages.map(l => l.code)` (20). Solo es/en/pt/fr traducidos por defecto.

## Componentes nuevos

### `NavbarSectionList.tsx`

Lista compacta, mantiene el DnD de orden existente (dnd-kit + `useSortable`).

Cada item (Paper) muestra:

- Ícono real de la sección (resuelto vía `ICON_OPTIONS`) en un chip.
- Nombre base (`key`).
- Badge de idioma principal: `EN: Home` — etiqueta resuelta con `getTranslationFallback(translations, currentLang)`
  y el código del idioma que la provee.
- Badge de completitud:
  - Verde ✅ si los 20 idiomas tienen traducción no vacía.
  - Rojo ⚠️ si falta alguno (tooltip enumerando los idiomas faltantes).
- Acciones:
  - 👁 visibilidad (`toggleVisibility`, existe hoy).
  - ✏️ editar → abre `NavbarSectionDialog`.
  - 🗑️ eliminar (`deleteSection`, existe hoy).
- Tooltip en hover con las traducciones rellenas (`es: Inicio · en: Home · ...`).

Props: `sections`, `currentLang`, `onEdit(section)`, `onDelete(id)`, `onToggle(section)`, `onReorder(newSections)`.
El DnD y la persistencia de orden los sigue orquestando la página.

### `NavbarSectionDialog.tsx`

Modal de edición/creación (reemplaza el `Dialog` actual). Reutiliza `NavSectionFormData`.

- Sección "General" (siempre visible arriba):
  - Clave (`key`), ruta (`route`), ícono (select `ICON_OPTIONS`), visible (switch).
  - Validación: key y route no vacías; longitud máx 60 (key y route).
- Tabs scrollables por idioma (20 tabs, `variant="scrollable"` "auto", con `Label` y `PROGRESS` badge):
  - Cada tab tiene una label del idioma con indicador de estado (relleno/vacío).
  - Input de traducción por tab con validación: no vacío y longitud máx 60.
  - Tabs ordenados como `LANGUAGES`; el orden no es importante para el usuario.
- Botones Cancelar / Guardar.
- Feedback: en la página (Snackbar) tras guardar: "Sección EN actualizada"/"Falta traducción en pt".

Props: `open`, `section` (null = nueva), `onClose()`, `onSave(formData, id?, order?)`.
La página conserva la lógica de `mapSectionToResource` + `createResource`/`updateResource` + validación
"todos los idiomas" (existente).

### `NavbarMiniPreview.tsx`

Barra navbar estilo glass, presentacional, sin fetch. Pié de la pestaña Navbar.

- Renderiza logo placeholder, botones de navegación (solo `visible`), selector de idioma (no funcional),
  CTA y hamburguesa (responsive), envuelto en un marco tipo mini-navegador con rótulo "Vista previa".
- Props: `sections`, `currentLang`.
- Se actualiza en vivo: al cambiar el idioma de edición y al guardar (usa las secciones en memoria).

## Página (landingPageNavbarAndFooter.tsx)

Se conserva como orquestadora. Cambios:

- Elimina la subtab "Traducciones" de la lista; la tabla de 20 columnas queda en un `Collapse`
  controlado por un toggle "Modo depuración" (checkbox/ícono en el header de la lista).
- La subtab de Navbar pasa a: `NavbarSectionList` + toggle depuración + `NavbarMiniPreview`.
- Dialog reemplazado por `NavbarSectionDialog`.
- Se mantienen: estado, fetch, save, delete, toggle visibility, reorder, Snackbar, selector `currentLang`.
- Se elimina la línea de traducciones del item sortable (ahora Badge + tooltip).

## Validación y feedback

- Guardar también valida clave/ruta obligatorias y traducción en los 20 idiomas (ya existía).
- Longitud máx 60 en key, route y cada traducción (informativo, no bloqueante en input; bloqueante en guardar).
- Snackbar: éxito ("Sección guardada", "Traducción EN actualizada"), advertencia (faltan traducciones),
  error (fallo de API).

## Testing

- `npx tsc --noEmit` y `npm run build` en `frontend/`.
- Prueba manual del flujo: cargar lista, editar una sección (tabs por idioma), guardar, ver preview
  actualizado, alternar visible, eliminar, reordenar por DnD, toggle modo depuración, snackbars.

## Fuera de alcance (futuro)

- Rediseño de la pestaña Footer con el mismo patrón.
- Cambios en el navbar público real (`LandingNavbar.tsx`).
- Backend (no requiere cambios).