import {
  ReactNode,
  useState,
  useEffect,
  useRef,
  useCallback,
  lazy,
  Suspense,
} from "react";
import { useRouter } from "next/router";
import {
  AppBar,
  Box,
  Toolbar,
  IconButton,
  Typography,
  Menu,
  MenuItem,
  Container,
  Avatar,
  Tooltip,
  Divider,
  Button,
  ListItemIcon,
  Drawer,
  useMediaQuery,
  GlobalStyles,
} from "@mui/material";
import {
  Settings as SettingsIcon,
  Security as SecurityIcon,
  Notifications as NotificationsIcon,
  Logout as LogoutIcon,
  Person as PersonIcon,
  Home as HomeIcon,
  Search as SearchIcon,
  Favorite as FavoriteBorderIcon,
  ChatBubble as ChatBubbleIcon,
  Language as TranslateIcon,
  Explore as ExploreIcon,
  Event as EventIcon,
  Assignment as AssignmentIcon,
} from "@mui/icons-material";
import { BottomNavigation, BottomNavigationAction, Paper } from "@mui/material";
import BottomSheet from "../shared/BottomSheet";

// ... (existing imports)

import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../../store/store";
import { logout } from "../../store/slices/authSlice";
import Sidebar from "./Sidebar";
import { useTranslation } from "next-i18next/pages";
import apiClient from "../../services/api";
import { useUI } from "../../context/UIContext";
import {
  alpha,
  useTheme,
  type SxProps,
  type Theme,
} from "@mui/material/styles";
import NavLink from "./NavLink";
import MorphToggleIcon from "../motion/MorphToggleIcon";
import { isIconStyleId, IconStyleId } from "../motion/iconStyles";
import { supportedLanguages } from "../../config/languages";
import { persistLangLocal } from "../../utils/landingLanguage";
import { applyNotificationSocketEvent } from "../../hooks/notificationSync";
import { usePauseExpiry } from "../../hooks/usePauseExpiry";
import {
  PAUSE_STATE_EVENT,
  PAUSE_SUMMARY_EVENT,
  type PauseSummary,
} from "../../hooks/useNotifications";
import { orbisLayer } from "../../styles/glass";

const NotificationPanel = lazy(
  () => import("../notifications/NotificationPanel"),
);
const Footer = lazy(() => import("./Footer"));
const MascotFAB = lazy(() => import("../common/MascotFAB"));
const ThemeSwitch = lazy(() => import("../motion/ThemeSwitch"));
const BasicThemeSwitch = lazy(() => import("../motion/BasicThemeSwitch"));
const GlowThemeSwitch = lazy(() => import("../motion/GlowThemeSwitch"));
const SubtleThemeSwitch = lazy(() => import("../motion/SubtleThemeSwitch"));
const LiquidThemeSwitch = lazy(() => import("../motion/LiquidThemeSwitch"));
const QuickActionIcon = lazy(() => import("../motion/QuickActionIcon"));

interface LayoutProps {
  children: ReactNode;
}

import { useAppTheme } from "../../context/ThemeContext";
import { useNavbarContext } from "../../context/NavbarContext";
import { useSnackbar } from "notistack";
import { useLanguageFallback } from "../../hooks/useLanguageFallback";

// ... (existing imports)

export default function Layout({ children }: LayoutProps) {
  const router = useRouter();
  const dispatch = useDispatch();
  const { t } = useTranslation("common");
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  useLanguageFallback(false);
  const { user, isAuthenticated } = useSelector(
    (state: RootState) => state.auth,
  );
  const { mode, toggleMode } = useAppTheme();
  const { drawerWidth } = useUI();
  const { navConfig, refresh: refreshNavConfig } = useNavbarContext();

  const muiTheme = useTheme();
  const isDark = muiTheme.palette.mode === "dark";
  const primary = muiTheme.palette.primary.main;
  const dividerColor = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)";
  const glassBg = isDark ? "rgba(16,18,32,0.55)" : "rgba(255,255,255,0.72)";

  // Notifications surface tiers (R21): Drawer >= 1024, BottomSheet otherwise
  const isDesktop = useMediaQuery(muiTheme.breakpoints.up(1024));
  const isTablet = useMediaQuery(muiTheme.breakpoints.up(768));

  const shortcuts = navConfig?.shortcuts ?? {};
  const profileStyle = navConfig?.profile ?? {};
  const avatarShape = profileStyle.shape ?? "circle";
  const avatarBorder = profileStyle.border ?? "accent";
  const avatarGlow = profileStyle.glow ?? "accent";
  const avatarRadius =
    avatarShape === "circle"
      ? "50%"
      : avatarShape === "square"
        ? "12px"
        : "6px";
  const isDiamondAvatar = avatarShape === "diamond";
  const avatarBorderWidth =
    avatarBorder === "none" ? 0 : avatarBorder === "thin" ? 1.5 : 2;
  const avatarBorderColor =
    avatarBorder === "none"
      ? "transparent"
      : avatarBorder === "thin"
        ? isDark
          ? "rgba(255,255,255,0.4)"
          : "rgba(0,0,0,0.22)"
        : alpha(primary, 0.6);
  const avatarGlowColor = (o: number) =>
    avatarGlow === "passion" ? `rgba(211,47,47,${o})` : alpha(primary, o);
  const iconStyleIds = navConfig?.icon_styles ?? {};
  const styleOf = (id: string): IconStyleId => {
    const value = iconStyleIds[id];
    return isIconStyleId(value) ? value : "basic";
  };
  const quickActions = navConfig?.quick_actions ?? {};
  const showIcon = (id: string): boolean =>
    navConfig ? quickActions[id] !== false : true;

  const [anchorElUser, setAnchorElUser] = useState<null | HTMLElement>(null);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [lowPowerPanel, setLowPowerPanel] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const cores =
        typeof navigator === "undefined"
          ? undefined
          : navigator.hardwareConcurrency;
      setLowPowerPanel(typeof cores === "number" && cores > 0 && cores <= 2);
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  const panelSurface: SxProps<Theme> = {
    bgcolor: lowPowerPanel
      ? isDark
        ? "rgba(26,27,30,0.70)"
        : "rgba(255,255,255,0.70)"
      : isDark
        ? "rgba(26,27,30,0.35)"
        : "rgba(255,255,255,0.40)",
    ...(lowPowerPanel
      ? {}
      : {
          WebkitBackdropFilter: "blur(20px) saturate(160%)",
          backdropFilter: "blur(20px) saturate(160%)",
        }),
    overflow: "hidden",
    "& > *": { position: "relative", zIndex: 1 },
    ...(lowPowerPanel
      ? {}
      : {
          "&::before": {
            content: '""',
            borderRadius: "inherit",
            ...orbisLayer(isDark),
          },
        }),
  };

  // Notification state
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pausedUntil, setPausedUntil] = useState<string | null>(null);
  const ws = useRef<WebSocket | null>(null);
  const fetchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Language menu state
  const [langAnchorEl, setLangAnchorEl] = useState<null | HTMLElement>(null);

  // Helper to get full image URL
  const getImageUrl = (url?: string) => {
    if (!url) return null;
    if (url.startsWith("http")) return url;
    return `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}${url}`;
  };

  const fetchUnreadCount = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      const response = await apiClient.get("/notifications/unread-count");
      setUnreadCount(response.data.count);
      setPausedUntil(response.data.paused_until ?? null);
      window.dispatchEvent(new CustomEvent("notifications-sync"));
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  }, [isAuthenticated]);

  const scheduleFetch = useCallback(() => {
    if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);
    fetchTimeoutRef.current = setTimeout(() => {
      fetchTimeoutRef.current = null;
      void fetchUnreadCount();
    }, 500);
  }, [fetchUnreadCount]);

  const showPauseSummary = useCallback(
    (summary: PauseSummary) => {
      if (!summary.total) return;
      enqueueSnackbar(
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.25 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            {t("notifications.pause.summaryTitle", "Resumen de No molestar")}
          </Typography>
          <Typography variant="body2">
            {t(
              "notifications.pause.whileAway",
              "Mientras no molestabas llegaron {{count}} notificaciones",
              { count: summary.total },
            )}
          </Typography>
        </Box>,
        {
          variant: "info",
          autoHideDuration: 9000,
          action: (key) => (
            <Button
              color="inherit"
              size="small"
              onClick={() => {
                setNotificationOpen(true);
                closeSnackbar(key);
              }}
            >
              {t("notifications.pause.viewAll", "Ver todas")}
            </Button>
          ),
        },
      );
    },
    [closeSnackbar, enqueueSnackbar, t],
  );

  const consumePauseSummary = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const response = await apiClient.get("/notifications/pause/summary");
      const summary = response.data?.summary as PauseSummary | null;
      if (summary) showPauseSummary(summary);
    } catch {
      // The next refresh retries; a missing summary must never block the app.
    }
  }, [isAuthenticated, showPauseSummary]);

  const handlePauseExpired = useCallback(async () => {
    await fetchUnreadCount();
    await consumePauseSummary();
  }, [consumePauseSummary, fetchUnreadCount]);

  usePauseExpiry(pausedUntil, handlePauseExpired);

  const consumeSummaryRef = useRef(consumePauseSummary);

  useEffect(() => {
    consumeSummaryRef.current = consumePauseSummary;
  }, [consumePauseSummary]);

  useEffect(() => {
    if (!isAuthenticated) return;
    void consumeSummaryRef.current();
  }, [isAuthenticated]);

  useEffect(() => {
    const onSummary = (event: Event) => {
      const summary = (event as CustomEvent<PauseSummary>).detail;
      if (summary) showPauseSummary(summary);
    };
    window.addEventListener(PAUSE_SUMMARY_EVENT, onSummary);
    return () => window.removeEventListener(PAUSE_SUMMARY_EVENT, onSummary);
  }, [showPauseSummary]);

  useEffect(() => {
    const onPauseState = (event: Event) => {
      const until = (event as CustomEvent<string | null>).detail;
      setPausedUntil(until ?? null);
    };
    window.addEventListener(PAUSE_STATE_EVENT, onPauseState);
    return () => window.removeEventListener(PAUSE_STATE_EVENT, onPauseState);
  }, []);

  // Fetch the badge count on mount and whenever auth changes
  useEffect(() => {
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
      fetchTimeoutRef.current = null;
    }
    void fetchUnreadCount();
  }, [fetchUnreadCount]);

  // Clear a pending debounce when the layout unmounts
  useEffect(
    () => () => {
      if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);
    },
    [],
  );

  // Keep the bell in sync when the survey is answered from the Home bubble
  useEffect(() => {
    const handlePreferencesChanged = () => scheduleFetch();
    window.addEventListener(
      "care-preferences-changed",
      handlePreferencesChanged,
    );
    return () => {
      window.removeEventListener(
        "care-preferences-changed",
        handlePreferencesChanged,
      );
    };
  }, [scheduleFetch]);

  // Refresh counts when the tab becomes visible again
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") scheduleFetch();
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [scheduleFetch]);

  // Refetch navbar config when auth state changes
  useEffect(() => {
    if (isAuthenticated) {
      refreshNavConfig();
    }
  }, [isAuthenticated, refreshNavConfig]);

  // Use avatar from Redux and process URL
  const displayAvatar = getImageUrl(user?.avatar);

  // WebSocket Connection
  useEffect(() => {
    if (!isAuthenticated || !user?.user_id) return;

    // Connect to WebSocket
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.hostname}:8000/chat/ws/${user.user_id}`;

    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      console.log("WebSocket Connected");
    };

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      applyNotificationSocketEvent(data, scheduleFetch);
    };

    ws.current.onclose = () => {
      console.log("WebSocket Disconnected");
      // Simple reconnection logic could go here
    };

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [isAuthenticated, user?.user_id, scheduleFetch]);

  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const handleOpenLangMenu = (event: React.MouseEvent<HTMLButtonElement>) => {
    setLangAnchorEl(event.currentTarget);
  };

  const handleCloseLangMenu = () => {
    setLangAnchorEl(null);
  };

  const handleLanguageSelect = async (newLang: string) => {
    handleCloseLangMenu();
    persistLangLocal(newLang);
    try {
      await apiClient.patch("/auth/me", { preferred_language: newLang });
    } catch (e: any) {
      if (e?.response?.status === 400) {
        enqueueSnackbar("Idioma no disponible", { variant: "error" });
        return;
      }
      if (e?.response?.status !== 401)
        console.warn("Could not save preferred language:", e);
    }
    persistLangLocal(newLang);
    const currentPath = router.asPath;
    const currentLocale = router.locale || "es";
    const defaultLocale = router.defaultLocale || "es";
    const configuredLocales = (router.locales as string[] | undefined) ?? [];

    const prefixRe = configuredLocales.length
      ? new RegExp(
          `^/(?:${configuredLocales.map((l) => l.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})+(?=/|$)`,
        )
      : new RegExp(`^/${currentLocale}(?=/|$)`);
    const cleanedPath = currentPath.replace(prefixRe, "") || "/";
    const target =
      newLang !== defaultLocale
        ? `/${newLang}${cleanedPath === "/" ? "" : cleanedPath}`
        : cleanedPath;
    window.location.href = target || "/";
  };

  const handleLogout = async () => {
    try {
      await apiClient.post("/auth/logout");
    } catch (error) {
      console.error(
        "Logout API failed but proceeding with local logout:",
        error,
      );
    } finally {
      dispatch(logout());
      router.push("/");
      handleCloseUserMenu();
    }
  };

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <GlobalStyles
        styles={{
          "@media (max-width: 900px)": {
            "html, body, #__next, main": {
              msOverflowStyle: "none !important",
              scrollbarWidth: "none !important",
            },
            "*::-webkit-scrollbar": {
              display: "none !important",
              width: "0 !important",
              height: "0 !important",
              background: "transparent !important",
            },
          },
        }}
      />
      {/* Sidebar */}
      {isAuthenticated && (
        <Sidebar
          mobileOpen={mobileDrawerOpen}
          onClose={() => setMobileDrawerOpen(false)}
        />
      )}

      {/* Main Content */}
      <Box
        sx={{
          flexGrow: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Top AppBar - Fixed Positioning for stability */}
        {isAuthenticated && (
          <AppBar
            position="fixed"
            elevation={0}
            sx={{
              // Móvil: sticky arriba (z-1200) para que no se encime con el contenido.
              position: { xs: "sticky", md: "fixed" },
              top: 0,
              bgcolor: "transparent",
              backdropFilter: "blur(14px)",
              WebkitBackdropFilter: "blur(14px)",
              color: isDark ? "rgba(255,255,255,0.92)" : "rgba(33,33,33,0.87)",
              borderBottom: "none",
              boxShadow: "none",
              minHeight: { xs: 60, sm: 72 },
              width: { xs: "100%", md: `calc(100% - ${drawerWidth}px)` },
              ml: { xs: 0, md: `${drawerWidth}px` },
              transition: (theme) =>
                theme.transitions.create(
                  ["width", "margin", "background-color", "border-color"],
                  {
                    easing: theme.transitions.easing.sharp,
                    duration: theme.transitions.duration.leavingScreen,
                  },
                ),
              zIndex: { xs: 1200, md: 1500 }, // Móvil: 1200 sin tapar menús; desktop: sobre drawers
              "@media (prefers-reduced-motion: no-preference)": {
                "@keyframes rtAvatarRing": {
                  "0%, 100%": {
                    boxShadow: `0 0 0 2px ${avatarGlowColor(0.35)}`,
                  },
                  "50%": { boxShadow: `0 0 0 5px ${avatarGlowColor(0.12)}` },
                },
              },
            }}
          >
            <Toolbar
              sx={{
                position: "relative",
                justifyContent: "space-between",
                gap: 1,
                minHeight: { xs: "60px !important", sm: "72px !important" },
                px: { xs: 1, sm: 3 },
              }}
            >
              {/* LEFT: Logo & Hamburger */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  minWidth: "40px",
                  flexShrink: 0,
                }}
              >
                {/* Hamburger Menu (Mobile Only) */}
                <Box
                  sx={{
                    display: { xs: "flex", md: "none" },
                    alignItems: "center",
                  }}
                >
                  <MorphToggleIcon
                    open={mobileDrawerOpen}
                    label="toggle drawer"
                    color="inherit"
                    edge="start"
                    onClick={() => setMobileDrawerOpen(!mobileDrawerOpen)}
                    sx={{ mr: 1 }}
                  />
                </Box>

                {/* Logo Area (Left - Desktop) */}
                <Box
                  sx={{
                    display: { xs: "none", md: "flex" },
                    alignItems: "center",
                  }}
                ></Box>
              </Box>

              {/* MIDDLE: Navigation Links - solo pantallas amplias (lg+); en móvil y
                  tablets van en el drawer lateral (temporal en <md, permanente en md+) */}
              <Box
                sx={{
                  display: { xs: "none", lg: "flex" },
                  "@media (max-height: 500px)": { display: "none" },
                  position: "relative",
                  zIndex: 1300,
                  gap: { xs: 1, sm: 2, md: 3 },
                  overflowX: "auto",
                  flexGrow: 1,
                  mx: { xs: 1, sm: 2 },
                  mr:
                    router.pathname === "/discover"
                      ? { xs: 0, md: 2 }
                      : { xs: "110px", md: 2 },
                  justifyContent: { xs: "flex-start", md: "center" },
                  "&::-webkit-scrollbar": { display: "none" },
                  msOverflowStyle: "none",
                  scrollbarWidth: "none",
                  minWidth: 0,
                  maxWidth: "100%",
                }}
              >
                {[
                  {
                    id: "home",
                    label: t("nav.home", "Inicio"),
                    path: "/home",
                    optional: false,
                    icon: <HomeIcon className="rt-dash" />,
                  },
                  {
                    id: "discover",
                    label: t("nav.discover", "Descubrir"),
                    path: "/discover",
                    optional: false,
                    icon: <ExploreIcon className="rt-compass" />,
                  },
                  {
                    id: "events",
                    label: t("nav.events", "Eventos"),
                    path: "/events",
                    optional: false,
                    icon: <EventIcon className="rt-flip" />,
                  },
                  {
                    id: "plans",
                    label: t("nav.plans", "Planes"),
                    path: "/plans",
                    optional: false,
                    icon: <AssignmentIcon className="rt-gem" />,
                  },
                  {
                    id: "favorites",
                    label: t("nav.favorites", "Favoritos"),
                    path: "/likes",
                    optional: true,
                  },
                  {
                    id: "recent",
                    label: t("nav.recent", "Recientes"),
                    path: "/visits",
                    optional: true,
                  },
                  {
                    id: "help",
                    label: t("nav.help", "Ayuda"),
                    path: "/help",
                    optional: true,
                  },
                ]
                  .filter((link) => {
                    if (link.optional) {
                      return navConfig !== null && shortcuts[link.id] === true;
                    }
                    return navConfig ? shortcuts[link.id] !== false : true;
                  })
                  .map((link) => (
                    <NavLink
                      key={link.path}
                      label={link.label}
                      active={router.pathname === link.path}
                      onClick={() => router.push(link.path)}
                      icon={link.icon}
                    />
                  ))}
              </Box>

              {/* RIGHT: User Actions - Agrupados a la derecha, sin encimarse en móvil */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-end",
                  gap: { xs: "0.5rem", sm: "1rem" },
                  position: { xs: "absolute", md: "static" },
                  right: { xs: 8, md: "auto" },
                  top: { xs: "50%", md: "auto" },
                  transform: { xs: "translateY(-50%)", md: "none" },
                  flexShrink: 0,
                  // Fondo propio en móvil: los links con scroll ya no se ven por debajo
                  bgcolor: { xs: glassBg, md: "transparent" },
                  backdropFilter: { xs: "blur(14px)", md: "none" },
                  WebkitBackdropFilter: { xs: "blur(14px)", md: "none" },
                  borderRadius: { xs: 3, md: 0 },
                  pl: { xs: 1, md: 0 },
                  zIndex: 1400,
                }}
              >
                {/* Theme Toggle - Desktop Only */}
                {showIcon("theme") && (
                  <Tooltip
                    title={
                      mode === "dark"
                        ? t("theme.light", "Modo Claro")
                        : t("theme.dark", "Modo Oscuro")
                    }
                  >
                    <Box sx={{ display: { xs: "none", sm: "inline-flex" } }}>
                      <Suspense fallback={null}>
                        <QuickActionIcon
                          styleId={styleOf("theme")}
                          motion="switch"
                          asBox
                        >
                          {styleOf("theme") === "basic" ? (
                            <BasicThemeSwitch
                              checked={mode === "dark"}
                              onChange={toggleMode}
                            />
                          ) : styleOf("theme") === "glow" ? (
                            <GlowThemeSwitch
                              checked={mode === "dark"}
                              onChange={toggleMode}
                            />
                          ) : styleOf("theme") === "subtle" ? (
                            <SubtleThemeSwitch
                              checked={mode === "dark"}
                              onChange={toggleMode}
                            />
                          ) : styleOf("theme") === "liquid" ? (
                            <LiquidThemeSwitch
                              checked={mode === "dark"}
                              onChange={toggleMode}
                            />
                          ) : (
                            <ThemeSwitch
                              checked={mode === "dark"}
                              onChange={toggleMode}
                            />
                          )}
                        </QuickActionIcon>
                      </Suspense>
                    </Box>
                  </Tooltip>
                )}

                {/* Notifications Button */}
                {showIcon("notifications") && (
                  <Suspense fallback={null}>
                    <Tooltip title={t("nav.notifications", "Notificaciones")}>
                      <Box
                        sx={{
                          width: { xs: 40, lg: 48 },
                          height: { xs: 40, lg: 48 },
                          borderRadius: "50%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <QuickActionIcon
                          styleId={styleOf("notifications")}
                          motion="bell"
                          basicHover="bell"
                          active={unreadCount > 0}
                          badgeContent={unreadCount}
                          onClick={() => setNotificationOpen(true)}
                        >
                          <NotificationsIcon
                            className="rt-bell-icon"
                            sx={{ fontSize: { xs: "1.2rem", sm: "1.4rem" } }}
                          />
                        </QuickActionIcon>
                      </Box>
                    </Tooltip>
                  </Suspense>
                )}

                {/* Settings Button */}
                {showIcon("settings") && (
                  <Suspense fallback={null}>
                    <Tooltip title={t("nav.settings", "Configuración")}>
                      <Box
                        sx={{
                          width: { xs: 40, lg: 48 },
                          height: { xs: 40, lg: 48 },
                          borderRadius: "50%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <QuickActionIcon
                          styleId={styleOf("settings")}
                          motion="gear"
                          basicHover="gear"
                          onClick={() => router.push("/settings")}
                        >
                          <SettingsIcon
                            className="rt-settings-spin"
                            sx={{ fontSize: { xs: "1.2rem", sm: "1.4rem" } }}
                          />
                        </QuickActionIcon>
                      </Box>
                    </Tooltip>
                  </Suspense>
                )}

                {/* Language Button */}
                {showIcon("language") && (
                  <Suspense fallback={null}>
                    <Tooltip title={t("nav.language", "Idioma")}>
                      <Box
                        sx={{
                          width: { xs: 40, lg: 48 },
                          height: { xs: 40, lg: 48 },
                          borderRadius: "50%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <QuickActionIcon
                          styleId={styleOf("language")}
                          motion="globe"
                          onClick={handleOpenLangMenu}
                        >
                          <TranslateIcon
                            className="rt-globe"
                            sx={{ fontSize: { xs: "1.2rem", sm: "1.4rem" } }}
                          />
                        </QuickActionIcon>
                      </Box>
                    </Tooltip>
                  </Suspense>
                )}

                {/* Language Menu */}
                <Menu
                  sx={{ mt: "45px" }}
                  id="menu-language"
                  anchorEl={langAnchorEl}
                  anchorOrigin={{
                    vertical: "top",
                    horizontal: "right",
                  }}
                  keepMounted
                  transformOrigin={{
                    vertical: "top",
                    horizontal: "right",
                  }}
                  open={Boolean(langAnchorEl)}
                  onClose={handleCloseLangMenu}
                >
                  {supportedLanguages.map((lang) => (
                    <MenuItem
                      key={lang.code}
                      selected={(router.locale || "es") === lang.code}
                      onClick={() => handleLanguageSelect(lang.code)}
                    >
                      {lang.label}
                    </MenuItem>
                  ))}
                </Menu>

                {/* User Avatar */}
                <Tooltip title={t("nav.profile", "Perfil")}>
                  <IconButton
                    onClick={handleOpenUserMenu}
                    sx={{
                      width: { xs: 40, lg: 48 },
                      height: { xs: 40, lg: 48 },
                      padding: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Box
                      className="rt-avatar"
                      sx={{
                        width: { xs: 28, sm: 32 },
                        height: { xs: 28, sm: 32 },
                        borderRadius: avatarRadius,
                        border: `${avatarBorderWidth}px solid ${avatarBorderColor}`,
                        overflow: "hidden",
                        transform: isDiamondAvatar ? "rotate(45deg)" : "none",
                        transition:
                          "border-radius 0.4s ease, transform 0.4s ease, box-shadow 0.4s ease",
                        ...(avatarGlow !== "none"
                          ? {
                              "@media (prefers-reduced-motion: no-preference)":
                                {
                                  animation:
                                    "rtAvatarRing 3s ease-in-out infinite",
                                },
                            }
                          : {}),
                      }}
                    >
                      <Avatar
                        alt={user?.email}
                        src={displayAvatar || undefined}
                        sx={{
                          width: "100%",
                          height: "100%",
                          bgcolor: "primary.main",
                          fontSize: "0.9rem",
                          transform: isDiamondAvatar
                            ? "rotate(-45deg)"
                            : "none",
                          transition: "transform 0.3s ease",
                          "&:hover": {
                            transform: isDiamondAvatar
                              ? "rotate(-45deg) scale(1.06)"
                              : "scale(1.06)",
                          },
                        }}
                      >
                        {!displayAvatar && user?.email?.charAt(0).toUpperCase()}
                      </Avatar>
                    </Box>
                  </IconButton>
                </Tooltip>
              </Box>

              <Menu
                sx={{ mt: "45px" }}
                id="menu-appbar"
                anchorEl={anchorElUser}
                anchorOrigin={{
                  vertical: "top",
                  horizontal: "right",
                }}
                keepMounted
                transformOrigin={{
                  vertical: "top",
                  horizontal: "right",
                }}
                open={Boolean(anchorElUser)}
                onClose={handleCloseUserMenu}
              >
                <MenuItem
                  onClick={() => {
                    router.push("/profile");
                    handleCloseUserMenu();
                  }}
                >
                  <ListItemIcon>
                    <PersonIcon fontSize="small" />
                  </ListItemIcon>
                  <Typography
                    sx={{
                      textAlign: "center",
                    }}
                  >
                    {t("nav.profile", "Perfil")}
                  </Typography>
                </MenuItem>

                <Divider />

                <MenuItem
                  onClick={() => {
                    router.push("/settings?section=notifications");
                    handleCloseUserMenu();
                  }}
                >
                  <ListItemIcon>
                    <NotificationsIcon fontSize="small" />
                  </ListItemIcon>
                  <Typography
                    sx={{
                      textAlign: "center",
                    }}
                  >
                    {t("nav.notifications", "Notificaciones")}
                  </Typography>
                </MenuItem>

                <MenuItem
                  onClick={() => {
                    router.push("/settings");
                    handleCloseUserMenu();
                  }}
                >
                  <ListItemIcon>
                    <SettingsIcon fontSize="small" />
                  </ListItemIcon>
                  <Typography
                    sx={{
                      textAlign: "center",
                    }}
                  >
                    {t("nav.settings", "Configuración")}
                  </Typography>
                </MenuItem>

                <MenuItem
                  onClick={() => {
                    router.push("/settings?section=security");
                    handleCloseUserMenu();
                  }}
                >
                  <ListItemIcon>
                    <SecurityIcon fontSize="small" />
                  </ListItemIcon>
                  <Typography
                    sx={{
                      textAlign: "center",
                    }}
                  >
                    {t("nav.security", "Centro de Seguridad")}
                  </Typography>
                </MenuItem>

                <Divider />

                <MenuItem onClick={handleLogout}>
                  <ListItemIcon>
                    <LogoutIcon fontSize="small" />
                  </ListItemIcon>
                  <Typography
                    sx={{
                      textAlign: "center",
                    }}
                  >
                    {t("auth.logout", "Cerrar Sesión")}
                  </Typography>
                </MenuItem>
              </Menu>
            </Toolbar>
          </AppBar>
        )}

        {/* Spacer solo en desktop (en móvil el AppBar es sticky y no lo necesita) */}
        {isAuthenticated && (
          <Toolbar
            sx={{
              display: { xs: "none", md: "flex" },
              minHeight: { xs: "60px !important", sm: "72px !important" },
            }}
          />
        )}

        {/* Notifications: glass Drawer (desktop) / BottomSheet (tablet & mobile) */}
        {isDesktop ? (
          <Drawer
            anchor="right"
            open={notificationOpen}
            onClose={() => setNotificationOpen(false)}
            transitionDuration={{ enter: 280, exit: 280 }}
            elevation={0}
            sx={{
              zIndex: (theme) => theme.zIndex.drawer,
              "& .MuiDrawer-paper": {
                width: 400,
                mt: { xs: "60px", sm: "72px" },
                height: { xs: "calc(100% - 60px)", sm: "calc(100% - 72px)" },
                bgcolor: "transparent",
                backdropFilter: "blur(var(--glass-g1-blur))",
                WebkitBackdropFilter: "blur(var(--glass-g1-blur))",
                borderRadius: 0,
                border: "none",
                boxShadow: "none",
              },
            }}
          >
            <Suspense fallback={null}>
              <NotificationPanel onClose={() => setNotificationOpen(false)} />
            </Suspense>
          </Drawer>
        ) : (
          <BottomSheet
            open={notificationOpen}
            onClose={() => setNotificationOpen(false)}
            overlaySx={{ bgcolor: "transparent", backdropFilter: "none" }}
            sx={{
              height: isTablet ? "70dvh" : "100dvh",
              maxWidth: isTablet ? 640 : "100%",
              p: 0,
              ...panelSurface,
            }}
          >
            <Suspense fallback={null}>
              <NotificationPanel onClose={() => setNotificationOpen(false)} />
            </Suspense>
          </BottomSheet>
        )}

        {/* Page Content */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            bgcolor: "transparent",
            p: isAuthenticated ? { xs: 0, sm: 3 } : 0,
            pt: isAuthenticated ? { xs: 0, sm: 3 } : 0,
          }}
        >
          {isAuthenticated ? (
            <Container
              maxWidth="xl"
              sx={{ px: { xs: 0, sm: 3 } }}
              disableGutters
            >
              {children}
            </Container>
          ) : (
            children
          )}
        </Box>

        {/* Mobile Bottom Navigation - Story Style */}
        {isAuthenticated && (
          <Paper
            sx={{
              position: "fixed",
              bottom: 0,
              left: 0,
              right: 0,
              display: { xs: "block", sm: "none" },
              zIndex: 2000,
              bgcolor: "rgba(0, 0, 0, 0.85)",
              backdropFilter: "blur(20px)",
              borderTop: "1px solid rgba(255,255,255,0.1)",
              pb: "env(safe-area-inset-bottom)",
              borderRadius: "24px 24px 0 0",
              overflow: "hidden",
            }}
            elevation={0}
          >
            <BottomNavigation
              showLabels
              value={router.pathname}
              onChange={(event, newValue) => {
                router.push(newValue);
              }}
              sx={{
                height: { xs: 60, sm: 70 },
                bgcolor: "transparent",
                "& .MuiBottomNavigationAction-root": {
                  minWidth: 0,
                  p: 0,
                  transition: "all 0.2s ease",
                  color: "rgba(255,255,255,0.5)",
                  "&.Mui-selected": {
                    color: "#FF4081", // Vivid Pink
                    transform: "scale(1.05)",
                  },
                  "& .MuiBottomNavigationAction-label": {
                    fontSize: "0.7rem",
                    marginTop: "2px",
                  },
                },
              }}
            >
              <BottomNavigationAction
                label={t("nav.home", "Inicio")}
                value="/home"
                icon={<HomeIcon sx={{ fontSize: "1.6rem" }} />}
              />
              <BottomNavigationAction
                label={t("nav.discover", "Discover")}
                value="/discover"
                icon={<SearchIcon sx={{ fontSize: "1.6rem" }} />}
              />
              <BottomNavigationAction
                label={t("nav.likes", "Likes")}
                value="/likes"
                icon={<FavoriteBorderIcon sx={{ fontSize: "1.6rem" }} />}
              />
              <BottomNavigationAction
                label={t("nav.chats", "Chats")}
                value="/chats"
                icon={<ChatBubbleIcon sx={{ fontSize: "1.6rem" }} />}
              />
              <BottomNavigationAction
                label={t("nav.profile", "Perfil")}
                value="/profile"
                icon={<PersonIcon sx={{ fontSize: "1.6rem" }} />}
              />
            </BottomNavigation>
          </Paper>
        )}

        {/* Footer */}
        <Box sx={{ display: { xs: "none", sm: "block" } }}>
          <Suspense fallback={null}>
            <Footer />
          </Suspense>
        </Box>

        {/* Mascot FAB */}
        {isAuthenticated && (
          <Suspense fallback={null}>
            <MascotFAB />
          </Suspense>
        )}
      </Box>
    </Box>
  );
}
