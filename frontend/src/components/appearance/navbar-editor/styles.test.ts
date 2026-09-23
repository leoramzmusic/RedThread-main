import {
  getDefaultStyleSpec,
  mergeStyleSpec,
  NAVBAR_STYLE_OPTIONS,
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
