import { SxProps, Theme, keyframes } from '@mui/material';

export const glassBorderSpin = keyframes`
  to { transform: rotate(360deg); }
`;

export const GLASS_ICON_BTN_SX: SxProps<Theme> = {
    position: 'relative',
    color: '#FFFFFF',
    fontFamily: "'Inter', 'Poppins', sans-serif",
    borderRadius: 2,
    bgcolor: 'rgba(255,255,255,0.10)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    border: '1px solid rgba(211,47,47,0.55)',
    transition: 'background-color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease',
    '&:hover, &.rt-open': {
        borderColor: '#D32F2F',
        bgcolor: 'rgba(255,255,255,0.16)',
        boxShadow: '0 0 22px rgba(255,193,7,0.55), 0 0 6px rgba(211,47,47,0.7)',
    },
    '&:active': { transform: 'scale(0.97)' },
    '&::after': {
        content: '""',
        position: 'absolute',
        inset: 0,
        borderRadius: 'inherit',
        padding: '1.5px',
        background:
            'conic-gradient(from 0deg, rgba(211,47,47,0) 0deg 260deg, rgba(251,113,133,1) 330deg, #D32F2F 360deg)',
        WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
        WebkitMaskComposite: 'xor',
        mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
        maskComposite: 'exclude',
        opacity: 0,
        pointerEvents: 'none',
    },
    '&:hover::after, &.rt-open::after': { opacity: 1 },
    '@media (prefers-reduced-motion: no-preference)': {
        '&:hover::after, &.rt-open::after': {
            animation: `${glassBorderSpin} 2.2s linear infinite`,
        },
    },
};