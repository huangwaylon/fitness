// トレイル, the hiking trails (docs/hiking.md): the trail guide's data shape. Pure types: trails.ts holds the content
// (the user's own text, ported from the hiking-trails app), the tracks are files of their own by slug (track.ts,
// load.ts), never in this module.
import type { L } from '#lib/travel/types.ts';

export type { L };

export type Diff = 'moderate' | 'hard' | 'veryhard';
export type Route = 'out' | 'loop' | 'p2p';
export type Dogs = 'leashed' | 'no';
/** The topo basemap's region (map/style.ts TOPO: USGS for the US, GSI 地理院タイル for Japan). */
export type Region = 'us' | 'jp';

/** One stop of a plan's hour-by-hour itinerary; `depart` marks a rest there (the summit's 2 h). */
interface PlanStop {
  time: string;
  depart?: string;
  type: 'start' | 'pass' | 'peak' | 'junction' | 'goal';
  name: L;
}

/** An upcoming hike planned on YAMAP, baked in (no network): its link, party and planner are private values (`{p:key}`
 *  tokens, the `hiking` trip note: docs/hiking.md "Private values"). */
export interface Plan {
  /** `{p:key}`: the plan's URL. */
  url: string;
  dateISO: string;
  /** `{p:key}`: how many go. */
  party: string;
  distKm: number;
  gainM: number;
  /** The pace (% of the course time) and its label. */
  pace: number;
  paceLabel: L;
  /** YAMAP's コース定数. */
  constant: number;
  /** `{p:key}`: who planned it. */
  by: string;
  totalTime: string;
  sunrise: string;
  sunset: string;
  itinerary: PlanStop[];
}

export interface Trail {
  slug: string;
  name: L;
  area: L;
  lengthKm: number;
  /** AllTrails' DEM-based gain, on purpose: a GPX's own elevations over-count it by 50–60 % (GPS noise). */
  gainM: number;
  diff: Diff;
  route: Route;
  /** As the source wrote it ('3 h 17 min', '~3 h 30 min', '10 – 13 h'): fmtTime shows it in the reader's locale. */
  time: string;
  /** 'Apr – Nov' (fmtSeason). */
  season: string;
  dogs: Dogs;
  permit: L;
  center: { lat: number; lon: number };
  summary: L;
  description: L;
  tips: L[];
  tiles: Region;
  plan?: Plan;
  /** A hike walked and recorded on YAMAP: its activity's own figures (the trail's length, gain and time are its 距離,
   *  のぼり and タイム, rests included). */
  walked?: Walked;
  /** No photo of its own (YAMAP's activities came without): the list's band is the plain paper. */
  photo?: false;
}

/** A YAMAP activity's record (yamap.com/activities/<id>, public: no link kept, it names the walkers). */
interface Walked {
  dateISO: string;
  /** くだり (m). */
  downM: number;
  /** YAMAP's 標準タイム for the course ('h:mm'). */
  standard: string;
  /** YAMAP's コース定数. */
  constant: number;
}

/** A trail's track file (scripts/hiking-tracks.ts): the GPX simplified (Douglas–Peucker, ~5 m), its elevation smoothed
 *  (a 15-point centred window over the raw points, before the simplification), and its waypoints. */
export interface TrackFile {
  v: 1;
  /** The raw track's length (m): the simplified line is a little shorter (prepare stretches its distances to it). */
  len: number;
  /** [lon, lat, ele (m, smoothed)], 5 and 1 decimals. */
  pts: [number, number, number][];
  /** The GPX's waypoints (their English names: WPT_JA translates). */
  wpts: { lon: number; lat: number; name: string }[];
}
