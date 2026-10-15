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
    IconButton,
    Tooltip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Avatar,
} from '@mui/material';
import AdminLayout from '../../../components/layout/AdminLayout';
import HistoryIcon from '@mui/icons-material/History';
import ReplayIcon from '@mui/icons-material/Replay';
import PersonIcon from '@mui/icons-material/Person';
import PsychologyIcon from '@mui/icons-material/Psychology';
import FunctionsIcon from '@mui/icons-material/Functions';
import BarChartIcon from '@mui/icons-material/BarChart';
import ScienceIcon from '@mui/icons-material/Science';

const auditLog = [
    {
        id: 'log_001',
        timestamp: '2026-10-14 15:32',
        admin: 'admin@redthread.com',
        action: 'weights_updated',
        module: 'criteria',
        details: 'Pesos de Compatibility actualizados: Engagement 10% → 12%',
        icon: <BarChartIcon />,
    },
    {
        id: 'log_002',
        timestamp: '2026-10-14 11:20',
        admin: 'admin@redthread.com',
        action: 'formula_modified',
        module: 'equation',
        details: 'Factor Caos ajustado de 5% a 8%',
        icon: <FunctionsIcon />,
    },
    {
        id: 'log_003',
        timestamp: '2026-10-13 16:45',
        admin: 'supervisor@redthread.com',
        action: 'experiment_created',
        module: 'lab',
        details: 'Nuevo experimento: Neurodiversidad Boost',
        icon: <ScienceIcon />,
    },
    {
        id: 'log_004',
        timestamp: '2026-10-13 09:12',
        admin: 'admin@redthread.com',
        action: 'rollback_executed',
        module: 'equation',
        details: 'Rollback a fórmula v2.0 aplicado',
        icon: <ReplayIcon color="warning" />,
    },
    {
        id: 'log_005',
        timestamp: '2026-10-12 14:00',
        admin: 'supervisor@redthread.com',
        action: 'interpreter_config',
        module: 'interpreter',
        details: 'Tono narrativo predeterminado cambiado a "Poético"',
        icon: <PsychologyIcon />,
    },
];

export default function CareAuditPage() {
    const [confirmRollback, setConfirmRollback] = useState<string | null>(null);

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
                                <HistoryIcon sx={{ fontSize: 32, color: 'white' }} />
                            </Box>
                            <Box>
                                <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: '-0.5px' }}>
                                    Historial & Auditoría
                                </Typography>
                                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                                    Registro de cambios, rollback y trazabilidad de admins.
                                </Typography>
                            </Box>
                        </Box>
                    </Box>

                    <Grid container spacing={4}>
                        <Grid size={{ xs: 12, md: 8 }}>
                            <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>
                                Registro de Cambios
                            </Typography>
                            <Paper variant="outlined">
                                <List>
                                    {auditLog.map((log, index) => (
                                        <ListItem
                                            key={log.id}
                                            divider={index < auditLog.length - 1}
                                            secondaryAction={
                                                <Tooltip title="Revertir a este punto">
                                                    <IconButton size="small" onClick={() => setConfirmRollback(log.id)}>
                                                        <ReplayIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            }
                                        >
                                            <ListItemIcon>
                                                <Avatar sx={{ bgcolor: 'action.hover', width: 36, height: 36 }}>
                                                    {log.icon}
                                                </Avatar>
                                            </ListItemIcon>
                                            <ListItemText
                                                primary={
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                                                            {log.details}
                                                        </Typography>
                                                        <Chip
                                                            label={log.module}
                                                            size="small"
                                                            variant="outlined"
                                                            sx={{ fontSize: '0.6rem', fontWeight: 700 }}
                                                        />
                                                    </Box>
                                                }
                                                secondary={
                                                    <Stack direction="row" spacing={2} sx={{ mt: 0.5 }}>
                                                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                            {log.timestamp}
                                                        </Typography>
                                                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                            <PersonIcon sx={{ fontSize: 12 }} /> {log.admin}
                                                        </Typography>
                                                    </Stack>
                                                }
                                            />
                                        </ListItem>
                                    ))}
                                </List>
                            </Paper>
                        </Grid>

                        <Grid size={{ xs: 12, md: 4 }}>
                            <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>
                                Resumen de Auditoría
                            </Typography>
                            <Paper variant="outlined" sx={{ p: 3 }}>
                                <Stack spacing={3}>
                                    <Box>
                                        <Typography variant="overline" sx={{ color: 'text.secondary' }}>Cambios esta semana</Typography>
                                        <Typography variant="h3" sx={{ fontWeight: 800 }}>{auditLog.length}</Typography>
                                    </Box>
                                    <Divider />
                                    <Box>
                                        <Typography variant="overline" sx={{ color: 'text.secondary' }}>Admins activos</Typography>
                                        <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                                            <Chip label="admin@redthread.com" size="small" variant="outlined" />
                                            <Chip label="supervisor@redthread.com" size="small" variant="outlined" />
                                        </Stack>
                                    </Box>
                                    <Divider />
                                    <Box>
                                        <Typography variant="overline" sx={{ color: 'text.secondary' }}>Último rollback</Typography>
                                        <Typography variant="body2" sx={{ mt: 0.5, fontWeight: 600 }}>
                                            2026-10-13 09:12
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                            Fórmula v2.0 restaurada
                                        </Typography>
                                    </Box>
                                </Stack>
                            </Paper>
                        </Grid>
                    </Grid>
                </Box>
            </Container>

            <Dialog open={confirmRollback !== null} onClose={() => setConfirmRollback(null)}>
                <DialogTitle>Confirmar Rollback</DialogTitle>
                <DialogContent>
                    <Typography>
                        ¿Estás seguro de que deseas revertir el estado del motor CARE a este punto?
                        Esta acción quedará registrada en la auditoría.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfirmRollback(null)}>Cancelar</Button>
                    <Button variant="contained" color="warning" onClick={() => setConfirmRollback(null)}>
                        Confirmar Rollback
                    </Button>
                </DialogActions>
            </Dialog>
        </AdminLayout>
    );
}
