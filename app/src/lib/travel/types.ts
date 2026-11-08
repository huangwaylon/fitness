// りょこう: the trip guides' data shape (docs/travel.md "Data shape"). Pure types: the trip modules (trips/*.ts) hold
// all the content. A text pair and the packing list's seed are the relay contract's own shapes (contract/pack.ts L,
// PackSeed: the record, the phones and the data agree on them).
import type { L, PackSeed } from '#lib/contract/pack.ts';

/** A text pair (contract/pack.ts L): at least one side; shown in the reader's locale, else the other. Seattle's guide
 *  is English only. Inline tokens (tokens.ts): `{km:9.8}` / `{m:444}` / `{c:29}` (distance, height, temperature:
 *  rendered metric or imperial by the device switch), `{p:key}` (a private value from the trip note, docs/travel.md
 *  "Private values"). */
export type { L };

export type TripId = 'okinawa' | 'seattle' | 'nz';

/** An outside link (Maps, a trail map, an operator). `href` is https, or a `{p:key}` token for a private URL. */
export interface Link { label: L; href: string }

/** A photo under static/travel/<trip>/ (WebP ≤ 720 px wide), with its pixel size for the layout before it loads. */
export interface Photo { src: string; w: number; h: number; alt?: L; caption?: L }

/** One line of a list: a timeline row (`t` its time as written: '06:10', '~12:00', '<21:00', or '' for none) or a
 *  bullet (no `t`). `note` is the source's small print under the line. */
export interface Row { t?: string; text: L; note?: L }

/** A headed list inside a card: `tl` an hour-by-hour timeline (rows carry `t`), `bul` bullets. */
interface Section { head?: L; kind: 'tl' | 'bul'; rows: Row[] }

interface Stat { k: L; v: L }

/** A day's timeline row; `place` names the map stop (Place.id) it arrives at, when there is one; `dd` a row on
 *  another date than the day's (-1 the NZ flight out on the eve, 1 the flight home after midnight); `tz` the zone
 *  its time is in when that isn't the trip's (the flight out of Narita, on Tokyo's clock). */
export interface DayRow { t: string; text: L; note?: L; place?: string; dd?: -1 | 1; tz?: string }

interface Hike {
  level: 'mod' | 'hard' | 'epic';
  km: number;
  gainM: number;
  route: L;
  drive: L;
  time: L;
  pass: L;
  /** Where the trailhead is ('Granite Falls, WA'). */
  where: L;
  /** The trail map (huangwaylon.github.io/hiking-trails: トレイル's own trail opens in the app, hiking/trails.ts
   *  hikeSlugOf; the old /gpx site is gone). */
  gpx?: string;
}

export interface Day {
  /** 1-based, the day of the trip. */
  n: number;
  /** YYYY-MM-DD, local to the trip's tz. */
  date: string;
  title: L;
  sub?: L;
  /** The hour-by-hour timeline (none on a free day: its plan is in `sections`). */
  rows: DayRow[];
  sections?: Section[];
  links?: Link[];
  note?: L;
  photo?: Photo;
  /** A hike's day: its photo is `photo`. */
  hike?: Hike;
}

export interface Place {
  /** Stops `s<day>-<i>`; candidates: a camp's slug (= Camp.id), `n-<slug>` nature, `f-<slug>` food. `link` (the
   *  place on Maps) and a leg's `min` / `km` are the source's, kept for ちず though it doesn't show them yet. */
  id: string;
  kind: 'stop' | 'camp' | 'nature' | 'food';
  name: L;
  lat: number;
  lon: number;
  /** Stops: the day, the index in the day, the arrival in minutes after local midnight. */
  day?: number;
  i?: number;
  min?: number;
  link?: string;
}

export interface Leg {
  day: number;
  /** The index (Place.i) of the stop the leg arrives at: what greys out once that stop is passed. */
  i: number;
  from: string;
  to: string;
  mode: 'drive' | 'bus' | 'walk' | 'boat';
  /** OSRM free-flow minutes and km, on the routed legs (a walk or a boat is a straight line, unmeasured). */
  min?: number;
  km?: number;
  /** [lon, lat], 5 decimals, simplified (Douglas-Peucker, 5 m). */
  line: [number, number][];
}

/** A logistics card (じゅんび): a booking, a rental, a dive, what to know. */
export interface Card {
  id: string;
  icon: string;
  title: L;
  sub?: L;
  desc?: L;
  photo?: Photo;
  stats?: Stat[];
  sections?: Section[];
  links?: Link[];
}

interface Chip { text: L; pick?: true }

export interface Camp {
  /** The Evertrail directory name's slug: its photo's file name, its map pin (Place.id; a drivable site's only). */
  id: string;
  name: L;
  sub: L;
  type: 'wild' | 'paid';
  beach: boolean;
  toilet: boolean;
  shower: boolean;
  /** None for the outer-island sites (their photos are Evertrail's: not copied). */
  photo?: Photo;
  desc: L;
  /** In the source's order; `pick` the highlighted ones (1泊目 / 2泊目 / 候補). */
  chips: Chip[];
  /** Free-flow road time and distance from the Evertrail office (the source's order); none for a ferry-only site. */
  fromMin?: number;
  fromKm?: number;
  fee: L;
  maps: string;
}

export interface Trip {
  id: TripId;
  /** The place ('沖縄'); its year is the start's. */
  title: L;
  eyebrow: L;
  sub: L;
  /** First and last day, YYYY-MM-DD local; `tz` the IANA zone the times are in. */
  start: string;
  end: string;
  tz: string;
  cover: Photo;
  hero: Photo;
  /** The source theme's map colour per day (d1…). */
  dayColors: string[];
  /** [west, south, east, north]: every place is inside it (the old map's window where it had one). */
  bbox: [number, number, number, number];
  days: Day[];
  logistics: Card[];
  camps?: Camp[];
  campsIntro?: L;
  campsFoot?: L;
  places: Place[];
  legs: Leg[];
  packing: PackSeed;
  /** The itinerary's footer ('All times JST'). */
  foot?: L;
}
