import { describe, expect, it } from 'vitest';
import { freshProgress } from '../src/progress/types.ts';
import { normalizeVisited, withWardrobe } from '../src/progress/storage.ts';
import { formatReport, mumMailto, postReports, type Report } from '../src/feedback/reports.ts';

const sample: Report = {
  id: 'note-1',
  kind: 'broken',
  text: 'The clock hand hid the other one.',
  createdAt: Date.parse('2026-10-18T12:00:00Z'),
  context: {
    screen: 'chapter',
    placeId: 'observatory',
    placeName: 'Observatory',
    activity: 'clock',
    question: 'Set the garden clock to 3 o’clock.',
    lastAnswer: 'Clock 10:20.',
    commit: 'abc1234',
    version: '1.0.0',
    userAgent: 'iPad',
    viewport: '834x1112',
    orientation: 'portrait',
    time: '2026-10-18T12:00:00.000Z',
  },
};

describe('map stars and notes', () => {
  it('keeps stars for places an older save already walked', () => {
    const saved = freshProgress();
    saved.sessions = Array.from({ length: 3 }, (_, index) => ({
      id: `s${index}`,
      startedAt: index,
      endedAt: index + 1,
      chapterTitle: 'A quiet chapter',
      topicIds: [],
      correct: 1,
      incorrect: 0,
      rewardId: null,
    }));
    const raw = { ...saved } as Partial<typeof saved>;
    delete raw.visitedPlaces;
    const loaded = withWardrobe(raw as typeof saved);
    expect(loaded.visitedPlaces).toEqual(['lantern-grove', 'potion-cottage', 'crystal-cave']);
    expect(loaded.sessions).toHaveLength(3);
  });

  it('drops unknown place ids and keeps a saved trail', () => {
    expect(normalizeVisited(['crystal-cave', 'nope', 'crystal-shop'], 0)).toEqual(['crystal-cave', 'crystal-shop']);
  });

  it('writes a letter to Mum and leaves the post box unused until an endpoint exists', async () => {
    const href = mumMailto([sample]);
    expect(href.startsWith('mailto:yildirim.gulcin88@gmail.com?')).toBe(true);
    expect(decodeURIComponent(href)).toContain('The clock hand hid the other one.');
    expect(decodeURIComponent(href)).toContain('Observatory');
    expect(formatReport(sample)).toContain('clock');
    expect(await postReports([sample])).toBe(false);
  });
});
