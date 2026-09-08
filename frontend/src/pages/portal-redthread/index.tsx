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
  Button,
  CircularProgress,
} from '@mui/material';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import EventIcon from '@mui/icons-material/Event';
import PeopleIcon from '@mui/icons-material/People';
import BarChartIcon from '@mui/icons-material/BarChart';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import CampaignIcon from '@mui/icons-material/Campaign';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import SettingsIcon from '@mui/icons-material/Settings';
import AdminLayout from '../../components/layout/AdminLayout';

export default function AdminPortal() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const modules = [
    {
      title: 'Eventos',
      description: 'Gestionar eventos de la plataforma',
      icon: <EventIcon sx={{ fontSize: 60, color: '#FF6B6B' }} />,
      path: '/portal-redthread/eventos',
      color: '#FF6B6B'
    },
    {
      title: 'Usuarios',
      description: 'Gestión completa de usuarios y verificaciones',
      icon: <PeopleIcon sx={{ fontSize: 60, color: '#4ECDC4' }} />,
      path: '/portal-redthread/usuarios',
      color: '#4ECDC4'
    },
    {
      title: 'Empleados',
      description: 'Gestionar empleados, roles y permisos',
      icon: <AdminPanelSettingsIcon sx={{ fontSize: 60, color: '#34495E' }} />,
      path: '/portal-redthread/empleados',
      color: '#34495E'
    },
    {
      title: 'Finanzas',
      description: 'Suscripciones, ingresos y pagos',
      icon: <AttachMoneyIcon sx={{ fontSize: 60, color: '#2ECC71' }} />,
      path: '/portal-redthread/finanzas',
      color: '#2ECC71'
    },
    {
      title: 'Campañas',
      description: 'Marketing, emails y notificaciones',
      icon: <CampaignIcon sx={{ fontSize: 60, color: '#E67E22' }} />,
      path: '/portal-redthread/campanas',
      color: '#E67E22'
    },
    {
      title: 'Soporte',
      description: 'Tickets de ayuda y atención al cliente',
      icon: <SupportAgentIcon sx={{ fontSize: 60, color: '#3498DB' }} />,
      path: '/portal-redthread/soporte',
      color: '#3498DB'
    },
    {
      title: 'Métricas',
      description: 'Ver estadísticas y analíticas',
      icon: <BarChartIcon sx={{ fontSize: 60, color: '#9B59B6' }} />,
      path: '/portal-redthread/metricas',
      color: '#9B59B6'
    },
    {
      title: 'Configuración',
      description: 'Ajustes del sistema y feature flags',
      icon: <SettingsIcon sx={{ fontSize: 60, color: '#95A5A6' }} />,
      path: '/portal-redthread/configuracion',
      color: '#95A5A6'
    }
  ];

  return (
    <AdminLayout>
      <Container maxWidth="lg">
        <Box sx={{ py: 4 }}>
          {/* Header */}
          <Box sx={{ mb: 4, textAlign: 'center' }}>
            <AdminPanelSettingsIcon sx={{ fontSize: 80, color: 'primary.main', mb: 2 }} />
            <Typography variant="h3" fontWeight={700} gutterBottom>
              Portal de Administración
            </Typography>
            <Typography variant="h6" color="text.secondary">
              Red Thread - Panel de Control
            </Typography>
          </Box>

          {/* Modules Grid */}
          <Grid container spacing={4}>
            {modules.map((module) => (
              <Grid item xs={12} md={4} key={module.title}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'all 0.3s',
                    cursor: 'pointer',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: 6,
                    },
                  }}
                  onClick={() => router.push(module.path)}
                >
                  <CardContent
                    sx={{
                      flexGrow: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      textAlign: 'center',
                      p: 4,
                    }}
                  >
                    {module.icon}
                    <Typography variant="h5" fontWeight={600} sx={{ mt: 2, mb: 1 }}>
                      {module.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {module.description}
                    </Typography>
                    <Button
                      variant="contained"
                      sx={{
                        mt: 3,
                        bgcolor: module.color,
                        '&:hover': {
                          bgcolor: module.color,
                          opacity: 0.9,
                        },
                      }}
                    >
                      Acceder
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Info Section */}
          <Paper sx={{ mt: 4, p: 3, bgcolor: 'info.light' }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              ℹ️ Información
            </Typography>
            <Typography variant="body2">
              Este es el portal de administración de Red Thread. Desde aquí puedes gestionar eventos,
              empleados, roles y ver métricas de la plataforma.
            </Typography>
          </Paper>
        </Box>
      </Container>
    </AdminLayout>
  );
}
