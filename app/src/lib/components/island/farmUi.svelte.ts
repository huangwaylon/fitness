// The fields' controls on this phone (docs/farming.md "Playing"): the farm menu's armed shovel and its picker (FarmPicker),
// shared by the menu (FarmMenu) and a tap on a plot (SceneTaps: one shot of the shovel; the picker for my empty plot
// with nothing held, or none left, whose pick plants that plot).
import { seedKey, type Crop, type FarmSrc } from '#lib/contract/farm.ts';
import { pickSeed, type Seed } from '#lib/store/farm.svelte.ts';
import { t } from '#lib/i18n/index.ts';

export const farmUi = $state({ shovel: false, picker: false });

/** What the open picker's pick does once kept: the tapped plot planted (SceneTaps), else nothing more. */
let then: (() => void) | null = null;

export function openPicker(after?: () => void): void {
  then = after ?? null;
  farmUi.picker = true;
}

export function closePicker(): void {
  farmUi.picker = false;
  then = null;
}

/** A pick: kept (store/farm.svelte.ts), the picker shut, the plot that opened it planted. True: it planted. */
export function choose(s: Seed): boolean {
  pickSeed(s);
  const go = then;
  closePicker();
  go?.();
  return !!go;
}

/** A crop's (or its start's) name, the catch catalog's (loaded: catchLine.ts loadNames), en without its article. */
export const cropName = (c: Crop, src: FarmSrc = 'crop'): string => t(`beach.name.${seedKey(c, src).slice('goods:'.length)}`).replace(/^(an?|some) /, '');
