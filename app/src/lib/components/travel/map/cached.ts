// Whether the maps' MapLibre can load offline (docs/backend.md "Service worker" › Offline): the service worker keeps
// its chunk in the shell once a map has drawn. Offline without it the import isn't tried at all (Safari keeps a
// failed dynamic import for the page's life, so the retry once back online would fail too).
const MAP_CHUNK = /\/_app\/immutable\/chunks\/maplibre\./;

export async function engineReady(online = navigator.onLine, store: Pick<CacheStorage, 'keys' | 'open'> | undefined = globalThis.caches): Promise<boolean> {
  if (online) return true;
  if (!store) return false;
  try {
    for (const k of (await store.keys()).filter((k) => k.startsWith('island-shell-')).reverse()) {
      if ((await (await store.open(k)).keys()).some((r) => MAP_CHUNK.test(r.url))) return true;
    }
  } catch {
    /* storage refused */
  }
  return false;
}
