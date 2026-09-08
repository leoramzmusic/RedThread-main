import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Save as SaveIcon,
} from '@mui/icons-material';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import ProfileLayout from '../../components/layout/ProfileLayout';
import { useSettings } from '../../hooks/useSettings';
import { useAppTheme } from '../../context/ThemeContext';

// Section components
import AppearanceSection from '../../components/settings/AppearanceSection';
import NotificationsSection from '../../components/settings/NotificationsSection';
import SecuritySection from '../../components/settings/SecuritySection';
import AccessibilitySection from '../../components/settings/AccessibilitySection';
import PrivacySection from '../../components/settings/PrivacySection';

export default function SettingsPage() {
  const router = useRouter();
  const { t } = useTranslation('common');
  const { section } = router.query;
  const activeSection = (section as string) || 'appearance';

  const { settings, loading, saving, updateSettings, saveSettings, suspendAccount, deleteAccount } = useSettings();
  const { mode, setMode, setTheme } = useAppTheme();
  const [localSettings, setLocalSettings] = useState(settings);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);

  // Sync local settings when settings change
  useEffect(() => {
    if (settings) {
      setLocalSettings(settings);
    }
  }, [settings]);

  const handleSettingsChange = (field: string, value: any) => {
    setLocalSettings((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleSave = async (settingsToSave?: any) => {
    // If called as an event handler (e.g. onClick), settingsToSave will be an event object
    // We only want to use it if it's a legitimate settings object
    const isEvent = settingsToSave && (settingsToSave.nativeEvent || settingsToSave.target);
    const data = (settingsToSave && !isEvent) ? settingsToSave : localSettings;

    if (data) {
      await saveSettings(data);
      setShowSuccessAlert(true);
      setTimeout(() => setShowSuccessAlert(false), 3000);
    }
  };

  const getSectionTitle = () => {
    const titles: Record<string, string> = {
      'appearance': t('settings_appearance_title'),
      'notifications': t('settings_notifications'),
      'security': t('menu_security'),
      'accessibility': t('settings_accessibility'),
      'privacy': t('menu_privacy'),
      'localization': t('settings_language'),
      'advanced': t('settings_advanced'),
    };
    return titles[activeSection] || t('settings_title');
  };

  const renderSection = () => {
    if (loading) {
      return (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      );
    }

    switch (activeSection) {
      case 'appearance':
        return (
          <AppearanceSection
            settings={localSettings}
            onSettingsChange={handleSettingsChange}
            onSave={handleSave}
            mode={mode}
            setMode={setMode as any}
            setTheme={setTheme as any}
          />
        );
      case 'notifications':
        return (
          <NotificationsSection
            settings={localSettings}
            onSettingsChange={handleSettingsChange}
          />
        );
      case 'security':
        return (
          <SecuritySection
            settings={localSettings}
            onSettingsChange={handleSettingsChange}
            onSuspend={suspendAccount}
            onDelete={deleteAccount}
            saving={saving}
          />
        );
      case 'accessibility':
        return (
          <AccessibilitySection
            settings={localSettings}
            onSettingsChange={handleSettingsChange}
            onSave={handleSave}
            saving={saving}
          />
        );
      case 'privacy':
        return (
          <PrivacySection
            settings={localSettings}
            onSettingsChange={handleSettingsChange}
          />
        );
      case 'localization':
      case 'advanced':
        return (
          <Box textAlign="center" py={8}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Sección en desarrollo
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Esta funcionalidad estará disponible próximamente
            </Typography>
          </Box>
        );
      default:
        return (
          <Box textAlign="center" py={8}>
            <Typography variant="h5" color="text.primary" gutterBottom>
              Bienvenido a Configuración
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Selecciona una opción del menú lateral para comenzar
            </Typography>
          </Box>
        );
    }
  };

  return (
    <ProfileLayout>
      <Container maxWidth="lg">
        {showSuccessAlert && (
          <Alert severity="success" onClose={() => setShowSuccessAlert(false)} sx={{ mb: 3 }}>
            {t('settings_success')}
          </Alert>
        )}

        {/* Main Content - NO SIDEBAR */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, md: 4 },
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
            minHeight: 600,
          }}
        >
          {/* Section Title */}
          <Typography variant="h4" fontWeight={700} gutterBottom mb={3}>
            {getSectionTitle()}
          </Typography>

          {/* Dynamic Section Content */}
          {renderSection()}

          {/* Save Button */}
          {!loading && ['appearance', 'notifications', 'security', 'accessibility', 'privacy'].includes(activeSection) && (
            <Box display="flex" justifyContent="flex-end" pt={4} mt={4} borderTop="1px solid" borderColor="divider">
              <Button
                variant="contained"
                onClick={handleSave}
                disabled={saving}
                startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
                size="large"
              >
                {saving ? t('settings_saving') : t('settings_saveChanges')}
              </Button>
            </Box>
          )}
        </Paper>
      </Container>
    </ProfileLayout>
  );
}

export async function getStaticProps({ locale }: { locale: string }) {
  return {
    props: {
      ...(await serverSideTranslations(locale || 'es', ['common', 'security'])),
    },
  };
}
