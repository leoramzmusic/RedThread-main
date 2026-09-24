export function reorderSections<T>(list: T[], from: number, to: number): T[] {
  if (from === to) return [...list];
  if (from < 0 || from >= list.length || to < 0 || to >= list.length) return [...list];
  const next = [...list];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

export function withOrder<T extends { order: number }>(sections: T[]): T[] {
  return sections.map((s, i) => ({ ...s, order: i }));
}

export function resolveDragIndexes<T extends { id: string }>(
  list: T[],
  activeId: string,
  overId: string
): { from: number; to: number } | null {
  const from = list.findIndex((s) => s.id === activeId);
  const to = list.findIndex((s) => s.id === overId);
  if (from < 0 || to < 0) return null;
  return { from, to };
}
