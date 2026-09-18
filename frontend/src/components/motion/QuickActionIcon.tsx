import { ReactNode, forwardRef, useState } from 'react';
import { IconButton, Box, useTheme } from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import { getIconStyleSx, IconStyleId, RED_PASSION } from './iconStyles';

interface QuickActionIconProps {
  styleId: IconStyleId;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  motion?: 'bell' | 'gear' | 'globe' | 'switch';
  basicHover?: 'bell' | 'gear';
  asBox?: boolean;
  active?: boolean;
  badgeContent?: ReactNode;
  children: ReactNode;
}

const BELL_HOVER_SX = {
  '&:hover .rt-bell-icon': {
    animation: 'rtBellRing 0.6s ease-in-out',
  },
  '&:active': {
    transform: 'scale(0.8)',
  },
  '@keyframes rtBellRing': {
    '0%, 100%': { transformOrigin: 'top' },
    '15%': { transform: 'rotateZ(10deg)' },
    '30%': { transform: 'rotateZ(-10deg)' },
    '45%': { transform: 'rotateZ(5deg)' },
    '60%': { transform: 'rotateZ(-5deg)' },
    '75%': { transform: 'rotateZ(2deg)' },
  },
} as const;

const GEAR_HOVER_SX = {
  '&:hover .rt-settings-spin': {
    animation: 'rtSpin 2s linear infinite',
  },
  '@keyframes rtSpin': {
    to: { transform: 'rotate(360deg)' },
  },
  '@media (prefers-reduced-motion: reduce)': {
    '& .rt-settings-spin': { animation: 'none !important' },
  },
} as const;

const GLOBE_HOVER_SX = {
  '&:hover .rt-globe': {
    animation: 'rtGlobeSpin 4s linear infinite',
  },
  '@keyframes rtGlobeSpin': {
    to: { transform: 'rotate(360deg)' },
  },
  '@media (prefers-reduced-motion: reduce)': {
    '& .rt-globe': { animation: 'none !important' },
  },
} as const;

const BELL_FILL_KEYFRAMES = {
  '0%': { opacity: 0 },
  '25%': { transform: 'rotate(25deg)' },
  '50%': { transform: 'rotate(-20deg) scale(1.2)' },
  '75%': { transform: 'rotate(15deg)' },
  '100%': { opacity: 1 },
} as const;

function subtleMotionSx(motion: NonNullable<QuickActionIconProps['motion']>) {
  return {
    display: 'flex',
    alignItems: 'center',
    animation:
      motion === 'bell'
        ? 'rtSubtleBell 2.4s ease-in-out infinite'
        : motion === 'switch'
          ? 'rtThemePulse 2.2s ease-in-out infinite'
          : 'none',
    '@media (prefers-reduced-motion: reduce)': {
      animation: 'none',
    },
  };
}

function glowBellSx(active: boolean, gray: string) {
  return {
    position: 'relative',
    '.rt-bell-regular': {
      color: gray,
      filter: 'drop-shadow(0 0 3px rgba(230,57,70,0.35))',
      transition: 'color 0.3s ease, filter 0.3s ease',
      animation: 'rtGlowFill 0.5s ease-out',
    },
    '.rt-bell-solid': {
      display: 'none',
      color: RED_PASSION,
      filter:
        'drop-shadow(0 0 6px rgba(211,47,47,0.8)) drop-shadow(0 0 13px rgba(230,57,70,0.45))',
      transition: 'filter 0.3s ease',
      animation: 'rtGlowFill 0.5s ease-out',
    },
    '.rt-bell-icon': {
      transition: 'color 0.3s ease, filter 0.3s ease, transform 0.3s ease',
    },
    ...(active
      ? {
          '.rt-bell-regular': { display: 'none' },
          '.rt-bell-solid': {
            display: 'block',
            filter:
              'drop-shadow(0 0 8px rgba(211,47,47,0.9)) drop-shadow(0 0 16px rgba(211,47,47,0.5))',
          },
          '.rt-bell-layer': { animation: 'rtGlowBellShake 1.4s ease-in-out infinite' },
          '.rt-bell-icon': {
            color: RED_PASSION,
            filter:
              'drop-shadow(0 0 6px rgba(211,47,47,0.8)) drop-shadow(0 0 13px rgba(230,57,70,0.45))',
            animation: 'rtGlowBellShake 1.4s ease-in-out infinite',
          },
          '&:hover .rt-bell-regular': { display: 'none' },
        }
      : {}),
    '&:hover .rt-bell-regular': {
      color: RED_PASSION,
      filter: 'drop-shadow(0 0 6px rgba(211,47,47,0.75))',
    },
    '&:hover .rt-bell-solid': {
      filter:
        'drop-shadow(0 0 8px rgba(211,47,47,0.9)) drop-shadow(0 0 16px rgba(211,47,47,0.5))',
    },
    '&:hover .rt-bell-icon': {
      color: RED_PASSION,
      filter: 'drop-shadow(0 0 6px rgba(211,47,47,0.75))',
    },
    '&:active': {
      transform: 'scale(0.92)',
    },
    '@keyframes rtGlowFill': BELL_FILL_KEYFRAMES,
    '@keyframes rtGlowBellShake': {
      '0%, 100%': { transform: 'rotate(0deg)' },
      '25%': { transform: 'rotate(-10deg)' },
      '50%': { transform: 'rotate(10deg)' },
      '75%': { transform: 'rotate(-6deg)' },
    },
    '@keyframes rtGlowBurst': {
      from: { boxShadow: '0 0 0 2px rgba(211,47,47,0.5), 0 0 12px rgba(211,47,47,0.55)' },
      to: { boxShadow: '0 0 0 10px rgba(211,47,47,0), 0 0 12px rgba(211,47,47,0)' },
    },
    '@media (prefers-reduced-motion: reduce)': {
      '& *': { animation: 'none !important', transition: 'none !important' },
    },
  } as const;
}

function liquidGearSx(active: boolean) {
  return {
    '.rt-settings-spin': {
      transition: 'color 0.3s ease, filter 0.3s ease',
      animation: 'rtLiquidGearIdle 3.4s ease-in-out infinite',
    },
    '&:hover .rt-settings-spin': {
      color: '#FFB300',
      filter: 'drop-shadow(0 0 10px rgba(255,179,0,0.7))',
      animation: 'rtLiquidGearBreath 2.8s ease-in-out infinite',
    },
    ...(active
      ? {
          '.rt-settings-spin': {
            color: '#D32F2F',
            filter: 'drop-shadow(0 0 12px rgba(211,47,47,0.8))',
          },
        }
      : {}),
    '&:active': {
      transform: 'scale(0.92)',
    },
    '@keyframes rtLiquidGearBreath': {
      '0%, 100%': { filter: 'drop-shadow(0 0 4px rgba(255,179,0,0.35))' },
      '50%': { filter: 'drop-shadow(0 0 10px rgba(255,179,0,0.7))' },
    },
    '@keyframes rtLiquidGearIdle': {
      '0%, 100%': { filter: 'drop-shadow(0 0 2px rgba(255,179,0,0.15))' },
      '50%': { filter: 'drop-shadow(0 0 7px rgba(255,179,0,0.4))' },
    },
    '@keyframes rtLiquidGearBurst': {
      from: { boxShadow: '0 0 0 2px rgba(211,47,47,0.5), 0 0 14px rgba(211,47,47,0.55)' },
      to: { boxShadow: '0 0 0 10px rgba(211,47,47,0), 0 0 14px rgba(211,47,47,0)' },
    },
    '@media (prefers-reduced-motion: reduce)': {
      '& *': { animation: 'none !important', transition: 'none !important' },
    },
  } as const;
}

function premiumGearSx(active: boolean, isDark: boolean) {
  return {
    position: 'relative',
    bgcolor: 'transparent',
    background: 'transparent',
    borderColor: 'transparent',
    backdropFilter: 'none',
    boxShadow: 'none',
    animation: 'none',
    '.rt-premium-gear': {
      position: 'relative',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: '50%',
      padding: '2px',
      background: 'linear-gradient(135deg, #E63946, #FF6B6B, #B71C1C)',
      backgroundSize: '200% 200%',
      transition: 'box-shadow 0.6s ease',
      animation: 'rtPremiumShift 4s linear infinite, rtPremiumGearAura 6s ease-in-out infinite',
    },
    '.rt-premium-gear-inner': {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      backdropFilter: 'blur(10px) saturate(1.6)',
      WebkitBackdropFilter: 'blur(10px) saturate(1.6)',
      background: 'linear-gradient(145deg, rgba(255,255,255,0.12), rgba(0,0,0,0.2))',
      borderRadius: '50%',
      padding: '8px',
    },
    '.rt-settings-spin': {
      color: isDark ? '#9db0e8' : '#3c4c94',
      filter: 'drop-shadow(0 0 6px rgba(90,120,230,0.4))',
      transition: 'color 0.4s ease, filter 0.4s ease',
    },
    ...(active
      ? {
          '.rt-premium-gear': {
            animation:
              'rtPremiumShift 4s linear infinite, rtPremiumGearAura 3.6s ease-in-out infinite, rtPremiumGearPulse 1.6s ease-in-out infinite',
            boxShadow: '0 0 16px rgba(211,47,47,0.55)',
          },
          '.rt-settings-spin': {
            color: '#D32F2F',
            filter: 'drop-shadow(0 0 14px rgba(211,47,47,0.9))',
          },
        }
      : {}),
    '&:active': {
      transform: 'scale(0.92)',
    },
    '@keyframes rtPremiumGearAura': {
      '0%, 100%': { boxShadow: '0 0 10px rgba(90,120,230,0.35)' },
      '33%': { boxShadow: '0 0 12px rgba(255,179,0,0.3)' },
      '66%': { boxShadow: '0 0 14px rgba(211,47,47,0.4)' },
    },
    '@keyframes rtPremiumGearPulse': {
      '0%, 100%': { boxShadow: '0 0 10px rgba(211,47,47,0.5), 0 0 0 0 rgba(211,47,47,0.4)' },
      '50%': {
        boxShadow: '0 0 25px rgba(255,179,0,0.7), 0 0 0 9px rgba(33,150,243,0.3)',
      },
    },
    '@keyframes rtPremiumGearBurst': {
      from: { boxShadow: '0 0 0 2px rgba(211,47,47,0.55), 0 0 18px rgba(230,57,70,0.6)' },
      to: { boxShadow: '0 0 0 12px rgba(211,47,47,0), 0 0 18px rgba(211,47,47,0)' },
    },
    '@media (prefers-reduced-motion: reduce)': {
      '& *': { animation: 'none !important', transition: 'none !important' },
    },
  } as const;
}

function glowGlobeSx(active: boolean) {
  return {
    '.rt-globe': {
      transition: 'color 0.3s ease, filter 0.3s ease',
      animation: 'rtGlowGlobeIdle 3.4s ease-in-out infinite',
    },
    '&:hover .rt-globe': {
      color: RED_PASSION,
      animation: 'rtGlowGlobeBreathe 2.6s ease-in-out infinite',
    },
    ...(active
      ? {
          '.rt-globe': {
            color: '#FFB300',
            filter: 'drop-shadow(0 0 12px rgba(255,179,0,0.8))',
          },
        }
      : {}),
    '&:active': {
      transform: 'scale(0.92)',
    },
    '@keyframes rtGlowGlobeBreathe': {
      '0%, 100%': { filter: 'drop-shadow(0 0 4px rgba(230,57,70,0.35))' },
      '50%': { filter: 'drop-shadow(0 0 10px rgba(211,47,47,0.7))' },
    },
    '@keyframes rtGlowGlobeIdle': {
      '0%, 100%': { filter: 'drop-shadow(0 0 2px rgba(211,47,47,0.18))' },
      '50%': { filter: 'drop-shadow(0 0 7px rgba(230,57,70,0.45))' },
    },
    '@keyframes rtGlowGlobeBurst': {
      from: { boxShadow: '0 0 0 2px rgba(211,47,47,0.5), 0 0 12px rgba(211,47,47,0.55)' },
      to: { boxShadow: '0 0 0 10px rgba(211,47,47,0), 0 0 12px rgba(211,47,47,0)' },
    },
    '@media (prefers-reduced-motion: reduce)': {
      '& *': { animation: 'none !important', transition: 'none !important' },
    },
  } as const;
}

function liquidGlobeSx(active: boolean) {
  return {
    '.rt-globe': {
      transition: 'color 0.3s ease, filter 0.3s ease',
      animation: 'rtLiquidGlobeIdle 3.4s ease-in-out infinite',
    },
    '&:hover .rt-globe': {
      color: '#FFB300',
      filter: 'drop-shadow(0 0 10px rgba(255,179,0,0.7))',
      animation: 'rtLiquidGlobeBreathe 2.8s ease-in-out infinite',
    },
    ...(active
      ? {
          '.rt-globe': {
            color: '#D32F2F',
            filter: 'drop-shadow(0 0 12px rgba(211,47,47,0.8))',
          },
        }
      : {}),
    '&:active': {
      transform: 'scale(0.92)',
    },
    '@keyframes rtLiquidGlobeBreathe': {
      '0%, 100%': { filter: 'drop-shadow(0 0 4px rgba(255,179,0,0.35))' },
      '50%': { filter: 'drop-shadow(0 0 10px rgba(255,179,0,0.7))' },
    },
    '@keyframes rtLiquidGlobeIdle': {
      '0%, 100%': { filter: 'drop-shadow(0 0 2px rgba(255,179,0,0.15))' },
      '50%': { filter: 'drop-shadow(0 0 7px rgba(255,179,0,0.4))' },
    },
    '@keyframes rtLiquidGlobeBurst': {
      from: { boxShadow: '0 0 0 2px rgba(211,47,47,0.5), 0 0 14px rgba(211,47,47,0.55)' },
      to: { boxShadow: '0 0 0 10px rgba(211,47,47,0), 0 0 14px rgba(211,47,47,0)' },
    },
    '@media (prefers-reduced-motion: reduce)': {
      '& *': { animation: 'none !important', transition: 'none !important' },
    },
  } as const;
}

function premiumGlobeSx(active: boolean, isDark: boolean) {
  return {
    position: 'relative',
    bgcolor: 'transparent',
    background: 'transparent',
    borderColor: 'transparent',
    backdropFilter: 'none',
    boxShadow: 'none',
    animation: 'none',
    '.rt-premium-globe': {
      position: 'relative',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: '50%',
      padding: '2px',
      background: 'linear-gradient(135deg, #E63946, #FF6B6B, #B71C1C)',
      backgroundSize: '200% 200%',
      transition: 'box-shadow 0.6s ease',
      animation:
        'rtPremiumShift 4s linear infinite, rtPremiumGlobeAura 6s ease-in-out infinite',
    },
    '.rt-premium-globe-inner': {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      backdropFilter: 'blur(10px) saturate(1.6)',
      WebkitBackdropFilter: 'blur(10px) saturate(1.6)',
      background: 'linear-gradient(145deg, rgba(255,255,255,0.12), rgba(0,0,0,0.2))',
      borderRadius: '50%',
      padding: '8px',
    },
    '.rt-globe': {
      color: isDark ? '#9db0e8' : '#3c4c94',
      filter: 'drop-shadow(0 0 6px rgba(90,120,230,0.4))',
      transition: 'color 0.4s ease, filter 0.4s ease',
    },
    ...(active
      ? {
          '.rt-premium-globe': {
            animation:
              'rtPremiumShift 4s linear infinite, rtPremiumGlobeAura 3.6s ease-in-out infinite, rtPremiumGlobePulse 1.6s ease-in-out infinite',
            boxShadow: '0 0 16px rgba(211,47,47,0.55)',
          },
          '.rt-globe': {
            color: '#D32F2F',
            filter: 'drop-shadow(0 0 14px rgba(211,47,47,0.9))',
          },
        }
      : {}),
    '&:active': {
      transform: 'scale(0.92)',
    },
    '@keyframes rtPremiumGlobeAura': {
      '0%, 100%': { boxShadow: '0 0 10px rgba(90,120,230,0.35)' },
      '33%': { boxShadow: '0 0 12px rgba(255,179,0,0.3)' },
      '66%': { boxShadow: '0 0 14px rgba(211,47,47,0.4)' },
    },
    '@keyframes rtPremiumGlobePulse': {
      '0%, 100%': { boxShadow: '0 0 10px rgba(211,47,47,0.5), 0 0 0 0 rgba(211,47,47,0.4)' },
      '50%': {
        boxShadow: '0 0 25px rgba(255,179,0,0.7), 0 0 0 9px rgba(33,150,243,0.3)',
      },
    },
    '@keyframes rtPremiumGlobeRotate': {
      from: { transform: 'rotate(0deg)' },
      to: { transform: 'rotate(360deg)' },
    },
    '@keyframes rtPremiumGlobeSpin': {
      to: { transform: 'rotate(360deg)' },
    },
    '@keyframes rtPremiumGlobeBurst': {
      from: { boxShadow: '0 0 0 2px rgba(211,47,47,0.55), 0 0 18px rgba(230,57,70,0.6)' },
      to: { boxShadow: '0 0 0 12px rgba(211,47,47,0), 0 0 18px rgba(211,47,47,0)' },
    },
    '@media (prefers-reduced-motion: reduce)': {
      '& *': { animation: 'none !important', transition: 'none !important' },
    },
  } as const;
}

function subtleBellSx(active: boolean) {
  return {
    position: 'relative',
    '.rt-bell-regular': {
      color: '#a5a5b0',
      transition: 'color 0.3s ease, filter 0.3s ease',
      animation: 'rtSubtleFill 0.7s ease-in-out',
    },
    '.rt-bell-solid': {
      display: 'none',
      color: '#a5a5b0',
      transition: 'color 0.3s ease, filter 0.3s ease',
      animation: 'rtSubtleFill 0.7s ease-in-out',
    },
    ...(active
      ? {
          '.rt-bell-regular': { display: 'none' },
          '.rt-bell-solid': { display: 'block' },
        }
      : {}),
    '&:hover .rt-bell-regular': { color: '#c9c4e0' },
    '&:hover .rt-bell-solid': { color: '#c9c4e0' },
    '&:active': {
      transform: 'scale(0.92)',
    },
    '@keyframes rtSubtleFill': BELL_FILL_KEYFRAMES,
    '@media (prefers-reduced-motion: reduce)': {
      '& *': { animation: 'none !important', transition: 'none !important' },
    },
  } as const;
}

function liquidBellSx(active: boolean, isDark: boolean) {
  return {
    position: 'relative',
    bgcolor: 'transparent',
    borderColor: 'transparent',
    backdropFilter: 'none',
    '.rt-bell-glass': {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backdropFilter: 'blur(6px) saturate(1.4)',
      WebkitBackdropFilter: 'blur(6px) saturate(1.4)',
      bgcolor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
      border: '1px solid',
      borderColor: isDark ? 'rgba(255,255,255,0.16)' : 'rgba(0,0,0,0.12)',
      borderRadius: '50%',
      padding: '7px',
      transition:
        'background-color 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease',
    },
    '.rt-bell-icon': {
      color: isDark ? '#f5f5f5' : '#333',
      transition: 'color 0.3s ease, filter 0.3s ease',
    },
    '&:hover .rt-bell-glass': {
      bgcolor: isDark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.12)',
      boxShadow: '0 0 12px rgba(255,179,0,0.45)',
    },
    '&:hover .rt-bell-icon': {
      color: '#FFB300',
      filter: 'drop-shadow(0 0 8px rgba(255,179,0,0.7))',
    },
    ...(active
      ? {
          '.rt-bell-glass': {
            boxShadow: '0 0 14px rgba(211,47,47,0.5)',
            borderColor: 'rgba(230,57,70,0.35)',
          },
          '.rt-bell-icon': {
            color: '#D32F2F',
            filter: 'drop-shadow(0 0 12px rgba(211,47,47,0.8))',
            animation: 'rtLiquidBellShake 1.4s ease-in-out infinite',
          },
        }
      : {}),
    '&:active': {
      transform: 'scale(0.92)',
    },
    '@keyframes rtLiquidBellShake': {
      '0%, 100%': { transform: 'rotate(0deg)' },
      '25%': { transform: 'rotate(-10deg)' },
      '50%': { transform: 'rotate(10deg)' },
      '75%': { transform: 'rotate(-6deg)' },
    },
    '@keyframes rtLiquidBurst': {
      from: { boxShadow: '0 0 0 2px rgba(211,47,47,0.5), 0 0 14px rgba(230,57,70,0.6)' },
      to: { boxShadow: '0 0 0 10px rgba(211,47,47,0), 0 0 14px rgba(211,47,47,0)' },
    },
    '@media (prefers-reduced-motion: reduce)': {
      '& *': { animation: 'none !important', transition: 'none !important' },
    },
  } as const;
}

function glowGearSx(active: boolean) {
  return {
    '.rt-settings-spin': {
      transition: 'color 0.3s ease, filter 0.3s ease',
      animation: 'rtGlowGearIdle 3.2s ease-in-out infinite',
    },
    '&:hover .rt-settings-spin': {
      color: RED_PASSION,
      animation: 'rtGlowGearBreathe 2.6s ease-in-out infinite',
    },
    ...(active
      ? {
          '.rt-settings-spin': {
            color: '#FFB300',
            filter: 'drop-shadow(0 0 12px rgba(255,179,0,0.8))',
          },
        }
      : {}),
    '&:active': {
      transform: 'scale(0.92)',
    },
    '@keyframes rtGlowGearBreathe': {
      '0%, 100%': { filter: 'drop-shadow(0 0 4px rgba(230,57,70,0.35))' },
      '50%': { filter: 'drop-shadow(0 0 10px rgba(211,47,47,0.7))' },
    },
    '@keyframes rtGlowGearIdle': {
      '0%, 100%': { filter: 'drop-shadow(0 0 2px rgba(211,47,47,0.18))' },
      '50%': { filter: 'drop-shadow(0 0 7px rgba(230,57,70,0.45))' },
    },
    '@keyframes rtGlowGearBurst': {
      from: { boxShadow: '0 0 0 2px rgba(211,47,47,0.5), 0 0 12px rgba(211,47,47,0.55)' },
      to: { boxShadow: '0 0 0 10px rgba(211,47,47,0), 0 0 12px rgba(211,47,47,0)' },
    },
    '@media (prefers-reduced-motion: reduce)': {
      '& *': { animation: 'none !important', transition: 'none !important' },
    },
  } as const;
}

function premiumBellSx(active: boolean, isDark: boolean) {
  return {
    position: 'relative',
    bgcolor: 'transparent',
    background: 'transparent',
    borderColor: 'transparent',
    backdropFilter: 'none',
    boxShadow: 'none',
    animation: 'none',
    '.rt-bell-glass': {
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: '50%',
      padding: '2px',
      background: 'linear-gradient(135deg, #E63946, #FF6B6B, #B71C1C)',
      backgroundSize: '200% 200%',
      transition: 'box-shadow 0.6s ease',
      animation: 'rtPremiumShift 4s linear infinite, rtPremiumAura 6s ease-in-out infinite',
    },
    '.rt-bell-glass-inner': {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      backdropFilter: 'blur(10px) saturate(1.6)',
      WebkitBackdropFilter: 'blur(10px) saturate(1.6)',
      background: 'linear-gradient(145deg, rgba(255,255,255,0.12), rgba(0,0,0,0.2))',
      borderRadius: '50%',
      padding: '8px',
    },
    '.rt-bell-icon': {
      color: isDark ? '#9db0e8' : '#3c4c94',
      filter: 'drop-shadow(0 0 6px rgba(90,120,230,0.4))',
      transition: 'color 0.4s ease, filter 0.4s ease',
    },
    ...(active
      ? {
          '.rt-bell-glass': {
            animation:
              'rtPremiumShift 4s linear infinite, rtPremiumAura 3.6s ease-in-out infinite, rtPremiumPulse 1.6s ease-in-out infinite',
            boxShadow: '0 0 16px rgba(211,47,47,0.55)',
          },
          '.rt-bell-icon': {
            color: '#D32F2F',
            filter: 'drop-shadow(0 0 14px rgba(211,47,47,0.9))',
            animation: 'rtPremiumShake 2.4s ease-in-out infinite',
          },
        }
      : {}),
    '&:active': {
      transform: 'scale(0.92)',
    },
    '@keyframes rtPremiumAura': {
      '0%, 100%': { boxShadow: '0 0 10px rgba(90,120,230,0.35)' },
      '33%': { boxShadow: '0 0 12px rgba(255,179,0,0.3)' },
      '66%': { boxShadow: '0 0 14px rgba(211,47,47,0.4)' },
    },
    '@keyframes rtPremiumPulse': {
      '0%, 100%': { boxShadow: '0 0 12px rgba(211,47,47,0.5), 0 0 0 0 rgba(211,47,47,0.4)' },
      '50%': { boxShadow: '0 0 18px rgba(211,47,47,0.75), 0 0 0 9px rgba(211,47,47,0)' },
    },
    '@keyframes rtPremiumShake': {
      '0%, 100%': { transform: 'rotate(0deg)' },
      '25%': { transform: 'rotate(-6deg)' },
      '50%': { transform: 'rotate(6deg)' },
      '75%': { transform: 'rotate(-3deg)' },
    },
    '@keyframes rtPremiumBurst': {
      from: { boxShadow: '0 0 0 2px rgba(211,47,47,0.55), 0 0 18px rgba(230,57,70,0.6)' },
      to: { boxShadow: '0 0 0 12px rgba(211,47,47,0), 0 0 18px rgba(211,47,47,0)' },
    },
    '@media (prefers-reduced-motion: reduce)': {
      '& *': { animation: 'none !important', transition: 'none !important' },
    },
  } as const;
}

const QuickActionIcon = forwardRef<HTMLDivElement | HTMLButtonElement, QuickActionIconProps>(function QuickActionIcon(
  {
    styleId,
    onClick,
    motion,
    basicHover,
    asBox,
    active = false,
    badgeContent,
    children,
  },
  ref,
) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const iconColor =
    theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.72)' : 'rgba(33,33,33,0.62)';
  const glowGray =
    theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.6)' : 'rgba(40,40,50,0.6)';

const hoverSx =
  styleId === 'basic' && basicHover === 'gear'
    ? GEAR_HOVER_SX
    : styleId === 'basic' && motion === 'globe'
      ? GLOBE_HOVER_SX
      : motion === 'bell' && styleId !== 'premium'
        ? BELL_HOVER_SX
        : motion === 'gear'
          ? GEAR_HOVER_SX
          : motion === 'globe'
            ? GLOBE_HOVER_SX
            : {};

  const isGlowBell = styleId === 'glow' && motion === 'bell';
  const isGlowGear = styleId === 'glow' && motion === 'gear';
  const isLiquidGear = styleId === 'liquid' && motion === 'gear';
  const isPremiumGear = styleId === 'premium' && motion === 'gear';
  const isSubtleBell = styleId === 'subtle' && motion === 'bell';
  const isLiquidBell = styleId === 'liquid' && motion === 'bell';
  const isPremiumBell = styleId === 'premium' && motion === 'bell';
  const isSwapBell = isGlowBell || isSubtleBell;
  const isGlowGlobe = styleId === 'glow' && motion === 'globe';
  const isLiquidGlobe = styleId === 'liquid' && motion === 'globe';
  const isPremiumGlobe = styleId === 'premium' && motion === 'globe';
  const gearSx = isGlowGear
    ? glowGearSx(active)
    : isLiquidGear
      ? liquidGearSx(active)
      : isPremiumGear
        ? premiumGearSx(active, isDark)
        : {};
  const globeSx = isGlowGlobe
    ? glowGlobeSx(active)
    : isLiquidGlobe
      ? liquidGlobeSx(active)
      : isPremiumGlobe
        ? premiumGlobeSx(active, isDark)
        : {};
  const bellSx = isGlowBell
    ? glowBellSx(active, glowGray)
    : isSubtleBell
      ? subtleBellSx(active)
      : isLiquidBell
        ? liquidBellSx(active, theme.palette.mode === 'dark')
        : isPremiumBell
          ? premiumBellSx(active, theme.palette.mode === 'dark')
          : {};
  const [burstKey, setBurstKey] = useState(0);

  let content = children;

  if (isSwapBell) {
    const iconLayer = (
      <Box
        className="rt-bell-layer"
        sx={{
          position: 'relative',
          display: 'inline-flex',
          fontSize: { xs: '1.2rem', sm: '1.4rem' },
        }}
      >
        {isGlowBell ? (
          <NotificationsIcon className="rt-bell-regular" sx={{ fontSize: 'inherit' }} />
        ) : (
          <NotificationsNoneIcon className="rt-bell-regular" sx={{ fontSize: 'inherit' }} />
        )}
        <NotificationsIcon
          className="rt-bell-solid"
          sx={{ position: 'absolute', inset: 0, fontSize: 'inherit' }}
        />
      </Box>
    );
    content = isSubtleBell ? (
      <Box sx={subtleMotionSx('bell')}>{iconLayer}</Box>
    ) : (
      iconLayer
    );
  } else if (isLiquidBell) {
    content = (
      <Box
        className="rt-bell-glass"
        sx={{ fontSize: { xs: '1.2rem', sm: '1.4rem' } }}
      >
        {children}
      </Box>
    );
  } else if (isPremiumBell) {
    content = (
      <Box
        className="rt-bell-glass"
        sx={{ fontSize: { xs: '1.2rem', sm: '1.4rem' } }}
      >
        <Box className="rt-bell-glass-inner">{children}</Box>
      </Box>
    );
  } else if (isPremiumGear) {
    content = (
      <Box
        className="rt-premium-gear"
        sx={{ fontSize: { xs: '1.2rem', sm: '1.4rem' } }}
      >
        <Box className="rt-premium-gear-inner">{children}</Box>
      </Box>
    );
  } else if (isPremiumGlobe) {
    content = (
      <Box
        className="rt-premium-globe"
        sx={{ fontSize: { xs: '1.2rem', sm: '1.4rem' } }}
      >
        <Box className="rt-premium-globe-inner">{children}</Box>
      </Box>
    );
  } else if (styleId === 'subtle' && motion) {
    content = <Box sx={subtleMotionSx(motion)}>{children}</Box>;
  }

  const showBadge = motion === 'bell' && badgeContent != null && badgeContent !== 0;
  if (showBadge) {
    const badgeValue =
      typeof badgeContent === 'number' && badgeContent > 99 ? '99+' : badgeContent;
    content = (
      <Box sx={{ position: 'relative', display: 'inline-flex' }}>
        {content}
        <Box
          className="rt-bell-badge"
          sx={{
            position: 'absolute',
            top: -4,
            right: -4,
            zIndex: 4,
            minWidth: 16,
            height: 16,
            px: '3px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: isDark ? '#FF5252' : '#C62828',
            color: '#fff',
            fontWeight: 700,
            fontSize: 10,
            lineHeight: 1,
            boxShadow: isPremiumBell
              ? '0 0 8px rgba(230,57,70,0.6)'
              : '0 2px 6px rgba(0,0,0,0.3)',
            animation: isPremiumBell
              ? 'rtBadgeIn 0.45s ease, rtBadgeHalo 1.4s ease-out 0.15s'
              : 'rtBadgeIn 0.45s ease',
            '@keyframes rtBadgeIn': {
              '0%': { transform: 'scale(0.6)', opacity: 0 },
              '50%': { transform: 'scale(1.25)', opacity: 1 },
              '100%': { transform: 'scale(1)', opacity: 1 },
            },
            '@keyframes rtBadgeHalo': {
              '0%': { boxShadow: '0 0 0 2px rgba(211,47,47,0.5), 0 0 10px rgba(211,47,47,0.55)' },
              '100%': { boxShadow: '0 0 0 9px rgba(211,47,47,0), 0 0 10px rgba(211,47,47,0)' },
            },
            '@media (prefers-reduced-motion: reduce)': {
              animation: 'none !important',
              '& *': { animation: 'none !important' },
            },
          }}
        >
          <Box
            component="span"
            sx={{
              animation: 'rtBadgeBounce 0.7s ease 0.2s both',
              '@keyframes rtBadgeBounce': {
                '0%': { transform: 'translateY(0)' },
                '35%': { transform: 'translateY(-2px) scale(1.15)' },
                '70%': { transform: 'translateY(0) scale(0.95)' },
                '100%': { transform: 'translateY(0) scale(1)' },
              },
              '@media (prefers-reduced-motion: reduce)': {
                animation: 'none !important',
              },
            }}
          >
            {badgeValue}
          </Box>
        </Box>
      </Box>
    );
  }

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (
      isGlowBell ||
      isLiquidBell ||
      isPremiumBell ||
      isGlowGear ||
      isLiquidGear ||
      isPremiumGear ||
      isGlowGlobe ||
      isLiquidGlobe ||
      isPremiumGlobe
    ) {
      setBurstKey((k) => k + 1);
    }
    onClick?.(event);
  };

  const burstOverlay =
    (isGlowBell ||
      isLiquidBell ||
      isPremiumBell ||
      isGlowGear ||
      isLiquidGear ||
      isPremiumGear ||
      isGlowGlobe ||
      isLiquidGlobe ||
      isPremiumGlobe) &&
    burstKey > 0 ? (
      <Box
        key={burstKey}
        sx={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          pointerEvents: 'none',
          zIndex: 2,
          animation: isGlowGear
            ? 'rtGlowGearBurst 0.45s ease-out'
            : isLiquidGear
              ? 'rtLiquidGearBurst 0.45s ease-out'
              : isPremiumGear
                ? 'rtPremiumGearBurst 0.45s ease-out'
                : isGlowGlobe
                  ? 'rtGlowGlobeBurst 0.45s ease-out'
                  : isLiquidGlobe
                    ? 'rtLiquidGlobeBurst 0.45s ease-out'
                    : isPremiumGlobe
                      ? 'rtPremiumGlobeBurst 0.45s ease-out'
                      : isGlowBell
                        ? 'rtGlowBurst 0.45s ease-out'
                        : isLiquidBell
                          ? 'rtLiquidBurst 0.45s ease-out'
                          : 'rtPremiumBurst 0.45s ease-out',
        }}
      />
    ) : null;

  if (asBox) {
    return (
      <Box
        ref={ref as React.Ref<HTMLDivElement>}
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          borderRadius: '999px',
          border: '1px solid transparent',
          p: '3px',
          ...(getIconStyleSx(styleId) as object),
          ...(bellSx as object),
          ...(gearSx as object),
          ...(globeSx as object),
          ...hoverSx,
        }}
      >
        {content}
      </Box>
    );
  }

  return (
    <IconButton
      size="small"
      onClick={handleClick}
      color="inherit"
      ref={ref as React.Ref<HTMLButtonElement>}
      sx={[
        {
          color: iconColor,
          WebkitTapHighlightColor: 'transparent',
        } as object,
        getIconStyleSx(styleId) as object,
        bellSx,
        gearSx,
        globeSx,
        hoverSx,
      ]}
    >
      {content}
      {burstOverlay}
    </IconButton>
  );
})

export default QuickActionIcon;