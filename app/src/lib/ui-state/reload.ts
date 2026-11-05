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

const waits = new WeakMap<ServiceWorkerContainer, Promise<boolean>>();
/**
 * A new deploy seen: resolves true once the page's service worker is the new build's, so a reload is served its shell
 * (the worker serves navigations from its own cache first: service-worker/index.ts). Asks for the update (a deploy
 * changes the worker) and waits for the new one to install, skip waiting and claim the page (`controllerchange`),
 * however long its install takes: a reload before it would be served the old build's cached shell again. False when
 * it can't be had now (offline, its script not fetched, its install failed): no reload, and the next call asks again
 * (the next time the app comes to the front). True at once with no worker in control (a first visit, the e2e: the
 * reload goes to the network) or when the worker in control is already the newest. One ask in flight a page.
 */
export function newWorker(sw: ServiceWorkerContainer | undefined = globalThis.navigator?.serviceWorker): Promise<boolean> {
  if (!sw?.controller) return Promise.resolve(true);
  let w = waits.get(sw);
  if (!w) {
    const mine = (async () => {
      const reg = await sw.getRegistration().catch(() => undefined);
      if (!reg) return false;
      const changed = new Promise<boolean>((ok) => sw.addEventListener('controllerchange', () => ok(true), { once: true }));
      try {
        await reg.update();
      } catch {
        return false;
      }
      const next = reg.installing ?? reg.waiting;
      if (!next) return true;
      const failed = new Promise<boolean>((ok) => {
        const gone = () => next.state === 'redundant' && ok(false);
        next.addEventListener('statechange', gone);
        gone();
      });
      return Promise.race([changed, failed]);
    })();
    waits.set(sw, (w = mine));
    void mine.then((ok) => {
      if (!ok && waits.get(sw) === mine) waits.delete(sw);
    });
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
  // (a stale build's chunk: into the new build's worker first, as a deploy's reload; none till it's in)
  if (!(await newWorker())) return false;
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
