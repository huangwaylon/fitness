// The island's walk on its layout (docs/design.md "Walking"): the walk grid is layout/nav.ts's (navOf: what a tap does,
// the way there); this keeps what the island adds on top, from world.ts's values: its named spots (walkGraph.ts's
// names, so a node over the relay means the same on both phones), each building's footprint and door, and the building at
// a point. The island reads its layout from IslandScene's first line (site.svelte.ts), so world.ts's
// own fixed island (WORLD_2D) is only the unit tests': there the walk is the default layout's grid.
import type { Box } from './geom.ts';
import {
  BRIDGE, BUILDINGS, CENTRE_STAGE, CLIFF, FALLS_POOL, GOAL_TREES, HOMES, POND, RIVER, ROCK, PULLUP_AT, RIVER_BEND, SEATS,
  SHORE_Z, layoutNav, onLayout, worldGen, type BuildingId, type Pt
} from './world.ts';
import { art } from '#lib/art.ts';
import * as onGrid from '#lib/layout/nav.ts';
import { defaultLayout } from '#lib/layout/model.ts';
import { BUILDING_OF, HOME_OF } from './layoutWorld.ts';

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

/** The named spots (walkGraph.ts's names, so a node id over the relay means the same on either build). */
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

let onIt: { gen: number; nav: onGrid.LayoutNav } | null = null;
let fallback: onGrid.LayoutNav | null = null;
/** The walk's navigation now: the layout's walk grid (with the island's named spots). Off its layout (the unit tests'
 *  fixed island only), the default layout's. */
export function walkNav(): onGrid.LayoutNav {
  const ln = layoutNav() ?? (fallback ??= onGrid.navOf(defaultLayout()));
  if (onIt?.gen !== worldGen()) onIt = { gen: worldGen(), nav: { ...ln, named: { ...namedOnLayout(ln), ...ln.named } } };
  return onIt.nav;
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
