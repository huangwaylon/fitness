// A YAMAP link as a user-registered hike (docs/hiking.md, contract/hike.ts): the link read (yamapLink), the public API's
// URLs for it (yamapUrls) and its two JSON answers as the hike's fields and its raw track (yamapImport). The relay
// fetches (relay/src/hikeRoute.ts: YAMAP sends no CORS for our origin); this is pure and dependency-free.
// - An activity (yamap.com/activities/<id>, 活動日記): api.yamap.com/v3/activities/<id> (title, start, distance, のぼり
//   and くだり, its time, コース定数, checkpoints, the map's prefectures) and …/tracks (each point's coord and its
//   DEM-corrected altitude). A model course (yamap.com/model-courses/<id>): /v3/model_courses/<id> and …/tracks, alike.
// - Only the fields below are read: an activity also carries its members (names, gender, birth year), its photos and
//   text, never taken, logged or passed on.
import { cleanLine } from './text.ts';
import { isRec } from './guards.ts';
import type { TrackPt, TrackWpt } from './hikeTrack.ts';
import type { HikeDiff } from './hike.ts';

type Rec = Record<string, unknown>;

export interface YamapLink { kind: 'activity' | 'model'; id: string }

const HOSTS = ['yamap.com', 'www.yamap.com'];
const PATH = /^\/(activities|model-courses)\/([1-9][0-9]{0,11})\/?$/;

/** The YAMAP activity or model course a pasted link names (the first https URL in the text: a share sheet's text
 *  carries words around it), or null: https only, yamap.com or www.yamap.com exactly, no user, password or port. */
export function yamapLink(text: string): YamapLink | null {
  const raw = /https:\/\/[^\s<>"']+/.exec(typeof text === 'string' ? text : '')?.[0];
  if (!raw) return null;
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return null;
  }
  if (u.protocol !== 'https:' || !HOSTS.includes(u.hostname) || u.port || u.username || u.password) return null;
  const m = PATH.exec(u.pathname);
  return m ? { kind: m[1] === 'activities' ? 'activity' : 'model', id: m[2] } : null;
}

/** The API's two URLs for a link: its metadata and its track. */
export function yamapUrls(l: YamapLink): { meta: string; track: string } {
  const base = `https://api.yamap.com/v3/${l.kind === 'activity' ? 'activities' : 'model_courses'}/${l.id}`;
  return { meta: base, track: `${base}/tracks` };
}

/** How hard a course is, from YAMAP's コース定数 (its guide: ≤ 10 easy, 11–20 for most hikers, 21–30 hard, more very hard). */
const diffOf = (c: number): HikeDiff => (c <= 10 ? 'easy' : c <= 20 ? 'moderate' : c <= 30 ? 'hard' : 'veryhard');

/** A link's hike, as the phone previews it before it saves the `hike` (contract/hike.ts): an activity walked (`done`,
 *  its day in its own zone), a model course one to do (`want`). `ref`: `a<id>` or `m<id>` (the duplicate check). */
export interface YamapMeta {
  name: string;
  area: string;
  status: 'done' | 'want';
  date?: string;
  src: 'yamap';
  ref: string;
  km?: number;
  gainM?: number;
  downM?: number;
  /** 'h:mm': an activity's own time (rests included), a model course's standard time. */
  time?: string;
  diff?: HikeDiff;
}

const num = (v: unknown): number | undefined => (typeof v === 'number' && Number.isFinite(v) ? v : undefined);
const NAME = 60;

/** Seconds as 'h:mm' (under 100 h), or undefined. */
function hmm(s: number | undefined): string | undefined {
  if (s === undefined || s <= 0 || s >= 360_000) return undefined;
  const m = Math.round(s / 60);
  return `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`;
}

/** The prefectures' names (`full_name`: 群馬県), joined. */
function prefs(v: unknown): string {
  const names = (Array.isArray(v) ? v : []).map((p) => (isRec(p) && typeof p.full_name === 'string' ? cleanLine(p.full_name, NAME) : '')).filter(Boolean);
  return cleanLine([...new Set(names)].join('・'), NAME);
}

/** The summits among the checkpoints (each once, by name; its Japanese name if it has one). */
function summits(cps: unknown): TrackWpt[] {
  const seen = new Set<string>(), out: TrackWpt[] = [];
  for (const c of Array.isArray(cps) ? cps : []) {
    const l = isRec(c) ? c.landmark : null;
    if (!isRec(l) || l.is_summit !== true || !Array.isArray(l.coord)) continue;
    const name = cleanLine(typeof l.name_ja === 'string' && l.name_ja ? l.name_ja : l.name, NAME);
    const lon = num(l.coord[0]), lat = num(l.coord[1]);
    if (!name || lon === undefined || lat === undefined || seen.has(name)) continue;
    seen.add(name);
    out.push({ lat, lon, name });
    if (out.length >= 30) break;
  }
  return out;
}

/** The figures both kinds share: distance (m), のぼり, くだり, コース定数. */
function figures(o: Rec): Pick<YamapMeta, 'km' | 'gainM' | 'downM' | 'diff'> {
  const d = num(o.distance), up = num(o.cumulative_up), down = num(o.cumulative_down), c = num(o.course_constant);
  return {
    ...(d !== undefined && d > 0 && d < 1e6 ? { km: Math.round(d / 100) / 10 } : {}),
    ...(up !== undefined && up >= 0 && up < 1e5 ? { gainM: Math.round(up) } : {}),
    ...(down !== undefined && down >= 0 && down < 1e5 ? { downM: Math.round(down) } : {}),
    ...(c !== undefined && c > 0 ? { diff: diffOf(c) } : {})
  };
}

/** An activity's day in its own zone (`time_zone`, hours; Tokyo's if none). */
function dayOf(startS: number, tzH: number | undefined): string | undefined {
  const ms = (startS + (tzH ?? 9) * 3600) * 1000;
  return ms > 1e12 && ms < 1e14 ? new Date(ms).toISOString().slice(0, 10) : undefined;
}

/** The track's points (`tracks[].point`: coord [lon, lat], the corrected altitude, else the raw one, else 0). */
function points(j: unknown): TrackPt[] | null {
  const tracks = isRec(j) ? j.tracks : null;
  if (!Array.isArray(tracks)) return null;
  const out: TrackPt[] = [];
  for (const t of tracks) {
    const p = isRec(t) ? t.point : null;
    if (!isRec(p) || !Array.isArray(p.coord)) continue;
    const lon = num(p.coord[0]), lat = num(p.coord[1]);
    if (lon === undefined || lat === undefined || Math.abs(lon) > 180 || Math.abs(lat) > 90) continue;
    out.push({ lat, lon, ele: num(p.corrected_altitude) ?? num(p.altitude) ?? 0 });
  }
  return out;
}

/** A link's two answers (its metadata's JSON and its track's) as the hike's fields, its raw points and its summits;
 *  null when either isn't what the API sends. Reads nothing else of them (no members, no photos, no text but the
 *  title). */
export function yamapImport(l: YamapLink, metaJson: unknown, trackJson: unknown): { meta: YamapMeta; pts: TrackPt[]; wpts: TrackWpt[] } | null {
  const o = isRec(metaJson) ? metaJson[l.kind === 'activity' ? 'activity' : 'model_course'] : null;
  const pts = points(trackJson);
  if (!isRec(o) || !pts) return null;
  const name = cleanLine(l.kind === 'activity' ? o.title : o.name, NAME) || 'YAMAP';
  const base = { name, src: 'yamap' as const, ref: `${l.kind === 'activity' ? 'a' : 'm'}${l.id}`, ...figures(o) };
  let meta: YamapMeta;
  if (l.kind === 'activity') {
    const start = num(o.start_at), date = start === undefined ? undefined : dayOf(start, num(o.time_zone)), time = hmm(num(o.duration));
    meta = { ...base, area: prefs(isRec(o.map) ? o.map.prefectures : null), status: 'done', ...(date ? { date } : {}), ...(time ? { time } : {}) };
  } else {
    const time = hmm(num(o.course_time));
    meta = { ...base, area: prefs(o.prefectures) || cleanLine(o.area_text, NAME), status: 'want', ...(time ? { time } : {}) };
  }
  return { meta, pts, wpts: summits(o.checkpoints) };
}
