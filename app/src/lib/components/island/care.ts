// Island care (docs/design.md "Island care"): weeds that sprout over the day, the hybrid a watered flower can grow the
// next day, the rock by the hedge. Pure and seeded by the date (daySeed.ts dayRand), so both phones see the same weeds
// and hybrids; what either pulled or watered is gone or glitters on both (the shared day's claims and `watered`, kept
// by Care.svelte). No ベル, no find.
import { pickOne } from '#lib/random.ts';
import type { FlowerId, FlowerKind } from '#lib/art.ts';
import { spotsOn } from './beach.ts';
import { ROCK as W_ROCK } from './world.ts';
import { ISLAND_SEED, dayRand } from './daySeed.ts';

/** A weed sprouts on any free spot of the lawn (beach.ts spotsOn: the day's lawn; a dig spot takes its spot first). */
/** A weed sprouts every 30–60 minutes of the day (the first after 15–30); the lawn holds the newest three. */
const WEED_GAP: readonly [number, number] = [30 * 60_000, 60 * 60_000];
export const MAX_WEEDS = 3;

export interface Weed { uid: string; x: number; y: number; flip: boolean; at: number }

/** The weeds on the lawn at `ms` (after Tokyo midnight): the newest MAX_WEEDS to have sprouted, each on its own spot
 *  and none on a spot taken (`taken`: `x,y` of the dig spots showing). */
export function weedsAt(date: string, ms: number, seed = ISLAND_SEED, taken: ReadonlySet<string> = new Set()): Weed[] {
  const r = dayRand(date, 'weeds', seed);
  const times: number[] = [];
  for (let t = (WEED_GAP[0] + r() * (WEED_GAP[1] - WEED_GAP[0])) / 2; t <= ms; t += WEED_GAP[0] + r() * (WEED_GAP[1] - WEED_GAP[0])) times.push(Math.round(t));
  const recent = times.slice(-MAX_WEEDS);
  const WEED_SPOTS = spotsOn(date, seed).lawn;
  const used = new Set(WEED_SPOTS.flatMap(([x, y], i) => (taken.has(`${x},${y}`) ? [i] : [])));
  return recent.flatMap((at) => {
    const s = dayRand(date, `weed@${at}`, seed);
    if (used.size >= WEED_SPOTS.length) return [];
    let i = Math.floor(s() * WEED_SPOTS.length);
    while (used.has(i)) i = (i + 1) % WEED_SPOTS.length;
    used.add(i);
    return [{ uid: `w${at}`, x: WEED_SPOTS[i][0], y: WEED_SPOTS[i][1], flip: s() < 0.5, at }];
  });
}

/** NH's hybrids (simplified genetics): the rarer colours of each kind a watered flower can give. */
const HYBRIDS: Record<FlowerKind, readonly FlowerId[]> = {
  tulips: ['purple-tulips', 'black-tulips', 'orange-tulips'],
  roses: ['black-roses', 'orange-roses', 'pink-roses', 'purple-roses', 'blue-roses'],
  cosmos: ['orange-cosmos', 'black-cosmos'],
  mums: ['pink-mums', 'green-mums', 'purple-mums'],
  lilies: ['orange-lilies', 'pink-lilies'],
  pansies: ['blue-pansies', 'purple-pansies', 'orange-pansies'],
  hyacinths: ['purple-hyacinths', 'pink-hyacinths'],
  windflowers: ['purple-windflowers', 'red-windflowers']
};
/** The hybrid colours a flower can give (never its own). */
export const hybridsOf = (id: FlowerId): FlowerId[] => (HYBRIDS[id.slice(id.indexOf('-') + 1) as FlowerKind] ?? []).filter((h) => h !== id);
/** "Rarely": the chance a day after watering brings a hybrid. */
export const HYBRID_ODDS = 0.25;

export interface Hybrid { id: string; flower: string }

/** The hybrid that shows on `date` given the flowers (ids) watered the day before and each one's kind: 1 in 4, on one
 *  watered flower, a colour its kind can give. Null otherwise. */
export function hybridFor(date: string, wateredYesterday: readonly string[], kindOf: (id: string) => FlowerId, seed = ISLAND_SEED): Hybrid | null {
  if (!wateredYesterday.length) return null;
  const r = dayRand(date, 'hybrid', seed);
  if (r() >= HYBRID_ODDS) return null;
  const id = [...wateredYesterday].sort()[Math.floor(r() * wateredYesterday.length)];
  const options = hybridsOf(kindOf(id));
  return options.length ? { id, flower: pickOne(options, r) } : null;
}

/** A tap on the rock by the hedge: a clonk, 1 in 4 a sparkle (NH's money rock, without the money), 1 in 8 a pill bug
 *  or a centipede crawls out from under it (NH: hit a rock). */
export function rockTap(r: () => number): 'clonk' | 'sparkle' | 'bug' {
  const x = r();
  return x < 0.125 ? 'bug' : x < 0.375 ? 'sparkle' : 'clonk';
}
/** The rock (world.ts ROCK: on the health lawn behind the left tree; y = the world's z), 22u tall. */
export const ROCK = { get x() { return W_ROCK[0]; }, get y() { return W_ROCK[1]; }, h: 22 } as const;
