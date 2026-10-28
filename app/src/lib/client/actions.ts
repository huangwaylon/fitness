// One function per API mutation, each with its optimistic update. Pages call these.
import type { PromiseKind } from '#lib/types.ts';
import { COZY } from '#lib/config/rules.ts';
import type { WeekView } from '#lib/types.ts';
import { week } from './week.svelte.ts';
import { setLocale, type Locale } from '#lib/i18n/index.ts';

function mine(v: WeekView) {
  return v.people[v.me];
}

export function checkin(date: string, habitKey: string, done: boolean) {
  return week.mutate('/api/checkin', { date, habitKey, done }, (v) => {
    const h = mine(v).habits;
    if (!h) return;
    const list = h.ticksByDate[date] ?? [];
    const next = list.filter((k) => k !== habitKey);
    if (done) next.push(habitKey);
    h.ticksByDate[date] = next;
  });
}

/** Returns 'ok' | 'limit' | 'error'. A 409 `cozy_limit` gets a gentle message from the caller. */
export async function cozyDay(date: string, on: boolean): Promise<'ok' | 'limit' | 'error'> {
  const r = await week.mutate<{ error?: string }>('/api/cozy-day', { date, on }, (v) => {
    const me = mine(v);
    if (v.today === date && me.isCozyToday !== on) {
      me.isCozyToday = on;
      me.cozyDaysThisMonth = Math.max(0, me.cozyDaysThisMonth + (on ? 1 : -1));
    }
  });
  if (r.ok) return 'ok';
  if (r.status === 409) return 'limit';
  return 'error';
}

export function cozyLeft(v: WeekView): number {
  return Math.max(0, COZY.maxPerMonth - mine(v).cozyDaysThisMonth);
}

export function highFive() {
  return week.mutate('/api/high-five', {}, (v) => {
    v.highFivesToday += 1;
  });
}

export function confirmPending(kind: 'visit' | 'workout', id: string, yes: boolean) {
  return week.mutate('/api/confirm', { kind, id, yes }, (v) => {
    v.pending = v.pending.filter((p) => !(p.kind === kind && p.id === id));
  });
}

export function setPromise(daysMask: number, kind: PromiseKind, note: string) {
  const clean = note.trim();
  return week.mutate('/api/promise', { daysMask, kind, ...(clean ? { note: clean } : {}) }, (v) => {
    const me = mine(v);
    me.promise = { daysMask, kind, note: clean || null, result: 'open', cheered: me.promise?.cheered ?? false };
  });
}

export function cheer() {
  return week.mutate('/api/promise/cheer', {}, (v) => {
    const p = v.people[v.partner].promise;
    if (p) p.cheered = true;
  });
}

export function blocker(text: string) {
  return week.mutate('/api/promise/blocker', { text });
}

export function confirmHarvest() {
  return week.mutate('/api/harvest/confirm', {}, (v) => {
    if (v.harvest && !v.harvest.confirmedBy.includes(v.me)) v.harvest.confirmedBy.push(v.me);
  });
}

export function spendPurse(label: string, amountYen: number, needsBoth: boolean) {
  return week.mutate<{ id?: string | number; status?: string }>('/api/purse/spend', { label, amountYen }, (v) => {
    if (needsBoth) {
      v.jar.pendingSpends = [...(v.jar.pendingSpends), { id: -Date.now(), label, amountYen, by: v.me }];
    } else {
      v.jar.purseYen = Math.max(0, v.jar.purseYen - amountYen);
    }
  });
}

export function approveSpend(id: number) {
  return week.mutate('/api/purse/approve', { id }, (v) => {
    const s = v.jar.pendingSpends.find((p) => p.id === id);
    if (s) {
      v.jar.purseYen = Math.max(0, v.jar.purseYen - s.amountYen);
      v.jar.pendingSpends = v.jar.pendingSpends.filter((p) => p.id !== id);
    }
  });
}

export function transferDone(month: string) {
  return week.mutate('/api/transfer/done', { month }, (v) => {
    if (v.jar.transfer) v.jar.transfer.done = true;
  });
}

export function setLanguage(locale: Locale) {
  setLocale(locale);
  return week.mutate('/api/prefs', { locale }, (v) => {
    v.locale = locale;
  });
}

export function setVillagerName(name: string) {
  const villagerName = name.trim().slice(0, 12);
  if (!villagerName) return Promise.resolve(null);
  return week.mutate('/api/prefs', { villagerName }, (v) => {
    mine(v).villagerName = villagerName;
  });
}

export function setVisibility(metric: string, shareRaw: boolean) {
  return week.mutate('/api/visibility', { metric, shareRaw }, (v) => {
    v.visibility = { ...(v.visibility ?? {}), [metric]: shareRaw };
  });
}

