// Where the villagers may walk (docs/design.md "Walking"): a walk mask of zones on the ground plane (stage units, the
// feet's y), the obstacles in it (trunks, beds, the rock, whatever else stands on the lawn) and a small graph of named
// nodes to route around them. Pure and built from the scene's constants (scene.ts, beach.ts, care.ts), so a layout
// change carries over; parameterised (`walkGeo(extra)`) for the spots that come and go and for the tests. A straight
// segment when it stays in the mask and misses every obstacle, else the shortest way through the nodes (a visibility
// graph of ~15 points: no nav-mesh, nothing per frame).
import type { Box } from './geom.ts';
import { BED_ROWS, BED_X, CENTRE_STAGE, HEDGE_BASE, PLATEAU, POND, TREE, VILLAGER } from './scene.ts';
import { BEACH } from './beach.ts';
import { ROCK } from './care.ts';

export type Pt = readonly [number, number];

export interface WalkGeo {
  /** Walkable ground (their union). */
  zones: Box[];
  /** Ground nobody walks through (grown by `pad` when tested). */
  obstacles: Box[];
  /** Named waypoints (and the points of interest the villagers wander to). */
  nodes: Record<string, Pt>;
  /** Half the walker's footprint: how far feet keep from an obstacle. */
  pad: number;
}

/** What stands on the ground besides the fixed scenery (each optional: present only when it exists on the island). */
export interface WalkExtra {
  /** More obstacles (a building, a pond's water). */
  obstacles?: Box[];
  /** More named nodes (pondside, a museum door): they join the graph and the wander points. */
  nodes?: Record<string, Pt>;
  /** More walkable zones (a back strip). */
  zones?: Box[];
}

/** The island's walk geometry from the scene's constants. */
export function walkGeo(extra: WalkExtra = {}): WalkGeo {
  const front = BED_ROWS[1];
  const lawnTop = HEDGE_BASE + 14;
  const lawn: Box = { x0: PLATEAU.x0 + 16, x1: PLATEAU.x1 - 16, y0: lawnTop, y1: PLATEAU.y1 - 6 };
  const beach: Box = { x0: BEACH.x0, x1: BEACH.x1, y0: PLATEAU.y1 + 12, y1: BEACH.y1 };
  // the way down to the beach: the low front of the cliff between the villagers' homes
  const ramp: Box = { x0: VILLAGER.x.A + 14, x1: VILLAGER.x.B - 14, y0: front - 4, y1: beach.y0 + 6 };
  const trunk = (x: number): Box => ({ x0: x - 14, x1: x + 14, y0: TREE.base - 12, y1: TREE.base + 6 });
  const bed = (xs: number[]): Box => ({ x0: Math.min(...xs) - 20, x1: Math.max(...xs) + 18, y0: BED_ROWS[0] - 14, y1: front + 4 });
  // the pond (design.md "Pond"): its water is no ground; its front rim is under the left tree's canopy, so the angler
  // stands on the back bank behind it, reached up the gap between the pond's right bank and the museum
  const pond: Box = { x0: POND.cx - POND.rx, x1: POND.cx + POND.rx, y0: POND.cy - POND.ry + 6, y1: POND.cy + POND.ry };
  const bank: Box = { x0: pond.x0 + 4, x1: pond.x1 + 18, y0: 28, y1: 35 };
  const lane: Box = { x0: pond.x1 - 7, x1: pond.x1 + 18, y0: 28, y1: lawnTop + 4 };
  const obstacles: Box[] = [
    trunk(TREE.x.A), trunk(TREE.x.B), bed(BED_X.left), bed(BED_X.right),
    { x0: ROCK.x - 10, x1: ROCK.x + 10, y0: ROCK.y - 6, y1: ROCK.y + 3 }, pond,
    ...(extra.obstacles ?? [])
  ];
  const inner = (TREE.x.A + VILLAGER.x.A) / 2 + 22; // between a trunk and the middle
  const xs = { A: VILLAGER.x.A, B: VILLAGER.x.B };
  const mid = (TREE.base + BED_ROWS[0]) / 2;
  const nodes: Record<string, Pt> = {
    homeA: [xs.A, VILLAGER.foot], homeB: [xs.B, VILLAGER.foot],
    midA: [xs.A, mid], midB: [xs.B, mid], centre: [(xs.A + xs.B) / 2, mid],
    // centre stage: the open middle, kept for a visitor (the villagers wander there when nobody's visiting)
    centreStage: [CENTRE_STAGE.x, CENTRE_STAGE.base],
    treeA: [Math.max(inner, TREE.x.A + 40), TREE.base + 18], treeB: [Math.min(390 - inner, TREE.x.B - 40), TREE.base + 18],
    outA: [TREE.x.A - 40, TREE.base + 20], outB: [TREE.x.B + 40, TREE.base + 20],
    backA: [TREE.x.A + 40, lawn.y0 + 30], backB: [TREE.x.B - 40, lawn.y0 + 30], backC: [195, lawn.y0 + 22],
    backOutA: [TREE.x.A - 30, lawn.y0 + 26], backOutB: [TREE.x.B + 30, lawn.y0 + 26],
    rock: [ROCK.x + 22, ROCK.y + 4],
    rampTop: [(xs.A + xs.B) / 2, front + 8],
    shoreL: [BEACH.x0 + 40, beach.y0 + 6], shoreC: [195, beach.y0 + 6], shoreR: [BEACH.x1 - 40, beach.y0 + 6],
    // up the lane beside the pond to its back bank (the pondside: an angler's spot, a point of interest)
    pondFoot: [lane.x0 + 1, lawnTop - 4], pondTurn: [pond.x1 + 10, lawnTop - 8], pondLane: [pond.x1 + 11, POND.cy + 4], pondTop: [pond.x1 + 11, 31], pondside: [POND.cx, 32],
    ...(extra.nodes ?? {})
  };
  return { zones: [lawn, beach, ramp, bank, lane, ...(extra.zones ?? [])], obstacles, nodes, pad: 8 };
}

const inside = (b: Box, x: number, y: number, pad = 0) => x > b.x0 - pad && x < b.x1 + pad && y > b.y0 - pad && y < b.y1 + pad;

/** On walkable ground and clear of every obstacle (grown by the footprint). */
export function walkable(g: WalkGeo, x: number, y: number): boolean {
  return g.zones.some((z) => inside(z, x, y)) && !g.obstacles.some((o) => inside(o, x, y, g.pad));
}

/** A straight walk from a to b stays walkable (sampled every 4u). `loose`: the first stretch near `a` may be off the
 *  mask (a walker caught mid-step a little outside it). */
export function segmentClear(g: WalkGeo, a: Pt, b: Pt, loose = 0): boolean {
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const n = Math.max(1, Math.ceil(len / 4));
  for (let i = 0; i <= n; i++) {
    if (i * (len / n) < loose) continue;
    if (!walkable(g, a[0] + ((b[0] - a[0]) * i) / n, a[1] + ((b[1] - a[1]) * i) / n)) return false;
  }
  return true;
}

const dist = (a: Pt, b: Pt) => Math.hypot(b[0] - a[0], b[1] - a[1]);

/** The way from `from` to `to`: the waypoints after `from` (ending at `to`), or null when there's none. */
export function route(g: WalkGeo, from: Pt, to: Pt): Pt[] | null {
  if (!walkable(g, to[0], to[1])) return null;
  const loose = walkable(g, from[0], from[1]) ? 0 : 12;
  if (segmentClear(g, from, to, loose)) return [to];
  // Dijkstra over from, the nodes and to (edges where the straight walk is clear)
  const pts: Pt[] = [from, ...Object.values(g.nodes).filter(([x, y]) => walkable(g, x, y)), to];
  const n = pts.length, best = new Array<number>(n).fill(Infinity), prev = new Array<number>(n).fill(-1), done = new Array<boolean>(n).fill(false);
  best[0] = 0;
  for (;;) {
    let i = -1;
    for (let k = 0; k < n; k++) if (!done[k] && best[k] < Infinity && (i < 0 || best[k] < best[i])) i = k;
    if (i < 0 || i === n - 1) break;
    done[i] = true;
    for (let k = 1; k < n; k++) {
      if (done[k] || k === i) continue;
      const d = best[i] + dist(pts[i], pts[k]);
      if (d < best[k] && segmentClear(g, pts[i], pts[k], i === 0 ? loose : 0)) {
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

/** Walk speeds (u/s): to a tapped thing, and wandering about. */
export const SPEED = { action: 240, wander: 90 } as const;
/** An action walk's duration bounds (ms), and the longest walk worth making (longer: turn and act from where you are);
 *  `far`: a walk to somewhere set apart (the pond's back bank) may take a little longer. */
export const ACTION_MS = { min: 150, max: 900, cap: 1200, far: 1450 } as const;

/** How long an action walk of `len` u takes (ms): at SPEED.action, clamped to 150–900; null when it would take over
 *  1.2 s (no walk: turn and act); 0 when already there. `far`: up to 1.45 s, unclamped above. */
export function actionMs(len: number, far = false): number | null {
  if (len < 4) return 0;
  const raw = (len / SPEED.action) * 1000;
  if (raw > (far ? ACTION_MS.far : ACTION_MS.cap)) return null;
  return Math.min(far ? ACTION_MS.far : ACTION_MS.max, Math.max(ACTION_MS.min, raw));
}

/** A wander's duration (ms) at SPEED.wander. */
export const wanderMs = (len: number): number => (len / SPEED.wander) * 1000;

/** How far from a target its action spots are (u): close, then a little further out. */
export const REACH = [26, 40] as const;

/** Where to stand to act on a target at (tx, ty): around it at a short reach, best first: beside it on the side the
 *  walker comes from, the other side, in front, behind, then a little further out (further still: level with it only). Each is walkable; the caller
 *  checks it against what's on screen (no control under the villager) and that a route exists. */
export function actionSpots(g: WalkGeo, tx: number, ty: number, from: Pt, reach: readonly number[] = REACH): Pt[] {
  const side = from[0] <= tx ? -1 : 1;
  const out: Pt[] = [];
  const around = [[side, 0.15], [-side, 0.15], [0, 0.8], [side * 0.7, 0.7], [-side * 0.7, 0.7], [0, -0.9], [side * 0.7, -0.7], [-side * 0.7, -0.7]] as const;
  for (const r of reach)
    // beyond REACH only level with it (across a bed), never down a cliff or up behind something
    for (const [dx, dy] of r > REACH[1] ? around.slice(0, 2) : around) {
      const x = tx + dx * r, y = ty + dy * r;
      if (walkable(g, x, y)) out.push([Math.round(x), Math.round(y)]);
    }
  return out;
}

/** Depth from the feet's y (z-index): behind the trees, between the trees and the beds, among the beds, the front row
 *  (the villagers' homes), the beach. Matches the scene's layers (tokens.css --z-*: trees 30–34, back flowers 49,
 *  front flowers 53, visitors 55). */
export function depthZ(y: number): number {
  if (y < TREE.base) return 27;
  if (y < BED_ROWS[0]) return 47;
  if (y < BED_ROWS[1]) return 50;
  if (y <= PLATEAU.y1) return 51;
  return 53;
}

/** The facing for a walk from a to b: by the horizontal direction (null when it's nearly straight up or down). */
export function facingFor(a: Pt, b: Pt): 'l' | 'r' | null {
  const dx = b[0] - a[0];
  return Math.abs(dx) < 3 ? null : dx < 0 ? 'l' : 'r';
}
