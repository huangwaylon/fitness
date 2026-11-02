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
/** Anything longer is dropped unread by both sides (but a `replay`, the relay's day in one message: REPLAY_BYTES). */
export const MAX_BYTES = 256;
/** A `replay` message (relay → client): today's world in as few messages as this allows. @public (relay/) */
export const REPLAY_BYTES = 16_000;
/** A walk's waypoints between `from` and `to` (more: the receiver plans the way itself). */
export const VIA_MAX = 10;
/** A walk takes at most this long (ms). @public (relay/) */
export const WALK_MS_MAX = 60_000;

/**
 * The world's extent (world units): a v2 walk's point lies within it. island/world.ts PLAN lies inside it (its test):
 * the two-section island's plan is shorter than the extent the deployed relay checks, which stays as it was. Here
 * because the Worker bundles this file alone (and sync/ may not import components/).
 */
export const WORLD_X = [-230, 620] as const;
export const WORLD_Z = [-460, 2650] as const;

export type Who = 'A' | 'B';

/** What my villager did with a tap (the partner's villager plays it too: the tool, the motion): `id` names the thing (a
 *  bush, the rock, a shadow being cast at), `pt` where it is (a world point). `wake`: a dozing villager woke (`id` whose,
 *  A or B; `at` when, the relay's clock): it is awake on both phones for the same 10 s. */
export const ACTS = ['weed', 'water', 'dig', 'shake', 'fruit', 'present', 'cast', 'net', 'talk', 'visitor', 'star', 'tap', 'bush', 'rock', 'wake'] as const;
export type Act = (typeof ACTS)[number];

/** A change to the shared island (docs/backend.md#shared-world): `watered` a flower (world.ts FLOWERS id), `wished` on a
 *  shooting star (its id the morning the fragment comes), `woke` a sleeping visitor woken for the day (its id:
 *  `gulliver`), the rest kept for older phones. */
export const WORLD_OPS = ['weed-pulled', 'fruit-collected', 'dug', 'present-opened', 'watered', 'shaken', 'wished', 'woke'] as const;
export type WorldOp = (typeof WORLD_OPS)[number];

/** How a critter left the island (a `catch`): netted, reeled in, dived for, dug up (a mole cricket), netted out of the
 *  air (a wasp), or it got away (`flee`: startled, a fish spooked, a quick one out of reach). */
export const HOWS = ['net', 'rod', 'dive', 'dig', 'swarm', 'flee'] as const;
export type How = (typeof HOWS)[number];

/** What a shaken tree dropped (a `shake`): nothing, a branch, a wasp nest, a bagworm or a spider on its thread,
 *  coconuts (a palm's). */
export const DROPS = ['none', 'branch', 'nest', 'bagworm', 'spider', 'coconut'] as const;
export type Drop = (typeof DROPS)[number];

/** Which way a villager faces at a walk's end: as drawn (toward the camera), toward the island's middle, left, right.
 *  @public (relay/) */
export const FACES = ['home', 'in', 'l', 'r'] as const;
/** @public (relay/) */
export type Face = (typeof FACES)[number];

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
  /** A villager's walk (v2): to `to`; with `from`, `via` (the waypoints between, ≤ VIA_MAX), `s` (when it set off, the
   *  relay's clock) and `ms` (how long it takes; 0: put there), the partner's phone plays the very same walk at the same
   *  time (docs/backend.md#shared-world "Villagers"), facing `f` at the end. */
  | { kind: 'walk'; to: Target; at?: number; from?: Pt; via?: Pt[]; s?: number; ms?: number; f?: Face }
  | { kind: 'act'; act: Act; id?: string; at?: number; pt?: Pt }
  | { kind: 'catch'; what: string; id?: string; at?: Pt; how?: How }
  | { kind: 'pick'; id: string; what: string; at?: Pt }
  | { kind: 'put'; id: string; what: string; at: Pt }
  /** `at`: when the shaker's phone shook it (its own clock), the shake's identity on both phones and in the sheet's
   *  day row, so a shake heard twice (the relay, the row) is one. */
  | { kind: 'shake'; tree: string; drop: Drop; at?: number }
  | { kind: 'emote'; emote: string }
  | { kind: 'world'; op: WorldOp; id: string }
  /** I just wrote rows to the sheet (an event was acked): the partner refetches the snapshot now. */
  | { kind: 'saved' }
  /** An island decoration set (placed or moved: its whole state) or removed (`rm`), contract/decor.ts's op; `at` the
   *  sender's relay clock. Kept by the room for the day; the sheet keeps it for good. */
  | ({ kind: 'decor' } & DecorWire)
  /** A piece of the tent's furniture being dragged (presence only: relayed to the partner while they're there, never
   *  kept, replayed or written; the drop is its `decor` op): where the finger has it now (`x`, `z` model units of the
   *  room, the piece's middle), its facing, `it` the item when it isn't placed yet, `end` when the finger let go. */
  | { kind: 'drag'; id: string; x: number; z: number; f: number; it?: string; end?: true }
  /** My villager in the tent (presence only, like a drag): `in` whether it's inside; a walk there (`from` → `via` → `to`,
   *  model units of the room, set off at `s` on the relay's clock, `ms` long), or where it stands (`to` alone). */
  | { kind: 'tent'; in: boolean; to?: Pt; from?: Pt; via?: Pt[]; s?: number; ms?: number }
  /** A phrase my villager says (v2; docs/design.md "Villager taps"): its speech balloon over it on both phones for a
   *  few seconds. Presence only: never kept, never replayed, never in the sheet. `text` as cleanSay leaves it. */
  | { kind: 'say'; text: string };

/** A decor op on the wire (contract/decor.ts DecorOp, or the tent's with `sc: 't'`, contract/tent.ts; checked here
 *  again: the Worker bundles this file alone). */
type DecorWire =
  | { sc?: 't'; id: string; at: number; item: string; x: number; z: number; f: number; p: number; rm?: undefined }
  | { sc?: 't'; id: string; at: number; rm: true };

/** Client → relay. `hello` must come first (the person key; `since` = the last world event's `t` it has seen; `batch`:
 *  the day's world as `replay` messages, mine included). An intent's `c` (this phone's sequence number, increasing
 *  through the day) asks for an `ack`, and makes a resend of it (after a reconnect) the same intent, not a second. */
export type ClientMsg =
  | { v: LiveV; kind: 'hello'; key: string; since?: number; batch?: true }
  | { v: LiveV; kind: 'ping'; c: number }
  | ({ v: LiveV; c?: number } & Intent);

/** An intent as relayed: who sent it and the relay's clock when it arrived (ms since the epoch). */
export type Relayed = Intent & { v: LiveV; who: Who; t: number };

/** Relay → client. `ack`: my intent `c` reached the room at `t` (`ok` false: refused, a claim already made, a nest too
 *  soon, a walk older than one it holds). `replay`: today's world since the hello's `since`, in the room's order. */
export type ServerMsg =
  | { v: LiveV; kind: 'welcome'; me: Who; peer: boolean; t: number; rec?: RecordMark }
  | { v: LiveV; kind: 'pong'; c: number; t: number }
  | { v: LiveV; kind: 'ack'; c: number; t: number; ok: boolean }
  | { v: LiveV; kind: 'replay'; es: Relayed[]; t: number }
  | { v: LiveV; kind: 'presence'; who: Who; on: boolean; t: number }
  | ({ v: LiveV; kind: 'changed'; t: number } & Notice)
  | Relayed;

/** The record's last change the room heard of (`welcome.rec`): a phone whose cache has it (same `rev`, `at` ≤ its
 *  `since`) needn't fetch on opening. @public (relay/) */
export interface RecordMark { at: string; rev: string }

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
/** A decoration's id and its item (contract/decor.ts: the item list is the app's; any token here). */
const DECOR_ID = /^d[0-9a-z]{6,24}$/;
/** The tent's room: its tiles (a `decor` op's x and z with `sc: 't'`) and its extent in model units (a drag, a walk). */
const TENT_TILES = [0, 7] as const;
const TENT_U = [-40, 40] as const;
const isTentPt = (x: unknown): x is Pt => Array.isArray(x) && x.length === 2 && within(x[0], TENT_U) && within(x[1], TENT_U);

/** A phrase's length at most (code points; NH's balloon scale). */
export const SAY_MAX = 20;
/** What a phrase never carries: control characters (a newline, a tab: a space), line and paragraph separators, bidi
 *  controls, invisible spaces, lone surrogates. (The emoji joiner and the variation selectors stay: emoji need them.) */
const SAY_BREAK = /[\t\n\v\f\r\u0085\u2028\u2029]/gu;
const SAY_STRIP = /[\p{Cc}\p{Cs}\u00AD\u061C\u180E\u200B\u200E\u200F\u202A-\u202E\u2060-\u2064\u2066-\u206F\uFEFF\uFFF9-\uFFFB]/gu;

/** A phrase as both phones and the relay keep it: NFC, every control and invisible character out (a run of blanks one
 *  space), trimmed, at most SAY_MAX code points; null when nothing is left (or it isn't text). */
export function cleanSay(s: unknown): string | null {
  if (typeof s !== 'string' || s.length > 4 * MAX_BYTES) return null;
  const t = s.normalize('NFC').replace(SAY_BREAK, ' ').replace(SAY_STRIP, '').replace(/\s{2,}/gu, ' ').trim();
  return Array.from(t).slice(0, SAY_MAX).join('').trim() || null;
}

type Obj = Record<string, unknown>;
const isObj = (x: unknown): x is Obj => typeof x === 'object' && x !== null && !Array.isArray(x);
const isTime = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x) && x >= 0 && x < 1e14;
const isId = (x: unknown): x is string => typeof x === 'string' && ID.test(x);
const isWhat = (x: unknown): x is string => typeof x === 'string' && WHAT.test(x);
const isSeq = (x: unknown): x is number => Number.isInteger(x) && (x as number) > 0 && (x as number) < 1e15;
const isCoord = (x: unknown): x is number => Number.isInteger(x) && Math.abs(x as number) <= 100_000;
const within = (x: unknown, [lo, hi]: readonly [number, number]): boolean => Number.isInteger(x) && (x as number) >= lo && (x as number) <= hi;
/** A world point within the plan's extent. @public (tests) */
export const isWorldPt = (x: unknown): x is readonly [number, number] =>
  Array.isArray(x) && x.length === 2 && within(x[0], WORLD_X) && within(x[1], WORLD_Z);
/** A walk's target in version `v`: a node id, or a point in that version's units. */
const isTarget = (x: unknown, v: LiveV): x is Target =>
  isId(x) || (v === 1 ? Array.isArray(x) && x.length === 2 && isCoord(x[0]) && isCoord(x[1]) : isWorldPt(x));
const isWalkMs = (x: unknown): x is number => Number.isInteger(x) && (x as number) >= 0 && (x as number) <= WALK_MS_MAX;
const isVia = (x: unknown): x is Pt[] => Array.isArray(x) && x.length <= VIA_MAX && x.every(isWorldPt);
const opt = <T>(o: Obj, k: string, ok: (x: unknown) => x is T): boolean => o[k] === undefined || ok(o[k]);
const oneOf = <T extends string>(list: readonly T[]) => (x: unknown): x is T => list.includes(x as T);

/** The intent in `o` (of version `v`), rebuilt from its known fields only (anything extra is dropped), or null. */
function intentOf(o: Obj, v: LiveV): Intent | null {
  switch (o.kind) {
    case 'walk': {
      if (!isTarget(o.to, v) || !opt(o, 'at', isTime)) return null;
      // the very walk (v2): where from, the way, when and how long
      if (v === 1 && (o.from !== undefined || o.via !== undefined || o.s !== undefined || o.ms !== undefined || o.f !== undefined)) return null;
      if ((o.from !== undefined && !isWorldPt(o.from)) || !opt(o, 's', isTime) || !opt(o, 'ms', isWalkMs) || !opt(o, 'via', isVia) || !opt(o, 'f', oneOf(FACES))) return null;
      return {
        kind: 'walk', to: o.to, ...(o.at !== undefined ? { at: o.at as number } : {}), ...(o.from !== undefined ? { from: o.from as Pt } : {}),
        ...(o.via !== undefined ? { via: o.via as Pt[] } : {}), ...(o.s !== undefined ? { s: o.s as number } : {}), ...(o.ms !== undefined ? { ms: o.ms as number } : {}),
        ...(o.f !== undefined ? { f: o.f as Face } : {})
      };
    }
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
      if (v === 1 || !isId(o.tree) || !oneOf(DROPS)(o.drop) || !opt(o, 'at', isTime)) return null;
      return { kind: 'shake', tree: o.tree, drop: o.drop, ...(o.at !== undefined ? { at: o.at as number } : {}) };
    case 'emote':
      if (typeof o.emote !== 'string' || !TOKEN.test(o.emote)) return null;
      return { kind: 'emote', emote: o.emote };
    case 'world':
      if (!oneOf(WORLD_OPS)(o.op) || !isId(o.id)) return null;
      return { kind: 'world', op: o.op, id: o.id };
    case 'saved':
      return { kind: 'saved' };
    case 'decor': {
      if (v === 1 || typeof o.id !== 'string' || !DECOR_ID.test(o.id) || !isTime(o.at) || (o.sc !== undefined && o.sc !== 't')) return null;
      const sc = o.sc === 't' ? { sc: 't' as const } : {};
      if (o.rm !== undefined) return o.rm === true ? { kind: 'decor', ...sc, id: o.id, at: o.at, rm: true } : null;
      const [xs, zs] = o.sc === 't' ? [TENT_TILES, TENT_TILES] : [WORLD_X, WORLD_Z];
      if (typeof o.item !== 'string' || !TOKEN.test(o.item) || !within(o.x, xs) || !within(o.z, zs) || !within(o.f, [0, 3]) || !isTime(o.p)) return null;
      return { kind: 'decor', ...sc, id: o.id, at: o.at, item: o.item, x: o.x as number, z: o.z as number, f: o.f as number, p: o.p };
    }
    case 'drag':
      if (v === 1 || typeof o.id !== 'string' || !DECOR_ID.test(o.id) || !within(o.x, TENT_U) || !within(o.z, TENT_U) || !within(o.f, [0, 3])) return null;
      if ((o.it !== undefined && (typeof o.it !== 'string' || !TOKEN.test(o.it))) || (o.end !== undefined && o.end !== true)) return null;
      return { kind: 'drag', id: o.id, x: o.x as number, z: o.z as number, f: o.f as number, ...(o.it !== undefined ? { it: o.it as string } : {}), ...(o.end ? { end: true as const } : {}) };
    case 'tent':
      if (v === 1 || typeof o.in !== 'boolean' || !opt(o, 'to', isTentPt) || (o.from !== undefined && !isTentPt(o.from)) || !opt(o, 's', isTime) || !opt(o, 'ms', isWalkMs)) return null;
      if (o.via !== undefined && !(Array.isArray(o.via) && o.via.length <= VIA_MAX && o.via.every(isTentPt))) return null;
      return {
        kind: 'tent', in: o.in, ...(o.to !== undefined ? { to: o.to as Pt } : {}), ...(o.from !== undefined ? { from: o.from as Pt } : {}),
        ...(o.via !== undefined ? { via: o.via as Pt[] } : {}), ...(o.s !== undefined ? { s: o.s as number } : {}), ...(o.ms !== undefined ? { ms: o.ms as number } : {})
      };
    case 'say': {
      const text = v === 1 ? null : cleanSay(o.text);
      return text ? { kind: 'say', text } : null;
    }
    default:
      return null;
  }
}

function parseObj(raw: unknown, versions: readonly number[] = [LIVE_V], max = MAX_BYTES): Obj | null {
  if (typeof raw !== 'string' || raw.length > max) return null;
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
    if (typeof o.key !== 'string' || !KEY.test(o.key) || !opt(o, 'since', isTime) || (o.batch !== undefined && o.batch !== true)) return null;
    return { v, kind: 'hello', key: o.key, ...(o.since !== undefined ? { since: o.since as number } : {}), ...(o.batch ? { batch: true as const } : {}) };
  }
  if (o.kind === 'ping') return isTime(o.c) ? { v, kind: 'ping', c: o.c } : null;
  if (!opt(o, 'c', isSeq)) return null;
  const i = intentOf(o, v);
  return i && { v, ...(o.c !== undefined ? { c: o.c as number } : {}), ...i };
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

/** A relayed intent from `o`, or null. */
function relayedOf(o: unknown): Relayed | null {
  if (!isObj(o) || !isWho(o.who) || !isTime(o.t)) return null;
  const i = intentOf(o, LIVE_V);
  return i && { ...i, v: LIVE_V, who: o.who, t: o.t };
}

/** A relay message as the client accepts it, or null. A `replay` may be longer (≤ REPLAY_BYTES); its events that don't
 *  parse are left out. */
export function parseServer(raw: unknown): ServerMsg | null {
  const big = typeof raw === 'string' && raw.length > MAX_BYTES && raw.includes('"kind":"replay"');
  const o = parseObj(raw, [LIVE_V], big ? REPLAY_BYTES : MAX_BYTES);
  if (!o || !isTime(o.t)) return null;
  const t = o.t;
  if (big && o.kind !== 'replay') return null;
  switch (o.kind) {
    case 'ack':
      return isSeq(o.c) && typeof o.ok === 'boolean' ? { v: LIVE_V, kind: 'ack', c: o.c, t, ok: o.ok } : null;
    case 'replay':
      return Array.isArray(o.es) ? { v: LIVE_V, kind: 'replay', es: o.es.map(relayedOf).filter((e): e is Relayed => !!e), t } : null;
    case 'welcome': {
      if (!isWho(o.me) || typeof o.peer !== 'boolean') return null;
      const rec = isObj(o.rec) ? noticeOf({ ...o.rec, what: 'event', who: o.me }) : null;
      return { v: LIVE_V, kind: 'welcome', me: o.me, peer: o.peer, t, ...(rec ? { rec: { at: rec.at, rev: rec.rev } } : {}) };
    }
    case 'pong':
      return isTime(o.c) ? { v: LIVE_V, kind: 'pong', c: o.c, t } : null;
    case 'presence':
      return isWho(o.who) && typeof o.on === 'boolean' ? { v: LIVE_V, kind: 'presence', who: o.who, on: o.on, t } : null;
    case 'changed': {
      const n = noticeOf(o);
      return n && { v: LIVE_V, kind: 'changed', ...n, t };
    }
  }
  return relayedOf(o);
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
  i.kind === 'world' || i.kind === 'decor' || i.kind === 'pick' || i.kind === 'put' || i.kind === 'shake' || i.kind === 'walk' || (i.kind === 'catch' && i.id !== undefined);

/** What an intent claims for the day, if anything: a critter (by its shared id), a thing on the ground, a thing put
 *  down. The first claim the relay hears wins; a later one of the same key is dropped (never relayed, never kept). */
export function claimOf(i: Intent): string | null {
  if (i.kind === 'catch') return i.id !== undefined ? `catch:${i.id}` : null;
  if (i.kind === 'pick' || i.kind === 'put') return `${i.kind}:${i.id}`;
  return null;
}
