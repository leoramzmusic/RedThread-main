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
  Button,
  Typography,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Alert,
  Grid,
  Snackbar,
  IconButton,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import RefreshIcon from '@mui/icons-material/Refresh';
import adminApiClient from '../../services/adminApi';
import { format } from 'date-fns';

const REJECTION_REASONS = [
  "Nombre/Fecha no coinciden",
  "Documento vencido",
  "Documento ilegible",
  "Documento incompleto",
  "Documento no válido",
  "Datos inconsistentes",
  "Fraude evidente",
  "Otro"
];

interface PendingVerification {
  user_id: string;
  email: string;
  display_name: string;
  submitted_at: string;
  document_type: string;
  document_url: string;
  current_real_name?: string;
  birth_date?: string;
}

export default function VerificationRequestsTable() {
  const [verifications, setVerifications] = useState<PendingVerification[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVerification, setSelectedVerification] = useState<PendingVerification | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // Manual review form
  const [manualName, setManualName] = useState('');
  const [manualBirthDate, setManualBirthDate] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [rejectDetails, setRejectDetails] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  
  // Snackbar state
  const [snackbar, setSnackbar] = useState<{open: boolean; message: string; severity: 'success' | 'error' | 'warning'}>({open: false, message: '', severity: 'success'});

  const fetchVerifications = async () => {
    setLoading(true);
    try {
      const response = await adminApiClient.get('/portal-redthread/verificaciones/pendientes');
      console.log('Admin verification response:', response.data);
      setVerifications(response.data); // Backend returns array directly, not {items: [...]}
    } catch (error) {
      console.error('Error fetching verifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVerifications();
    const interval = setInterval(fetchVerifications, 60000); // Auto-reload every minute
    return () => clearInterval(interval);
  }, []);

  const handleReview = (verification: PendingVerification) => {
    setSelectedVerification(verification);
    setManualName(verification.current_real_name || '');
    setManualBirthDate(verification.birth_date || '');
    setRejectReason('');
    setRejectDetails('');
    setDialogOpen(true);
  };

  const handleApprove = async () => {
    if (!selectedVerification) return;
    
    setActionLoading(true);
    try {
      await adminApiClient.post(`/portal-redthread/verificaciones/${selectedVerification.user_id}/aprobar`, {
        real_name: manualName,
        birth_date: manualBirthDate || null,
      });
      setSnackbar({open: true, message: 'Verificación aprobada exitosamente', severity: 'success'});
      setDialogOpen(false);
      fetchVerifications();
    } catch (error: any) {
      console.error('Error approving verification:', error);
      const errorMsg = error.response?.data?.detail || 'Error al aprobar la verificación';
      setSnackbar({open: true, message: errorMsg, severity: 'error'});
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedVerification) return;
    if (!rejectReason) {
      setSnackbar({open: true, message: 'Por favor selecciona un motivo', severity: 'warning'});
      return;
    }
    if (rejectReason === 'Otro' && !rejectDetails) {
        setSnackbar({open: true, message: 'Por favor especifica el motivo', severity: 'warning'});
        return;
    }

    setActionLoading(true);
    try {
      await adminApiClient.post(`/portal-redthread/verificaciones/${selectedVerification.user_id}/rechazar`, {
        reason: rejectReason,
        details: rejectDetails
      });
      setSnackbar({open: true, message: 'Verificación rechazada', severity: 'success'});
      setDialogOpen(false);
      fetchVerifications();
    } catch (error: any) {
      console.error('Error rejecting verification:', error);
      const errorMsg = error.response?.data?.detail || 'Error al rechazar la verificación';
      setSnackbar({open: true, message: errorMsg, severity: 'error'});
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <Box>
      <Box display="flex" alignItems="center" justifyContent="flex-end" mb={2}>
        <Tooltip title="Recargar solicitudes">
          <IconButton 
            onClick={fetchVerifications} 
            disabled={loading}
            color="primary"
          >
            {loading ? <CircularProgress size={24} /> : <RefreshIcon />}
          </IconButton>
        </Tooltip>
      </Box>

      <Paper sx={{ width: '100%', mb: 2 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Usuario</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Tipo Documento</TableCell>
                <TableCell>Fecha Envío</TableCell>
                <TableCell>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : !verifications || verifications.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    No hay solicitudes pendientes
                  </TableCell>
                </TableRow>
              ) : (
                verifications.map((row) => (
                  <TableRow key={row.user_id}>
                    <TableCell>{row.display_name}</TableCell>
                    <TableCell>{row.email}</TableCell>
                    <TableCell>
                      <Chip label={row.document_type} size="small" />
                    </TableCell>
                    <TableCell>
                      {new Date(row.submitted_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button 
                        variant="contained" 
                        size="small"
                        onClick={() => handleReview(row)}
                      >
                        Revisar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Review Dialog */}
      <Dialog 
        open={dialogOpen} 
        onClose={() => setDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Revisar Documento</DialogTitle>
        <DialogContent dividers>
          {selectedVerification && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom>Documento:</Typography>
                <Box 
                  sx={{ 
                    width: '100%', 
                    height: 400, 
                    bgcolor: '#f5f5f5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    border: '1px solid #ddd'
                  }}
                >
                  {selectedVerification.document_url ? (
                    <img 
                      src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${selectedVerification.document_url}`} 
                      alt="Documento" 
                      style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} 
                      onError={(e) => {
                        console.error('Error loading image:', selectedVerification.document_url);
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : (
                    <Typography color="text.secondary">No imagen disponible</Typography>
                  )}
                </Box>
                <Typography variant="caption" display="block" mt={1}>
                  Tipo: {selectedVerification.document_type}
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom>Datos Extraídos / Manuales:</Typography>
                
                <TextField
                  fullWidth
                  label="Nombre Real (del documento)"
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  margin="normal"
                  helperText="Corrige si el OCR falló"
                />
                
                <TextField
                  fullWidth
                  label="Fecha de Nacimiento (YYYY-MM-DD)"
                  type="date"
                  value={manualBirthDate}
                  onChange={(e) => setManualBirthDate(e.target.value)}
                  margin="normal"
                  InputLabelProps={{ shrink: true }}
                />
                
                <Box mt={4}>
                  <Typography variant="subtitle2" color="error" gutterBottom>
                    Rechazar Solicitud:
                  </Typography>
                  <FormControl fullWidth margin="normal" size="small">
                    <InputLabel id="rejection-reason-label">Motivo del rechazo</InputLabel>
                    <Select
                      labelId="rejection-reason-label"
                      value={rejectReason}
                      label="Motivo del rechazo"
                      onChange={(e) => setRejectReason(e.target.value)}
                    >
                      {REJECTION_REASONS.map((reason) => (
                        <MenuItem key={reason} value={reason}>
                          {reason}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  
                  {rejectReason === 'Otro' && (
                    <TextField
                      fullWidth
                      label="Especificar motivo"
                      value={rejectDetails}
                      onChange={(e) => setRejectDetails(e.target.value)}
                      size="small"
                      placeholder="Escribe la razón específica..."
                      multiline
                      rows={2}
                      margin="normal"
                    />
                  )}
                </Box>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} color="inherit">
            Cancelar
          </Button>
          <Button 
            onClick={handleReject} 
            color="error" 
            startIcon={<CancelIcon />}
            disabled={actionLoading || !rejectReason || (rejectReason === 'Otro' && !rejectDetails)}
          >
            Rechazar
          </Button>
          <Button 
            onClick={handleApprove} 
            color="success" 
            variant="contained"
            startIcon={<CheckCircleIcon />}
            disabled={actionLoading || !manualName}
          >
            Aprobar y Verificar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({...snackbar, open: false})}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setSnackbar({...snackbar, open: false})} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
