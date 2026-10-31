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

const FILES = manifest.files as Record<string, ArtEntry>;

// Renders whose figure sits in a padded canvas: <OfficialArt> crops to this box so `size` means
// "figure height" for every character. (Measured from the alpha channel; the rest are already tight.)
const BOX: Record<string, [number, number, number, number]> = {
  'host/isabelle-stand': [140, 42, 231, 428],
  'host/isabelle-winter': [140, 42, 231, 428],
  'villagers/hamlet': [28, 20, 329, 482]
};

/** Manifest entry for a key like 'villagers/raymond', or null when that art isn't on disk. */
export function art(key: string | null | undefined): ArtEntry | null {
  const e = (key && FILES[key]) || null;
  return e && key && BOX[key] ? { ...e, box: BOX[key] } : e;
}

/** Every manifest key (dev gallery, asset tests). */
export function artKeys(): string[] {
  return Object.keys(FILES);
}

/** URL for a key (base-path aware, so the Pages `/fitness` base works), or null when missing. */
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
export function hostArt(pose: HostPose = 'wave', nook = false): string {
  if (nook) return pose === 'icon' ? 'villagers/tom-nook-icon' : 'host/tom-nook';
  return HOST[pose];
}

/** One of the four ring fruits → inventory icon key. */
export function fruitArt(fruit: RingFruit): string {
  return `fruit/${fruit}`;
}

/** The NookPhone itself (launcher button). */
export const NOOKPHONE = 'phone/nookphone';

/** Money UI: 'bells' (the Bells bag) or 'leaf'. */
export function moneyArt(kind: 'bells' | 'leaf'): string {
  return kind === 'bells' ? 'money/bells' : 'money/leaf';
}

/** NH reaction-wheel icons (mostly a grey cat face + coloured accents): しずえ's bubble; villagers use
 *  only the colour glyphs among them (`villagerEmote`). */
export const REACTIONS = [
  'joy', 'delight', 'love', 'surprise', 'laughter', 'sleepy', 'happiness', 'greetings', 'encouraging', 'glee',
  'pleased', 'pride', 'inspiration', 'daydreaming', 'dozing', 'amazed', 'curiosity', 'thought', 'flourish',
  'bashfulness', 'sheepishness', 'worry', 'confident', 'shocked'
] as const;
export type ReactionId = (typeof REACTIONS)[number];

/** Our own vector marks (Mark.svelte), the floating symbols NH villagers show: ♪ ! ? 💦 ♥ ✦ zz. */
export const MARKS = ['note', 'bang', 'question', 'sweat', 'heart', 'sparkle', 'zzz'] as const;
export type MarkId = (typeof MARKS)[number];

/** Anything an emote can hold: a reaction id, the one pose reaction (the both-of-us dance) or `mark-<id>`. */
export type EmoteIcon = ReactionId | 'pose-viva' | `mark-${MarkId}`;

/** Official reaction glyphs that are pure colour symbols (no grey cat face): fine on villagers. */
export const COLOUR_GLYPHS: readonly ReactionId[] = ['love', 'surprise', 'glee', 'inspiration', 'curiosity', 'thought', 'daydreaming'];

/** NH villagers never show the player's cat-face icons: map any cat face to the floating
 *  symbol a villager would show. Colour glyphs, poses and marks pass through. */
const FOR_VILLAGER: Partial<Record<ReactionId, EmoteIcon>> = {
  joy: 'glee', delight: 'glee', laughter: 'glee', happiness: 'mark-note', greetings: 'mark-note', pleased: 'mark-note',
  pride: 'mark-sparkle', confident: 'mark-sparkle', flourish: 'mark-sparkle', amazed: 'mark-sparkle', encouraging: 'mark-heart',
  sleepy: 'mark-zzz', dozing: 'mark-zzz', shocked: 'mark-bang', sheepishness: 'mark-sweat', worry: 'mark-sweat',
  bashfulness: 'mark-heart'
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

export type FlowerId =
  | 'red-tulips' | 'yellow-tulips' | 'red-roses' | 'white-roses' | 'pink-cosmos' | 'purple-mums' | 'orange-pansies';
export function flowerArt(id: FlowerId): string {
  return `flowers/${id}`;
}
