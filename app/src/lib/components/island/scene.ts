// Island scene data (design.md "Island scene"): sizes and season tables. Where things stand is world.ts (the rolling
// world's coordinates); this keeps what every scene shares besides: the unit helpers, the sizes measured against the
// villager (NH's scale), the beds' and the hedge's species by season, the fruit's spots around a tree, the dated events.
import type { Season } from '#lib/ui-state/theme.svelte.ts';
import type { BushId, FlowerId } from '#lib/art.ts';
import type { RingFruit } from '#lib/types.ts';
import { jst } from '#lib/time/clock.ts';

/** World units → CSS length (relative to the stage's width: 390 units across at the pivot; the stage is the container). */
export const u = (n: number): string => `${((n * 100) / 390).toFixed(3)}cqw`;
/** World units → CSS length through `--su` (one unit, set on the stage). */
export const su = (n: number): string => `calc(${n.toFixed(1)} * var(--su))`;

export type Tod = 'dawn' | 'day' | 'dusk' | 'night';

/** One goal tree per person: a plain official hardwood of the season (world.ts GOAL_TREES), NH hardwood ≈ 1.5 × a
 *  villager tall. Today's four fruits hang in its canopy (TREE_FRUIT) and drop to the ground in front of the trunk once
 *  met (FRUIT_SPOTS). */
export const TREE = { h: 120 } as const;
/** The seasonal hardwood renders are 329 × 409 (summer 509 × 640: the same shape). */
export const OAK_AR = 329 / 409;
/** Fruit hanging in the canopy, 🍐 🍑 🍒 🍎 left to right (RING_FRUITS order): [dx, up] of each item's centre from the
 *  trunk base (units across, units up), on the canopy's lower front like NH's three, in a loose arc. */
export const TREE_FRUIT: [number, number][] = [[-27, 56], [-10, 68], [10, 62], [27, 54]];
/** A hanging fruit is a little smaller than one on the ground (the canopy is further back). */
export const TREE_FRUIT_U = 20;
/** Fruit on the ground, once met: [dx, dz] from the trunk base (dz < 0: in front of it), in a fixed arc, 🍐 🍑 🍒 🍎
 *  left to right, 20u apart, leaning FRUIT_LEAN u out from the island's middle. */
export const FRUIT_SPOTS: [number, number][] = [[-30, -8], [-10, -16], [10, -16], [30, -8]];
export const FRUIT_LEAN = 8;
/** Ground item size in u: NH dropped fruit ≈ 0.3 × a villager (≈ half a tile). */
export const FRUIT_U = 24;
/** Villagers (the scale's reference): 80u tall. */
export const VILLAGER = { h: 80 } as const;
/** A hedge bush ≈ 0.5 × a villager. */
export const BUSH_U = 40;

/** The hedge's species of the month (NH flowering seasons, northern hemisphere): one species per hedge,
 *  its two colours alternating (how NH players plant a tidy hedge). Spring azaleas, June hydrangeas,
 *  Jul–Aug hibiscus, Sep–Oct tea olive, Nov–Dec holly, Jan–Mar camellias. */
export function hedgePair(month: number): [BushId, BushId] {
  if (month >= 4 && month <= 5) return ['pink-azalea', 'white-azalea'];
  if (month === 6) return ['blue-hydrangea', 'pink-hydrangea'];
  if (month >= 7 && month <= 8) return ['red-hibiscus', 'yellow-hibiscus'];
  if (month >= 9 && month <= 10) return ['orange-tea-olive', 'yellow-tea-olive'];
  if (month >= 11) return ['holly', 'holly'];
  return ['pink-camellia', 'red-camellia'];
}

/** The meadow's clumps (world.ts `meadow-<i>`): NH flowers growing wild, the season's species in turn (NH's flowers
 *  bloom on under the snow, so winter keeps its pansies and windflowers). */
export const MEADOW: Record<Season, readonly string[]> = {
  spring: ['flowers/pink-hyacinths', 'flowers/white-tulips', 'flowers/purple-hyacinths', 'flowers/pink-tulips', 'flowers/white-hyacinths'],
  summer: ['flowers/white-lilies', 'flowers/orange-lilies', 'flowers/pink-lilies', 'flowers/yellow-lilies'],
  autumn: ['flowers/white-cosmos', 'flowers/yellow-mums', 'flowers/red-cosmos', 'flowers/white-mums', 'flowers/yellow-cosmos', 'flowers/red-mums'],
  winter: ['flowers/white-pansies', 'flowers/red-windflowers', 'flowers/yellow-pansies', 'flowers/purple-windflowers', 'flowers/red-pansies', 'flowers/white-windflowers']
};
/** NH has no snowy renders of the cedar and the campsite: scripts/derive-art.ts derives these from them. */
const WINTER_ART: Record<string, string> = { 'trees/cedar': 'trees/cedar-winter', 'deco/campsite': 'deco/campsite-winter' };
/** A scenery key resolved for the day: a meadow clump's flower, the month's bushes (`month-bush-a|b`: hedgePair), the
 *  winter look of a cedar or a building. */
export function sceneryKey(key: string, season: Season, month: number): string {
  const m = /^meadow-(\d+)$/.exec(key);
  if (m) {
    const list = MEADOW[season], i = Number(m[1]);
    return list[(i * 2 + (i >> 1)) % list.length];
  }
  if (key === 'month-bush-a' || key === 'month-bush-b') return `bushes/${hedgePair(month)[key.endsWith('a') ? 0 : 1]}`;
  return (season === 'winter' && WINTER_ART[key]) || key;
}
/** A building's lit windows at dusk and night (scripts/derive-art.ts derives them from its render; laid over it above the
 *  time-of-day tint). */
export const LIT_ART: Record<string, string> = { 'deco/campsite': 'deco/campsite-lit' };
/** The lamps that glow at night (deco/lamp-glow), and where the light hangs: a share of the lamp's height. */
export const GLOW_AT: Record<string, number> = { 'deco/streetlamp': 0.9, 'deco/garden-lantern': 0.62, 'deco/garden-lantern-white': 0.62 };

/** Flower beds: two tidy 2 × 2 beds beside the villagers' homes, one flower per tile, the back row one species and
 *  the front row another, as NH players plan a bed. NH flowers keep blooming under snow, so winter keeps roses and
 *  pansies, on snow mounds. A flower ≈ 0.4 × a villager. */
export const BEDS: Record<Season, { back: FlowerId; front: FlowerId }> = {
  spring: { back: 'red-tulips', front: 'yellow-tulips' },
  summer: { back: 'red-roses', front: 'white-roses' },
  autumn: { back: 'pink-cosmos', front: 'purple-mums' },
  winter: { back: 'red-roses', front: 'orange-pansies' }
};
export const FLOWER_U = 30;
/** Per-species height (pansies and mums grow low). */
export const FLOWER_SCALE: Partial<Record<FlowerId, number>> = { 'orange-pansies': 0.8, 'purple-mums': 0.92 };
/** Each bed is its person's goal flowers (the bed beside their villager), one per goal in reading order, the same in
 *  both beds: 🍐 Move back-left, 🍑 Exercise back-right, 🍒 Stand front-left, 🍎 Steps front-right. `BED_FRUIT[row][k]`,
 *  row 0 the back (world.ts BED_ZS[0]), k = 0 for the bed's left column, 1 for its right. */
export const BED_FRUIT: [RingFruit, RingFruit][] = [['pear', 'peach'], ['cherry', 'apple']];

/** Halloween's pumpkins, 22u. */
export const PUMPKIN_U = 22;

/** Japan-date events (design.md "Particles and events"). */
export interface Events {
  cherry: boolean;
  maple: boolean;
  toyDay: boolean;
}
/** (The fireworks keep their own schedule: fireworks.ts.) */
export function eventsAt(d: Date): Events {
  const { month: m, day } = jst(d);
  return {
    cherry: m === 4 && day <= 10,
    maple: m === 11 && day >= 16 && day <= 25,
    toyDay: m === 12 && day === 24
  };
}
