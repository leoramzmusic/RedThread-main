import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react';
import apiClient from '../services/api';

export interface NavbarProfileStyle {
  shape?: 'circle' | 'square' | 'diamond';
  border?: 'none' | 'thin' | 'accent';
  glow?: 'none' | 'accent' | 'passion';
}

export interface NavbarConfig {
  shortcuts?: Record<string, boolean>;
  icon_styles?: Record<string, string>;
  quick_actions?: Record<string, boolean>;
  profile?: NavbarProfileStyle;
}

interface NavbarContextValue {
  navConfig: NavbarConfig | null;
  refresh: () => Promise<void>;
}

const NavbarContext = createContext<NavbarContextValue>({
  navConfig: null,
  refresh: async () => {},
});

export function NavbarProvider({ children }: { children: ReactNode }) {
  const [navConfig, setNavConfig] = useState<NavbarConfig | null>(null);

  const refresh = useCallback(async () => {
    try {
      const response = await apiClient.get('/settings/me');
      setNavConfig(response.data?.navbar_config ?? null);
    } catch (error) {
      console.error('Error fetching navbar config:', error);
      setNavConfig(null);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <NavbarContext.Provider value={{ navConfig, refresh }}>
      {children}
    </NavbarContext.Provider>
  );
}

export function useNavbarContext() {
  const ctx = useContext(NavbarContext);
  if (ctx === undefined) {
    throw new Error('useNavbarContext must be used within a NavbarProvider');
  }
  return ctx;
}