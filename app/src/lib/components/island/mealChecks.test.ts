import { describe, expect, it } from 'vitest';
import { reduce } from '#lib/model/state.ts';
import type { EventRow } from '#lib/contract/api.ts';
import { dayKey } from '#lib/time/clock.ts';
import { MAIN_MEALS, mealsLogged } from './mealChecks.ts';

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
