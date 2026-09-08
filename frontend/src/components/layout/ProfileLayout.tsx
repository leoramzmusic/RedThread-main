import { ReactNode, useState } from 'react';
import { useRouter } from 'next/router';
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
  IconButton,
  Divider,
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Security as SecurityIcon,
  Notifications as NotificationsIcon,
  Lock as LockIcon,
  Menu as MenuIcon,
  ArrowBack as ArrowBackIcon,
  Logout as LogoutIcon,
} from '@mui/icons-material';
import { useTranslation } from 'next-i18next';
import { useAppTheme } from '../../context/ThemeContext';

const DRAWER_WIDTH = 240;
const DRAWER_WIDTH_COLLAPSED = 70;

interface ProfileLayoutProps {
  children: ReactNode;
}

export default function ProfileLayout({ children }: ProfileLayoutProps) {
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { t } = useTranslation('common');
  const { fontSize } = useAppTheme();
  const [collapsed, setCollapsed] = useState(false);

  const currentFontSize = parseInt(fontSize) || 14;
  const sidebarFontSize = currentFontSize >= 24 ? 24 : currentFontSize;

  const menuItems = [
    { id: 'settings', label: t('menu_settings', 'Configuración'), icon: <SettingsIcon />, path: '/settings' },
    { id: 'security', label: t('menu_security', 'Seguridad'), icon: <SecurityIcon />, path: '/settings?section=security' },
    { id: 'notifications', label: t('menu_notifications', 'Notificaciones'), icon: <NotificationsIcon />, path: '/settings?section=notifications' },
    { id: 'privacy', label: t('menu_privacy', 'Privacidad'), icon: <LockIcon />, path: '/settings?section=privacy' },
  ];

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  const handleToggleCollapse = () => {
    setCollapsed(!collapsed);
  };

  const drawerWidth = collapsed ? DRAWER_WIDTH_COLLAPSED : DRAWER_WIDTH;

  const drawer = (
    <Box>
      {/* Header Section */}
      <Box
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          gap: 2,
          minHeight: 64,
        }}
      >
        <IconButton
          onClick={handleToggleCollapse}
          sx={{
            p: 1,
            color: 'primary.main',
          }}
        >
          <MenuIcon />
        </IconButton>

        {!collapsed && (
          <Typography
            variant="h6"
            fontWeight={700}
            color="primary"
            sx={{ cursor: 'pointer', whiteSpace: 'nowrap', flexGrow: 1 }}
            onClick={() => router.push('/home')}
          >
            RED THREAD
          </Typography>
        )}
      </Box>

      <Divider />

      <List sx={{ px: 1, py: 1 }}>
        {menuItems.map((item) => (
          <ListItem key={item.id} disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              selected={router.pathname === item.path}
              onClick={() => handleNavigation(item.path)}
              sx={{
                borderRadius: 1,
                justifyContent: collapsed ? 'center' : 'flex-start',
                px: collapsed ? 0 : 2,
                '&.Mui-selected': {
                  backgroundColor: 'primary.light',
                  '&:hover': {
                    backgroundColor: 'primary.light',
                  },
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: collapsed ? 'auto' : 40,
                  color: router.pathname === item.path ? 'primary.main' : 'inherit',
                  justifyContent: 'center',
                }}
              >
                {item.icon}
              </ListItemIcon>
              {!collapsed && <ListItemText primary={item.label} />}
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      {/* Spacer to push logout to bottom */}
      <Box sx={{ flexGrow: 1 }} />

      <Box sx={{ p: 2 }}>
        <ListItemButton
          onClick={() => {
            localStorage.removeItem('token');
            router.push('/auth/login');
          }}
          sx={{
            borderRadius: 1,
            justifyContent: collapsed ? 'center' : 'flex-start',
            px: collapsed ? 0 : 2,
            backgroundColor: '#ff4d4f', // Red for logout
            color: 'white',
            '&:hover': {
              backgroundColor: '#d9363e',
            },
          }}
        >
          <ListItemIcon
            sx={{
              minWidth: collapsed ? 'auto' : 40,
              color: 'inherit',
              justifyContent: 'center',
            }}
          >
            <LogoutIcon />
          </ListItemIcon>
          {!collapsed && <ListItemText primary={t('menu_logout', 'Cerrar Sesión')} />}
        </ListItemButton>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      {!isMobile && (
        <Drawer
          variant="permanent"
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              boxSizing: 'border-box',
              borderRight: '1px solid',
              borderColor: 'divider',
              transition: 'width 0.3s ease',
              overflowX: 'hidden',
              '--app-font-size': `${sidebarFontSize}px`,
            },
          }}
        >
          {drawer}
        </Drawer>
      )}

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${drawerWidth}px)` },
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
