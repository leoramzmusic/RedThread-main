import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
    Box,
    Container,
    Typography,
    Paper,
    Grid,
    Avatar,
    Chip,
    Button,
    Divider,
    CircularProgress,
    Alert,
    Stack,
    IconButton,
    Card,
    CardContent,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Tooltip,
} from '@mui/material';
import {
    ArrowBack as BackIcon,
    Verified as VerifiedIcon,
    Email as EmailIcon,
    CalendarToday as CalendarIcon,
    LocationOn as LocationIcon,
    Block as BlockIcon,
    CheckCircle as CheckCircleIcon,
    Warning as WarningIcon,
    History as HistoryIcon,
    Person as PersonIcon,
    People as PeopleIcon,
    Favorite as MatchIcon,
    Report as ReportIcon,
    Flag as FlagIcon,
} from '@mui/icons-material';
import AdminLayout from '../../../components/layout/AdminLayout';
import adminApiClient from '../../../services/adminApi';

interface UserDetail {
    id: string;
    email: string;
    account_status: string;
    is_verified: boolean;
    created_at: string;
    last_active: string | null;
    profile: {
        display_name: string;
        age: number | null;
        gender: string | null;
        city: string | null;
        bio: string | null;
        photos_count: number;
        profile_completion: number;
        relationship_status: string | null;
    };
    statistics: {
        total_relationships: number;
        matches: number;
        friends: number;
        reports_made: number;
        reports_received: number;
    };
    recent_reports: Array<{
        id: string;
        reason: string;
        status: string;
        created_at: string;
    }>;
}

export default function UserDetailPage() {
    const router = useRouter();
    const { id } = router.query;
    const [user, setUser] = useState<UserDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        if (!id) return;

        const fetchUser = async () => {
            try {
                setLoading(true);
                const response = await adminApiClient.get(`/portal-redthread/usuarios/${id}`);
                setUser(response.data);
            } catch (err: any) {
                console.error('Error fetching user details:', err);
                setError(err.response?.data?.detail || 'Error al cargar los detalles del usuario');
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
    }, [id]);

    const handleStatusChange = async (newStatus: string) => {
        if (!id) return;

        const reason = prompt(`Razón para cambiar el estado a ${newStatus}:`);
        if (!reason) return;

        try {
            setActionLoading(true);
            await adminApiClient.put(`/portal-redthread/usuarios/${id}/estado`, {
                status: newStatus,
                reason: reason
            });
            // Refresh data
            const response = await adminApiClient.get(`/portal-redthread/usuarios/${id}`);
            setUser(response.data);
        } catch (err: any) {
            console.error('Error updating user status:', err);
            alert(err.response?.data?.detail || 'Error al actualizar el estado');
        } finally {
            setActionLoading(false);
        }
    };

    const getStatusChip = (status: string) => {
        const configs: any = {
            active: { label: 'Activo', color: 'success', icon: <CheckCircleIcon /> },
            suspended: { label: 'Suspendido', color: 'warning', icon: <BlockIcon /> },
            banned: { label: 'Baneado', color: 'error', icon: <FlagIcon /> },
            deleted: { label: 'Eliminado', color: 'default', icon: <ReportIcon /> },
        };
        const config = configs[status] || configs.active;
        return <Chip icon={config.icon} label={config.label} color={config.color} variant="filled" />;
    };

    if (loading) {
        return (
            <AdminLayout>
                <Box display="flex" justifyContent="center" py={10}>
                    <CircularProgress />
                </Box>
            </AdminLayout>
        );
    }

    if (error || !user) {
        return (
            <AdminLayout>
                <Container>
                    <Alert severity="error" sx={{ mt: 4 }}>
                        {error || 'Usuario no encontrado'}
                    </Alert>
                    <Button
                        startIcon={<BackIcon />}
                        onClick={() => router.push('/portal-redthread/usuarios/listado')}
                        sx={{ mt: 2 }}
                    >
                        Volver al listado
                    </Button>
                </Container>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <Container maxWidth="xl">
                <Box sx={{ py: 4 }}>
                    {/* Header Action Bar */}
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                        <Button
                            startIcon={<BackIcon />}
                            onClick={() => router.push('/portal-redthread/usuarios/listado')}
                        >
                            Volver al listado
                        </Button>
                        <Box display="flex" gap={1}>
                            {user.account_status !== 'active' && (
                                <Button
                                    variant="outlined"
                                    color="success"
                                    startIcon={<CheckCircleIcon />}
                                    onClick={() => handleStatusChange('active')}
                                    disabled={actionLoading}
                                >
                                    Activar
                                </Button>
                            )}
                            {user.account_status !== 'suspended' && (
                                <Button
                                    variant="outlined"
                                    color="warning"
                                    startIcon={<BlockIcon />}
                                    onClick={() => handleStatusChange('suspended')}
                                    disabled={actionLoading}
                                >
                                    Suspender
                                </Button>
                            )}
                            {user.account_status !== 'banned' && (
                                <Button
                                    variant="outlined"
                                    color="error"
                                    startIcon={<FlagIcon />}
                                    onClick={() => handleStatusChange('banned')}
                                    disabled={actionLoading}
                                >
                                    Banear
                                </Button>
                            )}
                        </Box>
                    </Box>

                    <Grid container spacing={3}>
                        {/* Profile Summary Card */}
                        <Grid item xs={12} md={4}>
                            <Paper sx={{ p: 4, textAlign: 'center', height: '100%' }}>
                                <Avatar
                                    sx={{ width: 120, height: 120, mx: 'auto', mb: 2, fontSize: '3rem' }}
                                >
                                    {user.profile.display_name[0]}
                                </Avatar>
                                <Typography variant="h5" fontWeight={700}>
                                    {user.profile.display_name}
                                    {user.is_verified && (
                                        <Tooltip title="Verificado">
                                            <VerifiedIcon color="primary" sx={{ ml: 1, verticalAlign: 'middle' }} />
                                        </Tooltip>
                                    )}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                    {user.email}
                                </Typography>
                                <Box my={2}>
                                    {getStatusChip(user.account_status)}
                                </Box>
                                <Divider sx={{ my: 3 }} />
                                <Stack spacing={2} textAlign="left">
                                    <Box display="flex" alignItems="center" gap={1.5}>
                                        <CalendarIcon fontSize="small" color="action" />
                                        <Typography variant="body2">
                                            Miembro desde: <b>{new Date(user.created_at).toLocaleDateString()}</b>
                                        </Typography>
                                    </Box>
                                    <Box display="flex" alignItems="center" gap={1.5}>
                                        <HistoryIcon fontSize="small" color="action" />
                                        <Typography variant="body2">
                                            Última actividad: <b>{user.last_active ? new Date(user.last_active).toLocaleString() : 'N/A'}</b>
                                        </Typography>
                                    </Box>
                                    <Box display="flex" alignItems="center" gap={1.5}>
                                        <LocationIcon fontSize="small" color="action" />
                                        <Typography variant="body2">
                                            Ubicación: <b>{user.profile.city || 'Desconocida'}</b>
                                        </Typography>
                                    </Box>
                                    <Box sx={{ mt: 2 }}>
                                        <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                                            Completitud del perfil
                                        </Typography>
                                        <Box display="flex" alignItems="center" gap={1}>
                                            <Box sx={{ flexGrow: 1, height: 8, bgcolor: 'grey.100', borderRadius: 4, overflow: 'hidden' }}>
                                                <Box sx={{
                                                    width: `${user.profile.profile_completion}%`,
                                                    height: '100%',
                                                    bgcolor: user.profile.profile_completion > 80 ? 'success.main' : 'primary.main'
                                                }} />
                                            </Box>
                                            <Typography variant="caption" fontWeight={700}>
                                                {user.profile.profile_completion}%
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Stack>
                            </Paper>
                        </Grid>

                        {/* Detailed Tabs/Content */}
                        <Grid item xs={12} md={8}>
                            <Stack spacing={3}>
                                {/* Statistics Cards */}
                                <Grid container spacing={2}>
                                    {[
                                        { label: 'Relaciones', value: user.statistics.total_relationships, icon: <PeopleIcon color="primary" />, color: 'primary.light' },
                                        { label: 'Matches', value: user.statistics.matches, icon: <MatchIcon color="error" />, color: 'error.light' },
                                        { label: 'Reportes Recibidos', value: user.statistics.reports_received, icon: <WarningIcon color="warning" />, color: 'warning.light' },
                                        { label: 'Reportes Enviados', value: user.statistics.reports_made, icon: <FlagIcon color="info" />, color: 'info.light' },
                                    ].map((stat, i) => (
                                        <Grid item xs={6} sm={3} key={i}>
                                            <Card elevation={0} sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
                                                <CardContent sx={{ textAlign: 'center', py: 2 }}>
                                                    <Box sx={{ p: 1, borderRadius: 2, display: 'inline-flex', mb: 1 }}>
                                                        {stat.icon}
                                                    </Box>
                                                    <Typography variant="h5" fontWeight={800}>{stat.value}</Typography>
                                                    <Typography variant="caption" color="text.secondary">{stat.label}</Typography>
                                                </CardContent>
                                            </Card>
                                        </Grid>
                                    ))}
                                </Grid>

                                {/* Profile Details */}
                                <Paper sx={{ p: 3 }}>
                                    <Typography variant="subtitle1" fontWeight={700} gutterBottom display="flex" alignItems="center" gap={1}>
                                        <PersonIcon fontSize="small" /> Información de Perfil
                                    </Typography>
                                    <Grid container spacing={2} sx={{ mt: 1 }}>
                                        <Grid item xs={6} sm={4}>
                                            <Typography variant="caption" color="text.secondary">Edad</Typography>
                                            <Typography variant="body2" fontWeight={600}>{user.profile.age || 'N/A'}</Typography>
                                        </Grid>
                                        <Grid item xs={6} sm={4}>
                                            <Typography variant="caption" color="text.secondary">Género</Typography>
                                            <Typography variant="body2" fontWeight={600}>{user.profile.gender || 'N/A'}</Typography>
                                        </Grid>
                                        <Grid item xs={6} sm={4}>
                                            <Typography variant="caption" color="text.secondary">Estado Civil</Typography>
                                            <Typography variant="body2" fontWeight={600}>{user.profile.relationship_status || 'N/A'}</Typography>
                                        </Grid>
                                        <Grid item xs={12}>
                                            <Typography variant="caption" color="text.secondary">Bio / Presentación</Typography>
                                            <Typography variant="body2" sx={{ fontStyle: user.profile.bio ? 'normal' : 'italic' }}>
                                                {user.profile.bio || 'Sin descripción'}
                                            </Typography>
                                        </Grid>
                                    </Grid>
                                </Paper>

                                {/* Recent Reports */}
                                <Paper sx={{ p: 3 }}>
                                    <Typography variant="subtitle1" fontWeight={700} gutterBottom display="flex" alignItems="center" gap={1}>
                                        <ReportIcon fontSize="small" color="error" /> Reportes Recientes Recibidos
                                    </Typography>
                                    {user.recent_reports.length > 0 ? (
                                        <TableContainer sx={{ mt: 2 }}>
                                            <Table size="small">
                                                <TableHead>
                                                    <TableRow>
                                                        <TableCell sx={{ fontWeight: 700 }}>Fecha</TableCell>
                                                        <TableCell sx={{ fontWeight: 700 }}>Motivo</TableCell>
                                                        <TableCell sx={{ fontWeight: 700 }}>Estado</TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {user.recent_reports.map((report) => (
                                                        <TableRow key={report.id}>
                                                            <TableCell>{new Date(report.created_at).toLocaleDateString()}</TableCell>
                                                            <TableCell>{report.reason}</TableCell>
                                                            <TableCell>
                                                                <Chip
                                                                    label={report.status}
                                                                    size="small"
                                                                    color={report.status === 'open' ? 'error' : 'default'}
                                                                    variant="outlined"
                                                                />
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </TableContainer>
                                    ) : (
                                        <Box py={4} textAlign="center">
                                            <Typography variant="body2" color="text.secondary">
                                                Este usuario no tiene reportes negativos.
                                            </Typography>
                                        </Box>
                                    )}
                                </Paper>
                            </Stack>
                        </Grid>
                    </Grid>
                </Box>
            </Container>
        </AdminLayout>
    );
}
