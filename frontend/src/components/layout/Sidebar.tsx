import { ReactNode, useState } from "react";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next/pages";
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Collapse,
  Divider,
  useTheme,
  useMediaQuery,
  Tooltip,
} from "@mui/material";
import {
  Dashboard as DashboardIcon,
  Explore as ExploreIcon,
  Chat as ChatIcon,
  Radar as RadarIcon,
  Casino as CasinoIcon,
  Event as EventIcon,
  Diamond as DiamondIcon,
  Person as PersonIcon,
  Settings as SettingsIcon,
  Security as SecurityIcon,
  Notifications as NotificationsIcon,
  Lock as LockIcon,
  Logout as LogoutIcon,
  Favorite as HeartIcon,
  Palette as PaletteIcon,
  Language as LanguageIcon,
  Accessibility as AccessibilityIcon,
  Tune as TuneIcon,
  Group as GroupIcon,
  SportsEsports as GamingIcon,
  Assignment as PlansIcon,
  Hub as HubIcon,
  Visibility as VisibilityIcon,
} from "@mui/icons-material";
import { useSelector } from "react-redux";
import { useUI } from "../../context/UIContext";
import { RootState } from "../../store/store";
import { alpha } from "@mui/material/styles";
import MorphToggleIcon from "../motion/MorphToggleIcon";

interface ProfileMenuItem {
  id: string;
  label: string;
  icon: React.ReactElement;
  path: string;
  threadId?: string;
  children?: ProfileMenuItem[];
}

interface MenuSection {
  id: string;
  label: string;
  items: ProfileMenuItem[];
}

export default function Sidebar({
  open: externalOpen,
  onClose,
  mobileOpen = false,
}: any) {
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const { t } = useTranslation("common");
  const { user } = useSelector((state: RootState) => state.auth);
  const { sidebarCollapsed: collapsed, setSidebarCollapsed } = useUI();
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set());

  const DRAWER_WIDTH = 260;
  const DRAWER_WIDTH_COLLAPSED = 72;

  const menuSections: MenuSection[] = [
    {
      id: "social",
      label: t("nav.section.social", "SOCIAL"),
      items: [
        {
          id: "home",
          label: t("nav.home", "Inicio"),
          icon: <DashboardIcon className="rt-dash" />,
          path: "/home",
        },
        {
          id: "discover",
          label: t("nav.discover", "Descubrir"),
          icon: <ExploreIcon className="rt-compass" />,
          path: "/discover",
          threadId: "redthread",
        },
        {
          id: "blueth",
          label: t("nav.blueth", "Amigos"),
          icon: <GroupIcon className="rt-pulse" />,
          path: "/friends",
          threadId: "blueth",
        },
        {
          id: "goldth",
          label: t("nav.goldth", "Golth"),
          icon: <HubIcon className="rt-orbit" />,
          path: "/golth",
          threadId: "goldth",
        },
        {
          id: "chat",
          label: t("nav.chat", "Chat"),
          icon: <ChatIcon className="rt-bubble" />,
          path: "/chat",
        },
        {
          id: "likes",
          label: t("nav.likes", "Likes"),
          icon: <HeartIcon className="rt-heart" />,
          path: "/likes",
        },
        {
          id: "visits",
          label: t("nav.visits", "Visitas"),
          icon: <VisibilityIcon className="rt-blink" />,
          path: "/visits",
        },
      ],
    },
    {
      id: "entertainment",
      label: t("nav.section.entertainment", "ENTRETENIMIENTO"),
      items: [
        {
          id: "purpleth",
          label: t("nav.purpleth", "Gaming Zone"),
          icon: <GamingIcon className="rt-joystick" />,
          path: "/purpleth",
          threadId: "purpleth",
        },
        {
          id: "roulette",
          label: t("nav.roulette", "Ruleta"),
          icon: <CasinoIcon className="rt-wheel" />,
          path: "/roulette",
        },
        {
          id: "radar",
          label: t("nav.radar", "Radar"),
          icon: <RadarIcon className="rt-ping" />,
          path: "/radar",
        },
      ],
    },
    {
      id: "organization",
      label: t("nav.section.organization", "ORGANIZACIÓN"),
      items: [
        {
          id: "events",
          label: t("nav.events", "Eventos"),
          icon: <EventIcon className="rt-flip" />,
          path: "/events",
        },
        {
          id: "premium",
          label: t("nav.premium", "Suscripción"),
          icon: <DiamondIcon className="rt-gem" />,
          path: "/suscripcion",
        },
      ],
    },
    {
      id: "system",
      label: t("nav.section.system", "SISTEMA"),
      items: [
        {
          id: "settings",
          label: t("nav.settings", "Configuración"),
          icon: (
            <SettingsIcon
              className="rt-settings-icon"
              sx={{
                transition: "transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)",
              }}
            />
          ),
          path: "/settings",
          children: [
            {
              id: "appearance",
              label: t("nav.appearance", "Apariencia"),
              icon: (
                <PaletteIcon
                  className="rt-palette"
                  sx={{
                    transition:
                      "transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)",
                  }}
                />
              ),
              path: "/settings?section=appearance",
            },
            {
              id: "customize-navbar",
              label: t("nav.customize-navbar", "Customize Navbar"),
              icon: (
                <TuneIcon
                  className="rt-customize-navbar"
                  sx={{
                    transition:
                      "transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)",
                  }}
                />
              ),
              path: "/settings?section=navbar",
            },
            {
              id: "notifications-settings",
              label: t("nav.notifications", "Notificaciones"),
              icon: <NotificationsIcon className="rt-bell" />,
              path: "/settings?section=notifications",
            },
            {
              id: "accessibility",
              label: t("nav.accessibility", "Accesibilidad"),
              icon: <AccessibilityIcon className="rt-wave" />,
              path: "/settings?section=accessibility",
            },
            {
              id: "localization",
              label: t("nav.localization", "Idioma"),
              icon: <LanguageIcon className="rt-language" />,
              path: "/settings?section=localization",
            },
            {
              id: "privacy",
              label: t("nav.privacy", "Privacidad"),
              icon: <LockIcon className="rt-unlock" />,
              path: "/settings?section=privacy",
            },
            {
              id: "security-settings",
              label: t("nav.security", "Seguridad"),
              icon: <SecurityIcon className="rt-shield" />,
              path: "/settings?section=security",
            },
            {
              id: "advanced",
              label: t("nav.advanced", "Avanzado"),
              icon: (
                <TuneIcon
                  className="rt-advanced"
                  sx={{
                    transition:
                      "transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)",
                  }}
                />
              ),
              path: "/settings?section=advanced",
            },
          ],
        },
      ],
    },
  ];

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  const handleToggleCollapse = () => {
    setSidebarCollapsed(!collapsed);
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

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
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
          aria-label="Logo Reth"
          role="button"
          tabIndex={0}
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
              "&:hover": {
                transform: "scale(1.05)",
                filter: `drop-shadow(0 0 12px ${alpha(primary, 0.5)})`,
              },
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
        sx={{ overflowY: "auto", overflowX: "hidden", px: 1.5, flexGrow: 1 }}
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
          {menuSections.map((section) => (
            <Box key={section.id} sx={{ mb: 1 }}>
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
                {section.label}
              </Typography>
              <List disablePadding>
                {section.items.map((item) => {
                  const active = isActive(item);
                  return (
                    <ListItem key={item.id} disablePadding sx={{ mb: 0.5 }}>
                      <Tooltip
                        title={collapsed ? item.label : ""}
                        placement="right"
                      >
                        <ListItemButton
                          selected={active}
                          onClick={() => handleNavigation(item.path)}
                          sx={{
                            borderRadius: "10px",
                            justifyContent: collapsed ? "center" : "flex-start",
                            px: collapsed ? 0 : 2,
                            minHeight: 44,
                            transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
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
                              "&:hover": {
                                bgcolor: alpha(primary, isDark ? 0.06 : 0.05),
                              },
                              "&::before": {
                                content: '""',
                                position: "absolute",
                                left: 0,
                                top: "15%",
                                height: "70%",
                                width: "4px",
                                borderRadius: "0 4px 4px 0",
                                transformOrigin: "top",
                                bgcolor: primary,
                                boxShadow: `0 0 10px ${alpha(primary, 0.8)}`,
                                animation:
                                  "rtThreadDraw 0.35s cubic-bezier(0.22, 1, 0.36, 1) both",
                              },
                            },
                            "&:hover .rt-profile-settings": {
                              transform: "rotate(90deg)",
                            },
                            "&:hover .rt-profile-shield": {
                              animation:
                                "rtPShieldPulse 0.7s cubic-bezier(0.36, 0, 0.66, 0.56)",
                            },
                            "&:hover .rt-profile-bell": {
                              animationPlayState: "paused",
                            },
                            "&:hover .rt-profile-lock": {
                              animation:
                                "rtPLockWiggle 0.5s cubic-bezier(0.36, 0, 0.66, 0.56)",
                            },
                            "&:hover .rt-profile-sliders": {
                              animation:
                                "rtPSliders 0.6s cubic-bezier(0.36, 0, 0.66, 0.56)",
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
          ))}
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
}
