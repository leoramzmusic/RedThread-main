import {
    Box,
    Container,
    Typography,
    Paper,
    Grid,
    Switch,
    FormControlLabel,
    Chip,
    Button,
} from '@mui/material';
import AdminLayout from '../../../components/layout/AdminLayout';
import MenuIcon from '@mui/icons-material/Menu';

export default function MenusExperienciaPage() {
    const modulos = [
        { id: 'descubrir', label: 'Descubrir', status: 'Activo', version: '1.2.0' },
        { id: 'mensajes', label: 'Mensajes', status: 'Activo', version: '1.1.5' },
        { id: 'perfil', label: 'Perfil Creativo', status: 'Beta', version: '0.9.0' },
        { id: 'eventos', label: 'Eventos', status: 'En desarrollo', version: '0.5.0' },
    ];

    return (
        <AdminLayout>
            <Container maxWidth="xl">
                <Box sx={{ py: 4 }}>
                    <Box display="flex" alignItems="center" mb={4}>
                        <MenuIcon sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
                        <Typography variant="h4" fontWeight={700}>
                            Gestión de Menús del Portal
                        </Typography>
                    </Box>

                    <Paper sx={{ p: 3, mb: 4 }}>
                        <Typography variant="h6" gutterBottom>
                            Control de Visibilidad de Módulos
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                            Activa o desactiva módulos para los usuarios finales y gestiona su estado de despliegue.
                        </Typography>

                        <Grid container spacing={3}>
                            {modulos.map((modulo) => (
                                <Grid item xs={12} md={6} lg={4} key={modulo.id}>
                                    <Paper variant="outlined" sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
                                        <Box display="flex" justifyContent="space-between" alignItems="center">
                                            <Typography variant="subtitle1" fontWeight={600}>
                                                {modulo.label}
                                            </Typography>
                                            <Chip
                                                label={modulo.status}
                                                size="small"
                                                color={modulo.status === 'Activo' ? 'success' : modulo.status === 'Beta' ? 'warning' : 'default'}
                                            />
                                        </Box>
                                        <Typography variant="caption" color="text.secondary">
                                            Versión: {modulo.version}
                                        </Typography>
                                        <Box display="flex" justifyContent="space-between" alignItems="center" mt={2}>
                                            <FormControlLabel
                                                control={<Switch defaultChecked={modulo.status === 'Activo'} />}
                                                label="Visible"
                                            />
                                            <Button size="small">Configurar Reglas</Button>
                                        </Box>
                                    </Paper>
                                </Grid>
                            ))}
                        </Grid>
                    </Paper>

                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Preview Contextual
                        </Typography>
                        <Box sx={{ bgcolor: 'action.hover', p: 4, borderRadius: 2, textAlign: 'center', border: '1px dashed grey' }}>
                            <Typography color="text.secondary">
                                Simulación del Sidebar del Usuario (Próximamente)
                            </Typography>
                        </Box>
                    </Paper>
                </Box>
            </Container>
        </AdminLayout>
    );
}
