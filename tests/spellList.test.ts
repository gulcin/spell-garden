import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { applyAll, initialState, isSolved } from '../src/activities/logic.ts';
import { generateItem } from '../src/activities/generate.ts';
import { classify } from '../src/curriculum/classify.ts';
import { allTopics, clustersFor } from '../src/curriculum/data.ts';
import { kidDomainLede, kidSpellBlurb, kidSpellName, sortSpells } from '../src/ui/spellList.ts';

describe('spell beds', () => {
  it('leads the shapes list with grade 3 and hides ages and locks', () => {
    const geometry = allTopics().filter((topic) => topic.domain === 'Geometry');
    const ordered = sortSpells(geometry, 8);
    expect(ordered.slice(0, 3).every((topic) => topic.ageRangeStart <= 8 && topic.ageRangeEnd >= 8)).toBe(true);
    expect(ordered.slice(0, 3).some((topic) => topic.ageRangeEnd <= 6)).toBe(false);
    const page = ordered.slice(0, 3).map((topic) => `${kidSpellName(topic.name)} ${kidSpellBlurb(topic)}`).join(' ');
    expect(page).not.toMatch(/Identify|Recognise|modelling|attributes/);
    expect(page).not.toMatch(/Locked|Your child|ages \d/);
    expect(kidDomainLede('Geometry', 'Aida')).toMatch(/Aida, tap a spell/);
    expect(kidDomainLede('Geometry', 'Aida')).not.toMatch(/Your child/);
    const note = clustersFor('Geometry').map((cluster) => cluster.summary).join(' ');
    expect(note).toMatch(/Your child is exploring shapes and space/);
  });

  it('gives every geometry spell, including position words, a solvable activity', () => {
    const geometry = allTopics().filter((topic) => topic.domain === 'Geometry');
    for (const topic of geometry) {
      const item = generateItem(topic, 'spell-bed');
      expect(item.solution.length).toBeGreaterThan(0);
      expect(isSolved(item, initialState(item))).toBe(false);
      expect(isSolved(item, applyAll(item, item.solution))).toBe(true);
    }
    const place = allTopics().find((topic) => topic.name === 'Positional Language');
    expect(place).toBeTruthy();
    expect(classify(place!)).toBe('shapes');
    expect(generateItem(place!, 'spell-bed').prompt).toMatch(/Where is the frog/);
  });

  it('makes the whole spell card the button', () => {
    const css = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8');
    expect(css).toMatch(/\.spell-list li \{[^}]*display:\s*block/);
    expect(css).toMatch(/\.spell-row, \.spell-pager button \{[^}]*width:\s*100%/);
  });
});
