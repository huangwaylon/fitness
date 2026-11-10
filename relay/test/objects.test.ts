// The Durable Objects' shells (src/storeObject.ts IslandStore, src/logObject.ts IslandLog, src/index.ts IslandRoom)
// over a fake state: node:sqlite for their SQL (test/sqlite.ts), an in-memory key-value storage and alarm, `waitUntil`
// collecting its promises, the other objects as stubs. What each adds to its core: the RPC surface, the log events, the
// signed admin ops' dispatch, the alarms.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('cloudflare:workers', () => ({
  DurableObject: class {
    ctx: unknown;
    env: unknown;
    constructor(ctx: unknown, env: unknown) {
      this.ctx = ctx;
      this.env = env;
    }
  }
}));

import { IslandRoom, type Env } from '../src/index.ts';
import { SILENT_MS } from '../src/room.ts';
import { LIVE_V } from '../../app/src/lib/contract/live-protocol.ts';
import { IslandStore } from '../src/storeObject.ts';
import { IslandLog } from '../src/logObject.ts';
import { CAPS_SAVE_MS, LogCore, type RelayEvent } from '../src/log.ts';
import { notifySecret, notifySig } from '../src/notify.ts';
import { resetLogRoute } from '../src/logRoute.ts';
import { memSql } from './sqlite.ts';

const KEY_A = 'a1'.repeat(16);
const KEY_B = 'b2'.repeat(16);
const NOW = Date.parse('2026-11-02T03:00:00.000Z');
const DAY = 86_400_000;

type Calls = { [k: string]: unknown[][] };
let calls: Calls;
const rec = (name: string, ...args: unknown[]) => (calls[name] ??= []).push(args);
let room: Record<string, (...a: never[]) => unknown>;
let store: Record<string, (...a: never[]) => unknown>;
let log: Record<string, (...a: never[]) => unknown>;
let promises: Promise<unknown>[];
const settle = async () => {
  while (promises.length) await Promise.allSettled(promises.splice(0));
};
const added = () => (calls['LOG.add'] ?? []).flatMap((a) => a[0] as RelayEvent[]);

const ns = (stub: () => object) => ({ idFromName: (n: string) => n, get: () => stub() });
const envOf = (extra: Partial<Env> = {}): Env => ({
  ROOM: ns(() => room),
  STORE: ns(() => store),
  LOG: ns(() => log),
  ALLOWED_ORIGINS: '',
  KEY_A,
  KEY_B,
  ...extra
}) as unknown as Env;

/** A Durable Object's state: SQLite, a key-value map, one alarm. */
function fakeState(o: { sockets?: () => unknown[] } = {}) {
  const db = memSql();
  const kv = new Map<string, unknown>();
  let alarm: number | null = null;
  const storage = {
    sql: db.sql,
    transactionSync: db.tx,
    get: (k: string) => Promise.resolve(kv.get(k)),
    put: (k: string, v: unknown) => (kv.set(k, structuredClone(v)), Promise.resolve()),
    delete: (k: string) => Promise.resolve(kv.delete(k)),
    getAlarm: () => Promise.resolve(alarm),
    setAlarm: (t: number) => ((alarm = t), Promise.resolve()),
    getCurrentBookmark: () => Promise.resolve('bm-now'),
    getBookmarkForTime: (t: number) => Promise.resolve(`bm-${t}`),
    onNextSessionRestoreBookmark: (b: string) => (rec('restoreBookmark', b), Promise.resolve())
  };
  const ctx = {
    storage,
    waitUntil: (p: Promise<unknown>) => void promises.push(p),
    blockConcurrencyWhile: <T>(fn: () => Promise<T>) => {
      const p = fn();
      promises.push(p);
      return p;
    },
    abort: (why: string) => rec('abort', why),
    setWebSocketAutoResponse: (pair: unknown) => rec('autoResponse', pair),
    getWebSockets: o.sockets ?? (() => []),
    getWebSocketAutoResponseTimestamp: () => null,
    acceptWebSocket: () => {}
  };
  return { ctx, kv, storage, alarm: () => alarm, state: ctx as unknown as DurableObjectState };
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(NOW);
  resetLogRoute();
  calls = {};
  promises = [];
  room = {
    notify: (...a: never[]) => (rec('ROOM.notify', ...a), Promise.resolve(1)),
    wxAdmin: (o: never) => (rec('ROOM.wxAdmin', o), Promise.resolve({ ok: true, wx: null })),
    restoring: () => (rec('ROOM.restoring'), Promise.resolve())
  };
  store = { restored: () => (rec('STORE.restored'), Promise.resolve({ ok: true, rev: 'e2' })) };
  log = {
    add: (evs: never) => (rec('LOG.add', evs), Promise.resolve({ ok: true, kept: 1 })),
    query: (q: never) => (rec('LOG.query', q), Promise.resolve({ rows: [] })),
    stats: () => Promise.resolve({ ok: true, n: 0 }),
    purge: (o: never) => (rec('LOG.purge', o), Promise.resolve({ ok: true, deleted: 0 }))
  };
});
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('IslandStore', () => {
  const make = (extra: Partial<Env> = {}) => new IslandStore(fakeState().state, envOf(extra));
  const sign = async (o: unknown, t = String(NOW)) => {
    const body = JSON.stringify(o);
    return [body, t, await notifySig((await notifySecret({ KEY_A, KEY_B }))!, t, body)] as const;
  };
  const admin = async (s: IslandStore, o: unknown) => {
    const r = await s.adminSigned(...(await sign(o)));
    return { status: r.status, body: r.status === 200 ? (JSON.parse(r.body) as Record<string, unknown>) : r.body };
  };

  it('answers /api as its core does, with the meta for the log, and tells the room of a write', async () => {
    const s = make();
    expect(JSON.parse(s.api(JSON.stringify({ key: KEY_A, action: 'whoami' })))).toEqual({ ok: true, me: 'A', build: expect.any(String) });
    const { body, meta } = s.apiMeta(JSON.stringify({ key: KEY_B, action: 'ingest', dates: 'Oct 1, 2026', steps: '4000' }));
    expect(JSON.parse(body)).toEqual({ ok: true, metrics: 1 });
    expect(meta).toMatchObject({ action: 'ingest', st: 'ok', role: 'B' });
    await settle();
    expect(calls['ROOM.notify']).toEqual([[expect.objectContaining({ what: 'ingest', who: 'B' }), true]]);
  });

  it('a room that fails twice is only a warning', async () => {
    room.notify = () => Promise.reject(new Error('reset'));
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    make().api(JSON.stringify({ key: KEY_B, action: 'ingest', dates: 'Oct 1, 2026', steps: '4000' }));
    await settle();
    expect(warn).toHaveBeenCalledWith('notify the room', 'Error');
  });

  it('restored() starts a new epoch', async () => {
    const s = make();
    const a = s.restored(), b = s.restored();
    expect(a).toEqual({ ok: true, rev: expect.stringMatching(/^e\d+$/) });
    expect(b.rev).not.toBe(a.rev);
    expect((await admin(s, { op: 'counts' })).body).toMatchObject({ ok: true, rev: b.rev });
  });

  it('compactTick() compacts and logs `cron.compact`; nothing to the log with LOG_OFF=1', async () => {
    expect(make().compactTick()).toEqual({ ok: true, dates: 0, deleted: 0, more: false, metrics: 0 });
    await settle();
    expect(added()).toEqual([{ e: 'cron.compact', l: 1, d: { dates: 0, deleted: 0, more: false, metrics: 0, ms: 0 } }]);
    calls = {};
    make({ LOG_OFF: '1' }).compactTick();
    await settle();
    expect(calls['LOG.add']).toBeUndefined();
  });

  it('refuses an unsigned or badly signed admin body with its status', async () => {
    const s = make();
    expect(await s.adminSigned('{"op":"counts"}', null, null)).toEqual({ status: 401, body: 'unauthorized' });
    const [body, t, sig] = await sign({ op: 'counts' });
    expect(await s.adminSigned(body, t, sig.replace(/^./, (c) => (c === '0' ? '1' : '0')))).toEqual({ status: 401, body: 'unauthorized' });
    expect(await s.adminSigned(body, String(NOW - 600_000), sig)).toEqual({ status: 401, body: 'unauthorized' });
    expect(await admin(s, [1])).toEqual({ status: 400, body: 'bad request' });
    expect(await s.adminSigned(...(await sign({ op: 'rev' })))).toMatchObject({ status: 200 });
    const again = await sign({ op: 'rev' });
    expect(await s.adminSigned(...again)).toEqual({ status: 409, body: 'replayed' });
  });

  it('runs a signed op and audits it: counts, rev, an unknown op refused', async () => {
    const s = make();
    expect(await admin(s, { op: 'counts' })).toEqual({ status: 200, body: { ok: true, counts: expect.any(Object), rev: expect.any(String), newest: null, schema_v: expect.any(Number) } });
    expect((await admin(s, { op: 'rev' })).body).toEqual({ ok: true, rev: expect.stringMatching(/^e\d+$/) });
    expect((await admin(s, { op: 'nope' })).body).toEqual({ ok: false, error: 'bad_request' });
    await settle();
    expect(added().map((e) => [e.e, e.l, (e.d as { op: string; st: string }).op, (e.d as { st: string }).st])).toEqual([
      ['admin', 1, 'counts', 'ok'], ['admin', 1, 'rev', 'ok'], ['admin', 2, 'nope', 'bad_request']
    ]);
  });

  it('dispatches the other ops to the core, the log and the room', async () => {
    const s = make();
    expect((await admin(s, { op: 'bookmark', ms: 60_000 })).body).toEqual({ ok: true, now: 'bm-now', ago: `bm-${NOW - 60_000}` });
    expect((await admin(s, { op: 'bookmark' })).body).toMatchObject({ ago: `bm-${NOW - 3_600_000}` });
    expect((await admin(s, { op: 'held' })).body).toEqual({ ok: true, rows: [] });
    expect((await admin(s, { op: 'held', person: 'A' })).body).toEqual({ ok: true, rows: [] });
    expect((await admin(s, { op: 'dump' })).body).toMatchObject({ rev: expect.any(String) });
    for (const op of ['promote', 'shopcheck', 'decorcheck', 'load', 'compact']) {
      const r = await admin(s, { op });
      expect([r.status, typeof r.body], op).toEqual([200, 'object']);
    }
    expect((await admin(s, { op: 'logs', lvl: 3 })).body).toEqual({ ok: true, rows: [] });
    expect(calls['LOG.query']).toEqual([[{ op: 'logs', lvl: 3 }]]);
    expect((await admin(s, { op: 'logstats' })).body).toEqual({ ok: true, n: 0 });
    expect((await admin(s, { op: 'logpurge', role: 'A' })).body).toEqual({ ok: true, deleted: 0 });
    expect((await admin(s, { op: 'wx', refresh: true })).body).toEqual({ ok: true, wx: null });
    expect(calls['ROOM.wxAdmin']).toEqual([[{ op: 'wx', refresh: true }]]);
  });

  it('restore: needs a bookmark, freezes the record, tells the room, and restarts after its reply', async () => {
    vi.useFakeTimers({ toFake: ['Date', 'setTimeout'] });
    vi.setSystemTime(NOW);
    const s = make();
    expect((await admin(s, { op: 'restore' })).body).toEqual({ ok: false, error: 'bad_request' });
    expect((await admin(s, { op: 'restore', bookmark: 'bm-1' })).body).toMatchObject({ ok: true, restoring: 'bm-1', note: expect.stringContaining('by itself') });
    expect([calls.restoreBookmark, calls['ROOM.restoring']]).toEqual([[['bm-1']], [[]]]);
    expect(JSON.parse(s.api(JSON.stringify({ key: KEY_A, action: 'whoami' })))).toMatchObject({ ok: false, error: 'unavailable' });
    expect(calls.abort).toBeUndefined();
    vi.advanceTimersByTime(200);
    expect(calls.abort).toEqual([['restoring a bookmark']]);
    // a room that wasn't told: the note says to start the epoch by hand
    room.restoring = () => Promise.reject(new Error('reset'));
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect((await admin(make(), { op: 'restore', bookmark: 'bm-2' })).body).toMatchObject({ ok: true, note: expect.stringContaining('op:"rev"') });
  });

  it('an op that throws is `unavailable` (a restore that failed thaws the record)', async () => {
    const st = fakeState();
    st.storage.onNextSessionRestoreBookmark = () => Promise.reject(new Error('no such bookmark'));
    const s = new IslandStore(st.state, envOf());
    expect((await admin(s, { op: 'restore', bookmark: 'bm-1' })).body).toEqual({ ok: false, error: 'unavailable', detail: 'Error: no such bookmark' });
    expect(JSON.parse(s.api(JSON.stringify({ key: KEY_A, action: 'whoami' })))).toMatchObject({ ok: true, me: 'A' });
    log.stats = () => Promise.reject(new TypeError('reset'));
    expect((await admin(s, { op: 'logstats' })).body).toMatchObject({ ok: false, error: 'unavailable' });
    await settle();
    expect(added().map((e) => (e.d as { st: string }).st)).toEqual(['unavailable', 'unavailable']);
  });
});

describe('IslandLog', () => {
  it('arms the daily prune when no alarm is set, and leaves one that is', async () => {
    const st = fakeState();
    new IslandLog(st.state, envOf());
    await settle();
    expect(st.alarm()).toBe(NOW + 60_000);
    await st.storage.setAlarm(NOW + 5 * DAY);
    new IslandLog(st.state, envOf());
    await settle();
    expect(st.alarm()).toBe(NOW + 5 * DAY);
  });

  it('passes its RPCs through to the log’s core', async () => {
    const l = new IslandLog(fakeState().state, envOf());
    await settle();
    expect(l.add([{ e: 'cron.wx', l: 1, d: { ok: true } }])).toMatchObject({ ok: true, kept: 1 });
    expect(l.query({}).rows).toHaveLength(1);
    expect(l.ingest(JSON.stringify({ v: 1, key: KEY_A, b: 'bt000001', s: 'sess0001', build: '2026-11-05.abc1234', os: 'ios27.1', es: [] }))).toMatchObject({ ok: true });
    expect([l.spend('stt:A', 1), l.spend('stt:A', 1)]).toEqual([true, false]);
    expect(l.stats()).toMatchObject({ ok: true });
    expect(l.purge({})).toMatchObject({ ok: true });
  });

  it('its alarm prunes and comes back a day later, or in an hour while there is more', async () => {
    const st = fakeState();
    const l = new IslandLog(st.state, envOf());
    await settle();
    await l.alarm();
    expect(st.alarm()).toBe(NOW + DAY);
    vi.spyOn(LogCore.prototype, 'prune').mockReturnValue({ deleted: 500, more: true });
    await l.alarm();
    expect(st.alarm()).toBe(NOW + 3_600_000);
  });

  it('a write has the caps\' counts written by a timer in the instance within CAPS_SAVE_MS, one write for a burst', async () => {
    vi.useFakeTimers({ toFake: ['Date', 'setTimeout', 'clearTimeout'] });
    vi.setSystemTime(NOW);
    const st = fakeState();
    const l = new IslandLog(st.state, envOf());
    await settle();
    l.stats(); // (the day read)
    const saves = vi.spyOn(LogCore.prototype, 'saveCaps');
    for (let i = 0; i < 5; i++) l.add([{ e: 'cron.wx', l: 1, d: { ok: true } }]);
    expect(saves).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(CAPS_SAVE_MS);
    expect(saves).toHaveBeenCalledTimes(1);
    // written: a new object (after an eviction) reads them back
    expect(new IslandLog(st.state, envOf()).stats().today).toBe(5);
  });
});

describe('IslandRoom', () => {
  beforeEach(() => {
    vi.stubGlobal('WebSocketRequestResponsePair', class {
      constructor(readonly request: string, readonly response: string) {}
    });
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });
  const make = async (o: Parameters<typeof fakeState>[0] = {}, extra: Partial<Env> = {}) => {
    const st = fakeState(o);
    const r = new IslandRoom(st.state, envOf(extra));
    await settle();
    return { r, st };
  };

  it('answers the heartbeat by the runtime, refuses a request that isn’t a WebSocket, and notifies nobody when empty', async () => {
    const { r } = await make();
    expect(calls.autoResponse).toHaveLength(1);
    expect((await r.fetch(new Request('https://relay.example/room'))).status).toBe(426);
    expect(r.notify({ what: 'ingest', who: 'A', at: '2026-11-01T01:02:03.456Z', rev: 'mhf0a1b2c3' })).toBe(0);
  });

  it('catches a socket message whose handling throws, and logs `do.error` (its class only)', async () => {
    const ws = { deserializeAttachment: () => { throw new RangeError('bad attachment'); }, serializeAttachment() {}, send() {}, close() {} };
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { r } = await make({ sockets: () => [ws] });
    expect(() => r.webSocketMessage(ws as unknown as WebSocket, '{"kind":"hello"}')).not.toThrow();
    await settle();
    expect(err).toHaveBeenCalledWith('ws.message', 'RangeError');
    expect(added()).toEqual([{ e: 'do.error', l: 3, d: { where: 'ws.message', name: 'RangeError' } }]);
  });

  it('a hello: logged as `ws.hello`, the ghosts\' watch armed, the weather fetched (here failing) and the presence kept', async () => {
    let meta: unknown = { who: null, opened: NOW };
    const sent: string[] = [];
    const ws = { deserializeAttachment: () => meta, serializeAttachment: (m: unknown) => void (meta = m), send: (d: string) => void sent.push(d), close() {} };
    const { r, st } = await make({ sockets: () => [ws] });
    const fetched: string[] = [];
    vi.stubGlobal('fetch', (u: string) => (fetched.push(u), Promise.reject(new Error('offline'))));
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    r.webSocketMessage(ws as unknown as WebSocket, JSON.stringify({ v: LIVE_V, kind: 'hello', key: KEY_A }));
    await settle();
    expect(meta).toMatchObject({ who: 'A' });
    expect(JSON.parse(sent[0])).toMatchObject({ kind: 'welcome' });
    expect(added()).toEqual([{ e: 'ws.hello', l: 1, role: 'A', d: { v: LIVE_V } }]);
    expect(st.alarm()).toBe(NOW + SILENT_MS);
    expect(fetched).toHaveLength(1);
    expect(st.kv.get('wx')).toMatchObject({ fails: 1 });
    r.webSocketClose(ws as unknown as WebSocket, 1000);
    expect(st.kv.get('gone')).toEqual({ A: NOW });
  });

  it('its rows written: kept with the record\'s marks (one row a notify), said on the next hello or close, kept across a restart', async () => {
    let meta: unknown = { who: null, opened: NOW };
    const ws = { deserializeAttachment: () => meta, serializeAttachment: (m: unknown) => void (meta = m), send() {}, close() {} };
    const { r, st } = await make({ sockets: () => [ws] });
    vi.stubGlobal('fetch', () => Promise.reject(new Error('offline')));
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    r.notify({ what: 'event', who: 'B', at: '2026-11-02T02:59:00.000Z', rev: 'e1' });
    r.notify({ what: 'event', who: 'B', at: '2026-11-02T02:59:01.000Z', rev: 'e1' });
    // one key for both marks (was two rows a notify)
    expect([st.kv.has('rec'), st.kv.has('rec-g'), st.kv.get('marks')]).toEqual([false, false, { rec: { at: '2026-11-02T02:59:01.000Z', rev: 'e1' }, recG: { at: '2026-11-02T02:59:01.000Z', rev: 'e1' }, rw: 2, sent: 0 }]);
    // a restart (a hibernation) keeps the count; the hello says it (and the weather's failure, a row)
    const again = new IslandRoom(st.state, envOf());
    await settle();
    again.webSocketMessage(ws as unknown as WebSocket, JSON.stringify({ v: LIVE_V, kind: 'hello', key: KEY_A }));
    await settle();
    expect(added().find((e) => e.e === 'ws.hello')).toMatchObject({ d: { rw: 2 } });
    again.webSocketClose(ws as unknown as WebSocket, 1000);
    await settle();
    // since the hello: the weather's failure and the close's `gone`
    expect(added().find((e) => e.e === 'room.close')).toMatchObject({ d: { rw: 2 } });
    // a room from before the marks: its two keys read (the welcome's `rec`)
    let m2: unknown = { who: null, opened: NOW };
    const sent: string[] = [];
    const ws2 = { deserializeAttachment: () => m2, serializeAttachment: (m: unknown) => void (m2 = m), send: (d: string) => void sent.push(d), close() {} };
    const old = fakeState({ sockets: () => [ws2] });
    await old.storage.put('rec', { at: '2026-11-01T00:00:00.000Z', rev: 'e1' });
    const was = new IslandRoom(old.state, envOf());
    await settle();
    was.webSocketMessage(ws2 as unknown as WebSocket, JSON.stringify({ v: LIVE_V, kind: 'hello', key: KEY_A }));
    expect(JSON.parse(sent[0])).toMatchObject({ kind: 'welcome', rec: { at: '2026-11-01T00:00:00.000Z', rev: 'e1' } });
  });

  it('a closing socket is logged as `room.close` and closed with a clean code', async () => {
    const closed: unknown[][] = [];
    const ws = { deserializeAttachment: () => ({ who: 'A', opened: NOW - 30_000 }), serializeAttachment() {}, send() {}, close: (...a: unknown[]) => closed.push(a) };
    const { r } = await make({ sockets: () => [ws] });
    r.webSocketClose(ws as unknown as WebSocket, 1006);
    r.webSocketError(ws as unknown as WebSocket);
    await settle();
    expect(closed).toEqual([[1000, 'bye']]);
    expect(added()).toEqual([{ e: 'room.close', l: 1, role: 'A', d: { code: 1006, secs: 30, socks: 0 } }]);
  });

  it('the weather: how it is, a fixture timeline, a refused one, and a fetch that failed', async () => {
    const { r, st } = await make();
    expect(await r.wxAdmin({})).toMatchObject({ ok: true, wx: null });
    expect(await r.wxAdmin({ s: 'x!' })).toEqual({ ok: false, error: 'bad_request' });
    expect(await r.wxAdmin({ s: 'rrhh', fx: [1] })).toMatchObject({ ok: true, wx: { s: 'rrhh', fx: [1], src: 'fx' }, heard: 0 });
    expect(st.kv.get('wx')).toMatchObject({ wx: { s: 'rrhh' } });
    expect(r.wxHealth()).toMatchObject({ src: 'fx' });
    vi.stubGlobal('fetch', () => Promise.reject(new Error('offline')));
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(await r.wxAdmin({ refresh: true })).toMatchObject({ ok: false, fetched: true, fail: 'fetch offline', heard: 0 });
  });

  it('a restore due: the alarm tells the record (restored) and lets the entry go', async () => {
    const { r, st } = await make();
    await r.restoring();
    expect(st.kv.get('restore')).toEqual({ due: NOW + 5_000, tries: 0 });
    expect(st.alarm()).toBe(NOW + 5_000);
    await r.alarm(); // not due yet: kept, the alarm on it
    expect([calls['STORE.restored'], st.kv.has('restore'), st.alarm()]).toEqual([undefined, true, NOW + 5_000]);
    vi.setSystemTime(NOW + 5_000);
    vi.spyOn(console, 'log').mockImplementation(() => {});
    await r.alarm();
    expect([calls['STORE.restored'], st.kv.has('restore')]).toEqual([[[]], false]);
  });

  it('a restore that fails is retried 30 s on, up to its tenth try', async () => {
    const { r, st } = await make();
    store.restored = () => Promise.reject(new Error('reset'));
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    await st.storage.put('restore', { due: NOW, tries: 0 });
    await r.alarm();
    expect(st.kv.get('restore')).toEqual({ due: NOW + 30_000, tries: 1 });
    expect(st.alarm()).toBe(NOW + 30_000);
    await st.storage.put('restore', { due: NOW, tries: 9 });
    await r.alarm();
    expect(st.kv.has('restore')).toBe(false);
  });
});
