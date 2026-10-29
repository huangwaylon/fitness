// Island scene v4 data (style guide §S): stage coordinates and season tables. Stage units (u):
// x 0–390, y 0–360, origin top-left, y down; "base" = the y of the feet / trunk bottom.
import type { Season } from '#lib/client/theme.svelte.ts';
import type { BushId, FlowerId } from '../art.ts';

export const STAGE_W = 390;
export const STAGE_H = 360;

/** Stage units → CSS length (relative to the stage width; the stage is the container). */
export const u = (n: number): string => `${((n * 100) / STAGE_W).toFixed(3)}cqw`;

export type Tod = 'dawn' | 'day' | 'dusk' | 'night';

/** One tree per person (round 6): a plain official hardwood of the season at the back left / right (in
 *  AC a tree bears one kind of fruit, so this one bears none). The week's fruit lies on the ground in front
 *  of its trunk, the way NH drops fruit around a shaken tree. `x` = trunk centre; `base` = trunk bottom. */
export const TREE = { base: 176, h: 128, x: { A: 92, B: 298 } as const };
/** The seasonal hardwood renders are 329 × 409 (summer 509 × 640: the same shape). */
export const OAK_AR = 329 / 409;
/** Ground fruit (game-designer round 6): per fruit kind 0–3 items = thirds of that kind's target, in a
 *  fixed arc in front of the trunk, 🍑 🥥 🍎 🍐 left to right (FRUITS order). [dx, dy] from the trunk base. */
export const FRUIT_SPOTS: [number, number][] = [[-40, 6], [-13, 13], [13, 13], [40, 6]];
/** Where the 1st / 2nd / 3rd item of one kind lies, around its spot (a little NH drop pile). */
export const PILE: [number, number][] = [[0, -3], [-6, 4], [6, 4]];
/** Ground item size in u (≈ 22px at 393, NH ground-item scale). */
export const FRUIT_U = 18;
/** Items earned for a fruit kind: thirds of the target (0–3). */
export const fruitCount = (pct: number): number => Math.max(0, Math.min(3, Math.floor((pct * 3) / 100 + 1e-9)));

/** Villagers (§S.8): feet at y 306, 94u tall, on the inside of their trees, flanking the jar (their heads
 *  stay below the ground fruit and the jar's base). */
export const VILLAGER = { foot: 306, h: 94, x: { A: 148, B: 242 } as const };

/** Jar (§S.6, round 6): the plaza centrepiece, ~50% down the island (its plate clears the villagers' heads at 320) on a round sand patch; 56u wide
 *  (70u tall ≈ 75px at 393). */
export const JAR = { x: 195, base: 186, w: 56 };

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

/** Hedge bush pair of the season (alternating). Summer: hydrangea in June, hibiscus Jul–Aug. */
export function hedgePair(season: Season, month: number): [BushId, BushId] {
  switch (season) {
    // (bushes/green is a potted sapling icon, so plain holly stands in as the green bush)
    case 'spring': return ['pink-azalea', 'holly'];
    case 'summer': return [month === 6 ? 'blue-hydrangea' : 'red-hibiscus', 'holly'];
    case 'autumn': return ['orange-tea-olive', 'holly'];
    case 'winter': return ['holly', 'pink-camellia'];
  }
}

/** Round 6: one tidy hedge along the back edge, eight bushes at an even pitch (no building, no path),
 *  inside the plateau's rounded back corners. */
export const HEDGE_X = Array.from({ length: 8 }, (_, i) => 64 + i * 37.5);
export const HEDGE_BASE = 84;

/** Round 7 (environment-style.md, "Pocket Camp diorama"): the island is an organic rounded plateau with
 *  sea on both sides. Grass top surface x 44–346, y 50–316 (rounded corners: rt at the back, rb at the
 *  front), a cliff 12u tall at the front tapering to 6u at the sides, and a sand crescent around it
 *  (x 30–360, down to y 352) with a wet band, two foam lines and a turquoise shallow ring. */
export const PLATEAU = { x0: 44, y0: 50, x1: 346, y1: 316, rt: 60, rb: 26 } as const;
export const SAND = { x0: 30, y0: 44, x1: 360, y1: 352, rt: 72, rb: 60 } as const;
/** The plateau's top edge (grass), in u. */
export const PLATEAU_TOP = PLATEAU.y0;
/** The plateau's front edge (grass), in u: the cliff and the beach lie below it. */
export const PLATEAU_BOTTOM = PLATEAU.y1;
/** Framing (IslandScene): the horizon sits at stage y HORIZON_U, a narrow open-sea strip behind the island; the stage's front beach (below y 360 − TUCK_U) tucks under
 *  the top of the fixed chrome slot, so the shore runs down to the dialogue instead of an empty sea band. */
export const HORIZON_U = 8;
export const TUCK_U = 34;

/** Flowers (§S.7): two kinds per side, alternating. NH flowers keep blooming under snow (A13), so
 *  winter keeps red roses and pansies, with snow caps, on snow mounds. */
export const BEDS: Record<Season, [FlowerId, FlowerId, FlowerId, FlowerId]> = {
  spring: ['pink-tulips', 'yellow-tulips', 'blue-hyacinths', 'white-windflowers'],
  summer: ['red-roses', 'yellow-roses', 'pink-lilies', 'lily-of-the-valley'],
  autumn: ['pink-cosmos', 'white-cosmos', 'purple-mums', 'orange-pansies'],
  winter: ['red-roses', 'orange-pansies', 'orange-pansies', 'red-roses']
};
/** Round 6/7: one front row along the flat part of the plateau's front edge, 7 a side at an 18u pitch,
 *  framing the island (the rounded front corners stay clear). */
export const BED_X = {
  left: Array.from({ length: 7 }, (_, i) => 70 + i * 18),
  right: Array.from({ length: 7 }, (_, i) => 212 + i * 18)
};
export const BED_ROWS = [320];

/** Back row (round 6: the hedge only; no building, bench, cedar or path). */
export function props(season: Season, month: number): Prop[] {
  const [b1, b2] = hedgePair(season, month);
  return HEDGE_X.map((x, i) => ({ key: `bushes/${Math.min(i, 7 - i) % 2 ? b2 : b1}`, h: 28, x, base: HEDGE_BASE, z: 20 }));
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
  const m = d.getMonth() + 1;
  const day = d.getDate();
  const h = d.getHours();
  return {
    cherry: m === 4 && day <= 10,
    maple: m === 11 && day >= 16 && day <= 25,
    fireworks: m === 8 && d.getDay() === 0 && h >= 19,
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
