// The trip map's MapLibre side (docs/travel.md "Maps"): the lazy part TripMap.svelte imports only when it draws (never
// under drawOff()). MapLibre's CSP-safe path: its module worker is a file of our own origin (`?url`, under
// _app/immutable), so no blob: worker and no eval; the basemap's TileJSON and tiles fetched from OpenFreeMap
// (source.ts: the CSP's one third-party connect-src); labels in the app's font (fonts.ts). One map per TripMap;
// remove() drops its WebGL context.
import { AttributionControl, Map as GLMap, Marker, setWorkerUrl, type GeoJSONSource, type MapGeoJSONFeature } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url';
import { labelField } from './basemap.ts';
import { fontFaces, LOCAL_CJK } from './fonts.ts';
import { boundsOf, candidatesData, legsData, locData, stopsOf, type Fix } from './overlay.ts';
import { buildStyle, haloRadius, labelLayers, SRC } from './style.ts';
import { dayColor, nameOf, type Day, type Layer, type MapLeg, type MapPlace, type Locale } from './types.ts';

export interface EngineInput {
  places: MapPlace[];
  legs: MapLeg[];
  dayColors: string[];
  day: Day;
  selected: string | undefined;
  layers: Partial<Record<Layer, boolean>> | undefined;
  locale: Locale;
}

export interface Engine {
  update(i: EngineInput): void;
  /** The location dot (null: none); `fly` brings the map to it. */
  setFix(fix: Fix | null, fly: boolean): void;
  view(): { zoom: number; center: [number, number] };
  readonly map: GLMap;
  destroy(): void;
}

/** A 44 px hit round a pin's head (a candidate's circle): what a fingertip covers. */
const HIT = 22;
const reduced = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

export function createEngine(
  el: HTMLElement,
  input: EngineInput,
  tiles: string | undefined,
  on: { select(id: string): void; ready(): void; lost(on: boolean): void }
): Engine {
  setWorkerUrl(workerUrl);
  const style = buildStyle({ tiles, locale: input.locale, fontFaces: fontFaces() });
  const labels = labelLayers(style);
  const map = new GLMap({
    container: el,
    style,
    attributionControl: false,
    localIdeographFontFamily: LOCAL_CJK,
    dragRotate: false,
    pitchWithRotate: false,
    touchPitch: false,
    maxPitch: 0,
    minZoom: 4,
    maxZoom: 17.5,
    renderWorldCopies: false,
    fadeDuration: 120,
    validateStyle: import.meta.env.DEV,
    // the first view: the trip's (refit to the day once the style is in)
    bounds: boundsOf(input.places, input.legs, input.day) ?? undefined,
    fitBoundsOptions: { padding: 56, maxZoom: 15 }
  });
  map.touchZoomRotate.disableRotation();
  map.keyboard.disableRotation();
  map.addControl(new AttributionControl({ compact: false }), 'bottom-left');

  let cur = input;
  const markers = new Map<string, { m: Marker; el: HTMLButtonElement }>();
  let ready = false;

  const pinLabel = (p: MapPlace, locale: Locale) => `${p.i ?? ''} ${nameOf(p.name, locale)}`.trim();
  function pins(i: EngineInput): void {
    const want = new Set(stopsOf(i.places, i.day).map((p) => p.id));
    for (const [id, { m }] of markers) if (!want.has(id)) (m.remove(), markers.delete(id));
    for (const p of stopsOf(i.places, i.day)) {
      let k = markers.get(p.id);
      if (!k) {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'tm-pin';
        b.dataset.pin = p.id;
        b.dataset.sfx = 'tick';
        b.innerHTML = '<span class="tm-head"></span><span class="tm-tail"></span>';
        b.addEventListener('click', (e) => (e.stopPropagation(), on.select(p.id)));
        k = { m: new Marker({ element: b, anchor: 'bottom' }).setLngLat([p.lon, p.lat]).addTo(map), el: b };
        markers.set(p.id, k);
      }
      k.m.setLngLat([p.lon, p.lat]);
      k.el.style.setProperty('--pin', dayColor(i.dayColors, p.day ?? 1));
      k.el.querySelector('.tm-head')!.textContent = String(p.i ?? '');
      k.el.setAttribute('aria-label', pinLabel(p, i.locale));
      k.el.setAttribute('aria-pressed', String(p.id === i.selected));
      // the chosen pin over its neighbours; later stops over earlier ones
      k.el.style.zIndex = String(p.id === i.selected ? 1000 : (p.day ?? 0) * 50 + (p.i ?? 0));
    }
  }
  const src = (id: string) => map.getSource<GeoJSONSource>(id);
  function data(i: EngineInput): void {
    src(SRC.legs)?.setData(legsData(i.legs, i.dayColors, i.day) as never);
    src(SRC.cands)?.setData(candidatesData(i.places, i.layers, i.selected) as never);
  }
  function fit(i: EngineInput, animate: boolean): void {
    const b = boundsOf(i.places, i.legs, i.day);
    if (b) map.fitBounds(b, { padding: { top: 64, bottom: 64, left: 48, right: 48 }, maxZoom: 15, duration: animate && !reduced() ? 700 : 0 });
  }
  function bringTo(id: string): void {
    const p = cur.places.find((x) => x.id === id);
    if (!p) return;
    map.easeTo({ center: [p.lon, p.lat], zoom: Math.max(map.getZoom(), 13.5), duration: reduced() ? 0 : 600 });
  }

  pins(input);
  map.on('load', () => {
    ready = true;
    data(cur);
    fit(cur, false);
    if (cur.selected) bringTo(cur.selected);
    on.ready();
  });
  map.on('webglcontextlost', () => on.lost(true));
  map.on('webglcontextrestored', () => on.lost(false));
  // a candidate's circle: the nearest within a fingertip
  map.on('click', (e) => {
    if (!map.getLayer('cands')) return;
    const { x, y } = e.point;
    const hits: MapGeoJSONFeature[] = map.queryRenderedFeatures([[x - HIT, y - HIT], [x + HIT, y + HIT]], { layers: ['cands'] });
    const near = hits.map((f) => ({ f, d: (() => { const c = map.project((f.geometry as unknown as { coordinates: [number, number] }).coordinates); return Math.hypot(c.x - x, c.y - y); })() })).sort((a, b) => a.d - b.d)[0];
    const id = near?.f.properties?.id;
    if (typeof id === 'string') on.select(id);
  });

  return {
    map,
    update(i) {
      const prev = cur;
      cur = i;
      pins(i);
      if (i.locale !== prev.locale) for (const id of labels) map.getLayer(id) && map.setLayoutProperty(id, 'text-field', labelField(i.locale));
      if (!ready) return;
      data(i);
      if (i.day !== prev.day) fit(i, true);
      else if (i.selected && i.selected !== prev.selected) bringTo(i.selected);
    },
    setFix(fix, fly) {
      if (fix && map.getLayer('loc-halo')) map.setPaintProperty('loc-halo', 'circle-radius', haloRadius(fix.lat));
      src(SRC.loc)?.setData(locData(fix) as never);
      if (fix && fly) map.easeTo({ center: [fix.lon, fix.lat], zoom: Math.max(map.getZoom(), 14), duration: reduced() ? 0 : 600 });
    },
    view() {
      const c = map.getCenter();
      return { zoom: map.getZoom(), center: [c.lng, c.lat] };
    },
    destroy() {
      for (const { m } of markers.values()) m.remove();
      markers.clear();
      map.remove(); // loses its WebGL context (WEBGL_lose_context) and empties the container
    }
  };
}
