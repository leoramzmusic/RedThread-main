import { useState, useEffect } from 'react';
import { Box, Typography, Paper, type SxProps, type Theme } from '@mui/material';
import KawaiiCat from './KawaiiCat';

type BadgeType = 'achievement' | 'streak' | 'levelup' | 'milestone';

interface YukiBadgeProps {
  type?: BadgeType;
  title: string;
  description?: string;
  visible?: boolean;
  autoHide?: boolean;
  autoHideMs?: number;
  onDismiss?: () => void;
  sx?: SxProps<Theme>;
}

const BADGE_CONFIG: Record<BadgeType, { color: string; emoji: string }> = {
  achievement: { color: '#E63946', emoji: '🏆' },
  streak: { color: '#F59E0B', emoji: '🔥' },
  levelup: { color: '#8B5CF6', emoji: '⭐' },
  milestone: { color: '#10B981', emoji: '🎯' },
};

export default function YukiBadge({
  type = 'achievement',
  title,
  description,
  visible = true,
  autoHide = true,
  autoHideMs = 4000,
  onDismiss,
  sx,
}: YukiBadgeProps) {
  const [show, setShow] = useState(visible);
  const [isExiting, setIsExiting] = useState(false);
  const config = BADGE_CONFIG[type];

  useEffect(() => {
    setShow(visible);
    setIsExiting(false);
  }, [visible]);

  useEffect(() => {
    if (!show || !autoHide) return;
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => {
        setShow(false);
        onDismiss?.();
      }, 300);
    }, autoHideMs);
    return () => clearTimeout(timer);
  }, [show, autoHide, autoHideMs, onDismiss]);

  if (!show) return null;

  return (
    <Paper
      elevation={4}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        p: 2,
        borderRadius: 3,
        bgcolor: 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(16px)',
        border: '1px solid',
        borderColor: `${config.color}33`,
        boxShadow: `0 8px 32px ${config.color}22, 0 0 0 1px ${config.color}11`,
        maxWidth: 320,
        opacity: isExiting ? 0 : 1,
        transform: isExiting ? 'translateY(-10px) scale(0.95)' : 'translateY(0) scale(1)',
        transition: 'all 0.3s ease',
        '@media (prefers-reduced-motion: reduce)': {
          transition: 'none',
        },
        ...sx,
      }}
    >
      <KawaiiCat
        state="success"
        moduleColor={config.color}
        size={56}
        interactive={false}
      />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.25 }}>
          <Typography
            variant="caption"
            sx={{
              color: config.color,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              fontSize: '0.65rem',
            }}
          >
            {config.emoji} {type}
          </Typography>
        </Box>
        <Typography
          variant="subtitle2"
          sx={{
            fontWeight: 700,
            color: '#1A1B1E',
            lineHeight: 1.3,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {title}
        </Typography>
        {description && (
          <Typography
            variant="caption"
            sx={{
              color: '#6B7280',
              lineHeight: 1.4,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {description}
          </Typography>
        )}
      </Box>
    </Paper>
  );
}