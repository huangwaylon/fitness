// The live relay's wire protocol (docs/backend.md#live-relay), shared by the Worker (relay/, imported by relative path)
// and the client (live.ts). Intents, not positions: a tap's target and what it did, never a stream of coordinates.
// Every message is one small JSON object (≤ MAX_BYTES), versioned by `v`, and checked by the same parsers on both
// sides. No imports: the Worker bundles this file as is.

export const LIVE_V = 2;
/** @public (relay/) The versions the relay still speaks: v1 phones (before the rolling-log world) keep their push and presence; only a
 *  walk, whose target changed meaning (stage units in v1, world units in v2), never crosses versions. */
export const LIVE_VS = [1, 2] as const;
/** @public (relay/) */
export type LiveV = (typeof LIVE_VS)[number];
/** Anything longer is dropped unread by both sides. */
export const MAX_BYTES = 256;

/**
 * The world's plan extent (world units; island/world.ts PLAN, kept equal by its test): a v2 walk's point lies within it.
 * Here because the Worker bundles this file alone (and sync/ may not import components/).
 */
export const WORLD_X = [-230, 620] as const;
export const WORLD_Z = [-400, 2500] as const;

export type Who = 'A' | 'B';

/** What my villager did with a tap (the partner's villager plays it too: walk there, the tool, the motion): `id` names
 *  the thing (a bush, the rock, a shadow being cast at), `at` where it is (a world point). */
export const ACTS = ['weed', 'water', 'dig', 'shake', 'fruit', 'present', 'cast', 'net', 'talk', 'visitor', 'star', 'tap', 'bush', 'rock'] as const;
export type Act = (typeof ACTS)[number];

/** A change to the shared island (docs/backend.md#shared-world): `watered` a flower bed's cell, `wished` on a shooting
 *  star (its id the morning the fragment comes), the rest kept for older phones. */
export const WORLD_OPS = ['weed-pulled', 'fruit-collected', 'dug', 'present-opened', 'watered', 'shaken', 'wished'] as const;
export type WorldOp = (typeof WORLD_OPS)[number];

/** How a critter left the island (a `catch`): netted, reeled in, dived for, dug up (a mole cricket), netted out of the
 *  air (a wasp), or it got away (`flee`: startled, a fish spooked, a quick one out of reach). */
export const HOWS = ['net', 'rod', 'dive', 'dig', 'swarm', 'flee'] as const;
export type How = (typeof HOWS)[number];

/** What a shaken tree dropped (a `shake`): nothing, a branch, a wasp nest, a bagworm or a spider on its thread,
 *  coconuts (a palm's). */
export const DROPS = ['none', 'branch', 'nest', 'bagworm', 'spider', 'coconut'] as const;
export type Drop = (typeof DROPS)[number];

/** A world point (v2: integer world units within the plan). */
export type Pt = readonly [number, number];

/** A walk-graph node id or a point: v2 a world point [x, z] (integers within WORLD_X × WORLD_Z), v1 a stage point
 *  (integers, |n| ≤ 100,000). */
export type Target = string | readonly [number, number];

/** The intents a client sends; the relay stamps `who` and `t` and passes them to the other person only. The shared
 *  world's (v2, docs/backend.md#shared-world): `catch` (a critter by its shared id: caught or gone, first wins), `pick`
 *  (a thing on the ground by its id: picked up, dug, pulled or opened, first wins), `put` (something this phone put in
 *  the world: a present landed, a bug out of a bush), `shake` (a tree's outcome), and `act`'s `pt` (where to play it). */
export type Intent =
  | { kind: 'walk'; to: Target; at?: number }
  | { kind: 'act'; act: Act; id?: string; at?: number; pt?: Pt }
  | { kind: 'catch'; what: string; id?: string; at?: Pt; how?: How }
  | { kind: 'pick'; id: string; what: string; at?: Pt }
  | { kind: 'put'; id: string; what: string; at: Pt }
  | { kind: 'shake'; tree: string; drop: Drop }
  | { kind: 'emote'; emote: string }
  | { kind: 'world'; op: WorldOp; id: string }
  /** I just wrote rows to the sheet (an event was acked): the partner refetches the snapshot now. */
  | { kind: 'saved' };

/** Client → relay. `hello` must come first (the person key; `since` = the last world event's `t` it has seen). */
export type ClientMsg =
  | { v: LiveV; kind: 'hello'; key: string; since?: number }
  | { v: LiveV; kind: 'ping'; c: number }
  | ({ v: LiveV } & Intent);

/** An intent as relayed: who sent it and the relay's clock when it arrived (ms since the epoch). */
export type Relayed = Intent & { v: LiveV; who: Who; t: number };

/** Relay → client. */
export type ServerMsg =
  | { v: LiveV; kind: 'welcome'; me: Who; peer: boolean; t: number }
  | { v: LiveV; kind: 'pong'; c: number; t: number }
  | { v: LiveV; kind: 'presence'; who: Who; on: boolean; t: number }
  | ({ v: LiveV; kind: 'changed'; t: number } & Notice)
  | Relayed;

/** What the Apps Script wrote (`ingest`: health rows, `event`: an event row). */
const NOTICE_WHAT = ['ingest', 'event'] as const;
export type NoticeWhat = (typeof NOTICE_WHAT)[number];

/**
 * The sheet changed: Apps Script POSTs this to the relay's /notify after a write (signed, docs/backend.md#push), and the
 * room passes it to every connected phone as `changed`. `at` is the newest row's server time (the snapshot's `since`
 * domain), `rev` the data revision.
 */
export interface Notice {
  what: NoticeWhat;
  who: Who;
  at: string;
  rev: string;
}

/** Close codes (4000–4999 are the application's). */
export const CLOSE = {
  /** No or a wrong key, or a message before hello. */
  unauthorized: 4001,
  /** The same person connected again (another tab or phone): this one stops until it is shown again. */
  replaced: 4002,
  /** No hello in time. */
  timeout: 4003,
  /** The relay is updating its protocol: reconnect later. */
  version: 4004
} as const;

const ID = /^[\w:.-]{1,32}$/;
/** What was caught, picked or put: a token, `kind:id` (a find's) or `kind:id:id` (a present's catalog item). */
const WHAT = /^[a-z][\w:.-]{0,63}$/;
const TOKEN = /^[a-z][a-z0-9-]{0,23}$/;
const KEY = /^[0-9a-f]{32,128}$/;
const AT = /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/;
const REV = /^[0-9a-z]{1,24}$/;

type Obj = Record<string, unknown>;
const isObj = (x: unknown): x is Obj => typeof x === 'object' && x !== null && !Array.isArray(x);
const isTime = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x) && x >= 0 && x < 1e14;
const isId = (x: unknown): x is string => typeof x === 'string' && ID.test(x);
const isWhat = (x: unknown): x is string => typeof x === 'string' && WHAT.test(x);
const isCoord = (x: unknown): x is number => Number.isInteger(x) && Math.abs(x as number) <= 100_000;
const within = (x: unknown, [lo, hi]: readonly [number, number]): boolean => Number.isInteger(x) && (x as number) >= lo && (x as number) <= hi;
/** A world point within the plan's extent. @public (tests) */
export const isWorldPt = (x: unknown): x is readonly [number, number] =>
  Array.isArray(x) && x.length === 2 && within(x[0], WORLD_X) && within(x[1], WORLD_Z);
/** A walk's target in version `v`: a node id, or a point in that version's units. */
const isTarget = (x: unknown, v: LiveV): x is Target =>
  isId(x) || (v === 1 ? Array.isArray(x) && x.length === 2 && isCoord(x[0]) && isCoord(x[1]) : isWorldPt(x));
const opt = <T>(o: Obj, k: string, ok: (x: unknown) => x is T): boolean => o[k] === undefined || ok(o[k]);
const oneOf = <T extends string>(list: readonly T[]) => (x: unknown): x is T => list.includes(x as T);

/** The intent in `o` (of version `v`), rebuilt from its known fields only (anything extra is dropped), or null. */
function intentOf(o: Obj, v: LiveV): Intent | null {
  switch (o.kind) {
    case 'walk':
      if (!isTarget(o.to, v) || !opt(o, 'at', isTime)) return null;
      return { kind: 'walk', to: o.to, ...(o.at !== undefined ? { at: o.at as number } : {}) };
    case 'act':
      if (!oneOf(ACTS)(o.act) || !opt(o, 'id', isId) || !opt(o, 'at', isTime) || (v === 1 && o.pt !== undefined) || !opt(o, 'pt', isWorldPt)) return null;
      return { kind: 'act', act: o.act, ...(o.id !== undefined ? { id: o.id as string } : {}), ...(o.at !== undefined ? { at: o.at as number } : {}), ...(o.pt !== undefined ? { pt: o.pt as Pt } : {}) };
    case 'catch':
      if (!isId(o.what) || !opt(o, 'id', isId)) return null;
      // where and how are the shared world's (v2)
      if (v === 1 && (o.at !== undefined || o.how !== undefined)) return null;
      if (!opt(o, 'at', isWorldPt) || !opt(o, 'how', oneOf(HOWS))) return null;
      return { kind: 'catch', what: o.what, ...(o.id !== undefined ? { id: o.id as string } : {}), ...(o.at !== undefined ? { at: o.at as Pt } : {}), ...(o.how !== undefined ? { how: o.how as How } : {}) };
    case 'pick':
      if (v === 1 || !isId(o.id) || !isWhat(o.what) || !opt(o, 'at', isWorldPt)) return null;
      return { kind: 'pick', id: o.id, what: o.what, ...(o.at !== undefined ? { at: o.at as Pt } : {}) };
    case 'put':
      if (v === 1 || !isId(o.id) || !isWhat(o.what) || !isWorldPt(o.at)) return null;
      return { kind: 'put', id: o.id, what: o.what, at: o.at };
    case 'shake':
      if (v === 1 || !isId(o.tree) || !oneOf(DROPS)(o.drop)) return null;
      return { kind: 'shake', tree: o.tree, drop: o.drop };
    case 'emote':
      if (typeof o.emote !== 'string' || !TOKEN.test(o.emote)) return null;
      return { kind: 'emote', emote: o.emote };
    case 'world':
      if (!oneOf(WORLD_OPS)(o.op) || !isId(o.id)) return null;
      return { kind: 'world', op: o.op, id: o.id };
    case 'saved':
      return { kind: 'saved' };
    default:
      return null;
  }
}

function parseObj(raw: unknown, versions: readonly number[] = [LIVE_V]): Obj | null {
  if (typeof raw !== 'string' || raw.length > MAX_BYTES) return null;
  try {
    const o: unknown = JSON.parse(raw);
    return isObj(o) && versions.includes(o.v as number) ? o : null;
  } catch {
    return null;
  }
}

/** A client message as the relay accepts it (any version in LIVE_VS, kept on it), or null (another version, too big,
 *  unknown kind or a bad field). */
export function parseClient(raw: unknown): ClientMsg | null {
  const o = parseObj(raw, LIVE_VS);
  if (!o) return null;
  const v = o.v as LiveV;
  if (o.kind === 'hello') {
    if (typeof o.key !== 'string' || !KEY.test(o.key) || !opt(o, 'since', isTime)) return null;
    return { v, kind: 'hello', key: o.key, ...(o.since !== undefined ? { since: o.since as number } : {}) };
  }
  if (o.kind === 'ping') return isTime(o.c) ? { v, kind: 'ping', c: o.c } : null;
  const i = intentOf(o, v);
  return i && { v, ...i };
}

/** The `v` of a message in a version the relay doesn't speak (that phone should reload, not keep sending), else null.
 *  @public (relay/) */
export function otherVersion(raw: unknown): number | null {
  if (typeof raw !== 'string' || raw.length > MAX_BYTES) return null;
  try {
    const o: unknown = JSON.parse(raw);
    return isObj(o) && typeof o.v === 'number' && !(LIVE_VS as readonly number[]).includes(o.v) ? o.v : null;
  } catch {
    return null;
  }
}

const isWho = (x: unknown): x is Who => x === 'A' || x === 'B';

/** A notice's fields from `o` (known fields only), or null. */
function noticeOf(o: Obj): Notice | null {
  if (!oneOf(NOTICE_WHAT)(o.what) || !isWho(o.who) || typeof o.at !== 'string' || !AT.test(o.at) || typeof o.rev !== 'string' || !REV.test(o.rev)) return null;
  return { what: o.what, who: o.who, at: o.at, rev: o.rev };
}

/** The body of a /notify POST as the relay accepts it (`{what, who, at, rev}`, ≤ MAX_BYTES), or null. @public (relay/) */
export function parseNotice(raw: unknown): Notice | null {
  if (typeof raw !== 'string' || raw.length > MAX_BYTES) return null;
  try {
    const o: unknown = JSON.parse(raw);
    return isObj(o) ? noticeOf(o) : null;
  } catch {
    return null;
  }
}

/** A relay message as the client accepts it, or null. */
export function parseServer(raw: unknown): ServerMsg | null {
  const o = parseObj(raw);
  if (!o || !isTime(o.t)) return null;
  const t = o.t;
  switch (o.kind) {
    case 'welcome':
      return isWho(o.me) && typeof o.peer === 'boolean' ? { v: LIVE_V, kind: 'welcome', me: o.me, peer: o.peer, t } : null;
    case 'pong':
      return isTime(o.c) ? { v: LIVE_V, kind: 'pong', c: o.c, t } : null;
    case 'presence':
      return isWho(o.who) && typeof o.on === 'boolean' ? { v: LIVE_V, kind: 'presence', who: o.who, on: o.on, t } : null;
    case 'changed': {
      const n = noticeOf(o);
      return n && { v: LIVE_V, kind: 'changed', ...n, t };
    }
  }
  if (!isWho(o.who)) return null;
  const i = intentOf(o, LIVE_V);
  return i && { ...i, v: LIVE_V, who: o.who, t };
}

// ---------- the shared world's day (docs/backend.md#shared-world) ----------

/** Tokyo's offset from UTC (no daylight saving): the island's day starts at Tokyo midnight. */
const TOKYO_MS = 9 * 3600_000;
const DAY_MS = 86_400_000;
/** The Tokyo day (days since the epoch) a relay time falls in: the room keeps one day's world. */
export const tokyoDay = (t: number): number => Math.floor((t + TOKYO_MS) / DAY_MS);
/** When Tokyo day `d` begins (ms since the epoch). */
export const dayStart = (d: number): number => d * DAY_MS - TOKYO_MS;

/** At most one wasp nest per tree per hour (NH), on both phones: the relay refuses a second within the hour. */
export const NEST_GAP_MS = 3600_000;

/** Whether the room keeps an intent in the day's world (replayed to a phone that opens later): the shared world's
 *  changes and each person's last walk (where their villager stands). */
export const isStored = (i: Intent): boolean =>
  i.kind === 'world' || i.kind === 'pick' || i.kind === 'put' || i.kind === 'shake' || i.kind === 'walk' || (i.kind === 'catch' && i.id !== undefined);

/** What an intent claims for the day, if anything: a critter (by its shared id), a thing on the ground, a thing put
 *  down. The first claim the relay hears wins; a later one of the same key is dropped (never relayed, never kept). */
export function claimOf(i: Intent): string | null {
  if (i.kind === 'catch') return i.id !== undefined ? `catch:${i.id}` : null;
  if (i.kind === 'pick' || i.kind === 'put') return `${i.kind}:${i.id}`;
  return null;
}
