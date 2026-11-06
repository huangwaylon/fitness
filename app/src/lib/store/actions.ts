// One function per user action. Each records an event through the store's backend (live: the write queue,
// lib/sync/queue.ts; demo: kept in memory, demo/backend.ts) and the store recomputes the view with it at once through
// the model, so a tap moves the wallet and きろく the same way everywhere. Results are synchronous.
import { week } from './week.svelte.ts';
import type { SendResult } from './backend.ts';
import { toasts } from '#lib/ui-state/toast.svelte.ts';
import { newId } from '#lib/sync/queue.ts';
import { setLocale, t, type Locale } from '#lib/i18n/index.ts';
import type { LocalDate, ShopItemId, Who } from '#lib/types.ts';
import { isWeatherMode, nextDay, type FindKind, type WeatherMode } from '#lib/contract/api.ts';
import { findKey, findsView } from '#lib/model/finds.ts';
import { addToTally, dayTallies } from '#lib/model/tally.ts';
import { localDateAt } from '#lib/time/dates.ts';
import { shopPrice } from '#lib/contract/rules.ts';
import { GOALS, isGoalValue, type GoalId } from '#lib/contract/goals.ts';
import {
  customSnap, foodCustomOp, foodOp, foodRecipeOp, foodRepeatOp, newCustomId, newFoodId, newRecipeId, newRepeatId, recipeSnap, repeatCovers,
  type FoodEntry, type FoodRepeat, type FoodSnap, type Meal, type RepeatItem, type RepeatOp
} from '#lib/contract/food.ts';
import { customs, foodDay, foodEntries, mealItems, recipes, repeats } from '#lib/model/food.ts';
import { buyPrice, sellPrice, stockOf } from '#lib/contract/shop.ts';
import { GOODS } from '#lib/contract/pocket.ts';
import { shopView } from '#lib/model/shop.ts';
import { world } from './world.svelte.ts';
import { DEMO, LIVE, localKV, readJson, writeJson } from '#lib/sync/storage.ts';
import { profileValueOk, type ProfileKey } from '#lib/contract/profile.ts';

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

// ---- The goals (contract/goals.ts GOALS), set where their charts are (けんこう, ごはん's グラフ). Health data itself is
// never entered here: Apple Health is the source of truth.

/**
 * A profile pref (せってい → プロフィール: `sex`, `birth`, `bmiStd`; contract/profile.ts), or null to clear it: a member
 * sets either member's, the guest only its own. Private: the record sends a member's to the members alone, the
 * guest's to the guest alone. `{ok:false}` for a value the record would refuse.
 */
export function setProfile(who: Who, key: ProfileKey, value: string | null): SendResult {
  const m = week.model;
  if (!m || (m.me === 'G') !== (who === 'G') || !profileValueOk(key, value, localDateAt(m.now))) return { ok: false };
  return week.send('pref', who === 'G' ? { key, value } : { person: who, key, value });
}

/**
 * `who`'s goal of `id`, or null to clear it (a clearable one): rounded to its grid's decimals, in its range and on its
 * grid (`{ok:false}` for anything else). A member sets either member's (`person`); the guest only its own meal-log
 * goals (no `person`), never another goal. A goal a day keeps applies from today on (`day`), never to earlier days.
 */
export function setGoal(id: GoalId, who: Who, v: number | null): SendResult {
  const g = GOALS[id];
  const me = week.model?.me;
  if (g.group === 'food' ? !me || (me === 'G') !== (who === 'G') : who === 'G' || me === 'G') return { ok: false };
  const value = v === null ? null : g.step < 1 ? Math.round(v * 10) / 10 : Math.round(v);
  if (value === null ? !g.clearable : !isGoalValue(id, value)) return { ok: false };
  // a goal a day keeps says the Tokyo day it was set on here (contract/record.ts goalDay): one set at 23:59 that reaches
  // the record after midnight is still that day's
  const day = g.history === 'daily' ? { day: localDateAt(week.model?.now ?? world.now()) } : {};
  return week.send('pref', who === 'G' ? { key: g.key, value, ...day } : { person: who, key: g.key, value, ...day });
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

/** The island's weather (せってい → てんき): Tokyo's real sky or the game's, for the whole island. Anyone's, the guest's
 *  too (the last set wins). */
export function setWeatherMode(mode: WeatherMode): SendResult {
  if (!isWeatherMode(mode)) return { ok: false };
  return week.send('pref', { key: 'weatherMode', value: mode });
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
/** The tally waiting to be sent (its counts as sent): a newer one replaces it within the same window. Still queued
 *  past its window (offline), it can still be taken back (`undo`), for a race lost late (`lostRace`). */
let held: { date: LocalDate; until: number; counts: Record<string, number>; undo: () => boolean; hold?: (ms: number | null) => number; w: number } | null = null;
/** The held tally's window (a new one each minute's first catch): a claim counted in the one still held is taken out
 *  of it; one counted in a window sent since is given back (`tally_back`). */
let windows = 0;

/** One more of `key` (`kind:id`) in my tally of today (the model's day, so the demo's `?date=` too). `claim`: the
 *  shared world's claim it came with (`catch:<id>`, `pick:<id>`), so a race lost on it takes it back. */
function countOne(key: string, claim?: string): void {
  const m = week.model;
  if (!m) return;
  const date = localDateAt(m.now);
  const mine = dayTallies(m.state.tallies).find((r) => r.person === m.me && r.date === date && !r.back);
  const counts = addToTally(mine?.counts ?? {}, key);
  const now = Date.now();
  const same = held && held.date === date && held.until > now ? held : null;
  const holdMs = same ? same.until - now : TALLY_HOLD_MS;
  same?.undo();
  const w = same ? same.w : ++windows;
  const r = week.send('tally', { date, counts }, { holdMs });
  held = r.undo ? { date, until: now + holdMs, counts, undo: r.undo, hold: r.hold, w } : null;
  if (claim) {
    counted.set(claim, { key, date, w });
    if (counted.size > COUNTED_MAX) counted.delete(counted.keys().next().value!);
    keepCounted(m.me, date, claim, key);
  }
}

/** The claims of mine this session: the tally key each counted, its day and its held window (a race lost on one takes
 *  that one back). */
const counted = new Map<string, { key: string; date: LocalDate; w: number }>();
const COUNTED_MAX = 400;

/** The day's claims kept across a reload or a kill (`island.counted` = `{me, d, cs: {claim: key}}`; the demo's per
 *  player): a race lost after one (the partner's claim heard on the next open, or the room's refusal of a resend) still
 *  gives its catch back. Only today's, only mine. */
const countedKey = (): string => (world.demo ? `${DEMO.counted}.${world.me ?? 'A'}` : LIVE.counted);
type KeptCounts = { me?: unknown; d?: unknown; cs?: Record<string, unknown> };
function keepCounted(me: Who, date: LocalDate, claim: string, key: string): void {
  const k = readJson<KeptCounts>(localKV(), countedKey());
  const cs = k && k.me === me && k.d === date && k.cs && typeof k.cs === 'object' ? k.cs : {};
  const all = Object.entries({ ...cs, [claim]: key }).slice(-COUNTED_MAX);
  writeJson(localKV(), countedKey(), { me, d: date, cs: Object.fromEntries(all) });
}
function keptCounted(claim: string): { key: string; date: LocalDate; w: number } | undefined {
  const me = week.model?.me, k = readJson<KeptCounts>(localKV(), countedKey());
  if (!me || !k || k.me !== me || typeof k.d !== 'string' || !k.cs) return undefined;
  const key = k.cs[claim];
  if (typeof key !== 'string') return undefined;
  const { [claim]: _gone, ...rest } = k.cs;
  writeJson(localKV(), countedKey(), { ...k, cs: rest });
  // (no held window: the page that held it is gone, its tally queued or sent: given back by a tally_back)
  return { key, date: k.d as LocalDate, w: 0 };
}

/**
 * The partner got there first (store/world.svelte.ts: the relay heard their claim before mine, `beat`): what my claim
 * put in my pocket comes out again, and a gentle line says who has it. A day's counts only grow on the record
 * (contract/tally.ts mergeTally), so a catch counted in the tally still waiting to be sent (held a minute, or queued
 * while offline) is taken out of it; one whose tally went is given back by a `tally_back` of its day (2026-11-05:
 * the record keeps it while that day's tally covers it), as is one counted before a reload (the claim kept with its
 * day: `island.counted`). True when it was taken back (the line shows either way, unless `quiet`: the island's own
 * news says so).
 */
export function lostRace(claim: string, who: Who, quiet = false): boolean {
  const kept = keptCounted(claim), c = counted.get(claim) ?? kept;
  counted.delete(claim);
  if (c === undefined) return false;
  const took = (c.w !== 0 && c.w === held?.w && uncount(c.key)) || giveBack(c.date, c.key);
  if (!quiet) {
    const v = week.view;
    const name = !v ? '' : who === 'G' ? v.guest.villagerName : v.people[who].villagerName;
    toasts.show(t('world.partner.first', { who: name }), 3200, { reaction: 'sheepishness' });
  }
  return took;
}

// (wherever the app is: the island, a room, a panel; a live catch's own news on the island already says who had it)
world.lost = (claim, who, live, kind) => void lostRace(claim, who, kind === 'catch' && live);

/** One `key` less in the tally waiting to be sent (its window kept): false when none waits, or it was sent. */
function uncount(key: string): boolean {
  const h = held;
  if (!h || !(h.counts[key] > 0) || !h.undo()) return false;
  const { [key]: n, ...rest } = h.counts;
  const counts = n > 1 ? { ...rest, [key]: n - 1 } : rest;
  held = null;
  if (!Object.keys(counts).length) return true;
  const holdMs = Math.max(0, h.until - Date.now());
  const r = week.send('tally', { date: h.date, counts }, { holdMs });
  held = r.undo ? { date: h.date, until: h.until, counts, undo: r.undo, hold: r.hold, w: h.w } : null;
  return true;
}

/** One `key` of `date`'s tally given back (a `tally_back`, contract/tally.ts): the day's given-back counts with one
 *  more, never past what the day's tally holds (the record's check, backCovered). False when there's nothing to give. */
function giveBack(date: LocalDate, key: string): boolean {
  const m = week.model;
  if (!m) return false;
  const days = dayTallies(m.state.tallies).filter((r) => r.person === m.me && r.date === date);
  const tally = days.find((r) => !r.back)?.counts ?? {}, back = days.find((r) => r.back)?.counts ?? {};
  if ((back[key] ?? 0) + 1 > (tally[key] ?? 0)) return false;
  return week.send('tally_back', { date, counts: addToTally(back, key) }).ok;
}

/** Send the held tally now (the shop: the record sells only what it holds of my catches). */
function releaseTally(): void {
  if (held && held.until > Date.now()) held.hold?.(0);
  held = null;
}

/** Record a catch or a pick-up: counted in today's tally, and a find for the shared ずかん unless one of us already
 *  found it (the model includes queued events, so a second catch before the first is acked sends no find). True when
 *  it was new. `claim`: the shared world's claim it came with (lostRace takes it back). */
export function recordFind(kind: FindKind, id: string, claim?: string): boolean {
  const m = week.model;
  if (!m) return false;
  countOne(findKey(kind, id), claim);
  if (findsView(m.state).has(findKey(kind, id))) return false;
  return week.send('find', { kind, id }).ok;
}

/** Record a pick-up the ずかん has no page for (contract/pocket.ts GOODS: wood, a branch, fruit, a weed…): one more in
 *  today's tally, so in my pocket for the shop; never a find. `claim` as recordFind's. */
export function recordGoods(id: string, claim?: string): void {
  if (Object.hasOwn(GOODS, id)) countOne(`goods:${id}`, claim);
}

// ---- The shop (docs/design.md "The shop", contract/shop.ts): my pocket's catches sold and the day's stock bought, with
// my かいがら (the guest's its own). Shown at once, sent after the UNDO_MS banner, like a buy of a treat. Never ベル.

/** One SendResult for several sends: undone, held and resumed together. */
function together(rs: SendResult[]): SendResult {
  if (!rs.length || rs.some((r) => !r.ok)) {
    for (const r of rs) r.undo?.();
    return { ok: false };
  }
  return {
    ok: true,
    undo: () => rs.map((r) => r.undo?.() ?? false).every(Boolean),
    hold: (ms) => Math.min(...rs.map((r) => r.hold?.(ms) ?? 0))
  };
}

/**
 * Sell catches from my pocket (`kind:id` → how many): one `sell` per species at its price. `{ok:false}` when one isn't
 * in the pocket that many times. `shells`: what they fetched.
 */
export function sell(picks: ReadonlyMap<string, number>): SendResult & { shells?: number } {
  const m = week.model;
  if (!m || !picks.size) return { ok: false };
  const pocket = shopView(m.state, m.me).pocket;
  const rows: { species: string; n: number; v: number }[] = [];
  for (const [species, n] of picks) {
    const p = sellPrice(species);
    if (p === undefined || !Number.isInteger(n) || n < 1 || n > (pocket.get(species) ?? 0)) return { ok: false };
    rows.push({ species, n, v: n * p });
  }
  releaseTally();
  const r = together(rows.map((d) => week.send('sell', d, { holdMs: UNDO_MS })));
  return { ...r, shells: rows.reduce((a, d) => a + d.v, 0) };
}

/** Why I can't buy this piece from today's stock now, or null: not in the stock, bought already, too dear. */
export function buyRefusal(item: string): 'stock' | 'owned' | 'wallet' | null {
  const m = week.model;
  if (!m || !stockOf(localDateAt(m.now)).includes(item)) return 'stock';
  const v = shopView(m.state, m.me);
  if (v.owned.includes(item)) return 'owned';
  return (buyPrice(item) ?? Infinity) > v.shells ? 'wallet' : null;
}

/** Buy a piece of today's stock with my かいがら: it joins my もようがえ. `{ok:false}` when `buyRefusal` says no. */
export function buyPiece(item: string): SendResult & { price?: number } {
  const m = week.model;
  const price = buyPrice(item);
  if (!m || price === undefined || buyRefusal(item)) return { ok: false };
  return { ...week.send('buy', { item, price, d: localDateAt(m.now) }, { holdMs: UNDO_MS }), price };
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

/** A burst of layout ops (the editor's save, a clash settled) for the record: one queue write, one recompute. */
export function sendDecors(ops: readonly object[]): void {
  if (week.model && ops.length) week.sendMany('decor', ops.map((op) => ({ ...op })));
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

/** Change one of my entries: its day, meal, grams or portion label (`u`: null drops it). The op is its whole state. */
export function editFood(id: string, ch: { d?: LocalDate; m?: Meal; g?: number; u?: string | null }): SendResult {
  const e = myFood(id);
  if (!e) return { ok: false };
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

