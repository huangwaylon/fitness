// Island scene v4 data (design.md §S): stage coordinates and season tables. Stage units (u):
// x 0–390, y 0–360, origin top-left, y down; "base" = the y of the feet / trunk bottom.
import type { Season } from '#lib/ui-state/theme.svelte.ts';
import type { BushId, FlowerId } from '#lib/art.ts';
import { jst } from '#lib/time/clock.ts';

const STAGE_W = 390;
const STAGE_H = 360;

/** Stage units → CSS length (relative to the stage width; the stage is the container). */
export const u = (n: number): string => `${((n * 100) / STAGE_W).toFixed(3)}cqw`;

export type Tod = 'dawn' | 'day' | 'dusk' | 'night';

/** The NH tile grid (scale pass, docs/design/design.md §S.2). One tile = TILE u wide; a tile row is
 *  ROW u deep on screen (NH's camera foreshortens ground depth to ≈ 0.7 of the width). Columns are centred on
 *  the jar: col(k) = 195 + k·TILE, k = −3…3 (7 tiles across the plateau). Every size is a multiple of the
 *  villager height VILLAGER.h ≈ 1.8 tiles, measured against in-game screenshots (`.refs/scale/`). */
export const TILE = 44;
export const ROW = 31;
const col = (k: number): number => 195 + k * TILE;
/** Row bases (y of the feet / trunk bottom): back hedge, trees + jar, the flower beds' back and front rows
 *  (the villagers stand on the front row). */
const ROWS = { hedge: 80, trees: 173, bedBack: 266, front: 297 } as const;

/** One tree per person (round 6): a plain official hardwood of the season (in AC a tree bears one kind of
 *  fruit, so this one bears none), trunk on column ±2. NH hardwood ≈ 1.5 × a villager tall, canopy ≈ 2.2
 *  tiles wide. The week's fruit lies on the ground in front of its trunk, the way NH drops fruit around a
 *  shaken tree. `x` = trunk centre; `base` = trunk bottom. */
export const TREE = { base: ROWS.trees, h: 120, x: { A: col(-2), B: col(2) } as const };
/** The seasonal hardwood renders are 329 × 409 (summer 509 × 640: the same shape). */
export const OAK_AR = 329 / 409;
/** Ground fruit (game-designer round 6): per fruit kind 0–3 items = thirds of that kind's target, in a
 *  fixed arc in front of the trunk, 🍑 🥥 🍎 🍐 left to right (FRUITS order). [dx, dy] from the trunk base.
 *  NH puts one dropped item per tile; 4 kinds × 3 items can't, so they sit at half-tile pitch (compromise). */
export const FRUIT_SPOTS: [number, number][] = [[-37, 6], [-12, 12], [12, 12], [37, 6]];
/** Where the 1st / 2nd / 3rd item of one kind lies, around its spot (a little NH drop pile). */
export const PILE: [number, number][] = [[0, -3], [-6, 4], [6, 4]];
/** Ground item size in u: NH dropped fruit ≈ 0.3 × a villager (≈ half a tile). */
export const FRUIT_U = 24;
/** Items earned for a fruit kind: thirds of the target (0–3). */
export const fruitCount = (pct: number): number => Math.max(0, Math.min(3, Math.floor((pct * 3) / 100 + 1e-9)));

/** Villagers (the scale's reference): 80u tall (≈ 1.8 tiles), on columns ±1 of the front row, flanking the
 *  jar; their heads stay below the ground fruit. */
export const VILLAGER = { foot: ROWS.front, h: 80, x: { A: col(-1), B: col(1) } as const };

/** Jar (§S.6): the plaza centrepiece on column 0 of the tree row, on a round sand patch; 52u wide (≈ 1.2
 *  tiles, 65u ≈ 0.8 villager tall: a little over one-tile furniture so the coins and the plate stay legible). */
export const JAR = { x: col(0), base: ROWS.trees, w: 52 };

export interface Prop {
  key: string;
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
function hedgePair(_season: Season, month: number): [BushId, BushId] {
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

/** Round 7 (design.md §S.3, "Pocket Camp diorama"): the island is an organic rounded plateau with
 *  sea on both sides. Grass top surface x 44–346, y 50–316 (rounded corners: rt at the back, rb at the
 *  front), a cliff 12u tall at the front tapering to 6u at the sides, and a sand crescent around it
 *  (x 30–360, down to y 352) with a wet band, two foam lines and a turquoise shallow ring. */
export const PLATEAU = { x0: 44, y0: 50, x1: 346, y1: 316, rt: 60, rb: 26 } as const;
export const SAND = { x0: 30, y0: 44, x1: 360, y1: 352, rt: 72, rb: 60 } as const;
/** The plateau's front edge (grass), in u: the cliff and the beach lie below it. */
const PLATEAU_BOTTOM = PLATEAU.y1;
/** Framing (IslandScene): the horizon sits at stage y HORIZON_U, a narrow open-sea strip behind the island; the stage's front beach (below y 360 − TUCK_U) tucks under
 *  the top of the fixed chrome slot, so the shore runs down to the dialogue instead of an empty sea band. */
const HORIZON_U = 8;
const TUCK_U = 34;

/** Flower beds (scale pass): two tidy 2 × 2 beds, mirrored about the jar, on columns ±2/±3 of the
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

/** Back row (round 6: the hedge only; no building, bench, cedar or path). */
export function props(season: Season, month: number): Prop[] {
  const [b1, b2] = hedgePair(season, month);
  return HEDGE_X.map((x, i) => ({ key: `bushes/${i % 2 ? b2 : b1}`, h: BUSH_U, x, base: HEDGE_BASE, z: 20 }));
}

/** Japan-date events (§S.10). */
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


/** Small deterministic PRNG so scattered details sit still between renders. */
export function rng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
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
