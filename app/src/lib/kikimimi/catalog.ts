// ききみみ's modes as the hub shows them (docs/kikimimi-ux.md §6.2, §6.4, §10; docs/curriculum-wave2.md §2): each
// mode's shelf (grouped by situation), icon, length, question count, whether it can be shared and whether its page offers
// the ばしょ; which are playable on this build (only those show: never a 「もうすぐ」 wall, an empty group hidden; a lane's
// game once this build has its lane and the index its content; a mode with a `gate` only while it opens on this phone:
// the mic's, docs/kikimimi-mic.md §2.6); and the ばしょ ladder over the contract's levels (§4:
// はまべ 1 / 2, かわ, もり, やま, ほし; level 5 is the アナウンス mode, not a place). Pure.
import { levelAt } from './bank.ts';

/** The modes. The quiz family (ひとこと クイズ, アナウンス, スピード はしご) is one lobby's game; おさらい a solo practice deck;
 *  おやすみ ものがたり the bedtime serials (no lobby, no score: components/kikimimi/story/); しずえの しゅうまつ たいかい the
 *  weekend's quiz show (games/taikai/: the hub's banner, its own lobby, on no shelf). Wave 2's are each a game of its
 *  own lane (round/registry.ts): ことば タイル, すうじ ラッシュ, ようじ でんわ, たちぎき, しずえの ニュース; a later game's mode
 *  may come with its registry line (addMode: the mic's). */
export type ModeId = 'quiz' | 'ladder' | 'review' | 'announce' | 'story' | 'taikai' | 'tile' | 'rush' | 'call' | 'tachi' | 'news' | (string & {});
/** The あそぶ page's shelves, in order: さくっと, まちで・でんわで, じっくり, ねる まえに, 声に 出す (the mic's modes). */
export type Group = 'quick' | 'scene' | 'long' | 'night' | 'koe';
const GROUPS: readonly Group[] = ['quick', 'scene', 'long', 'night', 'koe'];

/** What this build and this player have: the levels offered (deck.ts LEVELS), スピード はしご's clips, any game to
 *  review, a voiced bedtime serial, the tournament's weekend now (window.ts taikaiOpen), and which lanes' games can be
 *  played (round/registry.ts LANES.ready: the lane and its content). */
export interface Ctx {
  levels: readonly number[];
  ladder: boolean;
  review: boolean;
  story?: boolean;
  taikai?: boolean;
  games?: (gm: string) => boolean;
}

export interface ModeMeta {
  id: ModeId;
  /** Its shelf; 'event': none (the hub's banner while it's on: the tournament's weekend); 'together': none, only the
   *  みんなで picker (it needs two: ロールプレイ). */
  group: Group | 'event' | 'together';
  /** Its tile's and page's icon. */
  icon: string;
  /** About how long a game takes (minutes) and its questions (clips). */
  mins: number;
  qs: number;
  /** It can be played together (さそう, the みんなで page's picker). */
  coop: boolean;
  /** A lane's game (its id on the wire): playable once Ctx.games says so. */
  game?: string;
  /** Its page offers the ばしょ (ひとこと クイズ: the levels this build offers; a lane's game: its content's places). */
  places?: boolean;
  /** The Tokyo hours [from, to) きまぐれ picks it in (しずえの ニュース: the morning bulletin, 05:00-11:00, the hub's
   *  おはよう); none: any time. */
  hours?: readonly [number, number];
  /** Its game's own answer window (s), whatever the lobby's こたえる じかん but なし: its pages offer just that and なし. */
  window?: number;
  /** Playable by this build and this player (not a lane's game). */
  ok?(c: Ctx): boolean;
  /** Shown only while this is true on this phone (a mic mode's: the mic on and its recogniser ready), beside the rest. */
  gate?(): boolean;
  /** What a player needs to play it (the みんなで picker says 「マイクが オフです」 for one without it). */
  requires?: 'mic';
}

const quizLevels = (c: Ctx): boolean => c.levels.some((lv) => lv !== 5);
const MODES: ModeMeta[] = [
  { id: 'quiz', group: 'quick', icon: '💬', mins: 4, qs: 8, coop: true, places: true, ok: quizLevels },
  { id: 'ladder', group: 'quick', icon: '🪜', mins: 3, qs: 8, coop: true, ok: (c) => c.ladder },
  { id: 'review', group: 'quick', icon: '🔁', mins: 3, qs: 8, coop: false, ok: (c) => c.review },
  { id: 'tile', group: 'quick', icon: '🧩', mins: 3, qs: 6, coop: true, game: 'tile', places: true },
  { id: 'rush', group: 'quick', icon: '☕', mins: 2, qs: 8, coop: true, game: 'rush', places: true, window: 8 },
  { id: 'announce', group: 'scene', icon: '📢', mins: 4, qs: 8, coop: true, ok: (c) => c.levels.includes(5) },
  { id: 'call', group: 'scene', icon: '📞', mins: 3, qs: 6, coop: true, game: 'call', places: true },
  { id: 'tachi', group: 'scene', icon: '👂', mins: 3, qs: 6, coop: true, game: 'tachi', places: true },
  { id: 'news', group: 'long', icon: '📻', mins: 2, qs: 3, coop: true, game: 'news', hours: [5, 11] },
  { id: 'story', group: 'night', icon: '🌙', mins: 4, qs: 0, coop: false, ok: (c) => !!c.story },
  { id: 'taikai', group: 'event', icon: '🏆', mins: 6, qs: 8, coop: true, ok: (c) => !!c.taikai && quizLevels(c) }
];
export const modeOf = (id: ModeId): ModeMeta => MODES.find((m) => m.id === id)!;
/** A later game's mode, from its registry line (round/registry.ts Later.mode), after the catalog's own. */
export function addMode(m: ModeMeta): void {
  if (MODES.some((x) => x.id === m.id)) throw new Error(`kikimimi: mode ${m.id} twice`);
  MODES.push(m);
}
/** The mode a lane's game is (the hub's invite line names it). */
export const modeOfGame = (gm: string): ModeMeta | undefined => MODES.find((m) => m.game === gm);

/** A mode can be played now. */
export function playable(id: ModeId, c: Ctx): boolean {
  const m = modeOf(id);
  return (m.game ? !!c.games?.(m.game) : !!m.ok?.(c)) && (m.gate?.() ?? true);
}

/** The modes きまぐれ picks from (today.ts): the playable ones on a day's shelf (not おさらい, the stories, the
 *  tournament, nor a mic mode: never a surprise to speak). */
export const whims = (c: Ctx): ModeId[] =>
  MODES.filter((m) => m.id !== 'review' && !m.requires && (m.group === 'quick' || m.group === 'scene' || m.group === 'long') && playable(m.id, c)).map((m) => m.id);

/** The あそぶ page's shelves: each group with its playable modes, empty groups left out. */
export function shelves(c: Ctx): { group: Group; modes: ModeMeta[] }[] {
  return GROUPS.map((group) => ({ group, modes: MODES.filter((m) => m.group === group && playable(m.id, c)) })).filter((s) => s.modes.length);
}

/** The playable modes that can be shared (the みんなで page's picker; the tournament has its own lobby). */
export const sharable = (c: Ctx): ModeMeta[] => MODES.filter((m) => m.coop && m.group !== 'event' && playable(m.id, c));

/** The ばしょ places (§4) in order, each with its ★s and the quiz levels it holds (はまべ two sub-steps). */
export type Place = 'hama' | 'kawa' | 'mori' | 'yama' | 'hoshi';
export const PLACES: readonly { id: Place; stars: number; lvs: readonly number[] }[] = [
  { id: 'hama', stars: 1, lvs: [1, 2] },
  { id: 'kawa', stars: 2, lvs: [3] },
  { id: 'mori', stars: 3, lvs: [4] },
  { id: 'yama', stars: 4, lvs: [6] },
  { id: 'hoshi', stars: 5, lvs: [7] }
];

/** A quiz level's place (null: level 5, the アナウンス mode's). */
export const placeOfLv = (lv: number): Place | null => PLACES.find((p) => p.lvs.includes(lv))?.id ?? null;

/** The level a place plays on this build: the first it offers (はまべ: `lv` when it's one of its two), null when the
 *  place has none yet (shown sunk). */
export function lvOfPlace(place: Place, levels: readonly number[], lv?: number): number | null {
  const lvs = PLACES.find((p) => p.id === place)!.lvs.filter((x) => levels.includes(x));
  return lv !== undefined && lvs.includes(lv) ? lv : (lvs[0] ?? null);
}

/** The places a lane's game has content at, as their first quiz levels (StageRow's), easiest first: its `listened`
 *  files in the index's `listen` (game, stage 1-5 = はまべ … ほし, status: compile.ts). */
export function contentLevels(gm: string, listen: Readonly<Record<string, readonly [game: string, stage: number, status: string]>>): number[] {
  const at = new Set(Object.values(listen).flatMap(([g, stage, status]) => (g === gm && status === 'listened' ? [stage - 1] : [])));
  return PLACES.flatMap((p, k) => (at.has(k) ? [p.lvs[0]] : []));
}

/** The level a mode opens at: アナウンス 5; the quiz the one remembered unless that's アナウンス's (then はまべ 1). */
export const lvForMode = (id: ModeId, last: number): number => (id === 'announce' ? 5 : last === 5 ? 1 : last);

/** おまかせ's level (§4, kikimimi-ux.md §6.12): みみ チェック's placed one; before a check, my comfortable level
 *  (progress.ts, levelRank's scale); before any data はまべ 2. One this build offers (not アナウンス's). */
export function omakaseLv(placed: number | null, level: number | null, levels: readonly number[]): number {
  const quiz = levels.filter((x) => x !== 5);
  const want = placed ?? (level === null ? 2 : levelAt(Math.min(6, Math.max(1, Math.round(level)))));
  return quiz.includes(want) ? want : (quiz.filter((x) => x <= want).at(-1) ?? quiz[0] ?? 1);
}
