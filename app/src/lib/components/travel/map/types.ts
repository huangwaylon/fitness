// The trip map's narrow interface (docs/travel.md "Maps"): what the trip sheet hands TripMap.svelte, on the trip's own
// Place and Leg. Pure, so the sheet and the tests never pull in the map's chunk.
import type { Leg, Place } from '#lib/travel/types.ts';
import type { Locale } from '#lib/i18n/index.ts';

/** The candidate layers (Okinawa's, MapPane's layer button): every kind but the day's stops. */
export type Layer = Exclude<Place['kind'], 'stop'>;
export const LAYERS: readonly Layer[] = ['camp', 'nature', 'food'];
export type Layers = Partial<Record<Layer, boolean>>;

/** The candidates' dot colours (the map's circles and the chips' legend): the tent orange, a deep teal, a berry pink. */
export const KIND_COLOR: Record<Layer, string> = { camp: '#F28A2E', nature: '#1E9C8A', food: '#D9487A' };

/** Day d's colour (the trip's d1…; a day past them the first's blue). */
export const dayColor = (colors: readonly string[], d: number): string => colors[d - 1] ?? '#2F86BD';

export interface TripMapProps {
  places: readonly Place[];
  legs: readonly Leg[];
  dayColors: readonly string[];
  /** The day shown (1-based): its stops and legs. */
  day: number;
  /** A place's id: its pin raised and labelled, the map brought to it. */
  selected?: string;
  /** Which candidate layers show (default: none). */
  layers?: Layers;
  locale: Locale;
  /** The trip's area is saved for offline (lib/offline): offline, the map says 「保存した範囲のみ」. */
  saved?: boolean;
  /** A pin (a stop or a candidate) tapped: a merged pin's first stop. */
  onselect?: (id: string) => void;
}

/** The map's state as the dev hook (`window.__travelMap`, the specs) tells it. */
export interface MapState {
  /** 'stub': drawOff(), no map made; 'loading' until the style and its first tiles are in; 'offline': drawn, but no
   *  basemap tile came (the route alone); 'failed': the map's chunk or its WebGL didn't come (a retry button); 'lost':
   *  the WebGL context is gone (iOS took it back) until it's restored. */
  mode: 'stub' | 'loading' | 'ready' | 'offline' | 'failed' | 'lost';
  /** The candidates shown (their layers on), by id. */
  candidates: string[];
  legs: number;
  layers: Layer[];
  loc: LocState;
  center: [number, number] | null;
  /** The camera is moving (a fit's or a pin's flight): read `center` once it isn't. */
  moving: boolean;
}

/** The location dot: off (never asked), asking, on (a fix shown), denied, unavailable (no fix / no API). */
export type LocState = 'off' | 'asking' | 'on' | 'denied' | 'unavailable';
