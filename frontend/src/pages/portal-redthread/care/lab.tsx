import { useState } from 'react';
import {
    Box,
    Container,
    Typography,
    Paper,
    Button,
    TextField,
    Stack,
    Grid,
    Divider,
    Avatar,
    Chip,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Alert,
} from '@mui/material';
import AdminLayout from '../../../components/layout/AdminLayout';
import ScienceIcon from '@mui/icons-material/Science';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';

const experiments = [
    {
        id: 'exp_001',
        name: 'Baseline CARE v2.1',
        status: 'active',
        matchRate: 78,
        avgEngagement: 4.2,
        chatDuration: '12min',
    },
    {
        id: 'exp_002',
        name: 'Neurodiversidad Boost',
        status: 'running',
        matchRate: 82,
        avgEngagement: 4.8,
        chatDuration: '18min',
    },
    {
        id: 'exp_003',
        name: 'Caos Reducido',
        status: 'completed',
        matchRate: 71,
        avgEngagement: 3.9,
        chatDuration: '9min',
    },
];

export default function CareLabPage() {
    const [profileA, setProfileA] = useState('');
    const [profileB, setProfileB] = useState('');
    const [simulating, setSimulating] = useState(false);
    const [simResult, setSimResult] = useState<{ score: number; narrative: string } | null>(null);

    const handleSimulate = async () => {
        setSimulating(true);
        await new Promise(r => setTimeout(r, 2000));
        setSimResult({
            score: Math.floor(Math.random() * 40) + 55,
            narrative: "Conexión moderada-alta. Valores alineados con potencial de crecimiento."
        });
        setSimulating(false);
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
                                <ScienceIcon sx={{ fontSize: 32, color: 'white' }} />
                            </Box>
                            <Box>
                                <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: '-0.5px' }}>
                                    Laboratorio (A/B)
                                </Typography>
                                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                                    Experimenta con diferentes configuraciones y mide el impacto.
                                </Typography>
                            </Box>
                        </Box>
                        <FormControl size="small" sx={{ minWidth: 200 }}>
                            <InputLabel>Experimento</InputLabel>
                            <Select defaultValue="exp_001" label="Experimento">
                                <MenuItem value="exp_001">Baseline CARE v2.1</MenuItem>
                                <MenuItem value="exp_002">Neurodiversidad Boost</MenuItem>
                                <MenuItem value="exp_003">Caos Reducido</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>

                    <Grid container spacing={4}>
                        <Grid size={{ xs: 12, md: 5 }}>
                            <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>
                                Simulador de Conexión
                            </Typography>
                            <Paper sx={{ p: 3, border: '1px solid', borderColor: 'primary.light', borderRadius: 2 }}>
                                <Stack spacing={3}>
                                    <Box>
                                        <Typography variant="subtitle2" gutterBottom>Perfil A (Usuario)</Typography>
                                        <TextField
                                            fullWidth
                                            size="small"
                                            placeholder="ID de Usuario o Alias"
                                            value={profileA}
                                            onChange={(e) => setProfileA(e.target.value)}
                                        />
                                    </Box>
                                    <Box>
                                        <Typography variant="subtitle2" gutterBottom>Perfil B (Candidato)</Typography>
                                        <TextField
                                            fullWidth
                                            size="small"
                                            placeholder="ID de Candidato o Alias"
                                            value={profileB}
                                            onChange={(e) => setProfileB(e.target.value)}
                                        />
                                    </Box>
                                    <Button
                                        variant="contained"
                                        size="large"
                                        fullWidth
                                        startIcon={<PlayArrowIcon />}
                                        onClick={handleSimulate}
                                        disabled={simulating || !profileA || !profileB}
                                    >
                                        {simulating ? 'Ejecutando...' : 'Ejecutar Simulación'}
                                    </Button>
                                </Stack>
                            </Paper>
                        </Grid>

                        <Grid size={{ xs: 12, md: 7 }}>
                            <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>
                                Resultado del Motor CARE
                            </Typography>
                            <Paper variant="outlined" sx={{ p: 4, minHeight: 300 }}>
                                {simResult ? (
                                    <>
                                        <Box sx={{ display: "flex", alignItems: "center", gap: 4, mb: 4 }}>
                                            <Box sx={{ textAlign: 'center' }}>
                                                <Avatar sx={{ width: 80, height: 80, mb: 1, bgcolor: 'action.selected' }}>A</Avatar>
                                                <Typography variant="caption">Usuario</Typography>
                                            </Box>
                                            <Box sx={{ flexGrow: 1, textAlign: 'center' }}>
                                                <Typography variant="h3" color="primary" sx={{ fontWeight: 800 }}>
                                                    {simResult.score}%
                                                </Typography>
                                                <Divider sx={{ my: 1 }}>CARE Affinity</Divider>
                                                <Chip label={simResult.score >= 70 ? 'Alta compatibilidad' : simResult.score >= 50 ? 'Compatibilidad moderada' : 'Baja compatibilidad'} color={simResult.score >= 70 ? 'success' : simResult.score >= 50 ? 'warning' : 'error'} size="small" />
                                            </Box>
                                            <Box sx={{ textAlign: 'center' }}>
                                                <Avatar sx={{ width: 80, height: 80, mb: 1, bgcolor: 'action.selected' }}>B</Avatar>
                                                <Typography variant="caption">Candidato</Typography>
                                            </Box>
                                        </Box>
                                        <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
                                            <Typography variant="overline" sx={{ color: "text.secondary" }}>
                                                CARE Narrative Output
                                            </Typography>
                                            <Typography variant="body1" sx={{ fontStyle: 'italic' }}>
                                                "{simResult.narrative}"
                                            </Typography>
                                        </Box>
                                    </>
                                ) : (
                                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 250 }}>
                                        <ScienceIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                                        <Typography variant="body1" sx={{ color: 'text.disabled' }}>
                                            Ingresa dos perfiles y ejecuta una simulación
                                        </Typography>
                                    </Box>
                                )}
                            </Paper>
                        </Grid>
                    </Grid>

                    <Divider sx={{ my: 4 }} />

                    <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 2 }}>
                        <CompareArrowsIcon color="action" />
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                            Comparación de Experimentos
                        </Typography>
                    </Stack>
                    <Grid container spacing={3}>
                        {experiments.map((exp) => (
                            <Grid size={{ xs: 12, md: 4 }} key={exp.id}>
                                <Paper variant="outlined" sx={{ p: 3, height: '100%' }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{exp.name}</Typography>
                                        <Chip
                                            label={exp.status.toUpperCase()}
                                            size="small"
                                            color={exp.status === 'active' ? 'success' : exp.status === 'running' ? 'warning' : 'default'}
                                            sx={{ fontSize: '0.6rem', fontWeight: 800 }}
                                        />
                                    </Box>
                                    <Stack spacing={2} sx={{ mt: 2 }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>Match Rate</Typography>
                                            <Typography variant="body2" sx={{ fontWeight: 700 }}>{exp.matchRate}%</Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>Engagement</Typography>
                                            <Typography variant="body2" sx={{ fontWeight: 700 }}>{exp.avgEngagement}/5</Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>Duración chat</Typography>
                                            <Typography variant="body2" sx={{ fontWeight: 700 }}>{exp.chatDuration}</Typography>
                                        </Box>
                                    </Stack>
                                </Paper>
                            </Grid>
                        ))}
                    </Grid>
                </Box>
            </Container>
        </AdminLayout>
    );
}
