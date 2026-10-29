// One function per user action. Each queues an event for the Apps Script backend (lib/client/gas.ts); the store
// recomputes the view with it at once through the model (in demo mode too: the demo is generated rows, demoRows.ts),
// so a tap moves the fruit, the score and the jar the same way everywhere.
import { MONEY } from '#lib/config/rules.ts';
import { week, type SendResult } from './week.svelte.ts';
import { newId } from './gas.ts';
import { setLocale, type Locale } from '#lib/i18n/index.ts';

/** Payday, 使う！ and きろく edits wait this long before they are sent, with 取り消す on the banner (round 5 U9). */
export const UNDO_MS = 5000;

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

export function confirmHarvest(): Promise<SendResult> {
  const wk = week.view?.harvest?.weekKey;
  if (!wk) return Promise.resolve({ ok: false, status: 409, data: null });
  return week.send('harvest', { week: wk });
}

export async function spendPurse(label: string, amountYen: number, needsBoth: boolean): Promise<SendResult<{ id?: string | number; status?: string }>> {
  if ((week.view?.jar.purseYen ?? 0) < amountYen) return { ok: false, status: 409, data: null }; // insufficient_purse
  const spendId = newId();
  const pending = needsBoth || amountYen >= MONEY.purseNeedsBothAtYen;
  const r = await week.send('spend', { spendId, label, amountYen }, { holdMs: UNDO_MS });
  return { ...r, data: { id: spendId, status: pending ? 'pending' : 'spent' } };
}

export function approveSpend(id: number | string) {
  return week.send('approve', { spendId: id });
}

export function transferDone(month: string) {
  return week.send('transfer', { month }, { holdMs: UNDO_MS });
}

// ---- きろく edits (history-and-editing.md §4): always my own data, open weeks only (the model refuses the rest).
// Each shows at once and waits UNDO_MS with 取り消す on the banner, like payday and 使う！.

export function setMetric(date: string, metric: 'steps' | 'exercise_min', value: number) {
  return week.send('metric_set', { date, metric, value: Math.round(value) }, { holdMs: UNDO_MS });
}

/** `strength`: count as strength (true), not (false) or automatic (null); `excluded`: out of scoring. */
export function editWorkout(id: string, change: { strength?: boolean | null; excluded?: boolean }) {
  return week.send('workout_edit', { id, ...change }, { holdMs: UNDO_MS });
}

export function addWorkout(date: string, type: string, durationMin: number, strength?: boolean) {
  const id = `m:${newId().replace(/[^\w-]/g, '').slice(0, 36)}`;
  return week.send('workout_add', { id, date, type, durationMin: Math.round(durationMin), ...(strength === undefined ? {} : { strength }) }, { holdMs: UNDO_MS });
}

/** A fix of any day's check-in in an open week (the 48 h window doesn't apply). */
export function fixCheckin(date: string, habitKey: string, done: boolean) {
  return week.send('checkin', { date, habit: habitKey, done, edit: true }, { holdMs: UNDO_MS });
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
  if (!villagerName) return Promise.resolve(null);
  return week.send('pref', { key: 'villagerName', value: villagerName });
}

/** Villager from the roster (しまフォン → 村人), e.g. 'goldie' (lib/villagers/roster.ts). */
export function setVillager(villager: string) {
  return week.send('pref', { key: 'villager', value: villager });
}
