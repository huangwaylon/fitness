// The meal log's IO edge: the food data from static/food/ (scripts/food-data.ts), fetched when the food sheet first
// opens, never at install (service worker: cached on first use under its `?v=`, so it works offline after that).
// index.json first (past the HTTP cache: it names each file's version, fileV), then the core datasets and verify.json
// together; the lazy ones (products, 2.7 MB; the chain menus, Kalori) only once asked for
// (`db.wantMore`: the search's open), in `db.more`. A dataset that fails to load is left out (its items unsearchable)
// till a retry at its next chance brings it (`chance`: the caller's, ui-state/retry.ts nextChance; none: no retry;
// `db.onAdd` says when one comes in, the search searching again);
// only a missing index.json fails the load. Each is indexed a slice per task (db.ts SLICE), never a long frame.
import { addDataset, emptyDb, withJan, type FoodDb } from './db.ts';
import type { Dataset, FoodIndex, Verify } from './types.ts';
import type { Parsed } from './dataset.worker.ts';
import { quiet, swallowed } from '#lib/quiet.ts';
import { staticUrl } from '#lib/staticUrl.ts';

/** A failed dataset's retries (at its next chances) before it's left out for the session. */
const RETRIES = 4;

const url = (file: string, v?: string): string => `${staticUrl(`food/${file}`)}${v ? `?v=${encodeURIComponent(v)}` : ''}`;
/** A data file's `?v=`: its own (index.json's `files`), else the index's `version` (an index from before them). The
 *  service worker's foodFiles reads it the same way. */
const fileV = (index: FoodIndex, file: string): string => index.files?.[file] ?? index.version;

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

/** A dataset file, fetched and parsed in the worker (its items' barcodes and search keys in), or here without one. */
function fetchDataset(href: string): Promise<Dataset> {
  const w = startParser();
  if (!w) return json<Dataset>(href).then(withJan);
  const id = nextId++;
  return new Promise((ok, no) => {
    parsing.set(id, { items: [], pool: new Map(), ok, no });
    w.postMessage({ id, href: new URL(href, location.href).href });
  });
}

/** `chance(n)`: when to fetch a failed dataset again (its `n`-th retry); none: it stays out. */
export async function loadFoodDb(chance?: (n: number) => Promise<void>): Promise<FoodDb> {
  const index = await json<FoodIndex>(url('index.json'), { cache: 'no-cache' });
  const db = emptyDb(index);
  // One dataset indexed at a time, in slices, in the order they arrive: a core one's keys come built
  // (scripts/food-data.ts), a lazy one's in the worker (or here, in its slices: db.ts entryOf), its barcodes first.
  let indexing = Promise.resolve();
  // (a dataset that fails is fetched again at its next chance, a few times, and added when it comes; the load itself
  // never waits for it)
  const listeners = new Set<() => void>();
  db.onAdd = (f) => (listeners.add(f), () => void listeners.delete(f));
  const add = (meta: FoodIndex['datasets'][number], d: Dataset) =>
    (indexing = indexing.then(() => addDataset(db, meta, d, pause)).then(() => listeners.forEach((f) => f()), () => swallowed('food.index')));
  // (the log: once an incident, its first failure and, the retries spent, its giving up: `swallow:food.load` /
  // `food.gaveup`)
  const get = (meta: FoodIndex['datasets'][number]) => fetchDataset(url(meta.file, fileV(index, meta.file)));
  const again = (meta: FoodIndex['datasets'][number], n: number): void =>
    void chance?.(n).then(() => get(meta).then((d) => void add(meta, d), () => {
      if (n < RETRIES) again(meta, n + 1);
      else swallowed('food.gaveup');
    }));
  const load = (meta: FoodIndex['datasets'][number]) =>
    get(meta).then((d) => add(meta, d), () => {
      swallowed('food.load');
      again(meta, 0);
    });
  const core = index.datasets.filter((d) => !d.lazy);
  const lazy = index.datasets.filter((d) => d.lazy);
  // all at once, added in the order they arrive (search ranks by match, not by file)
  const [verify] = await Promise.all([quiet(json<Verify>(url('verify.json', fileV(index, 'verify.json'))), 'food.verify', null), ...core.map((d) => load(d))]);
  db.verify = verify;
  let wanted: Promise<void> | null = null, settle = () => {};
  db.more = new Promise<void>((ok) => (settle = ok));
  db.wantMore = () => {
    if (!wanted) db.pending = true;
    const done = () => ((db.pending = false), settle());
    wanted ??= Promise.all(lazy.map((d) => load(d))).then(done, done);
    return db.more;
  };
  return db;
}
