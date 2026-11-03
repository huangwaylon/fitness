// One function per user action. Each records an event through the store's backend (live: the write queue,
// lib/sync/queue.ts; demo: kept in memory, demo/backend.ts) and the store recomputes the view with it at once through
// the model, so a tap moves the wallet and きろく the same way everywhere. Results are synchronous.
import { week } from './week.svelte.ts';
import type { SendResult } from './backend.ts';
import { toasts } from '#lib/ui-state/toast.svelte.ts';
import { newId } from '#lib/sync/queue.ts';
import { setLocale, t, type Locale } from '#lib/i18n/index.ts';
import type { LocalDate, PersonId, ShopItemId, Who } from '#lib/types.ts';
import { isBodyFatGoal, isWeightKg, roundKg, type FindKind } from '#lib/contract/api.ts';
import { findKey, findsView } from '#lib/model/finds.ts';
import { addToTally, latestByDay } from '#lib/model/tally.ts';
import { localDateAt } from '#lib/time/dates.ts';
import { MOVE_GOAL, isStepsGoal, shopPrice } from '#lib/config/rules.ts';
import { foodOp, isKcalGoal, newFoodId, type FoodSnap, type Meal } from '#lib/contract/food.ts';
import { foodEntries } from '#lib/model/food.ts';
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

/**
 * A daily kcal goal (a whole 50 in 1,000–5,000), or null to clear it. A member sets either member's (`person`); the
 * guest only its own. `{ok:false}` for anything else.
 */
export function setKcalGoal(who: Who, kcal: number | null): SendResult {
  const me = week.model?.me;
  if (!me || (me === 'G') !== (who === 'G') || (kcal !== null && !isKcalGoal(kcal))) return { ok: false };
  return week.send('pref', who === 'G' ? { key: 'kcalGoal', value: kcal } : { person: who, key: 'kcalGoal', value: kcal });
}
