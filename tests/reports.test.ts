import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { freshProgress } from '../src/progress/types.ts';
import { normalizeVisited, withWardrobe } from '../src/progress/storage.ts';
import {
  feedbackUrl,
  flushReportQueue,
  formatReport,
  MUM_EMAIL,
  mumMailto,
  postReports,
  reportMailto,
  REPORTS_QUEUE_KEY,
  saveReport,
  type Report,
} from '../src/feedback/reports.ts';

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
      skips: 0,
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
    expect(href.startsWith(`mailto:${MUM_EMAIL}?`)).toBe(true);
    const letter = reportMailto(sample);
    const decoded = decodeURIComponent(letter);
    expect(letter.startsWith(`mailto:${MUM_EMAIL}?`)).toBe(true);
    expect(decoded).toContain('Spell Garden report – 1.0.0 – Observatory/clock');
    expect(decoded).toContain('Type: bug');
    expect(decoded).toContain('Version: 1.0.0');
    expect(decoded).toContain('Device: 834x1112 portrait');
    expect(letter.length).toBeLessThan(4000);
    expect(decodeURIComponent(href)).toContain('The clock hand hid the other one.');
    expect(decodeURIComponent(href)).toContain('Observatory');
    expect(formatReport(sample)).toContain('clock');
    expect(feedbackUrl()).toBeNull();
    expect(await postReports([sample])).toBe(false);
  });
});

describe('feedback endpoint', () => {
  const bag = new Map<string, string>();
  const memory = {
    get length() {
      return bag.size;
    },
    clear: () => bag.clear(),
    getItem: (key: string) => bag.get(key) ?? null,
    key: (index: number) => [...bag.keys()][index] ?? null,
    removeItem: (key: string) => {
      bag.delete(key);
    },
    setItem: (key: string, value: string) => {
      bag.set(key, value);
    },
  };
  let online = true;
  const posts: { url: string; body: string }[] = [];

  beforeEach(() => {
    bag.clear();
    posts.length = 0;
    online = true;
    vi.stubGlobal('localStorage', memory);
    vi.stubGlobal('navigator', {
      get onLine() {
        return online;
      },
      userAgent: 'test',
    });
    vi.stubGlobal('fetch', async (url: string, init: RequestInit) => {
      posts.push({ url: String(url), body: String(init?.body ?? '') });
      return new Response('ok', { status: 200 });
    });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('posts each report as JSON when VITE_FEEDBACK_URL is set', async () => {
    vi.stubEnv('VITE_FEEDBACK_URL', 'https://lumi-api.gulcin-lumi.workers.dev/');
    expect(feedbackUrl()).toBe('https://lumi-api.gulcin-lumi.workers.dev/feedback');
    saveReport(sample);
    await vi.waitFor(() => expect(posts).toHaveLength(1));
    expect(posts[0]?.url).toBe('https://lumi-api.gulcin-lumi.workers.dev/feedback');
    expect(JSON.parse(posts[0]?.body ?? '')).toMatchObject({ id: sample.id, kind: 'broken', text: sample.text });
    expect(JSON.parse(memory.getItem(REPORTS_QUEUE_KEY) ?? '[]')).toEqual([]);
  });

  it('keeps a report queued while offline and sends it once the iPad is back', async () => {
    vi.stubEnv('VITE_FEEDBACK_URL', 'https://lumi-api.gulcin-lumi.workers.dev');
    online = false;
    saveReport(sample);
    await Promise.resolve();
    expect(posts).toHaveLength(0);
    expect(JSON.parse(memory.getItem(REPORTS_QUEUE_KEY) ?? '[]')).toEqual([sample.id]);
    expect(await flushReportQueue()).toBe(false);
    online = true;
    expect(await flushReportQueue()).toBe(true);
    expect(posts).toHaveLength(1);
    expect(JSON.parse(posts[0]?.body ?? '').context.placeName).toBe('Observatory');
    expect(JSON.parse(memory.getItem(REPORTS_QUEUE_KEY) ?? '[]')).toEqual([]);
  });
});
