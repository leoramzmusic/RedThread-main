import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Head from 'next/head';
import { Box, Container, Typography, Paper, Grid, Tabs, Tab, TextField, FormControl, InputLabel, Select, MenuItem, Switch, FormControlLabel, Button, Divider, Alert, Chip } from '@mui/material';
import { Save as SaveIcon, Palette as PaletteIcon, TextFields as TextIcon, Image as ImageIcon, ViewModule as ViewIcon, History as HistoryIcon, GetApp as ExportIcon } from '@mui/icons-material';
import AdminLayout from '@/components/layout/AdminLayout';
import CredentialCard from '@/components/admin/CredentialCard';
import CredentialBack from '@/components/admin/CredentialBack';
import adminApiClient from '@/services/adminApi';

const TEMPLATES = [
  { id: 'geometrico', label: 'Geométrico', desc: 'Diagonal rojo/azul, diamante' },
  { id: 'minimalista', label: 'Minimalista', desc: 'Limpio, sin patrones' },
  { id: 'corporativo', label: 'Corporativo', desc: 'Franjas sólidas, serio' },
];
const FONTS = ['Inter', 'Roboto', 'Open Sans', 'Montserrat', 'Poppins', 'Nunito', 'Lato'];

export default function CredencialEmpleadoConfigPage() {
  const router = useRouter();
  const query = router.query as { id?: string; employeeId?: string };
  const employeeId = (query.id || query.employeeId || '') as string;
  const [tab, setTab] = useState(0);
  const [template, setTemplate] = useState('geometrico');
  const [primary, setPrimary] = useState('#E63946');
  const [secondary, setSecondary] = useState('#0f1f3a');
  const [accent, setAccent] = useState('#3B82F6');
  const [decorLines, setDecorLines] = useState(true);
  const [font, setFont] = useState('Inter');
  const [boldName, setBoldName] = useState(true);
  const [italicRole, setItalicRole] = useState(true);
  const [logoPos, setLogoPos] = useState('superior');
  const [tagline, setTagline] = useState('RETH • Internal Access System');
  const [showDOB, setShowDOB] = useState(true);
  const [showPhone, setShowPhone] = useState(true);
  const [showEmail, setShowEmail] = useState(true);
  const [showSerial, setShowSerial] = useState(true);
  const [qrSize, setQrSize] = useState('20');
  const [qrPos, setQrPos] = useState('inferior-derecha');
  const [topText, setTopText] = useState('Valid with official photo');
  const [showSeal, setShowSeal] = useState(true);
  const [previewVersion, setPreviewVersion] = useState('v1');
  const [saved, setSaved] = useState(false);
  const [employee, setEmployee] = useState<any>(null);

  useEffect(() => {
    if (!employeeId) return;
    adminApiClient.get(`/portal-redthread/empleados/${employeeId}`).then((r) => setEmployee(r.data)).catch(() => {});
    const cfg = localStorage.getItem(`reth-credential-config-${employeeId}`);
    if (cfg) {
      try {
        const c = JSON.parse(cfg);
        setTemplate(c.template || 'geometrico');
        setPrimary(c.primary || '#E63946');
        setSecondary(c.secondary || '#0f1f3a');
        setAccent(c.accent || '#3B82F6');
        setFont(c.font || 'Inter');
        setTagline(c.tagline || 'RETH • Internal Access System');
      } catch {}
    }
  }, [employeeId]);

  const handleSave = () => {
    const cfg = { template, primary, secondary, accent, decorLines, font, boldName, italicRole, logoPos, tagline, showDOB, showPhone, showEmail, showSerial, qrSize, qrPos, topText, showSeal, previewVersion, updatedAt: new Date().toISOString() };
    localStorage.setItem(`reth-credential-config-${employeeId}`, JSON.stringify(cfg));
    const log = JSON.parse(localStorage.getItem('reth-credential-audit') || '[]');
    log.unshift({ by: 'admin', at: new Date().toISOString(), cfg: template, employeeId });
    localStorage.setItem('reth-credential-audit', JSON.stringify(log.slice(0, 20)));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };
  const handleExport = () => {
    const cfg = localStorage.getItem(`reth-credential-config-${employeeId}`) || '{}';
    const blob = new Blob([cfg], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reth-credential-${employeeId}-${previewVersion}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!employeeId) return <AdminLayout><Container><Typography>Cargando...</Typography></Container></AdminLayout>;

  return (
    <AdminLayout>
      <Head><title>Credencial {employeeId} | ReTh Admin</title></Head>
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Box mb={3}>
          <Typography variant="h4" fontWeight={800}>Credenciales — {employee?.first_name || employeeId}</Typography>
          <Typography variant="body2" color="text.secondary">Ruta: /portal-redthread/empleados/{employeeId} • Diseño por empleado sin tocar código.</Typography>
        </Box>

        {saved && <Alert severity="success" sx={{ mb: 2 }}>Configuración guardada para {employeeId}. Auditado.</Alert>}

        <Grid container spacing={3}>
          <Grid item xs={12} md={7}>
            <Paper sx={{ p: 2, borderRadius: 2, mb: 2 }}>
              <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto">
                <Tab label="Diseño visual" />
                <Tab label="Tipografía" />
                <Tab label="Logo y branding" />
                <Tab label="Elementos" />
                <Tab label="Versiones / Auditoría" />
              </Tabs>
            </Paper>

            {tab === 0 && (
              <Paper sx={{ p: 3, borderRadius: 2 }}>
                <Typography variant="subtitle2" fontWeight={700} gutterBottom>Plantilla</Typography>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Selector de plantillas</InputLabel>
                  <Select value={template} label="Selector de plantillas" onChange={(e) => setTemplate(e.target.value)}>
                    {TEMPLATES.map((t) => <MenuItem key={t.id} value={t.id}>{t.label} — {t.desc}</MenuItem>)}
                  </Select>
                </FormControl>
                <Grid container spacing={2}>
                  <Grid item xs={4}><TextField fullWidth label="Primario" type="color" value={primary} onChange={(e) => setPrimary(e.target.value)} /></Grid>
                  <Grid item xs={4}><TextField fullWidth label="Secundario" type="color" value={secondary} onChange={(e) => setSecondary(e.target.value)} /></Grid>
                  <Grid item xs={4}><TextField fullWidth label="Acentos" type="color" value={accent} onChange={(e) => setAccent(e.target.value)} /></Grid>
                </Grid>
                <FormControlLabel control={<Switch checked={decorLines} onChange={(e) => setDecorLines(e.target.checked)} />} label="Líneas decorativas" sx={{ mt: 2 }} />
              </Paper>
            )}

            {tab === 1 && (
              <Paper sx={{ p: 3, borderRadius: 2 }}>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Fuente aprobada</InputLabel>
                  <Select value={font} label="Fuente aprobada" onChange={(e) => setFont(e.target.value)}>
                    {FONTS.map((f) => <MenuItem key={f} value={f} sx={{ fontFamily: f }}>{f}</MenuItem>)}
                  </Select>
                </FormControl>
                <Box display="flex" gap={2} flexWrap="wrap">
                  <FormControlLabel control={<Switch checked={boldName} onChange={(e) => setBoldName(e.target.checked)} />} label="Nombre en negrita" />
                  <FormControlLabel control={<Switch checked={italicRole} onChange={(e) => setItalicRole(e.target.checked)} />} label="Rol en italic" />
                </Box>
              </Paper>
            )}

            {tab === 2 && (
              <Paper sx={{ p: 3, borderRadius: 2 }}>
                <Typography variant="subtitle2" fontWeight={700} gutterBottom>Logo y branding</Typography>
                <TextField fullWidth label="Tagline institucional" value={tagline} onChange={(e) => setTagline(e.target.value)} sx={{ mb: 2 }} />
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Posición del logo</InputLabel>
                  <Select value={logoPos} label="Posición del logo" onChange={(e) => setLogoPos(e.target.value)}>
                    <MenuItem value="superior">Superior</MenuItem>
                    <MenuItem value="inferior">Inferior</MenuItem>
                    <MenuItem value="esquina">Esquina</MenuItem>
                  </Select>
                </FormControl>
              </Paper>
            )}

            {tab === 3 && (
              <Paper sx={{ p: 3, borderRadius: 2 }}>
                <Typography variant="subtitle2" fontWeight={700} gutterBottom>Elementos de la credencial</Typography>
                <Box display="flex" flexDirection="column" gap={1}>
                  <FormControlLabel control={<Switch checked={showDOB} onChange={(e) => setShowDOB(e.target.checked)} />} label="Mostrar DOB" />
                  <FormControlLabel control={<Switch checked={showPhone} onChange={(e) => setShowPhone(e.target.checked)} />} label="Mostrar teléfono" />
                  <FormControlLabel control={<Switch checked={showEmail} onChange={(e) => setShowEmail(e.target.checked)} />} label="Mostrar email" />
                  <FormControlLabel control={<Switch checked={showSerial} onChange={(e) => setShowSerial(e.target.checked)} />} label="Mostrar número de serie" />
                  <FormControlLabel control={<Switch checked={showSeal} onChange={(e) => setShowSeal(e.target.checked)} />} label="Firma digital / sello" />
                </Box>
                <Divider sx={{ my: 2 }} />
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Tamaño QR</InputLabel>
                      <Select value={qrSize} label="Tamaño QR" onChange={(e) => setQrSize(e.target.value)}>
                        <MenuItem value="16">16mm</MenuItem>
                        <MenuItem value="20">20mm</MenuItem>
                        <MenuItem value="24">24mm</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={6}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Posición QR</InputLabel>
                      <Select value={qrPos} label="Posición QR" onChange={(e) => setQrPos(e.target.value)}>
                        <MenuItem value="inferior-derecha">Inferior derecha</MenuItem>
                        <MenuItem value="centro">Centro</MenuItem>
                        <MenuItem value="inferior-izquierda">Inferior izquierda</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
                <TextField fullWidth label="Franja texto" value={topText} onChange={(e) => setTopText(e.target.value)} sx={{ mt: 2 }} />
              </Paper>
            )}

            {tab === 4 && (
              <Paper sx={{ p: 3, borderRadius: 2 }}>
                <Typography variant="subtitle2" fontWeight={700} gutterBottom>Versionado y auditoría</Typography>
                <Box display="flex" gap={1} alignItems="center" mb={2}>
                  <TextField label="Versión" value={previewVersion} onChange={(e) => setPreviewVersion(e.target.value)} size="small" sx={{ width: 120 }} />
                  <Button variant="outlined" onClick={handleExport} startIcon={<ExportIcon />}>Exportar</Button>
                </Box>
                <Typography variant="caption" color="text.secondary">Multilenguaje y auditoría por empleado.</Typography>
              </Paper>
            )}

            <Box display="flex" gap={1} mt={2}>
              <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSave} sx={{ borderRadius: 2, bgcolor: '#E63946', '&:hover': { bgcolor: '#B71C1C' } }}>Guardar diseño</Button>
              <Button variant="outlined" onClick={handleExport} startIcon={<ExportIcon />}>Exportar</Button>
            </Box>
          </Grid>

          <Grid item xs={12} md={5}>
            <Paper sx={{ p: 2, borderRadius: 2, position: 'sticky', top: 16 }}>
              <Typography variant="subtitle2" fontWeight={700} gutterBottom>Vista previa — {employeeId}</Typography>
              <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'center', flexWrap: 'wrap', transform: 'scale(0.85)', transformOrigin: 'top center' }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                  <Chip label={`Plantilla: ${template}`} size="small" />
                  <CredentialCard firstName={employee?.first_name || 'Maria'} lastName={employee?.last_name || 'Smith'} departmentName="Demo" roleName="Designer" employeeCode={employee?.employee_id || employeeId} email={showEmail ? employee?.email : undefined} phone={showPhone ? employee?.phone : undefined} birthDate={showDOB ? employee?.birth_date : undefined} photoUrl={employee?.avatar} />
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                  <Chip label="Reverso" size="small" variant="outlined" />
                  <CredentialBack employeeCode={employee?.employee_id || employeeId} email={showEmail ? employee?.email : undefined} issueDate="01/01/2021" expiryDate="01/01/2030" serial={showSerial ? `SN-${employeeId}-MS` : ''} />
                </Box>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </AdminLayout>
  );
}
