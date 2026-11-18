// 英語すごろく's boards (docs/sugoroku.md "The board"): a route through the island from 家's ふりだし to the beach's
// あがり, forks on the way (each way two-ish choices, joining again further on). Each space a kind: ことば (make a word),
// ことば×2 (its points doubled), ぶん (put a line in order), 絵 (spell a picture), イベント (a card), and the two ends;
// each at a point of the plan (W wide, the board's `h` tall; y down the route). A game's board is generated from its
// layout seed (layout.ts); a game without one (an older save or online game) plays CLASSIC, the one board there was.

export type SpaceKind = 'start' | 'word' | 'double' | 'sentence' | 'picture' | 'event' | 'goal';
export type AreaId = 'home' | 'plaza' | 'river' | 'museum' | 'shop' | 'airport' | 'beach' | 'forest' | 'hill' | 'station' | 'park';
export interface Space {
  kind: SpaceKind;
  /** A みんなで！ stone (a mini-game: mini/): its `kind` the ことば it plays as once played (game.ts minis). */
  mini?: true;
  /** The stretch of the route it's on (its sign on the board). */
  area: AreaId;
  x: number;
  y: number;
  /** The spaces after it: one, or two at a fork. */
  next: number[];
}
/** A stone's kind as the board's rules count it: a みんなで！ stone its own. */
export type StoneKind = SpaceKind | 'mini';
export const stoneKind = (s: Pick<Space, 'kind' | 'mini'>): StoneKind => (s.mini ? 'mini' : s.kind);
/** The way taken at each fork passed (fork space → 0 or 1: its `next` index). */
export type Ways = Readonly<Record<number, number>>;
export interface Board {
  /** 'classic', or the layout's key (layout.ts). */
  key: string;
  /** The layout's family (layout.ts FAMILIES; the classic's own). */
  family: string;
  spaces: readonly Space[];
  goal: number;
  /** The spaces with two ways. */
  forks: readonly number[];
  /** The plan's height (the beach and sea past あがり). */
  h: number;
  /** The river across the island: its middle at x is riverY(board, x). */
  river: { y: number; a: number; b: number; ph: number };
  /** Each stretch's wooden sign: its first space `i`, where the sign stands. */
  signs: readonly { i: number; x: number; y: number }[];
  /** The one house (the museum, or 家 by ふりだし), and the round trees [x, y, r] (some past the plan's sides). */
  house: { x: number; y: number };
  trees: readonly (readonly [number, number, number])[];
  /** A crossroads' two links that cross ("a-b|c-d"). */
  crossing?: readonly string[];
}

/** The plan's width (Board.svelte draws it W wide, the 3D board's land ±W/2). */
export const W = 360;
/** The river's half width (plan units). */
export const RIVER_HALF = 11;
export const riverY = (b: Board, x: number): number => b.river.y + b.river.a * Math.sin(x / 45 + b.river.ph) - b.river.b * Math.cos(x / 23 + b.river.ph);

// ---- the classic board (the one before layouts: older saves and online games play it) ----

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

/** The stretches' first spaces (none of whose way in shares its area), each sign placed beside it clear of the route. */
export function signsOf(spaces: readonly Space[], goal: number): { i: number; x: number; y: number }[] {
  const prev = predecessors(spaces);
  const out: { i: number; x: number; y: number }[] = [];
  spaces.forEach((sp, i) => {
    if (i === 0 || i === goal || prev[i].some((p) => spaces[p].area === sp.area)) return;
    // (beside the stone: the side the way out of the stone's line has more room on, then below / above)
    const tries: [number, number][] = [[-30, 6], [30, 6], [0, 30], [-26, -24], [26, -24], [0, -30]];
    let best = tries[0], room = -1;
    for (const [dx, dy] of tries) {
      const x = sp.x + dx, y = sp.y + dy;
      if (x < 16 || x > W - 16) continue;
      const r = Math.min(routeDist(spaces, x, y), ...out.map((o) => Math.hypot(o.x - x, o.y - y) - 10));
      if (r > room + 0.5) (room = r), (best = [dx, dy]);
    }
    out.push({ i, x: sp.x + best[0], y: sp.y + best[1] });
  });
  return out;
}

/** Each space's spaces before it. */
export function predecessors(spaces: readonly Space[]): number[][] {
  const out: number[][] = spaces.map(() => []);
  spaces.forEach((sp, i) => sp.next.forEach((j) => out[j].push(i)));
  return out;
}

/** Distance from plan point (x, y) to the route (its stones and the links between). */
export function routeDist(spaces: readonly Space[], x: number, y: number): number {
  let d = Infinity;
  for (const sp of spaces) {
    d = Math.min(d, Math.hypot(x - sp.x, y - sp.y));
    for (const j of sp.next) d = Math.min(d, segDist(x, y, sp.x, sp.y, spaces[j].x, spaces[j].y));
  }
  return d;
}
export function segDist(x: number, y: number, ax: number, ay: number, bx: number, by: number): number {
  const vx = bx - ax, vy = by - ay, l2 = vx * vx + vy * vy;
  const t = l2 ? Math.max(0, Math.min(1, ((x - ax) * vx + (y - ay) * vy) / l2)) : 0;
  return Math.hypot(x - ax - vx * t, y - ay - vy * t);
}

const classicRiver = { y: 236, a: 6, b: 4, ph: 0 };
export const CLASSIC: Board = (() => {
  const goal = CLASSIC_SPACES.length - 1;
  const b: Board = {
    key: 'classic', family: 'classic', spaces: CLASSIC_SPACES, goal, forks: [FORK_AT], h: 700, river: classicRiver, signs: signsOf(CLASSIC_SPACES, goal),
    house: { x: 205, y: 318 }, trees: []
  };
  return { ...b, trees: CLASSIC_TREES.filter(([x, y, r]) => routeDist(CLASSIC_SPACES, x, y) >= r + 16 && Math.abs(y - riverY(b, x)) >= RIVER_HALF + r * 0.6) };
})();

// ---- walking the route ----

/** The space after `i` (a fork as `ways` has it); null at the goal, or at a fork with no way chosen yet. */
export function stepFrom(b: Board, i: number, ways: Ways): number | null {
  const n = b.spaces[i]?.next;
  if (!n?.length) return null;
  if (n.length === 1) return n[0];
  const w = ways[i];
  return w === 0 || w === 1 ? n[w] : null;
}

/** The spaces walked from `a` to `t` (the forks as `ways`), t included; [t] if it isn't ahead that way. */
export function pathOf(b: Board, a: number, t: number, ways: Ways): number[] {
  const out: number[] = [];
  for (let i = a, k = 0; i !== t && k < b.spaces.length; k++) {
    const n = stepFrom(b, i, ways);
    if (n === null) return [t];
    out.push((i = n));
  }
  return out.length ? out : [t];
}

const shortest = new WeakMap<Board, number[]>();
/** Each space's fewest steps to the goal (whichever ways). */
function minSteps(b: Board): number[] {
  let d = shortest.get(b);
  if (d) return d;
  const memo: number[] = b.spaces.map(() => -1);
  const go = (i: number): number => {
    if (memo[i] >= 0) return memo[i];
    const n = b.spaces[i].next;
    return (memo[i] = n.length ? 1 + Math.min(...n.map(go)) : 0);
  };
  d = b.spaces.map((_, i) => go(i));
  shortest.set(b, d);
  return d;
}

/** Steps from `i` to the goal: the ways chosen followed, a fork not yet reached the shorter way (the ranking's
 *  tie-break, the dice's catch-up). */
export function toGoal(b: Board, i: number, ways: Ways): number {
  let n = 0;
  for (let p = i; p !== b.goal; n++) {
    const s = stepFrom(b, p, ways);
    if (s === null) return n + minSteps(b)[p];
    p = s;
  }
  return n;
}

/** Every route from `i` to the goal (each a list of spaces, `i` first). */
export function routesFrom(b: Board, i = 0): number[][] {
  const n = b.spaces[i].next;
  if (!n.length) return [[i]];
  return n.flatMap((j) => routesFrom(b, j).map((r) => [i, ...r]));
}

/** A fork's two ways as its sign reads: the area each goes into, its steps to where they meet again (the first space
 *  both reach; the way's later forks taken as 0), and the kinds on the way (the meeting space left out). */
export function waysAt(b: Board, fork: number): { area: AreaId; steps: number; kinds: Partial<Record<StoneKind, number>> }[] {
  const next = b.spaces[fork].next;
  const walk = (j: number) => {
    const out = [j];
    for (let p = j; b.spaces[p].next.length; ) out.push((p = b.spaces[p].next[0]));
    return out;
  };
  const [a, c] = next.map(walk);
  const meet = a.find((x) => c.includes(x)) ?? b.goal;
  return [a, c].map((path) => {
    const on = path.slice(0, path.indexOf(meet));
    const kinds: Partial<Record<StoneKind, number>> = {};
    for (const k of on) kinds[stoneKind(b.spaces[k])] = (kinds[stoneKind(b.spaces[k])] ?? 0) + 1;
    return { area: b.spaces[path[0]].area, steps: on.length + 1, kinds };
  });
}
