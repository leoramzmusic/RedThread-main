import { useState, useEffect } from 'react';
import {
    Box,
    Container,
    Typography,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    Button,
    Tabs,
    Tab,
    Slider,
    IconButton,
    Tooltip,
    Alert,
    Stack,
    Divider,
    Grid,
    Switch,
    FormControlLabel,
    TextField,
    Avatar,
} from '@mui/material';
import AdminLayout from '../../../components/layout/AdminLayout';
import BarChartIcon from '@mui/icons-material/BarChart';
import PeopleIcon from '@mui/icons-material/People';
import FunctionsIcon from '@mui/icons-material/Functions';
import PsychologyIcon from '@mui/icons-material/Psychology'; // CARE Icon
import ScienceIcon from '@mui/icons-material/Science'; // Simulator/Laboratory
import HistoryIcon from '@mui/icons-material/History';
import EditIcon from '@mui/icons-material/Edit';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import ReplayIcon from '@mui/icons-material/Replay';
import SaveIcon from '@mui/icons-material/Save';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh'; // Chaos Factor
import adminApiClient from '../../../services/adminApi';

interface Factor {
    id: string;
    name: string;
    description: string;
    weight: number;
    status: 'active' | 'inactive' | 'experimental';
    type: 'compatibility' | 'care';
    locked?: boolean;
}

export default function CareMotorPage() {
    const [activeTab, setActiveTab] = useState(0);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [factors, setFactors] = useState<Factor[]>([]);
    const [chaosFactor, setChaosFactor] = useState(5.0); // Default 5%

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch both CARE and Compatibility factors
            const [careRes, compatRes] = await Promise.all([
                adminApiClient.get('/portal-redthread/experiencia/algoritmos/care/factores'),
                adminApiClient.get('/portal-redthread/experiencia/algoritmos/compatibilidad/criterios')
            ]);

            const careFactors = (careRes.data || []).map((f: any) => ({
                id: f._id || f.id,
                name: f.name,
                description: f.description,
                weight: f.weight,
                status: f.status,
                type: 'care' as const,
                locked: false
            }));

            const compatFactors = (compatRes.data || []).map((f: any) => ({
                id: f._id || f.id,
                name: f.name,
                description: f.description || '',
                weight: f.weight,
                status: f.status,
                type: 'compatibility' as const,
                locked: false
            }));

            setFactors([...compatFactors, ...careFactors]);
        } catch (error) {
            console.error("Error fetching engine data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveWeights = async () => {
        setSaving(true);
        try {
            // Logic to save weights would go here, calling specific endpoints per factor type
            await new Promise(r => setTimeout(r, 1000)); // Mock delay
            fetchData();
        } catch (error) {
            console.error("Error saving factors:", error);
        } finally {
            setSaving(false);
        }
    };

    const handleWeightChange = (id: string, newValue: number) => {
        const factor = factors.find(f => f.id === id);
        if (!factor || factor.locked) return;

        // Proportional adjustment logic (simplified for UI demonstration)
        setFactors(factors.map(f => f.id === id ? { ...f, weight: newValue } : f));
    };

    const toggleLock = (id: string) => {
        setFactors(factors.map(f => f.id === id ? { ...f, locked: !f.locked } : f));
    };

    return (
        <AdminLayout>
            <Container maxWidth="xl">
                <Box sx={{ py: 4 }}>
                    {/* Header Section */}
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
                        <Box display="flex" alignItems="center">
                            <Box sx={{
                                bgcolor: 'primary.main',
                                p: 1.5,
                                borderRadius: 2,
                                display: 'flex',
                                mr: 2,
                                boxShadow: '0 4px 12px rgba(255,77,79,0.3)'
                            }}>
                                <PsychologyIcon sx={{ fontSize: 32, color: 'white' }} />
                            </Box>
                            <Box>
                                <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: '-0.5px' }}>
                                    Motor CARE & Compatibilidad
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Administración unificada del motor de afinidad y narrativa emocional.
                                </Typography>
                            </Box>
                        </Box>
                        <Stack direction="row" spacing={2}>
                            <Button variant="outlined" startIcon={<HistoryIcon />}>Historial</Button>
                            <Button
                                variant="contained"
                                startIcon={<SaveIcon />}
                                onClick={handleSaveWeights}
                                disabled={saving}
                            >
                                {saving ? 'Guardando...' : 'Aplicar Cambios'}
                            </Button>
                        </Stack>
                    </Box>

                    {/* Navigation Tabs */}
                    <Paper sx={{ borderRadius: 3, overflow: 'hidden', mb: 4, elevation: 0, border: '1px solid', borderColor: 'divider' }}>
                        <Tabs
                            value={activeTab}
                            onChange={(_, v) => setActiveTab(v)}
                            sx={{
                                bgcolor: 'action.hover',
                                borderBottom: 1,
                                borderColor: 'divider',
                                '& .MuiTab-root': { py: 2, fontWeight: 600 }
                            }}
                        >
                            <Tab label="Panel de Criterios" icon={<BarChartIcon />} iconPosition="start" />
                            <Tab label="Editor de Fórmula" icon={<FunctionsIcon />} iconPosition="start" />
                            <Tab label="CARE Interpreter" icon={<PsychologyIcon />} iconPosition="start" />
                            <Tab label="Laboratorio (A/B)" icon={<ScienceIcon />} iconPosition="start" />
                        </Tabs>

                        <Box sx={{ p: 4 }}>
                            {/* TAB 0: CRITERIA PANEL */}
                            {activeTab === 0 && (
                                <Box>
                                    <Grid container spacing={3} mb={4}>
                                        <Grid item xs={12} md={4}>
                                            <Paper variant="outlined" sx={{ p: 2, textAlign: 'center', borderColor: 'primary.light', borderStyle: 'dashed' }}>
                                                <Typography variant="overline" color="text.secondary">Total Ponderado</Typography>
                                                <Typography variant="h4" fontWeight={800} color="primary">100%</Typography>
                                            </Paper>
                                        </Grid>
                                        <Grid item xs={12} md={4}>
                                            <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                                                <Typography variant="overline" color="text.secondary">Bloques Activos</Typography>
                                                <Typography variant="h4" fontWeight={800}>{factors.filter(f => f.status === 'active').length}</Typography>
                                            </Paper>
                                        </Grid>
                                        <Grid item xs={12} md={4}>
                                            <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                                                <Typography variant="overline" color="text.secondary">Identidades Detectadas</Typography>
                                                <Typography variant="h4" fontWeight={800}>18</Typography>
                                            </Paper>
                                        </Grid>
                                    </Grid>

                                    <TableContainer>
                                        <Table>
                                            <TableHead>
                                                <TableRow sx={{ bgcolor: 'action.hover' }}>
                                                    <TableCell width="30%">Bloque Funcional</TableCell>
                                                    <TableCell width="15%">Origen</TableCell>
                                                    <TableCell width="35%">Ponderación (%)</TableCell>
                                                    <TableCell width="10%">Estado</TableCell>
                                                    <TableCell align="right" width="10%">Acciones</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {factors.map((f) => (
                                                    <TableRow key={f.id} hover sx={{ opacity: f.status === 'inactive' ? 0.6 : 1 }}>
                                                        <TableCell>
                                                            <Stack direction="row" spacing={1.5} alignItems="center">
                                                                <Box sx={{ p: 1, bgcolor: f.type === 'care' ? 'rgba(255,77,79,0.1)' : 'rgba(25,118,210,0.1)', borderRadius: 1.5 }}>
                                                                    {f.type === 'care' ? <PsychologyIcon fontSize="small" color="primary" /> : <PeopleIcon fontSize="small" sx={{ color: 'info.main' }} />}
                                                                </Box>
                                                                <Box>
                                                                    <Typography variant="subtitle2" fontWeight={700}>
                                                                        {f.name} {f.locked && <LockIcon sx={{ fontSize: 12, ml: 0.5, verticalAlign: 'middle', color: 'primary.main' }} />}
                                                                    </Typography>
                                                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', maxWidth: 250 }}>
                                                                        {f.description}
                                                                    </Typography>
                                                                </Box>
                                                            </Stack>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Chip
                                                                label={f.type === 'care' ? 'CARE Engine' : 'Match Logic'}
                                                                size="small"
                                                                variant="outlined"
                                                                sx={{ fontSize: '0.65rem', fontWeight: 700 }}
                                                            />
                                                        </TableCell>
                                                        <TableCell>
                                                            <Box display="flex" alignItems="center" gap={3}>
                                                                <Slider
                                                                    value={f.weight}
                                                                    onChange={(_, v) => handleWeightChange(f.id, v as number)}
                                                                    size="small"
                                                                    disabled={f.locked}
                                                                    sx={{ flexGrow: 1 }}
                                                                />
                                                                <Typography variant="body2" sx={{ minWidth: 40, fontWeight: 800 }}>
                                                                    {f.weight}%
                                                                </Typography>
                                                                <Tooltip title={f.locked ? "Desbloquear" : "Bloquear"}>
                                                                    <IconButton size="small" onClick={() => toggleLock(f.id)} color={f.locked ? "primary" : "default"}>
                                                                        {f.locked ? <LockIcon fontSize="small" /> : <LockOpenIcon fontSize="small" />}
                                                                    </IconButton>
                                                                </Tooltip>
                                                            </Box>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Chip
                                                                label={f.status.toUpperCase()}
                                                                size="small"
                                                                color={f.status === 'active' ? 'success' : f.status === 'experimental' ? 'warning' : 'default'}
                                                                sx={{ fontWeight: 800, fontSize: '0.6rem' }}
                                                            />
                                                        </TableCell>
                                                        <TableCell align="right">
                                                            <IconButton size="small"><EditIcon fontSize="small" /></IconButton>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                </Box>
                            )}

                            {/* TAB 1: FORMULA EDITOR */}
                            {activeTab === 1 && (
                                <Box>
                                    <Grid container spacing={4}>
                                        <Grid item xs={12} md={6}>
                                            <Typography variant="h6" fontWeight={700} gutterBottom>Configuración Base del Algoritmo</Typography>
                                            <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
                                                <Stack spacing={3}>
                                                    <Box>
                                                        <Box display="flex" justifyContent="space-between" mb={1}>
                                                            <Typography variant="subtitle2">Factor Caos (Seed Randomness)</Typography>
                                                            <Typography variant="subtitle2" color="primary">{chaosFactor}%</Typography>
                                                        </Box>
                                                        <Slider
                                                            value={chaosFactor}
                                                            onChange={(_, v) => setChaosFactor(v as number)}
                                                            min={0} max={25} step={0.5}
                                                        />
                                                        <Typography variant="caption" color="text.secondary">
                                                            Añade una variación aleatoria controlada para evitar burbujas de filtro y fomentar descubrimientos inesperados ("Serendipity").
                                                        </Typography>
                                                    </Box>
                                                    <Divider />
                                                    <FormControlLabel
                                                        control={<Switch defaultChecked />}
                                                        label={
                                                            <Box>
                                                                <Typography variant="subtitle2">Suma Positiva (Intereses)</Typography>
                                                                <Typography variant="caption" color="text.secondary">Solo puntúa afinidades compartidas, no penaliza lo ausente.</Typography>
                                                            </Box>
                                                        }
                                                    />
                                                </Stack>
                                            </Paper>
                                        </Grid>
                                        <Grid item xs={12} md={6}>
                                            <Typography variant="h6" fontWeight={700} gutterBottom>Pre-Filtros de Seguridad e Identidad</Typography>
                                            <Paper variant="outlined" sx={{ p: 3 }}>
                                                <Stack spacing={2}>
                                                    <Alert severity="info" icon={<AutoFixHighIcon />}>
                                                        Los filtros de Identidad (Atracción Mutua) se ejecutan ANTES del cálculo de compatibilidad CARE.
                                                    </Alert>
                                                    <Box sx={{ mt: 2 }}>
                                                        <Typography variant="subtitle2" gutterBottom>Umbral de Match Crítico</Typography>
                                                        <TextField fullWidth size="small" type="number" defaultValue={0.15} label="Mínimo para visualización" />
                                                    </Box>
                                                </Stack>
                                            </Paper>
                                        </Grid>
                                    </Grid>
                                </Box>
                            )}

                            {/* TAB 2: CARE INTERPRETER */}
                            {activeTab === 2 && (
                                <Box>
                                    <Grid container spacing={3}>
                                        <Grid item xs={12} md={4}>
                                            <Typography variant="subtitle1" fontWeight={700} gutterBottom>Tonos Narrativos</Typography>
                                            <Stack spacing={1}>
                                                {['Directo', 'Poético', 'Lúdico', 'Emocional', 'Curioso'].map(tone => (
                                                    <Paper key={tone} variant="outlined" sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <Typography variant="body2" fontWeight={600}>{tone}</Typography>
                                                        <Chip label="24 fragmentos" size="small" />
                                                    </Paper>
                                                ))}
                                            </Stack>
                                        </Grid>
                                        <Grid item xs={12} md={8}>
                                            <Paper variant="outlined" sx={{ p: 4, bgcolor: 'action.hover', minHeight: 400, borderStyle: 'dashed', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                                <PsychologyIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                                                <Typography variant="h6" color="text.secondary" gutterBottom>Editor de Rituales y Narrativas</Typography>
                                                <Typography variant="body2" color="text.disabled" align="center" sx={{ maxWidth: 400 }}>
                                                    Configura cómo el algoritmo traduce los números en microcopy emocional. Selecciona un bloque funcional para editar sus reglas de interpretación.
                                                </Typography>
                                            </Paper>
                                        </Grid>
                                    </Grid>
                                </Box>
                            )}

                            {/* TAB 3: LABORATORY */}
                            {activeTab === 3 && (
                                <Box>
                                    <Grid container spacing={4}>
                                        <Grid item xs={12} md={5}>
                                            <Typography variant="h6" fontWeight={700} gutterBottom>Simulador de Conexión</Typography>
                                            <Paper sx={{ p: 3, border: '1px solid', borderColor: 'primary.light', borderRadius: 2 }}>
                                                <Stack spacing={3}>
                                                    <Box>
                                                        <Typography variant="subtitle2" gutterBottom>Perfil A (Usuario)</Typography>
                                                        <TextField fullWidth size="small" placeholder="ID de Usuario o Alias" />
                                                    </Box>
                                                    <Box>
                                                        <Typography variant="subtitle2" gutterBottom>Perfil B (Candidato)</Typography>
                                                        <TextField fullWidth size="small" placeholder="ID de Candidato o Alias" />
                                                    </Box>
                                                    <Button variant="contained" size="large" fullWidth startIcon={<ScienceIcon />}>
                                                        Ejecutar Simulación
                                                    </Button>
                                                </Stack>
                                            </Paper>
                                        </Grid>
                                        <Grid item xs={12} md={7}>
                                            <Typography variant="h6" fontWeight={700} gutterBottom>Resultado del Motor CARE</Typography>
                                            <Paper variant="outlined" sx={{ p: 4, minHeight: 300 }}>
                                                <Box display="flex" alignItems="center" gap={4} mb={4}>
                                                    <Box sx={{ textAlign: 'center' }}>
                                                        <Avatar sx={{ width: 80, height: 80, mb: 1, bgcolor: 'action.selected' }}>A</Avatar>
                                                        <Typography variant="caption">Usuario</Typography>
                                                    </Box>
                                                    <Box sx={{ flexGrow: 1, textAlign: 'center' }}>
                                                        <Typography variant="h3" fontWeight={800} color="primary">--%</Typography>
                                                        <Divider sx={{ my: 1 }}>CARE Affinity</Divider>
                                                        <Typography variant="caption" color="text.secondary">Cálculo en tiempo real</Typography>
                                                    </Box>
                                                    <Box sx={{ textAlign: 'center' }}>
                                                        <Avatar sx={{ width: 80, height: 80, mb: 1, bgcolor: 'action.selected' }}>B</Avatar>
                                                        <Typography variant="caption">Candidato</Typography>
                                                    </Box>
                                                </Box>
                                                <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
                                                    <Typography variant="overline" color="text.secondary">CARE Narrative Output</Typography>
                                                    <Typography variant="body1" sx={{ fontStyle: 'italic', color: 'text.disabled' }}>
                                                        "Esperando simulación..."
                                                    </Typography>
                                                </Box>
                                            </Paper>
                                        </Grid>
                                    </Grid>
                                </Box>
                            )}
                        </Box>
                    </Paper>
                </Box>
            </Container>
        </AdminLayout>
    );
}
