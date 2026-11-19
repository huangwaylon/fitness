import { describe, expect, it } from 'vitest';
import { searchKey } from './text.ts';
import { entryOf, headOf, nearby, PRODUCT_PENALTY, search, SECONDARY_PENALTY } from './search.ts';
import { g1, nutrientsFor, portionsOf, toSnap } from './nutrition.ts';
import { addDataset, chainPenalty, credits, emptyDb, EST_PENALTY, fillIn, IMPLAUSIBLE_PENALTY, searchFoods, verifyOf } from './db.ts';
import type { Item } from './types.ts';

const item = (id: string, name: string, extra: Partial<Item> = {}): Item => ({ id, name, kcal: 100, ...extra });

describe('searchKey', () => {
  it('folds width, katakana, punctuation and romaji', () => {
    expect(searchKey('ｶﾚｰライス（大盛り）')).toBe(searchKey('かれーらいす大盛り'));
    expect(searchKey('ＡＢＣ　１２３')).toBe('abc123');
    expect(searchKey('nattou')).toBe(searchKey('natto'));
    expect(searchKey('misoshiru')).toBe(searchKey('misosiru'));
    expect([searchKey(undefined), searchKey('')]).toEqual(['', '']);
  });
});

describe('nearby (近いもの)', () => {
  it('a chain’s menu (an item with a shop) in a quarter of the rows at most: the generic foods stay in sight', () => {
    const chains = Array.from({ length: 8 }, (_, i) => entryOf(item(`kal:${i}`, `濃厚豚骨醤油ラーメン${'あいうえおかきく'[i]}`, { shop: 's', kcal: i }), SECONDARY_PENALTY + 0.25));
    const generic = entryOf(item('eatout:1', 'ラーメン（醤油）'));
    const got = nearby([...chains, generic], 'とんこつ醤油ラーメン味玉', 8).map((it) => it.id);
    expect(got).toEqual(['kal:0', 'kal:1', 'eatout:1']);
    expect(nearby(chains, 'とんこつ醤油ラーメン味玉', 3).length).toBe(1);
  });
});

describe('search', () => {
  const idx = [
    entryOf(item('a:1', 'パン粉', { pop: 1 })),
    entryOf(item('a:2', '食パン', { pop: 3 })),
    entryOf(item('a:3', 'パン')),
    entryOf(item('off:1', 'ごはん', { kcal: 151 }), SECONDARY_PENALTY),
    entryOf(item('off:2', 'ゴハン', { kcal: 151 }), SECONDARY_PENALTY),
    entryOf(item('mext:1', 'ごはん', { kcal: 156, aliases: ['白米'] })),
    entryOf(item('a:6', '鮭おにぎり'))
  ];
  const ids = (q: string, groupOf?: (id: string) => number | undefined, entries = idx) => search(entries, q, 60, groupOf).map((i) => i.id);

  it('ranks exact > prefix > substring, with pop weighting', () => {
    expect(ids('パン')).toEqual(['a:3', 'a:2', 'a:1']);
  });
  it('secondary datasets rank below core; the same name + kcal collapse; aliases match', () => {
    expect(ids('ごはん')).toEqual(['mext:1', 'off:1']);
    expect(ids('白米')).toEqual(['mext:1']);
  });
  it('every token must match (AND); an empty query finds nothing; the limit holds', () => {
    expect(ids('おにぎり 鮭')).toEqual(['a:6']);
    expect(ids('   ')).toEqual([]);
    expect(search(idx, 'パン', 2).length).toBe(2);
  });
  it('one row per verify group (the best ranked)', () => {
    expect(ids('パン', (id) => ({ 'a:1': 0, 'a:2': 0 })[id])).toEqual(['a:3', 'a:2']);
  });
  it('a verify group shows its core item, not a better-matching secondary one, at the best place', () => {
    const lunch = entryOf(item('toyonaka:1', 'マーボー豆腐', { kcal: 61 }), SECONDARY_PENALTY);
    const core = entryOf(item('mext:9', '麻婆豆腐', { kcal: 104, aliases: ['マーボー豆腐'] }));
    const other = entryOf(item('kurume:1', 'マーボー豆腐丼'), SECONDARY_PENALTY);
    expect(ids('マーボー豆腐', (id) => ({ 'toyonaka:1': 7, 'mext:9': 7 })[id], [other, lunch, core])).toEqual(['mext:9', 'kurume:1']);
  });
  it('an exact alias is level with a name’s prefix (a hair under it); a name’s head is the name; a product a little lower', () => {
    const egg = entryOf(item('mext:12004', '卵（全卵・生）', { aliases: ['たまご'], pop: 3 }));
    const sando = entryOf(item('eatout:1', 'サンドイッチ（たまご）', { pop: 3 }));
    const brand = entryOf(item('off:1', 'たまご', { brand: 'X' }), SECONDARY_PENALTY + PRODUCT_PENALTY);
    expect(ids('たまご', undefined, [sando, brand, egg])).toEqual(['mext:12004', 'eatout:1', 'off:1']);
    const breast = entryOf(item('mext:11220', '鶏むね肉 皮なし 生', { pop: 3 }));
    const chicken = entryOf(item('eatout:2', 'サラダチキン', { aliases: ['鶏むね'], pop: 3 }));
    expect(ids('鶏むね', undefined, [chicken, breast])).toEqual(['mext:11220', 'eatout:2']);
    const water = entryOf(item('eatout:3', '水（ミネラルウォーター）'));
    const saba = entryOf(item('mext:10164', 'さば缶（水煮）', { pop: 3 }));
    expect(ids('水', undefined, [saba, water])).toEqual(['eatout:3', 'mext:10164']);
    expect([headOf('鮭（しろさけ） 生'), headOf('ゴハン（精白米）'), headOf('ビール')]).toEqual(['鮭', 'ごはん', 'びーる']);
  });
});

describe('nutrition', () => {
  const rice = item('mext:1', 'ごはん', { kcal: 156, p: 2.5, f: 0.3, c: 37.1, salt: null, portions: [{ label: '茶碗1杯', g: 150 }] });
  it('portions: the item’s, then 100 g (100 ml for a drink) unless it has one', () => {
    expect(portionsOf(rice)).toEqual([{ label: '茶碗1杯', g: 150 }, { label: '100g', g: 100 }]);
    expect(portionsOf({ portions: [{ label: '中ジョッキ（350ml）', g: 350 }] })[1]).toEqual({ label: '100ml', g: 100 });
    expect(portionsOf({ portions: [{ label: '１００ｇ', g: 100 }] })).toEqual([{ label: '１００ｇ', g: 100 }]);
    expect(portionsOf({})).toEqual([{ label: '100g', g: 100 }]);
  });
  it('portions of a serving with no weight (sv, a chain menu’s): its own, no 100 g; one 1食 by default', () => {
    expect(portionsOf({ sv: true, portions: [{ label: '1食', g: 100 }, { label: '大盛', g: 150 }] })).toEqual([{ label: '1食', g: 100 }, { label: '大盛', g: 150 }]);
    expect(portionsOf({ sv: true })).toEqual([{ label: '1食', g: 100 }]);
  });
  it('nutrients for g grams: kcal an integer, the rest 1 decimal, unknown kept unknown (null, shown 「–」), from an item or its snapshot', () => {
    expect(nutrientsFor(rice, 150)).toEqual({ kcal: 234, p: 3.8, fa: 0.5, c: 55.7, s: null });
    expect(nutrientsFor(toSnap(rice), 150)).toEqual(nutrientsFor(rice, 150));
    expect([g1(null), g1(undefined), g1(0), g1(1.25)]).toEqual(['–', '–', '0.0', '1.3']);
  });
  it('a snapshot is per 100 g and unrounded: a 300 g / 650 kcal serving logs 650 kcal', () => {
    const bento = item('my:2', '弁当', { kcal: 216.6667, p: 8.3333, f: 6.8333, c: 31.6667, salt: 1.1667 });
    expect(nutrientsFor(toSnap(bento), 300)).toEqual({ kcal: 650, p: 25, fa: 20.5, c: 95, s: 3.5 });
  });
  it('toSnap: the contract’s fields, the name cleaned to 60 characters, the portion label kept', () => {
    expect(toSnap(rice, '茶碗1杯')).toEqual({ id: 'mext:1', n: 'ごはん', k: 156, p: 2.5, fa: 0.3, c: 37.1, s: null, u: '茶碗1杯' });
    expect(toSnap(item('x:1', ` ${'あ'.repeat(70)} `)).n).toBe('あ'.repeat(60));
    expect('u' in toSnap(rice, '  ')).toBe(false);
  });
  it('toSnap of an sv item: its values per serving, sv set (contract snapOf’s per-serving limits)', () => {
    const don = item('kal:1', '牛丼 並盛', { kcal: 733, p: 22.9, f: 25, c: 104.1, salt: 2.9, sv: true, shop: 's1', brand: '牛丼屋' });
    expect(toSnap(don, '1食')).toEqual({ id: 'kal:1', n: '牛丼 並盛', k: 733, p: 22.9, fa: 25, c: 104.1, s: 2.9, u: '1食', sv: true });
    expect('sv' in toSnap(rice)).toBe(false);
  });
});

describe('the catalog', () => {
  const meta = (source: string, secondary = false) => ({ file: `${source}.json`, source, badge: source, secondary, lazy: false });
  const db = emptyDb({ version: 'abc', datasets: [] });
  addDataset(db, meta('mext'), { source: 'mext', label: 'MEXT', attribution: 'a', license: 'l', url: 'u', items: [item('mext:1', 'ごはん', { kcal: 156 })] });
  addDataset(db, meta('toyonaka', true), { source: 'toyonaka', label: '豊中', items: [item('toyonaka:1', 'ごはん', { kcal: 160 }), item('toyonaka:2', 'ごはん大盛り')] });
  db.verify = { sources: { mext: { label: 'verify mext' }, usda: { label: 'USDA', url: 'x' } }, groups: [{ n: 2, kcal: { mext: 156, toyonaka: 160 } }], byId: { 'mext:1': 0, 'toyonaka:1': 0 } };

  it('searches the datasets, one row per verify group, secondary ones below', () => {
    expect(searchFoods(db, 'ごはん').map((i) => i.id)).toEqual(['mext:1', 'toyonaka:2']);
  });
  it('an item’s verify group, or null', () => {
    expect(verifyOf(db, 'toyonaka:1')).toEqual({ n: 2, kcal: { mext: 156, toyonaka: 160 } });
    expect(verifyOf(db, 'toyonaka:2')).toBeNull();
  });
  it('credits: each dataset’s header, then the verify sources that are no dataset', () => {
    expect(credits(db)).toEqual([
      { label: 'MEXT', attribution: 'a', license: 'l', url: 'u' },
      { label: '豊中', attribution: '', license: '', url: '' },
      { label: 'USDA', attribution: '', license: '', url: 'x' }
    ]);
  });
});

// Kalori's estimates (86 % of its rows) under the published foods off their shop (review 11/19: 味噌汁 494 kcal, バナナ
// 344, 餃子 1,400, ミックスナッツ 1,500 ranked #1–5 on the generic word)
describe('a chain menu’s estimates', () => {
  const meta = (source: string, secondary = false) => ({ file: `${source}.json`, source, badge: source, secondary, lazy: secondary });
  const kal = (n: number, name: string, shop: string, kcal: number, est?: Item['est']): Item => ({ ...item(`kal:${n}`, name, { shop, kcal, sv: true }), ...(est ? { est } : {}) });
  const shops = { seico: { name: 'セイコーマート' }, kushi: { name: '串カツ田中' }, pub: { name: 'バナナ屋' }, ajihei: { name: 'あじへい' }, doma: { name: '土間土間' }, gusto: { name: 'ガスト' } };
  const db = emptyDb({ version: 'abc', datasets: [] });
  addDataset(db, meta('mext'), { source: 'mext', items: [item('mext:07107', 'バナナ', { kcal: 93, portions: [{ label: '1本', g: 100 }] })] });
  addDataset(db, meta('dishes'), {
    source: 'dishes',
    items: [item('dishes:gyoza', '焼き餃子（6個）', { kcal: 168, aliases: ['餃子'], portions: [{ label: '1人前', g: 176 }] }), item('dishes:miso', '味噌汁（豆腐とわかめ）', { kcal: 22, portions: [{ label: '1人前', g: 207 }] })]
  });
  addDataset(db, meta('off', true), { source: 'off', items: [item('off:1', 'バナナ', { kcal: 70, brand: 'スミフル' }), item('off:2', '餃子', { kcal: 206, brand: '無印' })] });
  addDataset(
    db,
    meta('kalori', true),
    fillIn({
      source: 'kalori',
      shops,
      items: [
        kal(1, 'バナナ', 'seico', 344, 'e'),
        kal(2, 'バナナ', 'kushi', 110, 'e'),
        kal(3, 'バナナ', 'pub', 100),
        kal(4, 'バナナジュース', 'kushi', 200),
        kal(5, '餃子', 'ajihei', 1400, 'e'),
        kal(6, '餃子（6個）', 'kushi', 300, 'e'),
        kal(7, '味噌汁', 'doma', 494, 'e'),
        kal(8, '味噌汁', 'gusto', 28, 'p'),
        kal(9, '味噌汁', 'seico', 5, 's'),
        { ...kal(10, 'ためし丼 並盛', 'kushi', 700, 'e'), vg: 'kal:10' },
        { ...kal(11, 'ためし丼 大盛', 'kushi', 900), vg: 'kal:10' }
      ]
    })
  );
  const ids = (q: string) => searchFoods(db, q).map((i) => i.id);
  const ex = (id: string) => db.entries.find((e) => e.it.id === id)?.ex;

  it('ranks an estimated one under a product and a generic of its name; a published one keeps its place', () => {
    expect(ids('バナナ')).toEqual(['mext:07107', 'kal:3', 'off:1', 'kal:4', 'kal:2', 'kal:1']);
    expect(ids('餃子')).toEqual(['dishes:gyoza', 'off:2', 'kal:6', 'kal:5']);
  });
  it('a serving past 3× or under ⅓ of the generic’s default portion: under every generic match (any estimate)', () => {
    expect([ex('kal:1'), ex('kal:2'), ex('kal:3')]).toEqual([IMPLAUSIBLE_PENALTY, EST_PENALTY, undefined]);
    // 味噌汁 46 kcal a bowl: 494 and 5 out, ガスト's 28 in (its PFC alone estimated: its place kept)
    expect([ex('kal:7'), ex('kal:8'), ex('kal:9')]).toEqual([IMPLAUSIBLE_PENALTY, undefined, IMPLAUSIBLE_PENALTY]);
    // a 6-piece plate (296 kcal) by its alias 餃子; 餃子（6個）'s head is 餃子 too
    expect([ex('kal:5'), ex('kal:6')]).toEqual([IMPLAUSIBLE_PENALTY, EST_PENALTY]);
    expect(ids('味噌汁')).toEqual(['dishes:miso', 'kal:8', 'kal:7', 'kal:9']);
  });
  it('a shop named (typed, or its chip writes it): that shop’s menu as it is, its estimates leading', () => {
    expect(ids('セイコーマート バナナ')).toEqual(['kal:1']);
    expect(ids('串カツ田中 バナナ')).toEqual(['kal:2', 'kal:4']);
    expect(ids('あじへい')).toEqual(['kal:5']);
  });
  it('a food in its states shows its default state, its values’ trust aside (並盛 estimated, 大盛 published)', () => {
    expect(ids('ためし丼')).toEqual(['kal:10']);
  });
  it('chainPenalty: none for a published row, whatever its kcal; one per 100 g by its default portion', () => {
    const generic = new Map([['ばなな', [93, 93] as const]]);
    const pen = (it: Item) => chainPenalty(it, entryOf(it), generic);
    expect(pen(kal(1, 'バナナ', 's', 9999))).toBe(0);
    expect(pen(item('kal:2', 'バナナ', { shop: 's', kcal: 150, est: 'e', portions: [{ label: '1本', g: 200 }] }))).toBe(IMPLAUSIBLE_PENALTY);
    expect(pen(kal(3, 'バナナパフェ', 's', 9999, 'e'))).toBe(EST_PENALTY);
  });
});
