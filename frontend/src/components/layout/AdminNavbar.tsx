import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import {
  AppBar,
  Box,
  Toolbar,
  IconButton,
  Typography,
  Menu,
  MenuItem,
  Avatar,
  Tooltip,
  Divider,
  ListItemIcon,
  Badge,
  Button,
  Drawer,
} from "@mui/material";
import {
  Logout as LogoutIcon,
  Person as PersonIcon,
  Settings as SettingsIcon,
  Tune as TuneIcon,
  Notifications as NotificationsIcon,
  Add as AddIcon,
} from "@mui/icons-material";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../../store/store";
import { logoutAdmin } from "../../store/slices/adminAuthSlice";
import adminApiClient from "../../services/adminApi";
import { useAppTheme } from "../../context/ThemeContext";
import { useTheme, alpha } from "@mui/material/styles";
import NavLink from "./NavLink";
import ThemeSwitch from "../motion/ThemeSwitch";
import LanguageSelector from "../common/LanguageSelector";
import { useLanguageFallback } from "../../hooks/useLanguageFallback";
import { useSnackbar } from "notistack";
import NewNotificationWizard from "../notifications/NewNotificationWizard";
import NotificationPanel from "../notifications/NotificationPanel";

interface AdminNavbarProps {
  sidebarCollapsed?: boolean;
}

export default function AdminNavbar({
  sidebarCollapsed = false,
}: AdminNavbarProps) {
  const router = useRouter();
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.adminAuth);
  const { mode, toggleMode } = useAppTheme();
  const { enqueueSnackbar } = useSnackbar();
  useLanguageFallback(true);

  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const primary = theme.palette.primary.main;
  const dividerColor = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)";
  const iconColor = isDark ? "rgba(255,255,255,0.72)" : "rgba(33,33,33,0.62)";
  const glassBg = isDark ? "rgba(16,18,32,0.55)" : "rgba(255,255,255,0.72)";

  const [anchorElUser, setAnchorElUser] = useState<null | HTMLElement>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [notificationPanelOpen, setNotificationPanelOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchUnreadCount = async () => {
      try {
        const res = await adminApiClient.get(
          "/portal-redthread/employee/notifications/inbox?is_read=false&limit=100",
        );
        if (isMounted && res.data?.notifications) {
          setUnreadCount(res.data.notifications.length);
        }
      } catch (e) {
        // ignore
      }
    };
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 60000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Quick access links (progressive enhancement over the full sidebar menu)
  const quickLinks = [
    { label: "Portal", path: "/portal-redthread" },
    { label: "Eventos", path: "/portal-redthread/eventos" },
    { label: "Empleados", path: "/portal-redthread/empleados" },
    { label: "Usuarios", path: "/portal-redthread/usuarios" },
    { label: "Finanzas", path: "/portal-redthread/finanzas" },
    { label: "Denuncias", path: "/portal-redthread/denuncias" },
  ];

  const isLinkActive = (path: string) =>
    path === "/portal-redthread"
      ? router.pathname === path
      : router.pathname.startsWith(path);

  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const handleLogout = async () => {
    try {
      // Clear HttpOnly session cookies server-side
      await adminApiClient.post("/portal-redthread/auth/logout");
    } catch (error) {
      // Proceed with local logout even if the endpoint fails
    } finally {
      dispatch(logoutAdmin());
      router.push("/portal-redthread/auth/login"); // Redirect to admin login page
      handleCloseUserMenu();
    }
  };

  // Helper to get full image URL
  const getImageUrl = (url?: string) => {
    if (!url) return null;
    if (url.startsWith("http")) return url;
    return `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}${url}`;
  };

  const displayAvatar = getImageUrl(user?.avatar);
  const userName =
    user?.first_name && user?.last_name
      ? `${user.first_name} ${user.last_name}`
      : user?.email;

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        bgcolor: glassBg,
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        color: isDark ? "rgba(255,255,255,0.92)" : "rgba(33,33,33,0.87)",
        borderBottom: "1px solid",
        borderColor: dividerColor,
        boxShadow: `0 1px 24px ${isDark ? "rgba(0,0,0,0.35)" : alpha(primary, 0.06)}`,
        zIndex: (t) => t.zIndex.drawer + 1,
        boxSizing: "border-box",
        transition:
          "background-color 0.3s ease, border-color 0.3s ease, color 0.3s ease",
        "@media (prefers-reduced-motion: no-preference)": {
          "@keyframes rtAvatarRing": {
            "0%, 100%": { boxShadow: `0 0 0 2px ${alpha(primary, 0.35)}` },
            "50%": { boxShadow: `0 0 0 5px ${alpha(primary, 0.12)}` },
          },
        },
      }}
    >
      <Toolbar
        sx={{
          justifyContent: "space-between",
          gap: 1,
          minHeight: "72px !important",
          px: 3,
        }}
      >
        {/* LEFT: Quick Access Nav Links */}
        <Box
          sx={{
            display: { xs: "none", md: "flex" },
            alignItems: "center",
            gap: 0.5,
            overflowX: "auto",
            flexGrow: 1,
            minWidth: 0,
            "&::-webkit-scrollbar": { display: "none" },
            msOverflowStyle: "none",
            scrollbarWidth: "none",
          }}
        >
          {quickLinks.map((link) => (
            <NavLink
              key={link.path}
              label={link.label}
              active={isLinkActive(link.path)}
              onClick={() => router.push(link.path)}
            />
          ))}
        </Box>

        {/* RIGHT: Theme Toggle & User */}
        <Box
          sx={{ display: "flex", alignItems: "center", gap: 1, flexShrink: 0 }}
        >
          <LanguageSelector
            showContinuityHint={false}
            onLanguageChange={async (code) => {
              try {
                await adminApiClient.patch("/portal-redthread/auth/me", {
                  preferred_language: code,
                });
              } catch (e: any) {
                if (e?.response?.status === 400)
                  enqueueSnackbar("Idioma no disponible", { variant: "error" });
                throw e;
              }
            }}
          />
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => setWizardOpen(true)}
            sx={{
              borderRadius: 50,
              textTransform: "none",
              fontWeight: "bold",
              px: 2,
              py: 0.8,
              boxShadow: `0 4px 14px ${alpha(primary, 0.35)}`,
              "&:hover": { boxShadow: `0 6px 20px ${alpha(primary, 0.5)}` },
              display: { xs: "none", sm: "flex" },
            }}
          >
            + Nueva Notificación
          </Button>
          <Tooltip
            title={
              notificationPanelOpen ? "Cerrar notificaciones" : "Notificaciones"
            }
          >
            <IconButton
              onClick={() => setNotificationPanelOpen((prev) => !prev)}
              sx={{
                color: notificationPanelOpen ? primary : iconColor,
              }}
            >
              <Badge badgeContent={unreadCount} color="error" max={99}>
                <NotificationsIcon />
              </Badge>
            </IconButton>
          </Tooltip>
          <Tooltip title={mode === "light" ? "Modo Oscuro" : "Modo Claro"}>
            <ThemeSwitch checked={mode === "dark"} onChange={toggleMode} />
          </Tooltip>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography
              variant="subtitle2"
              sx={{
                display: { xs: "none", sm: "block" },
                color: iconColor,
                fontSize: "0.85rem",
                letterSpacing: "0.2px",
              }}
            >
              {userName}
            </Typography>
            <Tooltip title="Cuenta">
              <IconButton onClick={handleOpenUserMenu} sx={{ p: 0.5 }}>
                <Box
                  sx={{
                    borderRadius: "50%",
                    "@media (prefers-reduced-motion: no-preference)": {
                      animation: "rtAvatarRing 3s ease-in-out infinite",
                    },
                  }}
                >
                  <Avatar
                    alt={user?.email}
                    src={displayAvatar || undefined}
                    sx={{
                      width: 32,
                      height: 32,
                      bgcolor: "primary.main",
                      fontSize: "0.9rem",
                      border: `2px solid ${alpha(primary, 0.6)}`,
                      transition: "transform 0.3s ease",
                      "&:hover": { transform: "scale(1.06)" },
                    }}
                  >
                    {!displayAvatar &&
                      user?.first_name?.charAt(0).toUpperCase()}
                  </Avatar>
                </Box>
              </IconButton>
            </Tooltip>
          </Box>
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
          <Box sx={{ px: 2, py: 1 }}>
            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: "bold",
              }}
            >
              {userName || "Admin"}
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: "text.secondary",
              }}
            >
              {user?.email}
            </Typography>
          </Box>
          <Divider />

          <MenuItem
            onClick={() => {
              router.push("/portal-redthread/mi-perfil?tab=perfil");
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
              Mi Perfil
            </Typography>
          </MenuItem>

          <MenuItem
            onClick={() => {
              router.push("/portal-redthread/mi-perfil?tab=preferencias");
              handleCloseUserMenu();
            }}
          >
            <ListItemIcon>
              <TuneIcon fontSize="small" />
            </ListItemIcon>
            <Typography
              sx={{
                textAlign: "center",
              }}
            >
              Preferencias
            </Typography>
          </MenuItem>

          <MenuItem
            onClick={() => {
              router.push("/portal-redthread/mi-perfil?tab=notificaciones");
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
              Notificaciones
            </Typography>
          </MenuItem>

          <MenuItem
            onClick={() => {
              router.push("/portal-redthread/configuracion");
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
              Configuración
            </Typography>
          </MenuItem>

          <Divider />

          <MenuItem onClick={handleLogout}>
            <ListItemIcon>
              <LogoutIcon fontSize="small" color="error" />
            </ListItemIcon>
            <Typography
              color="error"
              sx={{
                textAlign: "center",
              }}
            >
              Cerrar Sesión
            </Typography>
          </MenuItem>
        </Menu>
      </Toolbar>
      <NewNotificationWizard
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
      />
      {notificationPanelOpen && (
        <Drawer
          anchor="right"
          open={notificationPanelOpen}
          onClose={() => setNotificationPanelOpen(false)}
          transitionDuration={{ enter: 280, exit: 280 }}
          elevation={0}
          sx={{
            zIndex: (theme) => theme.zIndex.drawer,
            "& .MuiDrawer-paper": {
              width: 400,
              height: "100%",
              bgcolor: "background.paper",
            },
          }}
        >
          <NotificationPanel onClose={() => setNotificationPanelOpen(false)} />
        </Drawer>
      )}
    </AppBar>
  );
}
