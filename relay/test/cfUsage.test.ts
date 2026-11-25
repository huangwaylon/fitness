// ボット → Jobs' Cloudflare free tier (src/cfUsage.ts, src/jobs.ts jobsRoute): GraphQL's reply as the four limits (the
// namespaces named, the rest `other`, the most first), the isolate's copy (10 min, a failure 2 min, never past UTC
// midnight, each request its own read), the failures (no token: never asked; HTTP, GraphQL's errors, a bad shape, a timeout:
// the day's last good limits kept) logged once per change, and `/jobs` carrying it (absent or failing: the record's
// answer as it was). Hermetic: fetch mocked, the clock pinned.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { CF_ACCOUNT, FAIL_TTL_MS, USAGE_TTL_MS, cfUsage, newUsageCache, parseUsageReply, usageQuery, type UsageDeps } from '../src/cfUsage.ts';
import { jobsRoute } from '../src/jobs.ts';
import { parseJobs, type Usage } from '../../app/src/lib/contract/jobs.ts';
import type { RelayEvent } from '../src/log.ts';

const MIN = 60_000;
// 12:20 Tokyo, 2026-11-25
const NOW = Date.parse('2026-11-25T03:20:00.000Z');

/** A reply as Cloudflare sent it on 2026-11-25 (trimmed): a namespace not in the map, a Worker not in it. */
const REPLY = {
  data: { viewer: { accounts: [{
    d: [
      { dimensions: { namespaceId: '463d2de8c7234f269fbc37b7df750831' }, sum: { rowsRead: 115172, rowsWritten: 772 } },
      { dimensions: { namespaceId: 'bb910334c3bb4e2b8d01b978a20d0e3a' }, sum: { rowsRead: 84911, rowsWritten: 7572 } },
      { dimensions: { namespaceId: '00608bdb2bda463e95a73e6501078f04' }, sum: { rowsRead: 75651, rowsWritten: 29806 } },
      { dimensions: { namespaceId: 'ffffffffffffffffffffffffffffffff' }, sum: { rowsRead: 10, rowsWritten: 0 } }
    ],
    r: [
      { dimensions: { namespaceId: '1dd1879eca0f431ba7e426980e30d8c8' }, sum: { requests: 1016 } },
      { dimensions: { namespaceId: 'dabdf9dec9244cfdab1eca75eb1422d2' }, sum: { requests: 1151 } }
    ],
    w: [
      { dimensions: { scriptName: 'island-fund-relay' }, sum: { errors: 45, requests: 749 } },
      { dimensions: { scriptName: 'island-fund-relay-test' }, sum: { errors: 1, requests: 450 } },
      { dimensions: { scriptName: 'gym-bot' }, sum: { errors: 9, requests: 80 } },
      { dimensions: { scriptName: 'island-fund-relay' }, sum: { requests: 1 } }
    ]
  }] } },
  errors: null
};

afterEach(() => vi.useRealTimers());

describe('the reply', () => {
  it('as the four limits: summed by namespace or Worker (named; unknown namespaces other), the most first, zeros dropped', () => {
    const p = parseUsageReply(REPLY);
    expect(p).toEqual({ limits: [
      { k: 'doRead', used: 275744, max: 5_000_000, by: [{ name: 'test/IslandStore', n: 115172 }, { name: 'relay/IslandStore', n: 84911 }, { name: 'relay/IslandLog', n: 75651 }, { name: 'other', n: 10 }] },
      { k: 'doWrite', used: 38150, max: 100_000, by: [{ name: 'relay/IslandLog', n: 29806 }, { name: 'relay/IslandStore', n: 7572 }, { name: 'test/IslandStore', n: 772 }] },
      { k: 'doReq', used: 2167, max: 100_000, by: [{ name: 'test/IslandRoom', n: 1151 }, { name: 'relay/IslandRoom', n: 1016 }] },
      { k: 'wReq', used: 1280, max: 100_000, by: [{ name: 'relay', n: 750 }, { name: 'test', n: 450 }, { name: 'gym-bot', n: 80 }] }
    ] });
  });

  it('GraphQL’s errors: gql; anything else not the shape: shape; an empty day: zeros', () => {
    expect(parseUsageReply({ data: null, errors: [{ message: 'not authorized' }] })).toEqual({ err: 'gql' });
    expect(parseUsageReply({ data: { viewer: { accounts: [] } } })).toEqual({ err: 'shape' });
    expect(parseUsageReply({ data: { viewer: { accounts: [{ w: [], d: null, r: [] }] } } })).toEqual({ err: 'shape' });
    expect(parseUsageReply('<html>')).toEqual({ err: 'shape' });
    const empty = parseUsageReply({ data: { viewer: { accounts: [{ w: [], d: [], r: [] }] } } });
    expect('limits' in empty && empty.limits.map((l) => l.used)).toEqual([0, 0, 0, 0]);
  });

  it('the query asks the account (wrangler.toml’s) for the UTC day', () => {
    expect(readFileSync(`${import.meta.dirname}/../wrangler.toml`, 'utf8')).toContain(`account_id = "${CF_ACCOUNT}"`);
    const q = usageQuery('2026-11-25');
    expect(q).toContain(`accountTag:"${CF_ACCOUNT}"`);
    expect(q.match(/date:"2026-11-25"/g)).toHaveLength(3);
  });
});

/** Cloudflare answering `reply` (or a status, or never: `hang`); `calls` its bodies, `logs` the events. */
function net(answer: () => Response | 'hang' | 'throw' = () => Response.json(REPLY)) {
  const calls: { auth: string; query: string }[] = [];
  const logs: RelayEvent[] = [];
  let now = NOW;
  const f = vi.fn((u: string | URL | Request, init?: RequestInit) => {
    expect(String(u)).toBe('https://api.cloudflare.com/client/v4/graphql');
    calls.push({ auth: (init?.headers as Record<string, string>).Authorization, query: JSON.parse(String(init?.body)).query });
    const a = answer();
    if (a === 'throw') return Promise.reject(new TypeError('network'));
    if (a === 'hang') return new Promise<Response>((_, reject) => init?.signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError'))));
    return Promise.resolve(a);
  });
  const deps: UsageDeps = { now: () => now, fetch: f as unknown as typeof fetch, token: 'cf_test', log: (e) => void logs.push(e) };
  return { deps, calls, logs, at: (t: number) => (now = t) };
}

describe('the copy and the failures', () => {
  it('read once, kept 10 min, read again after; a new UTC day reads at once', async () => {
    const c = newUsageCache(), n = net();
    const a = await cfUsage(c, n.deps);
    expect(await cfUsage(c, n.deps)).toBe(a);
    expect(n.calls).toHaveLength(1);
    expect(n.calls[0].auth).toBe('Bearer cf_test');
    expect(n.calls[0].query).toContain('date:"2026-11-25"');
    expect(a).toMatchObject({ at: NOW, day: '2026-11-25', err: null });
    expect(a.limits.map((l) => l.k)).toEqual(['doRead', 'doWrite', 'doReq', 'wReq']);
    n.at(NOW + USAGE_TTL_MS - 1);
    await cfUsage(c, n.deps);
    expect(n.calls).toHaveLength(1);
    n.at(NOW + USAGE_TTL_MS);
    await cfUsage(c, n.deps);
    expect(n.calls).toHaveLength(2);
    // 23:58 UTC read, 00:01 the next day: not kept past midnight
    n.at(Date.parse('2026-11-25T23:58:00Z'));
    await cfUsage(c, n.deps);
    n.at(Date.parse('2026-11-26T00:01:00Z'));
    expect((await cfUsage(c, n.deps)).day).toBe('2026-11-26');
    expect(n.calls).toHaveLength(4);
    expect(n.logs).toEqual([]);
  });

  it('no token: no_token, Cloudflare never asked, nothing logged', async () => {
    const c = newUsageCache(), n = net();
    expect(await cfUsage(c, { ...n.deps, token: undefined })).toEqual({ at: NOW, day: null, limits: [], err: 'no_token' });
    expect(n.calls).toHaveLength(0);
    expect(n.logs).toEqual([]);
  });

  it('a failure: its code, the day’s last good limits kept, retried after 2 min; logged once per change, then well again', async () => {
    let answer: () => Response | 'hang' | 'throw' = () => Response.json(REPLY);
    const c = newUsageCache(), n = net(() => answer());
    const good = await cfUsage(c, n.deps);
    answer = () => new Response('nope', { status: 401 });
    n.at(NOW + USAGE_TTL_MS);
    const bad = await cfUsage(c, n.deps);
    expect(bad).toEqual({ at: NOW, day: '2026-11-25', limits: good.limits, err: 'http_401' });
    n.at(NOW + USAGE_TTL_MS + FAIL_TTL_MS - 1);
    await cfUsage(c, n.deps);
    expect(n.calls).toHaveLength(2);
    n.at(NOW + USAGE_TTL_MS + FAIL_TTL_MS);
    await cfUsage(c, n.deps);
    expect(n.calls).toHaveLength(3);
    answer = () => Response.json({ data: null, errors: [{ message: 'x' }] });
    n.at(NOW + 20 * MIN);
    expect((await cfUsage(c, n.deps)).err).toBe('gql');
    answer = () => 'throw';
    n.at(NOW + 25 * MIN);
    expect((await cfUsage(c, n.deps)).err).toBe('fetch');
    answer = () => Response.json(REPLY);
    n.at(NOW + 30 * MIN);
    expect((await cfUsage(c, n.deps)).err).toBeNull();
    expect(n.logs.map((e) => [e.e, e.l, e.d?.ok, e.d?.why])).toEqual([
      ['cf.usage', 2, false, 'http_401'], ['cf.usage', 2, false, 'gql'], ['cf.usage', 2, false, 'fetch'], ['cf.usage', 1, true, undefined]
    ]);
  });

  it('a failure with no good read today: no limits', async () => {
    const c = newUsageCache(), n = net(() => new Response('', { status: 500 }));
    expect(await cfUsage(c, n.deps)).toEqual({ at: NOW, day: null, limits: [], err: 'http_500' });
  });

  it('Cloudflare not answering: timeout after 3 s (aborted)', async () => {
    vi.useFakeTimers();
    const c = newUsageCache(), n = net(() => 'hang');
    const p = cfUsage(c, n.deps);
    await vi.advanceTimersByTimeAsync(3_000);
    expect(await p).toMatchObject({ err: 'timeout', limits: [] });
    expect(n.logs.map((e) => e.d?.why)).toEqual(['timeout']);
  });
});

describe('GET /jobs', () => {
  const ORIGIN = 'https://island-fund.pages.dev';
  const BODY = JSON.stringify({ ok: true, v: 1, now: NOW, ext: { at: null, by: null, err: null }, jobs: [], alerts: [] });
  const get = () => new Request('https://relay/jobs', { headers: { Origin: ORIGIN, Authorization: 'Bearer k' } });
  const env = (o: { read?: () => Promise<string>; usage?: () => Promise<Usage> }) => ({ allowed: ORIGIN, roleOf: (k: string) => (k === 'k' ? 'A' as const : null), read: o.read ?? (async () => BODY), ...(o.usage ? { usage: o.usage } : {}) });

  it('the record’s answer with the usage joined, read back by the app’s parser', async () => {
    const c = newUsageCache(), n = net();
    const res = await jobsRoute(get(), env({ usage: () => cfUsage(c, n.deps) }));
    expect(res.status).toBe(200);
    const s = parseJobs(await res.json())!;
    expect(s.usage).toMatchObject({ day: '2026-11-25', err: null });
    expect(s.usage!.limits[0]).toMatchObject({ k: 'doRead', used: 275744, max: 5_000_000 });
  });

  it('no usage (or it throwing): the record’s answer as it was', async () => {
    expect(await (await jobsRoute(get(), env({}))).text()).toBe(BODY);
    expect(await (await jobsRoute(get(), env({ usage: () => Promise.reject(new Error('x')) }))).text()).toBe(BODY);
  });

  it('the record failing (its objects over a limit): 503 unavailable, the usage still in it to say which', async () => {
    const c = newUsageCache(), n = net();
    const down = () => Promise.reject(new Error('Exceeded allowed rows read'));
    const res = await jobsRoute(get(), env({ read: down, usage: () => cfUsage(c, n.deps) }));
    expect(res.status).toBe(503);
    const b = await res.json() as { ok: boolean; error: string; usage: Usage };
    expect([b.ok, b.error, b.usage.limits[0].k, b.usage.limits[0].used]).toEqual([false, 'unavailable', 'doRead', 275744]);
    expect(await (await jobsRoute(get(), env({ read: down }))).json()).toEqual({ ok: false, error: 'unavailable' });
  });
});
