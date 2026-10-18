import { describe, expect, it } from 'vitest';
import { freshProgress, type Progress } from '../src/progress/types.ts';
import { withWardrobe } from '../src/progress/storage.ts';
import { pageArt, pageAudio, pageCues, STORIES, storyById } from '../src/stories/library.ts';
import { rememberStory } from '../src/ui/StoryTime.tsx';
import { precacheFile, SPELL_GARDEN_CACHE } from '../vite.config.ts';

const PLACES = [
  'lantern-grove',
  'potion-cottage',
  'crystal-cave',
  'observatory',
  'lily-pond',
  'greenhouse',
  'wizard-tower',
  'mushroom-ring',
  'crystal-shop',
  'colouring-nook',
];

describe('story shelf', () => {
  it('keeps one warm story for every place, open to everyone', () => {
    expect(STORIES.map((story) => story.id)).toEqual(PLACES);
    for (const story of STORIES) {
      expect(story.pages.length).toBeGreaterThanOrEqual(4);
      expect(story.pages.length).toBeLessThanOrEqual(8);
      expect(story.title.length).toBeGreaterThan(0);
      expect(storyById(story.id)?.title).toBe(story.title);
      story.pages.forEach((page, index) => {
        expect(page.length).toBeGreaterThan(40);
        expect(pageAudio(story.id, index)).toBe(`/audio/stories/${story.id}/${index}.mp3`);
        expect(pageCues(story.id, index)).toBe(`/audio/stories/${story.id}/${index}.json`);
        expect(pageArt(story.id, index).src).toBe(`/art/stories/${story.id}-${index}.webp`);
      });
    }
  });

  it('remembers an offer, a finished listen, and a heart that can come off', () => {
    const offered = rememberStory(freshProgress(), 'crystal-cave', 'storyOffers');
    expect(offered.storyOffers).toEqual(['crystal-cave']);
    expect(rememberStory(offered, 'crystal-cave', 'storyOffers').storyOffers).toEqual(['crystal-cave']);
    const heard = rememberStory(offered, 'crystal-cave', 'storiesHeard');
    expect(heard.storiesHeard).toEqual(['crystal-cave']);
    const loved = rememberStory(heard, 'lily-pond', 'storyFavourites');
    expect(loved.storyFavourites).toEqual(['lily-pond']);
    expect(rememberStory(loved, 'lily-pond', 'storyFavourites').storyFavourites).toEqual([]);
  });

  it('opens an older save that never knew about stories', () => {
    const saved = freshProgress('Aida');
    const raw = { ...saved } as Partial<Progress>;
    delete raw.storyOffers;
    delete raw.storiesHeard;
    delete raw.storyFavourites;
    const loaded = withWardrobe(raw as Progress);
    expect(loaded.learnerName).toBe('Aida');
    expect(loaded.storyOffers).toEqual([]);
    expect(loaded.storiesHeard).toEqual([]);
    expect(loaded.storyFavourites).toEqual([]);
  });

  it('keeps story audio in the offline cache and leaves the heavy page art for later', () => {
    expect(SPELL_GARDEN_CACHE).toBe('spell-garden-v1.1.2');
    expect(precacheFile('version.json')).toBe(false);
    expect(precacheFile('audio/stories/crystal-cave/0.mp3')).toBe(true);
    expect(precacheFile('audio/stories/crystal-cave/0.json')).toBe(true);
    expect(precacheFile('art/stories/crystal-cave-0.webp')).toBe(true);
    expect(precacheFile('art/stories/crystal-cave-0@2x.webp')).toBe(false);
    expect(precacheFile('art/places/crystal-cave.webp')).toBe(false);
    expect(precacheFile('art/house/quilt-bed.webp')).toBe(true);
    expect(precacheFile('art/house/quilt-bed@2x.webp')).toBe(false);
    expect(precacheFile('art/crystals/gold.webp')).toBe(true);
    expect(precacheFile('art/crystals/gold@2x.webp')).toBe(false);
    expect(precacheFile('art/cast/bram.webp')).toBe(true);
    expect(precacheFile('art/cast/bram@2x.webp')).toBe(false);
  });
});
