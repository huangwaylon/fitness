// The junction card and the fork highlight (docs/hiking.md "In-hike map"), pure: from a trail's net file (lib/hiking/
// net.ts, OSM) and where along the route the phone is, the next fork ahead (spec R12: only within 150 m, only where a
// branch off it is a footpath: path, track, steps, footway), which way the route goes there, and its branches' names.
// The direction is the ROUTE's (R1): the route's bearing into the fork against each branch's bearing out of it (both
// from the file, measured 20–30 m along), never the compass; a word (右 / 左 / まっすぐ) only when the route's branch
// stands more than 45° from every other way out, else the names alone and the map's highlighted branch.
import type { NetFile, NetFork } from '#lib/hiking/net.ts';
import { turn } from './compass.ts';

const JUNCTION = { ahead: 150, behind: 15, apart: 45, straight: 30, foot: ['path', 'track', 'steps', 'footway'] } as const;

export type Dir = 'right' | 'left' | 'straight';
interface Branch { name: string | null; dir: Dir | null; take: boolean; line: number }
export interface Junction {
  fork: number;
  /** Metres to it along the route (negative just past it). */
  to: number;
  /** The route's way (a word only when it stands clear of the others). */
  dir: Dir | null;
  /** The ways out (the arrival's way left off), the route's first. */
  br: Branch[];
}

export const dirOf = (rel: number): Dir => (Math.abs(rel) <= JUNCTION.straight ? 'straight' : rel > 0 ? 'right' : 'left');

/** The ways out of a fork for a pass arriving at `inDeg`: every branch but the one the route arrives on. */
function outs(f: NetFork, inDeg: number, take: number): number[] {
  const back = (inDeg + 180) % 360;
  let arrive = -1, best = Infinity;
  f.br.forEach((b, i) => {
    if (i === take || b.line !== -1) return;
    const off = Math.abs(turn(back, b.deg));
    if (off < best) ((best = off), (arrive = i));
  });
  return f.br.map((_, i) => i).filter((i) => i !== arrive || best > 60);
}

/** The junction for a pass: the route's way and the names (each branch's word only when it stands clear too). */
export function junctionAt(net: NetFile, fi: number, pi: number, d: number): Junction {
  const f = net.forks[fi], s = f.pass[pi];
  const ids = outs(f, s.inDeg, s.take);
  const clear = (i: number) => ids.every((j) => j === i || Math.abs(turn(f.br[i].deg, f.br[j].deg)) > JUNCTION.apart);
  const br = ids
    .map((i): Branch => {
      const b = f.br[i];
      return { name: b.n ?? (b.line >= 0 ? (net.lines[b.line].n ?? null) : null), dir: clear(i) ? dirOf(turn(s.inDeg, b.deg)) : null, take: i === s.take, line: b.line };
    })
    .sort((a, b) => Number(b.take) - Number(a.take));
  return { fork: fi, to: s.at - d, dir: clear(s.take) ? dirOf(turn(s.inDeg, f.br[s.take].deg)) : null, br };
}

/** A fork with a footpath off it (R12: a road crossing is no junction to ask about). */
const footFork = (net: NetFile, f: NetFork): boolean => f.br.some((b) => b.line >= 0 && (JUNCTION.foot as readonly string[]).includes(net.lines[b.line].h));

/** The next fork ahead of distance d along the route (within 150 m; kept 15 m past it), or null. */
export function nextJunction(net: NetFile, d: number): Junction | null {
  let best: { fi: number; pi: number; at: number } | null = null;
  for (const [fi, f] of net.forks.entries()) {
    if (!footFork(net, f)) continue;
    for (const [pi, s] of f.pass.entries()) {
      if (s.at - d < -JUNCTION.behind || s.at - d > JUNCTION.ahead) continue;
      if (!best || s.at < best.at) best = { fi, pi, at: s.at };
    }
  }
  return best ? junctionAt(net, best.fi, best.pi, d) : null;
}

type LL = [number, number];
const M = 111_320;
const dist = (a: LL, b: LL) => Math.hypot((b[0] - a[0]) * M * Math.cos((a[1] * Math.PI) / 180), (b[1] - a[1]) * M);

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
