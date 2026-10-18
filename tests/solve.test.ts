import { describe, expect, it } from 'vitest';
import { generateItem } from '../src/activities/generate.ts';
import { applyAll, isSolved } from '../src/activities/logic.ts';
import { allTopics } from '../src/curriculum/data.ts';

describe('every skill', () => {
  it('has a solution that finishes the puzzle', () => {
    const bad: string[] = [];
    for (const topic of allTopics()) {
      try {
        const item = generateItem(topic, `sanity-${topic.id}`);
        if (!isSolved(item, applyAll(item, item.solution))) bad.push(`${topic.id} ${item.template} ${topic.name}`);
      } catch (error) {
        bad.push(`${topic.id} threw ${error instanceof Error ? error.message : 'error'}`);
      }
    }
    expect(bad).toEqual([]);
  });
});
