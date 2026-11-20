// ごはん's helpers (foodUi.ts, portions.ts, drafts.ts): a portion in words, the snapshot's own portion, the amount's start and step, the 最近
// list, a row's everyday name, the kcal goal field and its chip, the repeat's days and the same-items check, and a
// recipe's picture box (which ingredients it shows).
import { describe, expect, it } from 'vitest';
import '#lib/i18n/food.ts';
import type { FoodCustom, FoodEntry, FoodSnap } from '#lib/contract/food.ts';
import type { Item, Portion } from '#lib/food/index.ts';
import { DAYS, daysText, entryPfcCells, glossOf, goalChip, isBroth, itemOf, keptRows, KEPT_MAX, recentOf, sameItems, stateItem, catOf, kaloriPage, kaloriTrust, plateOf, recipeIdOf, recipePlate, recentShops, shopChips, stateGroups, stemName } from './foodUi.ts';
import { amountSteps, amountText, defaultPortion, matchPortion, portionLabel, portionText, startOf, stepOf, nextMult } from './portions.ts';
import { byJan, customDraft, customErrors, draftOf, customItem, janOf, customOf, parseAmount, quickDraft, quickErrors, quickSnap, seasoningLike, servingText, typedKcal } from './drafts.ts';
import { addDataset, emptyDb } from '#lib/food/db.ts';
import type { FoodImageIndex } from '#lib/food/images.ts';
import { weighHint, weighItem } from './recipeFlow.svelte.ts';
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

describe('stemName: a name without the states its chips show', () => {
  it('strips a MEXT state and a chain menu’s bracketed, spaced, glued or marked ones; else keeps the name', () => {
    const stem = (name: string, st: string) => stemName({ name, st });
    expect(stem('うどん（ゆで）', 'ゆで')).toBe('うどん');
    expect(stem('牛丼 並盛', '並盛')).toBe('牛丼');
    expect(stem('ココア（アイス）（Tall・豆乳）', 'アイス・Tall・豆乳')).toBe('ココア');
    expect(stem('ライス「中」', '中')).toBe('ライス');
    expect(stem('ライス中', '中')).toBe('ライス');
    expect(stem('ポテトＳ', 'Ｓ')).toBe('ポテト');
    expect(stem('TO アンチョビポテトM', 'M・持ち帰り')).toBe('アンチョビポテト');
    expect(stem('えびマヨ（お持ち帰り）', '持ち帰り')).toBe('えびマヨ');
    expect(stem('えびマヨ', '店内')).toBe('えびマヨ');
    expect(stem('カルボナーラ（食べ放題）', '食べ放題')).toBe('カルボナーラ');
    expect(stem('ICE BOX M', 'Tall')).toBe('ICE BOX M');
    expect(stem('焼きいも', '焼き')).toBe('焼きいも');
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
  it('counts the things you count, halves rice, 人前 and weights', () => {
    for (const l of ['1本', '1個', '1缶', '1枚', '2切れ', '1貫', '1パック（110g）', '中ジョッキ（350ml）', '1/2枚']) expect(stepOf(l), l).toBe('count');
    for (const l of ['茶碗1杯', '1人前', '100g', '200ml', '1食分']) expect(stepOf(l), l).toBe('half');
  });
  it('counts a piece food’s 1人前 (おにぎり); halves a dish’s', () => {
    const fails: string[] = [];
    for (const n of ['おにぎり（鮭）', '塩むすび', '天むす', 'ゆで卵', '温泉卵', '目玉焼き', 'ハンバーグ', 'ホットドッグ', '梅干し（1個）']) if (stepOf('1人前', n) !== 'count') fails.push(n);
    for (const n of ['カレーライス（ポーク）', '親子丼', '肉じゃが', '味噌汁（豆腐とわかめ）', '']) if (stepOf('1人前', n) !== 'half') fails.push(n);
    if (stepOf('茶碗1杯', 'おにぎり（鮭）') !== 'half' || stepOf('100g', 'ゆで卵') !== 'half') fails.push('rice and grams stay by half');
    expect(fails).toEqual([]);
  });
  it('the ladders: halves to ×2 then whole ones for counted portions, halves for the rest; ×0.5 to ×20', () => {
    const climb = (kind: 'count' | 'half', n: number) => {
      const out = [0.5];
      while (out.length < n) out.push(nextMult(out.at(-1)!, 1, kind));
      return out;
    };
    expect(climb('count', 7)).toEqual([0.5, 1, 1.5, 2, 3, 4, 5]);
    expect(climb('half', 6)).toEqual([0.5, 1, 1.5, 2, 2.5, 3]);
    expect(nextMult(3, -1, 'count')).toBe(2);
    expect(nextMult(2, -1, 'count')).toBe(1.5);
    for (const k of ['count', 'half'] as const) {
      expect(nextMult(0.5, -1, k), k).toBe(0.5);
      expect(nextMult(20, 1, k), k).toBe(20);
      expect(nextMult(19.5, 1, k), k).toBe(20);
    }
    // off the ladder (a ×2.5 saved before): the nearest rung each way
    expect([nextMult(2.5, 1, 'count'), nextMult(2.5, -1, 'count')]).toEqual([3, 2]);
  });
  it('reopens a half of an odd tenth at its portion (33.3 g ×0.5 is saved as 16.7)', () => {
    const apple = [{ label: '1個', g: 33.3 }];
    expect(startOf(apple, 16.7, '1個×0.5')).toEqual({ pi: 0, mult: 0.5, custom: false });
    expect(startOf(apple, 16.7)).toEqual({ pi: 0, mult: 0.5, custom: false });
    expect(startOf(apple, 16.6, '1個×0.5')).toEqual({ pi: 0, mult: 1, custom: true });
    expect(amountText(entry('e', snap('mext:1', '1個×0.5'), 16.7))).toBe('1個×0.5（16.7g）');
    expect(amountText(entry('e', { ...snap('my:1', '1食×0.5'), sv: true }, 50))).toBe('1食×0.5'); // a weightless serving
  });
  it('keeps no label for 100 g or ml', () => {
    expect(portionLabel(ps[0], 1)).toBe('茶碗1杯');
    expect(portionLabel(ps[0], 2)).toBe('茶碗1杯×2');
    expect(portionLabel({ label: '100ml', g: 100 }, 2)).toBeNull();
    expect(portionLabel(null, 1)).toBeNull();
  });
  it('the search row’s default portion, in words', () => {
    expect(defaultPortion({ id: 'x', name: 'ごはん', kcal: 156, portions: [ps[0]] })).toEqual({ label: '茶碗1杯（150g）', kcal: 234 });
    expect(defaultPortion({ id: 'x', name: '豚ロース', kcal: 248, portions: [{ label: '1枚（とんかつ用）（120g）', g: 120 }] }).label).toBe('1枚（120g）');
    expect(defaultPortion({ id: 'x', name: '水', kcal: 0, portions: [{ label: '1杯（200ml）', g: 200 }] }).label).toBe('1杯（200ml）');
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
  it('a product’s amount as a new one (表示値を確認’s 直す): its name, the portion as the serving, its values in it', () => {
    const cone: Item = { id: 'off:4901005312005', name: 'Giant - Cookies And Chocolate', cat: '菓子・デザート', kcal: 176, p: 36, f: 9.3, c: 19.7, salt: 0.1 };
    const d = draftOf(cone, 140, '1袋');
    expect(d).toEqual({ n: 'Giant - Cookies And Chocolate', u: '1袋', g: '140', k: '246', p: '50.4', fa: '13', c: '27.6', s: '0.1', fi: '' });
    expect(customErrors(d).size).toBe(0);
    expect(customOf({ ...d, p: '3.6' })).toEqual({ n: 'Giant - Cookies And Chocolate', u: '1袋', g: 140, k: 246, p: 3.6, fa: 13, c: 27.6, s: 0.1 });
    // (grams typed: no label, the field's 1食; a serving with no weight: none; a long name cut to the field's)
    expect(draftOf({ ...cone, name: 'あ'.repeat(40) }, 75, null)).toMatchObject({ n: 'あ'.repeat(30), u: '', g: '75' });
    expect(draftOf({ ...cone, sv: true }, 200, '1食×2')).toMatchObject({ u: '1食×2', g: '', k: '352', p: '72' });
  });
  it('a product’s barcode for its マイ食品 (its jan, else an off: id’s), and mine by barcode, the latest first', () => {
    expect([janOf({ id: 'off:4901005312005' }), janOf({ id: 'jbfd:x1', jan: '4901234567894' }), janOf({ id: 'jbfd:x2' }), janOf({ id: 'off:abc' }), janOf({ id: 'mext:01001' })])
      .toEqual(['4901005312005', '4901234567894', undefined, undefined, undefined]);
    const mine = { ...bar, who: 'A' as const, jan: '4901005312005' };
    const m = byJan([{ ...mine, id: 'mnew0001' }, mine, { ...bento, jan: '4901234567894', who: 'B' }, bento], 'A');
    expect([...m].map(([j, c]) => [j, c.id])).toEqual([['4901005312005', 'mnew0001']]);
  });
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
    // fibre: typed only when known, kept per serving, back in the editor; blank: not sent
    const sal = customOf({ ...customDraft(null, 'サラダ'), u: '1皿', g: '350', k: '150', fi: '４' });
    const bare = customOf({ ...customDraft(null, 'サラダ'), u: '1皿', g: '350', k: '150' });
    expect([sal.fi, 'fi' in bare, customDraft({ ...bar, fi: 3.5 }).fi, customErrors({ ...customDraft(null, 'x'), k: '1', fi: '501' }).has('fi')])
      .toEqual([4, false, '3.5', true]);
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
  it('quickSnap: one serving (sv, 1食), its own quick: id, the name カロリーだけ unless typed; the record takes it as logged', () => {
    const f = quickSnap({ ...quickDraft('６５０'), p: '25' }, 'qabc1234');
    expect(f).toEqual({ id: 'quick:qabc1234', n: 'カロリーだけ', k: 650, p: 25, fa: null, c: null, s: null, u: '1食', sv: true });
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

describe('the shop chips', () => {
  it('typing: two shops or more, at most six', () => {
    const shops = Array.from({ length: 8 }, (_, i) => ({ shop: `s${i}`, name: `店${i}`, n: 8 - i }));
    expect(shopChips(shops.slice(0, 1))).toEqual([]);
    expect(shopChips(shops.slice(0, 2)).map((s) => s.shop)).toEqual(['s0', 's1']);
    expect(shopChips(shops).length).toBe(6);
  });
  it('よく行く店: my chain menus’ shops of the last 30 days, the most entries first (a tie: the latest), at most four', async () => {
    const db = emptyDb({ version: 'x', datasets: [] });
    const shops = ['a', 'b', 'c', 'd', 'e', 'f'];
    const items: Item[] = shops.map((sh, i) => ({ id: `kal:${i}`, name: `x${i}`, brand: `店${sh}`, shop: sh, kcal: 100, sv: true }));
    await addDataset(db, { file: 'kalori', source: 'kalori', badge: '店', secondary: true, lazy: true }, { source: 'kalori', items });
    const e = (i: number, d: string) => ({ ...entry(`e${i}${d}`, snap(`kal:${i}`), 100), d });
    // newest first: f once today, b twice, a twice (b's latest newer), c and d once, e only 31 days back; a MEXT food
    const mine = [e(5, '2026-11-12'), e(1, '2026-11-11'), e(0, '2026-11-10'), entry('m', snap('mext:01088'), 150), e(0, '2026-11-09'), e(1, '2026-11-01'),
      e(2, '2026-10-20'), e(3, '2026-10-13'), e(4, '2026-10-12')];
    expect(recentShops(mine, db, '2026-10-13')).toEqual([{ shop: 'b', name: '店b' }, { shop: 'a', name: '店a' }, { shop: 'f', name: '店f' }, { shop: 'c', name: '店c' }]);
    expect(recentShops(mine.slice(3), db, '2026-11-01', 4).map((s) => s.shop)).toEqual(['a', 'b']);
    // no chain menus in the catalog (not in yet) or none of mine: none
    expect([recentShops(mine, null, '2026-10-13'), recentShops(mine, emptyDb({ version: 'x', datasets: [] }), '2026-10-13'), recentShops([], db, '')]).toEqual([[], [], []]);
  });
});

describe('kaloriTrust', () => {
  it('a chain menu’s values’ trust, 販売終了かも after it when it may be gone; none for another food', () => {
    const kal = { id: 'kal:57551', shop: 'sukiya' };
    expect([kaloriTrust(kal), kaloriTrust({ ...kal, est: 'p' }), kaloriTrust({ ...kal, est: 'e' })]).toEqual(['公式の値', '公式の値（PFCは推定）', '推定の値（AI）']);
    expect(kaloriTrust({ ...kal, est: 'p', ended: true })).toBe('公式の値（PFCは推定） · 販売終了かも');
    // kcal and P/F/C the shop's, fibre or salt estimated (kalori_convert.py `s`)
    expect([kaloriTrust({ ...kal, est: 's' }), kaloriTrust({ ...kal, est: 's', ended: true })]).toEqual(['公式の値（食物繊維・塩分は推定）', '公式の値（食物繊維・塩分は推定） · 販売終了かも']);
    expect(kaloriTrust({ id: 'mext:01088', ended: true })).toBeNull();
  });
});

describe('kaloriPage', () => {
  it('a chain menu’s page on kalori.jp; none for another food', () => {
    expect(kaloriPage({ id: 'kal:57551', shop: 'sukiya' })).toBe('https://kalori.jp/ja/shops/sukiya/products/57551/');
    expect([kaloriPage({ id: 'kal:57551' }), kaloriPage({ id: 'mext:01088', shop: 'x' }), kaloriPage({ id: 'kal:x1', shop: 'x' })]).toEqual([null, null, null]);
  });
});

describe('stateGroups: a chain menu’s states as サイズ and ミルク chips', () => {
  const v = (n: number, st: string, kcal: number): Item => ({ id: `kal:${n}`, name: `ラテ（${st}）`, shop: 'x', kcal, sv: true, vg: 'kal:1', st });
  const latte = [v(1, 'Tall・ミルク', 190), v(2, 'Grande・ミルク', 240), v(3, 'Tall・豆乳', 170), v(4, 'Grande・豆乳', 215), v(5, 'Short・ミルク', 140), v(6, 'Venti・アーモンドミルク', 230)];
  const view = (gs: ReturnType<typeof stateGroups>) => gs?.map((g) => [g.head, g.chips.map((c) => `${c.label}${c.on ? '*' : ''}→${c.to.id}`)]);
  it('splits on ・: the sizes smallest first, the milks the default’s first; a pick keeps the other word', () => {
    expect(view(stateGroups(latte, latte[3]))).toEqual([
      ['size', ['Short→kal:5', 'Tall→kal:3', 'Grande*→kal:4', 'Venti→kal:6']],
      ['milk', ['ミルク→kal:2', '豆乳*→kal:4', 'アーモンドミルク→kal:6']]
    ]);
    // the milk first in the name: still サイズ before ミルク
    const flipped = latte.map((x) => ({ ...x, st: x.st!.split('・').reverse().join('・') }));
    expect(stateGroups(flipped, flipped[0])?.map((g) => g.head)).toEqual(['size', 'milk']);
  });
  it('one word: one group (大盛 a size); states that don’t split alike: none', () => {
    const don = [v(1, '並盛', 700), v(2, '大盛', 950), v(3, 'ミニ', 500)];
    expect(view(stateGroups(don, don[0]))).toEqual([['size', ['ミニ→kal:3', '並盛*→kal:1', '大盛→kal:2']]]);
    expect(stateGroups([v(1, 'Tall・ミルク', 1), v(2, '大盛', 2)], v(1, 'Tall・ミルク', 1))).toBeNull();
  });
});

describe('keptRows: a dataset coming in never reshuffles the rows shown', () => {
  it('keeps the rows shown, in order, even past findFoods’ top; the new ones under them; the kept cut to KEPT_MAX in all', async () => {
    const it = (i: number, id = `x:${i}`): Item => ({ id, name: `ラテ${i}`, kcal: 1 });
    const shown = [it(1), it(2), it(3)];
    const db = emptyDb({ version: 'v', datasets: [] });
    await addDataset(db, { file: 'x.json', source: 'x', badge: 'x', secondary: false, lazy: false }, { source: 'x', items: shown });
    // the products came in: x:3 now past the top (not found), still the catalog's; x:9 a stale one, no longer in it
    const found = [it(1), ...Array.from({ length: 77 }, (_, i) => it(i, `off:${i}`))];
    const rows = keptRows([...shown, it(9)], found, db);
    expect(rows.slice(0, 4).map((x) => x.id)).toEqual(['x:1', 'x:2', 'x:3', 'off:0']);
    expect(rows.length).toBe(KEPT_MAX);
    expect(keptRows(shown, [it(2)], null).map((x) => x.id)).toEqual(['x:2']);
    // a full list, then the chain menus: the rows past the first 24 that fell out of the top make room for them
    const full = keptRows(rows, [it(1), ...Array.from({ length: 70 }, (_, i) => it(i, `off:${i}`)), ...Array.from({ length: 9 }, (_, i) => it(i, `kal:${i}`))], db);
    expect([full.length, full.filter((x) => x.id.startsWith('kal:')).length, full.slice(0, 24)]).toEqual([KEPT_MAX, 9, rows.slice(0, 24)]);
    // and again (another dataset, two new products): a kept row ranked high in the top stays, a low one makes room
    const again = keptRows(full, [...full.slice(0, 24), full[79], ...Array.from({ length: 2 }, (_, i) => it(i, `new:${i}`)), ...full.slice(24, 77)], db);
    expect([again.length, again.includes(full[79]), again.slice(-2).map((x) => x.id)]).toEqual([KEPT_MAX, true, ['new:0', 'new:1']]);
  });
});

describe('entryPfcCells: a row’s P · F · C as eaten', () => {
  const f = { p: 16.5, fa: 10, c: 0.4 };
  const goals = { p: 80, fa: 60, c: 280 }; // an eighth: 10 / 7.5 / 35 g; a quarter: 20 / 15 / 70 g
  const cells = (g: number, snap: { p: number | null; fa: number | null; c: number | null } = f) => entryPfcCells({ g, f: snap }, goals).map((c) => [c.k, c.text, c.tint]);
  it('whole grams, a trace under 1 g to one decimal, unknown 「–」 (never 0), tinted by the share of the day’s', () => {
    expect(cells(100)).toEqual([['p', '17', 1], ['fa', '10', 1], ['c', '0.4', 0]]);
    expect(cells(150)).toEqual([['p', '25', 2], ['fa', '15', 2], ['c', '0.6', 0]]); // 1.5: P 24.75, F 15
    expect(cells(50)).toEqual([['p', '8', 0], ['fa', '5', 0], ['c', '0.2', 0]]); // ½
    expect(cells(100, { p: 0, fa: null, c: 70 })).toEqual([['p', '0', 0], ['fa', '–', 0], ['c', '70', 2]]);
    expect(cells(150, { p: 0.3, fa: 0.3, c: 0.3 }).map((c) => c[1])).toEqual(['0.5', '0.5', '0.5']); // 0.45 half up, not 0.4 (0.3 × 1.5 is 0.4499…)
    expect(cells(100, { p: 0.96, fa: 0.94, c: 0 })).toEqual([['p', '1', 0], ['fa', '0.9', 0], ['c', '0', 0]]);
  });
});

describe('the search’s trip: an entry just added, its amount switched in place; a seasoning’s salt asked; クイック from a query', () => {
  it('amountSteps: its portion ×½ … ×3 (counted things to ×5), the ×n it has among them, each in amountText’s words', () => {
    const egg = entry('e1', { ...snap('mext:12004', '1個'), n: 'ゆで卵' }, 50);
    expect(amountSteps(egg).map((s) => s.text)).toEqual(['1個×0.5（25g）', '1個（50g）', '1個×1.5（75g）', '1個×2（100g）', '1個×3（150g）', '1個×4（200g）', '1個×5（250g）']);
    expect(amountSteps(egg)[3]).toEqual({ g: 100, u: '1個×2', text: '1個×2（100g）' });
    // (at ×2 already: the same rungs, from its one portion)
    expect(amountSteps(entry('e2', snap('x', '茶碗1杯×2'), 300)).map((s) => [s.g, s.u])).toEqual([[75, '茶碗1杯×0.5'], [150, '茶碗1杯'], [225, '茶碗1杯×1.5'], [300, '茶碗1杯×2'], [375, '茶碗1杯×2.5'], [450, '茶碗1杯×3']]);
    // (a ×n off the rungs kept; grams alone: no label)
    expect(amountSteps(entry('e3', snap('x', '1枚×7'), 70)).map((s) => s.g)).toEqual([5, 10, 15, 20, 30, 40, 50, 70]);
    expect(amountSteps(entry('e4', snap('x'), 120)).map((s) => [s.text, s.u])).toEqual([['60g', null], ['120g', null], ['180g', null], ['240g', null], ['300g', null], ['360g', null]]);
    // (a serving with no weight: its servings, never grams)
    expect(amountSteps(entry('e5', { ...snap('custom:m1', '1食'), sv: true }, 100)).map((s) => s.text)).toEqual(['1食×0.5', '1食', '1食×1.5', '1食×2', '1食×2.5', '1食×3']);
  });
  it('seasoningLike: a seasoning, a soup or its base by its name (full-width or half-width kana alike), never a blueberry', () => {
    for (const n of ['鍋の素', 'ﾁｷﾝｽｰﾌﾟの素', 'コーンスープ', '焼肉のたれ', '白だし', 'ウスターソース', 'めんつゆ', 'ごまドレッシング', 'こいくち醤油', '合わせ味噌', 'カレールー', 'コンソメ', 'ぽん酢'])
      expect(seasoningLike(n), n).toBe(true);
    for (const n of ['ブルーベリー', 'プロテインバー', '会社の弁当', 'おにぎり 鮭']) expect(seasoningLike(n), n).toBe(false);
  });
  it('quickDraft: a query nothing matched as its name (cut to the field’s), the kcal as typed', () => {
    expect(quickDraft('', 'ラーメン屋')).toMatchObject({ n: 'ラーメン屋', k: '' });
    expect(quickDraft('650', 'あ'.repeat(40)).n).toHaveLength(30);
  });
});

describe('a recipe’s ingredient of no known weight weighed (recipeFlow weighItem, weighHint)', () => {
  const KOMBU: FoodSnap = { id: 'custom:mkombu01', n: 'しおこんぶ', k: 10, p: 0.8, fa: 0, c: 1.9, s: 1, fi: 0.6, u: 'ひとつまみ', sv: true };
  it('per 100 g of its weight, its grams its servings’; a food too light for its values, or a weighed one, not', () => {
    expect(weighItem({ g: 150, f: KOMBU }, 4)).toEqual({ g: 6, f: { id: 'custom:mkombu01', n: 'しおこんぶ', k: 250, p: 20, fa: 0, c: 47.5, s: 25, fi: 15, u: 'ひとつまみ' } });
    expect([weighItem({ g: 100, f: KOMBU }, 0.5), weighItem({ g: 100, f: KOMBU }, 0), weighItem({ g: 100, f: { ...KOMBU, sv: undefined } }, 5)]).toEqual([null, null, null]);
  });
  it('the food data’s nearest food with a weight, its default portion', async () => {
    const db = emptyDb({ version: 'x', datasets: [] });
    await addDataset(db, { file: 'f.json', source: 'mext', badge: 'MEXT', secondary: false, lazy: false }, {
      source: 'mext', items: [{ id: 'mext:09022', name: '塩昆布', aliases: ['しおこんぶ'], kcal: 193, p: 16.9, f: 0.4, c: 37, salt: 18, portions: [{ label: '大さじ1', g: 5 }] }] as never
    });
    expect(weighHint(db, KOMBU)).toEqual({ n: '塩昆布', label: '大さじ1', g: 5 });
    expect([weighHint(null, KOMBU), weighHint(db, { ...KOMBU, n: 'ぜんぜんちがう' })]).toEqual([null, null]);
  });
});

describe('isBroth: スープ半分 offered for a food in a broth', () => {
  const b = (name: string, cat?: string, id = 'dishes:x') => isBroth({ id, name, cat });
  it('soups, 鍋, stews and noodles in their broth; never a dry noodle, a drink or MEXT’s raw noodles', () => {
    const yes = [
      ['味噌汁（豆腐とわかめ）', '汁物'], ['コーンスープ', '汁物'], ['担々鍋（1人前）', '主菜'], ['坦々鍋用スープ'], ['スンドゥブスープ'], ['スンドゥブチゲ'],
      ['冷麺（盛岡風）', '麺'], ['ラーメン（醤油）', '麺'], ['カップラーメン（しょうゆ）', '麺'], ['かけそば', '麺'], ['きつねうどん', '麺'],
      ['鍋焼きうどん', '麺'], ['ちゃんぽん', '麺'], ['担々麺', '麺'], ['餃子スープ'], ['豚汁', '汁物']
    ];
    const no = [
      ['ざるそば', '麺'], ['もりそば', '麺'], ['焼きうどん', '麺'], ['ソース焼きそば', '麺'], ['油そば（まぜそば）', '麺'], ['つけ麺', '麺'],
      ['冷やし中華', '麺'], ['ぶっかけうどん', '麺'], ['釜玉うどん', '麺'], ['汁なし担々麺', '麺'], ['スパゲッティ ナポリタン', '麺'], ['明太子うどん', '麺'],
      ['回鍋肉', '主菜'], ['オレンジ果汁', '飲料'], ['ぜんざい（お汁粉）', '菓子・デザート'], ['ごはん（精白米）', '主食'], ['コンソメスープ', '飲料'],
      ['ラーメンサラダ', '主菜'], ['鍋用スープの素'], ['中華スープの素'], ['おでん 大根', '主菜'], ['おでん盛り合わせ（6品）', '主菜']
    ];
    expect(yes.filter(([n, c]) => !b(n, c))).toEqual([]);
    expect(no.filter(([n, c]) => b(n, c))).toEqual([]);
    expect([b('うどん ゆで', undefined, 'mext:01039'), b('即席みそ汁', undefined, 'mext:17000')]).toEqual([false, true]);
  });
  it('never a dish whose values hold only the broth eaten (its note: 「喫食分」, the 鍋 of data_src)', () => {
    expect(isBroth({ id: 'dishes:yosenabe', name: '寄せ鍋（1人前）', cat: '主菜', note: 'つゆは喫食分150gを計上' })).toBe(false);
    expect(isBroth({ id: 'dishes:x', name: '寄せ鍋（1人前）', cat: '主菜', note: '一般的な推定値' })).toBe(true);
  });
});
