// The snapshot cache's IndexedDB read (cache.ts) begun at the app's start: hooks.client.ts runs `readEarly` as the
// entry's modules evaluate, before the root layout's chunks run and AppShell mounts, so the read (perf.boot `data`:
// p50 242 / p95 609 ms on the phones, 11-24) overlaps the rest of the JS's evaluation and the hydration. cache.ts's
// loadCache takes it once (`takeEarly`): its records, and its connection kept as cache.ts's own. Any failure here
// resolves null and loadCache reads as before (and reports the storage problem). Nothing imported: the bare pages'
// first load carries this file too. Handed over on the window (`__islandCache`), not by an import: imported by
// cache.ts too, this file was a first-load chunk of its own (+0.5 KB gz with its import map entry).

/** cache.ts's database, store and meta record. */
const DB_NAME = 'island', STORE = 'cache', META = 'meta';

/** The connection and the store's records: the meta, every key, every value (null: the read failed). */
export type EarlyRead = { db: IDBDatabase; all: [unknown, IDBValidKey[], unknown[]] | null };
type W = { __islandCache?: Promise<EarlyRead | null> | null };

/** Open the cache's database and read its store whole, once a page (a second call does nothing). */
export function readEarly(idb: IDBFactory | null = typeof indexedDB !== 'undefined' ? indexedDB : null): void {
  const w = globalThis as W;
  if (w.__islandCache || !idb) return;
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
