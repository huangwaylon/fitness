// ごはん's small helpers (docs/design.md "Gohan"): the catalog loaded once a session, an entry's amount in words, the
// food an entry was logged from (its catalog item when the catalog has it, for its portions), the 最近 list, and a
// repeat's weekdays in words, and a recipe as a food (マイレシピ: its portions) and the meal the clock suggests.
import { FOOD_GRAMS, isKcalGoal, recipePortion, recipeSnap, type FoodEntry, type FoodSnap, type Meal, type RepeatItem } from '#lib/contract/food.ts';
import type { Recipe } from '#lib/model/food.ts';
import { ZONE_OFFSET_MS } from '#lib/time/dates.ts';
import { loadFoodDb, portionsOf, type FoodDb, type Item, type Portion } from '#lib/food/index.ts';
import { t } from '#lib/i18n/index.ts';

let dbP: Promise<FoodDb> | null = null;
/** The food catalog, fetched on the first search of the session (a failure lets the next one try again). */
export function foodDb(): Promise<FoodDb> {
  return (dbP ??= loadFoodDb().catch((e: unknown) => {
    dbP = null;
    throw e;
  }));
}

/** Grams as typed: one decimal at most, no trailing `.0`. */
export const gramsText = (g: number): string => String(Math.round(g * 10) / 10);

/** Whether a portion label already says its weight (「1枚(60g)」, 「200ml」): no second （Ng） after it. */
export const hasWeight = (label: string): boolean => /\d\s*(g|ml|グラム)/i.test(label.normalize('NFKC'));

/** An entry's amount: the portion it was picked by and its grams (「茶碗1杯（150g）」; the label alone when it says its
 *  weight), or the grams alone. */
export const amountText = (e: Pick<FoodEntry, 'g' | 'f'>): string =>
  e.f.u ? (hasWeight(e.f.u) && !e.f.u.includes('×') ? e.f.u : `${e.f.u}（${gramsText(e.g)}g）`) : `${gramsText(e.g)}g`;

/** A logged snapshot as a catalog item: the catalog's own when it has it (its portions), else the snapshot's values. */
export function itemOf(f: FoodSnap, db: FoodDb | null): Item {
  const it = db?.entries.find((e) => e.it.id === f.id)?.it;
  return { ...(it ?? {}), id: f.id, name: f.n, kcal: f.k, p: f.p, f: f.fa, c: f.c, salt: f.s };
}

/** My latest entry of each food, newest first: what the search shows before anything is typed. */
export function recentOf(mine: readonly FoodEntry[], limit = 20): FoodEntry[] {
  const seen = new Set<string>();
  const out: FoodEntry[] = [];
  for (const e of mine) {
    if (seen.has(e.f.id)) continue;
    seen.add(e.f.id);
    out.push(e);
    if (out.length >= limit) break;
  }
  return out;
}

/** The portion and ×multiplier (a multiple of 0.5, up to ×20) that make `g`, ×1 first; null when none does. */
export function matchPortion(ps: readonly Portion[], g: number): { pi: number; mult: number } | null {
  let best: { pi: number; mult: number } | null = null;
  ps.forEach((p, pi) => {
    const m2 = (g / p.g) * 2;
    if (Math.abs(m2 - Math.round(m2)) > 1e-6 || m2 < 1 || m2 > 40) return;
    const mult = Math.round(m2) / 2;
    if (!best || (mult === 1 && best.mult !== 1)) best = { pi, mult };
  });
  return best;
}

/** The label an entry keeps for a picked portion (「茶碗1杯」, 「茶碗1杯×2」); none for 100 g or typed grams. */
export function portionLabel(p: Portion | null, mult: number): string | null {
  if (!p || /^100\s*(g|ml)$/i.test(p.label.normalize('NFKC'))) return null;
  return mult === 1 ? p.label : `${p.label}×${mult}`;
}

/** An item's default portion and its kcal (search rows: 「茶碗1杯 234 kcal」). */
export function defaultPortion(it: Item): { label: string; kcal: number } {
  const p = portionsOf(it)[0];
  return { label: p.label, kcal: Math.round((it.kcal * p.g) / 100) };
}

/** What was typed as a daily kcal goal → kcal, or null: `1800`, `2,000`, full-width `１８００`, a trailing `kcal`;
 *  KCAL_GOAL's range in whole steps only. */
export function parseKcalGoal(text: string): number | null {
  const s = text.trim().replace(/[０-９，]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0)).replace(/\s*kcal$/i, '').replace(/,/g, '');
  if (!/^\d{1,4}$/.test(s)) return null;
  const n = Number(s);
  return isKcalGoal(n) ? n : null;
}

/** いつもの's weekday masks (bit 0 Monday … bit 6 Sunday): 毎日 · 平日 · 週末, the presets of the repeat level. */
export const DAYS = { every: 0b1111111, weekdays: 0b0011111, weekends: 0b1100000 } as const;

/** A repeat's weekdays in words: 毎日, 平日, 週末, else the days themselves (「月水金」, 「Mon Wed Fri」). */
export function daysText(w: number): string {
  for (const [k, v] of Object.entries(DAYS)) if (w === v) return t(`food.rep.${k}`);
  const days: string[] = [];
  for (let i = 0; i < 7; i++) if (w & (1 << i)) days.push(t(`food.rep.d${i}`));
  return days.join(t('food.rep.join'));
}

/** A recipe as a food to log (its values per 100 g: recipeSnap), its portions 1人前 (recipePortion) and, making more
 *  than one, ぜんぶ (its grams, within an entry's). */
export function recipeItem(r: Recipe): Item {
  const f = recipeSnap(r);
  const one = recipePortion(r);
  const portions: Portion[] = [{ label: one.label, g: one.g }];
  if (r.sv > 1 && r.total.g <= FOOD_GRAMS.max) portions.push({ label: 'ぜんぶ', g: r.total.g });
  return { id: f.id, name: f.n, kcal: f.k, p: f.p, f: f.fa, c: f.c, salt: f.s, portions };
}

/** The meal the clock (Tokyo) suggests: 朝 until 10:00, 昼 until 15:00, おやつ until 17:00, then 夜. */
export function mealAt(ms: number): Meal {
  const h = new Date(ms + ZONE_OFFSET_MS).getUTCHours();
  return h >= 4 && h < 10 ? 'b' : h >= 10 && h < 15 ? 'l' : h >= 15 && h < 17 ? 's' : 'd';
}

/** A recipe as its editor changes it: the name, the servings, the ingredients. */
export interface RecipeDraft { n: string; sv: number; it: RepeatItem[] }
