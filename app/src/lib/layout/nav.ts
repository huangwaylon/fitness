// Walking on the layout (docs/island-layout.md "Derived, never hand-made"), pure: island/nav.ts's job for a layout
// anyone can change, and its drop-in (tapWalk.ts planTap takes either): a walk grid at half a tile (15u), A* over it
// with the corners pulled straight, the same snapping rules for a tap.
//   A cell is walkable on land (not the sea, a river or a pond, but a bridge's deck over them), off every blocking
//   footprint (its block box, the trunk of a tree) and off the extras (things that come and go). A step between
//   two cells keeps to one tier, but for stairs: a ramp's cells rise along it, and a step joins a cell within half a
//   tier of it (the ramp's foot the lower tier, its top the upper).
//   Snapping: a tap on walkable ground nobody can reach goes to the nearest reachable point; on a home, to its door;
//   on water, to the nearest bank facing it; on anything else, the nearest walkable point within 40u.
import { GRID, TILE, isWater, kindOf, tierOf, idx, onGrid, tileX, tileZ } from './grid.ts';
import { doorOf, facingVec, footOf, objMid, originOf, type Layout, type Obj } from './model.ts';
import { goesIn, kindDef } from './catalog.ts';

type Pt = readonly [number, number];
/** A box (u; y is z, as island/geom.ts's). */
export interface Box {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
}
export type Extra = readonly Box[];

/** The walk grid's cell (u): half a tile. */
const CELL = TILE / 2;
const COLS = GRID.cols * 2, ROWS = GRID.rows * 2;
/** How far feet keep from a blocking footprint (u). */
const PAD = 5;
const SNAP_NEAR = 40;
const SNAP_BANK = 160;
/** A step within this many tiers is level enough (a ramp's cells to the ground beside them). */
const STEP = 0.5;

type WaterKind = 'sea' | 'river' | 'pond';
export interface Snap {
  to: Pt;
  kind: 'here' | 'door' | 'bank' | 'near';
  face?: 'l' | 'r';
  /** The building whose door it is (its object id: a home, the museum). */
  building?: string;
  water?: WaterKind;
}

export interface LayoutNav {
  readonly layout: Layout;
  /** Each cell: walkable (1) or not (0). */
  readonly open: Uint8Array;
  /** Each cell's level (tiers, a ramp's in between). */
  readonly level: Float32Array;
  /** Each cell's connected region (−1 blocked) and the island's main one (home's). */
  readonly comp: Int32Array;
  readonly main: number;
  /** The named spots (the villagers' home spots, centre stage, the doors, the seats). */
  readonly named: Record<string, Pt>;
  /** Each building's door (a step in front of it) and footprint, by its object id: the homes, the museum. */
  readonly doors: Record<string, { at: Pt; box: Box }>;
  readonly buildMs: number;
}

export const isLayoutNav = (g: unknown): g is LayoutNav => typeof g === 'object' && g !== null && 'open' in g && 'level' in g;

const cellOf = (x: number, z: number): [number, number] => [Math.floor((x - GRID.x0) / CELL), Math.floor((z - GRID.z0) / CELL)];
const cellMid = (i: number, j: number): Pt => [GRID.x0 + (i + 0.5) * CELL, GRID.z0 + (j + 0.5) * CELL];
const inCells = (i: number, j: number) => i >= 0 && j >= 0 && i < COLS && j < ROWS;
const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
/** The distance between two points (u). */
export const dist = (a: Pt, b: Pt) => Math.hypot(b[0] - a[0], b[1] - a[1]);

/** An object's block box (u, unpadded): its kind's trunk or its whole footprint. */
export function blockBox(layout: Layout, o: Obj): Box | null {
  const def = kindDef(o.k);
  if (!def?.block) return null;
  const [w, d] = footOf(layout, o);
  if (def.foot && o.k !== 'home') {
    const [mx, mz] = objMid(layout, o);
    const [fw, fd] = def.turns && o.f % 2 ? [def.foot[1], def.foot[0]] : def.foot;
    return { x0: mx - fw / 2, x1: mx + fw / 2, y0: mz - fd / 2, y1: mz + fd / 2 };
  }
  const nx = o.n?.[0] ?? 0, nz = o.n?.[1] ?? 0, [x0, z0] = originOf(layout, o);
  return { x0: tileX(x0) + nx, x1: tileX(x0 + w) + nx, y0: tileZ(z0) + nz, y1: tileZ(z0 + d) + nz };
}

/** The walk grid of a layout. */
export function navOf(layout: Layout): LayoutNav {
  const t0 = now();
  const open = new Uint8Array(COLS * ROWS), level = new Float32Array(COLS * ROWS);
  const deck = new Uint8Array(COLS * ROWS);
  for (let j = 0; j < ROWS; j++)
    for (let i = 0; i < COLS; i++) {
      const c = i >> 1, r = j >> 1;
      const code = onGrid(c, r) ? layout.codes[idx(c, r)] : 0;
      const k = kindOf(code);
      open[j * COLS + i] = isWater(k) ? 0 : 1;
      level[j * COLS + i] = tierOf(code);
    }
  // the bridges' decks and the stairs' ramps
  for (const o of layout.objects.values()) {
    if (o.k !== 'bridge' && o.k !== 'stairs') continue;
    const [w, d] = footOf(layout, o);
    const i0 = o.x * 2, j0 = o.z * 2, i1 = (o.x + w) * 2, j1 = (o.z + d) * 2;
    const base = onGrid(o.x, o.z) ? tierOf(layout.codes[idx(o.x, o.z)]) : 0;
    const [fx, fz] = facingVec(o.f);
    for (let j = j0; j < j1; j++)
      for (let i = i0; i < i1; i++) {
        if (!inCells(i, j)) continue;
        const k = j * COLS + i;
        if (o.k === 'bridge') {
          // the deck, at its bank's tier
          open[k] = 1;
          deck[k] = 1;
          level[k] = base;
        } else {
          // the ramp: rising away from its facing (f 0, facing the camera, climbs toward +z)
          const t = fz !== 0 ? (fz < 0 ? (j - j0 + 0.5) / (j1 - j0) : (j1 - j - 0.5) / (j1 - j0)) : fx > 0 ? (i1 - i - 0.5) / (i1 - i0) : (i - i0 + 0.5) / (i1 - i0);
          open[k] = 1;
          level[k] = base + t;
        }
      }
  }
  // the blocking footprints, padded
  const doors: Record<string, { at: Pt; box: Box }> = {};
  for (const o of layout.objects.values()) {
    const b = blockBox(layout, o);
    if (!b) continue;
    const pad = goesIn(o.k) ? 0 : PAD;
    const [i0, j0] = cellOf(b.x0 - pad, b.y0 - pad), [i1, j1] = cellOf(b.x1 + pad, b.y1 + pad);
    for (let j = Math.max(0, j0); j <= Math.min(ROWS - 1, j1); j++)
      for (let i = Math.max(0, i0); i <= Math.min(COLS - 1, i1); i++) {
        const [mx, mz] = cellMid(i, j);
        if (mx > b.x0 - pad && mx < b.x1 + pad && mz > b.y0 - pad && mz < b.y1 + pad && !deck[j * COLS + i]) open[j * COLS + i] = 0;
      }
    if (goesIn(o.k)) {
      const dr = doorOf(layout, o), [fx, fz] = facingVec(o.f);
      doors[o.id] = { at: [dr.at[0] + fx * 16, dr.at[1] + fz * 16], box: b };
    }
  }
  const shell = { layout, open, level, comp: new Int32Array(COLS * ROWS).fill(-1), main: 0, named: {} as Record<string, Pt>, doors, buildMs: 0 };
  // the regions (4-connected over the steps a walker may take)
  let n = 0;
  const stack: number[] = [];
  for (let s = 0; s < COLS * ROWS; s++) {
    if (!open[s] || shell.comp[s] >= 0) continue;
    shell.comp[s] = n;
    stack.push(s);
    while (stack.length) {
      const k = stack.pop()!, i = k % COLS, j = (k - i) / COLS;
      for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
        const ni = i + di, nj = j + dj;
        if (!inCells(ni, nj)) continue;
        const q = nj * COLS + ni;
        if (shell.comp[q] < 0 && open[q] && Math.abs(level[q] - level[k]) <= STEP) {
          shell.comp[q] = n;
          stack.push(q);
        }
      }
    }
    n++;
  }
  // the named spots
  const named: Record<string, Pt> = {};
  const SPOT_NAME: Record<string, string> = { 'villager-a': 'homeA', 'villager-b': 'homeB' };
  for (const o of layout.objects.values()) {
    if (o.k === 'spot' && o.s && SPOT_NAME[o.s]) named[SPOT_NAME[o.s]] = objMid(layout, o);
    for (const [name, p] of seatsOf(layout, o)) named[name] = p;
    // where a villager stands to use it (the bulletin board): a step in front of its front edge
    if (kindDef(o.k)?.front) {
      const d = doorOf(layout, o), [fx, fz] = facingVec(o.f);
      named[`front-${o.id}`] = [d.at[0] + fx * 16, d.at[1] + fz * 16];
    }
  }
  for (const [id, d] of Object.entries(doors)) named[`door-${id}`] = d.at;
  shell.named = named;
  const home = named.homeA ? cellIndex(named.homeA) : -1;
  if (home >= 0 && shell.comp[home] >= 0) shell.main = shell.comp[home];
  else {
    // the biggest region
    const size = new Map<number, number>();
    for (const c of shell.comp) if (c >= 0) size.set(c, (size.get(c) ?? 0) + 1);
    shell.main = [...size.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 0;
  }
  shell.buildMs = now() - t0;
  return shell;
}

/** The seats on a piece (villager3d/seats3d.json's, its model's own, at NH's furniture scale: 3u a model unit): each
 *  one across the piece (u, +x its right as it faces us) and how far in front of its middle one stands to get on and
 *  off (the anchor's `from`: villager3d/seats3d.ts anchorsOf, a test holds the two together), sat or lain on. */
const SEAT_ON: Readonly<Record<string, { x: readonly number[]; front: number; lie?: true }>> = {
  'park-bench': { x: [-11.7, 11.7], front: 27.9 },
  'log-bench': { x: [-10.5, 12], front: 29.4 },
  'log-stool': { x: [0], front: 24.9 },
  'iron-chair': { x: [0], front: 24.9 },
  hammock: { x: [0.9], front: 30, lie: true },
  'beach-chair': { x: [-1.4], front: 30, lie: true },
  // the gym's (seats3d.json `use`): the weight bench lain on, the rest used in place (its anchor's `from`: in front of the
  // bike, the ball and the treadmill; beside the bag; under the pull-up bar, 15u behind its middle)
  'weight-bench': { x: [0.9], front: 30, lie: true },
  'exercise-bike': { x: [9], front: 24 },
  'exercise-ball': { x: [0], front: 24 },
  treadmill: { x: [4.5], front: 24 },
  'punching-bag': { x: [-24], front: 6 },
  pullup: { x: [0], front: -15 }
};
/** A piece's turn (three's yaw: 0 its front toward us, −z; a quarter turn each), as the 3D island stands it
 *  (world3d/objects.ts): a turning kind by its facing, a look-only facing (odd) a little turned. */
export const yawOf = (o: Obj): number => (kindDef(o.k)?.turns ? (o.f * Math.PI) / 2 : o.f % 2 ? 0.9 : 0);
/** Whether one lies on a seat (a hammock, a beach chair) rather than sits, by its piece's kind. */
export const liesOn = (k: string): boolean => !!SEAT_ON[k]?.lie;

/** @public (the scene's seats) Where a villager gets on a seat (a bench's two, a stool, a chair, a hammock: a step in
 *  front of it, where the 3D villager turns and sits or lies down) or a piece of the gym (the pull-up bar, the bike…: it
 *  steps on and uses it) (world.ts SEATS's names
 *  for the default's pieces, so a node id means the same on the old island and the new; a new piece's `seat-<id>`, two
 *  to a bench `seat-<id>-0|1`, left to right as it faces us). */
export function seatsOf(layout: Layout, o: Obj): [string, Pt][] {
  const [mx, mz] = objMid(layout, o);
  const on = SEAT_ON[o.k];
  if (on) {
    const NAMES: Record<string, readonly string[]> = { 'bench-mae': ['seatMaeL', 'seatMaeR'], 'bench-pond': ['seatPondL', 'seatPondR'], 'stool-1': ['stoolW'], 'stool-2': ['stoolE'], pullup: ['pullup'] };
    const names = NAMES[o.id] ?? (on.x.length > 1 ? on.x.map((_, i) => `seat-${o.id}-${i}`) : [`seat-${o.id}`]);
    // the model's across (+x) and front (+z, toward us at yaw 0) turned by its yaw, in the layout's x / z (z into the island)
    const a = yawOf(o), c = Math.cos(a), sn = Math.sin(a);
    return on.x.map((x, i) => [names[i], [Math.round(mx + x * c + on.front * sn), Math.round(mz + x * sn - on.front * c)]] as [string, Pt]);
  }
  return [];
}

/** Where a villager stands just out of a building's door (docs/design.md "Buildings": NH's step out), facing out: 30u
 *  beyond its door node (the building stays in view and tappable), each of us to one side (A on the left, B on the
 *  right of a door facing us) and the guest a step further out in the middle, so all can come out together; on
 *  walkable ground in the island's main region (the nearest whole point within 40u: a walk goes over the relay in
 *  whole units), else the door node itself (the editor keeps a door's front clear). Null for an object without a
 *  door. */
export function exitOf(g: LayoutNav, id: string, who: 'A' | 'B' | 'G'): { at: Pt; face: 'home' | 'l' | 'r' } | null {
  const d = g.doors[id], o = g.layout.objects.get(id);
  if (!d || !o) return null;
  const [fx, fz] = facingVec(o.f);
  const face = fx > 0 ? 'r' : fx < 0 ? 'l' : 'home';
  const out = who === 'G' ? 46 : 30, side = who === 'A' ? -12 : who === 'B' ? 12 : 0;
  const [wx, wz] = [d.at[0] + fx * out - fz * side, d.at[1] + fz * out + fx * side];
  for (let r = 0; r <= SNAP_NEAR; r += 2) {
    const n = r ? Math.max(12, Math.ceil((r * Math.PI * 2) / 3)) : 1;
    for (let a = 0; a < n; a++) {
      const x = Math.round(wx + Math.cos((a / n) * Math.PI * 2) * r), z = Math.round(wz + Math.sin((a / n) * Math.PI * 2) * r);
      if (reachable(g, x, z)) return { at: [x, z], face };
    }
  }
  return { at: [Math.round(d.at[0]), Math.round(d.at[1])], face };
}

function cellIndex(p: Pt): number {
  const [i, j] = cellOf(p[0], p[1]);
  return inCells(i, j) ? j * COLS + i : -1;
}

// ---- the tests ------------------------------------------------------------------------------------------------------

const inExtra = (extra: Extra | undefined, x: number, z: number) => !!extra?.some((b) => x > b.x0 - PAD && x < b.x1 + PAD && z > b.y0 - PAD && z < b.y1 + PAD);

/** Whether feet may stand at (x, z). */
export function walkable(g: LayoutNav, x: number, z: number, extra?: Extra): boolean {
  const k = cellIndex([x, z]);
  return k >= 0 && !!g.open[k] && !inExtra(extra, x, z);
}

/** The walk grid's level at (x, z) (its tier; a ramp's in between), or NaN off it. */
export function levelAt(g: LayoutNav, x: number, z: number): number {
  const k = cellIndex([x, z]);
  return k >= 0 ? g.level[k] : NaN;
}

/** Whether a step from cell a to its neighbour b is one a walker may take. */
const stepOk = (g: LayoutNav, a: number, b: number) => !!g.open[b] && Math.abs(g.level[a] - g.level[b]) <= STEP;

/** @public (island/nav.ts's) Whether a straight walk from a to b is clear (every cell it crosses walkable, every step level enough). */
export function clear(g: LayoutNav, a: Pt, b: Pt, extra?: Extra): boolean {
  const L = dist(a, b), n = Math.max(1, Math.ceil(L / 4));
  let prev = cellIndex(a);
  if (prev < 0) return false;
  for (let s = 1; s <= n; s++) {
    const x = a[0] + ((b[0] - a[0]) * s) / n, z = a[1] + ((b[1] - a[1]) * s) / n;
    const k = cellIndex([x, z]);
    if (k < 0 || !g.open[k] || inExtra(extra, x, z)) return false;
    if (k !== prev) {
      const pi = prev % COLS, pj = (prev - pi) / COLS, ki = k % COLS, kj = (k - ki) / COLS;
      if (pi !== ki && pj !== kj) {
        // a corner: both sides must be steppable
        const s1 = pj * COLS + ki, s2 = kj * COLS + pi;
        if (!(stepOk(g, prev, s1) && stepOk(g, s1, k)) || !(stepOk(g, prev, s2) && stepOk(g, s2, k))) return false;
      } else if (!stepOk(g, prev, k)) return false;
      prev = k;
    }
  }
  return true;
}

/** Whether walkable ground at (x, z) is in the island's main region. */
export function reachable(g: LayoutNav, x: number, z: number, extra?: Extra): boolean {
  const k = cellIndex([x, z]);
  return k >= 0 && walkable(g, x, z, extra) && g.comp[k] === g.main;
}

/** @public (island/nav.ts's) The nearest walkable point within `max` u (`main`: in the main region only). */
export function nearestWalkable(g: LayoutNav, x: number, z: number, max = SNAP_NEAR, extra?: Extra, main = false): Pt | null {
  const ok = main ? (px: number, pz: number) => reachable(g, px, pz, extra) : (px: number, pz: number) => walkable(g, px, pz, extra);
  if (ok(x, z)) return [x, z];
  for (let r = 2; r <= max; r += 2) {
    const n = Math.max(12, Math.ceil((r * Math.PI * 2) / 3));
    for (let a = 0; a < n; a++) {
      const px = x + Math.cos((a / n) * Math.PI * 2) * r, pz = z + Math.sin((a / n) * Math.PI * 2) * r;
      if (ok(px, pz)) return [Math.round(px * 10) / 10, Math.round(pz * 10) / 10];
    }
  }
  return null;
}

// ---- A* -------------------------------------------------------------------------------------------------------------

/** The way from `from` to `to`: the waypoints after `from`, ending at `to`; null when there is none. */
export function findPath(g: LayoutNav, from: Pt, to: Pt, extra?: Extra): Pt[] | null {
  if (!walkable(g, to[0], to[1], extra)) return null;
  if (clear(g, from, to, extra)) return [to];
  let s = cellIndex(from);
  if (s < 0 || !g.open[s]) {
    const near = nearestWalkable(g, from[0], from[1], 30, extra);
    s = near ? cellIndex(near) : -1;
  }
  const t = cellIndex(to);
  if (s < 0 || t < 0) return null;
  const blocked = (k: number) => {
    if (!extra?.length) return false;
    const i = k % COLS, [x, z] = cellMid(i, (k - i) / COLS);
    return inExtra(extra, x, z);
  };
  const N = COLS * ROWS;
  const gs = new Float64Array(N).fill(Infinity), prev = new Int32Array(N).fill(-1), done = new Uint8Array(N);
  const ti = t % COLS, tj = (t - ti) / COLS;
  const h = (k: number) => {
    const i = k % COLS, j = (k - i) / COLS, dx = Math.abs(i - ti), dz = Math.abs(j - tj);
    return (Math.max(dx, dz) + (Math.SQRT2 - 1) * Math.min(dx, dz)) * CELL;
  };
  const open = new Heap();
  gs[s] = 0;
  open.push(h(s), s);
  while (open.size) {
    const k = open.pop();
    if (done[k]) continue;
    if (k === t) break;
    done[k] = 1;
    const i = k % COLS, j = (k - i) / COLS;
    for (let dj = -1; dj <= 1; dj++)
      for (let di = -1; di <= 1; di++) {
        if (!di && !dj) continue;
        const ni = i + di, nj = j + dj;
        if (!inCells(ni, nj)) continue;
        const q = nj * COLS + ni;
        if (done[q] || !stepOk(g, k, q) || blocked(q)) continue;
        if (di && dj) {
          const a = j * COLS + ni, b = nj * COLS + i;
          if (!stepOk(g, k, a) || !stepOk(g, a, q) || !stepOk(g, k, b) || !stepOk(g, b, q) || blocked(a) || blocked(b)) continue;
        }
        const gq = gs[k] + (di && dj ? Math.SQRT2 : 1) * CELL;
        if (gq < gs[q] - 1e-9) {
          gs[q] = gq;
          prev[q] = k;
          open.push(gq + h(q), q);
        }
      }
  }
  if (gs[t] === Infinity) return null;
  const cells: Pt[] = [];
  for (let k = prev[t]; k !== s && k >= 0; k = prev[k]) {
    const i = k % COLS;
    cells.unshift(cellMid(i, (k - i) / COLS));
  }
  // pull the corners straight: from each point, the farthest one still in a clear line
  const pts: Pt[] = [...cells, to];
  const out: Pt[] = [];
  let at: Pt = from;
  let i = 0;
  while (i < pts.length) {
    let far = i;
    for (let k = pts.length - 1; k > i; k--)
      if (clear(g, at, pts[k], extra)) {
        far = k;
        break;
      }
    out.push(pts[far]);
    at = pts[far];
    i = far + 1;
  }
  return out;
}

/** @public (island/nav.ts's) A route's length from `from`. */
export function pathLength(from: Pt, pts: readonly Pt[]): number {
  let len = 0, at = from;
  for (const p of pts) {
    len += dist(at, p);
    at = p;
  }
  return len;
}

// ---- snapping a tap ---------------------------------------------------------------------------------------------------

/** @public (island/nav.ts's) The water at a point, or null (a bridge's deck is none). */
export function waterAt(g: LayoutNav, x: number, z: number): WaterKind | null {
  const k = cellIndex([x, z]);
  if (k >= 0 && g.open[k]) return null;
  const c = Math.floor((x - GRID.x0) / TILE), r = Math.floor((z - GRID.z0) / TILE);
  const kind = onGrid(c, r) ? kindOf(g.layout.codes[idx(c, r)]) : 'sea';
  return kind === 'sea' || kind === 'river' || kind === 'pond' ? kind : null;
}

/** @public (island/nav.ts's) The home whose footprint (a few units grace) holds a point, or null. */
export function buildingAt(g: LayoutNav, x: number, z: number): string | null {
  for (const [id, d] of Object.entries(g.doors)) if (x >= d.box.x0 - 2 && x <= d.box.x1 + 2 && z >= d.box.y0 - 2 && z <= d.box.y1 + 2) return id;
  return null;
}

/** Where a tap at (x, z) sends my villager (island/nav.ts snapTap's rules), or null. */
export function snapTap(g: LayoutNav, x: number, z: number, extra?: Extra): Snap | null {
  const face = (to: Pt) => (Math.abs(x - to[0]) >= 3 ? (x < to[0] ? 'l' : 'r') : undefined);
  if (walkable(g, x, z, extra)) {
    if (reachable(g, x, z, extra)) return { to: [x, z], kind: 'here' };
    const to = nearestWalkable(g, x, z, SNAP_BANK, extra, true);
    return to && { to, kind: 'near', face: face(to) };
  }
  const building = buildingAt(g, x, z);
  if (building) return { to: g.doors[building].at, kind: 'door', building };
  const water = waterAt(g, x, z);
  if (water) {
    const to = nearestWalkable(g, x, z, SNAP_BANK, extra, true);
    return to && { to, kind: 'bank', water, face: face(to) };
  }
  const to = nearestWalkable(g, x, z, SNAP_NEAR, extra, true);
  return to && { to, kind: 'near' };
}

/** A small binary heap of [f, index]. */
class Heap {
  private f: number[] = [];
  private v: number[] = [];
  get size() {
    return this.v.length;
  }
  push(f: number, v: number) {
    const F = this.f, V = this.v;
    let i = V.length;
    F.push(f);
    V.push(v);
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (F[p] <= F[i]) break;
      [F[p], F[i]] = [F[i], F[p]];
      [V[p], V[i]] = [V[i], V[p]];
      i = p;
    }
  }
  pop(): number {
    const F = this.f, V = this.v, top = V[0], lf = F.pop()!, lv = V.pop()!;
    if (V.length) {
      F[0] = lf;
      V[0] = lv;
      let i = 0;
      for (;;) {
        const l = 2 * i + 1, r = l + 1;
        let m = i;
        if (l < V.length && F[l] < F[m]) m = l;
        if (r < V.length && F[r] < F[m]) m = r;
        if (m === i) break;
        [F[m], F[i]] = [F[i], F[m]];
        [V[m], V[i]] = [V[i], V[m]];
        i = m;
      }
    }
    return top;
  }
}
