import { describe, expect, it } from 'vitest';
import { WEEK_MIN } from '../contract/places.ts';
import { parsePlace, periodsOf } from './gplace.ts';

// Synthetic shapes of Google's maps/preview/place answer (no real place): a day [name, weekday 1 Mon … 7 Sun, date,
// periods, special?, state], the week starting on the day it was asked
const NAMES = ['', '月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日', '日曜日'];
const day = (wd: number, periods: unknown[], special = 0) => [NAMES[wd], wd, [2030, 1, wd], periods, special, periods.length ? 1 : 2];
const span = (o: number[], c: number[]) => [`${o[0]}時～${c[0]}時`, [o, c]];
const OFF = ['定休日'];
/** A week asked on weekday `from` (1 Mon … 7 Sun): `per(wd)` that day's periods. */
const week = (from: number, per: (wd: number) => unknown[]) => Array.from({ length: 7 }, (_, i) => { const wd = ((from - 1 + i) % 7) + 1; return day(wd, per(wd)); });

/** A payload: the place at [6], 260 slots, the fields set by path. */
function payload(set: Record<string, unknown>): string {
  const p: unknown[] = Array(260).fill(null);
  p[10] = '0x0:0x1';
  for (const [path, v] of Object.entries(set)) {
    const ks = path.split('.').map(Number);
    let o = p as unknown[];
    for (const k of ks.slice(0, -1)) o = (o[k] ??= []) as unknown[];
    o[ks.at(-1)!] = v;
  }
  return `)]}'\n${JSON.stringify([null, null, null, null, null, null, p])}`;
}
const T = { id: '1', cid: '1', ftid: '0x0:0x1' };

describe('periodsOf (Google’s week as the contract’s periods)', () => {
  it('reads each day’s own weekday: a week asked on a Tuesday lands on the same days as one asked on a Monday', () => {
    // closed Monday and Thursday, 11:00–19:30 otherwise
    const per = (wd: number) => (wd === 1 || wd === 4 ? [OFF] : [span([11], [19, 30])]);
    const mon = periodsOf(week(1, per)), tue = periodsOf(week(2, per)), sun = periodsOf(week(7, per));
    expect(mon).toEqual([0, 2, 3, 5, 6].map((d) => ({ d, o: 660, c: 1170 })));
    expect(tue).toEqual(mon);
    expect(sun).toEqual(mon);
  });
  it('split shifts, a close past midnight, 24 時間営業 every day as the one all-week period', () => {
    const w = periodsOf(week(3, (wd) => (wd === 6 ? [span([11], [14]), span([17], [2])] : [OFF])));
    expect(w).toEqual([{ d: 6, o: 660, c: 840 }, { d: 6, o: 1020, c: 1560 }]);
    expect(periodsOf(week(5, () => [['24 時間営業']]))).toEqual([{ d: 0, o: 0, c: WEEK_MIN }]);
  });
  it('a week without the weekday slot falls back to its place (Monday first); none or empty: null', () => {
    const w = Array.from({ length: 7 }, (_, i) => ['x', null, null, i === 0 ? [span([9], [17])] : [OFF]]);
    expect(periodsOf(w)).toEqual([{ d: 1, o: 540, c: 1020 }]);
    expect(periodsOf(null)).toBeNull();
    expect(periodsOf([])).toBeNull();
  });
});

describe('special days (a holiday’s own hours: day[4] 1)', () => {
  it('still read, their weekdays in sp; a "hours might differ" note (day[4] 0) is the regular', () => {
    // asked on a Sunday, the Monday a holiday (closed that day; 10–18 otherwise), Thursday only noted
    const w = week(7, () => [span([10], [18])]).map((dd) => {
      if (dd[1] === 1) return day(1, [OFF], 1);
      if (dd[1] === 4) return [...day(4, [span([10], [18])]), ['時間が異なる場合があります', 'x', 2]];
      return dd;
    });
    const sp: number[] = [];
    expect(periodsOf(w, sp)).toEqual([0, 2, 3, 4, 5, 6].map((d) => ({ d, o: 600, c: 1080 })));
    expect(sp).toEqual([1]);
    const r = parsePlace(payload({ '203.0': w }), T, 5);
    expect(r.ok && r.meta.sp).toEqual([1]);
    expect(parsePlace(payload({ '203.0': week(7, () => [span([10], [18])]) }), T, 5)).not.toHaveProperty('meta.sp');
  });
});

describe('parsePlace (the whitelist)', () => {
  it('the hours, the kind and the rating; 閉業 marked shut only when Google flags it ([23] 1)', () => {
    const r = parsePlace(payload({ '203.0': week(2, () => [span([10], [20])]), '13': ['カフェ'], '4.7': 4.1, '4.8': 12 }), T, 5);
    expect(r).toMatchObject({ ok: true, meta: { at: 5, kind: 'カフェ', r: 4.1, rn: 12 } });
    expect(r.ok && r.meta.hours).toHaveLength(7);
    expect(r.ok && 'shut' in r.meta).toBe(false);
    const shut = parsePlace(payload({ '23': 1, '13': ['ラーメン屋'] }), T, 5);
    expect(shut).toMatchObject({ ok: true, meta: { hours: null, shut: true } });
  });
  it('no hours section: hours null, the rest kept', () => {
    expect(parsePlace(payload({ '178.0.0': '03-0000-0000' }), T, 5)).toMatchObject({ ok: true, meta: { hours: null, tel: '03-0000-0000' } });
  });
  it('another place’s cid: a mismatch; a stub: stale', () => {
    expect(parsePlace(payload({ '181.4': '2' }), T, 5)).toEqual({ ok: false, why: 'mismatch' });
    expect(parsePlace(`)]}'\n[]`, T, 5)).toEqual({ ok: false, why: 'stale' });
  });
});
