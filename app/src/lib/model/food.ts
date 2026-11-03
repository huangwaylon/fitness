// The meal log (ごはん, docs/backend.md#events `food`): each person's entries as the record keeps them (the `food` ops
// folded by the record's rules: contract/food.ts foodFold), a day's of them with its totals, and the day's targets
// (the kcal goal, a pref; protein from the latest weigh-in), and the repeats (いつもの: `food_repeat` folded alike),
// whose items are read into each day they cover as virtual entries (never copied into the record: a past day stays as
// it was, since a change of a repeat is an end and a new one), and the recipes (マイレシピ: `food_recipe` folded alike,
// everyone's, each with its totals and a serving's). Everyone's are read alike: the guest sees every meal and
// logs its own. Pure; the economy never imports this (deps.test.ts): a meal is worth no ベル.
import type { LocalDate, Who } from '#lib/types.ts';
import {
  foodFold, foodRecipeFold, foodRepeatFold, MEALS, recipePortion, recipeTotals, repeatCovers, type FoodEntry, type FoodRecipe, type FoodRepeat, type Meal
} from '#lib/contract/food.ts';
import { isPersonId } from '#lib/contract/api.ts';
import type { State } from './state.ts';
import { weighIns } from './weight.ts';
import { addDays, daysBetween } from '#lib/time/dates.ts';
import type { DaySeries } from './health.ts';

/** A day's entries and what they add up to: kcal (whole), protein, fat, carbs and salt (g, one decimal; an unknown
 *  nutrient counts as none). */
export interface FoodDay { entries: FoodEntry[]; kcal: number; p: number; fa: number; c: number; s: number }

/** Protein to aim for per kg of body weight a day (g). */
const PROTEIN_PER_KG = 1.6;

const memo = new WeakMap<State['food'], FoodEntry[]>();
/** Every live entry, everyone's (foodFold's order: by day, meal, id). Memoised per list. */
function entriesOf(s: Pick<State, 'food'>): FoodEntry[] {
  let out = memo.get(s.food);
  if (!out) memo.set(s.food, (out = foodFold(s.food)));
  return out;
}

const repMemo = new WeakMap<State['foodRepeat'], FoodRepeat[]>();
/** Every repeat, everyone's (foodRepeatFold's order: by first day, id). Memoised per list. */
function repeatsOf(s: Pick<State, 'foodRepeat'>): FoodRepeat[] {
  let out = repMemo.get(s.foodRepeat);
  if (!out) repMemo.set(s.foodRepeat, (out = foodRepeatFold(s.foodRepeat)));
  return out;
}

/** `who`'s repeats the record keeps (not removed; ended ones too: they still fill their days), by first day. */
export function repeats(s: Pick<State, 'foodRepeat'>, who: Who): FoodRepeat[] {
  return repeatsOf(s).filter((r) => r.who === who);
}

/** `who`'s repeat that fills `meal` on `date` (its days, its weekdays, not skipped), or null. */
export function repeatOn(s: Pick<State, 'foodRepeat'>, who: Who, meal: Meal, date: LocalDate): FoodRepeat | null {
  return repeatsOf(s).find((r) => r.who === who && r.m === meal && repeatCovers(r, date)) ?? null;
}

/** A repeat's items on `date` as entries: id `<repeat id>:<index>`, `rep` the repeat's id, `at` its op's. */
const repeatEntries = (r: FoodRepeat, date: LocalDate): FoodEntry[] =>
  r.it.map(({ g, f }, i) => ({ id: `${r.id}:${i}`, who: r.who, at: r.at, d: date, m: r.m, g, f, rep: r.id }));

/** All of `who`'s live entries across days, the latest changed first (the 最近 list). */
export function foodEntries(s: Pick<State, 'food'>, who: Who): FoodEntry[] {
  return entriesOf(s).filter((e) => e.who === who).sort((a, b) => b.at - a.at);
}

const round1 = (v: number): number => Math.round(v * 10) / 10;

/** `who`'s entries of `date` and their totals: by meal, each meal's repeat's items first (in its order; the UI keeps
 *  one repeat per meal, the record need not), then the real ones as logged. */
export function foodDay(s: Pick<State, 'food' | 'foodRepeat'>, who: Who, date: LocalDate): FoodDay {
  const real = entriesOf(s).filter((e) => e.who === who && e.d === date);
  const reps = repeatsOf(s).filter((r) => r.who === who && repeatCovers(r, date));
  const entries = MEALS.flatMap((m) => [...reps.filter((r) => r.m === m).flatMap((r) => repeatEntries(r, date)), ...real.filter((e) => e.m === m)]);
  let kcal = 0, p = 0, fa = 0, c = 0, salt = 0;
  for (const { g, f } of entries) {
    const x = g / 100;
    kcal += f.k * x;
    p += (f.p ?? 0) * x;
    fa += (f.fa ?? 0) * x;
    c += (f.c ?? 0) * x;
    salt += (f.s ?? 0) * x;
  }
  return { entries, kcal: Math.round(kcal), p: round1(p), fa: round1(fa), c: round1(c), s: round1(salt) };
}

const totalsMemo = new WeakMap<object, Map<string, Map<LocalDate, number>>>();

/**
 * `who`'s kcal per day up to `today`, in one pass (グラフ reads a year at once: no foodDay per day): each day with
 * something in it (a logged entry, or a repeat's items on a day it covers; a 0 kcal item counts) → its unrounded
 * total, as foodDay adds it up. Future days (a repeat fills them too) are left out. Memoised per State, person and day.
 */
function dayTotals(s: Pick<State, 'food' | 'foodRepeat'>, who: Who, today: LocalDate): Map<LocalDate, number> {
  let byKey = totalsMemo.get(s);
  if (!byKey) totalsMemo.set(s, (byKey = new Map()));
  const key = `${who}|${today}`;
  let out = byKey.get(key);
  if (out) return out;
  const totals = new Map<LocalDate, number>();
  const add = (d: LocalDate, g: number, k: number) => totals.set(d, (totals.get(d) ?? 0) + (k * g) / 100);
  for (const e of entriesOf(s)) if (e.who === who && e.d <= today) add(e.d, e.g, e.f.k);
  for (const r of repeatsOf(s)) {
    if (r.who !== who || !r.it.length) continue;
    const last = r.to && r.to < today ? r.to : today;
    for (let d = r.from; d <= last; d = addDays(d, 1)) if (repeatCovers(r, d)) for (const { g, f } of r.it) add(d, g, f.k);
  }
  byKey.set(key, (out = totals));
  return out;
}

const seriesMemo = new WeakMap<object, Map<string, DaySeries>>();

/**
 * `who`'s kcal per day for ごはん's グラフ, as けんこう's metrics (health.ts DaySeries, so its bucket and stat rules apply:
 * seriesBuckets, seriesStats): from their first day with a meal (logged, or a repeat's) to `today`, each day's total
 * as foodDay rounds it (repeats included); a day with nothing in it is null (記録なし, never a 0), while a 0 kcal entry
 * is a record. The goal: their kcal goal (one for every day; none: null). Memoised per State, person and day.
 */
export function foodSeries(s: Pick<State, 'food' | 'foodRepeat' | 'prefs'>, who: Who, today: LocalDate): DaySeries {
  let byKey = seriesMemo.get(s);
  if (!byKey) seriesMemo.set(s, (byKey = new Map()));
  const key = `${who}|${today}`;
  let hit = byKey.get(key);
  if (hit) return hit;
  const totals = dayTotals(s, who, today);
  let from = today;
  for (const d of totals.keys()) if (d < from) from = d;
  const vals: (number | null)[] = [];
  for (let i = 0, d = from, n = daysBetween(from, today); i <= n; i++, d = addDays(d, 1)) {
    const k = totals.get(d);
    vals.push(k === undefined ? null : Math.round(k));
  }
  const goal = kcalGoal(s, who);
  byKey.set(key, (hit = { from, to: today, first: from, vals, goal: () => goal }));
  return hit;
}

/** What a recipe, or one serving of it, adds up to: `g` grams, kcal (whole), protein, fat, carbs and salt (g, one
 *  decimal; null: no ingredient knows it). */
export interface RecipeSums { g: number; kcal: number; p: number | null; fa: number | null; c: number | null; s: number | null }
/** A recipe as the gohan shows it: who set it (its owner, the only one who edits it), its totals and a serving's. */
export type Recipe = FoodRecipe & { total: RecipeSums; per: RecipeSums };

const recMemo = new WeakMap<State['foodRecipe'], Recipe[]>();
/** Every live recipe, everyone's (anyone logs any of them as an entry of their own), the latest changed first. Memoised
 *  per list. */
export function recipes(s: Pick<State, 'foodRecipe'>): Recipe[] {
  let out = recMemo.get(s.foodRecipe);
  if (!out) {
    out = foodRecipeFold(s.foodRecipe).map((r) => {
      const t = recipeTotals(r.it);
      const sums = (by: number, g: number): RecipeSums => {
        const n = (v: number | null) => (v === null ? null : round1(v / by));
        return { g, kcal: Math.round(t.k / by), p: n(t.p), fa: n(t.fa), c: n(t.c), s: n(t.s) };
      };
      return { ...r, total: sums(1, round1(t.g)), per: sums(r.sv, recipePortion(r).g) };
    });
    recMemo.set(s.foodRecipe, out);
  }
  return out;
}

/** `who`'s daily kcal goal (`pref kcalGoal`), or null when none is set. */
export function kcalGoal(s: Pick<State, 'prefs'>, who: Who): number | null {
  return s.prefs[who].kcalGoal ?? null;
}

/** A member's daily protein target (g, whole): PROTEIN_PER_KG × the latest weigh-in as of `t`. Null for the guest
 *  (no body data) and without a weigh-in. */
export function proteinGoal(s: State, who: Who, t: number): number | null {
  if (!isPersonId(who)) return null;
  const last = weighIns(s, who, t).at(-1);
  return last ? Math.round(last.kg * PROTEIN_PER_KG) : null;
}
