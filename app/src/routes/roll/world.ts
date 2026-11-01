// The rolling-log spike's test island (route /roll): about three screens deep, the front beach at z 0 (Home) to the
// back plaza with the museum (Back), world units (1 unit = 1 CSS px at 390 wide), x 0…390 across the land.
// Everything stands on its feet at (x, z); the ground features and the still things' shadows are drawn into the
// ground (RollGround), so only what moves casts a DOM shadow.
import { art } from '#lib/art.ts';

export const ZMAX = 2800;
/** The camera's two stops (camZ: the world z at the pivot line): the front (Home) and the back plaza (Back). */
export const CAM_HOME = 300;
export const CAM_BACK = 1820;
/** The land: front shore, back cliff edge. */
export const LAND = { z0: 70, z1: 2330, x0: -6, x1: 396 };

interface Part {
  name: string;
  /** clip-path of this part within the art's box (the tree's trunk vs its canopy). */
  clip?: string;
  /** Its depth anchor relative to the feet (negative: toward the camera, as the canopy hangs over the trunk's front). */
  dz?: number;
}

export interface Thing {
  id: string;
  key: string;
  kind: 'tree' | 'bush' | 'rock' | 'flower' | 'museum' | 'villager' | 'visitor' | 'item' | 'critter';
  x: number;
  z: number;
  /** Height (units). */
  h: number;
  parts: Part[];
  /** A contact shadow [rx, ry] on the ground (units). */
  shadow?: [number, number];
  flip?: boolean;
  /** Floats this high over its spot (a butterfly). */
  lift?: number;
}

/** The oak render's trunk and canopy (509 × 640): the canopy hangs ~14 units over the trunk's front, so someone
 *  just in front of the trunk covers it while the leaves cover their head; behind it, the whole tree covers them. */
const TREE_PARTS: Part[] = [
  { name: 'trunk', clip: 'polygon(29% 53%, 71% 53%, 72% 84%, 88% 89%, 88% 100%, 12% 100%, 12% 89%, 28% 84%)' },
  { name: 'canopy', clip: 'polygon(0 0, 100% 0, 100% 67%, 66% 67%, 66% 56%, 34% 56%, 34% 67%, 0 67%)', dz: -14 }
];
const ONE: Part[] = [{ name: 'body' }];

const tree = (id: string, x: number, z: number, h = 120): Thing => ({ id, key: 'trees/oak-summer', kind: 'tree', x, z, h, parts: TREE_PARTS, shadow: [h * 0.3, h * 0.11] });
const bush = (id: string, key: string, x: number, z: number): Thing => ({ id, key: `bushes/${key}`, kind: 'bush', x, z, h: 44, parts: ONE, shadow: [22, 7] });
const rock = (id: string, x: number, z: number): Thing => ({ id, key: 'finds/rock', kind: 'rock', x, z, h: 26, parts: ONE, shadow: [18, 6] });
const flower = (id: string, key: string, x: number, z: number): Thing => ({ id, key: `flowers/${key}`, kind: 'flower', x, z, h: 24, parts: ONE });
const item = (id: string, key: string, x: number, z: number, h = 30): Thing => ({ id, key, kind: 'item', x, z, h, parts: ONE, shadow: [h * 0.45, h * 0.15] });
const critter = (id: string, key: string, x: number, z: number, lift = 0): Thing => ({ id, key: `critters/${key}`, kind: 'critter', x, z, h: 18, parts: ONE, lift });

/** The museum (360 × 197, 150 units wide): its front wall at z, 50 deep behind it. */
export const MUSEUM_AT = { x: 195, z: 1900, w: 150, depth: 50 };
const TREE_A = { x: 66, z: 1810 };
const TREE_B = { x: 324, z: 1810 };

export const THINGS: Thing[] = [
  // Home: the front lawn behind the beach
  tree('home-l', 84, 470), tree('home-r', 306, 470),
  { id: 'marshal', key: 'villagers/marshal', kind: 'villager', x: 150, z: 330, h: 78, parts: ONE, shadow: [17, 6] },
  bush('h-b1', 'pink-azalea', 22, 300), bush('h-b2', 'pink-azalea', 368, 300), bush('h-b3', 'white-azalea', 30, 610), bush('h-b4', 'white-azalea', 360, 600),
  rock('h-rock', 300, 250), critter('h-snail', 'snail', 300, 251, 22),
  item('h-chair', 'presents/froggy-chair', 236, 300, 30), item('h-lamp', 'presents/cherry-lamp', 64, 380, 34),
  flower('h-f1', 'red-tulips', 120, 220), flower('h-f2', 'red-tulips', 140, 216), flower('h-f3', 'yellow-tulips', 160, 222),
  flower('h-f4', 'white-roses', 230, 420), flower('h-f5', 'pink-cosmos', 252, 430), flower('h-f6', 'purple-mums', 138, 560),
  critter('h-bfly', 'common-butterfly', 146, 222, 34), critter('h-lady', 'ladybug', 233, 421, 14),
  // the middle: an orchard that rolls over the horizon from Home
  tree('m1', 70, 720), tree('m2', 250, 760), tree('m3', 150, 930), tree('m4', 330, 980), tree('m5', 40, 1110),
  tree('m6', 220, 1180), tree('m7', 120, 1360), tree('m8', 310, 1400),
  bush('m-b1', 'blue-hydrangea', 170, 700), bush('m-b2', 'blue-hydrangea', 360, 820), bush('m-b3', 'yellow-hibiscus', 20, 900),
  bush('m-b4', 'red-hibiscus', 260, 1060), bush('m-b5', 'holly', 380, 1240), bush('m-b6', 'orange-tea-olive', 30, 1300),
  rock('m-rock1', 200, 850), rock('m-rock2', 360, 1520),
  item('m-panda', 'presents/mama-panda', 96, 1010, 36), item('m-cat', 'presents/lucky-cat', 280, 1290, 28),
  flower('m-f1', 'orange-pansies', 110, 800), flower('m-f2', 'blue-pansies', 290, 880), flower('m-f3', 'pink-roses', 196, 1040),
  flower('m-f4', 'orange-cosmos', 60, 1210), flower('m-f5', 'purple-tulips', 330, 1130), flower('m-f6', 'red-roses', 180, 1470),
  critter('m-bfly', 'tiger-butterfly', 200, 1042, 40), critter('m-bee', 'honeybee', 300, 882, 30),
  // Back: the plaza, the museum between two oaks, the visitor, a hedge behind
  { id: 'museum', key: 'deco/museum', kind: 'museum', x: MUSEUM_AT.x, z: MUSEUM_AT.z, h: (MUSEUM_AT.w * 197) / 360, parts: ONE },
  tree('back-a', TREE_A.x, TREE_A.z), tree('back-b', TREE_B.x, TREE_B.z),
  { id: 'kk', key: 'villagers/kk-slider', kind: 'visitor', x: 195, z: 1700, h: 74, parts: ONE, shadow: [16, 6] },
  bush('k-b1', 'pink-camellia', 40, 2080), bush('k-b2', 'red-camellia', 100, 2090), bush('k-b3', 'pink-camellia', 160, 2085),
  bush('k-b4', 'red-camellia', 230, 2090), bush('k-b5', 'pink-camellia', 290, 2085), bush('k-b6', 'red-camellia', 350, 2080),
  rock('k-rock', 20, 1640), tree('far-l', 60, 2200), tree('far-r', 330, 2210), rock('far-rock', 200, 2230),
  flower('k-f1', 'yellow-tulips', 130, 1620), flower('k-f2', 'yellow-tulips', 150, 1625), flower('k-f3', 'white-roses', 250, 1625),
  flower('k-f4', 'white-roses', 270, 1620), flower('k-f5', 'pink-mums', 360, 1700), flower('k-f6', 'pink-mums', 30, 1720),
  critter('k-bfly', 'common-butterfly', 262, 1622, 36)
];

/** The walker (the second villager): a loop round tree A (in front, under its canopy, behind), behind the museum,
 *  round tree B and back across the front, to eyeball the depth sort. */
export const WALKER = { id: 'raymond', key: 'villagers/raymond', h: 78, shadow: [17, 6] as [number, number] };
export const LOOP: [number, number][] = [
  [195, 1765], [TREE_A.x, 1802], [16, 1815], [TREE_A.x, 1850], [104, 1960], [286, 1960], [TREE_B.x, 1850], [374, 1815], [TREE_B.x, 1802]
];
/** Walking speed (units / s). */
export const WALK_SPEED = 42;

/** The ground's flat features (world units): the path from the beach to the plaza, the plaza, the pond. */
export const PATH: [number, number][] = [[200, 80], [205, 260], [180, 520], [200, 700], [240, 900], [190, 1100], [160, 1300], [200, 1500], [195, 1680]];
export const PLAZA = { x: 195, z: 1790, rx: 175, rz: 120 };
export const POND = { x: 330, z: 1590, rx: 40, rz: 22 };

/** A thing's width (units) from its art's aspect ratio. */
export function widthOf(key: string, h: number): number {
  const a = art(key);
  return a ? (h * a.w) / a.h : h;
}
