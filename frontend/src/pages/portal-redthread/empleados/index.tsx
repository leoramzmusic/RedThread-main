import { useState } from 'react';
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
  Tabs,
  Tab,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PeopleIcon from '@mui/icons-material/People';
import SecurityIcon from '@mui/icons-material/Security';
import AdminLayout from '../../../components/layout/AdminLayout';

export default function AdminEmpleados() {
  const router = useRouter();
  const [tabValue, setTabValue] = useState(0);

  return (
    <AdminLayout>
      <Container maxWidth="lg">
        <Box sx={{ py: 4 }}>
          <Box display="flex" alignItems="center" gap={2} mb={3}>
            <IconButton onClick={() => router.push('/portal-redthread')}>
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h4" fontWeight={700}>
              Gestión de Empleados
            </Typography>
          </Box>

          <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} sx={{ mb: 3 }}>
            <Tab label="Empleados" />
            <Tab label="Roles" />
            <Tab label="Permisos" />
          </Tabs>

          {tabValue === 0 && (
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Lista de Empleados
              </Typography>
              <Typography color="text.secondary">
                Funcionalidad pendiente de implementación
              </Typography>
            </Paper>
          )}

          {tabValue === 1 && (
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Gestión de Roles
              </Typography>
              <Grid container spacing={2} sx={{ mt: 2 }}>
                {['Admin', 'Moderador', 'Usuario'].map((rol) => (
                  <Grid item xs={12} md={4} key={rol}>
                    <Card>
                      <CardContent>
                        <SecurityIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                        <Typography variant="h6">{rol}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Gestionar permisos del rol
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          )}

          {tabValue === 2 && (
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Gestión de Permisos
              </Typography>
              <Typography color="text.secondary">
                Funcionalidad pendiente de implementación
              </Typography>
            </Paper>
          )}
        </Box>
      </Container>
    </AdminLayout>
  );
}
