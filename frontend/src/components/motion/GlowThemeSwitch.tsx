import { useState } from 'react';
import { Box } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { MorphIcon } from 'morphicons/react';
import { Moon, Sun } from 'lucide';

interface GlowThemeSwitchProps {
  checked: boolean;
  onChange: () => void;
}

const RED = '#D32F2F';

const W = 38;
const K = 16;
const EDGE_INSET = 2;

const GlowThemeSwitch = ({ checked, onChange }: GlowThemeSwitchProps) => {
  const theme = useTheme();
  const [pulseKey, setPulseKey] = useState(0);

  const handleClick = () => {
    setPulseKey((k) => k + 1);
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
        display: 'inline-block',
        width: 38,
        height: 22,
        p: 0,
        WebkitAppearance: 'none',
        appearance: 'none',
        cursor: 'pointer',
        borderRadius: '999px',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        bgcolor: 'rgba(255,255,255,0.06)',
        boxShadow: checked
          ? `inset 0 1px 2px rgba(0,0,0,0.18), 0 0 12px rgba(211,47,47,0.6)`
          : 'inset 0 1px 2px rgba(0,0,0,0.18)',
        transition: 'background 0.3s ease, box-shadow 0.3s ease',
        '&:hover': {
          boxShadow: `inset 0 1px 2px rgba(0,0,0,0.18), 0 0 14px rgba(211,47,47,0.45)`,
        },
        '&:focus-visible': {
          outline: '2px solid',
          outlineOffset: 2,
          outlineColor: theme.palette.primary.main,
        },
        '@keyframes rtGlowPulse': {
          from: { boxShadow: '0 0 0 0 rgba(211,47,47,0.5)' },
          to: { boxShadow: '0 0 0 12px rgba(211,47,47,0)' },
        },
        '@media (prefers-reduced-motion: reduce)': {
          '& *': { animation: 'none !important', transition: 'none !important' },
        },
      }}
    >
      {pulseKey > 0 && (
        <Box
          key={pulseKey}
          sx={{
            position: 'absolute',
            inset: 0,
            borderRadius: '20px',
            pointerEvents: 'none',
            animation: `rtGlowPulse 0.5s ease-out`,
          }}
        />
      )}

      <Box
        component="span"
        sx={{
          position: 'absolute',
          width: 16,
          height: 16,
          borderRadius: '50%',
          top: '50%',
          transform: 'translateY(-50%)',
          left: checked ? W - K - EDGE_INSET : 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: checked ? '#f2f6ff' : '#7a5200',
          bgcolor: checked ? '#7D86AB' : '#FFB300',
          boxShadow: checked
            ? `0 0 8px ${theme.palette.mode === 'dark' ? 'rgba(211,47,47,0.5)' : 'rgba(211,47,47,0.4)'}`
            : '0 0 8px rgba(255,179,0,0.45)',
          transition:
            'left 0.3s cubic-bezier(0.34,1.56,0.64,1), background-color 0.3s ease, box-shadow 0.3s ease',
        }}
      >
        <MorphIcon
          icon={checked ? Moon : Sun}
          size={13}
          strokeWidth={2.2}
          absoluteStrokeWidth
          color={checked ? '#f2f6ff' : '#7a5200'}
          reducedMotion="user"
          spring="snappy"
        />
      </Box>
    </Box>
  );
};

export default GlowThemeSwitch;