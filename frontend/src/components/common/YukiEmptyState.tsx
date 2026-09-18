import { Box, Typography, Button, type SxProps, type Theme } from '@mui/material';
import KawaiiCat from './KawaiiCat';

interface YukiEmptyStateProps {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  MascotState?: 'sleeping' | 'curious' | 'idle';
  sx?: SxProps<Theme>;
}

export default function YukiEmptyState({
  title,
  description,
  actionLabel,
  onAction,
  MascotState = 'sleeping',
  sx,
}: YukiEmptyStateProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        py: 8,
        px: 3,
        gap: 2,
        ...sx,
      }}
    >
      <KawaiiCat
        state={MascotState}
        size={100}
        interactive={false}
      />
      <Typography
        variant="h6"
        sx={{
          fontWeight: 700,
          color: 'rgba(255,255,255,0.9)',
          mt: 1,
        }}
      >
        {title}
      </Typography>
      {description && (
        <Typography
          variant="body2"
          sx={{
            color: 'rgba(255,255,255,0.6)',
            maxWidth: 320,
            lineHeight: 1.6,
          }}
        >
          {description}
        </Typography>
      )}
      {actionLabel && onAction && (
        <Button
          variant="contained"
          onClick={onAction}
          sx={{
            mt: 1,
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 600,
            bgcolor: '#E63946',
            '&:hover': { bgcolor: '#FF6B6B' },
          }}
        >
          {actionLabel}
        </Button>
      )}
    </Box>
  );
}