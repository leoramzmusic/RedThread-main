import React from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Chip,
    IconButton,
    Typography,
    Box,
    Avatar,
    Tooltip,
} from '@mui/material';
import {
    Visibility as ViewIcon,
    Gavel as ActionIcon,
    History as HistoryIcon,
    PriorityHigh as HighPriorityIcon,
} from '@mui/icons-material';

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

interface ReportTableProps {
    reports: Report[];
    onViewDetail: (report: Report) => void;
    onTakeAction?: (report: Report) => void;
    loading?: boolean;
}

const statusColors: any = {
    pending: 'error',
    under_review: 'warning',
    in_process: 'warning',
    resolved: 'success',
    dismissed: 'default',
};

const priorityIcons: any = {
    high: <HighPriorityIcon color="error" fontSize="small" />,
    medium: null,
    low: null,
};

const statusLabels: any = {
    pending: 'Pendiente',
    under_review: 'En revisión',
    in_process: 'En proceso',
    resolved: 'Resuelto',
    dismissed: 'Desestimado',
};

const ReportTable: React.FC<ReportTableProps> = ({ reports, onViewDetail, onTakeAction, loading }) => {
    return (
        <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
            <Table sx={{ minWidth: 650 }}>
                <TableHead sx={{ bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)' }}>
                    <TableRow>
                        <TableCell>Prioridad</TableCell>
                        <TableCell>Denunciado</TableCell>
                        <TableCell>Denunciante</TableCell>
                        <TableCell>Categoría / Tipo</TableCell>
                        <TableCell>Motivo</TableCell>
                        <TableCell>Estado</TableCell>
                        <TableCell>Fecha</TableCell>
                        <TableCell align="right">Acciones</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {reports.map((report) => (
                        <TableRow key={report.id} hover>
                            <TableCell align="center">
                                {priorityIcons[report.priority]}
                            </TableCell>
                            <TableCell>
                                <Box display="flex" alignItems="center" gap={1}>
                                    <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem' }}>{report.reported_user.name[0]}</Avatar>
                                    <Typography variant="body2" fontWeight={600}>{report.reported_user.name}</Typography>
                                </Box>
                            </TableCell>
                            <TableCell>
                                <Typography variant="body2">{report.reporter.name}</Typography>
                            </TableCell>
                            <TableCell>
                                <Box>
                                    <Chip label={report.category} size="small" variant="outlined" sx={{ mr: 0.5 }} />
                                    <Typography variant="caption" color="text.secondary">{report.report_type}</Typography>
                                </Box>
                            </TableCell>
                            <TableCell>
                                <Tooltip title={report.reason}>
                                    <Typography variant="body2" noWrap sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {report.reason}
                                    </Typography>
                                </Tooltip>
                            </TableCell>
                            <TableCell>
                                <Chip
                                    label={statusLabels[report.status] || report.status || 'Desconocido'}
                                    size="small"
                                    color={statusColors[report.status] || 'default'}
                                    sx={{ fontWeight: 600 }}
                                />
                            </TableCell>
                            <TableCell>
                                <Typography variant="caption">
                                    {new Date(report.created_at).toLocaleDateString()}
                                </Typography>
                            </TableCell>
                            <TableCell align="right">
                                <Box display="flex" justifyContent="flex-end">
                                    <IconButton size="small" color="primary" onClick={() => onViewDetail(report)}>
                                        <ViewIcon fontSize="small" />
                                    </IconButton>
                                    {onTakeAction && report.status === 'pending' && (
                                        <IconButton size="small" color="secondary" onClick={() => onTakeAction(report)}>
                                            <ActionIcon fontSize="small" />
                                        </IconButton>
                                    )}
                                </Box>
                            </TableCell>
                        </TableRow>
                    ))}
                    {reports.length === 0 && !loading && (
                        <TableRow>
                            <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                                No se encontraron denuncias.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </TableContainer>
    );
};

export default ReportTable;
