// The food catalog in memory: the datasets as they load (index.json's order), their search index and the
// cross-source verify groups, with the lookups the food sheet uses. Pure: load.ts fetches.
import { entryOf, search, SECONDARY_PENALTY, type Entry } from './search.ts';
import type { Credit, Dataset, FoodIndex, Item, Verify, VerifyGroup } from './types.ts';

export interface FoodDb {
  /** index.json's content version: the data files' `?v=`. */
  version: string;
  /** The datasets loaded so far, each with its badge (「MEXT」, 「給食」) and credit line. */
  sets: (Partial<Credit> & { source: string; badge: string })[];
  /** Grows when a lazy dataset (products) is in. */
  entries: Entry[];
  verify: Verify | null;
  /** Settles once the lazy datasets are in (or failed): search again then. */
  more: Promise<void>;
}

export const emptyDb = (index: FoodIndex): FoodDb => ({ version: index.version, sets: [], entries: [], verify: null, more: Promise.resolve() });

/** Items indexed per slice: a dataset is added a slice per task (load.ts), so no frame waits on a whole file. */
export const SLICE = 2000;

/** A dataset into the catalog: its items searchable (a `secondary` one's ranked lower), its header credited. With
 *  `pause`, a slice at a time, awaiting it in between (the slices stay in order and together). */
export async function addDataset(db: FoodDb, meta: FoodIndex['datasets'][number], data: Dataset, pause?: () => Promise<void>): Promise<void> {
  const { label, attribution, license, url } = data;
  db.sets.push({ source: meta.source, badge: meta.badge, label, attribution, license, url });
  const pen = meta.secondary ? SECONDARY_PENALTY : 0;
  const items = data.items;
  for (let i = 0; i < items.length; i += SLICE) {
    if (i && pause) await pause();
    for (let j = i; j < Math.min(items.length, i + SLICE); j++) db.entries.push(entryOf(items[j], pen));
  }
}

/** The best `limit` items for a query (search.ts: exact > prefix > substring > alias, one row per verify group). */
export const searchFoods = (db: FoodDb, query: string, limit = 60): Item[] => search(db.entries, query, limit, (id) => db.verify?.byId[id]);

/** The item's cross-source group: how many independent sources agree (n ≥ 2: confirmed) and each one's kcal / 100 g. */
export function verifyOf(db: FoodDb, id: string): VerifyGroup | null {
  const g = db.verify?.byId[id];
  return (g !== undefined && db.verify?.groups[g]) || null;
}

/** The credit lines to show: each loaded dataset's, then the verify sources that are not a dataset (USDA), by label
 *  once. */
export function credits(db: FoodDb): Credit[] {
  const sources = new Set(db.sets.map((s) => s.source));
  const extra = Object.entries(db.verify?.sources ?? {})
    .filter(([src]) => !sources.has(src))
    .map(([, s]) => (typeof s === 'string' ? { label: s } : s));
  const out = new Map<string, Credit>();
  for (const c of [...db.sets, ...extra]) {
    if (c.label && !out.has(c.label)) out.set(c.label, { label: c.label, attribution: c.attribution ?? '', license: c.license ?? '', url: c.url ?? '' });
  }
  return [...out.values()];
}
