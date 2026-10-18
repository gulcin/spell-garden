import { freshHouse, type HouseState } from '../house/layout.ts';
import type { Adventure } from '../stories/adventure.ts';
import { emptyBooks, type PlaceBook } from '../stories/books.ts';
import type { QuestRecord, TalkMemory } from '../cast/talk.ts';
import { emptyPurse, type Purse } from '../wardrobe/purse.ts';

export const PROGRESS_KEY = 'prague.wizard-math.progress.v1';
export const PROGRESS_FORMAT = 'prague.wizard-math.progress.v1' as const;

/** The child this garden is for. Saved progress named Prague is migrated here. */
export const DEFAULT_LEARNER_NAME = 'Aida';

export function learnerNameFrom(saved: string | null | undefined): string {
  const name = (saved ?? '').trim();
  if (!name || name.toLowerCase() === 'prague') return DEFAULT_LEARNER_NAME;
  return name.slice(0, 24);
}

/** IB PYP Grade 3, about age 8. New gardens begin here. */
export const DEFAULT_FRONTIER_AGE = 8;

export type Attempt = {
  correct: boolean;
  at: number;
  sessionId: string;
  template: string;
};

export type TopicState = {
  correct: number;
  incorrect: number;
  streak: number;
  attempts: Attempt[];
  masteredAt: number | null;
  /** How this topic became mastered, when it is. */
  via: 'practice' | 'placement' | 'parent' | null;
  lastAt: number | null;
  nextReviewAt: number | null;
  reviewStage: number;
  reviewFails: number;
  /** Times she hopped past this skill. Not a miss. */
  skips: number;
  /** 0–2. How many steps gentler the next puzzle of this skill should be. */
  ease: number;
};

export type SessionRecord = {
  id: string;
  startedAt: number;
  endedAt: number | null;
  chapterTitle: string;
  topicIds: string[];
  correct: number;
  incorrect: number;
  /** Hops past a spell. Not a miss, and not a crystal. */
  skips: number;
  rewardId: string | null;
};

export type PlacementState = {
  done: boolean;
  correct: number;
  asked: number;
  frontierAge: number;
  completedAt: number | null;
};

export type WardrobeSlot = 'dress' | 'hat' | 'familiar' | 'bag' | 'wand' | 'necklace' | 'crown' | 'broom';

export type WardrobeState = {
  owned: string[];
  equipped: Partial<Record<WardrobeSlot, string>>;
};

export type Progress = {
  format: typeof PROGRESS_FORMAT;
  taxonomy: 'marble-skill-taxonomy-v1';
  learnerName: string;
  placement: PlacementState;
  topics: Record<string, TopicState>;
  sessions: SessionRecord[];
  seenTemplates: string[];
  rewards: string[];
  /** Total crystal value. Never negative. The purse is this same amount in coins. */
  crystals: number;
  /** Pink 1, yellow 5, blue 10, gold 20. Always the canonical breakdown of crystals. */
  purse: Purse;
  wardrobe: WardrobeState;
  /** Places she has opened. Stars on the map come from this list. */
  visitedPlaces: string[];
  /** Places whose story has already been offered. */
  storyOffers: string[];
  /** Stories she has heard through to the end. */
  storiesHeard: string[];
  /** Stories she saved with the heart. */
  storyFavourites: string[];
  /** Personalised visits, newest first. */
  adventures: Adventure[];
  /** One storybook for every place. Chapters are her visits, newest last. */
  books: PlaceBook[];
  /** Furniture she owns and where it sits in the witch's house. */
  house: HouseState;
  /** How many times she has stopped to talk with each neighbour. */
  talks: TalkMemory[];
  /** Little quests a neighbour is waiting on, or has already thanked her for. */
  quests: QuestRecord[];
  updatedAt: number;
};

export type Status = 'mastered' | 'practicing' | 'ready' | 'locked';

export function emptyTopicState(): TopicState {
  return {
    correct: 0,
    incorrect: 0,
    streak: 0,
    attempts: [],
    masteredAt: null,
    via: null,
    lastAt: null,
    nextReviewAt: null,
    reviewStage: 0,
    reviewFails: 0,
    skips: 0,
    ease: 0,
  };
}

export function freshProgress(name = DEFAULT_LEARNER_NAME): Progress {
  return {
    format: PROGRESS_FORMAT,
    taxonomy: 'marble-skill-taxonomy-v1',
    learnerName: name,
    placement: { done: false, correct: 0, asked: 0, frontierAge: DEFAULT_FRONTIER_AGE, completedAt: null },
    topics: {},
    sessions: [],
    seenTemplates: [],
    rewards: [],
    crystals: 0,
    purse: emptyPurse(),
    wardrobe: { owned: [], equipped: {} },
    visitedPlaces: [],
    storyOffers: [],
    storiesHeard: [],
    storyFavourites: [],
    adventures: [],
    books: emptyBooks(),
    house: freshHouse(),
    talks: [],
    quests: [],
    updatedAt: Date.now(),
  };
}
