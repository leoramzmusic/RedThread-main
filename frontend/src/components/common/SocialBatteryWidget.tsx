import React, { useState } from 'react';
import { Box, Typography, IconButton, Tooltip, Zoom, Menu, MenuItem } from '@mui/material';
import BatteryChargingFullIcon from '@mui/icons-material/BatteryChargingFull';
import BatteryFullIcon from '@mui/icons-material/BatteryFull';
import BatteryStdIcon from '@mui/icons-material/BatteryStd';
import BatteryAlertIcon from '@mui/icons-material/BatteryAlert';
import BedtimeIcon from '@mui/icons-material/Bedtime';
// Using standard MUI icons for now, but ideally these would be Doge/Cheems emojis or custom SVGs

interface SocialBatteryProps {
    batteryLevel: number; // 0 to 100
    onOpenTimeOut: () => void;
    compact?: boolean;
}

export default function SocialBatteryWidget({ batteryLevel, onOpenTimeOut, compact }: SocialBatteryProps) {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

    // Emotional Logic for Phrases & Colors
    const getBatteryStatus = (level: number) => {
        if (level > 70) return {
            color: '#69F0AE', // Premium Emerald Green
            icon: <BatteryFullIcon sx={{ fontSize: compact ? '1rem' : '1.2rem' }} />,
            phrase: "Energía vital alta. Tu hilo está listo para conectar ✨",
            label: "Energía Alta"
        };
        if (level > 30) return {
            color: '#FFD700', // Gold/Amber
            icon: <BatteryStdIcon sx={{ fontSize: compact ? '1rem' : '1.2rem' }} />,
            phrase: "Batería media. Un descanso pronto no vendría mal ☕",
            label: "Energía Media"
        };
        if (level > 0) return {
            color: '#FF5252', // Soft Red
            icon: <BatteryAlertIcon sx={{ fontSize: compact ? '1rem' : '1.2rem' }} />,
            phrase: "Batería baja. Modo introspección activado 🕯️",
            label: "Batería Baja"
        };
        return {
            color: '#757575', // Muted Grey
            icon: <BedtimeIcon sx={{ fontSize: compact ? '1rem' : '1.2rem' }} />,
            phrase: "Modo Cueva: Recargando en silencio 🌙",
            label: "Desconectado"
        };
    };

    const status = getBatteryStatus(batteryLevel);

    return (
        <Box>
            <Tooltip
                title={
                    <Box sx={{ textAlign: 'center', p: 0.5 }}>
                        <Typography variant="caption" sx={{ fontWeight: 800, display: 'block', mb: 0.5 }}>
                            {batteryLevel}%
                        </Typography>
                        {status.phrase}
                    </Box>
                }
                TransitionComponent={Zoom}
                arrow
            >
                <IconButton
                    onClick={onOpenTimeOut}
                    sx={{
                        color: status.color,
                        p: compact ? 0.4 : 0.8,
                        borderRadius: 3,
                        transition: 'all 0.3s ease',
                        '&:hover': {
                            bgcolor: `${status.color}15`,
                            transform: 'scale(1.1)'
                        }
                    }}
                >
                    {status.icon}
                </IconButton>
            </Tooltip>
        </Box>
    );
}
