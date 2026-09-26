import fs from 'fs';
import path from 'path';
import { supportedLanguages } from '../../config/languages';

const DISCOVER_FILES = [
  'src/pages/discover/index.tsx',
  'src/components/discovery/CompatibilityMeter.tsx',
  'src/components/discovery/QuickInterests.tsx',
  'src/components/discovery/DiscoveryRefinementCard.tsx',
  'src/components/discovery/DiscoveryModeSelector.tsx',
  'src/components/discovery/BoostActivationModal.tsx',
  'src/components/discovery/BoostStatusBadge.tsx',
  'src/components/discovery/DiscoverToolbar.tsx',
  'src/components/discovery/MoreModeSelection.tsx',
  'src/components/discovery/CareNarrativePanel.tsx',
  'src/components/discovery/CompatibilityTechnicalPanel.tsx',
  'src/components/discovery/InteractionSettingsDialog.tsx',
];

const LAYOUT_VALUES = ['stack', 'sticker_book', 'carousel', 'grid'];
const MODE_VALUES = ['buttons', 'taps', 'swipes', 'keyboard'];
const MORE_CATEGORY_IDS = [
  'stable_partner', 'serious_rel', 'free_today', 'nothing_serious', 'friends', 'non_monogamy',
  'verified', 'wants_kids', 'no_kids',
  'hobbies', 'music', 'foodies', 'travel', 'sports', 'coffee', 'dates', 'extreme', 'nature',
  'photography', 'pets', 'gaming',
];

const collectLiteralKeys = (): Set<string> => {
  const keys = new Set<string>();
  for (const rel of DISCOVER_FILES) {
    const src = fs.readFileSync(path.join(process.cwd(), rel), 'utf8');
    for (const m of src.matchAll(/\bt\(\s*'([^']+)'/g)) keys.add(m[1]);
    for (const m of src.matchAll(/i18nKey="([^"]+)"/g)) keys.add(m[1]);
  }
  return keys;
};

const collectDynamicKeys = (): Set<string> => {
  const keys = new Set<string>();
  for (const v of LAYOUT_VALUES) {
    keys.add(`interaction.layout.${v}.label`);
    keys.add(`interaction.layout.${v}.description`);
    for (let d = 1; d <= 3; d++) keys.add(`interaction.layout.${v}.detail${d}`);
    keys.add(`toast.layout.${v}`);
  }
  for (const v of MODE_VALUES) {
    keys.add(`interaction.mode.${v}.label`);
    keys.add(`interaction.mode.${v}.description`);
    keys.add(`interaction.mode.${v}.carePhrase`);
    for (let d = 1; d <= 4; d++) keys.add(`interaction.mode.${v}.detail${d}`);
  }
  for (const id of MORE_CATEGORY_IDS) keys.add(`moreMode.cat.${id}`);
  for (const v of ['suggested', 'opposites', 'blind', 'free', 'more']) keys.add(`modes.${v}.label`);
  return keys;
};

const getValue = (data: unknown, dotted: string): unknown =>
  dotted
    .split('.')
    .reduce<unknown>(
      (acc, key) => (acc && typeof acc === 'object' ? (acc as Record<string, unknown>)[key] : undefined),
      data
    );

describe('discover namespace translations parity', () => {
  const literalKeys = collectLiteralKeys();
  const dynamicKeys = collectDynamicKeys();
  const allKeys = new Set([...literalKeys, ...dynamicKeys]);

  it('finds literal t() keys across the discover files', () => {
    expect(literalKeys.size).toBeGreaterThan(40);
  });

  it('covers the dynamic (template-literal) keys', () => {
    expect(dynamicKeys.size).toBe(78);
  });

  it.each(DISCOVER_FILES)('%s uses the discover namespace', (rel) => {
    const src = fs.readFileSync(path.join(process.cwd(), rel), 'utf8');
    expect(src).toMatch(/useTranslation\(\s*\[?\s*['"]discover['"]/);
  });

  it.each(supportedLanguages.map((l) => l.code))(
    '%s/discover.json defines every key used by the discover UI',
    (locale) => {
      const file = path.join(process.cwd(), 'public', 'locales', locale, 'discover.json');
      expect(fs.existsSync(file)).toBe(true);
      const data: unknown = JSON.parse(fs.readFileSync(file, 'utf8'));
      for (const key of allKeys) {
        const value = getValue(data, key);
        expect(typeof value).toBe('string');
        expect((value as string).trim()).not.toBe('');
      }
    }
  );
});
