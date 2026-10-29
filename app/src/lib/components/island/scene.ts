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

/** Villagers (§S.8): feet at y 302, 94u tall, on the inside of their trees, flanking the jar (their heads
 *  stay below the ground fruit and the jar's base). */
export const VILLAGER = { foot: 302, h: 94, x: { A: 148, B: 242 } as const };

/** Jar (§S.6, round 6): the plaza centrepiece, ~55% down the island on a round sand patch; 56u wide
 *  (70u tall ≈ 75px at 393). */
export const JAR = { x: 195, base: 204, w: 56 };

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

/** Round 6: one tidy hedge along the back edge, eight bushes at an even pitch (no building, no path). */
export const HEDGE_X = Array.from({ length: 8 }, (_, i) => 56 + i * 40);
export const HEDGE_BASE = 84;
/** The plateau's top edge (grass), in u. */
export const PLATEAU_TOP = 50;
/** The plateau's front edge (grass), in u: a shallow beach strip below it. */
export const PLATEAU_BOTTOM = 318;

/** Flowers (§S.7): two kinds per side, alternating. NH flowers keep blooming under snow (A13), so
 *  winter keeps red roses and pansies, with snow caps, on snow mounds. */
export const BEDS: Record<Season, [FlowerId, FlowerId, FlowerId, FlowerId]> = {
  spring: ['pink-tulips', 'yellow-tulips', 'blue-hyacinths', 'white-windflowers'],
  summer: ['red-roses', 'yellow-roses', 'pink-lilies', 'lily-of-the-valley'],
  autumn: ['pink-cosmos', 'white-cosmos', 'purple-mums', 'orange-pansies'],
  winter: ['red-roses', 'orange-pansies', 'orange-pansies', 'red-roses']
};
/** Round 6: one long front row along the plateau's front edge, 8 a side at a 20u pitch, framing the island. */
export const BED_X = {
  left: Array.from({ length: 8 }, (_, i) => 44 + i * 20),
  right: Array.from({ length: 8 }, (_, i) => 206 + i * 20)
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
