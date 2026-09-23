import { computeSectionChanges } from './changeSet';
import { NavSection, LANGUAGES } from './types';

const emptyT = () => LANGUAGES.reduce((a, l) => ({ ...a, [l]: '' }), {} as Record<string, string>);

const base = (id: string, over: Partial<NavSection> = {}): NavSection => ({
  id,
  key: id,
  route: '/',
  icon: 'Home',
  visible: true,
  locked: false,
  order: 0,
  translations: emptyT(),
  ...over,
});

describe('computeSectionChanges', () => {
  it('flags default- prefixed / empty ids as creates', () => {
    const res = computeSectionChanges(
      [base('default-0'), base(''), base('abc')],
      []
    );
    expect(res.toCreate.map((s) => s.id)).toEqual(['default-0', '']);
    expect(res.toUpdate.map((s) => s.id)).toEqual(['abc']);
  });

  it('flags real ids whose metadata changed as updates', () => {
    const snapshot = [base('a', { order: 0 })];
    const working = [base('a', { order: 1 })];
    const res = computeSectionChanges(working, snapshot);
    expect(res.toUpdate.map((s) => s.id)).toEqual(['a']);
  });

  it('ignores real ids unchanged', () => {
    const res = computeSectionChanges([base('a')], [base('a')]);
    expect(res.toUpdate).toHaveLength(0);
    expect(res.toDelete).toHaveLength(0);
  });

  it('flags snapshot real ids missing from working as deletes', () => {
    const res = computeSectionChanges([base('a')], [base('a'), base('b')]);
    expect(res.toDelete).toEqual(['b']);
  });
});