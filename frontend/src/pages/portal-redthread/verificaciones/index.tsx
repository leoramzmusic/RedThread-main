import { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  CircularProgress,
  Alert,
} from '@mui/material';
import AdminLayout from '../../../components/layout/AdminLayout';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import apiClient from '../../../services/api';

interface PendingVerification {
  user_id: string;
  email: string;
  display_name: string;
  submitted_at: string;
  document_type: string;
  document_url: string;
  current_real_name?: string;
}

export default function VerificationsPage() {
  const [verifications, setVerifications] = useState<PendingVerification[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVerification, setSelectedVerification] = useState<PendingVerification | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // Manual review form
  const [manualName, setManualName] = useState('');
  const [manualBirthDate, setManualBirthDate] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchVerifications = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/portal-redthread/verificaciones/pendientes');
      setVerifications(response.data.items);
    } catch (error) {
      console.error('Error fetching verifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVerifications();
  }, []);

  const handleReview = (verification: PendingVerification) => {
    setSelectedVerification(verification);
    setManualName(verification.current_real_name || '');
    setManualBirthDate('');
    setRejectReason('');
    setDialogOpen(true);
  };

  const handleApprove = async () => {
    if (!selectedVerification) return;
    
    setActionLoading(true);
    try {
      await apiClient.post(`/portal-redthread/verificaciones/${selectedVerification.user_id}/aprobar`, {
        real_name: manualName,
        birth_date: manualBirthDate || null,
      });
      setDialogOpen(false);
      fetchVerifications();
    } catch (error) {
      console.error('Error approving verification:', error);
      alert('Error al aprobar');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedVerification) return;
    if (!rejectReason) {
      alert('Por favor ingresa una razón para el rechazo');
      return;
    }

    setActionLoading(true);
    try {
      await apiClient.post(`/portal-redthread/verificaciones/${selectedVerification.user_id}/rechazar`, {
        reason: rejectReason,
      });
      setDialogOpen(false);
      fetchVerifications();
    } catch (error) {
      console.error('Error rejecting verification:', error);
      alert('Error al rechazar');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <AdminLayout>
      <Container maxWidth="lg">
        <Box sx={{ py: 4 }}>
          <Box display="flex" alignItems="center" mb={4}>
            <VerifiedUserIcon sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
            <Typography variant="h4" fontWeight={700}>
              Verificaciones de Identidad
            </Typography>
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
                  ) : verifications.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        No hay verificaciones pendientes
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
        </Box>

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
                        src={`/${selectedVerification.document_url}`} 
                        alt="Documento" 
                        style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} 
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
                    <TextField
                      fullWidth
                      label="Razón del rechazo"
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      size="small"
                      placeholder="Ej: Documento borroso, no coincide nombre..."
                    />
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
              disabled={actionLoading || !rejectReason}
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
      </Container>
    </AdminLayout>
  );
}
