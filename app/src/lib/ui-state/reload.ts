// Stale-build recovery: after a deploy, a PWA left resident still runs the old build. Its lazy chunks
// (きろく, the harvest) can 404, and a remembered rejected import() would fail forever. A failed chunk load forgets
// the import and reloads once into the new build; a detected new version reloads when nothing is open.
// The send queue and the key live in storage, so a reload loses nothing but an open sheet.

const KEY = 'island.reloadAt';
/** One automatic reload per this window: a build that still fails after reloading shows its error instead of looping. */
export const RELOAD_WINDOW_MS = 30_000;

/** Reloads the page unless it already reloaded itself in the last RELOAD_WINDOW_MS. Returns whether it did. */
export function safeReload(now = Date.now()): boolean {
  try {
    if (now - Number(sessionStorage.getItem(KEY) ?? 0) < RELOAD_WINDOW_MS) return false;
    sessionStorage.setItem(KEY, String(now));
  } catch {
    return false; // no storage: no loop guard, so no automatic reload
  }
  location.reload();
  return true;
}

/** A memoised lazy import that forgets a failed load (the next open retries) and reloads once into the new build. */
export function lazy<T>(load: () => Promise<T>): () => Promise<T> {
  let mod: Promise<T> | null = null;
  return () =>
    (mod ??= load().catch((e: unknown) => {
      mod = null;
      safeReload();
      throw e;
    }));
}
