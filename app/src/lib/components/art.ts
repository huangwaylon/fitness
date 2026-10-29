// Key helpers for the v4 official art groups (style guide §A). Every helper returns a manifest key
// (render it with <OfficialArt key>); <OfficialArt> falls back gracefully when a file is missing.
// The older helpers (villagerArt, hostArt, fruitArt, moneyArt…) stay in lib/client/assets.ts.
import type { Foliage } from '#lib/client/season.ts';

/** NH reaction-wheel icons (mostly a grey cat face + coloured accents): しずえ's bubble; villagers use
 *  only the colour glyphs among them (`villagerEmote`). */
export const REACTIONS = [
  'joy', 'delight', 'love', 'surprise', 'laughter', 'sleepy', 'happiness', 'greetings', 'encouraging', 'glee',
  'pleased', 'pride', 'inspiration', 'daydreaming', 'dozing', 'amazed', 'curiosity', 'thought', 'flourish',
  'bashfulness', 'sheepishness', 'worry', 'confident', 'shocked'
] as const;
export type ReactionId = (typeof REACTIONS)[number];

/** NH pose reactions (player silhouettes). */
export const POSES = [
  'excited', 'confetti', 'viva', 'lets-go', 'ta-da', 'double-wave', 'jump', 'work-out', 'stretch', 'flex'
] as const;
export type PoseId = (typeof POSES)[number];

/** Our own vector marks (Mark.svelte), the floating symbols NH villagers show: ♪ ! ? 💦 ♥ ✦ zz. */
export const MARKS = ['note', 'bang', 'question', 'sweat', 'heart', 'sparkle', 'zzz'] as const;
export type MarkId = (typeof MARKS)[number];

/** Anything an emote can hold: a reaction id, `pose-<id>` or `mark-<id>`. */
export type EmoteIcon = ReactionId | `pose-${PoseId}` | `mark-${MarkId}`;

/** Official reaction glyphs that are pure colour symbols (no grey cat face): fine on villagers. */
export const COLOUR_GLYPHS: readonly ReactionId[] = ['love', 'surprise', 'glee', 'inspiration', 'curiosity', 'thought', 'daydreaming'];

/** NH villagers never show the player's cat-face icons (A1): map any cat face to the floating
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
export function poseArt(id: PoseId): string {
  return `reactions/pose-${id}`;
}

/** The hardwood (oak) by foliage (client/season.ts): cherry blossom (Apr 1–10 only), green, red-orange, snow. */
const OAK: Record<Foliage, string> = { blossom: 'oak-spring', green: 'oak-summer', fall: 'oak-fall', snow: 'oak-winter' };
export function treeArt(f: Foliage | 'cedar' | 'palm'): string {
  if (f === 'cedar' || f === 'palm') return `trees/${f}`;
  return `trees/${OAK[f]}`;
}

export type BushId = 'pink-azalea' | 'blue-hydrangea' | 'red-hibiscus' | 'orange-tea-olive' | 'pink-camellia' | 'holly' | 'green';
export function bushArt(id: BushId): string {
  return `bushes/${id}`;
}

export type DecoId =
  | 'fence-wood' | 'fence-log' | 'log-bench' | 'mailbox' | 'bonfire' | 'rock' | 'stone' | 'resident-services'
  | 'airport' | 'sand-dollar' | 'cowrie' | 'conch' | 'star-fragment' | 'star-fragment-large' | 'party-popper' | 'present';
export function decoArt(id: DecoId): string {
  return `deco/${id}`;
}

export type SeasonItem = 'petal' | 'maple-leaf' | 'snowflake' | 'snowflake-large' | 'acorn' | 'pine-cone' | 'mushroom';
export function seasonArt(id: SeasonItem): string {
  return `season/${id}`;
}

export type FlowerId =
  | 'red-tulips' | 'yellow-tulips' | 'white-cosmos' | 'red-roses' | 'pink-cosmos' | 'orange-pansies' | 'blue-hyacinths'
  | 'pink-lilies' | 'white-windflowers' | 'purple-mums' | 'yellow-roses' | 'pink-tulips' | 'lily-of-the-valley';
export function flowerArt(id: FlowerId): string {
  return `flowers/${id}`;
}

export type PhoneId =
  | 'diy' | 'passport' | 'rescue' | 'miles' | 'nookphone'
  | 'glyph-help' | 'glyph-chat' | 'glyph-friends' | 'glyph-resident' | 'glyph-map';
export function phoneArt(id: PhoneId): string {
  return `phone/${id}`;
}
