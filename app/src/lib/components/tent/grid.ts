// The tent's floor plan (docs/design.md "The tent"), pure: NH's largest room, the main room fully expanded, 8 × 8
// tiles of 10 model units (RoomMdlFloor8x8: −40…40 across and deep), the door in the middle of the front edge. What
// may stand where (a piece on its whole tiles, inside the room, off the door's tiles, not over another piece; a rug
// under the furniture, never over another rug) and how a villager walks (A* on a half-tile grid round the furniture,
// the corners pulled straight).
import { footprint, ITEMS } from './items.ts';

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

export type Facing = 0 | 1 | 2 | 3;
/** A piece in the room: its item, its footprint's back-left tile (x across, z deep, after turning) and its facing. */
export interface Spot {
  id?: string;
  item: string;
  x: number;
  z: number;
  f: Facing;
}

export type Why = 'out' | 'door' | 'taken' | 'rug';

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
export function snapTo(item: string, f: Facing, px: number, pz: number): [number, number] {
  const [w, d] = footprint(item, f);
  const x = Math.round((px + HALF) / TILE - w / 2), z = Math.round((pz + HALF) / TILE - d / 2);
  return [Math.min(ROOM - w, Math.max(0, x)), Math.min(ROOM - d, Math.max(0, z))];
}

const isRug = (item: string) => !!ITEMS[item]?.rug;

/** Why a piece can't stand there (null: it can). `others`: what stands in the room (the piece itself, by id, left out). */
export function placeWhy(others: readonly Spot[], s: Spot): Why | null {
  const [w, d] = footprint(s.item, s.f);
  if (s.x < 0 || s.z < 0 || s.x + w > ROOM || s.z + d > ROOM) return 'out';
  const mine = tilesOf(s);
  const rug = isRug(s.item);
  if (!rug && mine.some(([x, z]) => DOOR_TILES.some(([dx, dz]) => dx === x && dz === z))) return 'door';
  const key = (x: number, z: number) => x * ROOM + z;
  const at = new Set(mine.map(([x, z]) => key(x, z)));
  for (const o of others) {
    if ((s.id && o.id === s.id) || isRug(o.item) !== rug) continue;
    if (tilesOf(o).some(([x, z]) => at.has(key(x, z)))) return rug ? 'rug' : 'taken';
  }
  return null;
}

/** The free spot nearest (px, pz) for a new piece (null: the room has none), turned `f`. */
export function nearestFree(others: readonly Spot[], item: string, f: Facing, px: number, pz: number): [number, number] | null {
  const [w, d] = footprint(item, f);
  let best: [number, number] | null = null, bd = Infinity;
  for (let x = 0; x + w <= ROOM; x++) for (let z = 0; z + d <= ROOM; z++) {
    if (placeWhy(others, { item, x, z, f })) continue;
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

/** Which half-tile cells are blocked (furniture, not rugs). */
export function blocked(spots: readonly Spot[]): Uint8Array {
  const b = new Uint8Array(N * N);
  for (const s of spots) {
    if (isRug(s.item)) continue;
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
export const clampIn = (p: Pt): [number, number] => [
  Math.min(HALF - WALL_PAD, Math.max(-HALF + WALL_PAD, p[0])),
  Math.min(HALF - WALL_PAD, Math.max(-HALF + WALL_PAD, p[1]))
];

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
export function walkPath(spots: readonly Spot[], from: Pt, to: Pt): Pt[] {
  const b = blocked(spots);
  const goal = clampIn(to);
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
