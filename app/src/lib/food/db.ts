// The food catalog in memory: the datasets as they load (index.json's order), their search index and the
// cross-source verify groups, with the lookups the food sheet uses. Pure: load.ts fetches.
import { entryOf, headOf, nearby, PRODUCT_PENALTY, search, SECONDARY_PENALTY, type Entry } from './search.ts';
import { searchKey } from './text.ts';
import type { Credit, Dataset, FoodIndex, Item, Shipped, Verify, VerifyGroup } from './types.ts';

export interface FoodDb {
  /** index.json's `jan`: the barcode shards' `?v=` (none: no shards). */
  jan?: string;
  /** index.json's `drop`: the barcodes the reviewed fixes drop (the scanner: not found, never asked of OFF). */
  drop: ReadonlySet<string>;
  /** The datasets loaded so far, each with its badge (「MEXT」, 「給食」) and credit line. */
  sets: (Partial<Credit> & { source: string; badge: string })[];
  /** Grows when a lazy dataset (products, the chain menus) is in. */
  entries: Entry[];
  verify: Verify | null;
  /** Each item by its id (the first dataset's, should two hold one): an entry's food in O(1), never a scan of 20k. */
  byId: Map<string, Item>;
  /** The shards' items asked for, by id: the barcode shards' (load.ts janItem: a scan, an entry's 最新の値にする), the
   *  chain menus' id shards' (wantIds); not searchable, so apart from byId (a scan's lookup tells ours from the
   *  shards'). itemById reads both. */
  shard: Map<string, Item>;
  /** Each food in its states (`vg` → its items, in the chips' order: variantsOf). */
  variants: Map<string, Item[]>;
  /** The chain menus' shops (Kalori's header `shops`): each name's and alias's key → the shop's id (a query naming
   *  one: shopIn). */
  shopKeys: Map<string, string>;
  /** The lazy datasets (products, the chain menus) fetched now, each once: all at the search's first keystroke, only
   *  `sources`' (index.json's `source`) for a scan or a day's (wantIds); never the sheet's or the search's open. Settles
   *  once they're in (or failed): search again then. */
  wantMore(sources?: readonly string[]): Promise<void>;
  /** The foods of these ids (a day's entries, さいきん's rows) without a search's datasets where it can: a chain menu's
   *  from its id shard (~11 KB of the 1.2 MB file; the file when the index has none) into `shard`, a product's the
   *  products' file. Settles once they're in, or failed (asked again next time); `onAdd`'s told when shard items came. */
  wantIds(ids: Iterable<string>): Promise<void>;
  /** The lazy datasets asked for and not yet in (or failed): a search says 読み込み中, never 見つかりませんでした. */
  pending: boolean;
  /** `f` called each time a dataset is added after the load (a lazy one, one fetched again): search again; the stop. */
  onAdd(f: () => void): () => void;
  /** The catalog let go (dbHold's drop): a dataset still loading for it is dropped, its parse in the worker cancelled
   *  (the chain menus' items, ~35 MB as they arrive, would stay alive till that parse ended), never retried or added. */
  close(): void;
  /** How long a load took (load.ts loadFoodDb's `timed`: the log's perf.food): a barcode shard's fetch says it here. */
  timed?: Timed;
}
/** A load's ms to searchable: `core` (index.json and the core datasets), a lazy dataset's source, `jan` a shard. */
export type Timed = (set: string, ms: number) => void;

export const emptyDb = (index: Partial<FoodIndex>): FoodDb => ({ jan: index.jan, drop: new Set(Array.isArray(index.drop) ? index.drop : []), sets: [], entries: [], verify: null, byId: new Map(), shard: new Map(), variants: new Map(), shopKeys: new Map(), pending: false, wantMore: () => Promise.resolve(), wantIds: () => Promise.resolve(), onAdd: () => () => {}, close: () => {} });

/** Items indexed per slice: a dataset is added a slice per task (load.ts), so no frame waits on a whole file. */
export const SLICE = 2000;

/** The packaged products' datasets (Open Food Facts, the JBFD's 市販品): ranked a little under the other secondary
 *  ones (search.ts PRODUCT_PENALTY). */
const PRODUCT_SOURCES: ReadonlySet<string> = new Set(['off', 'jbfd']);
/** The chain menus (Kalori, a lazy dataset): a little under the other secondary ones, over the products: 牛丼 finds
 *  牛丼（並盛） before a chain's. */
const KALORI_PENALTY = 0.25;

/** A chain menu whose kcal Kalori estimated (`est` `e`: all its values guessed), off its shop (search.ts Entry `ex`):
 *  1.25 tiers down, under a product of its name (味噌汁 finds the dishes' and a published one before 土間土間's guessed
 *  494 kcal). Only its PFC, fibre or salt estimated (`p`, `s`): its kcal the shop's own, its place kept (ラテ finds the
 *  chains' lattes among 30k products'). */
export const EST_PENALTY = 1.25;
/** An estimated one (any `est`) whose name is a core food's (its name, head or an alias: バナナ, 餃子) with a serving
 *  past 3× or under ⅓ of every such food's default portion (セイコーマート's バナナ 344 kcal to MEXT's 1本 93, あじへい's
 *  餃子 1,400 to a 6-piece plate's 328): 3 tiers down, under every generic match. */
export const IMPLAUSIBLE_PENALTY = 3;
const IMPLAUSIBLE_RATIO = 3;
/** Where a name's head ends (search.ts headOf). */
const HEAD_END = /[（(［[【\s　]/;

/** An item's kcal at its default portion (nutrition.ts portionsOf's first: its own, else 100 g; a serving's, `sv`, its
 *  kcal). */
const defaultKcal = (it: Item): number => (it.sv ? it.kcal : (it.kcal * (it.portions?.[0]?.g ?? 100)) / 100);

/** Each core food's keys (its name, head, aliases) → the lowest and highest default-portion kcal among them. */
function genericKcal(entries: readonly Entry[]): Map<string, [number, number]> {
  const out = new Map<string, [number, number]>();
  for (const e of entries) {
    if (e.pen > 0) continue;
    const kcal = defaultKcal(e.it);
    for (const k of [e.n, headOf(e.it.name), ...e.al]) {
      const r = out.get(k);
      if (!r) out.set(k, [kcal, kcal]);
      else (r[0] = Math.min(r[0], kcal)), (r[1] = Math.max(r[1], kcal));
    }
  }
  return out;
}

/** A chain menu's penalty off its shop (Entry `ex`; none for one the shop published whole): IMPLAUSIBLE_PENALTY for a
 *  serving (its kcal: Kalori's are per serving) far from its generic food's, else EST_PENALTY for a guessed kcal. */
export function chainPenalty(it: Item, e: Entry, generic: ReadonlyMap<string, readonly [number, number]>): number {
  if (!it.est) return 0;
  // (a head only for a name with one: no key built for the rest)
  const r = generic.get(e.n) ?? (HEAD_END.test(it.name) ? generic.get(headOf(it.name)) : undefined);
  const kcal = defaultKcal(it);
  return r && (kcal > IMPLAUSIBLE_RATIO * r[1] || kcal * IMPLAUSIBLE_RATIO < r[0]) ? IMPLAUSIBLE_PENALTY : it.est === 'e' ? EST_PENALTY : 0;
}

/** A dataset into the catalog: its items searchable (a `secondary` one's ranked lower, a product's or a chain menu's
 *  lower still), its header credited. With `pause`, a slice at a time, awaiting it in between (the slices stay in order and together). */
export async function addDataset(db: FoodDb, meta: FoodIndex['datasets'][number], data: Dataset, pause?: () => Promise<void>): Promise<void> {
  const { label, attribution, license, url } = data;
  db.sets.push({ source: meta.source, badge: meta.badge, label, attribution, license, url });
  const pen = (meta.secondary ? SECONDARY_PENALTY : 0) + (PRODUCT_SOURCES.has(meta.source) ? PRODUCT_PENALTY : meta.source === 'kalori' ? KALORI_PENALTY : 0);
  if (data.shops) addShops(db, data.shops);
  const items = data.items;
  const brands = new Map<string, readonly string[]>();
  // (the core foods' default kcal, for a chain menu's: the core datasets are in before a lazy one)
  const generic = meta.source === 'kalori' ? genericKcal(db.entries) : null;
  for (let i = 0; i < items.length; i += SLICE) {
    if (i && pause) await pause();
    for (let j = i; j < Math.min(items.length, i + SLICE); j++) {
      const it = items[j];
      const e = entryOf(it, pen, brands);
      const x = generic && it.est ? chainPenalty(it, e, generic) : 0;
      if (x) e.ex = x;
      db.entries.push(e);
      if (!db.byId.has(it.id)) db.byId.set(it.id, it);
      addVariant(db, it);
    }
  }
}

/** An item into its food's states (`vg`), in place of a copy of it already there (an id shard's, before its dataset). */
export function addVariant(db: FoodDb, it: Item): void {
  if (!it.vg) return;
  const vs = db.variants.get(it.vg) ?? db.variants.set(it.vg, []).get(it.vg)!;
  const at = vs.findIndex((x) => x.id === it.id);
  if (at < 0) vs.push(it);
  else vs[at] = it;
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
/** The shipped layout this app reads (index.json `schema`; scripts/food-data.ts writes it): 3, every dataset by column,
 *  a file's `delta` columns delta-coded (2: none; read the same). An index of a later one is refused (load.ts
 *  NewerFoodData). */
export const FOOD_SCHEMA = 3;

/** The values a column keeps when null (unknown, as the objects had them); another column's null is no field. */
const NULLS: ReadonlySet<string> = new Set(['p', 'f', 'c', 'salt']);
/** The columns' order: the rest after these, as the items first have them. */
const COLS = ['id', 'name', 'brand', 'cat', 'kcal', 'p', 'f', 'c', 'salt', 'portions'];

/** A dataset by column, as shipped (scripts/food-data.ts; the tests' files): each field's values in item order, `null`
 *  where an item has none (a field no item has: no column); ids without the `xxx:` prefix they all share (`idPrefix`).
 *  Throws on an id without that prefix, or a null its column can't keep. */
export function toColumns(d: Dataset): Shipped {
  const { items, ...head } = d;
  if (!items.length) return { ...head, idPrefix: '', cols: { id: [] } };
  const prefix = /^[^:]+:/.exec(items[0].id)?.[0];
  if (!prefix) throw new Error(`${items[0].id}: an id without a prefix`);
  const bad = items.find((it) => !it.id.startsWith(prefix));
  if (bad) throw new Error(`${bad.id}: an id without ${prefix}`);
  const lost = items.find((it) => Object.entries(it).some(([k, v]) => v === null && !NULLS.has(k)));
  if (lost) throw new Error(`${lost.id} has a null its column can't keep`);
  const keys = [...new Set([...COLS, ...items.flatMap((it) => Object.keys(it))])].filter((k) => items.some((it) => k in it)) as (keyof Item)[];
  const cols: Partial<Record<keyof Item, unknown[]>> = {};
  for (const k of keys) cols[k] = items.map((it) => (k === 'id' ? it.id.slice(prefix.length) : (it[k] ?? null)));
  return { ...head, idPrefix: prefix, cols };
}

/** A file's columns `keys` of whole numbers (an id's: as its string, without the prefix) delta-coded: each value its
 *  difference from the one before it (null kept, skipped): Kalori's ids and picture ids climb by 1 down a shop's menu,
 *  257 → 42 KB gzipped. Throws on a value that is not a whole number. */
export function deltaCode(s: Shipped, keys: readonly (keyof Item)[]): Shipped {
  const { delta: _, ...head } = s;
  const cols = { ...s.cols };
  const coded = keys.filter((k) => cols[k]);
  for (const k of coded) {
    let at = 0;
    cols[k] = cols[k]!.map((v) => {
      if (v === null) return null;
      const n = Number(v);
      if (!Number.isSafeInteger(n) || (k === 'id' && String(n) !== v)) throw new Error(`${String(v)}: not a whole number, its ${k} column can't be delta-coded`);
      const d = n - at;
      at = n;
      return d;
    });
  }
  return { ...head, cols, delta: coded };
}

/** A file's delta-coded columns back to their values, once, in place (decodeItems). */
function undelta(d: Shipped): void {
  for (const k of d.delta ?? []) {
    const col = d.cols[k];
    let at = 0;
    if (col) for (let i = 0; i < col.length; i++) if (col[i] !== null) col[i] = k === 'id' ? String((at += col[i] as number)) : (at += col[i] as number);
  }
  delete d.delta;
}

/** How many items a file holds (none for a file not by column: a later layout's, never a throw). */
export const countOf = (d: Shipped): number => (Array.isArray(d.cols?.id) ? d.cols.id.length : 0);

/** A file's header: what's left without its items or columns. */
export function headerOf(d: Shipped): Omit<Dataset, 'items'> {
  const { cols: _c, idPrefix: _p, delta: _d, ...head } = d;
  return head;
}

/** A file's items `from` to `to` (types.ts Shipped), as objects: a slice at a time in the worker, so the whole file is
 *  never twice in memory: its `delta` columns decoded first (once, in place). An older file's `keys` (shipped till
 *  2026-11-20) are left out: built on load. */
export function decodeItems(d: Shipped, from = 0, to = countOf(d)): Item[] {
  if (!countOf(d)) return [];
  undelta(d);
  const cols = (Object.entries(d.cols) as [string, unknown[]][]).filter(([k]) => k !== 'keys');
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

/** A file's items as objects (decodeItems), filled in (fillIn). A file not by column: no items (load.ts and the worker
 *  refuse one first). */
export const fromFile = (f: Shipped): Dataset => fillIn({ ...headerOf(f), items: decodeItems(f) });

/** Schema 2's fill-ins on decoded items: a product's barcode back from its id (`off:<jan>`; scripts/food-data.ts drops
 *  it), for the search's keys; a chain menu's (Kalori: kalori_convert.py ships neither) `sv` and its shop's name as its
 *  `brand` (the header's `shops`), before its keys are built (portionsOf gives an `sv` item its 1食). */
export function fillIn(d: Dataset): Dataset {
  const shops = d.source === 'kalori' ? (d.shops ?? {}) : null;
  for (const it of d.items) {
    if (it.jan === undefined && it.id.startsWith('off:')) it.jan = it.id.slice(4);
    if (shops) {
      it.sv ??= true;
      if (it.shop) it.brand ??= shops[it.shop]?.name ?? it.shop;
    }
  }
  return d;
}

/** The catalog's item of an id (a shard's when only it has it: `shard`), if the catalog is in and has it. */
export const itemById = (db: FoodDb | null, id: string): Item | undefined => db?.byId.get(id) ?? db?.shard.get(id);

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
    .map(([, s]) => s);
  const out = new Map<string, Credit>();
  for (const c of [...db.sets, ...extra]) {
    if (c.label && !out.has(c.label)) out.set(c.label, { label: c.label, attribution: c.attribution ?? '', license: c.license ?? '', url: c.url ?? '' });
  }
  return [...out.values()];
}
