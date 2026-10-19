import type { Progress, WardrobeState } from '../progress/types.ts';
import { WEAR_SLOTS, itemById, type WearSlot } from './catalog.ts';
import { breakInto } from './purse.ts';

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
  const gain = Math.floor(amount);
  if (!Number.isFinite(gain) || gain <= 0) return progress;
  const crystals = Math.max(0, progress.crystals) + gain;
  return { ...progress, crystals, purse: breakInto(crystals) };
}

/** Subtracts a price from the total, then folds the pocket back into coins. */
export function spendCrystals(progress: Progress, price: number): Progress | null {
  const cost = Math.floor(price);
  if (!Number.isFinite(cost) || cost < 0 || progress.crystals < cost) return null;
  const crystals = progress.crystals - cost;
  return { ...progress, crystals, purse: breakInto(crystals) };
}

export function buyItem(progress: Progress, id: string): { progress: Progress; bought: boolean } {
  const item = itemById(id);
  const owned = progress.wardrobe?.owned;
  if (!item || !Array.isArray(owned) || owned.includes(id)) return { progress, bought: false };
  const spent = spendCrystals(progress, item.price);
  if (!spent) return { progress, bought: false };
  return {
    bought: true,
    progress: {
      ...spent,
      wardrobe: {
        owned: [...owned, id],
        equipped: { ...(progress.wardrobe.equipped ?? {}), [item.slot]: id },
      },
    },
  };
}

export function equipItem(progress: Progress, id: string): Progress {
  const item = itemById(id);
  const owned = progress.wardrobe?.owned;
  if (!item || !Array.isArray(owned) || !owned.includes(id)) return progress;
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
