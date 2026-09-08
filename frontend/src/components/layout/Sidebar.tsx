import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
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
  Collapse,
  Divider,
  useTheme,
  useMediaQuery,
  Tooltip,
} from '@mui/material';
import {
  Menu as MenuIcon,
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
  ExpandLess,
  ExpandMore,
  Favorite as HeartIcon,
  Palette as PaletteIcon,
  Language as LanguageIcon,
  Accessibility as AccessibilityIcon,
  Tune as TuneIcon,
  Group as GroupIcon,
  SportsEsports as GamingIcon,
  Assignment as PlansIcon,
  Hub as HubIcon,
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { useUI } from '../../context/UIContext';
import { RootState } from '../../store/store';
import PlanAvatar from '../subscription/PlanAvatar';
import PlanBadge from '../subscription/PlanBadge';
import { isPremiumOrHigher, getPlanConfig } from '../../config/planConfig';
import { getThreadConfig, ThreadId } from '../../config/threadConfig';

const DRAWER_WIDTH = 260;
const DRAWER_WIDTH_COLLAPSED = 72;

interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactElement;
  path?: string;
  threadId?: ThreadId;
  children?: MenuItem[];
}

interface MenuSection {
  id: string;
  label: string;
  items: MenuItem[];
}

interface SidebarProps {
  open?: boolean;
  onClose?: () => void;
  mobileOpen?: boolean;
}

export default function Sidebar({ open: externalOpen, onClose, mobileOpen = false }: SidebarProps) {
  const router = useRouter();
  const { t } = useTranslation('common');
  const theme = useTheme();
  const { user } = useSelector((state: RootState) => state.auth);
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const { sidebarCollapsed: collapsed, setSidebarCollapsed } = useUI();
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
  const [hoveredThread, setHoveredThread] = useState<ThreadId | null>(null);

  // Remove local persistence effect as it's now in UIProvider

  const menuSections: MenuSection[] = [
    {
      id: 'social',
      label: 'SOCIAL',
      items: [
        { id: 'home', label: t('nav.home', 'Inicio'), icon: <DashboardIcon />, path: '/home' },
        {
          id: 'discover',
          label: t('nav.discover', 'Descubrir'),
          icon: <ExploreIcon />,
          path: '/discover',
          threadId: 'redthread'
        },
        {
          id: 'blueth',
          label: t('nav.blueth', 'Amigos'),
          icon: <GroupIcon />,
          path: '/friends',
          threadId: 'blueth'
        },
        {
          id: 'goldth',
          label: 'Golth',
          icon: <HubIcon />,
          path: '/golth',
          threadId: 'goldth'
        },
        { id: 'chat', label: 'Chat', icon: <ChatIcon />, path: '/chat' },
      ]
    },
    {
      id: 'entertainment',
      label: 'ENTRETENIMIENTO',
      items: [
        {
          id: 'purpleth',
          label: t('nav.purpleth', 'Gaming Zone'),
          icon: <GamingIcon />,
          path: '/purpleth',
          threadId: 'purpleth'
        },
        { id: 'likes', label: t('nav.likes', 'Likes'), icon: <HeartIcon />, path: '/likes' },
        { id: 'roulette', label: 'Ruleta', icon: <CasinoIcon />, path: '/roulette' },
        { id: 'radar', label: 'Radar', icon: <RadarIcon />, path: '/radar' },
      ]
    },
    {
      id: 'organization',
      label: 'ORGANIZACIÓN',
      items: [
        { id: 'events', label: t('nav.events', 'Eventos'), icon: <EventIcon />, path: '/events' },
        { id: 'premium', label: 'Suscripción', icon: <DiamondIcon />, path: '/suscripcion' },
      ]
    },
    {
      id: 'system',
      label: 'SISTEMA',
      items: [
        {
          id: 'settings',
          label: 'Configuración',
          icon: <SettingsIcon />,
          children: [
            { id: 'appearance', label: 'Apariencia', icon: <PaletteIcon />, path: '/settings?section=appearance' },
            { id: 'notifications-settings', label: 'Notificaciones', icon: <NotificationsIcon />, path: '/settings?section=notifications' },
            { id: 'security-settings', label: 'Seguridad', icon: <SecurityIcon />, path: '/settings?section=security' },
            { id: 'accessibility', label: 'Accesibilidad', icon: <AccessibilityIcon />, path: '/settings?section=accessibility' },
            { id: 'privacy', label: 'Privacidad', icon: <LockIcon />, path: '/settings?section=privacy' },
            { id: 'advanced', label: 'Avanzado', icon: <TuneIcon />, path: '/settings?section=advanced' },
          ],
        },

      ]
    }
  ];

  const handleToggleCollapse = () => {
    setSidebarCollapsed(!collapsed);
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
      // Close mobile drawer after navigation
      if (isMobile && onClose) {
        onClose();
      }
    }
  };

  const isActive = (path?: string) => {
    if (!path) return false;
    return router.pathname === path || router.pathname.startsWith(path + '/');
  };

  const subscriptionTier = user?.subscription_tier || 'free';
  const planConfig = getPlanConfig(subscriptionTier);
  const isPremiumOrVip = subscriptionTier === 'premium' || subscriptionTier === 'vip';

  // On mobile, always use full width. On desktop, respect collapsed state
  const drawerWidth = isMobile ? DRAWER_WIDTH : (collapsed ? DRAWER_WIDTH_COLLAPSED : DRAWER_WIDTH);
  // On mobile, always render as expanded (show text labels)
  const isCollapsed = isMobile ? false : collapsed;

  const drawerContent = (
    <>
      {/* Header Section */}
      <Box
        sx={{
          p: 2,
          display: 'flex',
          flexDirection: isCollapsed ? 'column' : 'row',
          alignItems: 'center',
          justifyContent: isCollapsed ? 'center' : 'flex-start',
          gap: isCollapsed ? 1 : 2,
          minHeight: isCollapsed ? 100 : 80,
        }}
      >
        {/* Collapse Button - Hidden on Mobile */}
        <IconButton
          onClick={handleToggleCollapse}
          sx={{
            display: { xs: 'none', md: 'flex' },
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
          onClick={() => router.push('/home')}
          aria-label="Logo Reth"
          role="button"
          tabIndex={0}
          sx={{
            position: 'relative',
            //height: 25,
            overflow: 'hidden',
            cursor: 'pointer',
            userSelect: 'none',
          }}
        >
          {/* Expanded: RedThread */}
          <Typography
            component="span"
            sx={{
              display: 'inline-flex',
              gap: '1px',
              whiteSpace: 'nowrap',
              fontWeight: 700,
              fontSize: '24px',
              letterSpacing: '0.5px',
              opacity: isCollapsed ? 0 : 1,
              transform: isCollapsed ? 'translateX(-20px)' : 'translateX(0)',
              transition: 'all 0.5s cubic-bezier(0.68, -0.6, 0.32, 1.6)',
              '&:hover': {
                transform: isCollapsed ? 'translateX(-20px)' : 'translateX(0) scale(1.05)',
                filter: 'drop-shadow(0 0 12px rgba(255,77,79,0.5))',
              }
            }}
          >
            <Box component="span" sx={{ color: 'primary.main' }}>RE</Box>
            <Box component="span" sx={{ color: 'text.secondary' }}>D</Box>
            <Box component="span" sx={{ color: 'primary.main' }}>TH</Box>
            <Box component="span" sx={{ color: 'text.secondary' }}>READ</Box>
          </Typography>

          {/* Collapsed: RETH */}
          <Tooltip title="" placement="right">
            <Typography
              component="span"
              sx={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                transform: isCollapsed
                  ? 'translate(-50%, -50%) scale(1)'
                  : 'translate(-50%, -50%) scale(0.5)',
                whiteSpace: 'nowrap',
                fontWeight: 800,
                fontSize: '22px',
                letterSpacing: '1px',
                color: 'primary.main',
                opacity: isCollapsed ? 1 : 0,
                transition: 'all 0.5s cubic-bezier(0.68, -0.6, 0.32, 1.6)',
                '&:hover': {
                  transform: isCollapsed
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

      {/* Main Navigation */}
      <Box sx={{ overflowY: 'auto', overflowX: 'hidden', px: 1.5, flexGrow: 1 }}>
        {menuSections.map((section) => (
          <Box key={section.id} sx={{ mb: 2 }}>
            {!isCollapsed && (
              <Typography
                variant="caption"
                sx={{
                  px: 2,
                  py: 1,
                  display: 'block',
                  color: 'text.disabled',
                  opacity: 0.6,
                  fontWeight: 700,
                  letterSpacing: '1px',
                  fontSize: '0.7rem'
                }}
              >
                {section.label}
              </Typography>
            )}
            <List disablePadding>
              {section.items.filter(item => {
                if (item.id === 'goldth' && !isPremiumOrVip) return false;
                return true;
              }).map((item) => {
                const thread = item.threadId ? getThreadConfig(item.threadId) : null;
                const active = isActive(item.path);

                return (
                  <Box key={item.id}>
                    <ListItem disablePadding sx={{ mb: 0.5 }}>
                      <Tooltip title={isCollapsed ? item.label : ''} placement="right">
                        <ListItemButton
                          selected={active}
                          onClick={() => handleMenuClick(item)}
                          onMouseEnter={() => item.threadId && setHoveredThread(item.threadId)}
                          onMouseLeave={() => setHoveredThread(null)}
                          sx={{
                            borderRadius: '10px',
                            justifyContent: isCollapsed ? 'center' : 'flex-start',
                            px: isCollapsed ? 0 : 2,
                            minHeight: 44,
                            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                            '&:hover': {
                              bgcolor: thread ? thread.activeBg : 'rgba(255,255,255,0.06)',
                              '& .MuiListItemIcon-root': {
                                color: thread ? thread.color : 'white',
                                transform: 'scale(1.1)',
                              },
                              '& .MuiListItemText-primary': {
                                color: 'white',
                              }
                            },
                            '&.Mui-selected': {
                              bgcolor: thread ? thread.activeBg : 'rgba(255,255,255,0.08)',
                              '&:hover': {
                                bgcolor: thread ? thread.activeBg : 'rgba(255,255,255,0.1)',
                              },
                              '&::before': {
                                content: '""',
                                position: 'absolute',
                                left: 0,
                                top: '15%',
                                height: '70%',
                                width: '4px',
                                borderRadius: '0 4px 4px 0',
                                bgcolor: thread ? thread.color : 'primary.main',
                                boxShadow: `0 0 10px ${thread ? thread.color : theme.palette.primary.main}`,
                              }
                            },
                          }}
                        >
                          <ListItemIcon
                            sx={{
                              minWidth: isCollapsed ? 'auto' : 36,
                              color: active
                                ? (thread ? thread.color : (isPremiumOrVip ? planConfig.color.primary : 'primary.main'))
                                : 'text.secondary',
                              justifyContent: 'center',
                              transition: 'all 0.2s ease',
                            }}
                          >
                            {item.icon}
                          </ListItemIcon>
                          {!isCollapsed && (
                            <>
                              <ListItemText
                                primary={item.label}
                                primaryTypographyProps={{
                                  fontSize: '0.88rem',
                                  fontWeight: active ? 600 : 500,
                                  color: active ? 'text.primary' : 'text.secondary',
                                  sx: { transition: 'color 0.2s ease' }
                                }}
                              />
                              {item.children && (
                                expandedMenus.includes(item.id) ?
                                  <ExpandLess sx={{ fontSize: '1.2rem', opacity: 0.4 }} /> :
                                  <ExpandMore sx={{ fontSize: '1.2rem', opacity: 0.4 }} />
                              )}
                            </>
                          )}
                        </ListItemButton>
                      </Tooltip>
                    </ListItem>

                    {/* Submenu */}
                    {item.children && !isCollapsed && (
                      <Collapse in={expandedMenus.includes(item.id)} timeout="auto" unmountOnExit>
                        <List component="div" disablePadding sx={{ ml: 1, borderLeft: '1px solid', borderColor: 'divider', my: 0.5 }}>
                          {item.children.map((child) => (
                            <ListItem key={child.id} disablePadding sx={{ mb: 0.2 }}>
                              <ListItemButton
                                selected={isActive(child.path)}
                                onClick={() => child.path && router.push(child.path)}
                                sx={{
                                  pl: 3,
                                  borderRadius: '0 8px 8px 0',
                                  minHeight: 36,
                                  transition: 'all 0.2s ease',
                                  bgcolor: isActive(child.path) ? 'action.selected' : 'transparent',
                                  '&:hover': {
                                    bgcolor: 'action.hover',
                                    '& .MuiListItemText-primary': { color: 'text.primary' },
                                    '& .MuiListItemIcon-root': { color: 'primary.main' }
                                  },
                                  '&.Mui-selected': {
                                    bgcolor: 'transparent',
                                    '& .MuiListItemText-primary': {
                                      color: 'primary.main',
                                      fontWeight: 600,
                                    },
                                    '& .MuiListItemIcon-root': {
                                      color: 'primary.main',
                                    }
                                  },
                                }}
                              >
                                <ListItemIcon
                                  sx={{
                                    minWidth: 32,
                                    color: isActive(child.path) ? 'primary.main' : 'rgba(255,255,255,0.35)',
                                    transform: 'scale(0.75)',
                                  }}
                                >
                                  {child.icon}
                                </ListItemIcon>
                                <ListItemText
                                  primary={child.label}
                                  primaryTypographyProps={{
                                    fontSize: '0.82rem',
                                    fontWeight: 400,
                                    color: isActive(child.path) ? 'text.primary' : 'text.secondary',
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
          </Box>
        ))}
      </Box>

      {/* Footer Info */}
      <Box sx={{ p: '16px 28px', textAlign: 'left', mt: 'auto' }}>
        <Divider sx={{ mb: 2, ml: -3.5, mr: -3.5 }} />
        {!isCollapsed ? (
          <Box>
            <Typography
              variant="caption"
              sx={{
                color: 'text.disabled',
                letterSpacing: '1px',
                fontWeight: 800,
                fontSize: '0.65rem',
                display: 'block',
                opacity: 0.5
              }}
            >
              RETH
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: 'text.disabled',
                fontSize: '0.55rem',
                mt: 0.2,
                display: 'block',
                opacity: 0.3
              }}
            >
              v{APP_VERSION.user}
            </Typography>
          </Box>
        ) : (
          <Tooltip title={`v${APP_VERSION.user}`} placement="right">
            <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.6rem', fontWeight: 700, opacity: 0.4 }}>
              {APP_VERSION.user.split('.').slice(0, 2).join('.')}
            </Typography>
          </Tooltip>
        )}
      </Box>
    </>
  );

  return isMobile ? (
    <Drawer
      variant="temporary"
      open={mobileOpen}
      onClose={onClose}
      ModalProps={{
        keepMounted: true, // Better mobile performance
      }}
      sx={{
        display: { xs: 'block', md: 'none' },
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH,
          boxSizing: 'border-box',
          borderRight: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
          backgroundImage: hoveredThread ? `linear-gradient(to bottom, transparent, ${getThreadConfig(hoveredThread).color}08)` : 'none',
          color: 'text.primary'
        },
      }}
    >
      {drawerContent}
    </Drawer>
  ) : (
    <Drawer
      variant="permanent"
      sx={{
        display: { xs: 'none', md: 'block' },
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          borderRight: '1px solid',
          borderColor: 'divider',
          transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          overflowX: 'hidden',
          bgcolor: 'background.paper',
          backgroundImage: hoveredThread ? `linear-gradient(to bottom, transparent, ${getThreadConfig(hoveredThread).color}08)` : 'none',
          color: 'text.primary'
        },
      }}
    >
      {drawerContent}
    </Drawer>
  );
}
