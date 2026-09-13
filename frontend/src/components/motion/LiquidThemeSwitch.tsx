import { useState } from 'react';
import { Box } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { MorphIcon } from 'morphicons/react';
import { Moon, Sun } from 'lucide';

interface LiquidThemeSwitchProps {
  checked: boolean;
  onChange: () => void;
}

const TRACK_W = 38;
const TRACK_H = 22;
const THUMB = 16;
const INSET = 3;

const LiquidThemeSwitch = ({ checked, onChange }: LiquidThemeSwitchProps) => {
  const theme = useTheme();
  const [burstKey, setBurstKey] = useState(0);

  const isDark = theme.palette.mode === 'dark';

  const trackBg = isDark
    ? 'linear-gradient(180deg, rgba(116,124,140,0.5), rgba(28,31,40,0.72))'
    : 'linear-gradient(180deg, rgba(255,255,255,0.55), rgba(218,222,231,0.68))';

  const handleClick = () => {
    setBurstKey((k) => k + 1);
    onChange();
  };

  return (
    <Box
      component="button"
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={checked ? 'Activar modo claro' : 'Activar modo oscuro'}
      onClick={handleClick}
      sx={{
        position: 'relative',
        width: TRACK_W,
        height: TRACK_H,
        p: 0,
        overflow: 'visible',
        WebkitAppearance: 'none',
        appearance: 'none',
        cursor: 'pointer',
        borderRadius: '999px',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        border: '1px solid rgba(255,255,255,0.18)',
        background: checked
          ? 'linear-gradient(90deg, rgba(211,47,47,0.75), rgba(255,138,92,0.65), rgba(253,41,123,0.7), rgba(211,47,47,0.75))'
          : trackBg,
        backgroundSize: checked ? '200% 200%' : undefined,
        backgroundPosition: checked ? '0% 50%' : undefined,
        animation: checked ? 'rtLiquidFlow 5s ease-in-out infinite' : undefined,
        boxShadow: checked
          ? 'inset 0 1px 1px rgba(255,255,255,0.25), 0 0 12px rgba(211,47,47,0.6)'
          : 'inset 0 1px 1px rgba(255,255,255,0.2), inset 0 -1px 1px rgba(0,0,0,0.12), 0 4px 14px -6px rgba(0,0,0,0.5)',
        transition: 'box-shadow 0.4s ease, border-color 0.4s ease',
        '&:hover': {
          boxShadow: checked
            ? 'inset 0 1px 1px rgba(255,255,255,0.25), 0 0 16px rgba(211,47,47,0.7)'
            : 'inset 0 1px 1px rgba(255,255,255,0.2), inset 0 -1px 1px rgba(0,0,0,0.12), 0 4px 14px -6px rgba(0,0,0,0.5), 0 0 12px rgba(211,47,47,0.35)',
        },
        '&:focus-visible': {
          outline: '2px solid',
          outlineOffset: 2,
          outlineColor: theme.palette.primary.main,
        },
        '@keyframes rtLiquidFlow': {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
        '@keyframes rtLiquidBurst': {
          from: { boxShadow: '0 0 0 2px rgba(211,47,47,0.5), 0 0 14px rgba(211,47,47,0.55)' },
          to: { boxShadow: '0 0 0 11px rgba(211,47,47,0), 0 0 14px rgba(211,47,47,0)' },
        },
        '@keyframes rtLiquidBreath': {
          '0%, 100%': { transform: 'translateY(-50%)', boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.7), 0 2px 6px -1px rgba(0,0,0,0.35)' },
          '50%': {
            transform: 'translateY(-50%) scale(1.05)',
            boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.7), 0 2px 6px -1px rgba(0,0,0,0.35), 0 0 14px rgba(211,47,47,0.55)',
          },
        },
        '@media (prefers-reduced-motion: reduce)': {
          '& *': { animation: 'none !important', transition: 'none !important' },
        },
      }}
    >
      {burstKey > 0 && (
        <Box
          key={burstKey}
          sx={{
            position: 'absolute',
            inset: 0,
            borderRadius: '999px',
            pointerEvents: 'none',
            animation: 'rtLiquidBurst 0.4s ease-out',
          }}
        />
      )}

      {/* thumb: vidrio translúcido con reflejo e ícono sol/luna incrustado */}
      <Box
        component="span"
        sx={{
          position: 'absolute',
          width: THUMB,
          height: THUMB,
          borderRadius: '50%',
          top: '50%',
          transform: 'translateY(-50%)',
          left: checked ? TRACK_W - THUMB - INSET : INSET,
          zIndex: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
          bgcolor: 'rgba(255,255,255,0.68)',
          color: checked ? '#f2f6ff' : '#8a6d00',
          boxShadow: checked
            ? 'inset 0 1px 1px rgba(255,255,255,0.75), inset 0 0 0 1px rgba(255,255,255,0.25), 0 2px 6px -1px rgba(0,0,0,0.4), 0 0 10px rgba(211,47,47,0.45)'
            : 'inset 0 1px 1px rgba(255,255,255,0.75), inset 0 0 0 1px rgba(255,255,255,0.25), inset 0 -2px 4px rgba(0,0,0,0.12), 0 2px 6px -1px rgba(0,0,0,0.35)',
          transition:
            'left 0.4s cubic-bezier(0.34,1.4,0.5,1), box-shadow 0.4s ease, background-color 0.4s ease',
          '&:hover': {
            animation: 'rtLiquidBreath 2.4s ease-in-out infinite',
          },
        }}
      >
        <MorphIcon
          icon={checked ? Moon : Sun}
          size={11}
          strokeWidth={2.2}
          absoluteStrokeWidth
          color={checked ? '#f2f6ff' : '#8a6d00'}
          reducedMotion="user"
          spring="snappy"
        />
      </Box>
    </Box>
  );
};

export default LiquidThemeSwitch;