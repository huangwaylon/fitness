// ごはん's typed foods (docs/design.md "Gohan"): マイ食品 (a custom food as a food, its editor's fields) and クイック
// (a quick entry's fields and snapshot), and a kcal typed in the search.
import { CUSTOM, customDensityOk, customPortions, customSnap, round1, type FoodCustom, type FoodSnap } from '#lib/contract/food.ts';
import { parseTyped } from '#lib/math.ts';
import type { Item } from '#lib/food/index.ts';
import { t } from '#lib/i18n/index.ts';
import { snapValues } from './foodUi.ts';
import { gramsText, portionText } from './portions.ts';

// ---- マイ食品: a food typed in by someone as one serving (contract/food.ts FoodCustom)

/** A custom food as a food to log: its values per 100 g (customSnap) and its portions (its serving first; 100g after
 *  it when its weight is known). With no weight its one portion is a nominal 100 g: FoodAmount's `serving` mode. */
export function customItem(c: FoodCustom): Item {
  const f = customSnap(c);
  return { id: f.id, name: f.n, ...snapValues(f), portions: customPortions(c) };
}

/** A custom food's serving in words: 「1食」, 「1パック（120g）」. */
export const servingText = (c: Pick<FoodCustom, 'u' | 'g'>): string => (c.g === undefined ? c.u : portionText(c.u, c.g));

/** The custom food editor's fields, as typed (numbers as text: full-width digits welcome). */
export interface CustomDraft { n: string; u: string; g: string; k: string; p: string; fa: string; c: string; s: string; fi: string; al: string }
/** The editor's nutrients: the four, then fibre and alcohol (each may stay blank: unknown). */
export const CUSTOM_NUTS = ['p', 'fa', 'c', 's', 'fi', 'al'] as const;
const NUTS = CUSTOM_NUTS;
const num1 = (v: number | null | undefined): string => (v === null || v === undefined ? '' : gramsText(v));

/** A new custom food's fields (the name: what was typed in the search; the serving's label blank: 「1食」 is its field's
 *  placeholder, never a value typed after), or a saved one's. */
export function customDraft(c: FoodCustom | null, name = ''): CustomDraft {
  if (!c) return { n: name.trim().slice(0, CUSTOM.nameChars), u: '', g: '', k: '', p: '', fa: '', c: '', s: '', fi: '', al: '' };
  return { n: c.n, u: c.u, g: num1(c.g), k: String(c.k), p: num1(c.p), fa: num1(c.fa), c: num1(c.c), s: num1(c.s), fi: num1(c.fi), al: num1(c.al) };
}

/** A typed amount (math.ts parseTyped: full-width digits, 1,200, a decimal comma, a trailing g, ml or kcal) → a number
 *  to one decimal within [min, max]; '' → null (left blank); undefined when it isn't one. */
export function parseAmount(text: string, min: number, max: number): number | null | undefined {
  const n = parseTyped(text, 'g|ml|kcal|グラム');
  if (n == null) return n;
  const v = round1(n);
  return v >= min && v <= max ? v : undefined;
}

/** Which of the editor's fields don't read (the name and kcal are needed; the rest may be blank). A serving whose
 *  weight is too light for what it holds (more than any food per 100 g: the record refuses it) marks the weight. */
export function customErrors(d: CustomDraft): Set<keyof CustomDraft> {
  const bad = new Set<keyof CustomDraft>();
  if (!d.n.trim()) bad.add('n');
  const k = parseAmount(d.k, 0, CUSTOM.kcalMax);
  if (k === null || k === undefined) bad.add('k');
  if (parseAmount(d.g, CUSTOM.grams.min, CUSTOM.grams.max) === undefined) bad.add('g');
  for (const x of NUTS) if (parseAmount(d[x], 0, CUSTOM.nutrientMax) === undefined) bad.add(x);
  if (!bad.size && !customDensityOk(customOf(d))) bad.add('g');
  return bad;
}

/** The editor's fields as saveCustom takes them (customErrors empty first): kcal whole, a blank label 1食; fibre and
 *  alcohol only when typed. */
export function customOf(d: CustomDraft): { n: string; u: string; g?: number; k: number; p: number | null; fa: number | null; c: number | null; s: number | null; fi?: number; al?: number } {
  const g = parseAmount(d.g, CUSTOM.grams.min, CUSTOM.grams.max) ?? undefined;
  const nut = (x: (typeof NUTS)[number]) => parseAmount(d[x], 0, CUSTOM.nutrientMax) ?? null;
  const fi = nut('fi'), al = nut('al');
  return {
    n: d.n.trim(), u: d.u.trim() || t('food.my.one'), ...(g === undefined ? {} : { g }), k: Math.round(parseAmount(d.k, 0, CUSTOM.kcalMax) ?? 0),
    p: nut('p'), fa: nut('fa'), c: nut('c'), s: nut('s'), ...(fi === null ? {} : { fi }), ...(al === null ? {} : { al })
  };
}

// ---- クイック (quick add: eating out): kcal, and whatever else is known, as one entry; no food saved

/** A quick entry's fields: the custom food editor's (FoodCustom `quick`), its serving and weight unused; `k` the kcal
 *  to start from (typed in the search). */
export const quickDraft = (k = ''): CustomDraft => ({ ...customDraft(null), k });

/** Which of a quick entry's fields don't read: kcal is needed, the name may stay blank (then クイック). */
export function quickErrors(d: CustomDraft): Set<keyof CustomDraft> {
  return customErrors({ ...d, n: d.n.trim() || 'x', u: '', g: '' });
}

/** A quick entry's snapshot: one serving (`sv`: a nominal 100 g, shown as 「1食」) as typed, customSnap's form with no
 *  food saved, its id `quick:<id>` (its own), its name クイック unless typed. The record takes it as any custom food's
 *  (contract/food.ts snapOf: `sv`'s limits), so nothing new on the relay. */
export function quickSnap(d: CustomDraft, id: string): FoodSnap {
  const v = customOf({ ...d, n: d.n.trim() || t('food.quick.name'), u: '', g: '' });
  return { ...customSnap({ ...v, id }, v.u), id: `quick:${id}` };
}

/** A kcal typed in the search (「650」, 「６５０kcal」, 「1,200」): offered as a quick entry; null for anything else. */
export function typedKcal(q: string): number | null {
  const s = q.trim();
  if (!/^[\d０-９][\d０-９,，.．]*\s*(kcal)?$/i.test(s)) return null;
  const v = parseAmount(s, 1, CUSTOM.kcalMax);
  return v ? Math.round(v) : null;
}
