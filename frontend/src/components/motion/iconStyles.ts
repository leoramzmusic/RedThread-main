import type { SxProps, Theme } from '@mui/material';

export type IconStyleId = 'basic' | 'glow' | 'subtle' | 'liquid' | 'premium';

export interface IconStyleVariant {
  value: IconStyleId;
  label: string;
  description: string;
}

export const RED_PASSION = '#E63946';

export const ICON_STYLE_VARIANTS: IconStyleVariant[] = [
  { value: 'basic', label: 'Básico', description: 'Toggle clásico con brillo rojo pasión' },
  { value: 'glow', label: 'Minimal glow', description: 'Halo rojo pasión (#D32F2F) constante, glow intenso y vibración al activo' },
  { value: 'subtle', label: 'Animación sutil', description: 'Campana neutra #a5a5b0, fill lento y loop ligero, sin glow' },
  { value: 'liquid', label: 'Liquid Glass', description: 'Ícono sobre fondo translúcido con blur' },
  { value: 'premium', label: 'Premium', description: 'Liquid Glass avanzado + glow multicolor dinámico' },
];

export const ICON_STYLE_DEFAULTS: Record<string, IconStyleId> = {
  theme: 'basic',
  notifications: 'basic',
  settings: 'basic',
  language: 'basic',
};

export const isIconStyleId = (value: unknown): value is IconStyleId =>
  value === 'basic' || value === 'glow' || value === 'subtle' || value === 'liquid' || value === 'premium';

const PREMIUM_KEYFRAMES = {
  '@keyframes rtPremiumShift': {
    from: { backgroundPosition: '0% 50%' },
    to: { backgroundPosition: '200% 50%' },
  },
};

const SUBTLE_KEYFRAMES = {
  '@keyframes rtSubtleBell': {
    '0%, 100%': { transform: 'rotate(-4deg)' },
    '50%': { transform: 'rotate(4deg)' },
  },
  '@keyframes rtSubtleSpin': {
    to: { transform: 'rotate(360deg)' },
  },
  '@keyframes rtSubtleGlobe': {
    to: { transform: 'rotate(360deg)' },
  },
  '@keyframes rtThemePulse': {
    '0%, 100%': { opacity: 1, transform: 'scale(1)' },
    '50%': { opacity: 0.6, transform: 'scale(0.92)' },
  },
};

/**
 * Devuelve las variantes visuales por ícono. Pensado para ser
 * esparcido en el sx de un IconButton (u otro contenedor).
 */
export function getIconStyleSx(styleId: IconStyleId): SxProps<Theme> {
  switch (styleId) {
    case 'glow':
      return {
        color: 'inherit',
        bgcolor: 'rgba(255,255,255,0.06)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        transition: 'color 0.3s ease, box-shadow 0.3s ease, transform 0.15s ease',
        '&:hover': {
          color: RED_PASSION,
          bgcolor: 'rgba(211,47,47,0.08)',
          boxShadow: `0 0 14px rgba(230,57,70,0.45)`,
        },
      } as SxProps<Theme>;
    case 'subtle':
      return {
        color: 'inherit',
        transition: 'color 0.3s ease, transform 0.15s ease',
        '&:hover': { color: 'primary.main' },
        ...SUBTLE_KEYFRAMES,
      } as SxProps<Theme>;
    case 'liquid': {
      const liquidSx = (theme: Theme) => ({
        color: 'inherit',
        bgcolor:
          theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        border: '1px solid',
        borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.12)',
        transition: 'color 0.3s ease, background-color 0.3s ease, box-shadow 0.3s ease, transform 0.15s ease',
        '&:hover': {
          color: 'primary.main',
          bgcolor:
            theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.11)',
          boxShadow: '0 0 14px rgba(230,57,70,0.35)',
        },
      });
      return liquidSx;
    }
    case 'premium':
      return {
        color: '#fff',
        background: 'linear-gradient(135deg, #E63946, #FF6B6B, #B71C1C)',
        backgroundSize: '200% 200%',
        animation: 'rtPremiumShift 4s linear infinite',
        boxShadow: '0 0 12px rgba(230,57,70,0.45)',
        transition: 'transform 0.15s ease, box-shadow 0.3s ease',
        '&:hover': {
          transform: 'scale(1.06)',
          boxShadow: '0 0 18px rgba(230,57,70,0.6)',
        },
        ...PREMIUM_KEYFRAMES,
      } as SxProps<Theme>;
    case 'basic':
    default:
      return {
        color: 'inherit',
        transition: 'color 0.3s ease, transform 0.15s ease',
        '&:hover': { color: 'primary.main' },
      } as SxProps<Theme>;
  }
}