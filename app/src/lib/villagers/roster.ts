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
  ['dom', 'ちゃちゃまる', 'Dom', 'sheep', 'jock', 'm', '#FFF6DC'],
  ['marshal', 'ジュン', 'Marshal', 'squirrel', 'smug', 'm', '#000000'],
  ['sherb', 'レム', 'Sherb', 'goat', 'lazy', 'm', '#000000'],
  ['ankha', 'ナイル', 'Ankha', 'cat', 'snooty', 'f', '#000000'],
  ['zucker', 'タコヤ', 'Zucker', 'octopus', 'lazy', 'm', '#000000'],
  ['audie', 'モニカ', 'Audie', 'wolf', 'peppy', 'f', '#000000'],
  ['lucky', 'ラッキー', 'Lucky', 'dog', 'lazy', 'm', '#000000'],
  ['fauna', 'ドレミ', 'Fauna', 'deer', 'normal', 'f', '#000000'],
  ['ione', 'スピカ', 'Ione', 'squirrel', 'normal', 'f', '#000000'],
  ['sasha', 'ミッチェル', 'Sasha', 'rabbit', 'lazy', 'm', '#000000'],
  ['shino', 'よしの', 'Shino', 'deer', 'peppy', 'f', '#000000'],
  ['coco', 'やよい', 'Coco', 'rabbit', 'normal', 'f', '#000000'],
  ['beau', 'ペーター', 'Beau', 'deer', 'lazy', 'm', '#000000'],
  ['diana', 'ナタリー', 'Diana', 'deer', 'snooty', 'f', '#000000'],
  ['maple', 'メープル', 'Maple', 'cub', 'normal', 'f', '#000000'],
  ['kabuki', 'かぶきち', 'Kabuki', 'cat', 'cranky', 'm', '#000000'],
  ['rosie', 'ブーケ', 'Rosie', 'cat', 'peppy', 'f', '#000000'],
  ['tangy', 'ヒャクパー', 'Tangy', 'cat', 'peppy', 'f', '#000000'],
  ['merengue', 'パティ', 'Merengue', 'rhino', 'normal', 'f', '#000000'],
  ['lolly', 'ラムネ', 'Lolly', 'cat', 'normal', 'f', '#000000'],
  ['punchy', 'ビンタ', 'Punchy', 'cat', 'lazy', 'm', '#000000'],
  ['kid-cat', '１ごう', 'Kid Cat', 'cat', 'jock', 'm', '#000000'],
  ['apollo', 'アポロ', 'Apollo', 'eagle', 'cranky', 'm', '#000000'],
  ['ketchup', 'ケチャップ', 'Ketchup', 'duck', 'peppy', 'f', '#000000'],
  ['chrissy', 'クリスチーヌ', 'Chrissy', 'rabbit', 'peppy', 'f', '#000000'],
  ['francine', 'フランソワ', 'Francine', 'rabbit', 'snooty', 'f', '#000000'],
  ['pietro', 'ジュペッティ', 'Pietro', 'sheep', 'smug', 'm', '#000000'],
  ['erik', 'チャック', 'Erik', 'deer', 'lazy', 'm', '#000000'],
  ['cherry', 'ハンナ', 'Cherry', 'dog', 'sisterly', 'f', '#000000'],
  ['roald', 'ペンタ', 'Roald', 'penguin', 'jock', 'm', '#000000'],
  ['flurry', 'ゆきみ', 'Flurry', 'hamster', 'normal', 'f', '#000000'],
  ['bones', 'トミ', 'Bones', 'dog', 'lazy', 'm', '#000000'],
  ['bitty', 'エーミー', 'Bitty', 'hippo', 'snooty', 'f', '#000000'],
  ['wolfgang', 'ロボ', 'Wolfgang', 'wolf', 'cranky', 'm', '#000000'],
  ['whitney', 'ビアンカ', 'Whitney', 'wolf', 'snooty', 'f', '#000000'],
  ['tia', 'ティーナ', 'Tia', 'elephant', 'normal', 'f', '#000000'],
  ['lopez', 'トムソン', 'Lopez', 'deer', 'smug', 'm', '#000000'],
  ['dobie', 'けん', 'Dobie', 'wolf', 'cranky', 'm', '#000000'],
  ['mira', 'ミラコ', 'Mira', 'rabbit', 'sisterly', 'f', '#000000'],
  ['static', 'スパーク', 'Static', 'squirrel', 'cranky', 'm', '#000000'],
  ['agent-s', '２ごう', 'Agent S', 'squirrel', 'peppy', 'f', '#000000'],
  ['pekoe', 'ジャスミン', 'Pekoe', 'cub', 'normal', 'f', '#000000'],
  ['tammy', 'アネッサ', 'Tammy', 'cub', 'sisterly', 'f', '#000000'],
  ['bea', 'ベーグル', 'Bea', 'dog', 'normal', 'f', '#000000'],
  ['cookie', 'ペリーヌ', 'Cookie', 'dog', 'peppy', 'f', '#000000'],
  ['teddy', 'たいへいた', 'Teddy', 'bear', 'jock', 'm', '#000000'],
  ['tad', 'タンボ', 'Tad', 'frog', 'jock', 'm', '#000000'],
  ['octavian', 'おくたろう', 'Octavian', 'octopus', 'cranky', 'm', '#000000'],
  ['marina', 'タコリーナ', 'Marina', 'octopus', 'normal', 'f', '#000000'],
  ['drago', 'タツオ', 'Drago', 'alligator', 'lazy', 'm', '#000000'],
  ['gayle', 'アリゲッティ', 'Gayle', 'alligator', 'normal', 'f', '#000000'],
  ['cyrano', 'さくらじま', 'Cyrano', 'anteater', 'cranky', 'm', '#000000'],
  ['beardo', 'ベアード', 'Beardo', 'bear', 'smug', 'm', '#000000'],
  ['twiggy', 'ピーチク', 'Twiggy', 'bird', 'peppy', 'f', '#000000'],
  ['admiral', 'イッテツ', 'Admiral', 'bird', 'cranky', 'm', '#000000'],
  ['angus', 'セルバンテス', 'Angus', 'bull', 'cranky', 'm', '#000000'],
  ['ken', 'クロベエ', 'Ken', 'chicken', 'smug', 'm', '#000000'],
  ['naomi', 'ハナコ', 'Naomi', 'cow', 'snooty', 'f', '#000000'],
  ['rocket', '４ごう', 'Rocket', 'gorilla', 'sisterly', 'f', '#000000'],
  ['julian', 'ジュリー', 'Julian', 'horse', 'smug', 'm', '#000000'],
  ['kitt', 'アップリケ', 'Kitt', 'kangaroo', 'normal', 'f', '#000000'],
  ['melba', 'アデレード', 'Melba', 'koala', 'normal', 'f', '#000000'],
  ['bud', 'グラさん', 'Bud', 'lion', 'jock', 'm', '#000000'],
  ['nana', 'チッチ', 'Nana', 'monkey', 'normal', 'f', '#000000'],
  ['chadder', 'チーズ', 'Chadder', 'mouse', 'smug', 'm', '#000000'],
  ['julia', 'ジュリア', 'Julia', 'ostrich', 'snooty', 'f', '#000000'],
  ['aurora', 'オーロラ', 'Aurora', 'penguin', 'normal', 'f', '#000000'],
  ['agnes', 'アグネス', 'Agnes', 'pig', 'sisterly', 'f', '#000000'],
  ['bangle', 'ルーズ', 'Bangle', 'tiger', 'peppy', 'f', '#000000']
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
