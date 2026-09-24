import { createLiquidGlassTheme, liquidColors, typeScale, fontFamilies, shapeTokens, motionTokens, getLandingHeroFontSize } from '../liquidGlass';
import type { ThemeMode, VisualTheme } from '../liquidGlass';

describe('createLiquidGlassTheme', () => {
  describe('palette', () => {
    it('redThread primary uses the Liquid Glass red #E63946', () => {
      const theme = createLiquidGlassTheme('light', 'redThread');
      expect(theme.palette.primary.main).toBe('#E63946');
    });

    it('palette.primary.light uses Rojo Claro #FF6B6B', () => {
      const theme = createLiquidGlassTheme('light');
      expect(theme.palette.primary.light).toBeDefined();
    });

    it('palette.primary.dark uses Rojo Oscuro #B71C1C', () => {
      const theme = createLiquidGlassTheme('light');
      expect(theme.palette.primary.dark).toBeDefined();
    });

    it('palette.error is the destination red #E63946', () => {
      const theme = createLiquidGlassTheme('light');
      expect(theme.palette.error.main).toBe('#E63946');
    });

    it('semantic info is the accent blue #3B82F6', () => {
      const theme = createLiquidGlassTheme('light');
      expect(theme.palette.info.main).toBe('#3B82F6');
    });

    it('success/warning map to the DNA semantic scale', () => {
      const theme = createLiquidGlassTheme('light');
      expect(theme.palette.success.main).toBe('#16A34A');
      expect(theme.palette.warning.main).toBe('#D97706');
    });

    it('text colors follow the neutral scale', () => {
      const light = createLiquidGlassTheme('light');
      const dark = createLiquidGlassTheme('dark');
      expect(light.palette.text.primary).toBe('#1A1B1E');
      expect(light.palette.text.secondary).toBe('#6B7280');
      expect(dark.palette.text.primary).toBe('#F6F7F9');
    });
  });

  describe('dark mode', () => {
    it('uses graphite #1A1B1E as default background', () => {
      const theme = createLiquidGlassTheme('dark');
      expect(theme.palette.background.default).toBe('#1A1B1E');
    });

    it('uses the light surface in light mode', () => {
      const theme = createLiquidGlassTheme('light');
      expect(theme.palette.background.default).toBe('#F5F6F8');
    });

    it('uses glass-surface backgrounds for paper', () => {
      const dark = createLiquidGlassTheme('dark');
      const light = createLiquidGlassTheme('light');
      expect(dark.palette.background.paper).toBe('#232428');
      expect(light.palette.background.paper).toBe('#FFFFFF');
    });
  });

  describe('typography', () => {
    it('uses Poppins for headings and Inter for body', () => {
      const theme = createLiquidGlassTheme('light');
      expect(theme.typography.fontFamily).toContain('Inter');
      expect(theme.typography.h1?.fontFamily).toContain('Poppins');
      expect(theme.typography.h2?.fontFamily).toContain('Poppins');
    });

    it('weight 600 across display scale', () => {
      const theme = createLiquidGlassTheme('light');
      expect(theme.typography.h1?.fontWeight).toBe(600);
      expect(theme.typography.h2?.fontWeight).toBe(600);
      expect(theme.typography.h3?.fontWeight).toBe(600);
    });

    it('buttons are not uppercase and weight 600', () => {
      const theme = createLiquidGlassTheme('light');
      expect(theme.typography.button?.textTransform).toBe('none');
      expect(theme.typography.button?.fontWeight).toBe(600);
    });
  });

  describe('shape & spacing', () => {
    it('borderRadius is 20 (medium)', () => {
      const theme = createLiquidGlassTheme('light');
      expect(theme.shape.borderRadius).toBe(shapeTokens.medium);
    });

    it('spacing uses the 8px base unit', () => {
      const theme = createLiquidGlassTheme('light');
      expect(theme.spacing(2)).toBe('16px');
    });
  });

  describe('visual themes map to distinct primaries', () => {
    const cases: Array<[VisualTheme, string]> = [
      ['blue', '#0CB7F2'],
      ['purple', '#7F4CA5'],
      ['green', '#5CCB5F'],
      ['vip', '#efb810'],
      ['pink', '#FC6998'],
    ];

    it.each(cases)('%s -> %s', (visual, expected) => {
      const theme = createLiquidGlassTheme('light', visual);
      expect(theme.palette.primary.main).toBe(expected);
    });
  });
});

describe('getLandingHeroFontSize', () => {
  it('mobile xs is viewport-fluid: contains vw and no max() floor that would dominate small screens', () => {
    const { xs } = getLandingHeroFontSize();
    expect(xs).toContain('vw');
    expect(xs).not.toMatch(/^max\(/);
    expect(xs).not.toContain('3.1rem');
  });

  it('without CMS: xs is the token clamp, md is 5rem with 4.6rem floor and never NaN', () => {
    const { xs, md } = getLandingHeroFontSize();
    expect(xs).toBe('clamp(1.95rem, 7.2vw, 3.6rem)');
    expect(md).toBe('max(5rem, 4.6rem)');
    expect(md).not.toContain('NaN');
  });

  it('with CMS size: mobile keeps the vw ramp with CMS as ceiling only', () => {
    const { xs, md } = getLandingHeroFontSize(4.6);
    expect(xs).toBe('clamp(1.95rem, 7.2vw, 4.6rem)');
    expect(md).toBe('max(4.6rem, 4.6rem)');
  });

  it('desktop md never drops below the 4.6rem floor', () => {
    expect(getLandingHeroFontSize(3).md).toBe('max(3rem, 4.6rem)');
  });
});

describe('token exports', () => {
  it('exposes the exact DNA colors with Rojo Destino as primary', () => {
    expect(liquidColors.primary).toBe('#E63946');
    expect(liquidColors.primaryLight).toBe('#FF6B6B');
    expect(liquidColors.primaryDark).toBe('#B71C1C');
    expect(liquidColors.accent).toBe('#3B82F6');
    expect(liquidColors.surface.background).toBe('#F5F6F8');
  });

  it('exposes the DNA type scale', () => {
    expect(typeScale.display.size).toBe('4.5rem');
    expect(typeScale.display.weight).toBe(600);
    expect(typeScale.body.size).toBe('1.0625rem');
  });

  it('exposes font families with Poppins heading + Inter body', () => {
    expect(fontFamilies.heading).toContain('Poppins');
    expect(fontFamilies.body).toContain('Inter');
  });

  it('maps motion durations and easing', () => {
    expect(motionTokens.durations.micro).toBe(140);
    expect(motionTokens.durations.macro).toBe(640);
    expect(motionTokens.easing).toBe('cubic-bezier(0.22, 1, 0.36, 1)');
  });
});