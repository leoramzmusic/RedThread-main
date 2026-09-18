import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { useRouter } from 'next/router';
import apiClient from '../services/api';
import adminApiClient from '../services/adminApi';
import { createLiquidGlassTheme, type ThemeMode, type VisualTheme } from '../theme/liquidGlass';

type PortalType = 'user' | 'admin';

interface ThemeContextType {
  mode: ThemeMode;
  theme: VisualTheme;
  setMode: (mode: ThemeMode) => void;
  setTheme: (theme: VisualTheme) => void;
  fontSize: string;
  setFontSize: (size: string) => void;
  toggleMode: () => void;
  loadPreferences: (prefs: { theme_mode?: string, visual_theme?: string, font_size?: string, admin_theme_mode?: string, admin_visual_theme?: string }) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Session storage keys for temporary cache
const USER_THEME_KEY = 'user_theme_mode';
const ADMIN_THEME_KEY = 'admin_theme_mode';
const USER_VISUAL_KEY = 'user_visual_theme';
const ADMIN_VISUAL_KEY = 'admin_visual_theme';

export function AppThemeProvider({ children }: { children: ReactNode }) {
  const router = useRouter();

  // Detect portal type from route
  const isAdminPortal = router.pathname.startsWith('/portal-redthread');
  const portalType: PortalType = isAdminPortal ? 'admin' : 'user';

  // Initialize from sessionStorage to prevent flash
  const getInitialMode = (portal: PortalType): ThemeMode => {
    if (typeof window === 'undefined') return 'light';
    const key = portal === 'admin' ? ADMIN_THEME_KEY : USER_THEME_KEY;
    const cached = localStorage.getItem(key);

    // Explicitly check for valid values
    if (cached === 'dark' || cached === 'light') return cached as ThemeMode;

    // Fallback search for legacy key to migrate if possible
    const legacy = localStorage.getItem('theme_mode');
    if (legacy === 'dark' || legacy === 'light') return legacy as ThemeMode;

    return 'light';
  };

  const getInitialVisualTheme = (portal: PortalType): VisualTheme => {
    if (typeof window === 'undefined') return 'redThread';
    const key = portal === 'admin' ? ADMIN_VISUAL_KEY : USER_VISUAL_KEY;
    const cached = localStorage.getItem(key);
    return (cached as VisualTheme) || 'redThread';
  };

  // Separate states for each portal
  const [userMode, setUserModeState] = useState<ThemeMode>(() => getInitialMode('user'));
  const [adminMode, setAdminModeState] = useState<ThemeMode>(() => getInitialMode('admin'));
  const [userVisualTheme, setUserVisualThemeState] = useState<VisualTheme>(() => getInitialVisualTheme('user'));
  const [adminVisualTheme, setAdminVisualThemeState] = useState<VisualTheme>(() => getInitialVisualTheme('admin'));

  const [fontSize, setFontSizeState] = useState<string>('14');
  const [mounted, setMounted] = useState(false);

  // Get current mode and theme based on portal
  const mode = portalType === 'admin' ? adminMode : userMode;
  const theme = portalType === 'admin' ? adminVisualTheme : userVisualTheme;

  // Initialize with defaults
  useEffect(() => {
    // Always start with RedThread theme class
    document.body.classList.add('theme-redthread');
    setMounted(true);
  }, []);

  // Update Body Attributes (Sync state with DOM)
  useEffect(() => {
    if (!mounted) return;
    document.body.setAttribute('data-mode', mode);
    document.body.setAttribute('data-theme', theme);
    document.body.setAttribute('data-font-size', fontSize);

    // Manage classes for global styling
    if (mode === 'dark') {
      document.body.classList.add('theme-dark');
      document.body.classList.remove('theme-light');
    } else {
      document.body.classList.add('theme-light');
      document.body.classList.remove('theme-dark');
    }
  }, [mode, theme, fontSize, mounted]);

  // Load admin preferences on admin portal route (only when an admin session exists)
  useEffect(() => {
    if (!mounted || !isAdminPortal) return;

    const loadAdminPrefs = async () => {
      try {
        const response = await adminApiClient.get('/portal-redthread/auth/me');
        if (response.data) {
          const data = response.data;
          if (data.admin_theme_mode) {
            setAdminModeState(data.admin_theme_mode as ThemeMode);
            localStorage.setItem(ADMIN_THEME_KEY, data.admin_theme_mode);
          }
          if (data.admin_visual_theme) {
            setAdminVisualThemeState(data.admin_visual_theme as VisualTheme);
            localStorage.setItem(ADMIN_VISUAL_KEY, data.admin_visual_theme);
          }
        }
      } catch (error: any) {
        if (error?.response?.status !== 401 && error?.response?.status !== 403) {
          console.error('Failed to load admin theme preferences:', error);
        }
      }
    };

    loadAdminPrefs();
  }, [mounted, isAdminPortal, router.pathname]);

  // Function to load preferences from DB/Object after login
  const loadPreferences = (prefs: { theme_mode?: string, visual_theme?: string, font_size?: string, admin_theme_mode?: string, admin_visual_theme?: string }) => {
    // Load user theme
    if (prefs.theme_mode) {
      setUserModeState(prefs.theme_mode as ThemeMode);
      localStorage.setItem(USER_THEME_KEY, prefs.theme_mode);
    }

    if (prefs.visual_theme) {
      setUserVisualThemeState(prefs.visual_theme as VisualTheme);
      localStorage.setItem(USER_VISUAL_KEY, prefs.visual_theme);
    }

    // Load admin theme
    if (prefs.admin_theme_mode) {
      setAdminModeState(prefs.admin_theme_mode as ThemeMode);
      localStorage.setItem(ADMIN_THEME_KEY, prefs.admin_theme_mode);
    }

    if (prefs.admin_visual_theme) {
      setAdminVisualThemeState(prefs.admin_visual_theme as VisualTheme);
      localStorage.setItem(ADMIN_VISUAL_KEY, prefs.admin_visual_theme);
    }

    if (prefs.font_size) {
      setFontSizeState(prefs.font_size);
    }
  };

  const setUserMode = (newMode: ThemeMode) => {
    setUserModeState(newMode);
    localStorage.setItem(USER_THEME_KEY, newMode);
  };

  const setAdminMode = (newMode: ThemeMode) => {
    setAdminModeState(newMode);
    localStorage.setItem(ADMIN_THEME_KEY, newMode);
  };

  const setMode = async (newMode: ThemeMode) => {
    // Update the appropriate state based on current portal
    if (portalType === 'admin') {
      setAdminMode(newMode);
    } else {
      setUserMode(newMode);
    }

    // Save to database via API
    try {
      if (portalType === 'admin') {
        const response = await adminApiClient.patch('/portal-redthread/auth/profile/theme', { admin_theme_mode: newMode });
        if (!response.data) console.error('Failed to save admin theme');
      } else {
        const response = await apiClient.patch('/profiles/theme', { theme_mode: newMode });
        if (!response.data) console.error('Failed to save user theme');
      }
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  const setTheme = async (newTheme: VisualTheme) => {
    // Update the appropriate state based on current portal
    if (portalType === 'admin') {
      setAdminVisualThemeState(newTheme);
      localStorage.setItem(ADMIN_VISUAL_KEY, newTheme);
    } else {
      setUserVisualThemeState(newTheme);
      localStorage.setItem(USER_VISUAL_KEY, newTheme);
    }

    // Save to database via API
    try {
      if (portalType === 'admin') {
        const response = await adminApiClient.patch('/portal-redthread/auth/profile/theme', { admin_visual_theme: newTheme });
        if (!response.data) console.error('Failed to save admin visual theme');
      } else {
        const response = await apiClient.patch('/profiles/theme', { visual_theme: newTheme });
        if (!response.data) console.error('Failed to save user visual theme');
      }
    } catch (error) {
      console.error('Error saving visual theme:', error);
    }
  };

  const setFontSize = (size: string) => {
    setFontSizeState(size);
    localStorage.setItem('font_size', size);
  };

  const toggleMode = () => {
    const next = mode === 'light' ? 'dark' : 'light';
    setMode(next);
  };

  // Create MUI theme
  const muiTheme = createLiquidGlassTheme(mode, theme);

  if (!mounted) {
    return null;
  }

  return (
    <ThemeContext.Provider value={{ mode, theme, setMode, setTheme, fontSize, setFontSize, toggleMode, loadPreferences }}>
      <MuiThemeProvider theme={muiTheme}>
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
}

export function useAppTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useAppTheme must be used within an AppThemeProvider');
  }
  return context;
}
