// The meal log's food data as shipped in static/food/ (food-data/'s build, copied by scripts/food-data.ts; the
// format is in docs/food-data.md). Nutrients are per 100 g; 100 ml of a drink counts as 100 g.

/** A portion: the first of an item's is its default. */
export interface Portion {
  label: string;
  g: number;
}

/** A food as a dataset file has it. `id` = `<source>:<local id>`, unique across the files (`mext:01088`). */
export interface Item {
  id: string;
  /** Short Japanese display name; `full` the official or original one. */
  name: string;
  full?: string;
  en?: string;
  /** Extra search terms (readings, variants), never equal to `name`. */
  aliases?: string[];
  cat?: string;
  /** Packaged products only; a chain menu's (Kalori) its shop's name, set at load from `shop`. */
  brand?: string;
  /** A chain menu's (Kalori, members only): its shop's id (the header's `shops`), its values' trust (`p` estimated
   *  PFC, `e` all estimated; absent: official) and its picture's generation id. */
  shop?: string;
  est?: 'p' | 'e';
  img?: number;
  /** Values per serving, not per 100 g (a chain menu's: no weight known): logged as FoodSnap `sv`, its portion a nominal
   *  100 g serving. */
  sv?: true;
  /** The barcode; not shipped when it is the id's (`off:<jan>`): `keys` has it. */
  jan?: string;
  /** How the values were derived. */
  note?: string;
  /** A short 「これは…」 line: what the food is and looks like (food-data/data_src/descriptions.json, two sources each). */
  desc?: string;
  /** An everyday name shown under the food's own (data_src/glosses.json, two sources each): リーキ → 西洋ねぎ. */
  gloss?: string;
  /** kcal an integer; the rest 1 decimal, null when unknown. `c` total carbohydrate, `salt` 食塩相当量. */
  kcal: number;
  p?: number | null;
  f?: number | null;
  c?: number | null;
  salt?: number | null;
  /** Fibre (食物繊維総量) and alcohol, g; absent or null when unknown (most products, the city sets; alcohol only on
   *  drinks). */
  fib?: number | null;
  alc?: number | null;
  /** One food in its states (MEXT): its group's default item's id, and its state as the chip says it (生, 焼き, ゆで …). */
  vg?: string;
  st?: string;
  /** A curated search boost, 1–3; -1 ranks a rare or novelty item lower. */
  pop?: number;
  portions?: Portion[];
  /** The search keys, precomputed by scripts/food-data.ts (search.ts keysOf, joined by a space). */
  keys?: string;
}

/** A dataset's credit line, as its file's header says it (shown in the food sheet's about row). */
export interface Credit {
  label: string;
  attribution: string;
  license: string;
  url: string;
}

/** A dataset file: its header and items. */
export interface Dataset extends Partial<Credit> {
  source: string;
  items: Item[];
  /** The chain menus' (Kalori) shops: each id's Japanese name (its items' `brand`) and our short names (セブン, スタバ). */
  shops?: Record<string, { name: string; aliases?: string[] }>;
}

/** `index.json`: the data's content version (the files' `?v=`) and its datasets. `secondary` ones (regional, school
 *  lunch, products) rank below the core ones (MEXT, dishes, eatout); `lazy` ones (products) load after the rest. */
export interface FoodIndex {
  version: string;
  datasets: { file: string; source: string; badge: string; secondary: boolean; lazy: boolean }[];
}

/** One food across sources: how many independent families agree (n ≥ 2 = confirmed) and each source's kcal / 100 g. */
export interface VerifyGroup {
  n: number;
  kcal: Record<string, number>;
}

/** `verify.json`: the cross-source groups, each item's group, and the sources' credits (older builds: a label only). */
export interface Verify {
  sources: Record<string, Partial<Credit> | string>;
  groups: VerifyGroup[];
  byId: Record<string, number>;
}
