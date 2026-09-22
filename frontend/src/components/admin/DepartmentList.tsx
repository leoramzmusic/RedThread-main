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
    Search as SearchIcon,
    Warning as WarningIcon,
    Download as DownloadIcon,
    AccountTree as TreeIcon,
    TableChart as TableIcon,
    VisibilityOff as HideIcon,
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
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<'hierarchy' | 'name' | 'code' | 'head' | 'location' | 'status'>('hierarchy');
    const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
    const [filterLocation, setFilterLocation] = useState<string>('all');
    const [filterHead, setFilterHead] = useState<'all' | 'with' | 'without'>('all');
    const [viewMode, setViewMode] = useState<'table' | 'tree'>('table');

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
        // Limpia payload para DepartmentUpdate/Create: evita 422 por strings vacíos o NaN
        const clean: any = { ...formData };
        // En update el backend no espera `code` (DepartmentUpdate no tiene code)
        if (editingDept) delete clean.code;
        // Convierte "" → null para opcionales y NaN → null
        ['head_id', 'location', 'contact_email', 'contact_phone'].forEach((k) => {
            if (clean[k] === '' || clean[k] === undefined) clean[k] = null;
        });
        if (clean.max_employees === '' || Number.isNaN(clean.max_employees)) clean.max_employees = null;
        else if (clean.max_employees !== null && clean.max_employees !== undefined) clean.max_employees = Number(clean.max_employees);
        try {
            if (editingDept) {
                const id = editingDept.id || editingDept._id;
                await adminApiClient.put(`/portal-redthread/departments/${id}`, clean);
            } else {
                await adminApiClient.post('/portal-redthread/departments/', clean);
            }
            fetchData();
            handleCloseForm();
        } catch (err: any) {
            console.error('Error saving department:', err);
            const raw = err.response?.data?.detail;
            let msg: string;
            if (Array.isArray(raw)) msg = raw.map((d: any) => d?.msg || JSON.stringify(d)).join(' | ');
            else if (raw && typeof raw === 'object') msg = (raw as any).msg || JSON.stringify(raw);
            else msg = (typeof raw === 'string' ? raw : null) || 'Error al guardar el departamento. El código debe ser único.';
            setError(msg);
        } finally {
            setSubmitting(false);
        }
    };

    const DEFAULT_CODES = ['ADM', 'HR', 'FIN', 'TECH', 'MKT', 'SALE', 'OPS', 'SUPP', 'LEG'];
    const isDefaultDept = (dept: Department) => DEFAULT_CODES.includes(dept.code);

    const [deleteTarget, setDeleteTarget] = useState<Department | null>(null);
    const [hideTarget, setHideTarget] = useState<Department | null>(null);

    const handleDelete = async (dept: Department) => {
        if (isDefaultDept(dept)) return;
        setDeleteTarget(dept);
    };
    const confirmDelete = async () => {
        if (!deleteTarget) return;
        try {
            const id = deleteTarget.id || deleteTarget._id;
            await adminApiClient.delete(`/portal-redthread/departments/${id}`);
            fetchData();
        } catch (err: any) {
            console.error('Error deleting department:', err);
            const raw = err.response?.data?.detail;
            const msg = Array.isArray(raw) ? raw.map((d: any) => d?.msg || JSON.stringify(d)).join(' | ') : (raw && typeof raw === 'object' ? (raw.msg || JSON.stringify(raw)) : raw) || 'No se pudo eliminar el departamento. Verifique que no tenga empleados asignados.';
            setError(String(msg));
        } finally { setDeleteTarget(null); }
    };
    const handleHide = (dept: Department) => setHideTarget(dept);
    const confirmHide = async () => {
        if (!hideTarget) return;
        try {
            const id = hideTarget.id || hideTarget._id;
            await adminApiClient.put(`/portal-redthread/departments/${id}`, { status: 'inactive' });
            fetchData();
        } catch (err: any) {
            console.error('Error hiding department:', err);
            const raw = err.response?.data?.detail;
            const msg = Array.isArray(raw) ? raw.map((d: any) => d?.msg || JSON.stringify(d)).join(' | ') : (raw && typeof raw === 'object' ? (raw.msg || JSON.stringify(raw)) : raw) || 'No se pudo ocultar el departamento.';
            setError(String(msg));
        } finally { setHideTarget(null); }
    };

    const getHeadName = (headId: string | null) => {
        if (!headId) return 'No asignado';
        const head = employees.find(e => (e.id || e._id) === headId);
        return head ? `${head.first_name} ${head.last_name}` : 'Cargando...';
    };

    const locations = Array.from(new Set(departments.map((d) => d.location).filter(Boolean))) as string[];

    const filteredSorted = React.useMemo(() => {
        let list = [...departments];
        const q = searchQuery.toLowerCase().trim();
        if (q) {
            list = list.filter((d) => {
                const headName = getHeadName(d.head_id).toLowerCase();
                return d.name.toLowerCase().includes(q) || d.code.toLowerCase().includes(q) || headName.includes(q) || (d.location || '').toLowerCase().includes(q);
            });
        }
        if (filterStatus !== 'all') list = list.filter((d) => d.status === filterStatus);
        if (filterLocation !== 'all') list = list.filter((d) => (d.location || '') === filterLocation);
        if (filterHead === 'with') list = list.filter((d) => !!d.head_id);
        if (filterHead === 'without') list = list.filter((d) => !d.head_id);

        if (sortBy === 'name') list.sort((a, b) => a.name.localeCompare(b.name));
        else if (sortBy === 'code') list.sort((a, b) => a.code.localeCompare(b.code));
        else if (sortBy === 'head') list.sort((a, b) => getHeadName(a.head_id).localeCompare(getHeadName(b.head_id)));
        else if (sortBy === 'location') list.sort((a, b) => (a.location || '').localeCompare(b.location || ''));
        else if (sortBy === 'status') list.sort((a, b) => (a.status === 'active' ? -1 : 1) - (b.status === 'active' ? -1 : 1));
        // hierarchy: mantiene orden original (insertion)
        return list;
    }, [departments, employees, searchQuery, filterStatus, filterLocation, filterHead, sortBy]);

    const exportToCsv = () => {
        const headers = ['Nombre', 'Código', 'Responsable', 'Ubicación', 'Estado', 'Descripción'];
        const rows = filteredSorted.map((d) => [d.name, d.code, getHeadName(d.head_id), d.location || '', d.status, `"${(d.description || '').replace(/"/g, '""')}"`]);
        const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `departamentos_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const exportToPdf = () => window.print();

    if (loading && departments.length === 0) {
        return (
            <Box display="flex" justifyContent="center" p={5}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" gap={2}>
                <Typography variant="h5" fontWeight="bold">
                    Departamentos y Estructura
                </Typography>
                <Box display="flex" gap={1} flexWrap="wrap">
                    <Button variant="outlined" startIcon={viewMode === 'tree' ? <TableIcon /> : <TreeIcon />} onClick={() => setViewMode(viewMode === 'tree' ? 'table' : 'tree')} sx={{ borderRadius: 2 }}>
                        {viewMode === 'tree' ? 'Vista tabla' : 'Vista árbol'}
                    </Button>
                    <Button variant="outlined" startIcon={<DownloadIcon />} onClick={exportToCsv} sx={{ borderRadius: 2 }}>
                        Excel (CSV)
                    </Button>
                    <Button variant="outlined" startIcon={<DownloadIcon />} onClick={exportToPdf} sx={{ borderRadius: 2 }}>
                        PDF
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => handleOpenForm()}
                        sx={{ borderRadius: 2 }}
                    >
                        Nuevo Departamento
                    </Button>
                </Box>
            </Box>

            {/* Controles profesionales */}
            <Paper sx={{ p: 2, mb: 2, borderRadius: 2, display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'center' }}>
                <TextField
                    placeholder="Buscar por nombre, código o responsable..."
                    size="small"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    InputProps={{ startAdornment: <SearchIcon sx={{ fontSize: 18, mr: 1, color: 'text.disabled' }} /> }}
                    inputProps={{ list: "dept-search-list" }}
                    sx={{ minWidth: 260, flex: 1 }}
                />
                <datalist id="dept-search-list">
                    {departments.map((d) => (
                        <option key={d.code} value={d.name} />
                    ))}
                    {departments.map((d) => (
                        <option key={`${d.code}-code`} value={d.code} />
                    ))}
                </datalist>
                <FormControl size="small" sx={{ minWidth: 150 }}>
                    <InputLabel>Ordenar por</InputLabel>
                    <Select value={sortBy} label="Ordenar por" onChange={(e) => setSortBy(e.target.value as any)}>
                        <MenuItem value="hierarchy">Jerarquía (default)</MenuItem>
                        <MenuItem value="name">Nombre (A-Z)</MenuItem>
                        <MenuItem value="code">Código</MenuItem>
                        <MenuItem value="head">Responsable</MenuItem>
                        <MenuItem value="location">Ubicación</MenuItem>
                        <MenuItem value="status">Estado (activos primero)</MenuItem>
                    </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 140 }}>
                    <InputLabel>Estado</InputLabel>
                    <Select value={filterStatus} label="Estado" onChange={(e) => setFilterStatus(e.target.value as any)}>
                        <MenuItem value="all">Todos</MenuItem>
                        <MenuItem value="active">Activos</MenuItem>
                        <MenuItem value="inactive">Inactivos</MenuItem>
                    </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 150 }}>
                    <InputLabel>Ubicación</InputLabel>
                    <Select value={filterLocation} label="Ubicación" onChange={(e) => setFilterLocation(e.target.value as any)}>
                        <MenuItem value="all">Todas</MenuItem>
                        {locations.map((loc) => (
                            <MenuItem key={loc} value={loc}>{loc || 'Sin ubicación'}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 170 }}>
                    <InputLabel>Responsable</InputLabel>
                    <Select value={filterHead} label="Responsable" onChange={(e) => setFilterHead(e.target.value as any)}>
                        <MenuItem value="all">Todos</MenuItem>
                        <MenuItem value="with">Con responsable</MenuItem>
                        <MenuItem value="without">Sin responsable</MenuItem>
                    </Select>
                </FormControl>
                <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
                    {filteredSorted.length} de {departments.length} · {departments.filter((d) => d.status === 'active').length} activos
                </Typography>
            </Paper>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            {viewMode === 'tree' ? (
                <Paper sx={{ borderRadius: 3, p: 2, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                    <Typography variant="subtitle2" fontWeight="bold" mb={1.5} display="flex" alignItems="center" gap={1}><TreeIcon fontSize="small" /> Árbol organizacional (expandible por ubicación)</Typography>
                    {Array.from(new Set(filteredSorted.map((d) => d.location || 'Sin ubicación'))).map((loc) => (
                        <Box key={loc} sx={{ mb: 1.5, border: '1px solid rgba(0,0,0,0.08)', borderRadius: 2, overflow: 'hidden' }}>
                            <Box sx={{ bgcolor: 'rgba(0,0,0,0.03)', px: 2, py: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="body2" fontWeight="bold">{loc} ({filteredSorted.filter((d) => (d.location || 'Sin ubicación') === loc).length})</Typography>
                                <Chip size="small" label={`${filteredSorted.filter((d) => (d.location || 'Sin ubicación') === loc && d.status === 'active').length} activos`} color="success" variant="outlined" />
                            </Box>
                            <Box sx={{ divideY: '1px solid rgba(0,0,0,0.06)' }}>
                                {filteredSorted.filter((d) => (d.location || 'Sin ubicación') === loc).map((dept) => (
                                    <Box key={dept.code} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, py: 1.2, '&:hover': { bgcolor: 'rgba(0,0,0,0.02)' } }}>
                                        <Box display="flex" alignItems="center" gap={1}>
                                            <BusinessIcon sx={{ color: dept.status === 'active' ? 'success.main' : 'text.disabled', fontSize: 18 }} />
                                            <Box>
                                                <Typography variant="body2" fontWeight="medium">{dept.name} <Chip label={dept.code} size="small" sx={{ ml: 0.5, height: 16, fontSize: '0.65rem' }} /></Typography>
                                                <Typography variant="caption" color="text.secondary">{dept.description}</Typography>
                                            </Box>
                                            {!dept.head_id && <Tooltip title="Sin responsable asignado"><WarningIcon sx={{ fontSize: 16, color: 'warning.main' }} /></Tooltip>}
                                        </Box>
                                        <Box display="flex" alignItems="center" gap={1}>
                                            <Chip label={dept.status === 'active' ? 'Activo' : 'Inactivo'} size="small" color={dept.status === 'active' ? 'success' : 'default'} variant={dept.status === 'active' ? 'filled' : 'outlined'} sx={{ height: 20 }} />
                                            <IconButton size="small" onClick={() => handleOpenForm(dept)}><EditIcon fontSize="small" /></IconButton>
                                            <Tooltip title={isDefaultDept(dept) ? 'Ocultar (por defecto)' : 'Eliminar'}>
                                                <IconButton size="small" color={isDefaultDept(dept) ? 'default' : 'error'} onClick={() => (isDefaultDept(dept) ? handleHide(dept) : handleDelete(dept))}>
                                                    {isDefaultDept(dept) ? <HideIcon fontSize="small" /> : <DeleteIcon fontSize="small" />}
                                                </IconButton>
                                            </Tooltip>
                                        </Box>
                                    </Box>
                                ))}
                            </Box>
                        </Box>
                    ))}
                    {filteredSorted.length === 0 && <Typography variant="body2" color="text.secondary" textAlign="center" py={3}>Sin resultados para los filtros actuales.</Typography>}
                </Paper>
            ) : (
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
                        {filteredSorted.map((dept) => (
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
                                        <Box display="flex" alignItems="center" gap={0.5}>
                                            <Typography variant="body2" color="text.disabled">No asignado</Typography>
                                            <Tooltip title="Sin responsable asignado"><WarningIcon sx={{ fontSize: 14, color: 'warning.main' }} /></Tooltip>
                                        </Box>
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
                                    <Tooltip title={isDefaultDept(dept) ? 'Ocultar (por defecto no se borra)' : 'Eliminar'}>
                                        <IconButton size="small" color={isDefaultDept(dept) ? 'default' : 'error'} onClick={() => (isDefaultDept(dept) ? handleHide(dept) : handleDelete(dept))}>
                                            {isDefaultDept(dept) ? <HideIcon fontSize="small" /> : <DeleteIcon fontSize="small" />}
                                        </IconButton>
                                    </Tooltip>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
            )}

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

            {/* Confirmar borrar (solo custom) */}
            <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth>
                <DialogTitle>¿Eliminar departamento?</DialogTitle>
                <DialogContent dividers>
                    <Typography variant="body2">
                        ¿Está seguro de eliminar el departamento <strong>{deleteTarget?.name}</strong> ({deleteTarget?.code})? Esta acción no se puede deshacer y solo aplica a departamentos creados después del despliegue inicial.
                    </Typography>
                    <Alert severity="warning" sx={{ mt: 2 }}>Se verificará que no tenga empleados asignados.</Alert>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteTarget(null)}>Cancelar</Button>
                    <Button onClick={confirmDelete} color="error" variant="contained">Eliminar</Button>
                </DialogActions>
            </Dialog>

            {/* Ocultar (para por defecto) */}
            <Dialog open={!!hideTarget} onClose={() => setHideTarget(null)} maxWidth="xs" fullWidth>
                <DialogTitle>¿Ocultar departamento?</DialogTitle>
                <DialogContent dividers>
                    <Typography variant="body2">
                        <strong>{hideTarget?.name}</strong> es un departamento por defecto y no se puede borrar, pero sí ocultar (pasará a <em>Inactivo</em> y no aparecerá en asignaciones).
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setHideTarget(null)}>Cancelar</Button>
                    <Button onClick={confirmHide} color="warning" variant="contained">Ocultar</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default DepartmentList;
