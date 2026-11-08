// The island's textures as the transcoder made them (docs/perf-plan.md C1, ktx2.ts), kept in IndexedDB: a warm start
// reads a texture's GPU-ready mip levels back (a structured clone, no work) instead of fetching its KTX2, loading the
// transcoder and transcoding. Keyed by the texture (its WebP's hash), its GPU format and the pipeline (the encoder's
// settings and the transcoder's hash, ktx2.json; not the app's build: a deploy keeps them). Reads asked in the same
// task share a transaction; writes go in one a moment later. Bounded: past CAP_BYTES the least recently used go, and
// another pipeline's at once. Never needed: no IndexedDB, an error, anything odd read back, and the texture is
// transcoded again.
import type { Transcoded } from './ktx2Format.ts';

const DB_NAME = 'island-tex', DATA = 'tex', META = 'meta';
/** The store's bound (bytes of mip data): the island's whole set as ASTC is ~19 MB, its start ~4 MB. */
export const CAP_BYTES = 24_000_000;
/** A hit's last use is rewritten when older than this (ms): an LRU without a write per read. */
const TOUCH_MS = 86_400_000;
/** Writes wait this long for more (ms). */
const WRITE_MS = 1000;

type Meta = { b: number; at: number };
let idb: IDBFactory | null = typeof indexedDB !== 'undefined' ? indexedDB : null;
let db: Promise<IDBDatabase | null> | null = null;
let now = () => Date.now();

/** Tests: swap IndexedDB (`fake-indexeddb`) and the clock. */
export function configureTexCache(o: { indexedDB: IDBFactory | null; now?: () => number }): void {
  idb = o.indexedDB;
  now = o.now ?? (() => Date.now());
  db = null;
  reads = new Map();
  writes = new Map();
}

function open(): Promise<IDBDatabase | null> {
  db ??= new Promise<IDBDatabase | null>((ok) => {
    if (!idb) return ok(null);
    try {
      const r = idb.open(DB_NAME, 1);
      r.onupgradeneeded = () => (r.result.createObjectStore(DATA), r.result.createObjectStore(META));
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

const whole = (t: unknown): t is Transcoded => {
  const x = t as Transcoded | null;
  return !!x && x.width > 0 && x.height > 0 && Array.isArray(x.mips) && x.mips.length > 0 && x.mips.every((m) => m.data instanceof Uint8Array && m.width > 0 && m.height > 0);
};
const bytes = (t: Transcoded) => t.mips.reduce((n, m) => n + m.data.byteLength, 0);

let reads = new Map<string, ((t: Transcoded | null) => void)[]>();
/** The texture kept under `key`, or null (none, an error, anything odd). Never rejects. */
export function readTex(key: string): Promise<Transcoded | null> {
  return new Promise((ok) => {
    const q = reads.get(key);
    if (q) return void q.push(ok);
    reads.set(key, [ok]);
    if (reads.size === 1) queueMicrotask(flushReads);
  });
}
async function flushReads() {
  const batch = reads;
  reads = new Map();
  const answer = (k: string, t: Transcoded | null) => batch.get(k)!.forEach((f) => f(t));
  const d = await open().catch(() => null);
  if (!d) return batch.forEach((_, k) => answer(k, null));
  try {
    const t = d.transaction([DATA, META], 'readonly'), data = t.objectStore(DATA), meta = t.objectStore(META), at = now(), stale: [string, Meta][] = [];
    for (const k of batch.keys()) {
      const r = data.get(k);
      r.onsuccess = () => {
        const v = whole(r.result) ? r.result : null;
        answer(k, v);
        if (!v) return;
        const m = meta.get(k);
        m.onsuccess = () => {
          const old = m.result as Meta | undefined;
          if (old && at - old.at > TOUCH_MS) stale.push([k, { b: old.b, at }]);
        };
      };
      r.onerror = (e) => (e.preventDefault(), answer(k, null));
    }
    t.onabort = () => batch.forEach((_, k) => answer(k, null));
    // (the hits' last use, in a transaction of its own: a read never waits on a write)
    t.oncomplete = () => {
      if (!stale.length) return;
      try {
        const w = d.transaction(META, 'readwrite').objectStore(META);
        for (const [k, m] of stale) w.put(m, k);
      } catch {
        // (unavailable: an older last use)
      }
    };
  } catch {
    batch.forEach((_, k) => answer(k, null));
  }
}

let writes = new Map<string, Transcoded>();
/** Keep `tex` under `key` (soon, with others; its mip data must not be transferred meanwhile). `pipe`: the current
 *  pipeline's key prefix (another's are let go of). */
export function writeTex(key: string, tex: Transcoded, pipe: string): void {
  if (!idb) return;
  writes.set(key, tex);
  if (writes.size === 1) setTimeout(() => void flushWrites(pipe), WRITE_MS);
}
async function flushWrites(pipe: string): Promise<void> {
  const batch = writes;
  writes = new Map();
  const d = await open().catch(() => null);
  if (!d) return;
  try {
    const t = d.transaction([DATA, META], 'readwrite'), data = t.objectStore(DATA), meta = t.objectStore(META), at = now();
    for (const [k, v] of batch) data.put(v, k), meta.put({ b: bytes(v), at } satisfies Meta, k);
    // the bound: another pipeline's entries, then the least recently used past CAP_BYTES
    const keys = meta.getAllKeys(), vals = meta.getAll();
    vals.onsuccess = () => {
      const all = (keys.result as string[]).map((k, i) => ({ k, ...(vals.result[i] as Meta) }));
      const gone = all.filter((e) => !e.k.startsWith(pipe));
      let total = all.reduce((n, e) => n + (e.k.startsWith(pipe) ? e.b : 0), 0);
      for (const e of all.filter((x) => x.k.startsWith(pipe)).sort((a, b) => a.at - b.at)) {
        if (total <= CAP_BYTES) break;
        gone.push(e);
        total -= e.b;
      }
      for (const e of gone) data.delete(e.k), meta.delete(e.k);
    };
    await new Promise<void>((ok) => (t.oncomplete = t.onerror = t.onabort = () => ok()));
  } catch {
    // (full, unavailable: transcoded again next time)
  }
}

/** Tests: the pending writes now. */
export const flushTexWrites = (pipe: string) => flushWrites(pipe);
