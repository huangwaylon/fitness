// ボット → 保養所's 通知 (docs/design.md "Bots"; its/README.md "Push"), the phone's side: this phone's switch (off by
// default, kept per phone: DEVICE.itsPush) and its Web Push subscription, which the its-bot Worker pushes to on a 仮押さえ
// and a 予約確定. On (a tap): the notification permission asked first, in the tap (iOS grants the prompt only to a user
// gesture: nothing is awaited before it), then a subscription for the Worker's VAPID key (ItsPushStatus.vapidPublic,
// read from its status: never built in) handed to POST /its/push/subscribe; the switch shows on only once the Worker
// took it. Off: forgotten here first (nothing later re-subscribes), then unsubscribed at the Worker and in the browser.
// Opening 保養所 (refreshPush): a phone that is on hands its subscription over again when the endpoint, the key (a
// rotated pair: unsubscribed and subscribed anew) or the language changed, or a week went by (the Worker drops one not
// refreshed in PUSH_KEEP_DAYS), and turns off when the permission was revoked. Where it can't work, why (pushSupport):
// an iPhone's Safari tab (Web Push needs the Home Screen app), an unsupported browser, notifications refused. Nothing
// here throws; a failure is logged (`its.push` / the client's `its.fail`: a step and a code, never an endpoint or a key).
// Plain TS: the browser objects and the Worker's calls are injectable for tests.
import type { PushEndpointInput, PushLang, PushSubscribeInput } from './contract.ts';
import { pushCall, type PushReply } from './client.ts';
import { DEVICE, localKV, readJson, writeJson, type KV } from '#lib/sync/storage.ts';
import { log } from '#lib/sync/log.ts';

/** Handed to the Worker again after this long even when nothing changed. */
export const RESYNC_MS = 7 * 86_400_000;
/** The service worker's registration waited for this long at most. */
const READY_MS = 10_000;

/** This phone's switch: on, and what the Worker was last given (`key`: the VAPID key subscribed with). */
interface PushPref {
  on: boolean;
  endpoint?: string;
  key?: string;
  lang?: PushLang;
  /** When the Worker last took it, ms. */
  at?: number;
}

/** Where the switch stands: usable, or why not (`install`: an iPhone's Safari tab, it works from the Home Screen app;
 *  `denied`: notifications refused for the app in the phone's settings). */
export type PushSupport = 'ok' | 'install' | 'unsupported' | 'denied';

type Route = 'subscribe' | 'unsubscribe' | 'test';
interface NotificationLike { permission: NotificationPermission; requestPermission(): Promise<NotificationPermission> }
interface RegistrationLike { pushManager: Pick<PushManager, 'getSubscription' | 'subscribe'> }

/** The browser and the Worker, injectable for tests. */
export interface PushDeps {
  win: { Notification?: NotificationLike; PushManager?: unknown };
  nav: { serviceWorker?: { ready: Promise<RegistrationLike> }; userAgent: string; maxTouchPoints?: number };
  standalone(): boolean;
  kv: KV | null;
  now(): number;
  post(route: Route, body: PushSubscribeInput | PushEndpointInput): Promise<PushReply>;
}

function browserDeps(): PushDeps {
  return {
    win: typeof window !== 'undefined' ? (window as unknown as PushDeps['win']) : {},
    nav: typeof navigator !== 'undefined' ? (navigator as unknown as PushDeps['nav']) : { userAgent: '' },
    standalone: () =>
      typeof matchMedia !== 'undefined' && (matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true),
    kv: localKV(),
    now: () => Date.now(),
    post: (route, body) => pushCall(route, body)
  };
}

let deps: PushDeps | null = null;
const d = (): PushDeps => (deps ??= browserDeps());

/** Tests: swap the browser (null: the real one again). */
export function configurePush(o: Partial<PushDeps> | null): void {
  deps = o ? { ...browserDeps(), ...o } : null;
}

const pref = (): PushPref => {
  const p = readJson<PushPref>(d().kv, DEVICE.itsPush);
  return p && typeof p === 'object' && typeof p.on === 'boolean' ? p : { on: false };
};
const savePref = (p: PushPref) => void writeJson(d().kv, DEVICE.itsPush, p);

/** The switch as stored (on only once the Worker took the subscription). */
export const pushOn = (): boolean => pref().on;

const isIOS = (n: PushDeps['nav']) => /iPhone|iPad|iPod/.test(n.userAgent) || (/Macintosh/.test(n.userAgent) && (n.maxTouchPoints ?? 0) > 1);

export function pushSupport(): PushSupport {
  const { win, nav, standalone } = d();
  // an iPhone's Safari tab can't subscribe (Web Push is the Home Screen app's, iOS 16.4+), whatever it exposes
  if (isIOS(nav) && !standalone()) return 'install';
  if (!nav.serviceWorker || !win.PushManager || !win.Notification) return 'unsupported';
  return win.Notification.permission === 'denied' ? 'denied' : 'ok';
}

/** A failure in the browser, logged by step and the error's name (never its message: it may carry the endpoint). */
function fail(step: 'permission' | 'ready' | 'subscribe' | 'unsubscribe', e: unknown): void {
  log('its.push', { step, err: e instanceof Error ? e.name : typeof e }, 2);
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
    void d().post('unsubscribe', { endpoint: old });
    sub = null;
  }
  return sub ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key }));
}

/** The Worker's copy: handed over; the pref kept on success. */
async function register(sub: PushSubscription, vapid: string, lang: PushLang): Promise<PushReply> {
  const j = sub.toJSON();
  const keys = { p256dh: j.keys?.p256dh ?? '', auth: j.keys?.auth ?? '' };
  const r = await d().post('subscribe', { endpoint: sub.endpoint, keys, lang });
  if (r.ok) savePref({ on: true, endpoint: sub.endpoint, key: vapid, lang, at: d().now() });
  return r;
}

/** The Worker isn't ready for push (no routes yet, or no VAPID key): 準備中. */
const notReady = (r: PushReply) => !r.ok && (r.http === 404 && r.err !== 'not_subscribed' || r.err === 'push_off');

export type EnableResult = 'on' | 'failed' | 'soon' | Exclude<PushSupport, 'ok'>;

/**
 * The switch turned on. Call it straight from the tap: the permission is asked synchronously, before anything is
 * awaited (iOS grants the prompt only to a user gesture). `vapid`: the Worker's key (null: push is off there).
 */
export async function enablePush(vapid: string | null, lang: PushLang): Promise<EnableResult> {
  const support = pushSupport();
  if (support !== 'ok' && support !== 'denied') return support;
  if (!vapid) return 'soon';
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
    const r = await register(sub, vapid, lang);
    return r.ok ? 'on' : notReady(r) ? 'soon' : 'failed';
  } catch (e) {
    fail('subscribe', e);
    return 'failed';
  }
}

/** The switch turned off: forgotten here first (so nothing re-subscribes), then at the Worker and in the browser. */
export async function disablePush(): Promise<void> {
  const was = pref();
  savePref({ on: false });
  try {
    const reg = await registration();
    const sub = reg ? await reg.pushManager.getSubscription() : null;
    const endpoint = sub?.endpoint ?? was.endpoint;
    if (endpoint) await d().post('unsubscribe', { endpoint });
    if (sub) await sub.unsubscribe();
  } catch (e) {
    fail('unsubscribe', e);
  }
}

/**
 * Opening 保養所 with the Worker's push status read: a phone that is on keeps the Worker's copy fresh (see the top);
 * a revoked permission turns it off (the Worker told too). `force`: hand it over whatever (the Worker had lost it).
 * True while it stays on.
 */
export async function refreshPush(vapid: string | null, lang: PushLang, force = false): Promise<boolean> {
  const p = pref();
  if (!p.on) return false;
  const support = pushSupport();
  if (support === 'install' || support === 'unsupported') return true;   // (another browser's pref: nothing to do here)
  if (d().win.Notification!.permission !== 'granted') {
    savePref({ on: false });
    if (p.endpoint) void d().post('unsubscribe', { endpoint: p.endpoint });
    return false;
  }
  if (!vapid) return true;   // push off at the Worker: kept, handed over once it's back
  try {
    const sub = await subscription(vapid, p);
    if (!sub) return true;
    if (force || sub.endpoint !== p.endpoint || p.key !== vapid || p.lang !== lang || d().now() - (p.at ?? 0) > RESYNC_MS) await register(sub, vapid, lang);
  } catch (e) {
    fail('subscribe', e);
  }
  return pref().on;
}

export type TestResult = 'sent' | 'wait' | 'failed' | 'soon';

/** テスト通知: one push to this phone (the Worker's own rate: 429 → `wait`). A Worker that lost this phone's
 *  subscription (404 not_subscribed) is handed it again, and asked once more. */
export async function testPush(vapid: string | null, lang: PushLang): Promise<TestResult> {
  const p = pref();
  if (!p.on || !p.endpoint) return 'failed';
  let r = await d().post('test', { endpoint: p.endpoint });
  if (!r.ok && r.err === 'not_subscribed' && (await refreshPush(vapid, lang, true))) r = await d().post('test', { endpoint: pref().endpoint ?? p.endpoint });
  return r.ok ? 'sent' : r.http === 429 ? 'wait' : notReady(r) ? 'soon' : 'failed';
}
