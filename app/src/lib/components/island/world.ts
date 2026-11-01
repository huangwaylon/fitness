// The rolling-log island's world (docs/design.md "World"): one flat plan bent over a log by roll.ts. World units
// (1u = 1 CSS px at 390 wide at the pivot): x across (0…390 is the screen at the pivot, centre 195), z into the island
// (bigger = further back; the front shoreline is SHORE_Z, a wide beach in front of the health lawn). Two sections: まえ
// (the sea, the beach, the health lawn) and おく (the campsite's clearing, the pond, the bamboo, the falls). Everything
// here is pure data: the terrain bake (scripts/terrain.ts), the scene's sprites, the walk graph and the critters all
// read the same constants.

export type Pt = readonly [number, number];

/** The plan's extent (the baked terrain covers it; wider than the land so the perspective never shows an edge). */
export const PLAN = { x0: -230, x1: 620, z0: -460, z1: 1700 } as const;
/** The ground is cut into bands of BAND_D (40 of them). */
export const BANDS = 40;
export const BAND_D = (PLAN.z1 - PLAN.z0) / BANDS;

/** The island (land incl. beaches): a rounded rectangle with a 130u corner radius and a ±4u wobble. */
export const LAND = { x0: -40, x1: 430, z0: -30, z1: 1260, r: 130 } as const;
/** The front shoreline (the sea's edge in front of the beach). */
export const SHORE_Z = LAND.z0;
/** The front beach (SHORE_Z … BEACH_FRONT, 140u: fishing and diving from it at まえ) is deeper than the side and back
 *  beaches. */
const BEACH_FRONT = 110;
const BEACH_SIDE = 30;
/** The grass (tier 1 and tier 2 as one area; the cliff crosses it). */
export const GRASS = { x0: LAND.x0 + BEACH_SIDE, x1: LAND.x1 - BEACH_SIDE, z0: BEACH_FRONT, z1: LAND.z1 - BEACH_SIDE, r: 90 } as const;

/** The camera's two stops (camZ: the world z at the pivot line), front to back: まえ (home, the scroller's bottom: a
 *  wide band of sea, the beach, the health lawn; sections.ts fits it to the screen) and おく (the scroller's top: the campsite's clearing clear below
 *  the HUD, the pond, the bamboo grove and the falls; sections.ts raises it on a screen whose HUD would cover the
 *  campsite). */
export const CAMS = { mae: 30, oku: 642 } as const;
export const CAM_MIN = CAMS.mae;
export const CAM_MAX = CAMS.oku;
/** The pivot line's share of the height, and the horizon's (the sky above it). */
export const PIVOT = 0.72;
export const SKY = 0.21;
export const TILT = 64;

/** The live window (spec §7): only sprites in [camZ − BEHIND, camZ + AHEAD] are displayed. */
export const BEHIND = 600;
export const AHEAD = 900;

// ---- water ----------------------------------------------------------------------------------------------------------

/** The stream's centreline [x, z, width]: the spring on the upper tier, the falls over the cliff, a short meander down
 *  the east side and out through the east beach (the mouth, widening into the sea). */
export const RIVER: readonly (readonly [number, number, number])[] = [
  [364, 1146, 20], [368, 1108, 24], [372, 1082, 32], [372, 1040, 36],
  // the reach below the falls meanders gently, its width breathing (NH's rivers are never ruler-straight)
  [377, 990, 30], [366, 930, 33], [378, 870, 29], [367, 812, 32], [376, 768, 31],
  [394, 736, 36], [420, 714, 48], [448, 700, 66], [490, 690, 88], [540, 684, 100]
];
/** The spring on the upper tier the stream rises from. */
export const SPRING = { x: 364, z: 1152, rx: 28, rz: 16 } as const;
/** The pond (an oval of water), with lily pads: west of the path to the campsite. */
export const POND = { x: 74, z: 772, rx: 46, rz: 26 } as const;

/** Where a freshwater cast lands, NH's locations (spec Q3): the pond, the river, its mouth, or the clifftop. */
export type FreshWhere = 'pond' | 'river' | 'mouth' | 'clifftop';

// ---- the cliff ------------------------------------------------------------------------------------------------------

/** The cliff to tier 2, behind the campsite: its face from z0 (foot) to z1 (top edge) across x0…x1; stone stairs and
 *  the falls cut it. */
export const CLIFF = { z0: 1040, z1: 1080, x0: -12, x1: 402, stair: [36, 84] as Pt, fall: [351, 393] as Pt } as const;
/** The cliff's upright face (a sprite at its foot) and the waterfall's height over it, in u. */
export const FACE_H = 40;
export const FALL_H = 45;
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
export type BuildingId = 'campsite';
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
}
export const BUILDINGS: readonly Building[] = [{ id: 'campsite', key: 'deco/campsite', x: 196, z: 984, h: 80, depth: 40 }];
/** The campsite. */
export const CAMPSITE = BUILDINGS[0];

// ---- まえ: the health lawn ------------------------------------------------------------------------------------------

/** The villagers' home spots: A (ウェイ) on the left and B (うめ) on the right, on both phones. */
export const HOMES = { A: [132, 214] as Pt, B: [262, 214] as Pt } as const;
/** Goal trees (hardwood, 120u), each beside its person's villager, on the outer side (their fruit, glints and popup
 *  are the day's goals). */
export const GOAL_TREES = { A: [60, 216] as Pt, B: [332, 216] as Pt } as const;
export const TREE_H = 120;
/** The tape deck, between the villagers. */
export const TAPE_DECK: Pt = [195, 306];
/** The rock. */
export const ROCK: Pt = [112, 478];
/** Fossil dig spots: six lawn spots, four on the front lawn in clear view from まえ (in front of the villagers and the
 *  trees, by the beach) and two behind the trees, off the canopies' columns (on a short screen the HUD stands over
 *  those). */
export const DIG_SPOTS: readonly Pt[] = [[150, 162], [244, 164], [66, 150], [326, 152], [140, 440], [236, 462]];
/** Lawn spots for weeds (z 120…900, off paths, flowers, trunks and water). */
export const LAWN_SPOTS: readonly Pt[] = [
  [96, 150], [300, 150], [20, 280], [372, 280], [120, 400], [270, 380], [40, 430], [350, 420], [230, 500], [150, 520],
  [300, 520], [140, 680], [262, 664], [128, 852], [232, 828]
];
/** The seasonal hedge between the lawn and the campsite's ground, with a gap for the path (its streetlamps). */
export const HEDGE_Z = 600;
export const HEDGE_XS: readonly number[] = [36, 80, 124, 266, 310];
/** Beach finds lie at z 10…90 on x 120…300. */
export const BEACH_BOX = { x0: 120, x1: 300, z0: -18, z1: 90 } as const;
/** The sea's fishing water (in front of the shoreline, at the front of まえ). */
export const SEA_BOX = { x0: 40, x1: 290, z0: -100, z1: -48 } as const;

// ---- おく: the campsite's clearing ------------------------------------------------------------------------------------

/** Centre stage: the clearing in front of the campsite's tent, where visitors stand. */
export const CENTRE_STAGE: Pt = [196, 898];
/** The wedding arch frames Reese and Cyrus, just behind them; the birthday cake stands in front of centre stage. */
export const ARCH: Pt = [196, 922];
export const CAKE: Pt = [196, 852];

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
}
const s = (id: string, kind: SceneryKind, key: string, x: number, z: number, h: number, flip = false): Scenery => ({ id, kind, key, x, z, h, flip });
export const SCENERY: readonly Scenery[] = [
  // まえ, kept clear (the health lawn, its trees, open lawn and the path; the sea wide in front): the island's
  // two palms, at the front beach's outer edges by the water (clear of the lawn, the finds and the sea view),
  // plumeria at the grass edge, an oak and a cedar behind the lawn
  s('palm-1', 'palm', 'trees/palm', 26, 40, 116), s('palm-3', 'palm', 'trees/palm', 366, 46, 110, true),
  s('plumeria-w', 'bush', 'bushes/white-plumeria', 100, 122, 34), s('plumeria-p', 'bush', 'bushes/pink-plumeria', 292, 122, 34),
  s('oak-m1', 'oak', 'oak', 268, 516, 112), s('cedar-m1', 'cedar', 'trees/cedar', 20, 470, 140),
  // おく, uncluttered (open lawn between the pieces), NH's decor (scripts/fetch-assets.ts): streetlamps at the hedge's gap, the month's bushes either side of
  // the path (`month-bush-a|b`: scene.ts hedgePair), the pond on the west with a flat rock and a clump by it, the bamboo
  // grove on the east by the stream, an oak and cedars at the edges, the campsite's tent in its clearing with its sign,
  // garden lanterns either side of the clearing and white ones at the stairs' foot, a rock at the cliff's foot
  s('lamp-b1', 'prop', 'deco/streetlamp', 166, 606, 46), s('lamp-b2', 'prop', 'deco/streetlamp', 226, 606, 46),
  s('bush-m1', 'bush', 'month-bush-a', 152, 716, 34), s('bush-m2', 'bush', 'month-bush-b', 240, 724, 34),
  s('rock-m1', 'rock', 'deco/flat-rock', 148, 818, 12),
  s('bamboo-1', 'bamboo', 'trees/bamboo', 290, 804, 66), s('bamboo-2', 'bamboo', 'trees/bamboo', 322, 794, 72, true),
  s('bamboo-3', 'bamboo', 'trees/bamboo', 306, 824, 70, true),
  s('cedar-k1', 'cedar', 'trees/cedar', 16, 642, 140),
  s('oak-k1', 'oak', 'oak', 36, 904, 116), s('cedar-k2', 'cedar', 'trees/cedar', -2, 1000, 144),
  s('camp-sign', 'prop', 'deco/campsite-sign', 92, 930, 30),
  s('bush-k1', 'bush', 'bushes/holly', 114, 1000, 32), s('bush-k2', 'bush', 'bushes/holly', 282, 1000, 32),
  s('lantern-1', 'prop', 'deco/garden-lantern', 140, 896, 24), s('lantern-2', 'prop', 'deco/garden-lantern', 254, 900, 24),
  s('lantern-3', 'prop', 'deco/garden-lantern-white', 24, 1022, 24), s('lantern-4', 'prop', 'deco/garden-lantern-white', 98, 1022, 24),
  s('rock-t1', 'rock', 'deco/garden-rock', 316, 1022, 20),
  // the forest on the upper tier behind the cliff (short enough that its tops stay under the HUD)
  s('cedar-f1', 'cedar', 'trees/cedar', -6, 1110, 126), s('cedar-f2', 'cedar', 'trees/cedar', 64, 1160, 130), s('cedar-f3', 'cedar', 'trees/cedar', 140, 1104, 122),
  s('cedar-f4', 'cedar', 'trees/cedar', 214, 1170, 130), s('cedar-f5', 'cedar', 'trees/cedar', 284, 1112, 126), s('cedar-f6', 'cedar', 'trees/cedar', 130, 1200, 124)
];

// ---- wild flowers ---------------------------------------------------------------------------------------------------

/** NH's flowers growing wild over the lawn: clumps of 2–5 of one kind (scene.ts WILD: the season's), on open grass off
 *  the paths and the sand, few on the front lawn, a few more round the campsite's ground. [centre x, z, how many]. */
const CLUMPS: readonly (readonly [number, number, number])[] = [
  // まえ: four small clumps, clear of the trees' canopies and the villagers
  [165, 390, 2], [250, 420, 2], [62, 530, 3], [356, 480, 3],
  // おく: the pond's west bank, the bamboo's lawn, by the path, the clearing's west side, the stream's bank
  [10, 724, 4], [236, 772, 2], [266, 866, 5], [96, 868, 2], [324, 952, 4]
];
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
export const FLOWERS: readonly Flower[] = CLUMPS.flatMap(([cx, cz, n], clump) =>
  CLUMP_AT[n].map(([dx, dz], k) => {
    const h = ((cx * 73 + cz * 151 + k * 197) >>> 0) % 25;
    const x = Math.round(cx + dx + (h % 5) - 2), z = Math.round(cz + dz + Math.floor(h / 5) - 2);
    return { id: `fl:${x}:${z}`, x, z, clump };
  })
);
/** A flower by its id. */
export const flowerById = (id: string): Flower | undefined => FLOWERS.find((f) => f.id === id);

// ---- geometry helpers -----------------------------------------------------------------------------------------------

/** The stream's half-width and centre x at z along its north–south reach, or null off it (z ≥ 768, before it turns to
 *  the mouth). */
export function riverNS(z: number): { x: number; hw: number } | null {
  for (let i = 0; i < RIVER.length - 1 && RIVER[i][1] > 768; i++) {
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
  const r = riverNear(x, z);
  return r.d <= r.hw;
}

/** Whether (x, z) is in an ellipse's water. */
export const inOval = (o: { x: number; z: number; rx: number; rz: number }, x: number, z: number, grow = 0): boolean =>
  ((x - o.x) / (o.rx + grow)) ** 2 + ((z - o.z) / (o.rz + grow)) ** 2 <= 1;

/** NH's freshwater location of a cast at (x, z): the pond, the clifftop (above the cliff, or the falls' pool at its
 *  foot: the upper tier is beyond the horizon), the river mouth (the wide reach on the east beach) or the river. */
export function freshWhere(x: number, z: number): FreshWhere {
  if (inOval(POND, x, z, 12)) return 'pond';
  if (z > CLIFF.z0 - FALLS_POOL) return 'clifftop';
  if (x > 396 && z < 770) return 'mouth';
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
export const onLand = (x: number, z: number): boolean => roundRectDist(LAND, x, z) <= 0;
/** Whether (x, z) is on the grass (not the beach). */
export const onGrass = (x: number, z: number): boolean => roundRectDist(GRASS, x, z) <= 0;

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
  if (!onLand(x, z)) return 'sea';
  if (inRiver(x, z) || inOval(POND, x, z) || inOval(SPRING, x, z)) return 'water';
  if (x >= CLIFF.stair[0] && x <= CLIFF.stair[1] && z >= CLIFF.z0 - 4 && z <= CLIFF.z1 + 4) return 'stone';
  if (!onGrass(x, z)) return 'sand';
  for (const p of PATHS.dirt) if (polyDist(p, x, z) <= PATH_W / 2) return 'dirt';
  return 'grass';
}
