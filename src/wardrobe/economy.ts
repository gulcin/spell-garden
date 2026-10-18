import type { Progress, WardrobeState } from '../progress/types.ts';
import { WEAR_SLOTS, itemById, type WearSlot } from './catalog.ts';

export function emptyWardrobe(): WardrobeState {
  return { owned: [], equipped: {} };
}

export function normalizeCrystals(value: unknown): number {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.floor(n);
}

export function normalizeWardrobe(value: unknown): WardrobeState {
  const raw = value && typeof value === 'object' ? (value as { owned?: unknown; equipped?: unknown }) : {};
  const owned = Array.isArray(raw.owned)
    ? raw.owned.filter((id): id is string => typeof id === 'string' && itemById(id) != null)
    : [];
  const equipped: WardrobeState['equipped'] = {};
  if (raw.equipped && typeof raw.equipped === 'object') {
    for (const slot of WEAR_SLOTS) {
      const id = (raw.equipped as Record<string, unknown>)[slot];
      if (typeof id === 'string' && owned.includes(id) && itemById(id)?.slot === slot) equipped[slot] = id;
    }
  }
  return { owned, equipped };
}

export function awardCrystals(progress: Progress, amount: number): Progress {
  const gain = Math.max(0, Math.floor(amount));
  if (gain === 0) return progress;
  return { ...progress, crystals: Math.max(0, progress.crystals) + gain };
}

export function buyItem(progress: Progress, id: string): { progress: Progress; bought: boolean } {
  const item = itemById(id);
  if (!item || progress.wardrobe.owned.includes(id) || progress.crystals < item.price) {
    return { progress, bought: false };
  }
  const crystals = progress.crystals - item.price;
  if (crystals < 0) return { progress, bought: false };
  return {
    bought: true,
    progress: {
      ...progress,
      crystals,
      wardrobe: {
        owned: [...progress.wardrobe.owned, id],
        equipped: { ...progress.wardrobe.equipped, [item.slot]: id },
      },
    },
  };
}

export function equipItem(progress: Progress, id: string): Progress {
  const item = itemById(id);
  if (!item || !progress.wardrobe.owned.includes(id)) return progress;
  return {
    ...progress,
    wardrobe: { ...progress.wardrobe, equipped: { ...progress.wardrobe.equipped, [item.slot]: id } },
  };
}

export function unequipSlot(progress: Progress, slot: WearSlot): Progress {
  if (!progress.wardrobe.equipped[slot]) return progress;
  const equipped = { ...progress.wardrobe.equipped };
  delete equipped[slot];
  return { ...progress, wardrobe: { ...progress.wardrobe, equipped } };
}
