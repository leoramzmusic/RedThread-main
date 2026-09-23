import { NavSection } from './types';

export interface SectionChangeSet {
  toCreate: NavSection[];
  toUpdate: NavSection[];
  toDelete: string[];
}

const META_FIELDS = ['key', 'route', 'icon', 'visible', 'locked', 'order', 'translations'] as const;

export function hasRealId(section: NavSection): boolean {
  return !!section.id && !section.id.startsWith('default-');
}

function sameSection(a: NavSection, b: NavSection): boolean {
  if (a.id !== b.id) return false;
  return META_FIELDS.every((f) => JSON.stringify(a[f]) === JSON.stringify(b[f]));
}

export function computeSectionChanges(working: NavSection[], snapshot: NavSection[]): SectionChangeSet {
  const snapshotById = new Map(snapshot.map((s) => [s.id, s]));

  const toCreate: NavSection[] = [];
  const toUpdate: NavSection[] = [];
  for (const section of working) {
    if (!hasRealId(section)) {
      toCreate.push(section);
      continue;
    }
    const prev = snapshotById.get(section.id);
    if (prev && !sameSection(section, prev)) toUpdate.push(section);
    else if (!prev) toUpdate.push(section);
  }

  const workingIds = new Set(working.map((s) => s.id));
  const toDelete = snapshot
    .filter((s) => hasRealId(s) && !workingIds.has(s.id))
    .map((s) => s.id);

  return { toCreate, toUpdate, toDelete };
}