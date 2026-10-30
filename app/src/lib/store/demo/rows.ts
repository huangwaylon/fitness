// `?demo`: believable sheet rows for both people (ウェイ = A = me, うめ = B), generated around the real clock and fed
// through the same model as the live app, so the island, the Jar and きろく agree and every edit really recomputes.
// The economy starts 2026-10-26, so the demo moves the model's calendar (`DemoCalendar`, carried by the state): its
// first week is 8 weeks before this one. Deterministic per date (a seeded RNG), so a reload shows the same history.
import type { PersonId, WeekKey } from '#lib/types.ts';
import type { EventRow, MetricRow, PresenceRow, SnapshotRows, WorkoutRow } from '#lib/contract/api.ts';
import { addDays, nowInZone, weekDays, weekKeyOf } from '#lib/scoring/index.ts';
import { finalMs, jstMs, provisionalMs } from '#lib/model/state.ts';
import type { SnapshotCache } from '#lib/sync/cache.ts';

const DEMO_WEEKS_BACK = 8;

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
const HABITS: Record<PersonId, string[]> = { A: ['protein_each_meal', 'no_sweets', 'veg_two_meals'], B: ['protein_each_meal', 'no_sweets', 'veg_two_meals'] };

function demoFirstWeek(now: number): WeekKey {
  return addDays(weekKeyOf(nowInZone(new Date(now)).date), -7 * DEMO_WEEKS_BACK);
}

/** The demo's rows as of `now` (only rows the server would have stamped by then). */
function demoRows(now: number): SnapshotRows {
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
  // A gym arrival (the one Shortcut automation): a strength day, however long the stay.
  const arrive = (p: PersonId, place: string, date: string, h: number, m: number) => {
    const a = at(date, h, m);
    if (a + 30_000 < now) presence.push([iso(a + 30_000), p, place, 'arrive', iso(a)]);
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
      // Around the shared goals (45 min, 8,000 steps: ADR 0019), a lazy day now and then.
      const steps = Math.round(((p === 'A' ? 9000 : 8600) + (r() - 0.5) * (p === 'A' ? 6000 : 5000) - (lazy ? 3500 : 0)) * partial);
      const mins = Math.round(((p === 'A' ? 44 : 40) + (r() - 0.5) * 36 - (lazy ? 22 : 0)) * partial);
      if (syncAt > at(d, 6) && syncAt < now) {
        metrics.push([iso(syncAt), p, d, 'steps', Math.max(300, steps)], [iso(syncAt), p, d, 'exercise_min', Math.max(0, mins)]);
      }
      // Eating check-ins, ticked in the evening.
      const tickAt = at(d, 21, 10 + Math.floor(r() * 30));
      for (const h of HABITS[p]) if (r() < (p === 'A' ? 0.68 : 0.78)) ev(tickAt, p, 'checkin', { date: d, habit: h, done: true });
    }
    // ウェイ: strength at the gym Mon/Thu (a Watch workout + an エニタイム arrival), a run some Saturdays.
    const ra = rng(`A-w|${d}`);
    if ((dow === 1 || dow === 4) && ra() < 0.7) {
      wo(night, 'A', d, 'Traditional Strength Training', 19, 15, 45 + Math.floor(ra() * 20), 118);
      arrive('A', 'anytime', d, 19, 5);
    }
    if (dow === 6 && ra() < 0.6) wo(night, 'A', d, 'Outdoor Run', 8, 10, 28 + Math.floor(ra() * 15), 152);
    // Watch forgotten: the エニタイム arrival alone makes it a strength day.
    if (dow === 3 && ra() < 0.3) arrive('A', 'anytime', d, 20, 0);
    // うめ: PT studio on Fridays (an arrival, no Watch workout), Pilates on Tuesdays, yoga on Sundays.
    const rb = rng(`B-w|${d}`);
    if (dow === 5 && rb() < 0.75) arrive('B', 'pt_studio', d, 18, 30);
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
  if (today > cur) edit(at(today, 7, 40), 'A', 'checkin', { date: cur, habit: 'no_sweets', done: true, edit: true }, cur);

  // The pots (ADR 0019): treats most weeks, a day trip, one treat taken back by its buyer, and a menu edit.
  const buy = (t: number, p: PersonId, spendId: string, pot: 'treat' | 'trip', item: string, label: string, bells: number) =>
    ev(t, p, 'spend', { spendId, pot, item, label, bells });
  buy(at(addDays(w(6), 5), 15, 20), 'A', 'demo-ice-1', 'treat', 'ice', 'アイス', 2000);
  buy(at(addDays(w(5), 6), 13, 0), 'B', 'demo-cafe-1', 'treat', 'cafe', 'カフェデート', 2000);
  buy(at(addDays(w(4), 2), 19, 30), 'A', 'demo-snack-void', 'treat', 'snack', 'おやつ', 1500);
  ev(at(addDays(w(4), 2), 19, 34), 'A', 'spend_void', { spendId: 'demo-snack-void' });
  // うめ adds パフェ to the treats menu.
  ev(at(addDays(w(4), 3), 21, 0), 'B', 'pref', {
    key: 'treatMenu',
    value: JSON.stringify([
      { id: 'snack', label: 'おやつ', bells: 1500 }, { id: 'ice', label: 'アイス', bells: 2000 }, { id: 'cafe', label: 'カフェデート', bells: 2000 },
      { id: 'parfait', label: 'パフェ', bells: 2500 }, { id: 'dessert', label: 'デザート・パフェ', bells: 3000 }, { id: 'dinner', label: '外ごはん', bells: 5000 }
    ])
  });
  buy(at(addDays(w(3), 5), 16, 0), 'B', 'demo-parfait', 'treat', 'parfait', 'パフェ', 2500);
  buy(at(addDays(w(2), 6), 10, 0), 'A', 'demo-daytrip', 'trip', 'daytrip', '日帰り', 12000);
  buy(at(addDays(w(1), 4), 20, 15), 'B', 'demo-cafe-2', 'treat', 'cafe', 'カフェデート', 2000);
  if (today > cur) buy(at(addDays(cur, 0), 18, 30), 'A', 'demo-snack', 'treat', 'snack', 'おやつ', 1500);

  // Body weight (ADR 0020): 12 weeks of morning weigh-ins, gently down with day-to-day water noise, a few days
  // skipped, synced after breakfast; and a goal each. Weight never earns, so none of this moves a ベル.
  const WEIGHT_DEMO: Record<PersonId, { start: number; perWeek: number; noise: number; skip: number; goal: number }> = {
    A: { start: 72.6, perWeek: -0.35, noise: 0.9, skip: 0.15, goal: 66 },
    B: { start: 58.4, perWeek: -0.2, noise: 0.7, skip: 0.25, goal: 55.5 }
  };
  const wStart = addDays(cur, -7 * 12);
  for (let d = wStart, i = 0; d <= today; d = addDays(d, 1), i++) {
    for (const p of ['A', 'B'] as PersonId[]) {
      const c = WEIGHT_DEMO[p];
      const r = rng(`${p}|weight|${d}`);
      if (r() < c.skip) continue;
      const kg = c.start + (c.perWeek * i) / 7 + (r() + r() + r() - 1.5) * c.noise;
      const syncAt = at(d, 8, 10 + Math.floor(r() * 30));
      if (syncAt < now) metrics.push([iso(syncAt), p, d, 'weight', Math.round(kg * 10) / 10]);
    }
  }
  ev(at(wStart, 21, 0), 'A', 'pref', { key: 'goalWeight', value: WEIGHT_DEMO.A.goal });
  ev(at(addDays(wStart, 2), 21, 0), 'B', 'pref', { key: 'goalWeight', value: WEIGHT_DEMO.B.goal });

  const byAt = <T extends readonly unknown[]>(rows: T[]) => rows.sort((x, y) => String(x[0]).localeCompare(String(y[0])));
  return { metrics: byAt(metrics), workouts: byAt(workouts), presence: byAt(presence), events: byAt(events) };
}

/** A snapshot cache for the demo store (me = A, or B with `?demo&as=B`), carrying the demo's calendar for the model. */
export function demoCache(now: number, me: PersonId = 'A'): SnapshotCache {
  const rows = demoRows(now);
  let since: string | null = null;
  for (const tab of [rows.metrics, rows.workouts, rows.presence, rows.events] as (readonly unknown[])[][]) {
    for (const r of tab) if (since === null || String(r[0]) > since) since = String(r[0]);
  }
  return { v: 1, me, rows, since, skewMs: 0, fetchedAt: now, demo: { firstWeek: demoFirstWeek(now) } };
}
