// The fields on the island now (docs/farming.md): each plot's plant and soil as the scene draws them, from the record's
// field (model/farm.ts) and the wet days with today's sky; the scene and a plot's tap read them alike. Nothing here
// sends (store/farm.svelte.ts does).
import { CROPS, FARM, isRipe, nextStageAt, seedKey, stageOf, yieldOf, type Farm, type Plot, type WetDay } from '#lib/contract/farm.ts';
import { localDateAt } from '#lib/contract/tokyo.ts';
import { shopView } from '#lib/model/shop.ts';
import { farmOfState, wetOf } from '#lib/model/farm.ts';
import { layoutPlots } from '#lib/layout/field.ts';
import type { Layout } from '#lib/layout/model.ts';
import { fnv1a } from '#lib/random.ts';
import type { Who } from '#lib/types.ts';
import { world } from '#lib/store/world.svelte.ts';
import { weather } from './weatherNow.svelte.ts';
import { liveWater } from './farmLive.svelte.ts';
import { isRain } from '#lib/world/weather.ts';

/** A ripe pumpkin's colour (visual only: the item is カボチャ), seeded by its plot and ripe time so every phone draws
 *  the same and each regrow draws anew: orange, yellow, white or green, 8:5:4:3. */
export function pumpkinColour(p: string, t: number): 'orange' | 'yellow' | 'white' | 'green' {
  const k = fnv1a(`${p}|${t}`) % 20;
  return k < 8 ? 'orange' : k < 13 ? 'yellow' : k < 17 ? 'white' : 'green';
}

/** A plant's model at `now` (the garden's pack, world3d/garden.ts): its stage 0, 1, 2 while growing, else the ripe
 *  plant of its yield (NH's Lv1 or Lv3: the garden's stages 3 and 5); a ripe pumpkin's in its colour (pumpkinColour). */
export function plantModel(p: string, pl: Plot, now: number, wet: WetDay): string {
  const st = stageOf(pl, now);
  const n = st < 3 ? st : 2 + yieldOf(pl, wet);
  return pl.c === 'pumpkin' && n >= 3 ? `garden/crop-pumpkin-${pumpkinColour(p, pl.t)}-${n}` : `garden/crop-${pl.c}-${n}`;
}

/** An empty plot's mark (world3d/proc3d.ts): a ＋, not a plant. */
const PLOT_HINT = 'proc/plot-plus';

/** A plot as the scene draws it: its plant's model, its soil wet, an empty plot's faint ＋. */
export type FarmLook = { m?: string; wet?: boolean; hint?: string };

/**
 * Each plot of the layout's fields at `now`: its plant's model and whether its soil is wet (watered while growing, or
 * a wet day); with a signature that changes only when one of them does (the scene places its models again then) and
 * `next`, the earliest time a plant's stage changes (the scene's one timer). `hint`: while I hold starts, every empty
 * plot carries a faint ＋ (proc/plot-plus, never a plant's model), so it reads as a place to plant.
 */
export function farmScene(layout: Layout, farm: Farm, now: number, wet: WetDay, hint = false): { plots: Map<string, FarmLook>; sig: string; next: number | null } {
  const plots = new Map<string, FarmLook>(), rain = wet(localDateAt(now));
  let sig = '', next: number | null = null;
  for (const t of layoutPlots(layout)) {
    const pl = farm.plots.get(t.p), m = pl ? plantModel(t.p, pl, now, wet) : undefined;
    const soil = rain || (!!pl?.w && !isRipe(pl, now)), h = !pl && hint ? PLOT_HINT : undefined;
    const at = pl ? nextStageAt(pl, now) : null;
    if (at !== null && (next === null || at < next)) next = at;
    if (!m && !soil && !h) continue;
    plots.set(t.p, { ...(m ? { m } : {}), ...(soil ? { wet: true } : {}), ...(h ? { hint: h } : {}) });
    sig += `${t.p}:${m ?? ''}:${soil ? 1 : 0}:${h ? 1 : 0};`;
  }
  return { plots, sig, next };
}

/** While `who` holds starts: the first crop held (the empty plots' ＋, しずえ's first-time line), else undefined. */
export function plantHint(s: Parameters<typeof shopView>[0], who: Who): string | undefined {
  const pocket = shopView(s, who).pocket;
  return CROPS.find((c) => (pocket.get(seedKey(c, 'start')) ?? 0) > 0);
}

/** The field with the partner's live waterings (farmLive.svelte.ts: plot → when) on the plants not watered yet whose
 *  growth they fall in (a watering before a harvest or a replanting is that plant's, not this one's): `farm` itself
 *  when none applies. Pure. */
export function withLive(farm: Farm, live: ReadonlyMap<string, number>, now: number): Farm {
  let plots: Map<string, Plot> | null = null;
  for (const [p, t] of live) {
    const pl = farm.plots.get(p);
    if (!pl || pl.w || isRipe(pl, now) || t < pl.t - FARM.growMs) continue;
    (plots ??= new Map(farm.plots)).set(p, { ...pl, w: true });
  }
  return plots ? { plots, net: farm.net } : farm;
}

/** What the fold reads of the model's State. */
type FarmRows = Parameters<typeof farmOfState>[0] & Parameters<typeof wetOf>[0];

/** The fields now: the plants (the record's field, my unsent rows as it will judge them, the partner's live
 *  waterings), the island's clock (the relay's, a preview's) and the wet days, today's too once it rains or snows here
 *  (before the record's wet row comes). Reactive on the weather and the live waterings. */
export function farmNow(s: FarmRows): { farm: Farm; now: number; wet: WetDay } {
  const now = world.now(), rows = wetOf(s), today = localDateAt(now);
  const sky = isRain(weather.sky) || weather.sky === 'snow';
  return { farm: withLive(farmOfState(s), liveWater(), now), now, wet: sky ? (d) => d === today || rows(d) : rows };
}
