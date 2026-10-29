// Key helpers for the v4 official art groups (style guide §A). Every helper returns a manifest key
// (render it with <OfficialArt key>); <OfficialArt> falls back gracefully when a file is missing.
// The older helpers (villagerArt, hostArt, fruitArt, moneyArt…) stay in lib/client/assets.ts.
import type { Season } from '#lib/client/theme.svelte.ts';

/** NH reaction-wheel icons (grey cat face + coloured accents), shown inside the emote bubble. */
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

/** Anything the emote bubble can hold: a reaction id or `pose-<id>`. */
export type EmoteIcon = ReactionId | `pose-${PoseId}`;

export function reactionArt(id: EmoteIcon): string {
  return `reactions/${id}`;
}
export function poseArt(id: PoseId): string {
  return `reactions/pose-${id}`;
}

/** The hardwood (oak) of the season: spring = cherry blossom, autumn = red-orange, winter = snow. */
export function treeArt(season: Season | 'cedar' | 'palm'): string {
  if (season === 'cedar' || season === 'palm') return `trees/${season}`;
  return `trees/oak-${season === 'autumn' ? 'fall' : season}`;
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
