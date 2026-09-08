import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
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
} from '@mui/material';
import {
    Search as SearchIcon,
    MoreVert as MoreVertIcon,
    Visibility as VisibilityIcon,
    Block as BlockIcon,
    Delete as DeleteIcon,
    Email as EmailIcon,
    Download as DownloadIcon,
    ViewList as ViewListIcon,
    ViewModule as ViewModuleIcon,
    Verified as VerifiedIcon,
} from '@mui/icons-material';
import adminApiClient from '../../services/adminApi';
import UserFilters from './UserFilters';
import { useDebouncedCallback } from 'use-debounce';

interface User {
    id: string;
    email: string;
    display_name: string;
    nickname: string;
    photo: string | null;
    account_status: string;
    is_verified: boolean;
    subscription_tier: string;
    created_at: string;
    last_active: string | null;
    location?: {
        country: string;
        state: string;
        city: string;
    };
    stats: {
        relationships: number;
        reports_received: number;
        profile_completion: number;
    };
}

export default function UsersList() {
    const router = useRouter();
    const [users, setUsers] = useState<User[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(50);
    const [search, setSearch] = useState('');
    const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
    const [filters, setFilters] = useState<any>({});

    // Menu state
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const params = {
                search,
                limit: rowsPerPage,
                offset: page * rowsPerPage,
                ...filters,
            };
            const response = await adminApiClient.get('/portal-redthread/usuarios/listado', { params });
            setUsers(response.data.users);
            setTotal(response.data.total);
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    }, [page, rowsPerPage, search, filters]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

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

    const handleActionClick = (event: React.MouseEvent<HTMLElement>, userId: string) => {
        setAnchorEl(event.currentTarget);
        setSelectedUserId(userId);
    };

    const handleActionClose = () => {
        setAnchorEl(null);
        setSelectedUserId(null);
    };

    const handleExport = async (format: 'json' | 'csv') => {
        try {
            const response = await adminApiClient.get('/portal-redthread/usuarios/exportar', {
                params: { format },
                responseType: format === 'csv' ? 'blob' : 'json'
            });

            const blob = new Blob([format === 'csv' ? response.data : JSON.stringify(response.data, null, 2)], {
                type: format === 'csv' ? 'text/csv' : 'application/json',
            });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `usuarios_${new Date().toISOString().split('T')[0]}.${format}`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Export failed:', error);
        }
    };

    const getStatusChip = (status: string) => {
        const configs: any = {
            active: { label: 'Activo', color: 'success' },
            suspended: { label: 'Suspendido', color: 'warning' },
            banned: { label: 'Baneado', color: 'error' },
            deleted: { label: 'Eliminado', color: 'default' },
        };
        const config = configs[status] || configs.active;
        return <Chip label={config.label} color={config.color} size="small" variant="outlined" />;
    };

    return (
        <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} gap={2} flexWrap="wrap">
                <TextField
                    placeholder="Buscar por nombre, email, ID o alias..."
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

                    <Button
                        variant="contained"
                        startIcon={<DownloadIcon />}
                        onClick={() => handleExport('csv')}
                    >
                        Exportar
                    </Button>
                </Box>
            </Box>

            <UserFilters
                filters={filters}
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
                        <TableContainer component={Paper} elevation={1}>
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
                                        <TableCell>Usuario</TableCell>
                                        <TableCell>Estado</TableCell>
                                        <TableCell>Nivel</TableCell>
                                        <TableCell>Ubicación</TableCell>
                                        <TableCell>Registro</TableCell>
                                        <TableCell>Actividad</TableCell>
                                        <TableCell align="right">Acciones</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {users.map((user) => (
                                        <TableRow key={user.id} hover>
                                            <TableCell>
                                                <Box
                                                    display="flex"
                                                    alignItems="center"
                                                    gap={2}
                                                    sx={{ cursor: 'pointer', '&:hover': { color: 'primary.main' } }}
                                                    onClick={() => router.push(`/portal-redthread/usuarios/${user.id}`)}
                                                >
                                                    <Avatar src={user.photo || undefined} />
                                                    <Box>
                                                        <Typography variant="body2" fontWeight={600}>
                                                            {user.display_name} {user.is_verified && <VerifiedIcon sx={{ fontSize: 14, color: 'primary.main', ml: 0.5 }} />}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary">{user.email}</Typography>
                                                    </Box>
                                                </Box>
                                            </TableCell>
                                            <TableCell>{getStatusChip(user.account_status)}</TableCell>
                                            <TableCell><Chip label={user.subscription_tier.toUpperCase()} size="small" variant="filled" color={user.subscription_tier === 'vip' ? 'secondary' : 'default'} /></TableCell>
                                            <TableCell>
                                                <Typography variant="caption">
                                                    {user.location ? `${user.location.city || ''}, ${user.location.country || ''}` : 'N/A'}
                                                </Typography>
                                            </TableCell>
                                            <TableCell><Typography variant="caption">{new Date(user.created_at).toLocaleDateString()}</Typography></TableCell>
                                            <TableCell>
                                                <Typography variant="caption">
                                                    {user.last_active ? new Date(user.last_active).toLocaleString() : 'N/A'}
                                                </Typography>
                                            </TableCell>
                                            <TableCell align="right">
                                                <IconButton size="small" onClick={(e) => handleActionClick(e, user.id)}>
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
                            {users.map((user) => (
                                <Grid item xs={12} sm={6} md={4} lg={3} key={user.id}>
                                    <Card>
                                        <CardContent sx={{ pb: 1 }}>
                                            <Box display="flex" flexDirection="column" alignItems="center" textAlign="center">
                                                <Avatar src={user.photo || undefined} sx={{ width: 80, height: 80, mb: 1.5 }} />
                                                <Typography variant="subtitle1" fontWeight={700}>
                                                    {user.display_name}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary" gutterBottom>
                                                    {user.email}
                                                </Typography>
                                                <Box mt={1} mb={1}>
                                                    {getStatusChip(user.account_status)}
                                                </Box>
                                                <Typography variant="caption" color="text.secondary">
                                                    {user.location?.city || 'Sin ubicación'}
                                                </Typography>
                                            </Box>
                                        </CardContent>
                                        <CardActions sx={{ justifyContent: 'center', pb: 2 }}>
                                            <Tooltip title="Ver Perfil">
                                                <IconButton
                                                    size="small"
                                                    color="primary"
                                                    onClick={() => router.push(`/portal-redthread/usuarios/${user.id}`)}
                                                >
                                                    <VisibilityIcon />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Contactar">
                                                <IconButton size="small">
                                                    <EmailIcon />
                                                </IconButton>
                                            </Tooltip>
                                            <IconButton size="small" onClick={(e) => handleActionClick(e, user.id)}>
                                                <MoreVertIcon />
                                            </IconButton>
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
                        rowsPerPageOptions={[50, 100, 500]}
                        labelRowsPerPage="Usuarios por bloque:"
                    />
                </>
            )}

            {/* Quick Actions Menu */}
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleActionClose}
            >
                <MenuItem onClick={() => { handleActionClose(); router.push(`/portal-redthread/usuarios/${selectedUserId}`); }}>
                    <ListItemIcon><VisibilityIcon fontSize="small" /></ListItemIcon>
                    Ver Perfil Completo
                </MenuItem>
                <MenuItem onClick={handleActionClose}>
                    <ListItemIcon><BlockIcon fontSize="small" /></ListItemIcon>
                    Suspender Usuario
                </MenuItem>
                <MenuItem onClick={handleActionClose} sx={{ color: 'error.main' }}>
                    <ListItemIcon><DeleteIcon fontSize="small" color="error" /></ListItemIcon>
                    Eliminar Cuenta
                </MenuItem>
            </Menu>
        </Box>
    );
}
