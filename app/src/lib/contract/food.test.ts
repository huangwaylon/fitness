import { describe, expect, it } from 'vitest';
import { foodAccept, foodFold, foodOp, isKcalGoal, newFoodId, type FoodOp } from './food.ts';
import { cleanLine } from './board.ts';

const T = Date.parse('2026-11-03T03:00:00.000Z');
const RICE = { id: 'mext:01088', n: 'ごはん', k: 156, p: 2.5, fa: 0.3, c: 37.1, s: 0 };
const set = (id: string, who: 'A' | 'B' | 'G', at: number, g = 150) => ({ ...(foodOp({ id, at, d: '2026-11-03', m: 'l', g, f: RICE }) as FoodOp), who });
const rm = (id: string, who: 'A' | 'B' | 'G', at: number) => ({ id, at, rm: true as const, who });

describe('cleanLine', () => {
  it('makes one line: controls stripped, blank runs one space, trimmed, cut to max; idempotent', () => {
    expect(cleanLine('  ご\u0007はん\r\n大盛り\u202e\t ', 60)).toBe('ごはん 大盛り');
    expect(cleanLine('あ'.repeat(10), 4)).toBe('ああああ');
    expect(cleanLine('ab   cd', 3)).toBe('ab');
    expect(cleanLine(42, 10)).toBe('');
    for (const s of ['  x\r\ny ', 'a \u0007 b', '🍙'.repeat(70)]) expect(cleanLine(cleanLine(s, 60), 60)).toBe(cleanLine(s, 60));
  });
});

describe('foodOp', () => {
  it('reads a set and a removal, known keys only, normalized', () => {
    expect(foodOp({ id: 'fabcdef1', at: T, d: '2026-11-03', m: 'b', g: 12.3, f: { ...RICE, p: undefined, n: ' ごはん\n', u: ' 1杯' } })).toEqual({
      id: 'fabcdef1', at: T, d: '2026-11-03', m: 'b', g: 12.3, f: { ...RICE, p: null, u: '1杯' }
    });
    expect(foodOp({ id: 'fabcdef1', at: T, rm: true })).toEqual({ id: 'fabcdef1', at: T, rm: true });
  });
  it('refuses anything malformed', () => {
    const ok = { id: 'fabcdef1', at: T, d: '2026-11-03', m: 'b', g: 100, f: RICE };
    for (const bad of [
      { ...ok, id: 'babcdef1' }, { ...ok, id: 'fabc' }, { ...ok, at: 5 }, { ...ok, d: '2026-13-01' }, { ...ok, m: 'x' },
      { ...ok, g: 0.05 }, { ...ok, g: 5001 }, { ...ok, g: 1.25 }, { ...ok, x: 1 }, { ...ok, f: { ...RICE, k: -1 } },
      { ...ok, f: { ...RICE, c: 'x' } }, { ...ok, f: { ...RICE, n: '' } }, { ...ok, f: { ...RICE, id: '' } }, { ...ok, f: null },
      { id: 'fabcdef1', at: T, rm: false }, { id: 'fabcdef1', at: T, rm: true, g: 1 }, null, 'x'
    ]) expect(foodOp(bad)).toBeNull();
  });
});

describe('foodAccept and foodFold', () => {
  it('only the owner changes an entry; a removal is final; an older op is stale', () => {
    expect(foodAccept(null, set('f1234567', 'G', T))).toBe('append');
    expect(foodAccept(null, rm('f1234567', 'A', T))).toBe('stale');
    expect(foodAccept(set('f1234567', 'A', T), set('f1234567', 'B', T + 1))).toBe('forbidden');
    expect(foodAccept(set('f1234567', 'A', T), rm('f1234567', 'G', T + 1))).toBe('forbidden');
    expect(foodAccept(set('f1234567', 'A', T), set('f1234567', 'A', T))).toBe('stale');
    expect(foodAccept(set('f1234567', 'A', T), rm('f1234567', 'A', T - 1))).toBe('append');
    expect(foodAccept(rm('f1234567', 'A', T), set('f1234567', 'A', T + 1))).toBe('stale');
  });
  it('folds to the live entries by day, meal and id, whatever order the ops came in', () => {
    const ops = [set('f0000002', 'A', T), set('f0000001', 'B', T + 1), set('f0000002', 'A', T + 2, 80), rm('f0000001', 'B', T + 3), set('f0000003', 'G', T + 4)];
    expect(foodFold(ops).map((e) => [e.id, e.who, e.g])).toEqual([['f0000002', 'A', 80], ['f0000003', 'G', 150]]);
    expect(foodFold([...ops].reverse().filter((o) => !o.rm)).map((e) => e.id)).toEqual(['f0000001', 'f0000002', 'f0000003']);
  });
});

describe('newFoodId and isKcalGoal', () => {
  it('a new id is well-formed', () => {
    expect(foodOp({ id: newFoodId(T), at: T, rm: true })).not.toBeNull();
  });
  it('a kcal goal is a whole 50 in 1,000–5,000', () => {
    expect([1000, 1850, 5000].every(isKcalGoal)).toBe(true);
    expect([950, 1825, 5050, 2000.5, '2000', null].some(isKcalGoal)).toBe(false);
  });
});
