// A tap on a plot (docs/farming.md "Playing"): what it does, acting in place (never a walk), forgiving a row's miss
// (a row is ~15 px on the phone) with NH's golden can's 3 × 3, the tapped plant deciding first. Pure: SceneTaps does it
// (store/farm.svelte.ts, the shared world's watering, the plate). P the tapped plot, A its 3 × 3:
//   1. my ripe plant at P: harvest every ripe plant of mine in A, P first, then the nearest (a harvest never misfires);
//   2. a plant at P (anyone's), or another's empty plot, and plants in A whose watering counts today not yet watered:
//      water those (never a ripe one: it can't help);
//   3. my ripe plants in A (a miss on an empty, watered or another's plot): harvest them all, the nearest first;
//   4. my field's empty plot: at the cap say so; plant the held crop (nothing held, or none left: the picker, whose pick
//      plants it);
//   5. else a word: whose plant and how long, or watered already (and by whom), or whose field.
// Digging is the 畑 sheet's (farm/FarmSheet.svelte), never a tap's.
import { FARM, daysLeft, seedKey, stageOf, wateringCounts, yieldOf, type Crop, type FarmSrc, type Plot, type Watered } from '#lib/contract/farm.ts';
import type { LocalDate, Who } from '#lib/types.ts';

/** A harvested plant: its plot, its crop and its yield. */
interface HarvestOp { p: string; c: Crop; n: number }

type FarmTap =
  /** My ripe plants of the 3 × 3, the plate's first (P's, else the nearest). */
  | { a: 'harvest'; ops: HarvestOp[] }
  /** The plants to water: the 3 × 3's whose watering counts today, not watered yet. */
  | { a: 'water'; ids: string[] }
  | { a: 'plant'; c: Crop; src: FarmSrc }
  /** The picker, for this plot (`out`: the held crop, none left of it). */
  | { a: 'pick'; out?: Crop }
  | { a: 'cap' }
  /** A word about it: its plant (whose, which, days to ripe; 0 ripe, another's; who watered it today), or only whose
   *  field it is. */
  | { a: 'about'; who: Who; c?: Crop; left?: number; watered?: boolean; by?: Who };

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
  /** Who watered the plot today, if anyone did (the shared day's `watered`). */
  by?: Who;
  seed: { c: Crop; src: FarmSrc } | null;
  /** How many of a pocket key I hold. */
  have: (key: string) => number;
  /** My plants on the fields. */
  mine: number;
}

export function farmTap(i: FarmTapIn): FarmTap {
  const pl = i.plant, { c, r } = i.plot, mineEmpty = !pl && i.plot.who === i.me;
  const ripe = i.around
    .filter((n): n is PlotAt & { plant: Plot } => n.plant?.who === i.me && stageOf(n.plant, i.date) === 3)
    .map((n) => ({ n, d: (n.c - c) ** 2 + (n.r - r) ** 2 }))
    .sort((a, b) => a.d - b.d)
    .map(({ n }) => ({ p: n.p, c: n.plant.c, n: yieldOf(n.p, n.plant, i.watered) }));
  if (pl && ripe[0]?.p === i.plot.p) return { a: 'harvest', ops: ripe };
  if (!mineEmpty) {
    const dry = i.around.filter((n) => n.plant && wateringCounts(n.plant, i.date) && !i.watered(n.p, i.date)).map((n) => n.p);
    if (dry.length) return { a: 'water', ids: dry };
  }
  if (ripe.length) return { a: 'harvest', ops: ripe };
  if (mineEmpty) {
    if (i.mine >= FARM.cap) return { a: 'cap' };
    if (!i.seed) return { a: 'pick' };
    if (i.have(seedKey(i.seed.c, i.seed.src)) < 1) return { a: 'pick', out: i.seed.c };
    return { a: 'plant', c: i.seed.c, src: i.seed.src };
  }
  if (!pl) return { a: 'about', who: i.plot.who };
  return { a: 'about', who: pl.who, c: pl.c, left: daysLeft(pl, i.date), watered: i.watered(i.plot.p, i.date), ...(i.by ? { by: i.by } : {}) };
}

/** The 畑 sheet's wave on its close (farmUi.svelte.ts farmWave): at most `max` of its plots, spread evenly along x
 *  (left to right). */
export function waveSpots<T extends { c: number; r: number }>(tiles: readonly T[], max = 8): T[] {
  const s = [...tiles].sort((a, b) => a.c - b.c || a.r - b.r);
  return s.length <= max ? s : Array.from({ length: max }, (_, i) => s[Math.round((i * (s.length - 1)) / (max - 1))]);
}
