import {
  MENU_STATUSES,
  MENU_ROLES,
  DEFAULT_MENU_CONFIG,
  MAX_SNAPSHOTS,
  describeRoleAccess,
  mapResourceToUserMenus,
  mergeWithDefaults,
  withSnapshot,
  type UserMenusMetadata,
  type MenuConfig,
} from './types';
import { USER_MENU_ITEMS, defaultUserMenus } from './userMenuItems';
import type { AppearanceResource } from '../../../types/appearance';
import { AppearanceType, Platform } from '../../../types/appearance';

const makeResource = (metadata: unknown): AppearanceResource => ({
  type: AppearanceType.USER_MENUS,
  platform: Platform.WEB,
  url: '',
  is_active: true,
  metadata: metadata as AppearanceResource['metadata'],
});

describe('menu statuses and roles catalog', () => {
  it('exposes the three deployment states with colors', () => {
    expect(MENU_STATUSES.map((s) => s.value)).toEqual(['active', 'beta', 'development']);
    expect(MENU_STATUSES.find((s) => s.value === 'active')?.color).toBe('success');
    expect(MENU_STATUSES.find((s) => s.value === 'beta')?.color).toBe('warning');
    expect(MENU_STATUSES.find((s) => s.value === 'development')?.color).toBe('default');
  });

  it('exposes the three preview roles', () => {
    expect(MENU_ROLES.map((r) => r.value)).toEqual(['free', 'premium', 'vip']);
  });

  it('defaults to visible active with no restrictions', () => {
    expect(DEFAULT_MENU_CONFIG).toEqual({
      visible: true,
      status: 'active',
      version: '1.0.0',
      roles: [],
      rules: [],
    });
  });
});

describe('describeRoleAccess', () => {
  it('says unrestricted when nobody is selected or everyone is', () => {
    expect(describeRoleAccess([])).toBe('Visible para todos los usuarios');
    expect(describeRoleAccess(['free', 'premium', 'vip'])).toBe('Visible para todos los usuarios');
  });

  it('names a single restricted audience', () => {
    expect(describeRoleAccess(['free'])).toBe('Visible solo para usuarios Free');
    expect(describeRoleAccess(['premium'])).toBe('Visible solo para usuarios Premium');
    expect(describeRoleAccess(['vip'])).toBe('Visible solo para usuarios VIP (incluye Premium)');
  });

  it('joins combined audiences and flags the VIP inclusion', () => {
    expect(describeRoleAccess(['premium', 'vip'])).toBe('Visible para usuarios Premium y VIP');
    expect(describeRoleAccess(['free', 'premium'])).toBe('Visible para usuarios Free y Premium');
    expect(describeRoleAccess(['free', 'vip'])).toBe('Visible para usuarios Free y VIP (incluye Premium)');
  });
});

describe('user menu item definitions', () => {
  it('mirrors every item of the real user sidebar', () => {
    const ids = USER_MENU_ITEMS.map((i) => i.id);
    expect(ids).toEqual([
      'home', 'discover', 'blueth', 'goldth', 'chat', 'visits',
      'purpleth', 'likes', 'roulette', 'radar',
      'events', 'premium',
      'settings',
    ]);
    const settings = USER_MENU_ITEMS.find((i) => i.id === 'settings');
    expect(settings?.children?.map((c) => c.id)).toEqual([
      'appearance', 'notifications', 'security', 'accessibility', 'privacy', 'advanced',
    ]);
  });

  it('defaults goldth to premium/vip like the real sidebar', () => {
    const meta = defaultUserMenus();
    expect(meta.menus.goldth.roles).toEqual(['premium', 'vip']);
    expect(meta.menus.home.roles).toEqual([]);
  });
});

describe('mapResourceToUserMenus', () => {
  it('returns empty structures for a missing or partial resource', () => {
    expect(mapResourceToUserMenus(makeResource({}))).toEqual({ menus: {}, snapshots: [] });
    expect(mapResourceToUserMenus(makeResource({ menus: { home: DEFAULT_MENU_CONFIG } }))).toEqual({
      menus: { home: DEFAULT_MENU_CONFIG },
      snapshots: [],
    });
  });
});

describe('mergeWithDefaults', () => {
  it('keeps stored custom config and fills unknown items with defaults', () => {
    const stored: UserMenusMetadata = {
      menus: { home: { ...DEFAULT_MENU_CONFIG, visible: false, status: 'beta' } },
      snapshots: [],
    };
    const merged = mergeWithDefaults(stored, defaultUserMenus());
    expect(merged.menus.home.visible).toBe(false);
    expect(merged.menus.home.status).toBe('beta');
    expect(merged.menus.discover).toBeDefined();
    expect(merged.menus.settings).toBeDefined();
    expect(Object.keys(merged.menus)).toEqual(Object.keys(defaultUserMenus().menus));
  });

  it('preserves snapshots through the merge', () => {
    const snap = { at: '2026-01-01T00:00:00.000Z', label: 'x', menus: {} };
    const merged = mergeWithDefaults({ menus: {}, snapshots: [snap] }, defaultUserMenus());
    expect(merged.snapshots).toEqual([snap]);
  });
});

describe('withSnapshot', () => {
  const menus: Record<string, MenuConfig> = { home: DEFAULT_MENU_CONFIG };

  it('stores the previous config with a label and timestamp', () => {
    const before: UserMenusMetadata = { menus, snapshots: [] };
    const next = withSnapshot(before, 'antes de cambiar');
    expect(next.snapshots).toHaveLength(1);
    expect(next.snapshots[0].label).toBe('antes de cambiar');
    expect(next.snapshots[0].menus).toEqual(menus);
    expect(Number.isNaN(Date.parse(next.snapshots[0].at))).toBe(false);
    expect(next.menus).toEqual(menus);
  });

  it('caps the snapshot history at MAX_SNAPSHOTS', () => {
    let meta: UserMenusMetadata = { menus, snapshots: [] };
    for (let i = 0; i < MAX_SNAPSHOTS + 5; i += 1) meta = withSnapshot(meta, `snap-${i}`);
    expect(meta.snapshots).toHaveLength(MAX_SNAPSHOTS);
    expect(meta.snapshots[0].label).toBe(`snap-${MAX_SNAPSHOTS + 4}`);
    expect(meta.snapshots[MAX_SNAPSHOTS - 1].label).toBe('snap-5');
  });
});
