import { useState, useEffect } from 'react';
import {
    Box,
    Container,
    Typography,
    Grid,
    Card,
    CardContent,
    Button,
    Stack,
    CircularProgress,
    Alert,
} from '@mui/material';
import {
    Flag as FlagIcon,
    Pending as PendingIcon,
    Rule as RuleIcon,
    Assignment as AssignmentIcon,
} from '@mui/icons-material';
import AdminLayout from '../../../components/layout/AdminLayout';
import adminApiClient from '../../../services/adminApi';
import ReportTable from '../../../components/admin/reports/ReportTable';
import ReportDetailDialog from '../../../components/admin/reports/ReportDetailDialog';

interface Report {
    id: string;
    reporter: { id: string; name: string };
    reported_user: { id: string; name: string };
    category: string;
    report_type: string;
    reason: string;
    status: string;
    priority: string;
    created_at: string;
}

export default function DenunciasDashboard() {
    const [reports, setReports] = useState<Report[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedReport, setSelectedReport] = useState<any>(null);
    const [detailOpen, setDetailOpen] = useState(false);

    const fetchStats = async () => {
        try {
            const response = await adminApiClient.get('/portal-redthread/denuncias/estadisticas');
            setStats(response.data);
        } catch (error: any) {
            console.error('Error fetching stats:', error);
            if (error.message === 'Network Error') {
                console.error('CONSEJO: Verifica que el backend esté corriendo en http://localhost:8000 y que no haya bloqueos de CORS.');
            }
        }
    };

    const fetchReports = async () => {
        try {
            const response = await adminApiClient.get('/portal-redthread/denuncias/listado?limit=10');
            setReports(response.data.reports);
        } catch (error: any) {
            console.error('Error fetching reports:', error);
            setError('Error al cargar el listado de denuncias. Por favor, verifica tu conexión o reinicia el servidor.');
        }
    };

    const loadData = async () => {
        try {
            setLoading(true);
            setError(null);
            await Promise.all([fetchStats(), fetchReports()]);
        } catch (err: any) {
            console.error('Error in loadData:', err);
            setError(err.response?.data?.detail || 'Error al conectar con el servidor');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleViewDetail = (report: any) => {
        setSelectedReport(report);
        setDetailOpen(true);
    };

    const handleRetry = () => {
        loadData();
    };

    if (loading && !stats && !error) {
        return (
            <AdminLayout>
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                    <CircularProgress />
                </Box>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <Container maxWidth="xl">
                <Box py={4}>
                    {error && (
                        <Alert
                            severity="error"
                            sx={{ mb: 4 }}
                            action={
                                <Button color="inherit" size="small" onClick={handleRetry}>
                                    REINTENTAR
                                </Button>
                            }
                        >
                            {error}
                        </Alert>
                    )}
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
                        <Typography variant="h4" fontWeight={800}>Panel de Denuncias</Typography>
                        <Button variant="contained" startIcon={<RuleIcon />}>Reglas de Auto-moderación</Button>
                    </Box>

                    {/* Stats Summary */}
                    <Grid container spacing={3} mb={5}>
                        {[
                            { label: 'Total Denuncias', value: stats?.total_reports || 0, icon: <FlagIcon />, color: 'primary.main' },
                            { label: 'Pendientes', value: stats?.by_status?.pending || 0, icon: <PendingIcon />, color: 'error.main' },
                            { label: 'En Proceso', value: stats?.by_status?.under_review || 0, icon: <AssignmentIcon />, color: 'warning.main' },
                            { label: 'Resueltas', value: stats?.by_status?.resolved || 0, icon: <RuleIcon />, color: 'success.main' },
                        ].map((stat, i) => (
                            <Grid item xs={12} sm={6} md={3} key={i}>
                                <Card>
                                    <CardContent>
                                        <Box display="flex" justifyContent="space-between" alignItems="center">
                                            <Box>
                                                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                                    {stat.label}
                                                </Typography>
                                                <Typography variant="h4" fontWeight={800} sx={{ color: stat.color }}>
                                                    {stat.value}
                                                </Typography>
                                            </Box>
                                            <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: `${stat.color.split('.')[0]}.light`, opacity: 0.2, display: 'flex' }}>
                                                {stat.icon}
                                            </Box>
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>

                    {/* Recent Reports Table */}
                    <Typography variant="h6" fontWeight={700} gutterBottom>Denuncias Recientes</Typography>
                    <ReportTable
                        reports={reports}
                        onViewDetail={handleViewDetail}
                        loading={loading}
                    />

                    {/* Detail Dialog */}
                    <ReportDetailDialog
                        open={detailOpen}
                        reportId={selectedReport?.id}
                        onClose={() => setDetailOpen(false)}
                        onActionTaken={() => {
                            setDetailOpen(false);
                            fetchReports();
                            fetchStats();
                        }}
                    />
                </Box>
            </Container>
        </AdminLayout>
    );
}
