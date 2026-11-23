// The room's and the art's files (the island's, the rooms' and the villagers' models, textures, packs and renders,
// cached on first use: index.ts onUse) kept in IndexedDB, not the Cache API: a cold worker's first Cache Storage call
// costs by the ORIGIN's total entries (~0.1-0.35 ms each on desktop WebKit, 6-20x on a phone; /tmp/launch/L1-swown.md:
// ~3,300 entries, 450-566 ms p50 before the page's clock), and these two were ~1,500 of them (storage.use roomN ~1,000,
// artN ~500). A store answers the calls a Cache would (match, put, delete, keys: what onUse and bounded.ts ask), by
// URL (content-keyed already: `?v=` hashes, hashed names), each file a Blob with its type and status. The reads asked in
// the same task share a transaction (a launch's ~70 models at once), never one read of everything (a bulk read measured
// worse: world3d's texture read-ahead, 11-23). A store's database can't be had (private mode, an error): every match
// a miss, every put dropped, so the file comes from the network as before a cache.

/** The calls a bounded store makes of its cache (bounded.ts), a Cache's or a BlobCache's. */
export interface FileStore {
  match(req: RequestInfo | URL): Promise<Response | undefined>;
  put(req: RequestInfo | URL, res: Response): Promise<void>;
  delete(req: RequestInfo | URL): Promise<boolean>;
  keys(): Promise<readonly { url: string }[]>;
}

const DB = 'island-files', V = 1;
/** The stores: the room's files (ROOM_CACHE's before), the art's (the villagers' cache's before). */
const STORES = ['room', 'art'] as const;
export type StoreName = (typeof STORES)[number];

type Row = { b: Blob; t: string; s: number };
const keyOf = (r: RequestInfo | URL): string => (typeof r === 'string' ? new URL(r, globalThis.location?.href).href : r instanceof URL ? r.href : r.url);

let factory: IDBFactory | null = typeof indexedDB !== 'undefined' ? indexedDB : null;
let db: Promise<IDBDatabase | null> | null = null;
/** Tests: another IndexedDB (fake-indexeddb), or none. */
export function configureFiles(idb: IDBFactory | null): void {
  factory = idb;
  db = null;
}
function open(): Promise<IDBDatabase | null> {
  db ??= new Promise<IDBDatabase | null>((ok) => {
    if (!factory) return ok(null);
    try {
      const r = factory.open(DB, V);
      r.onupgradeneeded = () => STORES.forEach((s) => r.result.objectStoreNames.contains(s) || r.result.createObjectStore(s));
      r.onsuccess = () => {
        const d = r.result;
        d.onversionchange = () => (d.close(), (db = null));
        ok(d);
      };
      r.onerror = r.onblocked = () => ((db = null), ok(null));
    } catch {
      db = null;
      ok(null);
    }
  });
  return db;
}
const done = (t: IDBTransaction) => new Promise<boolean>((ok) => ((t.oncomplete = () => ok(true)), (t.onerror = t.onabort = () => ok(false))));

/** A store of files by URL. */
export function blobCache(store: StoreName): FileStore {
  let asks = new Map<string, ((r: Row | undefined) => void)[]>();
  async function flush() {
    const batch = asks;
    asks = new Map();
    const d = await open();
    const answer = (k: string, r: Row | undefined) => batch.get(k)!.forEach((f) => f(r));
    if (!d) return batch.forEach((_, k) => answer(k, undefined));
    try {
      const os = d.transaction(store, 'readonly').objectStore(store);
      for (const k of batch.keys()) {
        const g = os.get(k);
        g.onsuccess = () => answer(k, g.result as Row | undefined);
        g.onerror = (e) => (e.preventDefault(), answer(k, undefined));
      }
    } catch {
      batch.forEach((_, k) => answer(k, undefined));
    }
  }
  const get = (k: string) =>
    new Promise<Row | undefined>((ok) => {
      const q = asks.get(k);
      if (q) return void q.push(ok);
      asks.set(k, [ok]);
      if (asks.size === 1) queueMicrotask(() => void flush());
    });
  return {
    async match(req) {
      const r = await get(keyOf(req));
      return r && r.b instanceof Blob ? new Response(r.b, { status: r.s || 200, headers: r.t ? { 'content-type': r.t } : {} }) : undefined;
    },
    async put(req, res) {
      // (the body read first: a transaction ends at the first await that isn't its own)
      const row: Row = { b: await res.blob(), t: res.headers.get('content-type') ?? '', s: res.status };
      const d = await open();
      if (!d) return;
      try {
        const t = d.transaction(store, 'readwrite');
        t.objectStore(store).put(row, keyOf(req));
        await done(t);
      } catch {
        // (full, unavailable: fetched again next time)
      }
    },
    async delete(req) {
      const d = await open();
      if (!d) return false;
      try {
        const t = d.transaction(store, 'readwrite');
        t.objectStore(store).delete(keyOf(req));
        return await done(t);
      } catch {
        return false;
      }
    },
    async keys() {
      const d = await open();
      if (!d) return [];
      try {
        const r = d.transaction(store, 'readonly').objectStore(store).getAllKeys();
        return await new Promise((ok) => ((r.onsuccess = () => ok((r.result as string[]).map((url) => ({ url })))), (r.onerror = () => ok([]))));
      } catch {
        return [];
      }
    }
  };
}

/** A Cache API cache's files moved into `to` (a deploy's first worker: the room's and the art's, ~1,500 entries out of
 *  the origin's Cache Storage), CHUNK a turn with a pause between (never in a launch's way: after its end), each
 *  deleted once copied; the cache itself deleted once empty. Resolves when it's over (or there was nothing). */
export async function moveCache(name: string, to: FileStore, { chunk = 40, gapMs = 50, cs = globalThis.caches }: { chunk?: number; gapMs?: number; cs?: CacheStorage } = {}): Promise<void> {
  if (!cs || !(await cs.has(name))) return;
  const from = await cs.open(name);
  for (;;) {
    const keys = (await from.keys()).slice(0, chunk);
    if (!keys.length) break;
    for (const k of keys) {
      const res = await from.match(k);
      if (res?.ok) await to.put(k.url, res);
      await from.delete(k);
    }
    await new Promise((ok) => setTimeout(ok, gapMs));
  }
  await cs.delete(name);
}

/** Each store's entries (storage.use: sync/cacheSizes.ts, beside the Cache API's). */
export async function storeCounts(): Promise<Partial<Record<StoreName, number>>> {
  const d = await open();
  if (!d) return {};
  const out: Partial<Record<StoreName, number>> = {};
  for (const s of STORES) {
    try {
      const r = d.transaction(s, 'readonly').objectStore(s).count();
      out[s] = await new Promise<number>((ok) => ((r.onsuccess = () => ok(r.result)), (r.onerror = () => ok(0))));
    } catch {
      /* left out */
    }
  }
  return out;
}
