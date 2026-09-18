import {
    Box,
    Container,
    Typography,
    Paper,
    Grid,
    Switch,
    FormControlLabel,
    Slider,
    TextField,
    Alert,
    CircularProgress,
    Card,
    CardContent,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
} from '@mui/material';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import AdminLayout from '../../../../components/layout/AdminLayout';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import yukiAdminService, { YukiConfig } from '../../../../services/yukiAdminService';

const ANIMATION_STATES = [
    { key: 'idle', label: 'Idle', description: 'Estado reposo / sin interacción', color: '#9E9E9E' },
    { key: 'loading', label: 'Loading', description: 'Cargando datos o procesando', color: '#2196F3' },
    { key: 'success', label: 'Success', description: 'Acción completada exitosamente', color: '#4CAF50' },
    { key: 'error', label: 'Error', description: 'Algo salió mal', color: '#F44336' },
];

const ANIMATION_OPTIONS = [
    'default', 'yarn_spin', 'celebrate', 'confused', 'sleeping',
    'bounce', 'wave', 'shake', 'pulse', 'flip',
];

export default function YukiAnimaciones() {
    const router = useRouter();
    const [config, setConfig] = useState<YukiConfig | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState('');

    useEffect(() => {
        yukiAdminService.getConfig().then((c) => { setConfig(c); setLoading(false); });
    }, []);

    const saveConfig = async (partial: Partial<YukiConfig>) => {
        if (!config) return;
        setSaving(true);
        try {
            const updated = await yukiAdminService.updateConfig(partial);
            setConfig(updated);
            setSuccess('Guardado');
            setTimeout(() => setSuccess(''), 2000);
        } finally {
            setSaving(false);
        }
    };

    const getAnimation = (state: string) => {
        if (!config) return 'default';
        const map: Record<string, string> = {
            idle: config.idle_animation,
            loading: config.loading_animation,
            success: config.success_animation,
            error: config.error_animation,
        };
        return map[state] || 'default';
    };

    const setAnimation = (state: string, value: string) => {
        const map: Record<string, string> = {
            idle: 'idle_animation',
            loading: 'loading_animation',
            success: 'success_animation',
            error: 'error_animation',
        };
        saveConfig({ [map[state]]: value });
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
                            Animaciones de Yuki
                        </Typography>
                    </Box>

                    {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

                    {/* Animation Speed */}
                    <Paper sx={{ p: 3, mb: 3 }}>
                        <Typography variant="h6" fontWeight={600} gutterBottom>
                            Velocidad de Animación
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Controla la velocidad global de las animaciones de Yuki.
                        </Typography>
                        <Box sx={{ px: 2 }}>
                            <Slider
                                value={config?.animation_speed ?? 1}
                                onChange={(_, v) => saveConfig({ animation_speed: v as number })}
                                min={0.25}
                                max={3}
                                step={0.25}
                                marks={[
                                    { value: 0.5, label: '0.5x' },
                                    { value: 1, label: '1x' },
                                    { value: 1.5, label: '1.5x' },
                                    { value: 2, label: '2x' },
                                    { value: 3, label: '3x' },
                                ]}
                                valueLabelDisplay="auto"
                                valueLabelFormat={(v) => `${v}x`}
                            />
                        </Box>
                    </Paper>

                    {/* State Animations */}
                    <Paper sx={{ p: 3, mb: 3 }}>
                        <Typography variant="h6" fontWeight={600} gutterBottom>
                            Animaciones por Estado
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Configura qué animación reproduce Yuki en cada estado.
                        </Typography>

                        <Grid container spacing={2}>
                            {ANIMATION_STATES.map((state) => (
                                <Grid item xs={12} md={6} key={state.key}>
                                    <Card sx={{ borderLeft: `4px solid ${state.color}` }}>
                                        <CardContent>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                                <Typography variant="subtitle1" fontWeight={600}>
                                                    {state.label}
                                                </Typography>
                                                <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: state.color }} />
                                            </Box>
                                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                                {state.description}
                                            </Typography>
                                            <FormControl fullWidth size="small">
                                                <InputLabel>Animación</InputLabel>
                                                <Select
                                                    value={getAnimation(state.key)}
                                                    label="Animación"
                                                    onChange={(e) => setAnimation(state.key, e.target.value)}
                                                >
                                                    {ANIMATION_OPTIONS.map((opt) => (
                                                        <MenuItem key={opt} value={opt}>
                                                            {opt.replace(/_/g, ' ')}
                                                        </MenuItem>
                                                    ))}
                                                </Select>
                                            </FormControl>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                    </Paper>

                    {/* Screen Overrides */}
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" fontWeight={600} gutterBottom>
                            Activación por Pantalla
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Define en qué pantallas Yuki aparece o usa animaciones específicas.
                        </Typography>
                        <Alert severity="info">
                            Configura las pantallas permitidas/bloqueadas en la sección de Configuración.
                        </Alert>
                    </Paper>
                </Box>
            </Container>
        </AdminLayout>
    );
}
