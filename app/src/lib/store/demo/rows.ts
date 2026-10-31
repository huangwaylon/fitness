// `?demo`: believable sheet rows for both people (ウェイ = A = me, うめ = B), generated around the real clock and fed
// through the same model as the live app, so the island, the wallet and きろく agree and every tap really recomputes.
// Activity rows start 8 weeks before this one (the economy's first week follows the data). Deterministic per date (a
// seeded RNG), so a reload shows the same history.
import type { PersonId, ShopItemId } from '#lib/types.ts';
import type { EventRow, MetricRow, SnapshotRows } from '#lib/contract/api.ts';
import { addDays, jstMs, localDateAt, weekKeyOf } from '#lib/time/dates.ts';
import { provisionalMs } from '#lib/model/state.ts';
import type { SnapshotCache } from '#lib/sync/cache.ts';
import { maxAt } from '#lib/model/snapshot.ts';
import { mulberry32 } from '#lib/random.ts';
import { shopPrice } from '#lib/config/rules.ts';

const DEMO_WEEKS_BACK = 8;

/** A PRNG seeded by a string. */
function rng(seed: string): () => number {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 3432918353), (h = (h << 13) | (h >>> 19));
  return mulberry32(h);
}

const iso = (ms: number) => new Date(ms).toISOString();
const at = (date: string, h: number, m = 0) => jstMs(date, h, m);

/** The demo's rows as of `now` (only rows the server would have stamped by then). */
function demoRows(now: number): SnapshotRows {
  const today = localDateAt(now);
  const cur = weekKeyOf(today);
  const first = addDays(cur, -7 * DEMO_WEEKS_BACK);
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
    // A typical week: about 2 in 5 days both of us do everything (ふたりでぜんぶ); otherwise each goal is a coin toss,
    // so each goal is met on ~5 of 7 days. The Move goals are the defaults (ウェイ 600, うめ 400; うめ 450 later).
    const good = rng(`day|${d}`)() < 0.4;
    for (const p of ['A', 'B'] as PersonId[]) {
      const r = rng(`${p}|${d}`);
      /** Around a goal: met (5–35% over) or not (50–95% of it). */
      const around = (goal: number) => Math.round(goal * (good || r() < 0.5 ? 1.05 + r() * 0.3 : 0.5 + r() * 0.45) * partial);
      const steps = around(8000), mins = around(60), kcal = around(p === 'A' ? 600 : 450), stand = around(120);
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

  // The wallet: two おやつ and a 外食 most weeks, and one buy taken back by its buyer.
  const buy = (t: number, p: PersonId, spendId: string, item: ShopItemId) => ev(t, p, 'spend', { spendId, item, bells: shopPrice(item) });
  for (let k = DEMO_WEEKS_BACK - 1; k >= 1; k--) {
    buy(at(addDays(w(k), 2), 15, 20), k % 2 ? 'A' : 'B', `demo-snack-${k}a`, 'snack');
    buy(at(addDays(w(k), 5), 16, 0), k % 2 ? 'B' : 'A', `demo-snack-${k}b`, 'snack');
    if (k % 3) buy(at(addDays(w(k), 6), 12, 30), k % 2 ? 'A' : 'B', `demo-dinner-${k}`, 'dinner');
  }
  buy(at(addDays(w(4), 3), 19, 30), 'A', 'demo-snack-void', 'snack');
  ev(at(addDays(w(4), 3), 19, 34), 'A', 'spend_void', { spendId: 'demo-snack-void' });
  if (today > cur) buy(at(addDays(cur, 0), 18, 30), 'A', 'demo-snack-now', 'snack');

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

/** A snapshot cache for the demo store (me = A, or B with `?demo&as=B`). */
export function demoCache(now: number, me: PersonId = 'A'): SnapshotCache {
  const rows = demoRows(now);
  return { v: 1, me, rows, since: maxAt(rows), skewMs: 0, fetchedAt: now, demo: true };
}
