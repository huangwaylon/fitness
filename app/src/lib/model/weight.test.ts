// body weight (a day's value, the plain change over a period, its weekly pace, the goal month), and weight never earns.
import { describe, expect, it } from 'vitest';
import type { EventRow, MetricRow, SnapshotRows } from '#lib/contract/api.ts';
import type { PersonId } from '#lib/types.ts';
import { addDays, weekDays } from '#lib/time/dates.ts';
import { reduce } from './state.ts';
import { buildWeekView } from './week.ts';
import { bellsLedger } from './bells.ts';
import { dayDetail } from './history.ts';
import { compactRows } from './compact.ts';
import { plainChange, project, weighIns, type PlainChange } from './weight.ts';

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

describe('plainChange: the first week’s average → the last week’s, else the first weigh-in → the last', () => {
  const D0 = '2026-08-03';
  /** One weigh-in on each of these days after D0. */
  const at = (pairs: [number, number][]) => pairs.map(([d, kg]) => ({ date: addDays(D0, d), kg }));

  it('under two weigh-ins: nothing to compare', () => {
    expect(plainChange([])).toBeNull();
    expect(plainChange(at([[0, 70]]))).toBeNull();
  });

  it('under two weeks apart: first → last; a weekly pace only from 7 days apart', () => {
    expect(plainChange(at([[0, 70], [3, 70.4], [5, 69]]))).toEqual({ basis: 'ends', from: 70, to: 69, at: addDays(D0, 5), change: -1, perWeek: null });
    expect(plainChange(at([[0, 70], [10, 69]]))).toMatchObject({ basis: 'ends', change: -1, perWeek: -0.7 });
    // 12 days apart: the two weeks would overlap
    expect(plainChange(at([[0, 70], [12, 69]]))?.basis).toBe('ends');
  });

  it('from 13 days apart: the two weeks’ averages, over the days between their middles', () => {
    // days 0..6 vs 7..13, each week averaging its own weigh-ins
    const c = plainChange(at([[0, 70], [2, 71], [7, 69], [13, 68]]))!;
    expect(c).toEqual({ basis: 'weeks', from: 70.5, to: 68.5, at: addDays(D0, 10), change: -2, perWeek: -1.56 }); // −2 over 9 days
  });

  it('a steady loss of 0.5 kg a week reads as −0.5 a week; a noisy flat stretch reads as flat', () => {
    const steady = at(Array.from({ length: 84 }, (_, i) => [i, 72 - (0.5 * i) / 7] as [number, number]));
    const c = plainChange(steady)!;
    expect(c.basis).toBe('weeks');
    expect(c.perWeek!).toBeCloseTo(-0.5, 2);
    expect(c.change).toBeCloseTo(-5.5, 1); // 77 days between the weeks' middles
    const noisy = at(Array.from({ length: 28 }, (_, i) => [i, 70 + (i % 2 ? 0.6 : -0.6)] as [number, number]));
    // a ±0.6 kg daily swing: 0.2 at most (its first and last weigh-ins alone would say +1.2)
    expect(Math.abs(plainChange(noisy)!.change)).toBeLessThanOrEqual(0.2);
  });

  it('sparse weigh-ins: a week of one is that weigh-in', () => {
    expect(plainChange(at([[0, 70], [30, 69], [60, 67]]))).toMatchObject({ basis: 'weeks', from: 70, to: 67, change: -3, perWeek: -0.35 });
  });
});

describe('project(): the goal month at the period’s pace', () => {
  const c = (o: Partial<PlainChange>): PlainChange => ({ basis: 'weeks', from: 71, to: 70, at: '2026-11-01', change: -1, perWeek: -0.5, ...o });

  it('a goal ahead: a date from the last week at that pace', () => {
    expect(project(c({}), 69)).toEqual({ kind: 'date', date: '2026-11-15' });
    expect(project(c({ from: 60, to: 61, change: 1, perWeek: 0.5 }), 62)).toEqual({ kind: 'date', date: '2026-11-15' });
  });

  it('at or past the goal (seen from the start) is reached', () => {
    expect(project(c({}), 70)).toEqual({ kind: 'reached' });
    expect(project(c({ to: 69.5 }), 70)).toEqual({ kind: 'reached' });
  });

  it('none: moving away, too slow, too far out, or first → last only', () => {
    expect(project(c({}), 75)).toEqual({ kind: 'none' });
    expect(project(c({ perWeek: -0.01 }), 60)).toEqual({ kind: 'none' });
    expect(project(c({ perWeek: null }), 60)).toEqual({ kind: 'none' });
    expect(project(c({ perWeek: -0.2 }), 25)).toEqual({ kind: 'none' }); // 225 weeks
    expect(project(c({ basis: 'ends' }), 69)).toEqual({ kind: 'none' });
  });
});

describe('goalWeight', () => {
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
      expect(weighIns(b, 'A', now).length).toBeGreaterThan(0);
    }
  });
});

describe('compactRows keeps the latest weight row per day (not the largest)', () => {
  it('a locked week’s weight rows shrink to the newest one and the weigh-ins are unchanged', () => {
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
    expect(weighIns(reduce(small), 'A', now)).toEqual(weighIns(reduce(rows), 'A', now));
  });
});
