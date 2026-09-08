import { useState } from 'react';
import { useRouter } from 'next/router';
import { APP_VERSION } from '../../config/version';
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
} from '@mui/material';
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

export default function AdminSidebar({
  collapsed: externalCollapsed,
  onToggleCollapse
}: AdminSidebarProps) {
  const router = useRouter();
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);

  // Use external collapsed state if provided, otherwise use internal
  const collapsed = externalCollapsed !== undefined ? externalCollapsed : internalCollapsed;

  const menuItems: MenuItem[] = [
    { id: 'home', label: 'Portal Home', icon: <DashboardIcon />, path: '/portal-redthread' },
    {
      id: 'eventos',
      label: 'Eventos',
      icon: <EventIcon />,
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
      icon: <VerifiedUserIcon />, // Or Psychology if available
      children: [
        { id: 'experiencia-menus', label: 'Menús del Portal', icon: <MenuIcon />, path: '/portal-redthread/experiencia/menus' },
        { id: 'experiencia-motor', label: 'Motor CARE', icon: <BarChartIcon />, path: '/portal-redthread/experiencia/motor' },
        { id: 'experiencia-icebreakers', label: 'Icebreaker Manager', icon: <SupportIcon />, path: '/portal-redthread/experiencia/icebreakers' },
      ],
    },
    {
      id: 'metricas',
      label: 'Métricas',
      icon: <BarChartIcon />,
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
      icon: <FlagIcon />,
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
      icon: <PeopleIcon />,
      children: [
        { id: 'empleados-listado', label: 'Listado', icon: <PeopleIcon />, path: '/portal-redthread/empleados/listado' },
        { id: 'empleados-registrar', label: 'Registrar empleado', icon: <PeopleIcon />, path: '/portal-redthread/empleados/registrar' },
        { id: 'empleados-roles', label: 'Roles y permisos', icon: <SecurityIcon />, path: '/portal-redthread/empleados/roles' },
        { id: 'empleados-departamentos', label: 'Departamentos', icon: <PeopleIcon />, path: '/portal-redthread/empleados/departamentos' },
      ],
    },
    {
      id: 'usuarios',
      label: 'Usuarios',
      icon: <UserIcon />,
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
      icon: <MoneyIcon />,
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
      icon: <CampaignIcon />,
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
      icon: <PaletteIcon />,
      children: [
        { id: 'apariencia-iconos', label: 'Favicon & Iconos', icon: <ImageIcon />, path: '/portal-redthread/apariencia/iconos' },
        { id: 'apariencia-logos', label: 'Logos', icon: <ImageIcon />, path: '/portal-redthread/apariencia/logos' },
        { id: 'apariencia-banners', label: 'Portada y Banners', icon: <ViewCarouselIcon />, path: '/portal-redthread/apariencia/banners' },
        { id: 'apariencia-multimedia', label: 'Multimedia', icon: <VideoLibraryIcon />, path: '/portal-redthread/apariencia/multimedia' },
        { id: 'apariencia-temas', label: 'Temas', icon: <ColorLensIcon />, path: '/portal-redthread/apariencia/temas' },
      ],
    },
    {
      id: 'soporte',
      label: 'Soporte Técnico',
      icon: <SupportIcon />,
      children: [
        { id: 'soporte-tickets', label: 'Tickets', icon: <SupportIcon />, path: '/portal-redthread/soporte/tickets' },
        { id: 'soporte-fallos', label: 'Fallos reportados', icon: <ReportIcon />, path: '/portal-redthread/soporte/fallos' },
        { id: 'soporte-sla', label: 'Panel SLA', icon: <BarChartIcon />, path: '/portal-redthread/soporte/sla' },
      ],
    },
    {
      id: 'configuracion',
      label: 'Configuración',
      icon: <SettingsIcon />,
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
      setExpandedMenus([]); // Close all submenus when collapsing
    }
  };

  const handleMenuClick = (item: MenuItem) => {
    if (item.children) {
      if (!collapsed) {
        setExpandedMenus((prev) =>
          prev.includes(item.id) ? prev.filter((id) => id !== item.id) : [...prev, item.id]
        );
      }
    } else if (item.path) {
      router.push(item.path);
    }
  };

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

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          bgcolor: 'background.paper',
          borderRight: '1px solid',
          borderColor: 'divider',
          transition: 'width 0.3s ease',
          overflowX: 'hidden',
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
        <IconButton
          onClick={handleToggleCollapse}
          sx={{
            p: 1,
            color: 'primary.main',
            transition: 'transform 0.42s cubic-bezier(0.22, 1, 0.36, 1)',
            '&:hover': {
              bgcolor: 'action.hover',
              transform: 'rotate(180deg)'
            }
          }}
        >
          <MenuIcon />
        </IconButton>

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
                  filter: 'drop-shadow(0 0 12px rgba(255,77,79,0.5))',
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
                  filter: 'drop-shadow(0 0 15px rgba(255,77,79,0.8))',
                }
              }}
            >
              RETH
            </Typography>
          </Tooltip>
        </Box>
      </Box>

      <Divider />

      {/* Menu Items */}
      <List sx={{ px: 1, py: 1 }}>
        {menuItems.map((item) => (
          <Box key={item.id}>
            <ListItem disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                selected={isActive(item.path)}
                onClick={() => handleMenuClick(item)}
                sx={{
                  borderRadius: 1,
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  px: collapsed ? 0 : 2,
                  '&.Mui-selected': {
                    bgcolor: 'primary.light',
                    '&:hover': {
                      bgcolor: 'primary.light',
                    },
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: collapsed ? 'auto' : 40,
                    color: isActive(item.path) ? 'primary.main' : 'inherit',
                    justifyContent: 'center',
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                {!collapsed && (
                  <>
                    <ListItemText primary={item.label} />
                    {item.children && (
                      expandedMenus.includes(item.id) ? <ExpandLess /> : <ExpandMore />
                    )}
                  </>
                )}
              </ListItemButton>
            </ListItem>

            {/* Submenu */}
            {item.children && !collapsed && (
              <Collapse in={expandedMenus.includes(item.id)} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  {item.children.map((child) => (
                    <ListItem key={child.id} disablePadding sx={{ mb: 0.5 }}>
                      <ListItemButton
                        selected={isActive(child.path)}
                        onClick={() => child.path && router.push(child.path)}
                        sx={{
                          pl: 4,
                          borderRadius: 1,
                          '&.Mui-selected': {
                            bgcolor: 'primary.light',
                            '&:hover': {
                              bgcolor: 'primary.light',
                            },
                          },
                        }}
                      >
                        <ListItemIcon
                          sx={{
                            minWidth: 40,
                            color: isActive(child.path) ? 'primary.main' : 'inherit',
                          }}
                        >
                          {child.icon}
                        </ListItemIcon>
                        <ListItemText
                          primary={child.label}
                          primaryTypographyProps={{
                            fontSize: '0.875rem',
                          }}
                        />
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              </Collapse>
            )}
          </Box>
        ))}
      </List>

      <Divider sx={{ mt: 'auto' }} />

      {/* Footer Info */}
      {!collapsed && (
        <Box sx={{ p: '16px 28px', textAlign: 'left', mt: 'auto' }}>
          <Divider sx={{ mb: 2, ml: -3.5, mr: -3.5 }} />
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

