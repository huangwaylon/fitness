// The fields on the island today (docs/farming.md): each plot's plant and soil as the scene draws them, from the record's
// rows (model/farm.ts) and today's live watering (the shared world's day: the partner's at once) and sky; the scene
// and a plot's tap read them alike. Nothing here sends (store/farm.svelte.ts does).
import { CROPS, FARM, plantsOf, seedKey, stageOf, yieldOf, type Farm, type Plot, type Watered } from '#lib/contract/farm.ts';
import { shopView } from '#lib/model/shop.ts';
import { farmOfState, wateredOf } from '#lib/model/farm.ts';
import { layoutPlots } from '#lib/layout/field.ts';
import type { Layout } from '#lib/layout/model.ts';
import { fnv1a } from '#lib/random.ts';
import type { LocalDate, Who } from '#lib/types.ts';
import { world as shared } from '#lib/store/world.svelte.ts';
import { islandDay } from './ambientClock.ts';
import { weather } from './weatherNow.svelte.ts';
import { isRain } from '#lib/world/weather.ts';

/** A ripe pumpkin's colour (visual only: the item is カボチャ), seeded by its plot and ripe day so both phones draw the
 *  same and each regrow cycle draws anew: orange, yellow, white or green, 8:5:4:3. */
export function pumpkinColour(p: string, from: LocalDate): 'orange' | 'yellow' | 'white' | 'green' {
  const k = fnv1a(`${p}|${from}`) % 20;
  return k < 8 ? 'orange' : k < 13 ? 'yellow' : k < 17 ? 'white' : 'green';
}

/** A plant's model on `date` (the garden's pack, world3d/garden.ts): its stage 0 (planted today) or 2 (growing back),
 *  else the ripe plant of its yield (NH's Lv1 or Lv3: the garden's stages 3 and 5); a pumpkin's ripe stages in its
 *  colour (pumpkinColour). */
export function plantModel(p: string, pl: Plot, date: LocalDate, watered: Watered): string {
  const st = stageOf(pl, date);
  const n = st < 3 ? st : 2 + yieldOf(p, pl, watered);
  return pl.c === 'pumpkin' && n >= 3 ? `garden/crop-pumpkin-${pumpkinColour(p, pl.from)}-${n}` : `garden/crop-${pl.c}-${n}`;
}

/** Each plot of the layout's fields: its plant's model and whether it was watered today; with a signature that changes
 *  only when one of them does (the scene places its models again then). `hint`: while I hold starts, my empty plots
 *  carry a faint sprout of the first crop I hold (`hint`: its model), so an empty plot reads as a place to plant. */
export function farmScene(layout: Layout, farm: Farm, date: LocalDate, watered: Watered, hint?: { who: Who; crop: string }): { plots: Map<string, FarmLook>; sig: string } {
  const plots = new Map<string, FarmLook>();
  let sig = '';
  for (const t of layoutPlots(layout)) {
    const pl = farm.plots.get(t.p), m = pl ? plantModel(t.p, pl, date, watered) : undefined, wet = watered(t.p, date);
    const h = !pl && hint && t.who === hint.who ? `garden/crop-${hint.crop}-0` : undefined;
    if (!m && !wet && !h) continue;
    plots.set(t.p, { ...(m ? { m } : {}), ...(wet ? { wet } : {}), ...(h ? { hint: h } : {}) });
    sig += `${t.p}:${m ?? ''}:${wet ? 1 : 0}:${h ?? ''};`;
  }
  return { plots, sig };
}
/** A plot as the scene draws it: its plant's model, its soil watered, the faint sprout of an empty plot of mine. */
export type FarmLook = { m?: string; wet?: boolean; hint?: string };

/** While `who` holds starts and has room under the cap: the first crop held (an empty plot's faint sprout, しずえ's
 *  first-time line), else undefined. */
export function plantHint(s: Parameters<typeof shopView>[0], who: Who, farm: Farm): { who: Who; crop: string } | undefined {
  if (plantsOf(farm, who) >= FARM.cap) return undefined;
  const pocket = shopView(s, who).pocket, crop = CROPS.find((c) => (pocket.get(seedKey(c, 'start')) ?? 0) > 0);
  return crop ? { who, crop } : undefined;
}
/** Some plot of `who`'s is empty. */
export const emptyPlotOf = (layout: Layout, farm: Farm, who: Who): boolean => layoutPlots(layout).some((t) => t.who === who && !farm.plots.has(t.p));

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
