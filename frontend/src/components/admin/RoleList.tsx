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
    OutlinedInput,
    Checkbox,
    ListItemText,
    Alert,
    CircularProgress,
    Tooltip,
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Shield as ShieldIcon,
    Search as SearchIcon,
    Info as InfoIcon,
} from '@mui/icons-material';
import adminApiClient from '../../services/adminApi';

interface Permission {
    id: string;
    name: string;
}

interface Role {
    _id?: string;
    id?: string;
    name: string;
    slug: string;
    description: string;
    permissions: string[];
    hierarchy_level: number;
    is_active: boolean;
    is_system_role: boolean;
}

const RoleList: React.FC = () => {
    const [roles, setRoles] = useState<Role[]>([]);
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Form State
    const [openForm, setOpenForm] = useState(false);
    const [editingRole, setEditingRole] = useState<Role | null>(null);
    const [formData, setFormData] = useState<Partial<Role>>({
        name: '',
        slug: '',
        description: '',
        permissions: [],
        hierarchy_level: 10,
        is_active: true,
    });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [rolesRes, permsRes] = await Promise.all([
                adminApiClient.get('/portal-redthread/roles/'),
                adminApiClient.get('/portal-redthread/roles/permissions'),
            ]);
            setRoles(rolesRes.data);
            setPermissions(permsRes.data);
            setError(null);
        } catch (err: any) {
            console.error('Error fetching roles:', err);
            setError('No se pudieron cargar los roles. Verifique su conexión.');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenForm = (role?: Role) => {
        if (role) {
            setEditingRole(role);
            setFormData({
                name: role.name,
                slug: role.slug,
                description: role.description,
                permissions: role.permissions,
                hierarchy_level: role.hierarchy_level,
                is_active: role.is_active,
            });
        } else {
            setEditingRole(null);
            setFormData({
                name: '',
                slug: '',
                description: '',
                permissions: [],
                hierarchy_level: 10,
                is_active: true,
            });
        }
        setOpenForm(true);
    };

    const handleCloseForm = () => {
        setOpenForm(false);
        setEditingRole(null);
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            if (editingRole) {
                const id = editingRole.id || editingRole._id;
                await adminApiClient.put(`/portal-redthread/roles/${id}`, formData);
            } else {
                await adminApiClient.post('/portal-redthread/roles/', formData);
            }
            fetchData();
            handleCloseForm();
        } catch (err: any) {
            console.error('Error saving role:', err);
            const detail = err.response?.data?.detail || 'Error al guardar el rol. El slug y el nombre deben ser únicos.';
            setError(detail);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (role: Role) => {
        if (role.is_system_role) return;
        if (!window.confirm(`¿Está seguro de eliminar el rol "${role.name}"?`)) return;

        try {
            const id = role.id || role._id;
            await adminApiClient.delete(`/portal-redthread/roles/${id}`);
            fetchData();
        } catch (err: any) {
            console.error('Error deleting role:', err);
            alert(err.response?.data?.detail || 'No se pudo eliminar el rol.');
        }
    };

    if (loading && roles.length === 0) {
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
                    Gestión de Roles y Permisos
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => handleOpenForm()}
                    sx={{ borderRadius: 2 }}
                >
                    Nuevo Rol
                </Button>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                <Table>
                    <TableHead sx={{ bgcolor: 'rgba(0,0,0,0.02)' }}>
                        <TableRow>
                            <TableCell>Rol</TableCell>
                            <TableCell>Slug / Identificador</TableCell>
                            <TableCell>Descripción</TableCell>
                            <TableCell>Permisos</TableCell>
                            <TableCell>Nivel</TableCell>
                            <TableCell align="right">Acciones</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {roles.map((role) => (
                            <TableRow key={role.slug} hover>
                                <TableCell>
                                    <Box display="flex" alignItems="center">
                                        <ShieldIcon sx={{ mr: 1, color: role.is_system_role ? 'primary.main' : 'text.secondary' }} />
                                        <Typography variant="body2" fontWeight="medium">
                                            {role.name}
                                        </Typography>
                                    </Box>
                                </TableCell>
                                <TableCell>
                                    <Chip label={role.slug} size="small" variant="outlined" sx={{ fontFamily: 'monospace' }} />
                                </TableCell>
                                <TableCell sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {role.description}
                                </TableCell>
                                <TableCell>
                                    <Typography variant="caption" color="text.secondary">
                                        {role.permissions.length} permisos asignados
                                    </Typography>
                                </TableCell>
                                <TableCell>{role.hierarchy_level}</TableCell>
                                <TableCell align="right">
                                    <Tooltip title="Editar">
                                        <IconButton size="small" onClick={() => handleOpenForm(role)}>
                                            <EditIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title={role.is_system_role ? "Rol del sistema (Protegido)" : "Eliminar"}>
                                        <span>
                                            <IconButton
                                                size="small"
                                                color="error"
                                                disabled={role.is_system_role}
                                                onClick={() => handleDelete(role)}
                                            >
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                        </span>
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
                    {editingRole ? 'Editar Rol' : 'Crear Nuevo Rol'}
                </DialogTitle>
                <DialogContent dividers>
                    <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2} mt={1}>
                        <TextField
                            label="Nombre del Rol"
                            fullWidth
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Ej: Supervisor de TI"
                        />
                        <TextField
                            label="Slug (ID Único)"
                            fullWidth
                            value={formData.slug}
                            onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                            disabled={!!editingRole}
                            placeholder="ej: supervisor_ti"
                            helperText="Identificador interno"
                        />
                        <FormControl fullWidth>
                            <InputLabel id="hierarchy-label">Nivel de Jerarquía</InputLabel>
                            <Select
                                labelId="hierarchy-label"
                                value={formData.hierarchy_level}
                                onChange={(e) => setFormData({ ...formData, hierarchy_level: Number(e.target.value) })}
                                label="Nivel de Jerarquía"
                                disabled={editingRole?.is_system_role && formData.hierarchy_level === 0}
                            >
                                <MenuItem value={0}>0 - Super Administrador (Acceso total)</MenuItem>
                                <MenuItem value={1}>1 - Administrador General (Gestión completa)</MenuItem>
                                <MenuItem value={2}>2 - Jefe de Departamento (Control de área)</MenuItem>
                                <MenuItem value={3}>3 - Supervisor / Coordinador (Gestión parcial)</MenuItem>
                                <MenuItem value={4}>4 - Empleado (Acceso limitado)</MenuItem>
                                <MenuItem value={5}>5 - Invitado / Temporal (Solo lectura)</MenuItem>
                            </Select>
                        </FormControl>
                        <FormControl fullWidth>
                            <InputLabel>Estado</InputLabel>
                            <Select
                                value={formData.is_active ? 'active' : 'inactive'}
                                label="Estado"
                                onChange={(e) => setFormData({ ...formData, is_active: e.target.value === 'active' })}
                            >
                                <MenuItem value="active">Activo</MenuItem>
                                <MenuItem value="inactive">Inactivo</MenuItem>
                            </Select>
                        </FormControl>
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

                        <Box gridColumn="span 2" py={1}>
                            <Box p={1.5} bgcolor="rgba(0,0,0,0.03)" borderRadius={2} border="1px dashed rgba(0,0,0,0.1)">
                                <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                                    <InfoIcon fontSize="small" color="primary" />
                                    <Typography variant="caption" fontWeight="bold">
                                        Guía de Niveles Jerárquicos
                                    </Typography>
                                </Box>
                                <Typography variant="caption" color="text.secondary" display="block">
                                    <strong>Niveles 0-1:</strong> Administración y control total del sistema.
                                </Typography>
                                <Typography variant="caption" color="text.secondary" display="block">
                                    <strong>Niveles 2-3:</strong> Gestión de personal, áreas y supervisión intermedia.
                                </Typography>
                                <Typography variant="caption" color="text.secondary" display="block">
                                    <strong>Niveles 4-5:</strong> Funciones operativas, colaboradores y acceso básico.
                                </Typography>
                                <Typography variant="caption" sx={{ mt: 1, display: 'block', fontStyle: 'italic' }}>
                                    🔎 Menor número = mayor jerarquía.
                                </Typography>
                            </Box>
                        </Box>

                        <Box gridColumn="span 2">
                            <FormControl fullWidth sx={{ mt: 1 }}>
                                <InputLabel id="permissions-label">Permisos Asociados</InputLabel>
                                <Select
                                    labelId="permissions-label"
                                    multiple
                                    value={formData.permissions || []}
                                    onChange={(e) => setFormData({ ...formData, permissions: typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value })}
                                    input={<OutlinedInput label="Permisos Asociados" />}
                                    renderValue={(selected) => (
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                            {(selected as string[]).map((value) => (
                                                <Chip key={value} label={value} size="small" />
                                            ))}
                                        </Box>
                                    )}
                                    MenuProps={{ PaperProps: { style: { maxHeight: 300 } } }}
                                >
                                    {permissions.map((perm) => (
                                        <MenuItem key={perm.id} value={perm.id}>
                                            <Checkbox checked={(formData.permissions || []).indexOf(perm.id) > -1} />
                                            <ListItemText primary={perm.name} secondary={perm.id} />
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ px: 3, py: 2 }}>
                    <Button onClick={handleCloseForm} color="inherit">
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        variant="contained"
                        disabled={submitting || !formData.name || !formData.slug}
                    >
                        {submitting ? <CircularProgress size={24} color="inherit" /> : 'Guardar Cambios'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default RoleList;
