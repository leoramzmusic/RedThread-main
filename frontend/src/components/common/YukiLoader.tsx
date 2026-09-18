import { Box, Typography, type SxProps, type Theme } from '@mui/material';
import YukiLottie from './YukiLottie';

interface YukiLoaderProps {
  message?: string;
  size?: number;
  fullscreen?: boolean;
  sx?: SxProps<Theme>;
}

export default function YukiLoader({
  message = 'Cargando...',
  size = 120,
  fullscreen = false,
  sx,
}: YukiLoaderProps) {
  return (
    <Box
      role="status"
      aria-label={message}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        py: 4,
        ...(fullscreen
          ? {
              position: 'fixed',
              inset: 0,
              zIndex: 1400,
              bgcolor: 'rgba(0,0,0,0.3)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
            }
          : {}),
        ...sx,
      }}
    >
      <YukiLottie state="loading" size={size} loop />
      {message && (
        <Typography
          variant="body2"
          sx={{
            color: 'rgba(255,255,255,0.85)',
            fontWeight: 500,
            letterSpacing: '0.3px',
            animation: 'rtPulse 1.5s ease-in-out infinite',
            '@keyframes rtPulse': {
              '0%, 100%': { opacity: 0.6 },
              '50%': { opacity: 1 },
            },
            '@media (prefers-reduced-motion: reduce)': {
              animation: 'none',
              opacity: 0.8,
            },
          }}
        >
          {message}
        </Typography>
      )}
    </Box>
  );
}