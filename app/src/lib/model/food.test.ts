import { describe, expect, it } from 'vitest';
import { foldEvents, reduce } from './state.ts';
import { foodDay, foodEntries, kcalGoal, proteinGoal } from './food.ts';
import type { EventRow, MetricRow } from '#lib/contract/api.ts';

const T = Date.parse('2026-11-03T03:00:00.000Z');
const RICE = { id: 'mext:01088', n: 'ごはん', k: 156, p: 2.5, fa: 0.3, c: 37.1, s: 0 };
const NATTO = { id: 'mext:04046', n: '納豆', k: 190, p: 16.5, fa: 10, c: 12.1, s: null };
let n = 0;
const ev = (who: 'A' | 'B' | 'G', at: number, data: object, type = 'food'): EventRow =>
  [new Date(at).toISOString(), who, `e${++n}`, type as EventRow[3], JSON.stringify(data)];
const set = (who: 'A' | 'B' | 'G', id: string, at: number, extra: object = {}) =>
  ev(who, at, { id, at, d: '2026-11-03', m: 'b', g: 150, f: RICE, ...extra });

describe('foodDay: a day’s meals and their totals', () => {
  it('folds the ops (edits, removals, someone else’s refused) and adds up the day, an unknown nutrient as none', () => {
    const s = reduce({
      metrics: [],
      events: [
        set('A', 'fmeal001', T, { m: 'd' }),
        set('A', 'fmeal002', T + 1000, { f: NATTO, g: 45 }),
        set('A', 'fmeal002', T + 2000, { f: NATTO, g: 50 }), // edited
        set('A', 'fmeal003', T + 3000),
        ev('A', T + 4000, { id: 'fmeal003', at: T + 4000, rm: true }), // removed
        set('B', 'fmeal001', T + 5000, { g: 999 }), // not B's: ignored
        set('A', 'fmeal004', T + 6000, { d: '2026-11-02' }), // another day
        set('B', 'fmeal005', T + 7000)
      ]
    });
    const day = foodDay(s, 'A', '2026-11-03');
    expect(day.entries.map((e) => [e.id, e.m, e.g])).toEqual([['fmeal002', 'b', 50], ['fmeal001', 'd', 150]]);
    // 156 × 1.5 + 190 × 0.5; salt: natto's unknown
    expect(day).toMatchObject({ kcal: 329, p: 12, fa: 5.5, c: 61.7, s: 0 });
    expect(foodDay(s, 'B', '2026-11-03').entries.map((e) => e.id)).toEqual(['fmeal005']);
    expect(foodDay(s, 'G', '2026-11-03')).toEqual({ entries: [], kcal: 0, p: 0, fa: 0, c: 0, s: 0 });
  });

  it('shows a queued op at once (foldEvents), the guest’s own too', () => {
    const base = reduce({ metrics: [], events: [set('G', 'fmeal010', T)] });
    const s = foldEvents(base, [ev('G', T + 1000, { id: 'fmeal010', at: T + 1000, rm: true }), set('G', 'fmeal011', T + 2000, { m: 's' })], null)!;
    expect(foodDay(s, 'G', '2026-11-03').entries.map((e) => e.id)).toEqual(['fmeal011']);
    expect(foodDay(base, 'G', '2026-11-03').entries.map((e) => e.id)).toEqual(['fmeal010']); // the base untouched
  });
});

describe('foodEntries: a person’s entries across days', () => {
  it('lists the live ones, the latest changed first', () => {
    const s = reduce({
      metrics: [],
      events: [set('A', 'fmeal020', T), set('A', 'fmeal021', T + 1000, { d: '2026-11-01' }), set('A', 'fmeal020', T + 2000, { g: 10 }), set('B', 'fmeal022', T + 3000)]
    });
    expect(foodEntries(s, 'A').map((e) => [e.id, e.at])).toEqual([['fmeal020', T + 2000], ['fmeal021', T + 1000]]);
    expect(foodEntries(s, 'G')).toEqual([]);
  });
});

describe('kcalGoal and proteinGoal', () => {
  const pref = (who: 'A' | 'B' | 'G', at: number, data: object) => ev(who, at, data, 'pref');
  it('kcalGoal: the latest valid pref (a member’s for either, the guest’s own), null cleared or unset', () => {
    const s = reduce({
      metrics: [],
      events: [
        pref('B', T, { person: 'A', key: 'kcalGoal', value: 1800 }),
        pref('A', T + 1000, { key: 'kcalGoal', value: 1825 }), // not a whole 50: ignored
        pref('G', T + 2000, { key: 'kcalGoal', value: 2200 }),
        pref('B', T + 3000, { key: 'kcalGoal', value: 2000 }),
        pref('B', T + 4000, { key: 'kcalGoal', value: null })
      ]
    });
    expect([kcalGoal(s, 'A'), kcalGoal(s, 'B'), kcalGoal(s, 'G')]).toEqual([1800, null, 2200]);
  });

  it('proteinGoal: 1.6 g per kg of the latest weigh-in, members only', () => {
    const metrics: MetricRow[] = [
      ['2026-11-01T22:00:00.000Z', 'A', '2026-11-02', 'weight', 70],
      ['2026-11-02T22:00:00.000Z', 'A', '2026-11-03', 'weight', 68.4]
    ];
    const s = reduce({ metrics, events: [] });
    expect(proteinGoal(s, 'A', T)).toBe(109);
    expect(proteinGoal(s, 'A', Date.parse('2026-11-02T03:00:00.000Z'))).toBe(112);
    expect(proteinGoal(s, 'B', T)).toBeNull();
    expect(proteinGoal(s, 'G', T)).toBeNull();
  });
});
