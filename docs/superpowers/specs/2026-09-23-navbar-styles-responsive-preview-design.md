# Navbar Editor — Estilos, Vista Previa Responsiva y Reorganización

Fecha: 2026-09-23
Estado: Diseño aprobado por el usuario
Alcance: /portal-redthread/apariencia/landingPageNavbarAndFooter — pestaña Navbar

## Contexto

Hoy la pestaña Navbar ya fue rediseñada (spec previo) para mostrar una lista compacta de
secciones con badges de completitud, edición en modal con tabs por idioma, mini-preview y
tabla de depuración oculta. Esta iteración sube el nivel: introduce **estilos de navbar**
que se aplican de verdad al navbar público, una **vista previa protagonista** responsiva
arriba, **dos columnas** bien diferenciadas (menús / estilo), secciones **fijas** (candado),
**guardado en transacción única** y un panel de **historial**.

Decisiones confirmadas con el usuario (brainstorm):
- **Render real + persistencia**: los estilos cambian el navbar público (`LandingNavbar.tsx`).
- **Candado editable**: flag `locked` por sección; `Inicio` fija por defecto; el candado
  bloquea eliminar y ocultar, NO editar (traducciones/ruta siguen editables); se alterna manualmente.
- **Guardado en transacción única**: secciones + estilo se persisten juntos al pulsar "Guardar";
  cambios locales no tocan la API hasta ese momento; hay estado "sin guardar" visible.
- **Auditoría**: panel "Historial" reutilizando `AppearanceHistory` y el patrón de `IconHistory.tsx`.
- **Config avanzada funcional acotada**: accent color, grosor tipográfico y animación hover,
  aplicados sobre el estilo activo.
- **Preview responsivo**: 3 resoluciones (Desktop 1280 / Tablet 768 / Móvil 375) con rotación
  autoplay ±4s, play/pausa, badge con resolución activa, sincronizado al idioma de edición.
- **Modo comparativo**: al elegir un estilo, se muestra lado a lado (actual vs seleccionado) y
  un botón "Aplicar" confirma.
- **YAGNI**: se omite snapshots restaurables del historial, se omiten controles de resolución libre.

## Arquitectura

Un único componente renderiza el navbar tanto en el sitio público como en el preview del editor,
garantizando fidelidad total ("lo que ves es lo que hay").

```
                        ┌─────────────────────────────┐
                        │  NavbarRenderer             │  ← nuevo y compartido
                        │  recibe: sections,          │
                        │  currentLang, styleSpec     │
                        └──────────────┬──────────────┘
                 ┌─────────────────────┴─────────────────────┐
                 │                                           │
   ┌─────────────▼──────────────┐            ┌───────────────▼──────────────┐
   │ LandingNavbar (público)    │            │ Preview (editor/admin)       │
   │ carga styleSpec via        │            │ NavbarResponsivePreview      │
   │ getPublicResources         │            │ (mockup + controles)         │
   └────────────────────────────┘            └──────────────────────────────┘
```

### Flujo de datos

- **Style**: el estilo activo es un recurso `AppearanceResource` con
  `type = LANDING_NAVBAR_STYLE` e `is_active = true`. `LandingNavbar` lo lee con
  `appearanceService.getPublicResources(AppearanceType.LANDING_NAVBAR_STYLE)` (público, sin auth,
  mismo patrón que usa hoy con LANDING_NAVBAR). El editor lo lee/guarda con `getResources` /
  `createResource` / `updateResource`.
- **Secciones**: se mantienen como hoy (recursos `landing_navbar`, uno por sección). Se agrega
  el campo `locked` a su `metadata`.
- **Guardado**: la página acumula cambios locales (secciones editadas/creadas/eliminadas,
  reordenadas, estilo elegido) en un estado "working"; al pulsar "Guardar (n)" envía las
  operaciones pendientes (create/update/delete de secciones + upsert del estilo) y limpia el dirty.

## Backend

### 1. Nuevo tipo de apariencia

En `backend/src/models/appearance.py` (enum `AppearanceType`) y
`frontend/src/types/appearance.ts` (enum `AppearanceType`):

```
LANDING_NAVBAR_STYLE = "landing_navbar_style"
```

No requiere validación extra: el modelo `AppearanceResource` acepta `metadata: Dict[str, Any]`.
Los endpoints existentes (`getResources`/`createResource`/`updateResource`/público/historial)
funcionan sin cambios. Se verifica con `python -m py_compile`.

## Frontend

### 2. Tipos y constantes de estilo (nuevo módulo `frontend/src/components/appearance/navbar-editor/styles.ts`)

```ts
export type NavbarStyleId = 'glass' | 'minimal' | 'modern' | 'compact';
export type HoverAnimation = 'lift' | 'underline' | 'glow' | 'none' | 'draw';
export type FontWeightOption = 'regular' | 'medium' | 'semibold' | 'bold';

export interface NavbarStyleSpec {
  id: NavbarStyleId;
  label: string;
  description: string;
  accent: string;          // color de acento (default por estilo)
  fontWeight: FontWeightOption;
  hoverAnimation: HoverAnimation;
  showIcons: boolean;      // derivado del estilo
  underlineOnHover: boolean; // 'modern'
}
```

- `NAVBAR_STYLE_ID_DEFAULT = 'glass'`.
- `NAVBAR_STYLE_OPTIONS: { id, label, description, showIcons, underlineOnHover }[]` — 4 opciones:
  - **glass** (actual): "Estilo actual" — barra glass pil. iconos sí, subrayado no.
  - **minimal**: solo texto, tipografía ligera, sin íconos, sin subrayado.
  - **modern**: íconos + subrayado líquido en hover.
  - **compact**: navbar reducido (más angosto/px menores), ideal móvil.
- `FONT_WEIGHT_OPTIONS: { value, label }[]`, `HOVER_ANIMATION_OPTIONS: { value, label }[]`.
- `getDefaultStyleSpec(id): NavbarStyleSpec` — defaults por estilo (accent rojo RETH `#E63946`,
  fontWeight, hoverAnimation, showIcons, underlineOnHover).
- `mergeStyleSpec(base, overrides)` — para combinar estilo elegido + config avanzada.

### 3. NavbarRenderer — render compartido de los 4 estilos

Nuevo componente `frontend/src/components/appearance/navbar-editor/NavbarRenderer.tsx`.

Props:

```ts
interface NavbarRendererProps {
  sections: NavSection[];        // ya con locked
  currentLang: Language;
  styleSpec: NavbarStyleSpec;
  scrolled?: boolean;            // opcional, default false
  interactive?: boolean;         // default true (en preview false: sin router/scroll)
}
```

Responsabilidades:
- Recibe `sections` y `currentLang`, calcula `visibleNavItems` (misma lógica de fallback).
- Renderiza la estructura base del navbar actual (logo RETH + menú central + idioma + CTA +
  hamburguesa) adaptándola por `styleSpec`:
  - **glass**: comportamiento visual actual (`LandingNavbar.tsx` líneas ~144-296) — glass pill,
    `landingShadows`, `shapeTokens`, blur.
  - **minimal**: sin bg transparente, sin iconos en items, tipografía ligera, menos padding.
  - **modern**: items con icono + `::before`/`underline` animada (borde inferior scaleX hover),
    accent de `styleSpec.accent`.
  - **compact**: `py` reducido, fuente más pequeña, logo sin texto secundario, márgenes menores.
- Hover animation según `styleSpec.hoverAnimation` (lift / underline / glow / none / draw)
  aplicada como variants sobre los `Button` del menú.
- Respeta claves de accesibilidad actuales (`role="menubar"`, `menuitem`, `aria-label`,
  `focus-visible`).
- Un solo lugar define los links: el actual central (hidden <lg) y el drawer (xs). El drawer se
  conserva tal cual (misma estructura) pero se actualizan sus estilos por `styleSpec`.

Esto implica **refactor de `LandingNavbar.tsx`**: extraer el JSX del navbar visible hacia
`NavbarRenderer` manteniendo en `LandingNavbar` la carga de datos (navSections, logo, styleSpec),
el drawer, el LanguageSelectorModal y el estado scroll. La carga del styleSpec:

```ts
// en LandingNavbar
const fetchStyleSpec = useCallback(() => {
  appearanceService
    .getPublicResources(AppearanceType.LANDING_NAVBAR_STYLE)
    .then((resources) => {
      const active = resources.find((r) => r.is_active && r.metadata?.id);
      if (active?.metadata?.id) setStyleSpec(mergeStyleSpec(getDefaultStyleSpec(active.metadata.id), active.metadata));
    })
    .catch(() => {});
}, []);
```

### 4. NavbarSectionFormData / NavSection — campo `locked`

En `frontend/src/components/appearance/navbar-editor/types.ts`:
- `NavSection.locked: boolean` (default false).
- `NavSectionFormData.locked: boolean`.
- `DEFAULT_SECTIONS`: `home` con `locked: true`, resto `locked: false`.
- `mapResourceToSection` (en la página) lee `locked: meta.locked ?? false`.
- `mapSectionToResource` incluye `locked: s.locked`.

En `NavbarSectionDialog.tsx` (campos generales): un `Switch` "Sección fija (no se puede eliminar
ni ocultar)" que edita `formData.locked`. Sincronizado con lógica de sección.

### 5. Panel de historial

Nuevo componente `frontend/src/components/appearance/navbar-editor/NavbarHistory.tsx` siguiendo
el patrón de `IconHistory.tsx` (tabla Fecha/Acción/Usuario/Contexto, `getActionColor`, botón
"Limpiar Historial" con `appearanceService.clearHistory()`). Diferencias:
- Filtra por los `resourceId` de las secciones y del recurso de estilo (o sin filtro: traer
  historial completo del namespace).
- Se carga con `appearanceService.getHistory()` al abrir la pestaña Historial, ordenado por
  `timestamp` descendente. Filtro: se trae el historial completo y se filtra client-side por los
  `resource_id` de las secciones actuales + el `resource_id` del estilo (si existe), para no
  ensuciar con otros namespaces; si no hay ids, se muestra vacío con mensaje.

### 6. NavbarSectionList — candado + estado dirty

En `NavbarSectionList.tsx`:
- Mostrar icono `Lock`/`LockOpen` según `section.locked` (con `Tooltip`: "Sección fija — no se
  puede eliminar u ocultar").
- Deshabilitar botones eliminar y visibilidad (con tooltip explicativo) si `section.locked`.
- Mostrar chip/badge `⚠` de traducción faltante (ya existe via `completionStatus`).
- Prop nuevo `onToggleLock(section)` y `locked` en el model.

### 7. Vista previa protagonista — NavbarResponsivePreview

Nuevo componente `frontend/src/components/appearance/navbar-editor/NavbarResponsivePreview.tsx`
que reemplaza a `NavbarMiniPreview.tsx` (se borra el archivo viejo).

- Props: `{ sections, currentLang, styleSpec, onStyleChange }`.
- **Resoluciones**: `[{ id: 'desktop', label: 'Desktop', width: 1280, heightTall: true },
  { id: 'tablet', label: 'Tablet', width: 768 }, { id: 'mobile', label: 'Móvil', width: 375 }]`.
- **Controles** (barra superior del preview):
  - Segmented de resolución (Desktop/Tablet/Móvil) con badge mostrando `1280px`/`768px`/`375px`.
  - Botón play/pausa: cuando está en play, rota entre resoluciones cada 4s (setInterval,
    cleanup en unmount); al pausar se queda en la resolución activa.
  - Selector de idioma (vínculo al `currentLang` de la página).
- **Mockup**: dentro de un marco tipo navegador (barras de ventana + URL), el ancho del contenedor
  interna se ajusta a la resolución activa (max-width proporcional, con overflow visible y
  centrado), y dentro se renderiza `NavbarRenderer` con `scrolled={true}`, `interactive={false}`,
  sobre fondo degradado oscuro tipo landing.
- Móvil/tablet: se muestra la hamburguesa (por el breakpoint xs de Developer) — la barra central
  se oculta naturalmente.
- **Modo comparativo**: si `styleSpec.id !== savedStyle.id` (estilo pendiente sin aplicar),
  renderizar dos mockups lado a lado: "Estilo actual" (savedStyle) y "Seleccionado" (draft),
  sobrecumplidos con etiquetas; debajo del selector de estilos se coloca el botón "Aplicar".
  El comparativo se da en la propia `NavbarResponsivePreview` cuando `showCompare` esté activo
  (estado de la página) — ver sección 8.

### 8. Página — layout dos columnas + transacción única + tabs

En `landingPageNavbarAndFooter.tsx`, dentro de `activeTab === 0` (Navbar):

```
┌───────────────────────────────────────────────────────────────┐
│ NavbarResponsivePreview  (ancho completo, arriba, sticky-lite) │
│ controles: resolución | play/pausa | idioma | badge resolución│
└───────────────────────────────────────────────────────────────┘
┌─────────────────────────────┬─────────────────────────────────┐
│ Col 1 — Administración      │ Col 2 — Estilo del navbar       │
│ NavbarSectionList (+lock)   │ cards de 4 estilos (comparativa) │
│ + botones dirty             │ + panel Avanzado (colapsable)    │
│ Agregar Sección             │ accent / fontWeight / hover      │
└─────────────────────────────┴─────────────────────────────────┘
```

- **Estado nuevo** (además de los actuales `sections`/`currentLang`/etc.):
  - `styleDraft: NavbarStyleSpec` — estilo en edición (working).
  - `styleSaved: NavbarStyleSpec` — estilo persistido.
  - `pendingOps` internos derivados: secciones se mutan en el estado `sections` local y se
    comparan con un `sectionsSnapshot` al guardar (así determinamos creates/updates/deletes).
  - `saving`, `dirtyCount`.
  - `showCompare` (bool) — activa el modo comparativo al seleccionar un estilo distinto.
  - `showAdvanced` (bool) — panel Avanzado colapsable.
- **Handlers**:
  - `selectStyle(id)`: setea `styleDraft` con `getDefaultStyleSpec(id)` + configura advanced
    previa, marca dirty, activa `showCompare` si `id !== styleSaved.id`.
  - `applyStyle()`: `styleSaved = styleDraft;` (se persiste con el save global).
  - `saveAll()` (transacción): calcula creates (secciones sin `id` **o cuyo id empiece por `default-`**
    — los defaults generados localmente no tienen recurso backend), updates (id real con cambios,
    incluido `order`/`locked`), deletes (ids reales dif entre snapshot y working) y, si
    `styleDraft` difiere de `styleSaved` o no hay recurso estilo, crea/actualiza el recurso
    `LANDING_NAVBAR_STYLE`. Ejecuta con `Promise.all` por grupos; snackbar de éxito/error;
    refresca snapshot y `fetchSections`.
  - `deleteSection`, `toggleVisibility`, `handleReorder`, `onSaveNavSection` ya existentes se
    mantienen pero **ya no llaman a la API directamente**: solo mutan estado local + `dirtyCount`.
    El guardado real ocurre en `saveAll`.
- **Barra de estado**: chip "n cambios sin guardar" + botón sticky "Guardar (n)" (disabled en 0),
  además del "Agregar Sección Navbar".
- La carga inicial (`fetchSections`) ya debe leer `locked` de la metadata; `fetchStyle` carga el
  recurso estilo.
- Se conserva: el fetch de footer, el tab Footer, el Snackbar, la tabla de depuración tras el
  "Modo depuración" (con `locked` visible), y el NavbarSectionDialog.

### 9. Verificación

- Backend: `python -m py_compile` en `backend/src/models/appearance.py`.
- Frontend: `npx tsc --noEmit` y `npm run build` en `frontend/`.
- ESLint en archivos nuevos: sin errores nuevos (warnings de `detect-object-injection` son el
  estándar del repo y se aceptan).
- Manual: cambiar estilo → comparativa → Aplicar → Guardar → recargar landing y/o visto público
  para confirmar el estilo aplicado; probar candado (no se puede borrar Inicio), traducción de
  secciones, rotación de resoluciones, historial.

## Archivos a crear

1. `frontend/src/components/appearance/navbar-editor/styles.ts` (tipos/constantes estilo).
2. `frontend/src/components/appearance/navbar-editor/NavbarRenderer.tsx` (render compartido).
3. `frontend/src/components/appearance/navbar-editor/NavbarResponsivePreview.tsx` (preview).
4. `frontend/src/components/appearance/navbar-editor/NavbarHistory.tsx` (historial).

## Archivos a modificar

1. `backend/src/models/appearance.py` (+ enum LANDING_NAVBAR_STYLE).
2. `frontend/src/types/appearance.ts` (+ enum LANDING_NAVBAR_STYLE).
3. `frontend/src/components/landing/LandingNavbar.tsx` (refactor → usa NavbarRenderer + carga styleSpec).
4. `frontend/src/components/appearance/navbar-editor/types.ts` (+ locked; + helpers si hacen falta).
5. `frontend/src/components/appearance/navbar-editor/NavbarSectionList.tsx` (candado/dirty).
6. `frontend/src/components/appearance/navbar-editor/NavbarSectionDialog.tsx` (+ locked switch).
7. `frontend/src/components/appearance/navbar-editor/NavbarMiniPreview.tsx` (DELETE → reemplazado).
8. `frontend/src/pages/portal-redthread/apariencia/landingPageNavbarAndFooter.tsx` (layout, transacción, tabs).

## Riesgos / notas

- **Fidelidad de estilos**: como `NavbarRenderer` es compartido, el preview siempre es exacto.
  Mantener el drawer y el modal de idioma fuera del renderer (responsabilidad de LandingNavbar).
- **Transacción única**: cambia el comportamiento actual (persistencia inmediata por operación).
  El usuario lo eligió explícitamente. Requires que `deleteSection` deje de hacer
  `window.confirm`+API hasta el save (mantener confirm, pero marcar para borrar).
- **Historial**: sin filtro por namespace se mostrará todo; se prefiere filtrar por resource ids
  de secciones + style para no ensuciar. Si por tema de simetría es más simple traer todo, se
  documenta en el código.
- **Autoplay**: recordar `useEffect` cleanup del intervalo con la resolución activa como dep.