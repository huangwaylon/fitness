// The trip map's narrow interface (docs/travel.md "Maps"): what the trip sheet hands TripMap.svelte. Pure types, so
// the sheet and the tests never pull in the map's chunk.

type PlaceKind = 'stop' | 'camp' | 'nature' | 'food';
/** The candidate layers (Okinawa's chips): every kind but the day's stops. */
export type Layer = Exclude<PlaceKind, 'stop'>;
export const LAYERS: readonly Layer[] = ['camp', 'nature', 'food'];

export type Locale = 'ja' | 'en';
/** A name in the reader's locale, else the other. */
export type Name = { ja?: string; en?: string };

export interface MapPlace {
  id: string;
  kind: PlaceKind;
  name: Name;
  lat: number;
  lon: number;
  /** A stop's day (1-based). */
  day?: number;
  /** A stop's number within its day (1-based): the pin's number. */
  i?: number;
}

export interface MapLeg {
  day: number;
  mode: 'drive' | 'bus' | 'walk' | 'boat';
  /** [lon, lat] */
  line: [number, number][];
}

/** 'all', or a day (1-based). */
export type Day = number | 'all';

export interface TripMapProps {
  places: MapPlace[];
  legs: MapLeg[];
  /** Day n's colour is dayColors[n - 1] (CSS colours; cycled past the end). */
  dayColors: string[];
  day: Day;
  /** A place's id: its pin raised and the map brought to it. */
  selected?: string;
  /** Which candidate layers show (default: none). */
  layers?: Partial<Record<Layer, boolean>>;
  locale: Locale;
  /** The basemap's TileJSON URL (default: OpenFreeMap's planet, source.ts). */
  tiles?: string;
  /** A pin (a stop or a candidate) tapped. */
  onselect?: (id: string) => void;
}

/** The map's state as the dev hook (`window.__travelMap`) and the stub's data-* tell it. */
export interface MapState {
  /** 'stub': drawOff(), no map made; 'loading' until the style and its first tiles are in; 'lost': the WebGL context
   *  is gone (iOS took it back) until it's restored. */
  mode: 'stub' | 'loading' | 'ready' | 'lost';
  day: Day;
  selected: string | null;
  locale: Locale;
  /** The stops shown (the day's, or all), by id. */
  stops: string[];
  /** The candidates shown (their layers on), by id. */
  candidates: string[];
  legs: number;
  layers: Layer[];
  /** The location dot: off (never asked), asking, on (a fix shown), denied, unavailable (no fix / no API). */
  loc: LocState;
  zoom: number | null;
  center: [number, number] | null;
}

export type LocState = 'off' | 'asking' | 'on' | 'denied' | 'unavailable';

export const nameOf = (n: Name, locale: Locale): string => (locale === 'en' ? n.en ?? n.ja : n.ja ?? n.en) ?? '';

/** Day n's colour. */
export const dayColor = (colors: readonly string[], day: number): string => colors.length ? colors[(((day - 1) % colors.length) + colors.length) % colors.length] : '#2F86BD';
