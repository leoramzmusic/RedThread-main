import { AppearanceType, Platform, type AppearanceResource } from '../../../types/appearance';

export type MenuStatus = 'active' | 'beta' | 'development';
export type MenuRole = 'free' | 'premium' | 'vip';

export const MENU_STATUSES: ReadonlyArray<{ value: MenuStatus; label: string; color: 'success' | 'warning' | 'default' }> = [
  { value: 'active', label: 'Activo', color: 'success' },
  { value: 'beta', label: 'Beta', color: 'warning' },
  { value: 'development', label: 'En desarrollo', color: 'default' },
];

export const MENU_ROLES: ReadonlyArray<{ value: MenuRole; label: string }> = [
  { value: 'free', label: 'Free' },
  { value: 'premium', label: 'Premium' },
  { value: 'vip', label: 'VIP' },
];

/** Human-readable access summary for the role checkboxes (VIP implies Premium). */
export function describeRoleAccess(roles: readonly MenuRole[]): string {
  const selected = MENU_ROLES.filter((role) => roles.includes(role.value));
  if (selected.length === 0 || selected.length === MENU_ROLES.length) {
    return 'Visible para todos los usuarios';
  }
  const suffix = roles.includes('vip') && !roles.includes('premium') ? ' (incluye Premium)' : '';
  if (selected.length === 1) {
    return `Visible solo para usuarios ${selected[0].label}${suffix}`;
  }
  return `Visible para usuarios ${selected.map((role) => role.label).join(' y ')}${suffix}`;
}

export type MenuRule =
  | { kind: 'geo'; countries: string[] }
  | { kind: 'language'; languages: string[] }
  | { kind: 'energy'; min: number; max: number };

export interface MenuConfig {
  visible: boolean;
  status: MenuStatus;
  version: string;
  roles: MenuRole[];
  rules: MenuRule[];
}

export interface MenuSnapshot {
  at: string;
  label: string;
  menus: Record<string, MenuConfig>;
}

export interface UserMenusMetadata {
  menus: Record<string, MenuConfig>;
  snapshots: MenuSnapshot[];
}

export const DEFAULT_MENU_CONFIG: MenuConfig = {
  visible: true,
  status: 'active',
  version: '1.0.0',
  roles: [],
  rules: [],
};

export const MAX_SNAPSHOTS = 10;

const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

export function mapResourceToUserMenus(resource: AppearanceResource): UserMenusMetadata {
  const m = resource.metadata ?? {};
  return {
    menus: isPlainObject(m.menus) ? (m.menus as Record<string, MenuConfig>) : {},
    snapshots: Array.isArray(m.snapshots) ? (m.snapshots as MenuSnapshot[]) : [],
  };
}

export function mapUserMenusToResource(metadata: UserMenusMetadata): Omit<AppearanceResource, '_id'> {
  return {
    type: AppearanceType.USER_MENUS,
    platform: Platform.WEB,
    url: '',
    is_active: true,
    metadata: { menus: metadata.menus, snapshots: metadata.snapshots },
  };
}

export function mergeWithDefaults(metadata: UserMenusMetadata, defaults: UserMenusMetadata): UserMenusMetadata {
  const menus: Record<string, MenuConfig> = { ...defaults.menus };
  Object.entries(metadata.menus).forEach(([id, config]) => {
    if (menus[id]) menus[id] = { ...DEFAULT_MENU_CONFIG, ...config };
  });
  return { menus, snapshots: metadata.snapshots };
}

export function withSnapshot(metadata: UserMenusMetadata, label: string): UserMenusMetadata {
  const snapshot: MenuSnapshot = {
    at: new Date().toISOString(),
    label,
    menus: JSON.parse(JSON.stringify(metadata.menus)) as Record<string, MenuConfig>,
  };
  return {
    menus: metadata.menus,
    snapshots: [snapshot, ...metadata.snapshots].slice(0, MAX_SNAPSHOTS),
  };
}
