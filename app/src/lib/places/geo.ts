// 保存した場所's distances (docs/places.md): metres between two points (haversine), a distance as a row says it, and the
// places near a trail's track (the trail map's layer: docs/hiking.md "Saved places"). Pure.

export type LL = [lng: number, lat: number];

const R = 6_371_008.8;
const RAD = Math.PI / 180;

export function distM(a: LL, b: LL): number {
  const dLat = (b[1] - a[1]) * RAD, dLng = (b[0] - a[0]) * RAD;
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(a[1] * RAD) * Math.cos(b[1] * RAD) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
}

/** A fresh phone's first view (保存した場所): every point, or, spread over more than 90° of longitude (a list with places
 *  abroad: the whole world can't be fitted on a phone, MapLibre's fit of it lands at sea), those within `nearM` of the
 *  median point (the list's home). */
export function homeOf(lls: readonly LL[], nearM = 300_000): LL[] {
  if (!lls.length) return [];
  let w = Infinity, e = -Infinity;
  for (const [x] of lls) ((w = Math.min(w, x)), (e = Math.max(e, x)));
  if (e - w <= 90) return [...lls];
  const mid = (k: 0 | 1) => lls.map((p) => p[k]).sort((a, b) => a - b)[lls.length >> 1];
  const m: LL = [mid(0), mid(1)];
  const near = lls.filter((p) => distM(m, p) <= nearM);
  return near.length ? near : [m];
}

/** '350 m', '1.2 km', '12 km'. */
export function fmtDist(m: number): string {
  const tens = Math.round(m / 10) * 10, tenths = Math.round(m / 100) / 10;
  if (tens < 1000) return `${Math.max(10, tens)} m`;
  if (tenths < 10) return `${tenths.toFixed(1)} km`;
  return `${Math.round(m / 1000).toLocaleString('en-US')} km`;
}

/**
 * The points within `maxM` of a track (its [lon, lat] points), nearest first, at most `cap`: a box test first (the
 * track's box grown by maxM), then each survivor's distance to the segments in its grid cell (maxM square; each
 * segment filed under every cell its box grown by a cell touches), on a flat projection about the track's middle
 * latitude (true to a few metres over a day's walk). ~1 ms for 3,400 places and an 8,000-point track.
 */
export function nearTrack<T extends { lat: number; lng: number }>(items: readonly T[], track: readonly (readonly number[])[], maxM = 2000, cap = 40): { it: T; d: number }[] {
  if (!track.length) return [];
  let w = Infinity, e = -Infinity, s = Infinity, n = -Infinity;
  for (const [lon, lat] of track) ((w = Math.min(w, lon)), (e = Math.max(e, lon)), (s = Math.min(s, lat)), (n = Math.max(n, lat)));
  const mLat = R * RAD, mLon = mLat * Math.cos(((s + n) / 2) * RAD);
  const gLat = maxM / mLat, gLon = maxM / mLon;
  const xs = track.map((p) => p[0] * mLon), ys = track.map((p) => p[1] * mLat);
  const cell = (v: number) => Math.floor(v / maxM);
  const at = (cx: number, cy: number) => cx * 1_000_003 + cy;
  const grid = new Map<number, number[]>();
  for (let i = 0; i < xs.length; i++) {
    const j = Math.min(i + 1, xs.length - 1);
    const x0 = cell(Math.min(xs[i], xs[j])) - 1, x1 = cell(Math.max(xs[i], xs[j])) + 1;
    const y0 = cell(Math.min(ys[i], ys[j])) - 1, y1 = cell(Math.max(ys[i], ys[j])) + 1;
    for (let cx = x0; cx <= x1; cx++) for (let cy = y0; cy <= y1; cy++) {
      const k = at(cx, cy), l = grid.get(k);
      if (l) l.push(i);
      else grid.set(k, [i]);
    }
  }
  const out: { it: T; d: number }[] = [];
  const max2 = maxM * maxM;
  for (const it of items) {
    if (it.lat < s - gLat || it.lat > n + gLat || it.lng < w - gLon || it.lng > e + gLon) continue;
    const px = it.lng * mLon, py = it.lat * mLat;
    const segs = grid.get(at(cell(px), cell(py)));
    if (!segs) continue;
    let best = Infinity;
    for (const i of segs) {
      const j = Math.min(i + 1, xs.length - 1);
      const ax = xs[i], ay = ys[i], dx = xs[j] - ax, dy = ys[j] - ay, len = dx * dx + dy * dy;
      const t = len ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len)) : 0;
      const ex = px - (ax + t * dx), ey = py - (ay + t * dy), d2 = ex * ex + ey * ey;
      if (d2 < best) best = d2;
    }
    if (best <= max2) out.push({ it, d: Math.sqrt(best) });
  }
  return out.sort((a, b) => a.d - b.d).slice(0, cap);
}
