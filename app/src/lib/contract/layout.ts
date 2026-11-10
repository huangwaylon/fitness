// The island's layout ops (docs/island-layout.md "Ops"): the outdoors, the homes' looks and the homes' interiors as
// the decorations' `decor` event and relay intent with a scope `sc`, last writer wins per id. Shared by the record
// (relay/src/store.ts), the room (relay/src/room.ts), the model and the phones; pure and dependency-free (what the
// kinds and the tiles mean is the app's: lib/layout/).
//   o  an outdoor object set `{id, at, k, x, z, f, s?, on?}` or gone `{id, at, rm: true}` (not final: a later set is
//      back); `on`: it stands on that object's top (NH's table tops: lib/layout/tops.ts), x and z still its own tile
//   c  a terrain chunk `{id: 'c<cx>x<cz>', at, g}`: its 8 × 8 tiles row by row, one character each
//   r  a reset `{id: 'reset', at}`: every o and c op older than it is void (the default layout again)
//   h  a home's look `{id: 'hA' | 'hB' | 'hG', at, m, w?, r?, d?, f?}` (f its facing 0–3): its owner's alone
//   t, u, v  the interiors of ウェイ's, うめ's and the guest's homes (contract/tent.ts's ops): anyone's (2026-11-10)
import { isInt, isMs, only } from './ops.ts';

/** Who sent it: the merge's tie-break is a fixed order, A < B < G. */
type Who = 'A' | 'B' | 'G';
type Facing = 0 | 1 | 2 | 3;

/** Each home's interior scope by its owner (ウェイ's is the tent's room, `t`, as it always was). */
const ROOM_SCOPE = { A: 't', B: 'u', G: 'v' } as const;
type RoomScope = (typeof ROOM_SCOPE)[keyof typeof ROOM_SCOPE];
const ROOM_SCOPES: readonly RoomScope[] = ['t', 'u', 'v'];
export const isRoomScope = (sc: unknown): sc is RoomScope => (ROOM_SCOPES as readonly unknown[]).includes(sc);

/** A chunk's side (tiles) and how many chunks fit across and deep at most (the grid may grow up to this). */
const CHUNK = 8;
const CHUNKS_MAX = 16;
/** An object's tile at most (128 × 128 tiles: room for the grid to grow without a relay deploy). */
const TILES_MAX = CHUNK * CHUNKS_MAX - 1;
/** A tile's character: kind × 4 + tier, base 36 (lib/layout/grid.ts). */
const TILE_RE = /^[0-9a-z]{64}$/;
/** At most this many outdoor objects standing at once (the default's and ours; a removed one's row is kept, uncounted). */
export const LAYOUT_MAX = 1500;

/** An object's id: a default one's (world.ts's: `palm-1`, `fl:52:180`, `home-B`) or a new one (`o` + random). */
const OBJ_ID = /^[A-Za-z0-9][A-Za-z0-9:._-]{0,31}$/;
const CHUNK_ID = /^c(?:[0-9]|1[0-5])x(?:[0-9]|1[0-5])$/;
const HOME_ID = /^h[ABG]$/;
const TOKEN = /^[a-z][a-z0-9-]{0,23}$/;
/** A home part (homes.json's ids: `NABrickC`, `SimpleAR`). */
const PART = /^[A-Za-z0-9.]{1,24}$/;


type ObjOp =
  | { sc: 'o'; id: string; at: number; k: string; x: number; z: number; f: Facing; s?: string; on?: string; rm?: undefined }
  | { sc: 'o'; id: string; at: number; rm: true };
interface ChunkOp { sc: 'c'; id: string; at: number; g: string }
interface ResetOp { sc: 'r'; id: 'reset'; at: number }
interface HomeOp { sc: 'h'; id: 'hA' | 'hB' | 'hG'; at: number; m: string; w?: string; r?: string; d?: string; f?: Facing }
export type LayoutOp = ObjOp | ChunkOp | ResetOp | HomeOp;
export type LayoutEntry = LayoutOp & { who: Who };

/** A layout op's data (`sc` one of o, c, r, h), its known keys only, each well-formed, or null. */
export function layoutOpOf(d: Record<string, unknown>): LayoutOp | null {
  if (typeof d.id !== 'string' || !isMs(d.at)) return null;
  switch (d.sc) {
    case 'o': {
      if (!OBJ_ID.test(d.id)) return null;
      if (d.rm !== undefined) return d.rm === true && only(d, ['sc', 'id', 'at', 'rm']) ? { sc: 'o', id: d.id, at: d.at, rm: true } : null;
      if (!only(d, ['sc', 'id', 'at', 'k', 'x', 'z', 'f', 's', 'on'])) return null;
      if (typeof d.k !== 'string' || !TOKEN.test(d.k) || !isInt(d.x, 0, TILES_MAX) || !isInt(d.z, 0, TILES_MAX) || !isInt(d.f, 0, 3)) return null;
      if (d.s !== undefined && (typeof d.s !== 'string' || !TOKEN.test(d.s))) return null;
      if (d.on !== undefined && (typeof d.on !== 'string' || !OBJ_ID.test(d.on) || d.on === d.id)) return null;
      return { sc: 'o', id: d.id, at: d.at, k: d.k, x: d.x, z: d.z, f: d.f as Facing, ...(d.s !== undefined ? { s: d.s as string } : {}), ...(d.on !== undefined ? { on: d.on as string } : {}) };
    }
    case 'c':
      if (!CHUNK_ID.test(d.id) || !only(d, ['sc', 'id', 'at', 'g']) || typeof d.g !== 'string' || !TILE_RE.test(d.g)) return null;
      return { sc: 'c', id: d.id, at: d.at, g: d.g };
    case 'r':
      return d.id === 'reset' && only(d, ['sc', 'id', 'at']) ? { sc: 'r', id: 'reset', at: d.at } : null;
    case 'h': {
      if (!HOME_ID.test(d.id) || !only(d, ['sc', 'id', 'at', 'm', 'w', 'r', 'd', 'f'])) return null;
      if (typeof d.m !== 'string' || !TOKEN.test(d.m) || (d.f !== undefined && !isInt(d.f, 0, 3))) return null;
      for (const k of ['w', 'r', 'd'] as const) if (d[k] !== undefined && (typeof d[k] !== 'string' || !PART.test(d[k] as string))) return null;
      return {
        sc: 'h', id: d.id as HomeOp['id'], at: d.at, m: d.m,
        ...(d.w !== undefined ? { w: d.w as string } : {}), ...(d.r !== undefined ? { r: d.r as string } : {}), ...(d.d !== undefined ? { d: d.d as string } : {}),
        ...(d.f !== undefined ? { f: d.f as Facing } : {})
      };
    }
    default:
      return null;
  }
}

/** Whether `who` may write a `decor` op of this data's scope (docs/island-layout.md "Ops"): the outdoors and the
 *  island's decorations (no scope) anyone, the guest too (2026-11-06: the island is everyone's alike); a home's look its
 *  owner alone; every home's interior anyone's, the guest too (2026-11-10: each of us arranges any room; was its
 *  owner's, the tent's all three). The record and the room both apply it. */
export function scopeMayWrite(who: Who, d: Record<string, unknown>): boolean {
  switch (d.sc) {
    case undefined:
    case 'o':
    case 'c':
    case 'r':
    case 't':
    case 'u':
    case 'v':
      return true;
    case 'h':
      return d.id === `h${who}`;
    default:
      return false;
  }
}

/** Whether entry `a` beats `b` (the same scope and id): the later `at`; at the same time a removal, then G over B over A. */
function layoutBeats(a: LayoutEntry, b: LayoutEntry): boolean {
  if (a.at !== b.at) return a.at > b.at;
  const ra = 'rm' in a && !!a.rm, rb = 'rm' in b && !!b.rm;
  if (ra !== rb) return ra;
  return a.who > b.who;
}

/** An entry's key in the merged map. */
const layoutKey = (e: Pick<LayoutOp, 'sc' | 'id'>): string => `${e.sc}|${e.id}`;

/** Merge an entry into the map (key → its winning entry): true when it changed it. */
export function mergeLayout(m: Map<string, LayoutEntry>, e: LayoutEntry): boolean {
  const k = layoutKey(e), was = m.get(k);
  if (was && (was === e || !layoutBeats(e, was))) return false;
  m.set(k, e);
  return true;
}

/** The reset in force (its `at`, 0 for none). */
export function resetAt(m: ReadonlyMap<string, LayoutEntry>): number {
  return m.get('r|reset')?.at ?? 0;
}

/** Whether an entry is void (an object or a chunk older than the reset). */
export const isVoid = (e: LayoutEntry, reset: number): boolean => (e.sc === 'o' || e.sc === 'c') && e.at <= reset;

/** Whether an entry is a piece standing outdoors: an object set, not removed, not void by the reset. @public
 *  (relay/src/store.ts) */
export const isStanding = (e: LayoutEntry, reset: number): boolean => e.sc === 'o' && !e.rm && !isVoid(e, reset);

/** What the record does with a new op, given the layout rows it holds: `stale` (an op that beats it is there, or a
 *  reset voids it: acknowledged, nothing appended), `full` (a piece put down past LAYOUT_MAX standing: refused) or
 *  `append` (the same id's older rows are replaced). The cap counts the pieces standing (isStanding), never a removed
 *  one's row (2026-11-05: counted, ~1,450 removals made every placement full): a removal is never refused, and a
 *  removed piece put back counts as a new one. `standing`: that count when the caller keeps it (the record's meta:
 *  relay/src/store.ts), so `held` need only hold the op's own id's rows and the reset. */
export function layoutAccept(held: readonly LayoutEntry[], e: LayoutEntry, standing?: number): 'append' | 'stale' | 'full' {
  const m = new Map<string, LayoutEntry>();
  for (const h of held) mergeLayout(m, h);
  const was = m.get(layoutKey(e));
  if (was && !layoutBeats(e, was)) return 'stale';
  const reset = resetAt(m);
  if (isVoid(e, reset)) return 'stale';
  if (isStanding(e, reset) && !(was && isStanding(was, reset))) {
    let n = standing ?? 0;
    if (standing === undefined) for (const h of m.values()) if (isStanding(h, reset)) n++;
    if (n >= LAYOUT_MAX) return 'full';
  }
  return 'append';
}
