import { describe, expect, it } from 'vitest';
import { freshHouse, placeItem } from '../src/house/layout.ts';
import { PET_GROUPS, PETS, earnLine, shopPets } from '../src/pets/catalog.ts';
import { buyPet, companionTitle, grantEarned, normalizePets, renamePet, restPet, restTrayStart, unseenArrivals } from '../src/pets/state.ts';
import { freshProgress } from '../src/progress/types.ts';
import { withWardrobe } from '../src/progress/storage.ts';
import { buildAdventure } from '../src/stories/adventure.ts';
import { awardCrystals } from '../src/wardrobe/economy.ts';

describe('pet shop', () => {
  it('keeps a large roster in five collection groups', () => {
    expect(PETS.length).toBeGreaterThanOrEqual(24);
    expect(PET_GROUPS.map((group) => group.label)).toEqual(['Cats', 'Dogs', 'Creatures', 'Imaginary', 'Fairies']);
    for (const group of PET_GROUPS) {
      expect(PETS.filter((pet) => pet.group === group.id).length).toBeGreaterThanOrEqual(group.id === 'fairies' ? 6 : 4);
    }
    const buyable = PETS.filter((pet) => pet.price != null);
    const earnedOnly = PETS.filter((pet) => pet.price == null && pet.earn);
    const both = PETS.filter((pet) => pet.price != null && pet.earn);
    expect(buyable.length).toBeGreaterThan(earnedOnly.length);
    expect(buyable.length).toBeGreaterThan(PETS.length / 2);
    expect(earnedOnly.length).toBeGreaterThanOrEqual(6);
    expect(both.length).toBeGreaterThanOrEqual(3);
    expect(shopPets().every((pet) => pet.price != null && pet.price > 0 && pet.price <= 26)).toBe(true);
    const copy = PETS.map((pet) => `${pet.name} ${pet.blurb} ${earnLine(pet)}`).join(' ');
    expect(copy).not.toMatch(/scary|monster|ghost|blood/i);
    expect(copy).toMatch(/bunny/);
    expect(copy).toMatch(/hedgehog/);
    expect(copy).toMatch(/dragon/i);
    expect(copy).toMatch(/unicorn/i);
    expect(copy).toMatch(/griffin/i);
    expect(copy).toMatch(/phoenix/i);
    expect(copy).toMatch(/moth/i);
    expect(copy).toMatch(/whale/i);
    expect(copy).toMatch(/sprite/i);
  });

  it('buys a friend, earns a fairy, and remembers an older save', () => {
    const poor = freshProgress('Aida');
    expect(buyPet(poor, 'cloud-cat')).toBe(poor);
    const paid = buyPet(awardCrystals(poor, 20), 'cloud-cat', 5);
    expect(paid.crystals).toBe(12);
    expect(paid.pets.companionId).toBe('cloud-cat');
    expect(paid.pets.owned[0]).toMatchObject({ id: 'cloud-cat', how: 'bought', name: 'Cloud cat' });
    expect(buyPet(paid, 'cloud-cat')).toBe(paid);

    const named = renamePet(paid.pets, 'cloud-cat', 'Pip');
    expect(companionTitle(named)).toBe('Pip the cloud cat');
    const story = buildAdventure({
      name: 'Aida',
      placeId: 'lantern-grove',
      deeds: ['You counted the lanterns.'],
      crystals: 1,
      wardrobe: paid.wardrobe,
      companion: companionTitle(named),
      at: Date.UTC(2026, 9, 18),
    });
    expect(story.pages[0]).toContain('Pip the cloud cat came along.');

    const visiting = {
      ...freshProgress('Aida'),
      visitedPlaces: ['lily-pond', 'observatory'],
      sessions: [{ id: 's', startedAt: 1, endedAt: 2, chapterTitle: 'One', topicIds: [], correct: 1, incorrect: 0, skips: 0, rewardId: 'moth' }],
    };
    const found = grantEarned(visiting.pets, visiting, 9);
    const ids = found.owned.map((pet) => pet.id).sort();
    expect(ids).toEqual(['biscuit-pug', 'dew-fairy', 'lantern-owl', 'lily-frog', 'pond-fairy', 'star-fairy']);
    expect(unseenArrivals(found).map((pet) => pet.id)).toContain('dew-fairy');

    const loaded = withWardrobe({ ...freshProgress('Aida'), pets: undefined } as never);
    expect(loaded.pets.owned).toEqual([]);
    const kept = withWardrobe({
      ...visiting,
      pets: { owned: [{ id: 'nope' }, { id: 'cloud-cat', name: 'Pip!', how: 'bought', at: 3 }], companionId: 'missing', home: [], seen: [] },
    } as never);
    expect(kept.pets.owned.find((pet) => pet.id === 'cloud-cat')).toMatchObject({ name: 'Pip', how: 'bought' });
    expect(kept.pets.companionId).toBeNull();
    expect(kept.pets.owned.some((pet) => pet.id === 'lily-frog')).toBe(true);
  });

  it('rests a pet on a bed in the witch house', () => {
    const pets = buyPet(awardCrystals(freshProgress(), 10), 'clover-bunny').pets;
    const floor = restPet(pets, freshHouse(), 'clover-bunny');
    expect(floor.home[0]?.y).toBeGreaterThanOrEqual(64);
    const withBed = placeItem({ ...freshHouse(), owned: [...freshHouse().owned, 'cat-bed'] }, 'cat-bed', 40, 80);
    const bed = withBed.placed.find((piece) => piece.itemId === 'cat-bed');
    const resting = restPet(pets, withBed, 'clover-bunny');
    expect(resting.home[0]?.x).toBe(bed?.x);
    expect(normalizePets({ owned: [{ id: 'clover-bunny', name: 'Pip', how: 'bought', at: 1 }], home: [{ id: 'gone', x: 1, y: 1 }] }).home).toEqual([]);
  });

  it('keeps a fourth friend off the first floor spot and clamps the rest tray', () => {
    const ids = ['clover-bunny', 'cloud-cat', 'ginger-tabby', 'slate-cat'];
    let pets = {
      ...freshProgress().pets,
      owned: ids.map((id) => ({ id, name: id, at: 1, how: 'bought' as const })),
    };
    const spots = [];
    for (const id of ids) {
      pets = restPet(pets, freshHouse(), id);
      spots.push(`${pets.home.at(-1)?.x}:${pets.home.at(-1)?.y}`);
    }
    expect(new Set(spots).size).toBe(4);
    expect(spots[0]).not.toBe(spots[3]);
    expect(restTrayStart(4, 1)).toBe(0);
    expect(restTrayStart(4, 3)).toBe(1);
    expect(restTrayStart(0, 5)).toBe(0);
  });
});
