// Where the villagers may walk (docs/design.md "World", "Walking"): the island's walk grid on its layout (layout/nav.ts,
// world/nav.ts walkNav: the default layout's off one, the unit tests'), its named spots, and what comes and goes on top
// (`walkGeo(extra)`: a visitor's box). Every test and every way is the grid's (A*, its corners pulled straight).
import type { Box } from './geom.ts';
import type { Pt } from './world.ts';
import * as onGrid from '#lib/layout/nav.ts';
import { dist } from '#lib/layout/nav.ts';
import { walkNav } from './nav.ts';

export type { Pt };

export interface WalkGeo {
  /** What came and goes (a visitor's box): tested on top of the grid. */
  extra?: Box[];
  /** Named waypoints (and the points of interest the villagers wander to). */
  nodes: Record<string, Pt>;
  /** The island's walk grid (layout/nav.ts). */
  lnav: onGrid.LayoutNav;
}

/** What stands on the ground besides the layout. */
interface WalkExtra {
  /** More obstacles (a visitor's spot). */
  obstacles?: Box[];
  /** More named nodes: they join the wander points. */
  nodes?: Record<string, Pt>;
}

/** The island's walk geometry. */
export function walkGeo(extra: WalkExtra = {}): WalkGeo {
  const n = walkNav();
  return { extra: extra.obstacles ?? [], nodes: { ...n.named, ...(extra.nodes ?? {}) }, lnav: n };
}

/** On walkable ground and clear of every obstacle (grown by the footprint). */
export const walkable = (g: WalkGeo, x: number, z: number): boolean => onGrid.walkable(g.lnav, x, z, g.extra);

/** A straight walk from a to b stays walkable. `loose`: the first stretch near `a` may be off the grid (a walker caught
 *  mid-step a little outside it), sampled every 3u. */
export function segmentClear(g: WalkGeo, a: Pt, b: Pt, loose = 0): boolean {
  if (!loose) return onGrid.clear(g.lnav, a, b, g.extra);
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const n = Math.max(1, Math.ceil(len / 3));
  for (let i = 0; i <= n; i++) {
    if (i * (len / n) < loose) continue;
    if (!walkable(g, a[0] + ((b[0] - a[0]) * i) / n, a[1] + ((b[1] - a[1]) * i) / n)) return false;
  }
  return true;
}

/** The way from `from` to `to`: the waypoints after `from` (ending at `to`), or null when there's none. */
export const route = (g: WalkGeo, from: Pt, to: Pt): Pt[] | null => onGrid.findPath(g.lnav, from, to, g.extra);

/** A route's length from `from`. */
export function routeLength(from: Pt, pts: readonly Pt[]): number {
  let len = 0, at = from;
  for (const p of pts) {
    len += dist(at, p);
    at = p;
  }
  return len;
}

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

