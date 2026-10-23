# Spec: Unificación del sistema de diseño RETH v3 (Liquid Glass + marco Apple/Meta/Google)

Fecha: 2026-10-23
Estado: diseño aprobado por el usuario (secciones 1–3, chat)
Alcance: documentación + tokens + auditoría UI priorizada (sin fixes masivos de pantallas en esta fase)

## Problema

El sistema de diseño de RETH tiene tres fuentes que ya no coinciden:

1. `docs/UX_UI_STYLE_GUIDE.md` (era 2026-09-10) declara **azul `#2563EB` primario** y rojo `#E63946` solo como acento emocional.
2. `docs/design/design-dna.json` (v2, 2026-09-14, paleta bloqueada) declara **rojo `#E63946` primario** y azul/violeta/dorado como acentos narrativos.
3. El código (`frontend/src/theme/liquidGlass.ts`, `frontend/src/styles/glass.ts`) sigue el DNA en color, pero divergió en forma, motion y restos de la era rosa.

Evidencia del estado actual:

- **192 de 522** archivos TS/TSX contienen hex crudos; solo **3** usan los helpers de vidrio.
- `glass.ts` usa radius 12 por defecto (la guía pide 28 para cards), hover `-4px` (guía: `-6px`) y morph de radio a 12 (debería ser 28→24 en cards).
- `pillPrimary()` sigue emitiendo el gradiente azul como acción primaria.
- Quedan restos de la identidad rosa: `#3B1C2A`, `#6E5560`, sombras `rgba(88,8,34,...)` y `rgba(255,0,80,...)`.
- La guía dice **MUI 6**; `frontend/package.json` usa **MUI 9.5**.
- La guía define 4 breakpoints y max 1200px; el código ya soporta 8 breakpoints (280–1920, foldables) y max 1600px.
- El modo oscuro del vidrio no coincide: guía `rgba(43,47,54,0.55)`, código `rgba(26,27,30,0.55)`.
- El saturate del vidrio no coincide: guía 160%, helper 150%.

El resultado es deriva visual: cada pantalla interpreta el sistema a su manera y los fixes futuros son caros.

## Objetivo

Crear una sola verdad de diseño, integrar explícitamente los patrones de referencia de **Apple, Meta y Google** y producir una auditoría accionable del núcleo de usuario, sin rediseñar toda la app en esta fase.

## Decisiones aprobadas

1. **Alcance:** documentación + tokens + auditoría priorizada. Los fixes de pantalla se ejecutan en un plan posterior.
2. **Primario:** rojo `#E63946`. La guía antigua se corrige; la paleta v2 del DNA se respeta.
3. **Cobertura de auditoría:** landing, home, discover, perfil, chat + shell compartido (Navbar/Sidebar/layout).
4. **Prioridades:** consistencia, sensación premium/craft, usabilidad social, accesibilidad/rendimiento y legibilidad/densidad móvil.
5. **Enfoque:** contrato de diseño → tokens → auditoría (enfoque A).
6. **Jerarquía de verdad:** `design-dna.json` (tokens) > `UX_UI_STYLE_GUIDE.md` (reglas) > `UX_UI_AUDIT.md` (estado real) > referencias externas. Apple/Meta/Google inspiran; nunca sobrescriben la identidad RETH.
7. **Layout canónico:** se adopta el layout que ya soporta el código (8 breakpoints, max 1600px) y se actualizan guía/DNA. Se mapea a window classes de Material 3.
8. **Stack canónico:** MUI 9 (versión real del proyecto), no MUI 6.
9. **Hex crudo:** prohibido en features. Permitido solo en `theme/`, `styles/`, tests y assets de marca.
10. **Fuera de alcance:** admin/backoffice, reescritura masiva de los 192 archivos con hex, cambio de paleta, reemplazo de MUI, dependencias nuevas.

## Marco de referencia (contrato)

| Fuente | Adoptamos | Adaptamos | Rechazamos |
|---|---|---|---|
| **Apple (HIG / Liquid Glass)** | Claridad, deferencia al contenido, profundidad por materiales, tipografía precisa, motion con propósito, targets ≥44px, reduced-motion | La receta de vidrio ya es RETH; los orbes son la luz ambiental. Sin clonar chrome de iOS | SF como fuente obligatoria, navegación iOS literal, translucidez en todo |
| **Meta (social UX)** | Densidad escaneable, anatomía de card (media→identidad→contenido→acciones), clusters de acción, bottom nav móvil, feedback optimista, skeletons | Reacciones y social proof filtrados por el tono calmado de RETH | Infinite scroll oscuro, spam de notificaciones, métricas que rompen la calma |
| **Google (Material 3)** | Tokens semánticos, state layers (hover/focus/pressed), window size classes, estados accesibles, foco visible | Paleta tonal → rojo RETH; elevación por vidrio/sombra, no por capas tonales; MUI como base | FAB por defecto, Material You dinámico, superficies tonales pesadas, Roboto como fuente de marca |

**Reglas transversales del contrato:**

- Acción primaria única por vista; el resto son secundarias o de acento.
- Toda pantalla define: jerarquía, estados vacío/loading/error, comportamiento móvil y fallback de reduced-motion.
- Estados interactivos unificados: hover 8%, focus 12%, pressed 12%; foco visible con ring de 2px y offset 3px.
- Motion con feel Apple pero tokens RETH: `140/280/640ms`, `cubic-bezier(0.22, 1, 0.36, 1)`.
- Color nunca como único indicador; estado también por icono, texto o forma.
- Si un patrón externo choca con la identidad RETH, gana RETH.

## Arquitectura de tokens

### Color

| Rol | Token | Valor |
|---|---|---|
| Primario | `primary` | `#E63946` |
| Primario hover/activo | `primaryLight` | `#FF6B6B` |
| Primario crítico | `primaryDark` | `#B71C1C` |
| Secundario / grafito | `secondary` | `#2B2F36` |
| Acento narrativo azul | `accent` | `#3B82F6` |
| Acento narrativo violeta | `accentViolet` | `#7F4CA5` |
| Acento narrativo dorado | `accentGold` | `#efb810` |
| Éxito | `success` | `#16A34A` |
| Advertencia | `warning` | `#D97706` |
| Error | `error` | `#E63946` |
| Info | `info` | `#3B82F6` |

Regla de contraste: `#E63946` (≈4.05:1 sobre blanco) se usa en rellenos, iconos, badges y UI grande; texto pequeño rojo usa `#B71C1C`. `#3B82F6` (≈3.7:1) nunca es texto pequeño; usa `#2563EB`/`#1D4ED8`.

### Superficies y vidrio

- Claro: `rgba(255,255,255,0.62)` card, `rgba(255,255,255,0.82)` elevated, `rgba(255,255,255,0.72)` strong.
- Oscuro: `rgba(26,27,30,0.55)` card, `rgba(26,27,30,0.72)` elevated (canon del código v2).
- Receta de 5 capas: transparencia + `backdrop-filter: blur(20px) saturate(160%)` + borde 1px de luz + highlight interior/sombra + radius generoso.
- Degradación: en `prefers-reduced-motion` o `hardwareConcurrency ≤ 2`, reemplazar blur por superficie opaca `rgba(255,255,255,0.92)` (oscuro: `rgba(26,27,30,0.92)`) y congelar orbes.
- Regla de oro: sin luz ambiental detrás, no hay vidrio. Sobre fondo plano se degrada a superficie sólida.

### Tipografía

- Display/headings: Poppins 600/700. Body/UI: Inter 400/500/600.
- Escala: `display 4.5rem` → `overline 0.75rem`, con tracking documentado en el DNA.
- Dancing Script permanece retirada del sistema UI.

### Forma, espaciado y layout

- Radios: `sm 12`, `md 20`, `lg 28`, `pill 999`.
- Controles: pill o md. Cards: lg. Inputs: md. Chips: pill.
- Spacing base 8px; escala `4/8/12/16/24/32/40/48/64/96`.
- Grid 12 columnas; max content 1600px; gutters 16/24/32.
- Breakpoints canónicos: `280, 360, 540, 768, 1024, 1280, 1440, 1920`.
- Window classes Material 3 adaptadas a los breakpoints RETH: compact `<768` (280/360/540), medium `768–1023`, expanded `≥1024` (1024/1280/1440/1920).

### Movimiento

| Token | Valor |
|---|---|
| `ease-liquid` | `cubic-bezier(0.22, 1, 0.36, 1)` |
| `ease-enter` | `cubic-bezier(0.16, 1, 0.3, 1)` |
| `dur-micro` | 140ms |
| `dur-normal` | 280ms |
| `dur-macro` | 640ms |

- Entradas: ascenso líquido `translateY(24px) + scale(0.98) + blur(6px)→sharp`, stagger 60ms (hero) / 140ms (cards).
- Salidas: `fade + scale(0.98)`, 160ms.
- Hover CTA: `translateY(-2px)` + glow; active `scale(0.98)`; focus ring 2px offset 3px.
- Prohibido: easing lineal por defecto, bounce juguetón, micro-interacciones ≥1s.
- Reduced motion: fades simples, sin blur animado ni desplazamientos.

### Patrones sociales (Meta adaptado)

- **Card:** media → identidad (avatar, nombre, timestamp) → contenido → acciones. Una sola acción primaria; acciones secundarias agrupadas.
- **Feed:** skeletons en carga inicial y paginación; sin saltos de layout.
- **Bottom nav móvil:** top-level únicamente, altura 64px + safe area, máximo 5 destinos.
- **Feedback optimista:** like/follow/reaction actualiza de inmediato y revierte con aviso si falla.
- **Densidad:** comfortable; no se comprime para meter más métricas.

### Iconografía y accesibilidad

- Phosphor outline, stroke 1.8; tamaños 16/20/24/32/48; fallback Heroicons.
- Target táctil mínimo 44×44 (web ≥40px con padding suficiente).
- Contraste AA 4.5:1 en texto normal medido sobre la superficie real.
- Focus visible en todo interactivo; landmarks y jerarquía semántica de títulos.

## Cambios de código en esta fase

### `docs/design/design-dna.json` v3

- Añadir `reference_framework` con las tres fuentes y la tabla adoptar/adaptar/rechazar.
- Añadir `state_layers`, `focus`, `window_classes` y `social_patterns`.
- Reconciliar layout (8 breakpoints, max 1600) y modo oscuro del vidrio con el código.
- Mantener `palette_locked: true` y el rojo primario.

### `docs/UX_UI_STYLE_GUIDE.md` v3

- Corregir primario a rojo y degradar azul/violeta/dorado a acentos narrativos.
- Corregir tabla de componentes (botón primario rojo; azul solo acento).
- Actualizar stack a MUI 9, breakpoints y max width.
- Añadir sección de marco de referencia, state layers, anatomía social, bottom nav y skeletons.
- Eliminar criterios obsoletos de la era azul.

### `frontend/src/theme/liquidGlass.ts`

- Mantener la paleta roja.
- Añadir/exponer tokens semánticos de estado, foco, superficies y window classes.
- Eliminar restos rosa en `landingTypography` (`#3B1C2A`, `#6E5560`) y `landingShadows.card` (`rgba(88,8,34,...)`, `rgba(255,0,80,...)`).
- Alinear dark glass a `rgba(26,27,30,...)`.

### `frontend/src/styles/glass.ts`

- `glassSurface`: radius por defecto `20` (md), saturate 160%, dark glass `rgba(26,27,30,...)`.
- `glassHover`: `translateY(-6px)` por defecto; sin morph de radio global.
- Nuevo helper `glassCard()`: radius 28, hover 28→24, `-6px`, sheen.
- `pillPrimary()`: gradiente rojo `#E63946→#B71C1C`, glow rojo.
- `BLUE_GRADIENT` se conserva solo como helper de acento, nunca como acción primaria.
- Eliminar restos de la era rosa.

### Tests

- Actualizar `frontend/src/theme/__tests__/liquidGlass.test.ts`.
- Añadir paridad DNA↔TS: primario rojo, sin azul primario, sin rosa legado, radios/estados/foco correctos.
- Añadir tests de `glassSurface`, `glassHover` y `glassCard`.

## Auditoría UI

### Superficies

Landing (`pages/index.tsx` + `components/landing`), home (`pages/home`), discover (`pages/discover` + `components/discovery`), perfil (`pages/profile` + `components/profile`), chat (`pages/chat` + `components/chat`) y shell compartido (`components/layout`, Navbar/Sidebar).

### Ejes por pantalla

1. Tokens: hex crudo, radios, spacing, tipografía.
2. Jerarquía: acción primaria única, foco visual, composición.
3. Estados: vacío, loading, error, disabled, hover/focus/pressed.
4. Patrones sociales: card, bottom nav, densidad, skeletons.
5. Accesibilidad: contraste AA real, focus visible, labels, targets ≥44px.
6. Rendimiento/motion: uso de blur, `prefers-reduced-motion`, duraciones.

### Severidad

- `P0`: bloqueante (accesibilidad o flujo roto).
- `P1`: inconsistencia visible con el contrato.
- `P2`: pulido.

### Formato de `docs/UX_UI_AUDIT.md`

Tabla por superficie con: ID, archivo/línea, hallazgo, eje, severidad, fix propuesto, token/helper recomendado.

## Entregables

1. `docs/UX_UI_STYLE_GUIDE.md` v3.
2. `docs/design/design-dna.json` v3.
3. `docs/UX_UI_AUDIT.md` nuevo.
4. `docs/UX_UI_BACKLOG.md` reconciliado (cerrar/actualizar ítems obsoletos, añadir hallazgos).
5. `liquidGlass.ts`, `glass.ts` y tests actualizados.
6. Este spec y, después, el plan de implementación.

## Criterios de aceptación

- [ ] Una sola declaración de primario (`#E63946`) en guía, DNA y código.
- [ ] Paridad DNA↔TS cubierta por tests verdes.
- [ ] Sin restos de la era rosa en tokens/helpers (`#3B1C2A`, `#6E5560`, `rgba(255,0,80,...)`, `rgba(88,8,34,...)`).
- [ ] `glassSurface`/`glassHover`/`glassCard` respetan radios, hover y saturate del contrato.
- [ ] Auditoría de las 5 superficies + shell con hallazgos accionables y archivo/línea.
- [ ] Backlog sin criterios obsoletos (azul primario, MUI 6, 4 breakpoints, max 1200).
- [ ] `npm run lint`, `npm run typecheck` y `npm test` verdes en `frontend/`.

## Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| El alcance crece hacia arreglar todas las pantallas | La auditoría prioriza; los fixes van a un plan posterior |
| Los temas visuales legados (`VisualTheme`) contradicen la paleta bloqueada | Se documenta la deuda y se revisa en la auditoría; no se eliminan en esta fase |
| El cambio de defaults de `glass.ts` rompe consumidores | Tests de helpers + revisión de los 3 consumidores actuales |
| La auditoría se vuelve opinión | Checklist de 6 ejes + severidad + referencia a archivo/línea |
| Docs vuelven a divergir | Paridad DNA↔TS en tests y una sola fuente para tokens |

## Fuera de alcance

- Admin/backoffice y pantallas secundarias.
- Reescritura masiva de hex en features.
- Rediseño de flujos o arquitectura de información.
- Cambios de paleta, tipografía o stack.
- Nuevas dependencias.
