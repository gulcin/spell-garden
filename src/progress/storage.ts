import { normalizeHouse } from '../house/layout.ts';
import { isAdventure } from '../stories/adventure.ts';
import { normalizeBooks } from '../stories/books.ts';
import { normalizeCrystals, normalizeWardrobe } from '../wardrobe/economy.ts';
import {
  emptyTopicState,
  freshProgress,
  learnerNameFrom,
  PROGRESS_FORMAT,
  PROGRESS_KEY,
  type Progress,
  type SessionRecord,
  type TopicState,
} from './types.ts';

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

const KNOWN_PLACES = new Set([...PLACE_TRAIL, 'crystal-shop', 'colouring-nook', 'witch-house']);

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

function whole(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.floor(value)) : fallback;
}

/** Older saves have no skip log. A hop is never invented, and ease stays inside 0–2. */
export function normalizeTopic(value: unknown): TopicState | null {
  if (!value || typeof value !== 'object') return null;
  const topic = value as Partial<TopicState>;
  const via = topic.via === 'practice' || topic.via === 'placement' || topic.via === 'parent' ? topic.via : null;
  return {
    ...emptyTopicState(),
    ...topic,
    correct: whole(topic.correct),
    incorrect: whole(topic.incorrect),
    streak: whole(topic.streak),
    attempts: Array.isArray(topic.attempts) ? topic.attempts.slice(-24) : [],
    masteredAt: typeof topic.masteredAt === 'number' ? topic.masteredAt : null,
    via,
    lastAt: typeof topic.lastAt === 'number' ? topic.lastAt : null,
    nextReviewAt: typeof topic.nextReviewAt === 'number' ? topic.nextReviewAt : null,
    reviewStage: whole(topic.reviewStage),
    reviewFails: whole(topic.reviewFails),
    skips: whole(topic.skips),
    ease: Math.min(2, whole(topic.ease)),
  };
}

function normalizeSession(session: SessionRecord): SessionRecord {
  return { ...session, skips: whole(session.skips) };
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
    sessions: (parsed.sessions ?? []).map(normalizeSession),
    topics: Object.fromEntries(
      Object.entries(parsed.topics ?? {}).flatMap(([id, value]) => {
        const topic = normalizeTopic(value);
        return topic ? [[id, topic] as const] : [];
      }),
    ),
    crystals: normalizeCrystals(parsed.crystals),
    wardrobe: normalizeWardrobe(parsed.wardrobe),
    visitedPlaces: normalizeVisited(parsed.visitedPlaces, parsed.sessions?.length ?? 0),
    storyOffers: stringList(parsed.storyOffers),
    storiesHeard: stringList(parsed.storiesHeard),
    storyFavourites: stringList(parsed.storyFavourites),
    adventures: Array.isArray(parsed.adventures) ? parsed.adventures.filter(isAdventure).slice(0, 24) : [],
    house: normalizeHouse(parsed.house),
    books: normalizeBooks(
      parsed.books,
      (Array.isArray(parsed.adventures) ? parsed.adventures.filter(isAdventure) : []).map((adventure) => ({
        id: adventure.id,
        placeId: adventure.placeId,
        at: adventure.at,
        pages: adventure.pages,
      })),
    ),
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
