import { COLOURING_DB } from '../colouring/store.ts';
import { REPORTS_DB, REPORTS_KEY, REPORTS_QUEUE_KEY } from '../feedback/reports.ts';
import { UPDATE_DEFERRED_KEY } from '../updates.ts';
import { SEEN_VERSION_KEY } from '../version.ts';
import { PROGRESS_KEY, PROGRESS_SCHEMA, type Progress } from './types.ts';

/**
 * Names that every update keeps. A new spell may add fields inside the save.
 * It does not move the garden to a new localStorage or IndexedDB name.
 */
export const STABLE_STORES = {
  progress: PROGRESS_KEY,
  reports: REPORTS_KEY,
  reportsQueue: REPORTS_QUEUE_KEY,
  seenVersion: SEEN_VERSION_KEY,
  updateDeferred: UPDATE_DEFERRED_KEY,
  reportsDb: REPORTS_DB,
  colouringDb: COLOURING_DB,
} as const;

export type ProgressMigration = {
  to: number;
  name: string;
  run: (progress: Progress) => Progress;
};

/** Append a step when the save shape grows. Never rename STABLE_STORES. */
export function progressMigrations(fill: (progress: Progress) => Progress): ProgressMigration[] {
  return [
    {
      to: 1,
      name: 'fill-purse-wardrobe-stories-house',
      run: fill,
    },
  ];
}

export function migrateStoredProgress(parsed: Progress, fill: (progress: Progress) => Progress): Progress {
  const from = parsed.schema ?? 0;
  let next = fill(parsed);
  for (const step of progressMigrations(fill)) {
    if (from < step.to) next = step.run(next);
  }
  return { ...next, schema: PROGRESS_SCHEMA };
}
