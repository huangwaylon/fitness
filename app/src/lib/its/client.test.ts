// The its-bot Worker's client (client.ts): an answer checked (garbled → null), the member key as a Bearer token, a 409's
// current status, failures logged without the key, and demo mode's fixture moved to now.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import example from '../../../../its/contract-example.json';
import { daysUntil, tokyoToday } from './contract.ts';

const KEY = 'ab'.repeat(32);
const key = vi.hoisted(() => ({ value: null as string | null }));
const logged = vi.hoisted(() => [] as unknown[][]);
vi.mock('#lib/sync/storage.ts', () => ({ getKey: () => key.value }));
vi.mock('#lib/sync/log.ts', () => ({ log: (...a: unknown[]) => void logged.push(a) }));
const { demoRun, demoSave, demoStatus, fetchStatus, parseStatus, postRun, putSettings } = await import('./client.ts');

const URL = 'https://its.test';
const wire = () => JSON.parse(JSON.stringify(example.status)) as Record<string, unknown>;
const answer = (status: number, body: unknown) => new Response(typeof body === 'string' ? body : JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

describe('parseStatus', () => {
  it('takes the Worker’s answer as it is', () => {
    expect(parseStatus(wire())).toEqual(example.status);
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
    expect(await fetchStatus(undefined, URL)).toEqual({ ok: true, status: example.status });
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
    expect(await putSettings(example.settingsInput as never, undefined, URL)).toEqual({ ok: false, err: 'conflict', http: 409, status: example.status });
    fetch.mockResolvedValueOnce(answer(409, example.status));
    expect(await putSettings(example.settingsInput as never, undefined, URL)).toMatchObject({ err: 'conflict', status: example.status });
  });

  it('a refusal keeps the Worker’s code; garbage, a dropped line and no key are the phone’s; each logged without the key', async () => {
    fetch.mockResolvedValueOnce(answer(400, { error: 'bad_hotels' }));
    expect(await putSettings(example.settingsInput as never, undefined, URL)).toEqual({ ok: false, err: 'bad_hotels', http: 400, status: null });
    fetch.mockResolvedValueOnce(answer(502, '<html>bad gateway</html>'));
    expect(await fetchStatus(undefined, URL)).toMatchObject({ ok: false, err: 'http', http: 502 });
    fetch.mockResolvedValueOnce(answer(200, { v: 1 }));
    expect(await fetchStatus(undefined, URL)).toMatchObject({ ok: false, err: 'json', http: 200 });
    fetch.mockRejectedValueOnce(new TypeError('Load failed'));
    expect(await postRun('start', undefined, URL)).toEqual({ ok: false, err: 'offline', http: null, status: null });
    expect(logged.map(([e, d, l]) => [e, (d as { op: string }).op, (d as { err: string }).err, (d as { http?: number }).http, l])).toEqual([
      ['its.fail', 'settings', 'bad_hotels', 400, 2], ['its.fail', 'status', 'http', 502, 2], ['its.fail', 'status', 'json', 200, 2], ['its.fail', 'run', 'offline', undefined, 1]
    ]);
    expect(JSON.stringify(logged)).not.toContain(KEY);

    key.value = null;
    expect(await fetchStatus(undefined, URL)).toMatchObject({ ok: false, err: 'no_key' });
    expect(fetch).toHaveBeenCalledTimes(4);
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

describe('demo mode', () => {
  const NOW = Date.parse('2026-12-01T03:00:00Z');
  it('is the example moved to now: its stays the same days ahead in Tokyo', () => {
    const s = demoStatus(NOW);
    expect(s.now).toBe(NOW);
    expect(s.settings.dates.map((d) => daysUntil(d, NOW))).toEqual(example.status.settings.dates.map((d) => daysUntil(d, example.status.now)));
    expect(s.runner!.lastSeen - NOW).toBe(example.status.runner.lastSeen - example.status.now);
    expect(tokyoToday(s.bookings[0].at)).toBe('2026-12-01');
    expect(parseStatus(JSON.parse(JSON.stringify(s)))).toEqual(s);
  });
  it('saves and starts / stops on the page', () => {
    const s = demoStatus(NOW);
    const saved = demoSave(s, { ...example.settingsInput, guests: 4 } as never, 'B', NOW + 1);
    expect(saved.settings).toMatchObject({ guests: 4, updatedAt: NOW + 1, updatedBy: 'B', paused: false });
    const stopped = demoRun(saved, 'stop', NOW + 2);
    expect([stopped.settings.paused, stopped.verdict, stopped.reasons]).toEqual([true, 'stopped', ['paused', 'human_needed']]);
    expect(demoRun(stopped, 'start', NOW + 3)).toMatchObject({ verdict: 'degraded', reasons: ['human_needed'], settings: { paused: false } });
  });
});
