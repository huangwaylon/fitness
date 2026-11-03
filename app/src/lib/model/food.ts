// The meal log (ごはん, docs/backend.md#events `food`): each person's entries as the record keeps them (the `food` ops
// folded by the record's rules: contract/food.ts foodFold), a day's of them with its totals, and the day's targets
// (the kcal goal, a pref; protein from the latest weigh-in), and the repeats (いつもの: `food_repeat` folded alike),
// whose items are read into each day they cover as virtual entries (never copied into the record: a past day stays as
// it was, since a change of a repeat is an end and a new one). Everyone's are read alike: the guest sees every meal and
// logs its own. Pure; the economy never imports this (deps.test.ts): a meal is worth no ベル.
import type { LocalDate, Who } from '#lib/types.ts';
import { foodFold, foodRepeatFold, MEALS, repeatCovers, type FoodEntry, type FoodRepeat, type Meal } from '#lib/contract/food.ts';
import { isPersonId } from '#lib/contract/api.ts';
import type { State } from './state.ts';
import { weighIns } from './weight.ts';

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
