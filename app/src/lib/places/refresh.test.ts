import { describe, expect, it } from 'vitest';
import { CAP, DAY_S, dueToday, pickDetails, pickNoHours, SLICE, type LiveId } from './refresh.ts';

const DAY = 86_400;
const NOW = 1_795_400_000;
const place = (i: number, seen: number, added = NOW - 400 * DAY): LiveId => [String(1_000_000_000_000 + i), 35.6, 139.7, added, seen];
const ids = (ps: readonly LiveId[]) => ps.map((p) => p[0]);

describe('pickDetails (the daily details run’s places)', () => {
  // 500 places looked up over the last 500 days, one a day
  const live = Array.from({ length: 500 }, (_, i) => place(i, NOW - (500 - i) * DAY));

  it('refreshes the SLICE looked up longest ago, oldest first; each run’s look-ups move them to the back', () => {
    const r = pickDetails(live);
    expect(r.missing).toEqual([]);
    expect(ids(r.refresh)).toEqual(ids(live.slice(0, SLICE)));
    // a turn: run, mark the looked-up as seen today, again; every place comes round in ceil(500 / SLICE) runs
    let rows = live.map((p) => [...p] as LiveId);
    const seen = new Set<string>();
    for (let d = 0; d < Math.ceil(live.length / SLICE); d++) {
      const got = new Set(ids(pickDetails(rows).refresh));
      for (const id of got) seen.add(id);
      rows = rows.map((p) => (got.has(p[0]) ? [p[0], p[1], p[2], p[3], NOW + d * DAY] : p));
    }
    expect(seen.size).toBe(live.length);
  });

  it('looks up the never looked up first, the newest saves first, then fills the cap with the refresh', () => {
    const fresh = [place(9001, 0, NOW - DAY), place(9002, 0, NOW - 90 * DAY), place(9003, 0, NOW - 3600)];
    const r = pickDetails([...live, ...fresh]);
    expect(ids(r.missing)).toEqual(ids([fresh[2], fresh[0], fresh[1]]));
    expect(r.refresh).toHaveLength(SLICE);
    expect(r.waiting).toBe(0);
  });

  it('keeps to the cap: missing first, the refresh what is left, the rest waiting', () => {
    const fresh = Array.from({ length: CAP + 5 }, (_, i) => place(20_000 + i, 0, NOW - i * 60));
    const r = pickDetails([...live, ...fresh]);
    expect(ids(r.missing)).toEqual(ids(fresh.slice(0, CAP)));
    expect(r.refresh).toEqual([]);
    expect(r.waiting).toBe(5);
    expect(pickDetails([...live, ...fresh.slice(0, CAP - 10)]).refresh).toHaveLength(10);
    expect(pickDetails(live, { cap: 10 }).refresh).toHaveLength(10);
  });

  it('ties (a seed’s one look-up time) in id order; an empty list is no work', () => {
    const same = [place(3, NOW), place(1, NOW), place(2, NOW)];
    expect(ids(pickDetails(same, { slice: 2 }).refresh)).toEqual(ids([same[1], same[2]]));
    expect(pickDetails([])).toEqual({ missing: [], refresh: [], waiting: 0 });
  });
});

describe('pickNoHours (the no-hours one-off’s places)', () => {
  const p = (i: number, seen: number, nh: 0 | 1, cat: string): LiveId => [String(2_000_000_000_000 + i), 35.6, 139.7, NOW - 400 * DAY, seen, nh, cat];
  it('only the looked-up with no hours, the eating and drinking first, each the longest ago first; the cap', () => {
    const live = [p(1, NOW - DAY, 1, '自然・登山'), p(2, NOW - DAY, 1, 'カフェ'), p(3, NOW - 9 * DAY, 1, '麺'), p(4, NOW - 9 * DAY, 0, 'カフェ'), p(5, 0, 1, 'カフェ'), p(6, NOW - 30 * DAY, 1, '見どころ'), [String(9), 35, 139, NOW, NOW - DAY] as LiveId];
    expect(ids(pickNoHours(live))).toEqual(ids([live[2], live[1], live[5], live[0]]));
    expect(ids(pickNoHours(live, 2))).toEqual(ids([live[2], live[1]]));
  });
});

describe('dueToday (the daily run’s guard: skip only with a run’s worth looked up in the last 20 h)', () => {
  const o = { cap: CAP };
  const T = NOW + 30 * DAY;
  /** n places looked up at `at`, the rest of 200 a week before. */
  const live = (n: number, at: number, old = T - 7 * DAY): LiveId[] => Array.from({ length: 200 }, (_, i) => place(i, i < n ? at : old));
  it('a full run within 20 h: skip; none, a few before /sorry, or one past 20 h: run', () => {
    expect(dueToday(live(SLICE, T - 3600), T, o)).toMatchObject({ skip: true, recent: SLICE, quota: SLICE, ageH: 1 });
    expect(dueToday(live(0, 0), T, o)).toMatchObject({ skip: false, recent: 0, ageH: 168 });
    expect(dueToday(live(5, T - 3600), T, o)).toMatchObject({ skip: false, recent: 5 });
    expect(dueToday(live(SLICE, T - DAY_S - 1), T, o).skip).toBe(false);
    // a few pages failing (unstamped) still counts as the run
    expect(dueToday(live(Math.ceil(SLICE * 0.75), T - 3600), T, o).skip).toBe(true);
  });
  it('the 11-25 stall: a short manual run 17 h before (under the quota): run; the day’s SLICE done: skip', () => {
    const ps = Array.from({ length: 3000 }, (_, i) => place(i, i < 20 ? T - 17 * 3600 : T - 2 * DAY));
    expect(dueToday(ps, T, o)).toMatchObject({ skip: false, recent: 20, quota: SLICE });
    const done = ps.map((p, i) => (i >= 20 && i < 20 + SLICE ? ([p[0], p[1], p[2], p[3], T - 3600] as LiveId) : p));
    expect(dueToday(done, T, o)).toMatchObject({ skip: true, recent: 20 + SLICE });
  });
  it('a small list or cap: the quota no more than the looked-up and the cap; an empty list runs (nothing to do)', () => {
    expect(dueToday(Array.from({ length: 10 }, (_, i) => place(i, T - 3600)), T, o)).toMatchObject({ skip: true, quota: 10 });
    expect(dueToday(live(8, T - 3600), T, { ...o, cap: 10 })).toMatchObject({ skip: true, quota: 10 });
    expect(dueToday([], T, o).skip).toBe(false);
  });
});
