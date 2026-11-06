// ききみみ's modes as the hub shows them (docs/kikimimi-ux.md §6.2, §6.4, §10): each mode's shelf (grouped by
// situation), length, question count and whether it can be shared; which are playable on this build (only those show:
// never a 「もうすぐ」 wall, an empty group hidden); and the ばしょ ladder over the contract's levels (§4: はまべ 1 / 2,
// かわ, もり, やま, ほし; level 5 is the アナウンス mode, not a place). Pure.

/** The modes built so far. The quiz family (ひとこと クイズ, アナウンス, スピード はしご) is one lobby's game; おさらい a
 *  solo practice deck. */
export type ModeId = 'quiz' | 'ladder' | 'review' | 'announce';
/** The あそぶ page's shelves, in order: さくっと, まちで・でんわで, じっくり, ねる まえに. */
export type Group = 'quick' | 'scene' | 'long' | 'night';
const GROUPS: readonly Group[] = ['quick', 'scene', 'long', 'night'];

export interface ModeMeta {
  id: ModeId;
  group: Group;
  /** About how long a game takes (minutes) and its questions (clips). */
  mins: number;
  qs: number;
  /** It can be played together (さそう, the みんなで page's picker). */
  coop: boolean;
}

const MODES: readonly ModeMeta[] = [
  { id: 'quiz', group: 'quick', mins: 4, qs: 8, coop: true },
  { id: 'ladder', group: 'quick', mins: 3, qs: 8, coop: true },
  { id: 'review', group: 'quick', mins: 3, qs: 8, coop: false },
  { id: 'announce', group: 'scene', mins: 4, qs: 8, coop: true }
];
/** Every mode's id, in the shelves' order. */
export const MODE_IDS: readonly ModeId[] = MODES.map((m) => m.id);
export const modeOf = (id: ModeId): ModeMeta => MODES.find((m) => m.id === id)!;

/** What this build and this player have: the levels offered (deck.ts LEVELS), スピード はしご's clips, any game to
 *  review. */
export interface Ctx {
  levels: readonly number[];
  ladder: boolean;
  review: boolean;
}

/** A mode can be played now. */
export function playable(id: ModeId, c: Ctx): boolean {
  switch (id) {
    case 'quiz':
      return c.levels.some((lv) => lv !== 5);
    case 'announce':
      return c.levels.includes(5);
    case 'ladder':
      return c.ladder;
    case 'review':
      return c.review;
  }
}

/** The あそぶ page's shelves: each group with its playable modes, empty groups left out. */
export function shelves(c: Ctx): { group: Group; modes: ModeMeta[] }[] {
  return GROUPS.map((group) => ({ group, modes: MODES.filter((m) => m.group === group && playable(m.id, c)) })).filter((s) => s.modes.length);
}

/** The playable modes that can be shared (the みんなで page's picker). */
export const sharable = (c: Ctx): ModeMeta[] => MODES.filter((m) => m.coop && playable(m.id, c));

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

/** The level a mode opens at: アナウンス 5; the quiz the one remembered unless that's アナウンス's (then はまべ 1). */
export const lvForMode = (id: ModeId, last: number): number => (id === 'announce' ? 5 : last === 5 ? 1 : last);
