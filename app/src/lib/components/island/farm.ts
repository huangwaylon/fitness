// The fields on the island today (docs/farming.md): each plot's plant and soil as the scene draws them, from the record's
// rows (model/farm.ts) and today's live watering (the shared world's day: the partner's at once) and sky; the scene,
// a plot's tap and the 畑 sheet read them alike. Nothing here sends (store/farm.svelte.ts does).
import { stageOf, yieldOf, type Farm, type Plot, type Watered } from '#lib/contract/farm.ts';
import { farmOfState, wateredOf } from '#lib/model/farm.ts';
import { layoutPlots } from '#lib/layout/field.ts';
import type { Layout } from '#lib/layout/model.ts';
import { fnv1a } from '#lib/random.ts';
import type { LocalDate } from '#lib/types.ts';
import { world as shared } from '#lib/store/world.svelte.ts';
import { islandDay } from './ambientClock.ts';
import { weather } from './weatherNow.svelte.ts';
import { isRain } from '../../world/weather.ts';

/** A ripe pumpkin's colour (visual only: the item is カボチャ), seeded by its plot and ripe day so both phones draw the
 *  same and each regrow cycle draws anew: orange, yellow, white or green, 8:5:4:3. */
export function pumpkinColour(p: string, from: LocalDate): 'orange' | 'yellow' | 'white' | 'green' {
  const k = fnv1a(`${p}|${from}`) % 20;
  return k < 8 ? 'orange' : k < 13 ? 'yellow' : k < 17 ? 'white' : 'green';
}

/** A plant's model on `date` (the garden's pack, world3d/garden.ts): its stage 0–2, else the ripe plant of its yield
 *  (NH's Lv1–3: the garden's stages 3, 4, 5); a pumpkin's ripe stages in its colour (pumpkinColour). */
export function plantModel(p: string, pl: Plot, date: LocalDate, watered: Watered): string {
  const st = stageOf(pl, date);
  const n = st < 3 ? st : 2 + yieldOf(p, pl, watered);
  return pl.c === 'pumpkin' && n >= 3 ? `garden/crop-pumpkin-${pumpkinColour(p, pl.from)}-${n}` : `garden/crop-${pl.c}-${n}`;
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
 * The fields on `date`: the plants (the record's rows, the queued ones as it will judge them) and what's watered: the
 * record's rows' waterings and wet days and, on the island's today, its live ones (the shared world's day: the
 * partner's at once) and its sky (raining or snowing now, before the record's wet row comes). Reactive (the shared day,
 * the weather).
 */
export function farmToday(s: FarmRows, date: LocalDate): { farm: Farm; watered: Watered } {
  const rows = wateredOf(s);
  const live = date === islandDay();
  void shared.rev;
  const ids = new Set(live ? Object.keys(shared.day.watered) : []), wet = live && (isRain(weather.sky) || weather.sky === 'snow');
  const watered: Watered = (p, d) => rows(p, d) || (d === date && (wet || ids.has(p)));
  return { farm: farmOfState(s), watered };
}
