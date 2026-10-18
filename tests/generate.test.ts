import { describe, expect, it } from 'vitest';
import { applyAll, initialState, isSolved } from '../src/activities/logic.ts';
import { countUpHint, generateItem, placementPlan } from '../src/activities/generate.ts';
import { classify, isManipulative } from '../src/curriculum/classify.ts';
import { allTopics } from '../src/curriculum/data.ts';
import { askHer } from '../src/curriculum/ask.ts';

describe('item generators', () => {
  it('solves every maths topic from its own solution', () => {
    const failures: string[] = [];
    for (const topic of allTopics()) {
      try {
        const item = generateItem(topic, 'seed-a');
        expect(item.hints).toHaveLength(3);
        expect(item.prompt.length).toBeGreaterThan(8);
        expect(item.solution.length).toBeGreaterThan(0);
        expect(isSolved(item, initialState(item))).toBe(false);
        expect(isSolved(item, applyAll(item, item.solution))).toBe(true);
        const again = generateItem(topic, 'seed-a');
        expect(again.prompt).toBe(item.prompt);
      } catch (error) {
        failures.push(`${topic.name}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    expect(failures).toEqual([]);
  });

  it('keeps placement tasks gentle and spoken-hint shaped', () => {
    const plan = placementPlan();
    expect(plan).toHaveLength(5);
    const templates = new Set<string>();
    for (const slot of plan) {
      const item = generateItem(slot.topic, slot.salt);
      templates.add(item.template);
      expect(isSolved(item, applyAll(item, item.solution))).toBe(true);
      expect(isSolved(item, initialState(item))).toBe(false);
    }
    expect(templates.size).toBeGreaterThanOrEqual(4);
    const line = generateItem(plan[2]!.topic, plan[2]!.salt);
    expect(line.hints.some((hint) => hint === countUpHint(4, 6))).toBe(true);
  });

  it('asks a real-world question from the evidence', () => {
    const topic = allTopics()[0]!;
    const question = askHer(topic, 'Prague');
    expect(question.startsWith('Ask Prague:')).toBe(true);
    expect(question.length).toBeGreaterThan(20);
  });

  it('maps a majority of topics onto real manipulatives', () => {
    const counts = new Map<string, number>();
    for (const topic of allTopics()) {
      const template = classify(topic);
      counts.set(template, (counts.get(template) ?? 0) + 1);
    }
    const manipulative = [...counts.entries()].filter(([template]) => isManipulative(template as never)).reduce((sum, [, n]) => sum + n, 0);
    expect(manipulative).toBeGreaterThan(360);
    expect(counts.get('fallback') ?? 0).toBeLessThan(140);
  });
});
