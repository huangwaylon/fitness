// 共有リンク on the relay (src/share.ts, docs/travel.md "The relay's part"): the members' actions as A and B (each
// other's links too) and the guest's refusal; the caps; the visitor's read (an unknown token and a turned-off link alike,
// an expired one with its date); what is a visit (once, not a bot, not our own phone, not a reload within 30 minutes),
// the day's salt and its turn, the 500 visits kept, the 90-day sweep, the limits; a trip's read touching no record table;
// the Worker's gate (junk never reaches the record); the dump and its load; the migration on a populated record.
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SCHEMA_V, StoreCore, type Sql } from '../src/store.ts';
import { GONE, ipNet, SHARE_MISSES_PER_HOUR, SHARE_VISITOR_PER_MINUTE, shareRoute, type ShareReadIn } from '../src/share.ts';
import { SHARE_LIVE_PER_REF, SHARE_VISITS_KEPT, type ShareRow } from '../../app/src/lib/contract/share.ts';
import { memSql } from './sqlite.ts';

const KEY_A = 'a'.repeat(64), KEY_B = 'b'.repeat(64), KEY_C = 'c'.repeat(64);
const keys = { KEY_A, KEY_B, KEY_C };
const T0 = Date.parse('2026-11-20T03:00:00.000Z'); // 12:00 Tokyo
const MIN = 60_000, DAY = 86_400_000;
const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1';
const MAC = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/18.0 Safari/605.1.15';

let now: number, db: ReturnType<typeof memSql>, store: StoreCore, logged: [string, Record<string, unknown>][];
beforeEach(() => {
  now = T0;
  db = memSql();
  logged = [];
  store = new StoreCore({ sql: db.sql, tx: db.tx, keys, now: () => now, notify: () => {}, log: (e, d) => logged.push([e, d]) });
});

const api = (key: string, action: string, b: Record<string, unknown> = {}) => store.handle({ key, action, ...b }, 0) as Record<string, any>;
const make = (key = KEY_A, b: Record<string, unknown> = {}): ShareRow => {
  const r = api(key, 'share_make', { kind: 'trip', ref: 'nz', days: 365, ...b });
  expect(r.ok).toBe(true);
  return r.row as ShareRow;
};
const read = (t: string, o: Partial<ShareReadIn> = {}) => store.share.read({ t, self: false, ip: '203.0.113.7', ua: IPHONE, cc: 'JP', ...o });
const rowOf = (id: string) => (api(KEY_A, 'share_visits', { id }) as { row: ShareRow }).row;

describe('the members’ actions', () => {
  it('A makes a link: its token and id, a year by default preset, its label; B lists it, renames it, turns it off and on', () => {
    const r = make(KEY_A, { label: '  両親へ ' });
    expect(r).toMatchObject({ kind: 'trip', ref: 'nz', label: '両親へ', by: 'A', at: '2026-11-20T03:00:00.000Z', exp: '2027-11-20T03:00:00.000Z', off: null, views: 0, uniq: 0, first: null, last: null });
    expect(r.token).toMatch(/^[A-Za-z0-9_-]{22}$/);
    expect(r.id).toMatch(/^[0-9a-f]{16}$/);
    expect(api(KEY_B, 'share_list', { kind: 'trip', ref: 'nz' }).rows).toEqual([r]);
    expect(api(KEY_B, 'share_list', { kind: 'trip', ref: 'zao' }).rows).toEqual([]);
    expect(api(KEY_B, 'share_set', { id: r.id, label: '友だち' }).row.label).toBe('友だち');
    now += DAY;
    const off = api(KEY_B, 'share_set', { id: r.id, off: true }).row as ShareRow;
    expect(off.off).toBe('2026-11-21T03:00:00.000Z');
    // turning it off again keeps the first time; back on (取り消す)
    expect(api(KEY_A, 'share_set', { id: r.id, off: true }).row.off).toBe(off.off);
    expect(api(KEY_A, 'share_set', { id: r.id, off: false }).row.off).toBeNull();
    expect(logged.filter(([e]) => e === 'share').map(([, d]) => d.op)).toEqual(['make', 'set', 'set', 'set', 'set']);
    expect(JSON.stringify(logged)).not.toContain(r.token);
    expect(JSON.stringify(logged)).not.toContain(r.id);
  });
  it('期限を変更: a preset from now (even after the expiry: it comes back); anything but a preset refused', () => {
    const r = make(KEY_A, { days: 7 });
    expect(r.exp).toBe('2026-11-27T03:00:00.000Z');
    now += 30 * DAY;
    expect(rowOf(r.id).exp < new Date(now).toISOString()).toBe(true);
    expect(api(KEY_B, 'share_set', { id: r.id, days: 30 }).row.exp).toBe(new Date(now + 30 * DAY).toISOString());
    for (const days of [0, 1, 366, 400, '365', null]) expect(api(KEY_A, 'share_make', { kind: 'trip', ref: 'nz', days })).toEqual({ ok: false, error: 'bad_request' });
    expect(api(KEY_A, 'share_set', { id: r.id, days: 3650 })).toEqual({ ok: false, error: 'bad_request' });
  });
  it('refuses another kind, another trip, a bad id, a long label, an unknown link', () => {
    expect(api(KEY_A, 'share_make', { kind: 'board', ref: 'nz', days: 7 }).error).toBe('bad_request');
    expect(api(KEY_A, 'share_make', { kind: 'trip', ref: 'hawaii', days: 7 }).error).toBe('bad_request');
    expect(api(KEY_A, 'share_make', { kind: 'trip', ref: 'nz', days: 7, label: 'x'.repeat(500) }).error).toBe('bad_request');
    expect(make(KEY_A, { label: 'あ'.repeat(60) }).label).toBe('あ'.repeat(40));
    expect(api(KEY_A, 'share_set', { id: 'nope', off: true }).error).toBe('bad_request');
    expect(api(KEY_A, 'share_set', { id: '0'.repeat(16), off: true })).toEqual({ ok: false, error: 'bad_request', detail: 'no such link' });
    expect(api(KEY_A, 'share_visits', { id: '0'.repeat(16) }).error).toBe('bad_request');
  });
  it('the guest can do none of it, and a stranger is unauthorized', () => {
    const r = make();
    for (const [action, b] of [['share_list', { kind: 'trip', ref: 'nz' }], ['share_make', { kind: 'trip', ref: 'nz', days: 7 }], ['share_set', { id: r.id, off: true }], ['share_visits', { id: r.id }]] as const) {
      expect(api(KEY_C, action, b)).toEqual({ ok: false, error: 'forbidden' });
      expect(api('d'.repeat(64), action, b)).toEqual({ ok: false, error: 'unauthorized' });
    }
    expect(rowOf(r.id).off).toBeNull();
  });
  it('caps: 20 live a trip, 100 in all; an ended link frees its place, and coming back must fit', () => {
    const rows = Array.from({ length: SHARE_LIVE_PER_REF }, () => make());
    expect(api(KEY_A, 'share_make', { kind: 'trip', ref: 'nz', days: 7 })).toEqual({ ok: false, error: 'bad_request', detail: 'cap' });
    expect(logged.at(-1)).toEqual(['share', expect.objectContaining({ op: 'make', ok: false, why: 'cap' })]);
    api(KEY_A, 'share_set', { id: rows[0].id, off: true });
    const extra = make();
    expect(api(KEY_A, 'share_set', { id: rows[0].id, off: false })).toEqual({ ok: false, error: 'bad_request', detail: 'cap' });
    api(KEY_A, 'share_set', { id: extra.id, off: true });
    expect(api(KEY_A, 'share_set', { id: rows[0].id, off: false }).ok).toBe(true);
    for (const ref of ['okinawa', 'seattle', 'zao']) for (let i = 0; i < 20; i++) make(KEY_B, { ref });
    // (four trips of 20: the 100 in all is a later kind's bound)
    expect(api(KEY_B, 'share_make', { kind: 'trip', ref: 'zao', days: 7 }).detail).toBe('cap');
  });
});

describe('the visitor’s read', () => {
  it('a live link: its kind, ref, expiry and the trip’s empty snapshot; counted once, with the device and the country', async () => {
    const r = make();
    expect((await read(r.token)).reply).toEqual({ ok: true, kind: 'trip', ref: 'nz', exp: r.exp, data: {} });
    const v = api(KEY_B, 'share_visits', { id: r.id });
    expect(v.row).toMatchObject({ views: 1, uniq: 1, first: '2026-11-20T03:00:00.000Z', last: '2026-11-20T03:00:00.000Z' });
    expect(v.visits).toEqual([{ at: '2026-11-20T03:00:00.000Z', dev: 'iphone', cc: 'JP', fresh: true }]);
  });
  it('an unknown token and a turned-off link answer alike; an expired one says so, with its date', async () => {
    const r = make(KEY_A, { days: 7 });
    const unknown = await read('A'.repeat(22));
    api(KEY_A, 'share_set', { id: r.id, off: true });
    const off = await read(r.token);
    expect(off.reply).toEqual(GONE);
    expect(JSON.stringify(unknown.reply)).toBe(JSON.stringify(off.reply));
    expect(unknown.status).toBe(off.status);
    api(KEY_A, 'share_set', { id: r.id, off: false });
    now += 7 * DAY;
    expect((await read(r.token)).reply).toEqual({ ok: false, error: 'gone', why: 'expired', exp: r.exp });
    expect(rowOf(r.id).views).toBe(0);
  });
  it('not a visit: a bot, our own phone (self), a reload within 30 minutes; after it, a visit but not a new visitor', async () => {
    const r = make();
    expect((await read(r.token, { ua: 'facebookexternalhit/1.1' })).why).toBe('bot');
    expect((await read(r.token, { ua: '' })).why).toBe('bot');
    expect((await read(r.token, { self: true })).why).toBe('self');
    expect((await read(r.token)).why).toBe('counted');
    now += 29 * MIN;
    expect((await read(r.token)).why).toBe('repeat');
    now += 2 * MIN;
    expect((await read(r.token)).why).toBe('counted');
    // another visitor (another IP, or the same IP on a Mac)
    expect((await read(r.token, { ip: '198.51.100.2' })).why).toBe('counted');
    expect((await read(r.token, { ua: MAC, cc: 'US' })).why).toBe('counted');
    expect(rowOf(r.id)).toMatchObject({ views: 4, uniq: 3 });
    const v = api(KEY_A, 'share_visits', { id: r.id }).visits as { dev: string; cc: string; fresh: boolean }[];
    // the newest first: the Mac, the other IP, the first visitor again (not new today), the first visitor
    expect(v.map((x) => [x.dev, x.cc, x.fresh])).toEqual([['mac', 'US', true], ['iphone', 'JP', true], ['iphone', 'JP', false], ['iphone', 'JP', true]]);
  });
  it('no IP, UA or hash of either is kept anywhere: the visit is its time, device class, country and freshness', async () => {
    const r = make();
    await read(r.token, { ip: '203.0.113.99', ua: IPHONE });
    const dumpAll = JSON.stringify(db.db.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all().map((t) => db.db.prepare(`SELECT * FROM "${(t as { name: string }).name}"`).all()));
    expect(dumpAll).not.toContain('203.0.113.99');
    expect(dumpAll).not.toContain('iPhone OS');
    expect(Object.keys(db.db.prepare('SELECT * FROM share_visit').get() as object)).toEqual(['seq', 'id', 'at', 'dev', 'cc', 'fresh']);
  });
  it('the day’s turn (Tokyo midnight): a new salt, the day’s hashes emptied, so the same visitor is new again', async () => {
    const r = make();
    await read(r.token);
    const salt1 = (db.db.prepare("SELECT v FROM meta WHERE k = 'share_salt'").get() as { v: string }).v;
    expect(JSON.parse(salt1).day).toBe('2026-11-20');
    expect((db.db.prepare('SELECT count(*) AS n FROM share_seen').get() as { n: number }).n).toBe(1);
    now = Date.parse('2026-11-20T15:00:00.000Z'); // 00:00 Tokyo the 21st
    expect((await read(r.token)).why).toBe('counted');
    const salt2 = (db.db.prepare("SELECT v FROM meta WHERE k = 'share_salt'").get() as { v: string }).v;
    expect(JSON.parse(salt2)).toMatchObject({ day: '2026-11-21' });
    expect(JSON.parse(salt2).s).not.toBe(JSON.parse(salt1).s);
    expect(JSON.parse(salt2).s).toMatch(/^[0-9a-f]{64}$/);
    expect(rowOf(r.id)).toMatchObject({ views: 2, uniq: 2 });
    expect((db.db.prepare('SELECT count(*) AS n FROM share_seen').get() as { n: number }).n).toBe(1);
    // a restart keeps the day's salt (meta)
    const again = new StoreCore({ sql: db.sql, tx: db.tx, keys, now: () => now, notify: () => {} });
    now += MIN * 40;
    expect((await again.share.read({ t: r.token, self: false, ip: '203.0.113.7', ua: IPHONE, cc: 'JP' })).why).toBe('counted');
    expect(rowOf(r.id).uniq).toBe(2);
  });
  it('keeps the last 500 visits a link, its counters whole', async () => {
    const r = make();
    for (let i = 0; i < SHARE_VISITS_KEPT + 5; i++) {
      now += 31 * MIN;
      await read(r.token, { ip: `10.0.${i >> 8}.${i & 255}` });
    }
    expect((db.db.prepare('SELECT count(*) AS n FROM share_visit WHERE id = ?').get(r.id) as { n: number }).n).toBe(SHARE_VISITS_KEPT);
    expect(rowOf(r.id).views).toBe(SHARE_VISITS_KEPT + 5);
    expect((api(KEY_A, 'share_visits', { id: r.id }).visits as unknown[]).length).toBe(50);
  });
  it('limits: a visitor’s 30 reads a minute, 20 misses an hour, then busy (429)', async () => {
    const r = make();
    for (let i = 0; i < SHARE_VISITOR_PER_MINUTE; i++) expect((await read(r.token)).status).toBe(200);
    expect(await read(r.token)).toMatchObject({ status: 429, reply: { ok: false, error: 'busy' }, why: 'busy' });
    expect((await read(r.token, { ip: '198.51.100.9' })).status).toBe(200);
    now += MIN;
    expect((await read(r.token)).status).toBe(200);
    for (let i = 0; i < SHARE_MISSES_PER_HOUR; i++) {
      now += 4 * 1000;
      expect((await read('B'.repeat(22), { ip: '192.0.2.1' })).reply).toEqual(GONE);
    }
    expect((await read(r.token, { ip: '192.0.2.1' })).status).toBe(429);
    now += 60 * MIN;
    expect((await read(r.token, { ip: '192.0.2.1' })).status).toBe(200);
  });
  it('limits: one visitor (an address, an IPv6 /64) can’t use up the reads in all, whatever its User-Agent', async () => {
    const r = make();
    for (let i = 0; i < 700; i++) await read('C'.repeat(22), { ip: '192.0.2.50', ua: `bot-${i}` });
    for (let i = 0; i < 40; i++) await read(r.token, { ip: `2001:db8:1:2:${i.toString(16)}::1`, ua: `UA ${i}` });
    expect((await read(r.token, { ip: '2001:db8:1:2:ffff::9' })).status).toBe(429);
    expect((await read(r.token, { ip: '198.51.100.9' })).status).toBe(200);
    expect(ipNet('2001:0db8:0001:0002:abcd::1')).toBe('2001:db8:1:2::/64');
    expect(ipNet('2001:db8::1')).toBe('2001:db8:0:0::/64');
    expect(ipNet('203.0.113.7')).toBe('203.0.113.7');
  });
  it('a trip’s read touches only the share tables (its snapshot reads no record table)', async () => {
    const r = make();
    api(KEY_A, 'event', { id: 'n1', type: 'trip_note', data: { trip: 'nz', note: { flightRef: 'SECRET1' } } });
    const seen: string[] = [];
    const sql = db.sql, orig = sql.exec.bind(sql);
    sql.exec = ((q: string, ...b: never[]) => (seen.push(q), orig(q, ...b))) as Sql['exec'];
    try {
      const out = await read(r.token);
      expect(out.reply.ok).toBe(true);
      expect(JSON.stringify(out.reply)).not.toContain('SECRET1');
    } finally {
      sql.exec = orig;
    }
    expect(seen.length).toBeGreaterThan(0);
    expect(seen.filter((q) => /\b(events|metrics|uploads|ids)\b/.test(q))).toEqual([]);
  });
});

describe('the 03:00 sweep', () => {
  it('deletes the links ended over 90 days ago with their visits; live and recently ended ones stay', async () => {
    const live = make(), off = make(), expired = make(KEY_B, { days: 7 }), recent = make();
    await read(off.token);
    api(KEY_A, 'share_set', { id: off.id, off: true });
    now += 9 * DAY;
    api(KEY_A, 'share_set', { id: recent.id, off: true });
    now += 88 * DAY;
    expect(store.share.sweep()).toEqual({ n: 1 }); // the off one (97 days); the expired one ended 90 days ago today
    now += 1 * DAY + MIN;
    expect(store.share.sweep()).toEqual({ n: 1 });
    const ids = (api(KEY_A, 'share_list', { kind: 'trip', ref: 'nz' }).rows as ShareRow[]).map((x) => x.id).sort();
    expect(ids).toEqual([live.id, recent.id].sort());
    expect((db.db.prepare('SELECT count(*) AS n FROM share_visit').get() as { n: number }).n).toBe(0);
    expect(expired.id).toBeTruthy();
  });
});

describe('the Worker’s gate (shareRoute)', () => {
  const ORIGIN = 'https://island-fund.pages.dev';
  const req = (body: string, o: { origin?: string | null; method?: string; ua?: string } = {}) => new Request('https://relay/share', {
    method: o.method ?? 'POST',
    headers: { 'Content-Type': 'text/plain', ...(o.origin === null ? {} : { Origin: o.origin ?? ORIGIN }), 'User-Agent': o.ua ?? IPHONE, 'CF-Connecting-IP': '203.0.113.7' },
    ...((o.method ?? 'POST') === 'POST' ? { body } : {})
  });
  it('refuses junk with GONE and no request to the record; another origin or none 403', async () => {
    const reader = vi.fn(async () => ({ status: 200, reply: { ok: true, kind: 'trip', ref: 'nz', exp: 'x', data: {} } as const }));
    for (const body of ['', 'nope', '{}', '{"t":"short"}', `{"t":"${'a'.repeat(23)}"}`, `{"t":"${'a'.repeat(21)}="}`, JSON.stringify({ t: 'a'.repeat(22), pad: 'x'.repeat(300) })]) {
      const res = await shareRoute(req(body), ORIGIN, reader);
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual(GONE);
      expect(res.headers.get('Cache-Control')).toBe('no-store');
    }
    expect((await shareRoute(req('{}', { origin: 'https://evil.example' }), ORIGIN, reader)).status).toBe(403);
    expect((await shareRoute(req('{}', { origin: null }), ORIGIN, reader)).status).toBe(403);
    expect((await shareRoute(req('', { method: 'GET' }), ORIGIN, reader)).status).toBe(405);
    // a body with no Content-Length (a stream) is read no further than the cap
    const big = new ReadableStream({ start(c) { for (let i = 0; i < 100; i++) c.enqueue(new TextEncoder().encode('x'.repeat(1000))); c.close(); } });
    const chunked = new Request('https://relay/share', { method: 'POST', headers: { Origin: ORIGIN, 'Content-Type': 'text/plain' }, body: big, duplex: 'half' } as RequestInit);
    expect(await (await shareRoute(chunked, ORIGIN, reader)).json()).toEqual(GONE);
    expect(reader).not.toHaveBeenCalled();
  });
  it('hands a well-formed read on with the visitor’s IP, UA, country and self; CORS for our origin', async () => {
    const reader = vi.fn(async (_i: ShareReadIn) => ({ status: 200, reply: GONE }));
    const r = req(JSON.stringify({ t: 'a'.repeat(22), self: true }));
    Object.defineProperty(r, 'cf', { value: { country: 'NZ' } });
    const res = await shareRoute(r, ORIGIN, reader);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe(ORIGIN);
    expect(reader).toHaveBeenCalledWith({ t: 'a'.repeat(22), self: true, ip: '203.0.113.7', ua: IPHONE, cc: 'NZ' });
    const busy = await shareRoute(req(JSON.stringify({ t: 'a'.repeat(22) })), ORIGIN, async () => ({ status: 429, reply: { ok: false, error: 'busy' } }));
    expect(busy.status).toBe(429);
    const down = await shareRoute(req(JSON.stringify({ t: 'a'.repeat(22) })), ORIGIN, () => Promise.reject(new Error('x')));
    expect([down.status, await down.json()]).toEqual([503, { ok: false, error: 'busy' }]);
  });
});

describe('the backup', () => {
  it('the dump carries the links and their visits (not the day’s hashes, not the salt); a load into an empty record is them, idempotent', async () => {
    const a = make(KEY_A, { label: '両親へ' }), b = make(KEY_B, { ref: 'okinawa', days: 30 });
    await read(a.token);
    await read(a.token, { ip: '198.51.100.3', ua: MAC, cc: 'US' });
    api(KEY_B, 'share_set', { id: b.id, off: true });
    const dump = store.dump().rows;
    expect(dump.share).toHaveLength(2);
    expect(dump.share_visit).toHaveLength(2);
    const text = [...store.dumpText()].join('');
    expect(JSON.parse(text).rows.share).toEqual(dump.share);
    expect(text).not.toContain('share_seen');
    expect(text).not.toContain('share_salt');
    const db2 = memSql();
    const fresh = new StoreCore({ sql: db2.sql, tx: db2.tx, keys, now: () => now, notify: () => {} });
    expect(fresh.load({ rows: { share: dump.share } })).toMatchObject({ ok: true, share: 2 });
    expect(fresh.load({ rows: { share_visit: dump.share_visit } })).toMatchObject({ ok: true, share_visit: 2 });
    expect(fresh.load({ rows: { share: dump.share, share_visit: dump.share_visit } })).toMatchObject({ ok: true, share: 0, share_visit: 0, skipped: 0 });
    expect(fresh.dump().rows.share).toEqual(dump.share);
    expect(fresh.dump().rows.share_visit).toEqual(dump.share_visit);
    expect(fresh.counts()).toMatchObject({ share: 2, share_visit: 2 });
    // the restored link reads as it did (a restore to before a revocation would bring the link back: runbook §6)
    expect((await fresh.share.read({ t: a.token, self: false, ip: '1.1.1.1', ua: IPHONE, cc: 'JP' })).reply.ok).toBe(true);
    expect((await fresh.share.read({ t: b.token, self: false, ip: '1.1.1.1', ua: IPHONE, cc: 'JP' })).reply).toEqual(GONE);
  });
  it('a load skips a malformed link and a visit of a link it doesn’t have', () => {
    const r = store.load({ rows: { share: [['x'], ['0'.repeat(16), 'a'.repeat(22), 'trip', 'mars', '', 'A', '2026-11-20T03:00:00.000Z', '2026-11-27T03:00:00.000Z', null, 0, 0, null, null]], share_visit: [['1'.repeat(16), '2026-11-20T03:00:00.000Z', 'iphone', 'JP', 1]] } });
    expect(r).toMatchObject({ ok: true, share: 0, share_visit: 0, skipped: 3 });
  });
});

describe('the migration', () => {
  it('a record at the step before (with rows) gains the share tables, its rows untouched', () => {
    const m = memSql();
    // a record made by the relay before step 7: built, then the tables taken away and the mark set back
    const old = new StoreCore({ sql: m.sql, tx: m.tx, keys, now: () => now, notify: () => {} });
    old.handle({ key: KEY_A, action: 'event', id: 'e1', type: 'pref', data: { key: 'sound', value: true } }, 0);
    for (const t of ['share', 'share_visit', 'share_seen']) m.db.exec(`DROP TABLE ${t}`);
    m.db.exec(`UPDATE meta SET v = '${SCHEMA_V - 1}' WHERE k = 'schema_v'`);
    const events = (m.db.prepare('SELECT count(*) AS n FROM events').get() as { n: number }).n;
    const s = new StoreCore({ sql: m.sql, tx: m.tx, keys, now: () => now, notify: () => {} });
    expect(s.schemaV()).toBe(SCHEMA_V);
    expect(s.counts()).toMatchObject({ events, share: 0, share_visit: 0 });
    expect((s.handle({ key: KEY_B, action: 'share_make', kind: 'trip', ref: 'zao', days: 7 }, 0) as { ok: boolean }).ok).toBe(true);
  });
});
