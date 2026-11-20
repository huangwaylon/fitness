// A tree's fruit through one Tokyo day (docs/design.md "Trees"): each goal's fruit hangs in the canopy, grey at 0 and
// filling with colour as today's amount nears the goal; once met it drops to the ground (animated once, on the first
// render that sees it met), and a tap picks it up, gone until the next Tokyo day; the day all four are met a gold fruit
// falls too. Only the tree's owner picks them up, into their pocket (contract/pocket.ts GOAL_GOODS: かいがら at the
// shop). ベル are computed from the goals on read and never from a pick-up. This phone's own record (`fruit-day` in localStorage, sync/storage.ts
// SCENE): the other phone keeps its own, and losing it only puts a fruit back on the ground.
import type { PersonId, RingFruit } from '#lib/types.ts';
import { localKV, readJson, SCENE, writeJson } from '#lib/sync/storage.ts';
import { RING_FRUITS } from '#lib/config/rules.ts';

/** A tree's fruit: today's four goals' (RING_FRUITS) and the gold one of a day with all four met (2026-11-16). */
export type TreeFruit = RingFruit | 'gold';
/** The gold fruit's art (NH's star fragment, golden; the 3D island's model of the same key). */
export const GOLD_ART = 'finds/star-fragment';
/** Whether a tree's fruit is met today (`met`: a goal's): a goal's fruit when its goal is, the gold one when all four
 *  are. */
export const fruitMet = (f: TreeFruit, met: (g: RingFruit) => boolean): boolean => (f === 'gold' ? RING_FRUITS.every(met) : met(f));
/** What a picked-up fruit puts in the owner's pocket (contract/pocket.ts GOAL_GOODS: 60 a goal's, 150 the gold one). */
export const fruitGoods = (f: TreeFruit): string => (f === 'gold' ? 'gold-fruit' : `goal-${f}`);

/** How grey a fruit on the tree is (CSS grayscale, 0–1) at a share of its goal (0–100): fully grey at 0, full colour
 *  at the goal, linear between, so each bit of progress shows. */
export const greyAt = (pct: number): number => Math.round((1 - Math.max(0, Math.min(100, pct)) / 100) * 100) / 100;

/** One fruit: in the canopy (not met), falling (met, first seen now), on the ground (met, seen) or picked up today. */
type FruitStage = 'tree' | 'fall' | 'ground' | 'gone';

interface FruitDay { date: string; dropped: string[]; picked: string[] }

export const fruitId = (p: PersonId, f: TreeFruit): string => `${p}:${f}`;

/** This phone's record of `date` (another date, or nothing kept, starts empty). */
export function fruitDay(date: string): FruitDay {
  const d = readJson<Partial<FruitDay>>(localKV(), SCENE.fruit);
  if (!d || d.date !== date || !Array.isArray(d.dropped) || !Array.isArray(d.picked)) return { date, dropped: [], picked: [] };
  return { date, dropped: d.dropped, picked: d.picked };
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
