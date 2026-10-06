import React, { useState } from 'react';
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Box,
    Button,
    Divider,
    FormControl,
    FormControlLabel,
    Grid,
    IconButton,
    InputLabel,
    MenuItem,
    Select,
    Switch,
    Tab,
    Tabs,
    TextField,
    Typography,
} from '@mui/material';
import {
    Add as AddIcon,
    Delete as DeleteIcon,
    ExpandMore as ExpandMoreIcon,
    ArrowUpward as UpIcon,
    ArrowDownward as DownIcon,
} from '@mui/icons-material';
import { tipsApi, type AdminTip, type AdminTipSlide, type AdminTipTranslation } from '../../services/adminApi';
import { getMediaUrl } from '../../utils/media';

export const ALL_TIP_LANGS = [
    'es', 'en', 'fr', 'de', 'it', 'pt', 'nl', 'sv', 'ru', 'zh',
    'ja', 'ko', 'hi', 'bn', 'ar', 'sw', 'ha', 'tl', 'ms', 'mi', 'am',
];
const MAIN_LANGS = ['es', 'en'];
const EXTRA_LANGS = ALL_TIP_LANGS.filter((l) => !MAIN_LANGS.includes(l));

const MAX_SLIDES = 6;

const SLIDE_TR_FIELDS: Array<{ key: 'title' | 'description' | 'ok_label' | 'ko_label'; label: string }> = [
    { key: 'title', label: 'Título' },
    { key: 'description', label: 'Descripción' },
    { key: 'ok_label', label: 'Etiqueta OK' },
    { key: 'ko_label', label: 'Etiqueta KO' },
];

const setSlideTr = (
    slides: AdminTipSlide[] | undefined,
    index: number,
    lang: string,
    field: 'title' | 'description' | 'ok_label' | 'ko_label',
    text: string,
): AdminTipSlide[] => {
    const next = [...(slides ?? [])];
    const translations = { ...(next[index]?.translations ?? {}) };
    translations[lang] = { ...EMPTY_TR, ...(translations[lang] ?? {}), [field]: text };
    next[index] = { ...next[index], translations };
    return next.map((s, i) => ({ ...s, order: i }));
};

const EMPTY_TR: AdminTipTranslation = {
    title: '',
    description: '',
    trigger_button_text: '',
    ok_label: '',
    ko_label: '',
};
const TR_FIELDS: Array<{ key: keyof AdminTipTranslation; label: string; multiline?: boolean }> = [
    { key: 'title', label: 'Título' },
    { key: 'description', label: 'Descripción', multiline: true },
    { key: 'trigger_button_text', label: 'Texto del botón' },
    { key: 'ok_label', label: 'Etiqueta OK' },
    { key: 'ko_label', label: 'Etiqueta KO' },
];

interface TipFormProps {
    value: Partial<AdminTip>;
    onChange: (next: Partial<AdminTip>) => void;
    persistedTipKey: string | null;
    readOnly?: boolean;
    onSnack: (msg: string, severity: 'success' | 'error') => void;
}

export default function TipForm({ value, onChange, persistedTipKey, readOnly, onSnack }: TipFormProps) {
    const [tab, setTab] = useState(0);
    const [uploading, setUploading] = useState<string | null>(null);

    const set = (patch: Partial<AdminTip>) => onChange({ ...value, ...patch });

    const setTr = (lang: string, field: keyof AdminTipTranslation, text: string) => {
        const translations = { ...(value.translations ?? {}) };
        translations[lang] = { ...(translations[lang] ?? { ...EMPTY_TR }), [field]: text };
        set({ translations });
    };

    const setSlide = (index: number, patch: Partial<AdminTipSlide>) => {
        const slides = [...(value.slides ?? [])];
        slides[index] = { ...slides[index], ...patch };
        set({ slides: slides.map((s, i) => ({ ...s, order: i })) });
    };

    const addSlide = () => {
        const slides = value.slides ?? [];
        if (slides.length >= MAX_SLIDES) {
            onSnack(`Máximo ${MAX_SLIDES} slides por tip`, 'error');
            return;
        }
        set({ slides: [...slides, { order: slides.length, translations: { es: { ...EMPTY_TR } }, ok_image_url: '', ko_image_url: '' }] });
    };

    const removeSlide = (index: number) => {
        set({ slides: (value.slides ?? []).filter((_, i) => i !== index).map((s, i) => ({ ...s, order: i })) });
    };

    const moveSlide = (index: number, dir: -1 | 1) => {
        const slides = [...(value.slides ?? [])];
        const j = index + dir;
        if (j < 0 || j >= slides.length) return;
        [slides[index], slides[j]] = [slides[j], slides[index]];
        set({ slides: slides.map((s, i) => ({ ...s, order: i })) });
    };

    const handleUpload = async (index: number, field: 'ok_image_url' | 'ko_image_url', file: File | undefined) => {
        if (!file) return;
        if (!persistedTipKey) {
            onSnack('Guarda el tip primero para poder subir imágenes', 'error');
            return;
        }
        const key = `${index}-${field}`;
        setUploading(key);
        try {
            const { url } = await tipsApi.uploadImage(persistedTipKey, file);
            const absoluteUrl = url.startsWith('http') ? url : getMediaUrl(url);
            const check = await fetch(absoluteUrl, { method: 'HEAD' }).catch(() => null);
            if (!check || !check.ok) {
                onSnack('Subida incompleta: el archivo no quedó accesible en el servidor', 'error');
                return;
            }
            setSlide(index, { [field]: url });
            // Auto-persist slides so closing the dialog never loses uploads.
            try {
                const current = [...(value.slides ?? [])];
                current[index] = { ...current[index], [field]: url };
                await tipsApi.update(persistedTipKey, {
                    slides: current.map((s, i) => ({ ...s, order: i })),
                });
                onSnack('Imagen guardada', 'success');
            } catch {
                onSnack('Imagen subida pero no guardada: pulsa Guardar', 'error');
            }
        } catch {
            onSnack('Error al subir la imagen', 'error');
        } finally {
            setUploading(null);
        }
    };

    const renderLangGrid = (lang: string) => {
        const tr = value.translations?.[lang] ?? EMPTY_TR;
        return (
            <Grid container spacing={2} key={lang} sx={{ mb: 2 }}>
                <Grid item xs={12}>
                    <Typography variant="subtitle2" fontWeight={700} sx={{ textTransform: 'uppercase' }}>
                        {lang}
                    </Typography>
                </Grid>
                {TR_FIELDS.map((f) => (
                    <Grid item xs={12} sm={f.multiline ? 12 : 6} key={f.key}>
                        <TextField
                            label={`${f.label} (${lang})`}
                            value={(tr[f.key] as string) ?? ''}
                            onChange={(e) => setTr(lang, f.key, e.target.value)}
                            disabled={readOnly}
                            multiline={f.multiline}
                            rows={f.multiline ? 2 : 1}
                            fullWidth
                            size="small"
                        />
                    </Grid>
                ))}
            </Grid>
        );
    };

    return (
        <Box>
            <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
                <Tab label="General" />
                <Tab label="Traducciones" />
                <Tab label={`Slides (${(value.slides ?? []).length})`} />
            </Tabs>

            {tab === 0 && (
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            label="tip_key"
                            value={value.tip_key ?? ''}
                            onChange={(e) => set({ tip_key: e.target.value })}
                            disabled={readOnly || !!persistedTipKey}
                            helperText={persistedTipKey ? 'La clave no se puede cambiar' : 'Identificador único'}
                            fullWidth
                            size="small"
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Tipo</InputLabel>
                            <Select
                                value={value.type ?? 'drawer'}
                                label="Tipo"
                                disabled={readOnly}
                                onChange={(e) => set({ type: e.target.value as AdminTip['type'] })}
                            >
                                <MenuItem value="carousel">carousel</MenuItem>
                                <MenuItem value="drawer">drawer</MenuItem>
                                <MenuItem value="stepper">stepper</MenuItem>
                                <MenuItem value="dialog">dialog</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            label="section_key"
                            value={value.section_key ?? ''}
                            onChange={(e) => set({ section_key: e.target.value })}
                            disabled={readOnly}
                            fullWidth
                            size="small"
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            label="Orden"
                            type="number"
                            value={value.order ?? 0}
                            onChange={(e) => set({ order: Number(e.target.value) })}
                            disabled={readOnly}
                            fullWidth
                            size="small"
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={value.is_active ?? true}
                                    onChange={(e) => set({ is_active: e.target.checked })}
                                    disabled={readOnly}
                                />
                            }
                            label="Activo"
                        />
                    </Grid>
                </Grid>
            )}

            {tab === 1 && (
                <Box>
                    {MAIN_LANGS.map(renderLangGrid)}
                    <Accordion>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography variant="subtitle2">
                                Otros idiomas ({EXTRA_LANGS.length})
                            </Typography>
                        </AccordionSummary>
                        <AccordionDetails>{EXTRA_LANGS.map(renderLangGrid)}</AccordionDetails>
                    </Accordion>
                </Box>
            )}

            {tab === 2 && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {(value.slides ?? []).map((slide, i) => (
                        <Box key={i} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <Typography variant="subtitle2" fontWeight={700} sx={{ flex: 1 }}>
                                    Slide {i + 1}
                                </Typography>
                                <IconButton size="small" disabled={readOnly || i === 0} onClick={() => moveSlide(i, -1)} aria-label="subir slide">
                                    <UpIcon fontSize="small" />
                                </IconButton>
                                <IconButton size="small" disabled={readOnly || i === (value.slides ?? []).length - 1} onClick={() => moveSlide(i, 1)} aria-label="bajar slide">
                                    <DownIcon fontSize="small" />
                                </IconButton>
                                <IconButton size="small" disabled={readOnly} onClick={() => removeSlide(i)} aria-label="eliminar slide">
                                    <DeleteIcon fontSize="small" />
                                </IconButton>
                            </Box>
                            <Grid container spacing={2}>
                                {MAIN_LANGS.map((lang) => (
                                    <React.Fragment key={lang}>
                                        {SLIDE_TR_FIELDS.map((f) => (
                                            <Grid item xs={12} sm={6} key={`${lang}-${f.key}`}>
                                                <TextField
                                                    label={`${f.label} (${lang})`}
                                                    value={(slide.translations?.[lang] as any)?.[f.key] ?? ''}
                                                    onChange={(e) => {
                                                        set({ slides: setSlideTr(value.slides, i, lang, f.key, e.target.value) });
                                                    }}
                                                    disabled={readOnly}
                                                    fullWidth
                                                    size="small"
                                                />
                                            </Grid>
                                        ))}
                                    </React.Fragment>
                                ))}
                                <Grid item xs={12}>
                                    <Accordion>
                                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                            <Typography variant="caption">
                                                Otros idiomas ({EXTRA_LANGS.length})
                                            </Typography>
                                        </AccordionSummary>
                                        <AccordionDetails>
                                            <Grid container spacing={2}>
                                                {EXTRA_LANGS.map((lang) => (
                                                    <React.Fragment key={lang}>
                                                        {SLIDE_TR_FIELDS.map((f) => (
                                                            <Grid item xs={12} sm={6} key={`${lang}-${f.key}`}>
                                                                <TextField
                                                                    label={`${f.label} (${lang})`}
                                                                    value={(slide.translations?.[lang] as any)?.[f.key] ?? ''}
                                                                    onChange={(e) => {
                                                                        set({ slides: setSlideTr(value.slides, i, lang, f.key, e.target.value) });
                                                                    }}
                                                                    disabled={readOnly}
                                                                    fullWidth
                                                                    size="small"
                                                                />
                                                            </Grid>
                                                        ))}
                                                    </React.Fragment>
                                                ))}
                                            </Grid>
                                        </AccordionDetails>
                                    </Accordion>
                                </Grid>
                                {(['ok_image_url', 'ko_image_url'] as const).map((field) => (
                                    <Grid item xs={12} sm={6} key={field}>
                                        {(slide[field] as string) ? (
                                            <Box
                                                component="img"
                                                src={getMediaUrl((slide[field] as string) ?? '')}
                                                alt={field === 'ok_image_url' ? 'Vista previa OK' : 'Vista previa KO'}
                                                sx={{
                                                    width: '100%',
                                                    aspectRatio: '1/1',
                                                    objectFit: 'cover',
                                                    borderRadius: 2,
                                                    mb: 1,
                                                    border: '2px solid',
                                                    borderColor: field === 'ok_image_url' ? 'success.main' : 'error.main',
                                                    bgcolor: 'action.hover',
                                                }}
                                            />
                                        ) : null}
                                        <TextField
                                            label={field === 'ok_image_url' ? 'Imagen OK (URL)' : 'Imagen KO (URL)'}
                                            value={(slide[field] as string) ?? ''}
                                            onChange={(e) => setSlide(i, { [field]: e.target.value })}
                                            disabled={readOnly}
                                            fullWidth
                                            size="small"
                                        />
                                        <Button
                                            component="label"
                                            size="small"
                                            sx={{ mt: 1 }}
                                            disabled={readOnly || uploading !== null}
                                        >
                                            {uploading === `${i}-${field}` ? 'Subiendo…' : 'Subir imagen'}
                                            <input
                                                type="file"
                                                accept="image/*"
                                                hidden
                                                onChange={(e) => void handleUpload(i, field, e.target.files?.[0])}
                                            />
                                        </Button>
                                        {(slide[field] as string) ? (
                                            <Button
                                                size="small"
                                                color="error"
                                                sx={{ mt: 1, ml: 1 }}
                                                disabled={readOnly || uploading !== null}
                                                onClick={() => setSlide(i, { [field]: '' })}
                                            >
                                                Quitar
                                            </Button>
                                        ) : null}
                                    </Grid>
                                ))}
                            </Grid>
                        </Box>
                    ))}
                    <Divider />
                    <Button variant="outlined" startIcon={<AddIcon />} onClick={addSlide} disabled={readOnly || (value.slides ?? []).length >= MAX_SLIDES}>
                        Añadir slide ({(value.slides ?? []).length}/{MAX_SLIDES})
                    </Button>
                </Box>
            )}
        </Box>
    );
}
