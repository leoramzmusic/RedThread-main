import { Box, alpha } from '@mui/material';
import { useTheme } from '@mui/material/styles';

interface NavLinkProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

export default function NavLink({ label, active, onClick }: NavLinkProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const primary = theme.palette.primary.main;

  const baseColor = isDark ? 'rgba(255,255,255,0.74)' : 'rgba(33,33,33,0.74)';
  const hoverColor = isDark ? '#FFFFFF' : '#111111';

  return (
    <Box
      onClick={onClick}
      sx={{
        position: 'relative',
        cursor: 'pointer',
        userSelect: 'none',
        whiteSpace: 'nowrap',
        flexShrink: 0,
        px: 1.4,
        py: 0.8,
        borderRadius: '999px',
        fontSize: '0.875rem',
        fontWeight: active ? 700 : 500,
        letterSpacing: '0.2px',
        color: active ? primary : baseColor,
        background: active
          ? `linear-gradient(90deg, ${alpha(primary, 0.2)}, ${alpha(primary, 0.04)})`
          : 'transparent',
        transition: 'background 0.3s ease, color 0.3s ease, box-shadow 0.3s ease, transform 0.3s ease',
        '&:hover': {
          background: `linear-gradient(90deg, ${alpha(primary, 0.12)}, ${alpha(primary, 0.02)})`,
          color: active ? primary : hoverColor,
          textShadow: isDark
            ? `0 0 18px ${alpha(primary, 0.65)}`
            : `0 0 14px ${alpha(primary, 0.45)}`,
          transform: 'translateY(-1px)',
          '&::after': { width: '100%', left: 0 },
        },
        // Animated thread underline in the accent color of the active theme
        '&::after': {
          content: '""',
          position: 'absolute',
          left: active ? '18%' : '50%',
          bottom: '3px',
          height: 2,
          width: active ? '64%' : '0%',
          borderRadius: '999px',
          background: `linear-gradient(90deg, ${primary}, ${alpha(primary, 0.35)})`,
          boxShadow: `0 0 8px ${alpha(primary, 0.8)}`,
          transition: 'width 0.3s ease, left 0.3s ease',
          animation: active ? 'rtNavThread 0.5s ease' : undefined,
        },
        '@media (prefers-reduced-motion: no-preference)': {
          '@keyframes rtNavThread': {
            from: { width: '0%', left: '50%' },
            to: { width: '64%', left: '18%' },
          },
        },
      }}
    >
      {label}
    </Box>
  );
}