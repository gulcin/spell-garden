import { Component, type ReactNode } from 'react';

/** Clears the stuck service worker and its caches. Progress stays in localStorage. */
export function startAgain(): Promise<void> {
  const registrations = 'serviceWorker' in navigator ? navigator.serviceWorker.getRegistrations() : Promise.resolve([]);
  return registrations
    .then((regs) => Promise.all(regs.map((reg) => reg.unregister())))
    .then(() => ('caches' in window ? caches.keys() : Promise.resolve([])))
    .then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
    .then(() => {
      try {
        sessionStorage.removeItem('spell-garden.swReloads');
        sessionStorage.removeItem('spell-garden.bootReloads');
      } catch {
        /* Session storage is optional. The caches are already gone. */
      }
      const next = new URL(window.location.href);
      next.searchParams.delete('spell-fresh');
      next.searchParams.set('spell-fresh', String(Date.now()));
      window.location.replace(next.href);
    });
}

type BoundaryState = { error: boolean };

/** Runtime crashes get the same fresh start as a shell that never loaded. */
export class GardenBoundary extends Component<{ children: ReactNode }, BoundaryState> {
  state: BoundaryState = { error: false };

  static getDerivedStateFromError(): BoundaryState {
    return { error: true };
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="spell-rescue" id="spell-rescue" role="alert">
        <div>
          <h1>Spell Garden needs a fresh start</h1>
          <p>Your garden is still saved on this phone.</p>
          <button type="button" className="btn gold" data-testid="start-again" onClick={() => void startAgain()}>
            Start again
          </button>
        </div>
      </div>
    );
  }
}
