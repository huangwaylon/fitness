// The meal log's actions (ごはん: its sheet's, loaded with it; store/actions.ts the rest): each records an event through
// the store's backend and the store recomputes the view with it at once (store/actions.ts).
import { week } from './week.svelte.ts';
import type { SendResult } from './backend.ts';
import { world } from './world.svelte.ts';
import type { LocalDate, Who } from '#lib/types.ts';
import { localDateAt } from '#lib/time/dates.ts';
import {
  customSnap, foodCustomOp, foodOp, foodRecipeOp, foodRepeatOp, newCustomId, newFoodId, newRecipeId, newRepeatId, recipeSnap, repeatCovers, round1,
  type FoodEntry, type FoodRepeat, type FoodSnap, type Meal, type RepeatItem, type RepeatOp
} from '#lib/contract/food.ts';
import { nextDay } from '#lib/contract/tokyo.ts';
import { customs, foodDay, foodEntries, mealItems, recipes, repeats } from '#lib/model/food.ts';

// ---- The meal log (ごはん, docs/backend.md#events `food`): each change of mine is one op carrying the entry's whole
// state, sent at once and shown at once (the model folds the queued ops: contract/food.ts foodFold). Only my own
// entries change; a typed-in meal never earns ベル.

let foodLast = 0;
/** An op's time: the relay's clock, never twice the same, after the op it follows. */
function foodNow(after = 0): number {
  foodLast = Math.max(Math.round(world.now()), foodLast + 1, after + 1);
  return foodLast;
}

/** Send a food op as the record will keep it (contract/food.ts foodOp); `{ok:false}` when it isn't one. */
function sendFood(d: Record<string, unknown>): SendResult {
  const op = foodOp(d);
  return op ? week.send('food', { ...op }) : { ok: false };
}

/** Log a meal: `g` grams of `f` (per 100 g, contract/food.ts) on day `d` at meal `m`; `id` the new entry's. */
export function logFood(e: { d: LocalDate; m: Meal; g: number; f: FoodSnap }): SendResult & { id?: string } {
  if (!week.model) return { ok: false };
  const at = foodNow();
  const id = newFoodId(at);
  const res = sendFood({ id, at, d: e.d, m: e.m, g: Math.round(e.g * 10) / 10, f: e.f });
  return res.ok ? { ...res, id } : res;
}

/**
 * Copy a meal, anyone's (everyone sees every meal: my day before's, the partner's, the guest's), into mine: each of its
 * items (a いつもの's too) a new entry of mine on `to.d` at `to.m`, its snapshot as it was logged. `ids`: the new entries',
 * in order (none: nothing to copy, or nothing sent).
 */
export function copyMeal(from: { who: Who; d: LocalDate; m: Meal }, to: { d: LocalDate; m: Meal }): SendResult & { ids: string[] } {
  const m = week.model;
  const ids: string[] = [];
  if (!m) return { ok: false, ids };
  for (const { g, f } of mealItems(m.state, from.who, from.d, from.m)) {
    const r = logFood({ d: to.d, m: to.m, g, f });
    if (r.id) ids.push(r.id);
  }
  return { ok: ids.length > 0, ids };
}

/** One of my entries, as the model has it (queued changes included). */
const myFood = (id: string) => {
  const m = week.model;
  return m ? foodEntries(m.state, m.me).find((e) => e.id === id) : undefined;
};

/** Change one of my entries: its day, meal, grams, portion label (`u`: null drops it) or food (`f`: another state of it,
 *  ごはん's じょうたい). The op is its whole state. */
export function editFood(id: string, ch: { d?: LocalDate; m?: Meal; g?: number; u?: string | null; f?: FoodSnap }): SendResult {
  const e0 = myFood(id);
  if (!e0) return { ok: false };
  const e = ch.f ? { ...e0, f: ch.f } : e0;
  const { u: _u, ...rest } = e.f;
  const f: FoodSnap = ch.u === undefined ? e.f : ch.u === null ? rest : { ...rest, u: ch.u };
  const g = ch.g === undefined ? e.g : Math.round(ch.g * 10) / 10;
  return sendFood({ id, at: foodNow(e.at), d: ch.d ?? e.d, m: ch.m ?? e.m, g, f });
}

/** 「最新の値にする」: one of my entries re-snapshotted, `f` its food as it is now (components/food/fresh.ts latestSnap);
 *  its day, meal and grams kept. An ordinary edit (the owner's only). */
export function refreshFood(id: string, f: FoodSnap): SendResult {
  const e = myFood(id);
  if (!e) return { ok: false };
  return sendFood({ id, at: foodNow(e.at), d: e.d, m: e.m, g: e.g, f });
}

/** Remove one of my entries (final). */
export function removeFood(id: string): SendResult {
  const e = myFood(id);
  if (!e) return { ok: false };
  return sendFood({ id, at: foodNow(e.at), rm: true });
}

// ---- Recurring meals (いつもの, docs/backend.md#events `food_repeat`): a repeat of mine is one op carrying its whole
// state, its days' items read into each day by the model. History is never rewritten: a change of its items or
// weekdays ends it today and starts a new one tomorrow. Each action's ops go out together, so a day never shows its
// meal doubled or empty in between.

const today = (): LocalDate => localDateAt(world.now());

/** Send a repeat op as the record will keep it (contract/food.ts foodRepeatOp), with its `nx` (the record's to check);
 *  `{ok:false}` when it isn't one. */
function sendRepeat(d: Record<string, unknown>): SendResult {
  const op = foodRepeatOp(d);
  return op ? week.send('food_repeat', d.nx === undefined ? { ...op } : { ...op, nx: d.nx }) : { ok: false };
}

/** One of my repeats, as the model has it (queued changes included). */
const myRepeat = (id: string): FoodRepeat | undefined => {
  const m = week.model;
  return m ? repeats(m.state, m.me).find((r) => r.id === id) : undefined;
};

/** My real entries of `meal` on `date` (a repeat's virtual ones left out). */
const myMeal = (meal: Meal, date: LocalDate): FoodEntry[] => {
  const m = week.model;
  return m ? foodDay(m.state, m.me, date).entries.filter((e) => e.m === meal && !e.rep) : [];
};

/** A new repeat's op (a fresh id), or null when it isn't one. */
function repeatOf(r: { m: Meal; it: RepeatItem[]; w: number; from: LocalDate; to?: string; sk?: string[] }): RepeatOp | null {
  const at = foodNow();
  return foodRepeatOp({ id: newRepeatId(at), at, ...r });
}

/** Send a new repeat, and the real entries it now stands for removed (`real`, if their day `date` is one it fills),
 *  so the day shows what it did. */
function sendNewRepeat(op: RepeatOp, date: LocalDate, real: FoodEntry[]): SendResult & { id?: string } {
  if (op.rm || !week.send('food_repeat', { ...op }).ok) return { ok: false };
  if (repeatCovers(op, date)) for (const e of real) sendFood({ id: e.id, at: foodNow(e.at), rm: true });
  return { ok: true, id: op.id };
}

/** My repeat ended on `last` (its skipped days after it dropped), or removed when it starts after `last`; `nx` the
 *  repeat that follows it (the record keeps the end only once it holds that one: contract/food.ts repeatNext). */
function endRepeat(r: FoodRepeat, last: LocalDate, nx?: string): SendResult {
  const { who: _who, ...op } = r;
  if (r.from > last) return sendRepeat({ id: r.id, at: foodNow(r.at), rm: true, nx });
  return sendRepeat({ ...op, at: foodNow(r.at), to: last, sk: r.sk?.filter((d) => d <= last), nx });
}

/**
 * Make `meal` on `date` (my own day) a repeat on the weekdays `w` (contract/food.ts WEEKDAYS), from that day on: its
 * items the meal's entries that day, which the repeat then stands for (they're removed: the day shows no change). One
 * repeat per meal: `{ok:false}` while one of mine still fills it on or after `date`, or the meal is empty.
 */
export function startRepeat(e: { meal: Meal; date: LocalDate; w: number }): SendResult & { id?: string } {
  const m = week.model;
  if (!m || repeats(m.state, m.me).some((r) => r.m === e.meal && (r.to === undefined || r.to >= e.date))) return { ok: false };
  const real = myMeal(e.meal, e.date);
  const op = real.length ? repeatOf({ m: e.meal, it: real.map(({ g, f }) => ({ g, f })), w: e.w, from: e.date }) : null;
  return op ? sendNewRepeat(op, e.date, real) : { ok: false };
}

/**
 * Make one day of my repeat ordinary (to edit or remove one of its items): the repeat skips `date` and the day's items
 * become my real entries, alike. Returns each virtual entry's id (`<repeat id>:<index>`) → its real entry's id, or
 * null (not a day it fills; a day after tomorrow, which no entry may be on yet).
 */
export function detachDay(repeatId: string, date: LocalDate): Record<string, string> | null {
  const r = myRepeat(repeatId);
  if (!r || !repeatCovers(r, date) || date > nextDay(today())) return null;
  const { who: _who, ...op } = r;
  const skip = { ...op, at: foodNow(r.at), sk: [...(r.sk ?? []), date] };
  if (!foodRepeatOp(skip)) return null;
  // the entries first: were the skip to go without them the day would be empty
  const out: Record<string, string> = {};
  r.it.forEach(({ g, f }, i) => {
    const at = foodNow();
    const id = newFoodId(at);
    if (sendFood({ id, at, d: date, m: r.m, g, f }).ok) out[`${r.id}:${i}`] = id;
  });
  return sendRepeat(skip).ok ? out : null;
}

/**
 * Change my repeat from tomorrow on (the days up to today stay as they were): its weekdays `w`, its items those of
 * its meal on `itemsFromDate` (the meal card's, repeated items and real ones alike). It ends today and a new one
 * starts tomorrow (the days the old one skipped carried over); one that hadn't started yet is replaced. The new
 * repeat's id.
 */
export function updateRepeat(repeatId: string, ch: { w?: number; itemsFromDate?: LocalDate }): SendResult & { id?: string } {
  const r = myRepeat(repeatId);
  const m = week.model;
  const now = today();
  if (!r || !m || (r.to !== undefined && r.to <= now)) return { ok: false };
  const from = nextDay(now);
  const shown = ch.itemsFromDate ? foodDay(m.state, m.me, ch.itemsFromDate).entries.filter((e) => e.m === r.m) : null;
  if (shown && !shown.length) return { ok: false };
  const op = repeatOf({ m: r.m, it: shown ? shown.map(({ g, f }) => ({ g, f })) : r.it, w: ch.w ?? r.w, from, to: r.to, sk: r.sk?.filter((d) => d >= from) });
  if (!op) return { ok: false };
  // the new one first, then the old one's end naming it (`nx`): the record keeps the end only once it holds the new
  // one, so were that refused (its first day after the record's tomorrow) the old one goes on as it was
  // the shown meal's real entries, on a day the new one fills (tomorrow's), are what it stands for
  const sent = sendNewRepeat(op, ch.itemsFromDate ?? from, shown && ch.itemsFromDate! >= from ? shown.filter((e) => !e.rep) : []);
  return sent.ok && endRepeat(r, now, op.id).ok ? sent : { ok: false };
}

/** Stop my repeat: it ends today (tomorrow on, nothing; past days unchanged), or is removed if it hadn't started. */
export function stopRepeat(repeatId: string): SendResult {
  const r = myRepeat(repeatId);
  const now = today();
  if (!r || (r.to !== undefined && r.to <= now)) return { ok: false };
  return endRepeat(r, now);
}

// ---- My recipes (マイレシピ, docs/backend.md#events `food_recipe`): a recipe of mine is one op carrying its whole state.
// Anyone's recipe is mine to log: an ordinary entry of mine whose food is the recipe per 100 g (contract/food.ts
// recipeSnap), a snapshot, so a later edit of the recipe never changes a meal already logged.

/** Send a recipe op as the record will keep it (contract/food.ts foodRecipeOp); `{ok:false}` when it isn't one. */
function sendRecipe(d: Record<string, unknown>): SendResult {
  const op = foodRecipeOp(d);
  return op ? week.send('food_recipe', { ...op }) : { ok: false };
}

/** A recipe, anyone's, as the model has it (queued changes included). */
const aRecipe = (id: string) => {
  const m = week.model;
  return m ? recipes(m.state).find((r) => r.id === id) : undefined;
};

/**
 * Save a recipe of mine: `n` its name, `sv` the servings it makes, `it` its ingredients (`g` grams of each food). With
 * `id`, an edit of mine (someone else's isn't mine to change); without, a new one, which is also how another's is
 * copied to mine (its `n`, `sv` and `it`). The recipe's id.
 */
export function saveRecipe(e: { id?: string; n: string; sv: number; it: RepeatItem[] }): SendResult & { id?: string } {
  const me = week.model?.me;
  if (!me) return { ok: false };
  const held = e.id === undefined ? undefined : aRecipe(e.id);
  if (e.id !== undefined && held?.who !== me) return { ok: false };
  const at = foodNow(held?.at);
  const id = held?.id ?? newRecipeId(at);
  const it = e.it.map(({ g, f }) => ({ g: round1(g), f }));
  const r = sendRecipe({ id, at, n: e.n, sv: e.sv, it });
  return r.ok ? { ...r, id } : r;
}

/** Remove a recipe of mine (final; the meals logged from it stay as they were). */
export function removeRecipe(id: string): SendResult {
  const r = aRecipe(id);
  if (!r || r.who !== week.model?.me) return { ok: false };
  return sendRecipe({ id, at: foodNow(r.at), rm: true });
}

/** Log a recipe, anyone's, as a meal of mine: `g` grams of it (recipePortion: 1人前's) on day `d` at meal `m`, `u` the
 *  portion it was picked by (「1人前」). */
export function logRecipe(e: { recipeId: string; d: LocalDate; m: Meal; g: number; u?: string }): SendResult & { id?: string } {
  const r = aRecipe(e.recipeId);
  return r ? logFood({ d: e.d, m: e.m, g: e.g, f: recipeSnap(r, e.u) }) : { ok: false };
}

// ---- My foods (マイ食品, docs/backend.md#events `food_custom`): a custom food of mine is one op carrying its whole
// state. Anyone's is mine to log, like a recipe: an ordinary entry of mine whose food is the custom food per 100 g
// (contract/food.ts customSnap: with no weight, a nominal 100 g per serving), a snapshot.

/** Send a custom food op as the record will keep it (contract/food.ts foodCustomOp); `{ok:false}` when it isn't one. */
function sendCustom(d: Record<string, unknown>): SendResult {
  const op = foodCustomOp(d);
  return op ? week.send('food_custom', { ...op }) : { ok: false };
}

/** A custom food, anyone's, as the model has it (queued changes included). */
const aCustom = (id: string) => {
  const m = week.model;
  return m ? customs(m.state).find((c) => c.id === id) : undefined;
};

/**
 * Save a custom food of mine: `n` its name, `u` its serving's label, `g` the serving's grams (absent: unknown), `k`
 * kcal and `p`/`fa`/`c`/`s`, and `fi`/`al` fibre and alcohol (g; null or absent: unknown) in one serving. With `id`, an edit of mine (someone else's
 * isn't mine to change); without, a new one, which is also how another's is copied to mine. `{ok:false}` when it isn't
 * one the record takes (contract/food.ts foodCustomOp: limits, customDensityOk). The custom food's id.
 */
export function saveCustom(e: {
  id?: string; n: string; u: string; g?: number | null; k: number; p?: number | null; fa?: number | null; c?: number | null; s?: number | null;
  fi?: number | null; al?: number | null;
}): SendResult & { id?: string } {
  const me = week.model?.me;
  if (!me) return { ok: false };
  const held = e.id === undefined ? undefined : aCustom(e.id);
  if (e.id !== undefined && held?.who !== me) return { ok: false };
  const at = foodNow(held?.at);
  const id = held?.id ?? newCustomId(at);
  const g = e.g === undefined || e.g === null ? undefined : Math.round(e.g * 10) / 10;
  const r = sendCustom({ id, at, n: e.n, u: e.u, g, k: e.k, p: e.p ?? null, fa: e.fa ?? null, c: e.c ?? null, s: e.s ?? null, fi: e.fi ?? undefined, al: e.al ?? undefined });
  return r.ok ? { ...r, id } : r;
}

/** Remove a custom food of mine (final; the meals logged from it stay as they were). */
export function removeCustom(id: string): SendResult {
  const c = aCustom(id);
  if (!c || c.who !== week.model?.me) return { ok: false };
  return sendCustom({ id, at: foodNow(c.at), rm: true });
}

/** Log a custom food, anyone's, as a meal of mine: `g` grams of it (customPortions: its serving's, a nominal 100 with no
 *  weight) on day `d` at meal `m`, `u` the portion it was picked by (default: its serving's label). */
export function logCustom(e: { customId: string; d: LocalDate; m: Meal; g: number; u?: string }): SendResult & { id?: string } {
  const c = aCustom(e.customId);
  return c ? logFood({ d: e.d, m: e.m, g: e.g, f: customSnap(c, e.u ?? c.u) }) : { ok: false };
}

