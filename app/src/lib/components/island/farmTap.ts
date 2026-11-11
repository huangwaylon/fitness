// A tap on a plot (docs/farming.md "Playing"): what it does, acting in place (never a walk), forgiving a row's miss
// (a row is ~15 px on the phone): NH's golden can's 3 × 3 for the harvest as for the watering. Pure: SceneTaps does it
// (store/farm.svelte.ts, the shared world's watering, the plate).
//   1. a ripe plant of mine in its 3 × 3: harvest the nearest, at its yield;
//   2. a plant (anyone's) there, and one in its 3 × 3 not watered today: water those;
//   3. my field's empty plot: at the cap say so; plant the held crop (nothing held, or none left: the picker, whose pick
//      plants it);
//   4. else a word: whose plant and how long, or watered already, or whose field.
// Digging is the 畑 sheet's (farm/FarmSheet.svelte), never a tap's.
import { FARM, daysLeft, seedKey, stageOf, yieldOf, type Crop, type FarmSrc, type Plot, type Watered } from '#lib/contract/farm.ts';
import type { LocalDate, Who } from '#lib/types.ts';

type FarmTap =
  | { a: 'harvest'; p: string; c: Crop; n: number }
  /** The plants to water: the 3 × 3's not watered today. */
  | { a: 'water'; ids: string[] }
  | { a: 'plant'; c: Crop; src: FarmSrc }
  /** The picker, for this plot (`out`: the held crop, none left of it). */
  | { a: 'pick'; out?: Crop }
  | { a: 'cap' }
  /** A word about it: its plant (whose, which, days to ripe; 0 ripe, another's), or only whose field it is. */
  | { a: 'about'; who: Who; c?: Crop; left?: number; watered?: boolean };

/** A plot of a field (its tile's column and row) and its plant, if any. */
export interface PlotAt { p: string; c: number; r: number; plant?: Plot }

export interface FarmTapIn {
  me: Who;
  /** The plot: its id, whose field it is and its tile. */
  plot: { p: string; who: Who; c: number; r: number };
  /** Its plant, if any. */
  plant?: Plot;
  /** The plots of its 3 × 3 (itself too: layout/field.ts plotsAround), with their plants. */
  around: readonly PlotAt[];
  date: LocalDate;
  watered: Watered;
  seed: { c: Crop; src: FarmSrc } | null;
  /** How many of a pocket key I hold. */
  have: (key: string) => number;
  /** My plants on the fields. */
  mine: number;
}

export function farmTap(i: FarmTapIn): FarmTap {
  const pl = i.plant, { c, r } = i.plot;
  let ripe: PlotAt | undefined, best = Infinity;
  for (const n of i.around) {
    if (n.plant?.who !== i.me || stageOf(n.plant, i.date) !== 3) continue;
    const d = (n.c - c) ** 2 + (n.r - r) ** 2;
    if (d < best) [ripe, best] = [n, d];
  }
  if (ripe?.plant) return { a: 'harvest', p: ripe.p, c: ripe.plant.c, n: yieldOf(ripe.p, ripe.plant, i.watered) };
  const dry = pl ? i.around.filter((n) => n.plant && !i.watered(n.p, i.date)).map((n) => n.p) : [];
  if (dry.length) return { a: 'water', ids: dry };
  if (!pl && i.plot.who === i.me) {
    if (i.mine >= FARM.cap) return { a: 'cap' };
    if (!i.seed) return { a: 'pick' };
    if (i.have(seedKey(i.seed.c, i.seed.src)) < 1) return { a: 'pick', out: i.seed.c };
    return { a: 'plant', c: i.seed.c, src: i.seed.src };
  }
  if (!pl) return { a: 'about', who: i.plot.who };
  return { a: 'about', who: pl.who, c: pl.c, left: daysLeft(pl, i.date), watered: i.watered(i.plot.p, i.date) };
}

/** The 畑 sheet's wave on its close (farmUi.svelte.ts farmWave): at most `max` of its plots, spread evenly along x
 *  (left to right). */
export function waveSpots<T extends { c: number; r: number }>(tiles: readonly T[], max = 8): T[] {
  const s = [...tiles].sort((a, b) => a.c - b.c || a.r - b.r);
  return s.length <= max ? s : Array.from({ length: max }, (_, i) => s[Math.round((i * (s.length - 1)) / (max - 1))]);
}
