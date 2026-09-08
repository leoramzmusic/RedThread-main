import { useState, useEffect } from 'react';
import { Container, Typography, Box, Checkbox, TableCell, TableRow, TableBody, Table, TableHead, TableContainer, Paper, Avatar, Chip, IconButton, Tooltip, Alert } from '@mui/material';
import { Visibility as ViewIcon } from '@mui/icons-material';
import AdminLayout from '../../../components/layout/AdminLayout';
import adminApiClient from '../../../services/adminApi';
import BulkActionPanel from '../../../components/admin/reports/BulkActionPanel';
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

export default function BulkReports() {
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [selectedReport, setSelectedReport] = useState<any>(null);
    const [detailOpen, setDetailOpen] = useState(false);

    const fetchReports = async () => {
        try {
            setLoading(true);
            const response = await adminApiClient.get('/portal-redthread/denuncias/listado?status_filter=pending&limit=100');
            setReports(response.data.reports);
            setSelectedIds([]);
        } catch (error: any) {
            console.error('Error fetching reports for bulk:', error);
            setError('Error al cargar denuncias para procesamiento masivo.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReports();
    }, []);

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedIds(reports.map((r: any) => r.id));
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectOne = (id: string) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const handleBulkApply = async (action: string, notes: string, moderatorId?: string) => {
        try {
            setLoading(true);
            await adminApiClient.post('/portal-redthread/denuncias/lotes/procesar', {
                report_ids: selectedIds,
                action,
                notes,
                moderator_id: moderatorId
            });
            await fetchReports();
        } catch (error) {
            console.error('Error in bulk process:', error);
            alert('Error al procesar el lote');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AdminLayout>
            <Container maxWidth="xl">
                <Box py={4}>
                    {error && (
                        <Alert severity="error" sx={{ mb: 4 }}>
                            {error}
                        </Alert>
                    )}
                    <Typography variant="h4" fontWeight={800} gutterBottom>Procesamiento por Lotes</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                        Ahorra tiempo procesando múltiples denuncias similares simultáneamente.
                    </Typography>

                    <BulkActionPanel
                        selectedCount={selectedIds.length}
                        onApply={handleBulkApply}
                        loading={loading}
                    />

                    <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
                        <Table size="small">
                            <TableHead sx={{ bgcolor: 'action.hover' }}>
                                <TableRow>
                                    <TableCell padding="checkbox">
                                        <Checkbox
                                            indeterminate={selectedIds.length > 0 && selectedIds.length < reports.length}
                                            checked={reports.length > 0 && selectedIds.length === reports.length}
                                            onChange={(e) => handleSelectAll(e.target.checked)}
                                        />
                                    </TableCell>
                                    <TableCell>Denunciado</TableCell>
                                    <TableCell>Categoría</TableCell>
                                    <TableCell>Motivo</TableCell>
                                    <TableCell>Fecha</TableCell>
                                    <TableCell align="right">Ver</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {reports.map((report: any) => (
                                    <TableRow key={report.id} hover selected={selectedIds.includes(report.id)}>
                                        <TableCell padding="checkbox">
                                            <Checkbox
                                                checked={selectedIds.includes(report.id)}
                                                onChange={() => handleSelectOne(report.id)}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Box display="flex" alignItems="center" gap={1}>
                                                <Avatar sx={{ width: 20, height: 20, fontSize: '0.6rem' }}>{report.reported_user.name[0]}</Avatar>
                                                <Typography variant="body2">{report.reported_user.name}</Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell><Chip label={report.category} size="small" variant="outlined" /></TableCell>
                                        <TableCell>{report.reason}</TableCell>
                                        <TableCell>{new Date(report.created_at).toLocaleDateString()}</TableCell>
                                        <TableCell align="right">
                                            <IconButton size="small" onClick={() => { setSelectedReport(report); setDetailOpen(true); }}>
                                                <ViewIcon fontSize="small" />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    <ReportDetailDialog
                        open={detailOpen}
                        reportId={selectedReport?.id}
                        onClose={() => setDetailOpen(false)}
                        onActionTaken={() => { setDetailOpen(false); fetchReports(); }}
                    />
                </Box>
            </Container>
        </AdminLayout>
    );
}
