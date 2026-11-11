// The 畑 sheet's batch writes and readings (docs/farming.md "Playing"): what 収穫 / 水やり / 植える do over the fields,
// a plant's yield while its watering days are still to come, and my plants no field covers. Pure: FarmSheet sends them
// (store/farm.svelte.ts, the shared world's watering).
import { FARM, plantsOf, stageOf, yieldOf, type Farm, type Plot, type Watered } from '#lib/contract/farm.ts';
import { addDays } from '#lib/contract/tokyo.ts';
import type { PlotTile } from '#lib/layout/field.ts';
import type { LocalDate, Who } from '#lib/types.ts';

/** My ripe plants' harvests, each at the yield the record will reckon (plants ≤ FARM.cap = FARM.batchMax: one event). */
export function harvestOps(farm: Farm, me: Who, date: LocalDate, watered: Watered): { o: 'harvest'; p: string; n: number }[] {
  const out: { o: 'harvest'; p: string; n: number }[] = [];
  for (const [p, pl] of farm.plots) if (pl.who === me && stageOf(pl, date) === 3) out.push({ o: 'harvest', p, n: yieldOf(p, pl, watered) });
  return out;
}

/** The plants on the fields (anyone's) not watered on `date`, in the layout's order: the can's batch (anyone waters). */
export function waterTargets(plots: readonly PlotTile[], farm: Farm, date: LocalDate, watered: Watered): string[] {
  return plots.filter((t) => farm.plots.has(t.p) && !watered(t.p, date)).map((t) => t.p);
}

/** My empty plots to plant, in reading order (each field's rows from its back, left to right), as many as I `have`
 *  of the held crop and the cap leaves room for (one event: ≤ FARM.batchMax). */
export function fillPlan(plots: readonly PlotTile[], farm: Farm, me: Who, have: number): string[] {
  const room = Math.min(have, FARM.cap - plantsOf(farm, me), FARM.batchMax);
  if (room <= 0) return [];
  const out: string[] = [];
  for (const t of plots) {
    if (out.length >= room) break;
    if (t.who === me && !farm.plots.has(t.p)) out.push(t.p);
  }
  return out;
}

/** What a plant will yield: the waterings of its two days before ripe so far, and as many more as of those days are
 *  still to come (today unwatered included); ripe, its yield. */
export function yieldRange(p: string, pl: Plot, date: LocalDate, watered: Watered): { lo: number; hi: number } {
  if (stageOf(pl, date) === 3) {
    const n = yieldOf(p, pl, watered);
    return { lo: n, hi: n };
  }
  let lo = 1, hi = 1;
  for (const d of [addDays(pl.from, -2), addDays(pl.from, -1)]) {
    if (watered(p, d)) lo++, hi++;
    else if (d >= date) hi++;
  }
  return { lo: Math.min(lo, FARM.maxYield), hi: Math.min(hi, FARM.maxYield) };
}

/** My plants on plots no field covers now (a field moved, shrunk or deleted in /editor): kept, not drawn, counted. */
export function orphans(farm: Farm, me: Who, plots: readonly PlotTile[]): string[] {
  const on = new Set(plots.map((t) => t.p));
  return [...farm.plots].filter(([p, pl]) => pl.who === me && !on.has(p)).map(([p]) => p);
}
