// A hike's track (docs/hiking.md "Data"): a line of points into a track file, shared by the build's script
// (scripts/hiking-tracks.ts: the baked trails), the relay's YAMAP import (relay/src/hikeRoute.ts) and the phone's GPX
// import (a user-registered hike's `hike_trk`, contract/hike.ts): the only converter (lib/hiking/track.ts's, which it
// replaced, is gone). The elevation smoothed over the raw points (a 15-point centred mean: GPS noise), then the
// line simplified (Douglas–Peucker, 5 m), coordinates to 5 decimals, elevations to 1. Pure and dependency-free.

/** A track file: the baked trails' (static/hiking/tracks/<slug>.json) and a `hike_trk`'s body. */
export interface TrackFile {
  v: 1;
  /** The raw track's length (m): the simplified line is a little shorter (the trail view stretches to it). */
  len: number;
  /** [lon, lat, ele (m, smoothed)], 5 and 1 decimals. */
  pts: [number, number, number][];
  /** The waypoints (the summits). */
  wpts: { lon: number; lat: number; name: string }[];
}

/** A raw track point (a GPX's, YAMAP's). */
export interface TrackPt { lat: number; lon: number; ele: number }
/** A raw waypoint. */
export interface TrackWpt { lat: number; lon: number; name: string }

/** A `hike_trk`'s data at most, as JSON (its own cap, as a `wnote`'s: every other event's is the record's 20,000). */
export const HIKE_TRK_CHARS = 60_000;
/** The tolerances fitTrack tries (m), in order. */
const FIT_TOLS = [5, 10, 20] as const;
/** Room left in HIKE_TRK_CHARS for the event's own keys (`id`). */
const FIT_ROOM = 64;

/** Metres between two points (haversine). */
function hav(la1: number, lo1: number, la2: number, lo2: number): number {
  const R = 6371000, r = Math.PI / 180;
  const dp = (la2 - la1) * r, dl = (lo2 - lo1) * r;
  const a = Math.sin(dp / 2) ** 2 + Math.cos(la1 * r) * Math.cos(la2 * r) * Math.sin(dl / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const attr = (tag: string, k: string): number => Number(new RegExp(`\\b${k}="([^"]*)"`).exec(tag)?.[1]);
const text = (s: string): string => s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ').trim();

/** A GPX's track points (every <trkpt>, in order, across segments) and waypoints. A point without <ele> is 0 m; one
 *  without a number throws. */
export function parseGpx(gpx: string): { pts: TrackPt[]; wpts: TrackWpt[] } {
  const pts: TrackPt[] = [];
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

/** A centred moving average of `w` points (15: it tames GPS elevation noise), narrower at the ends. */
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

/** Raw points and waypoints as a track file: the elevations smoothed over the raw points first, then the line
 *  simplified at `tol` m. Throws on fewer than two points. */
export function trackOf(pts: readonly TrackPt[], wpts: readonly TrackWpt[], tol = 5): TrackFile {
  if (pts.length < 2) throw new Error('trackOf: fewer than two track points');
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

/** A GPX as a track file (trackOf). */
export const toTrack = (gpx: string, tol = 5): TrackFile => {
  const { pts, wpts } = parseGpx(gpx);
  return trackOf(pts, wpts, tol);
};

/** The track file a `hike_trk` carries: trackOf at 5 m, else 10, else 20, the first whose JSON fits HIKE_TRK_CHARS
 *  with the event's id; null when none does (or fewer than two points). */
export function fitTrack(pts: readonly TrackPt[], wpts: readonly TrackWpt[]): TrackFile | null {
  if (pts.length < 2) return null;
  for (const tol of FIT_TOLS) {
    const t = trackOf(pts, wpts, tol);
    if (JSON.stringify(t).length <= HIKE_TRK_CHARS - FIT_ROOM) return t;
  }
  return null;
}
