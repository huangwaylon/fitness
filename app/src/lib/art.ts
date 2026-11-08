// Official New Horizons art (static/art/, fetched by `npm run assets:fetch`; see docs/ops/runbook.md §8) and the key
// helpers for every art group (docs/design.md#official-art). The manifest is bundled at build time (without its `source` credits,
// stripped by vite.config.ts), so keys, sizes and aspect ratios are known synchronously: no fetch, no auth. Render
// through <OfficialArt key>, which falls back to our fan-art when a file is missing.
import manifest from '../../static/art/manifest.json';
import type { RingFruit } from '#lib/types.ts';
import type { Foliage } from '#lib/ui-state/season.ts';
import { staticUrl } from '#lib/staticUrl.ts';

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
  return e ? staticUrl(`art/${e.path}`) : null;
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
 *  マイレシピ) → its tint, its glyph (a plain line symbol drawn by FoodThumb, never a particular food: a leaf for 野菜,
 *  not a pumpkin) and its word in small type. The tints by family, mid-saturation: grains rice cream, vegetables leaf,
 *  the sea blue, meat coral-brown, fruit peach, dairy and eggs butter, beans and nuts soy tan, seaweed dark green,
 *  mushrooms brown, drinks lilac, sweets pink, seasonings sand, the rest grey-cream (night: FoodThumb darkens them). */
export type FoodGlyph =
  | 'bowl' | 'noodles' | 'don' | 'sushi' | 'bread' | 'plate' | 'meat' | 'fish' | 'egg' | 'milk' | 'pod' | 'seed' | 'tuber'
  | 'leaf' | 'side' | 'fruit' | 'mushroom' | 'seaweed' | 'candy' | 'cup' | 'glass' | 'soup' | 'bottle' | 'drop' | 'bag'
  | 'cutlery' | 'pot' | 'dish';
const T = { grain: '#F3E2B3', veg: '#C4E3A9', sea: '#B8DCEC', meat: '#EDC3A8', fruit: '#F9CBB5', dairy: '#F6E59C', soy: '#E6D2A6',
  weed: '#A3CBA6', shroom: '#DCC6AC', drink: '#DACDF2', sweet: '#F6C9D7', sand: '#EADCC0', rest: '#E7E2D4' } as const;
export const FOOD_CAT: Record<string, { tint: string; glyph: FoodGlyph; word: string }> = {
  主食: { tint: T.grain, glyph: 'bowl', word: '主食' },
  麺: { tint: T.grain, glyph: 'noodles', word: '麺' },
  '丼・定食': { tint: T.grain, glyph: 'don', word: '丼' },
  寿司: { tint: T.grain, glyph: 'sushi', word: '寿司' },
  パン: { tint: T.grain, glyph: 'bread', word: 'パン' },
  主菜: { tint: T.meat, glyph: 'plate', word: '主菜' },
  肉: { tint: T.meat, glyph: 'meat', word: '肉' },
  副菜: { tint: T.veg, glyph: 'side', word: '副菜' },
  野菜: { tint: T.veg, glyph: 'leaf', word: '野菜' },
  魚介: { tint: T.sea, glyph: 'fish', word: '魚介' },
  卵: { tint: T.dairy, glyph: 'egg', word: '卵' },
  乳製品: { tint: T.dairy, glyph: 'milk', word: '乳製品' },
  '大豆・豆': { tint: T.soy, glyph: 'pod', word: '豆' },
  'ナッツ・種': { tint: T.soy, glyph: 'seed', word: 'ナッツ' },
  いも: { tint: T.soy, glyph: 'tuber', word: 'いも' },
  果物: { tint: T.fruit, glyph: 'fruit', word: '果物' },
  きのこ: { tint: T.shroom, glyph: 'mushroom', word: 'きのこ' },
  海藻: { tint: T.weed, glyph: 'seaweed', word: '海藻' },
  '菓子・デザート': { tint: T.sweet, glyph: 'candy', word: '菓子' },
  飲料: { tint: T.drink, glyph: 'cup', word: '飲料' },
  酒: { tint: T.drink, glyph: 'glass', word: '酒' },
  汁物: { tint: T.sand, glyph: 'soup', word: '汁物' },
  調味料: { tint: T.sand, glyph: 'bottle', word: '調味料' },
  油脂: { tint: T.sand, glyph: 'drop', word: '油脂' },
  コンビニ: { tint: T.rest, glyph: 'bag', word: 'コンビニ' },
  外食: { tint: T.rest, glyph: 'cutlery', word: '外食' },
  レシピ: { tint: T.meat, glyph: 'pot', word: 'レシピ' },
  その他: { tint: T.rest, glyph: 'dish', word: 'その他' }
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
