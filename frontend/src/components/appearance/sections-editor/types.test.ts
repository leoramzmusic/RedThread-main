import {
  mapResourceToSection,
  mapSectionToResource,
  getSectionTitle,
  SECTION_CONTENT_TYPES,
} from './types';
import { AppearanceType, Platform, type AppearanceResource } from '../../../types/appearance';

describe('sections-editor types', () => {
  it('maps a bare resource to a section with defaults', () => {
    const r: AppearanceResource = {
      _id: 'r1',
      type: AppearanceType.LANDING_SECTIONS,
      platform: Platform.WEB,
      url: '',
      is_active: true,
    };
    expect(mapResourceToSection(r)).toEqual({
      id: 'r1',
      order: 0,
      contentType: 'text',
      visible: true,
      translations: {},
    });
  });

  it('maps a section to a landing_sections resource', () => {
    const res = mapSectionToResource({
      order: 2,
      contentType: 'video',
      visible: false,
      translations: { en: 'Clips', es: 'Videos' },
    });
    expect(res.type).toBe(AppearanceType.LANDING_SECTIONS);
    expect(res.platform).toBe(Platform.WEB);
    expect(res.url).toBe('');
    expect(res.is_active).toBe(true);
    expect(res.metadata).toEqual({
      order: 2,
      contentType: 'video',
      visible: false,
      translations: { en: 'Clips', es: 'Videos' },
    });
  });

  it('resolves titles with the same EN fallback as navbar', () => {
    expect(
      getSectionTitle(
        { id: 'x', order: 0, contentType: 'article', visible: true, translations: { en: 'News' } },
        'de'
      )
    ).toBe('News');
    expect(
      getSectionTitle(
        { id: 'x', order: 0, contentType: 'article', visible: true, translations: { en: 'News', de: 'Neues' } },
        'de'
      )
    ).toBe('Neues');
  });

  it('exposes the four content types', () => {
    expect(SECTION_CONTENT_TYPES.map((c) => c.value)).toEqual(['image', 'article', 'text', 'video']);
  });
});
