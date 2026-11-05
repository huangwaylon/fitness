// The log (src/log.ts on node:sqlite, src/logRoute.ts, src/reqMeta.ts): a phone's batch is taken by the registry's
// rules (its key gives the role, never kept), once per batch id, within the day's caps; the relay's own events; the
// admin's query; retention; and no key, health value, food name, name or free text ever reaches a stored row.
import { beforeEach, describe, expect, it } from 'vitest';
import { LOG_CAPS, LOG_KEEP_DAYS, LogCore, type RelayEvent } from '../src/log.ts';
import { logHealthRoute, logRoute, relaySink, resetLogRoute, type LogRoom } from '../src/logRoute.ts';
import { apiWithMeta } from '../src/reqMeta.ts';
import { apiRoute, type StoreRoom } from '../src/storeRoute.ts';
import { StoreCore } from '../src/store.ts';
import { keyOwner } from '../src/auth.ts';
import { memSql } from './sqlite.ts';

const KEY_A = '3f9a'.repeat(16), KEY_B = 'b2'.repeat(32), KEY_C = 'c3'.repeat(32);
const keys = { KEY_A, KEY_B, KEY_C };
const T0 = Date.parse('2026-11-05T03:00:00.000Z');
const DAY = 86_400_000;

let now: number;
let db: ReturnType<typeof memSql>;
let log: LogCore;
const make = () => new LogCore({ sql: db.sql, tx: db.tx, keys, now: () => now });
beforeEach(() => {
  now = T0;
  db = memSql();
  log = make();
  resetLogRoute();
});

let bseq = 0;
const batch = (es: unknown[], o: Record<string, unknown> = {}) => JSON.stringify({ v: 1, key: KEY_A, b: `bt${(bseq++).toString(36).padStart(6, '0')}`, s: 'sess0001', build: '2026-11-05.abc1234', os: 'ios27.1', es, ...o });
const ev = (e: string, d: object = {}, l = 1, extra: object = {}) => ({ t: now, l, e, q: 1, d, ...extra });
const rows = () => log.query({ since: 0, limit: 1000 }).rows;

describe('a phone’s batch', () => {
  it('is kept by the registry: the role from the key, the session, build and os, each event cleaned', () => {
    const r = log.ingestText(batch([ev('api.fail', { action: 'events', err: 'busy', ms: 812.34, junk: 'x' }, 2, { r: 'rq12345678' }), ev('nope'), ev('req', { st: 'ok' }), ev('js.error', { msg: 'boom 68.4', kind: 'error' }, 3)]));
    expect(r).toEqual({ ok: true, kept: 2, dropped: 2 });
    const got = rows().map(({ id: _id, ts, ...x }) => ({ ...x, ts: ts - T0 }));
    expect(got).toEqual([
      { ct: T0, lvl: 2, ev: 'api.fail', src: 'c', role: 'A', sid: 'sess0001', rid: 'rq12345678', q: 1, build: '2026-11-05.abc1234', os: 'ios27.1', d: { action: 'events', err: 'busy', ms: 812.3 }, ts: 0 },
      { ct: T0, lvl: 3, ev: 'js.error', src: 'c', role: 'A', sid: 'sess0001', rid: null, q: 1, build: '2026-11-05.abc1234', os: 'ios27.1', d: { msg: 'boom #', kind: 'error' }, ts: 0 }
    ]);
  });

  it('refuses a bad key, a bad shape or version; a batch id is taken once', () => {
    const bad = [
      log.ingestText(batch([], { key: 'c'.repeat(64) })), log.ingestText(batch([], { key: undefined })), log.ingestText('{oops'),
      log.ingestText(batch([], { v: 2 })), log.ingestText(batch([], { b: 'x' })), log.ingestText(batch(Array(51).fill(ev('app.show'))))
    ];
    expect(bad.map((r) => r.error)).toEqual(['unauthorized', 'unauthorized', 'bad_request', 'bad_request', 'bad_request', 'bad_request']);
    const once = batch([ev('app.show', { awayS: 3 })]);
    expect([log.ingestText(once), log.ingestText(once)]).toEqual([{ ok: true, kept: 1, dropped: 0 }, { ok: true, dup: true, kept: 0, dropped: 0 }]);
    expect(rows().length).toBe(1);
  });

  it('a phone’s clock far off is not kept (the receipt time is); the guest is G', () => {
    log.ingestText(batch([{ ...ev('app.show'), t: now - 3 * DAY }], { key: KEY_C }));
    expect(rows().map((r) => [r.role, r.ct])).toEqual([['G', null]]);
  });

  it('caps a role’s day (errors apart), says when it opens, logs log.cap once; a restart remembers', () => {
    const fifty = (l: number) => Array.from({ length: 50 }, () => ev('app.show', {}, l));
    for (let i = 0; i < LOG_CAPS.client / 50; i++) log.ingestText(batch(fifty(1)));
    const over = log.ingestText(batch(fifty(1)));
    expect(over).toEqual({ ok: true, kept: 0, dropped: 50, closed: T0 - (T0 % DAY) + DAY });
    expect(log.ingestText(batch([ev('js.error', { msg: 'x' }, 3)]))).toMatchObject({ kept: 1 });
    expect(log.ingestText(batch(fifty(1), { key: KEY_B }))).toMatchObject({ kept: 50 });
    log = make(); // the object restarted: the caps are the table's
    expect(log.ingestText(batch(fifty(1)))).toMatchObject({ kept: 0 });
    expect(log.query({ since: 0, ev: 'log.cap' }).rows.map((r) => r.d)).toEqual([{ bucket: 'c:A:i' }]);
    now += DAY; // a new UTC day
    expect(log.ingestText(batch(fifty(1)))).toMatchObject({ kept: 50 });
  });
});

describe('the relay’s events, the query, retention', () => {
  it('relay events are kept by the same rules; a phone may not send them', () => {
    const r = log.add([{ e: 'req', l: 2, role: 'B', rid: 'rq12345678', sid: 'sess0001', d: { action: 'events', st: 'ok', rej: 1, why: 'buy.pocket_short', ms: 41 } }, { e: 'app.show' as never, l: 1 }]);
    expect(r).toEqual({ ok: true, kept: 1 });
    expect(rows().map((x) => [x.src, x.role, x.rid, x.d])).toEqual([['r', 'B', 'rq12345678', { action: 'events', st: 'ok', rej: 1, why: 'buy.pocket_short', ms: 41 }]]);
  });

  it('filters and pages (by time, level, name or prefix, role, session, request), newest first too', () => {
    log.ingestText(batch([ev('app.open'), ev('api.fail', { err: 'offline' }, 2, { r: 'rqaaaaaaaa' }), ev('js.error', {}, 3)]));
    now += 3_600_000;
    log.ingestText(batch([ev('api.ok', {}, 1, { r: 'rqbbbbbbbb' })], { key: KEY_B, s: 'sess0002' }));
    log.add([{ e: 'req', l: 1, rid: 'rqbbbbbbbb', role: 'B', d: { st: 'ok' } }]);
    const evs = (q: object) => log.query({ since: 0, ...q }).rows.map((r) => r.ev);
    expect(evs({ lvl: 2 })).toEqual(['api.fail', 'js.error']);
    expect(evs({ ev: 'api.' })).toEqual(['api.fail', 'api.ok']);
    expect(evs({ ev: 'js.*' })).toEqual(['js.error']);
    expect(evs({ role: 'B' })).toEqual(['api.ok', 'req']);
    expect(evs({ rid: 'rqbbbbbbbb' })).toEqual(['api.ok', 'req']);
    expect(evs({ sid: 'sess0002' })).toEqual(['api.ok']);
    expect(evs({ since: T0 + 1000 })).toEqual(['api.ok', 'req']);
    expect(evs({ desc: true, limit: 2 })).toEqual(['req', 'api.ok']);
    const p1 = log.query({ since: 0, limit: 2 });
    expect([p1.rows.length, evs({ after: p1.next! })]).toEqual([2, ['js.error', 'api.ok', 'req']]);
  });

  it('prunes past 30 days in chunks, and the batch ids past two; stats count the window', () => {
    log.ingestText(batch([ev('js.error', {}, 3), ev('app.show', {}, 2)]));
    now += (LOG_KEEP_DAYS + 1) * DAY;
    log.ingestText(batch([ev('js.error', { leaving: true }, 3)]));
    log.add([{ e: 'req', l: 3, d: { st: 'unavailable' } }]);
    expect(log.prune()).toEqual({ deleted: 2, more: false });
    expect(rows().map((r) => r.ev)).toEqual(['js.error', 'req']);
    expect(db.db.prepare('SELECT count(*) AS n FROM batches').get()).toEqual({ n: 1 });
    expect(log.stats()).toMatchObject({ e1h: 2, e6h: 1, w6h: 0, unavailable6h: 1, phones24h: 1, oldestDays: 0 });
  });

  it('purges by time and role', () => {
    log.ingestText(batch([ev('app.show')]));
    log.ingestText(batch([ev('app.show')], { key: KEY_B }));
    expect(log.purge({ role: 'A' })).toEqual({ ok: true, deleted: 1 });
    expect(rows().map((r) => r.role)).toEqual(['B']);
  });
});

describe('/log and /health/log (the Worker)', () => {
  const room = (): LogRoom & { calls: number } => {
    const r = { calls: 0, ingest: (t: string) => (r.calls++, log.ingestText(t)), add: (e: RelayEvent[]) => log.add(e), stats: () => log.stats() };
    return r;
  };
  const env = (o = {}) => ({ allowed: 'https://island-fund.pages.dev', off: false, roleOf: (k: unknown) => (typeof k === 'string' ? keyOwner(k, keys) : null), now: () => now, ...o });
  const post = (body: string, origin = 'https://island-fund.pages.dev') => new Request('https://r/log', { method: 'POST', body, headers: { Origin: origin, 'Content-Type': 'text/plain' } });

  it('checks the key before the object; capped days are answered here; the off switch keeps nothing', async () => {
    const r = room();
    const res = async (req: Request, e = env()) => (await logRoute(req, e, () => r)).json();
    expect(await res(post(batch([], { key: 'f'.repeat(64) })))).toEqual({ ok: false, error: 'unauthorized' });
    expect(await res(post('{x'))).toEqual({ ok: false, error: 'bad_request' });
    expect((await logRoute(post('{}', 'https://evil.example'), env(), () => r)).status).toBe(403);
    expect(r.calls).toBe(0);
    expect(await res(post(batch([ev('app.show')])))).toEqual({ ok: true, kept: 1, dropped: 0 });
    expect(await res(post(batch([ev('app.show')])), env({ off: true }))).toEqual({ ok: true, off: true });
    expect(r.calls).toBe(1);
    for (let i = 0; i < LOG_CAPS.client / 50; i++) await res(post(batch(Array.from({ length: 50 }, () => ev('app.show')))));
    const calls = r.calls;
    expect(await res(post(batch([ev('app.show')])))).toMatchObject({ kept: 0, closed: expect.any(Number) });
    expect(r.calls).toBe(calls); // answered by the Worker
    expect(await res(post(batch([ev('js.error', {}, 3)])))).toMatchObject({ kept: 1 }); // an error still goes on
  });

  it('/health/log only with the token', async () => {
    const token = 'k'.repeat(40);
    const get = (auth?: string) => logHealthRoute(new Request('https://r/health/log', { headers: auth ? { Authorization: auth } : {} }), token, () => room());
    expect([(await get()).status, (await get('Bearer nope')).status, (await logHealthRoute(new Request('https://r/health/log'), undefined, () => room())).status]).toEqual([404, 404, 404]);
    expect(await (await get(`Bearer ${token}`)).json()).toMatchObject({ ok: true, e1h: 0 });
  });

  it('the relay’s sink: in the background, only errors once its day is capped', async () => {
    const waits: Promise<unknown>[] = [];
    const sent: RelayEvent[][] = [];
    const sink = relaySink(() => ({ ingest: () => ({}), stats: () => ({}), add: (e) => (sent.push(e), { ok: true, kept: e.length, closed: now + 1000 }) }), (p) => waits.push(p), () => now);
    sink([{ e: 'req', l: 1 }]);
    await Promise.all(waits);
    sink([{ e: 'req', l: 1 }, { e: 'do.error', l: 3 }]);
    await Promise.all(waits);
    expect(sent.map((s) => s.map((e) => e.e))).toEqual([['req'], ['do.error']]);
  });
});

describe('/api’s req meta', () => {
  const store = () => new StoreCore({ sql: memSql().sql, tx: (fn) => fn(), keys, now: () => now, notify: () => {} });
  const roleOf = (k: unknown) => (typeof k === 'string' ? keyOwner(k, keys) : null);

  it('the action, role, status, ids; a batch’s refusals and its first rule; an ingest’s counts; the reply as handleText', () => {
    const s = store();
    const call = (o: object) => apiWithMeta(s, JSON.stringify(o), roleOf);
    const ok = call({ key: KEY_A, action: 'whoami', rid: 'rq12345678', sid: 'sess0001' });
    expect(ok.body).toBe(s.handleText(JSON.stringify({ key: KEY_A, action: 'whoami' })));
    expect(ok.meta).toMatchObject({ action: 'whoami', st: 'ok', role: 'A', rid: 'rq12345678', sid: 'sess0001' });
    const evs = call({ key: KEY_B, action: 'events', events: [{ id: 'e1', type: 'harvest', data: { week: '2026-10-26' } }, { id: 'e2', type: 'spend_void', data: { spendId: 'nope' } }] });
    expect(evs.meta).toMatchObject({ action: 'events', st: 'ok', role: 'B', n: 2, rej: 1, dup: 0, why: 'spend_void.no_such_spend' });
    const ing = call({ key: KEY_A, action: 'ingest', dates: 'Oct 1, 2026\nOct 2, 2026', steps: '4000\n99999999', weight: '68.4\n' });
    expect(ing.meta).toMatchObject({ action: 'ingest', st: 'ok', m: expect.any(Number) });
    expect(JSON.stringify(ing.meta)).not.toMatch(/68\.4|4000|99999999/);
    expect([call({ action: 'whoami', key: 'f'.repeat(64) }).meta.st, apiWithMeta(s, '{x', roleOf).meta.st, call({ key: KEY_C, action: 'ingest' }).meta]).toEqual(['unauthorized', 'bad_request', expect.objectContaining({ st: 'forbidden', role: 'G' })]);
  });

  it('the Worker times it, echoes the request id and hands the meta on', async () => {
    const s = store();
    const got: unknown[] = [];
    const room: StoreRoom = { api: (t) => s.handleText(t), apiMeta: (t) => apiWithMeta(s, t, roleOf), adminSigned: () => ({ status: 404, body: '' }) };
    const res = await apiRoute(new Request('https://r/api', { method: 'POST', body: JSON.stringify({ key: KEY_A, action: 'whoami', rid: 'rq12345678' }), headers: { Origin: 'https://island-fund.pages.dev' } }), 'https://island-fund.pages.dev', () => room, (m, ms) => got.push([m.action, m.st, m.rid, ms]));
    expect([res.headers.get('X-Request-Id'), res.headers.get('Access-Control-Expose-Headers'), ((await res.json()) as { me: string }).me]).toEqual(['rq12345678', 'X-Request-Id', 'A']);
    expect(got).toEqual([['whoami', 'ok', 'rq12345678', expect.any(Number)]]);
  });

  it('an object still on the old code (no apiMeta yet: the seconds after a deploy) is asked the plain way', async () => {
    const s = store();
    const room: StoreRoom = { api: (t) => s.handleText(t), apiMeta: () => { throw new TypeError('no such method'); }, adminSigned: () => ({ status: 404, body: '' }) };
    const res = await apiRoute(new Request('https://r/api', { method: 'POST', body: JSON.stringify({ key: KEY_A, action: 'whoami' }) }), '', () => room, () => {});
    expect(((await res.json()) as { me: string }).me).toBe('A');
  });
});

describe('privacy: nothing of theirs in a stored row', () => {
  it('canaries in every field of every event, and failing requests that carry them, leave no trace', () => {
    const canaries = [KEY_A, KEY_A.slice(0, 32), KEY_A.slice(0, 16), '68.4', '22.3', '8564', '鮭の塩焼き', 'Chicken salad', 'Umeko', '#key=', 'me@example.com'];
    const loud = `${KEY_A} 68.4 22.3% 8564 鮭の塩焼き "Chicken salad" 'Umeko' me@example.com /pair#key=${KEY_A}`;
    const s = new StoreCore({ sql: memSql().sql, tx: (fn) => fn(), keys, now: () => now, notify: () => {} });
    const roleOf = (k: unknown) => (typeof k === 'string' ? keyOwner(k, keys) : null);
    // every registry event, every field (and unknown ones) filled with them
    const all = ['app.open', 'app.ready', 'app.show', 'app.reload', 'perf.frames', 'js.error', 'api.fail', 'api.ok', 'auth.lost', 'sync.fail', 'queue.retry', 'queue.drop', 'ws.open', 'ws.close', 'ws.park', 'gl.lost', 'chunk.fail', 'storage.fail', 'use', 'log.drop'];
    const fill = (e: string) => ({ msg: loud, stack: `f@https://x/pair#key=${KEY_A}:1:2\n${loud}`, src: loud, kind: loud, route: `/pair#key=${KEY_A}`, err: loud, action: loud, type: loud, why: loud, name: 'Umeko', weight: 68.4, note: 'Chicken salad', [`sheet:${KEY_A}`]: 1, 'sheet:鮭の塩焼き': 1, [`ev:${e}`]: 1 });
    for (let i = 0; i < all.length; i += 10) log.ingestText(batch(all.slice(i, i + 10).map((e) => ({ ...ev(e, fill(e), 3), r: KEY_A })), { build: loud, os: loud, s: 'sess0001' }));
    // requests that fail with those in them: an ingest out of bounds (its warnings name values), broken JSON with the
    // key, a refused event; their req rows
    for (const text of [JSON.stringify({ key: KEY_A, action: 'ingest', dates: 'Oct 1, 2026', weight: '68.4', body_fat_percentage: '22.3', steps: '8564' }), `{"key":"${KEY_A}","action":"event",`, JSON.stringify({ key: KEY_A, action: 'event', id: 'e9', type: 'board', data: { t: 'Chicken salad 68.4 Umeko' } }), JSON.stringify({ key: KEY_A, action: 'events', events: [{ id: 'e8', type: 'food', data: { n: '鮭の塩焼き', k: 68.4 } }] })]) {
      const { meta } = apiWithMeta(s, text, roleOf);
      const { role, rid, sid, ...d } = meta;
      log.add([{ e: 'req', l: 2, role, rid, sid, d: { ...d, ms: 1 } }]);
    }
    log.add([{ e: 'do.error', l: 3, d: { where: loud, name: loud, msg: loud } }]);
    const stored = JSON.stringify(db.db.prepare('SELECT ev, role, sid, rid, build, os, d FROM log').all());
    expect(stored.length).toBeGreaterThan(1000);
    expect(canaries.filter((c) => stored.includes(c))).toEqual([]);
    expect(stored).not.toMatch(/[0-9a-f]{16,}/);
  });
});
