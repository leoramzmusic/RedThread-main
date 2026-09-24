import { useState } from 'react';
import { useRouter } from 'next/router';
import { useDispatch } from 'react-redux';
import {
    Button,
    TextField,
    Typography,
    Alert,
    CircularProgress,
    InputAdornment,
    IconButton,
    FormControlLabel,
    Checkbox,
    Box,
    Link as MuiLink,
    Tabs,
    Tab,
    Fade,
} from '@mui/material';
import { Visibility, VisibilityOff, Google, Facebook, Email, Phone } from '@mui/icons-material';
import Link from 'next/link';
import apiClient from '../../services/api';
import { setCredentials } from '../../store/slices/authSlice';
import { useAppTheme } from '../../context/ThemeContext';
import { useTranslation } from 'next-i18next';
import { persistLangLocal, normalizeLang, PROFILE_LANG_STORAGE_KEY } from '../../utils/landingLanguage';
import { AUTH_INPUT_SX, SOCIAL_BTN_SX, SUBMIT_BTN_SX } from './authInputStyles';

export default function LoginForm({ onSuccess }: { onSuccess?: () => void } = {}) {
    const router = useRouter();
    const dispatch = useDispatch();
    const { loadPreferences } = useAppTheme();
    const { t } = useTranslation('common');

    const [formData, setFormData] = useState({ identifier: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const getDeviceInfo = () => {
        const ua = navigator.userAgent;
        let type = 'web';
        if (/Mobile|Android|iPhone/i.test(ua)) type = 'mobile';
        else if (/Tablet|iPad/i.test(ua)) type = 'tablet';
        return {
            type,
            userAgent: ua,
            platform: navigator.platform
        };
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const deviceInfo = getDeviceInfo();

            const response = await apiClient.post('/auth/login', {
                identifier: formData.identifier,
                password: formData.password,
                remember_me: rememberMe,
                device_type: deviceInfo.type,
                device_info: deviceInfo
            });

            // Fetch user details & prefs - cookies are sent automatically
            const userResponse = await apiClient.get('/auth/me');

            // Language sync: DB vs local (continuity) — writes reth-lang + preferred_language + NEXT_LOCALE cookie
            try {
              const dbLang = normalizeLang(userResponse.data.preferred_language) || 'en';
              const localLang = normalizeLang(typeof window !== 'undefined' ? localStorage.getItem(PROFILE_LANG_STORAGE_KEY) : null);
              if (dbLang !== router.locale) {
                const pathWithoutLocale = (router.asPath || '/').replace(/^\/[a-z]{2}(?=\/|$)/, '') || '/';
                const localWins = !!localLang && localLang !== dbLang && localLang !== 'en';
                const targetLang = localWins ? (localLang as string) : dbLang;
                persistLangLocal(targetLang);
                if (localWins) {
                  await apiClient.patch('/auth/me', { preferred_language: targetLang });
                }
                window.location.href = `/${targetLang}${pathWithoutLocale}`;
                return;
              }
            } catch {}

            // Load preferences from DB (this will now also save to localStorage)
            try {
                const settingsResponse = await apiClient.get('/settings/me');
                if (settingsResponse.data) {
                    loadPreferences({
                        theme_mode: settingsResponse.data.theme_mode,
                        visual_theme: settingsResponse.data.visual_theme
                    });
                }
            } catch (err) {
                console.warn('Could not load user settings on login', err);
            }

            // Fetch Avatar
            let currentAvatar: string | undefined = undefined;
            if (userResponse.data.profile?.photos?.length > 0) {
                currentAvatar = userResponse.data.profile.photos[0];
            }

            dispatch(setCredentials({
                user: {
                    user_id: userResponse.data.user_id,
                    email: userResponse.data.email,
                    subscription_tier: userResponse.data.subscription_tier,
                    display_name: userResponse.data.display_name,
                    name: userResponse.data.real_name,
                    nickname: userResponse.data.nickname,
                    avatar: currentAvatar,
                    photos: userResponse.data.profile?.photos,
                }
            }));

            onSuccess?.();
            setTimeout(() => router.push('/discover'), 800);
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Error al iniciar sesión. Verifica tus credenciales.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} style={{ width: '100%', fontFamily: "'Inter', 'Poppins', sans-serif" }}>
            {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}

            <TextField
                fullWidth
                variant="standard"
                label={t('auth.identifierLabel') || "Correo, usuario o celular"}
                name="identifier"
                type="text"
                placeholder={t('auth.identifierPlaceholder') || "nombre@ejemplo.com"}
                value={formData.identifier}
                onChange={handleChange}
                margin="normal"
                required
                autoFocus
                sx={AUTH_INPUT_SX}
                InputProps={{
                    startAdornment: (
                        <InputAdornment position="start">
                            <Email sx={{ fontSize: 20, color: 'rgba(255,255,255,0.55)' }} />
                        </InputAdornment>
                    )
                }}
            />
            <TextField
                fullWidth
                variant="standard"
                label={t('auth.password')}
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleChange}
                margin="normal"
                required
                sx={AUTH_INPUT_SX}
                InputProps={{
                    endAdornment: (
                        <InputAdornment position="end">
                            <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" sx={{ color: 'rgba(255,255,255,0.85)' }}>
                                <Box sx={{ position: 'relative', width: 24, height: 24 }}>
                                    <Box sx={{ position: 'absolute', inset: 0 }}><Fade in={!showPassword} timeout={160}><Visibility fontSize="small" /></Fade></Box>
                                    <Box sx={{ position: 'absolute', inset: 0 }}><Fade in={showPassword} timeout={160}><VisibilityOff fontSize="small" /></Fade></Box>
                                </Box>
                            </IconButton>
                        </InputAdornment>
                    ),
                }}
            />

            <Box display="flex" justifyContent="space-between" alignItems="center" mt={1} mb={2} sx={{ color: 'white' }}>
                <FormControlLabel
                    control={
                        <Checkbox
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                            sx={{ color: 'rgba(255,255,255,0.7)', '&.Mui-checked': { color: '#E63946' } }}
                        />
                    }
                    label={<Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.85)' }}>{t('auth.rememberMe')}</Typography>}
                />
                <Link href="/auth/forgot-password" passHref>
                    <Button
                        size="small"
                        sx={{ textTransform: 'none', fontWeight: 600, color: 'rgba(255,255,255,0.85)', '&:hover': { color: '#FFFFFF', bgcolor: 'rgba(255,255,255,0.1)' } }}
                    >
                        {t('auth.forgotPassword')}
                    </Button>
                </Link>
            </Box>

            <Button
                fullWidth
                type="submit"
                variant="contained"
                size="large"
                disabled={loading}
                sx={{ ...SUBMIT_BTN_SX, mt: 2, mb: 3 }}
            >
                {loading ? <CircularProgress size={24} color="inherit" /> : t('auth.signIn')}
            </Button>

            <Box sx={{ position: 'relative', my: 3 }}>
                <Box sx={{ borderBottom: 1, borderColor: 'rgba(255,255,255,0.25)', position: 'absolute', width: '100%', top: '50%' }} />
                <Typography
                    variant="caption"
                    sx={{
                        bgcolor: 'transparent',
                        px: 2,
                        position: 'relative',
                        color: 'rgba(255,255,255,0.7)',
                        display: 'inline-block'
                    }}
                >
                    {t('auth.orLoginWith')}
                </Typography>
            </Box>

            <Box sx={{ display: 'flex', gap: 0, justifyContent: 'center', mt: 2 }}>
                {/* Google */}
                <IconButton
                    aria-label={t('auth.social.loginWith', { provider: 'Google' })}
                    role="button"
                    tabIndex={0}
                    sx={SOCIAL_BTN_SX}
                >
                    <Google sx={{ fontSize: 20, color: '#FFFFFF' }} />
                </IconButton>

                {/* Facebook */}
                <IconButton
                    aria-label="Iniciar sesión con Facebook"
                    role="button"
                    tabIndex={0}
                    sx={SOCIAL_BTN_SX}
                >
                    <Facebook sx={{ fontSize: 20, color: '#FFFFFF' }} />
                </IconButton>

                {/* Instagram */}
                <IconButton
                    aria-label="Iniciar sesión con Instagram"
                    role="button"
                    tabIndex={0}
                    sx={SOCIAL_BTN_SX}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                    </svg>
                </IconButton>

                {/* TikTok */}
                <IconButton
                    aria-label="Iniciar sesión con TikTok"
                    role="button"
                    tabIndex={0}
                    sx={SOCIAL_BTN_SX}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="#FFFFFF">
                        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.17-2.89-.6-4.09-1.47-.76-.55-1.38-1.28-1.83-2.12v8.59c.02 1.17-.18 2.37-.62 3.44-1.12 2.75-4.14 4.54-7.06 4.01-1.21-.21-2.39-.81-3.23-1.72-1.36-1.44-1.92-3.56-1.45-5.5.42-1.74 1.7-3.29 3.4-3.9 1.04-.37 2.14-.5 3.24-.37.38.04.75.12 1.12.23.01-1.31.01-2.61.02-3.91-.56-.16-1.14-.23-1.72-.25-2.08-.07-4.22.75-5.61 2.3-1.8 2.01-2.18 5.23-1.15 7.82.72 1.83 2.34 3.33 4.26 3.86 1.84.52 4.02.13 5.48-1.12 1.39-1.2 2.04-3.09 1.95-4.94L12.525.02z" />
                    </svg>
                </IconButton>
            </Box>
        </form>
    );
}
