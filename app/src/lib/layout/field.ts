// The fields (docs/farming.md): a layout object of kind `field` is one player's field, its variant `s` its owner and
// size, `<a|b|g>-<w>x<d>` (`a-10x4`: ウェイ's, 10 tiles across and 4 deep; the layout op's token, so no new op). Its
// plots are its tiles, `fd:<id>.<col>.<row>` (contract/farm.ts plotOf). Placed, moved, resized and given an owner in
// /editor only. Pure.
import { plotOf } from '#lib/contract/farm.ts';
import type { Who } from '#lib/types.ts';
import type { Layout, Obj } from './model.ts';

/** A field's side at most (tiles). */
export const FIELD_MAX = 16;
/** A new field's size: 10 across, 4 deep (the user, 2026-11-10: 4 rows × 10 columns each). */
const FIELD_W = 10, FIELD_D = 4;

const S_RE = /^([abg])-(\d{1,2})x(\d{1,2})$/;
const WHO: Record<string, Who> = { a: 'A', b: 'B', g: 'G' };

export interface FieldDef { who: Who; w: number; d: number }

/** A field's owner and size from its variant (anything else: ウェイ's, the default size). */
export function fieldOf(s: string | undefined): FieldDef {
  const m = s ? S_RE.exec(s) : null;
  const w = m ? Number(m[2]) : FIELD_W, d = m ? Number(m[3]) : FIELD_D;
  return m && w >= 1 && w <= FIELD_MAX && d >= 1 && d <= FIELD_MAX ? { who: WHO[m[1]], w, d } : { who: 'A', w: FIELD_W, d: FIELD_D };
}

/** A field's variant. */
export const fieldS = (f: FieldDef): string => `${f.who.toLowerCase()}-${Math.max(1, Math.min(FIELD_MAX, f.w))}x${Math.max(1, Math.min(FIELD_MAX, f.d))}`;

/** One plot: its id, its owner, its tile. */
export interface PlotTile { p: string; who: Who; c: number; r: number }

const memo = new WeakMap<Layout, { plots: PlotTile[]; at: Map<string, PlotTile> }>();
function plotsMemo(layout: Layout) {
  let m = memo.get(layout);
  if (!m) {
    const plots: PlotTile[] = [];
    for (const o of layout.objects.values()) if (o.k === 'field') plots.push(...fieldPlots(o));
    m = { plots, at: new Map(plots.map((t) => [`${t.c},${t.r}`, t])) };
    memo.set(layout, m);
  }
  return m;
}

/** A field object's plots, row by row from its front-left tile (its x, z: row 0 the front row, nearest the beach). */
export function fieldPlots(o: Pick<Obj, 'id' | 'x' | 'z' | 's'>): PlotTile[] {
  const f = fieldOf(o.s), out: PlotTile[] = [];
  for (let j = 0; j < f.d; j++) for (let i = 0; i < f.w; i++) out.push({ p: plotOf(o.id, i, j), who: f.who, c: o.x + i, r: o.z + j });
  return out;
}

/** Every plot of the layout's fields. */
export const layoutPlots = (layout: Layout): readonly PlotTile[] => plotsMemo(layout).plots;
/** The plot on tile (c, r), if a field covers it. */
export const plotAt = (layout: Layout, c: number, r: number): PlotTile | undefined => plotsMemo(layout).at.get(`${c},${r}`);

/** The plots round `t` (its 3 × 3, itself included, any field's): the can's reach (NH's golden can). */
export function plotsAround(layout: Layout, t: PlotTile): PlotTile[] {
  const out: PlotTile[] = [];
  for (let dz = -1; dz <= 1; dz++)
    for (let dx = -1; dx <= 1; dx++) {
      const n = plotAt(layout, t.c + dx, t.r + dz);
      if (n) out.push(n);
    }
  return out;
}
