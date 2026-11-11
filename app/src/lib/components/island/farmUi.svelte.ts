// The fields' controls on this phone (docs/farming.md "Playing"): the picker (FarmPicker), opened by a tap on my empty
// plot with nothing held, or none left (SceneTaps), whose pick plants that plot, and the verb a plot's tap pops over it
// (FarmPop), and the 畑 sheet's wave over the island on its close (farmWave, played by SceneTaps).
import { seedKey, type Crop, type FarmSrc } from '#lib/contract/farm.ts';
import { pickSeed, type Seed } from '#lib/store/farm.svelte.ts';
import { t } from '#lib/i18n/index.ts';

/** A tap's word over its plot: px from the scene's top-left (the plot's top, as the tap saw it); `n` new each pop. */
interface FarmPopAt { text: string; x: number; y: number; n: number }

/** The 畑 sheet's payoff on its close (docs/farming.md "Playing"): a 収穫's sparkles or a 水やり's drops over plots `ps`;
 *  `n` new each wave, `at` when (Date.now()). */
export interface FarmWave { kind: 'harvest' | 'water'; ps: readonly string[]; n: number; at: number }

export const farmUi = $state<{ picker: boolean; pop: FarmPopAt | null; wave: FarmWave | null }>({ picker: false, pop: null, wave: null });

let pops = 0;
/** Pop `text` over a plot at (x, y), the last one's place taken. */
export function popAt(text: string, x: number, y: number): void {
  farmUi.pop = { text, x, y, n: ++pops };
}

let waves = 0;
/** A wave not played this long after its close never plays (SceneTaps: the island stayed covered). */
export const WAVE_MS = 1000;
/** The sheet closed after a 収穫 or a 水やり of plots `ps`: SceneTaps plays its wave over them shortly after (none if
 *  the island is covered again by then). A harvest's wins over a water's waiting with it (one wave a close). */
export function farmWave(kind: FarmWave['kind'], ps: readonly string[]): void {
  const now = Date.now(), w = farmUi.wave;
  if (!ps.length || (kind === 'water' && w?.kind === 'harvest' && now - w.at < WAVE_MS)) return;
  farmUi.wave = { kind, ps: [...ps], n: ++waves, at: now };
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
