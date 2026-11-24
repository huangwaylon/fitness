// Portions and nutrient math (ported from the calorie PoC's core/nutrition.js), and the snapshot an entry keeps.
// Nutrients are per 100 g; 100 ml of a drink counts as 100 g.
import { cleanLine } from '#lib/contract/text.ts';
import { FOOD_NAME_CHARS, FOOD_PORTION_CHARS, round1, type FoodSnap } from '#lib/contract/food.ts';
import { nameGrams } from './plausible.ts';
import type { Item, Portion } from './types.ts';

/** A portion label's measure: ml for a drink's (「中ジョッキ（350ml）」, 「200ml」), else g. */
export const unitOf = (label: string | null | undefined): 'g' | 'ml' => (label && /\d\s*ml|ミリリットル/i.test(label.normalize('NFKC')) ? 'ml' : 'g');
/** 'ml' when the item's portions are measured in ml (a drink). */
const itemUnit = (item: Pick<Item, 'portions'>): 'g' | 'ml' => ((item.portions ?? []).some((p) => unitOf(p.label) === 'ml') ? 'ml' : 'g');

/** The item's portions (the first the default), and a 100 g (100 ml) one after them unless it has one; a serving with
 *  no weight (`sv`): its own (one serving, a nominal 100 g, by default), no 100 g. */
export function portionsOf(item: Pick<Item, 'portions' | 'sv'>): Portion[] {
  const ps = (item.portions ?? []).slice();
  if (item.sv) return ps.length ? ps : [{ label: '1食', g: 100 }];
  if (!ps.some((p) => p.g === 100 && /^100\s*(g|ml)$/i.test(p.label.normalize('NFKC')))) ps.push({ label: `100${itemUnit(item)}`, g: 100 });
  return ps;
}

/** A seasoning mix by its name: 「…の素」, a roux (not フルーツ, プルーン), dashi (not だし巻き), a bouillon. */
export const SEASONING_MIX = /の素|のもと|(?<!フ)ル[ーウ](?!ン)|(?:だし|ダシ|出汁)(?!巻)|顆粒|ブイヨン|コンソメ/;

/** A serving-only item's (`sv`: a chain menu's, values per serving) own weight as its name states it (plausible.ts
 *  nameGrams: 「ペペロンチーノソース 30g」 30; a mix's from its mix word on, so a dish word before it isn't read as a part:
 *  「DFE 肉骨茶の素 18g」 18), or null: then grams of it can be typed, servings = g ÷ this. The weight may be a dry mix's
 *  (a soup base's powder, not the soup made): taken as the serving's own, so 20 g typed is 20 g of the item. */
export function servingGrams(item: Pick<Item, 'name' | 'sv'>): number | null {
  if (!item.sv) return null;
  const nm = item.name.normalize('NFKC');
  const mix = SEASONING_MIX.exec(nm);
  return nameGrams(nm) ?? (mix ? nameGrams(nm.slice(mix.index)) : null);
}

/** What `g` grams hold: kcal an integer, the rest to 1 decimal; null unknown (shown 「–」, never 0.0). */
export interface Nutrients {
  kcal: number;
  p: number | null;
  fa: number | null;
  c: number | null;
  s: number | null;
}

/** The nutrients in `g` grams of a logged snapshot or a catalog item. */
export function nutrientsFor(food: FoodSnap | Item, g: number): Nutrients {
  const r = g / 100;
  const [k, p, fa, c, s] = 'k' in food ? [food.k, food.p, food.fa, food.c, food.s] : [food.kcal, food.p, food.f, food.c, food.salt];
  const x = (v: number | null | undefined) => (v === null || v === undefined ? null : round1(v * r));
  return { kcal: Math.round((k ?? 0) * r), p: x(p), fa: x(fa), c: x(c), s: x(s) };
}

/** A gram value as shown: 1 decimal, 「–」 unknown. */
export const g1 = (v: number | null | undefined): string => (v === null || v === undefined ? '–' : v.toFixed(1));

/** An entry's (or a recipe's, a いつもの's item's) kcal: `g` grams of its snapshot, whole (nutrientsFor's). */
export const entryKcal = (e: { g: number; f: Pick<FoodSnap, 'k'> }): number => Math.round((e.f.k * e.g) / 100);
/** A list's kcal, the sum rounded once (its rows, each rounded, may differ from it by ±1). */
export const itemsKcal = (list: readonly { g: number; f: Pick<FoodSnap, 'k'> }[]): number => Math.round(list.reduce((a, x) => a + (x.f.k * x.g) / 100, 0));

/** The item per 100 g as an entry keeps it (contract/food.ts FoodSnap): unrounded, so a 300 g serving of 216.67 kcal
 *  / 100 g logs 650 kcal; `u` the portion it was picked by; an `sv` item's per serving, `sv` set. */
export function toSnap(item: Item, portionLabel?: string): FoodSnap {
  const snap: FoodSnap = { id: item.id, n: cleanLine(item.name, FOOD_NAME_CHARS), k: item.kcal, p: item.p ?? null, fa: item.f ?? null, c: item.c ?? null, s: item.salt ?? null };
  // fibre only when known (an older snapshot has none: the same as unknown)
  if (typeof item.fib === 'number') snap.fi = item.fib;
  const u = cleanLine(portionLabel, FOOD_PORTION_CHARS);
  if (u) snap.u = u;
  if (item.sv) snap.sv = true;
  // a chain menu's values' trust (Kalori's), so the entry can say 推定
  if (item.est) snap.est = item.est;
  return snap;
}
