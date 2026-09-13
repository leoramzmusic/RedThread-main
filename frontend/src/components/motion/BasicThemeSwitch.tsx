import { Box } from '@mui/material';
import { useTheme } from '@mui/material/styles';

interface BasicThemeSwitchProps {
  checked: boolean;
  onChange: () => void;
}

const RED_THREAD = '#D32F2F';
const W = 38;
const H = 22;
const K = 16;
const INSET = 3;

const BasicThemeSwitch = ({ checked, onChange }: BasicThemeSwitchProps) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Box
      component="button"
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={checked ? 'Activar modo claro' : 'Activar modo oscuro'}
      onClick={onChange}
      sx={{
        position: 'relative',
        display: 'inline-block',
        width: W,
        height: H,
        p: 0,
        WebkitAppearance: 'none',
        appearance: 'none',
        cursor: 'pointer',
        borderRadius: '999px',
        bgcolor: checked
          ? RED_THREAD
          : isDark
            ? 'rgba(255,255,255,0.22)'
            : 'rgba(0,0,0,0.26)',
        border: '1px solid',
        borderColor: checked
          ? RED_THREAD
          : isDark
            ? 'rgba(255,255,255,0.14)'
            : 'rgba(0,0,0,0.12)',
        boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.22)',
        transition: 'background-color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease',
        '&:hover': {
          boxShadow: checked
            ? 'inset 0 1px 2px rgba(0,0,0,0.22), 0 0 10px rgba(211,47,47,0.35)'
            : 'inset 0 1px 2px rgba(0,0,0,0.22)',
        },
        '&:focus-visible': {
          outline: '2px solid',
          outlineOffset: 2,
          outlineColor: theme.palette.primary.main,
        },
        '@media (prefers-reduced-motion: reduce)': {
          '& *': { animation: 'none !important', transition: 'none !important' },
        },
      }}
    >
      <Box
        component="span"
        sx={{
          position: 'absolute',
          width: K,
          height: K,
          borderRadius: '50%',
          top: '50%',
          transform: 'translateY(-50%)',
          left: checked ? W - K - INSET : INSET,
          bgcolor: '#fff',
          boxShadow: '0 1px 2px rgba(0,0,0,0.28)',
          transition: 'left 0.25s ease',
        }}
      />
    </Box>
  );
};

export default BasicThemeSwitch;