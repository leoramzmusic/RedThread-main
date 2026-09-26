import fs from 'fs';
import path from 'path';

const LAYOUT_PAGES = [
  'src/pages/chat/index.tsx',
  'src/pages/golth/index.tsx',
  'src/pages/likes/index.tsx',
  'src/pages/visits/index.tsx',
  'src/pages/friends/index.tsx',
  'src/pages/matches/index.tsx',
  'src/pages/profile/index.tsx',
  'src/pages/help/index.tsx',
  'src/pages/help/contact.tsx',
  'src/pages/legal/[type].tsx',
];

describe('pages that render the Sidebar load the common namespace', () => {
  it.each(LAYOUT_PAGES)('%s imports serverSideTranslations for common', (rel) => {
    const file = path.join(process.cwd(), rel);
    expect(fs.existsSync(file)).toBe(true);
    const src = fs.readFileSync(file, 'utf8');
    expect(src).toContain("from 'next-i18next/serverSideTranslations'");
    expect(src).toMatch(/export async function get(Static|ServerSide)Props/);
    expect(src).toMatch(/serverSideTranslations\([^)]*['"]common['"]/);
  });
});
