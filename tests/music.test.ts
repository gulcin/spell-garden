import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { CROSSFADE_S, DUCK, MASTER } from '../src/music/engine.ts';
import { musicFor } from '../src/music/place.ts';
import { allScores, loopSteps, MUSIC_IDS, type MusicId, type Score } from '../src/music/scores.ts';
import { AUDIO_SETTINGS_KEY, DEFAULT_AUDIO, normalizeAudio, updateAudio } from '../src/music/settings.ts';

const PLACES: MusicId[] = [
  'map',
  'lantern-grove',
  'potion-cottage',
  'crystal-cave',
  'observatory',
  'lily-pond',
  'greenhouse',
  'wizard-tower',
  'mushroom-ring',
  'crystal-shop',
  'pet-shop',
  'witch-house',
  'colouring-nook',
  'story',
  'bedtime',
];

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) out.push(...walk(path));
    else out.push(path);
  }
  return out;
}

describe('place music', () => {
  it('gives every place its own seamless loop', () => {
    expect(MUSIC_IDS).toEqual(PLACES);
    const scores = allScores();
    expect(scores.map((score) => score.id)).toEqual(PLACES);
    for (const score of scores) expect(aligned(score)).toBe(true);
    const cave = scores.find((score) => score.id === 'crystal-cave');
    expect(cave?.bpm).toBeGreaterThanOrEqual(100);
    expect(cave?.voices.map((voice) => voice.kind)).toEqual(['hum', 'pluck', 'tap']);
    const pond = scores.find((score) => score.id === 'lily-pond');
    expect(pond?.bpm).toBeLessThanOrEqual(70);
    expect(pond?.voices.map((voice) => voice.kind)).toEqual(['water', 'pluck', 'bell']);
    expect(scores.find((score) => score.id === 'potion-cottage')?.voices.some((voice) => voice.kind === 'bubble')).toBe(true);
    const stars = scores.find((score) => score.id === 'observatory');
    expect(stars?.voices.map((voice) => voice.kind)).toEqual(['pad', 'bell']);
    expect(stars?.bpm).toBeLessThan(80);
    const glass = scores.find((score) => score.id === 'greenhouse');
    expect(glass?.voices.some((voice) => voice.kind === 'pluck')).toBe(true);
    expect(glass?.bpm).toBeGreaterThan(90);
    const ring = scores.find((score) => score.id === 'mushroom-ring');
    expect(ring?.bpm).toBe(Math.max(...scores.map((score) => score.bpm)));
    const house = scores.find((score) => score.id === 'witch-house');
    expect(house?.voices.some((voice) => voice.kind === 'hum')).toBe(true);
    expect(house?.bpm).toBeLessThan(80);
    const colour = scores.find((score) => score.id === 'colouring-nook');
    expect(colour?.voices.some((voice) => voice.kind === 'pad')).toBe(true);
    expect(colour?.bpm).toBeLessThanOrEqual(70);
    const story = scores.find((score) => score.id === 'story');
    const bedtime = scores.find((score) => score.id === 'bedtime');
    expect(bedtime?.bpm).toBe(Math.min(...scores.map((score) => score.bpm)));
    expect(bedtime?.step).toBeGreaterThanOrEqual(1);
    expect(bedtime?.bpm).toBeLessThan(story?.bpm ?? 0);
    expect(bedtime?.voices.find((voice) => voice.kind === 'bell')?.level).toBeLessThan(0.25);
  });

  it('picks the loop for the screen she is on', () => {
    expect(musicFor({ screen: 'home' })).toBe('map');
    expect(musicFor({ screen: 'garden', placeId: 'crystal-cave' })).toBe('map');
    expect(musicFor({ screen: 'parent' })).toBe('map');
    expect(musicFor({ screen: 'about' })).toBe('map');
    expect(musicFor({ screen: 'chapter', placeId: 'crystal-cave' })).toBe('crystal-cave');
    expect(musicFor({ screen: 'practice', placeId: 'lily-pond' })).toBe('lily-pond');
    expect(musicFor({ screen: 'shop' })).toBe('crystal-shop');
    expect(musicFor({ screen: 'wardrobe' })).toBe('crystal-shop');
    expect(musicFor({ screen: 'pets' })).toBe('pet-shop');
    expect(musicFor({ screen: 'house' })).toBe('witch-house');
    expect(musicFor({ screen: 'colour' })).toBe('colouring-nook');
    expect(musicFor({ screen: 'shelf', placeId: 'lantern-grove' })).toBe('story');
    expect(musicFor({ screen: 'story-offer', placeId: 'lily-pond' })).toBe('story');
    expect(musicFor({ screen: 'story', placeId: 'observatory', bedtime: false })).toBe('story');
    expect(musicFor({ screen: 'story', placeId: 'observatory', bedtime: true })).toBe('bedtime');
    expect(musicFor({ screen: 'chapter', placeId: 'somewhere-else' })).toBe('map');
  });

  it('keeps music quiet, ducked, and crossfaded', () => {
    expect(DUCK).toBe(0.2);
    expect(MASTER).toBeLessThanOrEqual(0.14);
    expect(CROSSFADE_S).toBeGreaterThanOrEqual(1);
    expect(DEFAULT_AUDIO).toEqual({ sound: true, music: true, volume: 0.4 });
  });

  it('remembers a grown-up choice without touching lesson progress', () => {
    expect(AUDIO_SETTINGS_KEY).toBe('spell-garden.audio.v1');
    expect(normalizeAudio(null)).toEqual(DEFAULT_AUDIO);
    expect(normalizeAudio({ sound: false, volume: 2 })).toEqual({ sound: false, music: true, volume: 1 });
    expect(normalizeAudio({ music: false, volume: Number.NaN })).toEqual({ sound: true, music: false, volume: 0.4 });
    expect(normalizeAudio({ volume: 0 })).toEqual({ sound: true, music: true, volume: 0 });
    const next = updateAudio({ music: false, volume: 0.2 });
    expect(next.music).toBe(false);
    expect(next.volume).toBe(0.2);
    updateAudio({ sound: true, music: true, volume: 0.4 });
  });

  it('credits original CC0 music and adds no music files to cache', () => {
    const credits = readFileSync(new URL('../MUSIC-CREDITS.md', import.meta.url), 'utf8');
    expect(credits).toMatch(/CC0/);
    expect(credits).toMatch(/original/i);
    const note = credits.toLowerCase();
    for (const name of ['lantern grove', 'potion cottage', 'crystal cave', 'observatory', 'lily pond', 'greenhouse', 'wizard tower', 'mushroom ring', 'crystal shop', 'pet shop', 'witch', 'colouring', 'map', 'bedtime']) {
      expect(note).toContain(name);
    }
    const audio = walk(join(process.cwd(), 'public', 'audio')).map((file) => file.split('public/audio/')[1] ?? file);
    expect(audio.every((file) => file.startsWith('stories/'))).toBe(true);
    expect(audio.some((file) => file.endsWith('.ogg') || file.endsWith('.m4a'))).toBe(false);
  });
});

function aligned(score: Score): boolean {
  const steps = loopSteps(score);
  if (steps < 4) return false;
  return score.voices.every((voice) => {
    if (!voice.notes) return voice.kind === 'pad' || voice.kind === 'water';
    if (voice.notes.length !== steps) return false;
    if (voice.notes[0] === -1) return false;
    return voice.notes.every((note) => note >= -1 && note <= 96);
  });
}
