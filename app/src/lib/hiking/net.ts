// トレイル's reference trails (docs/hiking.md "Reference trails"): OpenStreetMap's paths around a Japan trail, one file a
// trail, static/hiking/net/<slug>.json (scripts/hiking-net.ts; ODbL, static/hiking/net/LICENSE). Not precached: fetched
// as the trail's map opens (load.ts loadNet), kept by the worker once seen (caches.ts isGuidePhoto) and in a trail's
// offline save (offline/plan.ts planTrail). Pure (the script builds with it): parseNet takes nothing it doesn't expect,
// anything off is null (the map draws no layer).
import type { TrackFile } from './types.ts';

/** [lon, lat], 5 decimals. */
export type LonLat = [number, number];

/** One reference line: an OSM way's piece off the route (or crossing it). */
export interface NetLine {
  c: LonLat[];
  /** The way's name. */
  n?: string;
  /** OSM highway=* (path, track, steps, footway, bridleway; a road near the track: unclassified, service, …). */
  h: string;
  /** OSM sac_scale. */
  sac?: string;
}

/** One way out of a fork. */
export interface NetBranch {
  /** Its bearing out of the fork (°, 0 north, clockwise; `north` says which north), 20–30 m along it. */
  deg: number;
  /** Its label: the way's name, else the next named peak, hut or guidepost along it (a guidepost's destination). */
  n?: string;
  /** Its line in `lines`, or -1: the route itself. */
  line: number;
}

/** One time the route passes a fork (an out-and-back passes it twice). */
export interface NetPass {
  /** The route's distance at the fork (m, the trail view's: track.ts prepare). */
  at: number;
  /** The route's bearing into the fork (°). */
  inDeg: number;
  /** The branch it leaves by (an index in `br`). */
  take: number;
}

export interface NetFork {
  p: LonLat;
  pass: NetPass[];
  br: NetBranch[];
}

export type PoiKind = 'peak' | 'hut' | 'post' | 'saddle' | 'shelter';
export interface NetPoi {
  p: LonLat;
  k: PoiKind;
  n?: string;
}

export interface NetFile {
  v: 1;
  src: 'osm';
  /** The day OSM's data was read (YYYY-MM-DD). */
  at: string;
  /** trackHash of the track it was built from: another track (the trail rebuilt since), the forks are stale. */
  trk: string;
  /** Bearings are from true north. */
  north: 'true';
  lines: NetLine[];
  forks: NetFork[];
  /** Not drawn yet. */
  pois?: NetPoi[];
}

/** A track's points as the net file names them: FNV-1a (32 bits, hex) over its lon,lat at 5 decimals. */
export function trackHash(pts: TrackFile['pts'] | readonly (readonly number[])[]): string {
  let h = 0x811c9dc5;
  const s = pts.map((p) => `${p[0].toFixed(5)},${p[1].toFixed(5)}`).join(';');
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 0x01000193);
  return (h >>> 0).toString(16).padStart(8, '0');
}

/** The forks are for this track (lines are drawn either way). */
export const forksFresh = (net: NetFile, pts: TrackFile['pts']): boolean => net.trk === trackHash(pts);

// ── the parse ──
const obj = (x: unknown): x is Record<string, unknown> => !!x && typeof x === 'object' && !Array.isArray(x);
const num = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x);
const optStr = (x: unknown): boolean => x === undefined || typeof x === 'string';
const lonLat = (x: unknown): x is LonLat => Array.isArray(x) && x.length === 2 && num(x[0]) && num(x[1]) && Math.abs(x[0]) <= 180 && Math.abs(x[1]) <= 90;
const deg = (x: unknown): x is number => num(x) && x >= 0 && x < 360;
const KINDS = new Set<unknown>(['peak', 'hut', 'post', 'saddle', 'shelter']);

const isLine = (x: unknown): x is NetLine =>
  obj(x) && Array.isArray(x.c) && x.c.length >= 2 && x.c.every(lonLat) && typeof x.h === 'string' && optStr(x.n) && optStr(x.sac);
const isFork = (x: unknown, lines: number): x is NetFork =>
  obj(x) && lonLat(x.p) && Array.isArray(x.br) && x.br.length >= 3 && Array.isArray(x.pass) && x.pass.length >= 1 &&
  x.br.every((b) => obj(b) && deg(b.deg) && optStr(b.n) && Number.isInteger(b.line) && (b.line as number) >= -1 && (b.line as number) < lines) &&
  x.pass.every((s) => obj(s) && num(s.at) && s.at >= 0 && deg(s.inDeg) && Number.isInteger(s.take) && (s.take as number) >= 0 && (s.take as number) < (x.br as unknown[]).length);
const isPoi = (x: unknown): x is NetPoi => obj(x) && lonLat(x.p) && KINDS.has(x.k) && optStr(x.n);

/** A net file as the schema says, else null. */
export function parseNet(x: unknown): NetFile | null {
  if (!obj(x) || x.v !== 1 || x.src !== 'osm' || x.north !== 'true') return null;
  if (typeof x.at !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(x.at) || typeof x.trk !== 'string' || !/^[0-9a-f]{8}$/.test(x.trk)) return null;
  if (!Array.isArray(x.lines) || !x.lines.every(isLine)) return null;
  const n = x.lines.length;
  if (!Array.isArray(x.forks) || !x.forks.every((f) => isFork(f, n))) return null;
  if (x.pois !== undefined && !(Array.isArray(x.pois) && x.pois.every(isPoi))) return null;
  return x as unknown as NetFile;
}

/** The file's path under static/ (the offline save stores it: offline/plan.ts). */
export const netPath = (slug: string): string => `hiking/net/${slug}.json`;
