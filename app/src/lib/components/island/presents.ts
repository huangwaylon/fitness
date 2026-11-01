// What's inside a balloon's present (docs/design.md "Balloon"): NH's balloon presents hold a piece of
// furniture, clothing, a DIY recipe or Bells; here never Bells (scenery never pays), and nothing is kept: it's held up
// over my villager's head while its plate reads 「◯◯を てにいれた！」, then gone. Pure: the pick takes its random source.
// Names: `present.name.<id>` in the catch catalogs (i18n/catch.*.json); art: `presents/<id>` (official icons,
// scripts/fetch-assets.ts), one DIY recipe card for every recipe.
import { pickOne, weighted } from '#lib/random.ts';
import { inMonthDayRange } from '#lib/time/dates.ts';

/** A dated window (MM-DD, inclusive; `from` > `to` wraps past New Year). */
type Window = readonly [string, string];

interface Present {
  /** A piece of furniture or clothing, or a DIY recipe card. */
  kind: 'item' | 'recipe';
  /** Relative odds among the year-round items. */
  weight?: number;
  /** Months (1–12) it's likelier in (×IN_SEASON): a kotatsu in winter, a beach chair in summer. */
  months?: readonly number[];
  /** A seasonal DIY recipe: NH's balloons carry these only in their window (Nookipedia: source "Balloons"). */
  window?: Window;
}

const WINTER = [12, 1, 2], SUMMER = [6, 7, 8];
const IN_SEASON = 3;
/** Half the presents in a seasonal recipe window are that season's recipe (NH's balloons bring them often then). */
const RECIPE_SHARE = 0.5;

/** The presents (NH's items and recipes, official names in the catch catalogs). */
export const PRESENTS = {
  // year-round furniture and clothing (NH: random furniture and clothing from a balloon)
  'rocking-chair': { kind: 'item' }, 'froggy-chair': { kind: 'item' }, 'cute-bed': { kind: 'item' },
  'baby-panda': { kind: 'item' }, 'mama-panda': { kind: 'item' }, 'lucky-cat': { kind: 'item' },
  'apple-chair': { kind: 'item' }, 'peach-chair': { kind: 'item' }, 'pear-wardrobe': { kind: 'item' },
  'orange-end-table': { kind: 'item' }, 'cherry-lamp': { kind: 'item' }, ukulele: { kind: 'item', months: SUMMER },
  'acoustic-guitar': { kind: 'item' }, 'tiki-torch': { kind: 'item', months: SUMMER }, 'bonsai-shelf': { kind: 'item' },
  'beach-chair': { kind: 'item', months: SUMMER }, 'mini-fridge': { kind: 'item' }, 'cat-tower': { kind: 'item' },
  'toy-box': { kind: 'item' }, dharma: { kind: 'item', months: [1] }, 'piggy-bank': { kind: 'item' },
  'candy-machine': { kind: 'item' }, 'flower-stand': { kind: 'item', months: [3, 4, 5] }, 'pansy-table': { kind: 'item', months: [3, 4, 5] },
  'music-stand': { kind: 'item' }, 'wooden-block-toy': { kind: 'item' },
  'inflatable-sofa': { kind: 'item', months: SUMMER }, fan: { kind: 'item', months: SUMMER }, kotatsu: { kind: 'item', months: WINTER },
  humidifier: { kind: 'item', months: WINTER }, 'knit-hat': { kind: 'item', months: WINTER }, 'straw-umbrella-hat': { kind: 'item' },
  'coconut-juice': { kind: 'item', months: SUMMER }, pot: { kind: 'item' }, 'snow-globe': { kind: 'item', months: WINTER },
  // NH's seasonal DIY recipes from balloons, each in its window (northern hemisphere)
  'cherry-blossom-clock': { kind: 'recipe', window: ['04-01', '04-10'] },
  'cherry-blossom-branches': { kind: 'recipe', window: ['04-01', '04-10'] },
  'blossom-viewing-lantern': { kind: 'recipe', window: ['04-01', '04-10'] },
  'bamboo-doll': { kind: 'recipe', window: ['03-01', '05-31'] },
  'bamboo-shoot-lamp': { kind: 'recipe', window: ['03-01', '05-31'] },
  'acorn-rug': { kind: 'recipe', window: ['09-01', '12-10'] },
  'leaf-campfire': { kind: 'recipe', window: ['09-01', '12-10'] },
  'maple-leaf-umbrella': { kind: 'recipe', window: ['11-16', '11-25'] },
  'leaf-stool': { kind: 'recipe', window: ['11-16', '11-25'] },
  'mush-lamp': { kind: 'recipe', window: ['11-01', '11-30'] },
  'mushroom-wreath': { kind: 'recipe', window: ['11-01', '11-30'] },
  'festive-tree': { kind: 'recipe', window: ['12-15', '01-06'] },
  'ornament-mobile': { kind: 'recipe', window: ['12-15', '01-06'] },
  'frozen-fence': { kind: 'recipe', window: ['12-11', '02-24'] },
  'falling-snow-wall': { kind: 'recipe', window: ['12-11', '02-24'] }
} as const satisfies Record<string, Present>;
export type PresentId = keyof typeof PRESENTS;


/** What's inside a present opened on `date` (YYYY-MM-DD): in a seasonal recipe window, half the time that season's
 *  recipe; else a piece of furniture or clothing, ×IN_SEASON in its months. `r`: a uniform [0, 1) source. */
export function pickPresent(date: string, r: () => number): PresentId {
  const month = Number(date.slice(5, 7));
  const entries = Object.entries(PRESENTS) as [PresentId, Present][];
  const recipes = entries.filter(([, p]) => p.kind === 'recipe' && p.window && inMonthDayRange(date, ...p.window));
  if (recipes.length && r() < RECIPE_SHARE) return pickOne(recipes, r)[0];
  const items = entries.filter(([, p]) => p.kind === 'item').map(([id, p]) => [id, (p.weight ?? 1) * (p.months?.includes(month) ? IN_SEASON : 1)] as const);
  return weighted(items, r);
}

/** Its art: the item's official icon, or NH's DIY recipe card for a recipe. */
export const presentArt = (id: PresentId): string => (PRESENTS[id].kind === 'recipe' ? 'presents/diy-recipe' : `presents/${id}`);
/** Its plate: an item, or a recipe (「◯◯のレシピを てにいれた！」), as i18n keys. */
export const presentLine = (id: PresentId): { key: 'present.got' | 'present.gotRecipe'; name: string } =>
  ({ key: PRESENTS[id].kind === 'recipe' ? 'present.gotRecipe' : 'present.got', name: `present.name.${id}` });
