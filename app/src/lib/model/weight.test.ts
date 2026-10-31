// the weight trend (daily value, EWMA, weekly pace, since start, goal projection), and weight never earns.
import { describe, expect, it } from 'vitest';
import type { EventRow, MetricRow, SnapshotRows } from '#lib/contract/api.ts';
import type { PersonId } from '#lib/types.ts';
import { addDays, weekDays } from '#lib/time/dates.ts';
import { reduce } from './state.ts';
import { buildWeekView } from './week.ts';
import { bellsLedger } from './bells.ts';
import { dayDetail } from './history.ts';
import { compactRows } from './compact.ts';
import { ewmaTrend, project, trendAt, weighIns, weightTrend } from './weight.ts';

const jst = (date: string, hm: string) => new Date(`${date}T${hm}:00+09:00`).toISOString();
const ms = (date: string, hm: string) => Date.parse(jst(date, hm));
let n = 0;
const ev = (at: string, person: PersonId, type: EventRow[3], data: object): EventRow => [at, person, `w${++n}`, type, JSON.stringify(data)];
const kg = (at: string, person: PersonId, date: string, v: number): MetricRow => [at, person, date, 'weight', v];
const rowsOf = (add: Partial<SnapshotRows> = {}): SnapshotRows => ({
  metrics: add.metrics ?? [], events: add.events ?? []
});

describe('a day’s weight: the latest row, not the max', () => {
  const D = '2026-11-10';
  it('a later lower row wins over an earlier higher one; rows after T are not seen', () => {
    const s = reduce(rowsOf({ metrics: [kg(jst(D, '08:00'), 'A', D, 69.0), kg(jst(D, '09:00'), 'A', D, 68.4)] }));
    expect(weighIns(s, 'A', ms(D, '08:30'))).toEqual([{ date: D, kg: 69.0 }]);
    expect(weighIns(s, 'A', ms(D, '10:00'))).toEqual([{ date: D, kg: 68.4 }]);
    expect(weighIns(s, 'A', ms(D, '07:00'))).toEqual([]);
  });

  it('ignores implausible rows and future days; the partner’s data stays theirs', () => {
    const s = reduce(rowsOf({
      metrics: [kg(jst(D, '08:00'), 'A', D, 500), kg(jst(D, '08:00'), 'B', D, 55.2), kg(jst(D, '08:00'), 'B', addDays(D, 1), 55)]
    }));
    expect(weighIns(s, 'A', ms(D, '23:00'))).toEqual([]);
    expect(weighIns(s, 'B', ms(D, '23:00'))).toEqual([{ date: D, kg: 55.2 }]);
  });

  it('an old `metric_set` weight row in the sheet is ignored (weight comes from Apple Health only)', () => {
    const s = reduce(rowsOf({
      metrics: [kg(jst(D, '08:00'), 'A', D, 68.4)],
      events: [ev(jst(D, '12:00'), 'A', 'metric_set' as EventRow[3], { date: D, metric: 'weight', value: 68.0 })]
    }));
    expect(weighIns(s, 'A', ms(D, '13:00'))).toEqual([{ date: D, kg: 68.4 }]);
  });
});

describe('the trend (gap-aware 10% EWMA)', () => {
  it('daily weigh-ins move the trend 10% of the way each day', () => {
    const t = ewmaTrend([{ date: '2026-11-01', kg: 70 }, { date: '2026-11-02', kg: 69 }, { date: '2026-11-03', kg: 69 }]);
    expect(t.map((p) => p.trend)).toEqual([70, 69.9, 69.81]);
  });

  it('a gap of g days weighs the next weigh-in 1 − 0.9^g', () => {
    const t = ewmaTrend([{ date: '2026-11-01', kg: 70 }, { date: '2026-11-08', kg: 68 }]);
    expect(t[1].trend).toBeCloseTo(70 - 2 * (1 - 0.9 ** 7), 2);
  });

  it('noise averages out: a noisy flat series keeps a flat trend', () => {
    const days = Array.from({ length: 60 }, (_, i) => ({ date: addDays('2026-09-01', i), kg: 70 + (i % 2 ? 0.6 : -0.6) }));
    const t = ewmaTrend(days);
    expect(Math.abs(t.at(-1)!.trend - 70)).toBeLessThan(0.1);
  });

  it('trendAt carries the last weigh-in forward', () => {
    const t = ewmaTrend([{ date: '2026-11-01', kg: 70 }, { date: '2026-11-05', kg: 69 }]);
    expect(trendAt(t, '2026-10-31')).toBeNull();
    expect(trendAt(t, '2026-11-03')).toBe(70);
  });
});

describe('weightTrend: week change, since start, pace, goal', () => {
  /** A steady loss of 0.5 kg a week from 72 kg, weighed every morning for `days` days from 2026-08-03. */
  function steady(days: number, person: PersonId = 'A'): SnapshotRows {
    const r = rowsOf();
    for (let i = 0; i < days; i++) {
      const d = addDays('2026-08-03', i);
      r.metrics.push(kg(jst(d, '08:00'), person, d, Math.round((72 - (0.5 * i) / 7) * 10) / 10));
    }
    return r;
  }
  const end = (days: number) => ms(addDays('2026-08-03', days - 1), '21:00');

  it('no weigh-ins: an empty trend', () => {
    const w = weightTrend(reduce(rowsOf()), 'A', ms('2026-11-01', '12:00'));
    expect(w).toMatchObject({ points: [], latest: null, weekChange: null, sinceStart: null, perWeek: null, projection: null });
  });

  it('the first week: no week change or pace yet', () => {
    const w = weightTrend(reduce(steady(5)), 'A', end(5));
    expect(w.latest?.kg).toBe(71.7);
    expect(w.weekChange).toBeNull();
    expect(w.perWeek).toBeNull();
    expect(w.sinceStart).toBeLessThan(0);
  });

  it('a steady loss shows as about −0.5 kg a week once the trend catches up', () => {
    const w = weightTrend(reduce(steady(84)), 'A', end(84));
    expect(w.points).toHaveLength(84);
    expect(w.perWeek!).toBeCloseTo(-0.5, 1);
    expect(w.weekChange!).toBeCloseTo(-0.5, 1);
    expect(w.sinceStart!).toBeLessThan(-4.5); // the trend lags the scale a little (72 → 66.1)
    expect(w.sinceStart!).toBeGreaterThan(-6);
  });

  it('a goal ahead gets a date at the current pace; behind is reached; the wrong way has none', () => {
    const rows = steady(84);
    const at = jst('2026-10-25', '22:00');
    const withGoal = (g: number | null) => weightTrend(reduce({ ...rows, events: [ev(at, 'A', 'pref', { key: 'goalWeight', value: g })] }), 'A', end(84));
    const w = withGoal(64);
    expect(w.goal).toBe(64);
    expect(w.projection?.kind).toBe('date');
    const date = (w.projection as { date: string }).date;
    // (64 − trend) / −0.5 a week, from the latest weigh-in
    const weeks = (64 - w.latest!.trend) / w.perWeek!;
    expect(date).toBe(addDays(w.latest!.date, Math.ceil(weeks * 7)));
    expect(withGoal(70).projection).toEqual({ kind: 'reached' });
    expect(withGoal(null).goal).toBeNull();
    // a gain goal while losing: no date
    expect(withGoal(80).projection).toEqual({ kind: 'none' });
  });

  it('project(): too slow or too far out has no date', () => {
    const p = { date: '2026-11-01', kg: 70, trend: 70 };
    expect(project(p, p, 60, -0.01)).toEqual({ kind: 'none' });
    expect(project(p, p, 60, null)).toEqual({ kind: 'none' });
    expect(project(p, p, 25, -0.2)).toEqual({ kind: 'none' }); // 225 weeks
    expect(project(p, p, 69, -0.5)).toEqual({ kind: 'date', date: '2026-11-15' });
  });

  it('goalWeight: per person; null clears it, an invalid value keeps the previous one', () => {
    const D = '2026-11-10';
    const s = reduce(rowsOf({ events: [
      ev(jst(D, '09:00'), 'A', 'pref', { key: 'goalWeight', value: 64.5 }),
      ev(jst(D, '09:01'), 'A', 'pref', { key: 'goalWeight', value: 999 }),
      ev(jst(D, '09:02'), 'B', 'pref', { key: 'goalWeight', value: 52 })
    ] }));
    expect([s.prefs.A.goalWeight, s.prefs.B.goalWeight]).toEqual([64.5, 52]);
    const t = reduce(rowsOf({ events: [ev(jst(D, '09:00'), 'A', 'pref', { key: 'goalWeight', value: 64.5 }), ev(jst(D, '09:05'), 'A', 'pref', { key: 'goalWeight', value: null })] }));
    expect(t.prefs.A.goalWeight).toBeUndefined();
  });
});

describe('weight never earns', () => {
  const WK = '2026-11-16';
  const D = weekDays(WK);
  /** A normal active week for both. */
  function week(): SnapshotRows {
    const r = rowsOf();
    for (const p of ['A', 'B'] as PersonId[]) {
      for (const d of D) {
        const at = jst(d, '22:00');
        r.metrics.push([at, p, d, 'steps', 9000], [at, p, d, 'exercise_min', 50]);
      }
    }
    return r;
  }
  function withWeights(r: SnapshotRows): SnapshotRows {
    const out = { ...r, metrics: [...r.metrics], events: [...r.events] };
    for (const p of ['A', 'B'] as PersonId[]) {
      D.forEach((d, i) => {
        out.metrics.push(kg(jst(d, '07:30'), p, d, 70 - i * 0.3), kg(jst(d, '20:00'), p, d, 71 - i * 0.2));
      });
      out.events.push(ev(jst(D[0], '06:00'), p, 'pref', { key: 'goalWeight', value: 60 }));
    }
    return out;
  }

  it('weight rows and goals change no view: today, the week, the wallet, the harvest, きろく, the ledger', () => {
    const base = week();
    const heavy = withWeights(base);
    for (const now of [ms(D[2], '23:00'), ms(D[6], '19:31'), ms('2026-11-26', '12:00')]) {
      const a = reduce(base);
      const b = reduce(heavy);
      const all = (s: ReturnType<typeof reduce>) => JSON.stringify({
        A: buildWeekView(s, 'A', now), B: buildWeekView(s, 'B', now), ledger: bellsLedger(s, now),
        days: D.map((d) => dayDetail(s, d, now))
      });
      expect(all(b)).toBe(all(a));
      expect(weightTrend(b, 'A', now).points.length).toBeGreaterThan(0);
    }
  });
});

describe('compactRows keeps the latest weight row per day (not the largest)', () => {
  it('a locked week’s weight rows shrink to the newest one and the trend is unchanged', () => {
    const d = '2026-11-02';
    const rows: SnapshotRows = rowsOf({
      metrics: [
        kg(jst(d, '08:00'), 'A', d, 69.5), kg(jst(d, '09:00'), 'A', d, 68.4), // lower later: the latest must survive
        kg(jst(addDays(d, 1), '08:00'), 'A', addDays(d, 1), 68.2),
        [jst(d, '22:00'), 'A', d, 'steps', 9000]
      ]
    });
    const now = ms(addDays(d, 30), '00:00');
    const small = compactRows(rows, now);
    expect(small.metrics.filter((r) => r[3] === 'weight').map((r) => r[4])).toEqual([68.4, 68.2]);
    expect(weightTrend(reduce(small), 'A', now)).toEqual(weightTrend(reduce(rows), 'A', now));
  });
});
