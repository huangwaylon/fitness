// やること's reminders on this phone (push.svelte.ts): the relay's push state read and kept (who has a live
// subscription), the switch handing this phone's subscription to the relay with the key, its refusals read.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('#lib/sync/log.ts', () => ({ log: () => {} }));
vi.mock('#lib/sync/storage.ts', async (orig) => ({ ...(await orig<object>()), getKey: () => 'KEY_TEST' }));
const { configureTransport } = await import('#lib/sync/transport.ts');
const { configurePhone } = await import('#lib/push/phone.ts');
const { pushState, readPushState, todoPush } = await import('./push.svelte.ts');

const VAPID = 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U';
const STATUS = { vapidPublic: VAPID, on: false, subs: { A: true, B: false, G: false } };
type Call = { url: string; method: string; auth: string | null; body: unknown };
let calls: Call[] = [];
let reply: (path: string) => { status: number; body: unknown } = () => ({ status: 200, body: { ok: true, push: STATUS } });

beforeEach(() => {
  calls = [];
  pushState.status = null;
  configureTransport({ url: 'https://relay.test/api' });
  vi.stubGlobal('fetch', (async (u: string, init: RequestInit = {}) => {
      const path = new URL(u).pathname;
      calls.push({ url: path, method: init.method ?? 'GET', auth: new Headers(init.headers).get('Authorization'), body: init.body ? JSON.parse(String(init.body)) : null });
      const r = reply(path);
      return new Response(JSON.stringify(r.body), { status: r.status, headers: { 'Content-Type': 'application/json' } });
  }) as typeof fetch);
  const store = new Map<string, string>();
  let sub: PushSubscription | null = null;
  configurePhone({
    win: { Notification: { permission: 'granted', requestPermission: async () => 'granted' }, PushManager: class {} },
    nav: { userAgent: 'Mozilla/5.0 (Macintosh)', serviceWorker: { ready: Promise.resolve({ pushManager: {
      getSubscription: async () => sub,
      subscribe: async () => (sub = { endpoint: 'https://web.push.apple.com/X1', options: { applicationServerKey: null }, toJSON: () => ({ endpoint: 'https://web.push.apple.com/X1', keys: { p256dh: 'P', auth: 'A' } }), unsubscribe: async () => true } as unknown as PushSubscription)
    } as never }) } },
    standalone: () => true, kv: { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => void store.set(k, v), removeItem: (k) => void store.delete(k) }, now: () => 1_800_000_000_000
  });
});

afterEach(() => void vi.unstubAllGlobals());

describe('the relay’s push state', () => {
  it('POST /api/push with the key, kept: the key and who has a phone on', async () => {
    expect(await readPushState()).toEqual(STATUS);
    expect(calls).toEqual([{ url: '/api/push', method: 'POST', auth: 'Bearer KEY_TEST', body: {} }]);
    expect(pushState.status?.subs).toEqual({ A: true, B: false, G: false });
  });
  it('a relay without the route (404) or a bad reply: null, nothing kept', async () => {
    reply = () => ({ status: 404, body: { ok: false, error: 'not_found' } });
    expect(await readPushState()).toBeNull();
    reply = () => ({ status: 200, body: { ok: true, push: { vapidPublic: 3 } } });
    expect(await readPushState()).toBeNull();
    expect(pushState.status).toBeNull();
    reply = () => ({ status: 200, body: { ok: true, push: STATUS } });
  });
});

describe('the switch', () => {
  it('on: the subscription handed to /api/push/subscribe with the language; the answer’s presence kept', async () => {
    reply = (p) => ({ status: 200, body: { ok: true, push: { ...STATUS, on: p.endsWith('/subscribe'), subs: { A: true, B: true, G: false } } } });
    expect(await todoPush.enable(VAPID, 'ja')).toBe('on');
    expect(calls.at(-1)).toEqual({ url: '/api/push/subscribe', method: 'POST', auth: 'Bearer KEY_TEST', body: { endpoint: 'https://web.push.apple.com/X1', keys: { p256dh: 'P', auth: 'A' }, lang: 'ja' } });
    expect(todoPush.on()).toBe(true);
    expect(pushState.status?.subs.B).toBe(true);
    // テスト通知: 429 is wait
    reply = () => ({ status: 429, body: { ok: false, error: 'rate_limited' } });
    expect(await todoPush.test(VAPID, 'ja')).toBe('wait');
    reply = () => ({ status: 200, body: { ok: true, push: STATUS } });
    await todoPush.disable();
    expect(calls.at(-1)?.url).toBe('/api/push/unsubscribe');
    expect(todoPush.on()).toBe(false);
  });
  it('push off on the relay (503) is 準備中', async () => {
    reply = () => ({ status: 503, body: { ok: false, error: 'push_off' } });
    expect(await todoPush.enable(VAPID, 'en')).toBe('soon');
    expect(await todoPush.enable(null, 'en')).toBe('soon');
    expect(todoPush.on()).toBe(false);
  });
});
