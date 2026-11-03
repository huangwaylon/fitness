// The meal log's IO edge: the food data from static/food/ (scripts/food-data.ts), fetched when the food sheet first
// opens, never at install (service worker: cached on first use under its `?v=`, so it works offline after that).
// index.json first (past the HTTP cache: it names the version), then the core datasets and verify.json together; the
// lazy ones (products, 3 MB) after, in `db.more`. A dataset that fails to load is left out (its items unsearchable);
// only a missing index.json fails the load. Each is indexed a slice per task (db.ts SLICE), never a long frame.
import { asset } from '$app/paths';
import { addDataset, emptyDb, type FoodDb } from './db.ts';
import type { Dataset, FoodIndex, Verify } from './types.ts';

const url = (file: string, v?: string): string => `${asset(`food/${file}` as Parameters<typeof asset>[0])}${v ? `?v=${encodeURIComponent(v)}` : ''}`;

async function json<T>(href: string, init?: RequestInit): Promise<T> {
  const res = await fetch(href, init);
  if (!res.ok) throw new Error(`${href}: ${res.status}`);
  return (await res.json()) as T;
}

/** Back to the event loop: a frame, a keystroke go first. */
const pause = (): Promise<void> => new Promise((ok) => setTimeout(ok, 0));

export async function loadFoodDb(): Promise<FoodDb> {
  const index = await json<FoodIndex>(url('index.json'), { cache: 'no-cache' });
  const db = emptyDb(index);
  // One dataset indexed at a time, in slices (the keys come built: scripts/food-data.ts), in the order they arrive.
  let indexing = Promise.resolve();
  const load = (meta: FoodIndex['datasets'][number]) =>
    json<Dataset>(url(meta.file, index.version)).then((d) => (indexing = indexing.then(() => addDataset(db, meta, d, pause)).catch(() => {})), () => {});
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
