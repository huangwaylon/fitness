// The rolling-log island's world (docs/design.md "World"): one flat plan bent over a log by roll.ts. World units
// (1u = 1 CSS px at 390 wide at the pivot): x across (0…390 is the screen at the pivot, centre 195), z into the island
// (0 = the front shoreline, bigger = further back). Everything here is pure data: the terrain bake
// (scripts/terrain.ts), the scene's sprites, the walk graph and the critters all read the same constants.

export type Pt = readonly [number, number];

/** The plan's extent (the baked terrain covers it; wider than the land so the perspective never shows an edge). */
export const PLAN = { x0: -230, x1: 620, z0: -400, z1: 2500 } as const;
/** The ground is cut into bands of BAND_D (40 of them). */
export const BANDS = 40;
export const BAND_D = (PLAN.z1 - PLAN.z0) / BANDS;

/** The island (land incl. beaches): a rounded rectangle with a 130u corner radius and a ±4u wobble. */
export const LAND = { x0: -40, x1: 430, z0: 0, z1: 2160, r: 130 } as const;
/** The front beach is deeper than the side and back beaches. */
const BEACH_FRONT = 110;
const BEACH_SIDE = 30;
/** The grass (tier 1 and tier 2 as one area; the cliff crosses it). */
export const GRASS = { x0: LAND.x0 + BEACH_SIDE, x1: LAND.x1 - BEACH_SIDE, z0: BEACH_FRONT, z1: LAND.z1 - BEACH_SIDE, r: 90 } as const;

/** The camera's stops (camZ: the world z at the pivot line). まえ (home) is the scroller's bottom. */
export const CAMS = { mae: 150, hiroba: 860, oku: 1380 } as const;
export const CAM_MIN = CAMS.mae;
export const CAM_MAX = CAMS.oku;
/** The pivot line's share of the height, and the horizon's (the sky above it). */
export const PIVOT = 0.72;
export const SKY = 0.16;
export const TILT = 64;

/** The live window (spec §7): only sprites in [camZ − BEHIND, camZ + AHEAD] are displayed. */
export const BEHIND = 260;
export const AHEAD = 900;

// ---- water ----------------------------------------------------------------------------------------------------------

/** The river's centreline [x, z, width]: the spring on the upper tier, the waterfall, down the east side, west across
 *  the island between the health lawn and the plaza, out through the west beach (the mouth, widening into the sea). */
export const RIVER: readonly (readonly [number, number, number])[] = [
  [372, 2000, 22], [372, 1900, 26], [372, 1850, 28], [372, 1806, 30], [374, 1500, 30], [370, 1200, 30], [372, 900, 30], [366, 720, 30],
  [330, 650, 30], [260, 636, 30], [195, 640, 30], [120, 648, 30], [50, 640, 32], [-10, 628, 38], [-44, 620, 52], [-80, 614, 76], [-130, 608, 96]
];
/** The spring on the upper tier the river rises from. */
export const SPRING = { x: 372, z: 2010, rx: 30, rz: 18 } as const;
/** The pond (an oval of water), with lily pads. */
export const POND = { x: 44, z: 772, rx: 40, rz: 22 } as const;

/** Where a freshwater cast lands, NH's locations (spec Q3): the pond, the river, its mouth, or the clifftop (tier 2). */
export type FreshWhere = 'pond' | 'river' | 'mouth' | 'clifftop';

// ---- the cliff, bridges, stairs -------------------------------------------------------------------------------------

/** The cliff to tier 2: its face from z0 (foot) to z1 (top edge) across x0…x1; stone stairs and the waterfall cut it. */
export const CLIFF = { z0: 1806, z1: 1850, x0: -12, x1: 402, stair: [36, 84] as Pt, fall: [356, 388] as Pt } as const;
export const BRIDGES = [
  { id: 'stone', kind: 'stone', x: 195, z0: 618, z1: 664, w: 44 },
  { id: 'log', kind: 'log', x: 296, z0: 622, z1: 660, w: 34 }
] as const;

// ---- paths and the plaza --------------------------------------------------------------------------------------------

/** The plaza: an ellipse paved in light stone; centre stage is its middle. */
export const PLAZA = { x: 195, z: 900, rx: 140, rz: 104 } as const;
/** Paths (24u wide, about half an NH tile): dirt on the front, brick around the shops. Polylines [x, z]. */
const PATH_W = 24;
export const PATHS: { dirt: readonly (readonly Pt[])[]; brick: readonly (readonly Pt[])[] } = {
  dirt: [
    [[195, 100], [195, 300], [195, 618]],
    [[195, 664], [195, 800]],
    [[130, 232], [160, 250], [195, 262]], [[262, 232], [230, 250], [195, 262]],
    [[296, 660], [300, 760], [270, 820]]
  ],
  brick: [
    [[195, 1000], [195, 1180], [150, 1250], [100, 1290]], [[195, 1180], [240, 1250], [280, 1290]],
    [[195, 1180], [192, 1450], [190, 1600]], [[192, 1450], [100, 1560], [60, 1700], [60, 1800]],
    [[60, 1856], [80, 1900], [140, 1925]]
  ]
};

// ---- buildings ------------------------------------------------------------------------------------------------------

export type BuildingId = 'rs' | 'cranny' | 'able' | 'museum' | 'airport' | 'campsite';
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
export const BUILDINGS: readonly Building[] = [
  { id: 'airport', key: 'deco/airport', x: 362, z: 22, h: 96, depth: 40 },
  { id: 'rs', key: 'deco/resident-services', x: 195, z: 1068, h: 118, depth: 46 },
  { id: 'cranny', key: 'deco/nooks-cranny', x: 100, z: 1338, h: 100, depth: 46 },
  { id: 'able', key: 'deco/able-sisters', x: 282, z: 1338, h: 94, depth: 46 },
  { id: 'museum', key: 'deco/museum-icon', x: 190, z: 1648, h: 104, depth: 46 },
  { id: 'campsite', key: 'deco/campsite', x: 150, z: 1960, h: 70, depth: 40 }
];
/** The airport's wooden dock over the sea (Wilbur stands on it while the partner's app is open). */
export const DOCK = { x0: 300, x1: 420, z0: -48, z1: 10 } as const;

// ---- まえ: the health lawn ------------------------------------------------------------------------------------------

/** The villagers' home spots: A (mine, left) and B (the partner's, right). */
export const HOMES = { A: [132, 214] as Pt, B: [262, 214] as Pt } as const;
/** Goal flower beds (2 × 2, 40u pitch) beside each villager: A at x 40/80, B at 312/352; rows z 196 (back) / 236. */
export const BED_XS = { A: [40, 80], B: [312, 352] } as const;
/** Row z of the bed's back and front rows (BED_FRUIT's rows, back first). */
export const BED_ZS = [236, 196] as const;
/** Goal trees (hardwood, 120u). */
export const GOAL_TREES = { A: [62, 332] as Pt, B: [330, 332] as Pt } as const;
export const TREE_H = 120;
/** The tape deck, between the villagers. */
export const TAPE_DECK: Pt = [195, 306];
/** The rock. */
export const ROCK: Pt = [112, 478];
/** Fossil dig spots: six lawn spots, four on the front lawn in clear view from まえ (in front of the villagers and the
 *  beds, by the beach) and two behind the trees, off the canopies' columns (on a short screen the HUD stands over
 *  those). */
export const DIG_SPOTS: readonly Pt[] = [[150, 162], [244, 164], [66, 150], [326, 152], [140, 440], [236, 462]];
/** Lawn spots for weeds (z 120…1200, off paths, beds, trunks and water). */
export const LAWN_SPOTS: readonly Pt[] = [
  [96, 150], [300, 150], [20, 280], [372, 280], [120, 400], [270, 380], [40, 430], [350, 420], [230, 500], [150, 520],
  [300, 520], [90, 700], [140, 760], [260, 740], [320, 780], [110, 1120], [290, 1130]
];
/** The seasonal hedge along the river's front bank, with gaps at the two bridges. */
export const HEDGE_Z = 596;
export const HEDGE_XS: readonly number[] = [36, 80, 124, 250, 340];
/** Beach finds lie at z 10…90 on x 120…300. */
export const BEACH_BOX = { x0: 120, x1: 300, z0: 10, z1: 90 } as const;
/** The sea's fishing water (in front of the shoreline, at the front of まえ). */
export const SEA_BOX = { x0: 40, x1: 290, z0: -150, z1: -30 } as const;

// ---- ひろば: the plaza ------------------------------------------------------------------------------------------------

/** Centre stage: the plaza's middle, where visitors stand. */
export const CENTRE_STAGE: Pt = [PLAZA.x, PLAZA.z];
export const ARCH: Pt = [195, 960];
export const CAKE: Pt = [195, 860];

// ---- the scenery (still sprites: trees, bushes, props) ----------------------------------------------------------------

type SceneryKind = 'oak' | 'cedar' | 'palm' | 'bush' | 'prop' | 'fence';
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
  // まえ: palms on the sand, plumeria at the grass edge, an oak and a cedar behind the lawn
  s('palm-1', 'palm', 'trees/palm', 6, 64, 124), s('palm-2', 'palm', 'trees/palm', 54, 98, 98, true), s('palm-3', 'palm', 'trees/palm', 388, 108, 112),
  s('plumeria-w', 'bush', 'bushes/white-plumeria', 100, 122, 34), s('plumeria-p', 'bush', 'bushes/pink-plumeria', 292, 122, 34),
  s('oak-m1', 'oak', 'oak', 250, 520, 112), s('cedar-m1', 'cedar', 'trees/cedar', 20, 470, 140),
  // ひろば
  s('lamp-1', 'prop', 'deco/banner-lamp', 72, 820, 52), s('lamp-2', 'prop', 'deco/banner-lamp', 318, 820, 52),
  s('lamp-3', 'prop', 'deco/banner-lamp', 72, 990, 52), s('lamp-4', 'prop', 'deco/banner-lamp', 318, 990, 52),
  s('bench', 'prop', 'deco/plaza-bench', 300, 905, 26), s('board', 'prop', 'deco/bulletin-board', 98, 1062, 34),
  s('oak-p1', 'oak', 'oak', 26, 1010, 116), s('oak-p2', 'oak', 'oak', 30, 1160, 120), s('oak-p3', 'oak', 'oak', 330, 1170, 116),
  s('bush-p1', 'bush', 'bushes/pink-azalea', 110, 1110, 34), s('bush-p2', 'bush', 'bushes/pink-azalea', 280, 1110, 34),
  s('cedar-p1', 'cedar', 'trees/cedar', 414, 960, 140), s('cedar-p2', 'cedar', 'trees/cedar', 416, 1240, 150), s('cedar-p3', 'cedar', 'trees/cedar', 412, 700, 130),
  // おく
  s('sign-shop', 'prop', 'deco/signpost', 196, 1236, 32),
  s('oak-k1', 'oak', 'oak', 56, 1636, 118), s('oak-k2', 'oak', 'oak', 326, 1640, 118),
  s('bush-k1', 'bush', 'bushes/holly', 120, 1675, 32), s('bush-k2', 'bush', 'bushes/holly', 262, 1675, 32),
  s('lamp-k1', 'prop', 'deco/streetlamp', 140, 1600, 46), s('lamp-k2', 'prop', 'deco/streetlamp', 242, 1600, 46),
  s('cedar-k1', 'cedar', 'trees/cedar', 412, 1520, 150), s('cedar-k2', 'cedar', 'trees/cedar', 20, 1440, 140),
  // the official log fence along the cliff top, one segment touching the next
  ...Array.from({ length: 9 }, (_, i) => s(`fence-${i}`, 'fence', 'deco/log-fence', 100 + i * 25, 1862, 24)),
  s('camp-sign', 'prop', 'deco/campsite-sign', 82, 1930, 30),
  s('cedar-t1', 'cedar', 'trees/cedar', 30, 2040, 150), s('cedar-t2', 'cedar', 'trees/cedar', 250, 2030, 150),
  s('cedar-t3', 'cedar', 'trees/cedar', 310, 1950, 140), s('cedar-t4', 'cedar', 'trees/cedar', 196, 2100, 140),
  s('palm-4', 'palm', 'trees/palm', 340, 2130, 120)
];

// ---- geometry helpers -----------------------------------------------------------------------------------------------

/** The river's half-width and centre x at z along its north–south reach, or null off it (the east run, z ≥ 720). */
export function riverNS(z: number): { x: number; hw: number } | null {
  for (let i = 0; i < 7; i++) {
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

/** NH's freshwater location of a cast at (x, z): the pond, the river mouth (the wide reach on the west beach), the
 *  clifftop (above the cliff) or the river. */
export function freshWhere(x: number, z: number): FreshWhere {
  if (inOval(POND, x, z, 12)) return 'pond';
  if (z > CLIFF.z1) return 'clifftop';
  if (x < 20 && z < 700) return 'mouth';
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

export type Surface = 'sea' | 'sand' | 'grass' | 'dirt' | 'brick' | 'stone' | 'wood' | 'water';
/** What the ground is at (x, z): footsteps and taps pick their sound and flourish from it. */
export function surfaceAt(x: number, z: number): Surface {
  for (const b of BRIDGES) if (Math.abs(x - b.x) <= b.w / 2 && z >= b.z0 && z <= b.z1) return b.kind === 'log' ? 'wood' : 'stone';
  if (x >= DOCK.x0 && x <= DOCK.x1 && z >= DOCK.z0 && z <= DOCK.z1) return 'wood';
  if (!onLand(x, z)) return 'sea';
  if (inRiver(x, z) || inOval(POND, x, z) || inOval(SPRING, x, z)) return 'water';
  if (x >= CLIFF.stair[0] && x <= CLIFF.stair[1] && z >= CLIFF.z0 - 4 && z <= CLIFF.z1 + 4) return 'stone';
  if (!onGrass(x, z)) return 'sand';
  if (inOval({ ...PLAZA, rx: PLAZA.rx, rz: PLAZA.rz }, x, z)) return 'stone';
  for (const p of PATHS.brick) if (polyDist(p, x, z) <= PATH_W / 2) return 'brick';
  for (const p of PATHS.dirt) if (polyDist(p, x, z) <= PATH_W / 2) return 'dirt';
  return 'grass';
}
