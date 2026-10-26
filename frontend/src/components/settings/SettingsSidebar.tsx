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
  Collapse,
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
  subItems?: SettingsSection[];
}

export default function SettingsSidebar() {
  const { t } = useTranslation("common");

  const sections: SettingsSection[] = [
    {
      id: "appearance",
      label: t("settings.appearance", "Apariencia"),
      icon: <PaletteIcon />,
      path: "/settings?section=appearance",
    },
    {
      id: "customize-navbar",
      label: t("settings.customize-navbar", "Customize Navbar"),
      icon: <TuneIcon />,
      path: "/settings?section=navbar",
    },
    {
      id: "notifications",
      label: t("settings.notifications", "Notificaciones"),
      icon: <NotificationsIcon />,
      path: "/settings?section=notifications",
    },
    {
      id: "accessibility",
      label: t("settings.accessibility", "Accesibilidad"),
      icon: <AccessibilityIcon />,
      path: "/settings?section=accessibility",
    },
    {
      id: "localization",
      label: t("settings.language", "Idioma"),
      icon: <LanguageIcon />,
      path: "/settings?section=localization",
    },
    {
      id: "privacy",
      label: t("settings.privacy", "Privacidad"),
      icon: <LockIcon />,
      path: "/settings?section=privacy",
    },
    {
      id: "security",
      label: t("settings.security", "Seguridad"),
      icon: <SecurityIcon />,
      path: "/settings?section=security",
    },
    {
      id: "advanced",
      label: t("settings.advanced", "Avanzado"),
      icon: <TuneIcon />,
      path: "/settings?section=advanced",
    },
  ];

  return (
    <Box
      sx={{
        width: 260,
        flexShrink: 0,
        borderRight: "1px solid",
        borderColor: "divider",
        height: "100%",
        overflowY: "auto",
      }}
    >
      <List disablePadding>
        {sections.map((section) => {
          const active = window.location.pathname.includes(section.path);
          return (
            <ListItem key={section.id} disablePadding sx={{ mb: 0.4 }}>
              <ListItemButton
                selected={active}
                component={Link}
                href={section.path}
                sx={{
                  borderRadius: "8px",
                  justifyContent: "flex-start",
                  px: 1,
                  py: 0.75,
                  minHeight: 36,
                  transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                  "&:hover": {
                    bgcolor: "rgba(255,255,255,0.06)",
                  },
                  "&.Mui-selected": {
                    bgcolor: "rgba(230,57,70,0.06)",
                    color: "primary.main",
                    "&:hover": {
                      bgcolor: "rgba(230,57,70,0.1)",
                    },
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 32,
                    color: "text.secondary",
                    fontSize: "0.875rem",
                  }}
                >
                  {section.icon}
                </ListItemIcon>
                <ListItemText
                  primary={section.label}
                  slotProps={{
                    primary: {
                      sx: {
                        fontSize: "0.78rem",
                        fontWeight: active ? 600 : 450,
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
