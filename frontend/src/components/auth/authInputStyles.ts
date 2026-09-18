import { SxProps, Theme, keyframes } from '@mui/material';

const liquidWave = keyframes`
  0% { transform: scaleX(0); opacity: 0.7; }
  45% { transform: scaleX(1.03); opacity: 1; }
  70% { transform: scaleX(0.99); opacity: 1; }
  100% { transform: scaleX(1); opacity: 1; }
`;

const gradientFlow = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

export const AUTH_INPUT_SX: SxProps<Theme> = {
    '& .MuiInputLabel-root': {
        color: 'rgba(255,255,255,0.6)',
    },
    '& .MuiInputLabel-shrink': {
        color: 'rgba(255,255,255,0.85)',
    },
    '& .MuiInputBase-root': {
        color: '#FFFFFF',
    },
    '& .MuiInputBase-input': {
        caretColor: '#E63946',
    },
    '& .MuiInputBase-input::placeholder': {
        color: 'rgba(255,255,255,0.45)',
        opacity: 1,
    },
    '& .MuiInputBase-root::before': {
        borderBottom: '1px solid rgba(255,255,255,0.35)',
    },
    '& .MuiInputBase-root:hover:not(.Mui-disabled)::before': {
        borderBottom: '1px solid rgba(255,255,255,0.7)',
    },
    '& .MuiInputBase-root::after': {
        borderBottom: '2px solid #E63946',
        boxShadow: '0 2px 8px rgba(230, 57, 70, 0.55)',
    },
    '& .MuiInputBase-root.Mui-focused::after': {
        borderBottom: '2px solid #E63946',
        boxShadow: '0 2px 10px rgba(230, 57, 70, 0.75), 0 10px 22px -12px rgba(230, 57, 70, 0.75)',
        transformOrigin: 'center',
        '@media (prefers-reduced-motion: no-preference)': {
            animation: `${liquidWave} 0.45s ease-out`,
        },
    },
    '& .MuiInputBase-root.Mui-focused': {
        boxShadow: '0 14px 24px -18px rgba(230, 57, 70, 0.55)',
    },
    '& .MuiFormHelperText-root': {
        color: 'rgba(255,255,255,0.6)',
    },
};

export const SOCIAL_BTN_SX: SxProps<Theme> = {
    width: 40,
    height: 40,
    border: '1px solid rgba(255,255,255,0.3)',
    bgcolor: 'rgba(255,255,255,0.1)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    m: '0 8px',
    transition: 'all 0.25s ease',
    '&:hover': {
        transform: 'scale(1.12) rotate(-6deg)',
        boxShadow: '0 10px 24px rgba(59, 130, 246, 0.45), 0 0 0 2px rgba(59,130,246,0.15)',
        bgcolor: 'rgba(255,255,255,0.18)',
    },
};

export const SUBMIT_BTN_SX: SxProps<Theme> = {
    mt: 3,
    mb: 2,
    height: 48,
    borderRadius: 999,
    fontSize: '1rem',
    fontWeight: 700,
    textTransform: 'none',
    letterSpacing: '0.02em',
    color: '#FFFFFF',
    overflow: 'hidden',
    background: 'linear-gradient(90deg, #E63946 0%, #FF6B6B 45%, #B71C1C 75%, #E63946 100%)',
    backgroundSize: '200% 200%',
    backgroundPosition: '0% 50%',
    boxShadow: '0 10px 28px rgba(230, 57, 70, 0.45), inset 0 1px 0 rgba(255,255,255,0.25)',
    transition: 'box-shadow 0.3s ease, transform 0.3s ease, filter 0.3s ease',
    '@media (prefers-reduced-motion: no-preference)': {
        animation: `${gradientFlow} 6s ease infinite`,
    },
    '&:hover': {
        boxShadow: '0 16px 40px rgba(230, 57, 70, 0.75), inset 0 1px 0 rgba(255,255,255,0.5)',
        transform: 'translateY(-2px)',
        filter: 'brightness(1.08)',
    },
    '&:active': {
        transform: 'translateY(0) scale(0.99)',
    },
    '&:disabled': {
        background: 'rgba(255,255,255,0.12)',
    },
};