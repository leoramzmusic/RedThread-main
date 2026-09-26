import fs from 'fs';
import path from 'path';
import { supportedLanguages } from '../../config/languages';

const NAV_KEYS = [
  'nav.home',
  'nav.discover',
  'nav.blueth',
  'nav.goldth',
  'nav.chat',
  'nav.visits',
  'nav.purpleth',
  'nav.likes',
  'nav.roulette',
  'nav.radar',
  'nav.events',
  'nav.premium',
  'nav.settings',
  'nav.appearance',
  'nav.notifications',
  'nav.security',
  'nav.accessibility',
  'nav.privacy',
  'nav.advanced',
  'nav.section.social',
  'nav.section.entertainment',
  'nav.section.organization',
  'nav.section.system',
];

const getValue = (data: unknown, dotted: string): unknown =>
  dotted
    .split('.')
    .reduce<unknown>(
      (acc, key) => (acc && typeof acc === 'object' ? (acc as Record<string, unknown>)[key] : undefined),
      data
    );

describe('sidebar nav translations parity', () => {
  it('defines 23 sidebar nav keys', () => {
    expect(NAV_KEYS).toHaveLength(23);
  });

  it.each(supportedLanguages.map((l) => l.code))(
    '%s/common.json defines every sidebar nav key',
    (locale) => {
      const file = path.join(process.cwd(), 'public', 'locales', locale, 'common.json');
      expect(fs.existsSync(file)).toBe(true);
      const data: unknown = JSON.parse(fs.readFileSync(file, 'utf8'));
      for (const key of NAV_KEYS) {
        const value = getValue(data, key);
        expect(typeof value).toBe('string');
        expect((value as string).trim()).not.toBe('');
      }
    }
  );

  it.each(supportedLanguages.map((l) => l.code).filter((c) => c !== 'en'))(
    '%s translates nav.purpleth instead of reusing the English label',
    (locale) => {
      const file = path.join(process.cwd(), 'public', 'locales', locale, 'common.json');
      const data: unknown = JSON.parse(fs.readFileSync(file, 'utf8'));
      const value = getValue(data, 'nav.purpleth');
      expect(typeof value).toBe('string');
      expect(value).not.toBe('Gaming Zone');
    }
  );
});
