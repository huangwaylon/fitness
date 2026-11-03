import { describe, expect, it } from 'vitest';
import {
  foodAccept, foodFold, foodOp, foodRecipeFold, foodRecipeOp, foodRepeatFold, foodRepeatOp, isKcalGoal, newFoodId, newRecipeId, newRepeatId,
  recipePortion, recipeSnap, recipeTotals, repeatCovers, weekdayBit, WEEKDAYS, type FoodOp, type RecipeOp, type RepeatOp
} from './food.ts';
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

describe('food_repeat', () => {
  const ok = { id: 'rabcdef1', at: T, m: 'b', it: [{ g: 150, f: RICE }], w: 127, from: '2026-11-01' };
  const rep = (id: string, who: 'A' | 'B' | 'G', at: number, extra: object = {}) => ({ ...(foodRepeatOp({ ...ok, id, at, ...extra }) as RepeatOp), who });

  it('reads a set and a removal, known keys only, normalized', () => {
    expect(foodRepeatOp({ ...ok, it: [{ g: 12.3, f: { ...RICE, n: ' ごはん\n' } }], to: null, sk: ['2026-11-04', '2026-11-02', '2026-11-04'] })).toEqual({
      ...ok, it: [{ g: 12.3, f: RICE }], sk: ['2026-11-02', '2026-11-04']
    });
    expect(foodRepeatOp({ ...ok, to: '2026-11-01', sk: [] })).toEqual({ ...ok, to: '2026-11-01' });
    expect(foodRepeatOp({ id: 'rabcdef1', at: T, rm: true })).toEqual({ id: 'rabcdef1', at: T, rm: true });
  });
  it('refuses anything malformed', () => {
    for (const bad of [
      { ...ok, id: 'fabcdef1' }, { ...ok, at: 5 }, { ...ok, m: 'x' }, { ...ok, w: 0 }, { ...ok, w: 128 }, { ...ok, w: '127' },
      { ...ok, from: '2026-02-30' }, { ...ok, to: '2026-10-31' }, { ...ok, it: [] }, { ...ok, it: Array(21).fill({ g: 1, f: RICE }) },
      { ...ok, it: [{ g: 1.25, f: RICE }] }, { ...ok, it: [{ g: 1, f: null }] }, { ...ok, it: [{ g: 1, f: RICE, m: 'b' }] },
      { ...ok, sk: ['2026-10-31'] }, { ...ok, to: '2026-11-02', sk: ['2026-11-03'] }, { ...ok, sk: [5] }, { ...ok, x: 1 },
      { id: 'rabcdef1', at: T, rm: true, m: 'b' }, null
    ]) expect(foodRepeatOp(bad)).toBeNull();
    expect(foodOp({ id: 'rabcdef1', at: T, rm: true })).toBeNull(); // a repeat's id is no entry's
  });
  it('weekdays are of the date: bit 0 Monday … bit 6 Sunday', () => {
    expect(['2026-11-02', '2026-11-03', '2026-11-07', '2026-11-08'].map(weekdayBit)).toEqual([1, 2, 32, 64]); // Mon, Tue, Sat, Sun
    expect([WEEKDAYS.weekdays & weekdayBit('2026-11-06'), WEEKDAYS.weekend & weekdayBit('2026-11-06')]).toEqual([16, 0]);
  });
  it('covers its days on its weekdays, not the skipped ones, nothing before from or after to', () => {
    const r = { from: '2026-11-02', to: '2026-11-09', w: WEEKDAYS.weekdays, sk: ['2026-11-04'] };
    const days = ['2026-11-01', '2026-11-02', '2026-11-03', '2026-11-04', '2026-11-07', '2026-11-09', '2026-11-10'];
    expect(days.filter((d) => repeatCovers(r, d))).toEqual(['2026-11-02', '2026-11-03', '2026-11-09']);
    expect(repeatCovers({ from: '2026-11-02', w: 127 }, '2030-01-01')).toBe(true); // open-ended
  });
  it('folds by the food rule (owner only, a removal final), by first day then id', () => {
    const ops = [rep('r0000002', 'A', T), rep('r0000001', 'B', T, { from: '2026-10-01' }), rep('r0000002', 'B', T + 1, { w: 1 }), rep('r0000002', 'A', T + 2, { to: '2026-11-03' }), rep('r0000003', 'G', T)];
    expect(foodRepeatFold(ops).map((r) => [r.id, r.who, r.to])).toEqual([['r0000001', 'B', undefined], ['r0000002', 'A', '2026-11-03'], ['r0000003', 'G', undefined]]);
    expect(foodRepeatFold([...ops, { id: 'r0000003', at: T + 3, rm: true as const, who: 'G' as const }, rep('r0000003', 'G', T + 4)]).map((r) => r.id)).toEqual(['r0000001', 'r0000002']);
    expect(foodAccept(rep('r0000002', 'A', T), rep('r0000002', 'A', T))).toBe('stale');
  });
  it('a new id is well-formed', () => {
    expect(foodRepeatOp({ ...ok, id: newRepeatId(T) })).not.toBeNull();
  });
});

describe('food_recipe', () => {
  const CURRY = { id: 'mext:17051', n: 'カレールウ', k: 474, p: 6.5, fa: 34.1, c: 44.7, s: 10.6 };
  const ok = { id: 'cabcdef1', at: T, n: 'おうちカレー', sv: 4, it: [{ g: 600, f: RICE }, { g: 100, f: CURRY }] };
  const rec = (id: string, who: 'A' | 'B' | 'G', at: number, extra: object = {}) => ({ ...(foodRecipeOp({ ...ok, id, at, ...extra }) as RecipeOp), who });

  it('reads a set and a removal, known keys only, normalized', () => {
    expect(foodRecipeOp({ ...ok, n: ' おうち\nカレー ', it: [{ g: 600.0, f: { ...RICE, n: ' ごはん\n' } }, { g: 100, f: CURRY }] })).toEqual({
      ...ok, n: 'おうち カレー'
    });
    expect(foodRecipeOp({ ...ok, n: 'あ'.repeat(40) })).toMatchObject({ n: 'あ'.repeat(30) });
    expect(foodRecipeOp({ id: 'cabcdef1', at: T, rm: true })).toEqual({ id: 'cabcdef1', at: T, rm: true });
  });
  it('refuses anything malformed', () => {
    for (const bad of [
      { ...ok, id: 'rabcdef1' }, { ...ok, at: 5 }, { ...ok, n: ' ' }, { ...ok, n: 1 }, { ...ok, sv: 0 }, { ...ok, sv: 21 }, { ...ok, sv: 2.5 },
      { ...ok, it: [] }, { ...ok, it: Array(31).fill({ g: 1, f: RICE }) }, { ...ok, it: [{ g: 1.25, f: RICE }] }, { ...ok, it: [{ g: 1, f: null }] },
      { ...ok, x: 1 }, { id: 'cabcdef1', at: T, rm: true, n: 'x' }, null
    ]) expect(foodRecipeOp(bad)).toBeNull();
    expect(foodOp({ id: 'cabcdef1', at: T, rm: true })).toBeNull(); // a recipe's id is no entry's
  });
  it('folds by the food rule (owner only, a removal final), the latest changed first', () => {
    const ops = [rec('c0000001', 'A', T), rec('c0000002', 'B', T + 1), rec('c0000001', 'B', T + 2, { sv: 1 }), rec('c0000001', 'A', T + 3, { sv: 2 }), rec('c0000003', 'G', T)];
    expect(foodRecipeFold(ops).map((r) => [r.id, r.who, r.sv])).toEqual([['c0000001', 'A', 2], ['c0000002', 'B', 4], ['c0000003', 'G', 4]]);
    expect(foodRecipeFold([...ops, { id: 'c0000002', at: T + 4, rm: true as const, who: 'B' as const }, rec('c0000002', 'B', T + 5)]).map((r) => r.id)).toEqual(['c0000001', 'c0000003']);
  });
  it('adds up its ingredients; a nutrient no ingredient knows is null, an unknown one counts as none', () => {
    expect(recipeTotals(ok.it)).toMatchObject({ g: 700, k: 1410 });
    expect(recipeTotals(ok.it).p).toBeCloseTo(21.5);
    const noP = { ...RICE, p: null };
    expect(recipeTotals([{ g: 100, f: noP }]).p).toBeNull();
    expect(recipeTotals([{ g: 100, f: noP }, { g: 100, f: CURRY }]).p).toBeCloseTo(6.5);
  });
  it('as a food per 100 g: its totals over its grams, a snapshot a food entry takes; a serving is its grams over its servings', () => {
    const f = recipeSnap(ok, '1人前');
    expect(f).toEqual({ id: 'recipe:cabcdef1', n: 'おうちカレー', k: 201.4, p: 3.07, fa: 5.13, c: 38.19, s: 1.51, u: '1人前' });
    expect(recipeSnap({ ...ok, it: [{ g: 100, f: { ...RICE, p: null } }] }).p).toBeNull();
    expect(recipeSnap(ok).u).toBeUndefined();
    const { label, g } = recipePortion(ok);
    expect([label, g]).toEqual(['1人前', 175]);
    const op = foodOp({ id: 'fabcdef1', at: T, d: '2026-11-03', m: 'd', g, f });
    expect(op).toMatchObject({ g: 175, f });
    expect((f.k * g) / 100).toBeCloseTo(1410 / 4, 0); // one serving: a quarter of the pot
    // a serving's grams stay within a food entry's
    expect(recipePortion({ sv: 20, it: [{ g: 0.1, f: RICE }] }).g).toBe(0.1);
    expect(recipePortion({ sv: 1, it: Array(2).fill({ g: 5000, f: RICE }) }).g).toBe(5000);
  });
  it('a new id is well-formed', () => {
    expect(foodRecipeOp({ ...ok, id: newRecipeId(T) })).not.toBeNull();
  });
});
