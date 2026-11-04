// The sea's fishing coasts (docs/design.md "Critters", docs/backend.md "Ambient life"), pure: NH's sea shadows swim all
// round the island, so the sea is cut into stretches of its coast, each one of ambient life's sea channels (one shadow
// at a time each, ambient.ts crittersAt). From the shared layout's tiles alone (world.ts layoutNav's layout: the same
// on both phones), so both phones cut the same stretches: a stretch is the sea within BAND tiles of the shore (land
// beside the sea) that the camera can show, one per COAST_U of coastline (today's density: one shadow off the front
// beach), each a sector of the coast round the island's middle, the first the front beach's (centred straight out to
// sea from the island's middle). Without a layout (the old fixed island) the one stretch is SEA_SWIM. Engine-proof:
// integer tiles, the diamond angle (no trig), squared distances.
import { GRID, TILE, onGrid, tileMid, tileX } from '#lib/layout/grid.ts';
import { extentOf, type Layout } from '#lib/layout/model.ts';
import { SEA_SWIM, type Swim } from './critters.ts';
import { layoutNav, worldGen } from './world.ts';

/** One shadow's coast per this much coastline (u): the front beach's 15 tiles, which held today's one sea shadow. */
export const COAST_U = 450;
/** How far out from the shore a stretch's water reaches (tiles, from the shore tile's middle): today's strip off the
 *  front beach (16–100u out). */
const BAND = 3;
/** How far round the grid the sea is looked at (tiles: off the grid is sea). */
const MARGIN = BAND + 1;
/** The 3D camera's middle and how far past the land it shows sideways (u: world3d/engine.ts MID_X, SEA_X; zoomed in,
 *  panned to the side). */
const MID_X = 195, SEA_X = 24;
const SIDES = [[1, 0], [-1, 0], [0, 1], [0, -1]] as const;

export interface Coast {
  /** Its sea channel (0: the front beach's, ambient.ts's `sea`). */
  k: number;
  /** Which side of the island it's on (by its middle from the island's, the island's extent evened out). */
  side: 'front' | 'back' | 'left' | 'right';
  /** Its water: the box round its tiles (along the coast) and the tiles' middles (world), where its shadow swims. */
  area: Swim;
  /** Its coastline (u: the shore's tile edges on the sea in its sector). */
  len: number;
}

/** The diamond angle of (x, y): 0…4 round the circle, monotonic as an angle is, by division alone. */
const diamond = (x: number, y: number): number =>
  x === 0 && y === 0 ? 0 : y >= 0 ? (x >= 0 ? y / (x + y) : 1 - x / (-x + y)) : x < 0 ? 2 - y / (-x - y) : 3 + x / (x - y);

/** The box along a set of tile middles (principal axis), grown by half a tile. */
function boxOf(pts: readonly (readonly [number, number])[]): Swim {
  const n = pts.length;
  let cx = 0, cz = 0;
  for (const [x, z] of pts) (cx += x), (cz += z);
  cx /= n;
  cz /= n;
  let a = 0, b = 0, d = 0;
  for (const [x, z] of pts) (a += (x - cx) ** 2), (b += (x - cx) * (z - cz)), (d += (z - cz) ** 2);
  const lam = (a + d) / 2 + Math.sqrt(((a - d) / 2) ** 2 + b * b);
  let [ux, uz] = b !== 0 ? [lam - d, b] : a >= d ? [1, 0] : [0, 1];
  const len = Math.sqrt(ux * ux + uz * uz);
  [ux, uz] = [ux / len, uz / len];
  let L = 0, W = 0;
  for (const [x, z] of pts) {
    L = Math.max(L, Math.abs((x - cx) * ux + (z - cz) * uz));
    W = Math.max(W, Math.abs(-(x - cx) * uz + (z - cz) * ux));
  }
  return { cx, cz, ux, uz, L: L + TILE / 2, W: W + TILE / 2, tiles: pts };
}

let memo: { gen: number; coasts: Coast[] } | null = null;

/** The island's fishing coasts now (memoized on the world's geometry). */
export function coasts(): readonly Coast[] {
  const gen = worldGen();
  if (memo?.gen === gen) return memo.coasts;
  const nav = layoutNav();
  const out = nav ? cut(nav.layout) : [];
  memo = { gen, coasts: out.length ? out : [{ k: 0, side: 'front', area: SEA_SWIM, len: SEA_SWIM.L * 2 }] };
  return memo.coasts;
}

/** The coast a sea channel swims (ambient.ts's channel k; past the island's count: the front's). */
export const coastOf = (k = 0): Coast => {
  const all = coasts();
  return all[k] ?? all[0];
};

const mod4 = (a: number) => ((a % 4) + 4) % 4;

function cut(l: Layout): Coast[] {
  const sea = (c: number, r: number) => l.kind(c, r) === 'sea';
  // the shore: land (not water) beside the sea, and its edges on the sea (a point each, at the edge's middle)
  const shore: [number, number][] = [], edges: [number, number][] = [];
  for (let r = 0; r < GRID.rows; r++)
    for (let c = 0; c < GRID.cols; c++) {
      const k = l.kind(c, r);
      if (k === 'sea' || k === 'river' || k === 'pond') continue;
      const e = SIDES.filter(([dc, dr]) => sea(c + dc, r + dr));
      if (!e.length) continue;
      shore.push([c, r]);
      for (const [dc, dr] of e) edges.push([c + dc / 2, r + dr / 2]);
    }
  if (!shore.length) return [];
  // the band: the sea within BAND tiles of the shore that the camera can show (at least half a tile of it, sideways)
  const land = extentOf(l).land, half = (land.x1 - land.x0) / 2 + SEA_X;
  const shown = (c: number) => Math.min(tileX(c + 1), MID_X + half) - Math.max(tileX(c), MID_X - half) >= TILE / 2;
  const band: [number, number][] = [];
  for (let r = -MARGIN; r < GRID.rows + MARGIN; r++)
    for (let c = -MARGIN; c < GRID.cols + MARGIN; c++) {
      if ((onGrid(c, r) && !sea(c, r)) || !shown(c) || !shore.some(([sc, sr]) => (sc - c) ** 2 + (sr - r) ** 2 <= BAND * BAND)) continue;
      band.push([c, r]);
    }
  if (!band.length) return [];
  // round the island's middle (its extent evened out: the long island is a circle to the angle), from straight out in
  // front (−z): sectors of equal coastline, the first centred on the front
  let c0 = Infinity, c1 = -Infinity, r0 = Infinity, r1 = -Infinity;
  for (const [c, r] of shore) (c0 = Math.min(c0, c)), (c1 = Math.max(c1, c)), (r0 = Math.min(r0, r)), (r1 = Math.max(r1, r));
  const mc = (c0 + c1) / 2, mr = (r0 + r1) / 2, hc = Math.max(1, (c1 - c0) / 2), hr = Math.max(1, (r1 - r0) / 2);
  const ang = (c: number, r: number) => mod4(diamond((c - mc) / hc, (r - mr) / hr) + 1); // (front: 0)
  const around = edges.map(([c, r]) => ang(c, r)).sort((a, b) => a - b);
  const E = around.length, n = Math.max(1, Math.round((E * TILE) / COAST_U));
  // sector k starts at the edge k·E/n round from the front, turned back by half a sector
  const start = Array.from({ length: n }, (_, k) => around[mod4E(Math.floor((k * E) / n - E / (2 * n)), E)]);
  const sectorOf = (a: number) => {
    let best = 0;
    for (let k = 1; k < n; k++) if (mod4(a - start[k]) < mod4(a - start[best])) best = k;
    return best;
  };
  const parts: [number, number][][] = Array.from({ length: n }, () => []);
  for (const [c, r] of band) parts[sectorOf(ang(c, r))].push([c, r]);
  const lens = new Array<number>(n).fill(0);
  for (const [c, r] of edges) lens[sectorOf(ang(c, r))] += TILE;
  const out: Coast[] = [];
  parts.forEach((part, k) => {
    if (!part.length) return;
    const area = boxOf(part.map(([c, r]) => tileMid(c, r)));
    const u = ((area.cx - GRID.x0) / TILE - 0.5 - mc) / hc, v = ((area.cz - GRID.z0) / TILE - 0.5 - mr) / hr;
    const side = Math.abs(u) > Math.abs(v) ? (u < 0 ? 'left' : 'right') : v < 0 ? 'front' : 'back';
    out.push({ k: out.length, side, area, len: lens[k] });
  });
  return out;
}
const mod4E = (i: number, E: number) => ((i % E) + E) % E;
