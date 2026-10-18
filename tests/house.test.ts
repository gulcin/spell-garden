import { describe, expect, it } from 'vitest';
import { buyFurniture } from '../src/house/buy.ts';
import { FURNITURE, shopFurniture } from '../src/house/catalog.ts';
import { bringToFront, flipItem, freshHouse, moveItem, normalizeHouse, placeItem, snapPoint, storeItem } from '../src/house/layout.ts';
import { freshProgress } from '../src/progress/types.ts';
import { withWardrobe } from '../src/progress/storage.ts';
import { bookByPlace, readBook } from '../src/stories/books.ts';

describe('witch house', () => {
  it('sells at least twenty pieces and keeps a few starters in the room', () => {
    expect(shopFurniture().length).toBeGreaterThanOrEqual(20);
    const names = FURNITURE.map((item) => item.name.toLowerCase());
    for (const kind of ['bed', 'rug', 'shelf', 'cauldron', 'potion', 'armchair', 'lamp', 'lantern', 'fern', 'lily', 'curtain', 'azulejo', 'cat', 'broom']) {
      expect(names.some((name) => name.includes(kind))).toBe(true);
    }
    const house = freshHouse();
    expect(house.owned).toEqual(['moss-rug', 'sprout-pot', 'wall-lantern']);
    expect(house.placed.map((piece) => piece.itemId)).toEqual(['moss-rug', 'sprout-pot', 'wall-lantern']);
    expect(house.wallpaper).toBe('cream');
  });

  it('snaps floor pieces to the floor and wall pieces to the wall', () => {
    expect(snapPoint('floor', 2, 10)).toEqual({ x: 11, y: 64 });
    expect(snapPoint('floor', 140, 200)).toEqual({ x: 89, y: 90 });
    expect(snapPoint('wall', 50, 80)).toEqual({ x: 50, y: 46 });
    const placed = placeItem(freshHouse(), 'rose-armchair', 4, 20);
    const chair = placed.placed.find((piece) => piece.itemId === 'rose-armchair');
    expect(chair).toBeUndefined();
    const owned = { ...freshHouse(), owned: [...freshHouse().owned, 'rose-armchair', 'book-shelf'] };
    const withChair = placeItem(owned, 'rose-armchair', 4, 20);
    expect(withChair.placed.find((piece) => piece.itemId === 'rose-armchair')).toMatchObject({ x: 16, y: 64, flip: false });
    const withShelf = placeItem(withChair, 'book-shelf', 50, 90);
    expect(withShelf.placed.find((piece) => piece.itemId === 'book-shelf')?.y).toBe(46);
  });

  it('moves, flips, brings forward, and stores a piece', () => {
    let house = { ...freshHouse(), owned: [...freshHouse().owned, 'cat-bed'] };
    house = placeItem(house, 'cat-bed', 40, 80);
    const id = house.placed.find((piece) => piece.itemId === 'cat-bed')!.id;
    house = moveItem(house, id, 70, 70);
    expect(house.placed.find((piece) => piece.id === id)).toMatchObject({ x: 70, y: 70 });
    house = flipItem(house, id);
    expect(house.placed.find((piece) => piece.id === id)?.flip).toBe(true);
    const before = house.placed.find((piece) => piece.id === id)!.z;
    house = bringToFront(house, id);
    expect(house.placed.find((piece) => piece.id === id)!.z).toBeGreaterThan(before);
    house = storeItem(house, id);
    expect(house.placed.some((piece) => piece.itemId === 'cat-bed')).toBe(false);
    expect(house.owned).toContain('cat-bed');
  });

  it('spends crystals, keeps the layout, and writes the furniture into her book', () => {
    const saved = { ...freshProgress('Aida'), crystals: 20 };
    const bought = buyFurniture(saved, 'rose-armchair', Date.UTC(2026, 9, 18));
    expect(bought.bought).toBe(true);
    expect(bought.progress.crystals).toBe(8);
    expect(bought.progress.house.owned).toContain('rose-armchair');
    const again = buyFurniture(bought.progress, 'rose-armchair', Date.UTC(2026, 9, 18));
    expect(again.bought).toBe(false);
    expect(again.progress.crystals).toBe(8);
    const leaves = readBook('witch-house', bookByPlace(bought.progress.books, 'witch-house'));
    expect(leaves.map((leaf) => leaf.text).join(' ')).toContain('rose armchair');
    const loaded = withWardrobe({ ...bought.progress, house: { ...bought.progress.house, wallpaper: 'night', owned: ['nope', 'rose-armchair'] } });
    expect(loaded.house.wallpaper).toBe('night');
    expect(loaded.house.owned).toContain('moss-rug');
    expect(loaded.house.owned).toContain('rose-armchair');
    expect(loaded.house.owned).not.toContain('nope');
    expect(loaded.visitedPlaces).not.toContain('nope');
  });

  it('keeps an older save by filling an empty room with the starters', () => {
    const loaded = withWardrobe(freshProgress('Aida'));
    expect(normalizeHouse(undefined).placed).toHaveLength(3);
    expect(loaded.house.placed.map((piece) => piece.itemId)).toEqual(['moss-rug', 'sprout-pot', 'wall-lantern']);
  });
});