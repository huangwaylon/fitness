// The critters' small helpers the island's first load needs (docs/design.md "Scene interactions"): a span of hours, the
// spider's, where a cast lands and on which water, the trunks a bug perches on, a catch's icon and a list's name. Their
// tables and rules (critters.ts: ~5.3 KB gzipped) load with the first critter, a shaken tree's catch or a sheet that
// lists them. Pure, like critters.ts.

import type { Catch, Perch } from './critters.ts';
import { GOAL_TREES, SCENERY, TREE_H, freshWhere, surfaceAt, type FreshWhere } from './world.ts';

/** Inside [from, to) of the day, wrapping past midnight when to < from. */
export function inHours([from, to]: readonly [number, number], h: number): boolean {
  return from <= to ? h >= from && h < to : h >= from || h < to;
}
/** The spider's hours, Tokyo time (critters.ts BUGS: it dangles from a shaken tree at night, treeShake.ts). */
export const SPIDER_HOURS = [19, 8] as const;

/** Per slot, the chance the front sea's bubbles (a spot to dive at: world/sea.ts) come when none are there: their own
 *  channel (island/ambient.ts), beside the front's shadow, about as many a day as when they took 1 sea turn in 4. */
export const BUBBLE_ODDS = 0.07;

/** Where a shadow swims (world.ts): the sea in front of the front beach, or a fresh water by NH's locations: the pond,
 *  the river, the river mouth (the wide reach on the west beach), the clifftop (the falls' pool and above). */
export type Water = 'sea' | FreshWhere;

/** How far round the water's edge a tap still casts into it (u: a finger's slack round a small pond or a narrow
 *  river), and how far in from the edge a float lands (u). */
export const WATER_REACH = 12;
const EDGE_U = 8;

/** The water at world (x, z): the island's own tiles say (world.ts surfaceAt: the one answer to "is this water", the
 *  ground's, the walk's and the taps'), the sea or a fresh water by NH's locations (freshWhere); null: land, a bridge.
 *  `reach` > 0: else the nearest water within it (a finger's slack round a bank); < 0: only where all of it within
 *  −reach is water it swims on (sameWater: clear of its banks). */
export function waterAt(x: number, z: number, reach = 0): Water | null {
  const at = (px: number, pz: number): Water | null => {
    const s = surfaceAt(px, pz);
    return s === 'sea' ? 'sea' : s === 'water' ? freshWhere(px, pz) : null;
  };
  const here = at(x, z);
  if (reach < 0) return here && ring(-reach).every(([dx, dz]) => ((w) => !!w && sameWater(here, w))(at(x + dx, z + dz))) ? here : null;
  if (here || reach === 0) return here;
  for (let r = 4; r <= reach; r += 4) for (const [dx, dz] of ring(r)) { const w = at(x + dx, z + dz); if (w) return w; }
  return null;
}
/** Twelve points round a circle of radius r. */
const ring = (r: number): [number, number][] => Array.from({ length: 12 }, (_, i) => [Math.cos((i / 12) * Math.PI * 2) * r, Math.sin((i / 12) * Math.PI * 2) * r]);

/** Where a cast at world (x, z) lands, and on which water: the water there or the nearest within a finger's slack
 *  (WATER_REACH), drawn in from its edge by EDGE_U where there's room (NH's float never lands on the bank); null: no
 *  water there. */
export function landing(x: number, z: number): { x: number; z: number; water: Water } | null {
  let px = x, pz = z, w = waterAt(x, z);
  for (let r = 4; !w && r <= WATER_REACH; r += 4) {
    const wet = ring(r).find(([dx, dz]) => waterAt(x + dx, z + dz));
    if (wet) [px, pz, w] = [x + wet[0], z + wet[1], waterAt(x + wet[0], z + wet[1])];
  }
  if (!w) return null;
  // in from the edge: away from the dry points round it, a few steps
  for (let i = 0; i < 4; i++) {
    const dry = ring(EDGE_U).filter(([dx, dz]) => waterAt(px + dx, pz + dz) !== w);
    const sx = dry.reduce((a, [dx]) => a + dx, 0), sz = dry.reduce((a, [, dz]) => a + dz, 0), len = Math.hypot(sx, sz);
    if (!dry.length || len < 1e-6) break;
    const qx = px - (sx / len) * 3, qz = pz - (sz / len) * 3;
    if (waterAt(qx, qz) !== w) break;
    [px, pz] = [qx, qz];
  }
  return { x: px, z: pz, water: w };
}

/** The waters a shadow swims between to a float: its own, and the river's lower reach with its mouth (one channel). */
export const sameWater = (a: Water, b: Water): boolean => a === b || ((a === 'river' || a === 'mouth') && (b === 'river' || b === 'mouth'));

/** The trunks: NH's palm beetles on the palms; every other percher on the goal trees, the oaks and the cedars (their
 *  bare trunk under the leaves: an oak's lower half, a cedar's bottom third, a palm's lower third). */
export function perches(palm: boolean): Perch[] {
  if (palm)
    return SCENERY.filter((s) => s.kind === 'palm').map((s) => ({ tree: s.id, kind: 'palm' as const, x: s.x, z: s.z, lift: s.h * 0.3, dx: (s.flip ? -1 : 1) * s.h * 0.03, h: s.h }));
  const goal = (['A', 'B'] as const).map((k) => ({ tree: `goal-${k}`, kind: 'oak' as const, x: GOAL_TREES[k][0], z: GOAL_TREES[k][1], lift: TREE_H * 0.28, dx: 0, h: TREE_H }));
  const scenery = SCENERY.filter((s) => s.kind === 'oak' || s.kind === 'cedar').map((s) => ({ tree: s.id, kind: s.kind as 'oak' | 'cedar', x: s.x, z: s.z, lift: s.h * (s.kind === 'oak' ? 0.3 : 0.16), dx: 0, h: s.h }));
  return [...goal, ...scenery];
}

/** The official icon of a catch (static/art/critters/, fetched by scripts/fetch-assets.ts; the sea creatures too). */
export const critterArt = (item: Catch): string => `critters/${item}`;

/** A name as a list shows it: the English catalog's names carry an article for the catch line ("a sea bass"). */
export const bare = (name: string): string => name.replace(/^(an?|some) /, '');
