// Island scene data (design.md "Island scene"): stage coordinates and season tables. Stage units (u):
// x 0–390, y 0–360, origin top-left, y down; "base" = the y of the feet / trunk bottom.
import type { Season } from '#lib/ui-state/theme.svelte.ts';
import type { BushId, FlowerId } from '#lib/art.ts';
import type { RingFruit } from '#lib/types.ts';
import { jst } from '#lib/time/clock.ts';

export const STAGE_W = 390;
const STAGE_H = 360;

/** Stage units → CSS length (relative to the stage width; the stage is the container). */
export const u = (n: number): string => `${((n * 100) / STAGE_W).toFixed(3)}cqw`;

export type Tod = 'dawn' | 'day' | 'dusk' | 'night';

/** The NH tile grid (docs/design.md "Layout and scale"). One tile = TILE u wide; a tile row is
 *  ROW u deep on screen (NH's camera foreshortens ground depth to ≈ 0.7 of the width). Columns are centred on
 *  centre stage: col(k) = 195 + k·TILE, k = −3…3 (7 tiles across the plateau). Every size is a multiple of the
 *  villager height VILLAGER.h ≈ 1.8 tiles, measured against in-game screenshots (`.refs/scale/`). */
export const TILE = 44;
export const ROW = 31;
const col = (k: number): number => 195 + k * TILE;
/** Row bases (y of the feet / trunk bottom): back hedge, trees + centre stage, the flower beds' back and front rows
 *  (the villagers stand on the front row). */
const ROWS = { hedge: 62, trees: 173, bedBack: 266, front: 297 } as const;

/** One tree per person: a plain official hardwood of the season, trunk on column ±2. NH hardwood ≈ 1.5 × a villager
 *  tall, canopy ≈ 2.2 tiles wide. Today's four fruits hang in its canopy (TREE_FRUIT) and drop to the ground in front
 *  of the trunk once met (FRUIT_SPOTS), the way NH drops fruit around a shaken tree. `x` = trunk centre; `base` =
 *  trunk bottom. */
export const TREE = { base: ROWS.trees, h: 120, x: { A: col(-2), B: col(2) } as const };
/** The seasonal hardwood renders are 329 × 409 (summer 509 × 640: the same shape). */
export const OAK_AR = 329 / 409;
/** Fruit hanging in the canopy, 🍐 🍑 🍒 🍎 left to right (RING_FRUITS order): [dx, dy] of each item's centre from the
 *  trunk base, on the canopy's lower front like NH's three, in a loose arc (the middle two a little higher). */
export const TREE_FRUIT: [number, number][] = [[-27, -56], [-10, -68], [10, -62], [27, -54]];
/** A hanging fruit is a little smaller than one on the ground (the canopy is further back). */
export const TREE_FRUIT_U = 20;
/** Fruit on the ground, once met: [dx, dy] from the trunk base, in a fixed arc in front of the trunk, 🍐 🍑 🍒 🍎 left
 *  to right. NH puts one dropped item per tile; four can't fit, so they sit at a 20u pitch (compromise), centred on the
 *  trunk, and the row leans FRUIT_LEAN u out from centre stage, so it stays clear of the middle
 *  and inside the plateau's side (x 44). */
export const FRUIT_SPOTS: [number, number][] = [[-30, 6], [-10, 12], [10, 12], [30, 6]];
export const FRUIT_LEAN = 8;
/** Ground item size in u: NH dropped fruit ≈ 0.3 × a villager (≈ half a tile). */
export const FRUIT_U = 24;
/** Villagers (the scale's reference): 80u tall (≈ 1.8 tiles), on columns ±1 of the front row, flanking the
 *  middle; their heads stay below the ground fruit. */
export const VILLAGER = { foot: ROWS.front, h: 80, x: { A: col(-1), B: col(1) } as const };

/** Centre stage (design.md "Layout and scale"): the island's open middle, column 0 of the tree row, between the trees
 *  and in front of the rock and the back weed spot: where a visiting villager stands (their feet at `base`), kept
 *  free of every placement (the jar is in the HUD, HudJar). */
export const CENTRE_STAGE = { x: col(0), base: ROWS.trees } as const;

interface Prop {
  key: string;
  /** A hedge bush's index in HEDGE_X (SceneTaps finds it by data-bush). */
  bush?: number;
  /** Height in u. */
  h: number;
  x: number;
  base: number;
  z: number;
  eager?: boolean;
  /** Mirror horizontally. */
  flip?: boolean;
  /** Extra class (glow, etc). */
  cls?: string;
}

/** The hedge's species of the month (NH flowering seasons, northern hemisphere): one species per hedge,
 *  its two colours alternating (how NH players plant a tidy hedge). Spring azaleas, June hydrangeas,
 *  Jul–Aug hibiscus, Sep–Oct tea olive, Nov–Dec holly, Jan–Mar camellias. */
function hedgePair(month: number): [BushId, BushId] {
  if (month >= 4 && month <= 5) return ['pink-azalea', 'white-azalea'];
  if (month === 6) return ['blue-hydrangea', 'pink-hydrangea'];
  if (month >= 7 && month <= 8) return ['red-hibiscus', 'yellow-hibiscus'];
  if (month >= 9 && month <= 10) return ['orange-tea-olive', 'yellow-tea-olive'];
  if (month >= 11) return ['holly', 'holly'];
  return ['pink-camellia', 'red-camellia'];
}

/** The back hedge: one bush per tile on columns −3…3 (NH hedges are one bush per tile; neighbours touch).
 *  A bush is ≈ 0.6 × a villager tall (BUSH_U, the trimmed figure). */
export const HEDGE_X = [-3, -2, -1, 0, 1, 2, 3].map(col);
export const HEDGE_BASE = ROWS.hedge;
export const BUSH_U = 48;
/** The bushes still standing (indices into HEDGE_X): the pond takes column −2 and the museum columns −1…1, so the
 *  back row reads bush · pond · museum · bush · bush (design.md "Pond", "Museum"). */
const HEDGE_KEPT: readonly number[] = [0, 5, 6];
export const hedgeKept = (i: number): boolean => HEDGE_KEPT.includes(i);

/** design.md "Environment", a "Pocket Camp diorama": the island is an organic rounded plateau with
 *  sea on both sides. Grass top surface x 44–346, y 32–316 (rounded corners: rt at the back, rb at the
 *  front), a cliff 12u tall at the front tapering to 6u at the sides, and a sand crescent around it
 *  (x 30–360, y 26–352) with a wet band, two foam lines and a turquoise shallow ring. The back reaches well behind the
 *  trees: the hedge stands 111u behind their trunks, the rock and a weed spot in between. */
export const PLATEAU = { x0: 44, y0: 32, x1: 346, y1: 316, rt: 60, rb: 26 } as const;
export const SAND = { x0: 30, y0: 26, x1: 360, y1: 352, rt: 72, rb: 60 } as const;
/** Framing (IslandScene): the horizon sits at stage y HORIZON_U, a narrow open-sea strip behind the island; the island
 *  (the hedge's top 14u to the beach's foam 356u) is centred in the visible ocean, the horizon down to the screen's bottom. */
export const HORIZON_U = 0;

/** The pond (design.md "Pond"): a small rounded pond on the back row at the left, in place of the hedge's column −2
 *  bush (between the corner bush and the museum, behind the left tree's canopy top); its water's centre and half-axes
 *  (the bank is drawn ~3u outside). Its fish swim and are fished there (critters.ts `Oval`). */
export const POND = { cx: 117, cy: 46, rx: 26, ry: 9 } as const;
/** The museum (design.md "Museum"): NH's museum, the official render (540 × 296), on the back row in the middle in
 *  place of the hedge's columns −1…1; `x` its centre, `base` the front of its slab (the hedge's row), `w` its width
 *  (u): 100u wide, 55u tall (a little taller than the bushes, as a building is). */
export const MUSEUM = { x: col(0), base: ROWS.hedge, w: 100 } as const;

/** Flower beds (scale pass): two tidy 2 × 2 beds, mirrored about the middle, on columns ±2/±3 of the
 *  front two rows (the villagers stand on columns ±1; column 0 stays open for their strolls). One flower per
 *  tile, the back row one species and the front row another, as NH players plan a bed. NH flowers keep
 *  blooming under snow, so winter keeps roses and pansies, on snow mounds. A flower ≈ 0.45 × a villager. */
export const BEDS: Record<Season, { back: FlowerId; front: FlowerId }> = {
  spring: { back: 'red-tulips', front: 'yellow-tulips' },
  summer: { back: 'red-roses', front: 'white-roses' },
  autumn: { back: 'pink-cosmos', front: 'purple-mums' },
  winter: { back: 'red-roses', front: 'orange-pansies' }
};
export const FLOWER_U = 32;
/** Per-species height (pansies and mums grow low). */
export const FLOWER_SCALE: Partial<Record<FlowerId, number>> = { 'orange-pansies': 0.8, 'purple-mums': 0.92 };
export const BED_X = { left: [col(-3), col(-2)], right: [col(2), col(3)] };
export const BED_ROWS = [ROWS.bedBack, ROWS.front];
/** Each bed is its person's goal flowers (the bed beside their villager: mine on the left, the partner's on the right),
 *  one per goal in reading order, the same in both beds: 🍐 Move back-left, 🍑 Exercise back-right, 🍒 Stand
 *  front-left, 🍎 Steps front-right. `BED_FRUIT[row][k]`, k = 0 for the bed's left column, 1 for its right. */
export const BED_FRUIT: [RingFruit, RingFruit][] = [['pear', 'peach'], ['cherry', 'apple']];

/** Halloween's pumpkins (Halloween.svelte), each shown only where it's clear of every control: one in front of the
 *  hedge in the middle (between the rock and a weed's spot), one between each trunk and its person's bed, a pair on the
 *  middle of the lawn on the trees' row. */
export const PUMPKIN_U = 22;
export const HALLOWEEN_SPOTS: readonly (readonly [number, number])[] = [
  [col(0), HEDGE_BASE + 14], [TREE.x.A - 22, ROWS.bedBack - 30], [TREE.x.B + 22, ROWS.bedBack - 30],
  [col(-0.5), ROWS.trees + 4], [col(0.5), ROWS.trees + 4]
];

/** Back row: the hedge, its bushes where the pond and the museum leave room (no bench, cedar or path). */
export function props(month: number): Prop[] {
  const [b1, b2] = hedgePair(month);
  return HEDGE_X.flatMap((x, i) => (hedgeKept(i) ? [{ key: `bushes/${i % 2 ? b2 : b1}`, bush: i, h: BUSH_U, x, base: HEDGE_BASE, z: 20 }] : []));
}

/** Japan-date events (design.md "Particles and events"). */
export interface Events {
  cherry: boolean;
  maple: boolean;
  fireworks: boolean;
  toyDay: boolean;
  newYear: boolean;
}
export function eventsAt(d: Date): Events {
  const { month: m, day, hour: h, weekday } = jst(d);
  return {
    cherry: m === 4 && day <= 10,
    maple: m === 11 && day >= 16 && day <= 25,
    fireworks: m === 8 && weekday === 0 && h >= 19,
    toyDay: m === 12 && day === 24,
    newYear: (m === 12 && day === 31 && h >= 22) || (m === 1 && day === 1 && h < 2)
  };
}



type Pt = [number, number];
interface RRect { x0: number; y0: number; x1: number; y1: number; rt: number; rb: number }

/** Points (and outward normals) evenly spaced along a rounded rectangle grown by `d`, with a soft wave of
 *  `amp` u along the normal (`cycles` waves around the outline). The same parameter t on every offset keeps
 *  the wet band, foam and shallows parallel to the sand edge. */
export function outline(r: RRect, d = 0, amp = 0, cycles = 0, phase = 0, n = 120): Pt[] {
  const x0 = r.x0 - d, y0 = r.y0 - d, x1 = r.x1 + d, y1 = r.y1 + d, rt = r.rt + d, rb = r.rb + d;
  const q = Math.PI / 2;
  // segments: [length, (s) => [x, y, nx, ny]]
  const arc = (cx: number, cy: number, rad: number, a0: number) =>
    [rad * q, (s: number) => { const a = a0 + s / rad; return [cx + rad * Math.cos(a), cy + rad * Math.sin(a), Math.cos(a), Math.sin(a)]; }] as const;
  const line = (ax: number, ay: number, bx: number, by: number, nx: number, ny: number) => {
    const len = Math.hypot(bx - ax, by - ay);
    return [len, (s: number) => [ax + ((bx - ax) * s) / len, ay + ((by - ay) * s) / len, nx, ny]] as const;
  };
  const segs = [
    line(x0 + rt, y0, x1 - rt, y0, 0, -1), arc(x1 - rt, y0 + rt, rt, -q),
    line(x1, y0 + rt, x1, y1 - rb, 1, 0), arc(x1 - rb, y1 - rb, rb, 0),
    line(x1 - rb, y1, x0 + rb, y1, 0, 1), arc(x0 + rb, y1 - rb, rb, q),
    line(x0, y1 - rb, x0, y0 + rt, -1, 0), arc(x0 + rt, y0 + rt, rt, 2 * q)
  ];
  const total = segs.reduce((a, [l]) => a + l, 0);
  const pts: Pt[] = [];
  for (let i = 0; i < n; i++) {
    let s = (i / n) * total;
    let k = 0;
    while (k < segs.length - 1 && s > segs[k][0]) s -= segs[k++][0];
    const [x, y, nx, ny] = segs[k][1](s);
    const w = amp ? amp * Math.sin((i / n) * cycles * 2 * Math.PI + phase) : 0;
    pts.push([x + nx * w, y + ny * w]);
  }
  return pts;
}

/** A smooth closed path through the points (Catmull-Rom → cubic Béziers). */
export function smooth(pts: Pt[], closed = true): string {
  const n = pts.length;
  const at = (i: number) => (closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))]);
  const f = (v: number) => v.toFixed(1);
  let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let i = 0; i < (closed ? n : n - 1); i++) {
    const p0 = at(i - 1), p1 = at(i), p2 = at(i + 1), p3 = at(i + 2);
    d += `C${f(p1[0] + (p2[0] - p0[0]) / 6)} ${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)} ${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])} ${f(p2[1])}`;
  }
  return closed ? d + 'Z' : d;
}
