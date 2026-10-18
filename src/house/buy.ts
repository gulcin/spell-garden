import type { Progress } from '../progress/types.ts';
import { appendNote } from '../stories/books.ts';
import { HOUSE_PLACE_ID, furnitureById } from './catalog.ts';
import { normalizeHouse } from './layout.ts';

export function buyFurniture(progress: Progress, id: string, at = Date.now()): { progress: Progress; bought: boolean } {
  const item = furnitureById(id);
  const house = normalizeHouse(progress.house);
  if (!item || item.starter || house.owned.includes(id) || progress.crystals < item.price) {
    return { progress: progress.house === house ? progress : { ...progress, house }, bought: false };
  }
  const crystals = progress.crystals - item.price;
  if (crystals < 0) return { progress, bought: false };
  const text = `You brought home the ${item.name.toLowerCase()} for the witch's house.`;
  return {
    bought: true,
    progress: {
      ...progress,
      crystals,
      house: { ...house, owned: [...house.owned, id] },
      books: appendNote(progress.books, {
        placeId: HOUSE_PLACE_ID,
        at,
        page: { id: `buy-${id}`, text },
      }),
    },
  };
}
