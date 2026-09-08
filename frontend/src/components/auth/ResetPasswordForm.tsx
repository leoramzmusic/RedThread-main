import { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    TextField,
    Button,
    Alert,
    CircularProgress,
    IconButton,
    InputAdornment,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Fade
} from '@mui/material';
import {
    Visibility,
    VisibilityOff,
    CheckCircle,
    Cancel,
    LockReset
} from '@mui/icons-material';
import { useRouter } from 'next/router';
import apiClient from '../../services/api';

export default function ResetPasswordForm() {
    const router = useRouter();
    const { token } = router.query;

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    // Password rules (Reuse logic from RegisterForm)
    const passwordRules = [
        { label: 'Mínimo 8 caracteres', test: (p: string) => p.length >= 8 },
        { label: 'Una mayúscula', test: (p: string) => /[A-Z]/.test(p) },
        { label: 'Una minúscula', test: (p: string) => /[a-z]/.test(p) },
        { label: 'Un número', test: (p: string) => /[0-9]/.test(p) },
        { label: 'Un símbolo (!@#$%^&*)', test: (p: string) => /[!@#$%^&*]/.test(p) },
    ];

    const allRulesMet = passwordRules.every(rule => rule.test(password));
    const passwordsMatch = password === confirmPassword && password !== '';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!allRulesMet || !passwordsMatch) return;

        setLoading(true);
        setError(null);

        try {
            await apiClient.post('/auth/reset-password', {
                token: token as string,
                new_password: password
            });
            setSuccess(true);
            setTimeout(() => {
                router.push('/auth');
            }, 3000);
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Enlace inválido o expirado. Por favor solicita uno nuevo.');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <Fade in={true}>
                <Box sx={{ textAlign: 'center', py: 2 }}>
                    <CheckCircle sx={{ fontSize: 60, color: 'success.main', mb: 2 }} />
                    <Typography variant="h5" gutterBottom sx={{ fontWeight: 700 }}>
                        ¡Contraseña actualizada!
                    </Typography>
                    <Typography color="text.secondary">
                        Tu contraseña ha sido cambiada con éxito. Serás redireccionado al inicio de sesión en unos segundos...
                    </Typography>
                    <Button
                        fullWidth
                        variant="contained"
                        sx={{ mt: 4 }}
                        onClick={() => router.push('/auth')}
                    >
                        Ir al inicio de sesión ahora
                    </Button>
                </Box>
            </Fade>
        );
    }

    return (
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Crea una nueva contraseña segura para tu cuenta.
            </Typography>

            {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}

            <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Nueva Contraseña"
                type={showPassword ? 'text' : 'password'}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                InputProps={{
                    startAdornment: <LockReset sx={{ color: 'action.active', mr: 1 }} />,
                    endAdornment: (
                        <InputAdornment position="end">
                            <IconButton
                                aria-label="toggle password visibility"
                                onClick={() => setShowPassword(!showPassword)}
                                edge="end"
                            >
                                {showPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                        </InputAdornment>
                    ),
                }}
            />

            <TextField
                margin="normal"
                required
                fullWidth
                name="confirmPassword"
                label="Confirmar Contraseña"
                type={showPassword ? 'text' : 'password'}
                id="confirm-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
                error={confirmPassword !== '' && !passwordsMatch}
                helperText={confirmPassword !== '' && !passwordsMatch ? "Las contraseñas no coinciden" : ""}
                InputProps={{
                    startAdornment: <LockReset sx={{ color: 'action.active', mr: 1 }} />,
                }}
            />

            {/* Password Rules Checklist */}
            <Box sx={{ mt: 2, p: 2, bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)', borderRadius: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                    Requisitos de seguridad:
                </Typography>
                <List dense disablePadding>
                    {passwordRules.map((rule, index) => {
                        const isMet = rule.test(password);
                        return (
                            <ListItem key={index} disablePadding sx={{ py: 0.25 }}>
                                <ListItemIcon sx={{ minWidth: 30 }}>
                                    {isMet ?
                                        <CheckCircle sx={{ fontSize: 18, color: 'success.main' }} /> :
                                        <Cancel sx={{ fontSize: 18, color: 'text.disabled' }} />
                                    }
                                </ListItemIcon>
                                <ListItemText
                                    primary={rule.label}
                                    primaryTypographyProps={{
                                        variant: 'body2',
                                        color: isMet ? 'text.primary' : 'text.secondary'
                                    }}
                                />
                            </ListItem>
                        );
                    })}
                </List>
            </Box>

            <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading || !allRulesMet || !passwordsMatch}
                sx={{
                    mt: 4,
                    py: 1.5,
                    fontWeight: 600,
                    borderRadius: 2,
                    textTransform: 'none',
                    fontSize: '1rem',
                }}
            >
                {loading ? <CircularProgress size={26} color="inherit" /> : 'Actualizar contraseña'}
            </Button>
        </Box>
    );
}
