// body weight (a day's value) and weight never earns.
import { describe, expect, it } from 'vitest';
import type { EventRow, MetricRow, SnapshotRows } from '#lib/contract/api.ts';
import type { PersonId } from '#lib/types.ts';
import { addDays, weekDays } from '#lib/time/dates.ts';
import { reduce } from './state.ts';
import { buildWeekView } from './week.ts';
import { bellsLedger } from './bells.ts';
import { dayDetail } from './history.ts';
import { compactRows } from './compact.ts';
import { weighIns } from './weight.ts';

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
