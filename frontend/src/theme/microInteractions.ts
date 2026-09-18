import { keyframes, type SxProps, type Theme } from '@mui/material';

// ─── Keyframes ────────────────────────────────────────────────

export const pulse = keyframes`
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.05); opacity: 0.8; }
`;

export const ripple = keyframes`
  0% { transform: scale(0); opacity: 0.6; }
  100% { transform: scale(4); opacity: 0; }
`;

export const glow = keyframes`
  0%, 100% { box-shadow: 0 0 5px rgba(230,57,70,0.3); }
  50% { box-shadow: 0 0 20px rgba(230,57,70,0.6), 0 0 40px rgba(230,57,70,0.3); }
`;

export const shake = keyframes`
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
  20%, 40%, 60%, 80% { transform: translateX(4px); }
`;

export const bounce = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
`;

export const spin = keyframes`
  to { transform: rotate(360deg); }
`;

export const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

export const slideUp = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

export const scaleIn = keyframes`
  from { opacity: 0; transform: scale(0.9); }
  to { opacity: 1; transform: scale(1); }
`;

// ─── Animation Presets ────────────────────────────────────────

export const ANIMATION_PRESETS = {
  pulse: {
    animation: `${pulse} 2s ease-in-out infinite`,
  },
  glow: {
    animation: `${glow} 2s ease-in-out infinite`,
  },
  bounce: {
    animation: `${bounce} 1s ease-in-out infinite`,
  },
  spin: {
    animation: `${spin} 1s linear infinite`,
  },
  fadeIn: {
    animation: `${fadeIn} 0.3s ease-out`,
  },
  slideUp: {
    animation: `${slideUp} 0.4s ease-out`,
  },
  scaleIn: {
    animation: `${scaleIn} 0.3s ease-out`,
  },
} as const;

// ─── Hover Effects ────────────────────────────────────────────

export const HOVER_EFFECTS = {
  lift: {
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    '&:hover': {
      transform: 'translateY(-4px)',
      boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
    },
  },
  glow: {
    transition: 'box-shadow 0.3s ease',
    '&:hover': {
      boxShadow: '0 0 20px rgba(230,57,70,0.4), 0 0 40px rgba(230,57,70,0.2)',
    },
  },
  scale: {
    transition: 'transform 0.2s ease',
    '&:hover': {
      transform: 'scale(1.05)',
    },
  },
  borderGlow: {
    transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
    '&:hover': {
      borderColor: 'rgba(230,57,70,0.5)',
      boxShadow: '0 0 12px rgba(230,57,70,0.3)',
    },
  },
} as const;

// ─── Loading Spinner ──────────────────────────────────────────

export const LOADING_SPINNER_SX: SxProps<Theme> = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 40,
  height: 40,
  borderRadius: '50%',
  border: '3px solid rgba(230,57,70,0.2)',
  borderTopColor: '#E63946',
  animation: `${spin} 0.8s linear infinite`,
};

// ─── Reduced Motion Fallback ──────────────────────────────────

export const REDUCED_MOTION_MEDIA = '@media (prefers-reduced-motion: reduce)';

export const withReducedMotion = (sx: SxProps<Theme>): SxProps<Theme> => ({
  ...sx,
  [REDUCED_MOTION_MEDIA]: {
    animation: 'none !important',
    transition: 'none !important',
  },
});