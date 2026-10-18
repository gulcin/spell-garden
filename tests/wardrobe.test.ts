import { describe, expect, it } from 'vitest';
import { freshProgress, type Progress } from '../src/progress/types.ts';
import { withWardrobe } from '../src/progress/storage.ts';
import { crystalGain } from '../src/wardrobe/catalog.ts';
import { awardCrystals, buyItem, unequipSlot } from '../src/wardrobe/economy.ts';

describe('crystal shop', () => {
  it('stops at zero crystals and will not buy what she cannot afford', () => {
    const paid = awardCrystals(freshProgress(), 6);
    const first = buyItem(paid, 'robe-moon');
    expect(first.bought).toBe(true);
    expect(first.progress.crystals).toBe(0);
    expect(first.progress.wardrobe.equipped.dress).toBe('robe-moon');
    const second = buyItem(first.progress, 'robe-rose');
    expect(second.bought).toBe(false);
    expect(second.progress.crystals).toBe(0);
    expect(second.progress.wardrobe.owned).toEqual(['robe-moon']);
  });

  it('ignores a negative crystal award', () => {
    expect(awardCrystals(freshProgress(), -5).crystals).toBe(0);
    expect(awardCrystals(freshProgress(), 0).crystals).toBe(0);
  });

  it('keeps an older save when crystals and the wardrobe are missing', () => {
    const saved = freshProgress('Aida');
    saved.sessions = [
      {
        id: 's',
        startedAt: 1,
        endedAt: 2,
        chapterTitle: 'A quiet chapter',
        topicIds: ['topic-1'],
        correct: 3,
        incorrect: 1,
        rewardId: 'moth',
      },
    ];
    saved.rewards = ['moth'];
    const raw = { ...saved } as Partial<Progress>;
    delete raw.crystals;
    delete raw.wardrobe;
    const loaded = withWardrobe(raw as Progress);
    expect(loaded.sessions).toHaveLength(1);
    expect(loaded.sessions[0]?.id).toBe('s');
    expect(loaded.sessions[0]?.correct).toBe(3);
    expect(loaded.rewards).toEqual(['moth']);
    expect(loaded.learnerName).toBe('Aida');
    expect(loaded.crystals).toBe(0);
    expect(loaded.wardrobe.owned).toEqual([]);
    expect(loaded.wardrobe.equipped).toEqual({});
  });

  it('clamps a negative crystal count when the save is opened', () => {
    const saved = freshProgress();
    saved.crystals = -4;
    expect(withWardrobe(saved).crystals).toBe(0);
  });

  it('pays three crystals in the cave and one crystal anywhere else', () => {
    expect(crystalGain('crystal-cave')).toBe(3);
    expect(crystalGain('lantern-grove')).toBe(1);
    expect(crystalGain('observatory')).toBe(1);
  });

  it('lets the mirror take a hat off without forgetting she owns it', () => {
    const bought = buyItem(awardCrystals(freshProgress(), 6), 'hat-night');
    expect(bought.progress.wardrobe.equipped.hat).toBe('hat-night');
    const off = unequipSlot(bought.progress, 'hat');
    expect(off.wardrobe.equipped.hat).toBeUndefined();
    expect(off.wardrobe.owned).toContain('hat-night');
  });
});
