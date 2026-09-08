import { useState } from 'react';
import {
    Box,
    Typography,
    FormControlLabel,
    Switch,
    Button,
    CircularProgress,
    Stack,
    Divider,
} from '@mui/material';
import {
    Contrast as ContrastIcon,
    RecordVoiceOver as VoiceIcon,
    Keyboard as KeyboardIcon,
    SlowMotionVideo as MotionIcon,
} from '@mui/icons-material';

interface AccessibilitySectionProps {
    settings: any;
    onSettingsChange: (field: string, value: any) => void;
    onSave: () => Promise<void>;
    saving?: boolean;
}

export default function AccessibilitySection({
    settings,
    onSettingsChange,
    onSave,
    saving
}: AccessibilitySectionProps) {
    return (
        <Stack spacing={3}>
            {/* High Contrast Mode */}
            <FormControlLabel
                control={
                    <Switch
                        checked={settings?.high_contrast_mode || false}
                        onChange={(e) => onSettingsChange('high_contrast_mode', e.target.checked)}
                        color="primary"
                    />
                }
                label={
                    <Box display="flex" alignItems="center" gap={1.5}>
                        <ContrastIcon color="action" />
                        <Box>
                            <Typography variant="body1" fontWeight={500}>
                                Modo Alto Contraste
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Aumenta el contraste de colores para mejorar la legibilidad
                            </Typography>
                        </Box>
                    </Box>
                }
            />

            <Divider />

            {/* Screen Reader */}
            <FormControlLabel
                control={
                    <Switch
                        checked={settings?.screen_reader_enabled || false}
                        onChange={(e) => onSettingsChange('screen_reader_enabled', e.target.checked)}
                        color="primary"
                    />
                }
                label={
                    <Box display="flex" alignItems="center" gap={1.5}>
                        <VoiceIcon color="action" />
                        <Box>
                            <Typography variant="body1" fontWeight={500}>
                                Compatibilidad con Lector de Pantalla
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Optimiza la interfaz para lectores de pantalla
                            </Typography>
                        </Box>
                    </Box>
                }
            />

            <Divider />

            {/* Keyboard Navigation */}
            <FormControlLabel
                control={
                    <Switch
                        checked={settings?.keyboard_navigation || false}
                        onChange={(e) => onSettingsChange('keyboard_navigation', e.target.checked)}
                        color="primary"
                    />
                }
                label={
                    <Box display="flex" alignItems="center" gap={1.5}>
                        <KeyboardIcon color="action" />
                        <Box>
                            <Typography variant="body1" fontWeight={500}>
                                Navegación por Teclado Mejorada
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Habilita atajos de teclado y mejora los indicadores de foco
                            </Typography>
                        </Box>
                    </Box>
                }
            />

            <Divider />

            {/* Reduced Motion */}
            <FormControlLabel
                control={
                    <Switch
                        checked={settings?.reduced_motion || false}
                        onChange={(e) => onSettingsChange('reduced_motion', e.target.checked)}
                        color="primary"
                    />
                }
                label={
                    <Box display="flex" alignItems="center" gap={1.5}>
                        <MotionIcon color="action" />
                        <Box>
                            <Typography variant="body1" fontWeight={500}>
                                Reducir Movimiento
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Minimiza animaciones y transiciones
                            </Typography>
                        </Box>
                    </Box>
                }
            />
        </Stack>
    );
}
