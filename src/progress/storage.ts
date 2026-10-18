import { freshProgress, learnerNameFrom, PROGRESS_FORMAT, PROGRESS_KEY, type Progress } from './types.ts';

function isProgress(value: unknown): value is Progress {
  if (!value || typeof value !== 'object') return false;
  const v = value as Partial<Progress>;
  return v.format === PROGRESS_FORMAT && v.taxonomy === 'marble-skill-taxonomy-v1' && !!v.placement && !!v.topics;
}

export function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (!raw) return freshProgress();
    const parsed: unknown = JSON.parse(raw);
    if (!isProgress(parsed)) return freshProgress();
    const learnerName = learnerNameFrom(parsed.learnerName);
    return {
      ...freshProgress(learnerName),
      ...parsed,
      learnerName,
      seenTemplates: parsed.seenTemplates ?? [],
      rewards: parsed.rewards ?? [],
      sessions: parsed.sessions ?? [],
      topics: parsed.topics ?? {},
    };
  } catch {
    return freshProgress();
  }
}

export function saveProgress(progress: Progress): void {
  const next = { ...progress, updatedAt: Date.now() };
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(next));
}

export function parseProgress(raw: string): Progress {
  const parsed: unknown = JSON.parse(raw);
  if (!isProgress(parsed)) {
    throw new Error('That file is not a Spell Garden progress export.');
  }
  return parsed;
}

export { PROGRESS_KEY };
