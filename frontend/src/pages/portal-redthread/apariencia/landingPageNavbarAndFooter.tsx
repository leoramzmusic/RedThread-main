import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  IconButton,
  TextField,
  Divider,
  Grid,
  Snackbar,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Switch,
  Chip,
  Tabs,
  Tab,
  Collapse,
  MenuItem,
} from '@mui/material';
import {
  Add,
  Save,
  Cancel,
  Language,
  Description,
  ExpandMore,
  TableView,
} from '@mui/icons-material';
import { useRouter } from 'next/router';
import AdminLayout from '../../../components/layout/AdminLayout';
import { supportedLanguages } from '../../../config/languages';
import appearanceService from '../../../services/appearanceService';
import { AppearanceType, AppearanceResource, Platform } from '../../../types/appearance';
import NavbarSectionList from '../../../components/appearance/navbar-editor/NavbarSectionList';
import NavbarSectionDialog from '../../../components/appearance/navbar-editor/NavbarSectionDialog';
import NavbarResponsivePreview from '../../../components/appearance/navbar-editor/NavbarResponsivePreview';
import NavbarStyleSelector from '../../../components/appearance/navbar-editor/NavbarStyleSelector';
import NavbarHistory from '../../../components/appearance/navbar-editor/NavbarHistory';
import { computeSectionChanges } from '../../../components/appearance/navbar-editor/changeSet';
import { getDefaultStyleSpec, mergeStyleSpec, NAVBAR_STYLE_ID_DEFAULT } from '../../../components/appearance/navbar-editor/styles';
import type { NavbarStyleSpec, NavbarStyleId } from '../../../components/appearance/navbar-editor/styles';
import type { AppearanceHistory } from '../../../types/appearance';
import {
  NavSection,
  NavSectionFormData,
  LANGUAGES,
  DEFAULT_SECTIONS,
  getTranslationFallback,
} from '../../../components/appearance/navbar-editor/types';
type Language = (typeof supportedLanguages)[number]['code'];

interface FooterFormData {
  footerTagline: string;
  footerText: string;
}

const DEFAULT_FOOTER: FooterFormData = {
  footerTagline: 'Conexiones significativas inspiradas en la leyenda del hilo rojo.',
  footerText: '\u00A9 2026 RETH. Hecho con \u2764\uFE0F para conexiones significativas.',
};

function sortByOrder(a: NavSection, b: NavSection) { return a.order - b.order; }

function mapResourceToSection(r: AppearanceResource): NavSection {
  const meta = r.metadata || {};
  return {
    id: r._id || '',
    key: meta.key || '',
    route: meta.route || '',
    icon: meta.icon || 'Menu',
    visible: meta.visible ?? true,
    locked: meta.locked ?? false,
    order: meta.order ?? 0,
    translations: meta.translations || LANGUAGES.reduce((acc, lang) => ({ ...acc, [lang]: '' }), {} as Record<Language, string>),
  };
}

function mapSectionToResource(s: NavSection): AppearanceResource {
  return {
    _id: s.id || undefined,
    type: AppearanceType.LANDING_NAVBAR,
    platform: Platform.WEB,
    url: '',
    metadata: {
      key: s.key,
      route: s.route,
      icon: s.icon,
      visible: s.visible,
      locked: s.locked,
      order: s.order,
      translations: s.translations,
    },
    is_active: true,
  };
}

const initialFooterFormData = (): FooterFormData => ({ ...DEFAULT_FOOTER });

export default function LandingPageNavbarAndFooterAdminPage() {
  const router = useRouter();
  const [sections, setSections] = useState<NavSection[]>([]);
  const [footerData, setFooterData] = useState<Record<Language, FooterFormData>>(
    LANGUAGES.reduce((acc, lang) => ({ ...acc, [lang]: { ...DEFAULT_FOOTER } }), {} as Record<Language, FooterFormData>)
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' | 'info' | 'warning' });
  const [navDialogOpen, setNavDialogOpen] = useState(false);
  const [navDialogKey, setNavDialogKey] = useState(0);
  const [editingSection, setEditingSection] = useState<NavSection | null>(null);
  const [showDebugTable, setShowDebugTable] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [currentLang, setCurrentLang] = useState<Language>('es');
  const [footerFormData, setFooterFormData] = useState<FooterFormData>({ ...DEFAULT_FOOTER });
  const [styleDraft, setStyleDraft] = useState<NavbarStyleSpec>(() => getDefaultStyleSpec(NAVBAR_STYLE_ID_DEFAULT));
  const [styleSaved, setStyleSaved] = useState<NavbarStyleSpec>(() => getDefaultStyleSpec(NAVBAR_STYLE_ID_DEFAULT));
  const [sectionsSnapshot, setSectionsSnapshot] = useState<NavSection[]>([]);
  const [showCompare, setShowCompare] = useState(false);
  const [history, setHistory] = useState<AppearanceHistory[]>([]);
  const [activeSubTab, setActiveSubTab] = useState(0);
  const [dirtyCount, setDirtyCount] = useState(0);

  const fetchSections = useCallback(async () => {
    setLoading(true);
    try {
      const resources = await appearanceService.getResources(AppearanceType.LANDING_NAVBAR);
      const mapped = resources.map(mapResourceToSection).sort(sortByOrder);
      if (mapped.length === 0) {
        const defaults = DEFAULT_SECTIONS.map((s, i) => ({ ...s, id: `default-${i}`, order: i }));
        setSectionsSnapshot(defaults);
        setSections(defaults);
      } else {
        setSectionsSnapshot(mapped);
        setSections(mapped);
      }
    } catch (e: any) {
      console.error('Error fetching navbar sections:', e);
      const defaults = DEFAULT_SECTIONS.map((s, i) => ({ ...s, id: `default-${i}`, order: i }));
      setSectionsSnapshot(defaults);
      setSections(defaults);
      if (e?.response?.status !== 422) {
        setSnackbar({ open: true, message: 'Error al cargar secciones del navbar', severity: 'error' });
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStyle = useCallback(async () => {
    try {
      const resources = await appearanceService.getResources(AppearanceType.LANDING_NAVBAR_STYLE);
      const active = resources.find((r) => r.is_active);
      if (active?.metadata?.id) {
        const base = getDefaultStyleSpec(active.metadata.id);
        const spec = mergeStyleSpec(base, {
          accent: active.metadata.accent,
          fontWeight: active.metadata.fontWeight,
          hoverAnimation: active.metadata.hoverAnimation,
        });
        setStyleDraft(spec);
        setStyleSaved(spec);
      }
    } catch (e: any) {
      console.error('Error fetching navbar style:', e);
    }
  }, []);

  const fetchFooter = useCallback(async () => {
    try {
      const resources = await appearanceService.getResources(AppearanceType.LANDING_THEME);
      const activeTheme = resources.find(r => r.is_active);
      if (activeTheme?.metadata?.translations) {
        const merged: Record<Language, FooterFormData> = {} as Record<Language, FooterFormData>;
        for (const lang of LANGUAGES) {
          const t = activeTheme.metadata.translations[lang];
          if (t) {
            merged[lang] = {
              footerTagline: t.footerTagline || DEFAULT_FOOTER.footerTagline,
              footerText: t.footerText || DEFAULT_FOOTER.footerText,
            };
          } else {
            merged[lang] = { ...DEFAULT_FOOTER };
          }
        }
        setFooterData(merged);
        setFooterFormData(merged[currentLang] || DEFAULT_FOOTER);
      }
    } catch (e: any) {
      console.error('Error fetching footer data:', e);
    }
  }, [currentLang]);

  useEffect(() => { fetchSections(); }, [fetchSections]);
  useEffect(() => { fetchFooter(); }, [fetchFooter, currentLang]);
  useEffect(() => { fetchStyle(); }, [fetchStyle]);

  useEffect(() => {
    if (activeTab === 0 && activeSubTab === 2) {
      appearanceService.getHistory().then((h) => setHistory(h)).catch(() => {});
    }
  }, [activeTab, activeSubTab]);

  const handleSnackbarClose = () => setSnackbar({ ...snackbar, open: false });

  const openNavDialog = (section?: NavSection) => {
    setEditingSection(section || null);
    setNavDialogKey(k => k + 1);
    setNavDialogOpen(true);
  };

  const closeNavDialog = () => {
    setNavDialogOpen(false);
    setEditingSection(null);
  };

  const handleFooterChange = (field: keyof FooterFormData, value: string) => {
    setFooterFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleLangChange = (lang: Language) => {
    setCurrentLang(lang);
    setFooterFormData(footerData[lang] || DEFAULT_FOOTER);
  };

  const markDirty = () => setDirtyCount((n) => n + 1);

  const toggleLock = (section: NavSection) => {
    setSections((prev) => prev.map((s) => (s.id === section.id ? { ...s, locked: !s.locked } : s)));
  };

  const saveNavSection = async (formData: NavSectionFormData) => {
    if (editingSection) {
      setSections((prev) => prev.map((s) => (s.id === editingSection.id ? { ...s, ...formData } : s)));
    } else {
      setSections((prev) => [...prev, { id: '', ...formData, order: prev.length }]);
    }
    markDirty();
    setNavDialogOpen(false);
    setEditingSection(null);
  };

  const saveFooter = async () => {
    setSaving(true);
    try {
      const resources = await appearanceService.getResources(AppearanceType.LANDING_THEME);
      const activeTheme = resources.find(r => r.is_active);
      if (!activeTheme?._id) throw new Error('No hay tema activo');
      if (!activeTheme.metadata) throw new Error('Tema sin metadata');

      const updatedTranslations = { ...(activeTheme.metadata.translations || {}) };
      for (const lang of LANGUAGES) {
        if (!updatedTranslations[lang]) updatedTranslations[lang] = {} as any;
        updatedTranslations[lang].footerTagline = footerData[lang]?.footerTagline || DEFAULT_FOOTER.footerTagline;
        updatedTranslations[lang].footerText = footerData[lang]?.footerText || DEFAULT_FOOTER.footerText;
      }

      await appearanceService.updateResource(activeTheme._id, { metadata: { ...activeTheme.metadata, translations: updatedTranslations } });
      setSnackbar({ open: true, message: 'Footer guardado', severity: 'success' });
    } catch (e: any) {
      console.error('Error saving footer:', e);
      setSnackbar({ open: true, message: `Error al guardar footer: ${e?.response?.data?.detail || e.message}`, severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleFooterLangChange = (lang: Language, field: keyof FooterFormData, value: string) => {
    setFooterData(prev => ({ ...prev, [lang]: { ...prev[lang], [field]: value } }));
    if (lang === currentLang) setFooterFormData(prev => ({ ...prev, [field]: value }));
  };

  const deleteSection = (id: string) => {
    if (window.confirm('¿Eliminar esta sección del navbar?')) {
      setSections((prev) => prev.filter((s) => s.id !== id));
      markDirty();
    }
  };

  const toggleVisibility = (section: NavSection) => {
    if (section.locked) return;
    setSections((prev) => prev.map((s) => (s.id === section.id ? { ...s, visible: !s.visible } : s)));
    markDirty();
  };

  const handleReorder = (newSections: NavSection[]) => {
    setSections(newSections);
    markDirty();
  };

  const saveAll = async () => {
    setSaving(true);
    try {
      const changes = computeSectionChanges(sections, sectionsSnapshot);
      const ops: Promise<void>[] = [];

      for (const s of changes.toCreate) {
        const { id, ...rest } = s;
        ops.push(appearanceService.createResource(mapSectionToResource({ ...rest, id: '' })).then(() => undefined));
      }
      for (const s of changes.toUpdate) {
        ops.push(appearanceService.updateResource(s.id, mapSectionToResource(s)).then(() => undefined));
      }
      for (const id of changes.toDelete) {
        ops.push(appearanceService.deleteResource(id));
      }

      const styleChanged = JSON.stringify(styleDraft) !== JSON.stringify(styleSaved);
      if (styleChanged) {
        const existing = await appearanceService.getResources(AppearanceType.LANDING_NAVBAR_STYLE);
        const active = existing.find((r) => r.is_active);
        const styleMetadata = { id: styleDraft.id, accent: styleDraft.accent, fontWeight: styleDraft.fontWeight, hoverAnimation: styleDraft.hoverAnimation };
        if (active?._id) {
          ops.push(appearanceService.updateResource(active._id, { metadata: { ...styleMetadata } }).then(() => undefined));
        } else {
          ops.push(
            appearanceService.createResource({
              type: AppearanceType.LANDING_NAVBAR_STYLE,
              platform: Platform.WEB,
              url: '',
              metadata: styleMetadata,
              is_active: true,
            }).then(() => undefined)
          );
        }
      }

      await Promise.all(ops);
      setStyleSaved(styleDraft);
      setDirtyCount(0);
      setSectionsSnapshot(sections);
      setSnackbar({ open: true, message: 'Cambios guardados', severity: 'success' });
      if (styleChanged) fetchStyle();
    } catch (e: any) {
      console.error('Error saving all:', e);
      setSnackbar({ open: true, message: `Error al guardar: ${e?.response?.data?.detail || e.message}`, severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <Container maxWidth="xl">
          <Box sx={{ py: 8, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary">Cargando…</Typography>
          </Box>
        </Container>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleSnackbarClose} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} variant="filled">{snackbar.message}</Alert>
      </Snackbar>

      <Container maxWidth="xl">
        <Box sx={{ py: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <Typography variant="h4" fontWeight={700} gutterBottom>Landing Page — Navbar y Footer</Typography>
              <Typography variant="body1" color="text.secondary">Administra las secciones del navbar y el contenido del footer del landing.</Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button variant="contained" startIcon={<Add />} onClick={() => openNavDialog()} size="large">
                Agregar Sección Navbar
              </Button>
              <Button variant="contained" startIcon={<Save />} onClick={saveFooter} disabled={saving} size="large">
                {saving ? 'Guardando…' : 'Guardar Footer'}
              </Button>
            </Box>
          </Box>

          {/* Tabs principales: Navbar / Footer */}
          <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ mb: 3 }} variant="scrollable" scrollButtons="auto">
            <Tab label="Navbar" icon={<Language />} />
            <Tab label="Footer" icon={<Description />} />
          </Tabs>

          {/* ===== NAVBAR TAB ===== */}
          {activeTab === 0 && (
            <>
              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" fontWeight="bold" display="block" mb={1}>Idioma de edición</Typography>
                <TextField
                  select
                  fullWidth
                  size="small"
                  value={currentLang}
                  onChange={(e) => setCurrentLang(e.target.value as Language)}
                  label="Seleccionar idioma"
                  sx={{ minWidth: 220, maxWidth: 300 }}
                >
                  {LANGUAGES.map((l) => <MenuItem key={l} value={l}>{l.toUpperCase()}</MenuItem>)}
                </TextField>
              </Box>

              <NavbarResponsivePreview
                sections={sections}
                currentLang={currentLang}
                draft={styleDraft}
                saved={styleSaved}
                showCompare={showCompare}
              />

              <Tabs value={activeSubTab} onChange={(_, v) => setActiveSubTab(v)} sx={{ my: 2 }} variant="scrollable" scrollButtons="auto">
                <Tab label="Menús" />
                <Tab label="Estilo" />
                <Tab label="Historial" />
              </Tabs>

              {activeSubTab === 0 && (
                <Grid container spacing={3}>
                  <Grid item xs={12} lg={7}>
                    <Paper sx={{ p: 2 }}>
                      <NavbarSectionList
                        sections={sections}
                        currentLang={currentLang}
                        onEdit={openNavDialog}
                        onDelete={deleteSection}
                        onToggle={toggleVisibility}
                        onToggleLock={toggleLock}
                        onReorder={handleReorder}
                      />
                    </Paper>

                    <Box sx={{ mt: 2 }}>
                      <Button
                        size="small"
                        startIcon={<TableView />}
                        endIcon={<ExpandMore sx={{ transform: showDebugTable ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }} />}
                        onClick={() => setShowDebugTable(prev => !prev)}
                      >
                        Modo depuración
                      </Button>
                      <Collapse in={showDebugTable}>
                        <Paper sx={{ p: 2, mt: 1 }}>
                          <Typography variant="h6" gutterBottom mb={2}>Editor de Traducciones Navbar (depuración)</Typography>
                          <Typography variant="body2" color="text.secondary" paragraph>
                            Cada fila es una sección; cada columna un idioma. Si falta traducción, se usa fallback (ES → EN → primera disponible).
                          </Typography>
                          <TableContainer sx={{ maxHeight: 500, overflow: 'auto' }}>
                            <Table size="small">
                              <TableHead>
                                <TableRow>
                                  <TableCell sx={{ width: 60 }}>Icono</TableCell>
                                  <TableCell sx={{ width: 140 }}>Clave / Ruta</TableCell>
                                  {LANGUAGES.map(lang => (
                                    <TableCell key={lang} align="center" sx={{ minWidth: 140 }}>
                                      <Chip label={lang.toUpperCase()} size="small" variant="outlined" />
                                    </TableCell>
                                  ))}
                                  <TableCell align="center" sx={{ width: 80 }}>Visibilidad</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {sections.map((section, rowIndex) => (
                                  <TableRow key={section.id} hover>
                                    <TableCell>
                                      <Chip label={section.icon} size="small" variant="outlined" />
                                    </TableCell>
                                    <TableCell>
                                      <Typography variant="caption" display="block" color="text.secondary">{section.key}</Typography>
                                      <Typography variant="caption" fontFamily="monospace">{section.route}</Typography>
                                    </TableCell>
                                    {LANGUAGES.map(lang => (
                                      <TableCell key={lang} align="center">
                                        <TextField
                                          size="small"
                                          value={getTranslationFallback(section.translations, lang)}
                                          onChange={e => {
                                            const newSections = [...sections];
                                            newSections[rowIndex] = { ...newSections[rowIndex], translations: { ...newSections[rowIndex].translations, [lang]: e.target.value } };
                                            setSections(newSections);
                                          }}
                                          inputProps={{ style: { textAlign: 'center' } }}
                                          sx={{ width: '100%' }}
                                          placeholder={section.translations[lang] ? '' : `(${getTranslationFallback(section.translations, lang) || 'vacío'})`}
                                          InputProps={{
                                            endAdornment: section.translations[lang] ? (
                                              <IconButton size="small" onClick={() => {
                                                const newSections = [...sections];
                                                newSections[rowIndex] = { ...newSections[rowIndex], translations: { ...newSections[rowIndex].translations, [lang]: '' } };
                                                setSections(newSections);
                                              }}><Cancel fontSize="small" /></IconButton>
                                            ) : null
                                          }}
                                        />
                                      </TableCell>
                                    ))}
                                    <TableCell align="center">
                                      <Switch
                                        checked={section.visible}
                                        onChange={() => toggleVisibility(section)}
                                        disabled={section.locked}
                                        size="small"
                                        color="primary"
                                      />
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        </Paper>
                      </Collapse>
                    </Box>
                  </Grid>
                  <Grid item xs={12} lg={5}>
                    <Paper sx={{ p: 2 }}>
                      <Button variant="contained" startIcon={<Add />} onClick={() => openNavDialog()} size="medium" fullWidth sx={{ mb: 1 }}>
                        Agregar Sección Navbar
                      </Button>
                      {dirtyCount > 0 && (
                        <Button variant="contained" color="success" fullWidth onClick={saveAll} disabled={saving}>
                          {saving ? 'Guardando…' : `Guardar (${dirtyCount})`}
                        </Button>
                      )}
                    </Paper>
                  </Grid>
                </Grid>
              )}

              {activeSubTab === 1 && (
                <Paper sx={{ p: 2 }}>
                  <NavbarStyleSelector
                    draft={styleDraft}
                    saved={styleSaved}
                    onSelectStyle={(id) => { setStyleDraft(getDefaultStyleSpec(id)); setShowCompare(true); markDirty(); }}
                    onChangeAdvanced={(patch) => { setStyleDraft((prev) => mergeStyleSpec(prev, patch)); markDirty(); }}
                    onApply={() => { setStyleSaved(styleDraft); setShowCompare(false); }}
                    onToggleCompare={() => setShowCompare((v) => !v)}
                    showCompare={showCompare}
                  />
                </Paper>
              )}

              {activeSubTab === 2 && (
                <Paper sx={{ p: 2 }}>
                  <NavbarHistory history={history} onClear={async () => { await appearanceService.clearHistory(); setHistory([]); }} />
                </Paper>
              )}
            </>
          )}

          {/* ===== FOOTER TAB ===== */}
          {activeTab === 1 && (
            <Paper sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                <Typography variant="h6" gutterBottom>Pie de Página (Footer) [{currentLang.toUpperCase()}]</Typography>
                <TextField
                  select
                  fullWidth
                  size="small"
                  value={currentLang}
                  onChange={(e) => handleLangChange(e.target.value as Language)}
                  label="Idioma"
                  sx={{ minWidth: 180 }}
                >
                  {LANGUAGES.map(l => <MenuItem key={l} value={l}>{l.toUpperCase()}</MenuItem>)}
                </TextField>
              </Box>

              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    label="Tagline (columna RETH del footer)"
                    helperText="Texto bajo el logo en el footer del landing. Se usa si no se envía desde el CMS."
                    value={footerFormData.footerTagline}
                    onChange={e => handleFooterChange('footerTagline', e.target.value)}
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Texto Copyright"
                    value={footerFormData.footerText}
                    onChange={e => handleFooterChange('footerText', e.target.value)}
                    margin="normal"
                  />
                </Grid>
              </Grid>

              <Divider sx={{ my: 3 }} />

              <Typography variant="subtitle2" gutterBottom mb={2}>Editor de Traducciones Footer (Todos los idiomas)</Typography>
              <TableContainer sx={{ maxHeight: 400, overflow: 'auto' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ width: 180 }}>Campo</TableCell>
                      {LANGUAGES.map(lang => (
                        <TableCell key={lang} align="center" sx={{ minWidth: 180 }}>
                          <Chip label={lang.toUpperCase()} size="small" variant="outlined" />
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow hover>
                      <TableCell><strong>Tagline</strong></TableCell>
                      {LANGUAGES.map(lang => (
                        <TableCell key={lang} align="center">
                          <TextField
                            size="small"
                            value={footerData[lang]?.footerTagline || ''}
                            onChange={e => handleFooterLangChange(lang, 'footerTagline', e.target.value)}
                            inputProps={{ style: { textAlign: 'center' } }}
                            sx={{ width: '100%' }}
                            placeholder={footerData[lang]?.footerTagline ? '' : '(vacío)'}
                          />
                        </TableCell>
                      ))}
                    </TableRow>
                    <TableRow hover>
                      <TableCell><strong>Copyright</strong></TableCell>
                      {LANGUAGES.map(lang => (
                        <TableCell key={lang} align="center">
                          <TextField
                            size="small"
                            value={footerData[lang]?.footerText || ''}
                            onChange={e => handleFooterLangChange(lang, 'footerText', e.target.value)}
                            inputProps={{ style: { textAlign: 'center' } }}
                            sx={{ width: '100%' }}
                            placeholder={footerData[lang]?.footerText ? '' : '(vacío)'}
                          />
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          )}
        </Box>
      </Container>

      {/* Nav Section Dialog */}
      <NavbarSectionDialog
        open={navDialogOpen}
        instanceKey={navDialogKey}
        section={editingSection}
        onClose={closeNavDialog}
        onSave={saveNavSection}
        saving={saving}
      />
    </AdminLayout>
  );
}