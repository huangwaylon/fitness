// The snapshot cache: the rows the model reads, kept in IndexedDB (no 5 MB localStorage ceiling, no stringify of
// megabytes per refresh) and merged incrementally with `since` replies. A changed data revision (`rev`:
// another epoch: the record rebuilt, docs/backend.md#revision) drops it and fetches everything. When IndexedDB is unavailable the cache lives in memory for the
// session (reported).
import type { Who } from '#lib/types.ts';
import { DATE_RE, type EventRow, type SnapshotReply, type SnapshotRows } from '#lib/contract/api.ts';
import { emptyRows, maxAt, mergeRows } from '#lib/model/snapshot.ts';
import { compactRows } from '#lib/model/compact.ts';
import { finalMs, lastLockAt } from '#lib/model/state.ts';
import { weekKeyOf } from '#lib/time/dates.ts';
import { getKey, getStoredMe, reportStorageProblem, storeMe } from './storage.ts';
import { post, type GasResult } from './transport.ts';

export interface SnapshotCache {
  v: 1;
  /** Who the rows were fetched for (`G`: the guest's, without the からだ rows). */
  me: Who;
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
  /** The week lock (`lastLockAt`) the rows were last compacted through: a poll compacts again only past a newer one. */
  compactedAt?: number;
  /** Server clock − client clock at the last fetch (ms). */
  skewMs: number;
  /** Client time of the last successful fetch (ms). */
  fetchedAt: number;
  /** Demo only (never persisted): queued events may name their sender (`person`). */
  demo?: true;
}

const DB_NAME = 'island';
const STORE = 'cache';
/**
 * The small `meta` record (everything but the rows, written on every refresh) and the rows in segments: each tab's
 * rows in order, SEG_ROWS a record (`seg:<tab>:<unique>`, listed in the meta). Rows only grow at the end between
 * compactions, so a save rewrites only the segments from the first one that changed: the last, partly filled one on
 * a usual poll (≤ ~300 KB, where one record of every row was 4–13 MB at years 1–3 with the meal log). The meta and the
 * segments it lists are written in one transaction, so a reader sees one consistent set. Older layouts are read
 * once and moved on the next save, in the same transaction that deletes them: `rows` (meta v 2, every row in one
 * record) and `snapshot` (v 1, the rows inside).
 */
const META = 'meta';
const ROWS = 'rows';
const LEGACY = 'snapshot';
const SEG = 'seg:';
/** A new segment's key is never one in use, by this page or another (another tab of the app: its meta then lists
 *  segments this one may have deleted, read as no cache: fetched again, never as other rows). */
const SESSION = `${Date.now().toString(36)}${Math.floor(Math.random() * 36 ** 4).toString(36)}.`;
let segN = 0;
/** Rows a segment holds (~60 KB of metrics, ~300 KB of meal log events). */
export const SEG_ROWS = 1000;

type Tab = keyof SnapshotRows;
const TABS: readonly Tab[] = ['metrics', 'events'];
/** One tab's segments as written: their keys and rows (the same row objects as the cache's). */
type Segments = { key: string; rows: readonly unknown[] }[];
/** The `meta` record: the cache without its rows, and the segments that hold them. */
type Meta = Omit<SnapshotCache, 'v' | 'rows'> & { v: 3; segs: Record<Tab, string[]> };
type MetaV2 = Omit<Meta, 'v' | 'segs'> & { v: 2 };

let idb: IDBFactory | null = typeof indexedDB !== 'undefined' ? indexedDB : null;
let db: Promise<IDBDatabase | null> | null = null;
/** The cache as last loaded or saved (`undefined`: not loaded yet). The source of truth in this session. */
let mem: SnapshotCache | null | undefined;
/** The segments known to be on disk, per tab (null: unknown, or an older layout there: the next save writes all). */
let disk: Record<Tab, Segments> | null = null;
/** Segments on disk the meta doesn't list (another tab's, a write cut short): deleted by the next save. */
let orphans: string[] = [];
let loading: Promise<SnapshotCache | null> | null = null;
/** Writes in order (a clear after a save must not be overtaken by it). */
let writes: Promise<unknown> = Promise.resolve();

/** Tests: swap IndexedDB (`fake-indexeddb`), forgetting what this session loaded. */
export function configureCache(o: { indexedDB: IDBFactory | null }): void {
  idb = o.indexedDB;
  db = null;
  mem = undefined;
  disk = null;
  orphans = [];
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

/** One transaction over the store: every request `run` makes commits together, or none does. */
async function tx<T>(mode: IDBTransactionMode, run: (s: IDBObjectStore) => T): Promise<T> {
  const d = await open();
  if (!d) throw new Error('no IndexedDB');
  const t = d.transaction(STORE, mode);
  const out = run(t.objectStore(STORE));
  await new Promise<void>((ok, fail) => {
    t.oncomplete = () => ok();
    t.onerror = () => fail(t.error);
    t.onabort = () => fail(t.error ?? new DOMException('aborted', 'AbortError'));
  });
  return out;
}

const validRows = (r: unknown): r is SnapshotRows => {
  const x = r as SnapshotRows | null;
  return !!x && Array.isArray(x.events) && Array.isArray(x.metrics);
};
const validLegacy = (c: unknown): c is SnapshotCache => {
  const x = c as SnapshotCache | null;
  return !!x && x.v === 1 && validRows(x.rows);
};
const validMeta = (m: unknown): m is Meta | MetaV2 => {
  const x = m as Meta | MetaV2 | null;
  if (!x || (x.me !== 'A' && x.me !== 'B')) return false;
  return x.v === 2 || (x.v === 3 && TABS.every((t) => Array.isArray(x.segs?.[t])));
};

/** The rows the meta's segments hold, and the segments (null: one is missing: the set isn't whole, start over). */
function fromSegments(meta: Meta, keys: IDBValidKey[], values: unknown[]): { rows: SnapshotRows; segs: Record<Tab, Segments> } | null {
  const byKey = new Map(keys.map((k, i) => [String(k), values[i]]));
  const segs = { metrics: [], events: [] } as Record<Tab, Segments>;
  for (const t of TABS) {
    for (const key of meta.segs[t]) {
      const r = byKey.get(key);
      if (!Array.isArray(r)) return null;
      segs[t].push({ key, rows: r });
    }
  }
  const rows = { metrics: segs.metrics.flatMap((x) => x.rows), events: segs.events.flatMap((x) => x.rows) } as SnapshotRows;
  return { rows, segs };
}

/** The cached snapshot (from IndexedDB once per session): the `meta` and its segments, else an older layout. */
export function loadCache(): Promise<SnapshotCache | null> {
  if (mem !== undefined) return Promise.resolve(mem);
  loading ??= (async () => {
    let c: SnapshotCache | null = null;
    let onDisk: Record<Tab, Segments> | null = null;
    let stray: string[] = [];
    try {
      const [meta, rows, legacy, keys, values] = await tx('readonly', (s) => {
        // The store holds the cache's records only: every one at once (the segments, or an older layout).
        const all = Promise.all([req(s.get(META)), req(s.get(ROWS)), req(s.get(LEGACY)), req(s.getAllKeys()), req(s.getAll())]);
        all.catch(() => {}); // a failed read fails the transaction, which is what's awaited
        return all;
      });
      if (validMeta(meta) && meta.v === 3) {
        const got = fromSegments(meta, keys, values);
        if (got) {
          const { v: _v, segs: _s, ...rest } = meta;
          c = { ...rest, v: 1, rows: got.rows };
          onDisk = got.segs;
          const listed = new Set([...meta.segs.metrics, ...meta.segs.events]);
          stray = keys.map(String).filter((k) => k.startsWith(SEG) && !listed.has(k));
        }
      } else if (validMeta(meta) && meta.v === 2 && validRows(rows)) {
        const { v: _v, ...rest } = meta;
        c = { ...rest, v: 1, rows }; // the next save moves it to segments
      } else if (validLegacy(legacy)) c = legacy; // the next save moves it to segments
    } catch {
      // No IndexedDB (or it failed): start empty, kept in memory.
    }
    if (mem === undefined) { // a save or clear while loading wins
      mem = c;
      disk = onDisk;
      orphans = stray;
    }
    return mem;
  })();
  return loading;
}

/**
 * A tab's segments for `rows`: those on disk that still hold the same rows in the same place are kept, the rest
 * written anew from there (SEG_ROWS each; a partly filled last one kept is refilled, so segments stay full).
 */
function plan(rows: readonly unknown[], old: Segments, tab: Tab): { segs: Segments; write: Segments } {
  let pos = 0;
  let k = 0;
  for (; k < old.length; k++) {
    const seg = old[k].rows;
    if (pos + seg.length > rows.length || seg.some((r, i) => rows[pos + i] !== r)) break;
    pos += seg.length;
  }
  if (k === old.length && pos === rows.length) return { segs: old, write: [] };
  if (k && old[k - 1].rows.length < SEG_ROWS) pos -= old[--k].rows.length;
  const segs = old.slice(0, k);
  const write: Segments = [];
  for (; pos < rows.length; pos += SEG_ROWS) write.push({ key: `${SEG}${tab}:${SESSION}${(segN++).toString(36)}`, rows: rows.slice(pos, pos + SEG_ROWS) });
  return { segs: [...segs, ...write], write };
}

async function put(c: SnapshotCache): Promise<boolean> {
  const { v: _v, rows, demo: _demo, ...rest } = c;
  const known = disk;
  const plans = TABS.map((t) => plan(rows[t], known?.[t] ?? [], t));
  const segs = { metrics: plans[0].segs, events: plans[1].segs };
  const meta: Meta = { ...rest, v: 3, segs: { metrics: segs.metrics.map((x) => x.key), events: segs.events.map((x) => x.key) } };
  try {
    await tx('readwrite', (s) => {
      if (!known) s.clear(); // what is on disk is unknown, or an older layout: replace it all
      else {
        const live = new Set([...meta.segs.metrics, ...meta.segs.events]);
        for (const t of TABS) for (const x of known[t]) if (!live.has(x.key)) s.delete(x.key);
        for (const k of orphans) s.delete(k);
      }
      for (const p of plans) for (const x of p.write) s.put(x.rows, x.key);
      s.put(meta, META);
    });
    disk = segs;
    orphans = [];
    return true;
  } catch (e) {
    if (idb) reportStorageProblem(e);
    return false;
  }
}

/**
 * Keep `c` (in memory at once; on disk in order). Only the meta is written unless the rows changed, and then only
 * the segments from the first changed row on (an empty poll keeps the same rows object). Resolves false if it could
 * not be stored (already reported).
 */
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
    disk = null;
    orphans = [];
    try {
      await tx('readwrite', (s) => s.clear());
    } catch {
      /* nothing stored */
    }
  });
  writes = p;
  return p;
}

type Reply = { me: Who; now: string; rev: string; rows: Partial<SnapshotRows> };

/**
 * My events the record just stored, as the rows it holds (its `at`), into the cache at once: no re-read after an ack.
 * `since` stays where it was, so the next poll still brings everything written after it (these rows again too: the
 * merge keeps one). Returns the cache, or null when there is none.
 */
export function addOwnRows(rows: EventRow[]): SnapshotCache | null {
  const c = mem;
  if (!c) return null;
  const merged = mergeRows(c.rows, { events: rows });
  if (merged === c.rows) return c;
  const next = { ...c, rows: merged };
  void saveCache(next);
  return next;
}

/** The later of two `since` values (ISO instants; null = none). */
const laterAt = (a: string | null, b: string | null): string | null => (a === null ? b : b === null || Date.parse(a) >= Date.parse(b) ? a : b);

/**
 * Merge a snapshot reply into the cache (pure; exported for tests). `prev` null: the reply is everything. Metrics of
 * locked weeks are compacted to the rows the model still reads (model/compact.ts: ~90% fewer at year 3, views
 * identical). Compaction is a fixed point, so a poll runs it again only when it could drop something: a week locked
 * since the last one, or the reply brought metric rows of a locked week (a late sync). Skipping it is always safe.
 */
export function applySnapshot(prev: SnapshotCache | null, reply: Reply, clientNow: number): SnapshotCache {
  const same = prev && prev.me === reply.me ? prev : null;
  const merged = mergeRows(same?.rows ?? emptyRows(), reply.rows);
  const serverNow = Date.parse(reply.now);
  const lock = Number.isNaN(serverNow) ? null : lastLockAt(serverNow);
  const late = (reply.rows.metrics ?? []).some((r) => DATE_RE.test(String(r[2])) && finalMs(weekKeyOf(String(r[2]))) <= serverNow);
  const compact = lock !== null && (!same || late || (same.compactedAt ?? -Infinity) < lock);
  const rows = compact ? compactRows(merged, serverNow) : merged;
  const compactedAt = compact ? lock! : same?.compactedAt;
  const rowsAt = !same || rows !== merged ? clientNow : same.rowsAt;
  // `since` from the rows before compaction: the newest of what was seen and what this reply adds.
  const since = same ? laterAt(same.since, maxAt({ metrics: reply.rows.metrics ?? [], events: reply.rows.events ?? [] })) : maxAt(merged);
  return {
    v: 1, me: reply.me, rows, since, rev: reply.rev, ...(compactedAt === undefined ? {} : { compactedAt }), rowsAt,
    skewMs: Number.isNaN(serverNow) ? (prev?.skewMs ?? 0) : serverNow - clientNow,
    fetchedAt: clientNow
  };
}

let fetching: Promise<GasResult<{ cache: SnapshotCache }>> | null = null;
/** The one follow-up fetch `fresh` callers wait for while a request is in flight. */
let again: Promise<GasResult<{ cache: SnapshotCache }>> | null = null;

/**
 * Fetch rows since the last seen `at` (everything on first run, or when `rev` changed: a new epoch), merge and persist. Overlapping
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
  // Start over when the record is in another epoch than these rows were cached in (a restore), or when the key answers for someone
  // else: a `since` page merged into nothing would pass for the whole history.
  const stale = r.ok && since && prev && (r.rev !== prev.rev || r.me !== prev.me);
  if (stale) r = await post<Extract<SnapshotReply, { ok: true }>>('snapshot', {});
  // Paired again while this was in flight: the reply belongs to the old key, so neither its rows nor its `me` may
  // overwrite what pairing just reset (the refresh pairing starts fetches for the new key).
  if (getKey() !== key) return { ok: false, error: 'unavailable', detail: 'paired again during the fetch' };
  if (!r.ok) return r;
  // onto the cache as it is now: my own rows the record stored meanwhile (addOwnRows) are in it, `since` unmoved
  const base = mem && prev && mem.me === prev.me && mem.since === prev.since ? mem : prev;
  const cache = applySnapshot(since && !stale ? base : null, r, clientNow());
  void saveCache(cache);
  if (getStoredMe() !== r.me) storeMe(r.me);
  return { ok: true, cache };
}
