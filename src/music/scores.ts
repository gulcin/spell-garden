/** Original loops for Spell Garden. Numbers are MIDI notes. 0 rests. -1 holds the note before it. */

export type MusicId =
  | 'map'
  | 'lantern-grove'
  | 'potion-cottage'
  | 'crystal-cave'
  | 'observatory'
  | 'lily-pond'
  | 'greenhouse'
  | 'wizard-tower'
  | 'mushroom-ring'
  | 'crystal-shop'
  | 'pet-shop'
  | 'witch-house'
  | 'colouring-nook'
  | 'story'
  | 'bedtime';

export type ToneKind = 'hum' | 'pluck' | 'bell' | 'pad' | 'bubble' | 'tap' | 'water';

export type VoiceScore = {
  kind: ToneKind;
  /** Share of this loop's mix, before the quiet master volume. */
  level: number;
  /** Stepped notes. Beds (pad, water) leave this out. */
  notes?: number[];
  /** Held chord for a pad. */
  tones?: number[];
};

export type Score = {
  id: MusicId;
  bpm: number;
  /** Length of one step, in quarter-note beats. */
  step: number;
  voices: VoiceScore[];
};

const PLACES: Score[] = [
  {
    id: 'map',
    bpm: 84,
    step: 0.5,
    voices: [
      { kind: 'pad', level: 0.5, tones: [55, 62, 67] },
      { kind: 'pluck', level: 0.7, notes: [67, 0, 71, 0, 74, 0, 71, 0, 67, 0, 64, 0, 67, -1, -1, 0] },
    ],
  },
  {
    id: 'lantern-grove',
    bpm: 72,
    step: 0.5,
    voices: [
      { kind: 'hum', level: 0.55, notes: [50, -1, -1, -1, -1, -1, -1, -1, 45, -1, -1, -1, 50, -1, -1, 0] },
      { kind: 'bell', level: 0.45, notes: [74, 0, 0, 0, 71, 0, 0, 0, 67, 0, 0, 0, 74, 0, 0, 0] },
    ],
  },
  {
    id: 'potion-cottage',
    bpm: 102,
    step: 0.5,
    voices: [
      { kind: 'pluck', level: 0.45, notes: [67, 0, 71, 0, 74, 0, 71, 0, 69, 0, 72, 0, 67, 0, 0, 0] },
      { kind: 'bubble', level: 0.7, notes: [67, 0, 72, 0, 64, 0, 71, 0, 67, 0, 74, 0, 72, 0, 67, 0] },
    ],
  },
  {
    id: 'crystal-cave',
    bpm: 108,
    step: 0.5,
    voices: [
      { kind: 'hum', level: 0.5, notes: [57, -1, -1, -1, 57, -1, -1, -1, 53, -1, -1, -1, 57, -1, -1, -1] },
      { kind: 'pluck', level: 0.62, notes: [69, 0, 71, 72, 74, 0, 72, 71, 69, 0, 67, 69, 71, 0, 69, 0] },
      { kind: 'tap', level: 0.55, notes: [1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 0] },
    ],
  },
  {
    id: 'observatory',
    bpm: 64,
    step: 0.5,
    voices: [
      { kind: 'pad', level: 0.45, tones: [52, 59, 64] },
      {
        kind: 'bell',
        level: 0.5,
        notes: [76, 0, 0, 0, 0, 0, 79, 0, 0, 0, 0, 0, 74, 0, 0, 0, 0, 0, 72, 0, 0, 0, 0, 0, 76, 0, 0, 0, 0, 0, 0, 0],
      },
    ],
  },
  {
    id: 'lily-pond',
    bpm: 60,
    step: 0.5,
    voices: [
      { kind: 'water', level: 0.7 },
      { kind: 'pluck', level: 0.55, notes: [62, 0, 66, 0, 69, 0, 74, 0, 69, 0, 66, 0, 62, 0, 0, 0] },
      { kind: 'bell', level: 0.4, notes: [0, 0, 0, 81, 0, 0, 0, 0, 0, 0, 78, 0, 0, 0, 74, 0] },
    ],
  },
  {
    id: 'greenhouse',
    bpm: 104,
    step: 0.5,
    voices: [
      { kind: 'pluck', level: 0.72, notes: [72, 0, 74, 76, 79, 0, 76, 74, 72, 0, 67, 0, 72, 0, 79, 0] },
      { kind: 'bell', level: 0.28, notes: [0, 0, 79, 0, 0, 0, 84, 0, 0, 0, 76, 0, 0, 0, 0, 0] },
    ],
  },
  {
    id: 'wizard-tower',
    bpm: 76,
    step: 0.5,
    voices: [
      { kind: 'hum', level: 0.4, notes: [53, -1, -1, -1, -1, -1, -1, -1, 48, -1, -1, -1, 53, -1, -1, 0] },
      { kind: 'pluck', level: 0.55, notes: [65, 0, 69, 0, 72, 0, 69, 0, 65, 0, 72, 0, 74, -1, 72, 0] },
    ],
  },
  {
    id: 'mushroom-ring',
    bpm: 112,
    step: 0.5,
    voices: [
      { kind: 'pluck', level: 0.45, notes: [62, 0, 0, 67, 0, 0, 69, 0, 0, 67, 0, 0] },
      { kind: 'bell', level: 0.55, notes: [74, 0, 76, 0, 79, 0, 76, 0, 74, 0, 71, 0] },
    ],
  },
  {
    id: 'crystal-shop',
    bpm: 96,
    step: 0.5,
    voices: [
      { kind: 'pluck', level: 0.4, notes: [60, 0, 64, 0, 67, 0, 64, 0, 60, 0, 67, 0, 72, 0, 67, 0] },
      { kind: 'bell', level: 0.55, notes: [79, 0, 0, 76, 0, 0, 72, 0, 76, 0, 0, 79, 0, 0, 84, 0] },
    ],
  },
  {
    id: 'pet-shop',
    bpm: 100,
    step: 0.5,
    voices: [
      { kind: 'pluck', level: 0.65, notes: [67, 0, 71, 74, 0, 71, 67, 0, 69, 0, 72, 0, 74, 0, 67, 0] },
      { kind: 'bell', level: 0.3, notes: [0, 0, 86, 0, 0, 0, 83, 0, 0, 0, 86, 0, 0, 0, 0, 0] },
    ],
  },
  {
    id: 'witch-house',
    bpm: 68,
    step: 0.5,
    voices: [
      { kind: 'hum', level: 0.5, notes: [57, -1, -1, -1, -1, -1, -1, -1, 52, -1, -1, -1, 57, -1, -1, -1] },
      { kind: 'bell', level: 0.32, notes: [69, 0, 0, 0, 72, 0, 0, 0, 64, 0, 0, 0, 69, 0, 0, 0] },
      { kind: 'tap', level: 0.12, notes: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0] },
    ],
  },
  {
    id: 'colouring-nook',
    bpm: 60,
    step: 0.5,
    voices: [
      { kind: 'pad', level: 0.6, tones: [53, 60, 65] },
      { kind: 'bell', level: 0.22, notes: [77, 0, 0, 0, 0, 0, 0, 0, 72, 0, 0, 0, 0, 0, 0, 0] },
    ],
  },
  {
    id: 'story',
    bpm: 56,
    step: 0.5,
    voices: [
      { kind: 'pad', level: 0.35, tones: [55, 62] },
      { kind: 'pluck', level: 0.35, notes: [67, 0, 0, 0, 71, 0, 0, 0, 74, 0, 0, 0, 71, 0, 0, 0] },
    ],
  },
  {
    id: 'bedtime',
    bpm: 48,
    step: 1,
    voices: [
      { kind: 'pad', level: 0.4, tones: [52, 59] },
      { kind: 'bell', level: 0.18, notes: [76, 0, 0, 0, 72, 0, 0, 0] },
    ],
  },
];

const BY_ID = new Map(PLACES.map((score) => [score.id, score]));

export const MUSIC_IDS = PLACES.map((score) => score.id);

export function scoreById(id: MusicId): Score {
  return BY_ID.get(id) ?? PLACES[0]!;
}

export function allScores(): Score[] {
  return PLACES;
}

/** Longest stepped voice, so every part of a loop ends together. */
export function loopSteps(score: Score): number {
  return score.voices.reduce((longest, voice) => Math.max(longest, voice.notes?.length ?? 0), 0);
}
