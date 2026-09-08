import { useState } from 'react';
import {
    Box,
    Typography,
    TextField,
    Button,
    Alert,
    CircularProgress,
    Fade,
    Link as MuiLink
} from '@mui/material';
import Link from 'next/link';
import apiClient from '../../services/api';
import EmailIcon from '@mui/icons-material/Email';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

export default function ForgotPasswordForm() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            await apiClient.post('/auth/recover-password', { email });
            setSuccess(true);
        } catch (err: any) {
            console.error('Password recovery error:', err);
            const detail = err.response?.data?.detail;
            const message = typeof detail === 'string' ? detail :
                (Array.isArray(detail) ? detail[0]?.msg :
                    (detail?.message || err.message || 'Algo salió mal. Por favor intenta de nuevo.'));
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <Fade in={true}>
                <Box sx={{ textAlign: 'center', py: 2 }}>
                    <CheckCircleOutlineIcon sx={{ fontSize: 60, color: 'success.main', mb: 2 }} />
                    <Typography variant="h5" gutterBottom sx={{ fontWeight: 700 }}>
                        Revisa tu bandeja de entrada
                    </Typography>
                    <Typography color="text.secondary" paragraph>
                        Si el correo <strong>{email}</strong> está registrado, recibirás un enlace para restablecer tu contraseña en unos momentos.
                    </Typography>
                    <Box sx={{ mt: 4 }}>
                        <Link href="/auth" passHref>
                            <Button
                                variant="outlined"
                                startIcon={<ArrowBackIcon />}
                                fullWidth
                            >
                                Volver al inicio de sesión
                            </Button>
                        </Link>
                    </Box>
                </Box>
            </Fade>
        );
    }

    return (
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
            <Typography variant="body1" color="text.secondary" paragraph sx={{ mb: 3 }}>
                Ingresa tu correo electrónico para recibir instrucciones para recuperar tu cuenta.
            </Typography>

            {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}

            <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="Correo Electrónico"
                name="email"
                autoComplete="email"
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                InputProps={{
                    startAdornment: <EmailIcon sx={{ color: 'action.active', mr: 1 }} />,
                }}
                helperText="Usa el correo con el que te registraste"
                sx={{ mb: 3 }}
            />

            <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)}
                sx={{
                    py: 1.5,
                    fontWeight: 600,
                    borderRadius: 2,
                    textTransform: 'none',
                    fontSize: '1rem',
                    mb: 3
                }}
            >
                {loading ? <CircularProgress size={26} color="inherit" /> : 'Enviar instrucciones'}
            </Button>

            <Box sx={{ textAlign: 'center' }}>
                <Link href="/auth" passHref>
                    <MuiLink
                        variant="body2"
                        sx={{
                            color: 'primary.main',
                            textDecoration: 'none',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            '&:hover': { textDecoration: 'underline' }
                        }}
                    >
                        <ArrowBackIcon sx={{ fontSize: 18, mr: 0.5 }} />
                        Volver al inicio de sesión
                    </MuiLink>
                </Link>
            </Box>
        </Box>
    );
}
