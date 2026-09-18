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
  maxContentWidth: 1200,
  columns: 12,
  gutter: 24,
  breakpoints: [375, 768, 1024, 1440] as const,
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