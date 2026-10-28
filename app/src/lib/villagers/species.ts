// Shared character types: the five expressions (style guide §7.4) and the emote each one pops.
// (v3: the 8-species × 3-colourway fan-art system is gone; official renders cover the roster.)

export type Expression = 'happy' | 'cheer' | 'sleepy' | 'surprised' | 'proud';
export type EmoteKind = 'note' | 'bang' | 'zz' | 'sparkle' | 'heart';

export const EXPRESSIONS: Expression[] = ['happy', 'cheer', 'sleepy', 'surprised', 'proud'];

/** The emote each expression pops (happy has none). */
export const EXPRESSION_EMOTE: Record<Expression, EmoteKind | null> = {
  happy: null,
  cheer: 'note',
  sleepy: 'zz',
  surprised: 'bang',
  proud: 'sparkle'
};
