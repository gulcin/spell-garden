import type { Adventure } from '../stories/adventure.ts';

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
};

export type SessionRecord = {
  id: string;
  startedAt: number;
  endedAt: number | null;
  chapterTitle: string;
  topicIds: string[];
  correct: number;
  incorrect: number;
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
  /** Crystals spent at the crystal shop. Never negative. */
  crystals: number;
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
    wardrobe: { owned: [], equipped: {} },
    visitedPlaces: [],
    storyOffers: [],
    storiesHeard: [],
    storyFavourites: [],
    adventures: [],
    updatedAt: Date.now(),
  };
}
