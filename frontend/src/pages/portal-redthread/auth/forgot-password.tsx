import { useState } from 'react';
import { useRouter } from 'next/router';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Alert,
  CircularProgress,
} from '@mui/material';
import { AdminPanelSettings, ArrowBack } from '@mui/icons-material';
import Link from 'next/link';

export default function AdminForgotPassword() {
  const router = useRouter();
  
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      // TODO: Implement forgot password endpoint
      // const response = await apiClient.post('/portal-redthread/auth/forgot-password', { email });
      
      // For now, show success message
      setSuccess(true);
    } catch (err: any) {
      console.error('Forgot password error:', err);
      setError(err.response?.data?.detail || 'Failed to send reset email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        bgcolor: '#1a1a1a',
      }}
    >
      <Paper
        elevation={6}
        sx={{
          p: 5,
          width: '100%',
          maxWidth: 400,
          borderRadius: 3,
          bgcolor: 'background.paper',
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
          <AdminPanelSettings sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
          <Typography variant="h5" align="center" fontWeight={700} color="text.primary">
            Recuperar Contraseña
          </Typography>
          <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1 }}>
            Portal de Administración
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {success ? (
          <Box>
            <Alert severity="success" sx={{ mb: 3 }}>
              Se ha enviado un enlace de recuperación a tu correo electrónico.
            </Alert>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => router.push('/portal-redthread/auth/login')}
              sx={{ mt: 2 }}
            >
              Volver al Login
            </Button>
          </Box>
        ) : (
          <form onSubmit={handleSubmit}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Ingresa tu correo electrónico administrativo y te enviaremos instrucciones para restablecer tu contraseña.
            </Typography>

            <TextField
              fullWidth
              label="Email Administrativo"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              margin="normal"
              required
              autoFocus
              variant="outlined"
            />

            <Button
              fullWidth
              type="submit"
              variant="contained"
              size="large"
              disabled={loading}
              sx={{ mt: 4, mb: 2, height: 48, fontWeight: 'bold' }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Enviar Enlace'}
            </Button>

            <Link href="/portal-redthread/auth/login" passHref>
              <Button
                fullWidth
                variant="text"
                startIcon={<ArrowBack />}
                sx={{ mt: 1 }}
              >
                Volver al Login
              </Button>
            </Link>
          </form>
        )}
      </Paper>
    </Box>
  );
}
