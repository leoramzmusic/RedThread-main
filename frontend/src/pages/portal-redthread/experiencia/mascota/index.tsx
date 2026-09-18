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

export default function MascotaDashboard() {
    const router = useRouter();
    const [config, setConfig] = useState<YukiConfig | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        yukiAdminService.getConfig().then((c) => {
            setConfig(c);
            setLoading(false);
        });
    }, []);

    const toggleEnabled = async () => {
        if (!config) return;
        setSaving(true);
        try {
            const updated = await yukiAdminService.updateConfig({ enabled: !config.enabled });
            setConfig(updated);
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
                            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, alignItems: 'center' }}>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={config?.enabled ?? true}
                                            onChange={toggleEnabled}
                                            disabled={saving}
                                            color="success"
                                        />
                                    }
                                    label={config?.enabled ? 'Yuki activo' : 'Yuki desactivado'}
                                />
                                {config?.enabled && (
                                    <Alert severity="success" sx={{ py: 0 }}>
                                        Visible en la app
                                    </Alert>
                                )}
                            </Box>
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
