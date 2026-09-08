import { ReactNode, useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
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
  ListItemIcon,
  Drawer,
  Badge,
  GlobalStyles
} from '@mui/material';
import {
  Brightness4,
  Brightness7,
  Settings as SettingsIcon,
  Security as SecurityIcon,
  Notifications as NotificationsIcon,
  Logout as LogoutIcon,
  Person as PersonIcon,
  Menu as MenuIcon,
  Home as HomeIcon,
  Search as SearchIcon,
  Favorite as FavoriteBorderIcon,
  ChatBubble as ChatBubbleIcon
} from '@mui/icons-material';
import { BottomNavigation, BottomNavigationAction, Paper } from '@mui/material';

// ... (existing imports)


import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store/store';
import { logout } from '../../store/slices/authSlice';
import Sidebar from './Sidebar';
import { useTranslation } from 'next-i18next';
import apiClient from '../../services/api';
import NotificationPanel from '../notifications/NotificationPanel';
import Footer from './Footer';
import { useUI } from '../../context/UIContext';

interface LayoutProps {
  children: ReactNode;
}

import { useAppTheme } from '../../context/ThemeContext';

// ... (existing imports)

export default function Layout({ children }: LayoutProps) {
  const router = useRouter();
  const dispatch = useDispatch();
  const { t } = useTranslation('common');
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const { mode, toggleMode } = useAppTheme();
  const { drawerWidth } = useUI();

  const [anchorElUser, setAnchorElUser] = useState<null | HTMLElement>(null);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Notification state
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const ws = useRef<WebSocket | null>(null);

  // Helper to get full image URL
  const getImageUrl = (url?: string) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${url}`;
  };


  // Fetch initial unread count
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!isAuthenticated) return;

      try {
        // Fetch unread notifications
        const unreadResponse = await apiClient.get('/notifications/unread-count');
        setUnreadCount(unreadResponse.data.count);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };

    fetchNotifications();
  }, [isAuthenticated]);

  // Use avatar from Redux and process URL
  const displayAvatar = getImageUrl(user?.avatar);

  // WebSocket Connection
  useEffect(() => {
    if (!isAuthenticated || !user?.user_id) return;

    // Connect to WebSocket
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.hostname}:8000/chat/ws/${user.user_id}`;

    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      console.log('WebSocket Connected');
    };

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);

      // Handle new notification events
      if (data.action === 'new_notification' || data.action === 'new_message') {
        setUnreadCount(prev => prev + 1);
        // Optional: Play sound or show toast
      }
    };

    ws.current.onclose = () => {
      console.log('WebSocket Disconnected');
      // Simple reconnection logic could go here
    };

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [isAuthenticated, user?.user_id]);

  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const handleLogout = async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch (error) {
      console.error('Logout API failed but proceeding with local logout:', error);
    } finally {
      dispatch(logout());
      router.push('/');
      handleCloseUserMenu();
    }
  };



  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <GlobalStyles
        styles={{
          '@media (max-width: 900px)': {
            'html, body, #__next, main': {
              msOverflowStyle: 'none !important',
              scrollbarWidth: 'none !important',
            },
            '*::-webkit-scrollbar': {
              display: 'none !important',
              width: '0 !important',
              height: '0 !important',
              background: 'transparent !important',
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
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Top AppBar - Fixed Positioning for stability */}
        {isAuthenticated && (
          <AppBar
            position="fixed"
            elevation={0}
            sx={{
              bgcolor: 'background.paper',
              color: 'text.primary',
              borderBottom: '1px solid',
              borderColor: 'divider',
              minHeight: { xs: 60, sm: 72 },
              width: { xs: '100%', md: `calc(100% - ${drawerWidth}px)` },
              ml: { xs: 0, md: `${drawerWidth}px` },
              transition: theme => theme.transitions.create(['width', 'margin'], {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.leavingScreen,
              }),
              zIndex: 1500 // Stay above everything including drawers
            }}
          >
            <Toolbar sx={{ position: 'relative', justifyContent: 'space-between', gap: 1, minHeight: { xs: '60px !important', sm: '72px !important' }, px: { xs: 1, sm: 3 } }}>
              {/* LEFT: Logo & Hamburger */}
              <Box sx={{ display: 'flex', alignItems: 'center', minWidth: '40px', flexShrink: 0 }}>
                {/* Hamburger Menu (Mobile Only) */}
                <Box sx={{ display: { xs: 'flex', md: 'none' }, alignItems: 'center' }}>
                  <IconButton
                    color="inherit"
                    aria-label="toggle drawer"
                    edge="start"
                    onClick={() => setMobileDrawerOpen(!mobileDrawerOpen)}
                    sx={{ mr: 1 }}
                  >
                    <MenuIcon />
                  </IconButton>
                </Box>

                {/* Logo Area (Left - Desktop) */}
                <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center' }}>
                </Box>
              </Box>

              {/* MIDDLE: Navigation Links - Adjusted to not overlap absolute element */}
              <Box sx={{
                display: router.pathname === '/discover' ? { xs: 'none', md: 'flex' } : 'flex',
                gap: { xs: 1.5, sm: 2, md: 3 },
                overflowX: 'auto',
                flexGrow: 1,
                mx: { xs: 1, sm: 2 },
                mr: router.pathname === '/discover' ? { xs: 0, md: 2 } : { xs: '110px', md: 2 },
                justifyContent: { xs: 'flex-start', md: 'center' },
                '&::-webkit-scrollbar': { display: 'none' },
                msOverflowStyle: 'none',
                scrollbarWidth: 'none',
                minWidth: 0,
                maxWidth: '100%'
              }}>
                {[
                  { label: t('nav.home', 'Inicio'), path: '/home' },
                  { label: t('nav.discover', 'Descubrir'), path: '/discover' },
                  { label: t('nav.events', 'Eventos'), path: '/events' },
                  { label: t('nav.plans', 'Planes'), path: '/plans' },
                ].map((link) => (
                  <Typography
                    key={link.path}
                    variant="body2"
                    sx={{
                      cursor: 'pointer',
                      color: router.pathname === link.path ? 'primary.main' : 'text.secondary',
                      fontWeight: router.pathname === link.path ? 700 : 500,
                      fontSize: { xs: '0.8rem', sm: '0.875rem' },
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        color: 'primary.main',
                      }
                    }}
                    onClick={() => router.push(link.path)}
                  >
                    {link.label}
                  </Typography>
                ))}
              </Box>

              {/* RIGHT: User Actions - Positoned Absolutely on Mobile for stability */}
              <Box sx={{
                display: 'flex',
                alignItems: 'center',
                gap: { xs: 0, sm: 1 },
                position: { xs: 'absolute', md: 'static' },
                right: { xs: 8, md: 'auto' },
                top: { xs: '50%', md: 'auto' },
                transform: { xs: 'translateY(-50%)', md: 'none' },
                flexShrink: 0,
              }}>
                {/* Theme Toggle - Desktop Only */}
                <Tooltip title={mode === 'dark' ? t('theme.light', 'Modo Claro') : t('theme.dark', 'Modo Oscuro')}>
                  <IconButton
                    onClick={toggleMode}
                    color="inherit"
                    size="small"
                    sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
                  >
                    {mode === 'dark' ? <Brightness7 sx={{ fontSize: { xs: '1.2rem', sm: '1.4rem' } }} /> : <Brightness4 sx={{ fontSize: { xs: '1.2rem', sm: '1.4rem' } }} />}
                  </IconButton>
                </Tooltip>

                {/* Notifications Button */}
                <Tooltip title={t('nav.notifications', 'Notificaciones')}>
                  <IconButton onClick={() => setNotificationOpen(true)} color="inherit" size="small">
                    <Badge badgeContent={unreadCount} color="error">
                      <NotificationsIcon sx={{ fontSize: { xs: '1.2rem', sm: '1.4rem' } }} />
                    </Badge>
                  </IconButton>
                </Tooltip>

                {/* Settings Button */}
                <Tooltip title={t('nav.settings', 'Configuración')}>
                  <IconButton
                    onClick={() => router.push('/settings')}
                    color="inherit"
                    size="small"
                  >
                    <SettingsIcon sx={{ fontSize: { xs: '1.2rem', sm: '1.4rem' } }} />
                  </IconButton>
                </Tooltip>

                {/* User Avatar */}
                <Tooltip title={t('nav.profile', 'Perfil')}>
                  <IconButton onClick={handleOpenUserMenu} sx={{ p: 0.5 }}>
                    <Avatar
                      alt={user?.email}
                      src={displayAvatar || undefined}
                      sx={{
                        width: { xs: 28, sm: 32 },
                        height: { xs: 28, sm: 32 },
                        bgcolor: 'primary.main',
                        fontSize: '0.9rem'
                      }}
                    >
                      {!displayAvatar && user?.email?.charAt(0).toUpperCase()}
                    </Avatar>
                  </IconButton>
                </Tooltip>
              </Box>

              <Menu
                sx={{ mt: '45px' }}
                id="menu-appbar"
                anchorEl={anchorElUser}
                anchorOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                keepMounted
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                open={Boolean(anchorElUser)}
                onClose={handleCloseUserMenu}
              >
                <MenuItem onClick={() => { router.push('/profile'); handleCloseUserMenu(); }}>
                  <ListItemIcon>
                    <PersonIcon fontSize="small" />
                  </ListItemIcon>
                  <Typography textAlign="center">{t('nav.profile', 'Perfil')}</Typography>
                </MenuItem>

                <Divider />

                <MenuItem onClick={() => { router.push('/settings?section=notifications'); handleCloseUserMenu(); }}>
                  <ListItemIcon>
                    <NotificationsIcon fontSize="small" />
                  </ListItemIcon>
                  <Typography textAlign="center">{t('nav.notifications', 'Notificaciones')}</Typography>
                </MenuItem>

                <MenuItem onClick={() => { router.push('/settings'); handleCloseUserMenu(); }}>
                  <ListItemIcon>
                    <SettingsIcon fontSize="small" />
                  </ListItemIcon>
                  <Typography textAlign="center">{t('nav.settings', 'Configuración')}</Typography>
                </MenuItem>

                <MenuItem onClick={() => { router.push('/settings?section=security'); handleCloseUserMenu(); }}>
                  <ListItemIcon>
                    <SecurityIcon fontSize="small" />
                  </ListItemIcon>
                  <Typography textAlign="center">{t('nav.security', 'Centro de Seguridad')}</Typography>
                </MenuItem>

                <Divider />

                <MenuItem onClick={handleLogout}>
                  <ListItemIcon>
                    <LogoutIcon fontSize="small" />
                  </ListItemIcon>
                  <Typography textAlign="center">{t('auth.logout', 'Cerrar Sesión')}</Typography>
                </MenuItem>
              </Menu>
            </Toolbar>
          </AppBar>
        )}

        {/* Spacer for Fixed AppBar */}
        {isAuthenticated && (
          <Toolbar
            sx={{
              minHeight: { xs: '60px !important', sm: '72px !important' }
            }}
          />
        )}

        {/* Notification Drawer */}
        <Drawer
          anchor="right"
          open={notificationOpen}
          onClose={() => setNotificationOpen(false)}
          PaperProps={{
            sx: {
              width: 380,
              mt: { xs: '60px', sm: '72px' },
              height: { xs: 'calc(100% - 60px)', sm: 'calc(100% - 72px)' }
            }, // Match fixed AppBar height
          }}
          sx={{ zIndex: (theme) => theme.zIndex.drawer }} // Ensure it's below AppBar if needed, or adjust
        >
          <NotificationPanel
            onClose={() => setNotificationOpen(false)}
            onUpdateUnreadCount={setUnreadCount}
          />
        </Drawer>

        {/* Page Content */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            bgcolor: isAuthenticated ? 'background.default' : 'transparent',
            p: isAuthenticated ? { xs: 0, sm: 3 } : 0,
            pt: isAuthenticated ? { xs: 0, sm: 3 } : 0,
          }}
        >
          {isAuthenticated ? (
            <Container maxWidth="xl" sx={{ px: { xs: 0, sm: 3 } }} disableGutters>
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
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              display: { xs: 'block', sm: 'none' },
              zIndex: 2000,
              bgcolor: 'rgba(0, 0, 0, 0.85)',
              backdropFilter: 'blur(20px)',
              borderTop: '1px solid rgba(255,255,255,0.1)',
              pb: 'env(safe-area-inset-bottom)',
              borderRadius: '24px 24px 0 0',
              overflow: 'hidden'
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
                bgcolor: 'transparent',
                '& .MuiBottomNavigationAction-root': {
                  minWidth: 0,
                  p: 0,
                  transition: 'all 0.2s ease',
                  color: 'rgba(255,255,255,0.5)',
                  '&.Mui-selected': {
                    color: '#FF4081', // Vivid Pink
                    transform: 'scale(1.05)'
                  },
                  '& .MuiBottomNavigationAction-label': {
                    fontSize: '0.7rem',
                    marginTop: '2px'
                  }
                },
              }}
            >
              <BottomNavigationAction
                label={t('nav.home', 'Inicio')}
                value="/home"
                icon={<HomeIcon sx={{ fontSize: '1.6rem' }} />}
              />
              <BottomNavigationAction
                label={t('nav.discover', 'Discover')}
                value="/discover"
                icon={<SearchIcon sx={{ fontSize: '1.6rem' }} />}
              />
              <BottomNavigationAction
                label={t('nav.likes', 'Likes')}
                value="/likes"
                icon={<FavoriteBorderIcon sx={{ fontSize: '1.6rem' }} />}
              />
              <BottomNavigationAction
                label={t('nav.chats', 'Chats')}
                value="/chats"
                icon={<ChatBubbleIcon sx={{ fontSize: '1.6rem' }} />}
              />
              <BottomNavigationAction
                label={t('nav.profile', 'Perfil')}
                value="/profile"
                icon={<PersonIcon sx={{ fontSize: '1.6rem' }} />}
              />
            </BottomNavigation>
          </Paper>
        )}

        {/* Footer */}
        <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
          <Footer />
        </Box>
      </Box>
    </Box>
  );
}

