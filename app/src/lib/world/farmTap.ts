// A tap on a plot (docs/farming.md "Playing"): what it does, acting in place (never a walk), forgiving a row's miss
// (a row is ~15 px on the phone) with NH's golden can's 3 × 3, the tapped plot deciding first. Pure: SceneTaps does it
// (store/farm.svelte.ts, the shared world's watering, the plate). P the tapped plot, A its 3 × 3, in this order:
//   1. P is my ripe plant, or my plant picked today while A has ripe ones of mine (a run of harvest taps: the plant just
//      picked counts for watering today, and would turn the next tap into the can's): harvest every ripe plant of mine
//      in A, P first, then the nearest (a harvest never misfires);
//   2. P holds a plant (anyone's), or is another's empty plot, and A has plants whose watering counts today, not yet
//      watered: water those (never a ripe one: it can't help). My empty plot never waters;
//   3. my ripe plants in A (a miss on an empty, watered or another's plot): harvest them all, the nearest first;
//   4. P is my empty plot: at the cap say so; else plant the crop (the picker's pick, or this run's) on my empty plots
//      of A, P first, then the nearest, as many as I hold, the cap leaves and one event takes; no crop yet: the one kind
//      I hold if it's a start, else the picker (a vegetable is a kind, never planted unasked; the run's crop gone: the
//      picker, saying so), whose pick runs this again with it; nothing held: say so;
//   5. else a word: whose plant and how long, or watered already (and by whom), or whose field; my own plant offers ほる.
// So on a mixed 3 × 3 a tap on my empty plot harvests first, the next one plants; a tap on a plant waters.
import { FARM, daysLeft, seedKey, stageOf, wateringCounts, yieldOf, type Crop, type FarmSrc, type Plot, type Watered } from '#lib/contract/farm.ts';
import type { LocalDate, Who } from '#lib/types.ts';

/** A harvested plant: its plot, its crop and its yield. */
interface HarvestOp { p: string; c: Crop; n: number }
/** A crop to plant: a start, or a vegetable. */
interface Seed { c: Crop; src: FarmSrc }

type FarmTap =
  /** My ripe plants of the 3 × 3, the plate's first (P's, else the nearest). */
  | { a: 'harvest'; ops: HarvestOp[] }
  /** The plants to water: the 3 × 3's whose watering counts today, not watered yet. */
  | { a: 'water'; ids: string[] }
  /** My empty plots of the 3 × 3 to plant with crop `c` (P first, then the nearest). */
  | { a: 'plant'; ps: string[]; c: Crop; src: FarmSrc }
  /** The picker, for this plot (`out`: the crop of this run, none left of it). */
  | { a: 'pick'; out?: Crop }
  /** Nothing to plant held at all. */
  | { a: 'none' }
  | { a: 'cap' }
  /** A word about it: its plant (whose, which, days to ripe; 0 ripe, another's; who watered it today), or only whose
   *  field it is. `dig`: my own plant (ほる). */
  | { a: 'about'; who: Who; c?: Crop; left?: number; watered?: boolean; by?: Who; dig?: true };

/** A plot of a field (whose field, its tile's column and row) and its plant, if any. */
export interface PlotAt { p: string; who: Who; c: number; r: number; plant?: Plot }

export interface FarmTapIn {
  me: Who;
  /** The plot: its id, whose field it is and its tile. */
  plot: { p: string; who: Who; c: number; r: number };
  /** Its plant, if any. */
  plant?: Plot;
  /** The plots of its 3 × 3 (itself too, any field's: layout/field.ts plotsAround), with their plants. */
  around: readonly PlotAt[];
  date: LocalDate;
  watered: Watered;
  /** Who watered the plot today, if anyone did (the shared day's `watered`). */
  by?: Who;
  /** The crop to plant: the picker's pick (forced), or this planting run's; null: none chosen. */
  seed: Seed | null;
  /** The kinds I hold to plant (starts and vegetables). */
  kinds: readonly Seed[];
  /** How many of a pocket key I hold. */
  have: (key: string) => number;
  /** My plants on the fields. */
  mine: number;
}

/** P first, then the nearest (a stable sort: the 3 × 3's own order breaks a tie). */
const nearest = <T extends { c: number; r: number }>(ns: readonly T[], c: number, r: number): T[] =>
  ns.map((n) => ({ n, d: (n.c - c) ** 2 + (n.r - r) ** 2 })).sort((a, b) => a.d - b.d).map(({ n }) => n);

export function farmTap(i: FarmTapIn): FarmTap {
  const pl = i.plant, { c, r } = i.plot, mineEmpty = !pl && i.plot.who === i.me;
  const ripe = nearest(i.around.filter((n): n is PlotAt & { plant: Plot } => n.plant?.who === i.me && stageOf(n.plant, i.date) === 3), c, r)
    .map((n) => ({ p: n.p, c: n.plant.c, n: yieldOf(n.p, n.plant, i.watered) }));
  if (pl && ripe[0]?.p === i.plot.p) return { a: 'harvest', ops: ripe };
  const picked = pl?.who === i.me && pl.r && daysLeft(pl, i.date) === FARM.regrowDays;
  if (picked && ripe.length) return { a: 'harvest', ops: ripe };
  if (!mineEmpty) {
    const dry = i.around.filter((n) => n.plant && wateringCounts(n.plant, i.date) && !i.watered(n.p, i.date)).map((n) => n.p);
    if (dry.length) return { a: 'water', ids: dry };
  }
  if (ripe.length) return { a: 'harvest', ops: ripe };
  if (mineEmpty) {
    if (i.mine >= FARM.cap) return { a: 'cap' };
    const s = i.seed ? (i.have(seedKey(i.seed.c, i.seed.src)) > 0 ? i.seed : null) : i.kinds.length === 1 && i.kinds[0].src === 'start' ? i.kinds[0] : null;
    if (!s) return i.kinds.length ? { a: 'pick', ...(i.seed ? { out: i.seed.c } : {}) } : { a: 'none' };
    const room = Math.min(i.have(seedKey(s.c, s.src)), FARM.cap - i.mine, FARM.batchMax);
    const ps = nearest(i.around.filter((n) => n.who === i.me && !n.plant), c, r).slice(0, room).map((n) => n.p);
    return { a: 'plant', ps, c: s.c, src: s.src };
  }
  if (!pl) return { a: 'about', who: i.plot.who };
  return {
    a: 'about', who: pl.who, c: pl.c, left: daysLeft(pl, i.date), watered: i.watered(i.plot.p, i.date),
    ...(i.by ? { by: i.by } : {}), ...(pl.who === i.me ? { dig: true as const } : {})
  };
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
