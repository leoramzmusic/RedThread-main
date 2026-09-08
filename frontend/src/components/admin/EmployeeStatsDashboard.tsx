import { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Grid,
    Typography,
    CircularProgress,
    Card,
    CardContent,
    Divider,
} from '@mui/material';
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip as RechartsTooltip,
    Legend,
} from 'recharts';
import adminApiClient from '../../services/adminApi';
import BadgeIcon from '@mui/icons-material/Badge';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import BusinessIcon from '@mui/icons-material/Business';

interface Stats {
    summary: {
        total: number;
        active: number;
        suspended: number;
        new_this_month: number;
    };
    distribution: {
        areas: { name: string; value: number }[];
        roles: { name: string; value: number }[];
    };
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899'];

export default function EmployeeStatsDashboard() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await adminApiClient.get('/portal-redthread/empleados/dashboard-stats');
                setStats(response.data);
            } catch (error) {
                console.error('Error fetching employee stats:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" p={4}>
                <CircularProgress />
            </Box>
        );
    }

    if (!stats) return null;

    const statusData = [
        { name: 'Activos', value: stats.summary.active, color: '#10b981' },
        { name: 'Suspendidos', value: stats.summary.suspended, color: '#f59e0b' },
    ].filter(d => d.value > 0);

    return (
        <Box sx={{ mb: 4 }}>
            <Grid container spacing={2}>
                {/* Total Employees */}
                <Grid item xs={12} sm={6} md={3}>
                    <Card elevation={2} sx={{ borderRadius: 2 }}>
                        <CardContent>
                            <Box display="flex" justifyContent="space-between" alignItems="center">
                                <Box>
                                    <Typography color="text.secondary" variant="overline">Total Empleados</Typography>
                                    <Typography variant="h4" fontWeight={700}>{stats.summary.total}</Typography>
                                </Box>
                                <BadgeIcon color="primary" sx={{ fontSize: 40, opacity: 0.3 }} />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Active */}
                <Grid item xs={12} sm={6} md={3}>
                    <Card elevation={2} sx={{ borderRadius: 2 }}>
                        <CardContent>
                            <Box display="flex" justifyContent="space-between" alignItems="center">
                                <Box>
                                    <Typography color="text.secondary" variant="overline">Activos</Typography>
                                    <Typography variant="h4" fontWeight={700} color="success.main">
                                        {stats.summary.active}
                                    </Typography>
                                </Box>
                                <CheckCircleIcon color="success" sx={{ fontSize: 40, opacity: 0.3 }} />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* New This Month */}
                <Grid item xs={12} sm={6} md={3}>
                    <Card elevation={2} sx={{ borderRadius: 2 }}>
                        <CardContent>
                            <Box display="flex" justifyContent="space-between" alignItems="center">
                                <Box>
                                    <Typography color="text.secondary" variant="overline">Nuevos Ingresos</Typography>
                                    <Typography variant="h4" fontWeight={700} color="info.main">{stats.summary.new_this_month}</Typography>
                                </Box>
                                <GroupAddIcon color="info" sx={{ fontSize: 40, opacity: 0.3 }} />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Avg Retention or something else - reusing BusinessIcon */}
                <Grid item xs={12} sm={6} md={3}>
                    <Card elevation={2} sx={{ borderRadius: 2 }}>
                        <CardContent>
                            <Box display="flex" justifyContent="space-between" alignItems="center">
                                <Box>
                                    <Typography color="text.secondary" variant="overline">Departamentos</Typography>
                                    <Typography variant="h4" fontWeight={700}>{stats.distribution.areas.length}</Typography>
                                </Box>
                                <BusinessIcon color="secondary" sx={{ fontSize: 40, opacity: 0.3 }} />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Charts */}
            <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2, height: 320, borderRadius: 2 }}>
                        <Typography variant="subtitle1" fontWeight={600} gutterBottom>Distribución por Estado</Typography>
                        <Divider sx={{ mb: 2 }} />
                        <ResponsiveContainer width="100%" height="80%">
                            <PieChart>
                                <Pie
                                    data={statusData}
                                    cx="50%"
                                    cy="40%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {statusData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <RechartsTooltip />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                    </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2, height: 320, borderRadius: 2 }}>
                        <Box display="flex" alignItems="center" mb={1}>
                            <BusinessIcon sx={{ mr: 1, color: 'primary.main' }} />
                            <Typography variant="subtitle1" fontWeight={600}>Distribución por Área</Typography>
                        </Box>
                        <Divider sx={{ mb: 2 }} />
                        <Box sx={{ mt: 1, maxHeight: 220, overflowY: 'auto', pr: 1 }}>
                            {stats.distribution.areas.slice(0, 5).map((area, idx) => (
                                <Box key={area.name} sx={{ mb: 2 }}>
                                    <Box display="flex" justifyContent="space-between" mb={0.5}>
                                        <Typography variant="body2" fontWeight={500}>{area.name}</Typography>
                                        <Typography variant="body2" color="text.secondary">{area.value}</Typography>
                                    </Box>
                                    <Box sx={{
                                        height: 6,
                                        width: '100%',
                                        bgcolor: 'rgba(0,0,0,0.05)',
                                        borderRadius: 3,
                                        overflow: 'hidden'
                                    }}>
                                        <Box sx={{
                                            height: '100%',
                                            width: `${(area.value / stats.summary.total) * 100}%`,
                                            bgcolor: COLORS[idx % COLORS.length]
                                        }} />
                                    </Box>
                                </Box>
                            ))}
                        </Box>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
}
