import { describe, expect, it } from 'vitest';
import {
  CUSTOM, customDensityOk, customGrams, customPortions, customSnap, foodCustomFold, foodCustomOp, newCustomId,
  foodAccept, foodFold, foodOp, foodRecipeFold, foodRecipeOp, foodRepeatFold, foodRepeatOp, isFoodGoal, newFoodId, newRecipeId, newRepeatId,
  recipePortion, recipeSnap, recipeTotals, repeatAccept, repeatCovers, repeatNext, weekdayBit, WEEKDAYS, type CustomOp, type FoodOp, type RecipeOp, type RepeatOp
} from './food.ts';
import { cleanLine } from './text.ts';

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

describe('new ids and goals', () => {
  it('a new entry’s, repeat’s and recipe’s id is well-formed', () => {
    expect(foodOp({ id: newFoodId(T), at: T, rm: true })).not.toBeNull();
    expect(foodRepeatOp({ id: newRepeatId(T), at: T, rm: true })).not.toBeNull();
    expect(foodRecipeOp({ id: newRecipeId(T), at: T, rm: true })).not.toBeNull();
  });
  it('a kcal goal is a whole 50 in 1,000–5,000', () => {
    expect([1000, 1850, 5000].every((v) => isFoodGoal('k', v))).toBe(true);
    expect([950, 1825, 5050, 2000.5, '2000', null].some((v) => isFoodGoal('k', v))).toBe(false);
  });
  it('a nutrient goal: protein, fat and carbs whole 5s of g, salt halves of g, each in its range', () => {
    expect([isFoodGoal('p', 120), isFoodGoal('fa', 60), isFoodGoal('c', 250), isFoodGoal('s', 7.5), isFoodGoal('s', 1)]).toEqual([true, true, true, true, true]);
    expect([isFoodGoal('p', 5), isFoodGoal('p', 122), isFoodGoal('fa', 305), isFoodGoal('c', 15), isFoodGoal('s', 7.3), isFoodGoal('s', 21), isFoodGoal('p', '120')])
      .toEqual([false, false, false, false, false, false, false]);
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
  it('a day skipped stays skipped, whichever op comes first: the newer kept, with both’s skips within its days', () => {
    const held = rep('r0000004', 'A', T + 1, { sk: ['2026-11-04', '2026-11-05'] }); // a phone made 11/04 and 11/05 ordinary
    const stop = rep('r0000004', 'A', T + 2, { to: '2026-11-04' }); // the other, not fetched yet, stopped it
    const kept = { ...stop, sk: ['2026-11-04'] };
    expect(repeatAccept(held, stop)).toEqual({ v: 'append', keep: kept });
    expect(repeatAccept(stop, held)).toEqual({ v: 'stale', keep: kept });
    expect(repeatAccept(kept, held)).toEqual({ v: 'stale', keep: null }); // nothing new: the one held, unchanged
    for (const ops of [[held, stop], [stop, held]]) expect(foodRepeatFold(ops)).toEqual([kept]);
    // a removal stays final, someone else's op stays refused
    expect(repeatAccept(held, { id: 'r0000004', at: T + 2, rm: true, who: 'A' }).keep).toMatchObject({ rm: true });
    expect(repeatAccept(held, { ...stop, who: 'B' })).toEqual({ v: 'forbidden', keep: null });
  });
  it('`nx` (the repeat an end is followed by) is read, never kept', () => {
    expect(foodRepeatOp({ ...ok, to: '2026-11-03', nx: 'rabcdef2' })).toEqual({ ...ok, to: '2026-11-03' });
    expect(foodRepeatOp({ id: 'rabcdef1', at: T, rm: true, nx: 'rabcdef2' })).toEqual({ id: 'rabcdef1', at: T, rm: true });
    expect(repeatNext({ nx: 'rabcdef2' })).toBe('rabcdef2');
    for (const nx of ['fabcdef2', 5, null]) expect(foodRepeatOp({ ...ok, nx })).toBeNull();
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
});

describe('food_custom', () => {
  const BENTO = { id: 'mabcdef1', at: T, n: '会社の弁当', u: '1個', k: 650 };
  const ONIGIRI = { id: 'mabcdef2', at: T, n: 'おにぎり', u: '1個', g: 110, k: 180, p: 3, fa: null, c: 39.6 };
  it('reads a set and a removal, known keys only, normalized', () => {
    expect(foodCustomOp({ ...BENTO, n: ' 会社の\u0007弁当\n', u: ' 1\t個 ' })).toEqual({ ...BENTO, u: '1 個', p: null, fa: null, c: null, s: null });
    expect(foodCustomOp(ONIGIRI)).toEqual({ ...ONIGIRI, s: null });
    expect(foodCustomOp({ ...ONIGIRI, g: 110.0 })).toMatchObject({ g: 110 });
    expect(foodCustomOp({ ...BENTO, n: 'あ'.repeat(40), u: 'い'.repeat(30) })).toMatchObject({ n: 'あ'.repeat(CUSTOM.nameChars), u: 'い'.repeat(CUSTOM.labelChars) });
    expect(foodCustomOp({ id: 'mabcdef1', at: T, rm: true })).toEqual({ id: 'mabcdef1', at: T, rm: true });
    expect(newCustomId(T)).toMatch(/^m[0-9a-z]{6,24}$/);
    expect(foodCustomOp({ ...BENTO, id: newCustomId(T) })).not.toBeNull();
  });
  it('refuses anything malformed, and a weighed serving denser than a food', () => {
    for (const d of [
      null, { ...BENTO, id: 'cabcdef1' }, { ...BENTO, id: 'm123' }, { ...BENTO, at: 5 }, { ...BENTO, n: '' }, { ...BENTO, n: 5 }, { ...BENTO, u: ' ' },
      { ...BENTO, k: 5001 }, { ...BENTO, k: '650' }, { ...BENTO, g: 0 }, { ...BENTO, g: 5000.1 }, { ...BENTO, g: 1.25 }, { ...BENTO, p: 500.1 },
      { ...BENTO, s: -1 }, { ...BENTO, x: 1 }, { id: 'mabcdef1', at: T, rm: true, n: 'x' }, { id: 'mabcdef1', at: T, rm: 1 },
      { ...BENTO, g: 50, k: 476 }, { ...BENTO, g: 10, p: 10.1 }
    ]) expect(foodCustomOp(d)).toBeNull();
    expect(foodCustomOp({ ...BENTO, g: 50, k: 475, p: 50 })).not.toBeNull();
    expect(customDensityOk({ k: 5000 })).toBe(true);
    expect(customDensityOk({ g: 100, k: 950, s: 100 })).toBe(true);
    expect(customDensityOk({ g: 100, k: 951 })).toBe(false);
    expect(customDensityOk({ g: 20, k: 10, fa: 21 })).toBe(false);
  });
  it('keeps each one’s latest op, its owner’s alone, latest changed first', () => {
    const op = (id: string, who: 'A' | 'B' | 'G', at: number, k = 100) => ({ ...(foodCustomOp({ ...BENTO, id, at, k }) as object), who }) as CustomOp & { who: 'A' | 'B' | 'G' };
    const out = foodCustomFold([op('mabcdef1', 'A', T, 1), op('mabcdef1', 'A', T + 2, 2), op('mabcdef1', 'B', T + 3, 3), op('mabcdef2', 'G', T + 1), op('mabcdef1', 'A', T + 1, 9)]);
    expect(out.map((c) => [c.id, c.who, c.k])).toEqual([['mabcdef1', 'A', 2], ['mabcdef2', 'G', 100]]);
    expect(foodCustomFold([op('mabcdef1', 'A', T), { id: 'mabcdef1', at: T + 1, rm: true, who: 'A' }, op('mabcdef1', 'A', T + 2)])).toEqual([]);
  });
  it('as a food: per 100 g of a weighed serving; a serving with no weight a nominal 100 g at its own values (`sv`)', () => {
    const o = foodCustomOp(ONIGIRI) as typeof ONIGIRI & { s: null };
    const f = customSnap(o, '1個');
    expect(f).toEqual({ id: 'custom:mabcdef2', n: 'おにぎり', k: 163.6, p: 2.73, fa: null, c: 36, s: null, u: '1個' });
    expect(customGrams(o)).toBe(110);
    expect(customPortions(o)).toEqual([{ label: '1個', g: 110 }, { label: '100g', g: 100 }]);
    expect(customPortions({ u: '100g入り', g: 100 })).toEqual([{ label: '100g入り', g: 100 }]);
    expect(foodOp({ id: 'fabcdef1', at: T, d: '2026-11-03', m: 'l', g: 110, f })).toMatchObject({ g: 110, f });
    expect((f.k * 110) / 100).toBeCloseTo(180, 0);
    // no weight: 1 serving = 100 g, its values per serving even over a food's 950 kcal per 100 g
    const b = foodCustomOp({ ...BENTO, k: 1200, s: 4.5 }) as typeof BENTO & { p: null; fa: null; c: null; s: number };
    const fb = customSnap(b);
    expect(fb).toEqual({ id: 'custom:mabcdef1', n: '会社の弁当', k: 1200, p: null, fa: null, c: null, s: 4.5, sv: true });
    expect(customPortions(b)).toEqual([{ label: '1個', g: 100 }]);
    expect(foodOp({ id: 'fabcdef1', at: T, d: '2026-11-03', m: 'l', g: 150, f: fb })).toMatchObject({ g: 150, f: fb });
    // a snapshot's `sv`: only true; per-serving limits with it, a food's without
    const snap = (f: object) => (foodOp({ id: 'fabcdef1', at: T, d: '2026-11-03', m: 'l', g: 100, f }) as { f?: object } | null)?.f;
    expect(snap({ ...fb, sv: false })).toBeUndefined();
    expect(snap({ ...fb, sv: 1 })).toBeUndefined();
    expect(snap({ ...fb, sv: undefined })).toBeUndefined();
    expect(snap({ ...fb, k: 5000, p: 500 })).toMatchObject({ k: 5000, p: 500, sv: true });
    expect(snap({ ...fb, k: 5001 })).toBeUndefined();
  });
  it('as a recipe’s ingredient: by weight as any food; with no weight, the recipe a serving per nominal 100 g (`sv`)', () => {
    const o = customSnap(foodCustomOp(ONIGIRI) as typeof ONIGIRI & { s: null });
    expect(foodRecipeOp({ id: 'cabcdef1', at: T, n: 'おにぎり定食', sv: 1, it: [{ g: 110, f: o }, { g: 100, f: RICE }] })).not.toBeNull();
    const bento = customSnap(foodCustomOp({ ...BENTO, k: 1200, p: 40 }) as typeof BENTO & { p: number; fa: null; c: null; s: null });
    const r = foodRecipeOp({ id: 'cabcdef2', at: T, n: '弁当とごはん', sv: 2, it: [{ g: 200, f: bento }, { g: 150, f: RICE }] }) as Extract<RecipeOp, { n: string }>;
    expect(r.it[0].f.sv).toBe(true);
    const f = recipeSnap(r, '1人前');
    // two bentos and 150 g of rice, over two servings
    expect(f).toEqual({ id: 'recipe:cabcdef2', n: '弁当とごはん', k: 1317, p: 41.88, fa: 0.23, c: 27.83, s: 0, u: '1人前', sv: true });
    expect(recipePortion(r)).toEqual({ label: '1人前', g: 100 });
    expect(foodOp({ id: 'fabcdef1', at: T, d: '2026-11-03', m: 'l', g: 100, f })).toMatchObject({ f });
    // without one, nothing changes
    expect(recipeSnap({ ...r, it: [{ g: 150, f: RICE }] }).sv).toBeUndefined();
  });
});

describe('fibre and alcohol (`fi`, `al`: optional, since 2026-11-05)', () => {
  const BEER = { id: 'mext:16006', n: 'ビール', k: 39, p: 0.3, fa: 0, c: 3.1, s: 0, fi: 0, al: 3.7 };
  const op = (f: unknown) => foodOp({ id: 'fabcdef1', at: T, d: '2026-11-03', m: 'd', g: 350, f }) as Extract<FoodOp, { d: string }> | null;
  const round2 = (v: number | null) => (v === null ? null : Math.round(v * 100) / 100);
  it('a snapshot keeps them when known, drops them when null or absent; an old-format one reads as before', () => {
    const { fi: _fi, al: _al, ...bare } = BEER;
    const got = [
      op(BEER)?.f, op({ ...BEER, fi: null, al: undefined })?.f, op(RICE)?.f, op({ ...BEER, fi: 100, al: 0 })?.f,
      (foodRepeatOp({ id: 'rabcdef1', at: T, m: 'b', it: [{ g: 350, f: BEER }], w: 127, from: '2026-11-03' }) as Extract<RepeatOp, { m: string }>).it[0].f, Object.keys(op(RICE)!.f)
    ];
    expect(got).toEqual([BEER, bare, RICE, { ...BEER, fi: 100, al: 0 }, BEER, ['id', 'n', 'k', 'p', 'fa', 'c', 's']]);
  });
  it('refuses them out of bounds or not numbers (a serving’s, `sv`, up to 500 g)', () => {
    const bad = [{ ...BEER, fi: -0.1 }, { ...BEER, al: 100.1 }, { ...BEER, fi: '2' }, { ...BEER, al: Infinity }, { ...BEER, al: true }, { ...BEER, sv: true, al: 501 }];
    expect([...bad.map((f) => op(f)), op({ ...BEER, sv: true, al: 500 })?.f.al]).toEqual([null, null, null, null, null, null, 500]);
  });
  it('a recipe sums them (absent when no ingredient knows one), a custom food takes them per serving', () => {
    const it = [{ g: 350, f: BEER }, { g: 150, f: RICE }];
    const t = recipeTotals(it);
    const snap = recipeSnap({ id: 'cabcdef1', n: 'ビールとごはん', sv: 1, it });
    const plain = recipeSnap({ id: 'cabcdef1', n: 'ごはん', sv: 1, it: [{ g: 150, f: RICE }] });
    const c = foodCustomOp({ id: 'mabcdef1', at: T, n: 'ハイボール', u: '1杯', g: 350, k: 150, p: 0, fa: 0, c: 0, s: 0, fi: null, al: 28 }) as Extract<CustomOp, { n: string }>;
    const got = [
      [t.fi, round2(t.al)], [snap.fi, snap.al], 'fi' in plain || 'al' in plain, customSnap(c), 'fi' in c,
      foodCustomOp({ id: 'mabcdef1', at: T, n: 'x', u: '1杯', k: 1, p: null, fa: null, c: null, s: null, al: 501 }),
      foodCustomOp({ id: 'mabcdef1', at: T, n: 'x', u: '1杯', g: 10, k: 1, p: null, fa: null, c: null, s: null, fi: 11 })
    ];
    expect(got).toEqual([[0, 12.95], [0, 2.59], false, { id: 'custom:mabcdef1', n: 'ハイボール', k: 42.9, p: 0, fa: 0, c: 0, s: 0, al: 8 }, false, null, null]);
  });
});

