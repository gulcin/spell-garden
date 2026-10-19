import { describe, expect, it } from 'vitest';
import { freshProgress, type Progress } from '../src/progress/types.ts';
import { withWardrobe } from '../src/progress/storage.ts';
import { STORY_FRAMES } from '../src/stories/adventureFrames.ts';
import {
  adventureDate,
  buildAdventure,
  closingLines,
  deedLine,
  outfitPhrase,
  pageSentences,
  visitIntro,
  wordIndexAt,
} from '../src/stories/adventure.ts';
import { ADVENTURE_RATE, pickUsVoice } from '../src/speech.ts';

const CHANGELOG_WORDS = /\b(new|version|update|added|fixed)\b/i;
const PLACES = [
  'lantern-grove',
  'potion-cottage',
  'crystal-cave',
  'observatory',
  'lily-pond',
  'greenhouse',
  'wizard-tower',
  'mushroom-ring',
];

describe("today's adventure", () => {
  it('turns a solved puzzle into a story step that names the numbers', () => {
    expect(deedLine('lantern-grove', { template: 'ten-frame', goal: { kind: 'fill-count', count: 7 } })).toBe(
      'Aida lit 7 lanterns, and each one woke with a soft pop.',
    );
    expect(deedLine('potion-cottage', { template: 'ten-frame', goal: { kind: 'fill-count', count: 4 } })).toBe(
      'Aida poured 4 cups, so the kettle could sing.',
    );
    expect(
      deedLine('lantern-grove', { template: 'ten-frame', goal: { kind: 'mix', counts: { blue: 3, gold: 2 } } }),
    ).toBe('Aida lit 3 blue and 2 gold lanterns, so the path would have every colour it needed.');
    expect(
      deedLine('crystal-cave', {
        template: 'sharing',
        goal: { kind: 'zone-counts', counts: { jar0: 4, jar1: 4, jar2: 4 } },
      }),
    ).toBe('Aida shared 12 crystals between 3 jars, so each jar could shine the same.');
    expect(deedLine('observatory', { template: 'clock', goal: { kind: 'clock', hour: 8, minute: 0 } })).toBe(
      "Aida set the garden clock to 8 o'clock, so the stars would know the hour.",
    );
    expect(deedLine('wizard-tower', { template: 'array', goal: { kind: 'array', rows: 2, cols: 5 } })).toBe(
      'Aida planted 10 books in 2 rows of 5, so the rows would match.',
    );
  });

  it('writes a dated visit from her outfit, crystals, and the creature she met', () => {
    const wardrobe = freshProgress().wardrobe;
    wardrobe.owned = ['robe-rose', 'hat-mushroom'];
    wardrobe.equipped = { dress: 'robe-rose', hat: 'hat-mushroom' };
    expect(outfitPhrase(freshProgress().wardrobe)).toBe('your lily hat and star cloak');
    const story = buildAdventure({
      name: 'Aida',
      placeId: 'lantern-grove',
      deeds: ['Aida lit 7 lanterns to wake the sleeping path.', 'To finish the sharing, Aida shared 12 crystals between 3 jars.'],
      crystals: 4,
      wardrobe,
      creature: 'Nim the moth',
      at: Date.UTC(2026, 9, 18, 15),
    });
    expect(story.title).toBe("Today's adventure");
    expect(story.place).toBe('Lantern Grove');
    expect(story.pages).toHaveLength(4);
    expect(story.pages[0]).toContain('Aida');
    expect(story.pages[0]).toContain('lantern grove');
    expect(story.pages[0]).toContain('lilac star cloak');
    expect(story.pages[0]).toContain('purple hat');
    expect(story.pages.join(' ')).not.toMatch(/rose petal|mushroom cap/i);
    expect(story.pages.join(' ')).toContain('Aida lit 7 lanterns to wake the sleeping path.');
    expect(story.pages.join(' ')).toContain('To finish the sharing, Aida shared 12 crystals between 3 jars.');
    expect(story.pages.join(' ')).toContain("4 crystals settled in Aida's pocket");
    expect(story.pages[3]).toContain('Nim the moth');
    expect(story.pages[3]).toContain('18 October 2026');
    expect(adventureDate(story.at)).toBe('18 October 2026');
    expect(story.pages.join(' ')).not.toMatch(CHANGELOG_WORDS);
  });

  it('writes four storybook tales in every place, with a friend who speaks', () => {
    for (const placeId of PLACES) {
      expect(STORY_FRAMES[placeId]?.length).toBeGreaterThanOrEqual(4);
      const openings = new Set<string>();
      for (let day = 0; day < 4; day += 1) {
        const at = Date.UTC(2026, 9, 18 + day);
        const story = buildAdventure({
          name: 'Aida',
          placeId,
          deeds: [
            deedLine(placeId, { template: 'ten-frame', goal: { kind: 'fill-count', count: 7 } }),
            deedLine(placeId, { template: 'sharing', goal: { kind: 'zone-counts', counts: { jar0: 4, jar1: 4, jar2: 4 } } }),
          ],
          crystals: 4,
          wardrobe: freshProgress().wardrobe,
          creature: 'Nim the moth',
          companion: 'Pip the cloud cat',
          at,
        });
        openings.add(story.pages[0]!);
        expect(story.pages[0]).toContain('lilac star cloak');
        expect(story.pages[0]).toContain('purple hat');
        expect(story.pages[0]).toContain('"');
        expect(story.pages[1]).toContain('"');
        expect(story.pages.join(' ')).toContain('7');
        for (const page of story.pages) {
          const count = pageSentences(page).length;
          expect(count, `${placeId} day ${day}: ${page}`).toBeGreaterThanOrEqual(3);
          expect(count, `${placeId} day ${day}: ${page}`).toBeLessThanOrEqual(5);
          expect(page).not.toMatch(CHANGELOG_WORDS);
        }
      }
      expect(openings.size).toBe(4);
      const again = visitIntro(placeId, freshProgress().wardrobe, null, 'Aida', Date.UTC(2026, 9, 22));
      expect(again).toBe(visitIntro(placeId, freshProgress().wardrobe, null, 'Aida', Date.UTC(2026, 9, 18)));
    }
  });

  it('tells a different story on the next day and never sounds like a change list', () => {
    const wardrobe = freshProgress().wardrobe;
    const deeds = [
      deedLine('lantern-grove', { template: 'ten-frame', goal: { kind: 'fill-count', count: 7 } }),
      deedLine('lantern-grove', { template: 'sharing', goal: { kind: 'zone-counts', counts: { jar0: 6, jar1: 6, jar2: 6, jar3: 6 } } }),
    ];
    for (const placeId of PLACES) {
      const first = visitIntro(placeId, wardrobe, 'Pip the cloud cat', 'Aida', Date.UTC(2026, 9, 18));
      const next = visitIntro(placeId, wardrobe, 'Pip the cloud cat', 'Aida', Date.UTC(2026, 9, 19));
      expect(first).not.toBe(next);
      expect(first).toContain('Aida');
      expect(first).toContain('Pip the cloud cat came along.');
      const samples = [
        first,
        next,
        ...deeds,
        deedLine(placeId, { template: 'clock', goal: { kind: 'clock', hour: 3, minute: 30 } }, 'Aida'),
        ...closingLines({ placeId, crystals: 2, creature: 'Nim the moth', at: Date.UTC(2026, 9, 18), name: 'Aida' }),
      ];
      for (let day = 0; day < 6; day += 1) {
        const story = buildAdventure({
          name: 'Aida',
          placeId,
          deeds,
          crystals: 2,
          wardrobe,
          creature: 'Nim the moth',
          companion: 'Pip the cloud cat',
          at: Date.UTC(2026, 9, 18 + day),
        });
        expect(story.pages).toHaveLength(4);
        expect(story.pages[0]).toContain('Aida');
        samples.push(...story.pages);
      }
      for (const line of samples) expect(line).not.toMatch(CHANGELOG_WORDS);
    }
  });

  it('keeps an older save and drops a broken adventure', () => {
    const saved = freshProgress('Aida');
    const raw = { ...saved, adventures: [{ id: 'nope' }, { nope: true }] } as Progress;
    const loaded = withWardrobe(raw);
    expect(loaded.adventures).toEqual([]);
    expect(loaded.storyOffers).toEqual([]);
  });

  it('speaks adventures in an American voice, a little slowly, and can point at the spoken word', () => {
    expect(ADVENTURE_RATE).toBeLessThan(1);
    expect(ADVENTURE_RATE).toBeGreaterThan(0.7);
    const voice = pickUsVoice([
      { lang: 'en-GB', name: 'Libby' },
      { lang: 'en-US', name: 'David' },
      { lang: 'en-US', name: 'Ava' },
    ]);
    expect(voice?.name).toBe('Ava');
    const line = 'Aida lit 7 lanterns, and each one woke with a soft pop.';
    expect(wordIndexAt(line, 0)).toBe(0);
    expect(wordIndexAt(line, line.indexOf('lit'))).toBe(1);
    expect(wordIndexAt(line, line.indexOf('lanterns'))).toBe(3);
  });
});
