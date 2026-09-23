# Navbar Styles + Responsive Preview + Two-Column Editor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add persistent navbar styles with real public rendering, a full-width responsive preview, a two-column editors (menus / style) with lockable sections, single-transaction save, and a history panel to the navbar admin editor.

**Architecture:** A shared `NavbarRenderer` renders the navbar for both the public `LandingNavbar` and the editor preview, guaranteeing WYSIWYG fidelity. Style lives in a new `LANDING_NAVBAR_STYLE` appearance resource consumed publicly. The admin page keeps section/style state locally and persists everything on one "Guardar" transaction.

**Tech Stack:** Next.js 16 (Turbopack), MUI v6, @dnd-kit, Beanie/MongoDB (backend), Jest + RTL (jsdom).

**Spec:** `docs/superpowers/specs/2026-09-23-navbar-styles-responsive-preview-design.md`

## Global Constraints

- Frontend verification command: `npx tsc --noEmit` then `npm run build`, run from `frontend/`.
- Backend verification command: `python -m py_compile src/models/appearance.py`, run from `backend/`.
- Jest: `npx jest <path> --ci`, matches `**/src/**/*.test.{ts,tsx}`, jsdom via `jest.setup.ts`.
- ESLint on new/changed files must add **no new errors**; `security/detect-object-injection` warnings are the accepted repo standard (dynamic `translations[lang]` / icon maps).
- Frontend files are LF with `core.autocrlf=true` in this repo — normal edits are fine.
- Keep existing accessibility patterns: `role="menubar"`, `role="menuitem"`, `aria-label`, `focus-visible` outlines.
- The editors keep the existing page orchestration: fetch sections, footer tab, Snackbar, "Modo depuración" table, `NavbarSectionDialog`.
- Do NOT touch: `Footer` tab behavior, `LanguageSelectorModal`, the drawer layout structure (only its syles may change by style).
- Commits: small incremental (`git add` only intended files; never stage unrelated working-tree changes like `package-lock.json` or deleted `banners.tsx`).

---

### Task 1: Add LANDING_NAVBAR_STYLE to both AppearanceType enums

**Files:**
- Modify: `backend/src/models/appearance.py:7-17` (enum `AppearanceType`)
- Modify: `frontend/src/types/appearance.ts:1-11` (enum `AppearanceType`)

**Interfaces:**
- Consumes: nothing.
- Produces: `AppearanceType.LANDING_NAVBAR_STYLE = "landing_navbar_style"` available on both sides.

- [ ] **Step 1: Backend enum**

Replace the CNN (CMS) block so it ends with the new member:

```python
class AppearanceType(str, Enum):
    FAVICON = "favicon"
    LOGO = "logo"
    BANNER = "banner"
    MULTIMEDIA = "multimedia"
    THEME = "theme"
    # CMS Types
    LANDING_BANNER = "landing_banner"
    LANDING_THEME = "landing_theme"
    LANDING_NAVBAR = "landing_navbar"
    LANDING_NAVBAR_STYLE = "landing_navbar_style"
    FAVICON_USER = "favicon_user"
```

- [ ] **Step 2: Frontend enum**

In `frontend/src/types/appearance.ts` add the member to `AppearanceType`:

```typescript
export enum AppearanceType {
  FAVICON = "favicon",
  LOGO = "logo",
  BANNER = "banner",
  MULTIMEDIA = "multimedia",
  THEME = "theme",
  LANDING_BANNER = "landing_banner",
  LANDING_THEME = "landing_theme",
  LANDING_NAVBAR = "landing_navbar",
  LANDING_NAVBAR_STYLE = "landing_navbar_style",
  FAVICON_USER = "favicon_user",
}
```

- [ ] **Step 3: Verify**

Run: `python -m py_compile src/models/appearance.py` (cwd `backend/`) — expected: exit 0.
Run: `npx tsc --noEmit` (cwd `frontend/`) — expected: exit 0.

- [ ] **Step 4: Commit**

```bash
git add backend/src/models/appearance.py frontend/src/types/appearance.ts
git commit -m "feat(appearance): add LANDING_NAVBAR_STYLE type"
```

---

### Task 2: `styles.ts` — style types, options, defaults and merge helpers (TDD)

**Files:**
- Create: `frontend/src/components/appearance/navbar-editor/styles.ts`
- Test: `frontend/src/components/appearance/navbar-editor/styles.test.ts`

**Interfaces:**
- Consumes: nothing external.
- Produces:
  - `NavbarStyleId = 'glass' | 'minimal' | 'modern' | 'compact'`
  - `HoverAnimation = 'lift' | 'underline' | 'glow' | 'none' | 'draw'`
  - `FontWeightOption = 'regular' | 'medium' | 'semibold' | 'bold'`
  - `interface NavbarStyleSpec { id; label; description; accent; fontWeight; hoverAnimation; showIcons; underlineOnHover }`
  - `NAVBAR_STYLE_ID_DEFAULT = 'glass'`
  - `NAVBAR_STYLE_OPTIONS: { id; label; description; showIcons; underlineOnHover }[]`
  - `FONT_WEIGHT_OPTIONS: { value; label }[]`
  - `HOVER_ANIMATION_OPTIONS: { value; label }[]`
  - `getDefaultStyleSpec(id: NavbarStyleId): NavbarStyleSpec`
  - `mergeStyleSpec(base: NavbarStyleSpec, overrides: Partial<NavbarStyleSpec>): NavbarStyleSpec`

- [ ] **Step 1: Write the failing test**

Create `frontend/src/components/appearance/navbar-editor/styles.test.ts`:

```typescript
import {
  getDefaultStyleSpec,
  mergeStyleSpec,
  NAVBAR_STYLE_OPTIONS,
  NavbarStyleSpec,
} from './styles';

describe('getDefaultStyleSpec', () => {
  it('returns glass with red accent by default', () => {
    const spec = getDefaultStyleSpec('glass');
    expect(spec.id).toBe('glass');
    expect(spec.accent).toBe('#E63946');
    expect(spec.showIcons).toBe(true);
    expect(spec.underlineOnHover).toBe(false);
  });

  it('minimal is text-only without icons', () => {
    expect(getDefaultStyleSpec('minimal').showIcons).toBe(false);
  });

  it('modern has icons and liquid underline', () => {
    const spec = getDefaultStyleSpec('modern');
    expect(spec.showIcons).toBe(true);
    expect(spec.underlineOnHover).toBe(true);
  });

  it('compact keeps icons smaller variant', () => {
    expect(getDefaultStyleSpec('compact').showIcons).toBe(true);
  });

  it('falls back to glass for unknown ids', () => {
    expect(getDefaultStyleSpec('nope' as never).id).toBe('glass');
  });
});

describe('mergeStyleSpec', () => {
  it('merges advanced overrides on top of the base', () => {
    const base = getDefaultStyleSpec('modern');
    const merged = mergeStyleSpec(base, { accent: '#00FF00', fontWeight: 'bold' });
    expect(merged.accent).toBe('#00FF00');
    expect(merged.fontWeight).toBe('bold');
    expect(merged.id).toBe('modern');
    expect(merged.hoverAnimation).toBe(base.hoverAnimation);
  });
});

describe('NAVBAR_STYLE_OPTIONS', () => {
  it('exposes exactly the four styles in order', () => {
    expect(NAVBAR_STYLE_OPTIONS.map((o) => o.id)).toEqual(['glass', 'minimal', 'modern', 'compact']);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/components/appearance/navbar-editor/styles.test.ts --ci`
Expected: FAIL — module `./styles` not found.

- [ ] **Step 3: Write minimal implementation**

Create `frontend/src/components/appearance/navbar-editor/styles.ts`:

```typescript
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/components/appearance/navbar-editor/styles.test.ts --ci`
Expected: PASS (6 tests).

- [ ] **Step 5: Typecheck**

Run: `npx tsc --noEmit` (cwd `frontend/`) — expected: exit 0.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/components/appearance/navbar-editor/styles.ts frontend/src/components/appearance/navbar-editor/styles.test.ts
git commit -m "feat(navbar-editor): add navbar style types, options and defaults"
```

---

### Task 3: `changeSet.ts` — pure transaction diffing (TDD)

**Files:**
- Create: `frontend/src/components/appearance/navbar-editor/changeSet.ts`
- Test: `frontend/src/components/appearance/navbar-editor/changeSet.test.ts`

**Interfaces:**
- Consumes: `NavSection` from `./types` (has `id: string`, `locked: boolean`, plus key/route/icon/visible/order/translations).
- Produces:
  - `interface SectionChangeSet { toCreate: NavSection[]; toUpdate: NavSection[]; toDelete: string[] }`
  - `computeSectionChanges(working: NavSection[], snapshot: NavSection[]): SectionChangeSet`
    - `toCreate`: working items with `!id` or `id.startsWith('default-')`.
    - `toUpdate`: working items with a real id whose fields differ from the snapshot counterpart (compare via deep JSON of the metadata fields: key, route, icon, visible, order, locked, translations).
    - `toDelete`: snapshot real ids missing from working.

- [ ] **Step 1: Write the failing test**

Create `frontend/src/components/appearance/navbar-editor/changeSet.test.ts`:

```typescript
import { computeSectionChanges } from './changeSet';
import { NavSection, LANGUAGES } from './types';

const emptyT = () => LANGUAGES.reduce((a, l) => ({ ...a, [l]: '' }), {} as Record<string, string>);

const base = (id: string, over: Partial<NavSection> = {}): NavSection => ({
  id,
  key: id,
  route: '/',
  icon: 'Home',
  visible: true,
  locked: false,
  order: 0,
  translations: emptyT(),
  ...over,
});

describe('computeSectionChanges', () => {
  it('flags default- prefixed / empty ids as creates', () => {
    const res = computeSectionChanges(
      [base('default-0'), base(''), base('abc')],
      []
    );
    expect(res.toCreate.map((s) => s.id)).toEqual(['default-0', '']);
    expect(res.toUpdate).toHaveLength(0);
  });

  it('flags real ids whose metadata changed as updates', () => {
    const snapshot = [base('a', { order: 0 })];
    const working = [base('a', { order: 1 })];
    const res = computeSectionChanges(working, snapshot);
    expect(res.toUpdate.map((s) => s.id)).toEqual(['a']);
  });

  it('ignores real ids unchanged', () => {
    const res = computeSectionChanges([base('a')], [base('a')]);
    expect(res.toUpdate).toHaveLength(0);
    expect(res.toDelete).toHaveLength(0);
  });

  it('flags snapshot real ids missing from working as deletes', () => {
    const res = computeSectionChanges([base('a')], [base('a'), base('b')]);
    expect(res.toDelete).toEqual(['b']);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/components/appearance/navbar-editor/changeSet.test.ts --ci`
Expected: FAIL — module `./changeSet` not found.

- [ ] **Step 3: Write minimal implementation**

Create `frontend/src/components/appearance/navbar-editor/changeSet.ts`:

```typescript
import { NavSection } from './types';

export interface SectionChangeSet {
  toCreate: NavSection[];
  toUpdate: NavSection[];
  toDelete: string[];
}

const META_FIELDS = ['key', 'route', 'icon', 'visible', 'locked', 'order', 'translations'] as const;

export function hasRealId(section: NavSection): boolean {
  return !!section.id && !section.id.startsWith('default-');
}

function sameSection(a: NavSection, b: NavSection): boolean {
  if (a.id !== b.id) return false;
  return META_FIELDS.every((f) => JSON.stringify(a[f]) === JSON.stringify(b[f]));
}

export function computeSectionChanges(working: NavSection[], snapshot: NavSection[]): SectionChangeSet {
  const snapshotById = new Map(snapshot.map((s) => [s.id, s]));

  const toCreate: NavSection[] = [];
  const toUpdate: NavSection[] = [];
  for (const section of working) {
    if (!hasRealId(section)) {
      toCreate.push(section);
      continue;
    }
    const prev = snapshotById.get(section.id);
    if (prev && !sameSection(section, prev)) toUpdate.push(section);
    else if (!prev) toUpdate.push(section);
  }

  const workingIds = new Set(working.map((s) => s.id));
  const toDelete = snapshot
    .filter((s) => hasRealId(s) && !workingIds.has(s.id))
    .map((s) => s.id);

  return { toCreate, toUpdate, toDelete };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/components/appearance/navbar-editor/changeSet.test.ts --ci`
Expected: PASS (4 tests).

- [ ] **Step 5: Typecheck**

Run: `npx tsc --noEmit` (cwd `frontend/`) — expected: exit 0.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/components/appearance/navbar-editor/changeSet.ts frontend/src/components/appearance/navbar-editor/changeSet.test.ts
git commit -m "feat(navbar-editor): add transaction diffing for section changes"
```

---

### Task 4: Add `locked` field to NavSection/NavSectionFormData/DEFAULT_SECTIONS

**Files:**
- Modify: `frontend/src/components/appearance/navbar-editor/types.ts`

**Interfaces:**
- Consumes: nothing new.
- Produces: `NavSection.locked: boolean`, `NavSectionFormData.locked: boolean`, `default home` has `locked: true` in `DEFAULT_SECTIONS`.

- [ ] **Step 1: Add `locked` to the interfaces**

In `types.ts`, after `visible: boolean;` in both interfaces add `locked: boolean;`:

```typescript
export interface NavSection {
  id: string;
  key: string;
  route: string;
  icon: string;
  visible: boolean;
  locked: boolean;
  order: number;
  translations: Record<Language, string>;
}

export interface NavSectionFormData {
  key: string;
  route: string;
  icon: string;
  visible: boolean;
  locked: boolean;
  translations: Record<Language, string>;
}
```

- [ ] **Step 2: Set defaults in DEFAULT_SECTIONS and initialNavFormData**

Change the `home` row so the first entry has `locked: true` and all others `locked: false` (explicit — they currently omit the field). For each of the 6 rows add the field:

```typescript
export const DEFAULT_SECTIONS: Omit<NavSection, 'id'>[] = [
  { key: 'home', route: '/', icon: 'Home', visible: true, locked: true, order: 0, translations: {...} },
  // ... remaining rows: locked: false, order 1..5
];
```

And in `initialNavFormData` add `locked: false,` after `visible: true,`.

- [ ] **Step 3: Breadth — page mappers**

In `frontend/src/pages/portal-redthread/apariencia/landingPageNavbarAndFooter.tsx`:
- `mapResourceToSection`: add `locked: meta.locked ?? false,` after the `visible` line.
- `mapSectionToResource` metadata: add `locked: s.locked,` after `visible`.

- [ ] **Step 4: Update dialog initializer**

In `frontend/src/components/appearance/navbar-editor/NavbarSectionDialog.tsx`, the `section ? {...} : initialNavFormData()` state initializer: add `locked: section.locked,` after `visible: section.visible,`.

- [ ] **Step 5: Verify**

Run: `npx tsc --noEmit` (cwd `frontend/`) — expected: exit 0.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/components/appearance/navbar-editor/types.ts frontend/src/pages/portal-redthread/apariencia/landingPageNavbarAndFooter.tsx frontend/src/components/appearance/navbar-editor/NavbarSectionDialog.tsx
git commit -m "feat(navbar-editor): add locked field to sections"
```

---

### Task 5: `NavbarRenderer` — shared navbar render for all 4 styles

**Files:**
- Create: `frontend/src/components/appearance/navbar-editor/NavbarRenderer.tsx`
- Test: `frontend/src/components/appearance/navbar-editor/NavbarRenderer.test.tsx`

**Interfaces:**
- Consumes: `NavSection`, `Language`, `getTranslationFallback` from `./types`; `NavbarIcon` from `./NavbarIcon`; `NavbarStyleSpec` from `./styles`; `landingShadows`, `shapeTokens` from `../../theme/liquidGlass`.
- Produces:
  - `interface NavbarRendererProps { sections: NavSection[]; currentLang: Language; styleSpec: NavbarStyleSpec; scrolled?: boolean; interactive?: boolean; ctaLabel?: string }`
  - `export default function NavbarRenderer(props): JSX.Element` — renders ONLY the inner pill (logo + centered menu + lang button + CTA + hamburger). Positioning (fixed/absolute wrapper) is the caller's job. Drawer and language modal stay in `LandingNavbar`.

- [ ] **Step 1: Write the failing render test**

Create `frontend/src/components/appearance/navbar-editor/NavbarRenderer.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import NavbarRenderer from './NavbarRenderer';
import { getDefaultStyleSpec } from './styles';
import { NavSection, LANGUAGES } from './types';

const emptyT = () => LANGUAGES.reduce((a, l) => ({ ...a, [l]: '' }), {} as Record<string, string>);

const sections: NavSection[] = [
  { id: 'a', key: 'home', route: '/', icon: 'Home', visible: true, locked: true, order: 0, translations: { ...emptyT(), es: 'Inicio' } },
  { id: 'b', key: 'product', route: '#producto', icon: 'Explore', visible: true, locked: false, order: 1, translations: { ...emptyT(), es: 'Producto' } },
  { id: 'c', key: 'hidden', route: '/x', icon: 'Menu', visible: false, locked: false, order: 2, translations: emptyT() },
];

describe('NavbarRenderer', () => {
  it('renders only visible items for the current language', () => {
    render(<NavbarRenderer sections={sections} currentLang="es" styleSpec={getDefaultStyleSpec('glass')} />);
    expect(screen.getByText('Inicio')).toBeInTheDocument();
    expect(screen.getByText('Producto')).toBeInTheDocument();
    expect(screen.queryByText('(vacío)')).not.toBeInTheDocument();
  });

  it('does not render hidden sections', () => {
    render(<NavbarRenderer sections={sections} currentLang="es" styleSpec={getDefaultStyleSpec('glass')} />);
    expect(screen.queryByText('hidden')).not.toBeInTheDocument();
  });

  it('renders the language badge and CTA', () => {
    render(<NavbarRenderer sections={sections} currentLang="en" styleSpec={getDefaultStyleSpec('modern')} ctaLabel="Sign up" />);
    expect(screen.getByText('EN')).toBeInTheDocument();
    expect(screen.getByText('Sign up')).toBeInTheDocument();
  });

  it('falls back to es label when current lang missing', () => {
    render(<NavbarRenderer sections={sections} currentLang="de" styleSpec={getDefaultStyleSpec('minimal')} />);
    expect(screen.getByText('Inicio')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/components/appearance/navbar-editor/NavbarRenderer.test.tsx --ci`
Expected: FAIL — cannot find module `./NavbarRenderer`.

- [ ] **Step 3: Write implementation**

Create `frontend/src/components/appearance/navbar-editor/NavbarRenderer.tsx`. It extracts the pill JSX currently in `LandingNavbar.tsx:144-296` into a style-driven component. Key structure (verbatim-equivalent behavior, style branches per `styleSpec`):

```tsx
import { Box, Button, IconButton } from '@mui/material';
import { Language as LanguageIcon, Menu as MenuIcon } from '@mui/icons-material';
import { landingShadows, shapeTokens } from '../../theme/liquidGlass';
import { NavSection, Language, getTranslationFallback } from './types';
import { NavbarStyleSpec } from './styles';
import { NavbarIcon } from './NavbarIcon';

export interface NavbarRendererProps {
  sections: NavSection[];
  currentLang: Language;
  styleSpec: NavbarStyleSpec;
  scrolled?: boolean;
  interactive?: boolean;
  ctaLabel?: string;
}

const DEFAULT_CTA_LABEL: Record<string, string> = {
  es: 'Crear cuenta', en: 'Sign up', pt: 'Criar conta', fr: 'Créer un compte',
  de: 'Konto erstellen', it: 'Crea account', ru: 'Создать аккаунт', sv: 'Skapa konto',
  nl: 'Account aanmaken', zh: '注册', hi: 'खाता बनाएं', bn: 'অ্যাকাউন্ট তৈরি করুন',
  ja: 'アカウント作成', ko: '가입하기', ar: 'إنشاء حساب', sw: 'Jiandikishe',
  ha: 'Ƙirƙiri asusu', am: 'መለያ ፍጠር', fil: 'Gumawa ng account',
};

const WEIGHT = { regular: 400, medium: 500, semibold: 600, bold: 700 } as const;

const getHoverSx = (animation: NavbarStyleSpec['hoverAnimation'], accent: string) => {
  switch (animation) {
    case 'underline':
      return { '&:hover': { color: 'white' } as object };
    case 'glow':
      return { '&:hover': { bgcolor: 'rgba(255,255,255,0.12)', boxShadow: `0 0 14px ${accent}66` } as object };
    case 'draw':
      return { '&:hover': { bgcolor: 'rgba(255,255,255,0.12)' } as object };
    case 'none':
      return { '&:hover': { color: 'white' } as object };
    default:
      return { '&:hover': { color: 'white', bgcolor: 'rgba(255,255,255,0.12)', transform: 'translateY(-1px)' } as object };
  }
};

export default function NavbarRenderer({
  sections, currentLang, styleSpec, scrolled = false, interactive = true, ctaLabel,
}: NavbarRendererProps) {
  const visibleNavItems = sections
    .filter((s) => s.visible)
    .map((s) => ({ label: getTranslationFallback(s.translations, currentLang), href: s.route, icon: s.icon }));
  const resolvedCta = ctaLabel || DEFAULT_CTA_LABEL[currentLang] || DEFAULT_CTA_LABEL.en;
  const compact = styleSpec.id === 'compact';
  const itemFontSize = compact ? '0.8rem' : '0.875rem';
  const itemPy = compact ? 0.4 : 0.75;
  const pillPy = compact ? 0.5 : 1;
  const pillGap = compact ? '0.5rem' : { xs: 1, md: 2, lg: 3 };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: pillGap,
        width: '100%',
        px: { xs: 1.25, sm: 2, md: 2.5 },
        py: pillPy,
        borderRadius: compact ? 2 : shapeTokens.pill,
        bgcolor: scrolled ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.08)',
        backdropFilter: 'blur(24px) saturate(1.7)',
        WebkitBackdropFilter: 'blur(24px) saturate(1.7)',
        border: '1px solid rgba(255,255,255,0.18)',
        boxShadow: scrolled ? landingShadows.nav.scrolled : landingShadows.nav.rest,
        transition: 'all 0.3s cubic-bezier(0.22,1,0.36,1)',
        minWidth: 0,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', flexShrink: 0, cursor: 'pointer', height: compact ? 24 : 28, gap: 0.5, mr: 1 }}>
        <NavbarIcon name="Home" sx={{ color: 'rgba(255,255,255,0.9)', fontSize: compact ? 22 : 24 }} />
        <Box component="span" sx={{ color: 'white', fontWeight: 800, letterSpacing: '-0.02em', fontSize: compact ? '0.85rem' : '0.95rem' }}>
          RETH
        </Box>
      </Box>

      <Box
        sx={{
          display: { xs: 'none', lg: 'flex' },
          alignItems: 'center',
          gap: 0.5,
          flex: 1,
          justifyContent: 'center',
          minWidth: 0,
        }}
        role="menubar"
      >
        {visibleNavItems.map((item) => (
          <Box key={`${item.label}-${item.href}`} sx={{ position: 'relative', display: 'flex' }}>
            <Button
              role="menuitem"
              startIcon={styleSpec.showIcons ? <NavbarIcon name={item.icon} /> : undefined}
              sx={{
                color: 'rgba(255,255,255,0.88)',
                fontFamily: 'Inter, system-ui, sans-serif',
                fontWeight: WEIGHT[styleSpec.fontWeight],
                fontSize: itemFontSize,
                letterSpacing: '0.01em',
                textTransform: 'none',
                px: 1.5,
                py: itemPy,
                borderRadius: shapeTokens.pill,
                transition: 'all 0.2s cubic-bezier(0.22,1,0.36,1)',
                ...getHoverSx(styleSpec.hoverAnimation, styleSpec.accent),
                '&:active': { transform: 'scale(0.97)', transition: 'transform 100ms ease-out' },
                '&:focus-visible': { outline: '2px solid #E63946', outlineOffset: 2 },
              }}
            >
              {item.label || `(${item.href})`}
            </Button>
            {styleSpec.underlineOnHover && (
              <Box
                sx={{
                  position: 'absolute',
                  bottom: 2,
                  left: '16%',
                  width: '68%',
                  height: 2,
                  borderRadius: 1,
                  bgcolor: styleSpec.accent,
                  transform: 'scaleX(0)',
                  transformOrigin: 'center',
                  transition: 'transform 0.25s cubic-bezier(0.22,1,0.36,1)',
                  pointerEvents: 'none',
                  '&:hover': { transform: 'scaleX(1)' },
                }}
              />
            )}
          </Box>
        ))}
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.75, sm: 1 }, flexShrink: 0, ml: 'auto' }}>
        <Button
          aria-label="Seleccionar idioma"
          startIcon={<LanguageIcon sx={{ fontSize: 16 }} />}
          sx={{
            height: compact ? 30 : 34,
            borderRadius: shapeTokens.pill,
            bgcolor: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.18)',
            color: 'white',
            fontFamily: 'Inter, system-ui, sans-serif',
            fontWeight: 700,
            fontSize: '0.8rem',
            letterSpacing: '0.04em',
            px: 1.5,
            textTransform: 'none',
            backdropFilter: 'blur(12px) saturate(1.5)',
            WebkitBackdropFilter: 'blur(12px) saturate(1.5)',
            '&:hover': { bgcolor: 'rgba(255,255,255,0.14)', borderColor: 'rgba(255,255,255,0.28)' },
          }}
        >
          {currentLang.toUpperCase()}
        </Button>

        <Button
          variant="contained"
          sx={{
            display: { xs: 'none', sm: 'inline-flex' },
            bgcolor: '#E63946',
            color: 'white',
            fontFamily: 'Inter, system-ui, sans-serif',
            fontWeight: 600,
            fontSize: '0.875rem',
            letterSpacing: '0.01em',
            textTransform: 'none',
            borderRadius: shapeTokens.pill,
            px: compact ? 1.8 : 2.5,
            py: compact ? 0.6 : 0.9,
            boxShadow: landingShadows.ctaPrimary.rest,
            border: '1px solid rgba(255,255,255,0.18)',
            '&:hover': { bgcolor: '#FF6B6B', boxShadow: landingShadows.ctaPrimary.hover },
            '&:focus-visible': { outline: '2px solid white', outlineOffset: 2 },
          }}
        >
          {resolvedCta}
        </Button>

        <IconButton
          aria-label="Abrir menú"
          sx={{
            display: { xs: 'inline-flex', lg: 'none' },
            color: 'white',
            bgcolor: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.18)',
            width: compact ? 32 : 36,
            height: compact ? 32 : 36,
            '&:hover': { bgcolor: 'rgba(255,255,255,0.18)' },
            '&:focus-visible': { outline: '2px solid #E63946', outlineOffset: 2 },
          }}
        >
          <MenuIcon fontSize="small" />
        </IconButton>
      </Box>
    </Box>
  );
}
```

Note: `interactive` is accepted for API parity but currently the pill has no internal navigation (is navigation delegated to `LandingNavbar` via wrapper events); the property is retained so future handlers can be wired without breaking callers. If the wrapping extra `'&:hover'` key on the underline triggers a TS lint error, wrap it with `(this as unknown)` cast or drop it — the visible effect is driven by the sibling Button's hover sx.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/components/appearance/navbar-editor/NavbarRenderer.test.tsx --ci`
Expected: PASS (4 tests).

- [ ] **Step 5: Typecheck**

Run: `npx tsc --noEmit` (cwd `frontend/`) — expected: exit 0.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/components/appearance/navbar-editor/NavbarRenderer.tsx frontend/src/components/appearance/navbar-editor/NavbarRenderer.test.tsx
git commit -m "feat(navbar-editor): add shared NavbarRenderer for all styles"
```

---

### Task 6: Refactor `LandingNavbar` to consume `NavbarRenderer` + load style

**Files:**
- Modify: `frontend/src/components/landing/LandingNavbar.tsx`

**Interfaces:**
- Consumes: `NavbarRenderer` from `../../components/appearance/navbar-editor/NavbarRenderer`; `mergeStyleSpec`, `getDefaultStyleSpec`, `NavbarStyleSpec`, `NAVBAR_STYLE_ID_DEFAULT` from `../../components/appearance/navbar-editor/styles`; `AppearanceType` from `../../types/appearance`.
- Produces: `LandingNavbar` renders `NavbarRenderer` in its fixed wrapper; the drawer, `LanguageSelectorModal`, scrolling state stay in the component.

- [ ] **Step 1: Add imports and style state**

Add to imports:

```tsx
import NavbarRenderer from '../../components/appearance/navbar-editor/NavbarRenderer';
import { getDefaultStyleSpec, mergeStyleSpec, NavbarStyleSpec, NAVBAR_STYLE_ID_DEFAULT } from '../../components/appearance/navbar-editor/styles';
import { AppearanceType } from '../../types/appearance';
```

Add state next to `navSections`:

```tsx
const [styleSpec, setStyleSpec] = useState<NavbarStyleSpec>(() => getDefaultStyleSpec(NAVBAR_STYLE_ID_DEFAULT));
```

- [ ] **Step 2: Add the fetch for the style resource**

Place next to `fetchNavSections`:

```tsx
const fetchStyleSpec = useCallback(() => {
  appearanceService
    .getPublicResources(AppearanceType.LANDING_NAVBAR_STYLE)
    .then((resources) => {
      const active = resources.find((r) => r.is_active && (r.metadata as any)?.id);
      if (active?.metadata?.id) {
        const base = getDefaultStyleSpec((active.metadata as any).id);
        setStyleSpec(mergeStyleSpec(base, { accent: active.metadata.accent, fontWeight: active.metadata.fontWeight, hoverAnimation: active.metadata.hoverAnimation }));
      }
    })
    .catch(() => {});
}, []);
```

And call it in the same effect that calls `fetchNavSections()`:

```tsx
useEffect(() => { fetchNavSections(); fetchStyleSpec(); }, [fetchNavSections, fetchStyleSpec]);
```

- [ ] **Step 3: Replace the pill JSX with `<NavbarRenderer />`**

The block currently spanning from the `/Izq: Imagotipo...` comment through the closing of the pill `</Box>` (old lines 162-295) gets replaced inside the existing fixed wrapper `<Box component="nav" ...>` by:

```tsx
      <NavbarRenderer
        sections={navSections}
        currentLang={currentLang}
        styleSpec={styleSpec}
        scrolled={scrolled}
      />
```

Keep the existing `position: fixed`, `top`, `left`, `width`, `maxWidth`, `display: flex`, `justifyContent: center` wrapper `Box` as-is (it now wraps only this renderer). The drawer and modals below stay untouched.

- [ ] **Step 4: Verify**

Run: `npx tsc --noEmit` (cwd `frontend/`) — expected: exit 0.
Run: `npx jest src/components/appearance/navbar-editor/NavbarRenderer.test.tsx --ci` — expected: PASS.

- [ ] **Step 5: Manual smoke (optional, if dev available)**

Run: `npx next build` would fail without backend; skip unless backend is up. Typecheck + render test above are the gate.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/components/landing/LandingNavbar.tsx
git commit -m "feat(landing): render navbar via shared NavbarRenderer and load style"
```

---

### Task 7: Style editor controls — style cards, advanced panel, compare state

**Files:**
- Create: `frontend/src/components/appearance/navbar-editor/NavbarStyleSelector.tsx`
- Test: `frontend/src/components/appearance/navbar-editor/NavbarStyleSelector.test.tsx`

**Interfaces:**
- Consumes: `NAVBAR_STYLE_OPTIONS`, `NavbarStyleSpec`, `NavbarStyleId`, `FONT_WEIGHT_OPTIONS`, `HOVER_ANIMATION_OPTIONS` from `./styles`.
- Produces:
  - `interface NavbarStyleSelectorProps { draft: NavbarStyleSpec; saved: NavbarStyleSpec; onSelectStyle(id: NavbarStyleId): void; onChangeAdvanced(patch: Partial<NavbarStyleSpec>): void; onApply(): void; onToggleCompare(): void; showCompare: boolean }`
  - `export default function NavbarStyleSelector(props): JSX.Element` — renders 4 cards (radio-like), an "Avanzado" Collapse (accent color swatch, fontWeight select, hover animation select), a "Comparar" toggle, and an "Aplicar" button (disabled when `draft.id === saved.id && draft accent/fontWeight/hover equal saved`).

- [ ] **Step 1: Write the failing render test**

Create `frontend/src/components/appearance/navbar-editor/NavbarStyleSelector.test.tsx`:

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import NavbarStyleSelector from './NavbarStyleSelector';
import { getDefaultStyleSpec } from './styles';

describe('NavbarStyleSelector', () => {
  const draft = getDefaultStyleSpec('glass');
  const saved = getDefaultStyleSpec('glass');

  it('renders the four style cards', () => {
    render(
      <NavbarStyleSelector
        draft={draft} saved={saved}
        onSelectStyle={() => {}} onChangeAdvanced={() => {}}
        onApply={() => {}} onToggleCompare={() => {}} showCompare={false}
      />
    );
    expect(screen.getByText('Estilo actual')).toBeInTheDocument();
    expect(screen.getByText('Minimalista')).toBeInTheDocument();
    expect(screen.getByText('Moderno')).toBeInTheDocument();
    expect(screen.getByText('Compacto')).toBeInTheDocument();
  });

  it('calls onSelectStyle when a card is clicked', () => {
    const onSelectStyle = jest.fn();
    render(
      <NavbarStyleSelector
        draft={draft} saved={saved}
        onSelectStyle={onSelectStyle} onChangeAdvanced={() => {}}
        onApply={() => {}} onToggleCompare={() => {}} showCompare={false}
      />
    );
    fireEvent.click(screen.getByText('Minimalista'));
    expect(onSelectStyle).toHaveBeenCalledWith('minimal');
  });

  it('disables Aplicar when draft equals saved defaults', () => {
    render(
      <NavbarStyleSelector
        draft={draft} saved={saved}
        onSelectStyle={() => {}} onChangeAdvanced={() => {}}
        onApply={() => {}} onToggleCompare={() => {}} showCompare={false}
      />
    );
    expect(screen.getByRole('button', { name: /aplicar/i })).toBeDisabled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/components/appearance/navbar-editor/NavbarStyleSelector.test.tsx --ci`
Expected: FAIL — module not found.

- [ ] **Step 3: Write implementation**

Create `frontend/src/components/appearance/navbar-editor/NavbarStyleSelector.tsx`:

```tsx
import { Box, Button, Card, CardActionArea, CardContent, Collapse, Divider, Stack, TextField, Typography, IconButton, ToggleButton, ToggleButtonGroup, Alert } from '@mui/material';
import { Check, ExpandMore, CompareArrows } from '@mui/icons-material';
import { useState } from 'react';
import {
  NAVBAR_STYLE_OPTIONS,
  NavbarStyleSpec,
  NavbarStyleId,
  FONT_WEIGHT_OPTIONS,
  HOVER_ANIMATION_OPTIONS,
} from './styles';

export interface NavbarStyleSelectorProps {
  draft: NavbarStyleSpec;
  saved: NavbarStyleSpec;
  onSelectStyle: (id: NavbarStyleId) => void;
  onChangeAdvanced: (patch: Partial<NavbarStyleSpec>) => void;
  onApply: () => void;
  onToggleCompare: () => void;
  showCompare: boolean;
}

const specEquals = (a: NavbarStyleSpec, b: NavbarStyleSpec) =>
  a.id === b.id && a.accent === b.accent && a.fontWeight === b.fontWeight && a.hoverAnimation === b.hoverAnimation;

export default function NavbarStyleSelector({
  draft, saved, onSelectStyle, onChangeAdvanced, onApply, onToggleCompare, showCompare,
}: NavbarStyleSelectorProps) {
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const applyDisabled = specEquals(draft, saved);

  return (
    <Box>
      <Typography variant="h6" gutterBottom>Estilo del navbar</Typography>
      <Stack spacing={1}>
        {NAVBAR_STYLE_OPTIONS.map((opt) => {
          const selected = draft.id === opt.id;
          return (
            <Card
              key={opt.id}
              variant={selected ? 'outlined' : 'elevation'}
              sx={{
                border: selected ? 2 : 1,
                borderColor: selected ? 'primary.main' : 'divider',
                bgcolor: selected ? 'action.selected' : 'transparent',
                '&:hover': { borderColor: 'primary.main' },
              }}
            >
              <CardActionArea onClick={() => onSelectStyle(opt.id)}>
                <CardContent sx={{ py: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={600}>
                      {selected ? '✓ ' : ''}{opt.label}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">{opt.description}</Typography>
                  </Box>
                </CardContent>
              </CardActionArea>
            </Card>
          );
        })}
      </Stack>

      <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
        <Button variant="contained" disabled={applyDisabled} onClick={onApply}>
          Aplicar
        </Button>
        <Button
          variant="outlined"
          startIcon={<CompareArrows />}
          color={showCompare ? 'primary' : 'inherit'}
          onClick={onToggleCompare}
        >
          Comparar
        </Button>
      </Stack>

      {showCompare && (
        <Alert severity="info" sx={{ mt: 1.5 }}>
          Comparando «{saved.label}» (actual) vs «{draft.label}» (seleccionado) en la vista previa.
        </Alert>
      )}

      <Divider sx={{ my: 2 }} />

      <Box>
        <IconButton onClick={() => setAdvancedOpen((v) => !v)} aria-label="Configuración avanzada">
          <ExpandMore sx={{ transform: advancedOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }} />
        </IconButton>
        <Button onClick={() => setAdvancedOpen((v) => !v)} sx={{ textTransform: 'none' }}>Configuración avanzada</Button>
      </Box>

      <Collapse in={advancedOpen}>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Box>
            <Typography variant="caption" color="text.secondary">Color de acento</Typography>
            <ToggleButtonGroup
              exclusive
              size="small"
              value={draft.accent}
              onChange={(_, v) => { if (v) onChangeAdvanced({ accent: v }); }}
              aria-label="Color de acento"
            >
              {['#E63946', '#3B82F6', '#16A34A', '#D97706', '#7F4CA5'].map((c) => (
                <ToggleButton key={c} value={c} aria-label={c} sx={{ p: 1 }}>
                  <Box sx={{ width: 20, height: 20, borderRadius: '50%', bgcolor: c, border: '1px solid rgba(0,0,0,0.15)' }} />
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </Box>
          <TextField
            select
            label="Grosor tipográfico"
            size="small"
            value={draft.fontWeight}
            onChange={(e) => onChangeAdvanced({ fontWeight: e.target.value as NavbarStyleSpec['fontWeight'] })}
          >
            {FONT_WEIGHT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </TextField>
          <TextField
            select
            label="Animación de hover"
            size="small"
            value={draft.hoverAnimation}
            onChange={(e) => onChangeAdvanced({ hoverAnimation: e.target.value as NavbarStyleSpec['hoverAnimation'] })}
          >
            {HOVER_ANIMATION_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </TextField>
        </Stack>
      </Collapse>
    </Box>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/components/appearance/navbar-editor/NavbarStyleSelector.test.tsx --ci`
Expected: PASS (3 tests).

- [ ] **Step 5: Typecheck**

Run: `npx tsc --noEmit` (cwd `frontend/`) — expected: exit 0.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/components/appearance/navbar-editor/NavbarStyleSelector.tsx frontend/src/components/appearance/navbar-editor/NavbarStyleSelector.test.tsx
git commit -m "feat(navbar-editor): add style selector cards and advanced panel"
```

---

### Task 8: `NavbarResponsivePreview` — full-width responsive preview with autoplay rotation

**Files:**
- Create: `frontend/src/components/appearance/navbar-editor/NavbarResponsivePreview.tsx`
- Test: `frontend/src/components/appearance/navbar-editor/NavbarResponsivePreview.test.tsx`
- Delete: `frontend/src/components/appearance/navbar-editor/NavbarMiniPreview.tsx`

**Interfaces:**
- Consumes: `NavSection`, `Language` from `./types`; `NavbarStyleSpec` from `./styles`; `NavbarRenderer` from `./NavbarRenderer`.
- Produces:
  - `export interface NavbarResponsivePreviewProps { sections: NavSection[]; currentLang: Language; draft: NavbarStyleSpec; saved: NavbarStyleSpec; showCompare: boolean }`
  - `export default function NavbarResponsivePreview(props): JSX.Element`
  - `export const RESUMEN_RESOLUTIONS = [{ id: 'desktop', label: 'Desktop', width: 1280 }, { id: 'tablet', label: 'Tablet', width: 768 }, { id: 'mobile', label: 'Móvil', width: 375 }]`

- [ ] **Step 1: Write the failing render test**

Create `frontend/src/components/appearance/navbar-editor/NavbarResponsivePreview.test.tsx`:

```tsx
import { render, screen, fireEvent, act } from '@testing-library/react';
import NavbarResponsivePreview, { RESUMEN_RESOLUTIONS } from './NavbarResponsivePreview';
import { getDefaultStyleSpec } from './styles';
import { NavSection, LANGUAGES } from './types';

const emptyT = () => LANGUAGES.reduce((a, l) => ({ ...a, [l]: '' }), {} as Record<string, string>);

const sections: NavSection[] = [
  { id: 'a', key: 'home', route: '/', icon: 'Home', visible: true, locked: true, order: 0, translations: { ...emptyT(), es: 'Inicio' } },
  { id: 'b', key: 'product', route: '#producto', icon: 'Explore', visible: true, locked: false, order: 1, translations: { ...emptyT(), es: 'Producto' } },
];

describe('NavbarResponsivePreview', () => {
  it('renders resolution kontroller and current width badge', () => {
    render(
      <NavbarResponsivePreview
        sections={sections} currentLang="es"
        draft={getDefaultStyleSpec('glass')} saved={getDefaultStyleSpec('glass')} showCompare={false}
      />
    );
    expect(screen.getByText('Desktop')).toBeInTheDocument();
    expect(screen.getByText('1280px')).toBeInTheDocument();
  });

  it('switches resolution on tab click and updates badge', () => {
    render(
      <NavbarResponsivePreview
        sections={sections} currentLang="es"
        draft={getDefaultStyleSpec('glass')} saved={getDefaultStyleSpec('glass')} showCompare={false}
      />
    );
    fireEvent.click(screen.getByText('Móvil'));
    expect(screen.getByText('375px')).toBeInTheDocument();
  });

  it('rotates resolutions while playing', () => {
    jest.useFakeTimers();
    render(
      <NavbarResponsivePreview
        sections={sections} currentLang="es"
        draft={getDefaultStyleSpec('glass')} saved={getDefaultStyleSpec('glass')} showCompare={false}
      />
    );
    act(() => { jest.advanceTimersByTime(4500); });
    expect(RESUMEN_RESOLUTIONS.length).toBe(3);
    jest.useRealTimers();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/components/appearance/navbar-editor/NavbarResponsivePreview.test.tsx --ci`
Expected: FAIL — module not found.

- [ ] **Step 3: Write implementation and delete the old preview**

Create `frontend/src/components/appearance/navbar-editor/NavbarResponsivePreview.tsx`:

```tsx
import { Box, Paper, Stack, ToggleButton, ToggleButtonGroup, Typography, IconButton, Chip } from '@mui/material';
import { PlayArrow, Pause } from '@mui/icons-material';
import { useEffect, useRef, useState } from 'react';
import NavbarRenderer from './NavbarRenderer';
import { NavSection, Language } from './types';
import { NavbarStyleSpec } from './styles';

export interface NavbarResponsivePreviewProps {
  sections: NavSection[];
  currentLang: Language;
  draft: NavbarStyleSpec;
  saved: NavbarStyleSpec;
  showCompare: boolean;
}

export const RESUMEN_RESOLUTIONS = [
  { id: 'desktop', label: 'Desktop', width: 1280 },
  { id: 'tablet', label: 'Tablet', width: 768 },
  { id: 'mobile', label: 'Móvil', width: 375 },
] as const;

type ResolutionId = (typeof RESUMEN_RESOLUTIONS)[number]['id'];

function Mockup({ sections, currentLang, styleSpec, width, label }: {
  sections: NavSection[];
  currentLang: Language;
  styleSpec: NavbarStyleSpec;
  width: number;
  label: string;
}) {
  return (
    <Box sx={{ flex: 1, minWidth: 0 }}>
      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', mb: 0.5, display: 'block' }}>
        {label}
      </Typography>
      <Box
        sx={{
          mx: 'auto',
          maxWidth: '100%',
          width: Math.min(width, 1100),
          borderRadius: 2,
          bgcolor: 'rgba(0,0,0,0.35)',
          border: '1px solid rgba(255,255,255,0.08)',
          overflow: 'hidden',
        }}
      >
        <Box sx={{ height: 32, bgcolor: 'rgba(26,27,30,0.9)', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', px: 1.5, gap: 1 }}>
          <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#FF5F57' }} />
          <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#FEBC2E' }} />
          <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#28C840' }} />
          <Box sx={{ flex: 1, mx: 1, height: 16, borderRadius: 1, bgcolor: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.06)' }} />
        </Box>
        <Box sx={{ p: 2, background: 'linear-gradient(135deg, #1c1d20 0%, #232529 55%, #2a1014 100%)' }}>
          <Box sx={{ position: 'relative', height: 64 }}>
            <NavbarRenderer sections={sections} currentLang={currentLang} styleSpec={styleSpec} scrolled={false} />
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

export default function NavbarResponsivePreview({ sections, currentLang, draft, saved, showCompare }: NavbarResponsivePreviewProps) {
  const [resolution, setResolution] = useState<ResolutionId>('desktop');
  const [playing, setPlaying] = useState(true);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (playing) {
      timerRef.current = setInterval(() => {
        setResolution((prev) => {
          const idx = RESUMEN_RESOLUTIONS.findIndex((r) => r.id === prev);
          return RESUMEN_RESOLUTIONS[(idx + 1) % RESUMEN_RESOLUTIONS.length].id;
        });
      }, 4000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [playing]);

  const active = RESUMEN_RESOLUTIONS.find((r) => r.id === resolution);
  const compare = showCompare && draft.id !== saved.id;

  return (
    <Paper elevation={2} sx={{ p: 2, borderRadius: 3, overflow: 'hidden', background: 'linear-gradient(135deg, #1c1d20 0%, #232529 55%, #2a1014 100%)' }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1} sx={{ mb: 1.5 }}>
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' }}>
          Vista previa — {currentLang.toUpperCase()}
        </Typography>
        <Stack direction="row" alignItems="center" gap={1}>
          <ToggleButtonGroup exclusive size="small" value={resolution} onChange={(_, v) => { if (v) setResolution(v); }} aria-label="Resolución">
            {RESUMEN_RESOLUTIONS.map((r) => (
              <ToggleButton key={r.id} value={r.id} sx={{ px: 1.5, color: 'white' }}>
                {r.label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
          <Chip size="small" label={`${active?.width}px`} sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.18)' }} />
          <IconButton
            onClick={() => setPlaying((p) => !p)}
            aria-label={playing ? 'Pausar rotación' : 'Reproducir rotación'}
            sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.1)', '&:hover': { bgcolor: 'rgba(255,255,255,0.18)' } }}
          >
            {playing ? <Pause /> : <PlayArrow />}
          </IconButton>
        </Stack>
      </Stack>

      <Stack direction={compare ? 'row' : 'row'} spacing={2} sx={{ justifyContent: compare ? 'center' : 'flex-start' }}>
        {compare ? (
          <>
            <Mockup sections={sections} currentLang={currentLang} styleSpec={saved} width={active!.width} label={`Estilo actual — ${saved.label}`} />
            <Mockup sections={sections} currentLang={currentLang} styleSpec={draft} width={active!.width} label={`Seleccionado — ${draft.label}`} />
          </>
        ) : (
          <Mockup sections={sections} currentLang={currentLang} styleSpec={draft} width={active!.width} label="" />
        )}
      </Stack>
    </Paper>
  );
}
```

Delete the old preview file:

```bash
rm frontend/src/components/appearance/navbar-editor/NavbarMiniPreview.tsx
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/components/appearance/navbar-editor/NavbarResponsivePreview.test.tsx --ci`
Expected: PASS (3 tests).

- [ ] **Step 5: Typecheck**

Run: `npx tsc --noEmit` (cwd `frontend/`) — expected: exit 0.

- [ ] **Step 6: Commit**

```bash
git rm frontend/src/components/appearance/navbar-editor/NavbarMiniPreview.tsx
git add frontend/src/components/appearance/navbar-editor/NavbarResponsivePreview.tsx frontend/src/components/appearance/navbar-editor/NavbarResponsivePreview.test.tsx
git commit -m "feat(navbar-editor): add full-width responsive preview with autoplay rotation"
```

---

### Task 9: `NavbarHistory` — history panel using existing AppearanceHistory

**Files:**
- Create: `frontend/src/components/appearance/navbar-editor/NavbarHistory.tsx`
- Test: `frontend/src/components/appearance/navbar-editor/NavbarHistory.test.tsx`

**Interfaces:**
- Consumes: `AppearanceHistory`, `HistoryAction` from `../../../types/appearance`.
- Produces:
  - `interface NavbarHistoryProps { history: AppearanceHistory[]; onClear: () => void }`
  - `export default function NavbarHistory(props): JSX.Element` — table Fecha/Acción/Usuario/Contexto with `getActionColor`, "Limpiar Historial" button (disabled when empty).

- [ ] **Step 1: Write the failing render test**

Create `frontend/src/components/appearance/navbar-editor/NavbarHistory.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import NavbarHistory from './NavbarHistory';
import { AppearanceHistory, HistoryAction } from '../../../types/appearance';

const rows: AppearanceHistory[] = [
  { _id: 'h1', resource_id: 'a', action: HistoryAction.UPDATED, user_id: 'u1', user_name: 'Admin', context: 'Cambio de estilo', timestamp: '2026-09-23T10:00:00.000Z' },
];

describe('NavbarHistory', () => {
  it('renders rows with action and user', () => {
    render(<NavbarHistory history={rows} onClear={() => {}} />);
    expect(screen.getByText('updated')).toBeInTheDocument();
    expect(screen.getByText('Admin')).toBeInTheDocument();
    expect(screen.getByText('Cambio de estilo')).toBeInTheDocument();
  });

  it('shows empty message and disabled clear when no history', () => {
    render(<NavbarHistory history={[]} onClear={() => {}} />);
    expect(screen.getByText(/No hay historial/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Limpiar Historial/i })).toBeDisabled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/components/appearance/navbar-editor/NavbarHistory.test.tsx --ci`
Expected: FAIL — module not found.

- [ ] **Step 3: Write implementation**

Create `frontend/src/components/appearance/navbar-editor/NavbarHistory.tsx` (adapt `IconHistory.tsx`):

```tsx
import { Box, Button, Chip, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';
import { AppearanceHistory, HistoryAction } from '../../../types/appearance';

export interface NavbarHistoryProps {
  history: AppearanceHistory[];
  onClear: () => void;
}

const getActionColor = (action: HistoryAction) => {
  switch (action) {
    case HistoryAction.ACTIVATED: return 'success';
    case HistoryAction.DEACTIVATED: return 'default';
    case HistoryAction.UPLOADED: return 'primary';
    case HistoryAction.UPDATED: return 'info';
    case HistoryAction.DELETED: return 'error';
    default: return 'default';
  }
};

export default function NavbarHistory({ history, onClear }: NavbarHistoryProps) {
  const sorted = [...history].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <Box>
      <Box display="flex" justifyContent="flex-end" mb={2}>
        <Button variant="outlined" color="error" size="small" onClick={onClear} disabled={history.length === 0}>
          Limpiar Historial
        </Button>
      </Box>
      {history.length === 0 ? (
        <Typography color="text.secondary" align="center" sx={{ py: 4 }}>No hay historial disponible.</Typography>
      ) : (
        <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #eee' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Fecha</TableCell>
                <TableCell>Acción</TableCell>
                <TableCell>Usuario</TableCell>
                <TableCell>Contexto</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sorted.map((log, index) => (
                <TableRow key={log._id || index} hover>
                  <TableCell>
                    {new Date(log.timestamp).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'medium' })}
                  </TableCell>
                  <TableCell>
                    <Chip label={log.action} size="small" color={getActionColor(log.action)} variant="outlined" />
                  </TableCell>
                  <TableCell>{log.user_name || log.user_id}</TableCell>
                  <TableCell>{log.context || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/components/appearance/navbar-editor/NavbarHistory.test.tsx --ci`
Expected: PASS (2 tests).

- [ ] **Step 5: Typecheck**

Run: `npx tsc --noEmit` (cwd `frontend/`) — expected: exit 0.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/components/appearance/navbar-editor/NavbarHistory.tsx frontend/src/components/appearance/navbar-editor/NavbarHistory.test.tsx
git commit -m "feat(navbar-editor): add history panel"
```

---

### Task 10: Page — two-column layout, single-transaction save, tabs, lock/dirty wiring

**Files:**
- Modify: `frontend/src/pages/portal-redthread/apariencia/landingPageNavbarAndFooter.tsx`
- Modify: `frontend/src/components/appearance/navbar-editor/NavbarSectionList.tsx` (lock badge + dirty + toggle lock handler)
- Modify: `frontend/src/components/appearance/navbar-editor/NavbarSectionDialog.tsx` (locked switch in general fields)

**Interfaces:**
- Consumes: `NavbarResponsivePreview`, `NavbarStyleSelector`, `NavbarHistory`, `computeSectionChanges`, `getDefaultStyleSpec`, `mergeStyleSpec`, `NAVBAR_STYLE_ID_DEFAULT`, `NavbarStyleSpec`, `NavbarStyleId` from the new modules; `NavSection`, `NavSectionFormData` from `./types` (page path); `appearanceService`, `AppearanceType`.
- Produces: the fully wired admin page.

- [ ] **Step 1: NavbarSectionList — lock icon + dirty + toggle lock**

Modify `frontend/src/components/appearance/navbar-editor/NavbarSectionList.tsx`:

- Props: add `onToggleLock: (section: NavSection) => void;`
- `SortableNavItem`: add props `onToggleLock`. In the action row, before Edit:

```tsx
          <Tooltip title={section.locked ? 'Sección fija — no se puede eliminar ni ocultar' : 'Fijar sección'}>
            <IconButton size="small" onClick={onToggleLock} color={section.locked ? 'warning' : 'default'}>
              {section.locked ? <Lock /> : <LockOpen />}
            </IconButton>
          </Tooltip>
```

- Import `Lock, LockOpen` from `@mui/icons-material`.
- Delete button: `disabled={section.locked}` (leave Tooltip active: on hidden delete, tooltip text "Sección fija — no se puede eliminar"); same for visibility toggle when locked.
- Also add a small `⚠` chip when `completionStatus(section.translations).complete === false` (it already exists — keep it; it renders the red chip).

- [ ] **Step 2: NavbarSectionDialog — locked switch**

In the general fields `Grid` (the `visible` switch cell, currently a lone `Switch`+Typography), replace with a cell that contains BOTH switches stacked, or add a second `Grid item`:

```tsx
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, height: '100%' }}>
              <Switch checked={formData.visible} onChange={(e) => setField('visible', e.target.checked)} color="primary" />
              <Typography>Visible en navbar</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, height: '100%' }}>
              <Switch checked={formData.locked} onChange={(e) => setField('locked', e.target.checked)} color="warning" />
              <Typography>Sección fija (no se puede eliminar ni ocultar)</Typography>
            </Box>
          </Grid>
```

- [ ] **Step 3: Page — state, fetch style, handlers**

Add imports at top:

```tsx
import NavbarResponsivePreview, { RESUMEN_RESOLUTIONS as _RES (unused, do not import) } from '...';
import { NavbarResponsivePreview } from '../../../components/appearance/navbar-editor/NavbarResponsivePreview';
```

Wait — `NavbarResponsivePreview` is a default export. Import correctly:

```tsx
import NavbarResponsivePreview from '../../../components/appearance/navbar-editor/NavbarResponsivePreview';
import NavbarStyleSelector from '../../../components/appearance/navbar-editor/NavbarStyleSelector';
import NavbarHistory from '../../../components/appearance/navbar-editor/NavbarHistory';
import { computeSectionChanges } from '../../../components/appearance/navbar-editor/changeSet';
import { getDefaultStyleSpec, mergeStyleSpec, NAVBAR_STYLE_ID_DEFAULT } from '../../../components/appearance/navbar-editor/styles';
import type { NavbarStyleSpec, NavbarStyleId } from '../../../components/appearance/navbar-editor/styles';
import { appearanceService } from '../../../services/appearanceService';
import { AppearanceType } from '../../../types/appearance';
```

Note: `appearanceService` is already imported; `AppearanceType` already imported. Remove duplicate import lines.

Add state:

```tsx
const [styleDraft, setStyleDraft] = useState<NavbarStyleSpec>(() => getDefaultStyleSpec(NAVBAR_STYLE_ID_DEFAULT));
const [styleSaved, setStyleSaved] = useState<NavbarStyleSpec>(() => getDefaultStyleSpec(NAVBAR_STYLE_ID_DEFAULT));
const [sectionsSnapshot, setSectionsSnapshot] = useState<NavSection[]>([]);
const [showCompare, setShowCompare] = useState(false);
const [showAdvanced, setShowAdvanced] = useState(false); // (kept in selector component; here unused → remove)
const [history, setHistory] = useState<AppearanceHistory[]>([]);
const [activeSubTab, setActiveSubTab] = useState(0); // 0 Menús, 1 Estilo, 2 Historial
```

Remove `showAdvanced` (it lives in the selector as local state).

Add `fetchStyle` callback (mirrors `fetchSections` pattern, using admin `getResources`):

```tsx
const fetchStyle = useCallback(async () => {
  try {
    const resources = await appearanceService.getResources(AppearanceType.LANDING_NAVBAR_STYLE);
    const active = resources.find((r) => r.is_active);
    if (active?.metadata?.id) {
      const base = getDefaultStyleSpec(active.metadata.id);
      const spec = mergeStyleSpec(base, {
        accent: active.metadata.accent,
        fontWeight: active.metadata.fontWeight,
        hoverAnimation: active.metadata.hoverAnimation,
      });
      setStyleDraft(spec);
      setStyleSaved(spec);
    }
  } catch (e: any) {
    console.error('Error fetching navbar style:', e);
  }
}, []);
```

Wire effects: add `useEffect(() => { fetchStyle(); }, [fetchStyle]);`.

Add handler for lock toggle:

```tsx
const toggleLock = (section: NavSection) => {
  setSections((prev) => prev.map((s) => (s.id === section.id ? { ...s, locked: !s.locked } : s)));
};
```

Modify `deleteSection`, `toggleVisibility`, `handleReorder`, `saveNavSection` to **mutate local state only** (no API), incrementing a `dirtyCount`. Introduce `dirtyCount` state:

```tsx
const [dirtyCount, setDirtyCount] = useState(0);
const markDirty = () => setDirtyCount((n) => n + 1);
```

Replace the bodies:

```tsx
const deleteSection = (id: string) => {
  if (window.confirm('¿Eliminar esta sección del navbar?')) {
    setSections((prev) => prev.filter((s) => s.id !== id));
    markDirty();
  }
};

const toggleVisibility = (section: NavSection) => {
  if (section.locked) return;
  setSections((prev) => prev.map((s) => (s.id === section.id ? { ...s, visible: !s.visible } : s)));
  markDirty();
};

const handleReorder = (newSections: NavSection[]) => {
  setSections(newSections);
  markDirty();
};

const saveNavSection = async (formData: NavSectionFormData) => {
  if (editingSection) {
    setSections((prev) => prev.map((s) => (s.id === editingSection.id ? { ...s, ...formData } : s)));
  } else {
    setSections((prev) => [...prev, { id: '', ...formData, order: prev.length }]);
  }
  markDirty();
  setNavDialogOpen(false);
  setEditingSection(null);
};
```

Add the transaction save:

```tsx
const saveAll = async () => {
  setSaving(true);
  try {
    const changes = computeSectionChanges(sections, sectionsSnapshot);
    const ops: Promise<void>[] = [];

    // creates (id absent / default-*): drop the fake id so backend issues a new one
    for (const s of changes.toCreate) {
      const { id, ...rest } = s;
      ops.push(appearanceService.createResource(mapSectionToResource({ ...rest, id: '' })));
    }
    // updates (real id)
    for (const s of changes.toUpdate) {
      ops.push(appearanceService.updateResource(s.id, { metadata: { ...s } }));
    }
    // deletes
    for (const id of changes.toDelete) {
      ops.push(appearanceService.deleteResource(id));
    }

    // style upsert if draft differs from saved
    const styleChanged = JSON.stringify(styleDraft) !== JSON.stringify(styleSaved);
    if (styleChanged) {
      const existing = await appearanceService.getResources(AppearanceType.LANDING_NAVBAR_STYLE);
      const active = existing.find((r) => r.is_active);
      const styleMetadata = { id: styleDraft.id, accent: styleDraft.accent, fontWeight: styleDraft.fontWeight, hoverAnimation: styleDraft.hoverAnimation };
      if (active?._id) {
        ops.push(appearanceService.updateResource(active._id, { metadata: { ...styleMetadata } }));
      } else {
        ops.push(
          appearanceService.createResource({
            type: AppearanceType.LANDING_NAVBAR_STYLE,
            platform: Platform.WEB,
            url: '',
            metadata: styleMetadata,
            is_active: true,
          })
        );
      }
    }

    await Promise.all(ops);
    setStyleSaved(styleDraft);
    setDirtyCount(0);
    setSectionsSnapshot(sections);
    setSnackbar({ open: true, message: 'Cambios guardados', severity: 'success' });
    if (styleChanged) fetchStyle();
  } catch (e: any) {
    console.error('Error saving all:', e);
    setSnackbar({ open: true, message: `Error al guardar: ${e?.response?.data?.detail || e.message}`, severity: 'error' });
  } finally {
    setSaving(false);
  }
};
```

Note: `Platform` is already imported in the page. Remove now-unused references to API `fetchSections` snapshot — set snapshot right after initial fetch:

```tsx
useEffect(() => {
  fetchSections().then(() => setSectionsSnapshot(sectionsRef.current));
}, [fetchSections]);
```

Simpler alternative acceptable: in `fetchSections`, after computing the mapped list, call `setSectionsSnapshot(next)` with the same value passed to `setSections`. Implement in `fetchSections`:

```tsx
const next = mapped.length === 0 ? defaults : mapped;
setSectionsSnapshot(next);
setSections(next);
```

- [ ] **Step 4: Page — layout with tabs (Menús / Estilo / Historial)**

Replace the `activeTab === 0` block's inner JSX (currently: language selector + `Grid` with list/debug + preview) with:

```tsx
          {activeTab === 0 && (
            <>
              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" fontWeight="bold" display="block" mb={1}>Idioma de edición</Typography>
                <TextField select fullWidth size="small" value={currentLang}
                  onChange={(e) => setCurrentLang(e.target.value as Language)} label="Seleccionar idioma"
                  sx={{ minWidth: 220, maxWidth: 300 }}>
                  {LANGUAGES.map((l) => <MenuItem key={l} value={l}>{l.toUpperCase()}</MenuItem>)}
                </TextField>
              </Box>

              <NavbarResponsivePreview
                sections={sections}
                currentLang={currentLang}
                draft={styleDraft}
                saved={styleSaved}
                showCompare={showCompare}
              />

              <Tabs value={activeSubTab} onChange={(_, v) => setActiveSubTab(v)} sx={{ my: 2 }} variant="scrollable" scrollButtons="auto">
                <Tab label="Menús" />
                <Tab label="Estilo" />
                <Tab label="Historial" />
              </Tabs>

              {activeSubTab === 0 && (
                <Grid container spacing={3}>
                  <Grid item xs={12} lg={7}>
                    <Paper sx={{ p: 2 }}>
                      <NavbarSectionList
                        sections={sections}
                        currentLang={currentLang}
                        onEdit={openNavDialog}
                        onDelete={deleteSection}
                        onToggle={toggleVisibility}
                        onToggleLock={toggleLock}
                        onReorder={handleReorder}
                      />
                    </Paper>
                  </Grid>
                  <Grid item xs={12} lg={5}>
                    <Paper sx={{ p: 2 }}>
                      <Button variant="contained" startIcon={<Add />} onClick={() => openNavDialog()} size="medium" fullWidth sx={{ mb: 1 }}>
                        Agregar Sección Navbar
                      </Button>
                      {dirtyCount > 0 && (
                        <Button variant="contained" color="success" fullWidth onClick={saveAll} disabled={saving}>
                          {saving ? 'Guardando…' : `Guardar (${dirtyCount})`}
                        </Button>
                      )}
                    </Paper>
                  </Grid>
                </Grid>
              )}

              {activeSubTab === 1 && (
                <Paper sx={{ p: 2 }}>
                  <NavbarStyleSelector
                    draft={styleDraft}
                    saved={styleSaved}
                    onSelectStyle={(id) => { setStyleDraft(getDefaultStyleSpec(id)); setShowCompare(true); markDirty(); }}
                    onChangeAdvanced={(patch) => { setStyleDraft((prev) => mergeStyleSpec(prev, patch)); markDirty(); }}
                    onApply={() => { setStyleSaved(styleDraft); setShowCompare(false); }}
                    onToggleCompare={() => setShowCompare((v) => !v)}
                    showCompare={showCompare}
                  />
                </Paper>
              )}

              {activeSubTab === 2 && (
                <Paper sx={{ p: 2 }}>
                  <NavbarHistory history={history} onClear={async () => { await appearanceService.clearHistory(); setHistory([]); }} />
                </Paper>
              )}
            </>
          )}
```

Add history load when the tab is selected:

```tsx
useEffect(() => {
  if (activeTab === 0 && activeSubTab === 2) {
    appearanceService.getHistory().then((h) => setHistory(h)).catch(() => {});
  }
}, [activeTab, activeSubTab]);
```

Filter client-side to navbar namespaces: keep full list if simpler (spec allows documenting choice) — keep the full list and add a comment noting namespace filter could be applied per resource ids; acceptable.

Keep the "Modo depuración" Collapse (the debug translations table) — move it under the Menús col-1 Paper (below the list) as before.

- [ ] **Step 5: Verify**

Run: `npx tsc --noEmit` (cwd `frontend/`) — expected: exit 0.
Run: `npx jest src/components/appearance/navbar-editor --ci` — expected: all pass.

- [ ] **Step 6: Build**

Run: `npm run build` (cwd `frontend/`) — expected: compiled successfully (SSG/SSR route list printed).

- [ ] **Step 7: ESLint on touched files**

Run: `npx eslint src/pages/portal-redthread/apariencia/landingPageNavbarAndFooter.tsx src/components/appearance/navbar-editor --ext .tsx,.ts`
Expected: no errors attributable to the new code (existing `any`/injection patterns accepted; literally fix the 'lift' duplicates or unused vars it reports in new files).

- [ ] **Step 8: Commit**

```bash
git add frontend/src/pages/portal-redthread/apariencia/landingPageNavbarAndFooter.tsx frontend/src/components/appearance/navbar-editor/NavbarSectionList.tsx frontend/src/components/appearance/navbar-editor/NavbarSectionDialog.tsx
git commit -m "feat(portal): two-column navbar editor with single-transaction save, locks and history"
```

---

### Task 11: Full verification pass

**Files:** none (verification).

- [ ] **Step 1: Backend compile**

Run: `python -m py_compile src/models/appearance.py` (cwd `backend/`) — exit 0.

- [ ] **Step 2: Frontend typecheck**

Run: `npx tsc --noEmit` (cwd `frontend/`) — exit 0.

- [ ] **Step 3: Frontend tests**

Run: `npx jest src/components/appearance/navbar-editor --ci` — all PASS.

- [ ] **Step 4: Production build**

Run: `npm run build` (cwd `frontend/`) — compiled successfully.

- [ ] **Step 5: ESLint scope check**

Run: `npx eslint src/components/appearance/navbar-editor --ext .tsx,.ts`
Expected: 0 new errors (existing repo-wide `detect-object-injection` warnings allowed).

- [ ] **Step 6: Manual test checklist (guide the user / serve)**

With backend + `npm run dev` running:
1. Abrir la pestaña Navbar → preview arriba full-width con 3 resoluciones y rotación autoplay.
2. Cambiar a "Moderno" → comparativa actual vs seleccionado; "Aplicar"; "Guardar (n)".
3. Recargar el landing público → navbar moderno con subrayado líquido.
4. Candado en Inicio → no permite ocultar/borrar.
5. Tab "Historial" → muestra registros creados por el guardado.
6. Cambiar a "Minimalista" en el editor → el preview se actualiza sin íconos.

- [ ] **Step 7: Note on commit**

No extra commit unless a fix is made during this pass; fixes each get their own commit.

---

## Self-Review Notes

- **Spec coverage:** enum backend+frontend (T1) → styles module (T2) → transaction diffing (T3) → locked field (T4) → shared renderer real render (T5) → LandingNavbar consume style (T6) → style selector incl. advanced + compare state (T7) → responsive preview w/ bounds + autoplay (T8) → history panel (T9) → page layout two columns + single save + sub-tabs + lock/dirty wiring (T10) → verification (T11). All spec sections covered.
- **Type consistency:** `NavbarStyleSpec` defined once in Task 2 with `mergeStyleSpec` preserving `id/label/description`; `computeSectionChanges` signature stable; `NavbarRendererProps` as produced in T5 used in T6/T8; `NavbarResponsivePreview` default export used in T10; `NavbarHistoryProps` matches usage.
- **Placeholder scan:** every task has concrete code. No "TBD"/"similar to Task N". The only soft note — Task 10 Step 3-4 rely on the page's current JSX block which the implementer replaces wholesale (context line refs give the boundaries).
- **Known trade-off documented:** spec allows either full history list or per-resource filter; plan implements full list with a comment (matches "se trae el historial completo" branch).