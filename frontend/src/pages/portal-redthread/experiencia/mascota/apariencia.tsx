import {
    Box,
    Container,
    Typography,
    Paper,
    Grid,
    Button,
    Alert,
    CircularProgress,
    Card,
    CardContent,
    Radio,
    RadioGroup,
    FormControlLabel,
    FormControl,
    FormLabel,
} from '@mui/material';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import AdminLayout from '../../../../components/layout/AdminLayout';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import yukiAdminService, { YukiConfig, YukiSkin } from '../../../../services/yukiAdminService';

const YARN_COLORS = [
    { name: 'Rojo (Default)', value: '#E63946' },
    { name: 'Azul', value: '#2196F3' },
    { name: 'Dorado', value: '#FFD700' },
    { name: 'Verde', value: '#4CAF50' },
    { name: 'Púrpura', value: '#9C27B0' },
    { name: 'Rosa', value: '#E91E63' },
    { name: 'Naranja', value: '#FF9800' },
    { name: 'Cyan', value: '#00BCD4' },
];

const YUKI_STYLES = [
    { id: 'kawaii', label: 'Kawaii Clásico', description: 'Estilo tierno con ojos grandes y expresiones amables' },
    { id: 'idle', label: 'Idle', description: 'Yuki relajado, durmiendo o perezoso' },
    { id: 'minimalist', label: 'Minimalista', description: 'Líneas simples, formas geométricas' },
];

export default function YukiApariencia() {
    const router = useRouter();
    const [config, setConfig] = useState<YukiConfig | null>(null);
    const [skins, setSkins] = useState<YukiSkin[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState('');

    useEffect(() => {
        Promise.all([yukiAdminService.getConfig(), yukiAdminService.getSkins()])
            .then(([c, s]) => { setConfig(c); setSkins(s); })
            .finally(() => setLoading(false));
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
                            Apariencia de Yuki
                        </Typography>
                    </Box>

                    {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

                    {/* Yarn Color */}
                    <Paper sx={{ p: 3, mb: 3 }}>
                        <Typography variant="h6" fontWeight={600} gutterBottom>
                            Color de la Bola de Estambre
                        </Typography>
                        <Grid container spacing={2} sx={{ mt: 1 }}>
                            {YARN_COLORS.map((color) => (
                                <Grid item key={color.value}>
                                    <Box
                                        onClick={() => saveConfig({ yarn_color: color.value })}
                                        sx={{
                                            width: 56,
                                            height: 56,
                                            borderRadius: '50%',
                                            bgcolor: color.value,
                                            cursor: 'pointer',
                                            border: config?.yarn_color === color.value ? '4px solid' : '3px solid transparent',
                                            borderColor: config?.yarn_color === color.value ? 'primary.main' : 'transparent',
                                            transition: 'all 0.2s',
                                            '&:hover': { transform: 'scale(1.15)', boxShadow: 3 },
                                        }}
                                        title={color.name}
                                    />
                                </Grid>
                            ))}
                        </Grid>
                    </Paper>

                    {/* Yuki Style */}
                    <Paper sx={{ p: 3, mb: 3 }}>
                        <Typography variant="h6" fontWeight={600} gutterBottom>
                            Estilo de Yuki
                        </Typography>
                        <FormControl component="fieldset" sx={{ mt: 1 }}>
                            <RadioGroup
                                value={config?.yuki_style || 'kawaii'}
                                onChange={(e) => saveConfig({ yuki_style: e.target.value })}
                            >
                                <Grid container spacing={2}>
                                    {YUKI_STYLES.map((style) => (
                                        <Grid item xs={12} key={style.id}>
                                            <Card
                                                sx={{
                                                    border: config?.yuki_style === style.id ? '2px solid' : '1px solid',
                                                    borderColor: config?.yuki_style === style.id ? 'primary.main' : 'divider',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s',
                                                    '&:hover': { boxShadow: 2 },
                                                }}
                                                onClick={() => saveConfig({ yuki_style: style.id })}
                                            >
                                                <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                    <FormControlLabel
                                                        value={style.id}
                                                        control={<Radio />}
                                                        label=""
                                                        sx={{ m: 0 }}
                                                    />
                                                    <Box>
                                                        <Typography variant="subtitle1" fontWeight={600}>
                                                            {style.label}
                                                        </Typography>
                                                        <Typography variant="body2" color="text.secondary">
                                                            {style.description}
                                                        </Typography>
                                                    </Box>
                                                </CardContent>
                                            </Card>
                                        </Grid>
                                    ))}
                                </Grid>
                            </RadioGroup>
                        </FormControl>
                    </Paper>

                    {/* Skins */}
                    <Paper sx={{ p: 3, mb: 3 }}>
                        <Typography variant="h6" fontWeight={600} gutterBottom>
                            Skins Personalizadas
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Sube imágenes personalizadas de Yuki en la sección de Assets.
                        </Typography>
                        {skins.length === 0 ? (
                            <Alert severity="info">No hay skins personalizadas. Sube imágenes en Assets.</Alert>
                        ) : (
                            <Grid container spacing={2}>
                                {skins.map((skin) => (
                                    <Grid item xs={6} md={4} key={skin.id}>
                                        <Card
                                            sx={{
                                                border: config?.custom_skin_id === skin.id ? '2px solid' : '1px solid',
                                                borderColor: config?.custom_skin_id === skin.id ? 'primary.main' : 'divider',
                                                cursor: 'pointer',
                                            }}
                                            onClick={() => saveConfig({ custom_skin_id: skin.id })}
                                        >
                                            <Box
                                                component="img"
                                                src={skin.image_url}
                                                alt={skin.name}
                                                sx={{ width: '100%', height: 120, objectFit: 'contain', bgcolor: 'grey.100' }}
                                            />
                                            <CardContent sx={{ py: 1 }}>
                                                <Typography variant="body2" fontWeight={600}>{skin.name}</Typography>
                                                {skin.unlocked_by && (
                                                    <Typography variant="caption" color="text.secondary">
                                                        Desbloqueada por: {skin.unlocked_by}
                                                    </Typography>
                                                )}
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                ))}
                            </Grid>
                        )}
                    </Paper>

                    {/* Live Preview */}
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" fontWeight={600} gutterBottom>
                            Vista Previa
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                            <Box sx={{ textAlign: 'center' }}>
                                <svg width="120" height="120" viewBox="0 0 120 120">
                                    {/* Simple Yuki preview */}
                                    <circle cx="60" cy="70" r="35" fill="white" stroke="#333" strokeWidth="2" />
                                    <ellipse cx="48" cy="65" rx="4" ry="5" fill="#333" />
                                    <ellipse cx="72" cy="65" rx="4" ry="5" fill="#333" />
                                    <ellipse cx="60" cy="75" rx="3" ry="2" fill="#FFB6C1" />
                                    <path d="M55 80 Q60 85 65 80" fill="none" stroke="#333" strokeWidth="1.5" />
                                    <path d="M30 50 Q25 30 40 45" fill="white" stroke="#333" strokeWidth="2" />
                                    <path d="M90 50 Q95 30 80 45" fill="white" stroke="#333" strokeWidth="2" />
                                    {/* Yarn ball */}
                                    <circle cx="95" cy="95" r="14" fill={config?.yarn_color || '#E63946'} />
                                    <path d="M88 90 Q95 85 102 90 Q98 98 92 95" fill="none" stroke="white" strokeWidth="1.5" opacity="0.6" />
                                </svg>
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                    Estilo: {config?.yuki_style} | Estambre: {config?.yarn_color}
                                </Typography>
                            </Box>
                        </Box>
                    </Paper>
                </Box>
            </Container>
        </AdminLayout>
    );
}
