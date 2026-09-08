import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
} from '@mui/material';
import { Visibility, VisibilityOff, AdminPanelSettings } from '@mui/icons-material';
import adminApiClient from '../../../services/adminApi';
import { setAdminCredentials } from '../../../store/slices/adminAuthSlice';
import { RootState } from '../../../store/store';

export default function AdminLogin() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state: RootState) => state.adminAuth);

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/portal-redthread');
    }
  }, [isAuthenticated, router]);

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

      const { access_token, refresh_token, employee } = response.data;

      // Dispatch to Admin Redux Slice
      dispatch(setAdminCredentials({
        user: {
          id: employee.id,
          email: employee.email,
          first_name: employee.first_name,
          last_name: employee.last_name,
          role: employee.role,
          avatar: employee.avatar,
        },
        access_token,
        refresh_token,
      }));

      // Redirect to Admin Portal
      router.push('/portal-redthread');
    } catch (err: any) {
      console.error('Admin login error:', err);

      // Provide specific error messages
      if (err.response?.status === 401) {
        setError('❌ Credenciales incorrectas. Verifica tu email y contraseña.');
      } else if (err.response?.status === 500) {
        setError('⚠️ Error del servidor. Por favor, contacta al administrador del sistema.');
      } else {
        setError(err.response?.data?.detail || '⚠️ Error de conexión. Verifica tu red e intenta nuevamente.');
      }
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
        bgcolor: '#1a1a1a', // Dark background for admin feel
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
            Red Thread Admin
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Portal de Administración
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
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
            variant="outlined"
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
            variant="outlined"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
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
            disabled={loading}
            sx={{ mt: 4, mb: 2, height: 48, fontWeight: 'bold' }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Acceder al Portal'}
          </Button>
        </form>
      </Paper>
    </Box>
  );
}
