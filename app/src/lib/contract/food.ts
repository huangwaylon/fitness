// The meal log (ごはん, docs/backend.md#events `food`, docs/decisions.md "Meal log"): what each of us ate, typed in by
// the person (nothing Health measures), kept in the record and shown on every phone, the guest's too. Each change is
// one op: an entry set (`{id, at, d, m, g, f}`: logged or edited, its whole state) or removed (`{id, at, rm: true}`,
// final: an id never comes back). The record keeps each entry's latest op only (`foodAccept`); its owner is whoever
// sent it, and only the owner changes it. `f` is the food as it was per 100 g (a snapshot: a data refresh never
// rewrites what was eaten), so a day's totals are read off the entries alone. Never earns ベル: the economy never
// imports this. Shared by the record (relay/src/store.ts), the model and the food sheet; pure and dependency-free.
import { isLocalDate, isRec } from './api.ts';
import { cleanLine } from './board.ts';

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
/** An entry as a day shows it: `who` logged it, `at` its last change (ms), `d` the Tokyo day, `g` grams eaten. */
export interface FoodEntry { id: string; who: Who; at: number; d: string; m: Meal; g: number; f: FoodSnap }

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
const isMs = (n: unknown): n is number => Number.isInteger(n) && (n as number) >= 1e12 && (n as number) <= 1e14;
const inRange = (n: unknown, lo: number, hi: number): n is number => typeof n === 'number' && Number.isFinite(n) && n >= lo && n <= hi;
const isMeal = (v: unknown): v is Meal => (MEALS as readonly unknown[]).includes(v);
const oneDecimal = (n: number): boolean => Math.abs(n * 10 - Math.round(n * 10)) < 1e-6;

/** A daily kcal goal: an integer within KCAL_GOAL, a whole KCAL_GOAL.step. */
export const isKcalGoal = (v: unknown): v is number =>
  Number.isInteger(v) && (v as number) >= KCAL_GOAL.min && (v as number) <= KCAL_GOAL.max && (v as number) % KCAL_GOAL.step === 0;

/** A new entry's id. */
export const newFoodId = (at: number): string => `f${at.toString(36)}${Math.floor(Math.random() * 36 ** 4).toString(36).padStart(4, '0')}`;

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
  if (d.rm !== undefined) {
    if (d.rm !== true || keys.some((k) => k !== 'id' && k !== 'at' && k !== 'rm')) return null;
    return { id: d.id, at: d.at, rm: true };
  }
  if (keys.some((k) => !['id', 'at', 'd', 'm', 'g', 'f'].includes(k))) return null;
  if (!isLocalDate(d.d) || !isMeal(d.m) || !inRange(d.g, FOOD_GRAMS.min, FOOD_GRAMS.max) || !oneDecimal(d.g)) return null;
  const f = snapOf(d.f);
  return f && { id: d.id, at: d.at, d: d.d, m: d.m, g: Math.round(d.g * 10) / 10, f };
}

/**
 * What the record does with a new op, given the entry's op it holds (null: none):
 * - `forbidden`: someone else's entry (only its owner, who logged it, edits or removes it);
 * - `stale`: acknowledged, nothing kept (anything after a removal; an op no later than the one held; a removal of an
 *   entry it doesn't hold);
 * - `append`: kept (the entry's row replaced).
 */
export function foodAccept(held: FoodOpBy | null, e: FoodOpBy): 'append' | 'stale' | 'forbidden' {
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
  return out.sort((a, b) => (a.d < b.d ? -1 : a.d > b.d ? 1 : MEAL_ORDER[a.m] - MEAL_ORDER[b.m] || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)));
}
