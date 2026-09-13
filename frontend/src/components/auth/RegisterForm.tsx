import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import {
    Button,
    TextField,
    Typography,
    Alert,
    CircularProgress,
    InputAdornment,
    IconButton,
    Box,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Collapse,
    Fade,
    Chip,
} from '@mui/material';
import {
    Visibility,
    VisibilityOff,
    CheckCircleOutline,
    HighlightOff,
    Google,
    Facebook,
    Email,
    CheckCircle,
    Cancel,
    Lock,
} from '@mui/icons-material';
import apiClient from '../../services/api';
import { useTranslation } from 'next-i18next';
import { AUTH_INPUT_SX, SOCIAL_BTN_SX, SUBMIT_BTN_SX } from './authInputStyles';
import { keyframes } from '@mui/material';

const lockShake = keyframes`
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-1.5px); }
  40% { transform: translateX(1.5px); }
  60% { transform: translateX(-1px); }
  80% { transform: translateX(1px); }
`;


// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
}

export default function RegisterForm({ onSuccess }: { onSuccess?: () => void } = {}) {
    const router = useRouter();
    const { t } = useTranslation('common');

    // Password validation rules with translations
    const PASSWORD_RULES = [
        { label: t('auth.passwordRequirements.minLength'), test: (pwd: string) => pwd.length >= 8 },
        { label: t('auth.passwordRequirements.uppercase'), test: (pwd: string) => /[A-Z]/.test(pwd) },
        { label: t('auth.passwordRequirements.lowercase'), test: (pwd: string) => /[a-z]/.test(pwd) },
        { label: t('auth.passwordRequirements.number'), test: (pwd: string) => /\d/.test(pwd) },
        { label: t('auth.passwordRequirements.symbol'), test: (pwd: string) => /[!@#$%^&*]/.test(pwd) },
    ];

    const [formData, setFormData] = useState({
        identifier: '', // Unified field for email or phone
        username: '',
        password: '',
        confirmPassword: '',
    });

    const [step, setStep] = useState<1 | 2>(1); // 1: Info, 2: OTP Verification
    const [otp, setOtp] = useState('');
    const [tempUserId, setTempUserId] = useState<string | null>(null);

    // Visibility toggles
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Focus states for dynamic hints
    const [passwordFocused, setPasswordFocused] = useState(false);
    const [confirmPasswordFocused, setConfirmPasswordFocused] = useState(false);

    // Username uniqueness
    const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
    const [checkingUsername, setCheckingUsername] = useState(false);
    const [usernameSuggestions, setUsernameSuggestions] = useState<string[]>([]);
    const debouncedUsername = useDebounce(formData.username, 500);

    // Validations & Loading
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    // Auto-detect identifier type (email or phone)
    const getIdentifierType = (value: string): 'email' | 'phone' | null => {
        if (!value) return null;
        // Check if it's a phone number (starts with + or contains only digits)
        if (/^\+?\d+$/.test(value.replace(/\s/g, ''))) {
            return 'phone';
        }
        // Check if it's an email
        if (/@/.test(value)) {
            return 'email';
        }
        return null;
    };

    const identifierType = getIdentifierType(formData.identifier);

    // Check username availability
    useEffect(() => {
        const checkUsername = async () => {
            if (debouncedUsername.length < 3) {
                setUsernameAvailable(null);
                setUsernameSuggestions([]);
                return;
            }

            setCheckingUsername(true);
            try {
                const response = await apiClient.get(`/auth/check-username?username=${debouncedUsername}`);
                setUsernameAvailable(response.data.available);

                // Store suggestions if username is taken
                if (!response.data.available && response.data.suggestions) {
                    setUsernameSuggestions(response.data.suggestions);
                } else {
                    setUsernameSuggestions([]);
                }
            } catch (err) {
                console.error('Error checking username:', err);
                setUsernameAvailable(null);
                setUsernameSuggestions([]);
            } finally {
                setCheckingUsername(false);
            }
        };

        checkUsername();
    }, [debouncedUsername]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;

        // Strict validation for username - support Unicode
        if (name === 'username') {
            // Allow Unicode letters, numbers, underscore, dot
            if (value && !/^[\w\u0080-\uFFFF._]*$/.test(value)) return;
            if (value.length > 30) return;
        }

        // Phone formatting for identifier
        if (name === 'identifier' && /^\+?\d/.test(value)) {
            const cleaned = value.replace(/\D/g, '');
            let masked = cleaned;
            if (cleaned.length > 0) {
                masked = '+' + cleaned.substring(0, 12);
            }
            setFormData({ ...formData, [name]: masked });
            return;
        }

        setFormData({ ...formData, [name]: value });
    };

    const isPasswordValid = () => {
        return PASSWORD_RULES.every(rule => rule.test(formData.password));
    };

    const passwordsMatch = formData.password && formData.confirmPassword && formData.password === formData.confirmPassword;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Validations
        if (formData.username.length < 3) {
            setError(t('auth.errors.usernameMin'));
            return;
        }

        if (usernameAvailable === false) {
            setError(t('auth.usernameTaken'));
            return;
        }

        if (!identifierType) {
            setError(t('auth.invalidIdentifier'));
            return;
        }

        if (!isPasswordValid()) {
            setError(t('auth.errors.passwordRequirements'));
            return;
        }

        if (!passwordsMatch) {
            setError(t('auth.errors.passwordMismatch'));
            return;
        }

        setLoading(true);

        try {
            const response = await apiClient.post('/auth/register', {
                email: identifierType === 'email' ? formData.identifier : null,
                phone: identifierType === 'phone' ? formData.identifier : null,
                password: formData.password,
                display_name: formData.username,
                age: 18,
                gender: 'other',
            });

            if (response.data.requires_verification) {
                setTempUserId(response.data.temp_user_id);
                setStep(2);
            } else {
                setSuccess(true);
            }
        } catch (err: any) {
            const detail = err.response?.data?.detail;
            let errorMessage = 'Error al registrarse. Intenta nuevamente.';

            if (typeof detail === 'string') {
                errorMessage = detail;
            } else if (Array.isArray(detail)) {
                errorMessage = detail.map((d: any) => d.msg).join(', ');
            }

            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (otp.length < 6) {
            setError('Ingresa el código de 6 dígitos.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            await apiClient.post('/auth/verify-phone', {
                user_id: tempUserId,
                otp: otp
            });
            setSuccess(true);
            onSuccess?.();
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Código inválido o expirado.');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <Alert severity="success" sx={{ mt: 2 }}>
                ¡Cuenta creada exitosamente! Por favor inicia sesión con tu nueva cuenta.
            </Alert>
        );
    }

    if (step === 2) {
        return (
            <form onSubmit={handleVerifyOtp} style={{ width: '100%', fontFamily: "'Inter', 'Poppins', sans-serif" }}>
                <Typography variant="h6" align="center" gutterBottom sx={{ fontWeight: 600, color: '#FFFFFF' }}>
                    {t('auth.verifyTitle')}
                </Typography>
                <Typography variant="body2" align="center" sx={{ color: 'rgba(255,255,255,0.85)', mb: 3 }}>
                    {t('auth.verifySubtitle', { phone: formData.identifier })}
                </Typography>

                {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}

                <TextField
                    fullWidth
                    variant="standard"
                    label={t('auth.verificationCode')}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').substring(0, 6))}
                    margin="normal"
                    required
                    autoFocus
                    placeholder="000000"
                    sx={AUTH_INPUT_SX}
                    InputProps={{
                        sx: { fontSize: '1.5rem', letterSpacing: '8px', textAlign: 'center' }
                    }}
                    inputProps={{ style: { textAlign: 'center' } }}
                />

                <Button
                    fullWidth
                    type="submit"
                    variant="contained"
                    size="large"
                    disabled={loading || otp.length < 6}
                    sx={SUBMIT_BTN_SX}
                >
                    {loading ? <CircularProgress size={24} color="inherit" /> : t('auth.verifyAction')}
                </Button>

                <Button
                    fullWidth
                    variant="text"
                    onClick={() => setStep(1)}
                    sx={{ color: 'rgba(255,255,255,0.85)', textTransform: 'none', '&:hover': { color: '#FFFFFF', bgcolor: 'rgba(255,255,255,0.1)' } }}
                >
                    {t('auth.backToEdit')}
                </Button>
            </form>
        );
    }

    return (
        <form onSubmit={handleSubmit} style={{ width: '100%', fontFamily: "'Inter', 'Poppins', sans-serif" }}>
            {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}

            {/* Unified Identifier Field */}
            <TextField
                fullWidth
                variant="standard"
                label={t('auth.registerIdentifierLabel', { defaultValue: 'Tu correo electrónico o número móvil' })}
                name="identifier"
                type="text"
                placeholder={t('auth.identifierPlaceholder')}
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
                helperText={identifierType === 'phone' ? t('auth.phoneFormat') : ''}
            />

            {/* Username Field with Uniqueness Check */}
            <TextField
                fullWidth
                variant="standard"
                label={t('auth.registerUsername', { defaultValue: 'Elige tu nombre único' })}
                name="username"
                value={formData.username}
                onChange={handleChange}
                margin="normal"
                required
                error={usernameAvailable === false}
                helperText={
                    formData.username.length < 3
                        ? t('auth.registerUsernameNote', { defaultValue: 'Debe tener al menos 3 caracteres' })
                        : usernameAvailable === false
                            ? t('auth.usernameTaken')
                            : usernameAvailable === true
                                ? t('auth.usernameAvailable')
                                : ''
                }
                sx={AUTH_INPUT_SX}
                InputProps={{
                    endAdornment: (
                        <InputAdornment position="end">
                            {checkingUsername ? (
                                <CircularProgress size={20} sx={{ color: 'rgba(255,255,255,0.7)' }} />
                            ) : usernameAvailable === true ? (
                                <CheckCircle
                                    color="success"
                                    sx={{
                                        fontSize: 20,
                                        transition: 'filter 0.3s ease',
                                        filter: 'drop-shadow(0 0 6px rgba(76, 175, 80, 0.85))',
                                    }}
                                />
                            ) : usernameAvailable === false ? (
                                <Cancel color="error" sx={{ fontSize: 20 }} />
                            ) : null}
                        </InputAdornment>
                    ),
                }}
            />

            {/* Username Suggestions */}
            {usernameAvailable === false && usernameSuggestions.length > 0 && (
                <Box sx={{ mt: 1, mb: 1 }}>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', mb: 0.5, display: 'block' }}>
                        {t('auth.usernameSuggestions')}:
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {usernameSuggestions.map((suggestion) => (
                            <Chip
                                key={suggestion}
                                label={suggestion}
                                size="small"
                                onClick={() => {
                                    setFormData({ ...formData, username: suggestion });
                                }}
                                sx={{
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    '&:hover': {
                                        bgcolor: 'primary.main',
                                        color: 'primary.contrastText',
                                        transform: 'translateY(-2px)',
                                        boxShadow: 1,
                                    },
                                }}
                            />
                        ))}
                    </Box>
                </Box>
            )}

            {/* Password Field */}
            <TextField
                fullWidth
                variant="standard"
                label={t('auth.registerPassword', { defaultValue: 'Crea una contraseña segura' })}
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleChange}
                margin="normal"
                required
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
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

            {/* Dynamic Password Validation Hints */}
            <Collapse in={passwordFocused} timeout={300}>
                <Box sx={{ mt: 1, mb: 2, p: 2, bgcolor: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', borderRadius: 2, border: '1px solid rgba(255,255,255,0.2)' }}>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }} gutterBottom>
                        {t('auth.passwordRequirements.title')}
                    </Typography>
                    <List dense disablePadding>
                        {PASSWORD_RULES.map((rule, index) => {
                            const isMet = rule.test(formData.password);
                            return (
                                <ListItem key={index} sx={{ py: 0, px: 0 }}>
                                    <ListItemIcon sx={{ minWidth: 24 }}>
                                        {isMet ? (
                                            <CheckCircleOutline color="success" fontSize="small" />
                                        ) : (
                                            <HighlightOff color="error" fontSize="small" />
                                        )}
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={rule.label}
                                        primaryTypographyProps={{
                                            variant: 'caption',
                                            color: isMet ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.45)'
                                        }}
                                    />
                                </ListItem>
                            );
                        })}
                    </List>
                </Box>
            </Collapse>

            {/* Confirm Password Field */}
            <TextField
                fullWidth
                variant="standard"
                label={t('auth.registerConfirmPassword', { defaultValue: 'Repite tu contraseña' })}
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={handleChange}
                margin="normal"
                required
                onFocus={() => setConfirmPasswordFocused(true)}
                onBlur={() => setConfirmPasswordFocused(false)}
                sx={AUTH_INPUT_SX}
                InputProps={{
                    startAdornment: (
                        <InputAdornment position="start">
                            <Lock
                                sx={{
                                    fontSize: 20,
                                    transition: 'color 0.3s ease, filter 0.3s ease',
                                    color: passwordsMatch
                                        ? '#FB7185'
                                        : 'rgba(255,255,255,0.45)',
                                    filter: passwordsMatch
                                        ? 'drop-shadow(0 0 6px rgba(251, 113, 133, 0.9))'
                                        : 'none',
                                    ...(formData.confirmPassword.length > 0 && !passwordsMatch
                                        ? {
                                              '@media (prefers-reduced-motion: no-preference)': {
                                                  animation: `${lockShake} 1.1s ease-in-out infinite`,
                                              },
                                          }
                                        : {}),
                                }}
                            />
                        </InputAdornment>
                    ),
                    endAdornment: (
                        <InputAdornment position="end">
                            <IconButton onClick={() => setShowConfirmPassword(!showConfirmPassword)} edge="end" sx={{ color: 'rgba(255,255,255,0.85)' }}>
                                <Box sx={{ position: 'relative', width: 24, height: 24 }}>
                                    <Box sx={{ position: 'absolute', inset: 0 }}><Fade in={!showConfirmPassword} timeout={160}><Visibility fontSize="small" /></Fade></Box>
                                    <Box sx={{ position: 'absolute', inset: 0 }}><Fade in={showConfirmPassword} timeout={160}><VisibilityOff fontSize="small" /></Fade></Box>
                                </Box>
                            </IconButton>
                        </InputAdornment>
                    ),
                }}
            />

            {/* Dynamic Confirm Password Validation */}
            <Collapse in={confirmPasswordFocused && formData.confirmPassword.length > 0} timeout={300}>
                <Box sx={{ mt: 1, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    {passwordsMatch ? (
                        <>
                            <CheckCircleOutline color="success" fontSize="small" />
                            <Typography variant="caption" color="success.main">
                                {t('auth.passwordsMatch')}
                            </Typography>
                        </>
                    ) : (
                        <>
                            <HighlightOff color="error" fontSize="small" />
                            <Typography variant="caption" color="error.main">
                                {t('auth.passwordsDontMatch')}
                            </Typography>
                        </>
                    )}
                </Box>
            </Collapse>

            <Button
                fullWidth
                type="submit"
                variant="contained"
                size="large"
                disabled={
                    loading ||
                    !isPasswordValid() ||
                    !passwordsMatch ||
                    formData.username.length < 3 ||
                    usernameAvailable !== true ||
                    !identifierType
                }
                sx={SUBMIT_BTN_SX}
            >
                {loading ? <CircularProgress size={24} color="inherit" /> : t('auth.registerSubmit', { defaultValue: 'Comenzar mi historia' })}
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
                    {t('auth.orJoinWith')}
                </Typography>
            </Box>

            <Box sx={{ display: 'flex', gap: 0, justifyContent: 'center', mt: 2 }}>
                {/* Google */}
                <IconButton
                    aria-label={t('auth.social.registerWith', { provider: 'Google' })}
                    sx={SOCIAL_BTN_SX}
                >
                    <Google sx={{ fontSize: 20, color: '#FFFFFF' }} />
                </IconButton>

                {/* Facebook */}
                <IconButton
                    aria-label="Registrarse con Facebook"
                    sx={SOCIAL_BTN_SX}
                >
                    <Facebook sx={{ fontSize: 20, color: '#FFFFFF' }} />
                </IconButton>

                {/* Instagram */}
                <IconButton
                    aria-label="Registrarse con Instagram"
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
                    aria-label="Registrarse con TikTok"
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
