// The meal log (ごはん, docs/backend.md#events `food`, docs/decisions.md "Meal log"): what each of us ate, typed in by
// the person (nothing Health measures), kept in the record and shown on every phone, the guest's too. Each change is
// one op: an entry set (`{id, at, d, m, g, f}`: logged or edited, its whole state) or removed (`{id, at, rm: true}`,
// final: an id never comes back). The record keeps each entry's latest op only (`foodAccept`); its owner is whoever
// sent it, and only the owner changes it. `f` is the food as it was per 100 g (a snapshot: a data refresh never
// rewrites what was eaten), so a day's totals are read off the entries alone. Never earns ベル: the economy never
// imports this. A recurring meal (いつもの, `food_repeat`) is one person's one meal on chosen weekdays from a day on:
// its days' items are computed on read (model/food.ts), never copied into the record, and a change of its items or
// days is an end and a new repeat, so a past day never changes. A recipe (マイレシピ, `food_recipe`) is one person's dish
// of foods and servings, everyone's to log as a food of its own (`recipeSnap`). Shared by the record (relay/src/store.ts), the model
// and the food sheet; pure and dependency-free.
import { isLocalDate, isRec } from './api.ts';
import { cleanLine } from './text.ts';

/** Who logged it: the owner, the only one who edits or removes it. */
type Who = 'A' | 'B' | 'G';

/** The meal: `b` 朝 · `l` 昼 · `d` 夕 · `s` 間食 (the order a day shows them). */
export type Meal = 'b' | 'l' | 'd' | 's';
export const MEALS: readonly Meal[] = ['b', 'l', 'd', 's'];

/** A food per 100 g as it was logged: `n` its name, `k` kcal, `p` protein, `fa` fat, `c` carbs, `s` salt (g; null
 *  unknown), `u` the portion it was picked by (a label: 「1杯」). */
export interface FoodSnap { id: string; n: string; k: number; p: number | null; fa: number | null; c: number | null; s: number | null; u?: string }

export type FoodOp =
  | { id: string; at: number; d: string; m: Meal; g: number; f: FoodSnap; rm?: undefined }
  | { id: string; at: number; rm: true };
type FoodOpBy = FoodOp & { who: Who };
/** An entry as a day shows it: `who` logged it, `at` its last change (ms), `d` the Tokyo day, `g` grams eaten; `rep`
 *  the repeat it comes from (a virtual entry, id `<repeat id>:<item index>`: model/food.ts), absent on a real one. */
export interface FoodEntry { id: string; who: Who; at: number; d: string; m: Meal; g: number; f: FoodSnap; rep?: string }

/** One item of a repeat: `g` grams of `f`, as a `food` op's. */
export interface RepeatItem { g: number; f: FoodSnap }
/** A `food_repeat` op: a repeat set (`it` its items, `w` the weekday mask, `from`…`to` its days, `to` absent:
 *  open-ended, `sk` the days skipped, sorted) or removed (final). */
export type RepeatOp =
  | { id: string; at: number; m: Meal; it: RepeatItem[]; w: number; from: string; to?: string; sk?: string[]; rm?: undefined }
  | { id: string; at: number; rm: true };
export type RepeatOpBy = RepeatOp & { who: Who };
/** A repeat as the record keeps it (its latest op), with who set it. */
export type FoodRepeat = Exclude<RepeatOp, { rm: true }> & { who: Who };

/** Items in one repeat, days it skips at most. */
const REPEAT_ITEMS = 20;
const REPEAT_SKIPS = 400;
/** A repeat set's keys (one string: deps.test would read the first day's key, quoted, as an import). */
const REPEAT_KEYS = 'id at m it w from to sk'.split(' ');
/** The weekday mask: bit 0 Monday … bit 6 Sunday (of the Tokyo date); 毎日, 平日, 週末. */
export const WEEKDAYS = { all: 127, weekdays: 31, weekend: 96 } as const;

/** A food's name at most (characters), its portion label's, its catalog id's. */
export const FOOD_NAME_CHARS = 60;
export const FOOD_PORTION_CHARS = 20;
const SNAP_ID_CHARS = 64;
/** Grams in one entry (one decimal), kcal per 100 g, and each nutrient per 100 g (g), inclusive. */
export const FOOD_GRAMS = { min: 0.1, max: 5000 } as const;
const KCAL_MAX = 950;
const NUTRIENT_MAX = 100;
/** The daily kcal goal (`pref kcalGoal`): an integer in range, a whole `step`. */
export const KCAL_GOAL = { min: 1000, max: 5000, step: 50 } as const;

const ID = /^f[0-9a-z]{6,24}$/;
const REPEAT_ID = /^r[0-9a-z]{6,24}$/;
const isMs = (n: unknown): n is number => Number.isInteger(n) && (n as number) >= 1e12 && (n as number) <= 1e14;
const inRange = (n: unknown, lo: number, hi: number): n is number => typeof n === 'number' && Number.isFinite(n) && n >= lo && n <= hi;
const isMeal = (v: unknown): v is Meal => (MEALS as readonly unknown[]).includes(v);
const oneDecimal = (n: number): boolean => Math.abs(n * 10 - Math.round(n * 10)) < 1e-6;

/** A daily kcal goal: an integer within KCAL_GOAL, a whole KCAL_GOAL.step. */
export const isKcalGoal = (v: unknown): v is number =>
  Number.isInteger(v) && (v as number) >= KCAL_GOAL.min && (v as number) <= KCAL_GOAL.max && (v as number) % KCAL_GOAL.step === 0;

/** A new entry's id. */
export const newFoodId = (at: number, p = 'f'): string => `${p}${at.toString(36)}${Math.floor(Math.random() * 36 ** 4).toString(36).padStart(4, '0')}`;
/** A new repeat's id. */
export const newRepeatId = (at: number): string => newFoodId(at, 'r');

/** A food snapshot, its known keys only, each well-formed (the name and the label cleaned, a missing nutrient null),
 *  or null. */
function snapOf(f: unknown): FoodSnap | null {
  if (!isRec(f) || Object.keys(f).some((k) => f[k] !== undefined && !['id', 'n', 'k', 'p', 'fa', 'c', 's', 'u'].includes(k))) return null;
  if (typeof f.id !== 'string' || !f.id || f.id.length > SNAP_ID_CHARS || !inRange(f.k, 0, KCAL_MAX)) return null;
  const n = cleanLine(f.n, FOOD_NAME_CHARS);
  if (!n) return null;
  const out: FoodSnap = { id: f.id, n, k: f.k, p: null, fa: null, c: null, s: null };
  for (const k of ['p', 'fa', 'c', 's'] as const) {
    const v = f[k];
    if (v === undefined || v === null) continue;
    if (!inRange(v, 0, NUTRIENT_MAX)) return null;
    out[k] = v;
  }
  if (f.u !== undefined) {
    const u = cleanLine(f.u, FOOD_PORTION_CHARS);
    if (u) out.u = u;
  }
  return out;
}

/** A `food` op's data, its known keys only, each well-formed (the food's name cleaned, the grams to one decimal), or
 *  null. The record keeps it as returned here. Whether its day is too far ahead is the record's (model/record.ts). */
export function foodOp(d: unknown): FoodOp | null {
  if (!isRec(d) || typeof d.id !== 'string' || !ID.test(d.id) || !isMs(d.at)) return null;
  const keys = Object.keys(d).filter((k) => d[k] !== undefined);
  const rm = rmOf(d, keys);
  if (rm !== undefined) return rm;
  if (keys.some((k) => !['id', 'at', 'd', 'm', 'g', 'f'].includes(k))) return null;
  if (!isLocalDate(d.d) || !isMeal(d.m) || !inRange(d.g, FOOD_GRAMS.min, FOOD_GRAMS.max) || !oneDecimal(d.g)) return null;
  const f = snapOf(d.f);
  return f && { id: d.id, at: d.at, d: d.d, m: d.m, g: Math.round(d.g * 10) / 10, f };
}

/** A removal op (`{id, at, rm: true}`, nothing else), null when it isn't one, undefined when it isn't a removal. */
function rmOf(d: Record<string, unknown>, keys: string[]): { id: string; at: number; rm: true } | null | undefined {
  if (d.rm === undefined) return undefined;
  if (d.rm !== true || keys.some((k) => k !== 'id' && k !== 'at' && k !== 'rm')) return null;
  return { id: d.id as string, at: d.at as number, rm: true };
}

/** 1…`max` items of `{g, f}`, each as a `food` op's grams and food (known keys only, the grams to one decimal), or
 *  null. */
function itemsOf(v: unknown, max: number): RepeatItem[] | null {
  if (!Array.isArray(v) || !v.length || v.length > max) return null;
  const it: RepeatItem[] = [];
  for (const x of v as unknown[]) {
    if (!isRec(x) || Object.keys(x).some((k) => x[k] !== undefined && k !== 'g' && k !== 'f')) return null;
    if (!inRange(x.g, FOOD_GRAMS.min, FOOD_GRAMS.max) || !oneDecimal(x.g)) return null;
    const f = snapOf(x.f);
    if (!f) return null;
    it.push({ g: Math.round(x.g * 10) / 10, f });
  }
  return it;
}

/** The weekday bit of a local date: bit 0 Monday … bit 6 Sunday. */
export const weekdayBit = (date: string): number => 1 << ((new Date(Date.parse(`${date}T00:00:00Z`)).getUTCDay() + 6) % 7);

/** A `food_repeat` op's data, its known keys only, each well-formed (each item as a `food` op's; `to` null read as
 *  absent; `sk` sorted, once each, within its days; an empty `sk` dropped), or null. The record keeps it as returned
 *  here. Whether its first day is too far ahead is the record's (model/record.ts). `nx` (the repeat that follows this
 *  op's end: `repeatNext`) is the record's to check and never kept: dropped here. */
export function foodRepeatOp(raw: unknown): RepeatOp | null {
  if (!isRec(raw) || (raw.nx !== undefined && repeatNext(raw) === undefined)) return null;
  const { nx: _nx, ...d } = raw;
  if (typeof d.id !== 'string' || !REPEAT_ID.test(d.id) || !isMs(d.at)) return null;
  const keys = Object.keys(d).filter((k) => d[k] !== undefined && !(k === 'to' && d.to === null));
  const rm = rmOf(d, keys);
  if (rm !== undefined) return rm;
  if (keys.some((k) => !REPEAT_KEYS.includes(k))) return null;
  if (!isMeal(d.m) || !Number.isInteger(d.w) || (d.w as number) < 1 || (d.w as number) > 127 || !isLocalDate(d.from)) return null;
  const to = d.to ?? undefined;
  if (to !== undefined && (!isLocalDate(to) || to < d.from)) return null;
  const it = itemsOf(d.it, REPEAT_ITEMS);
  if (!it) return null;
  const out: RepeatOp = { id: d.id, at: d.at, m: d.m, it, w: d.w as number, from: d.from };
  if (to !== undefined) out.to = to;
  if (d.sk !== undefined) {
    if (!Array.isArray(d.sk) || d.sk.length > REPEAT_SKIPS) return null;
    const from = d.from;
    if (d.sk.some((x) => !isLocalDate(x) || x < from || (to !== undefined && x > to))) return null;
    const sk = [...new Set(d.sk as string[])].sort();
    if (sk.length) out.sk = sk;
  }
  return out;
}

/**
 * What the record does with a new op (a `food`, a `food_repeat` or a `food_recipe` one), given the entry's (the repeat's,
 * the recipe's) op it holds (null: none):
 * - `forbidden`: someone else's entry (only its owner, who logged it, edits or removes it);
 * - `stale`: acknowledged, nothing kept (anything after a removal; an op no later than the one held; a removal of an
 *   entry it doesn't hold);
 * - `append`: kept (the entry's row replaced).
 */
export function foodAccept<T extends { at: number; rm?: true; who: Who }>(held: T | null, e: T): 'append' | 'stale' | 'forbidden' {
  if (held?.rm) return 'stale';
  if (held && held.who !== e.who) return 'forbidden';
  if (held ? !e.rm && e.at <= held.at : e.rm) return 'stale';
  return 'append';
}

const MEAL_ORDER: Record<Meal, number> = { b: 0, l: 1, d: 2, s: 3 };

/** The entries as the record keeps them, from the ops in the order they came (the model's rows, then this phone's
 *  queued ones): each taken or not by `foodAccept`, so a phone shows what the record will. By day, then meal, then id
 *  (a new id starts with when it was logged: `newFoodId`), whatever order the ops came in. */
export function foodFold(ops: Iterable<FoodOpBy>): FoodEntry[] {
  const m = new Map<string, FoodOpBy>();
  for (const e of ops) if (foodAccept(m.get(e.id) ?? null, e) === 'append') m.set(e.id, e);
  const out: FoodEntry[] = [];
  for (const e of m.values()) if (!e.rm) out.push({ id: e.id, who: e.who, at: e.at, d: e.d, m: e.m, g: e.g, f: e.f });
  return out.sort(entryOrder);
}

/** foodFold's order of entries: by day, then meal, then id. */
export const entryOrder = (a: FoodEntry, b: FoodEntry): number =>
  a.d < b.d ? -1 : a.d > b.d ? 1 : MEAL_ORDER[a.m] - MEAL_ORDER[b.m] || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);

/** The repeat a `food_repeat` op's end is followed by (`nx`, a repeat's id: the record refuses the op unless it holds
 *  that repeat, so a change is the new repeat and the old one's end, both or neither), or undefined. */
export const repeatNext = (d: Record<string, unknown>): string | undefined =>
  typeof d.nx === 'string' && REPEAT_ID.test(d.nx) ? d.nx : undefined;

/** Repeat `a` with the days `b` skips too, within `a`'s days (the latest REPEAT_SKIPS); `a` itself when `b` adds none. */
function withSkips(a: FoodRepeat, b: FoodRepeat): FoodRepeat {
  const add = (b.sk ?? []).filter((d) => d >= a.from && (a.to === undefined || d <= a.to) && !a.sk?.includes(d));
  return add.length ? { ...a, sk: [...(a.sk ?? []), ...add].sort().slice(-REPEAT_SKIPS) } : a;
}

/**
 * What the record does with a new `food_repeat` op: `foodAccept`'s verdict, and the op the repeat's slot then holds
 * (null: none, or the one held unchanged). A day skipped stays skipped, whichever op comes first: a set op kept over a
 * set one held takes the held one's skipped days too (within its own days), and a stale one's skipped days the held
 * one lacks are added to the held one (`stale`, yet a new op held). So two phones of one owner, one skipping a day
 * (its items made entries) while the other ends or changes the repeat, never show that day's items twice.
 */
export function repeatAccept(held: RepeatOpBy | null, e: RepeatOpBy): { v: ReturnType<typeof foodAccept>; keep: RepeatOpBy | null } {
  const v = foodAccept(held, e);
  if (v === 'forbidden' || !held || held.rm || e.rm) return { v, keep: v === 'append' ? e : null };
  if (v === 'append') return { v, keep: withSkips(e, held) };
  const keep = withSkips(held, e);
  return { v, keep: keep === held ? null : keep };
}

/** The repeats as the record keeps them (each one's ops taken by `repeatAccept`: the latest, with every op's skipped
 *  days), the removed ones gone: by first day, then id. */
export function foodRepeatFold(ops: Iterable<RepeatOpBy>): FoodRepeat[] {
  const m = new Map<string, RepeatOpBy>();
  for (const e of ops) {
    const { keep } = repeatAccept(m.get(e.id) ?? null, e);
    if (keep) m.set(e.id, keep);
  }
  const out: FoodRepeat[] = [];
  for (const e of m.values()) if (!e.rm) out.push(e);
  return out.sort((a, b) => (a.from < b.from ? -1 : a.from > b.from ? 1 : a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}

/** Whether a repeat covers `date`: within its days, on one of its weekdays, not skipped. */
export const repeatCovers = (r: { from: string; to?: string; w: number; sk?: string[] }, date: string): boolean =>
  date >= r.from && (r.to === undefined || date <= r.to) && (r.w & weekdayBit(date)) !== 0 && !r.sk?.includes(date);

// ---- My recipes (マイレシピ, `food_recipe`): a dish put together from foods, `g` grams of each, making `sv` servings.
// Its owner's alone to edit or remove (the food rule: foodAccept), everyone's to log: logging one is an ordinary
// `food` entry of the logger's own whose food is the recipe per 100 g (`recipeSnap`), a snapshot like any food's, so
// an edit of the recipe never changes a meal already logged.

/** A `food_recipe` op: a recipe set (`n` its name, `sv` the servings it makes, `it` its ingredients) or removed
 *  (final). */
export type RecipeOp =
  | { id: string; at: number; n: string; sv: number; it: RepeatItem[]; rm?: undefined }
  | { id: string; at: number; rm: true };
type RecipeOpBy = RecipeOp & { who: Who };
/** A recipe as the record keeps it (its latest op), with who set it. */
export type FoodRecipe = Exclude<RecipeOp, { rm: true }> & { who: Who };

/** A recipe's name at most (characters), its servings (an integer, inclusive), its ingredients at most. */
export const RECIPE = { nameChars: 30, servings: { min: 1, max: 20 }, items: 30 } as const;
const RECIPE_ID = /^c[0-9a-z]{6,24}$/;

/** A new recipe's id. */
export const newRecipeId = (at: number): string => newFoodId(at, 'c');

/** A `food_recipe` op's data, its known keys only, each well-formed (the name cleaned as a food's, each ingredient as a
 *  `food` op's grams and food), or null. The record keeps it as returned here. */
export function foodRecipeOp(d: unknown): RecipeOp | null {
  if (!isRec(d) || typeof d.id !== 'string' || !RECIPE_ID.test(d.id) || !isMs(d.at)) return null;
  const keys = Object.keys(d).filter((k) => d[k] !== undefined);
  const rm = rmOf(d, keys);
  if (rm !== undefined) return rm;
  if (keys.some((k) => !['id', 'at', 'n', 'sv', 'it'].includes(k))) return null;
  const n = cleanLine(d.n, RECIPE.nameChars);
  if (!n || !Number.isInteger(d.sv) || (d.sv as number) < RECIPE.servings.min || (d.sv as number) > RECIPE.servings.max) return null;
  const it = itemsOf(d.it, RECIPE.items);
  return it && { id: d.id, at: d.at, n, sv: d.sv as number, it };
}

/** The recipes as the record keeps them (each one's latest op taken by `foodAccept`, as `foodFold`), the removed ones
 *  gone: the latest changed first, then id. */
export function foodRecipeFold(ops: Iterable<RecipeOpBy>): FoodRecipe[] {
  const m = new Map<string, RecipeOpBy>();
  for (const e of ops) if (foodAccept(m.get(e.id) ?? null, e) === 'append') m.set(e.id, e);
  const out: FoodRecipe[] = [];
  for (const e of m.values()) if (!e.rm) out.push(e);
  return out.sort((a, b) => b.at - a.at || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}

/** What some ingredients add up to: `g` grams, kcal, protein, fat, carbs and salt (g), unrounded; a nutrient null when
 *  no ingredient knows it, else an unknown one counts as none (as a day's totals count it: model/food.ts). */
export interface RecipeTotals { g: number; k: number; p: number | null; fa: number | null; c: number | null; s: number | null }
export function recipeTotals(it: readonly RepeatItem[]): RecipeTotals {
  const t: RecipeTotals = { g: 0, k: 0, p: null, fa: null, c: null, s: null };
  for (const { g, f } of it) {
    t.g += g;
    t.k += (f.k * g) / 100;
    for (const k of ['p', 'fa', 'c', 's'] as const) {
      const v = f[k];
      if (v !== null) t[k] = (t[k] ?? 0) + (v * g) / 100;
    }
  }
  return t;
}

const clampGrams = (g: number): number => Math.min(FOOD_GRAMS.max, Math.max(FOOD_GRAMS.min, Math.round(g * 10) / 10));

/** A recipe as a food per 100 g (its id `recipe:<recipe id>`, its name, `u` the portion label given): its totals over
 *  its grams, kcal to one decimal and each nutrient to two (a mean of foods in range stays in range: snapOf takes it). */
export function recipeSnap(r: { id: string; n: string; it: readonly RepeatItem[] }, u?: string): FoodSnap {
  const t = recipeTotals(r.it);
  const per = (v: number, by: number): number => Math.round(((v * 100) / t.g) * by) / by;
  const nut = (v: number | null): number | null => (v === null ? null : per(v, 100));
  const f: FoodSnap = { id: `recipe:${r.id}`, n: r.n, k: per(t.k, 10), p: nut(t.p), fa: nut(t.fa), c: nut(t.c), s: nut(t.s) };
  if (u) f.u = u;
  return f;
}

/** One serving of a recipe: 「1人前」, its grams (its total over its servings, to one decimal, within a `food` entry's
 *  grams). */
export function recipePortion(r: { sv: number; it: readonly RepeatItem[] }): { label: string; g: number } {
  return { label: '1人前', g: clampGrams(recipeTotals(r.it).g / r.sv) };
}
