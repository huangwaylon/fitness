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

/** '350 m', '1.2 km', '12 km'. */
export function fmtDist(m: number): string {
  if (m < 1000) return `${Math.max(10, Math.round(m / 10) * 10)} m`;
  if (m < 10_000) return `${(m / 1000).toFixed(1)} km`;
  return `${Math.round(m / 1000).toLocaleString('en-US')} km`;
}

/**
 * The points within `maxM` of a track (its [lon, lat] points), nearest first, at most `cap`: a box test first (the
 * track's box grown by maxM), then each survivor's distance to the nearest segment on a flat projection about the
 * track's middle latitude (true to a few metres over a day's walk).
 */
export function nearTrack<T extends { lat: number; lng: number }>(items: readonly T[], track: readonly (readonly number[])[], maxM = 2000, cap = 40): { it: T; d: number }[] {
  if (!track.length) return [];
  let w = Infinity, e = -Infinity, s = Infinity, n = -Infinity;
  for (const [lon, lat] of track) ((w = Math.min(w, lon)), (e = Math.max(e, lon)), (s = Math.min(s, lat)), (n = Math.max(n, lat)));
  const mLat = R * RAD, mLon = mLat * Math.cos(((s + n) / 2) * RAD);
  const gLat = maxM / mLat, gLon = maxM / mLon;
  const xs = track.map((p) => p[0] * mLon), ys = track.map((p) => p[1] * mLat);
  const out: { it: T; d: number }[] = [];
  for (const it of items) {
    if (it.lat < s - gLat || it.lat > n + gLat || it.lng < w - gLon || it.lng > e + gLon) continue;
    const px = it.lng * mLon, py = it.lat * mLat;
    let best = Infinity;
    for (let i = 0; i < xs.length; i++) {
      const ax = xs[i], ay = ys[i];
      const bx = xs[i + 1] ?? ax, by = ys[i + 1] ?? ay;
      const dx = bx - ax, dy = by - ay, len = dx * dx + dy * dy;
      const t = len ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len)) : 0;
      const d = Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
      if (d < best) best = d;
    }
    if (best <= maxM) out.push({ it, d: best });
  }
  return out.sort((a, b) => a.d - b.d).slice(0, cap);
}
