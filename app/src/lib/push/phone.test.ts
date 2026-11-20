// The phone's one subscription, two consumers (phone.ts): turning one off unsubscribes at its server only while the
// other is on; the last one off lets the browser's subscription go. Each keeps its own switch (DEVICE key).
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('#lib/sync/log.ts', () => ({ log: () => {} }));
const { configurePhone, pushClient } = await import('./phone.ts');

const VAPID = 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U';

function browser() {
  const store = new Map<string, string>();
  const kv = { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v), removeItem: (k: string) => void store.delete(k) };
  let sub: PushSubscription | null = null;
  const unsubscribe = vi.fn(async () => ((sub = null), true));
  const pushManager = {
    getSubscription: async () => sub,
    subscribe: vi.fn(async (o: PushSubscriptionOptionsInit) => (sub = {
      endpoint: 'https://web.push.apple.com/E1', options: { applicationServerKey: (o.applicationServerKey as Uint8Array).buffer },
      toJSON: () => ({ endpoint: 'https://web.push.apple.com/E1', keys: { p256dh: 'P', auth: 'A' } }), unsubscribe
    } as unknown as PushSubscription))
  };
  const Notification = { permission: 'granted' as NotificationPermission, requestPermission: async () => 'granted' as NotificationPermission };
  configurePhone({
    win: { Notification, PushManager: class {} }, nav: { serviceWorker: { ready: Promise.resolve({ pushManager: pushManager as never }) }, userAgent: 'Mozilla/5.0 (Macintosh)' },
    standalone: () => true, kv, now: () => 1_800_000_000_000
  });
  const server = () => {
    const calls: string[] = [];
    return { calls, post: () => async (route: string) => (calls.push(route), { ok: true }) };
  };
  const its = server(), todo = server();
  return { store, unsubscribe, pushManager, its, todo, a: pushClient('its', its.post, () => false), b: pushClient('todo', todo.post, () => false) };
}

let b: ReturnType<typeof browser>;
beforeEach(() => (b = browser()));

describe('one subscription, two switches', () => {
  it('both on share one subscription; ITS off keeps it for やること, then やること off lets it go', async () => {
    expect(await b.a.enable(VAPID, 'ja')).toBe('on');
    expect(await b.b.enable(VAPID, 'ja')).toBe('on');
    expect(b.pushManager.subscribe).toHaveBeenCalledTimes(1);
    expect([b.a.on(), b.b.on()]).toEqual([true, true]);
    await b.a.disable();
    expect(b.its.calls).toEqual(['subscribe', 'unsubscribe']);
    expect(b.unsubscribe).not.toHaveBeenCalled();
    expect([b.a.on(), b.b.on()]).toEqual([false, true]);
    await b.b.disable();
    expect(b.todo.calls).toEqual(['subscribe', 'unsubscribe']);
    expect(b.unsubscribe).toHaveBeenCalledTimes(1);
  });
  it('やること off first keeps ITS’s, its switch kept under its own key', async () => {
    await b.a.enable(VAPID, 'ja');
    await b.b.enable(VAPID, 'en');
    await b.b.disable();
    expect(b.unsubscribe).not.toHaveBeenCalled();
    expect(JSON.parse(b.store.get('island.itsPush')!)).toMatchObject({ on: true, lang: 'ja' });
    expect(JSON.parse(b.store.get('island.todoPush')!)).toEqual({ on: false });
  });
});
