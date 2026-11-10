// The fields on the island today (docs/farming.md): each plot's plant and soil as the scene draws them, from the record's
// rows (model/farm.ts) and today's live watering (the shared world's day: the partner's at once) and sky. Pure helpers
// and one reactive view; nothing here sends (store/farm.svelte.ts does).
import { stageOf, yieldOf, type Farm, type Plot, type Watered } from '#lib/contract/farm.ts';
import { farmOfState, wateredOf } from '#lib/model/farm.ts';
import { layoutPlots } from '#lib/layout/field.ts';
import type { Layout } from '#lib/layout/model.ts';
import type { LocalDate } from '#lib/types.ts';

/** A plant's model on `date` (the garden's pack, world3d/garden.ts): its stage 0–2, else the ripe plant of its yield
 *  (NH's Lv1–3: the garden's stages 3, 4, 5); the pumpkin orange (P1). */
function plantModel(p: string, pl: Plot, date: LocalDate, watered: Watered): string {
  const st = stageOf(pl, date);
  const n = st < 3 ? st : 2 + yieldOf(p, pl, watered);
  return pl.c === 'pumpkin' && n >= 3 ? `garden/crop-pumpkin-orange-${n}` : `garden/crop-${pl.c}-${n}`;
}

/** Each plot of the layout's fields: its plant's model and whether it was watered today; with a signature that changes
 *  only when one of them does (the scene places its models again then). */
export function farmScene(layout: Layout, farm: Farm, date: LocalDate, watered: Watered): { plots: Map<string, { m?: string; wet?: boolean }>; sig: string } {
  const plots = new Map<string, { m?: string; wet?: boolean }>();
  let sig = '';
  for (const t of layoutPlots(layout)) {
    const pl = farm.plots.get(t.p), m = pl ? plantModel(t.p, pl, date, watered) : undefined, wet = watered(t.p, date);
    if (!m && !wet) continue;
    plots.set(t.p, { ...(m ? { m } : {}), ...(wet ? { wet } : {}) });
    sig += `${t.p}:${m ?? ''}:${wet ? 1 : 0};`;
  }
  return { plots, sig };
}

/** What the fold reads of the model's State. */
type FarmRows = Parameters<typeof farmOfState>[0];

/**
 * The fields today: the plants (the record's rows, the queued ones as it will judge them) and what's watered: the
 * record's rows' waterings and wet days, and today's live ones (`today`: the shared world's watered ids; `wet`: it's
 * raining or snowing now, before the record's wet row comes).
 */
export function farmToday(s: FarmRows, date: LocalDate, today: { ids: ReadonlySet<string>; wet: boolean }): { farm: Farm; watered: Watered } {
  const rows = wateredOf(s);
  const watered: Watered = (p, d) => rows(p, d) || (d === date && (today.wet || today.ids.has(p)));
  return { farm: farmOfState(s), watered };
}
