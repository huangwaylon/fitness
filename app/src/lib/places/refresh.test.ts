import { describe, expect, it } from 'vitest';
import { CAP, DAY_S, dueToday, OLD_PICS, PICS_BEFORE, pickDetails, pickNoHours, REDO_BEFORE, REDO_CAP, SLICE, type LiveId } from './refresh.ts';

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

describe('the redo (places looked up before REDO_BEFORE)', () => {
  it('refreshes REDO_CAP a run (a larger cap given: that), oldest first, while any is left; then the SLICE again; only when asked', () => {
    const old = Array.from({ length: 1000 }, (_, i) => place(i, REDO_BEFORE - 2000 + i));
    const o = { redoBefore: REDO_BEFORE, cap: CAP };
    expect(ids(pickDetails(old, o).refresh)).toEqual(ids(old.slice(0, REDO_CAP)));
    expect(pickDetails(old, { ...o, cap: 700 }).refresh).toHaveLength(700);
    const after = old.map((p) => [p[0], p[1], p[2], p[3], REDO_BEFORE + 1] as LiveId);
    expect(pickDetails(after, o).refresh).toHaveLength(SLICE);
    expect(pickDetails(old).refresh).toHaveLength(SLICE);
  });
});

describe('the photo backfill (looked up before PICS_BEFORE with the old cap’s 3 photos)', () => {
  const o = { redoBefore: REDO_BEFORE, picsBefore: PICS_BEFORE, cap: CAP };
  /** Looked up after the hours redo's cutoff but before PICS_BEFORE, with `pn` photos and `opens` card openings. */
  const p = (i: number, pn: number, opens = 0, seen = REDO_BEFORE + 100 + i): LiveId => [String(3_000_000_000_000 + i), 35.6, 139.7, NOW, seen, 0, '', pn, opens];
  it('in the redo’s REDO_CAP slots: the most opened cards first, then the oldest; fewer than 3 (Google had no more) not', () => {
    const live = [...Array.from({ length: 700 }, (_, i) => p(i, OLD_PICS)), p(900, 2, 50), p(901, 0, 50), p(902, OLD_PICS, 7), p(903, OLD_PICS, 30)];
    const r = pickDetails(live, o);
    expect(r.refresh).toHaveLength(REDO_CAP);
    expect(ids(r.refresh.slice(0, 3))).toEqual(ids([live[703], live[702], live[0]]));
    expect(ids(r.refresh)).not.toContain(live[700][0]);
    expect(ids(r.refresh)).not.toContain(live[701][0]);
  });
  it('shares the slots with the hours redo (one order: openings, then age); a look-up since PICS_BEFORE, or 10 photos, leaves it', () => {
    const hours = place(1, REDO_BEFORE - 10);
    const live = [hours, p(2, OLD_PICS, 3), p(3, OLD_PICS, 0, PICS_BEFORE + 1), p(4, 10, 9, PICS_BEFORE + 1)];
    expect(ids(pickDetails(live, { ...o, cap: 2 }).refresh.slice(0, 2))).toEqual(ids([live[1], hours]));
    const done = [p(3, OLD_PICS, 0, PICS_BEFORE + 1), p(4, 10, 9, PICS_BEFORE + 1), p(5, 1, 0)];
    expect(pickDetails(done, o).refresh).toHaveLength(done.length);
    expect(pickDetails(Array.from({ length: 100 }, (_, i) => p(i, 1)), o).refresh).toHaveLength(SLICE);
  });
});

describe('dueToday (the daily run’s guard: skip only with a run’s worth looked up in the last 20 h)', () => {
  const o = { redoBefore: REDO_BEFORE, picsBefore: PICS_BEFORE, cap: CAP };
  const T = PICS_BEFORE + 30 * DAY; // past the redo's cutoffs
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
  it('the 11-25 stall: a short manual run 17 h before and the redo waiting: run (the redo’s REDO_CAP is the quota)', () => {
    const ps = [...live(40, T - 17 * 3600), ...Array.from({ length: 800 }, (_, i) => [String(5_000_000_000_000 + i), 35.6, 139.7, T, REDO_BEFORE - 10] as LiveId)];
    expect(dueToday(ps, T, o)).toMatchObject({ skip: false, recent: 40, quota: REDO_CAP, redo: 800 });
    // the redo's day done (REDO_CAP looked up): skip
    const done = [...ps.slice(0, 200), ...ps.slice(200).map((p, i) => (i < REDO_CAP ? ([p[0], p[1], p[2], p[3], T - 3600] as LiveId) : p))];
    expect(dueToday(done, T, o).skip).toBe(true);
  });
  it('a small list or cap: the quota no more than the looked-up and the cap; an empty list runs (nothing to do)', () => {
    expect(dueToday(Array.from({ length: 10 }, (_, i) => place(i, T - 3600)), T, o)).toMatchObject({ skip: true, quota: 10 });
    expect(dueToday(live(8, T - 3600), T, { ...o, cap: 10 })).toMatchObject({ skip: true, quota: 10 });
    expect(dueToday([], T, o).skip).toBe(false);
  });
});

describe('dueToday once the redo is empty (backfilled by hand): the normal day', () => {
  const T = PICS_BEFORE + 30 * DAY;
  const o = { redoBefore: REDO_BEFORE, picsBefore: PICS_BEFORE, cap: CAP };
  it('the quota back to SLICE: a normal run’s 48 skip the backstop, none runs it; the picks back to SLICE of CAP', () => {
    const ps = Array.from({ length: 3000 }, (_, i) => place(i, i < SLICE ? T - 3600 : T - 2 * DAY));
    expect(dueToday(ps, T, o)).toMatchObject({ skip: true, quota: SLICE, redo: 0 });
    expect(dueToday(ps.map((p) => [p[0], p[1], p[2], p[3], T - 2 * DAY] as LiveId), T, o)).toMatchObject({ skip: false, recent: 0, redo: 0 });
    expect(pickDetails(ps, o).refresh).toHaveLength(SLICE);
  });
});
