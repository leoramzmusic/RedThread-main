import { useState, useEffect } from 'react';
import { Container, Typography, Box, CircularProgress, Alert } from '@mui/material';
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

export default function InProcessReports() {
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedReport, setSelectedReport] = useState<any>(null);
    const [detailOpen, setDetailOpen] = useState(false);

    const fetchReports = async () => {
        try {
            setLoading(true);
            const response = await adminApiClient.get('/portal-redthread/denuncias/listado?status_filter=under_review');
            setReports(response.data.reports);
        } catch (error: any) {
            console.error('Error fetching in-process reports:', error);
            setError('Error al cargar denuncias en proceso.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReports();
    }, []);

    const handleViewDetail = (report: any) => {
        setSelectedReport(report);
        setDetailOpen(true);
    };

    if (loading && reports.length === 0 && !error) {
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
                        <Alert severity="error" sx={{ mb: 4 }}>
                            {error}
                        </Alert>
                    )}
                    <Typography variant="h4" fontWeight={800} gutterBottom>En Proceso</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                        Denuncias que están siendo revisadas o esperan respuesta.
                    </Typography>

                    <ReportTable
                        reports={reports}
                        onViewDetail={handleViewDetail}
                        loading={loading}
                    />

                    <ReportDetailDialog
                        open={detailOpen}
                        reportId={selectedReport?.id}
                        onClose={() => setDetailOpen(false)}
                        onActionTaken={() => {
                            setDetailOpen(false);
                            fetchReports();
                        }}
                    />
                </Box>
            </Container>
        </AdminLayout>
    );
}
