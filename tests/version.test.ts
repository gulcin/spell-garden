import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { serviceWorkerSource, SPELL_GARDEN_CACHE } from '../vite.config.ts';
import { STABLE_STORES, migrateStoredProgress, progressMigrations } from '../src/progress/migrations.ts';
import { freshProgress, PROGRESS_KEY, PROGRESS_SCHEMA } from '../src/progress/types.ts';
import { withWardrobe } from '../src/progress/storage.ts';
import { CHECK_INTERVAL_MS, planUpdate } from '../src/updates.ts';
import { ScreenBoundary } from '../src/ui/Rescue.tsx';
import { gardenNewsPlan, kidHighlights, parseChangelog, serviceWorkerCacheId, versionLabel } from '../src/version.ts';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')) as { version: string };
const changelog = readFileSync(new URL('../CHANGELOG.md', import.meta.url), 'utf8');
const css = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8');
const sw = readFileSync(new URL('../src/swUpdates.ts', import.meta.url), 'utf8');

describe('Spell Garden version', () => {
  it('stamps semver 1.4.1 and keeps the service worker waiting for a tap', () => {
    expect(pkg.version).toBe('1.4.1');
    expect(serviceWorkerCacheId(pkg.version)).toBe('spell-garden-v1.4.1');
    expect(SPELL_GARDEN_CACHE).toBe('spell-garden-v1.4.1');
    expect(versionLabel({ version: '1.4.1', sha: 'abc1234', date: '2026-10-19' })).toBe('Version 1.4.1 (abc1234)');
    expect(css).toContain('-webkit-text-size-adjust: 100%');
    expect(css).toContain('text-size-adjust: 100%');
    expect(css).not.toContain('font-size: clamp');
  });

  it('reads the changelog', () => {
    const notes = parseChangelog(changelog);
    expect(notes[0]?.version).toBe('1.4.1');
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
    expect(written).toMatch(/A new spell is ready/);
    const current = notes[0]?.sections.flatMap((section) => section.items).join(' ') ?? '';
    expect(current).toMatch(/crystal shop/);
    expect(current).toMatch(/garden map/);
    const pets = notes.find((note) => note.version === '1.4.0')?.sections.flatMap((section) => section.items).join(' ') ?? '';
    expect(pets).toMatch(/Collection book/);
    expect(pets).toMatch(/quiet music/);
    expect(notes.find((note) => note.version === '1.1.4')?.sections.flatMap((section) => section.items).join(' ')).toMatch(/visible screen/);
    const forAida = kidHighlights(notes, '1.0.0').join(' ');
    expect(forAida).toMatch(/little note/);
    expect(forAida).toMatch(/dresses and hats/);
    expect(forAida).toMatch(/Poppy/);
    expect(forAida).not.toMatch(/version\.json/);
    expect(gardenNewsPlan(null, '1.2.0')).toBe('record');
    expect(gardenNewsPlan('soon', '1.2.0')).toBe('record');
    expect(gardenNewsPlan('1.2.0', '1.2.0')).toBe('stay');
    expect(gardenNewsPlan('1.1.4', '1.2.0')).toBe('show');
    expect(gardenNewsPlan('9.0.0', '1.2.0')).toBe('stay');
    expect(ScreenBoundary.getDerivedStateFromError()).toEqual({ error: true });
    const rescue = readFileSync(new URL('../src/ui/Rescue.tsx', import.meta.url), 'utf8');
    const oops = rescue.slice(rescue.indexOf('class ScreenBoundary'), rescue.indexOf('class GardenBoundary'));
    expect(oops).toContain('Back to the garden');
    expect(oops).toContain('data-testid="oops-map"');
    expect(oops).not.toContain('startAgain');
  });

  it('shows a banner on the map and waits while a lesson is open', () => {
    expect(CHECK_INTERVAL_MS).toBe(30 * 60 * 1000);
    expect(planUpdate({ waiting: true, lesson: false, deferred: false, deferredThisSession: false, applying: false })).toBe('banner');
    expect(planUpdate({ waiting: true, lesson: true, deferred: false, deferredThisSession: false, applying: false })).toBe('defer');
    expect(planUpdate({ waiting: true, lesson: true, deferred: true, deferredThisSession: false, applying: false })).toBe('defer');
    expect(planUpdate({ waiting: true, lesson: false, deferred: true, deferredThisSession: true, applying: false })).toBe('banner');
    expect(planUpdate({ waiting: true, lesson: false, deferred: true, deferredThisSession: false, applying: false })).toBe('apply');
    expect(sw).toContain("cache: 'no-store'");
    expect(sw).toContain('version.json?t=');
    expect(sw).toContain("updateViaCache: 'none'");
    expect(sw).toContain('visibilitychange');
    expect(sw).toContain('SKIP_WAITING');
    expect(sw).toContain('controllerchange');
    expect(sw).toContain('spell-garden.swReloads');
    expect(sw).toContain('reg.installing');
    expect(sw).not.toContain('prague.wizard-math.progress');
    const worker = serviceWorkerSource('spell-garden-v1.3.2', ['./index.html'], './index.html');
    expect(worker).toContain('SKIP_WAITING');
    expect(worker).toContain('SPELL_PING');
    expect(worker).toContain("cache:'reload'");
    expect(worker).toContain("searchParams.set('spell', CACHE)");
    expect(worker.indexOf('fresh(HOME)')).toBeLessThan(worker.indexOf('cached(HOME)'));
    expect(worker).not.toContain('localStorage');
  });

  it('keeps progress keys stable and stamps a schema on an older save', () => {
    expect(STABLE_STORES.progress).toBe(PROGRESS_KEY);
    expect(STABLE_STORES.progress).toBe('prague.wizard-math.progress.v1');
    expect(STABLE_STORES.reports).toBe('prague.wizard-math.reports.v1');
    expect(STABLE_STORES.reportsDb).toBe('spell-garden-reports');
    expect(STABLE_STORES.colouringDb).toBe('spell-garden-colouring');
    expect(progressMigrations(withWardrobe).map((step) => step.to)).toEqual([1]);
    const older = freshProgress('Aida');
    delete older.schema;
    delete older.purse;
    older.crystals = 17;
    const migrated = migrateStoredProgress(older, withWardrobe);
    expect(migrated.schema).toBe(PROGRESS_SCHEMA);
    expect(migrated.crystals).toBe(17);
    expect(migrated.learnerName).toBe('Aida');
    expect(PROGRESS_KEY).toBe('prague.wizard-math.progress.v1');
  });
});
