import { describe, expect, it } from 'vitest';
import { reduce } from '#lib/model/state.ts';
import type { EventRow } from '#lib/contract/api.ts';
import { dayKey } from '#lib/time/clock.ts';
import { MAIN_MEALS, mealsLogged, pfcMarks, pfcToday } from './mealChecks.ts';

const T = Date.parse('2026-11-06T03:00:00.000Z');
const RICE = { id: 'mext:01088', n: 'ごはん', k: 156, p: 2.5, fa: 0.3, c: 37.1, s: 0 };
let n = 0;
const ev = (who: 'A' | 'B' | 'G', data: object, type = 'food'): EventRow => {
  const at = T + ++n * 1000;
  return [new Date(at).toISOString(), who, `e${n}`, type as EventRow[3], JSON.stringify({ at, ...data })];
};
const meal = (who: 'A' | 'B' | 'G', id: string, d: string, m: string) => ev(who, { id, d, m, g: 150, f: RICE });

describe('mealsLogged: the tree popup’s 朝 / 昼 / 夜', () => {
  it('has the record’s slots but the snack', () => expect(MAIN_MEALS).toEqual(['b', 'l', 'd']));

  it('fills a meal once anything is in it that day, this person’s only; a snack, a removed entry or another day don’t', () => {
    const s = reduce({
      metrics: [],
      events: [
        meal('A', 'fmeal001', '2026-11-06', 'b'),
        meal('A', 'fmeal002', '2026-11-06', 's'), // a snack is no meal
        meal('A', 'fmeal003', '2026-11-06', 'l'),
        ev('A', { id: 'fmeal003', rm: true }), // removed
        meal('A', 'fmeal004', '2026-11-05', 'd'), // yesterday's dinner
        meal('B', 'fmeal005', '2026-11-06', 'd') // someone else's
      ]
    });
    expect(mealsLogged(s, 'A', '2026-11-06')).toEqual({ b: true, l: false, d: false });
    expect(mealsLogged(s, 'B', '2026-11-06')).toEqual({ b: false, l: false, d: true });
    expect(mealsLogged(s, 'G', '2026-11-06')).toEqual({ b: false, l: false, d: false });
  });

  it('counts a いつもの on the days it covers (the meal log’s day shows its items)', () => {
    const s = reduce({ metrics: [], events: [ev('A', { id: 'rmeal001', m: 'l', it: [{ g: 100, f: RICE }], w: 127, from: '2026-11-01' }, 'food_repeat')] });
    expect(mealsLogged(s, 'A', '2026-11-06')).toEqual({ b: false, l: true, d: false });
    expect(mealsLogged(s, 'A', '2026-10-31').l).toBe(false);
  });

  it('turns over with the Tokyo day, not UTC’s', () => {
    const s = reduce({ metrics: [], events: [meal('A', 'fmeal010', '2026-11-06', 'b')] });
    const day = (iso: string) => dayKey(new Date(iso));
    // 08:00 on the 6th in Tokyo is UTC's 5th: the 6th's breakfast counts
    expect(mealsLogged(s, 'A', day('2026-11-05T23:00:00Z')).b).toBe(true);
    // 23:59 in Tokyo is still the 6th; at 00:00 the 7th begins (UTC still on the 6th) and the circles empty
    expect(mealsLogged(s, 'A', day('2026-11-06T14:59:00Z')).b).toBe(true);
    expect(mealsLogged(s, 'A', day('2026-11-06T15:00:00Z')).b).toBe(false);
  });
});

describe('pfcMarks: the tree popup’s P · F · C', () => {
  const G = { p: 100, fa: 60, c: 200 };
  it('no goal: grams only, no share', () =>
    expect(pfcMarks({ p: 42.5, fa: 10, c: 0 }, { p: null, fa: null, c: 0 })).toEqual([
      { k: 'p', g: 42.5, goal: null, pct: null, state: 'none' },
      { k: 'fa', g: 10, goal: null, pct: null, state: 'none' },
      { k: 'c', g: 0, goal: null, pct: null, state: 'none' }
    ]));
  it('zero: 0 % and under, fat too (a ceiling not reached is no win)', () =>
    expect(pfcMarks({ p: 0, fa: 0, c: 0 }, G).map((m) => [m.pct, m.state])).toEqual([[0, 'under'], [0, 'under'], [0, 'under']]));
  it('each goal’s way: protein a floor, fat a ceiling, carbs ±15 %', () => {
    expect(pfcMarks({ p: 100, fa: 60, c: 170 }, G).map((m) => [m.pct, m.state])).toEqual([[100, 'met'], [100, 'under'], [85, 'met']]);
    expect(pfcMarks({ p: 99, fa: 59, c: 169 }, G).map((m) => m.state)).toEqual(['under', 'under', 'under']);
  });
  it('over: fat past its ceiling, carbs past the band; protein is never over', () => {
    expect(pfcMarks({ p: 250, fa: 61, c: 231 }, G).map((m) => [m.pct, m.state])).toEqual([[250, 'met'], [102, 'over'], [116, 'over']]);
    expect(pfcMarks({ p: 0, fa: 0, c: 230 }, G)[2].state).toBe('met');
  });
  it('reads the meal log’s day', () => {
    const s = reduce({ metrics: [], events: [meal('A', 'fmeal101', '2026-11-07', 'b'), meal('A', 'fmeal102', '2026-11-07', 's')] });
    expect(pfcToday(s, 'A', '2026-11-07', G).map((m) => m.g)).toEqual([7.5, 0.9, 111.3]);
    expect(pfcToday(s, 'B', '2026-11-07', G).map((m) => m.g)).toEqual([0, 0, 0]);
  });
});
