// `?demo`: believable sheet rows for both people (ウェイ = A = me, うめ = B), generated around the real clock and fed
// through the same model as the live app, so the island, the wallet and きろく agree and every tap really recomputes.
// The economy starts 2026-10-26, so the demo moves the model's calendar (`DemoCalendar`, carried by the state): its
// first week is 8 weeks before this one. Deterministic per date (a seeded RNG), so a reload shows the same history.
import type { PersonId, WeekKey } from '#lib/types.ts';
import type { EventRow, MetricRow, SnapshotRows } from '#lib/contract/api.ts';
import { addDays, jstMs, localDateAt, weekDays, weekKeyOf } from '#lib/time/dates.ts';
import { provisionalMs } from '#lib/model/state.ts';
import type { SnapshotCache } from '#lib/sync/cache.ts';
import { maxAt } from '#lib/model/snapshot.ts';
import { mulberry32 } from '#lib/random.ts';

const DEMO_WEEKS_BACK = 8;

/** A PRNG seeded by a string. */
function rng(seed: string): () => number {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 3432918353), (h = (h << 13) | (h >>> 19));
  return mulberry32(h);
}

const iso = (ms: number) => new Date(ms).toISOString();
const at = (date: string, h: number, m = 0) => jstMs(date, h, m);

function demoFirstWeek(now: number): WeekKey {
  return addDays(weekKeyOf(localDateAt(now)), -7 * DEMO_WEEKS_BACK);
}

/** The demo's rows as of `now` (only rows the server would have stamped by then). */
function demoRows(now: number): SnapshotRows {
  const today = localDateAt(now);
  const cur = weekKeyOf(today);
  const first = demoFirstWeek(now);
  const metrics: MetricRow[] = [];
  const events: EventRow[] = [];
  let n = 0;
  const ev = (t: number, p: PersonId, type: EventRow[3], data: object) => {
    if (t < now) events.push([iso(t), p, `demo-${++n}`, type, JSON.stringify(data)]);
  };

  for (let d = first; d <= today; d = addDays(d, 1)) {
    const isToday = d === today;
    const night = at(d, 22, 30);
    // Today only has a midday sync, scaled to the hour.
    const partial = isToday ? Math.max(0, Math.min(1, (now - at(d, 6)) / (16 * 3600_000))) : 1;
    const syncAt = isToday ? Math.min(now - 40 * 60_000, night) : night;
    for (const p of ['A', 'B'] as PersonId[]) {
      const r = rng(`${p}|${d}`);
      const lazy = r() < 0.3;
      // Around the goals (60 exercise min, 8,000 steps), a lazy day now and then.
      const steps = Math.round(((p === 'A' ? 9000 : 8600) + (r() - 0.5) * (p === 'A' ? 6000 : 5000) - (lazy ? 3500 : 0)) * partial);
      const mins = Math.round(((p === 'A' ? 62 : 56) + (r() - 0.5) * 44 - (lazy ? 28 : 0)) * partial);
      // Move (active kcal) around each default goal (ウェイ 600, うめ 400) and Stand minutes around 180.
      const kcal = Math.round(((p === 'A' ? 610 : 420) + (r() - 0.5) * (p === 'A' ? 360 : 260) - (lazy ? 200 : 0)) * partial);
      const stand = Math.round((190 + (r() - 0.5) * 120 - (lazy ? 60 : 0)) * partial);
      if (syncAt > at(d, 6) && syncAt < now) {
        metrics.push(
          [iso(syncAt), p, d, 'steps', Math.max(300, steps)], [iso(syncAt), p, d, 'exercise_min', Math.max(0, mins)],
          [iso(syncAt), p, d, 'move_kcal', Math.max(30, kcal)], [iso(syncAt), p, d, 'stand_min', Math.max(5, stand)]
        );
      }
    }
  }

  // Harvests: both tap 受け取る on Sunday evening.
  for (let wk = first; provisionalMs(wk) <= now; wk = addDays(wk, 7)) {
    const p0 = provisionalMs(wk);
    ev(Math.max(p0 + 1000, Math.min(p0 + 25 * 60_000, now - 2000)), 'B', 'harvest', { week: wk });
    ev(Math.max(p0 + 2000, Math.min(p0 + 40 * 60_000, now - 1000)), 'A', 'harvest', { week: wk });
  }

  const w = (k: number) => addDays(cur, -7 * k);
  // うめ raises her Move goal to 450 kcal (3 weeks ago, from that Wednesday on: earlier days keep 400).
  ev(at(addDays(w(3), 2), 7, 30), 'B', 'pref', { key: 'moveGoal', value: 450 });

  // The wallet: treats most weeks, a dinner out, a trip treat saved up for, and one buy taken back by its
  // buyer. The menu stays the default one.
  const buy = (t: number, p: PersonId, spendId: string, item: string, label: string, bells: number) =>
    ev(t, p, 'spend', { spendId, item, label, bells });
  buy(at(addDays(w(6), 5), 15, 20), 'A', 'demo-ice-1', 'snack', 'おやつ', 1200);
  buy(at(addDays(w(5), 6), 13, 0), 'B', 'demo-cafe-1', 'cafe', 'カフェ・デザート', 2500);
  buy(at(addDays(w(4), 2), 19, 30), 'A', 'demo-snack-void', 'snack', 'おやつ', 1200);
  ev(at(addDays(w(4), 2), 19, 34), 'A', 'spend_void', { spendId: 'demo-snack-void' });
  buy(at(addDays(w(3), 5), 16, 0), 'B', 'demo-snack-2', 'snack', 'おやつ', 1200);
  buy(at(addDays(w(3), 6), 19, 0), 'A', 'demo-dinner', 'dinner', '外ごはん', 6000);
  buy(at(addDays(w(2), 6), 10, 0), 'A', 'demo-meal', 'trip', '旅のごほうび', 12000);
  buy(at(addDays(w(1), 4), 20, 15), 'B', 'demo-cafe-2', 'cafe', 'カフェ・デザート', 2500);
  if (today > cur) buy(at(addDays(cur, 0), 18, 30), 'A', 'demo-snack', 'snack', 'おやつ', 1200);

  // Body weight: 12 weeks of morning weigh-ins, gently down with day-to-day water noise, a few days
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
  return { metrics: byAt(metrics), events: byAt(events) };
}

/** A snapshot cache for the demo store (me = A, or B with `?demo&as=B`), carrying the demo's calendar for the model. */
export function demoCache(now: number, me: PersonId = 'A'): SnapshotCache {
  const rows = demoRows(now);
  return { v: 1, me, rows, since: maxAt(rows), skewMs: 0, fetchedAt: now, demo: { firstWeek: demoFirstWeek(now) } };
}
