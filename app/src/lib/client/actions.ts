// One function per user action. Each queues an event for the Apps Script backend (lib/client/gas.ts); the store
// recomputes the view with it at once. The optimistic edits below are only used in demo mode (fixtures).
import type { WeekView } from '#lib/types.ts';
import { MONEY } from '#lib/config/rules.ts';
import { week, type SendResult } from './week.svelte.ts';
import { newId } from './gas.ts';
import { setLocale, type Locale } from '#lib/i18n/index.ts';

function mine(v: WeekView) {
  return v.people[v.me];
}

export function checkin(date: string, habitKey: string, done: boolean) {
  return week.send('checkin', { date, habit: habitKey, done }, (v) => {
    const h = mine(v).habits;
    if (!h) return;
    const list = h.ticksByDate[date] ?? [];
    const next = list.filter((k) => k !== habitKey);
    if (done) next.push(habitKey);
    h.ticksByDate[date] = next;
  });
}

export function highFive() {
  return week.send('highfive', {}, (v) => {
    v.highFivesToday += 1;
  });
}

export function confirmPending(kind: 'visit' | 'workout', id: string, yes: boolean) {
  return week.send('confirm', { kind, id, yes }, (v) => {
    v.pending = v.pending.filter((p) => !(p.kind === kind && p.id === id));
  });
}

export function confirmHarvest(): Promise<SendResult> {
  const wk = week.view?.harvest?.weekKey;
  if (!wk) return Promise.resolve({ ok: false, status: 409, data: null });
  return week.send('harvest', { week: wk }, (v) => {
    if (v.harvest && !v.harvest.confirmedBy.includes(v.me)) v.harvest.confirmedBy.push(v.me);
  });
}

export async function spendPurse(label: string, amountYen: number, needsBoth: boolean): Promise<SendResult<{ id?: string | number; status?: string }>> {
  if ((week.view?.jar.purseYen ?? 0) < amountYen) return { ok: false, status: 409, data: null }; // insufficient_purse
  const spendId = newId();
  const pending = needsBoth || amountYen >= MONEY.purseNeedsBothAtYen;
  const r = await week.send('spend', { spendId, label, amountYen }, (v) => {
    if (pending) v.jar.pendingSpends = [...v.jar.pendingSpends, { id: spendId, label, amountYen, by: v.me }];
    else v.jar.purseYen = Math.max(0, v.jar.purseYen - amountYen);
  });
  return { ...r, data: { id: spendId, status: pending ? 'pending' : 'spent' } };
}

export function approveSpend(id: number | string) {
  return week.send('approve', { spendId: id }, (v) => {
    const s = v.jar.pendingSpends.find((p) => p.id === id);
    if (s) {
      v.jar.purseYen = Math.max(0, v.jar.purseYen - s.amountYen);
      v.jar.pendingSpends = v.jar.pendingSpends.filter((p) => p.id !== id);
    }
  });
}

export function transferDone(month: string) {
  return week.send('transfer', { month }, (v) => {
    if (v.jar.transfer) v.jar.transfer.done = true;
  });
}

export function setLanguage(locale: Locale) {
  setLocale(locale);
  return week.send('pref', { key: 'locale', value: locale }, (v) => {
    v.locale = locale;
  });
}

export function setVillagerName(name: string) {
  const villagerName = name.trim().slice(0, 12);
  if (!villagerName) return Promise.resolve(null);
  return week.send('pref', { key: 'villagerName', value: villagerName }, (v) => {
    mine(v).villagerName = villagerName;
  });
}

export function setVisibility(metric: string, shareRaw: boolean) {
  return week.send('share', { metric, on: shareRaw }, (v) => {
    v.visibility = { ...(v.visibility ?? {}), [metric]: shareRaw };
  });
}

/** Villager from the roster (しまフォン → 村人), e.g. 'goldie' (lib/villagers/roster.ts). */
export function setVillager(villager: string) {
  return week.send('pref', { key: 'villager', value: villager }, (v) => {
    mine(v).villager = villager;
  });
}
