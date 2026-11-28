// 聞けたセリフ's schedule and honesty rule (shelf.ts): back after 3, 7, 21 days, ≤ 3 a day; 聞けた only first try at full
// speed with no tile given; the count only grows; a miss just comes back later.
import { describe, expect, it } from 'vitest';
import { backOn, cardsOf, dueOf, EMPTY, heardCount, PER_DAY, returned, shelved, type Key, type Shelf } from './shelf.ts';
import type { CatchLine } from './types.ts';
import type { LocalDate } from '#lib/types.ts';

const line: CatchLine = { q: 'x1', seg: [10, 12], tiles: ['I', 'know', 'that'], t: [10, 10.5, 11], ja: '知ってる', x: ['this'] };
const e = { video: 'v', title: 'T', line };
const CLEAN = { slow: false, hints: 0, miss: 0 }, SLOWED = { slow: true, hints: 1, miss: 1 };
const D = (d: string) => d as LocalDate;

describe('shelf', () => {
  it('a caught line is kept as caught; caught again in a lesson: as it was', () => {
    const s1 = shelved(EMPTY, 'c/x1', e, D('2026-11-20'), SLOWED);
    expect(s1.lines['c/x1']).toEqual({ ...e, first: { d: '2026-11-20', slow: 1, h: 1 }, step: 0 });
    expect(shelved(s1, 'c/x1', e, D('2026-11-21'), CLEAN)).toBe(s1);
    expect(shelved(EMPTY, 'c/x1', e, D('2026-11-20'), CLEAN).lines['c/x1'].first).toEqual({ d: '2026-11-20' });
  });
  it('back after 3, then 7, then 21 days when heard; done after the last', () => {
    let s: Shelf = shelved(EMPTY, 'c/x1', e, D('2026-11-01'), CLEAN);
    expect(dueOf(s, D('2026-11-03'))).toEqual([]);
    expect(dueOf(s, D('2026-11-04'))).toEqual(['c/x1']);
    s = returned(s, 'c/x1', D('2026-11-04'), CLEAN);
    expect(backOn(s.lines['c/x1'])).toBe('2026-11-11');
    expect(dueOf(s, D('2026-11-10'))).toEqual([]);
    s = returned(s, 'c/x1', D('2026-11-11'), CLEAN);
    expect(backOn(s.lines['c/x1'])).toBe('2026-12-02');
    s = returned(s, 'c/x1', D('2026-12-02'), CLEAN);
    expect(backOn(s.lines['c/x1'])).toBeNull();
    expect(dueOf(s, D('2027-06-01'))).toEqual([]);
  });
  it('聞けた only on a clean return, the first counted once; the count never drops on a later miss', () => {
    let s: Shelf = shelved(EMPTY, 'c/x1', e, D('2026-11-01'), CLEAN);
    expect(heardCount(s)).toBe(0); // (the lesson's own catch never counts: only a return days later)
    s = returned(s, 'c/x1', D('2026-11-04'), SLOWED);
    expect(heardCount(s)).toBe(0);
    expect(s.lines['c/x1']).toMatchObject({ step: 0, last: { d: '2026-11-04', slow: 1, h: 1 } });
    expect(backOn(s.lines['c/x1'])).toBe('2026-11-07');
    s = returned(s, 'c/x1', D('2026-11-07'), CLEAN);
    expect(s.lines['c/x1'].heard).toBe('2026-11-07');
    expect(heardCount(s)).toBe(1);
    s = returned(s, 'c/x1', D('2026-11-14'), { slow: false, hints: 0, miss: 1 });
    expect(heardCount(s)).toBe(1);
    expect(s.lines['c/x1']).toMatchObject({ heard: '2026-11-07', step: 0 });
  });
  it('≤ 3 a day, the longest overdue first; today’s returns counted', () => {
    let s: Shelf = EMPTY;
    for (const [k, d] of [['a/1', '2026-11-01'], ['b/1', '2026-11-05'], ['c/1', '2026-11-03'], ['d/1', '2026-11-02'], ['e/1', '2026-11-20']] as const)
      s = shelved(s, k as Key, e, D(d), CLEAN);
    const due = dueOf(s, D('2026-11-10'));
    expect(due).toEqual(['a/1', 'd/1', 'c/1']);
    expect(due).toHaveLength(PER_DAY);
    s = returned(s, 'a/1', D('2026-11-10'), CLEAN);
    expect(dueOf(s, D('2026-11-10'))).toEqual(['d/1', 'c/1']);
    s = returned(returned(s, 'd/1', D('2026-11-10'), SLOWED), 'c/1', D('2026-11-10'), CLEAN);
    expect(dueOf(s, D('2026-11-10'))).toEqual([]);
    expect(dueOf(s, D('2026-11-11'))).toEqual(['b/1']);
  });
  it('cards: the latest met first', () => {
    let s = shelved(shelved(EMPTY, 'a/1', e, D('2026-11-01'), CLEAN), 'b/1', e, D('2026-11-02'), CLEAN);
    expect(cardsOf(s).map(([k]) => k)).toEqual(['b/1', 'a/1']);
    s = returned(s, 'a/1', D('2026-11-04'), CLEAN);
    expect(cardsOf(s).map(([k]) => k)).toEqual(['a/1', 'b/1']);
  });
});
