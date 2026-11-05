// 「最新の値にする」 (docs/design.md "Gohan"): an entry keeps the food as it was logged (a snapshot per 100 g), so a later
// fix of the food data, or an edit of the recipe or custom food it came from, never changes it. When its food has
// since changed beyond rounding, the entry offers the food's values now: the catalogue item with the same id
// (toSnap), the recipe (recipeSnap) or the custom food (customSnap) as it is now, its portion label kept. Nothing is
// ever updated by itself: the owner taps it (store/actions.ts refreshFood, an ordinary edit).
import { customSnap, recipeSnap, type FoodCustom, type FoodSnap, type RepeatItem } from '#lib/contract/food.ts';
import { toSnap, type FoodDb, type Item } from '#lib/food/index.ts';

/** Differences within these are rounding (kcal: the data's whole kcal, a recipe's or custom food's tenth; grams: a
 *  tenth), not a fix. */
const EPS = { k: 0.5, g: 0.05 } as const;

const near = (a: number, b: number, eps: number) => Math.abs(a - b) <= eps + 1e-9;

/**
 * Whether snapshot `now` (the food as it is now) differs from `was` (as logged) beyond rounding: kcal, or protein,
 * fat, carbs or salt (a value become unknown, or known, counts); fibre and alcohol only when both know them (an entry
 * from before them, 2026-11-05, has neither: that alone is no fix). The name and the portion label are not values.
 */
export function snapDiffers(was: FoodSnap, now: FoodSnap): boolean {
  if (!near(was.k, now.k, EPS.k)) return true;
  for (const k of ['p', 'fa', 'c', 's'] as const) {
    const a = was[k], b = now[k];
    if ((a === null) !== (b === null) || (a !== null && b !== null && !near(a, b, EPS.g))) return true;
  }
  for (const k of ['fi', 'al'] as const) {
    const a = was[k], b = now[k];
    if (typeof a === 'number' && typeof b === 'number' && !near(a, b, EPS.g)) return true;
  }
  return false;
}

/** Where the foods are now: the catalogue (null: not loaded yet), the recipes and custom foods. */
export interface FoodSources { db: FoodDb | null; recipes: readonly { id: string; n: string; sv: number; it: readonly RepeatItem[] }[]; customs: readonly FoodCustom[] }

const byId = new WeakMap<FoodDb, { n: number; m: Map<string, Item> }>();
/** The catalogue item with this id (a map per catalogue, rebuilt once a lazy dataset has come in). */
function itemById(db: FoodDb, id: string): Item | undefined {
  let c = byId.get(db);
  if (!c || c.n !== db.entries.length) {
    const m = new Map<string, Item>();
    for (const e of db.entries) if (!m.has(e.it.id)) m.set(e.it.id, e.it);
    byId.set(db, (c = { n: db.entries.length, m }));
  }
  return c.m.get(id);
}

/** The food of snapshot `f` as it is now (its portion label kept), or null: it's gone, not loaded, the same within
 *  rounding, or now logged otherwise (a serving with no weight become one with a weight, or back: its grams would mean
 *  something else). */
export function latestSnap(f: FoodSnap, src: FoodSources): FoodSnap | null {
  let now: FoodSnap | null = null;
  if (f.id.startsWith('recipe:')) {
    const r = src.recipes.find((x) => `recipe:${x.id}` === f.id);
    now = r ? recipeSnap(r, f.u) : null;
  } else if (f.id.startsWith('custom:')) {
    const c = src.customs.find((x) => `custom:${x.id}` === f.id);
    now = c ? customSnap(c, f.u) : null;
  } else {
    const it = src.db ? itemById(src.db, f.id) : undefined;
    now = it ? toSnap(it, f.u) : null;
  }
  if (!now || (now.sv === true) !== (f.sv === true)) return null;
  return snapDiffers(f, now) ? now : null;
}
