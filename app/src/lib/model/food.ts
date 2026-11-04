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
  entryOrder, foodAccept, foodCustomFold, foodCustomOp, foodOp, foodRecipeFold, foodRecipeOp, foodRepeatFold, foodRepeatOp, MEALS, recipePortion,
  recipeTotals, repeatCovers, round1, FOOD_GOALS, type CustomOp, type FoodCustom, type FoodEntry, type FoodGoalOf, type FoodOp, type FoodSnap, type FoodRecipe, type FoodRepeat, type Meal, type RecipeOp,
  type RepeatOp
} from '#lib/contract/food.ts';
import { isPersonId, isRec, type EventRow } from '#lib/contract/api.ts';
import type { State } from './state.ts';
import { rowAt } from './snapshot.ts';
import { weighIns } from './weight.ts';
import { addDays, daysBetween } from '#lib/time/dates.ts';
import type { LatestGoalKey } from '#lib/contract/goals.ts';
import type { DaySeries } from './health.ts';

/** A day's entries and what they add up to: kcal (whole), protein, fat, carbs and salt (g, one decimal; an unknown
 *  nutrient counts as none). */
export interface FoodDay { entries: FoodEntry[]; kcal: number; p: number; fa: number; c: number; s: number }

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
      if (foodAccept(prev?.op ?? null, op) !== 'append') drop.add(row);
      else {
        // A removal keeps the op it removes: alone, the fold would read it as stale (a removal of nothing), and a
        // later op of the id (queued here) could then set it again.
        if (prev && !op.rm) drop.add(prev.row);
        held.set(op.id, { op, row });
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

/** All of `who`'s live entries across days, the latest changed first (the 最近 list). */
export function foodEntries(s: Pick<State, 'food'>, who: Who): FoodEntry[] {
  return entriesOf(s).filter((e) => e.who === who).sort((a, b) => b.at - a.at);
}

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

/** A day's unrounded totals: kcal and each nutrient (g), as a snapshot's keys. */
type Totals = Record<FoodGoalOf, number>;
const totalsMemo = new WeakMap<object, Map<string, Map<LocalDate, Totals>>>();

/**
 * `who`'s kcal and nutrients per day up to `today`, in one pass (グラフ reads a year at once: no foodDay per day): each
 * day with something in it (a logged entry, or a repeat's items on a day it covers; a 0 kcal item counts) → its
 * unrounded totals, as foodDay adds them up (an unknown nutrient as none). Future days (a repeat fills them too) are
 * left out. Memoised per State, person and day.
 */
function dayTotals(s: Pick<State, 'food' | 'foodRepeat'>, who: Who, today: LocalDate): Map<LocalDate, Totals> {
  let byKey = totalsMemo.get(s);
  if (!byKey) totalsMemo.set(s, (byKey = new Map()));
  const key = `${who}|${today}`;
  let out = byKey.get(key);
  if (out) return out;
  const totals = new Map<LocalDate, Totals>();
  const add = (d: LocalDate, g: number, f: FoodSnap) => {
    let t = totals.get(d);
    if (!t) totals.set(d, (t = { k: 0, p: 0, fa: 0, c: 0, s: 0 }));
    const x = g / 100;
    t.k += f.k * x;
    t.p += (f.p ?? 0) * x;
    t.fa += (f.fa ?? 0) * x;
    t.c += (f.c ?? 0) * x;
    t.s += (f.s ?? 0) * x;
  };
  for (const e of entriesOf(s)) if (e.who === who && e.d <= today) add(e.d, e.g, e.f);
  for (const r of repeatsOf(s)) {
    if (r.who !== who || !r.it.length) continue;
    const last = r.to && r.to < today ? r.to : today;
    for (let d = r.from; d <= last; d = addDays(d, 1)) if (repeatCovers(r, d)) for (const { g, f } of r.it) add(d, g, f);
  }
  byKey.set(key, (out = totals));
  return out;
}

const seriesMemo = new WeakMap<object, Map<string, Omit<DaySeries, 'goal'>>>();

/**
 * `who`'s kcal (`n` 'k') or a nutrient (g) per day for ごはん's グラフ, as けんこう's metrics (health.ts DaySeries, so
 * its bucket and stat rules apply: seriesBuckets, seriesStats): from their first day with a meal (logged, or a
 * repeat's) to `today`, each day's total as foodDay rounds it (repeats included); a day with nothing in it is null
 * (記録なし, never a 0), while a 0 kcal entry is a record. The goal: theirs as of `t` (foodGoal; one for every day;
 * none: null). The days memoised per State, person, day and what.
 */
export function foodSeries(s: State, who: Who, today: LocalDate, n: FoodGoalOf = 'k', t = Infinity): DaySeries {
  let byKey = seriesMemo.get(s);
  if (!byKey) seriesMemo.set(s, (byKey = new Map()));
  const key = `${who}|${today}|${n}`;
  let hit = byKey.get(key);
  if (!hit) {
    const totals = dayTotals(s, who, today);
    let from = today;
    for (const d of totals.keys()) if (d < from) from = d;
    const vals: (number | null)[] = [];
    for (let i = 0, d = from, days = daysBetween(from, today); i <= days; i++, d = addDays(d, 1)) {
      const v = totals.get(d)?.[n];
      vals.push(v === undefined ? null : n === 'k' ? Math.round(v) : round1(v));
    }
    byKey.set(key, (hit = { from, to: today, first: from, vals }));
  }
  const goal = foodGoal(s, who, n, t);
  return { ...hit, goal: () => goal };
}

/** What a recipe, or one serving of it, adds up to: `g` grams, kcal (whole), protein, fat, carbs and salt (g, one
 *  decimal; null: no ingredient knows it). */
interface RecipeSums { g: number; kcal: number; p: number | null; fa: number | null; c: number | null; s: number | null }
/** A recipe as the gohan shows it: who set it (its owner, the only one who edits it), its totals and a serving's. */
export type Recipe = FoodRecipe & { total: RecipeSums; per: RecipeSums };

const recMemo = new WeakMap<State['foodRecipe'], Recipe[]>();
/** Every live recipe, everyone's (anyone logs any of them as an entry of their own), the latest changed first. Memoised
 *  per list. */
export function recipes(s: Pick<State, 'foodRecipe'>): Recipe[] {
  let out = recMemo.get(s.foodRecipe);
  if (!out) {
    out = foodRecipeFold(opsOf<RecipeOp>(s.foodRecipe, foodRecipeOp)).map((r) => {
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

const cusMemo = new WeakMap<State['foodCustom'], FoodCustom[]>();
/** Every live custom food, everyone's (anyone logs any of them as an entry of their own: contract/food.ts customSnap),
 *  the latest changed first, each with who set it (its owner, the only one who edits it). Memoised per list. */
export function customs(s: Pick<State, 'foodCustom'>): FoodCustom[] {
  let out = cusMemo.get(s.foodCustom);
  if (!out) cusMemo.set(s.foodCustom, (out = foodCustomFold(opsOf<CustomOp>(s.foodCustom, foodCustomOp))));
  return out;
}

/** `who`'s daily goal of `n` as they set it (`pref kcalGoal` … `saltGoal`: contract/food.ts FOOD_GOALS), or null. */
export function setGoal(s: Pick<State, 'prefs'>, who: Who, n: FoodGoalOf): number | null {
  return s.prefs[who][FOOD_GOALS[n].key as LatestGoalKey] ?? null;
}

/** `who`'s daily goal of `n`: theirs as set, else protein's default (proteinDefault); kcal, fat, carbs and salt have
 *  none until set (docs/design.md "Gohan": what they should be depends on the person and the plan). */
export function foodGoal(s: State, who: Who, n: FoodGoalOf, t: number): number | null {
  return setGoal(s, who, n) ?? (n === 'p' ? proteinDefault(s, who, t) : null);
}

/** A member's default daily protein target (g, whole): PROTEIN_PER_KG × the latest weigh-in as of `t` (a lifter's
 *  usual aim). Null for the guest (no body data) and without a weigh-in. */
export function proteinDefault(s: State, who: Who, t: number): number | null {
  if (!isPersonId(who)) return null;
  const last = weighIns(s, who, t).at(-1);
  return last ? Math.round(last.kg * PROTEIN_PER_KG) : null;
}
