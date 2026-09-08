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
} from '@mui/material';
import {
    Save as SaveIcon,
    Person as PersonIcon,
    Business as BusinessIcon,
    Security as SecurityIcon,
    Public as PublicIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/router';
import adminApiClient from '../../services/adminApi';

interface Role {
    name: string;
    slug: string;
}

interface Department {
    _id: string;
    name: string;
}

const EmployeeForm: React.FC = () => {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [roles, setRoles] = useState<Role[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        password: '',
        employee_id: '',
        department_id: '',
        roles: [] as string[],
        country: '',
        city: '',
        birth_date: '',
        hire_date: new Date().toISOString().split('T')[0],
        is_2fa_enabled: false,
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [rolesRes, deptsRes] = await Promise.all([
                    adminApiClient.get('/portal-redthread/roles/'),
                    adminApiClient.get('/portal-redthread/departments/'),
                ]);
                setRoles(rolesRes.data);
                setDepartments(deptsRes.data);
            } catch (err) {
                console.error('Error fetching org data:', err);
                setError('No se pudo cargar la información de roles y departamentos.');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleChange = (field: string, value: any) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);
        try {
            await adminApiClient.post('/portal-redthread/auth/register', formData);
            setSuccess(true);
            setTimeout(() => router.push('/portal-redthread/empleados/listado'), 2000);
        } catch (err: any) {
            console.error('Error registering employee:', err);
            setError(err.response?.data?.detail || 'Error al registrar el empleado.');
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
        <Box component="form" onSubmit={handleSubmit}>
            {success && (
                <Alert severity="success" sx={{ mb: 3 }}>
                    Empleado registrado exitosamente. Redirigiendo...
                </Alert>
            )}
            {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

            <Grid container spacing={3}>
                {/* Section 1: Personal Info */}
                <Grid item xs={12} md={8}>
                    <Paper sx={{ p: 3, borderRadius: 2 }}>
                        <Box display="flex" alignItems="center" mb={2}>
                            <PersonIcon sx={{ mr: 1, color: 'primary.main' }} />
                            <Typography variant="h6">Información Personal</Typography>
                        </Box>
                        <Divider sx={{ mb: 3 }} />
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Nombre(s)"
                                    required
                                    value={formData.first_name}
                                    onChange={(e) => handleChange('first_name', e.target.value)}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Apellidos"
                                    required
                                    value={formData.last_name}
                                    onChange={(e) => handleChange('last_name', e.target.value)}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Email Corporativo"
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={(e) => handleChange('email', e.target.value)}
                                    placeholder="ejemplo@redthread.com"
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Teléfono"
                                    value={formData.phone}
                                    onChange={(e) => handleChange('phone', e.target.value)}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Fecha de Nacimiento"
                                    type="date"
                                    InputLabelProps={{ shrink: true }}
                                    value={formData.birth_date}
                                    onChange={(e) => handleChange('birth_date', e.target.value)}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Contraseña Inicial"
                                    type="password"
                                    required
                                    value={formData.password}
                                    onChange={(e) => handleChange('password', e.target.value)}
                                />
                            </Grid>
                        </Grid>
                    </Paper>
                </Grid>

                {/* Avatar/Status Column */}
                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 3, borderRadius: 2, textAlign: 'center', height: '100%' }}>
                        <Avatar
                            sx={{
                                width: 100,
                                height: 100,
                                mx: 'auto',
                                mb: 2,
                                bgcolor: 'primary.light',
                                fontSize: '2rem',
                            }}
                        >
                            {formData.first_name ? formData.first_name[0] : <PersonIcon fontSize="large" />}
                        </Avatar>
                        <Typography variant="subtitle1" fontWeight="bold">
                            {formData.first_name} {formData.last_name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                            {formData.email || 'correo@ejemplo.com'}
                        </Typography>
                        <Box mt={4} textAlign="left">
                            <Box display="flex" alignItems="center" mb={1}>
                                <SecurityIcon sx={{ mr: 1, fontSize: 18, color: 'text.secondary' }} />
                                <Typography variant="subtitle2">Seguridad</Typography>
                            </Box>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={formData.is_2fa_enabled}
                                        onChange={(e) => handleChange('is_2fa_enabled', e.target.checked)}
                                    />
                                }
                                label="Habilitar 2FA"
                            />
                            <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 1 }}>
                                El empleado deberá configurar la autenticación de dos factores en su primer inicio de sesión.
                            </Typography>
                        </Box>
                    </Paper>
                </Grid>

                {/* Section 2: Organizational Data */}
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3, borderRadius: 2 }}>
                        <Box display="flex" alignItems="center" mb={2}>
                            <BusinessIcon sx={{ mr: 1, color: 'primary.main' }} />
                            <Typography variant="h6">Datos Organizacionales</Typography>
                        </Box>
                        <Divider sx={{ mb: 3 }} />
                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="ID de Empleado / Código Interno"
                                    required
                                    value={formData.employee_id}
                                    onChange={(e) => handleChange('employee_id', e.target.value)}
                                    placeholder="Ej: RT-2025-001"
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <FormControl fullWidth required>
                                    <InputLabel>Departamento</InputLabel>
                                    <Select
                                        value={formData.department_id}
                                        label="Departamento"
                                        onChange={(e) => handleChange('department_id', e.target.value)}
                                    >
                                        {departments.map((dept) => (
                                            <MenuItem key={dept._id} value={dept._id}>
                                                {dept.name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Fecha de Ingreso"
                                    type="date"
                                    required
                                    InputLabelProps={{ shrink: true }}
                                    value={formData.hire_date}
                                    onChange={(e) => handleChange('hire_date', e.target.value)}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <FormControl fullWidth required>
                                    <InputLabel id="roles-label">Roles Asignados</InputLabel>
                                    <Select
                                        labelId="roles-label"
                                        multiple
                                        value={formData.roles}
                                        onChange={(e) => handleChange('roles', typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
                                        input={<OutlinedInput label="Roles Asignados" />}
                                        renderValue={(selected) => (
                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                {(selected as string[]).map((value) => (
                                                    <Chip key={value} label={value} size="small" />
                                                ))}
                                            </Box>
                                        )}
                                    >
                                        {roles.map((role) => (
                                            <MenuItem key={role.slug} value={role.slug}>
                                                <Checkbox checked={formData.roles.indexOf(role.slug) > -1} />
                                                <ListItemText primary={role.name} secondary={role.slug} />
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                        </Grid>
                    </Paper>
                </Grid>

                {/* Section 3: Location Data */}
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3, borderRadius: 2 }}>
                        <Box display="flex" alignItems="center" mb={2}>
                            <PublicIcon sx={{ mr: 1, color: 'primary.main' }} />
                            <Typography variant="h6">Ubicación</Typography>
                        </Box>
                        <Divider sx={{ mb: 3 }} />
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="País"
                                    value={formData.country}
                                    onChange={(e) => handleChange('country', e.target.value)}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Ciudad"
                                    value={formData.city}
                                    onChange={(e) => handleChange('city', e.target.value)}
                                />
                            </Grid>
                        </Grid>
                    </Paper>
                </Grid>

                {/* Form Actions */}
                <Grid item xs={12}>
                    <Box display="flex" justifyContent="flex-end" gap={2}>
                        <Button
                            variant="outlined"
                            onClick={() => router.push('/portal-redthread/empleados/listado')}
                            disabled={submitting}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            variant="contained"
                            size="large"
                            startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                            disabled={submitting}
                            sx={{ minWidth: 150 }}
                        >
                            Registrar Empleado
                        </Button>
                    </Box>
                </Grid>
            </Grid>
        </Box>
    );
};

export default EmployeeForm;
