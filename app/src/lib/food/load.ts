// The meal log's IO edge: the food data from static/food/ (scripts/food-data.ts), fetched when the food sheet first
// opens, never at install (service worker: cached on first use under its `?v=`, so it works offline after that).
// index.json first (past the HTTP cache: it names each file's version, fileV), then the core datasets and verify.json
// together; the lazy ones (the products, 30k by column, 4 MB; the chain menus, Kalori) only once asked for
// (`db.wantMore`: all at the search's open, a logged entry's own for its day). A dataset that fails to load is left
// out (its items unsearchable) till a retry at its next chance brings it (`chance`: the caller's, ui-state/retry.ts
// nextChance; none: no retry; `db.onAdd` says when one comes in, the search searching again); only a missing
// index.json fails the load. Each is indexed a slice per task (db.ts SLICE), never a long frame.
import { addDataset, emptyDb, FOOD_SCHEMA, fromFile, type FoodDb } from './db.ts';
import { janShard } from './jan.ts';
import type { Dataset, FoodIndex, Item, Shipped, Verify } from './types.ts';
import type { Parsed } from './dataset.worker.ts';
import { quiet, swallowed } from '#lib/quiet.ts';
import { staticUrl } from '#lib/staticUrl.ts';

/** A failed dataset's retries (at its next chances) before it's left out for the session. */
const RETRIES = 4;

const url = (file: string, v?: string): string => `${staticUrl(`food/${file}`)}${v ? `?v=${encodeURIComponent(v)}` : ''}`;
/** A data file's `?v=`: its own (index.json's `files`). The service worker's foodFiles reads it the same way. */
const fileV = (index: FoodIndex, file: string): string => index.files[file];

async function json<T>(href: string, init?: RequestInit): Promise<T> {
  const res = await fetch(href, init);
  if (!res.ok) throw new Error(`${href}: ${res.status}`);
  return (await res.json()) as T;
}

/** Back to the event loop: a frame, a keystroke go first. */
const pause = (): Promise<void> => new Promise((ok) => setTimeout(ok, 0));

/** The parsing worker (null: none to be had, parse here) and the datasets it's parsing, by request id (each with its
 *  strings pool: interned). */
let parser: Worker | null | undefined;
const parsing = new Map<number, { items: Dataset['items']; pool: Map<string, string>; ok: (d: Dataset) => void; no: (e: Error) => void }>();

/** A slice's items, in: their repeated strings (a shop's id and name, a category, a trust mark) one copy each, not
 *  one per item as the structured clone makes them (the catalog with the chain menus' 18k items: 32.0 → 29.7 MB of
 *  heap, V8, 2026-11-13). */
function intern(items: Dataset['items'], into: Dataset['items'], pool: Map<string, string>): void {
  const one = (s: string): string => pool.get(s) ?? (pool.set(s, s), s);
  for (const it of items) {
    if (it.shop) it.shop = one(it.shop);
    if (it.brand) it.brand = one(it.brand);
    if (it.cat) it.cat = one(it.cat);
    if (it.est) it.est = one(it.est) as typeof it.est;
    into.push(it);
  }
}
let nextId = 0;

function startParser(): Worker | null {
  if (parser !== undefined || typeof Worker === 'undefined') return parser ?? null;
  try {
    parser = new Worker(new URL('./dataset.worker.ts', import.meta.url), { type: 'module' });
  } catch {
    return (parser = null);
  }
  parser.onmessage = (e: MessageEvent<Parsed>) => {
    const m = e.data;
    const p = parsing.get(m.id);
    if (!p) return;
    if ('items' in m) return intern(m.items, p.items, p.pool);
    parsing.delete(m.id);
    if ('head' in m) p.ok({ ...m.head, items: p.items });
    else p.no(new Error(m.error));
    // (nothing left to parse: let it go; a later dataset (the products, a retry) starts another)
    if (!parsing.size) {
      parser?.terminate();
      parser = undefined;
    }
  };
  // (a worker that can't start or run: what it was parsing fails, to be fetched again at its next chance, here)
  parser.onerror = parser.onmessageerror = () => {
    parser?.terminate();
    parser = null;
    for (const p of parsing.values()) p.no(new Error('food parser failed'));
    parsing.clear();
  };
  return parser;
}

/** A dataset file, fetched and parsed in the worker (its items' barcodes and search keys in), or here without one;
 *  `mine`: its catalog's parses in flight (by id), for its close. */
function fetchDataset(href: string, mine: Set<number>): Promise<Dataset> {
  const w = startParser();
  if (!w) return json<Shipped>(href).then((f) => fromFile(byColumn(f, href)));
  const id = nextId++;
  mine.add(id);
  return new Promise<Dataset>((ok, no) => {
    parsing.set(id, { items: [], pool: new Map(), ok, no });
    w.postMessage({ id, href: new URL(href, location.href).href });
  }).finally(() => mine.delete(id));
}

/** A dataset file by column, else an error (a file of another layout: left out like a failed fetch, logged
 *  `swallow:food.load`, never an empty dataset in silence). The worker's own check is the same. */
function byColumn(f: Shipped, href: string): Shipped {
  if (!Array.isArray(f?.cols?.id)) throw new Error(`${href}: not by column`);
  return f;
}

/** Parses let go (their catalog closed): out of `parsing` (a slice still coming finds nothing: dropped), failed, and the
 *  worker let go once nothing is left to parse. */
function cancelParses(ids: Iterable<number>): void {
  for (const id of [...ids]) {
    const p = parsing.get(id);
    if (!p) continue;
    parsing.delete(id);
    p.no(new Error('food load let go'));
  }
  if (!parsing.size && parser) {
    parser.terminate();
    parser = undefined;
  }
}

/** The barcode shards fetched this session, by name (each ~1 KB; the service worker keeps them across sessions). */
const shards = new Map<string, Promise<Map<string, Item>>>();

/** A code's food in the barcode shards (static/food/jan/: the codes beyond products.json), `db`'s version of them;
 *  null when its shard hasn't it (or there are none). A fetch that fails (offline) throws, and is asked again next time. */
export async function janItem(db: FoodDb, code: string): Promise<Item | null> {
  if (!db.jan || !/^\d{8,13}$/.test(code)) return null;
  const href = url(`jan/${janShard(code)}.json`, db.jan);
  let p = shards.get(href);
  if (!p) {
    p = fetch(href).then(async (res) => {
      if (res.status === 404) return new Map<string, Item>();
      if (!res.ok) throw new Error(`${href}: ${res.status}`);
      return new Map(fromFile((await res.json()) as Shipped).items.map((it) => [it.jan ?? it.id.slice(4), it]));
    });
    shards.set(href, p);
    p.catch(() => shards.delete(href));
  }
  return (await p).get(code) ?? null;
}

/** Forget the shards fetched (tests). */
export const forgetShards = (): void => shards.clear();

/** The food data is a later layout than this app reads (index.json `schema` past FOOD_SCHEMA): nothing fetched; the
 *  deployed build reads it (dbHold asks Kit for it). */
export class NewerFoodData extends Error {}

/** `chance(n)`: when to fetch a failed dataset again (its `n`-th retry); none: it stays out. */
export async function loadFoodDb(chance?: (n: number) => Promise<void>): Promise<FoodDb> {
  const index = await json<FoodIndex>(url('index.json'), { cache: 'no-cache' });
  if (typeof index.schema === 'number' && index.schema > FOOD_SCHEMA) {
    swallowed('food.schema');
    throw new NewerFoodData(`food data schema ${index.schema}, this app reads ${FOOD_SCHEMA}`);
  }
  if (!index.files || typeof index.files !== 'object') throw new Error('food index.json without files');
  const db = emptyDb(index);
  // (its close: what's still loading dropped, never retried or added)
  const mine = new Set<number>();
  let closed = false;
  db.close = () => {
    closed = true;
    cancelParses(mine);
  };
  // One dataset indexed at a time, in slices, in the order they arrive: a core one's keys come built
  // (scripts/food-data.ts), a lazy one's in the worker (or here, in its slices: db.ts entryOf), its barcodes first.
  let indexing = Promise.resolve();
  // (a dataset that fails is fetched again at its next chance, a few times, and added when it comes; the load itself
  // never waits for it)
  const listeners = new Set<() => void>();
  db.onAdd = (f) => (listeners.add(f), () => void listeners.delete(f));
  // (a close stops an indexing at its next slice: the chain of slices would otherwise keep the catalog alive till done)
  const step = (): Promise<void> => (closed ? Promise.reject(new Error('food load let go')) : pause());
  const add = (meta: FoodIndex['datasets'][number], d: Dataset) =>
    closed ? undefined : (indexing = indexing.then(() => (closed ? undefined : addDataset(db, meta, d, step))).then(() => listeners.forEach((f) => f()), () => void (closed || swallowed('food.index'))));
  // (the log: once an incident, its first failure and, the retries spent, its giving up: `swallow:food.load` /
  // `food.gaveup`)
  const get = (meta: FoodIndex['datasets'][number]) =>
    closed ? Promise.reject(new Error('food load let go')) : fetchDataset(url(meta.file, fileV(index, meta.file)), mine);
  const again = (meta: FoodIndex['datasets'][number], n: number): void =>
    void chance?.(n).then(() => closed ? undefined : get(meta).then((d) => void add(meta, d), () => {
      if (closed) return;
      if (n < RETRIES) again(meta, n + 1);
      else swallowed('food.gaveup');
    }));
  const load = (meta: FoodIndex['datasets'][number]) =>
    get(meta).then((d) => add(meta, d), () => {
      if (closed) return;
      swallowed('food.load');
      again(meta, 0);
    });
  const core = index.datasets.filter((d) => !d.lazy);
  const lazy = index.datasets.filter((d) => d.lazy);
  // all at once, added in the order they arrive (search ranks by match, not by file)
  const [verify] = await Promise.all([quiet(json<Verify>(url('verify.json', fileV(index, 'verify.json'))), 'food.verify', null), ...core.map((d) => load(d))]);
  db.verify = verify;
  // (each lazy dataset fetched once, when first wanted: all of them for a search, an entry's alone for a day with it)
  const asked = new Map<string, Promise<void>>();
  let waiting = 0;
  db.wantMore = (sources) => {
    const sets = lazy.filter((d) => !sources || sources.includes(d.source));
    for (const d of sets) {
      if (asked.has(d.file)) continue;
      waiting++;
      db.pending = true;
      const done = () => void (db.pending = --waiting > 0);
      asked.set(d.file, load(d).then(done, done));
    }
    return Promise.all(sets.map((d) => asked.get(d.file))).then(() => {});
  };
  return db;
}
