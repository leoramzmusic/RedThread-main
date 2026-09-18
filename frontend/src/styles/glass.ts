import type { Theme } from '@mui/material';
import type { SystemStyleObject } from '@mui/system';

// RedThread Liquid Glass — tokens del DNA (docs/design/design-dna.json)
// PALETA FIJA: Rojo Destino #E63946 protagonista, azul #3B82F6 acento narrativo
export const RED = '#E63946';
export const RED_LIGHT = '#FF6B6B';
export const RED_DARK = '#B71C1C';
export const BLUE = '#3B82F6';
export const BLUE_GRADIENT = 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)';
export const GRAPHITE = '#2B2F36';
export const ICE_BLUE = '#A5C8FF';

export type GlassLevel = 'low' | 'medium' | 'high';

interface GlassOptions {
  blur?: number;
  radius?: number;
  level?: GlassLevel;
  elevated?: boolean;
  /** Reflejo diagonal: 'hover' lo activa al pasar el cursor, 'auto' lo recorre periódicamente. */
  sheen?: 'hover' | 'auto';
}

export function glassSurface(isDark: boolean, opts: GlassOptions = {}): SystemStyleObject<Theme> {
  const { blur = 20, radius = 28, level = 'medium', elevated = false, sheen = 'hover' } = opts;

  const shadows: Record<GlassLevel, string> = {
    low: isDark
      ? '0 2px 8px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.10)'
      : '0 2px 8px rgba(26,27,30,0.06), inset 0 1px 0 rgba(255,255,255,0.55)',
    medium: isDark
      ? '0 12px 32px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.12)'
      : '0 12px 32px rgba(26,27,30,0.10), inset 0 1px 0 rgba(255,255,255,0.60)',
    high: isDark
      ? '0 24px 64px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.14)'
      : '0 24px 64px rgba(26,27,30,0.16), inset 0 1px 0 rgba(255,255,255,0.65)',
  };

  return {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: radius,
    bgcolor: isDark
      ? elevated
        ? 'rgba(26,27,30,0.72)'
        : 'rgba(26,27,30,0.55)'
      : elevated
        ? 'rgba(255,255,255,0.82)'
        : 'rgba(255,255,255,0.62)',
    WebkitBackdropFilter: `blur(${blur}px) saturate(150%)`,
    backdropFilter: `blur(${blur}px) saturate(150%)`,
    border: '1px solid',
    borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.55)',
    boxShadow: shadows[level],
    transition:
      'transform 0.32s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.32s cubic-bezier(0.22, 1, 0.36, 1), border-radius 0.32s cubic-bezier(0.22, 1, 0.36, 1), background-color 0.32s ease, backdrop-filter 0.32s ease',
    '&::after': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: '-60%',
      width: '45%',
      height: '100%',
      background:
        'linear-gradient(105deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.26) 50%, rgba(255,255,255,0) 100%)',
      transform: 'skewX(-18deg)',
      pointerEvents: 'none',
      opacity: 0,
      transition: 'left 0.7s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.7s ease',
      ...(sheen === 'auto'
        ? { animation: 'rtLiquidSheen 6.5s ease-in-out infinite' }
        : {}),
    },
    ...(sheen === 'auto'
      ? {
          '@keyframes rtLiquidSheen': {
            '0%, 55%': { left: '-60%', opacity: 0 },
            '72%': { opacity: 1 },
            '94%, 100%': { left: '135%', opacity: 0 },
          },
        }
      : {}),
    '@media (prefers-reduced-motion: reduce)': {
      transition: 'none',
      '&::after': { display: 'none' },
    },
  };
}

export function glassHover(): SystemStyleObject<Theme> {
  return {
    '&:hover': {
      transform: 'translateY(-6px)',
      borderRadius: 24,
    },
    '&:hover::after': {
      left: '120%',
      opacity: 1,
    },
    '@media (prefers-reduced-motion: reduce)': {
      '&:hover': { transform: 'translateY(-2px)' },
    },
  };
}

export function orbisLayer(isDark: boolean): SystemStyleObject<Theme> {
  return {
    position: 'absolute',
    inset: 0,
    zIndex: 0,
    pointerEvents: 'none',
    overflow: 'hidden',
    opacity: isDark ? 0.5 : 0.6,
    background: isDark
      ? 'radial-gradient(at 22% 18%, rgba(30,58,138,0.55) 0, transparent 46%), radial-gradient(at 82% 22%, rgba(67,56,202,0.4) 0, transparent 46%), radial-gradient(at 68% 84%, rgba(159,18,57,0.38) 0, transparent 46%), radial-gradient(at 12% 78%, rgba(37,99,235,0.35) 0, transparent 44%)'
      : 'radial-gradient(at 22% 18%, rgba(191,219,254,0.8) 0, transparent 46%), radial-gradient(at 82% 22%, rgba(224,231,255,0.85) 0, transparent 46%), radial-gradient(at 68% 84%, rgba(255,228,230,0.85) 0, transparent 46%), radial-gradient(at 12% 78%, rgba(255,255,255,0.9) 0, transparent 44%)',
    filter: 'blur(48px)',
    animation: 'rtOrbisDrift 30s ease-in-out infinite alternate',
    '@keyframes rtOrbisDrift': {
      from: { transform: 'translate3d(-1.5%, -1.5%, 0) scale(1)' },
      to: { transform: 'translate3d(2%, 2%, 0) scale(1.06)' },
    },
    '@media (prefers-reduced-motion: reduce)': {
      animation: 'none',
    },
  };
}

export const glassHeading = {
  fontFamily: "'Poppins', Inter, system-ui, sans-serif",
  letterSpacing: '-0.02em',
  fontWeight: 600,
} as const;

export function textPrimary(isDark: boolean): string {
  return isDark ? '#F6F7F9' : '#1A1B1E';
}

export function textSecondary(isDark: boolean): string {
  return isDark ? '#ADB4BF' : '#6B7280';
}

export function hairline(isDark: boolean): string {
  return isDark ? 'rgba(255,255,255,0.10)' : 'rgba(26,27,30,0.08)';
}

export function pillPrimary(): SystemStyleObject<Theme> {
  return {
    borderRadius: 999,
    textTransform: 'none',
    fontWeight: 600,
    backgroundImage: BLUE_GRADIENT,
    color: '#fff',
    boxShadow: '0 10px 24px rgba(59,130,246,0.35)',
    px: 3,
    '&:hover': {
      backgroundImage: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
      transform: 'translateY(-2px)',
      boxShadow: '0 14px 30px rgba(59,130,246,0.45)',
    },
    '&:active': { transform: 'scale(0.98)' },
    transition:
      'transform 0.28s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.28s cubic-bezier(0.22, 1, 0.36, 1)',
  };
}

export function pillGlass(isDark: boolean, inverted = false): SystemStyleObject<Theme> {
  return {
    borderRadius: 999,
    textTransform: 'none',
    fontWeight: 600,
    border: '1px solid',
    borderColor: isDark ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.6)',
    bgcolor: isDark
      ? inverted
        ? 'rgba(255,255,255,0.9)'
        : 'rgba(255,255,255,0.08)'
      : inverted
        ? 'rgba(255,255,255,0.85)'
        : 'rgba(255,255,255,0.4)',
    color: inverted
      ? GRAPHITE
      : isDark
        ? '#F6F7F9'
        : '#2B2F36',
    WebkitBackdropFilter: 'blur(12px)',
    backdropFilter: 'blur(12px)',
    px: 3,
    '&:hover': {
      borderColor: isDark ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,0.85)',
      bgcolor: isDark
        ? inverted
          ? '#fff'
          : 'rgba(255,255,255,0.14)'
        : inverted
          ? '#fff'
          : 'rgba(255,255,255,0.6)',
      transform: 'translateY(-2px)',
    },
    '&:active': { transform: 'scale(0.98)' },
    transition:
      'transform 0.28s cubic-bezier(0.22, 1, 0.36, 1), background-color 0.28s ease, border-color 0.28s ease',
  };
}

export function avatarRing(isDark: boolean): SystemStyleObject<Theme> {
  return {
    border: '1.5px solid',
    borderColor: isDark ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.85)',
    boxShadow: isDark
      ? '0 4px 12px rgba(0,0,0,0.4)'
      : '0 4px 12px rgba(26,27,30,0.12)',
  };
}

/**
 * Corazón tipo "comment-react" (uiverse.io/TroyRandall/jolly-yak-60) adaptado
 * al Liquid Glass: un blob difuminado con gradiente rojo destino -> azul late
 * tras el icono al pasar el cursor, y el corazón se rellena en rosa mientras
 * crece, igual que el original. Se aplica solo a la tarjeta "Matches".
 */
export function heartReactionHost(isDark: boolean): SystemStyleObject<Theme> {
  return {
    position: 'relative',
    zIndex: 1,
    cursor: 'pointer',
    '& svg': { position: 'relative', zIndex: 1 },
    '::after': {
      content: '""',
      position: 'absolute',
      left: '50%',
      top: '50%',
      width: 44,
      height: 44,
      ml: -22,
      mt: -22,
      borderRadius: '50%',
      background: isDark
        ? 'linear-gradient(to bottom right, rgba(230,57,70,0.95), rgba(59,130,246,0.95))'
        : 'linear-gradient(to bottom right, #E63946, #3B82F6)',
      filter: 'blur(10px)',
      transform: 'scale(0)',
      opacity: 0,
      zIndex: 0,
      transition: 'transform 0.45s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.45s ease',
    },
    '&:hover': {
      color: '#f5356e',
      transform: 'scale(1.18)',
      transition: 'transform 0.28s cubic-bezier(0.22, 1, 0.36, 1), color 0.28s ease',
    },
    '&:hover::after': {
      transform: 'scale(1.15)',
      opacity: 0.45,
      animation: 'rtRippleHeart 0.65s ease-in-out infinite',
    },
    '@keyframes rtRippleHeart': {
      '0%': { transform: 'scale(1)', opacity: 0.5 },
      '100%': { transform: 'scale(1.35)', opacity: 0.08 },
    },
    '@media (prefers-reduced-motion: reduce)': {
      '&:hover': { transform: 'scale(1.03)' },
      '&:hover::after': { animation: 'none', transform: 'scale(1.1)', opacity: 0.25 },
    },
  };
}

/**
 * Separador sutil con gradiente horizontal para dar aire y orden entre paneles.
 * Úsalo como <Box component="hr" sx={sectionDivider(isDark)} />.
 */
export function sectionDivider(isDark: boolean): SystemStyleObject<Theme> {
  const stroke = isDark ? 'rgba(255,255,255,0.14)' : 'rgba(26,27,30,0.10)';
  return {
    height: 1,
    width: '100%',
    border: 'none',
    my: 1.5,
    background: `linear-gradient(90deg, transparent 0%, ${stroke} 18%, ${stroke} 82%, transparent 100%)`,
  };
}