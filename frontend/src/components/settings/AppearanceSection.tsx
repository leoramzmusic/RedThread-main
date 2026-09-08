import {
    Box,
    Typography,
    FormControl,
    FormLabel,
    ToggleButtonGroup,
    ToggleButton,
    Switch,
    FormControlLabel,
    Stack,
    Grid,
    Select,
    MenuItem,
    InputLabel,
    SelectChangeEvent,
    Slider,
    TextField,
    InputAdornment,
} from '@mui/material';
import {
    TextFields as TextFieldsIcon,
    Translate as TranslateIcon,
} from '@mui/icons-material';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
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
    { id: 'redThread', label: 'RedThread', color: '#FD297B', bg: '#FFF0F0' },
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
    { code: 'en', label: 'English' },
    { code: 'es', label: 'Español' },
    { code: 'pt', label: 'Português' },
    { code: 'fr', label: 'Français' },
    { code: 'de', label: 'Deutsch' },
    { code: 'it', label: 'Italiano' },
    { code: 'ru', label: 'Русский' },
    { code: 'sv', label: 'Svenska' },
    { code: 'nl', label: 'Nederlands' },
    { code: 'zh', label: '中文 (Mandarín)' },
    { code: 'hi', label: 'हिन्दी (Hindi)' },
    { code: 'bn', label: 'বাংলা (Bengali)' },
    { code: 'ja', label: '日本語 (Japanese)' },
    { code: 'ko', label: '한국어 (Korean)' },
    { code: 'ar', label: 'العربية (Arabic)' },
    { code: 'sw', label: 'Kiswahili (Swahili)' },
    { code: 'ha', label: 'Hausa' },
    { code: 'am', label: 'አማርኛ (Amharic)' },
    { code: 'fil', label: 'Filipino/Tagalog' },
    { code: 'ms', label: 'Bahasa Melayu (Malay)' },
    { code: 'mi', label: 'Māori' }
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
            const supportedLocales = ['en', 'pt', 'fr'];
            const currentPath = router.asPath;
            const currentLocale = router.locale || 'es';

            // Construct the new path
            let targetPath = currentPath;

            // 1. Remove current locale prefix if any
            if (supportedLocales.includes(currentLocale)) {
                targetPath = targetPath.replace(`/${currentLocale}`, '');
            }

            // 2. Add new locale prefix if it's not the default ('es')
            if (newLang !== 'es') {
                targetPath = `/${newLang}${targetPath === '/' ? '' : targetPath}`;
            }

            // Ensure we don't end up with empty path or double slashes
            if (!targetPath) targetPath = '/';

            window.location.href = targetPath;
        }
    };

    return (
        <Stack spacing={3}>
            {/* Theme Selection */}
            <Box>
                <Typography variant="h6" gutterBottom fontWeight={600}>
                    {t('settings_appearance_visualTheme')}
                </Typography>
                <Grid container spacing={2}>
                    {THEMES.map((theme) => {
                        const isActive = (settings?.visual_theme || 'redThread') === theme.id;
                        return (
                            <Grid item xs={6} sm={4} md={3} key={theme.id}>
                                <Box
                                    onClick={() => handleThemeSelect(theme.id)}
                                    sx={{
                                        cursor: 'pointer',
                                        borderRadius: 2,
                                        overflow: 'hidden',
                                        border: '2px solid',
                                        borderColor: isActive ? 'primary.main' : 'divider',
                                        transition: 'all 0.2s',
                                        '&:hover': {
                                            borderColor: 'primary.main',
                                            transform: 'translateY(-2px)',
                                        },
                                    }}
                                >
                                    <Box
                                        sx={{
                                            height: 80,
                                            background: `linear-gradient(135deg, ${theme.bg} 0%, ${theme.color} 100%)`,
                                        }}
                                    />
                                    <Box sx={{ p: 1, textAlign: 'center', bgcolor: 'background.paper' }}>
                                        <Typography variant="caption" fontWeight={600}>
                                            {theme.label}
                                        </Typography>
                                    </Box>
                                </Box>
                            </Grid>
                        );
                    })}
                </Grid>
            </Box>

            {/* Dark Mode */}
            <Box>
                <FormControlLabel
                    control={
                        <Switch
                            checked={settings?.theme_mode === 'dark'}
                            onChange={(e) => handleModeToggle(e.target.checked)}
                            color="primary"
                        />
                    }
                    label={
                        <Box>
                            <Typography variant="body1">{t('settings_appearance_darkMode')}</Typography>
                            <Typography variant="caption" color="text.secondary">
                                {settings?.theme_mode === 'dark' ? t('settings_appearance_darkModeOn') : t('settings_appearance_darkModeOff')}
                            </Typography>
                        </Box>
                    }
                />
            </Box>

            {/* Font Size */}
            <Box>
                <FormControl component="fieldset" fullWidth>
                    <FormLabel component="legend" sx={{ mb: 2 }}>
                        <Box display="flex" alignItems="center" gap={1}>
                            <TextFieldsIcon />
                            <Typography variant="h6">{t('settings_appearance_fontSize')}</Typography>
                        </Box>
                    </FormLabel>

                    <Stack direction="row" spacing={3} alignItems="center" sx={{ mb: 2 }}>
                        <Slider
                            value={parseInt(settings?.font_size) || 14}
                            min={10}
                            max={40}
                            step={1}
                            onChange={(e, val) => handleFontSizeChange(e, val as number)}
                            sx={{ color: 'primary.main', flex: 1 }}
                        />
                        <TextField
                            type="number"
                            size="small"
                            value={settings?.font_size || 14}
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
                            sx={{ width: 100 }}
                        />
                    </Stack>

                    <Box
                        sx={{
                            p: 2,
                            border: '1px dashed',
                            borderColor: 'divider',
                            borderRadius: 1,
                            bgcolor: 'background.default',
                            textAlign: 'center',
                            transition: 'all 0.2s',
                            mt: 1
                        }}
                    >
                        <Typography
                            sx={{
                                fontSize: `${settings?.font_size || 14}px`,
                                color: 'text.primary',
                                wordBreak: 'break-all'
                            }}
                        >
                            {t('settings_appearance_fontSizePreview')}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                            {t('settings_appearance_fontSizeCurrent', { size: settings?.font_size || 14 })}
                        </Typography>
                    </Box>
                </FormControl>
            </Box>

            {/* Language Selection */}
            <Box>
                <FormControl component="fieldset" fullWidth sx={{ maxWidth: 300 }}>
                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                        <TranslateIcon />
                        <Typography variant="h6">{t('settings_appearance_language')}</Typography>
                    </Box>
                    <Select
                        value={settings?.preferred_language || i18n.language || 'es'}
                        onChange={handleLanguageChange}
                        size="small"
                        fullWidth
                        className="no-scale"
                        MenuProps={{
                            className: 'no-scale'
                        }}
                    >
                        {supportedLanguages.map((lang) => (
                            <MenuItem key={lang.code} value={lang.code}>
                                {lang.label}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Box>
        </Stack>
    );
}
