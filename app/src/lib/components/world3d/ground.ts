// The 3D island's ground (the /world3d POC): heights over world.ts's flat plan, pure, so the mesh, the water, the
// walkers' feet and the tests read one function. World units (x across, z into the island); y up.
//   Grass at GRASS_Y; the beach easing down to the shoreline (0); the seabed dropping away under the sea.
//   The stream, the pond and the spring carved CARVE deep (their water at WATER_DROP below the bank).
//   The cliff to tier 2 rising TIER over CLIFF.z0…z1 (its painted strata on the slope), on the grass only.
// The textures are the island's own baked chunks (static/terrain/<look>/<i>.webp): x PLAN.x0…x1, each CHUNK_D deep.
import { BRIDGE, CLIFF, GRASS, LAND, PLAN, POND, RIVER, SPRING, onBridge } from '../island/world.ts';

export const GRASS_Y = 3;
export const TIER = 40;
const CARVE = 10;
export const WATER_DROP = 2.5;
export const SEA_Y = -0.5;
/** The bridge's deck (u above the grass): where walkers stand on it. */
const DECK_Y = GRASS_Y + 5;

const sat = (v: number) => Math.max(0, Math.min(1, v));
const smooth = (a: number, b: number, v: number) => {
  const t = sat((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};

/** Distance from a point to a rounded rectangle's edge (negative inside): world.ts's. */
function roundRectDist(r: { x0: number; x1: number; z0: number; z1: number; r: number }, x: number, z: number): number {
  const cx = (r.x0 + r.x1) / 2, cz = (r.z0 + r.z1) / 2;
  const hx = (r.x1 - r.x0) / 2 - r.r, hz = (r.z1 - r.z0) / 2 - r.r;
  const qx = Math.abs(x - cx) - hx, qz = Math.abs(z - cz) - hz;
  return Math.hypot(Math.max(qx, 0), Math.max(qz, 0)) + Math.min(Math.max(qx, qz), 0) - r.r;
}

/** Catmull-Rom through the points (the ends held), n steps a span; a third value (the width) linearly: scripts/terrain.ts's. */
function smoothLine(pts: readonly (readonly number[])[], n: number): number[][] {
  const out: number[][] = [];
  const at = (i: number) => pts[Math.max(0, Math.min(pts.length - 1, i))];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = at(i - 1), p1 = at(i), p2 = at(i + 1), p3 = at(i + 2);
    for (let k = 0; k < n; k++) {
      const t = k / n, t2 = t * t, t3 = t2 * t;
      const cr = (a: number, b: number, c: number, d: number) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      const q = [cr(p0[0], p1[0], p2[0], p3[0]), cr(p0[1], p1[1], p2[1], p3[1])];
      if (p1.length > 2) q.push(p1[2] + (p2[2] - p1[2]) * t);
      out.push(q);
    }
  }
  out.push([...pts[pts.length - 1]]);
  return out;
}

/** The stream's smoothed centreline [x, z, width] (the bake's: 8 steps a span). */
export const RIVER_LINE = smoothLine(RIVER, 8);

/** Distance to the smoothed centreline and the half-width there. */
function riverAt(x: number, z: number): { d: number; hw: number } {
  let d = Infinity, hw = 0;
  for (let i = 0; i < RIVER_LINE.length - 1; i++) {
    const [ax, az, aw] = RIVER_LINE[i], [bx, bz, bw] = RIVER_LINE[i + 1];
    // a quick reject: the segment's box grown by 60u
    if (x < Math.min(ax, bx) - 60 || x > Math.max(ax, bx) + 60 || z < Math.min(az, bz) - 60 || z > Math.max(az, bz) + 60) continue;
    const dx = bx - ax, dz = bz - az, L = dx * dx + dz * dz || 1;
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / L));
    const e = Math.hypot(x - (ax + dx * t), z - (az + dz * t));
    if (e < d) {
      d = e;
      hw = (aw + (bw - aw) * t) / 2;
    }
  }
  return { d, hw };
}

/** The land's height before the water is carved: grass, beach, seabed, and tier 2 above the cliff. */
export function baseHeight(x: number, z: number): number {
  const d = roundRectDist(LAND, x, z);
  if (d > 0) return -Math.min(d * 0.12, 7);
  const g = roundRectDist(GRASS, x, z);
  const beach = Math.min(1.6, -d * 0.06);
  let y = Math.max(beach, GRASS_Y * smooth(8, -4, g));
  // tier 2: the cliff's slope from its foot to its top edge, over the grass only
  const up = smooth(CLIFF.z0, CLIFF.z1, z) * smooth(4, -8, g);
  y += TIER * up;
  return y;
}

/** How deep a water body cuts at (x, z): 0 off it … 1 in its channel; and the bank's height there. */
function carve(x: number, z: number): number {
  let k = 0;
  const r = riverAt(x, z);
  if (r.d < r.hw + 8) k = Math.max(k, smooth(r.hw + 4, r.hw - 5, r.d));
  for (const o of [POND, SPRING]) {
    const e = Math.hypot((x - o.x) / (o.rx + 6), (z - o.z) / (o.rz + 6));
    if (e < 1.2) k = Math.max(k, smooth(1.02, 0.78, e));
  }
  return k;
}

/** The ground's height (the mesh's vertices). */
export function groundHeight(x: number, z: number): number {
  const b = baseHeight(x, z);
  const k = carve(x, z);
  return k ? b - CARVE * k : b;
}

/** Where a walker's feet are: the ground, or the bridge's deck. */
export function feetY(x: number, z: number): number {
  if (onBridge(x, z)) {
    // the deck arches a little from its ends to its middle
    const t = (z - BRIDGE.z0) / (BRIDGE.z1 - BRIDGE.z0);
    return GRASS_Y + 1 + (DECK_Y - GRASS_Y) * Math.sin(Math.PI * t);
  }
  return Math.max(groundHeight(x, z), SEA_Y - 1);
}

/** The ground mesh's grid (u) and chunks (the bake's 8 chunks of 270u). */
const CELL = 6;
export const CHUNKS = 8;
const CHUNK_D = (PLAN.z1 - PLAN.z0) / CHUNKS;

/** One chunk's heightfield: positions in three's space (x, y, −z), uvs into its baked texture (v = 1 at its far edge: the image's
 *  top) and the triangle indices. */
export function chunkGrid(i: number, cell = CELL): { pos: Float32Array; uv: Float32Array; index: Uint32Array; cols: number; rows: number } {
  const z0 = PLAN.z0 + i * CHUNK_D, W = PLAN.x1 - PLAN.x0;
  const cols = Math.ceil(W / cell), rows = Math.ceil(CHUNK_D / cell);
  const pos = new Float32Array((cols + 1) * (rows + 1) * 3), uv = new Float32Array((cols + 1) * (rows + 1) * 2);
  let p = 0, q = 0;
  for (let r = 0; r <= rows; r++) {
    const z = z0 + (r / rows) * CHUNK_D;
    for (let c = 0; c <= cols; c++) {
      const x = PLAN.x0 + (c / cols) * W;
      pos[p++] = x;
      pos[p++] = groundHeight(x, z);
      pos[p++] = -z;
      uv[q++] = c / cols;
      uv[q++] = r / rows;
    }
  }
  const index = new Uint32Array(cols * rows * 6);
  let k = 0;
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
      const a = r * (cols + 1) + c, b = a + 1, d = a + cols + 1, e = d + 1;
      index[k++] = a; index[k++] = b; index[k++] = d;
      index[k++] = b; index[k++] = e; index[k++] = d;
    }
  return { pos, uv, index, cols, rows };
}

/** world.ts's island as the 3D engine's ground (engine.ts GroundSource): its heightfield in the bake's chunks. */
export const WORLD_GROUND = {
  chunks: CHUNKS,
  grid: (i: number) => chunkGrid(i),
  span: (i: number): [number, number] => [PLAN.z0 + i * CHUNK_D, PLAN.z0 + (i + 1) * CHUNK_D],
  height: groundHeight,
  feet: feetY
};
