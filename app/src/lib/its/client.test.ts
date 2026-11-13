// The its-bot Worker's client (client.ts): an answer checked (garbled → null), the member key as a Bearer token, a 409's
// current status, failures logged without the key.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import example from '../../../../its/contract-example.json';

const KEY = 'ab'.repeat(32);
const key = vi.hoisted(() => ({ value: null as string | null }));
const logged = vi.hoisted(() => [] as unknown[][]);
vi.mock('#lib/sync/storage.ts', () => ({ getKey: () => key.value }));
vi.mock('#lib/sync/log.ts', () => ({ log: (...a: unknown[]) => void logged.push(a) }));
const client = await import('./client.ts');
const { fetchStatus, parseStatus, postRun, putSettings } = client;

const URL = 'https://its.test';
/** The example's status as the page reads it. */
const parsed = example.status;
const wire = () => JSON.parse(JSON.stringify(example.status)) as Record<string, unknown>;
const answer = (status: number, body: unknown) => new Response(typeof body === 'string' ? body : JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

describe('parseStatus', () => {
  it('takes the Worker’s answer as it is', () => {
    expect(parseStatus(wire())).toEqual(parsed);
  });
  it('refuses what isn’t one', () => {
    for (const x of [null, 'oops', [], {}, { ...wire(), v: 2 }, { ...wire(), verdict: 'great' }, { ...wire(), now: 'soon' }, { ...wire(), settings: null },
      { ...wire(), settings: { ...example.status.settings, intervalSec: 10 } }, { ...wire(), settings: { ...example.status.settings, dates: ['2026-02-30'] } }]) {
      expect(parseStatus(x)).toBeNull();
    }
  });
  it('leaves out a garbled booking, event, reason or runner', () => {
    const s = parseStatus({ ...wire(), reasons: ['human_needed', 'gremlins'], bookings: [{ kind: 'hold' }, 'x', ...example.status.bookings], events: [{ kind: 'party', t: 1 }], runner: { scans: 3 }, seen: ['a', 4] });
    expect(s).toMatchObject({ reasons: ['human_needed'], bookings: example.status.bookings, events: [], runner: null, seen: ['a'] });
  });
  it('takes the site’s long names whole (≤ MAX_SITE_NAME; a ★ entry ≤ MAX_NAME) and leaves out a bidi trick or an overlong one', () => {
    const long = 'ホ'.repeat(150);
    const s = parseStatus({ ...wire(), seen: [long, 'a\u202eb', 'x'.repeat(201)], settings: { ...example.status.settings, skip: [long, 'b\u0007'], priority: ['NAGU', 'p'.repeat(81)] },
      bookings: [{ ...example.status.bookings[0], hotel: long }, { ...example.status.bookings[0], hotel: 'x'.repeat(201) }] })!;
    expect([s.seen, s.settings.skip, s.settings.priority, s.bookings.map((b) => b.hotel)]).toEqual([[long], [long], ['NAGU'], [long]]);
  });
  it('reads the allow-list when the Worker keeps one, and leaves it absent when it doesn’t', () => {
    expect(parseStatus(wire())!.settings).not.toHaveProperty('search');
    expect(parseStatus({ ...wire(), settings: { ...example.status.settings, search: ['NAGU 勝浦', 'a\u202eb', 3] } })!.settings.search).toEqual(['NAGU 勝浦']);
    expect(parseStatus({ ...wire(), settings: { ...example.status.settings, search: [] } })!.settings.search).toEqual([]);
  });
  it('reads the last preflight; a missing or garbled one is null', () => {
    const { lastPreflight: _p, ...without } = wire();
    expect(parseStatus(without)!.lastPreflight).toBeNull();
    expect(parseStatus({ ...wire(), lastPreflight: 'soon' })!.lastPreflight).toBeNull();
    expect(parseStatus(wire())!.lastPreflight).toBe(example.status.lastPreflight);
  });
  it('reads the push status (counts, its VAPID key, codes); a missing or garbled one reads as push off, a bad key as none', () => {
    const push = example.status.push;
    expect(parseStatus(wire())!.push).toEqual(push);
    const { push: _p, ...without } = wire();
    expect(parseStatus(without)!.push).toEqual({ A: 0, B: 0, vapidPublic: null, lastSentAt: null, lastOutcome: null });
    expect(parseStatus({ ...wire(), push: { A: 'x' } })!.push).toEqual({ A: 0, B: 0, vapidPublic: null, lastSentAt: null, lastOutcome: null });
    expect(parseStatus({ ...wire(), push: { ...push, vapidPublic: 'short' } })!.push!.vapidPublic).toBeNull();
    expect(parseStatus({ ...wire(), push: { ...push, vapidPublic: null, lastOutcome: null } })!.push).toMatchObject({ vapidPublic: null, lastOutcome: null });
  });
  it('reads who pressed 開始 / 停止 last (C3), and leaves a garbled one out', () => {
    const control = { action: 'stop', by: 'B', at: example.status.now - 60_000 };
    expect(parseStatus({ ...wire(), control })!.control).toEqual(control);
    for (const c of [null, { ...control, by: 'G' }, { ...control, action: 'pause' }, { ...control, at: 'now' }]) expect(parseStatus({ ...wire(), control: c })!.control).toBeNull();
  });
});

describe('the calls', () => {
  const fetch = vi.fn<typeof globalThis.fetch>();
  beforeEach(() => {
    key.value = KEY;
    logged.length = 0;
    fetch.mockReset();
    vi.stubGlobal('fetch', fetch);
  });
  afterEach(() => vi.unstubAllGlobals());

  it('sends the member key as a Bearer token, the body as JSON, and reads the status back', async () => {
    fetch.mockImplementation(async () => answer(200, example.status));
    expect(await fetchStatus(undefined, URL)).toEqual({ ok: true, status: parsed });
    expect(fetch.mock.calls[0][0]).toBe(`${URL}/its/status`);
    expect(fetch.mock.calls[0][1]).toMatchObject({ method: 'GET', headers: { Authorization: `Bearer ${KEY}` } });

    expect((await putSettings(example.settingsInput as never, undefined, URL)).ok).toBe(true);
    const [u, init] = fetch.mock.calls[1];
    expect([u, init?.method, JSON.parse(String(init?.body))]).toEqual([`${URL}/its/settings`, 'PUT', example.settingsInput]);
    expect(init?.headers).toMatchObject({ 'Content-Type': 'application/json' });

    await postRun('stop', undefined, URL);
    expect([fetch.mock.calls[2][0], fetch.mock.calls[2][1]?.method, fetch.mock.calls[2][1]?.body]).toEqual([`${URL}/its/run`, 'POST', '{"action":"stop"}']);
    expect(logged).toEqual([]);
  });

  it('a 409 is `conflict`, with the current status (bare or under `status`)', async () => {
    fetch.mockResolvedValueOnce(answer(409, { error: 'conflict', status: example.status }));
    expect(await putSettings(example.settingsInput as never, undefined, URL)).toMatchObject({ ok: false, err: 'conflict', http: 409, status: parsed });
    fetch.mockResolvedValueOnce(answer(409, example.status));
    expect(await putSettings(example.settingsInput as never, undefined, URL)).toMatchObject({ err: 'conflict', status: parsed });
  });

  it('a refusal keeps the Worker’s code; garbage, a dropped line and no key are the phone’s; each logged without the key', async () => {
    fetch.mockResolvedValueOnce(answer(400, { error: 'bad_hotels' }));
    expect(await putSettings(example.settingsInput as never, undefined, URL)).toMatchObject({ ok: false, err: 'bad_hotels', http: 400, status: null, rid: expect.stringMatching(/^[0-9a-f]{8}$/) });
    fetch.mockResolvedValueOnce(answer(502, '<html>bad gateway</html>'));
    expect(await fetchStatus(undefined, URL)).toMatchObject({ ok: false, err: 'http', http: 502 });
    fetch.mockResolvedValueOnce(answer(200, { v: 1 }));
    expect(await fetchStatus(undefined, URL)).toMatchObject({ ok: false, err: 'json', http: 200 });
    fetch.mockRejectedValueOnce(new TypeError('Load failed')).mockRejectedValueOnce(new TypeError('Load failed'));
    expect(await postRun('start', undefined, URL)).toMatchObject({ ok: false, err: 'offline', http: null, status: null });
    expect(logged.map(([e, d, l]) => [e, (d as { op: string }).op, (d as { err: string }).err, (d as { http?: number }).http, l])).toEqual([
      ['its.fail', 'settings', 'bad_hotels', 400, 2], ['its.fail', 'status', 'http', 502, 2], ['its.fail', 'status', 'json', 200, 2], ['its.fail', 'run', 'offline', undefined, 1]
    ]);
    expect(JSON.stringify(logged)).not.toContain(KEY);

    // each line names its request (the Worker logs the same id)
    expect(logged.every(([, d]) => /^[0-9a-f]{8}$/.test((d as { rid: string }).rid))).toBe(true);

    key.value = null;
    expect(await fetchStatus(undefined, URL)).toMatchObject({ ok: false, err: 'no_key' });
    expect(fetch).toHaveBeenCalledTimes(4);   // the offline POST sent once: never twice (its reply may be what was lost)
  });

  /** A session of its own (the header's state is the session's). */
  const fresh = async () => {
    vi.resetModules();
    return import('./client.ts');
  };
  const sent = (i: number) => (fetch.mock.calls[i][1]?.headers as Record<string, string>)['X-Request-Id'];
  /** An older Worker: the CORS preflight fails a call carrying the header (a TypeError), the plain one goes through. */
  const older = () => fetch.mockImplementation(async (_, init) => {
    if ((init?.headers as Record<string, string>)['X-Request-Id']) throw new TypeError('Load failed');
    return answer(200, example.status);
  });

  it('sends an X-Request-Id; a Worker whose preflight refuses it gets the session’s first read again without, and not the header again', async () => {
    const c = await fresh();
    older();
    expect((await c.fetchStatus(undefined, URL)).ok).toBe(true);
    expect(sent(0)).toMatch(/^[0-9a-f]{8}$/);
    expect(sent(1)).toBeUndefined();
    expect((await c.postRun('stop', undefined, URL)).ok).toBe(true);
    expect(fetch).toHaveBeenCalledTimes(3);
    expect(sent(2)).toBeUndefined();
    expect(logged).toEqual([]);
  });

  it('once an answer came with the header, a failure is never sent again without it; nor a session’s first PUT or POST', async () => {
    const c = await fresh();
    fetch.mockResolvedValueOnce(answer(200, example.status));
    await c.fetchStatus(undefined, URL);
    expect(sent(0)).toMatch(/^[0-9a-f]{8}$/);
    fetch.mockRejectedValueOnce(new TypeError('Load failed'));
    expect(await c.fetchStatus(undefined, URL)).toMatchObject({ ok: false, err: 'offline' });
    expect(fetch).toHaveBeenCalledTimes(2);
    // a new session whose first call is a PUT: a lost reply isn't sent twice
    const d = await fresh();
    older();
    expect(await d.putSettings(example.settingsInput as never, undefined, URL)).toMatchObject({ ok: false, err: 'offline' });
    expect(fetch).toHaveBeenCalledTimes(3);
  });

  it('the push routes: POST with the key, `{ok: true, push}` read back, a refusal’s code; never the endpoint in the log', async () => {
    const c = await fresh();
    fetch.mockResolvedValueOnce(answer(200, { ok: true, push: example.status.push }));
    expect(await c.pushCall('subscribe', example.pushSubscribeInput as never, undefined, URL)).toEqual({ ok: true, push: example.status.push });
    expect([fetch.mock.calls[0][0], fetch.mock.calls[0][1]?.method, JSON.parse(String(fetch.mock.calls[0][1]?.body))]).toEqual([`${URL}/its/push/subscribe`, 'POST', example.pushSubscribeInput]);
    expect(fetch.mock.calls[0][1]?.headers).toMatchObject({ Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' });
    fetch.mockResolvedValueOnce(answer(429, { ok: false, error: 'rate_limited' }));
    expect(await c.pushCall('test', example.pushEndpointInput, undefined, URL)).toEqual({ ok: false, err: 'rate_limited', http: 429 });
    fetch.mockResolvedValueOnce(answer(404, { ok: false, error: 'not_found' }));
    expect(await c.pushCall('unsubscribe', example.pushEndpointInput, undefined, URL)).toEqual({ ok: false, err: 'not_found', http: 404 });
    fetch.mockResolvedValueOnce(answer(200, example.status));   // not a push reply
    expect(await c.pushCall('test', example.pushEndpointInput, undefined, URL)).toMatchObject({ ok: false, err: 'json' });
    expect(logged.map(([, d, l]) => [(d as { op: string }).op, (d as { err: string }).err, l])).toEqual([['push_test', 'rate_limited', 1], ['push_unsubscribe', 'not_found', 2], ['push_test', 'json', 2]]);
    expect(JSON.stringify(logged)).not.toContain('web.push.apple.com');
  });

  it('leaving (the abort) is not logged', async () => {
    const ctl = new AbortController();
    fetch.mockImplementation((_, init) => new Promise((_, reject) => init?.signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')))));
    const p = fetchStatus(ctl.signal, URL);
    ctl.abort();
    expect((await p).ok).toBe(false);
    expect(logged).toEqual([]);
  });
});

describe('no demo mode', () => {
  it('has no fixture: 設定 hides the row in demo mode, and the e2e mocks the Worker', () => {
    expect(Object.keys(client).filter((k) => /demo/i.test(k))).toEqual([]);
  });
});
