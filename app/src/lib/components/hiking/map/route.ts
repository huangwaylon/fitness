// The route's walked part on the map (docs/hiking.md "In-hike map"), pure: one line, its colour stepped at the split
// (MapLibre's line-gradient over `line-progress`), so a fix moves one paint value, never the route's data. MapLibre's
// line-progress is the share of the line's length on the (Web Mercator) map, not along the ground: the split is placed
// by each point's share of the projected length.
import { segAt, type Prepared } from '#lib/hiking/track.ts';

/** Each point's share of the route's projected length (0 … 1). */
export function progressOf(p: Prepared): number[] {
  const y = (lat: number) => Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360)) * (180 / Math.PI);
  const cum = [0];
  for (let i = 1; i < p.pts.length; i++) cum.push(cum[i - 1] + Math.hypot(p.pts[i][0] - p.pts[i - 1][0], y(p.pts[i][1]) - y(p.pts[i - 1][1])));
  const total = cum.at(-1)!;
  return cum.map((c) => (total > 0 ? c / total : 0));
}

/** The share of the projected line walked at `d` metres along the route (null or ≤ 0: none). */
export function splitAt(p: Prepared, prog: number[], d: number | null): number {
  if (d === null || d <= 0) return 0;
  if (d >= p.total) return 1;
  const lo = segAt(p, d);
  const seg = p.d[lo + 1] - p.d[lo];
  return prog[lo] + (seg > 0 ? (d - p.d[lo]) / seg : 0) * (prog[lo + 1] - prog[lo]);
}

/** The line-gradient: `walked` up to the split, `ahead` after it. */
export const stepAt = (split: number, walked: string, ahead: string): unknown[] => (split > 0 ? ['step', ['line-progress'], walked, split, ahead] : ['step', ['line-progress'], ahead, 1, ahead]);
