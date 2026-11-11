// The food catalog in memory: the datasets as they load (index.json's order), their search index and the
// cross-source verify groups, with the lookups the food sheet uses. Pure: load.ts fetches.
import { entryOf, nearby, PRODUCT_PENALTY, search, SECONDARY_PENALTY, type Entry } from './search.ts';
import type { Credit, Dataset, FoodIndex, Item, Verify, VerifyGroup } from './types.ts';

export interface FoodDb {
  /** index.json's content version: the data files' `?v=`. */
  version: string;
  /** The datasets loaded so far, each with its badge (「MEXT」, 「給食」) and credit line. */
  sets: (Partial<Credit> & { source: string; badge: string })[];
  /** Grows when a lazy dataset (products) is in. */
  entries: Entry[];
  verify: Verify | null;
  /** Each item by its id (the first dataset's, should two hold one): an entry's food in O(1), never a scan of 20k. */
  byId: Map<string, Item>;
  /** Each food in its states (`vg` → its items, in the chips' order: variantsOf). */
  variants: Map<string, Item[]>;
  /** Settles once the lazy datasets are in (or failed): search again then. Never before one asks for them (wantMore). */
  more: Promise<void>;
  /** The lazy datasets (products, 2.7 MB) fetched now, once: the search's open asks, never the sheet's (`more`). */
  wantMore(): Promise<void>;
  /** `f` called each time a dataset is added after the load (a lazy one, one fetched again): search again; the stop. */
  onAdd(f: () => void): () => void;
}

export const emptyDb = (index: FoodIndex): FoodDb => ({ version: index.version, sets: [], entries: [], verify: null, byId: new Map(), variants: new Map(), more: Promise.resolve(), wantMore: () => Promise.resolve(), onAdd: () => () => {} });

/** Items indexed per slice: a dataset is added a slice per task (load.ts), so no frame waits on a whole file. */
export const SLICE = 2000;

/** The packaged products' datasets (Open Food Facts, the JBFD's 市販品): ranked a little under the other secondary
 *  ones (search.ts PRODUCT_PENALTY). */
const PRODUCT_SOURCES: ReadonlySet<string> = new Set(['off', 'jbfd']);

/** A dataset into the catalog: its items searchable (a `secondary` one's ranked lower, a product's lower still), its
 *  header credited. With `pause`, a slice at a time, awaiting it in between (the slices stay in order and together). */
export async function addDataset(db: FoodDb, meta: FoodIndex['datasets'][number], data: Dataset, pause?: () => Promise<void>): Promise<void> {
  const { label, attribution, license, url } = data;
  db.sets.push({ source: meta.source, badge: meta.badge, label, attribution, license, url });
  const pen = (meta.secondary ? SECONDARY_PENALTY : 0) + (PRODUCT_SOURCES.has(meta.source) ? PRODUCT_PENALTY : 0);
  const items = data.items;
  for (let i = 0; i < items.length; i += SLICE) {
    if (i && pause) await pause();
    for (let j = i; j < Math.min(items.length, i + SLICE); j++) {
      const it = items[j];
      db.entries.push(entryOf(it, pen));
      if (!db.byId.has(it.id)) db.byId.set(it.id, it);
      if (it.vg) (db.variants.get(it.vg) ?? db.variants.set(it.vg, []).get(it.vg)!).push(it);
    }
  }
}

/** A product's barcode back from its id (`off:<jan>`; scripts/food-data.ts drops it), for the search's keys. */
export function withJan(d: Dataset): Dataset {
  for (const it of d.items) if (it.jan === undefined && it.id.startsWith('off:')) it.jan = it.id.slice(4);
  return d;
}

/** The catalog's item of an id, if the catalog is in and has it. */
export const itemById = (db: FoodDb | null, id: string): Item | undefined => db?.byId.get(id);

/** The states a food's chips offer (food-data's variant_groups), in process order; `st` the chip's label. */
const STATES = ['乾', '生', 'ゆで', '水煮', '蒸し', '焼き', 'レンジ', 'いため', 'ソテー'] as const;

/** A food's states, its own among them, in the chips' order (none for a food with one: []). */
export function variantsOf(db: FoodDb | null, it: Item): Item[] {
  const vs = it.vg ? db?.variants.get(it.vg) : undefined;
  if (!vs || vs.length < 2) return [];
  const at = (x: Item) => STATES.indexOf(x.st as (typeof STATES)[number]);
  return [...vs].sort((a, b) => at(a) - at(b));
}

/** The best `limit` items for a query (search.ts: exact > prefix > substring > alias, one row per verify group). */
export const searchFoods = (db: FoodDb, query: string, limit = 60): Item[] => search(db.entries, query, limit, (id) => db.verify?.byId[id]);
/** 近いもの for a query searchFoods finds nothing for (search.ts nearby: the names holding the most of it). */
export const nearFoods = (db: FoodDb, query: string, limit = 8): Item[] => nearby(db.entries, query, limit);

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
