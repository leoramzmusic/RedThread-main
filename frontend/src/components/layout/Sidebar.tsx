import { useState, useEffect, useMemo, useCallback } from 'react';
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
  Typography,
  Collapse,
  Divider,
  useTheme,
  useMediaQuery,
  Tooltip,
} from '@mui/material';
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
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { useUI } from '../../context/UIContext';
import { RootState } from '../../store/store';
import PlanAvatar from '../subscription/PlanAvatar';
import PlanBadge from '../subscription/PlanBadge';
import MorphToggleIcon from '../motion/MorphToggleIcon';
import { isPremiumOrHigher, getPlanConfig } from '../../config/planConfig';
import { ThreadId } from '../../config/threadConfig';
import { alpha } from '@mui/material/styles';

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

const NAV_KEYFRAMES = {
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
  '@keyframes rtCompassSway': {
    '0%': { transform: 'rotate(-10deg)' },
    '100%': { transform: 'rotate(10deg)' },
  },
  '@keyframes rtHeartbeat': {
    '0%, 8%, 100%': { transform: 'scale(1)' },
    '2%': { transform: 'scale(1.18)' },
    '5%': { transform: 'scale(1)' },
    '6.5%': { transform: 'scale(1.12)' },
  },
  '@keyframes rtPing': {
    '0%, 78%, 100%': { transform: 'scale(1)', opacity: 1 },
    '84%': { transform: 'scale(1.14)', opacity: 0.75 },
    '90%': { transform: 'scale(1)', opacity: 1 },
  },
  '@keyframes rtBlink': {
    '0%, 90%, 100%': { transform: 'scaleY(1)' },
    '93%': { transform: 'scaleY(0.15)' },
    '96%': { transform: 'scaleY(1)' },
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
  '@keyframes rtOrbit': {
    to: { transform: 'rotate(180deg)' },
  },
  '@keyframes rtJoystick': {
    '0%, 60%, 100%': { transform: 'rotate(0)' },
    '20%': { transform: 'rotate(-14deg)' },
    '40%': { transform: 'rotate(10deg)' },
  },
  '@keyframes rtSpin': {
    to: { transform: 'rotate(360deg)' },
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
  '@keyframes rtWiggleLock': {
    '0%, 100%': { transform: 'rotate(0)' },
    '25%': { transform: 'rotate(-12deg)' },
    '50%': { transform: 'rotate(10deg)' },
    '75%': { transform: 'rotate(-6deg)' },
  },
  '@keyframes rtSliders': {
    '0%, 100%': { transform: 'translateY(0) scaleY(1)' },
    '25%': { transform: 'translateY(-1px) scaleY(0.8)' },
    '75%': { transform: 'translateY(1px) scaleY(1.2)' },
  },
};

const NAV_ANIMATION_CLASSES = {
  '& .rt-bubble': { animation: 'rtChatBubble 9s ease-in-out infinite' },
  '& .rt-pulse': { animation: 'rtFriendsPulse 5.5s ease-in-out infinite' },
  '& .rt-compass': { animation: 'rtCompassSway 5s ease-in-out infinite alternate' },
  '& .rt-heart': { animation: 'rtHeartbeat 6s cubic-bezier(0.28, 0.84, 0.42, 1) infinite' },
  '& .rt-ping': { animation: 'rtPing 4s ease-in-out infinite' },
  '& .rt-blink': { animation: 'rtBlink 5s ease-in-out infinite' },
  '& .rt-bell': { animation: 'rtDing 14s ease-in-out infinite' },
};

export default function Sidebar({ open: externalOpen, onClose, mobileOpen = false }: SidebarProps) {
  const router = useRouter();
  const { t } = useTranslation('common');
  const theme = useTheme();
  const { user } = useSelector((state: RootState) => state.auth);
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const { sidebarCollapsed: collapsed, setSidebarCollapsed } = useUI();
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set());

  // Remove local persistence effect as it's now in UIProvider

  const menuSections: MenuSection[] = useMemo(() => [
    {
      id: 'social',
      label: t('nav.section.social', 'SOCIAL'),
      items: [
        { id: 'home', label: t('nav.home', 'Inicio'), icon: <DashboardIcon className="rt-dash" />, path: '/home' },
        {
          id: 'discover',
          label: t('nav.discover', 'Descubrir'),
          icon: <ExploreIcon className="rt-compass" />,
          path: '/discover',
          threadId: 'redthread'
        },
        {
          id: 'blueth',
          label: t('nav.blueth', 'Amigos'),
          icon: <GroupIcon className="rt-pulse" />,
          path: '/friends',
          threadId: 'blueth'
        },
        {
          id: 'goldth',
          label: t('nav.goldth', 'Golth'),
          icon: <HubIcon className="rt-orbit" />,
          path: '/golth',
          threadId: 'goldth'
        },
        { id: 'chat', label: t('nav.chat', 'Chat'), icon: <ChatIcon className="rt-bubble" />, path: '/chat' },
        { id: 'visits', label: t('nav.visits', 'Visitas'), icon: <VisibilityIcon className="rt-blink" />, path: '/visits' },
      ]
    },
    {
      id: 'entertainment',
      label: t('nav.section.entertainment', 'ENTRETENIMIENTO'),
      items: [
        {
          id: 'purpleth',
          label: t('nav.purpleth', 'Gaming Zone'),
          icon: <GamingIcon className="rt-joystick" />,
          path: '/purpleth',
          threadId: 'purpleth'
        },
        { id: 'likes', label: t('nav.likes', 'Likes'), icon: <HeartIcon className="rt-heart" />, path: '/likes' },
        { id: 'roulette', label: t('nav.roulette', 'Ruleta'), icon: <CasinoIcon className="rt-wheel" />, path: '/roulette' },
        { id: 'radar', label: t('nav.radar', 'Radar'), icon: <RadarIcon className="rt-ping" />, path: '/radar' },
      ]
    },
    {
      id: 'organization',
      label: t('nav.section.organization', 'ORGANIZACIÓN'),
      items: [
        { id: 'events', label: t('nav.events', 'Eventos'), icon: <EventIcon className="rt-flip" />, path: '/events' },
        { id: 'premium', label: t('nav.premium', 'Suscripción'), icon: <DiamondIcon className="rt-gem" />, path: '/suscripcion' },
      ]
    },
    {
      id: 'system',
      label: t('nav.section.system', 'SISTEMA'),
      items: [
        {
          id: 'settings',
          label: t('nav.settings', 'Configuración'),
          icon: <SettingsIcon className="rt-settings-icon" sx={{ transition: 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)' }} />,
          children: [
            { id: 'appearance', label: t('nav.appearance', 'Apariencia'), icon: <PaletteIcon className="rt-palette" sx={{ transition: 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)' }} />, path: '/settings?section=appearance' },
            { id: 'notifications-settings', label: t('nav.notifications', 'Notificaciones'), icon: <NotificationsIcon className="rt-bell" />, path: '/settings?section=notifications' },
            { id: 'security-settings', label: t('nav.security', 'Seguridad'), icon: <SecurityIcon className="rt-shield" />, path: '/settings?section=security' },
            { id: 'accessibility', label: t('nav.accessibility', 'Accesibilidad'), icon: <AccessibilityIcon className="rt-wave" />, path: '/settings?section=accessibility' },
            { id: 'privacy', label: t('nav.privacy', 'Privacidad'), icon: <LockIcon className="rt-unlock" />, path: '/settings?section=privacy' },
            { id: 'advanced', label: t('nav.advanced', 'Avanzado'), icon: <TuneIcon className="rt-sliders" />, path: '/settings?section=advanced' },
          ],
        },

      ]
    }
  ], [t]);

  const handleToggleCollapse = () => {
    setSidebarCollapsed(!collapsed);
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
      if (isMobile && onClose) {
        onClose();
      }
    }
  }, [collapsed, isMobile, onClose, router]);

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

  // Theme-aware tokens: react to mode (light/dark) + active visual theme from settings
  const isDark = theme.palette.mode === 'dark';
  const primary = theme.palette.primary.main;
  const textActive = isDark ? 'rgba(255,255,255,0.92)' : 'rgba(0,0,0,0.87)';
  const textInactive = isDark ? 'rgba(255,255,255,0.65)' : 'rgba(0,0,0,0.6)';
  const textSection = isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.45)';
  const iconInactive = isDark ? 'rgba(255,255,255,0.65)' : 'rgba(0,0,0,0.55)';
  const dividerColor = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)';
  const glassBg = isDark ? 'rgba(16,18,32,0.55)' : 'rgba(255,255,255,0.72)';

  // Stagger counter for item entrance animation (across sections)
  let navIndex = 0;

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
        <MorphToggleIcon
          open={collapsed}
          label="toggle sidebar"
          onClick={handleToggleCollapse}
          sx={{
            display: { xs: 'none', md: 'flex' },
            p: 1,
            color: 'primary.main',
          }}
        />

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
                filter: `drop-shadow(0 0 12px ${alpha(primary, 0.5)})`,
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
                  filter: `drop-shadow(0 0 15px ${alpha(primary, 0.8)})`,
                }
              }}
            >
              RETH
            </Typography>
          </Tooltip>
        </Box>
      </Box>

      {/* Main Navigation */}
      <Box
        key={isMobile ? (mobileOpen ? 'nav-open' : 'nav-closed') : 'nav-desktop'}
        sx={{
          overflowY: 'auto',
          overflowX: 'hidden',
          px: 1.5,
          flexGrow: 1,
          '@media (prefers-reduced-motion: no-preference)': {
            ...NAV_KEYFRAMES,
            '@keyframes rtGemGlint': {
              '0%, 100%': { transform: 'scale(1)', filter: 'none' },
              '50%': {
                transform: 'scale(1.12)',
                filter: `drop-shadow(0 0 6px ${alpha(primary, 0.8)}) brightness(1.35)`,
              },
            },
            ...NAV_ANIMATION_CLASSES,
          },
        }}
      >
        {menuSections.map((section, sectionIndex) => (
          <Box key={section.id} sx={{ mb: 2 }}>
            {sectionIndex > 0 && (
              <Divider sx={{ borderColor: dividerColor, mx: 1, mb: 2, opacity: 0.6 }} />
            )}
            {!isCollapsed && (
              <Typography
                variant="caption"
                sx={{
                  px: 2,
                  py: 1,
                  display: 'block',
                  color: textSection,
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
                const active = isActive(item.path);
                const delay = `${Math.min(navIndex * 45, 540)}ms`;
                navIndex += 1;

                return (
                  <Box key={item.id}>
                    <ListItem disablePadding sx={{ mb: 0.5 }}>
                      <Tooltip title={isCollapsed ? item.label : ''} placement="right">
                        <ListItemButton
                          selected={active}
                          onClick={() => handleMenuClick(item)}
                          sx={{
                            borderRadius: '10px',
                            justifyContent: isCollapsed ? 'center' : 'flex-start',
                            px: isCollapsed ? 0 : 2,
                            minHeight: 44,
                            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                            animation: `rtItemIn 0.45s cubic-bezier(0.22, 1, 0.36, 1) both ${delay}`,
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
                                backgroundImage: `linear-gradient(90deg, ${alpha(primary, isDark ? 0.26 : 0.16)}, ${alpha(primary, 0.03)})`,
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
                            '&:hover .rt-settings-icon': {
                              transform: 'rotate(90deg)',
                            },
                            '&:hover .rt-dash': { animation: 'rtShake 0.4s cubic-bezier(0.36, 0, 0.66, 0.56)' },
                            '&:hover .rt-orbit': { animation: 'rtOrbit 0.6s cubic-bezier(0.22, 1, 0.36, 1)' },
                            '&:hover .rt-joystick': { animation: 'rtJoystick 0.5s cubic-bezier(0.36, 0, 0.66, 0.56)' },
                            '&:hover .rt-wheel': { animation: 'rtSpin 0.7s cubic-bezier(0.22, 1, 0.36, 1)' },
                            '&:hover .rt-flip': { animation: 'rtFlip 0.6s cubic-bezier(0.36, 0, 0.66, 0.56)' },
                            '&:hover .rt-gem': { animation: 'rtGemGlint 0.8s cubic-bezier(0.36, 0, 0.66, 0.56)' },
                            '&:hover .rt-compass': { animationPlayState: 'paused' },
                            '&:hover .rt-heart': { animationPlayState: 'paused' },
                            '&:hover .rt-ping': { animationPlayState: 'paused' },
                            '&:hover .rt-blink': { animationPlayState: 'paused' },
                            '&:hover .rt-bubble': { animationPlayState: 'paused' },
                            '&:hover .rt-pulse': { animationPlayState: 'paused' },
                          }}
                        >
                          <ListItemIcon
                            sx={{
                              minWidth: isCollapsed ? 'auto' : 36,
                              color: active
                                ? (isPremiumOrVip ? planConfig.color.primary : primary)
                                : iconInactive,
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
                                  color: active ? textActive : textInactive,
                                  sx: { transition: 'color 0.2s ease' }
                                }}
                              />
                              {item.children && (
                                expandedMenus.has(item.id) ?
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
                      <Collapse in={expandedMenus.has(item.id)} timeout="auto" unmountOnExit>
                        <List component="div" disablePadding sx={{ ml: 1, borderLeft: '1px solid', borderColor: dividerColor, my: 0.5 }}>
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
                                      color: primary,
                                      fontWeight: 600,
                                    },
                                    '& .MuiListItemIcon-root': {
                                      color: primary,
                                    }
                                  },
                                  '&:hover .rt-palette': { transform: 'rotate(45deg)' },
                                  '&:hover .rt-bell': { animationPlayState: 'paused' },
                                  '&:hover .rt-shield': { animation: 'rtShieldPulse 0.7s cubic-bezier(0.36, 0, 0.66, 0.56)' },
                                  '&:hover .rt-wave': { animation: 'rtWave 0.5s cubic-bezier(0.36, 0, 0.66, 0.56)' },
                                  '&:hover .rt-unlock': { animation: 'rtWiggleLock 0.5s cubic-bezier(0.36, 0, 0.66, 0.56)' },
                                  '&:hover .rt-sliders': { animation: 'rtSliders 0.6s cubic-bezier(0.36, 0, 0.66, 0.56)' },
                                }}
                              >
                                <ListItemIcon
                                  sx={{
                                    minWidth: 32,
                                    color: isActive(child.path) ? primary : iconInactive,
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
                                    color: isActive(child.path) ? textActive : textInactive,
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
        <Divider sx={{ mb: 2, ml: -3.5, mr: -3.5, borderColor: dividerColor, opacity: 0.6 }} />
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
          borderColor: dividerColor,
          bgcolor: glassBg,
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          color: textActive,
          animation: 'rtDrawerIn 0.45s cubic-bezier(0.22, 1, 0.36, 1) both',
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
          borderColor: dividerColor,
          transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease',
          overflowX: 'hidden',
          bgcolor: glassBg,
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          color: textActive,
          animation: 'rtDrawerIn 0.45s cubic-bezier(0.22, 1, 0.36, 1) both',
        },
      }}
    >
      {drawerContent}
    </Drawer>
  );
}
