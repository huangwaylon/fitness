// My fields read whole (docs/farming.md): the empty plots a start could go in (the shop's 苗, shop/Counter.svelte) and
// my plants no field covers (its 苗に戻す). Pure.
import { FARM, plantsOf, type Farm } from '#lib/contract/farm.ts';
import type { PlotTile } from '#lib/layout/field.ts';
import type { Who } from '#lib/types.ts';

/** My empty plots to plant (each field's back row first, away from the camera, left to right; row 0, nearest the beach,
 *  last), as many as I `have` and the cap leaves room for (one event: ≤ FARM.batchMax): the shop's 苗 counts them. */
export function fillPlan(plots: readonly PlotTile[], farm: Farm, me: Who, have: number): string[] {
  const room = Math.min(have, FARM.cap - plantsOf(farm, me), FARM.batchMax);
  if (room <= 0) return [];
  // (each field's plots, in the layout's order of fields: `fd:<field>.<col>.<row>`)
  const fields = new Map<string, PlotTile[]>();
  for (const t of plots) {
    if (t.who !== me || farm.plots.has(t.p)) continue;
    const id = t.p.slice(0, t.p.lastIndexOf('.', t.p.lastIndexOf('.') - 1));
    let f = fields.get(id);
    if (!f) fields.set(id, (f = []));
    f.push(t);
  }
  return [...fields.values()].flatMap((f) => f.sort((a, b) => b.r - a.r || a.c - b.c)).slice(0, room).map((t) => t.p);
}

/** My plants on plots no field covers now (a field moved, shrunk or deleted in /editor): kept, not drawn, counted. */
export function orphans(farm: Farm, me: Who, plots: readonly PlotTile[]): string[] {
  const on = new Set(plots.map((t) => t.p));
  return [...farm.plots].filter(([p, pl]) => pl.who === me && !on.has(p)).map(([p]) => p);
}
