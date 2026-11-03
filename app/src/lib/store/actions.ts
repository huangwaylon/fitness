// One function per user action. Each records an event through the store's backend (live: the write queue,
// lib/sync/queue.ts; demo: kept in memory, demo/backend.ts) and the store recomputes the view with it at once through
// the model, so a tap moves the wallet and きろく the same way everywhere. Results are synchronous.
import { week } from './week.svelte.ts';
import type { SendResult } from './backend.ts';
import { toasts } from '#lib/ui-state/toast.svelte.ts';
import { newId } from '#lib/sync/queue.ts';
import { setLocale, t, type Locale } from '#lib/i18n/index.ts';
import type { LocalDate, PersonId, ShopItemId, Who } from '#lib/types.ts';
import { isBodyFatGoal, isWeightKg, nextDay, roundKg, type FindKind } from '#lib/contract/api.ts';
import { findKey, findsView } from '#lib/model/finds.ts';
import { addToTally, latestByDay } from '#lib/model/tally.ts';
import { localDateAt } from '#lib/time/dates.ts';
import { MOVE_GOAL, isStepsGoal, shopPrice } from '#lib/config/rules.ts';
import {
  foodOp, foodRecipeOp, foodRepeatOp, isKcalGoal, newFoodId, newRecipeId, newRepeatId, recipeSnap, repeatCovers, type FoodEntry, type FoodRepeat,
  type FoodSnap, type Meal, type RepeatItem, type RepeatOp
} from '#lib/contract/food.ts';
import { foodDay, foodEntries, recipes, repeats } from '#lib/model/food.ts';
import { world } from './world.svelte.ts';

/** 買う！ and its とりけす wait this long before they are sent, with もとに戻す on the banner. */
const UNDO_MS = 5000;

/**
 * The banner for an action held UNDO_MS: it names what was done and carries もとに戻す; hovering, touching
 * or focusing it holds both the banner and the send. A refused action shows nothing here.
 */
export function undoBanner(text: string, r: SendResult, opts: { reaction?: string } = {}): void {
  if (!r.ok) return;
  const undo = r.undo;
  toasts.show(text, UNDO_MS, {
    reaction: opts.reaction ?? 'pleased',
    hold: r.hold,
    ...(undo ? { action: { label: t('common.undo'), run: () => undo() } } : {})
  });
}

export function confirmHarvest(): SendResult {
  const wk = week.view?.harvest?.weekKey;
  if (!wk) return { ok: false };
  return week.send('harvest', { week: wk });
}

// ---- The wallet: buy one of the two rewards, undo. No approvals.

/**
 * Buy a reward (SHOP) from the wallet: shown at once, sent after the UNDO_MS banner. `{ok:false}` when the item is
 * unknown or the wallet can't cover it (the model would ignore the buy anyway). `bells`: what was charged.
 */
export function buy(item: ShopItemId): SendResult & { bells?: number } {
  const v = week.view;
  const bells = shopPrice(item);
  if (!v || bells === undefined || v.wallet.balance < bells) return { ok: false };
  const r = week.send('spend', { spendId: newId(), item, bells }, { holdMs: UNDO_MS });
  return { ...r, bells };
}

/** Take a buy back (either of us, any buy: one wallet; the server and the model take one void per buy). */
export function undoSpend(spendId: string): SendResult {
  return week.send('spend_void', { spendId }, { holdMs: UNDO_MS });
}

// ---- The goals, in けんこう's 目標 card: either person sets either person's (`person`). Health data itself is never
// entered here: Apple Health is the source of truth.

/** A goal weight in kg (one decimal), or null to clear it. Both of us see it; it never earns. */
export function setGoalWeight(person: PersonId, kg: number | null): SendResult {
  if (kg === null) return week.send('pref', { person, key: 'goalWeight', value: null });
  const value = roundKg(kg);
  if (!isWeightKg(value)) return { ok: false };
  return week.send('pref', { person, key: 'goalWeight', value });
}

/** A body fat goal in % (one decimal), or null to clear it. Both of us see it; it never earns. */
export function setGoalBodyFat(person: PersonId, pct: number | null): SendResult {
  if (pct === null) return week.send('pref', { person, key: 'goalBodyFat', value: null });
  const value = roundKg(pct);
  if (!isBodyFatGoal(value)) return { ok: false };
  return week.send('pref', { person, key: 'goalBodyFat', value });
}

/**
 * A daily Move goal in kcal: an integer within MOVE_GOAL (100–2,000), rounded. It applies from today
 * on, never to earlier days. `{ok:false}` for a value outside the bounds.
 */
export function setMoveGoal(person: PersonId, kcal: number): SendResult {
  const value = Math.round(kcal);
  if (!Number.isFinite(value) || value < MOVE_GOAL.min || value > MOVE_GOAL.max) return { ok: false };
  return week.send('pref', { person, key: 'moveGoal', value });
}

/**
 * A daily steps goal: a whole STEPS_GOAL.step (500) in 1,000–30,000. It applies from today on, never to earlier days.
 * `{ok:false}` for anything else.
 */
export function setStepsGoal(person: PersonId, steps: number): SendResult {
  if (!isStepsGoal(steps)) return { ok: false };
  return week.send('pref', { person, key: 'stepsGoal', value: steps });
}

export function setLanguage(locale: Locale) {
  setLocale(locale);
  return week.send('pref', { key: 'locale', value: locale });
}

/** A villager name as typed in 村人 (the field holds VILLAGER_NAME_CHARS; the model accepts up to LIMITS'). */
const VILLAGER_NAME_CHARS = 12;

export function setVillagerName(name: string): SendResult {
  const villagerName = name.trim().slice(0, VILLAGER_NAME_CHARS);
  if (!villagerName) return { ok: false };
  return week.send('pref', { key: 'villagerName', value: villagerName });
}

/** Villager from the roster (せってい → むらびと), e.g. 'goldie' (lib/villagers/roster.ts). */
export function setVillager(villager: string) {
  return week.send('pref', { key: 'villager', value: villager });
}

// ---- The island's finds (the ずかん): a catch or a pick-up is sent once per kind and id, the first time either of us
// finds it, and counted in the day's tally (its 「×12」). Never ベル.

/** A catch's tally waits this long before it is sent, and the next catches ride along: a busy minute is one request
 *  (the server keeps one row per person and day, docs/backend.md#tally). */
const TALLY_HOLD_MS = 60_000;
/** The tally waiting to be sent: a newer one replaces it within the same window. */
let held: { date: LocalDate; until: number; undo: () => boolean } | null = null;

/** One more of `kind:id` in my tally of today (the model's day, so the demo's `?date=` too). */
function countOne(kind: FindKind, id: string): void {
  const m = week.model;
  if (!m) return;
  const date = localDateAt(m.now);
  const mine = latestByDay(m.state.tallies).find((r) => r.person === m.me && r.date === date);
  const counts = addToTally(mine?.counts ?? {}, findKey(kind, id));
  const now = Date.now();
  const same = held && held.date === date && held.until > now ? held : null;
  const holdMs = same ? same.until - now : TALLY_HOLD_MS;
  same?.undo();
  const r = week.send('tally', { date, counts }, { holdMs });
  held = r.undo ? { date, until: now + holdMs, undo: r.undo } : null;
}

/** Record a catch or a pick-up: counted in today's tally, and a find for the shared ずかん unless one of us already
 *  found it (the model includes queued events, so a second catch before the first is acked sends no find). True when
 *  it was new. */
export function recordFind(kind: FindKind, id: string): boolean {
  const m = week.model;
  if (!m) return false;
  countOne(kind, id);
  if (findsView(m.state).has(findKey(kind, id))) return false;
  return week.send('find', { kind, id }).ok;
}

// ---- The shared island's day on the sheet (docs/backend.md#shared-world): one `island` row per person and day, sent
// again (all of it) when it grows, held two minutes so a busy stretch is one request (the server keeps the newest).

/** An island day waits this long before it is sent; the next change replaces it within the same window. */
const ISLAND_HOLD_MS = 120_000;
let islandHeld: { date: LocalDate; until: number; undo: () => boolean } | null = null;

/** My part of the shared island's day `date` (store/world.svelte.ts rowOf), for the sheet. */
export function sendIslandDay(date: LocalDate, row: object): void {
  if (!week.model) return;
  const now = Date.now();
  const same = islandHeld && islandHeld.date === date && islandHeld.until > now ? islandHeld : null;
  const holdMs = same ? same.until - now : ISLAND_HOLD_MS;
  same?.undo();
  const r = week.send('island', { date, ...row }, { holdMs });
  islandHeld = r.undo ? { date, until: now + holdMs, undo: r.undo } : null;
}

// ---- The island's decorations (docs/backend.md#events `decor`): each change of mine is one op, sent at once (the
// sheet keeps each item's latest; store/decor.svelte.ts merges them).

/** A decoration's op (placed, moved or removed) for the sheet. */
export function sendDecor(op: object): void {
  if (week.model) week.send('decor', { ...op });
}

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

/** Log a meal: `g` grams of `f` (per 100 g, contract/food.ts) on day `d` at meal `m`. */
export function logFood(e: { d: LocalDate; m: Meal; g: number; f: FoodSnap }): SendResult {
  if (!week.model) return { ok: false };
  const at = foodNow();
  return sendFood({ id: newFoodId(at), at, d: e.d, m: e.m, g: Math.round(e.g * 10) / 10, f: e.f });
}

/** One of my entries, as the model has it (queued changes included). */
const myFood = (id: string) => {
  const m = week.model;
  return m ? foodEntries(m.state, m.me).find((e) => e.id === id) : undefined;
};

/** Change one of my entries: its day, meal, grams or portion label (`u`: null drops it). The op is its whole state. */
export function editFood(id: string, ch: { d?: LocalDate; m?: Meal; g?: number; u?: string | null }): SendResult {
  const e = myFood(id);
  if (!e) return { ok: false };
  const { u: _u, ...rest } = e.f;
  const f: FoodSnap = ch.u === undefined ? e.f : ch.u === null ? rest : { ...rest, u: ch.u };
  const g = ch.g === undefined ? e.g : Math.round(ch.g * 10) / 10;
  return sendFood({ id, at: foodNow(e.at), d: ch.d ?? e.d, m: ch.m ?? e.m, g, f });
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

/** Send a repeat op as the record will keep it (contract/food.ts foodRepeatOp); `{ok:false}` when it isn't one. */
function sendRepeat(d: Record<string, unknown>): SendResult {
  const op = foodRepeatOp(d);
  return op ? week.send('food_repeat', { ...op }) : { ok: false };
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

/** My repeat ended on `last` (its skipped days after it dropped), or removed when it starts after `last`. */
function endRepeat(r: FoodRepeat, last: LocalDate): SendResult {
  const { who: _who, ...op } = r;
  if (r.from > last) return sendRepeat({ id: r.id, at: foodNow(r.at), rm: true });
  return sendRepeat({ ...op, at: foodNow(r.at), to: last, sk: r.sk?.filter((d) => d <= last) });
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
  if (!op || !endRepeat(r, now).ok) return { ok: false };
  // the shown meal's real entries, on a day the new one fills (tomorrow's), are what it stands for
  return sendNewRepeat(op, ch.itemsFromDate ?? from, shown && ch.itemsFromDate! >= from ? shown.filter((e) => !e.rep) : []);
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
  const it = e.it.map(({ g, f }) => ({ g: Math.round(g * 10) / 10, f }));
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
export function logRecipe(e: { recipeId: string; d: LocalDate; m: Meal; g: number; u?: string }): SendResult {
  const r = aRecipe(e.recipeId);
  return r ? logFood({ d: e.d, m: e.m, g: e.g, f: recipeSnap(r, e.u) }) : { ok: false };
}

/**
 * A daily kcal goal (a whole 50 in 1,000–5,000), or null to clear it. A member sets either member's (`person`); the
 * guest only its own. `{ok:false}` for anything else.
 */
export function setKcalGoal(who: Who, kcal: number | null): SendResult {
  const me = week.model?.me;
  if (!me || (me === 'G') !== (who === 'G') || (kcal !== null && !isKcalGoal(kcal))) return { ok: false };
  return week.send('pref', who === 'G' ? { key: 'kcalGoal', value: kcal } : { person: who, key: 'kcalGoal', value: kcal });
}
