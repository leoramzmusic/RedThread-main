import {
  DEFAULT_MENU_CONFIG,
  type MenuConfig,
  type UserMenusMetadata,
} from './types';

export type MenuSectionId = 'social' | 'entertainment' | 'organization' | 'system';

export interface UserMenuItemDef {
  id: string;
  label: string;
  path?: string;
  children?: UserMenuItemDef[];
}

export interface UserMenuSectionDef {
  id: MenuSectionId;
  label: string;
  items: UserMenuItemDef[];
}

/** Mirrors the real user sidebar (components/layout/Sidebar.tsx) — the preview source of truth. */
export const USER_MENU_SECTIONS: UserMenuSectionDef[] = [
  {
    id: 'social',
    label: 'SOCIAL',
    items: [
      { id: 'home', label: 'Inicio', path: '/home' },
      { id: 'discover', label: 'Descubrir', path: '/discover' },
      { id: 'blueth', label: 'Amigos', path: '/friends' },
      { id: 'goldth', label: 'Golth', path: '/golth' },
      { id: 'chat', label: 'Chat', path: '/chat' },
      { id: 'visits', label: 'Visitas', path: '/visits' },
    ],
  },
  {
    id: 'entertainment',
    label: 'ENTRETENIMIENTO',
    items: [
      { id: 'purpleth', label: 'Gaming Zone', path: '/purpleth' },
      { id: 'likes', label: 'Likes', path: '/likes' },
      { id: 'roulette', label: 'Ruleta', path: '/roulette' },
      { id: 'radar', label: 'Radar', path: '/radar' },
    ],
  },
  {
    id: 'organization',
    label: 'ORGANIZACIÓN',
    items: [
      { id: 'events', label: 'Eventos', path: '/events' },
      { id: 'premium', label: 'Suscripción', path: '/suscripcion' },
    ],
  },
  {
    id: 'system',
    label: 'SISTEMA',
    items: [
      {
        id: 'settings',
        label: 'Configuración',
        children: [
          { id: 'appearance', label: 'Apariencia', path: '/settings?section=appearance' },
          { id: 'notifications', label: 'Notificaciones', path: '/settings?section=notifications' },
          { id: 'security', label: 'Seguridad', path: '/settings?section=security' },
          { id: 'accessibility', label: 'Accesibilidad', path: '/settings?section=accessibility' },
          { id: 'privacy', label: 'Privacidad', path: '/settings?section=privacy' },
          { id: 'advanced', label: 'Avanzado', path: '/settings?section=advanced' },
        ],
      },
    ],
  },
];

export const USER_MENU_ITEMS = USER_MENU_SECTIONS.flatMap((s) => s.items);

const GOLDTH_ROLES = ['premium', 'vip'] as const;

const DEFAULT_OVERRIDES: Record<string, Partial<MenuConfig>> = {
  goldth: { roles: [...GOLDTH_ROLES] },
};

export function defaultUserMenus(): UserMenusMetadata {
  const menus: Record<string, MenuConfig> = {};
  USER_MENU_SECTIONS.forEach((section) => {
    section.items.forEach((item) => {
      menus[item.id] = { ...DEFAULT_MENU_CONFIG, ...(DEFAULT_OVERRIDES[item.id] ?? {}) };
      item.children?.forEach((child) => {
        menus[child.id] = { ...DEFAULT_MENU_CONFIG, ...(DEFAULT_OVERRIDES[child.id] ?? {}) };
      });
    });
  });
  return { menus, snapshots: [] };
}
