import { petById, type PetState } from './catalog.ts';
import type { Progress } from '../progress/types.ts';

/** Correct spells with this friend walking beside her. */
export const GROWING_AT = 4;
export const GROWN_AT = 10;

const PAINTED: Record<string, Partial<Record<1 | 2, string>>> = {
  'baby-dragon': { 1: 'baby-dragon-grow', 2: 'baby-dragon-grown' },
  'unicorn-foal': { 2: 'unicorn-foal-grown' },
  'cloud-cat': { 2: 'cloud-cat-grown' },
};

export const STAGE_WORD = ['Little', 'Growing', 'Grown'] as const;

export function solvedCount(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) return 0;
  return Math.min(9999, Math.floor(value));
}

/** 0 little, 1 growing, 2 grown. */
export function petStage(solved: number): 0 | 1 | 2 {
  const count = solvedCount(solved);
  if (count >= GROWN_AT) return 2;
  if (count >= GROWING_AT) return 1;
  return 0;
}

export function stageOf(pets: PetState, id: string | null | undefined): 0 | 1 | 2 {
  if (!id) return 0;
  const owned = pets.owned.find((pet) => pet.id === id);
  return petStage(solvedCount(owned?.solved));
}

/** Painted file when we have one. Otherwise the original sticker, scaled in its frame. */
export function petArtFile(id: string, stage: number): { file: string; painted: boolean } {
  const painted = stage === 1 || stage === 2 ? PAINTED[id]?.[stage] : undefined;
  return painted ? { file: painted, painted: true } : { file: id, painted: false };
}

function spellsToGrow(solved: number): string {
  const count = solvedCount(solved);
  const goal = petStage(count) === 0 ? GROWING_AT : GROWN_AT;
  const left = Math.max(1, goal - count);
  return left === 1 ? '1 more spell to grow' : `${left} more spells to grow`;
}

export function growthCaption(solved: number, walking: boolean): string {
  const stage = petStage(solved);
  const word = STAGE_WORD[stage];
  if (!walking) return `${word}. Bring them along.`;
  if (stage === 2) return 'Grown';
  return `${word} · ${spellsToGrow(solved)}`;
}

export function growthSpeech(name: string, before: number, after: number): string | null {
  const from = petStage(before);
  const to = petStage(after);
  if (to === from) return null;
  if (to === 2) return `${name} grew up.`;
  return `${name} is growing.`;
}

/** One correct spell with the walking friend. A miss, a hop, or no friend does nothing. */
export function growNearby(progress: Progress): { progress: Progress; speech: string | null } {
  const id = progress.pets?.companionId;
  if (!id) return { progress, speech: null };
  const owned = progress.pets.owned;
  const index = owned.findIndex((pet) => pet.id === id);
  if (index < 0) return { progress, speech: null };
  const current = owned[index];
  if (!current) return { progress, speech: null };
  const before = solvedCount(current.solved);
  const after = before + 1;
  const nextOwned = owned.slice();
  nextOwned[index] = { ...current, solved: after };
  const named = current.name.trim() || petById(id)?.name || 'Your friend';
  return {
    progress: { ...progress, pets: { ...progress.pets, owned: nextOwned } },
    speech: growthSpeech(named, before, after),
  };
}
