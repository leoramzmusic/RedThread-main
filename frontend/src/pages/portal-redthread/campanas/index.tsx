import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Grid,
  CircularProgress,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import BarChartIcon from '@mui/icons-material/BarChart';
import AdminLayout from '../../../components/layout/AdminLayout';
import apiClient from '../../../services/api';

interface Campaign {
  id: string;
  name: string;
  type: string;
  status: string;
  scheduled_at: string | null;
  sent_count: number;
  open_rate: number;
  click_rate: number;
}

export default function AdminCampanas() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    type: 'email',
    subject: '',
    content: '',
    scheduled_at: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/portal-redthread/campanas/listado');
      setCampaigns(response.data);
    } catch (err) {
      console.error('Error fetching campaigns:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      await apiClient.post('/portal-redthread/campanas/crear', {
        ...formData,
        scheduled_at: formData.scheduled_at || null
      });
      setOpenDialog(false);
      fetchData();
      // Reset form
      setFormData({
        name: '',
        type: 'email',
        subject: '',
        content: '',
        scheduled_at: '',
      });
    } catch (err) {
      alert('Error al crear campaña');
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await apiClient.put(`/portal-redthread/campanas/${id}/estado`, {
        status_update: newStatus
      });
      fetchData();
    } catch (err) {
      alert('Error al actualizar estado');
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
          <CircularProgress />
        </Box>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Container maxWidth="lg">
        <Box sx={{ py: 4 }}>
          {/* Header */}
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={4}>
            <Box display="flex" alignItems="center" gap={2}>
              <IconButton onClick={() => router.push('/portal-redthread')}>
                <ArrowBackIcon />
              </IconButton>
              <Typography variant="h4" fontWeight={700}>
                Campañas de Marketing
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setOpenDialog(true)}
            >
              Nueva Campaña
            </Button>
          </Box>

          {/* Campaigns Table */}
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Nombre</TableCell>
                  <TableCell>Tipo</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Programada</TableCell>
                  <TableCell align="center">Enviados</TableCell>
                  <TableCell align="center">Open Rate</TableCell>
                  <TableCell align="right">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {campaigns.map((campaign) => (
                  <TableRow key={campaign.id}>
                    <TableCell>{campaign.name}</TableCell>
                    <TableCell>
                      <Chip 
                        label={campaign.type.toUpperCase()} 
                        size="small" 
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={campaign.status} 
                        size="small" 
                        color={
                          campaign.status === 'active' ? 'success' : 
                          campaign.status === 'completed' ? 'primary' : 'default'
                        } 
                      />
                    </TableCell>
                    <TableCell>
                      {campaign.scheduled_at ? new Date(campaign.scheduled_at).toLocaleString() : '-'}
                    </TableCell>
                    <TableCell align="center">{campaign.sent_count}</TableCell>
                    <TableCell align="center">{campaign.open_rate}%</TableCell>
                    <TableCell align="right">
                      <Box display="flex" justifyContent="flex-end">
                        {campaign.status === 'active' ? (
                          <IconButton 
                            size="small" 
                            color="warning"
                            onClick={() => handleStatusChange(campaign.id, 'paused')}
                            title="Pausar"
                          >
                            <PauseIcon />
                          </IconButton>
                        ) : campaign.status === 'paused' || campaign.status === 'draft' ? (
                          <IconButton 
                            size="small" 
                            color="success"
                            onClick={() => handleStatusChange(campaign.id, 'active')}
                            title="Activar"
                          >
                            <PlayArrowIcon />
                          </IconButton>
                        ) : null}
                        <IconButton 
                          size="small"
                          onClick={() => alert(`Ver estadísticas de ${campaign.name}`)}
                          title="Estadísticas"
                        >
                          <BarChartIcon />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
                {campaigns.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      No hay campañas creadas
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Create Dialog */}
          <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
            <DialogTitle>Nueva Campaña</DialogTitle>
            <DialogContent>
              <Box display="flex" flexDirection="column" gap={2} pt={2}>
                <TextField
                  label="Nombre de la campaña"
                  fullWidth
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
                <TextField
                  select
                  label="Tipo"
                  fullWidth
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
                >
                  <MenuItem value="email">Email</MenuItem>
                  <MenuItem value="push">Push Notification</MenuItem>
                  <MenuItem value="in_app">In-App Message</MenuItem>
                </TextField>
                <TextField
                  label="Asunto / Título"
                  fullWidth
                  value={formData.subject}
                  onChange={(e) => setFormData({...formData, subject: e.target.value})}
                />
                <TextField
                  label="Contenido"
                  fullWidth
                  multiline
                  rows={4}
                  value={formData.content}
                  onChange={(e) => setFormData({...formData, content: e.target.value})}
                />
                <TextField
                  label="Programar envío (Opcional)"
                  type="datetime-local"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  value={formData.scheduled_at}
                  onChange={(e) => setFormData({...formData, scheduled_at: e.target.value})}
                />
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpenDialog(false)}>Cancelar</Button>
              <Button variant="contained" onClick={handleCreate}>Crear</Button>
            </DialogActions>
          </Dialog>
        </Box>
      </Container>
    </AdminLayout>
  );
}
