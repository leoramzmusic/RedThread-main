import { reorderSections, withOrder, resolveDragIndexes } from './reorder';

const items = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];

describe('reorderSections', () => {
  it('moves an item without mutating the input', () => {
    const out = reorderSections(items, 0, 2);
    expect(out.map((i) => i.id)).toEqual(['b', 'c', 'a']);
    expect(items.map((i) => i.id)).toEqual(['a', 'b', 'c']);
  });

  it('keeps the list when from === to or indexes are out of range', () => {
    expect(reorderSections(items, 1, 1).map((i) => i.id)).toEqual(['a', 'b', 'c']);
    expect(reorderSections(items, 5, 0).map((i) => i.id)).toEqual(['a', 'b', 'c']);
    expect(reorderSections(items, 0, 9).map((i) => i.id)).toEqual(['a', 'b', 'c']);
  });
});

describe('withOrder', () => {
  it('reindexes sequentially from 0', () => {
    const out = withOrder([
      { id: 'x', order: 9 },
      { id: 'y', order: 3 },
      { id: 'z', order: 77 },
    ]);
    expect(out.map((s) => s.order)).toEqual([0, 1, 2]);
  });
});

describe('resolveDragIndexes', () => {
  it('maps active/over ids to list positions', () => {
    expect(resolveDragIndexes(items, 'a', 'c')).toEqual({ from: 0, to: 2 });
    expect(resolveDragIndexes(items, 'c', 'a')).toEqual({ from: 2, to: 0 });
  });

  it('returns null for unknown ids', () => {
    expect(resolveDragIndexes(items, 'zz', 'c')).toBeNull();
    expect(resolveDragIndexes(items, 'a', 'yy')).toBeNull();
  });
});
