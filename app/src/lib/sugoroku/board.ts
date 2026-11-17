// 英語すごろく's board (docs/sugoroku.md "The board"): a route through the island from 家 to 海's ゴール, one fork on the
// way (川の近道: short, ×2 words; 博物館の遠回り: longer, more chances), both joining again at お店. Each space a kind:
// ことば (make a word), ことば×2 (its points doubled), ぶん (put a line in order), イベント (a card), and the two ends;
// each at a point of the drawing (Board.svelte: a 360 × 420 box).

type SpaceKind = 'start' | 'word' | 'double' | 'sentence' | 'event' | 'goal';
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

const K: Record<string, SpaceKind> = { S: 'start', w: 'word', d: 'double', s: 'sentence', e: 'event', G: 'goal' };
/** [kind, area, x, y, next (default: the one after)]. */
const ROWS: readonly [string, AreaId, number, number, number[]?][] = [
  ['S', 'home', 34, 42], ['w', 'home', 88, 36], ['w', 'home', 142, 44], ['s', 'home', 196, 38],
  ['e', 'plaza', 250, 46], ['w', 'plaza', 304, 58], ['d', 'plaza', 330, 108], ['w', 'plaza', 300, 152, [8, 11]],
  // 近道 (8–10), by the river
  ['d', 'river', 240, 150], ['s', 'river', 182, 146], ['d', 'river', 124, 152, [16]],
  // 遠回り (11–15), round the museum
  ['e', 'museum', 318, 206], ['w', 'museum', 266, 224], ['s', 'museum', 210, 232], ['e', 'museum', 154, 230], ['w', 'museum', 100, 216],
  // joined again
  ['w', 'shop', 50, 182], ['e', 'shop', 40, 240], ['w', 'shop', 78, 290], ['s', 'shop', 132, 304],
  ['d', 'airport', 188, 308], ['w', 'airport', 244, 304], ['e', 'airport', 300, 306],
  ['w', 'beach', 330, 356], ['s', 'beach', 276, 386], ['w', 'beach', 216, 392], ['G', 'beach', 152, 388]
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
