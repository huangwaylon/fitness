// One function per user action. Each records an event through the store's backend (live: the write queue,
// lib/sync/queue.ts; demo: kept in memory, demo/backend.ts) and the store recomputes the view with it at once through
// the model, so a tap moves the fruit, today's ベル and the pots the same way everywhere. Results are synchronous.
import { week } from './week.svelte.ts';
import type { SendResult } from './backend.ts';
import { toasts } from '#lib/ui-state/toast.svelte.ts';
import { newId } from '#lib/sync/queue.ts';
import { setLocale, t, type Locale } from '#lib/i18n/index.ts';
import { finalMs, parseMenu } from '#lib/model/state.ts';
import type { MenuItem, PotKey } from '#lib/types.ts';
import { weekKeyOf } from '#lib/scoring/index.ts';
import { isWeightKg, roundKg } from '#lib/contract/api.ts';

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

export function checkin(date: string, habitKey: string, done: boolean) {
  return week.send('checkin', { date, habit: habitKey, done });
}

/** `highFivesToday` counts the partner's high-fives to me, so sending one changes nothing in my view. */
export function highFive() {
  return week.send('highfive', {});
}

export function confirmPending(kind: 'workout', id: string, yes: boolean) {
  return week.send('confirm', { kind, id, yes });
}

export function confirmHarvest(): SendResult {
  const wk = week.view?.harvest?.weekKey;
  if (!wk) return { ok: false };
  return week.send('harvest', { week: wk });
}

// ---- ベル pots (ADR 0019 §5): buy from the shared menus, undo, edit the menus. No approvals.

/**
 * Buy a menu item from its pot: shown at once, sent after the UNDO_MS banner. `{ok:false}` when the item is unknown
 * or the pot can't afford it (the model would ignore the spend anyway).
 */
function buy(pot: PotKey, itemId: string): SendResult {
  const v = week.view;
  const item = v?.menus[pot].find((x) => x.id === itemId);
  if (!v || !item || v.pots[pot].balance < item.bells) return { ok: false };
  return week.send('spend', { spendId: newId(), pot, item: item.id, label: item.label, bells: item.bells }, { holdMs: UNDO_MS });
}

export const buyTreat = (itemId: string): SendResult => buy('treat', itemId);
export const buyTrip = (itemId: string): SendResult => buy('trip', itemId);

/** Take a spend back (the buyer only; the model ignores anyone else's `spend_void`). */
export function undoSpend(spendId: string): SendResult {
  return week.send('spend_void', { spendId }, { holdMs: UNDO_MS });
}

/** Replace a shared menu (either of us; the latest edit wins). `{ok:false}` if the list is invalid (ids, labels, prices). */
export function setMenu(pot: PotKey, items: MenuItem[]): SendResult {
  const clean = parseMenu(items.map((x) => ({ id: x.id, label: x.label, bells: Math.round(x.bells) })));
  if (!clean) return { ok: false };
  return week.send('pref', { key: pot === 'treat' ? 'treatMenu' : 'tripMenu', value: JSON.stringify(clean) });
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

/** `strength`: count as strength (true), not (false) or automatic (null); `excluded`: out of scoring. `date`: the workout's day. */
export function editWorkout(id: string, date: string, change: { strength?: boolean | null; excluded?: boolean }) {
  return week.send('workout_edit', { id, ...change }, { holdMs: UNDO_MS, lockAt: lockOf(date) });
}

export function addWorkout(date: string, type: string, durationMin: number) {
  const id = `m:${newId().replace(/[^\w-]/g, '').slice(0, 36)}`;
  return week.send('workout_add', { id, date, type, durationMin: Math.round(durationMin) }, { holdMs: UNDO_MS, lockAt: lockOf(date) });
}

/** A fix of any day's check-in in an open week (the 48 h window doesn't apply). */
export function fixCheckin(date: string, habitKey: string, done: boolean) {
  return week.send('checkin', { date, habit: habitKey, done, edit: true }, { holdMs: UNDO_MS, lockAt: lockOf(date) });
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
