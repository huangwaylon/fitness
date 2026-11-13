// Web Push's rules (README "Push"), free of the Workers runtime (bot.ts keeps the subscriptions and the outbox and sends;
// webpush.ts encrypts and signs): which endpoints may be stored, what a report's new events push (to whom, how urgent,
// for how long), the messages in each language (Tokyo times), what a push service's answer means, and the status's
// counts. Never an endpoint in a log line or the status: a subscription is known by `ep`, its endpoint's SHA-256.
import {
  AUTO_CONFIRM_MIN_DAYS, MAYBE_FILED_DETAILS, MAYBE_FILED_PREFIXES, NOT_BOOKED_DETAILS, PUSH_KEEP_DAYS, PUSH_MAX_ENDPOINT, PUSH_SUBS_PER_MEMBER, daysUntil, tokyoTime,
  type BookingEntry, type ItsEvent, type ItsPushPayload, type ItsPushStatus, type ItsSettings, type Member, type PushKind,
  type PushLang, type PushOutcome,
} from '../../../app/src/lib/its/contract.ts';
import { HOLD_MS, stayKey } from './rules.ts';
import { b64url, unb64url, type PushOptions, type Vapid } from './webpush.ts';

/** One phone's subscription. `at`: subscribed or refreshed (PUSH_KEEP_DAYS from it, dropped). `lastTest`: its last
 *  test push (PUSH_TEST_EVERY_SEC apart). */
export interface PushSub {
  ep: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  who: Member;
  lang: PushLang;
  at: number;
  lastOk: number | null;
  fails: number;
  lastTest?: number;
}

/** A push waiting in the outbox (`pushq`): one notice for one subscription, tried until `until` (its TTL's end). */
export interface PushJob {
  /** `${notice id}|${ep}`. */
  key: string;
  ep: string;
  kind: PushKind;
  id: string;
  urgency: NonNullable<PushOptions['urgency']>;
  until: number;
  /** The stay (`date|hotel`): the Topic and tag are its hash (sent at delivery). */
  date?: string;
  hotel?: string;
  expiresAt?: number;
  number?: string;
  tries: number;
  next: number;
}

/** The last outcome, the last ok, and the notices already queued (`kind|date|hotel|expiresAt`: one push per hold and per
 *  予約確定, whichever runs or retries report it). */
export interface PushLog {
  lastSentAt: number | null;
  lastOutcome: ItsPushStatus['lastOutcome'];
  done: string[];
}

export const emptyPushLog = (): PushLog => ({ lastSentAt: null, lastOutcome: null, done: [] });

/** The VAPID subject: the app's page, where the push service could reach us. */
const VAPID_SUBJECT = 'https://island-fund.pages.dev';
/** A hold with this little left is not pushed (it would lapse before anyone acts): logged `push skip expired`. */
export const MIN_LEFT_MS = 120_000;
/** 予約確定's TTL. */
export const CONFIRMED_TTL_MS = 24 * 3600_000;
export const PUSHQ_KEPT = 50;
const DONE_KEPT = 50;
/** A failed push's next try: 30 s, doubling, at most 15 min (a 429's Retry-After if longer, up to an hour); never past its TTL. */
const RETRY_FIRST_MS = 30_000;
const RETRY_MAX_MS = 15 * 60_000;
const KEEP_MS = PUSH_KEEP_DAYS * 86_400_000;

/** The VAPID pair from the Worker's var and secret, or null (push is off): VAPID_PUBLIC an uncompressed P-256 point
 *  (65 bytes, base64url), VAPID_PRIVATE its 32-byte scalar. */
export function vapidOf(pub: string | undefined, priv: string | undefined): Vapid | null {
  const p = pub?.trim() ?? '';
  const d = priv?.trim() ?? '';
  if (!/^[A-Za-z0-9_-]{87}$/.test(p) || !/^[A-Za-z0-9_-]{43}$/.test(d)) return null;
  if (unb64url(p)[0] !== 4) return null;
  return { publicKey: p, privateKey: d, subject: VAPID_SUBJECT };
}

/** An endpoint the Worker may store and call: https, a host in `hosts` exactly, the default port, no userinfo, no IP
 *  literal, at most PUSH_MAX_ENDPOINT characters. Not a redirect target, not a private address: no SSRF. */
export function endpointOk(s: unknown, hosts: readonly string[]): s is string {
  if (typeof s !== 'string' || s.length > PUSH_MAX_ENDPOINT || /\s/.test(s)) return false;
  let u: URL;
  try {
    u = new URL(s);
  } catch {
    return false;
  }
  if (u.protocol !== 'https:' || u.port !== '' || u.username || u.password || u.hash) return false;
  const h = u.hostname;
  if (h.includes(':') || h.startsWith('[') || /^[\d.]+$/.test(h)) return false;
  return hosts.includes(h);
}

const B64URL = /^[A-Za-z0-9_-]+$/;

/** The subscription's keys: p256dh a point on P-256 (imported: WebCrypto refuses one off the curve), auth 16 bytes. */
export async function keysOk(p256dh: unknown, auth: unknown): Promise<boolean> {
  if (typeof p256dh !== 'string' || typeof auth !== 'string' || !B64URL.test(p256dh) || !B64URL.test(auth) || p256dh.length !== 87 || auth.length !== 22) return false;
  const pub = unb64url(p256dh);
  if (pub.length !== 65 || pub[0] !== 4 || unb64url(auth).length !== 16) return false;
  try {
    await crypto.subtle.importKey('jwk', { kty: 'EC', crv: 'P-256', x: b64url(pub.slice(1, 33)), y: b64url(pub.slice(33)) }, { name: 'ECDH', namedCurve: 'P-256' }, false, []);
    return true;
  } catch {
    return false;
  }
}

const sha256 = async (s: string) => new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)));

/** A subscription's id: its endpoint's SHA-256, hex. Logged as its first 6 characters. */
export const epOf = async (endpoint: string): Promise<string> => [...(await sha256(endpoint))].map((b) => b.toString(16).padStart(2, '0')).join('');

/** One stay's Topic and tag: base64url(SHA-256(date|hotel)), 32 characters: a stay's later push replaces its earlier. */
export const topicOf = async (date: string, hotel: string): Promise<string> => b64url(await sha256(`${date}|${hotel}`)).slice(0, 32);

/** Subscriptions refreshed within PUSH_KEEP_DAYS. */
export const liveSubs = (subs: PushSub[], now: number): PushSub[] => subs.filter((s) => now - s.at < KEEP_MS);

/** `sub` stored (subscribe): its endpoint unique (another's moves to this member), the stale ones dropped, a fifth of
 *  the member's replacing the least recently refreshed. What was kept of an earlier one: lastOk, lastTest. */
export function addSub(subs: PushSub[], sub: PushSub, now: number): { subs: PushSub[]; moved: boolean; replaced: number } {
  const had = subs.find((s) => s.ep === sub.ep);
  const others = liveSubs(subs, now).filter((s) => s.ep !== sub.ep);
  const mine = others.filter((s) => s.who === sub.who).sort((a, b) => a.at - b.at);
  const drop = new Set(mine.slice(0, Math.max(0, mine.length - (PUSH_SUBS_PER_MEMBER - 1))).map((s) => s.ep));
  const next = { ...sub, lastOk: had?.lastOk ?? null, ...(had?.lastTest !== undefined && { lastTest: had.lastTest }) };
  return { subs: [...others.filter((s) => !drop.has(s.ep)), next], moved: !!had && had.who !== sub.who, replaced: drop.size };
}

/** What a report's new event pushes, before it's addressed to each subscription. */
export interface Notice {
  kind: Exclude<PushKind, 'test'>;
  id: string;
  date: string;
  hotel: string;
  urgency: PushJob['urgency'];
  until: number;
  expiresAt?: number;
  number?: string;
}

export interface Skip { kind: PushKind; id: string; why: 'expired' | 'no_hold' | 'manual' | 'not_booked' | 'done'; left?: number }

/** When the stay's live hold was taken: the earliest hold (a booking or an event, the Worker's times) within HOLD_MS. */
function holdAt(bookings: BookingEntry[], events: ItsEvent[], date: string, hotel: string, now: number): number | null {
  const k = stayKey(date, hotel);
  const ts = [
    ...bookings.filter((b) => b.kind === 'hold' && stayKey(b.date, b.hotel) === k).map((b) => b.at),
    ...events.filter((e) => e.kind === 'hold' && e.date && e.hotel && stayKey(e.date, e.hotel) === k).map((e) => e.t),
  ].filter((t) => now - t < HOLD_MS);
  return ts.length ? Math.min(...ts) : null;
}

/** A leg may be filing the stay: a `confirming` with no later `confirmed` or `failed` for it. */
function confirmingOpen(bookings: BookingEntry[], date: string, hotel: string): boolean {
  const k = stayKey(date, hotel);
  const mine = bookings.filter((b) => stayKey(b.date, b.hotel) === k);
  return mine.some((c) => c.kind === 'confirming' && !mine.some((b) => (b.kind === 'confirmed' || b.kind === 'failed') && b.at >= c.at));
}

/** A detail after which the leg may have filed (the contract's MAYBE_FILED_DETAILS and MAYBE_FILED_PREFIXES). */
const maybeFiled = (detail: string): boolean => MAYBE_FILED_DETAILS.includes(detail) || MAYBE_FILED_PREFIXES.some((p) => detail.startsWith(p));

/** The notices for a report's added events (README "Push"):
 *  - hold, when the bot will confirm it (auto-confirm on, the stay ≥ AUTO_CONFIRM_MIN_DAYS away): normal, till the
 *    hold lapses. Otherwise nothing: its human_needed says it.
 *  - human_needed when the application may be filed: the stay has an open `confirming` (whatever the detail), or the
 *    detail says so (MAYBE_FILED_DETAILS, MAYBE_FILED_PREFIXES): `maybe_filed`, high, CONFIRMED_TTL_MS, live hold or
 *    not (the mailbox and the site decide). Never 「メールから申込」 for one that may be filed.
 *  - any other human_needed but NOT_BOOKED_DETAILS: the hold waits for a person, while it lasts: high, till it lapses
 *    (the deadline an estimate: the Worker's receive time + HOLD_MS); skipped with MIN_LEFT_MS or less left.
 *  - confirmed: normal, CONFIRMED_TTL_MS, the 申込受付番号.
 *  Each once (`done`). `events`: the record's important ones, the added included. */
export function noticesFor(added: ItsEvent[], ctx: { settings: ItsSettings; bookings: BookingEntry[]; events: ItsEvent[]; done: string[] }, now: number): { notices: Notice[]; skipped: Skip[]; done: string[] } {
  const notices: Notice[] = [];
  const skipped: Skip[] = [];
  const done = [...ctx.done];
  for (const e of added) {
    if (e.kind !== 'hold' && e.kind !== 'human_needed' && e.kind !== 'confirmed') continue;
    const id = `${e.runId}:${e.seq}`;
    if (!e.date || !e.hotel) continue;
    const base = { id, date: e.date, hotel: e.hotel };
    const detail = e.detail ?? '';
    let n: Notice;
    if (e.kind === 'confirmed') {
      n = { ...base, kind: 'confirmed', urgency: 'normal', until: now + CONFIRMED_TTL_MS, ...(e.detail && { number: e.detail }) };
    } else if (e.kind === 'human_needed' && (maybeFiled(detail) || confirmingOpen(ctx.bookings, e.date, e.hotel))) {
      n = { ...base, kind: 'maybe_filed', urgency: 'high', until: now + CONFIRMED_TTL_MS };
    } else {
      if (e.kind === 'hold' && !(ctx.settings.autoConfirm && daysUntil(e.date, now) >= AUTO_CONFIRM_MIN_DAYS)) { skipped.push({ kind: e.kind, id, why: 'manual' }); continue; }
      if (e.kind === 'human_needed' && NOT_BOOKED_DETAILS.includes(detail)) { skipped.push({ kind: e.kind, id, why: 'not_booked' }); continue; }
      const at = holdAt(ctx.bookings, ctx.events, e.date, e.hotel, now);
      if (at === null) { skipped.push({ kind: e.kind, id, why: 'no_hold' }); continue; }
      const expiresAt = at + HOLD_MS;
      if (expiresAt - now <= MIN_LEFT_MS) { skipped.push({ kind: e.kind, id, why: 'expired', left: Math.round((expiresAt - now) / 1000) }); continue; }
      n = { ...base, kind: e.kind, urgency: e.kind === 'hold' ? 'normal' : 'high', until: expiresAt, expiresAt };
    }
    const key = `${n.kind}|${stayKey(n.date, n.hotel)}|${n.expiresAt ?? ''}`;
    if (done.includes(key)) { skipped.push({ kind: n.kind, id, why: 'done' }); continue; }
    done.push(key);
    notices.push(n);
  }
  return { notices, skipped, done: done.slice(-DONE_KEPT) };
}

/** A notice addressed to each live subscription. */
export const jobsFor = (notices: Notice[], subs: PushSub[], now: number): PushJob[] =>
  notices.flatMap((n) => liveSubs(subs, now).map((s): PushJob => ({ key: `${n.id}|${s.ep}`, ep: s.ep, tries: 0, next: now, ...n })));

// ---- Messages ----

const WEEKDAY_JA = ['日', '月', '火', '水', '木', '金', '土'];
const WEEKDAY_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** A stay's date: 11/22(日), Sun 22 Nov. */
export function dayLabel(date: string, lang: PushLang): string {
  const d = new Date(`${date}T00:00:00Z`);
  const wd = d.getUTCDay();
  return lang === 'ja' ? `${d.getUTCMonth() + 1}/${d.getUTCDate()}(${WEEKDAY_JA[wd]})` : `${WEEKDAY_EN[wd]} ${d.getUTCDate()} ${MONTH_EN[d.getUTCMonth()]}`;
}

const TEXT = {
  ja: {
    hold: ['仮押さえしました', () => '自動で確定します'],
    human_needed: ['仮押さえ・要対応', (j: Pick<PushJob, 'expiresAt'>) => `${tokyoTime(j.expiresAt!)}ごろまでにメールから申込`],
    maybe_filed: ['仮押さえ・要確認', () => '申込済みの可能性：メールとサイトで確認'],
    confirmed: ['予約が確定しました', (j: Pick<PushJob, 'number'>) => (j.number ? `申込受付番号 ${j.number}` : '')],
    test: ['テスト通知', () => '保養所ボットの通知はこの端末に届きます'],
    sep: '・',
  },
  en: {
    hold: ['Room held', () => 'confirming automatically'],
    human_needed: ['Room held: action needed', (j: Pick<PushJob, 'expiresAt'>) => `apply from the email by about ${tokyoTime(j.expiresAt!)}`],
    maybe_filed: ['Room held: check', () => 'may already be booked: check the email and the site'],
    confirmed: ['Booking confirmed', (j: Pick<PushJob, 'number'>) => (j.number ? `ref. ${j.number}` : '')],
    test: ['Test notification', () => 'ITS bot notifications reach this device'],
    sep: ' · ',
  },
} as const;

/** The decrypted message for a job, in the subscription's language. */
export function payloadOf(j: Pick<PushJob, 'kind' | 'id' | 'date' | 'hotel' | 'expiresAt' | 'number'>, lang: PushLang, tag: string): ItsPushPayload {
  const t = TEXT[lang];
  const [title, tail] = t[j.kind] as readonly [string, (x: typeof j) => string];
  const parts = j.kind === 'test' ? [tail(j)] : [j.hotel!, dayLabel(j.date!, lang), tail(j)].filter(Boolean);
  return {
    v: 1, kind: j.kind, id: j.id, tag, title, body: parts.join(t.sep), open: 'its',
    ...(j.date && { date: j.date }), ...(j.hotel && { hotel: j.hotel }),
    ...(j.expiresAt !== undefined && { expiresAt: j.expiresAt }), ...(j.number && { number: j.number }),
  };
}

// ---- Outcomes ----

/** A push service's status as an outcome (0: no answer). */
export function outcomeOf(status: number): PushOutcome {
  if (status >= 200 && status < 300) return 'ok';
  if (status === 404 || status === 410) return 'gone';
  if (status === 401 || status === 403) return 'config';
  if (status === 429 || status >= 500 || status === 0) return 'retry';
  return 'bug';
}

/** The push service's reason (Apple's JSON `{"reason": "BadJwtToken"}`), as a short code; never the body itself. */
export function reasonOf(body: string): string | undefined {
  return /"reason"\s*:\s*"([A-Za-z0-9_.-]{1,40})"/.exec(body)?.[1];
}

/** The next try after the `tries`th failure (a Retry-After in seconds, if longer), or null: none before the TTL ends. */
export function retryAt(job: PushJob, now: number, retryAfterSec: number | null): number | null {
  const backoff = Math.min(RETRY_FIRST_MS * 2 ** job.tries, RETRY_MAX_MS);
  const after = retryAfterSec !== null && Number.isFinite(retryAfterSec) ? Math.min(Math.max(0, retryAfterSec) * 1000, 3600_000) : 0;
  const next = now + Math.max(backoff, after);
  return next < job.until ? next : null;
}

/** The status's push: live subscriptions per member, the key, the last ok and the last outcome. */
export function pushStatusOf(subs: PushSub[], log: PushLog, vapid: Vapid | null, now: number): ItsPushStatus {
  const live = liveSubs(subs, now);
  return {
    A: live.filter((s) => s.who === 'A').length,
    B: live.filter((s) => s.who === 'B').length,
    vapidPublic: vapid?.publicKey ?? null,
    lastSentAt: log.lastSentAt,
    lastOutcome: log.lastOutcome,
  };
}
