// 保存した場所's copy on the phone (docs/places.md "Data"): the last payload, whole and columnar (contract/places.ts
// placesPayload), with its version for the next `?since=`, kept in IndexedDB (the list works offline, opens at once);
// in memory for the session when IndexedDB is refused. Whose it is: another person's copy on this phone (a re-pairing)
// is not read. Its format `v` (CACHE_V): an older copy is not read either (2: the guest's carries the notes since
// 2026-11-24, a delta never resends a row unchanged, so its stripped copy is fetched whole once).
import { applyPlaces, placesPayload, placesPayloadOf, type Place, type PlacesPayload } from '../contract/places.ts';

export interface PlacesCache {
  who: string;
  ver: number;
  syncedAt: number | null;
  rows: Place[];
  /** The adders' names (a typed うめが保存's chip). */
  people?: string[];
}

const DB = 'island-places', STORE = 'kv', KEY = 'places', CACHE_V = 2;
let mem: { who: string; v: number; p: PlacesPayload } | null = null;
let db: Promise<IDBDatabase | null> | null = null;

function open(): Promise<IDBDatabase | null> {
  return (db ??= new Promise((res) => {
    try {
      const r = indexedDB.open(DB, 1);
      r.onupgradeneeded = () => r.result.createObjectStore(STORE);
      r.onsuccess = () => res(r.result);
      r.onerror = r.onblocked = () => res(null);
    } catch {
      res(null);
    }
  }));
}

function tx<T>(mode: IDBTransactionMode, f: (s: IDBObjectStore) => IDBRequest<T> | void): Promise<T | undefined> {
  return open().then((d) => new Promise<T | undefined>((res) => {
    if (!d) return res(undefined);
    try {
      const t = d.transaction(STORE, mode), req = f(t.objectStore(STORE));
      t.oncomplete = () => res(req ? req.result : undefined);
      t.onerror = t.onabort = () => res(undefined);
    } catch {
      res(undefined);
    }
  }));
}

/** The copy for `who`, or null (none, another person's, one this build can't read). */
export async function readCache(who: string): Promise<PlacesCache | null> {
  const got = mem ?? ((await tx<{ who: string; v?: unknown; p: unknown }>('readonly', (s) => s.get(KEY))) ?? null);
  if (!got || got.who !== who || got.v !== CACHE_V) return null;
  const p = placesPayloadOf(got.p);
  return p ? { who, ver: p.ver, syncedAt: p.syncedAt, rows: applyPlaces([], { ...p, full: true }), ...(p.people ? { people: p.people } : {}) } : null;
}

export async function writeCache(c: PlacesCache): Promise<void> {
  const p = placesPayload(c.rows, { ver: c.ver, full: true, syncedAt: c.syncedAt, ...(c.rows.some((r) => r.note !== undefined) ? { people: c.people ?? [] } : {}) });
  // (held in memory only when IndexedDB is refused: else the rows are the store's, not twice in the heap)
  if (await open()) await tx('readwrite', (s) => void s.put({ who: c.who, v: CACHE_V, p }, KEY));
  else mem = { who: c.who, v: CACHE_V, p };
}
