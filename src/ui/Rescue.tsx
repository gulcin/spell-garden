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

type ScreenBoundaryProps = { children: ReactNode; onHome: () => void };

/**
 * A single screen that trips shows a way back to the map.
 * Progress, the service worker, and the caches stay as they are.
 */
export class ScreenBoundary extends Component<ScreenBoundaryProps, BoundaryState> {
  state: BoundaryState = { error: false };

  static getDerivedStateFromError(): BoundaryState {
    return { error: true };
  }

  render() {
    if (!this.state.error) return this.props.children;
    const mark = `${import.meta.env.BASE_URL}art/map-mark.webp`;
    return (
      <div className="spell-oops" role="alert" data-testid="screen-oops">
        <div>
          <h1>Oops</h1>
          <p>Back to the garden. Your garden is still saved.</p>
          <button
            type="button"
            className="map-home"
            data-testid="oops-map"
            onClick={() => {
              this.setState({ error: false });
              this.props.onHome();
            }}
          >
            <img src={mark} alt="" />
            <span>Garden map</span>
          </button>
        </div>
      </div>
    );
  }
}

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
