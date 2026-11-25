// A tap on a plot (docs/farming.md "Playing"): what it does, acting in place (never a walk), forgiving a row's miss
// (a row is ~15 px on the phone) with NH's golden can's 3 × 3, the tapped plot deciding first. Anyone's plot is
// everyone's. Pure: SceneTaps does it (store/farm.svelte.ts, the plate). P the tapped plot, A its 3 × 3, first match:
//   1. ripe plants in A: harvest them all, P first, then the nearest (a run of harvest taps stays a harvest);
//   2. P holds a plant and A has plants to water (growing, not watered: needsWater): water those;
//   3. P is empty: plant the crop (the picker's pick, or this run's) on A's empty plots, P first, then the nearest, as
//      many as I hold and one event takes; no crop yet: the one kind I hold if it's a start, else the picker (a
//      vegetable is a kind, never planted unasked; the run's crop gone: the picker, saying so), whose pick runs this
//      again with it; nothing held: say so;
//   4. else a word: P's crop, its time to ripe, watered or not; with ほる (dig it up).
// So on a mixed 3 × 3 a tap on an empty plot harvests first, the next one plants; a tap on a plant waters.
import { FARM, isRipe, msLeft, needsWater, seedKey, yieldOf, type Crop, type FarmSrc, type Plot, type WetDay } from '#lib/contract/farm.ts';
import type { PlotTile } from '#lib/layout/field.ts';

/** A harvested plant: its plot, its crop and its yield. */
interface HarvestOp { p: string; c: Crop; n: number }
/** A crop to plant: a start, or a vegetable. */
interface Seed { c: Crop; src: FarmSrc }

type FarmTap =
  /** The 3 × 3's ripe plants, the plate's first (P's, else the nearest). */
  | { a: 'harvest'; ops: HarvestOp[] }
  /** The 3 × 3's plants to water. */
  | { a: 'water'; ps: string[] }
  /** The 3 × 3's empty plots to plant with crop `c` (P first, then the nearest). */
  | { a: 'plant'; ps: string[]; c: Crop; src: FarmSrc }
  /** The picker, for this plot (`out`: the crop of this run, none left of it). */
  | { a: 'pick'; out?: Crop }
  /** Nothing to plant held at all. */
  | { a: 'none' }
  /** A word about P's plant: its crop, ms to ripe, watered this growth. */
  | { a: 'about'; c: Crop; left: number; watered: boolean };

/** A plot (its id and tile) and its plant, if any. */
export interface PlotAt extends PlotTile { plant?: Plot }

export interface FarmTapIn {
  /** The tapped plot and its plant. */
  plot: PlotAt;
  /** The plots of its 3 × 3 (itself too, any field's: layout/field.ts plotsAround), with their plants. */
  around: readonly PlotAt[];
  /** The record's clock (ms). */
  now: number;
  wet: WetDay;
  /** The crop to plant: the picker's pick (forced), or this planting run's; null: none chosen. */
  seed: Seed | null;
  /** The kinds I hold to plant (starts and vegetables). */
  kinds: readonly Seed[];
  /** How many of a pocket key I hold. */
  have: (key: string) => number;
}

/** P first, then the nearest (a stable sort: the 3 × 3's own order breaks a tie). */
const nearest = <T extends { c: number; r: number }>(ns: readonly T[], c: number, r: number): T[] =>
  ns.map((n) => ({ n, d: (n.c - c) ** 2 + (n.r - r) ** 2 })).sort((a, b) => a.d - b.d).map(({ n }) => n);

export function farmTap(i: FarmTapIn): FarmTap {
  const { plant: pl, c, r } = i.plot, now = i.now;
  const ripe = i.around.filter((n): n is PlotAt & { plant: Plot } => !!n.plant && isRipe(n.plant, now));
  if (ripe.length) return { a: 'harvest', ops: nearest(ripe, c, r).map((n) => ({ p: n.p, c: n.plant.c, n: yieldOf(n.plant, i.wet) })) };
  if (pl) {
    const dry = i.around.filter((n) => n.plant && needsWater(n.plant, now)).map((n) => n.p);
    return dry.length ? { a: 'water', ps: dry } : { a: 'about', c: pl.c, left: msLeft(pl, now), watered: !!pl.w };
  }
  const s = i.seed ? (i.have(seedKey(i.seed.c, i.seed.src)) > 0 ? i.seed : null) : i.kinds.length === 1 && i.kinds[0].src === 'start' ? i.kinds[0] : null;
  if (!s) return i.kinds.length ? { a: 'pick', ...(i.seed ? { out: i.seed.c } : {}) } : { a: 'none' };
  const room = Math.min(i.have(seedKey(s.c, s.src)), FARM.batchMax);
  return { a: 'plant', ps: nearest(i.around.filter((n) => !n.plant), c, r).slice(0, room).map((n) => n.p), c: s.c, src: s.src };
}

/** Ms to ripe as the word says it: hours and minutes, rounded up to ten minutes (`m` 0, 10, … 50: always 〜ぷん). */
export function leftHM(ms: number): { h: number; m: number } {
  const tens = Math.max(1, Math.ceil(ms / 600_000));
  return { h: Math.floor(tens / 6), m: (tens % 6) * 10 };
}

/** A planting run (docs/farming.md "Playing"): the crop last planted is planted again without asking while each plant
 *  comes within PLANT_RUN_MS of the last (a field, one picker); a planting taken back (取り消す) ends it. */
export const PLANT_RUN_MS = 60_000;
export function plantingRun() {
  let s: Seed | null = null, at = -Infinity;
  return {
    /** The run's crop at `now` (ms), if it still runs. */
    crop: (now: number): Seed | null => (now - at <= PLANT_RUN_MS ? s : null),
    /** `r`, a planting of `c` at `now`, starts or extends the run; its undo, done, ends it. */
    planted<R extends { ok: boolean; undo?: () => boolean }>(c: Seed, now: number, r: R): R {
      s = c;
      at = now;
      const undo = r.undo;
      return undo ? { ...r, undo: () => {
        const ok = undo();
        if (ok) {
          s = null;
          at = -Infinity;
        }
        return ok;
      } } : r;
    }
  };
}
