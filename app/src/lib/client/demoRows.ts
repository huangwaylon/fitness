// `?demo`: believable sheet rows for both people (ウェイ = A = me, うめ = B), generated around the real clock and fed
// through the same model as the live app, so the island, the Jar and きろく agree and every edit really recomputes.
// Season 1 starts after the demo's weeks, so the demo moves the model's calendar (setDemoCalendar): its first paid
// week is 8 weeks before this one. Deterministic per date (a seeded RNG), so a reload shows the same history.
import type { PersonId, WeekKey } from '#lib/types.ts';
import type { EventRow, MetricRow, PresenceRow, SnapshotRows, WorkoutRow } from '#lib/ingest/sheet-api.ts';
import { addDays, nowInZone, weekDays, weekKeyOf } from '#lib/scoring/index.ts';
import { finalMs, jstMs, provisionalMs, setDemoCalendar } from '#lib/model/state.ts';
import { prevMonth } from '#lib/model/week.ts';
import type { SnapshotCache } from './gas.ts';

export const DEMO_WEEKS_BACK = 8;

/** mulberry32, seeded by a string. */
function rng(seed: string): () => number {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 3432918353), (h = (h << 13) | (h >>> 19));
  let a = h >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const iso = (ms: number) => new Date(ms).toISOString();
const at = (date: string, h: number, m = 0) => jstMs(date, h, m);
const HABITS: Record<PersonId, string[]> = { A: ['teishoku_lunch', 'low_salt_day', 'veg_two_meals'], B: ['eat_lunch', 'snack_swap', 'veg_two_meals'] };

export function demoFirstWeek(now: number): WeekKey {
  return addDays(weekKeyOf(nowInZone(new Date(now)).date), -7 * DEMO_WEEKS_BACK);
}

/** The demo's rows as of `now` (only rows the server would have stamped by then). */
export function demoRows(now: number): SnapshotRows {
  const today = nowInZone(new Date(now)).date;
  const cur = weekKeyOf(today);
  const first = demoFirstWeek(now);
  const metrics: MetricRow[] = [];
  const workouts: WorkoutRow[] = [];
  const presence: PresenceRow[] = [];
  const events: EventRow[] = [];
  let n = 0;
  const ev = (t: number, p: PersonId, type: EventRow[3], data: object) => {
    if (t < now) events.push([iso(t), p, `demo-${++n}`, type, JSON.stringify(data)]);
  };
  const wo = (sync: number, p: PersonId, date: string, type: string, h: number, m: number, min: number, hr: number) => {
    if (sync >= now) return;
    const start = at(date, h, m);
    workouts.push([iso(sync), p, `${type}@${iso(start)}`, date, type, iso(start), iso(start + min * 60_000), min, hr]);
  };
  const visit = (p: PersonId, place: string, date: string, h: number, m: number, min: number) => {
    const a = at(date, h, m);
    const l = a + min * 60_000;
    if (l + 60_000 >= now) return null;
    presence.push([iso(a + 30_000), p, place, 'arrive', iso(a)], [iso(l + 30_000), p, place, 'leave', iso(l)]);
    return `${place}@${iso(a)}`;
  };

  for (let d = first; d <= today; d = addDays(d, 1)) {
    const dow = (weekDays(weekKeyOf(d)).indexOf(d) + 1) as 1 | 2 | 3 | 4 | 5 | 6 | 7; // 1 = Mon
    const isToday = d === today;
    const night = at(d, 22, 30);
    // Today only has a midday sync, scaled to the hour.
    const partial = isToday ? Math.max(0, Math.min(1, (now - at(d, 6)) / (16 * 3600_000))) : 1;
    const syncAt = isToday ? Math.min(now - 40 * 60_000, night) : night;
    for (const p of ['A', 'B'] as PersonId[]) {
      const r = rng(`${p}|${d}`);
      const lazy = r() < 0.3;
      const steps = Math.round(((p === 'A' ? 7400 : 6300) + (r() - 0.5) * (p === 'A' ? 6000 : 5000) - (lazy ? 3000 : 0)) * partial);
      const mins = Math.round(((p === 'A' ? 20 : 12) + (r() - 0.5) * 30 - (lazy ? 14 : 0)) * partial);
      if (syncAt > at(d, 6) && syncAt < now) {
        metrics.push([iso(syncAt), p, d, 'steps', Math.max(300, steps)], [iso(syncAt), p, d, 'exercise_min', Math.max(0, mins)]);
      }
      // Eating check-ins, ticked in the evening.
      const tickAt = at(d, 21, 10 + Math.floor(r() * 30));
      for (const h of HABITS[p]) if (r() < (p === 'A' ? 0.5 : 0.62)) ev(tickAt, p, 'checkin', { date: d, habit: h, done: true });
    }
    // ウェイ: strength at the gym Mon/Thu (a Watch workout + an エニタイム visit), a run some Saturdays.
    const ra = rng(`A-w|${d}`);
    if ((dow === 1 || dow === 4) && ra() < 0.7) {
      wo(night, 'A', d, 'Traditional Strength Training', 19, 15, 45 + Math.floor(ra() * 20), 118);
      visit('A', 'anytime', d, 19, 5, 70);
    }
    if (dow === 6 && ra() < 0.6) wo(night, 'A', d, 'Outdoor Run', 8, 10, 28 + Math.floor(ra() * 15), 152);
    if (dow === 3 && ra() < 0.3) {
      // A visit without a Watch workout, answered 「筋トレでした」.
      const id = visit('A', 'anytime', d, 20, 0, 50);
      if (id) ev(at(d, 21, 5), 'A', 'confirm', { kind: 'visit', id, yes: true });
    }
    // うめ: PT studio on Fridays (auto strength), Pilates on Tuesdays, yoga on Sundays.
    const rb = rng(`B-w|${d}`);
    if (dow === 5 && rb() < 0.75) visit('B', 'pt_studio', d, 18, 30, 60);
    if (dow === 2 && rb() < 0.8) wo(night, 'B', d, 'Pilates', 7, 0, 40, 104);
    if (dow === 7 && rb() < 0.7) {
      wo(night, 'B', d, 'Yoga', 9, 30, 45, 96);
      ev(at(d, 22, 40), 'B', 'confirm', { kind: 'workout', id: `Yoga@${iso(at(d, 9, 30))}`, yes: rb() < 0.5 });
    }
  }

  // This week: a yoga session of mine still waiting for 「筋トレでしたか？」 (the island's question).
  const yogaDay = today > cur ? addDays(today, -1) : today;
  wo(Math.min(at(yogaDay, 8, 20), now - 60_000), 'A', yogaDay, 'Yoga', 7, 15, 45, 101);

  // Harvests: both drop the week into the jar on Sunday evening.
  for (let wk = first; provisionalMs(wk) <= now; wk = addDays(wk, 7)) {
    const p0 = provisionalMs(wk);
    ev(Math.max(p0 + 1000, Math.min(p0 + 25 * 60_000, now - 2000)), 'B', 'harvest', { week: wk });
    ev(Math.max(p0 + 2000, Math.min(p0 + 40 * 60_000, now - 1000)), 'A', 'harvest', { week: wk });
  }

  // Edits in the change log (each made while its week was still open).
  const w = (k: number) => addDays(cur, -7 * k);
  const inOpen = (date: string, t: number) => t < finalMs(weekKeyOf(date));
  const edit = (t: number, p: PersonId, type: EventRow[3], data: { date?: string } & Record<string, unknown>, date: string) => {
    if (inOpen(date, t)) ev(t, p, type, data);
  };
  // うめ forgot her Watch at the PT studio: minutes fixed the next day (last week).
  edit(at(addDays(w(1), 2), 21, 4), 'B', 'metric_set', { date: addDays(w(1), 1), metric: 'exercise_min', value: 55 }, addDays(w(1), 1));
  // ウェイ: a walk that the Watch double-counted (2 weeks ago: steps lowered).
  edit(at(addDays(w(2), 3), 22, 50), 'A', 'metric_set', { date: addDays(w(2), 2), metric: 'steps', value: 6400 }, addDays(w(2), 2));
  // うめ: a manual Pilates (3 weeks ago), counted as strength.
  edit(at(addDays(w(3), 4), 20, 12), 'B', 'workout_add', { id: 'm:demo-pilates', date: addDays(w(3), 3), type: 'Pilates', durationMin: 35, strength: true }, addDays(w(3), 3));
  // ウェイ: a missed check-in ticked later (this week, if Monday is past).
  if (today > cur) edit(at(today, 7, 40), 'A', 'checkin', { date: cur, habit: 'low_salt_day', done: true, edit: true }, cur);

  // The purse: a few treats (one ≥ ¥5,000 needs the other's OK), one voided by its spender.
  const spend = (t: number, p: PersonId, spendId: string, label: string, amountYen: number) => ev(t, p, 'spend', { spendId, label, amountYen });
  spend(at(addDays(w(5), 5), 15, 20), 'A', 'demo-cafe', 'カフェ', 2000);
  spend(at(addDays(w(4), 6), 13, 0), 'B', 'demo-karaoke', 'カラオケ', 3000);
  spend(at(addDays(w(3), 2), 19, 30), 'A', 'demo-movie', '映画', 4000);
  ev(at(addDays(w(3), 2), 19, 34), 'A', 'spend_void', { spendId: 'demo-movie' });
  spend(at(addDays(w(2), 5), 10, 0), 'B', 'demo-onsen', '温泉', 5000);
  ev(at(addDays(w(2), 5), 12, 30), 'A', 'approve', { spendId: 'demo-onsen' });

  // Bank transfers: every month before last is ticked ✓ (last month's is the payday cue).
  const last = prevMonth(today);
  for (let m = prevMonth(`${last}-01`); m >= first.slice(0, 7); m = prevMonth(`${m}-01`)) ev(at(`${last}-25`, 20), 'A', 'transfer', { month: m });

  const byAt = <T extends readonly unknown[]>(rows: T[]) => rows.sort((x, y) => String(x[0]).localeCompare(String(y[0])));
  return { metrics: byAt(metrics), workouts: byAt(workouts), presence: byAt(presence), events: byAt(events) };
}

/** A snapshot cache for the demo store (me = A, or B with `?demo&as=B`), with the model's calendar moved to the demo's weeks. */
export function demoCache(now: number, me: PersonId = 'A'): SnapshotCache {
  setDemoCalendar({ firstWeek: demoFirstWeek(now) });
  const rows = demoRows(now);
  let since: string | null = null;
  for (const tab of [rows.metrics, rows.workouts, rows.presence, rows.events] as (readonly unknown[])[][]) {
    for (const r of tab) if (since === null || String(r[0]) > since) since = String(r[0]);
  }
  return { v: 1, me, rows, since, skewMs: 0, fetchedAt: now };
}
