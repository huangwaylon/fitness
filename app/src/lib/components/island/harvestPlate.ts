// A world harvest's plates (SceneTaps; docs/farming.md "Playing"): one a crop, 「トマトを しゅうかく！ ×27・486かいがら」,
// counting up while that crop's plate still shows (catchStack.svelte.ts merges it in place: no retype, its timer anew,
// the icon hops), the vegetables so far and their worth at the shop. Lazy (with the crops' names, catchLine.ts
// loadNames), out of the island's first load.
import { cropKey, type Crop } from '#lib/contract/farm.ts';
import { sellPrice } from '#lib/contract/shop.ts';
import { formatNum, t } from '#lib/i18n/index.ts';
import { cropName } from './farmUi.svelte.ts';
import { showCatch } from './catchCard.ts';
import { showing } from './catchStack.svelte.ts';

const harvestLine = (c: Crop, n: number): string =>
  t('world.farm.harvest', { name: cropName(c), n, v: formatNum(n * (sellPrice(cropKey(c)) ?? 0)) });

/** Each crop's vegetables on its plate so far. */
const so = new Map<Crop, number>();

/** A harvest tap's plates from (x, y) stage units: its harvested plants' crops, each its plate (≤ 2 usually). */
export function showHarvest(x: number, y: number, ops: readonly { c: Crop; n: number }[]): void {
  const crops = new Map<Crop, number>();
  for (const o of ops) crops.set(o.c, (crops.get(o.c) ?? 0) + o.n);
  for (const [c, n] of crops) {
    const key = `harvest:${c}`, total = (showing(key) ? (so.get(c) ?? 0) : 0) + n;
    so.set(c, total);
    showCatch(x, y, `finds/${c}`, harvestLine(c, total), false, 'mine', key);
  }
}
