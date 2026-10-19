import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { SPELL_GARDEN_CACHE } from '../vite.config.ts';
import { CHECK_INTERVAL_MS, planUpdate } from '../src/updates.ts';
import { gardenNewsPlan, kidHighlights, parseChangelog, serviceWorkerCacheId, versionLabel } from '../src/version.ts';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')) as { version: string };
const changelog = readFileSync(new URL('../CHANGELOG.md', import.meta.url), 'utf8');
const css = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8');
const sw = readFileSync(new URL('../src/swUpdates.ts', import.meta.url), 'utf8');

describe('Spell Garden version', () => {
  it('stamps semver 1.2.0 and keeps the service worker waiting for a tap', () => {
    expect(pkg.version).toBe('1.2.0');
    expect(serviceWorkerCacheId(pkg.version)).toBe('spell-garden-v1.2.0');
    expect(SPELL_GARDEN_CACHE).toBe('spell-garden-v1.2.0');
    expect(versionLabel({ version: '1.2.0', sha: 'abc1234', date: '2026-10-19' })).toBe('Version 1.2.0 (abc1234)');
    expect(css).toContain('-webkit-text-size-adjust: 100%');
    expect(css).toContain('text-size-adjust: 100%');
    expect(css).not.toContain('font-size: clamp');
  });

  it('reads the changelog', () => {
    const notes = parseChangelog(changelog);
    expect(notes[0]?.version).toBe('1.2.0');
    expect(notes[0]?.date).toBe('2026-10-19');
    expect(notes.at(-1)?.version).toBe('1.0.0');
    const written = notes.map((note) => note.sections.flatMap((section) => section.items).join(' ')).join(' ');
    expect(written).toMatch(/Tell us/);
    expect(written).toMatch(/fizzles softly/);
    expect(written).toMatch(/grade 3/);
    expect(written).toMatch(/home pill/);
    expect(written).toMatch(/crystal shop/);
    expect(written).toMatch(/lets go/);
    expect(written).toMatch(/feedback address/);
    expect(notes.find((note) => note.version === '1.1.4')?.sections.flatMap((section) => section.items).join(' ')).toMatch(/visible screen/);
    const forAida = kidHighlights(notes, '1.0.0').join(' ');
    expect(forAida).toMatch(/little note/);
    expect(forAida).toMatch(/dresses and hats/);
    expect(forAida).not.toMatch(/version\.json/);
    expect(gardenNewsPlan(null, '1.2.0')).toBe('record');
    expect(gardenNewsPlan('soon', '1.2.0')).toBe('record');
    expect(gardenNewsPlan('1.2.0', '1.2.0')).toBe('stay');
    expect(gardenNewsPlan('1.1.4', '1.2.0')).toBe('show');
    expect(gardenNewsPlan('9.0.0', '1.2.0')).toBe('stay');
  });

  it('shows a banner on the map and waits while a lesson is open', () => {
    expect(CHECK_INTERVAL_MS).toBe(30 * 60 * 1000);
    expect(planUpdate({ waiting: true, lesson: false, deferred: false, deferredThisSession: false, applying: false })).toBe('banner');
    expect(planUpdate({ waiting: true, lesson: true, deferred: false, deferredThisSession: false, applying: false })).toBe('defer');
    expect(planUpdate({ waiting: true, lesson: false, deferred: true, deferredThisSession: true, applying: false })).toBe('idle');
    expect(planUpdate({ waiting: true, lesson: false, deferred: true, deferredThisSession: false, applying: false })).toBe('apply');
    expect(sw).toContain("cache: 'no-store'");
    expect(sw).toContain('visibilitychange');
    expect(sw).toContain('skip-waiting');
    expect(sw).not.toContain('prague.wizard-math.progress');
  });
});
