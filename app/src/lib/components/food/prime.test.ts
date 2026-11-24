// ごはん's opening made ready ahead (prime.ts): which foods' pictures the day draws.
import { describe, expect, it } from 'vitest';
import { reduce } from '#lib/model/state.ts';
import type { EventRow } from '#lib/contract/api.ts';
import { dayFoodIds } from './prime.ts';

const T = Date.parse('2026-11-03T03:00:00.000Z');
const RICE = { id: 'mext:01088', n: 'ごはん', k: 156, p: 2.5, fa: 0.3, c: 37.1, s: 0 };
const NATTO = { id: 'mext:04046', n: '納豆', k: 190, p: 16.5, fa: 10, c: 12.1, s: null };
const TEA = { id: 'off:4901085', n: 'お茶', k: 0 };
let n = 0;
const ev = (who: 'A' | 'B' | 'G', data: object, type = 'food'): EventRow =>
  [new Date(T + n * 1000).toISOString(), who, `e${++n}`, type as EventRow[3], JSON.stringify({ at: T + n * 1000, ...data })];

describe('dayFoodIds', () => {
  it('everyone’s entries of the day (once each) and a recipe’s ingredients; another day’s not', () => {
    const s = reduce({
      metrics: [],
      events: [
        ev('A', { id: 'crec0001', n: '納豆ごはん', sv: 2, it: [{ g: 300, f: RICE }, { g: 90, f: NATTO }] }, 'food_recipe'),
        ev('A', { id: 'fmeal001', d: '2026-11-03', m: 'b', g: 150, f: RICE }),
        ev('B', { id: 'fmeal002', d: '2026-11-03', m: 'l', g: 500, f: TEA }),
        ev('G', { id: 'fmeal003', d: '2026-11-03', m: 'd', g: 100, f: { id: 'recipe:crec0001', n: '納豆ごはん', k: 170 } }),
        ev('A', { id: 'fmeal004', d: '2026-11-02', m: 'b', g: 45, f: { ...NATTO, id: 'mext:99999' } })
      ]
    });
    expect(dayFoodIds(s, '2026-11-03').sort()).toEqual(['mext:01088', 'mext:04046', 'off:4901085', 'recipe:crec0001']);
    expect(dayFoodIds(s, '2026-11-04')).toEqual([]);
  });
});
