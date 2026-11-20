// 共有リンク (docs/travel.md "Sharing"): a link a member makes so someone without a key sees
// one page of ours read-only, until it expires or is turned off, its visits counted. Shared by the relay (relay/src/
// share.ts: the tables, the API, `POST /share`) and the app (the owner's list, the visitor's `/s#<token>` page). A kind
// is a registry entry (SHARE_KINDS: its refs, the record tables its snapshot may read, its fields) and a public view
// in the app. Pure.
import { isRec } from './guards.ts';

/** The trips a `trip` link may name (travel/types.ts TripId: trips.test pins them equal). */
export const SHARE_TRIP_REFS = ['okinawa', 'seattle', 'nz', 'zao'] as const;

/** A kind's rules: the refs it may name, the record tables its snapshot may read (none: the builder gets no handle),
 *  the snapshot's fields (anything else is dropped), and the builder. */
interface ShareKindDef {
  refs: readonly string[];
  reads: readonly string[];
  fields: readonly string[];
  snapshot: () => Record<string, unknown>;
}

/** The kinds. A trip's guide is in the app's bundle already (docs/travel.md "Sharing"): its snapshot is empty, the page
 *  loads the guide itself and never has the trip note. */
export const SHARE_KINDS = {
  trip: { refs: SHARE_TRIP_REFS, reads: [], fields: [], snapshot: () => ({}) }
} as const satisfies Record<string, ShareKindDef>;
export type ShareKind = keyof typeof SHARE_KINDS;

/** @public (relay/src/share.ts) */
export const isShareKind = (v: unknown): v is ShareKind => typeof v === 'string' && Object.hasOwn(SHARE_KINDS, v);
/** Whether `ref` is one `kind` may name. */
export const isShareRef = (kind: ShareKind, ref: unknown): ref is string => typeof ref === 'string' && (SHARE_KINDS[kind].refs as readonly string[]).includes(ref);

/** A snapshot's size at most (its JSON's characters). */
export const SHARE_SNAPSHOT_MAX = 20_000;

/** A kind's snapshot: the builder's, its whitelisted fields only; null when past SHARE_SNAPSHOT_MAX (never served). */
export function shareSnapshot(kind: ShareKind): Record<string, unknown> | null {
  const def: ShareKindDef = SHARE_KINDS[kind];
  const raw = def.snapshot();
  const out: Record<string, unknown> = {};
  for (const f of def.fields) if (Object.hasOwn(raw, f)) out[f] = raw[f];
  return JSON.stringify(out).length <= SHARE_SNAPSHOT_MAX ? out : null;
}

// ---------------------------------------------------------------- the token and the id

/** The link's token: 16 random bytes as base64url (22 characters, 128 bits), made on the relay. */
const SHARE_TOKEN_RE = /^[A-Za-z0-9_-]{22}$/;
export const isShareToken = (v: unknown): v is string => typeof v === 'string' && SHARE_TOKEN_RE.test(v);
/** The link's management id (the app's list, the log never): 8 random bytes as hex. */
const SHARE_ID_RE = /^[0-9a-f]{16}$/;
/** @public (relay/src/share.ts) */
export const isShareId = (v: unknown): v is string => typeof v === 'string' && SHARE_ID_RE.test(v);

type Rand = (b: Uint8Array<ArrayBuffer>) => Uint8Array<ArrayBuffer>;
const getRandom: Rand = (b) => crypto.getRandomValues(b);

/** A new token (`rand`: crypto.getRandomValues; the tests' own). */
export function newShareToken(rand: Rand = getRandom): string {
  const b = rand(new Uint8Array(16));
  return btoa(String.fromCharCode(...b)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** A new management id. */
export function newShareId(rand: Rand = getRandom): string {
  return Array.from(rand(new Uint8Array(8)), (x) => x.toString(16).padStart(2, '0')).join('');
}

/** The token in a page's fragment (`#<token>`), or null. */
export const tokenFromHash = (hash: string): string | null => {
  const t = hash.replace(/^#/, '');
  return isShareToken(t) ? t : null;
};

// ---------------------------------------------------------------- the lifecycle

/** The expiry presets in days (1週間 · 1か月 · 3か月 · 1年); no 無期限: a renewal is one tap. */
export const SHARE_PRESETS = [7, 30, 90, 365] as const;
export type SharePreset = (typeof SHARE_PRESETS)[number];
export const SHARE_DEFAULT_DAYS: SharePreset = 365;
/** @public (relay/src/share.ts) */
export const isSharePreset = (v: unknown): v is SharePreset => (SHARE_PRESETS as readonly unknown[]).includes(v);
const DAY_MS = 86_400_000;
/** A link's expiry `days` from `now` (a preset: at most a year from now, whenever it is set). */
export const shareExp = (now: number, days: SharePreset): string => new Date(now + days * DAY_MS).toISOString();

/** Live links at most a ref, and in all; a label's characters at most. @public (relay/src/share.ts) */
export const SHARE_LIVE_PER_REF = 20;
/** @public (relay/src/share.ts) */
export const SHARE_LIVE_MAX = 100;
/** @public (relay/src/share.ts) */
export const SHARE_LABEL_MAX = 40;
/** A link's visits kept (the oldest dropped; its counters untouched), and shown. @public (relay/src/share.ts) */
export const SHARE_VISITS_KEPT = 500;
/** @public (relay/src/share.ts) */
export const SHARE_VISITS_SHOWN = 50;
/** An ended link (off or expired) is deleted with its visits this long after it ended (the 03:00 sweep). @public (relay/src/share.ts) */
export const SHARE_ENDED_KEEP_MS = 90 * DAY_MS;
/** A repeat open by the same visitor within this isn't a visit (a reload). @public (relay/src/share.ts) */
export const SHARE_REPEAT_MS = 30 * 60_000;

/** A label as kept: trimmed, control characters out, at most SHARE_LABEL_MAX characters ('' none). */
export const shareLabel = (v: unknown): string => (typeof v === 'string' ? [...v.replace(/[\p{Cc}\p{Cf}]/gu, ' ').trim()].slice(0, SHARE_LABEL_MAX).join('') : '');

/** Where a link is: `live`, `expired` (past its `exp`) or `off` (turned off). */
export type ShareState = 'live' | 'expired' | 'off';
export const shareState = (r: { exp: string; off: string | null }, now: number): ShareState => (r.off ? 'off' : Date.parse(r.exp) <= now ? 'expired' : 'live');
/** When a link ended (null: live). */
export const shareEnded = (r: { exp: string; off: string | null }, now: number): string | null => (r.off ? r.off : Date.parse(r.exp) <= now ? r.exp : null);

// ---------------------------------------------------------------- the visitor

/** A visitor's device class (from the User-Agent, nothing finer; an iPad on desktop Safari says Mac). */
export type ShareDev = 'iphone' | 'ipad' | 'android' | 'mac' | 'windows' | 'other';
export function devOf(ua: string): ShareDev {
  if (/iPhone|iPod/.test(ua)) return 'iphone';
  if (/iPad/.test(ua)) return 'ipad';
  if (/Android/.test(ua)) return 'android';
  if (/Macintosh|Mac OS X/.test(ua)) return 'mac';
  if (/Windows/.test(ua)) return 'windows';
  return 'other';
}

/** The link previewers and crawlers (never counted: a preview fetches `/s` only, and one that runs the page says so). */
const BOT_UA = /bot|crawl|spider|preview|facebookexternalhit|Slackbot|Twitterbot|Discordbot|WhatsApp|TelegramBot|LinkedInBot|Applebot|Line\//i;
export const isBotUa = (ua: string): boolean => !ua || BOT_UA.test(ua);

// ---------------------------------------------------------------- the API's shapes

/** The member's actions (`/api`, a member's key; the guest's `forbidden`). @public (relay/src/share.ts) */
export const SHARE_ACTIONS = ['share_list', 'share_make', 'share_set', 'share_visits'] as const;
/** @public (relay/src/share.ts) */
export type ShareAction = (typeof SHARE_ACTIONS)[number];
/** @public (relay/src/share.ts) */
export const isShareAction = (v: unknown): v is ShareAction => (SHARE_ACTIONS as readonly unknown[]).includes(v);

/** A link as its owners see it (`share_list`, `share_make`, `share_set`). `by`: who made it (A or B); `first`, `last`: its
 *  first and last visit. @public (relay/src/share.ts) */
export interface ShareRow {
  id: string;
  token: string;
  kind: ShareKind;
  ref: string;
  label: string;
  by: string;
  at: string;
  exp: string;
  off: string | null;
  views: number;
  uniq: number;
  first: string | null;
  last: string | null;
}
/** A visit as its owners see it: when, the device class, the country (Cloudflare's, '' unknown), the day's first for
 *  this visitor. @public (relay/src/share.ts) */
export interface ShareVisit { at: string; dev: ShareDev; cc: string; fresh: boolean }

/** `POST /share`'s body (text/plain JSON): the token, and `self` when the phone opening it is paired (ours: not a visit). @public (relay/src/share.ts) */
export const SHARE_READ_MAX = 256;
/** Its answer: the link's kind, ref, expiry and snapshot; or `gone` (`off` for a turned-off link and an unknown token
 *  alike: no oracle; `expired` with its date), or `busy`. */
export type ShareReadReply =
  | { ok: true; kind: ShareKind; ref: string; exp: string; data: Record<string, unknown> }
  | { ok: false; error: 'gone'; why: 'expired' | 'off'; exp?: string }
  | { ok: false; error: 'busy' };

/** A reply of `POST /share` as the page reads it (anything else: null). */
export function readReplyOf(x: unknown): ShareReadReply | null {
  if (!isRec(x)) return null;
  if (x.ok === true) {
    if (!isShareKind(x.kind) || !isShareRef(x.kind, x.ref) || typeof x.exp !== 'string' || !isRec(x.data)) return null;
    return { ok: true, kind: x.kind, ref: x.ref, exp: x.exp, data: x.data };
  }
  if (x.error === 'busy') return { ok: false, error: 'busy' };
  if (x.error === 'gone' && (x.why === 'expired' || x.why === 'off')) return { ok: false, error: 'gone', why: x.why, ...(typeof x.exp === 'string' ? { exp: x.exp } : {}) };
  return null;
}
