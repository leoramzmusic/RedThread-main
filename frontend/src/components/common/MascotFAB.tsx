import { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { Box, IconButton, Typography, Paper, Fade, useTheme, alpha } from '@mui/material';
import { useRouter } from 'next/router';
import KawaiiCat from '../common/KawaiiCat';
import { useYukiConfig } from '../../context/YukiConfigContext';

interface Tip {
  text: string;
  state: 'idle' | 'loading' | 'success' | 'error' | 'sleeping' | 'curious';
}

const GLOBAL_TIPS: Tip[] = [
  { text: '¡Hola! Soy Yuki, tu gatito guía 🐱', state: 'idle' },
  { text: '¿Necesitas ayuda? ¡Estoy aquí para ti!', state: 'idle' },
  { text: '¡Puedes cambiar tu tema en Apariencia!', state: 'curious' },
];

const ROUTE_TIPS: Record<string, Tip[]> = {
  '/auth': [
    { text: '¡Bienvenido! Inicia sesión para empezar', state: 'idle' },
    { text: '¿No tienes cuenta? ¡Regístrate gratis!', state: 'curious' },
  ],
  '/discover': [
    { text: 'El radar de proximidad encuentra personas cerca de ti', state: 'curious' },
    { text: '¡Desliza para descubrir nuevos matches!', state: 'idle' },
    { text: 'Usa los filtros para encontrar personas similares', state: 'curious' },
  ],
  '/chat': [
    { text: '¿Cómo va la conversación? ¡Tú puedes!', state: 'idle' },
    { text: 'Un buen mensaje de inicio hace la diferencia ✨', state: 'idle' },
  ],
  '/profile': [
    { text: '¡No olvides completar tu perfil para mejores matches!', state: 'curious' },
    { text: 'Las fotos con buena luz siempre ganan 📸', state: 'idle' },
  ],
  '/radar': [
    { text: 'El radar detecta personas cerca de ti', state: 'curious' },
    { text: '¡Activa la ubicación para mejores resultados!', state: 'idle' },
  ],
  '/settings': [
    { text: 'Personaliza tu experiencia aquí', state: 'idle' },
    { text: 'Puedes cambiar tu tema en Apariencia', state: 'curious' },
  ],
};

const CAT_PAW_SVG = (
  <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
    <ellipse cx="12" cy="16" rx="5" ry="4.5" />
    <circle cx="7" cy="9" r="2.5" />
    <circle cx="12" cy="7" r="2.5" />
    <circle cx="17" cy="9" r="2.5" />
    <circle cx="7" cy="9" r="1.2" fill="rgba(255,255,255,0.3)" />
    <circle cx="12" cy="7" r="1.2" fill="rgba(255,255,255,0.3)" />
    <circle cx="17" cy="9" r="1.2" fill="rgba(255,255,255,0.3)" />
    <ellipse cx="12" cy="16" rx="2.5" ry="2" fill="rgba(255,255,255,0.3)" />
  </svg>
);

export default memo(function MascotFAB() {
  const theme = useTheme();
  const router = useRouter();
  const { config } = useYukiConfig();
  const isDark = theme.palette.mode === 'dark';
  const [isOpen, setIsOpen] = useState(false);
  const [tipIndex, setTipIndex] = useState(0);
  const [isWiggling, setIsWiggling] = useState(false);

  if (!config?.enabled) return null;

  const basePath = router?.pathname
    ? '/' + (router.pathname.split('/')[1] || '')
    : '/';

  const currentTips = useMemo(() => {
    const routeTips = ROUTE_TIPS[basePath] || [];
    return [...routeTips, ...GLOBAL_TIPS];
  }, [basePath]);

  const cycleTip = useCallback(() => {
    setTipIndex((prev) => (prev + 1) % currentTips.length);
  }, [currentTips.length]);

  // Reset tip index when route changes
  useEffect(() => {
    setTipIndex(0);
  }, [basePath]);

  // Wiggle every 15s to attract attention
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isOpen) {
        setIsWiggling(true);
        setTimeout(() => setIsWiggling(false), 800);
      }
    }, 15000);
    return () => clearInterval(interval);
  }, [isOpen]);

  // Auto-cycle tips when open
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(cycleTip, 5000);
    return () => clearInterval(interval);
  }, [isOpen, cycleTip]);

  const handleToggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  // Reset tip index when opening
  useEffect(() => {
    if (isOpen) setTipIndex(0);
  }, [isOpen]);

  const currentTip = currentTips[tipIndex];

  const handleCatKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      cycleTip();
    }
  }, [cycleTip]);

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 1300,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: 1.5,
      }}
    >
      {/* Speech bubble + Cat */}
      <Fade in={isOpen}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: 1,
          }}
        >
          {/* Speech bubble */}
          <Paper
            elevation={3}
            role="status"
            aria-live="polite"
            sx={{
              p: 2,
              maxWidth: 240,
              borderRadius: 3,
              bgcolor: isDark ? 'rgba(29,29,31,0.95)' : 'rgba(255,255,255,0.95)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid',
              borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
              boxShadow: `0 8px 32px rgba(0,0,0,0.15), 0 0 0 1px ${alpha('#E63946', 0.1)}`,
              position: 'relative',
              '&::after': {
                content: '""',
                position: 'absolute',
                bottom: -8,
                right: 20,
                width: 0,
                height: 0,
                borderLeft: '8px solid transparent',
                borderRight: '8px solid transparent',
                borderTop: `8px solid ${isDark ? 'rgba(29,29,31,0.95)' : 'rgba(255,255,255,0.95)'}`,
              },
            }}
          >
            <Typography
              variant="body2"
              sx={{
                color: isDark ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.8)',
                fontWeight: 500,
                lineHeight: 1.5,
              }}
            >
              {currentTip.text}
            </Typography>
          </Paper>

          {/* Cat mascot with Lottie animation */}
          <Box
            onClick={cycleTip}
            onKeyDown={handleCatKeyDown}
            role="button"
            tabIndex={0}
            aria-label="Yuki - clickea para ver otro tip"
            sx={{
              cursor: 'pointer',
              borderRadius: '50%',
              outline: 'none',
              '&:focus-visible': {
                outline: '2px solid #E63946',
                outlineOffset: 2,
              },
            }}
          >
            <KawaiiCat
              state={currentTip.state}
              moduleColor="#E63946"
              size={90}
              interactive
            />
          </Box>
        </Box>
      </Fade>

      {/* FAB Button */}
      <IconButton
        onClick={handleToggle}
        aria-label={isOpen ? 'Cerrar mascot' : 'Abrir mascot'}
        sx={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          bgcolor: '#E63946',
          color: 'white',
          boxShadow: `0 4px 20px rgba(230,57,70,0.4), 0 0 0 3px ${alpha('#E63946', 0.2)}`,
          transition: 'all 0.3s ease',
          '@media (prefers-reduced-motion: no-preference)': {
            animation: isWiggling ? 'rtPawWiggle 0.8s ease-in-out' : undefined,
          },
          '@keyframes rtPawWiggle': {
            '0%, 100%': { transform: 'rotate(0deg)' },
            '20%': { transform: 'rotate(-15deg)' },
            '40%': { transform: 'rotate(12deg)' },
            '60%': { transform: 'rotate(-8deg)' },
            '80%': { transform: 'rotate(5deg)' },
          },
          '&:hover': {
            bgcolor: '#FF6B6B',
            boxShadow: `0 6px 28px rgba(230,57,70,0.5), 0 0 0 4px ${alpha('#E63946', 0.25)}`,
            transform: 'scale(1.08)',
          },
          '&:active': {
            transform: 'scale(0.95)',
          },
        }}
      >
        {CAT_PAW_SVG}
      </IconButton>
    </Box>
  );
});