// The snapshot cache's IndexedDB read (cache.ts) begun at the app's start: hooks.client.ts imports this as the entry's
// modules evaluate (a paired phone, not a bare page), before the root layout's chunks run and AppShell mounts, so the
// read (perf.boot `data`: p50 242 / p95 609 ms on the phones, 11-24) overlaps the rest of the JS's evaluation and the
// hydration. cache.ts's loadCache takes it once (`takeEarly`): its records, and its connection kept as cache.ts's own.
// Any failure here resolves null and loadCache reads as before (and reports the storage problem). Handed over on the
// window (`__islandCache`), not by an import: cache.ts is first-load, this file isn't (no first-load bytes).

/** cache.ts's database, store and meta record. */
const DB_NAME = 'island', STORE = 'cache', META = 'meta';

/** The connection and the store's records: the meta, every key, every value (null: the read failed). */
export type EarlyRead = { db: IDBDatabase; all: [unknown, IDBValidKey[], unknown[]] | null };
type W = { __islandCache?: Promise<EarlyRead | null> | null };

/** Open the cache's database and read its store whole, once a page (a second call does nothing). */
export function readEarly(idb: IDBFactory | null = typeof indexedDB !== 'undefined' ? indexedDB : null): void {
  const w = globalThis as W;
  if (w.__islandCache || !idb) return;
  // (and, as early, whether a deploy's new worker installs beside this launch: perf.boot `swi`, ui-state/launchSw.ts)
  watchLaunchSw();
  w.__islandCache = new Promise<EarlyRead | null>((ok) => {
    try {
      const r = idb.open(DB_NAME, 1);
      r.onupgradeneeded = () => r.result.createObjectStore(STORE);
      r.onerror = () => ok(null);
      r.onblocked = () => ok(null);
      r.onsuccess = () => {
        const db = r.result;
        try {
          const t = db.transaction(STORE, 'readonly'), s = t.objectStore(STORE);
          const m = s.get(META), k = s.getAllKeys(), v = s.getAll();
          t.oncomplete = () => ok({ db, all: [m.result, k.result, v.result] });
          t.onerror = t.onabort = () => ok({ db, all: null });
        } catch {
          ok({ db, all: null });
        }
      };
    } catch {
      ok(null);
    }
  });
}

/** A deploy's new worker beside the launch, as ui-state/launchSw.ts reads it off the window (`__islandSw`): `inst`
 *  installing or `wait` installed at the watch's start, `found` one that began installing during it (`ms`: when, since
 *  the navigation's start). Here, not there: launchSw.ts is world3d/boot.ts's (first-load), this file isn't. */
export type SwSeen = { swi: 'inst' | 'wait' | 'found'; ms?: number };
export function watchLaunchSw(sw: ServiceWorkerContainer | undefined = globalThis.navigator?.serviceWorker): void {
  const w = globalThis as { __islandSw?: SwSeen };
  sw?.getRegistration().then((r) => {
    if (!r) return;
    if (r.installing || r.waiting) w.__islandSw ??= { swi: r.installing ? 'inst' : 'wait' };
    r.addEventListener('updatefound', () => void (w.__islandSw ??= { swi: 'found', ms: Math.round(performance.now()) }), { once: true });
  }, () => {});
}
