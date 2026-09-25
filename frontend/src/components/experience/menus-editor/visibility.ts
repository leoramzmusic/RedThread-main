import type { MenuConfig, MenuRule, UserMenusMetadata, MenuRole, MenuStatus } from './types';
import type { UserMenuSectionDef, UserMenuItemDef } from './userMenuItems';

export type PreviewDevice = 'mobile' | 'tablet' | 'desktop';

export interface PreviewContext {
  role: MenuRole;
  country: string;
  language: string;
  energy: number;
}

export function evaluateRule(rule: MenuRule, ctx: PreviewContext): boolean {
  switch (rule.kind) {
    case 'geo':
      return rule.countries.length === 0 || rule.countries.includes(ctx.country);
    case 'language':
      return rule.languages.length === 0 || rule.languages.includes(ctx.language);
    case 'energy':
      return ctx.energy >= rule.min && ctx.energy <= rule.max;
  }
}

export function isMenuVisible(config: MenuConfig | undefined, ctx: PreviewContext): boolean {
  if (!config) return true;
  if (!config.visible) return false;
  if (config.roles.length > 0 && !config.roles.includes(ctx.role)) return false;
  return config.rules.every((rule) => evaluateRule(rule, ctx));
}

export function visibleItemIds(
  sections: UserMenuSectionDef[],
  metadata: UserMenusMetadata,
  ctx: PreviewContext
): Set<string> {
  const visible = new Set<string>();
  sections.forEach((section) => {
    section.items.forEach((item) => {
      if (!isMenuVisible(metadata.menus[item.id], ctx)) return;
      visible.add(item.id);
      item.children?.forEach((child) => {
        if (isMenuVisible(metadata.menus[child.id], ctx)) visible.add(child.id);
      });
    });
  });
  return visible;
}

export function filterMenuItemDefs(
  defs: UserMenuItemDef[],
  metadata: UserMenusMetadata,
  query: string,
  status: MenuStatus | 'all'
): UserMenuItemDef[] {
  const q = query.trim().toLowerCase();
  return defs.filter((item) => {
    const config = metadata.menus[item.id];
    const itemStatus = config?.status ?? 'active';
    if (status !== 'all' && itemStatus !== status) return false;
    if (q && !item.label.toLowerCase().includes(q) && !item.id.toLowerCase().includes(q)) return false;
    return true;
  });
}
