import { Box } from '@mui/material';
import { useTheme } from '@mui/material/styles';

interface SubtleThemeSwitchProps {
  checked: boolean;
  onChange: () => void;
}

const W = 38;
const H = 22;
const K = 16;
const OFFSET = 3;

const SubtleThemeSwitch = ({ checked, onChange }: SubtleThemeSwitchProps) => {
  const theme = useTheme();

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
        bgcolor: checked ? 'hsl(230, 6%, 30%)' : 'hsl(240, 5%, 90%)',
        borderRadius: '999px',
        transition: 'background-color 0.4s ease',
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
          left: checked ? W - K - OFFSET : OFFSET,
          background: checked
            ? 'hsl(230, 6%, 30%)'
            : 'linear-gradient(40deg, #ff0080, #ff8c00 70%)',
          boxShadow: checked
            ? 'inset -2px -1.5px 3.5px -1.5px #8983f7, inset -7px -3px 0 0 #a3dafb'
            : 'none',
          transition: 'left 0.4s ease, background-color 0.4s ease, box-shadow 0.4s ease',
        }}
      />
    </Box>
  );
};

export default SubtleThemeSwitch;