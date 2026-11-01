// Goal notifications on the phone (docs/backend.md#notifications): the つうち switch's permission and subscription
// flow, the launch-time refresh, and the once-a-day report of my all-four goals.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { RingFruit, WeekView } from '#lib/types.ts';
import { DEVICE, LIVE, type KV } from './storage.ts';
import { PUSH_PUBLIC_KEY, configurePush, disablePush, enablePush, goalDue, pushOn, pushSupport, pushTick, type PushDeps } from './push.ts';

class Mem implements KV {
  m = new Map<string, string>();
  getItem(k: string) { return this.m.get(k) ?? null; }
  setItem(k: string, v: string) { this.m.set(k, v); }
  removeItem(k: string) { this.m.delete(k); }
}

const KEY = 'ab'.repeat(16);
const URL_ = 'https://relay.test';
const FRUITS: RingFruit[] = ['pear', 'peach', 'cherry', 'apple'];

function view(o: { me?: 'A' | 'B'; mine?: number; theirs?: number; today?: string; locale?: 'ja' | 'en'; name?: string } = {}): WeekView {
  const me = o.me ?? 'B';
  const partner = me === 'A' ? 'B' : 'A';
  const person = (p: 'A' | 'B', met: number, name: string) => ({
    person: p,
    villagerName: name,
    rings: Object.fromEntries(FRUITS.map((f, i) => [f, { today: 0, goal: 1, met: i < met, stretched: false }]))
  });
  return {
    me,
    partner,
    locale: o.locale ?? 'ja',
    today: o.today ?? '2026-11-01',
    people: { [me]: person(me, o.mine ?? 4, o.name ?? 'うめ'), [partner]: person(partner, o.theirs ?? 0, 'ウェイ') }
  } as unknown as WeekView;
}

/** A fake PushSubscription / PushManager / service worker / Notification. */
class FakeBrowser {
  permission: NotificationPermission = 'default';
  answer: NotificationPermission = 'granted';
  asked = 0;
  sub: { endpoint: string; options: { applicationServerKey: ArrayBuffer | null }; toJSON(): object; unsubscribe(): Promise<boolean> } | null = null;
  subscribed: unknown[] = [];
  unsubscribed = 0;
  n = 0;
  make(key: ArrayBuffer | null) {
    const endpoint = `https://web.push.apple.com/Q${++this.n}`;
    return {
      endpoint,
      options: { applicationServerKey: key },
      toJSON: () => ({ endpoint, expirationTime: null, keys: { p256dh: 'p'.repeat(87), auth: 'a'.repeat(22) } }),
      unsubscribe: async () => {
        this.unsubscribed++;
        this.sub = null;
        return true;
      }
    };
  }
  deps(): Pick<PushDeps, 'win' | 'nav'> {
    const pushManager = {
      getSubscription: async () => this.sub,
      subscribe: async (o: { applicationServerKey: Uint8Array }) => {
        this.subscribed.push(o);
        this.sub = this.make(o.applicationServerKey.buffer as ArrayBuffer);
        return this.sub;
      }
    } as unknown as PushManager;
    return {
      win: {
        PushManager: {},
        Notification: {
          get permission() { return b.permission; },
          requestPermission: async () => {
            b.asked++;
            b.permission = b.answer;
            return b.answer;
          }
        }
      },
      nav: { serviceWorker: { ready: Promise.resolve({ pushManager }) }, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)' }
    };
  }
}

let b: FakeBrowser;
let kv: Mem;
let now: number;
let calls: { path: string; body: Record<string, unknown> }[];
let reply: (path: string) => { status: number; body?: object } | 'offline';
let key: string | null;

const fetchFake = (async (input: string, init: RequestInit) => {
  const path = input.slice(URL_.length);
  calls.push({ path, body: JSON.parse(String(init.body)) });
  const r = reply(path);
  if (r === 'offline') throw new TypeError('Failed to fetch');
  return new Response(r.body ? JSON.stringify(r.body) : null, { status: r.status });
}) as unknown as typeof fetch;

function setup(o: Partial<PushDeps> = {}) {
  configurePush({ ...b.deps(), standalone: () => true, fetch: fetchFake, kv, key: () => key, url: URL_, now: () => now, ...o });
}

const flush = () => new Promise((r) => setTimeout(r, 0));

beforeEach(() => {
  b = new FakeBrowser();
  kv = new Mem();
  now = Date.UTC(2026, 10, 1, 6);
  calls = [];
  key = KEY;
  reply = (p) => ({ status: 200, body: p === '/push/goal' ? { ok: true, outcome: 'sent', sent: 1 } : { ok: true } });
  setup();
});

afterEach(() => configurePush(null));

describe('support', () => {
  it('is usable with a service worker, PushManager, Notification, the relay and a key', () => {
    expect(pushSupport()).toBe('ok');
  });

  it("an iPhone's Safari tab (no PushManager there) is told to add the app to the Home Screen; elsewhere unsupported", () => {
    const { nav } = b.deps();
    setup({ win: {}, nav, standalone: () => false });
    expect(pushSupport()).toBe('install');
    setup({ win: {}, nav: { ...nav, userAgent: 'Mozilla/5.0 (Macintosh)' }, standalone: () => false });
    expect(pushSupport()).toBe('unsupported');
    setup({ win: {}, nav, standalone: () => true });
    expect(pushSupport()).toBe('unsupported'); // installed but too old an iOS
  });

  it('without a key (the demo) or a relay it does nothing', () => {
    key = null;
    expect(pushSupport()).toBe('unpaired');
    setup({ url: '' });
    expect(pushSupport()).toBe('unsupported');
  });

  it('notifications blocked in the settings: denied', () => {
    b.permission = 'denied';
    expect(pushSupport()).toBe('denied');
  });
});

describe('the つうち switch', () => {
  it('is off by default', () => {
    expect(pushOn()).toBe(false);
  });

  it('on: asks permission, subscribes with the VAPID key, hands the subscription to the relay, and remembers', async () => {
    expect(await enablePush('ja')).toBe('on');
    expect(b.asked).toBe(1);
    expect(b.subscribed).toHaveLength(1);
    const k = (b.subscribed[0] as { applicationServerKey: Uint8Array; userVisibleOnly: boolean });
    expect(k.userVisibleOnly).toBe(true);
    expect(btoa(String.fromCharCode(...k.applicationServerKey)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')).toBe(PUSH_PUBLIC_KEY);
    expect(calls).toEqual([{ path: '/push/subscribe', body: { key: KEY, lang: 'ja', sub: expect.objectContaining({ endpoint: 'https://web.push.apple.com/Q1' }) } }]);
    expect(pushOn()).toBe(true);
    expect(JSON.parse(kv.getItem(DEVICE.push)!)).toEqual({ on: true, endpoint: 'https://web.push.apple.com/Q1', lang: 'ja', at: now });
  });

  it('permission refused: stays off, nothing subscribed or sent', async () => {
    b.answer = 'denied';
    expect(await enablePush('ja')).toBe('denied');
    expect(b.subscribed).toEqual([]);
    expect(calls).toEqual([]);
    expect(pushOn()).toBe(false);
  });

  it('the relay unreachable: failed, stays off', async () => {
    reply = () => 'offline';
    expect(await enablePush('ja')).toBe('failed');
    expect(pushOn()).toBe(false);
  });

  it('an iPhone Safari tab: no prompt at all', async () => {
    setup({ win: {}, standalone: () => false });
    expect(await enablePush('ja')).toBe('install');
    expect(b.asked).toBe(0);
  });

  it("replaces a subscription made for another VAPID key (a rotation)", async () => {
    b.sub = b.make(new Uint8Array(65).buffer);
    expect(await enablePush('en')).toBe('on');
    expect(b.unsubscribed).toBe(1);
    expect(b.subscribed).toHaveLength(1);
    expect(calls[0].body.lang).toBe('en');
  });

  it('off: forgets it at once, tells the relay and unsubscribes the browser', async () => {
    await enablePush('ja');
    calls = [];
    await disablePush();
    expect(pushOn()).toBe(false);
    expect(calls).toEqual([{ path: '/push/unsubscribe', body: { key: KEY, endpoint: 'https://web.push.apple.com/Q1' } }]);
    expect(b.unsubscribed).toBe(1);
  });
});

describe('at launch', () => {
  it('a phone that is on hands a renewed subscription over again, once a session', async () => {
    await enablePush('ja');
    b.sub = null; // the browser dropped it
    calls = [];
    configurePush({ ...b.deps(), standalone: () => true, fetch: fetchFake, kv, key: () => key, url: URL_, now: () => now });
    pushTick(view({ mine: 0 }));
    await flush();
    await flush();
    expect(calls.map((c) => c.path)).toEqual(['/push/subscribe']);
    pushTick(view({ mine: 0 }));
    await flush();
    expect(calls).toHaveLength(1);
  });

  it('nothing changed: no request; a language change or a week later: handed over again', async () => {
    await enablePush('ja');
    calls = [];
    setup();
    pushTick(view({ mine: 0 }));
    await flush();
    expect(calls).toEqual([]);
    pushTick(view({ mine: 0, locale: 'en' }));
    await flush();
    await flush();
    expect(calls.map((c) => c.body.lang)).toEqual(['en']);
    setup();
    now += 8 * 86_400_000;
    pushTick(view({ mine: 0, locale: 'en' }));
    await flush();
    await flush();
    expect(calls).toHaveLength(2);
  });

  it('permission revoked in the settings: the switch turns off', async () => {
    await enablePush('ja');
    b.permission = 'denied';
    setup();
    pushTick(view({ mine: 0 }));
    await flush();
    expect(pushOn()).toBe(false);
  });

  it('off: never subscribes', async () => {
    pushTick(view({ mine: 0 }));
    await flush();
    expect(b.subscribed).toEqual([]);
    expect(calls).toEqual([]);
  });
});

describe('my all-four goals', () => {
  it('is due once all four of mine are met and not yet reported today', () => {
    expect(goalDue(view({ mine: 3 }), null)).toBeNull();
    expect(goalDue(view({ mine: 4 }), null)).toEqual({ date: '2026-11-01', both: false, name: 'うめ' });
    expect(goalDue(view({ mine: 4, theirs: 4 }), null)?.both).toBe(true);
    expect(goalDue(view({ mine: 4 }), { me: 'B', date: '2026-11-01' })).toBeNull();
    expect(goalDue(view({ mine: 4 }), { me: 'B', date: '2026-10-31' })).not.toBeNull();
    expect(goalDue(view({ mine: 4 }), { me: 'A', date: '2026-11-01' })).not.toBeNull(); // paired as the other person since
    expect(goalDue(view({ mine: 4, name: 'あ'.repeat(25) }), null)?.name).toHaveLength(20);
  });

  it('is reported to the relay once a day, whatever my switch says', async () => {
    pushTick(view({ mine: 4, theirs: 4 }));
    await flush();
    expect(calls).toEqual([{ path: '/push/goal', body: { key: KEY, date: '2026-11-01', both: true, name: 'うめ' } }]);
    expect(JSON.parse(kv.getItem(LIVE.goalSent)!)).toEqual({ me: 'B', date: '2026-11-01' });
    now += 3600_000;
    pushTick(view({ mine: 4, theirs: 4 }));
    await flush();
    expect(calls).toHaveLength(1);
    now += 86_400_000;
    pushTick(view({ mine: 4, today: '2026-11-02' }));
    await flush();
    expect(calls).toHaveLength(2);
  });

  it('a recompute while the report is in flight sends nothing more', async () => {
    pushTick(view());
    pushTick(view());
    pushTick(view());
    await flush();
    expect(calls).toHaveLength(1);
  });

  it('quiet hours, nobody subscribed, a stale date or a refusal: done for the day', async () => {
    for (const outcome of ['quiet', 'none', 'stale', 'dup']) {
      kv.removeItem(LIVE.goalSent);
      setup();
      reply = () => ({ status: 200, body: { ok: true, outcome, sent: 0 } });
      pushTick(view());
      await flush();
      expect(kv.getItem(LIVE.goalSent)).not.toBeNull();
    }
    kv.removeItem(LIVE.goalSent);
    setup();
    reply = () => ({ status: 401, body: { ok: false, error: 'unauthorized' } });
    pushTick(view());
    await flush();
    expect(kv.getItem(LIVE.goalSent)).not.toBeNull();
  });

  it("not through (offline, the push services failing): tried again 10 minutes later, not sooner", async () => {
    reply = () => 'offline';
    pushTick(view());
    await flush();
    expect(kv.getItem(LIVE.goalSent)).toBeNull();
    now += 5 * 60_000;
    pushTick(view());
    await flush();
    expect(calls).toHaveLength(1);
    reply = () => ({ status: 200, body: { ok: true, outcome: 'failed', sent: 0 } });
    now += 6 * 60_000;
    pushTick(view());
    await flush();
    expect(calls).toHaveLength(2);
    expect(kv.getItem(LIVE.goalSent)).toBeNull();
    reply = () => ({ status: 200, body: { ok: true, outcome: 'sent', sent: 1 } });
    now += 11 * 60_000;
    pushTick(view());
    await flush();
    expect(calls).toHaveLength(3);
    expect(kv.getItem(LIVE.goalSent)).not.toBeNull();
  });

  it('nothing without a key or a relay', async () => {
    key = null;
    pushTick(view());
    setup({ url: '' });
    pushTick(view());
    await flush();
    expect(calls).toEqual([]);
  });

  it('never throws into the store', () => {
    reply = () => {
      throw new Error('boom');
    };
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(() => pushTick(view())).not.toThrow();
  });
});
