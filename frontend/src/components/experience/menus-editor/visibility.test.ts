import { evaluateRule, isMenuVisible, visibleItemIds, filterMenuItemDefs, type PreviewContext } from './visibility';
import { DEFAULT_MENU_CONFIG, type MenuConfig, type MenuStatus } from './types';
import { USER_MENU_SECTIONS, defaultUserMenus, type UserMenuItemDef } from './userMenuItems';

const ctx = (over: Partial<PreviewContext> = {}): PreviewContext => ({
  role: 'free',
  country: 'MX',
  language: 'es',
  energy: 3,
  ...over,
});

const cfg = (over: Partial<MenuConfig> = {}): MenuConfig => ({ ...DEFAULT_MENU_CONFIG, ...over });

describe('evaluateRule', () => {
  it('geo rule: empty list means no restriction, otherwise membership', () => {
    expect(evaluateRule({ kind: 'geo', countries: [] }, ctx())).toBe(true);
    expect(evaluateRule({ kind: 'geo', countries: ['MX', 'AR'] }, ctx())).toBe(true);
    expect(evaluateRule({ kind: 'geo', countries: ['AR'] }, ctx())).toBe(false);
  });

  it('language rule: matches the preview language', () => {
    expect(evaluateRule({ kind: 'language', languages: [] }, ctx())).toBe(true);
    expect(evaluateRule({ kind: 'language', languages: ['es'] }, ctx())).toBe(true);
    expect(evaluateRule({ kind: 'language', languages: ['en'] }, ctx())).toBe(false);
  });

  it('energy rule: inclusive range', () => {
    expect(evaluateRule({ kind: 'energy', min: 2, max: 4 }, ctx({ energy: 3 }))).toBe(true);
    expect(evaluateRule({ kind: 'energy', min: 3, max: 5 }, ctx({ energy: 3 }))).toBe(true);
    expect(evaluateRule({ kind: 'energy', min: 4, max: 5 }, ctx({ energy: 3 }))).toBe(false);
    expect(evaluateRule({ kind: 'energy', min: 1, max: 2 }, ctx({ energy: 3 }))).toBe(false);
  });
});

describe('isMenuVisible', () => {
  it('falls back to visible when there is no config for the item', () => {
    expect(isMenuVisible(undefined, ctx())).toBe(true);
  });

  it('respects the global visibility toggle', () => {
    expect(isMenuVisible(cfg({ visible: false }), ctx())).toBe(false);
    expect(isMenuVisible(cfg({ visible: true }), ctx())).toBe(true);
  });

  it('restricts by role when roles are set, any role passes otherwise', () => {
    const restricted = cfg({ roles: ['premium', 'vip'] });
    expect(isMenuVisible(restricted, ctx({ role: 'free' }))).toBe(false);
    expect(isMenuVisible(restricted, ctx({ role: 'vip' }))).toBe(true);
    expect(isMenuVisible(cfg({ roles: [] }), ctx({ role: 'free' }))).toBe(true);
    expect(isMenuVisible(cfg({ roles: [] }), ctx({ role: 'vip' }))).toBe(true);
  });

  it('applies conditional rules with AND semantics', () => {
    const rules = cfg({
      rules: [
        { kind: 'geo', countries: ['MX'] },
        { kind: 'language', languages: ['es'] },
      ],
    });
    expect(isMenuVisible(rules, ctx())).toBe(true);
    expect(isMenuVisible(rules, ctx({ country: 'AR' }))).toBe(false);
    expect(isMenuVisible(rules, ctx({ language: 'en' }))).toBe(false);

    const failing = cfg({
      rules: [
        { kind: 'geo', countries: ['MX'] },
        { kind: 'language', languages: ['en'] },
      ],
    });
    expect(isMenuVisible(failing, ctx({ language: 'es' }))).toBe(false);
  });

  it('global toggle wins even when every rule passes', () => {
    expect(isMenuVisible(cfg({ visible: false, rules: [{ kind: 'geo', countries: ['MX'] }] }), ctx())).toBe(false);
  });
});

describe('visibleItemIds', () => {
  it('marks parent and children when everything is visible', () => {
    const ids = visibleItemIds(USER_MENU_SECTIONS, defaultUserMenus(), ctx({ role: 'vip' }));
    expect(ids.size).toBe(19);
    expect(ids.has('goldth')).toBe(true);
    expect(ids.has('privacy')).toBe(true);
  });

  it('hides children when the parent is hidden', () => {
    const metadata = defaultUserMenus();
    metadata.menus.settings = { ...DEFAULT_MENU_CONFIG, visible: false };
    const ids = visibleItemIds(USER_MENU_SECTIONS, metadata, ctx());
    expect(ids.has('settings')).toBe(false);
    expect(ids.has('privacy')).toBe(false);
    expect(ids.has('home')).toBe(true);
  });

  it('applies role restrictions to the whole set', () => {
    const ids = visibleItemIds(USER_MENU_SECTIONS, defaultUserMenus(), ctx({ role: 'free' }));
    expect(ids.has('goldth')).toBe(false);
    expect(ids.size).toBe(18);
  });
});

describe('filterMenuItemDefs', () => {
  const defs: UserMenuItemDef[] = [
    { id: 'discover', label: 'Descubrir' },
    { id: 'chat', label: 'Chat' },
    { id: 'roulette', label: 'Ruleta' },
  ];
  const metadata = defaultUserMenus();
  const byStatus = (status: MenuStatus) => ({
    ...metadata,
    menus: { ...metadata.menus, roulette: { ...DEFAULT_MENU_CONFIG, status } },
  });

  it('matches by label or id, case-insensitive', () => {
    expect(filterMenuItemDefs(defs, metadata, 'des', 'all').map((d) => d.id)).toEqual(['discover']);
    expect(filterMenuItemDefs(defs, metadata, 'CHAT', 'all').map((d) => d.id)).toEqual(['chat']);
    expect(filterMenuItemDefs(defs, metadata, '', 'all')).toHaveLength(3);
  });

  it('filters by deployment status, defaulting to active when unconfigured', () => {
    expect(filterMenuItemDefs(defs, metadata, '', 'beta').map((d) => d.id)).toEqual([]);
    expect(filterMenuItemDefs(defs, byStatus('beta'), '', 'beta').map((d) => d.id)).toEqual(['roulette']);
    expect(filterMenuItemDefs(defs, byStatus('development'), '', 'development').map((d) => d.id)).toEqual(['roulette']);
    expect(filterMenuItemDefs(defs, metadata, '', 'active').map((d) => d.id)).toEqual(['discover', 'chat', 'roulette']);
  });
});
