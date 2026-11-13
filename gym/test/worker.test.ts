// The Worker (src/index.ts): which path reaches the bot and what is refused before it (the LINE signature, the token),
// and MODE's dispatch. The bot is a stub that records its calls.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('cloudflare:workers', () => ({ DurableObject: class {} }));

import worker from '../src/index.ts';
import type { Env } from '../src/env.ts';
import { GROUP } from './fakeBot.ts';

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
    expect(logged().join('\n')).not.toContain(KEY_A.slice(0, 8));
  });

  it('refuses another site’s page (403), even with a member’s key', async () => {
    const res = await get({ ...bearer(KEY_A), Origin: 'https://evil.example' });
    expect(res.status).toBe(403);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBeNull();
    expect(calls['BOT.getConfig']).toBeUndefined();
    expect(logged()).toEqual(['config refused 403 origin origin="https://evil.example"']);
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
