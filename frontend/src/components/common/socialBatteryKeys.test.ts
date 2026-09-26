import fs from 'fs';
import path from 'path';
import { supportedLanguages } from '../../config/languages';

const WIDGET_FILE = 'src/components/common/SocialBatteryWidget.tsx';

const EXPECTED_KEYS = [
  'battery.high.phrase',
  'battery.high.label',
  'battery.medium.phrase',
  'battery.medium.label',
  'battery.low.phrase',
  'battery.low.label',
  'battery.off.phrase',
  'battery.off.label',
];

const collectKeys = (): Set<string> => {
  const src = fs.readFileSync(path.join(process.cwd(), WIDGET_FILE), 'utf8');
  const keys = new Set<string>();
  for (const m of src.matchAll(/\bt\(\s*'([^']+)'/g)) keys.add(m[1]);
  return keys;
};

const getValue = (data: unknown, dotted: string): unknown =>
  dotted
    .split('.')
    .reduce<unknown>(
      (acc, key) => (acc && typeof acc === 'object' ? (acc as Record<string, unknown>)[key] : undefined),
      data
    );

describe('SocialBatteryWidget i18n (common namespace)', () => {
  const keys = collectKeys();

  it('translates every battery phrase and label', () => {
    for (const expected of EXPECTED_KEYS) {
      expect(keys).toContain(expected);
    }
  });

  it('uses the common namespace', () => {
    const src = fs.readFileSync(path.join(process.cwd(), WIDGET_FILE), 'utf8');
    expect(src).toMatch(/useTranslation\(\s*\[?\s*['"]common['"]/);
  });

  it.each(supportedLanguages.map((l) => l.code))(
    '%s/common.json defines every battery key',
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
