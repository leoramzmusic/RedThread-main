import { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Box,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    IconButton,
    Avatar,
    Chip,
    Typography,
    TextField,
    InputAdornment,
    Button,
    Menu,
    MenuItem,
    FormControl,
    InputLabel,
    Select,
    Dialog,
    DialogTitle,
    DialogContent,
    ListItemIcon,
    Grid,
    Card,
    CardContent,
    CardActions,
    CircularProgress,
    ToggleButtonGroup,
    ToggleButton,
    Tooltip,
    Divider,
} from '@mui/material';
import {
    Search as SearchIcon,
    MoreVert as MoreVertIcon,
    Visibility as VisibilityIcon,
    Block as BlockIcon,
    Delete as DeleteIcon,
    Email as EmailIcon,
    ViewList as ViewListIcon,
    ViewModule as ViewModuleIcon,
    AdminPanelSettings as AdminIcon,
    Business as BusinessIcon,
    CheckCircle as CheckCircleIcon,
    Edit as EditIcon,
    ArrowUpward as ArrowUpIcon,
    ArrowDownward as ArrowDownIcon,
    Sort as SortIcon,
    Badge as BadgeIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/router';
import adminApiClient from '../../services/adminApi';
import EmployeeFilters from './EmployeeFilters';
import EmployeeStatsDashboard from './EmployeeStatsDashboard';
import CredentialCard from './CredentialCard';
import CredentialBack from './CredentialBack';
import { getMediaUrl } from '../../utils/media';
import { loadCredentialDesign, cardPropsFromDesign, backPropsFromDesign, type CredentialDesignConfig } from '../../utils/credentialDesign';
import { useDebouncedCallback } from 'use-debounce';

interface Employee {
    id: string;
    employee_id: string;
    email: string;
    first_name: string;
    last_name: string;
    display_name: string;
    avatar: string | null;
    role: string;
    area: string;
    status: string;
    country: string | null;
    city: string | null;
    last_login_at: string | null;
    created_at: string;
}

export default function EmployeeList() {
    const router = useRouter();
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(50);
    const [search, setSearch] = useState('');
    const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
    const [filters, setFilters] = useState<any>({});
    const [roles, setRoles] = useState<any[]>([]);
    const [departments, setDepartments] = useState<any[]>([]);

    // Menu state
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
    const [credentialEmployee, setCredentialEmployee] = useState<Employee | null>(null);
    const [credentialOpen, setCredentialOpen] = useState(false);
    const [credDesign, setCredDesign] = useState<CredentialDesignConfig>({});
    const credDesignCard = useMemo(() => cardPropsFromDesign(credDesign), [credDesign]);
    const credDesignBack = useMemo(() => backPropsFromDesign(credDesign), [credDesign]);
    const [sortBy, setSortBy] = useState<'name' | 'employee_id' | 'role' | 'location' | 'status' | 'created_at'>('name');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
    const [quickSearch, setQuickSearch] = useState('');

    useEffect(() => {
        let alive = true;
        loadCredentialDesign().then((cfg) => {
            if (alive) setCredDesign(cfg);
        }).catch(() => {});
        const onStorage = (e: StorageEvent) => {
            if (e.key === 'reth-credential-config' && e.newValue) {
                try { setCredDesign(JSON.parse(e.newValue)); } catch {}
            }
        };
        window.addEventListener('storage', onStorage);
        return () => { alive = false; window.removeEventListener('storage', onStorage); };
    }, []);

    const fetchOrgData = async () => {
        try {
            const [rolesRes, deptsRes] = await Promise.all([
                adminApiClient.get('/portal-redthread/roles/'),
                adminApiClient.get('/portal-redthread/departments/'),
            ]);
            setRoles(rolesRes.data);
            setDepartments(deptsRes.data);
        } catch (error) {
            console.error('Error fetching org data:', error);
        }
    };

    const fetchEmployees = useCallback(async () => {
        setLoading(true);
        try {
            const params = {
                search,
                limit: rowsPerPage,
                offset: page * rowsPerPage,
                ...filters,
            };
            const response = await adminApiClient.get('/portal-redthread/empleados/listado', { params });
            setEmployees(response.data.employees);
            setTotal(response.data.total);
        } catch (error) {
            console.error('Error fetching employees:', error);
        } finally {
            setLoading(false);
        }
    }, [page, rowsPerPage, search, filters]);

    useEffect(() => {
        fetchOrgData();
    }, []);

    useEffect(() => {
        fetchEmployees();
    }, [fetchEmployees]);

    const handleSearchChange = useDebouncedCallback((val: string) => {
        setSearch(val);
        setPage(0);
    }, 500);

    const handlePageChange = (event: unknown, newPage: number) => {
        setPage(newPage);
    };

    const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handleActionClick = (event: React.MouseEvent<HTMLElement>, employee: Employee) => {
        setAnchorEl(event.currentTarget);
        setSelectedEmployee(employee);
    };

    const handleActionClose = () => {
        setAnchorEl(null);
        setSelectedEmployee(null);
    };

    const handleUpdateStatus = async (status: string) => {
        if (!selectedEmployee) return;
        try {
            await adminApiClient.put(`/portal-redthread/empleados/${selectedEmployee.id}/actions`, {
                action: 'update_status',
                status,
                reason: 'Actualización manual desde el listado'
            });
            fetchEmployees();
            handleActionClose();
        } catch (error) {
            console.error('Error updating employee status:', error);
        }
    };

    const isCredentialReady = (e: Employee) => !!(e.avatar && e.first_name && e.last_name && e.employee_id);
    const handleOpenCredential = (e: Employee) => {
        if (!isCredentialReady(e)) return;
        setCredentialEmployee(e);
        setCredentialOpen(true);
        handleActionClose();
    };

    const sortedEmployees = useMemo(() => {
        let list = [...employees];
        const q = quickSearch.toLowerCase().trim();
        if (q) {
            list = list.filter((e) => `${e.display_name} ${e.email} ${e.employee_id} ${e.role} ${e.area}`.toLowerCase().includes(q));
        }
        list.sort((a, b) => {
            let va: string = '';
            let vb: string = '';
            if (sortBy === 'name') { va = a.display_name; vb = b.display_name; }
            else if (sortBy === 'employee_id') { va = a.employee_id; vb = b.employee_id; }
            else if (sortBy === 'role') { va = a.role || ''; vb = b.role || ''; }
            else if (sortBy === 'location') { va = `${a.city || ''} ${a.country || ''}`; vb = `${b.city || ''} ${b.country || ''}`; }
            else if (sortBy === 'status') { va = a.status; vb = b.status; }
            else if (sortBy === 'created_at') { va = a.created_at; vb = b.created_at; }
            const cmp = va.localeCompare(vb, 'es', { sensitivity: 'base' });
            return sortOrder === 'asc' ? cmp : -cmp;
        });
        return list;
    }, [employees, quickSearch, sortBy, sortOrder]);

    const getStatusChip = (status: string) => {
        const configs: any = {
            active: { label: 'Activo', color: 'success' },
            suspended: { label: 'Suspendido', color: 'warning' },
            inactive: { label: 'Inactivo', color: 'default' },
        };
        const config = configs[status] || configs.active;
        return <Chip label={config.label} color={config.color} size="small" variant="outlined" />;
    };

    return (
        <Box>
            <EmployeeStatsDashboard />

            <Paper sx={{ p: 1.5, mb: 2, borderRadius: 2, display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'center' }}>
                <TextField
                    placeholder="Búsqueda rápida: nombre, email, ID, rol..."
                    size="small"
                    value={quickSearch}
                    onChange={(e) => { setQuickSearch(e.target.value); handleSearchChange(e.target.value); }}
                    sx={{ minWidth: 260, flex: 1 }}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon color="action" sx={{ fontSize: 18 }} />
                            </InputAdornment>
                        ),
                    }}
                    inputProps={{ list: 'emp-quick-list' }}
                />
                <datalist id="emp-quick-list">
                    {employees.slice(0, 8).map((e) => (
                        <option key={e.id} value={e.display_name} />
                    ))}
                    {employees.slice(0, 8).map((e) => (
                        <option key={`${e.id}-email`} value={e.email} />
                    ))}
                </datalist>
                <FormControl size="small" sx={{ minWidth: 160 }}>
                    <InputLabel>Ordenar por</InputLabel>
                    <Select value={sortBy} label="Ordenar por" onChange={(e) => setSortBy(e.target.value as any)}>
                        <MenuItem value="name">Nombre</MenuItem>
                        <MenuItem value="employee_id">ID Interno</MenuItem>
                        <MenuItem value="role">Rol / Área</MenuItem>
                        <MenuItem value="location">Ubicación</MenuItem>
                        <MenuItem value="status">Estado</MenuItem>
                        <MenuItem value="created_at">Ingreso</MenuItem>
                    </Select>
                </FormControl>
                <IconButton size="small" onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')} sx={{ border: '1px solid', borderColor: 'divider' }}>
                    {sortOrder === 'asc' ? <ArrowUpIcon fontSize="small" /> : <ArrowDownIcon fontSize="small" />}
                </IconButton>
                <Chip icon={<SortIcon sx={{ fontSize: 14 }} />} label={`${sortedEmployees.length} / ${total}`} size="small" variant="outlined" sx={{ ml: 'auto' }} />
                <ToggleButtonGroup
                    value={viewMode}
                    exclusive
                    onChange={(e, next) => next && setViewMode(next)}
                    size="small"
                >
                    <ToggleButton value="table">
                        <ViewListIcon />
                    </ToggleButton>
                    <ToggleButton value="cards">
                        <ViewModuleIcon />
                    </ToggleButton>
                </ToggleButtonGroup>
            </Paper>

            <EmployeeFilters
                filters={filters}
                roles={roles}
                departments={departments}
                onFilterChange={(f) => { setFilters(f); setPage(0); }}
                onClear={() => { setFilters({}); setPage(0); }}
            />

            {loading ? (
                <Box display="flex" justifyContent="center" py={10}>
                    <CircularProgress />
                </Box>
            ) : (
                <>
                    {viewMode === 'table' ? (
                        <TableContainer component={Paper} elevation={1} sx={{ borderRadius: 2 }}>
                            <Table sx={{ minWidth: 650 }}>
                                <TableHead sx={{
                                    bgcolor: (theme) => theme.palette.mode === 'light' ? 'grey.50' : 'rgba(255, 255, 255, 0.05)',
                                    '& .MuiTableCell-head': {
                                        color: 'text.primary',
                                        fontWeight: 700,
                                        borderBottom: (theme) => `1px solid ${theme.palette.divider}`
                                    }
                                }}>
                                    <TableRow>
                                        <TableCell>Empleado</TableCell>
                                        <TableCell>ID Interno</TableCell>
                                        <TableCell>Rol / Área</TableCell>
                                        <TableCell>Ubicación</TableCell>
                                        <TableCell>Estado</TableCell>
                                        <TableCell>Ingreso</TableCell>
                                        <TableCell align="right">Acciones</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {sortedEmployees.map((e) => (
                                        <TableRow key={e.id} hover>
                                            <TableCell>
                                                <Box display="flex" alignItems="center" gap={1.5}>
                                                    <Avatar src={e.avatar ? getMediaUrl(e.avatar) : undefined} sx={{ width: 32, height: 32 }} />
                                                    <Box>
                                                        <Typography variant="body2" fontWeight={600}>{e.display_name}</Typography>
                                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>{e.email}</Typography>
                                                    </Box>
                                                </Box>
                                            </TableCell>
                                            <TableCell><Typography variant="body2" color="primary" fontWeight={500}>{e.employee_id}</Typography></TableCell>
                                            <TableCell>
                                                <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                    <AdminIcon sx={{ fontSize: 16, color: 'text.secondary' }} /> {(e.role || 'N/A').replace('_', ' ').toUpperCase()}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">{e.area || 'Sin Área'}</Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="caption">{e.city ? `${e.city}, ` : ''}{e.country || 'N/A'}</Typography>
                                            </TableCell>
                                            <TableCell>{getStatusChip(e.status)}</TableCell>
                                            <TableCell><Typography variant="caption">{new Date(e.created_at).toLocaleDateString()}</Typography></TableCell>
                                            <TableCell align="right">
                                                <IconButton size="small" onClick={(event) => handleActionClick(event, e)}>
                                                    <MoreVertIcon />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    ) : (
                        <Grid container spacing={2}>
                            {sortedEmployees.map((e) => (
                                <Grid item xs={12} sm={6} md={4} lg={3} key={e.id}>
                                    <Card sx={{ borderRadius: 2 }}>
                                        <CardContent sx={{ pb: 1 }}>
                                            <Box display="flex" flexDirection="column" alignItems="center" textAlign="center">
                                                <Avatar src={e.avatar ? getMediaUrl(e.avatar) : undefined} sx={{ width: 64, height: 64, mb: 1.5 }} />
                                                <Typography variant="subtitle2" fontWeight={700}>{e.display_name}</Typography>
                                                <Typography variant="caption" color="text.secondary" gutterBottom>
                                                    {e.employee_id} • {e.email}
                                                </Typography>
                                                <Divider sx={{ width: '100%', my: 1.5, opacity: 0.5 }} />
                                                <Box display="flex" justifyContent="space-between" width="100%" mb={1}>
                                                    <Typography variant="caption" color="text.secondary">Área:</Typography>
                                                    <Typography variant="caption" fontWeight={600}>{e.area || 'Sin Área'}</Typography>
                                                </Box>
                                                <Box display="flex" justifyContent="space-between" width="100%" mb={1}>
                                                    <Typography variant="caption" color="text.secondary">Rol:</Typography>
                                                    <Typography variant="caption" fontWeight={600}>{(e.role || 'N/A').toUpperCase()}</Typography>
                                                </Box>
                                                <Box mt={1}>
                                                    {getStatusChip(e.status)}
                                                </Box>
                                            </Box>
                                        </CardContent>
                                        <Divider />
                                        <CardActions sx={{ justifyContent: 'space-between', px: 2 }}>
                                            <Typography variant="caption" color="text.secondary">
                                                {e.country || 'Sin ubicación'}
                                            </Typography>
                                            <Box>
                                                <Tooltip title="Ver más">
                                                    <IconButton size="small" color="primary">
                                                        <VisibilityIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                                <IconButton size="small" onClick={(event) => handleActionClick(event, e)}>
                                                    <MoreVertIcon fontSize="small" />
                                                </IconButton>
                                            </Box>
                                        </CardActions>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                    )}

                    <TablePagination
                        component="div"
                        count={total}
                        page={page}
                        onPageChange={handlePageChange}
                        rowsPerPage={rowsPerPage}
                        onRowsPerPageChange={handleRowsPerPageChange}
                        rowsPerPageOptions={[50, 100, 200]}
                        labelRowsPerPage="Registros:"
                    />
                </>
            )}

            {/* Actions Menu */}
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleActionClose}
                PaperProps={{ elevation: 3, sx: { minWidth: 200, borderRadius: 2 } }}
            >
                <Typography variant="overline" sx={{ px: 2, py: 1, display: 'block', color: 'text.secondary' }}>Acciones</Typography>
                <MenuItem onClick={() => router.push(`/portal-redthread/empleados/editar/${selectedEmployee?.id}`)}>
                    <ListItemIcon><EditIcon fontSize="small" /></ListItemIcon>
                    Editar / Gestión Completa
                </MenuItem>
                <Tooltip title={!selectedEmployee || !isCredentialReady(selectedEmployee) ? 'Completa el perfil para habilitar la credencial (foto, nombre, código)' : ''}>
                    <span>
                        <MenuItem onClick={() => selectedEmployee && handleOpenCredential(selectedEmployee)} disabled={!selectedEmployee || !isCredentialReady(selectedEmployee)}>
                            <ListItemIcon><BadgeIcon fontSize="small" color={selectedEmployee && isCredentialReady(selectedEmployee) ? 'primary' : 'disabled'} /></ListItemIcon>
                            Ver credencial
                        </MenuItem>
                    </span>
                </Tooltip>
                <MenuItem onClick={handleActionClose}>
                    <ListItemIcon><EmailIcon fontSize="small" /></ListItemIcon>
                    Enviar Notificación
                </MenuItem>

                <Divider sx={{ my: 1 }} />
                <Typography variant="overline" sx={{ px: 2, display: 'block', color: 'text.secondary' }}>Administración</Typography>

                {selectedEmployee?.status === 'active' ? (
                    <MenuItem onClick={() => handleUpdateStatus('suspended')}>
                        <ListItemIcon><BlockIcon fontSize="small" color="warning" /></ListItemIcon>
                        Suspender Acceso
                    </MenuItem>
                ) : (
                    <MenuItem onClick={() => handleUpdateStatus('active')}>
                        <ListItemIcon><CheckCircleIcon fontSize="small" color="success" /></ListItemIcon>
                        Reactivar Acceso
                    </MenuItem>
                )}

                <MenuItem onClick={() => handleUpdateStatus('inactive')} sx={{ color: 'error.main' }}>
                    <ListItemIcon><DeleteIcon fontSize="small" color="error" /></ListItemIcon>
                    Marcar como Inactivo
                </MenuItem>
            </Menu>

            <Dialog
                open={credentialOpen}
                onClose={() => setCredentialOpen(false)}
                maxWidth="md"
                fullWidth
                slotProps={{
                    backdrop: { sx: { bgcolor: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' } },
                    paper: { sx: { borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(0,0,0,0.08)' } },
                }}
            >
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 1.5, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
                    <BadgeIcon color="primary" />
                    <Typography variant="subtitle1" fontWeight={800}>Vista previa de credencial</Typography>
                    {credDesign.designName ? (
                        <Chip label={`Diseño: ${String(credDesign.designName)}`} size="small" color="primary" variant="outlined" />
                    ) : null}
                    <Box sx={{ ml: 'auto', fontSize: '0.7rem', color: 'text.secondary', border: '1px solid', borderColor: 'divider', borderRadius: 1, px: 1, py: 0.3 }}>CR80 • Frente + Reverso</Box>
                </DialogTitle>
                <DialogContent dividers sx={{ display: 'flex', gap: 3, justifyContent: 'center', flexWrap: 'wrap', bgcolor: (theme) => (theme.palette.mode === 'dark' ? '#121212' : '#f5f5f5'), py: 3 }}>
                    {credentialEmployee && (
                        <>
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                                <Typography variant="caption" fontWeight={700} color="text.secondary">FRENTE</Typography>
                                <CredentialCard
                                    photoUrl={credentialEmployee.avatar}
                                    firstName={credentialEmployee.first_name}
                                    lastName={credentialEmployee.last_name}
                                    departmentName={departments.find((d) => d._id === (credentialEmployee as any).department_id)?.name || credentialEmployee.area || undefined}
                                    roleName={(credentialEmployee as any).role || (credentialEmployee as any).roles?.[0]}
                                    employeeCode={credentialEmployee.employee_id}
                                    email={credentialEmployee.email}
                                    phone={(credentialEmployee as any).phone}
                                    birthDate={(credentialEmployee as any).birth_date}
                                    {...credDesignCard}
                                />
                            </Box>
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                                <Typography variant="caption" fontWeight={700} color="text.secondary">REVERSO</Typography>
                                <CredentialBack
                                    employeeCode={credentialEmployee.employee_id}
                                    email={credentialEmployee.email}
                                    issueDate={new Date().toLocaleDateString('en-GB')}
                                    expiryDate={new Date(new Date().setFullYear(new Date().getFullYear() + 5)).toLocaleDateString('en-GB')}
                                    serial={`SN-${credentialEmployee.employee_id}-${String(credentialEmployee.first_name).slice(0, 2).toUpperCase()}${String(credentialEmployee.last_name).slice(0, 2).toUpperCase()}`}
                                    {...credDesignBack}
                                />
                            </Box>
                        </>
                    )}
                </DialogContent>
                <Box sx={{ p: 2, display: 'flex', gap: 1, justifyContent: 'flex-end', bgcolor: 'background.paper', borderTop: '1px solid', borderColor: 'divider' }}>
                    <Button variant="outlined" onClick={() => setCredentialOpen(false)} sx={{ borderRadius: '8px' }}>
                        Cerrar
                    </Button>
                    <Button variant="contained" onClick={() => window.print()} sx={{ borderRadius: '8px', bgcolor: '#E63946', '&:hover': { bgcolor: '#B71C1C' } }}>
                        Imprimir / Descargar PDF
                    </Button>
                </Box>
            </Dialog>
        </Box>
    );
}
