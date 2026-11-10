// The shop's floor plan (docs/design.md "The shop"), pure: NH's built-up Nook's Cranny (IdrMarket02, static/room/shop/
// shell.glb: scripts/world3d-models.ts --shop) in its own model units (a tile is 10, as the rooms'): the shop floor's
// checkered tiles on the left with the tiered stage at the back, the counter corner on the right (the twins behind the
// counter), the door in the front wall. Where today's stock is shown (`display`: on the stage's two tiers, small
// things on the blue table, a few on the floor by the left wall, wall things on the back wall over the stage), where
// one may walk (`walkPath`: A* on a half-tile grid round what stands), and which wall a part of the model is (the
// cutaway's: `side`). Measured off the converted model (its height map and a top view, 2026-11-10).
import { footprint, ITEMS } from '../tent/items.ts';
import { HALF, TILE, isWallItem, type Facing, type Pt } from '../tent/grid.ts';

/** The floor's rect (model units: x0, x1, z0, z1): the shop part's left wall to the counter corner's right one, the
 *  back wall to the front one. */
export const RECT: [number, number, number, number] = [-70, 70, -50, 45];
/** The walls' height (the model's trim's top). */
export const WALL_H = 48;
/** The front wall's plane and the door in it (its middle, its width): the entrance's steps outside. */
export const FRONT = 45;
export const DOOR: [number, number] = [-20, 20];
/** Where one comes in (just inside the door) and stands to talk at the counter. */
export const DOOR_IN: Pt = [-20, 38];
export const COUNTER_FRONT: Pt = [36, 27];
/** The twins behind the counter (NH: まめきち at the register, つぶきち beside him), facing the shop. */
export const TWINS: Readonly<Record<'timmy' | 'tommy', Pt>> = { timmy: [61, 23], tommy: [61, 34] };
/** The shop part's right wall (it stands out to the counter corner's back wall) and the corner's back wall. */
const INNER_X = 22.5, CORNER_Z = 5;

/** Which wall a point of the model (over the floor) belongs to: 0 the back (the stage's, and the counter corner's),
 *  1 the left, 2 the right (the corner's, and the shop part's own, standing in), or null (the floor and what stands
 *  on it). */
export function side(x: number, y: number, z: number): 0 | 1 | 2 | null {
  if (y < 0.5) return null;
  if (x < RECT[0] + 0.5) return 1;
  if (x > RECT[1] - 0.5) return 2;
  if (z < RECT[2] - 0.2) return 0;
  // the shop part's right wall, in to the corner's back wall; the corner's back wall
  if (z < CORNER_Z && x > INNER_X - 1.5 && x < INNER_X + 2.5) return 2;
  if (x > INNER_X && z > CORNER_Z - 2.5 && z < CORNER_Z + 0.5) return 0;
  return null;
}

/** Where things are shown: a zone of whole cells (a tile each) from its back-left corner (model units), how high its
 *  top is, and what may stand there (`small`: only NH's small things, as on a table). */
interface Zone { id: string; x0: number; z0: number; cols: number; rows: number; y: number; small?: boolean }
export const ZONES: readonly Zone[] = [
  // the stage's top tier (NH's blue cloth), two rows; its lower tier, one
  { id: 'top', x0: -68, z0: -48, cols: 8, rows: 2, y: 8 },
  { id: 'tier', x0: -68, z0: -19, cols: 8, rows: 1, y: 6 },
  // the blue table in front of the stage: small things
  { id: 'table', x0: -5, z0: 5, cols: 2, rows: 1, y: 5, small: true },
  // the floor along the left wall
  { id: 'floor', x0: -68, z0: 14, cols: 1, rows: 3, y: 0 }
];
/** The back wall over the stage: its spots across (each a tile, from x0) and how high a wall thing's middle hangs. */
export const WALL_ZONE = { x0: -68, cols: 8, y: 27 };

/** A piece shown: the rooms' Placed (engine.ts: its tile, facing, its top's height and its middle in model units). */
export interface Shown { id: string; item: string; x: number; z: number; f: Facing; y: number; at: [number, number] }

const isSmallItem = (c: string) => !!ITEMS[c]?.sm;

/**
 * Today's stock as shown (pure, the same on every phone): every piece placed where it fits, the largest first and in
 * the stock's order among equals; a piece placed nowhere is in `rest` (the list has it). Wall things on the back wall,
 * small ones on the table first, the rest on the stage's tiers, then by the left wall. Each faces the front (NH's
 * models face +z, toward the camera), turned a quarter where only that fits.
 */
export function display(stock: readonly string[]): { shown: Shown[]; rest: string[] } {
  const shown: Shown[] = [], rest: string[] = [];
  const taken = new Map<string, Set<number>>(ZONES.map((z) => [z.id, new Set<number>()]));
  const wallTaken = new Set<number>();
  const area = (c: string) => (ITEMS[c] ? ITEMS[c].w * ITEMS[c].d : 1);
  const order = stock.map((c, i) => [c, i] as const).sort((a, b) => area(b[0]) - area(a[0]) || a[1] - b[1]);
  for (const [code] of order) {
    if (!ITEMS[code]) {
      rest.push(code);
      continue;
    }
    if (isWallItem(code)) {
      const w = ITEMS[code].w;
      let at = -1;
      for (let i = 0; i + w <= WALL_ZONE.cols && at < 0; i++) if ([...Array(w).keys()].every((k) => !wallTaken.has(i + k))) at = i;
      if (at < 0) {
        rest.push(code);
        continue;
      }
      for (let k = 0; k < w; k++) wallTaken.add(at + k);
      const x = WALL_ZONE.x0 + (at + w / 2) * TILE;
      shown.push({ id: `s-${code}`, item: code, x: Math.round((x + HALF) / TILE), z: 0, f: 0, y: WALL_ZONE.y, at: [x, 0] });
      continue;
    }
    const zones = ZONES.filter((z) => !z.small || isSmallItem(code));
    // a small thing on the table first (NH's display), the rest in the zones' order
    if (isSmallItem(code)) zones.sort((a, b) => Number(!!b.small) - Number(!!a.small));
    let put: Shown | null = null;
    for (const z of zones) {
      for (const f of [0, 1] as Facing[]) {
        const [w, d] = footprint(code, f);
        if (w > z.cols || d > z.rows) continue;
        const t = taken.get(z.id)!;
        for (let r = 0; r + d <= z.rows && !put; r++) for (let c = 0; c + w <= z.cols && !put; c++) {
          const cells: number[] = [];
          for (let i = 0; i < w; i++) for (let j = 0; j < d; j++) cells.push((r + j) * z.cols + c + i);
          if (cells.some((k) => t.has(k))) continue;
          for (const k of cells) t.add(k);
          const cx = z.x0 + (c + w / 2) * TILE, cz = z.z0 + (r + d / 2) * TILE;
          put = { id: `s-${code}`, item: code, x: Math.floor((cx - (w * TILE) / 2 + HALF) / TILE), z: Math.floor((cz - (d * TILE) / 2 + HALF) / TILE), f, y: z.y, at: [cx, cz] };
        }
        if (put) break;
      }
      if (put) break;
    }
    if (put) shown.push(put);
    else rest.push(code);
  }
  return { shown, rest };
}

// ---- the walk: a half-tile grid over the floor's rect ----
const CELL = TILE / 2;
const NX = Math.round((RECT[1] - RECT[0]) / CELL), NZ = Math.round((RECT[3] - RECT[2]) / CELL);
const PAD = 3;
/** What never moves and one never walks through (model units: x0, x1, z0, z1): the stage and its steps, the blue table,
 *  the counter corner's back (the counter, the barrels, the twins' side), the plant and the basket. Outside the L of
 *  the floor (the corner's back, behind its wall) too. */
const FIXED: readonly [number, number, number, number][] = [
  [-72, INNER_X + 3, -52, 3],
  [-72, -13, -52, 13],
  [-8, 18, 2, 18],
  [43, 72, 3, 47],
  [INNER_X - 2, 72, -52, CORNER_Z + 2]
];
const inRect = (x: number, z: number, r: readonly [number, number, number, number]) => x >= r[0] && x < r[1] && z >= r[2] && z < r[3];

/** The cells blocked: the walls (a little in), what's fixed, the pieces shown on the floor (by their footprint). */
export function blocked(shown: readonly Shown[]): Uint8Array {
  const b = new Uint8Array(NX * NZ);
  for (let i = 0; i < NX; i++) for (let j = 0; j < NZ; j++) {
    const x = RECT[0] + (i + 0.5) * CELL, z = RECT[2] + (j + 0.5) * CELL;
    if (x < RECT[0] + PAD || x > RECT[1] - PAD || z < RECT[2] + PAD || z > RECT[3] - PAD || FIXED.some((r) => inRect(x, z, r))) b[i * NZ + j] = 1;
  }
  for (const s of shown) {
    if (s.y > 0 || isWallItem(s.item) || ITEMS[s.item]?.rug) continue;
    const [w, d] = footprint(s.item, s.f), x0 = s.at[0] - (w * TILE) / 2, z0 = s.at[1] - (d * TILE) / 2;
    for (let i = 0; i < NX; i++) for (let j = 0; j < NZ; j++) {
      const x = RECT[0] + (i + 0.5) * CELL, z = RECT[2] + (j + 0.5) * CELL;
      if (x > x0 - 1 && x < x0 + w * TILE + 1 && z > z0 - 1 && z < z0 + d * TILE + 1) b[i * NZ + j] = 1;
    }
  }
  return b;
}
const cellOf = (p: Pt): [number, number] => [
  Math.min(NX - 1, Math.max(0, Math.floor((p[0] - RECT[0]) / CELL))),
  Math.min(NZ - 1, Math.max(0, Math.floor((p[1] - RECT[2]) / CELL)))
];
const mid = (i: number, j: number): Pt => [RECT[0] + (i + 0.5) * CELL, RECT[2] + (j + 0.5) * CELL];

/** Whether one can stand at `p`. */
export const standable = (b: Uint8Array, p: Pt): boolean => {
  const [i, j] = cellOf(p);
  return inRect(p[0], p[1], [RECT[0], RECT[1], RECT[2], RECT[3]]) && !b[i * NZ + j];
};

/** Whether the segment a → c crosses no blocked cell (sampled every quarter cell, the walker's width either side). */
function clear(b: Uint8Array, a: Pt, c: Pt): boolean {
  const n = Math.ceil(Math.hypot(c[0] - a[0], c[1] - a[1]) / (CELL / 4));
  const dx = c[0] - a[0], dz = c[1] - a[1], l = Math.hypot(dx, dz) || 1;
  for (let k = 0; k <= n; k++) {
    const t = n ? k / n : 0;
    for (const o of [-1.2, 0, 1.2]) {
      const [i, j] = cellOf([a[0] + dx * t + (-dz / l) * o, a[1] + dz * t + (dx / l) * o]);
      if (b[i * NZ + j]) return false;
    }
  }
  return true;
}

/**
 * The way from `from` to `to` round what stands: the points after `from` (the last is `to`, or the nearest reachable
 * point to it when `to` is blocked), [] when it's there already. As the rooms' (tent/grid.ts walkPath): A* over the
 * half-tile cells (8 ways, no corner cutting), the corners pulled straight.
 */
export function walkPath(b: Uint8Array, from: Pt, to: Pt): Pt[] {
  const s = cellOf(from), g0 = cellOf(to);
  const idx = (i: number, j: number) => i * NZ + j;
  const h = (k: number) => Math.hypot(Math.floor(k / NZ) - g0[0], (k % NZ) - g0[1]);
  const cost = new Float64Array(NX * NZ).fill(Infinity), came = new Int32Array(NX * NZ).fill(-1), seen = new Uint8Array(NX * NZ);
  const open = new Map<number, number>();
  const si = idx(s[0], s[1]), gi = idx(g0[0], g0[1]);
  cost[si] = 0;
  open.set(si, h(si));
  let best = si, bestH = h(si);
  while (open.size) {
    let cur = -1, cf = Infinity;
    for (const [k, f] of open) if (f < cf) (cf = f), (cur = k);
    open.delete(cur);
    if (seen[cur]) continue;
    seen[cur] = 1;
    if (h(cur) < bestH) (bestH = h(cur)), (best = cur);
    if (cur === gi) break;
    const ci = Math.floor(cur / NZ), cj = cur % NZ;
    for (let di = -1; di <= 1; di++) for (let dj = -1; dj <= 1; dj++) {
      if (!di && !dj) continue;
      const ni = ci + di, nj = cj + dj;
      if (ni < 0 || nj < 0 || ni >= NX || nj >= NZ || b[idx(ni, nj)]) continue;
      if (di && dj && (b[idx(ci + di, cj)] || b[idx(ci, cj + dj)])) continue;
      const nk = idx(ni, nj), c = cost[cur] + (di && dj ? Math.SQRT2 : 1);
      if (c < cost[nk]) {
        cost[nk] = c;
        came[nk] = cur;
        open.set(nk, c + h(nk));
      }
    }
  }
  const reached = seen[gi] === 1, end = reached ? gi : best;
  const cells: number[] = [];
  for (let k = end; k !== -1 && k !== si; k = came[k]) cells.push(k);
  cells.reverse();
  const last: Pt = reached && !b[gi] ? to : mid(Math.floor(end / NZ), end % NZ);
  const pts: Pt[] = [...cells.slice(0, -1).map((k) => mid(Math.floor(k / NZ), k % NZ)), last];
  if (!cells.length && Math.hypot(last[0] - from[0], last[1] - from[1]) < 0.5) return [];
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
