import { Box, Typography, type SxProps, type Theme } from '@mui/material';
import KawaiiCat from './KawaiiCat';

interface KawaiiLoaderProps {
  message?: string;
  color?: string;
  size?: number;
  sx?: SxProps<Theme>;
}

export default function KawaiiLoader({
  message = 'Cargando...',
  color = '#E63946',
  size = 100,
  sx,
}: KawaiiLoaderProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        py: 4,
        ...sx,
      }}
    >
      <KawaiiCat moduleColor={color} size={size} state="loading" />
      {message && (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            fontWeight: 500,
            opacity: 0.8,
          }}
        >
          {message}
        </Typography>
      )}
    </Box>
  );
}