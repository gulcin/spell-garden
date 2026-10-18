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
  return `v${info.version} · ${info.sha} · ${info.date}`;
}
