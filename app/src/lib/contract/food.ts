// The meal log (ごはん, docs/backend.md#events `food`, docs/decisions.md "Meal log"): what each of us ate, typed in by
// the person (nothing Health measures), kept in the record and shown on every phone, the guest's too. Each change is
// one op: an entry set (`{id, at, d, m, g, f}`: logged or edited, its whole state) or removed (`{id, at, rm: true}`,
// final: an id never comes back). The record keeps each entry's latest op only (`foodAccept`); its owner is whoever
// sent it, and only the owner changes it. `f` is the food as it was per 100 g (a snapshot: a data refresh never
// rewrites what was eaten), so a day's totals are read off the entries alone. Never earns ベル: the economy never
// imports this. A recurring meal (いつもの, `food_repeat`) is one person's one meal on chosen weekdays from a day on:
// its days' items are computed on read (model/food.ts), never copied into the record, and a change of its items or
// days is an end and a new repeat, so a past day never changes. A recipe (マイレシピ, `food_recipe`) is one person's dish
// of foods and servings, everyone's to log as a food of its own (`recipeSnap`); a custom food (マイ食品, `food_custom`) one
// person's food typed in as one serving, everyone's to log alike (`customSnap`). Shared by the record (relay/src/store.ts), the model
// and the food sheet; pure and dependency-free.
import { isLocalDate } from './api.ts';
import { isRec } from './guards.ts';
import { cleanLine } from './text.ts';
import { GOALS } from './goals.ts';
import { isMs, newOpId } from './ops.ts';

/** Who logged it: the owner, the only one who edits or removes it. */
type Who = 'A' | 'B' | 'G';

/** The meal: `b` 朝 · `l` 昼 · `d` 夕 · `s` 間食 (the order a day shows them). */
export type Meal = 'b' | 'l' | 'd' | 's';
export const MEALS: readonly Meal[] = ['b', 'l', 'd', 's'];

/** A food per 100 g as it was logged: `n` its name, `k` kcal, `p` protein, `fa` fat, `c` carbs, `s` salt (g; null
 *  unknown), `fi` fibre (食物繊維総量; g, absent or null: unknown, since 2026-11-05: the record keeps it only when known;
 *  an older snapshot's `al`, alcohol, no longer tracked, read and left out), `u` the portion it was picked by (a label: 「1杯」). `sv`: a serving with no known weight (a custom food's:
 *  `customSnap`), its values per serving and an entry's grams a nominal 100 per serving (shown as servings, never
 *  grams); within a custom food's per-serving limits (CUSTOM) rather than a food's per 100 g. `est`: a chain menu's
 *  values' trust as Kalori gave it (food/types.ts Item `est`: `p` PFC estimated, `s` fibre/salt, `e` all; absent:
 *  official or not a chain menu's; since 2026-11-20), so the entry can say 推定. `hs`: the share of its salt eaten (a
 *  soup or broth with half of it left: 0.5, スープ半分; absent: all), `s` staying the food's own (snapSalt reads both;
 *  since 2026-11-20). */
export interface FoodSnap { id: string; n: string; k: number; p: number | null; fa: number | null; c: number | null; s: number | null; fi?: number | null; u?: string; sv?: true; est?: SnapEst; hs?: SnapHalf }
/** A snapshot's `est`. */
type SnapEst = 'p' | 's' | 'e';
const SNAP_EST: readonly unknown[] = ['p', 's', 'e'];
/** A snapshot's `hs`: half the broth left (スープ半分), its salt counted at half. */
const SNAP_HALF = 0.5;
type SnapHalf = typeof SNAP_HALF;
/** A snapshot's salt per 100 g as eaten (`s` × `hs`), null: unknown. */
export const snapSalt = (f: Pick<FoodSnap, 's' | 'hs'>): number | null => (f.s === null ? null : f.hs === SNAP_HALF ? f.s * SNAP_HALF : f.s);
/** A snapshot with its broth half left (スープ半分: `hs`) or all eaten. */
export function withHalf(f: FoodSnap, half: boolean): FoodSnap {
  const { hs: _, ...rest } = f;
  return half ? { ...rest, hs: SNAP_HALF } : rest;
}

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
/** A serving with no known weight logs as this many (nominal) grams: an entry of `n` servings is `n` × 100 g of a
 *  snapshot whose values are per serving (`sv`). */
const NOMINAL_G = 100;
/** The meal log's daily goals (contract/goals.ts GOALS, the registry: each a `pref` per person, its key, range, step
 *  and direction): kcal, then protein, fat, carbs, salt and fibre in g. */
export const FOOD_GOALS = { k: GOALS.k, p: GOALS.p, fa: GOALS.fa, c: GOALS.c, s: GOALS.s, fi: GOALS.fi } as const;
/** What a meal-log goal is of: kcal (`k`) or a nutrient, as a snapshot's keys. */
export type FoodGoalOf = keyof typeof FOOD_GOALS;
export const FOOD_GOAL_OF = ['k', 'p', 'fa', 'c', 's', 'fi'] as const satisfies readonly FoodGoalOf[];
/** A snapshot's nutrients (g): the four every snapshot has (null: unknown), then fibre (optional: kept only when
 *  known). */
const SNAP_NUTRIENTS = ['p', 'fa', 'c', 's', 'fi'] as const;
type SnapNutrient = (typeof SNAP_NUTRIENTS)[number];
/** The optional ones: absent on a snapshot from before them (2026-11-05) or with the value unknown. */
const OPTIONAL_NUTRIENTS = ['fi'] as const;
/** Alcohol (`al`), no longer tracked (the user 2026-11-19): an older row's is read and left out, never a refusal. */
const LEGACY = 'al';

const ID = /^f[0-9a-z]{6,24}$/;
const REPEAT_ID = /^r[0-9a-z]{6,24}$/;
const inRange = (n: unknown, lo: number, hi: number): n is number => typeof n === 'number' && Number.isFinite(n) && n >= lo && n <= hi;
const isMeal = (v: unknown): v is Meal => (MEALS as readonly unknown[]).includes(v);
const oneDecimal = (n: number): boolean => Math.abs(n * 10 - Math.round(n * 10)) < 1e-6;

/** A new entry's id. */
export const newFoodId = (at: number, p = 'f'): string => newOpId(p, at);
/** A new repeat's id. */
export const newRepeatId = (at: number): string => newFoodId(at, 'r');

/** A food snapshot, its known keys only, each well-formed (the name and the label cleaned, a missing nutrient null;
 *  fibre kept only when known; an older one's alcohol left out; `est` one of SNAP_EST; `hs` SNAP_HALF), or null. */
function snapOf(f: unknown): FoodSnap | null {
  if (!isRec(f) || Object.keys(f).some((k) => f[k] !== undefined && !['id', 'n', 'k', 'p', 'fa', 'c', 's', 'fi', LEGACY, 'u', 'sv', 'est', 'hs'].includes(k))) return null;
  if ((f.sv !== undefined && f.sv !== true) || (f.est !== undefined && !SNAP_EST.includes(f.est)) || (f.hs !== undefined && f.hs !== SNAP_HALF)) return null;
  const sv = f.sv === true;
  const [kMax, nMax] = sv ? [CUSTOM.kcalMax, CUSTOM.nutrientMax] : [KCAL_MAX, NUTRIENT_MAX];
  if (typeof f.id !== 'string' || !f.id || f.id.length > SNAP_ID_CHARS || !inRange(f.k, 0, kMax)) return null;
  const n = cleanLine(f.n, FOOD_NAME_CHARS);
  if (!n) return null;
  const out: FoodSnap = { id: f.id, n, k: f.k, p: null, fa: null, c: null, s: null };
  for (const k of SNAP_NUTRIENTS) {
    const v = f[k];
    if (v === undefined || v === null) continue;
    if (!inRange(v, 0, nMax)) return null;
    out[k] = v;
  }
  if (f.u !== undefined) {
    const u = cleanLine(f.u, FOOD_PORTION_CHARS);
    if (u) out.u = u;
  }
  if (sv) out.sv = true;
  if (f.est !== undefined) out.est = f.est as SnapEst;
  if (f.hs !== undefined) out.hs = SNAP_HALF;
  return out;
}

/** A `food` op's data, its known keys only, each well-formed (the food's name cleaned, the grams to one decimal), or
 *  null. The record keeps it as returned here. Whether its day is too far ahead is the record's (contract/record.ts). */
export function foodOp(d: unknown): FoodOp | null {
  if (!isRec(d) || typeof d.id !== 'string' || !ID.test(d.id) || !isMs(d.at)) return null;
  const keys = Object.keys(d).filter((k) => d[k] !== undefined);
  const rm = rmOf(d, keys);
  if (rm !== undefined) return rm;
  if (keys.some((k) => !['id', 'at', 'd', 'm', 'g', 'f'].includes(k))) return null;
  if (!isLocalDate(d.d) || !isMeal(d.m) || !inRange(d.g, FOOD_GRAMS.min, FOOD_GRAMS.max) || !oneDecimal(d.g)) return null;
  const f = snapOf(d.f);
  return f && { id: d.id, at: d.at, d: d.d, m: d.m, g: round1(d.g), f };
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
    it.push({ g: round1(x.g), f });
  }
  return it;
}

/** The weekday bit of a local date: bit 0 Monday … bit 6 Sunday. */
export const weekdayBit = (date: string): number => 1 << ((new Date(Date.parse(`${date}T00:00:00Z`)).getUTCDay() + 6) % 7);

/** A `food_repeat` op's data, its known keys only, each well-formed (each item as a `food` op's; `to` null read as
 *  absent; `sk` sorted, once each, within its days; an empty `sk` dropped), or null. The record keeps it as returned
 *  here. Whether its first day is too far ahead is the record's (contract/record.ts). `nx` (the repeat that follows this
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

/** A `food_recipe` op: a recipe set (`n` its name, `sv` the servings it makes, `it` its ingredients, `cw` its finished
 *  weight, できあがりの重さ: the pot weighed once cooked, g; absent: unknown, the ingredients' grams counted instead;
 *  since 2026-11-20) or removed (final). */
export type RecipeOp =
  | { id: string; at: number; n: string; sv: number; it: RepeatItem[]; cw?: number; rm?: undefined }
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
 *  `food` op's grams and food, `cw` an entry's grams, one decimal, null read as absent), or null; a finished weight that
 *  would make the dish denser than a food can be (recipeDensityOk) refused. The record keeps it as returned here. */
export function foodRecipeOp(d: unknown): RecipeOp | null {
  if (!isRec(d) || typeof d.id !== 'string' || !RECIPE_ID.test(d.id) || !isMs(d.at)) return null;
  const keys = Object.keys(d).filter((k) => d[k] !== undefined);
  const rm = rmOf(d, keys);
  if (rm !== undefined) return rm;
  if (keys.some((k) => !['id', 'at', 'n', 'sv', 'it', 'cw'].includes(k))) return null;
  const n = cleanLine(d.n, RECIPE.nameChars);
  if (!n || !Number.isInteger(d.sv) || (d.sv as number) < RECIPE.servings.min || (d.sv as number) > RECIPE.servings.max) return null;
  const cw = d.cw ?? undefined;
  if (cw !== undefined && (!inRange(cw, FOOD_GRAMS.min, FOOD_GRAMS.max) || !oneDecimal(cw))) return null;
  const it = itemsOf(d.it, RECIPE.items);
  if (!it) return null;
  const out: RecipeOp = { id: d.id, at: d.at, n, sv: d.sv as number, it };
  if (cw !== undefined) out.cw = round1(cw);
  return recipeDensityOk(out) ? out : null;
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

/** What some ingredients add up to: `g` grams (of those with a weight: a serving with none, `sv`, has only a nominal
 *  100 g, never counted since 2026-11-20), kcal, protein, fat, carbs, salt and fibre (g), unrounded; a nutrient null
 *  when no ingredient knows it, else an unknown one counts as none (as a day's totals count it: model/food.ts). */
interface RecipeTotals { g: number; k: number; p: number | null; fa: number | null; c: number | null; s: number | null; fi: number | null }
export function recipeTotals(it: readonly RepeatItem[]): RecipeTotals {
  const t: RecipeTotals = { g: 0, k: 0, p: null, fa: null, c: null, s: null, fi: null };
  for (const { g, f } of it) {
    if (f.sv !== true) t.g += g;
    t.k += (f.k * g) / 100;
    for (const k of SNAP_NUTRIENTS) {
      const v = k === 's' ? snapSalt(f) : f[k];
      if (v !== null && v !== undefined) t[k] = (t[k] ?? 0) + (v * g) / 100;
    }
  }
  return t;
}

/** Fibre onto a snapshot, only when known (`nut` its value as kept, or null). */
function withOptional(f: FoodSnap, t: Partial<Record<SnapNutrient, number | null>>, nut: (v: number | null) => number | null): FoodSnap {
  for (const k of OPTIONAL_NUTRIENTS) {
    const v = nut(t[k] ?? null);
    if (v !== null) f[k] = v;
  }
  return f;
}

/** To one decimal (kcal, grams, nutrients as shown and kept). */
export function round1(v: number): number {
  return Math.round(v * 10) / 10;
}

const clampGrams = (g: number): number => Math.min(FOOD_GRAMS.max, Math.max(FOOD_GRAMS.min, round1(g)));

/** What a recipe is made of, as the dish's values read it. */
type RecipeOf = { sv: number; it: readonly RepeatItem[]; cw?: number };

/** Whether a recipe logs by the serving: an ingredient has no weight (`sv`: a custom food's, a chain menu's) until
 *  it is weighed (the editor asks: recipeFlow weighItem) or the dish is (`cw`). By weight its values would spread over
 *  the weighed grams only (60 g of rice and a 400 kcal sauce: 796 kcal per 100 g, a plate's grams counted far over:
 *  review 2026-11-20). */
const bySv = (r: RecipeOf): boolean => r.cw === undefined && r.it.some((x) => x.f.sv === true);

/** A recipe's weight as its values spread over (g, unrounded): its finished weight (`cw`) when weighed, else its
 *  ingredients' grams; null when it logs by the serving (bySv). */
export function recipeWeight(r: RecipeOf): number | null {
  return r.cw ?? (bySv(r) ? null : recipeTotals(r.it).g);
}

/** Whether a recipe's finished weight (`cw`) leaves it no denser than a food can be per 100 g (KCAL_MAX, NUTRIENT_MAX:
 *  a snapshot snapOf takes); true with none (its ingredients' grams: each within those already). */
export function recipeDensityOk(r: RecipeOf): boolean {
  if (r.cw === undefined) return true;
  const t = recipeTotals(r.it), by = 100 / r.cw;
  return t.k * by <= KCAL_MAX && SNAP_NUTRIENTS.every((k) => (t[k] ?? 0) * by <= NUTRIENT_MAX);
}

/** A recipe as a food per 100 g (its id `recipe:<recipe id>`, its name, `u` the portion label given): its totals over
 *  its weight (recipeWeight: the finished weight when weighed, else its ingredients' grams), kcal to one decimal and
 *  each nutrient to two (in range: snapOf takes it). With an ingredient of no known weight and the dish unweighed
 *  (bySv): one serving (its totals over its servings) per a nominal 100 g, an `sv` snapshot (1人前 = 100). */
export function recipeSnap(r: RecipeOf & { id: string; n: string }, u?: string): FoodSnap {
  const t = recipeTotals(r.it);
  const w = recipeWeight(r);
  const sv = w === null;
  const per = (v: number, by: number): number => Math.round((sv ? v / r.sv : (v * 100) / w) * by) / by;
  const nut = (v: number | null): number | null => (v === null ? null : per(v, 100));
  const f: FoodSnap = withOptional({ id: `recipe:${r.id}`, n: r.n, k: per(t.k, 10), p: nut(t.p), fa: nut(t.fa), c: nut(t.c), s: nut(t.s) }, t, nut);
  if (u) f.u = u;
  if (sv) f.sv = true;
  return f;
}

/** A recipe's portions: 「1人前」, its grams (its weight over its servings, to one decimal, within a `food` entry's
 *  grams: recipeWeight, the finished weight when weighed; a nominal 100 when it logs by the serving: recipeSnap), and
 *  「全部」 when it makes more (all its servings, within an entry's grams). */
export function recipePortions(r: RecipeOf): { label: string; g: number }[] {
  const w = recipeWeight(r);
  const one = { label: '1人前', g: w === null ? NOMINAL_G : clampGrams(w / r.sv) };
  const all = w === null ? NOMINAL_G * r.sv : round1(w);
  return r.sv > 1 && all <= FOOD_GRAMS.max ? [one, { label: '全部', g: all }] : [one];
}
/** One serving of a recipe (recipePortions' first). */
export const recipePortion = (r: RecipeOf): { label: string; g: number } => recipePortions(r)[0];

// ---- My foods (マイ食品, `food_custom`): a food not in the food data, typed in by someone as one serving (`u` its label,
// `g` its grams when known) and what that serving holds. Shared like a recipe: its owner's alone to edit or remove
// (foodAccept), everyone's to log; logging one is an ordinary `food` entry of the logger's own whose food is the
// custom food per 100 g (`customSnap`), a snapshot, so an edit never changes a meal already logged. A serving with no
// weight logs as a nominal 100 g per serving, its snapshot's values per serving (`sv`).

/** A `food_custom` op: a custom food set (`n` its name, `u` its serving's label, `g` the serving's grams (absent:
 *  unknown), `k` kcal and `p`/`fa`/`c`/`s` protein, fat, carbs and salt in one serving: g; null unknown; `fi`
 *  fibre likewise, kept only when known (an older op's `al`, alcohol, left out); `jan` the barcode of the product it was made from (表示値を確認's
 *  直す: its owner's scan and search offer it first), none for one typed in) or removed (final). */
export type CustomOp =
  | { id: string; at: number; n: string; u: string; g?: number; k: number; p: number | null; fa: number | null; c: number | null; s: number | null; fi?: number; jan?: string; rm?: undefined }
  | { id: string; at: number; rm: true };
type CustomOpBy = CustomOp & { who: Who };
/** A custom food as the record keeps it (its latest op), with who set it. */
export type FoodCustom = Exclude<CustomOp, { rm: true }> & { who: Who };
/** What a custom food is made of (an op's set data, or a FoodCustom). */
type CustomData = { id: string; n: string; u: string; g?: number; k: number; p: number | null; fa: number | null; c: number | null; s: number | null; fi?: number | null; jan?: string };

/** A custom food's name and serving label at most (characters), its serving's grams (one decimal), kcal and each
 *  nutrient in one serving (inclusive). */
export const CUSTOM = { nameChars: 30, labelChars: 20, grams: { min: 0.1, max: 5000 }, kcalMax: 5000, nutrientMax: 500 } as const;
const CUSTOM_ID = /^m[0-9a-z]{6,24}$/;
/** A custom food's `jan`: a product's barcode as the scanner normalises it (lib/scan/barcode.ts: EAN-8, EAN-13, UPC-A
 *  padded to 13; OFF's own codes up to 14). */
const CUSTOM_JAN = /^\d{8,14}$/;

/** A new custom food's id. */
export const newCustomId = (at: number): string => newFoodId(at, 'm');

/** The grams one serving of a custom food logs as: its own, or NOMINAL_G with no weight known. */
export const customGrams = (c: { g?: number }): number => c.g ?? NOMINAL_G;

/** A `food_custom` op's data, its known keys only, each well-formed (the name and the label cleaned, the grams to one
 *  decimal, a missing nutrient null), or null. A serving with grams can't hold more than a food per 100 g (KCAL_MAX,
 *  NUTRIENT_MAX): refused. The record keeps it as returned here. */
export function foodCustomOp(d: unknown): CustomOp | null {
  if (!isRec(d) || typeof d.id !== 'string' || !CUSTOM_ID.test(d.id) || !isMs(d.at)) return null;
  const keys = Object.keys(d).filter((k) => d[k] !== undefined);
  const rm = rmOf(d, keys);
  if (rm !== undefined) return rm;
  if (keys.some((k) => !['id', 'at', 'n', 'u', 'g', 'k', 'p', 'fa', 'c', 's', 'fi', LEGACY, 'jan'].includes(k))) return null;
  if (d.jan !== undefined && (typeof d.jan !== 'string' || !CUSTOM_JAN.test(d.jan))) return null;
  const n = cleanLine(d.n, CUSTOM.nameChars);
  const u = cleanLine(d.u, CUSTOM.labelChars);
  if (!n || !u || !inRange(d.k, 0, CUSTOM.kcalMax)) return null;
  const out: CustomOp = { id: d.id, at: d.at, n, u, k: d.k, p: null, fa: null, c: null, s: null };
  if (d.g !== undefined) {
    if (!inRange(d.g, CUSTOM.grams.min, CUSTOM.grams.max) || !oneDecimal(d.g)) return null;
    out.g = round1(d.g);
  }
  for (const k of SNAP_NUTRIENTS) {
    const v = d[k];
    if (v === undefined || v === null) continue;
    if (!inRange(v, 0, CUSTOM.nutrientMax)) return null;
    out[k] = v;
  }
  if (d.jan !== undefined) out.jan = d.jan as string;
  return customDensityOk(out) ? out : null;
}

/** Whether a custom food's serving, when its weight is known, is no denser than a food can be (at most KCAL_MAX kcal
 *  and NUTRIENT_MAX g of each nutrient per 100 g; foodCustomOp refuses it else). True with no weight. */
export function customDensityOk(c: { g?: number; k: number } & Partial<Record<SnapNutrient, number | null>>): boolean {
  const g = c.g;
  return g === undefined || ((c.k * 100) / g <= KCAL_MAX && SNAP_NUTRIENTS.every((k) => ((c[k] ?? 0) * 100) / g <= NUTRIENT_MAX));
}

/** The custom foods as the record keeps them (each one's latest op taken by `foodAccept`, as `foodFold`), the removed
 *  ones gone: the latest changed first, then id. */
export function foodCustomFold(ops: Iterable<CustomOpBy>): FoodCustom[] {
  const m = new Map<string, CustomOpBy>();
  for (const e of ops) if (foodAccept(m.get(e.id) ?? null, e) === 'append') m.set(e.id, e);
  const out: FoodCustom[] = [];
  for (const e of m.values()) if (!e.rm) out.push(e);
  return out.sort((a, b) => b.at - a.at || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}

/** A custom food as a food per 100 g (its id `custom:<custom food id>`, its name, `u` the portion label given): one
 *  serving over its grams, kcal to one decimal and each nutrient to two; with no weight, its serving's own values
 *  (per a nominal 100 g) and `sv` set. */
export function customSnap(c: CustomData, u?: string): FoodSnap {
  const by = 100 / customGrams(c);
  const nut = (v: number | null): number | null => (v === null ? null : Math.round(v * by * 100) / 100);
  const f: FoodSnap = withOptional({ id: `custom:${c.id}`, n: c.n, k: round1(c.k * by), p: nut(c.p), fa: nut(c.fa), c: nut(c.c), s: nut(c.s) }, c, nut);
  if (u) f.u = u;
  if (c.g === undefined) f.sv = true;
  return f;
}

/** A custom food's portions: its serving (its label, `customGrams`), then 100g when its serving's weight is known. */
export function customPortions(c: Pick<CustomData, 'u' | 'g'>): { label: string; g: number }[] {
  const ps = [{ label: c.u, g: customGrams(c) }];
  if (c.g !== undefined && c.g !== 100) ps.push({ label: '100g', g: 100 });
  return ps;
}
