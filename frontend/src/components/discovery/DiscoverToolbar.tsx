import React from 'react';
import { Box, Typography, IconButton, Tooltip, Divider, Menu, MenuItem, ListItemIcon, ListItemText } from '@mui/material';
import TuneIcon from '@mui/icons-material/Tune';
import SettingsIcon from '@mui/icons-material/Settings';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import BoltIcon from '@mui/icons-material/Bolt';
import SocialBatteryWidget from '../common/SocialBatteryWidget';
import BoostStatusBadge from './BoostStatusBadge';
import { keyframes } from '@mui/system';
import DiscoveryModeSelector, { DiscoveryMode } from './DiscoveryModeSelector';
import { useAppTheme } from '../../context/ThemeContext';
import { useTranslation } from 'next-i18next';

interface DiscoverToolbarProps {
    title: string;
    isFilterActive: boolean;
    setShowFilters: (v: boolean) => void;
    setShowInteractionSettings: (v: boolean) => void;
    batteryLevel: number;
    setShowTimeOutModal: (v: boolean) => void;

    boostActive: boolean;
    boostTimeLeft: number;
    tier: 'free' | 'premium' | 'vip';
    multiplier: number;
    onActivateBoost: () => void;

    currentMode: DiscoveryMode;
    onModeChange: (mode: DiscoveryMode) => void;
    isCurious: boolean;
    onCuriousChange: (v: boolean) => void;
}

const titleGlow = keyframes`
  0% { text-shadow: 0 0 10px rgba(255,255,255,0); }
  50% { text-shadow: 0 0 20px rgba(255,255,255,0.4); }
  100% { text-shadow: 0 0 10px rgba(255,255,255,0); }
`;

const floatMessage = keyframes`
  0% { transform: translateY(0); opacity: 0; }
  20% { opacity: 0.9; }
  80% { opacity: 0.9; }
  100% { transform: translateY(-20px); opacity: 0; }
`;

export default function DiscoverToolbar({
    title,
    isFilterActive,
    setShowFilters,
    setShowInteractionSettings,
    batteryLevel,
    setShowTimeOutModal,
    boostActive,
    boostTimeLeft,
    tier,
    multiplier,
    onActivateBoost,
    currentMode,
    onModeChange,
    isCurious,
    onCuriousChange
}: DiscoverToolbarProps) {
    const { t } = useTranslation('discover');
    const { mode } = useAppTheme();
    const isLight = mode === 'light';

    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);
    const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };
    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    // CARE Emotional Bonus logic
    const getCarePhrase = () => {
        if (boostActive) {
            const phrases = [
                `Tu hilo está vibrando. (X${multiplier}) ¿Quién lo sentirá?`,
                `Estás listo para ser visto con intención (w${multiplier}).`,
                `Este impulso (X${multiplier}) es para conectar con quien te vea de verdad.`
            ];
            // Deterministic rotation based on time (changes every 10 seconds approx)
            const index = Math.floor(Date.now() / 10000) % phrases.length;
            return phrases[index];
        }
        if (batteryLevel < 30) return "¿Quieres compartir tu himno para recargar tu energía?";
        if (isCurious) return "Explora sin filtros, sin límites";
        return null;
    };

    const carePhrase = getCarePhrase();

    return (
        <Box
            className="discover-toolbar discover-tabs"
            sx={{
                width: '100%',
                mb: { xs: 0, sm: 1.5 },
                mt: { xs: 0, sm: 1.5 },
                bgcolor: 'transparent',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'visible',
                zIndex: 10,
                colorScheme: 'dark !important',
                touchAction: 'pan-x pan-y',
                '@media (max-width:375px)': {
                    mb: '0.5rem',
                },
                '& *': {
                    msOverflowStyle: 'none !important',
                    scrollbarWidth: 'none !important',
                },
                '& *::-webkit-scrollbar': {
                    display: 'none !important',
                    width: '0 !important',
                    height: '0 !important',
                    background: 'transparent !important'
                },
                '& *::-webkit-scrollbar-track': {
                    background: 'transparent !important'
                },
                '& *::-webkit-scrollbar-thumb': {
                    background: 'transparent !important'
                }
            }}
        >
            {/* MAIN HEADER ROW: Filter - Modes - Boost */}
            <Box
                display="flex"
                alignItems="center"
                width="100%"
                sx={{
                    position: 'relative',
                    minHeight: { xs: 'auto', sm: '50px' },
                    py: { xs: 0.5, sm: 0 },
                    px: { xs: 0, sm: 2 },
                    boxSizing: 'border-box',
                    '@media (max-width:375px)': {
                        px: '0 !important',
                        py: '0 !important',
                        minHeight: '0 !important',
                        gap: '0 !important',
                    },
                    gap: { xs: 0, sm: 2 },
                    justifyContent: 'flex-start', // Favorecer izquierda
                    alignItems: 'center',
                }}
            >
                {/* LEFT: Settings & Filter */}
                <Box sx={{ width: 68, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: 0.1 }}>
                    <Tooltip title={t('interaction.title', 'Configuración de Interacción')} arrow>
                        <IconButton
                            onClick={() => setShowInteractionSettings(true)}
                            size="small"
                            sx={{ color: 'white', p: 0.5 }}
                        >
                            <SettingsIcon sx={{ fontSize: { xs: '1.2rem', sm: '1.4rem' } }} />
                        </IconButton>
                    </Tooltip>

                    <Tooltip title={t('filters.title', 'Ajustar Búsqueda')} arrow>
                        <IconButton
                            onClick={() => setShowFilters(true)}
                            size="small"
                            sx={{
                                color: isFilterActive ? '#69F0AE' : 'white',
                                p: 0.5
                            }}
                        >
                            <TuneIcon sx={{ fontSize: { xs: '1.2rem', sm: '1.4rem' } }} />
                            {isFilterActive && (
                                <Box sx={{
                                    position: 'absolute',
                                    top: 4,
                                    right: 4,
                                    width: 6,
                                    height: 6,
                                    bgcolor: '#69F0AE',
                                    borderRadius: '50%',
                                    border: '1.5px solid black'
                                }} />
                            )}
                        </IconButton>
                    </Tooltip>
                </Box>

                {/* CENTER: Modes Segment — iPhone SE scroll horizontal */}
                <Box
                    sx={{
                        flexGrow: 1,
                        minWidth: 0,
                        display: 'flex',
                        justifyContent: { xs: 'flex-start', sm: 'center' },
                        flexWrap: 'nowrap',
                        overflowX: 'auto',
                        WebkitOverflowScrolling: 'touch',
                        '& ::-webkit-scrollbar': { display: 'none' },
                        msOverflowStyle: 'none',
                        scrollbarWidth: 'none',
                        px: { xs: 0.5, sm: 0 },
                    }}
                >
                    <DiscoveryModeSelector
                        currentMode={currentMode}
                        onModeChange={onModeChange}
                        isCurious={isCurious}
                        onCuriousChange={onCuriousChange}
                    />
                </Box>

                {/* RIGHT: Battery & Boost */}
                <Box sx={{ width: 68, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.1 }}>
                    <SocialBatteryWidget
                        batteryLevel={batteryLevel}
                        onOpenTimeOut={() => setShowTimeOutModal(true)}
                        compact // Ensure it's small for mobile
                    />

                    <IconButton
                        onClick={onActivateBoost}
                        disabled={boostActive}
                        size="small"
                        sx={{
                            color: boostActive ? '#FFD700' : '#E1BEE7',
                            p: 0.5,
                            '& .MuiSvgIcon-root': {
                                filter: boostActive ? 'drop-shadow(0 0 8px #FFD700)' : 'none'
                            }
                        }}
                    >
                        <BoltIcon sx={{ fontSize: { xs: '1.5rem', sm: '1.8rem' }, color: '#AB47BC' }} />
                    </IconButton>
                </Box>
            </Box>

            {/* SECOND ROW (Mobile only when active): Boost Status Overlay */}
            {boostActive && (
                <Box
                    sx={{
                        display: { xs: 'flex', md: 'none' },
                        width: '100%',
                        justifyContent: 'center',
                        mt: -0.5,
                        mb: 0.5,
                        pointerEvents: 'none',
                        '& > *': { pointerEvents: 'auto' },
                        '@media (max-width:375px)': {
                            mt: '0 !important',
                            mb: '0 !important',
                            minHeight: '0 !important',
                            paddingTop: '0 !important',
                            paddingBottom: '0 !important',
                        },
                    }}
                >
                    <BoostStatusBadge
                        isActive={boostActive}
                        timeLeftSeconds={boostTimeLeft}
                        tier={tier}
                        multiplier={multiplier}
                        onActivate={() => { }}
                    />
                </Box>
            )}

            {/* Desktop Only Boost Badge */}
            <Box sx={{ display: { xs: 'none', md: 'flex' }, justifyContent: 'center', mt: 1 }}>
                <BoostStatusBadge
                    isActive={boostActive}
                    timeLeftSeconds={boostTimeLeft}
                    tier={tier}
                    multiplier={multiplier}
                    onActivate={onActivateBoost}
                />
            </Box>
        </Box>
    );
}
