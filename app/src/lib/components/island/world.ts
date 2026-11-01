// The rolling-log island's world (docs/design.md "World"): one flat plan bent over a log by roll.ts. World units
// (1u = 1 CSS px at 390 wide at the pivot): x across (0…390 is the screen at the pivot, centre 195), z into the island
// (bigger = further back; the front shoreline is SHORE_Z, a wide beach in front of the health lawn). Everything here is pure data: the terrain bake
// (scripts/terrain.ts), the scene's sprites, the walk graph and the critters all read the same constants.

export type Pt = readonly [number, number];

/** The plan's extent (the baked terrain covers it; wider than the land so the perspective never shows an edge). */
export const PLAN = { x0: -230, x1: 620, z0: -460, z1: 2650 } as const;
/** The ground is cut into bands of BAND_D (40 of them). */
export const BANDS = 40;
export const BAND_D = (PLAN.z1 - PLAN.z0) / BANDS;

/** The island (land incl. beaches): a rounded rectangle with a 130u corner radius and a ±4u wobble. */
export const LAND = { x0: -40, x1: 430, z0: -30, z1: 2250, r: 130 } as const;
/** The front shoreline (the sea's edge in front of the beach). */
export const SHORE_Z = LAND.z0;
/** The front beach (SHORE_Z … BEACH_FRONT, 140u: fishing and diving from it at はま) is deeper than the side and back
 *  beaches. */
const BEACH_FRONT = 110;
const BEACH_SIDE = 30;
/** The grass (tier 1 and tier 2 as one area; the cliff crosses it). */
export const GRASS = { x0: LAND.x0 + BEACH_SIDE, x1: LAND.x1 - BEACH_SIDE, z0: BEACH_FRONT, z1: LAND.z1 - BEACH_SIDE, r: 90 } as const;

/** The camera's three stops (camZ: the world z at the pivot line), front to back: まえ (home, the scroller's bottom:
 *  the sea and the wide beach in front, the health lawn), ひろば (the plaza, Resident Services, the pond, the river),
 *  おく (the scroller's top: the shops, the museum, the cliff and the campsite clear below the HUD, the forest behind). */
export const CAMS = { mae: 114, hiroba: 860, oku: 1440 } as const;
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
  [372, 1870, 22], [372, 1770, 26], [372, 1720, 34], [372, 1676, 36],
  // the east reach meanders gently, its width breathing (NH's rivers are never ruler-straight)
  [378, 1590, 30], [366, 1480, 34], [378, 1370, 29], [362, 1250, 35], [376, 1130, 28], [364, 1010, 34], [377, 890, 29],
  [366, 720, 30],
  [330, 650, 30], [260, 636, 30], [195, 640, 30], [120, 648, 30], [50, 640, 32], [-10, 628, 38], [-44, 620, 52], [-80, 614, 76], [-130, 608, 96]
];
/** The spring on the upper tier the river rises from. */
export const SPRING = { x: 372, z: 1880, rx: 30, rz: 18 } as const;
/** The pond (an oval of water), with lily pads. */
export const POND = { x: 44, z: 772, rx: 40, rz: 22 } as const;

/** Where a freshwater cast lands, NH's locations (spec Q3): the pond, the river, its mouth, or the clifftop (tier 2). */
export type FreshWhere = 'pond' | 'river' | 'mouth' | 'clifftop';

// ---- the cliff, bridges, stairs -------------------------------------------------------------------------------------

/** The cliff to tier 2: its face from z0 (foot) to z1 (top edge) across x0…x1; stone stairs and the waterfall cut it. */
export const CLIFF = { z0: 1676, z1: 1720, x0: -12, x1: 402, stair: [36, 84] as Pt, fall: [351, 393] as Pt } as const;
/** The cliff's upright face (a sprite at its foot) and the waterfall's height over it, in u. */
export const FACE_H = 40;
export const FALL_H = 45;
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
    [[193, 96], [199, 170], [190, 250], [198, 340], [191, 450], [197, 540], [195, 618]],
    [[195, 664], [190, 720], [197, 800]],
    [[132, 236], [150, 252], [172, 257], [193, 266]], [[262, 236], [245, 250], [221, 255], [197, 262]],
    [[296, 660], [304, 710], [296, 770], [272, 822]]
  ],
  brick: [
    [[195, 1000], [192, 1090], [197, 1170], [176, 1214], [146, 1252], [104, 1290]], [[197, 1172], [222, 1218], [250, 1258], [278, 1292]],
    [[197, 1170], [193, 1260], [199, 1360], [191, 1440], [190, 1470]], [[191, 1432], [150, 1452], [108, 1488], [74, 1540], [62, 1600], [60, 1670]],
    [[60, 1726], [70, 1760], [96, 1786], [138, 1798]]
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
  { id: 'airport', key: 'deco/airport', x: 362, z: -8, h: 96, depth: 40 },
  { id: 'rs', key: 'deco/resident-services', x: 195, z: 1068, h: 118, depth: 46 },
  { id: 'cranny', key: 'deco/nooks-cranny', x: 100, z: 1338, h: 100, depth: 46 },
  { id: 'able', key: 'deco/able-sisters', x: 282, z: 1338, h: 94, depth: 46 },
  { id: 'museum', key: 'deco/museum-icon', x: 190, z: 1518, h: 104, depth: 46 },
  { id: 'campsite', key: 'deco/campsite', x: 150, z: 1830, h: 70, depth: 40 }
];
/** The airport's wooden dock over the sea (Wilbur stands on it while the partner's app is open). */
export const DOCK = { x0: 300, x1: 420, z0: -78, z1: -20 } as const;

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
export const BEACH_BOX = { x0: 120, x1: 300, z0: -18, z1: 90 } as const;
/** The sea's fishing water (in front of the shoreline, at the front of まえ). */
export const SEA_BOX = { x0: 40, x1: 290, z0: -100, z1: -48 } as const;

// ---- ひろば: the plaza ------------------------------------------------------------------------------------------------

/** Centre stage: the plaza's middle, where visitors stand. */
export const CENTRE_STAGE: Pt = [PLAZA.x, PLAZA.z];
export const ARCH: Pt = [195, 960];
export const CAKE: Pt = [195, 860];

// ---- the scenery (still sprites: trees, bushes, props) ----------------------------------------------------------------

type SceneryKind = 'oak' | 'cedar' | 'palm' | 'bamboo' | 'bush' | 'rock' | 'prop' | 'fence';
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
  s('oak-k1', 'oak', 'oak', 56, 1506, 118), s('oak-k2', 'oak', 'oak', 326, 1510, 118),
  s('bush-k1', 'bush', 'bushes/holly', 120, 1545, 32), s('bush-k2', 'bush', 'bushes/holly', 262, 1545, 32),
  s('lamp-k1', 'prop', 'deco/streetlamp', 140, 1470, 46), s('lamp-k2', 'prop', 'deco/streetlamp', 242, 1470, 46),
  s('cedar-k1', 'cedar', 'trees/cedar', 412, 1520, 150), s('cedar-k2', 'cedar', 'trees/cedar', 20, 1440, 140),
  // the official log fence along the cliff top, one segment touching the next
  ...Array.from({ length: 9 }, (_, i) => s(`fence-${i}`, 'fence', 'deco/log-fence', 100 + i * 25, 1732, 24)),
  s('camp-sign', 'prop', 'deco/campsite-sign', 82, 1800, 30),
  s('cedar-t1', 'cedar', 'trees/cedar', 30, 1910, 150), s('cedar-t2', 'cedar', 'trees/cedar', 250, 1900, 150),
  s('cedar-t3', 'cedar', 'trees/cedar', 310, 1820, 140), s('cedar-t4', 'cedar', 'trees/cedar', 196, 1970, 140),
  s('palm-4', 'palm', 'trees/palm', 340, 2000, 120),
  // the forest behind the campsite: cedars along the upper tier's back, palms on the back beach
  s('cedar-f1', 'cedar', 'trees/cedar', -6, 2060, 150), s('cedar-f2', 'cedar', 'trees/cedar', 62, 2120, 160), s('cedar-f3', 'cedar', 'trees/cedar', 140, 2070, 145),
  s('cedar-f4', 'cedar', 'trees/cedar', 214, 2150, 160), s('cedar-f5', 'cedar', 'trees/cedar', 288, 2085, 150), s('cedar-f6', 'cedar', 'trees/cedar', 372, 2140, 155),
  s('cedar-f7', 'cedar', 'trees/cedar', 110, 2190, 150), s('cedar-f8', 'cedar', 'trees/cedar', 330, 2200, 150),
  s('palm-5', 'palm', 'trees/palm', 30, 2236, 110, true), s('palm-6', 'palm', 'trees/palm', 250, 2242, 116),
  // NH's decor (scripts/fetch-assets.ts). Streetlamps at the stone bridge's front corners; meadow flowers in three-
  // flower clumps (`meadow-<i>`, the season's species: scene.ts MEADOW); a wooden fence behind the west clump; garden
  // rocks; the month's bushes either side of the path to the plaza (`month-bush-a|b`: scene.ts hedgePair)
  s('lamp-b1', 'prop', 'deco/streetlamp', 166, 598, 46), s('lamp-b2', 'prop', 'deco/streetlamp', 224, 598, 46),
  s('meadow-0', 'prop', 'meadow-0', -2, 356, 22), s('meadow-1', 'prop', 'meadow-1', 12, 368, 20), s('meadow-2', 'prop', 'meadow-2', 0, 382, 22),
  s('meadow-3', 'prop', 'meadow-3', 384, 350, 22), s('meadow-4', 'prop', 'meadow-4', 372, 364, 20), s('meadow-5', 'prop', 'meadow-5', 388, 378, 22, true),
  s('fence-w1', 'fence', 'deco/fence-wooden', 10, 398, 20), s('fence-w2', 'fence', 'deco/fence-wooden', 41, 398, 20),
  s('rock-g1', 'rock', 'deco/garden-rock', -2, 252, 20),
  s('bush-m1', 'bush', 'month-bush-a', 150, 700, 34), s('bush-m2', 'bush', 'month-bush-b', 240, 700, 34),
  s('rock-m1', 'rock', 'deco/flat-rock', 98, 800, 12),
  s('meadow-6', 'prop', 'meadow-6', 24, 880, 22), s('meadow-7', 'prop', 'meadow-7', 38, 894, 20), s('meadow-8', 'prop', 'meadow-8', 20, 906, 22, true),
  // おく: a bamboo grove behind its lattice fence between Able Sisters and the museum; garden lanterns on the museum's
  // path and at the stairs' foot; a tall rock at the cliff's foot
  s('fence-b1', 'fence', 'deco/fence-bamboo', 280, 1440, 22), s('fence-b2', 'fence', 'deco/fence-bamboo', 304, 1440, 22), s('fence-b3', 'fence', 'deco/fence-bamboo', 328, 1440, 22),
  s('bamboo-1', 'bamboo', 'trees/bamboo', 276, 1470, 66), s('bamboo-2', 'bamboo', 'trees/bamboo', 318, 1462, 72, true),
  s('bamboo-3', 'bamboo', 'trees/bamboo', 297, 1490, 70, true),
  s('lantern-1', 'prop', 'deco/garden-lantern', 240, 1420, 24), s('lantern-2', 'prop', 'deco/garden-lantern', 262, 1478, 24),
  s('lantern-3', 'prop', 'deco/garden-lantern-white', 24, 1656, 24), s('lantern-4', 'prop', 'deco/garden-lantern-white', 98, 1656, 24),
  s('rock-t1', 'rock', 'deco/garden-rock', 150, 1654, 22),
  // tier 2: a corral fence behind the campsite's west side, meadow flowers east of it, a flat rock by the spring
  s('fence-c1', 'fence', 'deco/fence-corral', 64, 1950, 22), s('fence-c2', 'fence', 'deco/fence-corral', 91, 1950, 22), s('fence-c3', 'fence', 'deco/fence-corral', 118, 1950, 22),
  s('meadow-9', 'prop', 'meadow-9', 232, 1772, 22), s('meadow-10', 'prop', 'meadow-10', 246, 1784, 20), s('meadow-11', 'prop', 'meadow-11', 226, 1792, 22, true),
  s('rock-f1', 'rock', 'deco/flat-rock', 330, 1910, 12),
  // denser: palms on the side beaches, a clump by home B, streetlamps by both homes, a rock and flowers on the upper tier
  s('palm-s1', 'palm', 'trees/palm', -26, 214, 100, true), s('palm-s2', 'palm', 'trees/palm', 416, 262, 104),
  s('meadow-12', 'prop', 'meadow-12', 372, 140, 22), s('meadow-13', 'prop', 'meadow-13', 386, 152, 20), s('meadow-14', 'prop', 'meadow-14', 364, 160, 22, true),
  s('lamp-h1', 'prop', 'deco/streetlamp', 96, 290, 44), s('lamp-h2', 'prop', 'deco/streetlamp', 296, 290, 44),
  s('rock-c1', 'rock', 'deco/garden-rock', 30, 1850, 18),
  s('meadow-15', 'prop', 'meadow-15', 296, 1858, 22), s('meadow-16', 'prop', 'meadow-16', 310, 1870, 20), s('meadow-17', 'prop', 'meadow-17', 290, 1880, 22, true)
];

// ---- geometry helpers -----------------------------------------------------------------------------------------------

/** The river's half-width and centre x at z along its north–south reach, or null off it (the east run, z ≥ 720). */
export function riverNS(z: number): { x: number; hw: number } | null {
  for (let i = 0; i < RIVER.length - 1 && RIVER[i][1] > 720; i++) {
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
