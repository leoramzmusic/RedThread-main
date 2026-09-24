import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Tabs,
  Tab,
  Box,
} from '@mui/material';
import { Save } from '@mui/icons-material';
import { LANGUAGES, type Language } from '../navbar-editor/types';
import {
  SECTION_CONTENT_TYPES,
  SECTION_MAX_TITLE_LENGTH,
  getSectionTitle,
  type LandingSection,
  type SectionContentType,
} from './types';

export interface SectionFormData {
  translations: Record<string, string>;
  contentType: SectionContentType;
}

interface SectionDialogProps {
  open: boolean;
  saving?: boolean;
  initial?: LandingSection | null;
  instanceKey?: number;
  onClose: () => void;
  onSave: (data: SectionFormData) => void;
}

function SectionForm({
  initial,
  onClose,
  onSave,
  saving,
}: {
  initial: LandingSection | null;
  onClose: () => void;
  onSave: (data: SectionFormData) => void;
  saving: boolean;
}) {
  const [translations, setTranslations] = useState<Record<string, string>>(() => ({
    ...(initial?.translations ?? {}),
  }));
  const [contentType, setContentType] = useState<SectionContentType>(initial?.contentType ?? 'text');
  const [langTab, setLangTab] = useState(0);
  const [error, setError] = useState<string | undefined>();

  const activeLang = LANGUAGES[langTab] as Language;

  const handleSave = () => {
    const cleaned: Record<string, string> = {};
    Object.entries(translations).forEach(([lang, value]) => {
      if (value.trim()) cleaned[lang] = value.trim();
    });
    if (Object.keys(cleaned).length === 0) {
      setError('Agrega al menos un título (los idiomas vacíos usan fallback en inglés)');
      return;
    }
    onSave({ translations: cleaned, contentType });
  };

  const setTranslation = (lang: Language, value: string) => {
    setTranslations((prev) => ({ ...prev, [lang]: value }));
    if (error) setError(undefined);
  };

  return (
    <>
      <DialogContent sx={{ py: 2 }}>
        <TextField
          select
          fullWidth
          label="Tipo de contenido"
          value={contentType}
          onChange={(e) => setContentType(e.target.value as SectionContentType)}
          SelectProps={{ native: true }}
          sx={{ mb: 3 }}
        >
          {SECTION_CONTENT_TYPES.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </TextField>

        <Typography variant="subtitle2" gutterBottom>
          Títulos por idioma
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block" mb={1}>
          Cada pestaña es un idioma. Puedes guardar títulos parciales: los idiomas vacíos usan
          fallback en inglés. Máx. {SECTION_MAX_TITLE_LENGTH} caracteres.
        </Typography>
        {error && (
          <Typography variant="caption" color="error" display="block" mb={1}>
            {error}
          </Typography>
        )}
        <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1 }}>
          <Tabs
            value={langTab}
            onChange={(_, v) => setLangTab(v)}
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
            sx={{
              borderBottom: 1,
              borderColor: 'divider',
              minHeight: 40,
              '& .MuiTab-root': { minHeight: 40, textTransform: 'none' },
            }}
          >
            {LANGUAGES.map((lang) => {
              const filled = !!(translations[lang] || '').trim();
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
              label={`Título en ${activeLang.toUpperCase()}`}
              value={translations[activeLang] || ''}
              onChange={(e) => setTranslation(activeLang, e.target.value)}
              inputProps={{ maxLength: SECTION_MAX_TITLE_LENGTH }}
              helperText={`Texto de la sección para el idioma ${activeLang.toUpperCase()}`}
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

export default function SectionDialog({
  open,
  saving = false,
  initial = null,
  instanceKey = 0,
  onClose,
  onSave,
}: SectionDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{initial ? `Editar "${getSectionTitle(initial, 'en')}"` : 'Nueva Sección'}</DialogTitle>
      <SectionForm key={instanceKey} initial={initial} onClose={onClose} onSave={onSave} saving={saving} />
    </Dialog>
  );
}
