# RedThread — Backlog de UI/UX (era Liquid Glass)

> Fuente de verdad de diseño: `docs/UX_UI_STYLE_GUIDE.md` + `docs/design/design-dna.json`.
> Mockup de referencia: `docs/design/mockups/root-portal.html` (abrir en navegador).
> Pendiente: migrar a Issues reales de GitHub (`gh issue create`) cuando exista token.

**Prioridad (P0 → P2):** P0 = sin esto no arranca la nueva era; P1 = valor visible inmediato; P2 = pulido/perf.

---

## UI-001 · Tema MUI 6 con tokens Liquid Glass
- **Labels:** `frontend`, `design`, `P0`
- **Contexto:** Crear el tema MUI 6 (`createTheme`) que emita los tokens del DNA como CSS variables en `:root` y mapera a las props de MUI.
- **Criterios de aceptación:**
  - [ ] `palette.primary` = `#2563EB`, `palette.error` = `#E63946`, neutros desde escala `--n-*`.
  - [ ] `typography` = Poppins (display/headings) + Inter (body), escala rem del DNA.
  - [ ] `shape.borderRadius` = 20, breakpoints 375/768/1024/1440.
  - [ ] Todos los tokens disponibles como CSS variables (un único origen: `design-dna.json`).
  - [ ] Modo oscuro `#1A1B1E` con superficies glass ocuras como diseñado.

## UI-002 · Landing `/`: hero en vidrio líquido
- **Labels:** `frontend`, `design`, `P0`
- **Contexto:** Reemplazar el gradiente rosa (`#881337→#FB7185`) y la cursiva Dancing Script de `frontend/src/pages/index.tsx` por el hero del mockup: orbes de luz, título palabra a palabra (blur→sharp), CTAs (primario azul / vidrio), chips de stats.
- **Criterios de aceptación:**
  - [ ] Retirada total de Dancing Script y del gradiente rosa del sistema UI.
  - [ ] CTAs primarios `#3B82F6→#2563EB`; acento emocional `#E63946` solo en momentos con significado.
  - [ ] Título con entrada palabra a palabra viaje + `prefers-reduced-motion` (fade simple).
  - [ ] Parallax de los elementos flotantes (UFOs) en 2 capas, sin librería.
  - [ ] Conversión de texto a `react-i18next` (ES/EN), replicando el toggle del mockup.

## UI-003 · Navegación glass flotante + selector de idioma
- **Labels:** `frontend`, `design`, `P1`
- **Contexto:** Píldora flotante `glass-strong` (blur 24, filo blanco, radius 999) con logo SVG del nudo, enlaces, selector segmentado ES/EN y botones Entrar/Unirme.
- **Criterios de aceptación:**
  - [ ] Sticky con `backdrop-filter: blur(24px) saturate(170%)`.
  - [ ] Selector de idioma segmentado con `aria-pressed` y comportamiento real en `react-i18next`.
  - [ ] Focus visible (ring azul 2px, offset 3px) y target táctil ≥ 40px.
  - [ ] Colapsa enlaces en móvil (≤900px) sin romper el layout.

## UI-004 · Cards de features con morphing y sheen
- **Labels:** `frontend`, `design`, `P1`
- **Contexto:** 4 tarjetas glass del mockup: Smart Match, Chat, Radar, Multi-intenciones; iconos Phosphor.
- **Criterios de aceptación:**
  - [ ] Recipe de vidrio completa (transparencia + blur 20/saturate 160% + filo + highlight interior + radius 28).
  - [ ] Hover: `translateY(-6px)` + `radius 28→24` + blur 20→18 + sombra high (morphing) y sheen diagonal al 8%.
  - [ ] Iconos Phosphor (stroke 1.8) dentro de tiles azul/rojo; `aria-hidden` decorativos.
  - [ ] Revelado al scroll escalonado (stagger 140ms) con IntersectionObserver.

## UI-005 · Banda CTA + footer glass
- **Labels:** `frontend`, `design`, `P1`
- **Contexto:** Panel glass grande (radius lg, blur 32) con orbes embebidos, hilo SVG decorativo (rojo + azul) y botón destino "Quiero enamorarme"; footer en píldora glass.
- **Criterios de aceptación:**
  - [ ] Botón destino usa `#E63946→#B4232C`, solo para acción emocional.
  - [ ] Hilo SVG animado (stroke balanceado) sin interrumpir lectura.
  - [ ] Footer: brand + enlaces legales + copyright, glass-strong.
  - [ ] Todo respeta contraste AA sobre vidrio real (no blanco puro).

## UI-006 · Motion tokens + sistema de animación
- **Labels:** `frontend`, `design`, `P1`
- **Contexto:** Tokenizar motion en CSS vars (`--ease-liquid`, `--ease-enter`, duraciones 140/280/640ms) y crear helpers (reveal-on-scroll, split-words) reutilizables para las demás páginas (`/home`, etc.).
- **Criterios de aceptación:**
  - [ ] Accesibles como utilidades en `frontend/src/styles` o componentes propios (sin añadir librería si la capa CSS basta).
  - [ ] `prefers-reduced-motion` reduce todo a fades simples (nada de blur animado/desplazamientos).
  - [ ] Prohibido: easing lineal por defecto, bounce juguetón, dur ≥ 1s en micro-interacciones.

## UI-007 · Contraste y accesibilidad (audit axe)
- **Labels:** `accessibility`, `design`, `P1`
- **Contexto:** El rojo `#E63946` (4.1:1) y azul `#3B82F6` (3.7:1) son degradados a `#B4232C`/`#2563EB` para texto pequeño. Verificar en navegador real sobre los fondos reales.
- **Criterios de aceptación:**
  - [ ] Audit axe sin criticals en la landing.
  - [ ] Contraste ≥ 4.5:1 en texto normal medido sobre las superficies glass reales.
  - [ ] Nada usa color como único indicador de estado.
  - [ ] Landmarks, headings semánticos y `aria-label` en controles correctos.

## UI-008 · Rendimiento y degradación de vidrio
- **Labels:** `performance`, `P2`
- **Contexto:** `backdrop-filter` es costoso. Detectar baja gama (`hardwareConcurrency ≤ 2`) o `prefers-reduced-motion` y degradar a superficies sólidas + orbes congelados.
- **Criterios de aceptación:**
  - [ ] Media query / detect de baja gama reemplaza blur por `rgba(255,255,255,0.92)`.
  - [ ] Light-field y blur no bloquean el hilo principal (compositor-only, `will-change`).
  - [ ] Lighthouse mobile performance ≥ 90 en la landing.

## UI-009 · Assets de marca: hilo SVG y retirada de identidad anterior
- **Labels:** `design`, `assets`, `P1`
- **Contexto:** Sistematizar el motivo del hilo/nudo (SVG) para favicon, logo y ornamentos; auditar y eliminar referencias a la identidad romántica anterior (gradiente rosa, Dancing Script, textos de marca heredados). 
- **Criterios de aceptación:**
  - [ ] Motivo `thread-knot` como componente SVG reutilizable (logo, favicon, decorativo).
  - [ ] Sin referencias activas a Dancing Script ni al gradiente `#881337→#FB7185` en `frontend/src` (grep limpio).
  - [ ] Docs de marca ("brand") actualizados con la nueva era.

## UI-010 · Tests de regresión visual + unitarios
- **Labels:** `testing`, `P2`
- **Contexto:** Envolver la nueva UI con pruebas: snapshots de tokens/theme y test de la landing (render, toggle idioma, cuentas hover).
- **Criterios de aceptación:**
  - [ ] Test de theme: tokens esperados, `palette.error = #E63946`, radius correcto.
  - [ ] Test de landing: hero renderiza, toggle ES/EN cambia textos, CTAs presentes.
  - [ ] `npm test` en `frontend/` (jest) verde, y `npm run lint` sin warnings nuevos.

---

## Orden recomendado de ejecución
1. UI-001 (tema / tokens) → 2. UI-002 (hero) + UI-003 (nav) → 3. UI-004 (cards) + UI-005 (banda/footer) → 4. UI-006 (motion) + UI-007 (a11y) en paralelo → 5. UI-009 (assets) → 6. UI-008 + UI-010 (hardening/tests).

## Métricas de éxito de la era
- Lighthouse mobile ≥ 90 (UI-008 gate).
- axe sin criticals en la landing (UI-007 gate).
- Cero referencias a identidad anterior (UI-009 gate).
- Suite `frontend` verde en CI (UI-010 gate).