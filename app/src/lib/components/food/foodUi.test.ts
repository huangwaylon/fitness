// ごはん's helpers (foodUi.ts): a portion in words, the snapshot's own portion, the amount's start and step, the 最近
// list, a row's everyday name, the kcal goal field and its chip, the repeat's days and the same-items check, and a
// recipe's picture box (which ingredients it shows).
import { describe, expect, it } from 'vitest';
import '#lib/i18n/food.ts';
import type { FoodCustom, FoodEntry, FoodSnap } from '#lib/contract/food.ts';
import type { Item, Portion } from '#lib/food/index.ts';
import {
  amountText, customDraft, customErrors, customItem, customOf, DAYS, daysText, defaultPortion, glossOf, goalChip, itemOf, matchPortion,
  parseAmount, portionLabel, portionText, quickDraft, quickErrors, quickSnap, recentOf, sameItems, servingText, startOf, stateItem, stepOf, typedKcal,
  catOf, plateOf, recipeIdOf, recipePlate
} from './foodUi.ts';
import type { FoodImageIndex } from '#lib/food/images.ts';
import { unitOf } from '#lib/food/index.ts';
import { foodOp } from '#lib/contract/food.ts';

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
    const db = { entries: [{ it: cat }], byId: new Map([[cat.id, cat]]) } as unknown as Parameters<typeof itemOf>[1];
    expect(itemOf(snap('mext:1', '茶碗1杯'), db, 150)).toMatchObject({ kcal: 156, portions: cat.portions });
  });
});

describe('stateItem: a state keeps the food’s name and portions', () => {
  const raw: Item = { id: 'mext:11123', vg: 'mext:11123', st: '生', name: '豚ロース 脂身つき 生', kcal: 248,
    portions: [{ label: '1枚（とんかつ用）', g: 120 }, { label: '薄切り1枚', g: 20 }, { label: '1人前', g: 100 }, { label: '100g', g: 100 }] };
  it('the cut’s words kept, the portions through the yield (1枚 120 g → 90 g: ×0.75)', () => {
    const yaki: Item = { id: 'mext:11124', vg: 'mext:11123', st: '焼き', name: '豚ロース 焼き', kcal: 310, portions: [{ label: '1枚', g: 90 }, { label: '100g', g: 100 }] };
    expect(stateItem(raw, yaki)).toMatchObject({ id: 'mext:11124', name: '豚ロース 脂身つき 焼き', kcal: 310,
      portions: [{ label: '1枚（とんかつ用）', g: 90 }, { label: '薄切り1枚', g: 15 }, { label: '1人前', g: 75 }] });
  });
  it('no pair to take a yield from: the state’s own portions; the default itself unchanged; a name of its own kept', () => {
    const yude: Item = { id: 'mext:11125', vg: 'mext:11123', st: 'ゆで', name: '豚ロース 脂身つき ゆで', kcal: 299, portions: [{ label: '100g', g: 100 }] };
    expect(stateItem(raw, yude)).toMatchObject({ name: '豚ロース 脂身つき ゆで', portions: [{ label: '100g', g: 100 }] });
    expect(stateItem(raw, raw)).toBe(raw);
    const imo: Item = { id: 'x:2', vg: 'x:1', st: '焼き', name: '焼きいも', kcal: 151 };
    expect(stateItem({ id: 'x:1', vg: 'x:1', st: '生', name: 'さつまいも 生', kcal: 126 }, imo).name).toBe('焼きいも');
  });
});

describe('glossOf: a row’s everyday name, never its own again', () => {
  const item = (name: string, gloss?: string): Item => ({ id: 'mext:1', name, aliases: ['とりももにく'], kcal: 1, en: 'An English name', ...(gloss ? { gloss } : {}) });
  it('the catalog’s name for an older one, else the data’s vetted gloss; never an alias or the English', () => {
    const thigh = item('鶏もも肉 皮つき 生');
    expect(glossOf(thigh, '若どり もも 皮つき 生')).toBe('鶏もも肉');
    expect(glossOf(thigh)).toBeNull();
    expect(glossOf(item('キャッサバでん粉', 'タピオカ'))).toBe('タピオカ');
    expect(glossOf(item('コーヒー牛乳'))).toBeNull();
  });
  it('nothing that is only the name again: a part of it, more of it, mostly its characters', () => {
    expect(glossOf(item('ごはん（精白米）'), 'ごはん')).toBeNull(); // the older name holds the head
    expect(glossOf(item('木綿豆腐', '豆腐'))).toBeNull(); // a part of it
    expect(glossOf(item('焼き鮭', '焼鮭'))).toBeNull(); // mostly its own characters
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
  it('steps a piece food’s 1人前 by the piece (おにぎり ＋ is one more, not ×1.5); a dish’s by half', () => {
    const fails: string[] = [];
    for (const n of ['おにぎり（鮭）', '塩むすび', '天むす', 'ゆで卵', '温泉卵', '目玉焼き', 'ハンバーグ', 'ホットドッグ', '梅干し（1個）']) if (stepOf('1人前', n) !== 1) fails.push(n);
    for (const n of ['カレーライス（ポーク）', '親子丼', '肉じゃが', '味噌汁（豆腐とわかめ）', '']) if (stepOf('1人前', n) !== 0.5) fails.push(n);
    if (stepOf('茶碗1杯', 'おにぎり（鮭）') !== 0.5 || stepOf('100g', 'ゆで卵') !== 0.5) fails.push('rice and grams stay by half');
    expect(fails).toEqual([]);
  });
  it('keeps no label for 100 g or ml', () => {
    expect(portionLabel(ps[0], 1)).toBe('茶碗1杯');
    expect(portionLabel(ps[0], 2)).toBe('茶碗1杯×2');
    expect(portionLabel({ label: '100ml', g: 100 }, 2)).toBeNull();
    expect(portionLabel(null, 1)).toBeNull();
  });
  it('the search row’s default portion, in words', () => {
    expect(defaultPortion({ id: 'x', name: 'ごはん', kcal: 156, portions: [ps[0]] })).toEqual({ label: '茶碗1杯 150g', kcal: 234 });
    expect(defaultPortion({ id: 'x', name: '豚ロース', kcal: 248, portions: [{ label: '1枚（とんかつ用）（120g）', g: 120 }] }).label).toBe('1枚 120g');
    expect(defaultPortion({ id: 'x', name: '水', kcal: 0, portions: [{ label: '1杯（200ml）', g: 200 }] }).label).toBe('1杯 200ml');
    expect(defaultPortion({ id: 'x', name: '?', kcal: 50 })).toEqual({ label: '100g', kcal: 50 });
    expect(defaultPortion({ id: 'kal:1', name: '牛丼', kcal: 733, sv: true, portions: [{ label: '1食', g: 100 }] })).toEqual({ label: '1食', kcal: 733 });
  });
});

describe('lists', () => {
  it('さいきん: my latest entry of each food, newest first', () => {
    const a = entry('1', snap('a'), 10), b = entry('2', snap('b'), 20), a2 = entry('3', snap('a'), 30);
    expect(recentOf([a2, b, a]).map((e) => e.id)).toEqual(['3', '2']);
    expect(recentOf([a2, b, a], 1).map((e) => e.id)).toEqual(['3']);
  });
  it('a meal is its repeat’s when the foods and amounts are, not the ids', () => {
    const x = [{ g: 150, f: { id: 'a' } }, { g: 45, f: { id: 'b' } }];
    expect(sameItems(x, [{ g: 150, f: { id: 'a' } }, { g: 45, f: { id: 'b' } }])).toBe(true);
    expect(sameItems(x, [{ g: 150, f: { id: 'a' } }])).toBe(false);
    expect(sameItems(x, [{ g: 225, f: { id: 'a' } }, { g: 45, f: { id: 'b' } }])).toBe(false);
  });
});

describe('the kcal goal', () => {
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
    expect(parseAmount('1,200', 0.1, 5000)).toBe(1200); // the amount's grams: thousands, not 1.2 g
    expect(parseAmount('150g', 0.1, 5000)).toBe(150);
    expect(parseAmount('200ml', 0.1, 5000)).toBe(200);
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
    expect(d).toMatchObject({ n: '会社の弁当', u: '', g: '', k: '' }); // 1食: the field's placeholder, not a value
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
    // fibre and alcohol: typed only when known, kept per serving, back in the editor; blank: not sent
    const hb = customOf({ ...customDraft(null, 'ハイボール'), u: '1杯', g: '350', k: '150', al: '２８', fi: 'x' });
    const hbOk = customOf({ ...customDraft(null, 'ハイボール'), u: '1杯', g: '350', k: '150', al: '２８' });
    expect([hb.fi, hbOk.al, 'fi' in hbOk, customDraft({ ...bar, fi: 3.5, al: undefined }).fi, customErrors({ ...customDraft(null, 'x'), k: '1', fi: '501' }).has('fi')])
      .toEqual([undefined, 28, false, '3.5', true]);
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

describe('クイック: kcal (and what else is known) as one entry, no food saved', () => {
  it('quickSnap: one serving (sv, 1食), its own quick: id, the name クイック unless typed; the record takes it as logged', () => {
    const f = quickSnap({ ...quickDraft('６５０'), p: '25' }, 'qabc1234');
    expect(f).toEqual({ id: 'quick:qabc1234', n: 'クイック', k: 650, p: 25, fa: null, c: null, s: null, u: '1食', sv: true });
    expect(quickSnap({ ...quickDraft('1,200'), n: ' 焼肉 ', fa: '60', c: '80', s: '4.5' }, 'q2')).toMatchObject({ n: '焼肉', k: 1200, fa: 60, c: 80, s: 4.5 });
    const op = foodOp({ id: 'fquick001', at: 1.8e12, d: '2026-11-05', m: 'd', g: 100, f });
    expect(op && !op.rm && op.f).toEqual(f);
  });
  it('quickErrors: kcal needed (0–5,000), the name may stay blank, a nutrient that doesn’t read is wrong', () => {
    expect([...quickErrors(quickDraft(''))]).toEqual(['k']);
    expect([...quickErrors(quickDraft('650'))]).toEqual([]);
    expect([...quickErrors(quickDraft('5001'))]).toEqual(['k']);
    expect([...quickErrors({ ...quickDraft('650'), p: 'abc' })]).toEqual(['p']);
  });
  it('typedKcal: a number typed in the search (full width, a comma, kcal after it); anything else null', () => {
    expect(['650', '６５０', '1,200', '800kcal', '450 kcal', '12.4'].map(typedKcal)).toEqual([650, 650, 1200, 800, 450, 12]);
    expect(['', 'ごはん', '0', '6000', '7-11', 'kcal', '1個'].map(typedKcal)).toEqual([null, null, null, null, null, null, null]);
  });
});

describe('マイレシピ: its picture box (recipePlate, plateOf) and a logged recipe’s id', () => {
  const it3 = (id: string, g: number) => ({ g, f: { id } });
  const pics = new Set(['rice', 'onion', 'chicken', 'potato', 'carrot']);
  const pictured = (id: string) => pics.has(id);

  it('the pictured ones first, then the most grams; at most four, drawn biggest first; a food once, its grams summed', () => {
    const items = [it3('chicken', 300), it3('roux', 900), it3('onion', 200), it3('potato', 300), it3('carrot', 150), it3('rice', 600), it3('onion', 250)];
    // roux (no picture) is the most grams, yet four pictured ones come before it; onion's 450 g together
    expect(recipePlate(items, pictured)).toEqual([{ id: 'rice', g: 600 }, { id: 'onion', g: 450 }, { id: 'chicken', g: 300 }, { id: 'potato', g: 300 }]);
  });

  it('fewer pictured than room: the rest by their tiles, in grams order; a tie keeps the listed order', () => {
    expect(recipePlate([it3('roux', 80), it3('rice', 600), it3('soy', 80)], pictured).map((x) => x.id)).toEqual(['rice', 'roux', 'soy']);
    expect(recipePlate([it3('a', 10), it3('b', 10)], () => false).map((x) => x.id)).toEqual(['a', 'b']);
    expect(recipePlate([], pictured)).toEqual([]);
  });

  it('plateOf: each cell its picture, else its category (none known: undefined, その他 at the box)', () => {
    const ix: FoodImageIndex = { v: 1, t: 128, d: 384, sheets: ['t-0.webp'], keys: [[0, 128, 0, 0, 0, 0]], ids: { 'mext:01088': 0 } };
    const parts = plateOf({ it: [{ g: 50, f: snap('off:4901', 'しょうゆ') }, { g: 600, f: snap('mext:01088', 'ごはん') }] }, ix, null, 48);
    expect(parts.map((p) => [p.img?.x ?? null, p.cat])).toEqual([[128, undefined], [null, undefined]]);
  });

  it('a logged recipe: its id from its snapshot, and the レシピ tile', () => {
    expect(recipeIdOf('recipe:cdemoa1')).toBe('cdemoa1');
    expect(recipeIdOf('mext:01088')).toBeNull();
    expect(recipeIdOf('custom:mdemoa1')).toBeNull();
    expect([catOf(null, 'recipe:cdemoa1'), catOf(null, 'cdemoa1'), catOf(null, 'custom:mdemoa1')]).toEqual(['レシピ', 'レシピ', undefined]);
  });
});
