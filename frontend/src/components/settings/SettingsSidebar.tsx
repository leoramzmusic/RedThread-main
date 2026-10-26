import { useState } from "react";
import Link from "next/link";
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
} from "@mui/material";
import {
  Palette as PaletteIcon,
  Security as SecurityIcon,
  Notifications as NotificationsIcon,
  Lock as LockIcon,
  Accessibility as AccessibilityIcon,
  Tune as TuneIcon,
  Language as LanguageIcon,
} from "@mui/icons-material";
import { useTranslation } from "next-i18next/pages";

interface SettingsSection {
  id: string;
  label: string;
  icon: React.ReactElement;
  path: string;
}

export default function SettingsSidebar() {
  const { t } = useTranslation("common");

  const sections: SettingsSection[] = [
    {
      id: "appearance",
      label: t("settings.appearance", "Apariencia"),
      icon: <PaletteIcon />,
      path: "/settings",
    },
    {
      id: "notifications",
      label: t("settings.notifications", "Notificaciones"),
      icon: <NotificationsIcon />,
      path: "/settings?section=notifications",
    },
    {
      id: "security",
      label: t("settings.security", "Seguridad"),
      icon: <SecurityIcon />,
      path: "/settings?section=security",
    },
    {
      id: "accessibility",
      label: t("settings.accessibility", "Accesibilidad"),
      icon: <AccessibilityIcon />,
      path: "/settings?section=accessibility",
    },
    {
      id: "privacy",
      label: t("settings.privacy", "Privacidad"),
      icon: <LockIcon />,
      path: "/settings?section=privacy",
    },
    {
      id: "advanced",
      label: t("settings.advanced", "Avanzado"),
      icon: <TuneIcon />,
      path: "/settings?section=advanced",
    },
    {
      id: "localization",
      label: t("settings.language", "Idioma"),
      icon: <LanguageIcon />,
      path: "/settings?section=localization",
    },
  ];

  return (
    <Box
      sx={{
        width: 280,
        flexShrink: 0,
        borderRight: "1px solid",
        borderColor: "divider",
        height: "100%",
        overflowY: "auto",
      }}
    >
      <Box
        sx={{
          p: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 1,
          minHeight: 60,
        }}
      >
        <Typography
          variant="h6"
          sx={{
            fontWeight: 700,
            letterSpacing: "0.5px",
            color: "text.primary",
          }}
        >
          Configuración
        </Typography>
      </Box>
      <Divider sx={{ mb: 1, ml: -1, mr: -1 }} />
      <List disablePadding>
        {sections.map((section) => {
          const active = window.location.pathname.includes(section.path);
          return (
            <ListItem key={section.id} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                selected={active}
                component={Link}
                href={section.path}
                sx={{
                  borderRadius: "10px",
                  justifyContent: "flex-start",
                  px: 2,
                  py: 1,
                  minHeight: 44,
                  transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                  "&:hover": {
                    bgcolor: "rgba(255,255,255,0.08)",
                  },
                  "&.Mui-selected": {
                    bgcolor: "rgba(230,57,70,0.08)",
                    color: "primary.main",
                    "&:hover": {
                      bgcolor: "rgba(230,57,70,0.12)",
                    },
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 36,
                    color: "text.secondary",
                  }}
                >
                  {section.icon}
                </ListItemIcon>
                <ListItemText
                  primary={section.label}
                  slotProps={{
                    primary: {
                      sx: {
                        fontSize: "0.88rem",
                        fontWeight: active ? 700 : 500,
                        color: active ? "primary.main" : "text.secondary",
                      },
                    },
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </Box>
  );
}
