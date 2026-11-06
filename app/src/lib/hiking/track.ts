// トレイル's tracks (docs/hiking.md "Data"), pure: a GPX into a track file (scripts/hiking-tracks.ts runs it at build
// time, never the phone), and a track file into what the trail view draws (cumulative distance, the elevation range,
// the profile's paths, a point at a distance along it, the scrub's finger-to-distance mapping).
import type { TrackFile } from './types.ts';

interface Pt { lat: number; lon: number; ele: number }

/** Metres between two points (haversine). */
export function hav(la1: number, lo1: number, la2: number, lo2: number): number {
  const R = 6371000, r = Math.PI / 180;
  const dp = (la2 - la1) * r, dl = (lo2 - lo1) * r;
  const a = Math.sin(dp / 2) ** 2 + Math.cos(la1 * r) * Math.cos(la2 * r) * Math.sin(dl / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const attr = (tag: string, k: string): number => Number(new RegExp(`\\b${k}="([^"]*)"`).exec(tag)?.[1]);
const text = (s: string): string => s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ').trim();

/** A GPX's track points (every <trkpt>, in order, across segments) and waypoints. A point without <ele> is 0 m. */
export function parseGpx(gpx: string): { pts: Pt[]; wpts: { lat: number; lon: number; name: string }[] } {
  const pts: Pt[] = [];
  for (const m of gpx.matchAll(/<trkpt\b([^>]*?)(?:\/>|>([\s\S]*?)<\/trkpt>)/g)) {
    const ele = /<ele>([^<]*)<\/ele>/.exec(m[2] ?? '')?.[1];
    pts.push({ lat: attr(m[1], 'lat'), lon: attr(m[1], 'lon'), ele: ele === undefined ? 0 : Number(ele) });
  }
  const wpts = [...gpx.matchAll(/<wpt\b([^>]*?)>([\s\S]*?)<\/wpt>/g)].map((m) => ({
    lat: attr(m[1], 'lat'), lon: attr(m[1], 'lon'), name: text(/<name>([\s\S]*?)<\/name>/.exec(m[2])?.[1] ?? '')
  }));
  if (pts.some((p) => !Number.isFinite(p.lat) || !Number.isFinite(p.lon) || !Number.isFinite(p.ele))) throw new Error('parseGpx: a track point without a number');
  return { pts, wpts };
}

/** A centred moving average of `w` points (the hiking app's 15: it tames GPS elevation noise), narrower at the ends. */
export function smooth(v: readonly number[], w = 15): number[] {
  const h = w >> 1, out: number[] = [];
  for (let i = 0; i < v.length; i++) {
    const lo = Math.max(0, i - h), hi = Math.min(v.length, i + h + 1);
    let s = 0;
    for (let j = lo; j < hi; j++) s += v[j];
    out.push(s / (hi - lo));
  }
  return out;
}

/** The indices Douglas–Peucker keeps at `tol` metres (on a local flat projection round the first point): always the
 *  first and the last. */
export function simplify(pts: readonly { lat: number; lon: number }[], tol = 5): number[] {
  const n = pts.length;
  if (n <= 2) return pts.map((_, i) => i);
  const r = (Math.PI / 180) * 6371000, k = Math.cos((pts[0].lat * Math.PI) / 180);
  const x = pts.map((p) => p.lon * r * k), y = pts.map((p) => p.lat * r);
  const keep = new Uint8Array(n);
  keep[0] = keep[n - 1] = 1;
  const stack: [number, number][] = [[0, n - 1]];
  while (stack.length) {
    const [a, b] = stack.pop()!;
    const dx = x[b] - x[a], dy = y[b] - y[a], len = Math.hypot(dx, dy);
    let far = -1, at = -1;
    for (let i = a + 1; i < b; i++) {
      const d = len === 0 ? Math.hypot(x[i] - x[a], y[i] - y[a]) : Math.abs(dy * x[i] - dx * y[i] + x[b] * y[a] - y[b] * x[a]) / len;
      if (d > far) ((far = d), (at = i));
    }
    if (far > tol) ((keep[at] = 1), stack.push([a, at], [at, b]));
  }
  const out: number[] = [];
  keep.forEach((v, i) => v && out.push(i));
  return out;
}

const r5 = (v: number) => Math.round(v * 1e5) / 1e5;
const r1 = (v: number) => Math.round(v * 10) / 10;

/** A GPX as a track file: the elevations smoothed over the raw points first, then the line simplified at `tol` m. */
export function toTrack(gpx: string, tol = 5): TrackFile {
  const { pts, wpts } = parseGpx(gpx);
  if (pts.length < 2) throw new Error('toTrack: fewer than two track points');
  const se = smooth(pts.map((p) => p.ele));
  let len = 0;
  for (let i = 1; i < pts.length; i++) len += hav(pts[i - 1].lat, pts[i - 1].lon, pts[i].lat, pts[i].lon);
  return {
    v: 1,
    len: Math.round(len),
    pts: simplify(pts, tol).map((i) => [r5(pts[i].lon), r5(pts[i].lat), r1(se[i])]),
    wpts: wpts.map((w) => ({ lon: r5(w.lon), lat: r5(w.lat), name: w.name }))
  };
}

/** A track ready to draw: each point's distance along it (m: the simplified line's stretched to the raw track's length,
 *  so a distance reads as the original's), the total, the elevation range, the waypoints placed at their nearest
 *  point's distance. */
export interface Prepared {
  pts: TrackFile['pts'];
  d: number[];
  total: number;
  lo: number;
  hi: number;
  wpts: (TrackFile['wpts'][number] & { d: number })[];
  /** The ends meet (a loop, or out and back): no end marker. */
  closed: boolean;
}

export function prepare(t: TrackFile): Prepared {
  const d = [0];
  let lo = Infinity, hi = -Infinity;
  t.pts.forEach(([lon, lat, ele], i) => {
    if (i) d.push(d[i - 1] + hav(t.pts[i - 1][1], t.pts[i - 1][0], lat, lon));
    lo = Math.min(lo, ele);
    hi = Math.max(hi, ele);
  });
  const k = t.len > 0 && d.at(-1)! > 0 ? t.len / d.at(-1)! : 1;
  for (let i = 0; i < d.length; i++) d[i] *= k;
  const wpts = t.wpts.map((w) => {
    let best = Infinity, at = 0;
    t.pts.forEach(([lon, lat], i) => {
      const m = hav(w.lat, w.lon, lat, lon);
      if (m < best) ((best = m), (at = d[i]));
    });
    return { ...w, d: at };
  });
  const [a, b] = [t.pts[0], t.pts.at(-1)!];
  return { pts: t.pts, d, total: d.at(-1)!, lo, hi, wpts, closed: hav(a[1], a[0], b[1], b[0]) < 120 };
}

/** The point `D` metres along (clamped), between its two bracketing points. */
export function pointAt(p: Prepared, D: number): { lon: number; lat: number; ele: number; d: number } {
  const x = Math.max(0, Math.min(p.total, D));
  let lo = 0, hi = p.d.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (p.d[mid] <= x) lo = mid;
    else hi = mid - 1;
  }
  const a = p.pts[lo], b = p.pts[Math.min(lo + 1, p.pts.length - 1)];
  const seg = p.d[Math.min(lo + 1, p.d.length - 1)] - p.d[lo];
  const f = seg > 1e-9 ? (x - p.d[lo]) / seg : 0;
  return { lon: a[0] + f * (b[0] - a[0]), lat: a[1] + f * (b[1] - a[1]), ele: a[2] + f * (b[2] - a[2]), d: x };
}

/** The scrub: a finger's x over the chart (its box's left and width) as a distance along the track. */
export const scrubDistance = (clientX: number, left: number, width: number, total: number): number => (width > 0 ? Math.max(0, Math.min(1, (clientX - left) / width)) * total : 0);

/** The elevation chart's geometry: its viewBox height and the px kept free under and over the plotted band. */
export const PROF = { h: 96, padB: 14, padT: 12 } as const;

/** An elevation's y in the chart. */
export const profileY = (p: Prepared, ele: number): number => PROF.h - PROF.padB - ((ele - p.lo) / (p.hi - p.lo || 1)) * (PROF.h - PROF.padB - PROF.padT);

/** The chart's area (closed to the bottom) and line paths at width `w`, on at most ~500 points. */
export function profilePaths(p: Prepared, w: number): { area: string; line: string } {
  const step = Math.max(1, Math.floor(p.pts.length / 500));
  const xy: string[] = [];
  p.pts.forEach((q, i) => {
    if (i % step === 0 || i === p.pts.length - 1) xy.push(`${((p.d[i] / p.total) * w).toFixed(1)},${profileY(p, q[2]).toFixed(1)}`);
  });
  return { area: `M0,${PROF.h} L${xy.join(' L')} L${w},${PROF.h}Z`, line: `M${xy.join(' L')}` };
}
