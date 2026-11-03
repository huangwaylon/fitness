import { describe, expect, it } from 'vitest';
import { searchKey } from './text.ts';
import { entryOf, search, SECONDARY_PENALTY } from './search.ts';
import { nutrientsFor, portionsOf, toSnap } from './nutrition.ts';
import { addDataset, credits, emptyDb, searchFoods, verifyOf } from './db.ts';
import type { Item } from './types.ts';

const item = (id: string, name: string, extra: Partial<Item> = {}): Item => ({ id, name, kcal: 100, ...extra });

describe('searchKey', () => {
  it('folds width, katakana, punctuation, long vowels and romaji', () => {
    expect(searchKey('ｶﾚｰライス（大盛り）')).toBe(searchKey('かれらいす大盛り'));
    expect(searchKey('ＡＢＣ　１２３')).toBe('abc123');
    expect(searchKey('nattou')).toBe(searchKey('natto'));
    expect(searchKey('misoshiru')).toBe(searchKey('misosiru'));
    expect([searchKey(undefined), searchKey('')]).toEqual(['', '']);
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
});

describe('nutrition', () => {
  const rice = item('mext:1', 'ごはん', { kcal: 156, p: 2.5, f: 0.3, c: 37.1, salt: null, portions: [{ label: '茶碗1杯', g: 150 }] });
  it('portions: the item’s, then 100 g (100 ml for a drink) unless it has one', () => {
    expect(portionsOf(rice)).toEqual([{ label: '茶碗1杯', g: 150 }, { label: '100g', g: 100 }]);
    expect(portionsOf({ portions: [{ label: '中ジョッキ（350ml）', g: 350 }] })[1]).toEqual({ label: '100ml', g: 100 });
    expect(portionsOf({ portions: [{ label: '１００ｇ', g: 100 }] })).toEqual([{ label: '１００ｇ', g: 100 }]);
    expect(portionsOf({})).toEqual([{ label: '100g', g: 100 }]);
  });
  it('nutrients for g grams: kcal an integer, the rest 1 decimal, unknown = 0, from an item or its snapshot', () => {
    expect(nutrientsFor(rice, 150)).toEqual({ kcal: 234, p: 3.8, fa: 0.5, c: 55.7, s: 0 });
    expect(nutrientsFor(toSnap(rice), 150)).toEqual(nutrientsFor(rice, 150));
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
});

describe('the catalog', () => {
  const meta = (source: string, secondary = false) => ({ file: `${source}.json`, source, badge: source, secondary, lazy: false });
  const db = emptyDb({ version: 'abc', datasets: [] });
  addDataset(db, meta('mext'), { source: 'mext', label: 'MEXT', attribution: 'a', license: 'l', url: 'u', items: [item('mext:1', 'ごはん', { kcal: 156 })] });
  addDataset(db, meta('toyonaka', true), { source: 'toyonaka', label: '豊中', items: [item('toyonaka:1', 'ごはん', { kcal: 160 }), item('toyonaka:2', 'ごはん大盛り')] });
  db.verify = { sources: { mext: { label: 'verify mext' }, usda: { label: 'USDA', url: 'x' }, old: 'Old' }, groups: [{ n: 2, kcal: { mext: 156, toyonaka: 160 } }], byId: { 'mext:1': 0, 'toyonaka:1': 0 } };

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
      { label: 'USDA', attribution: '', license: '', url: 'x' },
      { label: 'Old', attribution: '', license: '', url: '' }
    ]);
  });
});
