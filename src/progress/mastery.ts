import type { Topic } from '../curriculum/types.ts';
import { hardPrereqs } from '../curriculum/data.ts';
import {
  DEFAULT_FRONTIER_AGE,
  emptyTopicState,
  type Progress,
  type Status,
  type TopicState,
} from './types.ts';

const DAY = 86_400_000;
const REVIEW_DAYS = [1, 3, 7, 21, 60];

export function recordAttempt(
  prev: TopicState | undefined,
  correct: boolean,
  sessionId: string,
  template: string,
  now: number,
): TopicState {
  const base = prev ?? emptyTopicState();
  const streak = correct ? base.streak + 1 : 0;
  const correctN = base.correct + (correct ? 1 : 0);
  const incorrectN = base.incorrect + (correct ? 0 : 1);
  const attempts = [...base.attempts, { correct, at: now, sessionId, template }].slice(-24);

  let masteredAt = base.masteredAt;
  let via = base.via;
  let nextReviewAt = base.nextReviewAt;
  let reviewStage = base.reviewStage;
  let reviewFails = base.reviewFails;

  if (base.masteredAt) {
    if (correct) {
      reviewFails = 0;
      reviewStage = Math.min(REVIEW_DAYS.length - 1, base.reviewStage + 1);
      nextReviewAt = now + (REVIEW_DAYS[reviewStage] ?? 60) * DAY;
    } else {
      reviewFails = base.reviewFails + 1;
      if (reviewFails >= 2) {
        masteredAt = null;
        via = null;
        nextReviewAt = null;
        reviewStage = 0;
      } else {
        nextReviewAt = now + DAY;
      }
    }
  } else if (correct && streak >= 3 && correctN >= 3) {
    masteredAt = now;
    via = 'practice';
    reviewStage = 0;
    reviewFails = 0;
    nextReviewAt = now + REVIEW_DAYS[0] * DAY;
  }

  return {
    correct: correctN,
    incorrect: incorrectN,
    streak,
    attempts,
    masteredAt,
    via,
    lastAt: now,
    nextReviewAt,
    reviewStage,
    reviewFails,
  };
}

export function masteredIds(progress: Progress): Set<string> {
  const ids = new Set<string>();
  for (const [id, state] of Object.entries(progress.topics)) {
    if (state.masteredAt) ids.add(id);
  }
  return ids;
}

export function statusOf(topic: Topic, progress: Progress, mastered: Set<string>): Status {
  const state = progress.topics[topic.id];
  if (state?.masteredAt) return 'mastered';
  const locked = hardPrereqs(topic.id).some((dep) => !mastered.has(dep.prerequisiteId));
  if (locked) return 'locked';
  if (state && state.correct + state.incorrect > 0) return 'practicing';
  return 'ready';
}

export function markMastered(prev: TopicState | undefined, now: number): TopicState {
  const base = prev ?? emptyTopicState();
  return {
    ...base,
    correct: Math.max(base.correct, 3),
    streak: Math.max(base.streak, 3),
    masteredAt: now,
    via: 'parent',
    lastAt: now,
    nextReviewAt: now + REVIEW_DAYS[0] * DAY,
    reviewStage: 0,
    reviewFails: 0,
  };
}

export function isStuck(state: TopicState | undefined): boolean {
  if (!state || state.masteredAt) return false;
  const last = state.attempts.slice(-2);
  return last.length === 2 && last.every((a) => !a.correct);
}

/**
 * Frontier age grows only after she has mastered a real handful of topics
 * that start at the current age. It can keep climbing for as long as the
 * taxonomy has spells — there is no fixed age ceiling.
 */
export function effectiveFrontier(progress: Progress, topics: Topic[]): number {
  let age = progress.placement.frontierAge || DEFAULT_FRONTIER_AGE;
  const highest = topics.reduce((max, topic) => Math.max(max, topic.ageRangeStart, topic.ageRangeEnd), age);
  for (let guard = 0; guard < 24 && age < highest + 1; guard++) {
    const band = topics.filter((t) => t.ageRangeStart === age || t.ageRangeStart === age - 1);
    const done = band.filter((t) => progress.topics[t.id]?.masteredAt).length;
    const need = Math.min(8, Math.ceil(band.length * 0.45));
    if (band.length > 0 && done >= need) age += 1;
    else break;
  }
  return age;
}
