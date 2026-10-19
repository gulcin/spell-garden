import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { freshHouse } from '../src/house/layout.ts';
import { GROWING_AT, GROWN_AT, growthCaption, growthSpeech, growNearby, petArtFile, petStage, solvedCount } from '../src/pets/growth.ts';
import { buyPet, normalizePets } from '../src/pets/state.ts';
import { migrateStoredProgress } from '../src/progress/migrations.ts';
import { freshProgress, PROGRESS_SCHEMA } from '../src/progress/types.ts';
import { withWardrobe } from '../src/progress/storage.ts';
import { awardCrystals } from '../src/wardrobe/economy.ts';

describe('pet growth', () => {
  it('starts little, grows after four spells, and is grown after ten', () => {
    expect(petStage(0)).toBe(0);
    expect(petStage(GROWING_AT - 1)).toBe(0);
    expect(petStage(GROWING_AT)).toBe(1);
    expect(petStage(GROWN_AT - 1)).toBe(1);
    expect(petStage(GROWN_AT)).toBe(2);
    expect(solvedCount(undefined)).toBe(0);
    expect(solvedCount(-3)).toBe(0);
    expect(solvedCount(4.8)).toBe(4);

    let progress = buyPet(awardCrystals(freshProgress('Aida'), 30), 'baby-dragon', 1);
    progress = { ...progress, pets: { ...progress.pets, owned: progress.pets.owned.map((pet) => (pet.id === 'baby-dragon' ? { ...pet, name: 'Pip' } : pet)) } };
    const speeches: Array<string | null> = [];
    for (let spell = 0; spell < GROWN_AT; spell += 1) {
      const next = growNearby(progress);
      speeches.push(next.speech);
      progress = next.progress;
    }
    expect(speeches.filter(Boolean)).toEqual(['Pip is growing.', 'Pip grew up.']);
    expect(progress.pets.owned.find((pet) => pet.id === 'baby-dragon')?.solved).toBe(GROWN_AT);
    expect(petStage(GROWN_AT)).toBe(2);
    expect(growthCaption(0, true)).toBe('Little');
    expect(growthCaption(2, true)).toBe('Little · 2 together');
    expect(growthCaption(6, true)).toBe('Growing · 6 together');
    expect(growthCaption(10, true)).toBe('Grown');
    expect(growthCaption(1, false)).toBe('Little. Bring them along.');
    expect(growthSpeech('Pip', 3, 4)).toBe('Pip is growing.');
    expect(growthSpeech('Pip', 9, 10)).toBe('Pip grew up.');
    expect(growthSpeech('Pip', 5, 6)).toBeNull();
  });

  it('does not grow without a walking friend', () => {
    const alone = freshProgress('Aida');
    expect(growNearby(alone)).toEqual({ progress: alone, speech: null });
    const owned = buyPet(awardCrystals(alone, 30), 'cloud-cat', 2);
    const resting = { ...owned, pets: { ...owned.pets, companionId: null } };
    expect(growNearby(resting).progress).toBe(resting);
    expect(normalizePets({ owned: [{ id: 'cloud-cat', name: 'Pip!', how: 'bought', at: 3 }], companionId: 'cloud-cat' }).owned[0]).toMatchObject({
      name: 'Pip',
      solved: 0,
    });
  });

  it('keeps an older garden and starts its pets little', () => {
    const older = {
      ...freshProgress('Aida'),
      schema: 1,
      crystals: 42,
      purse: { pink: 2, yellow: 0, blue: 0, gold: 2 },
      wardrobe: { owned: ['robe-rose', 'hat-night'], equipped: { dress: 'robe-rose', hat: 'hat-night' } },
      visitedPlaces: ['lantern-grove', 'crystal-cave', 'witch-house'],
      house: {
        ...freshHouse(),
        wallpaper: 'blossom',
        owned: [...freshHouse().owned, 'cat-bed'],
        placed: [...freshHouse().placed, { id: 'p-cat-bed', itemId: 'cat-bed', x: 40, y: 80, flip: false, z: 4 }],
      },
      pets: {
        owned: [
          { id: 'baby-dragon', name: 'Pip', at: 3, how: 'bought' },
          { id: 'cloud-cat', name: 'Cloud cat', at: 4, how: 'earned' },
        ],
        companionId: 'baby-dragon',
        home: [{ id: 'cloud-cat', x: 40, y: 80, flip: false }],
        seen: ['cloud-cat'],
      },
      updatedAt: 9,
    };
    delete (older as { schema?: number }).schema;
    const migrated = migrateStoredProgress(older, withWardrobe);
    expect(migrated.schema).toBe(PROGRESS_SCHEMA);
    expect(PROGRESS_SCHEMA).toBe(2);
    expect(migrated.crystals).toBe(42);
    expect(migrated.learnerName).toBe('Aida');
    expect(migrated.wardrobe.equipped.dress).toBe('robe-rose');
    expect(migrated.wardrobe.equipped.hat).toBe('hat-night');
    expect(migrated.wardrobe.owned).toEqual(expect.arrayContaining(['robe-rose', 'hat-night']));
    expect(migrated.house.wallpaper).toBe('blossom');
    expect(migrated.house.owned).toEqual(expect.arrayContaining(['cat-bed', 'moss-rug']));
    expect(migrated.house.placed.some((piece) => piece.itemId === 'cat-bed')).toBe(true);
    expect(migrated.visitedPlaces).toEqual(expect.arrayContaining(['lantern-grove', 'crystal-cave']));
    const dragon = migrated.pets.owned.find((pet) => pet.id === 'baby-dragon');
    const cat = migrated.pets.owned.find((pet) => pet.id === 'cloud-cat');
    expect(dragon).toMatchObject({ name: 'Pip', how: 'bought', solved: 0 });
    expect(cat).toMatchObject({ name: 'Cloud cat', how: 'earned', solved: 0 });
    expect(migrated.pets.companionId).toBe('baby-dragon');
    expect(migrated.pets.home.map((pet) => pet.id)).toEqual(['cloud-cat']);
    expect(migrated.pets.seen).toContain('cloud-cat');
    expect(petArtFile('baby-dragon', 0).file).toBe('baby-dragon');
    expect(petArtFile('baby-dragon', 1).file).toBe('baby-dragon-grow');
    expect(petArtFile('baby-dragon', 2).file).toBe('baby-dragon-grown');
    expect(petArtFile('cloud-cat', 1).painted).toBe(false);
    expect(petArtFile('cloud-cat', 2).file).toBe('cloud-cat-grown');
    expect(petArtFile('unicorn-foal', 2).file).toBe('unicorn-foal-grown');
    for (const file of ['baby-dragon-grow', 'baby-dragon-grown', 'cloud-cat-grown', 'unicorn-foal-grown']) {
      expect(existsSync(new URL(`../public/art/pets/${file}.webp`, import.meta.url))).toBe(true);
      expect(existsSync(new URL(`../public/art/pets/${file}@2x.webp`, import.meta.url))).toBe(true);
    }
  });
});
