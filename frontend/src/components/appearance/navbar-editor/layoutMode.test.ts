import { resolveNavbarLayoutMode } from './layoutMode';

describe('resolveNavbarLayoutMode', () => {
  it('maps widths up to 767 to mobile', () => {
    expect(resolveNavbarLayoutMode(375)).toBe('mobile');
    expect(resolveNavbarLayoutMode(767)).toBe('mobile');
  });

  it('maps 768 to 1024 to tablet', () => {
    expect(resolveNavbarLayoutMode(768)).toBe('tablet');
    expect(resolveNavbarLayoutMode(1024)).toBe('tablet');
  });

  it('maps 1025 and above to desktop', () => {
    expect(resolveNavbarLayoutMode(1025)).toBe('desktop');
    expect(resolveNavbarLayoutMode(1440)).toBe('desktop');
  });
});
