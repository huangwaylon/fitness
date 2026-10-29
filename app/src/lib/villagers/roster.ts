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
  /** Silhouette tint (the infobox title colour), only seen if an image is missing. */
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
  ['marshal', 'ジュン', 'Marshal', 'squirrel', 'smug', 'm', '#FFFFFF'],
  ['sherb', 'レム', 'Sherb', 'goat', 'lazy', 'm', '#BFF2FF'],
  ['ankha', 'ナイル', 'Ankha', 'cat', 'snooty', 'f', '#FFF80D'],
  ['zucker', 'タコヤ', 'Zucker', 'octopus', 'lazy', 'm', '#E4B887'],
  ['audie', 'モニカ', 'Audie', 'wolf', 'peppy', 'f', '#FF791F'],
  ['lucky', 'ラッキー', 'Lucky', 'dog', 'lazy', 'm', '#FFFFFF'],
  ['fauna', 'ドレミ', 'Fauna', 'deer', 'normal', 'f', '#7A2500'],
  ['ione', 'スピカ', 'Ione', 'squirrel', 'normal', 'f', '#8BCDEA'],
  ['sasha', 'ミッチェル', 'Sasha', 'rabbit', 'lazy', 'm', '#00D1BD'],
  ['shino', 'よしの', 'Shino', 'deer', 'peppy', 'f', '#FFFFFF'],
  ['coco', 'やよい', 'Coco', 'rabbit', 'normal', 'f', '#E4B887'],
  ['beau', 'ペーター', 'Beau', 'deer', 'lazy', 'm', '#FF791F'],
  ['diana', 'ナタリー', 'Diana', 'deer', 'snooty', 'f', '#FFEBFF'],
  ['maple', 'メープル', 'Maple', 'cub', 'normal', 'f', '#A87850'],
  ['kabuki', 'かぶきち', 'Kabuki', 'cat', 'cranky', 'm', '#FFFFFF'],
  ['rosie', 'ブーケ', 'Rosie', 'cat', 'peppy', 'f', '#7FA9FF'],
  ['tangy', 'ヒャクパー', 'Tangy', 'cat', 'peppy', 'f', '#FFD00D'],
  ['merengue', 'パティ', 'Merengue', 'rhino', 'normal', 'f', '#F2BDC7'],
  ['lolly', 'ラムネ', 'Lolly', 'cat', 'normal', 'f', '#BFF2FF'],
  ['punchy', 'ビンタ', 'Punchy', 'cat', 'lazy', 'm', '#FFFFFF'],
  ['kid-cat', '１ごう', 'Kid Cat', 'cat', 'jock', 'm', '#FF4040'],
  ['apollo', 'アポロ', 'Apollo', 'eagle', 'cranky', 'm', '#FFFFFF'],
  ['ketchup', 'ケチャップ', 'Ketchup', 'duck', 'peppy', 'f', '#FF4040'],
  ['chrissy', 'クリスチーヌ', 'Chrissy', 'rabbit', 'peppy', 'f', '#F993CE'],
  ['francine', 'フランソワ', 'Francine', 'rabbit', 'snooty', 'f', '#3FD8E0'],
  ['pietro', 'ジュペッティ', 'Pietro', 'sheep', 'smug', 'm', '#FF4040'],
  ['erik', 'チャック', 'Erik', 'deer', 'lazy', 'm', '#E8B010'],
  ['cherry', 'ハンナ', 'Cherry', 'dog', 'sisterly', 'f', '#FF6183'],
  ['roald', 'ペンタ', 'Roald', 'penguin', 'jock', 'm', '#194C89'],
  ['flurry', 'ゆきみ', 'Flurry', 'hamster', 'normal', 'f', '#FFFFFF'],
  ['bones', 'トミ', 'Bones', 'dog', 'lazy', 'm', '#FFFFFF'],
  ['bitty', 'エーミー', 'Bitty', 'hippo', 'snooty', 'f', '#F993CE'],
  ['wolfgang', 'ロボ', 'Wolfgang', 'wolf', 'cranky', 'm', '#194C89'],
  ['whitney', 'ビアンカ', 'Whitney', 'wolf', 'snooty', 'f', '#BFF2FF'],
  ['tia', 'ティーナ', 'Tia', 'elephant', 'normal', 'f', '#FFFFFF'],
  ['lopez', 'トムソン', 'Lopez', 'deer', 'smug', 'm', '#E8B010'],
  ['dobie', 'けん', 'Dobie', 'wolf', 'cranky', 'm', '#798040'],
  ['mira', 'ミラコ', 'Mira', 'rabbit', 'sisterly', 'f', '#FFF80D'],
  ['static', 'スパーク', 'Static', 'squirrel', 'cranky', 'm', '#A06FCE'],
  ['agent-s', '２ごう', 'Agent S', 'squirrel', 'peppy', 'f', '#0961F6'],
  ['pekoe', 'ジャスミン', 'Pekoe', 'cub', 'normal', 'f', '#FFFFFF'],
  ['tammy', 'アネッサ', 'Tammy', 'cub', 'sisterly', 'f', '#FFF80D'],
  ['bea', 'ベーグル', 'Bea', 'dog', 'normal', 'f', '#A87850'],
  ['cookie', 'ペリーヌ', 'Cookie', 'dog', 'peppy', 'f', '#F993CE'],
  ['teddy', 'たいへいた', 'Teddy', 'bear', 'jock', 'm', '#FF791F'],
  ['tad', 'タンボ', 'Tad', 'frog', 'jock', 'm', '#76B788'],
  ['octavian', 'おくたろう', 'Octavian', 'octopus', 'cranky', 'm', '#FF4040'],
  ['marina', 'タコリーナ', 'Marina', 'octopus', 'normal', 'f', '#F993CE'],
  ['drago', 'タツオ', 'Drago', 'alligator', 'lazy', 'm', '#78DD62'],
  ['gayle', 'アリゲッティ', 'Gayle', 'alligator', 'normal', 'f', '#F993CE'],
  ['cyrano', 'さくらじま', 'Cyrano', 'anteater', 'cranky', 'm', '#194C89'],
  ['beardo', 'ベアード', 'Beardo', 'bear', 'smug', 'm', '#3FD8E0'],
  ['twiggy', 'ピーチク', 'Twiggy', 'bird', 'peppy', 'f', '#FFF80D'],
  ['admiral', 'イッテツ', 'Admiral', 'bird', 'cranky', 'm', '#0CA54A'],
  ['angus', 'セルバンテス', 'Angus', 'bull', 'cranky', 'm', '#FF791F'],
  ['ken', 'クロベエ', 'Ken', 'chicken', 'smug', 'm', '#6B75CE'],
  ['naomi', 'ハナコ', 'Naomi', 'cow', 'snooty', 'f', '#3FD8E0'],
  ['rocket', '４ごう', 'Rocket', 'gorilla', 'sisterly', 'f', '#F993CE'],
  ['julian', 'ジュリー', 'Julian', 'horse', 'smug', 'm', '#3FD8E0'],
  ['kitt', 'アップリケ', 'Kitt', 'kangaroo', 'normal', 'f', '#C0AB72'],
  ['melba', 'アデレード', 'Melba', 'koala', 'normal', 'f', '#E4B887'],
  ['bud', 'グラさん', 'Bud', 'lion', 'jock', 'm', '#D86808'],
  ['nana', 'チッチ', 'Nana', 'monkey', 'normal', 'f', '#EC7EFC'],
  ['chadder', 'チーズ', 'Chadder', 'mouse', 'smug', 'm', '#FFD00D'],
  ['julia', 'ジュリア', 'Julia', 'ostrich', 'snooty', 'f', '#0CA54A'],
  ['aurora', 'オーロラ', 'Aurora', 'penguin', 'normal', 'f', '#FFFFFF'],
  ['agnes', 'アグネス', 'Agnes', 'pig', 'sisterly', 'f', '#515151'],
  ['bangle', 'ルーズ', 'Bangle', 'tiger', 'peppy', 'f', '#7A2500']
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
