import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Grid,
    Card,
    CardContent,
    Typography,
    Box,
    Radio,
    RadioGroup,
    FormControlLabel,
    FormControl,
    FormLabel,
    Stack
} from '@mui/material';
import TouchAppIcon from '@mui/icons-material/TouchApp';
import SwipeIcon from '@mui/icons-material/Swipe'; // Using Swipe as proxy for Gestures
import KeyboardIcon from '@mui/icons-material/Keyboard';
import ViewCarouselIcon from '@mui/icons-material/ViewCarousel';
import DashboardIcon from '@mui/icons-material/Dashboard';
import StyleIcon from '@mui/icons-material/Style'; // For Stack
import CollectionsIcon from '@mui/icons-material/Collections'; // For Sticker Book
import RadioButtonCheckedIcon from '@mui/icons-material/RadioButtonChecked';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import { useAppTheme } from '../../context/ThemeContext';

export type InteractionMode = 'buttons' | 'taps' | 'swipes' | 'keyboard';
export type LayoutMode = 'stack' | 'sticker_book' | 'carousel' | 'grid'; // New Layout Modes

interface InteractionSettingsDialogProps {
    open: boolean;
    onClose: () => void;
    currentMode: InteractionMode;
    onModeChange: (mode: InteractionMode) => void;
    currentLayout: LayoutMode;
    onLayoutChange: (layout: LayoutMode) => void;
    containerRef?: React.RefObject<HTMLDivElement | null>;
}

const layouts = [
    {
        value: 'stack',
        label: 'Cartas (Stack)',
        icon: <StyleIcon fontSize="large" />,
        description: 'La experiencia clásica. Una carta a la vez.',
        details: [
            'Enfoque total en un perfil',
            'Desliza para decidir',
            'Sensación de juego'
        ]
    },
    {
        value: 'sticker_book',
        label: 'Álbum de Estampas',
        icon: <CollectionsIcon fontSize="large" />,
        description: 'Colecciona momentos. Visual y divertido.',
        details: [
            'Vista de múltiples perfiles',
            'Ideal para explorar visualmente',
            'Toca para ver detalles'
        ]
    },
    {
        value: 'carousel',
        label: 'Carrusel',
        icon: <ViewCarouselIcon fontSize="large" />,
        description: 'Desplazamiento horizontal fluido.',
        details: [
            'Exploración relajada',
            'Menos presión de descarte',
            'Navegación suave'
        ]
    },
    {
        value: 'grid',
        label: 'Galería (Grid)',
        icon: <DashboardIcon fontSize="large" />,
        description: 'Vista panorámica eficiente.',
        details: [
            'Ver muchas opciones rápido',
            'Estilo Instagram/Pinterest',
            'Eficiencia visual'
        ]
    }
];

const modes = [
    {
        value: 'buttons',
        label: 'Solo Botones',
        icon: '🎮',
        description: 'Gestos desactivados. Control total mediante los botones en pantalla.',
        carePhrase: '“Prefieres control total. Nada se escapa.”',
        details: [
            'Regresar: Flecha',
            'Dislike: X',
            'Like: Corazón',
            'Superlike: Estrella'
        ]
    },
    {
        value: 'taps',
        label: 'Botones + Taps',
        icon: '👆',
        description: 'Acciones rápidas tocando la pantalla.',
        carePhrase: '“Exploras con intuición. Cada toque cuenta.”',
        details: [
            '2 taps: Like',
            '3 taps: Dislike',
            '4 taps: Superlike',
            'Tap largo: Info'
        ]
    },
    {
        value: 'swipes',
        label: 'Botones + Swipes',
        icon: '↔️',
        description: 'Desliza para decidir. Clásico y fluido.',
        carePhrase: '“Te gusta la fluidez. Que el gesto hable.”',
        details: [
            'Derecha: Like',
            'Izquierda: Dislike',
            'Arriba: Superlike',
            'Abajo: Info'
        ]
    },
    {
        value: 'keyboard',
        label: 'Botones + Teclado',
        icon: '⌨️',
        description: 'Ideal para PC. Usa las flechas de tu teclado.',
        carePhrase: '“Precisión desde el teclado. Tu conexión es metódica.”',
        details: [
            '→: Like',
            '←: Dislike',
            '↑: Superlike',
            '↓: Info'
        ]
    }
];

export default function InteractionSettingsDialog({
    open,
    onClose,
    currentMode,
    onModeChange,
    currentLayout,
    onLayoutChange,
    containerRef
}: InteractionSettingsDialogProps) {
    const { mode } = useAppTheme();
    const isLight = mode === 'light';
    const [tabValue, setTabValue] = React.useState(0);

    const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

    const currentModeConfig = modes.find(m => m.value === currentMode);

    return (
        <Dialog
            open={open}
            onClose={onClose}
            container={containerRef?.current}
            disablePortal={!!containerRef}
            hideBackdrop={false}
            scroll="paper"
            sx={{
                position: 'absolute !important',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                zIndex: 1200,
                '& .MuiBackdrop-root': {
                    position: 'absolute !important',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    backgroundColor: 'rgba(0, 0, 0, 0.85)'
                },
                '& .MuiDialog-container': {
                    position: 'absolute !important',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                },
                '& .MuiDialog-paper': {
                    m: 2,
                    mt: { xs: 2, md: '50px' },
                    ml: { xs: 2, md: '280px' },
                    width: '100%',
                    maxWidth: { xs: 'calc(100% - 32px) !important', md: '750px !important' },
                    height: 'auto',
                    maxHeight: 'calc(100% - 48px)',
                    boxSizing: 'border-box',
                    borderRadius: 4
                }
            }}
            PaperProps={{
                sx: {
                    borderRadius: 4,
                    backgroundImage: 'linear-gradient(135deg, rgba(30,30,30,0.98) 0%, rgba(10,10,10,0.99) 100%)', // Slightly darker than Curiosity
                    backdropFilter: 'blur(25px)',
                    border: '1px solid',
                    borderColor: isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)',
                    boxShadow: isLight ? '0 24px 80px rgba(0,0,0,0.15)' : '0 24px 80px rgba(0,0,0,0.8)'
                }
            }}
        >
            <DialogTitle sx={{ px: 2, pt: 4, pb: 1 }}>
                <Typography variant="h4" sx={{ fontSize: '24px', fontWeight: 800, color: isLight ? 'text.primary' : 'white', letterSpacing: 0.5 }}>
                    Configuración de Interacción
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1, fontSize: '15px' }}>
                    Elige cómo quieres interactuar con los perfiles en Discover.
                </Typography>
            </DialogTitle>

            <DialogContent sx={{ px: 2 }}>
                <Box sx={{ borderBottom: 1, borderColor: isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)', mb: 3 }}>
                    <Tabs
                        value={tabValue}
                        onChange={handleTabChange}
                        centered
                        sx={{
                            '& .MuiTabs-indicator': { height: 3, borderRadius: '3px 3px 0 0' },
                            '& .MuiTab-root': {
                                textTransform: 'none',
                                fontWeight: 700,
                                fontSize: '16px',
                                minHeight: 60,
                                color: isLight ? 'rgba(0,0,0,0.6)' : 'inherit'
                            }
                        }}
                    >
                        <Tab label="Interacción" />
                        <Tab label="Presentación (Layout)" />
                    </Tabs>
                </Box>

                {tabValue === 0 && (
                    <Box>
                        <Grid container spacing={2}>
                            {modes.map((mode) => (
                                <Grid item xs={12} sm={6} key={mode.value}>
                                    <Card
                                        elevation={0}
                                        sx={{
                                            cursor: 'pointer',
                                            borderRadius: '12px',
                                            border: '1px solid',
                                            borderColor: currentMode === mode.value ? 'primary.main' : (isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'),
                                            bgcolor: currentMode === mode.value ? 'rgba(255, 64, 129, 0.05)' : (isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.03)'),
                                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                            mb: 1.5,
                                            height: '100%',
                                            '&:hover': {
                                                transform: 'translateY(-2px)',
                                                bgcolor: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.08)',
                                                borderColor: currentMode === mode.value ? 'primary.main' : (isLight ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.2)')
                                            }
                                        }}
                                        onClick={() => onModeChange(mode.value as InteractionMode)}
                                    >
                                        <CardContent sx={{ p: '20px !important', display: 'flex', gap: 2.5, height: '100%', boxSizing: 'border-box' }}>
                                            <Typography sx={{ fontSize: '32px' }}>{mode.icon}</Typography>
                                            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                                <Box display="flex" alignItems="center" justifyContent="space-between" mb={0.5}>
                                                    <Typography variant="subtitle1" sx={{ fontSize: '18px', fontWeight: 700, color: isLight ? 'text.primary' : 'white' }}>
                                                        {mode.label}
                                                    </Typography>
                                                    <Radio
                                                        checked={currentMode === mode.value}
                                                        size="small"
                                                        sx={{ p: 0, color: isLight ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.3)' }}
                                                    />
                                                </Box>
                                                <Typography variant="body2" sx={{ color: isLight ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.6)', fontSize: '14px', mb: 2, lineHeight: 1.4 }}>
                                                    {mode.description}
                                                </Typography>
                                                <Box sx={{ mt: 'auto' }}>
                                                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap gap={1}>
                                                        {mode.details.map((detail, idx) => (
                                                            <Box key={idx} sx={{
                                                                bgcolor: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)',
                                                                px: 1, py: 0.5, borderRadius: '6px',
                                                                border: '1px solid',
                                                                borderColor: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)'
                                                            }}>
                                                                <Typography sx={{ color: isLight ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.4)', fontSize: '11px', fontWeight: 600 }}>
                                                                    {detail}
                                                                </Typography>
                                                            </Box>
                                                        ))}
                                                    </Stack>
                                                </Box>
                                            </Box>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>

                        {/* CARE Interpretive Message */}
                        {currentModeConfig && (
                            <Box sx={{
                                mt: 3, p: 2, borderRadius: 3,
                                bgcolor: 'rgba(255, 64, 129, 0.1)',
                                border: '1px solid rgba(255, 64, 129, 0.2)',
                                display: 'flex', alignItems: 'center', gap: 2
                            }}>
                                <Typography sx={{ fontStyle: 'italic', fontWeight: 600, color: '#FF80AB' }}>
                                    CARE: {currentModeConfig.carePhrase}
                                </Typography>
                            </Box>
                        )}
                    </Box>
                )}

                {tabValue === 1 && (
                    <Grid container spacing={2}>
                        {layouts.map((layout) => (
                            <Grid item xs={12} sm={6} key={layout.value}>
                                <Card
                                    sx={{
                                        cursor: 'pointer',
                                        borderRadius: '12px',
                                        border: '1px solid',
                                        borderColor: currentLayout === layout.value ? 'secondary.main' : (isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'),
                                        bgcolor: currentLayout === layout.value ? 'rgba(171, 71, 188, 0.05)' : (isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.03)'),
                                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                        height: '100%',
                                        '&:hover': {
                                            transform: 'translateY(-2px)',
                                            bgcolor: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.08)',
                                            borderColor: currentLayout === layout.value ? 'secondary.main' : (isLight ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.2)')
                                        }
                                    }}
                                    onClick={() => onLayoutChange(layout.value as LayoutMode)}
                                >
                                    <CardContent sx={{ p: '20px !important', display: 'flex', gap: 2.5, height: '100%', boxSizing: 'border-box' }}>
                                        <Box sx={{ color: currentLayout === layout.value ? 'secondary.main' : (isLight ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.3)') }}>
                                            {layout.icon}
                                        </Box>
                                        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                            <Box display="flex" alignItems="center" justifyContent="space-between" mb={0.5}>
                                                <Typography variant="subtitle1" sx={{ fontSize: '18px', fontWeight: 700, color: isLight ? 'text.primary' : 'white' }}>
                                                    {layout.label}
                                                </Typography>
                                                <Radio
                                                    checked={currentLayout === layout.value}
                                                    size="small"
                                                    sx={{ p: 0, color: isLight ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.3)', '&.Mui-checked': { color: 'secondary.main' } }}
                                                />
                                            </Box>
                                            <Typography variant="body2" sx={{ color: isLight ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.6)', fontSize: '14px', mb: 2, lineHeight: 1.4 }}>
                                                {layout.description}
                                            </Typography>
                                            <Box sx={{ mt: 'auto' }}>
                                                <Stack direction="row" spacing={0.5} flexWrap="wrap">
                                                    {layout.details.map((detail, idx) => (
                                                        <Typography key={idx} variant="caption" sx={{ color: isLight ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.3)', fontWeight: 600 }}>
                                                            • {detail}
                                                        </Typography>
                                                    ))}
                                                </Stack>
                                            </Box>
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                )}
            </DialogContent>

            <DialogActions sx={{ p: 2, pb: 4 }}>
                <Button
                    onClick={onClose}
                    variant="contained"
                    fullWidth
                    sx={{
                        borderRadius: 3,
                        py: 2,
                        fontSize: '18px',
                        textTransform: 'none',
                        fontWeight: 800,
                        bgcolor: '#FF4081',
                        '&:hover': { bgcolor: '#F50057' }
                    }}
                >
                    Listo
                </Button>
            </DialogActions>
        </Dialog>
    );
}
