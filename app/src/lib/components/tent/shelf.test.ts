// もようがえ's shelf (tent/shelf.ts): kinds, the forgiving search, the filters, the sorts.
import { describe, expect, it } from 'vitest';
import { ITEMS, RUGS, STARTER, WALLS } from './items.ts';
import { NO_FILTERS, facets, filterCount, fold, haystack, kindOf, matches, queryOf, shelve, type Entry, type ShelfCtx } from './shelf.ts';
import type { HhaTable } from './hha.ts';

const codes = Object.keys(ITEMS);
const pick = (fn: (c: string) => boolean) => codes.find(fn)!;

describe('kindOf', () => {
  it('one kind each: rug > ceiling > wall > critter > small > furniture; wallpapers and floors', () => {
    expect(kindOf(RUGS[0])).toBe('rugs');
    expect(kindOf(pick((c) => !!ITEMS[c].cl))).toBe('ceiling');
    expect(kindOf(pick((c) => !!ITEMS[c].wl && !ITEMS[c].rug))).toBe('walled');
    expect(kindOf(pick((c) => !!ITEMS[c].cr))).toBe('critters');
    expect(kindOf(pick((c) => !!ITEMS[c].sm && !ITEMS[c].wl && !ITEMS[c].cr && !ITEMS[c].cl && !ITEMS[c].rug))).toBe('small');
    expect(kindOf('f4081')).toBe('furniture');
    expect(kindOf(WALLS[0])).toBe('wall');
    expect(kindOf('g5018')).toBe('floor');
    // every piece in exactly one
    const n = new Map<string, number>();
    for (const c of codes) n.set(kindOf(c), (n.get(kindOf(c)) ?? 0) + 1);
    expect([...n.values()].reduce((a, b) => a + b)).toBe(codes.length);
  });
});

describe('fold and the search', () => {
  it('kana either way, half width, case, dakuten, small kana, ー and spaces', () => {
    expect(fold('ベッド')).toBe(fold('へっと'));
    expect(fold('ﾍﾞｯﾄﾞ')).toBe(fold('ベッド'));
    expect(fold('Log BED')).toBe('logbed');
    expect(fold('ロングソファー')).toBe(fold('ろんぐそふぁ'));
    expect(fold('まるた の ベッド')).toBe(fold('まるたのベッド'));
  });
  it('every term must hit (AND); a kanji word reads as its kana (OR)', () => {
    const h = fold('まるたのスツール|家具|まるた|ブラウン');
    expect(matches(h, queryOf('まるた'))).toBe(true);
    expect(matches(h, queryOf('マルタ　スツール'))).toBe(true);
    expect(matches(h, queryOf('まるた ベッド'))).toBe(false);
    expect(matches(h, queryOf('椅子'))).toBe(true);
    expect(matches(h, queryOf('丸太'))).toBe(true);
    expect(matches(h, queryOf('茶'))).toBe(true);
    expect(matches(h, queryOf('時計'))).toBe(false);
    expect(queryOf('  ')).toEqual([]);
  });
  it('the haystack holds both names, the kind, the series, colours and themes', () => {
    const hha: HhaTable = { f4038: { p: 103, s: 'log', c: ['Brown', 'Beige'], t: ['garden'] } };
    const label = (k: string) => ({ 'tent.tab.furniture': '家具', 'tent.series.log': 'まるた', 'tent.colour.Brown': 'ブラウン', 'tent.theme.garden': 'ガーデン' })[k] ?? '';
    const h = haystack('f4038', ['まるたのスツール', 'log stool'], label, hha);
    for (const q of ['stool', 'まるた', 'log', 'ぶらうん', 'brown', 'beige', 'がーでん', '家具']) expect(matches(h, queryOf(q)), q).toBe(true);
    // a group's name finds its pieces (ジム, キャンプ), in either language
    const group = (k: string) => ({ 'tent.filter.gym': 'ジム', 'tent.filter.camp': 'キャンプ' })[k] ?? '';
    expect(matches(haystack('f290', ['ランニングマシン'], group), queryOf('ジム'))).toBe(true);
    expect(matches(haystack('f290', ['ランニングマシン'], group), queryOf('gym'))).toBe(true);
    expect(matches(haystack('f1430', ['キャンプファイア'], group), queryOf('camp'))).toBe(true);
    expect(matches(haystack('f330', ['バーベキューグリル'], group), queryOf('きゃんぷ'))).toBe(true);
    expect(matches(haystack('f4038', ['まるたのスツール'], group), queryOf('ジム'))).toBe(false);
  });
});

describe('shelve', () => {
  const sofa = 'f4039', stool = 'f4038', bed = 'f4041', lamp = 'f4050', bike = 'f287', grill = 'f330';
  const hha: HhaTable = {
    [sofa]: { p: 300, s: 'log', c: ['Brown'] },
    [stool]: { p: 100, s: 'log', c: ['Brown', 'Beige'] },
    [bed]: { p: 500, s: 'log', c: ['Brown', 'Green'], t: ['living room'] },
    [lamp]: { p: 200, s: 'rattan', c: ['Beige'], t: ['living room'] },
    [bike]: { p: 50, c: ['Black'] },
    [grill]: { p: 80, c: ['Black'], t: ['outdoors'] }
  };
  const entries: Entry[] = [
    { code: bike, got: 300, src: 'buy' },
    { code: lamp, got: 200, src: 'find' },
    { code: sofa, got: 0, src: 'start' },
    { code: stool, got: 0, src: 'start' },
    { code: bed, got: 0, src: 'start' },
    { code: grill, got: 0, src: 'start' }
  ];
  const names: Record<string, string> = { [sofa]: 'まるたのソファ', [stool]: 'まるたのスツール', [bed]: 'まるたのベッド', [lamp]: 'ラタンのテーブルランプ', [bike]: 'エクササイズバイク', [grill]: 'バーベキューグリル' };
  const ctx = (counts: [string, number][] = []): ShelfCtx => ({ hha, counts: new Map(counts), hay: (c) => fold(names[c]), name: (c) => names[c] });
  const run = (o: Partial<Parameters<typeof shelve>[1]>, counts: [string, number][] = []) =>
    shelve(entries, { kind: null, query: [], filters: NO_FILTERS, sort: 'new', ...o }, ctx(counts)).map((e) => e.code);

  it('a kind, newest got first, then the catalogue order', () => {
    expect(run({ kind: 'furniture' })).toEqual([bike, sofa, stool, bed, grill]);
    expect(run({ kind: 'small' })).toEqual([lamp]);
    expect(run({})).toEqual([bike, lamp, sofa, stool, bed, grill]);
  });
  it('the sorts: 五十音, a series together, size, points', () => {
    expect(run({ sort: 'name' })).toEqual([bike, grill, stool, sofa, bed, lamp]);
    expect(run({ sort: 'series' })).toEqual([stool, sofa, bed, lamp, bike, grill]);
    expect(run({ sort: 'size' })[0]).toBe(bed);
    expect(run({ sort: 'points' })).toEqual([bed, sofa, lamp, stool, grill, bike]);
  });
  it('a search across kinds', () => {
    expect(run({ query: queryOf('まるた') })).toEqual([sofa, stool, bed]);
    expect(run({ query: queryOf('ばいく') })).toEqual([bike]);
  });
  it('filters: OR within a group, AND across; the room, the source, the gym and the camp, size', () => {
    const f = (o: Partial<typeof NO_FILTERS>) => ({ ...NO_FILTERS, ...o });
    expect(run({ filters: f({ colour: ['Beige', 'Black'] }) })).toEqual([bike, lamp, stool, grill]);
    expect(run({ filters: f({ colour: ['Brown'], theme: ['living room'] }) })).toEqual([bed]);
    expect(run({ filters: f({ series: ['rattan'] }) })).toEqual([lamp]);
    expect(run({ filters: f({ src: ['find', 'buy'] }) })).toEqual([bike, lamp]);
    expect(run({ filters: f({ room: ['in'] }) }, [[stool, 2]])).toEqual([stool]);
    expect(run({ filters: f({ room: ['out'] }) }, [[stool, 2]])).toEqual([bike, lamp, sofa, bed, grill]);
    expect(run({ filters: f({ theme: ['gym'] }) })).toEqual([bike]);
    expect(run({ filters: f({ theme: ['camp'] }) })).toEqual([grill]);
    expect(run({ filters: f({ theme: ['gym', 'camp'] }) })).toEqual([bike, grill]);
    expect(run({ filters: f({ size: ['1'] }) })).toEqual(entries.filter((e) => ITEMS[e.code].w * ITEMS[e.code].d === 1).map((e) => e.code));
    expect(filterCount(f({ colour: ['Beige', 'Black'], room: ['in'] }))).toBe(3);
  });
  it('facets: what I have, with counts; colours in NH order, the gym and the camp first among themes', () => {
    const fx = facets(entries, hha);
    expect(fx.colour).toEqual([['Black', 2], ['Brown', 3], ['Beige', 2], ['Green', 1]]);
    expect(fx.series).toEqual([['log', 3], ['rattan', 1]]);
    expect(fx.theme).toEqual([['gym', 1], ['camp', 1], ['living room', 2], ['outdoors', 1]]);
  });
  it('1,000 owned pieces: a search and a sort in well under a frame', () => {
    const many: Entry[] = codes.slice(0, 1000).map((code, i) => ({ code, got: i, src: STARTER.includes(code) ? 'start' : 'buy' }));
    const hay = new Map(many.map((e) => [e.code, fold(`${e.code} item ${e.code.length}`)]));
    const c: ShelfCtx = { counts: new Map(), hay: (k) => hay.get(k)!, name: (k) => k };
    const t0 = performance.now();
    for (let i = 0; i < 10; i++) shelve(many, { kind: null, query: queryOf('item'), filters: NO_FILTERS, sort: 'name' }, c);
    expect((performance.now() - t0) / 10).toBeLessThan(20);
  });
});
