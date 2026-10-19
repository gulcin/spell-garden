import { describe, expect, it } from 'vitest';
import { applyAll, initialState, isSolved } from '../src/activities/logic.ts';
import { baseTenPrompt, countUpHint, generateItem, placementPlan, sampleItem } from '../src/activities/generate.ts';
import { classify, isManipulative, TEMPLATE_LABEL, type TemplateId } from '../src/curriculum/classify.ts';
import { allTopics } from '../src/curriculum/data.ts';
import { askHer } from '../src/curriculum/ask.ts';
import { learnerNameFrom } from '../src/progress/types.ts';

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

  it('migrates a saved Prague name to Aida and keeps any other name', () => {
    expect(learnerNameFrom('Prague')).toBe('Aida');
    expect(learnerNameFrom(' prague ')).toBe('Aida');
    expect(learnerNameFrom('')).toBe('Aida');
    expect(learnerNameFrom(undefined)).toBe('Aida');
    expect(learnerNameFrom('Mina')).toBe('Mina');
  });

  it('opens every clock with the hands apart from each other and from the answer', () => {
    for (const topic of allTopics()) {
      const item = generateItem(topic, 'seed-a');
      if (item.template !== 'clock' || !item.clockStart || item.goal.kind !== 'clock') continue;
      const start = item.clockStart;
      expect(start.minute === 0 && start.hour % 12 === 0).toBe(false);
      expect(start.hour % 12 === item.goal.hour % 12 && start.minute === item.goal.minute).toBe(false);
      const hourDeg = (start.hour % 12) * 30 + start.minute * 0.5;
      const minuteDeg = start.minute * 6;
      const gap = Math.abs(hourDeg - minuteDeg) % 360;
      expect(Math.min(gap, 360 - gap)).toBeGreaterThan(50);
    }
  });

  it('paints one sample of every activity', () => {
    for (const template of Object.keys(TEMPLATE_LABEL) as TemplateId[]) {
      const item = sampleItem(template);
      expect(item.template).toBe(template);
      expect(item.prompt.length).toBeGreaterThan(8);
    }
  });

  it('names only the base-ten blocks that are sitting in the tray', () => {
    expect(baseTenPrompt(21, [{ art: 'rod' }, { art: 'unit' }])).toBe(
      'Build 21 on the mat. Use a rod for a ten and a cube for a one.',
    );
    expect(baseTenPrompt(121, [{ art: 'flat' }, { art: 'rod' }, { art: 'unit' }])).toBe(
      'Build 121 on the mat. Use a flat for a hundred, a rod for a ten, and a cube for a one.',
    );
    expect(baseTenPrompt(100, [{ art: 'flat' }])).toBe('Build 100 on the mat. Use a flat for a hundred.');
    const failures: string[] = [];
    for (const topic of allTopics()) {
      for (const salt of ['seed-a', `practice-${topic.id}`]) {
        const item = generateItem(topic, salt);
        if (item.template !== 'base-ten' || !item.prompt.startsWith('Build ')) continue;
        const kinds = new Set(item.pieces.map((piece) => piece.art));
        if (!kinds.has('flat') && /flat|hundred/i.test(item.prompt)) failures.push(`${topic.name} names a flat: ${item.prompt}`);
        if (kinds.has('flat') && !item.prompt.includes('a flat for a hundred')) failures.push(`${topic.name} hides a flat: ${item.prompt}`);
        if (kinds.has('rod') && !item.prompt.includes('a rod for a ten')) failures.push(`${topic.name} hides a rod: ${item.prompt}`);
        if (!kinds.has('rod') && /\brod\b|ten/.test(item.prompt)) failures.push(`${topic.name} names a rod: ${item.prompt}`);
        if (kinds.has('unit') && !item.prompt.includes('a cube for a one')) failures.push(`${topic.name} hides a cube: ${item.prompt}`);
        if (!kinds.has('unit') && /cube/.test(item.prompt)) failures.push(`${topic.name} names a cube: ${item.prompt}`);
      }
    }
    expect(failures).toEqual([]);
  });

  it('asks a real-world question from the evidence', () => {
    const topic = allTopics()[0]!;
    const question = askHer(topic, 'Aida');
    expect(question.startsWith('Ask Aida:')).toBe(true);
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
