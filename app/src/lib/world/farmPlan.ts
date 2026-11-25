// The fields read whole (docs/farming.md): how many plots are free (the shop's 苗, しずえ's first-time line) and the
// plants no field covers (the shop's 苗に戻す). Pure.
import type { Farm } from '#lib/contract/farm.ts';
import type { PlotTile } from '#lib/layout/field.ts';

/** The empty plots. */
export const freePlots = (plots: readonly PlotTile[], farm: Farm): number => plots.reduce((n, t) => n + (farm.plots.has(t.p) ? 0 : 1), 0);

/** The plants on plots no field covers now (a field moved, shrunk or deleted in /editor): kept, not drawn. */
export function orphans(farm: Farm, plots: readonly PlotTile[]): string[] {
  const on = new Set(plots.map((t) => t.p));
  return [...farm.plots.keys()].filter((p) => !on.has(p));
}
