// Island scene data (design.md "Island scene"): sizes and season tables. Where things stand is world.ts (the rolling
// world's coordinates); this keeps what every scene shares besides: the unit helpers, the sizes measured against the
// villager (NH's scale), the wild flowers' and the hedge's species by season, the fruit's spots around a tree, the dated events.
import type { Season } from '#lib/ui-state/theme.svelte.ts';
import type { BushId, FlowerId, FlowerKind } from '#lib/art.ts';
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

/** The cedar's and the campsite's snowy looks (NH's own snowy models: scripts/models.ts; the other renders' -winter
 *  looks Scenery picks itself). */
const WINTER_ART: Record<string, string> = { 'trees/cedar': 'trees/cedar-winter', 'deco/campsite': 'deco/campsite-winter' };
/** A scenery key resolved for the day: the month's bushes (`month-bush-a|b`: hedgePair), the winter look of a cedar
 *  or a building. */
export function sceneryKey(key: string, season: Season, month: number): string {
  if (key === 'month-bush-a' || key === 'month-bush-b') return `bushes/${hedgePair(month)[key.endsWith('a') ? 0 : 1]}`;
  return (season === 'winter' && WINTER_ART[key]) || key;
}
/** A building's lit windows at dusk and night (its render's emissive look: scripts/models.ts; laid over it above the
 *  time-of-day tint). */
export const LIT_ART: Record<string, string> = { 'deco/campsite': 'deco/campsite-lit' };
/** The lamps that glow at night (deco/lamp-glow), and where the light hangs: a share of the lamp's height. */
/** The fires (the campfire by the tent): lit at dusk and night (their render's -lit look, flickering, a warm halo and
 *  a pool of light), and where the flames' light sits: a share of the fire's height. */
export const FIRE_AT: Record<string, number> = { 'deco/campfire': 0.42 };
export const GLOW_AT: Record<string, number> = { 'deco/streetlamp': 0.9, 'deco/garden-lantern': 0.62, 'deco/garden-lantern-white': 0.62 };

/** The wild flowers' kinds by season (world.ts FLOWERS: a clump is one kind, clumps take the list in turn), NH's
 *  flowers blooming in their months: spring tulips and hyacinths, summer lilies and roses, autumn cosmos and mums,
 *  winter pansies and windflowers (NH's flowers bloom on under the snow). A flower ≈ 0.4 × a villager. */
export const WILD: Record<Season, readonly FlowerId[]> = {
  spring: ['red-tulips', 'white-hyacinths', 'yellow-tulips', 'pink-hyacinths', 'white-tulips', 'purple-hyacinths', 'pink-tulips'],
  summer: ['white-lilies', 'red-roses', 'orange-lilies', 'white-roses', 'pink-lilies', 'yellow-lilies', 'pink-roses'],
  autumn: ['pink-cosmos', 'yellow-mums', 'white-cosmos', 'purple-mums', 'red-cosmos', 'white-mums', 'yellow-cosmos', 'red-mums'],
  winter: ['white-pansies', 'red-windflowers', 'yellow-pansies', 'purple-windflowers', 'orange-pansies', 'white-windflowers', 'red-pansies']
};
/** A wild flower's kind this season (its clump's). */
export const wildFlower = (f: { clump: number }, season: Season): FlowerId => WILD[season][f.clump % WILD[season].length];
export const FLOWER_U = 30;
/** Per-kind height (pansies, windflowers and mums grow low, lilies tall). */
const KIND_SCALE: Partial<Record<FlowerKind, number>> = { pansies: 0.8, windflowers: 0.86, mums: 0.92, lilies: 1.06 };
export const flowerScale = (id: FlowerId): number => KIND_SCALE[id.slice(id.indexOf('-') + 1) as FlowerKind] ?? 1;

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
