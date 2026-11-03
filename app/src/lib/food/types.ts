// The meal log's food data as shipped in static/food/ (copied from the calorie PoC by scripts/food-data.ts; the
// format is its docs/data.md). Nutrients are per 100 g; 100 ml of a drink counts as 100 g.

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
  /** Packaged products only. */
  brand?: string;
  /** The barcode; not shipped when it is the id's (`off:<jan>`): `keys` has it. */
  jan?: string;
  /** How the values were derived. */
  note?: string;
  /** kcal an integer; the rest 1 decimal, null when unknown. `c` total carbohydrate, `salt` 食塩相当量. */
  kcal: number;
  p?: number | null;
  f?: number | null;
  c?: number | null;
  salt?: number | null;
  /** A curated search boost, 1–3. */
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
