// Villager species + colourways (style guide v2 §7.3). Pure data; drawn by VillagerArt.svelte.
// Stored per person as prefs `villagerSpecies` (species id) + `villagerColor` (colourway id).
// Unknown or null values fall back to the v0.4 defaults: A = Bean the dog (biscuit), B = Mochi the cat (lilac).

export type SpeciesId = 'cat' | 'dog' | 'rabbit' | 'bear' | 'hamster' | 'duck' | 'frog' | 'sheep';
export type Expression = 'happy' | 'cheer' | 'sleepy' | 'surprised' | 'proud';
export type EmoteKind = 'note' | 'bang' | 'zz' | 'sparkle' | 'heart';
export type EyeVariant = 'oval' | 'dot' | 'happy' | 'sleepy' | 'wide' | 'smug' | 'sparkle';
export type MouthVariant = 'smile' | 'open' | 'cat' | 'o' | 'flat';
export type ShirtPattern = 'plain' | 'stripes' | 'dots' | 'leaf';

export interface Colourway {
  id: string;
  nameJa: string;
  nameEn: string;
  /** Coat (or wool for sheep). */
  base: string;
  /** Ears, legs, markings. */
  shade: string;
  /** Muzzle, inner ear (face for sheep). */
  light: string;
  /** Eye colour override (light eyes on dark faces). */
  eye?: string;
}

export interface Species {
  id: SpeciesId;
  nameJa: string;
  nameEn: string;
  colourways: Colourway[];
  /** Resting mouth for `happy` / `proud`. */
  defaultMouth: MouthVariant;
  /** Resting eyes for `happy`. */
  defaultEyes: EyeVariant;
  /** Head ellipse radii (shared head is rx 36, ry 32). */
  head: { rx: number; ry: number };
  /** Eye centre y (shared 44). */
  eyeY: number;
}

export const SPECIES: Record<SpeciesId, Species> = {
  cat: {
    id: 'cat', nameJa: 'ねこ', nameEn: 'Cat', defaultMouth: 'cat', defaultEyes: 'oval',
    head: { rx: 36, ry: 31 }, eyeY: 44,
    colourways: [
      { id: 'cream', nameJa: 'クリーム', nameEn: 'Cream', base: '#FFF3E6', shade: '#E9D6C2', light: '#FFC9C0' },
      { id: 'lilac', nameJa: 'ライラック', nameEn: 'Lilac', base: '#CDB6F0', shade: '#A98FD6', light: '#FFD6E5' },
      { id: 'ginger', nameJa: 'ジンジャー', nameEn: 'Ginger', base: '#F6B26B', shade: '#D98B45', light: '#FFE6CC' }
    ]
  },
  dog: {
    id: 'dog', nameJa: 'いぬ', nameEn: 'Dog', defaultMouth: 'smile', defaultEyes: 'oval',
    head: { rx: 36, ry: 32 }, eyeY: 43,
    colourways: [
      { id: 'biscuit', nameJa: 'ビスケット', nameEn: 'Biscuit', base: '#F2C48D', shade: '#A8754E', light: '#FFF1DE' },
      { id: 'cocoa', nameJa: 'ココア', nameEn: 'Cocoa', base: '#A9765A', shade: '#7A4F38', light: '#F3DCC4' },
      { id: 'cloud', nameJa: 'くも', nameEn: 'Cloud', base: '#F5F2EC', shade: '#C9BFB3', light: '#FFFFFF' }
    ]
  },
  rabbit: {
    id: 'rabbit', nameJa: 'うさぎ', nameEn: 'Rabbit', defaultMouth: 'smile', defaultEyes: 'oval',
    head: { rx: 35, ry: 31 }, eyeY: 45,
    colourways: [
      { id: 'blush', nameJa: 'さくら', nameEn: 'Blush', base: '#F9C6D3', shade: '#E79AB0', light: '#FFF3F6' },
      { id: 'snow', nameJa: 'ゆき', nameEn: 'Snow', base: '#FBF8F2', shade: '#D9D2C6', light: '#FFC9D3' },
      { id: 'mocha', nameJa: 'モカ', nameEn: 'Mocha', base: '#C9A27E', shade: '#9C7656', light: '#F5E3CF' }
    ]
  },
  bear: {
    id: 'bear', nameJa: 'くま', nameEn: 'Bear', defaultMouth: 'smile', defaultEyes: 'oval',
    head: { rx: 37, ry: 32 }, eyeY: 43,
    colourways: [
      { id: 'honey', nameJa: 'はちみつ', nameEn: 'Honey', base: '#E3A76B', shade: '#B97A45', light: '#F8DDB9' },
      { id: 'mint', nameJa: 'ミント', nameEn: 'Mint', base: '#A9DDC8', shade: '#7FBFA6', light: '#E8F7F0' },
      { id: 'cocoa', nameJa: 'ココア', nameEn: 'Cocoa', base: '#9A6B4F', shade: '#6E4A36', light: '#E6CDB4' }
    ]
  },
  hamster: {
    id: 'hamster', nameJa: 'ハムスター', nameEn: 'Hamster', defaultMouth: 'smile', defaultEyes: 'oval',
    head: { rx: 38, ry: 32 }, eyeY: 43,
    colourways: [
      { id: 'golden', nameJa: 'ゴールデン', nameEn: 'Golden', base: '#F7C26B', shade: '#E39B3C', light: '#FFF4DE' },
      { id: 'pebble', nameJa: 'こいし', nameEn: 'Pebble', base: '#CFC8C2', shade: '#A69C93', light: '#FFFFFF' },
      { id: 'peach', nameJa: 'ピーチ', nameEn: 'Peach', base: '#FFC7A6', shade: '#F3A07E', light: '#FFF1E6' }
    ]
  },
  duck: {
    id: 'duck', nameJa: 'あひる', nameEn: 'Duck', defaultMouth: 'smile', defaultEyes: 'oval',
    head: { rx: 35, ry: 32 }, eyeY: 40,
    colourways: [
      { id: 'sunny', nameJa: 'おひさま', nameEn: 'Sunny', base: '#FFE27A', shade: '#E8C24B', light: '#FFF6C9' },
      { id: 'mint', nameJa: 'ミント', nameEn: 'Mint', base: '#BDE6D5', shade: '#93CDB6', light: '#EFFAF5' },
      { id: 'hazel', nameJa: 'ヘーゼル', nameEn: 'Hazel', base: '#C49A6C', shade: '#9A744C', light: '#F2E2CC' }
    ]
  },
  frog: {
    id: 'frog', nameJa: 'かえる', nameEn: 'Frog', defaultMouth: 'smile', defaultEyes: 'oval',
    head: { rx: 40, ry: 28 }, eyeY: 20,
    colourways: [
      { id: 'leaf', nameJa: 'わかば', nameEn: 'Leaf', base: '#8FD48A', shade: '#5FB15C', light: '#F7F2D0' },
      { id: 'lagoon', nameJa: 'ラグーン', nameEn: 'Lagoon', base: '#6FD0C4', shade: '#43A99C', light: '#E8FAF4' },
      { id: 'sakura', nameJa: 'さくら', nameEn: 'Sakura', base: '#F7B6C9', shade: '#E58FA9', light: '#FFF0F4' }
    ]
  },
  sheep: {
    id: 'sheep', nameJa: 'ひつじ', nameEn: 'Sheep', defaultMouth: 'smile', defaultEyes: 'dot',
    head: { rx: 34, ry: 31 }, eyeY: 45,
    colourways: [
      { id: 'cream', nameJa: 'クリーム', nameEn: 'Cream', base: '#FFFBF2', shade: '#EAE0CF', light: '#F7C9B8' },
      { id: 'cocoa', nameJa: 'ココア', nameEn: 'Cocoa face', base: '#FFFBF2', shade: '#EAE0CF', light: '#6E5B4E', eye: '#FFF1DE' },
      { id: 'pink', nameJa: 'ピンク', nameEn: 'Pink wool', base: '#FFD6E2', shade: '#F2B3C6', light: '#FFF1E6' }
    ]
  }
};

export const SPECIES_IDS = Object.keys(SPECIES) as SpeciesId[];
export const EXPRESSIONS: Expression[] = ['happy', 'cheer', 'sleepy', 'surprised', 'proud'];

/** The emote each expression pops (happy has none). */
export const EXPRESSION_EMOTE: Record<Expression, EmoteKind | null> = {
  happy: null,
  cheer: 'note',
  sleepy: 'zz',
  surprised: 'bang',
  proud: 'sparkle'
};

/** Partner shirt colours (A = apricot, B = plum), matching the jar layers. */
export const SHIRT: Record<'A' | 'B', string> = { A: '#FFB38A', B: '#B79CE0' };
export const SHIRT_PATTERN: Record<'A' | 'B', ShirtPattern> = { A: 'stripes', B: 'dots' };

export const DEFAULTS: Record<'A' | 'B', { species: SpeciesId; colourway: string }> = {
  A: { species: 'dog', colourway: 'biscuit' },
  B: { species: 'cat', colourway: 'lilac' }
};

export function isSpecies(s: unknown): s is SpeciesId {
  return typeof s === 'string' && s in SPECIES;
}

/** Resolve a stored (species, colour) pair to drawable data, with per-person fallbacks. */
export function resolveVillager(
  species: string | null | undefined,
  colourway: string | null | undefined,
  person: 'A' | 'B' = 'A'
): { species: Species; colourway: Colourway } {
  const sp = SPECIES[isSpecies(species) ? species : DEFAULTS[person].species];
  const fallbackCw = sp.id === DEFAULTS[person].species ? DEFAULTS[person].colourway : sp.colourways[0].id;
  const cw =
    sp.colourways.find((c) => c.id === colourway) ??
    sp.colourways.find((c) => c.id === fallbackCw) ??
    sp.colourways[0];
  return { species: sp, colourway: cw };
}
