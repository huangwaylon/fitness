// The garden's models (docs/island-layout.md "Fences and the garden"): the fences, the crops, the garden's flowers and
// the cedar's festive lights, NH's (scripts/world3d-assets.ts GARDEN: a few packs under static/room/world3d/garden/),
// their manifest (garden.json) apart from assets.json and fetched only when the island has one of them (or its cedars'
// lights are up): an island without them loads nothing more. Loaded, its models join models3d.ts MODELS, so the things
// (things.ts) fetch their packs as any other model's; objects.ts draws them once gardenReady().
import { MODELS } from './models3d.ts';
import type { AssetModel } from './assets.ts';
import { isGarden } from '#lib/layout/garden.ts';
import type { Layout } from '#lib/layout/model.ts';
import { WINDOWS } from '../../world/fixedDecor.ts';

let ready = false;
let loading: Promise<void> | null = null;

/** Whether the garden's models are known (MODELS has them). */
export const gardenReady = (): boolean => ready;

/** The garden's manifest into MODELS (once). */
export function loadGarden(): Promise<void> {
  return (loading ??= import('./garden.json').then((m) => {
    Object.assign(MODELS, (m.default as unknown as { models: Record<string, AssetModel> }).models);
    ready = true;
  }));
}

/** NH's cedars wear their lights (PltTreeCedarDeco) in the illuminated weeks, the island's own (fixedDecor.ts WINDOWS
 *  illumi: Dec 15 – Jan 6, the illuminated tree's). */
export function cedarLit(date: string | undefined): boolean {
  if (!date) return false;
  const md = Number(date.slice(5, 7)) * 100 + Number(date.slice(8, 10)), [a, b] = WINDOWS.illumi;
  return md >= a || md <= b;
}

/** Whether a layout on a day draws anything of the garden's (a fence, a crop, a garden flower; a cedar in its lights). */
export function wantsGarden(layout: Layout, date?: string): boolean {
  const lit = cedarLit(date);
  for (const o of layout.objects.values()) if (isGarden(o.k) || (lit && o.k === 'cedar')) return true;
  return false;
}
