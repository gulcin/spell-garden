import { FURNITURE, STARTER_IDS, WALLPAPERS, furnitureById, type HouseSurface } from './catalog.ts';

export type PlacedItem = {
  id: string;
  itemId: string;
  x: number;
  y: number;
  flip: boolean;
  z: number;
};

export type HouseState = {
  owned: string[];
  wallpaper: string;
  placed: PlacedItem[];
};

const FLOOR_Y = { min: 64, max: 90 };
const WALL_Y = { min: 16, max: 46 };

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return (min + max) / 2;
  return Math.min(max, Math.max(min, value));
}

/** Keeps a piece's full width inside the room. */
export function snapPoint(surface: HouseSurface, x: number, y: number, width = 18): { x: number; y: number } {
  const band = surface === 'floor' ? FLOOR_Y : WALL_Y;
  const inset = Math.min(42, Math.max(8, width / 2 + 2));
  return {
    x: Math.round(clamp(x, inset, 100 - inset) * 10) / 10,
    y: Math.round(clamp(y, band.min, band.max) * 10) / 10,
  };
}

export function freshHouse(): HouseState {
  return {
    owned: [...STARTER_IDS],
    wallpaper: 'cream',
    placed: [
      { id: 'p-moss-rug', itemId: 'moss-rug', x: 36, y: 84, flip: false, z: 1 },
      { id: 'p-sprout-pot', itemId: 'sprout-pot', x: 18, y: 76, flip: false, z: 2 },
      { id: 'p-wall-lantern', itemId: 'wall-lantern', x: 22, y: 28, flip: false, z: 3 },
    ],
  };
}

function num(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

export function normalizeHouse(value: unknown): HouseState {
  if (!value || typeof value !== 'object') return freshHouse();
  const raw = value as Partial<HouseState>;
  const known = new Set(FURNITURE.map((item) => item.id));
  const owned = Array.isArray(raw.owned)
    ? raw.owned.filter((id): id is string => typeof id === 'string' && known.has(id))
    : [];
  for (const id of STARTER_IDS) {
    if (!owned.includes(id)) owned.push(id);
  }
  const wallpaper = WALLPAPERS.some((paper) => paper.id === raw.wallpaper) ? String(raw.wallpaper) : 'cream';
  const placed: PlacedItem[] = [];
  const seen = new Set<string>();
  if (Array.isArray(raw.placed)) {
    for (const row of raw.placed) {
      if (!row || typeof row !== 'object') continue;
      const itemId = (row as Partial<PlacedItem>).itemId;
      const item = typeof itemId === 'string' ? furnitureById(itemId) : undefined;
      if (!item || !owned.includes(item.id) || seen.has(item.id)) continue;
      seen.add(item.id);
      const point = snapPoint(item.surface, num((row as Partial<PlacedItem>).x, 50), num((row as Partial<PlacedItem>).y, item.surface === 'floor' ? 80 : 30), item.width);
      const z = num((row as Partial<PlacedItem>).z, placed.length + 1);
      const id = (row as Partial<PlacedItem>).id;
      placed.push({
        id: typeof id === 'string' && id.length > 0 ? id : `p-${item.id}`,
        itemId: item.id,
        x: point.x,
        y: point.y,
        flip: Boolean((row as Partial<PlacedItem>).flip),
        z: Math.max(1, Math.floor(z)),
      });
    }
  }
  return { owned, wallpaper, placed };
}

function maxZ(house: HouseState): number {
  return house.placed.reduce((top, item) => Math.max(top, item.z), 0);
}

export function placeItem(house: HouseState, itemId: string, x: number, y: number): HouseState {
  const item = furnitureById(itemId);
  if (!item || !house.owned.includes(itemId)) return house;
  const point = snapPoint(item.surface, x, y, item.width);
  const existing = house.placed.find((piece) => piece.itemId === itemId);
  if (existing) return moveItem(house, existing.id, point.x, point.y);
  return {
    ...house,
    placed: [...house.placed, { id: `p-${itemId}`, itemId, x: point.x, y: point.y, flip: false, z: maxZ(house) + 1 }],
  };
}

export function moveItem(house: HouseState, placedId: string, x: number, y: number): HouseState {
  const piece = house.placed.find((item) => item.id === placedId);
  const item = piece ? furnitureById(piece.itemId) : undefined;
  if (!piece || !item) return house;
  const point = snapPoint(item.surface, x, y, item.width);
  return {
    ...house,
    placed: house.placed.map((row) => (row.id === placedId ? { ...row, x: point.x, y: point.y } : row)),
  };
}

export function flipItem(house: HouseState, placedId: string): HouseState {
  if (!house.placed.some((item) => item.id === placedId)) return house;
  return {
    ...house,
    placed: house.placed.map((row) => (row.id === placedId ? { ...row, flip: !row.flip } : row)),
  };
}

export function bringToFront(house: HouseState, placedId: string): HouseState {
  if (!house.placed.some((item) => item.id === placedId)) return house;
  const z = maxZ(house) + 1;
  return {
    ...house,
    placed: house.placed.map((row) => (row.id === placedId ? { ...row, z } : row)),
  };
}

export function storeItem(house: HouseState, placedId: string): HouseState {
  if (!house.placed.some((item) => item.id === placedId)) return house;
  return { ...house, placed: house.placed.filter((row) => row.id !== placedId) };
}

export function setWallpaper(house: HouseState, wallpaper: string): HouseState {
  if (!WALLPAPERS.some((paper) => paper.id === wallpaper) || house.wallpaper === wallpaper) return house;
  return { ...house, wallpaper };
}

const FLOOR_SPOTS = [
  { x: 48, y: 82 },
  { x: 28, y: 74 },
  { x: 70, y: 80 },
  { x: 40, y: 70 },
  { x: 62, y: 88 },
];

const WALL_SPOTS = [
  { x: 32, y: 30 },
  { x: 68, y: 26 },
  { x: 48, y: 20 },
  { x: 20, y: 40 },
  { x: 80, y: 38 },
];

/** A friendly first seat when she taps a piece instead of dragging it. */
export function openSpot(house: HouseState, surface: HouseSurface): { x: number; y: number } {
  const used = house.placed.filter((piece) => furnitureById(piece.itemId)?.surface === surface).length;
  const spots = surface === 'floor' ? FLOOR_SPOTS : WALL_SPOTS;
  return spots[used % spots.length]!;
}
