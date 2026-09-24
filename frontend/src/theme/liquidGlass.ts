import { createTheme, alpha, type Theme } from '@mui/material/styles';

/**
 * Liquid Glass design tokens — sourced from docs/design/design-dna.json.
 * Single source of truth for the MUI theme. Map changes here ONLY.
 */

// ---- Color ----
// PALETA FIJA E INCAMBIABLE (v2, 2026-09-14):
// Rojo Destino #E63946 como protagonista absoluto.
// Rojo Claro #FF6B6B hover/activo. Rojo Oscuro #B71C1C alertas/critico.
// Fondos: Blanco Puro #FFFFFF (claro) / Negro Grafito #1D1D1F (oscuro).
// Acentos narrativos (SOLO iconos, badges, detalles): Azul #3B82F6, Violeta #7F4CA5, Dorado #efb810.
export const liquidColors = {
  primary: '#E63946',
  primaryLight: '#FF6B6B',
  primaryDark: '#B71C1C',
  secondary: '#2B2F36',
  accent: '#3B82F6',
  accentViolet: '#7F4CA5',
  accentGold: '#efb810',
  success: '#16A34A',
  warning: '#D97706',
  info: '#3B82F6',
  error: '#E63946',
  neutral: {
    0: '#FFFFFF',
    50: '#F6F7F9',
    100: '#ECEEF2',
    200: '#D7DBE1',
    300: '#9AA1AB',
    400: '#6B7280',
    500: '#4B5563',
    600: '#2B2F36',
    700: '#1A1B1E',
  },
  surface: {
    background: '#F5F6F8',
    card: 'rgba(255,255,255,0.62)',
    elevated: 'rgba(255,255,255,0.82)',
    cardDark: 'rgba(26,27,30,0.55)',
    elevatedDark: 'rgba(26,27,30,0.72)',
  },
} as const;

// ---- Typography ----
export const fontFamilies = {
  heading: "'Poppins', Inter, system-ui, sans-serif",
  body: "Inter, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
  mono: "'SF Mono', ui-monospace, Menlo, Consolas, monospace",
} as const;

export const typeScale = {
  display: { size: '4.5rem', weight: 600, lineHeight: 1.05, tracking: '-0.03em' },
  h1: { size: '3.25rem', weight: 600, lineHeight: 1.12, tracking: '-0.025em' },
  h2: { size: '2.25rem', weight: 600, lineHeight: 1.2, tracking: '-0.02em' },
  h3: { size: '1.5rem', weight: 600, lineHeight: 1.3, tracking: '-0.01em' },
  body: { size: '1.0625rem', weight: 400, lineHeight: 1.6, tracking: '0em' },
  bodySmall: { size: '0.9375rem', weight: 400, lineHeight: 1.55, tracking: '0em' },
  caption: { size: '0.8125rem', weight: 500, lineHeight: 1.4, tracking: '0.01em' },
  overline: { size: '0.75rem', weight: 600, lineHeight: 1.3, tracking: '0.08em' },
} as const;

// ---- Spacing / Layout ----
export const spacingUnit = 8;
export const layoutTokens = {
  maxContentWidth: 1600,
  contentWidth: { lg: 1200, xl: 1280, xxl: 1600 } as const,
  columns: 12,
  gutter: { xs: 16, sm: 24, xl: 32 } as const,
  // 280 cover foldable, 360 mobile, 540 unfolded foldable, 768 tablet, 1024 tablet-L/desktop-S, 1280 desktop, 1440 wide, 1920 smart display
  breakpoints: [280, 360, 540, 768, 1024, 1280, 1440, 1920] as const,
};

// ---- Shape ----
export const shapeTokens = {
  small: 12,
  medium: 20,
  large: 28,
  pill: 999,
};

// ---- Elevation (glass shadows: ambient diffuse + inner shine edge) ----
export const elevationTokens = {
  light: {
    low: '0 2px 8px rgba(26,27,30,0.06), inset 0 1px 0 rgba(255,255,255,0.55)',
    medium: '0 12px 32px rgba(26,27,30,0.10), inset 0 1px 0 rgba(255,255,255,0.60)',
    high: '0 24px 64px rgba(26,27,30,0.16), inset 0 1px 0 rgba(255,255,255,0.65)',
  },
  dark: {
    low: '0 2px 8px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.10)',
    medium: '0 12px 32px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.12)',
    high: '0 24px 64px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.14)',
  },
};

// ---- Landing Fase A — solo tipografía + sombra (additive, 0 breaking) ----
// Base para Fase B (project(v)=v/1000*0.998/0.002 springs) sin tocar motion ahora.
export const landingTypography = {
  heroTitle: {
    family: fontFamilies.heading,
    weight: 600,
    tracking: '-0.03em',
    lineHeight: 1.05,
    // 280 cover → móvil fluido 1.95→3.6rem vía vw (siempre cabe en pantallas angostas;
    // el CMS solo sube el techo), desktop 5rem con floor 4.6
    size: { xs: 'clamp(1.95rem, 7.2vw, 3.6rem)', md: 'clamp(4.2rem, 5vw, 5rem)' } as const,
    sizeFloor: { md: '4.6rem' } as const,
  },
  heroBody: {
    family: fontFamilies.body,
    weight: 400,
    tracking: '0em',
    lineHeight: 1.7,
    size: { xs: '1rem', sm: '1.05rem', md: '1.15rem' } as const,
  },
  sectionTitle: {
    family: fontFamilies.heading,
    weight: 700,
    tracking: '0.01em',
    lineHeight: 1.15,
    size: { xs: 'clamp(1.9rem, 6vw, 2.9rem)', md: 'clamp(2.6rem, 3.5vw, 4rem)' } as const,
  },
  cardTitle: {
    family: fontFamilies.heading,
    weight: 600,
    tracking: '0.01em',
    lineHeight: 1.3,
    size: { xs: '1.4rem', sm: '1.6rem', md: '1.8rem' } as const,
    color: '#3B1C2A',
  },
  cardBody: {
    family: fontFamilies.body,
    weight: 400,
    tracking: '0em',
    lineHeight: 1.7,
    color: '#6E5560',
  },
  footer: {
    family: fontFamilies.body,
    tracking: '0.04em',
    lineHeight: 1.5,
  },
  langPill: {
    size: '0.75rem',
    weight: 600,
    tracking: '0em',
  },
} as const;

export const landingShadows = {
  // Apple §12: bigger surfaces = heavier blur+shadow; pill nav es superficie flotante
  nav: {
    rest: '0 4px 16px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.15)',
    scrolled: '0 8px 32px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.2)',
  },
  card: {
    rest: '0 18px 40px rgba(88, 8, 34, 0.16), 0 4px 12px rgba(0, 0, 0, 0.08)',
    hover: '0 26px 55px rgba(255, 0, 80, 0.25), 0 12px 28px rgba(255, 0, 80, 0.12)',
  },
  ctaPrimary: {
    rest: 'inset 0 1px 0 rgba(255,255,255,0.3), 0 14px 34px rgba(230,57,70,0.4), 0 4px 10px rgba(0,0,0,0.22)',
    hover: 'inset 0 1px 0 rgba(255,255,255,0.5), 0 22px 46px rgba(230,57,70,0.55), 0 6px 14px rgba(0,0,0,0.24)',
  },
  ctaSecondary: {
    rest: 'inset 0 1px 0 rgba(255,255,255,0.5), 0 10px 26px rgba(0,0,0,0.16)',
    hover: 'inset 0 1px 0 rgba(255,255,255,0.9), 0 16px 34px rgba(0,0,0,0.22)',
  },
  text: {
    heroTitle: '0 2px 6px rgba(0,0,0,0.35)',
    heroBody: '0 1px 3px rgba(0,0,0,0.35)',
    sectionTitle: '0 2px 8px rgba(0,0,0,0.3)',
  },
} as const;

/** Helper Fase A: resuelve fontSize hero respetando CMS override, con floor desktop 4.6.
 *  xs es SIEMPRE fluido (clamp con vw) para que el título nunca desborde en móvil —
 *  un rem fijo aquí vuelve a cortar el título en viewports angostos. */
export function getLandingHeroFontSize(cmsRem?: number): { xs: string; md: string } {
  const xs = landingTypography.heroTitle.size.xs;
  const xsCeiling = cmsRem != null ? `clamp(1.95rem, 7.2vw, ${cmsRem}rem)` : xs;
  return {
    xs: xsCeiling,
    md: `max(${cmsRem ?? 5}rem, ${landingTypography.heroTitle.sizeFloor.md})`,
  };
}

// ---- Motion ----
export const motionTokens = {
  easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
  durations: { micro: 140, normal: 280, macro: 640 } as const,
};

export type VisualTheme =
  | 'redThread'
  | 'premium'
  | 'vip'
  | 'blue'
  | 'purple'
  | 'pink'
  | 'green'
  | 'sakura'
  | 'halloween'
  | 'christmas';

export type ThemeMode = 'light' | 'dark';

/** Maps legacy visual themes onto the Liquid Glass primary. */
function visualPrimary(theme: VisualTheme): string {
  switch (theme) {
    case 'redThread':
      return liquidColors.primary;
    case 'sakura':
      return '#EEAAC0';
    case 'premium':
      return '#797979';
    case 'blue':
      return '#0CB7F2';
    case 'green':
      return '#5CCB5F';
    case 'vip':
      return '#efb810';
    case 'purple':
      return '#7F4CA5';
    case 'halloween':
      return '#CC750D';
    case 'christmas':
      return '#CC750D';
    case 'pink':
      return '#FC6998';
    default:
      return liquidColors.primary;
  }
}

/**
 * Builds the redThread MUI theme object for a given light/dark mode.
 * Emits design tokens as CSS variables on :root for the filter APIs
 * (body) to consume — see `injectDesignTokens`.
 */
export function createLiquidGlassTheme(mode: ThemeMode, visualTheme: VisualTheme = 'redThread'): Theme {
  const isDark = mode === 'dark';
  const primary = visualPrimary(visualTheme);
  const primaryLight = liquidColors.primaryLight;
  const primaryDark = liquidColors.primaryDark;
  const elevation = elevationTokens[isDark ? 'dark' : 'light'];
  const background =
    visualTheme === 'halloween' && !isDark
      ? '#12121C'
      : visualTheme === 'vip' && !isDark
        ? '#FFF8E0'
        : visualTheme === 'sakura' && !isDark
          ? '#F7F3F5'
          : visualTheme === 'green' && !isDark
            ? '#F5F1E9'
            : visualTheme === 'pink' && !isDark
              ? '#FFF0F4'
              : visualTheme === 'purple' && !isDark
                ? '#F8F2FF'
                : isDark
                  ? '#1A1B1E'
                  : '#F5F6F8';
  const paper =
    visualTheme === 'halloween' && !isDark
      ? '#1D1D2B'
      : visualTheme === 'vip' && !isDark
        ? '#FFF2CE'
        : visualTheme === 'sakura' && !isDark
          ? '#FBF9FA'
          : visualTheme === 'green' && !isDark
            ? '#FAF7F1'
            : visualTheme === 'pink' && !isDark
              ? '#FFF5F8'
              : visualTheme === 'purple' && !isDark
                ? '#FBF7FF'
                : isDark
                  ? '#232428'
                  : '#FFFFFF';

  return createTheme({
    palette: {
      mode,
      primary: {
        main: primary,
        dark: alpha(primary, 0.85),
        light: alpha(primary, 0.75),
        contrastText: '#FFFFFF',
      },
      secondary: {
        main: liquidColors.secondary,
        contrastText: isDark ? '#F6F7F9' : '#FFFFFF',
      },
      error: {
        main: liquidColors.error,
        dark: liquidColors.primaryDark,
        light: alpha(liquidColors.error, 0.7),
        contrastText: '#FFFFFF',
      },
      warning: { main: liquidColors.warning, contrastText: '#FFFFFF' },
      info: { main: liquidColors.info, contrastText: '#FFFFFF' },
      success: { main: liquidColors.success, contrastText: '#FFFFFF' },
      text: {
        primary: isDark ? '#F6F7F9' : '#1A1B1E',
        secondary: isDark ? '#ADB4BF' : '#6B7280',
        disabled: isDark ? '#5C6270' : '#9AA1AB',
      },
      background: {
        default: background,
        paper,
      },
      divider: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(26,27,30,0.08)',
      ...(isDark
        ? {
            action: {
              hover: 'rgba(255,255,255,0.06)',
              selected: 'rgba(255,255,255,0.10)',
              disabledBackground: 'rgba(255,255,255,0.08)',
              focus: 'rgba(255,255,255,0.12)',
            },
          }
        : {}),
    },
    shape: {
      borderRadius: shapeTokens.medium,
    },
    spacing: (factor: number) => `${factor * spacingUnit}px`,
    typography: {
      fontFamily: fontFamilies.body,
      h1: {
        fontFamily: fontFamilies.heading,
        fontSize: typeScale.h1.size,
        fontWeight: typeScale.h1.weight,
        lineHeight: typeScale.h1.lineHeight,
        letterSpacing: typeScale.h1.tracking,
        color: isDark ? '#F6F7F9' : '#1A1B1E',
      },
      h2: {
        fontFamily: fontFamilies.heading,
        fontSize: typeScale.h2.size,
        fontWeight: typeScale.h2.weight,
        lineHeight: typeScale.h2.lineHeight,
        letterSpacing: typeScale.h2.tracking,
        color: isDark ? '#F6F7F9' : '#1A1B1E',
      },
      h3: {
        fontFamily: fontFamilies.heading,
        fontSize: typeScale.h3.size,
        fontWeight: typeScale.h3.weight,
        lineHeight: typeScale.h3.lineHeight,
        letterSpacing: typeScale.h3.tracking,
        color: isDark ? '#F6F7F9' : '#1A1B1E',
      },
      h4: {
        fontFamily: fontFamilies.heading,
        fontSize: '1.25rem',
        fontWeight: 600,
        lineHeight: 1.3,
        letterSpacing: '-0.01em',
      },
      h5: {
        fontFamily: fontFamilies.heading,
        fontSize: '1.125rem',
        fontWeight: 600,
        lineHeight: 1.35,
        letterSpacing: '-0.01em',
      },
      h6: {
        fontFamily: fontFamilies.heading,
        fontSize: '1rem',
        fontWeight: 600,
        lineHeight: 1.4,
        letterSpacing: '0em',
      },
      body1: {
        fontSize: typeScale.body.size,
        lineHeight: typeScale.body.lineHeight,
        letterSpacing: typeScale.body.tracking,
      },
      body2: {
        fontSize: typeScale.bodySmall.size,
        lineHeight: typeScale.bodySmall.lineHeight,
        letterSpacing: typeScale.bodySmall.tracking,
      },
      caption: {
        fontSize: typeScale.caption.size,
        fontWeight: typeScale.caption.weight,
        lineHeight: typeScale.caption.lineHeight,
        letterSpacing: typeScale.caption.tracking,
      },
      overline: {
        fontSize: typeScale.overline.size,
        fontWeight: typeScale.overline.weight,
        lineHeight: typeScale.overline.lineHeight,
        letterSpacing: typeScale.overline.tracking,
        textTransform: 'uppercase',
      },
      button: {
        textTransform: 'none',
        fontWeight: 600,
      },
    },
  });
}

export const liquidGlassThemeLight = createLiquidGlassTheme('light');
export const liquidGlassThemeDark = createLiquidGlassTheme('dark');

export default liquidGlassThemeLight;