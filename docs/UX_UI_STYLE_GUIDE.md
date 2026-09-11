# RedThread — Guía de estilo UI/UX (Liquid Glass)

**Era:** Nueva era minimalista (2026-09-10) — sustituye la identidad romántica rosa.
**Inspiración:** fusión controlada de **iOS 26 (Liquid Glass)** y **One UI 9**. Superficies translúcidas, reflejos suaves, bordes muy redondeados, tipografía limpia.
**Sensación:** elegancia futurista, accesible, fluida; tecnología con corazón humano.
**Compañero máquina-legible:** `docs/design/design-dna.json` (Design DNA 3 dimensiones). Esta guía es la fuente de verdad para humanos y tokens.

---

## 1. Principios

1. **El vidrio lee la luz, no es un color.** El fondo (orbis de luz ambiental) existe *para* ser refractado por superficies transparentes. Sin fondo interesante detrás, no hay vidrio.
2. **Minimalismo con peso emocional.** La decoración es baja; el significado es alto. Blanco → grafito para claridad; azul eléctrico para acción/tecnología; rojo destino `#E63946` para momentos con significado.
3. **Movimiento orgánico.** Como vidrio líquido: glides largos, eases generosos, overshoot calmado. Nada salta, nada rebota como juguete.
4. **Accesibilidad y rendimiento no son opcionales.** Contraste AA sobre vidrio real, focus visible, `prefers-reduced-motion`, degradación del blur en baja gama.

---

## 2. Paleta

### Neutros (blanco → grafito)

| Token | Hex | Uso |
|---|---|---|
| `--n-0` | `#FFFFFF` | blanco puro (fills, texto inverso) |
| `--n-1` | `#F6F7F9` | fondo de app (alterna con `--n-2`) |
| `--n-2` | `#ECEEF2` | fondo alterno / áreas quietas |
| `--n-3` | `#D7DBE1` | bordes fuertes, dividers activos |
| `--n-4` | `#9AA1AB` | iconos inactivos |
| `--n-5` | `#6B7280` | texto secundario |
| `--n-6` | `#4B5563` | texto terciario/enfásis medio |
| `--n-7` | `#2B2F36` | grafito profundo (texto principal en vidrio, superficies oscuras) |
| `--n-8` | `#1A1B1E` | texto principal sobre claro / fondo de modo oscuro |

### Acentos

| Token | Hex | Ratio (blanco) | Uso |
|---|---|---|---|
| `--blue-300` | `#60A5FA` | — | halo/glow, modo oscuro |
| `--blue-500` | `#3B82F6` | 3.7:1 | color primario **solo para UI grande / rellenos** |
| `--blue-600` | `#2563EB` | 6.2:1 | CTA, texto de marca, focus ring |
| `--blue-700` | `#1D4ED8` | 8.6:1 | texto azul pequeño (AA+) |
| `--red-destino` | `#E63946` | 4.1:1 | acento emocional: rellenos, iconos, badges, UI grande |
| `--red-destino-strong` | `#B4232C` | 7.5:1 | **texto pequeño** rojo (AA+); hover/active de destino |

**Regla de contraste:** el rojo destino y el azul `#3B82F6` **no** sirven como texto pequeño sobre blanco. Texto pequeño → `--red-destino-strong` / `--blue-600`/`--blue-700`.

### Semánticos
`success #16A34A` · `warning #D97706` · `error #E63946` · `info #3B82F6`.

### Superficies
| Token | Valor | Uso |
|---|---|---|
| `--surface-bg` | `#F5F6F8` | lienzo |
| `--glass-card` | `rgba(255,255,255,0.62)` + blur 20px | tarjetas |
| `--glass-elevated` | `rgba(255,255,255,0.82)` + blur 24px | nav, modales, chips |
| `--glass-strong` | `rgba(255,255,255,0.72)` + blur 32px | panel del hero |

**Modo oscuro:** fondo `#1A1B1E`; vidrio `rgba(43,47,54,0.55)` con filo `rgba(255,255,255,0.14)`; orbes en `soft-light`; texto `#F6F7F9`.

---

## 3. Tipografía

| Familia | Rol | Fallback |
|---|---|---|
| **Poppins** (600/700) | Display & headings | Inter, system-ui |
| **Inter** (400/500/600) | Body & UI | system-ui, -apple-system, Segoe UI, Roboto |

**Escala (rem):**

| Token | Size | Weight | Línea | Tracking |
|---|---|---|---|---|
| display | 4.5rem | 600 | 1.05 | -0.03em |
| h1 | 3.25rem | 600 | 1.12 | -0.025em |
| h2 | 2.25rem | 600 | 1.2 | -0.02em |
| h3 | 1.5rem | 600 | 1.3 | -0.01em |
| body | 1.0625rem | 400 | 1.6 | 0 |
| body-sm | 0.9375rem | 400 | 1.55 | 0 |
| caption | 0.8125rem | 500 | 1.4 | 0.01em |
| overline | 0.75rem | 600 | 1.3 | +0.08em (mayúsculas) |

**Decisión de marca:** *Dancing Script* (cursiva de la era anterior) se **retira** del sistema UI. Queda permitida solo en micro-momentos emocionales explícitamente aprobados (nunca en headings, botones ni navegación).

---

## 4. La receta del vidrio (Liquid Glass)

El vidrio es composición de 5 capas. Sin las 5, es un rectángulo translúcido.

```css
.glass {
  /* 1. Transparencia — deja pasar los orbes de luz que viven detrás */
  background: linear-gradient(135deg, rgba(255,255,255,0.68), rgba(255,255,255,0.52));
  /* 2. Refracción — difumina y saturiza lo que hay detrás */
  backdrop-filter: blur(20px) saturate(160%);
  -webkit-backdrop-filter: blur(20px) saturate(160%);
  /* 3. Filo de vidrio — 1px de luz en el borde */
  border: 1px solid rgba(255,255,255,0.55);
  /* 4. Highlight interior — el "filo" superior que capta la luz (45º, sup-izq) */
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.85),
              inset 0 -1px 0 rgba(26,27,30,0.04),
              0 12px 32px rgba(26,27,30,0.10);
  /* 5. Radius generoso */
  border-radius: 28px;
}
```

**Sheen de hover (presión líquida):** un gradiente blanco al 8% recorre la superficie al pasar el cursor (pseudo-elemento `::before`, `translateX(-100%→100%)`, 700ms, ease líquido).

**Morphing al hover:** `border-radius 28px→24px` + `blur 20px→18px` + `translateY(-6px)` + blur de la sombra → parece que el vidrio se hunde.

**Degradado de rendimiento:** en baja gama (`prefers-reduced-motion` o `hardwareConcurrency ≤ 2`), reemplazar `backdrop-filter` por `rgba(255,255,255,0.92)` sólido y congelar los orbes.

---

## 5. Forma, elevación, espaciado

**Radius:** sm `12` · md `20` · lg `28` · pill `999`. Controles → pill o md; tarjetas → lg; inputs → md; chips → pill.
**Bordes:** hairline `rgba(26,27,30,0.08)` para dividers (oscuro: `rgba(255,255,255,0.10)`); filo de vidrio solo en superficies glass.
**Sombras (niveles):**

| Nivel | Valor |
|---|---|
| low | `0 2px 8px rgba(26,27,30,0.06)` + inset filo |
| med | `0 12px 32px rgba(26,27,30,0.10)` + inset filo |
| high | `0 24px 64px rgba(26,27,30,0.16)` + inset filo |

**Spacing:** base **8px**, escala `4/8/12/16/24/32/40/48/64/96`. Sección: hero `128` → secciones `96/72`. Gutter `24`. Nada por debajo de 4px; nada fuera de la escala.
**Layout:** grid 12 col, `max-width 1200px`, breakpoints `375/768/1024/1440`. Hero centrado simétrico, tarjetas con leve asimetría.

---

## 6. Iconografía

- **Phosphor**, outline redondeado, stroke `1.8`. Fallback: Heroicons. Nunca emojis como iconos estructurales.
- Tamaños `16/20/24/32/48`; relleno vs outline por jerarquía (un estilo por nivel).
- Iconos decorativos junto a texto visible → `aria-hidden="true"`. Iconos con significado → `aria-label`.
- Target táctil mínimo **44×44** (web ≥ 40px con suficiente padding).

---

## 7. Movimiento (tokens)

| Token | Valor |
|---|---|
| `--ease-liquid` | `cubic-bezier(0.22,1,0.36,1)` |
| `--ease-enter` | `cubic-bezier(0.16,1,0.3,1)` |
| `--dur-micro` | 140ms |
| `--dur-normal` | 280ms |
| `--dur-macro` | 640ms |
| `--spring-card` | escala `1.02→1` con `--ease-enter`, 560ms (overshoot calmado) |

**Entradas:** ascenso líquido `translateY(24px) + scale(0.98) + blur(6px)→sharp`, escalonado (hero palabra a palabra, stagger 60ms; cards stagger 140ms).
**Salida:** `fade + scale(0.98)`, 160ms (más rápido que la entrada).
**Hover CTA:** `translateY(-2px)` + glow; active `scale(0.98)`; focus ring azul 2px offset 3px.
**Nada de:** easing por defecto lineal, bounce juguetón, dur ≥ 1s en micro-interacciones.
**Reduced motion:** todo → fades simples, sin blur animado ni desplazamientos.

---

## 8. Componentes (resumen)

| Componente | Spec |
|---|---|
| **Botón primario** | pill, gradiente `135deg #3B82F6→#2563EB`, texto blanco, sombra azul ambiental |
| **Botón destino** | pill, `#E63946`, uso limitado a *momentos con significado* |
| **Botón vidrio / outline** | glass receta / border 1.5px grafito suave |
| **Input** | glass esmerilado `blur(20)`, radius 16, label flotante, focus ring azul |
| **Card** | glass receta, radius 28, padding 28, sheen hover |
| **Nav** | píldora flotante glass-strong + selector de idioma segmentado |
| **Modal** | glass sobre scrim blur; móvil: hoja inferior |
| **Lista** | filas glass con hairline |

---

## 9. Accesibilidad (las reglas que no se negocian)

- Texto normal ≥ **4.5:1** siempre (medir el vidrio contra el fondo real, no contra blanco puro).
- Azul `#3B82F6` y rojo `#E63946` solo como relleno/UI grande/3:1 (no texto pequeño).
- Focus visible en todo elemento interactivo (ring 2px azul, offset 3px).
- `prefers-reduced-motion`: fades simples, sin blur animado, orbes congelados.
- Nada de color como único indicador (estado también por icono/texto/forma).
- Todos los controles con `aria-label` / landmarks; jerarquía de títulos semántica.

---

## 10. Implementación en el stack (Next.js + MUI 6)

- Crear el **tema MUI 6** (`createTheme`) mapeando tokens: `palette.primary`→`#2563EB`, `palette.error`→`#E63946`, `shape.borderRadius`→`20`, `typography` desde la escala, `breakpoints` desde los 4 puntos.
- Emitir los mismos tokens como **CSS variables** en `:root` (un solo origen, `docs/design/design-dna.json`).
- Retirar `Dancing Script` y el gradiente rosa de `frontend/src/pages/index.tsx` en la tarea de la landing.
- Orbes de luz: bloques `position:absolute` con radial-gradient + `@keyframes` (sin librería). Parallax: scroll con `transform: translateY` (2 capas) o `useGSAP` si gana la versión animada.
- Sheen: pseudoelemento; morphing: transiciones CSS; entradas: IntersectionObserver + clases.
- Baja gama/reduced-motion: media queries + `hardwareConcurrency`.

**Regla de oro final:** si no hay luz ambiental detrás, no uses vidrio. Un vidrio sobre fondo plano es un rectángulo gris roto — degrada a el vidrio o añade luz.