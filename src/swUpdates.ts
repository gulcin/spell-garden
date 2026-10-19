import { buildInfo } from './version.ts';
import { isLessonInProgress, subscribeLesson } from './updateState.ts';
import { CHECK_INTERVAL_MS, planUpdate, UPDATE_DEFERRED_KEY, type UpdatePlan } from './updates.ts';

type RemoteVersion = { version: string; sha?: string; date?: string };

/** The waiting worker activates, then the page reloads on controllerchange. */
export const SKIP_WAITING = 'SKIP_WAITING';

let registration: ServiceWorkerRegistration | undefined;
let waiting = false;
let applying = false;
let started = false;
const listeners = new Set<() => void>();
const watched = new WeakSet<ServiceWorkerRegistration>();

function emit(): void {
  listeners.forEach((listener) => listener());
}

function deferredFlags(): { deferred: boolean; deferredThisSession: boolean } {
  return {
    deferred: localStorage.getItem(UPDATE_DEFERRED_KEY) === '1',
    deferredThisSession: sessionStorage.getItem(UPDATE_DEFERRED_KEY) === '1',
  };
}

function workerIsWaiting(reg: ServiceWorkerRegistration | undefined): boolean {
  return Boolean(reg?.waiting && navigator.serviceWorker.controller);
}

export function currentUpdatePlan(): UpdatePlan {
  const flags = deferredFlags();
  return planUpdate({
    waiting: waiting || workerIsWaiting(registration),
    lesson: isLessonInProgress(),
    deferred: flags.deferred,
    deferredThisSession: flags.deferredThisSession,
    applying,
  });
}

export function subscribeUpdates(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** She has seen the banner. The next launch can bring the spell in if she leaves it. */
function markDeferred(): void {
  const already = localStorage.getItem(UPDATE_DEFERRED_KEY) === '1' && sessionStorage.getItem(UPDATE_DEFERRED_KEY) === '1';
  localStorage.setItem(UPDATE_DEFERRED_KEY, '1');
  sessionStorage.setItem(UPDATE_DEFERRED_KEY, '1');
  if (!already) emit();
}

function clearDeferred(): void {
  localStorage.removeItem(UPDATE_DEFERRED_KEY);
  sessionStorage.removeItem(UPDATE_DEFERRED_KEY);
  emit();
}

export function noteUpdatePlan(plan: UpdatePlan): void {
  if (plan === 'banner') markDeferred();
  if (plan === 'apply') applyUpdate();
}

export function applyUpdate(): void {
  if (applying) return;
  applying = true;
  clearDeferred();
  emit();
  const worker = registration?.waiting ?? registration?.installing;
  worker?.postMessage(SKIP_WAITING);
}

/** A query the Pages CDN has not stored, so version.json cannot stay stale. */
export function versionJsonUrl(base = import.meta.env.BASE_URL, now = Date.now()): string {
  return `${base}version.json?t=${now}`;
}

/** Stable script path plus the version, so a cached sw.js URL is not reused for the next spell. */
export function serviceWorkerScript(base: string, token: string): string {
  return `${base}sw.js?v=${encodeURIComponent(token)}`;
}

export async function fetchRemoteVersion(): Promise<RemoteVersion | null> {
  try {
    const response = await fetch(versionJsonUrl(), { cache: 'no-store' });
    if (!response.ok) return null;
    const data = (await response.json()) as RemoteVersion;
    if (!data || typeof data.version !== 'string') return null;
    return data;
  } catch {
    return null;
  }
}

function markWaiting(): void {
  if (waiting) return;
  waiting = true;
  emit();
}

const armed = new WeakSet<ServiceWorker>();

/** updatefound can fire before register() resolves, so watch the worker that is already installing. */
function armWorker(worker: ServiceWorker | null): void {
  if (!worker) return;
  const note = () => {
    if (worker.state === 'installed' && navigator.serviceWorker.controller) markWaiting();
  };
  if (armed.has(worker)) {
    note();
    return;
  }
  armed.add(worker);
  note();
  worker.addEventListener('statechange', note);
}

function watchRegistration(reg: ServiceWorkerRegistration): void {
  registration = reg;
  armWorker(reg.installing);
  armWorker(reg.waiting);
  if (watched.has(reg)) return;
  watched.add(reg);
  reg.addEventListener('updatefound', () => {
    armWorker(reg.installing);
  });
}

function registerScript(token: string): Promise<ServiceWorkerRegistration> {
  const base = import.meta.env.BASE_URL;
  const scope = base.startsWith('/') ? base : undefined;
  return navigator.serviceWorker.register(serviceWorkerScript(base, token), { scope, updateViaCache: 'none' });
}

export async function lookForUpdate(): Promise<RemoteVersion | null> {
  const remote = await fetchRemoteVersion();
  try {
    if (remote && remote.version !== buildInfo.version) {
      watchRegistration(await registerScript(remote.version));
    }
    if (registration) await registration.update();
    if (registration) armWorker(registration.installing ?? registration.waiting);
  } catch {
    return remote;
  }
  return remote;
}

export async function checkForUpdates(): Promise<string> {
  const remote = await lookForUpdate().catch(() => null);
  if (!remote && !registration) return "Couldn't look just now. Try again in a little while.";
  if (registration?.waiting || registration?.installing || waiting) return 'A new spell is ready!';
  if (remote && remote.version !== buildInfo.version) return 'A new spell is ready!';
  if (remote && remote.version === buildInfo.version) clearDeferred();
  if (!registration) return 'Updates arrive once Spell Garden is on the home screen.';
  return 'Spell Garden is up to date.';
}

export function startUpdateChecks(): void {
  if (started || !import.meta.env.PROD || !('serviceWorker' in navigator)) return;
  started = true;
  void registerScript(buildInfo.version)
    .then((reg) => {
      watchRegistration(reg);
      const look = () => {
        void lookForUpdate();
      };
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') look();
      });
      window.setInterval(look, CHECK_INTERVAL_MS);
      look();
    })
    .catch(() => {
      /* Offline support is best-effort if the host blocks workers. */
    });
  let reloading = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!applying || reloading) return;
    let count = 0;
    try {
      count = Number(sessionStorage.getItem('spell-garden.swReloads') || '0');
    } catch {
      return;
    }
    if (count >= 1) return;
    reloading = true;
    try {
      sessionStorage.setItem('spell-garden.swReloads', '1');
    } catch {
      /* A private mode that refuses sessionStorage still gets this one reload. */
    }
    window.location.reload();
  });
  subscribeLesson(() => emit());
}
