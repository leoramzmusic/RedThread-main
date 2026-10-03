import {
    Box,
    Container,
    Typography,
    Grid,
    Card,
    CardContent,
    Button,
    Switch,
    FormControlLabel,
    Alert,
    CircularProgress,
    Snackbar,
} from '@mui/material';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import AdminLayout from '../../../../components/layout/AdminLayout';
import PetsIcon from '@mui/icons-material/Pets';
import SettingsIcon from '@mui/icons-material/Settings';
import PaletteIcon from '@mui/icons-material/Palette';
import AnimationIcon from '@mui/icons-material/Animation';
import ToggleOnIcon from '@mui/icons-material/ToggleOn';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import yukiAdminService, { YukiConfig } from '../../../../services/yukiAdminService';
import { adminApiClient } from '../../../../services/api';

export default function MascotaDashboard() {
    const router = useRouter();
    const [config, setConfig] = useState<YukiConfig | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [snack, setSnack] = useState<{ msg: string; sev: 'success' | 'error' } | null>(null);
    // null = verificando; true/false = tiene o no permiso edit_config (solo Super Admin por defecto)
    const [canEdit, setCanEdit] = useState<boolean | null>(null);

    useEffect(() => {
        let cancelled = false;
        Promise.all([
            yukiAdminService.getConfig(),
            adminApiClient.get('/portal-redthread/auth/me').catch(() => null),
        ])
            .then(([c, me]) => {
                if (cancelled) return;
                setConfig(c);
                const perms: string[] = (me?.data?.permissions as string[]) ?? [];
                setCanEdit(perms.includes('edit_config'));
            })
            .catch(() => {
                if (!cancelled) {
                    setSnack({ msg: 'No se pudo cargar la configuración de Yuki.', sev: 'error' });
                }
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, []);

    const toggleEnabled = async () => {
        if (!config || saving) return;
        if (canEdit === false) {
            setSnack({
                msg: 'Tu rol no tiene el permiso edit_config (solo Super Admin). Pide a un Super Admin que te lo asigne o que apague a Yuki.',
                sev: 'error',
            });
            return;
        }
        const next = !config.enabled;
        setSaving(true);
        try {
            const updated = await yukiAdminService.updateConfig({ enabled: next });
            setConfig(updated);
            setSnack({
                msg: next
                    ? 'Yuki activado: visible en la app.'
                    : 'Yuki desactivado: botón, loader, onboarding y mascota ocultos en la app.',
                sev: 'success',
            });
        } catch (e: any) {
            const status = e?.response?.status;
            const detail = e?.response?.data?.detail;
            setSnack({
                msg:
                    status === 403
                        ? `Sin permiso para guardar (403): ${detail ?? 'se requiere edit_config'}.`
                        : status === 401
                          ? 'Sesión de portal vencida (401). Cierra sesión y vuelve a entrar al portal.'
                          : `No se pudo guardar el cambio${detail ? `: ${detail}` : '. Intenta de nuevo.'}`,
                sev: 'error',
            });
        } finally {
            setSaving(false);
        }
    };

    const modules = [
        {
            title: 'Configuración',
            description: 'Entorno, reglas de aparición y pantallas permitidas',
            icon: <SettingsIcon sx={{ fontSize: 60, color: '#E63946' }} />,
            path: '/portal-redthread/experiencia/mascota/configuracion',
            color: '#E63946',
        },
        {
            title: 'Apariencia',
            description: 'Color de estambre, estilo de Yuki y skins personalizadas',
            icon: <PaletteIcon sx={{ fontSize: 60, color: '#4ECDC4' }} />,
            path: '/portal-redthread/experiencia/mascota/apariencia',
            color: '#4ECDC4',
        },
        {
            title: 'Animaciones',
            description: 'Estados, velocidades y activación por pantalla',
            icon: <AnimationIcon sx={{ fontSize: 60, color: '#9B59B6' }} />,
            path: '/portal-redthread/experiencia/mascota/animaciones',
            color: '#9B59B6',
        },
        {
            title: 'Funcionalidades',
            description: 'Loader, onboarding, notificaciones, easter eggs',
            icon: <ToggleOnIcon sx={{ fontSize: 60, color: '#F39C12' }} />,
            path: '/portal-redthread/experiencia/mascota/funcionalidades',
            color: '#F39C12',
        },
        {
            title: 'Assets',
            description: 'Subir y gestionar imágenes SVG, PNG y animaciones Lottie',
            icon: <CloudUploadIcon sx={{ fontSize: 60, color: '#2ECC71' }} />,
            path: '/portal-redthread/experiencia/mascota/assets',
            color: '#2ECC71',
        },
    ];

    return (
        <AdminLayout>
            <Container maxWidth="lg">
                <Box sx={{ py: 4 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <IconButton onClick={() => router.push('/portal-redthread/experiencia')}>
                            <ArrowBackIcon />
                        </IconButton>
                    </Box>

                    <Box sx={{ mb: 4, textAlign: 'center' }}>
                        <PetsIcon sx={{ fontSize: 80, color: '#E63946', mb: 2 }} />
                        <Typography variant="h3" fontWeight={700} gutterBottom>
                            Mascota — Yuki
                        </Typography>
                        <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
                            Panel de administración del gato kawaii
                        </Typography>

                        {loading ? (
                            <CircularProgress />
                        ) : (
                            <Card
                                variant="outlined"
                                sx={{
                                    mt: 1,
                                    textAlign: 'left',
                                    borderWidth: 2,
                                    borderColor: config?.enabled ? 'success.main' : 'warning.main',
                                }}
                            >
                                <CardContent
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 2,
                                        flexWrap: 'wrap',
                                    }}
                                >
                                    <PetsIcon
                                        sx={{
                                            fontSize: 48,
                                            color: config?.enabled ? 'success.main' : 'text.disabled',
                                        }}
                                    />
                                    <Box sx={{ flexGrow: 1, minWidth: 220 }}>
                                        <Typography variant="h6" fontWeight={700}>
                                            Interruptor maestro — Yuki{' '}
                                            {config?.enabled ? 'ACTIVO' : 'APAGADO'}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Apagado oculta TODO lo de la mascota en la app: botón
                                            flotante, loader, onboarding, badges y gatos
                                            decorativos. Úsalo mientras se corrigen las fallas.
                                        </Typography>
                                        <Box sx={{ mt: 1 }}>
                                            {config?.enabled ? (
                                                <Alert severity="success" sx={{ py: 0 }}>
                                                    Visible en la app
                                                </Alert>
                                            ) : (
                                                <Alert severity="warning" sx={{ py: 0 }}>
                                                    Oculto en toda la app
                                                </Alert>
                                            )}
                                        </Box>
                                        <Typography
                                            variant="caption"
                                            color="text.secondary"
                                            sx={{ display: 'block', mt: 1 }}
                                        >
                                            Aplica en nuevas cargas. Si tienes la app abierta en otra
                                            pestaña, recárgala.
                                        </Typography>
                                        {canEdit === false && (
                                            <Alert severity="info" sx={{ mt: 1 }}>
                                                Tu rol no tiene el permiso{' '}
                                                <strong>edit_config</strong> (solo Super Admin por
                                                defecto). El interruptor está bloqueado.
                                            </Alert>
                                        )}
                                    </Box>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={config?.enabled ?? false}
                                                onChange={toggleEnabled}
                                                disabled={saving || canEdit === false}
                                                color="success"
                                                size="medium"
                                            />
                                        }
                                        label={
                                            saving
                                                ? 'Guardando…'
                                                : config?.enabled
                                                  ? 'Yuki activo'
                                                  : 'Yuki desactivado'
                                        }
                                    />
                                </CardContent>
                            </Card>
                        )}
                    </Box>

                    <Grid container spacing={4}>
                        {modules.map((mod) => (
                            <Grid item xs={12} md={4} key={mod.title}>
                                <Card
                                    sx={{
                                        height: '100%',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        transition: 'all 0.3s',
                                        cursor: 'pointer',
                                        opacity: config?.enabled ? 1 : 0.6,
                                        '&:hover': {
                                            transform: 'translateY(-8px)',
                                            boxShadow: 6,
                                        },
                                    }}
                                    onClick={() => router.push(mod.path)}
                                >
                                    <CardContent
                                        sx={{
                                            flexGrow: 1,
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            textAlign: 'center',
                                            p: 4,
                                        }}
                                    >
                                        {mod.icon}
                                        <Typography variant="h5" fontWeight={600} sx={{ mt: 2, mb: 1 }}>
                                            {mod.title}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {mod.description}
                                        </Typography>
                                        <Button
                                            variant="contained"
                                            sx={{
                                                mt: 3,
                                                bgcolor: mod.color,
                                                '&:hover': { bgcolor: mod.color, opacity: 0.9 },
                                            }}
                                        >
                                            Gestionar
                                        </Button>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                </Box>
            </Container>
            <Snackbar
                open={!!snack}
                autoHideDuration={4000}
                onClose={() => setSnack(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert severity={snack?.sev ?? 'success'} onClose={() => setSnack(null)}>
                    {snack?.msg}
                </Alert>
            </Snackbar>
        </AdminLayout>
    );
}

function IconButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
    return (
        <Box
            component="span"
            onClick={onClick}
            sx={{ cursor: 'pointer', display: 'inline-flex', p: 1, borderRadius: 1, '&:hover': { bgcolor: 'action.hover' } }}
        >
            {children}
        </Box>
    );
}
