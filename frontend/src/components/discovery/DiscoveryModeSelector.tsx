import React, { useState, useEffect } from 'react';
import { Box, Button, Typography, Tooltip, Zoom, FormControlLabel, Switch } from '@mui/material';
import { styled, keyframes, Theme } from '@mui/material/styles';
import { useAppTheme } from '../../context/ThemeContext';
import { useTranslation } from 'next-i18next';

export type DiscoveryMode = 'suggested' | 'opposites' | 'blind' | 'free' | 'more';

interface ModeConfig {
    label: string;
    color: string;
    description: string;
    carePhrase: string;
}

const pulseGlow = keyframes`
  0% { box-shadow: 0 0 5px rgba(255, 255, 255, 0.2); }
  50% { box-shadow: 0 0 15px rgba(255, 255, 255, 0.5); }
  100% { box-shadow: 0 0 5px rgba(255, 255, 255, 0.2); }
`;

interface ModeButtonProps {
    $activeColor?: string;
    $isActive?: boolean;
    $isLight?: boolean;
}

const ModeButton = styled(Button, {
    shouldForwardProp: (prop) => prop !== '$activeColor' && prop !== '$isActive' && prop !== '$isLight'
})<ModeButtonProps>(({ theme, $isActive, $isLight }) => ({
    display: 'flex',
    alignItems: 'center',
    padding: '6px 8px',
    borderRadius: '0',
    textTransform: 'none',
    transition: 'all 0.2s ease-in-out',
    fontWeight: $isActive ? 600 : 500,
    fontSize: '12px',
    [theme.breakpoints.up('sm')]: {
        fontSize: '17px'
    },
    [theme.breakpoints.up('md')]: {
        fontSize: '20px'
    },
    letterSpacing: '0.1px',
    whiteSpace: 'nowrap',
    color: $isActive ? '#fff' : 'rgba(255,255,255,0.6)',
    backgroundColor: 'transparent',
    borderBottom: $isActive ? `2px solid #fff` : '2px solid transparent',
    minHeight: '32px',
    [theme.breakpoints.up('sm')]: {
        minHeight: '36px'
    },
    minWidth: 'auto',
    '&:hover': {
        backgroundColor: 'transparent',
        color: '#fff'
    },
    scrollSnapAlign: 'start',
} as any));

const MODES: Record<DiscoveryMode, ModeConfig> = {
    suggested: {
        label: 'Para ti',
        color: '#FF4081',
        description: 'Basado en tu hilo de compatibilidad',
        carePhrase: '“Aquí verás quienes vibran contigo.”'
    },
    opposites: {
        label: 'Opuestos',
        color: '#303F9F',
        description: 'Polos opuestos que se atraen',
        carePhrase: '“¿Te atreves a conectar con tu opuesto?”'
    },
    blind: {
        label: 'A ciegas',
        color: '#616161',
        description: 'Siente sin ver. Solo conexión',
        carePhrase: '“Siente sin ver. Confía en la energía.”'
    },
    free: {
        label: 'Libre',
        color: '#C6A700',
        description: 'Aventura sin límites ni filtros',
        carePhrase: '“Explora sin filtros, sin límites.”'
    },
    more: {
        label: 'Más',
        color: '#9C27B0',
        description: 'Amplía tu búsqueda a cosas en común',
        carePhrase: '“Lo que nos une crea puentes infinitos.”'
    }
};

interface DiscoveryModeSelectorProps {
    currentMode: DiscoveryMode;
    onModeChange: (mode: DiscoveryMode) => void;
    isCurious: boolean;
    onCuriousChange: (v: boolean) => void;
}

export default function DiscoveryModeSelector({
    currentMode,
    onModeChange,
    isCurious,
    onCuriousChange
}: DiscoveryModeSelectorProps) {
    const handleModeClick = (mode: DiscoveryMode) => {
        onModeChange(mode);
        localStorage.setItem('favoriteDiscoveryMode', mode);
    };

    const { mode } = useAppTheme();
    const isLight = mode === 'light';

    return (
        <Box
            sx={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: { xs: 0.8, sm: 2, md: 3 },
                flexWrap: 'nowrap',
                overflowX: 'auto',
                scrollSnapType: 'x mandatory',
                '&::-webkit-scrollbar': { display: 'none !important' },
                msOverflowStyle: 'none !important',
                scrollbarWidth: 'none !important',
                justifyContent: { xs: 'flex-start', sm: 'center' },
                px: { xs: 0, sm: 2 },
                '@media (min-width:768px) and (max-width:1024px)': {
                    gap: '1rem',
                    justifyContent: 'center',
                    overflowX: 'auto',
                    flexWrap: 'nowrap',
                },
                '& > *': { flexShrink: 0 },
            }}
        >
            {(Object.keys(MODES) as DiscoveryMode[]).map((modeKey) => {
                const config = MODES[modeKey];
                const isActive = currentMode === modeKey;

                return (
                    <ModeButton
                        key={modeKey}
                        $isActive={isActive}
                        $isLight={isLight}
                        $activeColor={config.color}
                        onClick={() => handleModeClick(modeKey)}
                    >
                        {config.label}
                    </ModeButton>
                );
            })}
        </Box>
    );
}
