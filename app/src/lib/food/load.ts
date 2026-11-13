// The meal log's IO edge: the food data from static/food/ (scripts/food-data.ts), fetched when the food sheet first
// opens, never at install (service worker: cached on first use under its `?v=`, so it works offline after that).
// index.json first (past the HTTP cache: it names the version), then the core datasets and verify.json together; the
// lazy ones (products, 2.7 MB; for a member, the chain menus from the relay: kalori.ts) only once asked for
// (`db.wantMore`: the search's open), in `db.more`. A dataset that fails to load is left out (its items unsearchable)
// till a retry at its next chance brings it (`chance`: the caller's, ui-state/retry.ts nextChance; none: no retry;
// `db.onAdd` says when one comes in, the search searching again);
// only a missing index.json fails the load. Each is indexed a slice per task (db.ts SLICE), never a long frame.
import { addDataset, emptyDb, withJan, type FoodDb } from './db.ts';
import type { Dataset, FoodIndex, Verify } from './types.ts';
import type { Parsed } from './dataset.worker.ts';
import { fetchKalori, Refused } from './kalori.ts';
import { quiet, swallowed } from '#lib/quiet.ts';
import { reportKeyed } from '#lib/keyed.ts';
import { staticUrl } from '#lib/staticUrl.ts';

/** A failed dataset's retries (at its next chances) before it's left out for the session. */
const RETRIES = 4;

const url = (file: string, v?: string): string => `${staticUrl(`food/${file}`)}${v ? `?v=${encodeURIComponent(v)}` : ''}`;

async function json<T>(href: string, init?: RequestInit): Promise<T> {
  const res = await fetch(href, init);
  if (!res.ok) throw new Error(`${href}: ${res.status}`);
  return (await res.json()) as T;
}

/** Back to the event loop: a frame, a keystroke go first. */
const pause = (): Promise<void> => new Promise((ok) => setTimeout(ok, 0));

/** The chain menus' address and this phone's key (components/food/dbHold.ts kaloriSource: a member's, paired). */
export interface KaloriSource {
  href: string;
  key: string;
}
/** The chain menus as a dataset: secondary and lazy, not in index.json (db.ts ranks them under the other secondary
 *  ones). */
const KALORI: FoodIndex['datasets'][number] = { file: 'kalori', source: 'kalori', badge: '店', secondary: true, lazy: true };

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
    const m = e.data;
    // (the worker's chain-menu miss: logged here, keyed.fail)
    if ('keyed' in m) return reportKeyed(m.keyed.url, m.keyed.why, m.keyed.http);
    const p = parsing.get(m.id);
    if (!p) return;
    if ('items' in m) {
      for (const it of m.items) p.items.push(it);
      return;
    }
    parsing.delete(m.id);
    if ('head' in m) p.ok({ ...m.head, items: p.items });
    else p.no(m.refused ? new Refused(m.error) : new Error(m.error));
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

/** A dataset file (with `key`: the chain menus, kalori.ts), fetched and parsed in the worker (its items' barcodes and
 *  search keys in), or here without one. */
function fetchDataset(href: string, key?: string): Promise<Dataset> {
  const w = startParser();
  if (!w) return (key ? fetchKalori(href, key) : json<Dataset>(href)).then(withJan);
  const id = nextId++;
  return new Promise((ok, no) => {
    parsing.set(id, { items: [], ok, no });
    w.postMessage({ id, href: new URL(href, location.href).href, key });
  });
}

/** `chance(n)`: when to fetch a failed dataset again (its `n`-th retry); none: it stays out. `kalori`: where the chain
 *  menus come from, asked at `wantMore` (null: none for this phone). */
export async function loadFoodDb(chance?: (n: number) => Promise<void>, kalori?: () => KaloriSource | null): Promise<FoodDb> {
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
  // (the relay's no to the chain menus is final: kalori.ts Refused)
  // (the log: once an incident, its first failure and, the retries spent, its giving up: `swallow:food.load` /
  // `food.gaveup`, the chain menus' `food.kalori` / `food.kalori.gaveup` / `food.kalori.refused`)
  type Get = () => Promise<Dataset>;
  const tag = (meta: FoodIndex['datasets'][number]) => (meta === KALORI ? 'food.kalori' : 'food');
  const again = (meta: FoodIndex['datasets'][number], get: Get, n: number): void =>
    void chance?.(n).then(() => get().then((d) => void add(meta, d), (e) => {
      if (e instanceof Refused) return swallowed(`${tag(meta)}.refused`);
      if (n < RETRIES) again(meta, get, n + 1);
      else swallowed(`${tag(meta)}.gaveup`);
    }));
  const load = (meta: FoodIndex['datasets'][number], get: Get = () => fetchDataset(url(meta.file, index.version))) =>
    get().then((d) => add(meta, d), (e) => {
      if (e instanceof Refused) return swallowed(`${tag(meta)}.refused`);
      swallowed(meta === KALORI ? 'food.kalori' : 'food.load');
      again(meta, get, 0);
    });
  const core = index.datasets.filter((d) => !d.lazy);
  const lazy = index.datasets.filter((d) => d.lazy);
  // all at once, added in the order they arrive (search ranks by match, not by file)
  const [verify] = await Promise.all([quiet(json<Verify>(url('verify.json', index.version)), 'food.verify', null), ...core.map((d) => load(d))]);
  db.verify = verify;
  const chains = () => {
    const k = kalori?.();
    return k && load(KALORI, () => fetchDataset(k.href, k.key));
  };
  let wanted: Promise<void> | null = null, settle = () => {};
  db.more = new Promise<void>((ok) => (settle = ok));
  db.wantMore = () => {
    if (!wanted) db.pending = true;
    const done = () => ((db.pending = false), settle());
    wanted ??= Promise.all([...lazy.map((d) => load(d)), chains()]).then(done, done);
    return db.more;
  };
  return db;
}
