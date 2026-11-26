// The fields read whole (docs/farming.md): how many plots are free (the shop's 苗, しずえ's first-time line) and the
// plants no field covers (the shop's 苗に戻す), the plants an edit would leave off their field (/editor's ask). Pure.
import { isRipe, type Farm } from '#lib/contract/farm.ts';
import { fieldPlots, type PlotTile } from '#lib/layout/field.ts';
import type { Layout } from '#lib/layout/model.ts';

/** The empty plots. */
export const freePlots = (plots: readonly PlotTile[], farm: Farm): number => plots.reduce((n, t) => n + (farm.plots.has(t.p) ? 0 : 1), 0);

/** The plants on plots no field covers now (a field moved, shrunk or deleted in /editor): kept, not drawn. */
export function orphans(farm: Farm, plots: readonly PlotTile[]): string[] {
  const on = new Set(plots.map((t) => t.p));
  return [...farm.plots.keys()].filter((p) => !on.has(p));
}

/** The plants an edit from `before` to `next` leaves off their field (a field deleted or made smaller: the record
 *  keeps them off any field, docs/farming.md): how many, how many ripe at `now`, and whether every field they stood
 *  on is gone (else one was shrunk); how many fields that touches. */
export function plantsLeft(before: Pick<Layout, 'objects'>, next: Pick<Layout, 'objects'>, farm: Farm, now: number): { n: number; ripe: number; fields: number; gone: boolean } {
  const out = { n: 0, ripe: 0, fields: 0, gone: true };
  if (!farm.plots.size) return out;
  for (const o of before.objects.values()) {
    if (o.k !== 'field') continue;
    const to = next.objects.get(o.id), keep = new Set(to?.k === 'field' ? fieldPlots(to).map((t) => t.p) : []);
    let n = 0;
    for (const t of fieldPlots(o)) {
      const pl = farm.plots.get(t.p);
      if (!pl || keep.has(t.p)) continue;
      n++;
      if (isRipe(pl, now)) out.ripe++;
    }
    if (!n) continue;
    out.n += n;
    out.fields++;
    out.gone &&= keep.size === 0;
  }
  return out;
}
