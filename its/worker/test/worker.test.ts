// The Worker (src/index.ts) over a real ItsBot on a fake storage: the routes, who may call them (a member's key, the
// runner's token; the guest's and none refused), CORS and preflight, the body checks, 409 on a stale edit, 開始 / 停止
// with GitHub's dispatch (fetch stubbed), and that nothing refused reaches the record.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import example from '../../contract-example.json';
import type { ClaimReply, ItsStatus, RunnerConfig } from '../../../app/src/lib/its/contract.ts';
import { DISPATCH_URL } from '../src/dispatch.ts';
import type { Env } from '../src/env.ts';
import { GUEST, KEY_A, KEY_B, MIN, NOW, ORIGIN, RUNNER, asRunner, call, envOf, fakeState, page, quiet, report, start, type State } from './fakeBot.ts';

let state: State;
let env: Env;
let logs: ReturnType<typeof quiet>;
let fetchMock: ReturnType<typeof vi.fn>;

async function fresh(extra: Partial<Env> = {}) {
  state = fakeState();
  const bot = await start(state, { GH_DISPATCH_TOKEN: 'gh-token', ...extra });
  env = envOf(bot, extra);
}

const put = (body: unknown, key?: string) => page(env, '/its/settings', { method: 'PUT', body: JSON.stringify(body), key });
const runAction = (action: string, key?: string) => page(env, '/its/run', { method: 'POST', body: JSON.stringify({ action }), key });
const status = async (): Promise<ItsStatus> => (await page(env, '/its/status')).json();
const input = (x: object = {}) => ({ ...example.settingsInput, baseUpdatedAt: null, ...x });

beforeEach(async () => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(NOW);
  logs = quiet();
  fetchMock = vi.fn(async () => new Response(null, { status: 204 }));
  vi.stubGlobal('fetch', fetchMock);
  await fresh();
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

/** Every warning line logged, joined (to check a refusal's reason, and that no secret is ever in one). */
const warned = () => logs.warn.mock.calls.map((c) => c.join(' ')).join('\n');
const allLogs = () => [logs.log, logs.warn, logs.error].flatMap((m) => m.mock.calls.map((c) => c.map(String).join(' '))).join('\n');

describe('routing', () => {
  it('/health says ok, the mode and the deployed commit, to anyone', async () => {
    expect(await (await call(env, '/health')).json()).toEqual({ ok: true, mode: 'on', sha: null });
    await fresh({ MODE: 'off', COMMIT: 'abc1234' });
    expect(await (await call(env, '/health')).json()).toEqual({ ok: true, mode: 'off', sha: 'abc1234' });
  });

  it('answers 404 elsewhere and 405 to the wrong method', async () => {
    expect((await call(env, '/')).status).toBe(404);
    expect((await page(env, '/its/nope')).status).toBe(404);
    const r = await page(env, '/its/status', { method: 'POST', body: '{}' });
    expect([r.status, r.headers.get('Allow')]).toEqual([405, 'GET']);
    expect((await asRunner(env, '/runner/report')).status).toBe(405);   // a GET
    expect(warned()).toContain('its refused 405 method POST /its/status');
  });
});

describe('the page’s auth and CORS', () => {
  it('refuses no key, a wrong one and the guest’s (401), reaching no storage', async () => {
    const before = { ...state.count };
    for (const key of ['', 'nope', GUEST, RUNNER]) expect((await page(env, '/its/status', { key })).status).toBe(401);
    expect((await call(env, '/its/status')).status).toBe(401);
    expect((await put(input(), GUEST)).status).toBe(401);
    expect((await runAction('start', GUEST)).status).toBe(401);
    expect(state.count).toEqual(before);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(warned()).toContain('its refused 401 unauthorized GET /its/status');
  });

  it('refuses unset member keys: nobody gets in', async () => {
    await fresh({ KEY_A: '', KEY_B: undefined });
    expect((await page(env, '/its/status', { key: '' })).status).toBe(401);
  });

  it('accepts either member key, in either case', async () => {
    expect((await page(env, '/its/status')).status).toBe(200);
    expect((await page(env, '/its/status', { key: KEY_B.toUpperCase() })).status).toBe(200);
  });

  it('answers the app’s origin and localhost with CORS, never caching; refuses other origins (403)', async () => {
    const r = await page(env, '/its/status');
    expect(r.headers.get('Access-Control-Allow-Origin')).toBe(ORIGIN);
    expect(r.headers.get('Vary')).toBe('Origin');
    expect(r.headers.get('Cache-Control')).toBe('private, no-store');
    const local = await page(env, '/its/status', { headers: { Origin: 'http://localhost:5173' } });
    expect(local.headers.get('Access-Control-Allow-Origin')).toBe('http://localhost:5173');
    const evil = await page(env, '/its/status', { headers: { Origin: 'https://evil.example' } });
    expect(evil.status).toBe(403);
    expect(evil.headers.get('Access-Control-Allow-Origin')).toBeNull();
    expect(warned()).toContain('origin="https://evil.example"');
    // curl (no Origin) is fine: the key is the authentication
    expect((await call(env, '/its/status', { headers: { Authorization: `Bearer ${KEY_A}` } })).status).toBe(200);
  });

  it('answers a preflight without a key', async () => {
    for (const [path, method] of [['/its/status', 'GET'], ['/its/settings', 'PUT'], ['/its/run', 'POST']]) {
      const r = await call(env, path, { method: 'OPTIONS', headers: { Origin: ORIGIN, 'Access-Control-Request-Method': method } });
      expect(r.status).toBe(204);
      expect(r.headers.get('Access-Control-Allow-Origin')).toBe(ORIGIN);
      expect(r.headers.get('Access-Control-Allow-Methods')).toBe(method);
      expect(r.headers.get('Access-Control-Allow-Headers')).toBe('Authorization, Content-Type');
    }
    expect((await call(env, '/its/status', { method: 'OPTIONS', headers: { Origin: 'https://evil.example' } })).status).toBe(403);
  });

  it('never logs a key or a token', async () => {
    await page(env, '/its/status', { key: GUEST });
    await asRunner(env, '/runner/config', undefined, 'wrong-token');
    await put(input());
    await runAction('start');
    const all = allLogs();
    for (const secret of [KEY_A.slice(0, 32), KEY_B.slice(0, 32), GUEST, RUNNER, 'wrong-token', 'gh-token']) expect(all).not.toContain(secret);
  });
});

describe('PUT /its/settings', () => {
  it('saves a valid edit by who made it, answering the status; dates past today dropped on read', async () => {
    const r = await put(input());
    expect(r.status).toBe(200);
    const s: ItsStatus = await r.json();
    expect(s.settings).toEqual({ ...example.config.settings, paused: true, updatedAt: NOW, updatedBy: 'A' });
    expect(logs.log.mock.calls.flat().join('\n')).toContain('its settings by=A dates=2 skip=2 pri=1 int=15 guests=2 auto=0');
    vi.setSystemTime(Date.parse('2026-11-22T00:00:00+09:00'));
    expect((await status()).settings.dates).toEqual(['2026-11-22']);
  });

  it('409s an edit begun before someone else’s save, with the current status', async () => {
    await put(input());
    vi.setSystemTime(NOW + MIN);
    const stale = await put(input({ guests: 3 }), KEY_B);
    expect(stale.status).toBe(409);
    expect(((await stale.json()) as ItsStatus).settings).toMatchObject({ guests: 2, updatedBy: 'A', updatedAt: NOW });
    expect(warned()).toContain('its settings conflict by=B');
    const ok = await put(input({ guests: 3, baseUpdatedAt: NOW }), KEY_B);
    expect(ok.status).toBe(200);
    expect(((await ok.json()) as ItsStatus).settings).toMatchObject({ guests: 3, updatedBy: 'B', updatedAt: NOW + MIN });
  });

  it('two saves in one millisecond still move updatedAt (the second draft conflicts)', async () => {
    await put(input());
    await put(input({ baseUpdatedAt: NOW }));
    expect((await status()).settings.updatedAt).toBe(NOW + 1);
    expect((await put(input({ baseUpdatedAt: NOW }))).status).toBe(409);
  });

  it('refuses what the contract refuses (400 with its code), and bodies that aren’t JSON or are too big', async () => {
    const rows = state.count.rows;
    for (const [body, error] of [
      [input({ intervalSec: 10 }), 'bad_interval'],
      [input({ dates: ['2026-11-12'] }), 'past_date'],
      [input({ skip: ['a\u202eb'] }), 'bad_hotels'],
      [[], 'bad_shape'],
    ] as const) {
      const r = await put(body);
      expect([r.status, ((await r.json()) as { error: string }).error]).toEqual([400, error]);
    }
    const nj = await page(env, '/its/settings', { method: 'PUT', body: '{' });
    expect([nj.status, await nj.json()]).toEqual([400, { ok: false, error: 'not_json' }]);
    const big = await page(env, '/its/settings', { method: 'PUT', body: JSON.stringify({ ...input(), pad: 'x'.repeat(70_000) }) });
    expect(big.status).toBe(413);
    expect(big.headers.get('Access-Control-Allow-Origin')).toBe(ORIGIN);   // the page can read why
    expect(state.count.rows).toBe(rows);
    expect(warned()).toContain('its refused 400 past_date PUT /its/settings by=A');
  });

  it('keeps paused as it is (that’s 開始 / 停止’s)', async () => {
    await runAction('start');
    const s: ItsStatus = await (await put(input())).json();
    expect(s.settings.paused).toBe(false);
  });
});

describe('POST /its/run', () => {
  beforeEach(async () => {
    await put(input());
  });

  it('start: clears paused and dispatches the runner’s workflow on main', async () => {
    const before = (await status()).settings.updatedAt;
    const s: ItsStatus = await (await runAction('start')).json();
    expect(s.settings.paused).toBe(false);
    expect(s.settings.updatedAt).toBe(before);   // nobody's draft conflicts with it
    expect(s.dispatch).toEqual({ at: NOW, ok: true, status: 204 });
    expect(s.verdict).toBe('starting');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(DISPATCH_URL);
    expect(url).toBe('https://api.github.com/repos/huangwaylon/fitness/actions/workflows/its-runner.yml/dispatches');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body as string)).toEqual({ ref: 'main' });
    const h = init.headers as Record<string, string>;
    expect(h.Accept).toBe('application/vnd.github+json');
    expect(h.Authorization).toBe('Bearer gh-token');
    expect(h['User-Agent']).toMatch(/its-bot/);
    expect(logs.log.mock.calls.flat().join('\n')).toContain('its run start by=A dispatch=204');
  });

  it('start without a token: nothing sent, recorded as such (the schedule starts a run)', async () => {
    await fresh({ GH_DISPATCH_TOKEN: undefined });
    await put(input());
    const s: ItsStatus = await (await runAction('start')).json();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(s.dispatch).toEqual({ at: NOW, ok: true, status: null });
    expect([s.settings.paused, s.verdict]).toEqual([false, 'starting']);
  });

  it('a refused or failed dispatch is recorded and shown (dispatch_failed), the start kept', async () => {
    fetchMock.mockResolvedValueOnce(new Response('{"message":"Bad credentials"}', { status: 401 }));
    let s: ItsStatus = await (await runAction('start')).json();
    expect([s.settings.paused, s.dispatch?.ok, s.dispatch?.status, s.verdict, s.reasons]).toEqual([false, false, 401, 'degraded', ['dispatch_failed', 'starting']]);
    expect(warned()).toContain('its dispatch refused status=401');
    fetchMock.mockRejectedValueOnce(new TypeError('network'));
    vi.setSystemTime(NOW + 3 * MIN);
    s = await (await runAction('start')).json();
    expect(s.dispatch).toEqual({ at: NOW + 3 * MIN, ok: false, status: 0 });
  });

  it('sends nothing when MODE is off, there’s no date, or a run is on its way', async () => {
    await runAction('start');
    await runAction('start');   // within 2 min of a dispatch nobody reported after
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(logs.log.mock.calls.flat().join('\n')).toContain('dispatch=skip_recent');
    // a live run
    await asRunner(env, '/runner/claim', example.claimInput);
    await asRunner(env, '/runner/report', report());
    vi.setSystemTime(NOW + 5 * MIN);
    await asRunner(env, '/runner/report', report());
    await runAction('stop');
    await runAction('start');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(logs.log.mock.calls.flat().join('\n')).toContain('dispatch=skip_running');
    await fresh({ MODE: 'off', GH_DISPATCH_TOKEN: 'gh-token' });
    await put(input());
    expect(((await (await runAction('start')).json()) as ItsStatus).settings.paused).toBe(false);
    await fresh();
    await put(input({ dates: [] }));
    await runAction('start');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('stop: sets paused; the runner is told at its next report', async () => {
    await runAction('start');
    await asRunner(env, '/runner/claim', example.claimInput);
    const s: ItsStatus = await (await runAction('stop')).json();
    expect([s.settings.paused, s.verdict]).toEqual([true, 'stopped']);
    const c: RunnerConfig = await (await asRunner(env, '/runner/report', report())).json();
    expect([c.stop, c.stopReason]).toEqual([true, 'paused']);
  });

  it('refuses another action', async () => {
    const r = await runAction('restart');
    expect([r.status, await r.json()]).toEqual([400, { ok: false, error: 'bad_action' }]);
  });
});

describe('the runner’s routes', () => {
  it('refuse a missing or wrong token, and every token while ITS_RUNNER_TOKEN is unset', async () => {
    const before = { ...state.count };
    expect((await call(env, '/runner/config')).status).toBe(401);
    expect((await asRunner(env, '/runner/config', undefined, 'nope')).status).toBe(401);
    expect((await asRunner(env, '/runner/report', report(), KEY_A)).status).toBe(401);   // a member's key
    expect(state.count).toEqual(before);
    await fresh({ ITS_RUNNER_TOKEN: undefined });
    expect((await asRunner(env, '/runner/config')).status).toBe(401);
    expect(warned()).toContain('its refused 401 no_runner_token GET /runner/config');
  });

  it('GET /runner/config: the preflight; stop while paused, MODE off, or without a date', async () => {
    let c: RunnerConfig = await (await asRunner(env, '/runner/config')).json();
    expect([c.stop, c.stopReason, c.ackSeq]).toEqual([true, 'paused', 0]);
    await put(input());
    await runAction('start');
    c = await (await asRunner(env, '/runner/config?runId=19283746')).json();
    expect([c.stop, c.stopReason]).toEqual([false, null]);
    expect((await asRunner(env, '/runner/config?runId=a%20b')).status).toBe(400);
    await fresh({ MODE: 'off' });
    c = await (await asRunner(env, '/runner/config')).json();
    expect(c.stopReason).toBe('mode_off');
  });

  it('claim, report and bookings answer a RunnerConfig; bad bodies are 400 with a code', async () => {
    const claim = (await (await asRunner(env, '/runner/claim', example.claimInput)).json()) as ClaimReply & { config: RunnerConfig };
    expect(claim).toMatchObject({ ok: true, lease: { holder: '19283746', host: 'actions' } });
    expect(Object.keys(claim.config).sort()).toEqual(Object.keys(example.config).sort());
    const r: RunnerConfig = await (await asRunner(env, '/runner/report', report())).json();
    expect(Object.keys(r).sort()).toEqual(Object.keys(example.config).sort());
    const b: RunnerConfig = await (await asRunner(env, '/runner/bookings?runId=19283746', [example.bookingInput])).json();
    expect(b.bookings.map((x) => x.id)).toEqual(['19283746:3']);
    for (const [path, body, error] of [
      ['/runner/claim', { runId: 'x y', host: 'actions' }, 'bad_claim'],
      ['/runner/report', { ...report(), phase: 'dancing' }, 'bad_report_shape'],
      ['/runner/bookings', [{ ...example.bookingInput, kind: 'cancelled' }], 'bad_booking'],
    ] as const) {
      const res = await asRunner(env, path, body);
      expect([res.status, ((await res.json()) as { error: string }).error]).toEqual([400, error]);
    }
    const big = await asRunner(env, '/runner/report', { ...report(), seen: Array(400).fill('x'.repeat(200)) });
    expect(big.status).toBe(413);
  });
});

describe('errors', () => {
  it('a failing object is a 500, logged', async () => {
    env = { ...env, BOT: { idFromName: () => 'x', get: () => ({ status: () => Promise.reject(new Error('boom')) }) } } as unknown as Env;
    expect((await page(env, '/its/status')).status).toBe(500);
    expect(logs.error).toHaveBeenCalled();
  });
});
