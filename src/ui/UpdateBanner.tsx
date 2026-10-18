import { useEffect, useSyncExternalStore } from 'react';
import { subscribeLesson } from '../updateState.ts';
import { applyUpdate, currentUpdatePlan, noteUpdatePlan, subscribeUpdates } from '../swUpdates.ts';

function subscribe(listener: () => void): () => void {
  const stopUpdates = subscribeUpdates(listener);
  const stopLesson = subscribeLesson(listener);
  return () => {
    stopUpdates();
    stopLesson();
  };
}

export function UpdateBanner() {
  const plan = useSyncExternalStore(subscribe, currentUpdatePlan, () => 'idle' as const);
  useEffect(() => {
    noteUpdatePlan(plan);
  }, [plan]);
  if (plan !== 'banner') return null;
  return (
    <aside className="update-banner" data-testid="update-banner" role="status">
      <p>Spell Garden learned something new!</p>
      <button type="button" className="btn gold" data-testid="update-apply" onClick={applyUpdate}>
        Update
      </button>
    </aside>
  );
}
