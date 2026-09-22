import React, { useEffect, useState } from 'react';
import {
  Box, Container, Typography, Paper, Grid, Switch, FormControlLabel,
  Button, Divider, List, ListItem, ListItemText, ListItemIcon,
  CircularProgress, Alert, Chip, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Tooltip,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SecurityIcon from '@mui/icons-material/Security';
import DevicesIcon from '@mui/icons-material/Devices';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import BlockIcon from '@mui/icons-material/Block';
import LogoutIcon from '@mui/icons-material/Logout';
import LaptopIcon from '@mui/icons-material/Laptop';
import PhoneIphoneIcon from '@mui/icons-material/PhoneIphone';
import TabletMacIcon from '@mui/icons-material/TabletMac';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { useRouter } from 'next/router';
import AdminLayout from '../../../components/layout/AdminLayout';
import adminApiClient from '../../../services/adminApi';

interface SessionItem {
  id: string;
  device_type: string;
  device_name: string;
  device_os: string;
  ip_address: string;
  location: { country?: string; city?: string } | null;
  remember_me: boolean;
  created_at: string;
  last_activity_at: string;
  expires_at: string;
}

const STORAGE_KEY = 'reth-sec-alerts';

function readAlertsPref(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) return true;
    return JSON.parse(raw) as boolean;
  } catch {
    return true;
  }
}

function writeAlertsPref(value: boolean) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(value)); } catch {}
}

function deviceIcon(type: string) {
  if (type === 'mobile') return <PhoneIphoneIcon fontSize="small" />;
  if (type === 'tablet') return <TabletMacIcon fontSize="small" />;
  if (type === 'web') return <LaptopIcon fontSize="small" />;
  return <HelpOutlineIcon fontSize="small" />;
}

function fmt(iso: string) {
  try {
    return new Date(iso).toLocaleString('es-MX', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export default function ConfiguracionSeguridad() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving2fa, setSaving2fa] = useState(false);
  const [is2fa, setIs2fa] = useState(false);
  const [alertsOn, setAlertsOn] = useState(true);
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmLogoutAll, setConfirmLogoutAll] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setAlertsOn(readAlertsPref());
      try {
        const [meRes, sessRes] = await Promise.all([
          adminApiClient.get('/portal-redthread/auth/me'),
          adminApiClient.get('/portal-redthread/auth/sessions'),
        ]);
        setIs2fa(!!meRes.data.is_2fa_enabled);
        setSessions(Array.isArray(sessRes.data) ? sessRes.data : []);
      } catch (err) {
        console.error('Error loading security data:', err);
        setError('No se pudo cargar la información de seguridad.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const flash = (msg: string) => {
    setSuccess(msg);
    setError(null);
    setTimeout(() => setSuccess(null), 3500);
  };

  const handleToggle2fa = async (enabled: boolean) => {
    setSaving2fa(true);
    try {
      const res = await adminApiClient.put('/portal-redthread/auth/me/2fa', { enabled });
      setIs2fa(!!res.data.is_2fa_enabled);
      flash(res.data.is_2fa_enabled ? 'Autenticación de dos factores activada.' : 'Autenticación de dos factores desactivada.');
    } catch (err) {
      console.error('Error updating 2FA:', err);
      setError('No se pudo actualizar la autenticación de dos factores.');
    } finally {
      setSaving2fa(false);
    }
  };

  const handleToggleAlerts = (enabled: boolean) => {
    setAlertsOn(enabled);
    writeAlertsPref(enabled);
    flash(enabled ? 'Alertas de dispositivo desconocido activadas.' : 'Alertas de dispositivo desconocido desactivadas.');
  };

  const loadSessions = async () => {
    try {
      const res = await adminApiClient.get('/portal-redthread/auth/sessions');
      setSessions(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Error refreshing sessions:', err);
    }
  };

  const handleRevoke = async (sessionId: string) => {
    setRevokingId(sessionId);
    try {
      await adminApiClient.delete(`/portal-redthread/auth/sessions/${sessionId}`);
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      flash('Sesión cerrada.');
    } catch (err) {
      console.error('Error revoking session:', err);
      setError('No se pudo cerrar la sesión.');
    } finally {
      setRevokingId(null);
    }
  };

  const handleLogoutAll = async () => {
    try {
      await adminApiClient.post('/portal-redthread/auth/logout-all');
      setConfirmLogoutAll(false);
      flash('Todas las sesiones fueron cerradas.');
      await loadSessions();
    } catch (err) {
      console.error('Error logout-all:', err);
      setError('No se pudieron cerrar todas las sesiones.');
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
          <Box display="flex" alignItems="center" gap={2} mb={1}>
            <IconButton onClick={() => router.push('/portal-redthread/configuracion')}>
              <ArrowBackIcon />
            </IconButton>
            <SecurityIcon color="primary" />
            <Typography variant="h4" fontWeight={700}>
              Seguridad
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" mb={3}>
            Autenticación de dos factores, alertas de dispositivo desconocido y sesiones activas.
          </Typography>

          {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>{success}</Alert>}
          {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

          <Grid container spacing={3}>
            {/* 2FA */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, height: '100%' }}>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <SecurityIcon color="primary" fontSize="small" />
                  <Typography variant="h6">Autenticación de dos factores (2FA)</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" mb={2}>
                  Solicita un segundo paso al iniciar sesión para proteger tu cuenta.
                </Typography>
                <FormControlLabel
                  control={
                    <Switch
                      checked={is2fa}
                      onChange={(e) => handleToggle2fa(e.target.checked)}
                      disabled={saving2fa}
                    />
                  }
                  label={is2fa ? '2FA activada' : '2FA desactivada'}
                />
                {saving2fa && (
                  <Box display="flex" alignItems="center" gap={1} mt={1}>
                    <CircularProgress size={16} />
                    <Typography variant="caption" color="text.secondary">Guardando…</Typography>
                  </Box>
                )}
                <Divider sx={{ my: 2 }} />
                <List dense disablePadding>
                  <ListItem disableGutters>
                    <ListItemIcon sx={{ minWidth: 36 }}><DevicesIcon fontSize="small" /></ListItemIcon>
                    <ListItemText
                      primary="Estado actual"
                      secondary={is2fa ? 'Protegida con segundo factor' : 'Solo contraseña'}
                    />
                  </ListItem>
                </List>
              </Paper>
            </Grid>

            {/* Unknown device alerts */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, height: '100%' }}>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <NotificationsActiveIcon color="primary" fontSize="small" />
                  <Typography variant="h6">Alertas de dispositivo desconocido</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" mb={2}>
                  Recibe una notificación cuando se inicie sesión desde un dispositivo o navegador nuevo.
                </Typography>
                <FormControlLabel
                  control={
                    <Switch
                      checked={alertsOn}
                      onChange={(e) => handleToggleAlerts(e.target.checked)}
                    />
                  }
                  label={alertsOn ? 'Alertas activadas' : 'Alertas desactivadas'}
                />
                <Divider sx={{ my: 2 }} />
                <Alert severity="info" variant="outlined" sx={{ py: 0 }}>
                  Las alertas se guardan en este navegador mientras la integración de correo no esté disponible.
                </Alert>
              </Paper>
            </Grid>

            {/* Active sessions */}
            <Grid item xs={12}>
              <Paper sx={{ p: 3 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2} mb={2}>
                  <Box>
                    <Typography variant="h6">Sesiones activas</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {sessions.length} {sessions.length === 1 ? 'sesión' : 'sesiones'} en curso en este momento.
                    </Typography>
                  </Box>
                  <Box display="flex" gap={1}>
                    <Button
                      variant="outlined"
                      startIcon={<LogoutIcon />}
                      color="error"
                      onClick={() => setConfirmLogoutAll(true)}
                      disabled={sessions.length === 0}
                    >
                      Cerrar todas las sesiones
                    </Button>
                  </Box>
                </Box>

                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Dispositivo</TableCell>
                        <TableCell>Sistema</TableCell>
                        <TableCell>IP</TableCell>
                        <TableCell>Última actividad</TableCell>
                        <TableCell>Expira</TableCell>
                        <TableCell align="right">Acciones</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {sessions.map((s) => (
                        <TableRow key={s.id} hover>
                          <TableCell>
                            <Box display="flex" alignItems="center" gap={1}>
                              {deviceIcon(s.device_type)}
                              <Box>
                                <Typography variant="body2" fontWeight={600}>{s.device_name || 'Navegador'}</Typography>
                                <Chip
                                  size="small"
                                  label={s.device_type}
                                  color={s.device_type === 'web' ? 'primary' : 'default'}
                                  variant="outlined"
                                />
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>{s.device_os}</TableCell>
                          <TableCell>{s.ip_address}</TableCell>
                          <TableCell>{fmt(s.last_activity_at)}</TableCell>
                          <TableCell>{fmt(s.expires_at)}</TableCell>
                          <TableCell align="right">
                            <Tooltip title="Cerrar esta sesión">
                              <span>
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => handleRevoke(s.id)}
                                  disabled={revokingId === s.id}
                                >
                                  <BlockIcon fontSize="small" />
                                </IconButton>
                              </span>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                      {sessions.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6}>
                            <Typography color="text.secondary" align="center" py={2}>
                              No hay sesiones activas.
                            </Typography>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Grid>
          </Grid>

          <Dialog open={confirmLogoutAll} onClose={() => setConfirmLogoutAll(false)}>
            <DialogTitle>Cerrar todas las sesiones</DialogTitle>
            <DialogContent>
              <Typography variant="body2">
                Se cerrarán todas las sesiones activas, incluida la actual. Tendrás que iniciar sesión de nuevo.
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setConfirmLogoutAll(false)}>Cancelar</Button>
              <Button color="error" variant="contained" onClick={handleLogoutAll} startIcon={<LogoutIcon />}>
                Cerrar todas
              </Button>
            </DialogActions>
          </Dialog>
        </Box>
      </Container>
    </AdminLayout>
  );
}
