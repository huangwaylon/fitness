// 英語すごろく's board for a game (docs/sugoroku.md "The board"), generated from the game's layout seed so every phone
// and every reload builds the same one: a family's shape (くねくね rows, ジグザグ legs, なみ waves, わっか loops round a
// pond, 十字路 lanes with a crossing, みつまた three forks), 1–3 forks (split lanes, a corner cut short or gone round,
// a crossroads where the lanes swap; joining early or late), the island's stretches in a new order with a few new ones,
// every stone's kind mixed under rules (no runs, the rare kinds spread out), and every route through it about as long
// and as rich as the others. A layout that breaks a rule (a stone too close, one in the river, a route out of the band)
// is tried again with the next sub-seed; `problems` is the rules (the tests run it over many seeds).
import { seeded } from '#lib/random.ts';
import { CLASSIC, RIVER_HALF, W, predecessors, riverY, routeDist, routesFrom, segDist, signsOf, type AreaId, type Board, type Space, type SpaceKind } from './board.ts';

import { GEN, familyOf, layoutKey, type Family } from './family.ts';
export { FAMILIES, familyOf, familyOfKey, layoutKey } from './family.ts';

/** Every route's steps (ふりだし to あがり), and the most two routes may differ. */
export const STEPS: readonly [number, number] = [37, 45];
const SPREAD = 6;
/** The play a stone is worth (a rough star count's ratio), every route's total within VALUE_TOL of the richest's. */
const VALUE: Record<SpaceKind, number> = { start: 0, goal: 0, word: 1, double: 1.7, sentence: 1.2, picture: 1.3, event: 1.1 };
const VALUE_TOL = 0.12;
/** Each route's count of a kind (the classic's spread, give or take). */
const PER_ROUTE: Partial<Record<SpaceKind, [number, number]>> = { double: [3, 7], sentence: [4, 10], picture: [2, 6], event: [3, 7] };
/** Stones between two of a kind on any route (at least), and the most ことば in a row. */
const GAP: Partial<Record<SpaceKind, number>> = { double: 3, picture: 3, event: 3, sentence: 2 };
const WORD_RUN = 3;
/** The plan's rules: stones apart, a link's length, a stone off another's link, the stones' x. */
const STONE_GAP = 46, LINK: [number, number] = [40, 100], CROSS_LINK = 150, OFF_LINK = 30, X: [number, number] = [34, 326];
/** The most stretches a board has (signs: one fewer), and trees (the classic's). */
const AREAS_MAX = 7, TREES_MAX = 22;
/** A stone's step along a drawn line. */
const S = 62;

const cache = new Map<string, Board>();
/** The board a game's layout key builds (none: CLASSIC), cached; null for a key this build can't (another GEN). */
export function boardOf(key?: string | null): Board | null {
  if (!key) return CLASSIC;
  const hit = cache.get(key);
  if (hit) return hit;
  const m = /^(\d+):(.+)$/.exec(key);
  if (!m || Number(m[1]) !== GEN) return null;
  const b = generate(m[2], key);
  cache.set(key, b);
  return b;
}

/** The board for `seed`: the first try that keeps every rule (CLASSIC if none does in TRIES: never, by the tests). */
const TRIES = 60;
export function generate(seed: string, key = layoutKey(seed)): Board {
  const family = familyOf(seed);
  for (let t = 0; t < TRIES; t++) {
    const b = attempt(seed, t, family, key);
    if (b && !problems(b).length) return b;
  }
  return { ...CLASSIC, key };
}

// ---- lines on the plan ----

type P = [number, number];
const dist = (a: P, b: P) => Math.hypot(b[0] - a[0], b[1] - a[1]);
const lerp = (a: P, b: P, t: number): P => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
const clampX = (x: number) => Math.min(X[1] - 6, Math.max(X[0] + 6, x));

/** A smooth line through `pts` (centripetal Catmull–Rom), as a dense polyline. */
function spline(pts: P[]): P[] {
  if (pts.length < 3) return line(pts[0], pts[pts.length - 1]);
  const n = pts.length, ext: P[] = [lerp(pts[1], pts[0], 2), ...pts, lerp(pts[n - 2], pts[n - 1], 2)];
  const out: P[] = [pts[0]];
  for (let i = 1; i < ext.length - 2; i++) {
    const [p0, p1, p2, p3] = [ext[i - 1], ext[i], ext[i + 1], ext[i + 2]];
    const k = Math.max(4, Math.ceil(dist(p1, p2) / 6));
    for (let j = 1; j <= k; j++) out.push(cr(p0, p1, p2, p3, j / k));
  }
  return out;
}
function cr(p0: P, p1: P, p2: P, p3: P, t: number): P {
  const d = (a: P, b: P) => Math.max(1e-4, Math.sqrt(dist(a, b)));
  const t1 = d(p0, p1), t2 = t1 + d(p1, p2), t3 = t2 + d(p2, p3), u = t1 + (t2 - t1) * t;
  const L = (a: P, b: P, ta: number, tb: number) => lerp(a, b, (u - ta) / (tb - ta));
  const a1 = L(p0, p1, 0, t1), a2 = L(p1, p2, t1, t2), a3 = L(p2, p3, t2, t3);
  return L(L(a1, a2, 0, t2), L(a2, a3, t1, t3), t1, t2);
}
const line = (a: P, b: P): P[] => [a, b];
function arc(c: P, r: number, from: number, to: number): P[] {
  const k = Math.max(6, Math.ceil((Math.abs(to - from) * r) / 6));
  return Array.from({ length: k + 1 }, (_, i) => {
    const a = from + ((to - from) * i) / k;
    return [c[0] + r * Math.cos(a), c[1] + r * Math.sin(a)] as P;
  });
}
const lengthOf = (pl: readonly P[]) => pl.reduce((s, p, i) => (i ? s + dist(pl[i - 1], p) : 0), 0);
/** The point `at` along the polyline. */
function along(pl: readonly P[], at: number): P {
  for (let i = 1, s = 0; i < pl.length; i++) {
    const l = dist(pl[i - 1], pl[i]);
    if (s + l >= at) return lerp(pl[i - 1], pl[i], l ? (at - s) / l : 0);
    s += l;
  }
  return pl[pl.length - 1];
}
/** The polyline's first `len`. */
function cut(pl: readonly P[], len: number): P[] {
  const out: P[] = [pl[0]];
  for (let i = 1, s = 0; i < pl.length; i++) {
    const l = dist(pl[i - 1], pl[i]);
    if (s + l >= len) return [...out, lerp(pl[i - 1], pl[i], l ? (len - s) / l : 0)];
    out.push(pl[i]);
    s += l;
  }
  return out;
}
/** The polyline's steps: round(length / S), at least one. */
const stepsOf = (pl: readonly P[]) => Math.max(1, Math.round(lengthOf(pl) / S));

// ---- the draft: stones laid along lines ----

type Theme = 'double' | 'picture' | 'event' | 'sentence' | 'plain';
interface Stone { x: number; y: number; area: AreaId; next: number[]; theme?: Theme; fixed?: SpaceKind }
interface Draft {
  stones: Stone[];
  /** Links allowed to cross (a crossroads' X), as "a-b|c-d". */
  crossing: Set<string>;
  /** The link the river runs under (its bridge). */
  bridge: [number, number] | null;
  /** Free middles (a loop's pond): the house or trees go there first. */
  middles: P[];
}
const add = (d: Draft, p: P, area: AreaId, theme?: Theme) => d.stones.push({ x: p[0], y: p[1], area, next: [], theme }) - 1;
const link = (d: Draft, a: number, b: number) => void d.stones[a].next.push(b);
const at = (d: Draft, i: number): P => [d.stones[i].x, d.stones[i].y];

/** Lay `n` steps along `pl` from stone `from` (at pl's start): the stones evenly along it, the last at its end (or
 *  stone `to`, already laid, there). The last stone's index. */
function lay(d: Draft, from: number, pl: readonly P[], n: number, area: AreaId, theme?: Theme, to?: number): number {
  const len = lengthOf(pl);
  let last = from;
  for (let k = 1; k <= n; k++) {
    if (k === n && to !== undefined) {
      link(d, last, to);
      return to;
    }
    const i = add(d, along(pl, (len * k) / n), area, theme);
    link(d, last, i);
    last = i;
  }
  return last;
}

/** Lay lines one after another from `from`, `budget` steps in all (the last line cut short to fit). */
function layLines(d: Draft, from: number, lines: P[][], budget: number, area: AreaId): { last: number; used: number } {
  let last = from, used = 0;
  for (const pl of lines) {
    if (used >= budget) break;
    const n = stepsOf(pl);
    if (used + n <= budget) {
      last = lay(d, last, pl, n, area);
      used += n;
    } else {
      const k = budget - used;
      last = lay(d, last, cut(pl, (lengthOf(pl) * k) / n), k, area);
      used += k;
    }
  }
  return { last, used };
}

// ---- the trunk's shapes (each from point p on, long enough for `need` steps) ----

type R = () => number;
const jit = (r: R, a: number) => (r() - 0.5) * 2 * a;

/** くねくね: rows across, a round turn at each end. */
function rows(p: P, need: number, r: R): P[][] {
  const g = 68 + r() * 12, rad = g / 2, xl = 74 + r() * 14, xr = W - 74 - r() * 14;
  let dir = p[0] < W / 2 ? 1 : -1, cur = p, total = 0;
  const out: P[][] = [];
  while (total < (need + 2) * S) {
    const edge = dir > 0 ? xr : xl, end: P = [edge, cur[1] + jit(r, 6)];
    if (Math.abs(end[0] - cur[0]) > S * 0.6) (out.push(line(cur, end)), (total += dist(cur, end)));
    else end[0] = cur[0], end[1] = cur[1];
    const c: P = [end[0], end[1] + rad];
    const turn = dir > 0 ? arc(c, rad, -Math.PI / 2, Math.PI / 2) : arc(c, rad, -Math.PI / 2, -1.5 * Math.PI);
    out.push(turn);
    total += Math.PI * rad;
    cur = turn[turn.length - 1];
    dir = -dir;
  }
  return out;
}

/** ジグザグ: straight legs down from side to side (a stone at each corner). */
function zigzag(p: P, need: number, r: R): P[][] {
  let dir = p[0] < W / 2 ? 1 : -1, cur = p, total = 0;
  const out: P[][] = [];
  while (total < (need + 2) * S) {
    const x = dir > 0 ? X[1] - 14 - r() * 20 : X[0] + 14 + r() * 20, dy = (150 + r() * 40) * (Math.abs(x - cur[0]) / 250);
    const end: P = [x, cur[1] + Math.max(60, dy)];
    out.push(line(cur, end));
    total += dist(cur, end);
    cur = end;
    dir = -dir;
  }
  return out;
}

/** なみ: one long S-curve swinging side to side down the island. */
function wave(p: P, need: number, r: R): P[][] {
  const a = 112 + r() * 14;
  let side = p[0] < W / 2 ? 1 : -1, cur = p;
  const pts: P[] = [p];
  while (lengthOf(spline(pts)) < (need + 2) * S) {
    cur = [W / 2 + side * (a + jit(r, 8)), cur[1] + 108 + r() * 24];
    pts.push(cur);
    side = -side;
  }
  return [spline(pts)];
}

/** わっか: down to a round pond, three-quarters round it, then out and down past its side (its middle free). */
function loop(p: P, r: R, d: Draft): P[] {
  const m = p[0] < W / 2 ? 1 : -1, rad = 64 + r() * 12, cx = W / 2 + m * (52 + r() * 10), cy = p[1] + 54 + rad;
  const top: P = [cx, cy - rad];
  // (clockwise on the plan for m = 1: top → its far side → bottom → its near side; mirrored for m = −1)
  const ring = arc([cx, cy], rad, -Math.PI / 2, -Math.PI / 2 + m * 1.5 * Math.PI).slice(1);
  const side = ring[ring.length - 1], out = side[0] - m * 60;
  const exit = spline([side, [side[0] - m * 34, cy - 40], [out, cy - 6], [out + m * 4, cy + rad * 0.7], [out + m * 20, cy + rad + 50]]).slice(1);
  d.middles.push([cx, cy]);
  return [...line(p, top), ...ring, ...exit];
}

/** A way from P to Q bowed to `side` (+1: the left of P→Q's direction) by `amp`: out, along, and back in (a flat
 *  bow: no hairpins), never past Q's height. */
function bowed(Pp: P, Q: P, side: number, amp: number): P[] {
  const dx = Q[0] - Pp[0], dy = Q[1] - Pp[1], l = Math.hypot(dx, dy), nx = (dy / l) * side, ny = (-dx / l) * side;
  const pts: P[] = [];
  for (let k = 0; k <= 6; k++) {
    const t = k / 6, off = amp * Math.min(1, 1.5 * Math.sin(Math.PI * t)), base = lerp(Pp, Q, t);
    pts.push(k === 0 || k === 6 ? base : [clampX(base[0] + nx * off), Math.min(Q[1] - 8, Math.max(Pp[1] + 8, base[1] + ny * off))]);
  }
  return spline(pts);
}
/** The bow whose way is `len` long, or null if none is. */
function fitBow(Pp: P, Q: P, side: number, amp0: number, amp1: number, len: number): P[] | null {
  const make = (s: number) => bowed(Pp, Q, side, amp0 + s * (amp1 - amp0));
  let lo = 0, hi = 1;
  if (lengthOf(make(hi)) < len || lengthOf(make(lo)) > len * 1.08) return null;
  for (let k = 0; k < 24; k++) {
    const m = (lo + hi) / 2;
    if (lengthOf(make(m)) < len) lo = m;
    else hi = m;
  }
  return make(hi);
}

// ---- a board ----

const POOL: readonly AreaId[] = ['plaza', 'river', 'museum', 'shop', 'airport', 'forest', 'hill', 'station', 'park'];
type Shape = 'split' | 'corner' | 'cross';
type Style = 'rows' | 'zigzag' | 'wave';
interface Recipe { styles: Style[]; forks: Shape[]; early: number; loop: boolean }
function recipe(f: Family, r: R): Recipe {
  const pick = <T>(xs: readonly T[]) => xs[Math.floor(r() * xs.length)];
  const twoOf = (xs: readonly Shape[]) => (r() < 0.5 ? [pick(xs)] : [pick(xs), pick(xs)]);
  switch (f) {
    case 'snake': return { styles: ['rows'], forks: twoOf(['split', 'corner']), early: 0.4, loop: false };
    case 'zigzag': return { styles: ['zigzag'], forks: twoOf(['corner', 'split']), early: 0.4, loop: false };
    case 'wave': return { styles: ['wave'], forks: r() < 0.7 ? ['split', 'split'] : ['split'], early: 0.5, loop: false };
    case 'loop': return { styles: [pick(['rows', 'wave'] as const)], forks: twoOf(['split', 'corner']), early: 0.5, loop: true };
    case 'cross': return { styles: [pick(['rows', 'wave', 'zigzag'] as const)], forks: r() < 0.5 ? ['cross'] : r() < 0.5 ? ['cross', 'split'] : ['corner', 'cross'], early: 0.3, loop: false };
    case 'forks': return { styles: ['wave', 'rows', 'zigzag'], forks: [pick(['split', 'corner'] as const), 'split', pick(['split', 'corner'] as const)], early: 0.9, loop: false };
  }
}

function attempt(seed: string, t: number, family: Family, key: string): Board | null {
  const r = seeded(`${seed}#${t}`);
  const rc = recipe(family, r);
  const pool = POOL.map((a) => [a, r()] as const).sort((a, b) => a[1] - b[1]).map(([a]) => a);
  const F = rc.forks.length;
  // the stretches: 家 first, 浜辺 last, AREAS_MAX in all; each fork one new way (its other the trunk's) or two, its
  // join a new stretch or the way's on; an extra stretch after 家 or before 浜辺 with what's left
  let budget = AREAS_MAX - 2;
  const take = (noRiver = false): AreaId => {
    budget--;
    return pool.splice(noRiver ? pool.findIndex((a) => a !== 'river') : 0, 1)[0];
  };
  const extraFirst = budget - F >= 2 && r() < 0.6;
  const L = 39 + Math.floor(r() * 5);

  const d: Draft = { stones: [], crossing: new Set(), bridge: null, middles: [] };
  const start = add(d, [W / 2 + jit(r, 110), 44], 'home');
  d.stones[start].fixed = 'start';
  let cur = start, area: AreaId = 'home';
  const style = (): Style => rc.styles[Math.floor(r() * rc.styles.length)];
  /** Where the river may go (a trunk's new stretch begins with a bridge link). */
  const riverAt = Math.min(F, 1 + Math.floor(r() * F));
  let bridged = false, looped = !rc.loop;

  /** One trunk stretch of `n` steps in `a` (a bridge link first if it's the river's, or `bridge`). */
  const trunk = (n: number, a: AreaId, bridge = false) => {
    // (one river: a 川 after the bridge is somewhere else)
    if (a === 'river' && bridged) a = pool.splice(pool.findIndex((x) => x !== 'river'), 1)[0];
    // (a stretch after the start begins a step below all laid so far: clear of the last turn, the ways into a join)
    if (cur !== start) {
      const p0 = at(d, cur), floor = Math.max(...d.stones.filter((_, i) => i !== cur).map((st) => st.y));
      if (p0[1] - floor < S * 0.9) {
        cur = lay(d, cur, line(p0, [clampX(p0[0] + jit(r, 12)), Math.max(p0[1], floor) + S]), 1, a);
        n -= 1;
      }
    }
    if (a === 'river' || (bridge && !bridged)) {
      const p0 = at(d, cur), p1: P = [clampX(p0[0] + jit(r, 18)), p0[1] + 84];
      const b = add(d, p1, a);
      link(d, cur, b);
      d.bridge = [cur, b];
      cur = b;
      n -= 1;
      bridged = true;
    }
    if (!looped) {
      const pl = loop(at(d, cur), r, d), k = stepsOf(pl);
      if (k <= n - 1) {
        looped = true;
        cur = lay(d, cur, pl, k, a);
        n -= k;
      } else d.middles.pop();
    }
    if (n > 0) {
      const p = at(d, cur), st = style();
      const lines = st === 'rows' ? rows(p, n, r) : st === 'zigzag' ? zigzag(p, n, r) : wave(p, n, r);
      cur = layLines(d, cur, lines, n, a).last;
    }
    area = a;
  };

  // 家 (and a stretch after it); a loop's trunk longer
  const first = 6 + Math.floor(r() * 4) + (looped ? 0 : 5);
  if (extraFirst) {
    trunk(3 + Math.floor(r() * 2), 'home');
    trunk(first - 3, take());
  } else trunk(first, 'home');

  for (const [fi, shape] of rc.forks.entries()) {
    // the fork: its stone the trunk's last; its ways' areas; their steps (early: the short way 3–4, late 5–7)
    // (the fork a step straight down from the trunk, below all laid so far: its ways leave clear of it)
    const floor = Math.max(...d.stones.map((st) => st.y)), p0 = at(d, cur);
    cur = lay(d, cur, line(p0, [clampX(p0[0] + jit(r, 10)), Math.max(p0[1], floor) + S]), 1, area);
    const fork = cur, Pp = at(d, fork), rem = F - 1 - fi;
    const two = budget - rem >= 3 && r() < 0.5;
    const newA = take(true), newB: AreaId = two ? take(true) : area;
    const joinArea = (): AreaId => (budget - rem >= 1 && r() < 0.65 ? take() : r() < 0.5 || !two ? newB : newA);
    const early = r() < rc.early, na = early ? 3 + Math.floor(r() * 2) : 5 + Math.floor(r() * 3);
    const nb = Math.min(Math.round(na * 1.6) + 1, na + 1 + Math.floor(r() * (F === 1 ? 4 : F === 2 ? 3 : 2)));
    // (the short way's theme rich, the long way's steadier)
    const shortTheme = (['double', 'picture', 'event'] as const)[Math.floor(r() * 3)];
    const longTheme = (['plain', 'sentence', 'picture'] as const).filter((x) => x !== shortTheme)[Math.floor(r() * 2)];
    // (which way is first in the fork's `next`: 0 short or long)
    const shortFirst = r() < 0.5;
    if (shape === 'cross') {
      const h = 230 + r() * 90, Q: P = [W / 2 + jit(r, 24), Pp[1] + h + 40];
      // (each lane out to its side, in to a narrow middle, a step straight down, out again and into Q)
      const lane = (side: number) => {
        const mid = Pp[1] + h * 0.45 + 20;
        return [Pp, [W / 2 + side * (100 + r() * 14), Pp[1] + h * 0.22 + 20], [W / 2 + side * 58, mid], [W / 2 + side * 58, mid + S], [W / 2 + side * (100 + r() * 14), Pp[1] + h * 0.85 + 30], Q] as P[];
      };
      const join = add(d, Q, joinArea());
      // (each lane in two halves at its narrow middle, where the crossing is)
      const halves = (side: number) => {
        const c = lane(side);
        return [spline(c.slice(0, 3)), [c[2], ...spline(c.slice(3))]];
      };
      const [l1, l2] = halves(-1), [q1, q2] = halves(1);
      if (stepsOf(l2) < 2 || stepsOf(q2) < 2) return null;
      const aA = shortFirst ? newA : newB, aB = shortFirst ? newB : newA;
      const lm = lay(d, fork, l1, stepsOf(l1), aA, shortTheme);
      lay(d, lm, l2, stepsOf(l2), aA, shortTheme, join);
      const rm = lay(d, fork, q1, stepsOf(q1), aB, longTheme);
      lay(d, rm, q2, stepsOf(q2), aB, longTheme, join);
      // the crossing: each middle may swap to the other lane's next stone
      const l2first = d.stones[lm].next[0], r2first = d.stones[rm].next[0];
      link(d, lm, r2first);
      link(d, rm, l2first);
      d.crossing.add(`${lm}-${r2first}|${rm}-${l2first}`);
      cur = join;
    } else {
      // split: Q below, the ways bowing either side; corner: Q across and down, the short way cutting the corner
      const corner = shape === 'corner';
      let short: P[] | null = null, Q: P = Pp;
      // (a corner's long way bows down-hill, the short way cuts across: neither back up into the trunk)
      let sideS = 1;
      let long: P[] | null = null;
      for (let k = 0; k < 14 && !long; k++) {
        const len = na * S, frac = (corner ? 0.8 : 0.62) + k * 0.02;
        Q = corner ? [Pp[0] < W / 2 ? X[1] - 30 - r() * 20 : X[0] + 30 + r() * 20, 0] : [clampX(Pp[0] + (W / 2 - Pp[0]) * 0.6 + jit(r, 20)), 0];
        const dx = Q[0] - Pp[0];
        Q[1] = Pp[1] + Math.sqrt(Math.max(60 * 60, (len * frac) ** 2 - dx * dx));
        // (the long way bows to the roomier side: a corner's down-hill, a split's toward the middle)
        sideS = corner ? Math.sign(dx) || 1 : Pp[0] < W / 2 ? -1 : 1;
        short = fitBow(Pp, Q, sideS, 0, 0.3 * dist(Pp, Q), len);
        long = short && fitBow(Pp, Q, -sideS, 0.15 * dist(Pp, Q), 170, nb * S);
      }
      if (!short || !long) return null;
      const join = add(d, Q, joinArea());
      const [first, second] = shortFirst ? [[short, na, newA, shortTheme], [long, nb, newB, longTheme]] as const : [[long, nb, newA, longTheme], [short, na, newB, shortTheme]] as const;
      lay(d, fork, first[0], first[1], first[2], first[3], join);
      lay(d, fork, second[0], second[1], second[2], second[3], join);
      cur = join;
    }
    area = d.stones[cur].area;
    // the trunk on to the next fork (none after the last: the beach's, below)
    if (fi < F - 1) trunk(4 + Math.floor(r() * 4) + (looped ? 0 : 6), area, fi + 1 === riverAt);
  }

  // the rest to the beach: as long as brings the average route to L
  const [lo, hi] = stepsRange(d);
  let rest = Math.max(STEPS[0] - lo, Math.min(STEPS[1] - hi, Math.round(L - (lo + hi) / 2)));
  if (rest < 4) return null;
  if (budget >= 1 && rest >= 8 && r() < 0.7) {
    const k = Math.floor(rest / 2);
    trunk(k, take(), !bridged);
    rest -= k;
  }
  trunk(rest, 'beach', !bridged);
  const goal = d.stones.length - 1;
  if (cur !== goal) return null;
  d.stones[goal].fixed = 'goal';

  // mirrored half the time (ふりだし's side, the turns)
  if (r() < 0.5) {
    for (const s of d.stones) s.x = W - s.x;
    d.middles = d.middles.map(([x, y]) => [W - x, y]);
  }
  if (!kindsFor(d, r)) return null;
  return finish(d, r, key, family);
}

/** The fewest and most steps from ふりだし to the draft's last stone. */
function stepsRange(d: Draft): [number, number] {
  const lo: number[] = d.stones.map(() => Infinity), hi: number[] = d.stones.map(() => -Infinity);
  lo[0] = hi[0] = 0;
  for (const i of topo(d.stones)) for (const j of d.stones[i].next) (lo[j] = Math.min(lo[j], lo[i] + 1)), (hi[j] = Math.max(hi[j], hi[i] + 1));
  const last = d.stones.length - 1;
  return [lo[last], hi[last]];
}

/** The stones in an order where each comes after every stone before it on the route. */
function topo(st: readonly { next: number[] }[]): number[] {
  const indeg = st.map(() => 0);
  st.forEach((s) => s.next.forEach((j) => indeg[j]++));
  const q = st.map((_, i) => i).filter((i) => !indeg[i]), out: number[] = [];
  while (q.length) {
    const i = q.shift()!;
    out.push(i);
    for (const j of st[i].next) if (!--indeg[j]) q.push(j);
  }
  return out;
}

// ---- the stones' kinds ----

const MIX: Record<Exclude<SpaceKind, 'start' | 'goal'>, number> = { word: 0.37, double: 0.12, sentence: 0.2, picture: 0.1, event: 0.15 };
const THEME: Record<Theme, Partial<Record<SpaceKind, number>>> = {
  double: { double: 2.6, word: 0.6 }, picture: { picture: 3, word: 0.7 }, event: { event: 2.6, word: 0.7 }, sentence: { sentence: 2.2 }, plain: { word: 1.6 }
};

/** Each stone's kind: in route order, a weighted pick toward the mix (a way's theme leaning it) under the spacing rules;
 *  tried again till every route's counts and play are in their bands. */
function kindsFor(d: Draft, r: R): boolean {
  const order = topo(d.stones), prev = predecessors(d.stones as unknown as Space[]);
  const goal = d.stones.length - 1;
  for (let t = 0; t < 14; t++) {
    const kind: SpaceKind[] = d.stones.map((s) => s.fixed ?? 'word');
    const since: Record<string, number>[] = d.stones.map(() => ({}));
    const run: number[] = d.stones.map(() => 0);
    const count: Record<string, number> = {};
    let placed = 0;
    for (const i of order) {
      const s = d.stones[i], ps = prev[i];
      if (!s.fixed) {
        const branching = s.next.length > 1 || ps.length > 1;
        const options = (Object.keys(MIX) as (keyof typeof MIX)[]).filter((k) => {
          if (branching && k !== 'word' && k !== 'sentence') return false;
          if (ps.includes(0) && k !== 'word') return false;
          if (s.next.includes(goal) && k === 'event') return false;
          if (k === 'word') return Math.max(0, ...ps.map((p) => run[p])) < WORD_RUN;
          return Math.min(...ps.map((p) => since[p][k] ?? 99)) + 1 >= (GAP[k] ?? 1);
        });
        if (!options.length) break;
        const w = options.map((k) => {
          const deficit = MIX[k] * (placed + 1) - (count[k] ?? 0);
          return [k, MIX[k] * (s.theme ? (THEME[s.theme][k] ?? 1) : 1) * Math.min(3, Math.max(0.15, 1 + deficit))] as const;
        });
        let x = r() * w.reduce((a, [, v]) => a + v, 0), pick = w[w.length - 1][0];
        for (const [k, v] of w) if ((x -= v) < 0) { pick = k; break; }
        kind[i] = pick;
        count[pick] = (count[pick] ?? 0) + 1;
        placed++;
      }
      run[i] = kind[i] === 'word' ? 1 + Math.max(0, ...ps.map((p) => run[p])) : 0;
      for (const k of Object.keys(GAP)) since[i][k] = kind[i] === k ? 0 : Math.min(99, ...ps.map((p) => (since[p][k] ?? 98) + 1));
    }
    const spaces = d.stones.map((s, i) => ({ ...s, kind: kind[i] }));
    if (!kindProblems(spaces as Space[], goal).length) {
      spaces.forEach((s, i) => (d.stones[i].fixed = s.kind));
      return true;
    }
  }
  return false;
}

/** The kinds' rules over every route: the ends, the gaps, the runs, each route's counts, its play against the others'. */
function kindProblems(spaces: readonly Space[], goal: number): string[] {
  const b = { spaces, goal } as Board;
  const out: string[] = [];
  if (spaces[0].kind !== 'start' || spaces[goal].kind !== 'goal') out.push('ends');
  const values: number[] = [];
  for (const route of routesFrom(b)) {
    const kinds = route.map((i) => spaces[i].kind);
    let wordRun = 0;
    const last: Record<string, number> = {};
    kinds.forEach((k, n) => {
      wordRun = k === 'word' ? wordRun + 1 : 0;
      if (wordRun > WORD_RUN) out.push(`word run at ${route[n]}`);
      const g = GAP[k];
      if (g && last[k] !== undefined && n - last[k] < g) out.push(`${k} too close at ${route[n]}`);
      last[k] = n;
    });
    for (const [k, [lo, hi]] of Object.entries(PER_ROUTE)) {
      const c = kinds.filter((x) => x === k).length;
      if (c < lo || c > hi) out.push(`${c} ${k} on a route`);
    }
    values.push(kinds.reduce((s, k) => s + VALUE[k], 0));
  }
  const top = Math.max(...values);
  if ((top - Math.min(...values)) / top > VALUE_TOL) out.push(`routes' play ${Math.min(...values).toFixed(1)}–${top.toFixed(1)}`);
  return out;
}

// ---- the scenery: the river under its bridge, the house, the trees; the board's checks ----

function finish(d: Draft, r: R, key: string, family: string): Board {
  const spaces: Space[] = d.stones.map((s) => ({ kind: s.fixed!, area: s.area, x: Math.round(s.x * 10) / 10, y: Math.round(s.y * 10) / 10, next: s.next }));
  const goal = spaces.length - 1;
  const h = Math.round(spaces[goal].y + 88);
  // the river: through the bridge link's middle, waving a little
  const [ba, bb] = d.bridge ?? [0, spaces[0].next[0]];
  const mx = (spaces[ba].x + spaces[bb].x) / 2, my = (spaces[ba].y + spaces[bb].y) / 2;
  const river0 = { y: 0, a: 3 + r() * 2, b: 2 + r(), ph: r() * Math.PI * 2 };
  const river = { ...river0, y: my - riverY({ river: river0 } as Board, mx) };
  const forks = spaces.map((s, i) => (s.next.length > 1 ? i : -1)).filter((i) => i >= 0);
  const base: Board = { key, family, spaces, goal, forks, h, river, signs: signsOf(spaces, goal), house: { x: 0, y: 0 }, trees: [], crossing: [...d.crossing] };
  const clear = (x: number, y: number, room: number) =>
    routeDist(spaces, x, y) >= room && Math.abs(y - riverY(base, x)) >= RIVER_HALF + room * 0.6 && base.signs.every((sg) => Math.hypot(sg.x - x, sg.y - y) >= room);
  // the house: by the museum's stretch if there is one, else by 家; a loop's pond first
  const near = spaces.filter((s) => s.area === 'museum');
  const aim = near.length ? near : spaces.slice(0, 3);
  const ax = aim.reduce((s, p) => s + p.x, 0) / aim.length, ay = aim.reduce((s, p) => s + p.y, 0) / aim.length;
  const spots: P[] = [...d.middles];
  for (let y = 30; y < spaces[goal].y - 20; y += 12) for (let x = 40; x <= W - 40; x += 12) spots.push([x, y]);
  const house = spots.filter(([x, y]) => clear(x, y, 40)).sort((a, b) => Math.hypot(a[0] - ax, a[1] - ay) - Math.hypot(b[0] - ax, b[1] - ay))[0] ?? [-60, 60];
  base.house = { x: house[0], y: house[1] };
  // the trees: a few on the island clear of everything, the rest past its sides
  const trees: [number, number, number][] = [];
  const ok = (x: number, y: number, rr: number) => clear(x, y, rr + 16) && Math.hypot(x - house[0], y - house[1]) > rr + 40 && trees.every((t) => Math.hypot(t[0] - x, t[1] - y) > t[2] + rr + 6);
  for (const [x, y] of d.middles) if (Math.hypot(x - house[0], y - house[1]) > 50 && ok(x, y, 12)) trees.push([x, y, 12]);
  for (let k = 0; k < 80 && trees.length < 9; k++) {
    const x = 16 + r() * (W - 32), y = 10 + r() * (spaces[goal].y - 40), rr = 9 + r() * 4;
    if (ok(x, y, rr)) trees.push([Math.round(x), Math.round(y), Math.round(rr)]);
  }
  for (let y = -20, k = 0; trees.length < TREES_MAX && y < h - 90; y += 46 + r() * 30, k++) {
    const x = k % 2 ? W + 30 + r() * 80 : -30 - r() * 80;
    trees.push([Math.round(x), Math.round(y), 11 + Math.round(r() * 5)]);
  }
  base.trees = trees.slice(0, TREES_MAX);
  return base;
}

/** The board's broken rules (none: playable and drawable). */
export function problems(b: Board): string[] {
  const out: string[] = [];
  const sp = b.spaces, n = sp.length;
  // connected, every route reaching あがり, the band of steps
  const routes = routesFrom(b);
  if (!routes.length || topo(sp).length !== n) out.push('not a route');
  const reach = new Set(routes.flat());
  if (reach.size !== n) out.push('a stone off every route');
  const steps = routes.map((rt) => rt.length - 1);
  const lo = Math.min(...steps), hi = Math.max(...steps);
  if (lo < STEPS[0] || hi > STEPS[1] || hi - lo > SPREAD) out.push(`steps ${lo}–${hi}`);
  if (sp.some((s) => s.next.length > 2)) out.push('a three-way fork');
  out.push(...kindProblems(sp, b.goal));
  // the plan: stones apart and inside, links not too long or short, off other stones, crossing only at a crossroads
  const crossing = new Set(b.crossing ?? []);
  const links: [number, number][] = sp.flatMap((s, i) => s.next.map((j) => [i, j] as [number, number]));
  for (let i = 0; i < n; i++) {
    if (sp[i].x < X[0] || sp[i].x > X[1] || sp[i].y < 30) out.push(`stone ${i} outside`);
    for (let j = i + 1; j < n; j++) if (!sp[i].next.includes(j) && !sp[j].next.includes(i) && Math.hypot(sp[i].x - sp[j].x, sp[i].y - sp[j].y) < STONE_GAP) out.push(`stones ${i} ${j} close`);
  }
  const crossed = new Set([...crossing].flatMap((c) => c.split('|')));
  for (const [a, c] of links) {
    const l = Math.hypot(sp[a].x - sp[c].x, sp[a].y - sp[c].y);
    if (l < LINK[0] || l > (crossed.has(`${a}-${c}`) ? CROSS_LINK : LINK[1])) out.push(`link ${a}-${c} ${Math.round(l)}`);
    for (let i = 0; i < n; i++) if (i !== a && i !== c && segDist(sp[i].x, sp[i].y, sp[a].x, sp[a].y, sp[c].x, sp[c].y) < OFF_LINK) out.push(`stone ${i} on link ${a}-${c}`);
  }
  for (let p = 0; p < links.length; p++) for (let q = p + 1; q < links.length; q++) {
    const [a, c] = links[p], [e, f] = links[q];
    if (a === e || a === f || c === e || c === f) continue;
    if (crossing.has(`${a}-${c}|${e}-${f}`) || crossing.has(`${e}-${f}|${a}-${c}`)) continue;
    if (segsCross(sp[a], sp[c], sp[e], sp[f])) out.push(`links ${a}-${c} ${e}-${f} cross`);
  }
  // the river clear of the stones, two bridges at most; the stretches and signs; the house and trees off the route
  for (const [i, s] of sp.entries()) if (Math.abs(s.y - riverY(b, s.x)) < RIVER_HALF + 18) out.push(`stone ${i} in the river`);
  const over = links.filter(([a, c]) => Math.sign(sp[a].y - riverY(b, sp[a].x)) !== Math.sign(sp[c].y - riverY(b, sp[c].x)));
  if (over.length < 1 || over.length > 2) out.push(`${over.length} bridges`);
  if (new Set(sp.map((s) => s.area)).size > AREAS_MAX || b.signs.length > AREAS_MAX - 1) out.push('too many stretches');
  for (const sg of b.signs) if (routeDist(sp, sg.x, sg.y) < 14) out.push(`sign ${sg.i} on the route`);
  if (routeDist(sp, b.house.x, b.house.y) < 36) out.push('the house on the route');
  if (b.trees.length > TREES_MAX) out.push('too many trees');
  for (const [x, y, rr] of b.trees) if (routeDist(sp, x, y) < rr + 14) out.push(`a tree on the route at ${x},${y}`);
  // the fork's two ways read differently (their areas)
  for (const f of b.forks) {
    const [a, c] = sp[f].next;
    if (sp[a].area === sp[c].area) out.push(`fork ${f}'s ways alike`);
  }
  return out;
}

function segsCross(a: { x: number; y: number }, b: { x: number; y: number }, c: { x: number; y: number }, d: { x: number; y: number }): boolean {
  const o = (p: typeof a, q: typeof a, r: typeof a) => Math.sign((q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x));
  return o(a, b, c) * o(a, b, d) < 0 && o(c, d, a) * o(c, d, b) < 0;
}
