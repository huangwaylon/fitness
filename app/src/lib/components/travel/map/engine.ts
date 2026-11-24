// The trip map's MapLibre side (docs/travel.md "Maps"): the lazy part TripMap.svelte imports only when it draws (never
// under drawOff()). The map itself is map/gl.ts makeMap's (the shared options, MapLibre's CSP-safe worker and CSS, the
// tiles through the page); labels in the app's font (map/fonts.ts). Neither this chunk nor MapLibre's is precached; the
// service worker keeps them, and the tiles drawn, once a map has drawn (service-worker/caches.ts isMapLibre, tileKey).
// The saved places near the day: the shared layer (map/places/layer.ts) under the candidates, its taps and an empty
// map's through the map's one tap router. One map per TripMap; destroy() lets go of it all.
import { Marker, type GeoJSONSource } from 'maplibre-gl';
import { pick } from '../text.ts';
import { labelLayout } from '../../map/basemap.ts';
import { FONT, fontFaces } from '../../map/fonts.ts';
import { placesLayer, type MapPlace, type SavedState } from '../../map/places/layer.ts';
import { boundsOf, candidatesData, candidatesOf, keepoutData, layersOn, legsData, pinLabel, pinsOf, type Pin } from './overlay.ts';
import { buildStyle, KEEP_IMAGES, labelLayers, OVER_LABELS, SRC } from './style.ts';
import type { Fix } from '../../map/types.ts';
import { dayColor, type TripMapProps } from './types.ts';
import { fitBox, locDot, makeMap, removeMap, revealAbove, settledOf, styleLife, tapRouter, watchMode, type EngineMode } from '../../map/gl.ts';

type EngineInput = Omit<TripMapProps, 'onselect' | 'onplace' | 'onmiss'>;

export interface Engine {
  update(i: EngineInput): void;
  /** The location dot (null: none; `stale`: from before the page last hid, grey); `fly` brings the map to it. Kept
   *  till the style is in. */
  setFix(fix: Fix | null, fly: boolean, stale?: boolean): void;
  /** Back to the day's route. */
  fit(): void;
  center(): [number, number];
  /** The chosen square kept clear of its card over the map's bottom `cover` px (panned only if under it). */
  reveal(p: MapPlace, cover: number): void;
  /** The saved places' squares drawn, the chosen one's tag (the specs'). */
  places(): SavedState;
  /** At rest: the style in, no camera move (a fit's or a pin's flight, a pan), every tile asked for answered. */
  settled(): boolean;
  destroy(): void;
}

/** Pins whose heads come closer than this (px) are set side by side (one spot's stops are one pin already). */
const GAP = 4;

/** What a change of these redraws (by identity: the trip's arrays are the same objects till the trip changes). */
const pinsKey = (i: EngineInput) => [i.places, i.dayColors, i.day, i.selected, i.locale];
const dataKey = (i: EngineInput) => [i.places, i.legs, i.dayColors, i.day, i.selected, layersOn(i.layers).join()];
const same = (a: unknown[] | null, b: unknown[]) => !!a && a.every((x, k) => x === b[k]);

export function createEngine(el: HTMLElement, input: EngineInput, on: { select(id: string): void; mode(m: EngineMode): void; tile(): void; place(id: string): void; miss(): void }): Engine {
  const style = buildStyle(input.locale, fontFaces());
  const labels = labelLayers(style);
  // the first view: the day's (refit once the style is in); the world's middle for a trip with no stops
  const box = boundsOf(input.places, input.legs, input.day);
  const map = makeMap(el, { style, via: true, view: box ? { bounds: box } : { center: [0, 0], zoom: 4 } });

  let cur = input;
  let fix: Fix | null = null, stale = false;
  const markers = new Map<string, { m: Marker; el: HTMLButtonElement; pin: Pin; w: number }>();
  let loaded = false;
  // (the first basemap tile: TripMap's 「地図を読み込み中…」 till then)
  const loadedNow = watchMode(map, SRC.base, 'trip', on.mode, on.tile);
  const drawLoc = locDot(map, SRC.loc);
  /** The labels' locale as drawn (the style's, then each change's once the style is in). */
  let labelled = input.locale;

  let pinsAt: unknown[] | null = null, dataAt: unknown[] | null = null;
  function pins(i: EngineInput): void {
    const key = pinsKey(i);
    if (same(pinsAt, key)) return;
    pinsAt = key;
    const want = pinsOf(i.places, i.day);
    const ids = new Set(want.map((p) => p.id));
    for (const [id, { m }] of markers) if (!ids.has(id)) (m.remove(), markers.delete(id));
    for (const p of want) {
      let k = markers.get(p.id);
      if (!k) {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'tm-pin';
        b.dataset.pin = p.id;
        b.dataset.sfx = 'tick';
        b.innerHTML = '<span class="tm-tag" aria-hidden="true"></span><span class="tm-head"></span><span class="tm-tail"></span>';
        b.addEventListener('click', (e) => (e.stopPropagation(), on.select(p.id)));
        k = { m: new Marker({ element: b, anchor: 'bottom' }).setLngLat([p.lon, p.lat]).addTo(map), el: b, pin: p, w: 0 };
        markers.set(p.id, k);
      }
      if (k.pin.n !== p.n) k.w = 0;
      k.pin = p;
      const sel = !!i.selected && p.ids.includes(i.selected);
      k.el.style.setProperty('--pin', dayColor(i.dayColors, p.day));
      k.el.querySelector('.tm-head')!.textContent = p.n;
      k.el.querySelector('.tm-tag')!.textContent = pick(p.name, i.locale);
      k.el.setAttribute('aria-label', pinLabel(p, i.locale));
      k.el.setAttribute('aria-pressed', String(sel));
      // the chosen pin over its neighbours; later stops over earlier ones
      k.el.style.zIndex = String(sel ? 1000 : Number(p.n.split('·')[0]));
    }
    spread();
  }
  /** A pin's width: its head's, measured once (a layout read: never one per zoom frame), again when its number changes. */
  function width(k: { el: HTMLButtonElement; w: number }): number {
    k.w ||= k.el.querySelector<HTMLElement>('.tm-head')?.offsetWidth ?? 0;
    return (k.w || 30) + GAP;
  }
  /** Pins that would overlap on screen (a few hundred metres apart, zoomed out) side by side round their middle, so
   *  each stays tappable; apart again as the map zooms in. */
  function spread(): void {
    const ks = [...markers.values()].map((k) => ({ k, ...map.project([k.pin.lon, k.pin.lat]), w: width(k) }));
    const groups: (typeof ks)[] = [];
    for (const a of ks) {
      const near = groups.filter((g) => g.some((b) => Math.abs(a.x - b.x) < (a.w + b.w) / 2 && Math.abs(a.y - b.y) < 30));
      const g = near.flat().concat(a);
      for (const n of near) groups.splice(groups.indexOf(n), 1);
      groups.push(g);
    }
    for (const g of groups) {
      g.sort((a, b) => a.x - b.x);
      const total = g.reduce((s, a) => s + a.w, 0);
      let left = g.reduce((s, a) => s + a.x, 0) / g.length - total / 2;
      for (const a of g) {
        a.k.m.setOffset(g.length > 1 ? [left + a.w / 2 - a.x, 0] : [0, 0]);
        left += a.w;
      }
    }
  }
  const src = (id: string) => map.getSource<GeoJSONSource>(id);
  function data(i: EngineInput): void {
    const key = dataKey(i);
    if (same(dataAt, key)) return;
    dataAt = key;
    src(SRC.legs)?.setData(legsData(i.legs, i.dayColors, i.day) as never);
    const cands = candidatesOf(i.places, i.layers);
    src(SRC.cands)?.setData(candidatesData(i.places, i.layers, i.selected) as never);
    src(SRC.keep)?.setData(keepoutData(pinsOf(i.places, i.day), cands) as never);
  }
  function fit(i: EngineInput, animate: boolean): void {
    const b = boundsOf(i.places, i.legs, i.day);
    if (b) fitBox(map, b, { pad: { top: 64, bottom: 64, left: 48, right: 48 }, duration: animate ? 700 : 0 });
  }
  /** The basemap's labels in the reader's locale (a change before the style was in: once it is). */
  function relabel(i: EngineInput): void {
    if (i.locale === labelled) return;
    labelled = i.locale;
    const l = labelLayout(i.locale);
    for (const id of labels) (map.setLayoutProperty(id, 'text-field', l['text-field']), map.setLayoutProperty(id, 'text-max-width', l['text-max-width']));
  }
  function bringTo(id: string): void {
    const p = cur.places.find((x) => x.id === id);
    if (p) map.easeTo({ center: [p.lon, p.lat], zoom: Math.max(map.getZoom(), 13.5), duration: 600 });
  }
  function showFix(fly: boolean): void {
    drawLoc(fix, stale);
    if (fix && fly) map.easeTo({ center: [fix.lon, fix.lat], zoom: Math.max(map.getZoom(), 14), duration: 600 });
  }

  pins(input);
  let flyOnLoad = false;
  // drawn as soon as the style is in, the basemap's tiles still coming; the view fitted the first time only (a
  // context restored keeps the view)
  styleLife(map, (first) => {
    for (const [id, [w, h]] of Object.entries(KEEP_IMAGES)) if (!map.hasImage(id)) map.addImage(id, { width: w, height: h, data: new Uint8Array(w * h * 4) });
    loaded = true;
    relabel(cur);
    data(cur);
    if (first) {
      fit(cur, false);
      if (cur.selected) bringTo(cur.selected);
    }
    // a fix that came before the style was in
    if (fix) showFix(first && flyOnLoad);
    loadedNow();
  }, () => (loaded = false));
  map.on('zoom', spread);
  // a candidate's dot: the nearest within a fingertip (the map's one router: other layers' taps join it)
  tapRouter(map).add(['cands'], (f) => typeof f.properties?.id === 'string' && on.select(f.properties.id));
  tapRouter(map).miss(on.miss);
  // (the chosen one's name in the basemap's font)
  const saved = placesLayer(map, { before: OVER_LABELS, font: [FONT], onplace: on.place });
  let placesAt: EngineInput['savedPlaces'] | null = null;
  function places(i: EngineInput): void {
    if (i.savedPlaces === placesAt) return;
    const was = placesAt;
    placesAt = i.savedPlaces;
    const p = i.savedPlaces ?? { pts: [], shown: false, sel: null };
    if (!was || p.pts !== was.pts || p.shown !== was.shown) saved.set(p.pts, p.shown, false);
    if (!was || p.sel !== was.sel) saved.select(p.sel);
  }
  places(input);

  return {
    update(i) {
      const prev = cur;
      cur = i;
      pins(i);
      places(i);
      if (!loaded) return;
      relabel(i);
      data(i);
      if (i.day !== prev.day) fit(i, true);
      else if (i.selected && i.selected !== prev.selected) bringTo(i.selected);
    },
    setFix(f, fly, old = false) {
      ((fix = f), (stale = old));
      if (loaded) showFix(fly);
      else flyOnLoad ||= fly;
    },
    fit: () => loaded && fit(cur, true),
    center() {
      const c = map.getCenter();
      return [c.lng, c.lat];
    },
    reveal: (p, cover) => revealAbove(map, [p.lng, p.lat], cover),
    places: () => saved.state(),
    settled: () => settledOf(map, loaded),
    destroy() {
      for (const { m } of markers.values()) m.remove();
      markers.clear();
      saved.destroy();
      removeMap(map); // its context, its font faces (map/gl.ts)
    }
  };
}
