// The 3D ground's geometry from the layout (docs/island-layout.md "Derived, never hand-made"), pure: one chunk's top
// surfaces, cliff walls, waterfalls and fresh water, as typed arrays in three's space (x, y, −z), for
// world3d/terrain.ts to put in buffers. NH's own scheme: each tile is four quadrants of 15u, each quadrant 3 × 3 cells
// of 5u; a quadrant whose corner is rounded (fields.ts roundedIn: a convex corner cut, a concave one filled, on a third
// of a tile) has its corner's 2 × 2 cells replaced by a quarter disc and the piece round it, at their own levels. A
// tier's edge stands a vertical wall from the upper ground down to the lower; where water meets water a tier down, the
// wall is a waterfall. Heights over a level come from height.ts (offset): the beach, the banks, the paths.
import { CHUNK, CHUNKS_X, GRID, TIER_H, TILE, idx, kindOf, onGrid, tierOf, tileX, tileZ, chunkXZ } from './grid.ts';
import { GRASS_Y, WATER_DROP, fieldOf } from './height.ts';
import { Ch, FAR } from './fields.ts';
import type { Layout } from './model.ts';
import { kindDef } from './catalog.ts';

export interface Part {
  pos: Float32Array;
  index: Uint32Array;
}
export interface WallPart extends Part {
  nrm: Float32Array;
  uv: Float32Array;
}
export interface WaterPart extends Part {
  /** Each vertex's flow (x, z per u a second's direction, 0 for still water), whether it's a pond (1), and how near
   *  the foot of a fall it is (1 at the wall, 0 from FOOT u on: its foam). */
  flow: Float32Array;
  /** Each vertex's place on a river's stem (river.ts): the length along it from the mouth (u), how far across (its
   *  half-breadths), whether it's on one (1; else 0 and the tiles' flow) and how near a fall's lip (1 at the edge, 0
   *  from LIP u back: it speeds up and whitens as it goes over). */
  path: Float32Array;
}
export interface ChunkMesh {
  top: Part;
  walls: WallPart;
  falls: WallPart;
  water: WaterPart;
  /** The chunk's world box (u). */
  box: { x0: number; z0: number; x1: number; z1: number };
}

const S = 5;
const R = 10;
/** The arc's points (local, from the corner's box): angles 180° … 270° round (R, R), through the rays to the box
 *  edges' 5u points, so a neighbour's edge vertices meet these exactly. */
const ARC: readonly (readonly [number, number])[] = [Math.PI, Math.PI + Math.atan(0.5), (5 * Math.PI) / 4, (3 * Math.PI) / 2 - Math.atan(0.5), (3 * Math.PI) / 2].map(
  (a) => [R + R * Math.cos(a), R + R * Math.sin(a)] as const
);
/** The box edge points the arc's rays reach (the outer piece's other side). */
const RIM: readonly (readonly [number, number])[] = [[0, 10], [0, 5], [0, 0], [5, 0], [10, 0]];

class Builder {
  pos: number[] = [];
  index: number[] = [];
  extra: number[] = [];
  private keys = new Map<number, number>();
  vert(x: number, y: number, z: number, share = true, ...extra: number[]): number {
    const key = share ? ((Math.round(x * 100) + 10000) * 140000 + Math.round(z * 100) + 10000) * 40000 + Math.round(y * 100) + 20000 : 0;
    if (share) {
      const had = this.keys.get(key);
      if (had !== undefined) return had;
    }
    const i = this.pos.length / 3;
    this.pos.push(x, y, -z);
    this.extra.push(...extra);
    if (share) this.keys.set(key, i);
    return i;
  }
  /** A triangle, wound to face up (+y in three's space). */
  private lv = new Map<number, number>();
  /** A shared vertex at (x, z) on a level, its height from `y` (only computed once). */
  at(x: number, z: number, level: number, y: (x: number, z: number, level: number) => number): number {
    const key = ((Math.round(x * 100) + 10000) * 140000 + Math.round(z * 100) + 10000) * 8 + level;
    const had = this.lv.get(key);
    if (had !== undefined) return had;
    const i = this.pos.length / 3;
    this.pos.push(x, y(x, z, level), -z);
    this.lv.set(key, i);
    return i;
  }
  tri(a: number, b: number, c: number): void {
    const p = this.pos;
    const ax = p[a * 3], az = p[a * 3 + 2], bx = p[b * 3], bz = p[b * 3 + 2], cx = p[c * 3], cz = p[c * 3 + 2];
    const ny = (bz - az) * (cx - ax) - (bx - ax) * (cz - az);
    if (Math.abs(ny) < 1e-9) return;
    if (ny > 0) this.index.push(a, b, c);
    else this.index.push(a, c, b);
  }
  part(): Part {
    return { pos: new Float32Array(this.pos), index: new Uint32Array(this.index) };
  }
}

class Walls {
  pos: number[] = [];
  nrm: number[] = [];
  uv: number[] = [];
  index: number[] = [];
  /** A wall's quad from (ax, az) to (bx, bz), its top and bottom heights at each end, facing (nx, nz) (world). */
  quad(ax: number, az: number, bx: number, bz: number, at: number, ab: number, bt: number, bb: number, nx: number, nz: number, u0: number, u1: number): void {
    if (at - ab < 0.05 && bt - bb < 0.05) return;
    const i = this.pos.length / 3;
    this.pos.push(ax, at, -az, ax, ab, -az, bx, bt, -bz, bx, bb, -bz);
    for (let k = 0; k < 4; k++) this.nrm.push(nx, 0, -nz);
    this.uv.push(u0, at / 80, u0, ab / 80, u1, bt / 80, u1, bb / 80);
    // facing (nx, nz): wind so the face's normal (three's space) points that way
    const ex = bx - ax, ez = -(bz - az);
    const cross = -ez * nx + ex * -nz; // sign of (edge × up) · n
    if (cross >= 0) this.index.push(i, i + 1, i + 2, i + 2, i + 1, i + 3);
    else this.index.push(i, i + 2, i + 1, i + 2, i + 3, i + 1);
  }
  part(): WallPart {
    return { pos: new Float32Array(this.pos), index: new Uint32Array(this.index), nrm: new Float32Array(this.nrm), uv: new Float32Array(this.uv) };
  }
}

/** The fresh water's flow per tile: toward the sea or the next fall down (a breadth-first distance along the river). */
function flows(layout: Layout): Float32Array {
  const N = GRID.cols * GRID.rows, dist = new Int32Array(N).fill(-1), out = new Float32Array(N * 2);
  const kind = (c: number, r: number) => (onGrid(c, r) ? kindOf(layout.codes[idx(c, r)]) : 'sea');
  const tier = (c: number, r: number) => (onGrid(c, r) ? tierOf(layout.codes[idx(c, r)]) : 0);
  const N4 = [[1, 0], [-1, 0], [0, 1], [0, -1]] as const;
  const q: number[] = [];
  for (let r = 0; r < GRID.rows; r++)
    for (let c = 0; c < GRID.cols; c++) {
      if (kind(c, r) !== 'river') continue;
      if (N4.some(([dc, dr]) => kind(c + dc, r + dr) === 'sea' || ((kind(c + dc, r + dr) === 'river' || kind(c + dc, r + dr) === 'pond') && tier(c + dc, r + dr) < tier(c, r)))) {
        dist[idx(c, r)] = 0;
        q.push(idx(c, r));
      }
    }
  for (let h = 0; h < q.length; h++) {
    const k = q[h], c = k % GRID.cols, r = (k - c) / GRID.cols;
    for (const [dc, dr] of N4) {
      const nc = c + dc, nr = r + dr;
      if (!onGrid(nc, nr) || kind(nc, nr) !== 'river' || tier(nc, nr) !== tier(c, r) || dist[idx(nc, nr)] >= 0) continue;
      dist[idx(nc, nr)] = dist[k] + 1;
      q.push(idx(nc, nr));
    }
  }
  for (let r = 0; r < GRID.rows; r++)
    for (let c = 0; c < GRID.cols; c++) {
      const k = idx(c, r);
      if (dist[k] < 0) continue;
      let bd = dist[k], bx = 0, bz = 0;
      for (const [dc, dr] of N4) {
        const nc = c + dc, nr = r + dr, nk = kind(nc, nr);
        const down = nk === 'sea' || ((nk === 'river' || nk === 'pond') && tier(nc, nr) < tier(c, r));
        const d = down ? -1 : onGrid(nc, nr) && nk === 'river' && tier(nc, nr) === tier(c, r) && dist[idx(nc, nr)] >= 0 ? dist[idx(nc, nr)] : Infinity;
        if (d < bd) [bd, bx, bz] = [d, dc, dr];
      }
      out[k * 2] = bx;
      out[k * 2 + 1] = bz;
    }
  return out;
}

const flowCache = new WeakMap<Layout, Float32Array>();

/** The falls' lip and foot reach (u): the water hurries and whitens over the last LIP before it falls, and foams over
 *  the first FOOT below it (the hand-made river's ramp and its foam pool, the old water.ts's, on the layout's walls). */
const LIP = 22, FOOT = 34;
/** Every waterfall's edge (world u, a tile's side where fresh water steps down to fresh water), its upper and its
 *  lower tier. */
interface FallEdge {
  ax: number;
  az: number;
  bx: number;
  bz: number;
  hi: number;
  lo: number;
}
function fallEdges(layout: Layout): FallEdge[] {
  const out: FallEdge[] = [];
  const fresh = (c: number, r: number) => onGrid(c, r) && (kindOf(layout.codes[idx(c, r)]) === 'river' || kindOf(layout.codes[idx(c, r)]) === 'pond');
  for (let r = 0; r < GRID.rows; r++)
    for (let c = 0; c < GRID.cols; c++) {
      if (!fresh(c, r)) continue;
      const t = tierOf(layout.codes[idx(c, r)]);
      for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
        if (!fresh(c + dc, r + dr) || tierOf(layout.codes[idx(c + dc, r + dr)]) >= t) continue;
        const ex = tileX(dc > 0 ? c + 1 : c), ez = tileZ(dr > 0 ? r + 1 : r);
        const lo = tierOf(layout.codes[idx(c + dc, r + dr)]);
        if (dc) out.push({ ax: ex, az: tileZ(r), bx: ex, bz: tileZ(r + 1), hi: t, lo });
        else out.push({ ax: tileX(c), az: ez, bx: tileX(c + 1), bz: ez, hi: t, lo });
      }
    }
  return out;
}
const fallCache = new WeakMap<Layout, FallEdge[]>();
const segDist = (e: FallEdge, x: number, z: number) => {
  const ex = e.bx - e.ax, ez = e.bz - e.az, t = Math.max(0, Math.min(1, ((x - e.ax) * ex + (z - e.az) * ez) / (ex * ex + ez * ez)));
  return Math.hypot(x - e.ax - ex * t, z - e.az - ez * t);
};

/** What a layout's ground is built from, as a key: its tiles, its pieces and its homes (two layouts alike there have
 *  the same chunks). Kept a layout. */
const meshKeys = new WeakMap<Layout, string>();
export const meshKeyOf = (l: Layout): string => {
  let k = meshKeys.get(l);
  if (k === undefined) {
    k = '';
    for (let i = 0; i < l.codes.length; i++) k += String.fromCharCode(l.codes[i]);
    k += JSON.stringify([[...l.objects], l.homes]);
    meshKeys.set(l, k);
  }
  return k;
};
/** Chunks built elsewhere (the fields' worker, layout/fields.worker.ts: this very code, so the same numbers), by key:
 *  one set, each chunk handed out once (the ground's first build), dropped once another layout is asked for. */
let adopted: { key: string; chunks: (ChunkMesh | undefined)[] } | null = null;
/** A layout's chunks computed in the worker, for chunkMesh to hand out (all CHUNK_COUNT of them, in order). */
export function adoptChunks(layout: Layout, chunks: ChunkMesh[]): void {
  // (an open-sea row's, noChunk's, is never asked for: not held)
  if (chunks.length === CHUNK_COUNT) adopted = { key: meshKeyOf(layout), chunks: chunks.map((c) => (c.top.pos.length ? c : undefined)) };
}

/** One chunk's ground. */
export function chunkMesh(layout: Layout, chunk: number): ChunkMesh {
  if (adopted) {
    if (adopted.key === meshKeyOf(layout)) {
      const pre = adopted.chunks[chunk];
      adopted.chunks[chunk] = undefined;
      if (adopted.chunks.every((c) => !c)) adopted = null;
      if (pre) return pre;
    } else adopted = null;
  }
  return buildChunk(layout, chunk);
}

function buildChunk(layout: Layout, chunk: number): ChunkMesh {
  const field = fieldOf(layout);
  let fl = flowCache.get(layout);
  if (!fl) flowCache.set(layout, (fl = flows(layout)));
  let edges = fallCache.get(layout);
  if (!edges) fallCache.set(layout, (edges = fallEdges(layout)));
  const tierAt = field.tierAt;
  const code = (c: number, r: number) => (onGrid(c, r) ? layout.codes[idx(c, r)] : 0);
  const [cx, cz] = chunkXZ(chunk);
  const top = new Builder(), walls = new Walls(), falls = new Walls(), water = new Builder();
  const yAt = (x: number, z: number, level: number) => level * TIER_H + field.offset(x, z, level);
  const waterish = (k: string) => k === 'river' || k === 'pond' || k === 'sea';
  /** The flow at a world point (tile centres' flows, bilinear). */
  const flowAt = (x: number, z: number): [number, number] => {
    // along a river's curve (river.ts), else the tiles'
    const along = field.fields.flow(x, z);
    if (along) return along;
    const fx = (x - GRID.x0) / TILE - 0.5, fz = (z - GRID.z0) / TILE - 0.5;
    const c0 = Math.floor(fx), r0 = Math.floor(fz), tx = fx - c0, tz = fz - r0;
    let vx = 0, vz = 0;
    for (const [dc, dr, w] of [[0, 0, (1 - tx) * (1 - tz)], [1, 0, tx * (1 - tz)], [0, 1, (1 - tx) * tz], [1, 1, tx * tz]] as const) {
      const c = c0 + dc, r = r0 + dr;
      if (!onGrid(c, r)) continue;
      vx += fl![idx(c, r) * 2] * w;
      vz += fl![idx(c, r) * 2 + 1] * w;
    }
    return [vx, vz];
  };

  for (let r = cz * CHUNK; r < Math.min(GRID.rows, (cz + 1) * CHUNK); r++)
    for (let c = cx * CHUNK; c < Math.min(GRID.cols, (cx + 1) * CHUNK); c++) {
      const own = tierOf(code(c, r)), kind = kindOf(code(c, r));
      const isFresh = kind === 'river' || kind === 'pond';
      // the soft edges (fields.ts) round a river's or a pond's inside corners out over the bank's tile: the water's
      // surface goes on there too, where the bank dips under it (a tile beside fresh water on the same tier)
      let wetKind = isFresh ? kind : '';
      if (!isFresh && kind !== 'sea')
        for (let dr = -1; dr <= 1 && !wetKind; dr++)
          for (let dc = -1; dc <= 1 && !wetKind; dc++) {
            const nk = kindOf(code(c + dc, r + dr));
            if ((nk === 'river' || nk === 'pond') && onGrid(c + dc, r + dr) && tierOf(code(c + dc, r + dr)) === own) wetKind = nk;
          }
      const waterY = own * TIER_H + GRASS_Y - WATER_DROP;
      const under = (...p: number[]) => isFresh || p.some((i) => top.pos[i * 3 + 1] < waterY + 0.3 && field.fields.at(Ch.fresh, top.pos[i * 3], -top.pos[i * 3 + 2]) < 0);
      for (let qz = 0; qz < 2; qz++)
        for (let qx = 0; qx < 2; qx++) {
          // the quadrant's corner (the tile's) and the way into the tile from it
          const Kx = tileX(c) + qx * TILE, Kz = tileZ(r) + qz * TILE, ix = qx ? -1 : 1, iz = qz ? -1 : 1;
          const W = (u: number, v: number): [number, number] => [Kx + ix * u, Kz + iz * v];
          const V = (b: Builder, u: number, v: number, level: number) => {
            const [x, z] = W(u, v);
            return b.at(x, z, level, yAt);
          };
          const Wv = (u: number, v: number, y: number) => {
            const [x, z] = W(u, v);
            const [fx, fz] = flowAt(x, z);
            const al = field.fields.along(x, z);
            // the falls near: its lip on this tier (ahead), its foot (below)
            let lip = 0, foot = 0;
            for (const e of edges!) {
              if (e.hi === own) lip = Math.max(lip, 1 - Math.min(1, segDist(e, x, z) / LIP));
              else if (e.lo === own) foot = Math.max(foot, 1 - Math.min(1, segDist(e, x, z) / FOOT));
            }
            return water.vert(x, y, z, true, fx, fz, wetKind === 'pond' ? 1 : 0, foot, al ? al[0] : 0, al ? al[1] : 0, al ? 1 : 0, lip);
          };
          const lin = tierAt(...W(6, 6)), lout = tierAt(...W(1.2, 1.2));
          const split = lin !== lout;
          // the plain cells (all nine when the corner isn't split)
          for (let b = 0; b < 3; b++)
            for (let a = 0; a < 3; a++) {
              if (split && a < 2 && b < 2) continue;
              const u0 = a * S, v0 = b * S, u1 = u0 + S, v1 = v0 + S;
              const L = a < 2 && b < 2 ? lout : own;
              const p = [V(top, u0, v0, L), V(top, u1, v0, L), V(top, u1, v1, L), V(top, u0, v1, L)];
              top.tri(p[0], p[1], p[2]);
              top.tri(p[0], p[2], p[3]);
              if (wetKind && L === own && under(...p)) {
                const w = [Wv(u0, v0, waterY), Wv(u1, v0, waterY), Wv(u1, v1, waterY), Wv(u0, v1, waterY)];
                water.tri(w[0], w[1], w[2]);
                water.tri(w[0], w[2], w[3]);
              }
            }
          if (split) {
            // the quarter disc (its own level) fanned from inside; the piece round it (the corner's level) in strips
            const loop: [number, number][] = [[10, 10], [5, 10], ...ARC.map(([u, v]) => [u, v] as [number, number]), [10, 5]];
            const P = V(top, 6, 6, lin);
            const ring = loop.map(([u, v]) => V(top, u, v, lin));
            for (let k = 0; k < ring.length; k++) top.tri(P, ring[k], ring[(k + 1) % ring.length]);
            if (wetKind && lin === own && under(P, ...ring)) {
              const wp = Wv(6, 6, waterY), wr = loop.map(([u, v]) => Wv(u, v, waterY));
              for (let k = 0; k < wr.length; k++) water.tri(wp, wr[k], wr[(k + 1) % wr.length]);
            }
            for (let k = 0; k < ARC.length - 1; k++) {
              const a0 = V(top, ARC[k][0], ARC[k][1], lout), a1 = V(top, ARC[k + 1][0], ARC[k + 1][1], lout);
              const b0 = V(top, RIM[k][0], RIM[k][1], lout), b1 = V(top, RIM[k + 1][0], RIM[k + 1][1], lout);
              top.tri(a0, a1, b1);
              top.tri(a0, b1, b0);
            }
            // the arc's wall, facing the lower piece
            const hi = Math.max(lin, lout), lo = Math.min(lin, lout);
            const fallsHere = isFresh && waterish(kindOf(code(c + (qx ? 1 : -1), r))) && waterish(kindOf(code(c, r + (qz ? 1 : -1))));
            const into = fallsHere ? falls : walls;
            let u = (W(ARC[0][0], ARC[0][1])[0] + W(ARC[0][0], ARC[0][1])[1]) / 1;
            for (let k = 0; k < ARC.length - 1; k++) {
              const [ax, az] = W(ARC[k][0], ARC[k][1]), [bx, bz] = W(ARC[k + 1][0], ARC[k + 1][1]);
              const mx = (ARC[k][0] + ARC[k + 1][0]) / 2 - R, mz = (ARC[k][1] + ARC[k + 1][1]) / 2 - R, ml = Math.hypot(mx, mz) || 1;
              // the outward normal from the disc's centre (local), toward the corner when the disc is higher
              const sgn = lin > lout ? 1 : -1;
              const nx = ((ix * mx) / ml) * sgn, nz = ((iz * mz) / ml) * sgn;
              const len = Math.hypot(bx - ax, bz - az);
              const upper = (x: number, z: number) => (fallsHere ? hi * TIER_H + GRASS_Y - WATER_DROP : yAt(x, z, hi));
              into.quad(ax, az, bx, bz, upper(ax, az), yAt(ax, az, lo), upper(bx, bz), yAt(bx, bz, lo), nx, nz, u / 60, (u + len) / 60);
              u += len;
            }
          }
          // the quadrant's two outer edges, in 5u segments: a wall where the ground across is lower
          for (const axis of [0, 1] as const) {
            for (let s = 0; s < 3; s++) {
              const t0 = s * S, t1 = t0 + S;
              const [ax, az] = axis ? W(t0, 0) : W(0, t0), [bx, bz] = axis ? W(t1, 0) : W(0, t1);
              // this side's level (the corner piece's within its box, else the tile's) and the other side's
              const mine = s < 2 ? lout : own;
              const nx = axis ? 0 : -ix, nz = axis ? -iz : 0;
              const mx = (ax + bx) / 2 + nx * 0.6, mz = (az + bz) / 2 + nz * 0.6;
              const theirs = tierAt(mx, mz);
              if (theirs >= mine) continue;
              const [oc, or] = [c + (axis ? 0 : -ix), r + (axis ? -iz : 0)];
              const fallsHere = isFresh && waterish(kindOf(code(oc, or)));
              const into = fallsHere ? falls : walls;
              const upper = (x: number, z: number) => (fallsHere ? mine * TIER_H + GRASS_Y - WATER_DROP : yAt(x, z, mine));
              const lower = (x: number, z: number) => yAt(x, z, theirs);
              into.quad(ax, az, bx, bz, upper(ax, az), lower(ax, az), upper(bx, bz), lower(bx, bz), nx, nz, (ax + az) / 60, (bx + bz) / 60);
            }
          }
        }
    }
  const flowPart = (): WaterPart => {
    const n = water.extra.length / 8, flow = new Float32Array(n * 4), path = new Float32Array(n * 4);
    for (let k = 0; k < n; k++)
      for (let j = 0; j < 4; j++) {
        flow[k * 4 + j] = water.extra[k * 8 + j];
        path[k * 4 + j] = water.extra[k * 8 + 4 + j];
      }
    return { ...water.part(), flow, path };
  };
  return {
    top: top.part(),
    walls: walls.part(),
    falls: falls.part(),
    water: flowPart(),
    box: { x0: tileX(cx * CHUNK), z0: tileZ(cz * CHUNK), x1: tileX(Math.min(GRID.cols, (cx + 1) * CHUNK)), z1: tileZ(Math.min(GRID.rows, (cz + 1) * CHUNK)) }
  };
}

export const CHUNK_COUNT = CHUNKS_X * Math.ceil(GRID.rows / CHUNK);

/** Whether a row of chunks is open sea, its neighbours' tiles a field's reach (FAR) away too: the ground builds, draws
 *  and bakes nothing there (terrain.ts: the deep plane shows), and the worker builds no chunk of it (fields.worker.ts:
 *  the grid's rows of sea behind the island cost nothing). */
export function openSeaRow(codes: ArrayLike<number>, row: number): boolean {
  const m = Math.ceil(FAR / TILE);
  for (let r = Math.max(0, row * CHUNK - m); r < Math.min(GRID.rows, (row + 1) * CHUNK + m); r++)
    for (let c = 0; c < GRID.cols; c++) if (kindOf(codes[idx(c, r)]) !== 'sea') return false;
  return true;
}
/** An open-sea row's chunk as the worker answers it (nothing built: openSeaRow). */
export function noChunk(chunk: number): ChunkMesh {
  const [cx, cz] = chunkXZ(chunk), none = () => new Float32Array(0);
  const wall = () => ({ pos: none(), index: new Uint32Array(0), nrm: none(), uv: none() });
  return {
    top: { pos: none(), index: new Uint32Array(0) }, walls: wall(), falls: wall(),
    water: { pos: none(), index: new Uint32Array(0), flow: none(), path: none() },
    box: { x0: tileX(cx * CHUNK), z0: tileZ(cz * CHUNK), x1: tileX(Math.min(GRID.cols, (cx + 1) * CHUNK)), z1: tileZ(Math.min(GRID.rows, (cz + 1) * CHUNK)) }
  };
}

/** Every stairs' stone steps (NH's incline: a flight up a cliff, its sides walled down to the ground), in one part:
 *  eight steps over its depth, each a top and a riser, and both sides' stepped walls. */
export function stairsMesh(layout: Layout): WallPart {
  const field = fieldOf(layout);
  const pos: number[] = [], nrm: number[] = [], uv: number[] = [], index: number[] = [];
  const N = 12;
  for (const o of layout.objects.values()) {
    if (o.k !== 'stairs') continue;
    // across and up the flight (catalog.ts: 2 across, 4 up)
    const def = kindDef('stairs')!;
    const W = def.w * TILE, D = def.d * TILE;
    const x0 = tileX(o.x), z0 = tileZ(o.z);
    const base = (onGrid(o.x, o.z) ? tierOf(layout.codes[idx(o.x, o.z)]) : 0) * TIER_H + GRASS_Y;
    /** local (u across, v up the flight) → world (x, z) by the facing (f 0 climbs toward +z). */
    const at = (u: number, v: number): [number, number] =>
      o.f === 0 ? [x0 + u, z0 + v] : o.f === 2 ? [x0 + W - u, z0 + D - v] : o.f === 1 ? [x0 + D - v, z0 + u] : [x0 + v, z0 + W - u];
    const facing = (nu: number, nv: number): [number, number] => {
      // a local direction (across, up the flight) in world x, z
      const [ax, az] = at(nu, nv), [bx, bz] = at(0, 0);
      return [ax - bx, az - bz];
    };
    const quad = (p: [number, number, number][], n: [number, number, number], uvs: [number, number][]) => {
      const i = pos.length / 3;
      for (const [x, y, z] of p) pos.push(x, y, -z);
      for (let k = 0; k < 4; k++) nrm.push(n[0], n[1], -n[2]);
      for (const [a, b] of uvs) uv.push(a, b);
      // wind to face n (three's space)
      const P = p.map(([x, y, z]) => [x, y, -z]);
      const e1 = [P[1][0] - P[0][0], P[1][1] - P[0][1], P[1][2] - P[0][2]], e2 = [P[2][0] - P[0][0], P[2][1] - P[0][1], P[2][2] - P[0][2]];
      const cx = e1[1] * e2[2] - e1[2] * e2[1], cy = e1[2] * e2[0] - e1[0] * e2[2], cz = e1[0] * e2[1] - e1[1] * e2[0];
      if (cx * n[0] + cy * n[1] + cz * -n[2] >= 0) index.push(i, i + 1, i + 2, i, i + 2, i + 3);
      else index.push(i, i + 2, i + 1, i, i + 3, i + 2);
    };
    const step = D / N, rise = TIER_H / N;
    const [fwx, fwz] = facing(0, -1), [sdx, sdz] = facing(1, 0);
    for (let k = 0; k < N; k++) {
      const v0 = k * step, v1 = v0 + step, y0 = base + k * rise, y1 = y0 + rise;
      const p3 = (u: number, v: number, y: number): [number, number, number] => {
        const [x, z] = at(u, v);
        return [x, y, z];
      };
      // the tread
      quad([p3(0, v0, y1), p3(W, v0, y1), p3(W, v1, y1), p3(0, v1, y1)], [0, 1, 0], [[0, v0 / 30], [W / 30, v0 / 30], [W / 30, v1 / 30], [0, v1 / 30]]);
      // the riser, facing down the flight
      quad([p3(0, v0, y0), p3(W, v0, y0), p3(W, v0, y1), p3(0, v0, y1)], [fwx, 0, fwz], [[0, y0 / 30], [W / 30, y0 / 30], [W / 30, y1 / 30], [0, y1 / 30]]);
      // its sides, down to the ground
      for (const [u, s] of [[0, -1], [W, 1]] as const) {
        const g0 = field.ground(...at(u, v0)), g1 = field.ground(...at(u, v1));
        quad([p3(u, v0, Math.min(g0, y1) - 1), p3(u, v1, Math.min(g1, y1) - 1), p3(u, v1, y1), p3(u, v0, y1)], [sdx * s, 0, sdz * s], [[v0 / 30, g0 / 30], [v1 / 30, g1 / 30], [v1 / 30, y1 / 30], [v0 / 30, y1 / 30]]);
      }
    }
  }
  return { pos: new Float32Array(pos), nrm: new Float32Array(nrm), uv: new Float32Array(uv), index: new Uint32Array(index) };
}
