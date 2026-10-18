/** Crystal shop. A few cave spells buy the first thing in each shelf. */

export type ShopCategory = 'dress' | 'hat' | 'extra' | 'broom';

export type WearSlot = 'dress' | 'hat' | 'familiar' | 'bag' | 'wand' | 'necklace' | 'crown' | 'broom';

export type ShopItem = {
  id: string;
  name: string;
  category: ShopCategory;
  slot: WearSlot;
  price: number;
  line: string;
};

export const SHOP_CATEGORIES: { id: ShopCategory; label: string }[] = [
  { id: 'dress', label: 'Robes' },
  { id: 'hat', label: 'Hats' },
  { id: 'extra', label: 'Extras' },
  { id: 'broom', label: 'Brooms' },
];

export const SHOP_ITEMS: ShopItem[] = [
  { id: 'robe-moon', name: 'Moonlace robe', category: 'dress', slot: 'dress', price: 6, line: 'Pale blue, stitched with little moons.' },
  { id: 'robe-rose', name: 'Rose petal robe', category: 'dress', slot: 'dress', price: 12, line: 'Soft pink, warm as tea.' },
  { id: 'robe-moss', name: 'Moss cloak', category: 'dress', slot: 'dress', price: 18, line: 'Green as the greenhouse path.' },
  { id: 'robe-midnight', name: 'Midnight robe', category: 'dress', slot: 'dress', price: 26, line: 'Deep navy, edged in gold.' },
  { id: 'hat-night', name: 'Star nightcap', category: 'hat', slot: 'hat', price: 6, line: 'A soft cap for quiet spells.' },
  { id: 'hat-mushroom', name: 'Mushroom cap', category: 'hat', slot: 'hat', price: 12, line: 'A red cap with cream spots.' },
  { id: 'hat-crescent', name: 'Crescent hat', category: 'hat', slot: 'hat', price: 18, line: 'The brim curls like a moon.' },
  { id: 'hat-tall', name: 'Tall star hat', category: 'hat', slot: 'hat', price: 24, line: 'Taller, with a gold band.' },
  { id: 'extra-crown', name: 'Flower crown', category: 'extra', slot: 'crown', price: 6, line: 'Lilies and tiny blossoms.' },
  { id: 'extra-necklace', name: 'Crystal necklace', category: 'extra', slot: 'necklace', price: 10, line: 'One bright crystal on a ribbon.' },
  { id: 'extra-bag', name: 'Moon bag', category: 'extra', slot: 'bag', price: 14, line: 'A round bag with a moon clasp.' },
  { id: 'extra-wand', name: 'Comet wand', category: 'extra', slot: 'wand', price: 18, line: 'A wand with a trailing spark.' },
  { id: 'extra-kitten', name: 'Cloud kitten', category: 'extra', slot: 'familiar', price: 22, line: 'A small kitten who likes pockets.' },
  { id: 'broom-twig', name: 'Twig broom', category: 'broom', slot: 'broom', price: 6, line: 'A kind little broom of garden twigs.' },
  { id: 'broom-blossom', name: 'Blossom broom', category: 'broom', slot: 'broom', price: 12, line: 'Tied with a pink flower.' },
  { id: 'broom-star', name: 'Star broom', category: 'broom', slot: 'broom', price: 18, line: 'The bristles shine.' },
  { id: 'broom-night', name: 'Night broom', category: 'broom', slot: 'broom', price: 26, line: 'Dark wood and a silver moon.' },
];

const BY_ID = new Map(SHOP_ITEMS.map((item) => [item.id, item]));

export function itemById(id: string): ShopItem | undefined {
  return BY_ID.get(id);
}

export const WEAR_SLOTS: WearSlot[] = ['dress', 'hat', 'familiar', 'bag', 'wand', 'necklace', 'crown', 'broom'];

/** Crystal Cave pays more. Every other place still leaves a crystal. */
export function crystalGain(placeId: string): number {
  return placeId === 'crystal-cave' ? 3 : 1;
}

export function crystalLine(placeId: string): string {
  return placeId === 'crystal-cave' ? 'Three crystals settle in your pocket.' : 'A crystal settles in your pocket.';
}

/** Where each painted piece sits on the apprentice cutout. Tuned against her pose. */
export const WEAR_BOX: Record<WearSlot, { left: string; top: string; width: string; z: number }> = {
  dress: { left: '4%', top: '31%', width: '74%', z: 2 },
  hat: { left: '4%', top: '-30%', width: '60%', z: 5 },
  crown: { left: '16%', top: '-12%', width: '64%', z: 6 },
  necklace: { left: '38%', top: '38%', width: '20%', z: 4 },
  bag: { left: '44%', top: '44%', width: '26%', z: 4 },
  wand: { left: '64%', top: '2%', width: '34%', z: 5 },
  familiar: { left: '-2%', top: '72%', width: '28%', z: 7 },
  broom: { left: '68%', top: '32%', width: '28%', z: 3 },
};

/** A few pieces need their own seat. The floppy nightcap and the wide mushroom do. */
export const WEAR_NUDGE: Partial<Record<string, { left: string; top: string; width: string }>> = {
  'hat-night': { left: '16%', top: '-18%', width: '58%' },
  'hat-mushroom': { left: '10%', top: '-32%', width: '56%' },
};

export function wearStyle(id: string, slot: WearSlot): { left: string; top: string; width: string; z: number } {
  return { ...WEAR_BOX[slot], ...WEAR_NUDGE[id] };
}
