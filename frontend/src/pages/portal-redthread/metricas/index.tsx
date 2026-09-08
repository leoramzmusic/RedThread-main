import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  IconButton,
  CircularProgress,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PeopleIcon from '@mui/icons-material/People';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import MessageIcon from '@mui/icons-material/Message';
import FavoriteIcon from '@mui/icons-material/Favorite';
import AdminLayout from '../../../components/layout/AdminLayout';
import apiClient from '../../../services/api';

export default function AdminMetricas() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [metricas, setMetricas] = useState<any>(null);

  useEffect(() => {
    fetchMetricas();
  }, []);

  const fetchMetricas = async () => {
    try {
      const response = await apiClient.get('/portal-redthread/metricas/usuarios');
      setMetricas(response.data);
    } catch (error) {
      console.error('Error fetching metrics:', error);
    } finally {
      setLoading(false);
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
          <Box display="flex" alignItems="center" gap={2} mb={3}>
            <IconButton onClick={() => router.push('/portal-redthread')}>
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h4" fontWeight={700}>
              Métricas y Analíticas
            </Typography>
          </Box>

          <Grid container spacing={3}>
            <Grid item xs={12} md={3}>
              <Card sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography variant="h3" fontWeight={700} color="white">
                        {metricas?.total_usuarios || 0}
                      </Typography>
                      <Typography variant="body2" color="white" sx={{ opacity: 0.9 }}>
                        Total Usuarios
                      </Typography>
                    </Box>
                    <PeopleIcon sx={{ fontSize: 48, color: 'white', opacity: 0.3 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={3}>
              <Card sx={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography variant="h3" fontWeight={700} color="white">
                        {metricas?.usuarios_activos || 0}
                      </Typography>
                      <Typography variant="body2" color="white" sx={{ opacity: 0.9 }}>
                        Usuarios Activos
                      </Typography>
                    </Box>
                    <TrendingUpIcon sx={{ fontSize: 48, color: 'white', opacity: 0.3 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={3}>
              <Card sx={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography variant="h3" fontWeight={700} color="white">
                        {metricas?.nuevos_usuarios_30d || 0}
                      </Typography>
                      <Typography variant="body2" color="white" sx={{ opacity: 0.9 }}>
                        Nuevos (30d)
                      </Typography>
                    </Box>
                    <PeopleIcon sx={{ fontSize: 48, color: 'white', opacity: 0.3 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={3}>
              <Card sx={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' }}>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography variant="h3" fontWeight={700} color="white">
                        {metricas?.tasa_activacion || 0}%
                      </Typography>
                      <Typography variant="body2" color="white" sx={{ opacity: 0.9 }}>
                        Tasa Activación
                      </Typography>
                    </Box>
                    <TrendingUpIcon sx={{ fontSize: 48, color: 'white', opacity: 0.3 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Métricas Adicionales
                </Typography>
                <Typography color="text.secondary">
                  Gráficos y analíticas detalladas - Funcionalidad pendiente de implementación
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      </Container>
    </AdminLayout>
  );
}
