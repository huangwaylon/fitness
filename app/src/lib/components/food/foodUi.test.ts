// ごはん's helpers (foodUi.ts): a portion in words, the snapshot's own portion, the amount's start and step, the 最近
// list, the kcal goal field and its chip, the repeat's days and the same-items check, the search's duplicates.
import { describe, expect, it } from 'vitest';
import '#lib/i18n/food.ts';
import type { FoodCustom, FoodEntry, FoodSnap } from '#lib/contract/food.ts';
import type { Item, Portion } from '#lib/food/index.ts';
import {
  amountText, customDraft, customErrors, customItem, customOf, DAYS, daysText, defaultPortion, goalChip, itemOf, KCAL_GOAL_MIN, matchPortion,
  parseAmount, parseKcalGoal, portionLabel, portionText, recentOf, sameItems, servingText, startOf, stepOf, uniqueItems, unitOf
} from './foodUi.ts';

const snap = (id: string, u?: string): FoodSnap => ({ id, n: id, k: 156, p: 2.5, fa: 0.3, c: 37.1, s: 0, ...(u ? { u } : {}) });
const entry = (id: string, f: FoodSnap, g: number): FoodEntry => ({ id, at: 0, d: '2026-11-04', m: 'b', g, f }) as FoodEntry;

describe('portionText / amountText: one format, a weight never twice', () => {
  it('adds the weight to a label without one, keeps a label that says it', () => {
    expect(portionText('茶碗1杯', 150)).toBe('茶碗1杯（150g）');
    expect(portionText('1パック（110g）', 110)).toBe('1パック（110g）');
    expect(portionText('1杯（150ml）', 150)).toBe('1杯（150ml）');
    expect(portionText(null, 85.5)).toBe('85.5g');
  });
  it('×n: the label without its own weight, the total once', () => {
    expect(portionText('1パック（110g）×2', 220)).toBe('1パック×2（220g）');
    expect(portionText('中ジョッキ（350ml）×2', 700)).toBe('中ジョッキ×2（700ml）');
    expect(portionText('茶碗1杯×1.5', 225)).toBe('茶碗1杯×1.5（225g）');
    expect(portionText('200ml×2', 400)).toBe('400ml');
  });
  it('reads an entry', () => {
    expect(amountText(entry('e', snap('mext:1', '茶碗1杯'), 150))).toBe('茶碗1杯（150g）');
    expect(amountText(entry('e', snap('mext:1'), 120))).toBe('120g');
    expect([unitOf('中ジョッキ（350ml）'), unitOf('1本'), unitOf(null)]).toEqual(['ml', 'g', 'g']);
  });
});

describe('itemOf: a snapshot as an item', () => {
  it('without the catalog: its values and the portion it was logged by', () => {
    const it = itemOf(snap('mext:1', '茶碗1杯×2'), null, 300);
    expect(it).toMatchObject({ id: 'mext:1', kcal: 156, f: 0.3, salt: 0, portions: [{ label: '茶碗1杯', g: 150 }] });
    expect(itemOf(snap('mext:1', '100g'), null, 100).portions).toBeUndefined();
    expect(itemOf(snap('mext:1'), null, 80).portions).toBeUndefined();
  });
  it('with the catalog: its portions, the snapshot’s values', () => {
    const cat: Item = { id: 'mext:1', name: 'ごはん', kcal: 160, portions: [{ label: '茶碗1杯', g: 150 }, { label: '小盛り', g: 100 }] };
    const db = { entries: [{ it: cat }] } as unknown as Parameters<typeof itemOf>[1];
    expect(itemOf(snap('mext:1', '茶碗1杯'), db, 150)).toMatchObject({ kcal: 156, portions: cat.portions });
  });
});

describe('the amount: start, step, label', () => {
  const ps: Portion[] = [{ label: '茶碗1杯', g: 150 }, { label: '小盛り', g: 100 }, { label: '100g', g: 100 }];
  it('starts on the portion named, else one that makes the grams, else typed grams', () => {
    expect(startOf(ps)).toEqual({ pi: 0, mult: 1, custom: false });
    expect(startOf(ps, 300, '茶碗1杯×2')).toEqual({ pi: 0, mult: 2, custom: false });
    expect(startOf(ps, 50, '小盛り×0.5')).toEqual({ pi: 1, mult: 0.5, custom: false });
    expect(startOf(ps, 225)).toEqual({ pi: 0, mult: 1.5, custom: false });
    expect(startOf(ps, 123)).toEqual({ pi: 0, mult: 1, custom: true });
    expect(startOf(ps, 999, '茶碗1杯')).toEqual({ pi: 0, mult: 1, custom: true }); // the label no longer makes the grams
  });
  it('matches half multiples, ×1 first', () => {
    expect(matchPortion(ps, 100)).toEqual({ pi: 1, mult: 1 });
    expect(matchPortion(ps, 75)).toEqual({ pi: 0, mult: 0.5 });
    expect(matchPortion(ps, 7)).toBeNull();
  });
  it('steps a whole one for counted things, a half for rice, 人前 and weights', () => {
    for (const l of ['1本', '1個', '1缶', '1枚', '2切れ', '1貫', '1パック（110g）', '中ジョッキ（350ml）', '1/2枚']) expect(stepOf(l), l).toBe(1);
    for (const l of ['茶碗1杯', '1人前', '100g', '200ml', '1食分']) expect(stepOf(l), l).toBe(0.5);
  });
  it('keeps no label for 100 g or ml', () => {
    expect(portionLabel(ps[0], 1)).toBe('茶碗1杯');
    expect(portionLabel(ps[0], 2)).toBe('茶碗1杯×2');
    expect(portionLabel({ label: '100ml', g: 100 }, 2)).toBeNull();
    expect(portionLabel(null, 1)).toBeNull();
  });
  it('the search row’s default portion, in words', () => {
    expect(defaultPortion({ id: 'x', name: 'ごはん', kcal: 156, portions: [ps[0]] })).toEqual({ label: '茶碗1杯（150g）', kcal: 234 });
    expect(defaultPortion({ id: 'x', name: '?', kcal: 50 })).toEqual({ label: '100g', kcal: 50 });
  });
});

describe('lists', () => {
  it('さいきん: my latest entry of each food, newest first', () => {
    const a = entry('1', snap('a'), 10), b = entry('2', snap('b'), 20), a2 = entry('3', snap('a'), 30);
    expect(recentOf([a2, b, a]).map((e) => e.id)).toEqual(['3', '2']);
    expect(recentOf([a2, b, a], 1).map((e) => e.id)).toEqual(['3']);
  });
  it('the same name, brand and kcal once', () => {
    const it = (id: string, name: string, kcal: number, brand?: string): Item => ({ id, name, kcal, brand });
    expect(uniqueItems([it('1', 'サラダチキン', 104), it('2', 'サラダチキン', 104), it('3', 'サラダチキン', 104, 'X'), it('4', 'サラダチキン', 120)]).map((i) => i.id))
      .toEqual(['1', '3', '4']);
  });
  it('a meal is its repeat’s when the foods and amounts are, not the ids', () => {
    const x = [{ g: 150, f: { id: 'a' } }, { g: 45, f: { id: 'b' } }];
    expect(sameItems(x, [{ g: 150, f: { id: 'a' } }, { g: 45, f: { id: 'b' } }])).toBe(true);
    expect(sameItems(x, [{ g: 150, f: { id: 'a' } }])).toBe(false);
    expect(sameItems(x, [{ g: 225, f: { id: 'a' } }, { g: 45, f: { id: 'b' } }])).toBe(false);
  });
});

describe('the kcal goal', () => {
  it('reads a typed goal from 1,200 in whole steps', () => {
    expect(KCAL_GOAL_MIN).toBe(1200);
    for (const [s, v] of [['1800', 1800], ['2,000', 2000], ['１８００', 1800], ['1850 kcal', 1850], ['1200', 1200]] as const) expect(parseKcalGoal(s), s).toBe(v);
    for (const s of ['1000', '1150', '1825', '5050', 'abc', '']) expect(parseKcalGoal(s), s).toBeNull();
  });
  it('today あと / オーバー, a past day 少なめ / 多め; coral only past 20 % over', () => {
    expect(goalChip(1500, 2000, true)).toEqual({ text: 'あと 500 kcal', over: false });
    expect(goalChip(2300, 2000, true)).toEqual({ text: '300 kcal オーバー', over: false });
    expect(goalChip(2500, 2000, true)).toEqual({ text: '500 kcal オーバー', over: true });
    expect(goalChip(1500, 2000, false)).toEqual({ text: '目標より 500 kcal 少なめ', over: false });
    expect(goalChip(2600, 2000, false)).toEqual({ text: '目標より 600 kcal 多め', over: true });
  });
});

describe('daysText', () => {
  it('names the presets, else the days', () => {
    expect([daysText(DAYS.every), daysText(DAYS.weekdays), daysText(DAYS.weekends)]).toEqual(['毎日', '平日', '週末']);
    expect(daysText(0b0010101)).toBe('月水金');
  });
});

describe('マイ食品: the editor\'s fields, a custom food as a food', () => {
  const bento: FoodCustom = { id: 'mabc1234', at: 1, who: 'A', n: '会社の弁当', u: '1食', k: 650, p: null, fa: null, c: null, s: null };
  const bar: FoodCustom = { id: 'mabc5678', at: 1, who: 'B', n: 'プロテインバー', u: '1本', g: 120, k: 240, p: 20, fa: 8, c: 22, s: 0.4 };
  it('reads amounts as typed: full-width, a decimal comma, a unit; blank is null, nonsense undefined', () => {
    expect(parseAmount('６５０', 0, 5000)).toBe(650);
    expect(parseAmount('１２．５ g', 0, 500)).toBe(12.5);
    expect(parseAmount('12,25', 0, 500)).toBe(12.3);
    // (thousands commas, as the kcal goal reads them: never 1,200 → 1.2)
    expect(parseAmount('1,200', 0, 5000)).toBe(1200);
    expect(parseAmount('１，２００ kcal', 0, 5000)).toBe(1200);
    expect(parseAmount('1,200.5', 0, 5000)).toBe(1200.5);
    expect(parseAmount('1,2,3', 0, 5000)).toBeUndefined();
    expect(parseAmount(' ', 0, 500)).toBeNull();
    expect(parseAmount('abc', 0, 500)).toBeUndefined();
    expect(parseAmount('6000', 0, 5000)).toBeUndefined();
  });
  it('needs a name and kcal; the weight and nutrients may be blank; a weight too light for the kcal is wrong', () => {
    const d = customDraft(null, '  会社の弁当 ');
    expect(d).toMatchObject({ n: '会社の弁当', u: '1食', g: '', k: '' });
    expect([...customErrors(d)]).toEqual(['k']);
    expect(customErrors({ ...d, k: '６５０' }).size).toBe(0);
    expect(customOf({ ...d, k: '６５０' })).toEqual({ n: '会社の弁当', u: '1食', k: 650, p: null, fa: null, c: null, s: null });
    expect(customOf({ ...d, k: '１，２００' })).toMatchObject({ k: 1200 });
    expect([...customErrors({ ...d, k: '650', g: '10' })]).toEqual(['g']); // 6,500 kcal per 100 g
    expect([...customErrors({ ...d, n: ' ', k: '650', p: 'x' })]).toEqual(['n', 'p']);
    expect(customOf({ ...d, u: ' ', k: '240', g: '120', p: '20' })).toMatchObject({ u: '1食', g: 120, p: 20 });
  });
  it('a saved one round-trips through the editor', () => {
    expect(customOf(customDraft(bar))).toEqual({ n: bar.n, u: bar.u, g: 120, k: 240, p: 20, fa: 8, c: 22, s: 0.4 });
    expect(customDraft(bento).g).toBe('');
  });
  it('as a food: per 100 g with its serving first; no weight: one nominal serving, shown without grams', () => {
    expect(customItem(bar)).toMatchObject({ id: 'custom:mabc5678', kcal: 200, portions: [{ label: '1本', g: 120 }, { label: '100g', g: 100 }] });
    expect(customItem(bento).portions).toEqual([{ label: '1食', g: 100 }]);
    expect(servingText(bento)).toBe('1食');
    expect(servingText(bar)).toBe('1本（120g）');
    const sv: FoodSnap = { ...snap('custom:mabc1234'), sv: true, u: '1食×2' };
    expect(amountText(entry('e', sv, 200))).toBe('1食×2');
    expect(amountText(entry('e', { ...sv, u: undefined }, 100))).toBe('×1');
  });
});
