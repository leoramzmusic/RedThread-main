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
import PeopleIcon from '@mui/icons-material/People';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PublicIcon from '@mui/icons-material/Public';

interface Stats {
    overview: {
        total: number;
        verified: number;
        active_7d: number;
        new: {
            today: number;
            week: number;
            month: number;
        };
    };
    distribution: {
        status: {
            active: number;
            suspended: number;
            banned: number;
        };
        countries: { name: string; value: number }[];
    };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function UserStatsDashboard() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await adminApiClient.get('/portal-redthread/usuarios/dashboard-stats');
                setStats(response.data);
            } catch (error) {
                console.error('Error fetching dashboard stats:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
        const interval = setInterval(fetchStats, 60000); // 1 min auto-refresh
        return () => clearInterval(interval);
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
        { name: 'Activos', value: stats.distribution.status.active, color: '#4caf50' },
        { name: 'Suspendidos', value: stats.distribution.status.suspended, color: '#ff9800' },
        { name: 'Baneados', value: stats.distribution.status.banned, color: '#f44336' },
    ].filter(d => d.value > 0);

    return (
        <Box sx={{ mb: 4 }}>
            <Grid container spacing={2}>
                {/* Total Users */}
                <Grid item xs={12} sm={6} md={3}>
                    <Card elevation={2}>
                        <CardContent>
                            <Box display="flex" justifyContent="space-between" alignItems="center">
                                <Box>
                                    <Typography color="text.secondary" variant="overline">Total Usuarios</Typography>
                                    <Typography variant="h4" fontWeight={700}>{stats.overview.total}</Typography>
                                </Box>
                                <PeopleIcon color="primary" sx={{ fontSize: 40, opacity: 0.3 }} />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* New Today */}
                <Grid item xs={12} sm={6} md={3}>
                    <Card elevation={2}>
                        <CardContent>
                            <Box display="flex" justifyContent="space-between" alignItems="center">
                                <Box>
                                    <Typography color="text.secondary" variant="overline">Nuevos Hoy</Typography>
                                    <Typography variant="h4" fontWeight={700} color="success.main">
                                        +{stats.overview.new.today}
                                    </Typography>
                                </Box>
                                <PersonAddIcon color="success" sx={{ fontSize: 40, opacity: 0.3 }} />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Active 7d */}
                <Grid item xs={12} sm={6} md={3}>
                    <Card elevation={2}>
                        <CardContent>
                            <Box display="flex" justifyContent="space-between" alignItems="center">
                                <Box>
                                    <Typography color="text.secondary" variant="overline">Activos (7d)</Typography>
                                    <Typography variant="h4" fontWeight={700}>{stats.overview.active_7d}</Typography>
                                </Box>
                                <CheckCircleIcon color="info" sx={{ fontSize: 40, opacity: 0.3 }} />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Verified */}
                <Grid item xs={12} sm={6} md={3}>
                    <Card elevation={2}>
                        <CardContent>
                            <Box display="flex" justifyContent="space-between" alignItems="center">
                                <Box>
                                    <Typography color="text.secondary" variant="overline">Verificados</Typography>
                                    <Typography variant="h4" fontWeight={700} color="primary.main">{stats.overview.verified}</Typography>
                                </Box>
                                <CheckCircleIcon color="primary" sx={{ fontSize: 40, opacity: 0.3 }} />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Charts */}
            <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2, height: 300 }}>
                        <Typography variant="subtitle1" fontWeight={600} gutterBottom>Distribución por Estado</Typography>
                        <Divider sx={{ mb: 2 }} />
                        <ResponsiveContainer width="100%" height="80%">
                            <PieChart>
                                <Pie
                                    data={statusData}
                                    cx="50%"
                                    cy="50%"
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
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2, height: 300 }}>
                        <Box display="flex" alignItems="center" mb={1}>
                            <PublicIcon sx={{ mr: 1, color: 'primary.main' }} />
                            <Typography variant="subtitle1" fontWeight={600}>Top Países</Typography>
                        </Box>
                        <Divider sx={{ mb: 2 }} />
                        <Box sx={{ mt: 2 }}>
                            {stats.distribution.countries.map((country, idx) => (
                                <Box key={country.name} sx={{ mb: 2 }}>
                                    <Box display="flex" justifyContent="space-between" mb={0.5}>
                                        <Typography variant="body2">{country.name || 'Desconocido'}</Typography>
                                        <Typography variant="body2" fontWeight={600}>{country.value}</Typography>
                                    </Box>
                                    <Box sx={{
                                        height: 8,
                                        width: '100%',
                                        bgcolor: 'grey.100',
                                        borderRadius: 4,
                                        overflow: 'hidden'
                                    }}>
                                        <Box sx={{
                                            height: '100%',
                                            width: `${(country.value / stats.overview.total) * 100}%`,
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
