// Villager roster (fan-art renditions, drawn as our own vectors in VillagerArt.svelte).
// A "look" is everything VillagerArt needs: species frame, colours, eyes, mouth, outfit, extras.
// Selection: `villager` key (roster id, e.g. 'raymond') → else generic species + colourway
// (prefs villagerSpecies / villagerColor; villagerSpecies may also hold a roster id) → per-person default.
import {
  SPECIES, isSpecies, resolveVillager, SHIRT, SHIRT_PATTERN,
  type SpeciesId, type Species, type MouthVariant
} from './species.ts';

export type EyeStyle =
  | 'oval' | 'dot' | 'ringed' | 'hetero' | 'bob' | 'lashes' | 'sparkle' | 'x' | 'lily' | 'big';
export type Outfit =
  | 'plain' | 'stripes' | 'dots' | 'leaf' | 'plaid' | 'aloha' | 'waistcoat' | 'stars' | 'star'
  | 'frill' | 'dress' | 'pineapple' | 'tiedye';

export interface Look {
  /** Roster id, or `${species}-${colourway}` for generic looks. */
  id: string;
  nameJa: string;
  nameEn: string;
  species: Species;
  base: string;
  shade: string;
  light: string;
  /** Inner ear. */
  ear?: string;
  /** Outer ear (default base). */
  earOuter?: string;
  nose?: string;
  eye?: string;
  /** Second eye colour (heterochromia) / iris ring colour. */
  eye2?: string;
  eyeStyle: EyeStyle;
  mouth: MouthVariant | 'wide' | 'tongue';
  hands?: string;
  legs?: string;
  shirt: string;
  /** Secondary outfit colours (plaid lines, flowers, tie...). */
  trim?: string[];
  outfit: Outfit;
  blush?: string;
}

export type RosterId =
  | 'goldie' | 'raymond' | 'bob' | 'bunnie' | 'judy' | 'stitches' | 'hamlet' | 'molly' | 'lily' | 'dom';

type Def = Omit<Look, 'species'> & { species: SpeciesId };

const DEFS: Record<RosterId, Def> = {
  goldie: {
    id: 'goldie', nameJa: 'キャラメル', nameEn: 'Goldie', species: 'dog',
    base: '#F4C04E', shade: '#D99A35', light: '#FFF1CC', nose: '#6B3E26', eye: '#5A3320', eye2: '#C9803A',
    eyeStyle: 'ringed', mouth: 'smile', legs: '#F4C04E',
    shirt: '#F3E6BE', trim: ['#5FA35A', '#E8833A', '#FFFFFF'], outfit: 'plaid'
  },
  raymond: {
    id: 'raymond', nameJa: 'ジャック', nameEn: 'Raymond', species: 'cat',
    base: '#AEB4BE', shade: '#34343C', light: '#D9DDE3', ear: '#F27C8E', earOuter: '#34343C', nose: '#E77F8F', eye: '#A8742E', eye2: '#3E9E5E',
    eyeStyle: 'hetero', mouth: 'cat', hands: '#34343C', legs: '#AEB4BE',
    shirt: '#FFFFFF', trim: ['#8C8E97', '#6A4FB3'], outfit: 'waistcoat'
  },
  bob: {
    id: 'bob', nameJa: 'ニコバン', nameEn: 'Bob', species: 'cat',
    base: '#B67CE6', shade: '#9152CF', light: '#C99AF0', ear: '#F59AB8', eye: '#F6E06A',
    eyeStyle: 'bob', mouth: 'wide', legs: '#B67CE6',
    shirt: '#EC4B4E', trim: ['#FFFFFF', '#F7C548'], outfit: 'aloha'
  },
  bunnie: {
    id: 'bunnie', nameJa: 'リリアン', nameEn: 'Bunnie', species: 'rabbit',
    base: '#F2662E', shade: '#E0521F', light: '#FFF0A6', ear: '#FFCB4A', nose: '#B8452A', eye: '#2A1A14',
    eyeStyle: 'lashes', mouth: 'open', legs: '#F2662E', hands: '#FFE89A', blush: '#FF6FA8',
    shirt: '#9AD650', trim: ['#E8503A', '#F6D24A', '#FFFFFF'], outfit: 'plaid'
  },
  judy: {
    id: 'judy', nameJa: 'みすず', nameEn: 'Judy', species: 'bear',
    base: '#F6B6DC', shade: '#B9C4F6', light: '#FFF4FA', ear: '#FFFFFF', nose: '#5A3A5A', eye: '#2A2468',
    eyeStyle: 'sparkle', mouth: 'smile', legs: '#C9B6F2', hands: '#F6B6DC',
    shirt: '#F2559A', trim: ['#FFFFFF'], outfit: 'frill'
  },
  stitches: {
    id: 'stitches', nameJa: 'パッチ', nameEn: 'Stitches', species: 'bear',
    base: '#F7A33A', shade: '#D441D6', light: '#FFFFFF', ear: '#4FC95A', nose: '#5A3220', eye2: '#4A8FE8', eye: '#6B3A1E',
    eyeStyle: 'x', mouth: 'tongue', legs: '#4FC95A', hands: '#4A8FE8',
    shirt: '#FFFFFF', trim: ['#E8483A', '#4A8FE8', '#4FC95A', '#F7C548'], outfit: 'stars'
  },
  hamlet: {
    id: 'hamlet', nameJa: 'ハムスケ', nameEn: 'Hamlet', species: 'hamster',
    base: '#F6A83C', shade: '#9A6230', light: '#FFF2D6', ear: '#7EC8F0', nose: '#5A3220', eye: '#3A2418', eye2: '#FFF2D6',
    eyeStyle: 'ringed', mouth: 'open', legs: '#F6A83C',
    shirt: '#8D5BD8', trim: ['#F7D23E'], outfit: 'star'
  },
  molly: {
    id: 'molly', nameJa: 'カモミ', nameEn: 'Molly', species: 'duck',
    base: '#F2D27E', shade: '#9A6A3C', light: '#FFF2C4', eye: '#2A1E16', eye2: '#FFFFFF',
    eyeStyle: 'ringed', mouth: 'smile', legs: '#F59A30', hands: '#F2D27E', blush: '#FF8F86',
    shirt: '#C6E79A', trim: ['#8A5A3B'], outfit: 'dress'
  },
  lily: {
    id: 'lily', nameJa: 'レイニー', nameEn: 'Lily', species: 'frog',
    base: '#4FD0BE', shade: '#2FAF9E', light: '#FFFFFF', eye: '#E8743A',
    eyeStyle: 'lily', mouth: 'open', legs: '#4FD0BE', blush: '#FF7E96',
    shirt: '#FFFBEA', trim: ['#F7C548', '#5FB84F'], outfit: 'pineapple'
  },
  dom: {
    id: 'dom', nameJa: 'ちゃちゃまる', nameEn: 'Dom', species: 'sheep',
    base: '#FFF6DC', shade: '#E8DABA', light: '#F7948F', ear: '#F7948F', eye: '#1E1612',
    eyeStyle: 'big', mouth: 'open', legs: '#F7948F', hands: '#F7948F',
    shirt: '#F25A5A', trim: ['#F6D24A', '#5FC46A', '#4A9BE8', '#B47BE0'], outfit: 'tiedye'
  }
};

export const ROSTER_IDS = Object.keys(DEFS) as RosterId[];
export const ROSTER: Record<RosterId, Look> = Object.fromEntries(
  ROSTER_IDS.map((id) => [id, { ...DEFS[id], species: SPECIES[DEFS[id].species] }])
) as Record<RosterId, Look>;

/** Defaults until the users pick: A = Goldie (dog), B = Raymond (cat). */
export const DEFAULT_VILLAGER: Record<'A' | 'B', RosterId> = { A: 'goldie', B: 'raymond' };

export function isRosterId(s: unknown): s is RosterId {
  return typeof s === 'string' && s in DEFS;
}

/** A generic (non-roster) look from the original species colourways. */
export function genericLook(species: SpeciesId, colourway: string | null | undefined, person: 'A' | 'B'): Look {
  const { species: sp, colourway: cw } = resolveVillager(species, colourway, person);
  return {
    id: `${sp.id}-${cw.id}`, nameJa: sp.nameJa, nameEn: sp.nameEn, species: sp,
    base: cw.base, shade: cw.shade, light: cw.light, eye: cw.eye,
    eyeStyle: sp.defaultEyes === 'dot' ? 'dot' : 'oval', mouth: sp.defaultMouth,
    legs: sp.id === 'sheep' ? cw.light : sp.id === 'duck' ? '#F5A341' : cw.shade,
    hands: sp.id === 'sheep' ? cw.light : undefined,
    ear: sp.id === 'hamster' ? '#FFC0C8' : undefined,
    shirt: SHIRT[person], outfit: SHIRT_PATTERN[person]
  };
}

/**
 * Resolve what to draw. `villager` (roster id) wins; then an explicit species/colourway
 * (species may itself be a roster id, so the existing villagerSpecies pref can carry one);
 * then the per-person default villager.
 */
export function resolveLook(opts: {
  villager?: string | null;
  species?: string | null;
  colourway?: string | null;
  person?: 'A' | 'B';
}): Look {
  const person = opts.person ?? 'A';
  if (isRosterId(opts.villager)) return ROSTER[opts.villager];
  if (isRosterId(opts.species)) return ROSTER[opts.species];
  if (isSpecies(opts.species)) return genericLook(opts.species, opts.colourway, person);
  return ROSTER[DEFAULT_VILLAGER[person]];
}
