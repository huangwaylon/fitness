// 英語すごろく's board (docs/sugoroku.md "The board"): a route through the island from 家 to 海's ゴール, one fork on the
// way (川の近道: short, ×2 words; 博物館の遠回り: longer, two 絵 stones), both joining again at お店. Each space a kind:
// ことば (make a word), ことば×2 (its points doubled), ぶん (put a line in order), 絵 (spell a picture: a souvenir),
// イベント (a card), and the two ends;
// each at a point of the drawing (Board.svelte: a W × H box).

type SpaceKind = 'start' | 'word' | 'double' | 'sentence' | 'picture' | 'event' | 'goal';
type AreaId = 'home' | 'plaza' | 'river' | 'museum' | 'shop' | 'airport' | 'beach';
export interface Space {
  kind: SpaceKind;
  /** The stretch of the route it's on (its sign on the board). */
  area: AreaId;
  x: number;
  y: number;
  /** The spaces after it: one, or two at the fork (近道 first). */
  next: number[];
}

const K: Record<string, SpaceKind> = { S: 'start', w: 'word', d: 'double', s: 'sentence', p: 'picture', e: 'event', G: 'goal' };
/** The drawing's box (Board.svelte): 360 wide, H tall (a long route: the board scrolls to whose turn it is). */
export const W = 360;
export const H = 700;
/** A snake row of `kinds` (one letter each: w d s p e) at height `y`, left to right or back, in `area`. */
const row = (kinds: string, area: AreaId, y: number, rtl: boolean, x0 = 34, x1 = 326): [string, AreaId, number, number][] =>
  [...kinds].map((k, i, all) => {
    const t = all.length === 1 ? 0 : i / (all.length - 1);
    const x = Math.round(rtl ? x1 - t * (x1 - x0) : x0 + t * (x1 - x0));
    return [k, area, x, y + (i % 2 ? 6 : -4)];
  });
/** [kind, area, x, y, next (default: the one after)]: 家 → 広場 → the fork → お店 → 飛行場 → 浜辺, about 40 steps. */
const PART1 = [...row('Swpwse', 'home', 44, false), ...row('wdwwsp', 'plaza', 116, true), ...row('ewwdsw', 'plaza', 188, false)];
const FORK_AT = PART1.length - 1;
const SHORT: [string, AreaId, number, number][] = row('dswd', 'river', 262, true, 62, 270);
const LONG: [string, AreaId, number, number][] = [['e', 'museum', 334, 262], ['p', 'museum', 334, 330], ['s', 'museum', 282, 390], ['w', 'museum', 212, 402],
  ['e', 'museum', 142, 398], ['p', 'museum', 84, 376], ['w', 'museum', 40, 336]];
const PART2 = [...row('wswepd', 'shop', 462, false), ...row('wswewp', 'airport', 534, true), ...row('sdwesG', 'beach', 612, false)];
const JOIN = PART1.length + SHORT.length + LONG.length;
const ROWS: readonly [string, AreaId, number, number, number[]?][] = [
  ...PART1.map((r, i) => (i === FORK_AT ? [...r, [PART1.length, PART1.length + SHORT.length]] as [string, AreaId, number, number, number[]] : r)),
  // 近道, by the river
  ...SHORT.map((r, i) => (i === SHORT.length - 1 ? [...r, [JOIN]] as [string, AreaId, number, number, number[]] : r)),
  // 遠回り, round the museum
  ...LONG,
  // joined again
  ...PART2
];

export const BOARD: readonly Space[] = ROWS.map(([k, area, x, y, next], i) => ({ kind: K[k], area, x, y, next: next ?? (k === 'G' ? [] : [i + 1]) }));
export const GOAL = BOARD.length - 1;
export const FORK = BOARD.findIndex((s) => s.next.length > 1);

/** The space after `i`, the fork taken as `branch` (0 近道, 1 遠回り); null at the goal, or at the fork with no choice yet. */
export function stepFrom(i: number, branch: number | null): number | null {
  const n = BOARD[i].next;
  if (!n.length) return null;
  if (n.length === 1) return n[0];
  return branch === null ? null : n[branch];
}

/** The spaces walked from `a` to `b` (the fork as `branch`), b included; [b] if it isn't ahead. */
export function pathOf(a: number, b: number, branch: number | null): number[] {
  const out: number[] = [];
  for (let i = a, k = 0; i !== b && k < BOARD.length; k++) {
    const n = stepFrom(i, branch);
    if (n === null) return [b];
    out.push((i = n));
  }
  return out.length ? out : [b];
}

/** Spaces from `i` to the goal (the fork as `branch`, else the short way): the ranking's tie-break. */
export function toGoal(i: number, branch: number | null): number {
  let n = 0;
  for (let p: number | null = i; p !== null && p !== GOAL; n++) p = stepFrom(p, branch ?? 0);
  return n;
}
