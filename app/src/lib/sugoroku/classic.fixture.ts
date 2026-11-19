// The classic board, the one hand-drawn board before layouts (games retired 2026-11-20): kept for the tests only (the
// route helpers and the 3D board's plan against a fixed, known board: its fork, its river, its stretches).
import { RIVER_HALF, riverY, routeDist, signsOf, type AreaId, type Board, type Space, type SpaceKind } from './board.ts';

const K: Record<string, SpaceKind> = { S: 'start', w: 'word', d: 'double', s: 'sentence', p: 'picture', e: 'event', G: 'goal' };
/** A snake row of `kinds` (one letter each: w d s p e) at height `y`, left to right or back, in `area`. */
const row = (kinds: string, area: AreaId, y: number, rtl: boolean, x0 = 34, x1 = 326): [string, AreaId, number, number][] =>
  [...kinds].map((k, i, all) => {
    const t = all.length === 1 ? 0 : i / (all.length - 1);
    const x = Math.round(rtl ? x1 - t * (x1 - x0) : x0 + t * (x1 - x0));
    return [k, area, x, y + (i % 2 ? 6 : -4)];
  });
/** 家 → 広場 → the fork (川の近道 / 博物館の遠回り) → お店 → 飛行場 → 浜辺. */
const PART1 = [...row('Swpwse', 'home', 44, false), ...row('wdwwsp', 'plaza', 116, true), ...row('ewwdsw', 'plaza', 188, false)];
const FORK_AT = PART1.length - 1;
const SHORT = row('dswd', 'river', 262, true, 62, 270);
const LONG: [string, AreaId, number, number][] = [['e', 'museum', 334, 262], ['p', 'museum', 334, 330], ['s', 'museum', 282, 390], ['w', 'museum', 212, 402],
  ['e', 'museum', 142, 398], ['p', 'museum', 84, 376], ['w', 'museum', 40, 336]];
const PART2 = [...row('wswepd', 'shop', 462, false), ...row('wswewp', 'airport', 534, true), ...row('sdwesG', 'beach', 612, false)];
const JOIN = PART1.length + SHORT.length + LONG.length;
const ROWS: readonly [string, AreaId, number, number, number[]?][] = [
  ...PART1.map((r, i) => (i === FORK_AT ? [...r, [PART1.length, PART1.length + SHORT.length]] as [string, AreaId, number, number, number[]] : r)),
  ...SHORT.map((r, i) => (i === SHORT.length - 1 ? [...r, [JOIN]] as [string, AreaId, number, number, number[]] : r)),
  ...LONG,
  ...PART2
];
const CLASSIC_SPACES: Space[] = ROWS.map(([k, area, x, y, next], i) => ({ kind: K[k], area, x, y, next: next ?? (k === 'G' ? [] : [i + 1]) }));
/** Trees by the route (more beyond the plan's sides), those clear of the route and the river. */
const CLASSIC_TREES: [number, number, number][] = [
  [20, 80, 11], [342, 150, 10], [18, 420, 12], [340, 500, 10], [24, 580, 11], [-30, 30, 14], [395, 60, 13], [-40, 170, 12], [400, 230, 14], [-45, 300, 13],
  [405, 360, 12], [-35, 440, 14], [395, 450, 12], [-40, 540, 13], [400, 580, 11], [130, 330, 9], [250, 345, 9], [-80, 100, 16], [440, 140, 15], [-90, 380, 16],
  [450, 300, 16], [-85, 500, 15], [445, 520, 14], [180, -10, 12], [60, -20, 13], [300, -15, 12]
];

const classicRiver = { y: 236, a: 6, b: 4, ph: 0 };
export const CLASSIC: Board = (() => {
  const goal = CLASSIC_SPACES.length - 1;
  const b: Board = {
    key: 'classic', family: 'classic', spaces: CLASSIC_SPACES, goal, forks: [FORK_AT], h: 700, river: classicRiver, signs: signsOf(CLASSIC_SPACES, goal),
    house: { x: 205, y: 318 }, trees: []
  };
  return { ...b, trees: CLASSIC_TREES.filter(([x, y, r]) => routeDist(CLASSIC_SPACES, x, y) >= r + 16 && Math.abs(y - riverY(b, x)) >= RIVER_HALF + r * 0.6) };
})();
