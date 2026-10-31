// けんこう's numbers (model/health.ts): averages over recorded days only (no row, steps 0, the Watch not worn), today
// left out of the stats, weekly and monthly buckets, the change against the previous period, goal-met counts, the
// ranges and their navigation, and the edge cases (no data, one person only, sparse weight).
import { describe, expect, it } from 'vitest';
import type { EventRow, MetricRow, SnapshotRows } from '#lib/contract/api.ts';
import type { PersonId } from '#lib/types.ts';
import { addDays } from '#lib/time/dates.ts';
import { reduce } from './state.ts';
import {
  bucketValues, canShift, healthSeries, metricStats, previousRange, rangeFor, rolling7, shiftAnchor, weekCompare, weightBuckets, weightStats
} from './health.ts';

const jst = (date: string, hm = '22:00') => new Date(`${date}T${hm}:00+09:00`).toISOString();
const TODAY = '2026-10-31';
const NOW = Date.parse(jst(TODAY, '12:00'));
const m = (p: PersonId, date: string, metric: MetricRow[3], v: number, hm = '22:00'): MetricRow => [jst(date, hm), p, date, metric, v];
/** A full day: steps, exercise, Move, Stand. */
const day = (p: PersonId, date: string, v: { steps?: number; ex?: number; kcal?: number; stand?: number }, hm = '22:00'): MetricRow[] => [
  m(p, date, 'steps', v.steps ?? 0, hm), m(p, date, 'exercise_min', v.ex ?? 0, hm), m(p, date, 'move_kcal', v.kcal ?? 0, hm), m(p, date, 'stand_min', v.stand ?? 0, hm)
];
const rows = (metrics: MetricRow[], events: EventRow[] = []): SnapshotRows => ({ metrics, events });
const series = (r: SnapshotRows, now = NOW) => healthSeries(reduce(r), now);

describe('days with no record', () => {
  // 10-25..10-30 finished, 10-31 today
  const r = rows([
    ...day('A', '2026-10-25', { steps: 9000, ex: 70, kcal: 650, stand: 130 }),
    ...day('A', '2026-10-26', { steps: 5000, ex: 0, kcal: 0, stand: 0 }), // Watch not worn
    ...day('A', '2026-10-27', { steps: 0, ex: 30, kcal: 300, stand: 60 }), // phone left at home: steps missing only
    ...day('A', '2026-10-28', { steps: 7000, ex: 0, kcal: 200, stand: 90 }), // worn, a real 0 for exercise
    // 10-29: no row at all
    ...day('A', '2026-10-30', { steps: 11000, ex: 50, kcal: 700, stand: 125 }),
    ...day('A', TODAY, { steps: 1000, ex: 5, kcal: 80, stand: 10 }, '11:00') // running
  ]);
  const hs = series(r);
  const week = rangeFor('week', TODAY, hs.from);

  it('the Watch not worn: Move, Exercise and Stand have no record that day; steps keep theirs', () => {
    const i = 1; // 10-26
    expect(hs.from).toBe('2026-10-25');
    expect(hs.people.A.values.move[i]).toBeNull();
    expect(hs.people.A.values.exercise[i]).toBeNull();
    expect(hs.people.A.values.stand[i]).toBeNull();
    expect(hs.people.A.values.steps[i]).toBe(5000);
    expect(hs.people.A.values.steps[2]).toBeNull(); // steps 0
    expect(hs.people.A.values.exercise[3]).toBe(0); // worn: 0 is real
  });

  it('averages count recorded, finished days only (today out) and say how many are missing', () => {
    const steps = metricStats(hs, 'A', 'steps', week);
    // 10-25..10-30: 9000, 5000, –, 7000, –, 11000 → 4 days; 10-24 is before the first record (not missing)
    expect(steps.days).toBe(4);
    expect(steps.avg).toBe(8000);
    expect(steps.missing).toBe(2);
    expect(steps.met).toBe(2); // 9000, 11000
    expect(steps.best).toEqual({ date: '2026-10-30', v: 11000 });
    const ex = metricStats(hs, 'A', 'exercise', week);
    // 70, –, 30, 0, –, 50 → 150 / 4
    expect(ex.days).toBe(4);
    expect(ex.avg).toBe(37.5);
    expect(ex.met).toBe(1);
    const stand = metricStats(hs, 'A', 'stand', week);
    expect(stand.met).toBe(2); // 130, 125
  });

  it('the Move goal is the one in force each day', () => {
    const r2 = rows([
      ...day('B', '2026-10-28', { steps: 1, kcal: 420, ex: 1, stand: 1 }),
      ...day('B', '2026-10-30', { steps: 1, kcal: 420, ex: 1, stand: 1 })
    ], [[jst('2026-10-29', '08:00'), 'B', 'g1', 'pref', JSON.stringify({ key: 'moveGoal', value: 450 })]]);
    const h = series(r2);
    const s = metricStats(h, 'B', 'move', rangeFor('week', TODAY, h.from));
    expect(s.met).toBe(1); // 420 ≥ 400 on 10-28; 420 < 450 on 10-30
  });

  it('day bars: today shows its running value, flagged; a missing day has no bar', () => {
    const b = bucketValues(hs, 'A', 'steps', week);
    expect(b.map((x) => x.v)).toEqual([9000, 5000, null, 7000, null, 11000, 1000]);
    expect(b.at(-1)!.today).toBe(true);
    expect(b[0].goal).toBe(8000);
  });

  it('the 7-day line: finished days only, at least 3 recorded in the window', () => {
    const roll = rolling7(hs, 'A', 'steps', week);
    expect(roll[0]).toBeNull(); // 1 recorded
    expect(roll[1]).toBeNull(); // 2 recorded
    expect(roll[3]).toBeCloseTo((9000 + 5000 + 7000) / 3);
    expect(roll[6]).toBeNull(); // today
  });
});

describe('periods, buckets and the previous period', () => {
  // A: 10,000 steps a day for 120 days to yesterday, 6,000 a day for the 30 before that
  const start = addDays(TODAY, -150);
  const metrics: MetricRow[] = [];
  for (let d = start, i = 0; d < TODAY; d = addDays(d, 1), i++) metrics.push(...day('A', d, { steps: i < 30 ? 6000 : 10000, ex: 1, kcal: 1, stand: 1 }));
  const hs = series(rows(metrics));

  it('1週 and 1か月 go by day, 3か月 by week (13, ending on the anchor), 1年 by calendar month', () => {
    expect(rangeFor('week', TODAY, hs.from)).toMatchObject({ from: '2026-10-25', to: TODAY, unit: 'day' });
    expect(rangeFor('month', TODAY, hs.from).buckets).toHaveLength(30);
    const q = rangeFor('quarter', TODAY, hs.from);
    expect(q.unit).toBe('week');
    expect(q.buckets).toHaveLength(13);
    expect(q.buckets.at(-1)).toEqual({ from: '2026-10-25', to: TODAY });
    const y = rangeFor('year', TODAY, hs.from);
    expect(y.buckets).toHaveLength(12);
    expect(y.buckets[0]).toEqual({ from: '2025-11-01', to: '2025-11-30' });
    expect(y.buckets.at(-1)).toEqual({ from: '2026-10-01', to: TODAY });
    expect(rangeFor('year', '2026-03-15', hs.from).buckets[1]).toEqual({ from: '2025-05-01', to: '2025-05-31' });
    const all = rangeFor('all', TODAY, hs.from);
    expect(all.from).toBe('2026-06-01');
    expect(all.buckets).toHaveLength(5);
  });

  it('a week bucket averages its recorded days; the bucket holding today leaves today out', () => {
    const q = rangeFor('quarter', TODAY, hs.from);
    const b = bucketValues(hs, 'A', 'steps', q);
    expect(b.at(-1)).toMatchObject({ v: 10000, days: 6, met: 6, today: false });
    const y = bucketValues(hs, 'A', 'steps', rangeFor('year', TODAY, hs.from));
    expect(y[0]).toMatchObject({ v: null, days: 0 }); // before any data
    expect(y.at(-1)).toMatchObject({ v: 10000, days: 30 });
  });

  it('the change against the previous period of equal length', () => {
    const r = rangeFor('month', addDays(TODAY, -90), hs.from); // the 30 days ending 90 days ago …
    const prev = previousRange(r, hs.from)!;
    expect(prev.to).toBe(addDays(r.from, -1));
    expect(daysIn(prev)).toBe(30);
    // the first 30 days were 6,000, the next 30 days 10,000
    const r2 = rangeFor('month', addDays(start, 59), hs.from);
    expect(metricStats(hs, 'A', 'steps', r2).change).toBeCloseTo(10000 / 6000 - 1);
    // no previous data: no change
    expect(metricStats(hs, 'A', 'steps', rangeFor('month', addDays(start, 29), hs.from)).change).toBeNull();
    expect(metricStats(hs, 'A', 'steps', rangeFor('all', TODAY, hs.from)).change).toBeNull();
  });

  it('‹ › step a whole period, never past today; ‹ only while there is older data', () => {
    expect(shiftAnchor('week', TODAY, -1, TODAY)).toBe('2026-10-24');
    expect(shiftAnchor('month', '2026-10-01', 1, TODAY)).toBe(TODAY);
    expect(shiftAnchor('year', TODAY, -1, TODAY)).toBe('2025-10-31');
    expect(shiftAnchor('year', '2026-02-14', -1, TODAY)).toBe('2025-02-28');
    expect(shiftAnchor('all', TODAY, -1, TODAY)).toBe(TODAY);
    expect(canShift(rangeFor('month', TODAY, hs.from), hs.from, TODAY)).toEqual({ back: true, on: false });
    expect(canShift(rangeFor('year', TODAY, hs.from), hs.from, TODAY)).toEqual({ back: false, on: false });
    expect(canShift(rangeFor('week', '2026-10-01', hs.from), hs.from, TODAY)).toEqual({ back: true, on: true });
    expect(canShift(rangeFor('all', TODAY, hs.from), hs.from, TODAY)).toEqual({ back: false, on: false });
  });
});

const daysIn = (r: { from: string; to: string }) => (Date.parse(r.to) - Date.parse(r.from)) / 86400000 + 1;

describe('edge cases', () => {
  it('no data at all: nothing recorded, no averages, no ‹', () => {
    const hs = series(rows([]));
    expect(hs.any).toBe(false);
    expect(hs.from).toBe(TODAY);
    const r = rangeFor('month', TODAY, hs.from);
    expect(metricStats(hs, 'A', 'steps', r)).toEqual({ avg: null, days: 0, missing: 0, met: 0, best: null, change: null });
    expect(bucketValues(hs, 'B', 'move', r).every((b) => b.v === null)).toBe(true);
    expect(canShift(r, hs.from, TODAY).back).toBe(false);
    expect(weightStats(hs, 'A', r)).toEqual({ n: 0, avg: null, change: null, perWeek: null, trend: null });
  });

  it('one person only: the other has no record anywhere', () => {
    const hs = series(rows([...day('A', '2026-10-30', { steps: 9000, ex: 10, kcal: 100, stand: 10 })]));
    const r = rangeFor('week', TODAY, hs.from);
    expect(metricStats(hs, 'A', 'steps', r).days).toBe(1);
    expect(metricStats(hs, 'B', 'steps', r)).toMatchObject({ avg: null, days: 0, missing: 1 });
  });

  it('sparse weight: buckets average their weigh-ins, the trend carries between them, the change is trend to trend', () => {
    const hs = series(rows([
      m('A', '2026-09-01', 'weight', 70, '08:00'),
      m('A', '2026-10-20', 'weight', 69, '08:00'),
      m('A', '2026-10-22', 'weight', 68, '08:00')
    ]));
    const r = rangeFor('month', TODAY, hs.from); // 10-02..10-31
    const s = weightStats(hs, 'A', r);
    expect(s.n).toBe(2);
    expect(s.avg).toBe(68.5);
    // the trend carried in (70) to the trend after 69 (gap 49 days) and 68 (2 days)
    const t1 = 70 + (1 - 0.9 ** 49) * (69 - 70);
    const t2 = t1 + (1 - 0.9 ** 2) * (68 - t1);
    expect(s.trend).toBeCloseTo(t2, 1);
    expect(s.change).toBeCloseTo(Math.round((t2 - 70) * 10) / 10, 5);
    expect(s.perWeek).not.toBeNull();
    // weight alone isn't a missing activity day
    expect(hs.activityFrom).toBe(TODAY);
    expect(metricStats(hs, 'A', 'steps', r).missing).toBe(0);
    const b = weightBuckets(hs, 'A', r);
    expect(b[0]).toMatchObject({ kg: null, n: 0, trend: 70 });
    expect(b.find((x) => x.kg === 69)).toBeTruthy();
    // a period with no weigh-in says nothing, even with a trend carried through it
    const empty = weightStats(hs, 'A', rangeFor('week', '2026-09-20', hs.from));
    expect(empty).toMatchObject({ n: 0, change: null, trend: null });
    expect(weightStats(hs, 'B', r).n).toBe(0);
  });

  it('is memoised per State and day', () => {
    const s = reduce(rows([...day('A', '2026-10-30', { steps: 9000 })]));
    expect(healthSeries(s, NOW)).toBe(healthSeries(s, NOW + 60_000));
    expect(healthSeries(s, NOW + 86_400_000)).not.toBe(healthSeries(s, NOW));
  });
});

describe('this week vs last week (the trainer card)', () => {
  // Saturday 10-31: this week is Mon 10-26 – Sun 11-01, five days finished; last week 10-19 – 10-25
  const metrics: MetricRow[] = [];
  for (let i = 0; i < 7; i++) metrics.push(...day('A', addDays('2026-10-19', i), { steps: 8000, ex: 60, kcal: 500, stand: 100 }));
  metrics.push(
    ...day('A', '2026-10-26', { steps: 10000, ex: 90, kcal: 700, stand: 130 }),
    ...day('A', '2026-10-27', { steps: 12000, ex: 30, kcal: 600, stand: 120 }),
    ...day('A', '2026-10-28', { steps: 5000 }), // the Watch on its charger: steps only
    // 10-29: nothing synced
    ...day('A', '2026-10-30', { steps: 11000, ex: 60, kcal: 650, stand: 125 }),
    ...day('A', TODAY, { steps: 900, ex: 1, kcal: 50, stand: 5 }, '11:00'), // running: out
    m('A', '2026-10-21', 'weight', 71, '08:00'),
    m('A', '2026-10-27', 'weight', 70, '08:00'),
    m('A', TODAY, 'weight', 69, '08:00') // a weigh-in is done once made: it counts
  );
  const w = weekCompare(series(rows(metrics)), 'A');

  it('calendar weeks Mon–Sun; this week so far = its finished days', () => {
    expect(w.cur).toEqual({ from: '2026-10-26', to: '2026-11-01' });
    expect(w.prev).toEqual({ from: '2026-10-19', to: '2026-10-25' });
    expect(w.elapsed).toBe(5);
  });

  it('averages over recorded finished days, goal days met, and the change in %', () => {
    const steps = w.metrics.steps;
    expect(steps.cur).toEqual({ avg: (10000 + 12000 + 5000 + 11000) / 4, days: 4, met: 3 });
    expect(steps.prev).toEqual({ avg: 8000, days: 7, met: 7 });
    expect(steps.change).toBeCloseTo(9500 / 8000 - 1);
    const ex = w.metrics.exercise; // the Watch-less day and the empty day are out
    expect(ex.cur).toEqual({ avg: 60, days: 3, met: 2 });
    expect(ex.change).toBe(0);
    expect(w.metrics.stand.cur.met).toBe(3);
    expect(w.metrics.move.prev.met).toBe(0); // 500 < ウェイ's 600
    expect(w.metrics.move.cur.met).toBe(3);
  });

  it('weight: the average weigh-in each week and the difference in kg', () => {
    expect(w.weight).toEqual({ cur: 69.5, prev: 71, diff: -1.5 });
  });

  it('a Monday: nothing finished yet this week, so no average and no change', () => {
    const mon = weekCompare(series(rows(metrics), Date.parse(jst('2026-11-02', '09:00'))), 'A');
    expect(mon.elapsed).toBe(0);
    expect(mon.metrics.steps.cur).toEqual({ avg: null, days: 0, met: 0 });
    expect(mon.metrics.steps.change).toBeNull();
    expect(mon.metrics.steps.prev.days).toBe(5); // last week is now 10-26 – 11-01
    expect(weekCompare(series(rows([])), 'B').metrics.move).toEqual({ cur: { avg: null, days: 0, met: 0 }, prev: { avg: null, days: 0, met: 0 }, change: null });
  });
});
