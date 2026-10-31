// A tree's fruit through one Tokyo day (docs/design.md "Trees"): each goal's fruit hangs in the canopy, grey at 0 and
// filling with colour as today's amount nears the goal; once met it drops to the ground (animated once, on the first
// render that sees it met), and a tap picks it up, gone until the next Tokyo day. Cosmetic only: ベル are computed from
// the goals on read and never from a pick-up. This phone's own record (`fruit-day` in localStorage, sync/storage.ts
// SCENE): the other phone keeps its own, and losing it only puts a fruit back on the ground.
import type { PersonId, RingFruit } from '#lib/types.ts';
import { localKV, readJson, SCENE, writeJson } from '#lib/sync/storage.ts';

/** How grey a fruit on the tree is (CSS grayscale, 0–1) at a share of its goal (0–100): fully grey at 0, full colour
 *  at the goal, linear between, so each bit of progress shows. */
export const greyAt = (pct: number): number => Math.round((1 - Math.max(0, Math.min(100, pct)) / 100) * 100) / 100;

/** The CSS filter of a fruit on the tree at a share of its goal: grayscale by greyAt, washed lighter as it greys (a
 *  dark apple or cherry would otherwise read as a black lump), none at the goal. */
export function fruitFilter(pct: number): string {
  const g = greyAt(pct);
  return g ? `grayscale(${g}) brightness(${(1 + 0.4 * g).toFixed(2)}) contrast(${(1 - 0.3 * g).toFixed(2)})` : 'none';
}

/** One fruit: in the canopy (not met), falling (met, first seen now), on the ground (met, seen) or picked up today. */
export type FruitStage = 'tree' | 'fall' | 'ground' | 'gone';

export interface FruitDay { date: string; dropped: string[]; picked: string[] }

export const fruitId = (p: PersonId, f: RingFruit): string => `${p}:${f}`;

/** This phone's record of `date` (another date, or nothing kept, starts empty). */
export function fruitDay(date: string): FruitDay {
  const d = readJson<FruitDay>(localKV(), SCENE.fruit);
  return d && d.date === date && Array.isArray(d.dropped) && Array.isArray(d.picked) ? d : { date, dropped: [], picked: [] };
}

/** Where a fruit is: `met` today's goal, `day` this phone's record. A met fruit not yet seen dropped falls. */
export function stageOf(id: string, met: boolean, day: FruitDay): FruitStage {
  if (!met) return 'tree';
  if (day.picked.includes(id)) return 'gone';
  return day.dropped.includes(id) ? 'ground' : 'fall';
}

function add(date: string, list: 'dropped' | 'picked', id: string): FruitDay {
  const d = fruitDay(date);
  if (d[list].includes(id)) return d;
  const next = { ...d, [list]: [...d[list], id] };
  writeJson(localKV(), SCENE.fruit, next);
  return next;
}

/** Its drop has been shown (a reload finds it on the ground). */
export const markDropped = (date: string, id: string): FruitDay => add(date, 'dropped', id);
/** Picked up: gone for the rest of `date`. */
export function markPicked(date: string, id: string): FruitDay {
  add(date, 'dropped', id);
  return add(date, 'picked', id);
}
