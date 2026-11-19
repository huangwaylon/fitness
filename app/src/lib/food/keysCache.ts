// A dataset's search keys as the parsing worker built them (dataset.worker.ts: search.ts keysOf, joined by a space),
// kept in IndexedDB for the next open: read back (one string a file, ~1-2 ms) instead of built again (the core's ~10 ms
// in WebKit on a Mac, the products' ~26, the chain menus' ~60; a phone ~2-3×). One record a data file, by its path:
// written under its `?v=` and the worker's own build (its hashed URL: a change to how keys are built misses), so a new
// version of the file, or of the code, misses and is written over. Never needed: no IndexedDB, an error, a record that
// isn't whole (its count off), or one slower than WAIT_MS, and the keys are built as before (in silence: the worker
// has no log).
const DB_NAME = 'island-food-keys', STORE = 'keys';
/** A read or a write waited for at most (an IndexedDB that hangs: built, or the load goes on, never stuck behind it). */
export const WAIT_MS = 1000;

type Kept = { v: string; n: number; keys: string };

let idb: IDBFactory | null = typeof indexedDB !== 'undefined' ? indexedDB : null;
let db: Promise<IDBDatabase | null> | null = null;

/** Tests: swap IndexedDB (`fake-indexeddb`). */
export function configureKeysCache(o: { indexedDB: IDBFactory | null }): void {
  idb = o.indexedDB;
  db = null;
}

function open(): Promise<IDBDatabase | null> {
  db ??= new Promise<IDBDatabase | null>((ok) => {
    if (!idb) return ok(null);
    try {
      const r = idb.open(DB_NAME, 1);
      r.onupgradeneeded = () => r.result.createObjectStore(STORE);
      r.onsuccess = () => {
        const d = r.result;
        d.onversionchange = () => (d.close(), (db = null));
        ok(d);
      };
      r.onerror = r.onblocked = () => ok(null);
    } catch {
      ok(null);
    }
  });
  return db;
}

/** The database opened ahead (the worker's start: under its first fetch). */
export const openKeys = (): void => void open();

const within = <T>(p: Promise<T>, none: T): Promise<T> => {
  let t: ReturnType<typeof setTimeout> | undefined;
  return Promise.race([p, new Promise<T>((ok) => (t = setTimeout(ok, WAIT_MS, none)))]).finally(() => clearTimeout(t));
};

/** `path`'s `n` items' keys kept under `v`, in order; null when none are (another version's, not whole, an error). */
export function readKeys(path: string, v: string, n: number): Promise<string[] | null> {
  return within((async () => {
    const d = await open();
    if (!d) return null;
    const rec = await new Promise<unknown>((ok) => {
      const r = d.transaction(STORE, 'readonly').objectStore(STORE).get(path);
      r.onsuccess = () => ok(r.result);
      r.onerror = () => ok(null);
    });
    const k = rec as Partial<Kept> | null | undefined;
    if (!k || k.v !== v || k.n !== n || typeof k.keys !== 'string') return null;
    const keys = n ? k.keys.split('\n') : [];
    return keys.length === n ? keys : null;
  })().catch(() => null), null);
}

/** `path`'s keys kept under `v` (its record written over); resolves once written, or failed (full, unavailable: built
 *  next time). Never rejects. */
export function writeKeys(path: string, v: string, keys: readonly string[]): Promise<void> {
  return within((async () => {
    const d = await open();
    if (!d) return;
    await new Promise<void>((ok) => {
      const t = d.transaction(STORE, 'readwrite');
      t.objectStore(STORE).put({ v, n: keys.length, keys: keys.join('\n') } satisfies Kept, path);
      t.oncomplete = t.onerror = t.onabort = () => ok();
    });
  })().catch(() => {}), undefined);
}
