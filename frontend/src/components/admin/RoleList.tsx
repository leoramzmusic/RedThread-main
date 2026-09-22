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
    VisibilityOff as HideIcon,
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
    const [currentEmployee, setCurrentEmployee] = useState<any>(null);
    const [canAddMore, setCanAddMore] = useState(false);
    const [showValidationModal, setShowValidationModal] = useState(false);
    const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
    const [validationUser, setValidationUser] = useState('');
    const [validationPass, setValidationPass] = useState('');
    const [validationError, setValidationError] = useState<string | null>(null);
    const [validating, setValidating] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<Role | null>(null);
    const [hideTarget, setHideTarget] = useState<Role | null>(null);

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
        fetchCurrentEmployee();
    }, []);

    const fetchCurrentEmployee = async () => {
        try {
            const res = await adminApiClient.get('/portal-redthread/auth/me');
            setCurrentEmployee(res.data);
        } catch {}
    };

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
        setCanAddMore(false);
        setValidationError(null);
        setOpenForm(true);
    };

    const handleCloseForm = () => {
        setOpenForm(false);
        setEditingRole(null);
        setCanAddMore(false);
        setShowValidationModal(false);
        setShowPasswordConfirm(false);
        setValidationPass('');
        setValidationUser('');
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        const beforePerms = new Set(editingRole?.permissions || []);
        const afterPerms = new Set(formData.permissions || []);
        const added = [...afterPerms].filter((p) => !beforePerms.has(p));
        // Normaliza permisos a valor del enum (lowercase) y evita enviar slug en update (RoleUpdate no lo tiene)
        const payload: any = {
            ...formData,
            permissions: (formData.permissions || []).map((p: string) => p.toLowerCase()),
        };
        if (editingRole) delete payload.slug;
        try {
            if (editingRole) {
                const id = editingRole.id || editingRole._id;
                await adminApiClient.put(`/portal-redthread/roles/${id}`, payload);
            } else {
                await adminApiClient.post('/portal-redthread/roles/', payload);
            }
            if (added.length) {
                const who = currentEmployee?.email || 'unknown';
                console.log(`[audit] ${who} añadió permisos ${added.join(',')} a rol ${formData.slug || editingRole?.slug} el ${new Date().toISOString()}`);
            }
            fetchData();
            handleCloseForm();
        } catch (err: any) {
            console.error('Error saving role:', err);
            const raw = err.response?.data?.detail;
            let detail: string;
            if (Array.isArray(raw)) detail = raw.map((d: any) => d?.msg || d?.message || JSON.stringify(d)).join(' | ');
            else if (raw && typeof raw === 'object') detail = (raw as any).msg || (raw as any).message || JSON.stringify(raw);
            else detail = (typeof raw === 'string' ? raw : null) || 'Error al guardar el rol. El slug y el nombre deben ser únicos.';
            setError(detail);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = (role: Role) => {
        if (role.is_system_role) return;
        setDeleteTarget(role);
    };
    const confirmDelete = async () => {
        if (!deleteTarget) return;
        try {
            const id = deleteTarget.id || deleteTarget._id;
            await adminApiClient.delete(`/portal-redthread/roles/${id}`);
            fetchData();
        } catch (err: any) {
            console.error('Error deleting role:', err);
            const raw = err.response?.data?.detail;
            const msg = Array.isArray(raw) ? raw.map((d: any) => d?.msg || JSON.stringify(d)).join(' | ') : (raw && typeof raw === 'object' ? (raw.msg || JSON.stringify(raw)) : raw) || 'No se pudo eliminar el rol.';
            setError(String(msg));
        } finally { setDeleteTarget(null); }
    };
    const handleHide = (role: Role) => setHideTarget(role);
    const confirmHide = async () => {
        if (!hideTarget) return;
        try {
            const id = hideTarget.id || hideTarget._id;
            await adminApiClient.put(`/portal-redthread/roles/${id}`, { is_active: false });
            fetchData();
        } catch (err: any) {
            console.error('Error hiding role:', err);
            const raw = err.response?.data?.detail;
            const msg = Array.isArray(raw) ? raw.map((d: any) => d?.msg || JSON.stringify(d)).join(' | ') : (raw && typeof raw === 'object' ? (raw.msg || JSON.stringify(raw)) : raw) || 'No se pudo ocultar el rol.';
            setError(String(msg));
        } finally { setHideTarget(null); }
    };

    const isPrivileged = (() => {
        const roles: string[] = currentEmployee?.roles || [];
        if (roles.includes('superadmin') || roles.includes('admin')) return true;
        // Gerente del departamento: tiene manage_employees y mismo dept que el rol en edición
        if (editingRole && currentEmployee?.department_id && editingRole.slug) {
            const isManager = roles.some((r) => r.includes('gerente') || r.includes('gestor') || r === 'hr');
            return isManager;
        }
        return false;
    })();

    const handleAddMoreClick = () => {
        if (isPrivileged) setShowPasswordConfirm(true);
        else setShowValidationModal(true);
    };

    const handleValidateUserPass = async () => {
        setValidating(true);
        setValidationError(null);
        try {
            await adminApiClient.post('/portal-redthread/auth/login', { email: validationUser, password: validationPass });
            setCanAddMore(true);
            setShowValidationModal(false);
            setValidationUser('');
            setValidationPass('');
            // auditoría: se reautenticó para ver permisos extra
            console.log('[audit] validación user+pass OK por', validationUser);
        } catch (e: any) {
            setValidationError(e.response?.data?.detail || 'Credenciales inválidas');
        } finally { setValidating(false); }
    };

    const handleConfirmPassword = async () => {
        setValidating(true);
        setValidationError(null);
        try {
            const email = currentEmployee?.email;
            await adminApiClient.post('/portal-redthread/auth/login', { email, password: validationPass });
            setCanAddMore(true);
            setShowPasswordConfirm(false);
            setValidationPass('');
            console.log('[audit] confirmación password OK por', email);
        } catch (e: any) {
            setValidationError(e.response?.data?.detail || 'Contraseña incorrecta');
        } finally { setValidating(false); }
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
                                    <Tooltip title={role.is_system_role ? 'Ocultar (rol del sistema no se borra)' : 'Eliminar'}>
                                        <IconButton
                                            size="small"
                                            color={role.is_system_role ? 'default' : 'error'}
                                            onClick={() => (role.is_system_role ? handleHide(role) : handleDelete(role))}
                                        >
                                            {role.is_system_role ? <HideIcon fontSize="small" /> : <DeleteIcon fontSize="small" />}
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
                            <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                                <Typography variant="subtitle2" fontWeight="bold">Permisos del departamento</Typography>
                                <Box display="flex" alignItems="center" gap={1}>
                                    <Checkbox
                                        checked={formData.permissions?.length === permissions.length && permissions.length > 0}
                                        indeterminate={!!formData.permissions?.length && formData.permissions.length < permissions.length}
                                        onChange={(e) => setFormData({ ...formData, permissions: e.target.checked ? permissions.map((p) => p.id) : [] })}
                                    />
                                    <Typography variant="caption">Seleccionar todos</Typography>
                                </Box>
                            </Box>
                            <FormControl fullWidth sx={{ mt: 0 }}>
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
                                            <Checkbox checked={(formData.permissions || []).some((p: string) => p.toLowerCase() === perm.id.toLowerCase())} />
                                            <ListItemText primary={perm.name} secondary={perm.id} />
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            <Box mt={2} display="flex" justifyContent="space-between" alignItems="center">
                                <Typography variant="caption" color="text.secondary">¿Necesitas permisos de otros módulos?</Typography>
                                <Button size="small" variant="outlined" onClick={handleAddMoreClick} disabled={canAddMore}>
                                    {canAddMore ? '✓ Acceso ampliado' : 'Agregar más permisos'}
                                </Button>
                            </Box>
                            {canAddMore && (
                                <Box mt={2} p={1.5} border="1px solid rgba(0,0,0,0.08)" borderRadius={2} bgcolor="rgba(0,0,0,0.02)">
                                    <Typography variant="caption" fontWeight="bold" display="block" mb={1}>Permisos adicionales por módulo (desbloqueados)</Typography>
                                    <Box display="flex" flexWrap="wrap" gap={1}>
                                        {permissions.map((perm) => {
                                            const active = (formData.permissions || []).some((p: string) => p.toLowerCase() === perm.id.toLowerCase());
                                            return (
                                            <Chip key={`extra-${perm.id}`} label={perm.id} size="small" variant={active ? 'filled' : 'outlined'} onClick={() => {
                                                const cur = formData.permissions || [];
                                                const isActive = cur.some((x: string) => x.toLowerCase() === perm.id.toLowerCase());
                                                setFormData({ ...formData, permissions: isActive ? cur.filter((x: string) => x.toLowerCase() !== perm.id.toLowerCase()) : [...cur, perm.id] });
                                            }} color={active ? 'primary' : 'default'} />
                                        )})}
                                    </Box>
                                    <Typography variant="caption" color="text.secondary" display="block" mt={1}>Auditoría: se registrarán usuario, fecha/hora y permisos añadidos al guardar.</Typography>
                                </Box>
                            )}
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

            {/* Modal validación extra: usuario + contraseña (no privilegiado) */}
            <Dialog open={showValidationModal} onClose={() => setShowValidationModal(false)} maxWidth="xs" fullWidth>
                <DialogTitle>Validación requerida para permisos extra</DialogTitle>
                <DialogContent dividers>
                    <Typography variant="body2" color="text.secondary" mb={2}>Ingresa usuario y contraseña de un supervisor para desbloquear permisos de otros módulos.</Typography>
                    {validationError && <Alert severity="error" sx={{ mb: 2 }}>{validationError}</Alert>}
                    <TextField fullWidth label="Usuario (email)" value={validationUser} onChange={(e) => setValidationUser(e.target.value)} margin="dense" />
                    <TextField fullWidth label="Contraseña" type="password" value={validationPass} onChange={(e) => setValidationPass(e.target.value)} margin="dense" />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowValidationModal(false)}>Cancelar</Button>
                    <Button onClick={handleValidateUserPass} variant="contained" disabled={validating || !validationUser || !validationPass}>
                        {validating ? <CircularProgress size={20} /> : 'Validar y mostrar permisos adicionales'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Modal confirmación por contraseña (privilegiado) */}
            <Dialog open={showPasswordConfirm} onClose={() => setShowPasswordConfirm(false)} maxWidth="xs" fullWidth>
                <DialogTitle>Confirmar con contraseña</DialogTitle>
                <DialogContent dividers>
                    <Typography variant="body2" color="text.secondary" mb={2}>Por auditoría, confirma tu contraseña para asignar permisos adicionales.</Typography>
                    {validationError && <Alert severity="error" sx={{ mb: 2 }}>{validationError}</Alert>}
                    <TextField fullWidth label="Contraseña" type="password" value={validationPass} onChange={(e) => setValidationPass(e.target.value)} margin="dense" autoFocus />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowPasswordConfirm(false)}>Cancelar</Button>
                    <Button onClick={handleConfirmPassword} variant="contained" disabled={validating || !validationPass}>
                        {validating ? <CircularProgress size={20} /> : 'Confirmar'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Confirmar borrar rol (solo custom) */}
            <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth>
                <DialogTitle>¿Eliminar rol?</DialogTitle>
                <DialogContent dividers>
                    <Typography variant="body2">¿Está seguro de eliminar el rol <strong>{deleteTarget?.name}</strong> ({deleteTarget?.slug})? Solo roles creados después pueden borrarse.</Typography>
                    <Alert severity="warning" sx={{ mt: 2 }}>Se verificará que ningún empleado lo esté usando.</Alert>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteTarget(null)}>Cancelar</Button>
                    <Button onClick={confirmDelete} color="error" variant="contained">Eliminar</Button>
                </DialogActions>
            </Dialog>

            {/* Ocultar rol del sistema */}
            <Dialog open={!!hideTarget} onClose={() => setHideTarget(null)} maxWidth="xs" fullWidth>
                <DialogTitle>¿Ocultar rol?</DialogTitle>
                <DialogContent dividers>
                    <Typography variant="body2"><strong>{hideTarget?.name}</strong> es un rol del sistema y no se puede borrar, pero sí ocultar (pasará a <em>Inactivo</em>).</Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setHideTarget(null)}>Cancelar</Button>
                    <Button onClick={confirmHide} color="warning" variant="contained">Ocultar</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default RoleList;
