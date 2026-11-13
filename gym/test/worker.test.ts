// The Worker (src/index.ts): which path reaches the bot and what is refused before it (the LINE signature, the token),
// and MODE's dispatch, with the bot a stub that records its calls; then the app's POST /gym/act end to end, through
// fetch to a real bot (over a fake Durable Object state, the gym's API stubbed, LINE mocked).
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

import worker from '../src/index.ts';
import { GymBot } from '../src/bot.ts';
import type { Env } from '../src/env.ts';
import type { Line } from '../src/line.ts';
import { isoJst } from '../src/time.ts';
import type { ActAnswer, GymConfig } from '../../app/src/lib/gym/contract.ts';
import { GROUP, NOW, fakeState, inDays } from './fakeBot.ts';

const SECRET = 'line-secret';
const TOKEN = 'gym-token';

let calls: { [k: string]: unknown[][] };
const rec = (name: string, ...args: unknown[]) => (calls[name] ??= []).push(args);
let bot: Record<string, (...a: never[]) => unknown>;

const envOf = (extra: Partial<Env> = {}): Env => ({
  MODE: 'off',
  BOT: { idFromName: (n: string) => (rec('BOT.id', n), n), get: () => bot },
  LINE_CHANNEL_TOKEN: 'line-token',
  LINE_CHANNEL_SECRET: SECRET,
  LINE_GROUP_ID: GROUP,
  GYM_TOKEN: TOKEN,
  ...extra
}) as unknown as Env;

let promises: Promise<unknown>[];
const ctx = () => ({ waitUntil: (p: Promise<unknown>) => void promises.push(p), passThroughOnException() {} }) as unknown as ExecutionContext;
const call = (path: string, init: RequestInit = {}, env = envOf()) =>
  worker.fetch(new Request(`https://gym.example${path}`, init), env, ctx());

/** LINE's X-Line-Signature for `body`. */
async function sign(body: string, secret = SECRET): Promise<string> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return btoa(String.fromCharCode(...new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body)))));
}

const menuEvent = (text = 'メニュー') =>
  ({ type: 'message', replyToken: `r-${text}`, source: { type: 'group', groupId: GROUP }, message: { type: 'text', text } });

/** POST a webhook request with these events, signed (or with `signature`), and wait for what it handed on. */
async function webhook(events: object[], env = envOf(), signature?: string | null) {
  const body = JSON.stringify({ destination: 'U1', events });
  const sig = signature === undefined ? await sign(body) : signature;
  const res = await call('/line/webhook', { method: 'POST', body, headers: sig === null ? {} : { 'X-Line-Signature': sig } }, env);
  await Promise.allSettled(promises);
  return res;
}

const bearer = (t = TOKEN) => ({ Authorization: `Bearer ${t}` });

beforeEach(() => {
  calls = {};
  promises = [];
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
  bot = {
    handle: (e: never) => (rec('BOT.handle', e), Promise.resolve()),
    getState: () => (rec('BOT.getState'), Promise.resolve({ version: 3 })),
    ensureAlarm: () => (rec('BOT.ensureAlarm'), Promise.resolve()),
    getStatus: () => (rec('BOT.getStatus'), Promise.resolve({ v: 1, verdict: 'healthy', n: calls['BOT.getStatus'].length })),
    putState: (j: never) => (rec('BOT.putState', j), Promise.resolve((j as { version?: number }).version === 3 ? { ok: true } : { ok: false, error: 'bad' }))
  };
});
afterEach(() => vi.restoreAllMocks());

describe('routing', () => {
  it('/health says ok, the mode and the deployed commit', async () => {
    expect(await (await call('/health')).json()).toEqual({ ok: true, mode: 'off', sha: null });
    expect(await (await call('/health', {}, envOf({ MODE: 'bot', COMMIT: 'abc1234' }))).json()).toEqual({ ok: true, mode: 'bot', sha: 'abc1234' });
  });

  it('answers 404 elsewhere, and to a webhook that isn’t a POST', async () => {
    expect((await call('/')).status).toBe(404);
    expect((await call('/line/webhook')).status).toBe(404);
    expect((await call('/gym/ws')).status).toBe(404);
  });
});

describe('/status', () => {
  afterEach(() => vi.useRealTimers());

  it('answers the bot’s status to any origin, asking the bot at most once a minute', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(Date.parse('2026-10-12T12:00:00+09:00'));
    const res = await call('/status');
    expect(await res.json()).toEqual({ v: 1, verdict: 'healthy', n: 1 });
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
    expect(res.headers.get('Cache-Control')).toBe('max-age=30');
    vi.advanceTimersByTime(59_000);
    expect(await (await call('/status')).json()).toEqual({ v: 1, verdict: 'healthy', n: 1 }); // the kept answer
    expect(calls['BOT.getStatus']).toHaveLength(1);
    vi.advanceTimersByTime(2_000);
    expect(await (await call('/status')).json()).toEqual({ v: 1, verdict: 'healthy', n: 2 });
    expect(calls['BOT.getStatus']).toHaveLength(2);
  });
});

describe('/gym/config', () => {
  const KEY_A = 'a'.repeat(64), KEY_B = 'b'.repeat(64), KEY_C = 'c'.repeat(64);
  const PAGES = 'https://island-fund.pages.dev';
  const keyed = (extra: Partial<Env> = {}) => envOf({ MODE: 'bot', KEY_A, KEY_B, ALLOWED_ORIGINS: PAGES, ...extra });
  const get = (headers: Record<string, string>, env = keyed(), method = 'GET') => call('/gym/config', { method, headers }, env);
  const logged = () => [...vi.mocked(console.log).mock.calls, ...vi.mocked(console.warn).mock.calls].map((c) => c.join(' '));

  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    bot.getConfig = () => (rec('BOT.getConfig'), Promise.resolve({ v: 1, text: '📋 日ごとの設定' }));
  });

  it('answers a member, from the app’s page or without an Origin, never kept', async () => {
    const res = await get({ ...bearer(KEY_A), Origin: PAGES });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ v: 1, text: '📋 日ごとの設定' });
    expect(res.headers.get('Cache-Control')).toBe('private, no-store');
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe(PAGES);
    expect(res.headers.get('Vary')).toBe('Origin');
    const curl = await get(bearer(KEY_B.toUpperCase())); // keys compare in either case
    expect([curl.status, curl.headers.get('Access-Control-Allow-Origin')]).toEqual([200, null]);
    expect(calls['BOT.getConfig']).toHaveLength(2);
    expect(logged()).toEqual(['config read by=A', 'config read by=B']);
  });

  it('refuses the guest, a wrong key or none (401), and an unset pair of keys', async () => {
    for (const h of [bearer(KEY_C), bearer('nope'), {}, { Authorization: KEY_A }]) {
      const res = await get({ ...h, Origin: PAGES });
      expect(res.status).toBe(401);
      expect(res.headers.get('Access-Control-Allow-Origin')).toBe(PAGES); // the page can read why
      expect(res.headers.get('Cache-Control')).toBe('no-store');
    }
    expect((await get(bearer(KEY_C), keyed({ KEY_C } as Partial<Env>))).status).toBe(401); // even if KEY_C were set
    expect(await (await get(bearer(''), keyed({ KEY_A: undefined, KEY_B: undefined }))).json()).toEqual({ ok: false, error: 'no_keys' });
    expect(calls['BOT.getConfig']).toBeUndefined();
    expect(logged().every((l) => /^config refused 401 (unauthorized|no_keys)$/.test(l))).toBe(true);
    // a stranger's 401 is routine (log level); unset keys are a setup slip (warn)
    expect(vi.mocked(console.warn).mock.calls).toEqual([['config refused 401 no_keys']]);
    expect(logged().join('\n')).not.toContain(KEY_A.slice(0, 8));
  });

  it('refuses another site’s page (403), even with a member’s key', async () => {
    const res = await get({ ...bearer(KEY_A), Origin: 'https://evil.example' });
    expect(res.status).toBe(403);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBeNull();
    expect(calls['BOT.getConfig']).toBeUndefined();
    expect(vi.mocked(console.warn).mock.calls).toEqual([['config refused 403 origin origin="https://evil.example"']]);
  });

  it('answers 500 with CORS when the object fails, and says so', async () => {
    bot.getConfig = () => Promise.reject(new TypeError('object reset'));
    const res = await get({ ...bearer(KEY_A), Origin: PAGES });
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ ok: false, error: 'failed' });
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe(PAGES); // the page can read it: a retry, not a CORS error
    expect(res.headers.get('Cache-Control')).toBe('no-store');
    expect(vi.mocked(console.error).mock.calls).toEqual([['config failed TypeError']]);
  });

  it('answers the preflight (GET with Authorization), and only GET', async () => {
    const pre = await get({ Origin: PAGES, 'Access-Control-Request-Method': 'GET', 'Access-Control-Request-Headers': 'authorization' }, keyed(), 'OPTIONS');
    expect(pre.status).toBe(204);
    expect(pre.headers.get('Access-Control-Allow-Origin')).toBe(PAGES);
    expect(pre.headers.get('Access-Control-Allow-Methods')).toBe('GET');
    expect(pre.headers.get('Access-Control-Allow-Headers')).toBe('Authorization');
    expect((await get({ Origin: 'http://localhost:5173' }, keyed(), 'OPTIONS')).status).toBe(204);
    const put = await get({ ...bearer(KEY_A), Origin: PAGES }, keyed(), 'PUT');
    expect([put.status, put.headers.get('Allow')]).toEqual([405, 'GET']);
    expect(calls['BOT.getConfig']).toBeUndefined();
  });
});

describe('the LINE webhook', () => {
  it('refuses a missing or wrong signature (403), reaching no object', async () => {
    expect((await webhook([menuEvent()], envOf({ MODE: 'bot' }), null)).status).toBe(403);
    expect((await webhook([menuEvent()], envOf({ MODE: 'bot' }), 'bm9wZQ==')).status).toBe(403);
    expect((await webhook([menuEvent()], envOf({ MODE: 'bot' }), await sign('{}', 'other'))).status).toBe(403);
    expect(calls).toEqual({});
  });

  it('bot mode: hands each event to the bot', async () => {
    const events = [menuEvent(), menuEvent('menu')];
    expect((await webhook(events, envOf({ MODE: 'bot' }))).status).toBe(200);
    expect(calls['BOT.handle']).toEqual(events.map((e) => [e]));
  });

  it('bot mode: a failing event is only logged', async () => {
    bot.handle = () => Promise.reject(new Error('boom'));
    expect((await webhook([menuEvent()], envOf({ MODE: 'bot' }))).status).toBe(200);
    expect(console.error).toHaveBeenCalled();
  });

  it('off: answers 200 but hands nothing on (the Mac runs the bot)', async () => {
    expect((await webhook([menuEvent()])).status).toBe(200);
    expect(calls).toEqual({});
  });

  it('answers LINE’s Verify (no events) with 200', async () => {
    expect((await webhook([], envOf({ MODE: 'bot' }))).status).toBe(200);
  });
});

describe('/gym/state', () => {
  it('refuses a missing or wrong token (401)', async () => {
    expect((await call('/gym/state')).status).toBe(401);
    expect((await call('/gym/state', { headers: bearer('nope') })).status).toBe(401);
    expect((await call('/gym/state', { headers: { Authorization: TOKEN } })).status).toBe(401);
    expect((await call('/gym/state', { headers: bearer('') }, envOf({ GYM_TOKEN: '' }))).status).toBe(401); // unset
    expect(calls).toEqual({});
  });

  it('takes the token whatever the secret’s trailing newline (a pasted one), and only it', async () => {
    const pasted = envOf({ GYM_TOKEN: `${TOKEN}\n` });
    expect((await call('/gym/state', { headers: bearer() }, pasted)).status).toBe(200);
    expect((await call('/gym/state', { headers: bearer(`${TOKEN} `) }, pasted)).status).toBe(200); // the header's trimmed too
    expect((await call('/gym/state', { headers: bearer(`${TOKEN}x`) }, pasted)).status).toBe(401);
    expect((await call('/gym/state', { headers: bearer('') }, envOf({ GYM_TOKEN: '\n' }))).status).toBe(401); // blank: unset
  });

  it('exports and imports the state', async () => {
    expect(await (await call('/gym/state', { headers: bearer() })).json()).toEqual({ version: 3 });
    const put = (body: string) => call('/gym/state', { method: 'PUT', headers: bearer(), body });
    const ok = await put('{"version":3}');
    expect([ok.status, await ok.json()]).toEqual([200, { ok: true }]);
    const bad = await put('{"version":2}');
    expect([bad.status, await bad.json()]).toEqual([400, { ok: false, error: 'bad' }]);
    const notJson = await put('{');
    expect([notJson.status, await notJson.json()]).toEqual([400, { ok: false, error: 'not JSON' }]);
    expect(calls['BOT.putState']).toEqual([[{ version: 3 }], [{ version: 2 }]]);
    expect((await call('/gym/state', { method: 'DELETE', headers: bearer() })).status).toBe(405);
  });
});

describe('the hourly cron', () => {
  it('asks the bot to restart its checks if they stopped', async () => {
    await worker.scheduled({} as ScheduledController, envOf({ MODE: 'bot' }));
    expect(calls['BOT.ensureAlarm']).toEqual([[]]);
  });
});


describe('POST /gym/act, end to end', () => {
  const KEY_A = 'a'.repeat(64), KEY_B = 'b'.repeat(64), KEY_C = 'c'.repeat(64);
  const PAGES = 'https://island-fund.pages.dev';
  const env = (extra: Partial<Env> = {}) => envOf({ MODE: 'bot', KEY_A, KEY_B, ALLOWED_ORIGINS: PAGES, NAME_A: 'ウェイ', ...extra });
  let real: GymBot;
  let replies: unknown[][];
  const page = (key = KEY_A) => ({ ...bearer(key), Origin: PAGES });
  const post = (body: unknown, headers: Record<string, string> = page(), e = env()) =>
    call('/gym/act', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Request-Id': 'rid-1', ...headers }, body: typeof body === 'string' ? body : JSON.stringify(body) }, e);
  const readConfig = async (): Promise<GymConfig> => (await call('/gym/config', { headers: page() }, env())).json();
  const row = (c: GymConfig, day: string) => c.rows.find((r) => r.day === day)!;
  const tap = (data: string) => ({ type: 'postback', replyToken: `r-${data}`, source: { type: 'group', groupId: GROUP, userId: 'U1' }, postback: { data } });
  const logged = () => [...vi.mocked(console.log).mock.calls, ...vi.mocked(console.warn).mock.calls].map((c) => c.join(' '));

  beforeEach(async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
    vi.spyOn(console, 'log').mockImplementation(() => {});
    // the gym's API: nothing open (one booked slot, as an empty answer is an error)
    const times = [{ start_at: isoJst(NOW + 3_600_000), is_reservable: false }];
    vi.stubGlobal('fetch', vi.fn(async () => Response.json({ data: { reserve_schedule: { dates: [{ date: 'any', times }] } } })));
    const st = fakeState();
    real = new GymBot(st.ctx as never, env());
    await st.loaded();
    replies = [];
    real.line = {
      reply: vi.fn(async (_t: string, m: unknown[]) => void replies.push(m)), memberName: vi.fn(async () => 'Bob'), push: vi.fn(async () => {}),
      quota: vi.fn(async () => 200), quotaUsed: vi.fn(async () => 0), webhook: vi.fn(async () => ({ endpoint: '', active: true }))
    } as unknown as Line;
    vi.spyOn(real, 'sleep').mockResolvedValue();
    bot = real as unknown as typeof bot;
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('a change: answered with the config after it, which /gym/config then shows; CORS and the request id on it', async () => {
    const before = await readConfig();
    const res = await post({ a: 'any', d: inDays(5), base: row(before, inDays(5)).base });
    expect(res.status).toBe(200);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe(PAGES);
    expect(res.headers.get('X-Request-Id')).toBe('rid-1');
    expect(res.headers.get('Cache-Control')).toBe('private, no-store');
    const body = await res.json() as Extract<ActAnswer, { ok: true }>;
    expect(body).toMatchObject({ ok: true, changed: true });
    const after = await readConfig();
    expect(row(after, inDays(5))).toMatchObject({ rule: 'any', resettable: true });
    expect(after.rows).toEqual(body.config.rows);
    expect(after.changes).toMatchObject([{ by: 'A', who: 'ウェイ', a: 'any', d: inDays(5) }]);
    expect(after.text).toContain('アプリで変更：'); // 📋 names it
    expect(logged()).toContain(`act by=A a=any d=${inDays(5)} changed=1 rid=rid-1`);
  });

  it('a LINE tap between the read and the act: 409 stale for that day (with the config), the other days go through', async () => {
    const seen = await readConfig();
    await webhook([tap(`a=skip&d=${inDays(2)}`)], env());
    expect(real.store.rule(inDays(2))).toBe('skip');
    const res = await post({ a: 'any', d: inDays(2), base: row(seen, inDays(2)).base });
    expect(res.status).toBe(409);
    const body = await res.json() as { config: GymConfig };
    expect(body).toMatchObject({ ok: false, error: 'stale', hint: expect.any(String) });
    expect(row(body.config, inDays(2)).rule).toBe('skip');
    expect(real.store.rule(inDays(2))).toBe('skip'); // LINE's stays
    expect((await post({ a: 'any', d: inDays(3), base: row(seen, inDays(3)).base })).status).toBe(200);
    // the next LINE reply carries the app's change, once
    await webhook([tap('a=help')], env());
    expect(JSON.stringify(replies.at(-1))).toContain('アプリで変更：');
    await webhook([tap('a=help')], env());
    expect(JSON.stringify(replies.at(-1))).not.toContain('アプリで変更：');
  });

  it('🔎 shares LINE’s once-a-minute cooldown: 429 with Retry-After', async () => {
    await webhook([tap('a=check')], env());
    vi.setSystemTime(NOW + 15_000);
    const res = await post({ a: 'check' });
    expect(res.status).toBe(429);
    expect(res.headers.get('Retry-After')).toBe('45');
    expect(res.headers.get('Access-Control-Expose-Headers')).toContain('Retry-After');
    expect(await res.json()).toMatchObject({ ok: false, error: 'cooldown', hint: '⏱️ 45秒ほど待ってから、もう一度お試しください。' });
    vi.setSystemTime(NOW + 61_000);
    const ok = await post({ a: 'check' });
    expect(await ok.json()).toMatchObject({ ok: true, changed: false, lines: ['いまは空きがありません。引き続きチェックします。'], partial: false, slots: [] });
  });

  it('refuses the guest, a wrong key, none (401) and unset keys (no_keys), before the bot', async () => {
    for (const h of [page(KEY_C), page('nope'), { Origin: PAGES }]) {
      const res = await post({ a: 'pause' }, h);
      expect([res.status, res.headers.get('Access-Control-Allow-Origin')]).toEqual([401, PAGES]);
      expect(await res.json()).toEqual({ ok: false, error: 'unauthorized' });
    }
    const unset = await post({ a: 'pause' }, page(), env({ KEY_A: undefined, KEY_B: undefined }));
    expect(await unset.json()).toEqual({ ok: false, error: 'no_keys' });
    expect(real.store.paused).toBe(false);
    expect(logged().filter((l) => l.startsWith('act refused 401'))).toHaveLength(4);
  });

  it('refuses another site’s page (403), a GET (405), a big body (413), not JSON and not an act (400); answers the preflight', async () => {
    const other = await post({ a: 'pause' }, { ...bearer(KEY_A), Origin: 'https://other.example' });
    expect([other.status, other.headers.get('Access-Control-Allow-Origin')]).toEqual([403, null]);
    const get = await call('/gym/act', { headers: page() }, env());
    expect([get.status, get.headers.get('Allow')]).toEqual([405, 'POST']);
    const big = await post({ a: 'pause', pad: 'x'.repeat(3000) });
    expect([big.status, ((await big.json()) as { error: string }).error]).toEqual([413, 'too_large']);
    const lying = await post(JSON.stringify({ a: 'pause' }), { ...page(), 'Content-Length': '99999' });
    expect(lying.status).toBe(413);
    const garbled = await post('{', page());
    expect([garbled.status, ((await garbled.json()) as { error: string }).error]).toEqual([400, 'not_json']);
    const bad = await post({ a: 'any', d: 'tomorrow' });
    expect([bad.status, ((await bad.json()) as { error: string }).error]).toEqual([400, 'bad_action']);
    const passed = await post({ a: 'any', d: inDays(-1) });
    expect([passed.status, await passed.json()]).toEqual([422, { ok: false, error: 'day_passed', hint: expect.stringContaining('もう過ぎています') }]);
    expect(real.store.paused).toBe(false);
    const pre = await call('/gym/act', { method: 'OPTIONS', headers: { Origin: PAGES, 'Access-Control-Request-Method': 'POST' } }, env());
    expect(pre.status).toBe(204);
    expect(pre.headers.get('Access-Control-Allow-Methods')).toBe('POST');
    expect(pre.headers.get('Access-Control-Allow-Headers')).toBe('Authorization, Content-Type, X-Request-Id');
    const warned = vi.mocked(console.warn).mock.calls.map((c) => String(c[0]));
    expect(warned).toContain('act refused 413 too_large by=A rid=rid-1');
    expect(warned).toContainEqual(expect.stringMatching(/^act refused 405 method rid=w-[0-9a-f]{8}$/)); // (no id sent: one made up)
    expect(warned.some((l) => l.startsWith('act refused 403 origin origin="https://other.example" rid='))).toBe(true);
  });

  it('MODE off (the stop switch): a member’s act refused 503 mode_off, nothing changed; /gym/config still answers', async () => {
    const off = env({ MODE: 'off' });
    for (const body of [{ a: 'pause' }, { a: 'any', d: inDays(5) }, { a: 'check' }]) {
      const res = await post(body, page(), off);
      expect([res.status, res.headers.get('Access-Control-Allow-Origin'), await res.json()]).toEqual([503, PAGES, { ok: false, error: 'mode_off' }]);
    }
    expect(real.store.paused).toBe(false);
    expect(real.store.rule(inDays(5))).toBeUndefined();
    expect(vi.mocked(console.warn).mock.calls.map((c) => String(c[0]))).toContain('act refused 503 mode_off by=A rid=rid-1');
    expect((await post({ a: 'pause' }, page('nope'), off)).status).toBe(401); // the key first
    expect((await call('/gym/config', { headers: page() }, off)).status).toBe(200);
  });
});
