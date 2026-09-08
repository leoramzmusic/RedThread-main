import React from 'react';
import { Box, Container, Typography, Button, Paper } from '@mui/material';
import { useRouter } from 'next/router';
import { Home as HomeIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { useTranslation } from 'next-i18next';

export default function Custom404() {
  const router = useRouter();
  const { t } = useTranslation('common');

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        p: 2,
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={10}
          sx={{
            p: 6,
            textAlign: 'center',
            borderRadius: 4,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
          }}
        >
          {/* Red Thread Logo/Icon */}
          <Box sx={{ mb: 3 }}>
            <Typography
              variant="h1"
              sx={{
                fontSize: '120px',
                fontWeight: 700,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 2,
              }}
            >
              404
            </Typography>
            <Typography
              variant="h3"
              gutterBottom
              sx={{
                fontWeight: 700,
                color: 'text.primary',
                mb: 2,
              }}
            >
              Red Thread
            </Typography>
          </Box>

          {/* Error Message */}
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, color: 'text.secondary', mb: 1 }}>
            {t('404.title', 'Página no encontrada')}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            {t('404.message', 'Lo sentimos, la página que buscas no existe o ha sido movida.')}
          </Typography>

          {/* Red Thread Symbol */}
          <Box sx={{ mb: 4, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <Box
              sx={{
                width: 100,
                height: 4,
                background: 'linear-gradient(90deg, #667eea 0%, #E91E63 50%, #764ba2 100%)',
                borderRadius: 2,
                position: 'relative',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  background: '#E91E63',
                  boxShadow: '0 0 20px rgba(233, 30, 99, 0.6)',
                },
              }}
            />
          </Box>

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              size="large"
              startIcon={<HomeIcon />}
              onClick={() => router.push('/home')}
              sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                px: 4,
                py: 1.5,
                borderRadius: 3,
                textTransform: 'none',
                fontSize: '1rem',
                fontWeight: 600,
                boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                  boxShadow: '0 6px 20px rgba(102, 126, 234, 0.6)',
                },
              }}
            >
              {t('404.goHome', 'Ir al Inicio')}
            </Button>
            <Button
              variant="outlined"
              size="large"
              startIcon={<ArrowBackIcon />}
              onClick={() => router.back()}
              sx={{
                borderColor: '#667eea',
                color: '#667eea',
                px: 4,
                py: 1.5,
                borderRadius: 3,
                textTransform: 'none',
                fontSize: '1rem',
                fontWeight: 600,
                borderWidth: 2,
                '&:hover': {
                  borderColor: '#764ba2',
                  color: '#764ba2',
                  borderWidth: 2,
                  background: 'rgba(102, 126, 234, 0.05)',
                },
              }}
            >
              {t('404.goBack', 'Volver')}
            </Button>
          </Box>

          {/* Help Text */}
          <Typography variant="body2" color="text.secondary" sx={{ mt: 4 }}>
            {t('404.help', '¿Necesitas ayuda?')}{' '}
            <Typography
              component="span"
              sx={{
                color: '#667eea',
                fontWeight: 600,
                cursor: 'pointer',
                '&:hover': { textDecoration: 'underline' },
              }}
              onClick={() => router.push('/help/contact')}
            >
              {t('404.contact', 'Contáctanos')}
            </Typography>
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
}
