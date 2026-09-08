import React from 'react';
import {
    Box,
    Typography,
    FormControlLabel,
    Switch,
    Stack,
    Divider,
    Button,
    Paper,
    TextField,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    IconButton,
    Tooltip,
} from '@mui/material';
import {
    Visibility as VisibilityIcon,
    Storage as DataIcon,
    GppGood as ConsentIcon,
    Lock as SecurityIcon,
    Block as BlockIcon,
    Security as SafeModeIcon,
    Description as PolicyIcon,
    Favorite as EmotionalIcon,
    Download as DownloadIcon,
    Delete as DeleteIcon,
    History as HistoryIcon,
    ArrowForward as ArrowIcon,
    Info as InfoIcon,
} from '@mui/icons-material';
import Link from 'next/link';
import { useTranslation } from 'next-i18next';

interface PrivacySectionProps {
    settings: any;
    onSettingsChange: (field: string, value: any) => void;
}

export default function PrivacySection({ settings, onSettingsChange }: PrivacySectionProps) {
    const { t } = useTranslation('common');

    const handleSubFieldChange = (parentField: string, subField: string, value: any) => {
        onSettingsChange(parentField, {
            ...settings?.[parentField],
            [subField]: value
        });
    };

    const sectionTitleStyle = {
        fontWeight: 700,
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        mb: 2,
        color: 'text.primary'
    };

    return (
        <Stack spacing={4}>
            {/* 1. Configuración de visibilidad */}
            <Box>
                <Typography variant="h6" sx={sectionTitleStyle}>
                    <VisibilityIcon color="primary" /> {t('privacy_visibility_title', 'Configuración de Visibilidad')}
                </Typography>
                <Stack spacing={2}>
                    <FormControl fullWidth size="small">
                        <InputLabel>{t('privacy_profile_visibility', 'Quién puede ver tu perfil completo')}</InputLabel>
                        <Select
                            value={settings?.privacy?.profile_visibility || 'public'}
                            label={t('privacy_profile_visibility', 'Quién puede ver tu perfil completo')}
                            onChange={(e) => handleSubFieldChange('privacy', 'profile_visibility', e.target.value)}
                        >
                            <MenuItem value="public">Público</MenuItem>
                            <MenuItem value="matches">Solo Matches</MenuItem>
                            <MenuItem value="active_threads">Solo Hilos Activos</MenuItem>
                        </Select>
                    </FormControl>

                    <FormControlLabel
                        control={
                            <Switch
                                checked={settings?.privacy?.invisible_mode ?? false}
                                onChange={(e) => handleSubFieldChange('privacy', 'invisible_mode', e.target.checked)}
                            />
                        }
                        label={
                            <Box>
                                <Typography variant="body2" fontWeight={600}>Modo Invisible</Typography>
                                <Typography variant="caption" color="text.secondary">Navega sin aparecer en listas o sugerencias</Typography>
                            </Box>
                        }
                    />

                    <Typography variant="subtitle2" sx={{ mt: 1, mb: 1 }}>Control por Hilo</Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap">
                        {['RedThread', 'Blueth', 'Purpleth'].map((thread) => (
                            <FormControlLabel
                                key={thread}
                                control={
                                    <Switch
                                        size="small"
                                        checked={settings?.privacy?.threads?.[thread.toLowerCase()] ?? true}
                                        onChange={(e) => {
                                            const threads = { ...settings?.privacy?.threads, [thread.toLowerCase()]: e.target.checked };
                                            handleSubFieldChange('privacy', 'threads', threads);
                                        }}
                                    />
                                }
                                label={thread}
                            />
                        ))}
                    </Stack>
                </Stack>
            </Box>

            <Divider />

            {/* 2. Gestión de datos personales */}
            <Box>
                <Typography variant="h6" sx={sectionTitleStyle}>
                    <DataIcon color="primary" /> {t('privacy_data_management', 'Gestión de Datos Personales')}
                </Typography>
                <Typography variant="body2" color="text.secondary" mb={2}>
                    Controla qué información conservamos y cómo la usamos.
                </Typography>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <Button
                        variant="outlined"
                        startIcon={<DownloadIcon />}
                        fullWidth
                        onClick={() => {/* Trigger data export flow */ }}
                    >
                        Descargar mi Información
                    </Button>
                    <Button
                        variant="outlined"
                        color="error"
                        startIcon={<DeleteIcon />}
                        fullWidth
                        component={Link}
                        href="/settings?section=security"
                    >
                        Eliminar Cuenta o Hilos
                    </Button>
                </Stack>
            </Box>

            <Divider />

            {/* 3. Permisos y consentimiento */}
            <Box>
                <Typography variant="h6" sx={sectionTitleStyle}>
                    <ConsentIcon color="primary" /> {t('privacy_consent_title', 'Permisos y Consentimiento')}
                </Typography>
                <Stack spacing={2}>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={settings?.privacy?.explicit_consent_sensitive ?? true}
                                onChange={(e) => handleSubFieldChange('privacy', 'explicit_consent_sensitive', e.target.checked)}
                            />
                        }
                        label={
                            <Box>
                                <Typography variant="body2" fontWeight={600}>Consentimiento explícito para interacciones sensibles</Typography>
                                <Typography variant="caption" color="text.secondary">Fantasía, contenido íntimo, etc.</Typography>
                            </Box>
                        }
                    />
                    <Button
                        variant="text"
                        startIcon={<HistoryIcon />}
                        sx={{ alignSelf: 'flex-start' }}
                    >
                        Ver Historial de Consentimientos
                    </Button>
                </Stack>
            </Box>

            <Divider />

            {/* 4. Seguridad y autenticación */}
            <Box>
                <Typography variant="h6" sx={sectionTitleStyle}>
                    <SecurityIcon color="primary" /> {t('privacy_security_title', 'Seguridad y Autenticación')}
                </Typography>
                <List disablePadding>
                    <ListItem
                        disableGutters
                        secondaryAction={
                            <IconButton edge="end" component={Link} href="/settings?section=security">
                                <ArrowIcon />
                            </IconButton>
                        }
                    >
                        <ListItemText
                            primary="Verificación en dos pasos"
                            secondary="SMS, correo o app externa"
                        />
                    </ListItem>
                    <ListItem
                        disableGutters
                        secondaryAction={
                            <IconButton edge="end">
                                <ArrowIcon />
                            </IconButton>
                        }
                    >
                        <ListItemText
                            primary="Historial de accesos"
                            secondary="Dispositivos, ubicaciones y fechas desde las que has entrado"
                        />
                    </ListItem>
                </List>
            </Box>

            <Divider />

            {/* 5. Bloqueo y reportes */}
            <Box>
                <Typography variant="h6" sx={sectionTitleStyle}>
                    <BlockIcon color="primary" /> {t('privacy_blocking_title', 'Bloqueo y Reportes')}
                </Typography>
                <Stack direction="row" spacing={2}>
                    <Button variant="outlined" startIcon={<BlockIcon />} fullWidth>
                        Lista de Bloqueados
                    </Button>
                    <Button variant="outlined" startIcon={<HistoryIcon />} fullWidth>
                        Seguimiento de Reportes
                    </Button>
                </Stack>
            </Box>

            <Divider />

            {/* 6. Modo seguro / Modo privado */}
            <Box>
                <Typography variant="h6" sx={sectionTitleStyle}>
                    <SafeModeIcon color="primary" /> {t('privacy_safe_mode_title', 'Modo Seguro / Modo Privado')}
                </Typography>
                <Stack spacing={2}>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={settings?.privacy?.safe_mode ?? true}
                                onChange={(e) => handleSubFieldChange('privacy', 'safe_mode', e.target.checked)}
                            />
                        }
                        label={
                            <Box>
                                <Typography variant="body2" fontWeight={600}>Activar Modo Seguro</Typography>
                                <Typography variant="caption" color="text.secondary">Oculta contenido sensible y desactiva sugerencias íntimas</Typography>
                            </Box>
                        }
                    />

                    <Paper variant="outlined" sx={{ p: 2, bgcolor: 'action.hover' }}>
                        <Typography variant="subtitle2" gutterBottom fontWeight={600}>Mantener Hilos Ocultos</Typography>
                        <Typography variant="caption" color="text.secondary" display="block" mb={2}>
                            Usa un hilo de forma privada mientras otros permanecen invisibles.
                        </Typography>
                        <Stack direction="row" spacing={1} flexWrap="wrap">
                            {['RedThread', 'Blueth', 'Purpleth'].map((thread) => (
                                <Button
                                    key={thread}
                                    variant={settings?.privacy?.hidden_threads?.[thread.toLowerCase()] ? 'contained' : 'outlined'}
                                    size="small"
                                    onClick={() => {
                                        const hidden = { ...settings?.privacy?.hidden_threads, [thread.toLowerCase()]: !settings?.privacy?.hidden_threads?.[thread.toLowerCase()] };
                                        handleSubFieldChange('privacy', 'hidden_threads', hidden);
                                    }}
                                >
                                    {thread}
                                </Button>
                            ))}
                        </Stack>
                    </Paper>
                </Stack>
            </Box>

            <Divider />

            {/* 7. Política de privacidad y términos */}
            <Box>
                <Typography variant="h6" sx={sectionTitleStyle}>
                    <PolicyIcon color="primary" /> {t('privacy_policy_title', 'Política de Privacidad y Términos')}
                </Typography>
                <Paper
                    sx={{
                        p: 3,
                        borderRadius: 2,
                        bgcolor: 'primary.main',
                        color: 'primary.contrastText',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        cursor: 'pointer'
                    }}
                    component={Link}
                    href="/legal/privacy"
                >
                    <Box flex={1}>
                        <Typography variant="subtitle1" fontWeight={700}>Resumen de Privacidad</Typography>
                        <Typography variant="body2" sx={{ opacity: 0.9 }}>Entiende cómo protegemos tus datos en un lenguaje claro.</Typography>
                    </Box>
                    <PolicyIcon fontSize="large" />
                </Paper>
            </Box>

            {/* BONUS: Integración emocional */}
            <Box
                sx={{
                    mt: 2,
                    p: 3,
                    borderRadius: 3,
                    background: (theme) => `linear-gradient(135deg, ${theme.palette.primary.dark}0D 0%, ${theme.palette.primary.main}1A 100%)`,
                    border: '1px dashed',
                    borderColor: 'primary.main',
                }}
            >
                <Typography variant="h6" sx={{ ...sectionTitleStyle, color: 'primary.main', mb: 1 }}>
                    <EmotionalIcon /> Tu Privacidad Emocional
                </Typography>
                <Typography variant="body2" color="text.secondary" mb={3}>
                    En ReTh, tu bienestar emocional es nuestra prioridad. Define cómo quieres interactuar.
                </Typography>

                <Stack spacing={2.5}>
                    <Box>
                        <Typography variant="subtitle2" gutterBottom>¿Qué tipo de interacciones te hacen sentir seguro?</Typography>
                        <TextField
                            fullWidth
                            multiline
                            rows={2}
                            placeholder="Ej: Prefiero interacciones tranquilas, sin presiones..."
                            variant="outlined"
                            size="small"
                            value={settings?.emotional_privacy?.safety_notes || ''}
                            onChange={(e) => handleSubFieldChange('emotional_privacy', 'safety_notes', e.target.value)}
                        />
                    </Box>

                    <FormControlLabel
                        control={
                            <Switch
                                checked={settings?.emotional_privacy?.trusted_only ?? false}
                                onChange={(e) => handleSubFieldChange('emotional_privacy', 'trusted_only', e.target.checked)}
                            />
                        }
                        label={
                            <Box>
                                <Typography variant="body2" fontWeight={600}>Filtrar mensajes nuevos</Typography>
                                <Typography variant="caption" color="text.secondary">Recibir mensajes solo de conocidos o matches</Typography>
                            </Box>
                        }
                    />

                    <Button
                        variant="text"
                        size="small"
                        startIcon={<InfoIcon />}
                        sx={{ textTransform: 'none', color: 'primary.main' }}
                    >
                        Establece límites personalizados para cada hilo
                    </Button>
                </Stack>
            </Box>
        </Stack>
    );
}
