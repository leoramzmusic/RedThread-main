import { useState, useEffect, useCallback, type ReactNode } from 'react';
import { Box, Typography, Paper, Fade, IconButton, ClickAwayListener, useTheme } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import KawaiiCat from './KawaiiCat';

interface YukiTooltipProps {
  message: string;
  title?: string;
  children: ReactNode;
  storageKey?: string;
  mascotState?: 'idle' | 'curious' | 'waving';
  moduleColor?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  autoShow?: boolean;
  autoShowDelay?: number;
  onDismiss?: () => void;
}

export default function YukiTooltip({
  message,
  title = 'Yuki dice:',
  children,
  storageKey,
  mascotState = 'curious',
  moduleColor = '#E63946',
  position = 'top',
  autoShow = true,
  autoShowDelay = 2000,
  onDismiss,
}: YukiTooltipProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!autoShow) return;
    if (storageKey && localStorage.getItem(storageKey)) return;
    const timer = setTimeout(() => setIsOpen(true), autoShowDelay);
    return () => clearTimeout(timer);
  }, [autoShow, autoShowDelay, storageKey]);

  const handleDismiss = useCallback(() => {
    setIsOpen(false);
    if (storageKey) localStorage.setItem(storageKey, 'dismissed');
    onDismiss?.();
  }, [storageKey, onDismiss]);

  const positionStyles = {
    top: { bottom: '100%', left: '50%', transform: 'translateX(-50%)', mb: 1, '&::after': { bottom: -6, left: '50%', transform: 'translateX(-50%) rotate(45deg)' } },
    bottom: { top: '100%', left: '50%', transform: 'translateX(-50%)', mt: 1, '&::after': { top: -6, left: '50%', transform: 'translateX(-50%) rotate(45deg)' } },
    left: { right: '100%', top: '50%', transform: 'translateY(-50%)', mr: 1, '&::after': { right: -6, top: '50%', transform: 'translateY(-50%) rotate(45deg)' } },
    right: { left: '100%', top: '50%', transform: 'translateY(-50%)', ml: 1, '&::after': { left: -6, top: '50%', transform: 'translateY(-50%) rotate(45deg)' } },
  }[position];

  return (
    <ClickAwayListener onClickAway={handleDismiss}>
      <Box sx={{ position: 'relative', display: 'inline-block' }}>
        {children}
        <Fade in={isOpen}>
          <Paper
            elevation={6}
            sx={{
              position: 'absolute',
              zIndex: 1500,
              ...positionStyles,
              p: 1.5,
              maxWidth: 260,
              borderRadius: 2,
              bgcolor: isDark ? 'rgba(29,29,31,0.97)' : 'rgba(255,255,255,0.97)',
              backdropFilter: 'blur(12px)',
              border: '1px solid',
              borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
              '&::after': {
                content: '""',
                position: 'absolute',
                width: 10,
                height: 10,
                bgcolor: isDark ? 'rgba(29,29,31,0.97)' : 'rgba(255,255,255,0.97)',
                border: '1px solid',
                borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
              },
            }}
          >
            <IconButton
              size="small"
              onClick={handleDismiss}
              aria-label="Cerrar"
              sx={{
                position: 'absolute',
                top: 4,
                right: 4,
                color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.3)',
              }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
              <KawaiiCat
                state={mascotState}
                moduleColor={moduleColor}
                size={36}
                interactive={false}
              />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                {title && (
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: 700,
                      color: moduleColor,
                      display: 'block',
                      mb: 0.25,
                    }}
                  >
                    {title}
                  </Typography>
                )}
                <Typography
                  variant="caption"
                  sx={{
                    color: isDark ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.75)',
                    lineHeight: 1.5,
                    display: 'block',
                  }}
                >
                  {message}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Fade>
      </Box>
    </ClickAwayListener>
  );
}