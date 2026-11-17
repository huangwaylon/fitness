// 英語すごろく's board (docs/sugoroku.md "The board"): one route from 家 to ゴール through the island's places, each space
// a kind: ことば (make a word), ことば×2 (its points doubled), ぶん (put a TV line in order), イベント (a card), and the
// two ends. Laid out as a snake on a grid of COLS columns (Board.svelte draws it from `cellOf`).

export type SpaceKind = 'start' | 'word' | 'double' | 'sentence' | 'event' | 'goal';
export interface Space {
  kind: SpaceKind;
  /** The stretch of the route it's on (its colour and label on the board). */
  area: AreaId;
}
type AreaId = 'home' | 'plaza' | 'museum' | 'shop' | 'airport' | 'beach';

/** The route's stretches, in order, each its spaces' kinds (w word, d double, s sentence, e event). */
const ROUTE: readonly [AreaId, string][] = [
  ['home', 'wws'],
  ['plaza', 'wewd'],
  ['museum', 'swwe'],
  ['shop', 'dwsw'],
  ['airport', 'ewdw'],
  ['beach', 'swe']
];
const KIND: Record<string, SpaceKind> = { w: 'word', d: 'double', s: 'sentence', e: 'event' };

export const BOARD: readonly Space[] = [
  { kind: 'start', area: 'home' },
  ...ROUTE.flatMap(([area, ks]) => [...ks].map((k) => ({ kind: KIND[k], area }))),
  { kind: 'goal', area: 'beach' }
];
export const GOAL = BOARD.length - 1;

export const COLS = 5;
/** A space's cell: rows top to bottom, each row left→right then right→left (a snake). */
export function cellOf(i: number): { row: number; col: number } {
  const row = Math.floor(i / COLS), c = i % COLS;
  return { row, col: row % 2 ? COLS - 1 - c : c };
}
export const ROWS = Math.ceil(BOARD.length / COLS);
