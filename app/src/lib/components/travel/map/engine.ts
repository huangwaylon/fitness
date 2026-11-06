// The trip map's MapLibre side (docs/travel.md "Maps"): the lazy part TripMap.svelte imports only when it draws (never
// under drawOff()). MapLibre's CSP-safe path: its worker is a file of our own origin (`?worker&url`, under
// _app/immutable/workers), so no blob: worker and no eval; the basemap's TileJSON and tiles fetched from OpenFreeMap
// (style.ts BASEMAP: the CSP's one third-party connect-src); labels in the app's font (fonts.ts). Neither this chunk
// nor its worker nor its CSS is precached (service-worker/caches.ts): the map is online only. One map per TripMap;
// remove() drops its WebGL context.
import { AttributionControl, Map as GLMap, Marker, getGlobalDispatcher, setWorkerUrl, type GeoJSONSource, type MapGeoJSONFeature } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
// (bundled as our own worker chunk, a .js: a raw .mjs is served as application/octet-stream by some hosts, which a
// module worker under nosniff refuses)
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import { pick } from '../text.ts';
import { labelLayout } from './basemap.ts';
import { fontFaces } from './fonts.ts';
import { boundsOf, candidatesData, candidatesOf, keepoutData, legsData, locData, pinLabel, pinsOf, type Fix, type Pin } from './overlay.ts';
import { buildStyle, haloRadius, KEEP_IMAGES, labelLayers, SRC } from './style.ts';
import { dayColor, type TripMapProps } from './types.ts';

export type EngineInput = Omit<TripMapProps, 'onselect'>;

export interface Engine {
  update(i: EngineInput): void;
  /** The location dot (null: none); `fly` brings the map to it. Kept till the map has loaded. */
  setFix(fix: Fix | null, fly: boolean): void;
  /** Back to the day's route. */
  fit(): void;
  center(): [number, number];
  /** A camera move (a fit's or a pin's flight, a pan) is under way. */
  moving(): boolean;
  destroy(): void;
}

/** What the map shows: 'ready' (the basemap's tiles coming), 'offline' (none came: the route alone), 'lost' (no WebGL
 *  context). Only once the map has loaded. */
export type EngineMode = 'ready' | 'offline' | 'lost';

/** A 44 px hit round a candidate's dot: what a fingertip covers. */
const HIT = 22;
/** Pins whose heads come closer than this (px) are set side by side (one spot's stops are one pin already). */
const GAP = 4;
const reduced = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

export function createEngine(el: HTMLElement, input: EngineInput, on: { select(id: string): void; mode(m: EngineMode): void }): Engine {
  setWorkerUrl(workerUrl);
  const style = buildStyle(input.locale, fontFaces());
  const labels = labelLayers(style);
  const map = new GLMap({
    container: el,
    style,
    attributionControl: false,
    dragRotate: false,
    pitchWithRotate: false,
    touchPitch: false,
    maxPitch: 0,
    minZoom: 4,
    maxZoom: 17.5,
    renderWorldCopies: false,
    fadeDuration: 120,
    validateStyle: import.meta.env.DEV,
    // the first view: the day's (refit once the style is in)
    bounds: boundsOf(input.places, input.legs, input.day) ?? undefined,
    fitBoundsOptions: { padding: 56, maxZoom: 15 }
  });
  map.touchZoomRotate.disableRotation();
  map.keyboard.disableRotation();
  map.addControl(new AttributionControl({ compact: false }), 'bottom-left');

  let cur = input;
  let fix: Fix | null = null;
  const markers = new Map<string, { m: Marker; el: HTMLButtonElement; pin: Pin }>();
  let loaded = false, lost = false;
  /** The basemap: no tile yet, a tile in since the last failure, or failing (offline, the TileJSON or tiles refused). */
  let base: 'wait' | 'ok' | 'down' = 'wait';
  const report = () => loaded && on.mode(lost ? 'lost' : base === 'down' ? 'offline' : 'ready');

  function pins(i: EngineInput): void {
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
        k = { m: new Marker({ element: b, anchor: 'bottom' }).setLngLat([p.lon, p.lat]).addTo(map), el: b, pin: p };
        markers.set(p.id, k);
      }
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
  /** Pins that would overlap on screen (a few hundred metres apart, zoomed out) side by side round their middle, so
   *  each stays tappable; apart again as the map zooms in. */
  function spread(): void {
    const ks = [...markers.values()].map((k) => ({ k, ...map.project([k.pin.lon, k.pin.lat]), w: (k.el.querySelector<HTMLElement>('.tm-head')?.offsetWidth || 30) + GAP }));
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
    src(SRC.legs)?.setData(legsData(i.legs, i.dayColors, i.day) as never);
    const cands = candidatesOf(i.places, i.layers);
    src(SRC.cands)?.setData(candidatesData(i.places, i.layers, i.selected) as never);
    src(SRC.keep)?.setData(keepoutData(pinsOf(i.places, i.day), cands) as never);
  }
  function fit(i: EngineInput, animate: boolean): void {
    const b = boundsOf(i.places, i.legs, i.day);
    if (b) map.fitBounds(b, { padding: { top: 64, bottom: 64, left: 48, right: 48 }, maxZoom: 15, duration: animate && !reduced() ? 700 : 0 });
  }
  function bringTo(id: string): void {
    const p = cur.places.find((x) => x.id === id);
    if (p) map.easeTo({ center: [p.lon, p.lat], zoom: Math.max(map.getZoom(), 13.5), duration: reduced() ? 0 : 600 });
  }
  function showFix(fly: boolean): void {
    if (fix) map.setPaintProperty('loc-halo', 'circle-radius', haloRadius(fix.lat));
    src(SRC.loc)?.setData(locData(fix) as never);
    if (fix && fly) map.easeTo({ center: [fix.lon, fix.lat], zoom: Math.max(map.getZoom(), 14), duration: reduced() ? 0 : 600 });
  }

  pins(input);
  let flyOnLoad = false;
  map.on('load', () => {
    for (const [id, [w, h]] of Object.entries(KEEP_IMAGES)) if (!map.hasImage(id)) map.addImage(id, { width: w, height: h, data: new Uint8Array(w * h * 4) });
    loaded = true;
    data(cur);
    fit(cur, false);
    if (cur.selected) bringTo(cur.selected);
    // a fix that came before the style was in
    if (fix) showFix(flyOnLoad);
    report();
  });
  map.on('zoom', spread);
  map.on('data', (e) => {
    const d = e as { dataType?: string; sourceId?: string; tile?: unknown };
    if (d.dataType === 'source' && d.sourceId === SRC.base && d.tile && base !== 'ok') ((base = 'ok'), report());
  });
  // the basemap failing is shown (TripMap's notice), not logged; anything else is MapLibre's console error as before
  map.on('error', (e) => {
    if ((e as { sourceId?: string }).sourceId === SRC.base) {
      if (base !== 'down') ((base = 'down'), report());
    } else console.error(e.error);
  });
  map.on('webglcontextlost', () => ((lost = true), report()));
  map.on('webglcontextrestored', () => ((lost = false), report()));
  // a candidate's dot: the nearest within a fingertip
  map.on('click', (e) => {
    if (!map.getLayer('cands')) return;
    const { x, y } = e.point;
    const hits: MapGeoJSONFeature[] = map.queryRenderedFeatures([[x - HIT, y - HIT], [x + HIT, y + HIT]], { layers: ['cands'] });
    const d = (f: MapGeoJSONFeature) => {
      const c = map.project((f.geometry as unknown as { coordinates: [number, number] }).coordinates);
      return Math.hypot(c.x - x, c.y - y);
    };
    const id = hits.sort((a, b) => d(a) - d(b))[0]?.properties?.id;
    if (typeof id === 'string') on.select(id);
  });

  return {
    update(i) {
      const prev = cur;
      cur = i;
      pins(i);
      if (i.locale !== prev.locale) {
        const l = labelLayout(i.locale);
        for (const id of labels) (map.setLayoutProperty(id, 'text-field', l['text-field']), map.setLayoutProperty(id, 'text-max-width', l['text-max-width']));
      }
      if (!loaded) return;
      data(i);
      if (i.day !== prev.day) fit(i, true);
      else if (i.selected && i.selected !== prev.selected) bringTo(i.selected);
    },
    setFix(f, fly) {
      fix = f;
      if (loaded) showFix(fly);
      else flyOnLoad ||= fly;
    },
    fit: () => loaded && fit(cur, true),
    center() {
      const c = map.getCenter();
      return [c.lng, c.lat];
    },
    moving: () => map.isMoving(),
    destroy() {
      for (const { m } of markers.values()) m.remove();
      markers.clear();
      map.remove(); // loses its WebGL context (WEBGL_lose_context) and empties the container
      // The last map's remove() ends MapLibre's workers by aborting its page-wide dispatcher's controller with an Error
      // made inside remove(): until the next map, that Error's unformatted stack held remove()'s receivers, this whole
      // map and its context (leaks.spec). Reading its stack formats it, which lets the frames go.
      void ((getGlobalDispatcher() as unknown as { workersAbortController?: AbortController }).workersAbortController?.signal.reason as Error | undefined)?.stack;
    }
  };
}
