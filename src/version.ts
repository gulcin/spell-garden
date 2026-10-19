export const SEMVER = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;

export function serviceWorkerCacheId(version: string): string {
  if (!SEMVER.test(version)) throw new Error(`Spell Garden version must be semver, got ${version}`);
  return `spell-garden-v${version}`;
}

export type ReleaseSection = { title: string; items: string[] };
export type ReleaseNotes = { version: string; date: string; intro: string[]; sections: ReleaseSection[] };

export function parseChangelog(markdown: string): ReleaseNotes[] {
  const releases: ReleaseNotes[] = [];
  let current: ReleaseNotes | null = null;
  let section: ReleaseSection | null = null;
  for (const raw of markdown.split(/\r?\n/)) {
    const line = raw.trim();
    const release = /^## \[([^\]]+)\](?:\s+-\s+(\d{4}-\d{2}-\d{2}))?\s*$/.exec(line);
    if (release) {
      section = null;
      if (release[1] === 'Unreleased') {
        current = null;
        continue;
      }
      current = { version: release[1] ?? '', date: release[2] ?? '', intro: [], sections: [] };
      releases.push(current);
      continue;
    }
    if (!current || !line || line.startsWith('<!--') || line.startsWith('[')) continue;
    const heading = /^###\s+(.+)$/.exec(line);
    if (heading) {
      section = { title: heading[1]?.trim() ?? '', items: [] };
      current.sections.push(section);
      continue;
    }
    const item = /^-\s+(.+)$/.exec(line);
    if (item && section) {
      section.items.push(item[1]?.trim() ?? '');
      continue;
    }
    if (!section) current.intro.push(line);
  }
  return releases;
}

export const buildInfo = {
  version: __APP_VERSION__,
  sha: __APP_COMMIT__,
  date: __APP_DATE__,
};

export function versionLabel(info: { version: string; sha: string; date: string } = buildInfo): string {
  return `Version ${info.version} (${info.sha})`;
}

export function compareSemver(left: string, right: string): number {
  const parts = (value: string) =>
    value
      .split('+')[0]!
      .split('-')[0]!
      .split('.')
      .map((part) => Number.parseInt(part, 10) || 0);
  const a = parts(left);
  const b = parts(right);
  for (let index = 0; index < 3; index += 1) {
    const diff = (a[index] ?? 0) - (b[index] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

export const SEEN_VERSION_KEY = 'spell-garden.seenVersion';

export type GardenNewsPlan = 'record' | 'show' | 'stay';

/** A first visit is recorded quietly. A newer version opens the note for Aida. */
export function gardenNewsPlan(seen: string | null, current: string): GardenNewsPlan {
  if (!seen || !SEMVER.test(seen)) return 'record';
  if (compareSemver(current, seen) > 0) return 'show';
  return 'stay';
}

export function kidHighlights(notes: ReleaseNotes[], seen: string): string[] {
  return notes
    .filter((note) => SEMVER.test(note.version) && compareSemver(note.version, seen) > 0)
    .flatMap((note) => note.sections.filter((section) => section.title === 'For Aida').flatMap((section) => section.items));
}
