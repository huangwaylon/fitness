// The junction card and the fork highlight (docs/hiking.md "In-hike map"), pure: from a trail's net file (lib/hiking/
// net.ts, OSM), where along the route the phone is and which way along it the hiker walks, the next fork ahead (spec
// R12: only within 150 m, only where a branch off it is a footpath: path, track, steps, footway), which way to go there,
// and its branches' names. Walking the route backward (turned back), the fork is the one behind on the route, entered
// by the route's way out, and the way to go is the way the route came in. The direction is the ROUTE's (R1): the
// bearing into the fork against each branch's bearing out of it (both from the file, measured 20–30 m along), never
// the compass; a word (右 / 左 / まっすぐ) only when the route's branch stands more than 45° from every other way out,
// else the names alone and the map's highlighted branch.
import type { NetFile, NetFork } from '#lib/hiking/net.ts';
import { flatM } from '#lib/hiking/flat.ts';
import { turn } from './compass.ts';

const JUNCTION = { ahead: 150, behind: 15, apart: 45, straight: 30, arrive: 60, foot: ['path', 'track', 'steps', 'footway'] } as const;

export type Dir = 'right' | 'left' | 'straight';
interface Branch { name: string | null; dir: Dir | null; take: boolean; line: number }
export interface Junction {
  fork: number;
  /** Its pass (an index in the fork's `pass`). */
  pass: number;
  /** Walking the route backward. */
  rev: boolean;
  /** Metres to it along the way walked (negative just past it). */
  to: number;
  /** The way to go (a word only when it stands clear of the others). */
  dir: Dir | null;
  /** The ways out (the arrival's way left off), the one to take first. */
  br: Branch[];
}

export const dirOf = (rel: number): Dir => (Math.abs(rel) <= JUNCTION.straight ? 'straight' : rel > 0 ? 'right' : 'left');

/** The route's branch a pass arriving at `inDeg` came in by (nearest behind it, within 60°), or -1. */
function arrival(f: NetFork, inDeg: number, take: number): number {
  const back = (inDeg + 180) % 360;
  let arrive = -1, best = Infinity;
  f.br.forEach((b, i) => {
    if (i === take || b.line !== -1) return;
    const off = Math.abs(turn(back, b.deg));
    if (off < best) ((best = off), (arrive = i));
  });
  return best <= JUNCTION.arrive ? arrive : -1;
}

/** The junction for a pass, walked forward or backward (`rev`): the way to go and the names (each branch's word only
 *  when it stands clear too); backward with no way in to tell, null. */
export function junctionAt(net: NetFile, fi: number, pi: number, d: number, rev = false): Junction | null {
  const f = net.forks[fi], s = f.pass[pi];
  // backward: in by the route's way out, out by the way it came in
  let inDeg = s.inDeg, take = s.take;
  if (rev) {
    take = arrival(f, s.inDeg, s.take);
    if (take < 0) return null;
    inDeg = (f.br[s.take].deg + 180) % 360;
  }
  const arrive = arrival(f, inDeg, take);
  const ids = f.br.map((_, i) => i).filter((i) => i !== arrive);
  const clear = (i: number) => ids.every((j) => j === i || Math.abs(turn(f.br[i].deg, f.br[j].deg)) > JUNCTION.apart);
  const br = ids
    .map((i): Branch => {
      const b = f.br[i];
      return { name: b.n ?? (b.line >= 0 ? (net.lines[b.line].n ?? null) : null), dir: clear(i) ? dirOf(turn(inDeg, b.deg)) : null, take: i === take, line: b.line };
    })
    .sort((a, b) => Number(b.take) - Number(a.take));
  return { fork: fi, pass: pi, rev, to: rev ? d - s.at : s.at - d, dir: clear(take) ? dirOf(turn(inDeg, f.br[take].deg)) : null, br };
}

/** A fork with a footpath off it (R12: a road crossing is no junction to ask about). */
const footFork = (net: NetFile, f: NetFork): boolean => f.br.some((b) => b.line >= 0 && (JUNCTION.foot as readonly string[]).includes(net.lines[b.line].h));

/** The next fork on the way walked from distance d along the route (`dir` -1: walking it backward), within 150 m (kept
 *  15 m past it), or null. */
export function nextJunction(net: NetFile, d: number, dir: 1 | -1 = 1): Junction | null {
  let best: { fi: number; pi: number; to: number } | null = null;
  for (const [fi, f] of net.forks.entries()) {
    if (!footFork(net, f)) continue;
    for (const [pi, s] of f.pass.entries()) {
      const to = dir * (s.at - d);
      if (to < -JUNCTION.behind || to > JUNCTION.ahead) continue;
      if (!best || to < best.to) best = { fi, pi, to };
    }
  }
  return best ? junctionAt(net, best.fi, best.pi, d, dir < 0) : null;
}

type LL = [number, number];
const dist = (a: LL, b: LL) => flatM(a[0], a[1], b[0], b[1]);

/** A line's first `len` metres from its end nearer `p` (the fork's other ways, greyed). */
export function headOf(c: LL[], p: LL, len = 80): LL[] {
  const pts = dist(c[0], p) <= dist(c.at(-1)!, p) ? c : [...c].reverse();
  const out: LL[] = [pts[0]];
  let run = 0;
  for (let i = 1; i < pts.length; i++) {
    const s = dist(pts[i - 1], pts[i]);
    if (run + s >= len) {
      const f = (len - run) / s;
      out.push([pts[i - 1][0] + f * (pts[i][0] - pts[i - 1][0]), pts[i - 1][1] + f * (pts[i][1] - pts[i - 1][1])]);
      return out;
    }
    run += s;
    out.push(pts[i]);
  }
  return out;
}
