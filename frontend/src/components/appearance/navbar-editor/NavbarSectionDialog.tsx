import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Switch,
  Typography,
  Tabs,
  Tab,
  Box,
  Grid,
  IconButton,
  InputAdornment,
} from '@mui/material';
import { Save, Cancel } from '@mui/icons-material';
import {
  NavSection,
  NavSectionFormData,
  Language,
  LANGUAGES,
  ICON_OPTIONS,
  initialNavFormData,
  MAX_INPUT_LENGTH,
  MAX_TRANSLATION_LENGTH,
} from './types';

interface NavbarSectionDialogProps {
  open: boolean;
  instanceKey: number;
  section: NavSection | null;
  onClose: () => void;
  onSave: (formData: NavSectionFormData) => Promise<void>;
  saving: boolean;
}

function NavbarSectionForm({
  section,
  onClose,
  onSave,
  saving,
}: {
  section: NavSection | null;
  onClose: () => void;
  onSave: (formData: NavSectionFormData) => Promise<void>;
  saving: boolean;
}) {
  const [formData, setFormData] = useState<NavSectionFormData>(() =>
    section
      ? {
          key: section.key,
          route: section.route,
          icon: section.icon,
          visible: section.visible,
          locked: section.locked,
          translations: { ...section.translations },
        }
      : initialNavFormData()
  );
  const [langTab, setLangTab] = useState(0);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});

  const activeLang = LANGUAGES[langTab] as Language;

  const validate = (): Record<string, string | undefined> => {
    const e: Record<string, string | undefined> = {};
    if (!formData.key.trim()) e.key = 'La clave es obligatoria';
    else if (formData.key.length > MAX_INPUT_LENGTH) e.key = `Máximo ${MAX_INPUT_LENGTH} caracteres`;
    if (!formData.route.trim()) e.route = 'La ruta es obligatoria';
    else if (formData.route.length > MAX_INPUT_LENGTH) e.route = `Máximo ${MAX_INPUT_LENGTH} caracteres`;
    const hasAnyTranslation = LANGUAGES.some((lang) => (formData.translations[lang] || '').trim());
    if (!hasAnyTranslation) {
      e.translations = 'Agrega al menos una traducción (los idiomas vacíos usan fallback en inglés)';
    }
    LANGUAGES.forEach((lang) => {
      const value = formData.translations[lang] || '';
      if (value.length > MAX_TRANSLATION_LENGTH) e[`lang_${lang}`] = `Máximo ${MAX_TRANSLATION_LENGTH} caracteres`;
    });
    return e;
  };

  const handleSave = async () => {
    const e = validate();
    setErrors(e);
    const hasLangError = LANGUAGES.some((lang) => e[`lang_${lang}`]);
    if (e.key || e.route || e.translations || hasLangError) {
      if (hasLangError) {
        const firstLongLang = LANGUAGES.findIndex((lang) => e[`lang_${lang}`]);
        if (firstLongLang >= 0) setLangTab(firstLongLang);
      }
      return;
    }
    await onSave(formData);
  };

  const setField = (field: keyof NavSectionFormData, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const setTranslation = (lang: Language, value: string) => {
    setFormData((prev) => ({ ...prev, translations: { ...prev.translations, [lang]: value } }));
    if (errors[`lang_${lang}`]) setErrors((prev) => ({ ...prev, [`lang_${lang}`]: undefined }));
  };

  const langError = (lang: Language) => errors[`lang_${lang}`];

  return (
    <>
      <DialogContent sx={{ py: 2 }}>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Clave única (key)"
              value={formData.key}
              onChange={(e) => setField('key', e.target.value)}
              helperText={errors.key || 'Identificador único: home, plans, events, etc.'}
              error={!!errors.key}
              inputProps={{ maxLength: MAX_INPUT_LENGTH }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Ruta (href)"
              value={formData.route}
              onChange={(e) => setField('route', e.target.value)}
              helperText={errors.route || 'Ruta relativa o anchor: /, #planes, /auth/register'}
              error={!!errors.route}
              inputProps={{ maxLength: MAX_INPUT_LENGTH }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              select
              label="Icono"
              value={formData.icon}
              onChange={(e) => setField('icon', e.target.value)}
              SelectProps={{ native: true }}
            >
              {ICON_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, height: '100%' }}>
              <Switch checked={formData.visible} onChange={(e) => setField('visible', e.target.checked)} color="primary" />
              <Typography>Visible en navbar</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, height: '100%' }}>
              <Switch checked={formData.locked} onChange={(e) => setField('locked', e.target.checked)} color="warning" />
              <Typography>Sección fija (no se puede eliminar ni ocultar)</Typography>
            </Box>
          </Grid>
        </Grid>

        <Typography variant="subtitle2" gutterBottom>Traducciones por idioma</Typography>
        <Typography variant="caption" color="text.secondary" display="block" mb={1}>
          Cada pestaña es un idioma. Puedes guardar con traducciones parciales: los idiomas vacíos usan fallback en inglés. Máx. {MAX_TRANSLATION_LENGTH} caracteres.
        </Typography>
        {errors.translations && (
          <Typography variant="caption" color="error" display="block" mb={1}>
            {errors.translations}
          </Typography>
        )}
        <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1 }}>
          <Tabs
            value={langTab}
            onChange={(_, v) => setLangTab(v)}
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
            sx={{ borderBottom: 1, borderColor: 'divider', minHeight: 40, '& .MuiTab-root': { minHeight: 40, textTransform: 'none' } }}
          >
            {LANGUAGES.map((lang) => {
              const filled = !!(formData.translations[lang] || '').trim();
              return (
                <Tab
                  key={lang}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          bgcolor: filled ? 'success.main' : 'error.main',
                        }}
                      />
                      {lang.toUpperCase()}
                    </Box>
                  }
                />
              );
            })}
          </Tabs>
          <Box sx={{ p: 2 }}>
            <TextField
              key={activeLang}
              fullWidth
              autoFocus
              label={`Traducción en ${activeLang.toUpperCase()}`}
              value={formData.translations[activeLang] || ''}
              onChange={(e) => setTranslation(activeLang, e.target.value)}
              error={!!langError(activeLang)}
              helperText={langError(activeLang) || `Texto mostrado en el navbar para el idioma ${activeLang.toUpperCase()}`}
              inputProps={{ maxLength: MAX_TRANSLATION_LENGTH }}
              InputProps={{
                endAdornment: (formData.translations[activeLang] || '') ? (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setTranslation(activeLang, '')}><Cancel fontSize="small" /></IconButton>
                  </InputAdornment>
                ) : null,
              }}
            />
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 2, pb: 2 }}>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" startIcon={<Save />} onClick={handleSave} disabled={saving}>
          {saving ? 'Guardando…' : 'Guardar'}
        </Button>
      </DialogActions>
    </>
  );
}

export default function NavbarSectionDialog({ open, instanceKey, section, onClose, onSave, saving }: NavbarSectionDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{section ? `Editar "${section.key}"` : 'Nueva Sección'}</DialogTitle>
      <NavbarSectionForm key={instanceKey} section={section} onClose={onClose} onSave={onSave} saving={saving} />
    </Dialog>
  );
}