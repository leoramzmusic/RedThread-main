import { useState, useEffect, useCallback } from 'react';
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
} from '@mui/icons-material';
import { useRouter } from 'next/router';
import adminApiClient from '../../services/adminApi';
import EmployeeFilters from './EmployeeFilters';
import EmployeeStatsDashboard from './EmployeeStatsDashboard';
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

            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} gap={2} flexWrap="wrap">
                <TextField
                    placeholder="Buscar por nombre, email o ID interno..."
                    size="small"
                    sx={{ width: { xs: '100%', md: 400 } }}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon color="action" />
                            </InputAdornment>
                        ),
                    }}
                />

                <Box display="flex" gap={1} alignItems="center">
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
                </Box>
            </Box>

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
                                    {employees.map((e) => (
                                        <TableRow key={e.id} hover>
                                            <TableCell>
                                                <Box display="flex" alignItems="center" gap={1.5}>
                                                    <Avatar src={e.avatar || undefined} sx={{ width: 32, height: 32 }} />
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
                            {employees.map((e) => (
                                <Grid item xs={12} sm={6} md={4} lg={3} key={e.id}>
                                    <Card sx={{ borderRadius: 2 }}>
                                        <CardContent sx={{ pb: 1 }}>
                                            <Box display="flex" flexDirection="column" alignItems="center" textAlign="center">
                                                <Avatar src={e.avatar || undefined} sx={{ width: 64, height: 64, mb: 1.5 }} />
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
        </Box>
    );
}
