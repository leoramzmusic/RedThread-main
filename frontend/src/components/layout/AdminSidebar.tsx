import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/router';
import { APP_VERSION } from '../../config/version';
import MorphToggleIcon from '../motion/MorphToggleIcon';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Typography,
  Divider,
  Collapse,
  Tooltip,
  useTheme,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Event as EventIcon,
  People as PeopleIcon,
  BarChart as BarChartIcon,
  Settings as SettingsIcon,
  Security as SecurityIcon,
  Report as ReportIcon,
  Flag as FlagIcon,
  PersonOutline as UserIcon,
  AttachMoney as MoneyIcon,
  Campaign as CampaignIcon,
  Support as SupportIcon,
  ExpandLess,
  ExpandMore,
  VerifiedUser as VerifiedUserIcon,
  Block as BlockIcon,
  History as HistoryIcon,
  Warning as WarningIcon,
  Palette as PaletteIcon,
  Image as ImageIcon,
  ViewCarousel as ViewCarouselIcon,
  VideoLibrary as VideoLibraryIcon,
  ColorLens as ColorLensIcon,
  Pets as PetsIcon,
  Badge as BadgeIcon,
  AccountBox as AccountBoxIcon,
  Tune as PreferencesIcon,
  Notifications as NotificationsIcon,
  Description as DescriptionIcon,
  Gavel as GavelIcon,
  ContactSupport as ContactSupportIcon,
} from '@mui/icons-material';

export const DRAWER_WIDTH = 260;
export const DRAWER_WIDTH_COLLAPSED = 70;

interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactElement;
  path?: string;
  children?: MenuItem[];
}

interface AdminSidebarProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

const ADMIN_NAV_KEYFRAMES = {
  '@keyframes rtItemIn': {
    from: { opacity: 0, transform: 'translateY(8px)' },
    to: { opacity: 1, transform: 'translateY(0)' },
  },
  '@keyframes rtDrawerIn': {
    from: { opacity: 0, transform: 'translateX(-14px)' },
    to: { opacity: 1, transform: 'translateX(0)' },
  },
  '@keyframes rtThreadDraw': {
    from: { transform: 'scaleY(0)' },
    to: { transform: 'scaleY(1)' },
  },
  '@keyframes rtChatBubble': {
    '0%, 82%, 100%': { transform: 'translateY(0) scale(1)' },
    '86%': { transform: 'translateY(-2px) scale(1.06)' },
    '90%': { transform: 'translateY(0) scale(1)' },
    '94%': { transform: 'translateY(-1px) scale(1.03)' },
    '98%': { transform: 'translateY(0) scale(1)' },
  },
  '@keyframes rtFriendsPulse': {
    '0%, 72%, 100%': { transform: 'scale(1)', opacity: 1 },
    '78%': { transform: 'scale(1.06)', opacity: 0.9 },
    '84%': { transform: 'scale(1)', opacity: 1 },
    '90%': { transform: 'scale(1.03)', opacity: 0.95 },
    '96%': { transform: 'scale(1)', opacity: 1 },
  },
  '@keyframes rtPing': {
    '0%, 78%, 100%': { transform: 'scale(1)', opacity: 1 },
    '84%': { transform: 'scale(1.14)', opacity: 0.75 },
    '90%': { transform: 'scale(1)', opacity: 1 },
  },
  '@keyframes rtDing': {
    '0%, 92%, 100%': { transform: 'rotate(0)' },
    '94%': { transform: 'rotate(-14deg)' },
    '96%': { transform: 'rotate(12deg)' },
    '98%': { transform: 'rotate(-6deg)' },
  },
  '@keyframes rtShake': {
    '0%, 100%': { transform: 'translateX(0)' },
    '25%': { transform: 'translateX(-2px)' },
    '75%': { transform: 'translateX(2px)' },
  },
  '@keyframes rtFlip': {
    to: { transform: 'rotateY(180deg)' },
  },
  '@keyframes rtShieldPulse': {
    '0%, 100%': { transform: 'scale(1)' },
    '50%': { transform: 'scale(1.15)' },
  },
  '@keyframes rtWave': {
    '0%, 100%': { transform: 'rotate(-8deg)' },
    '50%': { transform: 'rotate(8deg)' },
  },
  '@keyframes rtSliders': {
    '0%, 100%': { transform: 'translateY(0) scaleY(1)' },
    '25%': { transform: 'translateY(-1px) scaleY(0.8)' },
    '75%': { transform: 'translateY(1px) scaleY(1.2)' },
  },
};

const ADMIN_ANIMATION_CLASSES = {
  '& .rt-pulse': { animation: 'rtFriendsPulse 5.5s ease-in-out infinite' },
  '& .rt-ping': { animation: 'rtPing 4s ease-in-out infinite' },
  '& .rt-bell': { animation: 'rtDing 14s ease-in-out infinite' },
  '& .MuiListItemButton-root:hover .rt-dash': { animation: 'rtShake 0.4s cubic-bezier(0.36, 0, 0.66, 0.56)' },
  '& .MuiListItemButton-root:hover .rt-flip': { animation: 'rtFlip 0.6s cubic-bezier(0.36, 0, 0.66, 0.56)' },
  '& .MuiListItemButton-root:hover .rt-gem': { animation: 'rtGemGlint 0.8s cubic-bezier(0.36, 0, 0.66, 0.56)' },
  '& .MuiListItemButton-root:hover .rt-sliders': { animation: 'rtSliders 0.6s cubic-bezier(0.36, 0, 0.66, 0.56)' },
  '& .MuiListItemButton-root:hover .rt-shield': { animation: 'rtShieldPulse 0.7s cubic-bezier(0.36, 0, 0.66, 0.56)' },
  '& .MuiListItemButton-root:hover .rt-wave': { animation: 'rtWave 0.5s cubic-bezier(0.36, 0, 0.66, 0.56)' },
  '& .MuiListItemButton-root:hover .rt-pulse': { animationPlayState: 'paused' },
  '& .MuiListItemButton-root:hover .rt-ping': { animationPlayState: 'paused' },
  '& .MuiListItemButton-root:hover .rt-bell': { animationPlayState: 'paused' },
  '& .MuiListItemButton-root:hover .rt-palette': { transform: 'rotate(45deg)' },
  '& .MuiListItemButton-root:hover .rt-settings-icon': { transform: 'rotate(90deg)' },
};

export default function AdminSidebar({
  collapsed: externalCollapsed,
  onToggleCollapse
}: AdminSidebarProps) {
  const router = useRouter();
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set());

  // Use external collapsed state if provided, otherwise use internal
  const collapsed = externalCollapsed !== undefined ? externalCollapsed : internalCollapsed;

  const menuItems: MenuItem[] = [
    { id: 'home', label: 'Portal Home', icon: <DashboardIcon className="rt-dash" />, path: '/portal-redthread' },
    {
      id: 'mi-perfil',
      label: 'Mi perfil',
      icon: <AccountBoxIcon />,
      children: [
        { id: 'mi-perfil-personal', label: 'Perfil personal', icon: <UserIcon />, path: '/portal-redthread/mi-perfil?tab=perfil' },
        { id: 'mi-perfil-preferencias', label: 'Preferencias', icon: <PreferencesIcon />, path: '/portal-redthread/mi-perfil?tab=preferencias' },
        { id: 'mi-perfil-credenciales', label: 'Historial de credenciales', icon: <BadgeIcon />, path: '/portal-redthread/mi-perfil?tab=credenciales' },
        { id: 'mi-perfil-rep-incidente', label: 'Reportar incidente', icon: <ReportIcon />, path: '/portal-redthread/mi-perfil?tab=reportar-incidente' },
        { id: 'mi-perfil-rep-seguridad', label: 'Reportar seguridad', icon: <SecurityIcon />, path: '/portal-redthread/mi-perfil?tab=reportar-seguridad' },
        { id: 'mi-perfil-seguimiento', label: 'Seguimiento de reportes', icon: <HistoryIcon />, path: '/portal-redthread/mi-perfil?tab=seguimiento' },
        { id: 'mi-perfil-historial-rep', label: 'Historial de reportes', icon: <GavelIcon />, path: '/portal-redthread/mi-perfil?tab=historial' },
        { id: 'mi-perfil-notificaciones', label: 'Notificaciones', icon: <NotificationsIcon />, path: '/portal-redthread/mi-perfil?tab=notificaciones' },
        { id: 'mi-perfil-documentos', label: 'Documentos', icon: <DescriptionIcon />, path: '/portal-redthread/mi-perfil?tab=documentos' },
        { id: 'mi-perfil-seguridad-2fa', label: 'Seguridad (2FA)', icon: <SecurityIcon />, path: '/portal-redthread/mi-perfil?tab=seguridad' },
        { id: 'mi-perfil-auditoria', label: 'Auditoría personal', icon: <HistoryIcon />, path: '/portal-redthread/mi-perfil?tab=auditoria' },
        { id: 'mi-perfil-soporte', label: 'Soporte / RRHH', icon: <ContactSupportIcon />, path: '/portal-redthread/mi-perfil?tab=soporte' },
      ],
    },
    {
      id: 'eventos',
      label: 'Eventos',
      icon: <EventIcon className="rt-flip" />,
      children: [
        { id: 'eventos-crear', label: 'Crear evento', icon: <EventIcon />, path: '/portal-redthread/eventos/crear' },
        { id: 'eventos-listar', label: 'Editar evento', icon: <EventIcon />, path: '/portal-redthread/eventos' },
        { id: 'eventos-calendario', label: 'Calendario', icon: <EventIcon />, path: '/portal-redthread/eventos/calendario' },
        { id: 'eventos-estadisticas', label: 'Estadísticas', icon: <BarChartIcon />, path: '/portal-redthread/eventos/estadisticas' },
      ],
    },
    {
      id: 'experiencia',
      label: 'Experiencia del Usuario',
      icon: <VerifiedUserIcon className="rt-shield" />, // Or Psychology if available
      children: [
        { id: 'experiencia-menus', label: 'Menús del Portal', icon: <MenuIcon />, path: '/portal-redthread/experiencia/menus' },
        { id: 'experiencia-motor', label: 'Motor CARE', icon: <BarChartIcon />, path: '/portal-redthread/experiencia/motor' },
        { id: 'experiencia-icebreakers', label: 'Icebreaker Manager', icon: <SupportIcon />, path: '/portal-redthread/experiencia/icebreakers' },
        { id: 'experiencia-mascota', label: 'Mascota (Yuki)', icon: <PetsIcon />, path: '/portal-redthread/experiencia/mascota' },
      ],
    },
    {
      id: 'metricas',
      label: 'Métricas',
      icon: <BarChartIcon className="rt-sliders" />,
      children: [
        { id: 'metricas-usuarios', label: 'Usuarios registrados', icon: <UserIcon />, path: '/portal-redthread/metricas/usuarios' },
        { id: 'metricas-pais', label: 'Por país', icon: <BarChartIcon />, path: '/portal-redthread/metricas/pais' },
        { id: 'metricas-ciudad', label: 'Por ciudad', icon: <BarChartIcon />, path: '/portal-redthread/metricas/ciudad' },
        { id: 'metricas-crecimiento', label: 'Crecimiento mensual', icon: <BarChartIcon />, path: '/portal-redthread/metricas/crecimiento' },
        { id: 'metricas-retencion', label: 'Retención', icon: <BarChartIcon />, path: '/portal-redthread/metricas/retencion' },
        { id: 'metricas-care', label: 'CARE Engine', icon: <BarChartIcon />, path: '/admin/care-analytics' },
      ],
    },
    {
      id: 'denuncias',
      label: 'Denuncias',
      icon: <FlagIcon className="rt-wave" />,
      children: [
        { id: 'denuncias-listado', label: 'Listado', icon: <FlagIcon />, path: '/portal-redthread/denuncias' },
        { id: 'denuncias-pendientes', label: 'Pendientes', icon: <FlagIcon />, path: '/portal-redthread/denuncias/pendientes' },
        { id: 'denuncias-proceso', label: 'En proceso', icon: <FlagIcon />, path: '/portal-redthread/denuncias/proceso' },
        { id: 'denuncias-historial', label: 'Historial', icon: <FlagIcon />, path: '/portal-redthread/denuncias/historial' },
        { id: 'denuncias-lotes', label: 'Por lotes', icon: <FlagIcon />, path: '/portal-redthread/denuncias/lotes' },
        { id: 'denuncias-config', label: 'Configuración', icon: <SettingsIcon />, path: '/portal-redthread/denuncias/configuracion' },
      ],
    },
    {
      id: 'empleados',
      label: 'Empleados',
      icon: <PeopleIcon className="rt-pulse" />,
      children: [
        { id: 'empleados-listado', label: 'Listado', icon: <PeopleIcon />, path: '/portal-redthread/empleados/listado' },
        { id: 'empleados-registrar', label: 'Registrar empleado', icon: <PeopleIcon />, path: '/portal-redthread/empleados/registrar' },
        { id: 'empleados-roles', label: 'Roles y permisos', icon: <SecurityIcon />, path: '/portal-redthread/empleados/roles' },
        { id: 'empleados-departamentos', label: 'Departamentos', icon: <PeopleIcon />, path: '/portal-redthread/empleados/departamentos' },
        { id: 'empleados-design', label: 'Credenciales', icon: <BadgeIcon />, path: '/portal-redthread/empleados/EmployeeIdDesign' },
      ],
    },
    {
      id: 'usuarios',
      label: 'Usuarios',
      icon: <UserIcon className="rt-pulse" />,
      children: [
        { id: 'usuarios-listado', label: 'Listado', icon: <PeopleIcon />, path: '/portal-redthread/usuarios/listado' },
        { id: 'usuarios-verificaciones', label: 'Solicitudes de verificación', icon: <VerifiedUserIcon />, path: '/portal-redthread/usuarios/verificaciones' },
        { id: 'usuarios-suspendidos', label: 'Suspendidos', icon: <BlockIcon />, path: '/portal-redthread/usuarios/suspendidos' },
        { id: 'usuarios-actividad', label: 'Historial actividad', icon: <HistoryIcon />, path: '/portal-redthread/usuarios/actividad' },
        { id: 'usuarios-sospechosos', label: 'Perfiles sospechosos', icon: <WarningIcon />, path: '/portal-redthread/usuarios/sospechosos' },
      ],
    },
    {
      id: 'finanzas',
      label: 'Finanzas',
      icon: <MoneyIcon className="rt-gem" />,
      children: [
        { id: 'finanzas-suscripciones', label: 'Suscripciones', icon: <MoneyIcon />, path: '/portal-redthread/finanzas/suscripciones' },
        { id: 'finanzas-ingresos', label: 'Ingresos', icon: <MoneyIcon />, path: '/portal-redthread/finanzas/ingresos' },
        { id: 'finanzas-balance', label: 'Balance', icon: <BarChartIcon />, path: '/portal-redthread/finanzas/balance' },
        { id: 'finanzas-reportes', label: 'Reportes', icon: <ReportIcon />, path: '/portal-redthread/finanzas/reportes' },
      ],
    },
    {
      id: 'campanas',
      label: 'Campañas',
      icon: <CampaignIcon className="rt-ping" />,
      children: [
        { id: 'campanas-crear', label: 'Crear campaña', icon: <CampaignIcon />, path: '/portal-redthread/campanas/crear' },
        { id: 'campanas-anunciantes', label: 'Anunciantes', icon: <PeopleIcon />, path: '/portal-redthread/campanas/anunciantes' },
        { id: 'campanas-promociones', label: 'Promociones', icon: <CampaignIcon />, path: '/portal-redthread/campanas/promociones' },
        { id: 'campanas-metricas', label: 'Métricas', icon: <BarChartIcon />, path: '/portal-redthread/campanas/metricas' },
      ],
    },
    {
      id: 'apariencia',
      label: 'Apariencia',
      icon: <PaletteIcon className="rt-palette" sx={{ transition: 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)' }} />,
      children: [
        { id: 'apariencia-iconos', label: 'Favicon & Iconos', icon: <ImageIcon />, path: '/portal-redthread/apariencia/iconos' },
        { id: 'apariencia-logos', label: 'Logos', icon: <ImageIcon />, path: '/portal-redthread/apariencia/logos' },
        { id: 'apariencia-landingpage', label: 'Landing Page', icon: <ViewCarouselIcon />, path: '/portal-redthread/apariencia/landingpage' },
        { id: 'apariencia-navbar-footer', label: 'Navbar y Footer', icon: <MenuIcon />, path: '/portal-redthread/apariencia/landingPageNavbarAndFooter' },
        { id: 'apariencia-multimedia', label: 'Multimedia', icon: <VideoLibraryIcon />, path: '/portal-redthread/apariencia/multimedia' },
        { id: 'apariencia-temas', label: 'Temas', icon: <ColorLensIcon />, path: '/portal-redthread/apariencia/temas' },
      ],
    },
    {
      id: 'soporte',
      label: 'Soporte Técnico',
      icon: <SupportIcon className="rt-pulse" />,
      children: [
        { id: 'soporte-tickets', label: 'Tickets', icon: <SupportIcon />, path: '/portal-redthread/soporte/tickets' },
        { id: 'soporte-fallos', label: 'Fallos reportados', icon: <ReportIcon />, path: '/portal-redthread/soporte/fallos' },
        { id: 'soporte-sla', label: 'Panel SLA', icon: <BarChartIcon />, path: '/portal-redthread/soporte/sla' },
      ],
    },
    {
      id: 'configuracion',
      label: 'Configuración',
      icon: <SettingsIcon className="rt-settings-icon" sx={{ transition: 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)' }} />,
      children: [
        { id: 'config-general', label: 'General', icon: <SettingsIcon />, path: '/portal-redthread/configuracion/general' },
        { id: 'config-seguridad', label: 'Seguridad', icon: <SecurityIcon />, path: '/portal-redthread/configuracion/seguridad' },
        { id: 'config-integraciones', label: 'Integraciones', icon: <SettingsIcon />, path: '/portal-redthread/configuracion/integraciones' },
      ],
    },
  ];

  const handleToggleCollapse = () => {
    if (onToggleCollapse) {
      onToggleCollapse();
    } else {
      setInternalCollapsed(!internalCollapsed);
    }
    if (!collapsed) {
      setExpandedMenus(new Set()); // Close all submenus when collapsing
    }
  };

  const handleMenuClick = useCallback((item: MenuItem) => {
    if (item.children) {
      if (!collapsed) {
        setExpandedMenus((prev) => {
          const next = new Set(prev);
          if (next.has(item.id)) {
            next.delete(item.id);
          } else {
            next.add(item.id);
          }
          return next;
        });
      }
    } else if (item.path) {
      router.push(item.path);
    }
  }, [collapsed, router]);

  const isActive = (path?: string) => {
    if (!path) return false;
    // Exact match for the current path
    if (router.pathname === path) return true;
    // For parent paths that should highlight when child is active
    // We only want this if the path is a module root (e.g. /usuarios/listado vs /usuarios/id)
    // But in our case, /denuncias is the parent and also a standalone page.
    // If we are in /denuncias/pendientes, we don't want /denuncias to highlight if it's a separate menu item.
    return false; // For now, exact match for buttons. 
  };

  const drawerWidth = collapsed ? DRAWER_WIDTH_COLLAPSED : DRAWER_WIDTH;

  // Theme-aware tokens: react to mode (light/dark) + active visual theme from settings
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const primary = theme.palette.primary.main;
  const textActive = isDark ? 'rgba(255,255,255,0.92)' : 'rgba(0,0,0,0.87)';
  const textInactive = isDark ? 'rgba(255,255,255,0.65)' : 'rgba(0,0,0,0.6)';
  const iconInactive = isDark ? 'rgba(255,255,255,0.65)' : 'rgba(0,0,0,0.55)';
  const dividerColor = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)';
  const glassBg = isDark ? 'rgba(16,18,32,0.55)' : 'rgba(255,255,255,0.72)';
  const collapseIconColor = isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.45)';

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          bgcolor: glassBg,
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          borderRight: '1px solid',
          borderColor: dividerColor,
          transition: 'width 0.3s ease',
          overflowX: 'hidden',
          color: textActive,
          animation: 'rtDrawerIn 0.45s cubic-bezier(0.22, 1, 0.36, 1) both',
        },
      }}
    >
      {/* Header Section */}
      <Box
        sx={{
          p: 2,
          display: 'flex',
          flexDirection: collapsed ? 'column' : 'row',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'flex-start',
          gap: collapsed ? 1 : 2,
          minHeight: collapsed ? 90 : 72,
        }}
      >
        <MorphToggleIcon
          open={collapsed}
          label="toggle sidebar"
          onClick={handleToggleCollapse}
          sx={{
            p: 1,
            color: 'primary.main',
          }}
        />

        {/* Animated Brand Text */}
        <Box
          onClick={() => router.push('/portal-redthread')}
          aria-label="Logo Reth Admin"
          role="button"
          tabIndex={0}
          sx={{
            position: 'relative',
            height: collapsed ? 32 : 40,
            overflow: 'hidden',
            cursor: 'pointer',
            userSelect: 'none',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          {/* Expanded: RedThread + Admin Portal */}
          <Box
            sx={{
              opacity: collapsed ? 0 : 1,
              transform: collapsed ? 'translateX(-20px)' : 'translateX(0)',
              transition: 'all 0.5s cubic-bezier(0.68, -0.6, 0.32, 1.6)',
            }}
          >
            <Typography
              component="span"
              sx={{
                display: 'inline-flex',
                gap: '1px',
                whiteSpace: 'nowrap',
                fontWeight: 700,
                fontSize: '24px',
                letterSpacing: '0.5px',
                lineHeight: 1.2,
                '&:hover': {
                  transform: 'scale(1.05)',
                  filter: `drop-shadow(0 0 12px ${alpha(primary, 0.5)})`,
                }
              }}
            >
              <Box component="span" sx={{ color: 'primary.main' }}>RE</Box>
              <Box component="span" sx={{ color: 'text.secondary' }}>D</Box>
              <Box component="span" sx={{ color: 'primary.main' }}>TH</Box>
              <Box component="span" sx={{ color: 'text.secondary' }}>READ</Box>
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: 'text.secondary',
                lineHeight: 1,
                whiteSpace: 'nowrap',
                textTransform: 'uppercase',
                fontSize: '0.65rem',
                fontWeight: 800,
                letterSpacing: '1.5px',
                opacity: 0.8,
                display: 'block',
                mt: 0.2
              }}
            >
              Admin Portal
            </Typography>
          </Box>

          {/* Collapsed: RETH */}
          <Tooltip title="" placement="right">
            <Typography
              component="span"
              sx={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                transform: collapsed
                  ? 'translate(-50%, -50%) scale(1)'
                  : 'translate(-50%, -50%) scale(0.5)',
                whiteSpace: 'nowrap',
                fontWeight: 800,
                fontSize: '18px',
                letterSpacing: '1px',
                color: 'primary.main',
                opacity: collapsed ? 1 : 0,
                transition: 'all 0.5s cubic-bezier(0.68, -0.6, 0.32, 1.6)',
                '&:hover': {
                  transform: collapsed
                    ? 'translate(-50%, -50%) scale(1.15)'
                    : 'translate(-50%, -50%) scale(0.5)',
                  filter: `drop-shadow(0 0 15px ${alpha(primary, 0.8)})`,
                }
              }}
            >
              RETH
            </Typography>
          </Tooltip>
        </Box>
      </Box>

      <Divider sx={{ borderColor: dividerColor }} />

      {/* Menu Items */}
      <List
        sx={{
          px: 1,
          py: 1,
          flexGrow: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          '@media (prefers-reduced-motion: no-preference)': {
            ...ADMIN_NAV_KEYFRAMES,
            '@keyframes rtGemGlint': {
              '0%, 100%': { transform: 'scale(1)', filter: 'none' },
              '50%': {
                transform: 'scale(1.12)',
                filter: `drop-shadow(0 0 6px ${alpha(primary, 0.8)}) brightness(1.35)`,
              },
            },
            ...ADMIN_ANIMATION_CLASSES,
          },
        }}
      >
        {menuItems.map((item, itemIndex) => {
          const parentDelay = `${Math.min(itemIndex * 45, 540)}ms`;
          return (
            <Box key={item.id}>
              <ListItem disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  selected={isActive(item.path)}
                  onClick={() => handleMenuClick(item)}
                  sx={{
                    borderRadius: '10px',
                    position: 'relative',
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    px: collapsed ? 0 : 2,
                    minHeight: 44,
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    animation: `rtItemIn 0.45s cubic-bezier(0.22, 1, 0.36, 1) both ${parentDelay}`,
                    '&:hover': {
                      bgcolor: alpha(primary, isDark ? 0.1 : 0.06),
                      '& .MuiListItemIcon-root': {
                        color: primary,
                        transform: 'scale(1.1)',
                      },
                      '& .MuiListItemText-primary': {
                        color: isDark ? textActive : primary,
                        textShadow: isDark ? `0 0 10px ${alpha(primary, 0.65)}` : 'none',
                      },
                    },
                    '&.Mui-selected': {
                      bgcolor: alpha(primary, isDark ? 0.14 : 0.08),
                      backgroundImage: `linear-gradient(90deg, ${alpha(primary, isDark ? 0.22 : 0.12)}, ${alpha(primary, 0.02)})`,
                      '&:hover': {
                        bgcolor: alpha(primary, isDark ? 0.18 : 0.1),
                      },
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        left: 0,
                        top: '15%',
                        height: '70%',
                        width: '4px',
                        borderRadius: '0 4px 4px 0',
                        transformOrigin: 'top',
                        bgcolor: primary,
                        boxShadow: `0 0 10px ${alpha(primary, 0.8)}`,
                        animation: 'rtThreadDraw 0.35s cubic-bezier(0.22, 1, 0.36, 1) both',
                      },
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: collapsed ? 'auto' : 36,
                      color: isActive(item.path) ? primary : iconInactive,
                      justifyContent: 'center',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  {!collapsed && (
                    <>
                      <ListItemText
                        primary={item.label}
                        primaryTypographyProps={{
                          fontSize: '0.88rem',
                          fontWeight: isActive(item.path) ? 600 : 500,
                          sx: { color: isActive(item.path) ? textActive : textInactive, transition: 'color 0.2s ease' },
                        }}
                      />
                      {item.children && (
                        expandedMenus.has(item.id)
                          ? <ExpandLess sx={{ fontSize: '1.2rem', color: collapseIconColor }} />
                          : <ExpandMore sx={{ fontSize: '1.2rem', color: collapseIconColor }} />
                      )}
                    </>
                  )}
                </ListItemButton>
              </ListItem>

              {/* Submenu */}
              {item.children && !collapsed && (
                <Collapse in={expandedMenus.has(item.id)} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding>
                    {item.children.map((child, childIndex) => (
                      <ListItem key={child.id} disablePadding sx={{ mb: 0.5 }}>
                        <ListItemButton
                          selected={isActive(child.path)}
                          onClick={() => child.path && router.push(child.path)}
                          sx={{
                            pl: 4,
                            borderRadius: '8px',
                            position: 'relative',
                            transition: 'all 0.2s ease',
                            animation: `rtItemIn 0.4s cubic-bezier(0.22, 1, 0.36, 1) both ${Math.min(80 + childIndex * 30, 420)}ms`,
                            '&:hover': {
                              bgcolor: alpha(primary, isDark ? 0.08 : 0.05),
                              '& .MuiListItemText-primary': { color: isDark ? textActive : primary },
                              '& .MuiListItemIcon-root': { color: primary },
                            },
                            '&.Mui-selected': {
                              bgcolor: alpha(primary, isDark ? 0.12 : 0.07),
                              '&::before': {
                                content: '""',
                                position: 'absolute',
                                left: 0,
                                top: '15%',
                                height: '70%',
                                width: 3,
                                borderRadius: '0 3px 3px 0',
                                transformOrigin: 'top',
                                bgcolor: primary,
                                boxShadow: `0 0 8px ${alpha(primary, 0.7)}`,
                                animation: 'rtThreadDraw 0.35s cubic-bezier(0.22, 1, 0.36, 1) both',
                              },
                            },
                          }}
                        >
                          <ListItemIcon
                            sx={{
                              minWidth: 34,
                              color: isActive(child.path) ? primary : iconInactive,
                              transition: 'all 0.2s ease',
                            }}
                          >
                            {child.icon}
                          </ListItemIcon>
                          <ListItemText
                            primary={child.label}
                            primaryTypographyProps={{
                              fontSize: '0.875rem',
                              fontWeight: isActive(child.path) ? 600 : 400,
                              sx: { color: isActive(child.path) ? textActive : textInactive, transition: 'color 0.2s ease' },
                            }}
                          />
                        </ListItemButton>
                      </ListItem>
                    ))}
                  </List>
                </Collapse>
              )}
            </Box>
          );
        })}
      </List>

      <Divider sx={{ mt: 'auto', borderColor: dividerColor }} />

      {/* Footer Info */}
      {!collapsed && (
        <Box sx={{ p: '16px 28px', textAlign: 'left', mt: 'auto' }}>
          <Divider sx={{ mb: 2, ml: -3.5, mr: -3.5, borderColor: dividerColor, opacity: 0.6 }} />
          <Typography
            variant="caption"
            sx={{
              color: 'text.secondary',
              fontSize: '0.65rem',
              fontWeight: 700,
              display: 'block',
              letterSpacing: '0.5px'
            }}
          >
            Portal de Administración
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: 'text.disabled',
              fontSize: '0.55rem',
              display: 'block',
              mt: 0.2
            }}
          >
            v{APP_VERSION.admin}
          </Typography>
        </Box>
      )}
    </Drawer>
  );
}

