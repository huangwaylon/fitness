// Official New Horizons art (static/art/, fetched by `npm run assets:fetch`; see docs/ops/runbook.md §8) and the key
// helpers for every art group (docs/design.md#official-art). The manifest is bundled at build time (without its `source` credits,
// stripped by vite.config.ts), so keys, sizes and aspect ratios are known synchronously: no fetch, no auth. Render
// through <OfficialArt key>, which falls back to our fan-art when a file is missing.
import { asset } from '$app/paths';
import manifest from '../../static/art/manifest.json';
import type { RingFruit } from '#lib/types.ts';
import type { Foliage } from '#lib/ui-state/season.ts';

interface ArtEntry {
  path: string;
  w: number;
  h: number;
  /** Visible (non-transparent) box `[x, y, w, h]` in file pixels; only for renders with big margins. */
  box?: [number, number, number, number];
}

/** key → [w, h], unpacked from the build's packed manifest (vite.config.ts slimArtManifest); the file is `<key>.webp`. */
const FILES: Record<string, readonly [number, number]> = {};
for (const [g, [w, h, h2, plain, odd]] of Object.entries(manifest.files as unknown as Record<string, [number, number, number, string, string]>)) {
  const key = g.endsWith('/*-icon') ? (n: string) => `${g.slice(0, -7)}/${n}-icon` : (n: string) => `${g}/${n}`;
  for (const n of plain ? plain.split(',') : []) FILES[key(n)] = [w, h];
  for (const e of odd ? odd.split(',') : []) {
    const [n, ow, oh] = e.split(':');
    FILES[key(n)] = [Number(ow), oh === undefined ? h2 : Number(oh)];
  }
}

// Renders whose figure sits in a padded canvas: <OfficialArt> crops to this box so `size` means
// "figure height" for every character. (Measured from the alpha channel; the rest are already tight.)
const BOX: Record<string, [number, number, number, number]> = {
  'host/isabelle-stand': [140, 42, 231, 428],
  'host/isabelle-winter': [140, 42, 231, 428],
  'villagers/hamlet': [28, 20, 329, 482]
};

/** The balloon catalogue's icons (components/island/catalog.ts, scripts/catalog.ts): ~2,000 files, all 96 px squares,
 *  so they stay out of the bundled manifest. */
const CATALOG_KEY = /^finds\/(items|recipes)\/[a-z][a-z0-9-]*$/;
const CATALOG_SIZE = [96, 96] as const;

/** Manifest entry for a key like 'villagers/raymond' (or a catalogue icon's), or null when that art isn't on disk. */
export function art(key: string | null | undefined): ArtEntry | null {
  const size = key ? (FILES[key] ?? (CATALOG_KEY.test(key) ? CATALOG_SIZE : undefined)) : undefined;
  if (!key || !size) return null;
  return { path: `${key}.webp`, w: size[0], h: size[1], ...(BOX[key] && { box: BOX[key] }) };
}

/** Every manifest key (dev gallery, asset tests). */
export function artKeys(): string[] {
  return Object.keys(FILES);
}

/** URL for a key (base-path aware), or null when missing. */
export function artUrl(key: string | null | undefined): string | null {
  const e = art(key);
  return e ? asset(`art/${e.path}` as Parameters<typeof asset>[0]) : null;
}

/** Roster villager → full-body render, or the round head icon. Unknown ids → null (use fan-art). */
export function villagerArt(id: string | null | undefined, icon = false): string | null {
  if (!id) return null;
  const key = `villagers/${id}${icon ? '-icon' : ''}`;
  return FILES[key] ? key : null;
}

export type HostPose = 'wave' | 'stand' | 'bow' | 'winter' | 'icon';
const HOST: Record<HostPose, string> = {
  wave: 'host/isabelle',
  stand: 'host/isabelle-stand',
  bow: 'host/isabelle-stand',
  winter: 'host/isabelle-winter',
  icon: 'host/isabelle-icon'
};
/** Isabelle: 'wave' (cheerful, default), 'stand' (calm), 'bow' (sorry / thanks), 'winter', 'icon'.
 *  NH has no official bow render, so 'bow' is the stand render (same outfit) and <Host> adds a CSS bow.
 *  'winter' is the full-body cardigan model on the same canvas as 'stand'.
 *  `nook`: Tom Nook stands in (a player picked Isabelle): his one render for every pose (the precached `host/` copy,
 *  also the error page's), his roster head icon. */
export function hostArt(pose: HostPose, nook = false): string {
  if (nook) return pose === 'icon' ? 'villagers/tom-nook-icon' : 'host/tom-nook';
  return HOST[pose];
}

/** けんこう's からだ cards → a catalogue icon each, as the activity cards have their fruit (docs/design.md#kenkou):
 *  weight the red kitchen scale, body fat the protein shaker, BMI the exercise bike, lean mass the weight bench. */
export const BODY_ART: Record<'weight' | 'body_fat_pct' | 'bmi' | 'lean_kg', string> = {
  weight: 'finds/items/analog-kitchen-scale',
  body_fat_pct: 'finds/items/protein-shaker-bottle',
  bmi: 'finds/items/exercise-bike',
  lean_kg: 'finds/items/weight-bench'
};

/** けんこう's two groups → a catalogue icon each on their switch (the user: cute, no ball nor scale): かつどう NH's cute
 *  sneakers (moving), からだ the dreamy bear toy (soft, cute: the user's pick over the mirror). */
export const GROUP_ART: Record<'activity' | 'body', string> = {
  activity: 'finds/items/cute-sneakers',
  body: 'finds/items/dreamy-bear-toy'
};

/** ごはん's tabs → a catalogue icon each on their switch, as けんこう's groups: きろく the rice cooker (ごはん itself; the
 *  plate meal it replaced was a flat blur at 22px, the user couldn't tell what it was), グラフ the whiteboard (the
 *  chart). */
/** ごはん's グラフ cards: the kcal eaten NH's dinner set, then a catalogue item per nutrient (decorative; the heading
 *  names it): protein the barbecue grill (meat), fat the cream and sugar, carbs the sticky rice, salt the spice rack, fibre the
 *  veggie plate, alcohol the green bottles. */
export const NUTRIENT_ART: Record<'k' | 'p' | 'fa' | 'c' | 's' | 'fi' | 'al', string> = {
  k: 'items/dinner',
  p: 'finds/items/barbecue',
  fa: 'finds/items/cream-and-sugar',
  c: 'finds/items/sticky-rice',
  s: 'finds/items/revolving-spice-rack',
  fi: 'finds/items/veggie-plate-meal',
  al: 'finds/items/decorative-bottles'
};

export const FOOD_TAB_ART: Record<'log' | 'chart', string> = {
  log: 'finds/items/rice-cooker',
  chart: 'finds/items/whiteboard'
};

/** ごはん's category tiles (components/food/FoodThumb.svelte; docs/design.md "Gohan"): each `Item.cat` (and レシピ: a
 *  マイレシピ) → its tint and its icon, a catalogue item where one fits, else one of FoodThumb's drawn ones (`draw`).
 *  The tints by family, mid-saturation: grains rice cream, vegetables leaf, the sea blue, meat coral-brown, fruit peach,
 *  dairy and eggs butter, beans and nuts soy tan, seaweed dark green, mushrooms brown, drinks lilac, sweets pink,
 *  seasonings sand, the rest grey-cream (night: FoodThumb darkens them). `box`: the icon's visible part in its file
 *  (x, y, w, h), what the tile fits (a catalogue icon sits small in its 96 px square). */
export type FoodDraw = 'bowl' | 'egg' | 'beans' | 'nut' | 'imo';
const T = { grain: '#F3E2B3', veg: '#C4E3A9', sea: '#B8DCEC', meat: '#EDC3A8', fruit: '#F9CBB5', dairy: '#F6E59C', soy: '#E6D2A6',
  weed: '#A3CBA6', shroom: '#DCC6AC', drink: '#DACDF2', sweet: '#F6C9D7', sand: '#EADCC0', rest: '#E7E2D4' } as const;
export const FOOD_CAT: Record<string, { tint: string; art?: string; box?: readonly [number, number, number, number]; draw?: FoodDraw }> = {
  主食: { tint: T.grain, draw: 'bowl' },
  麺: { tint: T.grain, art: 'finds/items/hearty-ramen', box: [15, 19, 66, 47] },
  '丼・定食': { tint: T.grain, art: 'finds/items/japanese-style-meal', box: [5, 36, 86, 33] },
  寿司: { tint: T.grain, art: 'finds/items/tuna-sushi-costume', box: [21, 6, 54, 83] },
  パン: { tint: T.grain, art: 'finds/items/pop-up-toaster', box: [12, 4, 72, 88] },
  主菜: { tint: T.meat, art: 'finds/items/luncheon-plate-meal', box: [6, 29, 84, 41] },
  肉: { tint: T.meat, art: 'finds/items/barbecue', box: [28, 15, 40, 71] },
  副菜: { tint: T.veg, art: 'finds/items/veggie-plate-meal', box: [6, 29, 84, 41] },
  野菜: { tint: T.veg, art: 'deco/pumpkin', box: [2, 2, 92, 89] },
  魚介: { tint: T.sea, art: 'critters/horse-mackerel', box: [9, 25, 78, 46] },
  卵: { tint: T.dairy, draw: 'egg' },
  乳製品: { tint: T.dairy, art: 'finds/items/milk-can', box: [27, 10, 42, 77] },
  '大豆・豆': { tint: T.soy, draw: 'beans' },
  'ナッツ・種': { tint: T.soy, draw: 'nut' },
  いも: { tint: T.soy, draw: 'imo' },
  果物: { tint: T.fruit, art: 'fruit/apple', box: [22, 15, 84, 97] },
  きのこ: { tint: T.shroom, art: 'finds/round-mushroom', box: [2, 2, 76, 52] },
  海藻: { tint: T.weed, art: 'critters/seaweed', box: [12, 12, 72, 71] },
  '菓子・デザート': { tint: T.sweet, art: 'items/candy', box: [10, 21, 75, 54] },
  飲料: { tint: T.drink, art: 'finds/items/bottled-beverage', box: [33, 10, 30, 78] },
  酒: { tint: T.drink, art: 'finds/items/decorative-bottles', box: [30, 9, 43, 77] },
  汁物: { tint: T.sand, art: 'finds/items/soup-kettle', box: [24, 13, 49, 73] },
  調味料: { tint: T.sand, art: 'finds/items/revolving-spice-rack', box: [18, 21, 60, 65] },
  油脂: { tint: T.sand, art: 'finds/items/cream-and-sugar', box: [10, 28, 76, 47] },
  コンビニ: { tint: T.rest, art: 'finds/items/store-shelf', box: [23, 5, 50, 85] },
  外食: { tint: T.rest, art: 'finds/items/storefront', box: [14, 5, 68, 85] },
  レシピ: { tint: T.meat, art: 'finds/items/stewpot', box: [18, 15, 60, 70] },
  その他: { tint: T.rest, art: 'finds/items/dinnerware', box: [24, 14, 58, 64] }
};

/** One of the four ring fruits → inventory icon key. */
export function fruitArt(fruit: RingFruit): string {
  return `fruit3d/${fruit}`;
}


/** Money UI: 'bells' (the Bells bag) or 'leaf'. */
export function moneyArt(kind: 'bells' | 'leaf'): string {
  return kind === 'bells' ? 'money/bells' : 'money/leaf';
}

/** NH reaction-wheel icons (mostly a grey cat face + coloured accents): しずえ's bubble; villagers use
 *  only the colour glyphs among them (`villagerEmote`). */
export const REACTIONS = [
  'joy', 'love', 'surprise', 'laughter', 'sleepy', 'happiness', 'encouraging', 'glee', 'pleased', 'pride',
  'inspiration', 'dozing', 'curiosity', 'thought', 'flourish', 'sheepishness', 'worry', 'shocked'
] as const;
export type ReactionId = (typeof REACTIONS)[number];

/** Our own vector marks (Mark.svelte), the floating symbols NH villagers show: ♪ ! ? 💦 ♥ ✦ zz. */
export const MARKS = ['note', 'bang', 'question', 'sweat', 'heart', 'sparkle', 'zzz'] as const;
export type MarkId = (typeof MARKS)[number];

/** Anything an emote can hold: a reaction id, the one pose reaction (the both-of-us dance) or `mark-<id>`. */
export type EmoteIcon = ReactionId | 'pose-viva' | `mark-${MarkId}`;

/** Official reaction glyphs that are pure colour symbols (no grey cat face): fine on villagers. */
export const COLOUR_GLYPHS: readonly ReactionId[] = ['love', 'surprise', 'glee', 'inspiration', 'curiosity', 'thought'];

/** NH villagers never show the player's cat-face icons: map any cat face to the floating
 *  symbol a villager would show. Colour glyphs, poses and marks pass through. */
const FOR_VILLAGER: Partial<Record<ReactionId, EmoteIcon>> = {
  joy: 'glee', laughter: 'glee', happiness: 'mark-note', pleased: 'mark-note', pride: 'mark-sparkle', flourish: 'mark-sparkle',
  encouraging: 'mark-heart', sleepy: 'mark-zzz', dozing: 'mark-zzz', shocked: 'mark-bang', sheepishness: 'mark-sweat',
  worry: 'mark-sweat'
};
export function villagerEmote(e: EmoteIcon): EmoteIcon {
  return (FOR_VILLAGER as Record<string, EmoteIcon>)[e] ?? e;
}
export function isMark(e: EmoteIcon): e is `mark-${MarkId}` {
  return e.startsWith('mark-');
}

export function reactionArt(id: EmoteIcon): string {
  return `reactions/${id}`;
}

/** The hardwood (oak) by foliage (ui-state/season.ts): cherry blossom (Apr 1–10 only), green, red-orange, snow. */
const OAK: Record<Foliage, string> = { blossom: 'oak-spring', green: 'oak-summer', fall: 'oak-fall', snow: 'oak-winter' };
export function treeArt(f: Foliage): string {
  return `trees/${OAK[f]}`;
}

/** The hedge's bushes (island/scene.ts builds `bushes/<id>`). */
export type BushId =
  | 'pink-azalea' | 'white-azalea' | 'blue-hydrangea' | 'pink-hydrangea' | 'red-hibiscus' | 'yellow-hibiscus'
  | 'orange-tea-olive' | 'yellow-tea-olive' | 'holly' | 'pink-camellia' | 'red-camellia';

/** The falling seasonal particles (Particles.svelte, FruitTree's shake). */
export type SeasonItem = 'petal' | 'maple-leaf' | 'snowflake';
export function seasonArt(id: SeasonItem): string {
  return `season/${id}`;
}

/** NH's flowers (static/art/flowers: a colour and a kind; not every pair exists, the scene's tables name only shipped
 *  ones: scenery.test). */
export type FlowerKind = 'tulips' | 'roses' | 'cosmos' | 'mums' | 'lilies' | 'pansies' | 'hyacinths' | 'windflowers';
export type FlowerColour = 'red' | 'white' | 'yellow' | 'pink' | 'orange' | 'purple' | 'blue' | 'black' | 'green';
export type FlowerId = `${FlowerColour}-${FlowerKind}`;
export function flowerArt(id: FlowerId): string {
  return `flowers/${id}`;
}
