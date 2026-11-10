// The island's world (docs/design.md "World"): its places as one flat plan, in world units: x across (centre 195), z
// into the island (bigger = further back; the front shoreline is SHORE_Z). These are the old fixed island's values
// (WORLD_2D) until the island applies its editable layout (site.svelte.ts: setWorld(worldOf(layout)), always on the
// live island), then the layout's: the DOM nodes over the 3D canvas, the walk, the critters and the 3D scene all read
// the same live bindings. The unit tests and the layout scripts read the fixed ones.

import SCATTER from './scatter.json' with { type: 'json' };
import type { LayoutNav } from '#lib/layout/nav.ts';
import { offBuildings, onBuilding } from '#lib/layout/clear.ts';
import { GRID, tileZ } from '#lib/layout/grid.ts';

export type Pt = readonly [number, number];
type RoundRect = { readonly x0: number; readonly x1: number; readonly z0: number; readonly z1: number; readonly r: number };
type Box4 = { readonly x0: number; readonly x1: number; readonly z0: number; readonly z1: number };
type Oval = { readonly x: number; readonly z: number; readonly rx: number; readonly rz: number };

/** The plan's extent (wider than the land; z1 the grid's far end: the depth order's, camera.svelte.ts). */
export const PLAN = { x0: -230, x1: 620, z0: -460, z1: tileZ(GRID.rows) } as const;

/** The island (land incl. beaches): a rounded rectangle with a 130u corner radius and a ±4u wobble. */
const LAND_2D = { x0: -40, x1: 430, z0: -30, z1: 1260, r: 130 } as const;
export let LAND: RoundRect = LAND_2D;
/** The front shoreline (the sea's edge in front of the beach). */
export let SHORE_Z: number = LAND.z0;
/** The front beach (SHORE_Z … BEACH_FRONT, 140u: fishing and diving from it at まえ) is deeper than the side and back
 *  beaches. */
const BEACH_FRONT = 110;
const BEACH_SIDE = 30;
/** The grass (tier 1 and tier 2 as one area; the cliff crosses it): onGrass's. */
let GRASS: RoundRect = { x0: LAND.x0 + BEACH_SIDE, x1: LAND.x1 - BEACH_SIDE, z0: BEACH_FRONT, z1: LAND.z1 - BEACH_SIDE, r: 90 };

/** The camera's two stops (camZ), front to back: まえ (home: the sea, the beach, the health lawn) and おく (the
 *  campsite's end); the 3D island's camera fits its own ends to the screen (world3d/engine.ts limits). */
export let CAMS: { readonly mae: number; readonly oku: number } = { mae: 30, oku: 642 };

/** The live window (spec §7): only sprites in [camZ − BEHIND, camZ + AHEAD] are displayed. */
export const BEHIND = 600;
export const AHEAD = 900;

// ---- water ----------------------------------------------------------------------------------------------------------

/** The stream's centreline [x, z, width]: the spring on the upper tier, the falls over the cliff, a meander down the
 *  east side, then a wide bend west across the island between the health lawn and おく (under the stone bridge on the
 *  path) and out through the west beach (the mouth, widening into the sea). */
export let RIVER: readonly (readonly [number, number, number])[] = [
  [364, 1146, 20], [368, 1108, 24], [372, 1082, 32], [372, 1040, 36],
  // the reach below the falls meanders gently, its width breathing (NH's rivers are never ruler-straight)
  [377, 990, 30], [366, 930, 33], [378, 870, 29], [367, 812, 32], [374, 762, 30],
  // the bend, and the reach across (a gentle wave, the bridge at x 195)
  [358, 714, 31], [318, 678, 30], [258, 654, 29], [195, 646, 30], [134, 652, 31], [76, 646, 30], [26, 636, 33],
  // the mouth on the west beach
  [-12, 628, 42], [-44, 620, 56], [-82, 614, 80], [-132, 608, 100]
];
/** The z where the stream's north–south reach ends (it bends west there): riverNS's. */
export let RIVER_BEND = 768;
/** The stone bridge where the path crosses the stream (NH's stone bridge): centred on x, the deck from z0 (its near
 *  end) to z1,
 *  w wide (NH's proportions: 30.2 × 40.8 model units, 1.18u each). The deck is walkable `BRIDGE_RAIL` in from its sides. */
export let BRIDGE: { readonly x: number; readonly z0: number; readonly z1: number; readonly w: number } = { x: 195, z0: 622, z1: 670, w: 35.5 };
export const BRIDGE_RAIL = 5;
/** Whether (x, z) is on the bridge's deck (`inset` in from its sides, e.g. the rails). */
export const onBridge = (x: number, z: number, inset = 0): boolean => Math.abs(x - BRIDGE.x) <= BRIDGE.w / 2 - inset && z >= BRIDGE.z0 && z <= BRIDGE.z1;
/** The spring on the upper tier the stream rises from. */
export let SPRING: Oval = { x: 364, z: 1152, rx: 28, rz: 16 };
/** The pond (an oval of water), with lily pads: west of the path to the campsite. */
export let POND: Oval = { x: 74, z: 772, rx: 46, rz: 26 };
/** The ponds put down on the layout (kind `pond`: layout/ponds.ts), each its water's oval: fresh water as the pond's
 *  (none on world.ts's own island). */
export let PONDS: readonly Oval[] = [];
/** The pond's oval a point is in (`grow` u round its edge): the painted pond's or one put down, else null. */
export const pondAt = (x: number, z: number, grow = 0): Oval | null => [POND, ...PONDS].find((o) => inOval(o, x, z, grow)) ?? null;

/** Where a freshwater cast lands, NH's locations (spec Q3): the pond, the river, its mouth, or the clifftop. */
export type FreshWhere = 'pond' | 'river' | 'mouth' | 'clifftop';

// ---- the cliff ------------------------------------------------------------------------------------------------------

/** The cliff to tier 2, behind the campsite: its face from z0 (foot) to z1 (top edge) across x0…x1; stone stairs and
 *  the falls cut it. */
export let CLIFF: { readonly z0: number; readonly z1: number; readonly x0: number; readonly x1: number; readonly stair: Pt; readonly fall: Pt } = { z0: 1040, z1: 1080, x0: -12, x1: 402, stair: [36, 84], fall: [351, 393] };
/** The upper tier is beyond the horizon from both stops: the falls' pool (this far in front of the cliff's foot) is
 *  where NH's clifftop river shows (its fish come there). */
export const FALLS_POOL = 46;

// ---- paths ----------------------------------------------------------------------------------------------------------

/** Paths (24u wide, about half an NH tile): dirt, wandering. Polylines [x, z]. (No brick: the shops are gone.) */
const PATH_W = 24;
export const PATHS: { dirt: readonly (readonly Pt[])[] } = {
  dirt: [
    // the beach to the campsite's clearing, the clearing to the stairs
    [[193, 96], [199, 170], [190, 250], [198, 340], [191, 450], [197, 540], [192, 640], [199, 740], [193, 830], [195, 900]],
    [[184, 902], [146, 934], [104, 968], [72, 1004], [60, 1034]]
  ]
};

// ---- buildings ------------------------------------------------------------------------------------------------------

/** The one building left: the campsite (its tent), where visitors arrive and stay. */
export type BuildingId = 'campsite' | 'home-B' | 'home-G' | 'museum' | 'shop';
export interface Building {
  id: BuildingId;
  /** Art key (static/art). */
  key: string;
  /** The front wall's centre on the ground (the door line). */
  x: number;
  z: number;
  /** Drawn height (u); the width comes from the art. */
  h: number;
  /** Footprint depth behind the door line (not walkable). */
  depth: number;
  /** Its footprint's width (u), else its art's at its height. */
  w?: number;
}
export let BUILDINGS: readonly Building[] = [{ id: 'campsite', key: 'deco/campsite', x: 196, z: 984, h: 80, depth: 40 }];
/** The campsite. */
export let CAMPSITE: Building = BUILDINGS[0];

// ---- まえ: the health lawn ------------------------------------------------------------------------------------------

/** The villagers' home spots: A (ウェイ) on the left and B (うめ) on the right, on both phones. */
export let HOMES: { readonly A: Pt; readonly B: Pt } = { A: [132, 214], B: [262, 214] };
/** Goal trees (hardwood, 120u), each beside its person's villager, on the outer side (their fruit, glints and popup
 *  are the day's goals). */
export let GOAL_TREES: { readonly A: Pt; readonly B: Pt } = { A: [60, 216], B: [332, 216] };
export const TREE_H = 120;
/** The tape deck, between the villagers. */
export let TAPE_DECK: Pt = [195, 306];
/** The rock. */
export let ROCK: Pt = [112, 478];
/** Fossil dig spots: six lawn spots, four on the front lawn in clear view from まえ (in front of the villagers and the
 *  trees, by the beach) and two behind the trees, off the canopies' columns (on a short screen the HUD stands over
 *  those). */
export let DIG_SPOTS: readonly Pt[] = [[150, 162], [244, 164], [24, 180], [326, 152], [140, 440], [236, 462]];
/** Lawn spots for weeds (both sections' open lawn, off paths, flowers, trunks and water: scatter.json, scripts/layout.ts). */
export let LAWN_SPOTS: readonly Pt[] = SCATTER.lawn as unknown as readonly Pt[];
/** The seasonal hedge along the stream's front bank, between the lawn and おく, with a gap for the path and the bridge
 *  (its streetlamps). */
export let HEDGE_Z = 600;
export let HEDGE_XS: readonly number[] = [36, 80, 124, 266, 310];
/** Beach finds lie at z 10…90 on x 120…300. */
export let BEACH_BOX: Box4 = { x0: 120, x1: 300, z0: -18, z1: 90 };
/** The sea's fishing water (in front of the shoreline, at the front of まえ). */
export let SEA_BOX: Box4 = { x0: 40, x1: 290, z0: -100, z1: -48 };

// ---- おく: the campsite's clearing ------------------------------------------------------------------------------------

/** Centre stage: the clearing in front of the campsite's tent, where visitors stand. */
export let CENTRE_STAGE: Pt = [196, 898];
/** The wedding arch frames Reese and Cyrus, just behind them; the birthday cake stands in front of centre stage. */
export let ARCH: Pt = [196, 922];
export let CAKE: Pt = [196, 852];

// ---- the scenery (still sprites: trees, bushes, props) ----------------------------------------------------------------

type SceneryKind = 'oak' | 'cedar' | 'palm' | 'bamboo' | 'bush' | 'rock' | 'prop';
export interface Scenery {
  id: string;
  kind: SceneryKind;
  /** Art key, or for oaks / bushes resolved per season by the scene ('oak' → trees/oak-<foliage>). */
  key: string;
  x: number;
  z: number;
  h: number;
  flip?: boolean;
  /** Its footprint on the ground [width, depth] (u), centred on its feet: a walk obstacle and a spot a decoration may
   *  not take (else one from its kind). */
  foot?: readonly [number, number];
}
const s = (id: string, kind: SceneryKind, key: string, x: number, z: number, h: number, flip = false): Scenery => ({ id, kind, key, x, z, h, flip });
export let SCENERY: readonly Scenery[] = [
  // まえ, kept clear (the health lawn, its trees, open lawn and the path; the sea wide in front): the island's
  // the island's only palms, by the front beach: a pair at its outer corners, small enough and far enough out to
  // leave the lawn, the finds and the sea view open, and a young one by the water on the left; plumeria at the grass
  // edge, an oak and a cedar behind the lawn
  s('palm-1', 'palm', 'trees/palm', 2, 64, 96), s('palm-2', 'palm', 'trees/palm', 392, 70, 92, true),
  s('palm-3', 'palm', 'trees/palm', 44, 2, 70, true),
  s('plumeria-w', 'bush', 'bushes/white-plumeria', 100, 122, 34), s('plumeria-p', 'bush', 'bushes/pink-plumeria', 292, 122, 34),
  s('oak-m1', 'oak', 'oak', 328, 494, 112), s('cedar-m1', 'cedar', 'trees/cedar', 34, 442, 140),
  // おく, uncluttered (open lawn between the pieces), NH's decor (scripts/fetch-assets.ts): streetlamps at the bridge's front corners, the month's bushes either side of
  // the path (`month-bush-a|b`: scene.ts hedgePair), the pond on the west with a flat rock and a clump by it, the bamboo
  // grove on the east by the stream, an oak and cedars at the edges, the campsite's tent in its clearing with its sign,
  // garden lanterns either side of the clearing and white ones at the stairs' foot, a rock at the cliff's foot, the
  // campfire on the clearing's east side (clear of centre stage and the tent's door) with two log stools at it
  s('lamp-b1', 'prop', 'deco/streetlamp', 168, 612, 46), s('lamp-b2', 'prop', 'deco/streetlamp', 222, 612, 46),
  s('bush-m1', 'bush', 'month-bush-a', 152, 716, 34), s('bush-m2', 'bush', 'month-bush-b', 240, 724, 34),
  { ...s('rock-m1', 'rock', 'deco/flat-rock', 142, 764, 12), foot: [52, 18] },
  s('bamboo-1', 'bamboo', 'trees/bamboo', 294, 774, 66), s('bamboo-2', 'bamboo', 'trees/bamboo', 326, 764, 72, true),
  s('bamboo-3', 'bamboo', 'trees/bamboo', 310, 794, 70, true),
  s('cedar-k1', 'cedar', 'trees/cedar', 8, 694, 140),
  s('oak-k1', 'oak', 'oak', 36, 904, 116), s('cedar-k2', 'cedar', 'trees/cedar', -2, 1000, 144),
  s('camp-sign', 'prop', 'deco/campsite-sign', 92, 930, 30),
  s('bush-k1', 'bush', 'bushes/holly', 114, 1000, 32), s('bush-k2', 'bush', 'bushes/holly', 282, 1000, 32),
  s('lantern-1', 'prop', 'deco/garden-lantern', 140, 896, 24), s('lantern-2', 'prop', 'deco/garden-lantern', 254, 900, 24),
  s('lantern-3', 'prop', 'deco/garden-lantern-white', 24, 1022, 24), s('lantern-4', 'prop', 'deco/garden-lantern-white', 98, 1022, 24),
  s('rock-t1', 'rock', 'deco/garden-rock', 316, 1022, 20),
  s('campfire', 'prop', 'deco/campfire', 262, 944, 47),
  s('stool-1', 'prop', 'deco/log-stool', 232, 956, 19), s('stool-2', 'prop', 'deco/log-stool', 293, 952, 19, true),
  // the forest on the upper tier behind the cliff (short enough that its tops stay under the HUD)
  s('cedar-f1', 'cedar', 'trees/cedar', -6, 1110, 126), s('cedar-f2', 'cedar', 'trees/cedar', 64, 1160, 130), s('cedar-f3', 'cedar', 'trees/cedar', 140, 1104, 122),
  s('cedar-f4', 'cedar', 'trees/cedar', 214, 1170, 130), s('cedar-f5', 'cedar', 'trees/cedar', 284, 1112, 126), s('cedar-f6', 'cedar', 'trees/cedar', 130, 1200, 124)
];

/** World units per model unit for NH's outdoor furniture (the fixed decor and the decorations a player puts down:
 *  decor.ts): one family, one scale (a bench 40u beside an 80u villager). */
export const DECOR_U = 3;
/** The decor's spots (docs/design.md "Decor"): NH's outdoor furniture standing for good (`key`) and the seasonal
 *  pieces that take turns in a spot of their own (fixedDecor.ts: a seasonal piece never adds a spot). Every spot is a
 *  walk obstacle all year, so a decoration a player puts down never stands where a seasonal piece will come. foot:
 *  [width, depth] in u, centred on its feet. */
export interface DecorSlot {
  id: string;
  x: number;
  z: number;
  foot: readonly [number, number];
  /** Its look all year (else only its seasons' pieces: fixedDecor.ts). */
  key?: string;
}
export let DECOR_SLOTS: readonly DecorSlot[] = [
  // まえ: the one bench at the left grass edge, facing the sea; summer's beach chair and sandcastle on the east beach
  // (clear of the finds and Gulliver); a snowboy on the lawn after a snow day
  { id: 'bench-mae', x: 40, z: 130, foot: [52, 14], key: 'deco/park-bench' },
  { id: 'beach-chair', x: 340, z: 76, foot: [56, 22] },
  { id: 'sandcastle', x: 330, z: -6, foot: [26, 18] },
  { id: 'snowboy', x: 252, z: 336, foot: [30, 20] },
  // おく: a hammock by the pond's front (the illuminated tree in its weeks), the log bench on the pond's back bank
  // (the blossom week's picnic set) with the rod stand, the pump, the shishi-odoshi at the bamboo's foot,
  // the pull-up bar stand on the east lawn by the stream, the firewood by the tent
  { id: 'hammock', x: 98, z: 700, foot: [56, 16], key: 'deco/hammock' },
  { id: 'bench-pond', x: 92, z: 846, foot: [56, 16], key: 'deco/log-bench' },
  { id: 'rod-stand', x: 34, z: 818, foot: [22, 10], key: 'deco/rod-stand' },
  { id: 'pump', x: 250, z: 806, foot: [24, 14], key: 'deco/pump' },
  { id: 'shishi', x: 282, z: 744, foot: [26, 18], key: 'deco/shishiodoshi' },
  { id: 'pullup', x: 330, z: 902, foot: [28, 12], key: 'deco/pullup' },
  { id: 'firewood', x: 150, z: 972, foot: [18, 12], key: 'deco/firewood' }
];

/** Where a villager sits (docs/design.md "Decor: sitting"): just behind a bench's seat or a stool (the piece in front
 *  covers its legs: SEAT_DROP), two to a bench; and where it stands at the pull-up bar. Walk-graph nodes (walkGraph.ts,
 *  nav.ts): the same names on both phones. */
const slotAt = (id: string) => DECOR_SLOTS.find((d) => d.id === id)!;
const seat = (id: string, dx: number): Pt => {
  const d = slotAt(id);
  return [d.x + dx, d.z + d.foot[1] / 2 + 9];
};
const stool = (id: string): Pt => {
  const s = SCENERY.find((x) => x.id === id)!;
  return [s.x, s.z + 13];
};
export let SEATS: Readonly<Record<string, Pt>> = {
  seatMaeL: seat('bench-mae', -13), seatMaeR: seat('bench-mae', 13),
  seatPondL: seat('bench-pond', -14), seatPondR: seat('bench-pond', 14),
  stoolW: stool('stool-1'), stoolE: stool('stool-2')
};
/** Where a villager stands to do a pull-up (just behind the bar stand). */
export let PULLUP_AT: Pt = seat('pullup', 0);
/** How far a seated villager sinks (u): the bench's seat (or the stool) covers its legs. */
export const SEAT_DROP = 12;
/** The seat (its name) a villager standing at (x, z) is on, or null. */
export const seatAt = (x: number, z: number): string | null =>
  Object.entries(SEATS).find(([, [sx, sz]]) => Math.abs(sx - x) <= 3 && Math.abs(sz - z) <= 3)?.[0] ?? null;

// ---- wild flowers ---------------------------------------------------------------------------------------------------

/** NH's flowers growing wild over the lawn: clumps of 2–5 of one kind (scene.ts WILD: the season's), on open grass off
 *  the paths and the sand, few on the front lawn, a few more round the campsite's ground. [centre x, z, how many]. */
const CLUMPS = SCATTER.clumps as unknown as readonly (readonly [number, number, number])[];
/** A clump's flowers round its centre (u), by how many: loose, a little wider than deep (the ground's foreshortening). */
const CLUMP_AT: Record<number, readonly Pt[]> = {
  2: [[-8, -2], [9, 3]],
  3: [[-10, -3], [8, -5], [0, 6]],
  4: [[-11, -4], [7, -6], [-4, 6], [13, 4]],
  5: [[-12, -4], [6, -7], [-4, 5], [14, 3], [-19, 6]]
};
export interface Flower {
  /** Its shared id, from where it stands (`fl:<x>:<z>`: the shared day's watered flower). */
  id: string;
  x: number;
  z: number;
  /** Its clump's index (its kind is the clump's: scene.ts wildFlower). */
  clump: number;
}
/** Every wild flower (a small per-spot jitter of ±2u keeps a clump from looking stamped). */
export let FLOWERS: readonly Flower[] = CLUMPS.flatMap(([cx, cz, n], clump) =>
  CLUMP_AT[n].map(([dx, dz], k) => {
    const h = ((cx * 73 + cz * 151 + k * 197) >>> 0) % 25;
    const x = Math.round(cx + dx + (h % 5) - 2), z = Math.round(cz + dz + Math.floor(h / 5) - 2);
    return { id: `fl:${x}:${z}`, x, z, clump };
  })
);
/** A flower by its id. */
export const flowerById = (id: string): Flower | undefined => FLOWERS.find((f) => f.id === id);

// ---- geometry helpers -----------------------------------------------------------------------------------------------

/** The stream's half-width and centre x at z along its north–south reach, or null off it (z ≥ 768, before it bends
 *  west). */
export function riverNS(z: number): { x: number; hw: number } | null {
  for (let i = 0; i < RIVER.length - 1 && RIVER[i][1] > RIVER_BEND; i++) {
    const a = RIVER[i], b = RIVER[i + 1];
    if (z <= a[1] && z >= b[1]) {
      const t = (a[1] - z) / (a[1] - b[1] || 1);
      return { x: a[0] + (b[0] - a[0]) * t, hw: (a[2] + (b[2] - a[2]) * t) / 2 };
    }
  }
  return null;
}

/** Distance from (x, z) to the river's centreline and the width there (any reach). */
export function riverNear(x: number, z: number): { d: number; hw: number; i: number; t: number } {
  let best = { d: Infinity, hw: 0, i: 0, t: 0 };
  for (let i = 0; i < RIVER.length - 1; i++) {
    const [ax, az, aw] = RIVER[i], [bx, bz, bw] = RIVER[i + 1];
    const dx = bx - ax, dz = bz - az, L = dx * dx + dz * dz || 1;
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / L));
    const d = Math.hypot(x - (ax + dx * t), z - (az + dz * t));
    if (d < best.d) best = { d, hw: (aw + (bw - aw) * t) / 2, i, t };
  }
  return best;
}

/** Whether (x, z) is on the river's water. */
export function inRiver(x: number, z: number): boolean {
  if (geo) return geo.inRiver(x, z);
  const r = riverNear(x, z);
  return r.d <= r.hw;
}

/** Whether (x, z) is in an ellipse's water. */
export const inOval = (o: { x: number; z: number; rx: number; rz: number }, x: number, z: number, grow = 0): boolean =>
  ((x - o.x) / (o.rx + grow)) ** 2 + ((z - o.z) / (o.rz + grow)) ** 2 <= 1;

/** NH's freshwater location of a cast at (x, z): the pond, the clifftop (above the cliff, or the falls' pool at its
 *  foot: the upper tier is beyond the horizon), the river mouth (the wide reach on the west beach) or the river. */
export function freshWhere(x: number, z: number): FreshWhere {
  if (geo) return geo.freshWhere(x, z);
  if (inOval(POND, x, z, 12)) return 'pond';
  if (z > CLIFF.z0 - FALLS_POOL) return 'clifftop';
  if (x < -6 && z < 700) return 'mouth';
  return 'river';
}

/** Distance from a point to a rounded rectangle's edge (negative inside). */
function roundRectDist(r: { x0: number; x1: number; z0: number; z1: number; r: number }, x: number, z: number): number {
  const cx = (r.x0 + r.x1) / 2, cz = (r.z0 + r.z1) / 2;
  const hx = (r.x1 - r.x0) / 2 - r.r, hz = (r.z1 - r.z0) / 2 - r.r;
  const qx = Math.abs(x - cx) - hx, qz = Math.abs(z - cz) - hz;
  return Math.hypot(Math.max(qx, 0), Math.max(qz, 0)) + Math.min(Math.max(qx, qz), 0) - r.r;
}
/** Whether (x, z) is on land (sand or grass). */
export const onLand = (x: number, z: number): boolean => (geo ? geo.onLand(x, z) : roundRectDist(LAND, x, z) <= 0);
/** Whether (x, z) is on the grass (not the beach). */
export const onGrass = (x: number, z: number): boolean => (geo ? geo.onGrass(x, z) : roundRectDist(GRASS, x, z) <= 0);

/** Distance from a point to a polyline. */
function polyDist(line: readonly Pt[], x: number, z: number): number {
  let d = Infinity;
  for (let i = 0; i < line.length - 1; i++) {
    const [ax, az] = line[i], [bx, bz] = line[i + 1];
    const dx = bx - ax, dz = bz - az, L = dx * dx + dz * dz || 1;
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / L));
    d = Math.min(d, Math.hypot(x - (ax + dx * t), z - (az + dz * t)));
  }
  return d;
}

export type Surface = 'sea' | 'sand' | 'grass' | 'dirt' | 'stone' | 'water';
/** What the ground is at (x, z): footsteps and taps pick their sound and flourish from it. */
export function surfaceAt(x: number, z: number): Surface {
  if (geo) return geo.surfaceAt(x, z);
  if (onBridge(x, z)) return 'stone';
  if (!onLand(x, z)) return 'sea';
  if (inRiver(x, z) || inOval(POND, x, z) || inOval(SPRING, x, z)) return 'water';
  if (x >= CLIFF.stair[0] && x <= CLIFF.stair[1] && z >= CLIFF.z0 - 4 && z <= CLIFF.z1 + 4) return 'stone';
  if (!onGrass(x, z)) return 'sand';
  for (const p of PATHS.dirt) if (polyDist(p, x, z) <= PATH_W / 2) return 'dirt';
  return 'grass';
}

// ---- the island's layout (the 3D island on the long layout: docs/island-layout.md "How the 3D island reads it")

/** Everything above that the layout gives instead (island/layoutWorld.ts worldOf): the values, and the tests that read
 *  the layout's tiles rather than the shapes. */
export interface WorldGeo {
  LAND: RoundRect; SHORE_Z: number; GRASS: RoundRect; CAMS: { mae: number; oku: number };
  RIVER: readonly (readonly [number, number, number])[]; RIVER_BEND: number; BRIDGE: typeof BRIDGE; SPRING: Oval; POND: Oval; CLIFF: typeof CLIFF;
  BUILDINGS: readonly Building[]; HOMES: typeof HOMES; GOAL_TREES: typeof GOAL_TREES; TAPE_DECK: Pt; ROCK: Pt;
  DIG_SPOTS: readonly Pt[]; LAWN_SPOTS: readonly Pt[]; HEDGE_Z: number; HEDGE_XS: readonly number[]; BEACH_BOX: Box4; SEA_BOX: Box4;
  CENTRE_STAGE: Pt; ARCH: Pt; CAKE: Pt; SCENERY: readonly Scenery[]; DECOR_SLOTS: readonly DecorSlot[]; SEATS: Readonly<Record<string, Pt>>;
  PULLUP_AT: Pt; FLOWERS: readonly Flower[]; PONDS: readonly Oval[];
  inRiver(x: number, z: number): boolean; freshWhere(x: number, z: number): FreshWhere; onLand(x: number, z: number): boolean;
  onGrass(x: number, z: number): boolean; surfaceAt(x: number, z: number): Surface;
  /** The layout's walk grid (layout/nav.ts navOf): the walk's, in place of nav.ts's and walkGraph.ts's. */
  nav: LayoutNav;
}
type Values = Omit<WorldGeo, 'inRiver' | 'freshWhere' | 'onLand' | 'onGrass' | 'surfaceAt' | 'nav'>;
const snapshot = (): Values => ({
  LAND, SHORE_Z, GRASS, CAMS, RIVER, RIVER_BEND, BRIDGE, SPRING, POND, CLIFF, BUILDINGS, HOMES, GOAL_TREES, TAPE_DECK, ROCK, DIG_SPOTS,
  LAWN_SPOTS, HEDGE_Z, HEDGE_XS, BEACH_BOX, SEA_BOX, CENTRE_STAGE, ARCH, CAKE, SCENERY, DECOR_SLOTS, SEATS, PULLUP_AT, FLOWERS, PONDS
});
/** @public (the layout's derivation reads the old island's looks and sizes by id) world.ts's own island, as above. */
export const WORLD_2D: Readonly<Values> = snapshot();
let geo: WorldGeo | null = null;
let gen = 0;

/** The island's geometry from now on: the layout's (worldOf), or null for world.ts's own (the old fixed island). Every value
 *  above is reassigned (an import reads the new one: a live binding); a cache of one keys on worldGen(). */
export function setWorld(g: WorldGeo | null): void {
  if (g === geo) return;
  geo = g;
  const v: Values = g ?? WORLD_2D;
  ({ LAND, SHORE_Z, GRASS, CAMS, RIVER, RIVER_BEND, BRIDGE, SPRING, POND, CLIFF, BUILDINGS, HOMES, GOAL_TREES, TAPE_DECK, ROCK, DIG_SPOTS,
    LAWN_SPOTS, HEDGE_Z, HEDGE_XS, BEACH_BOX, SEA_BOX, CENTRE_STAGE, ARCH, CAKE, SCENERY, DECOR_SLOTS, SEATS, PULLUP_AT, FLOWERS, PONDS } = v);
  CAMPSITE = BUILDINGS.find((b) => b.id === 'campsite') ?? BUILDINGS[0];
  gen++;
}
/** The geometry's generation (bumped by each setWorld): a cache keyed on it is fresh. */
export const worldGen = (): number => gen;
/** Whether the island reads the layout now. */
export const onLayout = (): boolean => geo !== null;
/** The layout's walk grid while the island reads it, else null. */
export const layoutNav = (): LayoutNav | null => geo?.nav ?? null;
/** Whether a thing `r` u round (x, z) would lie on a building's ground (layout/clear.ts onBuilding: its footprint, its
 *  door's step, the strip behind it its model hides); never on world.ts's own island. */
export const onBuildingAt = (x: number, z: number, r?: number): boolean => {
  const g = layoutNav();
  return !!g && onBuilding(g, x, z, r);
};
/** Where a thing meant for (x, z) lies: there, or off the buildings at the nearest free spot (layout/clear.ts
 *  offBuildings), the same on every phone holding the layout. */
export const offBuildingsAt = (x: number, z: number, r?: number): [number, number] => {
  const g = layoutNav();
  return g ? offBuildings(g, x, z, r) : [x, z];
};
