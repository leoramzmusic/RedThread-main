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
    Slider,
    IconButton,
    Tooltip,
    Stack,
    Divider,
    Grid,
    Alert,
} from '@mui/material';
import AdminLayout from '../../../components/layout/AdminLayout';
import PsychologyIcon from '@mui/icons-material/Psychology';
import PeopleIcon from '@mui/icons-material/People';
import BarChartIcon from '@mui/icons-material/BarChart';
import EditIcon from '@mui/icons-material/Edit';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import SaveIcon from '@mui/icons-material/Save';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
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

export default function CareCriteriaPage() {
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [factors, setFactors] = useState<Factor[]>([]);
    const [totalWeight, setTotalWeight] = useState(0);

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        setTotalWeight(factors.reduce((sum, f) => sum + f.weight, 0));
    }, [factors]);

    const fetchData = async () => {
        setLoading(true);
        try {
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
            await new Promise(r => setTimeout(r, 1000));
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
        setFactors(factors.map(f => f.id === id ? { ...f, weight: newValue } : f));
    };

    const toggleLock = (id: string) => {
        setFactors(factors.map(f => f.id === id ? { ...f, locked: !f.locked } : f));
    };

    const isValid = totalWeight === 100;

    return (
        <AdminLayout>
            <Container maxWidth="xl">
                <Box sx={{ py: 4 }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4 }}>
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                            <Box sx={{
                                bgcolor: 'primary.main',
                                p: 1.5,
                                borderRadius: 2,
                                display: 'flex',
                                mr: 2,
                                boxShadow: '0 4px 12px rgba(255,77,79,0.3)'
                            }}>
                                <BarChartIcon sx={{ fontSize: 32, color: 'white' }} />
                            </Box>
                            <Box>
                                <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: '-0.5px' }}>
                                    Panel de Criterios
                                </Typography>
                                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                                    Configura los pesos de compatibilidad y autenticidad del motor CARE.
                                </Typography>
                            </Box>
                        </Box>
                        <Stack direction="row" spacing={2}>
                            <Button
                                variant="contained"
                                startIcon={<SaveIcon />}
                                onClick={handleSaveWeights}
                                disabled={saving || !isValid}
                            >
                                {saving ? 'Guardando...' : 'Aplicar Cambios'}
                            </Button>
                        </Stack>
                    </Box>

                    <Grid container spacing={3} sx={{ mb: 4 }}>
                        <Grid size={{ xs: 12, md: 4 }}>
                            <Paper variant="outlined" sx={{
                                p: 2,
                                textAlign: 'center',
                                borderColor: isValid ? 'success.light' : 'warning.light',
                                borderStyle: 'dashed'
                            }}>
                                <Typography variant="overline" sx={{ color: "text.secondary" }}>Total Ponderado</Typography>
                                <Typography variant="h4" color={isValid ? 'success.main' : 'warning.main'} sx={{ fontWeight: 800 }}>
                                    {totalWeight}%
                                </Typography>
                                <Stack direction="row" spacing={1} sx={{ justifyContent: 'center', mt: 1 }}>
                                    {isValid ? (
                                        <Chip icon={<CheckCircleIcon />} label="Válido" size="small" color="success" variant="outlined" />
                                    ) : (
                                        <Chip icon={<WarningIcon />} label={totalWeight > 100 ? 'Excede 100%' : 'Incompleto'} size="small" color="warning" variant="outlined" />
                                    )}
                                </Stack>
                            </Paper>
                        </Grid>
                        <Grid size={{ xs: 12, md: 4 }}>
                            <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                                <Typography variant="overline" sx={{ color: "text.secondary" }}>Bloques Activos</Typography>
                                <Typography variant="h4" sx={{ fontWeight: 800 }}>
                                    {factors.filter(f => f.status === 'active').length}
                                </Typography>
                            </Paper>
                        </Grid>
                        <Grid size={{ xs: 12, md: 4 }}>
                            <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                                <Typography variant="overline" sx={{ color: "text.secondary" }}>Identidades Detectadas</Typography>
                                <Typography variant="h4" sx={{ fontWeight: 800 }}>18</Typography>
                            </Paper>
                        </Grid>
                    </Grid>

                    {!isValid && (
                        <Alert severity="warning" sx={{ mb: 3 }}>
                            La suma de pesos debe ser exactamente 100%. Actualmente: {totalWeight}%
                        </Alert>
                    )}

                    <TableContainer component={Paper} variant="outlined">
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
                                            <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                                                <Box sx={{ p: 1, bgcolor: f.type === 'care' ? 'rgba(255,77,79,0.1)' : 'rgba(25,118,210,0.1)', borderRadius: 1.5 }}>
                                                    {f.type === 'care' ? <PsychologyIcon fontSize="small" color="primary" /> : <PeopleIcon fontSize="small" sx={{ color: 'info.main' }} />}
                                                </Box>
                                                <Box>
                                                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                                                        {f.name} {f.locked && <LockIcon sx={{ fontSize: 12, ml: 0.5, verticalAlign: 'middle', color: 'primary.main' }} />}
                                                    </Typography>
                                                    <Typography variant="caption" sx={{ color: "text.secondary", display: 'block', maxWidth: 250 }}>
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
                                            <Box sx={{ display: "flex", alignItems: "center", gap: 3 }}>
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
            </Container>
        </AdminLayout>
    );
}
