// Portions and nutrient math (ported from the calorie PoC's core/nutrition.js), and the snapshot an entry keeps.
// Nutrients are per 100 g; 100 ml of a drink counts as 100 g.
import { cleanLine } from '#lib/contract/text.ts';
import { FOOD_NAME_CHARS, FOOD_PORTION_CHARS, round1, type FoodSnap } from '#lib/contract/food.ts';
import type { Item, Portion } from './types.ts';

/** 'ml' when the item's portions are measured in ml (a drink). */
const unitOf = (item: Pick<Item, 'portions'>): 'g' | 'ml' =>
  (item.portions ?? []).some((p) => /\d\s*ml|ミリリットル/i.test(p.label.normalize('NFKC'))) ? 'ml' : 'g';

/** The item's portions (the first the default), and a 100 g (100 ml) one after them unless it has one. */
export function portionsOf(item: Pick<Item, 'portions'>): Portion[] {
  const ps = (item.portions ?? []).slice();
  if (!ps.some((p) => p.g === 100 && /^100\s*(g|ml)$/i.test(p.label.normalize('NFKC')))) ps.push({ label: `100${unitOf(item)}`, g: 100 });
  return ps;
}

/** What `g` grams hold: kcal an integer, the rest to 1 decimal; an unknown value counts as 0. */
export interface Nutrients {
  kcal: number;
  p: number;
  fa: number;
  c: number;
  s: number;
}

/** The nutrients in `g` grams of a logged snapshot or a catalog item. */
export function nutrientsFor(food: FoodSnap | Item, g: number): Nutrients {
  const r = g / 100;
  const [k, p, fa, c, s] = 'k' in food ? [food.k, food.p, food.fa, food.c, food.s] : [food.kcal, food.p, food.f, food.c, food.salt];
  const x = (v: number | null | undefined) => round1((v ?? 0) * r);
  return { kcal: Math.round((k ?? 0) * r), p: x(p), fa: x(fa), c: x(c), s: x(s) };
}

/** The item per 100 g as an entry keeps it (contract/food.ts FoodSnap): unrounded, so a 300 g serving of 216.67 kcal
 *  / 100 g logs 650 kcal; `u` the portion it was picked by. */
export function toSnap(item: Item, portionLabel?: string): FoodSnap {
  const snap: FoodSnap = { id: item.id, n: cleanLine(item.name, FOOD_NAME_CHARS), k: item.kcal, p: item.p ?? null, fa: item.f ?? null, c: item.c ?? null, s: item.salt ?? null };
  const u = cleanLine(portionLabel, FOOD_PORTION_CHARS);
  if (u) snap.u = u;
  return snap;
}
