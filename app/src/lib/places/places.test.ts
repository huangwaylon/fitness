// 保存した場所's search (lib/places): the key's folds, the query parser's chips and what it leaves typed, the ranking
// and the filters, the hours (zones, past midnight, Saturday night, 定休), the areas, the trail's 2 km filter, and the
// perf check: 3,500 invented places with facets and descriptions, p95 under 2 ms a keystroke.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { Period, Place, PlaceCat } from '../contract/places.ts';
import { areaOf } from './area.ts';
import { distM, fmtDist, homeOf, nearTrack } from './geo.ts';
import { hoursNow, opensOn, weekRows } from './hours.ts';
import { chipKey, chipLabel, continues, parse, vocab, withChips, type Chip } from './query.ts';
import { descTableOf, facetTableOf, packFacets } from './facets.ts';
import { buildIndex, inBox, isNew, QUICK_RATE, relax, search, withDescs, type Box, type Ctx } from './search.ts';
import { ago, hoursLine } from './strings.ts';
import { placeKey, subseq } from './text.ts';
import { setKinds } from './kinds.ts';
import { setGazetteer } from './romaji.ts';

// (the kinds' table and the gazetteer, data files the app fetches with the facets: read here)
const lex = (f: string): unknown => JSON.parse(readFileSync(new URL(`./data/${f}`, import.meta.url), 'utf8'));
setKinds(lex('places-kinds.json'));
setGazetteer(lex('places-gazetteer.json'));

// Wednesday 2026-11-04 12:00 Tokyo
const NOW = Date.parse('2026-11-04T12:00:00+09:00');
const at = (iso: string) => Date.parse(`${iso}+09:00`);
const week = (o: number, c: number, days = [0, 1, 2, 3, 4, 5, 6]): Period[] => days.map((d) => ({ d, o, c }));

let seq = 0;
const place = (o: Partial<Place> & { name: string }): Place => ({
  id: String(++seq), lat: 35.66, lng: 139.70, addr: '東京都渋谷区神南1-2-3', cat: 'その他', sub: '', added: NOW / 1000 - 30 * 86_400, hours: null, tz: 'Asia/Tokyo', web: '', note: '', ...o
});

describe('the key', () => {
  it('folds width, case, katakana, long vowels and small kana', () => {
    expect(placeKey('ラーメン')).toBe(placeKey('らーめん'));
    expect(placeKey('ﾗｰﾒﾝ')).toBe('らめん');
    expect(placeKey('キッサ')).toBe(placeKey('きつさ'));
    expect(placeKey('ＣＡＦＥ　Ｋｉｔｓｕｎｅ')).toBe('cafekitune');
  });
  it('a fuzzy hit: in order, within twice the length', () => {
    expect(subseq('とんかつまるや', 'とかつ')).toBeGreaterThan(0);
    expect(subseq('とんかつまるや', 'まと')).toBe(0);
    expect(subseq('あいうえおかきくけこ', 'あこ')).toBe(0);
  });
});

describe('the query', () => {
  const v = vocab(['渋谷', '渋谷区', '神南', '吉祥寺']);
  const p = (s: string, commit = false) => {
    const r = parse(v, s, commit);
    return { chips: r.chips.map(chipLabel), text: r.text };
  };
  it('time words become chips as they are typed', () => {
    expect(p('営業中')).toEqual({ chips: ['営業中'], text: '' });
    expect(p('開いてる')).toEqual({ chips: ['営業中'], text: '' });
    expect(p('今開いてる')).toEqual({ chips: ['営業中'], text: '' });
    expect(p('今日開いてる')).toEqual({ chips: ['今日営業'], text: '' });
    for (const w of ['日曜', '日曜日', '日曜に']) expect(p(w).chips).toEqual(['日曜営業']);
    expect(p('土曜日').chips).toEqual(['土曜営業']);
    expect(p('祝日').chips).toEqual(['祝日営業']);
    for (const w of ['近く', '近くの', '周辺']) expect(p(w).chips).toEqual(['現在地周辺']);
  });
  it('a category or an area waits for a space or Enter; a particle takes it at once', () => {
    expect(p('ラーメン')).toEqual({ chips: [], text: 'ラーメン' });
    expect(p('ラーメン ')).toEqual({ chips: ['ラーメン'], text: '' });
    expect(p('ラーメン', true)).toEqual({ chips: ['ラーメン'], text: '' });
    for (const w of ['らーめん', '拉麺', 'ramen', 'ﾗｰﾒﾝ']) expect(p(w, true).chips).toEqual(['ラーメン']);
    expect(p('甘いもの ').chips).toEqual(['甘いもの']);
    expect(p('スイーツ ').chips).toEqual(['甘いもの']);
    expect(p('パン ').chips).toEqual(['パン']);
    expect(p('渋谷 ').chips).toEqual(['渋谷周辺']);
    expect(p('吉祥寺駅 ').chips).toEqual(['吉祥寺周辺']);
    expect(p('渋谷の')).toEqual({ chips: ['渋谷周辺'], text: '' });
  });
  it('several in a word or a line; a word with anything else stays free text', () => {
    expect(p('日曜にラーメン ').chips).toEqual(['日曜営業', 'ラーメン']);
    expect(p('渋谷のラーメン', true).chips).toEqual(['渋谷周辺', 'ラーメン']);
    expect(p('近くのカフェ ').chips).toEqual(['現在地周辺', 'カフェ']);
    expect(p('営業中 一蘭')).toEqual({ chips: ['営業中'], text: '一蘭' });
    expect(p('パンダ', true)).toEqual({ chips: [], text: 'パンダ' });
    expect(p('パン屋まるき', true)).toEqual({ chips: [], text: 'パン屋まるき' });
    expect(p('一蘭 営業中')).toEqual({ chips: ['営業中'], text: '一蘭' });
    expect(p('一蘭 ラーメン')).toEqual({ chips: [], text: '一蘭 ラーメン' });
  });
  it('a one-character term only on its own (山本 is a name), a Latin word whole, a particle may lead', () => {
    for (const w of ['山本', '本山', 'barber', 'cafebar']) expect(p(w, true)).toEqual({ chips: [], text: w });
    expect(p('本 ').chips).toEqual(['本']);
    expect(p('山の').chips).toEqual(['山']);
    expect(p('日曜に海', true).chips).toEqual(['日曜営業', '海']);
    expect(p('bar ').chips).toEqual(['バー']);
    expect(p('open')).toEqual({ chips: [], text: 'open' }); // (opentable on its way)
    expect(p('open ').chips).toEqual([]); // (open now, open late… may follow: a phrase's first word waits)
    expect(p('open', true).chips).toEqual(['営業中']);
    expect(p('open cafe ').chips).toEqual(['営業中', 'カフェ']);
    expect(p('にく ').chips).toEqual(['肉']); // (に leads only when the word isn't a term from its start)
    expect(p('のカフェ ')).toEqual({ chips: ['カフェ'], text: '' }); // 営業中 taken as typed, then の…
    expect(p('の', true)).toEqual({ chips: [], text: 'の' });
  });
  it('typed a key at a time: what follows a word just taken goes on with it, or waits, or is its own', () => {
    const r = parse(v, '近く');
    expect(r.tail).toBe(placeKey('近く'));
    expect(continues(v, r.tail, 'の')).toBe('more');
    expect(continues(v, placeKey('日曜'), '日')).toBe('more');
    expect(continues(v, placeKey('日曜'), '営')).toBe('wait');
    expect(continues(v, placeKey('日曜'), 'ラ')).toBeNull();
    expect(parse(v, '近く ').tail).toBe('');
  });
  it('chips: one of a key, the later point or centre replacing the earlier', () => {
    const a: Chip[] = withChips([{ k: 'open' }], [{ k: 'open' }, { k: 'point', at: [1, 2] }]);
    expect(a.map(chipLabel)).toEqual(['営業中', 'この地点の周辺']);
    expect(withChips(a, [{ k: 'centre', at: [3, 4], r: 900 }]).map(chipLabel)).toEqual(['営業中', '地図の中心']);
  });
});

describe('the hours', () => {
  const line = (h: Period[] | null, when: number, tz = 'Asia/Tokyo') => hoursLine(hoursNow(h, tz, when), 'ja');
  const lunch = [...week(660, 900, [1, 2, 3, 4, 5, 6]), ...week(1050, 1260, [1, 2, 3, 4, 5, 6])]; // 11–15, 17:30–21, 日 off
  it('open, closing soon, closed till later today, tomorrow, 本日定休', () => {
    expect(line(lunch, at('2026-11-04T12:00'))).toEqual({ text: '営業中 · 15:00まで', tone: 'open' });
    expect(line(lunch, at('2026-11-04T14:30'))).toEqual({ text: 'まもなく閉店 · 15:00まで', tone: 'soon' });
    expect(line(lunch, at('2026-11-04T16:00')).text).toBe('営業時間外 · 17:30から');
    expect(line(lunch, at('2026-11-04T22:00')).text).toBe('営業時間外 · 明日 11:00から');
    expect(line(lunch, at('2026-11-08T12:00')).text).toBe('本日定休 · 明日 11:00から'); // Sunday
    expect(line(week(660, 1260, [1]), at('2026-11-04T12:00')).text).toBe('本日定休 · 月曜 11:00から');
    expect(line(null, NOW)).toEqual({ text: '営業時間は不明', tone: 'unknown' });
    expect(line([], NOW).tone).toBe('unknown');
    expect(line([{ d: 0, o: 0, c: 10080 }], NOW).text).toBe('24時間営業');
  });
  it('past midnight and Saturday night into Sunday', () => {
    const bar = week(1080, 1560, [5, 6]); // Fri, Sat 18:00 – 翌2:00
    expect(line(bar, at('2026-11-07T01:30')).text).toBe('まもなく閉店 · 2:00まで'); // Saturday 01:30 (Friday's)
    expect(line(bar, at('2026-11-08T00:30')).text).toBe('営業中 · 2:00まで'); // Sunday 00:30 (Saturday's)
    expect(line(bar, at('2026-11-08T03:00')).text).toBe('本日定休 · 金曜 18:00から');
    expect(line(week(0, 1440), NOW).text).toBe('24時間営業'); // each day round the clock meets the next
  });
  it("in the place's own zone", () => {
    const nine = week(540, 1020); // 9–17 every day
    expect(line(nine, at('2026-11-04T12:00'), 'Asia/Tokyo').text).toBe('営業中 · 17:00まで');
    expect(line(nine, at('2026-11-04T12:00'), 'America/Los_Angeles').text).toBe('営業時間外 · 明日 9:00から'); // 19:00 Tue there
    expect(line(nine, at('2026-11-04T12:00'), 'Nope/Zone').text).toBe('営業中 · 17:00まで'); // (an unknown zone: Tokyo's)
  });
  it('opens on a day; the week view', () => {
    expect(opensOn(lunch, 0)).toBe(false);
    expect(opensOn(lunch, 3)).toBe(true);
    expect(opensOn([{ d: 0, o: 0, c: 10080 }], 4)).toBe(true);
    expect(opensOn(null, 3)).toBe(false);
    const rows = weekRows([...lunch, { d: 6, o: 1080, c: 1560 }]);
    expect(rows.map((r) => r.d)).toEqual([1, 2, 3, 4, 5, 6, 0]);
    expect(rows[0].spans).toEqual(['11:00–15:00', '17:30–21:00']);
    expect(rows[5].spans).toEqual(['11:00–15:00', '17:30–21:00', '18:00–翌2:00']);
    expect(rows[6].spans).toEqual([]);
    expect(weekRows([{ d: 0, o: 0, c: 10080 }]).every((r) => r.spans[0] === '24時間')).toBe(true);
  });
  it('the sync’s age', () => {
    expect(ago(NOW - 30_000, NOW, 'ja')).toBe('たった今');
    expect(ago(NOW - 2 * 3_600_000, NOW, 'ja')).toBe('2時間前');
    expect(ago(NOW - 50 * 3_600_000, NOW, 'ja')).toBe('2日前');
  });
});

describe('the areas', () => {
  it('Japanese addresses: the city or ward, the town', () => {
    expect(areaOf('〒150-0041 東京都渋谷区神南1丁目19-11')).toEqual({ label: '渋谷', names: ['渋谷区', '渋谷', '神南', '東京都'] });
    expect(areaOf('日本、〒231-0023 神奈川県横浜市中区山下町1')).toEqual({ label: '横浜', names: ['横浜市', '横浜', '中区', '山下町', '神奈川県'] });
    expect(areaOf('東京都武蔵野市吉祥寺本町1-2-3').label).toBe('武蔵野');
    expect(areaOf('東京都千代田区市ヶ谷1').names).toContain('千代田区');
    expect(areaOf('神奈川県足柄下郡箱根町湯本').label).toBe('箱根');
    expect(areaOf('東京都港区六本木4丁目').label).toBe('港区');
  });
  it('others by their comma parts; none', () => {
    expect(areaOf('123 Pike St, Seattle, WA 98101').label).toBe('Seattle');
    expect(areaOf('').label).toBe('');
  });
  it("foreign ones as the list writes them: the country (in Japanese or English) dropped, a state's or prefecture's postcode passed over", () => {
    expect(areaOf('123 Pike St, Seattle, WA 98101 アメリカ合衆国')).toEqual({ label: 'Seattle', names: ['Seattle'] });
    expect(areaOf('400 Broad St, Seattle, WA 98109, United States').label).toBe('Seattle');
    expect(areaOf('Rue de Rivoli, 75001 Paris, フランス').label).toBe('Paris');
    expect(areaOf('Rue de Rivoli, 75001 Paris, France').label).toBe('Paris');
    expect(areaOf('1 Chome-2-3 Jinnan, Shibuya City, Tokyo 150-0041, Japan').label).toBe('Shibuya');
    expect(areaOf('Yumoto, Hakone, Ashigarashimo District, Kanagawa 250-0311').label).toBe('Hakone');
    expect(areaOf('Piazza di Trevi, 00187 Roma RM, イタリア').label).toBe('Roma');
    expect(areaOf('No. 45, Shifu Rd, Xinyi District, Taipei City, 台湾 110').label).toBe('Taipei');
    expect(areaOf('Gyeongsangbuk-do, 韓国').label).toBe('Gyeongsangbuk-do');
    expect(areaOf('〒150-0041 東京都渋谷区神南1-2-3 Shibuya Bldg 2F').label).toBe('渋谷'); // (a Latin building name)
  });
});

describe('the search', () => {
  const rows = [
    place({ name: '一蘭 渋谷店', cat: '麺', sub: 'ラーメン', hours: week(0, 1440), lat: 35.661, lng: 139.700 }),
    place({ name: 'らーめん山頭火', cat: '麺', sub: 'ラーメン', hours: week(1080, 1380), lat: 35.70, lng: 139.58, addr: '東京都武蔵野市吉祥寺本町1-2' }),
    place({ name: 'パン屋まるき', cat: '甘いもの', sub: 'パン', hours: week(420, 1080, [1, 2, 3, 4, 5, 6]), note: '塩パンがおいしい', lat: 35.662, lng: 139.701 }),
    place({ name: '喫茶ランプ', cat: 'カフェ', sub: '喫茶店', hours: null, note: 'ラーメンの後に', lat: 35.663, lng: 139.702, added: NOW / 1000 - 3600 }),
    place({ name: '高尾山', cat: '自然・登山', sub: '山', addr: '東京都八王子市高尾町', lat: 35.625, lng: 139.243 })
  ];
  const ix = buildIndex(rows);
  const ctx: Ctx = { now: NOW, me: null, view: [139.70, 35.66], sort: 'near' };
  const names = (chips: Chip[], text = '', c: Partial<Ctx> = {}) => search(ix, chips, text, { ...ctx, ...c }).list.map((i) => ix.entries[i].p.name);

  it('names first, then a category word, an area, the note; a fuzzy name last', () => {
    expect(names([], 'ラーメン')).toEqual(['らーめん山頭火', '一蘭 渋谷店', '喫茶ランプ']);
    expect(names([], 'まるき')).toEqual(['パン屋まるき']);
    expect(names([], '吉祥寺')).toEqual(['らーめん山頭火']);
    expect(names([], '塩パン')).toEqual(['パン屋まるき']);
    expect(names([], 'らめん頭火')).toEqual(['らーめん山頭火']); // 山 missed
    expect(names([], 'いちらん')).toEqual([]); // (a kanji name has no reading)
    expect(names([], '一蘭 渋谷')).toEqual(['一蘭 渋谷店']);
  });
  it('the chips: category (sub or top), open now, a day, today, an area, a point', () => {
    expect(names([{ k: 'cat', cat: '麺', sub: 'ラーメン' }])).toEqual(['一蘭 渋谷店', 'らーめん山頭火']);
    expect(names([{ k: 'cat', cat: '麺', sub: '' }, { k: 'cat', cat: 'カフェ', sub: '' }])).toHaveLength(3);
    expect(names([{ k: 'open' }])).toEqual(['一蘭 渋谷店', 'パン屋まるき']); // 12:00 Wed
    expect(names([{ k: 'day', d: 0 }])).toEqual(['一蘭 渋谷店', 'らーめん山頭火']);
    expect(names([{ k: 'today' }], '', { now: at('2026-11-08T12:00') })).toEqual(['一蘭 渋谷店', 'らーめん山頭火']);
    expect(names([{ k: 'area', name: '吉祥寺本町' }])).toEqual(['らーめん山頭火']);
    expect(names([{ k: 'point', at: [139.243, 35.625] }])).toEqual(['高尾山']);
    expect(names([{ k: 'centre', at: [139.70, 35.661], r: 300 }])).toEqual(['一蘭 渋谷店', 'パン屋まるき', '喫茶ランプ']);
    const r = search(ix, [{ k: 'near' }], '', ctx);
    expect(r.needMe).toBe(true);
    expect(names([{ k: 'near' }], '', { me: [139.70, 35.66] })).toHaveLength(3);
  });
  it('a typed area or category also finds a name with the word in it', () => {
    const more = buildIndex([...rows, place({ name: '横浜家系 渋谷店', cat: '麺', sub: 'ラーメン' }), place({ name: 'Park Hotel', cat: '泊まる', addr: '東京都港区東新橋1-7-1', lat: 35.66, lng: 139.76 })]);
    const v = more.vocab;
    const find = (q: string) => { const r = parse(v, q, true); return search(more, r.chips, r.text, ctx).list.map((i) => more.entries[i].p.name); };
    expect(find('横浜 家系')).toEqual(['横浜家系 渋谷店']);
    expect(find('park hotel')).toEqual(['Park Hotel']);
    expect(names([{ k: 'cat', cat: '見どころ', sub: '公園' }])).toEqual([]); // (a chip from the row: the category only)
  });
  it('counts per category before the category chips; the sorts', () => {
    const r = search(ix, [{ k: 'cat', cat: '麺', sub: '' }], '', ctx);
    expect(r.perCat.get('カフェ')).toBe(1);
    expect(r.perCat.get('麺' as PlaceCat)).toBe(2);
    expect(names([], '', { sort: 'new' })[0]).toBe('喫茶ランプ');
    expect(names([], '', { sort: 'rate' })).toHaveLength(5); // (no facets: all unrated, newest first)
    expect(names([], '', { sort: 'near', view: [139.243, 35.625] })[0]).toBe('高尾山');
    expect(search(ix, [], '', ctx).shown).toBe(false); // the map's centre: no distance shown
    expect(search(ix, [], '', { ...ctx, me: [139.7, 35.66] }).shown).toBe(true);
    expect(isNew(rows[3], NOW)).toBe(true);
    expect(isNew(rows[0], NOW)).toBe(false);
  });

  it('browse mode’s box: only the places in it, counted in it, 近い順 from its centre (no distance shown); across the antimeridian', () => {
    const shibuya: Box = [139.699, 35.660, 139.7025, 35.6625]; // 一蘭, まるき; not ランプ (35.663)
    const r = search(ix, [], '', { ...ctx, me: [139.243, 35.625], box: shibuya });
    expect(r.list.map((i) => ix.entries[i].p.name)).toEqual(['一蘭 渋谷店', 'パン屋まるき']);
    expect(r.perCat.get('麺' as PlaceCat)).toBe(1);
    expect(r.perCat.get('カフェ')).toBe(0);
    expect(r.shown).toBe(false);
    expect(names([{ k: 'cat', cat: '麺', sub: '' }], '', { box: shibuya })).toEqual(['一蘭 渋谷店']);
    expect(names([], '', { box: [139.0, 35.6, 139.3, 35.7], sort: 'rate' })).toEqual(['高尾山']);
    expect(names([], '', { box: [140, 0, 141, 1] })).toEqual([]);
    expect(names([], '', { box: null })).toHaveLength(5);
    expect(inBox([170, -10, -170, 10], 179, 0)).toBe(true);
    expect(inBox([170, -10, -170, 10], -179, 0)).toBe(true);
    expect(inBox([170, -10, -170, 10], 0, 0)).toBe(false);
  });

  it.runIf(process.env.PLACES_PERF)('perf: 3,500 places with facets and ~300 KB of descriptions, p95 under 2 ms a keystroke (no debounce; on demand: PLACES_PERF=1, timings flake on shared CI)', () => {
    const cats: PlaceCat[] = ['麺', 'カフェ', '甘いもの', '見どころ', '居酒屋・バー'];
    const kinds = ['ラーメン屋', 'カフェ・喫茶', 'ベーカリー', '神社', '居酒屋'];
    const many = Array.from({ length: 3500 }, (_, i) => place({
      id: String(100_000 + i), name: `テスト${i}号店 ${['ラーメン', 'カフェ', 'ベーカリー', '神社', '酒場'][i % 5]}`, cat: cats[i % 5], note: i % 3 ? 'メモあり' : '',
      lat: 35 + (i % 100) / 100, lng: 139 + Math.floor(i / 100) / 100, hours: i % 4 ? week(600, 1260, [1, 2, 3, 4, 5]) : null,
      addr: `東京都${['渋谷区', '新宿区', '港区'][i % 3]}テスト町${i % 9}-1`
    }));
    const at = NOW / 1000;
    const packed = packFacets(Object.fromEntries(many.map((p, i) => [p.id, {
      at, hours: i % 2 ? week(480, 1320) : null, kind: kinds[i % 5], r: 3.5 + (i % 15) / 10, rn: i * 7,
      desc: `駅から徒歩${i % 20}分。季節のメニューと${['抹茶', '珈琲', '地ビール', '御朱印', '醤油'][i % 5]}が自慢の、落ち着いた雰囲気のお店です。テラス席あり、予約がおすすめ。Open daily, cosy and friendly.`
    }])));
    const json = <T,>(x: T): T => JSON.parse(JSON.stringify(x)) as T;
    const facets = facetTableOf(json(packed.facets)), descs = descTableOf(json(packed.descs));
    expect(JSON.stringify(packed.descs).length).toBeGreaterThan(300_000);
    const t0 = performance.now();
    const big = buildIndex(many, facets, descs, ['ウェイ', 'うめ']);
    const built = performance.now() - t0;
    const lines = ['て', 'テスト12', '営業中', '日曜 ラーメン', 'めもあり', 'zzz', '渋谷 カフェ', '★4.5 神社', '土曜18時 居酒屋', 'shibuya cafe open now', '抹茶', '雰囲気 テラス', '-ラーメン 1km以内', 'matcha sweets'];
    const times: number[] = [];
    for (let k = 0; k < 6; k++) for (const l of lines) for (let n = 1; n <= l.length; n++) {
      const s = performance.now();
      const r = parse(big.vocab, l.slice(0, n), n === l.length);
      search(big, r.chips, r.text, { ...ctx, me: [139.5, 35.5] });
      if (k) times.push(performance.now() - s); // (the first pass warms the caches)
    }
    times.sort((a, b) => a - b);
    expect(times[Math.floor(times.length * 0.95)]).toBeLessThan(2);
    expect(built).toBeLessThan(500);
  });
});

describe('the query, v2: numbers, times, people, notes, negation, glue and soft words, both languages', () => {
  const v = vocab(['渋谷', '渋谷区', '吉祥寺'], { people: ['ウェイ', 'うめ'], aliases: [['Shibuya', '渋谷'], ['しぶや', '渋谷']] });
  const p = (s: string, commit = true) => {
    const r = parse(v, s, commit);
    return { chips: r.chips.map(chipLabel), text: r.text.trim() };
  };
  it('a rating needs its marker: ★4, 4.5以上, 評価4以上, 4+, 4 stars, 高評価, top rated; 4月 and 4号店 stay text', () => {
    for (const s of ['★4', '4以上', '評価4以上', '4+', '4 stars', '星4']) expect(p(s).chips).toEqual(['★4.0以上']);
    expect(p('4.5以上 寿司').chips).toEqual(['★4.5以上', '寿司']);
    expect(p('渋谷カフェ4.5以上').chips).toEqual(['渋谷周辺', 'カフェ', '★4.5以上']);
    expect(p('高評価').chips).toEqual(['★4.3以上']);
    expect(p('top rated cafes').chips).toEqual(['★4.5以上', 'カフェ']);
    for (const s of ['4月', '4号店', '2nd']) expect(p(s)).toEqual({ chips: [], text: s });
  });
  it('a time, a weekday’s time, the day’s parts; an open word after a day is the day’s', () => {
    expect(p('21時').chips).toEqual(['21時に営業']);
    expect(p('土曜18時').chips).toEqual(['土曜 18時に営業']);
    expect(p('sat 7pm').chips).toEqual(['土曜 19時に営業']);
    expect(p('open at 9pm').chips).toEqual(['21時に営業']);
    expect(p('19:30').chips).toEqual(['19:30に営業']);
    expect(p('今夜').chips).toEqual(['19時に営業']);
    expect(p('深夜').chips).toEqual(['23時に営業']);
    expect(p('late night bar').chips).toEqual(['23時に営業', 'バー']);
    expect(p('日曜にやってるパン屋').chips).toEqual(['日曜営業', 'パン']);
    expect(p('open sunday').chips).toEqual(['日曜営業']);
    expect(p('今やってる蕎麦').chips).toEqual(['営業中', 'そば']);
  });
  it('a distance, a walk; recent; who saved it (never the bare name); a note', () => {
    expect(p('1km以内').chips).toEqual(['半径 1 km']);
    expect(p('徒歩10分').chips).toEqual(['半径 800 m']);
    expect(p('within 2 km').chips).toEqual(['半径 2 km']);
    expect(p('最近').chips).toEqual(['最近1か月に保存']);
    expect(p('うめが保存').chips).toEqual(['うめの保存']);
    expect(p('ウェイの保存 カフェ').chips).toEqual(['ウェイの保存', 'カフェ']);
    expect(p('うめ')).toEqual({ chips: [], text: 'うめ' });
    expect(p('メモあり').chips).toEqual(['メモあり']);
  });
  it('not: -ラーメン, ラーメン以外, no ramen, a word', () => {
    for (const s of ['-ラーメン', 'ラーメン以外', 'no ramen']) expect(p(s).chips).toEqual(['ラーメン以外']);
    expect(p('-チェーン').chips).toEqual(['チェーン以外']);
    expect(p('not open')).toEqual({ chips: [], text: 'not open' }); // (no 営業中: the opposite)
    expect(p('息抜き')).toEqual({ chips: [], text: '息抜き' });
    const [c] = parse(v, 'ラーメン以外', true).chips;
    expect(c).toMatchObject({ k: 'not', cat: '麺', sub: 'ラーメン' });
  });
  it('English: near me, open now, plurals, areas by their other spellings; a run-on Japanese line split', () => {
    expect(p('coffee near me').chips).toEqual(['カフェ', '現在地周辺']);
    expect(p('ramen open now').chips).toEqual(['ラーメン', '営業中']);
    expect(p('shibuya cafes').chips).toEqual(['渋谷周辺', 'カフェ']);
    expect(p('らーめん しぶや').chips).toEqual(['ラーメン', '渋谷周辺']);
    expect(p('sushi in shibuya')).toEqual({ chips: ['寿司', '渋谷周辺'], text: 'in' }); // (the search lets in go)
    expect(p('近くで今やってるご飯').chips).toEqual(['現在地周辺', '営業中', '麺', '和食・寿司', '肉', '世界の料理']);
  });
  it('soft words stay in the field, alone or split from a word with chips', () => {
    expect(p('雨の日 デート')).toEqual({ chips: [], text: '雨の日 デート' });
    expect(p('おすすめ ラーメン')).toEqual({ chips: ['ラーメン'], text: 'おすすめ' });
    expect(p('渋谷でデート')).toEqual({ chips: ['渋谷周辺'], text: 'デート' });
  });
  it('the old rules hold: パン屋まるき, 山本 stay names; a category waits while typed', () => {
    expect(p('パン屋まるき')).toEqual({ chips: [], text: 'パン屋まるき' });
    expect(p('山本')).toEqual({ chips: [], text: '山本' });
    expect(p('4.5以上', false)).toEqual({ chips: [], text: '4.5以上' });
  });
});

describe('the search, v2: facets, descriptions, the new chips, ignored words, relax, quick counts, the sorts', () => {
  const at = NOW / 1000;
  const rows = [
    place({ id: '1', name: '麺処いちばん', cat: '麺', sub: 'ラーメン', lat: 35.661, lng: 139.700, by: 0, note: '', added: at - 90 * 86_400 }),
    place({ id: '2', name: 'Café Lumière', cat: 'カフェ', sub: '', addr: 'Rue de Rivoli, 75001 Paris, France', lat: 48.86, lng: 2.34, tz: 'Europe/Paris', by: 1, added: at - 90 * 86_400 }),
    place({ id: '3', name: 'Phở Hà Nội', cat: 'その他', sub: '', addr: '12 Hàng Bông, Hà Nội, ベトナム', lat: 21.03, lng: 105.85, tz: 'Asia/Ho_Chi_Minh', by: 1, added: at - 90 * 86_400 }),
    place({ id: '4', name: '喫茶みどり', cat: 'カフェ', sub: '喫茶店', lat: 35.662, lng: 139.701, note: '窓際の席', by: 0, added: at - 3600 }),
    place({ id: '5', name: '純喫茶あお', cat: 'カフェ', sub: '喫茶店', lat: 35.6625, lng: 139.7012, by: 1, added: at - 90 * 86_400 })
  ];
  const facets = facetTableOf(JSON.parse(JSON.stringify(packFacets({
    '1': { at, hours: week(660, 1380), kind: 'ラーメン屋', r: 4.6, rn: 900 },
    '2': { at, hours: week(480, 1080), kind: 'カフェ', r: 4.8, rn: 3 },
    '3': { at, hours: null, kind: 'フォー', r: 4.4, rn: 120 },
    '4': { at, hours: week(600, 1200), kind: '喫茶店', r: 4.1, rn: 60 },
    '5': { at, hours: week(600, 1200), kind: '喫茶店', r: 4.5, rn: 400 }
  }).facets)));
  const descs = descTableOf({ v: 1, ...(() => { const d = packFacets({ '5': { at, hours: null, desc: '古民家を改装した静かな店' } }).descs; return { h: d.h, d: d.d }; })() });
  const ix = buildIndex(rows, facets, descs, ['ウェイ', 'うめ']);
  const ctx: Ctx = { now: NOW, me: [139.700, 35.661], view: null, sort: 'near' };
  const find = (q: string, c: Partial<Ctx> = {}) => {
    const r = parse(ix.vocab, q, true);
    const s = search(ix, r.chips, r.text, { ...ctx, ...c });
    return { ids: s.list.map((i) => ix.entries[i].p.id), s };
  };
  it('the vendored hours when the relay has none; the rating, its count and the prior', () => {
    const e = ix.entries[0];
    expect(e.hours).toHaveLength(7);
    expect([e.kind, e.r, e.rn]).toEqual(['ラーメン屋', 4.6, 900]);
    expect(ix.entries[1].q).toBeLessThan(ix.entries[4].q); // 4.8 from 3 < 4.5 from 400
    expect(find('営業中').ids).toEqual(['1', '5', '4']); // 12:00 Tokyo (Paris 04:00)
  });
  it('the kind is text; accents folded; the description the last text tier, said', () => {
    expect(find('フォー').ids).toEqual(['3']);
    expect(find('pho').ids).toEqual(['3']);
    expect(find('cafe lumiere').ids).toEqual(['2']);
    const r = find('古民家');
    expect(r.ids).toEqual(['5']);
    expect(r.s.why.get(4)).toBe('desc');
    expect(find('窓際').s.why.get(3)).toBe('note');
  });
  it('a word nothing has is ignored, not zeroing the list; glue let go beside anything else', () => {
    const r = find('喫茶店 ほげほげ');
    expect(r.ids).toEqual(['5', '4']);
    expect(r.s.ignored).toEqual(['ほげほげ']);
    expect(find('デート 喫茶店').s.ignored).toEqual(['デート']);
    expect(find('喫茶店 in').ids).toEqual(['5', '4']);
  });
  it('rating, at a time, radius, recent, who, a note, not', () => {
    expect(find('★4.5').ids).toEqual(['1', '5', '2']);
    expect(find('22時').ids).toEqual(['1']);
    expect(find('半径 200m').ids).toEqual(['1', '5', '4']);
    expect(find('300m').ids).toEqual(['1', '5', '4']);
    expect(find('最近').ids).toEqual(['4']);
    expect(find('うめが保存').ids).toEqual(['5', '3', '2']); // (Hanoi nearer Tokyo than Paris)
    expect(find('メモあり').ids).toEqual(['4']);
    expect(find('-喫茶店').ids).toEqual(['1', '3', '2']);
  });
  it('the sorts: 近い順 with ties within 200 m by rating, 評価順, 新しい順; the quick counts; relax', () => {
    expect(find('').ids.slice(0, 3)).toEqual(['1', '5', '4']); // (1 at 0 m; 5 and 4 within 200 m of each other: 5 rated higher)
    expect(find('', { sort: 'rate' }).ids).toEqual(['1', '5', '3', '2', '4']);
    expect(find('', { sort: 'new' }).ids[0]).toBe('4');
    expect(find('喫茶店').s.quick).toEqual({ open: 2, rate: 1 });
    expect(find('★4.5 喫茶店').s.quick.rate).toBe(1);
    const chips = parse(ix.vocab, '22時 喫茶店', true).chips;
    expect(search(ix, chips, '', ctx).list).toEqual([]);
    expect(relax(ix, chips, '', ctx).map((x) => [chipLabel(x.drop), x.n])).toEqual([['22時に営業', 2], ['喫茶店', 1]]);
    expect(relax(ix, [], '', ctx)).toEqual([]);
    expect(QUICK_RATE).toBe(4.5);
  });
});

describe('the search, v3: Google kinds, areas across scripts, the gazetteer, typos, pieces, other spellings', () => {
  const at = NOW / 1000;
  const old = at - 90 * 86_400;
  const rows = [
    place({ id: '11', name: '龍門', cat: '温泉', sub: '温泉', addr: '東京都渋谷区神南1-2', lat: 35.6625, lng: 139.6995, added: old }), // a 中華料理店 the relay filed as 温泉
    place({ id: '12', name: '稲荷さん', cat: '見どころ', sub: '寺社', addr: '東京都渋谷区神宮前1-1', lat: 35.668, lng: 139.705, added: old }),
    place({ id: '13', name: '観音さま', cat: '見どころ', sub: '寺社', addr: '東京都台東区浅草2-3', lat: 35.7148, lng: 139.7967, added: old }),
    place({ id: '14', name: 'Bean Stop', cat: 'カフェ', sub: '', addr: '1 Chome-1 Jinnan, Shibuya City, Tokyo 150-0041, Japan', lat: 35.663, lng: 139.700, added: old }),
    place({ id: '15', name: 'カリーの店', cat: '世界の料理', sub: 'カレー', addr: '東京都千代田区神田神保町2-1', lat: 35.6959, lng: 139.7577, added: old }),
    place({ id: '16', name: 'Han River Kitchen', cat: 'その他', sub: '', addr: '12 Itaewon-ro, Yongsan-gu, Seoul, 韓国', lat: 37.534, lng: 126.994, tz: 'Asia/Seoul', added: old }),
    place({ id: '17', name: 'うみねこ珈琲', cat: 'カフェ', sub: '', addr: '神奈川県鎌倉市由比ガ浜1-1', lat: 35.309, lng: 139.540, added: old }),
    place({ id: '18', name: '高尾の峰', cat: '自然・登山', sub: '山', addr: '東京都八王子市高尾町', lat: 35.625, lng: 139.243, added: old })
  ];
  const kinds: Record<string, string> = { '11': '中華料理店', '12': '神社', '13': '仏教寺院', '14': 'カフェ・喫茶', '15': 'カレー店', '16': '韓国料理店', '17': 'カフェ・喫茶', '18': '山頂' };
  const vend = Object.fromEntries(rows.map((r) => [r.id, { at, hours: null, kind: kinds[r.id], r: 4.2, rn: 100 }]));
  const descs = descTableOf(JSON.parse(JSON.stringify(packFacets({ ...vend, '17': { at, hours: null, desc: '海が見えるテラス席。抹茶ラテが人気。完全予約制' } }).descs)));
  const ix = buildIndex(rows, facetTableOf(JSON.parse(JSON.stringify(packFacets(vend).facets))), descs);
  const ctx: Ctx = { now: NOW, me: [139.700, 35.661], view: null, sort: 'near' };
  const find = (q: string) => {
    const r = parse(ix.vocab, q, true);
    return { ids: search(ix, r.chips, r.text, ctx).list.map((i) => ix.entries[i].p.id), chips: r.chips.map(chipLabel), text: r.text.trim() };
  };
  it('a sure kind sets the category (the relay’s kept as the alt); a vague one only fills; the kind is text', () => {
    const e = ix.entries[0];
    expect([e.cat, e.sub, e.alt]).toEqual(['世界の料理', '中華', { cat: '温泉', sub: '温泉' }]);
    expect(find('中華').ids).toEqual(['11']);
    expect(find('温泉').ids).toEqual(['11']); // (the relay's pair still matches)
    expect([ix.entries[3].cat, ix.entries[3].sub]).toEqual(['カフェ', '']);
    expect(find('chinese').ids).toEqual(['11']);
    expect(find('korean').ids).toEqual(['16']);
  });
  it('a kind narrower than its sub: 神社 ≠ お寺', () => {
    expect(find('神社')).toMatchObject({ ids: ['12'], chips: ['神社'] });
    expect(find('お寺')).toMatchObject({ ids: ['13'], chips: ['仏教寺院'] });
    expect(find('寺社').ids).toEqual(['12', '13']);
  });
  it('areas across scripts: kanji, kana, romaji, a romanised address, a town inside a longer one, a prefecture, a foreign city', () => {
    for (const q of ['渋谷 カフェ', 'しぶや カフェ', 'shibuya cafe']) expect(find(q).ids, q).toEqual(['14']);
    expect(find('神保町 カレー').ids).toEqual(['15']);
    expect(find('jimbocho curry').ids).toEqual(['15']);
    expect(find('東京 寺社').ids).toEqual(['12', '13']);
    expect(find('tokyo').chips).toEqual(['東京都周辺']);
    expect(find('ソウル').ids).toEqual(['16']);
    expect(find('seoul').ids).toEqual(['16']);
    expect(find('kamakura').ids).toEqual(['17']);
  });
  it('a typo of a term, a run-on line in pieces, other spellings in the description, a day trip', () => {
    expect(find('ramenn').chips).toEqual(['ラーメン']);
    expect(find('coffe').chips).toEqual(['カフェ']);
    expect(find('海が見えるカフェ').ids).toEqual(['17']);
    expect(find('matcha').ids).toEqual(['17']);
    expect(find('予約必須').ids).toEqual(['17']);
    expect(find('日帰り 登山').ids).toEqual(['18']);
    expect(find('hiking').ids).toEqual(['18']);
  });
});

describe('a fresh phone’s first view', () => {
  it('every place; spread round the world, the home’s: those within 300 km of the median', () => {
    const japan: [number, number][] = [[139.7, 35.66], [139.8, 35.7], [135.5, 34.69], [139.6, 35.4], [139.75, 35.68]];
    expect(homeOf(japan)).toEqual(japan);
    const world: [number, number][] = [...japan, [-122.33, 47.61], [2.35, 48.86], [174.76, -36.85]];
    expect(homeOf(world)).toEqual([[139.7, 35.66], [139.8, 35.7], [139.6, 35.4], [139.75, 35.68]]);
    expect(homeOf([])).toEqual([]);
  });
});

describe('fix round 1: whole words, kinds, typing = the whole line, glue, night hours, fallbacks, kana, areas, counts', () => {
  const t0 = NOW / 1000, old = t0 - 90 * 86_400;
  const P = (id: string, name: string, cat: PlaceCat, sub: string, kind: string, o: Partial<Place> = {}) => ({ row: place({ id, name, cat, sub, added: old, lat: 35.661, lng: 139.700, ...o }), kind });
  const list = [
    P('a1', 'テストビル', 'その他', '', 'ビル'),
    P('a2', 'ベイクハウス', '甘いもの', 'パン', 'ベーカリー'),
    P('a3', '鉄板ダイニング', '肉', '', '鉄板焼き店'),
    P('a4', '麺屋いち', '麺', 'ラーメン', 'ラーメン屋'),
    P('a5', '手打ち庵', '麺', 'そば', '蕎麦店'),
    P('a6', '渋谷警察署', 'その他', '', '警察署'),
    P('a7', 'Central Parking', 'その他', '', '駐車場'),
    P('a8', 'Barber Kings', '買い物', '', '理容店'),
    P('a9', '酒場まる', '居酒屋・バー', 'バー', 'バー'),
    P('b1', '古刹', '見どころ', '寺社', '仏教寺院'),
    P('b2', '稲荷', '見どころ', '寺社', '神社'),
    P('b3', 'Yoyogi Park', '見どころ', '公園', '公園'),
    P('b4', 'ビアホール北', '居酒屋・バー', 'ビール', 'ビアホール'),
    P('b5', 'バンコク食堂', 'その他', '', 'タイ料理店'),
    P('b6', '龍門', '居酒屋・バー', '居酒屋', '中華料理店'), // (filed as an izakaya; a sure kind says 中華)
    P('b7', 'かつての蔵', '見どころ', '', '史跡'),
    P('b8', '湯けむり', '温泉', '温泉', '温泉', { addr: '静岡県熱海市1-1', lat: 35.096, lng: 139.07 }),
    P('b9', 'ナイトカフェ', 'カフェ', '', 'カフェ・喫茶', { hours: [{ d: 6, o: 1080, c: 1560 }] }) // Sat 18:00 – Sun 2:00
  ];
  const vend = Object.fromEntries(list.map(({ row, kind }) => [row.id, { at: t0, hours: null, kind, r: 4.3, rn: 200 }]));
  const descs = packFacets({ ...vend, b7: { at: t0, hours: null, desc: 'かつては宿場町でした' }, a2: { at: t0, hours: null, desc: '子連れ歓迎のパン屋' } }).descs;
  const rows = list.map((x) => x.row);
  const ix = buildIndex(rows, facetTableOf(JSON.parse(JSON.stringify(packFacets(vend).facets))), descTableOf(JSON.parse(JSON.stringify(descs))), ['うめ', 'Waylon Huang']);
  const ctx: Ctx = { now: at('2026-11-07T12:00'), me: [139.700, 35.661], view: null, sort: 'near' };
  const find = (q: string, c: Partial<Ctx> = {}) => {
    const r = parse(ix.vocab, q, true);
    const s = search(ix, r.chips, r.text, { ...ctx, ...c });
    return { ids: s.list.map((i) => ix.entries[i].p.id), chips: r.chips.map(chipLabel), s };
  };
  /** The sheet's own reading, a key at a time (PlacesView read(): continues, then parse, chips joined by withChips). */
  function typed(line: string): string[] {
    let chips: Chip[] = [], text = '', tail = '';
    const read = (commit: boolean) => {
      if (tail && text && !/\s/.test(text)) {
        const c = continues(ix.vocab, tail, text);
        if (c === 'more') return void ((tail = placeKey(tail + text)), (text = ''));
        if (c === 'wait' && !commit) return;
      }
      const r = parse(ix.vocab, text, commit);
      tail = r.tail;
      if (!r.chips.length) return;
      chips = withChips(chips, r.chips);
      text = r.text;
    };
    for (const ch of line) ((text += ch), read(false));
    read(true);
    return chips.map(chipKey);
  }

  it('category, kind and negation words match whole: ビール isn’t ビル, カリー isn’t ベーカリー, そば isn’t 中華そば, ice isn’t police, park isn’t parking', () => {
    expect(find('ビール').ids).toEqual(['b4']);
    expect(find('カリー').ids).toEqual([]);
    expect(find('そば').ids).toEqual(['a5']);
    expect(find('park').ids).toEqual(['b3']);
    expect(find('ice').ids).toEqual([]);
    expect(find('bar').ids).toEqual(['a9']);
    expect(find('-バー').chips).toEqual(['バー以外']);
    expect(find('-バー').ids).toContain('a5'); // (「-バー」 is the bars, not every ば: そば stays)
    expect(find('-バー').ids).toHaveLength(rows.length - 1);
    expect(find('-そば').ids).toContain('a4');
    expect(find('とんかつ').ids).not.toContain('b7'); // (かつ in かつて: a 2-kana word isn't looked for in descriptions)
  });
  it('寺 and お寺: the temples, by their kind; 神社 apart', () => {
    expect(find('寺').ids).toEqual(['b1']);
    expect(find('お寺').ids).toEqual(['b1']);
    expect(find('shrine').ids).toEqual(['b2']);
    expect(find('寺社').ids.sort()).toEqual(['b1', 'b2']);
  });
  it('typing a key at a time gives the chips the whole line does', () => {
    for (const line of ['土曜18時', '土曜 18時', '日曜にやってる', 'sat 7pm', 'open late', 'top rated', 'late night bar', '渋谷のラーメン', 'coffee near me', '朝ごはん 7時', 'ramen open now']) {
      expect(typed(line), line).toEqual(parse(ix.vocab, line, true).chips.map(chipKey));
    }
    expect(typed('土曜18時').map((k) => k)).toEqual(['at']);
    expect(find('top rated').chips).toEqual(['★4.5以上']);
  });
  it('glue: within, min walk, お店, スポット, food, rated, saved', () => {
    expect(find('within 2km').chips).toEqual(['半径 2 km']);
    expect(find('10 min walk').chips).toEqual(['半径 800 m']);
    expect(find('渋谷のお店').chips).toEqual(['渋谷周辺']);
    expect(find('ラーメンがうまいところ').ids).toEqual(['a4']); // (read in pieces: ラーメン; うまい let go, ところ glue)
    expect(find('thai food').chips).toEqual(['タイ料理店']);
    expect(find('thai food').ids).toEqual(['b5']);
    expect(find('lunch').chips).toEqual(['ランチ']); // (the food tops, those open at noon first: no hour filter)
    expect(find('3m').chips).toEqual([]); // (a 3 m radius is a name's)
  });
  it('night hours: 夜1時 = 25:00 (the next day’s 1:00), 夜12時 = 24:00, 25時, 土曜25時 = Sunday 1:00; a typed hour replaces a meal’s', () => {
    const m = (q: string) => (parse(ix.vocab, q, true).chips.find((c) => c.k === 'at') as { m: number; d?: number }).m;
    expect([m('夜1時'), m('夜12時'), m('深夜2時'), m('25時'), m('24時'), m('夜7時')]).toEqual([1500, 1440, 1560, 1500, 1440, 1140]);
    expect(find('土曜25時').ids).toEqual(['b9']); // (Sat 18:00 – Sun 2:00: open at Sunday 1:00)
    expect(find('土曜17時').ids).toEqual([]);
    expect(find('朝ごはん 7時').chips).toEqual(['朝ごはん', '7時に営業']);
  });
  it('the chips find places but not with the words: the words let go, said; a word alone that nothing has: none', () => {
    const r = find('子連れ ビール');
    expect(r.ids).toEqual(['b4']);
    expect(r.s.ignored).toContain('子連れ');
    expect(find('日曜 酒場まる').ids).toEqual([]); // (a name's word stays: none found, and what to let go)
    expect(find('デート').ids).toHaveLength(rows.length); // (a mood word alone: the list, said)
    expect(find('xyzzyq').ids).toEqual([]);
    expect(find('xyzzyq').s.ignored).toEqual(['xyzzyq']);
    // the descriptions' fetch given up: a word nothing has is let go as when they're in
    const out = withDescs(buildIndex(rows, null, null), null);
    expect(search(out, [{ k: 'cat', cat: '麺', sub: '' }], 'ほげ', ctx).list).toHaveLength(2);
  });
  it('kana predicates; the longest word first; a whole known word not split', () => {
    expect(find('いまやってるかふぇ').chips).toEqual(['営業中', 'カフェ']);
    expect(find('えいぎょうちゅう').chips).toEqual(['営業中']);
    expect(find('ぱんけーき').chips).toEqual([]);
  });
  it('kinds as chips in both languages; people in Latin letters', () => {
    expect(find('thai').chips).toEqual(['タイ料理店']);
    expect(find('タイ料理').chips).toEqual(['タイ料理店']);
    expect(find('ume saved').chips).toEqual(['うめの保存']);
    expect(find('saved by waylon').chips).toEqual(['Waylon Huangの保存']);
    expect(find('うめ').chips).toEqual([]);
  });
  it('areas: by where a place is, not its name; no common words, no 2-kana readings; 海 isn’t 熱海', () => {
    expect(find('熱海').ids).toEqual(['b8']);
    expect(find('海').ids).toEqual([]);
    expect(find('nice').chips).toEqual([]);
  });
  it('a category chip’s count is what its tap gives (the relay’s pick counted too, ranked after)', () => {
    const r = search(ix, [], '', ctx);
    for (const cat of ['居酒屋・バー', '世界の料理', '見どころ'] as PlaceCat[]) {
      expect(search(ix, [{ k: 'cat', cat, sub: '' }], '', ctx).list.length, cat).toBe(r.perCat.get(cat));
    }
    const bars = search(ix, [{ k: 'cat', cat: '居酒屋・バー', sub: '' }], '', ctx).list.map((i) => ix.entries[i].p.id);
    expect(bars.at(-1)).toBe('b6'); // (the 中華料理店 the relay filed as an izakaya: last)
    expect(find('最近').chips).toEqual(['最近1か月に保存']);
  });
  it('relax: when no one chip helps, two at once', () => {
    const chips = parse(ix.vocab, 'ビール 熱海', true).chips;
    expect(search(ix, chips, '', ctx).list).toEqual([]);
    const r = relax(ix, [...chips, { k: 'rate', min: 4.9 }], '', ctx);
    expect(r[0]).toMatchObject({ n: expect.any(Number) });
    expect(r[0].also).toBeDefined();
  });
});

describe('fix round 2: run-on kana, meals, a cuisine through a vague kind, a city over its prefecture, 夜景, one area spelling', () => {
  const t0 = NOW / 1000, old = t0 - 90 * 86_400;
  const P = (id: string, name: string, cat: PlaceCat, sub: string, kind: string, o: Partial<Place> = {}) => ({ row: place({ id, name, cat, sub, added: old, lat: 35.661, lng: 139.700, ...o }), kind });
  const kyoto = (i: number, kind: string) => P(`k${i}`, `京の店${i}`, 'カフェ', '', kind, { addr: `京都府京都市中京区三条${i}`, lat: 35.01 + i / 1000, lng: 135.76 });
  const list = [
    P('c1', 'ふるぎのまち', '買い物', '服', '古着屋', { addr: '東京都世田谷区北沢2-1', lat: 35.661, lng: 139.668 }),
    P('c2', '麺の店', '麺', 'ラーメン', 'ラーメン屋', { hours: week(660, 900) }),
    P('c3', '定食の家', '和食・寿司', '定食', '定食屋', { hours: week(1080, 1320) }),
    P('c4', 'コスメの館', '買い物', '雑貨', '化粧品店', { hours: week(600, 1200) }),
    P('c5', 'ソウルの台所', '世界の料理', 'エスニック', '韓国料理店'),
    P('c6', 'ベトナム食堂', '世界の料理', 'エスニック', 'レストラン'), // (a vague kind under エスニック: no 韓国 in it)
    P('c7', '韓国家庭料理 ひまわり', '世界の料理', 'エスニック', 'レストラン'), // (says it)
    P('c8', 'スカイデッキ', '見どころ', '景色', '展望台'),
    P('c9', '川辺の庭', '見どころ', '景色', '公園'),
    P('d1', 'ルーフトップ', '居酒屋・バー', 'バー', 'バー'),
    ...Array.from({ length: 10 }, (_, i) => kyoto(i, 'カフェ・喫茶')),
    P('k99', '舟屋カフェ', 'カフェ', '', 'カフェ・喫茶', { addr: '京都府与謝郡伊根町平田1', lat: 35.68, lng: 135.29 })
  ];
  const vend = Object.fromEntries(list.map(({ row, kind }) => [row.id, { at: t0, hours: null, kind, r: 4.3, rn: 200 }]));
  const rows = list.map((x) => x.row);
  const ix = buildIndex(rows, facetTableOf(JSON.parse(JSON.stringify(packFacets(vend).facets))),
    descTableOf(JSON.parse(JSON.stringify(packFacets({ ...vend, d1: { at: t0, hours: null, desc: '夜景が見える屋上のバー' } }).descs))));
  const ctx: Ctx = { now: at('2026-11-07T12:00'), me: [139.700, 35.661], view: null, sort: 'near' };
  const find = (q: string, c: Partial<Ctx> = {}) => {
    const r = parse(ix.vocab, q, true);
    const s = search(ix, r.chips, r.text, { ...ctx, ...c });
    return { ids: s.list.map((i) => ix.entries[i].p.id), chips: r.chips.map(chipLabel) };
  };
  it('a kana line cut at its particles, each piece read whole', () => {
    expect(find('しもきたざわのふるぎや')).toMatchObject({ ids: ['c1'] });
    expect(find('しもきたざわのふるぎや').chips).toHaveLength(2);
  });
  it('a meal: its tops, the places open at its hour first, no shop', () => {
    const r = find('ランチ');
    expect(r.chips).toEqual(['ランチ']);
    expect(r.ids.slice(0, 1)).toEqual(['c2']); // (open at noon)
    expect(r.ids).toContain('c3'); // (shut at noon: after, not left out)
    expect(r.ids).not.toContain('c4');
  });
  it('a cuisine chip lets a vague-kind place in only when it says the cuisine', () => {
    expect(find('韓国料理').ids.sort()).toEqual(['c5', 'c7']);
  });
  it('京都 is the city when the city has places enough; me near it: sorted from me', () => {
    const r = find('京都 カフェ', { me: [135.761, 35.0101] });
    expect(r.ids).not.toContain('k99');
    expect(r.ids[0]).toBe('k0'); // (the nearest to me)
  });
  it('夜景 is its own chip: what says it, then the observation decks; not every view', () => {
    const r = find('夜景');
    expect(r.chips).toEqual(['夜景']);
    expect(r.ids).toEqual(['d1', 'c8']);
  });
  it('an area chip says its name as the rows do', () => {
    const v = buildIndex([place({ name: 'x', addr: '東京都渋谷区神南1-1' })]);
    const r = parse(v.vocab, 'shibuya', true);
    expect(r.chips.map(chipLabel)).toEqual(['渋谷周辺']);
    expect(v.entries[0].area.label).toBe('渋谷');
  });
});

describe('near the trail', () => {
  const track = [[139.24, 35.62], [139.25, 35.63], [139.26, 35.62]];
  it('within 2 km of a segment, nearest first, capped', () => {
    const items = [{ lat: 35.625, lng: 139.245, id: 'on' }, { lat: 35.64, lng: 139.25, id: '1km' }, { lat: 35.70, lng: 139.25, id: 'far' }, { lat: 35.62, lng: 139.30, id: 'east' }];
    expect(nearTrack(items, track).map((x) => x.it.id)).toEqual(['on', '1km']);
    expect(nearTrack(items, track, 2000, 1).map((x) => x.it.id)).toEqual(['on']);
    expect(nearTrack(items, []).length).toBe(0);
    expect(Math.round(nearTrack(items, track)[1].d / 100)).toBe(11);
  });
  it('a long segment: a point beside its middle, far from both ends; one point; dense tracks', () => {
    const items = [{ lat: 35.65, lng: 139.65, id: 'mid' }, { lat: 35.68, lng: 139.62, id: 'off' }];
    const long = [[139.5, 35.6], [139.8, 35.7]];
    expect(nearTrack(items, long).map((x) => x.it.id)).toEqual(['mid']);
    expect(nearTrack(items, [[139.65, 35.651]]).map((x) => x.it.id)).toEqual(['mid']);
    const dense = Array.from({ length: 5000 }, (_, i) => [139.5 + i * 0.00006, 35.6 + i * 0.00002]);
    expect(nearTrack(items, dense).map((x) => x.it.id)).toEqual(['mid']);
  });
  it('the grid finds what every segment measured would (a long track, long segments, one point)', () => {
    let r = 7;
    const rnd = () => ((r = (r * 16_807) % 2_147_483_647) / 2_147_483_647);
    const items = Array.from({ length: 600 }, (_, i) => ({ id: i, lat: 35.5 + rnd() * 0.4, lng: 139.4 + rnd() * 0.6 }));
    const mLat = 6_371_008.8 * (Math.PI / 180);
    const brute = (t: number[][], maxM: number) => {
      const mLon = mLat * Math.cos(((Math.min(...t.map((p) => p[1])) + Math.max(...t.map((p) => p[1]))) / 2) * (Math.PI / 180));
      return items.flatMap((it) => {
        let best = Infinity;
        for (let i = 0; i < t.length; i++) {
          const [ax, ay] = [t[i][0] * mLon, t[i][1] * mLat], [bx, by] = t[i + 1] ? [t[i + 1][0] * mLon, t[i + 1][1] * mLat] : [ax, ay];
          const px = it.lng * mLon, py = it.lat * mLat, dx = bx - ax, dy = by - ay, len = dx * dx + dy * dy;
          const k = len ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len)) : 0;
          best = Math.min(best, Math.hypot(px - (ax + k * dx), py - (ay + k * dy)));
        }
        return best <= maxM ? [it.id] : [];
      }).sort((a, b) => a - b);
    };
    const wiggle = Array.from({ length: 3000 }, (_, k) => [139.4 + (0.6 * k) / 3000, 35.5 + 0.4 * Math.abs(Math.sin(k / 500))]);
    for (const [t, m] of [[wiggle, 2000], [[[139.41, 35.51], [139.99, 35.89]], 2000], [[[139.7, 35.7]], 5000], [wiggle, 700]] as const) {
      expect(nearTrack(items, t as number[][], m, 1e9).map((x) => x.it.id).sort((a, b) => a - b)).toEqual(brute(t as number[][], m));
    }
  });
  it('distances', () => {
    expect(Math.round(distM([139.7, 35.66], [139.7, 35.67]))).toBe(1112);
    expect(fmtDist(347)).toBe('350 m');
    expect(fmtDist(1234)).toBe('1.2 km');
    expect(fmtDist(12_345)).toBe('12 km');
    expect(fmtDist(996)).toBe('1.0 km'); // (not 「1000 m」)
    expect(fmtDist(9_960)).toBe('10 km'); // (not 「10.0 km」)
  });
});
