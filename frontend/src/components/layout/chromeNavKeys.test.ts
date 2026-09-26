import fs from 'fs';
import path from 'path';
import { supportedLanguages } from '../../config/languages';

const CHROME_FILES = [
  'src/components/layout/Layout.tsx',
  'src/components/layout/Footer.tsx',
  'src/components/layout/Sidebar.tsx',
];

const getValue = (data: unknown, dotted: string): unknown =>
  dotted
    .split('.')
    .reduce<unknown>(
      (acc, key) => (acc && typeof acc === 'object' ? (acc as Record<string, unknown>)[key] : undefined),
      data
    );

const extractKeys = (): string[] => {
  const keys = new Set<string>();
  for (const rel of CHROME_FILES) {
    const src = fs.readFileSync(path.join(process.cwd(), rel), 'utf8');
    for (const m of src.matchAll(/\bt\(\s*'([^']+)'/g)) {
      keys.add(m[1]);
    }
  }
  return [...keys].sort();
};

describe('portal chrome translations parity', () => {
  const keys = extractKeys();

  it('extracts literal translation keys from Layout, Footer and Sidebar', () => {
    expect(keys.length).toBeGreaterThanOrEqual(45);
    expect(keys).toEqual(
      expect.arrayContaining(['nav.home', 'footer.privacy', 'theme.dark', 'auth.logout'])
    );
  });

  it.each(supportedLanguages.map((l) => l.code))(
    '%s/common.json defines every chrome translation key',
    (locale) => {
      const file = path.join(process.cwd(), 'public', 'locales', locale, 'common.json');
      expect(fs.existsSync(file)).toBe(true);
      const data: unknown = JSON.parse(fs.readFileSync(file, 'utf8'));
      for (const key of keys) {
        const value = getValue(data, key);
        expect(typeof value).toBe('string');
        expect((value as string).trim()).not.toBe('');
      }
    }
  );
});
