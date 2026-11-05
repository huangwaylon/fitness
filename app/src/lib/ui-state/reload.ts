// Stale-build recovery: after a deploy, a PWA left resident still runs the old build. Its lazy chunks
// (きろく, the harvest) can 404, and a remembered rejected import() would fail forever. A failed chunk load forgets
// the import and reloads once (into the new build; Safari also keeps a failed import for the page's life, so only a
// reload retries it); a detected new version reloads when nothing is open. Not on a page that is leaving: Safari fails
// every load of a page navigating away, and the reload then took the navigation over (back to this page). Leaving, a
// fetch fails too, so a chunk failure reloads only once one more request gets through.
// The send queue and the key live in storage, so a reload loses nothing but an open sheet.

import { log, persistLog } from '#lib/sync/log.ts';

const KEY = 'island.reloadAt';
/** One automatic reload per this window: a build that still fails after reloading shows its error instead of looping. */
export const RELOAD_WINDOW_MS = 30_000;

/** Reloads the page unless it already reloaded itself in the last RELOAD_WINDOW_MS. Returns whether it did. `why`: the
 *  log's `app.reload` (written before the page goes: a reload fires no hidden event). */
export function safeReload(now = Date.now(), why: 'update' | 'chunk' | 'other' = 'other'): boolean {
  try {
    if (now - Number(sessionStorage.getItem(KEY) ?? 0) < RELOAD_WINDOW_MS) return false;
    sessionStorage.setItem(KEY, String(now));
  } catch {
    return false; // no storage: no loop guard, so no automatic reload
  }
  log('app.reload', { why });
  persistLog();
  location.reload();
  return true;
}

/** How long a deploy's reload waits for its service worker (installing the new build's chunks) before reloading anyway. */
const WORKER_WAIT_MS = 15_000;

const waits = new WeakMap<ServiceWorkerContainer, Promise<void>>();
/**
 * A new deploy seen: resolves once the page's service worker is the new build's, so the reload is served its shell (the
 * worker serves navigations from its own cache first: service-worker/index.ts). Asks for the update (a deploy changes
 * the worker), waits for the new one to install, skip waiting and claim the page (`controllerchange`), at most
 * `waitMs`. At once with no worker in control (a first visit, the e2e) or when it is already the newest. Once a page.
 */
export function newWorker(sw: ServiceWorkerContainer | undefined = globalThis.navigator?.serviceWorker, waitMs = WORKER_WAIT_MS): Promise<void> {
  if (!sw?.controller) return Promise.resolve();
  let w = waits.get(sw);
  if (!w) {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const late = new Promise<void>((ok) => (timer = setTimeout(ok, waitMs)));
    // (the whole of it bounded: an update() queued behind another worker's install waits for it)
    const ready = (async () => {
      const reg = await sw.getRegistration().catch(() => undefined);
      if (!reg) return;
      const changed = new Promise<void>((ok) => sw.addEventListener('controllerchange', () => ok(), { once: true }));
      await reg.update().catch(() => {});
      if (reg.installing || reg.waiting) await changed;
    })();
    waits.set(sw, (w = Promise.race([ready, late]).finally(() => clearTimeout(timer))));
  }
  return w;
}

/** Whether this page still reaches the site (false on a page that is leaving, or offline). */
async function reachable(): Promise<boolean> {
  const { resolve } = await import('$app/paths');
  await fetch(`${resolve('/')}_app/version.json`, { cache: 'no-store' });
  return true;
}

/** A chunk failed to load: reload once, unless the page is leaving (or offline: the next open retries). */
export async function reloadUnlessLeaving(alive: () => Promise<boolean> = reachable): Promise<boolean> {
  if (!(await alive().catch(() => false))) return false;
  // (a stale build's chunk: into the new build's worker first, as a deploy's reload)
  await newWorker();
  return safeReload(Date.now(), 'chunk');
}

/** A memoised lazy import that forgets a failed load (the next open retries) and reloads once (reloadUnlessLeaving). */
export function lazy<T>(load: () => Promise<T>, alive?: () => Promise<boolean>): () => Promise<T> {
  let mod: Promise<T> | null = null;
  return () =>
    (mod ??= load().catch((e: unknown) => {
      mod = null;
      void reloadUnlessLeaving(alive);
      throw e;
    }));
}
