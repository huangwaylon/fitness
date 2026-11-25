// The whole-trip map's input and hook (地図 tab, docs/travel.md "Maps"): the itinerary's days as far as the map reads
// them (a structural slice of lib/travel/itinerary.ts ItinDay: its days pass in as they are, so the map never imports
// the list's code), the candidate layers (Okinawa's), and the specs' view of it. Pure.
import type { L, Place } from '#lib/travel/types.ts';
import type { LocState } from '../../map/types.ts';

export interface MapStop {
  id: string;
  /** As the list writes it ('11:55'; '' or none: no time). */
  time?: string;
  name: string | L;
  /** No position: in the list, not on the map. */
  lat?: number;
  lng?: number;
}

export interface MapDay {
  /** The day's number (1-based): what `day` and the foot row's cells name. */
  i: number;
  /** YYYY-MM-DD (the foot row shows its day of the month). */
  date: string;
  title?: string | L;
  /** The day's route colour. */
  colour: string;
  stops: readonly MapStop[];
  /** [lng, lat] lines (one point or none: not drawn); 'walk' and 'boat' dashed. */
  legs?: readonly { line?: readonly (readonly [number, number])[]; mode?: string }[];
}

/** The candidate layers (Okinawa's campsites, nature, food): every place kind but the stops. Off at first. */
export type Layer = Exclude<Place['kind'], 'stop'>;
export const LAYERS: readonly Layer[] = ['camp', 'nature', 'food'];
export type Layers = Partial<Record<Layer, boolean>>;
/** Their dots' colours (the map's circles and the layers panel's swatches): the tent orange, a deep teal, a berry. */
export const KIND_COLOR: Record<Layer, string> = { camp: '#F28A2E', nature: '#1E9C8A', food: '#D9487A' };

/** What the map's dev hook (`window.__travelMap`, the specs) tells. */
export interface MapState {
  /** 'stub' (the e2e's logic tier: no MapLibre), 'loading', 'ready', 'offline' (no basemap tile came), 'failed', 'lost'. */
  mode: string;
  /** The focused day (null: 全体). */
  focus: number | null;
  /** The ringed stop. */
  selected: string | null;
  /** The tab showing (false: hidden, the map kept, no work). */
  active: boolean;
  zoom: number | null;
  center: [number, number] | null;
  /** At rest: the style in, no camera move, the tiles asked for answered. */
  settled: boolean;
  /** The stop dots and leg lines drawn. */
  stops: number;
  legs: number;
  /** Maps made by this component (1 for its life: never rebuilt per tab switch). */
  made: number;
  loc: LocState;
  /** The candidate layers on, and their places drawn (by id). */
  layers: Layer[];
  candidates: string[];
  /** The saved places' squares drawn (in view, the layer on): each [id, x, y] px in the map; the chosen one's tag. */
  places: number;
  squares: [string, number, number][];
  tag: string;
}
