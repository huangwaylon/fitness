// Goal notifications, the phone's side (docs/backend.md#notifications). Two jobs:
// - せってい's つうち switch (per phone, off by default): asks the browser's permission on a tap, subscribes to Web Push
//   with the relay's VAPID key and hands the subscription to the relay; off unsubscribes. At launch, a phone that is
//   on keeps its subscription fresh (a new endpoint, the language, a week old).
// - When my own day reaches all four goals, tell the relay once (it pushes to my partner's phones that are on).
// Plain TS: the browser objects, fetch and storage are injectable for tests.
import type { WeekView } from '#lib/types.ts';
import { RING_FRUITS } from '#lib/config/rules.ts';
import { PUSH_PATHS, type GoalOutcome, type PushLang } from './push-protocol.ts';
import { LIVE_URL } from './live.ts';
import { DEVICE, LIVE, getKey, localKV, readJson, writeJson, type KV } from './storage.ts';

/** The relay's VAPID public key (relay/wrangler.toml VAPID_PUBLIC; rotation: runbook §12). */
export const PUSH_PUBLIC_KEY = 'BCfU7NJ22GxdALlsB_vyhPE3hi5LGgLHl2OKcwdOAkEEoLoIJmcaoG0wmFbO5WX9nriyL0PXACdU5S7pCdn6qTE';

/** The relay's https origin, from its socket URL (no relay = no notifications). */
const PUSH_URL = LIVE_URL ? LIVE_URL.replace(/^ws(s?):/, 'http$1:').replace(/\/room$/, '') : '';

/** A subscription is handed to the relay again after this long even when nothing changed. */
const RESYNC_MS = 7 * 86_400_000;
/** After a goal report that didn't get through, the next try waits this long. */
const GOAL_RETRY_MS = 10 * 60_000;
const TIMEOUT_MS = 15_000;

/** This phone's switch (DEVICE.push): on, and what the relay was last given. */
interface PushPref {
  on: boolean;
  endpoint?: string;
  lang?: PushLang;
  /** When the relay last took the subscription, ms. */
  at?: number;
}

/** Where the switch stands: usable, or why not (`install`: an iPhone's Safari tab, it works once on the Home Screen;
 *  `unpaired`: no person key, e.g. the demo; `denied`: notifications blocked for the app in the phone's settings). */
export type PushSupport = 'ok' | 'install' | 'unsupported' | 'unpaired' | 'denied';

/** The browser and network, injectable for tests. */
export interface PushDeps {
  win: { Notification?: { permission: NotificationPermission; requestPermission(): Promise<NotificationPermission> }; PushManager?: unknown };
  nav: { serviceWorker?: { ready: Promise<{ pushManager: PushManager }> }; userAgent: string; maxTouchPoints?: number };
  standalone(): boolean;
  fetch: typeof fetch;
  kv: KV | null;
  key(): string | null;
  url: string;
  now(): number;
}

function browserDeps(): PushDeps {
  return {
    win: typeof window !== 'undefined' ? (window as unknown as PushDeps['win']) : {},
    nav: typeof navigator !== 'undefined' ? (navigator as unknown as PushDeps['nav']) : { userAgent: '' },
    standalone: () =>
      typeof matchMedia !== 'undefined' && (matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true),
    fetch: (...a) => fetch(...a),
    kv: localKV(),
    key: getKey,
    url: PUSH_URL,
    now: () => Date.now()
  };
}

let deps: PushDeps | null = null;
const d = (): PushDeps => (deps ??= browserDeps());

/** Tests: swap the browser (null = the real one again) and forget the session's state. */
export function configurePush(o: Partial<PushDeps> | null): void {
  deps = o ? { ...browserDeps(), ...o } : null;
  resumed = null;
  goalInFlight = false;
  goalTriedAt = 0;
}

const pref = (): PushPref => {
  const p = readJson<PushPref>(d().kv, DEVICE.push);
  return p && typeof p === 'object' && typeof p.on === 'boolean' ? p : { on: false };
};
const savePref = (p: PushPref) => void writeJson(d().kv, DEVICE.push, p);

/** The switch's stored state (true only after the relay took the subscription). */
export const pushOn = (): boolean => pref().on;

const isIOS = (n: PushDeps['nav']) => /iPhone|iPad|iPod/.test(n.userAgent) || (/Macintosh/.test(n.userAgent) && (n.maxTouchPoints ?? 0) > 1);

export function pushSupport(): PushSupport {
  const { win, nav, standalone, url, key } = d();
  const can = !!url && !!nav.serviceWorker && !!win.PushManager && !!win.Notification;
  if (!can) return isIOS(nav) && !standalone() ? 'install' : 'unsupported';
  if (!key()) return 'unpaired';
  return win.Notification!.permission === 'denied' ? 'denied' : 'ok';
}

async function post(path: string, body: Record<string, unknown>): Promise<{ status: number; json: Record<string, unknown> | null }> {
  const { fetch: f, url, key } = d();
  const k = key();
  if (!k || !url) return { status: 0, json: null };
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    // text/plain: a simple request, no preflight (the key travels in the body, never in the URL)
    const res = await f(url + path, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ ...body, key: k }), signal: ctrl.signal });
    let json: Record<string, unknown> | null = null;
    try {
      json = (await res.json()) as Record<string, unknown>;
    } catch {
      /* not JSON */
    }
    return { status: res.status, json };
  } catch {
    return { status: 0, json: null };
  } finally {
    clearTimeout(timer);
  }
}

function keyBytes(b64: string): Uint8Array<ArrayBuffer> {
  const bin = atob(b64.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (b64.length % 4)) % 4));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

const sameBytes = (a: ArrayBuffer | null | undefined, b: Uint8Array): boolean => {
  if (!a || a.byteLength !== b.length) return false;
  const x = new Uint8Array(a);
  return x.every((v, i) => v === b[i]);
};

/** This phone's push subscription for our key: the existing one, or a new one (permission must already be granted). */
async function subscription(): Promise<PushSubscription | null> {
  const sw = d().nav.serviceWorker;
  if (!sw) return null;
  const ready = await Promise.race([sw.ready, new Promise<null>((r) => setTimeout(r, TIMEOUT_MS, null))]);
  if (!ready) return null;
  const pm = ready.pushManager;
  const key = keyBytes(PUSH_PUBLIC_KEY);
  let sub = await pm.getSubscription();
  if (sub && !sameBytes(sub.options?.applicationServerKey, key)) {
    // made for an older VAPID key (rotated): the relay can't sign for it any more
    await sub.unsubscribe().catch(() => false);
    sub = null;
  }
  return sub ?? (await pm.subscribe({ userVisibleOnly: true, applicationServerKey: key }));
}

/** Hand the subscription to the relay; true when it took it. */
async function register(sub: PushSubscription, lang: PushLang): Promise<boolean> {
  const r = await post(PUSH_PATHS.subscribe, { sub: sub.toJSON(), lang });
  if (r.status !== 200) return false;
  savePref({ on: true, endpoint: sub.endpoint, lang, at: d().now() });
  return true;
}

export type EnableResult = 'on' | 'failed' | Exclude<PushSupport, 'ok'>;

/**
 * The switch turned on (call straight from the tap: iOS grants the permission prompt only to a user gesture, so it is
 * asked before anything else is awaited).
 */
export async function enablePush(lang: PushLang): Promise<EnableResult> {
  const support = pushSupport();
  if (support !== 'ok' && support !== 'denied') return support;
  const perm = await d().win.Notification!.requestPermission();
  if (perm !== 'granted') return 'denied';
  try {
    const sub = await subscription();
    if (sub && (await register(sub, lang))) return 'on';
  } catch (e) {
    console.warn('push: subscribe failed', e);
  }
  return 'failed';
}

/** The switch turned off: forget it here first (so no later launch re-subscribes), then tell the relay and the browser. */
export async function disablePush(): Promise<void> {
  savePref({ on: false });
  try {
    const sw = d().nav.serviceWorker;
    const reg = sw && (await Promise.race([sw.ready, new Promise<null>((r) => setTimeout(r, TIMEOUT_MS, null))]));
    const sub = reg ? await reg.pushManager.getSubscription() : null;
    if (!sub) return;
    await post(PUSH_PATHS.unsubscribe, { endpoint: sub.endpoint });
    await sub.unsubscribe();
  } catch (e) {
    console.warn('push: unsubscribe failed', e);
  }
}

let resumed: string | null = null;

/**
 * At launch (and when the language changes), a phone that is on keeps the relay's copy fresh: a revoked permission
 * turns the switch off; a missing, renewed or week-old subscription, or another language, is handed over again.
 */
async function resume(lang: PushLang): Promise<void> {
  const p = pref();
  if (!p.on || pushSupport() !== 'ok') {
    if (p.on && pushSupport() === 'denied') savePref({ on: false });
    return;
  }
  if (d().win.Notification!.permission !== 'granted') return;
  try {
    const sub = await subscription();
    if (!sub) return;
    if (sub.endpoint !== p.endpoint || lang !== p.lang || d().now() - (p.at ?? 0) > RESYNC_MS) await register(sub, lang);
  } catch (e) {
    console.warn('push: resume failed', e);
  }
}

let goalInFlight = false;
let goalTriedAt = 0;

/** What to report about this view: my day met all four and it wasn't reported yet (null otherwise). */
export function goalDue(v: WeekView, reported: { me: string; date: string } | null): { date: string; both: boolean; name: string } | null {
  const met = (p: 'A' | 'B') => RING_FRUITS.every((f) => v.people[p].rings[f].met);
  if (!met(v.me) || (reported?.me === v.me && reported.date === v.today)) return null;
  return { date: v.today, both: met(v.partner), name: [...v.people[v.me].villagerName].slice(0, 20).join('') };
}

async function reportGoal(g: { date: string; both: boolean; name: string }, me: string): Promise<void> {
  goalInFlight = true;
  goalTriedAt = d().now();
  try {
    const r = await post(PUSH_PATHS.goal, g);
    const outcome = r.json?.outcome as GoalOutcome | undefined;
    // done for the day unless nothing got through (offline, the relay down, every push service failing)
    if ((r.status === 200 && outcome !== 'failed') || (r.status >= 400 && r.status < 500)) writeJson(d().kv, LIVE.goalSent, { me, date: g.date });
  } finally {
    goalInFlight = false;
  }
}

/**
 * Called with each new view of the live app (week store): reports my day's all-four once, and once a session (or on a
 * language change) refreshes this phone's subscription. Cheap when there is nothing to do: no request.
 */
export function pushTick(v: WeekView): void {
  // the guest's phone reports nothing and gets nothing (docs/backend.md#the-guest)
  if (v.viewer === 'G' || !d().url || !d().key()) return;
  if (resumed !== v.locale) {
    resumed = v.locale;
    void resume(v.locale);
  }
  if (goalInFlight || d().now() - goalTriedAt < GOAL_RETRY_MS) return;
  const g = goalDue(v, readJson<{ me: string; date: string }>(d().kv, LIVE.goalSent));
  if (g) void reportGoal(g, v.me);
}
