// A walk's corners as the relay carries them (the island's `walk`, the rooms' `tent`: ≤ VIA_MAX waypoints, the message ≤
// MAX_BYTES): the other phone walks straight from corner to corner, so a corner dropped must leave a straight line it
// may walk. A way within the limit goes as it is. Over it, given `clear` (a straight walk's check: the island's
// layout/nav.ts clear), corners the line past is clear around go first; still over, it loses the corner whose loss is
// a clear line and moves it least, and only when none is clear the one that moves it least (it cuts as little as it
// can). Pure.
import { VIA_MAX, type Pt } from '#lib/contract/live-protocol.ts';

const round = (p: Pt): Pt => [Math.round(p[0]), Math.round(p[1])];

/** How far `p` is off the segment a–b. */
function off(p: Pt, a: Pt, b: Pt): number {
  const dx = b[0] - a[0], dz = b[1] - a[1], l2 = dx * dx + dz * dz;
  const t = l2 ? Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dz) / l2)) : 0;
  return Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dz));
}

/** The way from `from` through `pts` (its end the last), rounded, at most `max` waypoints before the end (the end
 *  always kept), every straight line between them `clear` where the way's own allow it. */
export function thinWay(from: Pt, pts: readonly Pt[], clear?: (a: Pt, b: Pt) => boolean, max = VIA_MAX): Pt[] {
  const a0 = round(from);
  let way = pts.map(round);
  if (way.length <= max + 1) return way;
  if (clear) {
    // pulled straight: from each corner, the farthest one still in a clear line
    const out: Pt[] = [];
    let at = a0;
    for (let i = 0; i < way.length; ) {
      let far = i;
      for (let k = way.length - 1; k > i; k--)
        if (clear(at, way[k])) {
          far = k;
          break;
        }
      out.push((at = way[far]));
      i = far + 1;
    }
    way = out;
  }
  while (way.length > max + 1) {
    let best = 0, cost = Infinity;
    for (let i = 0; i < way.length - 1; i++) {
      const a = i ? way[i - 1] : a0, b = way[i + 1];
      const c = off(way[i], a, b) + (clear && !clear(a, b) ? 1e9 : 0);
      if (c < cost) [best, cost] = [i, c];
    }
    way = [...way.slice(0, best), ...way.slice(best + 1)];
  }
  return way;
}
