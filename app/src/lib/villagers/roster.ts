// Villager roster: the villagers we ship official NH art for (static/art/villagers/<id>.webp + <id>-icon.webp,
// fetched by scripts/fetch-assets.ts from this list). Names follow the Japanese game; species, personality and
// gender come from each villager's Nookipedia infobox. `colour` (the infobox title colour) only tints the generic
// silhouette (Silhouette.svelte) that shows if an image is missing.
// Selection: prefs `villager` (roster id) → per-person default. Unknown ids fall back to the default.
import { SPECIES, type Personality, type Species } from './species.ts';

interface Look {
  id: RosterId;
  nameJa: string;
  nameEn: string;
  species: Species;
  personality: Personality;
  gender: 'm' | 'f';
  /** Silhouette tint (the infobox title colour), only seen if an image is missing. */
  colour: string;
  /** The render looks toward the viewer's right as drawn (most NH renders are near-frontal and count as left). */
  looksRight: boolean;
  /** Never mirror: text/numbers on the outfit or a one-sided design (Raymond's odd eyes). Leans in instead. */
  noMirror: boolean;
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
  ['bangle', 'ルーズ', 'Bangle', 'tiger', 'peppy', 'f', '#7A2500'],
  // 79 more, spread over every species and personality.
  ['roswell', 'ピロンコン', 'Roswell', 'alligator', 'smug', 'm', '#4C3317'],
  ['alfonso', 'アルベルト', 'Alfonso', 'alligator', 'lazy', 'm', '#E8B010'],
  ['zoe', 'ビーフン', 'Zoe', 'anteater', 'normal', 'f', '#00D1BD'],
  ['antonio', 'マコト', 'Antonio', 'anteater', 'jock', 'm', '#FFF98F'],
  ['charlise', 'チャーミー', 'Charlise', 'bear', 'sisterly', 'f', '#78DD62'],
  ['curt', 'ガンテツ', 'Curt', 'bear', 'cranky', 'm', '#515151'],
  ['bluebear', 'グルミン', 'Bluebear', 'cub', 'peppy', 'f', '#3FD8E0'],
  ['poncho', 'ポンチョ', 'Poncho', 'cub', 'jock', 'm', '#194C89'],
  ['cheri', 'アセロラ', 'Cheri', 'cub', 'peppy', 'f', '#DB6161'],
  ['ace', 'フェザー', 'Ace', 'bird', 'jock', 'm', '#0961F6'],
  ['jacques', 'ジョッキー', 'Jacques', 'bird', 'smug', 'm', '#194C89'],
  ['coach', 'テッチャン', 'Coach', 'bull', 'jock', 'm', '#FFD00D'],
  ['stu', 'モーリス', 'Stu', 'bull', 'lazy', 'm', '#6B75CE'],
  ['kiki', 'キャビア', 'Kiki', 'cat', 'normal', 'f', '#515151'],
  ['olivia', 'オリビア', 'Olivia', 'cat', 'snooty', 'f', '#FFFFFF'],
  ['katt', 'ちょい', 'Katt', 'cat', 'sisterly', 'f', '#A87850'],
  ['goose', 'ケンタ', 'Goose', 'chicken', 'jock', 'm', '#FFFFFF'],
  ['plucky', 'パタヤ', 'Plucky', 'chicken', 'sisterly', 'f', '#7C6559'],
  ['patty', 'カルピ', 'Patty', 'cow', 'peppy', 'f', '#7A2500'],
  ['norma', 'いさこ', 'Norma', 'cow', 'normal', 'f', '#F2BDC7'],
  ['bam', 'タケル', 'Bam', 'deer', 'jock', 'm', '#0961F6'],
  ['deirdre', 'ナディア', 'Deirdre', 'deer', 'sisterly', 'f', '#DDCDCA'],
  ['frett', 'シャンペン', 'Frett', 'dog', 'cranky', 'm', '#FFF80D'],
  ['daisy', 'バニラ', 'Daisy', 'dog', 'normal', 'f', '#FFF98F'],
  ['portia', 'ブレンダ', 'Portia', 'dog', 'snooty', 'f', '#FFFFFF'],
  ['derwin', 'ボン', 'Derwin', 'duck', 'lazy', 'm', '#0961F6'],
  ['pompom', 'のりっぺ', 'Pompom', 'duck', 'peppy', 'f', '#FFFFFF'],
  ['quinn', 'シオン', 'Quinn', 'eagle', 'sisterly', 'f', '#D9D9FF'],
  ['keaton', 'フランク', 'Keaton', 'eagle', 'smug', 'm', '#3FD8E0'],
  ['chai', 'フィーカ', 'Chai', 'elephant', 'peppy', 'f', '#CEFDFF'],
  ['axel', 'エックスエル', 'Axel', 'elephant', 'jock', 'm', '#459ABA'],
  ['raddle', 'カックン', 'Raddle', 'frog', 'lazy', 'm', '#515151'],
  ['puddles', 'チョキ', 'Puddles', 'frog', 'peppy', 'f', '#FF6183'],
  ['chevre', 'ユキ', 'Chevre', 'goat', 'normal', 'f', '#FFFFFF'],
  ['pashmina', 'バーバラ', 'Pashmina', 'goat', 'sisterly', 'f', '#E2856B'],
  ['al', 'たもつ', 'Al', 'gorilla', 'lazy', 'm', '#798040'],
  ['hans', 'スナイル', 'Hans', 'gorilla', 'smug', 'm', '#FFFFFF'],
  ['marlo', 'ドンチャン', 'Marlo', 'hamster', 'cranky', 'm', '#515151'],
  ['apple', 'アップル', 'Apple', 'hamster', 'peppy', 'f', '#FF6183'],
  ['hippeux', 'ディビッド', 'Hippeux', 'hippo', 'smug', 'm', '#D8CC39'],
  ['bubbles', 'チャコ', 'Bubbles', 'hippo', 'peppy', 'f', '#E8B010'],
  ['reneigh', 'リアーナ', 'Reneigh', 'horse', 'sisterly', 'f', '#76494E'],
  ['roscoe', 'シュバルツ', 'Roscoe', 'horse', 'cranky', 'm', '#515151'],
  ['marcie', 'マリア', 'Marcie', 'kangaroo', 'normal', 'f', '#F993CE'],
  ['sylvia', 'シルビア', 'Sylvia', 'kangaroo', 'sisterly', 'f', '#A06FCE'],
  ['faith', 'マーチ', 'Faith', 'koala', 'sisterly', 'f', '#FF791F'],
  ['lyman', 'オズモンド', 'Lyman', 'koala', 'jock', 'm', '#A8E989'],
  ['lionel', 'ライオネル', 'Lionel', 'lion', 'smug', 'm', '#E4B887'],
  ['rory', 'アーサー', 'Rory', 'lion', 'jock', 'm', '#FF791F'],
  ['shari', 'シェリー', 'Shari', 'monkey', 'sisterly', 'f', '#BFBFBF'],
  ['deli', 'デリー', 'Deli', 'monkey', 'lazy', 'm', '#C0AB72'],
  ['petri', 'リカ', 'Petri', 'mouse', 'snooty', 'f', '#FFEBFF'],
  ['bettina', 'マルコ', 'Bettina', 'mouse', 'normal', 'f', '#FF791F'],
  ['cephalobot', 'ギーガー', 'Cephalobot', 'octopus', 'smug', 'm', '#BFBFBF'],
  ['rio', 'デジャネイロ', 'Rio', 'ostrich', 'peppy', 'f', '#FF4040'],
  ['flora', 'フララ', 'Flora', 'ostrich', 'peppy', 'f', '#FF6183'],
  ['chabwick', 'のぶお', 'Chabwick', 'penguin', 'lazy', 'm', '#194C89'],
  ['sprinkle', 'フラッペ', 'Sprinkle', 'penguin', 'peppy', 'f', '#00D1BD'],
  ['gala', 'ためこ', 'Gala', 'pig', 'normal', 'f', '#FEEAE7'],
  ['chops', 'トンファン', 'Chops', 'pig', 'smug', 'm', '#D8CC39'],
  ['peggy', 'ちえり', 'Peggy', 'pig', 'peppy', 'f', '#E4B887'],
  ['ruby', 'ルナ', 'Ruby', 'rabbit', 'peppy', 'f', '#FFFFFF'],
  ['genji', 'ゲンジ', 'Genji', 'rabbit', 'jock', 'm', '#FFFFFF'],
  ['bonbon', 'ミミィ', 'Bonbon', 'rabbit', 'peppy', 'f', '#7C6559'],
  ['azalea', 'ペチュニア', 'Azalea', 'rhino', 'snooty', 'f', '#00D1BD'],
  ['hornsby', 'みつお', 'Hornsby', 'rhino', 'lazy', 'm', '#0961F6'],
  ['tank', 'くるぶし', 'Tank', 'rhino', 'jock', 'm', '#8BCDEA'],
  ['muffy', 'フリル', 'Muffy', 'sheep', 'sisterly', 'f', '#515151'],
  ['wendy', 'みぞれ', 'Wendy', 'sheep', 'peppy', 'f', '#55CFFF'],
  ['stella', 'アクリル', 'Stella', 'sheep', 'normal', 'f', '#951D43'],
  ['poppy', 'グミ', 'Poppy', 'squirrel', 'normal', 'f', '#DB6161'],
  ['hazel', 'アイリス', 'Hazel', 'squirrel', 'sisterly', 'f', '#FFAA3B'],
  ['filbert', 'リッキー', 'Filbert', 'squirrel', 'lazy', 'm', '#55CFFF'],
  ['bianca', 'コユキ', 'Bianca', 'tiger', 'peppy', 'f', '#FFFFFF'],
  ['rolf', 'チョモラン', 'Rolf', 'tiger', 'cranky', 'm', '#FFFFFF'],
  ['claudia', 'マリリン', 'Claudia', 'tiger', 'snooty', 'f', '#EC7EFC'],
  ['chief', 'チーフ', 'Chief', 'wolf', 'cranky', 'm', '#FFAA3B'],
  ['freya', 'ツンドラ', 'Freya', 'wolf', 'snooty', 'f', '#FF6183'],
  ['skye', 'リリィ', 'Skye', 'wolf', 'normal', 'f', '#3FD8E0']
] as const satisfies readonly Row[];

export type RosterId = (typeof ROWS)[number][0];

// Checked by eye against the renders (a contact sheet of static/art/villagers); update when adding villagers.
const LOOKS_RIGHT: ReadonlySet<RosterId> = new Set<RosterId>(['goldie', 'bunnie', 'judy', 'molly', 'dom']);
const NO_MIRROR: ReadonlySet<RosterId> = new Set<RosterId>([
  'raymond', 'sasha', 'stitches', 'lucky', 'agent-s', 'kid-cat', 'rocket', 'tad', 'octavian',
  'coach', 'tank', 'chabwick', 'curt', 'axel', 'marcie'
]);

export const ROSTER = Object.fromEntries(
  ROWS.map(([id, nameJa, nameEn, species, personality, gender, colour]) => [
    id,
    { id, nameJa, nameEn, species, personality, gender, colour, looksRight: LOOKS_RIGHT.has(id), noMirror: NO_MIRROR.has(id) }
  ])
) as Record<RosterId, Look>;

const SPECIES_ORDER = Object.keys(SPECIES);
/** Every id, by species (SPECIES order) then English name: the picker grid's order. */
export const ROSTER_IDS: RosterId[] = ROWS.map((r) => r[0]).sort(
  (a, b) =>
    SPECIES_ORDER.indexOf(ROSTER[a].species) - SPECIES_ORDER.indexOf(ROSTER[b].species) || ROSTER[a].nameEn.localeCompare(ROSTER[b].nameEn)
);

/** Defaults until the users pick: A = Goldie (dog), B = Anchovy (bird). */
const DEFAULT_VILLAGER: Record<'A' | 'B', RosterId> = { A: 'goldie', B: 'anchovy' };

export function isRosterId(s: unknown): s is RosterId {
  return typeof s === 'string' && Object.hasOwn(ROSTER, s);
}

/** Resolve who to draw: a roster `villager` id wins; anything else → the per-person default. */
export function resolveLook(opts: { villager?: string | null; person?: 'A' | 'B' }): Look {
  if (isRosterId(opts.villager)) return ROSTER[opts.villager];
  return ROSTER[DEFAULT_VILLAGER[opts.person ?? 'A']];
}
