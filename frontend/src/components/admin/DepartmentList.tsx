import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    IconButton,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Alert,
    CircularProgress,
    Tooltip,
    Avatar,
    Stack,
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Business as BusinessIcon,
    Person as PersonIcon,
    LocationOn as LocationIcon,
} from '@mui/icons-material';
import adminApiClient from '../../services/adminApi';

interface Employee {
    _id: string;
    id?: string;
    first_name: string;
    last_name: string;
    email: string;
    avatar?: string;
}

interface Department {
    _id?: string;
    id?: string;
    name: string;
    code: string;
    description: string;
    status: 'active' | 'inactive';
    head_id: string | null;
    location: string;
    contact_email: string;
    contact_phone: string;
    max_employees: number | null;
    created_at: string;
}

const DepartmentList: React.FC = () => {
    const [departments, setDepartments] = useState<Department[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Form State
    const [openForm, setOpenForm] = useState(false);
    const [editingDept, setEditingDept] = useState<Department | null>(null);
    const [formData, setFormData] = useState<Partial<Department>>({
        name: '',
        code: '',
        description: '',
        status: 'active',
        head_id: '',
        location: '',
        contact_email: '',
        contact_phone: '',
        max_employees: 0,
    });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [deptsRes, empsRes] = await Promise.all([
                adminApiClient.get('/portal-redthread/departments/'),
                adminApiClient.get('/portal-redthread/empleados/listado?page=1&per_page=100'),
            ]);
            setDepartments(deptsRes.data);
            setEmployees(empsRes.data.employees || []);
            setError(null);
        } catch (err: any) {
            console.error('Error fetching departments:', err);
            setError('No se pudieron cargar los departamentos.');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenForm = (dept?: Department) => {
        if (dept) {
            setEditingDept(dept);
            setFormData({
                name: dept.name,
                code: dept.code,
                description: dept.description,
                status: dept.status,
                head_id: dept.head_id || '',
                location: dept.location,
                contact_email: dept.contact_email,
                contact_phone: dept.contact_phone,
                max_employees: dept.max_employees || 0,
            });
        } else {
            setEditingDept(null);
            setFormData({
                name: '',
                code: '',
                description: '',
                status: 'active',
                head_id: '',
                location: '',
                contact_email: '',
                contact_phone: '',
                max_employees: 0,
            });
        }
        setOpenForm(true);
    };

    const handleCloseForm = () => {
        setOpenForm(false);
        setEditingDept(null);
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            if (editingDept) {
                const id = editingDept.id || editingDept._id;
                await adminApiClient.put(`/portal-redthread/departments/${id}`, formData);
            } else {
                await adminApiClient.post('/portal-redthread/departments/', formData);
            }
            fetchData();
            handleCloseForm();
        } catch (err: any) {
            console.error('Error saving department:', err);
            setError('Error al guardar el departamento. El código debe ser único.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (dept: Department) => {
        if (!window.confirm(`¿Está seguro de eliminar el departamento "${dept.name}"?`)) return;

        try {
            const id = dept.id || dept._id;
            await adminApiClient.delete(`/portal-redthread/departments/${id}`);
            fetchData();
        } catch (err: any) {
            console.error('Error deleting department:', err);
            alert(err.response?.data?.detail || 'No se pudo eliminar el departamento. Verifique que no tenga empleados asignados.');
        }
    };

    const getHeadName = (headId: string | null) => {
        if (!headId) return 'No asignado';
        const head = employees.find(e => (e.id || e._id) === headId);
        return head ? `${head.first_name} ${head.last_name}` : 'Cargando...';
    };

    if (loading && departments.length === 0) {
        return (
            <Box display="flex" justifyContent="center" p={5}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h5" fontWeight="bold">
                    Departamentos y Estructura
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => handleOpenForm()}
                    sx={{ borderRadius: 2 }}
                >
                    Nuevo Departamento
                </Button>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                <Table>
                    <TableHead sx={{ bgcolor: 'rgba(0,0,0,0.02)' }}>
                        <TableRow>
                            <TableCell>Departamento</TableCell>
                            <TableCell>Código</TableCell>
                            <TableCell>Responsable</TableCell>
                            <TableCell>Ubicación</TableCell>
                            <TableCell>Estado</TableCell>
                            <TableCell align="right">Acciones</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {departments.map((dept) => (
                            <TableRow key={dept.code} hover>
                                <TableCell>
                                    <Box display="flex" alignItems="center">
                                        <BusinessIcon sx={{ mr: 1, color: 'text.secondary' }} />
                                        <Box>
                                            <Typography variant="body2" fontWeight="medium">
                                                {dept.name}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {dept.description}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </TableCell>
                                <TableCell>
                                    <Chip label={dept.code} size="small" sx={{ fontWeight: 'bold' }} />
                                </TableCell>
                                <TableCell>
                                    {dept.head_id ? (
                                        <Stack direction="row" spacing={1} alignItems="center">
                                            <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem' }}>
                                                {getHeadName(dept.head_id).charAt(0)}
                                            </Avatar>
                                            <Typography variant="body2">
                                                {getHeadName(dept.head_id)}
                                            </Typography>
                                        </Stack>
                                    ) : (
                                        <Typography variant="body2" color="text.disabled">No asignado</Typography>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <Box display="flex" alignItems="center">
                                        <LocationIcon sx={{ fontSize: 'small', mr: 0.5, color: 'text.disabled' }} />
                                        <Typography variant="body2">{dept.location || 'N/A'}</Typography>
                                    </Box>
                                </TableCell>
                                <TableCell>
                                    <Chip
                                        label={dept.status === 'active' ? 'Activo' : 'Inactivo'}
                                        size="small"
                                        color={dept.status === 'active' ? 'success' : 'default'}
                                        variant="outlined"
                                    />
                                </TableCell>
                                <TableCell align="right">
                                    <Tooltip title="Editar">
                                        <IconButton size="small" onClick={() => handleOpenForm(dept)}>
                                            <EditIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Eliminar">
                                        <IconButton size="small" color="error" onClick={() => handleDelete(dept)}>
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Form Dialog */}
            <Dialog open={openForm} onClose={handleCloseForm} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {editingDept ? 'Editar Departamento' : 'Crear Nuevo Departamento'}
                </DialogTitle>
                <DialogContent dividers>
                    <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2} mt={1}>
                        <TextField
                            label="Nombre del Departamento"
                            fullWidth
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Ej: Recursos Humanos"
                        />
                        <TextField
                            label="Código Interno"
                            fullWidth
                            value={formData.code}
                            onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                            disabled={!!editingDept}
                            placeholder="EJ: RRHH"
                            helperText="Identificador alfa-numérico"
                        />
                        <Box gridColumn="span 2">
                            <TextField
                                label="Descripción"
                                fullWidth
                                multiline
                                rows={2}
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </Box>

                        <FormControl fullWidth>
                            <InputLabel>Responsable / Jefe</InputLabel>
                            <Select
                                value={formData.head_id || ''}
                                label="Responsable / Jefe"
                                onChange={(e) => setFormData({ ...formData, head_id: e.target.value })}
                            >
                                <MenuItem value=""><em>Ninguno</em></MenuItem>
                                {employees.map((emp) => (
                                    <MenuItem key={emp.id || emp._id} value={emp.id || emp._id}>
                                        {emp.first_name} {emp.last_name} ({emp.email})
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <TextField
                            label="Ubicación"
                            fullWidth
                            value={formData.location}
                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                            placeholder="Ej: Oficina Central, Piso 4"
                        />

                        <TextField
                            label="Email de Contacto"
                            fullWidth
                            value={formData.contact_email}
                            onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                        />

                        <TextField
                            label="Teléfono de Contacto"
                            fullWidth
                            value={formData.contact_phone}
                            onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                        />

                        <TextField
                            label="Capacidad Máx. Empleados"
                            type="number"
                            fullWidth
                            value={formData.max_employees}
                            onChange={(e) => setFormData({ ...formData, max_employees: parseInt(e.target.value) })}
                        />

                        <FormControl fullWidth>
                            <InputLabel>Estado</InputLabel>
                            <Select
                                value={formData.status}
                                label="Estado"
                                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                            >
                                <MenuItem value="active">Activo</MenuItem>
                                <MenuItem value="inactive">Inactivo</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ px: 3, py: 2 }}>
                    <Button onClick={handleCloseForm} color="inherit">
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        variant="contained"
                        disabled={submitting || !formData.name || !formData.code}
                    >
                        {submitting ? <CircularProgress size={24} color="inherit" /> : 'Guardar Departamento'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default DepartmentList;
