import { useState } from 'react';
import {
    Box,
    Container,
    Typography,
    Paper,
    Button,
    Stack,
    Grid,
    Chip,
    Divider,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Avatar,
    IconButton,
} from '@mui/material';
import AdminLayout from '../../../components/layout/AdminLayout';
import PsychologyIcon from '@mui/icons-material/Psychology';
import DownloadIcon from '@mui/icons-material/Download';
import PersonIcon from '@mui/icons-material/Person';

const toneOptions = ['Directo', 'Poético', 'Lúdico', 'Emocional', 'Curioso'];

const sampleBreakdown = [
    { dimension: 'Valores', score: 36, color: '#ff4d4f' },
    { dimension: 'Metas', score: 20, color: '#1890ff' },
    { dimension: 'Neurodiversidad', score: 15, color: '#52c41a' },
    { dimension: 'Responsiveness', score: 10, color: '#faad14' },
    { dimension: 'Música', score: 14, color: '#722ed1' },
    { dimension: 'Lenguaje del amor', score: 9, color: '#eb2f96' },
];

export default function CareInterpreterPage() {
    const [selectedTone, setSelectedTone] = useState('Directo');
    const [selectedUser] = useState('usuario_12345');

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
                                <PsychologyIcon sx={{ fontSize: 32, color: 'white' }} />
                            </Box>
                            <Box>
                                <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: '-0.5px' }}>
                                    CARE Interpreter
                                </Typography>
                                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                                    Explicabilidad del score: desglose de afinidad por dimensión.
                                </Typography>
                            </Box>
                        </Box>
                        <Button variant="outlined" startIcon={<DownloadIcon />}>
                            Exportar Reporte
                        </Button>
                    </Box>

                    <Grid container spacing={3}>
                        <Grid size={{ xs: 12, md: 4 }}>
                            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 700 }}>
                                Tonos Narrativos
                            </Typography>
                            <Stack spacing={1}>
                                {toneOptions.map(tone => (
                                    <Paper
                                        key={tone}
                                        variant="outlined"
                                        sx={{
                                            p: 2,
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            cursor: 'pointer',
                                            borderColor: selectedTone === tone ? 'primary.main' : 'divider',
                                            bgcolor: selectedTone === tone ? 'action.selected' : 'background.paper',
                                            '&:hover': { borderColor: 'primary.light' }
                                        }}
                                        onClick={() => setSelectedTone(tone)}
                                    >
                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{tone}</Typography>
                                        <Chip label="24 fragmentos" size="small" />
                                    </Paper>
                                ))}
                            </Stack>
                        </Grid>

                        <Grid size={{ xs: 12, md: 8 }}>
                            <Paper variant="outlined" sx={{ p: 4, minHeight: 400 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                                    <Avatar sx={{ bgcolor: 'primary.light' }}>
                                        <PersonIcon />
                                    </Avatar>
                                    <Box>
                                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                            Score Breakdown
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                            Usuario: {selectedUser}
                                        </Typography>
                                    </Box>
                                </Box>

                                <Divider sx={{ mb: 3 }} />

                                <Grid container spacing={3}>
                                    {sampleBreakdown.map((item) => (
                                        <Grid size={{ xs: 12, sm: 6 }} key={item.dimension}>
                                            <Paper variant="outlined" sx={{ p: 2 }}>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                                    <Typography variant="subtitle2">{item.dimension}</Typography>
                                                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: item.color }}>
                                                        {item.score}%
                                                    </Typography>
                                                </Box>
                                                <Box sx={{ height: 8, bgcolor: 'action.hover', borderRadius: 4, overflow: 'hidden' }}>
                                                    <Box sx={{ height: '100%', width: `${item.score}%`, bgcolor: item.color, borderRadius: 4 }} />
                                                </Box>
                                            </Paper>
                                        </Grid>
                                    ))}
                                </Grid>

                                <Divider sx={{ my: 3 }} />

                                <Typography variant="overline" sx={{ color: 'text.secondary', display: 'block', mb: 1 }}>
                                    Narrativa Generada
                                </Typography>
                                <Paper variant="outlined" sx={{ p: 2, bgcolor: 'action.hover', borderStyle: 'dashed' }}>
                                    <Typography variant="body1" sx={{ fontStyle: 'italic' }}>
                                        "Su conexión se basa en valores compartidos ({sampleBreakdown[0].score}%) y metas alineadas ({sampleBreakdown[1].score}%), con una perspectiva neurodiverso que añade profundidad ({sampleBreakdown[2].score}%)."
                                    </Typography>
                                </Paper>
                            </Paper>
                        </Grid>
                    </Grid>
                </Box>
            </Container>
        </AdminLayout>
    );
}
