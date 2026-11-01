// Where the villagers may walk (docs/design.md "World", "Walking"): the island's walkable ground in world units (x
// across, z into the island), the obstacles on it and a graph of named nodes to route around them. Pure, built from
// world.ts, so a layout change carries over; parameterised (`walkGeo(extra)`) for what comes and goes (a visitor) and
// for the tests.
// Ground: land (sand and grass), the bridge's deck and the cliff's stairs; not the sea, the stream (but for the bridge), the pond, the spring, the cliff face
// (but for the stairs), the campsite's footprint, trunks, the rock, bushes and props. The static part is rasterised once (a 4u grid, ~5 ms) so a segment test is a few lookups; a
// visitor's box is tested on top. Routing: a straight segment when it is clear, else the shortest way through the
// nodes (named ones and the padded corners of the obstacles): a visibility graph precomputed once, Dijkstra per walk.
import type { Box } from './geom.ts';
import {
  BRIDGE, BRIDGE_RAIL, BUILDINGS, CENTRE_STAGE, CLIFF, FALLS_POOL, GOAL_TREES, HEDGE_XS, HEDGE_Z, HOMES, LAND, POND, ROCK,
  DECOR_SLOTS, SCENERY, SHORE_Z, SPRING, TAPE_DECK, inOval, inRiver, onBridge, onLand, type Pt
} from './world.ts';
import { art } from '#lib/art.ts';

export type { Pt };

export interface WalkGeo {
  /** Ground nobody walks through (grown by `pad` when tested): the island's are in the grid too. */
  obstacles: Box[];
  /** What came and goes (a visitor's box): tested on top of the grid. */
  extra?: Box[];
  /** Named waypoints (and the points of interest the villagers wander to). */
  nodes: Record<string, Pt>;
  /** Half the walker's footprint: how far feet keep from an obstacle. */
  pad: number;
  /** The island's static walk mask (shared by every island geo). */
  grid?: Grid;
  /** Or plain walkable boxes (a parameterised geometry: the tests). */
  zones?: Box[];
  /** The static nodes' visibility graph (lazily built; shared by the island's geos). */
  vis?: Vis;
}

/** What stands on the ground besides the fixed scenery. */
export interface WalkExtra {
  /** More obstacles (a visitor's spot). */
  obstacles?: Box[];
  /** More named nodes: they join the graph and the wander points. */
  nodes?: Record<string, Pt>;
}

const PAD = 8;
const CELL = 4;
const GX0 = LAND.x0 - 20, GX1 = LAND.x1 + 22, GZ0 = LAND.z0 - 30, GZ1 = LAND.z1 + 20;

interface Grid { w: number; h: number; ok: Uint8Array }
interface Vis { pts: Pt[]; names: string[]; adj: number[][] | null }

const box = (x: number, z: number, hw: number, back: number, front = back): Box => ({ x0: x - hw, x1: x + hw, y0: z - front, y1: z + back });
const widthOf = (key: string, h: number) => {
  const a = art(key);
  return a ? (h * a.w) / a.h : h;
};

/** The fixed obstacles (feet keep PAD from them). */
function staticObstacles(): Box[] {
  const out: Box[] = [];
  for (const t of [GOAL_TREES.A, GOAL_TREES.B]) out.push(box(t[0], t[1], 13, 6, 6));
  for (const s of SCENERY) {
    if (s.foot) out.push(box(s.x, s.z, s.foot[0] / 2, s.foot[1] / 2));
    else if (s.kind === 'oak' || s.kind === 'cedar') out.push(box(s.x, s.z, 12, 6, 6));
    else if (s.kind === 'palm') out.push(box(s.x, s.z, 8, 5, 5));
    else if (s.kind === 'bamboo') out.push(box(s.x, s.z, 7, 4, 4));
    else if (s.kind === 'rock') out.push(box(s.x, s.z, 10, 5, 5));
    else if (s.kind === 'bush') out.push(box(s.x, s.z, 16, 7, 7));
    else out.push(box(s.x, s.z, Math.max(5, widthOf(s.key, s.h) * 0.36), 4, 4));
  }
  // the decor's spots, filled or not (a seasonal piece comes and goes in its own)
  for (const d of DECOR_SLOTS) out.push(box(d.x, d.z, d.foot[0] / 2, d.foot[1] / 2));
  for (const x of HEDGE_XS) out.push(box(x, HEDGE_Z, 18, 7, 7));
  out.push(box(ROCK[0], ROCK[1], 12, 5, 5), box(TAPE_DECK[0], TAPE_DECK[1], 7, 4, 4));
  for (const b of BUILDINGS) {
    const w = widthOf(b.key, b.h);
    out.push({ x0: b.x - w / 2 + 4, x1: b.x + w / 2 - 4, y0: b.z - 2, y1: b.z + b.depth });
  }
  return out;
}

const inBox = (b: Box, x: number, z: number, pad = 0) => x > b.x0 - pad && x < b.x1 + pad && z > b.y0 - pad && z < b.y1 + pad;
const onStairs = (x: number, z: number) => x >= CLIFF.stair[0] + 4 && x <= CLIFF.stair[1] - 4 && z >= CLIFF.z0 - 6 && z <= CLIFF.z1 + 6;

/** The ground itself, before obstacles: land, off the water and the cliff face. */
function ground(x: number, z: number): boolean {
  if (onStairs(x, z) || onBridge(x, z, BRIDGE_RAIL + 1)) return true;
  if (!onLand(x, z)) return false;
  if (z >= CLIFF.z0 - 6 && z <= CLIFF.z1 + 4 && x >= CLIFF.x0 - 20 && x <= CLIFF.x1 + 20) return false;
  if (inOval(POND, x, z, 4) || inOval(SPRING, x, z, 4)) return false;
  // the river and a strip of its bank (the feet keep out of the water)
  return !inRiver(x, z) && !nearRiver(x, z);
}
function nearRiver(x: number, z: number): boolean {
  // a cheap pad: the river grown by PAD / 2 (the bank is walkable up to the water's edge less a step)
  return inRiver(x + 4, z) || inRiver(x - 4, z) || inRiver(x, z + 4) || inRiver(x, z - 4);
}

let shared: { grid: Grid; obstacles: Box[]; statics: number; vis: Vis } | null = null;
/** Whether the grid cell (i, j) is walkable: on the ground and off every obstacle (the stairs and the bridge cut
 *  through whatever they cross). */
function cellOk(i: number, j: number, obstacles: readonly Box[]): boolean {
  const x = GX0 + (i + 0.5) * CELL, z = GZ0 + (j + 0.5) * CELL;
  if (!ground(x, z)) return false;
  return onStairs(x, z) || onBridge(x, z, BRIDGE_RAIL + 1) || !obstacles.some((o) => inBox(o, x, z, PAD));
}
function build() {
  if (shared) return shared;
  const obstacles = staticObstacles();
  const w = Math.ceil((GX1 - GX0) / CELL), h = Math.ceil((GZ1 - GZ0) / CELL);
  const ok = new Uint8Array(w * h);
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if (cellOk(i, j, obstacles)) ok[j * w + i] = 1;
  shared = { grid: { w, h, ok }, obstacles, statics: obstacles.length, vis: { pts: [], names: [], adj: null } };
  return shared;
}

/** The fixed obstacles' boxes (unpadded): what a decoration may not stand on (island/decor.ts). */
export const fixedObstacles = (): readonly Box[] => build().obstacles.slice(0, build().statics);

/** The island's decorations as obstacles (store/decor.svelte.ts, their boxes): they join the obstacles in place (every
 *  island geo shares the array), only the grid cells under the old and the new boxes are tested again, and the
 *  corner graph is rebuilt on the next walk that needs it. */
export function setWalkDecor(boxes: readonly Box[]): void {
  const s = build(), g = s.grid;
  const was = s.obstacles.slice(s.statics);
  if (was.length === boxes.length && was.every((b, k) => b.x0 === boxes[k].x0 && b.x1 === boxes[k].x1 && b.y0 === boxes[k].y0 && b.y1 === boxes[k].y1)) return;
  s.obstacles.length = s.statics;
  s.obstacles.push(...boxes);
  for (const b of [...was, ...boxes]) {
    const i0 = Math.max(0, Math.floor((b.x0 - PAD - GX0) / CELL)), i1 = Math.min(g.w - 1, Math.floor((b.x1 + PAD - GX0) / CELL));
    const j0 = Math.max(0, Math.floor((b.y0 - PAD - GZ0) / CELL)), j1 = Math.min(g.h - 1, Math.floor((b.y1 + PAD - GZ0) / CELL));
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) g.ok[j * g.w + i] = cellOk(i, j, s.obstacles) ? 1 : 0;
  }
  Object.assign(s.vis, { pts: [], names: [], adj: null });
}

/** The named nodes: homes, the goal trees, the rock, the shore, the stairs' ends, the campsite's door, the pondside,
 *  the stream's casting spots, centre stage. */
function namedNodes(): Record<string, Pt> {
  const [ax, az] = HOMES.A, [bx, bz] = HOMES.B, [tax, taz] = GOAL_TREES.A, [tbx, tbz] = GOAL_TREES.B;
  const nodes: Record<string, Pt> = {
    homeA: [ax, az], homeB: [bx, bz], centre: [195, az + 30],
    midA: [ax, az + 60], midB: [bx, bz + 60],
    treeA: [tax + 34, taz - 6], treeB: [tbx - 34, tbz - 6], outA: [tax - 30, taz - 30], outB: [tbx + 30, tbz - 30],
    backA: [tax + 30, taz + 60], backB: [tbx - 30, tbz + 60],
    rock: [ROCK[0] + 24, ROCK[1] - 4],
    shoreL: [96, SHORE_Z + 22], shoreC: [195, SHORE_Z + 20], shoreR: [270, SHORE_Z + 22],
    stairS: [60, CLIFF.z0 - 14], stairN: [60, CLIFF.z1 + 14],
    centreStage: [CENTRE_STAGE[0], CENTRE_STAGE[1]],
    pondside: [POND.x + 4, POND.z + POND.rz + 14],
    riverEast: [340, 880], riverBend: [330, 742], mouth: [-12, 596],
    bridgeS: [BRIDGE.x, BRIDGE.z0 - 12], bridgeN: [BRIDGE.x, BRIDGE.z1 + 12], clifftop: [CLIFF.fall[0] - 14, CLIFF.z0 - FALLS_POOL + 18]
  };
  for (const b of BUILDINGS) nodes[`door-${b.id}`] = [b.x, b.z - 16];
  return nodes;
}

/** The island's walk geometry from the world's constants. */
export function walkGeo(extra: WalkExtra = {}): WalkGeo {
  const s = build();
  const nodes = { ...namedNodes(), ...(extra.nodes ?? {}) };
  return { obstacles: s.obstacles, extra: extra.obstacles ?? [], nodes, pad: PAD, grid: s.grid, vis: s.vis };
}

function gridOk(g: Grid, x: number, z: number): boolean {
  const i = Math.floor((x - GX0) / CELL), j = Math.floor((z - GZ0) / CELL);
  return i >= 0 && j >= 0 && i < g.w && j < g.h && g.ok[j * g.w + i] === 1;
}

/** On walkable ground and clear of every obstacle (grown by the footprint). */
export function walkable(g: WalkGeo, x: number, z: number): boolean {
  if (g.extra?.some((o) => inBox(o, x, z, g.pad))) return false;
  if (g.grid) return gridOk(g.grid, x, z);
  return !!g.zones?.some((b) => inBox(b, x, z)) && !g.obstacles.some((o) => inBox(o, x, z, g.pad));
}

/** A straight walk from a to b stays walkable (sampled every 3u). `loose`: the first stretch near `a` may be off the
 *  mask (a walker caught mid-step a little outside it). */
export function segmentClear(g: WalkGeo, a: Pt, b: Pt, loose = 0): boolean {
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const n = Math.max(1, Math.ceil(len / 3));
  for (let i = 0; i <= n; i++) {
    if (i * (len / n) < loose) continue;
    if (!walkable(g, a[0] + ((b[0] - a[0]) * i) / n, a[1] + ((b[1] - a[1]) * i) / n)) return false;
  }
  return true;
}

const dist = (a: Pt, b: Pt) => Math.hypot(b[0] - a[0], b[1] - a[1]);
/** Edges longer than this aren't tried (the graph stays sparse; a long walk goes node to node). */
const EDGE_MAX = 720;

/** The static nodes (named + the obstacles' padded corners) and their visibility, built once. */
function visGraph(g: WalkGeo): Vis {
  const v = (g.vis ??= { pts: [], names: [], adj: null });
  if (v.adj) return v;
  const statics = { ...g, extra: [] };
  const named = g.grid ? namedNodes() : g.nodes;
  const pts: Pt[] = [], names: string[] = [];
  for (const [k, p] of Object.entries(named)) if (walkable(statics, p[0], p[1])) (pts.push(p), names.push(k));
  const c = g.pad + 3;
  for (const o of g.obstacles)
    for (const p of [[o.x0 - c, o.y0 - c], [o.x1 + c, o.y0 - c], [o.x0 - c, o.y1 + c], [o.x1 + c, o.y1 + c]] as Pt[])
      if (walkable(statics, p[0], p[1])) (pts.push(p), names.push(''));
  const adj: number[][] = pts.map(() => []);
  for (let i = 0; i < pts.length; i++)
    for (let k = i + 1; k < pts.length; k++)
      if (dist(pts[i], pts[k]) <= EDGE_MAX && segmentClear(statics, pts[i], pts[k])) (adj[i].push(k), adj[k].push(i));
  Object.assign(v, { pts, names, adj });
  return v;
}

/** The way from `from` to `to`: the waypoints after `from` (ending at `to`), or null when there's none. */
export function route(g: WalkGeo, from: Pt, to: Pt): Pt[] | null {
  if (!walkable(g, to[0], to[1])) return null;
  const loose = walkable(g, from[0], from[1]) ? 0 : 12;
  if (segmentClear(g, from, to, loose)) return [to];
  const v = visGraph(g);
  // the static graph plus the extra nodes, `from` and `to`; edges to a visitor's box re-tested on the fly
  const extraNodes = Object.entries(g.nodes).filter(([k]) => !v.names.includes(k)).map(([, p]) => p).filter((p) => walkable(g, p[0], p[1]));
  const pts: Pt[] = [from, ...v.pts, ...extraNodes, to];
  const n = pts.length, base = 1, nStatic = v.pts.length, best = new Array<number>(n).fill(Infinity), prev = new Array<number>(n).fill(-1), done = new Array<boolean>(n).fill(false);
  const blocked = (i: number) => i >= base && i < base + nStatic && !walkable(g, pts[i][0], pts[i][1]);
  const clearEdge = (i: number, k: number) => (g.extra?.length ? segmentClear(g, pts[i], pts[k], i === 0 ? loose : 0) : true);
  const neighbours = (i: number): number[] => {
    if (i >= base && i < base + nStatic) {
      const out = v.adj![i - base].map((k) => k + base).filter((k) => clearEdge(i, k));
      for (let k = base + nStatic; k < n; k++) if (dist(pts[i], pts[k]) <= EDGE_MAX && segmentClear(g, pts[i], pts[k])) out.push(k);
      return out;
    }
    const out: number[] = [];
    for (let k = 1; k < n; k++) if (k !== i && dist(pts[i], pts[k]) <= EDGE_MAX && segmentClear(g, pts[i], pts[k], i === 0 ? loose : 0)) out.push(k);
    return out;
  };
  best[0] = 0;
  for (;;) {
    let i = -1;
    for (let k = 0; k < n; k++) if (!done[k] && best[k] < Infinity && (i < 0 || best[k] < best[i])) i = k;
    if (i < 0 || i === n - 1) break;
    done[i] = true;
    if (blocked(i)) continue;
    for (const k of neighbours(i)) {
      if (done[k] || blocked(k)) continue;
      const d = best[i] + dist(pts[i], pts[k]);
      if (d < best[k]) {
        best[k] = d;
        prev[k] = i;
      }
    }
  }
  if (best[n - 1] === Infinity) return null;
  const out: Pt[] = [];
  for (let k = n - 1; k > 0; k = prev[k]) out.unshift(pts[k]);
  return out;
}

/** A route's length from `from`. */
export function routeLength(from: Pt, pts: readonly Pt[]): number {
  let len = 0, at = from;
  for (const p of pts) {
    len += dist(at, p);
    at = p;
  }
  return len;
}

/** Walk speeds (u/s): brisk (a goal met walks to its tree, the meet-up), running where a tap sends it (spec §4), and
 *  strolling (idle outings, visitors). */
export const SPEED = { action: 240, run: 200, wander: 90 } as const;
/** A wander's duration (ms) at SPEED.wander. */
export const wanderMs = (len: number): number => (len / SPEED.wander) * 1000;

/** How far from a target its action spots are (u): close, then a little further out. */
export const REACH = [26, 40] as const;

/** Where to stand to act on a target at (tx, tz): around it at a short reach, best first: beside it on the side the
 *  walker comes from, the other side, in front (nearer the camera), behind, then a little further out (further still:
 *  level with it only). Each is walkable; the caller checks it against what's on screen and that a route exists. */
export function actionSpots(g: WalkGeo, tx: number, tz: number, from: Pt, reach: readonly number[] = REACH): Pt[] {
  const side = from[0] <= tx ? -1 : 1;
  const out: Pt[] = [];
  const around = [[side, -0.15], [-side, -0.15], [0, -0.8], [side * 0.7, -0.7], [-side * 0.7, -0.7], [0, 0.9], [side * 0.7, 0.7], [-side * 0.7, 0.7]] as const;
  for (const r of reach)
    for (const [dx, dz] of r > REACH[1] ? around.slice(0, 2) : around) {
      const x = tx + dx * r, z = tz + dz * r;
      if (walkable(g, x, z)) out.push([Math.round(x), Math.round(z)]);
    }
  return out;
}

/** The facing for a walk from a to b: by the horizontal direction (null when it's nearly straight up or down). */
export function facingFor(a: Pt, b: Pt): 'l' | 'r' | null {
  const dx = b[0] - a[0];
  return Math.abs(dx) < 3 ? null : dx < 0 ? 'l' : 'r';
}

/** The nearest walkable point to (x, z) within `max` u (a tap on water goes to the bank), or null. */
export function nearestWalkable(g: WalkGeo, x: number, z: number, max = 40): Pt | null {
  if (walkable(g, x, z)) return [x, z];
  for (let r = 4; r <= max; r += 4)
    for (let a = 0; a < 16; a++) {
      const px = x + Math.cos((a / 16) * Math.PI * 2) * r, pz = z + Math.sin((a / 16) * Math.PI * 2) * r;
      if (walkable(g, px, pz)) return [Math.round(px), Math.round(pz)];
    }
  return null;
}

