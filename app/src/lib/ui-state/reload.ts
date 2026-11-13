// Stale-build recovery: after a deploy, a PWA left resident still runs the old build. Its lazy chunks
// (きろく, the harvest) can 404, and a remembered rejected import() would fail forever. A chunk that isn't fetched
// forgets the import and, when the deployed build is a newer one, reloads once into it (Safari also keeps a failed
// import for the page's life, so only a reload retries it); a detected new version reloads when nothing is open. Each
// only once the new build's service worker controls the page, so the reload is its shell, not the old one again. Not
// on a page that is leaving: Safari fails every load of a page navigating away, and the reload then took the
// navigation over (back to this page); leaving, version.json isn't fetched either.
// The send queue and the key live in storage, so a reload loses nothing but an open sheet.

import { version } from '$app/env';
import { leavingNow, log, markLeaving, persistLog } from '#lib/sync/log.ts';
import { quiet } from '#lib/quiet.ts';

const KEY = 'island.reloadAt';
/** One automatic reload per this window: a build that still fails after reloading shows its error instead of looping. */
export const RELOAD_WINDOW_MS = 30_000;

/** Reloads the page unless it already reloaded itself in the last RELOAD_WINDOW_MS. Returns whether it did. `why`: the
 *  log's `app.reload` (written before the page goes: a reload fires no hidden event). */
export function safeReload(now = Date.now(), why: Why = 'other'): boolean {
  try {
    if (now - Number(sessionStorage.getItem(KEY) ?? 0) < RELOAD_WINDOW_MS) return false;
    sessionStorage.setItem(KEY, String(now));
  } catch {
    return false; // no storage: no loop guard, so no automatic reload
  }
  reloadNow(why);
  return true;
}

type Why = 'update' | 'launch' | 'chunk' | 'mic' | 'other';
/** The page reloaded now, no loop guard (a tap's: a refused mic's 「もう一度試す」, lib/mic/retry.ts), `why` logged first. */
export function reloadNow(why: Why): void {
  log('app.reload', { why });
  persistLog();
  markLeaving();
  location.reload();
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
      // (every listener goes with the ask, whatever its end: one left per failed ask, an offline one, kept its promise)
      const ask = new AbortController(), signal = ask.signal;
      try {
        const changed = new Promise<boolean>((ok) => sw.addEventListener('controllerchange', () => ok(true), { once: true, signal }));
        try {
          await reg.update();
        } catch {
          return false;
        }
        let next = reg.installing ?? reg.waiting;
        if (!next) return true;
        const redundant = (w: ServiceWorker) =>
          new Promise<false>((ok) => {
            const gone = () => w.state === 'redundant' && ok(false);
            w.addEventListener('statechange', gone, { signal });
            gone();
          });
        // (one gone redundant for a newer one, a deploy landing during its install: that one's waited for)
        for (;;) {
          if (await Promise.race([changed, redundant(next)])) return true;
          const after = reg.installing ?? reg.waiting;
          if (!after || after === next) return false;
          next = after;
        }
      } finally {
        ask.abort();
      }
    })();
    waits.set(sw, (w = mine));
    void mine.then((ok) => {
      if (!ok && waits.get(sw) === mine) waits.delete(sw);
    });
  }
  return w;
}

/** The deployed build's version (Kit's _app/version.json, past every cache), or null when the site can't be asked (a
 *  page that is leaving, offline). */
async function deployed(): Promise<string | null> {
  const { resolve } = await import('$app/paths');
  const res = await fetch(`${resolve('/')}_app/version.json`, { cache: 'no-store' });
  if (!res.ok) return null;
  const v = ((await res.json()) as { version?: unknown }).version;
  return typeof v === 'string' ? v : null;
}

/** Whether a failed import is its file not fetched (a chunk a deploy removed, the network gone), not a module that
 *  threw as it ran (a reload doesn't cure that): the browsers' TypeErrors for a module script that didn't load
 *  (Chrome "Failed to fetch dynamically imported module", Safari "Importing a module script failed.", Firefox "error
 *  loading dynamically imported module") and Vite's preload helper's for a chunk's CSS. */
export function isChunkError(e: unknown): boolean {
  const m = e instanceof Error ? e.message : '';
  return (e instanceof TypeError && /dynamically imported module|importing a module script|module script failed/i.test(m)) || /^Unable to preload CSS/.test(m);
}

/** sessionStorage: the deployed version a chunk's failure last reloaded the page for (one reload a build). */
const CHUNK_KEY = 'island.chunkReloadFor';

/**
 * A chunk failed to load: reload into the deployed build, once, and only if it isn't this one (a reload into the very
 * build whose chunk fails cures nothing: it reloaded on every failure, forever). Not on a page that is leaving or
 * offline (version.json not fetched: the next open retries), not before the new build's worker controls the page
 * (newWorker: else the reload is the old build's cached shell again), and once a deployed version a session.
 */
export async function reloadUnlessLeaving(deployedNow: () => Promise<string | null> = deployed, running: string = version): Promise<boolean> {
  // (leaving, the ask dies with the page: it only counted swallow:reload.version, ~4 a launch's reload)
  if (leavingNow()) return false;
  const v = await quiet(deployedNow(), 'reload.version', null);
  if (!v || v === running) return false;
  try {
    if (sessionStorage.getItem(CHUNK_KEY) === v) return false;
  } catch {
    return false;
  }
  if (!(await newWorker())) return false;
  try {
    sessionStorage.setItem(CHUNK_KEY, v);
  } catch {
    return false;
  }
  return safeReload(Date.now(), 'chunk');
}

/** A tap on 「アプリを こうしんしてね」 (a ききみみ invite of newer content than this build's): into the deployed build,
 *  once its worker controls the page (newWorker), through safeReload's loop guard. */
export async function reloadForUpdate(): Promise<boolean> {
  return (await newWorker()) && safeReload(Date.now(), 'update');
}

/** A memoised lazy import that forgets a failed load (the next call retries) and, for a chunk not fetched, reloads
 *  into a newer deployed build (reloadUnlessLeaving). `quiet`: a prefetch ahead of any tap (sheetChunks), whose
 *  failure never reloads the page under the player: the tap's own load reports it. */
export function lazy<T>(load: () => Promise<T>, deployedNow?: () => Promise<string | null>): (quiet?: boolean) => Promise<T> {
  let mod: Promise<T> | null = null;
  return (quiet = false) =>
    (mod ??= load().catch((e: unknown) => {
      mod = null;
      if (isChunkError(e) && !quiet) void reloadUnlessLeaving(deployedNow);
      throw e;
    }));
}
