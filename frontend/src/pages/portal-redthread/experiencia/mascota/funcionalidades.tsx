import {
    Box,
    Container,
    Typography,
    Paper,
    Grid,
    Switch,
    FormControlLabel,
    Alert,
    CircularProgress,
    Card,
    CardContent,
    CardActions,
    Button,
} from '@mui/material';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import AdminLayout from '../../../../components/layout/AdminLayout';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import yukiAdminService, { YukiConfig } from '../../../../services/yukiAdminService';

const FEATURES = [
    {
        key: 'enable_loader' as const,
        title: 'Loader',
        description: 'Usar Yuki como indicador de carga (bola de estambre girando)',
        icon: '🧶',
        color: '#2196F3',
    },
    {
        key: 'enable_onboarding' as const,
        title: 'Onboarding',
        description: 'Mostrar Yuki como guía durante el primer uso de la app',
        icon: '👋',
        color: '#4CAF50',
    },
    {
        key: 'enable_notifications' as const,
        title: 'Notificaciones',
        description: 'Yuki aparece en notificaciones y celebraciones de logros',
        icon: '🔔',
        color: '#FF9800',
    },
    {
        key: 'enable_error_pages' as const,
        title: 'Páginas de Error',
        description: 'Mostrar Yuki en páginas 404, 500 y otros errores',
        icon: '⚠️',
        color: '#F44336',
    },
    {
        key: 'enable_easter_eggs' as const,
        title: 'Easter Eggs',
        description: 'Yuki aparece escondido en menús o pantallas como sorpresa',
        icon: '🥚',
        color: '#9C27B0',
    },
];

export default function YukiFuncionalidades() {
    const router = useRouter();
    const [config, setConfig] = useState<YukiConfig | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState('');

    useEffect(() => {
        yukiAdminService.getConfig().then((c) => { setConfig(c); setLoading(false); });
    }, []);

    const toggleFeature = async (key: keyof YukiConfig) => {
        if (!config) return;
        setSaving(true);
        try {
            const updated = await yukiAdminService.updateConfig({ [key]: !(config as any)[key] });
            setConfig(updated);
            setSuccess('Guardado');
            setTimeout(() => setSuccess(''), 2000);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <AdminLayout>
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
                    <CircularProgress />
                </Box>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <Container maxWidth="md">
                <Box sx={{ py: 4 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 1 }}>
                        <Box
                            component="span"
                            onClick={() => router.push('/portal-redthread/experiencia/mascota')}
                            sx={{ cursor: 'pointer', display: 'inline-flex', p: 1, borderRadius: 1, '&:hover': { bgcolor: 'action.hover' } }}
                        >
                            <ArrowBackIcon />
                        </Box>
                        <Typography variant="h4" fontWeight={700}>
                            Funcionalidades de Yuki
                        </Typography>
                    </Box>

                    {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

                    <Grid container spacing={3}>
                        {FEATURES.map((feature) => (
                            <Grid item xs={12} key={feature.key}>
                                <Card
                                    sx={{
                                        borderLeft: `4px solid ${feature.color}`,
                                        opacity: config?.[feature.key] ? 1 : 0.6,
                                        transition: 'all 0.3s',
                                    }}
                                >
                                    <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <Typography variant="h4">{feature.icon}</Typography>
                                        <Box sx={{ flexGrow: 1 }}>
                                            <Typography variant="h6" fontWeight={600}>
                                                {feature.title}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                {feature.description}
                                            </Typography>
                                        </Box>
                                        <Switch
                                            checked={config?.[feature.key] ?? false}
                                            onChange={() => toggleFeature(feature.key)}
                                            disabled={saving}
                                            color="primary"
                                            sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: feature.color } }}
                                        />
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>

                    {/* Summary */}
                    <Paper sx={{ p: 3, mt: 3 }}>
                        <Typography variant="h6" fontWeight={600} gutterBottom>
                            Resumen
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            {FEATURES.map((f) => (
                                <Alert
                                    key={f.key}
                                    severity={config?.[f.key] ? 'success' : 'warning'}
                                    sx={{ py: 0 }}
                                >
                                    {f.title}: {config?.[f.key] ? 'Activo' : 'Inactivo'}
                                </Alert>
                            ))}
                        </Box>
                    </Paper>
                </Box>
            </Container>
        </AdminLayout>
    );
}
