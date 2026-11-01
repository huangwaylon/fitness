import { describe, expect, it } from 'vitest';
import { compactRows } from './compact.ts';
import { reduce } from './state.ts';
import { buildWeekView } from './week.ts';
import { bellsLedger, dayDetail } from './history.ts';
import { mergeRows } from './snapshot.ts';
import { addDays, weekKeyOf } from '#lib/time/dates.ts';
import type { EventRow, MetricRow, SnapshotRows } from '#lib/contract/api.ts';
import { tallyTotals } from './tally.ts';
import { FIRST_DAY, jst, syntheticRows } from '../../../scripts/bench-rows.ts';

/** Everything the app shows, as one comparable value. */
function views(rows: SnapshotRows, now: number, rev: string | null = null) {
  const s = reduce(rows, rev);
  const today = new Date(now + 9 * 3600_000).toISOString().slice(0, 10);
  const wk = weekKeyOf(today);
  const weeks = [wk, addDays(wk, -7), addDays(wk, -14), addDays(wk, -35)];
  return JSON.stringify({
    a: buildWeekView(s, 'A', now), b: buildWeekView(s, 'B', now), ledger: bellsLedger(s, now),
    days: weeks.flatMap((w) => [0, 3, 6].map((i) => dayDetail(s, addDays(w, i), now))),
    lastSync: s.lastSync
  });
}

const atOf = (r: { 0: string }) => Date.parse(r[0]);
const until = (rows: SnapshotRows, t: number): SnapshotRows => ({
  metrics: rows.metrics.filter((r) => atOf(r) <= t), events: rows.events.filter((r) => atOf(r) <= t)
});

describe('compactRows', () => {
  const all = syntheticRows(120);
  const nowAt = (day: number, time: string) => Date.parse(jst(addDays(FIRST_DAY, day), time));

  it('drops most metric rows of locked weeks and leaves every view unchanged', () => {
    for (const now of [nowAt(60, '12:00'), nowAt(65, '19:45'), nowAt(72, '03:59'), nowAt(119, '23:00')]) {
      const rows = until(all, now);
      const small = compactRows(rows, now);
      expect(small.events).toBe(rows.events);
      expect(small.metrics.length).toBeLessThan(rows.metrics.length * 0.25);
      expect(views(small, now)).toBe(views(rows, now));
    }
  });

  it('stays exact when rows keep arriving after a compaction, and when compacted again', () => {
    const t1 = nowAt(50, '08:00');
    let cache = compactRows(until(all, t1), t1);
    for (const t of [nowAt(53, '20:00'), nowAt(58, '05:00'), nowAt(80, '12:00')]) {
      const fresh = until(all, t);
      cache = compactRows(mergeRows(cache, fresh), t);
      expect(views(cache, t)).toBe(views(fresh, t));
      expect(views(cache, t + 3 * 86400_000)).toBe(views(fresh, t + 3 * 86400_000));
    }
  });

  it('with a rev, locked weeks’ earnings are reused across States and stay exact as rows arrive and get compacted', () => {
    let cache = until(all, nowAt(40, '12:00'));
    for (const t of [nowAt(40, '12:00'), nowAt(41, '12:00'), nowAt(47, '20:00'), nowAt(50, '04:30'), nowAt(90, '09:00')]) {
      const fresh = until(all, t);
      cache = compactRows(mergeRows(cache, fresh), t);
      expect(views(cache, t, 'r1')).toBe(views(fresh, t));
      expect(views(fresh, t, 'r1')).toBe(views(fresh, t));
    }
  });

  it('keeps open weeks, unreadable rows and late syncs as they are; returns the same object when nothing drops', () => {
    const wk = '2026-11-02';
    const m = (at: string, date: string, v: number, metric: 'steps' | 'exercise_min' = 'steps'): MetricRow => [at, 'A', date, metric, v];
    const rows: SnapshotRows = {
      metrics: [
        m(jst(wk, '09:00'), wk, 100), m(jst(wk, '10:00'), wk, 200), m(jst(wk, '11:00'), wk, 300),
        m('garbage', wk, 1), m(jst(wk, '12:00'), 'not-a-date', 5),
        m(jst(addDays(wk, 20), '09:00'), wk, 400) // a late sync, after the lock
      ],
      events: []
    };
    const before = Date.parse(jst(addDays(wk, 9), '03:59'));
    expect(compactRows(rows, before)).toBe(rows);
    const after = compactRows(rows, Date.parse(jst(addDays(wk, 30), '00:00')));
    expect(after.metrics.map((r) => r[4])).toEqual([300, 1, 5, 400]);
    expect(views(after, Date.parse(jst(addDays(wk, 30), '00:00')))).toBe(views(rows, Date.parse(jst(addDays(wk, 30), '00:00'))));
  });

  it('a locked week keeps only the rows its lock and the latest read (not the one that answered Sunday 19:30)', () => {
    const wk = '2026-11-02';
    const sun = addDays(wk, 6);
    const m = (date: string, hm: string, v: number): MetricRow => [jst(date, hm), 'A', wk, 'steps', v];
    // 19:00 Sunday (the row read at 19:30), then a late sync on Monday, before the lock.
    const rows: SnapshotRows = { metrics: [m(wk, '22:00', 100), m(sun, '19:00', 200), m(addDays(wk, 7), '09:00', 300)], events: [] };
    const now = Date.parse(jst(addDays(wk, 30), '00:00'));
    expect(compactRows(rows, now).metrics.map((r) => r[4])).toEqual([300]);
    expect(views(compactRows(rows, now), now)).toBe(views(rows, now));
  });


  it('latest wins: keeps the latest row at the lock and the latest overall, even when they are lower than earlier rows', () => {
    const wk = '2026-11-02';
    const m = (date: string, hm: string, v: number): MetricRow => [jst(date, hm), 'A', wk, 'steps', v];
    const rows: SnapshotRows = {
      metrics: [
        m(wk, '20:00', 26072), // inflated (iPhone + Watch summed)
        m(addDays(wk, 7), '09:00', 13172), // corrected before the lock: the row the lock reads
        m(addDays(wk, 8), '09:00', 13300),
        m(addDays(wk, 20), '09:00', 13000) // a later, lower sync after the lock: the day's current value
      ],
      events: []
    };
    const now = Date.parse(jst(addDays(wk, 30), '00:00'));
    expect(compactRows(rows, now).metrics.map((r) => r[4])).toEqual([13300, 13000]);
    expect(views(compactRows(rows, now), now)).toBe(views(rows, now));
    expect(reduce(compactRows(rows, now)).metrics.A.get(wk)!.steps!.map((r) => r.v)).toEqual([13300, 13000]);
  });
});

describe('compactRows: the day tallies', () => {
  it('keeps only the latest tally of each person’s day (the server deleted the rest); the counts are unchanged', () => {
    const t = (at: string, person: 'A' | 'B', id: string, date: string, counts: Record<string, number>): EventRow =>
      [at, person, id, 'tally', JSON.stringify({ date, counts })];
    const rows: SnapshotRows = {
      metrics: [],
      events: [
        t('2026-11-01T01:00:00.000Z', 'A', 'a1', '2026-11-01', { 'fish:dab': 1 }),
        t('2026-11-01T02:00:00.000Z', 'B', 'b1', '2026-11-01', { 'bug:moth': 2 }),
        ['2026-11-01T02:30:00.000Z', 'A', 'h1', 'highfive', '{}'],
        t('2026-11-01T03:00:00.000Z', 'A', 'a2', '2026-11-01', { 'fish:dab': 3 }),
        t('2026-11-02T01:00:00.000Z', 'A', 'a3', '2026-11-02', { 'fish:dab': 1 })
      ]
    };
    const now = Date.parse('2026-11-02T03:00:00.000Z');
    const small = compactRows(rows, now);
    expect(small.events.map((r) => r[2])).toEqual(['b1', 'h1', 'a2', 'a3']);
    expect(tallyTotals(reduce(small).tallies).all).toEqual(tallyTotals(reduce(rows).tallies).all);
    expect(Object.fromEntries(tallyTotals(reduce(small).tallies).all)).toEqual({ 'fish:dab': 4, 'bug:moth': 2 });
    expect(compactRows(small, now)).toBe(small);
  });
});
