import { describe, expect, it } from 'vitest';
import { freshProgress, type Progress } from '../src/progress/types.ts';
import { withWardrobe } from '../src/progress/storage.ts';
import {
  adventureDate,
  buildAdventure,
  deedLine,
  outfitPhrase,
  wordIndexAt,
} from '../src/stories/adventure.ts';
import { ADVENTURE_RATE, pickUsVoice } from '../src/speech.ts';

describe("today's adventure", () => {
  it('turns a solved puzzle into a line about what she did', () => {
    expect(deedLine('lantern-grove', { template: 'ten-frame', goal: { kind: 'fill-count', count: 7 } })).toBe(
      'You lit 7 lanterns.',
    );
    expect(deedLine('potion-cottage', { template: 'ten-frame', goal: { kind: 'fill-count', count: 4 } })).toBe(
      'You poured 4 cups.',
    );
    expect(
      deedLine('lantern-grove', { template: 'ten-frame', goal: { kind: 'mix', counts: { blue: 3, gold: 2 } } }),
    ).toBe('You lit 3 blue and 2 gold lanterns.');
    expect(
      deedLine('crystal-cave', {
        template: 'sharing',
        goal: { kind: 'zone-counts', counts: { jar0: 4, jar1: 4, jar2: 4 } },
      }),
    ).toBe('You shared 12 crystals between 3 jars.');
    expect(deedLine('observatory', { template: 'clock', goal: { kind: 'clock', hour: 8, minute: 0 } })).toBe(
      "You set the garden clock to 8 o'clock.",
    );
    expect(deedLine('wizard-tower', { template: 'array', goal: { kind: 'array', rows: 2, cols: 5 } })).toBe(
      'You planted 10 books in 2 rows of 5.',
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
      deeds: ['You lit 7 lanterns.', 'You shared 12 crystals between 3 jars.'],
      crystals: 4,
      wardrobe,
      creature: 'Nim the moth',
      at: Date.UTC(2026, 9, 18, 15),
    });
    expect(story.title).toBe("Today's adventure");
    expect(story.place).toBe('Lantern Grove');
    expect(story.pages).toHaveLength(4);
    expect(story.pages[0]).toContain('lantern grove');
    expect(story.pages[0]).toContain('rose petal robe');
    expect(story.pages[0]).toContain('mushroom cap');
    expect(story.pages.join(' ')).toContain('You lit 7 lanterns.');
    expect(story.pages.join(' ')).toContain('You shared 12 crystals between 3 jars.');
    expect(story.pages.join(' ')).toContain('You earned 4 crystals');
    expect(story.pages[3]).toContain('Nim the moth');
    expect(story.pages[3]).toContain('18 October 2026');
    expect(adventureDate(story.at)).toBe('18 October 2026');
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
    const line = 'You lit 7 lanterns.';
    expect(wordIndexAt(line, 0)).toBe(0);
    expect(wordIndexAt(line, line.indexOf('lit'))).toBe(1);
    expect(wordIndexAt(line, line.indexOf('lanterns'))).toBe(3);
  });
});
