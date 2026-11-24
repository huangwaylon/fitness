// 行きたい場所 on the relay (src/places.ts): the list's answer read (a fixture from a real fetch, every value replaced:
// its 13-, 16- and 20-field items, with and without an ftid), the diff (new, changed, unchanged, deletions only on a
// full read, a place put back, the mass-deletion guard), the categories (rules, OpenStreetMap's tags, Workers AI
// mocked), the time zones, opening_hours, the OpenStreetMap match and the batch (fetch mocked), the payload (the guest's
// stripped, the since-delta), the tick and its log, the routes, and the record's migration, dump and load.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  aiCats, CAT_BATCH, itemOf, listUrl, nameSim, ohPeriods, osmMatch, osmQuery, OSM_REFRESH_MS, parseList, PlacesCore, placesLog, placesRoute,
  placesTick, ingestOp, PLACES_POLL, PLACES_TABLES, getList, ruleCat, tzOf, type ListItem, type OsmEl, type TickDeps
} from '../src/places.ts';
import { SCHEMA_V, StoreCore } from '../src/store.ts';
import { openAt, placeRows, placesPayloadOf, type PlacesPayload } from '../../app/src/lib/contract/places.ts';
import { memSql } from './sqlite.ts';

const FIXTURE: string = readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'fixtures', 'places-list.txt'), 'utf8');
const T0 = Date.parse('2026-11-22T03:00:00.000Z');
const DAY = 86_400_000;

let now = T0;
let core: PlacesCore;
let meta: Map<string, string>;
let db: ReturnType<typeof memSql>;
beforeEach(() => {
  now = T0;
  const m = (db = memSql());
  for (const q of PLACES_TABLES) m.sql.exec(q);
  meta = new Map();
  core = new PlacesCore({ sql: m.sql, tx: m.tx, now: () => now, meta: (k) => meta.get(k) ?? null, setMeta: (k, v) => void meta.set(k, v) });
});

const fixtureItems = (): ListItem[] => {
  const r = parseList(FIXTURE, 5000);
  if (!r.ok) throw new Error(r.why);
  return r.items;
};
const payload = (since: number | null = null): PlacesPayload => placesPayloadOf(JSON.parse(core.read(since).body))!;

describe('the list’s answer', () => {
  it('reads every item of every shape (13, 16 and 20 fields; with and without the ftid and KG id)', () => {
    const raw = (JSON.parse(FIXTURE.slice(5)) as unknown[][][])[0][8] as unknown[][];
    expect(new Set(raw.map((x) => x.length))).toEqual(new Set([13, 16, 20]));
    const r = parseList(FIXTURE, 5000);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.total).toBe(raw.length);
    expect(r.items).toHaveLength(raw.length);
    for (const it of r.items) {
      expect(it.name).not.toBe('');
      expect(Number.isFinite(it.lat) && Number.isFinite(it.lng)).toBe(true);
      expect(it.added).toBeGreaterThan(1_600_000_000);
    }
    // the cid is the ftid's second half, unsigned (the list sends signed int64s)
    const withCid = r.items.filter((i) => i.cid);
    expect(withCid.length).toBeGreaterThan(0);
    for (const it of withCid) {
      expect(it.id).toBe(it.cid);
      expect(BigInt(it.cid!)).toBeGreaterThan(0n);
      expect(it.ftid).toMatch(new RegExp(`^0x[0-9a-f]+:0x${BigInt(it.cid!).toString(16)}$`));
    }
    // a dropped pin (no ftid) keyed by its coordinates and name
    const pins = r.items.filter((i) => !i.cid);
    expect(pins.length).toBeGreaterThan(0);
    for (const p of pins) expect(p.id).toMatch(/^k:\d+\.\d{5},\d+\.\d{5}\|/);
    expect(r.items.find((i) => i.note)?.note).toBe('メモ: 予約がいる');
    expect(new Set(r.items.map((i) => i.adder))).toEqual(new Set(['テスト甲', 'テスト乙']));
  });
  it('a negative cid read unsigned', () => {
    const it = itemOf([null, [null, null, 'a', null, 's', [null, null, 35, 139], ['-1', '-2']], 'n', '']);
    expect(it?.cid).toBe((2n ** 64n - 2n).toString());
    expect(it?.ftid).toBe('0xffffffffffffffff:0xfffffffffffffffe');
  });
  it('refuses a short answer, missing coordinates past two, a /sorry page, not JSON', () => {
    expect(parseList(FIXTURE, 3)).toEqual({ ok: false, why: 'count' });
    const d = JSON.parse(FIXTURE.slice(5));
    // one or two items without coordinates are skipped (no pin to draw); a third: misread, nothing taken
    d[0][8][2][1][5] = null;
    d[0][8][3][1][5] = null;
    const two = parseList(")]}'\n" + JSON.stringify(d), 5000);
    expect(two.ok && [two.items.length, two.skipped]).toEqual([d[0][8].length - 2, 2]);
    d[0][8][4][1][5] = null;
    expect(parseList(")]}'\n" + JSON.stringify(d), 5000)).toEqual({ ok: false, why: 'coords' });
    // a place's own words like Google's /sorry page's: still the list
    const e = JSON.parse(FIXTURE.slice(5));
    e[0][8][0][3] = 'captcha: unusual traffic on google.com/sorry';
    expect(parseList(")]}'\n" + JSON.stringify(e), 5000).ok).toBe(true);
    expect(parseList('<html>https://www.google.com/sorry/index?continue=</html>', 50)).toEqual({ ok: false, why: 'blocked' });
    expect(parseList(")]}'\n{", 50)).toEqual({ ok: false, why: 'parse' });
    expect(parseList(")]}'\n[[1,2]]", 50)).toEqual({ ok: false, why: 'parse' });
  });
  it('the newest PLACES_POLL of a longer list are its whole answer; the same place twice kept once', () => {
    const d = JSON.parse(FIXTURE.slice(5));
    d[0][12] = 3000;
    d[0][8] = Array.from({ length: PLACES_POLL }, (_, i) => d[0][8][i % 2]);
    const r = parseList(")]}'\n" + JSON.stringify(d), PLACES_POLL);
    expect(r.ok && r.items.length).toBe(2);
    expect(r.ok && r.skipped).toBe(PLACES_POLL - 2);
  });
  it('the URL asks maps.google.com for n items of the list', () => {
    expect(listUrl('abc', 50)).toMatch(/^https:\/\/maps\.google\.com\/maps\/preview\/entitylist\/getlist\?.*!1sabc!.*!4i50!/);
  });
});

describe('the diff', () => {
  it('a poll inserts the new, leaves the unchanged (no new version), updates the changed and never deletes', () => {
    const items = fixtureItems();
    expect(core.apply(items.slice(0, 5), false)).toEqual({ added: 5, changed: 0, gone: 0, ver: 1 });
    expect(core.apply(items.slice(0, 5), false)).toEqual({ added: 0, changed: 0, gone: 0, ver: 1 });
    expect(core.apply(items.slice(0, 2), false)).toEqual({ added: 0, changed: 0, gone: 0, ver: 1 });
    expect(core.status().count).toBe(5);
    const edited = items.slice(0, 5).map((it, i) => (i === 1 ? { ...it, note: 'new note', modified: it.modified + 9 } : it));
    expect(core.apply(edited, false)).toEqual({ added: 0, changed: 1, gone: 0, ver: 2 });
    expect(core.state().syncedAt).toBe(T0);
  });
  it('a full read marks the missing gone, and a place back on the list is live again', () => {
    const items = fixtureItems();
    core.apply(items, true);
    const v1 = core.state().ver;
    now += 1000;
    expect(core.apply(items.slice(1), true)).toMatchObject({ gone: 1, added: 0 });
    expect(core.status().count).toBe(items.length - 1);
    expect(core.state().fullAt).toBe(now);
    expect(core.apply(items, true)).toMatchObject({ added: 1, gone: 0, ver: v1 + 2 });
    expect(core.status().count).toBe(items.length);
  });
  it('refuses a full read that would take off more than a fifth of the list (nothing written)', () => {
    const items = fixtureItems();
    core.apply(items, true);
    const before = core.state();
    expect(core.apply(items.slice(0, 10), true)).toEqual({ ok: false, why: 'mass_delete' });
    expect(core.state()).toEqual(before);
    expect(core.status().count).toBe(items.length);
  });
  it('a name or note edit asks the category again; a move asks OpenStreetMap again', () => {
    const items = fixtureItems();
    core.apply(items, true);
    core.setCats(items.map((i) => ({ id: i.id, cat: 'その他', sub: '', src: 'ai' })));
    core.setOsm(items.map((i) => ({ id: i.id, el: null })));
    expect(core.uncategorised(100)).toHaveLength(0);
    expect(core.toEnrich(100)).toHaveLength(0);
    core.apply(items.map((i, k) => (k === 0 ? { ...i, name: i.name + '2' } : k === 1 ? { ...i, lat: i.lat + 0.01 } : i)), true);
    expect(core.uncategorised(100).map((x) => x.id)).toEqual([items[0].id]);
    expect(core.toEnrich(100).map((x) => x.id).sort()).toEqual([items[0].id, items[1].id].sort());
  });
});

describe('the categories', () => {
  it('rules: the name’s keywords, the specific first', () => {
    const c = (name: string, note = '') => ruleCat(name, note);
    expect(c('麺屋 つけめん本舗')).toEqual({ cat: '麺', sub: 'つけ麺' });
    expect(c('中華そば 青葉')).toEqual({ cat: '麺', sub: 'ラーメン' });
    expect(c('手打ち蕎麦 やぶ')).toEqual({ cat: '麺', sub: 'そば' });
    expect(c('鮨 さいとう')).toEqual({ cat: '和食・寿司', sub: '寿司' });
    expect(c('焼肉ジャンボ')).toEqual({ cat: '肉', sub: '焼肉' });
    expect(c('Shake Shack')).toBeNull();
    expect(c('ベーカリー Bread')).toEqual({ cat: '甘いもの', sub: 'パン' });
    expect(c('Blue Bottle Coffee')).toEqual({ cat: 'カフェ', sub: 'カフェ' });
    expect(c('純喫茶 ハト')).toEqual({ cat: 'カフェ', sub: '喫茶店' });
    expect(c('箱根湯本温泉 旅館')).toEqual({ cat: '泊まる', sub: '' });
    expect(c('大江戸温泉')).toEqual({ cat: '温泉', sub: '温泉' });
    expect(c('金閣寺')).toEqual({ cat: '見どころ', sub: '寺社' });
    expect(c('高尾山')).toEqual({ cat: '自然・登山', sub: '山' });
    expect(c('華厳の滝')).toEqual({ cat: '自然・登山', sub: '滝' });
    expect(c('THE BURGER STAND')).toEqual({ cat: '世界の料理', sub: 'バーガー' });
    expect(c('Bar Benfiddich')).toEqual({ cat: '居酒屋・バー', sub: 'バー' });
    expect(c('Ｔｏｋｙｏ Ｒａｍｅｎ')).toEqual({ cat: '麺', sub: 'ラーメン' });
    // the note when the name says nothing (its own end anchors too)
    expect(c('ほげ', 'ここは山')).toEqual({ cat: '自然・登山', sub: '山' });
    expect(c('ほげ', '')).toBeNull();
  });
  it('OpenStreetMap’s tags when the words say nothing', () => {
    expect(ruleCat('ほげ', '', 'amenity=restaurant;cuisine=ramen')).toEqual({ cat: '麺', sub: 'ラーメン' });
    expect(ruleCat('ほげ', '', 'amenity=restaurant;cuisine=japanese;sushi')).toEqual({ cat: '和食・寿司', sub: '' });
    expect(ruleCat('ほげ', '', 'amenity=cafe')).toEqual({ cat: 'カフェ', sub: 'カフェ' });
    expect(ruleCat('ほげ', '', 'shop=hardware')).toEqual({ cat: '買い物', sub: '' });
    expect(ruleCat('ほげ', '', 'amenity=restaurant')).toBeNull();
  });
  it('Workers AI: the names and areas only, its answer held to the taxonomy', async () => {
    let sent = '';
    const ai = { run: async (_m: string, input: Record<string, unknown>) => {
      sent = JSON.stringify(input);
      return { response: { items: [{ i: 0, top: '肉', sub: 'とんかつ' }, { i: 1, top: '肉', sub: '寿司' }, { i: 2, top: 'nope', sub: '' }] } };
    } };
    const r = await aiCats(ai, [{ name: 'A', short: 'x' }, { name: 'B', short: 'y' }, { name: 'C', short: 'z' }, { name: 'D', short: 'w' }]);
    expect(r).toEqual([{ cat: '肉', sub: 'とんかつ' }, { cat: '肉', sub: '' }, { cat: 'その他', sub: '' }, { cat: 'その他', sub: '' }]);
    expect(sent).toContain('0\\tA\\tx');
    // an answer for none of them: tried again next tick, not all その他 for good
    await expect(aiCats({ run: async () => ({ response: { items: [{ i: 9, top: '麺', sub: '' }] } }) }, [{ name: 'A', short: '' }])).rejects.toThrow();
    await expect(aiCats({ run: async () => ({ response: 'sorry' }) }, [{ name: 'A', short: '' }])).rejects.toThrow();
  });
});

describe('time zones and opening hours', () => {
  it('tzOf: Japan, the trips, elsewhere by longitude', () => {
    expect(tzOf(35.68, 139.76)).toBe('Asia/Tokyo');
    expect(tzOf(26.2, 127.7)).toBe('Asia/Tokyo');
    expect(tzOf(43.06, 141.35)).toBe('Asia/Tokyo');
    expect(tzOf(47.6, -122.3)).toBe('America/Los_Angeles');
    expect(tzOf(21.3, -157.8)).toBe('Pacific/Honolulu');
    expect(tzOf(25.03, 121.56)).toBe('Asia/Taipei');
    expect(tzOf(-36.85, 174.76)).toBe('Pacific/Auckland');
    expect(tzOf(48.85, 2.35)).toBe('Europe/Paris');
    expect(tzOf(51.5, -0.12)).toBe('Europe/London');
    expect(tzOf(49.18, -0.37)).toBe('Europe/Paris');
    expect(tzOf(-33.9, 18.4)).toBe('Etc/GMT-1');
  });
  it('ohPeriods: the common forms; anything else unknown', () => {
    expect(ohPeriods('24/7')).toEqual([{ d: 0, o: 0, c: 10080 }]);
    expect(ohPeriods('Mo-Fr 09:00-18:00')).toEqual([1, 2, 3, 4, 5].map((d) => ({ d, o: 540, c: 1080 })));
    expect(ohPeriods('11:00-14:00,17:00-22:30')).toHaveLength(14);
    const late = ohPeriods('Tu-Sa 18:00-02:00; Su,Mo off')!;
    expect(late).toEqual([2, 3, 4, 5, 6].map((d) => ({ d, o: 1080, c: 1560 })));
    // a later rule replaces an earlier's days; a wrap from Saturday to Monday
    expect(ohPeriods('Mo-Su 10:00-20:00; We off')!.map((p) => p.d)).toEqual([0, 1, 2, 4, 5, 6]);
    expect(ohPeriods('Sa-Mo 10:00-16:00')!.map((p) => p.d)).toEqual([0, 1, 6]);
    expect(ohPeriods('Mo-Fr 10:00-19:00; PH off')).toHaveLength(5);
    expect(ohPeriods('Mo-Fr 10:00-19:00, PH 10:00-17:00')).toBeNull();
    for (const bad of ['Jan-Mar 10:00-17:00', 'sunrise-sunset', 'Mo 10:00+', 'Mo-Fr 10:00-19:00 || "by appointment"', '', 'Mo 25:00-26:00']) expect(ohPeriods(bad)).toBeNull();
    // open past midnight on Saturday: Sunday 01:00 is open (contract openAt)
    expect(openAt(ohPeriods('Sa 20:00-03:00'), 'Asia/Tokyo', Date.parse('2026-11-21T16:00:00Z'))).toBe(true);
  });
});

const el = (id: number, name: string, lat: number, lon: number, tags: Record<string, string> = {}): OsmEl => ({ type: 'node', id, lat, lon, tags: { name, ...tags } });

describe('OpenStreetMap', () => {
  it('nameSim: one holding the other, else bigrams; width and case folded', () => {
    expect(nameSim('スターバックス 渋谷店', 'スターバックス')).toBe(1);
    expect(nameSim('ＡＢＣ　Cafe', 'abc cafe')).toBe(1);
    expect(nameSim('一蘭 渋谷店', '一蘭渋谷')).toBe(1);
    expect(nameSim('すし匠', 'ラーメン二郎')).toBe(0);
    // the feature's name later in the place's: the building it's in, not the place
    expect(nameSim('ABCカフェ 渋谷ヒカリエ店', '渋谷ヒカリエ')).toBe(0);
    expect(nameSim('一蘭', '一蘭 渋谷店')).toBe(1);
  });
  it('osmMatch: within 60 m, the most alike name, the nearer of two as alike', () => {
    const p = { name: 'テスト珈琲', lat: 35.6, lng: 139.7 };
    const near = el(1, 'テスト珈琲', 35.6001, 139.7), far = el(2, 'テスト珈琲', 35.601, 139.7), other = el(3, '別の店', 35.6, 139.7);
    expect(osmMatch(p, [far, other])).toBeNull();
    expect(osmMatch(p, [far, other, near])?.id).toBe(1);
    expect(osmMatch(p, [{ type: 'way', id: 9, center: { lat: 35.60005, lon: 139.7 }, tags: { 'name:ja': 'テスト珈琲 本店' } }])?.id).toBe(9);
    expect(osmQuery([{ lat: 35.6, lng: 139.7 }])).toContain('nwr(around:60,35.600000,139.700000)[name];');
  });
  it('a match stored (hours, kind, site), a miss stamped; a refresh after OSM_REFRESH_MS', () => {
    const items = fixtureItems();
    core.apply(items, true);
    const due = core.toEnrich(16);
    const target = due[0];
    const els = [el(42, target.name, target.lat, target.lng, { amenity: 'cafe', opening_hours: 'Mo-Fr 08:00-18:00', website: 'https://example.invalid' })];
    expect(core.setOsm(due.map((p) => ({ id: p.id, el: osmMatch(p, els) })))).toBe(1);
    const p = placeRows(payload()).find((x) => x.id === target.id)!;
    expect(p.hours).toHaveLength(5);
    expect(p.web).toBe('https://example.invalid');
    expect(p.tz).toBe('Asia/Tokyo');
    expect(core.status()).toMatchObject({ hours: 1, enriched: 16 });
    // the misses wait OSM_REFRESH_MS like the hits; the rest come first
    expect(core.toEnrich(100).length).toBe(items.length - 16);
    core.setOsm(items.map((i) => ({ id: i.id, el: null })));
    expect(core.toEnrich(100)).toHaveLength(0);
    now += OSM_REFRESH_MS + 1;
    expect(core.toEnrich(100)).toHaveLength(items.length);
  });
  it('the Actions batch (admin places_osm): matched and stored here; bad input refused', () => {
    const items = fixtureItems();
    core.apply(items, true);
    const due = core.toEnrich(3);
    const els = [el(7, due[0].name, due[0].lat, due[0].lng, { opening_hours: '24/7', amenity: 'cafe' }), { junk: true }];
    expect(core.osmAdmin({ ids: [...due.map((p) => p.id), 'nope'], els })).toEqual({ ok: true, n: 3, hits: 1 });
    expect(core.status()).toMatchObject({ hours: 1, enriched: 3 });
    expect(core.osmAdmin({ ids: 'x', els })).toEqual({ ok: false, error: 'bad_request' });
    expect(core.osmAdmin({ ids: [], els })).toEqual({ ok: false, error: 'bad_request' });
  });
  it('a place AI called その他 takes the category OpenStreetMap’s tags say', () => {
    const [it] = fixtureItems();
    core.apply([it], false);
    core.setCats([{ id: it.id, cat: 'その他', sub: '', src: 'ai' }]);
    const v = core.state().ver;
    core.setOsm([{ id: it.id, el: el(1, it.name, it.lat, it.lng, { amenity: 'restaurant', cuisine: 'udon' }) }]);
    const p = placeRows(payload())[0];
    expect([p.cat, p.sub]).toEqual(['麺', 'うどん']);
    expect(core.state().ver).toBe(v + 1);
    // looked up again and nothing matches now: what that match left cleared, its category asked again
    core.setOsm([{ id: it.id, el: el(1, it.name, it.lat, it.lng, { opening_hours: '24/7', website: 'https://x.invalid' }) }]);
    expect(placeRows(payload())[0].hours).not.toBeNull();
    const v2 = core.state().ver;
    core.setOsm([{ id: it.id, el: null }]);
    const q = placeRows(payload(v2))[0];
    expect([q.hours, q.web, q.cat]).toEqual([null, '', 'その他']);
    expect(core.uncategorised(5).map((x) => x.id)).toEqual([it.id]);
    expect(core.status()).toMatchObject({ hours: 0, enriched: 1 });
  });
});

describe('the payload', () => {
  it('the note, the adder and the people (for every key alike)', () => {
    core.apply(fixtureItems(), true);
    const m = payload();
    expect(m.full).toBe(true);
    expect(m.people).toEqual(['テスト乙', 'テスト甲']);
    expect(m.cols.note?.some((n) => n === 'メモ: 予約がいる')).toBe(true);
    expect(m.cols.by?.every((b) => b === 0 || b === 1)).toBe(true);
    // newest added first, the uncategorised as その他
    expect(m.cols.added).toEqual([...m.cols.added].sort((a, b) => b - a));
    expect(new Set(m.cols.cat)).toEqual(new Set(['その他']));
  });
  it('since: the rows changed after it and the ids gone; a since newer than the list, the whole', () => {
    const items = fixtureItems();
    core.apply(items, true);
    const v = core.state().ver;
    expect(payload(v)).toMatchObject({ full: false, n: 0, gone: [], ver: v });
    now += 1000;
    core.apply([{ ...items[3], note: 'x' }, ...items.slice(0, 3), ...items.slice(5)], true);
    const d = payload(v);
    expect(d.full).toBe(false);
    expect(d.cols.id).toEqual([items[3].id]);
    expect(d.gone).toEqual([items[4].id]);
    expect(payload(v + 99).full).toBe(true);
    expect(payload(v + 99).n).toBe(items.length - 1);
  });
});

const listRes = (body = FIXTURE) => new Response(body, { status: 200, headers: { 'Content-Type': 'application/json' } });

describe('the tick', () => {
  const deps = (o: Partial<TickDeps> = {}): TickDeps => ({ core, now: () => now, ...o });
  const got = (body = listRes().body) => ({ status: 200, loc: '', body });
  it('an answer read and applied, the rules then AI (capped) categorise; the cron’s tick categorises only', async () => {
    let aiCalls = 0;
    const ai = { run: async (_m: string, input: Record<string, unknown>) => {
      aiCalls++;
      const lines = String((input.messages as { content: string }[])[1].content).split('\n');
      return { response: { items: lines.map((_, i) => ({ i, top: '買い物', sub: '' })) } };
    } };
    const r = await placesTick(deps({ ai }), true, got());
    expect(r).toMatchObject({ ok: true, full: true, n: 24, added: 24, gone: 0 });
    expect(r.ruled! + r.ai!).toBe(24);
    expect(r.ruled).toBeGreaterThan(15);
    expect(aiCalls).toBe(Math.ceil((24 - r.ruled!) / CAT_BATCH));
    expect(core.uncategorised(100)).toHaveLength(0);
    expect(placesLog(r)).toMatchObject({ e: 'cron.places', l: 1 });
    // a poll that changed nothing says nothing
    const p = await placesTick(deps({ ai }), false, got());
    expect(p).toMatchObject({ ok: true, full: false, added: 0, changed: 0 });
    expect(placesLog(p)).toBeNull();
    // the cron's: no list read, nothing to categorise, nothing said
    const syncedAt = core.status().syncedAt;
    const c = await placesTick(deps({ ai }), false);
    expect(c).toEqual({ ok: true, full: false, ruled: 0, ai: 0, aiFail: 0, ms: 0 });
    expect(placesLog(c)).toBeNull();
    expect(core.status().syncedAt).toBe(syncedAt);
  });
  it('a refused answer keeps the list, an error at once; a good read clears it', async () => {
    await placesTick(deps(), true, got());
    const before = core.read(null).body;
    const broken = await placesTick(deps(), true, got(listRes(")]}'\n[[null]]").body));
    expect(broken).toMatchObject({ ok: false, why: 'parse' });
    expect(placesLog(broken)).toMatchObject({ e: 'cron.places', l: 3 });
    expect(core.read(null).body.replace(/"ver":\d+/, '')).toBe(before.replace(/"ver":\d+/, ''));
    expect(core.status()).toMatchObject({ count: 24, lastError: { what: 'parse', at: now } });
    expect(await placesTick(deps(), false, { status: 302, loc: 'https://www.google.com/sorry/index', body: null })).toMatchObject({ ok: false, why: 'blocked' });
    await placesTick(deps(), true, got());
    expect(core.status().lastError).toBeUndefined();
  });
  it('getList: the newest n of the list asked of maps.google.com, redirects not followed', async () => {
    const g = await getList(async (u, i) => {
      expect(u).toBe(listUrl('L', PLACES_POLL));
      expect(i.redirect).toBe('manual');
      return new Response('', { status: 302, headers: { Location: 'https://www.google.com/sorry/index?continue=x' } });
    }, 'L', PLACES_POLL);
    expect(g).toMatchObject({ status: 302, loc: expect.stringContaining('/sorry') });
    expect(await getList(async () => { throw new Error('down'); }, 'L', PLACES_POLL)).toEqual({ why: 'fetch' });
  });
});

describe('the Actions pull (admin places_ingest)', () => {
  const deps = (c = core): TickDeps => ({ core: c, now: () => now });
  it('refuses no text, too much, a full that isn’t a boolean; never ticks then', async () => {
    let ticks = 0;
    const tick = async () => (ticks++, { ok: true, full: false, ms: 0 });
    for (const o of [{}, { text: '' }, { text: 5 }, { text: 'x'.repeat(8_000_001) }, { text: FIXTURE, full: 'yes' }]) expect(await ingestOp(o, tick)).toEqual({ ok: false, error: 'bad_request' });
    expect(ticks).toBe(0);
  });
  it('the pulled text read, diffed and stored', async () => {
    const r = await ingestOp({ text: FIXTURE, full: true }, (full, g) => placesTick(deps(), full, g));
    expect(r).toMatchObject({ ok: true, tick: { ok: true, full: true, n: 24, added: 24 } });
    expect(core.status()).toMatchObject({ count: 24 });
    // a recent pull of the same changes nothing; one that drops a place is a poll: nothing gone
    expect(await ingestOp({ text: FIXTURE }, (full, g) => placesTick(deps(), full, g))).toMatchObject({ tick: { full: false, added: 0, changed: 0, gone: 0 } });
    // a broken answer: the last good list kept, the error the latest outcome
    expect(await ingestOp({ text: ")]}'\n[[null]]", full: true }, (full, g) => placesTick(deps(), full, g))).toMatchObject({ ok: false, tick: { why: 'parse' } });
    expect(core.status()).toMatchObject({ count: 24, lastError: { what: 'parse' } });
  });
});

describe('the routes', () => {
  const KEY_A = 'a'.repeat(64), KEY_C = 'c'.repeat(64);
  const env = () => ({
    allowed: 'https://island-fund.pages.dev',
    roleOf: (k: string) => (k === KEY_A ? 'A' as const : k === KEY_C ? 'G' as const : null),
    read: async (s: number | null) => core.read(s),
    status: async () => core.status()
  });
  const get = (path: string, key: string | null, h: Record<string, string> = {}) => placesRoute(new Request(`https://r.example${path}`, { headers: { Origin: 'https://island-fund.pages.dev', ...(key ? { Authorization: `Bearer ${key}` } : {}), ...h } }), path.split('?')[0], env());
  it('a key, CORS, the same payload for the guest, no ETag, the status', async () => {
    core.apply(fixtureItems(), true);
    expect((await get('/places', null)).status).toBe(401);
    expect((await get('/places', 'f'.repeat(64))).status).toBe(401);
    const m = await get('/places', KEY_A);
    expect(m.status).toBe(200);
    expect(m.headers.get('Access-Control-Allow-Origin')).toBe('https://island-fund.pages.dev');
    const mb = await m.json() as PlacesPayload;
    expect(mb.people).toBeDefined();
    expect(m.headers.get('ETag')).toBeNull();
    // the guest reads the notes and the adders as a member does (2026-11-24)
    const g = await (await get('/places', KEY_C)).json() as PlacesPayload;
    expect(g).toEqual(mb);
    const d = await (await get(`/places?since=${mb.ver}`, KEY_C)).json() as PlacesPayload;
    expect(d).toMatchObject({ full: false, n: 0 });
    const s = await (await get('/places/status', KEY_C)).json() as Record<string, unknown>;
    expect(s).toMatchObject({ ok: true, count: 24, ver: mb.ver });
    const evil = await placesRoute(new Request('https://r.example/places', { headers: { Origin: 'https://evil.example', Authorization: `Bearer ${KEY_A}` } }), '/places', env());
    expect(evil.status).toBe(403);
    const post = await placesRoute(new Request('https://r.example/places', { method: 'POST', headers: { Authorization: `Bearer ${KEY_A}` } }), '/places', env());
    expect(post.status).toBe(405);
    // POST /places/sync (any key; older app builds): the status, nothing fetched; a GET refused
    const sync = (method: string, key: string | null) => placesRoute(new Request('https://r.example/places/sync', { method, headers: key ? { Authorization: `Bearer ${key}` } : {} }), '/places/sync', env());
    expect((await sync('POST', null)).status).toBe(401);
    expect((await sync('GET', KEY_C)).status).toBe(405);
    const sr = await sync('POST', KEY_C);
    expect(sr.status).toBe(200);
    expect(await sr.json()).toMatchObject({ ok: true, count: 24 });
  });
});

describe('the record', () => {
  it('the migration makes the table; the dump carries it; a load into an empty record brings it back', () => {
    const a = memSql();
    const store = new StoreCore({ sql: a.sql, tx: a.tx, keys: {}, now: () => now, notify: () => {} });
    store.places.apply(fixtureItems(), true);
    store.places.setCats([{ id: fixtureItems()[0].id, cat: '麺', sub: 'うどん', src: 'rule' }]);
    expect(store.counts().places).toBe(24);
    const rows = store.dump().rows;
    expect(rows.places).toHaveLength(24);
    const text = [...store.dumpText(5)].join('');
    expect((JSON.parse(text) as { rows: { places: unknown[] } }).rows.places).toEqual(rows.places);
    const b = memSql();
    const fresh = new StoreCore({ sql: b.sql, tx: b.tx, keys: {}, now: () => now, notify: () => {} });
    expect(fresh.load({ rows: { places: rows.places } })).toMatchObject({ ok: true, places: 24 });
    // (all but when it was synced: the restored record's next tick says)
    const noSync = (b: string) => b.replace(/"syncedAt":\w+/, '');
    expect(noSync(fresh.places.read(null).body)).toBe(noSync(store.places.read(null).body));
    expect(fresh.load({ rows: { places: rows.places } })).toMatchObject({ places: 0 });
    expect(fresh.load({ rows: { places: [['bad']] } })).toMatchObject({ skipped: 1 });
  });
  it('a record at step 7 gains the table, its rows untouched', () => {
    const m = memSql();
    const old = new StoreCore({ sql: m.sql, tx: m.tx, keys: {}, now: () => now, notify: () => {} });
    m.db.exec('DROP TABLE places');
    m.db.exec("UPDATE meta SET v = '7' WHERE k = 'schema_v'");
    expect(old.counts).toBeDefined();
    const s = new StoreCore({ sql: m.sql, tx: m.tx, keys: {}, now: () => now, notify: () => {} });
    expect(s.schemaV()).toBe(SCHEMA_V);
    expect(s.counts().places).toBe(0);
  });
  it('step 9: OpenStreetMap’s matches looked up again, the misses left', () => {
    const m = memSql();
    const old = new StoreCore({ sql: m.sql, tx: m.tx, keys: {}, now: () => now, notify: () => {} });
    const items = fixtureItems();
    old.places.apply(items, true);
    old.places.setOsm([{ id: items[0].id, el: el(1, items[0].name, items[0].lat, items[0].lng, { opening_hours: '24/7' }) }, { id: items[1].id, el: null }]);
    m.db.exec("DROP INDEX places_uncat; UPDATE meta SET v = '8' WHERE k = 'schema_v'");
    const s = new StoreCore({ sql: m.sql, tx: m.tx, keys: {}, now: () => now, notify: () => {} });
    expect(s.schemaV()).toBe(SCHEMA_V);
    expect(s.places.toEnrich(100).map((x) => x.id)).toContain(items[0].id);
    expect(s.places.toEnrich(100).map((x) => x.id)).not.toContain(items[1].id);
    expect(s.places.status().hours).toBe(1);
  });
  it('the whole payload says the latest sync, though nothing changed (its cache by version and sync)', () => {
    core.apply(fixtureItems(), true);
    expect(payload().syncedAt).toBe(T0);
    now += 30 * 60_000;
    core.apply(fixtureItems().slice(0, PLACES_POLL), false);
    expect([payload().ver, payload().syncedAt]).toEqual([1, now]);
  });
  it('a poll reads its own rows, not the table; the uncategorised by their index', () => {
    core.apply(fixtureItems(), true);
    const before = db.reads();
    core.apply(fixtureItems().slice(0, 3), false);
    expect(db.reads() - before).toBeLessThanOrEqual(3 + 1);
    const plan = db.db.prepare('EXPLAIN QUERY PLAN SELECT id FROM places WHERE deleted_at IS NULL AND category IS NULL ORDER BY added DESC LIMIT 5').all();
    expect(JSON.stringify(plan)).toContain('places_uncat');
  });
  it('a day later, the payload still says when it was synced', () => {
    core.apply(fixtureItems(), true);
    now += DAY;
    expect(payload().syncedAt).toBe(T0);
  });
});
