import { useState, useEffect } from 'react';
import {
    Container,
    Typography,
    Box,
    Paper,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    IconButton,
    Switch,
    Divider,
    Chip,
    Alert,
    FormControlLabel,
} from '@mui/material';
import { Delete as DeleteIcon, Settings as SettingsIcon } from '@mui/icons-material';
import AdminLayout from '../../../components/layout/AdminLayout';
import adminApiClient from '../../../services/adminApi';
import ModerationRuleForm from '../../../components/admin/reports/ModerationRuleForm';

export default function ConfigReports() {
    const [rules, setRules] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchRules = async () => {
        try {
            setLoading(true);
            const response = await adminApiClient.get('/portal-redthread/denuncias/configuracion/reglas');
            setRules(response.data);
        } catch (error) {
            console.error('Error fetching rules:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRules();
    }, []);

    const handleCreateRule = async (ruleData: any) => {
        try {
            await adminApiClient.post('/portal-redthread/denuncias/configuracion/reglas', ruleData);
            fetchRules();
        } catch (error) {
            console.error('Error creating rule:', error);
            alert('Error al crear la regla');
        }
    };

    const handleDeleteRule = async (id: string) => {
        if (!confirm('¿Seguro que deseas eliminar esta regla?')) return;
        try {
            await adminApiClient.delete(`/portal-redthread/denuncias/configuracion/reglas/${id}`);
            fetchRules();
        } catch (error) {
            console.error('Error deleting rule:', error);
        }
    };

    return (
        <AdminLayout>
            <Container maxWidth="xl">
                <Box py={4}>
                    <Typography variant="h4" fontWeight={800} gutterBottom>Configuración de Moderación</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                        Configura reglas de automatización para mantener la comunidad segura sin intervención manual constante.
                    </Typography>

                    <ModerationRuleForm onSubmit={handleCreateRule} loading={loading} />

                    <Typography variant="h6" fontWeight={700} sx={{ mt: 4, mb: 2 }}>Reglas Activas</Typography>
                    <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
                        <List>
                            {rules.map((rule: any, index: number) => (
                                <Box key={rule.id || index}>
                                    <ListItem>
                                        <ListItemText
                                            primary={<Typography fontWeight={600}>{rule.name}</Typography>}
                                            secondary={
                                                <Box display="flex" gap={1} mt={0.5}>
                                                    <Chip label={`Si denuncias >= ${rule.threshold}`} size="small" variant="outlined" />
                                                    <Chip label={`Acción: ${rule.action}`} size="small" color="primary" />
                                                    {rule.category_filter && <Chip label={`Categoría: ${rule.category_filter}`} size="small" />}
                                                </Box>
                                            }
                                        />
                                        <ListItemSecondaryAction>
                                            <FormControlLabel
                                                control={<Switch checked={rule.is_active} size="small" />}
                                                label="Activa"
                                                sx={{ mr: 2 }}
                                            />
                                            <IconButton edge="end" color="error" onClick={() => handleDeleteRule(rule.id)}>
                                                <DeleteIcon />
                                            </IconButton>
                                        </ListItemSecondaryAction>
                                    </ListItem>
                                    {index < rules.length - 1 && <Divider />}
                                </Box>
                            ))}
                            {rules.length === 0 && !loading && (
                                <ListItem>
                                    <ListItemText primary="No hay reglas configuradas" sx={{ textAlign: 'center', py: 2 }} />
                                </ListItem>
                            )}
                        </List>
                    </Paper>

                    <Alert severity="info" sx={{ mt: 4 }}>
                        Las reglas de auto-moderación se evaluan cada vez que se recibe una nueva denuncia.
                        Las acciones como "Suspender Cuenta" son inmediatas y envían una notificación al usuario.
                    </Alert>
                </Box>
            </Container>
        </AdminLayout>
    );
}
