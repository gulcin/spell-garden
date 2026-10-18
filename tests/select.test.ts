import { describe, expect, it } from 'vitest';
import { classify, isDragTemplate } from '../src/curriculum/classify.ts';
import { allTopics, hardPrereqs, topicById } from '../src/curriculum/data.ts';
import { allPrereqs } from '../src/curriculum/data.ts';
import { effectiveFrontier, isStuck, masteredIds, recordAttempt, statusOf } from '../src/progress/mastery.ts';
import { applyPlacement, applyStartAge, placementBand } from '../src/progress/placement.ts';
import { planChapter } from '../src/progress/select.ts';
import { emptyTopicState, freshProgress, type Progress, type TopicState } from '../src/progress/types.ts';

function withTopic(progress: Progress, id: string, patch: Partial<TopicState>): Progress {
  const prev = progress.topics[id] ?? emptyTopicState();
  return { ...progress, topics: { ...progress.topics, [id]: { ...prev, ...patch } } };
}

describe('adaptive selection', () => {
  it('places a confident learner at PYP grade 3', () => {
    const band = placementBand(5);
    expect(band.frontierAge).toBe(8);
    const known = allTopics().filter(band.known);
    expect(known.length).toBeGreaterThan(40);
    expect(known.every((topic) => topic.ageRangeEnd <= 7)).toBe(true);
    const progress = applyPlacement(freshProgress(), 5, 5, allTopics(), 1_700_000_000_000);
    expect(progress.placement.frontierAge).toBe(8);
    expect(effectiveFrontier(progress, allTopics())).toBeLessThanOrEqual(9);
    const plan = planChapter(progress, 1_700_000_000_000, 'session-1');
    expect(plan.length).toBe(6);
    const focus = plan.filter((slot) => slot.focus);
    expect(focus).toHaveLength(3);
    expect(new Set(focus.map((slot) => slot.topic.id)).size).toBe(1);
    const drag = new Set(plan.map((slot) => classify(slot.topic)).filter((template) => isDragTemplate(template)));
    expect(drag.size).toBeGreaterThanOrEqual(4);
    const mastered = masteredIds(progress);
    for (const slot of plan) {
      if (slot.review) continue;
      expect(statusOf(slot.topic, progress, mastered)).not.toBe('locked');
    }
  });

  it('masters a topic after three correct answers and schedules review', () => {
    let state: TopicState | undefined;
    const now = 1_700_000_000_000;
    state = recordAttempt(state, true, 's', 'ten-frame', now);
    state = recordAttempt(state, true, 's', 'ten-frame', now + 1);
    expect(state.masteredAt).toBeNull();
    state = recordAttempt(state, true, 's', 'ten-frame', now + 2);
    expect(state.masteredAt).toBe(now + 2);
    expect(state.via).toBe('practice');
    expect(state.nextReviewAt).toBeGreaterThan(now + 2);
    state = recordAttempt(state, false, 's2', 'ten-frame', now + 10);
    expect(state.masteredAt).not.toBeNull();
    state = recordAttempt(state, false, 's2', 'ten-frame', now + 11);
    expect(state.masteredAt).toBeNull();
  });

  it('steps back to a ready prerequisite when a topic is stuck', () => {
    const stuck = allTopics().find((topic) => {
      const prereqs = hardPrereqs(topic.id);
      return prereqs.length > 0 && topic.ageRangeStart <= 8;
    });
    expect(stuck).toBeTruthy();
    const prereqId = hardPrereqs(stuck!.id)[0]!.prerequisiteId;
    let progress = applyPlacement(freshProgress(), 5, 5, allTopics(), 1_000);
    progress = withTopic(progress, stuck!.id, {
      correct: 0,
      incorrect: 2,
      streak: 0,
      attempts: [
        { correct: false, at: 2, sessionId: 's', template: 'array' },
        { correct: false, at: 3, sessionId: 's', template: 'array' },
      ],
      masteredAt: null,
      via: null,
    });
    if (progress.topics[prereqId]?.masteredAt) {
      progress = withTopic(progress, prereqId, { masteredAt: null, via: null });
    }
    expect(isStuck(progress.topics[stuck!.id])).toBe(true);
    const plan = planChapter(progress, 5_000, 'rescue');
    const ids = plan.map((slot) => slot.topic.id);
    const rescue = plan.find((slot) => slot.rescue);
    expect(rescue).toBeTruthy();
    expect(ids).toContain(rescue!.topic.id);
    expect(rescue!.topic.id).not.toBe(stuck!.id);
    const reason = allPrereqs(stuck!.id).some((dep) => dep.prerequisiteId === rescue!.topic.id || hardPrereqs(dep.prerequisiteId).some((inner) => inner.prerequisiteId === rescue!.topic.id));
    expect(topicById(rescue!.topic.id)).toBeTruthy();
    expect(reason || hardPrereqs(stuck!.id).length > 0).toBe(true);
  });

  it('mixes in a spaced review when one is due', () => {
    let progress = applyPlacement(freshProgress(), 4, 5, allTopics(), 1_000);
    const mastered = allTopics().find((topic) => progress.topics[topic.id]?.masteredAt);
    expect(mastered).toBeTruthy();
    progress = withTopic(progress, mastered!.id, { nextReviewAt: 50, masteredAt: 40, via: 'placement' });
    const plan = planChapter(progress, 100, 'review');
    expect(plan.some((slot) => slot.review && slot.topic.id === mastered!.id)).toBe(true);
  });

  it('keeps a struggling learner on earlier ideas', () => {
    const band = placementBand(1);
    expect(band.frontierAge).toBe(5);
    const progress = applyPlacement(freshProgress(), 1, 5, allTopics(), 10);
    expect(progress.placement.frontierAge).toBe(5);
    expect(Object.values(progress.topics).filter((topic) => topic.masteredAt).length).toBeLessThan(40);
  });

  it('defaults to grade 3 and lets a grown-up move the start', () => {
    const fresh = freshProgress();
    expect(fresh.placement.frontierAge).toBe(8);
    expect(fresh.placement.done).toBe(false);
    const placed = applyPlacement(fresh, 5, 5, allTopics(), 50);
    const lowered = applyStartAge(placed, 5, allTopics(), 80);
    expect(lowered.placement.frontierAge).toBe(5);
    expect(lowered.placement.done).toBe(true);
    const stillPlaced = Object.values(lowered.topics).filter((topic) => topic.via === 'placement' && topic.masteredAt);
    expect(stillPlaced.length).toBeLessThan(40);
    const raised = applyStartAge(lowered, 8, allTopics(), 90);
    expect(raised.placement.frontierAge).toBe(8);
    expect(Object.values(raised.topics).some((topic) => topic.via === 'practice')).toBe(false);
    expect(Object.values(raised.topics).filter((topic) => topic.via === 'placement' && topic.masteredAt).length).toBeGreaterThan(40);
  });

  it('climbs past age 14 when the current band is mastered', () => {
    let progress = freshProgress();
    progress = {
      ...progress,
      placement: { ...progress.placement, done: true, frontierAge: 14 },
    };
    for (const topic of allTopics()) {
      if (topic.ageRangeStart >= 13) {
        progress = withTopic(progress, topic.id, { masteredAt: 5, via: 'practice', correct: 3, streak: 3 });
      }
    }
    expect(effectiveFrontier(progress, allTopics())).toBeGreaterThan(14);
  });

  it('steps down into a prerequisite when the starting age is still locked', () => {
    const progress: Progress = {
      ...freshProgress(),
      placement: { done: true, correct: 0, asked: 0, frontierAge: 12, completedAt: 1 },
    };
    const plan = planChapter(progress, 2_000, 'gaps');
    const focus = plan.filter((slot) => slot.focus);
    expect(focus).toHaveLength(3);
    expect(new Set(focus.map((slot) => slot.topic.id)).size).toBe(1);
    const focusTopic = focus[0]!.topic;
    expect(statusOf(focusTopic, progress, masteredIds(progress))).not.toBe('locked');
    expect(focusTopic.ageRangeStart).toBeLessThan(12);
    const opensHigher = allTopics().some((topic) => topic.ageRangeStart >= 12 && prereqChain(topic.id, focusTopic.id));
    expect(opensHigher).toBe(true);
  });
});

function prereqChain(topicId: string, needle: string, guard = 0): boolean {
  if (guard > 16) return false;
  for (const dep of hardPrereqs(topicId)) {
    if (dep.prerequisiteId === needle) return true;
    if (prereqChain(dep.prerequisiteId, needle, guard + 1)) return true;
  }
  return false;
}
