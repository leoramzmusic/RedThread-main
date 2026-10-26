import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  CircularProgress,
  Alert,
} from "@mui/material";
import { Save as SaveIcon } from "@mui/icons-material";
import { useTranslation } from "next-i18next/pages";
import { serverSideTranslations } from "next-i18next/pages/serverSideTranslations";
import Layout from "../../components/layout/Layout";
import { useSettings } from "../../hooks/useSettings";
import { useAppTheme } from "../../context/ThemeContext";

// Section components
import AppearanceSection from "../../components/settings/AppearanceSection";
import NotificationsSection from "../../components/settings/NotificationsSection";
import SecuritySection from "../../components/settings/SecuritySection";
import AccessibilitySection from "../../components/settings/AccessibilitySection";
import PrivacySection from "../../components/settings/PrivacySection";
import NavbarSection from "../../components/settings/NavbarSection";
import { useNavbarContext } from "../../context/NavbarContext";
import LanguageSelector from "../../components/common/LanguageSelector";
import apiClient from "../../services/api";
import { useLanguageFallback } from "../../hooks/useLanguageFallback";
import { useSnackbar } from "notistack";

export default function SettingsPage() {
  const router = useRouter();
  const { t } = useTranslation("common");
  const { enqueueSnackbar } = useSnackbar();
  useLanguageFallback(false);
  const { section } = router.query;
  const activeSection = (section as string) || "appearance";

  const {
    settings,
    loading,
    saving,
    updateSettings,
    saveSettings,
    suspendAccount,
    deleteAccount,
  } = useSettings();
  const { mode, setMode, setTheme } = useAppTheme();
  const { refresh: refreshNavConfig } = useNavbarContext();
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
    const isEvent =
      settingsToSave && (settingsToSave.nativeEvent || settingsToSave.target);
    const data = settingsToSave && !isEvent ? settingsToSave : localSettings;

    if (data) {
      await saveSettings(data);
      refreshNavConfig();
      setShowSuccessAlert(true);
      setTimeout(() => setShowSuccessAlert(false), 3000);
    }
  };

  const getSectionTitle = () => {
    const titles: Record<string, string> = {
      appearance: t("settings_appearance_title"),
      notifications: t("settings_notifications"),
      security: t("menu_security"),
      accessibility: t("settings_accessibility"),
      privacy: t("menu_privacy"),
      localization: t("settings_language"),
      advanced: t("settings_advanced"),
      navbar: t("menu_navbar", "Personalizar Navbar"),
    };
    return titles[activeSection] || t("settings_title");
  };

  const renderSection = () => {
    if (loading) {
      return (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "400px",
          }}
        >
          <CircularProgress />
        </Box>
      );
    }

    switch (activeSection) {
      case "appearance":
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
      case "notifications":
        return (
          <NotificationsSection
            settings={localSettings}
            onSettingsChange={handleSettingsChange}
          />
        );
      case "security":
        return (
          <SecuritySection
            settings={localSettings}
            onSettingsChange={handleSettingsChange}
            onSuspend={suspendAccount}
            onDelete={deleteAccount}
            saving={saving}
          />
        );
      case "accessibility":
        return (
          <AccessibilitySection
            settings={localSettings}
            onSettingsChange={handleSettingsChange}
            onSave={handleSave}
            saving={saving}
          />
        );
      case "privacy":
        return (
          <PrivacySection
            settings={localSettings}
            onSettingsChange={handleSettingsChange}
          />
        );
      case "navbar":
        return (
          <NavbarSection
            settings={localSettings}
            onSettingsChange={handleSettingsChange}
          />
        );
      case "localization":
        return (
          <Box sx={{ py: 2 }}>
            <Typography
              variant="h6"
              gutterBottom
              sx={{
                fontWeight: 700,
              }}
            >
              {t("settings_language", "Idioma")}
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: "text.secondary",
                mb: 2,
              }}
            >
              {t(
                "settings_language_hint",
                "Cambia el idioma de la interfaz. Se guardará en tu cuenta y se sincronizará en todos tus dispositivos.",
              )}
            </Typography>
            <LanguageSelector
              showContinuityHint={false}
              onLanguageChange={async (code) => {
                try {
                  await apiClient.patch("/auth/me", {
                    preferred_language: code,
                  });
                } catch (e: any) {
                  if (e?.response?.status === 400)
                    enqueueSnackbar("Idioma no disponible", {
                      variant: "error",
                    });
                  throw e;
                }
              }}
            />
          </Box>
        );
      case "advanced":
        return (
          <Box
            sx={{
              textAlign: "center",
              py: 8,
            }}
          >
            <Typography
              variant="h6"
              gutterBottom
              sx={{
                color: "text.secondary",
              }}
            >
              {t("settings_wip_title")}
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: "text.secondary",
              }}
            >
              {t("settings_wip_desc")}
            </Typography>
          </Box>
        );
      default:
        return (
          <Box
            sx={{
              textAlign: "center",
              py: 8,
            }}
          >
            <Typography
              variant="h5"
              gutterBottom
              sx={{
                color: "text.primary",
              }}
            >
              {t("settings_welcome_title")}
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: "text.secondary",
              }}
            >
              {t("settings_welcome_desc")}
            </Typography>
          </Box>
        );
    }
  };

  return (
    <Layout>
      <Box sx={{ flexGrow: 1, minHeight: 0 }}>
        <Container maxWidth="xl">
          {showSuccessAlert && (
            <Alert
              severity="success"
              onClose={() => setShowSuccessAlert(false)}
              sx={{ mb: 3 }}
            >
              {t("settings_success")}
            </Alert>
          )}

          {/* Section Title */}
          <Typography
            variant="h3"
            gutterBottom
            sx={{
              fontWeight: 800,
              mb: 3,
            }}
          >
            {getSectionTitle()}
          </Typography>

          {/* Dynamic Section Content */}
          {renderSection()}

          {/* Save Button */}
          {!loading &&
            [
              "appearance",
              "notifications",
              "security",
              "accessibility",
              "privacy",
              "navbar",
            ].includes(activeSection) && (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "flex-end",
                  pt: 4,
                  mt: 4,
                  borderTop: "1px solid",
                  borderColor: "divider",
                }}
              >
                <Button
                  variant="contained"
                  onClick={handleSave}
                  disabled={saving}
                  startIcon={
                    saving ? <CircularProgress size={20} /> : <SaveIcon />
                  }
                  size="large"
                >
                  {saving ? t("settings_saving") : t("settings_saveChanges")}
                </Button>
              </Box>
            )}
        </Container>
      </Box>
    </Layout>
  );
}

export async function getStaticProps({ locale }: { locale: string }) {
  return {
    props: {
      ...(await serverSideTranslations(locale || "es", ["common", "security"])),
    },
  };
}
