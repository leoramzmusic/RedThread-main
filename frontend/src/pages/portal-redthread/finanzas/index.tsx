import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  CircularProgress,
  Alert,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import PeopleIcon from '@mui/icons-material/People';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import CancelIcon from '@mui/icons-material/Cancel';
import AdminLayout from '../../../components/layout/AdminLayout';
import apiClient from '../../../services/api';

interface Subscription {
  id: string;
  user_id: string;
  plan: string;
  is_active: boolean;
  start_date: string;
  end_date: string | null;
  amount: number;
  currency: string;
}

interface FinancialStats {
  total_subscriptions: number;
  active_subscriptions: number;
  churn_rate: number;
  by_plan: Record<string, number>;
}

export default function AdminFinanzas() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [stats, setStats] = useState<FinancialStats | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [subsRes, statsRes] = await Promise.all([
        apiClient.get('/portal-redthread/finanzas/suscripciones'),
        apiClient.get('/portal-redthread/finanzas/estadisticas')
      ]);
      
      setSubscriptions(subsRes.data);
      setStats(statsRes.data);
    } catch (err) {
      console.error('Error fetching finance data:', err);
      setError('Error al cargar datos financieros');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async (id: string) => {
    if (!confirm('¿Estás seguro de cancelar esta suscripción?')) return;
    
    try {
      await apiClient.post(`/portal-redthread/finanzas/${id}/cancelar`, {
        reason: 'Admin cancellation'
      });
      fetchData(); // Refresh data
    } catch (err) {
      alert('Error al cancelar suscripción');
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
          <Box display="flex" alignItems="center" gap={2} mb={4}>
            <IconButton onClick={() => router.push('/portal-redthread')}>
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h4" fontWeight={700}>
              Finanzas y Suscripciones
            </Typography>
          </Box>

          {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

          {/* Stats Cards */}
          {stats && (
            <Grid container spacing={3} mb={4}>
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <PeopleIcon color="primary" />
                      <Typography variant="subtitle2" color="text.secondary">
                        Suscripciones Activas
                      </Typography>
                    </Box>
                    <Typography variant="h4">
                      {stats.active_subscriptions}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      de {stats.total_subscriptions} totales
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <AttachMoneyIcon color="success" />
                      <Typography variant="subtitle2" color="text.secondary">
                        Ingresos Mensuales
                      </Typography>
                    </Box>
                    <Typography variant="h4">
                      $0.00
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      (Simulado)
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <TrendingUpIcon color="warning" />
                      <Typography variant="subtitle2" color="text.secondary">
                        Tasa de Cancelación
                      </Typography>
                    </Box>
                    <Typography variant="h4">
                      {(stats.churn_rate * 100).toFixed(1)}%
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Churn Rate
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}

          {/* Subscriptions Table */}
          <Typography variant="h6" mb={2}>
            Listado de Suscripciones
          </Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Usuario ID</TableCell>
                  <TableCell>Plan</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Inicio</TableCell>
                  <TableCell>Monto</TableCell>
                  <TableCell align="right">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {subscriptions.map((sub) => (
                  <TableRow key={sub.id}>
                    <TableCell>{sub.user_id.substring(0, 8)}...</TableCell>
                    <TableCell>
                      <Chip 
                        label={sub.plan.toUpperCase()} 
                        size="small" 
                        color={sub.plan === 'premium_plus' ? 'secondary' : 'primary'} 
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={sub.is_active ? 'Activo' : 'Inactivo'} 
                        size="small" 
                        color={sub.is_active ? 'success' : 'default'} 
                      />
                    </TableCell>
                    <TableCell>{new Date(sub.start_date).toLocaleDateString()}</TableCell>
                    <TableCell>${sub.amount} {sub.currency}</TableCell>
                    <TableCell align="right">
                      {sub.is_active && (
                        <IconButton 
                          size="small" 
                          color="error"
                          onClick={() => handleCancelSubscription(sub.id)}
                          title="Cancelar suscripción"
                        >
                          <CancelIcon />
                        </IconButton>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {subscriptions.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      No hay suscripciones registradas
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </Container>
    </AdminLayout>
  );
}
