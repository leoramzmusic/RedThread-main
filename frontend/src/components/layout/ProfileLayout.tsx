import { ReactNode, useState } from "react";
import { useRouter } from "next/router";
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  useTheme,
  useMediaQuery,
  Divider,
  Tooltip,
} from "@mui/material";
import {
  Settings as SettingsIcon,
  Security as SecurityIcon,
  Notifications as NotificationsIcon,
  Lock as LockIcon,
  Logout as LogoutIcon,
  Tune as TuneIcon,
  Home as HomeIcon,
  Explore as ExploreIcon,
  Event as EventIcon,
  Assignment as AssignmentIcon,
} from "@mui/icons-material";
import { useTranslation } from "next-i18next/pages";
import { alpha } from "@mui/material/styles";
import { useAppTheme } from "../../context/ThemeContext";
import MorphToggleIcon from "../motion/MorphToggleIcon";
import NavLink from "./NavLink";

const DRAWER_WIDTH = 260;
const DRAWER_WIDTH_COLLAPSED = 72;

interface ProfileLayoutProps {
  children: ReactNode;
}

interface ProfileMenuItem {
  id: string;
  label: string;
  icon: React.ReactElement;
  path: string;
}

export default function ProfileLayout({ children }: ProfileLayoutProps) {
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const { t } = useTranslation("common");
  const { fontSize } = useAppTheme();
  const [collapsed, setCollapsed] = useState(false);

  const currentFontSize = parseInt(fontSize) || 14;
  const sidebarFontSize = currentFontSize >= 24 ? 24 : currentFontSize;

  const menuItems: ProfileMenuItem[] = [
    {
      id: "appearance",
      label: t("menu_appearance", "Apariencia"),
      icon: (
        <SettingsIcon
          className="rt-profile-settings"
          sx={{
            transition: "transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)",
          }}
        />
      ),
      path: "/settings",
    },
    {
      id: "navbar",
      label: t("menu_navbar", "Personalizar Navbar"),
      icon: <TuneIcon className="rt-profile-sliders" />,
      path: "/settings?section=navbar",
    },
    {
      id: "security",
      label: t("menu_security", "Seguridad"),
      icon: <SecurityIcon className="rt-profile-shield" />,
      path: "/settings?section=security",
    },
    {
      id: "notifications",
      label: t("menu_notifications", "Notificaciones"),
      icon: <NotificationsIcon className="rt-profile-bell" />,
      path: "/settings?section=notifications",
    },
    {
      id: "privacy",
      label: t("menu_privacy", "Privacidad"),
      icon: <LockIcon className="rt-profile-lock" />,
      path: "/settings?section=privacy",
    },
  ];

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  const handleToggleCollapse = () => {
    setCollapsed(!collapsed);
  };

  const drawerWidth = collapsed ? DRAWER_WIDTH_COLLAPSED : DRAWER_WIDTH;

  const isDark = theme.palette.mode === "dark";
  const primary = theme.palette.primary.main;
  const textActive = isDark ? "rgba(255,255,255,0.92)" : "rgba(0,0,0,0.87)";
  const textInactive = isDark ? "rgba(255,255,255,0.65)" : "rgba(0,0,0,0.6)";
  const textSection = isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.45)";
  const iconInactive = isDark ? "rgba(255,255,255,0.65)" : "rgba(0,0,0,0.55)";
  const dividerColor = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)";

  const isActive = (item: ProfileMenuItem) => {
    if (item.id === "appearance") {
      return (
        router.asPath === "/settings" ||
        router.asPath.includes("section=appearance")
      );
    }
    return router.asPath === item.path;
  };

  let navIndex = 0;

  const drawerContent = (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Header */}
      <Box
        sx={{
          p: 2,
          display: "flex",
          flexDirection: collapsed ? "column" : "row",
          alignItems: "center",
          justifyContent: collapsed ? "center" : "flex-start",
          gap: collapsed ? 1 : 2,
          minHeight: collapsed ? 100 : 80,
          bgcolor: "transparent",
        }}
      >
        <MorphToggleIcon
          open={collapsed}
          label={t("menu_toggleSidebar")}
          onClick={handleToggleCollapse}
          sx={{ p: 1, color: "primary.main" }}
        />
        <Box
          onClick={() => router.push("/home")}
          sx={{
            position: "relative",
            overflow: "hidden",
            cursor: "pointer",
            userSelect: "none",
            display: collapsed ? "none" : "inline-flex",
          }}
        >
          <Typography
            component="span"
            sx={{
              display: "inline-flex",
              gap: "1px",
              whiteSpace: "nowrap",
              fontWeight: 700,
              fontSize: "24px",
              letterSpacing: "0.5px",
            }}
          >
            <Box component="span" sx={{ color: "primary.main" }}>
              RE
            </Box>
            <Box component="span" sx={{ color: "text.secondary" }}>
              D
            </Box>
            <Box component="span" sx={{ color: "primary.main" }}>
              TH
            </Box>
            <Box component="span" sx={{ color: "text.secondary" }}>
              READ
            </Box>
          </Typography>
        </Box>
      </Box>

      <Box
        sx={{
          overflowY: "auto",
          overflowX: "hidden",
          px: 1.5,
          flexGrow: 1,
        }}
      >
        {!collapsed && (
          <Typography
            variant="caption"
            sx={{
              px: 2,
              py: 1,
              display: "block",
              color: textSection,
              fontWeight: 700,
              letterSpacing: "1px",
              textTransform: "uppercase",
              fontSize: "0.7rem",
            }}
          >
            {t("menu_settings")}
          </Typography>
        )}

        <List disablePadding>
          {menuItems.map((item) => {
            const active = isActive(item);
            const delay = `${Math.min(navIndex * 45, 540)}ms`;
            navIndex += 1;

            return (
              <ListItem key={item.id} disablePadding sx={{ mb: 0.5 }}>
                <Tooltip title={collapsed ? item.label : ""} placement="right">
                  <ListItemButton
                    selected={active}
                    onClick={() => handleNavigation(item.path)}
                    sx={{
                      borderRadius: "10px",
                      justifyContent: collapsed ? "center" : "flex-start",
                      px: collapsed ? 0 : 2,
                      minHeight: 44,
                      transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                      animation: `rtPItemIn 0.45s cubic-bezier(0.22, 1, 0.36, 1) both ${delay}`,
                      "&:hover": {
                        bgcolor: alpha(primary, isDark ? 0.1 : 0.06),
                        "& .MuiListItemIcon-root": {
                          color: primary,
                          transform: "scale(1.1)",
                        },
                        "& .MuiListItemText-primary": {
                          color: isDark ? textActive : primary,
                          textShadow: isDark
                            ? `0 0 10px ${alpha(primary, 0.65)}`
                            : "none",
                        },
                      },
                      "&.Mui-selected": {
                        bgcolor: alpha(primary, isDark ? 0.04 : 0.03),
                        backgroundImage: "none",
                        "&::before": { content: "none" },
                      },
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        minWidth: collapsed ? "auto" : 36,
                        color: active ? primary : iconInactive,
                        justifyContent: "center",
                        transition: "all 0.2s ease",
                      }}
                    >
                      {item.icon}
                    </ListItemIcon>
                    {!collapsed && (
                      <ListItemText
                        primary={item.label}
                        slotProps={{
                          primary: {
                            sx: {
                              fontSize: "0.88rem",
                              fontWeight: active ? 600 : 500,
                              color: active ? textActive : textInactive,
                              transition: "color 0.2s ease",
                            },
                          },
                        }}
                      />
                    )}
                  </ListItemButton>
                </Tooltip>
              </ListItem>
            );
          })}
        </List>
      </Box>

      <Box sx={{ p: 2 }}>
        <Divider
          sx={{
            mb: 2,
            ml: -3.5,
            mr: -3.5,
            borderColor: dividerColor,
            opacity: 0.6,
          }}
        />
        <ListItem disablePadding>
          <Tooltip
            title={collapsed ? t("menu_logout", "Cerrar Sesión") : ""}
            placement="right"
          >
            <ListItemButton
              onClick={() => {
                localStorage.removeItem("token");
                router.push("/auth/login");
              }}
              sx={{
                borderRadius: "10px",
                justifyContent: collapsed ? "center" : "flex-start",
                px: collapsed ? 0 : 2,
                minHeight: 44,
                bgcolor: "#ff4d4f",
                color: "white",
                boxShadow: "0 4px 14px rgba(255, 77, 79, 0.35)",
                transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                "&:hover": {
                  bgcolor: "#d9363e",
                  boxShadow: "0 6px 18px rgba(255, 77, 79, 0.5)",
                  "& .MuiListItemIcon-root": { transform: "scale(1.1)" },
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: collapsed ? "auto" : 36,
                  color: "inherit",
                  justifyContent: "center",
                }}
              >
                <LogoutIcon className="rt-profile-exit" />
              </ListItemIcon>
              {!collapsed && (
                <ListItemText
                  primary={t("menu_logout", "Cerrar Sesión")}
                  slotProps={{
                    primary: {
                      sx: {
                        fontSize: "0.88rem",
                        fontWeight: 600,
                        color: "inherit",
                      },
                    },
                  }}
                />
              )}
            </ListItemButton>
          </Tooltip>
        </ListItem>
      </Box>
    </Box>
  );

  const navLinks = [
    {
      id: "home",
      label: t("nav.home", "Inicio"),
      path: "/home",
      icon: <HomeIcon className="rt-dash" />,
    },
    {
      id: "discover",
      label: t("nav.discover", "Descubrir"),
      path: "/discover",
      icon: <ExploreIcon className="rt-compass" />,
    },
    {
      id: "events",
      label: t("nav.events", "Eventos"),
      path: "/events",
      icon: <EventIcon className="rt-flip" />,
    },
    {
      id: "plans",
      label: t("nav.plans", "Planes"),
      path: "/plans",
      icon: <AssignmentIcon className="rt-gem" />,
    },
  ];

  return (
    <Box
      className="reth-canvas-root"
      sx={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        position: "relative",
      }}
    >
      {/* Navbar */}
      <Box
        sx={{
          width: "100%",
          px: { xs: 1.5, sm: 2 },
          py: 1,
          zIndex: 1200,
          flexShrink: 0,
        }}
      >
        <Box sx={{ display: "flex", width: "100%", gap: "4px", minWidth: 0 }}>
          {navLinks.map((link) => (
            <NavLink
              key={link.path}
              label={link.label}
              active={router.pathname === link.path}
              onClick={() => router.push(link.path)}
              icon={link.icon}
            />
          ))}
        </Box>
      </Box>

      {/* Cuerpo */}
      <Box sx={{ flexGrow: 1, minHeight: 0, position: "relative" }}>
        {!isMobile && (
          <Drawer
            variant="permanent"
            sx={{
              width: drawerWidth,
              flexShrink: 0,
              "& .MuiDrawer-paper": {
                width: drawerWidth,
                boxSizing: "border-box",
                borderRight: "none",
                transition:
                  "width 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease",
                overflowX: "hidden",
                bgcolor: "transparent",
                border: "none",
                boxShadow: "none",
                color: textActive,
                animation:
                  "rtPDrawerIn 0.45s cubic-bezier(0.22, 1, 0.36, 1) both",
                "--app-font-size": `${sidebarFontSize}px`,
              },
            }}
          >
            {drawerContent}
          </Drawer>
        )}

        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 3,
            width: { md: `calc(100% - ${drawerWidth}px)` },
            bgcolor: "transparent",
            minHeight: 0,
          }}
        >
          {children}
        </Box>
      </Box>

      {/* Footer */}
      <Box
        sx={{
          width: "100%",
          px: { xs: 1.5, sm: 2 },
          py: 2,
          borderTop: "1px solid",
          borderColor: dividerColor,
          bgcolor: "transparent",
          flexShrink: 0,
        }}
      >
        <Typography
          variant="caption"
          sx={{ color: textInactive, textAlign: "center", fontSize: "0.75rem" }}
        >
          © 2026 RETH. All rights reserved.
        </Typography>
      </Box>
    </Box>
  );
}
