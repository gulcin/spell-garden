import { isAdventure } from '../stories/adventure.ts';
import { normalizeCrystals, normalizeWardrobe } from '../wardrobe/economy.ts';
import { freshProgress, learnerNameFrom, PROGRESS_FORMAT, PROGRESS_KEY, type Progress } from './types.ts';

const PLACE_TRAIL = [
  'lantern-grove',
  'potion-cottage',
  'crystal-cave',
  'observatory',
  'lily-pond',
  'greenhouse',
  'wizard-tower',
  'mushroom-ring',
];

const KNOWN_PLACES = new Set([...PLACE_TRAIL, 'crystal-shop', 'colouring-nook']);

/** Older saves visited places in map order. A missing list keeps those stars. */
export function normalizeVisited(value: unknown, sessions: number): string[] {
  if (Array.isArray(value)) {
    return value.filter((id): id is string => typeof id === 'string' && KNOWN_PLACES.has(id));
  }
  const count = Number.isFinite(sessions) ? Math.max(0, Math.floor(sessions)) : 0;
  if (count >= PLACE_TRAIL.length) return [...PLACE_TRAIL];
  return PLACE_TRAIL.slice(0, count);
}

function stringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string' && item.length > 0);
}

/** Fills crystals, the wardrobe, and story lists without dropping an older save. */
export function withWardrobe(parsed: Progress): Progress {
  const learnerName = learnerNameFrom(parsed.learnerName);
  return {
    ...freshProgress(learnerName),
    ...parsed,
    learnerName,
    seenTemplates: parsed.seenTemplates ?? [],
    rewards: parsed.rewards ?? [],
    sessions: parsed.sessions ?? [],
    topics: parsed.topics ?? {},
    crystals: normalizeCrystals(parsed.crystals),
    wardrobe: normalizeWardrobe(parsed.wardrobe),
    visitedPlaces: normalizeVisited(parsed.visitedPlaces, parsed.sessions?.length ?? 0),
    storyOffers: stringList(parsed.storyOffers),
    storiesHeard: stringList(parsed.storiesHeard),
    storyFavourites: stringList(parsed.storyFavourites),
    adventures: Array.isArray(parsed.adventures) ? parsed.adventures.filter(isAdventure).slice(0, 24) : [],
  };
}

function isProgress(value: unknown): value is Progress {
  if (!value || typeof value !== 'object') return false;
  const v = value as Partial<Progress>;
  return v.format === PROGRESS_FORMAT && v.taxonomy === 'marble-skill-taxonomy-v1' && !!v.placement && !!v.topics;
}

export function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (!raw) return freshProgress();
    const parsed: unknown = JSON.parse(raw);
    if (!isProgress(parsed)) return freshProgress();
    return withWardrobe(parsed);
  } catch {
    return freshProgress();
  }
}

export function saveProgress(progress: Progress): void {
  const next = { ...progress, updatedAt: Date.now() };
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(next));
}

export function parseProgress(raw: string): Progress {
  const parsed: unknown = JSON.parse(raw);
  if (!isProgress(parsed)) {
    throw new Error('That file is not a Spell Garden progress export.');
  }
  return withWardrobe(parsed);
}

export { PROGRESS_KEY };
