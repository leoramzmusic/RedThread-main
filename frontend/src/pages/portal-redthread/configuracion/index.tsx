import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Switch,
  FormControlLabel,
  TextField,
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import AdminLayout from '../../../components/layout/AdminLayout';
import apiClient from '../../../services/api';

interface SystemOption {
  id: string;
  value: string;
  label: string;
  is_active: boolean;
}

interface FeatureFlag {
  id: string;
  key: string;
  name: string;
  enabled: boolean;
}

export default function AdminConfiguracion() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<Record<string, SystemOption[]>>({});
  const [featureFlags, setFeatureFlags] = useState<FeatureFlag[]>([]);
  const [envConfig, setEnvConfig] = useState<any>(null);
  
  // Edit Dialog
  const [editOption, setEditOption] = useState<SystemOption | null>(null);
  const [editLabel, setEditLabel] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [settingsRes, flagsRes] = await Promise.all([
        apiClient.get('/portal-redthread/configuracion/ajustes'),
        apiClient.get('/portal-redthread/configuracion/feature-flags')
      ]);
      
      setSettings(settingsRes.data.system_options);
      setEnvConfig(settingsRes.data.environment);
      setFeatureFlags(flagsRes.data);
    } catch (err) {
      console.error('Error fetching configuration:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFlag = async (key: string, enabled: boolean) => {
    try {
      await apiClient.post(`/portal-redthread/configuracion/feature-flags/${key}/toggle`, {
        enabled
      });
      // Update local state
      setFeatureFlags(prev => prev.map(f => 
        f.key === key ? { ...f, enabled } : f
      ));
    } catch (err) {
      alert('Error al cambiar feature flag');
    }
  };

  const handleEditOption = (option: SystemOption) => {
    setEditOption(option);
    setEditLabel(option.label);
  };

  const handleSaveOption = async () => {
    if (!editOption) return;

    try {
      await apiClient.put(`/portal-redthread/configuracion/ajustes/opcion/${editOption.id}`, {
        label: editLabel
      });
      setEditOption(null);
      fetchData();
    } catch (err) {
      alert('Error al guardar opción');
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
              Configuración del Sistema
            </Typography>
          </Box>

          <Grid container spacing={4}>
            {/* Feature Flags */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, height: '100%' }}>
                <Typography variant="h6" gutterBottom>
                  Feature Flags
                </Typography>
                <Typography variant="body2" color="text.secondary" mb={2}>
                  Activa o desactiva funcionalidades globales del sistema.
                </Typography>
                <List>
                  {featureFlags.map((flag) => (
                    <ListItem key={flag.id} divider>
                      <ListItemText 
                        primary={flag.name} 
                        secondary={flag.key}
                      />
                      <ListItemSecondaryAction>
                        <Switch
                          edge="end"
                          checked={flag.enabled}
                          onChange={(e) => handleToggleFlag(flag.key, e.target.checked)}
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                  {featureFlags.length === 0 && (
                    <Typography color="text.secondary" align="center" py={2}>
                      No hay feature flags configurados
                    </Typography>
                  )}
                </List>
              </Paper>
            </Grid>

            {/* Environment Info */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, height: '100%' }}>
                <Typography variant="h6" gutterBottom>
                  Información del Entorno
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemText primary="App Name" secondary={envConfig?.app_name} />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="Version" secondary={envConfig?.version} />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="Environment" secondary={envConfig?.environment} />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Debug Mode" 
                      secondary={envConfig?.debug ? 'Enabled' : 'Disabled'} 
                    />
                  </ListItem>
                </List>
              </Paper>
            </Grid>

            {/* System Options */}
            <Grid item xs={12}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Opciones del Sistema
                </Typography>
                <Grid container spacing={3}>
                  {Object.entries(settings).map(([category, options]) => (
                    <Grid item xs={12} md={6} key={category}>
                      <Typography variant="subtitle1" color="primary" sx={{ textTransform: 'capitalize', mt: 2, mb: 1 }}>
                        {category.replace('_', ' ')}
                      </Typography>
                      <List dense disablePadding>
                        {options.map((opt) => (
                          <ListItem key={opt.id}>
                            <ListItemText 
                              primary={opt.label} 
                              secondary={opt.value}
                            />
                            <ListItemSecondaryAction>
                              <IconButton size="small" onClick={() => handleEditOption(opt)}>
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </ListItemSecondaryAction>
                          </ListItem>
                        ))}
                      </List>
                    </Grid>
                  ))}
                </Grid>
              </Paper>
            </Grid>
          </Grid>

          {/* Edit Dialog */}
          <Dialog open={!!editOption} onClose={() => setEditOption(null)}>
            <DialogTitle>Editar Opción</DialogTitle>
            <DialogContent>
              <Box pt={1}>
                <TextField
                  label="Etiqueta / Nombre"
                  fullWidth
                  value={editLabel}
                  onChange={(e) => setEditLabel(e.target.value)}
                />
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setEditOption(null)}>Cancelar</Button>
              <Button variant="contained" onClick={handleSaveOption} startIcon={<SaveIcon />}>
                Guardar
              </Button>
            </DialogActions>
          </Dialog>
        </Box>
      </Container>
    </AdminLayout>
  );
}
