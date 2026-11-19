// 「最新の値にする」 (docs/design.md "Gohan"): an entry keeps the food as it was logged (a snapshot per 100 g), so a later
// fix of the food data, or an edit of the recipe or custom food it came from, never changes it. When its food has
// since changed beyond rounding, the entry offers the food's values now: the catalogue item with the same id
// (toSnap; a barcode-only product's from its shard, fetched for it: shardsFor), the recipe (recipeSnap) or the custom
// food (customSnap) as it is now, its portion label kept, and with that label one of the food's portions now (「1杯」,
// 「1人前×2」) its grams that portion's now (eatout:reimen's 1杯 606 → 556 g). A いつもの's items alike, all at once
// (Food.svelte 「いつものを更新」, store/meals.ts refreshRepeat). Nothing is ever updated by itself: the owner taps it
// (store/meals.ts refreshFood, an ordinary edit).
import {
  customPortions, customSnap, FOOD_GRAMS, recipePortions, recipeSnap, round1, snapSalt, type FoodCustom, type FoodSnap,
  type RepeatItem
} from '#lib/contract/food.ts';
import { itemById, itemsKcal, janItem, portionsOf, toSnap, type FoodDb, type Portion } from '#lib/food/index.ts';

/** Differences within these are rounding (kcal: the data's whole kcal, a recipe's or custom food's tenth; grams: a
 *  tenth), not a fix. */
const EPS = { k: 0.5, g: 0.05 } as const;

const near = (a: number, b: number, eps: number) => Math.abs(a - b) <= eps + 1e-9;

/**
 * Whether snapshot `now` (the food as it is now) differs from `was` (as logged) beyond rounding: kcal, or protein,
 * fat, carbs, salt or fibre (a value become unknown, or known, counts: fibre newly known on an entry from before it,
 * 2026-11-05, too). The name, the portion label the values' trust (`est`) and スープ半分 (`hs`, how it was eaten) are not values.
 */
export function snapDiffers(was: FoodSnap, now: FoodSnap): boolean {
  if (!near(was.k, now.k, EPS.k)) return true;
  for (const k of ['p', 'fa', 'c', 's', 'fi'] as const) {
    const a = was[k] ?? null, b = now[k] ?? null;
    if ((a === null) !== (b === null) || (a !== null && b !== null && !near(a, b, EPS.g))) return true;
  }
  return false;
}

/** Where the foods are now: the catalogue (null: not loaded yet), the recipes and custom foods. */
export interface FoodSources { db: FoodDb | null; recipes: readonly { id: string; n: string; sv: number; it: readonly RepeatItem[] }[]; customs: readonly FoodCustom[] }

/** The food of snapshot `f` as it is now (its portion label kept) and its portions now, or null: gone or not loaded. */
function sourceOf(f: FoodSnap, src: FoodSources): { now: FoodSnap; ps: readonly Portion[] } | null {
  if (f.id.startsWith('recipe:')) {
    const r = src.recipes.find((x) => `recipe:${x.id}` === f.id);
    if (!r) return null;
    return { now: recipeSnap(r, f.u), ps: recipePortions(r) };
  }
  if (f.id.startsWith('custom:')) {
    const c = src.customs.find((x) => `custom:${x.id}` === f.id);
    return c ? { now: customSnap(c, f.u), ps: customPortions(c) } : null;
  }
  const it = itemById(src.db, f.id) ?? src.db?.shard.get(f.id);
  return it ? { now: toSnap(it, f.u), ps: portionsOf(it) } : null;
}

/** The grams portion label `u` (「1杯」, 「1杯×2」: portions.ts portionLabel) is among `ps` now, or null: no label, not
 *  one of them, past an entry's grams. */
function labelGrams(u: string | undefined, ps: readonly Portion[]): number | null {
  if (!u) return null;
  const [base, x] = u.split('×');
  const n = x === undefined ? 1 : Number(x);
  const p = ps.find((q) => q.label === base);
  if (!p || !(n > 0)) return null;
  const g = round1(p.g * n);
  return g >= FOOD_GRAMS.min && g <= FOOD_GRAMS.max ? g : null;
}

/** An entry's (a いつもの item's) food as it is now, and its grams then. */
export interface Fresh { g: number; f: FoodSnap }

/**
 * Entry (or いつもの item) `x` as it would be now, or null: its food gone, not loaded, or the same within rounding at
 * the same grams; or now logged otherwise (a serving with no weight become one with a weight, or back) with no
 * portion label to carry its grams over (they would mean something else).
 */
export function latestFood(x: { g: number; f: FoodSnap }, src: FoodSources): Fresh | null {
  const s = sourceOf(x.f, src);
  if (!s) return null;
  const lg = labelGrams(x.f.u, s.ps);
  if (lg === null && (s.now.sv === true) !== (x.f.sv === true)) return null;
  const g = lg ?? x.g;
  // スープ半分 is how it was eaten, not a value: kept
  const now = x.f.hs === undefined ? s.now : { ...s.now, hs: x.f.hs };
  return snapDiffers(x.f, now) || !near(g, x.g, EPS.g) ? { g, f: now } : null;
}

/** The barcode shards' items of `ids` that our products haven't (a scan's barcode-only product, the 2026-11-19 cone's
 *  kind), fetched into `db.shard` once the products are in (theirs come first, as a scan's); true when any came. A
 *  shard that won't load (offline): none, asked again next time. A product Open Food Facts gave online is in neither:
 *  no fresher values to offer. */
export async function shardsFor(db: FoodDb, ids: Iterable<string>): Promise<boolean> {
  const want = [...new Set(ids)].filter((id) => /^off:\d{8,13}$/.test(id));
  if (!want.length || !db.jan) return false;
  await db.wantMore(['off']).catch(() => {});
  const got = await Promise.all(want.filter((id) => !itemById(db, id) && !db.shard.has(id)).map((id) => janItem(db, id.slice(4)).catch(() => null)));
  return got.some((it) => !!it);
}

/** What an update changes most, for its button (「最新の値にする（塩分 3.1→1.4 g）」): kcal by KCAL_SHARE and more, else
 *  salt, else fibre (g, one decimal; `from` null: newly known), else kcal at all; null: nothing shown changes. */
export interface FreshChange { k: 'k' | 's' | 'fi'; from: number | null; to: number }
const KCAL_SHARE = 0.05;
type Items = readonly { g: number; f: FoodSnap }[];
function sumOf(xs: Items, of: (f: FoodSnap) => number | null | undefined): number | null {
  let t: number | null = null;
  for (const { g, f } of xs) {
    const v = of(f);
    if (v !== null && v !== undefined) t = (t ?? 0) + (v * g) / 100;
  }
  return t === null ? null : round1(t);
}
export function freshChange(was: Items, now: Items): FreshChange | null {
  const k0 = itemsKcal(was), k1 = itemsKcal(now);
  if (Math.abs(k1 - k0) >= KCAL_SHARE * Math.max(k0, 1)) return { k: 'k', from: k0, to: k1 };
  for (const k of ['s', 'fi'] as const) {
    const of = k === 's' ? snapSalt : (f: FoodSnap) => f.fi;
    const a = sumOf(was, of), b = sumOf(now, of);
    if (b !== null && a !== b) return { k, from: a, to: b };
  }
  return k0 === k1 ? null : { k: 'k', from: k0, to: k1 };
}
