import { Box } from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import React, { forwardRef } from 'react';

interface ThemeSwitchProps {
  checked: boolean;
  onChange: () => void;
}

const W = 38;
const H = 22;
const K = 16;
const NIGHT_LEFT = 4.75;
const DAY_LEFT = 21.85;

const STARS = [
  { left: 23.75, top: 4.75 },
  { left: 20.9, top: 11.4 },
  { left: 28.5, top: 8.55 },
];

const ThemeSwitch = forwardRef<HTMLButtonElement, ThemeSwitchProps & React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ checked, onChange, ...rest }, ref) => {
  const theme = useTheme();
  const primary = theme.palette.primary.main;
  const isNight = checked;

  return (
    <Box
      ref={ref}
      component="button"
      {...rest}
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
        boxShadow: '0 0 10px rgba(0,0,0,0.1)',
        '&:hover': {
          boxShadow: `0 0 10px rgba(0,0,0,0.1), 0 0 12px ${alpha(primary, 0.4)}`,
        },
        '&:focus-visible': {
          outline: '2px solid',
          outlineOffset: 2,
          outlineColor: primary,
        },
        '@media (prefers-reduced-motion: reduce)': {
          '& *, & *::before, & *::after': {
            animation: 'none !important',
            transition: 'none !important',
          },
        },
      }}
    >
      {/* slider: track */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          borderRadius: '999px',
          overflow: 'hidden',
          bgcolor: isNight ? '#2a2a2a' : '#00a6ff',
          transition: 'background-color 0.4s ease',
        }}
      >
        {/* estrellas */}
        {STARS.map((star, i) => (
          <Box
            key={i}
            sx={{
              position: 'absolute',
              width: 3,
              height: 3,
              borderRadius: '50%',
              bgcolor: '#fff',
              left: star.left,
              top: star.top,
              opacity: isNight ? 1 : 0,
              transition: 'all 0.4s',
            }}
          />
        ))}

        {/* nube */}
        <Box
          component="svg"
          viewBox="0 0 16 16"
          sx={{
            width: 33.2,
            position: 'absolute',
            bottom: -13.3,
            left: -10.45,
            opacity: isNight ? 0 : 1,
            transition: 'all 0.4s',
          }}
        >
          <path
            transform="matrix(.77976 0 0 .78395-299.99-418.63)"
            fill="#fff"
            d="m391.84 540.91c-.421-.329-.949-.524-1.523-.524-1.351 0-2.451 1.084-2.485 2.435-1.395.526-2.388 1.88-2.388 3.466 0 1.874 1.385 3.423 3.182 3.667v.034h12.73v-.006c1.775-.104 3.182-1.584 3.182-3.395 0-1.747-1.309-3.186-2.994-3.379.007-.106.011-.214.011-.322 0-2.707-2.271-4.901-5.072-4.901-2.073 0-3.856 1.202-4.643 2.925"
          />
        </Box>
      </Box>

      {/* knob: luna creciente (noche) o sol (día) dibujados con box-shadow */}
      <Box
        component="span"
        sx={{
          position: 'absolute',
          width: K,
          height: K,
          borderRadius: '999px',
          top: '50%',
          transform: 'translateY(-50%)',
          left: isNight ? NIGHT_LEFT : DAY_LEFT,
          bgcolor: 'transparent',
          boxShadow: isNight
            ? 'inset 4.5px -2.2px 0px 0px #fff'
            : 'inset 8.4px -2.2px 0px 8.4px #ffcf48',
          transition:
            'left 0.4s cubic-bezier(0.81,-0.04,0.38,1.5), box-shadow 0.4s ease',
          zIndex: 2,
        }}
      />
    </Box>
);
	});

	ThemeSwitch.displayName = 'ThemeSwitch';
	export default ThemeSwitch;