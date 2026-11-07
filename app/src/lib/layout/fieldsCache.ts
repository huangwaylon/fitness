// The ground's fields and chunks as the worker made them (fieldsPrime.ts, fields.worker.ts), kept in IndexedDB for the
// next launch (docs/perf-plan.md A2): a warm start reads them back (typed arrays: a structured clone, no work) instead
// of waiting for the worker (75-140 ms in the iOS Simulator, ~200 ms on a phone, before the island's first frame).
// One record, keyed by what the worker was given (the layout's tiles, pieces and homes) and the build (the code that
// made them): a layout edit or a deploy misses, and the next answer replaces it. Never needed: no IndexedDB, an error,
// anything odd read back, and the worker runs as before.
import type { Primed } from './fields.worker.ts';
import { CHUNK_COUNT } from './mesh.ts';
import type { Layout } from './model.ts';

const DB_NAME = 'island-fields', STORE = 'primed';
/** Bumped when what's stored changes shape (the build changes the key anyway). */
const FIELDS_V = 1;

let idb: IDBFactory | null = typeof indexedDB !== 'undefined' ? indexedDB : null;
let db: Promise<IDBDatabase | null> | null = null;

/** Tests: swap IndexedDB (`fake-indexeddb`). */
export function configureFieldsCache(o: { indexedDB: IDBFactory | null }): void {
  idb = o.indexedDB;
  db = null;
}

/** The key: an FNV-1a hash of the worker's input, the build and FIELDS_V. */
export function fieldsKey(l: Pick<Layout, 'codes' | 'objects' | 'homes'>, build: string): string {
  let h = 0x811c9dc5;
  const mix = (c: number) => void (h = Math.imul(h ^ c, 0x01000193));
  for (let i = 0; i < l.codes.length; i++) mix(l.codes[i]);
  const rest = JSON.stringify([[...l.objects], l.homes, build, FIELDS_V]);
  for (let i = 0; i < rest.length; i++) mix(rest.charCodeAt(i));
  return `${l.codes.length}:${(h >>> 0).toString(36)}`;
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
      r.onerror = () => ok(null);
      r.onblocked = () => ok(null);
    } catch {
      ok(null);
    }
  });
  return db;
}

const whole = (p: unknown): p is Primed => {
  const x = p as Primed | null;
  return !!x && Array.isArray(x.raw?.ch) && x.raw.ch.every((a) => a instanceof Float32Array) && Array.isArray(x.chunks) && x.chunks.length === CHUNK_COUNT;
};

/** The fields and chunks kept for `key`, or null (none, another key's, an error). Never rejects. */
export async function readFields(key: string): Promise<Primed | null> {
  try {
    const d = await open();
    if (!d) return null;
    const rec = await new Promise<unknown>((ok) => {
      const r = d.transaction(STORE, 'readonly').objectStore(STORE).get(key);
      r.onsuccess = () => ok(r.result);
      r.onerror = () => ok(null);
    });
    const { key: k, primed } = (rec ?? {}) as { key?: string; primed?: unknown };
    return k === key && whole(primed) ? primed : null;
  } catch {
    return null;
  }
}

/** A writer of the one record (the last layout's): the database opened, then each call clones `primed` at once (its
 *  buffers may be transferred right after) and resolves once it's written. Null: no IndexedDB. Never rejects. */
export async function fieldsWriter(): Promise<((key: string, primed: Primed) => Promise<void>) | null> {
  const d = await open().catch(() => null);
  if (!d) return null;
  return (key, primed) => new Promise<void>((ok) => {
    try {
      const t = d.transaction(STORE, 'readwrite');
      const s = t.objectStore(STORE);
      // (one record: the last layout's; keyed by its key, a miss reads nothing of another's ~10 MB)
      s.clear();
      s.put({ key, primed }, key);
      t.oncomplete = t.onerror = t.onabort = () => ok();
    } catch {
      // (full, unavailable: the worker runs next time)
      ok();
    }
  });
}
