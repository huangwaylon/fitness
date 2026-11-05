// The tent's room (docs/design.md "The tent", docs/backend.md#events `decor`, docs/decisions.md "Decor is a
// last-writer-wins map"): what either of us put in the tent, kept for good. The island's decor ops with a room scope
// (`sc: 't'`), in the same event type and the same relay intent: a piece set at a spot (`{sc, id, at, item, x, z, f, p}`:
// placed or moved, its whole state, x and z its footprint's back-left tile) or taken away (`{sc, id, at, rm: true}`,
// final), and the wallpaper and the floor (`{sc, id: TENT_WALL | TENT_FLOOR, at, item, x: 0, z: 0, f: 0, p}`, never
// removed); a small thing on another piece's surface (NH's table-top things) carries `on: <its id>`, and then x and z
// are its slot on that piece (its tile in the piece's own, unturned footprint) and f its facing on it, so the piece
// moving or turning carries it, in one op. The same merge as the island's: a removal beats everything, else the latest `at`, then G over B over A; the record
// keeps each id's latest op. Shared by the record (relay/src/store.ts), the model, the relay protocol and the tent; pure and
// dependency-free (the items themselves are the app's: components/tent/items.json).

/** At most this many pieces in the tent, shared (the rugs count; the wallpaper and the floor don't). */
export const TENT_MAX = 60;
/** The room's tiles across and deep (components/tent/grid.ts ROOM). */
const ROOM = 8;
/** The wallpaper's and the floor's ids: one op each, the latest wins. */
export const TENT_WALL = 'dtentwall';
export const TENT_FLOOR = 'dtentfloor';
/** NH's room light switch: item `r1` (on) or `r0` (off), x = z = f = 0. */
export const TENT_ROOM = 'dtentroom';

/** Who set it (the guest's tent pieces too): the merge's tie-break is a fixed order, A < B < G. */
type Who = 'A' | 'B' | 'G';
type Facing = 0 | 1 | 2 | 3;
/** The rooms (contract/layout.ts ROOM_SCOPE): `t` ウェイ's home (the tent's room, as it always was), `u` うめ's, `v` the
 *  guest's. Each its own room: its own ids, its own cap, the same ops. */
type Sc = 't' | 'u' | 'v';
const SCOPES: readonly string[] = ['t', 'u', 'v'];
export type TentOp =
  | { sc: Sc; id: string; at: number; item: string; x: number; z: number; f: Facing; p: number; on?: string; l?: 0 | 1; rm?: undefined; lt?: undefined }
  | { sc: Sc; id: string; at: number; rm: true; lt?: undefined }
  /** A light's switch alone (2026-11-05): piece `id`'s light on (1) or off (0), never its place; its own entry in the
   *  merge (tentKey), the later of it and the piece's own `l` is the light. */
  | { sc: Sc; id: string; at: number; lt: 0 | 1; rm?: undefined };
export type TentEntry = TentOp & { who: Who };
/** A piece in the tent as the room shows it. */
export interface TentPiece {
  id: string;
  item: string;
  x: number;
  z: number;
  f: Facing;
  p: number;
  at: number;
  who: Who;
  /** On this piece's surface (x, z its slot there, f its facing on it). */
  on?: string;
  /** A light's switch (a lamp, the lantern, the fireplace): 1 on, 0 off; none: as it came (on). */
  l?: 0 | 1;
}

const ID = /^d[0-9a-z]{6,24}$/;
/** An item's code (NH's internal id with its kind: f furniture or a rug, w a wallpaper, g a floor; r the room's light). */
const ITEM = /^[fwgr]\d{1,6}$/;
const isInt = (n: unknown, lo: number, hi: number): n is number => Number.isInteger(n) && (n as number) >= lo && (n as number) <= hi;
const isMs = (n: unknown): n is number => isInt(n, 1e12, 1e14);

/** A room op's data (`sc` one of t, u, v), its known keys only, each well-formed, or null. */
export function tentOpOf(d: Record<string, unknown>): TentOp | null {
  if (typeof d.sc !== 'string' || !SCOPES.includes(d.sc) || typeof d.id !== 'string' || !ID.test(d.id) || !isMs(d.at)) return null;
  const sc = d.sc as Sc;
  const keys = Object.keys(d);
  const surface = d.id === TENT_WALL ? 'w' : d.id === TENT_FLOOR ? 'g' : d.id === TENT_ROOM ? 'r' : null;
  if (d.rm !== undefined) {
    if (surface || d.rm !== true || keys.some((k) => k !== 'sc' && k !== 'id' && k !== 'at' && k !== 'rm')) return null;
    return { sc, id: d.id, at: d.at, rm: true };
  }
  if (d.lt !== undefined) {
    if (surface || (d.lt !== 0 && d.lt !== 1) || keys.some((k) => k !== 'sc' && k !== 'id' && k !== 'at' && k !== 'lt')) return null;
    return { sc, id: d.id, at: d.at, lt: d.lt };
  }
  if (keys.some((k) => !['sc', 'id', 'at', 'item', 'x', 'z', 'f', 'p', 'on', 'l'].includes(k))) return null;
  if (d.l !== undefined && (surface || (d.l !== 0 && d.l !== 1))) return null;
  if (surface === 'r' && d.item !== 'r0' && d.item !== 'r1') return null;
  if (d.on !== undefined && (surface || typeof d.on !== 'string' || !ID.test(d.on) || d.on === d.id)) return null;
  if (typeof d.item !== 'string' || !ITEM.test(d.item) || d.item[0] !== (surface ?? 'f')) return null;
  if (!isInt(d.x, 0, ROOM - 1) || !isInt(d.z, 0, ROOM - 1) || !isInt(d.f, 0, 3) || !isMs(d.p) || d.p > d.at) return null;
  if (surface && (d.x || d.z || d.f)) return null;
  return { sc, id: d.id, at: d.at, item: d.item, x: d.x, z: d.z, f: d.f as Facing, p: d.p, ...(d.on !== undefined ? { on: d.on as string } : {}), ...(d.l !== undefined ? { l: d.l as 0 | 1 } : {}) };
}

/** Whether entry `a` beats `b` (the same id): a removal beats a set; else the later `at`, then G over B over A. */
function tentBeats(a: TentEntry, b: TentEntry): boolean {
  if (!!a.rm !== !!b.rm) return !!a.rm;
  if (a.at !== b.at) return a.at > b.at;
  return a.who > b.who;
}

/** An entry's place in the merge: the piece's id, or its light switch's (`<id>/l`: a switch never beats a move). */
const tentKey = (e: Pick<TentOp, 'id' | 'lt'>): string => (e.lt === undefined ? e.id : `${e.id}/l`);

/** Merge an entry into the map (tentKey → its winning entry): true when it changed it. */
export function mergeTent(m: Map<string, TentEntry>, e: TentEntry): boolean {
  const k = tentKey(e);
  const was = m.get(k);
  if (was && (was === e || !tentBeats(e, was))) return false;
  m.set(k, e);
  return true;
}

const isSurface = (id: string) => id === TENT_WALL || id === TENT_FLOOR || id === TENT_ROOM;
/** Whether an entry is a piece in its room that counts toward TENT_MAX: set, not removed, not a light's switch nor a
 *  surface. @public (relay/src/store.ts) */
export const isTentPiece = (e: TentEntry): boolean => !e.rm && e.lt === undefined && !isSurface(e.id);

/** The room: every piece set and not removed (the oldest TENT_MAX by when they were first placed, then by id), and
 *  the wallpaper and the floor (null: the tent's own). */
export function tentLayout(entries: Iterable<TentEntry>): { pieces: TentPiece[]; wall: string | null; floor: string | null; lights: boolean } {
  const pieces: TentPiece[] = [];
  let wall: string | null = null, floor: string | null = null, lights = true;
  const all = [...entries];
  // each piece's light switch (its own op, the latest per piece)
  const switched = new Map<string, { at: number; l: 0 | 1 }>();
  for (const e of all) {
    if (e.lt === undefined) continue;
    const was = switched.get(e.id);
    if (!was || e.at > was.at) switched.set(e.id, { at: e.at, l: e.lt });
  }
  for (const e of all) {
    if (e.rm || e.lt !== undefined) continue;
    if (e.id === TENT_WALL) wall = e.item;
    else if (e.id === TENT_FLOOR) floor = e.item;
    else if (e.id === TENT_ROOM) lights = e.item === 'r1';
    else {
      // its switch's, unless the piece's own op says `l` (an older phone's whole state) later (a tie: the switch)
      const sw = switched.get(e.id);
      const l = sw && (e.l === undefined || sw.at >= e.at) ? sw.l : e.l;
      pieces.push({ id: e.id, item: e.item, x: e.x, z: e.z, f: e.f, p: e.p, at: e.at, who: e.who, ...(e.on ? { on: e.on } : {}), ...(l !== undefined ? { l } : {}) });
    }
  }
  pieces.sort((a, b) => a.p - b.p || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  return { pieces: pieces.slice(0, TENT_MAX), wall, floor, lights };
}

/** What the record does with a new op, given the tent's rows it holds: `stale` (an op that beats it is there; a light's
 *  switch of a piece the room doesn't hold, or holds removed), `full` (a new piece past the cap: refused) or `append`
 *  (the same entry's older rows are deleted: its slot, contract/record.ts eventSlot). `live`: the room's pieces
 *  (isTentPiece) when the caller counts them (the record's meta), so `held` need only hold the op's own rows. */
export function tentAccept(held: readonly TentEntry[], e: TentEntry, live?: number): 'append' | 'stale' | 'full' {
  held = held.filter((h) => h.sc === e.sc);
  const same = held.filter((h) => tentKey(h) === tentKey(e));
  if (same.some((h) => !tentBeats(e, h))) return 'stale';
  if (e.lt !== undefined) {
    const piece = new Map<string, TentEntry>();
    for (const h of held) if (h.id === e.id && h.lt === undefined) mergeTent(piece, h);
    const p = piece.get(e.id);
    return p && !p.rm && !isSurface(e.id) ? 'append' : 'stale';
  }
  if (!e.rm && !same.length && !isSurface(e.id)) {
    let n = live ?? 0;
    if (live === undefined) {
      const m = new Map<string, TentEntry>();
      for (const h of held) mergeTent(m, h);
      for (const h of m.values()) if (isTentPiece(h)) n++;
    }
    if (n >= TENT_MAX) return 'full';
  }
  return 'append';
}
