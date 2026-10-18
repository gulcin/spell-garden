import { describe, expect, it } from 'vitest';
import { freshProgress, type Progress } from '../src/progress/types.ts';
import { withWardrobe } from '../src/progress/storage.ts';
import { crystalGain } from '../src/wardrobe/catalog.ts';
import { awardCrystals, buyItem, unequipSlot } from '../src/wardrobe/economy.ts';
import { breakInto, paymentSpeech, purseTotal, rewardSpeech, tenderSpeech } from '../src/wardrobe/purse.ts';

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
        skips: 0,
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

  it('keeps the pocket in pink, yellow, blue, and gold', () => {
    expect(breakInto(26)).toEqual({ gold: 1, blue: 0, yellow: 1, pink: 1 });
    const four = awardCrystals(freshProgress(), 4);
    expect(four.purse).toEqual({ gold: 0, blue: 0, yellow: 0, pink: 4 });
    const five = awardCrystals(four, 1);
    expect(five.crystals).toBe(5);
    expect(five.purse).toEqual(breakInto(5));
    expect(rewardSpeech(4, 1)).toBe('Your 4 pink crystals shine into a yellow crystal.');
    expect(rewardSpeech(0, 1)).toBe('A pink crystal settles in your pocket.');
    expect(rewardSpeech(0, 3)).toBe('Three pink crystals settle in your pocket.');
    const paid = buyItem(awardCrystals(freshProgress(), 20), 'hat-night');
    expect(paid.bought).toBe(true);
    expect(paid.progress.crystals).toBe(14);
    expect(paid.progress.purse).toEqual({ gold: 0, blue: 1, yellow: 0, pink: 4 });
    expect(purseTotal(paid.progress.purse)).toBe(paid.progress.crystals);
    expect(paymentSpeech(20, 6)).toBe('Clover takes a gold crystal and hands back a blue crystal and 4 pink crystals.');
    expect(tenderSpeech(20, { gold: 1, blue: 0, yellow: 0, pink: 0 }, 6, 'Star nightcap')).toBe(
      'You pay a gold crystal, which is 20. The star nightcap costs 6, so Clover hands back a blue crystal and 4 pink crystals.',
    );
    expect(tenderSpeech(26, { gold: 1, blue: 0, yellow: 0, pink: 0 }, 6, 'Star nightcap')).toBe(
      'You pay a gold crystal, which is 20. The star nightcap costs 6, so 20 take away 6 is 14. Those coins and the ones you kept shine into a gold crystal.',
    );
  });

  it('reads an older save of loose crystals as coins', () => {
    const saved = freshProgress();
    saved.crystals = 12;
    const raw = { ...saved } as Partial<Progress>;
    delete raw.purse;
    const loaded = withWardrobe(raw as Progress);
    expect(loaded.crystals).toBe(12);
    expect(loaded.purse).toEqual(breakInto(12));
    const counted = freshProgress();
    counted.crystals = 100;
    counted.purse = { pink: 6, yellow: 0, blue: 0, gold: 0 };
    const folded = withWardrobe(counted);
    expect(folded.crystals).toBe(6);
    expect(folded.purse).toEqual({ gold: 0, blue: 0, yellow: 1, pink: 1 });
  });

  it('lets the mirror take a hat off without forgetting she owns it', () => {
    const bought = buyItem(awardCrystals(freshProgress(), 6), 'hat-night');
    expect(bought.progress.wardrobe.equipped.hat).toBe('hat-night');
    const off = unequipSlot(bought.progress, 'hat');
    expect(off.wardrobe.equipped.hat).toBeUndefined();
    expect(off.wardrobe.owned).toContain('hat-night');
  });
});
