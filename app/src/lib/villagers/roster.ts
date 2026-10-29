// Villager roster: the villagers we ship official NH art for (static/art/villagers/<id>.webp + <id>-icon.webp,
// fetched by scripts/fetch-assets.ts from this list). Names follow the Japanese game; species, personality and
// gender come from each villager's Nookipedia infobox. `colour` (the infobox title colour) only tints the generic
// silhouette (Silhouette.svelte) that shows if an image is missing.
// Selection: prefs `villager` (roster id) → per-person default. Unknown ids fall back to the default.
import { SPECIES, type Personality, type Species } from './species.ts';

export interface Look {
  id: RosterId;
  nameJa: string;
  nameEn: string;
  species: Species;
  personality: Personality;
  gender: 'm' | 'f';
  /** Main fur colour (fallback silhouette). */
  colour: string;
}

type Row = readonly [id: string, nameJa: string, nameEn: string, species: Species, personality: Personality, gender: 'm' | 'f', colour: string];

const ROWS = [
  ['anchovy', 'アンチョビ', 'Anchovy', 'bird', 'lazy', 'm', '#D86808'],
  ['bob', 'ニコバン', 'Bob', 'cat', 'lazy', 'm', '#B67CE6'],
  ['raymond', 'ジャック', 'Raymond', 'cat', 'smug', 'm', '#AEB4BE'],
  ['judy', 'みすず', 'Judy', 'cub', 'snooty', 'f', '#F6B6DC'],
  ['stitches', 'パッチ', 'Stitches', 'cub', 'lazy', 'm', '#F7A33A'],
  ['goldie', 'キャラメル', 'Goldie', 'dog', 'normal', 'f', '#F4C04E'],
  ['molly', 'カモミ', 'Molly', 'duck', 'normal', 'f', '#F2D27E'],
  ['lily', 'レイニー', 'Lily', 'frog', 'normal', 'f', '#4FD0BE'],
  ['hamlet', 'ハムスケ', 'Hamlet', 'hamster', 'jock', 'm', '#F6A83C'],
  ['bunnie', 'リリアン', 'Bunnie', 'rabbit', 'peppy', 'f', '#F2662E'],
  ['dom', 'ちゃちゃまる', 'Dom', 'sheep', 'jock', 'm', '#FFF6DC']
] as const satisfies readonly Row[];

export type RosterId = (typeof ROWS)[number][0];

export const ROSTER = Object.fromEntries(
  ROWS.map(([id, nameJa, nameEn, species, personality, gender, colour]) => [id, { id, nameJa, nameEn, species, personality, gender, colour }])
) as Record<RosterId, Look>;

const SPECIES_ORDER = Object.keys(SPECIES);
/** Every id, by species (SPECIES order) then English name: the picker grid's order. */
export const ROSTER_IDS: RosterId[] = ROWS.map((r) => r[0]).sort(
  (a, b) =>
    SPECIES_ORDER.indexOf(ROSTER[a].species) - SPECIES_ORDER.indexOf(ROSTER[b].species) || ROSTER[a].nameEn.localeCompare(ROSTER[b].nameEn)
);

/** Defaults until the users pick: A = Goldie (dog), B = Raymond (cat). */
const DEFAULT_VILLAGER: Record<'A' | 'B', RosterId> = { A: 'goldie', B: 'raymond' };

export function isRosterId(s: unknown): s is RosterId {
  return typeof s === 'string' && Object.hasOwn(ROSTER, s);
}

/** Resolve who to draw: a roster `villager` id wins; anything else → the per-person default. */
export function resolveLook(opts: { villager?: string | null; person?: 'A' | 'B' }): Look {
  if (isRosterId(opts.villager)) return ROSTER[opts.villager];
  return ROSTER[DEFAULT_VILLAGER[opts.person ?? 'A']];
}
