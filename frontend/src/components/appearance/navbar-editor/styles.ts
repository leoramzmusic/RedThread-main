export type NavbarStyleId = 'glass' | 'minimal' | 'modern' | 'compact';
export type HoverAnimation = 'lift' | 'underline' | 'glow' | 'none' | 'draw';
export type FontWeightOption = 'regular' | 'medium' | 'semibold' | 'bold';

export interface NavbarStyleSpec {
  id: NavbarStyleId;
  label: string;
  description: string;
  accent: string;
  fontWeight: FontWeightOption;
  hoverAnimation: HoverAnimation;
  showIcons: boolean;
  underlineOnHover: boolean;
}

export const NAVBAR_STYLE_ID_DEFAULT: NavbarStyleId = 'glass';

export const NAVBAR_STYLE_OPTIONS: Array<Pick<NavbarStyleSpec, 'id' | 'label' | 'description' | 'showIcons' | 'underlineOnHover'>> = [
  { id: 'glass', label: 'Estilo actual', description: 'Barra glass con blur y sombras suaves.', showIcons: true, underlineOnHover: false },
  { id: 'minimal', label: 'Minimalista', description: 'Solo texto, tipografía ligera, sin íconos.', showIcons: false, underlineOnHover: false },
  { id: 'modern', label: 'Moderno', description: 'Íconos + subrayado líquido en hover.', showIcons: true, underlineOnHover: true },
  { id: 'compact', label: 'Compacto', description: 'Navbar reducido, ideal para móvil.', showIcons: true, underlineOnHover: false },
];

export const FONT_WEIGHT_OPTIONS: Array<{ value: FontWeightOption; label: string }> = [
  { value: 'regular', label: 'Regular' },
  { value: 'medium', label: 'Medium' },
  { value: 'semibold', label: 'Semibold' },
  { value: 'bold', label: 'Bold' },
];

export const HOVER_ANIMATION_OPTIONS: Array<{ value: HoverAnimation; label: string }> = [
  { value: 'lift', label: 'Elevación' },
  { value: 'underline', label: 'Subrayado' },
  { value: 'glow', label: 'Resplandor' },
  { value: 'draw', label: 'Trazo' },
  { value: 'none', label: 'Sin animación' },
];

const DEFAULT_SPECS: Record<NavbarStyleId, Omit<NavbarStyleSpec, 'label' | 'description'>> = {
  glass: {
    id: 'glass',
    accent: '#E63946',
    fontWeight: 'medium',
    hoverAnimation: 'lift',
    showIcons: true,
    underlineOnHover: false,
  },
  minimal: {
    id: 'minimal',
    accent: '#E63946',
    fontWeight: 'regular',
    hoverAnimation: 'none',
    showIcons: false,
    underlineOnHover: false,
  },
  modern: {
    id: 'modern',
    accent: '#E63946',
    fontWeight: 'medium',
    hoverAnimation: 'underline',
    showIcons: true,
    underlineOnHover: true,
  },
  compact: {
    id: 'compact',
    accent: '#E63946',
    fontWeight: 'medium',
    hoverAnimation: 'lift',
    showIcons: true,
    underlineOnHover: false,
  },
};

export function getDefaultStyleSpec(id: NavbarStyleId): NavbarStyleSpec {
  const found = NAVBAR_STYLE_OPTIONS.find((o) => o.id === id);
  if (!found) return getDefaultStyleSpec('glass');
  return { ...found, ...DEFAULT_SPECS[id] };
}

export function mergeStyleSpec(base: NavbarStyleSpec, overrides: Partial<NavbarStyleSpec>): NavbarStyleSpec {
  return { ...base, ...overrides, id: base.id, label: base.label, description: base.description };
}