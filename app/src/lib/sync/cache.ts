// The snapshot cache: the rows the model reads, kept in IndexedDB (no 5 MB localStorage ceiling, no stringify of
// megabytes per refresh) and merged incrementally with `since` replies. A changed data revision (`rev`: rows were
// edited in the sheet) drops it and fetches everything. When IndexedDB is unavailable the cache lives in memory for the
// session (reported).
import type { PersonId } from '#lib/types.ts';
import type { SnapshotReply, SnapshotRows } from '#lib/contract/api.ts';
import { emptyRows, maxAt, mergeRows } from '#lib/model/snapshot.ts';
import { compactRows } from '#lib/model/compact.ts';
import type { DemoCalendar } from '#lib/model/state.ts';
import { getKey, getStoredMe, reportStorageProblem, storeMe } from './storage.ts';
import { post, type GasResult } from './transport.ts';

export interface SnapshotCache {
  v: 1;
  me: PersonId;
  rows: SnapshotRows;
  /** Max server `at` seen: the next `since`. */
  since: string | null;
  /** The server's data revision these rows were fetched under. */
  rev?: string;
  /**
   * Client time the row set last lost rows (compaction, or a full fetch). With `rev` it keys the earnings of
   * locked weeks (`model/bells.ts` lockedWeeks; `reduce(…, rev)` counts rows up to a cutoff, which only holds while rows are only added).
   */
  rowsAt?: number;
  /** Server clock − client clock at the last fetch (ms). */
  skewMs: number;
  /** Client time of the last successful fetch (ms). */
  fetchedAt: number;
  /** Demo only (never persisted): the demo's calendar, and queued events may name their sender (`person`). */
  demo?: DemoCalendar;
}

const DB_NAME = 'island';
const STORE = 'cache';
const KEY = 'snapshot';

let idb: IDBFactory | null = typeof indexedDB !== 'undefined' ? indexedDB : null;
let db: Promise<IDBDatabase | null> | null = null;
/** The cache as last loaded or saved (`undefined`: not loaded yet). The source of truth in this session. */
let mem: SnapshotCache | null | undefined;
let loading: Promise<SnapshotCache | null> | null = null;
/** Writes in order (a clear after a save must not be overtaken by it). */
let writes: Promise<unknown> = Promise.resolve();

/** Tests: swap IndexedDB (`fake-indexeddb`), forgetting what this session loaded. */
export function configureCache(o: { indexedDB: IDBFactory | null }): void {
  idb = o.indexedDB;
  db = null;
  mem = undefined;
  loading = null;
  writes = Promise.resolve();
}

const req = <T>(r: IDBRequest<T>): Promise<T> => new Promise((ok, fail) => {
  r.onsuccess = () => ok(r.result);
  r.onerror = () => fail(r.error);
});

function open(): Promise<IDBDatabase | null> {
  db ??= new Promise<IDBDatabase | null>((ok) => {
    if (!idb) return ok(null);
    let r: IDBOpenDBRequest;
    try {
      r = idb.open(DB_NAME, 1);
    } catch (e) {
      reportStorageProblem(e);
      return ok(null);
    }
    r.onupgradeneeded = () => r.result.createObjectStore(STORE);
    r.onsuccess = () => {
      const d = r.result;
      d.onversionchange = () => d.close();
      ok(d);
    };
    r.onerror = () => {
      reportStorageProblem(r.error);
      ok(null);
    };
    r.onblocked = () => ok(null);
  });
  return db;
}

async function tx<T>(mode: IDBTransactionMode, run: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const d = await open();
  if (!d) throw new Error('no IndexedDB');
  const t = d.transaction(STORE, mode);
  const out = req(run(t.objectStore(STORE)));
  await new Promise<void>((ok, fail) => {
    t.oncomplete = () => ok();
    t.onerror = () => fail(t.error);
    t.onabort = () => fail(t.error ?? new DOMException('aborted', 'AbortError'));
  });
  return out;
}

const valid = (c: unknown): c is SnapshotCache => {
  const x = c as SnapshotCache | null;
  return !!x && x.v === 1 && !!x.rows && Array.isArray(x.rows.events) && Array.isArray(x.rows.metrics);
};

/** The cached snapshot (from IndexedDB once per session). */
export function loadCache(): Promise<SnapshotCache | null> {
  if (mem !== undefined) return Promise.resolve(mem);
  loading ??= (async () => {
    let c: SnapshotCache | null = null;
    try {
      const got: unknown = await tx('readonly', (s) => s.get(KEY));
      if (valid(got)) c = got;
    } catch {
      // No IndexedDB (or it failed): start empty, kept in memory.
    }
    if (mem === undefined) mem = c; // a save or clear while loading wins
    return mem;
  })();
  return loading;
}

async function put(c: SnapshotCache): Promise<boolean> {
  try {
    await tx('readwrite', (s) => s.put(c, KEY));
    return true;
  } catch (e) {
    if (idb) reportStorageProblem(e);
    return false;
  }
}

/** Keep `c` (in memory at once; on disk in order). Resolves false if it could not be stored (already reported). */
export function saveCache(c: SnapshotCache): Promise<boolean> {
  mem = c;
  const p = writes.then(() => (mem === c ? put(c) : true));
  writes = p;
  return p;
}

/** Resolves once every save and clear so far reached the disk (or failed). */
export const cacheWritten = (): Promise<void> => writes.then(() => undefined);

/** Forget the cache (pairing as someone else, or a resync). */
export function clearCache(): Promise<void> {
  mem = null;
  const p = writes.then(async () => {
    try {
      await tx('readwrite', (s) => s.delete(KEY));
    } catch {
      /* nothing stored */
    }
  });
  writes = p;
  return p;
}

type Reply = { me: PersonId; now: string; rev?: string; rows: Partial<SnapshotRows> };

/**
 * Merge a snapshot reply into the cache (pure; exported for tests). `prev` null: the reply is everything. Metrics of
 * locked weeks are compacted to the rows the model still reads (model/compact.ts: ~90% fewer at year 3, views
 * identical).
 */
export function applySnapshot(prev: SnapshotCache | null, reply: Reply, clientNow: number): SnapshotCache {
  const same = prev && prev.me === reply.me ? prev : null;
  const merged = mergeRows(same?.rows ?? emptyRows(), reply.rows);
  const serverNow = Date.parse(reply.now);
  const rows = Number.isNaN(serverNow) ? merged : compactRows(merged, serverNow);
  const rev = reply.rev ?? same?.rev;
  const rowsAt = !same || rows !== merged ? clientNow : (same.rowsAt ?? clientNow);
  return {
    v: 1, me: reply.me, rows, since: maxAt(merged), ...(rev === undefined ? {} : { rev }), rowsAt,
    skewMs: Number.isNaN(serverNow) ? (prev?.skewMs ?? 0) : serverNow - clientNow,
    fetchedAt: clientNow
  };
}

let fetching: Promise<GasResult<{ cache: SnapshotCache }>> | null = null;
/** The one follow-up fetch `fresh` callers wait for while a request is in flight. */
let again: Promise<GasResult<{ cache: SnapshotCache }>> | null = null;

/**
 * Fetch rows since the last seen `at` (everything on first run, or after a hand edit changed `rev`), merge and persist. Overlapping
 * callers share the request in flight, so two replies never merge from the same stale cache. `fresh`: the caller
 * needs rows written before now (the re-read after an ack), so a request already in flight (it may have been answered
 * before the write) is followed by one more, shared by every such caller.
 */
export function refreshSnapshot(clientNow: () => number = Date.now, fresh = false): Promise<GasResult<{ cache: SnapshotCache }>> {
  if (fetching && fresh) {
    return (again ??= fetching.then(() => {
      again = null;
      return refreshSnapshot(clientNow);
    }));
  }
  if (fetching) return fetching;
  const p = fetchSnapshot(clientNow);
  fetching = p;
  // cleared however it settles: a rejected request must not be handed to every later caller
  void p.finally(() => {
    if (fetching === p) fetching = null;
  }).catch(() => {});
  return p;
}

async function fetchSnapshot(clientNow: () => number): Promise<GasResult<{ cache: SnapshotCache }>> {
  try {
    return await fetchAndMerge(clientNow);
  } catch (e) {
    // a malformed reply (mergeRows throws) or a storage failure: report it as a failed sync, never a stuck one
    console.warn('snapshot refresh failed', e);
    return { ok: false, error: 'unavailable', detail: String(e) };
  }
}

async function fetchAndMerge(clientNow: () => number): Promise<GasResult<{ cache: SnapshotCache }>> {
  const key = getKey();
  const prev = await loadCache();
  const me = getStoredMe();
  const since = prev && (!me || prev.me === me) ? prev.since : null;
  let r = await post<Extract<SnapshotReply, { ok: true }>>('snapshot', since ? { since } : {});
  // Start over when the sheet was edited by hand since these rows were cached (or they predate revisions), or when
  // the key answers for someone else: a `since` page merged into nothing would pass for the whole history.
  const stale = r.ok && since && prev && ((r.rev !== undefined && r.rev !== prev.rev) || r.me !== prev.me);
  if (stale) r = await post<Extract<SnapshotReply, { ok: true }>>('snapshot', {});
  // Paired again while this was in flight: the reply belongs to the old key, so neither its rows nor its `me` may
  // overwrite what pairing just reset (the refresh pairing starts fetches for the new key).
  if (getKey() !== key) return { ok: false, error: 'unavailable', detail: 'paired again during the fetch' };
  if (!r.ok) return r;
  const cache = applySnapshot(since && !stale ? prev : null, r, clientNow());
  void saveCache(cache);
  if (getStoredMe() !== r.me) storeMe(r.me);
  return { ok: true, cache };
}
