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
