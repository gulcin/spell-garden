/** Furniture for the witch's house. Starters are already home. The rest are sold for crystals. */

export type HouseSurface = 'floor' | 'wall';

export type Furniture = {
  id: string;
  name: string;
  price: number;
  line: string;
  surface: HouseSurface;
  /** Width as a percent of the room. */
  width: number;
  starter?: boolean;
};

export type Wallpaper = {
  id: string;
  name: string;
  file: string;
};

export const HOUSE_PLACE_ID = 'witch-house';
export const HOUSE_PLACE_NAME = "Witch's house";

export const WALLPAPERS: Wallpaper[] = [
  { id: 'cream', name: 'Cream and honey', file: 'cottage-cream' },
  { id: 'blossom', name: 'Rose paper', file: 'cottage-blossom' },
  { id: 'night', name: 'Stars and tiles', file: 'cottage-night' },
];

export const FURNITURE: Furniture[] = [
  { id: 'quilt-bed', name: 'Quilt bed', price: 14, line: 'A rose pillow and a lilac quilt.', surface: 'floor', width: 42 },
  { id: 'moss-rug', name: 'Moss rug', price: 0, line: 'A round green rug with a gold star.', surface: 'floor', width: 36, starter: true },
  { id: 'rose-armchair', name: 'Rose armchair', price: 12, line: 'A plump pink chair for quiet reading.', surface: 'floor', width: 28 },
  { id: 'iron-cauldron', name: 'Iron cauldron', price: 10, line: 'A dark pot with a purple glow.', surface: 'floor', width: 22 },
  { id: 'cat-bed', name: 'Cat bed', price: 8, line: 'A soft round bed with a little star.', surface: 'floor', width: 24 },
  { id: 'broom-stand', name: 'Broom stand', price: 8, line: 'A wooden stand and a pink ribbon.', surface: 'floor', width: 16 },
  { id: 'fern-pot', name: 'Fern pot', price: 6, line: 'A fern in a warm clay pot.', surface: 'floor', width: 20 },
  { id: 'lily-bowl', name: 'Water lily', price: 8, line: 'A white lily floating in a bowl.', surface: 'floor', width: 22 },
  { id: 'reading-lamp', name: 'Reading lamp', price: 10, line: 'A gold lamp with a star on top.', surface: 'floor', width: 16 },
  { id: 'tea-table', name: 'Tea table', price: 10, line: 'A low table, a pot, and two cups.', surface: 'floor', width: 28 },
  { id: 'floor-cushion', name: 'Star cushion', price: 4, line: 'A lilac cushion with a gold star.', surface: 'floor', width: 18 },
  { id: 'crystal-basket', name: 'Crystal basket', price: 6, line: 'A basket of pale shining crystals.', surface: 'floor', width: 20 },
  { id: 'hearth-stool', name: 'Hearth stool', price: 8, line: 'A wooden stool with a moss seat.', surface: 'floor', width: 16 },
  { id: 'sprout-pot', name: 'Sprout pot', price: 0, line: 'A tiny sprout in a cream pot.', surface: 'floor', width: 14, starter: true },
  { id: 'book-shelf', name: 'Book shelf', price: 12, line: 'Pastel books, a bottle, and a candle.', surface: 'wall', width: 26 },
  { id: 'potion-shelf', name: 'Potion shelf', price: 12, line: 'Colourful bottles in a row.', surface: 'wall', width: 34 },
  { id: 'wall-lantern', name: 'Wall lantern', price: 0, line: 'A warm lantern on a short chain.', surface: 'wall', width: 14, starter: true },
  { id: 'garden-curtain', name: 'Window curtains', price: 8, line: 'Lilac curtains tied with pink bows.', surface: 'wall', width: 30 },
  { id: 'lily-picture', name: 'Lily picture', price: 8, line: 'A water lily in a gold frame.', surface: 'wall', width: 24 },
  { id: 'azulejo-panel', name: 'Azulejo tile', price: 14, line: 'A blue tile painted with flowers.', surface: 'wall', width: 20 },
  { id: 'star-mobile', name: 'Star mobile', price: 6, line: 'Five gold stars on a wooden ring.', surface: 'wall', width: 18 },
  { id: 'round-mirror', name: 'Round mirror', price: 10, line: 'A gold mirror with a lily on top.', surface: 'wall', width: 20 },
  { id: 'moon-clock', name: 'Moon clock', price: 10, line: 'A moon face in a wooden ring.', surface: 'wall', width: 16 },
  { id: 'herb-bundle', name: 'Herb bundle', price: 4, line: 'Lavender and mint, tied with a ribbon.', surface: 'wall', width: 14 },
  { id: 'welcome-wreath', name: 'Welcome wreath', price: 6, line: 'Roses and a gold star.', surface: 'wall', width: 20 },
];

const BY_ID = new Map(FURNITURE.map((item) => [item.id, item]));

export function furnitureById(id: string): Furniture | undefined {
  return BY_ID.get(id);
}

export function wallpaperById(id: string): Wallpaper {
  return WALLPAPERS.find((paper) => paper.id === id) ?? WALLPAPERS[0]!;
}

/** Pieces Clover sells. Starters are already in the house. */
export function shopFurniture(): Furniture[] {
  return FURNITURE.filter((item) => !item.starter);
}

export const STARTER_IDS = FURNITURE.filter((item) => item.starter).map((item) => item.id);
