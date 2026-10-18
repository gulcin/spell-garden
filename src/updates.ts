/** Separate from lesson progress. Progress stays in `prague.wizard-math.progress.v1`. */
export const UPDATE_DEFERRED_KEY = 'spell-garden.updateDeferred';

/** Look again half an hour after the last check, and also on launch and when the app is shown. */
export const CHECK_INTERVAL_MS = 30 * 60 * 1000;

export type UpdatePlan = 'idle' | 'banner' | 'defer' | 'apply';

/** A lesson keeps going. The banner waits until she is back on the garden map. */
export function planUpdate(input: {
  waiting: boolean;
  lesson: boolean;
  deferred: boolean;
  deferredThisSession: boolean;
  applying: boolean;
}): UpdatePlan {
  if (input.applying || !input.waiting) return 'idle';
  if (input.lesson) return 'defer';
  if (input.deferred && !input.deferredThisSession) return 'apply';
  if (input.deferred) return 'idle';
  return 'banner';
}
