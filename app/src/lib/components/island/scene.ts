// Island scene v4 data (style guide §S): stage coordinates and season tables. Stage units (u):
// x 0–390, y 0–360, origin top-left, y down; "base" = the y of the feet / trunk bottom.
import type { Season } from '#lib/client/theme.svelte.ts';
import type { BushId, DecoId, FlowerId, SeasonItem } from '../art.ts';

export const STAGE_W = 390;
export const STAGE_H = 360;

/** Stage units → CSS length (relative to the stage width; the stage is the container). */
export const u = (n: number): string => `${((n * 100) / STAGE_W).toFixed(3)}cqw`;

export type Tod = 'dawn' | 'day' | 'dusk' | 'night';

/** Orchards (§S.8, A5). In NH every fruit tree is the hardwood of the season bearing three of ONE
 *  fruit, and coconuts grow only on palms. So each person's orchard is three small fruit trees (peach
 *  at the back, pear on the outside, apple on the inside, next to the path) and the beach palm beside
 *  it carries the coconut. `x` = the villager / orchard centre; `base` = the front trees' trunk line. */
export const TREE = { base: 248, x: { A: 84, B: 306 } as const };
export type OrchardFruit = 'peach' | 'pear' | 'apple';
export interface OrchardTree {
  fruit: OrchardFruit;
  x: number;
  base: number;
  /** Height in u (width = h × OAK_AR). */
  h: number;
  /** The back tree sways (one idle animation per orchard, §S.13); the front two stand still. */
  back?: boolean;
}
/** The seasonal hardwood renders are 329 × 409 (summer 509 × 640: the same shape). */
export const OAK_AR = 329 / 409;
const ORCHARD_A: OrchardTree[] = [
  { fruit: 'peach', x: 84, base: 196, h: 100, back: true },
  { fruit: 'pear', x: 38, base: 246, h: 82 },
  { fruit: 'apple', x: 132, base: 248, h: 82 }
];
/** Back to front (paint order). Person B's orchard mirrors A's around the path. */
export const ORCHARD: Record<'A' | 'B', OrchardTree[]> = {
  A: ORCHARD_A,
  B: ORCHARD_A.map((t) => ({ ...t, x: STAGE_W - t.x }))
};
/** Three fruit on each tree (% of the tree box, centre point), as NH hangs them; each 30% of the tree width. */
export const FRUIT_POS: [number, number][] = [[27, 31], [73, 28], [50, 50]];
export const FRUIT_W = 0.3;

/** The two front palms (§S.6), one beside each oak: [x, base, height u, mirrored]. */
export const PALM = {
  A: { x: 26, base: 348, h: 70, flip: true },
  B: { x: 366, base: 344, h: 72, flip: false }
} as const;
/** The coconut in the palm crown (% of the palm box, as drawn, unmirrored), 24u. */
export const COCONUT_POS = [46, 34] as const;
export const COCONUT_U = 24;
/** palm.webp is 320 × 302. */
export const PALM_AR = 320 / 302;

/** Villagers (§S.8): feet at y 286, 94u tall, standing in front of their own tree. */
export const VILLAGER = { foot: 286, h: 94 };

/** Jar (§S.6): centred at x 195, base y 266. */
export const JAR = { x: 195, base: 266 };

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
export const HEDGE_X = [28, 62, 96, 128, 262, 294, 326, 360];

/** Flower beds (§S.7): [left back, left front], [right back, right front]. NH flowers keep blooming
 *  under snow (A13), so winter keeps red roses and pansies, with snow caps, on the snow mounds. */
export const BEDS: Record<Season, [FlowerId, FlowerId, FlowerId, FlowerId]> = {
  spring: ['pink-tulips', 'yellow-tulips', 'blue-hyacinths', 'white-windflowers'],
  summer: ['red-roses', 'yellow-roses', 'pink-lilies', 'lily-of-the-valley'],
  autumn: ['pink-cosmos', 'white-cosmos', 'purple-mums', 'orange-pansies'],
  winter: ['red-roses', 'orange-pansies', 'orange-pansies', 'red-roses']
};
export const BED_X = { left: [134, 150, 166], right: [224, 240, 256] };
export const BED_ROWS = [292, 306];

/** Ground extras per season: [item, x, base, size u, rotate deg]. */
export const EXTRAS: Record<Season, [SeasonItem, number, number, number, number][]> = {
  spring: [['petal', 118, 196, 12, 30], ['petal', 262, 222, 12, -40], ['petal', 330, 280, 12, 70]],
  summer: [],
  autumn: [
    ['mushroom', 22, 154, 14, 0], ['mushroom', 40, 156, 14, 0], ['mushroom', 58, 153, 14, 0],
    ['acorn', 60, 244, 12, 0], ['acorn', 112, 246, 12, 20], ['acorn', 280, 244, 12, -20], ['acorn', 334, 246, 12, 0]
  ],
  winter: [['pine-cone', 66, 156, 13, 0], ['pine-cone', 14, 160, 13, 20]]
};

/** Back row + beach props (§S.6, §S.5). `evening` = from 16:00 (dusk / night). */
export function props(season: Season, tod: Tod, month: number): Prop[] {
  const winter = season === 'winter';
  const evening = tod === 'dusk' || tod === 'night';
  const night = tod === 'night';
  const fence: DecoId = winter ? 'fence-log' : 'fence-wood';
  const [b1, b2] = hedgePair(season, month);
  const list: Prop[] = [
    winter
      ? { key: 'trees/oak-winter', h: 84, x: 34, base: 150, z: 21, eager: true }
      : { key: 'trees/cedar', h: 118, x: 40, base: 150, z: 21, eager: true },
    ...HEDGE_X.map((x, i) => ({ key: `bushes/${i % 2 ? b2 : b1}`, h: 30, x, base: 82, z: 20, flip: i % 3 === 1 })),
    { key: 'deco/resident-services', h: 66, x: 195, base: 106, z: 20, eager: true },
    ...[136, 158, 232, 254].map((x) => ({ key: `deco/${fence}`, h: 22, x, base: 114, z: 22 })),
    { key: 'deco/mailbox', h: 22, x: 226, base: 136, z: 22 },
    (season === 'autumn' || winter) && evening
      ? { key: 'deco/bonfire', h: 26, x: 140, base: 168, z: 22, cls: 'bonfire' }
      : { key: 'deco/log-bench', h: 24, x: 140, base: 168, z: 22 },
    { key: 'deco/rock', h: 18, x: 352, base: 162, z: 22 },
    // distant islet palm (the sand is drawn in the SVG)
    { key: 'trees/palm-sm', h: 26, x: 345, base: 14, z: 11, cls: 'islet' },
    // front palms on the beach corners (each carries its person's coconut, FruitTree)
    ...(['A', 'B'] as const).map((p) => ({ key: 'trees/palm', h: PALM[p].h, x: PALM[p].x, base: PALM[p].base, z: 45, flip: PALM[p].flip }))
  ];
  if (night) {
    list.push(
      { key: 'deco/star-fragment', h: 16, x: 150, base: 338, z: 12, cls: 'glow' },
      { key: 'deco/star-fragment', h: 16, x: 300, base: 330, z: 12, cls: 'glow' },
      { key: 'deco/conch', h: 15, x: 214, base: 346, z: 12 }
    );
  } else {
    list.push(
      { key: 'deco/sand-dollar', h: 14, x: 112, base: 332, z: 12 },
      // a second sand dollar, not the cowrie: one art file fewer at first paint (≤ 30, §S.13)
      { key: 'deco/sand-dollar', h: 12, x: 268, base: 338, z: 12, flip: true },
      { key: 'deco/conch', h: 15, x: 214, base: 346, z: 12 }
    );
  }
  return list;
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

/**
 * A rounded rectangle whose edge wobbles by ±amp (hand-drawn feel), as a smooth closed SVG path.
 * Points are sampled along the perimeter, pushed along the outward normal by a low-frequency
 * deterministic wave, then joined with Catmull-Rom curves.
 */
export function wobblyRect(x: number, y: number, w: number, h: number, r: number, amp: number, seed = 1, n = 64): string {
  const straightW = w - 2 * r;
  const straightH = h - 2 * r;
  const arc = (Math.PI / 2) * r;
  const per = 2 * straightW + 2 * straightH + 4 * arc;
  const rand = rng(seed);
  const ph = [rand() * 6.28, rand() * 6.28];
  const pts: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    let d = (i / n) * per;
    let px = 0, py = 0, nx = 0, ny = 0;
    const seg = (len: number) => (d < len ? true : ((d -= len), false));
    if (seg(straightW)) { px = x + r + d; py = y; nx = 0; ny = -1; }
    else if (seg(arc)) { const a = -Math.PI / 2 + d / r; px = x + w - r + Math.cos(a) * r; py = y + r + Math.sin(a) * r; nx = Math.cos(a); ny = Math.sin(a); }
    else if (seg(straightH)) { px = x + w; py = y + r + d; nx = 1; ny = 0; }
    else if (seg(arc)) { const a = d / r; px = x + w - r + Math.cos(a) * r; py = y + h - r + Math.sin(a) * r; nx = Math.cos(a); ny = Math.sin(a); }
    else if (seg(straightW)) { px = x + w - r - d; py = y + h; nx = 0; ny = 1; }
    else if (seg(arc)) { const a = Math.PI / 2 + d / r; px = x + r + Math.cos(a) * r; py = y + h - r + Math.sin(a) * r; nx = Math.cos(a); ny = Math.sin(a); }
    else if (seg(straightH)) { px = x; py = y + h - r - d; nx = -1; ny = 0; }
    else { const a = Math.PI + Math.min(d, arc) / r; px = x + r + Math.cos(a) * r; py = y + r + Math.sin(a) * r; nx = Math.cos(a); ny = Math.sin(a); }
    const t = (i / n) * Math.PI * 2;
    const off = amp * (0.6 * Math.sin(t * 5 + ph[0]) + 0.4 * Math.sin(t * 11 + ph[1]));
    pts.push([px + nx * off, py + ny * off]);
  }
  const f = (v: number) => v.toFixed(1);
  let dStr = `M${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    dStr += ` C${f(c1[0])} ${f(c1[1])} ${f(c2[0])} ${f(c2[1])} ${f(p2[0])} ${f(p2[1])}`;
  }
  return dStr + ' Z';
}

/** Scalloped wave crest: `n` small arcs of radius r starting at x0, y. */
export function waveCrest(x0: number, y: number, n: number, r = 6): string {
  let d = `M${x0} ${y}`;
  for (let i = 0; i < n; i++) d += ` a${r} ${r * 0.7} 0 0 1 ${r * 2} 0`;
  return d;
}

/** 4-point sparkle star centred at (x, y), size s. */
export function star4(x: number, y: number, s: number): string {
  const h = s / 2, k = s * 0.12;
  return `M${x} ${y - h} Q${x + k} ${y - k} ${x + h} ${y} Q${x + k} ${y + k} ${x} ${y + h} Q${x - k} ${y + k} ${x - h} ${y} Q${x - k} ${y - k} ${x} ${y - h} Z`;
}
