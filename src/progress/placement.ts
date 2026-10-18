import type { Topic } from '../curriculum/types.ts';
import { DEFAULT_FRONTIER_AGE, emptyTopicState, type Progress } from './types.ts';

export { DEFAULT_FRONTIER_AGE };
export const MIN_START_AGE = 4;
export const MAX_START_AGE = 15;

export type PlacementBand = {
  frontierAge: number;
  /** Topics treated as already known after this placement score. */
  known: (topic: Topic) => boolean;
};

export function clampStartAge(age: number): number {
  if (!Number.isFinite(age)) return DEFAULT_FRONTIER_AGE;
  return Math.min(MAX_START_AGE, Math.max(MIN_START_AGE, Math.round(age)));
}

export function startAgeChoices(): number[] {
  return Array.from({ length: MAX_START_AGE - MIN_START_AGE + 1 }, (_, index) => MIN_START_AGE + index);
}

export function gradeLabel(age: number): string {
  switch (clampStartAge(age)) {
    case 4:
      return 'Early years · age 4';
    case 5:
      return 'Early years · age 5';
    case 6:
      return 'PYP Grade 1 · age 6';
    case 7:
      return 'PYP Grade 2 · age 7';
    case 8:
      return 'PYP Grade 3 · age 8';
    case 9:
      return 'PYP Grade 4 · age 9';
    case 10:
      return 'PYP Grade 5 · age 10';
    case 11:
      return 'PYP Grade 6 · age 11';
    default:
      return `Age ${clampStartAge(age)}`;
  }
}

/**
 * Topics that finish before the starting age count as already held.
 * The earliest band only holds the first counting ideas, so the garden can still step down.
 */
export function topicsKnownAt(frontierAge: number): (topic: Topic) => boolean {
  const age = clampStartAge(frontierAge);
  if (age <= 5) return (topic) => topic.ageRangeStart <= 4;
  return (topic) => topic.ageRangeEnd < age;
}

/**
 * A short playful placement. Five gentle tasks.
 * 0–1: earliest counting ideas (age 5).
 * 2: age 6. 3: age 7.
 * 4–5: IB PYP Grade 3 (age 8). Chapters still step back into missing prerequisites
 * and can climb with no age ceiling.
 */
export function placementBand(correct: number): PlacementBand {
  const frontierAge = correct <= 1 ? 5 : correct === 2 ? 6 : correct === 3 ? 7 : DEFAULT_FRONTIER_AGE;
  return { frontierAge, known: topicsKnownAt(frontierAge) };
}

export function applyStartAge(progress: Progress, frontierAge: number, topics: Topic[], now: number): Progress {
  const age = clampStartAge(frontierAge);
  const known = topicsKnownAt(age);
  const topicsNext = { ...progress.topics };
  for (const topic of topics) {
    const prev = topicsNext[topic.id];
    if (known(topic)) {
      if (prev?.masteredAt) continue;
      const base = prev ?? emptyTopicState();
      topicsNext[topic.id] = {
        ...base,
        masteredAt: now,
        via: 'placement',
        lastAt: now,
      };
      continue;
    }
    if (prev?.via === 'placement' && prev.masteredAt) {
      topicsNext[topic.id] = {
        ...prev,
        masteredAt: null,
        via: null,
        nextReviewAt: null,
        reviewStage: 0,
        reviewFails: 0,
      };
    }
  }
  return {
    ...progress,
    placement: {
      ...progress.placement,
      done: true,
      frontierAge: age,
      completedAt: progress.placement.completedAt ?? now,
    },
    topics: topicsNext,
    updatedAt: now,
  };
}

export function applyPlacement(progress: Progress, correct: number, asked: number, topics: Topic[], now: number): Progress {
  const band = placementBand(correct);
  const placed = applyStartAge(progress, band.frontierAge, topics, now);
  return {
    ...placed,
    placement: {
      done: true,
      correct,
      asked,
      frontierAge: band.frontierAge,
      completedAt: now,
    },
    updatedAt: now,
  };
}
