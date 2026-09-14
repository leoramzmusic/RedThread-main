import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Button,
  TextField,
  Typography,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import adminApiClient from '../../../services/adminApi';
import { setAdminCredentials } from '../../../store/slices/adminAuthSlice';
import { RootState } from '../../../store/store';
import AuthLayout from '../../../components/auth/AuthLayout';
import { AUTH_INPUT_SX, SUBMIT_BTN_SX } from '../../../components/auth/authInputStyles';

export default function AdminLogin() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state: RootState) => state.adminAuth);

  const [authSuccess, setAuthSuccess] = useState(false);
  const successTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (successTimer.current) clearTimeout(successTimer.current);
    };
  }, []);

  useEffect(() => {
    if (isAuthenticated && !authSuccess) {
      router.replace('/portal-redthread');
    }
  }, [isAuthenticated, router, authSuccess]);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Login to admin auth endpoint
      const response = await adminApiClient.post('/portal-redthread/auth/login', {
        email: formData.email,
        password: formData.password,
      });

      const { employee } = response.data;

      // Dispatch to Admin Redux Slice (session tokens live in HttpOnly cookies)
      dispatch(setAdminCredentials({
        user: {
          id: employee.id,
          email: employee.email,
          first_name: employee.first_name,
          last_name: employee.last_name,
          role: employee.roles?.[0] ?? '',
          avatar: employee.avatar,
        },
      }));

      // Brief success glow, then redirect to Admin Portal
      setAuthSuccess(true);
      successTimer.current = setTimeout(() => {
        router.push('/portal-redthread');
      }, 800);
    } catch (err: any) {
      console.error('Admin login error:', err);

      // Provide specific error messages
      if (err.response?.status === 401) {
        setError('Credenciales incorrectas. Verifica tu email y contraseña.');
      } else if (err.response?.status === 500) {
        setError('Error del servidor. Por favor, contacta al administrador del sistema.');
      } else {
        setError(err.response?.data?.detail || 'Error de conexión. Verifica tu red e intenta nuevamente.');
      }
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Red Thread Admin"
      subtitle="Portal de Administración"
      authSuccess={authSuccess}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {error && (
          <Alert
            severity="error"
            sx={{
              mb: 3,
              width: '100%',
              color: '#FFFFFF',
              bgcolor: 'rgba(229, 57, 53, 0.22)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255, 138, 128, 0.45)',
              '& .MuiAlert-icon': { color: '#FF8A80' },
            }}
          >
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit} style={{ width: '100%' }}>
          <TextField
            fullWidth
            label="Email Administrativo"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            margin="normal"
            required
            autoFocus
            variant="standard"
            sx={AUTH_INPUT_SX}
          />
          <TextField
            fullWidth
            label="Contraseña"
            name="password"
            type={showPassword ? 'text' : 'password'}
            value={formData.password}
            onChange={handleChange}
            margin="normal"
            required
            variant="standard"
            sx={AUTH_INPUT_SX}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    sx={{ color: 'rgba(255,255,255,0.7)' }}
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <Button
            fullWidth
            type="submit"
            variant="contained"
            size="large"
            disabled={loading || authSuccess}
            sx={SUBMIT_BTN_SX}
          >
            {loading || authSuccess ? <CircularProgress size={24} color="inherit" /> : 'Acceder al Portal'}
          </Button>
        </form>

        <Typography
          variant="caption"
          sx={{ color: 'rgba(255,255,255,0.55)', letterSpacing: '0.5px', mt: 1 }}
        >
          Acceso exclusivo para administradores de RedThread
        </Typography>
      </Box>
    </AuthLayout>
  );
}