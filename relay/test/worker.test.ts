// The Worker's router (src/index.ts `default`): which path reaches which object and what is refused before any, with
// the room, the record and the log as stubs that record their calls; and the cron's jobs.
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

import worker, { type Env } from '../src/index.ts';
import { TICKET_HEADER } from '../src/auth.ts';
import { resetLogRoute } from '../src/logRoute.ts';
import type { RelayEvent } from '../src/log.ts';
import type { ReqMeta } from '../src/reqMeta.ts';
import { LIVE_V, LIVE_VS } from '../../app/src/lib/contract/live-protocol.ts';
import { makeTicket, ROOM_PROTOCOL, TICKET_TTL_MS } from '../../app/src/lib/contract/ticket.ts';

const KEY_A = 'a1'.repeat(16);
const KEY_B = 'b2'.repeat(16);
const ALLOWED = 'https://huangwaylon.github.io';
const NOW = Date.parse('2026-11-02T03:00:00.000Z');
const WX = { hours: 48, age: 600_000 };

type Calls = { [k: string]: unknown[][] };
let calls: Calls;
const rec = (name: string, ...args: unknown[]) => (calls[name] ??= []).push(args);

/** The stubs' answers (a test changes one to throw). */
let room: Record<string, (...a: never[]) => unknown>;
let store: Record<string, (...a: never[]) => unknown>;
let log: Record<string, (...a: never[]) => unknown>;

const ns = (name: string, stub: () => object) => ({
  idFromName: (n: string) => (rec(`${name}.id`, n), n),
  get: () => stub()
});
const envOf = (extra: Partial<Env> = {}): Env => ({
  ROOM: ns('ROOM', () => room),
  STORE: ns('STORE', () => store),
  LOG: ns('LOG', () => log),
  ALLOWED_ORIGINS: ALLOWED,
  KEY_A,
  KEY_B,
  ...extra
}) as unknown as Env;

let promises: Promise<unknown>[];
const ctx = () => ({ waitUntil: (p: Promise<unknown>) => void promises.push(p), passThroughOnException() {} }) as unknown as ExecutionContext;
const settle = async () => {
  while (promises.length) await Promise.allSettled(promises.splice(0));
};
const call = (path: string, init: RequestInit = {}, env = envOf()) => worker.fetch(new Request(`https://relay.example${path}`, init) as never, env, ctx());
const added = () => (calls['LOG.add'] ?? []).flatMap((a) => a[0] as RelayEvent[]);

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(NOW);
  resetLogRoute();
  calls = {};
  promises = [];
  room = {
    wxHealth: () => (rec('ROOM.wxHealth'), Promise.resolve(WX)),
    notify: (n: never) => (rec('ROOM.notify', n), Promise.resolve(2)),
    weatherTick: (...a: never[]) => (rec('ROOM.weatherTick', ...a), Promise.resolve({ ok: true, fetched: true, heard: 0, health: WX })),
    fetch: (r: never) => (rec('ROOM.fetch', r), Promise.resolve(new Response('room')))
  };
  store = {
    apiMeta: (t: never) => {
      rec('STORE.apiMeta', t);
      const meta: ReqMeta = { action: 'whoami', st: 'ok', role: 'A', rid: 'r1', sid: 's1', inB: 10, outB: 20 };
      return Promise.resolve({ body: '{"ok":true,"me":"A"}', meta });
    },
    adminSigned: (...a: never[]) => (rec('STORE.adminSigned', ...a), Promise.resolve({ status: 200, body: '{"ok":true}' })),
    wetTick: () => (rec('STORE.wetTick'), Promise.resolve([])),
    placesTick: (full: never) => (rec('STORE.placesTick', full), Promise.resolve({ ok: true, full })),
    armCheck: () => (rec('STORE.armCheck'), Promise.resolve({ armed: false })),
    nightly: (late: never) => (rec('STORE.nightly', late), Promise.resolve({ ok: true, ran: [], failed: [], left: [] })),
    jobsTick: (o: never) => (rec('STORE.jobsTick', o), Promise.resolve()),
    placesStatus: () => Promise.resolve({ ok: true, syncedAt: NOW - 2 * 3_600_000 }),
    nightlyStatus: () => Promise.resolve({ nightlyH: 13.5, nightly: { ledgercheck: 13.5 } })
  };
  log = {
    add: (evs: never) => (rec('LOG.add', evs), Promise.resolve({ ok: true, kept: 1 })),
    ingest: (t: never) => (rec('LOG.ingest', t), Promise.resolve({ ok: true, kept: 1 })),
    stats: () => Promise.resolve({ ok: true }),
    spend: (...a: never[]) => (rec('LOG.spend', ...a), Promise.resolve(true))
  };
});
afterEach(() => {
  vi.useRealTimers();
});

describe('/health', () => {
  it('says ok, the protocol versions and the room’s weather', async () => {
    const res = await call('/health');
    expect(res.headers.get('Cache-Control')).toBe('no-store');
    expect(await res.json()).toEqual({ ok: true, v: LIVE_V, versions: LIVE_VS, sha: null, t: NOW, wx: WX, cronAt: null });
    expect(calls['ROOM.id']).toEqual([['island']]);
  });

  it('says the deployed commit (scripts/deploy.sh --var COMMIT)', async () => {
    expect(await (await call('/health', {}, envOf({ COMMIT: 'dce0fe35' }))).json()).toMatchObject({ ok: true, sha: 'dce0fe35' });
  });

  it('asks the room at most once a minute (an anonymous URL), and is still ok with wx null when the room fails', async () => {
    vi.setSystemTime(NOW + 3_600_000);
    await call('/health');
    room.wxHealth = () => Promise.reject(new Error('reset'));
    expect(await (await call('/health')).json()).toMatchObject({ ok: true, wx: WX });
    expect(calls['ROOM.id']).toHaveLength(1);
    vi.setSystemTime(NOW + 3_661_000);
    expect(await (await call('/health')).json()).toMatchObject({ ok: true, wx: null });
  });

  it('says the cron’s last weather tick (cronAt) apart from the weather', async () => {
    vi.setSystemTime(NOW + 7_200_000);
    room.wxHealth = () => Promise.resolve({ ...WX, cronAt: NOW });
    expect(await (await call('/health')).json()).toMatchObject({ wx: WX, cronAt: NOW });
  });
});

describe('/api', () => {
  const post = (body: string) => ({ method: 'POST', body, headers: { 'Content-Type': 'text/plain' } });

  it('reaches the record (apiMeta) and logs the request as a `req` event', async () => {
    const body = JSON.stringify({ key: KEY_A, action: 'whoami' });
    const res = await call('/api', post(body));
    expect([await res.json(), res.headers.get('X-Request-Id')]).toEqual([{ ok: true, me: 'A' }, 'r1']);
    expect(calls['STORE.apiMeta']).toEqual([[body]]);
    expect(calls['STORE.id']).toEqual([['record']]);
    await settle();
    expect(added()).toEqual([{ e: 'req', l: 1, role: 'A', rid: 'r1', sid: 's1', d: { action: 'whoami', st: 'ok', inB: 10, outB: 20, ms: 0 } }]);
  });

  it('sends the log nothing with LOG_OFF=1', async () => {
    await call('/api', post(JSON.stringify({ key: KEY_A, action: 'whoami' })), envOf({ LOG_OFF: '1' }));
    await settle();
    expect(calls['STORE.apiMeta']).toHaveLength(1);
    expect(calls['LOG.add']).toBeUndefined();
  });

  it('refuses a body without a known key before the record (a warning), and an error from the record is `unavailable`', async () => {
    expect(await (await call('/api', post(JSON.stringify({ key: 'c3'.repeat(16), action: 'snapshot' })))).json()).toEqual({ ok: false, error: 'unauthorized' });
    expect(calls['STORE.apiMeta']).toBeUndefined();
    store.apiMeta = () => Promise.reject(new Error('reset'));
    expect(await (await call('/api', post(JSON.stringify({ key: KEY_B, action: 'whoami' })))).json()).toEqual({ ok: false, error: 'unavailable' });
    await settle();
    expect(added().map((e) => [e.e, e.l, (e.d as { st: string }).st])).toEqual([['req', 2, 'unauthorized'], ['req', 3, 'unavailable']]);
  });
});

describe('the other routes', () => {
  it('/share: the visitor’s read reaches the record past the gate; junk never does', async () => {
    store.shareRead = (i: never) => (rec('STORE.shareRead', i), Promise.resolve({ status: 200, reply: { ok: true, kind: 'trip', ref: 'nz', exp: 'x', data: {} } }));
    const init = (body: string) => ({ method: 'POST', headers: { Origin: ALLOWED, 'User-Agent': 'UA', 'CF-Connecting-IP': '203.0.113.7' }, body });
    expect(await (await call('/share', init('{"t":"bad"}'))).json()).toEqual({ ok: false, error: 'gone', why: 'off' });
    expect(calls['STORE.shareRead']).toBeUndefined();
    const res = await call('/share', init(JSON.stringify({ t: 'a'.repeat(22) })));
    expect(((await res.json()) as { ok: boolean }).ok).toBe(true);
    expect(calls['STORE.shareRead']).toEqual([[{ t: 'a'.repeat(22), self: false, ip: '203.0.113.7', ua: 'UA', cc: '' }]]);
  });

  it('/admin refuses an unsigned request before the record', async () => {
    expect((await call('/admin', { method: 'POST', body: '{"op":"counts"}' })).status).toBe(401);
    expect(calls['STORE.adminSigned']).toBeUndefined();
  });

  it('/log hands a person’s batch to the log, acknowledges without keeping with LOG_OFF=1, refuses a stranger', async () => {
    const batch = JSON.stringify({ key: KEY_A, es: [] });
    expect(await (await call('/log', { method: 'POST', body: batch })).json()).toEqual({ ok: true, kept: 1 });
    expect(calls['LOG.ingest']).toEqual([[batch]]);
    expect(await (await call('/log', { method: 'POST', body: batch }, envOf({ LOG_OFF: '1' }))).json()).toEqual({ ok: true, off: true });
    expect(await (await call('/log', { method: 'POST', body: JSON.stringify({ key: 'nope', es: [] }) })).json()).toEqual({ ok: false, error: 'unauthorized' });
    expect(calls['LOG.ingest']).toHaveLength(1);
  });

  it('/stt is off without Workers AI or with STT_OFF=1, and spends from the log’s cap when on', async () => {
    const wav = new Uint8Array(64);
    wav.set(new TextEncoder().encode('RIFF'), 0);
    wav.set(new TextEncoder().encode('WAVE'), 8);
    const init = () => ({ method: 'POST', body: wav, headers: { Authorization: `Bearer ${KEY_A}` } });
    expect((await call('/stt', init())).status).toBe(503);
    const ai = { run: () => Promise.resolve({ text: ' hello ' }) };
    expect((await call('/stt', init(), envOf({ AI: ai, STT_OFF: '1' }))).status).toBe(503);
    const res = await call('/stt', init(), envOf({ AI: ai, STT_DAY_MAX: '5' }));
    expect([res.status, await res.json()]).toEqual([200, { ok: true, text: 'hello', aiMs: expect.any(Number) }]);
    expect(calls['LOG.spend']).toEqual([['stt:A', 5]]);
  });

  it('/grade is off with GRADE_OFF=1, and spends from the log’s cap (its own bucket) when on', async () => {
    const init = () => ({ method: 'POST', body: JSON.stringify({ s: 'I like apples.', t: 'apple', lv: 2 }), headers: { Authorization: `Bearer ${KEY_A}` } });
    const ai = { run: () => Promise.resolve({ response: { verdict: 'great', fixed: 'I like apples.', natural: '', also: 'I love apples.', tip: '', target_used: true } }) };
    expect((await call('/grade', init(), envOf({ AI: ai, GRADE_OFF: '1' }))).status).toBe(503);
    const res = await call('/grade', init(), envOf({ AI: ai, GRADE_DAY_MAX: '7' }));
    expect([res.status, await res.json()]).toEqual([200, { ok: true, verdict: 'great', fixed: 'I like apples.', natural: '', also: 'I love apples.', tip: '', used: true, src: 'ai', aiMs: expect.any(Number) }]);
    expect(calls['LOG.spend']).toEqual([['grade:A', 7]]);
  });

  it('/health/log adds the places’ age and the nightly jobs’ (nightlyH, each job’s hours)', async () => {
    const token = 't'.repeat(40);
    const res = await call('/health/log', { headers: { Authorization: `Bearer ${token}` } }, envOf({ HEALTH_TOKEN: token }));
    expect(await res.json()).toEqual({ ok: true, placesH: 2, nightlyH: 13.5, nightly: { ledgercheck: 13.5 } });
  });

  it('/health/log is 404 without HEALTH_TOKEN; an unknown path is 404', async () => {
    expect((await call('/health/log', { headers: { Authorization: `Bearer ${'t'.repeat(40)}` } })).status).toBe(404);
    expect((await call('/nope')).status).toBe(404);
  });
});

describe('/room', () => {
  const up = (headers: Record<string, string> = {}) => ({ headers: { Origin: ALLOWED, Upgrade: 'websocket', ...headers } });

  it('refuses another origin (403), a plain request (426) and a bad ticket (403) before the room', async () => {
    expect((await call('/room', up({ Origin: 'https://evil.example' }))).status).toBe(403);
    expect((await call('/room', { headers: { Origin: ALLOWED } })).status).toBe(426);
    const stale = await makeTicket(KEY_A, 'A', NOW - 1);
    expect((await call('/room', up({ 'Sec-WebSocket-Protocol': `${ROOM_PROTOCOL}, ${stale}` }))).status).toBe(403);
    expect(calls['ROOM.fetch']).toBeUndefined();
  });

  it('hands an admitted socket to the room, marked with whose ticket it came with', async () => {
    const t = await makeTicket(KEY_B, 'B', NOW + TICKET_TTL_MS);
    expect(await (await call('/room', up({ 'Sec-WebSocket-Protocol': `${ROOM_PROTOCOL}, ${t}` }))).text()).toBe('room');
    expect((calls['ROOM.fetch'][0][0] as Request).headers.get(TICKET_HEADER)).toBe('B');
  });
});

describe('the cron', () => {
  const TICK = Date.parse('2026-11-04T19:15:00.000Z'); // 04:15 Tokyo
  const run = (t: number, env = envOf()) => worker.scheduled({ scheduledTime: t, cron: '*/15 * * * *', noRetry() {} } as ScheduledController, env, ctx());

  it('ticks the weather every time, logging a failed fetch and the health once a Tokyo day as `cron.wx`', async () => {
    await run(TICK);
    await settle();
    // (the cron's: its heartbeat kept, `cronAt`)
    expect(calls['ROOM.weatherTick']).toEqual([[false, true]]);
    // the record's alarm checked, and from 04:15 Tokyo the nightly jobs' catch-up
    expect([calls['STORE.armCheck'], calls['STORE.nightly']]).toEqual([[[]], [[true]]]);
    // 行きたい場所: the categories only (no list fetch: places-pull.yml's)
    expect(calls['STORE.placesTick']).toHaveLength(1);
    // ボット → 定期処理: the tick's outcomes, once the weather and the places are done
    expect(calls['STORE.jobsTick']).toEqual([[expect.objectContaining({ t: TICK, wx: expect.objectContaining({ ok: true }), places: expect.objectContaining({ ok: true }) })]]);
    // an ok fetch: nothing (46 a day)
    expect(calls['LOG.add']).toBeUndefined();
    room.weatherTick = () => Promise.resolve({ ok: false, fetched: true, fail: 'timeout', heard: 0, health: { ...WX, fails: 2 } });
    await run(TICK);
    await settle();
    expect(added()).toEqual([{ e: 'cron.wx', l: 2, d: { ok: false, fetched: true, fail: 'timeout', hours: 48, age: 600_000, fails: 2, ms: 0 } }]);
  });

  it('says the weather\'s health at 00:15 Tokyo, fetched or not; an error for a tick that threw', async () => {
    room.weatherTick = () => Promise.resolve({ ok: true, fetched: false, heard: 0, health: { ...WX, fails: 0 } });
    await run(TICK - 900_000);
    await settle();
    expect(calls['LOG.add']).toBeUndefined();
    await run(Date.parse('2026-11-04T15:15:00.000Z'));
    await settle();
    expect(added()).toEqual([{ e: 'cron.wx', l: 1, d: { ok: true, fetched: false, fail: undefined, hours: 48, age: 600_000, fails: 0, ms: 0 } }]);
    calls['LOG.add'] = [];
    room.weatherTick = () => Promise.reject(new TypeError('net'));
    await run(TICK - 900_000);
    await settle();
    expect(added()).toEqual([{ e: 'cron.wx', l: 3, d: { ok: false, fetched: false, fail: 'TypeError', ms: 0 } }]);
  });

  it('hands each tick’s wet days to the record; a failure logged as `do.error` (the fields’ rain)', async () => {
    await run(TICK);
    await settle();
    expect(calls['STORE.wetTick']).toHaveLength(1);
    expect(calls['LOG.add']).toBeUndefined();
    store.wetTick = () => Promise.reject(new RangeError('cpu'));
    await run(TICK);
    await settle();
    expect(added()).toEqual([{ e: 'do.error', l: 3, d: { where: 'wet', name: 'RangeError' } }]);
  });

  it('at 03:00 Tokyo kicks the backup and runs the nightly jobs, nothing else; a failure logged as `do.error`', async () => {
    const daily = (env = envOf()) => worker.scheduled({ scheduledTime: TICK, cron: '0 18 * * *', noRetry() {} } as ScheduledController, env, ctx());
    Object.assign(store, { archiveKick: () => (rec('STORE.archiveKick'), Promise.resolve({ due: 'run' })) });
    await daily();
    await settle();
    expect([calls['STORE.archiveKick'], calls['STORE.nightly'], calls['STORE.armCheck'], calls['STORE.placesTick'], calls['ROOM.weatherTick']]).toEqual([[[]], [[false]], undefined, undefined, undefined]);
    Object.assign(store, { nightly: () => Promise.reject(new RangeError('cpu')) });
    await daily();
    await settle();
    expect(added().filter((e) => e.e === 'do.error')).toEqual([{ e: 'do.error', l: 3, d: { where: 'nightly', name: 'RangeError' } }]);
  });

  it('catches up the nightly jobs only from 04:15 Tokyo; checks the record’s alarm every tick', async () => {
    await run(TICK - 30 * 60_000); // 03:45
    await run(Date.parse('2026-11-04T15:15:00.000Z')); // 00:15
    await settle();
    expect([calls['STORE.armCheck']?.length, calls['STORE.nightly']]).toEqual([2, undefined]);
    await run(Date.parse('2026-11-04T14:45:00.000Z')); // 23:45
    await settle();
    expect(calls['STORE.nightly']).toEqual([[true]]);
  });
});
