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

/** Whether this page still reaches the site (false on a page that is leaving, or offline). */
async function reachable(): Promise<boolean> {
  const { resolve } = await import('$app/paths');
  await fetch(`${resolve('/')}_app/version.json`, { cache: 'no-store' });
  return true;
}

/** A chunk failed to load: reload once, unless the page is leaving (or offline: the next open retries). */
export async function reloadUnlessLeaving(alive: () => Promise<boolean> = reachable): Promise<boolean> {
  return (await alive().catch(() => false)) && safeReload(Date.now(), 'chunk');
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
