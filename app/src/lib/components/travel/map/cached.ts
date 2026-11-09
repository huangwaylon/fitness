// Whether the maps' MapLibre can load offline (docs/backend.md "Service worker" › Offline): the service worker keeps
// its chunk in the shell once a map has drawn. Offline without it the import isn't tried at all (Safari keeps a
// failed dynamic import for the page's life, so the retry once back online would fail too).
// mapLoader: the trip's and the trail's maps load their engine the same way.
import { hooksOn } from '#lib/ui-state/preview.ts';

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

export interface MapLoader {
  /** Load the engine and make the map (the retry button too). */
  draw(): void;
  /** In onMount: drawn now (not for the e2e's stub), again once back online after a failure, `view` the specs' window[name]
   *  (hooks on). Returns the teardown. */
  start(stub: boolean, name: string, view: unknown): () => void;
}

/** A map's engine chunk loaded (offline: only if the service worker holds it, engineReady), then `make` (no WebGL, or it
 *  throws: 'failed'); 'failed' till the phone is back online (then drawn by itself) or the retry is tapped. */
export function mapLoader<E>(load: () => Promise<E>, make: (engine: E) => void, mode: { set(m: 'loading' | 'failed'): void; failed(): boolean }): MapLoader {
  let gone = false;
  function draw() {
    mode.set('loading');
    engineReady().then((ok) => (ok ? load() : Promise.reject(new Error('offline')))).then(
      (e) => {
        if (gone) return;
        try {
          make(e);
        } catch (err) {
          console.error(err); // no WebGL (or a bug: the drawn smoke fails on it)
          mode.set('failed');
        }
      },
      () => !gone && mode.set('failed')
    );
  }
  return {
    draw,
    start(stub, name, view) {
      const back = () => mode.failed() && draw();
      if (!stub) (draw(), addEventListener('online', back));
      const w = window as unknown as Record<string, unknown>;
      if (hooksOn(new URLSearchParams(location.search))) w[name] = view;
      return () => {
        gone = true;
        removeEventListener('online', back);
        if (w[name] === view) delete w[name];
      };
    }
  };
}
