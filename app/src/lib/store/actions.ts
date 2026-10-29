// One function per user action. Each records an event through the store's backend (live: the write queue,
// lib/sync/queue.ts; demo: kept in memory, demo/backend.ts) and the store recomputes the view with it at once through
// the model, so a tap moves the fruit, the score and the jar the same way everywhere. Results are synchronous.
import { MONEY } from '#lib/config/rules.ts';
import { week } from './week.svelte.ts';
import type { SendResult } from './backend.ts';
import { toasts } from '#lib/ui-state/toast.svelte.ts';
import { newId } from '#lib/sync/queue.ts';
import { setLocale, t, type Locale } from '#lib/i18n/index.ts';
import { finalMs } from '#lib/model/state.ts';
import { weekKeyOf } from '#lib/scoring/index.ts';

/** Payday, 使う！ and きろく edits wait this long before they are sent, with もとに戻す on the banner (round 5 U9). */
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

export function confirmPending(kind: 'visit' | 'workout', id: string, yes: boolean) {
  return week.send('confirm', { kind, id, yes });
}

export function confirmHarvest(): SendResult {
  const wk = week.view?.harvest?.weekKey;
  if (!wk) return { ok: false };
  return week.send('harvest', { week: wk });
}

/** `pending`: it waits for the other's OK (≥ ¥5,000, or asked for). */
export function spendPurse(label: string, amountYen: number, needsBoth: boolean): SendResult & { pending: boolean } {
  const pending = needsBoth || amountYen >= MONEY.purseNeedsBothAtYen;
  if ((week.view?.jar.purseYen ?? 0) < amountYen) return { ok: false, pending }; // insufficient purse
  return { ...week.send('spend', { spendId: newId(), label, amountYen }, { holdMs: UNDO_MS }), pending };
}

export function approveSpend(id: number | string) {
  return week.send('approve', { spendId: id });
}

export function transferDone(month: string) {
  return week.send('transfer', { month }, { holdMs: UNDO_MS });
}

// ---- きろく edits (history-and-editing.md §4): always my own data, open weeks only (the model refuses the rest).
// Each shows at once and waits UNDO_MS with もとに戻す on the banner, like payday and 使う！, unless that would miss
// the week's lock (the store shortens or refuses it, round 7 M1).

export function setMetric(date: string, metric: 'steps' | 'exercise_min', value: number) {
  return week.send('metric_set', { date, metric, value: Math.round(value) }, { holdMs: UNDO_MS, lockAt: lockOf(date) });
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

/** Only the spender's void counts (a paid spend goes back to the purse, a waiting one is cancelled). */
export function voidSpend(spendId: number | string) {
  return week.send('spend_void', { spendId }, { holdMs: UNDO_MS });
}

/** Un-tick a month's transfer ✓ (either of us). */
export function undoTransfer(month: string) {
  return week.send('transfer_undo', { month }, { holdMs: UNDO_MS });
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
