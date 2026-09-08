import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
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
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Tabs,
  Tab,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SendIcon from '@mui/icons-material/Send';
import AdminLayout from '../../../components/layout/AdminLayout';
import apiClient from '../../../services/api';

interface TicketMessage {
  sender_id: string;
  content: string;
  is_internal: boolean;
  created_at: string;
}

interface Ticket {
  id: string;
  subject: string;
  category: string;
  priority: string;
  status: string;
  user_id: string;
  assigned_to: string | null;
  created_at: string;
  messages?: TicketMessage[];
}

export default function AdminSoporte() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [statusFilter, setStatusFilter] = useState('open');
  
  // Detail Dialog State
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [responseContent, setResponseContent] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);

  useEffect(() => {
    fetchTickets();
  }, [statusFilter]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/portal-redthread/soporte/tickets', {
        params: { status_filter: statusFilter === 'all' ? undefined : statusFilter }
      });
      setTickets(response.data);
    } catch (err) {
      console.error('Error fetching tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewTicket = async (id: string) => {
    try {
      const response = await apiClient.get(`/portal-redthread/soporte/tickets/${id}`);
      setSelectedTicket(response.data);
    } catch (err) {
      alert('Error al cargar detalles del ticket');
    }
  };

  const handleReply = async () => {
    if (!selectedTicket || !responseContent.trim()) return;

    try {
      await apiClient.post(`/portal-redthread/soporte/tickets/${selectedTicket.id}/responder`, {
        content: responseContent,
        is_internal: isInternalNote
      });
      
      // Refresh details
      handleViewTicket(selectedTicket.id);
      setResponseContent('');
    } catch (err) {
      alert('Error al enviar respuesta');
    }
  };

  const handleCloseTicket = async () => {
    if (!selectedTicket) return;
    if (!confirm('¿Cerrar este ticket?')) return;

    try {
      await apiClient.put(`/portal-redthread/soporte/tickets/${selectedTicket.id}/cerrar`);
      setSelectedTicket(null);
      fetchTickets();
    } catch (err) {
      alert('Error al cerrar ticket');
    }
  };

  if (loading && !selectedTicket) {
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
          <Box display="flex" alignItems="center" gap={2} mb={3}>
            <IconButton onClick={() => router.push('/portal-redthread')}>
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h4" fontWeight={700}>
              Soporte Técnico
            </Typography>
          </Box>

          {/* Filters */}
          <Paper sx={{ mb: 3 }}>
            <Tabs 
              value={statusFilter} 
              onChange={(_, v) => setStatusFilter(v)}
              indicatorColor="primary"
              textColor="primary"
            >
              <Tab label="Abiertos" value="open" />
              <Tab label="En Progreso" value="in_progress" />
              <Tab label="Cerrados" value="closed" />
              <Tab label="Todos" value="all" />
            </Tabs>
          </Paper>

          {/* Tickets Table */}
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Asunto</TableCell>
                  <TableCell>Categoría</TableCell>
                  <TableCell>Prioridad</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Fecha</TableCell>
                  <TableCell align="right">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tickets.map((ticket) => (
                  <TableRow key={ticket.id}>
                    <TableCell>{ticket.subject}</TableCell>
                    <TableCell>
                      <Chip label={ticket.category} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={ticket.priority} 
                        size="small" 
                        color={ticket.priority === 'high' || ticket.priority === 'critical' ? 'error' : 'default'} 
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={ticket.status} 
                        size="small" 
                        color={ticket.status === 'open' ? 'warning' : ticket.status === 'resolved' ? 'success' : 'default'} 
                      />
                    </TableCell>
                    <TableCell>{new Date(ticket.created_at).toLocaleDateString()}</TableCell>
                    <TableCell align="right">
                      <IconButton onClick={() => handleViewTicket(ticket.id)}>
                        <VisibilityIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {tickets.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      No hay tickets en esta vista
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Ticket Detail Dialog */}
          <Dialog 
            open={!!selectedTicket} 
            onClose={() => setSelectedTicket(null)}
            maxWidth="md"
            fullWidth
          >
            {selectedTicket && (
              <>
                <DialogTitle>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6">{selectedTicket.subject}</Typography>
                    <Chip label={selectedTicket.status} size="small" />
                  </Box>
                </DialogTitle>
                <DialogContent dividers>
                  <List>
                    {selectedTicket.messages?.map((msg, index) => (
                      <ListItem key={index} alignItems="flex-start" sx={{ 
                        bgcolor: msg.is_internal ? 'action.hover' : 'transparent',
                        borderRadius: 1,
                        mb: 1
                      }}>
                        <ListItemText
                          primary={
                            <Box display="flex" justifyContent="space-between">
                              <Typography variant="subtitle2" color="primary">
                                {msg.sender_id === selectedTicket.user_id ? 'Usuario' : 'Soporte'}
                                {msg.is_internal && ' (Nota Interna)'}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {new Date(msg.created_at).toLocaleString()}
                              </Typography>
                            </Box>
                          }
                          secondary={msg.content}
                        />
                      </ListItem>
                    ))}
                  </List>
                  <Divider sx={{ my: 2 }} />
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    placeholder="Escribe una respuesta..."
                    value={responseContent}
                    onChange={(e) => setResponseContent(e.target.value)}
                  />
                  <Box mt={1}>
                    <Button 
                      size="small" 
                      onClick={() => setIsInternalNote(!isInternalNote)}
                      color={isInternalNote ? "warning" : "inherit"}
                    >
                      {isInternalNote ? "Nota Interna Activada" : "Marcar como nota interna"}
                    </Button>
                  </Box>
                </DialogContent>
                <DialogActions>
                  {selectedTicket.status !== 'closed' && (
                    <Button color="error" onClick={handleCloseTicket}>
                      Cerrar Ticket
                    </Button>
                  )}
                  <Button onClick={() => setSelectedTicket(null)}>Cancelar</Button>
                  <Button 
                    variant="contained" 
                    endIcon={<SendIcon />}
                    onClick={handleReply}
                    disabled={!responseContent.trim()}
                  >
                    Enviar
                  </Button>
                </DialogActions>
              </>
            )}
          </Dialog>
        </Box>
      </Container>
    </AdminLayout>
  );
}
