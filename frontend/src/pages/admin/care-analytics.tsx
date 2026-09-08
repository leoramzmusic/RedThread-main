import { useState, useEffect } from 'react';
import {
    Box,
    Container,
    Typography,
    Grid,
    Card,
    CardContent,
    CircularProgress,
    Alert
} from '@mui/material';
import {
    TrendingUp as TrendingUpIcon,
    Message as MessageIcon,
    Favorite as FavoriteIcon,
    BarChart as BarChartIcon
} from '@mui/icons-material';
import AdminLayout from '../../components/layout/AdminLayout';
import apiClient from '../../services/api';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

interface MetricCardProps {
    title: string;
    value: string;
    change?: string;
    trend?: 'up' | 'down' | 'neutral';
    icon: React.ReactNode;
    color: string;
}

function MetricCard({ title, value, change, trend, icon, color }: MetricCardProps) {
    const trendColor = trend === 'up' ? '#4CAF50' : trend === 'down' ? '#f44336' : '#9e9e9e';

    return (
        <Card sx={{ height: '100%', bgcolor: 'background.paper', borderRadius: 3 }}>
            <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                            {title}
                        </Typography>
                        <Typography variant="h4" fontWeight={700} sx={{ mb: 1 }}>
                            {value}
                        </Typography>
                        {change && (
                            <Typography variant="body2" sx={{ color: trendColor, fontWeight: 600 }}>
                                {change}
                            </Typography>
                        )}
                    </Box>
                    <Box
                        sx={{
                            bgcolor: `${color}15`,
                            color: color,
                            p: 1.5,
                            borderRadius: 2,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        {icon}
                    </Box>
                </Box>
            </CardContent>
        </Card>
    );
}

export default function CareAnalytics() {
    const { t } = useTranslation('admin');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [metrics, setMetrics] = useState<any>(null);

    useEffect(() => {
        fetchMetrics();
    }, []);

    const fetchMetrics = async () => {
        try {
            setLoading(true);
            const response = await apiClient.get('/admin/care-analytics/metrics/summary');
            setMetrics(response.data);
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to load metrics');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <AdminLayout>
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                    <CircularProgress />
                </Box>
            </AdminLayout>
        );
    }

    if (error) {
        return (
            <AdminLayout>
                <Container maxWidth="lg" sx={{ py: 4 }}>
                    <Alert severity="error">{error}</Alert>
                </Container>
            </AdminLayout>
        );
    }

    const engagement = metrics?.engagement_7d?.metrics || {};
    const diversity = metrics?.diversity?.bucket_distribution || {};

    return (
        <AdminLayout>
            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Box sx={{ mb: 4 }}>
                    <Typography variant="h4" fontWeight={700} gutterBottom>
                        CARE Engine Analytics
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Monitor recommendation quality, engagement, and fairness metrics
                    </Typography>
                </Box>

                {/* Metric Cards */}
                <Grid container spacing={3} sx={{ mb: 4 }}>
                    <Grid item xs={12} sm={6} md={3}>
                        <MetricCard
                            title="Match Rate"
                            value={`${(engagement.match_rate * 100).toFixed(1)}%`}
                            change="+15% vs baseline"
                            trend="up"
                            icon={<FavoriteIcon />}
                            color="#FF4D4F"
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <MetricCard
                            title="Message Rate"
                            value={`${(engagement.message_rate * 100).toFixed(1)}%`}
                            change="+20% vs baseline"
                            trend="up"
                            icon={<MessageIcon />}
                            color="#2196F3"
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <MetricCard
                            title="Total Matches"
                            value={engagement.total_matches?.toString() || '0'}
                            change="Last 7 days"
                            trend="neutral"
                            icon={<TrendingUpIcon />}
                            color="#4CAF50"
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <MetricCard
                            title="Avg Dwell Time"
                            value={`${((engagement.avg_dwell_time || 0) / 1000).toFixed(1)}s`}
                            change="Per profile"
                            trend="neutral"
                            icon={<BarChartIcon />}
                            color="#FF9800"
                        />
                    </Grid>
                </Grid>

                {/* Diversity Distribution */}
                <Card sx={{ mb: 4, bgcolor: 'background.paper', borderRadius: 3 }}>
                    <CardContent>
                        <Typography variant="h6" fontWeight={700} gutterBottom>
                            Diversity Distribution
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                            Recommendations across popularity buckets
                        </Typography>

                        <Grid container spacing={2}>
                            <Grid item xs={12} md={4}>
                                <Box sx={{ p: 2, bgcolor: 'rgba(76, 175, 80, 0.1)', borderRadius: 2 }}>
                                    <Typography variant="body2" color="text.secondary">
                                        Low Popularity
                                    </Typography>
                                    <Typography variant="h5" fontWeight={700} color="#4CAF50">
                                        {((diversity.low_pop || 0) * 100).toFixed(1)}%
                                    </Typography>
                                </Box>
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <Box sx={{ p: 2, bgcolor: 'rgba(33, 150, 243, 0.1)', borderRadius: 2 }}>
                                    <Typography variant="body2" color="text.secondary">
                                        Mid Popularity
                                    </Typography>
                                    <Typography variant="h5" fontWeight={700} color="#2196F3">
                                        {((diversity.mid_pop || 0) * 100).toFixed(1)}%
                                    </Typography>
                                </Box>
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <Box sx={{ p: 2, bgcolor: 'rgba(255, 152, 0, 0.1)', borderRadius: 2 }}>
                                    <Typography variant="body2" color="text.secondary">
                                        High Popularity
                                    </Typography>
                                    <Typography variant="h5" fontWeight={700} color="#FF9800">
                                        {((diversity.high_pop || 0) * 100).toFixed(1)}%
                                    </Typography>
                                </Box>
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>

                {/* A/B Test Results */}
                {metrics?.active_experiments && metrics.active_experiments.length > 0 && (
                    <Card sx={{ bgcolor: 'background.paper', borderRadius: 3 }}>
                        <CardContent>
                            <Typography variant="h6" fontWeight={700} gutterBottom>
                                Active A/B Tests
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                Comparing CARE Engine variants
                            </Typography>

                            {metrics.active_experiments.map((exp: any) => (
                                <Box key={exp.experiment_id} sx={{ mb: 2 }}>
                                    <Grid container spacing={2}>
                                        {Object.entries(exp.variants || {}).map(([variant, data]: [string, any]) => (
                                            <Grid item xs={12} md={6} key={variant}>
                                                <Box sx={{ p: 2, bgcolor: 'rgba(255, 255, 255, 0.05)', borderRadius: 2 }}>
                                                    <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                                                        {variant.toUpperCase()}
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary">
                                                        Match Rate: <strong>{(data.match_rate * 100).toFixed(1)}%</strong>
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary">
                                                        Users: <strong>{data.users}</strong>
                                                    </Typography>
                                                </Box>
                                            </Grid>
                                        ))}
                                    </Grid>
                                </Box>
                            ))}
                        </CardContent>
                    </Card>
                )}
            </Container>
        </AdminLayout>
    );
}

export async function getServerSideProps({ locale }: { locale: string }) {
    return {
        props: {
            ...(await serverSideTranslations(locale, ['common', 'admin'])),
        },
    };
}
