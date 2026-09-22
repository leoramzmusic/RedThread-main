import React, { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import NextLink from 'next/link';
import {
  Box, Container, Typography, Paper, Breadcrumbs, Link, Grid,
  TextField, Button, Avatar, Chip, Divider, Alert, Switch, FormControlLabel,
  Select, MenuItem, FormControl, InputLabel, List, ListItem, ListItemText,
  ListItemIcon, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions,
  ToggleButton, ToggleButtonGroup, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, IconButton, Tooltip, Stack, Badge,
} from '@mui/material';
import {
  Person as PersonIcon, Save as SaveIcon, PhotoCamera as PhotoIcon,
  Badge as BadgeIcon, Report as ReportIcon, Security as SecurityIcon,
  History as HistoryIcon, Notifications as NotificationsIcon,
  Description as DescriptionIcon, ContactSupport as SupportIcon,
  Download as DownloadIcon, Print as PrintIcon, Lock as LockIcon,
  CheckCircle as CheckIcon, Warning as WarnIcon, Error as ErrorIcon,
  SupportAgent as AgentIcon, Schedule as ScheduleIcon, LightMode, DarkMode,
  Edit as EditIcon, Close as CloseIcon,
} from '@mui/icons-material';
import AdminLayout from '../../../components/layout/AdminLayout';
import CredentialCard from '../../../components/admin/CredentialCard';
import CredentialBack from '../../../components/admin/CredentialBack';
import adminApiClient from '../../../services/adminApi';
import { getMediaUrl } from '../../../utils/media';
import { useAppTheme } from '../../../context/ThemeContext';
import { loadCredentialDesign, cardPropsFromDesign, backPropsFromDesign, type CredentialDesignConfig } from '../../../utils/credentialDesign';
import {
  EMPTY_PROFILE, mapApiToProfile, profileToUpdatePayload, validateProfile,
  type EmployeeProfile,
} from '../../../utils/employeeProfile';

type ReportKind = 'incidente' | 'seguridad';
type ReportStatus = 'pendiente' | 'en_revision' | 'resuelto';

interface MyReport {
  id: string;
  kind: ReportKind;
  category: string;
  title: string;
  description: string;
  status: ReportStatus;
  createdAt: string;
  resolution?: string;
  attachments?: string[];
}

const REPORT_STATUS_META: Record<ReportStatus, { label: string; color: 'default' | 'warning' | 'success' | 'error'; icon: React.ReactNode }> = {
  pendiente: { label: 'Pendiente', color: 'warning', icon: <ScheduleIcon fontSize="small" /> },
  en_revision: { label: 'En revisión', color: 'default', icon: <HistoryIcon fontSize="small" /> },
  resuelto: { label: 'Resuelto', color: 'success', icon: <CheckIcon fontSize="small" /> },
};

const SECTION_IDS = [
  'perfil', 'preferencias', 'credenciales', 'reportar-incidente', 'reportar-seguridad',
  'seguimiento', 'historial', 'notificaciones', 'documentos', 'seguridad', 'auditoria', 'soporte',
] as const;

const SECTION_TITLES: Record<string, string> = {
  perfil: 'Perfil personal',
  preferencias: 'Preferencias',
  credenciales: 'Historial de credenciales',
  'reportar-incidente': 'Reportar incidente',
  'reportar-seguridad': 'Reportar seguridad',
  seguimiento: 'Seguimiento de reportes',
  historial: 'Historial de reportes',
  notificaciones: 'Notificaciones',
  documentos: 'Documentos',
  seguridad: 'Seguridad (2FA)',
  auditoria: 'Auditoría personal',
  soporte: 'Soporte / RRHH',
};

const SECTION_BLURBS: Record<string, string> = {
  perfil: 'Foto, nombre y datos de contacto de tu cuenta.',
  preferencias: 'Idioma, formatos, tema y notificaciones del portal.',
  credenciales: 'Credenciales emitidas, vigencia y estado.',
  'reportar-incidente': 'Fallas técnicas, problemas del portal o errores de datos.',
  'reportar-seguridad': 'Robo/extravío de credencial o acceso no autorizado.',
  seguimiento: 'Estado de cada reporte enviado.',
  historial: 'Listado con fecha, tipo y resolución.',
  notificaciones: 'Alertas de vencimiento, cambios y reportes.',
  documentos: 'Credencial en PDF/JSON y comprobantes.',
  seguridad: 'Doble autenticación y acceso a la cuenta.',
  auditoria: 'Registro de accesos al portal.',
  soporte: 'Mesa de ayuda y contacto con RRHH.',
};

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

export default function MiPerfilPage() {
  const router = useRouter();
  const { mode, setMode } = useAppTheme();
  const view = (router.query.tab as string) || 'perfil';
  const sectionTitle = SECTION_TITLES[view] || 'Mi perfil';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Perfil — mismo registro que edición de empleado (auth/me ↔ empleados/{id})
  const [profile, setProfile] = useState<EmployeeProfile>({ ...EMPTY_PROFILE });
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  // Datos administrativos (solo lectura — los administra jefe/RRHH)
  const [meMeta, setMeMeta] = useState<{ roles: string[]; department_id: string | null }>({
    roles: [],
    department_id: null,
  });
  const [deptName, setDeptName] = useState<string | null>(null);

  // Preferencias
  const [prefs, setPrefs] = useState({
    language: 'es',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24h',
    notifyExpiry: true,
    notifyDataChange: true,
    notifyReports: true,
    theme: mode as string,
  });

  // Diseño de credencial
  const [credDesign, setCredDesign] = useState<CredentialDesignConfig>({});
  const credCard = useMemo(() => cardPropsFromDesign(credDesign), [credDesign]);
  const credBack = useMemo(() => backPropsFromDesign(credDesign), [credDesign]);

  // Credenciales emitidas (demo + local)
  const [credentials, setCredentials] = useState<{
    id: string; version: string; issued: string; expires: string;
    status: 'activa' | 'extraviada' | 'bloqueada'; designName?: string;
  }[]>([]);

  // Reportes
  const [reports, setReports] = useState<MyReport[]>([]);
  const [reportForm, setReportForm] = useState({ category: '', title: '', description: '' });
  const [submittingReport, setSubmittingReport] = useState(false);

  // Notificaciones
  const [notifications, setNotifications] = useState<{
    id: string; title: string; body: string; at: string; read: boolean;
    type: 'expiry' | 'report' | 'data' | 'system';
  }[]>([]);

  // 2FA
  const [twoFa, setTwoFa] = useState(false);
  const [twoFaDialog, setTwoFaDialog] = useState(false);
  const [twoFaCode, setTwoFaCode] = useState('');

  // Auditoría de accesos
  const [accessLog, setAccessLog] = useState<{ id: string; at: string; action: string; ip: string }[]>([]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await adminApiClient.get('/portal-redthread/auth/me');
        if (!alive) return;
        setProfile(mapApiToProfile(res.data));
        const meta = {
          roles: Array.isArray(res.data.roles) ? res.data.roles.map(String) : [],
          department_id: res.data.department_id ? String(res.data.department_id) : null,
        };
        setMeMeta(meta);
        if (meta.department_id) {
          try {
            const deps = await adminApiClient.get('/portal-redthread/departments/');
            const list = Array.isArray(deps.data) ? deps.data : [];
            const found = list.find((d: any) => String(d.id) === meta.department_id);
            if (alive) setDeptName(found?.name || null);
          } catch {
            // sin permiso o sin conexión — se muestra "—"
          }
        }
      } catch {
        // offline / no session — cache local del último perfil sincronizado
        const cached = readJson<Partial<EmployeeProfile> | null>('reth-my-profile', null);
        if (cached && typeof cached === 'object') {
          setProfile({ ...EMPTY_PROFILE, ...cached });
        }
      } finally {
        if (alive) setLoading(false);
      }

      const design = await loadCredentialDesign();
      if (alive) setCredDesign(design);

      if (alive) {
        setPrefs((p) => ({ ...p, ...readJson('reth-my-prefs', {}) }));
        setReports(readJson<MyReport[]>('reth-my-reports', []));
        setNotifications(readJson('reth-my-notifications', [
          { id: 'n1', title: 'Credencial por vencer', body: 'Tu credencial vence en 30 días. Solicita renovación con RRHH.', at: new Date().toISOString(), read: false, type: 'expiry' },
          { id: 'n2', title: 'Datos actualizados', body: 'Se confirmó la actualización de tu teléfono de contacto.', at: new Date(Date.now() - 86400000).toISOString(), read: true, type: 'data' },
        ]));
        setAccessLog(readJson('reth-my-access', [
          { id: 'a1', at: new Date().toISOString(), action: 'Login portal admin', ip: '127.0.0.1' },
        ]));
        setTwoFa(readJson('reth-my-2fa', false));
        setCredentials(readJson('reth-my-credentials', [
          {
            id: 'cred-1',
            version: 'v1',
            issued: new Date(Date.now() - 365 * 86400000).toISOString().slice(0, 10),
            expires: new Date(Date.now() + 4 * 365 * 86400000).toISOString().slice(0, 10),
            status: 'activa',
            designName: String(design.designName || 'Diseño principal'),
          },
          {
            id: 'cred-0',
            version: 'v0',
            issued: new Date(Date.now() - 6 * 365 * 86400000).toISOString().slice(0, 10),
            expires: new Date(Date.now() - 1 * 365 * 86400000).toISOString().slice(0, 10),
            status: 'extraviada',
            designName: 'Antigua',
          },
        ]));

        // Registro de acceso personal
        const log = readJson<{ id: string; at: string; action: string; ip: string }[]>('reth-my-access', []);
        log.unshift({ id: `a-${Date.now()}`, at: new Date().toISOString(), action: 'Visita a Mi perfil', ip: 'local' });
        writeJson('reth-my-access', log.slice(0, 50));
        setAccessLog(log.slice(0, 50));
      }
    })();
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    setPrefs((p) => ({ ...p, theme: mode }));
  }, [mode]);

  const flash = (msg: string) => {
    setSuccess(msg);
    setError(null);
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleAvatar = (file: File) => {
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/jpg'].includes(file.type)) {
      setError('Usa JPG, PNG o WebP');
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      setError('Máximo 3MB');
      return;
    }
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = () => setAvatarPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async () => {
    const validationError = validateProfile(profile, {
      requireAvatar: true,
      hasAvatar: !!avatarPreview || !!profile.avatar,
    });
    if (validationError) {
      setError(validationError);
      return;
    }
    setSaving(true);
    try {
      // 1) Persistir campos en el MISMO registro que EmployeeEditForm
      const payload = profileToUpdatePayload(profile);
      await adminApiClient.put('/portal-redthread/auth/me', payload);

      // 2) Subir foto al mismo bucket/auditoría si hay archivo nuevo
      if (avatarFile) {
        const fd = new FormData();
        fd.append('file', avatarFile);
        await adminApiClient.post('/portal-redthread/auth/me/avatar', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      // 3) Releer desde el backend para reflejar el registro unificado
      const fresh = await adminApiClient.get('/portal-redthread/auth/me');
      const next = mapApiToProfile(fresh.data);
      setProfile(next);
      writeJson('reth-my-profile', next);
      setAvatarFile(null);
      setAvatarPreview(null);
      setEditingProfile(false);
      flash('Perfil actualizado correctamente.');
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : 'No se pudo guardar el perfil.');
    } finally {
      setSaving(false);
    }
  };

  const handleSavePrefs = () => {
    writeJson('reth-my-prefs', prefs);
    if (prefs.theme === 'dark' || prefs.theme === 'light') setMode(prefs.theme as 'dark' | 'light');
    flash('Preferencias guardadas.');
  };

  const handleSubmitReport = (kind: ReportKind) => {
    if (!reportForm.category || !reportForm.title.trim()) {
      setError('Selecciona categoría y escribe un título.');
      return;
    }
    setSubmittingReport(true);
    const report: MyReport = {
      id: `rep-${Date.now()}`,
      kind,
      category: reportForm.category,
      title: reportForm.title.trim(),
      description: reportForm.description.trim(),
      status: 'pendiente',
      createdAt: new Date().toISOString(),
    };
    const next = [report, ...reports];
    setReports(next);
    writeJson('reth-my-reports', next);

    const notif = {
      id: `n-${Date.now()}`,
      title: kind === 'seguridad' ? 'Reporte de seguridad recibido' : 'Reporte de incidente recibido',
      body: `«${report.title}» — estado: pendiente`,
      at: new Date().toISOString(),
      read: false,
      type: 'report' as const,
    };
    const nextN = [notif, ...notifications];
    setNotifications(nextN);
    writeJson('reth-my-notifications', nextN);

    setReportForm({ category: '', title: '', description: '' });
    setSubmittingReport(false);
    flash('Reporte enviado. Te notificaremos al cambiar de estado.');
    router.push(`/portal-redthread/mi-perfil?tab=seguimiento`, undefined, { shallow: true });
  };

  const markNotifRead = (id: string) => {
    const next = notifications.map((n) => (n.id === id ? { ...n, read: true } : n));
    setNotifications(next);
    writeJson('reth-my-notifications', next);
  };

  const toggleCredentialStatus = (id: string, status: 'activa' | 'extraviada' | 'bloqueada') => {
    const next = credentials.map((c) => (c.id === id ? { ...c, status } : c));
    setCredentials(next);
    writeJson('reth-my-credentials', next);
    flash('Estado de credencial actualizado.');
  };

  const enable2Fa = () => {
    if (twoFaCode.trim().length < 6) {
      setError('Ingresa el código de 6 dígitos de tu app autenticadora.');
      return;
    }
    setTwoFa(true);
    writeJson('reth-my-2fa', true);
    setTwoFaDialog(false);
    setTwoFaCode('');
    flash('Doble autenticación activada.');
  };

  const disable2Fa = () => {
    setTwoFa(false);
    writeJson('reth-my-2fa', false);
    flash('Doble autenticación desactivada.');
  };

  const downloadCredentialJson = () => {
    const cfg = readJson('reth-credential-config', credDesign);
    const blob = new Blob([JSON.stringify(cfg, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `credencial-${profile.employee_id || 'empleado'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <AdminLayout>
        <Box display="flex" justifyContent="center" py={10}><CircularProgress /></Box>
      </AdminLayout>
    );
  }

  const fullName = `${profile.first_name} ${profile.last_name}`.trim() || 'Mi perfil';
  const sectionBlurb = SECTION_BLURBS[view] || SECTION_BLURBS.perfil;

  const activeCred = credentials.find((c) => c.status === 'activa');
  const credStatus = activeCred?.status || credentials[0]?.status || null;
  const credStatusLabel = credStatus
    ? credStatus.charAt(0).toUpperCase() + credStatus.slice(1)
    : '—';
  const daysToExpiry = activeCred
    ? Math.ceil((new Date(activeCred.expires).getTime() - Date.now()) / 86400000)
    : null;
  const credExpiringSoon = daysToExpiry !== null && daysToExpiry >= 0 && daysToExpiry <= 30;
  const rolesLabel = meMeta.roles.map((r) => r.replace(/_/g, ' ')).join(', ');
  const puestoLabel = rolesLabel || deptName || 'Sin asignar';
  const credBadgeColor: 'success' | 'error' | 'warning' | 'default' =
    credStatus === 'activa' ? 'success'
      : credStatus === 'bloqueada' ? 'error'
        : credStatus === 'extraviada' ? 'warning'
          : 'default';

  return (
    <AdminLayout>
      <Head><title>{sectionTitle} | Admin Portal ReTh</title></Head>
      <Box sx={{ py: 3 }}>
        <Container maxWidth="xl">
          <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 3 }}>
            <Link component={NextLink} href="/portal-redthread" underline="hover" color="inherit">Admin</Link>
            <Link component={NextLink} href="/portal-redthread/mi-perfil?tab=perfil" underline="hover" color="inherit">Mi perfil</Link>
            {view !== 'perfil' && <Typography color="text.primary">{sectionTitle}</Typography>}
            {view === 'perfil' && <Typography color="text.primary">Perfil personal</Typography>}
          </Breadcrumbs>

          <Box display="flex" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={2} mb={3}>
            <Box>
              <Typography variant="h4" fontWeight="bold" gutterBottom>
                {view === 'perfil' ? 'Mi perfil' : sectionTitle}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {sectionBlurb}
              </Typography>
            </Box>
            <Box display="flex" gap={1} alignItems="center">
              <Chip icon={<BadgeIcon />} label={profile.employee_id || 'Sin ID'} size="small" />
              {twoFa && <Chip icon={<LockIcon />} label="2FA activo" color="success" size="small" />}
            </Box>
          </Box>

          {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>{success}</Alert>}
          {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

          <Paper sx={{ borderRadius: 3, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
            {/* ========== PERFIL (solo vista + editar) ========== */}
            {view === 'perfil' && (
              <Box sx={{ p: 3 }}>
                {editingProfile ? (
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={4}>
                      <Stack alignItems="center" spacing={2} sx={{ py: 2 }}>
                        <Badge overlap="circular" anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                          badgeContent={
                            <label style={{ cursor: 'pointer' }}>
                              <input type="file" hidden accept="image/*" onChange={(e) => e.target.files?.[0] && handleAvatar(e.target.files[0])} />
                              <Avatar sx={{ bgcolor: 'primary.main', width: 36, height: 36, border: '2px solid', borderColor: 'background.paper' }}>
                                <PhotoIcon fontSize="small" />
                              </Avatar>
                            </label>
                          }
                        >
                          <Avatar
                            src={(avatarPreview || profile.avatar || '') ? getMediaUrl(avatarPreview || profile.avatar || '') : undefined}
                            sx={{ width: 120, height: 120, bgcolor: 'error.light', fontSize: 40 }}
                          >
                            {(profile.first_name[0] || 'M').toUpperCase()}{(profile.last_name[0] || 'P').toUpperCase()}
                          </Avatar>
                        </Badge>
                        <Typography variant="caption" color="text.secondary" textAlign="center">
                          Foto oficial 1:1 · JPG/PNG · máx 3MB · <strong>obligatoria</strong>
                        </Typography>
                        {!avatarPreview && !profile.avatar && (
                          <Chip size="small" color="warning" icon={<WarnIcon />} label="Falta foto oficial" />
                        )}
                      </Stack>
                    </Grid>
                    <Grid item xs={12} md={8}>
                      <Typography variant="subtitle2" fontWeight={700} mb={1.5} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <EditIcon fontSize="small" color="primary" /> Editar datos personales
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth required size="small" label="Nombre"
                            value={profile.first_name}
                            error={!profile.first_name.trim()}
                            helperText={!profile.first_name.trim() ? 'Obligatorio' : undefined}
                            onChange={(e) => setProfile({ ...profile, first_name: e.target.value })}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth required size="small" label="Apellido"
                            value={profile.last_name}
                            error={!profile.last_name.trim()}
                            helperText={!profile.last_name.trim() ? 'Obligatorio' : undefined}
                            onChange={(e) => setProfile({ ...profile, last_name: e.target.value })}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth required size="small" label="Correo" type="email"
                            value={profile.email}
                            error={!profile.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email.trim())}
                            helperText={!profile.email.trim() ? 'Obligatorio' : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email.trim()) ? 'Correo inválido' : undefined}
                            onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField fullWidth size="small" label="Teléfono" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField fullWidth size="small" label="Fecha de nacimiento" type="date" InputLabelProps={{ shrink: true }} value={profile.birth_date} onChange={(e) => setProfile({ ...profile, birth_date: e.target.value })} />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField fullWidth size="small" label="País" value={profile.country} onChange={(e) => setProfile({ ...profile, country: e.target.value })} />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField fullWidth size="small" label="Ciudad" value={profile.city} onChange={(e) => setProfile({ ...profile, city: e.target.value })} />
                        </Grid>
                        <Grid item xs={12}>
                          <TextField fullWidth size="small" label="Dirección" value={profile.address} onChange={(e) => setProfile({ ...profile, address: e.target.value })} />
                        </Grid>
                      </Grid>
                      <Box mt={2} display="flex" gap={1}>
                        <Button
                          variant="contained"
                          startIcon={<SaveIcon />}
                          onClick={handleSaveProfile}
                          disabled={saving}
                          sx={{ borderRadius: 2, bgcolor: '#E63946', '&:hover': { bgcolor: '#B71C1C' } }}
                        >
                          {saving ? 'Guardando…' : 'Guardar cambios'}
                        </Button>
                        <Button
                          variant="outlined"
                          startIcon={<CloseIcon />}
                          onClick={() => { setEditingProfile(false); setError(null); setAvatarFile(null); }}
                          sx={{ borderRadius: 2 }}
                        >
                          Cancelar
                        </Button>
                      </Box>
                    </Grid>
                  </Grid>
                ) : (
                  <Box>
                    {credExpiringSoon && (
                      <Alert
                        severity="warning"
                        sx={{ mb: 3 }}
                        action={
                          <Button
                            color="inherit"
                            size="small"
                            onClick={() => router.push('/portal-redthread/mi-perfil?tab=notificaciones')}
                          >
                            Ver notificaciones
                          </Button>
                        }
                      >
                        Tu credencial vence en {daysToExpiry} {daysToExpiry === 1 ? 'día' : 'días'}. Solicita renovación con RRHH.
                      </Alert>
                    )}

                    {/* Hero con degradado corporativo */}
                    <Box
                      sx={{
                        borderRadius: 3,
                        px: 3,
                        py: 4,
                        mb: 3,
                        textAlign: 'center',
                        border: '1px solid',
                        borderColor: 'divider',
                        background: (theme) =>
                          theme.palette.mode === 'dark'
                            ? 'linear-gradient(135deg, rgba(230,57,70,0.22), rgba(15,31,58,0.55))'
                            : 'linear-gradient(135deg, rgba(230,57,70,0.14), rgba(15,31,58,0.08))',
                      }}
                    >
                      <Avatar
                        src={(avatarPreview || profile.avatar || '') ? getMediaUrl(avatarPreview || profile.avatar || '') : undefined}
                        sx={{
                          width: 132, height: 132, mx: 'auto', mb: 2,
                          bgcolor: 'error.light', fontSize: 48,
                          border: '4px solid', borderColor: 'background.paper',
                        }}
                      >
                        {(profile.first_name[0] || 'M').toUpperCase()}{(profile.last_name[0] || 'P').toUpperCase()}
                      </Avatar>
                      <Typography variant="h5" fontWeight={800}>{fullName}</Typography>
                      <Typography variant="subtitle1" fontStyle="italic" color="text.secondary" mt={0.5}>
                        {puestoLabel}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" mt={1.5}>
                        {profile.email || '—'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block" mt={0.5} sx={{ letterSpacing: 1 }}>
                        ID {profile.employee_id || '—'}
                      </Typography>
                      {!profile.avatar && !avatarPreview && (
                        <Chip size="small" color="warning" icon={<WarnIcon />} label="Falta foto oficial" sx={{ mt: 1.5 }} />
                      )}
                    </Box>

                    <Grid container spacing={3}>
                      {/* Columna izquierda — datos personales (editables) */}
                      <Grid item xs={12} md={6}>
                        <Typography variant="subtitle2" fontWeight={700} mb={2} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <PersonIcon fontSize="small" color="primary" /> Datos personales
                        </Typography>
                        <List dense sx={{ bgcolor: 'action.hover', borderRadius: 2 }}>
                          <ListItem>
                            <ListItemIcon sx={{ minWidth: 36 }}><PersonIcon fontSize="small" color="action" /></ListItemIcon>
                            <ListItemText primary="Nombre completo" secondary={fullName} />
                          </ListItem>
                          <ListItem>
                            <ListItemIcon sx={{ minWidth: 36 }}><DescriptionIcon fontSize="small" color="action" /></ListItemIcon>
                            <ListItemText primary="Correo" secondary={profile.email || '—'} />
                          </ListItem>
                          <ListItem>
                            <ListItemIcon sx={{ minWidth: 36 }}><SupportIcon fontSize="small" color="action" /></ListItemIcon>
                            <ListItemText primary="Teléfono" secondary={profile.phone || '—'} />
                          </ListItem>
                          <ListItem>
                            <ListItemIcon sx={{ minWidth: 36 }}><PersonIcon fontSize="small" color="action" /></ListItemIcon>
                            <ListItemText primary="Dirección" secondary={[profile.address, profile.city, profile.country].filter(Boolean).join(', ') || '—'} />
                          </ListItem>
                          <ListItem>
                            <ListItemIcon sx={{ minWidth: 36 }}><ScheduleIcon fontSize="small" color="action" /></ListItemIcon>
                            <ListItemText primary="Fecha de nacimiento" secondary={profile.birth_date || '—'} />
                          </ListItem>
                        </List>
                        <Button
                          variant="contained"
                          startIcon={<EditIcon />}
                          onClick={() => setEditingProfile(true)}
                          sx={{ mt: 2.5, borderRadius: 2, bgcolor: '#E63946', '&:hover': { bgcolor: '#B71C1C' } }}
                        >
                          Editar datos personales
                        </Button>
                      </Grid>

                      {/* Columna derecha — datos de la empresa (solo lectura) */}
                      <Grid
                        item
                        xs={12}
                        md={6}
                        sx={{
                          borderLeft: { xs: 'none', md: '1px solid' },
                          borderColor: 'divider',
                          pl: { xs: 0, md: 3 },
                        }}
                      >
                        <Typography variant="subtitle2" fontWeight={700} mb={2} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <LockIcon fontSize="small" color="action" /> Datos de la empresa
                          <Typography variant="caption" color="text.secondary" fontWeight={400}>
                            (solo lectura)
                          </Typography>
                        </Typography>
                        <List dense sx={{ bgcolor: 'action.hover', borderRadius: 2 }}>
                          {[
                            { label: 'Departamento asignado', value: deptName || '—' },
                            { label: 'Puesto / rol', value: rolesLabel || '—' },
                            { label: 'Jerarquía', value: meMeta.roles[0]?.replace(/_/g, ' ') || '—' },
                            { label: 'ID interno de empleado', value: profile.employee_id || '—' },
                          ].map((row) => (
                            <ListItem key={row.label}>
                              <ListItemIcon sx={{ minWidth: 36 }}>
                                <Tooltip title="Este dato lo administra RRHH">
                                  <LockIcon fontSize="small" color="action" />
                                </Tooltip>
                              </ListItemIcon>
                              <ListItemText primary={row.label} secondary={row.value} />
                            </ListItem>
                          ))}
                          <ListItem>
                            <ListItemIcon sx={{ minWidth: 36 }}>
                              <Tooltip title="Este dato lo administra RRHH">
                                <LockIcon fontSize="small" color="action" />
                              </Tooltip>
                            </ListItemIcon>
                            <ListItemText
                              primary="Estado de la credencial"
                              secondary={<Chip size="small" color={credBadgeColor} label={credStatusLabel} sx={{ mt: 0.5 }} />}
                            />
                          </ListItem>
                        </List>

                        {/* Historial compacto — últimas 2 credenciales */}
                        <Divider sx={{ my: 2.5 }} />
                        <Typography variant="subtitle2" fontWeight={700} mb={1}>
                          Últimas credenciales
                        </Typography>
                        <Stack spacing={1} mb={1}>
                          {credentials.slice(0, 2).map((c) => (
                            <Box
                              key={c.id}
                              display="flex"
                              justifyContent="space-between"
                              alignItems="center"
                              gap={1}
                              sx={{ bgcolor: 'action.hover', borderRadius: 2, px: 1.5, py: 1 }}
                            >
                              <Box>
                                <Typography variant="body2" fontWeight={600}>
                                  {c.version}{c.designName ? ` · ${c.designName}` : ''}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {c.issued} → {c.expires}
                                </Typography>
                              </Box>
                              <Chip
                                size="small"
                                label={c.status.charAt(0).toUpperCase() + c.status.slice(1)}
                                color={c.status === 'activa' ? 'success' : c.status === 'bloqueada' ? 'error' : 'warning'}
                              />
                            </Box>
                          ))}
                        </Stack>
                        <Button
                          size="small"
                          endIcon={<HistoryIcon />}
                          onClick={() => router.push('/portal-redthread/mi-perfil?tab=credenciales')}
                        >
                          Ver historial completo
                        </Button>

                        <Box mt={2}>
                          <Button
                            size="small"
                            startIcon={<SupportIcon />}
                            onClick={() => router.push('/portal-redthread/mi-perfil?tab=soporte')}
                          >
                            ¿Hay un error en tus datos? Contactar a RRHH
                          </Button>
                        </Box>
                      </Grid>
                    </Grid>

                    {/* Accesos rápidos como cards */}
                    <Divider sx={{ my: 3 }} />
                    <Typography variant="subtitle2" fontWeight={700} mb={2}>
                      Accesos rápidos
                    </Typography>
                    <Grid container spacing={2}>
                      {[
                        { title: 'Historial de credenciales', desc: 'Credenciales emitidas y vigencia', icon: <HistoryIcon />, tab: 'credenciales', tone: 'error' as const },
                        { title: 'Estado de reportes', desc: 'Seguimiento de tus reportes', icon: <ReportIcon />, tab: 'seguimiento', tone: 'info' as const },
                        { title: 'Descargar credencial', desc: 'Archivo PDF/JSON de tu credencial', icon: <DownloadIcon />, tab: 'documentos', tone: 'primary' as const },
                        { title: 'Aviso de vencimiento', desc: 'Alertas de vencimiento', icon: <NotificationsIcon />, tab: 'notificaciones', tone: 'warning' as const },
                      ].map((q) => (
                        <Grid item xs={12} sm={6} md={3} key={q.tab}>
                          <Paper
                            variant="outlined"
                            onClick={() => router.push(`/portal-redthread/mi-perfil?tab=${q.tab}`)}
                            sx={{
                              p: 2,
                              borderRadius: 2,
                              cursor: 'pointer',
                              height: '100%',
                              borderColor: 'divider',
                              transition: 'transform .2s ease, box-shadow .2s ease, border-color .2s ease',
                              '&:hover': {
                                transform: 'translateY(-4px)',
                                boxShadow: 6,
                                borderColor: `${q.tone}.main`,
                              },
                            }}
                          >
                            <Box
                              sx={{
                                width: 40, height: 40, borderRadius: 1.5,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                bgcolor: `${q.tone}.main`, color: `${q.tone}.contrastText`,
                                mb: 1.5,
                              }}
                            >
                              {q.icon}
                            </Box>
                            <Typography variant="body2" fontWeight={700}>{q.title}</Typography>
                            <Typography variant="caption" color="text.secondary">{q.desc}</Typography>
                          </Paper>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                )}
              </Box>
            )}

            {/* ========== PREFERENCIAS ========== */}
            {view === 'preferencias' && (
              <Box sx={{ p: 3 }}>
                <Typography variant="subtitle2" fontWeight={700} mb={2}>Preferencias personales del portal</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={4}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Idioma del portal</InputLabel>
                      <Select value={prefs.language} label="Idioma del portal" onChange={(e) => setPrefs({ ...prefs, language: e.target.value })}>
                        <MenuItem value="es">Español</MenuItem>
                        <MenuItem value="en">English</MenuItem>
                        <MenuItem value="pt">Português</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Formato de fecha</InputLabel>
                      <Select value={prefs.dateFormat} label="Formato de fecha" onChange={(e) => setPrefs({ ...prefs, dateFormat: e.target.value })}>
                        <MenuItem value="DD/MM/YYYY">DD/MM/YYYY</MenuItem>
                        <MenuItem value="MM/DD/YYYY">MM/DD/YYYY</MenuItem>
                        <MenuItem value="YYYY-MM-DD">YYYY-MM-DD</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Formato de hora</InputLabel>
                      <Select value={prefs.timeFormat} label="Formato de hora" onChange={(e) => setPrefs({ ...prefs, timeFormat: e.target.value })}>
                        <MenuItem value="24h">24 horas</MenuItem>
                        <MenuItem value="12h">12 horas (AM/PM)</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Typography variant="caption" fontWeight={700} display="block" mb={1}>Tema</Typography>
                      <ToggleButtonGroup
                        exclusive
                        size="small"
                        value={prefs.theme}
                        onChange={(_, v) => v && setPrefs({ ...prefs, theme: v })}
                      >
                        <ToggleButton value="light"><LightMode fontSize="small" sx={{ mr: 0.5 }} /> Claro</ToggleButton>
                        <ToggleButton value="dark"><DarkMode fontSize="small" sx={{ mr: 0.5 }} /> Oscuro</ToggleButton>
                      </ToggleButtonGroup>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Typography variant="caption" fontWeight={700} display="block" mb={1}>Notificaciones</Typography>
                      <FormControlLabel control={<Switch checked={prefs.notifyExpiry} onChange={(e) => setPrefs({ ...prefs, notifyExpiry: e.target.checked })} />} label="Vencimiento de credencial" />
                      <FormControlLabel control={<Switch checked={prefs.notifyDataChange} onChange={(e) => setPrefs({ ...prefs, notifyDataChange: e.target.checked })} />} label="Cambios en datos" />
                      <FormControlLabel control={<Switch checked={prefs.notifyReports} onChange={(e) => setPrefs({ ...prefs, notifyReports: e.target.checked })} />} label="Estado de reportes" />
                    </Paper>
                  </Grid>
                </Grid>
                <Box mt={2}>
                  <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSavePrefs} sx={{ borderRadius: 2, bgcolor: '#E63946', '&:hover': { bgcolor: '#B71C1C' } }}>
                    Guardar preferencias
                  </Button>
                </Box>
              </Box>
            )}

            {/* ========== CREDENCIALES ========== */}
            {view === 'credenciales' && (
              <Box sx={{ p: 3 }}>
                <Typography variant="subtitle2" fontWeight={700} mb={1}>Credenciales emitidas</Typography>
                <Typography variant="caption" color="text.secondary" display="block" mb={2}>
                  Vigencia de 5 años. Estado: activa, extraviada o bloqueada.
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Versión</TableCell>
                        <TableCell>Diseño</TableCell>
                        <TableCell>Emitida</TableCell>
                        <TableCell>Vence</TableCell>
                        <TableCell>Estado</TableCell>
                        <TableCell align="right">Acciones</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {credentials.map((c) => (
                        <TableRow key={c.id} hover>
                          <TableCell sx={{ fontFamily: 'monospace' }}>{c.version}</TableCell>
                          <TableCell>{c.designName || '—'}</TableCell>
                          <TableCell>{c.issued}</TableCell>
                          <TableCell>{c.expires}</TableCell>
                          <TableCell>
                            <FormControl size="small" sx={{ minWidth: 120 }}>
                              <Select
                                value={c.status}
                                onChange={(e) => toggleCredentialStatus(c.id, e.target.value as any)}
                                size="small"
                              >
                                <MenuItem value="activa">Activa</MenuItem>
                                <MenuItem value="extraviada">Extraviada</MenuItem>
                                <MenuItem value="bloqueada">Bloqueada</MenuItem>
                              </Select>
                            </FormControl>
                          </TableCell>
                          <TableCell align="right">
                            <Tooltip title="Descargar config JSON"><IconButton size="small" onClick={downloadCredentialJson}><DownloadIcon fontSize="small" /></IconButton></Tooltip>
                            <Tooltip title="Imprimir"><IconButton size="small" onClick={() => window.print()}><PrintIcon fontSize="small" /></IconButton></Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                <Divider sx={{ my: 3 }} />
                <Typography variant="subtitle2" fontWeight={700} mb={2}>Vista previa con tu diseño actual</Typography>
                <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', justifyContent: 'center' }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                    <Typography variant="caption" fontWeight={700} color="text.secondary">FRENTE</Typography>
                    <CredentialCard
                      photoUrl={avatarPreview || profile.avatar}
                      firstName={profile.first_name || 'Nombre'}
                      lastName={profile.last_name || 'Apellido'}
                      employeeCode={profile.employee_id || 'EMP-0000'}
                      email={profile.email}
                      phone={profile.phone}
                      birthDate={profile.birth_date}
                      {...credCard}
                    />
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                    <Typography variant="caption" fontWeight={700} color="text.secondary">REVERSO</Typography>
                    <CredentialBack
                      employeeCode={profile.employee_id || 'EMP-0000'}
                      email={profile.email}
                      issueDate={new Date().toLocaleDateString('en-GB')}
                      expiryDate={new Date(new Date().setFullYear(new Date().getFullYear() + 5)).toLocaleDateString('en-GB')}
                      serial={`SN-${profile.employee_id || 'EMP'}-${(profile.first_name || 'XX').slice(0, 2).toUpperCase()}${(profile.last_name || 'XX').slice(0, 2).toUpperCase()}`}
                      {...credBack}
                    />
                  </Box>
                </Box>
              </Box>
            )}

            {/* ========== REPORTAR (incidente / seguridad) ========== */}
            {(view === 'reportar-incidente' || view === 'reportar-seguridad') && (
              <Box sx={{ p: 3 }}>
                <Typography variant="subtitle2" fontWeight={700} mb={1} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {view === 'reportar-seguridad' ? <SecurityIcon color="error" fontSize="small" /> : <ReportIcon color="primary" fontSize="small" />}
                  {view === 'reportar-seguridad' ? 'Reportar seguridad' : 'Reportar incidente'}
                </Typography>
                <Alert severity={view === 'reportar-seguridad' ? 'warning' : 'info'} sx={{ mb: 2 }}>
                  {view === 'reportar-seguridad'
                    ? 'Robo/extravío de credencial, acceso no autorizado u otros riesgos de seguridad.'
                    : 'Fallas técnicas, problemas del portal o errores de datos.'}
                </Alert>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Categoría</InputLabel>
                      <Select
                        value={reportForm.category}
                        label="Categoría"
                        onChange={(e) => setReportForm({ ...reportForm, category: e.target.value })}
                      >
                        {view === 'reportar-seguridad' ? (
                          <>
                            <MenuItem value="robo-credencial">Robo / extravío de credencial</MenuItem>
                            <MenuItem value="acceso-no-autorizado">Acceso no autorizado</MenuItem>
                            <MenuItem value="phishing">Phishing / fraude</MenuItem>
                            <MenuItem value="otro-seguridad">Otro (seguridad)</MenuItem>
                          </>
                        ) : (
                          <>
                            <MenuItem value="falla-tecnica">Falla técnica</MenuItem>
                            <MenuItem value="portal">Problema en el portal</MenuItem>
                            <MenuItem value="datos">Error de datos</MenuItem>
                            <MenuItem value="otro-incidente">Otro incidente</MenuItem>
                          </>
                        )}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth size="small" label="Título" value={reportForm.title} onChange={(e) => setReportForm({ ...reportForm, title: e.target.value })} />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField fullWidth multiline minRows={4} label="Descripción" value={reportForm.description} onChange={(e) => setReportForm({ ...reportForm, description: e.target.value })} />
                  </Grid>
                </Grid>
                <Box mt={2}>
                  <Button
                    variant="contained"
                    disabled={submittingReport}
                    onClick={() => handleSubmitReport(view === 'reportar-seguridad' ? 'seguridad' : 'incidente')}
                    sx={{ borderRadius: 2, bgcolor: view === 'reportar-seguridad' ? '#B91C1C' : '#E63946', '&:hover': { bgcolor: '#7F1D1D' } }}
                  >
                    Enviar reporte
                  </Button>
                </Box>
              </Box>
            )}

            {/* ========== SEGUIMIENTO ========== */}
            {view === 'seguimiento' && (
              <Box sx={{ p: 3 }}>
                <Typography variant="subtitle2" fontWeight={700} mb={2}>Seguimiento de reportes</Typography>
                {reports.length === 0 && (
                  <Alert severity="info">No tienes reportes abiertos. Usa «Reportar incidente» o «Reportar seguridad».</Alert>
                )}
                <Grid container spacing={2}>
                  {reports.map((r) => {
                    const meta = REPORT_STATUS_META[r.status];
                    return (
                      <Grid item xs={12} md={6} key={r.id}>
                        <Paper variant="outlined" sx={{ p: 2 }}>
                          <Box display="flex" justifyContent="space-between" alignItems="flex-start" gap={1} mb={1}>
                            <Box>
                              <Chip size="small" label={r.kind === 'seguridad' ? 'Seguridad' : 'Incidente'} color={r.kind === 'seguridad' ? 'error' : 'primary'} variant="outlined" />
                              <Typography variant="subtitle2" fontWeight={700} mt={0.5}>{r.title}</Typography>
                            </Box>
                            <Chip size="small" icon={meta.icon as any} label={meta.label} color={meta.color} />
                          </Box>
                          <Typography variant="caption" color="text.secondary" display="block">Categoría: {r.category}</Typography>
                          {r.description && <Typography variant="body2" sx={{ mt: 0.5 }}>{r.description}</Typography>}
                          <Typography variant="caption" color="text.secondary" display="block" mt={1}>
                            {new Date(r.createdAt).toLocaleString()}
                          </Typography>
                        </Paper>
                      </Grid>
                    );
                  })}
                </Grid>
              </Box>
            )}

            {/* ========== HISTORIAL REPORTES ========== */}
            {view === 'historial' && (
              <Box sx={{ p: 3 }}>
                <Typography variant="subtitle2" fontWeight={700} mb={2}>Historial de reportes</Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Fecha</TableCell>
                        <TableCell>Tipo</TableCell>
                        <TableCell>Título</TableCell>
                        <TableCell>Categoría</TableCell>
                        <TableCell>Estado</TableCell>
                        <TableCell>Resolución</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {reports.length === 0 && (
                        <TableRow><TableCell colSpan={6} align="center" color="text.secondary">Sin reportes registrados.</TableCell></TableRow>
                      )}
                      {reports.map((r) => {
                        const meta = REPORT_STATUS_META[r.status];
                        return (
                          <TableRow key={r.id} hover>
                            <TableCell>{new Date(r.createdAt).toLocaleDateString()}</TableCell>
                            <TableCell>{r.kind === 'seguridad' ? 'Seguridad' : 'Incidente'}</TableCell>
                            <TableCell>{r.title}</TableCell>
                            <TableCell>{r.category}</TableCell>
                            <TableCell><Chip size="small" label={meta.label} color={meta.color} /></TableCell>
                            <TableCell>{r.resolution || '—'}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}

            {/* ========== NOTIFICACIONES ========== */}
            {view === 'notificaciones' && (
              <Box sx={{ p: 3 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="subtitle2" fontWeight={700}>Notificaciones personales</Typography>
                  <Button size="small" onClick={() => {
                    const next = notifications.map((n) => ({ ...n, read: true }));
                    setNotifications(next);
                    writeJson('reth-my-notifications', next);
                  }}>Marcar todas leídas</Button>
                </Box>
                <List>
                  {notifications.length === 0 && (
                    <ListItem><ListItemText primary="Sin notificaciones." secondary="Alertas de vencimiento, cambios de datos y reportes aparecerán aquí." /></ListItem>
                  )}
                  {notifications.map((n) => (
                    <ListItem
                      key={n.id}
                      alignItems="flex-start"
                      sx={{ bgcolor: n.read ? 'transparent' : 'rgba(230,57,70,0.04)', borderRadius: 1, mb: 1, border: '1px solid', borderColor: n.read ? 'divider' : 'rgba(230,57,70,0.25)' }}
                      secondaryAction={
                        !n.read ? <Button size="small" onClick={() => markNotifRead(n.id)}>Leído</Button> : undefined
                      }
                    >
                      <ListItemIcon sx={{ minWidth: 40 }}>
                        {n.type === 'expiry' ? <WarnIcon color="warning" /> : n.type === 'report' ? <ReportIcon color="primary" /> : n.type === 'data' ? <PersonIcon /> : <NotificationsIcon />}
                      </ListItemIcon>
                      <ListItemText
                        primary={n.title}
                        secondary={`${n.body} · ${new Date(n.at).toLocaleString()}`}
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}

            {/* ========== DOCUMENTOS ========== */}
            {view === 'documentos' && (
              <Box sx={{ p: 3 }}>
                <Typography variant="subtitle2" fontWeight={700} mb={2}>Documentos personales</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={4}>
                    <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
                      <DescriptionIcon color="primary" />
                      <Typography variant="subtitle2" fontWeight={700} mt={1}>Credencial (JSON de diseño)</Typography>
                      <Typography variant="caption" color="text.secondary" display="block" mb={1.5}>Configuración de tu credencial actual para respaldo o soporte.</Typography>
                      <Button size="small" variant="outlined" startIcon={<DownloadIcon />} onClick={downloadCredentialJson}>Descargar</Button>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
                      <PrintIcon color="primary" />
                      <Typography variant="subtitle2" fontWeight={700} mt={1}>Credencial en PDF</Typography>
                      <Typography variant="caption" color="text.secondary" display="block" mb={1.5}>Usa el diálogo de impresión del navegador para exportar a PDF.</Typography>
                      <Button size="small" variant="outlined" startIcon={<PrintIcon />} onClick={() => window.print()}>Imprimir / PDF</Button>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
                      <BadgeIcon color="primary" />
                      <Typography variant="subtitle2" fontWeight={700} mt={1}>Comprobante de emisión</Typography>
                      <Typography variant="caption" color="text.secondary" display="block" mb={1.5}>Listado de credenciales con fechas de emisión y vigencia.</Typography>
                      <Button size="small" variant="outlined" onClick={() => router.push('/portal-redthread/mi-perfil?tab=credenciales', undefined, { shallow: true })}>
                        Ver credenciales
                      </Button>
                    </Paper>
                  </Grid>
                </Grid>
              </Box>
            )}

            {/* ========== SEGURIDAD 2FA ========== */}
            {view === 'seguridad' && (
              <Box sx={{ p: 3 }}>
                <Typography variant="subtitle2" fontWeight={700} mb={2}>Seguridad de la cuenta</Typography>
                <Paper variant="outlined" sx={{ p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                  <Box>
                    <Typography variant="body1" fontWeight={600}>Doble autenticación (2FA)</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Código de 6 dígitos desde tu app autenticadora (Google Authenticator, Authy, etc.).
                    </Typography>
                  </Box>
                  {twoFa ? (
                    <Box display="flex" gap={1} alignItems="center">
                      <Chip icon={<CheckIcon />} label="Activo" color="success" size="small" />
                      <Button size="small" variant="outlined" color="error" onClick={disable2Fa}>Desactivar</Button>
                    </Box>
                  ) : (
                    <Button size="small" variant="contained" startIcon={<LockIcon />} onClick={() => setTwoFaDialog(true)} sx={{ bgcolor: '#E63946', '&:hover': { bgcolor: '#B71C1C' } }}>
                      Activar 2FA
                    </Button>
                  )}
                </Paper>
                <Paper variant="outlined" sx={{ p: 2.5, mt: 2 }}>
                  <Typography variant="body1" fontWeight={600}>Contraseña</Typography>
                  <Typography variant="caption" color="text.secondary" display="block" mb={1.5}>
                    Para cambiar tu contraseña contacta a RRHH o usa el flujo de recuperación.
                  </Typography>
                  <Button size="small" variant="outlined" onClick={() => router.push('/portal-redthread/configuracion/seguridad')}>
                    Ir a configuración de seguridad
                  </Button>
                </Paper>
              </Box>
            )}

            {/* ========== AUDITORÍA ========== */}
            {view === 'auditoria' && (
              <Box sx={{ p: 3 }}>
                <Typography variant="subtitle2" fontWeight={700} mb={2}>Auditoría personal — accesos al portal</Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Fecha y hora</TableCell>
                        <TableCell>Acción</TableCell>
                        <TableCell>IP / Origen</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {accessLog.map((a) => (
                        <TableRow key={a.id} hover>
                          <TableCell>{new Date(a.at).toLocaleString()}</TableCell>
                          <TableCell>{a.action}</TableCell>
                          <TableCell sx={{ fontFamily: 'monospace' }}>{a.ip}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}

            {/* ========== SOPORTE ========== */}
            {view === 'soporte' && (
              <Box sx={{ p: 3 }}>
                <Typography variant="subtitle2" fontWeight={700} mb={2}>Soporte directo</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Paper variant="outlined" sx={{ p: 2.5, height: '100%' }}>
                      <Box display="flex" alignItems="center" gap={1} mb={1}>
                        <AgentIcon color="primary" />
                        <Typography variant="subtitle2" fontWeight={700}>Mesa de ayuda / Soporte técnico</Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary" mb={1.5}>
                        Incidencias del portal, accesos y fallas técnicas.
                      </Typography>
                      <Button size="small" variant="contained" startIcon={<SupportIcon />} onClick={() => router.push('/portal-redthread/soporte/tickets')} sx={{ borderRadius: 2 }}>
                        Abrir tickets
                      </Button>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Paper variant="outlined" sx={{ p: 2.5, height: '100%' }}>
                      <Box display="flex" alignItems="center" gap={1} mb={1}>
                        <PersonIcon color="primary" />
                        <Typography variant="subtitle2" fontWeight={700}>Contacto con RRHH</Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary" mb={0.5}>
                        Datos de contacto, renovación de credencial y cambios de puesto.
                      </Typography>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>rrhh@reth.app</Typography>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>+52 55 0000 0000</Typography>
                      <Button size="small" variant="outlined" sx={{ mt: 1.5 }} href="mailto:rrhh@reth.app">
                        Escribir a RRHH
                      </Button>
                    </Paper>
                  </Grid>
                </Grid>
              </Box>
            )}
          </Paper>
        </Container>
      </Box>

      <Dialog open={twoFaDialog} onClose={() => setTwoFaDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Activar doble autenticación</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Escanea el QR en tu app autenticadora (demo: ingresa cualquier código de 6 dígitos).
          </Typography>
          <TextField
            fullWidth
            label="Código de 6 dígitos"
            value={twoFaCode}
            onChange={(e) => setTwoFaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            inputProps={{ inputMode: 'numeric', pattern: '[0-9]*', maxLength: 6 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTwoFaDialog(false)}>Cancelar</Button>
          <Button variant="contained" onClick={enable2Fa} sx={{ bgcolor: '#E63946' }}>Activar</Button>
        </DialogActions>
      </Dialog>
    </AdminLayout>
  );
}
