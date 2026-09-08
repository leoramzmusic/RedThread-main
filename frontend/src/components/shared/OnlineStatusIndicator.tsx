import { Box, Typography } from '@mui/material';
import { Circle as CircleIcon } from '@mui/icons-material';

interface OnlineStatusIndicatorProps {
  isOnline: boolean;
  size?: 'small' | 'medium' | 'large';
  showText?: boolean;
  lastSeen?: string; // ISO date string
}

const sizeMap = {
  small: 8,
  medium: 12,
  large: 16,
};

export default function OnlineStatusIndicator({
  isOnline,
  size = 'small',
  showText = false,
  lastSeen,
}: OnlineStatusIndicatorProps) {
  const dotSize = sizeMap[size];

  return (
    <Box display="flex" alignItems="center" gap={0.5}>
      <CircleIcon
        sx={{
          fontSize: dotSize,
          color: isOnline ? '#4CAF50' : '#9E9E9E',
        }}
      />
      {showText && (
        <Typography variant="caption" color="text.secondary">
          {isOnline ? 'Activo ahora' : lastSeen ? `Visto ${getRelativeTime(lastSeen)}` : 'Desconectado'}
        </Typography>
      )}
    </Box>
  );
}

function getRelativeTime(isoDate: string): string {
  const now = new Date();
  const then = new Date(isoDate);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'hace un momento';
  if (diffMins < 60) return `hace ${diffMins} min`;
  if (diffHours < 24) return `hace ${diffHours}h`;
  if (diffDays === 1) return 'ayer';
  if (diffDays < 7) return `hace ${diffDays} días`;
  return 'hace más de una semana';
}
