// 「表示値を確認」 (FoodAmount): a quiet hint under a packaged product's values when
// the amount picked holds what a label rarely says (the 2026-11-19 cone: an Open Food Facts typo, P 36 g per 100 g, so
// 50 g of protein a cone). Never a block, never a fix by itself: the user compares with the package and, if it differs,
// makes the food their own (マイ食品, prefilled). Pure; a few rules, each tested on a real case (portionCheck.test.ts).
import type { Item } from './types.ts';
import { LOW_PROTEIN_CATS, PROTEIN_FOOD, SALTY_CATS } from './words.ts';

/** Why an amount looks off: protein over PROTEIN_G (not a protein food); protein over P_SHARE of the energy (a sweet,
 *  a drink, bread, a staple, noodles, not a protein food); kcal over KCAL_MAX; salt over SALT_G (not a soup, a sauce,
 *  noodles); the energy far (ATWATER of the larger) from 4P + 9F + 4C (fibre 2 when known). */
export type CheckWhy = 'p' | 'pshare' | 'kcal' | 'salt' | 'energy';

const PROTEIN_G = 40;
const P_SHARE = 0.35;
const KCAL_MAX = 1500;
const SALT_G = 6;
const ATWATER = 0.35;
/** The energy rules (protein's share, Atwater) only from this many kcal in the amount: a few kcal round loosely. */
const MIN_KCAL = 30;

/** The foods a label is printed for: packaged products (Open Food Facts', ours, the shards' and live; the JBFD's 市販品).
 *  The reference tables (MEXT, dishes, the city sets) have no label; chain menus (Kalori) are checked when built
 *  (kalori_convert.py implausible) and their set meals often hold 40 g of protein; custom foods and recipes are the
 *  user's. */
const LABELLED = /^(off|jbfd):/;

/** Protein foods by category (their protein share is the point). */
const PROTEIN_CATS: ReadonlySet<string> = new Set(['肉', '魚介', '卵', '大豆・豆']);
/** Energy not from 4P + 9F + 4C as typed: alcohol (by category or name), sweeteners (sugar alcohols), fibre
 *  (seaweed, mushrooms, fibre powders: unknown on most). */
const OWN_ENERGY_CATS: ReadonlySet<string> = new Set(['酒', '海藻', 'きのこ']);
const OWN_ENERGY_WORDS = /ゼロ|シュガーレス|ノンシュガー|糖質|カロリーオフ|sugar.?free|zero|ビール|beer|lager|ワイン|wine|ハイボール|チューハイ|サワー|ファイバー|fiber|食物繊維/i;

/** Whether an item is one the hint is for (a label exists to compare with). */
const labelled = (it: Pick<Item, 'id'>): boolean => LABELLED.test(it.id);

/** Why `g` grams of `it` (values per 100 g; a serving's, `sv`, per a nominal 100 g) look off; [] when they don't, or
 *  the item isn't labelled. Over the shipped products at each one's first portion (2026-11-19): 1.3 % hint. */
export function portionCheck(it: Item, g: number): CheckWhy[] {
  if (!labelled(it) || !(g > 0)) return [];
  const by = g / 100;
  const at = (v: number | null | undefined): number | null => (typeof v === 'number' ? v * by : null);
  const k = it.kcal * by, p = at(it.p), f = at(it.f), c = at(it.c), s = at(it.salt);
  const out: CheckWhy[] = [];
  const protein = (it.cat !== undefined && PROTEIN_CATS.has(it.cat)) || PROTEIN_FOOD.test(it.name.normalize('NFKC'));
  if (p !== null && p > PROTEIN_G && !protein) out.push('p');
  if (p !== null && k >= MIN_KCAL && !protein && it.cat !== undefined && LOW_PROTEIN_CATS.has(it.cat) && (4 * p) / k > P_SHARE) out.push('pshare');
  if (k > KCAL_MAX) out.push('kcal');
  if (s !== null && s > SALT_G && !(it.cat !== undefined && SALTY_CATS.has(it.cat))) out.push('salt');
  const own = (it.cat !== undefined && OWN_ENERGY_CATS.has(it.cat)) || OWN_ENERGY_WORDS.test(it.name);
  if (p !== null && f !== null && c !== null && !own) {
    const fib = at(it.fib) ?? 0;
    const atw = 4 * p + 9 * f + 4 * Math.max(0, c - fib) + 2 * fib;
    if (Math.max(k, atw) >= MIN_KCAL && Math.abs(k - atw) > ATWATER * Math.max(k, atw)) out.push('energy');
  }
  return out;
}
