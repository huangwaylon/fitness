// A harvest's catch plate words (SceneTaps): 「トマトを しゅうかく！ ×3・54かいがら」, the crop's worth at the shop. Lazy (with
// the crops' names, catchLine.ts loadNames), out of the island's first load.
import { cropKey, type Crop } from '#lib/contract/farm.ts';
import { sellPrice } from '#lib/contract/shop.ts';
import { formatNum, t } from '#lib/i18n/index.ts';
import { cropName } from './farmUi.svelte.ts';

export const harvestLine = (c: Crop, n: number): string =>
  t('world.farm.harvest', { name: cropName(c), n, v: formatNum(n * (sellPrice(cropKey(c)) ?? 0)) });
