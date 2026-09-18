import { forwardRef } from 'react';
import { Box, Typography, IconButton, type SxProps, type Theme } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import KawaiiCat from './KawaiiCat';

type NotificationType = 'success' | 'error' | 'warning' | 'info';

interface YukiSnackbarProps {
  message: string;
  type?: NotificationType;
  onClose?: () => void;
  sx?: SxProps<Theme>;
}

const SNACKBAR_CONFIG: Record<NotificationType, { color: string; state: 'success' | 'error' | 'idle' | 'curious' }> = {
  success: { color: '#10B981', state: 'success' },
  error: { color: '#EF4444', state: 'error' },
  warning: { color: '#F59E0B', state: 'curious' },
  info: { color: '#3B82F6', state: 'idle' },
};

const StyledSnackbar = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  padding: '12px 16px',
  borderRadius: 12,
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(255,255,255,0.1)',
  boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
  maxWidth: 360,
}));

const YukiSnackbar = forwardRef<HTMLDivElement, YukiSnackbarProps>(
  ({ message, type = 'info', onClose, sx }, ref) => {
    const config = SNACKBAR_CONFIG[type];

    return (
      <StyledSnackbar
        ref={ref}
        sx={{
          bgcolor: 'rgba(29,29,31,0.95)',
          ...sx,
        }}
      >
        <KawaiiCat
          state={config.state}
          moduleColor={config.color}
          size={40}
          interactive={false}
        />
        <Typography
          variant="body2"
          sx={{
            flex: 1,
            color: 'rgba(255,255,255,0.9)',
            fontWeight: 500,
            lineHeight: 1.4,
          }}
        >
          {message}
        </Typography>
        {onClose && (
          <IconButton
            size="small"
            onClick={onClose}
            aria-label="Cerrar"
            sx={{ color: 'rgba(255,255,255,0.5)', '&:hover': { color: 'rgba(255,255,255,0.8)' } }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        )}
      </StyledSnackbar>
    );
  }
);

YukiSnackbar.displayName = 'YukiSnackbar';

export default YukiSnackbar;