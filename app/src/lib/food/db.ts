// The food catalog in memory: the datasets as they load (index.json's order), their search index and the
// cross-source verify groups, with the lookups the food sheet uses. Pure: load.ts fetches.
import { entryOf, headOf, nearby, PRODUCT_PENALTY, search, SECONDARY_PENALTY, type Entry } from './search.ts';
import { searchKey } from './text.ts';
import type { Credit, Dataset, FoodIndex, Item, Shipped, Verify, VerifyGroup } from './types.ts';

export interface FoodDb {
  /** index.json's content version: the data files' `?v=`. */
  version: string;
  /** The datasets loaded so far, each with its badge (「MEXT」, 「給食」) and credit line. */
  sets: (Partial<Credit> & { source: string; badge: string })[];
  /** Grows when a lazy dataset (products, the chain menus) is in. */
  entries: Entry[];
  verify: Verify | null;
  /** Each item by its id (the first dataset's, should two hold one): an entry's food in O(1), never a scan of 20k. */
  byId: Map<string, Item>;
  /** Each food in its states (`vg` → its items, in the chips' order: variantsOf). */
  variants: Map<string, Item[]>;
  /** The chain menus' shops (Kalori's header `shops`): each name's and alias's key → the shop's id (a query naming
   *  one: shopIn). */
  shopKeys: Map<string, string>;
  /** The lazy datasets (products, the chain menus) fetched now, each once: all for the search's open, only `sources`'
   *  (index.json's `source`: lazySources) for a day with one logged; never the sheet's open. Settles once they're in
   *  (or failed): search again then. */
  wantMore(sources?: readonly string[]): Promise<void>;
  /** The lazy datasets asked for and not yet in (or failed): a search says 読み込み中, never 見つかりませんでした. */
  pending: boolean;
  /** `f` called each time a dataset is added after the load (a lazy one, one fetched again): search again; the stop. */
  onAdd(f: () => void): () => void;
  /** The catalog let go (dbHold's drop): a dataset still loading for it is dropped, its parse in the worker cancelled
   *  (the chain menus' items, ~35 MB as they arrive, would stay alive till that parse ended), never retried or added. */
  close(): void;
}

export const emptyDb = (index: FoodIndex): FoodDb => ({ version: index.version, sets: [], entries: [], verify: null, byId: new Map(), variants: new Map(), shopKeys: new Map(), pending: false, wantMore: () => Promise.resolve(), onAdd: () => () => {}, close: () => {} });

/** The lazy datasets' sources by their ids' prefix: a product's (`off:`) or a chain menu's (`kal:`). */
const LAZY_PREFIX: Record<string, string> = { 'off:': 'off', 'kal:': 'kalori' };
/** The lazy datasets (index.json `source`) foods with these ids come from: what a day's entries need (wantMore). */
export const lazySources = (ids: Iterable<string>): string[] => {
  const out = new Set<string>();
  for (const id of ids) {
    const s = LAZY_PREFIX[id.slice(0, 4)];
    if (s) out.add(s);
  }
  return [...out];
};

/** Items indexed per slice: a dataset is added a slice per task (load.ts), so no frame waits on a whole file. */
export const SLICE = 2000;

/** The packaged products' datasets (Open Food Facts, the JBFD's 市販品): ranked a little under the other secondary
 *  ones (search.ts PRODUCT_PENALTY). */
const PRODUCT_SOURCES: ReadonlySet<string> = new Set(['off', 'jbfd']);
/** The chain menus (Kalori, a lazy dataset): a little under the other secondary ones, over the products: 牛丼 finds
 *  牛丼（並盛） before a chain's. */
const KALORI_PENALTY = 0.25;

/** A dataset into the catalog: its items searchable (a `secondary` one's ranked lower, a product's or a chain menu's
 *  lower still), its header credited. With `pause`, a slice at a time, awaiting it in between (the slices stay in order and together). */
export async function addDataset(db: FoodDb, meta: FoodIndex['datasets'][number], data: Dataset, pause?: () => Promise<void>): Promise<void> {
  const { label, attribution, license, url } = data;
  db.sets.push({ source: meta.source, badge: meta.badge, label, attribution, license, url });
  const pen = (meta.secondary ? SECONDARY_PENALTY : 0) + (PRODUCT_SOURCES.has(meta.source) ? PRODUCT_PENALTY : meta.source === 'kalori' ? KALORI_PENALTY : 0);
  if (data.shops) addShops(db, data.shops);
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

/** A chain menu's shops into the catalog, each by its name (セブン-イレブン typed with or without its dash) and our
 *  short names. A key that is a food's (its name, its head, an alias: a shop called 唐揚げ; the products' aside, which
 *  name their makers) never names the shop: the food's search stays the food's. */
function addShops(db: FoodDb, shops: NonNullable<Dataset['shops']>): void {
  const foods = new Set(db.entries.flatMap((e) => (e.pen > SECONDARY_PENALTY ? [] : [e.n, headOf(e.it.name), ...e.al])));
  for (const [id, s] of Object.entries(shops)) {
    const keys = [s.name, ...(s.aliases ?? [])].map(searchKey).flatMap((k) => [k, k.replace(/(?<=[ぁ-ゖ])ー(?=[ぁ-ゖ])/g, '')]);
    for (const k of keys) if (k.length >= 2 && !foods.has(k) && !db.shopKeys.has(k)) db.shopKeys.set(k, id);
  }
}

/** Words of a query that name a chain's shop (one, or a name typed in two or three words: 「ローソン ストア100」): its
 *  id and the query without them; null when none does. */
export function shopIn(db: FoodDb, query: string): { shop: string; rest: string } | null {
  if (!db.shopKeys.size) return null;
  const words = query.trim().split(/[\s　]+/).filter(Boolean);
  for (let n = Math.min(3, words.length); n >= 1; n--) {
    for (let i = 0; i + n <= words.length; i++) {
      const shop = db.shopKeys.get(searchKey(words.slice(i, i + n).join('')));
      if (shop) return { shop, rest: [...words.slice(0, i), ...words.slice(i + n)].join(' ') };
    }
  }
  return null;
}

/** A shop chip (FoodSearch): a chain's id, its name and how many of its foods the query finds. */
export interface ShopHit {
  shop: string;
  name: string;
  n: number;
}

/** The chain menus' shops holding every word of a query (no shop named in it: shopIn), the most foods first (a food
 *  in its states once), each with its name; the chips under the search's field (FoodSearch, from findFoods). */
export const shopsFor = (db: FoodDb, query: string): ShopHit[] => findFoods(db, query, 1).shops;
/** The values a column keeps when null (unknown, as the objects had them); another column's null is no field. */
const NULLS: ReadonlySet<string> = new Set(['p', 'f', 'c', 'salt']);

/** How many items a file holds, either way it's shipped. */
export const countOf = (d: Shipped): number => ('cols' in d && d.cols ? (d.cols.id?.length ?? 0) : (d.items?.length ?? 0));

/** A file's header: what's left without its items or columns. */
export function headerOf(d: Shipped): Omit<Dataset, 'items'> {
  const { items: _i, cols: _c, idPrefix: _p, ...head } = d as Shipped & { cols?: unknown; idPrefix?: unknown };
  return head;
}

/** A columnar file's items `from` to `to` (types.ts Shipped), as the objects an older file had: a slice at a time in the
 *  worker, so the whole file is never twice in memory. */
export function decodeItems(d: Shipped, from = 0, to = countOf(d)): Item[] {
  if (!('cols' in d) || !d.cols) return d.items!.slice(from, to);
  const cols = Object.entries(d.cols) as [string, unknown[]][];
  const prefix = d.idPrefix ?? '';
  const out: Item[] = [];
  for (let i = from; i < Math.min(to, countOf(d)); i++) {
    const it: Record<string, unknown> = {};
    for (const [k, col] of cols) {
      const v = col[i];
      if (v !== null && v !== undefined) it[k] = k === 'id' ? prefix + (v as string) : v;
      else if (NULLS.has(k)) it[k] = null;
    }
    out.push(it as unknown as Item);
  }
  return out;
}

/** A file's items as objects (decodeItems; an older file's as they are), then a product's barcode back from its id
 *  (`off:<jan>`; scripts/food-data.ts drops it), for the search's keys; a chain menu's (Kalori: kalori_convert.py
 *  ships neither) `sv` and its shop's name as its `brand` (the header's `shops`), before its keys are built; a
 *  serving's lone 1食 portion left out (portionsOf's default for an `sv` item; older files shipped one). */
export function withJan(f: Shipped): Dataset {
  // (a file of neither shape, a later format: no items, never a throw that retries it)
  const d: Dataset = 'cols' in f && f.cols ? { ...headerOf(f), items: decodeItems(f) } : { ...(f as Dataset), items: f.items ?? [] };
  const shops = d.source === 'kalori' ? (d.shops ?? {}) : null;
  for (const it of d.items) {
    if (it.jan === undefined && it.id.startsWith('off:')) it.jan = it.id.slice(4);
    if (shops) {
      it.sv ??= true;
      if (it.shop) it.brand ??= shops[it.shop]?.name ?? it.shop;
    }
    if (it.sv && it.portions?.length === 1 && it.portions[0].g === 100 && it.portions[0].label === '1食') delete it.portions;
  }
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

/** The best `limit` items for a query (search.ts: exact > prefix > substring > alias, one row per verify group). A
 *  shop named in it (shopIn: セブン, スタバ, すき家) narrows it to that shop's menu, the other words searched within it
 *  (the shop's name alone: its whole menu); nothing there: the query as it is, over everything. */
export const searchFoods = (db: FoodDb, query: string, limit = 60): Item[] => findFoods(db, query, limit).items;

/** searchFoods' items and, from the same pass (a keystroke's one scan of the catalog), the shops its hits are on
 *  (shopsFor's chips: none once a shop is named, nor without the chain menus). */
export function findFoods(db: FoodDb, query: string, limit = 60): { items: Item[]; shops: ShopHit[] } {
  const groupOf = (id: string) => db.verify?.byId[id];
  const s = shopIn(db, query);
  const scoped = s ? search(db.entries.filter((e) => e.it.shop === s.shop), s.rest, limit, groupOf, true) : [];
  if (scoped.length) return { items: scoped, shops: [] };
  const by = new Map<string, ShopHit & { seen: Set<string> }>();
  const tally = (e: Entry): void => {
    const shop = e.it.shop;
    if (!shop) return;
    const t = by.get(shop) ?? by.set(shop, { shop, name: e.it.brand ?? shop, n: 0, seen: new Set() }).get(shop)!;
    const k = e.it.vg ?? e.it.id;
    if (!t.seen.has(k)) t.seen.add(k), t.n++;
  };
  const items = search(db.entries, query, limit, groupOf, false, s || !db.shopKeys.size ? undefined : tally);
  const shops = [...by.values()].sort((a, b) => b.n - a.n || a.name.localeCompare(b.name, 'ja')).map(({ shop, name, n }) => ({ shop, name, n }));
  return { items, shops };
}
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
