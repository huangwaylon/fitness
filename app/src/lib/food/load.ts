// The meal log's IO edge: the food data from static/food/ (scripts/food-data.ts), fetched when the food sheet first
// opens, never at install (service worker: cached on first use under its `?v=`, so it works offline after that).
// index.json first (past the HTTP cache: it names the version), then the core datasets and verify.json together; the
// lazy ones (products, 3 MB) after, in `db.more`. A dataset that fails to load is left out (its items unsearchable)
// till a retry at its next chance brings it (`chance`: the caller's, ui-state/retry.ts nextChance; none: no retry);
// only a missing index.json fails the load. Each is indexed a slice per task (db.ts SLICE), never a long frame.
import { asset } from '$app/paths';
import { addDataset, emptyDb, withJan, type FoodDb } from './db.ts';
import type { Dataset, FoodIndex, Verify } from './types.ts';
import type { Parsed } from './dataset.worker.ts';

/** A failed dataset's retries (at its next chances) before it's left out for the session. */
const RETRIES = 4;

const url = (file: string, v?: string): string => `${asset(`food/${file}` as Parameters<typeof asset>[0])}${v ? `?v=${encodeURIComponent(v)}` : ''}`;

async function json<T>(href: string, init?: RequestInit): Promise<T> {
  const res = await fetch(href, init);
  if (!res.ok) throw new Error(`${href}: ${res.status}`);
  return (await res.json()) as T;
}

/** Back to the event loop: a frame, a keystroke go first. */
const pause = (): Promise<void> => new Promise((ok) => setTimeout(ok, 0));

/** The parsing worker (null: none to be had, parse here) and the datasets it's parsing, by request id. */
let parser: Worker | null | undefined;
const parsing = new Map<number, { items: Dataset['items']; ok: (d: Dataset) => void; no: (e: Error) => void }>();
let nextId = 0;

function startParser(): Worker | null {
  if (parser !== undefined || typeof Worker === 'undefined') return parser ?? null;
  try {
    parser = new Worker(new URL('./dataset.worker.ts', import.meta.url), { type: 'module' });
  } catch {
    return (parser = null);
  }
  parser.onmessage = (e: MessageEvent<Parsed>) => {
    const m = e.data, p = parsing.get(m.id);
    if (!p) return;
    if ('items' in m) {
      for (const it of m.items) p.items.push(it);
      return;
    }
    parsing.delete(m.id);
    if ('head' in m) p.ok({ ...m.head, items: p.items });
    else p.no(new Error(m.error));
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
    parsing.set(id, { items: [], ok, no });
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
  const add = (meta: FoodIndex['datasets'][number], d: Dataset) => (indexing = indexing.then(() => addDataset(db, meta, d, pause)).catch(() => {}));
  const again = (meta: FoodIndex['datasets'][number], n: number): void =>
    void chance?.(n).then(() => fetchDataset(url(meta.file, index.version)).then((d) => void add(meta, d), () => n < RETRIES && again(meta, n + 1)));
  const load = (meta: FoodIndex['datasets'][number]) =>
    fetchDataset(url(meta.file, index.version)).then((d) => add(meta, d), () => again(meta, 0));
  const core = index.datasets.filter((d) => !d.lazy);
  const lazy = index.datasets.filter((d) => d.lazy);
  // all at once, added in the order they arrive (search ranks by match, not by file)
  const [verify] = await Promise.all([json<Verify>(url('verify.json', index.version)).catch(() => null), ...core.map(load)]);
  db.verify = verify;
  db.more = (async () => {
    for (const d of lazy) await load(d);
  })();
  return db;
}
