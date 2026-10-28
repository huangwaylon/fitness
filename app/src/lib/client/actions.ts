// One function per API mutation, each with its optimistic update. Pages call these.
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

/** Villager from the roster (しまフォン → 村人), e.g. 'goldie' (lib/villagers/roster.ts). */
export function setVillager(villager: string) {
  return week.mutate('/api/prefs', { villager }, (v) => {
    mine(v).villager = villager;
  });
}
