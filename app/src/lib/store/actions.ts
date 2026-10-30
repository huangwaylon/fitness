// One function per user action. Each records an event through the store's backend (live: the write queue,
// lib/sync/queue.ts; demo: kept in memory, demo/backend.ts) and the store recomputes the view with it at once through
// the model, so a tap moves the fruit, today's ベル and the pots the same way everywhere. Results are synchronous.
import { week } from './week.svelte.ts';
import type { SendResult } from './backend.ts';
import { toasts } from '#lib/ui-state/toast.svelte.ts';
import { newId } from '#lib/sync/queue.ts';
import { setLocale, t, type Locale } from '#lib/i18n/index.ts';
import { finalMs, parseMenu } from '#lib/model/state.ts';
import type { MenuItem, PotKey, WalletItem } from '#lib/types.ts';
import { weekKeyOf } from '#lib/scoring/index.ts';
import { isWeightKg, roundKg } from '#lib/contract/api.ts';
import { MOVE_GOAL } from '#lib/config/rules.ts';

/** 買う！, its もとに戻す and きろく edits wait this long before they are sent, with もとに戻す on the banner (round 5 U9). */
const UNDO_MS = 5000;
/** きろく's edit controls close this long before a week's lock: an edit made then still lands in time (round 7 M1). */
export const EDIT_CUTOFF_MS = UNDO_MS + 60_000;

/**
 * The banner for an edit held UNDO_MS: it names what was done (round 5 N5) and carries もとに戻す; hovering, touching
 * or focusing it holds both the banner and the send (N7). `after` runs once an undo took the edit back. A refused
 * edit (the week closed) shows nothing here: the store already said so.
 */
export function undoBanner(text: string, r: SendResult, opts: { reaction?: string; after?: () => void } = {}): void {
  if (!r.ok) return;
  const undo = r.undo;
  toasts.show(text, UNDO_MS, {
    reaction: opts.reaction ?? 'pleased',
    hold: r.hold,
    ...(undo ? { action: { label: t('common.undo'), run: () => undo() && opts.after?.() } } : {})
  });
}

/** Server-clock lock of the week a day belongs to (an edit stamped at or after it is refused). */
const lockOf = (date: string): number => finalMs(weekKeyOf(date));

/** `highFivesToday` counts the partner's high-fives to me, so sending one changes nothing in my view. */
export function highFive() {
  return week.send('highfive', {});
}

/**
 * @public @deprecated No daily questions (2026-10-30): `view.pending` is always empty and `confirm` is no longer an
 * event type, so this does nothing. Deleted as soon as the island stops importing it (rings-contract.md, request 1).
 */
export function confirmPending(_kind: 'workout', _id: string, _yes: boolean): SendResult {
  return { ok: false };
}

export function confirmHarvest(): SendResult {
  const wk = week.view?.harvest?.weekKey;
  if (!wk) return { ok: false };
  return week.send('harvest', { week: wk });
}

// ---- The wallet (ADR 0022): buy from the shared menu, undo, edit the menu. No approvals.

/**
 * Buy a menu item from the wallet: shown at once, sent after the UNDO_MS banner. `{ok:false}` when the item is unknown
 * or the wallet can't cover it (the model would ignore the buy anyway).
 */
export function buy(itemId: string): SendResult {
  const v = week.view;
  const item = v?.menu.find((x) => x.id === itemId);
  if (!v || !item || v.wallet.balance < item.bells) return { ok: false };
  return week.send('spend', { spendId: newId(), item: item.id, label: item.label, bells: item.bells }, { holdMs: UNDO_MS });
}

/** @public @deprecated ADR 0022: one wallet. Use `buy`. */
export const buyTreat = (itemId: string): SendResult => buy(itemId);
/** @public @deprecated ADR 0022: one wallet. Use `buy`. */
export const buyTrip = (itemId: string): SendResult => buy(itemId);

/** Take a buy back (the buyer only; the model ignores anyone else's `spend_void`). */
export function undoSpend(spendId: string): SendResult {
  return week.send('spend_void', { spendId }, { holdMs: UNDO_MS });
}

/** Replace the shared menu, both sections (either of us; the latest edit wins). `{ok:false}` if the list is invalid. */
export function saveMenu(items: WalletItem[]): SendResult {
  const clean = parseMenu(items.map((x) => ({ id: x.id, section: x.section, label: x.label, bells: Math.round(x.bells) })));
  if (!clean) return { ok: false };
  return week.send('pref', { key: 'menu', value: JSON.stringify(clean) });
}

/**
 * @public @deprecated ADR 0022: one menu. Replaces one section (treat = daily) of the current menu. Use `saveMenu`.
 */
export function setMenu(pot: PotKey, items: MenuItem[]): SendResult {
  const section = pot === 'treat' ? 'daily' : 'trip';
  const rest = (week.view?.menu ?? []).filter((x) => x.section !== section);
  return saveMenu([...(section === 'daily' ? [] : rest), ...items.map((x) => ({ ...x, section })), ...(section === 'daily' ? rest : [])] as WalletItem[]);
}

/** A fresh id for a new menu item. */
export const newMenuItemId = (): string => newId().replace(/[^\w-]/g, '').slice(0, 24);

// ---- きろく edits (history-and-editing.md §4): always my own data, open weeks only (the model refuses the rest).
// Each shows at once and waits UNDO_MS with もとに戻す on the banner, like 買う！, unless that would miss
// the week's lock (the store shortens or refuses it, round 7 M1).

export function setMetric(date: string, metric: 'steps' | 'exercise_min', value: number) {
  return week.send('metric_set', { date, metric, value: Math.round(value) }, { holdMs: UNDO_MS, lockAt: lockOf(date) });
}

/**
 * A day's body weight from きろく (ADR 0020): kg, one decimal. Weight earns nothing, so no week lock applies (any day up
 * to today); it still waits UNDO_MS with もとに戻す. `{ok:false}` for a value outside 20–300 kg.
 */
export function setWeight(date: string, kg: number): SendResult {
  const value = roundKg(kg);
  if (!isWeightKg(value)) return { ok: false };
  return week.send('metric_set', { date, metric: 'weight', value }, { holdMs: UNDO_MS });
}

/** My goal weight in kg (one decimal), or null to clear it. Both of us see it; it never earns. */
export function setGoalWeight(kg: number | null): SendResult {
  if (kg === null) return week.send('pref', { key: 'goalWeight', value: null });
  const value = roundKg(kg);
  if (!isWeightKg(value)) return { ok: false };
  return week.send('pref', { key: 'goalWeight', value });
}

/**
 * My daily Move goal in kcal (ADR 0021 §5): an integer within MOVE_GOAL (100–2,000), rounded. It applies from today
 * on, never to earlier days. `{ok:false}` for a value outside the bounds.
 */
export function setMoveGoal(kcal: number): SendResult {
  const value = Math.round(kcal);
  if (!Number.isFinite(value) || value < MOVE_GOAL.min || value > MOVE_GOAL.max) return { ok: false };
  return week.send('pref', { key: 'moveGoal', value });
}

/** `strength`: count as strength (true), not (false) or automatic (null); `excluded`: out of scoring. `date`: the workout's day. */
export function editWorkout(id: string, date: string, change: { strength?: boolean | null; excluded?: boolean }) {
  return week.send('workout_edit', { id, ...change }, { holdMs: UNDO_MS, lockAt: lockOf(date) });
}

export function addWorkout(date: string, type: string, durationMin: number) {
  const id = `m:${newId().replace(/[^\w-]/g, '').slice(0, 36)}`;
  return week.send('workout_add', { id, date, type, durationMin: Math.round(durationMin) }, { holdMs: UNDO_MS, lockAt: lockOf(date) });
}

export function setLanguage(locale: Locale) {
  setLocale(locale);
  return week.send('pref', { key: 'locale', value: locale });
}

export function setVillagerName(name: string) {
  const villagerName = name.trim().slice(0, 12);
  if (!villagerName) return null;
  return week.send('pref', { key: 'villagerName', value: villagerName });
}

/** Villager from the roster (しまフォン → 村人), e.g. 'goldie' (lib/villagers/roster.ts). */
export function setVillager(villager: string) {
  return week.send('pref', { key: 'villager', value: villager });
}
