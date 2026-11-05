// けんこう's numbers (model/health.ts): Apple Health's values as is (nothing cut off), only a missing row is no record, today
// left out of the stats, weekly and monthly buckets, the change against the previous period, goal-met counts, the
// ranges and their navigation, and the edge cases (no data, one person only, sparse weight).
import { describe, expect, it } from 'vitest';
import type { EventRow, MetricRow, SnapshotRows } from '#lib/contract/api.ts';
import type { PersonId } from '#lib/types.ts';
import { addDays } from '#lib/time/dates.ts';
import { reduce } from './state.ts';
import {
  bucketValues, CARDS, canShift, dotSeries, dotStats, GROUPS, healthSeries, metricStats, previousRange, rangeFor, shiftAnchor
} from './health.ts';
import { weekBells } from './bells.ts';
import { weekKeyOf } from '#lib/time/dates.ts';

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

describe('as reported, and days with no record', () => {
  // 10-25..10-30 finished, 10-31 today
  const r = rows([
    ...day('A', '2026-10-25', { steps: 9000, ex: 70, kcal: 650, stand: 130 }),
    ...day('A', '2026-10-26', { steps: 66, ex: 0, kcal: 0, stand: 0 }), // barely moved: every value is real
    m('A', '2026-10-27', 'steps', 5000), // steps only: no Move, Exercise or Stand row that day
    ...day('A', '2026-10-28', { steps: 7000, ex: 0, kcal: 200, stand: 90 }),
    // 10-29: no row at all
    ...day('A', '2026-10-30', { steps: 11000, ex: 50, kcal: 700, stand: 125 }),
    ...day('A', TODAY, { steps: 1000, ex: 5, kcal: 80, stand: 10 }, '11:00') // running
  ]);
  const hs = series(r);
  const week = rangeFor('week', TODAY);

  it('a day’s values are Apple Health’s as is (66 steps, 0 kcal); only a missing row is no record, metric by metric', () => {
    expect(hs.from).toBe('2026-10-25');
    expect(hs.people.A.values.steps.slice(0, 5)).toEqual([9000, 66, 5000, 7000, null]);
    expect(hs.people.A.values.move.slice(0, 5)).toEqual([650, 0, null, 200, null]);
    expect(hs.people.A.values.exercise[1]).toBe(0);
    expect(hs.people.A.values.stand[2]).toBeNull();
  });

  it('averages count every finished day with a row (today out) and say how many have none', () => {
    const steps = metricStats(hs, 'A', 'steps', week);
    // 10-25..10-30: 9000, 66, 5000, 7000, –, 11000 → 5 days; 10-24 is before the first record (not missing)
    expect(steps.days).toBe(5);
    expect(steps.avg).toBe(32066 / 5);
    expect(steps.missing).toBe(1);
    expect(steps.met).toBe(2); // 9000, 11000
    expect(steps.best).toEqual({ date: '2026-10-30', v: 11000 });
    const ex = metricStats(hs, 'A', 'exercise', week);
    // 70, 0, –, 0, –, 50 → 120 / 4
    expect(ex).toMatchObject({ days: 4, avg: 30, met: 1, missing: 2 });
    const stand = metricStats(hs, 'A', 'stand', week);
    expect(stand.met).toBe(2); // 130, 125
  });

  it('the Move goal is the one in force each day', () => {
    const r2 = rows([
      ...day('B', '2026-10-28', { steps: 1, kcal: 420, ex: 1, stand: 1 }),
      ...day('B', '2026-10-30', { steps: 1, kcal: 420, ex: 1, stand: 1 })
    ], [[jst('2026-10-29', '08:00'), 'B', 'g1', 'pref', JSON.stringify({ key: 'moveGoal', value: 450 })]]);
    const h = series(r2);
    const s = metricStats(h, 'B', 'move', rangeFor('week', TODAY));
    expect(s.met).toBe(1); // 420 ≥ 400 on 10-28; 420 < 450 on 10-30
  });

  it('day bars: the 66-step day is its bar, today shows its running value, flagged; a missing day has no bar', () => {
    const b = bucketValues(hs, 'A', 'steps', week);
    expect(b.map((x) => x.v)).toEqual([9000, 66, 5000, 7000, null, 11000, 1000]);
    expect(b.at(-1)!.today).toBe(true);
    expect(b[0].goal).toBe(8000);
  });
});

describe('periods, buckets and the previous period', () => {
  // A: 10,000 steps a day for 120 days to yesterday, 6,000 a day for the 30 before that
  const start = addDays(TODAY, -150);
  const metrics: MetricRow[] = [];
  for (let d = start, i = 0; d < TODAY; d = addDays(d, 1), i++) metrics.push(...day('A', d, { steps: i < 30 ? 6000 : 10000, ex: 1, kcal: 1, stand: 1 }));
  const hs = series(rows(metrics));

  it('1週 and 1か月 go by day, 3か月 by week (13, ending on the anchor), 1年 by calendar month', () => {
    expect(rangeFor('week', TODAY)).toMatchObject({ from: '2026-10-25', to: TODAY, unit: 'day' });
    expect(rangeFor('month', TODAY).buckets).toHaveLength(30);
    const q = rangeFor('quarter', TODAY);
    expect(q.unit).toBe('week');
    expect(q.buckets).toHaveLength(13);
    expect(q.buckets.at(-1)).toEqual({ from: '2026-10-25', to: TODAY });
    const y = rangeFor('year', TODAY);
    expect(y.buckets).toHaveLength(12);
    expect(y.buckets[0]).toEqual({ from: '2025-11-01', to: '2025-11-30' });
    expect(y.buckets.at(-1)).toEqual({ from: '2026-10-01', to: TODAY });
    expect(rangeFor('year', '2026-03-15').buckets[1]).toEqual({ from: '2025-05-01', to: '2025-05-31' });
  });

  it('a week bucket averages its recorded days; the bucket holding today leaves today out', () => {
    const q = rangeFor('quarter', TODAY);
    const b = bucketValues(hs, 'A', 'steps', q);
    expect(b.at(-1)).toMatchObject({ v: 10000, days: 6, met: 6, today: false });
    const y = bucketValues(hs, 'A', 'steps', rangeFor('year', TODAY));
    expect(y[0]).toMatchObject({ v: null, days: 0 }); // before any data
    expect(y.at(-1)).toMatchObject({ v: 10000, days: 30 });
  });

  it('the change against the previous period of equal length', () => {
    const r = rangeFor('month', addDays(TODAY, -90)); // the 30 days ending 90 days ago …
    const prev = previousRange(r);
    expect(prev.to).toBe(addDays(r.from, -1));
    expect(daysIn(prev)).toBe(30);
    // the first 30 days were 6,000, the next 30 days 10,000
    const r2 = rangeFor('month', addDays(start, 59));
    expect(metricStats(hs, 'A', 'steps', r2).change).toBeCloseTo(10000 / 6000 - 1);
    // no previous data: no change
    expect(metricStats(hs, 'A', 'steps', rangeFor('month', addDays(start, 29))).change).toBeNull();
  });

  it('‹ › step a whole period, never past today; ‹ only while there is older data', () => {
    expect(shiftAnchor('week', TODAY, -1, TODAY)).toBe('2026-10-24');
    expect(shiftAnchor('month', '2026-10-01', 1, TODAY)).toBe(TODAY);
    expect(shiftAnchor('year', TODAY, -1, TODAY)).toBe('2025-10-31');
    expect(shiftAnchor('year', '2026-02-14', -1, TODAY)).toBe('2025-02-28');
    expect(canShift(rangeFor('month', TODAY), hs.from, TODAY)).toEqual({ back: true, on: false });
    expect(canShift(rangeFor('year', TODAY), hs.from, TODAY)).toEqual({ back: false, on: false });
    expect(canShift(rangeFor('week', '2026-10-01'), hs.from, TODAY)).toEqual({ back: true, on: true });
  });
});

const daysIn = (r: { from: string; to: string }) => (Date.parse(r.to) - Date.parse(r.from)) / 86400000 + 1;

describe('edge cases', () => {
  it('no data at all: nothing recorded, no averages, no ‹', () => {
    const hs = series(rows([]));
    expect(hs.any).toBe(false);
    expect(hs.from).toBe(TODAY);
    const r = rangeFor('month', TODAY);
    expect(metricStats(hs, 'A', 'steps', r)).toEqual({ avg: null, days: 0, missing: 0, met: 0, best: null, change: null });
    expect(bucketValues(hs, 'B', 'move', r).every((b) => b.v === null)).toBe(true);
    expect(canShift(r, hs.from, TODAY).back).toBe(false);
    expect(dotStats(hs, 'A', 'weight', r)).toEqual({ n: 0, avg: null, change: null, projection: null });
  });

  it('one person only: the other has no record anywhere', () => {
    const hs = series(rows([...day('A', '2026-10-30', { steps: 9000, ex: 10, kcal: 100, stand: 10 })]));
    const r = rangeFor('week', TODAY);
    expect(metricStats(hs, 'A', 'steps', r).days).toBe(1);
    expect(metricStats(hs, 'B', 'steps', r)).toMatchObject({ avg: null, days: 0, missing: 1 });
  });

  it('sparse weight: buckets average their weigh-ins; the change is plain, first weigh-in to last, inside the period', () => {
    const hs = series(rows([
      m('A', '2026-09-01', 'weight', 70, '08:00'),
      m('A', '2026-10-20', 'weight', 69, '08:00'),
      m('A', '2026-10-22', 'weight', 68, '08:00')
    ]));
    const r = rangeFor('month', TODAY); // 10-02..10-31
    const s = dotStats(hs, 'A', 'weight', r);
    expect(s.n).toBe(2);
    expect(s.avg).toBe(68.5);
    // 09-01 is outside the period and doesn't count; two days apart: no weekly pace
    expect(s.change).toMatchObject({ basis: 'ends', from: 69, to: 68, change: -1, perWeek: null });
    expect(s.projection).toBeNull(); // no goal
    // weight alone isn't a missing activity day
    expect(hs.activityFrom).toBe(TODAY);
    expect(metricStats(hs, 'A', 'steps', r).missing).toBe(0);
    const b = dotSeries(hs, 'A', 'weight', r);
    expect(b[0]).toEqual({ v: null, n: 0 });
    expect(b.find((x) => x.v === 69)).toBeTruthy();
    // a period with no weigh-in says nothing; one weigh-in has no change
    expect(dotStats(hs, 'A', 'weight', rangeFor('week', '2026-09-20'))).toEqual({ n: 0, avg: null, change: null, projection: null });
    expect(dotStats(hs, 'A', 'weight', rangeFor('week', '2026-09-03'))).toMatchObject({ n: 1, avg: 70, change: null });
    expect(dotStats(hs, 'B', 'weight', r).n).toBe(0);
  });

  it('weight over a month: the first week’s average → the last week’s, per week, and the goal month at that pace', () => {
    // 10-02..10-31: 72.0 then 0.1 kg lower every day
    const metrics = Array.from({ length: 30 }, (_, i) => m('A', addDays('2026-10-02', i), 'weight', Math.round((72 - 0.1 * i) * 10) / 10, '08:00'));
    const goal = (g: number) => [[jst('2026-10-01', '08:00'), 'A', `g${g}`, 'pref', JSON.stringify({ key: 'goalWeight', value: g })] as EventRow];
    const hs = series(rows(metrics, goal(66)));
    const s = dotStats(hs, 'A', 'weight', rangeFor('month', TODAY));
    // 10-02..10-08 average 71.7 (mean day 10-05); 10-25..10-31 average 69.4 (mean day 10-28): 23 days apart
    expect(s.change).toMatchObject({ basis: 'weeks', from: 71.7, to: 69.4, at: '2026-10-28', change: -2.3, perWeek: -0.7 });
    // (66 − 69.4) / −0.7 = 4.86 weeks → 35 days after 10-28
    expect(s.projection).toEqual({ kind: 'date', date: '2026-12-02' });
    // the 1週 period: first weigh-in → last, too short for a pace or a date
    const w = dotStats(hs, 'A', 'weight', rangeFor('week', TODAY));
    expect(w.change).toMatchObject({ basis: 'ends', from: 69.7, to: 69.1, change: -0.6, perWeek: null });
    expect(w.projection).toEqual({ kind: 'none' });
    // moving away from the goal: none; already past it: reached
    expect(dotStats(series(rows(metrics, goal(75))), 'A', 'weight', rangeFor('month', TODAY)).projection).toEqual({ kind: 'none' });
    expect(dotStats(series(rows(metrics, goal(70))), 'A', 'weight', rangeFor('month', TODAY)).projection).toEqual({ kind: 'reached' });
  });

  it('is memoised per State and day', () => {
    const s = reduce(rows([...day('A', '2026-10-30', { steps: 9000 })]));
    expect(healthSeries(s, NOW)).toBe(healthSeries(s, NOW + 60_000));
    expect(healthSeries(s, NOW + 86_400_000)).not.toBe(healthSeries(s, NOW));
  });
});

describe('nothing cut off', () => {
  const week = () => rangeFor('week', TODAY);

  it('today, still running, is drawn as reported (even 0) and never counted', () => {
    const hs = series(rows([...day('A', TODAY, { steps: 120, kcal: 40, ex: 0, stand: 3 }, '09:00')]));
    expect(bucketValues(hs, 'A', 'move', week()).at(-1)!).toMatchObject({ v: 40, today: true });
    expect(bucketValues(hs, 'A', 'steps', week()).at(-1)!.v).toBe(120);
    expect(bucketValues(hs, 'A', 'exercise', week()).at(-1)!.v).toBe(0);
    expect(metricStats(hs, 'A', 'move', week())).toMatchObject({ avg: null, days: 0 });
  });

  it('real week (Mon 10/26–Fri 10/30): 66 steps and 0 kcal days are plotted and counted', () => {
    const steps = [66, 7000, 4963, 12268, 3404], kcalA = [0, 0, 0, 527, 615], standA = [0, 0, 0, 80, 95];
    const kcalB = [89, 3, 0, 26, 141], standB = [22, 0, 0, 4, 36];
    const hs = series(rows(steps.flatMap((st, i) => [
      ...day('A', addDays('2026-10-26', i), { steps: st, kcal: kcalA[i], ex: 0, stand: standA[i] }),
      ...day('B', addDays('2026-10-26', i), { steps: 6000, kcal: kcalB[i], ex: 0, stand: standB[i] })
    ])));
    const r = week();
    expect(metricStats(hs, 'A', 'steps', r)).toMatchObject({ avg: (66 + 7000 + 4963 + 12268 + 3404) / 5, days: 5, missing: 0, best: { date: '2026-10-29', v: 12268 } });
    expect(metricStats(hs, 'A', 'move', r)).toMatchObject({ avg: (527 + 615) / 5, days: 5, missing: 0, met: 1 });
    expect(metricStats(hs, 'B', 'move', r)).toMatchObject({ avg: (89 + 3 + 26 + 141) / 5, days: 5, missing: 0, met: 0 });
    expect(metricStats(hs, 'B', 'stand', r)).toMatchObject({ avg: (22 + 4 + 36) / 5, days: 5 });
    expect(bucketValues(hs, 'A', 'steps', r).slice(1, 6).map((b) => b.v)).toEqual([66, 7000, 4963, 12268, 3404]);
    expect(bucketValues(hs, 'B', 'move', r).slice(1, 6).map((b) => b.v)).toEqual([89, 3, 0, 26, 141]);
  });

  it('1か月 on the real shape: the low days (168, 140, 100, 66 steps) are in the average, the best and the goal days', () => {
    const low: Record<string, number> = { '2026-10-09': 168, '2026-10-14': 140, '2026-10-15': 100, '2026-10-26': 66 };
    const metrics: MetricRow[] = [];
    for (let d = '2026-10-03'; d <= '2026-10-31'; d = addDays(d, 1)) metrics.push(m('A', d, 'steps', low[d] ?? 9000));
    const now = Date.parse(jst('2026-11-01', '12:00'));
    const hs = series(rows(metrics), now);
    const s = metricStats(hs, 'A', 'steps', rangeFor('month', '2026-11-01')); // 10-03..10-31 finished
    expect(s).toMatchObject({ days: 29, missing: 0, met: 25, avg: (25 * 9000 + 168 + 140 + 100 + 66) / 29 });
  });
});

describe('one person at a time', () => {
  it('each person’s bars, goals (their own Move goal history) and stats are theirs alone', () => {
    const metrics: MetricRow[] = [];
    for (let i = 0; i < 7; i++) {
      metrics.push(...day('A', addDays('2026-10-24', i), { steps: 10000, ex: 70, kcal: 700, stand: 130 }));
      metrics.push(...day('B', addDays('2026-10-24', i), { steps: 4000, ex: 20, kcal: 300, stand: 60 }));
    }
    const hs = series(rows(metrics, [[jst('2026-10-28', '08:00'), 'B', 'g1', 'pref', JSON.stringify({ key: 'moveGoal', value: 250 })]]));
    const r = rangeFor('week', TODAY);
    const a = bucketValues(hs, 'A', 'move', r), b = bucketValues(hs, 'B', 'move', r);
    expect(a.slice(0, 6).map((x) => x.v)).toEqual([700, 700, 700, 700, 700, 700]);
    expect(b.slice(0, 6).map((x) => x.v)).toEqual([300, 300, 300, 300, 300, 300]);
    expect(a.map((x) => x.goal).every((g) => g === a[0].goal)).toBe(true);
    expect(b.map((x) => x.goal)).toEqual([400, 400, 400, 250, 250, 250, 250]); // 250 from 10-28;
    expect(metricStats(hs, 'B', 'move', r)).toMatchObject({ avg: 300, met: 3, days: 6 });
    expect(metricStats(hs, 'A', 'steps', r)).toMatchObject({ avg: 10000, met: 6 });
  });

  it('the steps goal line and goal days follow each day’s steps goal (8,000 until set)', () => {
    const metrics: MetricRow[] = [];
    for (let i = 0; i < 7; i++) metrics.push(...day('A', addDays('2026-10-24', i), { steps: 10000, ex: 70, kcal: 700, stand: 130 }));
    const hs = series(rows(metrics, [[jst('2026-10-27', '21:00'), 'B', 'g1', 'pref', JSON.stringify({ person: 'A', key: 'stepsGoal', value: 12000 })]]));
    const r = rangeFor('week', TODAY);
    expect(bucketValues(hs, 'A', 'steps', r).map((x) => x.goal)).toEqual([8000, 8000, 12000, 12000, 12000, 12000, 12000]); // 12,000 from 10-27 on
    expect(bucketValues(hs, 'B', 'steps', r).map((x) => x.goal)).toEqual(Array(7).fill(8000));
    expect(metricStats(hs, 'A', 'steps', r)).toMatchObject({ avg: 10000, met: 2, days: 6 }); // 10-25 and 10-26 (today isn't counted)
  });
});

describe('the body metrics (body fat %, BMI, lean body mass)', () => {
  it('けんこう’s groups: かつどう (steps, then the rings), からだ (weight first, then the body metrics)', () => {
    expect(GROUPS).toEqual(['activity', 'body']);
    expect(CARDS).toEqual({ activity: ['steps', 'move', 'exercise', 'stand'], body: ['weight', 'body_fat_pct', 'bmi', 'lean_kg'] });
  });

  it('a day’s value is its latest row, one decimal; out of bounds is ignored; sparse like weight, per person', () => {
    const hs = series(rows([
      m('A', '2026-10-20', 'body_fat_pct', 23.1, '08:00'),
      m('A', '2026-10-20', 'body_fat_pct', 22.84, '09:00'), // a re-sync: the latest wins
      m('A', '2026-10-22', 'body_fat_pct', 71, '08:00'), // above 70 %: not a body fat
      m('A', '2026-10-22', 'bmi', 23.0, '08:00'),
      m('B', '2026-10-24', 'lean_kg', 41.2, '08:00'),
      m('B', '2026-10-25', 'lean_kg', 9, '08:00') // below 10 kg
    ]));
    expect(hs.from).toBe('2026-10-20'); // body rows start the series like weight
    expect(hs.activityFrom).toBe(TODAY); // and aren't activity days
    expect(hs.people.A.dots.body_fat_pct.slice(0, 3)).toEqual([22.8, null, null]);
    expect(hs.people.A.dots.bmi[2]).toBe(23);
    expect(hs.people.B.dots.lean_kg.slice(4, 6)).toEqual([41.2, null]);
    expect(hs.people.A.dots.lean_kg.every((v) => v === null)).toBe(true);
    const r = rangeFor('month', TODAY);
    expect(dotStats(hs, 'B', 'lean_kg', r)).toEqual({ n: 1, avg: 41.2, change: null, projection: null });
    expect(dotStats(hs, 'B', 'bmi', r)).toEqual({ n: 0, avg: null, change: null, projection: null });
  });

  it('the period’s average and plain change (first week → last week), weekly buckets average their measurements', () => {
    // 10-02..10-31: 25.0 % then 0.05 lower every day
    const metrics = Array.from({ length: 30 }, (_, i) => m('A', addDays('2026-10-02', i), 'body_fat_pct', Math.round((25 - 0.05 * i) * 10) / 10, '08:00'));
    const hs = series(rows(metrics));
    const s = dotStats(hs, 'A', 'body_fat_pct', rangeFor('month', TODAY));
    expect(s.n).toBe(30);
    expect(s.change).toMatchObject({ basis: 'weeks', change: -1.1, perWeek: -0.35 });
    const w = dotStats(hs, 'A', 'body_fat_pct', rangeFor('week', TODAY));
    expect(w.change).toMatchObject({ basis: 'ends' });
    const q = dotSeries(hs, 'A', 'body_fat_pct', rangeFor('quarter', TODAY));
    expect(q.at(-1)).toEqual({ v: 23.7, n: 7 }); // 10-25..10-31
    expect(q[0]).toEqual({ v: null, n: 0 });
  });

  it('each body metric has its own goal (per person, shown only): the month at the pace, the goal’s way', () => {
    const metrics = Array.from({ length: 30 }, (_, i) => m('A', addDays('2026-10-02', i), 'body_fat_pct', Math.round((25 - 0.05 * i) * 10) / 10, '08:00'));
    const goal = (key: string, g: number | null, who: 'A' | 'B' = 'A') => [jst('2026-10-01', '08:00'), who, `${key}${g}${who}`, 'pref', JSON.stringify({ key, value: g })] as EventRow;
    const hs = series(rows(metrics, [goal('goalBodyFat', 22), goal('goalBodyFat', 30, 'B')]));
    expect([hs.people.A.bodyGoals.body_fat_pct, hs.people.B.bodyGoals.body_fat_pct]).toEqual([22, 30]);
    expect(hs.people.A.bodyGoals).toEqual({ weight: null, body_fat_pct: 22, bmi: null, lean_kg: null });
    // the last week's average 23.7 at about −0.35 a week: 5 weeks on (35 days after 10-28)
    expect(dotStats(hs, 'A', 'body_fat_pct', rangeFor('month', TODAY)).projection).toEqual({ kind: 'date', date: '2026-12-02' });
    expect(dotStats(hs, 'A', 'bmi', rangeFor('month', TODAY)).projection).toBeNull();
    // past it: reached; no goal (or one cleared): none
    expect(dotStats(series(rows(metrics, [goal('goalBodyFat', 24)])), 'A', 'body_fat_pct', rangeFor('month', TODAY)).projection).toEqual({ kind: 'reached' });
    const cleared = series(rows(metrics, [goal('goalBodyFat', 22), [jst('2026-10-02', '08:00'), 'A', 'gx', 'pref', JSON.stringify({ key: 'goalBodyFat', value: null })] as EventRow]));
    expect(cleared.people.A.bodyGoals.body_fat_pct).toBeNull();
    expect(dotStats(cleared, 'A', 'body_fat_pct', rangeFor('month', TODAY)).projection).toBeNull();
    // under a ceiling is reached, whichever side the period started on (body fat at most: 23.7 under 25)
    expect(dotStats(series(rows(metrics, [goal('goalBodyFat', 25)])), 'A', 'body_fat_pct', rangeFor('month', TODAY)).projection).toEqual({ kind: 'reached' });
    // a floor (lean mass at least) heading away from it: no date; BMI and lean mass now have goals too
    const lean = Array.from({ length: 30 }, (_, i) => m('A', addDays('2026-10-02', i), 'lean_kg', Math.round((55 - 0.05 * i) * 10) / 10, '08:00'));
    const hl = series(rows(lean, [goal('goalLean', 56), goal('goalBmi', 22)]));
    expect([hl.people.A.bodyGoals.lean_kg, hl.people.A.bodyGoals.bmi]).toEqual([56, 22]);
    expect(dotStats(hl, 'A', 'lean_kg', rangeFor('month', TODAY)).projection).toEqual({ kind: 'none' });
    expect(dotStats(series(rows(lean, [goal('goalLean', 50)])), 'A', 'lean_kg', rangeFor('month', TODAY)).projection).toEqual({ kind: 'reached' });
    // the weight goal is another key
    expect(series(rows(metrics, [goal('goalWeight', 60)])).people.A.bodyGoals.body_fat_pct).toBeNull();
  });

  it('never moves a ベル', () => {
    const base = [...day('A', '2026-10-26', { steps: 9000, ex: 70, kcal: 650, stand: 130 })];
    const body = [m('A', '2026-10-26', 'body_fat_pct', 22, '08:00'), m('A', '2026-10-26', 'bmi', 23, '08:00'), m('A', '2026-10-26', 'lean_kg', 55, '08:00')];
    const wk = weekKeyOf('2026-10-26');
    expect(weekBells(reduce(rows([...base, ...body])), wk, NOW)).toEqual(weekBells(reduce(rows(base)), wk, NOW));
  });
});
