import { useState, useEffect, useRef } from 'react';
import {
    Container, Box, Typography, Paper, Button, TextField, Grid,
    Card, CardContent, Divider, Switch, FormControlLabel,
    InputAdornment, Alert, CircularProgress, Accordion, AccordionSummary, AccordionDetails, Slider, Tabs, Tab, Snackbar, MenuItem
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import SaveIcon from '@mui/icons-material/Save';
import PreviewIcon from '@mui/icons-material/Preview';
import AdminLayout from '../../../components/layout/AdminLayout';
import appearanceService from '../../../services/appearanceService';
import { AppearanceType, Platform, AppearanceResource } from '../../../types/appearance';
import Image from 'next/image';
import { getMediaUrl } from '../../../utils/media';
import DeleteIcon from '@mui/icons-material/Delete';
import RedThreadLogo from '../../../components/landing/RedThreadLogo';
import FavoriteIcon from '@mui/icons-material/Favorite';
import ChatIcon from '@mui/icons-material/Chat';
import RadarIcon from '@mui/icons-material/Radar';
import GroupsIcon from '@mui/icons-material/Groups';

// --- Configuration Types ---

interface FeatureText {
    title: string;
    description: string;
}

interface TranslatedContent {
    subtitle: string;
    description: string;
    ctaPrimary: string;
    ctaSecondary: string;
    howItWorksTitle: string;
    features: {
        smartMatching: FeatureText;
        realTimeChat: FeatureText;
        proximityRadar: FeatureText;
        multipleIntentions: FeatureText;
    };
    footerText: string;
}

interface LandingThemeConfig {
    // Global Styles (Shared)
    gradientStart: string;
    gradientEnd: string;
    subtitleFontSize: number; // rem
    subtitleColor: string;
    titleFont: string;
    bodyFont: string;
    savedGradients?: Array<{ id: string; name: string; start: string; end: string }>;

    // Content by Language
    translations: {
        es: TranslatedContent;
        en: TranslatedContent;
        pt: TranslatedContent;
        fr: TranslatedContent;
    };
}

const DEFAULT_CONTENT: TranslatedContent = {
    subtitle: 'Encuentra tus conexiones significativas',
    description: 'Inspirado en la leyenda del hilo rojo, conéctate con personas que comparten tus intereses, pasiones y valores.',
    ctaPrimary: 'Get Started',
    ctaSecondary: 'Sign In',
    howItWorksTitle: 'Cómo Funciona',
    features: {
        smartMatching: {
            title: 'Emparejamiento Inteligente',
            description: 'Nuestro algoritmo de afinidad impulsado por IA te empareja con personas compatibles basándose en intereses, música, personalidad y más.'
        },
        realTimeChat: {
            title: 'Chat en Tiempo Real',
            description: 'Conéctate instantáneamente con tus coincidencias a través de mensajería en tiempo real, notas de voz y compartir multimedia.'
        },
        proximityRadar: {
            title: 'Radar de Proximidad',
            description: 'Descubre personas cercanas que comparten tus intereses. Perfecto para encontrar amigos y conexiones locales.'
        },
        multipleIntentions: {
            title: 'Múltiples Intenciones',
            description: '¿Buscas amistad, romance, socios de proyecto o compañeros de juego? Encuentra conexiones para cualquier propósito.'
        }
    },
    footerText: '© 2026 RETH. Hecho con ❤️ para conexiones significativas.'
};

const DEFAULT_THEME: LandingThemeConfig = {
    gradientStart: '#881337',
    gradientEnd: '#FB7185',
    subtitleFontSize: 5,
    subtitleColor: '#FFFFFF',
    titleFont: 'Dancing Script',
    bodyFont: 'Open Sans',
    savedGradients: [],
    translations: {
        es: DEFAULT_CONTENT,
        en: {
            ...DEFAULT_CONTENT,
            subtitle: 'Find your meaningful connections',
            description: 'Inspired by the legend of the red thread, connect with people who share your interests, passions, and values.',
            howItWorksTitle: 'How It Works',
            footerText: '© 2026 RETH. Made with ❤️ for meaningful connections.',
            features: {
                smartMatching: { title: 'Smart Matching', description: 'Our AI-powered affinity algorithm matches you with compatible people.' },
                realTimeChat: { title: 'Real-Time Chat', description: 'Connect instantly with your matches through real-time messaging.' },
                proximityRadar: { title: 'Proximity Radar', description: 'Discover people nearby who share your interests.' },
                multipleIntentions: { title: 'Multiple Intentions', description: 'Find connections for any purpose.' }
            }
        },
        pt: {
            ...DEFAULT_CONTENT,
            subtitle: 'Encontre suas conexões significativas',
            description: 'Inspirado na lenda do fio vermelho, conecte-se com pessoas que compartilham seus interesses.',
            howItWorksTitle: 'Como Funciona',
            footerText: '© 2026 RETH. Feito com ❤️ para conexões significativas.',
            features: {
                smartMatching: { title: 'Correspondência Inteligente', description: 'Nosso algoritmo de afinidade combina você com pessoas compatíveis.' },
                realTimeChat: { title: 'Chat em Tempo Real', description: 'Conecte-se instantaneamente com suas correspondências.' },
                proximityRadar: { title: 'Radar de Proximidade', description: 'Descubra pessoas próximas que compartilham seus interesses.' },
                multipleIntentions: { title: 'Múltiplas Intenções', description: 'Encontre conexões para qualquer propósito.' }
            }
        },
        fr: {
            ...DEFAULT_CONTENT,
            subtitle: 'Trouvez vos connexions significatives',
            description: 'Inspiré par la légende du fil rouge, connectez-vous avec des personnes qui partagent vos intérêts.',
            howItWorksTitle: 'Comment Ça Marche',
            footerText: '© 2026 RETH. Fait avec ❤️ pour des connexions significatives.',
            features: {
                smartMatching: { title: 'Correspondance Intelligente', description: 'Notre algorithme d\'affinité vous met en relation avec des personnes compatibles.' },
                realTimeChat: { title: 'Chat en Temps Réel', description: 'Connectez-vous instantanément avec vos correspondances.' },
                proximityRadar: { title: 'Radar de Proximité', description: 'Découvrez des personnes à proximité.' },
                multipleIntentions: { title: 'Intentions Multiples', description: 'Trouvez des connexions pour n\'importe quel objectif.' }
            }
        }
    }
};

const PRESET_GRADIENTS: Array<{ id: string; name: string; start: string; end: string; subtitleColor: string }> = [
    { id: 'preset-cold', name: 'Frío (Azul/Violeta)', start: '#1A237E', end: '#7B1FA2', subtitleColor: '#FFFFFF' },
    { id: 'preset-graphite', name: 'Neutro (Grafito/Negro)', start: '#212121', end: '#000000', subtitleColor: '#FFFFFF' },
    { id: 'preset-warm', name: 'Cálido (Naranja/Dorado)', start: '#FF8E53', end: '#FFD54F', subtitleColor: '#3E2723' },
    { id: 'preset-light', name: 'Claro (Blanco/Gris)', start: '#FFFFFF', end: '#F5F5F5', subtitleColor: '#212121' },
    { id: 'preset-love-romantic', name: 'Amor romántico', start: '#FF6B8B', end: '#FFB7C5', subtitleColor: '#212121' },
    { id: 'preset-love-passion', name: 'Pasión y deseo', start: '#D32F2F', end: '#880E4F', subtitleColor: '#FFFFFF' },
    { id: 'preset-love-tenderness', name: 'Ternura y pureza', start: '#FFE0E0', end: '#FFFFFF', subtitleColor: '#212121' },
    { id: 'preset-love-spiritual', name: 'Conexión espiritual', start: '#7B1FA2', end: '#D32F2F', subtitleColor: '#FFFFFF' },
    { id: 'preset-love-eternal', name: 'Amor eterno', start: '#FF8E53', end: '#FFD54F', subtitleColor: '#3E2723' },
    { id: 'preset-love-juvenile', name: 'Amor juvenil', start: '#FF4081', end: '#F50057', subtitleColor: '#FFFFFF' },
];

type Language = 'es' | 'en' | 'pt' | 'fr';

const TITLE_FONT_OPTIONS: Array<{ value: string; label: string }> = [
    { value: 'Dancing Script', label: 'Dancing Script' },
    { value: 'Playfair Display', label: 'Playfair Display' },
    { value: 'Lobster', label: 'Lobster' },
    { value: 'Pacifico', label: 'Pacifico' },
    { value: 'Caveat', label: 'Caveat' },
    { value: 'Great Vibes', label: 'Great Vibes' },
];

const BODY_FONT_OPTIONS: Array<{ value: string; label: string }> = [
    { value: 'Open Sans', label: 'Open Sans' },
    { value: 'Inter', label: 'Inter' },
    { value: 'Poppins', label: 'Poppins' },
    { value: 'Montserrat', label: 'Montserrat' },
    { value: 'Nunito Sans', label: 'Nunito Sans' },
    { value: 'Lato', label: 'Lato' },
];

const getTitleFontFamily = (font: string) => `${font}, Poppins, Inter, cursive`;
const getBodyFontFamily = (font: string) => `${font}, Inter, sans-serif`;

// Helper: Convert HEX to RGB for display
const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? `rgb(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)})` : hex;
};

export default function BannersPage() {
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [snackbar, setSnackbar] = useState<{ open: boolean, message: string, severity: 'success' | 'error' }>({
        open: false,
        message: '',
        severity: 'success'
    });

    // Resources
    const [themeResource, setThemeResource] = useState<AppearanceResource | null>(null);
    const [bannerResources, setBannerResources] = useState<AppearanceResource[]>([]);
    const [previewIndex, setPreviewIndex] = useState(0);

    // Form State
    const [config, setConfig] = useState<LandingThemeConfig>(DEFAULT_THEME);
    const [currentTab, setCurrentTab] = useState<number>(0);
    const languages: Language[] = ['es', 'en', 'pt', 'fr'];
    const currentLang = languages[currentTab];

    // Preview URLs
    const [previewBanner, setPreviewBanner] = useState<string | null>(null);
    const [previewIcon, setPreviewIcon] = useState<string | null>(null);

    // Live preview auto-fit (mini-pantalla: escala el mockup para que entre sin scroll)
    const previewBoxRef = useRef<HTMLDivElement | null>(null);
    const previewContentRef = useRef<HTMLDivElement | null>(null);
    const [previewScale, setPreviewScale] = useState(1);
    const [scaledPreviewHeight, setScaledPreviewHeight] = useState(480);

    useEffect(() => {
        const measure = () => {
            const content = previewContentRef.current;
            const box = previewBoxRef.current;
            if (!content || !box) return;
            const contentHeight = content.scrollHeight;
            const containerHeight = box.clientHeight;
            const scale = contentHeight > containerHeight && containerHeight > 0
                ? containerHeight / contentHeight
                : 1;
            setPreviewScale(scale);
            setScaledPreviewHeight(Math.round(contentHeight * scale));
        };
        measure();
        const ro = new ResizeObserver(measure);
        if (previewBoxRef.current) ro.observe(previewBoxRef.current);
        if (previewContentRef.current) ro.observe(previewContentRef.current);
        return () => ro.disconnect();
    }, [currentTab, config.subtitleFontSize, config.subtitleColor, previewBanner, previewIcon]);

    useEffect(() => {
        fetchSettings();
    }, []);

    // Rotate preview every 3 seconds
    useEffect(() => {
        if (bannerResources.length > 1) {
            const interval = setInterval(() => {
                setPreviewIndex(prev => (prev + 1) % bannerResources.length);
            }, 3000); // 3 seconds for preview (faster than real)
            return () => clearInterval(interval);
        }
    }, [bannerResources]);

    useEffect(() => {
        if (bannerResources.length > 0) {
            setPreviewBanner(getMediaUrl(bannerResources[previewIndex].url));
        } else {
            setPreviewBanner(null);
        }
    }, [previewIndex, bannerResources]);

    const fetchSettings = async () => {
        setLoading(true);
        try {
            // 1. Fetch Theme Config
            const themes = await appearanceService.getResources(AppearanceType.LANDING_THEME);
            const activeTheme = themes.find(r => r.is_active);
            if (activeTheme && activeTheme.metadata) {
                setThemeResource(activeTheme);

                // DATA MIGRATION CHECK:
                // If the fetched metadata is flattened (old version), migrate it to 'es' translation
                const fetchedData = activeTheme.metadata as any;
                if (!fetchedData.translations && fetchedData.subtitle) {
                    // Old structure
                    console.log("Migrating old Landing Theme config...");
                    setConfig({
                        ...DEFAULT_THEME,
                        gradientStart: fetchedData.gradientStart || DEFAULT_THEME.gradientStart,
                        gradientEnd: fetchedData.gradientEnd || DEFAULT_THEME.gradientEnd,
                        subtitleFontSize: Math.max(fetchedData.subtitleFontSize || DEFAULT_THEME.subtitleFontSize, 4.6),
                        subtitleColor: fetchedData.subtitleColor || DEFAULT_THEME.subtitleColor,
                        titleFont: fetchedData.titleFont || DEFAULT_THEME.titleFont,
                        bodyFont: fetchedData.bodyFont || DEFAULT_THEME.bodyFont,
                        translations: {
                            ...DEFAULT_THEME.translations,
                            es: {
                                subtitle: fetchedData.subtitle,
                                description: fetchedData.description,
                                ctaPrimary: fetchedData.ctaPrimary,
                                ctaSecondary: fetchedData.ctaSecondary,
                                howItWorksTitle: fetchedData.howItWorksTitle || DEFAULT_CONTENT.howItWorksTitle,
                                features: fetchedData.features || DEFAULT_CONTENT.features,
                                footerText: fetchedData.footerText || DEFAULT_CONTENT.footerText
                            }
                        }
                    });
                } else {
                    // New structure, merge safely
                    setConfig(prev => ({
                        ...prev,
                        ...fetchedData,
                        subtitleFontSize: Math.max(fetchedData.subtitleFontSize || prev.subtitleFontSize || DEFAULT_THEME.subtitleFontSize, 4.6),
                        titleFont: fetchedData.titleFont || prev.titleFont || DEFAULT_THEME.titleFont,
                        bodyFont: fetchedData.bodyFont || prev.bodyFont || DEFAULT_THEME.bodyFont,
                        savedGradients: fetchedData.savedGradients || [],
                        translations: {
                            ...prev.translations,
                            ...(fetchedData.translations || {})
                        }
                    }));
                }
            }

            // 2. Fetch Hero Banner Backgrounds (All active)
            const banners = await appearanceService.getResources(AppearanceType.LANDING_BANNER);
            const activeBanners = banners.filter(r => r.is_active && !r.metadata?.isHeroIcon);
            setBannerResources(activeBanners);

            if (activeBanners.length > 0) {
                setPreviewBanner(getMediaUrl(activeBanners[0].url));
            } else {
                setPreviewBanner(null);
            }

            // 3. Fetch Hero Icon
            const activeIcon = banners.find(r => r.is_active && r.metadata?.isHeroIcon);
            if (activeIcon) {
                setPreviewIcon(getMediaUrl(activeIcon.url));
            } else {
                setPreviewIcon('/imagotipo.png');
            }

        } catch (error) {
            console.error("Error fetching settings:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveTheme = async () => {
        setSaving(true);
        try {
            if (themeResource) {
                await appearanceService.updateResource(themeResource._id!, {
                    metadata: config,
                    is_active: true
                });
            } else {
                await appearanceService.createResource({
                    type: AppearanceType.LANDING_THEME,
                    platform: Platform.WEB,
                    url: 'config',
                    metadata: config,
                    is_active: true,
                    description: 'Landing Page Configuration V3 (Multi-lang)'
                });
            }
            fetchSettings();
            setSnackbar({ open: true, message: 'Configuración guardada correctamente', severity: 'success' });
        } catch (error) {
            console.error("Error saving theme:", error);
            setSnackbar({ open: true, message: 'Error al guardar la configuración', severity: 'error' });
        } finally {
            setSaving(false);
        }
    };

    const handleSaveGradient = async () => {
        const newGradient = {
            id: Date.now().toString(),
            name: `Gradiente ${config.savedGradients?.length ? config.savedGradients.length + 1 : 1}`,
            start: config.gradientStart,
            end: config.gradientEnd
        };
        const updatedGradients = [...(config.savedGradients || []), newGradient];
        const newConfig = { ...config, savedGradients: updatedGradients };

        setConfig(newConfig); // Update UI immediately

        // Persist immediately
        if (themeResource) {
            try {
                await appearanceService.updateResource(themeResource._id!, {
                    metadata: newConfig,
                    is_active: true
                });
            } catch (error) {
                console.error("Error saving gradient:", error);
                setSnackbar({ open: true, message: 'Error al guardar el gradiente en el servidor', severity: 'error' });
            }
        }
    };

    const handleApplyGradient = async (gradient: { start: string, end: string }) => {
        const newConfig = { ...config, gradientStart: gradient.start, gradientEnd: gradient.end };
        setConfig(newConfig);

        // Persist immediately so the user portal reflects the change
        if (themeResource) {
            try {
                await appearanceService.updateResource(themeResource._id!, {
                    metadata: newConfig,
                    is_active: true
                });
            } catch (error) {
                console.error("Error applying gradient:", error);
                setSnackbar({ open: true, message: 'Error al aplicar el gradiente', severity: 'error' });
            }
        }
    };

    const handleApplyPreset = async (preset: { id: string; name: string; start: string; end: string; subtitleColor: string }) => {
        const alreadySaved = config.savedGradients?.some(g => g.start === preset.start && g.end === preset.end);
        const updatedGradients = alreadySaved
            ? (config.savedGradients || [])
            : [...(config.savedGradients || []), {
                id: preset.id,
                name: preset.name,
                start: preset.start,
                end: preset.end
            }];
        const newConfig: LandingThemeConfig = {
            ...config,
            gradientStart: preset.start,
            gradientEnd: preset.end,
            subtitleColor: preset.subtitleColor,
            savedGradients: updatedGradients
        };

        setConfig(newConfig);

        if (themeResource) {
            try {
                await appearanceService.updateResource(themeResource._id!, {
                    metadata: newConfig,
                    is_active: true
                });
            } catch (error) {
                console.error("Error applying preset:", error);
                setSnackbar({ open: true, message: 'Error al aplicar el fondo predefinido', severity: 'error' });
            }
        }
    };

    const handleDeleteGradient = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const updatedGradients = config.savedGradients?.filter(g => g.id !== id) || [];
        const newConfig = { ...config, savedGradients: updatedGradients };

        setConfig(newConfig);

        // Persist immediately
        if (themeResource) {
            try {
                await appearanceService.updateResource(themeResource._id!, {
                    metadata: newConfig, // Update savedGradients list in DB
                    is_active: true
                });
            } catch (error) {
                console.error("Error deleting gradient:", error);
            }
        }
    };

    const uploadImage = async (file: File, isIcon: boolean) => {
        try {
            setLoading(true);

            // 1. Fetch current active banners to check limits if needed
            // For icons, we still only want ONE active. For banners, we allow multiple.
            const existingBanners = await appearanceService.getResources(AppearanceType.LANDING_BANNER);

            if (isIcon) {
                const activeToDeactivate = existingBanners.filter(r =>
                    r.is_active && r.metadata?.isHeroIcon === true
                );
                // Deactivate old icons
                await Promise.all(activeToDeactivate.map(r =>
                    appearanceService.updateResource(r._id!, { is_active: false })
                ));
            } else {
                // For Banners, check limit (10)
                const activeBackgrounds = existingBanners.filter(r => r.is_active && !r.metadata?.isHeroIcon);
                if (activeBackgrounds.length >= 10) {
                    setSnackbar({ open: true, message: 'Has alcanzado el límite de 10 banners. Elimina uno para agregar otro.', severity: 'error' });
                    setLoading(false);
                    return;
                }
            }

            // 3. Upload and Create New
            const url = await appearanceService.uploadFile(file, AppearanceType.LANDING_BANNER);
            await appearanceService.createResource({
                type: AppearanceType.LANDING_BANNER,
                platform: Platform.WEB,
                url: url,
                is_active: true, // This will be the ONLY active one of its type
                description: isIcon ? 'Hero Icon' : 'Hero Banner Background',
                metadata: {
                    originalName: file.name,
                    isHeroIcon: isIcon
                }
            });

            fetchSettings();
            setSnackbar({ open: true, message: 'Imagen subida correctamente', severity: 'success' });
        } catch (error) {
            console.error("Error uploading image:", error);
            setSnackbar({ open: true, message: 'Error al subir la imagen', severity: 'error' });
        } finally {
            setLoading(false);
        }
    }

    const handleDeleteBanner = async (resourceId: string) => {
        if (!confirm('¿Estás seguro de eliminar este banner?')) return;
        try {
            setLoading(true);
            await appearanceService.updateResource(resourceId, { is_active: false });
            fetchSettings();
            setSnackbar({ open: true, message: 'Banner eliminado correctamente', severity: 'success' });
        } catch (error) {
            console.error("Error removing banner:", error);
            setSnackbar({ open: true, message: 'Error al eliminar el banner', severity: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) uploadImage(file, false);
    };

    const handleIconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) uploadImage(file, true);
    };

    // Helper to update translations for current language
    const updateTranslation = (field: keyof TranslatedContent, value: any) => {
        setConfig(prev => ({
            ...prev,
            translations: {
                ...prev.translations,
                [currentLang]: {
                    ...prev.translations[currentLang],
                    [field]: value
                }
            }
        }));
    };

    // Helper for nested features features
    const updateFeature = (key: keyof TranslatedContent['features'], field: keyof FeatureText, value: string) => {
        setConfig(prev => {
            const currentFeatures = prev.translations[currentLang].features;
            return {
                ...prev,
                translations: {
                    ...prev.translations,
                    [currentLang]: {
                        ...prev.translations[currentLang],
                        features: {
                            ...currentFeatures,
                            [key]: {
                                ...currentFeatures[key],
                                [field]: value
                            }
                        }
                    }
                }
            };
        });
    };

    if (loading && !config) {
        return <AdminLayout><Box p={4}><CircularProgress /></Box></AdminLayout>;
    }

    const t = config.translations[currentLang];

    const handleCloseSnackbar = () => setSnackbar(prev => ({ ...prev, open: false }));

    return (
        <AdminLayout>
            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} variant="filled">
                    {snackbar.message}
                </Alert>
            </Snackbar>

            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Typography variant="h4" fontWeight={700} gutterBottom>
                    Gestión de Portada y Contenido
                </Typography>
                <Typography variant="body1" color="text.secondary" paragraph>
                    Personaliza la experiencia de la página de inicio para cada idioma.
                </Typography>

                <Grid container spacing={4}>
                    {/* Left Column: Editors */}
                    <Grid item xs={12} md={7}>

                        {/* Global Settings (One for all languages) */}
                        <Paper sx={{ p: 3, mb: 3, borderLeft: '4px solid #FF6B6B' }}>
                            <Typography variant="h6" gutterBottom>Configuración Global (Visual)</Typography>
                            <Divider sx={{ mb: 2 }} />

                            {/* Typography Control */}
                            <Grid container spacing={2} alignItems="center" sx={{ mb: 3 }}>
                                <Grid item xs={6}>
                                    <Typography variant="caption" fontWeight="bold">Tamaño Título (rem)</Typography>
                                    <Slider
                                        value={config.subtitleFontSize}
                                        min={4.6} max={8} step={0.1}
                                        onChange={(e, v) => setConfig({ ...config, subtitleFontSize: v as number })}
                                        valueLabelDisplay="auto"
                                        sx={{ color: '#FF6B6B' }}
                                    />
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="caption" fontWeight="bold" display="block" mb={1}>Color Título</Typography>
                                    <Box display="flex" alignItems="center" gap={1}>
                                        <input
                                            type="color"
                                            value={config.subtitleColor}
                                            onChange={(e) => setConfig({ ...config, subtitleColor: e.target.value })}
                                            style={{ width: '40px', height: '40px', border: 'none', cursor: 'pointer', borderRadius: '4px' }}
                                        />
                                        <Box>
                                            <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>{config.subtitleColor}</Typography>
                                            <Typography variant="caption" color="text.secondary">{hexToRgb(config.subtitleColor)}</Typography>
                                        </Box>
                                    </Box>
                                </Grid>
                            </Grid>

                            {/* Typography Fonts */}
                            <Grid container spacing={2} sx={{ mb: 3 }}>
                                <Grid item xs={6}>
                                    <Typography variant="caption" fontWeight="bold" display="block" mb={1}>Tipografía Título</Typography>
                                    <TextField
                                        select
                                        fullWidth
                                        size="small"
                                        value={config.titleFont || DEFAULT_THEME.titleFont}
                                        onChange={(e) => setConfig({ ...config, titleFont: e.target.value })}
                                        sx={{ '& .MuiSelect-select': { fontFamily: getTitleFontFamily(config.titleFont || DEFAULT_THEME.titleFont) } }}
                                    >
                                        {TITLE_FONT_OPTIONS.map((opt) => (
                                            <MenuItem key={opt.value} value={opt.value} sx={{ fontFamily: getTitleFontFamily(opt.value) }}>
                                                {opt.label}
                                            </MenuItem>
                                        ))}
                                    </TextField>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="caption" fontWeight="bold" display="block" mb={1}>Tipografía de Texto</Typography>
                                    <TextField
                                        select
                                        fullWidth
                                        size="small"
                                        value={config.bodyFont || DEFAULT_THEME.bodyFont}
                                        onChange={(e) => setConfig({ ...config, bodyFont: e.target.value })}
                                        sx={{ '& .MuiSelect-select': { fontFamily: getBodyFontFamily(config.bodyFont || DEFAULT_THEME.bodyFont) } }}
                                    >
                                        {BODY_FONT_OPTIONS.map((opt) => (
                                            <MenuItem key={opt.value} value={opt.value} sx={{ fontFamily: getBodyFontFamily(opt.value) }}>
                                                {opt.label}
                                            </MenuItem>
                                        ))}
                                    </TextField>
                                </Grid>
                            </Grid>

                            <Divider sx={{ mb: 2 }} />

                            {/* Gradient Control */}
                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                                <Typography variant="caption" fontWeight="bold">Gradientes del Tema</Typography>
                                <Button size="small" variant="outlined" startIcon={<SaveIcon />} onClick={handleSaveGradient}>
                                    Guardar Gradiente
                                </Button>
                            </Box>

                            <Grid container spacing={2} alignItems="center">
                                <Grid item xs={6}>
                                    <Typography variant="caption">Inicio (Start)</Typography>
                                    <input
                                        type="color"
                                        value={config.gradientStart}
                                        onChange={(e) => setConfig({ ...config, gradientStart: e.target.value })}
                                        style={{ display: 'block', width: '100%', height: '40px', cursor: 'pointer', border: '1px solid #ddd', borderRadius: '4px', padding: '2px' }}
                                    />
                                    <Box mt={0.5}>
                                        <Typography variant="caption" sx={{ fontFamily: 'monospace', display: 'block' }}>{config.gradientStart}</Typography>
                                        <Typography variant="caption" color="text.secondary">{hexToRgb(config.gradientStart)}</Typography>
                                    </Box>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="caption">Fin (End)</Typography>
                                    <input
                                        type="color"
                                        value={config.gradientEnd}
                                        onChange={(e) => setConfig({ ...config, gradientEnd: e.target.value })}
                                        style={{ display: 'block', width: '100%', height: '40px', cursor: 'pointer', border: '1px solid #ddd', borderRadius: '4px', padding: '2px' }}
                                    />
                                    <Box mt={0.5}>
                                        <Typography variant="caption" sx={{ fontFamily: 'monospace', display: 'block' }}>{config.gradientEnd}</Typography>
                                        <Typography variant="caption" color="text.secondary">{hexToRgb(config.gradientEnd)}</Typography>
                                    </Box>
                                </Grid>
                            </Grid>

                            {/* Preset Backgrounds */}
                            <Box mt={3}>
                                <Typography variant="caption" color="text.secondary" mb={1} display="block">Fondos predefinidos:</Typography>
                                <Grid container spacing={1}>
                                    {PRESET_GRADIENTS.map((preset) => {
                                        const isActive = config.gradientStart === preset.start && config.gradientEnd === preset.end;
                                        return (
                                            <Grid item xs={6} key={preset.id}>
                                                <Paper
                                                    onClick={() => handleApplyPreset(preset)}
                                                    variant="outlined"
                                                    sx={{
                                                        p: 1,
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 1,
                                                        border: isActive ? '2px solid #881337' : '1px solid #ddd',
                                                        '&:hover': { bgcolor: 'action.hover' }
                                                    }}
                                                >
                                                    <Box
                                                        sx={{
                                                            width: 40,
                                                            height: 40,
                                                            borderRadius: 1,
                                                            flexShrink: 0,
                                                            background: `linear-gradient(135deg, ${preset.start} 0%, ${preset.end} 100%)`,
                                                            border: '1px solid #ddd'
                                                        }}
                                                    />
                                                    <Box sx={{ minWidth: 0 }}>
                                                        <Typography variant="caption" fontWeight="bold" display="block" noWrap>
                                                            {preset.name}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary" display="block" sx={{ fontFamily: 'monospace', fontSize: '0.65rem' }} noWrap>
                                                            {preset.start} → {preset.end}
                                                        </Typography>
                                                    </Box>
                                                </Paper>
                                            </Grid>
                                        );
                                    })}
                                </Grid>
                            </Box>

                            {/* Saved Gradients List */}
                            {config.savedGradients && config.savedGradients.length > 0 && (
                                <Box mt={3}>
                                    <Typography variant="caption" color="text.secondary" mb={1} display="block">Guardados:</Typography>
                                    <Box display="flex" gap={1} flexWrap="wrap">
                                        {config.savedGradients.map((g) => (
                                            <Box
                                                key={g.id}
                                                onClick={() => handleApplyGradient(g)}
                                                sx={{
                                                    width: 40,
                                                    height: 40,
                                                    borderRadius: '50%',
                                                    background: `linear-gradient(135deg, ${g.start} 0%, ${g.end} 100%)`,
                                                    cursor: 'pointer',
                                                    border: config.gradientStart === g.start && config.gradientEnd === g.end ? '2px solid black' : '1px solid #ddd',
                                                    position: 'relative',
                                                    '&:hover .delete-btn': { display: 'flex' }
                                                }}
                                                title={`${g.name}: ${g.start} -> ${g.end}`}
                                            >
                                                <Box
                                                    className="delete-btn"
                                                    component="div"
                                                    onClick={(e) => handleDeleteGradient(g.id, e)}
                                                    sx={{
                                                        display: 'none',
                                                        position: 'absolute',
                                                        top: -5,
                                                        right: -5,
                                                        width: 16,
                                                        height: 16,
                                                        bgcolor: 'red',
                                                        color: 'white',
                                                        borderRadius: '50%',
                                                        fontSize: '10px',
                                                        alignItems: 'center',
                                                        justifyContent: 'center'
                                                    }}
                                                >
                                                    x
                                                </Box>
                                            </Box>
                                        ))}
                                    </Box>
                                </Box>
                            )}
                        </Paper>

                        {/* Language Tabs */}
                        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                            <Tabs value={currentTab} onChange={(e: any, v: number) => setCurrentTab(v)} aria-label="language tabs">
                                <Tab label="Español (ES)" />
                                <Tab label="English (EN)" />
                                <Tab label="Português (PT)" />
                                <Tab label="Français (FR)" />
                            </Tabs>
                        </Box>

                        {/* 1. Hero Text */}
                        <Paper sx={{ p: 3, mb: 3 }}>
                            <Typography variant="h6" gutterBottom>Héroe: Textos [{currentLang.toUpperCase()}]</Typography>
                            <Divider sx={{ mb: 2 }} />

                            <TextField
                                fullWidth
                                label="Subtítulo Principal"
                                value={t.subtitle}
                                onChange={(e) => updateTranslation('subtitle', e.target.value)}
                                margin="normal"
                            />

                            <TextField
                                fullWidth
                                multiline
                                rows={3}
                                label="Descripción"
                                value={t.description}
                                onChange={(e) => updateTranslation('description', e.target.value)}
                                margin="normal"
                            />

                            <Box display="flex" gap={2} mt={1}>
                                <TextField
                                    fullWidth
                                    label="Botón Primario"
                                    value={t.ctaPrimary}
                                    onChange={(e) => updateTranslation('ctaPrimary', e.target.value)}
                                />
                                <TextField
                                    fullWidth
                                    label="Botón Secundario"
                                    value={t.ctaSecondary}
                                    onChange={(e) => updateTranslation('ctaSecondary', e.target.value)}
                                />
                            </Box>
                        </Paper>

                        {/* 2. Section: "How It Works" Text */}
                        <Paper sx={{ p: 3, mb: 3 }}>
                            <Typography variant="h6" gutterBottom>Sección: Cómo Funciona [{currentLang.toUpperCase()}]</Typography>
                            <Divider sx={{ mb: 2 }} />

                            <TextField
                                fullWidth
                                label="Título de la Sección"
                                value={t.howItWorksTitle}
                                onChange={(e) => updateTranslation('howItWorksTitle', e.target.value)}
                                margin="normal"
                            />

                            <Typography variant="subtitle2" sx={{ mt: 2, mb: 1, color: 'text.secondary' }}>Tarjetas de Características</Typography>

                            {/* Feature Editors */}
                            {[
                                { key: 'smartMatching', label: '1. Matching' },
                                { key: 'realTimeChat', label: '2. Chat' },
                                { key: 'proximityRadar', label: '3. Radar' },
                                { key: 'multipleIntentions', label: '4. Intentions' }
                            ].map((feature) => (
                                <Accordion key={feature.key} variant="outlined">
                                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                        <Typography>{feature.label}</Typography>
                                    </AccordionSummary>
                                    <AccordionDetails>
                                        <TextField
                                            fullWidth
                                            label="Título"
                                            value={(t.features as any)[feature.key].title}
                                            onChange={(e) => updateFeature(feature.key as any, 'title', e.target.value)}
                                            margin="dense"
                                        />
                                        <TextField
                                            fullWidth
                                            multiline
                                            rows={2}
                                            label="Descripción"
                                            value={(t.features as any)[feature.key].description}
                                            onChange={(e) => updateFeature(feature.key as any, 'description', e.target.value)}
                                            margin="dense"
                                        />
                                    </AccordionDetails>
                                </Accordion>
                            ))}
                        </Paper>

                        {/* 3. Footer */}
                        <Paper sx={{ p: 3, mb: 3 }}>
                            <Typography variant="h6" gutterBottom>Pie de Página (Footer) [{currentLang.toUpperCase()}]</Typography>
                            <Divider sx={{ mb: 2 }} />
                            <TextField
                                fullWidth
                                label="Texto Copyright"
                                value={t.footerText}
                                onChange={(e) => updateTranslation('footerText', e.target.value)}
                            />
                        </Paper>

                        <Box mt={3} mb={10}>
                            <Button
                                variant="contained"
                                startIcon={<SaveIcon />}
                                size="large"
                                onClick={handleSaveTheme}
                                disabled={saving}
                                fullWidth
                            >
                                {saving ? "Guardando..." : "Guardar Cambios"}
                            </Button>
                        </Box>
                    </Grid>

                    {/* Right Column: Assets & Preview */}
                    <Grid item xs={12} md={5}>
                        {/* Hero Icon Upload */}
                        <Paper sx={{ p: 3, mb: 3 }}>
                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                                <Typography variant="h6">Icono Principal (Hero)</Typography>
                                <Button component="label" size="small" startIcon={<CloudUploadIcon />}>
                                    Cambiar
                                    <input type="file" hidden accept="image/*" onChange={handleIconUpload} />
                                </Button>
                            </Box>
                            <Box
                                sx={{
                                    p: 2,
                                    bgcolor: '#333',
                                    borderRadius: 1,
                                    display: 'flex',
                                    justifyContent: 'center'
                                }}
                            >
                                {previewIcon && previewIcon !== '/imagotipo.png' ? (
                                    <img
                                        src={previewIcon}
                                        alt="Hero Icon"
                                        style={{ height: '80px', objectFit: 'contain' }}
                                    />
                                ) : (
                                    <RedThreadLogo
                                        className="rt-hero-logo"
                                        variant="mark"
                                        aria-label="Red Thread (RETH)"
                                        style={{ height: 80, width: 'auto', maxWidth: '100%' }}
                                    />
                                )}
                            </Box>
                        </Paper>

                        {/* Hero Banner Upload */}
                        <Paper sx={{ p: 3, mb: 3 }}>
                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                                <Typography variant="h6">Fondo de Portada ({bannerResources.length}/10)</Typography>
                                <Button component="label" size="small" startIcon={<CloudUploadIcon />} disabled={bannerResources.length >= 10}>
                                    Agregar
                                    <input type="file" hidden accept="image/*" onChange={handleBannerUpload} />
                                </Button>
                            </Box>

                            {/* Gallery of Active Banners */}
                            <Box display="flex" gap={1} flexWrap="wrap" mb={2}>
                                {bannerResources.map((banner, index) => (
                                    <Box
                                        key={banner._id}
                                        sx={{
                                            position: 'relative',
                                            width: 80,
                                            height: 60,
                                            borderRadius: 1,
                                            overflow: 'hidden',
                                            border: index === previewIndex ? '2px solid #FF6B6B' : '1px solid #ddd'
                                        }}
                                        onClick={() => setPreviewIndex(index)}
                                    >
                                        <img
                                            src={getMediaUrl(banner.url)}
                                            alt="banner thumbnail"
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        />
                                        <Box
                                            sx={{
                                                position: 'absolute',
                                                top: 0,
                                                right: 0,
                                                bgcolor: 'rgba(0,0,0,0.6)',
                                                borderRadius: '0 0 0 4px',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                p: 0.5
                                            }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteBanner(banner._id!);
                                            }}
                                        >
                                            <DeleteIcon sx={{ fontSize: 14, color: 'white' }} />
                                        </Box>
                                    </Box>
                                ))}
                            </Box>

                            <Box
                                sx={{
                                    height: '150px',
                                    bgcolor: '#eee',
                                    borderRadius: 1,
                                    backgroundImage: previewBanner ? `url(${previewBanner})` : 'none',
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'background-image 0.5s ease'
                                }}
                            >
                                {!previewBanner && <Typography color="text.secondary">Usando Gradiente</Typography>}
                            </Box>
                        </Paper>

                        {/* Live Preview Mockup */}
                        <Paper sx={{ p: 0, overflow: 'hidden', position: 'sticky', top: 20 }}>
                            <Box sx={{ p: 1.5, bgcolor: '#222', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <PreviewIcon fontSize="small" /> Vista Previa: {currentLang.toUpperCase()}
                                </Typography>
                            </Box>

                            {/* Mockup Container — replica fiel del landing real (index.tsx) */}
                            <Box
                                ref={previewBoxRef}
                                sx={{
                                    height: '480px',
                                    overflow: 'hidden',
                                    position: 'relative',
                                    textAlign: 'center',
                                    color: 'white',
                                    background: previewBanner
                                        ? `linear-gradient(rgba(35, 8, 20, 0.55), rgba(35, 8, 20, 0.68)), url(${previewBanner})`
                                        : `linear-gradient(135deg, ${config.gradientStart} 0%, ${config.gradientEnd} 100%)`,
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center',
                                    backgroundAttachment: 'fixed',
                                    transition: 'background 0.5s ease'
                                }}
                            >
                                {/* Scalable wrapper: mide el alto natural y lo reduce para que entre sin scroll */}
                                <Box
                                    sx={{
                                        height: `${scaledPreviewHeight}px`,
                                        transform: `scale(${previewScale})`,
                                        transformOrigin: 'top center',
                                        position: 'relative',
                                        zIndex: 1,
                                        willChange: 'transform'
                                    }}
                                >
                                    <Box ref={previewContentRef}>
                                {/* Glow blobs decorativos */}
                                <Box
                                    aria-hidden
                                    sx={{
                                        position: 'absolute',
                                        top: -120,
                                        right: -80,
                                        width: { xs: 220, md: 340 },
                                        height: { xs: 220, md: 340 },
                                        borderRadius: '50%',
                                        background: 'radial-gradient(circle, rgba(251,113,133,0.5) 0%, rgba(213,63,140,0) 70%)',
                                        filter: 'blur(70px)',
                                        pointerEvents: 'none',
                                        zIndex: 0
                                    }}
                                />
                                <Box
                                    aria-hidden
                                    sx={{
                                        position: 'absolute',
                                        bottom: -100,
                                        left: -90,
                                        width: { xs: 200, md: 300 },
                                        height: { xs: 200, md: 300 },
                                        borderRadius: '50%',
                                        background: 'radial-gradient(circle, rgba(255,177,153,0.4) 0%, rgba(255,177,153,0) 70%)',
                                        filter: 'blur(80px)',
                                        pointerEvents: 'none',
                                        zIndex: 0
                                    }}
                                />

                                {/* Mockup Hero */}
                                <Box sx={{ position: 'relative', zIndex: 1, pt: { xs: 5, md: 7 }, pb: { xs: 4, md: 5 }, px: 2 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 2, minHeight: 100 }}>
                                        {previewIcon && previewIcon !== '/imagotipo.png' ? (
                                            <img
                                                alt="Hero Icon"
                                                src={previewIcon}
                                                style={{ height: '90px', width: 'auto', objectFit: 'contain', maxWidth: '100%' }}
                                            />
                                        ) : (
                                            <RedThreadLogo
                                                className="rt-hero-logo"
                                                variant="mark"
                                                aria-label="Red Thread (RETH)"
                                                style={{ height: 90, width: 'auto', maxWidth: '100%' }}
                                            />
                                        )}
                                    </Box>
                                    <Box
                                        sx={{
                                            fontFamily: getTitleFontFamily(config.titleFont || DEFAULT_THEME.titleFont),
                                            fontWeight: 600,
                                            letterSpacing: '0.02em',
                                            lineHeight: 1.35,
                                            mb: 2,
                                            fontSize: `${(Math.max(config.subtitleFontSize || 5, 4.6) * 0.8).toFixed(2)}rem`,
                                            color: config.subtitleColor,
                                            opacity: 0.98,
                                            textShadow: '0 2px 6px rgba(0,0,0,0.35)'
                                        }}
                                    >
                                        {t.subtitle}
                                    </Box>
                                    <Box
                                        sx={{
                                            fontFamily: getBodyFontFamily(config.bodyFont || DEFAULT_THEME.bodyFont),
                                            fontSize: '0.8rem',
                                            lineHeight: 1.7,
                                            mb: 3,
                                            maxWidth: '360px',
                                            mx: 'auto',
                                            opacity: 0.95,
                                            textShadow: '0 1px 3px rgba(0,0,0,0.35)'
                                        }}
                                    >
                                        {t.description.substring(0, 90)}{t.description.length > 90 ? '...' : ''}
                                    </Box>
                                    <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'center', flexWrap: 'wrap' }}>
                                        <Button
                                            size="small"
                                            variant="contained"
                                            sx={{
                                                bgcolor: 'rgba(255,255,255,0.16)',
                                                backdropFilter: 'blur(18px)',
                                                WebkitBackdropFilter: 'blur(18px)',
                                                color: 'white',
                                                border: '1px solid rgba(255,255,255,0.55)',
                                                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.7), 0 14px 34px rgba(88, 8, 34, 0.38), 0 4px 10px rgba(0,0,0,0.22)',
                                                '&:hover': { bgcolor: 'rgba(255,255,255,0.26)' },
                                                px: 3,
                                                py: 1,
                                                fontSize: '0.7rem'
                                            }}
                                        >
                                            {t.ctaPrimary}
                                        </Button>
                                        <Button
                                            size="small"
                                            variant="outlined"
                                            sx={{
                                                borderColor: 'rgba(255,255,255,0.6)',
                                                color: 'white',
                                                bgcolor: 'rgba(255,255,255,0.10)',
                                                backdropFilter: 'blur(18px)',
                                                WebkitBackdropFilter: 'blur(18px)',
                                                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.5), 0 10px 26px rgba(0,0,0,0.16)',
                                                '&:hover': { bgcolor: 'rgba(255,255,255,0.22)', borderColor: 'rgba(255,255,255,0.95)' },
                                                px: 3,
                                                py: 1,
                                                fontSize: '0.7rem'
                                            }}
                                        >
                                            {t.ctaSecondary}
                                        </Button>
                                    </Box>
                                </Box>

                                {/* Mockup Features */}
                                <Box sx={{ position: 'relative', zIndex: 1, pb: { xs: 4, md: 5 }, px: 3 }}>
                                    <Box
                                        sx={{
                                            fontFamily: getTitleFontFamily(config.titleFont || DEFAULT_THEME.titleFont),
                                            fontSize: '1.4rem',
                                            textAlign: 'center',
                                            color: 'white',
                                            letterSpacing: '0.01em',
                                            mb: 2.5,
                                            fontWeight: 700,
                                            textShadow: '0 2px 8px rgba(0,0,0,0.3)'
                                        }}
                                    >
                                        {t.howItWorksTitle}
                                    </Box>
                                    <Grid container spacing={2}>
                                        <Grid item xs={6}>
                                            <Paper sx={{ p: 1.5, textAlign: 'center', borderRadius: 3, bgcolor: 'rgba(255,255,255,0.86)', backdropFilter: 'blur(14px)', boxShadow: '0 18px 40px rgba(88, 8, 34, 0.16), 0 4px 12px rgba(0, 0, 0, 0.08)' }}>
                                                <FavoriteIcon sx={{ fontSize: 32, color: '#3B82F6', mb: 0.5 }} />
                                                <Box sx={{ fontFamily: getTitleFontFamily(config.titleFont || DEFAULT_THEME.titleFont), fontWeight: 600, fontSize: '0.85rem', color: '#3B1C2A' }}>
                                                    {t.features.smartMatching.title}
                                                </Box>
                                            </Paper>
                                        </Grid>
                                        <Grid item xs={6}>
                                            <Paper sx={{ p: 1.5, textAlign: 'center', borderRadius: 3, bgcolor: 'rgba(255,255,255,0.86)', backdropFilter: 'blur(14px)', boxShadow: '0 18px 40px rgba(88, 8, 34, 0.16), 0 4px 12px rgba(0, 0, 0, 0.08)' }}>
                                                <ChatIcon sx={{ fontSize: 32, color: '#8B5CF6', mb: 0.5 }} />
                                                <Box sx={{ fontFamily: getTitleFontFamily(config.titleFont || DEFAULT_THEME.titleFont), fontWeight: 600, fontSize: '0.85rem', color: '#3B1C2A' }}>
                                                    {t.features.realTimeChat.title}
                                                </Box>
                                            </Paper>
                                        </Grid>
                                        <Grid item xs={6}>
                                            <Paper sx={{ p: 1.5, textAlign: 'center', borderRadius: 3, bgcolor: 'rgba(255,255,255,0.86)', backdropFilter: 'blur(14px)', boxShadow: '0 18px 40px rgba(88, 8, 34, 0.16), 0 4px 12px rgba(0, 0, 0, 0.08)' }}>
                                                <RadarIcon sx={{ fontSize: 32, color: '#F59E0B', mb: 0.5 }} />
                                                <Box sx={{ fontFamily: getTitleFontFamily(config.titleFont || DEFAULT_THEME.titleFont), fontWeight: 600, fontSize: '0.85rem', color: '#3B1C2A' }}>
                                                    {t.features.proximityRadar.title}
                                                </Box>
                                            </Paper>
                                        </Grid>
                                        <Grid item xs={6}>
                                            <Paper sx={{ p: 1.5, textAlign: 'center', borderRadius: 3, bgcolor: 'rgba(255,255,255,0.86)', backdropFilter: 'blur(14px)', boxShadow: '0 18px 40px rgba(88, 8, 34, 0.16), 0 4px 12px rgba(0, 0, 0, 0.08)' }}>
                                                <GroupsIcon sx={{ fontSize: 32, color: '#E63946', mb: 0.5 }} />
                                                <Box sx={{ fontFamily: getTitleFontFamily(config.titleFont || DEFAULT_THEME.titleFont), fontWeight: 600, fontSize: '0.85rem', color: '#3B1C2A' }}>
                                                    {t.features.multipleIntentions.title}
                                                </Box>
                                            </Paper>
                                        </Grid>
                                    </Grid>
                                </Box>

                                {/* Mockup Footer */}
                                <Box sx={{ position: 'relative', zIndex: 1, py: 3, textAlign: 'center', color: 'white', opacity: 0.85 }}>
                                    <Box sx={{ fontFamily: getBodyFontFamily(config.bodyFont || DEFAULT_THEME.bodyFont), fontSize: '0.75rem', letterSpacing: '0.04em' }}>
                                        {t.footerText}
                                    </Box>
                                </Box>
                                    </Box>
                                </Box>
                            </Box>
                        </Paper>
                    </Grid>
                </Grid>
            </Container>
        </AdminLayout>
    );
}
