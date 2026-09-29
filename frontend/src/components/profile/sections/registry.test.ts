// country-codes-list@2.1.0 sets __esModule without a default export, so its
// default import is undefined under Jest (breaks via BasicInfoSection).
// Stub only the third-party module; the registry still holds the real components.
jest.mock('country-codes-list', () => ({
  customList: () => ({ MX: 'Mexico|52' }),
}));

import { PROFILE_SECTION_REGISTRY } from './registry';

const SEED_KEYS = ['section-photos','section-basic','section-location','section-aboutme','section-goals','section-interests','section-pronouns','section-additional','section-professional','section-music','section-identity','section-personality','section-cognitive','section-wellness','section-status','section-languages'];

test('registry covers every seeded key', () => {
  for (const key of SEED_KEYS) {
    expect(PROFILE_SECTION_REGISTRY[key]).toBeDefined();
  }
});
