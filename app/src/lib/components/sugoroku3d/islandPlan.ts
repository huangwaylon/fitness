// 英語すごろく's board as a stretch of our own island (docs/sugoroku.md "The 3D board"), the pure part: where the board
// sits on the island's grid (layout/grid.ts) and the island's tiles under it (the grass, the dirt path under the route,
// the river, the beaches, the sea round it), so the island's own ground draws it (world3d/terrain.ts buildGround); and
// what stands about (NH's trees, bushes and flowers, the museum, the shop, our homes, the bridges, the plaza's and the
// beach's things), each kept from hiding a stone from the camera. island.ts builds it. No three.js here.
//
// The board's units (plan.ts: a plan unit a world unit, a person PERSON_H tall) are the island's ×K: a tile (30u) is
// TILE_P of the plan's, so the board's 360 wide drawing is 18 tiles of land with a ring of sea; the island's things are
// drawn at the people's size (PEOPLE: a person here is PERSON_H, a villager on the island 80u).
import { BOARD, H, W } from '#lib/sugoroku/board.ts';
import { GRID, TILE, codeOf, type Kind } from '#lib/layout/grid.ts';
import { END_R, PERSON_H, RIVER_HALF, STONE_R, bridges, riverY } from './plan.ts';

/** Plan units a tile, and the island's world units a board unit. */
export const TILE_P = 20;
export const K = TILE / TILE_P;
/** The grid's column and row where the plan's (0, 0) is: a column of sea left of the land, 7 rows of land before
 *  ふりだし's row (the camera sees ~100 behind the start). */
const COL0 = 1, ROW0 = 8;
/** The island's things at the people's size: a world unit of an island model a world unit here times this. */
export const PEOPLE = (PERSON_H * K) / 80;
/** The land's plan extent: rows from y LAND_Y0, the sea from y SEA_FROM; the beach from y SAND_FROM; the river's row
 *  covers RIVER_Y0 … +TILE_P. */
const LAND_Y0 = -7 * TILE_P, SAND_FROM = 580, SEA_FROM = 660;
export const RIVER_Y0 = riverY(0) - RIVER_HALF;

/** The board group's place in the island's three space: board (plan.ts) world point (x, y, z) → (K·x + OX, K·y + OY,
 *  K·z + OZ). The stones' feet a touch into the grass (layout/height.ts GRASS_Y 3; the path sinks a little below it). */
export const BOARD_AT = {
  x: K * (W / 2) + GRID.x0 + COL0 * TILE,
  y: 1.6,
  z: -(GRID.z0 + ROW0 * TILE + K * (H / 2))
} as const;

/** A plan point (x right, y down the route) on the island's layout (its x and z: three's z is −z). */
export const toLayout = (x: number, y: number): [number, number] => [GRID.x0 + COL0 * TILE + K * x, GRID.z0 + ROW0 * TILE + K * y];

/** The land's box on the layout (x0, x1, z0, z1: the island's units), its beaches' outer edges. */
export const LAND = (() => {
  const [x0, z0] = toLayout(0, LAND_Y0), [x1, z1] = toLayout(W, SEA_FROM);
  return { x0, x1, z0, z1 };
})();

/** A tile's plan box's corner (x0, y0). */
const tileBox = (c: number, r: number): [number, number] => [(c - COL0) * TILE_P, (r - ROW0) * TILE_P];

/** The route's links (each stone to each of its next), plan points. */
const LINKS = BOARD.flatMap((sp) => sp.next.map((j) => [sp.x, sp.y, BOARD[j].x, BOARD[j].y] as const));

/** Distance from plan point (x, y) to segment (ax, ay)–(bx, by). */
function segDist(x: number, y: number, ax: number, ay: number, bx: number, by: number): number {
  const vx = bx - ax, vy = by - ay, l2 = vx * vx + vy * vy || 1;
  const t = Math.max(0, Math.min(1, ((x - ax) * vx + (y - ay) * vy) / l2));
  return Math.hypot(x - ax - vx * t, y - ay - vy * t);
}
/** Distance from plan point (x, y) to the route (its links). */
const routeDist = (x: number, y: number): number => LINKS.reduce((d, [ax, ay, bx, by]) => Math.min(d, segDist(x, y, ax, ay, bx, by)), Infinity);

/** A tile's kind: the sea round the land, the river across it, the beaches (each side, and past the last row), the
 *  route's dirt path (NH's custom path: the tiles the route runs over), else grass. */
export function kindAt(c: number, r: number): Kind {
  const [x0, y0] = tileBox(c, r);
  if (x0 < 0 || x0 >= W || y0 < LAND_Y0 || y0 >= SEA_FROM) return 'sea';
  if (y0 === RIVER_Y0) return 'river';
  if (x0 === 0 || x0 === W - TILE_P || y0 >= SAND_FROM) return 'sand';
  return routeDist(x0 + TILE_P / 2, y0 + TILE_P / 2) < TILE_P * 0.6 ? 'dirt' : 'grass';
}

/** The grid's tile codes (layout/model.ts Layout's), row by row, every tile at tier 0. */
export function boardCodes(): Uint8Array {
  const codes = new Uint8Array(GRID.cols * GRID.rows);
  for (let r = 0; r < GRID.rows; r++) for (let c = 0; c < GRID.cols; c++) codes[r * GRID.cols + c] = codeOf(kindAt(c, r), 0);
  return codes;
}

// ---- what stands about ----

/** A thing on the board's island: an island model (world3d's models.json, assets.json: a model or an art key), at plan
 *  (x, y), sized by its height in the island's units (h: the island's catalogue's) or its scale a model unit (s: the
 *  island's DECOR_U for NH's furniture and buildings), either drawn at the people's size (PEOPLE); turned yaw (three's).
 *  `box` (x0, x1, y0, y1) is its footprint on the plan and `tall` its height (plan units): what it may hide. */
export interface Deco {
  id: string;
  m: string;
  x: number;
  y: number;
  h?: number;
  s?: number;
  yaw?: number;
  box: [number, number, number, number];
  tall: number;
}
/** A model's bounds in its own units (models3d.ts modelBounds, by model or art key), null for none. */
export type BoundsOf = (m: string) => { min: readonly number[]; max: readonly number[] } | null;

/** NH's furniture and buildings: a model unit is DECOR_U (3u) on the island. */
const DECOR_U = 3;
/** The buildings, the plaza's, the river's and the beach's pieces: [id, model, plan x, y, scale a model unit]. */
const PIECES: readonly [string, string, number, number, number][] = [
  // the museum in the long way's loop; the shop by the long way's end, before the shop's row
  ['museum', 'museum', 205, 292, DECOR_U], ['shop', 'shop', 325, 380, DECOR_U * 0.6],
  // the plaza's bulletin board, benches and street lamps
  ['board', 'deco/bulletin-board', 180, 142, 3.5], ['bench-a', 'park-bench', 121, 150, DECOR_U], ['bench-b', 'park-bench', 238, 150, DECOR_U],
  ['lamp-a', 'streetlamp', 63, 80, DECOR_U], ['lamp-b', 'streetlamp', 297, 84, DECOR_U], ['lamp-c', 'streetlamp', 63, 150, DECOR_U], ['lamp-d', 'streetlamp', 297, 152, DECOR_U],
  ['lamp-e', 'streetlamp', 63, 432, DECOR_U], ['lamp-f', 'streetlamp', 180, 500, DECOR_U],
  // a rod stand by the river; a beach chair and a sandcastle on the beach; shells
  ['rod', 'rod-stand', 300, 296, DECOR_U], ['chair', 'deco/beach-chair', 238, 572, DECOR_U], ['castle', 'deco/sandcastle', 121, 574, DECOR_U],
  ...[[60, 590], [180, 640], [246, 578], [330, 652], [20, 630]].map(([x, y]) => [`shell-${x}`, 'finds/summer-shell', x, y, 5.263] as [string, string, number, number, number])
];
/** The trees (plan points): before ふりだし round our homes, in the museum's loop, the beach's palms past あがり. */
const TREES: readonly [string, number, number][] = [
  ['oak', 18, -120], ['cedar', 60, -128], ['oak', 128, -112], ['cedar', 236, -124], ['oak', 340, -118], ['oak', 252, -78], ['cedar', 16, -66], ['oak', 346, -60],
  ['oak', 110, 300], ['cedar', 276, 302],
  ['palm', 40, 652], ['palm', 128, 648], ['palm', 236, 654], ['palm', 300, 646], ['palm', 352, 590], ['palm', 8, 560]
];
const TREE_H: Record<string, number> = { oak: 112, cedar: 140, palm: 96 };
const TREE_MODEL: Record<string, string> = { oak: 'oak-summer', cedar: 'cedar', palm: 'palm' };
/** The bushes' and the flowers' kinds (a few: a model a draw). */
const BUSHES = ['bush-pink-azalea', 'bush-red-hibiscus'];
const FLOWERS = ['flowers/red-tulips', 'flowers/yellow-tulips', 'flowers/white-cosmos'];
/** A home's footprint and height (plan units: its front wall's middle at the HOMES point, the house behind it, a tent the
 *  deepest of our looks) as a Deco's `box` and `tall`. */
export const homeBox = (h: { x: number; y: number }): { box: [number, number, number, number]; tall: number } => ({ box: [h.x - 23, h.x + 23, h.y, h.y + 43], tall: 30 });

/** The board's things: the buildings and pieces where they're put (they hide no stone: islandPlan.test), the trees,
 *  bushes and flowers where they hide none either (`clear`) and stand clear of the rest, the path and the river.
 *  Deterministic: the same board every time. */
export function decoPlan(boundsOf: BoundsOf): Deco[] {
  const out: Deco[] = [];
  /** A deco of model `m` at (x, y), `size` a model unit (plan units), or null without the model. */
  const make = (id: string, m: string, x: number, y: number, k: { s?: number; h?: number }, yaw = 0): Deco | null => {
    const b = boundsOf(m);
    if (!b) return null;
    const height = b.max[1] - Math.min(0, b.min[1]), f = (k.s ?? (k.h ?? 0) / height) * (PEOPLE / K);
    // (yaw 0 faces the camera: a model's −z, its back, is +y on the plan)
    return { id, m, x, y, ...k, ...(yaw ? { yaw } : {}), box: [x + b.min[0] * f, x + b.max[0] * f, y - b.max[2] * f, y - b.min[2] * f], tall: height * f };
  };
  const homes = HOMES.map((h) => homeBox(h).box);
  const free = (d: Deco, gap: number) =>
    clear(d.box, d.tall) && ![...out.map((o) => o.box), ...homes].some(([x0, x1, y0, y1]) => d.box[0] < x1 + gap && d.box[1] > x0 - gap && d.box[2] < y1 + gap && d.box[3] > y0 - gap);
  for (const [id, m, x, y, s] of PIECES) {
    const d = make(id, m, x, y, { s });
    if (d) out.push(d);
  }
  for (const [k, x, y] of TREES) {
    const d = make(`tree-${x}-${y}`, TREE_MODEL[k], x, y, { h: TREE_H[k] });
    if (d && free(d, 2)) out.push(d);
  }
  // bushes and flowers: a jittered lattice over the grass, kept off the path, the river and the beaches' edges
  let seed = 7;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let y = LAND_Y0 + 10; y < SAND_FROM - 10; y += 15) for (let x = 6; x < W - 6; x += 15) {
    const px = x + (rnd() - 0.5) * 10, py = y + (rnd() - 0.5) * 10, pick = rnd(), which = rnd(), yaw = rnd() * 6;
    if (pick < 0.8 || routeDist(px, py) < 22 || Math.abs(py - (RIVER_Y0 + TILE_P / 2)) < 18 || px < TILE_P + 2 || px > W - TILE_P - 2) continue;
    const bush = pick > 0.95, list = bush ? BUSHES : FLOWERS;
    // (a bush as the island stands them, unturned: world3d/objects.ts placeObjects')
    const d = make(`${bush ? 'bush' : 'flower'}-${Math.round(px)}-${Math.round(py)}`, list[Math.floor(which * list.length)], px, py, { h: bush ? 34 : 16 }, bush ? 0 : yaw);
    if (d && free(d, 1)) out.push(d);
  }
  return out;
}

/** The camera's slope (plan.ts PITCH 50°: a thing `tall` high hides the ground up to tall·SIGHT behind it; a little
 *  more than 1/tan 50° for the view's top, which looks lower). */
const SIGHT = 1.05;
/** Whether a thing on `box` (plan x0, x1, y0, y1), `tall` high (plan units), leaves every stone in sight: what it covers
 *  on the screen (its footprint and tall·SIGHT behind it) misses each stone's top. */
export function clear([x0, x1, y0, y1]: readonly number[], tall: number): boolean {
  const back = y1 + tall * SIGHT;
  return BOARD.every((sp) => {
    const sr = (sp.kind === 'start' || sp.kind === 'goal' ? END_R : STONE_R) + 1;
    const dx = Math.max(x0 - sp.x, 0, sp.x - x1), dy = Math.max(y0 - sp.y, 0, sp.y - back);
    return Math.hypot(dx, dy) > sr;
  });
}

/** Our homes before ふりだし (layout/homes.ts DEFAULT_HOMES's styles; their front wall's middle at the plan point, each
 *  facing the camera). */
export const HOMES: readonly { who: 'A' | 'B' | 'G'; x: number; y: number }[] = [
  { who: 'A', x: 84, y: -52 },
  { who: 'B', x: 190, y: -52 },
  { who: 'G', x: 292, y: -52 }
];

/** NH's bridges where the route crosses the river (plan.ts bridges): each its middle on the layout, its turn (three's
 *  yaw: NH's deck runs along the model's x) and the length to span (the island's units), short of the stones. */
export function bridgePlaces(): { id: string; x: number; z: number; yaw: number; length: number }[] {
  return bridges().map((b, i) => {
    const link = LINKS.reduce((best, l) => (segDist(b.x, b.y, l[0], l[1], l[2], l[3]) < segDist(b.x, b.y, best[0], best[1], best[2], best[3]) ? l : best));
    const free = Math.hypot(link[2] - link[0], link[3] - link[1]) - 2 * STONE_R - 6;
    const [x, z] = toLayout(b.x, b.y);
    // (the deck along three's x turned by yaw runs (cos, −sin) in three's x, z: the link's way, (dx, dy) on the layout)
    return { id: `bridge-${i}`, x, z, yaw: Math.atan2(link[3] - link[1], link[2] - link[0]), length: Math.min(80, (free * K) / 0.9) };
  });
}
