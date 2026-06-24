import { readdir } from 'fs/promises';
import path from 'path';

import HomePageClient from './home-page-client';

type CatalogTrack = {
  id: string;
  src: string;
  title: string;
  format: string;
};

function formatTrackTitle(fileName: string) {
  return fileName
    .replace(/\.[^.]+$/, '')
    .replace(/^AIYA KAREEM\s*/i, '')
    .replace(/\s*\(([^)]+)\)\s*/g, ' $1 ')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function getCatalogTracks(): Promise<CatalogTrack[]> {
  const catalogDirectory = path.join(process.cwd(), 'public', 'catalog');
  const entries = await readdir(catalogDirectory, { withFileTypes: true });

  return entries
    .filter((entry) => entry.isFile())
    .map((entry) => {
      const extension = path.extname(entry.name).slice(1).toUpperCase() || 'AUDIO';
      const id = entry.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

      return {
        id,
        src: `/catalog/${encodeURIComponent(entry.name)}`,
        title: formatTrackTitle(entry.name),
        format: extension,
      };
    });
}

export default async function Home() {
  const catalogTracks = await getCatalogTracks();

  return <HomePageClient catalogTracks={catalogTracks} />;
}
