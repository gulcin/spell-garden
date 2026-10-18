import { describe, expect, it } from 'vitest';
import { PEOPLE, personAt } from '../src/cast/people.ts';
import { applyTalk, bumpPlaceQuests, normalizeQuests, normalizeTalks } from '../src/cast/talk.ts';
import { freshProgress, type Progress } from '../src/progress/types.ts';
import { withWardrobe } from '../src/progress/storage.ts';
import { bookByPlace } from '../src/stories/books.ts';
import { PLACES } from '../src/ui/pictures.tsx';
import { awardCrystals } from '../src/wardrobe/economy.ts';

const NOW = Date.UTC(2026, 9, 18);

function pages(progress: Progress, placeId: string): string[] {
  return bookByPlace(progress.books, placeId).chapters.flatMap((chapter) => chapter.pages.map((page) => page.text));
}

describe('neighbours', () => {
  it('gives every place a friendly person', () => {
    const places = [...PLACES.map((place) => place.id), 'crystal-shop', 'witch-house', 'colouring-nook'];
    expect(new Set(PEOPLE.map((person) => person.placeId))).toEqual(new Set(places));
    for (const person of PEOPLE) {
      expect(person.questions.length).toBeGreaterThanOrEqual(2);
      expect(person.quest.reward).toBeGreaterThan(0);
      const text = `${person.hello} ${person.hint} ${person.quest.offer} ${person.blurb}`;
      expect(text.toLowerCase()).not.toMatch(/scary|monster|ghost|blood/);
    }
  });

  it('remembers her name, her outfit, and a second visit', () => {
    const saved = freshProgress('Aida');
    saved.wardrobe = { owned: ['robe-moon'], equipped: { dress: 'robe-moon' } };
    const first = applyTalk(saved, 'lantern-grove', null, { at: 'menu' }, NOW);
    expect(first.view.line).toContain('Aida');
    expect(first.view.line).toContain('moonlace robe');
    expect(first.view.replies.map((reply) => reply.label)).toEqual(['A hint, please', 'Ask me something', 'A little quest']);
    expect(pages(first.progress, 'lantern-grove').join(' ')).toContain('Bram');
    const second = applyTalk(first.progress, 'lantern-grove', null, { at: 'menu' }, NOW);
    expect(second.view.line).toContain('second visit');
    expect(second.progress.talks.find((talk) => talk.characterId === 'bram')?.visits).toBe(2);
  });

  it('asks a small sum and keeps a gentle nudge', () => {
    const opened = applyTalk(freshProgress('Aida'), 'lantern-grove', null, { at: 'menu' }, NOW);
    const asked = applyTalk(opened.progress, 'lantern-grove', 'ask', { at: 'menu' }, NOW);
    expect(asked.view.line).toContain('2 lanterns');
    const missed = applyTalk(asked.progress, 'lantern-grove', 'answer-bram-sum-4', asked.step, NOW);
    expect(missed.view.line).toContain('Count them');
    expect(missed.progress.crystals).toBe(0);
    const right = applyTalk(missed.progress, 'lantern-grove', 'answer-bram-sum-5', missed.step, NOW);
    expect(right.view.line).toContain('Five lanterns');
    expect(pages(right.progress, 'lantern-grove').join(' ')).toContain('said 5');
  });

  it('keeps a lantern quest until five spells, then pays crystals once', () => {
    let progress = applyTalk(freshProgress('Aida'), 'lantern-grove', null, { at: 'menu' }, NOW).progress;
    progress = applyTalk(progress, 'lantern-grove', 'quest', { at: 'menu' }, NOW).progress;
    progress = applyTalk(progress, 'lantern-grove', 'accept', { at: 'quest' }, NOW).progress;
    expect(progress.quests.find((quest) => quest.id === 'bram-lanterns')?.status).toBe('active');
    for (let i = 0; i < 5; i += 1) progress = bumpPlaceQuests(progress, 'lantern-grove');
    expect(progress.quests[0]?.progress).toBe(5);
    const other = bumpPlaceQuests(progress, 'lily-pond');
    expect(other.quests[0]?.progress).toBe(5);
    const done = applyTalk(progress, 'lantern-grove', 'quest', { at: 'menu' }, NOW);
    expect(done.progress.crystals).toBe(2);
    expect(done.progress.quests[0]?.status).toBe('done');
    expect(done.view.line).toContain('Two pink crystals settle');
    const again = applyTalk(done.progress, 'lantern-grove', 'quest', { at: 'menu' }, NOW);
    expect(again.progress.crystals).toBe(2);
    expect(pages(done.progress, 'lantern-grove').join(' ')).toContain('light 5 lanterns');
  });

  it('counts a pocket of 30 as three blue crystals and does not take them', () => {
    const rich = awardCrystals(freshProgress('Aida'), 30);
    let progress = applyTalk(rich, 'crystal-cave', null, { at: 'menu' }, NOW).progress;
    progress = applyTalk(progress, 'crystal-cave', 'accept', { at: 'quest' }, NOW).progress;
    expect(progress.crystals).toBe(35);
    expect(progress.purse).toEqual({ gold: 1, blue: 1, yellow: 1, pink: 0 });
    expect(progress.quests.find((quest) => quest.id === 'cobble-blues')?.status).toBe('done');
    expect(pages(progress, 'crystal-cave').join(' ')).toContain('3 blue crystals');
  });

  it('opens an older save with no neighbours yet', () => {
    const saved = freshProgress('Aida');
    const raw = { ...saved } as Partial<Progress>;
    delete raw.talks;
    delete raw.quests;
    const loaded = withWardrobe(raw as Progress);
    expect(loaded.talks).toEqual([]);
    expect(loaded.quests).toEqual([]);
    expect(normalizeTalks([{ characterId: 'nope', visits: 4 }, { characterId: 'pip', visits: 2 }])).toEqual([
      { characterId: 'pip', visits: 2 },
    ]);
    expect(normalizeQuests([{ id: 'pip-caps', characterId: 'pip', status: 'active', progress: 1, startedAt: 1, doneAt: null }])).toHaveLength(1);
    expect(personAt('mushroom-ring')?.name).toBe('Pip');
  });
});
