// A tap on a plot (docs/farming.md "Playing"): what it does, in NH's tool-ring order with no tool to equip, acting in
// place (never a walk). Pure: IslandScene does it (store/farm.svelte.ts, the shared world's watering, the plate).
//   1. the shovel armed, on my plant: dig it up (its start back);
//   2. my plant ripe: harvest it, at its yield;
//   3. a plant (anyone's) not watered today: water it and its neighbours;
//   4. my field's empty plot: at the cap say so; plant the held crop (nothing held, or none left: the picker, whose pick
//      plants it);
//   5. else a word: whose plant and how long, or watered already, or whose field.
import { FARM, daysLeft, seedKey, stageOf, yieldOf, type Crop, type FarmSrc, type Plot, type Watered } from '#lib/contract/farm.ts';
import type { LocalDate, Who } from '#lib/types.ts';

export type FarmTap =
  | { a: 'dig'; c: Crop }
  | { a: 'harvest'; c: Crop; n: number }
  | { a: 'water' }
  | { a: 'plant'; c: Crop; src: FarmSrc }
  /** The picker, for this plot (`out`: the held crop, none left of it). */
  | { a: 'pick'; out?: Crop }
  | { a: 'cap' }
  /** A word about it: its plant (whose, which, days to ripe; 0 ripe, another's), or only whose field it is. */
  | { a: 'about'; who: Who; c?: Crop; left?: number; watered?: boolean };

export interface FarmTapIn {
  me: Who;
  /** The plot: its id and whose field it is. */
  plot: { p: string; who: Who };
  /** Its plant, if any. */
  plant?: Plot;
  date: LocalDate;
  watered: Watered;
  shovel: boolean;
  seed: { c: Crop; src: FarmSrc } | null;
  /** How many of a pocket key I hold. */
  have: (key: string) => number;
  /** My plants on the fields. */
  mine: number;
}

export function farmTap(i: FarmTapIn): FarmTap {
  const pl = i.plant;
  if (pl && pl.who === i.me && i.shovel) return { a: 'dig', c: pl.c };
  if (pl && pl.who === i.me && stageOf(pl, i.date) === 3) return { a: 'harvest', c: pl.c, n: yieldOf(i.plot.p, pl, i.watered) };
  if (pl && !i.watered(i.plot.p, i.date)) return { a: 'water' };
  if (!pl && i.plot.who === i.me) {
    if (i.mine >= FARM.cap) return { a: 'cap' };
    if (!i.seed) return { a: 'pick' };
    if (i.have(seedKey(i.seed.c, i.seed.src)) < 1) return { a: 'pick', out: i.seed.c };
    return { a: 'plant', c: i.seed.c, src: i.seed.src };
  }
  if (!pl) return { a: 'about', who: i.plot.who };
  return { a: 'about', who: pl.who, c: pl.c, left: daysLeft(pl, i.date), watered: i.watered(i.plot.p, i.date) };
}
