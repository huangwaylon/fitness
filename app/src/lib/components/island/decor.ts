// The island's decorations (docs/design.md "Decorating"): the ten items' art and footprints, the half-tile grid they
// stand on, and where one may go. Pure (the store and the scene use it; the rules are tested in decor.test.ts).
//   An item stands on NH's half-tile grid (CELL, 12u: a path is two of them wide), its footprint cols × rows cells
//   (turned a quarter: rows × cols), its centre where its feet are (models.json's anchor). A spot is fine on grass,
//   sand or a path, off the water, the cliff, the bridge and the stairs, clear of every fixed thing (trunks, bushes,
//   lamps, the tent) and of every other decoration, off what a tap must reach (the homes, the dig spots, the weeds'
//   and mushrooms' spots, the flowers, the beach finds, a goal tree's fallen fruit, centre stage, the walk graph's
//   named spots: doors, the stairs' and the bridge's ends, the banks one fishes from), and never walling anyone in.
import type { Box } from './geom.ts';
import { DECOR_ITEMS, type Placed } from '#lib/contract/decor.ts';
import {
  ARCH, BEACH_BOX, BRIDGE, CAKE, CENTRE_STAGE, CLIFF, DECOR_U, DIG_SPOTS, FLOWERS, GOAL_TREES, HOMES, LAND, LAWN_SPOTS, POND, SPRING,
  inOval, onBridge, onLand, riverNear, type Pt
} from './world.ts';
import { mushroomSpots } from './mushrooms.ts';
import { fixedObstacles } from './walkGraph.ts';
import { navWith, reachable } from './nav.ts';
import PLACES from './models.json';

export type DecorItem = (typeof DECOR_ITEMS)[number];
export type Facing = 0 | 1 | 2 | 3;
export { DECOR_ITEMS };

/** NH's half tile (u): the grid an item's footprint snaps to. */
export const CELL = 12;
/** Each item's footprint in cells (cols across × rows deep, facing the camera). */
const FOOT: Record<DecorItem, readonly [number, number]> = {
  'stone-lantern': [2, 2], birdbath: [2, 2], 'garden-wagon': [5, 2], 'iron-table': [2, 2], 'iron-chair': [2, 2],
  'brick-well': [4, 4], tanuki: [2, 2], monstera: [2, 2], signpost: [2, 2], wheelbarrow: [3, 2]
};

/** An item's sprite in a facing (scripts/models.ts renders all four). */
export const decorArt = (item: DecorItem, f: Facing): string => `decor/${item}-${f}`;
/** Every decoration sprite (usage.test). */
export const DECOR_ART: readonly string[] = DECOR_ITEMS.flatMap((i) => ([0, 1, 2, 3] as const).map((f) => decorArt(i, f)));

const P = PLACES as unknown as Record<string, { ax: number; ay: number; mu: [number, number] }>;
/** Its drawn height (u): the render's model units at DECOR_U, so every facing stands the same size. */
export const decorH = (item: DecorItem, f: Facing): number => Math.round((P[decorArt(item, f)]?.mu[1] ?? 12) * DECOR_U * 10) / 10;

/** Its footprint (u) in a facing: [width, depth]. */
export function footOf(item: DecorItem, f: Facing): [number, number] {
  const [c, r] = FOOT[item];
  return f % 2 ? [r * CELL, c * CELL] : [c * CELL, r * CELL];
}

/** The nearest grid spot for an item's centre: its footprint's edges on the half-tile lines. */
export function snap(item: DecorItem, f: Facing, x: number, z: number): Pt {
  const [w, d] = footOf(item, f);
  const on = (v: number, size: number) => {
    const off = (size / CELL) % 2 ? CELL / 2 : 0;
    return Math.round((v - off) / CELL) * CELL + off;
  };
  return [on(x, w), on(z, d)];
}

/** The ground an item covers (u; y is z). */
export function boxOf(p: { item: DecorItem; x: number; z: number; f: Facing }): Box {
  const [w, d] = footOf(p.item, p.f);
  return { x0: p.x - w / 2, x1: p.x + w / 2, y0: p.z - d / 2, y1: p.z + d / 2 };
}
/** What feet keep out of (the walk mask and the nav grow it by their pad): the footprint a little inside its cells. */
export function blockOf(p: { item: DecorItem; x: number; z: number; f: Facing }): Box {
  const b = boxOf(p);
  return { x0: b.x0 + 4, x1: b.x1 - 4, y0: b.y0 + 4, y1: b.y1 - 4 };
}

/** Why a spot won't do: off the island or over the water, the cliff, the bridge, a fixed thing, a tap's spot, another
 *  decoration, or it would wall someone in. */
export type Why = 'ground' | 'water' | 'thing' | 'spot' | 'taken' | 'walls';

const hit = (a: Box, b: Box, pad = 0) => a.x0 < b.x1 + pad && b.x0 - pad < a.x1 && a.y0 < b.y1 + pad && b.y0 - pad < a.y1;
const nearBox = (b: Box, x: number, z: number, r: number) => {
  const dx = Math.max(b.x0 - x, 0, x - b.x1), dz = Math.max(b.y0 - z, 0, z - b.y1);
  return dx * dx + dz * dz < r * r;
};

let keep: { pts: [number, number, number][]; boxes: Box[]; base: ReturnType<typeof navWith> } | null = null;
/** What a tap must reach (points with a radius, boxes) and the walk graph without decorations. */
function keepOut() {
  if (keep) return keep;
  const base = navWith([]);
  const pts: [number, number, number][] = [
    ...[HOMES.A, HOMES.B].map(([x, z]) => [x, z, 20] as [number, number, number]),
    // the walk graph's named spots: the doors, the stairs' and the bridge's ends and the banks one fishes from kept
    // clear, the villagers' outing spots just not covered
    ...Object.entries(base.named).map(([k, [x, z]]) => [x, z, /^(door|stair|bridge|river|mouth|clifftop|pondside|shore)/.test(k) ? 14 : 6] as [number, number, number]),
    ...DIG_SPOTS.map(([x, z]) => [x, z, 14] as [number, number, number]),
    ...LAWN_SPOTS.map(([x, z]) => [x, z, 8] as [number, number, number]),
    ...mushroomSpots().map(([x, z]) => [x, z, 10] as [number, number, number]),
    ...FLOWERS.map((f) => [f.x, f.z, 6] as [number, number, number]),
    [CENTRE_STAGE[0], CENTRE_STAGE[1], 30], [CAKE[0], CAKE[1], 24], [ARCH[0], ARCH[1], 24]
  ];
  const boxes: Box[] = [
    { x0: BEACH_BOX.x0, x1: BEACH_BOX.x1, y0: BEACH_BOX.z0, y1: BEACH_BOX.z1 },
    // a goal tree's fruit falls in front of its trunk
    ...[GOAL_TREES.A, GOAL_TREES.B].map(([x, z]) => ({ x0: x - 34, x1: x + 34, y0: z - 40, y1: z + 4 })),
    // the bridge and its ends
    { x0: BRIDGE.x - BRIDGE.w / 2 - 6, x1: BRIDGE.x + BRIDGE.w / 2 + 6, y0: BRIDGE.z0 - 18, y1: BRIDGE.z1 + 18 }
  ];
  return (keep = { pts, boxes, base });
}

/** Whether a point is on the water (with a margin of u). */
const wet = (x: number, z: number, m: number) => {
  if (inOval(POND, x, z, m) || inOval(SPRING, x, z, m)) return true;
  const r = riverNear(x, z);
  return r.d <= r.hw + m && !onBridge(x, z);
};

/** The cheap rules (every move of a drag): null when the spot is fine. `others`: the layout (`self`'s own entry is
 *  left out); `avoid`: feet standing there now (the villagers). */
export function spotWhy(item: DecorItem, f: Facing, x: number, z: number, others: readonly Placed[], self?: string, avoid: readonly Pt[] = []): Why | null {
  const b = boxOf({ item, x, z, f });
  // the island's lower tier, a step inside the shore, in front of the cliff's foot
  const corners: Pt[] = [[b.x0, b.y0], [b.x1, b.y0], [b.x0, b.y1], [b.x1, b.y1]];
  if (b.y1 > CLIFF.z0 - 8 || b.x0 < LAND.x0 || b.x1 > LAND.x1 || corners.some(([cx, cz]) => !onLand(cx, cz) || !onLand(cx + Math.sign(cx - x) * 4, cz + Math.sign(cz - z) * 4))) return 'ground';
  const probe: Pt[] = [...corners, [x, z], [x, b.y0], [x, b.y1], [b.x0, z], [b.x1, z]];
  if (probe.some(([px, pz]) => wet(px, pz, 6))) return 'water';
  if (fixedObstacles().some((o) => hit(b, o, 2))) return 'thing';
  const k = keepOut();
  if (k.boxes.some((o) => hit(b, o)) || k.pts.some(([px, pz, r]) => nearBox(b, px, pz, r)) || avoid.some(([px, pz]) => nearBox(b, px, pz, 14))) return 'spot';
  if (others.some((o) => o.id !== self && hit(b, boxOf(o)))) return 'taken';
  return null;
}

/** Whether the layout with `p` in it (in place of its own entry) walls someone in: a named spot of the walk graph or
 *  a point in `keepReach` (the villagers' feet) that home could reach without decorations no longer can (~3 ms: a drop,
 *  not every move). */
export function wallsIn(layout: readonly Placed[], p: { id?: string; item: DecorItem; x: number; z: number; f: Facing }, keepReach: readonly Pt[] = []): boolean {
  const { base } = keepOut();
  const g = navWith([...layout.filter((o) => o.id !== p.id), p].map(blockOf));
  const mainOf = (n: ReturnType<typeof navWith>, name: string) => {
    const i = n.nodes.findIndex((q) => q.name === name);
    return i >= 0 && n.comp[i] === n.main;
  };
  for (const name of Object.keys(base.named)) if (mainOf(base, name) && !mainOf(g, name)) return true;
  return keepReach.some(([x, z]) => reachable(base, x, z) && !reachable(g, x, z));
}
/** The full check (a drop, a confirm): the cheap rules, then whether it walls anyone in. */
export function placeWhy(layout: readonly Placed[], p: { id?: string; item: DecorItem; x: number; z: number; f: Facing }, avoid: readonly Pt[] = []): Why | null {
  return spotWhy(p.item, p.f, p.x, p.z, layout, p.id, avoid) ?? (wallsIn(layout, p, avoid) ? 'walls' : null);
}

/** The nearest fine spot to (x, z) on the grid (rings of cells, nearest first, ≤ `rings`), or null. */
export function nearestSpot(layout: readonly Placed[], item: DecorItem, f: Facing, x: number, z: number, avoid: readonly Pt[] = [], rings = 8): Pt | null {
  const [sx, sz] = snap(item, f, x, z);
  for (let r = 0; r <= rings; r++) {
    const ring: Pt[] = [];
    for (let i = -r; i <= r; i++) for (let j = -r; j <= r; j++) if (Math.max(Math.abs(i), Math.abs(j)) === r) ring.push([sx + i * CELL, sz + j * CELL]);
    ring.sort((a, b) => Math.hypot(a[0] - x, a[1] - z) - Math.hypot(b[0] - x, b[1] - z));
    for (const [px, pz] of ring) if (!placeWhy(layout, { item, f, x: px, z: pz }, avoid)) return [px, pz];
  }
  return null;
}

/** A new id for an item placed now (`d` + the time and a random tail, base 36). */
export const newDecorId = (at: number): string => `d${at.toString(36)}${Math.floor(Math.random() * 36 ** 3).toString(36).padStart(3, '0')}`;
