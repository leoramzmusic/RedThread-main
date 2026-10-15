import { useState } from 'react';
import {
    Box,
    Container,
    Typography,
    Paper,
    Button,
    Slider,
    Switch,
    FormControlLabel,
    TextField,
    Stack,
    Divider,
    Grid,
    Alert,
    Chip,
    IconButton,
    Tooltip,
} from '@mui/material';
import AdminLayout from '../../../components/layout/AdminLayout';
import FunctionsIcon from '@mui/icons-material/Functions';
import SaveIcon from '@mui/icons-material/Save';
import ReplayIcon from '@mui/icons-material/Replay';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';

export default function CareEquationPage() {
    const [chaosFactor, setChaosFactor] = useState(5.0);
    const [positiveSum, setPositiveSum] = useState(true);
    const [threshold, setThreshold] = useState(0.15);
    const [formulaJson, setFormulaJson] = useState('{\n  "version": "2.1",\n  "base_formula": "SUM(product care_factors) + chaos",\n  "normalization": "min_max"\n}');
    const [isValid, setIsValid] = useState(true);
    const [saving, setSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<string | null>(null);

    const handleValidate = () => {
        try {
            JSON.parse(formulaJson);
            setIsValid(true);
        } catch {
            setIsValid(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await new Promise(r => setTimeout(r, 1000));
            setLastSaved(new Date().toLocaleString());
        } finally {
            setSaving(false);
        }
    };

    const handleRollback = () => {
        setFormulaJson('{\n  "version": "2.1",\n  "base_formula": "SUM(product care_factors) + chaos",\n  "normalization": "min_max"\n}');
        setChaosFactor(5.0);
        setPositiveSum(true);
        setThreshold(0.15);
    };

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
                                <FunctionsIcon sx={{ fontSize: 32, color: 'white' }} />
                            </Box>
                            <Box>
                                <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: '-0.5px' }}>
                                    Editor de Fórmula
                                </Typography>
                                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                                    Configura la ecuación base y los parámetros del algoritmo de afinidad.
                                </Typography>
                            </Box>
                        </Box>
                        <Stack direction="row" spacing={2}>
                            <Tooltip title="Restaurar valores por defecto">
                                <Button variant="outlined" startIcon={<ReplayIcon />} onClick={handleRollback}>
                                    Rollback
                                </Button>
                            </Tooltip>
                            <Button
                                variant="contained"
                                startIcon={<SaveIcon />}
                                onClick={handleSave}
                                disabled={saving || !isValid}
                            >
                                {saving ? 'Guardando...' : 'Validar y Guardar'}
                            </Button>
                        </Stack>
                    </Box>

                    {lastSaved && (
                        <Alert severity="success" sx={{ mb: 3 }} icon={<CheckCircleIcon />}>
                            Configuración guardada exitosamente a las {lastSaved}
                        </Alert>
                    )}

                    <Grid container spacing={4}>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>
                                Configuración Base del Algoritmo
                            </Typography>
                            <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
                                <Stack spacing={3}>
                                    <Box>
                                        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                                            <Typography variant="subtitle2">Factor Caos (Seed Randomness)</Typography>
                                            <Typography variant="subtitle2" color="primary">{chaosFactor}%</Typography>
                                        </Box>
                                        <Slider
                                            value={chaosFactor}
                                            onChange={(_, v) => setChaosFactor(v as number)}
                                            min={0} max={25} step={0.5}
                                        />
                                        <Typography variant="caption" sx={{ color: "text.secondary" }}>
                                            Añade una variación aleatoria controlada para evitar burbujas de filtro y fomentar descubrimientos inesperados ("Serendipity").
                                        </Typography>
                                    </Box>
                                    <Divider />
                                    <FormControlLabel
                                        control={<Switch checked={positiveSum} onChange={(_, v) => setPositiveSum(v)} />}
                                        label={
                                            <Box>
                                                <Typography variant="subtitle2">Suma Positiva (Intereses)</Typography>
                                                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                                                    Solo puntúa afinidades compartidas, no penaliza lo ausente.
                                                </Typography>
                                            </Box>
                                        }
                                    />
                                </Stack>
                            </Paper>

                            <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>
                                Pre-Filtros de Seguridad e Identidad
                            </Typography>
                            <Paper variant="outlined" sx={{ p: 3 }}>
                                <Stack spacing={2}>
                                    <Alert severity="info" icon={<AutoFixHighIcon />}>
                                        Los filtros de Identidad (Atracción Mutua) se ejecutan ANTES del cálculo de compatibilidad CARE.
                                    </Alert>
                                    <Box sx={{ mt: 2 }}>
                                        <Typography variant="subtitle2" gutterBottom>Umbral de Match Crítico</Typography>
                                        <TextField
                                            fullWidth
                                            size="small"
                                            type="number"
                                            value={threshold}
                                            onChange={(e) => setThreshold(Number(e.target.value))}
                                            label="Mínimo para visualización"
                                        />
                                    </Box>
                                </Stack>
                            </Paper>
                        </Grid>

                        <Grid size={{ xs: 12, md: 6 }}>
                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                    Editor JSON
                                </Typography>
                                <Chip
                                    label={isValid ? 'JSON Válido' : 'JSON Inválido'}
                                    color={isValid ? 'success' : 'error'}
                                    size="small"
                                    variant="outlined"
                                />
                            </Box>
                            <Paper variant="outlined" sx={{ p: 0, overflow: 'hidden' }}>
                                <Box sx={{ p: 2, bgcolor: 'action.hover', borderBottom: 1, borderColor: 'divider' }}>
                                    <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                                        /api/v2/care/engine/formula.json
                                    </Typography>
                                </Box>
                                <TextField
                                    multiline
                                    fullWidth
                                    minRows={12}
                                    value={formulaJson}
                                    onChange={(e) => { setFormulaJson(e.target.value); setIsValid(true); }}
                                    onBlur={handleValidate}
                                    error={!isValid}
                                    helperText={!isValid ? 'El JSON no es válido. Revisa la sintaxis.' : ''}
                                    sx={{
                                        '& .MuiInputBase-root': {
                                            fontFamily: 'monospace',
                                            fontSize: '0.875rem',
                                            borderRadius: 0,
                                        },
                                        '& .MuiOutlinedInput-notchedOutline': { border: 'none' }
                                    }}
                                />
                            </Paper>
                            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                                <Button variant="outlined" onClick={handleValidate}>
                                    Validar JSON
                                </Button>
                            </Box>
                        </Grid>
                    </Grid>
                </Box>
            </Container>
        </AdminLayout>
    );
}
