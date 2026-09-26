import fs from 'fs';
import path from 'path';
import { supportedLanguages } from '../../config/languages';

const OVERLAY_FILE = 'src/components/profile/ProfileOverlay.tsx';

const EXPECTED_KEYS = [
  'card.potentialConnection',
  'card.firstFlash',
  'card.swipeForCompat',
  'card.analysisTitle',
  'card.breakdownIntent',
  'card.breakdownMusic',
  'card.breakdownValues',
  'card.breakdownLifestyle',
  'card.personalityTitle',
  'card.noPrompt',
  'card.tapLock',
  'card.distanceKm',
  'card.nearYou',
  'card.discoveryChip',
  'card.curiousChip',
  'card.veryActiveChip',
  'card.vibesTitle',
  'card.professionalTitle',
  'card.atCompany',
  'card.emotionalTitle',
  'card.myHimno',
  'card.lookingFor',
  'card.uniqueMindTitle',
  'card.neurodiversity',
  'card.viewMore',
];

const collectKeys = (): Set<string> => {
  const src = fs.readFileSync(path.join(process.cwd(), OVERLAY_FILE), 'utf8');
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

describe('ProfileOverlay i18n (common namespace)', () => {
  const keys = collectKeys();

  it('translates every hardcoded card string', () => {
    for (const expected of EXPECTED_KEYS) {
      expect(keys).toContain(expected);
    }
  });

  it('uses the common namespace', () => {
    const src = fs.readFileSync(path.join(process.cwd(), OVERLAY_FILE), 'utf8');
    expect(src).toMatch(/useTranslation\(\s*\[?\s*['"]common['"]/);
  });

  it.each(supportedLanguages.map((l) => l.code))(
    '%s/common.json defines every key used by ProfileOverlay',
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
