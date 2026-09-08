import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  Typography,
  Chip,
  CircularProgress,
  IconButton,
  Tooltip,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RefreshIcon from '@mui/icons-material/Refresh';
import adminApiClient from '../../services/adminApi';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface HistoryItem {
  user_id: string;
  display_name: string;
  document_type: string;
  verified_at: string;
  admin_name: string;
}

export default function VerificationHistoryTable() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const response = await adminApiClient.get(`/portal-redthread/verificaciones/historial/aprobados?page=${page}&limit=20`);
      setHistory(response.data.items);
      setTotalPages(response.data.pages);
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
    const interval = setInterval(fetchHistory, 60000); // Auto-reload every minute
    return () => clearInterval(interval);
  }, [page]);

  return (
    <Box>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Typography variant="h6" fontWeight={600}>
          Historial de Aprobaciones Recientes
        </Typography>
        <Tooltip title="Recargar historial">
          <IconButton onClick={fetchHistory} disabled={loading} size="small">
            {loading ? <CircularProgress size={20} /> : <RefreshIcon />}
          </IconButton>
        </Tooltip>
      </Box>

      <Paper sx={{ width: '100%', mb: 2 }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Usuario</TableCell>
                <TableCell>Documento</TableCell>
                <TableCell>Fecha Aprobación</TableCell>
                <TableCell>Aprobado Por</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading && history.length === 0 ? (
                 <TableRow>
                  <TableCell colSpan={4} align="center">
                    <CircularProgress size={30} sx={{ my: 2 }} />
                  </TableCell>
                </TableRow>
              ) : history.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                    No hay historial de aprobaciones registrado
                  </TableCell>
                </TableRow>
              ) : (
                history.map((row) => (
                  <TableRow key={row.user_id} hover>
                    <TableCell>
                        <Box display="flex" alignItems="center">
                            <Avatar sx={{ width: 24, height: 24, mr: 1, bgcolor: 'primary.main' }}>
                                {row.display_name.charAt(0).toUpperCase()}
                            </Avatar>
                            <Box>
                                <Typography variant="body2" fontWeight={500}>
                                    {row.display_name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    ID: {row.user_id.substring(0, 8)}...
                                </Typography>
                            </Box>
                             <CheckCircleIcon sx={{ ml: 1, fontSize: 16, color: 'primary.main' }} />
                        </Box>
                    </TableCell>
                    <TableCell>
                      <Chip label={row.document_type || 'N/A'} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>
                      {row.verified_at ? format(new Date(row.verified_at), 'dd MMM yyyy HH:mm', { locale: es }) : '-'}
                    </TableCell>
                    <TableCell>
                        <Typography variant="body2">{row.admin_name}</Typography>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}
