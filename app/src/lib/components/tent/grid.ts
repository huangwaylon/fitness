// The tent's floor plan (docs/design.md "The tent"), pure: NH's largest room, the main room fully expanded, 8 × 8
// tiles of 10 model units (RoomMdlFloor8x8: −40…40 across and deep), the door in the middle of the front edge; a
// smaller room (NH's 6 × 6 house, 4 × 4 tent: contract/tent.ts ROOM_SIZES) is a square of those tiles against the same
// front wall, its middle tiles across (Bounds), so a piece's tiles never change with the size. What
// may stand where (a piece on its whole tiles, inside the room, off the door's tiles, not over another piece; a rug
// under the furniture, never over another rug) and how a villager walks (A* on a half-tile grid round the furniture,
// the corners pulled straight).
import { footprint, ITEMS } from './items.ts';
import { ROOM_DEFAULT, type RoomSize } from '#lib/contract/tent.ts';

/** Tiles across and deep. */
export const ROOM = 8;
/** A tile's side (model units). */
export const TILE = 10;
/** The room's half extent (model units): x and z run −HALF…HALF, z toward the camera (the door's side). */
export const HALF = (ROOM * TILE) / 2;
/** The door's tiles (the front row's middle two): kept clear, the way in and out. */
export const DOOR_TILES: readonly (readonly [number, number])[] = [[3, ROOM - 1], [4, ROOM - 1]];
/** Where a villager comes in (just inside the door) and how far from the walls it keeps (model units). */
export const DOOR_IN: readonly [number, number] = [0, HALF - 6];
const WALL_PAD = 3;

/** A room of `n` tiles a side within the largest one's tiles: x0 ≤ x < x1, z0 ≤ z < z1 (the front row, z 7, always). */
export interface Bounds {
  n: RoomSize;
  x0: number;
  x1: number;
  z0: number;
  z1: number;
}
export function boundsOf(n: RoomSize): Bounds {
  const x0 = (ROOM - n) / 2;
  return { n, x0, x1: x0 + n, z0: ROOM - n, z1: ROOM };
}
/** The largest room (a room with no size: every room before 2026-11-09). */
export const FULL = boundsOf(ROOM_DEFAULT);
/** The room's floor in model units: [x0, x1, z0, z1]. */
export const rectOf = (b: Bounds): [number, number, number, number] => [-HALF + b.x0 * TILE, -HALF + b.x1 * TILE, -HALF + b.z0 * TILE, -HALF + b.z1 * TILE];
/** The tiles along wall `f` (its spot's x: from the largest room's wall's left end as one faces it) that this room's
 *  wall spans: the back and front ones its x tiles, the left one (its left end at the front) 0…n, the right one its z. */
export function wallSpan(f: number, b: Bounds): [number, number] {
  return f === 1 ? [ROOM - b.z1, ROOM - b.z0] : f === 2 ? [b.z0, b.z1] : [b.x0, b.x1];
}
/** Where wall `f`'s middle is along it (model units from the largest room's wall's left end): its spots' u less this
 *  is across from the wall's own middle. */
export const wallMid = (f: number, b: Bounds): number => ((wallSpan(f, b)[0] + wallSpan(f, b)[1]) / 2) * TILE;

export type Facing = 0 | 1 | 2 | 3;
/** A piece in the room: its item, its footprint's back-left tile (x across, z deep, after turning) and its facing. */
export interface Spot {
  id?: string;
  item: string;
  x: number;
  z: number;
  f: Facing;
  /** On this piece's surface (then x and z are its slot there, f its facing on it). */
  on?: string;
}

export type Why = 'out' | 'door' | 'taken' | 'rug' | 'top';

/** The tiles a piece covers. */
export function tilesOf(s: Spot): [number, number][] {
  const [w, d] = footprint(s.item, s.f);
  const out: [number, number][] = [];
  for (let i = 0; i < w; i++) for (let j = 0; j < d; j++) out.push([s.x + i, s.z + j]);
  return out;
}

/** A piece's centre in model units (x, z). */
export function centreOf(s: Pick<Spot, 'item' | 'x' | 'z' | 'f'>): [number, number] {
  const [w, d] = footprint(s.item, s.f);
  return [-HALF + (s.x + w / 2) * TILE, -HALF + (s.z + d / 2) * TILE];
}

/** The footprint's back-left tile that puts a piece's centre nearest model point (px, pz), inside the room. */
export function snapTo(item: string, f: Facing, px: number, pz: number, b: Bounds = FULL): [number, number] {
  const [w, d] = footprint(item, f);
  const x = Math.round((px + HALF) / TILE - w / 2), z = Math.round((pz + HALF) / TILE - d / 2);
  return [Math.min(b.x1 - w, Math.max(b.x0, x)), Math.min(b.z1 - d, Math.max(b.z0, z))];
}

const isRug = (item: string) => !!ITEMS[item]?.rug;
/** NH's surface: small things stand on its top. */
export const isSurface = (item: string): boolean => !!ITEMS[item]?.s && !ITEMS[item]?.rug;
/** On a wall (NH's wall-mounted things): its spot is the wall's (x across it, z its height step, f which wall). */
export const isWallItem = (item: string): boolean => !!ITEMS[item]?.wl;
/** The walls: 0 the back, 1 the left, 2 the right, 3 the front (the door's). */
const WALLS_N = 4;
/** A wall's height steps (model units): a wall thing's bottom at WALL_FOOT + z × WALL_STEP. */
const WALL_H = 40, WALL_FOOT = 2, WALL_STEP = 5;
/** The highest step a wall thing of height h may take (its top under the wall's). */
export const wallSteps = (item: string): number => Math.max(0, Math.floor((WALL_H - 1 - WALL_FOOT - (ITEMS[item]?.h ?? 5)) / WALL_STEP));
/** A wall thing's middle on its wall: across (model units from the wall's left end, as one faces it) and up. */
export function wallSpot(s: Pick<Spot, 'item' | 'x' | 'z'>): [number, number] {
  const m = ITEMS[s.item], w = m?.w ?? 1, h = m?.h ?? 5;
  return [(s.x + w / 2) * TILE, WALL_FOOT + s.z * WALL_STEP + h / 2];
}
/** The step and tile that put a wall thing's middle nearest (u across, y up) on its wall. */
export function wallSnap(item: string, u: number, y: number, wall = 0, b: Bounds = FULL): [number, number] {
  const m = ITEMS[item], w = m?.w ?? 1, h = m?.h ?? 5, [lo, hi] = wallSpan(wall, b);
  const x = Math.round(u / TILE - w / 2), z = Math.round((y - h / 2 - WALL_FOOT) / WALL_STEP);
  return [Math.min(hi - w, Math.max(lo, x)), Math.min(wallSteps(item), Math.max(0, z))];
}
/** Why a wall thing can't hang there (null: it can): off the wall, over the door, over another wall thing. */
export function wallWhy(others: readonly Spot[], s: Spot, b: Bounds = FULL): Why | null {
  const m = ITEMS[s.item], w = m?.w ?? 1, h = m?.h ?? 5;
  if (s.f < 0 || s.f >= WALLS_N) return 'out';
  const [lo, hi] = wallSpan(s.f, b);
  if (s.x < lo || s.x + w > hi || s.z < 0 || s.z > wallSteps(s.item)) return 'out';
  const y0 = WALL_FOOT + s.z * WALL_STEP, y1 = y0 + h;
  // the front wall's door: tiles 3–4, three tiles high
  if (s.f === 3 && s.x < 5 && s.x + w > 3 && y0 < 30) return 'door';
  for (const o of others) {
    if ((s.id && o.id === s.id) || !isWallItem(o.item) || o.f !== s.f) continue;
    const ow = ITEMS[o.item]?.w ?? 1, oy0 = WALL_FOOT + o.z * WALL_STEP, oy1 = oy0 + (ITEMS[o.item]?.h ?? 5);
    if (s.x < o.x + ow && o.x < s.x + w && y0 < oy1 && oy0 < y1) return 'taken';
  }
  return null;
}

/** A small thing that may stand on a surface: NH's miscellaneous (a 2 × 1 one, a 50-inch TV, on two tiles of it). */
export const isSmall = (item: string): boolean => !!ITEMS[item]?.sm && !ITEMS[item]?.wl && !ITEMS[item]?.rug;

// ---- surfaces: a small thing's slot on a piece is a tile of the piece's own (unturned) footprint (a bigger one's:
//      its back-left tile there); its facing there is relative to the piece's ----

/** A surface's top: its height (its model's top, not its bounds: scripts/room-surfaces.ts). */
export const topY = (item: string): number => ITEMS[item]?.sy ?? ITEMS[item]?.h ?? 0;
/** The tiles of a surface's own footprint that hold a thing (all of them, for a piece with no top found). */
export function slotsOf(item: string): [number, number][] {
  const m = ITEMS[item];
  if (!m) return [];
  if (m.sl) return m.sl;
  const out: [number, number][] = [];
  for (let sx = 0; sx < m.w; sx++) for (let sz = 0; sz < m.d; sz++) out.push([sx, sz]);
  return out;
}
/** The tiles (the parent's own) a small thing on slot (sx, sz), facing rf there, covers. */
function kidTiles(item: string, sx: number, sz: number, rf: number): [number, number][] {
  const [w, d] = footprint(item, rf);
  const out: [number, number][] = [];
  for (let i = 0; i < w; i++) for (let j = 0; j < d; j++) out.push([sx + i, sz + j]);
  return out;
}
/** Whether a small thing fits on `parent`'s top at slot (sx, sz) facing rf: every tile it covers holds a thing. */
export function fitsOn(parent: string, item: string, sx: number, sz: number, rf: number): boolean {
  const ok = new Set(slotsOf(parent).map(([x, z]) => x * 64 + z));
  return kidTiles(item, sx, sz, rf).every(([x, z]) => ok.has(x * 64 + z));
}
/** Where a small thing on `parent` stands in the parent's own frame: its middle (x, z, model units, the parent's middle
 *  at 0; on its tiles, kept on the top's rectangle) and how high. */
export function onTop(parent: string, kid: { item: string; x: number; z: number; f: number }): [number, number, number] {
  const m = ITEMS[parent], w = m?.w ?? 1, d = m?.d ?? 1;
  const [kw, kd] = footprint(kid.item, kid.f);
  let lx = (kid.x + kw / 2 - w / 2) * TILE, lz = (kid.z + kd / 2 - d / 2) * TILE;
  const st = m?.st;
  if (st) {
    // on the top: its middle at least half a small thing in from the top's edges (the middle of a narrower top)
    const keep = (v: number, a: number, b: number, half: number) => (b - a <= 2 * half ? (a + b) / 2 : Math.min(b - half, Math.max(a + half, v)));
    lx = keep(lx, st[0], st[2], Math.min(2.5, (kw * TILE) / 2));
    lz = keep(lz, st[1], st[3], Math.min(2.5, (kd * TILE) / 2));
  }
  return [lx, topY(parent), lz];
}

/** A point in a piece's own frame (model units, its spot at 0) as an offset in the room's: turned as the room turns the
 *  piece (engine.ts placeRoot: rotation.y = f·90°; a wall thing, in its wall's frame, at f 0) and scaled by `s` (the
 *  room's pieces stand at their model size: 1). */
export function toRoom(local: readonly [number, number, number], f: number, s = 1): [number, number, number] {
  const t = (((f % 4) + 4) % 4) * (Math.PI / 2), c = Math.round(Math.cos(t)), n = Math.round(Math.sin(t));
  const [x, y, z] = local;
  return [(x * c + z * n) * s || 0, y * s, (z * c - x * n) * s || 0];
}
/** A light's emitter (items.json e: where its point light stands) off its spot, in the room's frame at facing `f`. */
export const emitterOf = (item: string, f: number): [number, number, number] => toRoom(ITEMS[item]?.e ?? [0, (ITEMS[item]?.h ?? 8) / 2, 0], f);

/** The room tile of slot (sx, sz) on `parent` (as it stands, turned). */
export function slotToTile(parent: Spot, sx: number, sz: number): [number, number] {
  const m = ITEMS[parent.item], w = m?.w ?? 1, d = m?.d ?? 1;
  const [W, D] = footprint(parent.item, parent.f);
  const lx = sx + 0.5 - w / 2, lz = sz + 0.5 - d / 2, a = (parent.f * Math.PI) / 2;
  const rx = lx * Math.cos(a) + lz * Math.sin(a), rz = -lx * Math.sin(a) + lz * Math.cos(a);
  return [Math.floor(parent.x + W / 2 + rx + 1e-6), Math.floor(parent.z + D / 2 + rz + 1e-6)];
}
/** The slot on `parent` over room tile (tx, tz), or null off its footprint. */
export function tileToSlot(parent: Spot, tx: number, tz: number): [number, number] | null {
  const m = ITEMS[parent.item], w = m?.w ?? 1, d = m?.d ?? 1;
  for (let sx = 0; sx < w; sx++) for (let sz = 0; sz < d; sz++) {
    const [x, z] = slotToTile(parent, sx, sz);
    if (x === tx && z === tz) return [sx, sz];
  }
  return null;
}
/** A piece as the room shows it: where it stands (a room tile), its facing in the room and how high (a surface's top);
 *  a thing on a top, its middle there too (model units: on the top's rectangle, not always its tiles' middle). */
export interface Resolved extends Spot {
  id: string;
  y: number;
  at?: [number, number];
}
/** A small thing on `parent` (as it stands in the room) at slot (x, z), facing f there: its back-left room tile, its
 *  facing in the room, its middle (model units) and how high. */
export function kidSpot(parent: Spot, kid: { item: string; x: number; z: number; f: number }): { x: number; z: number; f: Facing; y: number; at: [number, number] } {
  const tiles = kidTiles(kid.item, kid.x, kid.z, kid.f).map(([sx, sz]) => slotToTile(parent, sx, sz));
  const [lx, y, lz] = onTop(parent.item, kid);
  const a = (parent.f * Math.PI) / 2, [pcx, pcz] = centreOf(parent);
  return {
    x: Math.min(...tiles.map((t) => t[0])), z: Math.min(...tiles.map((t) => t[1])), f: ((parent.f + kid.f) % 4) as Facing, y,
    at: [pcx + lx * Math.cos(a) + lz * Math.sin(a), pcz - lx * Math.sin(a) + lz * Math.cos(a)]
  };
}
/**
 * The room from its pieces: a small thing on a surface where that piece now stands (turned with it, at its top); one
 * whose piece is gone (a race: one of us put the table away as the other put a lamp on it) stands on the floor at its
 * slot's tile, the same on both phones.
 */
export function resolve(list: readonly (Spot & { id: string })[]): Resolved[] {
  const byId = new Map(list.map((p) => [p.id, p]));
  return list.map((p) => {
    const par = p.on ? byId.get(p.on) : undefined;
    if (!p.on) return { ...p, y: 0 };
    if (!par || par.on || !isSurface(par.item)) return { ...p, on: undefined, y: 0 };
    return { ...p, ...kidSpot(par, p) };
  });
}
/** The floor piece with a surface over room tile (tx, tz) (not `except`), if any. */
export function surfaceAt(spots: readonly Spot[], tx: number, tz: number, except?: string): Spot | null {
  for (const s of spots) {
    if (s.on || (except && s.id === except) || !isSurface(s.item) || isWallItem(s.item)) continue;
    if (tilesOf(s).some(([x, z]) => x === tx && z === tz)) return s;
  }
  return null;
}
/** Whether a small thing `item` at slot (sx, sz) on `parent` (its id), facing rf there, would cover a tile another
 *  small thing there covers (stored spots: `on` with their slots). */
export function slotTaken(spots: readonly Spot[], parent: string, sx: number, sz: number, except?: string, item?: string, rf = 0): boolean {
  const mine = new Set((item ? kidTiles(item, sx, sz, rf) : [[sx, sz] as [number, number]]).map(([x, z]) => x * 64 + z));
  return spots.some((s) => s.on === parent && (!except || s.id !== except) && kidTiles(s.item, s.x, s.z, s.f).some(([x, z]) => mine.has(x * 64 + z)));
}

/** Why a piece can't stand there (null: it can). `others`: what stands in the room (the piece itself, by id, left out). */
export function placeWhy(others: readonly Spot[], s: Spot, b: Bounds = FULL): Why | null {
  const [w, d] = footprint(s.item, s.f);
  if (s.x < b.x0 || s.z < b.z0 || s.x + w > b.x1 || s.z + d > b.z1) return 'out';
  const mine = tilesOf(s);
  const rug = isRug(s.item);
  if (!rug && mine.some(([x, z]) => DOOR_TILES.some(([dx, dz]) => dx === x && dz === z))) return 'door';
  const key = (x: number, z: number) => x * ROOM + z;
  const at = new Set(mine.map(([x, z]) => key(x, z)));
  for (const o of others) {
    if ((s.id && o.id === s.id) || o.on || isWallItem(o.item) || isRug(o.item) !== rug) continue;
    if (tilesOf(o).some(([x, z]) => at.has(key(x, z)))) return rug ? 'rug' : 'taken';
  }
  return null;
}

/** The free spot nearest (px, pz) for a new piece (null: the room has none), turned `f`. */
export function nearestFree(others: readonly Spot[], item: string, f: Facing, px: number, pz: number, b: Bounds = FULL): [number, number] | null {
  const [w, d] = footprint(item, f);
  let best: [number, number] | null = null, bd = Infinity;
  for (let x = b.x0; x + w <= b.x1; x++) for (let z = b.z0; z + d <= b.z1; z++) {
    if (placeWhy(others, { item, x, z, f }, b)) continue;
    const [cx, cz] = centreOf({ item, x, z, f });
    const dd = (cx - px) ** 2 + (cz - pz) ** 2;
    if (dd < bd) (bd = dd), (best = [x, z]);
  }
  return best;
}

// ---- walking ---------------------------------------------------------------------------------------------------------

/** The walk grid: half tiles. */
const CELL = TILE / 2;
const N = ROOM * 2;
export type Pt = readonly [number, number];

/** Which half-tile cells are blocked (furniture, not rugs; and outside a smaller room). */
export function blocked(spots: readonly Spot[], room: Bounds = FULL): Uint8Array {
  const b = new Uint8Array(N * N);
  for (let cx = 0; cx < N; cx++) for (let cz = 0; cz < N; cz++)
    if (cx < room.x0 * 2 || cx >= room.x1 * 2 || cz < room.z0 * 2 || cz >= room.z1 * 2) b[cx * N + cz] = 1;
  for (const s of spots) {
    if (isRug(s.item) || s.on || isWallItem(s.item)) continue;
    for (const [x, z] of tilesOf(s)) for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) {
      const cx = x * 2 + i, cz = z * 2 + j;
      if (cx >= 0 && cz >= 0 && cx < N && cz < N) b[cx * N + cz] = 1;
    }
  }
  return b;
}
const cellOf = (p: Pt): [number, number] => [
  Math.min(N - 1, Math.max(0, Math.floor((p[0] + HALF) / CELL))),
  Math.min(N - 1, Math.max(0, Math.floor((p[1] + HALF) / CELL)))
];
const mid = (c: readonly [number, number]): [number, number] => [-HALF + (c[0] + 0.5) * CELL, -HALF + (c[1] + 0.5) * CELL];
/** A point kept inside the room, off the walls. */
export const clampIn = (p: Pt, b: Bounds = FULL): [number, number] => {
  const [x0, x1, z0, z1] = rectOf(b);
  return [Math.min(x1 - WALL_PAD, Math.max(x0 + WALL_PAD, p[0])), Math.min(z1 - WALL_PAD, Math.max(z0 + WALL_PAD, p[1]))];
};
/** Whether a model point is on this room's floor. */
export const onFloor = (p: Pt, b: Bounds = FULL): boolean => {
  const [x0, x1, z0, z1] = rectOf(b);
  return p[0] >= x0 && p[0] <= x1 && p[1] >= z0 && p[1] <= z1;
};
/** The pieces a room of these bounds can't hold where they stand (a shrink's: TentEdit keeps it from leaving one
 *  outside): on the floor past its edge, on a wall past its span; a thing on a top goes with its piece. */
export function outside(spots: readonly Spot[], b: Bounds): Spot[] {
  return spots.filter((s) => {
    if (s.on) return false;
    if (isWallItem(s.item)) {
      const [lo, hi] = wallSpan(s.f, b);
      return s.x < lo || s.x + (ITEMS[s.item]?.w ?? 1) > hi;
    }
    const [w, d] = footprint(s.item, s.f);
    return s.x < b.x0 || s.z < b.z0 || s.x + w > b.x1 || s.z + d > b.z1;
  });
}

/** Whether the segment a → b crosses no blocked cell (sampled every quarter cell). */
function clear(b: Uint8Array, a: Pt, c: Pt): boolean {
  const n = Math.ceil(Math.hypot(c[0] - a[0], c[1] - a[1]) / (CELL / 4));
  for (let i = 0; i <= n; i++) {
    const t = n ? i / n : 0;
    // the walker's width: a little either side of the line
    for (const o of [-1.2, 0, 1.2]) {
      const dx = c[0] - a[0], dz = c[1] - a[1], l = Math.hypot(dx, dz) || 1;
      const [x, z] = cellOf([a[0] + dx * t + (-dz / l) * o, a[1] + dz * t + (dx / l) * o]);
      if (b[x * N + z]) return false;
    }
  }
  return true;
}

/**
 * The way from `from` to `to` round the furniture: the points after `from` (the last is where it ends: `to`, or the
 * nearest reachable point to it when `to` is under a piece or walled off), [] when it's there already. A* over the
 * half-tile cells (8 ways, no corner cutting), then the corners pulled straight where the line is clear.
 */
export function walkPath(spots: readonly Spot[], from: Pt, to: Pt, room: Bounds = FULL): Pt[] {
  const b = blocked(spots, room);
  const goal = clampIn(to, room);
  const s = cellOf(from);
  let g = cellOf(goal);
  const idx = (c: readonly [number, number]) => c[0] * N + c[1];
  // A* from the start (its own cell is never a wall to it: a villager standing at a piece's edge walks off)
  const open = new Map<number, number>(), cost = new Float64Array(N * N).fill(Infinity), came = new Int32Array(N * N).fill(-1);
  const h = (i: number) => Math.hypot(Math.floor(i / N) - g[0], (i % N) - g[1]);
  const si = idx(s);
  cost[si] = 0;
  open.set(si, h(si));
  let bestI = si, bestH = h(si);
  const seen = new Uint8Array(N * N);
  while (open.size) {
    let cur = -1, cf = Infinity;
    for (const [i, f] of open) if (f < cf) (cf = f), (cur = i);
    open.delete(cur);
    if (seen[cur]) continue;
    seen[cur] = 1;
    const hc = h(cur);
    if (hc < bestH) (bestH = hc), (bestI = cur);
    if (cur === idx(g)) break;
    const cx = Math.floor(cur / N), cz = cur % N;
    for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
      if (!dx && !dz) continue;
      const nx = cx + dx, nz = cz + dz;
      if (nx < 0 || nz < 0 || nx >= N || nz >= N || b[nx * N + nz]) continue;
      if (dx && dz && (b[(cx + dx) * N + cz] || b[cx * N + cz + dz])) continue;
      const ni = nx * N + nz, c = cost[cur] + (dx && dz ? Math.SQRT2 : 1);
      if (c < cost[ni]) {
        cost[ni] = c;
        came[ni] = cur;
        open.set(ni, c + h(ni));
      }
    }
  }
  const reached = seen[idx(g)] === 1;
  if (!reached) g = [Math.floor(bestI / N), bestI % N];
  const cells: [number, number][] = [];
  for (let i = reached ? idx(g) : bestI; i !== -1 && i !== si; i = came[i]) cells.push([Math.floor(i / N), i % N]);
  cells.reverse();
  const end: Pt = reached && !b[idx(g)] ? goal : mid(g);
  const pts: Pt[] = [...cells.slice(0, -1).map(mid), end];
  if (!cells.length && Math.hypot(end[0] - from[0], end[1] - from[1]) < 0.5) return [];
  // pull the corners straight
  const out: Pt[] = [];
  let a: Pt = from;
  for (let i = 0; i < pts.length; ) {
    let j = pts.length - 1;
    while (j > i && !clear(b, a, pts[j])) j--;
    out.push(pts[j]);
    a = pts[j];
    i = j + 1;
  }
  return out;
}
