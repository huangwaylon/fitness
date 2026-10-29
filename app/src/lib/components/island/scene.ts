// Island scene v4 data (style guide §S): stage coordinates and season tables. Stage units (u):
// x 0–390, y 0–360, origin top-left, y down; "base" = the y of the feet / trunk bottom.
import type { Season } from '#lib/client/theme.svelte.ts';
import type { BushId, FlowerId } from '../art.ts';

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
/** v5 §7: four bushes (was eight), two each side of Resident Services. */
export const HEDGE_X = [96, 132, 258, 294];

/** Flower beds (§S.7): [left back, left front], [right back, right front]. NH flowers keep blooming
 *  under snow (A13), so winter keeps red roses and pansies, with snow caps, on the snow mounds. */
export const BEDS: Record<Season, [FlowerId, FlowerId, FlowerId, FlowerId]> = {
  spring: ['pink-tulips', 'yellow-tulips', 'blue-hyacinths', 'white-windflowers'],
  summer: ['red-roses', 'yellow-roses', 'pink-lilies', 'lily-of-the-valley'],
  autumn: ['pink-cosmos', 'white-cosmos', 'purple-mums', 'orange-pansies'],
  winter: ['red-roses', 'orange-pansies', 'orange-pansies', 'red-roses']
};
/** v5: two flowers per row (was three), moved out so the jar plate sits clear between the beds. */
export const BED_X = { left: [124, 142], right: [248, 266] };
/** v5: one row per bed (was two), so the scene stays ≤ 45 images. */
export const BED_ROWS = [300];

/** Back row + beach props (§S.6, v5 §7: no fences, rock, mailbox, shells or star fragments). `evening` = from 16:00 (dusk / night). */
export function props(season: Season, tod: Tod, month: number): Prop[] {
  const winter = season === 'winter';
  const evening = tod === 'dusk' || tod === 'night';
  const [b1, b2] = hedgePair(season, month);
  const list: Prop[] = [
    // the evergreen cedar stays all year (winter used a snowy oak here, but the orchards are already
    // snowy hardwoods; a fourth one crowded the left side)
    { key: 'trees/cedar', h: 118, x: 40, base: 150, z: 21, eager: true },
    ...HEDGE_X.map((x, i) => ({ key: `bushes/${i % 2 ? b2 : b1}`, h: 30, x, base: 82, z: 20, flip: i % 3 === 1 })),
    { key: 'deco/resident-services', h: 66, x: 195, base: 106, z: 20, eager: true },
    (season === 'autumn' || winter) && evening
      ? { key: 'deco/bonfire', h: 26, x: 140, base: 168, z: 22, cls: 'bonfire' }
      : { key: 'deco/log-bench', h: 24, x: 140, base: 168, z: 22 },
    // distant islet palm (the sand is drawn in the SVG)
    { key: 'trees/palm-sm', h: 26, x: 345, base: 14, z: 11, cls: 'islet' },
    // front palms on the beach corners (each carries its person's coconut, FruitTree)
    ...(['A', 'B'] as const).map((p) => ({ key: 'trees/palm', h: PALM[p].h, x: PALM[p].x, base: PALM[p].base, z: 45, flip: PALM[p].flip }))
  ];
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
