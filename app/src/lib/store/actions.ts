// One function per user action. Each records an event through the store's backend (live: the write queue,
// lib/sync/queue.ts; demo: kept in memory, demo/backend.ts) and the store recomputes the view with it at once through
// the model, so a tap moves the wallet and きろく the same way everywhere. Results are synchronous.
import { week } from './week.svelte.ts';
import type { SendResult } from './backend.ts';
import { toasts } from '#lib/ui-state/toast.svelte.ts';
import { newId } from '#lib/sync/queue.ts';
import { setLocale, t, type Locale } from '#lib/i18n/index.ts';
import type { LocalDate, ShopItemId, Who } from '#lib/types.ts';
import { isWeatherMode, type FindKind, type SeasonLook, type WeatherMode } from '#lib/contract/api.ts';
import { findKey, findsView } from '#lib/model/finds.ts';
import { addToTally, dayTallies } from '#lib/model/tally.ts';
import { localDateAt } from '#lib/time/dates.ts';
import { shopPrice } from '#lib/contract/rules.ts';
import { GOALS, isGoalValue, type GoalId } from '#lib/contract/goals.ts';
import { newOpId } from '#lib/contract/ops.ts';
import type { RoomSaveOp } from '#lib/contract/roomSave.ts';
import { sellPrice } from '#lib/contract/shop.ts';
import { GOODS } from '#lib/contract/pocket.ts';
import { shopView } from '#lib/model/shop.ts';
import { world } from './world.svelte.ts';
import { DEMO, LIVE, localKV, readJson, writeJson } from '#lib/sync/storage.ts';
import { profileValueOk, type ProfileKey } from '#lib/contract/profile.ts';

/** 買う！ and its とりけす (and the packing list's removals and resets) wait this long before they are sent, with 取り消す
 *  on the banner. */
export const UNDO_MS = 5000;

/**
 * The banner for an action held UNDO_MS: it names what was done and carries 取り消す; hovering, touching
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

// ---- The wallets: buy one of the two rewards, undo. No approvals.

/**
 * Buy a reward (SHOP) from my own wallet: shown at once, sent after the UNDO_MS banner. `{ok:false}` on the guest's
 * phone, for an unknown item, or when my wallet can't cover it (the model would ignore the buy anyway). `bells`: what
 * was charged (its price now: contract/rules.ts shopPrice).
 */
export function buy(item: ShopItemId): SendResult & { bells?: number } {
  const v = week.view;
  const bells = shopPrice(item, week.model?.now ?? world.now());
  if (!v || v.viewer === 'G' || bells === undefined || v.wallet.people[v.me].balance < bells) return { ok: false };
  const r = week.send('spend', { spendId: newId(), item, bells }, { holdMs: UNDO_MS });
  return { ...r, bells };
}

/** Take a buy back (either of us, any buy: its ベル go back to the wallet it was paid from; the server and the model take one void per buy). */
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

/** The island's look (設定 → 季節: ui-state/preview.svelte.ts setPreview): an event, a season, a weather and a time of
 *  day every phone shows, or null (自動). Anyone's, the guest's too (the last set wins). */
export function setSeasonLook(look: SeasonLook | null): SendResult {
  return week.send('pref', { key: 'seasonLook', value: look });
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
let held: { date: LocalDate; until: number; counts: Record<string, number>; r: SendResult; w: number } | null = null;
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
  const w = same ? same.w : ++windows;
  // (its data replaced: one recompute of the model a catch, where a take-back and a send were two)
  if (same?.r.replace?.({ date, counts }, same.until - now)) same.counts = counts;
  else held = sendTally(date, counts, same ? same.until : now + TALLY_HOLD_MS, w, same);
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
  if (!h || !(h.counts[key] > 0)) return false;
  const { [key]: n, ...rest } = h.counts;
  const counts = n > 1 ? { ...rest, [key]: n - 1 } : rest;
  if (Object.keys(counts).length && h.r.replace?.({ date: h.date, counts }, Math.max(0, h.until - Date.now()))) {
    h.counts = counts;
    return true;
  }
  // (none left, or tried already: offline past its window, then taken back whole and the rest sent anew)
  if (!h.r.undo?.()) return false;
  held = Object.keys(counts).length ? sendTally(h.date, counts, h.until, h.w, null) : null;
  return true;
}

/** A day's tally sent (held till `until`) in place of `was` (taken back, if it still can be); the held one, or null. */
function sendTally(date: LocalDate, counts: Record<string, number>, until: number, w: number, was: { r: SendResult } | null): typeof held {
  was?.r.undo?.();
  const r = week.send('tally', { date, counts }, { holdMs: Math.max(0, until - Date.now()) });
  return r.undo ? { date, until, counts, r, w } : null;
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
  if (held && held.until > Date.now()) held.r.hold?.(0);
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
export function together(rs: SendResult[]): SendResult {
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

// ---- The shared island's day on the sheet (docs/backend.md#shared-world): one `island` row per person and day, sent
// again (all of it) when it grows, held two minutes so a busy stretch is one request (the server keeps the newest).

/** An island day waits this long before it is sent; the next change replaces it within the same window. */
const ISLAND_HOLD_MS = 120_000;
let islandHeld: { date: LocalDate; until: number; r: SendResult } | null = null;

/** My part of the shared island's day `date` (store/world.svelte.ts rowOf), for the sheet. */
export function sendIslandDay(date: LocalDate, row: object): void {
  if (!week.model) return;
  const now = Date.now();
  const same = islandHeld && islandHeld.date === date && islandHeld.until > now ? islandHeld : null;
  const holdMs = same ? same.until - now : ISLAND_HOLD_MS, data = { date, ...row };
  if (same?.r.replace?.(data, holdMs)) return;
  same?.r.undo?.();
  const r = week.send('island', data, { holdMs });
  islandHeld = r.undo ? { date, until: now + holdMs, r } : null;
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

/** A room's whole change (the clear, a saved arrangement called up, their undo: store/tent.svelte.ts batch) for the
 *  record as one group: kept all or none (relay store.ts group, contract/api.ts GROUP_MAX). */
export function sendDecorGroup(ops: readonly object[]): void {
  if (week.model && ops.length) week.sendMany('decor', ops.map((op) => ({ ...op })), newOpId('g', Date.now()));
}

/** A room's saved arrangement or its slot emptied (contract/roomSave.ts): false when the record wouldn't take it. */
export function sendRoomSave(op: RoomSaveOp): boolean {
  return week.model ? week.send('room_save', { ...op }).ok : false;
}
