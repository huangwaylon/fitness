// The fields' controls on this phone (docs/farming.md "Playing"): the picker (FarmPicker), opened by a tap on an empty
// plot with two or more kinds held and no crop chosen (SceneTaps), whose pick runs that tap again with it; and the verb a
// plot's tap pops over it (FarmPop), with ほる on a plant, and a plant's word (aboutLine).
import { seedKey, type Crop, type FarmSrc } from '#lib/contract/farm.ts';
import { pickSeed, type Seed } from '#lib/store/farm.svelte.ts';
import { t } from '#lib/i18n/index.ts';
import { leftHM, type FarmTap } from '#lib/world/farmTap.ts';
import type { Who } from '#lib/types.ts';

/** A tap's word over its plot: px from the scene's top-left (the plot's top, as the tap saw it); `n` new each pop;
 *  `dig`: ほる's (a growing plant), its button over the word. */
interface FarmPopAt { text: string; x: number; y: number; n: number; dig?: () => void }

export const farmUi = $state<{ picker: boolean; pop: FarmPopAt | null }>({ picker: false, pop: null });

let pops = 0;
/** Pop `text` over a plot at (x, y), the last one's place taken; `dig`: offer ほる with it. */
export function popAt(text: string, x: number, y: number, dig?: () => void): void {
  farmUi.pop = { text, x, y, n: ++pops, ...(dig ? { dig } : {}) };
}

/** What the open picker's pick does: the tap that opened it, again with the crop picked (SceneTaps). */
let then: ((s: Seed) => void) | null = null;

export function openPicker(after: (s: Seed) => void): void {
  then = after;
  farmUi.picker = true;
}

export function closePicker(): void {
  farmUi.picker = false;
  then = null;
}

/** A pick: kept (the picker's highlight next time: store/farm.svelte.ts), the picker shut, the plot that opened it
 *  tapped again with it. */
export function choose(s: Seed): void {
  pickSeed(s);
  const go = then;
  closePicker();
  go?.(s);
}

/** A crop's (or its start's) name, the catch catalog's (loaded: catchLine.ts loadNames), en without its article. */
export const cropName = (c: Crop, src: FarmSrc = 'crop'): string => t(`beach.name.${seedKey(c, src).slice('goods:'.length)}`).replace(/^(an?|some) /, '');

/** The word over a plant (world kana), short enough for an iPhone 15 at a glance (the user, 2026-11-27): 「トマト・あと
 *  2じかん 20ぷん」, and while it grows back its harvester on a short second line, 「うめが しゅうかく」 (じぶんで: this
 *  phone's player; none on a plant harvested before 2026-11-26). No watered note: a tap only words a watered plant (an
 *  unwatered one in its 3 × 3 takes the can). `crop` its name, `nameOf` a player's name as the app spells it. */
export function aboutLine(a: Extract<FarmTap, { a: 'about' }>, crop: string, me: Who, nameOf: (w: Who) => string): string {
  const { h, m } = leftHM(a.left);
  const line = t('world.farm.left', { name: crop, left: t(h && m ? 'world.farm.inHM' : h ? 'world.farm.inH' : 'world.farm.inM', { h, m }) });
  if (!a.by) return line;
  return `${line}\n${a.by === me ? t('world.farm.byMe') : t('world.farm.by', { who: nameOf(a.by) })}`;
}
