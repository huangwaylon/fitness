import { describe, expect, it } from 'vitest';
import { compactRows } from './compact.ts';
import { foldEvents, latestIslandDay, reduce } from './state.ts';
import { buildWeekView } from './week.ts';
import { bellsLedger, dayDetail } from './history.ts';
import { mergeRows } from './snapshot.ts';
import { addDays, weekKeyOf } from '#lib/time/dates.ts';
import type { EventRow, MetricRow, SnapshotRows } from '#lib/contract/api.ts';
import { tallyTotals } from './tally.ts';
import { FIRST_DAY, foodRows, jst, syntheticRows, withEvents } from '../../../scripts/bench-rows.ts';
import { customs, foodDay, foodEntries, recipes, repeats } from './food.ts';

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
  it('keeps only the newest row of a locked day’s weight and body metrics (read as of now only)', () => {
    const r = (at: string, metric: MetricRow[3], v: number): MetricRow => [at, 'A', '2026-09-01', metric, v];
    const rows: SnapshotRows = {
      metrics: [
        r('2026-09-01T00:00:00.000Z', 'body_fat_pct', 22.5), r('2026-09-01T01:00:00.000Z', 'body_fat_pct', 22.3),
        r('2026-09-01T00:00:00.000Z', 'bmi', 23), r('2026-09-01T00:00:00.000Z', 'lean_kg', 54),
        r('2026-09-01T00:00:00.000Z', 'weight', 70.1), r('2026-09-01T01:00:00.000Z', 'weight', 70)
      ],
      events: []
    };
    expect(compactRows(rows, Date.parse('2026-10-31T00:00:00.000Z')).metrics.map((x) => [x[3], x[4]])).toEqual([
      ['body_fat_pct', 22.3], ['bmi', 23], ['lean_kg', 54], ['weight', 70]
    ]);
  });

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
        ['2026-11-01T02:30:00.000Z', 'A', 'h1', 'find', '{"kind":"fish","id":"dab"}'],
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

describe('compactRows: the island days', () => {
  it('keeps only the latest island day of each person (a tally of that day apart); the model reads the same', () => {
    const d = (at: string, person: 'A' | 'B', id: string, date: string, taken: string[]): EventRow =>
      [at, person, id, 'island', JSON.stringify({ date, taken, puts: [], shakes: [], watered: [], wishes: {} })];
    const rows: SnapshotRows = {
      metrics: [],
      events: [
        d('2026-11-01T01:00:00.000Z', 'A', 'a1', '2026-11-01', ['w1']),
        ['2026-11-01T01:30:00.000Z', 'A', 't1', 'tally', JSON.stringify({ date: '2026-11-01', counts: { 'fish:dab': 1 } })],
        d('2026-11-01T02:00:00.000Z', 'B', 'b1', '2026-11-01', ['s1']),
        d('2026-11-01T03:00:00.000Z', 'A', 'a2', '2026-11-01', ['w1', 'w2'])
      ]
    };
    const small = compactRows(rows, Date.parse('2026-11-01T04:00:00.000Z'));
    expect(small.events.map((r) => r[2])).toEqual(['t1', 'b1', 'a2']);
    const s = reduce(small);
    expect(latestIslandDay(s.islandDays, 'A', '2026-11-01')?.data.taken).toEqual(['w1', 'w2']);
    expect(latestIslandDay(reduce(rows).islandDays, 'A', '2026-11-01')?.data.taken).toEqual(['w1', 'w2']);
    expect(latestIslandDay(s.islandDays, 'B', '2026-11-02')).toBeNull();
    // a bad row is ignored
    expect(reduce({ metrics: [], events: [['2026-11-01T05:00:00.000Z', 'A', 'x', 'island', '{"date":"2026-11-01"}']] }).islandDays).toEqual([]);
  });
});

describe('compactRows: the meal log', () => {
  /** Everything ごはん shows: the recipes, the custom foods, each person's entries (the 最近 list), repeats, and a few days' totals. */
  const meals = (rows: SnapshotRows, days: string[]) => {
    const s = reduce(rows);
    return JSON.stringify([recipes(s), customs(s), ...(['A', 'B', 'G'] as const).map((w) => [foodEntries(s, w), repeats(s, w), days.map((d) => foodDay(s, w, d))])]);
  };
  const food = foodRows(60);
  const rows = withEvents(syntheticRows(60), food);
  const now = Date.parse(jst(addDays(FIRST_DAY, 59), '23:00'));
  const days = [0, 1, 17, 30, 58, 59].map((d) => addDays(FIRST_DAY, d));

  it('keeps only the op the record keeps per entry (a removal too) and every repeat op (skipped days add up); every view unchanged', () => {
    const small = compactRows(rows, now);
    expect(small.events.filter((r) => r[3] === 'food_repeat')).toEqual(food.filter((r) => r[3] === 'food_repeat'));
    const kept = small.events.filter((r) => r[3] === 'food');
    const ids = (list: EventRow[]) => list.map((r) => `${r[3]}|${JSON.parse(r[4]).id}`);
    const rm = kept.filter((r) => JSON.parse(r[4]).rm).length;
    expect(rm).toBeGreaterThan(0); // removals stay (final), each with the op it removed
    expect(new Set(ids(kept)).size).toBe(kept.length - rm); // else one row per id
    expect(new Set(ids(kept))).toEqual(new Set(ids(food.filter((r) => r[3] === 'food')))); // every id still there
    expect(kept.length).toBeLessThan(food.length * 0.85);
    expect(meals(small, days)).toBe(meals(rows, days));
    expect(compactRows(small, now)).toBe(small); // a fixed point
  });

  it('drops someone else’s op and anything after a removal, and stays exact with queued ops on top', () => {
    const f = (at: number, who: 'A' | 'B', data: object): EventRow => [new Date(at).toISOString(), who, `x${at}`, 'food', JSON.stringify({ at, ...data })];
    const T = Date.parse('2026-11-03T03:00:00.000Z');
    const set = { d: '2026-11-03', m: 'b', g: 100, f: { id: 'mext:01088', n: 'ごはん', k: 156, p: 2.5, fa: 0.3, c: 37.1, s: 0 } };
    const r: SnapshotRows = {
      metrics: [],
      events: [
        f(T, 'A', { id: 'fmeal001', ...set }), f(T + 1, 'B', { id: 'fmeal001', ...set, g: 5 }), f(T + 2, 'A', { id: 'fmeal001', ...set, g: 200 }),
        f(T + 3, 'A', { id: 'fmeal002', ...set }), f(T + 4, 'A', { id: 'fmeal002', rm: true }), f(T + 5, 'A', { id: 'fmeal002', ...set }),
        ['garbage', 'A', 'x0', 'food', '{'], [new Date(T + 6).toISOString(), 'A', 'x1', 'food', '{']
      ]
    };
    // a recipe set, then edited: only the edit stays
    const rec = (at: number, sv: number): EventRow => [new Date(at).toISOString(), 'A', `c${at}`, 'food_recipe', JSON.stringify({ id: 'crecipe01', at, n: 'カレー', sv, it: [{ g: 200, f: set.f }] })];
    r.events.splice(6, 0, rec(T + 5, 2), rec(T + 6, 4));
    // a custom food set, edited, someone else's edit (refused), then another removed: the edit, the removal with its set
    const cus = (at: number, who: 'A' | 'B', data: object): EventRow => [new Date(at).toISOString(), who, `m${at}`, 'food_custom', JSON.stringify({ at, n: '弁当', u: '1個', k: 600, ...data })];
    r.events.splice(8, 0, cus(T + 5, 'A', { id: 'mcustom01' }), cus(T + 6, 'A', { id: 'mcustom01', k: 700 }), cus(T + 7, 'B', { id: 'mcustom01', k: 1 }),
      cus(T + 8, 'B', { id: 'mcustom02' }), [new Date(T + 9).toISOString(), 'B', `m${T + 9}`, 'food_custom', JSON.stringify({ id: 'mcustom02', at: T + 9, rm: true })]);
    const small = compactRows(r, now);
    // the unreadable rows stay (the model skips them, as the other tabs')
    expect(small.events.map((x) => x[2])).toEqual([`x${T + 2}`, `x${T + 3}`, `x${T + 4}`, `c${T + 6}`, `m${T + 6}`, `m${T + 8}`, `m${T + 9}`, 'x0', 'x1']);
    expect(customs(reduce(small)).map((c) => [c.id, c.k])).toEqual([['mcustom01', 700]]);
    expect(compactRows(small, now)).toBe(small);
    expect(meals(small, ['2026-11-03'])).toBe(meals(r, ['2026-11-03']));
    // this phone's queued ops over either: an edit, and one of the removed entry (refused)
    const queued = [f(T + 7, 'A', { id: 'fmeal001', ...set, g: 300 }), f(T + 8, 'A', { id: 'fmeal002', ...set, g: 1 })];
    const shown = (x: SnapshotRows) => JSON.stringify(foodDay(foldEvents(reduce(x), queued, null)!, 'A', '2026-11-03'));
    expect(shown(small)).toBe(shown(r));
    expect(JSON.parse(shown(small)).entries.map((e: { g: number }) => e.g)).toEqual([300]);
  });
});
