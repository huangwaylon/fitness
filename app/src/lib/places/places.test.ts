// 保存した場所's search (lib/places): the key's folds, the query parser's chips and what it leaves typed, the ranking
// and the filters, the hours (zones, past midnight, Saturday night, 定休), the areas, the trail's 2 km filter, and the
// perf check: 3,500 invented places, each search under 5 ms.
import { describe, expect, it } from 'vitest';
import type { Period, Place, PlaceCat } from '../contract/places.ts';
import { areaOf } from './area.ts';
import { distM, fmtDist, nearTrack } from './geo.ts';
import { hoursNow, opensOn, weekRows } from './hours.ts';
import { chipLabel, continues, parse, vocab, withChips, type Chip } from './query.ts';
import { buildIndex, isNew, search, type Ctx } from './search.ts';
import { ago, hoursLine } from './strings.ts';
import { placeKey, subseq } from './text.ts';

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
    expect(areaOf('〒150-0041 東京都渋谷区神南1丁目19-11')).toEqual({ label: '渋谷', names: ['渋谷区', '渋谷', '神南'] });
    expect(areaOf('日本、〒231-0023 神奈川県横浜市中区山下町1')).toEqual({ label: '横浜', names: ['横浜市', '横浜', '中区', '山下町'] });
    expect(areaOf('東京都武蔵野市吉祥寺本町1-2-3').label).toBe('武蔵野');
    expect(areaOf('東京都千代田区市ヶ谷1').names).toContain('千代田区');
    expect(areaOf('神奈川県足柄下郡箱根町湯本').label).toBe('箱根');
    expect(areaOf('東京都港区六本木4丁目').label).toBe('港区');
  });
  it('others by their comma parts; none', () => {
    expect(areaOf('123 Pike St, Seattle, WA 98101').label).toBe('Seattle');
    expect(areaOf('').label).toBe('');
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
  it('counts per category before the category chips; the sorts', () => {
    const r = search(ix, [{ k: 'cat', cat: '麺', sub: '' }], '', ctx);
    expect(r.perCat.get('カフェ')).toBe(1);
    expect(r.perCat.get('麺' as PlaceCat)).toBe(2);
    expect(names([], '', { sort: 'new' })[0]).toBe('喫茶ランプ');
    expect(names([], '', { sort: 'name' })).toEqual([...rows].map((x) => x.name).sort(new Intl.Collator('ja').compare));
    expect(names([], '', { sort: 'near', view: [139.243, 35.625] })[0]).toBe('高尾山');
    expect(search(ix, [], '', ctx).shown).toBe(false); // the map's centre: no distance shown
    expect(search(ix, [], '', { ...ctx, me: [139.7, 35.66] }).shown).toBe(true);
    expect(isNew(rows[3], NOW)).toBe(true);
    expect(isNew(rows[0], NOW)).toBe(false);
  });

  it('perf: 3,500 places, each search under 5 ms (no debounce)', () => {
    const cats: PlaceCat[] = ['麺', 'カフェ', '甘いもの', '見どころ', '居酒屋・バー'];
    const many = Array.from({ length: 3500 }, (_, i) => place({
      name: `テスト${i}号店 ${['ラーメン', 'カフェ', 'ベーカリー', '神社', '酒場'][i % 5]}`, cat: cats[i % 5], note: i % 3 ? 'メモあり' : '',
      lat: 35 + (i % 100) / 100, lng: 139 + Math.floor(i / 100) / 100, hours: i % 4 ? week(600, 1260, [1, 2, 3, 4, 5]) : null,
      addr: `東京都${['渋谷区', '新宿区', '港区'][i % 3]}テスト町${i % 9}-1`
    }));
    const t0 = performance.now();
    const big = buildIndex(many);
    const built = performance.now() - t0;
    const qs: [Chip[], string][] = [[[], 'て'], [[], 'テスト12'], [[{ k: 'open' }], ''], [[{ k: 'cat', cat: '麺', sub: '' }, { k: 'day', d: 0 }], ''], [[], 'めもあり'], [[], 'zzz'], [[{ k: 'area', name: '渋谷' }], 'カフェ']];
    const times: number[] = [];
    for (let k = 0; k < 5; k++) for (const [c, q] of qs) {
      const s = performance.now();
      search(big, c, q, { ...ctx, me: [139.5, 35.5] });
      times.push(performance.now() - s);
    }
    times.sort((a, b) => a - b);
    expect(times[Math.floor(times.length * 0.9)]).toBeLessThan(5);
    expect(built).toBeLessThan(500);
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
  it('distances', () => {
    expect(Math.round(distM([139.7, 35.66], [139.7, 35.67]))).toBe(1112);
    expect(fmtDist(347)).toBe('350 m');
    expect(fmtDist(1234)).toBe('1.2 km');
    expect(fmtDist(12_345)).toBe('12 km');
  });
});
