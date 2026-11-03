// The meal log (ごはん, docs/backend.md#events `food`): each person's entries as the record keeps them (the `food` ops
// folded by the record's rules: contract/food.ts foodFold), a day's of them with its totals, and the day's targets
// (the kcal goal, a pref; protein from the latest weigh-in). Everyone's are read alike: the guest sees every meal and
// logs its own. Pure; the economy never imports this (deps.test.ts): a meal is worth no ベル.
import type { LocalDate, Who } from '#lib/types.ts';
import { foodFold, type FoodEntry } from '#lib/contract/food.ts';
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

/** All of `who`'s live entries across days, the latest changed first (the 最近 list). */
export function foodEntries(s: Pick<State, 'food'>, who: Who): FoodEntry[] {
  return entriesOf(s).filter((e) => e.who === who).sort((a, b) => b.at - a.at);
}

const round1 = (v: number): number => Math.round(v * 10) / 10;

/** `who`'s entries of `date` (by meal, then when logged) and their totals. */
export function foodDay(s: Pick<State, 'food'>, who: Who, date: LocalDate): FoodDay {
  const entries = entriesOf(s).filter((e) => e.who === who && e.d === date);
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
