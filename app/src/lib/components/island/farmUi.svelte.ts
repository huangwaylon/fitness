// The fields' controls on this phone (docs/farming.md "Playing"): the picker (FarmPicker), opened by a tap on my empty
// plot with nothing held, or none left (SceneTaps), whose pick plants that plot, and the verb a plot's tap pops over it
// (FarmPop).
import { seedKey, type Crop, type FarmSrc } from '#lib/contract/farm.ts';
import { pickSeed, type Seed } from '#lib/store/farm.svelte.ts';
import { t } from '#lib/i18n/index.ts';

/** A tap's word over its plot: px from the scene's top-left (the plot's top, as the tap saw it); `n` new each pop. */
export interface FarmPopAt { text: string; x: number; y: number; n: number }

export const farmUi = $state<{ picker: boolean; pop: FarmPopAt | null }>({ picker: false, pop: null });

let pops = 0;
/** Pop `text` over a plot at (x, y), the last one's place taken. */
export function popAt(text: string, x: number, y: number): void {
  farmUi.pop = { text, x, y, n: ++pops };
}

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
