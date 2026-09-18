import {
    Box,
    Typography,
    Stack,
    Grid,
    Select,
    MenuItem,
    SelectChangeEvent,
    Slider,
    TextField,
    InputAdornment,
} from '@mui/material';
import {
    TextFields as TextFieldsIcon,
    Translate as TranslateIcon,
    LightMode as LightModeIcon,
    DarkMode as DarkModeIcon,
    Palette as PaletteIcon,
} from '@mui/icons-material';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import { alpha, useTheme } from '@mui/material/styles';
import { useAppTheme } from '../../context/ThemeContext';

interface AppearanceSectionProps {
    settings: any;
    onSettingsChange: (field: string, value: any) => void;
    onSave: (settingsToSave?: any) => Promise<void>;
    mode: string;
    setMode: (mode: string) => void;
    setTheme: (theme: string) => void;
}

const THEMES = [
    { id: 'redThread', label: 'RedThread', color: '#E63946', bg: '#F6F7F9' },
    { id: 'sakura', label: 'Sakura', color: '#EEAAC0', bg: '#EAD1D7' },
    { id: 'premium', label: 'Premium', color: '#797979', bg: '#CECECE' },
    { id: 'vip', label: 'VIP', color: '#efb810', bg: '#ffff75' },
    { id: 'blue', label: 'Blue', color: '#0CB7F2', bg: '#DEF7FF' },
    { id: 'purple', label: 'Purple', color: '#7F4CA5', bg: '#FFF0FF' },
    { id: 'pink', label: 'Pink', color: '#FC6998', bg: '#FFE4EC' },
    { id: 'green', label: 'Green', color: '#5CCB5F', bg: '#F5E1CE' },
    { id: 'halloween', label: 'Halloween', color: '#CC750D', bg: '#2D2C36' },
    { id: 'christmas', label: 'Christmas', color: '#CC750D', bg: '#8B0000' },
];

export const supportedLanguages = [
    { code: 'en', label: 'English', sample: 'A E I O U' },
    { code: 'es', label: 'Español', sample: 'A E I O U' },
    { code: 'pt', label: 'Português', sample: 'A Ã E Ê I O Õ U' },
    { code: 'fr', label: 'Français', sample: 'A E I O U Y' },
    { code: 'de', label: 'Deutsch', sample: 'A Ä E I O Ö U Ü' },
    { code: 'it', label: 'Italiano', sample: 'A E I O U' },
    { code: 'ru', label: 'Русский', sample: 'А Е Ё И О У Ы Э Ю Я' },
    { code: 'sv', label: 'Svenska', sample: 'A E I O U Å Ä Ö' },
    { code: 'nl', label: 'Nederlands', sample: 'A E I O U' },
    { code: 'zh', label: '中文 (Mandarín)', sample: 'a o e i u ü' },
    { code: 'hi', label: 'हिन्दी (Hindi)', sample: 'अ आ इ ई उ ऊ ए ऐ ओ औ' },
    { code: 'bn', label: 'বাংলা (Bengali)', sample: 'অ আ ই ঈ উ ঊ এ ঐ ও ঔ' },
    { code: 'ja', label: '日本語 (Japanese)', sample: 'あ い う え お ア イ ウ エ オ' },
    { code: 'ko', label: '한국어 (Korean)', sample: 'ㅏ ㅑ ㅓ ㅕ ㅗ ㅛ ㅜ ㅠ ㅡ ㅣ' },
    { code: 'ar', label: 'العربية (Arabic)', sample: 'ا و ي' },
    { code: 'sw', label: 'Kiswahili (Swahili)', sample: 'A E I O U' },
    { code: 'ha', label: 'Hausa', sample: 'Á À É È Í Ì Ó Ò Ú' },
    { code: 'am', label: 'አማርኛ (Amharic)', sample: 'ሀ ሁ ሂ ሃ ሄ ህ ሆ' },
    { code: 'fil', label: 'Filipino/Tagalog', sample: 'A E I O U' },
    { code: 'ms', label: 'Bahasa Melayu (Malay)', sample: 'A E I O U ə' },
    { code: 'mi', label: 'Māori', sample: 'A E I O U Ā Ē Ī Ō Ū' },
];

const FONT_PRESETS = [
    { label: 'Muy pequeño', value: 10 },
    { label: 'Pequeño', value: 12 },
    { label: 'Mediano', value: 14 },
    { label: 'Grande', value: 18 },
    { label: 'Muy grande', value: 22 },
    { label: 'Gigante', value: 30 },
];

export default function AppearanceSection({
    settings,
    onSettingsChange,
    onSave,
    mode,
    setMode,
    setTheme
}: AppearanceSectionProps) {
    const { i18n, t } = useTranslation('common');
    const { setFontSize } = useAppTheme();
    const router = useRouter();
    const muiTheme = useTheme();
    const isDark = muiTheme.palette.mode === 'dark';
    const primary = muiTheme.palette.primary.main;
    const isDarkMode = mode === 'dark';
    const fontValue = parseInt(`${settings?.font_size}`) || 14;
    const langValue = settings?.preferred_language || i18n.language || 'es';
    const applyFontPreset = (value: number) => {
        const clamped = Math.min(Math.max(value, 10), 40);
        onSettingsChange('font_size', String(clamped));
        setFontSize(String(clamped));
    };
    const glassBg = isDark ? 'rgba(255,255,255,0.045)' : 'rgba(255,255,255,0.65)';
    const glassBorder = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)';
    const glassCard = {
        p: 3,
        borderRadius: 3,
        border: '1px solid',
        borderColor: glassBorder,
        bgcolor: glassBg,
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        boxShadow: `0 6px 24px rgba(0,0,0,${isDark ? 0.3 : 0.07})`,
        position: 'relative' as const,
        overflow: 'hidden' as const,
        transition: 'all 0.25s ease',
    };

    const handleThemeSelect = (themeId: string) => {
        onSettingsChange('visual_theme', themeId);
        setTheme(themeId);
    };

    const handleModeToggle = (checked: boolean) => {
        const newMode = checked ? 'dark' : 'light';
        onSettingsChange('theme_mode', newMode);
        setMode(newMode);
    };

    const handleFontSizeChange = (event: Event | React.SyntheticEvent | React.ChangeEvent<HTMLInputElement>, newValue: number | number[] | string) => {
        const val = typeof newValue === 'string' ? parseInt(newValue) : (Array.isArray(newValue) ? newValue[0] : newValue);
        if (!isNaN(val)) {
            const clampedVal = Math.min(Math.max(val, 10), 40).toString();
            onSettingsChange('font_size', clampedVal);
            setFontSize(clampedVal);
        }
    };

    const handleLanguageChange = async (event: SelectChangeEvent) => {
        const newLang = event.target.value as string;
        if (newLang) {
            const updatedSettings = { ...settings, preferred_language: newLang };
            onSettingsChange('preferred_language', newLang);

            // Save settings first with the explicit new language to avoid race conditions
            await onSave(updatedSettings);

            // Set cookie for next-i18next to remember locale
            document.cookie = `NEXT_LOCALE=${newLang}; path=/; max-age=31536000`;

            // Trigger router to change locale
            // Using window.location.href to force a full reload and ensure translations are re-fetched
            const currentPath = router.asPath;
            const currentLocale = router.locale || 'es';
            const defaultLocale = router.defaultLocale || 'es';
            const configuredLocales = (router.locales as string[] | undefined) ?? [];

            // Strip any leading locale prefix(es) from the URL (all configured locales)
            const prefixRe = configuredLocales.length
                ? new RegExp(`^/(?:${configuredLocales.map((l) => l.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})+(?=/|$)`)
                : new RegExp(`^/${currentLocale}(?=/|$)`);
            const cleanedPath = currentPath.replace(prefixRe, '') || '/';

            // Construct the new path
            const targetPath = newLang !== defaultLocale
                ? `/${newLang}${cleanedPath === '/' ? '' : cleanedPath}`
                : cleanedPath;

            window.location.href = targetPath;
        }
    };

    return (
        <Stack spacing={3} sx={{
            '& > *': {
                animation: 'rtFadeUp 0.5s cubic-bezier(0.22, 1, 0.36, 1) both',
            },
            '@media (prefers-reduced-motion: no-preference)': {
                '@keyframes rtFadeUp': {
                    from: { opacity: 0, transform: 'translateY(10px)' },
                    to: { opacity: 1, transform: 'translateY(0)' },
                },
            },
        }}>
            {/* Theme Selection */}
            <Box sx={glassCard}>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <PaletteIcon sx={{ color: 'primary.main' }} />
                    <Typography variant="h6" fontWeight={600}>
                        {t('settings_appearance_visualTheme')}
                    </Typography>
                </Box>
                <Grid container spacing={2}>
                    {THEMES.map((themeItem) => {
                        const isActive = (settings?.visual_theme || 'redThread') === themeItem.id;
                        const accentColor = themeItem.color || primary;
                        return (
                            <Grid item xs={6} sm={4} md={3} key={themeItem.id}>
                                <Box
                                    onClick={() => handleThemeSelect(themeItem.id)}
                                    sx={{
                                        cursor: 'pointer',
                                        borderRadius: 2,
                                        overflow: 'hidden',
                                        border: '2px solid',
                                        borderColor: isActive ? accentColor : glassBorder,
                                        boxShadow: isActive ? `0 0 22px ${alpha(accentColor, 0.45)}` : 'none',
                                        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                                        '&:hover': {
                                            borderColor: isActive ? accentColor : alpha(primary, 0.4),
                                            transform: 'translateY(-3px)',
                                            boxShadow: `0 8px 24px ${alpha(accentColor, 0.35)}`,
                                        },
                                    }}
                                >
                                    <Box
                                        sx={{
                                            height: 80,
                                            background: `linear-gradient(135deg, ${themeItem.bg} 0%, ${themeItem.color} 100%)`,
                                        }}
                                    />
                                    <Box sx={{
                                        p: 1,
                                        textAlign: 'center',
                                        bgcolor: isDark ? 'rgba(16,18,32,0.5)' : 'rgba(255,255,255,0.85)',
                                        backdropFilter: 'blur(6px)',
                                        WebkitBackdropFilter: 'blur(6px)',
                                    }}>
                                        <Typography variant="caption" fontWeight={600}>
                                            {themeItem.label}
                                        </Typography>
                                    </Box>
                                </Box>
                            </Grid>
                        );
                    })}
                </Grid>
            </Box>

            {/* Dark Mode */}
            <Box sx={glassCard}>
                <Box display="flex" alignItems="center" gap={1} mb={2.5}>
                    <DarkModeIcon sx={{ color: 'primary.main' }} />
                    <Typography variant="h6" fontWeight={600}>
                        {t('settings_appearance_darkMode')}
                    </Typography>
                </Box>

                <Grid container spacing={2}>
                    <Grid item xs={6}>
                        <Box
                            role="button"
                            tabIndex={0}
                            onClick={() => handleModeToggle(false)}
                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleModeToggle(false); }}
                            sx={{
                                cursor: 'pointer',
                                borderRadius: 2,
                                border: '2px solid',
                                borderColor: !isDarkMode ? primary : glassBorder,
                                boxShadow: !isDarkMode ? `0 0 18px ${alpha(primary, 0.35)}` : 'none',
                                p: 2,
                                textAlign: 'center',
                                background: isDarkMode
                                    ? 'rgba(255,255,255,0.03)'
                                    : 'linear-gradient(135deg, #ffffff 0%, #eaf1f9 100%)',
                                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                                '&:hover': {
                                    transform: 'translateY(-3px)',
                                    borderColor: alpha(primary, 0.5),
                                    boxShadow: `0 8px 24px ${alpha(primary, 0.3)}`,
                                },
                            }}
                        >
                            <LightModeIcon
                                sx={{
                                    fontSize: 36,
                                    color: isDarkMode ? 'text.disabled' : '#f5a700',
                                    filter: isDarkMode ? 'none' : 'drop-shadow(0 0 9px rgba(245,167,0,0.7))',
                                    transition: 'all 0.3s ease',
                                }}
                            />
                            <Typography variant="body2" fontWeight={600} mt={1} color={!isDarkMode ? 'text.primary' : 'text.secondary'}>
                                {t('settings_appearance_lightMode')}
                            </Typography>
                        </Box>
                    </Grid>

                    <Grid item xs={6}>
                        <Box
                            role="button"
                            tabIndex={0}
                            onClick={() => handleModeToggle(true)}
                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleModeToggle(true); }}
                            sx={{
                                cursor: 'pointer',
                                borderRadius: 2,
                                border: '2px solid',
                                borderColor: isDarkMode ? primary : glassBorder,
                                boxShadow: isDarkMode ? `0 0 18px ${alpha(primary, 0.35)}` : 'none',
                                p: 2,
                                textAlign: 'center',
                                background: isDarkMode
                                    ? 'linear-gradient(135deg, #232837 0%, #10131c 100%)'
                                    : 'rgba(0,0,0,0.03)',
                                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                                '&:hover': {
                                    transform: 'translateY(-3px)',
                                    borderColor: alpha(primary, 0.5),
                                    boxShadow: `0 8px 24px ${alpha(primary, 0.3)}`,
                                },
                            }}
                        >
                            <DarkModeIcon
                                sx={{
                                    fontSize: 36,
                                    color: isDarkMode ? '#8b9dff' : 'text.disabled',
                                    filter: isDarkMode ? 'drop-shadow(0 0 9px rgba(139,157,255,0.8))' : 'none',
                                    transition: 'all 0.3s ease',
                                }}
                            />
                            <Typography variant="body2" fontWeight={600} mt={1} color={isDarkMode ? 'text.primary' : 'text.secondary'}>
                                {t('settings_appearance_darkMode')}
                            </Typography>
                        </Box>
                    </Grid>
                </Grid>

                <Typography variant="body2" fontWeight={600} color={isDarkMode ? 'text.primary' : 'primary'} sx={{ mt: 2.5 }}>
                    {isDarkMode
                        ? t('settings_appearance_activateLight')
                        : t('settings_appearance_activateDark')}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                    {isDarkMode ? t('settings_appearance_darkModeOn') : t('settings_appearance_darkModeOff')}
                </Typography>
            </Box>

            {/* Font Size */}
            <Box sx={glassCard}>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <TextFieldsIcon sx={{ color: 'primary.main' }} />
                    <Typography variant="h6" fontWeight={600}>{t('settings_appearance_fontSize')}</Typography>
                </Box>

                <Typography variant="body2" color="text.secondary" mb={2}>
                    {t('settings_appearance_fontSizeHint', 'Ajusta el tamaño de texto de toda la interfaz')}
                </Typography>

                <Stack direction="row" spacing={1} mb={2.5}>
                    {FONT_PRESETS.map((preset) => {
                        const isPreset = fontValue === preset.value;
                        return (
                            <Box
                                key={preset.value}
                                role="button"
                                tabIndex={0}
                                onClick={() => applyFontPreset(preset.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') applyFontPreset(preset.value); }}
                                sx={{
                                    px: 1.5,
                                    py: 0.75,
                                    borderRadius: '999px',
                                    cursor: 'pointer',
                                    border: '1.5px solid',
                                    borderColor: isPreset ? alpha(primary, 0.65) : glassBorder,
                                    boxShadow: isPreset ? `0 0 14px ${alpha(primary, 0.35)}` : 'none',
                                    bgcolor: isPreset ? alpha(primary, isDark ? 0.18 : 0.1) : 'transparent',
                                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                    '&:hover': {
                                        borderColor: alpha(primary, 0.6),
                                        transform: 'translateY(-1px)',
                                        boxShadow: `0 4px 12px ${alpha(primary, 0.2)}`,
                                    },
                                }}
                            >
                                <Typography variant="caption" fontWeight={isPreset ? 700 : 600} color={isPreset ? 'primary' : 'text.secondary'}>
                                    {preset.label}
                                </Typography>
                            </Box>
                        );
                    })}
                </Stack>

                <Stack direction="row" spacing={3} alignItems="center" sx={{ mb: 2 }}>
                    <Slider
                        value={fontValue}
                        min={10}
                        max={40}
                        step={1}
                        marks={[
                            { value: 10 },
                            { value: 14 },
                            { value: 20 },
                            { value: 30 },
                            { value: 40 },
                        ]}
                        valueLabelDisplay="auto"
                        onChange={(e, val) => handleFontSizeChange(e, val as number)}
                        sx={{
                            color: 'primary.main',
                            flex: 1,
                            '& .MuiSlider-thumb': {
                                boxShadow: `0 0 0 6px ${alpha(primary, 0.15)}`,
                                transition: 'all 0.2s ease',
                                '&:hover': {
                                    boxShadow: `0 0 0 9px ${alpha(primary, 0.22)}, 0 0 16px ${alpha(primary, 0.55)}`,
                                },
                            },
                            '& .MuiSlider-valueLabel': {
                                color: '#fff',
                                bgcolor: primary,
                                fontWeight: 700,
                                fontSize: '0.72rem',
                                borderRadius: '8px',
                            },
                            '& .MuiSlider-rail': {
                                opacity: 0.35,
                            },
                        }}
                    />
                    <TextField
                        type="number"
                        size="small"
                        value={fontValue}
                        onChange={(e) => handleFontSizeChange(e, e.target.value)}
                        className="no-scale"
                        inputProps={{
                            min: 10,
                            max: 40,
                            className: 'no-scale'
                        }}
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end" className="no-scale">
                                    <Typography className="no-scale" sx={{ fontSize: '14px !important' }}>px</Typography>
                                </InputAdornment>
                            ),
                            className: 'no-scale'
                        }}
                        sx={{
                            width: 96,
                            '& .MuiOutlinedInput-root': {
                                borderRadius: '10px',
                                color: 'text.primary',
                                bgcolor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.6)',
                                '&:hover .MuiOutlinedInput-notchedOutline': {
                                    borderColor: alpha(primary, 0.4),
                                },
                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                    borderColor: primary,
                                    borderWidth: '1.5px',
                                    boxShadow: `0 0 12px ${alpha(primary, 0.25)}`,
                                },
                            },
                        }}
                    />
                </Stack>

                <Box
                    sx={{
                        borderRadius: 2,
                        overflow: 'hidden',
                        border: '1px solid',
                        borderColor: alpha(primary, 0.3),
                        boxShadow: `0 0 24px ${alpha(primary, 0.08)}`,
                        mt: 1,
                    }}
                >
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.75,
                            px: 1.5,
                            py: 0.75,
                            bgcolor: alpha(primary, 0.1),
                        }}
                    >
                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#ff5f57' }} />
                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#febc2e' }} />
                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#28c840' }} />
                        <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5, fontWeight: 500 }}>
                            Vista Previa
                        </Typography>
                    </Box>
                    <Box
                        sx={{
                            p: 2.5,
                            textAlign: 'center',
                            minHeight: 100,
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            bgcolor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.55)',
                            backdropFilter: 'blur(8px)',
                            WebkitBackdropFilter: 'blur(8px)',
                        }}
                    >
                        <Typography
                            sx={{
                                fontSize: `${fontValue}px`,
                                color: 'text.primary',
                                wordBreak: 'break-all',
                                lineHeight: 1.35,
                            }}
                        >
                            {t('settings_appearance_fontSizePreview')}
                        </Typography>
                        <Typography variant="caption" color="secondary" sx={{ display: 'block', mt: 1, fontWeight: 600 }}>
                            {t('settings_appearance_fontSizeCurrent', { size: fontValue })}
                        </Typography>
                    </Box>
                </Box>
            </Box>

            {/* Language Selection */}
            <Box sx={glassCard}>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <TranslateIcon sx={{ color: 'primary.main' }} />
                    <Typography variant="h6" fontWeight={600}>{t('settings_appearance_language')}</Typography>
                </Box>

                <Typography variant="body2" color="text.secondary" mb={2}>
                    {t('settings_appearance_languageHint', 'Idioma de la interfaz')}
                </Typography>

                <Box display="flex" alignItems="center" gap={1.5} mb={1}>
                    <Box
                        sx={{
                            width: 46,
                            height: 46,
                            borderRadius: '14px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            border: '1px solid',
                            borderColor: alpha(primary, 0.3),
                            bgcolor: alpha(primary, isDark ? 0.14 : 0.08),
                            boxShadow: `0 0 12px ${alpha(primary, 0.15)}`,
                        }}
                    >
                        <Typography variant="h6" fontWeight={800} sx={{ color: 'primary.main', letterSpacing: '0.5px' }}>
                            {langValue.slice(0, 2).toUpperCase()}
                        </Typography>
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Select
                            value={langValue}
                            onChange={handleLanguageChange}
                            size="small"
                            fullWidth
                            className="no-scale"
                            MenuProps={{
                                className: 'no-scale'
                            }}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: '10px',
                                    color: 'text.primary',
                                    bgcolor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.6)',
                                    '&:hover .MuiOutlinedInput-notchedOutline': {
                                        borderColor: alpha(primary, 0.4),
                                    },
                                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                        borderColor: primary,
                                        borderWidth: '1.5px',
                                        boxShadow: `0 0 12px ${alpha(primary, 0.25)}`,
                                    },
                                },
                            }}
                        >
{supportedLanguages.map((lang) => (
                            <MenuItem key={lang.code} value={lang.code} sx={{ py: 1.25, px: 1.5 }}>
                                <Box display="flex" alignItems="center" justifyContent="space-between" width="100%" gap={2}>
                                    <Typography variant="body2" fontWeight={600} color="text.primary">
                                        {lang.label}
                                    </Typography>
                                    <Box
                                        sx={{
                                            px: 1,
                                            py: 0.25,
                                            borderRadius: '6px',
                                            backdropFilter: 'blur(6px)',
                                            WebkitBackdropFilter: 'blur(6px)',
                                            bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(211,47,47,0.06)',
                                            border: '1px solid',
                                            borderColor: alpha('#D32F2F', 0.25),
                                            whiteSpace: 'nowrap',
                                        }}
                                    >
                                        <Typography
                                            variant="caption"
                                            fontWeight={700}
                                            sx={{
                                                color: '#D32F2F',
                                                textShadow: '0 0 6px rgba(211,47,47,0.6)',
                                                letterSpacing: '1px',
                                                lineHeight: 1,
                                            }}
                                        >
                                            {lang.sample}
                                        </Typography>
                                    </Box>
                                </Box>
                            </MenuItem>
                        ))}
                        </Select>
                    </Box>
                </Box>

                <Typography variant="caption" color="text.secondary">
                    {t('settings_appearance_languageNote', '{{count}} idiomas disponibles', { count: supportedLanguages.length })}
                </Typography>
            </Box>
        </Stack>
    );
}
