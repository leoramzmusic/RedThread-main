import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import React, { useState } from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  Paper, 
  Grid, 
  TextField, 
  Button, 
  MenuItem,
  Alert,
  Snackbar,
  CircularProgress
} from '@mui/material';
import { 
  Email as EmailIcon, 
  LocationOn as LocationIcon, 
  AccessTime as AccessTimeIcon,
  Send as SendIcon
} from '@mui/icons-material';
import { useTranslation } from 'next-i18next';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import apiClient from '../../services/api';
import Layout from '../../components/layout/Layout';

export default function ContactPage() {
  const { t } = useTranslation('common');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const formik = useFormik({
    initialValues: {
      name: '',
      email: '',
      category: 'general',
      message: '',
    },
    validationSchema: Yup.object({
      name: Yup.string().required(t('validation.required', 'Requerido')),
      email: Yup.string().email(t('validation.email', 'Email inválido')).required(t('validation.required', 'Requerido')),
      category: Yup.string().required(t('validation.required', 'Requerido')),
      message: Yup.string().min(10, t('validation.minLength', 'Mínimo 10 caracteres')).required(t('validation.required', 'Requerido')),
    }),
    onSubmit: async (values, { setSubmitting, resetForm }) => {
      try {
        await apiClient.post('/help/contact', values);
        setSnackbar({
          open: true,
          message: t('contact.success', 'Mensaje enviado correctamente. Te responderemos pronto.'),
          severity: 'success'
        });
        resetForm();
      } catch (err) {
        console.error('Error sending message:', err);
        setSnackbar({
          open: true,
          message: t('contact.error', 'Error al enviar el mensaje. Por favor intenta de nuevo.'),
          severity: 'error'
        });
      } finally {
        setSubmitting(false);
      }
    },
  });

  const categories = [
    { value: 'general', label: t('contact.cat.general', 'Consulta General') },
    { value: 'account', label: t('contact.cat.account', 'Problema de Cuenta') },
    { value: 'billing', label: t('contact.cat.billing', 'Facturación y Pagos') },
    { value: 'technical', label: t('contact.cat.technical', 'Problema Técnico') },
    { value: 'safety', label: t('contact.cat.safety', 'Seguridad y Reportes') },
    { value: 'partnership', label: t('contact.cat.partnership', 'Alianzas y Prensa') },
  ];

  return (
    <Layout>
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Grid container spacing={6}>
          {/* Contact Info */}
          <Grid item xs={12} md={5}>
            <Typography variant="h3" component="h1" fontWeight={700} gutterBottom>
              {t('contact.title', 'Contáctanos')}
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph sx={{ mb: 4 }}>
              {t('contact.subtitle', 'Estamos aquí para ayudarte. Envíanos un mensaje y te responderemos lo antes posible.')}
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, mt: 4 }}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Paper elevation={0} sx={{ p: 1.5, bgcolor: 'primary.light', color: 'primary.main', borderRadius: 2, height: 'fit-content' }}>
                  <EmailIcon />
                </Paper>
                <Box>
                  <Typography variant="subtitle1" fontWeight={600}>
                    {t('contact.email', 'Email')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    support@redthread.app
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    partners@redthread.app
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', gap: 2 }}>
                <Paper elevation={0} sx={{ p: 1.5, bgcolor: 'primary.light', color: 'primary.main', borderRadius: 2, height: 'fit-content' }}>
                  <LocationIcon />
                </Paper>
                <Box>
                  <Typography variant="subtitle1" fontWeight={600}>
                    {t('contact.location', 'Ubicación')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Ciudad de México, México
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', gap: 2 }}>
                <Paper elevation={0} sx={{ p: 1.5, bgcolor: 'primary.light', color: 'primary.main', borderRadius: 2, height: 'fit-content' }}>
                  <AccessTimeIcon />
                </Paper>
                <Box>
                  <Typography variant="subtitle1" fontWeight={600}>
                    {t('contact.hours', 'Horario de Atención')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Lunes - Viernes: 9:00 AM - 6:00 PM (CST)
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Grid>

          {/* Contact Form */}
          <Grid item xs={12} md={7}>
            <Paper elevation={3} sx={{ p: { xs: 3, md: 5 }, borderRadius: 3 }}>
              <Typography variant="h5" gutterBottom fontWeight={600} sx={{ mb: 3 }}>
                {t('contact.formTitle', 'Envíanos un mensaje')}
              </Typography>
              
              <form onSubmit={formik.handleSubmit}>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      id="name"
                      name="name"
                      label={t('contact.name', 'Nombre')}
                      value={formik.values.name}
                      onChange={formik.handleChange}
                      error={formik.touched.name && Boolean(formik.errors.name)}
                      helperText={formik.touched.name && formik.errors.name}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      id="email"
                      name="email"
                      label={t('contact.email', 'Email')}
                      value={formik.values.email}
                      onChange={formik.handleChange}
                      error={formik.touched.email && Boolean(formik.errors.email)}
                      helperText={formik.touched.email && formik.errors.email}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      select
                      id="category"
                      name="category"
                      label={t('contact.category', 'Asunto')}
                      value={formik.values.category}
                      onChange={formik.handleChange}
                      error={formik.touched.category && Boolean(formik.errors.category)}
                      helperText={formik.touched.category && formik.errors.category}
                    >
                      {categories.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      rows={4}
                      id="message"
                      name="message"
                      label={t('contact.message', 'Mensaje')}
                      value={formik.values.message}
                      onChange={formik.handleChange}
                      error={formik.touched.message && Boolean(formik.errors.message)}
                      helperText={formik.touched.message && formik.errors.message}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Button
                      color="primary"
                      variant="contained"
                      fullWidth
                      size="large"
                      type="submit"
                      disabled={formik.isSubmitting}
                      startIcon={formik.isSubmitting ? <CircularProgress size={20} /> : <SendIcon />}
                      sx={{ py: 1.5 }}
                    >
                      {t('contact.send', 'Enviar Mensaje')}
                    </Button>
                  </Grid>
                </Grid>
              </form>
            </Paper>
          </Grid>
        </Grid>
      </Container>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity} 
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Layout>
  );
}


export async function getStaticProps({ locale }: { locale: string }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'])),
    },
  };
}
