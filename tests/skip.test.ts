import { describe, expect, it } from 'vitest';
import { generateItem } from '../src/activities/generate.ts';
import { classify } from '../src/curriculum/classify.ts';
import { allTopics } from '../src/curriculum/data.ts';
import { applySkip, isStuck, recordAttempt, recordSkip } from '../src/progress/mastery.ts';
import { withWardrobe } from '../src/progress/storage.ts';
import { emptyTopicState, freshProgress, type TopicState } from '../src/progress/types.ts';

describe('skipping a spell', () => {
  it('logs the hop and eases the skill without a miss or a lost crystal', () => {
    const progress = freshProgress();
    progress.crystals = 12;
    progress.sessions = [
      {
        id: 's',
        startedAt: 1,
        endedAt: null,
        chapterTitle: 'A quiet chapter',
        topicIds: [],
        correct: 2,
        incorrect: 0,
        skips: 0,
        rewardId: null,
      },
    ];
    const next = applySkip(progress, 'sharing', 's', 50);
    expect(next.crystals).toBe(12);
    expect(next.books).toBe(progress.books);
    expect(next.rewards).toBe(progress.rewards);
    expect(next.sessions[0]?.correct).toBe(2);
    expect(next.sessions[0]?.incorrect).toBe(0);
    expect(next.sessions[0]?.skips).toBe(1);
    const topic = next.topics.sharing!;
    expect(topic.skips).toBe(1);
    expect(topic.ease).toBe(1);
    expect(topic.correct).toBe(0);
    expect(topic.incorrect).toBe(0);
    expect(topic.streak).toBe(0);
    expect(topic.attempts).toEqual([]);
    expect(topic.masteredAt).toBeNull();
    expect(isStuck(topic)).toBe(false);
  });

  it('caps the gentler step at two, and a later correct eases back one step', () => {
    let state: TopicState | undefined = recordSkip(undefined, 1);
    state = recordSkip(state, 2);
    state = recordSkip(state, 3);
    expect(state.skips).toBe(3);
    expect(state.ease).toBe(2);
    expect(state.incorrect).toBe(0);
    state = recordAttempt(state, true, 's', 'ten-frame', 4);
    expect(state.ease).toBe(1);
    expect(state.skips).toBe(3);
    expect(state.correct).toBe(1);
    expect(state.masteredAt).toBeNull();
    state = recordAttempt(state, false, 's', 'ten-frame', 5);
    expect(state.ease).toBe(1);
    expect(state.incorrect).toBe(1);
    expect(state.skips).toBe(3);
    expect(isStuck(state)).toBe(false);
  });

  it('keeps an older save that has no skip fields', () => {
    const saved = freshProgress();
    const legacy = emptyTopicState();
    delete (legacy as Partial<TopicState>).skips;
    delete (legacy as Partial<TopicState>).ease;
    saved.topics = { counting: legacy as TopicState };
    const loaded = withWardrobe(JSON.parse(JSON.stringify(saved)));
    expect(loaded.topics.counting?.skips).toBe(0);
    expect(loaded.topics.counting?.ease).toBe(0);
    expect(loaded.sessions.every((session) => session.skips === 0)).toBe(true);
  });

  it('makes the next puzzle of that skill a smaller step', () => {
    const topic = allTopics().find(
      (entry) =>
        entry.ageRangeStart >= 7 &&
        entry.ageRangeStart <= 8 &&
        classify(entry) === 'number-line' &&
        !/skip|negative|1000|100s|50s/.test(entry.name.toLowerCase()),
    );
    expect(topic).toBeTruthy();
    const hop = (ease: number, salt: string) => {
      const item = generateItem(topic!, salt, ease);
      const goal = item.goal.kind === 'piece-at' ? item.goal.zoneId : '';
      const start = item.initial.frog ?? '';
      const value = (zone: string) => (zone.startsWith('padm') ? -Number(zone.slice(4)) : Number(zone.replace('pad', '')));
      return Math.abs(value(goal) - value(start));
    };
    const easy = Array.from({ length: 16 }, (_, i) => hop(1, `gentle-${i}`));
    const plain = Array.from({ length: 16 }, (_, i) => hop(0, `gentle-${i}`));
    expect(Math.max(...easy)).toBeLessThanOrEqual(2);
    expect(Math.max(...plain)).toBeGreaterThan(Math.max(...easy));
    expect(generateItem(topic!, 'same', 1).prompt).toBe(generateItem(topic!, 'same', 1).prompt);
  });
});
