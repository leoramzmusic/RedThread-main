export type NavbarLayoutMode = 'desktop' | 'tablet' | 'mobile';

export const NAVBAR_MOBILE_MAX = 767;
export const NAVBAR_TABLET_MAX = 1024;

export function resolveNavbarLayoutMode(width: number): NavbarLayoutMode {
  if (width <= NAVBAR_MOBILE_MAX) return 'mobile';
  if (width <= NAVBAR_TABLET_MAX) return 'tablet';
  return 'desktop';
}
