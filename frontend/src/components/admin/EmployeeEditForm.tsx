import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    Grid,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Button,
    Avatar,
    Divider,
    Alert,
    CircularProgress,
    OutlinedInput,
    Chip,
    Checkbox,
    ListItemText,
    FormControlLabel,
    Switch,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Tab,
    Tabs,
} from '@mui/material';
import {
    Save as SaveIcon,
    Person as PersonIcon,
    Business as BusinessIcon,
    Security as SecurityIcon,
    Public as PublicIcon,
    History as HistoryIcon,
    LockReset as PasswordIcon,
    ArrowBack as BackIcon,
    Email as EmailIcon,
    Phone as PhoneIcon,
    Cake as BirthIcon,
    Event as HireIcon,
    Badge as BadgeIcon,
    Place as PlaceIcon,
    ToggleOn as ToggleIcon,
    Info as InfoIcon,
    Edit as EditIcon,
    AddCircle as AddIcon,
    Delete as DeleteIcon,
    ArrowForward as ArrowRightIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/router';
import adminApiClient from '../../services/adminApi';
import { Stack, InputAdornment } from '@mui/material';
import PasswordResetModal from './PasswordResetModal';

interface Role {
    name: string;
    slug: string;
}

interface Department {
    _id: string;
    name: string;
}

interface AuditLog {
    id: string;
    admin_name: string;
    action: string;
    field: string;
    old: string;
    new: string;
    summary: string;
    date: string;
}

interface EmployeeEditFormProps {
    employeeId: string;
}

const EmployeeEditForm: React.FC<EmployeeEditFormProps> = ({ employeeId }) => {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [roles, setRoles] = useState<Role[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState(0);
    const [resetModalOpen, setResetModalOpen] = useState(false);
    const [showAllLogs, setShowAllLogs] = useState(false);

    // Form State
    const [formData, setFormData] = useState<any>({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        employee_id: '',
        department_id: '',
        roles: [],
        status: '',
        country: '',
        city: '',
        birth_date: '',
        hire_date: '',
        is_2fa_enabled: false,
        last_login_at: '',
        created_at: '',
        updated_at: '',
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [rolesRes, deptsRes, empRes, auditRes] = await Promise.all([
                    adminApiClient.get('/portal-redthread/roles/'),
                    adminApiClient.get('/portal-redthread/departments/'),
                    adminApiClient.get(`/portal-redthread/empleados/${employeeId}`),
                    adminApiClient.get(`/portal-redthread/empleados/${employeeId}/audit`),
                ]);
                setRoles(rolesRes.data);
                setDepartments(deptsRes.data);
                setFormData(empRes.data);
                setAuditLogs(auditRes.data);
            } catch (err: any) {
                console.error('Error fetching data:', err);
                setError('No se pudo cargar la información del empleado.');
            } finally {
                setLoading(false);
            }
        };
        if (employeeId) fetchData();
    }, [employeeId]);

    const handleChange = (field: string, value: any) => {
        setFormData((prev: any) => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);
        setSuccess(null);
        try {
            // Clean data for internal fields
            const { id, employee_id, hire_date, last_login_at, created_at, updated_at, ...updateData } = formData;
            await adminApiClient.put(`/portal-redthread/empleados/${employeeId}`, updateData);
            setSuccess('Empleado actualizado correctamente.');

            // Refresh audit logs
            const auditRes = await adminApiClient.get(`/portal-redthread/empleados/${employeeId}/audit`);
            setAuditLogs(auditRes.data);

            // Scroll to top to show success
            window.scrollTo(0, 0);
        } catch (err: any) {
            console.error('Error updating employee:', err);
            setError(err.response?.data?.detail || 'Error al actualizar el empleado.');
        } finally {
            setSubmitting(false);
        }
    };

    const handlePasswordReset = () => {
        setResetModalOpen(true);
    };

    const handleConfirmPasswordReset = async (newPassword: string) => {
        setSubmitting(true);
        setError(null);
        setSuccess(null);
        try {
            await adminApiClient.put(`/portal-redthread/empleados/${employeeId}`, { password: newPassword });
            setSuccess('Contraseña reseteada correctamente.');
            setResetModalOpen(false);

            const auditRes = await adminApiClient.get(`/portal-redthread/empleados/${employeeId}/audit`);
            setAuditLogs(auditRes.data);
        } catch (err: any) {
            console.error('Error resetting password:', err);
            setError(err.response?.data?.detail || 'Error al resetear la contraseña.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" p={5}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Button
                    startIcon={<BackIcon />}
                    onClick={() => router.push('/portal-redthread/empleados/listado')}
                >
                    Volver al Listado
                </Button>
            </Box>

            {success && <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>{success}</Alert>}
            {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>{error}</Alert>}

            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                <Tabs value={activeTab} onChange={(e, val) => setActiveTab(val)}>
                    <Tab icon={<PersonIcon />} label="Información General" />
                    <Tab icon={<HistoryIcon />} label="Historial de Cambios" />
                </Tabs>
            </Box>

            {activeTab === 0 && (
                <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
                    <Grid container spacing={3}>
                        {/* LEFT COLUMN: Personal & Location */}
                        <Grid item xs={12} md={7}>
                            <Stack spacing={3}>
                                {/* Personal Data Card */}
                                <Paper sx={{ p: 4, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                                    <Box display="flex" alignItems="center" gap={1.5} mb={3}>
                                        <Box sx={{ p: 1, bgcolor: 'primary.light', borderRadius: 2, display: 'flex', color: 'primary.main' }}>
                                            <PersonIcon />
                                        </Box>
                                        <Typography variant="h6" fontWeight="bold">Datos Personales</Typography>
                                    </Box>
                                    <Grid container spacing={2.5}>
                                        <Grid item xs={12} sm={6}>
                                            <TextField
                                                fullWidth
                                                label="Nombre(s)"
                                                required
                                                value={formData.first_name}
                                                onChange={(e) => handleChange('first_name', e.target.value)}
                                                InputProps={{
                                                    startAdornment: (
                                                        <InputAdornment position="start">
                                                            <PersonIcon fontSize="small" color="action" />
                                                        </InputAdornment>
                                                    ),
                                                }}
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <TextField
                                                fullWidth
                                                label="Apellidos"
                                                required
                                                value={formData.last_name}
                                                onChange={(e) => handleChange('last_name', e.target.value)}
                                                InputProps={{
                                                    startAdornment: (
                                                        <InputAdornment position="start">
                                                            <PersonIcon fontSize="small" color="action" />
                                                        </InputAdornment>
                                                    ),
                                                }}
                                            />
                                        </Grid>
                                        <Grid item xs={12}>
                                            <TextField
                                                fullWidth
                                                label="Email Corporativo"
                                                required
                                                value={formData.email}
                                                onChange={(e) => handleChange('email', e.target.value)}
                                                InputProps={{
                                                    startAdornment: (
                                                        <InputAdornment position="start">
                                                            <EmailIcon fontSize="small" color="action" />
                                                        </InputAdornment>
                                                    ),
                                                }}
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <TextField
                                                fullWidth
                                                label="Teléfono"
                                                value={formData.phone}
                                                onChange={(e) => handleChange('phone', e.target.value)}
                                                InputProps={{
                                                    startAdornment: (
                                                        <InputAdornment position="start">
                                                            <PhoneIcon fontSize="small" color="action" />
                                                        </InputAdornment>
                                                    ),
                                                }}
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <TextField
                                                fullWidth
                                                label="Fecha de Nacimiento"
                                                type="date"
                                                InputLabelProps={{ shrink: true }}
                                                value={formData.birth_date ? formData.birth_date.split('T')[0] : ''}
                                                onChange={(e) => handleChange('birth_date', e.target.value)}
                                                InputProps={{
                                                    startAdornment: (
                                                        <InputAdornment position="start">
                                                            <BirthIcon fontSize="small" color="action" />
                                                        </InputAdornment>
                                                    ),
                                                }}
                                            />
                                        </Grid>
                                    </Grid>
                                </Paper>

                                {/* Location Card */}
                                <Paper sx={{ p: 4, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                                    <Box display="flex" alignItems="center" gap={1.5} mb={3}>
                                        <Box sx={{ p: 1, bgcolor: 'secondary.light', borderRadius: 2, display: 'flex', color: 'secondary.main' }}>
                                            <PublicIcon />
                                        </Box>
                                        <Typography variant="h6" fontWeight="bold">Ubicación</Typography>
                                    </Box>
                                    <Grid container spacing={2.5}>
                                        <Grid item xs={12} sm={6}>
                                            <TextField
                                                fullWidth
                                                label="País"
                                                value={formData.country || ''}
                                                onChange={(e) => handleChange('country', e.target.value)}
                                                InputProps={{
                                                    startAdornment: (
                                                        <InputAdornment position="start">
                                                            <PlaceIcon fontSize="small" color="action" />
                                                        </InputAdornment>
                                                    ),
                                                }}
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <TextField
                                                fullWidth
                                                label="Ciudad"
                                                value={formData.city || ''}
                                                onChange={(e) => handleChange('city', e.target.value)}
                                                InputProps={{
                                                    startAdornment: (
                                                        <InputAdornment position="start">
                                                            <PlaceIcon fontSize="small" color="action" />
                                                        </InputAdornment>
                                                    ),
                                                }}
                                            />
                                        </Grid>
                                    </Grid>
                                </Paper>
                            </Stack>
                        </Grid>

                        {/* RIGHT COLUMN: Laboral & Security */}
                        <Grid item xs={12} md={5}>
                            <Stack spacing={3}>
                                {/* Organizational Data Card */}
                                <Paper sx={{ p: 4, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                                    <Box display="flex" alignItems="center" gap={1.5} mb={3}>
                                        <Box sx={{ p: 1, bgcolor: 'info.light', borderRadius: 2, display: 'flex', color: 'info.main' }}>
                                            <BusinessIcon />
                                        </Box>
                                        <Typography variant="h6" fontWeight="bold">Información Laboral</Typography>
                                    </Box>
                                    <Stack spacing={2.5}>
                                        <TextField
                                            fullWidth
                                            label="ID Interno"
                                            value={formData.employee_id}
                                            disabled
                                            InputProps={{
                                                startAdornment: (
                                                    <InputAdornment position="start">
                                                        <BadgeIcon fontSize="small" color="disabled" />
                                                    </InputAdornment>
                                                ),
                                            }}
                                            helperText="El ID interno es generado por el sistema"
                                        />

                                        <FormControl fullWidth>
                                            <InputLabel>Estado de Cuenta</InputLabel>
                                            <Select
                                                value={formData.status}
                                                label="Estado de Cuenta"
                                                onChange={(e) => handleChange('status', e.target.value)}
                                                renderValue={(selected) => (
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <Box sx={{
                                                            width: 10,
                                                            height: 10,
                                                            borderRadius: '50%',
                                                            bgcolor: selected === 'active' ? '#4caf50' : selected === 'suspended' ? '#ff9800' : '#f44336'
                                                        }} />
                                                        {selected === 'active' ? '🟢 Activo' : selected === 'suspended' ? '🟡 Suspendido' : '🔴 Inactivo'}
                                                    </Box>
                                                )}
                                            >
                                                <MenuItem value="active">🟢 Activo</MenuItem>
                                                <MenuItem value="suspended">🟡 Suspendido</MenuItem>
                                                <MenuItem value="inactive">🔴 Inactivo</MenuItem>
                                            </Select>
                                        </FormControl>

                                        <FormControl fullWidth>
                                            <InputLabel>Departamento</InputLabel>
                                            <Select
                                                value={formData.department_id || ''}
                                                label="Departamento"
                                                onChange={(e) => handleChange('department_id', e.target.value)}
                                                startAdornment={
                                                    <InputAdornment position="start" sx={{ ml: 1, mr: -0.5 }}>
                                                        <BusinessIcon fontSize="small" color="action" />
                                                    </InputAdornment>
                                                }
                                            >
                                                <MenuItem value=""><em>Sin asignar</em></MenuItem>
                                                {departments.map((dept) => (
                                                    <MenuItem key={dept._id} value={dept._id}>{dept.name}</MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>

                                        <FormControl fullWidth>
                                            <InputLabel id="roles-label">Roles Asignados</InputLabel>
                                            <Select
                                                labelId="roles-label"
                                                multiple
                                                value={formData.roles || []}
                                                onChange={(e) => handleChange('roles', typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
                                                input={<OutlinedInput label="Roles Asignados" />}
                                                startAdornment={
                                                    <InputAdornment position="start" sx={{ ml: 1, mr: -0.5 }}>
                                                        <SecurityIcon fontSize="small" color="action" />
                                                    </InputAdornment>
                                                }
                                                renderValue={(selected) => (
                                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                        {(selected as string[]).map((value) => (
                                                            <Chip
                                                                key={value}
                                                                label={value}
                                                                size="small"
                                                                color="primary"
                                                                variant="outlined"
                                                                sx={{ fontWeight: 'medium' }}
                                                            />
                                                        ))}
                                                    </Box>
                                                )}
                                            >
                                                {roles.map((role) => (
                                                    <MenuItem key={role.slug} value={role.slug}>
                                                        <Checkbox checked={(formData.roles || []).indexOf(role.slug) > -1} />
                                                        <ListItemText primary={role.name} />
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>

                                        <TextField
                                            fullWidth
                                            label="Fecha de Ingreso"
                                            value={formData.hire_date ? new Date(formData.hire_date).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' }) : ''}
                                            disabled
                                            InputProps={{
                                                startAdornment: (
                                                    <InputAdornment position="start">
                                                        <HireIcon fontSize="small" color="disabled" />
                                                    </InputAdornment>
                                                ),
                                            }}
                                        />
                                    </Stack>
                                </Paper>

                                {/* Security & Meta Card */}
                                <Paper sx={{ p: 4, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                                    <Box display="flex" alignItems="center" gap={1.5} mb={3}>
                                        <Box sx={{ p: 1, bgcolor: 'warning.light', borderRadius: 2, display: 'flex', color: 'warning.main' }}>
                                            <SecurityIcon />
                                        </Box>
                                        <Typography variant="h6" fontWeight="bold">Seguridad y Acceso</Typography>
                                    </Box>
                                    <Stack spacing={2}>
                                        <Box p={2} border="1px solid rgba(0,0,0,0.08)" borderRadius={2} display="flex" justifyContent="space-between" alignItems="center">
                                            <Box>
                                                <Typography variant="subtitle2" fontWeight="bold">Autenticación 2FA</Typography>
                                                <Typography variant="caption" color="text.secondary">Protección adicional de cuenta</Typography>
                                            </Box>
                                            <Switch
                                                checked={formData.is_2fa_enabled}
                                                onChange={(e) => handleChange('is_2fa_enabled', e.target.checked)}
                                                color="primary"
                                            />
                                        </Box>

                                        <Button
                                            fullWidth
                                            variant="contained"
                                            color="inherit"
                                            startIcon={<PasswordIcon />}
                                            onClick={handlePasswordReset}
                                            sx={{ py: 1.2, bgcolor: 'action.hover', color: 'text.primary', '&:hover': { bgcolor: 'action.selected' } }}
                                        >
                                            Resetear Contraseña 🔁
                                        </Button>

                                        <Divider sx={{ my: 1 }} />

                                        <Box p={2} bgcolor="rgba(0,0,0,0.02)" borderRadius={2}>
                                            <Stack spacing={1}>
                                                <Box display="flex" justifyContent="space-between">
                                                    <Typography variant="caption" color="text.secondary">Último acceso:</Typography>
                                                    <Typography variant="caption" fontWeight="medium">{formData.last_login_at ? new Date(formData.last_login_at).toLocaleString('es-ES') : 'Nunca'}</Typography>
                                                </Box>
                                                <Box display="flex" justifyContent="space-between">
                                                    <Typography variant="caption" color="text.secondary">Registro sistema:</Typography>
                                                    <Typography variant="caption" fontWeight="medium">{new Date(formData.created_at).toLocaleString('es-ES')}</Typography>
                                                </Box>
                                            </Stack>
                                        </Box>
                                    </Stack>
                                </Paper>
                            </Stack>
                        </Grid>

                        {/* FLOATING ACTION BAR FOR SAVE/CANCEL */}
                        <Box sx={{
                            position: 'fixed',
                            bottom: 24,
                            right: 48,
                            left: { xs: 48, md: 300 }, // Adjust for sidebar
                            zIndex: 1000,
                            display: 'flex',
                            justifyContent: 'center'
                        }}>
                            <Paper sx={{
                                p: 1.5,
                                px: 3,
                                borderRadius: 50,
                                boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
                                bgcolor: 'background.paper',
                                border: '1px solid rgba(0,0,0,0.05)',
                                display: 'flex',
                                gap: 2,
                                alignItems: 'center'
                            }}>
                                <Typography variant="body2" sx={{ mr: 2, color: 'text.secondary', display: { xs: 'none', sm: 'block' } }}>
                                    ¿Has terminado de editar?
                                </Typography>
                                <Button
                                    variant="text"
                                    color="inherit"
                                    onClick={() => router.push('/portal-redthread/empleados/listado')}
                                    disabled={submitting}
                                    sx={{ borderRadius: 50, px: 3 }}
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    type="submit"
                                    variant="contained"
                                    startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                                    disabled={submitting}
                                    sx={{
                                        borderRadius: 50,
                                        px: 4,
                                        py: 1.2,
                                        boxShadow: '0 4px 14px rgba(0,0,0,0.2)',
                                        '&:hover': { boxShadow: '0 6px 20px rgba(0,0,0,0.25)' }
                                    }}
                                >
                                    Guardar Cambios
                                </Button>
                            </Paper>
                        </Box>
                    </Grid>
                </Box>
            )}

            {activeTab === 1 && (
                <Stack spacing={3} sx={{ mt: 2 }}>
                    <Paper sx={{ p: 4, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                        <Box display="flex" alignItems="center" gap={1.5} mb={3}>
                            <Box sx={{ p: 1, bgcolor: 'primary.light', borderRadius: 2, display: 'flex', color: 'primary.main' }}>
                                <HistoryIcon />
                            </Box>
                            <Box>
                                <Typography variant="h6" fontWeight="bold">Historial de Auditoría</Typography>
                                <Typography variant="caption" color="text.secondary">Registro completo de modificaciones realizadas a este perfil</Typography>
                            </Box>
                        </Box>

                        <TableContainer sx={{ borderRadius: 2, border: '1px solid rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                            <Table>
                                <TableHead sx={{ bgcolor: '#1a1a1a' }}> {/* Dark background for contrast */}
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Fecha y Hora</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Administrador</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Acción</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Campo</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Cambio (Previo → Nuevo)</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {auditLogs.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                                                <InfoIcon sx={{ fontSize: 48, color: 'action.disabled', mb: 1 }} />
                                                <Typography variant="body2" color="text.secondary">No hay registros de auditoría para este empleado.</Typography>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        (showAllLogs ? auditLogs : auditLogs.slice(0, 5)).map((log) => (
                                            <TableRow key={log.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                                <TableCell sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>
                                                    {new Date(log.date).toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' })}
                                                </TableCell>
                                                <TableCell>
                                                    <Box display="flex" alignItems="center" gap={1}>
                                                        <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem', bgcolor: 'primary.main' }}>{log.admin_name[0]}</Avatar>
                                                        <Typography variant="body2" fontWeight="medium">{log.admin_name}</Typography>
                                                    </Box>
                                                </TableCell>
                                                <TableCell sx={{ bgcolor: 'rgba(255, 152, 0, 0.05)' }}> {/* Pale Orange Tint */}
                                                    <Chip
                                                        icon={log.action === 'create' ? <AddIcon sx={{ fontSize: '1rem !important' }} /> : log.action === 'delete' ? <DeleteIcon sx={{ fontSize: '1rem !important' }} /> : <EditIcon sx={{ fontSize: '1rem !important' }} />}
                                                        label={log.action.toUpperCase()}
                                                        size="small"
                                                        color={log.action === 'update' ? 'info' : log.action === 'create' ? 'success' : 'error'}
                                                        variant="outlined"
                                                        sx={{ fontSize: '0.7rem', fontWeight: 'bold', height: 24 }}
                                                    />
                                                </TableCell>
                                                <TableCell sx={{ bgcolor: 'rgba(33, 150, 243, 0.05)' }}> {/* Pale Blue Tint */}
                                                    <Box sx={{
                                                        display: 'inline-block',
                                                        fontFamily: 'monospace',
                                                        fontSize: '0.75rem',
                                                        bgcolor: 'primary.light',
                                                        color: 'primary.dark',
                                                        px: 1,
                                                        py: 0.5,
                                                        borderRadius: 1,
                                                        border: '1px solid',
                                                        borderColor: 'primary.main',
                                                        opacity: 0.8
                                                    }}>
                                                        {log.field || '-'}
                                                    </Box>
                                                </TableCell>
                                                <TableCell sx={{ bgcolor: 'rgba(76, 175, 80, 0.05)' }}> {/* Pale Green Tint */}
                                                    <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                                                        <Typography variant="caption" sx={{
                                                            color: 'error.main',
                                                            bgcolor: 'error.light',
                                                            px: 0.5,
                                                            borderRadius: 0.5,
                                                            textDecoration: 'line-through',
                                                            opacity: 0.8
                                                        }}>
                                                            {log.old !== null && log.old !== undefined ? String(log.old) : 'null'}
                                                        </Typography>

                                                        <ArrowRightIcon fontSize="small" color="action" sx={{ opacity: 0.5, fontSize: '1rem' }} />

                                                        <Typography variant="caption" sx={{
                                                            color: 'success.dark',
                                                            bgcolor: '#e8f5e9',
                                                            px: 0.8,
                                                            py: 0.2,
                                                            borderRadius: 1,
                                                            fontWeight: 'bold',
                                                            border: '1px solid',
                                                            borderColor: 'success.light'
                                                        }}>
                                                            {log.new !== null && log.new !== undefined ? String(log.new) : 'null'}
                                                        </Typography>
                                                    </Box>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                            {auditLogs.length > 5 && (
                                <Box p={2} display="flex" justifyContent="center" bgcolor="rgba(0,0,0,0.01)" borderTop="1px solid rgba(0,0,0,0.05)">
                                    <Button
                                        size="small"
                                        onClick={() => setShowAllLogs(!showAllLogs)}
                                        endIcon={showAllLogs ? null : <HistoryIcon fontSize="small" />}
                                    >
                                        {showAllLogs ? 'Ver menos' : `Ver todo el historial (${auditLogs.length})`}
                                    </Button>
                                </Box>
                            )}
                        </TableContainer>
                    </Paper>
                    <Box py={10} /> {/* Spacer for floating bar */}
                </Stack>
            )}

            <PasswordResetModal
                open={resetModalOpen}
                onClose={() => setResetModalOpen(false)}
                onConfirm={handleConfirmPasswordReset}
                submitting={submitting}
            />
        </Box>
    );
};

export default EmployeeEditForm;
