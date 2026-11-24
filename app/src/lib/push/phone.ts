// This phone's one Web Push subscription, shared by its consumers (docs/todo.md "Reminders"; its/README.md "Push"):
// 保養所's 通知 (lib/its/push.ts: the its-bot Worker) and やること's reminders (components/todo/push.ts: the relay). iOS
// gives a service worker registration one subscription for one applicationServerKey, so both servers sign with the same
// VAPID pair and are handed the same endpoint. Each consumer has its own switch (off by default, per phone: its DEVICE
// key) and its own server, which pushClient() wires up; the browser's subscription is let go only when the last consumer
// that is on turns off (ITS off keeps やること's reminders, and the other way round).
// A client's switch, on (a tap): the notification permission asked first, in the tap (iOS grants the prompt only to a
// user gesture: nothing is awaited before it), then the subscription for the server's VAPID key (read from it, never
// built in) handed to its subscribe route; on only once the server took it. Off: forgotten here first (nothing later
// re-subscribes), then unsubscribed at the server and, if no other consumer is on, in the browser; a subscribe answered
// after an off (a refresh or an on still in flight) is not saved and is unsubscribed again. Refresh (opening the page):
// a phone that is on hands its subscription over again when the endpoint, the key (a rotated pair: unsubscribed and
// subscribed anew) or the language changed, or a week went by (servers drop one not refreshed), and turns off when the
// permission was revoked. Hiking's notification is local (noteSupport, askNote: the permission alone). Where it can't work, why (pushSupport): an iPhone's Safari tab (Web Push needs the Home Screen
// app), an unsupported browser, notifications refused. Nothing here throws; a failure is logged (the consumer's event:
// a step and the error's name, never an endpoint or a key). Plain TS: the browser is injectable for tests.
import { DEVICE, localKV, readJson, writeJson, type KV } from '#lib/sync/storage.ts';
import { log } from '#lib/sync/log.ts';

/** Handed to the server again after this long even when nothing changed. */
export const RESYNC_MS = 7 * 86_400_000;
/** The service worker's registration waited for this long at most. */
const READY_MS = 10_000;

/** The subscription's users, each with its switch's DEVICE key. */
export type PushConsumer = 'its' | 'todo';
const PREF_KEY: Record<PushConsumer, string> = { its: DEVICE.itsPush, todo: DEVICE.todoPush };
/** Each consumer's failure line (contract/log.ts). */
const LOG = { its: 'its.push', todo: 'todo.phone' } as const;

/** A switch: on, and what the server was last given (`key`: the VAPID key subscribed with). */
interface PushPref {
  on: boolean;
  endpoint?: string;
  key?: string;
  lang?: string;
  /** When the server last took it, ms. */
  at?: number;
}

/** Where a switch stands: usable, or why not (`install`: an iPhone's Safari tab, it works from the Home Screen app;
 *  `denied`: notifications refused for the app in the phone's settings). */
export type PushSupport = 'ok' | 'install' | 'unsupported' | 'denied';

interface NotificationLike { permission: NotificationPermission; requestPermission(): Promise<NotificationPermission> }
interface RegistrationLike { pushManager: Pick<PushManager, 'getSubscription' | 'subscribe'> }

/** The browser, injectable for tests. */
export interface PhoneDeps {
  win: { Notification?: NotificationLike; PushManager?: unknown };
  nav: { serviceWorker?: { ready: Promise<RegistrationLike> }; userAgent: string; maxTouchPoints?: number };
  standalone(): boolean;
  kv: KV | null;
  now(): number;
}

function browserDeps(): PhoneDeps {
  return {
    win: typeof window !== 'undefined' ? (window as unknown as PhoneDeps['win']) : {},
    nav: typeof navigator !== 'undefined' ? (navigator as unknown as PhoneDeps['nav']) : { userAgent: '' },
    standalone: () =>
      typeof matchMedia !== 'undefined' && (matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true),
    kv: localKV(),
    now: () => Date.now()
  };
}

let deps: PhoneDeps | null = null;
const d = (): PhoneDeps => (deps ??= browserDeps());

/** Tests: swap the browser (null: the real one again). */
export function configurePhone(o: Partial<PhoneDeps> | null): void {
  deps = o ? { ...browserDeps(), ...o } : null;
}

const prefOf = (c: PushConsumer): PushPref => {
  const p = readJson<PushPref>(d().kv, PREF_KEY[c]);
  return p && typeof p === 'object' && typeof p.on === 'boolean' ? p : { on: false };
};
const savePref = (c: PushConsumer, p: PushPref) => void writeJson(d().kv, PREF_KEY[c], p);
/** Another consumer still on (the browser's subscription is theirs too). */
const othersOn = (c: PushConsumer): boolean => (Object.keys(PREF_KEY) as PushConsumer[]).some((o) => o !== c && prefOf(o).on);

const isIOS = (n: PhoneDeps['nav']) => /iPhone|iPad|iPod/.test(n.userAgent) || (/Macintosh/.test(n.userAgent) && (n.maxTouchPoints ?? 0) > 1);

export function pushSupport(): PushSupport {
  const { win, nav, standalone } = d();
  // an iPhone's Safari tab can't subscribe (Web Push is the Home Screen app's, iOS 16.4+), whatever it exposes
  if (isIOS(nav) && !standalone()) return 'install';
  if (!nav.serviceWorker || !win.PushManager || !win.Notification) return 'unsupported';
  return win.Notification.permission === 'denied' ? 'denied' : 'ok';
}

/** A local notification (hiking's hike under way, docs/hiking.md "In-hike map": shown by the page through the service
 *  worker's registration, no subscription, no server): usable, or why not; push needs nothing of it. */
export function noteSupport(): PushSupport {
  const { win, nav, standalone } = d();
  if (isIOS(nav) && !standalone()) return 'install';
  if (!nav.serviceWorker || !win.Notification) return 'unsupported';
  return win.Notification.permission === 'denied' ? 'denied' : 'ok';
}

/** The permission for a local notification: as answered, or asked now when it never was (call it straight from the
 *  tap: the prompt is started synchronously, nothing awaited before it). Never throws (a refused prompt: 'default'). */
export function askNote(): Promise<NotificationPermission> {
  const N = d().win.Notification;
  if (!N) return Promise.resolve('denied');
  if (N.permission !== 'default') return Promise.resolve(N.permission);
  try {
    return Promise.resolve(N.requestPermission()).catch(() => 'default' as const);
  } catch {
    return Promise.resolve('default');
  }
}

function keyBytes(b64: string): Uint8Array<ArrayBuffer> {
  const bin = atob(b64.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (b64.length % 4)) % 4));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

/** The subscription's key is this one (unknown, when the browser doesn't say: the stored pref decides). */
function sameKey(sub: PushSubscription, key: Uint8Array): boolean | null {
  const a = sub.options?.applicationServerKey;
  if (!a) return null;
  const x = new Uint8Array(a);
  return x.length === key.length && x.every((v, i) => v === key[i]);
}

/** The service worker's registration (null: none within READY_MS). */
async function registration(): Promise<RegistrationLike | null> {
  const sw = d().nav.serviceWorker;
  if (!sw) return null;
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([sw.ready, new Promise<null>((r) => (timer = setTimeout(r, READY_MS, null)))]);
  } finally {
    clearTimeout(timer);
  }
}

/** A server's answer, as a consumer's call sorts it. */
export interface PushAnswer { ok: boolean; http?: number | null; err?: string }
type Route = 'subscribe' | 'unsubscribe' | 'test';
type Body = { endpoint: string; keys?: { p256dh: string; auth: string }; lang?: string };

export type EnableResult = 'on' | 'failed' | 'soon' | Exclude<PushSupport, 'ok'>;
export type TestResult = 'sent' | 'wait' | 'failed' | 'soon';

/** A consumer's switch over the shared subscription. `post`: its server's routes (read at each call: tests swap it);
 *  `notReady`: an answer meaning the server has no push yet (準備中). */
export function pushClient<L extends string>(c: PushConsumer, post: () => (route: Route, body: Body) => Promise<PushAnswer>, notReady: (r: PushAnswer) => boolean) {
  const pref = () => prefOf(c);
  const save = (p: PushPref) => savePref(c, p);
  const fail = (step: 'permission' | 'ready' | 'subscribe' | 'unsubscribe', e: unknown): void => log(LOG[c], { step, err: e instanceof Error ? e.name : typeof e }, 2);

  /** This phone's subscription for `vapid`: the one it has, else a new one (one for another key, a rotated pair, let go
   *  first). The permission must be granted. */
  async function subscription(vapid: string, p: PushPref): Promise<PushSubscription | null> {
    const reg = await registration();
    if (!reg) {
      fail('ready', new Error('Timeout'));
      return null;
    }
    const key = keyBytes(vapid);
    let sub = await reg.pushManager.getSubscription();
    if (sub && (sameKey(sub, key) ?? p.key === vapid) === false) {
      const old = sub.endpoint;
      await sub.unsubscribe().catch((e: unknown) => fail('unsubscribe', e));
      void post()('unsubscribe', { endpoint: old });
      sub = null;
    }
    return sub ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key }));
  }

  /** The switch's turns (on or off), counted: a reply to a call made before the latest turn is stale. */
  let turns = 0;
  let last: 'on' | 'off' | null = null;
  const turn = (to: 'on' | 'off'): number => ((last = to), ++turns);

  /** The browser's subscription let go, unless another consumer is still on (or it is no longer `endpoint`). */
  async function release(sub: PushSubscription | null, endpoint?: string): Promise<void> {
    if (sub && (!endpoint || sub.endpoint === endpoint) && !othersOn(c)) await sub.unsubscribe();
  }

  /** The server's copy: handed over; the pref kept on success, if the switch wasn't turned since `seen`. A stale reply
   *  is ignored; when the latest turn was off, the server (and the browser) let go of it again. */
  async function register(sub: PushSubscription, vapid: string, lang: L, seen: number): Promise<PushAnswer & { stale?: true }> {
    const j = sub.toJSON();
    const keys = { p256dh: j.keys?.p256dh ?? '', auth: j.keys?.auth ?? '' };
    const r = await post()('subscribe', { endpoint: sub.endpoint, keys, lang });
    if (seen !== turns) {
      if (r.ok && last === 'off') await forget(sub.endpoint);
      return { ...r, stale: true };
    }
    if (r.ok) save({ on: true, endpoint: sub.endpoint, key: vapid, lang, at: d().now() });
    return r;
  }

  /** A stale subscribe after an off: unsubscribed at the server, and in the browser if it is still this one. */
  async function forget(endpoint: string): Promise<void> {
    try {
      await post()('unsubscribe', { endpoint });
      const reg = await registration();
      if (last === 'off') await release(reg ? await reg.pushManager.getSubscription() : null, endpoint);
    } catch (e) {
      fail('unsubscribe', e);
    }
  }

  const api = {
    /** The switch as stored (on only once the server took the subscription). */
    on: (): boolean => pref().on,
    /** The endpoint the server was last handed while on (undefined: off). */
    endpoint: (): string | undefined => (pref().on ? pref().endpoint : undefined),

    /** The switch turned on. Call it straight from the tap: the permission is asked synchronously, before anything is
     *  awaited. `vapid`: the server's key (null: push is off there). */
    async enable(vapid: string | null, lang: L): Promise<EnableResult> {
      const support = pushSupport();
      if (support !== 'ok' && support !== 'denied') return support;
      if (!vapid) return 'soon';
      const seen = turn('on');
      let asked: Promise<NotificationPermission>;
      try {
        asked = Promise.resolve(d().win.Notification!.requestPermission());
      } catch (e) {
        fail('permission', e);
        return 'failed';
      }
      try {
        if ((await asked) !== 'granted') return 'denied';
        const sub = await subscription(vapid, pref());
        if (!sub) return 'failed';
        const r = await register(sub, vapid, lang, seen);
        if (r.stale) return pref().on ? 'on' : 'failed';
        return r.ok ? 'on' : notReady(r) ? 'soon' : 'failed';
      } catch (e) {
        fail('subscribe', e);
        return 'failed';
      }
    },

    /** The switch turned off: forgotten here first (so nothing re-subscribes), then at the server and, if no other
     *  consumer is on, in the browser. */
    async disable(): Promise<void> {
      const was = pref();
      turn('off');
      save({ on: false });
      try {
        const reg = await registration();
        const sub = reg ? await reg.pushManager.getSubscription() : null;
        const endpoint = sub?.endpoint ?? was.endpoint;
        if (endpoint) await post()('unsubscribe', { endpoint });
        await release(sub);
      } catch (e) {
        fail('unsubscribe', e);
      }
    },

    /** Opening the page with the server's key read: a phone that is on keeps the server's copy fresh; a revoked
     *  permission turns it off (the server told too). `force`: hand it over whatever. True while it stays on. */
    async refresh(vapid: string | null, lang: L, force = false): Promise<boolean> {
      const p = pref();
      if (!p.on) return false;
      const support = pushSupport();
      if (support === 'install' || support === 'unsupported') return true;   // (another browser's pref: nothing to do here)
      if (d().win.Notification!.permission !== 'granted') {
        save({ on: false });
        if (p.endpoint) void post()('unsubscribe', { endpoint: p.endpoint });
        return false;
      }
      if (!vapid) return true;   // push off at the server: kept, handed over once it's back
      const seen = turns;
      try {
        const sub = await subscription(vapid, p);
        if (!sub) return pref().on;
        if (force || sub.endpoint !== p.endpoint || p.key !== vapid || p.lang !== lang || d().now() - (p.at ?? 0) > RESYNC_MS) await register(sub, vapid, lang, seen);
      } catch (e) {
        fail('subscribe', e);
      }
      return pref().on;
    },

    /** テスト通知: one push to this phone (the server's rate: 429 → `wait`). A server that lost this phone's
     *  subscription (404 not_subscribed) is handed it again, and asked once more. */
    async test(vapid: string | null, lang: L): Promise<TestResult> {
      const p = pref();
      if (!p.on || !p.endpoint) return 'failed';
      let r = await post()('test', { endpoint: p.endpoint });
      if (!r.ok && r.err === 'not_subscribed' && (await api.refresh(vapid, lang, true))) r = await post()('test', { endpoint: pref().endpoint ?? p.endpoint });
      return r.ok ? 'sent' : r.http === 429 ? 'wait' : notReady(r) ? 'soon' : 'failed';
    }
  };
  return api;
}
