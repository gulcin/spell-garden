import { classify, isDragTemplate, type TemplateId } from '../curriculum/classify.ts';
import { allTopics, hardPrereqs, topicById } from '../curriculum/data.ts';
import type { Topic } from '../curriculum/types.ts';
import { effectiveFrontier, isStuck, masteredIds, statusOf } from './mastery.ts';
import type { Progress } from './types.ts';

export type ChapterSlot = {
  topic: Topic;
  salt: string;
  focus: boolean;
  review: boolean;
  rescue: boolean;
};

function unmetReadyPrereq(topicId: string, mastered: Set<string>, guard = 0): string | null {
  if (guard > 16) return null;
  for (const dep of hardPrereqs(topicId)) {
    if (mastered.has(dep.prerequisiteId)) continue;
    const deeperReady = hardPrereqs(dep.prerequisiteId).every((d) => mastered.has(d.prerequisiteId));
    if (deeperReady) return dep.prerequisiteId;
    const deeper = unmetReadyPrereq(dep.prerequisiteId, mastered, guard + 1);
    if (deeper) return deeper;
    return dep.prerequisiteId;
  }
  return null;
}

function byPreference(frontier: number) {
  return (a: Topic, b: Topic) => {
    const da = Math.abs(a.ageRangeStart - frontier);
    const db = Math.abs(b.ageRangeStart - frontier);
    if (da !== db) return da - db;
    if (a.ageRangeStart !== b.ageRangeStart) return a.ageRangeStart - b.ageRangeStart;
    if (b.centrality !== a.centrality) return b.centrality - a.centrality;
    return a.name.localeCompare(b.name);
  };
}

/**
 * A six-puzzle chapter: three tries on a focus spell (enough to master it),
 * then other drag manipulatives so the quest feels varied. A stuck topic
 * is replaced by a ready prerequisite. One slot can be spaced review.
 */
export function planChapter(progress: Progress, now: number, sessionId: string): ChapterSlot[] {
  const topics = allTopics();
  const mastered = masteredIds(progress);
  const frontier = effectiveFrontier(progress, topics);
  const ageCap = frontier + 1;

  const available = topics.filter((topic) => {
    const status = statusOf(topic, progress, mastered);
    if (status !== 'ready' && status !== 'practicing') return false;
    if (topic.ageRangeStart > ageCap) return false;
    return true;
  });

  const sort = byPreference(frontier);
  const pool = [...available].sort(sort);
  const dragPool = pool.filter((topic) => isDragTemplate(classify(topic)));

  const stuck = topics.find((topic) => isStuck(progress.topics[topic.id]));
  const rescueId = stuck ? unmetReadyPrereq(stuck.id, mastered) : null;
  const rescueTopic = rescueId ? topicById(rescueId) : undefined;

  const practicing = dragPool.find((topic) => {
    const state = progress.topics[topic.id];
    return state && !state.masteredAt && state.correct > 0;
  });
  let focus: Topic | undefined =
    practicing ?? dragPool[0] ?? pool.find((topic) => classify(topic) !== 'fallback') ?? pool[0];

  const focusDistance = focus ? Math.abs(focus.ageRangeStart - frontier) : Number.POSITIVE_INFINITY;
  const closerLocked = topics
    .filter((topic) => topic.ageRangeStart <= ageCap)
    .filter((topic) => statusOf(topic, progress, mastered) === 'locked')
    .filter((topic) => Math.abs(topic.ageRangeStart - frontier) < focusDistance)
    .sort(sort);
  let fillingGap = false;
  const gapTarget = closerLocked[0];
  if (gapTarget) {
    const gapId = unmetReadyPrereq(gapTarget.id, mastered);
    const gap = gapId ? topicById(gapId) : undefined;
    if (gap) {
      focus = gap;
      fillingGap = true;
    }
  }

  const chosen: { topic: Topic; focus: boolean; review: boolean; rescue: boolean }[] = [];
  if (rescueTopic && rescueTopic.id !== focus?.id) {
    chosen.push({ topic: rescueTopic, focus: false, review: false, rescue: true });
  }
  if (focus) {
    // Three tries on one idea, so three correct answers can master it.
    // The questions themselves are de-duplicated when they are generated.
    chosen.push(
      { topic: focus, focus: true, review: false, rescue: fillingGap },
      { topic: focus, focus: true, review: false, rescue: fillingGap },
      { topic: focus, focus: true, review: false, rescue: fillingGap },
    );
  }

  const used = new Set<TemplateId>(chosen.map((slot) => classify(slot.topic)));
  const pushVariety = (list: Topic[]) => {
    for (const topic of list) {
      if (chosen.length >= 6) return;
      if (focus && topic.id === focus.id) continue;
      const template = classify(topic);
      if (template === 'fallback') continue;
      if (used.has(template)) continue;
      chosen.push({ topic, focus: false, review: false, rescue: false });
      used.add(template);
    }
  };
  pushVariety(dragPool);
  pushVariety(pool);

  let guard = 0;
  while (chosen.length < 6 && pool.length > 0 && guard < 12) {
    const topic = pool[guard % pool.length];
    if (topic) chosen.push({ topic, focus: false, review: false, rescue: false });
    guard += 1;
  }

  const due = topics
    .filter((topic) => {
      const state = progress.topics[topic.id];
      return !!state?.masteredAt && state.nextReviewAt != null && state.nextReviewAt <= now;
    })
    .sort((a, b) => (progress.topics[a.id]?.nextReviewAt ?? 0) - (progress.topics[b.id]?.nextReviewAt ?? 0));
  const review = due[0];
  if (review && chosen.length >= 4) {
    chosen[chosen.length - 1] = { topic: review, focus: false, review: true, rescue: false };
  }

  return chosen.slice(0, 6).map((slot, index) => ({
    ...slot,
    salt: `${sessionId}:${index}:${slot.topic.id}${slot.review ? ':review' : ''}`,
  }));
}
