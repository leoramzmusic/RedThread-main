import { Box, Button, Chip, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';
import { AppearanceHistory, HistoryAction } from '../../../types/appearance';

export interface NavbarHistoryProps {
  history: AppearanceHistory[];
  onClear: () => void;
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

export default function NavbarHistory({ history, onClear }: NavbarHistoryProps) {
  const sorted = [...history].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <Box>
      <Box display="flex" justifyContent="flex-end" mb={2}>
        <Button variant="outlined" color="error" size="small" onClick={onClear} disabled={history.length === 0}>
          Limpiar Historial
        </Button>
      </Box>
      {history.length === 0 ? (
        <Typography color="text.secondary" align="center" sx={{ py: 4 }}>No hay historial disponible.</Typography>
      ) : (
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
              {sorted.map((log, index) => (
                <TableRow key={log._id || index} hover>
                  <TableCell>
                    {new Date(log.timestamp).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'medium' })}
                  </TableCell>
                  <TableCell>
                    <Chip label={log.action} size="small" color={getActionColor(log.action)} variant="outlined" />
                  </TableCell>
                  <TableCell>{log.user_name || log.user_id}</TableCell>
                  <TableCell>{log.context || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}