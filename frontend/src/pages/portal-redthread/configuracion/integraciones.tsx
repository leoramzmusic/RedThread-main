import React, { useEffect, useState } from 'react';
import {
  Box, Container, Typography, Paper, Grid, Switch, FormControlLabel,
  Button, Divider, List, ListItem, ListItemText, ListItemIcon,
  CircularProgress, Alert, Chip, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Link,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import HubIcon from '@mui/icons-material/Hub';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import { useRouter } from 'next/router';
import AdminLayout from '../../../components/layout/AdminLayout';

const STORAGE_KEY = 'reth-integrations';

type IntegrationId = 'google-calendar' | 'outlook-calendar' | 'google-workspace' | 'microsoft-365';

interface IntegrationState {
  id: IntegrationId;
  connected: boolean;
  connectedAt?: string;
}

type IntegrationMap = Record<IntegrationId, IntegrationState>;

const DEFAULT_STATE: IntegrationMap = {
  'google-calendar': { id: 'google-calendar', connected: false },
  'outlook-calendar': { id: 'outlook-calendar', connected: false },
  'google-workspace': { id: 'google-workspace', connected: false },
  'microsoft-365': { id: 'microsoft-365', connected: false },
};

function readState(): IntegrationMap {
  if (typeof window === 'undefined') return DEFAULT_STATE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_STATE };
    const parsed = JSON.parse(raw) as Partial<IntegrationMap>;
    return { ...DEFAULT_STATE, ...parsed };
  } catch {
    return { ...DEFAULT_STATE };
  }
}

function writeState(state: IntegrationMap) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
}

function buildGoogleCalendarUrl(): string {
  const now = new Date();
  const end = new Date(now.getTime() + 60 * 60 * 1000);
  const fmt = (d: Date) =>
    d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: 'Revisión de seguridad RedThread',
    dates: `${fmt(now)}/${fmt(end)}`,
    details: 'Recordatorio generado desde el portal admin RedThread (configuración › integraciones).',
    location: 'Portal RedThread',
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function buildOutlookCalendarUrl(): string {
  const now = new Date();
  const end = new Date(now.getTime() + 60 * 60 * 1000);
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const params = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: 'Revisión de seguridad RedThread',
    startdt: fmt(now),
    enddt: fmt(end),
    body: 'Recordatorio generado desde el portal admin RedThread (configuración › integraciones).',
    location: 'Portal RedThread',
  });
  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}

const SERVICE_META: Record<IntegrationId, {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  exportUrl?: () => string;
  exportLabel?: string;
}> = {
  'google-calendar': {
    title: 'Google Calendar',
    description: 'Exporta recordatorios de vencimiento de credenciales y avisos de seguridad a tu calendario.',
    icon: <CalendarMonthIcon />,
    color: '#1a73e8',
    exportUrl: buildGoogleCalendarUrl,
    exportLabel: 'Exportar a Google Calendar',
  },
  'outlook-calendar': {
    title: 'Outlook Calendar',
    description: 'Sincroniza eventos del portal con Outlook / Microsoft Calendar.',
    icon: <CalendarMonthIcon />,
    color: '#0078d4',
    exportUrl: buildOutlookCalendarUrl,
    exportLabel: 'Exportar a Outlook',
  },
  'google-workspace': {
    title: 'Google Workspace',
    description: 'Notificaciones y avisos del portal hacia tu organización (Gmail / Workspace).',
    icon: <MailOutlineIcon />,
    color: '#ea4335',
  },
  'microsoft-365': {
    title: 'Microsoft 365',
    description: 'Notificaciones del portal hacia tu tenant de Microsoft 365.',
    icon: <CloudUploadIcon />,
    color: '#d83b01',
  },
};

export default function ConfiguracionIntegraciones() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [state, setState] = useState<IntegrationMap>({ ...DEFAULT_STATE });
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [linkService, setLinkService] = useState<IntegrationId | null>(null);
  const [linkValue, setLinkValue] = useState('');
  const [savingLink, setSavingLink] = useState(false);

  useEffect(() => {
    setState(readState());
    setLoading(false);
  }, []);

  const flash = (msg: string) => {
    setSuccess(msg);
    setError(null);
    setTimeout(() => setSuccess(null), 3500);
  };

  const handleToggle = (id: IntegrationId, connected: boolean) => {
    if (connected) {
      setLinkService(id);
      setLinkValue('');
      return;
    }
    setState(prev => {
      const next = {
        ...prev,
        [id]: { ...prev[id], connected: false, connectedAt: undefined },
      };
      writeState(next);
      return next;
    });
    flash(`${SERVICE_META[id].title} desvinculado.`);
  };

  const handleSaveLink = () => {
    if (!linkService) return;
    if (!linkValue.trim()) {
      setError('Ingresa un identificador o cuenta para vincular.');
      return;
    }
    setSavingLink(true);
    // Simula confirmación de vinculación OAuth/identificador
    setTimeout(() => {
      setState(prev => {
        const next = {
          ...prev,
          [linkService]: {
            ...prev[linkService],
            connected: true,
            connectedAt: new Date().toISOString(),
          },
        };
        writeState(next);
        return next;
      });
      setSavingLink(false);
      setLinkService(null);
      flash(`${SERVICE_META[linkService].title} vinculado correctamente.`);
    }, 400);
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

  const connectedCount = Object.values(state).filter(s => s.connected).length;

  return (
    <AdminLayout>
      <Container maxWidth="lg">
        <Box sx={{ py: 4 }}>
          <Box display="flex" alignItems="center" gap={2} mb={1}>
            <IconButton onClick={() => router.push('/portal-redthread/configuracion')}>
              <ArrowBackIcon />
            </IconButton>
            <HubIcon color="primary" />
            <Typography variant="h4" fontWeight={700}>
              Integraciones
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" mb={3}>
            Vincula servicios externos y exporta notificaciones del portal a tus calendarios y correo.
          </Typography>

          {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>{success}</Alert>}
          {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

          <Paper sx={{ p: 3, mb: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1}>
              <Typography variant="h6">Estado</Typography>
              <Chip
                label={`${connectedCount} de ${Object.keys(state).length} vinculadas`}
                color={connectedCount > 0 ? 'success' : 'default'}
                variant={connectedCount > 0 ? 'filled' : 'outlined'}
              />
            </Box>
          </Paper>

          <Grid container spacing={3}>
            {(['google-calendar', 'outlook-calendar', 'google-workspace', 'microsoft-365'] as IntegrationId[]).map((id) => {
              const meta = SERVICE_META[id];
              const item = state[id];
              return (
                <Grid item xs={12} md={6} key={id}>
                  <Paper sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <Box display="flex" alignItems="flex-start" gap={2} mb={1}>
                      <Box
                        sx={{
                          width: 44, height: 44, borderRadius: 2,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          bgcolor: `${meta.color}18`, color: meta.color,
                        }}
                      >
                        {meta.icon}
                      </Box>
                      <Box flex={1}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography variant="subtitle1" fontWeight={700}>{meta.title}</Typography>
                          {item.connected ? (
                            <Chip size="small" color="success" icon={<CheckCircleIcon />} label="Vinculada" />
                          ) : (
                            <Chip size="small" variant="outlined" icon={<RadioButtonUncheckedIcon />} label="Sin vincular" />
                          )}
                        </Box>
                        <Typography variant="body2" color="text.secondary" mt={0.5}>
                          {meta.description}
                        </Typography>
                      </Box>
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    <Box display="flex" justifyContent="space-between" alignItems="center" mt="auto" gap={1} flexWrap="wrap">
                      <FormControlLabel
                        control={
                          <Switch
                            checked={item.connected}
                            onChange={(e) => handleToggle(id, e.target.checked)}
                          />
                        }
                        label={item.connected ? 'Conectada' : 'Conectar'}
                      />
                      <Box display="flex" gap={1} flexWrap="wrap">
                        {item.connected && meta.exportUrl && (
                          <Button
                            size="small"
                            variant="outlined"
                            href={meta.exportUrl()}
                            target="_blank"
                            rel="noopener noreferrer"
                            endIcon={<OpenInNewIcon fontSize="small" />}
                          >
                            {meta.exportLabel || 'Exportar'}
                          </Button>
                        )}
                        {item.connected && item.connectedAt && (
                          <Typography variant="caption" color="text.secondary" alignSelf="center">
                            {new Date(item.connectedAt).toLocaleDateString('es-MX')}
                          </Typography>
                        )}
                      </Box>
                    </Box>

                    {item.connected && (
                      <Alert severity="info" variant="outlined" sx={{ mt: 2, py: 0 }}>
                        Los recordatorios y avisos del portal se podrán exportar a {meta.title}.
                      </Alert>
                    )}
                  </Paper>
                </Grid>
              );
            })}
          </Grid>

          <Dialog open={!!linkService} onClose={() => setLinkService(null)} fullWidth maxWidth="sm">
            <DialogTitle>
              Vincular {linkService ? SERVICE_META[linkService].title : ''}
            </DialogTitle>
            <DialogContent>
              <Typography variant="body2" color="text.secondary" mb={2}>
                Ingresa el correo o identificador de la cuenta que quieres conectar.
                El flujo OAuth completo se habilita cuando el backend exponga los endpoints correspondientes.
              </Typography>
              <TextField
                autoFocus
                fullWidth
                label="Correo o identificador"
                value={linkValue}
                onChange={(e) => setLinkValue(e.target.value)}
                placeholder="tu.cuenta@empresa.com"
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setLinkService(null)}>Cancelar</Button>
              <Button
                variant="contained"
                onClick={handleSaveLink}
                disabled={savingLink || !linkValue.trim()}
                startIcon={savingLink ? <CircularProgress size={16} /> : undefined}
              >
                Vincular
              </Button>
            </DialogActions>
          </Dialog>
        </Box>
      </Container>
    </AdminLayout>
  );
}
