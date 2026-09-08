import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Chip,
    Typography,
    Box,
    Button
} from '@mui/material';
import { AppearanceHistory, HistoryAction } from '../../types/appearance';

interface IconHistoryProps {
    history: AppearanceHistory[];
    onClear?: () => void;
}

export default function IconHistoryComponent({ history, onClear }: IconHistoryProps) {
    if (history.length === 0) {
        return <Typography color="text.secondary" align="center" sx={{ py: 4 }}>No hay historial disponible.</Typography>;
    }

    const getActionColor = (action: HistoryAction) => {
        switch (action) {
            case HistoryAction.ACTIVATED: return 'success';
            case HistoryAction.DEACTIVATED: return 'default';
            case HistoryAction.UPLOADED: return 'primary';
            case HistoryAction.UPDATED: return 'info';
            case HistoryAction.DELETED: return 'error';
            default: return 'default';
        }
    };

    return (
        <Box>
            <Box display="flex" justifyContent="flex-end" mb={2}>
                <Button
                    variant="outlined"
                    color="error"
                    size="small"
                    onClick={onClear}
                    disabled={!onClear}
                >
                    Limpiar Historial
                </Button>
            </Box>
            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #eee' }}>
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell>Fecha</TableCell>
                            <TableCell>Acción</TableCell>
                            <TableCell>Usuario</TableCell>
                            <TableCell>Contexto</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {history.map((log, index) => (
                            <TableRow key={log._id || index}>
                                <TableCell>
                                    {new Date(log.timestamp).toLocaleString(undefined, {
                                        dateStyle: 'short',
                                        timeStyle: 'medium'
                                    })}
                                </TableCell>
                                <TableCell>
                                    <Chip
                                        label={log.action}
                                        size="small"
                                        color={getActionColor(log.action)}
                                        variant="outlined"
                                    />
                                </TableCell>
                                <TableCell>{log.user_name || log.user_id}</TableCell>
                                <TableCell>
                                    {log.context && log.context.includes('Scheduled') ? (
                                        <Chip label={log.context} size="small" color="secondary" variant="outlined" />
                                    ) : (
                                        log.context || '-'
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
}
