// 行きたい場所 on the relay (src/places.ts): the list's answer read (a fixture from a real fetch, every value replaced:
// its 13-, 16- and 20-field items, with and without an ftid), the diff (new, changed, unchanged, deletions only on a
// full read, a place put back, the mass-deletion guard), the categories (rules, OpenStreetMap's tags, Workers AI
// mocked), opening_hours, the OpenStreetMap match and the batch (fetch mocked), the payload (the guest's
// stripped, the since-delta), the tick and its log, the routes, and the record's migration, dump and load.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  aiCats, CAT_BATCH, cronLog, itemOf, listUrl, parseList, PlacesCore, placesLog, placesRoute,
  placesTick, ingestOp, DET_BATCH, PLACES_POLL, PLACES_STALE_H, PLACES_TABLES, getList, placeCat, ruleCat, type ListItem, type TickDeps, withRegular
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
  it('status\' count is counted once and kept with each write (2026-11-25: a whole-table count on every wake, ~20k rows an hour)', () => {
    const items = fixtureItems();
    const counts = () => calls.filter((q) => /count\(\*\)/.test(q)).length;
    const calls: string[] = [];
    const exec = db.sql.exec.bind(db.sql);
    (db.sql as { exec: typeof exec }).exec = ((q: string, ...b: never[]) => (calls.push(q), exec(q, ...b))) as typeof exec;
    core.apply(items.slice(0, 6), false);
    expect(core.status().count).toBe(6);
    expect(counts()).toBe(1);
    core.apply(items.slice(0, 8), false);
    core.apply(items.slice(2, 8), true);
    expect(core.status().count).toBe(6);
    core.apply(items.slice(0, 8), true);
    expect([core.status().count, core.status().count]).toEqual([8, 8]);
    expect(counts()).toBe(1);
    // (a fresh object reads it from meta)
    const again = new PlacesCore({ sql: db.sql, tx: db.tx, now: () => now, meta: (k) => meta.get(k) ?? null, setMeta: (k, v) => void meta.set(k, v) });
    expect(again.status().count).toBe(8);
    expect(counts()).toBe(1);
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
  it('a name or note edit asks the category again; a move does not', () => {
    const items = fixtureItems();
    core.apply(items, true);
    core.setCats(items.map((i) => ({ id: i.id, cat: 'その他', sub: '', src: 'ai' })));
    expect(core.uncategorised(100)).toHaveLength(0);
    core.apply(items.map((i, k) => (k === 0 ? { ...i, name: i.name + '2' } : k === 1 ? { ...i, lat: i.lat + 0.01 } : i)), true);
    expect(core.uncategorised(100).map((x) => x.id)).toEqual([items[0].id]);
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
  it('openAt: a period past Saturday midnight is open on Sunday 01:00', () => {
    expect(openAt([{ d: 6, o: 1200, c: 1620 }], 'Asia/Tokyo', Date.parse('2026-11-21T16:00:00Z'))).toBe(true);
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
    // no hours, no website (the details'), the columns kept for older builds' check
    expect([new Set(m.cols.hours), new Set(m.cols.web), m.cols.hours.length]).toEqual([new Set([null]), new Set(['']), m.n]);
    expect(placesPayloadOf(JSON.parse(JSON.stringify(m)))).not.toBeNull();
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

describe('the cron’s line (cronLog)', () => {
  const tick = (aiFail = 0) => ({ ok: true, full: false, ruled: 0, ai: 0, aiFail, ms: 5 });
  it('says only a change of state: the categoriser failing, the list stale, well again; never the same every tick', () => {
    const T = Date.parse('2026-11-23T00:00:00.000Z'), fresh = T - 60_000, old = T - (PLACES_STALE_H + 1) * 3_600_000;
    expect(cronLog(tick(), fresh, T, 'ok')).toEqual({ st: 'ok', ev: null });
    // (never pulled: nothing to say)
    expect(cronLog(tick(), null, T, 'ok')).toEqual({ st: 'ok', ev: null });
    expect(cronLog(tick(2), fresh, T, 'ok')).toEqual({ st: 'ai', ev: { e: 'cron.places', l: 2, d: { ok: true, full: false, ai: 0, aiFail: 2, ms: 5 } } });
    expect(cronLog(tick(2), fresh, T, 'ai').ev).toBeNull();
    expect(cronLog(tick(), old, T, 'ai')).toEqual({ st: 'stale', ev: { e: 'cron.places', l: 2, d: { ok: true, full: false, why: 'stale', ai: 0, aiFail: 0, ms: 5 } } });
    expect(cronLog(tick(), old, T, 'stale').ev).toBeNull();
    expect(cronLog(tick(), fresh, T, 'stale')).toMatchObject({ st: 'ok', ev: { l: 1, d: { ok: true } } });
  });
});

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

describe('the details scrape’s ids (admin places_ids)', () => {
  it('the live places with a Google page: id, coordinates, save time, last look-up (0 never); never a gone one, a k: pin, a name or a note', () => {
    const items = fixtureItems();
    const pin: ListItem = { ...items[0], id: 'k:abc', cid: null, ftid: null };
    core.apply([...items, pin], true);
    core.apply(items.slice(1), true);
    const ids = core.ids();
    const google = items.slice(1).filter((i) => !i.id.startsWith('k:'));
    expect(google.length).toBeGreaterThan(5);
    expect(ids.map((r) => r[0])).toEqual(google.map((i) => i.id).sort());
    const it1 = google[0];
    expect(ids.find((r) => r[0] === it1.id)!.slice(0, 6)).toEqual([it1.id, it1.lat, it1.lng, it1.added, 0, 0]);
    // [5]: its details found no hours (the no-hours one-off's); [6] its category
    const [a, b] = google;
    core.setDetails({ rows: [[a.id, { at: 1, hours: null }, []], [b.id, { at: 1, hours: [{ d: 1, o: 600, c: 1200 }] }, []]] });
    const again = core.ids();
    expect(again.find((r) => r[0] === a.id)![5]).toBe(1);
    expect(again.find((r) => r[0] === b.id)![5]).toBe(0);
    expect(again.every((r) => typeof r[6] === 'string')).toBe(true);
    // [7] its photos (0 none), [8] its card's openings
    expect(again.find((r) => r[0] === a.id)!.slice(7)).toEqual([0, 0]);
    expect(JSON.stringify(ids)).not.toContain(it1.name);
  });
});

describe('Google’s kind in the categories, the zones again (admin places_recat_kind, places_retz)', () => {
  it('placeCat: a strong kind beats the keywords (a hot-spring hotel and a same-category keyword kept), the others only fill in', () => {
    expect(placeCat('山の上ベーカリー', '', 'ラーメン屋')).toEqual({ cat: '麺', sub: 'ラーメン', src: 'kind' });
    expect(placeCat('ゆもと温泉', '', '旅館')).toEqual({ cat: '温泉', sub: '温泉', src: 'rule' });
    expect(placeCat('森の喫茶', '', 'カフェ・喫茶')).toEqual({ cat: 'カフェ', sub: '喫茶店', src: 'rule' });
    expect(placeCat('甘味処 うさぎ', '', 'カフェ・喫茶')).toEqual({ cat: '甘いもの', sub: '和菓子', src: 'rule' });
    expect(placeCat('Blue Door', '', 'ホテル')).toEqual({ cat: '泊まる', sub: '', src: 'kind' });
    expect(placeCat('寿司 たなか', '', '居酒屋')).toEqual({ cat: '和食・寿司', sub: '寿司', src: 'rule' });
    expect(placeCat('たなか', '', '居酒屋')).toEqual({ cat: '居酒屋・バー', sub: '居酒屋', src: 'kind' });
    expect(placeCat('たなか', '', '駅')).toBeNull();
    expect(placeCat('たなか', '', undefined)).toBeNull();
  });
  it('recategorises a guess when its details land and in the one-off (idempotent, dry counts); rules stay unless strong', () => {
    core.apply(fixtureItems(), true);
    const [[a], [b]] = core.ids();
    core.setCats([{ id: a, cat: '和食・寿司', sub: '', src: 'ai' }, { id: b, cat: '見どころ', sub: '', src: 'ai' }]);
    const v0 = payload().ver;
    core.setDetails({ rows: [[a, { at: 1, hours: null, kind: 'ラーメン屋' }, []]] });
    const d = payload(v0);
    expect(placeRows(d).find((p) => p.id === a)).toMatchObject({ cat: '麺', sub: 'ラーメン' });
    // b's kind landed before the rule (an old row): the one-off finds it
    db.sql.exec('UPDATE places SET det = ? WHERE id = ?', JSON.stringify({ at: 1, hours: null, kind: 'ホテル' }), b);
    expect(core.recatAll(true)).toMatchObject({ changed: 1 });
    expect(core.recatAll(false)).toMatchObject({ changed: 1 });
    expect(placeRows(payload()).find((p) => p.id === b)).toMatchObject({ cat: '泊まる' });
    expect(core.recatAll(false)).toMatchObject({ changed: 0 });
  });
  it('places_retz writes only the zones that differ, a new version for them; again: nothing', () => {
    core.apply(fixtureItems(), true);
    const [[a]] = core.ids();
    const tz = placeRows(payload()).find((p) => p.id === a)!.tz;
    db.sql.exec("UPDATE places SET tz = 'Etc/GMT+7' WHERE id = ?", a);
    const v0 = payload().ver;
    expect(core.retz(true)).toMatchObject({ changed: 1 });
    expect(payload().ver).toBe(v0);
    expect(core.retz(false)).toMatchObject({ changed: 1 });
    const d = payload(v0);
    expect(placeRows(d).map((p) => [p.id, p.tz])).toEqual([[a, tz]]);
    expect(core.retz(false)).toMatchObject({ changed: 0 });
  });
});

describe('special days (det.sp: a holiday’s own hours)', () => {
  const H = (d: number, o: number, c: number) => ({ d, o, c });
  it('withRegular: the special weekdays from the last look-up’s regular; a weekday special then too kept; no last: as is', () => {
    const next = { at: 2, hours: [H(0, 600, 1080), H(2, 600, 1080)], sp: [1] };
    const prev = { at: 1, hours: [H(0, 600, 1080), H(1, 660, 1200), H(2, 600, 1080)] };
    expect(withRegular(next, prev)).toEqual({ at: 2, hours: [H(0, 600, 1080), H(1, 660, 1200), H(2, 600, 1080)] });
    expect(withRegular(next, { ...prev, sp: [1] })).toEqual(next);
    expect(withRegular(next, null)).toEqual(next);
    expect(withRegular(next, { at: 1, hours: null })).toEqual(next);
    // round the clock all week, one day a holiday's: whole again
    const all = { at: 1, hours: [H(0, 0, 7 * 1440)] };
    expect(withRegular({ at: 2, hours: [0, 2, 3, 4, 5, 6].map((d) => H(d, 0, 1440)), sp: [1], pn: 2 }, all)).toEqual({ at: 2, hours: [H(0, 0, 7 * 1440)], pn: 2 });
  });
  it('places_details stores the merge', () => {
    core.apply(fixtureItems(), true);
    const [id] = core.ids()[0];
    core.setDetails({ rows: [[id, { at: 1, hours: [H(1, 660, 1200), H(2, 600, 1080)] }, []]] });
    core.setDetails({ rows: [[id, { at: 2, hours: [H(2, 600, 1080)], sp: [1] }, []]] });
    // (the merge equals what's stored: the row kept as it was, no new version)
    expect(placeRows(payload()).find((p) => p.id === id)!.det).toEqual({ at: 1, hours: [H(1, 660, 1200), H(2, 600, 1080)] });
  });
});

describe('Google’s details (admin places_details)', () => {
  const PIC = (c: string) => `https://lh3.googleusercontent.com/grass-cs/${c.repeat(60)}`;
  const DET = { at: 100, hours: [{ d: 1, o: 600, c: 1200 }], web: 'https://a.example/', tel: '03-1234-5678', desc: '静かな店', r: 4.2, rn: 31, kind: 'カフェ' };
  it('stores a det and its links, the phones get the row in their delta; the same again (but its time) keeps the version', () => {
    core.apply(fixtureItems(), true);
    const [id] = core.ids()[0];
    const v0 = payload().ver;
    expect(core.setDetails({ rows: [[id, DET, [PIC('a'), PIC('b')]]] })).toEqual({ ok: true, n: 1, changed: 1, missed: 0, skipped: 0, bad: 0 });
    const d = payload(v0);
    expect(d.n).toBe(1);
    expect(placeRows(d)[0]).toMatchObject({ id, det: { ...DET, pn: 2 } });
    expect(core.pics(id)).toEqual(['a'.repeat(60), 'b'.repeat(60)]);
    const v1 = payload().ver;
    now += DAY;
    expect(core.setDetails({ rows: [[id, { ...DET, at: 200 }, [PIC('a'), PIC('b')]]] })).toMatchObject({ n: 1, changed: 0 });
    expect(payload().ver).toBe(v1);
    expect(core.ids().find((r) => r[0] === id)![4]).toBe(Math.floor(now / 1000));
    // new hours: a change; the links gone: none
    expect(core.setDetails({ rows: [[id, { ...DET, at: 300, hours: null }, []]] })).toMatchObject({ changed: 1 });
    expect(placeRows(payload()).find((p) => p.id === id)!.det).toEqual({ ...DET, at: 300, hours: null });
    expect(core.pics(id)).toEqual([]);
  });
  it('up to PICS_MAX (10) links a place, in order; 11 a bad row, the place’s own kept', () => {
    core.apply(fixtureItems(), true);
    const [id] = core.ids()[0];
    const ten = 'ABCDEFGHIJ'.split('').map(PIC);
    expect(core.setDetails({ rows: [[id, DET, ten]] })).toMatchObject({ n: 1, changed: 1, bad: 0 });
    expect(core.pics(id)).toEqual('ABCDEFGHIJ'.split('').map((c) => c.repeat(60)));
    expect(placeRows(payload()).find((p) => p.id === id)!.det!.pn).toBe(10);
    expect(core.ids().find((r) => r[0] === id)![7]).toBe(10);
    expect(core.setDetails({ rows: [[id, { ...DET, at: 200 }, [...ten, PIC('K')]]] })).toMatchObject({ n: 0, bad: 1 });
    expect(core.pics(id)).toHaveLength(10);
  });
  it('a card’s openings (each /places/pics answer) counted in the queue’s [8]; a gone or unknown place’s never', () => {
    core.apply(fixtureItems(), true);
    const [[a], [b]] = core.ids();
    core.pics(a);
    core.pics(a);
    core.pics(b);
    core.pics('999');
    const ids = core.ids();
    expect(ids.find((r) => r[0] === a)![8]).toBe(2);
    expect(ids.find((r) => r[0] === b)![8]).toBe(1);
    expect(ids.filter((r) => r[8] > 0)).toHaveLength(2);
    expect(db.db.prepare('SELECT count(*) AS n FROM place_opens').get()).toEqual({ n: 2 });
  });
  it('a miss keeps the details and moves the place back in the queue; unknown, gone and bad rows counted', () => {
    core.apply(fixtureItems(), true);
    const [[a], [b]] = core.ids();
    core.setDetails({ rows: [[a, DET, []]] });
    now += DAY;
    expect(core.setDetails({ rows: [[a, null], ['999', DET], [b, { at: 'x' }], [b, DET, ['http://evil.example/x.jpg']], ['x'.repeat(99), DET], 'junk'] }))
      .toEqual({ ok: true, n: 1, changed: 0, missed: 1, skipped: 1, bad: 4 });
    expect(placeRows(payload()).find((p) => p.id === a)!.det).toMatchObject({ at: 100 });
    expect(core.ids().find((r) => r[0] === a)![4]).toBe(Math.floor(now / 1000));
    expect(core.ids().find((r) => r[0] === b)![4]).toBe(0);
    expect(core.setDetails({ rows: 'x' })).toEqual({ ok: false, error: 'bad_request' });
    expect(core.setDetails({ rows: Array.from({ length: DET_BATCH + 1 }, () => [a, null]) })).toEqual({ ok: false, error: 'bad_request' });
  });
  it('a field off its rules is dropped, never stored: no HTML, no http link, no odd phone', () => {
    core.apply(fixtureItems(), true);
    const [id] = core.ids()[0];
    core.setDetails({ rows: [[id, { ...DET, web: 'http://a.example/', tel: 'call me', desc: '<b>x</b>', r: 9, extra: 'no' }, []]] });
    expect(placeRows(payload()).find((p) => p.id === id)!.det).toEqual({ at: 100, hours: DET.hours, rn: 31, kind: 'カフェ' });
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
    status: async () => core.status(),
    pics: async (id: string) => core.pics(id)
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
  it('/places/pics: a place’s photo tokens (any key), a bad id refused', async () => {
    core.apply(fixtureItems(), true);
    const id = core.ids()[0][0];
    core.setDetails({ rows: [[id, { at: 1, hours: null }, [`https://lh3.googleusercontent.com/grass-cs/${'A'.repeat(40)}`]]] });
    expect((await get(`/places/pics?id=${id}`, null)).status).toBe(401);
    expect(await (await get(`/places/pics?id=${id}`, KEY_C)).json()).toEqual({ ok: true, pics: ['A'.repeat(40)] });
    expect(await (await get('/places/pics?id=1', KEY_A)).json()).toEqual({ ok: true, pics: [] });
    expect((await get('/places/pics?id=k:1,2|x', KEY_A)).status).toBe(400);
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
    // a dump from before step 12 (OpenStreetMap's 7 columns: place_id, types, hours, oh after cat_src, website,
    // enriched_at, src after tz) loads as the same rows; one from before the details (step 11) too, with none
    const osm = (r: unknown[]) => [...r.slice(0, 18), 'p', 't', 'h', 'o', r[18], 'w', 1, 'osm', ...r.slice(19)];
    const c = memSql();
    const was = new StoreCore({ sql: c.sql, tx: c.tx, keys: {}, now: () => now, notify: () => {} });
    expect(was.load({ rows: { places: rows.places.map((r) => osm(r as unknown[])) } })).toMatchObject({ ok: true, places: 24 });
    expect(was.dump().rows.places).toEqual(rows.places);
    const d = memSql();
    const older = new StoreCore({ sql: d.sql, tx: d.tx, keys: {}, now: () => now, notify: () => {} });
    expect(older.load({ rows: { places: rows.places.map((r) => osm(r as unknown[]).slice(0, -3)) } })).toMatchObject({ ok: true, places: 24 });
    expect(placesPayloadOf(JSON.parse(older.places.read(null).body))!.cols.det!.every((d) => d === null)).toBe(true);
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
  it('step 9: a record at step 8 migrates, its rows kept', () => {
    const m = memSql();
    const old = new StoreCore({ sql: m.sql, tx: m.tx, keys: {}, now: () => now, notify: () => {} });
    old.places.apply(fixtureItems(), true);
    m.db.exec("DROP INDEX places_uncat; UPDATE meta SET v = '8' WHERE k = 'schema_v'");
    const s = new StoreCore({ sql: m.sql, tx: m.tx, keys: {}, now: () => now, notify: () => {} });
    expect(s.schemaV()).toBe(SCHEMA_V);
    expect(s.places.status().count).toBe(24);
  });
  it('step 11: a table from before the details gains their columns, its rows kept (a new one has them: no error)', () => {
    const m = memSql();
    const old = new StoreCore({ sql: m.sql, tx: m.tx, keys: {}, now: () => now, notify: () => {} });
    old.places.apply(fixtureItems(), true);
    m.db.exec("ALTER TABLE places DROP COLUMN det; ALTER TABLE places DROP COLUMN pics; ALTER TABLE places DROP COLUMN det_at; UPDATE meta SET v = '10' WHERE k = 'schema_v'");
    const s = new StoreCore({ sql: m.sql, tx: m.tx, keys: {}, now: () => now, notify: () => {} });
    expect(s.schemaV()).toBe(SCHEMA_V);
    expect(s.places.status().count).toBe(24);
    const [id] = s.places.ids()[0];
    expect(s.places.setDetails({ rows: [[id, { at: 1, hours: null }]] })).toMatchObject({ n: 1, changed: 1 });
  });
  it('step 13: a record at step 12 gains place_opens, the queue counts openings', () => {
    const m = memSql();
    const old = new StoreCore({ sql: m.sql, tx: m.tx, keys: {}, now: () => now, notify: () => {} });
    old.places.apply(fixtureItems(), true);
    m.db.exec("DROP TABLE place_opens; UPDATE meta SET v = '12' WHERE k = 'schema_v'");
    const s = new StoreCore({ sql: m.sql, tx: m.tx, keys: {}, now: () => now, notify: () => {} });
    expect(s.schemaV()).toBe(SCHEMA_V);
    const [id] = s.places.ids()[0];
    s.places.pics(id);
    expect(s.places.ids()[0][8]).toBe(1);
  });
  it('step 12: a table with OpenStreetMap’s columns copied without them, its rows, details and indexes kept', () => {
    const m = memSql();
    const old = new StoreCore({ sql: m.sql, tx: m.tx, keys: {}, now: () => now, notify: () => {} });
    old.places.apply(fixtureItems(), true);
    const [id] = old.places.ids()[0];
    old.places.setDetails({ rows: [[id, { at: 1, hours: null }]] });
    const before = old.dump().rows.places;
    for (const c of ['place_id TEXT', 'types TEXT', 'hours TEXT', 'oh TEXT', 'website TEXT', 'enriched_at INTEGER', 'src TEXT']) m.db.exec(`ALTER TABLE places ADD COLUMN ${c}`);
    m.db.exec("UPDATE places SET hours = 'x', src = 'osm'; UPDATE meta SET v = '11' WHERE k = 'schema_v'");
    const s = new StoreCore({ sql: m.sql, tx: m.tx, keys: {}, now: () => now, notify: () => {} });
    expect(s.schemaV()).toBe(SCHEMA_V);
    const cols = (m.db.prepare('PRAGMA table_info(places)').all() as { name: string }[]).map((r) => r.name);
    expect(cols).not.toContain('hours');
    expect(cols).toHaveLength(22);
    expect(s.dump().rows.places).toEqual(before);
    expect((m.db.prepare("SELECT name FROM sqlite_master WHERE type = 'index' AND tbl_name = 'places' AND name LIKE 'places_%' ORDER BY name").all() as { name: string }[]).map((r) => r.name)).toEqual(['places_uncat', 'places_ver']);
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
