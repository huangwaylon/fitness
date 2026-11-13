// What a balloon's present can hold (docs/design.md "Balloon"): NH's furniture and clothing from the shops' stock and
// NH's DIY recipes balloons carry, one entry per base item (no colour variants), as scripts/catalog.ts built them from
// the ACNH spreadsheet and Nookipedia (catalog.json; names `item.name.<id>` / `recipe.name.<id>` in i18n/catalog.*.json;
// icons static/art/finds/{items,recipes}/<id>.webp). Never Bells (scenery never pays), nothing kept: the present is held
// up and the ずかん's カタログ / レシピ pages count it. Pure: the pick takes its random source.
//
// Odds, after NH (Nookipedia, Balloon: item drop rates, the day's first balloons with Bells and materials left out):
// furniture 35 : clothing 20 : a season's recipe 15 while a recipe season is on, else furniture 50 : clothing 25.
// Within furniture every item is as likely; clothing in its style's season (spring, summer...) twice as likely. The
// shops' season stock (the Able Sisters' summer and winter lines, Nook's Cranny's summer slot) only in its season.
// Now and then (1 in ART_ONE_IN, not NH's: no Redd here) a present holds a genuine artwork the museum hasn't got yet
// (museum/artIds.ts), its first find a donation to the art gallery; once all 43 are in, none.
import data from './catalog.json';
import room from '../tent/items.json';
import { dayRand } from '../../world/daySeed.ts';
import { isArt } from '../museum/artIds.ts';

/** A dated window (MM-DD, inclusive; `from` > `to` wraps past New Year). */
type Window = readonly [string, string];

export const FURNITURE_CATEGORIES = ['housewares', 'misc', 'wall', 'ceiling'] as const;
export const CLOTHING_CATEGORIES = ['tops', 'bottoms', 'dress', 'headwear', 'accessories', 'socks', 'shoes', 'umbrellas'] as const;
type ItemCategory = (typeof FURNITURE_CATEGORIES)[number] | (typeof CLOTHING_CATEGORIES)[number];

/** The shops' season stock and its window (NH's shopping seasons, northern hemisphere). */
const STOCK: Record<string, Window> = { summer: ['06-01', '08-31'], winter: ['12-01', '02-29'] };
/** Clothing's style seasons (what villagers wear when): months. */
const STYLE: Record<string, readonly number[]> = { spring: [3, 4, 5], summer: [6, 7, 8], autumn: [9, 10, 11], winter: [12, 1, 2] };

/** NH's recipe seasons balloons carry (northern hemisphere; Nookipedia and the spreadsheet's crafting seasons).
 *  Bunny Day's recipes come with its egg balloons on the ready days and the day itself (a moving feast: `bunnyDay`). */
export const RECIPE_SEASONS = {
  cherry: ['04-01', '04-10'], bamboo: ['02-25', '05-21'], shells: ['06-01', '08-31'], acorns: ['09-01', '12-10'],
  maple: ['11-16', '11-25'], mushrooms: ['11-01', '11-30'], ornaments: ['12-15', '01-06'], snowflakes: ['12-11', '02-24'],
  halloween: ['10-01', '10-31'], shamrock: ['03-10', '03-17'], bunny: null
} as const satisfies Record<string, Window | null>;
type RecipeSeason = keyof typeof RECIPE_SEASONS;

interface CatalogItem {
  id: string;
  category: ItemCategory;
  /** A shop's season stock: only then. */
  stock?: 'summer' | 'winter';
  /** Clothing's style season: twice as likely then. */
  style?: 'spring' | 'summer' | 'autumn' | 'winter';
}
interface CatalogRecipe { id: string; season: RecipeSeason }

/** Every item, in the ずかん's order (category, then NH's own order). */
export const ITEMS: readonly CatalogItem[] = data.items.map((row) => {
  const [id, category, stock, style] = row.split(' ');
  return { id, category: category as ItemCategory, ...(stock ? { stock: stock as CatalogItem['stock'] } : {}), ...(style ? { style: style as CatalogItem['style'] } : {}) };
});
/** Every recipe, in NH's DIY order. */
export const RECIPES: readonly CatalogRecipe[] = data.recipes.map((row) => {
  const [id, season] = row.split(' ');
  return { id, season: season as RecipeSeason };
});

const ODDS = { inSeason: { furniture: 35, clothing: 20, recipe: 15 }, offSeason: { furniture: 50, clothing: 25, recipe: 0 } } as const;
const STYLE_BOOST = 2;
const FURNITURE = new Set<string>(FURNITURE_CATEGORIES);

const inWindow = ([from, to]: Window, md: string): boolean => (from <= to ? md >= from && md <= to : md >= from || md <= to);

/** The recipes balloons carry on `date` (YYYY-MM-DD); `bunnyDay`: Bunny Day's ready days or the day. */
export function recipesOn(date: string, bunnyDay = false): CatalogRecipe[] {
  const md = date.slice(5);
  return RECIPES.filter(({ season }) => {
    const w = RECIPE_SEASONS[season];
    return w ? inWindow(w, md) : bunnyDay;
  });
}

/** An item a shop has on `date`: its season stock only in season. */
const stocked = (i: CatalogItem, md: string): boolean => !i.stock || inWindow(STOCK[i.stock], md);

export type Present = { kind: 'item' | 'recipe'; id: string };

/** A weighted pick from `list` (`r`: uniform [0, 1)). */
function weighted<T>(list: readonly T[], weight: (t: T) => number, r: () => number): T {
  let x = r() * list.reduce((s, t) => s + weight(t), 0);
  for (const t of list) if ((x -= weight(t)) < 0) return t;
  return list[list.length - 1];
}

/** A balloon's present holds a genuine artwork one time in this many (while the museum lacks one). */
export const ART_ONE_IN = 10;

/** What's inside a present opened on `date` (YYYY-MM-DD): a season's recipe, a piece of furniture or of clothing, at
 *  NH's odds (above); one time in ART_ONE_IN one of `art` (the genuine artworks not yet in the museum), if any.
 *  `r`: a uniform [0, 1) source; `bunnyDay`: Bunny Day's recipes are on. */
export function pickPresent(date: string, r: () => number, bunnyDay = false, art: readonly string[] = []): Present {
  if (art.length && r() < 1 / ART_ONE_IN) return { kind: 'item', id: art[Math.floor(r() * art.length)] };
  const md = date.slice(5), month = Number(date.slice(5, 7));
  const recipes = recipesOn(date, bunnyDay);
  const odds = recipes.length ? ODDS.inSeason : ODDS.offSeason;
  const x = r() * (odds.furniture + odds.clothing + odds.recipe);
  if (x >= odds.furniture + odds.clothing) return { kind: 'recipe', id: recipes[Math.floor(r() * recipes.length)].id };
  const furniture = x < odds.furniture;
  const pool = ITEMS.filter((i) => FURNITURE.has(i.category) === furniture && stocked(i, md));
  const item = weighted(pool, (i) => (i.style && STYLE[i.style].includes(month) ? STYLE_BOOST : 1), r);
  return { kind: 'item', id: item.id };
}

/** The furniture the tent has a model of (tent/items.json's ずかん ids): a find of it can be placed. */
const PLACEABLE = new Set(Object.values(room.items as Record<string, { cat?: string }>).flatMap((m) => (m.cat ? [m.cat] : [])));
/** What a tree can hold on a day (docs/design.md "Shaking a tree"): a present's furniture on `date` (every piece as
 *  likely, the shops' season stock only in season), of the pieces the tent can place. */
export const treeFurniture = (date: string): CatalogItem[] =>
  ITEMS.filter((i) => FURNITURE.has(i.category) && stocked(i, date.slice(5)) && PLACEABLE.has(i.id));
/** The piece of furniture `tree` holds on `date` (treeGifts.ts: two trees a day), the same on every phone: seeded by
 *  the date, the tree and the island's seed. Never Bells. */
export function treeItem(date: string, tree: string, seed?: string): Present {
  const pool = treeFurniture(date);
  return { kind: 'item', id: pool[Math.floor(dayRand(date, `tree-gift:${tree}`, seed)() * pool.length)].id };
}

/** An entry's icon (an art key, lib/art.ts: static/art/finds/items|recipes/<id>.webp): the item's official icon, or
 *  what the recipe makes. */
export const catalogArt = ({ kind, id }: Present): string => (kind === 'recipe' ? `finds/recipes/${id}` : isArt(id) ? `finds/art/${id}` : `finds/items/${id}`);
/** An entry's name key (i18n/catalog.*.json; an artwork's, i18n/catch.*.json). */
export const catalogName = ({ kind, id }: Present): string => (kind === 'recipe' ? `recipe.name.${id}` : isArt(id) ? `art.name.${id}` : `item.name.${id}`);
