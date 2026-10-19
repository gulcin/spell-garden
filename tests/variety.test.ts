import { describe, expect, it } from 'vitest';
import { activitySignature, generateDistinct, generateItem, placementPlan } from '../src/activities/generate.ts';
import { allTopics } from '../src/curriculum/data.ts';
import { recordAttempt, recordSkip } from '../src/progress/mastery.ts';
import { applyStartAge } from '../src/progress/placement.ts';
import { planChapter, type ChapterSlot } from '../src/progress/select.ts';
import { freshProgress, type Progress } from '../src/progress/types.ts';
import { CHAPTERS } from '../src/story.ts';

const NOW = 1_700_000_000_000;

function sectionSignatures(plan: ChapterSlot[], progress: Progress): string[] {
  const avoid = new Set<string>();
  const signatures: string[] = [];
  for (const slot of plan) {
    const ease = progress.topics[slot.topic.id]?.ease ?? 0;
    const item = generateDistinct(slot.topic, slot.salt, ease, avoid);
    const signature = activitySignature(item);
    expect(avoid.has(signature), `${slot.topic.name} repeated ${item.prompt}`).toBe(false);
    avoid.add(signature);
    signatures.push(signature);
  }
  return signatures;
}

describe('no repeated activities in a section', () => {
  it('gives every chapter, at every starting age, six different problems', () => {
    const topics = allTopics();
    for (const age of [4, 5, 6, 7, 8, 9, 10, 11, 12, 15]) {
      let progress = applyStartAge(freshProgress('Aida'), age, topics, NOW);
      for (let chapter = 0; chapter < CHAPTERS.length; chapter += 1) {
        const plan = planChapter(progress, NOW + chapter, `age-${age}-ch-${chapter}`);
        if (plan.length === 0) break;
        const signatures = sectionSignatures(plan, progress);
        expect(new Set(signatures).size, `age ${age} ${CHAPTERS[chapter]!.title}`).toBe(signatures.length);
        const focus = plan.find((slot) => slot.focus);
        if (!focus) continue;
        let state = progress.topics[focus.topic.id];
        for (let attempt = 0; attempt < 3; attempt += 1) {
          state = recordAttempt(state, true, 'section', focus.topic.id, NOW + chapter * 10 + attempt);
        }
        progress = { ...progress, topics: { ...progress.topics, [focus.topic.id]: state } };
      }
    }
  });

  it('keeps the five placement spells different from each other', () => {
    const avoid = new Set<string>();
    for (const slot of placementPlan()) {
      const item = generateDistinct(slot.topic, slot.salt, 0, avoid);
      const signature = activitySignature(item);
      expect(avoid.has(signature), slot.topic.name).toBe(false);
      avoid.add(signature);
    }
    expect(avoid.size).toBe(5);
  });

  it('can draw three different problems for every skill, including the gentler steps', () => {
    const stuck: string[] = [];
    for (const ease of [0, 1, 2]) {
      for (const topic of allTopics()) {
        const signatures = new Set<string>();
        for (let salt = 0; salt < 24 && signatures.size < 3; salt += 1) {
          signatures.add(activitySignature(generateItem(topic, `vary-${ease}-${salt}`, ease)));
        }
        if (signatures.size < 3) stuck.push(`ease ${ease} ${topic.name} (${signatures.size})`);
      }
    }
    expect(stuck).toEqual([]);
  });

  it('keeps a chapter different after the focus spell is skipped twice', () => {
    const topics = allTopics();
    const repeats: string[] = [];
    for (const age of [4, 6, 8, 10, 12]) {
      let progress = applyStartAge(freshProgress('Aida'), age, topics, NOW);
      const plan = planChapter(progress, NOW, `skip-age-${age}`);
      const avoid = new Set<string>();
      plan.forEach((slot, index) => {
        const ease = progress.topics[slot.topic.id]?.ease ?? 0;
        const item = generateDistinct(slot.topic, slot.salt, ease, avoid);
        const signature = activitySignature(item);
        if (avoid.has(signature)) repeats.push(`age ${age} slot ${index} ${slot.topic.name} ease ${ease}`);
        avoid.add(signature);
        if (slot.focus) {
          progress = {
            ...progress,
            topics: { ...progress.topics, [slot.topic.id]: recordSkip(progress.topics[slot.topic.id], NOW) },
          };
        }
      });
    }
    expect(repeats).toEqual([]);
  });
});
