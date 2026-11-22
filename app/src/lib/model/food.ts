// The meal log (ごはん, docs/backend.md#events `food`): each person's entries as the record keeps them (the `food` ops
// folded by the record's rules: contract/food.ts foodFold), a day's of them with its totals, and the day's targets
// (the goals: kcal and the nutrients, prefs; protein by default from the latest weigh-in), and the repeats (いつもの: `food_repeat` folded alike),
// whose items are read into each day they cover as virtual entries (never copied into the record: a past day stays as
// it was, since a change of a repeat is an end and a new one), and the recipes (マイレシピ: `food_recipe` folded alike,
// everyone's, each with its totals and a serving's), and the custom foods (マイ食品: `food_custom` folded alike,
// everyone's). Everyone's are read alike: the guest sees every meal and
// logs its own. Pure; the economy never imports this (deps.test.ts): a meal is worth no ベル.
import type { LocalDate, Who } from '#lib/types.ts';
import {
  entryOrder, foodAccept, sharedAccept, sharedKept, snapSalt, foodCustomFold, foodCustomOp, foodOp, foodRecipeFold, foodRecipeOp, foodRepeatFold, foodRepeatOp, MEALS, recipePortion,
  recipeTotals, recipeWeight, repeatCovers, round1, FOOD_GOAL_OF, FOOD_GOALS, type CustomOp, type FoodCustom, type FoodEntry, type FoodGoalOf, type FoodOp, type FoodSnap, type FoodRecipe, type FoodRepeat, type Meal, type RecipeOp, type RepeatItem,
  type RepeatOp
} from '#lib/contract/food.ts';
import { isPersonId, type EventRow } from '#lib/contract/api.ts';
import { isRec } from '#lib/contract/guards.ts';
import type { State } from './state.ts';
import { rowAt } from './snapshot.ts';
import { weighIns } from './weight.ts';
import { fibreDefault, kcalDefault, profileOf, ageAt, proteinRda, saltDefault } from './profile.ts';
import { addDays, daysBetween } from '#lib/time/dates.ts';
import { goalFallback, GOALS, goalMet, type LatestGoalKey } from '#lib/contract/goals.ts';
import type { DaySeries } from './health.ts';

/** A day's entries and what they add up to: kcal (whole), protein, fat, carbs and salt (g, one decimal; an
 *  unknown nutrient counts as none; salt as eaten: スープ半分's half, contract/food.ts snapSalt), and fibre (g, one decimal; null when no entry knows its fibre: an older snapshot
 *  has none, and most products' labels don't say). */
export interface FoodDay { entries: FoodEntry[]; kcal: number; p: number; fa: number; c: number; s: number; fi: number | null }

/** Protein to aim for per kg of body weight a day (g). */
const PROTEIN_PER_KG = 1.6;

const ops = new WeakMap<EventRow, object | null>();
/**
 * A raw row's op (state.ts keeps food rows unparsed), validated by `parse` as the record's (contract/food.ts) and
 * with who sent it, or null (unreadable, invalid, or naming a `person`: reduce's rule). Memoised per row: rows are
 * never mutated, and the same row objects come back in every State after a poll, so each row is parsed once.
 */
function opOf<T extends object>(row: EventRow, parse: (d: unknown) => T | null): (T & { who: Who }) | null {
  let op = ops.get(row);
  if (op === undefined) {
    let d: unknown = null;
    try {
      d = row[4] === '' ? {} : JSON.parse(row[4]);
    } catch { /* unreadable: ignored */ }
    const v = isRec(d) && d.person === undefined ? parse(d) : null;
    ops.set(row, (op = v && { ...v, who: row[1] }));
  }
  return op as (T & { who: Who }) | null;
}
/** Whether rows[from…] are in server `at` order after `prev` (the previous row's), every `at` readable. */
function ordered(rows: readonly EventRow[], from: number, prev: number): boolean {
  for (let i = from; i < rows.length; i++) {
    const at = rowAt(rows[i]);
    if (at === null || at < prev) return false;
    prev = at;
  }
  return true;
}
/** A raw list in server `at` order (reduce's order for the other rows: stable, an unreadable `at` dropped). */
const byAt = (rows: readonly EventRow[]): readonly EventRow[] => ordered(rows, 0, -Infinity) ? rows
  : rows.map((r, i) => [r, rowAt(r), i] as const).filter((x) => x[1] !== null).sort((x, y) => x[1]! - y[1]! || x[2] - y[2]).map((x) => x[0]);
/** A raw list's ops, in server `at` order. */
function* opsOf<T extends object>(rows: readonly EventRow[], parse: (d: unknown) => T | null): Generator<T & { who: Who }> {
  for (const r of byAt(rows)) {
    const op = opOf(r, parse);
    if (op) yield op;
  }
}

type EntryOp = FoodOp & { who: Who };
const live = (e: EntryOp): FoodEntry | null => (e.rm ? null : { id: e.id, who: e.who, at: e.at, d: e.d, m: e.m, g: e.g, f: e.f });
/**
 * The fold of a list the last lists began with (rows in `at` order): each entry's op the record keeps, and the
 * entries. A poll appends rows to the same row objects, so the next list is folded from here, over its new rows only
 * (`held` and `entries` are shared by every list read from it, never changed: a step past STEP rows starts a new one).
 */
let base: { rows: readonly EventRow[]; held: Map<string, EntryOp>; entries: FoodEntry[]; lastAt: number } | null = null;
const STEP = 256;

const memo = new WeakMap<State['food'], FoodEntry[]>();
/** Every live entry, everyone's (foodFold's order: by day, meal, id). Memoised per list, folded from `base` when the
 *  list extends its rows (only the new rows parsed and folded: a poll costs O(new rows) + one merge). */
function entriesOf(s: Pick<State, 'food'>): FoodEntry[] {
  const rows = s.food;
  let out = memo.get(rows);
  if (out) return out;
  const b = base;
  let n = b ? b.rows.length : 0;
  if (!b || rows.length < n || (n && rows[n - 1] !== b.rows[n - 1]) || !ordered(rows, n, b.lastAt) || b.rows.some((r, i) => rows[i] !== r)) {
    // Not an extension of the base (another row set, or rows out of order): the whole fold (foodFold's), the new base.
    const held = new Map<string, EntryOp>();
    for (const e of opsOf<FoodOp>(rows, foodOp)) if (foodAccept(held.get(e.id) ?? null, e) === 'append') held.set(e.id, e);
    out = [];
    for (const e of held.values()) {
      const x = live(e);
      if (x) out.push(x);
    }
    out.sort(entryOrder);
    if (ordered(rows, 0, -Infinity)) base = { rows, held, entries: out, lastAt: rows.length ? rowAt(rows[rows.length - 1])! : -Infinity };
  } else {
    // The new rows over the base's fold: the entries they change replaced, in order (a sorted run and a few: ~O(n)).
    const changed = new Map<string, EntryOp>();
    for (; n < rows.length; n++) {
      const e = opOf<FoodOp>(rows[n], foodOp);
      if (e && foodAccept(changed.get(e.id) ?? b.held.get(e.id) ?? null, e) === 'append') changed.set(e.id, e);
    }
    out = changed.size ? b.entries.filter((e) => !changed.has(e.id)) : b.entries;
    if (changed.size) {
      for (const e of changed.values()) {
        const x = live(e);
        if (x) out.push(x);
      }
      out.sort(entryOrder);
    }
    if (rows.length - b.rows.length >= STEP) {
      const held = new Map(b.held);
      for (const [id, e] of changed) held.set(id, e);
      base = { rows, held, entries: out, lastAt: rowAt(rows[rows.length - 1])! };
    }
  }
  memo.set(rows, out);
  return out;
}

const repMemo = new WeakMap<State['foodRepeat'], FoodRepeat[]>();
/** Every repeat, everyone's (foodRepeatFold's order: by first day, id). Memoised per list. */
function repeatsOf(s: Pick<State, 'foodRepeat'>): FoodRepeat[] {
  let out = repMemo.get(s.foodRepeat);
  if (!out) repMemo.set(s.foodRepeat, (out = foodRepeatFold(opsOf<RepeatOp>(s.foodRepeat, foodRepeatOp))));
  return out;
}

/** The meal log's raw event types whose ops compaction may drop, and how each op is read (as the record reads it:
 *  contract/food.ts): those folded by foodAccept alone, the latest op per id. Not `food_repeat`: its fold
 *  (repeatAccept) takes every op's skipped days, so an op it replaced still counts. */
const PARSE: Partial<Record<EventRow[3], (d: unknown) => (object & { id: string; at: number; rm?: true }) | null>> = {
  food: foodOp, food_recipe: foodRecipeOp, food_custom: foodCustomOp
};

/**
 * For the client cache's compaction (model/compact.ts): the meal log's rows of `events` its fold no longer reads, an
 * op of an entry, a recipe or a custom food another op of the same id replaced (a polling phone gets every op; the
 * record keeps the latest only) and an op the fold refuses (someone else's, a stale one, anything after a removal). What is left per id
 * is the op the record keeps, a removal with the op it removed (final). Unreadable rows stay (the model skips them, as the other tabs').
 */
export function foldedAway(events: readonly EventRow[]): Set<EventRow> {
  const lists = new Map<string, EventRow[]>();
  for (const r of events) if (PARSE[r[3]]) (lists.get(r[3]) ?? lists.set(r[3], []).get(r[3])!).push(r);
  const drop = new Set<EventRow>();
  for (const [type, rows] of lists) {
    const held = new Map<string, { op: { at: number; rm?: true; who: Who }; row: EventRow }>();
    for (const row of byAt(rows)) {
      const op = opOf(row, PARSE[type as EventRow[3]]!);
      if (!op) continue;
      const prev = held.get(op.id);
      const shared = type !== 'food';
      if ((shared ? sharedAccept : foodAccept)(prev?.op ?? null, op) !== 'append') drop.add(row);
      else {
        // A removal keeps the op it removes: alone, the fold would read it as stale (a removal of nothing), and a
        // later op of the id (queued here) could then set it again.
        if (prev && !op.rm) drop.add(prev.row);
        held.set(op.id, { op: shared ? sharedKept(prev?.op ?? null, op) : op, row });
      }
    }
  }
  return drop;
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

const byWho = new WeakMap<FoodEntry[], Map<Who, readonly FoodEntry[]>>();
/** All of `who`'s live entries across days, the latest changed first (the 最近 list). Memoised per fold and person:
 *  the sheet asks several times an update (さいきん, this trip's entries, the entry to change). */
export function foodEntries(s: Pick<State, 'food'>, who: Who): readonly FoodEntry[] {
  const all = entriesOf(s);
  let m = byWho.get(all);
  if (!m) byWho.set(all, (m = new Map()));
  let out = m.get(who);
  if (!out) m.set(who, (out = all.filter((e) => e.who === who).sort((a, b) => b.at - a.at)));
  return out;
}

/** `who`'s entries of `date` and their totals: by meal, each meal's repeat's items first (in its order; the UI keeps
 *  one repeat per meal, the record need not), then the real ones as logged. */
export function foodDay(s: Pick<State, 'food' | 'foodRepeat'>, who: Who, date: LocalDate): FoodDay {
  const real = entriesOf(s).filter((e) => e.who === who && e.d === date);
  const reps = repeatsOf(s).filter((r) => r.who === who && repeatCovers(r, date));
  const entries = MEALS.flatMap((m) => [...reps.filter((r) => r.m === m).flatMap((r) => repeatEntries(r, date)), ...real.filter((e) => e.m === m)]);
  const t = emptyTotals();
  for (const { g, f } of entries) addTo(t, g, f);
  return { entries, kcal: Math.round(t.k), p: round1(t.p), fa: round1(t.fa), c: round1(t.c), s: round1(t.s), fi: t.fi === null ? null : round1(t.fi) };
}

/** A meal as it was eaten: `who`'s `meal` on `date` (a いつもの's items too), each its grams and snapshot, to log afresh
 *  as someone's own (store/actions.ts copyMeal: new entries of the copier's). */
export function mealItems(s: Pick<State, 'food' | 'foodRepeat'>, who: Who, date: LocalDate, meal: Meal): RepeatItem[] {
  return foodDay(s, who, date).entries.filter((e) => e.m === meal).map(({ g, f }) => ({ g, f }));
}

/** A meal to copy into mine (きのうと おなじ, 〇〇と おなじ): whose, which day, what it holds. */
export interface CopySource { who: Who; date: LocalDate; items: RepeatItem[] }
/** Where my `meal` on `date` can be copied from: my own the day before, then each of `others`' (everyone sees every
 *  meal, the guest's too) on the same day, in that order; only those with something in them. */
export function copySources(s: Pick<State, 'food' | 'foodRepeat'>, me: Who, others: readonly Who[], date: LocalDate, meal: Meal): CopySource[] {
  const out: CopySource[] = [];
  const add = (who: Who, d: LocalDate) => {
    const items = mealItems(s, who, d, meal);
    if (items.length) out.push({ who, date: d, items });
  };
  add(me, addDays(date, -1));
  for (const w of others) if (w !== me) add(w, date);
  return out;
}

/** A day's unrounded totals: kcal and each nutrient (g), as a snapshot's keys; fibre null while no entry knows it; `n`
 *  its entries' weight and `kn` the weight of those knowing each nutrient (Coverage: by kcal, `weight`); `own` the main
 *  meals logged by hand that day (MAIN_BIT), `has` those with anything in them, a repeat's items too. */
type Totals = Record<Exclude<FoodGoalOf, 'fi'>, number> & { fi: number | null; n: number; kn: Record<Nutrient, number>; own: number; has: number };
const emptyTotals = (): Totals => ({ k: 0, p: 0, fa: 0, c: 0, s: 0, fi: null, n: 0, kn: { p: 0, fa: 0, c: 0, s: 0, fi: 0 }, own: 0, has: 0 });
/** The nutrients a snapshot may not know (kcal it always does). */
export type Nutrient = Exclude<FoodGoalOf, 'k'>;
const NUTRIENTS = ['p', 'fa', 'c', 's', 'fi'] as const satisfies readonly Nutrient[];
const knows = (f: FoodSnap, k: Nutrient): boolean => f[k] !== null && f[k] !== undefined;
/** An entry's weight in a coverage: its kcal (a 0 kcal tea 1, so it isn't nothing): a sauce's unknown salt matters
 *  less than a meal's. */
const weight = (g: number, f: FoodSnap): number => Math.max(1, (f.k * g) / 100);
/** `g` grams of `f` into a day's totals (an unknown nutrient as none; fibre known once any entry knows it). */
function addTo(t: Totals, g: number, f: FoodSnap): void {
  const x = g / 100;
  t.k += f.k * x;
  const m = entryPfc({ g, f });
  t.p += m.p ?? 0;
  t.fa += m.fa ?? 0;
  t.c += m.c ?? 0;
  t.s += (snapSalt(f) ?? 0) * x;
  if (f.fi !== undefined && f.fi !== null) t.fi = (t.fi ?? 0) + f.fi * x;
  const w = weight(g, f);
  t.n += w;
  for (const k of NUTRIENTS) if (knows(f, k)) t.kn[k] += w;
}

/** 朝, 昼 and 夜 as bits (おやつ none: a snack never makes a day). */
const MAIN_BIT: Record<Meal, number> = { b: 1, l: 2, d: 4, s: 0 };
const ALL_MAIN = 7;
/** A snack logged by hand, in `own` beside the main meals' bits (never towards `recorded`). */
const SNACK_BIT = 8;
/**
 * Whether a day counts as recorded (グラフ: its bars, ticks, averages and n日分): two of 朝, 昼 and 夜 logged by hand
 * (`own`, a skipped breakfast's 昼 and 夜 too), or all three with something in them (`has`: a repeat's items too, a
 * whole day set up to repeat). The review of 2026-11-20: weeks of a usual breakfast alone, or with a 12 kcal 昼, read
 * as 248 kcal days. Snacks don't count towards it. A day short of it is shown on its day (FoodSummary's note), never
 * counted, so an average is of whole days.
 */
const recorded = (own: number, has: number): boolean => (own & (own - 1)) !== 0 || (has & ALL_MAIN) === ALL_MAIN;
/** Why a day's entries (foodDay's) aren't a recorded day (`recorded`): 'rep' a repeat's items alone (いつものだけ),
 *  'few' fewer meals than it takes; null: it counts, or there is nothing. */
export function uncounted(entries: readonly Pick<FoodEntry, 'm' | 'rep'>[]): 'rep' | 'few' | null {
  let own = 0;
  let has = 0;
  for (const e of entries) {
    has |= MAIN_BIT[e.m];
    if (!e.rep) own |= MAIN_BIT[e.m] || SNACK_BIT;
  }
  if (!entries.length || recorded(own & ALL_MAIN, has)) return null;
  return own ? 'few' : 'rep';
}

/** How much of a total its entries know (a nutrient): `all` of them, `most` (KNOWN_MOST of them and up: the total
 *  shown 「≥」, 一部不明) or `few` (under it: 「≥」, わかった分だけ, the total a floor only); by their kcal (`weight`). */
export type Coverage = 'all' | 'most' | 'few';
const KNOWN_MOST = 0.7;
export const coverageOf = (known: number, n: number): Coverage => (known >= n ? 'all' : known >= KNOWN_MOST * n ? 'most' : 'few');
/** A day's entries' coverage of nutrient `k` (Coverage, by kcal). */
export function entriesCoverage(entries: readonly { g: number; f: FoodSnap }[], k: Nutrient): Coverage {
  let known = 0;
  let n = 0;
  for (const { g, f } of entries) {
    const w = weight(g, f);
    n += w;
    if (knows(f, k)) known += w;
  }
  return coverageOf(known, n);
}
const totalsMemo = new WeakMap<object, Map<string, Map<LocalDate, Totals>>>();

/** Each of `who`'s items eaten from `from` (null: their first) to `to`, a day's logged entries and its repeats' items
 *  alike (`rep` true for these), by day only where it matters (the callers sum). */
function eachItem(s: Pick<State, 'food' | 'foodRepeat'>, who: Who, from: LocalDate | null, to: LocalDate, fn: (d: LocalDate, g: number, f: FoodSnap, m: Meal, rep: boolean) => void): void {
  for (const e of entriesOf(s)) if (e.who === who && e.d <= to && (from === null || e.d >= from)) fn(e.d, e.g, e.f, e.m, false);
  for (const r of repeatsOf(s)) {
    if (r.who !== who || !r.it.length) continue;
    const last = r.to && r.to < to ? r.to : to;
    for (let d = from !== null && from > r.from ? from : r.from; d <= last; d = addDays(d, 1)) if (repeatCovers(r, d)) for (const { g, f } of r.it) fn(d, g, f, r.m, true);
  }
}

/**
 * `who`'s kcal and nutrients per day up to `today`, in one pass (グラフ reads a year at once: no foodDay per day): each
 * recorded day (`recorded`: two main meals logged, a 0 kcal item too, or 朝昼夜 all filled, a repeat's too; a usual
 * breakfast alone is not) → its unrounded totals (a repeat's items in them), as foodDay adds them up (an unknown nutrient as none). Future days (a repeat fills them too) are
 * left out. `going`: `today` is still going, so anything logged on it keeps it (グラフ draws it, its stats leave it out).
 * Memoised per State, person, day and `going`.
 */
function dayTotals(s: Pick<State, 'food' | 'foodRepeat'>, who: Who, today: LocalDate, going = false): Map<LocalDate, Totals> {
  let byKey = totalsMemo.get(s);
  if (!byKey) totalsMemo.set(s, (byKey = new Map()));
  const key = `${who}|${today}|${going}`;
  let out = byKey.get(key);
  if (out) return out;
  const totals = totalsOf(s, who, null, today);
  for (const [d, t] of totals) if (!recorded(t.own & ALL_MAIN, t.has) && !(going && d === today && t.own)) totals.delete(d);
  byKey.set(key, (out = totals));
  return out;
}

/** `who`'s unrounded totals per day from `from` (null: their first) to `to`, the meals' bits with them. */
function totalsOf(s: Pick<State, 'food' | 'foodRepeat'>, who: Who, from: LocalDate | null, to: LocalDate): Map<LocalDate, Totals> {
  const totals = new Map<LocalDate, Totals>();
  eachItem(s, who, from, to, (d, g, f, m, rep) => {
    let t = totals.get(d);
    if (!t) totals.set(d, (t = emptyTotals()));
    addTo(t, g, f);
    t.has |= MAIN_BIT[m];
    if (!rep) t.own |= MAIN_BIT[m] || SNACK_BIT;
  });
  return totals;
}

/** `who`'s kcal (whole) on each whole day from `from` to `to` (朝, 昼 and 夜 all logged, a repeat's too), a few days
 *  without the whole history's pass (model/pace.ts's calculation: `recorded`'s two meals overstate a deficit for someone
 *  who doesn't log breakfast); a day short of it is absent. */
export function wholeDayKcal(s: Pick<State, 'food' | 'foodRepeat'>, who: Who, from: LocalDate, to: LocalDate): Map<LocalDate, number> {
  const out = new Map<LocalDate, number>();
  for (const [d, t] of totalsOf(s, who, from, to)) if ((t.has & ALL_MAIN) === ALL_MAIN) out.set(d, Math.round(t.k));
  return out;
}

const seriesMemo = new WeakMap<object, Map<string, Omit<DaySeries, 'goal'>>>();

/**
 * `who`'s kcal (`n` 'k') or a nutrient (g) per day for ごはん's グラフ, as けんこう's metrics (health.ts DaySeries, so
 * its bucket and stat rules apply: seriesBuckets, seriesStats): from their first recorded day (dayTotals) to `today`,
 * each day's total as foodDay rounds it (repeats included); a day with nothing in it, or short of `recorded`, is null
 * (記録なし, never a 0), while a 0 kcal entry is a record. The goal: theirs as of `t` (foodGoal; one for every day;
 * none: null), met the goal's way (contract/goals.ts goalMet: protein at least, salt at most, kcal near it). The days memoised per State, person, day and what.
 */
export function foodSeries(s: State, who: Who, today: LocalDate, n: FoodGoalOf = 'k', t = Infinity): DaySeries {
  let byKey = seriesMemo.get(s);
  if (!byKey) seriesMemo.set(s, (byKey = new Map()));
  const key = `${who}|${today}|${n}`;
  let hit = byKey.get(key);
  if (!hit) {
    const totals = dayTotals(s, who, today, true);
    let from = today;
    for (const d of totals.keys()) if (d < from) from = d;
    const vals: (number | null)[] = [];
    for (let i = 0, d = from, days = daysBetween(from, today); i <= days; i++, d = addDays(d, 1)) {
      const v = totals.get(d)?.[n];
      vals.push(v === undefined || v === null ? null : n === 'k' ? Math.round(v) : round1(v));
    }
    byKey.set(key, (hit = { from, to: today, first: from, vals }));
  }
  const goal = foodGoal(s, who, n, t);
  return { ...hit, goal: () => goal, met: goal === null ? undefined : (v) => goalMet(n, v, goal) };
}

/** A range's daily averages (グラフ's average card): `from`…`to` the days it covers, `days` its recorded days (記録 n日:
 *  dayTotals'), kcal (whole) and each nutrient (g, one decimal) over them, an unknown one as none (fibre null: no entry
 *  knows it); `known` each nutrient's coverage over their entries (Coverage: 「≥」 and why); `salty` the food that gave
 *  the most salt over them (by its id, named as last logged; `times` how often), null with no salt known. */
export interface FoodAverage {
  from: LocalDate; to: LocalDate; days: number; kcal: number; p: number; fa: number; c: number; s: number; fi: number | null;
  known: Record<Nutrient, Coverage>; salty: { n: string; times: number; s: number } | null;
}

/**
 * `who`'s average day over from..to (a day with nothing logged, or short of `recorded`, left out, as グラフ's
 * averages: 記録なし, never a 0; a recorded day's repeats counted), or null with no recorded day in them. グラフ's average
 * card passes its range, ended at yesterday when it holds today: today is never finished.
 */
export function foodAverage(s: Pick<State, 'food' | 'foodRepeat'>, who: Who, from: LocalDate, to: LocalDate): FoodAverage | null {
  if (to < from) return null;
  const totals = dayTotals(s, who, to);
  const sum = emptyTotals();
  let days = 0;
  for (const [d, t] of totals) {
    if (d < from) continue;
    days += 1;
    for (const k of ['k', 'p', 'fa', 'c', 's'] as const) sum[k] += t[k];
    if (t.fi !== null) sum.fi = (sum.fi ?? 0) + t.fi;
    sum.n += t.n;
    for (const k of NUTRIENTS) sum.kn[k] += t.kn[k];
  }
  if (!days) return null;
  // the saltiest food: the recorded days' items summed by food
  const salt = new Map<string, { n: string; times: number; s: number }>();
  eachItem(s, who, from, to, (d, g, f) => {
    const fs = snapSalt(f);
    if (!fs || !totals.has(d)) return;
    const x = salt.get(f.id) ?? salt.set(f.id, { n: f.n, times: 0, s: 0 }).get(f.id)!;
    x.n = f.n;
    x.times += 1;
    x.s += (fs * g) / 100;
  });
  let salty: FoodAverage['salty'] = null;
  for (const x of salt.values()) if (!salty || x.s > salty.s) salty = x;
  const avg = (v: number) => round1(v / days);
  return {
    from, to, days, kcal: Math.round(sum.k / days), p: avg(sum.p), fa: avg(sum.fa), c: avg(sum.c), s: avg(sum.s),
    fi: sum.fi === null ? null : avg(sum.fi),
    known: Object.fromEntries(NUTRIENTS.map((k) => [k, coverageOf(sum.kn[k], sum.n)])) as Record<Nutrient, Coverage>,
    salty: salty && { ...salty, s: round1(salty.s) }
  };
}

/** The 食事摂取基準（2025年版）'s 目標量 for the share of energy (%E, adults): protein 13–20 (the lower bound 14 from 50,
 *  15 from 65: the adults' here), fat 20–30, carbohydrate 50–65. */
export const PFC_RANGES = { p: [13, 20], fa: [20, 30], c: [50, 65] } as const;
export type PfcOf = keyof typeof PFC_RANGES;
/** kcal per gram: protein and carbohydrate 4, fat 9 (Atwater). */
const ATWATER = { p: 4, fa: 9, c: 4 } as const;

/** Each one's share of the energy (%E, unrounded) and where it sits against PFC_RANGES (as rounded to a whole %: −1
 *  under, 0 within, 1 over). */
interface PfcShare { p: number; fa: number; c: number; at: Record<PfcOf, -1 | 0 | 1> }

/**
 * Protein, fat and carbohydrate as shares of energy, from their grams: each one's Atwater energy over
 * their sum, so the shares add up to 100 and a bar of them is whole (a source's kcal is measured otherwise, and fibre
 * in the carbohydrate is counted at 4: close enough for a share). Null
 * with no energy from any.
 */
export function pfcShare(g: { p: number; fa: number; c: number }): PfcShare | null {
  const e = { p: g.p * ATWATER.p, fa: g.fa * ATWATER.fa, c: g.c * ATWATER.c };
  const all = e.p + e.fa + e.c;
  if (!(all > 0)) return null;
  const pct = (v: number) => (v * 100) / all;
  const out = { p: pct(e.p), fa: pct(e.fa), c: pct(e.c) };
  const at = (n: PfcOf): -1 | 0 | 1 => {
    const v = Math.round(out[n]), [lo, hi] = PFC_RANGES[n];
    return v < lo ? -1 : v > hi ? 1 : 0;
  };
  return { ...out, at: { p: at('p'), fa: at('fa'), c: at('c') } };
}

/**
 * An entry's protein, fat and carbs (g), unrounded: its grams over 100 times its snapshot's per 100 g (an `sv` item's
 * grams are its servings × 100, so ½ a serving is 50; a recipe's snapshot is per 100 g of it too). Null where the
 * snapshot doesn't know it (shown 「–」, never 0). A day's totals add these very values (addTo), rounding once.
 */
export function entryPfc(e: { g: number; f: Pick<FoodSnap, PfcOf> }): Record<PfcOf, number | null> {
  const x = e.g / 100;
  const of = (v: number | null | undefined) => (v === null || v === undefined ? null : v * x);
  return { p: of(e.f.p), fa: of(e.f.fa), c: of(e.f.c) };
}

/** A day's kcal for the PFC tints while no kcal goal is set (a typical adult day; never from body data). */
const TINT_KCAL = 2000;
/** kcal per gram (Atwater): protein, fat, carbohydrate. */
const KCAL_PER_G: Record<PfcOf, number> = { p: 4, fa: 9, c: 4 };
/**
 * `who`'s day of P, F and C (g) that きろく's rows are tinted against: each as they set it, else its share of the kcal
 * goal they set (else TINT_KCAL) at the PFC_RANGES' midpoint (protein 16.5 %E, fat 25 %E, carbohydrate 57.5 %E). Never
 * the protein default (a weigh-in's) nor the profile's kcal: a tint says "a big part of your day", from goals alone.
 */
export function pfcTintGoals(s: Pick<State, 'prefs'> | null, who: Who): Record<PfcOf, number> {
  const k = (s && setGoal(s, who, 'k')) || TINT_KCAL;
  const of = (n: PfcOf) => (s && setGoal(s, who, n)) || (k * (PFC_RANGES[n][0] + PFC_RANGES[n][1])) / 200 / KCAL_PER_G[n];
  return { p: of('p'), fa: of('fa'), c: of('c') };
}
/** An entry's P, F or C as a share of the day's (pfcTintGoals) from which its row tints it: an eighth a light tint (1),
 *  a quarter (a meal's worth) a stronger one in bold, 「多め」 to a screen reader (2). */
const PFC_TINT_AT = [1 / 8, 1 / 4] as const;
export type PfcTint = 0 | 1 | 2;
export function pfcTint(v: number | null, goal: number): PfcTint {
  if (v === null || !(goal > 0)) return 0;
  const r = v / goal;
  return r >= PFC_TINT_AT[1] ? 2 : r >= PFC_TINT_AT[0] ? 1 : 0;
}

/** What a meal's entries hold of protein (g, one decimal; an unknown one as none): its chip on きろく. */
export const mealProtein = (entries: readonly { g: number; f: FoodSnap }[]): number => round1(entries.reduce((s, { g, f }) => s + ((f.p ?? 0) * g) / 100, 0));

/** What a recipe, or one serving of it, adds up to: `g` grams, kcal (whole), protein, fat, carbs and salt (g, one
 *  decimal; null: no ingredient knows it). */
interface RecipeSums { g: number; kcal: number; p: number | null; fa: number | null; c: number | null; s: number | null }
/** A recipe as the gohan shows it: who made it (its creator, the only one who removes it; anyone edits it), its totals
 *  and a serving's. */
export type Recipe = FoodRecipe & { total: RecipeSums; per: RecipeSums };

/** A recipe with its totals and a serving's (its ingredients `it`: its own, or as resolved now: components/food/fresh.ts
 *  resolveItems). */
export function recipeView(r: FoodRecipe, it: RepeatItem[] = r.it): Recipe {
  const t = recipeTotals(it);
  const x = { ...r, it };
  const sums = (by: number, g: number): RecipeSums => {
    const n = (v: number | null) => (v === null ? null : round1(v / by));
    return { g, kcal: Math.round(t.k / by), p: n(t.p), fa: n(t.fa), c: n(t.c), s: n(t.s) };
  };
  return { ...x, total: sums(1, round1(recipeWeight(x) ?? t.g)), per: sums(r.sv, recipePortion(x).g) };
}

const recMemo = new WeakMap<State['foodRecipe'], Recipe[]>();
/** Every live recipe, everyone's (anyone logs any of them as an entry of their own), the latest changed first. Memoised
 *  per list. */
export function recipes(s: Pick<State, 'foodRecipe'>): Recipe[] {
  let out = recMemo.get(s.foodRecipe);
  if (!out) {
    out = foodRecipeFold(opsOf<RecipeOp>(s.foodRecipe, foodRecipeOp)).map((r) => recipeView(r));
    recMemo.set(s.foodRecipe, out);
  }
  return out;
}

const cusMemo = new WeakMap<State['foodCustom'], FoodCustom[]>();
/** Every live custom food, everyone's (anyone logs any of them as an entry of their own: contract/food.ts customSnap),
 *  the latest changed first, each with who made it (its creator, the only one who removes it; anyone edits it). Memoised per list. */
export function customs(s: Pick<State, 'foodCustom'>): FoodCustom[] {
  let out = cusMemo.get(s.foodCustom);
  if (!out) cusMemo.set(s.foodCustom, (out = foodCustomFold(opsOf<CustomOp>(s.foodCustom, foodCustomOp))));
  return out;
}

/** `who`'s daily goal of `n` as they set it (`pref kcalGoal` … `saltGoal`: contract/food.ts FOOD_GOALS), or null. */
export function setGoal(s: Pick<State, 'prefs'>, who: Who, n: FoodGoalOf): number | null {
  return s.prefs[who][FOOD_GOALS[n].key as LatestGoalKey] ?? null;
}

/** `who`'s daily goal of `n`: theirs as set, else its default: protein's (proteinDefault), with a profile kcal's, salt's
 *  and fibre's (model/profile.ts kcalDefault, saltDefault, fibreDefault); fat and carbs have none until set (docs/design.md "Gohan":
 *  what they should be depends on the plan). A default never overrides a goal that's set. */
export function foodGoal(s: State, who: Who, n: FoodGoalOf, t: number): number | null {
  return setGoal(s, who, n) ?? foodDefault(s, who, n, t);
}
/** Each of `who`'s daily goals (foodGoal), none without a model yet. */
export function foodGoals(m: { state: State; now: number } | null, who: Who): Record<FoodGoalOf, number | null> {
  return Object.fromEntries(FOOD_GOAL_OF.map((n) => [n, m ? foodGoal(m.state, who, n, m.now) : null])) as Record<FoodGoalOf, number | null>;
}

/** `who`'s default goal of `n` (shown while none is set): the registry's computed one (contract/goals.ts `derived`), else
 *  its fixed one (`fallback`), or null. */
function foodDefault(s: State, who: Who, n: FoodGoalOf, t: number): number | null {
  const d = GOALS[n].derived;
  return d === 'protein' ? proteinDefault(s, who, t) : d === 'energy' ? kcalDefault(s, who, t) : d === 'salt' ? saltDefault(s, who, t)
    : d === 'fibre' ? fibreDefault(s, who, t) : goalFallback(n, who);
}

/** A member's default daily protein target (g, whole): PROTEIN_PER_KG × the latest weigh-in as of `t` (a lifter's
 *  usual aim), and with a profile never under the 推奨量 (model/profile.ts proteinRda). Null for the guest (no body
 *  data) and without a weigh-in. */
export function proteinDefault(s: State, who: Who, t: number): number | null {
  if (!isPersonId(who)) return null;
  const last = weighIns(s, who, t).at(-1);
  if (!last) return null;
  const { sex } = profileOf(s, who), age = ageAt(s, who, t), g = Math.round(last.kg * PROTEIN_PER_KG);
  return sex && age !== null ? Math.max(g, proteinRda(sex, age)) : g;
}
