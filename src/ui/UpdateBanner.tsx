import { useEffect, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
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
  return createPortal(
    <aside className="update-banner" data-testid="update-banner" role="status">
      <p>A new spell is ready! ✨</p>
      <button type="button" className="btn gold update-go" data-testid="update-apply" onClick={applyUpdate}>
        Update
      </button>
    </aside>,
    document.body,
  );
}
