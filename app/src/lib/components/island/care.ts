// Island care (docs/design.md "Island care"): weeds that sprout over the day, the flower beds' watering and the hybrid
// a watered bed can grow the next day, the rock by the hedge. Pure and seeded by the date (beach.ts dayRand), so both
// phones broadly see the same weeds and hybrids; what a phone pulled or watered is its own (sceneDay.ts). Nothing here
// counts for anything: no ベル, no find.
import type { FlowerId } from '#lib/art.ts';
import { ISLAND_SEED, LAWN, dayRand } from './beach.ts';

/** A weed sprouts on any free spot of the lawn (beach.ts LAWN: a dig spot takes its spot first). */
const WEED_SPOTS = LAWN;
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

/** NH's hybrids a bed's flower can give (simplified genetics): the colours a watered bed of each can grow. */
export const HYBRIDS: Record<FlowerId, readonly string[]> = {
  'red-tulips': ['purple-tulips', 'black-tulips', 'orange-tulips'],
  'yellow-tulips': ['orange-tulips', 'purple-tulips'],
  'red-roses': ['black-roses', 'orange-roses', 'pink-roses'],
  'white-roses': ['purple-roses', 'pink-roses', 'blue-roses'],
  'pink-cosmos': ['orange-cosmos', 'black-cosmos'],
  'purple-mums': ['pink-mums', 'green-mums'],
  'orange-pansies': ['blue-pansies', 'purple-pansies']
};
/** "Rarely": the chance a day after watering brings a hybrid. */
export const HYBRID_ODDS = 0.25;

export interface Hybrid { cell: string; flower: string }

/** The hybrid that shows on `date` given the cells (`row-col`) watered the day before and each row's flower: 1 in 4, in
 *  one watered cell, a colour that flower can give. Null otherwise. */
export function hybridFor(date: string, wateredYesterday: readonly string[], rowFlower: (row: number) => FlowerId, seed = ISLAND_SEED): Hybrid | null {
  if (!wateredYesterday.length) return null;
  const r = dayRand(date, 'hybrid', seed);
  if (r() >= HYBRID_ODDS) return null;
  const cell = [...wateredYesterday].sort()[Math.floor(r() * wateredYesterday.length)];
  const options = HYBRIDS[rowFlower(Number(cell.split('-')[0]))];
  return { cell, flower: options[Math.floor(r() * options.length)] };
}

/** A tap on the rock by the hedge: a clonk, 1 in 4 a sparkle (NH's money rock, without the money), 1 in 8 a pill bug
 *  or a centipede crawls out from under it (NH: hit a rock). */
export function rockTap(r: () => number): 'clonk' | 'sparkle' | 'bug' {
  const x = r();
  return x < 0.125 ? 'bug' : x < 0.375 ? 'sparkle' : 'clonk';
}
/** The rock's place (stage units): on the lawn in front of the hedge, by the jar's lid. */
export const ROCK = { x: 175, y: 101, h: 15 } as const;
