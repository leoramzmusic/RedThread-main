import {
    Box,
    Container,
    Typography,
    Paper,
    Grid,
    Switch,
    FormControlLabel,
    TextField,
    Button,
    Alert,
    CircularProgress,
    Chip,
    IconButton,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
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
import yukiAdminService, { YukiConfig, YukiRule } from '../../../../services/yukiAdminService';

export default function YukiConfiguracion() {
    const router = useRouter();
    const [config, setConfig] = useState<YukiConfig | null>(null);
    const [rules, setRules] = useState<YukiRule[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    // Screen input
    const [newScreen, setNewScreen] = useState('');
    const [screenType, setScreenType] = useState<'allowed' | 'blocked'>('allowed');

    // Rule dialog
    const [ruleDialogOpen, setRuleDialogOpen] = useState(false);
    const [newRule, setNewRule] = useState({ condition: '', action: 'show', value: '', priority: 0 });

    useEffect(() => {
        Promise.all([yukiAdminService.getConfig(), yukiAdminService.getRules()])
            .then(([c, r]) => { setConfig(c); setRules(r); })
            .finally(() => setLoading(false));
    }, []);

    const saveConfig = async (partial: Partial<YukiConfig>) => {
        if (!config) return;
        setSaving(true);
        setError('');
        try {
            const updated = await yukiAdminService.updateConfig(partial);
            setConfig(updated);
            setSuccess('Guardado');
            setTimeout(() => setSuccess(''), 2000);
        } catch (e: any) {
            setError(e?.response?.data?.detail || 'Error al guardar');
        } finally {
            setSaving(false);
        }
    };

    const addScreen = (type: 'allowed' | 'blocked') => {
        if (!newScreen.trim() || !config) return;
        const screens = type === 'allowed' ? [...config.allowed_screens] : [...config.blocked_screens];
        if (!screens.includes(newScreen.trim())) {
            screens.push(newScreen.trim());
            saveConfig(type === 'allowed' ? { allowed_screens: screens } : { blocked_screens: screens });
        }
        setNewScreen('');
    };

    const removeScreen = (type: 'allowed' | 'blocked', screen: string) => {
        if (!config) return;
        const screens = type === 'allowed'
            ? config.allowed_screens.filter((s) => s !== screen)
            : config.blocked_screens.filter((s) => s !== screen);
        saveConfig(type === 'allowed' ? { allowed_screens: screens } : { blocked_screens: screens });
    };

    const addRule = async () => {
        if (!newRule.condition.trim()) return;
        await yukiAdminService.createRule(newRule);
        const updated = await yukiAdminService.getRules();
        setRules(updated);
        setRuleDialogOpen(false);
        setNewRule({ condition: '', action: 'show', value: '', priority: 0 });
    };

    const deleteRule = async (id: string) => {
        await yukiAdminService.deleteRule(id);
        setRules(rules.filter((r) => r.id !== id));
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
                        <IconButton onClick={() => router.push('/portal-redthread/experiencia/mascota')}>
                            <ArrowBackIcon />
                        </IconButton>
                        <Typography variant="h4" fontWeight={700}>
                            Configuración de Yuki
                        </Typography>
                    </Box>

                    {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                    {/* Environment */}
                    <Paper sx={{ p: 3, mb: 3 }}>
                        <Typography variant="h6" fontWeight={600} gutterBottom>
                            Entorno
                        </Typography>
                        <FormControl fullWidth sx={{ mt: 2 }}>
                            <InputLabel>Entorno</InputLabel>
                            <Select
                                value={config?.environment || 'production'}
                                label="Entorno"
                                onChange={(e) => saveConfig({ environment: e.target.value })}
                            >
                                <MenuItem value="local">Local</MenuItem>
                                <MenuItem value="staging">Staging</MenuItem>
                                <MenuItem value="production">Producción</MenuItem>
                            </Select>
                        </FormControl>
                    </Paper>

                    {/* Master Toggle */}
                    <Paper sx={{ p: 3, mb: 3 }}>
                        <Typography variant="h6" fontWeight={600} gutterBottom>
                            Maestro
                        </Typography>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={config?.enabled ?? true}
                                    onChange={() => saveConfig({ enabled: !(config?.enabled) })}
                                    disabled={saving}
                                    color="success"
                                />
                            }
                            label="Yuki habilitado globalmente"
                        />
                    </Paper>

                    {/* Screen Filters */}
                    <Paper sx={{ p: 3, mb: 3 }}>
                        <Typography variant="h6" fontWeight={600} gutterBottom>
                            Filtros de Pantalla
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Deja vacío para permitir todas las pantallas. Usa Allowed para mostrar solo en rutas específicas, o Blocked para excluir rutas.
                        </Typography>

                        {(['allowed', 'blocked'] as const).map((type) => (
                            <Box key={type} sx={{ mb: 2 }}>
                                <Typography variant="subtitle2" sx={{ mb: 1, textTransform: 'capitalize' }}>
                                    {type === 'allowed' ? 'Pantallas permitidas' : 'Pantallas bloqueadas'}
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                                    <TextField
                                        size="small"
                                        placeholder="/discover, /chat, ..."
                                        value={newScreen}
                                        onChange={(e) => setNewScreen(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && addScreen(type)}
                                        sx={{ flexGrow: 1 }}
                                    />
                                    <Button
                                        variant="outlined"
                                        startIcon={<AddIcon />}
                                        onClick={() => { setScreenType(type); addScreen(type); }}
                                    >
                                        Agregar
                                    </Button>
                                </Box>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                    {(type === 'allowed' ? config?.allowed_screens : config?.blocked_screens)?.map((s) => (
                                        <Chip
                                            key={s}
                                            label={s}
                                            onDelete={() => removeScreen(type, s)}
                                            color={type === 'allowed' ? 'primary' : 'error'}
                                            variant="outlined"
                                        />
                                    ))}
                                </Box>
                            </Box>
                        ))}
                    </Paper>

                    {/* Rules */}
                    <Paper sx={{ p: 3, mb: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h6" fontWeight={600}>
                                Reglas de Apariencia
                            </Typography>
                            <Button
                                variant="contained"
                                startIcon={<AddIcon />}
                                onClick={() => setRuleDialogOpen(true)}
                            >
                                Nueva Regla
                            </Button>
                        </Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Define condiciones para mostrar/ocultar Yuki o cambiar su estilo automáticamente.
                        </Typography>

                        {rules.length === 0 ? (
                            <Alert severity="info">No hay reglas configuradas</Alert>
                        ) : (
                            <List>
                                {rules.map((rule) => (
                                    <ListItem key={rule.id} sx={{ bgcolor: 'background.default', borderRadius: 1, mb: 1 }}>
                                        <ListItemText
                                            primary={
                                                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                                    <Chip label={rule.action} size="small" color="primary" />
                                                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                                                        {rule.condition}
                                                    </Typography>
                                                    {rule.value && (
                                                        <Chip label={rule.value} size="small" variant="outlined" />
                                                    )}
                                                </Box>
                                            }
                                            secondary={`Prioridad: ${rule.priority}`}
                                        />
                                        <ListItemSecondaryAction>
                                            <IconButton edge="end" onClick={() => deleteRule(rule.id)}>
                                                <DeleteIcon />
                                            </IconButton>
                                        </ListItemSecondaryAction>
                                    </ListItem>
                                ))}
                            </List>
                        )}
                    </Paper>

                    {/* Rule Dialog */}
                    <Dialog open={ruleDialogOpen} onClose={() => setRuleDialogOpen(false)} maxWidth="sm" fullWidth>
                        <DialogTitle>Nueva Regla de Apariencia</DialogTitle>
                        <DialogContent>
                            <TextField
                                fullWidth
                                label="Condición"
                                placeholder="screen == '/discover' or time between 18-22"
                                value={newRule.condition}
                                onChange={(e) => setNewRule({ ...newRule, condition: e.target.value })}
                                sx={{ mt: 2, mb: 2 }}
                            />
                            <FormControl fullWidth sx={{ mb: 2 }}>
                                <InputLabel>Acción</InputLabel>
                                <Select
                                    value={newRule.action}
                                    label="Acción"
                                    onChange={(e) => setNewRule({ ...newRule, action: e.target.value })}
                                >
                                    <MenuItem value="show">Mostrar</MenuItem>
                                    <MenuItem value="hide">Ocultar</MenuItem>
                                    <MenuItem value="use_style">Usar estilo</MenuItem>
                                    <MenuItem value="use_animation">Usar animación</MenuItem>
                                </Select>
                            </FormControl>
                            <TextField
                                fullWidth
                                label="Valor (opcional)"
                                placeholder="nombre del estilo o animación"
                                value={newRule.value}
                                onChange={(e) => setNewRule({ ...newRule, value: e.target.value })}
                                sx={{ mb: 2 }}
                            />
                            <TextField
                                fullWidth
                                type="number"
                                label="Prioridad"
                                value={newRule.priority}
                                onChange={(e) => setNewRule({ ...newRule, priority: Number(e.target.value) })}
                            />
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={() => setRuleDialogOpen(false)}>Cancelar</Button>
                            <Button onClick={addRule} variant="contained">Crear</Button>
                        </DialogActions>
                    </Dialog>
                </Box>
            </Container>
        </AdminLayout>
    );
}
