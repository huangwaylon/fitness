// The vendored YAMAP source of the curated trails (docs/hiking.md "Data"): every YAMAP byte the repo keeps, as one
// trimmed envelope a trail in app/scripts/data/yamap/<slug>.json. The trim is a whitelist — the route at full
// resolution, its summits, the figures, the day — and the identity is never taken: no activity id or link, no
// members, photos or diary text, no plan id, party or planner, and no clock (no start_at, no per-point times).
// scripts/hiking-tracks.ts writes these (--save, from the live API or a hand-saved plan page) and rebuilds the
// shipped tracks from them offline (--from); yamapData.test.ts pins envelope → track identity and the trim's purity.
import { cleanLine } from '../contract/text.ts';
import { isRec } from '../contract/guards.ts';

const NAME = 60;

/** A summit checkpoint (the only landmarks kept: a trailhead says where the car was). */
interface YamapSummit {
  /** The display name (English when YAMAP has one). */
  name: string;
  nameJa?: string;
  nameEn?: string;
  lat: number;
  lon: number;
}

/** An activity's figures (raw numbers: distance m, のぼり / くだり m, the walk's seconds with rests, コース定数). */
interface YamapActivityMeta {
  title?: string;
  /** The walk's day in its own zone (start_at + time_zone at trim time; the clock itself is dropped). */
  date?: string;
  duration?: number;
  distance?: number;
  up?: number;
  down?: number;
  constant?: number;
  prefectures: string[];
}

/** A vendored activity: `{v:1, kind:'activity', saved, meta, summits, points}`, points [lon, lat, ele] as the API
 *  sent them (ele = the DEM-corrected altitude, else the raw one), in walk order. `saved` is provenance only:
 *  nothing reads it, so a re-vendor on another day rebuilds byte-identical tracks. */
export interface YamapActivityEnv {
  v: 1;
  kind: 'activity';
  saved: string;
  meta: YamapActivityMeta;
  summits: YamapSummit[];
  points: [number, number, number][];
}

/** A plan checkpoint's leg, as the page's __NEXT_DATA__ carries it (its landmark trimmed the same way). */
interface YamapPlanCheckpoint {
  coords: [number, number][];
  altitudes: number[];
  landmark: { name?: string; nameEn?: string; nameJa?: string; coord: [number, number]; isSummit: boolean } | null;
}

/** A vendored plan: `{v:1, kind:'plan', saved, checkpoints}`. The plan's link, party and planner are never read. */
export interface YamapPlanEnv {
  v: 1;
  kind: 'plan';
  saved: string;
  checkpoints: YamapPlanCheckpoint[];
}

export type YamapEnv = YamapActivityEnv | YamapPlanEnv;

/** The trails whose envelopes the repo holds (yamapData.test round-trips each against its shipped track). A plan's
 *  envelope joins when its page is next saved by hand. */
export const VENDORED: Record<string, YamapEnv['kind']> = {
  utsukushigahara: 'activity',
  'akagi-kurobi': 'activity'
};

const num = (v: unknown): number | undefined => (typeof v === 'number' && Number.isFinite(v) ? v : undefined);

/** start_at (s) + time_zone (h; Tokyo's when none) as the day's ISO date, or undefined. */
function dayOf(startS: number, tzH: number | undefined): string | undefined {
  const ms = (startS + (tzH ?? 9) * 3600) * 1000;
  return ms > 1e12 && ms < 1e14 ? new Date(ms).toISOString().slice(0, 10) : undefined;
}

/** A checkpoint's summit, or null (only summits are kept). */
function summitOf(c: unknown): YamapSummit | null {
  const l = isRec(c) ? c.landmark : null;
  if (!isRec(l) || l.is_summit !== true || !Array.isArray(l.coord)) return null;
  const lon = num(l.coord[0]), lat = num(l.coord[1]);
  const nameEn = cleanLine(typeof l.name_en === 'string' ? l.name_en : '', NAME) || undefined;
  const nameJa = cleanLine(typeof l.name_ja === 'string' ? l.name_ja : '', NAME) || undefined;
  const name = nameEn ?? nameJa ?? cleanLine(typeof l.name === 'string' ? l.name : '', NAME);
  if (!name || lon === undefined || lat === undefined || Math.abs(lon) > 180 || Math.abs(lat) > 90) return null;
  return { name, ...(nameJa ? { nameJa } : {}), ...(nameEn ? { nameEn } : {}), lat, lon };
}

/** The live API's two answers as a vendored activity envelope, or null when they aren't the API's shape. Reads the
 *  whitelist only: an answer's members, photos and text are never touched. */
export function trimActivity(metaJson: unknown, trackJson: unknown, saved: string): YamapActivityEnv | null {
  const o = isRec(metaJson) ? metaJson.activity : null;
  const tracks = isRec(trackJson) ? trackJson.tracks : null;
  if (!isRec(o) || !Array.isArray(tracks)) return null;
  const points: [number, number, number][] = [];
  for (const t of tracks) {
    const p = isRec(t) ? t.point : null;
    if (!isRec(p) || !Array.isArray(p.coord)) continue;
    const lon = num(p.coord[0]), lat = num(p.coord[1]);
    if (lon === undefined || lat === undefined || Math.abs(lon) > 180 || Math.abs(lat) > 90) continue;
    const ele = num(p.corrected_altitude) ?? num(p.altitude);
    if (ele === undefined) throw new Error('a track point without an altitude');
    points.push([lon, lat, ele]);
  }
  const seen = new Set<string>(), summits: YamapSummit[] = [];
  for (const c of Array.isArray(o.checkpoints) ? o.checkpoints : []) {
    const s = summitOf(c);
    if (!s || seen.has(s.name)) continue;
    seen.add(s.name);
    summits.push(s);
    if (summits.length >= 30) break;
  }
  const start = num(o.start_at);
  const prefs = (isRec(o.map) && Array.isArray(o.map.prefectures) ? o.map.prefectures : [])
    .map((p) => (isRec(p) && typeof p.full_name === 'string' ? cleanLine(p.full_name, NAME) : ''))
    .filter(Boolean);
  const meta: YamapActivityMeta = {
    ...(cleanLine(typeof o.title === 'string' ? o.title : '', NAME) ? { title: cleanLine(o.title as string, NAME) } : {}),
    ...(start !== undefined && dayOf(start, num(o.time_zone)) ? { date: dayOf(start, num(o.time_zone))! } : {}),
    ...(num(o.duration) !== undefined && num(o.duration)! > 0 ? { duration: num(o.duration)! } : {}),
    ...(num(o.distance) !== undefined && num(o.distance)! > 0 ? { distance: num(o.distance)! } : {}),
    ...(num(o.cumulative_up) !== undefined ? { up: num(o.cumulative_up)! } : {}),
    ...(num(o.cumulative_down) !== undefined ? { down: num(o.cumulative_down)! } : {}),
    ...(num(o.course_constant) !== undefined && num(o.course_constant)! > 0 ? { constant: num(o.course_constant)! } : {}),
    prefectures: [...new Set(prefs)]
  };
  return { v: 1, kind: 'activity', saved, meta, summits, points };
}

/** A hand-saved plan page as a vendored plan envelope (its __NEXT_DATA__ legs and summit landmarks; everything else
 *  of the page — the plan's id and link, the party, the planner — never read). Throws when the page has no plan. */
export function trimPlan(html: string, saved: string): YamapPlanEnv {
  const data = /<script id="__NEXT_DATA__"[^>]*>(.*?)<\/script>/s.exec(html)?.[1];
  if (!data) throw new Error('no __NEXT_DATA__ in the saved plan page');
  const { checkpoints } = (JSON.parse(data) as { props: { pageProps: { plan: { checkpoints: unknown[] } } } }).props.pageProps.plan;
  const out: YamapPlanCheckpoint[] = [];
  for (const c of Array.isArray(checkpoints) ? checkpoints : []) {
    if (!isRec(c) || !Array.isArray(c.coords) || !Array.isArray(c.altitudes)) continue;
    // a point kept only as a pair (its coord and its altitude together: a hole in one array shifts no other point's)
    const cs = c.coords, as = c.altitudes;
    const coords: [number, number][] = [], altitudes: number[] = [];
    cs.forEach((p, i) => {
      const a = num(as[i]);
      if (Array.isArray(p) && num(p[0]) !== undefined && num(p[1]) !== undefined && a !== undefined) {
        coords.push([p[0] as number, p[1] as number]);
        altitudes.push(a);
      }
    });
    const l = isRec(c.landmark) ? c.landmark : null;
    const lc = l && Array.isArray(l.coord) ? l.coord : null;
    const llon = lc ? num(lc[0]) : undefined, llat = lc ? num(lc[1]) : undefined;
    out.push({
      coords,
      altitudes,
      landmark: l && llon !== undefined && llat !== undefined && Math.abs(llon) <= 180 && Math.abs(llat) <= 90
        ? {
            ...(cleanLine(typeof l.name === 'string' ? l.name : '', NAME) ? { name: cleanLine(l.name as string, NAME) } : {}),
            ...(cleanLine(typeof l.nameEn === 'string' ? l.nameEn : '', NAME) ? { nameEn: cleanLine(l.nameEn as string, NAME) } : {}),
            ...(cleanLine(typeof l.nameJa === 'string' ? l.nameJa : '', NAME) ? { nameJa: cleanLine(l.nameJa as string, NAME) } : {}),
            coord: [llon, llat],
            isSummit: l.isSummit === true
          }
        : null
    });
  }
  return { v: 1, kind: 'plan', saved, checkpoints: out };
}

/** An activity envelope as the GPX the track converter reads (the script's old yamapGpx, unchanged: summits in
 *  first-seen order as the waypoints, the points in walk order). */
export function activityGpx(env: YamapActivityEnv): string {
  const seen = new Set<string>();
  const wpts = env.summits
    .filter((s) => {
      if (!s.nameEn) throw new Error(`a summit without an English name: ${s.name}`);
      return !seen.has(s.nameEn) && seen.add(s.nameEn);
    })
    .map((s) => `<wpt lat="${s.lat}" lon="${s.lon}"><name>${s.nameEn}</name></wpt>`);
  const pts = env.points.map(([lon, lat, ele]) => `<trkpt lat="${lat}" lon="${lon}"><ele>${ele}</ele></trkpt>`);
  return `<gpx>${wpts.join('')}<trk><trkseg>${pts.join('')}</trkseg></trk></gpx>`;
}

/** A plan envelope as the GPX the converter reads (the script's old planGpx, unchanged: each checkpoint's leg,
 *  a repeated seam point once, the summits as waypoints). */
export function planGpx(env: YamapPlanEnv): string {
  const seen = new Set<string>();
  const wpts = env.checkpoints
    .map((c) => c.landmark)
    .filter((l) => {
      if (!l?.isSummit) return false;
      if (!l.nameEn) throw new Error(`a summit without an English name: ${l.name ?? '?'}`);
      return !seen.has(l.nameEn) && seen.add(l.nameEn);
    })
    .map((l) => `<wpt lat="${l!.coord[1]}" lon="${l!.coord[0]}"><name>${l!.nameEn}</name></wpt>`);
  const pts: string[] = [];
  let last = '';
  for (const c of env.checkpoints)
    c.coords.forEach(([lon, lat], i) => {
      const key = `${lon},${lat}`;
      if (key !== last) pts.push(`<trkpt lat="${lat}" lon="${lon}"><ele>${c.altitudes[i]}</ele></trkpt>`);
      last = key;
    });
  return `<gpx>${wpts.join('')}<trk><trkseg>${pts.join('')}</trkseg></trk></gpx>`;
}

/** A parsed envelope, or null when it isn't one (the test and --from read this). */
export function parseYamapEnv(json: unknown): YamapEnv | null {
  if (!isRec(json) || json.v !== 1 || typeof json.saved !== 'string') return null;
  if (json.kind === 'activity') {
    if (!isRec(json.meta) || !Array.isArray(json.summits) || !Array.isArray(json.points)) return null;
    if (!Array.isArray(json.meta.prefectures)) return null;
    if (!json.points.every((p) => Array.isArray(p) && p.length === 3 && p.every((n) => typeof n === 'number'))) return null;
    return json as unknown as YamapActivityEnv;
  }
  if (json.kind === 'plan') {
    if (!Array.isArray(json.checkpoints)) return null;
    if (!json.checkpoints.every((c) => isRec(c) && Array.isArray(c.coords) && Array.isArray(c.altitudes))) return null;
    return json as unknown as YamapPlanEnv;
  }
  return null;
}

/** Keys and string patterns an envelope must never carry (yamapData.test scans every committed file): the identity
 *  and the clock. */
const BANNED_KEYS = /^(id|ids|member|members|user|users|owner|photo|photos|image|images|text|body|comment|comments|url|link|href|email|start_at|started_at|time|timestamp|timestamps|created_at|updated_at|party|planner|gender|birth)/i;
const BANNED_STRING = /yamap\.com|https?:\/\//i;

/** The first banned key or string under `v`, as a path for the test's message, or null. */
export function findBanned(v: unknown, path = '$'): string | null {
  if (typeof v === 'string') return BANNED_STRING.test(v) ? `${path}: ${v.slice(0, 40)}` : null;
  if (Array.isArray(v)) {
    for (let i = 0; i < v.length; i++) {
      const r = findBanned(v[i], `${path}[${i}]`);
      if (r) return r;
    }
    return null;
  }
  if (isRec(v)) {
    for (const [k, x] of Object.entries(v)) {
      if (BANNED_KEYS.test(k)) return `${path}.${k}`;
      const r = findBanned(x, `${path}.${k}`);
      if (r) return r;
    }
  }
  return null;
}
