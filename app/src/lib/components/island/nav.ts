// Navigation on the rolling-log island (spec §4, docs/design.md "Walking"): where a tap sends my villager and the way
// there. Pure, from world.ts's constants, so a layout change carries over.
//   Obstacles: convex polygons grown by PAD (8u, half a walker's footprint): the stream as a chain of quads along its
//   centreline (cut at the bridge's deck), the pond and the spring as 16- and 12-gons, the cliff as two strips either side of the stairs, the
//   campsite's footprint, the trunks, bushes, the rock, the props, the
//   hedge, the bamboo and the rocks (walkGraph.ts's sizes). The sea is everything off the land (a convex rounded rectangle, so a straight walk between two
//   points on land stays on land).
//   Nodes: the obstacles' corners (a step outside them) plus named ones (homes, the campsite's door, the bridge's and the stairs' ends,
//   the shore, the pondside, the riverbank's casting spots, centre stage). Their visibility graph is built once
//   (only bitangent edges: an edge that would cut into its own corner's polygon is never on a shortest way); a walk
//   is a straight segment when it is clear, else A* over the graph plus the start and the goal.
//   Snapping: an unwalkable tap goes to its building's door (a footprint), the nearest bank facing the water (water),
//   or the nearest walkable point within 40u (anything else).
import type { Box } from './geom.ts';
import {
  BRIDGE, BRIDGE_RAIL, BUILDINGS, CENTRE_STAGE, CLIFF, FALLS_POOL, GOAL_TREES, HEDGE_XS, HEDGE_Z, HOMES, LAND, POND, RIVER, ROCK,
  DECOR_SLOTS, PULLUP_AT, RIVER_BEND, SCENERY, SEATS, SHORE_Z, TAPE_DECK, inOval, inRiver, onLand, SPRING, onBridge, layoutNav, onLayout, worldGen,
  type BuildingId, type Pt
} from './world.ts';
import { art } from '#lib/art.ts';
import * as onGrid from '#lib/layout/nav.ts';
import { BUILDING_OF, HOME_OF } from './layoutWorld.ts';

/** How far feet keep from an obstacle (u). */
export const PAD = 8;
/** How far a nudge to "the nearest walkable point" may go (u), and a bank from the tapped water. */
const SNAP_NEAR = 40;
const SNAP_BANK = 160;
/** Edges longer than this aren't tried (the land is open: a long walk chains nodes; measured on 300 random ways, at
 *  most 1% longer than with every edge, 0.02% on average, for 40% less build time). */
const EDGE_MAX = 320;
/** Corner nodes stand this far outside their polygon's corner. */
const CORNER_OUT = 2;
/** Feet keep this far inside the shoreline (the wet sand is outside it: standing at its edge is fine). */
const SHORE_IN = 1;

/** A convex obstacle polygon (padded), with its bounding box. */
interface Poly {
  pts: Pt[];
  x0: number; x1: number; z0: number; z1: number;
  /** What it is: water blocks taps differently (a bank), a building sends them to its door. */
  kind: 'water' | 'cliff' | 'building' | 'thing';
  building?: BuildingId;
}

interface NavNode {
  p: Pt;
  /** Named nodes keep their name (doors, homes …); corners are ''. */
  name: string;
  /** A corner's polygon neighbours (the bitangent test), or null for a named node. */
  prev: Pt | null;
  next: Pt | null;
  corner: Pt | null;
}

export interface Nav {
  polys: Poly[];
  nodes: NavNode[];
  /** Each node's visible neighbours and the distance to each. */
  adj: { k: number; d: number }[][];
  /** Each node's connected region, and the island's main one (home's): a pocket off it (a strip of sand walled in by
   *  the river and the cedars) is ground nobody can reach. */
  comp: Int32Array;
  main: number;
  /** The named nodes by name. */
  named: Record<string, Pt>;
  /** A uniform grid of polygon indices (the segment and point tests' broad phase). */
  grid: { cell: number; x0: number; z0: number; w: number; h: number; cells: number[][] };
  /** The build's duration (ms): the perf budget (≤ 5 ms at load). */
  buildMs: number;
}

// ---- geometry -------------------------------------------------------------------------------------------------------

const cross = (ax: number, az: number, bx: number, bz: number) => ax * bz - az * bx;
const orient = (a: Pt, b: Pt, c: Pt) => cross(b[0] - a[0], b[1] - a[1], c[0] - a[0], c[1] - a[1]);
const dist = (a: Pt, b: Pt) => Math.hypot(b[0] - a[0], b[1] - a[1]);

/** A polygon from its points (made counter-clockwise in x/z) and its kind. */
function poly(pts: Pt[], kind: Poly['kind'], building?: BuildingId): Poly {
  let area = 0;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length];
    area += cross(a[0], a[1], b[0], b[1]);
  }
  const p = area < 0 ? [...pts].reverse() : pts;
  const xs = p.map((q) => q[0]), zs = p.map((q) => q[1]);
  return { pts: p, x0: Math.min(...xs), x1: Math.max(...xs), z0: Math.min(...zs), z1: Math.max(...zs), kind, building };
}

/** A box grown by the pad, as a polygon. */
const rect = (b: Box, kind: Poly['kind'], pad = PAD, building?: BuildingId): Poly =>
  poly([[b.x0 - pad, b.y0 - pad], [b.x1 + pad, b.y0 - pad], [b.x1 + pad, b.y1 + pad], [b.x0 - pad, b.y1 + pad]], kind, building);

/** An ellipse grown by the pad, as an n-gon circumscribing it (so the polygon holds the whole padded oval). */
function oval(o: { x: number; z: number; rx: number; rz: number }, n: number): Poly {
  const k = 1 / Math.cos(Math.PI / n);
  return poly(Array.from({ length: n }, (_, i) => {
    const a = ((i + 0.5) / n) * Math.PI * 2;
    return [o.x + Math.cos(a) * (o.rx + PAD) * k, o.z + Math.sin(a) * (o.rz + PAD) * k] as Pt;
  }), 'water');
}

/** Strictly inside a convex (counter-clockwise) polygon. */
function insideConvex(q: Poly, x: number, z: number): boolean {
  if (x <= q.x0 || x >= q.x1 || z <= q.z0 || z >= q.z1) return false;
  const p = q.pts;
  for (let i = 0, n = p.length; i < n; i++) {
    const a = p[i], b = p[(i + 1) % n];
    if (cross(b[0] - a[0], b[1] - a[1], x - a[0], z - a[1]) <= 1e-9) return false;
  }
  return true;
}

/** Whether segment a–b enters a convex polygon's interior (touching its boundary doesn't). */
function cutsConvex(q: Poly, a: Pt, b: Pt): boolean {
  if (Math.max(a[0], b[0]) <= q.x0 || Math.min(a[0], b[0]) >= q.x1 || Math.max(a[1], b[1]) <= q.z0 || Math.min(a[1], b[1]) >= q.z1) return false;
  // clip the segment against each edge's half-plane (Cyrus–Beck): it enters iff a piece of positive length is left
  let t0 = 0, t1 = 1;
  const dx = b[0] - a[0], dz = b[1] - a[1], p = q.pts;
  for (let i = 0, n = p.length; i < n; i++) {
    const e = p[i], f = p[(i + 1) % n];
    const ex = f[0] - e[0], ez = f[1] - e[1];
    // inside: cross(edge, point − e) > 0
    const num = cross(ex, ez, a[0] - e[0], a[1] - e[1]);
    const den = cross(ex, ez, dx, dz);
    if (Math.abs(den) < 1e-12) {
      if (num <= 1e-9) return false; // parallel and outside (or on) this edge
      continue;
    }
    const t = -num / den;
    if (den > 0) t0 = Math.max(t0, t);
    else t1 = Math.min(t1, t);
    if (t1 - t0 <= 1e-9) return false;
  }
  return (t1 - t0) * Math.hypot(dx, dz) > 1e-6;
}

/** Signed distance from a point to the land's rounded rectangle (negative inside). */
function landDist(x: number, z: number): number {
  const cx = (LAND.x0 + LAND.x1) / 2, cz = (LAND.z0 + LAND.z1) / 2;
  const hx = (LAND.x1 - LAND.x0) / 2 - LAND.r, hz = (LAND.z1 - LAND.z0) / 2 - LAND.r;
  const qx = Math.abs(x - cx) - hx, qz = Math.abs(z - cz) - hz;
  return Math.hypot(Math.max(qx, 0), Math.max(qz, 0)) + Math.min(Math.max(qx, qz), 0) - LAND.r;
}
const onFoot = (x: number, z: number) => landDist(x, z) <= -SHORE_IN;

/** The nearest point a step inside the land (a tap far out at sea starts its search for a bank from there). */
function toLand(x: number, z: number): Pt {
  const cx = (LAND.x0 + LAND.x1) / 2, cz = (LAND.z0 + LAND.z1) / 2;
  const hx = (LAND.x1 - LAND.x0) / 2 - LAND.r, hz = (LAND.z1 - LAND.z0) / 2 - LAND.r;
  // the nearest point of the core rectangle, then out along the normal to the land's edge less the shore step
  const kx = cx + Math.max(-hx, Math.min(hx, x - cx)), kz = cz + Math.max(-hz, Math.min(hz, z - cz));
  const d = Math.hypot(x - kx, z - kz) || 1, r = LAND.r - SHORE_IN - 1;
  return [kx + ((x - kx) / d) * r, kz + ((z - kz) / d) * r];
}

// ---- the obstacles --------------------------------------------------------------------------------------------------

const box = (x: number, z: number, hw: number, back: number, front = back): Box => ({ x0: x - hw, x1: x + hw, y0: z - front, y1: z + back });
const widthOf = (key: string, h: number) => {
  const a = art(key);
  return a ? (h * a.w) / a.h : h;
};

/** A building's footprint on the ground (unpadded): its width × depth behind the door line. */
export function footprint(id: BuildingId): Box {
  const ln = layoutNav(), d = ln?.doors[HOME_OF[id]];
  if (d) return d.box;
  const b = BUILDINGS.find((q) => q.id === id)!;
  const w = widthOf(b.key, b.h);
  return { x0: b.x - w / 2 + 4, x1: b.x + w / 2 - 4, y0: b.z - 2, y1: b.z + b.depth };
}

/** Where a building's door is: a step in front of the door line. */
export function doorOf(id: BuildingId): Pt {
  const ln = layoutNav(), d = ln?.doors[HOME_OF[id]];
  if (d) return d.at;
  const b = BUILDINGS.find((q) => q.id === id)!;
  return [b.x, b.z - 16];
}

/** The stream as convex quads along its centreline, cut where the bridge's deck crosses it (inside its rails). */
function riverQuads(): Poly[] {
  const out: Poly[] = [];
  type Seg = { a: Pt; b: Pt; wa: number; wb: number };
  const lo = BRIDGE.x - BRIDGE.w / 2 + BRIDGE_RAIL, hi = BRIDGE.x + BRIDGE.w / 2 - BRIDGE_RAIL;
  const segs: Seg[] = [];
  for (let i = 0; i < RIVER.length - 1; i++) {
    const [ax, az, wa] = RIVER[i], [bx, bz, wb] = RIVER[i + 1];
    const s: Seg = { a: [ax, az], b: [bx, bz], wa, wb };
    const zMid = (az + bz) / 2;
    if (zMid < BRIDGE.z0 || zMid > BRIDGE.z1 || Math.min(ax, bx) >= hi || Math.max(ax, bx) <= lo) {
      segs.push(s);
      continue;
    }
    // keep the parts of the segment outside the deck's x-range [lo, hi]
    const t = (x: number) => (x - ax) / (bx - ax);
    const at = (x: number): Pt => [x, az + (bz - az) * t(x)];
    const wAt = (x: number) => wa + (wb - wa) * t(x);
    const [l, r, wl, wr] = ax < bx ? [s.a, s.b, wa, wb] : [s.b, s.a, wb, wa];
    if (l[0] < lo) segs.push({ a: l, b: at(lo), wa: wl, wb: wAt(lo) });
    if (r[0] > hi) segs.push({ a: at(hi), b: r, wa: wAt(hi), wb: wr });
  }
  // each piece a quad: offset ±(half-width + pad) square to it, overlapping its neighbours by a pad at the joints
  // (so a bend leaves no gap), but not into the deck at a cut
  const cut = (p: Pt) => Math.abs(p[0] - lo) < 0.01 || Math.abs(p[0] - hi) < 0.01;
  for (const s of segs) {
    const dx = s.b[0] - s.a[0], dz = s.b[1] - s.a[1], L = Math.hypot(dx, dz) || 1;
    const ux = dx / L, uz = dz / L, nx = -uz, nz = ux;
    const ea = cut(s.a) ? 0 : PAD, eb = cut(s.b) ? 0 : PAD;
    const ha = s.wa / 2 + PAD, hb = s.wb / 2 + PAD;
    const a: Pt = [s.a[0] - ux * ea, s.a[1] - uz * ea], b: Pt = [s.b[0] + ux * eb, s.b[1] + uz * eb];
    out.push(poly([
      [a[0] + nx * ha, a[1] + nz * ha], [b[0] + nx * hb, b[1] + nz * hb], [b[0] - nx * hb, b[1] - nz * hb], [a[0] - nx * ha, a[1] - nz * ha]
    ], 'water'));
  }
  return out;
}

/** Every obstacle, padded: water, the cliff, the buildings and the things standing on the ground (the decorations'
 *  boxes too). */
function obstacles(decor: readonly Box[]): Poly[] {
  const out: Poly[] = [...riverQuads(), oval(POND, 16), oval(SPRING, 12)];
  // the cliff face, from shore to shore but for the stairs (the waterfall is the river's)
  const [s0, s1] = CLIFF.stair;
  out.push(rect({ x0: LAND.x0 - 40, x1: s0, y0: CLIFF.z0, y1: CLIFF.z1 }, 'cliff'), rect({ x0: s1, x1: LAND.x1 + 40, y0: CLIFF.z0, y1: CLIFF.z1 }, 'cliff'));
  for (const b of BUILDINGS) out.push(rect(footprint(b.id), 'building', PAD, b.id));
  for (const t of [GOAL_TREES.A, GOAL_TREES.B]) out.push(rect(box(t[0], t[1], 13, 6, 6), 'thing'));
  for (const s of SCENERY) {
    if (s.foot) out.push(rect(box(s.x, s.z, s.foot[0] / 2, s.foot[1] / 2), 'thing'));
    else if (s.kind === 'oak' || s.kind === 'cedar') out.push(rect(box(s.x, s.z, 12, 6, 6), 'thing'));
    else if (s.kind === 'palm') out.push(rect(box(s.x, s.z, 8, 5, 5), 'thing'));
    else if (s.kind === 'bush') out.push(rect(box(s.x, s.z, 16, 7, 7), 'thing'));
    else if (s.kind === 'bamboo') out.push(rect(box(s.x, s.z, 7, 4, 4), 'thing'));
    else if (s.kind === 'rock') out.push(rect(box(s.x, s.z, 10, 5, 5), 'thing'));
    else out.push(rect(box(s.x, s.z, Math.max(5, widthOf(s.key, s.h) * 0.36), 4, 4), 'thing'));
  }
  for (const d of DECOR_SLOTS) out.push(rect(box(d.x, d.z, d.foot[0] / 2, d.foot[1] / 2), 'thing'));
  for (const x of HEDGE_XS) out.push(rect(box(x, HEDGE_Z, 18, 7, 7), 'thing'));
  out.push(rect(box(ROCK[0], ROCK[1], 12, 5, 5), 'thing'), rect(box(TAPE_DECK[0], TAPE_DECK[1], 7, 4, 4), 'thing'));
  for (const b of decor) out.push(rect(b, 'thing'));
  return out;
}

/** The named nodes (walkGraph.ts's names, so a node id over the relay means the same on either build). */
function namedNodes(): Record<string, Pt> {
  const [ax, az] = HOMES.A, [bx, bz] = HOMES.B, [tax, taz] = GOAL_TREES.A, [tbx, tbz] = GOAL_TREES.B;
  const nodes: Record<string, Pt> = {
    homeA: [ax, az], homeB: [bx, bz], centre: [195, az + 30],
    midA: [ax, az + 60], midB: [bx, bz + 60],
    treeA: [tax + 34, taz - 6], treeB: [tbx - 34, tbz - 6], outA: [tax - 30, taz - 30], outB: [tbx + 30, tbz - 30],
    backA: [tax + 30, taz + 60], backB: [tbx - 30, tbz + 60],
    rock: [ROCK[0] + 24, ROCK[1] - 4],
    shoreL: [96, SHORE_Z + 22], shoreC: [195, SHORE_Z + 20], shoreR: [270, SHORE_Z + 22],
    stairS: [(CLIFF.stair[0] + CLIFF.stair[1]) / 2, CLIFF.z0 - 14], stairN: [(CLIFF.stair[0] + CLIFF.stair[1]) / 2, CLIFF.z1 + 14],
    centreStage: [CENTRE_STAGE[0], CENTRE_STAGE[1]],
    pondside: [POND.x + 4, POND.z + POND.rz + 14],
    // the stream's casting spots: its west bank below the falls, the bend, the mouth (the west beach in front of it), the
    // falls' pool (NH's clifftop: the upper tier is beyond the horizon)
    ...(onLayout() ? riverSpots() : { riverEast: [340, 880] as Pt, riverBend: [330, 742] as Pt, mouth: [-12, 596] as Pt }),
    bridgeS: [BRIDGE.x, BRIDGE.z0 - 12], bridgeN: [BRIDGE.x, BRIDGE.z1 + 12], clifftop: [CLIFF.fall[0] - 14, CLIFF.z0 - FALLS_POOL + 18],
    // the benches' and the stools' seats, the pull-up bar (world.ts SEATS)
    ...SEATS, pullup: PULLUP_AT
  };
  for (const b of BUILDINGS) nodes[`door-${b.id}`] = doorOf(b.id);
  return nodes;
}

/** The stream's casting spots on the layout's river: beside its north–south reach's middle, by its bend, the bank
 *  at its mouth. */
function riverSpots(): Record<'riverEast' | 'riverBend' | 'mouth', Pt> {
  const ns = RIVER.filter((p) => p[1] > RIVER_BEND), across = RIVER.filter((p) => p[1] <= RIVER_BEND);
  const at = (p: readonly number[] | undefined, dx: number, dz: number): Pt => (p ? [p[0] + dx, p[1] + dz] : [-1e5, -1e5]);
  const m = ns[Math.floor(ns.length / 2)], bend = ns.at(-1), mouth = across.findLast((p) => p[2] <= 30) ?? across.at(-1);
  return { riverEast: at(m, -(m?.[2] ?? 30) / 2 - 14, 0), riverBend: at(bend, -(bend?.[2] ?? 30) / 2 - 14, 18), mouth: at(mouth, 0, -(mouth?.[2] ?? 30) / 2 - 14) };
}

/** namedNodes() on the layout's grid: each moved to the nearest point a walker reaches (dropped when none is near). */
function namedOnLayout(ln: onGrid.LayoutNav): Record<string, Pt> {
  const out: Record<string, Pt> = {};
  for (const [name, p] of Object.entries(namedNodes())) {
    const q = onGrid.nearestWalkable(ln, p[0], p[1], 30, undefined, true);
    if (q) out[name] = q;
  }
  return out;
}

// ---- the broad phase ------------------------------------------------------------------------------------------------

const CELL = 80;
function gridOf(polys: Poly[]): Nav['grid'] {
  const x0 = LAND.x0 - 240, z0 = LAND.z0 - 440, w = Math.ceil((LAND.x1 + 240 - x0) / CELL), h = Math.ceil((LAND.z1 + 440 - z0) / CELL);
  const cells: number[][] = Array.from({ length: w * h }, () => []);
  polys.forEach((q, i) => {
    const i0 = Math.max(0, Math.floor((q.x0 - x0) / CELL)), i1 = Math.min(w - 1, Math.floor((q.x1 - x0) / CELL));
    const j0 = Math.max(0, Math.floor((q.z0 - z0) / CELL)), j1 = Math.min(h - 1, Math.floor((q.z1 - z0) / CELL));
    for (let j = j0; j <= j1; j++) for (let k = i0; k <= i1; k++) cells[j * w + k].push(i);
  });
  return { cell: CELL, x0, z0, w, h, cells };
}

let stamp = 1;
let seen = new Uint32Array(0);
/** Each polygon whose cells the box x0…x1, z0…z1 touches, once. */
function forEachNear(nav: Nav, x0: number, x1: number, z0: number, z1: number, fn: (q: Poly) => boolean): boolean {
  const g = nav.grid;
  if (seen.length < nav.polys.length) seen = new Uint32Array(nav.polys.length);
  const s = ++stamp;
  const i0 = Math.max(0, Math.floor((x0 - g.x0) / g.cell)), i1 = Math.min(g.w - 1, Math.floor((x1 - g.x0) / g.cell));
  const j0 = Math.max(0, Math.floor((z0 - g.z0) / g.cell)), j1 = Math.min(g.h - 1, Math.floor((z1 - g.z0) / g.cell));
  for (let j = j0; j <= j1; j++)
    for (let k = i0; k <= i1; k++)
      for (const i of g.cells[j * g.w + k]) {
        if (seen[i] === s) continue;
        seen[i] = s;
        if (fn(nav.polys[i])) return true;
      }
  return false;
}

/** The obstacle a point is in (padded), or null. */
function obstacleAt(nav: Nav, x: number, z: number): Poly | null {
  let hit: Poly | null = null;
  forEachNear(nav, x, x, z, z, (q) => (insideConvex(q, x, z) ? ((hit = q), true) : false));
  return hit;
}

// ---- the public tests -----------------------------------------------------------------------------------------------

/** Things that come and go (a visitor on centre stage): boxes, padded like the rest. */
export type Extra = readonly Box[];
const inExtra = (extra: Extra | undefined, x: number, z: number) =>
  !!extra?.some((b) => x > b.x0 - PAD && x < b.x1 + PAD && z > b.y0 - PAD && z < b.y1 + PAD);
const extraPolys = (extra: Extra | undefined): Poly[] => (extra ?? []).map((b) => rect(b, 'thing'));

/** Whether feet may stand at (x, z): on land, off every obstacle (grown by the pad) and off the extras. */
export function walkable(nav: Nav, x: number, z: number, extra?: Extra): boolean {
  return onFoot(x, z) && !obstacleAt(nav, x, z) && !inExtra(extra, x, z);
}

/** Whether a straight walk from a to b is clear (both ends on land: the land is convex, so the walk stays on it).
 *  `escape`: obstacles holding `a` are ignored (a walker caught a little inside a pad walks out of it). */
export function clear(nav: Nav, a: Pt, b: Pt, extra?: Extra, escape = false): boolean {
  if (!onFoot(b[0], b[1]) || (!escape && !onFoot(a[0], a[1]))) return false;
  const hold = escape ? (q: Poly) => insideConvex(q, a[0], a[1]) : () => false;
  const blocked = forEachNear(nav, Math.min(a[0], b[0]), Math.max(a[0], b[0]), Math.min(a[1], b[1]), Math.max(a[1], b[1]), (q) => !hold(q) && cutsConvex(q, a, b));
  if (blocked) return false;
  if (!extra?.length) return true;
  return !extraPolys(extra).some((q) => !hold(q) && cutsConvex(q, a, b));
}

// ---- building the graph ---------------------------------------------------------------------------------------------

/** A corner may see q along a shortest way only if its polygon stays on one side of the line (a bitangent). */
function tangent(n: NavNode, q: Pt): boolean {
  if (!n.corner) return true;
  const c = n.corner, s1 = orient(c, q, n.prev!), s2 = orient(c, q, n.next!);
  return (s1 >= -1e-9 && s2 >= -1e-9) || (s1 <= 1e-9 && s2 <= 1e-9);
}

const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());

/** The island's decorations (store/decor.svelte.ts: their boxes, unpadded). */
let decorBoxes: readonly Box[] = [];
/** The decorations stand on the island: the next walk builds the graph again with them (~3 ms). */
export function setNavDecor(boxes: readonly Box[]): void {
  decorBoxes = boxes;
  cached = null;
}

/** The island's navigation, built once (cached; `fresh` rebuilds: the perf test; again when the decorations change). */
let cached: Nav | null = null;
let onIt: { gen: number; nav: onGrid.LayoutNav } | null = null;
export function nav(fresh = false): Nav {
  if (cached && !fresh) return cached;
  cached = navWith(decorBoxes);
  return cached;
}

/** The walk's navigation now: the layout's walk grid while the island reads it (with the island's named spots: a node
 *  over the relay means the same on both phones), else nav()'s. Either is planTap's. */
export function walkNav(): Nav | onGrid.LayoutNav {
  const ln = layoutNav();
  if (!ln) return nav();
  if (onIt?.gen !== worldGen()) onIt = { gen: worldGen(), nav: { ...ln, named: { ...namedOnLayout(ln), ...ln.named } } };
  return onIt.nav;
}

/** The navigation with these decorations (uncached: whether a spot would wall anyone in, island/decor.ts). */
export function navWith(decor: readonly Box[]): Nav {
  const t0 = now();
  const polys = obstacles(decor);
  const shell: Nav = { polys, nodes: [], adj: [], comp: new Int32Array(0), main: 0, named: {}, grid: gridOf(polys), buildMs: 0 };
  const nodes: NavNode[] = [];
  // a named spot a little inside a pad (a casting spot right at the water) moves to the nearest walkable point
  for (const [name, at] of Object.entries(namedNodes())) {
    const p = nearestWalkable(shell, at[0], at[1], 12);
    if (!p) continue;
    shell.named[name] = p;
    nodes.push({ p, name, prev: null, next: null, corner: null });
  }
  for (const q of polys) {
    const p = q.pts, n = p.length;
    for (let i = 0; i < n; i++) {
      const prev = p[(i + n - 1) % n], c = p[i], next = p[(i + 1) % n];
      // out along the corner's bisector (the edges' outward normals summed; counter-clockwise: outward = (dz, −dx))
      const e1x = c[0] - prev[0], e1z = c[1] - prev[1], e2x = next[0] - c[0], e2z = next[1] - c[1];
      const l1 = Math.hypot(e1x, e1z) || 1, l2 = Math.hypot(e2x, e2z) || 1;
      let ox = e1z / l1 + e2z / l2, oz = -e1x / l1 - e2x / l2;
      const lo = Math.hypot(ox, oz) || 1;
      ox /= lo;
      oz /= lo;
      const at: Pt = [c[0] + ox * CORNER_OUT, c[1] + oz * CORNER_OUT];
      if (walkable(shell, at[0], at[1])) nodes.push({ p: at, name: '', prev, next, corner: c });
    }
  }
  const adj: { k: number; d: number }[][] = nodes.map(() => []);
  for (let i = 0; i < nodes.length; i++)
    for (let k = i + 1; k < nodes.length; k++) {
      const a = nodes[i], b = nodes[k], d = dist(a.p, b.p);
      if (d > EDGE_MAX || !tangent(a, b.p) || !tangent(b, a.p) || !clear(shell, a.p, b.p)) continue;
      adj[i].push({ k, d });
      adj[k].push({ k: i, d });
    }
  // the connected regions (a flood over the graph), the main one home's
  const comp = new Int32Array(nodes.length).fill(-1);
  let c = 0;
  for (let i = 0; i < nodes.length; i++) {
    if (comp[i] >= 0) continue;
    const stack = [i];
    comp[i] = c;
    while (stack.length) for (const e of adj[stack.pop()!]) if (comp[e.k] < 0) (comp[e.k] = c), stack.push(e.k);
    c++;
  }
  const home = nodes.findIndex((n) => n.name === 'homeA');
  Object.assign(shell, { nodes, adj, comp, main: home >= 0 ? comp[home] : 0 });
  shell.buildMs = now() - t0;
  return shell;
}

// ---- A* ---------------------------------------------------------------------------------------------------------------

/** A small binary heap of [f, index]. */
class Heap {
  private f: number[] = [];
  private v: number[] = [];
  get size() { return this.v.length; }
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

/** The way from `from` to `to` (both should be walkable; `from` may be caught a little inside a pad): the waypoints
 *  after `from`, ending at `to`; null when there is none. A straight segment when it is clear. `extra`: boxes that
 *  come and go (a visitor), routed around through their padded corners. */
export function findPath(g: Nav, from: Pt, to: Pt, extra?: Extra): Pt[] | null {
  if (!walkable(g, to[0], to[1], extra)) return null;
  const escape = !walkable(g, from[0], from[1], extra);
  if (clear(g, from, to, extra, escape)) return [to];
  const N = g.nodes.length;
  // the extras' corners join as temporary nodes; static edges near an extra are re-tested
  const tmp: NavNode[] = [];
  for (const q of extraPolys(extra))
    for (const c of q.pts) {
      const at: Pt = [c[0] + Math.sign(c[0] - (q.x0 + q.x1) / 2) * CORNER_OUT, c[1] + Math.sign(c[1] - (q.z0 + q.z1) / 2) * CORNER_OUT];
      if (walkable(g, at[0], at[1], extra)) tmp.push({ p: at, name: '', prev: null, next: null, corner: null });
    }
  const S = N + tmp.length, T = S + 1, total = T + 1;
  const pt = (i: number): Pt => (i < N ? g.nodes[i].p : i < S ? tmp[i - N].p : i === S ? from : to);
  const nodeOf = (i: number): NavNode | null => (i < N ? g.nodes[i] : null);
  const ex = extraPolys(extra);
  const exClear = (a: Pt, b: Pt) => !ex.length || !ex.some((q) => cutsConvex(q, a, b));
  const bad = (i: number) => i < N && inExtra(extra, g.nodes[i].p[0], g.nodes[i].p[1]);
  /** The neighbours of i: static edges (re-tested against extras), plus the temporary nodes and the goal. */
  const near = (i: number, fn: (k: number, d: number) => void) => {
    const p = pt(i);
    const tryK = (k: number) => {
      const q = pt(k), d = dist(p, q);
      if (k === i || d > EDGE_MAX * 1.5) return;
      const nk = nodeOf(k), ni = nodeOf(i);
      if ((nk && !tangent(nk, p)) || (ni && !tangent(ni, q))) return;
      if (clear(g, p, q, extra, i === S && escape)) fn(k, d);
    };
    if (i < N) {
      for (const e of g.adj[i]) if (!bad(e.k) && exClear(p, pt(e.k))) fn(e.k, e.d);
      for (let k = N; k < S; k++) tryK(k);
      tryK(T);
    } else for (let k = 0; k < total; k++) if (k !== S && !bad(k)) tryK(k);
  };
  const gs = new Float64Array(total).fill(Infinity), prev = new Int32Array(total).fill(-1), done = new Uint8Array(total);
  const h = (i: number) => dist(pt(i), to);
  const open = new Heap();
  gs[S] = 0;
  open.push(h(S), S);
  while (open.size) {
    const i = open.pop();
    if (done[i]) continue;
    if (i === T) break;
    done[i] = 1;
    near(i, (k, d) => {
      const gk = gs[i] + d;
      if (gk < gs[k] - 1e-9) {
        gs[k] = gk;
        prev[k] = i;
        open.push(gk + h(k), k);
      }
    });
  }
  if (gs[T] === Infinity) return null;
  const out: Pt[] = [];
  for (let k = T; k !== S; k = prev[k]) out.unshift(pt(k));
  return out;
}

/** A route's length from `from`. */
export function pathLength(from: Pt, pts: readonly Pt[]): number {
  let len = 0, at = from;
  for (const p of pts) {
    len += dist(at, p);
    at = p;
  }
  return len;
}

// ---- snapping a tap ---------------------------------------------------------------------------------------------------

export type WaterKind = 'sea' | 'river' | 'pond' | 'spring';
export interface Snap {
  /** Where to walk. */
  to: Pt;
  /** here: the tap itself; door: a building's door; bank: the nearest bank of tapped water; near: nudged off a thing. */
  kind: 'here' | 'door' | 'bank' | 'near';
  /** Face the tapped point when arriving (the water from its bank). */
  face?: 'l' | 'r';
  building?: BuildingId;
  water?: WaterKind;
}

/** The water at a point (unpadded), or null. */
export function waterAt(x: number, z: number): WaterKind | null {
  const ln = layoutNav();
  if (ln) {
    const w = onGrid.waterAt(ln, x, z);
    return w === 'pond' && inOval(SPRING, x, z, 15) ? 'spring' : w;
  }
  if (onBridge(x, z)) return null;
  if (!onLand(x, z)) return 'sea';
  if (inOval(POND, x, z)) return 'pond';
  if (inOval(SPRING, x, z)) return 'spring';
  if (inRiver(x, z)) return 'river';
  return null;
}

/** The building whose footprint (unpadded, a few units grace) holds a point, or null. */
export function buildingAt(x: number, z: number): BuildingId | null {
  const ln = layoutNav();
  if (ln) {
    const id = onGrid.buildingAt(ln, x, z);
    return id ? (BUILDING_OF[id] ?? null) : null;
  }
  for (const b of BUILDINGS) {
    const f = footprint(b.id);
    if (x >= f.x0 - 2 && x <= f.x1 + 2 && z >= f.y0 - 2 && z <= f.y1 + 2) return b.id;
  }
  return null;
}

/** How far a point looks for a node to tell its region by (u). */
const REGION_R = 200;
/** Whether walkable ground at (x, z) is in the island's main region (it sees a node of it, nearest first), not a pocket
 *  nobody can walk to. */
export function reachable(g: Nav, x: number, z: number, extra?: Extra): boolean {
  if (!walkable(g, x, z, extra)) return false;
  const p: Pt = [x, z], near: [number, number][] = [];
  for (let i = 0; i < g.nodes.length; i++) {
    const d = dist(p, g.nodes[i].p);
    if (d <= REGION_R) near.push([d, i]);
  }
  near.sort((a, b) => a[0] - b[0]);
  for (const [, i] of near) if (clear(g, p, g.nodes[i].p)) return g.comp[i] === g.main;
  return false;
}

/** The nearest walkable point to (x, z) within `max` u (rings 2u apart, finer as they grow, nearest first); `main`:
 *  in the island's main region only. */
export function nearestWalkable(g: Nav, x: number, z: number, max = SNAP_NEAR, extra?: Extra, main = false): Pt | null {
  const ok = main ? (px: number, pz: number) => reachable(g, px, pz, extra) : (px: number, pz: number) => walkable(g, px, pz, extra);
  if (ok(x, z)) return [x, z];
  for (let r = 2; r <= max; r += 2) {
    const n = Math.max(12, Math.ceil((r * Math.PI * 2) / 3));
    let best: Pt | null = null;
    for (let a = 0; a < n; a++) {
      const px = x + Math.cos((a / n) * Math.PI * 2) * r, pz = z + Math.sin((a / n) * Math.PI * 2) * r;
      // the first on the ring wins (all are at r); the ring after holds nothing nearer
      if (ok(px, pz)) {
        best = [Math.round(px * 10) / 10, Math.round(pz * 10) / 10];
        break;
      }
    }
    if (best) return best;
  }
  return null;
}

/** Where a tap at (x, z) sends my villager (spec §4): the point itself on walkable ground; a building's footprint → its
 *  door; water → the nearest bank, facing the water; anything else → the nearest walkable point within 40u. Null when
 *  nothing is near (the tap is ignored). */
export function snapTap(g: Nav, x: number, z: number, extra?: Extra): Snap | null {
  const face = (to: Pt) => (Math.abs(x - to[0]) >= 3 ? (x < to[0] ? 'l' : 'r') : undefined);
  if (walkable(g, x, z, extra)) {
    if (reachable(g, x, z, extra)) return { to: [x, z], kind: 'here' };
    // a pocket nobody can walk to (behind the river): as close as the main ground comes, facing it
    const to = nearestWalkable(g, x, z, SNAP_BANK, extra, true);
    return to && { to, kind: 'near', face: face(to) };
  }
  const building = buildingAt(x, z);
  if (building) return { to: doorOf(building), kind: 'door', building };
  const water = waterAt(x, z);
  if (water) {
    const [sx, sz] = water === 'sea' && !onFoot(x, z) ? toLand(x, z) : [x, z];
    const to = nearestWalkable(g, sx, sz, SNAP_BANK, extra, true);
    return to && { to, kind: 'bank', water, face: face(to) };
  }
  const to = nearestWalkable(g, x, z, SNAP_NEAR, extra, true);
  return to && { to, kind: 'near' };
}
