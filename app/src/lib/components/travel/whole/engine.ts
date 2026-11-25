// The whole-trip map's MapLibre side (地図 tab): the lazy chunk AllDaysMap.svelte imports the first time the tab shows
// (never on first load, never under mapStub()). map/gl.ts makes the map (the shared options, the CSP-safe worker, the
// tiles through the page: the service worker keeps them). A focus (a day, or 全体) fits its box; a stop selected is
// ringed with the zoom kept, the map only panned if the stop sits off its visible part. Over the trip: the candidate
// dots (Okinawa's layers), the saved places near the shown days (map/places/layer.ts: the app's, never /s's) and the
// location dot. Hidden (another tab), it does no work: a focus or a size change waits for the tab to show again.
// destroy() lets go of it all (its WebGL context, its font faces: map/gl.ts removeMap).
import { labelLayout } from '../../map/basemap.ts';
import { FONT, fontFaces } from '../../map/fonts.ts';
import { fitBox, locDot, makeMap, removeMap, revealAbove, setData, settledOf, styleLife, tapRouter, watchMode, type EngineMode } from '../../map/gl.ts';
import { placesLayer, type MapPlace, type SavedState } from '../../map/places/layer.ts';
import type { Fix } from '../../map/types.ts';
import { boundsOf, candidatesData, findStop, inView, legsData, stopsData } from './logic.ts';
import { CAND_LAYER, OVER_LABELS, STOP_LAYER, WSRC, wholeStyle } from './style.ts';
import type { Locale } from '#lib/i18n/index.ts';
import type { Place } from '#lib/travel/types.ts';
import type { MapDay } from './types.ts';

export interface WholeInput {
  days: readonly MapDay[];
  focus: number | null;
  selected: string | null;
  locale: Locale;
  /** The candidates shown (their layers on), the chosen one. */
  cands: readonly Place[];
  cand: string | null;
  /** The saved places near the shown days (none on /s), shown or hidden, the one chosen. */
  saved?: { pts: readonly MapPlace[]; shown: boolean; sel: MapPlace | null };
}

/** The map's edges kept clear (px): the controls top right, the foot row and a card over its bottom. */
export const PAD = { top: 40, bottom: 132, left: 36, right: 36 };
/** What covers the map's bottom when a card shows: a ringed stop under it is panned clear. Inside the fit's bottom
 *  pad, so a fitted day's stops never move when ringed. */
const COVER = PAD.bottom - 8;

export interface WholeEngine {
  update(i: WholeInput): void;
  /** The tab shown (true: its size taken again, a waiting fit done) or hidden (any camera move stopped). */
  activate(on: boolean): void;
  /** The location dot (null: none; `stale`: grey); `fly` brings the map to it. Kept till the style is in. */
  setFix(fix: Fix | null, fly: boolean, stale?: boolean): void;
  /** The chosen square kept clear of its card over the map's bottom `cover` px. */
  reveal(p: MapPlace, cover: number): void;
  /** Back to the focus's box. */
  fit(): void;
  zoom(): number;
  center(): [number, number];
  /** A stop's or a candidate's point in the map (px from its top left; the specs' taps), or null. */
  px(id: string): [number, number] | null;
  drawn(): { stops: number; legs: number };
  places(): SavedState;
  settled(): boolean;
  destroy(): void;
}

type On = { stop(id: string): void; cand(id: string): void; place(id: string): void; miss(): void; mode(m: EngineMode): void; tile(): void };

export function createWholeEngine(el: HTMLElement, input: WholeInput, on: On): WholeEngine {
  let cur = input;
  let active = true;
  let loaded = false;
  /** A fit asked for while hidden or before the style was in: done once both hold. */
  let pendingFit = false;
  let labelled = input.locale;
  let fix: Fix | null = null, stale = false, flyOnLoad = false;
  const box = boundsOf(input.days, input.focus);
  const map = makeMap(el, {
    style: wholeStyle(input.locale, fontFaces()), via: true,
    view: box ? { bounds: box, padding: Math.min(PAD.left, PAD.right), maxZoom: 13 } : { center: [0, 0], zoom: 4 }
  });
  const loadedNow = watchMode(map, WSRC.base, 'trip', on.mode, on.tile);
  const drawLoc = locDot(map, WSRC.loc);
  let counts = { stops: 0, legs: 0 };

  function data(i: WholeInput): void {
    const legs = legsData(i.days, i.focus), stops = stopsData(i.days, i.focus, i.selected);
    setData(map, WSRC.legs, legs);
    setData(map, WSRC.stops, stops);
    setData(map, WSRC.cands, candidatesData(i.cands, i.cand));
    counts = { stops: stops.features.length, legs: legs.features.length };
  }
  function fit(animate: boolean): void {
    if (!loaded || !active) return void (pendingFit = true);
    pendingFit = false;
    const b = boundsOf(cur.days, cur.focus);
    if (b) fitBox(map, b, { pad: PAD, maxZoom: 13, duration: animate ? 500 : 0 });
  }
  /** The selected stop brought into the visible part, its zoom kept (left alone if it is in view). */
  function reveal(id: string): void {
    const s = findStop(cur.days, id);
    if (!s || !loaded || !active) return;
    const c = map.getContainer();
    const p = map.project([s.stop.lng, s.stop.lat]);
    if (!inView(p, c.clientWidth, c.clientHeight, COVER, 0)) map.panTo([s.stop.lng, s.stop.lat], { duration: 400, offset: [0, -COVER / 2] });
  }
  function relabel(i: WholeInput): void {
    if (i.locale === labelled || !loaded) return;
    labelled = i.locale;
    const l = labelLayout(i.locale);
    for (const layer of map.getStyle().layers) {
      if (layer.type === 'symbol' && 'source' in layer && layer.source === WSRC.base) {
        map.setLayoutProperty(layer.id, 'text-field', l['text-field']);
        map.setLayoutProperty(layer.id, 'text-max-width', l['text-max-width']);
      }
    }
  }
  function showFix(fly: boolean): void {
    drawLoc(fix, stale);
    if (fix && fly) map.easeTo({ center: [fix.lon, fix.lat], zoom: Math.max(map.getZoom(), 14), duration: 600 });
  }

  // drawn as the style comes in (and again after iOS takes the WebGL context back and restores it: the view kept)
  styleLife(map, (first) => {
    loaded = true;
    relabel(cur);
    data(cur);
    if (first || pendingFit) fit(false);
    if (fix) showFix(first && flyOnLoad);
    loadedNow();
  }, () => (loaded = false));
  const router = tapRouter(map);
  router.add([STOP_LAYER], (f) => typeof f.properties?.id === 'string' && on.stop(f.properties.id));
  router.add([CAND_LAYER], (f) => typeof f.properties?.id === 'string' && on.cand(f.properties.id));
  router.miss(on.miss);
  // (the chosen one's name in the basemap's font)
  const saved = placesLayer(map, { before: OVER_LABELS, font: [FONT], onplace: on.place });
  let savedAt: WholeInput['saved'] | null = null;
  function places(i: WholeInput): void {
    if (i.saved === savedAt) return;
    const was = savedAt;
    savedAt = i.saved;
    const p = i.saved ?? { pts: [], shown: false, sel: null };
    if (!was || p.pts !== was.pts || p.shown !== was.shown) saved.set(p.pts, p.shown, false);
    if (!was || p.sel !== was.sel) saved.select(p.sel);
  }
  places(input);

  return {
    update(i) {
      const prev = cur;
      cur = i;
      places(i);
      if (!loaded) return void (i.focus !== prev.focus && (pendingFit = true));
      relabel(i);
      if (i.days !== prev.days || i.focus !== prev.focus || i.selected !== prev.selected || i.cands !== prev.cands || i.cand !== prev.cand) data(i);
      // (new days, the same trip: redrawn where the camera is; a focus fits)
      if (i.focus !== prev.focus) fit(true);
      else if (i.selected && i.selected !== prev.selected) reveal(i.selected);
    },
    activate(v) {
      if (v === active) return;
      active = v;
      if (!v) return void map.stop();
      map.resize();
      if (pendingFit) fit(false);
    },
    setFix(f, fly, old = false) {
      ((fix = f), (stale = old));
      if (loaded) showFix(fly);
      else flyOnLoad ||= fly;
    },
    reveal: (p, cover) => revealAbove(map, [p.lng, p.lat], cover),
    fit: () => fit(true),
    zoom: () => map.getZoom(),
    center() {
      const c = map.getCenter();
      return [c.lng, c.lat];
    },
    px(id) {
      const s = findStop(cur.days, id)?.stop, c = cur.cands.find((p) => p.id === id);
      const ll: [number, number] | null = s ? [s.lng, s.lat] : c ? [c.lon, c.lat] : null;
      if (!ll) return null;
      const p = map.project(ll);
      return [p.x, p.y];
    },
    drawn: () => counts,
    places: () => saved.state(),
    settled: () => settledOf(map, loaded),
    destroy() {
      saved.destroy();
      removeMap(map);
    }
  };
}
