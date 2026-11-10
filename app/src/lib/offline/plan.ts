// Saving a map area ahead (offline phase B, docs/backend.md "Service worker" › Offline): which tiles an area takes and
// about how many MB. Pure: the tests (and scripts/offline-measure.ts, at the `probes` git tag) run it without a map.
//
// A trip (OpenFreeMap's vector tiles): z5–9 over its whole box, z10–12 within 3 km of its legs and places, z13–14 within
// 1 km of its places. A trail (USGS or GSI raster): z12–13 within 3 km of its track, z14–16 within 1 km. The zooms are
// the tiles' own (a 256 px raster tile at z shows at the map's z − 1).

export type Source = 'ofm' | 'usgs' | 'gsi';
/** [lon, lat] */
export type LonLat = readonly [number, number];

/** One ring of a plan: the zooms, and the lines (or points) within `km` of which a tile is taken (`km` null: the
 *  whole box). */
interface Ring {
  zooms: readonly number[];
  km: number | null;
  lines: readonly (readonly LonLat[])[];
}

export interface Plan {
  /** `trip-<id>` or `trail-<slug>`: its cache is `island-offline-<id>`. */
  id: string;
  source: Source;
  /** 'z/x/y', each once, by zoom then x then y. */
  tiles: string[];
  /** Tiles per zoom. */
  byZoom: Record<number, number>;
  /** The estimate: MEAN_BYTES a tile, by the area's DENSITY. */
  bytes: number;
}

/**
 * Mean bytes a tile, per source and zoom, over every planned area's tiles as stored (scripts/offline-measure.ts --full at
 * the `probes` tag, 2026-11-07: each tile once, OpenFreeMap's .pbf as fetch decodes it). A zoom not listed: its nearest one.
 */
const MEAN_BYTES: Record<Source, Record<number, number>> = {
  ofm: { 5: 133_878, 6: 41_760, 7: 44_364, 8: 34_063, 9: 27_408, 10: 45_755, 11: 31_281, 12: 25_738, 13: 30_470, 14: 55_958 },
  usgs: { 12: 29_412, 13: 28_218, 14: 23_670, 15: 21_097, 16: 14_334 },
  gsi: { 12: 76_890, 13: 63_930, 14: 69_493, 15: 43_028, 16: 16_058 }
};
/** An area's measured bytes over its mean-based estimate (the same run): a city's vector tiles weigh several times a
 *  coast's at z14 (NZ's 145 KB, Okinawa's 24 KB), more than one table of means can tell. A plan that changes keeps its
 *  area's factor; an area not measured is 1. */
const DENSITY: Record<string, number> = { 'trip-nz': 1.399, 'trip-okinawa': 0.566 };

/** A trail's deepest saved zoom (GSI's map goes to 18; saved to here, the user's 2026-11-07). */
export const SAVED_MAX_Z = 16;

/** OpenFreeMap's asks (its terms): an area at most this many tiles and bytes. */
export const OFM_MAX_TILES = 3000;
export const OFM_MAX_BYTES = 50_000_000;
/** All saved areas together (the user, 2026-11-07). */
export const TOTAL_CAP_BYTES = 150_000_000;

const R = 6_371_008.8;
const rad = (d: number) => (d * Math.PI) / 180;
const n2 = (z: number) => 2 ** z;
export const tileX = (lon: number, z: number) => Math.min(n2(z) - 1, Math.max(0, Math.floor(((lon + 180) / 360) * n2(z))));
export const tileY = (lat: number, z: number) => {
  const l = rad(Math.max(-85.0511, Math.min(85.0511, lat)));
  return Math.min(n2(z) - 1, Math.max(0, Math.floor(((1 - Math.log(Math.tan(l) + 1 / Math.cos(l)) / Math.PI) / 2) * n2(z))));
};
const lonOf = (x: number, z: number) => (x / n2(z)) * 360 - 180;
const latOf = (y: number, z: number) => (Math.atan(Math.sinh(Math.PI * (1 - (2 * y) / n2(z)))) * 180) / Math.PI;

/** Metres between two points (equirectangular: the distances here are a few km). */
function metres(a: LonLat, b: LonLat): number {
  const k = Math.cos(rad((a[1] + b[1]) / 2));
  return R * Math.hypot(rad(b[0] - a[0]) * k, rad(b[1] - a[1]));
}

/** The points along a line, at most `step` m apart (a lone point: itself). */
function along(line: readonly LonLat[], step: number): LonLat[] {
  const out: LonLat[] = line.length ? [line[0]] : [];
  for (let i = 1; i < line.length; i++) {
    const a = line[i - 1], b = line[i];
    const n = Math.ceil(metres(a, b) / step);
    for (let k = 1; k <= n; k++) out.push([a[0] + ((b[0] - a[0]) * k) / n, a[1] + ((b[1] - a[1]) * k) / n]);
  }
  return out;
}

/** The tiles at `z` within `m` metres of `p` (the tile's nearest point to it). */
function near(p: LonLat, m: number, z: number, into: Set<string>): void {
  const dLat = (m / R) * (180 / Math.PI), dLon = dLat / Math.max(0.01, Math.cos(rad(p[1])));
  const x0 = tileX(p[0] - dLon, z), x1 = tileX(p[0] + dLon, z), y0 = tileY(p[1] + dLat, z), y1 = tileY(p[1] - dLat, z);
  for (let x = x0; x <= x1; x++) {
    for (let y = y0; y <= y1; y++) {
      const w = lonOf(x, z), e = lonOf(x + 1, z), n = latOf(y, z), s = latOf(y + 1, z);
      const q: LonLat = [Math.min(e, Math.max(w, p[0])), Math.min(n, Math.max(s, p[1]))];
      if (metres(p, q) <= m) into.add(`${z}/${x}/${y}`);
    }
  }
}

/** Every tile at `z` over the box [w, s, e, n]. */
function box(b: readonly [number, number, number, number], z: number, into: Set<string>): void {
  for (let x = tileX(b[0], z); x <= tileX(b[2], z); x++) for (let y = tileY(b[3], z); y <= tileY(b[1], z); y++) into.add(`${z}/${x}/${y}`);
}

const meanBytes = (source: Source, z: number): number => {
  const t = MEAN_BYTES[source];
  const zs = Object.keys(t).map(Number);
  const best = zs.reduce((a, b) => (Math.abs(b - z) < Math.abs(a - z) ? b : a), zs[0]);
  return t[best];
};

function build(id: string, source: Source, rings: readonly Ring[], bbox?: readonly [number, number, number, number]): Plan {
  const set = new Set<string>();
  for (const r of rings) {
    for (const z of r.zooms) {
      if (r.km === null) {
        if (bbox) box(bbox, z, set);
        continue;
      }
      const m = r.km * 1000;
      for (const line of r.lines) for (const p of along(line, m / 8)) near(p, m, z, set);
    }
  }
  const parse = (k: string) => k.split('/').map(Number);
  const tiles = [...set].sort((a, b) => {
    const [za, xa, ya] = parse(a), [zb, xb, yb] = parse(b);
    return za - zb || xa - xb || ya - yb;
  });
  const byZoom: Record<number, number> = {};
  let bytes = 0;
  for (const k of tiles) {
    const z = Number(k.slice(0, k.indexOf('/')));
    byZoom[z] = (byZoom[z] ?? 0) + 1;
    bytes += meanBytes(source, z);
  }
  return { id, source, tiles, byZoom, bytes: Math.round(bytes * (DENSITY[id] ?? 1)) };
}

/** A trip's area (OpenFreeMap): its box, its legs' lines and its places (stops and candidates). */
export function planTrip(trip: { id: string; bbox: readonly [number, number, number, number]; places: readonly { lon: number; lat: number }[]; legs: readonly { line: readonly LonLat[] }[] }): Plan {
  const places = trip.places.map((p): LonLat[] => [[p.lon, p.lat]]);
  return build(`trip-${trip.id}`, 'ofm', [
    { zooms: [5, 6, 7, 8, 9], km: null, lines: [] },
    { zooms: [10, 11, 12], km: 3, lines: [...trip.legs.map((l) => l.line), ...places] },
    { zooms: [13, 14], km: 1, lines: places }
  ], trip.bbox);
}

/** A trail's area (its region's topo): within 3 km of the track at z12–13, 1 km at z14–16 (GSI's stop there too,
 *  though its map goes to 18). */
export function planTrail(slug: string, region: 'us' | 'jp', pts: readonly (readonly number[])[]): Plan {
  const line = pts.map((p): LonLat => [p[0], p[1]]);
  return build(`trail-${slug}`, region === 'us' ? 'usgs' : 'gsi', [
    { zooms: [12, 13], km: 3, lines: [line] },
    { zooms: [14, 15, SAVED_MAX_Z], km: 1, lines: [line] }
  ]);
}

/** Why a plan can't be saved: over OpenFreeMap's per-area asks (the trips' only). */
export const overCaps = (p: Plan): 'tiles' | 'bytes' | null =>
  p.source !== 'ofm' ? null : p.tiles.length > OFM_MAX_TILES ? 'tiles' : p.bytes > OFM_MAX_BYTES ? 'bytes' : null;

/** MB for the button (one decimal: 16.8). */
export const mb = (bytes: number): string => (bytes / 1e6).toFixed(1);
