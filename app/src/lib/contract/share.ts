// 共有リンク (docs/travel.md "Sharing"): a link a member makes so someone without a key sees
// one page of ours read-only, until it expires or is turned off, its visits counted. Shared by the relay (relay/src/
// share.ts: the tables, the API, `POST /share`) and the app (the owner's list, the visitor's `/s#<token>` page). A kind
// is a registry entry (SHARE_KINDS: its refs, the record tables its snapshot may read, its fields) and a public view
// in the app. Pure.
import { isRec } from './guards.ts';
import { packList, packOpOf, PackBook, tripNoteOf, PACK_NAME, type L, type PackCat, type PackSeed } from './pack.ts';
import { cleanLine } from './text.ts';
import { idLikeRuns, LOCK, redactPrivate } from './private.ts';

/** The trips a `trip` link may name (travel/types.ts TripId: trips.test pins them equal). */
export const SHARE_TRIP_REFS = ['okinawa', 'seattle', 'nz', 'zao'] as const;
export type ShareTripRef = (typeof SHARE_TRIP_REFS)[number];
/** A `trips` link's one ref: the whole trips page. */
export const SHARE_TRIPS_REF = 'all';

/** The trip note's keys the guides name as `{p:key}` (trips.test pins them equal): private values, never shared (each
 *  stays 🔒 on the page). The note's other keys are free text, shared redacted (redactPrivate). */
export const SHARE_PRIVATE_NOTE_KEYS: Record<ShareTripRef, readonly string[]> = {
  okinawa: ['flightRef', 'ticket', 'carRef', 'onboardingUrl', 'traveller1'],
  seattle: [],
  nz: ['flightRef', 'expediaRef', 'traveller1', 'traveller2'],
  zao: []
};
/** A note key that names something private whatever the guides say (a booking, a ticket, a name, a link…): never
 *  shared either. */
const PRIVATE_KEY = /ref|ticket|pass|travel|name|url|link|mail|phone|tel|conf|pnr|book|itin|card|member|addr|birth|code|pin|id$/i;

/** What a kind's snapshot may read of the record: a trip's packing rows and its note (`pack`, `trip_note`), through a
 *  narrowed reader (the relay's packing query, its four event types only), never an SQL handle. */
type ShareRead = 'pack' | 'trip_note';
export interface ShareSource {
  /** A trip's packing rows and note as the record holds them (each slot's latest). */
  pack(trip: string): PackBook;
}

/** A kind's rules: the refs it may name, what of the record its snapshot may read (none: the builder gets no
 *  source), the snapshot's fields (anything else is dropped), its size at most (its JSON's characters), the builder. */
interface ShareKindDef {
  refs: readonly string[];
  reads: readonly ShareRead[];
  fields: readonly string[];
  max: number;
  snapshot: (src: ShareSource) => Record<string, unknown>;
}

/** The kinds. `trip` (one trip, v1: still read, no longer made): its guide is in the app's bundle, its snapshot empty,
 *  never the note or the packing list. `trips` (the whole trips page, 2026-11-20): every trip's guide from the bundle,
 *  and from the record its packing list and its note's free values, redacted (sharedTrips). */
export const SHARE_KINDS = {
  trip: { refs: SHARE_TRIP_REFS, reads: [], fields: [], max: 20_000, snapshot: () => ({}) },
  trips: { refs: [SHARE_TRIPS_REF], reads: ['pack', 'trip_note'], fields: ['trips'], max: 200_000, snapshot: (src: ShareSource) => ({ trips: sharedTrips(src) }) }
} as const satisfies Record<string, ShareKindDef>;
export type ShareKind = keyof typeof SHARE_KINDS;
/** The kinds a member can make now (share_make): a `trip` link is only read and managed. @public (relay/src/share.ts) */
export const SHARE_MAKE_KINDS: readonly ShareKind[] = ['trips'];

/** @public (relay/src/share.ts) */
export const isShareKind = (v: unknown): v is ShareKind => typeof v === 'string' && Object.hasOwn(SHARE_KINDS, v);
/** Whether `ref` is one `kind` may name. */
export const isShareRef = (kind: ShareKind, ref: unknown): ref is string => typeof ref === 'string' && (SHARE_KINDS[kind].refs as readonly string[]).includes(ref);

/** No source: a kind that reads nothing gets this, and any read throws. */
const NO_SOURCE: ShareSource = {
  pack: () => {
    throw new Error('this kind reads nothing');
  }
};

/** A kind's snapshot: the builder's, its whitelisted fields only; null when past the kind's `max` (never served). */
export function shareSnapshot(kind: ShareKind, src: ShareSource = NO_SOURCE): Record<string, unknown> | null {
  const def: ShareKindDef = SHARE_KINDS[kind];
  const raw = def.snapshot(def.reads.length ? src : NO_SOURCE);
  const out: Record<string, unknown> = {};
  for (const f of def.fields) if (Object.hasOwn(raw, f)) out[f] = raw[f];
  return JSON.stringify(out).length <= def.max ? out : null;
}

// ---------------------------------------------------------------- the `trips` kind's data

/** A packing op as a stranger gets it: an id's state (no `by`, no time, no ticks) or its removal. */
type SharedPackOp =
  | { id: string; rm: true }
  | { id: string; kind: 'cat'; ord: number; name: L; icon: string }
  | { id: string; kind: 'item'; cat: string; ord: number; name: L; note?: L };
/** A trip as the snapshot has it: the record's packing ops over the bundle's seed, and its note's free values. */
export interface SharedTrip { pack: SharedPackOp[]; notes: string[] }
export type SharedTrips = Partial<Record<ShareTripRef, SharedTrip>>;

const PACK_NOTE_MAX = 120;
const NOTE_MAX = 500;
/** A text redacted and cut to `max` after; null (withheld: fail closed) when not a string, or when an ID-like run is
 *  still in it. */
function redacted(v: unknown, max: number): string | null {
  if (typeof v !== 'string') return null;
  const x = cleanLine(redactPrivate(v), max);
  return idLikeRuns(x).length ? null : x;
}
/** A text pair redacted (each side), null when a side is withheld or nothing is left. */
function redactL(l: L, max: number): L | null {
  const out: L = {};
  for (const k of ['ja', 'en'] as const) {
    if (l[k] === undefined) continue;
    const v = redacted(l[k], max);
    if (v === null) return null;
    if (v) out[k] = v;
  }
  return out.ja || out.en ? out : null;
}
/** A category's icon as shared: a guide icon's name only (an emoji is someone's pick, and none is needed). */
const ICON_NAME = /^[a-z][a-z0-9-]{0,31}$/;
const isNewPackId = (id: string): boolean => id.startsWith('_');
/** The time a shared op is read back with (it has none: any valid one; the ops' slots never meet). */
const SHARED_AT = 1e12;

/** Every trip's shared data, field by field from the record's rows (never an op's data spread): everyone's packing
 *  ops (no `by`, time or ticks), names and notes redacted; the note's
 *  values whose keys aren't private (SHARE_PRIVATE_NOTE_KEYS, PRIVATE_KEY), redacted, in their keys' order. */
export function sharedTrips(src: ShareSource): SharedTrips {
  const out: SharedTrips = {};
  for (const trip of SHARE_TRIP_REFS) {
    const book = src.pack(trip);
    const pack: SharedPackOp[] = [];
    for (const r of book.rows.values()) {
      if (r.type !== 'pack' || r.op.trip !== trip) continue;
      const op = r.op;
      if (op.rm) {
        pack.push({ id: op.id, rm: true });
        continue;
      }
      const name = redactL(op.name, PACK_NAME);
      if (!name) continue;
      if (op.kind === 'cat') pack.push({ id: op.id, kind: 'cat', ord: op.ord, name, icon: op.icon && ICON_NAME.test(op.icon) ? op.icon : 'shopping-bag' });
      else if (op.cat) {
        const note = op.note ? redactL(op.note, PACK_NOTE_MAX) : null;
        pack.push({ id: op.id, kind: 'item', cat: op.cat, ord: op.ord, name, ...(note ? { note } : {}) });
      }
    }
    const note = tripNoteOf(trip, book) ?? {};
    const notes: string[] = [];
    for (const k of Object.keys(note).sort()) {
      if (SHARE_PRIVATE_NOTE_KEYS[trip].includes(k) || PRIVATE_KEY.test(k)) continue;
      const x = redacted(note[k], NOTE_MAX);
      if (x?.replaceAll(LOCK, '').trim()) notes.push(x);
    }
    if (pack.length || notes.length) out[trip] = { pack, notes };
  }
  return out;
}

/** A `trips` snapshot as the page reads it: each trip's ops checked as the record would (packOpOf), its notes strings;
 *  anything else dropped. */
export function sharedTripsOf(data: unknown): SharedTrips {
  const out: SharedTrips = {};
  const trips = isRec(data) && isRec(data.trips) ? data.trips : {};
  for (const trip of SHARE_TRIP_REFS) {
    const t = trips[trip];
    if (!isRec(t)) continue;
    const pack: SharedPackOp[] = [];
    for (const o of Array.isArray(t.pack) ? t.pack : []) {
      if (!isRec(o) || typeof o.id !== 'string' || 'by' in o || 'at' in o || 'trip' in o) continue;
      const op = packOpOf('pack', { ...o, trip, at: SHARED_AT, ...(isNewPackId(o.id) && o.rm === undefined ? { by: 'A' } : {}) });
      if (!op) continue;
      if (op.rm) pack.push({ id: op.id, rm: true });
      else if (op.kind === 'cat') pack.push({ id: op.id, kind: 'cat', ord: op.ord, name: op.name, icon: op.icon ?? 'shopping-bag' });
      else if (op.cat) pack.push({ id: op.id, kind: 'item', cat: op.cat, ord: op.ord, name: op.name, ...(op.note ? { note: op.note } : {}) });
    }
    const notes = (Array.isArray(t.notes) ? t.notes : []).filter((x): x is string => typeof x === 'string' && x.length <= NOTE_MAX * 2);
    out[trip] = { pack, notes };
  }
  return out;
}

/** A shared trip's packing list: the bundle's seed with the shared ops over it (contract/pack.ts packList; no ticks). */
export function sharedPackList(trip: ShareTripRef, seed: PackSeed | null | undefined, shared: SharedTrip | undefined): PackCat[] {
  const book = new PackBook();
  for (const o of shared?.pack ?? []) {
    const d = { ...o, trip, at: SHARED_AT, ...('rm' in o || !isNewPackId(o.id) ? {} : { by: 'A' }) };
    const op = packOpOf('pack', d);
    if (op) book.put({ type: 'pack', who: 'A', op });
  }
  return packList(trip, seed, book);
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

/** The share actions (`/api`, anyone's key). @public (relay/src/share.ts) */
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
