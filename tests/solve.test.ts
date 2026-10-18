import { describe, expect, it } from 'vitest';
import { generateItem } from '../src/activities/generate.ts';
import { applyAll, initialState, isSolved } from '../src/activities/logic.ts';
import { allTopics } from '../src/curriculum/data.ts';

describe('every skill', () => {
  it('has a solution that finishes the puzzle', () => {
    const bad: string[] = [];
    for (const topic of allTopics()) {
      try {
        const item = generateItem(topic, `sanity-${topic.id}`);
        if (isSolved(item, initialState(item))) bad.push(`already solved ${topic.name}`);
        if (!isSolved(item, applyAll(item, item.solution))) bad.push(`${topic.id} ${item.template} ${topic.name}`);
        const spoken = [item.prompt, ...item.hints, ...item.walkthrough].join(' ');
        if (/scary|monster|ghost|blood/i.test(spoken)) bad.push(`scary ${topic.name}`);
        if (/\b1 (sparks|rods|moths|frogs|owls|tenths|hops|marbles|ones)\b/.test(spoken)) bad.push(`plural ${topic.name}: ${item.prompt}`);
        if (!item.prompt.trim() || item.hints.some((hint) => !hint.trim()) || item.walkthrough.length === 0) bad.push(`blank copy ${topic.name}`);
        if (/NaN|undefined/.test(spoken)) bad.push(`blank number ${topic.name}`);
      } catch (error) {
        bad.push(`${topic.id} threw ${error instanceof Error ? error.message : 'error'}`);
      }
    }
    expect(bad).toEqual([]);
  });
});
