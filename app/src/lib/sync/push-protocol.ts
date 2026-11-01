// Goal notifications (docs/backend.md#notifications): the relay's /push/* requests, the push message it sends and
// the notification's words, shared by the Worker (relay/, imported by relative path), the client (push.ts) and the
// service worker. Checked by the same parsers on both sides. No imports: the Worker and the service worker bundle
// this file as is.

/** The relay's HTTP endpoints (POST, a text/plain JSON body with the person key: a simple request, no preflight). */
export const PUSH_PATHS = { subscribe: '/push/subscribe', unsubscribe: '/push/unsubscribe', goal: '/push/goal' } as const;
/** A request body longer than this is refused unread. @public (relay/) */
export const PUSH_MAX_BYTES = 2048;

export type PushLang = 'ja' | 'en';

/** A browser push subscription (PushSubscription.toJSON()'s fields the relay needs). @public (relay/) */
export interface PushSub {
  endpoint: string;
  /** base64url: the browser's P-256 public key (65 bytes) and auth secret (16 bytes). */
  p256dh: string;
  auth: string;
}

/** POST /push/subscribe: this phone wants the partner's goal notices, in this language. */
export interface SubscribeReq {
  key: string;
  sub: PushSub;
  lang: PushLang;
}

/** POST /push/unsubscribe: this phone no longer wants them. */
export interface UnsubscribeReq {
  key: string;
  endpoint: string;
}

/** POST /push/goal: my day (`date`, Tokyo) just reached all four goals; `both`: my partner's had too. */
export interface GoalReq {
  key: string;
  date: string;
  both: boolean;
  /** My villager name as the island shows it (the notice names me). */
  name: string;
}

/** What /push/goal did: pushed to `sent` subscriptions, or why not. */
export type GoalOutcome = 'sent' | 'none' | 'quiet' | 'dup' | 'stale' | 'failed';

/** The encrypted push message (RFC 8291) the service worker receives. */
export interface PushMsg {
  v: 1;
  kind: 'goal' | 'both';
  /** The achiever's name. */
  name: string;
  date: string;
  lang: PushLang;
}

/** Push services the relay will POST to (an endpoint elsewhere is refused at subscribe). */
const PUSH_HOSTS = [/^web\.push\.apple\.com$/, /^fcm\.googleapis\.com$/, /^updates\.push\.services\.mozilla\.com$/, /^[\w-]+\.notify\.windows\.com$/];

const KEY = /^[0-9a-f]{32,128}$/;
const B64URL = (min: number, max: number) => new RegExp(`^[A-Za-z0-9_-]{${min},${max}}$`);
const P256DH = B64URL(87, 88);
const AUTH = B64URL(22, 24);
const DATE = /^\d{4}-\d\d-\d\d$/;
/** A villager name: 1–20 characters (rules.ts villagerNameMaxChars), none of them control characters. */
const NAME = /^[^\p{Cc}\p{Cf}]{1,20}$/u;

type Obj = Record<string, unknown>;
const isObj = (x: unknown): x is Obj => typeof x === 'object' && x !== null && !Array.isArray(x);

/** An https endpoint on a known push service, ≤ 1024 characters. */
export function pushEndpointOk(x: unknown): x is string {
  if (typeof x !== 'string' || x.length > 1024) return false;
  try {
    const u = new URL(x);
    return u.protocol === 'https:' && !u.username && !u.password && !u.port && PUSH_HOSTS.some((h) => h.test(u.hostname));
  } catch {
    return false;
  }
}

function body(raw: unknown): Obj | null {
  if (typeof raw !== 'string' || raw.length > PUSH_MAX_BYTES) return null;
  try {
    const o: unknown = JSON.parse(raw);
    return isObj(o) && typeof o.key === 'string' && KEY.test(o.key) ? o : null;
  } catch {
    return null;
  }
}

/** A subscription's fields (known fields only), or null. */
function subOf(x: unknown): PushSub | null {
  if (!isObj(x) || !pushEndpointOk(x.endpoint)) return null;
  const keys = isObj(x.keys) ? x.keys : x; // PushSubscription.toJSON() nests them under `keys`
  if (typeof keys.p256dh !== 'string' || !P256DH.test(keys.p256dh) || typeof keys.auth !== 'string' || !AUTH.test(keys.auth)) return null;
  return { endpoint: x.endpoint, p256dh: keys.p256dh, auth: keys.auth };
}

/** @public (relay/) */
export function parseSubscribe(raw: unknown): SubscribeReq | null {
  const o = body(raw);
  const sub = o && subOf(o.sub);
  if (!o || !sub || (o.lang !== 'ja' && o.lang !== 'en')) return null;
  return { key: o.key as string, sub, lang: o.lang };
}

/** @public (relay/) */
export function parseUnsubscribe(raw: unknown): UnsubscribeReq | null {
  const o = body(raw);
  if (!o || !pushEndpointOk(o.endpoint)) return null;
  return { key: o.key as string, endpoint: o.endpoint };
}

/** @public (relay/) */
export function parseGoal(raw: unknown): GoalReq | null {
  const o = body(raw);
  if (!o || typeof o.date !== 'string' || !DATE.test(o.date) || typeof o.both !== 'boolean' || typeof o.name !== 'string' || !NAME.test(o.name)) return null;
  return { key: o.key as string, date: o.date, both: o.both, name: o.name };
}

/** A push message as the service worker accepts it, or null. */
export function parsePushMsg(raw: unknown): PushMsg | null {
  let o: unknown = raw;
  if (typeof raw === 'string') {
    try {
      o = JSON.parse(raw);
    } catch {
      return null;
    }
  }
  if (!isObj(o) || o.v !== 1 || (o.kind !== 'goal' && o.kind !== 'both')) return null;
  if (typeof o.name !== 'string' || !NAME.test(o.name) || typeof o.date !== 'string' || !DATE.test(o.date)) return null;
  return { v: 1, kind: o.kind, name: o.name, date: o.date, lang: o.lang === 'en' ? 'en' : 'ja' };
}

const TEXT = {
  ja: { title: 'しまの貯金箱', goal: '{name}が きょうの もくひょうを 4つ ぜんぶ たっせい！', both: 'ふたりで ぜんぶ たっせい！ {name}も 4つ クリアしたよ' },
  en: { title: 'Island Fund', goal: '{name} met all 4 goals today!', both: 'Both of you met every goal! {name} just finished all 4.' }
} as const;

/** The notification for a push message: its title, body and tag (one per day, so a repeat replaces, never stacks). */
export function pushNotice(m: PushMsg): { title: string; body: string; tag: string; lang: PushLang } {
  const t = TEXT[m.lang];
  return { title: t.title, body: t[m.kind].replace('{name}', m.name), tag: `island-goal-${m.date}`, lang: m.lang };
}
