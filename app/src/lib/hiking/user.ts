// A registered hike as a trail (docs/hiking.md "Data" › Registered hikes): the record's hike (contract/hike.ts HikeView)
// and its track, if it has one, in the guide's Trail shape, so the list and the view draw it beside the fourteen. The
// figures are the hike's own; one it lacks comes from the track (length, gain), the level from the distance and the
// climb. Pure.
import type { HikeDiff, HikeView } from '#lib/contract/hike.ts';
import type { TrackFile } from '#lib/contract/hikeTrack.ts';
import { hav } from './track.ts';
import type { Region, Route, Trail } from './types.ts';

/** A registered hike's slug: `u-<its id>` (the guide's slugs never start so). */
export const userSlug = (id: string): string => `u-${id}`;
/** The hike's id in a slug, or null: one of the guide's. */
export const userIdOf = (slug: string | null | undefined): string | null => (slug?.startsWith('u-') ? slug.slice(2) : null);

/** Where a hike with no track is drawn from: Tokyo. */
const TOKYO = { lat: 35.681, lon: 139.767 };
/** Japan's bounding box (GSI's tiles); elsewhere the USGS map. */
const inJapan = (lat: number, lon: number): boolean => lat >= 20 && lat <= 46 && lon >= 122 && lon <= 154;

/** 'h:mm' → the guide's '3 h 17 min' (fmtTime shows it); none, ''. */
export function guideTime(hmm: string | undefined): string {
  const m = hmm ? /^(\d{1,2}):([0-5]\d)$/.exec(hmm) : null;
  if (!m) return '';
  const h = +m[1], min = +m[2];
  return [h ? `${h} h` : '', min ? `${min} min` : ''].filter(Boolean).join(' ') || '0 min';
}

/** The climb along a track (m): its rises summed (the elevations are already smoothed). */
export function gainOf(t: TrackFile): number {
  let up = 0;
  for (let i = 1; i < t.pts.length; i++) up += Math.max(0, t.pts[i][2] - t.pts[i - 1][2]);
  return Math.round(up);
}

/** A level from the distance and the climb (effort kilometres: a km, plus one per 100 m up), on YAMAP's four. */
export function diffOf(km: number, gainM: number): HikeDiff {
  const e = km + gainM / 100;
  return e < 10 ? 'easy' : e < 20 ? 'moderate' : e < 30 ? 'hard' : 'veryhard';
}

/** The track's shape: the ends apart is one way (縦走); together, out and back when its quarter and three-quarter
 *  points meet (it walks back on itself), else a loop. */
export function routeOf(t: TrackFile): Route {
  const p = t.pts, a = p[0], b = p.at(-1)!;
  if (hav(a[1], a[0], b[1], b[0]) >= 120) return 'p2p';
  const q = p[Math.floor(p.length / 4)], r = p[Math.floor((p.length * 3) / 4)];
  return hav(q[1], q[0], r[1], r[0]) < 150 ? 'out' : 'loop';
}

const centreOf = (t: TrackFile): { lat: number; lon: number } => {
  let lat = 0, lon = 0;
  for (const p of t.pts) ((lon += p[0]), (lat += p[1]));
  return { lat: lat / t.pts.length, lon: lon / t.pts.length };
};

const both = (s: string) => ({ ja: s, en: s });
const NONE = both('');

/** A registered hike as the guide's Trail (its slug `u-<id>`; `user` holds its own). */
export function hikeTrail(v: HikeView, track: TrackFile | null): Trail {
  const lengthKm = v.km ?? (track ? Math.round(track.len / 100) / 10 : 0);
  const gainM = v.gainM ?? (track ? gainOf(track) : 0);
  const center = track ? centreOf(track) : TOKYO;
  const tiles: Region = inJapan(center.lat, center.lon) ? 'jp' : 'us';
  return {
    slug: userSlug(v.id),
    name: both(v.name),
    area: both(v.area),
    lengthKm,
    gainM,
    diff: v.diff ?? diffOf(lengthKm, gainM),
    route: track ? routeOf(track) : 'out',
    time: guideTime(v.time),
    season: '',
    dogs: 'leashed',
    permit: NONE,
    center,
    summary: NONE,
    description: NONE,
    tips: [],
    tiles,
    user: {
      id: v.id, status: v.status, src: v.src, who: v.who, track: !!track,
      ...(v.date ? { date: v.date } : {}), ...(v.notes ? { notes: v.notes } : {}), ...(v.downM !== undefined ? { downM: v.downM } : {})
    }
  };
}
