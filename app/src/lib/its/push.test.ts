// 保養所's 通知, the phone's side (push.ts): where it can work (an iPhone's Safari tab, the Home Screen app, an
// unsupported browser, a refusal), the permission asked first and synchronously in the tap, the subscription for the
// Worker's key handed over and kept, a rotated key (unsubscribed, subscribed anew), the weekly refresh, a revoked
// permission, off (forgotten here first), テスト通知, and nothing ever throwing (failures logged without an endpoint).
import { readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import example from '../../../../its/contract-example.json';

const logged = vi.hoisted(() => [] as unknown[][]);
vi.mock('#lib/sync/log.ts', () => ({ log: (...a: unknown[]) => void logged.push(a) }));
const { RESYNC_MS, configurePush, disablePush, enablePush, pushOn, pushSupport, refreshPush, testPush } = await import('./push.ts');
import type { PushDeps } from './push.ts';
import type { PushReply } from './client.ts';

const VAPID = example.status.push.vapidPublic;
/** Another key (the pair rotated): the same bytes but the last. */
const ROTATED = VAPID.slice(0, -2) + (VAPID.endsWith('A8') ? 'B8' : 'A8');
const bytes = (b64: string) => Uint8Array.from(atob(b64.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (b64.length % 4)) % 4)), (c) => c.charCodeAt(0));
const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';
const MAC = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15';

/** A browser with a push manager, its permission and its one subscription, and the Worker's replies. */
function browser(o: { permission?: NotificationPermission; grant?: NotificationPermission; ua?: string; standalone?: boolean; noPush?: boolean; hideKey?: boolean; never?: boolean } = {}) {
  const store = new Map<string, string>();
  const kv = { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v), removeItem: (k: string) => void store.delete(k) };
  let n = 0;
  type Sub = PushSubscription & { key: string };
  let sub: Sub | null = null;
  const order: string[] = [];
  const make = (key: Uint8Array): Sub => {
    const endpoint = `https://web.push.apple.com/E${++n}`;
    const s = {
      endpoint, key: Array.from(key).join(),
      options: { applicationServerKey: o.hideKey ? null : key.buffer, userVisibleOnly: true },
      toJSON: () => ({ endpoint, keys: { p256dh: 'P' + n, auth: 'A' + n } }),
      unsubscribe: vi.fn(async () => (order.push('browser.unsubscribe'), (sub = null), true))
    } as unknown as Sub;
    return s;
  };
  const pushManager = {
    getSubscription: vi.fn(async () => sub),
    subscribe: vi.fn(async (opts: PushSubscriptionOptionsInit) => (order.push('subscribe'), (sub = make(opts.applicationServerKey as Uint8Array)))),
  };
  const Notification = {
    permission: o.permission ?? ('default' as NotificationPermission),
    requestPermission: vi.fn(async () => (order.push('permission'), (Notification.permission = o.grant ?? 'granted'))),
  };
  const replies: Partial<Record<string, PushReply>> = {};
  const post = vi.fn(async (route: string, body: unknown): Promise<PushReply> => {
    order.push(`post.${route}`);
    void body;
    return replies[route] ?? { ok: true, push: example.status.push as never };
  });
  const now = { t: 1_800_000_000_000 };
  const deps: Partial<PushDeps> = {
    win: o.noPush ? {} : { Notification, PushManager: class {} },
    nav: { serviceWorker: o.noPush ? undefined : { ready: o.never ? new Promise(() => {}) : Promise.resolve({ pushManager: pushManager as never }) }, userAgent: o.ua ?? MAC, maxTouchPoints: 0 },
    standalone: () => o.standalone ?? false,
    kv, now: () => now.t, post: post as never
  };
  configurePush(deps);
  return { kv, store, pushManager, Notification, post, replies, order, now, sub: () => sub, setSub: (s: Sub | null) => (sub = s), make };
}

beforeEach(() => void (logged.length = 0));
afterEach(() => configurePush(null));

describe('where it can work', () => {
  it('an iPhone’s Safari tab: add it to the Home Screen, whatever it exposes; the Home Screen app: ok', () => {
    browser({ ua: IPHONE });
    expect(pushSupport()).toBe('install');
    browser({ ua: IPHONE, noPush: true });
    expect(pushSupport()).toBe('install');
    browser({ ua: IPHONE, standalone: true });
    expect(pushSupport()).toBe('ok');
    // an iPad asking as a Mac (touch points), in a tab
    configurePush({ nav: { userAgent: MAC, maxTouchPoints: 5 }, standalone: () => false });
    expect(pushSupport()).toBe('install');
  });
  it('a browser without push: unsupported; notifications refused: denied', () => {
    browser({ noPush: true });
    expect(pushSupport()).toBe('unsupported');
    browser({ permission: 'denied' });
    expect(pushSupport()).toBe('denied');
    browser();
    expect(pushSupport()).toBe('ok');
  });
});

describe('turning it on', () => {
  it('asks the permission synchronously in the tap, before anything is awaited, then subscribes and hands it over', async () => {
    const b = browser();
    const p = enablePush(VAPID, 'ja');
    // nothing awaited yet: the prompt was asked inside the tap's own task
    expect(b.Notification.requestPermission).toHaveBeenCalledTimes(1);
    expect(b.pushManager.getSubscription).not.toHaveBeenCalled();
    expect(await p).toBe('on');
    expect(b.order).toEqual(['permission', 'subscribe', 'post.subscribe']);
    expect(b.pushManager.subscribe).toHaveBeenCalledWith({ userVisibleOnly: true, applicationServerKey: bytes(VAPID) });
    expect(b.post).toHaveBeenCalledWith('subscribe', { endpoint: 'https://web.push.apple.com/E1', keys: { p256dh: 'P1', auth: 'A1' }, lang: 'ja' });
    expect(pushOn()).toBe(true);
    expect(JSON.parse(b.store.get('island.itsPush')!)).toEqual({ on: true, endpoint: 'https://web.push.apple.com/E1', key: VAPID, lang: 'ja', at: b.now.t });
  });
  it('refused: denied, nothing subscribed; the Worker refusing it: failed, still off; a Worker without push: soon', async () => {
    let b = browser({ grant: 'denied' });
    expect(await enablePush(VAPID, 'ja')).toBe('denied');
    expect(b.pushManager.subscribe).not.toHaveBeenCalled();
    expect(pushOn()).toBe(false);
    b = browser();
    b.replies.subscribe = { ok: false, err: 'bad_push_keys', http: 400 };
    expect(await enablePush(VAPID, 'ja')).toBe('failed');
    expect(pushOn()).toBe(false);
    for (const r of [{ ok: false, err: 'http', http: 404 }, { ok: false, err: 'push_off', http: 503 }] as const) {
      b = browser();
      b.replies.subscribe = r;
      expect(await enablePush(VAPID, 'ja')).toBe('soon');
    }
    b = browser();
    expect(await enablePush(null, 'ja')).toBe('soon');
    expect(b.Notification.requestPermission).not.toHaveBeenCalled();
    // where it can't work, nothing is asked
    b = browser({ ua: IPHONE });
    expect(await enablePush(VAPID, 'ja')).toBe('install');
    expect(b.Notification.requestPermission).not.toHaveBeenCalled();
  });
  it('a subscription made for another key (rotated) is let go, at the Worker too, and made anew', async () => {
    const b = browser();
    b.setSub(b.make(bytes(ROTATED)));
    expect(await enablePush(VAPID, 'en')).toBe('on');
    expect(b.order).toEqual(['permission', 'browser.unsubscribe', 'post.unsubscribe', 'subscribe', 'post.subscribe']);
    expect(b.post).toHaveBeenCalledWith('unsubscribe', { endpoint: 'https://web.push.apple.com/E1' });
    expect(b.sub()!.endpoint).toBe('https://web.push.apple.com/E2');
  });
  it('never throws: a failing prompt, subscribe or a registration that never comes is `failed`, logged by step and name', async () => {
    let b = browser();
    b.Notification.requestPermission.mockImplementation(() => { throw new TypeError('no gesture'); });
    expect(await enablePush(VAPID, 'ja')).toBe('failed');
    b = browser();
    b.pushManager.subscribe.mockRejectedValue(new DOMException('denied', 'NotAllowedError'));
    expect(await enablePush(VAPID, 'ja')).toBe('failed');
    expect(logged.map(([e, d]) => [e, d])).toEqual([['its.push', { step: 'permission', err: 'TypeError' }], ['its.push', { step: 'subscribe', err: 'NotAllowedError' }]]);
    vi.useFakeTimers();
    try {
      browser({ never: true });
      const p = enablePush(VAPID, 'ja');
      await vi.advanceTimersByTimeAsync(10_000);
      expect(await p).toBe('failed');
    } finally {
      vi.useRealTimers();
    }
    expect(JSON.stringify(logged)).not.toContain('web.push.apple.com');
  });
});

describe('turning it off', () => {
  it('forgets it here first, then at the Worker and in the browser', async () => {
    const b = browser();
    await enablePush(VAPID, 'ja');
    b.order.length = 0;
    const p = disablePush();
    expect(pushOn()).toBe(false);   // at once, before anything answered
    await p;
    expect(b.order).toEqual(['post.unsubscribe', 'browser.unsubscribe']);
    expect(b.sub()).toBeNull();
  });
  it('never throws: the browser’s failure is logged; with no subscription left, the Worker is told the one it had', async () => {
    const b = browser();
    await enablePush(VAPID, 'ja');
    b.sub()!.unsubscribe = vi.fn(async () => { throw new Error('x'); });
    await expect(disablePush()).resolves.toBeUndefined();
    expect(logged).toEqual([['its.push', { step: 'unsubscribe', err: 'Error' }, 2]]);
    const c = browser();
    c.store.set('island.itsPush', JSON.stringify({ on: true, endpoint: 'https://web.push.apple.com/OLD', key: VAPID, lang: 'ja', at: 1 }));
    await disablePush();
    expect(c.post).toHaveBeenCalledWith('unsubscribe', { endpoint: 'https://web.push.apple.com/OLD' });
  });
});

describe('the refresh on opening 保養所', () => {
  it('nothing while nothing changed; a week on, a new endpoint or another language: handed over again', async () => {
    const b = browser();
    await enablePush(VAPID, 'ja');
    b.post.mockClear();
    expect(await refreshPush(VAPID, 'ja')).toBe(true);
    expect(b.post).not.toHaveBeenCalled();
    b.now.t += RESYNC_MS + 1;
    await refreshPush(VAPID, 'ja');
    expect(b.post).toHaveBeenCalledTimes(1);
    await refreshPush(VAPID, 'en');
    expect(b.post).toHaveBeenLastCalledWith('subscribe', expect.objectContaining({ lang: 'en' }));
    // the browser renewed it (a new endpoint)
    b.setSub(b.make(bytes(VAPID)));
    b.post.mockClear();
    await refreshPush(VAPID, 'en');
    expect(b.post).toHaveBeenCalledWith('subscribe', expect.objectContaining({ endpoint: b.sub()!.endpoint }));
  });
  it('a rotated key: unsubscribed and subscribed anew, the new key kept (also when the browser doesn’t say its key)', async () => {
    for (const hideKey of [false, true]) {
      const b = browser({ hideKey });
      await enablePush(VAPID, 'ja');
      b.order.length = 0;
      expect(await refreshPush(ROTATED, 'ja')).toBe(true);
      expect(b.order).toEqual(['browser.unsubscribe', 'post.unsubscribe', 'subscribe', 'post.subscribe']);
      expect(JSON.parse(b.store.get('island.itsPush')!).key).toBe(ROTATED);
    }
  });
  it('a revoked permission turns it off (the Worker told); off or a Worker without push: nothing', async () => {
    const b = browser();
    await enablePush(VAPID, 'ja');
    b.Notification.permission = 'denied';
    b.post.mockClear();
    expect(await refreshPush(VAPID, 'ja')).toBe(false);
    expect(pushOn()).toBe(false);
    expect(b.post).toHaveBeenCalledWith('unsubscribe', { endpoint: 'https://web.push.apple.com/E1' });
    b.post.mockClear();
    expect(await refreshPush(VAPID, 'ja')).toBe(false);
    const c = browser();
    await enablePush(VAPID, 'ja');
    c.post.mockClear();
    expect(await refreshPush(null, 'ja')).toBe(true);
    expect(c.post).not.toHaveBeenCalled();
    expect(b.post).not.toHaveBeenCalled();
  });
});

describe('a stale reply never undoes 通知 off', () => {
  /** The Worker's next subscribe answer held until released. */
  const held = (b: ReturnType<typeof browser>) => {
    let release!: () => void;
    const gate = new Promise<void>((r) => (release = r));
    b.post.mockImplementationOnce(async (route: string) => {
      b.order.push(`post.${route}`);
      await gate;
      return { ok: true, push: example.status.push as never };
    });
    return () => release();
  };
  const flush = () => new Promise((r) => setTimeout(r, 0));

  it('a refresh answered after the switch went off: not saved on, the Worker told to forget it', async () => {
    const b = browser();
    await enablePush(VAPID, 'ja');
    b.now.t += RESYNC_MS + 1;   // the weekly hand-over
    const release = held(b);
    const refreshing = refreshPush(VAPID, 'ja');
    await flush();
    expect(b.order.at(-1)).toBe('post.subscribe');
    await disablePush();
    expect(pushOn()).toBe(false);
    b.order.length = 0;
    release();
    expect(await refreshing).toBe(false);
    expect(pushOn()).toBe(false);
    expect(JSON.parse(b.store.get('island.itsPush')!)).toEqual({ on: false });
    expect(b.order).toEqual(['post.unsubscribe']);
    expect(b.post).toHaveBeenLastCalledWith('unsubscribe', { endpoint: 'https://web.push.apple.com/E1' });
  });

  it('turning on answered after an off: not on; the subscription made meanwhile let go here and at the Worker', async () => {
    const b = browser();
    const release = held(b);
    const enabling = enablePush(VAPID, 'ja');
    await flush();
    expect(b.order).toEqual(['permission', 'subscribe', 'post.subscribe']);
    await disablePush();
    b.order.length = 0;
    release();
    expect(await enabling).toBe('failed');
    expect(pushOn()).toBe(false);
    expect(b.order).toEqual(['post.unsubscribe']);
    expect(b.sub()).toBeNull();
  });

  it('a stale reply while a newer on is in flight: ignored (the newer one decides, nothing unsubscribed)', async () => {
    const b = browser();
    await enablePush(VAPID, 'ja');
    b.now.t += RESYNC_MS + 1;
    const release = held(b);
    const refreshing = refreshPush(VAPID, 'ja');
    await flush();
    await disablePush();
    const again = enablePush(VAPID, 'en');
    expect(await again).toBe('on');
    b.order.length = 0;
    release();
    expect(await refreshing).toBe(true);
    expect(b.order).toEqual([]);
    expect(JSON.parse(b.store.get('island.itsPush')!)).toMatchObject({ on: true, lang: 'en' });
  });
});

describe('テスト通知', () => {
  it('sent; the Worker’s rate: wait; a Worker that lost it: handed over again and asked once more', async () => {
    const b = browser();
    await enablePush(VAPID, 'ja');
    expect(await testPush(VAPID, 'ja')).toBe('sent');
    expect(b.post).toHaveBeenLastCalledWith('test', { endpoint: 'https://web.push.apple.com/E1' });
    b.replies.test = { ok: false, err: 'rate_limited', http: 429 };
    expect(await testPush(VAPID, 'ja')).toBe('wait');
    let lost = true;
    b.post.mockImplementation(async (route: string) => {
      b.order.push(`post.${route}`);
      if (route === 'test' && lost) return (lost = false), { ok: false, err: 'not_subscribed', http: 404 };
      return { ok: true, push: example.status.push as never };
    });
    b.order.length = 0;
    expect(await testPush(VAPID, 'ja')).toBe('sent');
    expect(b.order).toEqual(['post.test', 'post.subscribe', 'post.test']);
    // off: nothing sent
    await disablePush();
    b.post.mockClear();
    expect(await testPush(VAPID, 'ja')).toBe('failed');
    expect(b.post).not.toHaveBeenCalled();
  });
});

describe('nothing else asks or subscribes', () => {
  // the real guard behind e2e/no-notify.spec: push.ts (and this test) alone may prompt or subscribe, anywhere in src
  const SRC = join(import.meta.dirname, '../..');
  const ALLOWED = ['lib/its/push.ts', 'lib/its/push.test.ts'];
  const CALLS = /pushManager\s*\.\s*subscribe\b|Notification\s*\.\s*requestPermission\b|requestPermission\s*\(/;
  const files = (p: string): string[] =>
    readdirSync(p, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? files(join(p, e.name)) : /\.(ts|js|svelte)$/.test(e.name) ? [join(p, e.name)] : []));
  it('pushManager.subscribe, Notification.requestPermission and requestPermission( only in lib/its/push.ts', () => {
    const found = files(SRC).map((f) => relative(SRC, f)).filter((f) => !ALLOWED.includes(f) && CALLS.test(readFileSync(join(SRC, f), 'utf8')));
    expect(found).toEqual([]);
    expect(CALLS.test(readFileSync(join(SRC, 'lib/its/push.ts'), 'utf8'))).toBe(true);   // the pattern still sees push.ts's own
  });
});
