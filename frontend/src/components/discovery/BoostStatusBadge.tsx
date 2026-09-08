import React from 'react';
import { Box, Typography, Chip, Tooltip } from '@mui/material';
import BoltIcon from '@mui/icons-material/Bolt';
import { keyframes } from '@mui/system';
import { useAppTheme } from '../../context/ThemeContext';

const pulseGlow = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(255, 215, 0, 0.7); }
  50% { box-shadow: 0 0 20px 10px rgba(255, 215, 0, 0); }
  100% { box-shadow: 0 0 0 0 rgba(255, 215, 0, 0); }
`;

interface BoostStatusBadgeProps {
    isActive: boolean;
    timeLeftSeconds: number;
    tier: 'free' | 'premium' | 'vip';
    multiplier?: number;
    onActivate: () => void;
}

export default function BoostStatusBadge({
    isActive,
    timeLeftSeconds,
    tier,
    multiplier = 10,
    onActivate
}: BoostStatusBadgeProps) {
    const { mode } = useAppTheme();
    const isLight = mode === 'light';

    const formatTime = (seconds: number): string => {
        if (seconds <= 0) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const activeColor = '#FFD700'; // Bright Yellow for active state
    const inactiveColor = isLight ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.4)';

    if (!isActive) {
        return (
            <Tooltip title="Activar Boost: Brilla ante el resto" arrow>
                <Box
                    onClick={onActivate}
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        bgcolor: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.03)',
                        color: inactiveColor,
                        border: '1px solid',
                        borderColor: isLight ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.08)',
                        px: 1.5,
                        py: 0.5,
                        borderRadius: 4,
                        cursor: 'pointer',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        '&:hover': {
                            bgcolor: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)',
                            borderColor: activeColor,
                            color: activeColor,
                            transform: 'translateY(-1px)'
                        }
                    }}
                >
                    <BoltIcon sx={{ fontSize: '1.1rem' }} />
                    <Typography variant="caption" sx={{ fontWeight: 800, letterSpacing: '0.1em' }}>
                        BOOST
                    </Typography>
                </Box>
            </Tooltip>
        );
    }

    return (
        <Tooltip title="Tu hilo está vibrando. ¿Quién lo sentirá? ✨" arrow>
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    bgcolor: `${activeColor}15`,
                    color: activeColor,
                    border: `1px solid ${activeColor}`,
                    px: 1.5,
                    py: 0.5,
                    borderRadius: 4,
                    animation: `${pulseGlow} 3s infinite`,
                    boxShadow: `0 0 15px ${activeColor}30`,
                    position: 'relative',
                    cursor: 'default',
                    '&::after': {
                        content: '""',
                        position: 'absolute',
                        top: -2,
                        left: -2,
                        right: -2,
                        bottom: -2,
                        borderRadius: 4,
                        border: `1px solid ${activeColor}40`,
                        animation: `${pulseGlow} 2s infinite ease-out`
                    }
                }}
            >
                <BoltIcon sx={{ fontSize: '1.1rem', filter: `drop-shadow(0 0 5px ${activeColor})` }} />
                <Typography
                    variant="caption"
                    sx={{
                        fontWeight: 900,
                        fontSize: '0.8rem',
                        fontFamily: "'Outfit', sans-serif",
                        letterSpacing: '0.02em',
                        whiteSpace: 'nowrap'
                    }}
                >
                    {formatTime(timeLeftSeconds)} • X{multiplier}
                </Typography>
            </Box>
        </Tooltip>
    );
}
